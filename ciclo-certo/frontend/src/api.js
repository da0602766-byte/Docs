// Centraliza a comunicação e envia a identidade pelo token, nunca por um seletor de perfil.
// A publicação nunca usa o computador do visitante como servidor da aplicação.
const ambienteLocal = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
const enderecoApi = (import.meta.env.VITE_API_URL || (ambienteLocal ? "http://127.0.0.1:8000" : "")).replace(/\/$/, "");
export const acessoDisponivel = Boolean(enderecoApi);

// A API pode devolver validações em lista; a interface apresenta uma mensagem legível.
function tratarResposta(resposta, protegida, tokenEnviado) {
  if (protegida && resposta.status === 401 && localStorage.getItem("token") === tokenEnviado) {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("ciclo-certo-sessao-expirada"));
  }
  return resposta.json().then((dados) => {
    if (!resposta.ok) {
      const mensagem = Array.isArray(dados.detail)
        ? "Confira os campos: " + dados.detail.map((erro) => erro.loc.at(-1)).join(", ") + "."
        : dados.detail;
      throw new Error(mensagem || "Não foi possível concluir a solicitação.");
    }
    return dados;
  });
}

// Cada chamada usa o token atual e uma resposta antiga não encerra uma sessão mais recente.
function solicitar(caminho, opcoes = {}, protegida = true) {
  if (!acessoDisponivel) return Promise.reject(new Error("O acesso às contas ainda não está disponível nesta versão online."));
  const token = localStorage.getItem("token");
  const headers = { ...opcoes.headers };
  if (protegida && token) headers.Authorization = "Bearer " + token;
  return fetch(enderecoApi + caminho, { ...opcoes, headers })
    .then((resposta) => tratarResposta(resposta, protegida, token));
}

// O login OAuth2 recebe formulário; a senha não fica salva no navegador.
export function entrar(email, senha) {
  return solicitar("/login", { method: "POST", body: new URLSearchParams({ username: email, password: senha }) }, false);
}

// O cadastro usa somente os dados que a própria pessoa informou.
export function cadastrarUsuario(dados) {
  return solicitar("/usuarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) }, false);
}

// O perfil da tela é confirmado pela API a partir do token.
export function buscarUsuarioAtual() {
  return solicitar("/usuarios/eu");
}

// O morador recebe suas coletas; dia e morador são filtros opcionais da cooperativa.
export function listarColetas(filtros = {}) {
  const consulta = new URLSearchParams();
  if (filtros.dia) consulta.set("dia", filtros.dia);
  if (filtros.moradorId) consulta.set("morador_id", filtros.moradorId);
  return solicitar("/coletas" + (consulta.size ? "?" + consulta.toString() : ""));
}

// O backend verifica o dono antes de apresentar o detalhe.
export function buscarColeta(coletaId) {
  return solicitar("/coletas/" + coletaId);
}

// A requisição de agendamento não precisa identificar o usuário no corpo.
export function criarColeta(dados) {
  return solicitar("/coletas", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
}

// O mesmo token protege o histórico da coleta.
export function listarPesagens(coletaId) {
  return solicitar("/coletas/" + coletaId + "/pesagens");
}

// A API permite somente à cooperativa registrar o peso.
export function criarPesagem(coletaId, dados) {
  return solicitar("/coletas/" + coletaId + "/pesagens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) });
}
