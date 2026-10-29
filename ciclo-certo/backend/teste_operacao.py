"""Integração HTTP e concorrência em PostgreSQL local, nunca no banco de produção."""
import os
import json
import secrets
from pathlib import Path
from uuid import uuid4
from concurrent.futures import ThreadPoolExecutor
from datetime import timedelta
from io import BytesIO
import base64
import unittest

RAIZ = Path(__file__).resolve().parent.parent
ACESSO = json.loads((RAIZ / ".test-infra" / "acesso.json").read_text(encoding="utf-8-sig"))
# Configuração de infraestrutura de teste; valores não são credenciais de contas reais.
os.environ["DATABASE_URL"] = f"postgresql+psycopg://postgres:{ACESSO['password']}@127.0.0.1:{ACESSO['port']}/ciclo_certo_teste_local"
os.environ["CHAVE_DO_TOKEN"] = secrets.token_hex(32)
os.environ["ORIGEM_FRONTEND"] = "http://127.0.0.1:5175"
os.environ.pop("VERCEL", None)
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
from banco import obter_sessao
from main import app
from servicos.operacao import local


def imagem(assinatura=False, vazia=False):
    img = Image.new("RGB", (300, 100), "white" if assinatura else "green")
    if assinatura and not vazia:
        ImageDraw.Draw(img).line([(20, 70), (50, 15), (90, 65), (160, 30), (270, 55)], fill="black", width=4)
    destino = BytesIO()
    img.save(destino, format="PNG")
    return "data:image/png;base64," + base64.b64encode(destino.getvalue()).decode()


class TesteOperacao(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.esquema = "ciclo_certo_teste_" + uuid4().hex
        cls.admin = create_engine(os.environ["DATABASE_URL"])
        with cls.admin.begin() as c:
            assert c.scalar(text("select current_database()")) == "ciclo_certo_teste_local"
            c.execute(text(f"CREATE SCHEMA {cls.esquema}"))
            baseline = (RAIZ / "backend/supabase/estrutura.sql").read_text(encoding="utf-8")
            c.exec_driver_sql(baseline.replace("public", cls.esquema))
            c.exec_driver_sql("INSERT INTO usuarios(nome,tipo) VALUES ('Conta histórica','morador'); INSERT INTO coletas(morador_id,endereco,dia,materiais_informados,situacao,pontos) VALUES (1,'Rua histórica, 123','2020-01-01','[\"papel\"]','coletada',42)")
            for arquivo in sorted((RAIZ / "supabase/migrations").glob("*.sql")):
                c.exec_driver_sql(arquivo.read_text(encoding="utf-8").replace("public", cls.esquema))
        cls.engine = create_engine(os.environ["DATABASE_URL"], pool_size=8)

        @event.listens_for(cls.engine, "connect")
        def configurar(dbapi, registro):
            dbapi.autocommit = True
            with dbapi.cursor() as c:
                c.execute(f"SET search_path TO {cls.esquema}")
                c.execute("SET ROLE ciclo_certo_backend")
            dbapi.autocommit = False

        cls.Sessao = sessionmaker(bind=cls.engine, expire_on_commit=False, autoflush=False)

        def sessao():
            with cls.Sessao() as s:
                yield s

        app.dependency_overrides[obter_sessao] = sessao
        cls.cliente = TestClient(app)

    @classmethod
    def tearDownClass(cls):
        cls.cliente.close()
        app.dependency_overrides.clear()
        cls.engine.dispose()
        with cls.admin.begin() as c:
            assert c.scalar(text("select current_database()")) == "ciclo_certo_teste_local"
            assert cls.esquema.startswith("ciclo_certo_teste_") and len(cls.esquema) == 50
            c.execute(text(f"DROP SCHEMA {cls.esquema} CASCADE"))
        cls.admin.dispose()

    def setUp(self):
        self.morador, self.m = self.conta("morador")
        self.coop, self.c = self.conta("cooperativa")
        self.outro, self.o = self.conta("morador")
        self.segundo, self.s = self.conta("cooperativa")
        self.dia = local().date() + timedelta(days=10 + secrets.randbelow(20000))
        if self.dia.weekday() == 6:
            self.dia += timedelta(days=1)

    def conta(self, tipo):
        email = uuid4().hex + "@example.org"
        r = self.cliente.post("/usuarios", json=dict(nome="Pessoa Teste", email=email, senha="SenhaTeste123!", tipo=tipo))
        self.assertEqual(r.status_code, 201, r.text)
        login = self.cliente.post("/login", data=dict(username=email, password="SenhaTeste123!"))
        self.assertEqual(login.status_code, 200, login.text)
        return r.json(), {"Authorization": "Bearer " + login.json()["access_token"]}

    def post(self, caminho, dados, headers=None, esperado=200):
        r = self.cliente.post(caminho, json=dados, headers=headers or self.c)
        self.assertEqual(r.status_code, esperado, r.text)
        return r.json()

    def agendar(self):
        return self.post("/coletas", dict(endereco="Rua das Flores, 123", dia=str(self.dia), hora="08:00", materiais_informados=["Cobre", "Vidro transparente"]), self.m, 201)

    def assumir(self):
        coleta = self.agendar()
        return self.post(f"/coletas/{coleta['id']}/assumir", {"confirmar": True})

    def pesar(self):
        coleta = self.assumir()
        return self.post(f"/coletas/{coleta['id']}/pesagens", dict(material="cobre", quilos="2"), esperado=201)

    def finalizar(self):
        coleta = self.pesar()
        return self.post(f"/coletas/{coleta['id']}/finalizar", self.confirmacao(coleta))

    def confirmacao(self, coleta):
        return dict(versao=coleta["versao"], foto=imagem(), assinatura=imagem(True), nome_signatario="Pessoa Teste", aceite=True)

    def test_fluxo_completo_e_idempotencia(self):
        coleta = self.finalizar()
        self.assertEqual(coleta["pontos"], 0)
        self.assertEqual(coleta["pontos_previstos"], 3000)
        avisos = self.cliente.get("/notificacoes", headers=self.m).json()
        self.assertEqual(len(avisos), 1)
        self.post(f"/coletas/{coleta['id']}/solicitar-avaliacao", {})
        self.assertEqual(len(self.cliente.get("/notificacoes", headers=self.m).json()), 1)
        r = self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 1}, self.m)
        self.assertTrue(r["creditada"])
        self.assertFalse(self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 5}, self.m)["creditada"])
        carteira = self.cliente.get("/carteira", headers=self.m).json()
        self.assertEqual(carteira["centavos"], 3000)
        self.assertEqual(len(carteira["movimentos"]), 1)

    def test_peso_editavel_apenas_pelo_responsavel(self):
        coleta = self.pesar()
        peso = self.cliente.get(f"/coletas/{coleta['id']}/pesagens", headers=self.c).json()[0]
        rota = f"/coletas/{coleta['id']}/pesagens/{peso['id']}"
        self.assertEqual(self.cliente.put(rota, json=dict(material="pet", quilos=3), headers=self.s).status_code, 403)
        r = self.cliente.put(rota, json=dict(material="pet", quilos=3), headers=self.c)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["pontos_previstos"], 525)
        self.post(f"/coletas/{coleta['id']}/finalizar", self.confirmacao(coleta), esperado=409)
        atual = r.json()
        self.post(f"/coletas/{coleta['id']}/finalizar", self.confirmacao(atual))
        self.assertEqual(self.cliente.put(rota, json=dict(material="cobre", quilos=1), headers=self.c).status_code, 409)
        self.assertEqual(self.cliente.delete(rota, headers=self.c).status_code, 409)

    def test_cancelamento_avisa_e_reabre_vaga(self):
        self.cliente.put("/agenda", json=dict(dia=str(self.dia), hora="08:00", capacidade=1), headers=self.c)
        coleta = self.assumir()
        r = self.cliente.post("/coletas", json=dict(endereco="Rua das Flores, 123", dia=str(self.dia), hora="08:00", materiais_informados=["pet"]), headers=self.m)
        self.assertEqual(r.status_code, 409)
        motivo = "Morador ausente no horário combinado."
        self.post(f"/coletas/{coleta['id']}/cancelar", {"motivo": motivo})
        avisos = self.cliente.get("/notificacoes", headers=self.m).json()
        self.assertIn(motivo, avisos[0]["mensagem"])
        self.agendar()
        self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 5}, self.m, 409)

    def test_foto_assinatura_nome_e_pesos_obrigatorios(self):
        coleta = self.assumir()
        self.post(f"/coletas/{coleta['id']}/finalizar", self.confirmacao(coleta), esperado=409)
        coleta = self.post(f"/coletas/{coleta['id']}/pesagens", dict(material="aluminio", quilos="1"), esperado=201)
        for alteracao in ({"foto": "invalida"}, {"assinatura": imagem(True, True)}, {"nome_signatario": "Outro nome"}, {"aceite": False}):
            self.post(f"/coletas/{coleta['id']}/finalizar", {**self.confirmacao(coleta), **alteracao}, esperado=422)
        self.assertEqual(self.cliente.get(f"/coletas/{coleta['id']}", headers=self.m).json()["situacao"], "em_coleta")

    def test_isolamento_de_contas_e_comprovantes(self):
        coleta = self.finalizar()
        for rota in (f"/coletas/{coleta['id']}", f"/coletas/{coleta['id']}/pesagens", f"/coletas/{coleta['id']}/comprovante"):
            self.assertEqual(self.cliente.get(rota, headers=self.o).status_code, 403)
            self.assertEqual(self.cliente.get(rota).status_code, 401)
        self.assertEqual(self.cliente.get(f"/coletas/{coleta['id']}/comprovante", headers=self.s).status_code, 403)
        self.assertEqual(self.cliente.get(f"/coletas/{coleta['id']}/comprovante", headers=self.m).status_code, 200)
        self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 5}, self.o, 403)
        self.assertEqual(self.cliente.get("/notificacoes", headers=self.o).json(), [])

    def test_pontos_troca_e_conversao_sem_gasto_duplo(self):
        self.assertEqual(self.cliente.put("/carteira/preferencia", json={"recompensa": "pontos"}, headers=self.m).status_code, 200)
        coleta = self.finalizar()
        self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 5}, self.m)
        dados = dict(pontos=1000, destino="troca", chave=uuid4().hex)
        self.post("/carteira/resgatar", dados, self.m)
        self.post("/carteira/resgatar", dados, self.m)
        self.post("/carteira/resgatar", {**dados, "pontos": 2000}, self.m, 409)
        r = self.post("/carteira/resgatar", dict(pontos=2000, destino="dinheiro", chave=uuid4().hex), self.m)
        self.assertEqual((r["pontos"], r["centavos"]), (0, 2000))
        self.post("/carteira/resgatar", dict(pontos=1, destino="dinheiro", chave=uuid4().hex), self.m, 409)

    def test_avaliacoes_concorrentes_creditam_uma_vez(self):
        coleta = self.finalizar()
        with ThreadPoolExecutor(max_workers=2) as pool:
            resultados = list(pool.map(lambda _: self.cliente.post(f"/coletas/{coleta['id']}/avaliar", json={"nota": 4}, headers=self.m), range(2)))
        self.assertEqual([r.status_code for r in resultados], [200, 200])
        self.assertEqual(sum(r.json()["creditada"] for r in resultados), 1)

    def test_responsaveis_concorrentes(self):
        coleta = self.agendar()
        with ThreadPoolExecutor(max_workers=2) as pool:
            respostas = list(pool.map(lambda h: self.cliente.post(f"/coletas/{coleta['id']}/assumir", json={"confirmar": True}, headers=h), [self.c, self.s]))
        self.assertEqual(sorted(r.status_code for r in respostas), [200, 409])

    def test_resgates_concorrentes_nao_negativam_saldo(self):
        self.cliente.put("/carteira/preferencia", json={"recompensa": "pontos"}, headers=self.m)
        coleta = self.finalizar()
        self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 3}, self.m)
        with ThreadPoolExecutor(max_workers=2) as pool:
            respostas = list(pool.map(lambda _: self.cliente.post("/carteira/resgatar", json=dict(pontos=2000, destino="troca", chave=uuid4().hex), headers=self.m), range(2)))
        self.assertEqual(sorted(r.status_code for r in respostas), [200, 409])
        self.assertEqual(self.cliente.get("/carteira", headers=self.m).json()["pontos"], 1000)

    def test_eletronicos_sem_recompensa_podem_ser_concluidos(self):
        coleta = self.assumir()
        coleta = self.post(f"/coletas/{coleta['id']}/pesagens", dict(material="eletronicos", quilos=2), esperado=201)
        self.assertEqual(coleta["pontos_previstos"], 0)
        self.post(f"/coletas/{coleta['id']}/finalizar", self.confirmacao(coleta))
        r = self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 5}, self.m)
        self.assertEqual(r["coleta"]["pontos"], 0)

    def test_pesagem_removida_recalcula_previsao(self):
        coleta = self.pesar()
        peso = self.cliente.get(f"/coletas/{coleta['id']}/pesagens", headers=self.c).json()[0]
        r = self.cliente.delete(f"/coletas/{coleta['id']}/pesagens/{peso['id']}", headers=self.c)
        self.assertEqual(r.status_code, 200, r.text)
        self.assertEqual(r.json()["pontos_previstos"], 0)
        self.post(f"/coletas/{coleta['id']}/finalizar", self.confirmacao(r.json()), esperado=409)

    def test_segredos_nao_aparecem_nas_validacoes(self):
        r = self.cliente.patch("/usuarios/eu", json=dict(senha_atual="segredo-atual", nova_senha="curta", email="invalido"), headers=self.m)
        self.assertEqual(r.status_code, 422)
        self.assertNotIn("segredo-atual", r.text)
        self.assertNotIn("curta", r.text)

    def test_ultima_vaga_concorrente(self):
        self.cliente.put("/agenda", json=dict(dia=str(self.dia), hora="09:00", capacidade=1), headers=self.c)
        dados = dict(endereco="Rua da Concorrência, 123", dia=str(self.dia), hora="09:00", materiais_informados=["PET"])
        with ThreadPoolExecutor(max_workers=2) as pool:
            respostas = list(pool.map(lambda h: self.cliente.post("/coletas", json=dados, headers=h), [self.m, self.o]))
        self.assertEqual(sorted(r.status_code for r in respostas), [201, 409])

    def test_agenda_passado_capacidade_e_privacidade(self):
        self.agendar()
        agenda = self.cliente.get(f"/agenda?mes={str(self.dia)[:7]}", headers=self.o)
        self.assertNotIn("endereco", agenda.text)
        self.assertNotIn("nome_morador", agenda.text)
        rota = dict(dia=str(self.dia), hora="08:00", capacidade=0)
        self.assertEqual(self.cliente.put("/agenda", json=rota, headers=self.c).status_code, 409)
        self.assertEqual(self.cliente.put("/agenda", json=rota, headers=self.m).status_code, 403)
        self.post("/coletas", dict(endereco="Rua Teste, 123", dia="2020-01-01", hora="08:00", materiais_informados=["PET"]), self.m, 422)

    def test_perfil_senha_email_e_revogacao(self):
        dados = dict(senha_atual="errada", email="novo@example.org")
        self.assertEqual(self.cliente.patch("/usuarios/eu", json=dados, headers=self.m).status_code, 403)
        dados = dict(senha_atual="SenhaTeste123!", email=self.outro["email"])
        self.assertEqual(self.cliente.patch("/usuarios/eu", json=dados, headers=self.m).status_code, 409)
        dados = dict(senha_atual="SenhaTeste123!", email=uuid4().hex + "@example.org", nova_senha="NovaSenhaTeste123!")
        self.assertEqual(self.cliente.patch("/usuarios/eu", json=dados, headers=self.m).status_code, 200)
        self.assertEqual(self.cliente.get("/usuarios/eu", headers=self.m).status_code, 401)
        r = self.cliente.post("/login", data=dict(username=dados["email"], password=dados["nova_senha"]))
        self.assertEqual(r.status_code, 200)

    def test_precisao_categorias_e_validacao(self):
        coleta = self.assumir()
        for _ in range(3):
            r = self.post(f"/coletas/{coleta['id']}/pesagens", dict(material="aluminio", quilos="0.1"), esperado=201)
        self.assertEqual(r["pontos_previstos"], 115)
        self.assertEqual(r["pontos"], 0)
        for dados in (dict(material="inexistente", quilos=1), dict(material="pet", quilos=-1), dict(material="pet", quilos="0.0001"), dict(material="pet", quilos=1, pontos=9999)):
            self.post(f"/coletas/{coleta['id']}/pesagens", dados, esperado=422)
        self.post(f"/coletas/{coleta['id']}/avaliar", {"nota": 5}, self.m, 409)

    def test_migracao_preserva_historico_e_rls(self):
        with self.admin.connect() as c:
            historico = c.execute(text(f"SELECT situacao,pontos FROM {self.esquema}.coletas WHERE id=1")).one()
            self.assertEqual(tuple(historico), ("coletada", 42))
            tabelas = c.execute(text("SELECT relname, relrowsecurity FROM pg_class JOIN pg_namespace ON relnamespace=pg_namespace.oid WHERE nspname=:s AND relkind='r'"), {"s": self.esquema}).all()
            self.assertEqual(len(tabelas), 7)
            self.assertTrue(all(linha[1] for linha in tabelas))
            for tabela in ("horarios", "comprovantes", "notificacoes", "movimentos"):
                self.assertFalse(c.scalar(text("SELECT has_table_privilege('anon', :t, 'SELECT')"), {"t": f"{self.esquema}.{tabela}"}))


if __name__ == "__main__":
    unittest.main()
