"""Catálogo operacional: opções de planejamento, sem alterar pesos ou recompensas."""
EQUIPAMENTOS = [
    dict(codigo="balanca", nome="Balança portátil", grupo="Pesagem", detalhe="Conferir os materiais no local", icone="scale"),
    dict(codigo="luvas", nome="Luvas de proteção", grupo="Proteção", detalhe="Manuseio dos materiais", icone="check"),
    dict(codigo="botas", nome="Botas de segurança", grupo="Proteção", detalhe="Proteção dos pés durante a coleta", icone="check"),
    dict(codigo="colete", nome="Colete refletivo", grupo="Proteção", detalhe="Visibilidade no trajeto", icone="check"),
    dict(codigo="carrinho", nome="Carrinho de carga", grupo="Transporte", detalhe="Apoio para volumes maiores", icone="truck"),
    dict(codigo="cordas", nome="Cintas de amarração", grupo="Transporte", detalhe="Organizar e prender a carga", icone="truck"),
    dict(codigo="sacos", nome="Sacos de separação", grupo="Organização", detalhe="Separar os materiais por tipo", icone="box"),
    dict(codigo="caixas", nome="Caixas rígidas", grupo="Organização", detalhe="Acomodar materiais separadamente", icone="box"),
    dict(codigo="lona", nome="Lona de apoio", grupo="Organização", detalhe="Apoio durante a organização da carga", icone="box"),
    dict(codigo="lanterna", nome="Lanterna", grupo="Apoio", detalhe="Auxílio em locais com pouca iluminação", icone="plus"),
]


def validar_equipamentos(codigos):
    """Aceita somente opções conhecidas e remove duplicatas sem mudar a ordem."""
    from servicos.operacao import Recusa
    if any(c not in {e["codigo"] for e in EQUIPAMENTOS} for c in codigos):
        raise Recusa("Escolha equipamentos do catálogo da coleta.", 422)
    return list(dict.fromkeys(codigos))


def recomendar_kit(materiais, peso_estimado):
    """Regras explicáveis: identifica cuidados e apoio de transporte, sem reservar itens."""
    import re
    import unicodedata
    texto = unicodedata.normalize("NFKD", " ".join(materiais).casefold())
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    kit = ["balanca", "luvas", "sacos"]
    fragil = re.search(r"\b(?:vidros?|cacos?|ceramica|espelhos?|eletronic[oa]s?|baterias?|pilhas?)\b", texto)
    volumoso = re.search(r"\b(?:moveis|eletrodomesticos?|volumosos?|sucata|chapas?)\b", texto)
    if fragil:
        kit.extend(["caixas", "botas"])
    if volumoso or (peso_estimado is not None and peso_estimado >= 15):
        kit.extend(["carrinho", "cordas", "botas"])
    return list(dict.fromkeys(kit))
