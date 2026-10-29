"""Referências fornecidas pelo usuário; valores fictícios, sem cotação de mercado ao vivo."""
from decimal import Decimal, ROUND_HALF_UP
import configuracao

# O serviço centraliza preços e cuidados; equivalências nunca substituem a balança.
ITENS = [
    ("cobre", "Cobre", "25.00", "35.00", "Fios e cabos desencapados", "Não queime fios nem desmonte equipamentos energizados."),
    ("aluminio", "Latinhas de alumínio", "6.00", "9.30", "65 a 70 latinhas ≈ 1 kg", ""),
    ("pet", "Garrafas PET", "2.50", "4.50", "20 garrafas de 2 litros ≈ 1 kg", ""),
    ("plastico_duro", "Plástico duro (PEAD/PP)", "1.80", "3.40", "15 a 20 frascos ≈ 1 kg", ""),
    ("plastico_filme", "Plástico filme", "1.50", "2.50", "Sacolas e plásticos de fardo limpos; pesar", ""),
    ("ferro", "Ferro / sucata", "0.50", "1.10", "Peças e ferragens; pesar", "Proteja pontas e bordas cortantes."),
    ("papel_branco", "Papel branco", "0.60", "1.00", "200 folhas sulfite A4 ≈ 1 kg", ""),
    ("longa_vida", "Caixas longa vida", "0.60", "1.00", "35 caixas de 1 litro ≈ 1 kg", ""),
    ("papelao", "Papelão", "0.55", "0.90", "Caixas desmontadas e secas; pesar", ""),
    ("vidro_transparente", "Vidro transparente", "0.35", "0.65", "2 a 3 garrafas grandes ≈ 1 kg", "Não deixe cacos soltos. Use embalagem rígida identificada; avise a equipe sobre vidro quebrado."),
    ("papel_misto", "Papel misto", "0.20", "0.70", "Jornais, revistas e panfletos; pesar", ""),
    ("vidro_colorido", "Vidro colorido / misto", "0.20", "0.30", "2 a 3 garrafas ≈ 1 kg", "Proteja e identifique a embalagem. Não misture cacos aos demais materiais."),
    ("eletronicos", "Eletrônicos", None, None, "Recebimento sujeito à orientação da cooperativa; sem recompensa tabelada", "Não desmonte, perfure ou molhe aparelhos e baterias. Separe dos recicláveis comuns e combine a destinação com a equipe."),
]


def catalogo():
    """Expõe a mesma regra ao formulário e ao cálculo autorizado no servidor."""
    return {"pontos_por_real": 100, "percentual_morador": configuracao.percentual_morador,
            "ficticio": True, "itens": [dict(codigo=c, nome=n, minimo=a, maximo=b,
            referencia=ref, cuidado=aviso, valor_morador_kg=str(tarifa(c)) if a else None)
            for c, n, a, b, ref, aviso in ITENS]}


def tarifa(codigo):
    """Preserva quatro casas na tarifa e arredonda apenas a recompensa final."""
    item = next((i for i in ITENS if i[0] == codigo), None)
    if item is None:
        raise ValueError("Escolha uma categoria com preço por quilo na tabela.")
    if item[2] is None:
        return Decimal("0")
    return (Decimal(item[2]) + Decimal(item[3])) / 2 * Decimal(configuracao.percentual_morador) / 100


def calcular_pontos(pesagens):
    """Um ponto representa um centavo fictício; dividir uma pesagem não aumenta o crédito."""
    total = sum((Decimal(str(p.quilos)) * p.valor_kg for p in pesagens), Decimal(0))
    return int((total * 100).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
