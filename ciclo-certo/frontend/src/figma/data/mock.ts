import type { CoopOrder, FeedItem, ResidentPickup, Reward, Slot } from '../types';

export const REWARDS_GOAL_ID = 'feira';

export const RESIDENT_ADDRESS = 'Rua Amazonas, 1420 — Apto 302, Garcia';

export const SLOTS: Slot[] = [
  {
    id: 's1',
    day: 'Quinta, 16 mai',
    time: '9h às 11h',
    spotsLeft: 1,
    suggested: true,
    reason: 'Tem carrinho reforçado para vidro nesse horário',
  },
  { id: 's2', day: 'Quinta, 16 mai', time: '14h às 16h', spotsLeft: 4 },
  { id: 's3', day: 'Sexta, 17 mai', time: '8h às 10h', spotsLeft: 6 },
  { id: 's4', day: 'Sábado, 18 mai', time: '9h às 11h', spotsLeft: 3 },
];

export const INITIAL_PICKUPS: ResidentPickup[] = [
  {
    id: 'CC-8492',
    dateLabel: 'Terça, 14 mai',
    slot: '8h às 9h',
    address: RESIDENT_ADDRESS,
    status: 'pesada',
    totalKg: 6.8,
    points: 145,
    rated: false,
    items: [
      { key: 'vidro', name: 'Vidro', kg: 3.8 },
      { key: 'plastico', name: 'Plástico PET', kg: 1.9 },
      { key: 'metal', name: 'Latas', kg: 1.1 },
    ],
  },
  {
    id: 'CC-8377',
    dateLabel: 'Terça, 30 abr',
    slot: '8h às 9h',
    address: RESIDENT_ADDRESS,
    status: 'concluida',
    totalKg: 5.1,
    points: 98,
    rated: true,
    stars: 5,
    items: [
      { key: 'papel', name: 'Papelão', kg: 3.4 },
      { key: 'plastico', name: 'Plástico PET', kg: 1.7 },
    ],
  },
];

export const REWARDS: Reward[] = [
  {
    id: 'feira',
    title: 'Desconto na Feira Orgânica',
    partner: 'Feira do Produtor · Sábados',
    cost: 340,
    value: 'R$ 15 de desconto',
  },
  {
    id: 'onibus',
    title: 'Passagens de ônibus',
    partner: 'Transporte Municipal',
    cost: 380,
    value: '2 passagens',
  },
  {
    id: 'composteira',
    title: 'Kit composteira doméstica',
    partner: 'CoopRecicla Garcia',
    cost: 450,
    value: '1 kit completo',
  },
  {
    id: 'iptu',
    title: 'Desconto na taxa de lixo',
    partner: 'Prefeitura Municipal',
    cost: 600,
    value: 'R$ 28 de desconto',
  },
];

export const INITIAL_FEED: FeedItem[] = [
  {
    id: 'f1',
    kind: 'coleta',
    title: 'Sua coleta foi pesada',
    body: '6,8 kg de vidro, plástico e latas. +145 pontos creditados.',
    time: 'Terça, 10h42',
    ask: 'Como foi minha coleta de terça?',
  },
  {
    id: 'f2',
    kind: 'dica',
    title: 'Dica da Cici: tampinhas',
    body: 'Junte as tampinhas plásticas num saquinho. Soltas, elas se perdem na triagem.',
    time: 'Hoje',
    ask: 'Como separo plástico?',
  },
  {
    id: 'f3',
    kind: 'comunidade',
    title: 'Bairro Garcia: 1,2 tonelada em maio',
    body: 'Seu bairro já reciclou 1.240 kg este mês. Meta: 1.500 kg.',
    time: 'Ontem',
    ask: 'Qual é o meu impacto?',
    progress: 83,
  },
  {
    id: 'f4',
    kind: 'beneficio',
    title: 'Novo parceiro: Feira do Produtor',
    body: 'Troque 340 pontos por R$ 15 de desconto aos sábados.',
    time: 'Há 2 dias',
    ask: 'Quero resgatar o desconto na feira',
  },
  {
    id: 'f5',
    kind: 'comunidade',
    title: 'Mais coletas às quintas',
    body: 'A CoopRecicla Garcia abriu uma nova rota com carrinho reforçado para vidro.',
    time: 'Há 3 dias',
    ask: 'Quero agendar uma coleta',
  },
  {
    id: 'f6',
    kind: 'pontos',
    title: 'Avaliação de 30 abr',
    body: 'Você deu 5 estrelas. +25 pontos de bônus.',
    time: '30 abr',
  },
];

/** Simulated "now" for the cooperative's operations day. */
export const NOW_HOUR = 10 + 20 / 60;

export const ROUTES = {
  1: { name: 'Rota 1', team: 'Joana Lima', vehicle: 'Triciclo elétrico', capacity: 80 },
  2: { name: 'Rota 2', team: 'Roberto e Ana', vehicle: 'Carrinho padrão', capacity: 40 },
} as const;
export const HEAVY_CART = { vehicle: 'Carrinho reforçado', capacity: 120 };

const o = (
  id: string,
  resident: string,
  address: string,
  start: number,
  end: number,
  route: 1 | 2,
  status: CoopOrder['status'],
  priority: CoopOrder['priority'],
  reasons: string[],
  expected: CoopOrder['expected'],
  heavyGlass = false
): CoopOrder => ({ id, resident, address, start, end, route, status, priority, reasons, expected, heavyGlass });

export const COOP_ORDERS: CoopOrder[] = [
  {
    ...o('CC-8492', 'Carlos Mendes', 'Rua Amazonas, 1420', 8, 9, 2, 'done', 'normal', [], [
      { key: 'vidro', name: 'Vidro', kg: 3.5 },
      { key: 'plastico', name: 'Plástico PET', kg: 1.8 },
      { key: 'metal', name: 'Latas', kg: 1 },
    ]),
    weighed: [
      { key: 'vidro', name: 'Vidro', kg: 3.8 },
      { key: 'plastico', name: 'Plástico PET', kg: 1.9 },
      { key: 'metal', name: 'Latas', kg: 1.1 },
    ],
    points: 145,
  },
  {
    ...o('CC-8501', 'Ana Ribeiro', 'Rua Bahia, 88', 8.5, 9.5, 1, 'done', 'normal', [], [
      { key: 'papel', name: 'Papelão', kg: 5 },
    ]),
    weighed: [{ key: 'papel', name: 'Papelão', kg: 5.2 }],
    points: 62,
  },
  o(
    'CC-8510',
    'Helena Vasconcelos',
    'Rua da Glória, 415',
    10,
    11,
    2,
    'doing',
    'alta',
    ['Vidro pesado', 'Em atendimento há 12 min'],
    [
      { key: 'plastico', name: 'Plástico PET', kg: 3 },
      { key: 'papel', name: 'Papelão', kg: 1.5 },
      { key: 'vidro', name: 'Garrafões de vidro', kg: 4 },
    ],
    true
  ),
  o(
    'CC-8514',
    'Condomínio Solar das Palmeiras',
    'Rua Progresso, 890',
    11,
    12,
    2,
    'todo',
    'urgente',
    ['Maior volume do dia', 'Janela fecha às 12h', 'Vidro pesado'],
    [
      { key: 'vidro', name: 'Vidro', kg: 8.5 },
      { key: 'metal', name: 'Latas', kg: 3.4 },
    ],
    true
  ),
  o('CC-8519', 'Marcos Rocha', 'Rua Araranguá, 212', 13.5, 14.5, 1, 'todo', 'normal', ['Só papel'], [
    { key: 'papel', name: 'Papel', kg: 4 },
  ]),
  o(
    'CC-8516',
    'Bar do Zeca',
    'Rua Hermann Hering, 51',
    13,
    14,
    2,
    'todo',
    'alta',
    ['Vidro pesado (12 kg)', 'Comércio fecha às 14h'],
    [
      { key: 'vidro', name: 'Garrafas de vidro', kg: 12 },
      { key: 'metal', name: 'Latas', kg: 2 },
    ],
    true
  ),
  o('CC-8521', 'Juliana Prates', 'Rua Paraíba, 300', 14, 15, 1, 'todo', 'normal', ['Primeira coleta'], [
    { key: 'plastico', name: 'Plástico', kg: 2 },
    { key: 'metal', name: 'Latas', kg: 1 },
  ]),
  o('CC-8523', 'Pedro Alves', 'Rua Goiás, 77', 14, 15, 2, 'todo', 'normal', ['Óleo: levar galão vedado'], [
    { key: 'oleo', name: 'Óleo de cozinha', kg: 2 },
  ]),
  o('CC-8524', 'Escola Municipal Garcia', 'Rua Amazonas, 2100', 14.5, 15.5, 1, 'todo', 'normal', ['Papel 9 kg'], [
    { key: 'papel', name: 'Papel', kg: 9 },
  ]),
  o('CC-8526', 'Sônia Freitas', 'Rua Pará, 140', 15, 16, 2, 'todo', 'normal', ['Moradora idosa: ajudar a carregar'], [
    { key: 'plastico', name: 'Plástico', kg: 1.5 },
    { key: 'vidro', name: 'Potes de vidro', kg: 1 },
  ]),
  o('CC-8527', 'Lucas Martins', 'Rua Maranhão, 63', 15.5, 16.5, 1, 'todo', 'normal', [], [
    { key: 'metal', name: 'Latas', kg: 2.2 },
  ]),
  o('CC-8529', 'Padaria Pão Quente', 'Rua da Glória, 980', 16, 17, 2, 'todo', 'normal', ['Comércio'], [
    { key: 'papel', name: 'Papelão', kg: 3 },
    { key: 'plastico', name: 'Plástico', kg: 2 },
  ]),
  o('CC-8530', 'Rita Oliveira', 'Rua Amapá, 22', 16.5, 17.5, 1, 'todo', 'normal', ['Óleo: levar galão vedado'], [
    { key: 'oleo', name: 'Óleo de cozinha', kg: 1.5 },
    { key: 'plastico', name: 'Plástico', kg: 1 },
  ]),
  o('CC-8532', 'Tiago Souza', 'Rua Acre, 410', 17, 18, 1, 'todo', 'normal', [], [
    { key: 'papel', name: 'Papel', kg: 2 },
    { key: 'metal', name: 'Latas', kg: 1 },
  ]),
];
