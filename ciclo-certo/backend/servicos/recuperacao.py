"""Recuperação por canal de e-mail com expiração, uso único e revogação de sessões."""
import hashlib
import secrets
import ssl
import smtplib
from datetime import timedelta
from email.message import EmailMessage
from pathlib import Path
import configuracao
from repositorios import recuperacao as repo
from repositorios import usuario as usuarios
from repositorios import operacao
from servicos.operacao import agora, Recusa
from seguranca import gerar_hash_senha

MENSAGEM = {'mensagem': 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'}

def entregar(email, link):
    mensagem = EmailMessage()
    mensagem['Subject'] = 'Redefinir sua senha · Ciclo Certo'
    mensagem['From'] = configuracao.smtp_remetente or 'Ciclo Certo <desenvolvimento@example.org>'
    mensagem['To'] = email
    mensagem.set_content(f'Use este link em até 20 minutos para criar uma nova senha:\n{link}\n\nSe você não solicitou, ignore esta mensagem.')
    if configuracao.recuperacao_local:
        destino = Path(__file__).resolve().parents[2] / '.test-infra' / 'emails'
        destino.mkdir(parents=True, exist_ok=True)
        (destino / (secrets.token_hex(12)+'.eml')).write_bytes(bytes(mensagem))
        return
    with smtplib.SMTP(configuracao.smtp_host, configuracao.smtp_porta, timeout=10) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(configuracao.smtp_usuario, configuracao.smtp_senha)
        smtp.send_message(mensagem)

def solicitar(s, email):
    if not configuracao.recuperacao_local and not all((configuracao.smtp_host, configuracao.smtp_usuario, configuracao.smtp_senha, configuracao.smtp_remetente)):
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
        logging.getLogger(__name__).error('Falha ao entregar mensagem de recuperação; confira o SMTP.')
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
