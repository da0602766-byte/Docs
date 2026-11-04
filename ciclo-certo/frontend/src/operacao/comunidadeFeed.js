import { useCallback, useEffect, useRef, useState } from "react";
import { solicitar } from "../api";

const vazio = {
  itens: [],
  proximo: null,
  carregando: true,
  erro: "",
  pronto: false,
};
export const limiteVisivel = 60;

// Infraestrutura da interface: cursor, cancelamento e trava evitam cargas duplicadas e respostas de filtros antigos.
export function useFeedComunidade(caminho, revisao) {
  const chave = `${caminho}:${revisao}`;
  const [estado, setEstado] = useState({ ...vazio, chave });
  const atual = useRef(null);
  const buscar = useCallback(async (sessao, cursor, substituir = false) => {
    if (sessao.ocupado || atual.current !== sessao) return;
    sessao.ocupado = true;
    setEstado((anterior) => ({ ...anterior, carregando: true, erro: "" }));
    try {
      const dados = await solicitar(
        `${sessao.caminho}${cursor ? `&antes=${cursor}` : ""}`,
        {
          signal: sessao.controle.signal,
        },
      );
      if (atual.current !== sessao) return;
      setEstado((anterior) => {
        const existentes = substituir ? [] : anterior.itens;
        const ids = new Set(existentes.map((item) => item.id));
        return {
          chave: sessao.chave,
          itens: [
            ...existentes,
            ...dados.itens.filter((item) => !ids.has(item.id)),
          ],
          proximo: dados.proximo,
          carregando: false,
          erro: "",
          pronto: true,
        };
      });
    } catch (erro) {
      if (atual.current === sessao && erro.name !== "AbortError")
        setEstado((anterior) => ({
          ...anterior,
          carregando: false,
          erro: erro.message,
        }));
    } finally {
      sessao.ocupado = false;
    }
  }, []);

  useEffect(() => {
    const sessao = {
      chave,
      caminho,
      controle: new AbortController(),
      ocupado: false,
    };
    atual.current = sessao;
    setEstado({ ...vazio, chave });
    buscar(sessao, null, true);
    return () => {
      atual.current = null;
      sessao.controle.abort();
    };
  }, [caminho, chave, buscar]);

  const visivel = estado.chave === chave ? estado : vazio;
  const carregar = useCallback(
    (substituir = false) => {
      const sessao = atual.current;
      if (!sessao || sessao.chave !== chave || sessao.ocupado) return;
      if (visivel.pronto && !visivel.proximo) return;
      buscar(sessao, visivel.proximo, substituir);
    },
    [buscar, chave, visivel.pronto, visivel.proximo],
  );

  // Comentários atualizam só o contador local, mantendo a conversa e a posição de leitura abertas.
  const comentou = (id) =>
    setEstado((anterior) => ({
      ...anterior,
      itens: anterior.itens.map((item) =>
        item.id === id ? { ...item, comentarios: item.comentarios + 1 } : item,
      ),
    }));
  return {
    ...visivel,
    carregar,
    comentou,
    limite: visivel.itens.length >= limiteVisivel,
  };
}
