import React, { useEffect, useRef, useState } from "react";
import { solicitar } from "../api";
import "../operacao.css";

export const moeda = (centavos) =>
  (Number(centavos) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
export const numero = (n) =>
  Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 3 });
export const hoje = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
export const data = (dia) =>
  new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR");

// Cancela o efeito de respostas antigas ao trocar rapidamente de tela ou mês.
export function useDados(caminho, revisao = 0) {
  const [estado, setEstado] = useState({
    dados: null,
    erro: "",
    carregando: true,
  });
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    setEstado({ dados: null, erro: "", carregando: true });
    solicitar(caminho)
      .then((dados) => {
        if (ativo) setEstado({ dados, erro: "", carregando: false });
      })
      .catch((e) => {
        if (ativo)
          setEstado({ dados: null, erro: e.message, carregando: false });
      });
    return () => {
      ativo = false;
    };
  }, [caminho, revisao, tentativa]);
  return { ...estado, repetir: () => setTentativa((n) => n + 1) };
}

export function Estado({ recurso }) {
  if (recurso.carregando) return <p role="status">Carregando…</p>;
  if (recurso.erro)
    return (
      <div role="alert" className="aviso erro">
        {recurso.erro}{" "}
        <button className="ws-btn ws-btn-ghost" onClick={recurso.repetir}>
          Tentar novamente
        </button>
      </div>
    );
  return null;
}

export function Cabecalho({ titulo, texto }) {
  return (
    <div className="ws-page-head">
      <div>
        <p className="ws-kicker">Ciclo Certo · Cada material conta</p>
        <h1>{titulo}</h1>
        <p className="ws-sub">{texto}</p>
      </div>
    </div>
  );
}

// O diálogo nativo gerencia foco, Escape e isolamento dos controles de fundo.
export function Modal({ titulo, fechar, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const elemento = ref.current;
    elemento.showModal();
    return () => elemento.close();
  }, []);
  return (
    <dialog
      className="cc-modal"
      ref={ref}
      onCancel={fechar}
      aria-labelledby="titulo-modal"
    >
      <div className="cc-linha">
        <h2 id="titulo-modal">{titulo}</h2>
        <button
          type="button"
          className="ws-btn ws-btn-ghost"
          onClick={fechar}
          aria-label="Fechar formulário"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}

// A agenda mostra capacidade agregada, sem revelar moradores ou endereços.
export function Calendario({ dia, escolher, revisao, cooperador = false }) {
  const [mes, setMes] = useState((dia || hoje()).slice(0, 7));
  const recurso = useDados(`/agenda?mes=${mes}`, revisao);
  function mover(delta) {
    const d = new Date(`${mes}-15T12:00:00`);
    d.setMonth(d.getMonth() + delta);
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return (
    <section className="ws-card cc-calendario">
      <div className="cc-linha">
        <button
          className="ws-btn ws-btn-ghost"
          aria-label="Mês anterior"
          onClick={() => mover(-1)}
          type="button"
        >
          ‹
        </button>
        <h2>
          {new Date(`${mes}-15T12:00:00`).toLocaleDateString("pt-BR", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <button
          className="ws-btn ws-btn-ghost"
          aria-label="Próximo mês"
          onClick={() => mover(1)}
          type="button"
        >
          ›
        </button>
      </div>
      <Estado recurso={recurso} />
      {recurso.dados && (
        <>
          <div className="cc-dias-semana" aria-hidden="true">
            {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>
          <div className="cc-cal-grade">
            {Array.from(
              { length: new Date(`${mes}-01T12:00:00`).getDay() },
              (_, i) => (
                <span key={`v-${i}`} />
              ),
            )}
            {recurso.dados.dias.map((d) => {
              const livre = d.horarios.some((h) => h.disponiveis > 0);
              return (
                <button
                  key={d.dia}
                  type="button"
                  className={`${dia === d.dia ? "selecionado" : ""} ${livre ? "livre" : "indisponivel"}`}
                  aria-pressed={dia === d.dia}
                  aria-label={`${data(d.dia)}, ${livre ? "disponível" : "indisponível"}, ${d.coletas} coletas`}
                  disabled={!cooperador && !livre}
                  onClick={() => escolher(d)}
                >
                  <strong>{Number(d.dia.slice(8))}</strong>
                  <small>
                    {cooperador
                      ? `${d.coletas} coleta${d.coletas === 1 ? "" : "s"}`
                      : livre
                        ? "Livre"
                        : "Fechado"}
                  </small>
                </button>
              );
            })}
          </div>
          <p className="ws-help">
            Horários de Brasília ·{" "}
            {cooperador
              ? "Selecione um dia para ver coletas e horários."
              : "Verde: há vagas. Cinza: sem horários disponíveis."}
          </p>
        </>
      )}
    </section>
  );
}

export function Tabela({ catalogo }) {
  return (
    <details className="ws-card cc-tabela">
      <summary>Valores por categoria e como calculamos</summary>
      <p>
        Referências fornecidas para esta simulação, sem cotação em tempo real. A
        pesagem real determina o valor; quantidades por unidade são
        aproximações.
      </p>
      <p>
        Preço médio da faixa × {catalogo.percentual_morador}% para o morador; os
        outros {100 - catalogo.percentual_morador}% ficam com a cooperativa. R$
        1 fictício = 100 pontos. Arredondamos uma única vez, no total da coleta.
      </p>
      <div className="cc-scroll">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Faixa de referência/kg</th>
              <th>Morador/kg</th>
            </tr>
          </thead>
          <tbody>
            {catalogo.itens.map((i) => (
              <tr key={i.codigo}>
                <td>
                  <strong>{i.nome}</strong>
                  <small className="ws-cell-sub">{i.referencia}</small>
                </td>
                <td>
                  {i.minimo
                    ? `${moeda(Number(i.minimo) * 100)} a ${moeda(Number(i.maximo) * 100)}`
                    : "Sob orientação"}
                </td>
                <td>
                  {i.valor_morador_kg
                    ? `${Number(i.valor_morador_kg).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} R$ fictícios`
                    : "Sem valor tabelado"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
