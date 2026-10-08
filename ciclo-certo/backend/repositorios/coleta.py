# Só este repositório usa o modelo de coleta e aplica os filtros ao SQL.
from sqlalchemy import select
from modelos.coleta import Coleta


# A sessão é recebida primeiro para participar da mesma requisição dos demais recursos.
def listar(sessao, dia=None, morador_id: int = None):
    consulta = select(Coleta)
    if dia is not None:
        consulta = consulta.where(Coleta.dia == dia)
    if morador_id is not None:
        consulta = consulta.where(Coleta.morador_id == morador_id)
    return list(sessao.scalars(consulta))


# Devolve o registro ou None, deixando a resposta HTTP para a rota.
def buscar_por_id(sessao, coleta_id: int):
    return sessao.get(Coleta, coleta_id)


# Persiste os valores iniciais já definidos pela regra no serviço.
def salvar(sessao, dados_coleta: dict):
    coleta = Coleta(**dados_coleta)
    sessao.add(coleta)
    sessao.commit()
    return coleta
