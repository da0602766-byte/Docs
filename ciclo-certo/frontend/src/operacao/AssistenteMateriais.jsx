import React, { useEffect, useRef, useState } from "react";
import { enviar } from "../api";

// A assistência tem estado próprio e só substitui os materiais após revisão humana.
export default function AssistenteMateriais({ descricao, aplicar }) {
  const [previa, setPrevia] = useState(null);
  const [historico, setHistorico] = useState([]);
  const [resposta, setResposta] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const requisicao = useRef(0);
  const controle = useRef(null);

  // Edição ou saída da tela invalida respostas antigas e cancela a espera local.
  useEffect(() => {
    requisicao.current += 1;
    controle.current?.abort();
    setPrevia(null);
    setHistorico([]);
    setResposta("");
    setErro("");
    setOcupado(false);
    return () => {
      requisicao.current += 1;
      controle.current?.abort();
    };
  }, [descricao]);

  async function consultar(esclarecer = false) {
    const numero = ++requisicao.current;
    const conversa = esclarecer
      ? [...historico, { pergunta: previa.pergunta, resposta: resposta.trim() }]
      : [];
    const abortar = new AbortController();
    controle.current = abortar;
    const prazo = setTimeout(() => abortar.abort(), 24000);
    setOcupado(true);
    setErro("");
    setAviso("");
    try {
      const dados = await enviar("/ia/sugestao-materiais", {
        descricao: descricao.trim(), esclarecimentos: conversa,
      }, "POST", { signal: abortar.signal });
      if (numero !== requisicao.current) return;
      setPrevia(dados);
      setHistorico(conversa);
      setResposta("");
    } catch (falha) {
      if (numero !== requisicao.current) return;
      setErro(falha.name === "AbortError"
        ? "A assistência demorou. Seu texto foi preservado; você pode continuar manualmente."
        : falha.message);
    } finally {
      clearTimeout(prazo);
      if (numero === requisicao.current) setOcupado(false);
    }
  }

  // Somente descrições revisadas seguem para o contrato existente do agendamento.
  function usar() {
    aplicar([...new Set(previa.itens.map((item) => item.descricao.trim()).filter(Boolean))]);
    setAviso("Descrição aplicada. Confira os materiais e confirme o agendamento quando estiver pronto.");
  }

  const valida = descricao.trim().length >= 2 && descricao.trim().length <= 2000;
  return (
    <section className="cc-assistente" aria-label="Assistência aos materiais" aria-busy={ocupado}
      onKeyDown={(evento) => {
        // Enter nos campos da prévia não deve confirmar o formulário de coleta.
        if (evento.key === "Enter" && evento.target.tagName === "INPUT") evento.preventDefault();
      }}>
      <button type="button" className="ws-btn ws-btn-ghost" disabled={ocupado || !valida}
        onClick={() => consultar()}>
        {ocupado ? "Organizando materiais…" : "Ajudar com os materiais"}
      </button>
      <p className="ws-help">A IA recebe a descrição dos materiais. Não inclua dados pessoais. Revise a sugestão antes de usar.</p>
      {erro && <p role="alert" className="aviso erro">{erro}</p>}
      {aviso && <p role="status">{aviso}</p>}
      {previa && (
        <div className="cc-assistente-previa">
          <h3>Revise a sugestão da IA</h3>
          <p role="status">{previa.mensagem}</p>
          {previa.itens.map((item, indice) => (
            <label className="ws-field" key={indice}>
              Material {indice + 1} · {item.categoria || "Categoria a confirmar"}
              <input value={item.descricao} maxLength={160} disabled={ocupado}
                onChange={(evento) => setPrevia((atual) => ({
                  ...atual, itens: atual.itens.map((valor, posicao) => posicao === indice
                    ? { ...valor, descricao: evento.target.value } : valor),
                }))} />
            </label>
          ))}
          {previa.estado === "esclarecer" && historico.length < 4 && (
            <div>
              <label className="ws-field">
                {previa.pergunta}
                <input value={resposta} maxLength={300} disabled={ocupado}
                  onChange={(evento) => setResposta(evento.target.value)} />
              </label>
              <button type="button" className="ws-btn ws-btn-ghost"
                disabled={ocupado || !resposta.trim()} onClick={() => consultar(true)}>Responder à IA</button>
            </div>
          )}
          {previa.itens.length > 0 && (
            <>
              <p className="ws-help">Categorias são sugestões. A equipe confirma a triagem; pontos dependem da pesagem.</p>
              <button type="button" className="ws-btn" disabled={ocupado || previa.itens.some((item) => !item.descricao.trim())}
                onClick={usar}>Usar descrição</button>
            </>
          )}
          <button type="button" className="ws-btn ws-btn-ghost" disabled={ocupado}
            onClick={() => { setPrevia(null); setHistorico([]); setErro(""); }}>Descartar sugestão</button>
        </div>
      )}
    </section>
  );
}
