import { useEffect, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { ENTRAR_COLETA, MarcaCici } from "../Cici";

const frasesMorador = [
  "Separou os recicláveis? Eu te ajudo a marcar a retirada.",
  "Juntou caixas e garrafas? Vamos marcar uma coleta?",
  "Já separou uma sacola? Eu te ajudo a encontrar um horário.",
  "Tem papelão, latinhas ou PET? Eu te ajudo a preparar a coleta.",
  "Quer liberar espaço? Vamos marcar a retirada dos recicláveis?",
];

const frasesCooperador = [
  "Saindo para a rota? Eu posso te mostrar as prioridades do dia.",
  "Vai assumir uma coleta? Eu ajudo você a conferir o peso estimado e o kit do pedido.",
  "Antes de sair, me pergunte se há algum atendimento atrasado.",
];

const chaveFrase = "ciclo-certo:cici:frase-entrada";

export default function CiciFlutuante({ cooperador = false, aoAgendar, conversa, aberta, aoAbrir, destino = "/#cici" }) {
  const frases = cooperador ? frasesCooperador : frasesMorador;
  const [indice] = useState(() => {
    try {
      const anterior = Number.parseInt(sessionStorage.getItem(chaveFrase), 10);
      if (Number.isInteger(anterior) && anterior >= 0) return (anterior + 1) % frases.length;
    } catch { /* A mensagem ainda aparece com armazenamento bloqueado. */ }
    return Math.floor(Math.random() * frases.length);
  });
  const [etapa, setEtapa] = useState("espera");
  const [interagindo, setInteragindo] = useState(false);
  const fechar = () => setEtapa("encerrada");

  useEffect(() => {
    try { sessionStorage.setItem(chaveFrase, String(indice)); } catch { /* Sem persistência. */ }
  }, [indice]);

  // O balão começa na Cici com uma bolinha e dá lugar à fala.
  useEffect(() => {
    if (aberta) {
      setEtapa("encerrada");
      return;
    }
    let timer;
    if (etapa === "espera") {
      const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer = window.setTimeout(() => setEtapa(reduzir ? "fala" : "animacao"), 550);
    } else if (etapa === "animacao") {
      timer = window.setTimeout(() => setEtapa("fala"), 720);
    } else if (etapa === "fala" && !interagindo) {
      timer = window.setTimeout(() => setEtapa("encerrada"), 12_000);
    }
    return () => window.clearTimeout(timer);
  }, [aberta, etapa, interagindo]);

  const rotulo = "Abrir conversa com a Cici";
  const icone = <><span>Cici</span><MarcaCici animada /></>;
  return (
    <div className="cici-flutuante" data-painel={conversa ? "" : undefined}>
      {aoAbrir ? (
        <button type="button" className="cici-lateral" aria-label={rotulo} aria-haspopup="dialog"
          aria-controls={conversa} aria-expanded={aberta} onClick={aoAbrir}>{icone}</button>
      ) : (
        <a className="cici-lateral" aria-label={rotulo} href={destino} onClick={fechar}>{icone}</a>
      )}
      {!aberta && (etapa === "animacao" || etapa === "fala") && (
        <aside className="cici-aviso-entrada" aria-label="Aviso da Cici" data-animando={etapa === "animacao" ? "" : undefined}
          onPointerEnter={(evento) => { if (evento.pointerType === "mouse") setInteragindo(true); }}
          onPointerLeave={(evento) => { if (evento.pointerType === "mouse") setInteragindo(false); }}
          onFocus={() => setInteragindo(true)}
          onBlur={(evento) => { if (!evento.currentTarget.contains(evento.relatedTarget)) setInteragindo(false); }}>
          {etapa === "animacao" && <span className="cici-aviso-bolinha" aria-hidden="true" />}
          <div className="cici-aviso-fala">
            <p role="status">{etapa === "fala" && frases[indice]}</p>
            {etapa === "fala" && !cooperador && (aoAgendar
              ? <button type="button" className="cici-aviso-acao" onClick={() => { fechar(); aoAgendar(); }}>Agendar coleta <ArrowRight size={16} aria-hidden="true" /></button>
              : <a className="cici-aviso-acao" href={ENTRAR_COLETA}>Agendar coleta <ArrowRight size={16} aria-hidden="true" /></a>
            )}
          </div>
          {etapa === "fala" && <button type="button" className="cici-aviso-fechar" aria-label="Fechar aviso da Cici" onClick={fechar}><X size={18} aria-hidden="true" /></button>}
        </aside>
      )}
    </div>
  );
}
