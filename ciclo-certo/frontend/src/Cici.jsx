import React, { useEffect, useRef, useState } from "react";
import { consultarMateriais, guardarRascunhoCici, intencaoCici, responderSobreValores } from "./regrasCici";
import "./cici.css";

export function MarcaCici({ animada = false, compacta = false }) {
  return (
    <span className={`cici-marca${animada ? " cici-marca-animada" : ""}${compacta ? " cici-marca-compacta" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <path d="M10 25C4 15 15 7 28 6c1 13-5 24-16 21" fill="#8ff6c5" fillOpacity=".15" stroke="#8ff6c5" strokeWidth="1.5" strokeLinejoin="round" />
        <path className="cici-folha-circuito" d="M7 30l14-14m-7 7v-6m3 3h6m-9-3-2-2" stroke="#d6fff0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <g className="cici-folha-nos" fill="#7beaff"><circle cx="21" cy="16" r="1.7" /><circle cx="23" cy="20" r="1.4" /><circle cx="12" cy="15" r="1.4" /></g>
      </svg>
    </span>
  );
}

const exemplosPublicos = ["Como separar vidro?", "Tenho latinhas e garrafas PET", "Quero agendar uma coleta"];
const exemplosMorador = ["Agendar coleta", "Minhas coletas", "Meus pontos", "Avaliar coleta", "Benefícios", "Meu impacto", "Notificações", "Comunidade"];
export const CADASTRO_COLETA = "/login?cadastro=1&destino=agendar&cici=1";
export const ENTRAR_COLETA = "/login?destino=agendar&cici=1";

function AcessoColeta({ itens }) {
  return (
    <div className="cici-acesso">
      <strong>Crie sua conta para agendar a coleta</strong>
      <p>Escolha uma vaga, acompanhe a pesagem e use seus pontos na loja.</p>
      <div className="cici-acoes">
        <a className="cici-primario" href={CADASTRO_COLETA} onClick={() => guardarRascunhoCici(itens)}>Criar conta</a>
        <a className="cici-secundario" href={ENTRAR_COLETA} onClick={() => guardarRascunhoCici(itens)}>Já tenho conta</a>
      </div>
    </div>
  );
}

// A mesma conversa atende a landing e a área autenticada. Cada ação de escrita abre a tela real para confirmação.
export default function Cici({ catalogo, morador, responderMorador, abrirAcao }) {
  const [texto, setTexto] = useState("");
  const [mensagens, setMensagens] = useState([]);
  const [materiais, setMateriais] = useState([]);
  const [pendente, setPendente] = useState(null);
  const fim = useRef(null);
  const conversa = useRef(null);
  const compondo = useRef(false);
  const sequencia = useRef(0);

  useEffect(() => {
    if (mensagens.length && fim.current && conversa.current) {
      conversa.current.scrollTop = conversa.current.scrollHeight;
    }
  }, [mensagens]);

  function enviar(pergunta, respostaEsclarecimento = false) {
    const consulta = pergunta.trim();
    if (!consulta) return;
    const resultado = consultarMateriais(consulta, catalogo);
    const acao = (respostaEsclarecimento && pendente) || intencaoCici(consulta);
    const itens = resultado.itens.length && (respostaEsclarecimento || acao === "agendar")
      ? [...new Map([...materiais, ...resultado.itens].map((item) => [item.codigo, item])).values()]
      : resultado.itens.length ? resultado.itens : materiais;
    setMateriais(itens);
    setPendente(resultado.pergunta ? acao || "materiais" : null);

    const valores = responderSobreValores(consulta, catalogo, resultado.itens);
    const resposta = valores ? { texto: valores } : resultado.pergunta
      ? { texto: resultado.pergunta.texto, opcoes: resultado.pergunta.opcoes }
      : morador && acao && acao !== "materiais"
        ? responderMorador(acao)
        : acao && acao !== "materiais"
          ? { texto: acao === "agendar" ? "Posso levar os materiais que você separou para o agendamento." : "Entre na sua conta para acessar esse serviço.", acesso: true }
          : resultado.itens.length || resultado.avisos.length
            ? { texto: "Veja como preparar os materiais antes da coleta.", agendar: resultado.itens.some((item) => item.codigo !== "eletronicos") }
            : { texto: "Posso ajudar com materiais e coletas. Tente escrever “tenho caixas de papelão e latinhas” ou use um dos atalhos abaixo." };

    const id = ++sequencia.current;
    setMensagens((anteriores) => [...anteriores.slice(-19), {
      id,
      consulta,
      resposta,
      materiais: resultado.itens,
      avisos: resultado.avisos,
      rascunho: itens.filter((item) => item.codigo !== "eletronicos"),
    }]);
    setTexto("");
  }

  function agendar(itens) {
    if (morador) {
      abrirAcao("agendar", itens);
      return;
    }
    const id = ++sequencia.current;
    setMensagens((anteriores) => [...anteriores.slice(-19), {
      id,
      consulta: "Quero agendar uma coleta",
      resposta: { texto: "Seu agendamento começa na sua conta.", acesso: true },
      materiais: [],
      avisos: [],
      rascunho: itens,
    }]);
  }

  return (
    <section id="cici" className="cici-painel" aria-labelledby="cici-titulo">
      <header className="cici-cabecalho">
        <MarcaCici animada={!morador} />
        <div>
          <h2 id="cici-titulo">Converse com a Cici</h2>
          <p>{morador ? "Seu ponto de partida para coletas, pontos e comunidade" : "Assistente de reciclagem · Pergunte sem criar conta"}</p>
        </div>
      </header>
      <div className="cici-conversa" ref={conversa} role="log" aria-label="Conversa com a Cici">
        <p className="cici-fala">
          {morador
            ? `Olá, ${morador.nome.trim().split(/\s+/)[0]}! Posso te ajudar a agendar, consultar suas coletas ou entender como separar seus recicláveis.`
            : "Oi, sou a Cici! Conte o que você separou e eu te ajudo a preparar para a coleta."}
        </p>
        {mensagens.map(({ id, consulta, resposta, materiais: itens, avisos, rascunho }, index) => (
          <div className="cici-turno" key={id}>
            <p className="cici-usuario"><span className="cici-sr">Você: </span>{consulta}</p>
            <div className="cici-fala">
              <p className="cici-texto-resposta"><span className="cici-sr">Cici: </span>{resposta.texto}</p>
              {!!itens.length && <ul className="cici-materiais">
                {itens.map((item) => <li key={item.codigo}><strong>{item.nome}</strong><p>{item.orientacao}</p></li>)}
              </ul>}
              {avisos.map((aviso) => <p className="cici-cuidado" key={aviso}>{aviso}</p>)}
              {resposta.opcoes && index === mensagens.length - 1 && <div className="cici-acoes">
                {resposta.opcoes.map((opcao) => <button type="button" className="cici-secundario" key={opcao} onClick={() => enviar(opcao, true)}>{opcao}</button>)}
              </div>}
              {resposta.agendar && <button type="button" className="cici-secundario" onClick={() => agendar(rascunho)}>Agendar com estes materiais</button>}
              {resposta.acesso && <AcessoColeta itens={rascunho} />}
              {resposta.acao && <button type="button" className="cici-secundario" onClick={() => abrirAcao(resposta.acao, rascunho, resposta.id)}>{resposta.rotulo}</button>}
            </div>
          </div>
        ))}
        <span ref={fim} />
      </div>
      <form className="cici-compor" onSubmit={(evento) => { evento.preventDefault(); if (!compondo.current) enviar(texto, Boolean(pendente)); }}>
        <label className="cici-sr" htmlFor="cici-mensagem">Sua mensagem para a Cici</label>
        <input enterKeyHint="send" autoComplete="off"
          onCompositionStart={() => { compondo.current = true; }} onCompositionEnd={() => { compondo.current = false; }}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.nativeEvent.isComposing || compondo.current)) e.preventDefault(); }} id="cici-mensagem" placeholder="O que você quer saber?" value={texto} onChange={(evento) => setTexto(evento.target.value)} maxLength={320} />
        <button type="submit" className="cici-enviar" disabled={!texto.trim()} aria-label="Enviar mensagem">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5m-6 6 6-6 6 6" /></svg>
          <span>Enviar</span>
        </button>
      </form>
      <div className="cici-atalhos" aria-label="Perguntas sugeridas">
        {(morador ? exemplosMorador : exemplosPublicos).map((exemplo) => (
          <button type="button" key={exemplo} onClick={() => enviar(exemplo)}>{exemplo}</button>
        ))}
      </div>
      {!morador && <a className="cici-manual" href="#pontos">Prefiro consultar a tabela de materiais</a>}
    </section>
  );
}
