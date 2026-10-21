import React from "react";

// Ícones locais do ZIP; não carregam bibliotecas ou serviços externos.
export function Icone({ name, size = 20, className = "" }) {
  const paths = {
    leaf: <><path d="M19.5 4.5C13 4.6 6.8 6.2 5.2 11.4c-1 3.2 1.2 6.2 4.4 6.1 5.8-.2 8-6.7 9.9-13Z" /><path d="M4.2 20c2.4-5 6-8.2 11.1-10.2" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    scale: <path d="M12 4v17M6 21h12M5 7h14M5 7l-3 6h6L5 7ZM19 7l-3 6h6l-3-6Z" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    x: <path d="M6 6l12 12M18 6 6 18" />,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
  };
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 24 24" width={size} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" className={className}>
      {paths[name]}
    </svg>
  );
}


// A tabela apenas informa a regra; os pontos oficiais continuam vindo da API.
export const materiaisDaCartilha = [["papel", "Papel", 1], ["vidro", "Vidro", 1], ["plástico", "Plástico", 2], ["metal", "Metal", 4]];

export function TabelaPontos() {
  return <aside className="ws-card ws-rates"><h2>Quanto vale cada quilo</h2><ul>{materiaisDaCartilha.map(([codigo, nome, pontos]) => <li key={codigo}><span>{nome}</span><strong>{pontos} {pontos === 1 ? "ponto" : "pontos"}</strong></li>)}</ul><p>Somente as pesagens registradas pela cooperativa geram pontos.</p></aside>;
}

export function Situacao({ valor }) {
  return <span className={`ws-tag ${valor === "coletada" ? "ws-tag-done" : ""}`}>{valor === "coletada" ? "Coletada" : "Agendada"}</span>;
}

// A navegação depende exclusivamente do perfil confirmado pelo backend.
export function Navegacao({ perfil, tela, aoMudarTela, aoSair }) {
  const itens = perfil.tipo === "morador" ? [["minhas", "Minhas coletas", "box"], ["agendar", "Agendar coleta", "calendar"]] : [["rota", "Rota do dia", "truck"], ["balanca", "Balança", "scale"]];
  const iniciais = perfil.nome.trim().split(/\s+/).map((parte) => parte[0]).slice(0, 2).join("");
  return <><a className="pular-conteudo" href="#conteudo">Pular para o conteúdo</a><header className="ws-header"><div className="ws-container ws-header-inner"><div className="ws-brand"><span className="ws-logo"><span className="ws-logo-mark"><Icone name="leaf" size={18} /></span>Ciclo Certo</span><span className="ws-context">{perfil.tipo === "morador" ? "Minha área" : "Cooperativa"}</span></div><nav className="ws-tabs" aria-label="Navegação principal">{itens.map(([id, nome, icone]) => <button key={id} aria-current={tela === id ? "page" : undefined} onClick={() => aoMudarTela(id)}><Icone name={icone} size={18} />{nome}</button>)}</nav><div className="ws-user"><span className={`ws-avatar ${perfil.tipo === "cooperativa" ? "ws-avatar-dark" : ""}`} aria-hidden="true">{iniciais}</span><span className="ws-user-text"><strong>{perfil.nome}</strong><small>{perfil.tipo === "morador" ? "Morador" : "Cooperativa"}</small></span><button className="botao-sair" onClick={aoSair}>Sair</button></div></div></header><nav className="ws-bottom-nav" aria-label="Navegação no celular">{itens.map(([id, nome, icone]) => <button key={id} aria-current={tela === id ? "page" : undefined} onClick={() => aoMudarTela(id)}><Icone name={icone} />{nome}</button>)}</nav></>;
}
