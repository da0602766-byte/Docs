// O aplicativo autentica a pessoa antes de apresentar as quatro telas da cartilha.
import React, { useEffect, useState } from "react";
import { buscarColeta, criarColeta, criarPesagem, listarColetas, listarPesagens, buscarUsuarioAtual, entrar, cadastrarUsuario } from "./api";

// Mostra os botões certos sem disponibilizar tarefas da cooperativa para a moradora.
function Cabecalho({ perfil, tela, aoMudarTela }) {
  const itens = perfil?.tipo === "morador" ? [["agendar", "Agendar coleta"], ["minhas", "Minhas coletas"]] : [["rota", "A rota"], ["balanca", "A balança"]];
  return <header className="cabecalho"><div className="marca"><span className="marca-simbolo" aria-hidden="true"><span>↻</span></span><div><p className="sobretitulo">Cooperativa de recicláveis</p><h1>Ciclo Certo</h1></div></div>{perfil && <nav aria-label="Navegação principal">{itens.map(([codigo, rotulo]) => <button aria-current={tela === codigo ? "page" : undefined} className={tela === codigo ? "aba ativa" : "aba"} key={codigo} onClick={() => aoMudarTela(codigo)} type="button">{rotulo}</button>)}</nav>}</header>;
}

// A pessoa entra ou cria a própria conta; os campos começam vazios, sem credenciais fictícias.
function Login({ aoEntrar, aviso }) {
  const [cadastro, setCadastro] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState("morador");
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // O cadastro é confirmado antes do login; só o token fica no localStorage.
  function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setMensagem("");
    const preparacao = cadastro ? cadastrarUsuario({ nome, email, senha, tipo }) : Promise.resolve();
    preparacao.then(() => entrar(email, senha))
      .then((dados) => { localStorage.setItem("token", dados.access_token); setSenha(""); aoEntrar(dados.access_token); })
      .catch((falha) => setMensagem(falha.message))
      .finally(() => setEnviando(false));
  }

  // A troca de formulário não conserva a senha digitada no modo anterior.
  function alternar() {
    setCadastro(!cadastro);
    setMensagem("");
    setSenha("");
  }

  return <main className="pagina pagina-acesso"><Cabecalho /><section className="painel painel-acesso">
    <p className="sobretitulo">Moradores e cooperativa</p>
    <h2>{cadastro ? "Criar sua conta" : "Entrar no Ciclo Certo"}</h2>
    <p>{cadastro ? "Informe seus dados para começar." : "Acompanhe suas coletas e os pontos de cada entrega."}</p>
    <form onSubmit={enviar}>
      {cadastro && <label>Nome<input autoComplete="name" minLength={2} maxLength={80} required value={nome} onChange={(evento) => setNome(evento.target.value)} /></label>}
      <label>E-mail<input type="email" autoComplete="username" maxLength={100} required value={email} onChange={(evento) => setEmail(evento.target.value)} /></label>
      <label>Senha<input type="password" autoComplete={cadastro ? "new-password" : "current-password"} minLength={cadastro ? 8 : undefined} maxLength={cadastro ? 72 : undefined} required value={senha} onChange={(evento) => setSenha(evento.target.value)} />{cadastro && <span className="ajuda-campo">Use de 8 a 72 caracteres.</span>}</label>
      {cadastro && <label>Perfil<select value={tipo} onChange={(evento) => setTipo(evento.target.value)}><option value="morador">Morador</option><option value="cooperativa">Cooperativa</option></select></label>}
      <button disabled={enviando} type="submit">{enviando ? "Aguarde..." : cadastro ? "Criar conta e entrar" : "Entrar"}</button>
    </form>
    {(mensagem || aviso) && <p className="aviso erro" role="alert">{mensagem || aviso}</p>}
    <button className="secundario alternar-acesso" disabled={enviando} type="button" onClick={alternar}>{cadastro ? "Já tenho uma conta" : "Quero criar uma conta"}</button>
  </section></main>;
}

// Exibe o formulario de Joana e envia apenas o que foi informado no agendamento.
function AgendarColeta({ morador, aoConcluir }) {
  const [endereco, setEndereco] = useState("");
  const [dia, setDia] = useState("");
  const [materiais, setMateriais] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  // Faz o POST e mostra a falha ou a confirmacao sem esconder a resposta da API.
  function enviarAgendamento(evento) {
    evento.preventDefault();
    setEnviando(true); setErro(""); setMensagem("");
    const listaMateriais = materiais.split(",").map((item) => item.trim()).filter(Boolean);
    criarColeta({ endereco, dia, materiais_informados: listaMateriais })
      .then((coleta) => { setMensagem(`Coleta agendada para ${formatarDia(coleta.dia)}.`); setEndereco(""); setDia(""); setMateriais(""); aoConcluir(); })
      .catch((falha) => setErro(falha.message))
      .finally(() => setEnviando(false));
  }

  return <section className="painel formulario formulario-morador"><p className="sobretitulo">Para {morador.nome}</p><h2>Agendar coleta</h2><p>Preencha os três campos para combinar a retirada dos recicláveis.</p><form onSubmit={enviarAgendamento}><label>Endereço<input autoComplete="street-address" minLength="10" onChange={(evento) => setEndereco(evento.target.value)} placeholder="Rua, número e bairro" required value={endereco} /></label><label>Dia da coleta<input onChange={(evento) => setDia(evento.target.value)} required type="date" value={dia} /></label><label>O que você separou<textarea minLength="2" onChange={(evento) => setMateriais(evento.target.value)} placeholder="Ex.: papel, vidro e metal" required value={materiais} /><span className="ajuda-campo">Separe os materiais por vírgula. Os pontos aparecem após a pesagem.</span></label><button disabled={enviando} type="submit">{enviando ? "Agendando..." : "Confirmar agendamento"}</button></form>{erro && <p className="aviso erro" role="alert">{erro}</p>}{mensagem && <p className="aviso sucesso" role="status">{mensagem}</p>}</section>;
}

// Mostra os pontos da forma certa: antes da pesagem, o estado explica por que ainda e zero.
function textoPontos(coleta) { return coleta.situacao === "agendada" ? "Aguardando pesagem" : `${coleta.pontos.toFixed(2)} pontos`; }

// Apresenta a data recebida da API no formato familiar para Joana e Osmar.
function formatarDia(dia) {
  const [ano, mes, numero] = dia.split("-");
  return `${numero}/${mes}/${ano}`;
}

// Este componente do frontend reúne expectativa, pesagens e pontos de uma coleta.
function DetalheColeta({ coleta }) {
  const [pesagens, setPesagens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  // A repetição desta consulta recupera somente o detalhe que falhou.
  useEffect(() => {
    setCarregando(true);
    setErro("");
    listarPesagens(coleta.id)
      .then(setPesagens)
      .catch((falha) => setErro(falha.message))
      .finally(() => setCarregando(false));
  }, [coleta.id, tentativa]);

  return <div className="detalhe-coleta"><div className="detalhe-coluna"><span className="rotulo-detalhe">Informado no agendamento</span><p>{coleta.materiais_informados.join(", ")}</p></div><div className="detalhe-coluna"><span className="rotulo-detalhe">Pesagens registradas</span>{carregando && <p className="estado carregando">Carregando pesagens...</p>}{erro && <div className="erro-com-acao" role="alert"><p>{erro}</p><button className="secundario" onClick={() => setTentativa((valor) => valor + 1)} type="button">Tentar novamente</button></div>}{!carregando && !erro && (pesagens.length === 0 ? <p>Ainda não há pesagens. Os pontos aparecerão depois.</p> : <ul className="pesagens">{pesagens.map((pesagem) => <li key={pesagem.id}><span>{pesagem.material} · {pesagem.quilos} kg</span><strong>{pesagem.pontos.toFixed(2)} pontos</strong></li>)}</ul>)}</div><div className="detalhe-total"><span>Total da coleta</span><strong>{coleta.pontos.toFixed(2)} pontos</strong></div></div>;
}

// A tela da moradora consulta somente suas coletas e permite tentar de novo se a lista falhar.
function MinhasColetas({ morador, atualizacao }) {
  const [coletas, setColetas] = useState([]);
  const [coletaAberta, setColetaAberta] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  // O token permite ao backend filtrar as coletas da pessoa autenticada.
  useEffect(() => {
    setCarregando(true);
    setErro("");
    listarColetas()
      .then(setColetas)
      .catch((falha) => setErro(falha.message))
      .finally(() => setCarregando(false));
  }, [morador.id, atualizacao, tentativa]);

  if (carregando) return <p className="estado carregando">Carregando suas coletas...</p>;
  if (erro) return <div className="erro-com-acao" role="alert"><p>{erro}</p><button onClick={() => setTentativa((valor) => valor + 1)} type="button">Tentar novamente</button></div>;
  return <section className="painel painel-morador"><p className="sobretitulo">Para {morador.nome}</p><h2>Minhas coletas</h2><p>Veja a situação de cada retirada e de onde vieram seus pontos.</p>{coletas.length === 0 ? <div className="vazio"><strong>Você ainda não tem coletas.</strong><span>Abra “Agendar coleta” para fazer a primeira.</span></div> : <div className="lista-coletas">{coletas.map((coleta) => <article className={coletaAberta === coleta.id ? "cartao-coleta expandido" : "cartao-coleta"} key={coleta.id}><div><strong>{formatarDia(coleta.dia)}</strong><span className={`situacao ${coleta.situacao}`}>{coleta.situacao}</span></div><p>{coleta.endereco}</p><p className="pontos">{textoPontos(coleta)}</p><button aria-expanded={coletaAberta === coleta.id} className="secundario" onClick={() => setColetaAberta(coletaAberta === coleta.id ? null : coleta.id)} type="button">{coletaAberta === coleta.id ? "Fechar detalhes" : "Ver pesagens e pontos"}</button>{coletaAberta === coleta.id && <DetalheColeta coleta={coleta} />}</article>)}</div>}</section>;
}

// Devolve o dia local no formato entendido pelo filtro e pelo campo HTML.
function dataDeHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Filtra as coletas por dia e envia a coleta clicada para a tela da balanca.
function Rota({ aoSelecionarColeta, atualizacao }) {
  const [dia, setDia] = useState(dataDeHoje());
  const [coletas, setColetas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  // Recarrega a rota quando Osmar troca o dia ou repete uma consulta com erro.
  useEffect(() => { setCarregando(true); setErro(""); listarColetas({ dia }).then(setColetas).catch((falha) => setErro(falha.message)).finally(() => setCarregando(false)); }, [dia, atualizacao, tentativa]);

  return <section className="painel painel-operador"><div className="cabecalho-painel"><div><p className="sobretitulo">Área da cooperativa</p><h2>A rota</h2><p>Consulte as coletas do dia e abra a balança direto pela lista.</p></div><div className="controles-dia"><button className="secundario botao-hoje" onClick={() => setDia(dataDeHoje())} type="button">Hoje</button><label className="filtro">Escolher dia<input onChange={(evento) => setDia(evento.target.value)} type="date" value={dia} /></label></div></div>{carregando && <p className="estado carregando">Carregando a rota...</p>}{erro && <div className="erro-com-acao" role="alert"><p>{erro}</p><button onClick={() => setTentativa((valor) => valor + 1)} type="button">Tentar novamente</button></div>}{!carregando && !erro && <><div className="resumo-rota" aria-label="Resumo das coletas do dia"><div><span>Coletas do dia</span><strong>{coletas.length}</strong></div><div><span>Agendadas</span><strong>{coletas.filter((coleta) => coleta.situacao === "agendada").length}</strong></div><div><span>Coletadas</span><strong>{coletas.filter((coleta) => coleta.situacao === "coletada").length}</strong></div></div>{coletas.length === 0 ? <div className="vazio"><strong>Nenhuma coleta neste dia.</strong><span>Escolha outra data para consultar a rota.</span></div> : <div className="tabela-container"><table><thead><tr><th>Morador</th><th>Endereço</th><th>Situação</th><th>Pontos</th><th>Ação</th></tr></thead><tbody>{coletas.map((coleta) => <tr key={coleta.id}><td><strong>{coleta.nome_morador}</strong></td><td>{coleta.endereco}</td><td><span className={`situacao ${coleta.situacao}`}>{coleta.situacao}</span></td><td className="celula-pontos">{coleta.pontos.toFixed(2)}</td><td><button className="secundario acao-tabela" onClick={() => aoSelecionarColeta(coleta)} type="button">Abrir balança</button></td></tr>)}</tbody></table></div>}</>}</section>;
}

// Registra a leitura sem permitir que uma pesagem seja criada sem coleta selecionada.
function Balanca({ coletaSelecionada, aoVoltar, aoAtualizar }) {
  const [coleta, setColeta] = useState(null);
  const [material, setMaterial] = useState("papel");
  const [quilos, setQuilos] = useState("");
  const [carregando, setCarregando] = useState(Boolean(coletaSelecionada));
  const [enviando, setEnviando] = useState(false);
  const [atualizandoTotal, setAtualizandoTotal] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmacao, setConfirmacao] = useState(null);
  const [tentativa, setTentativa] = useState(0);

  // Atualiza o contexto da coleta selecionada e permite repetir uma consulta com erro.
  useEffect(() => { if (!coletaSelecionada) return; setColeta(null); setCarregando(true); setErro(""); buscarColeta(coletaSelecionada.id).then(setColeta).catch((falha) => setErro(falha.message)).finally(() => setCarregando(false)); }, [coletaSelecionada, tentativa]);

  // O POST registra a pesagem; o GET seguinte traz o total calculado pelo backend.
  function registrarPesagem(evento) {
    evento.preventDefault(); setEnviando(true); setErro(""); setConfirmacao(null);
    let pesagemRegistrada = false;
    criarPesagem(coleta.id, { material, quilos: Number(quilos) })
      .then((pesagem) => { pesagemRegistrada = true; setConfirmacao({ pesagem, total: null }); setQuilos(""); return buscarColeta(coleta.id); })
      .then((dados) => { setColeta(dados); setConfirmacao((anterior) => ({ ...anterior, total: dados.pontos })); aoAtualizar(); })
      .catch((falha) => setErro(pesagemRegistrada ? "Pesagem registrada. O total não foi atualizado na tela; tente carregar novamente." : falha.message))
      .finally(() => setEnviando(false));
  }

  // Repete apenas a leitura do total, sem reenviar a pesagem já registrada.
  function atualizarTotal() {
    setAtualizandoTotal(true);
    setErro("");
    buscarColeta(coleta.id)
      .then((dados) => { setColeta(dados); setConfirmacao((anterior) => ({ ...anterior, total: dados.pontos })); aoAtualizar(); })
      .catch((falha) => setErro(falha.message))
      .finally(() => setAtualizandoTotal(false));
  }

  if (!coletaSelecionada) return <section className="painel painel-operador balanca-vazia"><p className="sobretitulo">Área da cooperativa</p><h2>A balança</h2><p>Selecione uma coleta na rota para registrar a pesagem.</p><button onClick={aoVoltar} type="button">Ir para A rota</button></section>;
  if (carregando) return <p className="estado carregando">Carregando a coleta...</p>;
  if (erro && !coleta) return <div className="erro-com-acao" role="alert"><p>{erro}</p><button onClick={() => setTentativa((valor) => valor + 1)} type="button">Tentar novamente</button></div>;
  return <section className="painel painel-operador balanca-operador"><div className="cabecalho-painel"><div><p className="sobretitulo">Área da cooperativa</p><h2>A balança</h2><p>Confira a coleta antes de lançar o peso do material.</p></div><button className="secundario botao-voltar" onClick={aoVoltar} type="button">Voltar à rota</button></div><div className="grade-balanca"><aside className="contexto-coleta"><span className="sobretitulo">Coleta selecionada</span><strong>{coleta.nome_morador}</strong><span>{coleta.endereco}</span><span>Dia: {formatarDia(coleta.dia)}</span><span>Situação: {coleta.situacao}</span><div className="total-coleta"><span>Total da coleta</span><strong>{coleta.pontos.toFixed(2)} pontos</strong></div></aside><div className="area-pesagem"><h3>Nova pesagem</h3><form onSubmit={registrarPesagem}><label>Material<select onChange={(evento) => setMaterial(evento.target.value)} value={material}><option value="papel">Papel</option><option value="vidro">Vidro</option><option value="plástico">Plástico</option><option value="metal">Metal</option></select></label><label>Quilos<input min="0.01" onChange={(evento) => setQuilos(evento.target.value)} placeholder="Ex.: 2,5" required step="0.01" type="number" value={quilos} /></label><button disabled={enviando || (confirmacao && confirmacao.total === null)} type="submit">{enviando ? "Registrando..." : "Registrar pesagem"}</button></form>{erro && <p className="aviso erro" role="alert">{erro}</p>}{confirmacao && <div className="confirmacao-pesagem" role="status"><strong>Pesagem registrada</strong><span>{confirmacao.pesagem.material} · {confirmacao.pesagem.quilos} kg</span><span>Esta pesagem: {confirmacao.pesagem.pontos.toFixed(2)} pontos</span><span>Novo total da coleta: {confirmacao.total === null ? "Aguardando atualização" : `${confirmacao.total.toFixed(2)} pontos`}</span>{confirmacao.total === null && !enviando && <button className="secundario" disabled={atualizandoTotal} onClick={atualizarTotal} type="button">{atualizandoTotal ? "Atualizando..." : "Tentar novamente"}</button>}</div>}</div></div></section>;
}

// O token identifica a sessão; a API confirma o perfil antes de liberar qualquer tela.
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [perfil, setPerfil] = useState(null);
  const [tela, setTela] = useState("");
  const [coletaSelecionada, setColetaSelecionada] = useState(null);
  const [atualizacao, setAtualizacao] = useState(0);
  const [carregando, setCarregando] = useState(Boolean(token));
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [tentativa, setTentativa] = useState(0);

  // Uma resposta antiga não pode preencher o perfil depois que a sessão mudou.
  useEffect(() => {
    let ativa = true;
    if (!token) { setPerfil(null); setCarregando(false); return () => { ativa = false; }; }
    setCarregando(true);
    setErro("");
    buscarUsuarioAtual()
      .then((usuario) => { if (ativa) { setPerfil(usuario); setTela(usuario.tipo === "morador" ? "agendar" : "rota"); } })
      .catch((falha) => { if (ativa) setErro(falha.message); })
      .finally(() => { if (ativa) setCarregando(false); });
    return () => { ativa = false; };
  }, [token, tentativa]);

  // A API dispara este evento quando uma sessão foi recusada por expiração ou token inválido.
  useEffect(() => {
    function encerrarSessao() {
      setToken(null); setPerfil(null); setColetaSelecionada(null); setErro("");
      setAviso("Sua sessão expirou. Entre novamente.");
    }
    window.addEventListener("ciclo-certo-sessao-expirada", encerrarSessao);
    return () => window.removeEventListener("ciclo-certo-sessao-expirada", encerrarSessao);
  }, []);

  // A saída remove somente o token; a senha nunca foi persistida.
  function sair() {
    localStorage.removeItem("token");
    setToken(null); setPerfil(null); setColetaSelecionada(null); setErro(""); setAviso("");
  }

  // Cada novo login recomeça o contexto para não reutilizar uma coleta da sessão anterior.
  function receberToken(novoToken) {
    setPerfil(null); setColetaSelecionada(null); setErro(""); setAviso(""); setToken(novoToken);
  }

  // Mantém o contexto da coleta ao navegar da rota para a balança.
  function selecionarColeta(coleta) {
    setColetaSelecionada(coleta); setTela("balanca");
  }

  // As quatro telas existentes continuam organizadas pelo perfil confirmado no backend.
  function conteudoPrincipal() {
    if (perfil.tipo === "morador") {
      return tela === "minhas"
        ? <MinhasColetas atualizacao={atualizacao} morador={perfil} />
        : <AgendarColeta aoConcluir={() => setAtualizacao((valor) => valor + 1)} morador={perfil} />;
    }
    if (tela === "rota") return <Rota aoSelecionarColeta={selecionarColeta} atualizacao={atualizacao} />;
    return <Balanca aoAtualizar={() => setAtualizacao((valor) => valor + 1)} aoVoltar={() => setTela("rota")} coletaSelecionada={coletaSelecionada} />;
  }

  if (!token) return <Login aoEntrar={receberToken} aviso={aviso} />;
  if (carregando) return <main className="pagina pagina-centralizada"><p className="estado carregando">Carregando seu perfil...</p></main>;
  if (erro || !perfil) return <main className="pagina pagina-centralizada"><div className="erro-com-acao" role="alert"><p>{erro || "Não foi possível carregar seu perfil."}</p><button onClick={() => setTentativa((valor) => valor + 1)} type="button">Tentar novamente</button><button className="secundario" onClick={sair} type="button">Voltar ao login</button></div></main>;
  return <main className={`pagina ${perfil.tipo === "cooperativa" ? "pagina-operador" : "pagina-morador"}`}>
    <Cabecalho aoMudarTela={setTela} perfil={perfil} tela={tela} />
    <section className="barra-perfil barra-sessao" aria-label="Usuário conectado"><p className="saudacao">{perfil.tipo === "cooperativa" ? "Área de trabalho de" : "Olá,"} <strong>{perfil.nome}</strong></p><button className="secundario" type="button" onClick={sair}>Sair</button></section>
    <div className="conteudo-principal" key={perfil.id}>{conteudoPrincipal()}</div>
    <footer>Feito para aproximar moradores e a cooperativa do bairro.</footer>
  </main>;
}
