// Este modulo concentra o fetch para que as telas usem a mesma comunicacao com a API.
const enderecoApi = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// Converte uma resposta HTTP em JSON ou em erro quando a API recusou a requisicao.
function tratarResposta(resposta) {
  return resposta.json().then((dados) => {
    if (!resposta.ok) throw new Error(dados.detail || "Não foi possível concluir a solicitação.");
    return dados;
  });
}

// Busca os perfis usados temporariamente no seletor sem senha.
export function listarUsuarios() { return fetch(`${enderecoApi}/usuarios`).then(tratarResposta); }

// Busca as coletas, montando apenas os filtros que a tela informou.
export function listarColetas(filtros = {}) {
  const consulta = new URLSearchParams();
  if (filtros.dia) consulta.set("dia", filtros.dia);
  if (filtros.moradorId) consulta.set("morador_id", filtros.moradorId);
  const sufixo = consulta.toString() ? `?${consulta.toString()}` : "";
  return fetch(`${enderecoApi}/coletas${sufixo}`).then(tratarResposta);
}

// Busca o contexto completo de uma coleta antes de ela ser pesada.
export function buscarColeta(coletaId) { return fetch(`${enderecoApi}/coletas/${coletaId}`).then(tratarResposta); }

// Envia o agendamento em JSON, como a API espera no POST de coleta.
export function criarColeta(dados) { return fetch(`${enderecoApi}/coletas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) }).then(tratarResposta); }

// Busca os itens pesados de uma coleta para explicar a origem dos pontos.
export function listarPesagens(coletaId) { return fetch(`${enderecoApi}/coletas/${coletaId}/pesagens`).then(tratarResposta); }

// Envia uma pesagem em JSON para que o back aplique a regra de pontos.
export function criarPesagem(coletaId, dados) { return fetch(`${enderecoApi}/coletas/${coletaId}/pesagens`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(dados) }).then(tratarResposta); }
