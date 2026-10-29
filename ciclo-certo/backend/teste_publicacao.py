# Testes da configuração de nuvem sem conexão nem escrita no banco real.
import os
from pathlib import Path
import subprocess
import sys
import unittest


class TestePublicacao(unittest.TestCase):
    # Um processo novo reproduz a importação da aplicação em uma função Vercel.
    def executar(self, programa, **variaveis):
        ambiente = dict(os.environ, VERCEL="1", ORIGEM_FRONTEND="https://frontend.example.org",
                        DATABASE_URL="postgresql+psycopg://teste:teste@localhost:6543/postgres",
                        CHAVE_DO_TOKEN="segredo-exclusivo-dos-testes-sem-dados-reais", PYTHONUTF8="1")
        ambiente.update(variaveis)
        return subprocess.run([sys.executable, "-c", programa], cwd=Path(__file__).parent,
                              env=ambiente, capture_output=True, text=True, encoding="utf-8")

    # A função inicia, fecha conexões e só aceita CORS da origem exata configurada.
    def test_saude_cors_pool_e_perfil(self):
        programa = '''
from fastapi.testclient import TestClient
from sqlalchemy.pool import NullPool
from banco import engine
from main import app
assert isinstance(engine.pool, NullPool)
with TestClient(app) as cliente:
    assert cliente.get('/saude').json() == {'status': 'ok'}
    assert cliente.get('/coletas').status_code == 401
    headers = {'Origin': 'https://frontend.example.org', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,content-type'}
    resposta = cliente.options('/coletas', headers=headers)
    assert resposta.status_code == 200
    assert resposta.headers['access-control-allow-origin'] == headers['Origin']
    headers['Origin'] = 'https://outro.example.org'
    assert cliente.options('/coletas', headers=headers).status_code == 400
    resposta = cliente.post('/usuarios', json={'nome':'Teste', 'email':'teste@example.org', 'senha':'SenhaTeste123!', 'tipo':'cooperativa'})
    assert resposta.status_code == 403
    assert 'SenhaTeste123!' not in resposta.text
'''
        resultado = self.executar(programa)
        self.assertEqual(resultado.returncode, 0, resultado.stderr)

    # Configuração incompleta não publica uma API com CORS apontando para localhost.
    def test_origens_invalidas_recusadas(self):
        for origem in ["", "*", "http://localhost:5173", "https://frontend.example.org/caminho"]:
            with self.subTest(origem=origem):
                resultado = self.executar("import configuracao", ORIGEM_FRONTEND=origem)
                self.assertNotEqual(resultado.returncode, 0)
                self.assertIn("Configure ORIGEM_FRONTEND", resultado.stderr)

    # Uma barra final não muda a origem que o navegador envia ao fazer uma requisição.
    def test_barra_final_normalizada(self):
        resultado = self.executar("import configuracao; assert configuracao.origem_frontend == 'https://frontend.example.org'",
                                  ORIGEM_FRONTEND="https://frontend.example.org/")
        self.assertEqual(resultado.returncode, 0, resultado.stderr)


if __name__ == "__main__":
    unittest.main()
