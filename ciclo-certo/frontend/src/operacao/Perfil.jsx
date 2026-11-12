import React, { useState } from "react";
import { buscarUsuarioAtual, enviar } from "../api";
import { removerToken } from "../sessao";
import { Cabecalho } from "./interface";
import EnderecoColeta from "./EnderecoColeta";

export default function Perfil({ perfil, sair, aoAtualizarPerfil }) {
  const [email, setEmail] = useState(perfil.email || "");
  const [senha, setSenha] = useState("");
  const [nova, setNova] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [emailVerificado, setEmailVerificado] = useState(perfil.email_verificado);
  const [enviandoLink, setEnviandoLink] = useState(false);
  const [mensagemLink, setMensagemLink] = useState("");
  const [endereco, setEndereco] = useState(perfil.endereco_coleta || "");
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [retornoEndereco, setRetornoEndereco] = useState(null);

  async function salvarEndereco(evento) {
    evento.preventDefault();
    setSalvandoEndereco(true);
    setRetornoEndereco(null);
    try {
      const atualizado = await enviar("/usuarios/eu/endereco-coleta",
        { endereco_coleta: endereco.trim() || null }, "PUT");
      aoAtualizarPerfil(atualizado);
      setRetornoEndereco({ texto: "Endereço de retirada atualizado." });
    } catch (falha) {
      setRetornoEndereco({ texto: falha.message, erro: true });
    } finally {
      setSalvandoEndereco(false);
    }
  }
  async function enviarLink() {
    setEnviandoLink(true);
    setMensagemLink("");
    try {
      const atual = await buscarUsuarioAtual();
      setEmailVerificado(atual.email_verificado);
      if (!atual.email_verificado) {
        const resposta = await enviar("/usuarios/eu/confirmacao-email");
        setMensagemLink(resposta.mensagem);
      }
    } catch (falha) {
      setMensagemLink(falha.message);
    } finally {
      setEnviandoLink(false);
    }
  }
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
      removerToken();
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
          {perfil.email && emailVerificado !== undefined && (
            <div className="cc-confirmacao-email">
              <p className="ws-help">{emailVerificado ? "E-mail confirmado" : "E-mail aguardando confirmação"} · {perfil.email}</p>
              {!emailVerificado && <button type="button" className="ws-btn ws-btn-ghost" disabled={enviandoLink} onClick={enviarLink}>
                {enviandoLink ? "Aguarde…" : "Enviar link de confirmação"}
              </button>}
              {mensagemLink && <p role="status" className="ws-help">{mensagemLink}</p>}
            </div>
          )}
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
      {perfil.tipo === "morador" && !concluido && (
        <form className="ws-card cc-form cc-perfil" onSubmit={salvarEndereco}>
          <h2>Endereço de retirada</h2>
          <EnderecoColeta endereco={endereco} mudar={setEndereco} obrigatorio={false} />
          {retornoEndereco && <p role={retornoEndereco.erro ? "alert" : "status"}>{retornoEndereco.texto}</p>}
          <button className="ws-btn" disabled={salvandoEndereco}>Salvar endereço</button>
        </form>
      )}
    </>
  );
}
