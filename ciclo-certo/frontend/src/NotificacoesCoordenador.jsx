import React, { useEffect, useRef, useState } from "react";
import { solicitar } from "./api";

// O sino mantém a caixa de avisos; o toast desaparece após seis segundos.
export default function NotificacoesCoordenador({ perfil, abrir }) {
  const [avisos, setAvisos] = useState([]),
    [aberto, setAberto] = useState(false),
    [toast, setToast] = useState(null),
    [erro, setErro] = useState(false);
  const vistos = useRef(new Set()),
    raiz = useRef(null);
  const chave = `cc-avisos-${perfil.id}`;
  useEffect(() => {
    let ativo = true,
      timer;
    let salvos = [];
    try {
      salvos = JSON.parse(sessionStorage.getItem(chave) || "[]");
    } catch {}
    let conhecidos = new Set(Array.isArray(salvos) ? salvos : []);
    let iniciou = sessionStorage.getItem(chave) !== null;
    async function atualizar() {
      try {
        const coletas = await solicitar("/coletas");
        if (!ativo) return;
        const novas = coletas.filter((c) => !conhecidos.has(c.id));
        if (iniciou && novas.length) {
          setAvisos((a) =>
            [
              ...novas.map((c) => ({
                id: c.id,
                nome: c.nome_morador,
                hora: Date.now(),
              })),
              ...a,
            ].slice(0, 30),
          );
          setToast({ quantidade: novas.length, id: novas[0].id });
        }
        conhecidos = new Set(coletas.map((c) => c.id));
        sessionStorage.setItem(chave, JSON.stringify([...conhecidos]));
        iniciou = true;
        setErro(false);
      } catch {
        if (ativo) setErro(true);
      } finally {
        if (ativo) timer = setTimeout(atualizar, 3000);
      }
    }
    atualizar();
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [chave]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    function fechar(e) {
      if (!raiz.current?.contains(e.target)) setAberto(false);
    }
    function tecla(e) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("pointerdown", fechar);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fechar);
      document.removeEventListener("keydown", tecla);
    };
  }, []);
  const pendentes = avisos.filter((a) => !vistos.current.has(a.id)).length;
  return (
    <div className="cc-sino-area" ref={raiz}>
      <button
        className="cc-sino"
        aria-label={`Notificações${pendentes ? `, ${pendentes} novas` : ""}`}
        aria-expanded={aberto}
        onClick={() => {
          setAberto(!aberto);
          avisos.forEach((a) => vistos.current.add(a.id));
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6" />
        </svg>
        {pendentes > 0 && <span>{pendentes}</span>}
        <i className={erro ? "offline" : ""} />
      </button>
      {aberto && (
        <section
          className="cc-caixa-avisos"
          aria-label="Central de notificações"
        >
          <header>
            <strong>Notificações</strong>
            <small>
              {erro ? "Reconectando…" : "Atualização automática ativa"}
            </small>
          </header>
          {!avisos.length ? (
            <p>Você está em dia. Novas solicitações aparecerão aqui.</p>
          ) : (
            avisos.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  abrir(a.id);
                  setAberto(false);
                  setToast(null);
                }}
              >
                <strong>Nova coleta #{a.id}</strong>
                <span>{a.nome} solicitou uma coleta</span>
                <small>
                  {new Date(a.hora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </button>
            ))
          )}
        </section>
      )}
      {toast && (
        <div className="cc-toast" role="status">
          <span className="cc-toast-icone">✓</span>
          <div>
            <strong>
              {toast.quantidade === 1
                ? "Nova solicitação de coleta"
                : `${toast.quantidade} novas solicitações`}
            </strong>
            <button
              onClick={() => {
                abrir(toast.id);
                setToast(null);
              }}
            >
              Ver pedido #{toast.id} →
            </button>
          </div>
          <button aria-label="Dispensar aviso" onClick={() => setToast(null)}>
            ×
          </button>
        </div>
      )}
    </div>
  );
}
