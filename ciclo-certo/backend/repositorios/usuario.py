# Só o repositório usa o modelo de usuário e conhece as consultas ao banco.
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from modelos.usuario import Usuario


# Busca quem foi identificado pelo token, devolvendo None quando não existe.
def buscar_por_id(sessao, usuario_id: int):
    return sessao.get(Usuario, usuario_id)


# Busca o login pelo e-mail normalizado pelo serviço.
def buscar_por_email(sessao, email: str):
    return sessao.scalars(select(Usuario).where(Usuario.email == email)).first()


# A listagem administrativa nunca decide qual perfil pode acessar a rota.
def listar(sessao):
    return list(sessao.scalars(select(Usuario)))


# A restrição única também protege contra dois cadastros simultâneos com o mesmo e-mail.
def salvar(sessao, dados_usuario: dict):
    usuario = Usuario(**dados_usuario)
    sessao.add(usuario)
    try:
        sessao.commit()
    except IntegrityError as erro:
        sessao.rollback()
        if getattr(erro.orig, "errno", None) == 1062:
            return None
        raise
    return usuario
