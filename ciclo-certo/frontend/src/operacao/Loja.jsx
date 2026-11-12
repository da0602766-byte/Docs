import React, { useRef, useState } from "react";
import { enviar } from "../api";
import { useDados, Estado, Cabecalho, Modal, numero, data } from "./interface";
import EnderecoColeta from "./EnderecoColeta";
import "./checkout.css";

// A confirmação conserva a chave em falhas de rede; preço e saldo vêm do servidor.
export default function Loja({ aoTrocar, enderecoPreferido = "" }) {
  const [revisao, setRevisao] = useState(0);
  const recurso = useDados("/mercado", revisao);
  const extrato = useDados("/carteira", revisao);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [escolha, setEscolha] = useState(null);
  const [endereco, setEndereco] = useState("");
  const [dia, setDia] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const enviando = useRef(false);
  const datasEntrega = recurso.dados?.datas_entrega || [];
  async function trocar(evento) {
    evento.preventDefault();
    if (enviando.current || !datasEntrega.includes(dia)) return;
    enviando.current = true;
    setOcupado(true);
    setErro("");
    try {
      const pedido = await enviar("/mercado/resgates", {
        produto_id: escolha.produto.id,
        chave: escolha.chave,
        endereco_entrega: endereco.trim(),
        data_entrega: dia,
      });
      setSucesso(`Troca nº ${pedido.id} confirmada: ${pedido.nome}.`);
      setEscolha(null);
      setRevisao((n) => n + 1);
      aoTrocar?.();
    } catch (e) {
      setErro(e.message);
      setRevisao((n) => n + 1);
    } finally {
      enviando.current = false;
      setOcupado(false);
    }
  }
  const produtos = recurso.dados?.produtos || [];
  const saldo = recurso.dados?.pontos || 0;
  const filtrados = produtos.filter(
    (p) =>
      (categoria === "Todas" || categoria === p.categoria) &&
      `${p.nome} ${p.descricao}`
        .toLocaleLowerCase("pt-BR")
        .includes(busca.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <Cabecalho
        titulo="Seu cuidado vira recompensa"
        texto="Use seus pontos em produtos e descontos da nossa loja de demonstração."
      />
      <section className="cc-saldo">
        <div>
          <small>SEU SALDO DISPONÍVEL</small>
          <strong>
            {numero(saldo)} <span>pontos</span>
          </strong>
        </div>
        <p>
          Recicle. Avalie sua coleta.
          <br />
          Escolha seu próximo benefício.
        </p>
      </section>
      <p className="ws-help">
        Produtos e cupons fictícios para demonstração. As trocas não geram
        entrega ou desconto real.
      </p>
      <Estado recurso={recurso} />
      {sucesso && (
        <p className="cc-sucesso" role="status">
          {sucesso}
        </p>
      )}
      <div className="cc-filtros">
        <label className="ws-field">
          Buscar recompensa
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="O que você procura?"
          />
        </label>
        <label className="ws-field">
          Categoria
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          >
            {["Todas", ...new Set(produtos.map((p) => p.categoria))].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </label>
      </div>
      <div className="cc-produtos">
        {filtrados.map((p) => (
          <article className="cc-produto" key={p.id}>
            <img
              className="cc-produto-foto"
              src={p.foto}
              alt={p.nome + " — foto ilustrativa"}
              loading="lazy"
              width="600"
              height="400"
            />
            <div className="cc-produto-corpo">
              <small>{p.categoria} · Demonstração</small>
              <h2>{p.nome}</h2>
              <p>{p.descricao}</p>
              <strong>{numero(p.pontos)} pontos</strong>
              <small>
                {p.estoque ? `${p.estoque} disponíveis` : "Estoque esgotado"}
              </small>
              <button
                className="ws-btn"
                disabled={!p.estoque || saldo < p.pontos}
                onClick={() => {
                  setErro("");
                  setEndereco(enderecoPreferido || "");
                  setDia("");
                  setEscolha({ produto: p, chave: crypto.randomUUID() });
                }}
              >
                {!p.estoque
                  ? "Esgotado"
                  : saldo < p.pontos
                    ? `Faltam ${numero(p.pontos - saldo)} pontos`
                    : "Trocar pontos"}
              </button>
            </div>
          </article>
        ))}
      </div>
      {recurso.dados && !filtrados.length && (
        <p className="cc-vazio">
          Nenhuma recompensa encontrada. Experimente outra busca.
        </p>
      )}
      <section className="ws-card cc-historico">
        <h2>Minhas trocas</h2>
        {recurso.dados?.pedidos.length === 0 && (
          <p>Suas recompensas aparecerão aqui após a primeira troca.</p>
        )}
        {recurso.dados?.pedidos.map((p) => (
          <div className="cc-linha" key={p.id}>
            <span>
              #{p.id} · {p.nome}
              <small className="ws-cell-sub">
                {new Date(p.criado_em).toLocaleString("pt-BR")}
              </small>
              {p.data_entrega && <small className="ws-cell-sub">
                Entrega simulada em {data(p.data_entrega)} · {p.endereco_entrega}
              </small>}
            </span>
            <strong>−{numero(p.pontos)} pts</strong>
          </div>
        ))}
      </section>
      <details className="ws-card cc-historico">
        <summary>Extrato de pontos</summary>
        <Estado recurso={extrato} />
        {extrato.dados?.movimentos.map((m) => (
          <p key={m.id}>
            {new Date(m.criado_em).toLocaleDateString("pt-BR")} ·{" "}
            {m.pontos >= 0 ? "Crédito" : "Troca"} · {numero(m.pontos)} pontos
          </p>
        ))}
      </details>
      {escolha && (
        <Modal
          titulo="Finalizar troca"
          className="cc-checkout"
          fechar={() => !ocupado && setEscolha(null)}
        >
          <form className="cc-checkout-form" onSubmit={trocar}>
            <div className="cc-checkout-item">
              <img src={escolha.produto.foto} alt="" width="72" height="60" />
              <div><strong>{escolha.produto.nome}</strong><span>1 unidade</span></div>
              <strong>{numero(escolha.produto.pontos)} pts</strong>
            </div>
            <fieldset disabled={ocupado}>
              <legend>Entrega</legend>
              <EnderecoColeta endereco={endereco} mudar={setEndereco} rotulo="Endereço de entrega" />
              <div className="ws-field">
                <label htmlFor="cc-checkout-data">Data de entrega</label>
                <select id="cc-checkout-data" required value={datasEntrega.includes(dia) ? dia : ""} onChange={(e) => setDia(e.target.value)}>
                  <option value="">Escolha uma data</option>
                  {datasEntrega.map((disponivel) => <option key={disponivel} value={disponivel}>
                    {new Date(disponivel + "T12:00:00").toLocaleDateString("pt-BR", { dateStyle: "full" })}
                  </option>)}
                </select>
              </div>
              {!datasEntrega.length && <p className="ws-help" role="status">Nenhuma data disponível no momento.</p>}
            </fieldset>
            <section className="cc-checkout-resumo" aria-label="Resumo da troca">
              <div><span>Total da troca</span><strong>{numero(escolha.produto.pontos)} pontos</strong></div>
              <div><span>Saldo após a troca</span><strong>{numero(saldo - escolha.produto.pontos)} pontos</strong></div>
            </section>
            <p className="ws-help">Troca e entrega simuladas.</p>
            {erro && <p role="alert" className="aviso erro">{erro}</p>}
            <button type="submit" className="ws-btn ws-btn-block"
              disabled={ocupado || !datasEntrega.includes(dia) || endereco.trim().length < 10}>
              {ocupado ? "Confirmando…" : "Confirmar troca"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
