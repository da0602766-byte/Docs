// O aplicativo autentica a pessoa antes de apresentar as quatro telas da cartilha.
import React, { useEffect, useState } from "react";
import PaginaInicial from "./PaginaInicial";
import { Icone, Navegacao } from "./visual";
import Operacao from "./Operacao";
import { buscarUsuarioAtual, entrar, cadastrarUsuario } from "./api";
import { obterToken, salvarToken, removerToken } from "./sessao";

// A pessoa entra ou cria a própria conta; os campos começam vazios, sem credenciais fictícias.
function Login({ aoEntrar, aviso, tipo, aoLimparAviso }) {
  const [cadastro, setCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  // O endereço define o cadastro; a API continua responsável pelas permissões.
  const cooperador = tipo === "cooperativa";
  const podeCadastrar = !cooperador || import.meta.env.DEV;
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // O cadastro é confirmado antes do login; a sessão pertence à aba e ao perfil.
  function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setMensagem("");
    aoLimparAviso();
    const preparacao = cadastro
      ? cadastrarUsuario({ nome, email, senha, tipo })
      : Promise.resolve();
    preparacao
      .then(() => entrar(email, senha))
      .then((dados) => {
        salvarToken(dados.access_token);
        setSenha("");
        aoEntrar(dados.access_token);
      })
      .catch((falha) => setMensagem(falha.message))
      .finally(() => setEnviando(false));
  }

  // A troca de formulário não conserva a senha digitada no modo anterior.
  function alternar() {
    setCadastro(!cadastro);
    setMensagem("");
    setSenha("");
    aoLimparAviso();
  }

  return (
    <div className="ws acesso">
      <header className="ws-header">
        <div className="ws-container ws-header-inner">
          <span className="ws-logo">
            <span className="ws-logo-mark">
              <Icone name="leaf" />
            </span>
            Ciclo Certo
          </span>
          <a className="ws-back acesso-voltar" href="/">
            <Icone name="back" size={16} />
            Página inicial
          </a>
        </div>
      </header>
      <main className="ws-container grade-acesso">
        <section className="apresentacao-acesso">
          <p className="ws-kicker">
            {cooperador
              ? "Quem cuida de cada novo ciclo"
              : "Cada material tem um novo começo"}
          </p>
          <h1>
            {cooperador ? (
              <>
                Sua equipe.
                <br /> Um novo ciclo.
              </>
            ) : (
              <>
                Uma coleta.
                <br /> Um novo ciclo.
              </>
            )}
          </h1>
          <p>
            {cooperador
              ? "Organize a rota do dia, registre as pesagens e acompanhe os pontos de cada coleta."
              : "Agende a retirada dos seus recicláveis e acompanhe cada pesagem, com os pontos sempre à vista."}
          </p>
          <img
            src="/imagens/reciclaveis.jpg"
            alt="Materiais separados para reciclagem"
          />
          <div className="acesso-legenda">
            <Icone name="leaf" />
            Moradores e cooperativa, juntos pelo bairro.
          </div>
        </section>
        <section className="ws-card painel-acesso">
          <p className="ws-kicker">
            {cooperador ? "Área do cooperador" : "Área do morador"}
          </p>
          <h2>
            {cadastro
              ? cooperador
                ? "Criar conta de cooperador"
                : "Criar sua conta"
              : cooperador
                ? "Acesso do cooperador"
                : "Que bom ter você aqui."}
          </h2>
          <p className="ws-sub">
            {cadastro
              ? cooperador
                ? "Cadastre seus dados para atuar na cooperativa."
                : "Preencha seus dados para começar como morador."
              : cooperador
                ? "Entre com sua conta da cooperativa."
                : "Entre com sua conta de morador para acessar suas coletas."}
          </p>
          <form onSubmit={enviar}>
            {cadastro && (
              <label className="ws-field">
                <span className="ws-label">Nome</span>
                <input
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                  value={nome}
                  onChange={(evento) => setNome(evento.target.value)}
                />
              </label>
            )}
            <label className="ws-field">
              <span className="ws-label">E-mail</span>
              <input
                type="email"
                autoComplete="username"
                maxLength={100}
                required
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="seu@email.com"
              />
            </label>
            <label className="ws-field">
              <span className="ws-label">Senha</span>
              <input
                type="password"
                autoComplete={cadastro ? "new-password" : "current-password"}
                minLength={cadastro ? 8 : undefined}
                maxLength={cadastro ? 72 : undefined}
                required
                value={senha}
                onChange={(evento) => setSenha(evento.target.value)}
              />
              {cadastro && (
                <span className="ws-help">Use de 8 a 72 caracteres.</span>
              )}
            </label>
            <button
              className="ws-btn ws-btn-block"
              disabled={enviando}
              type="submit"
            >
              {enviando
                ? "Aguarde..."
                : cadastro
                  ? "Criar conta e entrar"
                  : "Entrar"}
              <Icone name="arrow" size={18} />
            </button>
          </form>
          {(mensagem || aviso) && (
            <p className="aviso erro" role="alert">
              {mensagem || aviso}
            </p>
          )}
          {podeCadastrar ? (
            <div className="alternar-acesso">
              <span>
                {cadastro
                  ? "Já faz parte do Ciclo Certo?"
                  : "Ainda não tem conta?"}
              </span>
              <button disabled={enviando} type="button" onClick={alternar}>
                {cadastro ? "Entrar na minha conta" : "Criar minha conta"}
              </button>
            </div>
          ) : (
            <p className="ws-help">
              Para obter acesso à cooperativa, fale com a administração.
            </p>
          )}
          <p className="ws-help">
            <a href={cooperador ? "/login" : "/cooperador"}>
              {cooperador
                ? "Sou morador · acessar minha conta"
                : "Sou cooperador · acessar a cooperativa"}
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}

// O token identifica a sessão; a API confirma o perfil antes de liberar qualquer tela.
export default function App() {
  const tipoAcesso =
    window.location.pathname.replace(/\/+$/, "") === "/cooperador"
      ? "cooperativa"
      : "morador";
  const [token, setToken] = useState(obterToken);
  const [perfil, setPerfil] = useState(null);
  const [tela, setTela] = useState("");
  const [paginaInicial, setPaginaInicial] = useState(
    !token && window.location.pathname === "/",
  );
  const [atualizacao, setAtualizacao] = useState(0);
  const [carregando, setCarregando] = useState(Boolean(token));
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [tentativa, setTentativa] = useState(0);

  // Uma resposta antiga não pode preencher o perfil depois que a sessão mudou.
  useEffect(() => {
    let ativa = true;
    if (!token) {
      setPerfil(null);
      setCarregando(false);
      return () => {
        ativa = false;
      };
    }
    setCarregando(true);
    setErro("");
    buscarUsuarioAtual()
      .then((usuario) => {
        if (!ativa) return;
        // Uma conta do outro perfil deve usar seu próprio endereço de acesso.
        if (usuario.tipo !== tipoAcesso) {
          removerToken();
          setToken(null);
          setPerfil(null);
          setPaginaInicial(false);
          setAviso(
            tipoAcesso === "cooperativa"
              ? "Este acesso é exclusivo para cooperadores. Se você é morador, use o acesso do morador abaixo."
              : "Este acesso é exclusivo para moradores. Se você é cooperador, use o acesso da cooperativa abaixo.",
          );
          return;
        }
        setPerfil(usuario);
        setTela(usuario.tipo === "morador" ? "minhas" : "rota");
      })
      .catch((falha) => {
        if (ativa) setErro(falha.message);
      })
      .finally(() => {
        if (ativa) setCarregando(false);
      });
    return () => {
      ativa = false;
    };
  }, [token, tentativa, tipoAcesso]);

  // A API dispara este evento quando uma sessão foi recusada por expiração ou token inválido.
  useEffect(() => {
    function encerrarSessao() {
      setToken(null);
      setPerfil(null);
      setErro("");
      setPaginaInicial(false);
      setAviso("Sua sessão expirou. Entre novamente.");
    }
    window.addEventListener("ciclo-certo-sessao-expirada", encerrarSessao);
    return () =>
      window.removeEventListener("ciclo-certo-sessao-expirada", encerrarSessao);
  }, []);

  // A saída remove somente o token; a senha nunca foi persistida.
  function sair() {
    removerToken();
    setPaginaInicial(false);
    setToken(null);
    setPerfil(null);
    setErro("");
    setAviso("");
  }

  // Cada novo login recomeça o contexto para não reutilizar uma coleta da sessão anterior.
  function receberToken(novoToken) {
    setCarregando(true);
    setPerfil(null);
    setErro("");
    setAviso("");
    setToken(novoToken);
  }

  // A operacao integra agenda, coleta, carteira e perfil.
  function conteudoPrincipal() {
    return (
      <Operacao perfil={perfil} tela={tela} mudarTela={setTela} sair={sair} />
    );
  }

  if (!token && paginaInicial) return <PaginaInicial />;
  if (!token)
    return (
      <Login
        aoEntrar={receberToken}
        aviso={aviso}
        tipo={tipoAcesso}
        aoLimparAviso={() => setAviso("")}
      />
    );
  if (carregando)
    return (
      <main className="ws pagina-centralizada">
        <p className="estado carregando">Carregando seu perfil...</p>
      </main>
    );
  if (erro || !perfil)
    return (
      <main className="ws pagina-centralizada">
        <div className="erro-com-acao" role="alert">
          <p>{erro || "Não foi possível carregar seu perfil."}</p>
          <button
            className="ws-btn"
            onClick={() => setTentativa((valor) => valor + 1)}
            type="button"
          >
            Tentar novamente
          </button>
          <button className="ws-btn ws-btn-ghost" onClick={sair} type="button">
            Voltar ao login
          </button>
        </div>
      </main>
    );
  return (
    <div className="ws">
      <Navegacao
        perfil={perfil}
        tela={tela}
        aoMudarTela={(destino) => {
          setTela(destino);
          window.scrollTo(0, 0);
        }}
        aoSair={sair}
      />
      <main id="conteudo" className="ws-container ws-main" key={perfil.id}>
        {conteudoPrincipal()}
      </main>
      <footer className="rodape-app">
        Ciclo Certo · Cada material tem um novo começo.
      </footer>
    </div>
  );
}
