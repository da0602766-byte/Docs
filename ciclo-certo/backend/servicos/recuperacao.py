"""Recuperação por canal de e-mail com expiração, uso único e revogação de sessões."""
import hashlib
import secrets
import smtplib
from datetime import timedelta
import configuracao
from repositorios import recuperacao as repo
from repositorios import usuario as usuarios
from repositorios import operacao
from servicos.operacao import agora, Recusa
from servicos import email_transacional
from seguranca import gerar_hash_senha

MENSAGEM = {'mensagem': 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'}

def entregar(email, link):
    email_transacional.entregar(email, 'Redefinir sua senha · Ciclo Certo',
        f'Use este link em até 20 minutos para criar uma nova senha:\n{link}\n\nSe você não solicitou, ignore esta mensagem.')

def solicitar(s, email):
    if not email_transacional.disponivel():
        raise Recusa('Recuperação por e-mail ainda não configurada. Contate a cooperativa.', 503)
    usuario = usuarios.buscar_por_email(s, str(email).casefold())
    if not usuario:
        return MENSAGEM
    usuario = operacao.usuario(s, usuario.id)
    anterior = repo.obter(s, usuario.id)
    instante = agora()
    # Um pedido por minuto por conta; a resposta não revela existência ou limite.
    if anterior and instante-anterior.criado_em < timedelta(minutes=1):
        return MENSAGEM
    token = secrets.token_urlsafe(32)
    repo.gravar(s, usuario.id, hashlib.sha256(token.encode()).hexdigest(), instante, instante+timedelta(minutes=20), usuario.versao_token)
    operacao.confirmar(s)
    link = configuracao.origem_frontend + '/redefinir#token=' + token
    try:
        entregar(usuario.email, link)
    except (OSError, smtplib.SMTPException):
        # Não devolve credenciais, token nem a existência da conta ao solicitante.
        import logging
        logging.getLogger(__name__).error('Falha ao entregar mensagem de recuperação.')
    return MENSAGEM

def redefinir(s, token, senha):
    resumo = hashlib.sha256(token.encode()).hexdigest()
    registro = repo.por_resumo(s, resumo)
    if not registro:
        raise Recusa('Link inválido ou expirado. Solicite outro.', 422)
    usuario = operacao.usuario(s, registro.usuario_id)
    registro = repo.obter(s, usuario.id)
    if not registro or not secrets.compare_digest(registro.resumo, resumo) or registro.expira_em <= agora() or registro.versao_token != usuario.versao_token:
        raise Recusa('Link inválido ou expirado. Solicite outro.', 422)
    usuario.senha_hash = gerar_hash_senha(senha)
    usuario.versao_token += 1
    s.delete(registro)
    operacao.confirmar(s)
    return {'mensagem': 'Senha atualizada. Entre novamente com a nova senha.'}
