import React, { useEffect, useState } from "react";
import { solicitar } from "../api";
import VideoComunidade from "./VideoComunidade";
import { Icone } from "../visual";
import { Compartilhar, TextoPublicacao } from "./Participacao";

// Visitantes recebem apenas o contrato público autorizado, sem comentários privados nem dados de conta.
export default function ComunidadePublica() {
  const id = window.location.pathname.match(/\/publicacao\/(\d+)/)?.[1];
  const [itens, setItens] = useState([]),
    [proximo, setProximo] = useState(null),
    [erro, setErro] = useState(""),
    [carregando, setCarregando] = useState(true);
  async function carregar(cursor) {
    setCarregando(true);
    setErro("");
    try {
      const d = await solicitar(
        id
          ? `/comunidade/publico/${id}`
          : `/comunidade/publico${cursor ? `?antes=${cursor}` : ""}`,
        {},
        false,
      );
      setItens((a) =>
        id ? [d] : cursor ? [...a, ...d.itens].slice(-60) : d.itens,
      );
      setProximo(d.proximo);
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }
  useEffect(() => {
    carregar();
    try {
      let s = sessionStorage.getItem("cc-visita");
      if (!s) {
        s = crypto.randomUUID();
        sessionStorage.setItem("cc-visita", s);
      }
      solicitar(
        "/comunidade/visita",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessao: s }),
        },
        false,
      ).catch(() => {});
    } catch {}
  }, [id]);
  return (
    <div className="ws">
      <header className="ws-header">
        <div className="ws-container ws-header-inner">
          <a className="ws-logo" href="/">
            Ciclo Certo
          </a>
          <a href="/login" className="ws-btn">
            Entrar e participar
          </a>
        </div>
      </header>
      <main className="ws-container ws-main comunidade">
        <header className="com-cabecalho">
          <div>
            <p className="com-editorial">IDEIAS QUE APROXIMAM</p>
            <h1>Comunidade aberta.</h1>
            <p>
              Conheça as ideias do bairro. Entre para publicar, salvar e
              conversar.
            </p>
          </div>
          <Icone name="leaf" size={40} />
        </header>
        <nav className="com-acoes">
          <a href="/comunidade">Todas as publicações</a>
          <a href="/login?destino=agendar">Agendar uma coleta</a>
          <a href="/cooperador">Acesso do cooperador</a>
        </nav>
        {!id && <AgendaPublica />}
        {itens.map((p) => (
          <article className="ws-card com-publicacao" key={p.id}>
            <div className="com-autor">
              <strong>{p.nome}</strong>
              <span className="com-perfil">
                {p.tipo === "morador" ? "Morador" : "Cooperador"}
              </span>
            </div>
            <p className="com-categoria">{p.categoria}</p>
            <TextoPublicacao texto={p.conteudo} />
            {p.youtube_id && <VideoComunidade id={p.youtube_id} />}
            <Compartilhar item={{ ...p, publica: true }} />
            <a className="com-inspirar" href={`/login?publicacao=${p.id}`}>
              Entrar para conversar →
            </a>
          </article>
        ))}
        {!itens.length && !carregando && !erro && (
          <p className="com-vazio">
            As primeiras publicações com autorização pública aparecerão aqui.{" "}
            <a href="/login">Participe da comunidade.</a>
          </p>
        )}
        {erro && (
          <p role="alert">
            {erro}{" "}
            <button onClick={() => carregar(proximo)}>Tentar novamente</button>
          </p>
        )}
        {carregando && <p role="status">Carregando…</p>}
        {proximo && !carregando && (
          <button className="ws-btn" onClick={() => carregar(proximo)}>
            Ver mais publicações
          </button>
        )}
        <p className="com-video-ajuda">
          Contamos sessões de visita sem guardar endereço IP. Uma pessoa pode
          usar mais de uma sessão.
        </p>
      </main>
    </div>
  );
}

function AgendaPublica() {
  const [dados, setDados] = useState(null),
    [erro, setErro] = useState(""),
    [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    let ativo = true;
    setErro("");
    solicitar("/comunidade/acoes/publicas", {}, false)
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar as ações do bairro.");
      });
    return () => {
      ativo = false;
    };
  }, [tentativa]);
  if (erro)
    return (
      <p role="alert">
        {erro}{" "}
        <button onClick={() => setTentativa((n) => n + 1)}>
          Tentar novamente
        </button>
      </p>
    );
  return (
    <div className="com-acoes-bairro">
      {dados?.itens.slice(0, 6).map((a) => (
        <article key={a.id} className="ws-card com-acao-bairro">
          <span className="com-editorial">
            {a.tipo === "evento"
              ? "Ação do bairro"
              : a.tipo === "pergunta"
                ? "Pergunta da semana"
                : "Destaque da comunidade"}
          </span>
          <h2>{a.titulo}</h2>
          <TextoPublicacao texto={a.descricao} />
          {a.local && <p>{a.local}</p>}
          <p className="ws-help">
            {new Date(a.inicio).toLocaleString("pt-BR", {
              timeZone: "America/Sao_Paulo",
            })}{" "}
            · Brasília
          </p>
          <a
            className="com-inspirar"
            href={
              a.tipo === "destaque"
                ? `/comunidade/publicacao/${a.publicacao_id}`
                : "/login?destino=acoes"
            }
          >
            {a.tipo === "destaque"
              ? "Ler publicação →"
              : "Entrar e participar →"}
          </a>
        </article>
      ))}
    </div>
  );
}
