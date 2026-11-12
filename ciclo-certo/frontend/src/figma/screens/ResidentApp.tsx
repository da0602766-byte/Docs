import { useRef } from 'react';
import { AiComposer } from '../components/ai';
import { ACTION_ICONS, ChatThread } from '../components/ChatThread';
import type { WidgetCtx } from '../components/widgets';
import { RESIDENT_ACTIONS } from '../lib/brain';
import type { AiStatus, Msg } from '../types';

interface Props {
  messages: Msg[];
  thinking: boolean;
  ctx: WidgetCtx;
  onSend: (text: string) => void;
  onStop?: () => void;
}

export function ResidentApp({ messages, thinking, ctx, onSend, onStop }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const ultima = messages.slice().reverse().find((m) => m.from === 'ai');
  const widget = ultima?.from === 'ai' ? ultima.widget : undefined;
  const status: AiStatus = thinking ? 'thinking' : widget?.type === 'agendamento_cici' ? 'ready' : 'idle';

  return (
    <section className="cici-dialogo-chat" aria-label="Conversa com a Cici">
      <div ref={scrollRef} className="cici-dialogo-mensagens scrollbar-thin">
        <ChatThread messages={messages} thinking={thinking} ctx={ctx} onAction={onSend} scrollRef={scrollRef} />
      </div>
      <div className="cici-controles">
        <div className="cici-atalhos-dialogo" aria-label="Atalhos da Cici">
          {RESIDENT_ACTIONS.map((a) => {
            const Icon = ACTION_ICONS[a.icon ?? 'help'];
            return <button key={a.label} type="button" disabled={thinking} onClick={() => onSend(a.prompt)}>
              <Icon size={15} aria-hidden="true" /> {a.label}
            </button>;
          })}
        </div>
        {onStop && <button className="cici-encerrar-assunto" type="button" disabled={thinking} onClick={onStop}>
          Encerrar rascunho da coleta
        </button>}
        <AiComposer status={status} placeholder="Escreva sua pergunta…" onSubmit={onSend} />
      </div>
    </section>
  );
}
