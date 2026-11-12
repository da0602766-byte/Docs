import { useEffect, useState } from "react";
import { solicitar } from "./api";

export default function ConfirmarEmail() {
  const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get("token"));
  const acesso = new URLSearchParams(location.search).get("acesso") === "cooperador" ? "/cooperador" : "/login";
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }, []);

  // A confirmação só acontece após o clique, inclusive se o provedor abrir o link para inspecioná-lo.
  async function confirmar() {
    setOcupado(true);
    setErro("");
    try {
      const dados = await solicitar("/usuarios/confirmar-email", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }),
      }, false);
      setMensagem(dados.mensagem);
    } catch (falha) {
      setErro(falha.status === 422 ? "Link inválido, expirado ou já usado. Peça outro no seu perfil." : falha.message);
    } finally {
      setOcupado(false);
    }
  }

  return <div className="ws acesso">
    <main className="cc-recuperar ws-card">
      <h1>Confirme seu e-mail</h1>
      {mensagem ? <p role="status" className="cc-sucesso">{mensagem}</p> : token ? (
        <>
          <p>Confirme este endereço para vincular seu e-mail à sua conta no Ciclo Certo.</p>
          {erro && <p role="alert" className="aviso erro">{erro}</p>}
          <button type="button" className="ws-btn ws-btn-block" disabled={ocupado} onClick={confirmar}>
            {ocupado ? "Confirmando…" : "Confirmar e-mail"}
          </button>
        </>
      ) : <p>Abra o link enviado à sua caixa de entrada ou solicite outro no seu perfil.</p>}
      <a className="ws-btn ws-btn-ghost" href={acesso}>Acessar minha conta</a>
    </main>
  </div>;
}
