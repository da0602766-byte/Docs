import React, { useState } from "react";
import { enviar } from "../api";
import { data, Cabecalho, Calendario, Tabela } from "./interface";

export default function Agendar({ catalogo, concluir }) {
  const [selecao, setSelecao] = useState(null);
  const [hora, setHora] = useState("");
  const [endereco, setEndereco] = useState("");
  const [texto, setTexto] = useState("");
  const [materiais, setMateriais] = useState([]);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [revisao, setRevisao] = useState(0);
  const normalizar = (v) =>
    v
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  const sugestoes = catalogo.itens
    .filter((i) =>
      normalizar(`${i.nome} ${i.referencia}`).includes(normalizar(texto)),
    )
    .slice(0, 6);
  const cuidados = catalogo.itens.filter(
    (i) =>
      i.cuidado &&
      (materiais.includes(i.nome) ||
        (texto.length > 2 &&
          normalizar(`${i.nome} ${i.referencia}`).includes(normalizar(texto)))),
  );
  const eletronicoLivre = /eletr[oô]n|bateria|pilha|celular/i.test(
    [texto, ...materiais].join(" "),
  );
  const vidroLivre = /vidro|caco/i.test([texto, ...materiais].join(" "));
  function incluir(valor) {
    if (valor.trim()) setMateriais((m) => [...new Set([...m, valor.trim()])]);
    setTexto("");
  }
  async function salvar(e) {
    e.preventDefault();
    setErro("");
    const lista = [
      ...new Set([...materiais, ...(texto.trim() ? [texto.trim()] : [])]),
    ];
    if (!selecao || !hora || !lista.length) {
      setErro("Escolha dia, horário e ao menos um material.");
      return;
    }
    setOcupado(true);
    try {
      await enviar("/coletas", {
        endereco,
        dia: selecao.dia,
        hora,
        materiais_informados: lista,
      });
      concluir();
    } catch (e) {
      setErro(e.message);
      setRevisao((n) => n + 1);
      setHora("");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <Cabecalho
        titulo="Agendar coleta"
        texto="Escolha uma vaga e conte o que você separou."
      />
      <div className="cc-duas-colunas">
        <Calendario
          dia={selecao?.dia}
          escolher={(d) => {
            setSelecao(d);
            setHora("");
          }}
          revisao={revisao}
        />
        <form className="ws-card cc-form" onSubmit={salvar}>
          <h2>Sua próxima coleta</h2>
          <p>
            {selecao ? data(selecao.dia) : "Selecione um dia no calendário"}
          </p>
          <fieldset>
            <legend>Horários disponíveis</legend>
            <div className="cc-horarios">
              {selecao?.horarios.map((h) => (
                <button
                  type="button"
                  className={`ws-btn ${hora === h.hora ? "" : "ws-btn-ghost"}`}
                  disabled={!h.disponiveis}
                  key={h.hora}
                  aria-pressed={hora === h.hora}
                  onClick={() => setHora(h.hora)}
                >
                  {h.hora}
                  <small>
                    {h.disponiveis ? `${h.disponiveis} vagas` : "Indisponível"}
                  </small>
                </button>
              ))}
            </div>
          </fieldset>
          <label className="ws-field">
            Endereço completo
            <input
              required
              minLength={10}
              maxLength={160}
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              autoComplete="street-address"
            />
          </label>
          <label className="ws-field">
            O que você separou?
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={160}
              placeholder="Ex.: latinhas, papel, garrafas…"
            />
          </label>
          <div className="cc-sugestoes">
            {sugestoes.map((i) => (
              <button
                type="button"
                className="cc-chip"
                key={i.codigo}
                onClick={() => incluir(i.nome)}
              >
                + {i.nome}
              </button>
            ))}
            {texto.trim() && (
              <button
                type="button"
                className="cc-chip"
                onClick={() => incluir(texto)}
              >
                Adicionar “{texto}”
              </button>
            )}
          </div>
          <ul className="cc-selecionados">
            {materiais.map((m) => (
              <li key={m}>
                {m}
                <button
                  type="button"
                  aria-label={`Remover ${m}`}
                  onClick={() =>
                    setMateriais((lista) => lista.filter((v) => v !== m))
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          {cuidados.map((i) => (
            <p className="cc-cuidado" role="status" key={i.codigo}>
              <strong>{i.nome}: </strong>
              {i.cuidado}
            </p>
          ))}
          {vidroLivre &&
            !cuidados.some((i) => i.codigo.startsWith("vidro")) && (
              <p className="cc-cuidado">
                Vidro: proteja cacos em embalagem rígida identificada e avise a
                equipe.
              </p>
            )}
          {eletronicoLivre && (
            <p className="cc-cuidado">
              Eletrônicos e baterias: não desmonte nem perfure. Mantenha
              separados e combine a destinação com a cooperativa. Não há
              recompensa tabelada para eletrônicos.
            </p>
          )}
          <p className="ws-help">
            Você ganha pontos somente após a pesagem confirmada e sua avaliação.
          </p>
          {erro && (
            <p role="alert" className="aviso erro">
              {erro}
            </p>
          )}
          <button className="ws-btn" disabled={ocupado}>
            {ocupado ? "Agendando…" : "Confirmar agendamento"}
          </button>
        </form>
      </div>
      <Tabela catalogo={catalogo} />
    </>
  );
}
