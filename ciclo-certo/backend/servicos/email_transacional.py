"""Transporte de mensagens da conta pelo Resend, SMTP ou caixa do preview."""
import json
import secrets
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path
from urllib.request import Request, urlopen

import configuracao


def disponivel():
    return bool(configuracao.recuperacao_local or (
        configuracao.resend_api_key and configuracao.resend_remetente
    ) or all((configuracao.smtp_host, configuracao.smtp_usuario,
              configuracao.smtp_senha, configuracao.smtp_remetente)))


def entregar(email, assunto, texto):
    if not configuracao.recuperacao_local and configuracao.resend_api_key and configuracao.resend_remetente:
        requisicao = Request("https://api.resend.com/emails", json.dumps({
            "from": configuracao.resend_remetente, "to": [email],
            "subject": assunto, "text": texto,
        }).encode(), {"Authorization": f"Bearer {configuracao.resend_api_key}",
                      "Content-Type": "application/json", "User-Agent": "Ciclo-Certo/1.0"}, method="POST")
        with urlopen(requisicao, timeout=8):
            return

    mensagem = EmailMessage()
    mensagem["Subject"] = assunto
    mensagem["From"] = configuracao.smtp_remetente or "Ciclo Certo <desenvolvimento@example.org>"
    mensagem["To"] = email
    mensagem.set_content(texto)
    if configuracao.recuperacao_local:
        destino = Path(__file__).resolve().parents[2] / ".test-infra" / "emails"
        destino.mkdir(parents=True, exist_ok=True)
        (destino / (secrets.token_hex(12) + ".eml")).write_bytes(bytes(mensagem))
        return
    with smtplib.SMTP(configuracao.smtp_host, configuracao.smtp_porta, timeout=10) as smtp:
        smtp.starttls(context=ssl.create_default_context())
        smtp.login(configuracao.smtp_usuario, configuracao.smtp_senha)
        smtp.send_message(mensagem)
