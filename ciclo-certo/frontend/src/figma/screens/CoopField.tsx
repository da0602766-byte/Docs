import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  Camera,
  CircleAlert,
  CircleCheck,
  MapPin,
  Mic,
  PenLine,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { AiBubble, AiComposer, AiOfflineNotice, AiTag, AiTyping, UserBubble } from '../components/ai';
import { MaterialIcon } from '../components/MaterialIcon';
import { MATERIAL_ORDER, MATERIALS, fmtHour, fmtKg, parseWeights, pointsFor, uid } from '../lib/assistant';
import type { CoopOrder, MaterialKey, WeighedItem } from '../types';

const PRIORITY_LIGHT = {
  urgente: { label: 'urgente', cls: 'bg-red-100 text-red-800' },
  alta: { label: 'alta', cls: 'bg-amber-100 text-amber-900' },
  normal: { label: 'normal', cls: 'bg-stone-200 text-stone-700' },
} as const;

const VOICE_SAMPLE = 'Pesado: 3.2kg de PET, 1.5kg de papelão';

interface Row extends WeighedItem {
  id: string;
  fromAi: boolean;
}

interface Props {
  order: CoopOrder;
  aiOffline: boolean;
  demoMissing: boolean;
  onBack: () => void;
  onFinish: (orderId: string, weighed: WeighedItem[], points: number) => void;
}

export function CoopField({ order, aiOffline, demoMissing, onBack, onFinish }: Props) {
  const [rows, setRows] = useState<Row[]>(() =>
    demoMissing
      ? order.expected.map((e) => ({ ...e, id: uid(), fromAi: true }))
      : []
  );
  const [photo, setPhoto] = useState(false);
  const [signed, setSigned] = useState(false);
  const [errors, setErrors] = useState<{ rows: boolean; photo: boolean; signature: boolean } | null>(
    demoMissing ? { rows: false, photo: true, signature: true } : null
  );
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [chat, setChat] = useState<{ id: string; from: 'user' | 'ai'; text: string }[]>([]);
  const [finished, setFinished] = useState<{ kg: number; points: number } | null>(null);

  const rowsRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const signRef = useRef<HTMLDivElement>(null);

  const totalKg = rows.reduce((s, r) => s + r.kg, 0);
  const points = pointsFor(rows);

  const clearError = (field: 'rows' | 'photo' | 'signature') =>
    setErrors((e) => (e ? { ...e, [field]: false } : e));

  const handleSpoken = (text: string) => {
    setChat((c) => [...c, { id: uid(), from: 'user', text }]);
    setThinking(true);
    window.setTimeout(() => {
      setThinking(false);
      const parsed = parseWeights(text);
      if (!parsed.length) {
        setChat((c) => [
          ...c,
          {
            id: uid(),
            from: 'ai',
            text: 'Não consegui entender os pesos. Tente falar assim: “2 quilos de vidro”.',
          },
        ]);
        return;
      }
      setRows((prev) => {
        const next = [...prev];
        parsed.forEach((p) => {
          const i = next.findIndex((r) => r.key === p.key);
          const row = { ...p, id: i >= 0 ? next[i].id : uid(), fromAi: true };
          if (i >= 0) next[i] = row;
          else next.push(row);
        });
        return next;
      });
      clearError('rows');
      const summary = parsed.map((p) => `${fmtKg(p.kg)} kg de ${p.name.toLowerCase()}`);
      setChat((c) => [
        ...c,
        {
          id: uid(),
          from: 'ai',
          text: `Anotei ${parsed.length === 1 ? '1 material' : `${parsed.length} materiais`}: ${summary.join(' e ')}. Confira os números abaixo.`,
        },
      ]);
    }, 800);
  };

  const startVoice = () => {
    setListening(true);
    window.setTimeout(() => {
      setListening(false);
      handleSpoken(VOICE_SAMPLE);
    }, 1700);
  };

  const finish = () => {
    const missing = { rows: rows.length === 0, photo: !photo, signature: !signed };
    if (missing.rows || missing.photo || missing.signature) {
      setErrors(missing);
      const first = missing.rows ? rowsRef : missing.photo ? photoRef : signRef;
      first.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onFinish(
      order.id,
      rows.map(({ key, name, kg }) => ({ key, name, kg })),
      points
    );
    setFinished({ kg: totalKg, points });
  };

  if (finished) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-16 pb-24 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CircleCheck className="h-9 w-9" />
        </span>
        <h1 className="mt-5 text-2xl font-extrabold text-[#173229]">Atendimento finalizado</h1>
        <p className="mt-2 text-stone-600">
          {fmtKg(finished.kg)} kg registrados. <strong>+{finished.points} pontos</strong> foram
          enviados para {order.resident}.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="mt-6 cursor-pointer rounded-xl bg-[#1f3a2e] px-6 py-3 text-sm font-semibold text-white hover:bg-[#2a4d3d]"
        >
          Voltar ao painel
        </button>
      </div>
    );
  }

  const anyError = errors && (errors.rows || errors.photo || errors.signature);
  const available = MATERIAL_ORDER.filter((k) => !rows.some((r) => r.key === k));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-24">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar ao painel
      </button>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-stone-500">Atendimento em campo · janela {fmtHour(order.start)} às {fmtHour(order.end)}</p>
          <h1 className="text-2xl font-extrabold text-[#173229] sm:text-3xl">{order.resident}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <MapPin className="h-3.5 w-3.5" />
            {order.address} · Rota {order.route}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${PRIORITY_LIGHT[order.priority].cls}`}>
              Prioridade {PRIORITY_LIGHT[order.priority].label}
            </span>
            {order.reasons.map((r) => (
              <span key={r} className="rounded-full bg-white px-2.5 py-0.5 text-xs text-stone-600">
                {r}
              </span>
            ))}
            <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-semibold text-white">
              Modo campo · alto contraste
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm text-stone-600">
          O morador avisou:
          {order.expected.map((e) => (
            <MaterialIcon key={e.key} k={e.key} size="sm" />
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          {/* Step 1: talk */}
          <Step n={1} title="Diga o que pesou">
            {aiOffline ? (
              <AiOfflineNotice>Digite os pesos direto na lista do passo 2.</AiOfflineNotice>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl ai-surface p-4">
                  <button
                    type="button"
                    onClick={startVoice}
                    disabled={listening || thinking}
                    aria-label="Falar os pesos"
                    className={`ai-gradient grid h-16 w-16 shrink-0 cursor-pointer place-items-center rounded-full text-white disabled:cursor-default ${listening ? 'listen-pulse' : ''}`}
                  >
                    <Mic className="h-7 w-7" />
                  </button>
                  <div>
                    <p className="font-semibold text-[#173229]">
                      {listening ? 'Ouvindo… pode falar' : 'Toque e fale os pesos'}
                    </p>
                    <p className="text-sm text-stone-600">
                      Ex.: “Pesado: 3,2 kg de PET, 1,5 kg de papelão”. A Cici preenche para você.
                    </p>
                  </div>
                </div>
                {chat.map((m) =>
                  m.from === 'user' ? (
                    <UserBubble key={m.id} label="Você falou">
                      {m.text}
                    </UserBubble>
                  ) : (
                    <AiBubble key={m.id}>{m.text}</AiBubble>
                  )
                )}
                {thinking && <AiTyping text="Cici está anotando…" />}
                <AiComposer
                  status={thinking ? 'thinking' : rows.some((r) => r.fromAi) ? 'ready' : 'idle'}
                  listening={listening}
                  placeholder="Ou digite: 3.2kg de PET, 1.5kg de papelão"
                  onSubmit={handleSpoken}
                  onVoice={startVoice}
                />
              </div>
            )}
          </Step>

          {/* Step 2: check weights */}
          <div ref={rowsRef} className="scroll-mt-28">
            <Step
              n={2}
              title="Confira os pesos"
              error={errors?.rows ? 'Falta registrar pelo menos um material.' : undefined}
            >
              <div className="space-y-2">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
                    <MaterialIcon k={r.key} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium">{r.name}</div>
                      {r.fromAi && !aiOffline && <AiTag>Preenchido pela Cici</AiTag>}
                    </div>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="0"
                        value={r.kg || ''}
                        onChange={(e) => {
                          const kg = Math.max(0, parseFloat(e.target.value) || 0);
                          setRows((p) =>
                            p.map((x) => (x.id === r.id ? { ...x, kg, fromAi: false } : x))
                          );
                        }}
                        aria-label={`Peso de ${r.name} em kg`}
                        className="w-20 rounded-lg border border-stone-300 bg-white px-2 py-2 text-right font-mono text-lg font-bold focus:border-[#2f6b4f] focus:outline-none"
                      />
                      <span className="text-sm text-stone-500">kg</span>
                    </label>
                    <button
                      type="button"
                      aria-label={`Remover ${r.name}`}
                      onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))}
                      className="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-white hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {!rows.length && (
                  <p className="rounded-xl border border-dashed border-stone-300 p-4 text-center text-sm text-stone-500">
                    {aiOffline
                      ? 'Adicione os materiais pesados abaixo.'
                      : 'Os pesos aparecem aqui quando você falar. Ou adicione manualmente.'}
                  </p>
                )}
              </div>
              {available.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {available.map((k: MaterialKey) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setRows((p) => [
                          ...p,
                          { key: k, name: MATERIALS[k].name, kg: 0, id: uid(), fromAi: false },
                        ]);
                        clearError('rows');
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:bg-stone-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {MATERIALS[k].name}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#1f3a2e] px-4 py-3 text-white">
                <span className="text-sm text-white/80">Total</span>
                <span className="font-mono text-lg font-bold">
                  {fmtKg(totalKg)} kg · +{points} pts
                </span>
              </div>
            </Step>
          </div>
        </div>

        <div className="space-y-5">
          {/* Step 3: photo */}
          <div ref={photoRef} className="scroll-mt-28">
            <Step
              n={3}
              title="Foto da balança"
              done={photo}
              error={errors?.photo ? 'Falta a foto da balança.' : undefined}
            >
              {photo ? (
                <div className="flex items-center gap-4 rounded-xl bg-stone-50 p-3">
                  <div className="grid h-20 w-28 place-items-center rounded-lg bg-[#10221a] font-mono text-xl font-bold text-emerald-300 shadow-inner">
                    {totalKg ? totalKg.toFixed(2) : '0.00'}
                  </div>
                  <div className="flex-1 text-sm">
                    <p className="font-semibold text-[#173229]">Foto anexada</p>
                    <p className="text-stone-500">balanca_{order.id}.jpg</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPhoto(false)}
                    className="cursor-pointer text-sm text-stone-500 underline hover:text-stone-900"
                  >
                    Refazer
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(true);
                    clearError('photo');
                  }}
                  className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 py-8 text-stone-600 hover:border-[#2f6b4f] hover:bg-[#f1f7f3]"
                >
                  <Camera className="h-7 w-7" />
                  <span className="font-semibold">Tirar foto da balança</span>
                </button>
              )}
            </Step>
          </div>

          {/* Step 4: signature */}
          <div ref={signRef} className="scroll-mt-28">
            <Step
              n={4}
              title="Assinatura do morador"
              done={signed}
              error={errors?.signature ? 'Falta a assinatura do morador.' : undefined}
            >
              <SignaturePad
                signed={signed}
                onChange={(v) => {
                  setSigned(v);
                  if (v) clearError('signature');
                }}
              />
            </Step>
          </div>

          {anyError && (
            <div
              role="alert"
              className="rise flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-red-900"
            >
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">Falta pouco para finalizar:</p>
                <ul className="mt-1 list-inside list-disc text-sm">
                  {errors?.rows && <li>registrar os pesos (passo 2)</li>}
                  {errors?.photo && <li>tirar a foto da balança (passo 3)</li>}
                  {errors?.signature && <li>coletar a assinatura do morador (passo 4)</li>}
                </ul>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={finish}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#1f3a2e] py-4 text-base font-bold text-white hover:bg-[#2a4d3d]"
          >
            <CircleCheck className="h-5 w-5" />
            Finalizar atendimento
          </button>
        </div>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  done,
  error,
  children,
}: {
  n: number;
  title: string;
  done?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-3xl border-2 bg-white p-5 transition ${error ? 'border-red-400 ring-4 ring-red-100' : 'border-transparent'}`}
    >
      <div className="mb-4 flex items-center gap-2.5">
        <span
          className={`grid h-7 w-7 place-items-center rounded-full text-sm font-bold ${
            done ? 'bg-[#2f6b4f] text-white' : 'bg-[#eef3ef] text-[#2f6b4f]'
          }`}
        >
          {done ? <CircleCheck className="h-4 w-4" /> : n}
        </span>
        <h2 className="text-lg font-bold text-[#173229]">{title}</h2>
        {error && (
          <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold text-red-700">
            <CircleAlert className="h-4 w-4" />
            {error}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function SignaturePad({ signed, onChange }: { signed: boolean; onChange: (v: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ratio = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * ratio;
    c.height = c.offsetHeight * ratio;
    const ctx = c.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#173229';
    }
  }, []);

  const pos = (e: PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const clear = () => {
    const c = canvasRef.current;
    c?.getContext('2d')?.clearRect(0, 0, c.width, c.height);
    onChange(false);
  };

  return (
    <div>
      <div className="relative rounded-xl border border-stone-300 bg-stone-50">
        <canvas
          ref={canvasRef}
          className="block h-36 w-full cursor-crosshair touch-none"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            const ctx = e.currentTarget.getContext('2d');
            const p = pos(e);
            ctx?.beginPath();
            ctx?.moveTo(p.x, p.y);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = e.currentTarget.getContext('2d');
            const p = pos(e);
            ctx?.lineTo(p.x, p.y);
            ctx?.stroke();
            if (!signed) onChange(true);
          }}
          onPointerUp={() => (drawing.current = false)}
          onPointerLeave={() => (drawing.current = false)}
        />
        {!signed && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-stone-400">
            <PenLine className="h-5 w-5" />
            <span className="text-sm">Peça para o morador assinar aqui com o dedo</span>
          </div>
        )}
        <div className="pointer-events-none absolute right-6 bottom-8 left-6 border-b border-dashed border-stone-300" />
      </div>
      {signed && (
        <button
          type="button"
          onClick={clear}
          className="mt-2 inline-flex cursor-pointer items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpar assinatura
        </button>
      )}
    </div>
  );
}
