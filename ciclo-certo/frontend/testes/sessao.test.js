import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { build } from "esbuild";

// Cada contexto representa uma aba. Rede simulada: nenhuma conta real é usada.
const { outputFiles } = await build({
  stdin: {
    contents: 'export * from "./src/sessao.js"; export * from "./src/api.js";',
    resolveDir: process.cwd(),
  },
  bundle: true, write: false, format: "iife", globalName: "app",
  define: { "import.meta.env.VITE_API_URL": '"https://api.example.org"' },
});
const fonte = outputFiles[0].text;
function armazenamento() {
  const dados = new Map();
  return { getItem: (k) => dados.get(k) ?? null,
    setItem: (k, v) => dados.set(k, v), removeItem: (k) => dados.delete(k) };
}
const legado = armazenamento();
legado.setItem("token", "sessao-antiga-compartilhada");
const resposta = (status = 200) => ({ status, ok: status === 200,
  json: async () => status === 200 ? {} : { detail: "Sessão expirada" } });
function aba(caminho, storage = armazenamento()) {
  const requisicoes = [], eventos = [];
  const contexto = vm.createContext({
    sessionStorage: storage, localStorage: legado, Event, URLSearchParams,
    window: { location: { pathname: caminho }, dispatchEvent: (e) => eventos.push(e.type) },
    fetch: async (url, opcoes) => { requisicoes.push(opcoes); return resposta(); },
  });
  vm.runInContext(fonte, contexto);
  return { app: contexto.app, contexto, storage, requisicoes, eventos };
}

test("morador e cooperador enviam seus próprios tokens simultaneamente", async () => {
  const morador = aba("/login"), cooperador = aba("/cooperador");
  assert.equal(morador.app.obterToken(), null); // Não herda a sessão antiga.
  morador.app.salvarToken("token-morador");
  cooperador.app.salvarToken("token-cooperador");
  await Promise.all([morador.app.buscarUsuarioAtual(), cooperador.app.buscarUsuarioAtual()]);
  assert.equal(morador.requisicoes[0].headers.Authorization, "Bearer token-morador");
  assert.equal(cooperador.requisicoes[0].headers.Authorization, "Bearer token-cooperador");
  cooperador.app.removerToken();
  assert.equal(morador.app.obterToken(), "token-morador");
});

test("recarga preserva a sessão e trocar de link não reutiliza o outro perfil", () => {
  const morador = aba("/login");
  morador.app.salvarToken("morador");
  assert.equal(aba("/login", morador.storage).app.obterToken(), "morador");
  const cooperador = aba("/cooperador/", morador.storage);
  assert.equal(cooperador.app.obterToken(), null);
  cooperador.app.salvarToken("cooperador");
  assert.equal(aba("/login", morador.storage).app.obterToken(), "morador");
});

test("401 encerra só a sessão da aba recusada", async () => {
  const morador = aba("/login"), cooperador = aba("/cooperador");
  morador.app.salvarToken("morador");
  cooperador.app.salvarToken("cooperador");
  cooperador.contexto.fetch = async () => resposta(401);
  await assert.rejects(cooperador.app.buscarUsuarioAtual(), /expirada/);
  assert.equal(cooperador.app.obterToken(), null);
  assert.equal(morador.app.obterToken(), "morador");
  assert.deepEqual(cooperador.eventos, ["ciclo-certo-sessao-expirada"]);
  assert.deepEqual(morador.eventos, []);
});

test("resposta 401 atrasada não encerra um login mais recente", async () => {
  const pagina = aba("/cooperador");
  pagina.app.salvarToken("antigo");
  let concluir;
  pagina.contexto.fetch = () => new Promise((resolve) => { concluir = resolve; });
  const requisicao = pagina.app.buscarUsuarioAtual();
  pagina.app.salvarToken("novo");
  concluir(resposta(401));
  await assert.rejects(requisicao, /expirada/);
  assert.equal(pagina.app.obterToken(), "novo");
  assert.deepEqual(pagina.eventos, []);
});
