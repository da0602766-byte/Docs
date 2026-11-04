import React, { useEffect, useId, useRef, useState } from "react";

// Um player por vez, criado só ao tocar: a lista não carrega dezenas de players durante a rolagem.
export default function VideoComunidade({ id }) {
  const chave = useId();
  const [ativo, setAtivo] = useState(false);
  const raiz = useRef(null);
  useEffect(() => {
    const trocar = (evento) => {
      if (evento.detail !== chave) setAtivo(false);
    };
    window.addEventListener("ciclo-certo-video-ativo", trocar);
    return () => window.removeEventListener("ciclo-certo-video-ativo", trocar);
  }, [chave]);
  useEffect(() => {
    if (!ativo || !window.IntersectionObserver) return;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (!entrada.isIntersecting) setAtivo(false);
      },
      { rootMargin: "200px" },
    );
    observador.observe(raiz.current);
    return () => observador.disconnect();
  }, [ativo]);
  if (!/^[A-Za-z0-9_-]{11}$/.test(id || "")) return null;
  return (
    <div className="com-video" ref={raiz}>
      <div className="com-video-quadro">
        {ativo ? (
          <iframe
            title="Vídeo do YouTube compartilhado na comunidade"
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        ) : (
          <button
            className="com-video-capa"
            type="button"
            aria-label="Assistir vídeo aqui"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("ciclo-certo-video-ativo", { detail: chave }),
              );
              setAtivo(true);
            }}
          >
            <img
              src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
              loading="lazy"
              alt=""
            />
            <span className="com-video-play" aria-hidden="true">
              ▶
            </span>
            <strong>Assistir aqui</strong>
            <small>YouTube · toque para carregar</small>
          </button>
        )}
      </div>
      <div className="com-video-rodape">
        <span>Vídeo hospedado no YouTube</span>
        <a
          href={`https://www.youtube.com/watch?v=${id}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Abrir no YouTube ↗
        </a>
      </div>
      {ativo && (
        <p className="com-video-ajuda">
          Se o vídeo estiver indisponível ou com reprodução restrita, use o link
          do YouTube.
        </p>
      )}
    </div>
  );
}
