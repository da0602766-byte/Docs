import { useId, useLayoutEffect, useRef } from "react";
import { MessageCircle, X } from "lucide-react";
import { MarcaCici } from "../Cici";
import CiciFlutuante from "./CiciFlutuante";

export default function JanelaCici({ aberta, definirAbertura, subtitulo, cooperador, aoAgendar, children }) {
  const dialogo = useRef(null);
  const tituloId = useId();
  const janelaId = useId();

  useLayoutEffect(() => {
    const elemento = dialogo.current;
    if (!aberta) {
      if (elemento.open) elemento.close();
      return;
    }
    const viewport = window.visualViewport;
    let quadro = 0;
    let alturaSemTeclado = viewport?.height ?? window.innerHeight;
    let largura = document.documentElement.clientWidth;
    // O Safari pode deslocar a área visível quando o teclado abre ou a página é ampliada.
    function ajustar() {
      quadro = 0;
      const altura = viewport?.height ?? window.innerHeight;
      const larguraAtual = document.documentElement.clientWidth;
      if (larguraAtual !== largura) alturaSemTeclado = altura;
      largura = larguraAtual;
      const escalaNormal = (viewport?.scale ?? 1) < 1.05;
      if (escalaNormal) alturaSemTeclado = Math.max(alturaSemTeclado, altura);

      const historico = elemento.querySelector(".cici-dialogo-mensagens");
      const noFim = historico && historico.scrollHeight - historico.scrollTop - historico.clientHeight < 60;
      elemento.style.setProperty("--cici-altura-visivel", altura + "px");
      elemento.style.setProperty("--cici-largura-visivel", (viewport?.width ?? larguraAtual) + "px");
      elemento.style.setProperty("--cici-topo-visivel", Math.max(0, viewport?.offsetTop ?? 0) + "px");
      elemento.style.setProperty("--cici-esquerda-visivel", Math.max(0, viewport?.offsetLeft ?? 0) + "px");
      const alturaReferencia = Math.max(window.innerHeight, alturaSemTeclado);
      elemento.toggleAttribute("data-teclado", escalaNormal && alturaReferencia - altura > 80);
      elemento.toggleAttribute("data-compacta", altura < 460);
      if (noFim) historico.scrollTop = historico.scrollHeight;
    }
    const atualizar = () => {
      if (!quadro) quadro = window.requestAnimationFrame(ajustar);
    };
    if (!elemento.open) elemento.showModal();
    ajustar();
    const historico = elemento.querySelector(".cici-dialogo-mensagens");
    if (historico) historico.scrollTop = historico.scrollHeight;

    viewport?.addEventListener("resize", atualizar);
    viewport?.addEventListener("scroll", atualizar);
    window.addEventListener("resize", atualizar);
    elemento.addEventListener("focusin", atualizar);
    elemento.addEventListener("focusout", atualizar);
    return () => {
      window.cancelAnimationFrame(quadro);
      viewport?.removeEventListener("resize", atualizar);
      viewport?.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
      elemento.removeEventListener("focusin", atualizar);
      elemento.removeEventListener("focusout", atualizar);
    };
  }, [aberta]);

  return (
    <>
      <CiciFlutuante conversa={janelaId} aberta={aberta} aoAbrir={() => definirAbertura(true)}
        cooperador={cooperador} aoAgendar={aoAgendar} />
      <dialog ref={dialogo} id={janelaId} className="cici-janela" aria-labelledby={tituloId}
        onCancel={(e) => {
          if (e.target !== e.currentTarget) return;
          e.preventDefault();
          definirAbertura(false);
        }}>
        <header className="cici-janela-cabecalho">
          <MarcaCici animada />
          <div><h2 id={tituloId}>Cici</h2><p>{subtitulo}</p></div>
          <button type="button" autoFocus aria-label="Fechar conversa com a Cici" onClick={() => definirAbertura(false)}>
            <X size={22} aria-hidden="true" />
          </button>
        </header>
        <div className="cici-janela-conteudo">{children}</div>
      </dialog>
    </>
  );
}

export function BotaoConversa({ onClick, children }) {
  return <button type="button" className="cici-acao-principal" onClick={onClick}>
    <MessageCircle size={17} aria-hidden="true" /> {children}
  </button>;
}
