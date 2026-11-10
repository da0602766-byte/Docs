import React, { useState } from "react";
import { enviar } from "../api";
import { useDados, Estado, Modal } from "./interface";

// Detalhes secundários ficam sob demanda; nenhum texto do usuário é interpretado como HTML.
export function TextoPublicacao({ texto }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <p className="com-texto">
        {aberto || texto.length <= 360 ? texto : texto.slice(0, 360) + "…"}
      </p>
      {texto.length > 360 && (
        <button
          className="com-inspirar"
          aria-expanded={aberto}
          onClick={() => setAberto(!aberto)}
        >
          {aberto ? "Ler menos" : "Ler mais"}
        </button>
      )}
    </>
  );
}

export function HistoricoPublicacao({ id }) {
  const [aberto, setAberto] = useState(false);
  const recurso = useDados(
    aberto ? `/comunidade/publicacoes/${id}/historico` : null,
  );
  return (
    <details onToggle={(e) => setAberto(e.currentTarget.open)}>
      <summary>Histórico de análises</summary>
      <Estado recurso={recurso} />
      {recurso.dados?.itens.map((h) => (
        <article key={h.revisao} className="com-motivo">
          <strong>
            Versão {h.revisao} · {new Date(h.criado_em).toLocaleString("pt-BR")}
          </strong>
          <p>{h.motivo}</p>
          <TextoPublicacao texto={h.conteudo} />
        </article>
      ))}
      {recurso.dados && !recurso.dados.itens.length && (
        <p>Esta é a primeira versão da publicação.</p>
      )}
    </details>
  );
}
export function Compartilhar({ item }) {
  const [aviso, setAviso] = useState("");
  if (!item.publica) return null;
  const url = `https://ciclo-certo.vercel.app/p/${item.id}`;
  return (
    <div className="com-acoes">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(item.categoria + " · Ciclo Certo\n" + url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Compartilhar no WhatsApp ↗
      </a>
      <button
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setAviso("Link copiado.");
          } catch {
            setAviso(url);
          }
        }}
      >
        Copiar link
      </button>
      {aviso && <small role="status">{aviso}</small>}
    </div>
  );
}
export function Favorito({ item }) {
  const [salvo, setSalvo] = useState(item.salva),
    [erro, setErro] = useState(""),
    [ocupado, setOcupado] = useState(false);
  return (
    <>
      <button
        aria-pressed={!!salvo}
        disabled={ocupado}
        onClick={async () => {
          setOcupado(true);
          try {
            await enviar(
              `/comunidade/publicacoes/${item.id}/favorito`,
              { valor: !salvo },
              "PUT",
            );
            setSalvo(!salvo);
            setErro("");
          } catch (e) {
            setErro(e.message);
          } finally {
            setOcupado(false);
          }
        }}
      >
        {salvo ? "★ Salva" : "☆ Salvar"}
      </button>
      {erro && <small role="alert">{erro}</small>}
    </>
  );
}
export function Corrigir({ item, concluir }) {
  const [aberto, setAberto] = useState(false),
    [texto, setTexto] = useState(item.conteudo),
    [categoria, setCategoria] = useState(item.categoria),
    [video, setVideo] = useState(
      item.youtube_id ? `https://youtu.be/${item.youtube_id}` : "",
    ),
    [publica, setPublica] = useState(item.publica),
    [erro, setErro] = useState(""),
    [ocupado, setOcupado] = useState(false);
  const historico = useDados(
    aberto ? `/comunidade/publicacoes/${item.id}/historico` : null,
  );
  return (
    <>
      <button onClick={() => setAberto(true)}>Corrigir e reenviar</button>
      {aberto && (
        <Modal
          titulo="Ajustar publicação"
          fechar={() => {
            if (!ocupado) setAberto(false);
          }}
        >
          <p>Motivo da análise: {item.motivo}</p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setOcupado(true);
              try {
                await enviar(
                  `/comunidade/publicacoes/${item.id}/reenviar`,
                  {
                    conteudo: texto,
                    categoria,
                    youtube_url: video || null,
                    publica,
                  },
                  "PUT",
                );
                setAberto(false);
                concluir();
              } catch (e) {
                setErro(e.message);
              } finally {
                setOcupado(false);
              }
            }}
          >
            <label className="ws-field">
              Texto corrigido
              <textarea
                required
                minLength={10}
                maxLength={1200}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
              />
            </label>
            <label className="ws-field">
              Categoria
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                {[
                  "Plantio",
                  "Reciclagem",
                  "Curiosidades",
                  "Compostagem",
                  "Reutilização",
                  "Sugestões",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="ws-field">
              Link do YouTube
              <input
                value={video}
                onChange={(e) => setVideo(e.target.value)}
                maxLength={500}
              />
            </label>
            <label>
              <input
                type="checkbox"
                checked={publica}
                onChange={(e) => setPublica(e.target.checked)}
              />{" "}
              Autorizar conteúdo e meu nome na comunidade pública.
            </label>
            {erro && <p role="alert">{erro}</p>}
            <button className="ws-btn" disabled={ocupado}>
              {ocupado ? "Enviando…" : "Reenviar para análise"}
            </button>
          </form>
          <details>
            <summary>Histórico de análises</summary>
            <Estado recurso={historico} />
            {historico.dados?.itens.map((h) => (
              <p key={h.revisao}>
                Versão {h.revisao}: {h.motivo}
              </p>
            ))}
          </details>
        </Modal>
      )}
    </>
  );
}

export function CentralAvisos({ abrir }) {
  const [cursor, setCursor] = useState(null);
  const dados = useDados(
    `/comunidade/avisos${cursor ? `?antes=${cursor}` : ""}`,
  );
  return (
    <section>
      <h1>Central de notificações</h1>
      <p>Suas aprovações, ajustes e respostas ficam guardados aqui.</p>
      <Estado recurso={dados} />
      {dados.dados?.itens.map((a) => (
        <article className="ws-card com-publicacao" key={a.id}>
          <strong>
            {a.estado === "aprovada"
              ? "✓ Publicação aprovada"
              : a.estado === "resposta"
                ? "↩ Nova resposta"
                : "! Precisa de ajustes"}
          </strong>
          <p className="com-texto">{a.mensagem}</p>
          <time>{new Date(a.criado_em).toLocaleString("pt-BR")}</time>
          <button
            className="com-inspirar"
            onClick={() => {
              enviar(`/comunidade/notificacoes/${a.id}/lida`, {}, "PUT").catch(
                () => {},
              );
              abrir(a.publicacao_id);
            }}
          >
            Abrir publicação →
          </button>
        </article>
      ))}
      {dados.dados && !dados.dados.itens.length && (
        <p className="com-vazio">Nenhuma notificação por aqui.</p>
      )}
      <div className="com-acoes">
        {cursor && (
          <button onClick={() => setCursor(null)}>Mais recentes</button>
        )}
        {dados.dados?.proximo && (
          <button onClick={() => setCursor(dados.dados.proximo)}>
            Mais antigas
          </button>
        )}
      </div>
    </section>
  );
}
// Rótulos de apresentação preservam as categorias e os pesos recebidos da API.
const nomesMateriais = {
  plastico: "Plástico", plástico: "Plástico", aluminio: "Alumínio",
  papel_misto: "Papel misto", vidro_colorido: "Vidro colorido", papel: "Papel",
  ferro: "Ferro", papelao: "Papelão", eletronicos: "Eletrônicos",
  plastico_duro: "Plástico duro", vidro: "Vidro", longa_vida: "Longa vida",
  plastico_filme: "Plástico filme", metal: "Metal",
};
export function Impacto() {
  const recurso = useDados("/comunidade/impacto");
  const d = recurso.dados;
  return (
    <section>
      <h1>Meu impacto</h1>
      <p>
        Pesagens reais de coletas concluídas. Os pontos da Comunidade continuam
        separados.
      </p>
      <Estado recurso={recurso} />
      {d && (
        <>
          <div className="com-painel">
            <strong>{d.coletas} coletas concluídas</strong>
            <strong>
              {d.materiais
                .reduce((t, m) => t + Number(m.quilos), 0)
                .toLocaleString("pt-BR", { maximumFractionDigits: 3 })}{" "}
              kg coletados
            </strong>
          </div>
          <div className="cc-duas-colunas">
            <section className="ws-card cc-form">
              <h2>Por material</h2>
              {d.materiais.length > 0 && (
                <dl className="com-materiais">
                  {d.materiais.map((m) => (
                    <div key={m.material}>
                      <dt>{nomesMateriais[m.material] || m.material.replaceAll("_", " ")}</dt>
                      <dd><strong>{Number(m.quilos).toLocaleString("pt-BR")}</strong><span>kg</span></dd>
                    </div>
                  ))}
                </dl>
              )}
              {!d.materiais.length && (
                <p>Seu impacto aparecerá após uma coleta ser concluída.</p>
              )}
            </section>
            <section className="ws-card cc-form">
              <h2>Evolução mensal</h2>
              {d.meses.map((m) => (
                <div key={m.mes}>
                  <span>
                    {m.mes} · {Number(m.quilos).toLocaleString("pt-BR")} kg
                  </span>
                  <meter
                    aria-label={`Quilos em ${m.mes}`}
                    min="0"
                    max={Math.max(...d.meses.map((x) => Number(x.quilos)))}
                    value={Number(m.quilos)}
                  />
                </div>
              ))}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
