# O servico calcula os pontos e atualiza a coleta sem colocar regra de negocio na rota.
from esquemas.pesagem import PesagemEntrada
from repositorios import coleta as repositorio_coleta
from repositorios import pesagem as repositorio_pesagem


# Guarda a pontuacao por quilo definida diretamente na cartilha.
pontos_por_material = {"papel": 1, "vidro": 1, "plástico": 2, "metal": 4}


# Lista as pesagens quando a coleta existe e sinaliza a ausencia dela com None.
def listar_pesagens(coleta_id: int):
    coleta = repositorio_coleta.buscar_por_id(coleta_id)
    if coleta is None:
        return None
    return repositorio_pesagem.listar_por_coleta(coleta_id)


# Registra a pesagem, soma os pontos e marca a primeira pesagem como coleta realizada.
def registrar_pesagem(coleta_id: int, dados_entrada: PesagemEntrada):
    coleta = repositorio_coleta.buscar_por_id(coleta_id)
    if coleta is None:
        return "Coleta nao encontrada."

    pontos_por_quilo = pontos_por_material.get(dados_entrada.material)
    if pontos_por_quilo is None:
        return "Material nao previsto na cartilha."

    pontos_da_pesagem = dados_entrada.quilos * pontos_por_quilo
    pesagem_nova = repositorio_pesagem.criar(
        {
            "coleta_id": coleta_id,
            "material": dados_entrada.material,
            "quilos": dados_entrada.quilos,
            "pontos": pontos_da_pesagem,
        }
    )
    repositorio_coleta.atualizar_pontos_e_situacao(
        coleta_id, coleta["pontos"] + pontos_da_pesagem, "coletada"
    )
    return pesagem_nova
