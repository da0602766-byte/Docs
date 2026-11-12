import type { DetectedItem, MaterialInfo, MaterialKey, WeighedItem } from '../types';

export const MATERIALS: Record<MaterialKey, MaterialInfo> = {
  vidro: {
    key: 'vidro',
    name: 'Vidro',
    short: 'vidro',
    rule: 'Lave rapidinho, tire as tampas e embrulhe em jornal ou caixa para ninguém se cortar.',
    pointsPerKg: 15,
    typicalKg: 2,
  },
  oleo: {
    key: 'oleo',
    name: 'Óleo de cozinha',
    short: 'óleo',
    rule: 'Espere esfriar, coe e guarde em garrafa PET bem fechada. Nunca jogue na pia.',
    pointsPerKg: 25,
    typicalKg: 1.5,
  },
  metal: {
    key: 'metal',
    name: 'Latas e metais',
    short: 'latas',
    rule: 'Esvazie, dê uma enxaguada e amasse para ocupar menos espaço.',
    pointsPerKg: 30,
    typicalKg: 1,
  },
  plastico: {
    key: 'plastico',
    name: 'Plástico e PET',
    short: 'plástico',
    rule: 'Enxágue, tire o excesso de líquido e, se puder, amasse as garrafas.',
    pointsPerKg: 20,
    typicalKg: 1.5,
  },
  papel: {
    key: 'papel',
    name: 'Papel e papelão',
    short: 'papel',
    rule: 'Mantenha seco e desmonte as caixas. Papel engordurado não vale.',
    pointsPerKg: 12,
    typicalKg: 2,
  },
  cartonado: {
    key: 'cartonado',
    name: 'Caixas longa vida',
    short: 'caixas longa vida',
    rule: 'Enxágue, deixe escorrer e achate. Vai junto com o cartonado, não com metal.',
    pointsPerKg: 16,
    typicalKg: 1,
  },
};

export const MATERIAL_ORDER: MaterialKey[] = ['vidro', 'plastico', 'metal', 'papel', 'oleo', 'cartonado'];

const MATCHERS: Array<[MaterialKey, RegExp]> = [
  ['oleo', /óleo|oleo/],
  ['vidro', /vidro/],
  ['metal', /lata|alumínio|aluminio|metal/],
  ['plastico', /\bpet\b|plástico|plastico|garrafinha/],
  ['papel', /papel|jornal|revista/],
];

const AMBIGUOUS = /longa vida|caixas? de leite|caixinhas?|tetra ?pak/;
const AMBIGUOUS_STRIP =
  /(caixas? de leite|caixinhas?( de (leite|suco))?|longa vida|tetra ?pak|(com )?alum[ií]nio por dentro)/g;
const HAZARD = /pilhas?|baterias?|lâmpadas?|lampadas?|remédios?|remedios?/;

export function toItem(key: MaterialKey): DetectedItem {
  const m = MATERIALS[key];
  return { key, name: m.name, rule: m.rule, kg: m.typicalKg };
}

/** Simulated natural-language understanding for residents. */
export function interpret(raw: string) {
  const text = raw.toLowerCase();
  const ambiguous = AMBIGUOUS.test(text);
  const cleaned = text.replace(AMBIGUOUS_STRIP, ' ');
  const items = MATCHERS.filter(([, re]) => re.test(cleaned)).map(([key]) => toItem(key));
  return { ambiguous, items, hazard: HAZARD.test(text) };
}

const WEIGHT_RE =
  /(\d+(?:[.,]\d+)?)\s*(?:kg|quilos?|kilos?)\s*(?:de\s+)?([a-zà-úç]+(?:\s+[a-zà-úç]+)?)/gi;

/** Turns "Pesado: 3.2kg de PET, 1.5kg de papelão" into structured rows. */
export function parseWeights(raw: string): WeighedItem[] {
  const out: WeighedItem[] = [];
  for (const m of raw.toLowerCase().matchAll(WEIGHT_RE)) {
    const kg = parseFloat(m[1].replace(',', '.'));
    const word = m[2];
    let key: MaterialKey | null = MATCHERS.find(([, re]) => re.test(word))?.[0] ?? null;
    if (!key && /longa|caixinha|cartonado/.test(word)) key = 'cartonado';
    if (!key || !kg) continue;
    let name = MATERIALS[key].name;
    if (key === 'plastico' && /pet/.test(word)) name = 'Plástico PET';
    if (key === 'papel' && /papel(ã|a)o/.test(word)) name = 'Papelão';
    out.push({ key, name, kg });
  }
  return out;
}

export function fmtKg(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

export function joinPt(words: string[]) {
  if (words.length <= 1) return words[0] ?? '';
  return `${words.slice(0, -1).join(', ')} e ${words[words.length - 1]}`;
}

export function shortNames(items: { key: MaterialKey }[]) {
  return joinPt(items.map((i) => MATERIALS[i.key].short));
}

export function pointsFor(items: { key: MaterialKey; kg: number }[]) {
  return items.reduce((s, i) => s + Math.round(i.kg * MATERIALS[i.key].pointsPerKg), 0);
}

export const uid = () => Math.random().toString(36).slice(2, 9);

/** 13.5 -> "13h30" */
export function fmtHour(h: number) {
  const m = Math.round((h % 1) * 60);
  return `${Math.floor(h)}h${m ? String(m).padStart(2, '0') : ''}`;
}
