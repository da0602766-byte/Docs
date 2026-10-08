# Segurança cuida somente de hash e JWT; o serviço consulta os usuários no banco.
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash
from pwdlib.exceptions import UnknownHashError

import configuracao as configuracao

# Argon2 cria um sal diferente em cada hash e a biblioteca cuida da comparação.
gerador_hash = PasswordHash.recommended()
algoritmo_token = "HS256"

# Uma chave ausente não pode resultar em tokens assinados com um segredo vazio.
if len(configuracao.chave_do_token) < 32:
    raise RuntimeError("Configure CHAVE_DO_TOKEN no .env com uma chave aleatória de pelo menos 32 caracteres.")


# Gera o valor que pode ser persistido, sem guardar a senha informada no cadastro.
def gerar_hash_senha(senha: str) -> str:
    return gerador_hash.hash(senha)


# Um hash ausente ou inválido não autentica a pessoa e não derruba o login.
def verificar_senha(senha: str, hash_senha: str) -> bool:
    if not hash_senha:
        return False
    try:
        return gerador_hash.verify(senha, hash_senha)
    except (UnknownHashError, ValueError):
        return False


# sub é o id em texto e exp limita a validade do acesso a uma hora.
def criar_token_acesso(usuario_id: int) -> str:
    validade = datetime.now(timezone.utc) + timedelta(minutes=60)
    return jwt.encode(
        {"sub": str(usuario_id), "exp": validade},
        configuracao.chave_do_token,
        algorithm=algoritmo_token,
    )


# Exige assinatura, validade e identificação, sem aceitar outro algoritmo.
def validar_token_acesso(token: str) -> int | None:
    try:
        dados = jwt.decode(
            token,
            configuracao.chave_do_token,
            algorithms=[algoritmo_token],
            options={"require": ["sub", "exp"]},
        )
        identificador = dados["sub"]
        if not isinstance(identificador, str) or not identificador.isascii() or not identificador.isdecimal():
            return None
        if len(identificador) > 10:
            return None
        usuario_id = int(identificador)
        return usuario_id if 0 < usuario_id <= 2147483647 else None
    except (jwt.InvalidTokenError, ValueError, TypeError, OverflowError):
        return None
