// Integração local: recusa, fila offline, silêncio e isolamento de notificações com conta descartável.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const navegador = await chromium.launch({
    channel: "msedge",
    headless: true,
  });
  const pagina = await navegador.newPage({
    viewport: { width: 390, height: 844 },
  });
  const erros = [];
  pagina.on("pageerror", (e) => erros.push(e.message));
  await pagina.addInitScript(() => {
    window.notasComunidade = 0;
    const iniciar = OscillatorNode.prototype.start;
    OscillatorNode.prototype.start = function (...args) {
      window.notasComunidade++;
      return iniciar.apply(this, args);
    };
  });
  try {
    await pagina.goto("http://127.0.0.1:5175/cooperador");
    await pagina
      .getByLabel("E-mail", { exact: true })
      .fill("moderador-comunidade@example.org");
    await pagina.getByLabel("Senha", { exact: true }).fill("TesteLocal123!");
    await pagina.getByRole("button", { name: "Entrar", exact: true }).click();
    await pagina
      .getByRole("button", { name: "Comunidade", exact: true })
      .filter({ visible: true })
      .click();
    await pagina
      .getByRole("button", { name: /O que vamos cultivar hoje/ })
      .click();
    await pagina
      .getByLabel("Sua publicação", { exact: true })
      .fill(
        "Publicação local do cooperador para testar a resposta da moderação.",
      );
    await pagina
      .getByLabel("Categoria obrigatória", { exact: true })
      .selectOption("Sugestões");
    await pagina.getByRole("button", { name: "Publicar", exact: true }).click();
    await pagina.getByText("Sua ideia ganhou raízes!").waitFor();
    await pagina.getByRole("button", { name: "Fechar notificação" }).click();
    // A indisponibilidade temporária da consulta não perde o aviso criado na transação.
    await pagina.route("**/comunidade/notificacoes", (rota) =>
      rota.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Offline de teste" }),
      }),
    );
    await pagina
      .getByRole("button", { name: "Aprovações", exact: true })
      .click();
    await pagina.getByRole("button", { name: "Rejeitar", exact: true }).click();
    await pagina
      .getByLabel("Motivo para o autor")
      .fill("Explique como esta sugestão ajuda a comunidade a reciclar.");
    await pagina
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await pagina.getByText("Alteração salva.", { exact: true }).waitFor();
    await pagina.getByRole("button", { name: "Fechar notificação" }).click();
    await pagina
      .getByRole("button", { name: "Perfil", exact: true })
      .filter({ visible: true })
      .click();
    await pagina.unroute("**/comunidade/notificacoes");
    await pagina.evaluate(() => window.dispatchEvent(new Event("focus")));
    await pagina
      .getByText("Sua publicação precisa de atenção", { exact: true })
      .waitFor();
    await pagina
      .locator(".com-notificacao")
      .getByText(/Explique como esta sugestão/)
      .waitFor();
    assert.equal(await pagina.evaluate(() => window.notasComunidade), 4);
    assert.equal(
      await pagina.locator(".com-folhas").count(),
      0,
      "Recusa recebe aviso, sem celebrar aprovação",
    );
    await pagina.screenshot({
      path: "resultados-visuais/comunidade/aviso-recusada.png",
    });
    await pagina.getByRole("button", { name: "Fechar notificação" }).click();
    await pagina.reload();
    await pagina
      .getByRole("button", { name: "Comunidade", exact: true })
      .filter({ visible: true })
      .click();
    await pagina.locator(".com-exemplo").first().waitFor();
    await pagina.waitForTimeout(400);
    assert.equal(
      await pagina.locator(".com-notificacao").count(),
      0,
      "Aviso lido não reaparece na recarga",
    );
    const espacamento = await pagina
      .locator(".com-exemplo")
      .first()
      .evaluate((e) => getComputedStyle(e).marginBottom);
    assert.equal(espacamento, "14px");
    assert.ok(
      await pagina.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(erros, []);
    console.log(
      "Recusa no perfil cooperador: aviso recuperado após falha, motivo, som, leitura persistida, espaçamento e celular aprovados.",
    );
  } finally {
    await navegador.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
