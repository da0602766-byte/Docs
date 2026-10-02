# O servico organiza os perfis sem deixar a rota conhecer a lista em memoria.
from repositorios import usuario as repositorio_usuario


# Entrega os perfis disponiveis para a escolha temporaria antes do login existir.
def listar_usuarios():
    return repositorio_usuario.listar()
