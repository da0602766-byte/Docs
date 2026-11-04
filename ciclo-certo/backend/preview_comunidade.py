"""Infraestrutura visual: servidor com schema descartável, jamais publicar este módulo."""
import uvicorn
from sqlalchemy import text
from teste_comunidade import TesteComunidade
from main import app


if __name__ == '__main__':
    # O teste já restringe a conexão a ciclo_certo_teste_local em 127.0.0.1.
    TesteComunidade.setUpClass()
    try:
        for tipo, email in [('morador', 'morador-comunidade@example.org'), ('cooperativa', 'moderador-comunidade@example.org')]:
            resposta = TesteComunidade.cliente.post('/usuarios', json=dict(nome='Pessoa Teste ' + tipo, email=email, senha='TesteLocal123!', tipo=tipo))
            assert resposta.status_code == 201, resposta.text
            if tipo == 'cooperativa':
                with TesteComunidade.admin.begin() as conexao:
                    conexao.execute(text(f'INSERT INTO {TesteComunidade.esquema}.comunidade_moderadores VALUES (:id)'), {'id': resposta.json()['id']})
        uvicorn.run(app, host='127.0.0.1', port=8001)
    finally:
        TesteComunidade.tearDownClass()
