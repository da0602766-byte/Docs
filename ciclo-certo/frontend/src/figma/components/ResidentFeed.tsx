import { useState } from 'react';
import { CalendarDays, Gift, Leaf, MapPin, Sparkles, Star, Truck, Users, type LucideIcon } from 'lucide-react';
import { AiAvatar } from './ai';
import { fmtKg } from '../lib/assistant';
import type { FeedItem, FeedKind, ResidentPickup } from '../types';

const KIND: Record<FeedKind, { Icon: LucideIcon; cls: string; label: string }> = {
  coleta: { Icon: Truck, cls: 'bg-sky-100 text-sky-700', label: 'Coleta' },
  pontos: { Icon: Star, cls: 'bg-amber-100 text-amber-700', label: 'Pontos' },
  beneficio: { Icon: Gift, cls: 'bg-rose-100 text-rose-700', label: 'Benefício' },
  comunidade: { Icon: Users, cls: 'bg-emerald-100 text-emerald-800', label: 'Comunidade' },
  dica: { Icon: Sparkles, cls: '', label: 'Dica da Cici' },
};

type Filter = 'tudo' | 'minhas' | 'comunidade' | 'dica';
const FILTERS: [Filter, string][] = [
  ['tudo', 'Tudo'],
  ['minhas', 'Minhas'],
  ['comunidade', 'Bairro'],
  ['dica', 'Dicas'],
];

interface Props {
  feed: FeedItem[];
  pickups: ResidentPickup[];
  aiOffline: boolean;
  onAsk: (prompt: string) => void;
  impact?: { kg: number; count: number } | null;
  impactUnavailable?: boolean;
}

export function ResidentFeed({ feed, pickups, aiOffline, onAsk, impact, impactUnavailable }: Props) {
  const [filter, setFilter] = useState<Filter>('tudo');
  const next = pickups.find((p) => p.status === 'agendada');
  const list = feed.filter((f) =>
    filter === 'tudo'
      ? true
      : filter === 'minhas'
        ? ['coleta', 'pontos', 'beneficio'].includes(f.kind)
        : f.kind === filter
  );

  return (
    <aside aria-label="Feed" className="morador-feed space-y-4">
      <div className="relative overflow-hidden rounded-3xl bg-[#1f3a2e] p-5 text-white">
        <div className="pointer-events-none absolute -top-10 -right-10 h-36 w-36 rounded-full bg-emerald-400/20 blur-2xl" />
        <p className="flex items-center gap-1.5 text-sm text-white/70">
          <Leaf className="h-4 w-4" />
          Seu impacto
        </p>
        {impact ? <div className="mt-3 grid grid-cols-2 gap-2">
          {[
            [`${fmtKg(impact.kg)}`, 'kg reciclados'],
            [`${impact.count}`, 'coletas concluídas'],
          ].map(([v, l]) => (
            <div key={l}>
              <p className="font-mono text-2xl font-bold">{v}</p>
              <p className="text-[11px] leading-tight text-white/60">{l}</p>
            </div>
          ))}
        </div> : <p className="mt-2 text-sm">{impactUnavailable ? 'Totais indisponíveis agora.' : 'Consultando seu impacto…'}</p>}
      </div>

      {next && (
        <div className="rounded-3xl border border-stone-200 bg-white p-4">
          <p className="text-xs font-bold tracking-wide text-stone-500 uppercase">Próxima coleta</p>
          <p className="mt-1.5 flex items-center gap-2 font-bold text-[#173229]">
            <CalendarDays className="h-4 w-4 text-[#2f6b4f]" />
            {next.dateLabel} · {next.slot}
          </p>
          <p className="mt-1 flex items-center gap-2 text-sm text-stone-500">
            <MapPin className="h-3.5 w-3.5" />
            {next.address}
          </p>
          <ol className="mt-3 grid grid-cols-3 gap-1.5 text-[11px]">
            {['Agendada', 'Rota confirmada', 'Coletada'].map((s, i) => (
              <li key={s}>
                <div className={`h-1.5 rounded-full ${i === 0 ? 'bg-[#2f6b4f]' : 'bg-stone-200'}`} />
                <span className={`mt-1 block ${i === 0 ? 'font-semibold text-[#173229]' : 'text-stone-400'}`}>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="rounded-3xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-[#173229]">Feed</h2>
        </div>
        <div className="mt-3 flex gap-1 rounded-xl bg-stone-100 p-1">
          {FILTERS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              aria-pressed={filter === id}
              className={`flex-1 cursor-pointer rounded-lg py-1.5 text-xs font-semibold ${
                filter === id ? 'bg-white text-[#173229] shadow-sm' : 'text-stone-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <ul className="mt-2 list-none divide-y divide-stone-100 p-0">
          {list.map((f) => {
            const k = KIND[f.kind];
            return (
              <li key={f.id} className="rise flex gap-3 py-3.5">
                {f.kind === 'dica' ? (
                  <AiAvatar />
                ) : (
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${k.cls}`}>
                    <k.Icon className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className={`text-sm font-semibold ${f.kind === 'dica' ? 'ai-text' : 'text-[#173229]'}`}>{f.title}</p>
                    <span className="shrink-0 text-[11px] text-stone-400">{f.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-600">{f.body}</p>
                  {f.progress != null && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${f.progress}%` }} />
                    </div>
                  )}
                  {f.ask && !aiOffline && (
                    <button
                      type="button"
                      onClick={() => onAsk(f.ask!)}
                      className="mt-1.5 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
                    >
                      <Sparkles className="h-3 w-3" />
                      Perguntar à Cici
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {!list.length && <li className="py-6 text-center text-sm text-stone-400">Nada por aqui ainda.</li>}
        </ul>
      </div>
    </aside>
  );
}
