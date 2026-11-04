// Interface com respostas controladas: cobre volume, concorrência e falhas sem conteúdo de teste em produção.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");

(async () => {
  const navegador = await chromium.launch({
    channel: "msedge",
    headless: true,
  });
  const pagina = await navegador.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
  });
  const erros = [];
  pagina.on("pageerror", (erro) => erros.push(erro.message));
  const chamadas = [];
  let falhar = true;
  let envios = 0;
  try {
    await pagina.route("**/comunidade/publicacoes?**", async (rota) => {
      const parametros = new URL(rota.request().url()).searchParams;
      const categoria = parametros.get("categoria");
      const perfil = parametros.get("perfil") || "morador";
      const antes = Number(parametros.get("antes") || 301);
      chamadas.push({ antes, categoria, perfil });
      assert.equal(parametros.get("limite"), "12");
      if (antes === 289 && falhar)
        return rota.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "A conexão caiu. Suas conversas continuam aqui.",
          }),
        });
      if (categoria === "Plantio")
        await new Promise((resolver) => setTimeout(resolver, 350));
      const itens = Array.from({ length: 12 }, (_, indice) => ({
        id: antes - indice - 1,
        conteudo: `Conversa de teste ${antes - indice - 1} sobre ${categoria || "o bairro"}. Uma experiência compartilhada com a comunidade.`,
        autor: { nome: "Conta local de teste", perfil },
        criado_em: "2026-11-04T12:00:00Z",
        categoria: categoria || "Plantio",
        estado: "aprovada",
        pontos: 0,
        comentarios: 0,
        minha: false,
        pode_excluir: false,
      }));
      await rota.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          itens,
          proximo: antes > 229 ? itens.at(-1).id : null,
        }),
      });
    });
    await pagina.goto("http://127.0.0.1:5175/login");
    await pagina
      .getByLabel("E-mail", { exact: true })
      .fill("morador-comunidade@example.org");
    await pagina.getByLabel("Senha", { exact: true }).fill("TesteLocal123!");
    await pagina.getByRole("button", { name: "Entrar", exact: true }).click();
    await pagina
      .getByRole("button", { name: "Comunidade", exact: true })
      .filter({ visible: true })
      .click();
    await pagina.locator(".com-publicacao").first().waitFor();
    assert.equal(await pagina.locator(".com-publicacao").count(), 12);
    await pagina.locator(".com-fim").scrollIntoViewIfNeeded();
    await pagina
      .getByText("A conexão caiu. Suas conversas continuam aqui.")
      .waitFor();
    assert.equal(
      await pagina.locator(".com-publicacao").count(),
      12,
      "Falha preserva publicações carregadas",
    );
    const quantidadeNaFalha = chamadas.length;
    await pagina.waitForTimeout(400);
    assert.equal(
      chamadas.length,
      quantidadeNaFalha,
      "Erro interrompe repetição automática",
    );
    falhar = false;
    await pagina
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await pagina.waitForFunction(
      () => document.querySelectorAll(".com-publicacao").length === 24,
    );
    for (const total of [36, 48, 60]) {
      await pagina.locator(".com-fim").scrollIntoViewIfNeeded();
      await pagina.waitForFunction(
        (n) => document.querySelectorAll(".com-publicacao").length === n,
        total,
      );
    }
    await pagina.getByRole("button", { name: "Continuar no feed" }).waitFor();
    assert.equal(
      chamadas.filter((chamada) => chamada.antes === 277).length,
      1,
      "Observer não duplica o cursor",
    );
    await pagina.getByRole("button", { name: "Continuar no feed" }).click();
    await pagina.waitForFunction(
      () => document.querySelectorAll(".com-publicacao").length === 12,
    );
    await pagina.getByText(/Conversa de teste 240 /).waitFor();
    assert.equal(
      await pagina.getByText(/Conversa de teste 300 /).count(),
      0,
      "Grupo anterior sai da memória renderizada",
    );
    assert.ok(
      await pagina
        .locator(".com-feed")
        .evaluate((e) => e.getBoundingClientRect().top >= 0),
    );

    // Filtro novo ganha de uma resposta antiga lenta, inclusive quando muda o perfil.
    await pagina.getByRole("button", { name: "Plantio", exact: true }).click();
    await pagina
      .getByRole("button", { name: "Reciclagem", exact: true })
      .click();
    await pagina.getByLabel("Filtrar por perfil").selectOption("cooperativa");
    await pagina.waitForFunction(
      () =>
        [...document.querySelectorAll(".com-publicacao .com-perfil")].every(
          (e) => e.textContent === "Cooperador",
        ) && document.querySelectorAll(".com-publicacao").length === 12,
    );
    await pagina.waitForTimeout(450);
    assert.deepEqual(
      await pagina.locator(".com-publicacao .com-categoria").allTextContents(),
      Array(12).fill("Reciclagem"),
    );
    assert.equal(
      await pagina.locator(".com-publicacao .com-perfil").first().innerText(),
      "Cooperador",
    );

    // Sem som e sem movimento: sucesso continua acessível; clique repetido não cria dois envios.
    await pagina
      .getByRole("button", { name: "Som ao publicar", exact: true })
      .click();
    assert.equal(
      await pagina
        .getByRole("button", { name: "Som ao publicar", exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );
    await pagina.reload();
    await pagina
      .getByRole("button", { name: "Comunidade", exact: true })
      .filter({ visible: true })
      .click();
    assert.equal(
      await pagina
        .getByRole("button", { name: "Som ao publicar", exact: true })
        .getAttribute("aria-pressed"),
      "false",
    );
    await pagina.route("**/comunidade/publicacoes", async (rota) => {
      envios++;
      await new Promise((resolver) => setTimeout(resolver, 300));
      await rota.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: 999, estado: "pendente" }),
      });
    });
    await pagina.evaluate(() => {
      window.AudioContext = function () {
        throw new Error("Som não deveria iniciar");
      };
    });
    await pagina
      .getByRole("button", { name: /O que vamos cultivar hoje/ })
      .click();
    await pagina
      .getByLabel("Sua publicação", { exact: true })
      .fill("Uma ideia para o teste de movimento reduzido.");
    await pagina
      .getByLabel("Categoria obrigatória", { exact: true })
      .selectOption("Plantio");
    await pagina.setViewportSize({ width: 320, height: 460 });
    await pagina.getByRole("button", { name: "Publicar", exact: true }).click();
    await pagina.keyboard.press("Escape");
    assert.equal(
      await pagina.getByRole("dialog").count(),
      1,
      "Envio em andamento não fecha com Escape",
    );
    await pagina.getByText("Sua ideia ganhou raízes!").waitFor();
    assert.equal(envios, 1);
    assert.equal(
      await pagina
        .locator(".com-folhas")
        .evaluate((e) => getComputedStyle(e).display),
      "none",
    );
    assert.equal(
      await pagina
        .locator(".com-notificacao")
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    assert.ok(
      await pagina.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(erros, []);
    console.log(
      "Rolagem aprovada: lotes de 12, limite de 60, continuação, recuperação, cancelamento de filtros, perfil, silêncio persistido, movimento reduzido e janela pequena.",
    );
  } finally {
    await navegador.close();
  }
})().catch((erro) => {
  console.error(erro);
  process.exitCode = 1;
});
