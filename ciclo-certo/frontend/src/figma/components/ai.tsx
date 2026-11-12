import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowUp, Mic, Sparkles, SlidersHorizontal, WifiOff } from 'lucide-react';
import { MarcaCici } from '../../Cici';
import type { AiStatus } from '../types';

export function AiAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';

  return (
    <span
      aria-hidden
      className={`${dims} cici-avatar-luz ai-gradient grid shrink-0 place-items-center rounded-full text-white shadow-[0_6px_16px_-6px_rgba(6,182,212,0.7)]`}
    >
      <MarcaCici animada compacta />
    </span>
  );
}

export function AiBubble({
  children,
  label = 'Cici · assistente com IA',
  tone = 'light',
}: {
  children: ReactNode;
  label?: string;
  tone?: 'light' | 'dark';
}) {
  const dark = tone === 'dark';
  return (
    <div className="rise flex items-start gap-3">
      <AiAvatar />
      <div className="min-w-0 flex-1">
        <div className={`${dark ? 'ai-text-dark' : 'ai-text'} mb-1 text-xs font-bold`}>{label}</div>
        <div
          className={`cici-resposta-luz rounded-2xl rounded-tl-md px-4 py-3 text-[15px] leading-relaxed ${
            dark ? 'ai-surface-dark text-slate-100' : 'ai-surface text-[#173229]'
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function UserBubble({ children, label = 'Você' }: { children: ReactNode; label?: string }) {
  return (
    <div className="cici-enviada flex justify-end">
      <div className="max-w-[85%]">
        <div className="mb-1 text-right text-xs font-medium text-stone-500">{label}</div>
        <div className="rounded-2xl rounded-tr-md bg-[#1f3a2e] px-4 py-2.5 text-[15px] text-white">
          {children}
        </div>
      </div>
    </div>
  );
}

export function AiTyping({
  text = 'Cici está escrevendo…',
  tone = 'light',
}: {
  text?: string;
  tone?: 'light' | 'dark';
}) {
  return (
    <AiBubble tone={tone}>
      <span role="status" className={`cici-escrevendo inline-flex items-center gap-2.5 ${tone === 'dark' ? 'text-slate-300' : 'text-stone-600'}`}>
        <span className="cici-sinal-resposta" aria-hidden="true"><i /><i /><i /><i /><i /></span>
        {text}
      </span>
    </AiBubble>
  );
}

/** Small marker for any field or value that was filled in by the assistant. */
export function AiTag({ children }: { children: ReactNode }) {
  return (
    <span className="ai-surface inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-emerald-800">
      <Sparkles className="h-3 w-3 text-emerald-600" />
      {children}
    </span>
  );
}

export function AiOfflineNotice({ children }: { children?: ReactNode }) {
  return (
    <div
      role="status"
      className="rise flex items-start gap-3 rounded-2xl border border-stone-300 bg-stone-100 px-4 py-3 text-sm text-stone-700"
    >
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />
      <p>
        <strong className="font-semibold text-stone-800">A assistente Cici está fora do ar agora.</strong>{' '}
        {children ?? 'Pode seguir pelo formulário abaixo — nada se perde.'}
      </p>
    </div>
  );
}

export function ManualToggle({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-stone-500 underline decoration-stone-300 underline-offset-4 hover:text-stone-900"
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      {active ? 'Voltar a usar a Cici' : 'Preencher manualmente do jeito clássico'}
    </button>
  );
}

const STATUS: Record<AiStatus, { label: string; dot: string }> = {
  idle: { label: 'Cici está pronta para ajudar', dot: 'bg-emerald-500' },
  thinking: { label: 'Escrevendo…', dot: 'bg-cyan-500 animate-pulse' },
  clarifying: { label: 'Cici precisa de uma resposta sua', dot: 'bg-amber-500' },
  ready: { label: 'Cici preparou algo para você conferir', dot: 'bg-emerald-600' },
  offline: { label: 'Cici está fora do ar · use o modo manual', dot: 'bg-stone-400' },
};

interface ComposerProps {
  status: AiStatus;
  placeholder: string;
  onSubmit: (text: string) => void;
  suggestions?: string[];
  onVoice?: () => void;
  listening?: boolean;
  tone?: 'light' | 'dark';
}

/** Natural-language input: the single entry point to talk to the assistant. */
export function AiComposer({
  status,
  placeholder,
  onSubmit,
  suggestions = [],
  onVoice,
  listening = false,
  tone = 'light',
}: ComposerProps) {
  const dark = tone === 'dark';
  const [value, setValue] = useState('');
  const compondo = useRef(false);
  const entrada = useRef<HTMLInputElement>(null);
  const [envios, setEnvios] = useState(0);
  const offline = status === 'offline';
  const busy = status === 'thinking' || listening;
  const meta = listening ? { label: 'Ouvindo…', dot: 'bg-red-500 animate-pulse' } : STATUS[status];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim() || offline || busy || compondo.current) return;
    setEnvios((n) => n + 1);
    onSubmit(value.trim());
    setValue('');
  };

  return (
    <div>
      <form
        onSubmit={submit}
        data-escrevendo={busy || undefined}
        className={`cici-compositor rounded-2xl p-2 ${
          offline
            ? 'border-2 border-stone-200 bg-stone-50'
            : dark
              ? 'ai-ring-dark'
              : 'ai-ring shadow-[0_10px_30px_-18px_rgba(6,182,212,0.6)]'
        }`}
      >
        <div
          className={`cici-compositor-status items-center gap-2 px-2 pt-0.5 pb-1.5 text-xs font-medium ${dark ? 'text-slate-400' : 'text-stone-500'}`}
        >
          <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
          {meta.label}
        </div>
        {envios > 0 && <span key={envios} className="cici-contorno-envio" aria-hidden="true">
          <i /><i /><i />
        </span>}
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Sparkles
              className={`pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 ${offline ? 'text-stone-300' : 'text-emerald-500'}`}
            />
            <input
              ref={entrada}
              value={value}
              type="text"
              inputMode="text"
              autoCapitalize="sentences"
              autoCorrect="on"
              data-form-type="other"
              enterKeyHint="send"
              autoComplete="off"
              onCompositionStart={() => { compondo.current = true; }}
              onCompositionEnd={() => { compondo.current = false; }}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.nativeEvent.isComposing || compondo.current)) e.preventDefault(); }}
              onChange={(e) => setValue(e.target.value)}
              disabled={offline}
              placeholder={offline ? 'Assistente indisponível no momento' : placeholder}
              aria-label="Escreva para a assistente Cici"
              maxLength={420}
              className={`w-full rounded-xl bg-transparent py-3 pr-3 pl-10 text-base focus:outline-none disabled:cursor-not-allowed ${
                dark ? 'text-white placeholder:text-slate-500' : 'text-stone-900 placeholder:text-stone-400'
              }`}
            />
          </div>
          {onVoice && (
            <button
              type="button"
              onClick={onVoice}
              disabled={offline || busy}
              aria-label="Falar com a Cici"
              className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-stone-200 text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Mic className="h-5 w-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={offline || busy || !value.trim()}
            aria-label="Enviar"
            onMouseDown={(e) => {
              // Evita mudar o foco no clique, inclusive no evento gerado por toque.
              if (document.activeElement === entrada.current) e.preventDefault();
            }}
            className="cici-enviar"
          >
            <ArrowUp size={19} aria-hidden="true" />
            <span>Enviar</span>
          </button>
        </div>
      </form>
      {suggestions.length > 0 && !offline && (
        <div className="cici-sugestoes-compositor mt-3 flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy}
              onClick={() => onSubmit(s)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition disabled:opacity-50 ${
                dark
                  ? 'border-white/10 bg-white/5 text-slate-200 hover:border-emerald-400/50 hover:bg-emerald-400/10'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-emerald-300 hover:bg-emerald-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
