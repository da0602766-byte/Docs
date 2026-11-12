import React, { useEffect, useRef, useState } from "react";
import { enviar, solicitar } from "./api";

// O sino mantém a caixa de avisos; o toast desaparece após seis segundos.
export default function NotificacoesCoordenador({ perfil, abrir, abrirCentral }) {
  const morador = perfil.tipo === "morador";
  const [avisos, setAvisos] = useState([]),
    [aberto, setAberto] = useState(false),
    [toast, setToast] = useState(null),
    [erro, setErro] = useState(false);
  const vistos = useRef(new Set()),
    leiturasEmCurso = useRef(new Set()),
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
        // O morador vê seu histórico; a cooperativa mantém os avisos de novos pedidos.
        if (morador) {
          const [comunidade, coletas] = await Promise.allSettled([
            solicitar("/comunidade/avisos"),
            solicitar("/notificacoes"),
          ]);
          if (ativo) {
            setAvisos((anteriores) => {
              const itens = comunidade.status === "fulfilled"
                ? comunidade.value.itens.map((a) => ({ ...a, origem: "comunidade" }))
                : anteriores.filter((a) => a.origem === "comunidade");
              const operacao = coletas.status === "fulfilled"
                ? coletas.value.map((a) => ({ ...a, origem: "coleta" }))
                : anteriores.filter((a) => a.origem === "coleta");
              return [...itens, ...operacao].sort((a, b) => Date.parse(b.criado_em) - Date.parse(a.criado_em));
            });
            setErro(comunidade.status === "rejected" || coletas.status === "rejected");
          }
          return;
        }
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
        if (ativo) timer = setTimeout(atualizar, morador ? 15000 : 3000);
      }
    }
    atualizar();
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [chave, morador]);
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
  const chaveAviso = (a) => `${a.origem}:${a.id}`;
  const pendentes = avisos.filter((a) => morador
    ? !a.lida && !vistos.current.has(chaveAviso(a))
    : !vistos.current.has(a.id)).length;

  function abrirSino() {
    setAberto(!aberto);
    if (aberto) return;
    setToast(null);
    if (!morador) {
      avisos.forEach((a) => vistos.current.add(a.id));
      return;
    }
    const novos = avisos.filter((a) => !a.lida && !leiturasEmCurso.current.has(chaveAviso(a)));
    novos.forEach((a) => {
      const id = chaveAviso(a);
      vistos.current.add(id);
      leiturasEmCurso.current.add(id);
      const base = a.origem === "coleta" ? "/notificacoes" : "/comunidade/notificacoes";
      enviar(`${base}/${a.id}/lida`, {}, "PUT")
        .then(() => {
          vistos.current.delete(id);
          setAvisos((lista) => lista.map((item) => chaveAviso(item) === id ? { ...item, lida: true } : item));
          if (a.origem === "coleta") window.dispatchEvent(new Event("ciclo-certo-avisos-coleta-lidos"));
        })
        .catch(() => {
          vistos.current.delete(id);
          setErro(true);
        })
        .finally(() => leiturasEmCurso.current.delete(id));
    });
  }
  return (
    <div className="cc-sino-area" ref={raiz}>
      <button
        className="cc-sino"
        aria-label={`Notificações${pendentes ? `, ${pendentes} novas` : ""}`}
        aria-expanded={aberto}
        onClick={abrirSino}
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
            <p>{morador ? "Você está em dia. Seus avisos aparecerão aqui." : "Você está em dia. Novas solicitações aparecerão aqui."}</p>
          ) : (
            avisos.map((a) => (
              <button
                key={morador ? chaveAviso(a) : a.id}
                onClick={() => {
                  if (a.origem === "coleta") abrir(a.coleta_id);
                  else if (morador) abrirCentral();
                  else abrir(a.id);
                  setAberto(false);
                  setToast(null);
                }}
              >
                <strong>{a.origem === "coleta" ? (a.tipo === "avaliacao" ? "Avaliação da coleta" : "Aviso da coleta")
                  : morador ? (a.estado === "aprovada" ? "Publicação aprovada" : a.estado === "resposta" ? "Nova resposta" : "Aviso da comunidade")
                    : `Nova coleta #${a.id}`}</strong>
                <span>{morador ? a.mensagem : `${a.nome} solicitou uma coleta`}</span>
                <small>
                  {new Date(morador ? a.criado_em : a.hora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </button>
            ))
          )}
          <button onClick={() => { abrirCentral(); setAberto(false); }}>Ver todas as notificações →</button>
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
