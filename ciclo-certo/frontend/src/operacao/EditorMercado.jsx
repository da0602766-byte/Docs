import React, { useState } from "react";
import { enviar } from "../api";
import { useDados, Estado, Modal, numero } from "./interface";

const fotos = [
  "ecobag",
  "horta",
  "caderno",
  "garrafa",
  "feira",
  "compostagem",
  "lanche",
  "estojo",
];
const inicial = {
  nome: "",
  descricao: "",
  categoria: "Casa",
  pontos: 100,
  estoque: 1,
  foto: "/imagens/produtos/ecobag.jpg",
  ativo: true,
};
export default function EditorMercado() {
  const [revisao, setRevisao] = useState(0),
    recurso = useDados("/gestao/produtos", revisao);
  const [item, setItem] = useState(null),
    [erro, setErro] = useState(""),
    [ocupado, setOcupado] = useState(false);
  function campo(k, v) {
    setItem((p) => ({ ...p, [k]: v }));
  }
  async function salvar(e) {
    e.preventDefault();
    setOcupado(true);
    setErro("");
    try {
      const { id, ...dados } = item;
      await enviar(
        "/gestao/produtos" + (id ? "/" + id : ""),
        {
          ...dados,
          pontos: Number(dados.pontos),
          estoque: Number(dados.estoque),
        },
        id ? "PUT" : "POST",
      );
      setItem(null);
      setRevisao((n) => n + 1);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <div className="cc-linha">
        <p>
          Atualize o catálogo, o preço em pontos e o estoque. As trocas
          anteriores são preservadas.
        </p>
        <button
          className="ws-btn"
          onClick={() => {
            setErro("");
            setItem({ ...inicial });
          }}
        >
          Novo produto
        </button>
      </div>
      <Estado recurso={recurso} />
      <div className="cc-catalogo-editor">
        {recurso.dados?.map((p) => (
          <article key={p.id}>
            <img src={p.foto} alt={p.nome} />
            <div>
              <strong>{p.nome}</strong>
              <small>
                {p.categoria} · {p.ativo ? "Na loja" : "Oculto"}
              </small>
            </div>
            <span>
              {numero(p.pontos)} pts<small>{p.estoque} em estoque</small>
            </span>
            <button
              className="ws-btn ws-btn-ghost"
              onClick={() => {
                setErro("");
                setItem({ ...p });
              }}
            >
              Editar
            </button>
          </article>
        ))}
      </div>
      {item && (
        <Modal
          titulo={item.id ? "Editar recompensa" : "Nova recompensa"}
          fechar={() => !ocupado && setItem(null)}
        >
          <form className="cc-editor-form" onSubmit={salvar}>
            <label className="ws-field">
              Nome
              <input
                required
                minLength={2}
                maxLength={100}
                value={item.nome}
                onChange={(e) => campo("nome", e.target.value)}
              />
            </label>
            <label className="ws-field">
              Descrição
              <textarea
                required
                minLength={5}
                maxLength={500}
                value={item.descricao}
                onChange={(e) => campo("descricao", e.target.value)}
              />
            </label>
            <div className="cc-filtros">
              <label className="ws-field">
                Categoria
                <input
                  required
                  value={item.categoria}
                  maxLength={40}
                  onChange={(e) => campo("categoria", e.target.value)}
                />
              </label>
              <label className="ws-field">
                Preço em pontos
                <input
                  type="number"
                  required
                  min={1}
                  max={2000000000}
                  value={item.pontos}
                  onChange={(e) => campo("pontos", e.target.value)}
                />
              </label>
              <label className="ws-field">
                Estoque
                <input
                  type="number"
                  required
                  min={0}
                  max={1000000}
                  value={item.estoque}
                  onChange={(e) => campo("estoque", e.target.value)}
                />
              </label>
            </div>
            <label className="ws-field">
              Foto ilustrativa
              <select
                value={item.foto}
                onChange={(e) => campo("foto", e.target.value)}
              >
                {fotos.map((f) => (
                  <option key={f} value={"/imagens/produtos/" + f + ".jpg"}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
            <img
              className="cc-editor-preview"
              src={item.foto}
              alt="Prévia da recompensa"
            />
            <label className="cc-consentimento">
              <input
                type="checkbox"
                checked={item.ativo}
                onChange={(e) => campo("ativo", e.target.checked)}
              />
              Disponível na loja
            </label>
            {erro && (
              <p role="alert" className="aviso erro">
                {erro}
              </p>
            )}
            <button className="ws-btn" disabled={ocupado}>
              {ocupado ? "Salvando…" : "Salvar produto"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
