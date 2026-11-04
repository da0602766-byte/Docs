import React, { useState } from "react";
import { enviar } from "../api";
import { Icone } from "../visual";
import { useDados, Estado, Cabecalho, Modal } from "./interface";
import "../comunidade.css";

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
          <time dateTime={criado}>{dataHora(criado)}</time>
        </div>
      </div>
    </div>
  );
}

// Comentários só são consultados quando a conversa está aberta, com paginação própria.
function Comentarios({ publicacao, revisao, acao, atualizar }) {
  const [paginas, setPaginas] = useState([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const recurso = useDados(
    `${base}/publicacoes/${publicacao.id}/comentarios?limite=10${paginas.length ? `&antes=${paginas.at(-1)}` : ""}`,
    revisao,
  );
  async function comentar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro("");
    try {
      await enviar(`${base}/publicacoes/${publicacao.id}/comentarios`, {
        conteudo: texto,
      });
      setTexto("");
      setPaginas([]);
      atualizar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }
  return (
    <section className="com-comentarios" aria-label="Conversa">
      <form onSubmit={comentar}>
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
              <div className="com-acoes">
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
  return (
    <article className="com-publicacao">
      <Autor autor={item.autor} criado={item.criado_em} />
      <div className="com-etiquetas">
        <span className="com-categoria">{item.categoria}</span>
        {item.estado !== "aprovada" ? (
          <span className="ws-tag">
            {item.estado === "pendente" ? "Em análise" : "Não aprovada"}
          </span>
        ) : (
          <span className="com-pontos">
            {item.pontos
              ? `+${item.pontos} pontos`
              : "Sem pontos · cota atingida"}
          </span>
        )}
      </div>
      <p className="com-texto">{item.conteudo}</p>
      {item.motivo && <p className="com-motivo">Moderação: {item.motivo}</p>}
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
            <button
              onClick={() => acao({ tipo: "denunciar", publicacao: item.id })}
            >
              Denunciar
            </button>
          </>
        )}
        {item.pode_excluir && (
          <button onClick={() => acao({ tipo: "excluir", id: item.id })}>
            Excluir
          </button>
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
      if (acao.tipo === "resolver")
        await enviar(`${base}/denuncias/${acao.id}/resolver`);
      concluir(
        acao.tipo === "denunciar"
          ? "Denúncia recebida. A moderação irá analisar o conteúdo."
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

// Toda a tela usa dados da API; o formulário não recebe autor, perfil ou pontos.
export default function Comunidade({ perfil }) {
  const [revisao, setRevisao] = useState(0);
  const [modo, setModo] = useState("feed");
  const [categoria, setCategoria] = useState("");
  const [filtroPerfil, setFiltroPerfil] = useState("");
  const [paginas, setPaginas] = useState([]);
  const [texto, setTexto] = useState("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [acao, setAcao] = useState(null);
  const resumo = useDados(`${base}/resumo`, `${revisao}:${modo}`);
  const consulta = new URLSearchParams({ modo, limite: "15" });
  if (categoria) consulta.set("categoria", categoria);
  if (filtroPerfil) consulta.set("perfil", filtroPerfil);
  if (paginas.length) consulta.set("antes", paginas.at(-1));
  const caminho =
    modo === "denuncias"
      ? `${base}/denuncias?limite=15${paginas.length ? `&antes=${paginas.at(-1)}` : ""}`
      : `${base}/publicacoes?${consulta}`;
  const feed = useDados(caminho, revisao);
  const atualizar = () => setRevisao((n) => n + 1);
  function filtrar(alterar, valor) {
    alterar(valor);
    setPaginas([]);
  }
  async function publicar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErro("");
    setAviso("");
    try {
      await enviar(`${base}/publicacoes`, {
        categoria: novaCategoria,
        conteudo: texto,
      });
      setTexto("");
      setNovaCategoria("");
      setModo("minhas");
      setCategoria("");
      setFiltroPerfil("");
      setPaginas([]);
      setAviso(
        "Publicação enviada para análise. Você pode acompanhar a aprovação em Minhas publicações.",
      );
      atualizar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setEnviando(false);
    }
  }
  const regras = resumo.dados;
  return (
    <div className="comunidade">
      <Cabecalho
        titulo="Comunidade"
        texto="Ideias que circulam. Um bairro que se transforma."
      />
      <div className="com-grade">
        <div className="com-principal">
          <section className="ws-card com-compor" aria-label="Nova publicação">
            <div className="com-compor-titulo">
              <Icone name="leaf" />
              <strong>O que você quer compartilhar?</strong>
              <span className="com-perfil">{nomePerfil(perfil.tipo)}</span>
            </div>
            <form onSubmit={publicar}>
              <label className="ws-field">
                <span className="sr-only">Sua publicação</span>
                <textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  required
                  minLength={10}
                  maxLength={1200}
                  placeholder="Uma dica, uma descoberta ou uma ideia para cuidar do nosso bairro…"
                />
              </label>
              <div className="com-form-rodape">
                <label className="com-categoria-campo">
                  <span className="sr-only">Categoria obrigatória</span>
                  <select
                    aria-label="Categoria obrigatória"
                    required
                    value={novaCategoria}
                    onChange={(e) => setNovaCategoria(e.target.value)}
                  >
                    <option value="">Escolha a categoria</option>
                    {regras?.categorias.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <button className="ws-btn" disabled={enviando || !regras}>
                  {enviando ? "Enviando…" : "Publicar"}
                  <Icone name="arrow" size={16} />
                </button>
              </div>
              <div className="com-compor-nota">
                <small>Publicações passam por aprovação.</small>
                <small>{texto.length}/1200</small>
              </div>
              {erro && (
                <p role="alert" className="aviso erro">
                  {erro}
                </p>
              )}
            </form>
          </section>
          {aviso && (
            <p role="status" className="com-aviso">
              {aviso}
            </p>
          )}
          <section
            className="ws-card com-feed"
            aria-label="Publicações da comunidade"
          >
            <div
              className="com-abas"
              role="group"
              aria-label="Visão da comunidade"
            >
              {[
                ["feed", "Para a comunidade"],
                ["minhas", "Minhas publicações"],
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
                  onClick={() => filtrar(setModo, id)}
                >
                  {nome}
                </button>
              ))}
            </div>
            {modo !== "denuncias" && (
              <div className="com-filtros">
                <label>
                  <span>Categoria</span>
                  <select
                    aria-label="Filtrar por categoria"
                    value={categoria}
                    onChange={(e) => filtrar(setCategoria, e.target.value)}
                  >
                    <option value="">Todas as categorias</option>
                    {regras?.categorias.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Perfil</span>
                  <select
                    aria-label="Filtrar por perfil"
                    value={filtroPerfil}
                    onChange={(e) => filtrar(setFiltroPerfil, e.target.value)}
                  >
                    <option value="">Todos os perfis</option>
                    <option value="morador">Moradores</option>
                    <option value="cooperativa">Cooperadores</option>
                  </select>
                </label>
              </div>
            )}
            <div className="com-estado">
              <Estado recurso={feed} />
            </div>
            {feed.dados && (
              <>
                {!feed.dados.itens.length && (
                  <div className="com-vazio">
                    <span className="com-vazio-icone">
                      <Icone name="community" size={28} />
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
                        : "Nenhuma publicação nesta seleção. Compartilhe uma ideia ou experimente outros filtros."}
                    </p>
                  </div>
                )}
                {feed.dados.itens.map((item) =>
                  modo === "denuncias" ? (
                    <article key={item.id} className="com-publicacao">
                      <span className="com-categoria">
                        {item.comentario_id
                          ? "Comentário denunciado"
                          : "Publicação denunciada"}
                      </span>
                      <p className="com-texto">
                        {item.excluido
                          ? "Conteúdo já excluído."
                          : item.conteudo}
                      </p>
                      <p className="com-motivo">Motivo: {item.motivo}</p>
                      <div className="com-acoes">
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
                        <button
                          onClick={() =>
                            setAcao({ tipo: "resolver", id: item.id })
                          }
                        >
                          Concluir análise
                        </button>
                      </div>
                    </article>
                  ) : (
                    <Publicacao
                      key={item.id}
                      item={item}
                      modo={modo}
                      revisao={revisao}
                      acao={setAcao}
                      atualizar={atualizar}
                    />
                  ),
                )}
                {(paginas.length > 0 || feed.dados.proximo) && (
                  <Paginacao
                    paginas={paginas}
                    proximo={feed.dados.proximo}
                    mudar={setPaginas}
                  />
                )}
              </>
            )}
          </section>
        </div>
        <aside className="com-lateral">
          <section className="ws-card com-recompensas">
            <div className="com-compor-titulo">
              <Icone name="leaf" />
              <h2>Seus pontos na comunidade</h2>
            </div>
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
                  +{regras.pontos} pontos por publicação aprovada, dentro da
                  cota.
                </p>
                <details>
                  <summary>Como funciona a pontuação</summary>
                  <p>
                    Até {regras.limite_dia} publicações recompensadas por dia e{" "}
                    {regras.limite_semana} por semana, para moradores e
                    cooperadores. Vale a data da aprovação, no horário de
                    Brasília. A semana começa na segunda-feira.
                  </p>
                  <p>
                    Acima da cota, sua publicação aprovada aparece sem pontos.
                    Curtidas e comentários não geram pontos. Excluir estorna os
                    pontos e não reabre a cota.
                  </p>
                  <p>
                    Este saldo é separado das coletas, sem conversão em dinheiro
                    ou resgate.
                  </p>
                </details>
              </>
            )}
          </section>
          <section className="com-convivencia">
            <h2>Um espaço para somar</h2>
            <p>
              Compartilhe informações, dicas, experiências e sugestões. Valorize
              a autoria, evite repetir conteúdos e mantenha o respeito.
            </p>
            <p>
              Não publique dados pessoais de outras pessoas. Encontrou algo
              inadequado? Use Denunciar.
            </p>
          </section>
        </aside>
      </div>
      {acao && (
        <Confirmacao
          acao={acao}
          fechar={() => setAcao(null)}
          concluir={(mensagem) => {
            setAcao(null);
            setAviso(mensagem);
            atualizar();
          }}
        />
      )}
    </div>
  );
}
