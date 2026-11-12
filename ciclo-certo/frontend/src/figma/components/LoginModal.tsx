import { useState, type FormEvent } from 'react';
import { Sparkles, X } from 'lucide-react';

export function LoginModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  const [email, setEmail] = useState('carlos@email.com');
  const [password, setPassword] = useState('reciclar123');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) onLogin();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      className="fixed inset-0 z-50 grid place-items-center bg-stone-950/50 p-4 backdrop-blur-[2px]"
    >
      <form
        onSubmit={submit}
        className="rise w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between">
          <h2 id="login-title" className="text-xl font-extrabold text-[#173229]">
            Entrar no Ciclo Certo
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="cursor-pointer rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="ai-surface mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-emerald-900">
          <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" />
          A Cici vai continuar de onde vocês pararam.
        </p>
        <label className="mt-5 block text-sm font-medium text-stone-700">
          E-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-[15px] focus:border-[#2f6b4f] focus:outline-none"
          />
        </label>
        <label className="mt-3 block text-sm font-medium text-stone-700">
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2.5 text-[15px] focus:border-[#2f6b4f] focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="mt-5 w-full cursor-pointer rounded-xl bg-[#1f3a2e] py-3 text-sm font-semibold text-white hover:bg-[#2a4d3d]"
        >
          Entrar
        </button>
        <p className="mt-3 text-center text-xs text-stone-500">
          Não tem conta? O acesso rápido usa só seu celular.
        </p>
      </form>
    </div>
  );
}
