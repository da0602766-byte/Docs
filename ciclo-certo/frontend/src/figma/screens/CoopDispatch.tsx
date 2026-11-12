import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock, Droplets, Package, Truck } from 'lucide-react';
import JanelaCici, { BotaoConversa } from '../../operacao/JanelaCici';
import { AiBubble, AiComposer, UserBubble } from '../components/ai';
import { fmtHour } from '../lib/assistant';
import type { CoopOrder, Priority, RecState } from '../types';

type RecId = 'cart' | 'rain' | 'guide';
type Pedido = CoopOrder & { awaitingReview?: boolean; materiais: string[]; pesoEstimado?: number | string | null };
type Filtro = 'todos' | 'atrasados' | 'em_atendimento' | 'finalizados';
type Turno = 'todos' | 'manha' | 'tarde' | 'sem_horario';

interface Props {
  orders: Pedido[];
  recs: Record<RecId, RecState>;
  onAccept: (id: RecId) => void;
  onDismiss: (id: RecId) => void;
  onUndo: (id: RecId) => void;
  onOpenOrder: (id: string) => void;
}

const prioridade: Record<Priority, number> = { urgente: 0, alta: 1, normal: 2 };
const hora = (pedido: Pedido) => Number.isFinite(pedido.start) ? fmtHour(pedido.start) : 'Sem horário';
const turno = (pedido: Pedido): Turno =>
  !Number.isFinite(pedido.start) ? 'sem_horario' : pedido.route === 1 ? 'manha' : 'tarde';

export function ordenarFila(pedidos: Pedido[]) {
  const andamento = { doing: 0, todo: 1, done: 2 };
  return [...pedidos].sort((a, b) =>
    andamento[a.status] - andamento[b.status] || prioridade[a.priority] - prioridade[b.priority] || a.start - b.start);
}

function situacao(pedido: Pedido) {
  if (pedido.awaitingReview) return { label: 'Aguardando avaliação', cor: 'aguardando' };
  if (pedido.status === 'done') return { label: 'Concluída', cor: 'finalizada' };
  if (pedido.status === 'doing') return { label: 'Em atendimento', cor: 'andamento' };
  if (pedido.priority === 'urgente') return { label: 'Atrasada', cor: 'atrasada' };
  return { label: 'Agendada', cor: 'agendada' };
}

export function CoopDispatch({ orders, recs, onAccept, onDismiss, onUndo, onOpenOrder }: Props) {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [turnoSelecionado, setTurno] = useState<Turno>('todos');
  const [aberta, setAberta] = useState(false);
  const abertas = ordenarFila(orders.filter((pedido) => pedido.status !== 'done'));
  const atrasadas = abertas.filter((pedido) => pedido.priority === 'urgente');
  const emAtendimento = abertas.filter((pedido) => pedido.status === 'doing');
  const concluidas = orders.filter((pedido) => pedido.status === 'done');
  const vidro = abertas.filter((pedido) => pedido.heavyGlass);
  const papel = abertas.filter((pedido) => pedido.expected.some((item) => item.key === 'papel'));
  const lista = ordenarFila(orders).filter((pedido) =>
    (turnoSelecionado === 'todos' || turnoSelecionado === turno(pedido)) && (
      filtro === 'todos' || (filtro === 'atrasados' && pedido.priority === 'urgente') ||
      (filtro === 'em_atendimento' && pedido.status === 'doing') ||
      (filtro === 'finalizados' && pedido.status === 'done')));
  const recomendacoes = [
    { id: 'cart' as const, Icon: Package, titulo: 'Revisar o kit de vidro', texto: vidro.length + ' pedido(s) com vidro informado.', mostrar: vidro.length > 0 },
    { id: 'rain' as const, Icon: Droplets, titulo: 'Proteger papel da umidade', texto: papel.length + ' pedido(s) com papel ou papelão.', mostrar: papel.length > 0 },
    { id: 'guide' as const, Icon: BookOpen, titulo: 'Conferir a próxima prioridade', texto: abertas[0] ? '#' + abertas[0].id + ' · ' + abertas[0].resident + ' · ' + hora(abertas[0]) : '', mostrar: abertas.length > 0 },
  ].filter((item) => item.mostrar);

  return (
    <div className="cooperador-painel">
      <div className="cooperador-metricas" aria-label="Resumo das coletas de hoje">
        {[
          { label: 'Coletas hoje', valor: orders.length, Icon: CalendarDays },
          { label: 'Em atendimento', valor: emAtendimento.length, Icon: Truck },
          { label: 'Finalizadas', valor: concluidas.length, Icon: CheckCircle2 },
          { label: 'Atrasadas', valor: atrasadas.length, Icon: AlertTriangle },
        ].map(({ label, valor, Icon }) => <div key={label} className="cooperador-metrica">
          <Icon size={19} aria-hidden="true" />
          <span>{label}</span><strong>{valor}</strong>
        </div>)}
      </div>
      <div className="cooperador-colunas">
        <section className="cooperador-bloco" aria-labelledby="cooperador-fila">
          <header className="cooperador-bloco-topo">
            <div><h2 id="cooperador-fila">Fila de atendimento</h2>
              <p>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'America/Sao_Paulo' }).format(new Date())}</p>
            </div>
            <div className="cooperador-filtros">
              <label>Situação
                <select value={filtro} onChange={(e) => setFiltro(e.target.value as Filtro)}>
                  <option value="todos">Todas</option><option value="atrasados">Atrasadas</option>
                  <option value="em_atendimento">Em atendimento</option><option value="finalizados">Finalizadas</option>
                </select>
              </label>
              <label>Turno
                <select value={turnoSelecionado} onChange={(e) => setTurno(e.target.value as Turno)}>
                  <option value="todos">Todos</option><option value="manha">Manhã</option>
                  <option value="tarde">Tarde</option><option value="sem_horario">Sem horário</option>
                </select>
              </label>
            </div>
          </header>
          {lista.length ? <ul className="cooperador-pedidos">
            {lista.map((pedido) => {
              const status = situacao(pedido);
              return <li key={pedido.id}>
                <button type="button" className="cooperador-pedido" onClick={() => onOpenOrder(pedido.id)}>
                  <span className="cooperador-hora"><Clock size={15} aria-hidden="true" />{hora(pedido)}</span>
                  <span className="cooperador-pedido-info">
                    <strong>{pedido.resident}</strong>
                    <span>#{pedido.id} · {pedido.address || 'Endereço não informado'}</span>
                    {pedido.materiais.length > 0 && <span>{pedido.materiais.join(' · ')}</span>}
                    {pedido.pesoEstimado != null && <span>Peso estimado: {Number(pedido.pesoEstimado).toLocaleString('pt-BR')} kg</span>}
                    {pedido.reasons.length > 0 && <span className="cooperador-motivo">{pedido.reasons.join(' · ')}</span>}
                  </span>
                  <span className={'cooperador-status ' + status.cor}>{status.label}</span>
                  <ChevronRight size={17} className="cooperador-seta" aria-hidden="true" />
                </button>
              </li>;
            })}
          </ul> : <p className="cooperador-vazio">{orders.length ? 'Nenhuma coleta corresponde a esses filtros.' : 'Nenhuma coleta marcada para hoje.'}</p>}
        </section>
        <aside className="cooperador-bloco cooperador-cici">
          <h2>Recomendações da Cici</h2>
          {recomendacoes.length ? <ul className="cooperador-recomendacoes">
            {recomendacoes.map(({ id, Icon, titulo, texto }) => <li key={id}>
              <Icon size={18} aria-hidden="true" />
              <div><strong>{titulo}</strong><p>{texto}</p>
                {recs[id] === 'dismissed' ? <button type="button" onClick={() => onUndo(id)}>Desfazer dispensa</button> : (
                  <div className="cooperador-rec-acoes">
                    <button type="button" onClick={() => onAccept(id)}>Abrir coleta</button>
                    <button type="button" onClick={() => onDismiss(id)}>Dispensar</button>
                  </div>
                )}
              </div>
            </li>)}
          </ul> : <p className="cooperador-vazio">As recomendações aparecem quando houver coletas a atender.</p>}
          <BotaoConversa onClick={() => setAberta(true)}>Perguntar à Cici</BotaoConversa>
        </aside>
      </div>
      {orders.length > 0 && <details className="cooperador-bloco cooperador-horarios">
        <summary>Coletas em ordem de horário</summary>
        <ol>
          {[...orders].sort((a, b) => a.start - b.start).map((pedido) => <li key={pedido.id}>
            <button type="button" onClick={() => onOpenOrder(pedido.id)}>
              <span>{hora(pedido)}</span><span>#{pedido.id} · {pedido.resident}</span>
            </button>
          </li>)}
        </ol>
      </details>}
      <JanelaCici aberta={aberta} definirAbertura={setAberta} subtitulo="Apoio à operação de hoje" cooperador>
        <ConversaCooperador pedidos={orders} />
      </JanelaCici>
    </div>
  );
}

function ConversaCooperador({ pedidos }: { pedidos: Pedido[] }) {
  const [mensagens, setMensagens] = useState<{ texto: string; pergunta: string }[]>([]);
  const historico = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lista = historico.current;
    if (lista) lista.scrollTop = lista.scrollHeight;
  }, [mensagens]);

  function responder(pergunta: string) {
    const texto = pergunta.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const fila = ordenarFila(pedidos.filter((pedido) => pedido.status !== 'done'));
    if (/atras/.test(texto)) {
      const atrasados = fila.filter((pedido) => pedido.priority === 'urgente');
      return atrasados.length ? atrasados.map((pedido) => '#' + pedido.id + ' · ' + hora(pedido)).join('\n') : 'Não há coletas atrasadas na agenda de hoje.';
    }
    if (/priori|proxim|primeir/.test(texto)) {
      return fila[0] ? 'Próximo atendimento: #' + fila[0].id + ', ' + hora(fila[0]) + '. ' + fila[0].reasons.join(' · ') : 'A fila de hoje está sem pedidos em aberto.';
    }
    if (/peso|capacidade|carga/.test(texto)) return 'O peso estimado pelo morador aparece na fila. Abra o pedido para conferir o kit recomendado e as pesagens registradas.';
    if (/chuva|clima|papel/.test(texto)) return 'Para as coletas com papel ou papelão, prepare uma cobertura que mantenha o material seco.';
    if (/oleo/.test(texto)) return 'Para recolher óleo, leve um recipiente vedado e confira o material no pedido.';
    return pedidos.length + ' coletas hoje. ' + fila.length + ' ainda estão abertas e ' + (pedidos.length - fila.length) + ' foram finalizadas.';
  }

  return (
    <section className="cici-dialogo-chat" aria-label="Conversa sobre a operação">
      <div className="cici-dialogo-mensagens" role="log" ref={historico} aria-label="Mensagens da Cici sobre a operação">
        <div className="space-y-4">
          <AiBubble>Posso resumir os pedidos do dia e ajudar a encontrar atrasos e prioridades.</AiBubble>
          {mensagens.map(({ pergunta, texto }, i) => <div key={i} className="space-y-3"><UserBubble>{pergunta}</UserBubble><AiBubble>
            <p className="cici-texto-resposta">{texto}</p>
          </AiBubble></div>)}
        </div>
      </div>
      <div className="cici-controles">
        <AiComposer status='idle' placeholder="Pergunte sobre os pedidos de hoje…" onSubmit={(pergunta) => {
          setMensagens((lista) => [...lista.slice(-11), { pergunta, texto: responder(pergunta) }]);
        }} suggestions={['Qual a próxima prioridade?', 'Tem algo atrasado?']} />
      </div>
    </section>
  );
}
