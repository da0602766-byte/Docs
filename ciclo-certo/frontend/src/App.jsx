// O aplicativo autentica a pessoa antes de apresentar as quatro telas da cartilha.
import React, { useEffect, useState } from "react";
import PaginaInicial from "./PaginaInicial";
import { Icone, TabelaPontos, Situacao, Navegacao, materiaisDaCartilha } from "./visual";
import { acessoDisponivel, buscarColeta, criarColeta, criarPesagem, listarColetas, listarPesagens, buscarUsuarioAtual, entrar, cadastrarUsuario } from "./api";

// A pessoa entra ou cria a própria conta; os campos começam vazios, sem credenciais fictícias.
function Login({ aoEntrar, aviso, aoVoltar }) {
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

  return <div className="ws acesso"><header className="ws-header"><div className="ws-container ws-header-inner"><span className="ws-logo"><span className="ws-logo-mark"><Icone name="leaf" /></span>Ciclo Certo</span><button className="ws-back acesso-voltar" onClick={aoVoltar}><Icone name="back" size={16} />Página inicial</button></div></header>
    <main className="ws-container grade-acesso"><section className="apresentacao-acesso"><p className="ws-kicker">Cada material tem um novo começo</p><h1>Uma coleta.<br /> Um novo ciclo.</h1><p>Agende a retirada dos seus recicláveis e acompanhe cada pesagem, com os pontos sempre à vista.</p><img src={import.meta.env.BASE_URL + "imagens/reciclaveis.jpg"} alt="Materiais separados para reciclagem" /><div className="acesso-legenda"><Icone name="leaf" />Moradores e cooperativa, juntos pelo bairro.</div></section>
    <section className="ws-card painel-acesso"><p className="ws-kicker">Sua área no Ciclo Certo</p><h2>{cadastro ? "Criar sua conta" : "Que bom ter você aqui."}</h2><p className="ws-sub">{cadastro ? "Preencha seus dados para começar." : "Entre para acessar suas coletas."}</p>
    {!acessoDisponivel && <p className="ws-muted-box aviso-acesso" role="status">O acesso às contas ainda não está disponível nesta versão online. Você pode conhecer o serviço na página inicial.</p>}
    <form onSubmit={enviar}><fieldset className="campos-acesso" disabled={!acessoDisponivel || enviando}>
      {cadastro && <label className="ws-field"><span className="ws-label">Nome</span><input autoComplete="name" minLength={2} maxLength={80} required value={nome} onChange={(evento) => setNome(evento.target.value)} /></label>}
      <label className="ws-field"><span className="ws-label">E-mail</span><input type="email" autoComplete="username" maxLength={100} required value={email} onChange={(evento) => setEmail(evento.target.value)} placeholder="seu@email.com" /></label>
      <label className="ws-field"><span className="ws-label">Senha</span><input type="password" autoComplete={cadastro ? "new-password" : "current-password"} minLength={cadastro ? 8 : undefined} maxLength={cadastro ? 72 : undefined} required value={senha} onChange={(evento) => setSenha(evento.target.value)} />{cadastro && <span className="ws-help">Use de 8 a 72 caracteres.</span>}</label>
      {cadastro && <label className="ws-field"><span className="ws-label">Perfil</span><select value={tipo} onChange={(evento) => setTipo(evento.target.value)}><option value="morador">Morador</option><option value="cooperativa">Cooperativa</option></select></label>}
      <button className="ws-btn ws-btn-block" disabled={enviando} type="submit">{enviando ? "Aguarde..." : cadastro ? "Criar conta e entrar" : "Entrar"}<Icone name="arrow" size={18} /></button>
    </fieldset></form>
    {(mensagem || aviso) && <p className="aviso erro" role="alert">{mensagem || aviso}</p>}
    <div className="alternar-acesso"><span>{cadastro ? "Já faz parte do Ciclo Certo?" : "Ainda não tem conta?"}</span><button disabled={enviando} type="button" onClick={alternar}>{cadastro ? "Entrar na minha conta" : "Criar minha conta"}</button></div>
  </section></main></div>;
}

// Exibe o formulario de Joana e envia apenas o que foi informado no agendamento.
function AgendarColeta({ morador, aoConcluir, aoVoltar }) {
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

  return <><button className="ws-back" onClick={aoVoltar}><Icone name="back" size={16} />Minhas coletas</button><div className="ws-page-head"><div><p className="ws-kicker">Nova coleta · {morador.nome}</p><h1>Agendar coleta</h1><p className="ws-sub">Três informações e pronto. Combine a retirada dos seus recicláveis.</p></div></div>
    <form className="ws-schedule" onSubmit={enviarAgendamento}><div className="ws-card ws-form">
      <fieldset><legend><span>1</span>Endereço da coleta</legend><label className="ws-field"><span className="ws-label">Onde a equipe deve buscar</span><span className="ws-input-icon"><Icone name="pin" size={18} /><input autoComplete="street-address" minLength={10} onChange={(evento) => setEndereco(evento.target.value)} placeholder="Rua, número e bairro" required value={endereco} /></span></label></fieldset>
      <fieldset><legend><span>2</span>Dia da coleta</legend><label className="ws-field"><span className="ws-label">Escolha a data</span><input onChange={(evento) => setDia(evento.target.value)} required type="date" value={dia} /></label></fieldset>
      <fieldset><legend><span>3</span>Materiais separados</legend><label className="ws-field"><span className="ws-label">O que você separou</span><textarea minLength={2} onChange={(evento) => setMateriais(evento.target.value)} placeholder="Ex.: papel, vidro, metal" required value={materiais} aria-describedby="ajuda-materiais" /><span id="ajuda-materiais" className="ws-help">Separe os materiais por vírgula. Informe tudo o que estará pronto no dia.</span></label></fieldset>
    </div><aside className="ws-card ws-summary" aria-label="Resumo do agendamento"><h2>Resumo</h2><dl><div><dt>Endereço</dt><dd>{endereco || "Ainda não informado"}</dd></div><div><dt>Dia</dt><dd>{dia ? formatarDia(dia) : "Escolha uma data"}</dd></div><div><dt>Materiais</dt><dd>{materiais || "Informe o que separou"}</dd></div></dl><p className="ws-summary-note">A coleta começa agendada, com zero pontos. Os pontos aparecem após a pesagem pela cooperativa.</p><button className="ws-btn ws-btn-block" disabled={enviando} type="submit">{enviando ? "Agendando..." : "Confirmar agendamento"}</button><button className="ws-btn ws-btn-ghost" onClick={aoVoltar} type="button">Voltar às coletas</button>{erro && <p className="aviso erro" role="alert">{erro}</p>}{mensagem && <p className="ws-notice" role="status">{mensagem}</p>}</aside></form></>;
}

// Mantém pontos pequenos visíveis, sem alterar o cálculo do backend.
function formatarPontos(valor) {
  return valor.toLocaleString("pt-BR", { maximumSignificantDigits: 15 });
}

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

  return <div className="detalhe-coleta"><p className="ws-pickup-address"><Icone name="pin" size={16} />{coleta.endereco}</p><p className="ws-help">Informado no agendamento: {coleta.materiais_informados.join(", ")}</p>
    {carregando && <p className="estado" role="status">Carregando pesagens...</p>}{erro && <div className="erro-com-acao" role="alert"><p>{erro}</p><button className="ws-btn ws-btn-ghost" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button></div>}
    {!carregando && !erro && (pesagens.length === 0 ? <p className="ws-muted-box">Ainda não há pesagens. Os pontos aparecerão depois.</p> : <table className="ws-receipt"><caption className="ws-sr">Pesagens da coleta {coleta.id}</caption><thead><tr><th scope="col">Material</th><th scope="col">Peso</th><th scope="col">Pontos</th></tr></thead><tbody>{pesagens.map((pesagem) => <tr key={pesagem.id}><td>{pesagem.material}</td><td>{formatarPontos(pesagem.quilos)} kg</td><td>{formatarPontos(pesagem.pontos)}</td></tr>)}</tbody></table>)}
    <div className="detalhe-total"><span>Total da coleta</span><strong>{formatarPontos(coleta.pontos)} pontos</strong></div></div>;
}

// A tela da moradora consulta somente suas coletas e permite tentar de novo se a lista falhar.
function MinhasColetas({ morador, atualizacao, aoAgendar }) {
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
  if (erro) return <div className="erro-com-acao" role="alert"><p>{erro}</p><button className="ws-btn" onClick={() => setTentativa((valor) => valor + 1)} type="button">Tentar novamente</button></div>;
  const agendadas = coletas.filter((coleta) => coleta.situacao === "agendada");
  const proxima = [...agendadas].sort((a, b) => a.dia.localeCompare(b.dia) || a.id - b.id)[0];
  // Os indicadores contam registros reais; cada total oficial permanece no detalhe da coleta.
  return <><div className="ws-page-head"><div><p className="ws-kicker">Minhas coletas</p><h1>Olá, {morador.nome.split(" ")[0]}.</h1><p className="ws-sub">Acompanhe cada retirada e veja de onde vieram seus pontos.</p></div><button className="ws-btn" onClick={aoAgendar}><Icone name="plus" size={18} />Agendar coleta</button></div>
    <dl className="ws-stats ws-stats-3"><div><dt>Coletas</dt><dd>{coletas.length}<small> no total</small></dd></div><div><dt>Agendadas</dt><dd>{agendadas.length}</dd></div><div><dt>Coletadas</dt><dd>{coletas.length - agendadas.length}</dd></div></dl>
    <div className="ws-resident-grid"><section className="ws-next"><div className="ws-next-top"><p className="ws-next-label">{proxima && proxima.dia < dataDeHoje() ? "Agendamento em aberto" : "Próxima coleta"}</p>{proxima && <span className="ws-next-id">nº {proxima.id}</span>}</div><strong>{proxima ? formatarDia(proxima.dia) : "Nada agendado"}</strong>{proxima ? <><p className="ws-next-address"><Icone name="pin" size={16} />{proxima.endereco}</p><div className="ws-next-chips">{proxima.materiais_informados.map((item, indice) => <span key={indice}>{item}</span>)}</div><ol className="ws-track"><li className="is-done">Agendada</li><li>Aguardando pesagem</li></ol></> : <><p className="ws-next-meta">Quando o material estiver separado, marque um dia.</p><button className="ws-btn ws-btn-light proxima-acao" onClick={aoAgendar}>Agendar coleta</button></>}</section>
    <section className="ws-history" aria-labelledby="historico"><div className="ws-section-head"><h2 id="historico">Histórico</h2><span>Abra uma coleta para ver a pesagem</span></div>{coletas.length === 0 ? <div className="ws-card ws-empty"><Icone name="box" size={28} /><strong>Você ainda não tem coletas.</strong><p>Agende a primeira para começar seu histórico.</p></div> : <ul className="ws-pickups">{[...coletas].sort((a,b) => b.dia.localeCompare(a.dia) || b.id-a.id).map((coleta) => <li className={`ws-pickup ${coletaAberta === coleta.id ? "is-open" : ""}`} key={coleta.id}><button className="ws-pickup-row" aria-expanded={coletaAberta === coleta.id} aria-controls={`coleta-${coleta.id}`} onClick={() => setColetaAberta(coletaAberta === coleta.id ? null : coleta.id)}><span className="ws-date"><strong>{coleta.dia.slice(8)}</strong><small>{new Date(coleta.dia + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })}</small></span><span className="ws-pickup-main"><span className="ws-pickup-title">Coleta nº {coleta.id}<Situacao valor={coleta.situacao} /></span><span className="ws-pickup-meta">{formatarDia(coleta.dia)} · {coleta.materiais_informados.join(", ")}</span></span><span className="ws-pickup-points">{coleta.situacao === "coletada" ? <><strong>{formatarPontos(coleta.pontos)}</strong><small>pontos</small></> : <small>Aguardando<br />pesagem</small>}</span><Icone name="chevron" className="ws-chevron" size={18} /></button>{coletaAberta === coleta.id && <div className="ws-pickup-panel" id={`coleta-${coleta.id}`}><DetalheColeta coleta={coleta} /></div>}</li>)}</ul>}</section><TabelaPontos /></div></>;
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

  return <><div className="ws-page-head"><div><p className="ws-kicker">Operação · Cooperativa</p><h1>Rota do dia</h1><p className="ws-sub">Consulte as coletas e abra a balança direto pela lista.</p></div><div className="controles-dia"><button className="ws-btn ws-btn-ghost" onClick={() => setDia(dataDeHoje())}>Hoje</button><label className="ws-field"><span className="ws-label">Escolher dia</span><input onChange={(evento) => { if (evento.target.value) setDia(evento.target.value); }} type="date" value={dia} /></label></div></div>
    {carregando && <p className="estado" role="status">Carregando a rota...</p>}{erro && <div className="erro-com-acao" role="alert"><p>{erro}</p><button className="ws-btn" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button></div>}
    {!carregando && !erro && <><dl className="ws-stats ws-stats-3"><div><dt>Coletas do dia</dt><dd>{coletas.length}</dd></div><div><dt>Agendadas</dt><dd>{coletas.filter((coleta) => coleta.situacao === "agendada").length}</dd></div><div><dt>Coletadas</dt><dd>{coletas.filter((coleta) => coleta.situacao === "coletada").length}</dd></div></dl>
    {coletas.length === 0 ? <div className="ws-card ws-empty"><Icone name="calendar" size={28} /><strong>Nenhuma coleta neste dia.</strong><p>Escolha outra data para consultar a rota.</p></div> : <section className="ws-card ws-route" aria-label="Coletas do dia"><table className="ws-table"><thead><tr><th scope="col">Coleta</th><th scope="col">Morador e endereço</th><th scope="col">Materiais informados</th><th scope="col">Situação</th><th scope="col" className="ws-num">Pontos</th><th scope="col">Ação</th></tr></thead><tbody>{coletas.map((coleta) => <tr key={coleta.id}><td><strong className="ws-order">#{coleta.id}</strong></td><td><strong>{coleta.nome_morador}</strong><span className="ws-cell-sub">{coleta.endereco}</span></td><td><div className="ws-chips">{coleta.materiais_informados.map((item, indice) => <span key={indice}>{item}</span>)}</div></td><td><Situacao valor={coleta.situacao} /></td><td className="ws-num">{formatarPontos(coleta.pontos)}</td><td className="ws-action-cell"><button className="ws-btn ws-btn-sm" onClick={() => aoSelecionarColeta(coleta)}>Abrir balança</button></td></tr>)}</tbody></table>
    <ul className="ws-route-cards">{coletas.map((coleta) => <li key={coleta.id}><div className="ws-route-card-top"><span className="ws-order">#{coleta.id}</span><strong>{coleta.nome_morador}</strong><Situacao valor={coleta.situacao} /></div><p className="ws-route-card-address"><Icone name="pin" size={15} />{coleta.endereco}</p><div className="ws-chips">{coleta.materiais_informados.map((item, indice) => <span key={indice}>{item}</span>)}</div><div className="ws-route-card-bottom"><span>{formatarPontos(coleta.pontos)} pontos</span><button className="ws-btn ws-btn-sm" onClick={() => aoSelecionarColeta(coleta)}>Abrir balança</button></div></li>)}</ul></section>}</>}
  </>;
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
    evento.preventDefault();
    // Confere positividade sem impor teto ou casas decimais ausentes da cartilha.
    if (!Number.isFinite(Number(quilos)) || Number(quilos) <= 0) {
      setErro("Informe um peso maior que zero.");
      return;
    }
    setEnviando(true); setErro(""); setConfirmacao(null);
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

  if (!coletaSelecionada) return <section className="ws-card ws-empty"><Icone name="scale" size={32} /><h1>Balança</h1><p>Selecione uma coleta na rota para registrar a pesagem.</p><button className="ws-btn" onClick={aoVoltar}>Ir para a rota</button></section>;
  if (carregando) return <p className="estado" role="status">Carregando a coleta...</p>;
  if (erro && !coleta) return <div className="erro-com-acao" role="alert"><p>{erro}</p><button className="ws-btn" onClick={() => setTentativa((valor) => valor + 1)}>Tentar novamente</button></div>;
  return <><button className="ws-back" onClick={aoVoltar}><Icone name="back" size={16} />Voltar à rota</button><div className="ws-page-head"><div><p className="ws-kicker">Galpão · Cooperativa</p><h1>Balança</h1><p className="ws-sub">Confira a coleta e registre cada material pesado.</p></div><span className="ws-muted-box">Coleta nº {coleta.id}</span></div>
    <div className="grade-balanca"><section className="ws-card ws-weigh"><h2>Nova pesagem</h2><p className="ws-help">Coleta nº {coleta.id} · {coleta.nome_morador}</p><form onSubmit={registrarPesagem}><fieldset className="campo-materiais"><legend className="ws-label">Material</legend><div className="ws-material-pick">{materiaisDaCartilha.map(([codigo, nome, pontos]) => <label key={codigo} className={material === codigo ? "is-on" : ""}><input type="radio" name="material" value={codigo} checked={material === codigo} onChange={() => setMaterial(codigo)} /><strong>{nome}</strong><small>{pontos} pt/kg</small></label>)}</div></fieldset><label className="ws-field"><span className="ws-label">Peso conferido na balança</span><span className="ws-kg"><input min="0" onChange={(evento) => setQuilos(evento.target.value)} placeholder="0,0" required step="any" type="number" value={quilos} /><span>kg</span></span></label><p className="ws-muted-box">Os pontos e o total serão confirmados após o registro.{coleta.situacao === "agendada" && " A primeira pesagem muda a situação para coletada."}</p><button className="ws-btn ws-btn-block ws-btn-lg" disabled={enviando || (confirmacao && confirmacao.total === null)} type="submit"><Icone name="plus" size={18} />{enviando ? "Registrando..." : "Registrar pesagem"}</button></form>
    {erro && <p className="aviso erro" role="alert">{erro}</p>}{confirmacao && <div className="confirmacao-pesagem" role="status"><strong><Icone name="check" size={18} /> Pesagem registrada</strong><span>{confirmacao.pesagem.material} · {formatarPontos(confirmacao.pesagem.quilos)} kg</span><span>Esta pesagem: {formatarPontos(confirmacao.pesagem.pontos)} pontos</span><span>Novo total da coleta: {confirmacao.total === null ? "Aguardando atualização" : `${formatarPontos(confirmacao.total)} pontos`}</span>{confirmacao.total === null && !enviando && <button className="ws-btn ws-btn-ghost" disabled={atualizandoTotal} onClick={atualizarTotal}>{atualizandoTotal ? "Atualizando..." : "Tentar novamente"}</button>}</div>}</section>
    <aside className="ws-card ws-detail"><div className="ws-detail-top"><span>Coleta nº {coleta.id}</span><Situacao valor={coleta.situacao} /></div><h2>{coleta.nome_morador}</h2><p className="ws-detail-address"><Icone name="calendar" size={15} />{formatarDia(coleta.dia)}</p><DetalheColeta key={`${coleta.id}-${confirmacao?.pesagem.id ?? 0}`} coleta={coleta} /></aside></div></>;
}

// O token identifica a sessão; a API confirma o perfil antes de liberar qualquer tela.
export default function App() {
  const [token, setToken] = useState(() => acessoDisponivel ? localStorage.getItem("token") : null);
  const [perfil, setPerfil] = useState(null);
  const [tela, setTela] = useState("");
  const [paginaInicial, setPaginaInicial] = useState(!token);
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
      .then((usuario) => { if (ativa) { setPerfil(usuario); setTela(usuario.tipo === "morador" ? "minhas" : "rota"); } })
      .catch((falha) => { if (ativa) setErro(falha.message); })
      .finally(() => { if (ativa) setCarregando(false); });
    return () => { ativa = false; };
  }, [token, tentativa]);

  // A API dispara este evento quando uma sessão foi recusada por expiração ou token inválido.
  useEffect(() => {
    function encerrarSessao() {
      setToken(null); setPerfil(null); setColetaSelecionada(null); setErro("");
      setPaginaInicial(false); setAviso("Sua sessão expirou. Entre novamente.");
    }
    window.addEventListener("ciclo-certo-sessao-expirada", encerrarSessao);
    return () => window.removeEventListener("ciclo-certo-sessao-expirada", encerrarSessao);
  }, []);

  // A saída remove somente o token; a senha nunca foi persistida.
  function sair() {
    localStorage.removeItem("token");
    setPaginaInicial(false);
    setToken(null); setPerfil(null); setColetaSelecionada(null); setErro(""); setAviso("");
  }

  // Cada novo login recomeça o contexto para não reutilizar uma coleta da sessão anterior.
  function receberToken(novoToken) {
    setCarregando(true); setPerfil(null); setColetaSelecionada(null); setErro(""); setAviso(""); setToken(novoToken);
  }

  // Mantém o contexto da coleta ao navegar da rota para a balança.
  function selecionarColeta(coleta) {
    setColetaSelecionada(coleta); setTela("balanca");
  }

  // As quatro telas existentes continuam organizadas pelo perfil confirmado no backend.
  function conteudoPrincipal() {
    if (perfil.tipo === "morador") {
      return tela === "minhas"
        ? <MinhasColetas atualizacao={atualizacao} morador={perfil} aoAgendar={() => setTela("agendar")} />
        : <AgendarColeta aoConcluir={() => setAtualizacao((valor) => valor + 1)} morador={perfil} aoVoltar={() => setTela("minhas")} />;
    }
    if (tela === "rota") return <Rota aoSelecionarColeta={selecionarColeta} atualizacao={atualizacao} />;
    return <Balanca aoAtualizar={() => setAtualizacao((valor) => valor + 1)} aoVoltar={() => setTela("rota")} coletaSelecionada={coletaSelecionada} />;
  }

  if (!token && paginaInicial) return <PaginaInicial onEnter={() => { setPaginaInicial(false); window.scrollTo(0, 0); }} />;
  if (!token) return <Login aoEntrar={receberToken} aviso={aviso} aoVoltar={() => { setPaginaInicial(true); window.scrollTo(0, 0); }} />;
  if (carregando) return <main className="ws pagina-centralizada"><p className="estado carregando">Carregando seu perfil...</p></main>;
  if (erro || !perfil) return <main className="ws pagina-centralizada"><div className="erro-com-acao" role="alert"><p>{erro || "Não foi possível carregar seu perfil."}</p><button className="ws-btn" onClick={() => setTentativa((valor) => valor + 1)} type="button">Tentar novamente</button><button className="ws-btn ws-btn-ghost" onClick={sair} type="button">Voltar ao login</button></div></main>;
  return <div className="ws"><Navegacao perfil={perfil} tela={tela} aoMudarTela={(destino) => { setTela(destino); window.scrollTo(0, 0); }} aoSair={sair} /><main id="conteudo" className="ws-container ws-main" key={perfil.id}>{conteudoPrincipal()}</main><footer className="rodape-app">Ciclo Certo · Cada material tem um novo começo.</footer></div>;
}
