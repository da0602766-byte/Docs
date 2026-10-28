# Testes usam somente um banco descartável; nenhuma credencial fictícia vai para a aplicação.
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path
import secrets
import subprocess
import sys
import unittest
from uuid import uuid4

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient
import jwt
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

import banco as banco
import configuracao as configuracao
from main import app
from repositorios import pesagem as repositorio_pesagem
from seguranca import gerar_hash_senha, verificar_senha, validar_token_acesso


# O banco exclusivo permite verificar migrations, persistência e autorização sem dados reais.
class TesteBanco(unittest.TestCase):
    # Cria a estrutura antiga e migra um usuário sem credenciais para verificar a preservação.
    @classmethod
    def setUpClass(cls):
        if banco.engine.dialect.name != "mysql":
            raise RuntimeError("Esta suíte exige MySQL: defina DATABASE_URL vazio no processo. Para PostgreSQL, use teste_supabase.")
        cls.nome_banco = "ciclo_certo_teste_" + uuid4().hex
        cls.engine_original = banco.engine
        cls.engine_administrativo = create_engine(banco.endereco_banco.set(database=None), connect_args={"use_pure": True})
        with cls.engine_administrativo.begin() as conexao:
            conexao.execute(text(f"CREATE DATABASE `{cls.nome_banco}` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs"))
        cls.engine = create_engine(banco.endereco_banco.set(database=cls.nome_banco), pool_pre_ping=True, connect_args={"use_pure": True})
        cls.Sessao = sessionmaker(bind=cls.engine, expire_on_commit=False)
        banco.engine = cls.engine
        cls.configuracao_alembic = Config(str(Path(__file__).with_name("alembic.ini")))
        command.upgrade(cls.configuracao_alembic, "0001_estrutura")
        with cls.engine.begin() as conexao:
            conexao.execute(text("INSERT INTO usuarios (nome, tipo) VALUES ('Usuário anterior', 'morador')"))
        command.upgrade(cls.configuracao_alembic, "head")
        banco.engine = cls.engine_original

        # Substitui apenas a dependência das requisições deste processo de teste.
        def obter_sessao_teste():
            with cls.Sessao() as sessao:
                yield sessao

        app.dependency_overrides[banco.obter_sessao] = obter_sessao_teste
        cls.cliente = TestClient(app)

    # Encerra todas as conexões antes de remover somente o banco criado por esta execução.
    @classmethod
    def tearDownClass(cls):
        cls.cliente.close()
        app.dependency_overrides.clear()
        cls.engine.dispose()
        banco.engine = cls.engine_original
        if cls.nome_banco.startswith("ciclo_certo_teste_") and cls.nome_banco != configuracao.mysql_banco:
            with cls.engine_administrativo.begin() as conexao:
                conexao.execute(text(f"DROP DATABASE `{cls.nome_banco}`"))
        cls.engine_administrativo.dispose()

    # Cada caso usa contas próprias e aleatórias apenas no banco temporário.
    def setUp(self):
        self.morador, self.email, self.senha, self.token = self.cadastrar_e_entrar("morador")
        self.outro, self.outro_email, self.outro_senha, self.outro_token = self.cadastrar_e_entrar("morador")
        self.cooperativa, _, _, self.token_cooperativa = self.cadastrar_e_entrar("cooperativa")
        self.cabecalho = {"Authorization": "Bearer " + self.token}
        self.cabecalho_outro = {"Authorization": "Bearer " + self.outro_token}
        self.cabecalho_cooperativa = {"Authorization": "Bearer " + self.token_cooperativa}

    # Confere os contratos de cadastro e login e nunca imprime senhas ou tokens.
    def cadastrar_e_entrar(self, tipo):
        email = uuid4().hex + "@example.org"
        senha = secrets.token_urlsafe(16)
        resposta = self.cliente.post("/usuarios", json={"nome": "Conta de teste", "email": email, "senha": senha, "tipo": tipo})
        self.assertEqual(resposta.status_code, 201)
        self.assertNotIn("senha", resposta.json())
        self.assertNotIn("senha_hash", resposta.json())
        login = self.cliente.post("/login", data={"username": email, "password": senha})
        self.assertEqual(login.status_code, 200)
        self.assertEqual(login.json()["token_type"], "bearer")
        return resposta.json(), email, senha, login.json()["access_token"]

    # Prepara uma coleta sem informar qualquer campo de identificação do morador.
    def agendar(self, cabecalho=None, **campos):
        dados = {"endereco": "Rua de teste, número 42", "dia": "2026-10-07", "materiais_informados": ["papel", "plástico"]}
        resposta = self.cliente.post("/coletas", json={**dados, **campos}, headers=cabecalho or self.cabecalho)
        self.assertEqual(resposta.status_code, 201)
        return resposta.json()

    # O hash muda com o sal e permite reconhecer somente a senha correta.
    def test_hash_argon2(self):
        primeiro = gerar_hash_senha(self.senha)
        segundo = gerar_hash_senha(self.senha)
        self.assertTrue(primeiro.startswith("$argon2id$"))
        self.assertNotEqual(primeiro, segundo)
        self.assertTrue(verificar_senha(self.senha, primeiro))
        self.assertFalse(verificar_senha(self.senha + "x", primeiro))
        self.assertFalse(verificar_senha(self.senha, None))
        self.assertFalse(verificar_senha(self.senha, "hash-invalido"))

    # O e-mail identifica uma única pessoa, inclusive quando muda apenas a capitalização.
    def test_email_duplicado(self):
        resposta = self.cliente.post("/usuarios", json={"nome": "Outra conta", "email": self.email.upper(), "senha": self.senha, "tipo": "morador"})
        self.assertEqual(resposta.status_code, 409)

    # Um erro em outro campo não pode incluir a senha recebida no contexto da resposta.
    def test_validacao_nao_expoe_senha(self):
        resposta = self.cliente.post("/usuarios", json={"email": self.email, "senha": self.senha, "tipo": "morador"})
        self.assertEqual(resposta.status_code, 422)
        self.assertNotIn(self.senha, resposta.text)
        resposta = self.cliente.post("/usuarios", json={"nome": "Nome", "email": self.email, "senha": "curta", "tipo": "morador"})
        self.assertEqual(resposta.status_code, 422)
        self.assertNotIn('"input":"curta"', resposta.text)

    # A API dá a mesma resposta a senha incorreta e e-mail inexistente.
    def test_login_invalido(self):
        for email, senha in [(self.email, self.senha + "x"), (uuid4().hex + "@example.org", self.senha)]:
            resposta = self.cliente.post("/login", data={"username": email, "password": senha})
            self.assertEqual(resposta.status_code, 401)
            self.assertEqual(resposta.json()["detail"], "E-mail ou senha incorretos.")

    # A migration mantém os usuários antigos sem lhes atribuir uma senha de demonstração.
    def test_migracao_preserva_usuario_antigo(self):
        with self.engine.connect() as conexao:
            antigo = conexao.execute(text("SELECT nome, tipo, email, senha_hash FROM usuarios WHERE id = 1")).one()
            versao = conexao.execute(text("SELECT version_num FROM alembic_version")).scalar_one()
        self.assertEqual(tuple(antigo), ("Usuário anterior", "morador", None, None))
        self.assertEqual(versao, "0003_limites_cartilha")

    # O token identifica o próprio perfil e cada rota da cartilha exige autenticação.
    def test_usuario_atual_e_rotas_sem_token(self):
        resposta = self.cliente.get("/usuarios/eu", headers=self.cabecalho)
        self.assertEqual(resposta.json(), self.morador)
        for caminho in ["/usuarios/eu", "/usuarios", "/coletas", "/coletas/1", "/coletas/1/pesagens"]:
            self.assertEqual(self.cliente.get(caminho).status_code, 401)
        self.assertEqual(self.cliente.post("/coletas", json={}).status_code, 401)
        self.assertEqual(self.cliente.post("/coletas/1/pesagens", json={}).status_code, 401)

    # Token vencido, algoritmo diferente, assinatura alterada e dados ausentes são recusados.
    def test_tokens_invalidos(self):
        validade = datetime.now(timezone.utc) + timedelta(hours=1)
        dados = {"sub": str(self.morador["id"]), "exp": validade}
        assinatura = self.token.split(".")
        assinatura[2] = ("A" if assinatura[2][0] != "A" else "B") + assinatura[2][1:]
        tokens = [
            ".".join(assinatura),
            jwt.encode({**dados, "exp": datetime.now(timezone.utc) - timedelta(seconds=1)}, configuracao.chave_do_token, algorithm="HS256"),
            jwt.encode(dados, configuracao.chave_do_token, algorithm="HS512"),
            jwt.encode({"sub": str(self.morador["id"])}, configuracao.chave_do_token, algorithm="HS256"),
            jwt.encode({"exp": validade}, configuracao.chave_do_token, algorithm="HS256"),
            jwt.encode({**dados, "sub": "nao-e-id"}, configuracao.chave_do_token, algorithm="HS256"),
        ]
        for token in tokens:
            self.assertIsNone(validar_token_acesso(token))
            resposta = self.cliente.get("/usuarios/eu", headers={"Authorization": "Bearer " + token})
            self.assertEqual(resposta.status_code, 401)

    # O número enviado pelo cliente nunca substitui o dono identificado pelo token.
    def test_dono_vem_do_token(self):
        coleta = self.agendar(morador_id=self.outro["id"])
        self.assertEqual(coleta["morador_id"], self.morador["id"])
        esquema = app.openapi()["components"]["schemas"]["ColetaEntrada"]
        self.assertNotIn("morador_id", esquema["properties"])

    # Lista, detalhe e histórico impedem que um morador consulte o outro.
    def test_isolamento_entre_moradores(self):
        coleta = self.agendar()
        outra = self.agendar(self.cabecalho_outro)
        lista = self.cliente.get("/coletas", headers=self.cabecalho).json()
        self.assertEqual([item["id"] for item in lista], [coleta["id"]])
        for caminho in [f"/coletas/{outra['id']}", f"/coletas/{outra['id']}/pesagens"]:
            self.assertEqual(self.cliente.get(caminho, headers=self.cabecalho).status_code, 403)
        self.assertEqual(self.cliente.get("/coletas", params={"morador_id": self.outro["id"]}, headers=self.cabecalho).status_code, 403)

    # O perfil errado não pode gravar e a cooperativa mantém os filtros da rota.
    def test_perfis_e_filtros(self):
        coleta = self.agendar()
        self.assertEqual(self.cliente.post("/coletas", json={"endereco": "Rua de teste, 42", "dia": "2026-10-07", "materiais_informados": ["papel"]}, headers=self.cabecalho_cooperativa).status_code, 403)
        self.assertEqual(self.cliente.post(f"/coletas/{coleta['id']}/pesagens", json={"material": "papel", "quilos": 1}, headers=self.cabecalho).status_code, 403)
        self.assertEqual(self.cliente.get("/usuarios", headers=self.cabecalho).status_code, 403)
        self.assertEqual(self.cliente.get("/usuarios", headers=self.cabecalho_cooperativa).status_code, 200)
        filtradas = self.cliente.get("/coletas", params={"dia": "2026-10-07", "morador_id": self.morador["id"]}, headers=self.cabecalho_cooperativa).json()
        self.assertEqual([item["id"] for item in filtradas], [coleta["id"]])
        self.assertEqual(self.cliente.get("/coletas", params={"dia": "2026-10-08"}, headers=self.cabecalho).json(), [])

    # Os quatro multiplicadores e a mudança de situação permanecem iguais à cartilha.
    def test_pontuacao_e_validacoes(self):
        coleta = self.agendar()
        caminho = f"/coletas/{coleta['id']}/pesagens"
        total = 0
        for material, quilos, pontos in [("papel", 1.25, 1.25), ("vidro", 2.5, 2.5), ("plástico", 3, 6), ("metal", 4, 16)]:
            resposta = self.cliente.post(caminho, json={"material": material, "quilos": quilos}, headers=self.cabecalho_cooperativa)
            self.assertEqual(resposta.status_code, 201)
            self.assertEqual(resposta.json()["pontos"], pontos)
            total += pontos
            atual = self.cliente.get(f"/coletas/{coleta['id']}", headers=self.cabecalho).json()
            self.assertEqual(atual["situacao"], "coletada")
            self.assertAlmostEqual(atual["pontos"], total)
        self.assertEqual(len(self.cliente.get(caminho, headers=self.cabecalho).json()), 4)
        for peso in [0, -1]:
            self.assertEqual(self.cliente.post(caminho, json={"material": "papel", "quilos": peso}, headers=self.cabecalho_cooperativa).status_code, 422)

    # Exercita a nova migration e os pesos antes recusados, sem mudar a pontuação.
    def test_pesos_sem_teto_ou_precisao_inventada(self):
        coleta = self.agendar(materiais_informados=["papel"] * 7)
        self.assertEqual(coleta["situacao"], "agendada")
        self.assertEqual(coleta["pontos"], 0)
        caminho = f"/coletas/{coleta['id']}/pesagens"
        total = 0
        for material, peso, pontos in [("metal", 1001, 4004), ("papel", 0.001, 0.001)]:
            resposta = self.cliente.post(caminho, json={"material": material, "quilos": peso}, headers=self.cabecalho_cooperativa)
            self.assertEqual(resposta.status_code, 201)
            self.assertAlmostEqual(resposta.json()["pontos"], pontos)
            total += pontos
        atual = self.cliente.get(f"/coletas/{coleta['id']}", headers=self.cabecalho).json()
        self.assertEqual(atual["situacao"], "coletada")
        self.assertAlmostEqual(atual["pontos"], total)

    # Recusa valores não representáveis sem salvar pesagens parciais ou contaminar o total.
    def test_valores_numericos_invalidos(self):
        coleta = self.agendar()
        caminho = f"/coletas/{coleta['id']}/pesagens"
        for peso in ["NaN", "Infinity", "-Infinity", 1e308]:
            resposta = self.cliente.post(caminho, json={"material": "metal", "quilos": peso}, headers=self.cabecalho_cooperativa)
            self.assertEqual(resposta.status_code, 422)
        self.assertEqual(self.cliente.get(caminho, headers=self.cabecalho).json(), [])
        # Dois valores individualmente finitos também podem estourar o total acumulado.
        primeira = self.cliente.post(caminho, json={"material": "papel", "quilos": 1e308}, headers=self.cabecalho_cooperativa)
        self.assertEqual(primeira.status_code, 201)
        segunda = self.cliente.post(caminho, json={"material": "papel", "quilos": 1e308}, headers=self.cabecalho_cooperativa)
        self.assertEqual(segunda.status_code, 422)
        self.assertEqual(len(self.cliente.get(caminho, headers=self.cabecalho).json()), 1)
        atual = self.cliente.get(f"/coletas/{coleta['id']}", headers=self.cabecalho).json()
        self.assertEqual(atual["pontos"], 1e308)

    # Uma falha na atualização da coleta deve desfazer também a pesagem inserida.
    def test_transacao_desfaz_gravacao_incompleta(self):
        coleta = self.agendar()
        with self.Sessao() as sessao:
            with self.assertRaises(SQLAlchemyError):
                repositorio_pesagem.salvar(sessao, {"coleta_id": coleta["id"], "material": "papel", "quilos": 2, "pontos": 2}, "situacao_invalida")
            sessao.rollback()
        self.assertEqual(self.cliente.get(f"/coletas/{coleta['id']}/pesagens", headers=self.cabecalho).json(), [])
        self.assertEqual(self.cliente.get(f"/coletas/{coleta['id']}", headers=self.cabecalho).json()["pontos"], 0)

    # Cada requisição simultânea usa uma sessão diferente e não pode perder pontos.
    def test_pesagens_simultaneas(self):
        coleta = self.agendar()
        caminho = f"/coletas/{coleta['id']}/pesagens"

        # Um cliente independente representa cada pedido concorrente.
        def enviar(indice):
            with TestClient(app) as cliente:
                return cliente.post(caminho, json={"material": "metal", "quilos": 0.5}, headers=self.cabecalho_cooperativa)

        with ThreadPoolExecutor(max_workers=4) as executor:
            respostas = list(executor.map(enviar, range(8)))
        self.assertTrue(all(resposta.status_code == 201 for resposta in respostas))
        self.assertEqual(self.cliente.get(f"/coletas/{coleta['id']}", headers=self.cabecalho).json()["pontos"], 16)

    # Outro processo lê o registro pelo repositório, provando que ele não ficou em memória.
    def test_persistencia_em_outro_processo(self):
        coleta = self.agendar()
        programa = (
            "import configuracao; "
            f"configuracao.mysql_banco = {self.nome_banco!r}; "
            "from banco import Sessao; from repositorios import coleta; "
            f"sessao=Sessao(); print(coleta.buscar_por_id(sessao,{coleta['id']}).morador_id); sessao.close()"
        )
        resultado = subprocess.run([sys.executable, "-c", programa], capture_output=True, text=True, check=True)
        self.assertEqual(int(resultado.stdout.strip()), self.morador["id"])

    # Caminhos inexistentes continuam retornando 404 para usuários autorizados.
    def test_ausencias(self):
        for caminho in ["/coletas/2147483647", "/coletas/2147483647/pesagens"]:
            self.assertEqual(self.cliente.get(caminho, headers=self.cabecalho).status_code, 404)
        self.assertEqual(self.cliente.post("/coletas/2147483647/pesagens", json={"material": "papel", "quilos": 1}, headers=self.cabecalho_cooperativa).status_code, 404)


# Executa a verificação também quando o arquivo é aberto diretamente pelo Python.
if __name__ == "__main__":
    unittest.main()
