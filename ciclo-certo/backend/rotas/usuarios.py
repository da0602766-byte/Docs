# As rotas expõem cadastro e perfil atual sem devolver senha ou hash.
from fastapi import APIRouter, Depends, HTTPException

from banco import obter_sessao
from esquemas.usuario import UsuarioCriar, UsuarioSaida
from rotas.autenticacao import exigir_cooperativa, obter_usuario_atual
from servicos import usuario as servico_usuario
from servicos.excecoes import EmailEmUso

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


# O cadastro permanece público; cada pessoa informa os próprios dados, sem perfis precriados.
@router.post("", status_code=201, response_model=UsuarioSaida)
def cadastrar_usuario(dados: UsuarioCriar, sessao=Depends(obter_sessao)):
    try:
        return servico_usuario.cadastrar(sessao, dados)
    except EmailEmUso as erro:
        raise HTTPException(status_code=409, detail=str(erro)) from erro


# Devolve somente quem foi identificado pelo token desta requisição.
@router.get("/eu", response_model=UsuarioSaida)
def consultar_usuario_atual(usuario=Depends(obter_usuario_atual)):
    return usuario


# Preserva o caminho antigo como consulta administrativa, sem o seletor público de identidades.
@router.get("", response_model=list[UsuarioSaida])
def listar_usuarios(usuario=Depends(exigir_cooperativa), sessao=Depends(obter_sessao)):
    return servico_usuario.listar_usuarios(sessao)
