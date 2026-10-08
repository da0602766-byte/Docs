# O serviço aplica a propriedade dos registros e as regras do agendamento.
from esquemas.coleta import ColetaEntrada
from repositorios import coleta as repositorio_coleta
from repositorios import usuario as repositorio_usuario
from servicos.excecoes import AcessoNegado


# Acrescenta o nome por meio do repositório sem depender do modelo SQLAlchemy.
def montar_coleta_de_saida(sessao, coleta):
    morador = repositorio_usuario.buscar_por_id(sessao, coleta.morador_id)
    return {
        "id": coleta.id,
        "morador_id": coleta.morador_id,
        "nome_morador": morador.nome,
        "endereco": coleta.endereco,
        "dia": coleta.dia,
        "materiais_informados": coleta.materiais_informados,
        "situacao": coleta.situacao,
        "pontos": coleta.pontos,
    }


# Moradores não podem trocar o filtro para consultar outra pessoa; a cooperativa vê a rota.
def listar_coletas(sessao, usuario, dia=None, morador_id: int = None):
    if usuario.tipo == "morador":
        if morador_id is not None and morador_id != usuario.id:
            raise AcessoNegado("Você só pode consultar suas próprias coletas.")
        morador_id = usuario.id
    coletas = repositorio_coleta.listar(sessao, dia, morador_id)
    return [montar_coleta_de_saida(sessao, coleta) for coleta in coletas]


# Uma coleta inexistente continua sendo None; uma coleta de outro morador é uma recusa.
def buscar_coleta(sessao, coleta_id: int, usuario):
    coleta = repositorio_coleta.buscar_por_id(sessao, coleta_id)
    if coleta is None:
        return None
    if usuario.tipo == "morador" and coleta.morador_id != usuario.id:
        raise AcessoNegado("Esta coleta não pertence a você.")
    return montar_coleta_de_saida(sessao, coleta)


# O dono é o usuário autenticado e os pontos iniciais continuam obedecendo à cartilha.
def agendar_coleta(sessao, dados_entrada: ColetaEntrada, usuario):
    if usuario.tipo != "morador":
        raise AcessoNegado("Somente moradores podem agendar coletas.")
    coleta = repositorio_coleta.salvar(sessao, {
        **dados_entrada.model_dump(),
        "morador_id": usuario.id,
        "situacao": "agendada",
        "pontos": 0,
    })
    return montar_coleta_de_saida(sessao, coleta)
