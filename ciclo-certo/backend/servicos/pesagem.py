# Os pontos continuam sendo calculados no serviço, sem números de status HTTP.
from esquemas.pesagem import PesagemEntrada
from repositorios import pesagem as repositorio_pesagem
from servicos import coleta as servico_coleta
from servicos.excecoes import AcessoNegado, MaterialInvalido

# Esta tabela é a regra da cartilha, não um cadastro de dados de demonstração.
pontos_por_material = {"papel": 1, "vidro": 1, "plástico": 2, "metal": 4}


# Aplica a propriedade da coleta antes de mostrar suas pesagens.
def listar_pesagens(sessao, coleta_id: int, usuario):
    coleta = servico_coleta.buscar_coleta(sessao, coleta_id, usuario)
    if coleta is None:
        return None
    return repositorio_pesagem.listar_por_coleta(sessao, coleta_id)


# Somente a cooperativa registra o peso, e o repositório confirma os dois registros juntos.
def registrar_pesagem(sessao, coleta_id: int, dados_entrada: PesagemEntrada, usuario):
    if usuario.tipo != "cooperativa":
        raise AcessoNegado("Somente a cooperativa pode registrar pesagens.")
    if servico_coleta.buscar_coleta(sessao, coleta_id, usuario) is None:
        return None
    pontos_por_quilo = pontos_por_material.get(dados_entrada.material)
    if pontos_por_quilo is None:
        raise MaterialInvalido("Material não previsto na cartilha.")
    return repositorio_pesagem.salvar(sessao, {
        "coleta_id": coleta_id,
        "material": dados_entrada.material,
        "quilos": dados_entrada.quilos,
        "pontos": dados_entrada.quilos * pontos_por_quilo,
    }, "coletada")
