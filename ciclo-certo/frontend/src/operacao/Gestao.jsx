import React, { useEffect, useState } from "react";
import { solicitar, enviar } from "../api";
import { Situacao } from "../visual";
import {
  useDados,
  Estado,
  Cabecalho,
  Modal,
  Calendario,
  hoje,
  data,
} from "./interface";
import Detalhe from "./Detalhe";
import Perfil from "./Perfil";
import EditorMercado from "./EditorMercado";
import PainelCooperador from "./PainelCooperador";
import RotaColetas from "./RotaColetas";

// Polling serial preserva o formulário aberto e ignora respostas após desmontagem.
export default function Gestao({ perfil, tela, catalogo, sair, pedidoAviso }) {
  const [coletas, setColetas] = useState([]);
  const [erroConexao, setErroConexao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [revisao, setRevisao] = useState(0);
  const [selecionada, setSelecionada] = useState(null);
  const [fluxo, setFluxo] = useState("agendada");
  const [busca, setBusca] = useState("");
  const [dia, setDia] = useState(hoje());
  const [horarios, setHorarios] = useState(null);
  const [hora, setHora] = useState("08:00");
  const [capacidade, setCapacidade] = useState(1);
  const [excluir, setExcluir] = useState(null);
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [sucesso, setSucesso] = useState("");
  useEffect(() => {
    setSelecionada(null);
    setErro("");
    setSucesso("");
  }, [tela]);
  useEffect(() => {
    if (pedidoAviso) setSelecionada(pedidoAviso.id);
  }, [pedidoAviso]);
  useEffect(() => {
    let ativo = true,
      timer;
    async function atualizar() {
      try {
        const dados = await solicitar("/coletas");
        if (!ativo) return;
        setColetas(dados);
        setErroConexao("");
      } catch (e) {
        if (ativo) setErroConexao(e.message);
      } finally {
        if (ativo) {
          setCarregando(false);
          timer = setTimeout(atualizar, 5000);
        }
      }
    }
    atualizar();
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [revisao]);
  async function acao(fn) {
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    setSucesso("");
    try {
      await fn();
      setRevisao((n) => n + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  const historico = tela === "historico";
  const calendario = tela === "calendario";
  const lista = coletas
    .filter((c) =>
      historico
        ? ["coletada", "aguardando_avaliacao", "cancelada"].includes(c.situacao)
        : calendario
          ? c.dia === dia
          : c.situacao === fluxo,
    )
    .filter((c) =>
      `${c.id} ${c.nome_morador} ${c.endereco} ${c.nome_cooperador || ""}`
        .toLocaleLowerCase("pt-BR")
        .includes(busca.toLocaleLowerCase("pt-BR")),
    );
  return (
    <>
      {erroConexao && (
        <p className="ws-help" role="status">
          Não foi possível atualizar as coletas. Tentando reconectar…
        </p>
      )}
      <Cabecalho
        titulo={
          {
            usuarios: "Pessoas da cooperativa",
            mercado: "Catálogo de recompensas",
            avaliacoes: "Vozes da comunidade",
            historico: "Histórico de coletas",
            calendario: "Agenda operacional",
          }[tela] || "Central de operações"
        }
        texto="Acompanhe solicitações, organize sua equipe e cuide de cada atendimento."
      />
      {erro && (
        <p role="alert" className="aviso erro">
          {erro}
        </p>
      )}
      {sucesso && (
        <p role="status" className="cc-sucesso">
          {sucesso}
        </p>
      )}
      {tela === "mercado" ? (
        <EditorMercado />
      ) : tela === "perfil" ? (
        <Perfil perfil={perfil} sair={sair} />
      ) : tela === "usuarios" ? (
        <Usuarios />
      ) : tela === "avaliacoes" ? (
        <Avaliacoes revisao={revisao} ocupado={ocupado} acao={acao} />
      ) : (
        <>
          {tela === "rota" && !carregando && (
            <>
              <PainelCooperador coletas={coletas.filter((coleta) => coleta.dia === hoje())} catalogo={catalogo} abrir={setSelecionada} />
              <RotaColetas coletas={coletas} abrir={setSelecionada} />
            </>
          )}
          {tela !== "rota" && <div className="cc-indicadores">
            {[
              ["agendada", "Pendentes"],
              ["em_coleta", "Em andamento"],
              ["aguardando_avaliacao", "Aguardando avaliação"],
              ["coletada", "Concluídas"],
            ].map(([s, n]) => (
              <div key={s}>
                <small>{n}</small>
                <strong>
                  {coletas.filter((c) => c.situacao === s).length}
                </strong>
              </div>
            ))}
          </div>}
          {tela === "rota" && <h2 className="cooperador-todos">Todos os pedidos</h2>}
          {!historico && !calendario && (
            <div className="cc-abas" aria-label="Fluxo de atendimento">
              {[
                ["agendada", "Pedidos pendentes"],
                ["em_coleta", "Aceitas / em andamento"],
              ].map(([s, n]) => (
                <button
                  key={s}
                  aria-pressed={fluxo === s}
                  onClick={() => setFluxo(s)}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
          {calendario && (
            <div className="cc-agenda-profissional">
              <Calendario
                cooperador
                dia={dia}
                revisao={revisao}
                escolher={(d) => {
                  setDia(d.dia);
                  setHorarios(d.horarios);
                  setHora(d.horarios[0]?.hora || "08:00");
                  setCapacidade(d.horarios[0]?.capacidade || 0);
                }}
              />
              <section className="ws-card cc-historico">
                <h2>{data(dia)}</h2>
                <p>
                  Selecione um dia para ajustar a capacidade de atendimento.
                </p>
                {horarios && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      acao(async () => {
                        await enviar(
                          "/agenda",
                          { dia, hora, capacidade: Number(capacidade) },
                          "PUT",
                        );
                        setHorarios(null);
                        setSucesso("Disponibilidade atualizada.");
                      });
                    }}
                  >
                    <label className="ws-field">
                      Horário
                      <select
                        value={hora}
                        onChange={(e) => {
                          setHora(e.target.value);
                          setCapacidade(
                            horarios.find((h) => h.hora === e.target.value)
                              .capacidade,
                          );
                        }}
                      >
                        {horarios.map((h) => (
                          <option key={h.hora}>{h.hora}</option>
                        ))}
                      </select>
                    </label>
                    <label className="ws-field">
                      Vagas
                      <input
                        type="number"
                        min="0"
                        max="100"
                        required
                        value={capacidade}
                        onChange={(e) => setCapacidade(e.target.value)}
                      />
                    </label>
                    <button className="ws-btn" disabled={ocupado}>
                      Salvar capacidade
                    </button>
                  </form>
                )}
              </section>
            </div>
          )}
          <label className="ws-field cc-busca">
            Buscar coleta
            <input
              type="search"
              placeholder="Nome, endereço, responsável ou número"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </label>
          {carregando && <p role="status">Carregando coletas…</p>}
          {!carregando && !lista.length && (
            <p className="cc-vazio">Nenhuma coleta nesta visualização.</p>
          )}
          <div className="cc-lista-gestao">
            {lista.map((c) => (
              <article key={c.id}>
                <button
                  className="cc-pedido"
                  onClick={() => setSelecionada(c.id)}
                >
                  <span className="cc-numero">#{c.id}</span>
                  <span>
                    <strong>{c.nome_morador}</strong>
                    <small>{c.endereco}</small>
                    <small>
                      {data(c.dia)} · {c.hora || "Sem horário"}
                    </small>
                    {c.peso_estimado_kg != null && <small>Peso estimado: {Number(c.peso_estimado_kg).toLocaleString("pt-BR")} kg</small>}
                  </span>
                  <span>
                    <Situacao valor={c.situacao} />
                    <small>
                      {c.nome_cooperador
                        ? `Aceita por ${c.nome_cooperador}`
                        : "Aguardando responsável"}
                    </small>
                    {c.equipamentos?.length > 0 && <small>Kit: {c.equipamentos.length} {c.equipamentos.length === 1 ? "item planejado" : "itens planejados"}</small>}
                  </span>
                  <span aria-hidden="true">→</span>
                </button>
                {historico && perfil.administrador && (
                  <button
                    className="cc-excluir"
                    disabled={c.situacao === "aguardando_avaliacao"}
                    onClick={() => {
                      setExcluir(c);
                      setConfirmacao("");
                      setErro("");
                    }}
                  >
                    Apagar permanentemente
                  </button>
                )}
              </article>
            ))}
          </div>
          {historico && (
            <p className="ws-help">
              A exclusão remove dados da coleta, imagens, pesagens e depoimento.
              Pontos creditados são preservados. Avaliações pendentes precisam
              ser concluídas.
            </p>
          )}
        </>
      )}
      {selecionada && (
        <Modal
          titulo={`Pedido #${selecionada}`}
          fechar={() => setSelecionada(null)}
        >
          <Detalhe
            emDialogo
            id={selecionada}
            perfil={perfil}
            catalogo={catalogo}
            voltar={() => setSelecionada(null)}
            atualizar={() => setRevisao((n) => n + 1)}
          />
        </Modal>
      )}
      {excluir && (
        <Modal
          titulo="Apagar coleta definitivamente"
          fechar={() => !ocupado && setExcluir(null)}
        >
          <p>
            Esta ação não pode ser desfeita. Todos os dados operacionais da
            coleta #{excluir.id} serão removidos.
          </p>
          <label className="ws-field">
            Digite APAGAR {excluir.id}
            <input
              autoComplete="off"
              value={confirmacao}
              onChange={(e) => setConfirmacao(e.target.value)}
            />
          </label>
          {erro && <p role="alert">{erro}</p>}
          <button
            className="ws-btn"
            disabled={ocupado || confirmacao !== `APAGAR ${excluir.id}`}
            onClick={() =>
              acao(async () => {
                await enviar(
                  `/gestao/historico/${excluir.id}`,
                  { confirmacao },
                  "DELETE",
                );
                setExcluir(null);
                setSucesso("Coleta apagada permanentemente.");
              })
            }
          >
            Apagar permanentemente
          </button>
        </Modal>
      )}
    </>
  );
}

function Usuarios() {
  const recurso = useDados("/gestao/usuarios");
  const [busca, setBusca] = useState("");
  const lista =
    recurso.dados?.filter((u) =>
      `${u.nome} ${u.email}`
        .toLocaleLowerCase("pt-BR")
        .includes(busca.toLocaleLowerCase("pt-BR")),
    ) || [];
  return (
    <>
      <label className="ws-field">
        Buscar pessoa
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Nome ou e-mail"
        />
      </label>
      <Estado recurso={recurso} />
      <div className="cc-usuarios">
        {lista.map((u) => (
          <article className="ws-card" key={u.id}>
            <span className="cc-avatar">{u.nome.slice(0, 1)}</span>
            <h2>{u.nome}</h2>
            <p>{u.email || "Sem e-mail cadastrado"}</p>
            <small>
              {u.administrador
                ? "Administrador"
                : u.tipo === "morador"
                  ? "Morador"
                  : "Cooperador"}{" "}
              · #{u.id}
            </small>
          </article>
        ))}
      </div>
      {recurso.dados && !lista.length && <p>Nenhuma pessoa encontrada.</p>}
    </>
  );
}

function Avaliacoes({ revisao, ocupado, acao }) {
  const recurso = useDados("/gestao/avaliacoes", revisao);
  return (
    <>
      <p>
        Publique comentários autorizados pelo morador. A página pública
        identifica o autor apenas como morador da comunidade.
      </p>
      <Estado recurso={recurso} />
      {recurso.dados?.length === 0 && (
        <p className="cc-vazio">Ainda não há comentários para moderar.</p>
      )}
      <div className="cc-avaliacoes-grid">
        {recurso.dados?.map((a) => (
          <article className="cc-avaliacao-card" key={a.id}>
            <small>
              <span
                className="cc-estrelas"
                aria-label={`${a.nota} de 5 estrelas`}
              >
                {"★".repeat(a.nota)}
                {"☆".repeat(5 - a.nota)}
              </span>
              <span>Coleta #{a.id}</span>
            </small>
            <blockquote>{a.comentario}</blockquote>
            <p>
              {a.publicada
                ? "Publicado na página inicial"
                : a.autorizada
                  ? "Autorizado para publicação"
                  : "Sem autorização do morador"}
            </p>
            <button
              className="ws-btn"
              disabled={ocupado || (!a.autorizada && !a.publicada)}
              onClick={() =>
                acao(() =>
                  enviar(
                    `/gestao/avaliacoes/${a.id}`,
                    { publicar: !a.publicada },
                    "PUT",
                  ),
                )
              }
            >
              {a.publicada ? "Retirar da página" : "Publicar depoimento"}
            </button>
          </article>
        ))}
      </div>
    </>
  );
}
