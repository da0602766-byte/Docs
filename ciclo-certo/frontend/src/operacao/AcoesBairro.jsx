import React, { useEffect, useState } from "react";
import { enviar } from "../api";
import { useDados, Estado, Modal } from "./interface";

const nomes = {
  evento: "Encontro no bairro",
  pergunta: "Pergunta da semana",
  destaque: "Destaque da comunidade",
};
const data = (v) =>
  new Date(v).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

// A moderação organiza ações reais; inscrições são idempotentes e não concedem pontos.
export default function AcoesBairro({
  compacto = false,
  abrir,
  participarConversa,
}) {
  const [revisao, setRevisao] = useState(0),
    [novo, setNovo] = useState(false),
    [erro, setErro] = useState(""),
    [ocupado, setOcupado] = useState(false),
    [cancelar, setCancelar] = useState(null);
  const recurso = useDados("/comunidade/acoes", revisao),
    regras = useDados("/comunidade/resumo");
  async function inscrever(a) {
    setOcupado(true);
    setErro("");
    try {
      await enviar(
        `/comunidade/acoes/${a.id}/inscricao`,
        { valor: !a.inscrito },
        "PUT",
      );
      setRevisao((n) => n + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  const itens = (recurso.dados?.itens || []).filter(
    (a) => !compacto || a.tipo !== "evento",
  );
  if (compacto && !itens.length) return null;
  return (
    <section
      className={compacto ? "com-agenda-compacta" : "comunidade"}
      aria-label="Ações do bairro"
    >
      {!compacto && (
        <header className="com-cabecalho">
          <div>
            <p className="com-editorial">ENCONTROS QUE TRANSFORMAM</p>
            <h1>Ações do bairro</h1>
            <p>Oficinas, conversas e iniciativas para participar de perto.</p>
          </div>
        </header>
      )}
      {!compacto && regras.dados?.moderador && (
        <button className="ws-btn" onClick={() => setNovo(true)}>
          Organizar uma ação +
        </button>
      )}
      <Estado recurso={recurso} />
      {erro && (
        <p role="alert" className="aviso erro">
          {erro}
        </p>
      )}
      {!compacto && recurso.dados && !itens.length && (
        <p className="com-vazio">
          Ainda não há ações abertas. Os encontros cadastrados pela equipe
          aparecerão aqui.
        </p>
      )}
      <div className="com-acoes-bairro">
        {itens.slice(0, compacto ? 2 : 50).map((a) => (
          <article className="ws-card com-acao-bairro" key={a.id}>
            <span className="com-editorial">{nomes[a.tipo]}</span>
            <h2>{a.titulo}</h2>
            <p className="com-texto">{a.descricao}</p>
            <p className="ws-help">
              {data(a.inicio)} até {data(a.fim)} · Brasília
            </p>
            {a.local && <p>Local: {a.local}</p>}
            <div className="com-acoes">
              {a.tipo === "evento" && (
                <>
                  <span>
                    {a.inscritos}{" "}
                    {a.inscritos === 1 ? "inscrição" : "inscrições"}
                  </span>
                  <button
                    className="ws-btn"
                    disabled={ocupado}
                    onClick={() => inscrever(a)}
                  >
                    {a.inscrito
                      ? "Cancelar minha inscrição"
                      : "Quero participar"}
                  </button>
                </>
              )}
              {a.tipo === "destaque" && (
                <button onClick={() => abrir(a.publicacao_id)}>
                  Ver publicação →
                </button>
              )}
              {a.tipo === "pergunta" && (
                <button onClick={() => participarConversa(a.titulo)}>
                  Compartilhar minha resposta →
                </button>
              )}
              {!compacto && regras.dados?.moderador && (
                <button onClick={() => setCancelar(a)}>Encerrar ação</button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!compacto && (
        <p className="ws-help">
          Inscrições, perguntas e destaques não geram pontos extras. Confirme
          detalhes do encontro com a equipe organizadora.
        </p>
      )}
      {novo && (
        <NovaAcao
          fechar={() => setNovo(false)}
          concluir={() => {
            setNovo(false);
            setRevisao((n) => n + 1);
          }}
        />
      )}
      {cancelar && (
        <Modal
          titulo="Encerrar ação"
          fechar={() => {
            if (!ocupado) setCancelar(null);
          }}
        >
          <p>
            “{cancelar.titulo}” deixará de aceitar inscrições e sairá da agenda.
            Os registros existentes serão preservados.
          </p>
          {erro && <p role="alert">{erro}</p>}
          <button
            className="ws-btn"
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              try {
                await enviar(`/comunidade/acoes/${cancelar.id}`, {}, "DELETE");
                setCancelar(null);
                setRevisao((n) => n + 1);
              } catch (e) {
                setErro(e.message);
              } finally {
                setOcupado(false);
              }
            }}
          >
            Confirmar encerramento
          </button>
        </Modal>
      )}
    </section>
  );
}
function NovaAcao({ fechar, concluir }) {
  const [tipo, setTipo] = useState("evento"),
    [erro, setErro] = useState(""),
    [ocupado, setOcupado] = useState(false);
  const publicacoes = useDados("/comunidade/publicacoes?limite=50");
  return (
    <Modal
      titulo="Organizar uma ação"
      fechar={() => {
        if (!ocupado) fechar();
      }}
    >
      <form
        className="cc-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          setOcupado(true);
          setErro("");
          try {
            await enviar("/comunidade/acoes", {
              tipo,
              titulo: f.get("titulo"),
              descricao: f.get("descricao"),
              local: f.get("local") || null,
              inicio: new Date(f.get("inicio") + "-03:00").toISOString(),
              fim: new Date(f.get("fim") + "-03:00").toISOString(),
              publicacao_id:
                tipo === "destaque" ? Number(f.get("publicacao")) : null,
            });
            concluir();
          } catch (x) {
            setErro(x.message);
          } finally {
            setOcupado(false);
          }
        }}
      >
        <label className="ws-field">
          Tipo
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(nomes).map(([v, n]) => (
              <option key={v} value={v}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="ws-field">
          Título
          <input name="titulo" required minLength={5} maxLength={100} />
        </label>
        <label className="ws-field">
          Descrição
          <textarea name="descricao" required minLength={10} maxLength={1200} />
        </label>
        {tipo === "evento" && (
          <label className="ws-field">
            Local do encontro
            <input name="local" required minLength={3} maxLength={160} />
          </label>
        )}
        <label className="ws-field">
          Início (horário de Brasília)
          <input name="inicio" type="datetime-local" required />
        </label>
        <label className="ws-field">
          Fim (horário de Brasília)
          <input name="fim" type="datetime-local" required />
        </label>
        {tipo === "destaque" && (
          <>
            <Estado recurso={publicacoes} />
            <label className="ws-field">
              Publicação pública aprovada
              <select name="publicacao" required defaultValue="">
                <option value="">Escolha uma publicação</option>
                {publicacoes.dados?.itens
                  .filter((p) => p.publica)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.autor.nome} · {p.conteudo.slice(0, 60)}
                    </option>
                  ))}
              </select>
            </label>
            <p className="ws-help">
              São exibidas as 50 publicações mais recentes. O destaque é
              editorial e não muda a pontuação.
            </p>
          </>
        )}
        {erro && (
          <p role="alert" className="aviso erro">
            {erro}
          </p>
        )}
        <button className="ws-btn" disabled={ocupado}>
          {ocupado ? "Salvando…" : "Publicar ação"}
        </button>
      </form>
    </Modal>
  );
}

// O código é gerado no dispositivo, sem enviar links a serviços de terceiros.
export function Convites() {
  const [destino, setDestino] = useState("agendar"),
    [id, setId] = useState(""),
    [imagem, setImagem] = useState(""),
    [erro, setErro] = useState("");
  const link =
    destino === "agendar"
      ? "https://ciclo-certo.vercel.app/login?destino=agendar"
      : destino === "comunidade"
        ? "https://ciclo-certo.vercel.app/comunidade"
        : /^\d+$/.test(id)
          ? `https://ciclo-certo.vercel.app/p/${id}`
          : "";
  useEffect(() => {
    let ativo = true;
    setImagem("");
    setErro("");
    if (link)
      import("qrcode")
        .then((q) =>
          q.toDataURL(link, {
            width: 800,
            margin: 4,
            errorCorrectionLevel: "M",
            color: { dark: "#1f3d2b", light: "#fffdf8" },
          }),
        )
        .then((v) => {
          if (ativo) setImagem(v);
        })
        .catch(() => {
          if (ativo)
            setErro("Não foi possível gerar o código. Tente novamente.");
        });
    return () => {
      ativo = false;
    };
  }, [link]);
  return (
    <section className="comunidade">
      <h1>Convide o bairro</h1>
      <p>
        Baixe um QR code para cartazes, pontos de coleta ou parceiros reais.
      </p>
      <div className="ws-card cc-form com-qr">
        <label className="ws-field">
          Para onde levar as pessoas?
          <select value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="agendar">Agendar uma coleta</option>
            <option value="comunidade">Conhecer a comunidade</option>
            <option value="publicacao">Uma publicação pública</option>
          </select>
        </label>
        {destino === "publicacao" && (
          <label className="ws-field">
            Número da publicação pública
            <input
              inputMode="numeric"
              value={id}
              onChange={(e) => setId(e.target.value)}
              pattern="[0-9]+"
            />
            <small>
              Use o número no final do link compartilhado. A publicação precisa
              estar aprovada e pública.
            </small>
          </label>
        )}
        {imagem && (
          <>
            <img
              src={imagem}
              width="260"
              height="260"
              alt="QR code para o destino escolhido"
            />
            <p className="com-texto">{link}</p>
            <a
              className="ws-btn"
              download="ciclo-certo-convite.png"
              href={imagem}
            >
              Baixar QR code
            </a>
            <a href={link} target="_blank" rel="noopener noreferrer">
              Conferir destino ↗
            </a>
          </>
        )}
        {erro && <p role="alert">{erro}</p>}
      </div>
    </section>
  );
}

export function Metricas() {
  const r = useDados("/comunidade/metricas"),
    d = r.dados;
  return (
    <section className="comunidade">
      <h1>Participação em números</h1>
      <p>
        Indicadores observados. Sem estimar pessoas, pesos ou impacto ambiental.
      </p>
      <Estado recurso={r} />
      {d && (
        <>
          <div className="com-metricas">
            {[
              ["Sessões visitantes · 30 dias", d.sessoes_visitantes_30d],
              ["Cadastros vindos da comunidade · 30 dias", d.conversoes_30d],
              ["Novas contas · 30 dias", d.cadastros_30d],
              ["Contas com primeira coleta agendada", d.contas_com_coleta],
              ["Contas que acessaram · 30 dias", d.participantes_30d],
              ["Retorno entre o 1º e o 7º dia", d.retornaram_7d],
              [
                "Tempo médio de análise",
                d.horas_media_analise === null
                  ? "Sem análises"
                  : Number(d.horas_media_analise).toLocaleString("pt-BR", {
                      maximumFractionDigits: 1,
                    }) + " h",
              ],
            ].map(([label, v]) => (
              <article className="ws-card cc-form" key={label}>
                <span>{label}</span>
                <strong>{v}</strong>
              </article>
            ))}
          </div>
          <p className="ws-help">
            Visitas e retornos são medidos desde a ativação deste painel. Uma
            sessão não representa necessariamente uma pessoa. A origem do
            cadastro é atribuída apenas quando ele acontece na mesma aba da
            visita pública. Contas antigas sem data de criação ficam fora de
            “Novas contas”. Primeira coleta inclui agendamentos históricos,
            mesmo cancelados; não equivale a coleta concluída.
          </p>
        </>
      )}
    </section>
  );
}
