import React, { useEffect, useRef, useState } from "react";
import { MarcaCici } from "../Cici";
import { interpretarPesos, normalizarCici } from "../regrasCici";

// Prioridades vêm da agenda real. Pedidos em atendimento e atrasos recebem atenção primeiro.
export function ResumoCiciOperacao({ coletas, dia, abrir }) {
  const [pergunta, setPergunta] = useState("");
  const [intencao, setIntencao] = useState("");
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const agora = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  const turnos = coletas.filter((coleta) => coleta.dia === dia && coleta.situacao !== "cancelada");
  const concluidas = turnos.filter((coleta) => ["coletada", "aguardando_avaliacao"].includes(coleta.situacao));
  const abertas = turnos.filter((coleta) => ["agendada", "em_coleta"].includes(coleta.situacao));
  const atrasada = (coleta) => dia === hoje && coleta.situacao === "agendada" && coleta.hora && coleta.hora.slice(0, 5) < agora;
  const especial = (coleta) => /vidro|cacos?|eletron|bateria/.test(normalizarCici((coleta.materiais_informados || []).join(" ")));
  const prioridade = (coleta) => coleta.situacao === "em_coleta" ? 0 : atrasada(coleta) ? 1 : especial(coleta) ? 2 : 3;
  const fila = abertas.sort((a, b) => prioridade(a) - prioridade(b) || (a.hora || "99").localeCompare(b.hora || "99"));
  const atrasos = fila.filter(atrasada).length;
  const cuidado = fila.filter(especial).length;
  const ativas = fila.filter((coleta) => coleta.situacao === "em_coleta").length;
  const motivos = ["Em atendimento", "Horário passou", "Material requer cuidado", "Agendada"];
  const respostas = {
    atrasos: atrasos ? `${atrasos} ${atrasos === 1 ? "coleta passou" : "coletas passaram"} do horário e ainda aguardam atendimento.` : "Nenhuma coleta agendada passou do horário neste dia.",
    materiais: cuidado ? `${cuidado} ${cuidado === 1 ? "coleta pede" : "coletas pedem"} atenção a vidro ou eletrônicos. Confira os materiais e prepare o kit ao abrir o pedido.` : "Nenhuma coleta aberta informa vidro ou eletrônicos.",
    prioridade: fila[0] ? `Confira primeiro a coleta nº ${fila[0].id}. ${motivos[prioridade(fila[0])]}${fila[0].hora ? ` · ${fila[0].hora.slice(0, 5)}` : ""}.` : "Não há atendimentos em aberto neste dia.",
    andamento: `${concluidas.length} de ${turnos.length} coletas finalizadas. ${ativas} em atendimento.`,
    desconhecida: "Posso resumir o andamento, as coletas atrasadas, os materiais que pedem cuidado e a próxima prioridade.",
  };
  function perguntar(evento) {
    evento.preventDefault();
    const texto = normalizarCici(pergunta.trim());
    if (!texto) return;
    setIntencao(/atras|passou/.test(texto) ? "atrasos" : /vidro|carga|equipamento|material/.test(texto) ? "materiais" : /priori|proxim/.test(texto) ? "prioridade" : /andamento|quant|conclu/.test(texto) ? "andamento" : "desconhecida");
    setPergunta("");
  }
  return (
    <section className="cici-operacao" aria-labelledby="cici-operacao-titulo">
      <div className="cici-cabecalho">
        <MarcaCici />
        <div>
          <h2 id="cici-operacao-titulo">Resumo da Cici</h2>
          <p>{respostas.andamento}</p>
        </div>
      </div>
      {turnos.length > 0 && <progress aria-label="Coletas finalizadas" max={turnos.length} value={concluidas.length} />}
      <form className="cici-operacao-pergunta" onSubmit={perguntar}>
        <label className="cici-sr" htmlFor="cici-turno-pergunta">Pergunte à Cici sobre as coletas do dia</label>
        <input id="cici-turno-pergunta" placeholder="Qual a próxima prioridade?" value={pergunta} maxLength={160} onChange={(evento) => setPergunta(evento.target.value)} />
        <button type="submit">Perguntar</button>
      </form>
      {intencao && <p role="status">{respostas[intencao]}</p>}
      {fila.length > 0 && <ul aria-label="Próximas coletas por prioridade">
        {fila.slice(0, 3).map((coleta) => (
          <li key={coleta.id}>
            <span><strong>Coleta nº {coleta.id}</strong> · {coleta.hora?.slice(0, 5) || "Sem horário"} · {motivos[prioridade(coleta)]}</span>
            <button type="button" onClick={() => abrir(coleta.id)}>Abrir coleta nº {coleta.id}</button>
          </li>
        ))}
      </ul>}
    </section>
  );
}

export function PesagemCici({ catalogo, aplicar, ocupado }) {
  const [texto, setTexto] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  const [aviso, setAviso] = useState("");
  const [ouvindo, setOuvindo] = useState(false);
  const reconhecedor = useRef(null);
  const Reconhecimento = window.SpeechRecognition || window.webkitSpeechRecognition;
  useEffect(() => () => reconhecedor.current?.abort(), []);

  function ouvir() {
    if (ouvindo) { reconhecedor.current?.stop(); return; }
    try {
      const reconhecimento = new Reconhecimento();
      reconhecedor.current = reconhecimento;
      reconhecimento.lang = "pt-BR";
      reconhecimento.onstart = () => setOuvindo(true);
      reconhecimento.onend = () => setOuvindo(false);
      reconhecimento.onerror = () => setAviso("Não consegui transcrever. Você pode digitar os pesos.");
      reconhecimento.onresult = (evento) => {
        setTexto(evento.results[0][0].transcript);
        setSugestoes([]);
        setAviso("");
      };
      reconhecimento.start();
    } catch {
      setAviso("O microfone está indisponível. Você pode digitar os pesos.");
    }
  }

  function interpretar() {
    const pesos = interpretarPesos(texto, catalogo);
    setSugestoes(pesos.filter(Boolean));
    setAviso(pesos.length === 0 || pesos.includes(null) ? "Não reconheci parte da descrição. Use o peso em kg e o nome do material, ou preencha manualmente." : "Confira cada peso antes de usar no formulário.");
  }

  return (
    <details className="cici-peso">
      <summary>Preparar pesagens com a Cici</summary>
      <label className="ws-field">
        Descreva as pesagens
        <input maxLength={300} placeholder="Ex.: 3,2 kg de PET e 1,5 kg de papelão" value={texto}
          onChange={(evento) => { setTexto(evento.target.value); setSugestoes([]); setAviso(""); }} />
      </label>
      <div className="cici-acoes">
        <button type="button" className="ws-btn ws-btn-ghost" disabled={!texto.trim() || ocupado} onClick={interpretar}>Interpretar pesos</button>
        {Reconhecimento && <button type="button" className="ws-btn ws-btn-ghost" onClick={ouvir}>{ouvindo ? "Parar de ouvir" : "Ditar pesos"}</button>}
      </div>
      {Reconhecimento && <p className="ws-help">Ao ditar, informe só material e peso. O navegador pode processar a voz em um serviço de transcrição.</p>}
      {aviso && <p className="ws-help" role="status">{aviso}</p>}
      {sugestoes.length > 0 && <ul>
        {sugestoes.map((item, indice) => <li key={indice}>
          <span>{item.nome} · {item.quilos.replace(".", ",")} kg</span>
          <button type="button" className="ws-btn ws-btn-ghost" disabled={ocupado} onClick={() => aplicar(item)}>Usar no formulário</button>
        </li>)}
      </ul>}
    </details>
  );
}
