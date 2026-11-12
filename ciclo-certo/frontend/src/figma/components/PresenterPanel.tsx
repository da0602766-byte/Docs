import { useState } from 'react';
import { ListChecks, RotateCcw, X } from 'lucide-react';
import type { DemoCase, DemoScreen } from '../types';

const SCREENS: { id: DemoScreen; title: string; desc: string }[] = [
  { id: '1.1', title: 'Site público com IA', desc: 'Visitante pergunta sem login' },
  { id: '1.2', title: 'Depois do login', desc: 'Cici retoma a conversa e agenda no chat' },
  { id: '2.1', title: 'Morador: Cici no centro', desc: 'Tudo pela conversa + feed ao lado' },
  { id: '2.2', title: 'Avaliação express', desc: 'Card de nota dentro da conversa' },
  { id: '3.1', title: 'Centro de operações', desc: 'Prioridades, rotas e alertas' },
  { id: '3.2', title: 'Pesagem em campo', desc: 'Voz, foto e assinatura' },
];

const CASES: { id: DemoCase; title: string; desc: string }[] = [
  { id: 'ambiguity', title: 'Material confuso', desc: 'Cici pergunta antes de classificar' },
  { id: 'conflict', title: 'Vaga esgotada', desc: 'Cici se desculpa e oferece 2 horários' },
  { id: 'missing', title: 'Faltou foto ou assinatura', desc: 'O sistema aponta o que falta' },
  { id: 'offline', title: 'IA fora do ar', desc: 'Formulários manuais aparecem' },
];

interface Props {
  aiOffline: boolean;
  onScreen: (s: DemoScreen) => void;
  onCase: (c: DemoCase) => void;
  onReset: () => void;
}

/** Presentation-only controls, kept outside the product UI. */
export function PresenterPanel({ aiOffline, onScreen, onCase, onReset }: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-40 inline-flex cursor-pointer items-center gap-2 rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-stone-800"
      >
        <ListChecks className="h-4 w-4" />
        Roteiro da demonstração
      </button>
    );
  }

  const item = (title: string, desc: string, onClick: () => void, tag?: string, active?: boolean) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-left hover:bg-white/10 ${active ? 'bg-white/10' : ''}`}
    >
      {tag && <span className="mt-0.5 w-7 shrink-0 font-mono text-xs text-stone-400">{tag}</span>}
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-stone-400">{desc}</span>
      </span>
    </button>
  );

  return (
    <aside className="rise fixed bottom-4 left-4 z-40 max-h-[80vh] w-80 overflow-y-auto rounded-2xl bg-stone-900 p-3 text-white shadow-2xl">
      <div className="flex items-center justify-between px-2 pb-2">
        <span className="text-sm font-bold">Roteiro da demonstração</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fechar roteiro"
          className="cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="px-3 pt-1 pb-1 text-[11px] font-bold tracking-wider text-stone-500 uppercase">Telas</p>
      {SCREENS.map((s) => item(s.title, s.desc, () => onScreen(s.id), s.id))}
      <p className="px-3 pt-3 pb-1 text-[11px] font-bold tracking-wider text-stone-500 uppercase">
        Situações especiais
      </p>
      {CASES.map((c) =>
        item(
          c.id === 'offline' && aiOffline ? 'Religar a IA' : c.title,
          c.desc,
          () => onCase(c.id),
          undefined,
          c.id === 'offline' && aiOffline
        )
      )}
      <button
        type="button"
        onClick={onReset}
        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/15 py-2 text-sm text-stone-300 hover:bg-white/10"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Recomeçar do zero
      </button>
    </aside>
  );
}
