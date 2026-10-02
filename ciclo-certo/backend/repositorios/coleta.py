# Esta lista guarda as coletas somente enquanto a aplicacao esta em execucao.
coletas = []


# Le todas as coletas para que o servico aplique os filtros da cartilha.
def listar():
    return coletas


# Busca uma coleta pelo id antes de ela ser mostrada ou receber uma pesagem.
def buscar_por_id(coleta_id: int):
    for coleta in coletas:
        if coleta["id"] == coleta_id:
            return coleta
    return None


# Grava uma coleta nova e atribui um id simples enquanto nao existe banco de dados.
def criar(dados_coleta: dict):
    coleta_nova = {"id": len(coletas) + 1, **dados_coleta}
    coletas.append(coleta_nova)
    return coleta_nova


# Atualiza os campos que a regra da pesagem recalcula na coleta ja existente.
def atualizar_pontos_e_situacao(coleta_id: int, pontos: float, situacao: str):
    coleta = buscar_por_id(coleta_id)
    if coleta is not None:
        coleta["pontos"] = pontos
        coleta["situacao"] = situacao
    return coleta
