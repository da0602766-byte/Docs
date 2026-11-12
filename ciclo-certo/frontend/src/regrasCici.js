// A Cici interpreta as intenções do protótipo e usa as categorias do catálogo publicado.
const materiais = [
  ["longa_vida", /\b(?:longa vida|tetra ?pak|caixas? de (?:leite|suco)|cartonad\w*)\b/, "Esvazie, enxágue e deixe secar. A embalagem inteira tem sua própria categoria."],
  ["papelao", /\b(?:papelao|caixas? de papelao)\b/, "Desmonte as caixas e mantenha o papelão seco, sem gordura ou restos de comida."],
  ["papel_branco", /\b(?:sulfite|papel branco|a4)\b/, "Mantenha as folhas limpas e secas."],
  ["papel_misto", /\b(?:jorn(?:al|ais)|revistas?|panfletos?|papel misto|pape(?:l|is))\b/, "Separe o papel limpo e seco. Descarte partes engorduradas separadamente."],
  ["pet", /\b(?:pet|garrafas? (?:plasticas?|de plastico))\b/, "Esvazie a garrafa e deixe secar antes de entregar."],
  ["plastico_duro", /\b(?:pead|pp|plastico duro|frascos? de (?:xampu|shampoo|detergente))\b/, "Esvazie os frascos, retire os resíduos e deixe secar."],
  ["plastico_filme", /\b(?:plastico filme|sacolas?|filme plastico)\b/, "Separe sacolas e filmes limpos, sem resíduos de comida."],
  ["vidro_colorido", /\bvidro (?:colorido|misto)\b/, "Separe o vidro colorido. Proteja cacos numa embalagem rígida identificada."],
  ["vidro_transparente", /\b(?:vidros?|cacos?)\b/, "Esvazie os recipientes. Proteja cacos numa embalagem rígida identificada e avise a equipe."],
  ["aluminio", /\b(?:aluminio|latas?|latinhas?)\b/, "Esvazie as latas, retire os resíduos e deixe secar."],
  ["ferro", /\b(?:ferro|sucata|ferragens?|aco)\b/, "Proteja pontas e bordas cortantes e informe a equipe."],
  ["cobre", /\b(?:cobre|fios?|cabos?)\b/, "Separe os fios. Evite queimar cabos ou desmontar aparelhos energizados."],
  ["eletronicos", /\b(?:eletronicos?|baterias?|pilhas?|celulares?)\b/, "Mantenha separado dos recicláveis comuns. Combine a destinação com a cooperativa antes de agendar."],
];

export function normalizarCici(texto) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Cada item só pode prefillar categorias ativas. Materiais sem categoria recebem orientação.
export function consultarMateriais(texto, catalogo) {
  const normalizado = normalizarCici(texto);
  const encontrado = materiais.filter(([codigo, regra]) => {
    if (codigo === "aluminio" && materiais[0][1].test(normalizado) && !/\b(?:latas?|latinhas?)\b/.test(normalizado)) return false;
    if (codigo === "papel_misto" && /\bpapel (?:branco|sulfite)\b/.test(normalizado) && !/\b(?:jornal|jornais|revista|revistas|papel misto)\b/.test(normalizado)) return false;
    if (codigo === "vidro_transparente" && materiais[7][1].test(normalizado) && !/\btransparente\b/.test(normalizado)) return false;
    return regra.test(normalizado);
  });
  const itens = encontrado.flatMap(([codigo, , orientacao]) => {
    const item = catalogo?.itens.find((registro) => registro.codigo === codigo);
    return item ? [{ ...item, orientacao }] : [];
  });
  const avisos = [];
  if (/\b(?:oleo|gordura)\b/.test(normalizado))
    avisos.push("Para óleo de cozinha usado, guarde o líquido frio em uma garrafa fechada e confirme um ponto de entrega com a cooperativa.");
  if (/\b(?:lampadas?|remedios?|medicamentos?)\b/.test(normalizado))
    avisos.push("Lâmpadas e medicamentos precisam de destinação separada. Consulte um ponto de recebimento específico.");
  let pergunta = null;
  if (/\bgarrafas?\b/.test(normalizado) && !/\b(?:pet|vidro|plastico|plasticas?|oleo)\b/.test(normalizado)) {
    pergunta = { texto: "As garrafas são de vidro ou de plástico PET?", opcoes: ["Garrafas de vidro", "Garrafas PET"] };
  } else if (/\bplasticos?\b/.test(normalizado) && !itens.some((item) => ["pet", "plastico_duro", "plastico_filme"].includes(item.codigo))) {
    pergunta = { texto: "Que tipo de plástico você separou?", opcoes: ["Garrafas PET", "Plástico duro", "Sacolas e plástico filme"] };
  } else if (materiais[0][1].test(normalizado) && /\baluminio\b/.test(normalizado) && !/\b(?:latas?|latinhas?)\b/.test(normalizado)) {
    pergunta = { texto: "A camada de alumínio faz parte da caixa longa vida ou é uma lata separada?", opcoes: ["Caixa longa vida", "Caixa longa vida e uma latinha"] };
  }
  return { itens, avisos, pergunta };
}

export function responderSobreValores(texto, catalogo, materiaisConhecidos) {
  const consulta = normalizarCici(texto);
  if (!/\b(?:materia(?:l|is)|it(?:em|ens)|reciclaveis?|vale[m]?|valor(?:es)?|pontos)\b/.test(consulta)) return null;
  if (!/\b(?:mais (?:valorizad\w*|car[oa]s?|pontos)|vale[m]? mais|maior(?:es)? valor(?:es)?|melhor(?:es)? pag\w*)\b/.test(consulta)) return null;
  if (materiaisConhecidos.length === 1) return null;

  const candidatos = materiaisConhecidos.length > 1 ? materiaisConhecidos : catalogo?.itens || [];
  const maiorValor = candidatos
    .filter((item) => Number(item.valor_morador_kg) > 0)
    .sort((a, b) => Number(b.valor_morador_kg) - Number(a.valor_morador_kg))
    .slice(0, 3);
  if (!maiorValor.length) return null;

  const escala = Number(catalogo.pontos_por_real) || 100;
  const pontos = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const lista = maiorValor.map((item) =>
    `• ${item.nome}: ${pontos.format(Number(item.valor_morador_kg) * escala)} pontos/kg`).join("\n");
  return `Pela tabela do Ciclo Certo, estes rendem mais pontos por quilo:\n${lista}\nOs pontos finais dependem da pesagem e da avaliação da coleta.`;
}

export function intencaoCici(texto) {
  const consulta = normalizarCici(texto);
  if (/\b(?:reagend\w*|agend\w*|marcar|solicitar|pedir)\b/.test(consulta) && !/\b(?:agendada|agendadas|agendado|agendados)\b/.test(consulta)) return "agendar";
  if (/\b(?:quero|pedir|solicitar|buscar|recolher)\b.*\bcoleta\b/.test(consulta) && !/\b(?:avali\w*|ver|acompanhar|cancelar|consultar)\b/.test(consulta)) return "agendar";
  if (/\b(?:avali\w*|estrelas?)\b/.test(consulta)) return "avaliar";
  if (/\b(?:loja|mercado|resgat\w*|troc\w*|recompensas?|beneficios?)\b/.test(consulta)) return "carteira";
  if (/\b(?:pontos|saldo)\b/.test(consulta)) return "pontos";
  if (/\b(?:impacto|co2|quilos reciclad\w*)\b/.test(consulta)) return "impacto";
  if (/\b(?:notific\w*|avisos?)\b/.test(consulta)) return "avisos";
  if (/\b(?:comunidade|publica\w*|post\w*|videos?)\b/.test(consulta)) return "comunidade";
  if (/\b(?:minhas coletas|coletas|historico|proxima coleta|status|acompanhar|cancelar|coleta agendada)\b/.test(consulta)) return "minhas";
  return null;
}

// Pesos só preenchem a categoria quando a descrição identifica um item do catálogo.
export function interpretarPesos(texto, catalogo) {
  const partes = texto.trim().replace(/^pesad[oa]s?:?\s*/i, "").split(/\s*(?:;|\n|,(?!\d)|\be\b)\s*/i).filter(Boolean);
  return partes.map((parte) => {
    const medida = parte.match(/(?:^|\s)(\d{1,9}(?:[.,]\d{1,3})?)\s*(?:kg\b|quilos?\b)/i);
    if (!medida || Number(medida[1].replace(",", ".")) <= 0) return null;
    const { itens, pergunta } = consultarMateriais(parte, catalogo);
    if (pergunta || itens.length !== 1) return null;
    return { codigo: itens[0].codigo, nome: itens[0].nome, quilos: medida[1].replace(",", ".") };
  });
}

const chaveRascunho = "cc-cici-materiais";

// Somente nomes do catálogo passam entre a landing page e a agenda da mesma aba.
export function guardarRascunhoCici(itens) {
  try { sessionStorage.setItem(chaveRascunho, JSON.stringify(itens.map((item) => item.codigo))); } catch { /* A navegação ainda funciona. */ }
}

export function lerRascunhoCici(catalogo) {
  try {
    const codigos = JSON.parse(sessionStorage.getItem(chaveRascunho) || "[]");
    return Array.isArray(codigos) ? catalogo.itens.filter((item) => codigos.includes(item.codigo)) : [];
  } catch {
    return [];
  }
}

export function limparRascunhoCici() {
  try { sessionStorage.removeItem(chaveRascunho); } catch { /* A agenda continua disponível. */ }
}
