import React, { useEffect, useRef, useState } from "react";
import { Icone } from "../visual";

// Conteúdo editorial ilustrativo, separado das contas, das interações e das recompensas reais.
const exemplos = [
  {
    nome: "Marina",
    perfil: "morador",
    categoria: "Plantio",
    titulo: "Um cantinho verde já é um começo.",
    texto:
      "Uma jardineira perto da janela pode virar uma pequena horta. Observe a luz que chega ao espaço e escolha plantas que combinem com ela. Qual tempero você gostaria de ter por perto?",
  },
  {
    nome: "Rafael",
    perfil: "cooperativa",
    categoria: "Reciclagem",
    titulo: "Separar bem também é cuidar de quem coleta.",
    texto:
      "Esvazie as embalagens e mantenha os recicláveis separados dos resíduos orgânicos. Antes de descartar um material diferente, confirme com a cooperativa como fazer a entrega.",
  },
  {
    nome: "Clara",
    perfil: "morador",
    categoria: "Reutilização",
    titulo: "Antes de descartar, imagine outro uso.",
    texto:
      "Potes de vidro podem organizar sementes, botões e pequenos objetos. Um pouco de criatividade dá uma nova função ao que já temos em casa.",
  },
  {
    nome: "André",
    perfil: "cooperativa",
    categoria: "Compostagem",
    titulo: "Folhas secas também têm seu lugar.",
    texto:
      "Na compostagem doméstica, materiais secos ajudam a equilibrar os restos de frutas e verduras. Comece aos poucos, observe a umidade e procure orientação para o seu tipo de composteira.",
  },
  {
    nome: "Luiza",
    perfil: "morador",
    categoria: "Sugestões",
    titulo: "E se a gente trocasse mudas?",
    texto:
      "Uma troca de mudas e sementes pode aproximar os vizinhos e deixar o bairro mais verde. Que tal conversar sobre um ponto de encontro e os cuidados com cada plantinha?",
  },
  {
    nome: "Pedro",
    perfil: "cooperativa",
    categoria: "Curiosidades",
    titulo: "O símbolo é só o começo da conversa.",
    texto:
      "A indicação de reciclagem em uma embalagem não garante que ela seja recebida em toda cidade. Conhecer os materiais aceitos pela cooperativa ajuda a separar melhor.",
  },
];

// Evita empilhar uma tela vazia e os exemplos quando a seleção já tem inspiração para mostrar.
export function temInspiracao(categoria, perfil) {
  return exemplos.some(
    (item) =>
      (!categoria || item.categoria === categoria) &&
      (!perfil || item.perfil === perfil),
  );
}

export function Inspiracao({ categoria, perfil, abrir }) {
  const itens = exemplos.filter(
    (item) =>
      (!categoria || item.categoria === categoria) &&
      (!perfil || item.perfil === perfil),
  );
  if (!itens.length) return null;
  return (
    <section
      className="com-inspiracao"
      aria-label="Publicações de demonstração"
    >
      <header className="com-inspiracao-cabecalho">
        <span className="com-editorial">PARA INSPIRAR</span>
        <h2>Pequenas ideias. Novos começos.</h2>
        <p>
          Exemplos ilustrativos com personagens fictícios. Não são publicações
          de contas reais e não geram pontos.
        </p>
      </header>
      {itens.map((item) => (
        <article className="com-publicacao com-exemplo" key={item.categoria}>
          <div className="com-autor">
            <span
              className={`ws-avatar ${item.perfil === "cooperativa" ? "ws-avatar-dark" : ""}`}
              aria-hidden="true"
            >
              {item.nome[0]}
            </span>
            <div>
              <strong>
                {item.nome} <span className="com-ficticio">· personagem</span>
              </strong>
              <div className="com-meta">
                <span className="com-perfil">
                  {item.perfil === "morador" ? "Morador" : "Cooperador"}
                </span>
                <span>Demonstração</span>
              </div>
            </div>
            <Icone name="leaf" size={19} />
          </div>
          <div className="com-etiquetas">
            <span className="com-categoria">{item.categoria}</span>
          </div>
          <h3>{item.titulo}</h3>
          <p className="com-texto">{item.texto}</p>
          <button
            className="com-inspirar"
            onClick={() => abrir(item.categoria)}
          >
            Compartilhar minha ideia <Icone name="arrow" size={15} />
          </button>
        </article>
      ))}
    </section>
  );
}

// Observer substitui eventos contínuos de scroll; falhas só são repetidas por ação da pessoa.
export function FimDoFeed({ feed, continuar }) {
  const sentinela = useRef(null);
  useEffect(() => {
    if (
      !feed.proximo ||
      feed.carregando ||
      feed.erro ||
      feed.limite ||
      !window.IntersectionObserver
    )
      return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) feed.carregar();
      },
      { rootMargin: "240px" },
    );
    observador.observe(sentinela.current);
    return () => observador.disconnect();
  }, [feed.proximo, feed.carregando, feed.erro, feed.limite, feed.carregar]);
  return (
    <div ref={sentinela} className="com-fim">
      {feed.carregando && (
        <p role="status">
          <span className="com-carregando" aria-hidden="true" />
          Buscando conversas…
        </p>
      )}
      {feed.erro && (
        <div role="alert">
          <p>{feed.erro}</p>
          <button
            className="ws-btn ws-btn-ghost"
            onClick={() => feed.carregar(feed.limite)}
          >
            Tentar novamente
          </button>
        </div>
      )}
      {!feed.carregando &&
        !feed.erro &&
        feed.proximo &&
        (feed.limite ? (
          <>
            <p>
              Você já leu este grupo de publicações. Continue para carregar o
              próximo e manter o feed leve.
            </p>
            <button className="ws-btn ws-btn-ghost" onClick={continuar}>
              Continuar no feed
            </button>
          </>
        ) : (
          <button
            className="ws-btn ws-btn-ghost"
            onClick={() => feed.carregar()}
          >
            Carregar mais publicações
          </button>
        ))}
      {feed.pronto &&
        !feed.proximo &&
        !feed.carregando &&
        !feed.erro &&
        feed.itens.length > 0 && (
          <p>
            <Icone name="leaf" size={17} /> Você chegou ao fim das publicações.
          </p>
        )}
    </div>
  );
}

// A confirmação não anuncia pontos antes da aprovação; animação decorativa respeita movimento reduzido no CSS.
export function AvisoComunidade({ aviso, fechar }) {
  // Cada evento sorteia posição, deriva, tamanho, rotação, duração e atraso; rerenders não reiniciam a queda.
  const [folhas] = useState(() =>
    Array.from({ length: 7 }, () => ({
      "--origem": `${12 + Math.random() * 60}%`,
      "--deriva": `${-25 + Math.random() * 50}px`,
      "--balanco": `${-18 + Math.random() * 36}px`,
      "--giro": `${-240 + Math.random() * 480}deg`,
      "--angulo": `${-70 + Math.random() * 140}deg`,
      "--tamanho": `${14 + Math.random() * 14}px`,
      "--duracao": `${1.8 + Math.random() * 1.2}s`,
      "--atraso": `${Math.random() * 450}ms`,
    })),
  );
  useEffect(() => {
    const temporizador = window.setTimeout(fechar, 9000);
    return () => window.clearTimeout(temporizador);
  }, [aviso, fechar]);
  return (
    <div
      className={`com-notificacao ${aviso.publicacao ? "com-celebracao" : ""} ${aviso.decisao === "rejeitada" ? "com-notificacao-atencao" : ""}`}
    >
      {aviso.publicacao && (
        <div className="com-folhas" aria-hidden="true">
          {folhas.map((estilo, i) => (
            <span key={i} style={estilo}>
              <Icone name="leaf" size={22} />
            </span>
          ))}
        </div>
      )}
      <span className="com-notificacao-icone" aria-hidden="true">
        <Icone
          name={
            aviso.publicacao
              ? "leaf"
              : aviso.decisao === "rejeitada"
                ? "community"
                : "check"
          }
          size={24}
        />
      </span>
      <div role="status">
        <strong>
          {aviso.titulo ||
            (aviso.publicacao
              ? "Sua ideia ganhou raízes!"
              : "Tudo certo por aqui")}
        </strong>
        <p>{aviso.texto}</p>
      </div>
      <button aria-label="Fechar notificação" onClick={fechar}>
        ×
      </button>
    </div>
  );
}
