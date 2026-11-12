import { fmtKg, interpret, shortNames, toItem } from './assistant';
import { REWARDS_GOAL_ID } from '../data/mock';
import type {
  AiDraft,
  ChatMode,
  ChatOption,
  DetectedItem,
  QuickAction,
  ResidentPickup,
  Reward,
} from '../types';

export interface BrainCtx {
  mode: ChatMode;
  points: number;
  pickups: ResidentPickup[];
  rewards: Reward[];
  knownItems: DetectedItem[];
}

export const CLARIFY_QUESTION =
  'Isso parece embalagem longa vida, mas contém alumínio por dentro. Devo separar como metal ou cartonado?';

export const CLARIFY_OPTIONS: ChatOption[] = [
  {
    value: 'cartonado',
    label: 'Cartonado',
    hint: 'Vai junto com papel. É o certo para caixas de leite e suco.',
    recommended: true,
  },
  { value: 'metal', label: 'Metal', hint: 'Só se for lata de verdade, sem papel por fora.' },
];

export const RESIDENT_ACTIONS: QuickAction[] = [
  { label: 'Agendar coleta', prompt: 'Quero agendar uma coleta', icon: 'calendar' },
  { label: 'Meus pontos', prompt: 'Quantos pontos eu tenho?', icon: 'wallet' },
  { label: 'Minhas coletas', prompt: 'Mostrar minhas coletas', icon: 'package' },
  { label: 'Benefícios', prompt: 'Quais benefícios posso resgatar?', icon: 'gift' },
  { label: 'Meu impacto', prompt: 'Qual é o meu impacto?', icon: 'leaf' },
  { label: 'Como separar?', prompt: 'Como separo vidro e óleo?', icon: 'help' },
];

const RX = {
  schedule:
    /agend|marcar|buscar|busquem|recolher|retirar|quero (uma |a )?coleta|pedir (uma )?coleta|nova coleta/,
  rate: /avali|nota|estrela/,
  redeem: /resgat|troc/,
  points: /ponto|saldo|quanto (eu )?tenho/,
  rewards: /benef|recompens|feira|loja|desconto|prêmio|premio|\bvale\b/,
  pickups: /coleta|histórico|historico|status|próxima|proxima|quando|pesad|acompanh/,
  impact: /impacto|co2|co₂|meio ambiente|ajudei|planeta|economizei/,
  greet: /^(oi|olá|ola|bom dia|boa tarde|boa noite|e aí|eai)\b/,
  thanks: /obrigad|valeu/,
};

const HAZARD_TEXT =
  'Pilhas, baterias, lâmpadas e remédios não vão na coleta seletiva — podem contaminar o resto. Leve a um ponto de entrega em farmácias ou supermercados.';

export const DEFAULT_ITEMS = () => [toItem('vidro'), toItem('plastico'), toItem('metal')];

export function materialsDraft(items: DetectedItem[], mode: ChatMode, intro?: string): AiDraft {
  return {
    text:
      intro ??
      `Pode sim! A cooperativa aceita ${items.length === 1 ? 'esse material' : 'esses materiais'}. Veja como preparar:`,
    widget: { type: 'materials', items },
    actions: [
      {
        label: mode === 'visitor' ? 'Quero agendar a coleta' : 'Agendar coleta desses itens',
        prompt: `Quero agendar a coleta de ${shortNames(items)}`,
        icon: 'calendar',
      },
    ],
  };
}

export function signupDraft(items: DetectedItem[]): AiDraft {
  const what = items.length ? `a coleta de ${shortNames(items)}` : 'uma coleta';
  return {
    text: `Para agendar ${what}, entre na sua conta ou crie um acesso rápido. Leva menos de 1 minuto e eu guardo tudo o que você me contou.`,
    widget: { type: 'signup', items },
  };
}

export function scheduleDraft(items: DetectedItem[], text?: string, conflict = false): AiDraft {
  return {
    text: text ?? `Preparei o agendamento de ${shortNames(items)}. Já escolhi o melhor horário — é só conferir e confirmar.`,
    widget: { type: 'schedule', items, conflict },
  };
}

export function respond(raw: string, ctx: BrainCtx): AiDraft[] {
  const t = raw.toLowerCase().trim();
  const r = interpret(t);
  const wantsSchedule = RX.schedule.test(t);

  if (r.hazard) return [{ text: HAZARD_TEXT }];

  if (r.ambiguous) {
    return [
      {
        text: 'Antes de responder, preciso confirmar uma coisa:',
        widget: {
          type: 'clarify',
          question: CLARIFY_QUESTION,
          options: CLARIFY_OPTIONS,
          pending: r.items,
          then: wantsSchedule ? 'schedule' : 'guide',
        },
      },
    ];
  }

  if (ctx.mode === 'visitor') {
    if (wantsSchedule || RX.redeem.test(t) || RX.points.test(t) || RX.rate.test(t) || RX.rewards.test(t)) {
      return [signupDraft(r.items.length ? r.items : ctx.knownItems)];
    }
    if (r.items.length)
      return [materialsDraft(r.items, 'visitor', /como/.test(t) ? 'Assim você prepara cada um:' : undefined)];
    if (RX.greet.test(t)) return [{ text: 'Oi! Me conte o que você tem em casa para reciclar.' }];
    return [
      {
        text: 'Não reconheci esse material. Tente contar de outro jeito, por exemplo: “garrafas PET e latas”.',
      },
    ];
  }

  // Resident: everything is answered here, in the conversation.
  const unrated = ctx.pickups.find((p) => p.status === 'pesada' && !p.rated);
  const goal = ctx.rewards.find((x) => x.id === REWARDS_GOAL_ID)!;
  const missing = Math.max(0, goal.cost - ctx.points);

  if (wantsSchedule) {
    const items = r.items.length ? r.items : ctx.knownItems.length ? ctx.knownItems : DEFAULT_ITEMS();
    const text = r.items.length || ctx.knownItems.length
      ? undefined
      : 'Preparei o agendamento com os materiais que você costuma separar. Já escolhi o melhor horário — é só conferir.';
    return [scheduleDraft(items, text)];
  }

  if (RX.rate.test(t)) {
    if (!unrated) return [{ text: 'Todas as suas coletas já foram avaliadas. Obrigada!' }];
    return [
      {
        text: `Sua coleta de ${unrated.dateLabel.toLowerCase()} teve ${fmtKg(unrated.totalKg ?? 0)} kg. Já escrevi um agradecimento — só falta sua nota para liberar +25 pontos.`,
        widget: { type: 'rating', pickupId: unrated.id },
      },
    ];
  }

  if (RX.redeem.test(t) || (RX.rewards.test(t) && !RX.points.test(t))) {
    return [
      {
        text:
          missing > 0
            ? `Faltam ${missing} pontos para o desconto na feira.${unrated ? ' Avaliar a coleta de terça rende +25 — já resolve!' : ''}`
            : 'Você já pode resgatar o desconto na feira! Toque em “Resgatar”.',
        widget: { type: 'rewards', highlight: REWARDS_GOAL_ID },
        actions: missing > 0 && unrated ? [{ label: 'Avaliar e ganhar 25 pontos', prompt: 'Quero avaliar minha coleta', icon: 'star' }] : undefined,
      },
    ];
  }

  if (RX.points.test(t)) {
    return [
      {
        text: `Você tem ${ctx.points} pontos.${missing > 0 ? ` Faltam ${missing} para o desconto na feira.` : ' Já dá para o desconto na feira!'}`,
        widget: { type: 'points' },
        actions: [
          missing > 0 && unrated
            ? { label: 'Ganhar 25 pontos agora', prompt: 'Quero avaliar minha coleta', icon: 'star' }
            : { label: 'Ver benefícios', prompt: 'Quais benefícios posso resgatar?', icon: 'gift' },
        ],
      },
    ];
  }

  if (RX.impact.test(t)) {
    return [{ text: 'Olha só o que você já fez pelo bairro:', widget: { type: 'impact' } }];
  }

  if (r.items.length)
    return [materialsDraft(r.items, 'resident', /como/.test(t) ? 'Assim você prepara cada um:' : undefined)];

  if (RX.pickups.test(t)) {
    const next = ctx.pickups.find((p) => p.status === 'agendada');
    return [
      {
        text: next
          ? `Sua próxima coleta é ${next.dateLabel.toLowerCase()}, das ${next.slot}. Aqui está o resumo de todas:`
          : 'Aqui estão suas coletas e o status de cada uma:',
        widget: { type: 'pickups' },
      },
    ];
  }

  if (RX.thanks.test(t)) return [{ text: 'Por nada! Estou aqui sempre que precisar.' }];
  if (RX.greet.test(t)) return [{ text: 'Oi, Carlos! O que vamos fazer hoje?', actions: RESIDENT_ACTIONS }];

  return [
    {
      text: 'Ainda não sei responder isso. Mas consigo resolver tudo isto aqui mesmo, sem você sair da conversa:',
      actions: RESIDENT_ACTIONS,
    },
  ];
}
