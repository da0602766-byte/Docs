import React from "react";
import { Icone } from "../visual";
import "../equipamentos.css";

// Seleção controlada: só é persistida junto à confirmação explícita do responsável.
export default function KitEquipamentos({ itens, selecionados, mudar, recomendados = [], ocupado = false }) {
  const essenciais = ["balanca", "luvas", "sacos"];
  return <section className="cc-kit" aria-label="Preparação dos equipamentos">
    <div className="cc-kit-intro"><span className="cc-kit-marca"><Icone name="box" size={25} /></span><div><h3>O que vai com você?</h3><p>Monte o kit para esta coleta. Revise e ajuste os itens que pretende levar.</p></div></div>
    {recomendados.length > 0 && <p className="cc-kit-sugestao"><strong>Kit recomendado pela Cici</strong><br />{itens.filter((item) => recomendados.includes(item.codigo)).map((item) => item.nome).join(" · ")}</p>}
    <div className="cc-kit-atalhos">{recomendados.length > 0 && <button type="button" disabled={ocupado} onClick={() => mudar([...recomendados])}>Usar sugestão da Cici</button>}<button type="button" disabled={ocupado} onClick={() => mudar([...new Set([...selecionados, ...essenciais.filter(c => itens.some(i => i.codigo === c))])])}>+ Kit essencial</button><button type="button" disabled={ocupado || !selecionados.length} onClick={() => mudar([])}>Limpar seleção</button><span aria-live="polite">{selecionados.length} {selecionados.length === 1 ? "item selecionado" : "itens selecionados"}</span></div>
    {[...new Set(itens.map(i => i.grupo))].map(grupo => <fieldset key={grupo}><legend>{grupo}</legend><div className="cc-kit-grade">{itens.filter(i => i.grupo === grupo).map(item => <label key={item.codigo} className={`cc-kit-item ${selecionados.includes(item.codigo) ? "selecionado" : ""}`}><input type="checkbox" disabled={ocupado} checked={selecionados.includes(item.codigo)} onChange={e => mudar(e.target.checked ? [...selecionados, item.codigo] : selecionados.filter(c => c !== item.codigo))} /><Icone name={item.icone} /><span><strong>{item.nome}</strong><small>{item.detalhe}</small></span></label>)}</div></fieldset>)}
    <p className="cc-kit-nota">O kit registra seu planejamento; não reserva estoque nem substitui a conferência dos equipamentos.</p>
  </section>;
}
