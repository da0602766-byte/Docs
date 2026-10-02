# O servico aplica as regras das coletas e conversa com os repositorios necessarios.
from esquemas.coleta import ColetaEntrada
from repositorios import coleta as repositorio_coleta
from repositorios import usuario as repositorio_usuario


# Acrescenta o nome do morador, pois a tela precisa identifica-lo sem guardar nomes no React.
def montar_coleta_de_saida(coleta: dict):
    morador = repositorio_usuario.buscar_por_id(coleta["morador_id"])
    return {**coleta, "nome_morador": morador["nome"]}


# Lista as coletas e aplica os filtros opcionais de dia e morador pedidos na cartilha.
def listar_coletas(dia: str = None, morador_id: int = None):
    resultado = []
    for coleta in repositorio_coleta.listar():
        dia_confere = dia is None or coleta["dia"] == dia
        morador_confere = morador_id is None or coleta["morador_id"] == morador_id
        if dia_confere and morador_confere:
            resultado.append(montar_coleta_de_saida(coleta))
    return resultado


# Busca uma coleta e prepara os dados extras que a interface mostrara no detalhe.
def buscar_coleta(coleta_id: int):
    coleta = repositorio_coleta.buscar_por_id(coleta_id)
    if coleta is None:
        return None
    return montar_coleta_de_saida(coleta)


# Agenda uma coleta com a situacao e os pontos iniciais definidos pela cartilha.
def agendar_coleta(dados_entrada: ColetaEntrada):
    morador = repositorio_usuario.buscar_por_id(dados_entrada.morador_id)
    if morador is None or morador["tipo"] != "morador":
        return "O perfil informado nao e um morador."

    dados_coleta = dados_entrada.model_dump(mode="json")
    coleta_nova = repositorio_coleta.criar(
        {**dados_coleta, "situacao": "agendada", "pontos": 0}
    )
    return montar_coleta_de_saida(coleta_nova)
