"""Bloqueios serializam pedidos e consumo único do link de recuperação."""
from sqlalchemy import select
from modelos.recuperacao import Recuperacao

def obter(s, id):
    return s.get(Recuperacao, id, populate_existing=True)

def gravar(s, id, resumo, agora, expira, versao):
    registro = obter(s, id)
    if registro is None:
        registro = Recuperacao(usuario_id=id)
        s.add(registro)
    registro.versao_token = versao
    registro.resumo, registro.criado_em, registro.expira_em = resumo, agora, expira
    s.flush()

def por_resumo(s, resumo):
    return s.scalar(select(Recuperacao).where(Recuperacao.resumo == resumo))
