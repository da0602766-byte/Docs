"""Confirma o endereço atual com link de uso único, sem guardar o token em claro."""
import hashlib
import logging
import secrets
import smtplib
from datetime import timedelta

import configuracao
from repositorios import operacao, usuario as usuarios
from servicos import email_transacional
from servicos.operacao import Recusa, agora


def solicitar(sessao, usuario_id):
    conta = operacao.usuario(sessao, usuario_id)
    if conta is None:
        raise Recusa("Conta não encontrada.", 404)
    if not conta.email:
        raise Recusa("Adicione um e-mail ao perfil para confirmá-lo.", 422)
    if conta.email_verificado:
        return {"mensagem": "Seu e-mail já está confirmado."}
    if not email_transacional.disponivel():
        raise Recusa("O envio de links de confirmação está indisponível no momento.", 503)
    instante = agora()
    if conta.confirmacao_email_enviada_em and instante - conta.confirmacao_email_enviada_em < timedelta(minutes=5):
        raise Recusa("Aguarde cinco minutos entre os pedidos de confirmação.", 429)
    token = secrets.token_urlsafe(32)
    conta.confirmacao_email_hash = hashlib.sha256(token.encode()).hexdigest()
    conta.confirmacao_email_enviada_em = instante
    email = conta.email
    acesso = "?acesso=cooperador" if conta.tipo == "cooperativa" else ""
    operacao.confirmar(sessao)
    link = f"{configuracao.origem_frontend}/confirmar-email{acesso}#token={token}"
    try:
        email_transacional.entregar(email, "Confirme seu e-mail · Ciclo Certo",
            f"Confirme seu e-mail em até 24 horas:\n{link}\n\nSe você não criou esta conta nem solicitou este link, ignore a mensagem.")
    except (OSError, smtplib.SMTPException) as erro:
        logging.getLogger(__name__).warning("Falha no envio da confirmação de e-mail.")
        raise Recusa("Não foi possível enviar o link agora. Tente novamente em alguns minutos.", 503) from erro
    return {"mensagem": "Link enviado. Confira sua caixa de entrada e a pasta de spam."}


def confirmar(sessao, token):
    resumo = hashlib.sha256(token.encode()).hexdigest()
    conta = usuarios.por_confirmacao_email(sessao, resumo)
    instante = agora()
    if (not conta or not conta.email or not conta.confirmacao_email_enviada_em
            or instante - conta.confirmacao_email_enviada_em >= timedelta(hours=24)):
        raise Recusa("Link inválido, expirado ou já usado. Peça outro no seu perfil.", 422)
    conta.email_verificado_em = instante
    conta.confirmacao_email_hash = None
    operacao.confirmar(sessao)
    return {"mensagem": "Seu e-mail foi confirmado."}
