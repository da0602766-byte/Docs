# Esta lista simula os perfis enquanto o projeto ainda nao usa banco de dados.
usuarios = [
    {"id": 1, "nome": "Joana", "tipo": "morador"},
    {"id": 2, "nome": "Osmar", "tipo": "cooperativa"},
]


# Busca o perfil pelo identificador para os servicos confirmarem quem fez a solicitacao.
def buscar_por_id(usuario_id: int):
    for usuario in usuarios:
        if usuario["id"] == usuario_id:
            return usuario
    return None


# Entrega a lista de perfis para o seletor temporario do front.
def listar():
    return usuarios
