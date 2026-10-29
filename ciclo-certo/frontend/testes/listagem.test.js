import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { build } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Renderiza os componentes reais com respostas prontas no lugar do hook de rede.
// Uma lista vazia não exercita a formatação de pontos dos cartões.
const resultado = await build({
  entryPoints: [new URL("../src/operacao/Listagem.jsx", import.meta.url).pathname.replace(/^\/(\w:)/, "$1")],
  bundle: true,
  write: false,
  platform: "node",
  format: "cjs",
  external: ["react", "react-dom"],
  loader: { ".css": "empty" },
  define: { "import.meta.env.VITE_API_URL": '"http://localhost"' },
  plugins: [{
    name: "respostas-de-teste",
    setup(builder) {
      builder.onLoad({ filter: /operacao[\\/]interface\.jsx$/ }, async ({ path }) => {
        const fonte = await readFile(path, "utf8");
        const inicio = fonte.indexOf("export function useDados(");
        const fim = fonte.indexOf("export function Estado(", inicio);
        return { loader: "jsx", contents: fonte.slice(0, inicio) + `
          export function useDados(caminho) {
            const coleta = {
              id: 1, dia: "2026-10-29", hora: "08:00", nome_morador: "Morador de Teste",
              endereco: "Rua de Teste, 123", materiais_informados: ["aluminio"],
              situacao: "coletada", pontos: 1148, pontos_previstos: 1148
            };
            return { dados: caminho.startsWith("/coletas") ? [coleta]
              : caminho.startsWith("/agenda") ? { dias: [] } : [], carregando: false };
          }
        ` + fonte.slice(fim) };
      });
    },
  }],
});
const modulo = { exports: {} };
new Function("require", "module", "exports", resultado.outputFiles[0].text)(
  createRequire(import.meta.url), modulo, modulo.exports,
);
const Listagem = modulo.exports.default;

for (const tipo of ["cooperativa", "morador"]) {
  test(`${tipo}: lista com coleta exibe horário, pontos e ação sem erro`, () => {
    const html = renderToStaticMarkup(React.createElement(Listagem, {
      perfil: { tipo }, selecionar() {}, revisao: 0,
    }));
    assert.match(html, /08:00/);
    assert.match(html, /1\.148/);
    assert.match(html, /Rua de Teste, 123/);
    assert.match(html, tipo === "cooperativa" ? /Abrir coleta/ : /Ver detalhes/);
  });
}
