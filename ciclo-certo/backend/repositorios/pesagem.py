# O repositório confirma pesagem e total da coleta na mesma transação.
from sqlalchemy import select

from modelos.coleta import Coleta
from modelos.pesagem import Pesagem


# Consulta somente o histórico da coleta autorizada pelo serviço.
def listar_por_coleta(sessao, coleta_id: int):
    return list(sessao.scalars(select(Pesagem).where(Pesagem.coleta_id == coleta_id)))


# O bloqueio espera outras pesagens e relê o total antes de acrescentar os novos pontos.
def salvar(sessao, dados_pesagem: dict, situacao_coleta: str):
    consulta = (
        select(Coleta)
        .where(Coleta.id == dados_pesagem["coleta_id"])
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    coleta = sessao.scalars(consulta).first()
    if coleta is None:
        return None

    pesagem = Pesagem(**dados_pesagem)
    sessao.add(pesagem)
    coleta.pontos += dados_pesagem["pontos"]
    coleta.situacao = situacao_coleta
    sessao.commit()
    return pesagem
