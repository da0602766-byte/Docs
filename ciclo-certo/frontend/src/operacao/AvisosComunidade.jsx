import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { enviar, solicitar } from "../api";
import { AvisoComunidade } from "./ComunidadeExtras";
import { prepararSom, tocarPublicacao } from "./comunidadeSom";

const ContextoAvisos = createContext(null);
export const useAvisosComunidade = () => useContext(ContextoAvisos);

// A central acompanha a conta em todas as telas, sem consultar quando a aba está oculta.
export default function AvisosComunidade({ perfil, children }) {
  const [fila, setFila] = useState([]);
  const [atual, setAtual] = useState(null);
  const [som, setSom] = useState(() => {
    try {
      return localStorage.getItem("ciclo-certo-comunidade-som-v1") !== "nao";
    } catch {
      return true;
    }
  });
  const audio = useRef(null);
  const somAtual = useRef(som);
  const sequencia = useRef(0);
  const conhecidos = useRef(new Set());
  const confirmar = useRef(new Set());
  const armazenamento = `cc-comunidade-avisos-v1-${perfil.id}`;
  const notificar = useCallback((aviso) => {
    setFila((anteriores) => [
      ...anteriores,
      { ...aviso, chave: ++sequencia.current },
    ]);
  }, []);
  const prepararAudio = useCallback(() => {
    if (somAtual.current) audio.current = prepararSom(audio.current);
  }, []);
  const fechar = useCallback(() => setAtual(null), []);
  const alternarSom = () => {
    somAtual.current = !som;
    setSom(!som);
    try {
      localStorage.setItem(
        "ciclo-certo-comunidade-som-v1",
        som ? "nao" : "sim",
      );
    } catch {
      /* Preferência em memória continua funcionando. */
    }
    if (!som) prepararAudio();
  };
  useEffect(() => {
    // Navegadores liberam áudio após uma interação; avisos visuais independem dessa permissão.
    const sincronizar = (evento) => {
      if (evento.key === "ciclo-certo-comunidade-som-v1") {
        const habilitado = evento.newValue !== "nao";
        somAtual.current = habilitado;
        setSom(habilitado);
      }
    };
    document.addEventListener("pointerdown", prepararAudio);
    document.addEventListener("keydown", prepararAudio);
    if (navigator.userActivation?.hasBeenActive) prepararAudio();
    window.addEventListener("storage", sincronizar);
    return () => {
      document.removeEventListener("pointerdown", prepararAudio);
      document.removeEventListener("keydown", prepararAudio);
      window.removeEventListener("storage", sincronizar);
      audio.current?.close().catch(() => {});
      audio.current = null;
    };
  }, [prepararAudio]);

  useEffect(() => {
    let ativo = true,
      ocupado = false,
      timer;
    const controle = new AbortController();
    async function consultar() {
      if (!ativo || ocupado || document.visibilityState === "hidden") return;
      clearTimeout(timer);
      ocupado = true;
      try {
        for (const id of confirmar.current) {
          await enviar(`/comunidade/notificacoes/${id}/lida`, {}, "PUT");
          if (!ativo) return;
          confirmar.current.delete(id);
        }
        const resposta = await solicitar("/comunidade/notificacoes", {
          signal: controle.signal,
        });
        if (!ativo) return;
        for (const item of resposta.itens) {
          if (conhecidos.current.has(item.id)) continue;
          conhecidos.current.add(item.id);
          notificar({
            id: item.id,
            publicacaoId: item.publicacao_id,
            decisao: item.estado,
            titulo:
              item.estado === "aprovada"
                ? "Sua publicação foi aprovada!"
                : item.estado === "sancao" ? "Moderação da Comunidade"
                : item.estado === "resposta"
                  ? "A conversa continua!"
                  : "Sua publicação precisa de atenção",
            texto: item.mensagem,
            publicacao: item.estado === "aprovada",
            sonoro: true,
          });
        }
      } catch {
        /* Avisos seguem pendentes no servidor; a próxima rodada tenta de novo. */
      } finally {
        ocupado = false;
        if (ativo) timer = setTimeout(consultar, 15000);
      }
    }
    consultar();
    document.addEventListener("visibilitychange", consultar);
    window.addEventListener("focus", consultar);
    window.addEventListener("ciclo-certo-consultar-avisos", consultar);
    return () => {
      ativo = false;
      clearTimeout(timer);
      controle.abort();
      document.removeEventListener("visibilitychange", consultar);
      window.removeEventListener("focus", consultar);
      window.removeEventListener("ciclo-certo-consultar-avisos", consultar);
    };
  }, [notificar]);

  useEffect(() => {
    if (atual || !fila.length) return;
    let timer,
      cancelado = false;
    function apresentar() {
      if (cancelado) return;
      // Não consumir um aviso atrás de um diálogo ou em uma aba invisível.
      if (
        document.visibilityState === "hidden" ||
        document.querySelector("dialog[open]")
      ) {
        timer = setTimeout(apresentar, 500);
        return;
      }
      const aviso = fila[0];
      let repetido = false;
      if (aviso.id) {
        try {
          const salvos = JSON.parse(
            localStorage.getItem(armazenamento) || "[]",
          );
          const ids = Array.isArray(salvos) ? salvos : [];
          repetido = ids.includes(aviso.id);
          localStorage.setItem(
            armazenamento,
            JSON.stringify(
              [...ids.filter((id) => id !== aviso.id), aviso.id].slice(-100),
            ),
          );
        } catch {
          /* O servidor ainda confirma a leitura sem armazenamento local. */
        }
        confirmar.current.add(aviso.id);
        enviar(`/comunidade/notificacoes/${aviso.id}/lida`, {}, "PUT")
          .then(() => confirmar.current.delete(aviso.id))
          .catch(() => {});
      }
      setFila((anteriores) => anteriores.slice(1));
      if (repetido) return;
      setAtual(aviso);
      if (aviso.sonoro && somAtual.current) tocarPublicacao(audio.current);
      if (aviso.id)
        window.dispatchEvent(new Event("ciclo-certo-comunidade-atualizada"));
    }
    timer = setTimeout(apresentar, 120);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [atual, fila, armazenamento]);

  return (
    <ContextoAvisos.Provider
      value={{ notificar, som, alternarSom, prepararAudio }}
    >
      {children}
      {atual && (
        <AvisoComunidade key={atual.chave} aviso={atual} fechar={fechar} />
      )}
    </ContextoAvisos.Provider>
  );
}
