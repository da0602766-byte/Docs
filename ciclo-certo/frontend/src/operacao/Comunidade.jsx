import React, { useEffect, useRef, useState } from "react";
import { enviar } from "../api";
import { Icone } from "../visual";
import { useDados, Estado, Modal } from "./interface";
import { useFeedComunidade } from "./comunidadeFeed";
import { useAvisosComunidade } from "./AvisosComunidade";
import VideoComunidade from "./VideoComunidade";
import { identificarVideo } from "./youtube";
import { Inspiracao, temInspiracao, FimDoFeed } from "./ComunidadeExtras";
import {
  TextoPublicacao,
  Compartilhar,
  Favorito,
  Corrigir,
  HistoricoPublicacao,
} from "./Participacao";
import AcoesBairro from "./AcoesBairro";

const base = "/comunidade";
const nomePerfil = (tipo) => (tipo === "morador" ? "Morador" : "Cooperador");
const dataHora = (valor) =>
  new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
const tempoRelativo = (valor) => {
  const minutos = Math.max(
    0,
    Math.floor((Date.now() - new Date(valor).getTime()) / 60000),
  );
  return minutos < 1
    ? "agora"
    : minutos < 60
      ? `há ${minutos} min`
      : minutos < 1440
        ? `há ${Math.floor(minutos / 60)} h`
        : minutos < 10080
          ? `há ${Math.floor(minutos / 1440)} dias`
          : dataHora(valor);
};

// Paginação por cursor mantém a navegação estável quando chegam novas publicações.
function Paginacao({ paginas, proximo, mudar }) {
  return (
    <nav className="com-paginacao" aria-label="Paginação">
      <button
        className="ws-btn ws-btn-ghost"
        disabled={!paginas.length}
        onClick={() => mudar(paginas.slice(0, -1))}
      >
        Anterior
      </button>
      <span>Página {paginas.length + 1}</span>
      <button
        className="ws-btn ws-btn-ghost"
        disabled={!proximo}
        onClick={() => mudar([...paginas, proximo])}
      >
        Próxima
      </button>
    </nav>
  );
}

// Apenas nome e perfil públicos são apresentados; e-mail e identificadores ficam fora do feed.
function Autor({ autor, criado }) {
  return (
    <div className="com-autor">
      <span
        className={`ws-avatar ${autor.perfil === "cooperativa" ? "ws-avatar-dark" : ""}`}
        aria-hidden="true"
      >
        {autor.nome
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0])
          .join("")}
      </span>
      <div>
        <strong>{autor.nome}</strong>
        <div className="com-meta">
          <span className="com-perfil">{nomePerfil(autor.perfil)}</span>
          <time
            dateTime={criado}
            title={dataHora(criado)}
            aria-label={dataHora(criado)}
          >
            {tempoRelativo(criado)}
          </time>
        </div>
      </div>
    </div>
  );
}

// Comentários só são consultados quando a conversa está aberta, com paginação própria.
function Comentarios({ publicacao, revisao, acao, atualizar }) {
  const [resposta, setResposta] = useState(null);
  const [revisaoLocal, setRevisaoLocal] = useState(0);
  const [paginas, setPaginas] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const recurso = useDados(
    `${base}/publicacoes/${publicacao.id}/comentarios?limite=10${paginas.length ? `&antes=${paginas.at(-1)}` : ""}`,
    `${revisao}:${revisaoLocal}`,
  );
  async function comentar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      await enviar(`${base}/publicacoes/${publicacao.id}/comentarios`, {
        conteudo: texto,
        resposta_id: resposta?.id || null,
      });
      setTexto("");
      setResposta(null);
      setPaginas([]);
      setRevisaoLocal((n) => n + 1);
      atualizar(publicacao.id);
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }
  return (
    <section className="com-comentarios" aria-label="Conversa">
      <form onSubmit={comentar}>
        {resposta && (
          <p className="com-resposta">
            Respondendo a {resposta.autor.nome}{" "}
            <button type="button" onClick={() => setResposta(null)}>
              Cancelar resposta
            </button>
          </p>
        )}
        <label className="ws-field">
          <span className="ws-label">Seu comentário</span>
          <textarea
            required
            minLength={2}
            maxLength={500}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Continue a conversa com respeito."
          />
        </label>
        <div className="com-form-rodape">
          <small>{texto.length}/500 · Comentários não geram pontos.</small>
          <button className="ws-btn" disabled={enviando}>
            {enviando ? "Enviando…" : "Comentar"}
          </button>
        </div>
        {erro && (
          <p className="aviso erro" role="alert">
            {erro}
          </p>
        )}
      </form>
      <Estado recurso={recurso} />
      {recurso.dados && (
        <>
          {!recurso.dados.itens.length && (
            <p className="com-vazio-pequeno">A conversa começa com você.</p>
          )}
          {recurso.dados.itens.map((c) => (
            <article key={c.id} className="com-comentario">
              <Autor autor={c.autor} criado={c.criado_em} />
              <p className="com-texto">{c.conteudo}</p>
              {c.resposta_id && (
                <small className="com-meta">
                  ↩ Resposta a um comentário desta conversa
                </small>
              )}
              <div className="com-acoes">
                <button
                  onClick={() => {
                    setResposta(c);
                    document
                      .querySelector(".com-comentarios textarea")
                      ?.focus();
                  }}
                >
                  Responder
                </button>
                <button
                  onClick={() =>
                    acao({
                      tipo: "denunciar",
                      publicacao: publicacao.id,
                      comentario: c.id,
                    })
                  }
                >
                  Denunciar comentário
                </button>
                {c.pode_excluir && (
                  <button
                    onClick={() =>
                      acao({ tipo: "excluirComentario", id: c.id })
                    }
                  >
                    Excluir comentário
                  </button>
                )}
              </div>
            </article>
          ))}
          {(paginas.length > 0 || recurso.dados.proximo) && (
            <Paginacao
              paginas={paginas}
              proximo={recurso.dados.proximo}
              mudar={setPaginas}
            />
          )}
        </>
      )}
    </section>
  );
}

function Publicacao({ item, modo, revisao, acao, atualizar }) {
  const [conversa, setConversa] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const menu = useRef(null);
  // Só o menu aberto escuta clique externo e Escape.
  useEffect(() => {
    if (!menuAberto) return;
    const fechar = (e) => {
      if (e.type === "keydown" && e.key !== "Escape") return;
      if (e.type === "pointerdown" && menu.current?.contains(e.target)) return;
      if (menu.current) {
        menu.current.open = false;
        if (e.type === "keydown") menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", fechar);
    document.addEventListener("keydown", fechar);
    return () => {
      document.removeEventListener("pointerdown", fechar);
      document.removeEventListener("keydown", fechar);
    };
  }, [menuAberto]);
  const executar = (acaoEscolhida) => {
    menu.current.open = false;
    acao(acaoEscolhida);
  };
  return (
    <article className="com-publicacao">
      <header className="com-publicacao-topo">
        <Autor autor={item.autor} criado={item.criado_em} />
        {(item.pode_excluir || item.estado === "aprovada") && (
          <details className="com-mais-acoes" ref={menu} onToggle={(e) => {
            setMenuAberto(e.currentTarget.open);
            // Mantém as opções acima da navegação fixa em telas baixas.
            if (e.currentTarget.open) e.currentTarget.lastElementChild.scrollIntoView({ block: "nearest" });
          }}>
            <summary aria-label="Mais ações da publicação">•••</summary>
            <div>
              {item.estado === "aprovada" && (
                <button
                  onClick={() =>
                    executar({ tipo: "denunciar", publicacao: item.id })
                  }
                >
                  Denunciar
                </button>
              )}
              {item.pode_excluir && (
                <button onClick={() => executar({ tipo: "excluir", id: item.id })}>
                  Excluir
                </button>
              )}
            </div>
          </details>
        )}
      </header>
      <div className="com-etiquetas">
        <span className="com-categoria">{item.categoria}</span>
        {item.estado !== "aprovada" ? (
          <span className="ws-tag">
            {item.estado === "pendente"
              ? "◷ Em análise"
              : "! Precisa de ajustes"}
          </span>
        ) : (
          <span className="com-pontos">
            {item.pontos
              ? `+${item.pontos} pontos`
              : "Sem pontos · cota atingida"}
          </span>
        )}
      </div>
      <TextoPublicacao texto={item.conteudo} />
      {item.youtube_id && (
        <VideoComunidade key={item.youtube_id} id={item.youtube_id} />
      )}
      {item.motivo && <p className="com-motivo">Moderação: {item.motivo}</p>}
      {item.revisao > 1 && (item.minha || modo === "moderacao") && (
        <HistoricoPublicacao id={item.id} />
      )}
      <div className="com-acoes">
        {item.estado === "aprovada" && (
          <>
            <button
              aria-expanded={conversa}
              onClick={() => setConversa(!conversa)}
            >
              <Icone name="community" size={17} />
              {item.comentarios}{" "}
              {item.comentarios === 1 ? "comentário" : "comentários"}
            </button>
            <Favorito item={item} />
          </>
        )}
        {item.minha && item.estado === "rejeitada" && (
          <Corrigir
            item={item}
            concluir={() =>
              window.dispatchEvent(
                new Event("ciclo-certo-comunidade-atualizada"),
              )
            }
          />
        )}
        {modo === "moderacao" && (
          <>
            <button
              className="com-aprovar"
              onClick={() => acao({ tipo: "aprovar", id: item.id })}
            >
              <Icone name="check" size={16} />
              Aprovar
            </button>
            <button onClick={() => acao({ tipo: "rejeitar", id: item.id })}>
              Rejeitar
            </button>
          </>
        )}
      </div>
      {item.estado === "aprovada" && <Compartilhar item={item} />}
      {conversa && (
        <Comentarios
          publicacao={item}
          revisao={revisao}
          acao={acao}
          atualizar={atualizar}
        />
      )}
    </article>
  );
}

// Confirmações explicam o efeito, mantêm o texto após falhas e impedem envio repetido.
function Confirmacao({ acao, fechar, concluir }) {
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const titulos = {
    denunciar: "Denunciar conteúdo",
    excluir: "Excluir publicação",
    excluirComentario: "Excluir comentário",
    aprovar: "Aprovar publicação",
    rejeitar: "Rejeitar publicação",
    resolver: "Concluir análise da denúncia",
    revogar: "Revogar restrição da Cici",
  };
  const precisaMotivo = ["denunciar", "rejeitar"].includes(acao.tipo);
  async function confirmar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      if (acao.tipo === "denunciar")
        await enviar(`${base}/publicacoes/${acao.publicacao}/denuncias`, {
          motivo,
          comentario_id: acao.comentario || null,
        });
      if (acao.tipo === "excluir")
        await enviar(`${base}/publicacoes/${acao.id}`, {}, "DELETE");
      if (acao.tipo === "excluirComentario")
        await enviar(`${base}/comentarios/${acao.id}`, {}, "DELETE");
      if (["aprovar", "rejeitar"].includes(acao.tipo))
        await enviar(`${base}/publicacoes/${acao.id}/moderar`, {
          aprovar: acao.tipo === "aprovar",
          motivo,
        });
      if (["resolver", "revogar"].includes(acao.tipo))
        await enviar(`${base}/denuncias/${acao.id}/resolver${acao.tipo === "revogar" ? "?revogar=true" : ""}`);
      concluir(
        acao.tipo === "denunciar"
          ? "Denúncia recebida. A Cici analisa o conteúdo e encaminha casos incertos à moderação."
          : "Alteração salva.",
      );
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }
  return (
    <Modal
      titulo={titulos[acao.tipo]}
      fechar={() => {
        if (!enviando) fechar();
      }}
    >
      <form onSubmit={confirmar}>
        {acao.tipo === "excluir" && (
          <p>
            A publicação sairá da comunidade. Seus pontos serão estornados e a
            cota utilizada não será reaberta.
          </p>
        )}
        {acao.tipo === "excluirComentario" && (
          <p>O comentário será removido da conversa.</p>
        )}
        {acao.tipo === "aprovar" && (
          <p>
            O conteúdo ficará visível para todos na comunidade. A API verificará
            a cota do autor antes de conceder os pontos.
          </p>
        )}
        {acao.tipo === "revogar" && <p>A restrição será encerrada e a pessoa receberá um aviso.</p>}
        {acao.tipo === "resolver" && (
          <p>
            Conclua após analisar o conteúdo. Se for necessário removê-lo, use a
            opção de exclusão antes de encerrar a denúncia.
          </p>
        )}
        {precisaMotivo && (
          <label className="ws-field">
            <span className="ws-label">
              {acao.tipo === "denunciar"
                ? "Por que este conteúdo deve ser analisado?"
                : "Motivo para o autor"}
            </span>
            <textarea
              required
              minLength={10}
              maxLength={300}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </label>
        )}
        {erro && (
          <p role="alert" className="aviso erro">
            {erro}
          </p>
        )}
        <div className="com-form-rodape">
          <button
            className="ws-btn ws-btn-ghost"
            type="button"
            disabled={enviando}
            onClick={fechar}
          >
            Cancelar
          </button>
          <button className="ws-btn" disabled={enviando}>
            {enviando ? "Salvando…" : "Confirmar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// A página consulta contas e recompensas reais; exemplos editoriais ficam explicitamente separados.
export default function Comunidade({
  perfil,
  selecionada,
  fecharSelecionada,
  pergunta,
  limparPergunta,
}) {
  const [publica, setPublica] = useState(false);
  const [destaque, setDestaque] = useState(null);
  const [revisao, setRevisao] = useState(0);
  const [revisaoResumo, setRevisaoResumo] = useState(0);
  const [modo, setModo] = useState("feed");
  const [categoria, setCategoria] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("");
  const [texto, setTexto] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [compondo, setCompondo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const {
    notificar: setAviso,
    som,
    alternarSom,
    prepararAudio,
  } = useAvisosComunidade();
  const [video, setVideo] = useState("");
  const [anexarVideo, setAnexarVideo] = useState(false);
  const videoId = identificarVideo(video);
  const videoInvalido = Boolean(video.trim() && !videoId);
  const [acao, setAcao] = useState(null);
  const [verRegras, setVerRegras] = useState(false);
  const envioEmCurso = useRef(false);
  const inicioFeed = useRef(null);
  const resumo = useDados(
    `${base}/resumo`,
    `${revisao}:${modo}:${revisaoResumo}`,
  );
  const consulta = new URLSearchParams({ modo, limite: "12" });
  if (categoria) consulta.set("categoria", categoria);
  if (filtroPerfil) consulta.set("perfil", filtroPerfil);
  const caminho =
    modo === "denuncias"
      ? `${base}/denuncias?limite=12`
      : `${base}/publicacoes?${consulta}`;
  const feed = useFeedComunidade(caminho, revisao);
  const regras = resumo.dados;
  const atualizar = () => setRevisao((n) => n + 1);
  const restricaoAte = regras?.restricao_ate;
  useEffect(() => {
    if (!restricaoAte) return;
    const prazo = new Date(restricaoAte).getTime() - Date.now();
    const timer = window.setTimeout(() => {
      setRevisaoResumo((n) => n + 1);
      setRevisao((n) => n + 1);
    }, Math.max(1000, prazo + 150));
    return () => window.clearTimeout(timer);
  }, [restricaoAte]);
  useEffect(() => {
    if (pergunta) {
      setTexto(pergunta + "\n\n");
      setNovaCategoria("Sugestões");
      setCompondo(true);
      limparPergunta();
    }
  }, [pergunta, limparPergunta]);
  useEffect(() => {
    const recarregar = () => {
      setRevisaoResumo((n) => n + 1);
      // Um aviso não pode apagar o comentário que a pessoa ainda está escrevendo.
      const rascunho = [
        ...document.querySelectorAll(".com-comentarios textarea"),
      ].some((campo) => campo.value.trim());
      if (!rascunho) setRevisao((n) => n + 1);
    };
    window.addEventListener("ciclo-certo-comunidade-atualizada", recarregar);
    return () =>
      window.removeEventListener(
        "ciclo-certo-comunidade-atualizada",
        recarregar,
      );
  }, []);

  // O rascunho permanece em memória ao fechar; nunca é enviado ou publicado sem ação explícita.
  function abrirCompositor(sugestao = "") {
    if (sugestao && !texto) setNovaCategoria(sugestao);
    setCompondo(true);
  }
  async function publicar(evento) {
    evento.preventDefault();
    if (envioEmCurso.current || videoInvalido) return;
    envioEmCurso.current = true;
    setEnviando(true);
    setErro("");
    prepararAudio();
    try {
      const resultado = await enviar(`${base}/publicacoes`, {
        categoria: novaCategoria,
        conteudo: texto,
        youtube_url: video.trim() || null,
        publica,
      });
      setTexto("");
      setPublica(false);
      setVideo("");
      setAnexarVideo(false);
      setNovaCategoria("");
      setCompondo(false);
      setModo("minhas");
      setCategoria("");
      setFiltroPerfil("");
      setAviso({
        publicacao: resultado.estado === "aprovada",
        sonoro: true,
        texto: resultado.estado === "aprovada"
          ? "A Cici verificou sua publicação e ela já está no feed."
          : resultado.estado === "rejeitada"
            ? "A publicação precisa de ajustes. Veja o motivo em Minhas publicações."
            : "Acompanhe a revisão do vídeo em Minhas publicações.",
      });
      atualizar();
    } catch (e) {
      setErro(e.message);
    } finally {
      envioEmCurso.current = false;
      setEnviando(false);
    }
  }
  return (
    <div className="comunidade">
      <header className="com-cabecalho">
        <div className="com-cabecalho-texto">
          <p className="com-editorial">NOSSO BAIRRO, MAIS VIVO</p>
          <h1>
            Comunidade<span aria-hidden="true">.</span>
          </h1>
          <p>Boas ideias crescem quando a gente compartilha.</p>
        </div>
        <div className="com-jardim" aria-hidden="true">
          <span />
          <span />
          <span />
          <Icone name="leaf" size={48} />
        </div>
      </header>
      <div className="com-painel">
        <button
          className="com-pontos-resumo"
          onClick={() => setVerRegras(true)}
          aria-label="Ver meus pontos e regras da comunidade"
        >
          <span className="com-mini-folha">
            <Icone name="leaf" size={20} />
          </span>
          <span>
            <strong>
              {regras ? regras.saldo.toLocaleString("pt-BR") : "—"} pontos
            </strong>
            <small>na comunidade</small>
          </span>
          <span className="com-cota-resumo">
            Hoje{" "}
            <b>{regras ? `${regras.usadas_dia}/${regras.limite_dia}` : "—"}</b>
          </span>
          <Icone name="arrow" size={16} />
        </button>
        <button
          className="com-som"
          onClick={alternarSom}
          aria-pressed={som}
          aria-label="Som da comunidade"
          title={
            som
              ? "Desativar som de publicações e avisos"
              : "Ativar som de publicações e avisos"
          }
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            aria-hidden="true"
          >
            <path d="M11 4 5 9H2v6h3l6 5V4Z" />
            {som ? (
              <>
                <path d="M15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" />
              </>
            ) : (
              <path d="m16 9 6 6m0-6-6 6" />
            )}
          </svg>
          <span>Som {som ? "ligado" : "desligado"}</span>
        </button>
      </div>
      {regras?.restricao && <p className="cc-cuidado" role="status">{regras.restricao}</p>}
      {resumo.erro && (
        <div className="com-estado">
          <Estado recurso={resumo} />
        </div>
      )}
      <div className="com-grade">
        <div className="com-principal">
          <AcoesBairro
            compacto
            abrir={setDestaque}
            participarConversa={(titulo) => {
              setTexto(titulo + "\n\n");
              setNovaCategoria("Sugestões");
              abrirCompositor();
            }}
          />
          <button
            className="ws-card com-convite"
            onClick={() => abrirCompositor()}
          >
            <span className="com-convite-icone" aria-hidden="true">
              <Icone name="leaf" size={23} />
            </span>
            <span>
              <strong>
                {texto
                  ? "Continuar meu rascunho"
                  : "O que vamos cultivar hoje?"}
              </strong>
              <small>Compartilhe uma dica, experiência ou ideia.</small>
            </span>
            <span className="com-convite-mais" aria-hidden="true">
              +
            </span>
          </button>
          <section
            className="ws-card com-feed"
            aria-label="Publicações da comunidade"
            ref={inicioFeed}
            tabIndex={-1}
          >
            <div
              className="com-abas"
              role="group"
              aria-label="Visão da comunidade"
            >
              {[
                ["feed", "Para a comunidade"],
                ["minhas", "Minhas publicações"],
                ["salvos", "Salvas"],
                ...(regras?.moderador
                  ? [
                      ["moderacao", "Aprovações"],
                      ["denuncias", "Denúncias"],
                    ]
                  : []),
              ].map(([id, nome]) => (
                <button
                  key={id}
                  aria-pressed={modo === id}
                  onClick={() => setModo(id)}
                >
                  {nome}
                </button>
              ))}
            </div>
            {modo !== "denuncias" && (
              <>
                <div className="com-filtro-topo">
                  <span>
                    <Icone name="community" size={17} />{" "}
                    {modo === "feed"
                      ? "Conversas que transformam"
                      : modo === "minhas"
                        ? "Suas ideias por aqui"
                        : modo === "salvos"
                          ? "Ideias para guardar"
                          : "Conteúdos para analisar"}
                  </span>
                  <select
                    aria-label="Filtrar por perfil"
                    value={filtroPerfil}
                    onChange={(e) => setFiltroPerfil(e.target.value)}
                  >
                    <option value="">Todos os perfis</option>
                    <option value="morador">Moradores</option>
                    <option value="cooperativa">Cooperadores</option>
                  </select>
                </div>
                <div
                  className="com-categorias"
                  role="group"
                  aria-label="Filtrar por categoria"
                >
                  {["", ...(regras?.categorias || [])].map((c) => (
                    <button
                      key={c}
                      aria-pressed={categoria === c}
                      onClick={() => setCategoria(c)}
                    >
                      {c || "Tudo"}
                    </button>
                  ))}
                </div>
              </>
            )}
            {feed.pronto &&
              !feed.itens.length &&
              (modo !== "feed" || !temInspiracao(categoria, filtroPerfil)) &&
              !feed.erro &&
              !feed.carregando && (
                <div
                  className={`com-vazio ${modo === "feed" ? "com-vazio-feed" : ""}`}
                >
                  <span className="com-vazio-icone">
                    <Icone name="community" size={24} />
                  </span>
                  <h2>
                    {modo === "denuncias"
                      ? "Nenhuma denúncia pendente"
                      : modo === "moderacao"
                        ? "Tudo em dia por aqui"
                        : "Vamos começar uma conversa?"}
                  </h2>
                  <p>
                    {modo === "denuncias" || modo === "moderacao"
                      ? "Novos conteúdos para analisar aparecerão aqui."
                      : modo === "minhas"
                        ? "Suas publicações e o andamento da análise aparecerão aqui."
                        : "Ainda não há publicações nesta seleção. Sua ideia pode ser a primeira."}
                  </p>
                  {modo === "feed" && (
                    <button
                      className="com-inspirar"
                      onClick={() => abrirCompositor()}
                    >
                      Compartilhar uma ideia <Icone name="arrow" size={15} />
                    </button>
                  )}
                </div>
              )}
            {feed.itens.map((item) =>
              modo === "denuncias" ? (
                <article key={item.id} className="com-publicacao">
                  <span className="com-categoria">
                    {item.comentario_id
                      ? "Comentário denunciado"
                      : "Publicação denunciada"}
                  </span>
                  <p className="com-texto">
                    {item.excluido ? "Conteúdo já excluído." : item.conteudo}
                  </p>
                  <p className="com-motivo">Motivo: {item.motivo}</p>
                  <p className="com-motivo">Análise da Cici: {({
                    pendente: "Aguardando análise", incerta: "Revisão humana necessária",
                    sem_infracao: "Sem infração clara", ofensa: "Ataque pessoal", ameaca: "Ameaça",
                    odio: "Discurso de ódio", assedio_grave: "Assédio grave",
                    ja_aplicada: "Conteúdo já analisado e sancionado", alterado: "O conteúdo mudou durante a análise",
                  })[item.analise] || "Aguardando análise"}</p>
                  {item.evidencia && <p className="com-motivo">Trecho: “{item.evidencia}”</p>}
                  {item.sancao_ate && <p className="com-motivo">{item.revogada_em ? "Restrição revogada" :
                    `Restrição até ${new Date(item.sancao_ate).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (Brasília)`}</p>}
                  <div className="com-acoes">
                    {item.sancao_ate && !item.revogada_em && new Date(item.sancao_ate).getTime() > Date.now() &&
                      <button onClick={() => setAcao({ tipo: "revogar", id: item.id })}>Revogar restrição</button>}
                    {!item.excluido && (
                      <button
                        onClick={() =>
                          setAcao({
                            tipo: item.comentario_id
                              ? "excluirComentario"
                              : "excluir",
                            id: item.comentario_id || item.publicacao_id,
                          })
                        }
                      >
                        Excluir conteúdo
                      </button>
                    )}
                    {!item.resolvido_em && <button onClick={() => setAcao({ tipo: "resolver", id: item.id })}>Concluir análise</button>}
                  </div>
                </article>
              ) : (
                <Publicacao
                  key={item.id}
                  item={item}
                  modo={modo}
                  revisao={revisao}
                  acao={setAcao}
                  atualizar={feed.comentou}
                />
              ),
            )}
            <FimDoFeed
              feed={feed}
              continuar={() => {
                feed.carregar(true);
                inicioFeed.current?.scrollIntoView({ block: "start" });
                inicioFeed.current?.focus({ preventScroll: true });
              }}
            />
            {modo === "feed" &&
              feed.pronto &&
              !feed.erro &&
              !feed.proximo &&
              !feed.itens.length && (
                <Inspiracao
                  categoria={categoria}
                  perfil={filtroPerfil}
                  abrir={abrirCompositor}
                />
              )}
          </section>
        </div>
        <aside className="com-lateral">
          <section className="ws-card com-lateral-convite">
            <Icone name="leaf" size={28} />
            <p className="com-editorial">CADA IDEIA CONTA</p>
            <h2>O próximo passo começa com uma conversa.</h2>
            <p>
              Uma descoberta na horta, um novo jeito de reutilizar, uma sugestão
              para o bairro. Tem espaço para tudo isso aqui.
            </p>
            <button className="ws-btn" onClick={() => abrirCompositor()}>
              Compartilhar ideia <Icone name="arrow" size={16} />
            </button>
          </section>
          <section className="com-convivencia">
            <h2>Vamos cuidar deste espaço?</h2>
            <p>
              Valorize a autoria, evite repetir conteúdos e mantenha o respeito.
              Não compartilhe dados pessoais de outras pessoas.
            </p>
            <p>
              Encontrou algo inadequado? Use Denunciar para avisar a moderação.
            </p>
            <button className="com-inspirar" onClick={() => setVerRegras(true)}>
              Entenda os pontos <Icone name="arrow" size={15} />
            </button>
          </section>
        </aside>
      </div>
      {compondo && (
        <Modal
          titulo="Plante uma ideia"
          className="com-compositor"
          fechar={() => {
            if (!envioEmCurso.current) setCompondo(false);
          }}
        >
          <p className="com-compositor-sub">
            Um pequeno gesto pode inspirar todo o bairro.
          </p>
          <div className="com-identidade">
            <span className="com-mini-folha">
              <Icone name="leaf" size={20} />
            </span>
            <div>
              <strong>{perfil.nome}</strong>
              <span className="com-perfil">
                {nomePerfil(perfil.tipo)} · Publicando com sua conta
              </span>
            </div>
          </div>
          <form onSubmit={publicar}>
            <label className="ws-field">
              <span className="sr-only">Sua publicação</span>
              <textarea
                aria-label="Sua publicação"
                autoFocus
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                required
                minLength={10}
                maxLength={1200}
                disabled={enviando}
                placeholder="Uma dica, uma descoberta ou uma ideia para cuidar do nosso bairro…"
              />
            </label>
            <div className="com-compor-nota">
              <small>De 10 a 1.200 caracteres</small>
              <small>{texto.length}/1200</small>
            </div>
            <label className="ws-field com-categoria-campo">
              <span className="ws-label">Categoria obrigatória</span>
              <select
                required
                aria-label="Categoria obrigatória"
                disabled={enviando}
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
              >
                <option value="">Escolha onde sua ideia se encaixa</option>
                {regras?.categorias.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="com-anexo">
              {!anexarVideo ? (
                <button
                  type="button"
                  className="com-inspirar"
                  onClick={() => setAnexarVideo(true)}
                >
                  + Adicionar vídeo do YouTube
                </button>
              ) : (
                <>
                  <label className="ws-field">
                    <span className="ws-label">Link do YouTube (opcional)</span>
                    <input
                      aria-label="Link do YouTube (opcional)"
                      type="text"
                      inputMode="url"
                      autoComplete="off"
                      maxLength={500}
                      disabled={enviando}
                      value={video}
                      onChange={(e) => setVideo(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=…"
                      aria-invalid={videoInvalido}
                      aria-describedby="com-video-orientacao"
                    />
                  </label>
                  <p
                    id="com-video-orientacao"
                    className={
                      videoInvalido ? "com-video-erro" : "com-video-ajuda"
                    }
                  >
                    {videoInvalido
                      ? "Cole um link válido de vídeo do YouTube, Shorts ou youtu.be."
                      : "O vídeo fica hospedado no YouTube e aparece na publicação após a aprovação."}
                  </p>
                  {videoId && <VideoComunidade key={videoId} id={videoId} />}
                  <button
                    type="button"
                    className="com-inspirar"
                    disabled={enviando}
                    onClick={() => {
                      setVideo("");
                      setAnexarVideo(false);
                    }}
                  >
                    Remover vídeo
                  </button>
                </>
              )}
            </div>
            <p className="com-compositor-info">
              <Icone name="leaf" size={17} /> Sua publicação passa por análise
              antes de aparecer no feed. Os pontos chegam após a aprovação,
              dentro da cota.
            </p>
            <label className="com-consentimento">
              <input
                type="checkbox"
                checked={publica}
                disabled={enviando}
                onChange={(e) => setPublica(e.target.checked)}
              />
              <span>
                Permitir que meu nome e esta publicação apareçam para visitantes
                e sejam compartilhados por link. Sem marcar, o conteúdo fica
                apenas para contas autenticadas.
              </span>
            </label>
            {erro && (
              <p role="alert" className="aviso erro">
                {erro}
              </p>
            )}
            {!regras && (
              <p role="status">
                Aguarde o carregamento das categorias para publicar.
              </p>
            )}
            <div className="com-form-rodape">
              <button
                className="ws-btn ws-btn-ghost"
                type="button"
                disabled={enviando}
                onClick={() => setCompondo(false)}
              >
                Agora não
              </button>
              <button
                className="ws-btn"
                disabled={
                  enviando ||
                  !regras ||
                  texto.trim().length < 10 ||
                  !novaCategoria ||
                  videoInvalido
                }
              >
                {enviando ? "Enviando…" : "Publicar"}
                <Icone name="arrow" size={16} />
              </button>
            </div>
          </form>
        </Modal>
      )}
      {verRegras && (
        <Modal
          titulo="Seus pontos na comunidade"
          className="com-recompensas"
          fechar={() => setVerRegras(false)}
        >
          <Estado recurso={resumo} />
          {regras && (
            <>
              <div className="com-saldo">
                <strong>{regras.saldo.toLocaleString("pt-BR")}</strong>
                <span>pontos de participação</span>
              </div>
              <div className="com-cotas">
                <span>
                  Hoje{" "}
                  <strong>
                    {regras.usadas_dia}/{regras.limite_dia}
                  </strong>
                </span>
                <span>
                  Esta semana{" "}
                  <strong>
                    {regras.usadas_semana}/{regras.limite_semana}
                  </strong>
                </span>
              </div>
              <p className="com-regra">
                +{regras.pontos} pontos por publicação aprovada, dentro da cota.
              </p>
              <p>
                Até {regras.limite_dia} publicações recompensadas por dia e{" "}
                {regras.limite_semana} por semana, para moradores e
                cooperadores. Vale a data da aprovação, no horário de Brasília.
                A semana começa na segunda-feira.
              </p>
              <p>
                Acima da cota, sua publicação aprovada aparece sem pontos.
                Curtidas e comentários não geram pontos. Excluir estorna os
                pontos e não reabre a cota.
              </p>
              <p>
                Este saldo é separado das coletas, sem conversão em dinheiro ou
                resgate. Os exemplos de demonstração não geram pontos.
              </p>
            </>
          )}
        </Modal>
      )}
      {acao && (
        <Confirmacao
          acao={acao}
          fechar={() => setAcao(null)}
          concluir={(mensagem) => {
            setAcao(null);
            setAviso({ texto: mensagem });
            atualizar();
          }}
        />
      )}
      {(selecionada || destaque) && (
        <Modal
          titulo="Publicação da comunidade"
          fechar={() => {
            setDestaque(null);
            fecharSelecionada?.();
          }}
        >
          <DetalhePublicacao
            id={selecionada || destaque}
            revisao={revisao}
            acao={setAcao}
            atualizar={atualizar}
          />
        </Modal>
      )}
    </div>
  );
}

function DetalhePublicacao({ id, revisao, acao, atualizar }) {
  const r = useDados(`/comunidade/item/${id}`, revisao);
  return (
    <>
      <Estado recurso={r} />
      {r.dados && (
        <Publicacao
          key={r.dados.revisao}
          item={r.dados}
          modo="detalhe"
          revisao={revisao}
          acao={acao}
          atualizar={atualizar}
        />
      )}
    </>
  );
}
