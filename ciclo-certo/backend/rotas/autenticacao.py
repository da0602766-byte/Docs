# As dependências identificam quem faz o pedido e restringem os perfis da cartilha.
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from banco import obter_sessao
from esquemas.usuario import Token
from seguranca import criar_token_acesso
from servicos import usuario as servico_usuario

router = APIRouter(tags=["Autenticação"])
esquema_oauth = OAuth2PasswordBearer(tokenUrl="login")


# OAuth2PasswordRequestForm recebe username e password como formulário, não JSON.
@router.post("/login", response_model=Token,
             responses={401: {"description": "E-mail ou senha incorretos."}},
             description="Recebe formulário OAuth2: username é o e-mail e password é a senha. Devolve token com validade de 60 minutos.")
def login(formulario: OAuth2PasswordRequestForm = Depends(), sessao=Depends(obter_sessao)):
    usuario = servico_usuario.autenticar(sessao, formulario.username, formulario.password)
    if usuario is None:
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos.", headers={"WWW-Authenticate": "Bearer"})
    return {"access_token": criar_token_acesso(usuario.id, usuario.versao_token), "token_type": "bearer"}


# O serviço valida o token e procura o usuário, sem confiar no perfil informado pelo cliente.
def obter_usuario_atual(token: str = Depends(esquema_oauth), sessao=Depends(obter_sessao)):
    usuario = servico_usuario.usuario_do_token(sessao, token)
    if usuario is None:
        raise HTTPException(status_code=401, detail="Token inválido ou vencido.", headers={"WWW-Authenticate": "Bearer"})
    return usuario


# O morador é o perfil que pode agendar a retirada de seus próprios materiais.
def exigir_morador(usuario=Depends(obter_usuario_atual)):
    if usuario.tipo != "morador":
        raise HTTPException(status_code=403, detail="Somente moradores podem realizar esta operação.")
    return usuario


# A cooperativa é o perfil que pode registrar a pesagem e consultar usuários.
def exigir_cooperativa(usuario=Depends(obter_usuario_atual)):
    if usuario.tipo != "cooperativa":
        raise HTTPException(status_code=403, detail="Somente a cooperativa pode realizar esta operação.")
    return usuario
