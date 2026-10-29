import React, { useState } from "react";
import { enviar } from "../api";
import { Situacao } from "../visual";
import {
  hoje,
  data,
  numero,
  useDados,
  Estado,
  Cabecalho,
  Calendario,
} from "./interface";

function Notificacoes({ selecionar, revisao }) {
  const recurso = useDados("/notificacoes", revisao);
  const [erro, setErro] = useState("");
  const avisos = recurso.dados?.filter((a) => !a.lida) || [];
  async function abrir(aviso) {
    try {
      await enviar(`/notificacoes/${aviso.id}/lida`, {}, "PUT");
      selecionar(aviso.coleta_id);
    } catch (e) {
      setErro(e.message);
    }
  }
  return (
    <section className="cc-avisos" aria-label="Notificações">
      <Estado recurso={recurso} />
      {erro && <p role="alert">{erro}</p>}
      {avisos.map((a) => (
        <div className="cc-aviso" key={a.id}>
          <p>{a.mensagem}</p>
          <button className="ws-btn ws-btn-ghost" onClick={() => abrir(a)}>
            Ver coleta
          </button>
        </div>
      ))}
    </section>
  );
}

export default function Listagem({ perfil, selecionar, revisao }) {
  const cooperador = perfil.tipo === "cooperativa";
  const [dia, setDia] = useState(hoje());
  const [diaDados, setDiaDados] = useState(null);
  const [capacidade, setCapacidade] = useState(0);
  const [hora, setHora] = useState("08:00");
  const [mudanca, setMudanca] = useState(0);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const recurso = useDados(
    `/coletas${cooperador ? `?dia=${dia}` : ""}`,
    revisao + mudanca,
  );
  async function salvarCapacidade(e) {
    e.preventDefault();
    setOcupado(true);
    setErro("");
    try {
      await enviar(
        "/agenda",
        { dia, hora, capacidade: Number(capacidade) },
        "PUT",
      );
      setMudanca((n) => n + 1);
      setDiaDados(null);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <Cabecalho
        titulo={cooperador ? "Calendário de coletas" : "Minhas coletas"}
        texto={
          cooperador
            ? "Organize horários e assuma os atendimentos da sua rota."
            : "Acompanhe a coleta, confira os pesos e avalie para receber."
        }
      />
      {!cooperador && (
        <Notificacoes selecionar={selecionar} revisao={revisao} />
      )}
      <div className={cooperador ? "cc-duas-colunas" : ""}>
        {cooperador && (
          <div>
            <Calendario
              cooperador
              dia={dia}
              escolher={(d) => {
                setDia(d.dia);
                setDiaDados(d);
                setHora(d.horarios[0].hora);
                setCapacidade(d.horarios[0].capacidade);
              }}
              revisao={revisao + mudanca}
            />
            {diaDados && (
              <details className="ws-card cc-form">
                <summary>Disponibilidade de {data(dia)}</summary>
                <form onSubmit={salvarCapacidade}>
                  <label className="ws-field">
                    Horário
                    <select
                      value={hora}
                      onChange={(e) => {
                        setHora(e.target.value);
                        setCapacidade(
                          diaDados.horarios.find(
                            (h) => h.hora === e.target.value,
                          ).capacidade,
                        );
                      }}
                    >
                      {diaDados.horarios.map((h) => (
                        <option key={h.hora}>{h.hora}</option>
                      ))}
                    </select>
                  </label>
                  <label className="ws-field">
                    Capacidade (0 fecha o horário)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      required
                      value={capacidade}
                      onChange={(e) => setCapacidade(e.target.value)}
                    />
                  </label>
                  <p className="ws-help">
                    Reservas existentes são preservadas.
                  </p>
                  <button className="ws-btn" disabled={ocupado}>
                    Salvar disponibilidade
                  </button>
                  {erro && <p role="alert">{erro}</p>}
                </form>
              </details>
            )}
          </div>
        )}
        <section>
          <Estado recurso={recurso} />
          {recurso.dados && (
            <>
              <h2>
                {cooperador
                  ? `${data(dia)} · ${recurso.dados.length} coletas`
                  : `${recurso.dados.length} coletas no histórico`}
              </h2>
              {recurso.dados.length === 0 && (
                <div className="ws-card cc-form">
                  <p>
                    Nenhuma coleta {cooperador ? "neste dia" : "agendada ainda"}
                    .
                  </p>
                </div>
              )}
              <ul className="cc-lista">
                {[...recurso.dados]
                  .sort((a, b) =>
                    cooperador
                      ? (a.hora || "").localeCompare(b.hora || "")
                      : b.id - a.id,
                  )
                  .map((c) => (
                    <li className="ws-card cc-coleta" key={c.id}>
                      <div className="cc-linha">
                        <strong>
                          #{c.id} · {c.hora || "Horário não informado"}
                        </strong>
                        <Situacao valor={c.situacao} />
                      </div>
                      <h3>{cooperador ? c.nome_morador : data(c.dia)}</h3>
                      <p>{c.endereco}</p>
                      <p className="ws-help">
                        {c.materiais_informados.join(" · ")}
                      </p>
                      {c.nome_cooperador && (
                        <p className="ws-help">
                          Responsável: {c.nome_cooperador}
                        </p>
                      )}
                      {c.motivo_cancelamento && (
                        <p className="cc-cuidado">{c.motivo_cancelamento}</p>
                      )}
                      <div className="cc-linha">
                        <span>
                          {numero(
                            c.situacao === "coletada"
                              ? c.pontos
                              : c.pontos_previstos,
                          )}{" "}
                          pontos{" "}
                          {c.situacao === "coletada"
                            ? "liberados"
                            : "previstos"}
                        </span>
                        <button
                          className="ws-btn ws-btn-sm"
                          onClick={() => selecionar(c.id)}
                        >
                          {cooperador
                            ? "Abrir coleta"
                            : c.situacao === "aguardando_avaliacao"
                              ? "Avaliar e receber"
                              : "Ver detalhes"}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </>
  );
}
