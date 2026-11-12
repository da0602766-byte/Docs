import { useState } from 'react';
import { CalendarPlus, Check, MessageCircle, PackageCheck, Truck } from 'lucide-react';
import { AiBubble, AiComposer, AiOfflineNotice, ManualToggle } from '../components/ai';
import { ChatThread } from '../components/ChatThread';
import { SignupWidget, type WidgetCtx } from '../components/widgets';
import { MATERIAL_ORDER, MATERIALS } from '../lib/assistant';
import type { AiStatus, DetectedItem, MaterialKey, Msg } from '../types';

const EXAMPLES = [
  'Posso descartar embalagens de óleo e potes de vidro?',
  'Tenho latas de refrigerante e garrafas PET',
  'Caixas de leite longa vida vão no papel?',
];

interface Props {
  messages: Msg[];
  thinking: boolean;
  aiOffline: boolean;
  items: DetectedItem[];
  ctx: WidgetCtx;
  onSend: (text: string) => void;
  onToggleItem: (key: MaterialKey) => void;
}

export function VisitorScreen({ messages, thinking, aiOffline, items, ctx, onSend, onToggleItem }: Props) {
  const [manual, setManual] = useState(false);
  const [manualSignup, setManualSignup] = useState(false);

  const lastAi = [...messages].reverse().find((m) => m.from === 'ai');
  const w = lastAi && lastAi.from === 'ai' ? lastAi.widget : undefined;
  const status: AiStatus = aiOffline
    ? 'offline'
    : thinking
      ? 'thinking'
      : w?.type === 'clarify' && !w.answered
        ? 'clarifying'
        : w?.type === 'materials' || (w?.type === 'signup' && !w.done)
          ? 'ready'
          : 'idle';
  const showManual = manual || aiOffline;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-28 sm:pt-14">
      <div className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">
          <Truck className="h-3.5 w-3.5 text-[#2f6b4f]" />
          Coleta seletiva na sua porta · Bairro Garcia
        </span>
        <h1 className="mt-5 text-3xl font-extrabold text-[#173229] sm:text-5xl">O que você quer reciclar hoje?</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-stone-600 sm:text-lg">
          Pergunte para a <span className="ai-text font-bold">Cici</span>, nossa assistente com inteligência artificial.
          Ela explica como separar e, se você quiser, agenda a coleta.
        </p>
        {!aiOffline && (
          <button
            type="button"
            disabled={thinking}
            onClick={() => onSend('Quero agendar uma coleta')}
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1f3a2e] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2a4d3d] disabled:opacity-50"
          >
            <CalendarPlus className="h-4 w-4" />
            Quero agendar uma coleta
          </button>
        )}
      </div>

      <section
        aria-label="Conversa com a assistente"
        className="mt-8 rounded-3xl border border-stone-200 bg-white p-4 shadow-[0_24px_60px_-36px_rgba(23,50,41,0.45)] sm:p-6"
      >
        {aiOffline ? (
          <AiOfflineNotice>Escolha seus materiais na lista abaixo para ver como separar.</AiOfflineNotice>
        ) : (
          <>
            <div className="space-y-5">
              <AiBubble>
                Oi! Eu sou a Cici. Me diga o que você tem em casa, do jeito que falaria com alguém. Eu digo se a
                cooperativa aceita e como preparar. Para agendar, crio um acesso rápido pra você.
              </AiBubble>
              <ChatThread messages={messages} thinking={thinking} ctx={ctx} onAction={onSend} />
            </div>
            <div className="mt-6">
              <AiComposer
                status={status}
                placeholder="Ex.: Posso descartar embalagens de óleo e potes de vidro?"
                onSubmit={onSend}
                suggestions={messages.length ? [] : EXAMPLES}
              />
              <div className="mt-4 text-center">
                <ManualToggle active={manual} onClick={() => setManual((v) => !v)} />
              </div>
            </div>
          </>
        )}

        {showManual && (
          <div className="rise mt-6 border-t border-stone-200 pt-6">
            <h3 className="text-base font-bold text-[#173229]">Escolha o que você tem</h3>
            <p className="text-sm text-stone-500">Marque os materiais para ver como separar cada um.</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {MATERIAL_ORDER.map((k) => {
                const on = items.some((i) => i.key === k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => onToggleItem(k)}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-left transition ${
                      on ? 'border-[#2f6b4f] bg-[#f1f7f3]' : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                        on ? 'border-[#2f6b4f] bg-[#2f6b4f] text-white' : 'border-stone-300'
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{MATERIALS[k].name}</span>
                      {on && <span className="mt-1 block text-sm text-stone-600">{MATERIALS[k].rule}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
            {manualSignup ? (
              <div className="mt-5">
                <SignupWidget msgId={null} items={items} ctx={{ ...ctx, plain: true }} />
              </div>
            ) : (
              <button
                type="button"
                disabled={!items.length}
                onClick={() => setManualSignup(true)}
                className="mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1f3a2e] py-3 text-sm font-semibold text-white hover:bg-[#2a4d3d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CalendarPlus className="h-4 w-4" />
                Agendar coleta destes itens
              </button>
            )}
          </div>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-center text-sm font-bold tracking-wider text-stone-500 uppercase">Como funciona</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { Icon: MessageCircle, title: 'Conte o que tem', text: 'Escreva do seu jeito. A Cici entende.' },
            { Icon: PackageCheck, title: 'Separe do jeito certo', text: 'Ela mostra como limpar e embalar cada item.' },
            { Icon: Truck, title: 'A cooperativa busca', text: 'Seu material é pesado e vira pontos para trocar.' },
          ].map(({ Icon, title, text }, i) => (
            <div key={title} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-[#eef3ef] text-sm font-bold text-[#2f6b4f]">
                  {i + 1}
                </span>
                <Icon className="h-5 w-5 text-stone-400" />
              </div>
              <h3 className="mt-3 font-bold text-[#173229]">{title}</h3>
              <p className="mt-1 text-sm text-stone-600">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
