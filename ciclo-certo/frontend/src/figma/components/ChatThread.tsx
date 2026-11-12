import { useEffect, useRef, type RefObject } from 'react';
import {
  CalendarDays,
  CircleHelp,
  Gift,
  Leaf,
  Package,
  Star,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { AiBubble, AiTyping, UserBubble } from './ai';
import { WidgetView, type WidgetCtx } from './widgets';
import type { ActionIcon, Msg } from '../types';

export const ACTION_ICONS: Record<ActionIcon, LucideIcon> = {
  calendar: CalendarDays,
  star: Star,
  gift: Gift,
  leaf: Leaf,
  package: Package,
  wallet: Wallet,
  help: CircleHelp,
};

interface Props {
  messages: Msg[];
  thinking: boolean;
  ctx: WidgetCtx;
  onAction: (prompt: string) => void;
  /** Scroll container to keep pinned to the latest message. */
  scrollRef?: RefObject<HTMLDivElement | null>;
}

export function ChatThread({ messages, thinking, ctx, onAction, scrollRef }: Props) {
  const endRef = useRef<HTMLDivElement>(null);
  const ultimaMensagem = messages.at(-1)?.id;

  useEffect(() => {
    const el = scrollRef?.current;
    if (el) el.scrollTop = el.scrollHeight;
    else if (messages.length > 1 && !window.matchMedia('(pointer: coarse)').matches) endRef.current?.scrollIntoView({ block: 'nearest' });
  }, [ultimaMensagem, messages.length, thinking, scrollRef]);

  // Quick actions are only offered on the assistant's latest turn.
  const lastUser = messages.map((m) => m.from).lastIndexOf('user');

  return (
    <div className="space-y-5" role="log" aria-label="Mensagens da Cici">
      {messages.map((m, idx) =>
        m.from === 'user' ? (
          <UserBubble key={m.id}>{m.text}</UserBubble>
        ) : (
          <div key={m.id} className="cici-resposta-animada">
            {idx === messages.length - 1 && (
              <div aria-hidden="true">
                <span className="cici-brilho-resposta" />
                <span className="cici-folha-resposta" />
                <span className="cici-folha-resposta" />
              </div>
            )}
            <AiBubble>
              {m.text && <p className="cici-texto-resposta">{m.text}</p>}
              {m.widget && (
                <div className={m.text ? 'mt-3' : ''}>
                  <WidgetView msgId={m.id} widget={m.widget} ctx={ctx} />
                </div>
              )}
            </AiBubble>
            {m.actions && idx > lastUser && !thinking && (
              <div className="rise mt-2.5 flex flex-wrap gap-2 pl-12">
                {m.actions.map((a) => {
                  const Icon = a.icon ? ACTION_ICONS[a.icon] : null;
                  return (
                    <button
                      key={a.label}
                      type="button"
                      onClick={() => onAction(a.prompt)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-sm font-medium text-emerald-900 transition hover:border-emerald-400 hover:bg-emerald-50"
                    >
                      {Icon && <Icon className="h-3.5 w-3.5 text-emerald-600" />}
                      {a.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )
      )}
      {thinking && <AiTyping />}
      <div ref={endRef} />
    </div>
  );
}
