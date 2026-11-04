import React, { useEffect, useState } from "react";
import { solicitar } from "./api";

// O token fica no fragmento e é retirado da barra sem trafegar no Referer.
export default function Recuperar({ voltar }) {
  const [token] = useState(
    () => new URLSearchParams(location.hash.slice(1)).get("token") || "",
  );
  useEffect(() => {
    if (token) history.replaceState(null, "", location.pathname);
  }, [token]);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function enviar(e) {
    e.preventDefault();
    setErro("");
    if (token && senha !== confirmar) {
      setErro("As senhas precisam ser iguais.");
      return;
    }
    setOcupado(true);
    try {
      const r = await solicitar(
        token ? "/acesso/redefinir" : "/acesso/recuperar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(token ? { token, senha } : { email }),
        },
        false,
      );
      setMensagem(r.mensagem);
      setSenha("");
      setConfirmar("");
    } catch (e) {
      setErro(e.message);
    } finally {
      setOcupado(false);
    }
  }
  return (
    <div className="ws acesso">
      <main className="cc-recuperar ws-card">
        <span className="ws-kicker">Ciclo Certo · Acesso à conta</span>
        <h1>{token ? "Crie uma nova senha" : "Esqueceu sua senha?"}</h1>
        <p>
          {token
            ? "Escolha uma senha com pelo menos oito caracteres."
            : "Informe seu e-mail e enviaremos um link para você recuperar o acesso."}
        </p>
        {mensagem ? (
          <p role="status" className="cc-sucesso">
            {mensagem}
          </p>
        ) : (
          <form onSubmit={enviar}>
            {token ? (
              <>
                <label className="ws-field">
                  Nova senha
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </label>
                <label className="ws-field">
                  Repita a nova senha
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={72}
                    required
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <label className="ws-field">
                E-mail cadastrado
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={100}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            )}
            {erro && (
              <p role="alert" className="aviso erro">
                {erro}
              </p>
            )}
            <button className="ws-btn ws-btn-block" disabled={ocupado}>
              {ocupado
                ? "Aguarde…"
                : token
                  ? "Salvar nova senha"
                  : "Enviar link de recuperação"}
            </button>
          </form>
        )}
        <button className="ws-back" onClick={voltar}>
          Voltar para entrar
        </button>
      </main>
    </div>
  );
}
