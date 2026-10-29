# As rotas expõem cadastro e perfil atual sem devolver senha ou hash.
from fastapi import APIRouter, Depends, HTTPException

from banco import obter_sessao
from esquemas.usuario import UsuarioCriar, UsuarioSaida
from rotas.autenticacao import exigir_cooperativa, obter_usuario_atual
from servicos import usuario as servico_usuario
from servicos.excecoes import EmailEmUso, AcessoNegado

router = APIRouter(prefix="/usuarios", tags=["Usuários"])


# O cadastro permanece público; cada pessoa informa os próprios dados, sem perfis precriados.
@router.post("", status_code=201, response_model=UsuarioSaida,
             responses={403: {"description": "Cadastro de cooperativa restrito na publicação."}, 409: {"description": "E-mail já cadastrado."}},
             description="Cadastro público do exercício. Guarda somente o hash Argon2 e não devolve senha nem hash.")
def cadastrar_usuario(dados: UsuarioCriar, sessao=Depends(obter_sessao)):
    try:
        return servico_usuario.cadastrar(sessao, dados)
    except EmailEmUso as erro:
        raise HTTPException(status_code=409, detail=str(erro)) from erro
    except AcessoNegado as erro:
        raise HTTPException(status_code=403, detail=str(erro)) from erro


# Devolve somente quem foi identificado pelo token desta requisição.
@router.get("/eu", response_model=UsuarioSaida, responses={401: {"description": "Token ausente, inválido ou vencido."}})
def consultar_usuario_atual(usuario=Depends(obter_usuario_atual)):
    return usuario


# Preserva o caminho antigo como consulta administrativa, sem o seletor público de identidades.
@router.get("", response_model=list[UsuarioSaida], responses={
    401: {"description": "Token ausente, inválido ou vencido."},
    403: {"description": "Somente a cooperativa pode consultar usuários."},
})
def listar_usuarios(usuario=Depends(exigir_cooperativa), sessao=Depends(obter_sessao)):
    return servico_usuario.listar_usuarios(sessao)
