# Esta lista guarda as pesagens em memoria, ligadas pelo id da coleta.
pesagens = []


# Le somente as pesagens pertencentes a uma coleta para montar seus detalhes.
def listar_por_coleta(coleta_id: int):
    resultado = []
    for pesagem in pesagens:
        if pesagem["coleta_id"] == coleta_id:
            resultado.append(pesagem)
    return resultado


# Grava uma pesagem e cria um identificador simples enquanto nao existe banco de dados.
def criar(dados_pesagem: dict):
    pesagem_nova = {"id": len(pesagens) + 1, **dados_pesagem}
    pesagens.append(pesagem_nova)
    return pesagem_nova
