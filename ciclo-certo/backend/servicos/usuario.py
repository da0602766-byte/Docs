# O serviço decide o cadastro e a autenticação sem depender de HTTP ou de modelos.
from esquemas.usuario import UsuarioCriar
from repositorios import usuario as repositorio_usuario
from seguranca import gerar_hash_senha, verificar_senha, validar_token_acesso
from servicos.excecoes import EmailEmUso, AcessoNegado
import configuracao


# Mantém a consulta administrativa separada da rota que autoriza a cooperativa.
def listar_usuarios(sessao):
    return repositorio_usuario.listar(sessao)


# Normaliza o login, verifica duplicidade e substitui a senha pelo hash antes de salvar.
def cadastrar(sessao, dados_entrada: UsuarioCriar):
    if dados_entrada.tipo == "cooperativa" and not configuracao.permitir_cadastro_cooperativa:
        raise AcessoNegado("Contas da cooperativa são liberadas pela administração. Use uma conta já autorizada.")
    email = str(dados_entrada.email).strip().casefold()
    if repositorio_usuario.buscar_por_email(sessao, email) is not None:
        raise EmailEmUso("Já existe um usuário com esse e-mail.")

    usuario = repositorio_usuario.salvar(sessao, {
        "nome": dados_entrada.nome,
        "email": email,
        "tipo": dados_entrada.tipo,
        "senha_hash": gerar_hash_senha(dados_entrada.senha.get_secret_value()),
    })
    if usuario is None:
        raise EmailEmUso("Já existe um usuário com esse e-mail.")
    return usuario


# Ausência de usuário, senha antiga vazia e senha incorreta têm o mesmo resultado.
def autenticar(sessao, email: str, senha: str):
    usuario = repositorio_usuario.buscar_por_email(sessao, email.strip().casefold())
    if usuario is None or not verificar_senha(senha, usuario.senha_hash):
        return None
    return usuario


# O id validado precisa continuar correspondendo a um usuário existente no banco.
def usuario_do_token(sessao, token: str):
    usuario_id = validar_token_acesso(token)
    if usuario_id is None:
        return None
    return repositorio_usuario.buscar_por_id(sessao, usuario_id)
