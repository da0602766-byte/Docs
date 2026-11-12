import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  CalendarDays,
  Check,
  CircleCheck,
  Clock,
  Leaf,
  MapPin,
  Minus,
  PencilLine,
  Plus,
  Sparkles,
  Star,
  Ticket,
  Trash2,
  TreeDeciduous,
  UserPlus,
  Weight,
} from 'lucide-react';
import { AiTag } from './ai';
import { MaterialIcon } from './MaterialIcon';
import { RESIDENT_ADDRESS, REWARDS_GOAL_ID, SLOTS } from '../data/mock';
import { MATERIAL_ORDER, MATERIALS, fmtKg, pointsFor, toItem } from '../lib/assistant';
import type {
  Confirmation,
  DetectedItem,
  MaterialKey,
  ResidentPickup,
  Reward,
  Slot,
  Widget,
} from '../types';

export interface WidgetCtx {
  /** True when the assistant is offline: same cards, without AI markings. */
  plain: boolean;
  points: number;
  pickups: ResidentPickup[];
  rewards: Reward[];
  onAnswer: (msgId: string, value: MaterialKey) => void;
  onSignup: (msgId: string | null) => void;
  onLogin: () => void;
  onConfirmSchedule: (msgId: string | null, slot: Slot, address: string, items: DetectedItem[]) => void;
  onRate: (pickupId: string, stars: number, comment: string) => void;
  onRedeem: (rewardId: string) => void;
  render?: (widget: Widget, msgId: string | null) => ReactNode | undefined;
}

const CARD = 'rounded-2xl border border-stone-200/80 bg-white text-[#173229]';
const BTN_PRIMARY =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1f3a2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a4d3d] disabled:cursor-not-allowed disabled:opacity-40';
const BTN_GHOST =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50';

export function WidgetView({ msgId, widget, ctx }: { msgId: string | null; widget: Widget; ctx: WidgetCtx }) {
  const integrado = ctx.render?.(widget, msgId);
  if (integrado !== undefined) return integrado;
  switch (widget.type) {
    case 'materials':
      return <MaterialsWidget items={widget.items} />;
    case 'clarify':
      return <ClarifyWidget msgId={msgId!} widget={widget} ctx={ctx} />;
    case 'signup':
      return <SignupWidget msgId={msgId} items={widget.items} done={widget.done} ctx={ctx} />;
    case 'schedule':
      return <ScheduleWidget msgId={msgId} widget={widget} ctx={ctx} />;
    case 'points':
      return <PointsWidget ctx={ctx} />;
    case 'pickups':
      return <PickupsWidget ctx={ctx} />;
    case 'rating': {
      const p = ctx.pickups.find((x) => x.id === widget.pickupId);
      return p ? <RatingWidget pickup={p} ctx={ctx} /> : null;
    }
    case 'rewards':
      return <RewardsWidget ctx={ctx} highlight={widget.highlight} />;
    case 'impact':
      return <ImpactWidget ctx={ctx} />;
  }
}

/* ---------------------------------- Materials --------------------------------- */

export function MaterialsWidget({ items }: { items: DetectedItem[] }) {
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.key} className={`${CARD} flex items-start gap-3 p-3`}>
          <MaterialIcon k={it.key} />
          <div>
            <div className="font-semibold">{it.name}</div>
            <div className="text-sm text-stone-600">{it.rule}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------- Clarify ----------------------------------- */

function ClarifyWidget({
  msgId,
  widget,
  ctx,
}: {
  msgId: string;
  widget: Extract<Widget, { type: 'clarify' }>;
  ctx: WidgetCtx;
}) {
  return (
    <div className={`${CARD} p-4`}>
      <p className="font-semibold">{widget.question}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {widget.options.map((opt) => {
          const chosen = widget.answered === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              disabled={!!widget.answered}
              onClick={() => ctx.onAnswer(msgId, opt.value)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition disabled:cursor-default ${
                chosen
                  ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/15'
                  : widget.answered
                    ? 'border-stone-200 opacity-45'
                    : 'border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/40'
              }`}
            >
              <MaterialIcon k={opt.value} size="sm" />
              <span className="flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{opt.label}</span>
                  {chosen && <Check className="h-4 w-4 text-emerald-700" />}
                  {!widget.answered && opt.recommended && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Recomendado
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block text-sm text-stone-500">{opt.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ----------------------------------- Signup ----------------------------------- */

export function SignupWidget({
  msgId,
  items,
  done,
  ctx,
}: {
  msgId: string | null;
  items: DetectedItem[];
  done?: boolean;
  ctx: WidgetCtx;
}) {
  const [name, setName] = useState('Carlos Mendes');
  const [phone, setPhone] = useState('(47) 99876-5432');

  if (done) {
    return (
      <div className={`${CARD} flex items-center gap-3 p-4`}>
        <CircleCheck className="h-5 w-5 text-emerald-600" />
        <span className="font-semibold">Acesso criado. Sua área de morador já está aberta.</span>
      </div>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim() && phone.trim()) ctx.onSignup(msgId);
  };

  return (
    <form onSubmit={submit} className={`${CARD} overflow-hidden`}>
      <div className="flex items-center gap-3 bg-[#1f3a2e] px-4 py-3.5 text-white">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
          <UserPlus className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="font-bold">Crie seu acesso rápido</p>
          <p className="text-xs text-white/70">Grátis · menos de 1 minuto · entrada por código no celular</p>
        </div>
      </div>
      <div className="space-y-4 p-4">
        {items.length > 0 && (
          <div>
            <p className="text-xs font-semibold tracking-wide text-stone-500 uppercase">
              {ctx.plain ? 'Itens escolhidos' : 'A Cici guarda para o agendamento'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {items.map((i) => (
                <span key={i.key} className="inline-flex items-center gap-2 rounded-full bg-stone-100 py-1 pr-3 pl-1 text-sm">
                  <MaterialIcon k={i.key} size="sm" />
                  {i.name}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-stone-700">
            Seu nome
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-[15px] focus:border-[#2f6b4f] focus:outline-none"
            />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Celular (WhatsApp)
            <input
              value={phone}
              inputMode="tel"
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-[15px] focus:border-[#2f6b4f] focus:outline-none"
            />
          </label>
        </div>
        <button type="submit" className={`${BTN_PRIMARY} w-full py-3`}>
          Criar acesso e agendar
        </button>
        <div className="grid gap-2 sm:grid-cols-2">
          <button type="button" onClick={() => ctx.onSignup(msgId)} className={BTN_GHOST}>
            <span className="grid h-5 w-5 place-items-center rounded-full border border-stone-300 text-[11px] font-bold">
              G
            </span>
            Continuar com Google
          </button>
          <button type="button" onClick={ctx.onLogin} className={BTN_GHOST}>
            Já tenho conta · Entrar
          </button>
        </div>
        <ul className="grid gap-2 border-t border-stone-100 pt-3 text-sm text-stone-600 sm:grid-cols-3">
          {['Agende em 1 toque', 'Ganhe pontos por kg', 'Troque por benefícios'].map((b) => (
            <li key={b} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-600" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </form>
  );
}

/* ---------------------------------- Schedule ---------------------------------- */

const RESERVE_SECONDS = 60;

export function ScheduleWidget({
  msgId,
  widget,
  ctx,
}: {
  msgId: string | null;
  widget: Extract<Widget, { type: 'schedule' }>;
  ctx: WidgetCtx;
}) {
  const [items, setItems] = useState<DetectedItem[]>(widget.items);
  const [slots, setSlots] = useState<Slot[]>(() =>
    SLOTS.map((s) => (widget.conflict && s.suggested ? { ...s, spotsLeft: 0 } : s))
  );
  const [slotId, setSlotId] = useState('s1');
  const [conflict, setConflict] = useState(!!widget.conflict);
  const [editing, setEditing] = useState(ctx.plain);
  const [address, setAddress] = useState(RESIDENT_ADDRESS);
  const [secondsLeft, setSecondsLeft] = useState(RESERVE_SECONDS);
  const [localDone, setLocalDone] = useState<Confirmation | null>(null);

  const done = widget.confirmed ?? localDone;
  const selected = slots.find((s) => s.id === slotId) ?? slots[0];
  const suggested = SLOTS.find((s) => s.suggested)!;
  const holding = !done && !conflict && slotId === suggested.id && selected.spotsLeft > 0;
  const alternatives = slots.filter((s) => !s.suggested && s.spotsLeft > 0).slice(0, 2);
  const isEditing = editing || ctx.plain;

  // The last spot is held briefly; if the person takes too long, it is released (schedule conflict).
  useEffect(() => {
    if (!holding) return;
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [holding]);

  useEffect(() => {
    if (holding && secondsLeft <= 0) {
      setSlots((prev) => prev.map((s) => (s.suggested ? { ...s, spotsLeft: 0 } : s)));
      setConflict(true);
    }
  }, [holding, secondsLeft]);

  const finalize = (slot: Slot) => {
    if (!items.length) return;
    ctx.onConfirmSchedule(msgId, slot, address, items);
    setLocalDone({ day: slot.day, time: slot.time, address });
    setConflict(false);
  };

  const confirm = () => {
    if (selected.spotsLeft <= 0) {
      setConflict(true);
      return;
    }
    finalize(selected);
  };

  const changeKg = (key: MaterialKey, delta: number) =>
    setItems((prev) =>
      prev.map((i) => (i.key === key ? { ...i, kg: Math.max(0.5, Math.round((i.kg + delta) * 10) / 10) } : i))
    );

  if (done) {
    return (
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center gap-2 bg-emerald-50 px-4 py-3 font-bold text-emerald-900">
          <CircleCheck className="h-5 w-5 text-emerald-600" />
          Coleta agendada
        </div>
        <dl className="grid gap-3 p-4 text-sm sm:grid-cols-2">
          <Info icon={<CalendarDays className="h-4 w-4" />} label="Quando" value={`${done.day}, ${done.time}`} />
          <Info icon={<MapPin className="h-4 w-4" />} label="Onde" value={done.address} />
          <Info
            icon={<Weight className="h-4 w-4" />}
            label="Materiais"
            value={items.map((i) => i.name).join(', ')}
          />
          <Info icon={<Star className="h-4 w-4" />} label="Previsão" value={`~${pointsFor(items)} pontos`} />
        </dl>
      </div>
    );
  }

  const available = MATERIAL_ORDER.filter((k) => !items.some((i) => i.key === k));

  return (
    <div className={`overflow-hidden rounded-2xl bg-white text-[#173229] ${ctx.plain ? 'border border-stone-200' : 'ai-ring'}`}>
      <div
        className={`flex flex-wrap items-center justify-between gap-2 px-4 py-3 ${ctx.plain ? 'border-b border-stone-200' : 'ai-surface border-0 border-b'}`}
      >
        <span className="inline-flex items-center gap-2 font-bold">
          {!ctx.plain && <Sparkles className="h-4 w-4 text-emerald-600" />}
          {ctx.plain ? 'Agendar coleta' : 'Prévia do agendamento'}
        </span>
        <span className="text-xs text-stone-500">Confira antes de confirmar</span>
      </div>

      {conflict && (
        <div role="alert" className="rise border-b border-amber-200 bg-amber-50 p-4">
          <p className="text-sm text-amber-950">
            {ctx.plain ? (
              <>O horário {suggested.day}, {suggested.time} acabou de esgotar. Escolha outro:</>
            ) : (
              <>
                <strong>Desculpe, Carlos!</strong> Enquanto você decidia, a última vaga de{' '}
                <strong>
                  {suggested.day}, {suggested.time}
                </strong>{' '}
                foi preenchida. Separei os dois horários mais próximos:
              </>
            )}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {alternatives.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setSlotId(s.id);
                  finalize(s);
                }}
                className="cursor-pointer rounded-xl border border-amber-200 bg-white p-3 text-left transition hover:border-[#1f3a2e]"
              >
                <span className="block text-xs text-stone-500">{s.day}</span>
                <span className="block text-base font-bold">{s.time}</span>
                <span className="mt-1 block text-sm font-semibold text-[#2f6b4f]">Agendar neste horário →</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="divide-y divide-stone-100">
        <Row label="O que" tag={!ctx.plain ? 'Do que você contou' : undefined}>
          <div className="flex flex-wrap gap-2">
            {items.map((it) => (
              <span key={it.key} className="inline-flex items-center gap-2 rounded-full bg-stone-100 py-1 pr-2 pl-1 text-sm">
                <MaterialIcon k={it.key} size="sm" />
                {it.name}
                {isEditing ? (
                  <span className="ml-1 inline-flex items-center gap-0.5">
                    <MiniBtn label="Diminuir" onClick={() => changeKg(it.key, -0.5)}>
                      <Minus className="h-3 w-3" />
                    </MiniBtn>
                    <span className="w-12 text-center font-mono text-xs">~{fmtKg(it.kg)} kg</span>
                    <MiniBtn label="Aumentar" onClick={() => changeKg(it.key, 0.5)}>
                      <Plus className="h-3 w-3" />
                    </MiniBtn>
                    <MiniBtn label="Remover" onClick={() => setItems((p) => p.filter((x) => x.key !== it.key))}>
                      <Trash2 className="h-3 w-3" />
                    </MiniBtn>
                  </span>
                ) : (
                  <span className="font-mono text-xs text-stone-500">~{fmtKg(it.kg)} kg</span>
                )}
              </span>
            ))}
            {!items.length && <span className="text-sm text-stone-500">Adicione pelo menos um material.</span>}
          </div>
          {isEditing && available.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {available.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setItems((p) => [...p, toItem(k)])}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-stone-300 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50"
                >
                  <Plus className="h-3 w-3" />
                  {MATERIALS[k].name}
                </button>
              ))}
            </div>
          )}
        </Row>

        <Row label="Onde" tag={!ctx.plain ? 'Do seu cadastro' : undefined}>
          {isEditing ? (
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              aria-label="Endereço da coleta"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#2f6b4f] focus:outline-none"
            />
          ) : (
            <p className="flex items-center gap-1.5 text-sm">
              <MapPin className="h-4 w-4 text-stone-400" />
              {address}
            </p>
          )}
        </Row>

        <Row label="Quando">
          <div className="grid grid-cols-2 gap-2">
            {slots.map((s) => {
              const full = s.spotsLeft <= 0;
              const active = s.id === slotId && !full;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={full}
                  onClick={() => setSlotId(s.id)}
                  className={`relative cursor-pointer rounded-xl border-2 p-2.5 text-left transition disabled:cursor-not-allowed ${
                    full
                      ? 'border-stone-200 bg-stone-50 text-stone-400'
                      : active
                        ? 'border-[#1f3a2e] bg-[#f1f7f3]'
                        : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="block text-xs text-stone-500">{s.day}</span>
                  <span className={`block font-bold ${full ? 'line-through' : ''}`}>{s.time}</span>
                  <span className="mt-0.5 block text-[11px]">
                    {full ? 'Esgotado' : s.spotsLeft === 1 ? 'Última vaga' : `${s.spotsLeft} vagas`}
                  </span>
                  {s.suggested && !full && !ctx.plain && (
                    <span className="mt-1.5 block">
                      <AiTag>Sugestão da Cici</AiTag>
                    </span>
                  )}
                  {active && (
                    <span className="absolute top-2 right-2 grid h-4.5 w-4.5 place-items-center rounded-full bg-[#1f3a2e] text-white">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {!ctx.plain && selected.suggested && selected.spotsLeft > 0 && (
            <p className="mt-2 text-xs text-emerald-800">{selected.reason}</p>
          )}
          {holding && (
            <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2">
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Última vaga reservada para você
                </span>
                <span className="font-mono font-semibold">
                  0:{String(Math.max(0, secondsLeft)).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-amber-200/70">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-linear"
                  style={{ width: `${(secondsLeft / RESERVE_SECONDS) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Row>
      </div>

      <div className="flex flex-col gap-3 border-t border-stone-100 bg-stone-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-stone-600">
          Previsão: <strong className="text-[#173229]">~{pointsFor(items)} pontos</strong>
        </p>
        <div className="flex gap-2">
          {!ctx.plain && (
            <button type="button" onClick={() => setEditing((v) => !v)} className={BTN_GHOST}>
              <PencilLine className="h-4 w-4" />
              {editing ? 'Pronto' : 'Editar manualmente'}
            </button>
          )}
          <button type="button" onClick={confirm} disabled={!items.length || selected.spotsLeft <= 0} className={BTN_PRIMARY}>
            <Check className="h-4 w-4" />
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------- Points ----------------------------------- */

export function PointsWidget({ ctx }: { ctx: WidgetCtx }) {
  const goal = ctx.rewards.find((r) => r.id === REWARDS_GOAL_ID)!;
  const missing = Math.max(0, goal.cost - ctx.points);
  const progress = Math.min(100, Math.round((ctx.points / goal.cost) * 100));
  const moves: { label: string; value: number }[] = [
    ...ctx.rewards.filter((r) => r.code).map((r) => ({ label: `Resgate · ${r.title}`, value: -r.cost })),
    ...ctx.pickups.flatMap((p) => [
      ...(p.rated ? [{ label: `Bônus de avaliação · ${p.dateLabel}`, value: 25 }] : []),
      ...(p.points ? [{ label: `Coleta pesada · ${p.dateLabel}`, value: p.points }] : []),
    ]),
  ].slice(0, 4);

  return (
    <div className={`${CARD} overflow-hidden`}>
      <div className="bg-[#1f3a2e] p-4 text-white">
        <p className="text-xs text-white/70">Saldo atual</p>
        <p className="font-mono text-4xl font-bold">{ctx.points}</p>
        <div className="mt-3 flex justify-between text-xs">
          <span className="text-white/80">Meta: {goal.title}</span>
          <span className="font-semibold">{missing > 0 ? `faltam ${missing}` : 'liberado'}</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-emerald-300 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <ul className="divide-y divide-stone-100 px-4">
        {moves.map((m) => (
          <li key={m.label} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-stone-600">{m.label}</span>
            <span className={`font-mono font-semibold ${m.value > 0 ? 'text-emerald-700' : 'text-stone-500'}`}>
              {m.value > 0 ? '+' : ''}
              {m.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------- Pickups ----------------------------------- */

const STEPS = ['Agendada', 'Pesada', 'Pontos liberados'];

export function PickupsWidget({ ctx }: { ctx: WidgetCtx }) {
  const [rateOpen, setRateOpen] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {ctx.pickups.map((p) => {
        const step = p.status === 'agendada' ? 0 : p.status === 'pesada' ? 1 : 2;
        return (
          <article key={p.id} className={`${CARD} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">
                  {p.dateLabel} · {p.slot}
                </p>
                <div className="mt-1.5 flex gap-1">
                  {p.items.map((i) => (
                    <MaterialIcon key={i.key} k={i.key} size="sm" />
                  ))}
                </div>
              </div>
              <div className="text-right">
                {p.totalKg != null ? (
                  <>
                    <p className="font-mono font-bold">{fmtKg(p.totalKg)} kg</p>
                    <p className="text-xs text-stone-500">+{p.points} pts</p>
                  </>
                ) : (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
                    Agendada
                  </span>
                )}
              </div>
            </div>
            <ol className="mt-3 grid grid-cols-3 gap-1.5">
              {STEPS.map((label, i) => (
                <li key={label}>
                  <div className={`h-1.5 rounded-full ${i <= step ? 'bg-[#2f6b4f]' : 'bg-stone-200'}`} />
                  <span className={`mt-1 block text-[11px] ${i <= step ? 'font-semibold' : 'text-stone-400'}`}>
                    {label}
                  </span>
                </li>
              ))}
            </ol>
            {p.status === 'pesada' && !p.rated && (
              <div className="mt-3">
                {rateOpen === p.id ? (
                  <RatingWidget pickup={p} ctx={ctx} />
                ) : (
                  <button type="button" onClick={() => setRateOpen(p.id)} className={`${BTN_PRIMARY} w-full`}>
                    <Star className="h-4 w-4" />
                    Avaliar e liberar +25 pontos
                  </button>
                )}
              </div>
            )}
            {p.rated && (
              <p className="mt-2 flex items-center gap-0.5 text-xs text-stone-500">
                Sua nota:
                {Array.from({ length: p.stars ?? 0 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                ))}
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

/* ----------------------------------- Rating ----------------------------------- */

const AI_THANKS = 'Obrigado pela coleta! Equipe pontual e muito cuidadosa com o vidro.';
const STAR_LABELS = ['', 'Ruim', 'Regular', 'Boa', 'Muito boa', 'Excelente'];

export function RatingWidget({ pickup, ctx }: { pickup: ResidentPickup; ctx: WidgetCtx }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(ctx.plain ? '' : AI_THANKS);
  const shown = hover || stars;

  if (pickup.rated) {
    return (
      <div className={`${CARD} flex items-center gap-3 p-4`}>
        <CircleCheck className="h-5 w-5 text-emerald-600" />
        <div className="text-sm">
          <p className="font-semibold">Avaliação enviada · +25 pontos liberados</p>
          <p className="flex items-center gap-0.5 text-stone-500">
            {Array.from({ length: pickup.stars ?? 0 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            ))}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${CARD} p-4`}>
      <p className="text-sm font-semibold">Avaliação express · coleta de {pickup.dateLabel}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setStars(n)}
              className="cursor-pointer p-1 transition hover:scale-110"
            >
              <Star className={`h-8 w-8 ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} />
            </button>
          ))}
        </div>
        <span className="text-sm text-stone-500">{shown ? STAR_LABELS[shown] : 'Toque numa estrela'}</span>
      </div>
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium text-stone-600">Comentário (opcional)</span>
          {!ctx.plain && comment === AI_THANKS && <AiTag>Escrito pela Cici</AiTag>}
        </div>
        <textarea
          rows={2}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Quer deixar um recado para a equipe?"
          className="w-full resize-none rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#2f6b4f] focus:outline-none"
        />
      </div>
      <button
        type="button"
        disabled={!stars}
        onClick={() => ctx.onRate(pickup.id, stars, comment)}
        className={`${BTN_PRIMARY} mt-3 w-full`}
      >
        Enviar e liberar 25 pontos
      </button>
    </div>
  );
}

/* ---------------------------------- Rewards ----------------------------------- */

export function RewardsWidget({ ctx, highlight }: { ctx: WidgetCtx; highlight?: string }) {
  return (
    <div className="space-y-2">
      {ctx.rewards.map((r) => {
        const can = ctx.points >= r.cost;
        const pct = Math.min(100, Math.round((ctx.points / r.cost) * 100));
        return (
          <div
            key={r.id}
            className={`${CARD} p-4 ${r.id === highlight && !r.code ? 'ring-2 ring-emerald-500/40' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{r.title}</p>
                <p className="text-xs text-stone-500">
                  {r.partner} · <span className="font-semibold text-[#2f6b4f]">{r.value}</span>
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 font-mono text-xs font-bold">{r.cost} pts</span>
            </div>
            {r.code ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <Ticket className="h-4 w-4" />
                Código <strong className="font-mono tracking-wider">{r.code}</strong>
              </div>
            ) : can ? (
              <button type="button" onClick={() => ctx.onRedeem(r.id)} className={`${BTN_PRIMARY} mt-3 w-full`}>
                Resgatar
              </button>
            ) : (
              <div className="mt-3">
                <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-[#2f6b4f]/60" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-xs text-stone-500">Faltam {r.cost - ctx.points} pontos</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------- Impact ----------------------------------- */

const MONTHS = [
  { m: 'Jan', kg: 5.4 },
  { m: 'Fev', kg: 7.9 },
  { m: 'Mar', kg: 6.6 },
  { m: 'Abr', kg: 9.3 },
];

export function impactOf(pickups: ResidentPickup[]) {
  const weighed = pickups.filter((p) => p.totalKg);
  const kg = 42.3 + weighed.reduce((s, p) => s + (p.totalKg ?? 0), 0);
  const co2 = Math.round(kg * 1.6);
  return { kg, co2, trees: Math.max(1, Math.round(co2 / 21)), count: 9 + weighed.length };
}

export function ImpactWidget({ ctx }: { ctx: WidgetCtx }) {
  const { kg, co2, trees, count } = impactOf(ctx.pickups);
  const may = ctx.pickups
    .filter((p) => p.dateLabel.includes('mai') && p.totalKg)
    .reduce((s, p) => s + (p.totalKg ?? 0), 0);
  const months = [...MONTHS, { m: 'Mai', kg: may }];
  const max = Math.max(...months.map((x) => x.kg));

  return (
    <div className={`${CARD} p-4`}>
      <div className="grid grid-cols-3 gap-2">
        <Metric icon={<Weight className="h-4 w-4" />} value={`${fmtKg(kg)} kg`} label="reciclados" />
        <Metric icon={<Leaf className="h-4 w-4" />} value={`${co2} kg`} label="CO₂ evitado" />
        <Metric icon={<TreeDeciduous className="h-4 w-4" />} value={`${trees}`} label="árvores/ano" />
      </div>
      <div className="mt-4">
        <p className="text-xs font-semibold text-stone-500">Kg por mês · {count} coletas no total</p>
        <div className="mt-2 flex h-24 items-end gap-2">
          {months.map((x, i) => (
            <div key={x.m} className="flex flex-1 flex-col items-center gap-1">
              <span className="font-mono text-[10px] text-stone-500">{fmtKg(x.kg)}</span>
              <div
                className={`w-full rounded-t-md ${i === months.length - 1 ? 'ai-gradient' : 'bg-[#2f6b4f]/25'}`}
                style={{ height: `${Math.max(6, (x.kg / max) * 64)}px` }}
              />
              <span className="text-[11px] text-stone-500">{x.m}</span>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 text-sm text-stone-600">
        Você separa <strong className="text-[#173229]">2,1× mais vidro</strong> que a média do Bairro Garcia.
      </p>
    </div>
  );
}

/* ----------------------------------- Helpers ---------------------------------- */

function Metric({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-stone-50 p-3">
      <span className="text-[#2f6b4f]">{icon}</span>
      <p className="mt-1 font-mono text-base font-bold">{value}</p>
      <p className="text-[11px] text-stone-500">{label}</p>
    </div>
  );
}

function Info({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-stone-400">{icon}</span>
      <div>
        <dt className="text-xs text-stone-500">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
    </div>
  );
}

function Row({ label, tag, children }: { label: string; tag?: string; children: ReactNode }) {
  return (
    <div className="px-4 py-3.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-bold tracking-wide text-stone-500 uppercase">{label}</span>
        {tag && <AiTag>{tag}</AiTag>}
      </div>
      {children}
    </div>
  );
}

function MiniBtn({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-5 w-5 cursor-pointer place-items-center rounded-full bg-white text-stone-600 hover:bg-stone-200"
    >
      {children}
    </button>
  );
}
