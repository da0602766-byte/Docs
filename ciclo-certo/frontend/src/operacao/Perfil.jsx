import React, { useState } from "react";
import { enviar } from "../api";
import { Cabecalho } from "./interface";

export default function Perfil({ perfil, sair }) {
  const [email, setEmail] = useState(perfil.email || "");
  const [senha, setSenha] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  async function salvar(e) {
    e.preventDefault();
    setErro("");
    if (nova !== confirmar) {
      setErro("A confirmação da nova senha não confere.");
      return;
    }
    setOcupado(true);
    try {
      await enviar(
        "/usuarios/eu",
        { email, senha_atual: senha, ...(nova ? { nova_senha: nova } : {}) },
        "PATCH",
      );
      localStorage.removeItem("token");
      setSenha("");
      setNova("");
      setConfirmar("");
      setConcluido(true);
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <>
      <Cabecalho
        titulo="Meu perfil"
        texto="Atualize seu e-mail e sua senha com a confirmação da senha atual."
      />
      {concluido ? (
        <div className="ws-card cc-form" role="status">
          <p>Perfil atualizado. As sessões anteriores foram encerradas.</p>
          <button className="ws-btn" onClick={sair}>
            Entrar novamente
          </button>
        </div>
      ) : (
        <form className="ws-card cc-form cc-perfil" onSubmit={salvar}>
          <h2>{perfil.nome}</h2>
          <label className="ws-field">
            E-mail
            <input
              type="email"
              required
              maxLength={100}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>
          <label className="ws-field">
            Senha atual
            <input
              type="password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          <label className="ws-field">
            Nova senha (opcional)
            <input
              type="password"
              minLength={8}
              maxLength={72}
              value={nova}
              onChange={(e) => setNova(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <label className="ws-field">
            Repita a nova senha
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              autoComplete="new-password"
            />
          </label>
          <p className="ws-help">
            Após salvar, entre novamente. A senha deve ter de 8 a 72 caracteres.
          </p>
          {erro && (
            <p className="aviso erro" role="alert">
              {erro}
            </p>
          )}
          <button className="ws-btn" disabled={ocupado}>
            Salvar alterações
          </button>
        </form>
      )}
    </>
  );
}
