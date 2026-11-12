export type MaterialKey = 'vidro' | 'oleo' | 'metal' | 'plastico' | 'papel' | 'cartonado';

/** Visible states of the assistant (Idle, Thinking, Clarifying, Ready for Review, Offline). */
export type AiStatus = 'idle' | 'thinking' | 'clarifying' | 'ready' | 'offline';

export type Screen = 'visitor' | 'resident' | 'coop-dispatch' | 'coop-field';
export type ChatMode = 'visitor' | 'resident';

export type DemoScreen = '1.1' | '1.2' | '2.1' | '2.2' | '3.1' | '3.2';
export type DemoCase = 'ambiguity' | 'conflict' | 'missing' | 'offline';

export interface MaterialInfo {
  key: MaterialKey;
  name: string;
  short: string;
  rule: string;
  pointsPerKg: number;
  typicalKg: number;
}

export interface DetectedItem {
  key: MaterialKey;
  name: string;
  rule: string;
  kg: number;
}

export interface WeighedItem {
  key: MaterialKey;
  name: string;
  kg: number;
}

export interface ChatOption {
  value: MaterialKey;
  label: string;
  hint: string;
  recommended?: boolean;
}

export type ActionIcon = 'calendar' | 'star' | 'gift' | 'leaf' | 'package' | 'wallet' | 'help';

export interface QuickAction {
  label: string;
  prompt: string;
  icon?: ActionIcon;
}

export interface Confirmation {
  day: string;
  time: string;
  address: string;
}

/** Rich cards the assistant can render inside the conversation. */
export type Widget =
  | { type: "agendamento_cici" }
  | { type: "integrado"; acao: string; itens: unknown[]; coleta?: number; rotulo: string }
  | { type: 'materials'; items: DetectedItem[] }
  | {
      type: 'clarify';
      question: string;
      options: ChatOption[];
      pending: DetectedItem[];
      then: 'guide' | 'schedule';
      answered?: MaterialKey;
    }
  | { type: 'signup'; items: DetectedItem[]; done?: boolean }
  | { type: 'schedule'; items: DetectedItem[]; conflict?: boolean; confirmed?: Confirmation }
  | { type: 'points' }
  | { type: 'pickups' }
  | { type: 'rating'; pickupId: string }
  | { type: 'rewards'; highlight?: string }
  | { type: 'impact' };

export interface AiDraft {
  text?: string;
  widget?: Widget;
  actions?: QuickAction[];
}

export type Msg = { id: string; from: 'user'; text: string } | ({ id: string; from: 'ai' } & AiDraft);

export interface Slot {
  id: string;
  day: string;
  time: string;
  spotsLeft: number;
  suggested?: boolean;
  reason?: string;
}

export interface ResidentPickup {
  id: string;
  dateLabel: string;
  slot: string;
  address: string;
  items: WeighedItem[];
  status: 'agendada' | 'pesada' | 'concluida';
  totalKg?: number;
  points?: number;
  rated?: boolean;
  stars?: number;
}

export interface Reward {
  id: string;
  title: string;
  partner: string;
  cost: number;
  value: string;
  code?: string;
}

export type FeedKind = 'coleta' | 'pontos' | 'beneficio' | 'comunidade' | 'dica';

export interface FeedItem {
  id: string;
  kind: FeedKind;
  title: string;
  body: string;
  time: string;
  ask?: string;
  progress?: number;
}

export type Priority = 'urgente' | 'alta' | 'normal';

export interface CoopOrder {
  id: string;
  resident: string;
  address: string;
  /** Window in decimal hours, e.g. 13.5 = 13h30. */
  start: number;
  end: number;
  route: 1 | 2;
  status: 'todo' | 'doing' | 'done';
  priority: Priority;
  reasons: string[];
  expected: WeighedItem[];
  heavyGlass?: boolean;
  weighed?: WeighedItem[];
  points?: number;
}

export type RecState = 'pending' | 'accepted' | 'dismissed';
