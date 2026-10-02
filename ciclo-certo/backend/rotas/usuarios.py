# As rotas recebem as requisicoes de perfil e deixam a decisao para o servico.
from fastapi import APIRouter

from esquemas.usuario import UsuarioSaida
from servicos import usuario as servico_usuario


# Agrupa os endpoints do recurso usuario para o main apenas registra-lo.
router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


# Lista os perfis que o front pode oferecer enquanto o sistema ainda nao possui login.
@router.get("", response_model=list[UsuarioSaida])
def listar_usuarios():
    return servico_usuario.listar_usuarios()
