import { Globe, Home, Recycle, Truck } from 'lucide-react';
import { AiAvatar } from './ai';
import type { Screen } from '../types';

type Area = 'public' | 'resident' | 'coop';

export function areaOf(screen: Screen): Area {
  if (screen === 'visitor') return 'public';
  if (screen === 'resident') return 'resident';
  return 'coop';
}

export function Header({ screen, onNavigate }: { screen: Screen; onNavigate: (a: Area) => void }) {
  const area = areaOf(screen);
  const tabs: { id: Area; label: string; Icon: typeof Globe }[] = [
    { id: 'public', label: 'Visitante', Icon: Globe },
    { id: 'resident', label: 'Morador', Icon: Home },
    { id: 'coop', label: 'Cooperador', Icon: Truck },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f6f7f3]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1f3a2e] text-white">
            <Recycle className="h-5 w-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-[#173229]">Ciclo Certo</span>
        </div>

        <nav aria-label="Áreas" className="flex gap-1 rounded-xl bg-stone-200/60 p-1">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              aria-current={area === id ? 'page' : undefined}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition sm:px-3.5 ${
                area === id ? 'bg-white text-[#173229] shadow-sm' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Legend: teaches once, everywhere, what the AI looks like */}
      <div className="border-t border-stone-200/60 bg-white/60">
        <p className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 py-1.5 text-xs text-stone-600 sm:text-sm">
          <AiAvatar size="sm" />
          Onde aparecer este símbolo, é a <strong className="ai-text">Cici</strong>, a assistente com
          inteligência artificial.
        </p>
      </div>
    </header>
  );
}
