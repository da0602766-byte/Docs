"""Detecta identificadores e segredos antes de enviar texto a um provedor."""
import re
import unicodedata

from fastapi import HTTPException


_SENSIVEL = re.compile(
    r"@|https?\s*:|www\.|\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b|"
    r"\b\d{5}-\d{3}\b|(?:\+?55\s*)?(?:\(\d{2}\)|\b\d{2})\s*\d{4,5}[-\s]?\d{4}\b|"
    r"\b(?:telefone|celular|whatsapp|cpf|cnpj|cep|rg)\s*(?:[:=]|\d)|"
    r"\b(?:senha|password|token|credencial|api[_ -]?key|chave\s+de\s+acesso)\b|"
    r"\b(?:rua|avenida|travessa|alameda|estrada|endereco|logradouro)\b[^\n!?]{0,65}\d|"
    r"\b(?:rua|avenida|travessa|alameda|estrada|logradouro)\s+(?:do |da |das |dos |de )?\w+|"
    r"\b(?:meu nome (?:e|eh)|me chamo|moro (?:na|no|em))\b|"
    r"\bcoleta\s*(?:#|n[º°.]\s*)?\d+\b|"
    r"\b(?:sk|pk)-[a-z0-9_-]{12,}|\beyj[a-z0-9_-]+\.[a-z0-9_-]+\.",
    re.I,
)


def normalizar(texto):
    texto = unicodedata.normalize("NFKD", texto.casefold())
    return "".join(c for c in texto if unicodedata.category(c)[0] not in {"M", "C"})


def contem_dados_sensiveis(texto):
    return bool(_SENSIVEL.search(normalizar(texto)))


def validar_textos(textos, usuario):
    # Compara localmente; os campos do cadastro não integram a solicitação externa.
    nome = normalizar(usuario.nome or "").strip()
    email = normalizar(usuario.email or "").strip()
    endereco = normalizar(getattr(usuario, "endereco_coleta", None) or "").strip()
    for texto in textos:
        limpo = normalizar(texto)
        if (_SENSIVEL.search(limpo) or (len(nome) >= 5 and nome in limpo)
                or (email and email in limpo) or (endereco and endereco in limpo)):
            raise HTTPException(422, "Escreva sua pergunta sem dados pessoais. Para marcar a coleta, use o campo de endereço que a Cici abre na conversa.")
