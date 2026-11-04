// Integração real com preview_comunidade.py; contas e conteúdo somente no PostgreSQL descartável.
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const fs = require("node:fs");
const caminho = require("node:path");

(async () => {
  const navegador = await chromium.launch({
    channel: "msedge",
    headless: true,
  });
  const erros = [];
  const pasta = caminho.resolve("resultados-visuais/comunidade");
  fs.mkdirSync(pasta, { recursive: true });
  try {
    const morador = await navegador.newPage({
      viewport: { width: 390, height: 844 },
    });
    const moderador = await navegador.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    for (const pagina of [morador, moderador])
      pagina.on("pageerror", (e) => erros.push(e.message));
    async function entrar(pagina, cooperador) {
      await pagina.goto(
        "http://127.0.0.1:5175/" + (cooperador ? "cooperador" : "login"),
      );
      await pagina
        .getByLabel("E-mail", { exact: true })
        .fill(
          (cooperador ? "moderador" : "morador") + "-comunidade@example.org",
        );
      await pagina.getByLabel("Senha", { exact: true }).fill("TesteLocal123!");
      await pagina.getByRole("button", { name: "Entrar", exact: true }).click();
      await pagina
        .getByRole("button", { name: "Comunidade", exact: true })
        .filter({ visible: true })
        .click();
      await pagina
        .getByRole("heading", { name: "Comunidade", exact: true })
        .waitFor();
    }
    await entrar(morador, false);
    await entrar(moderador, true);
    await morador
      .getByText("Vamos começar uma conversa?", { exact: true })
      .waitFor();
    await morador.screenshot({
      path: caminho.join(pasta, "celular-vazio.png"),
      fullPage: true,
    });
    await morador
      .getByLabel("Sua publicação", { exact: true })
      .fill(
        "No teste local, folhas secas e restos vegetais ajudam a preparar o composto da horta.",
      );
    await morador
      .getByLabel("Categoria obrigatória", { exact: true })
      .selectOption("Compostagem");
    await morador
      .getByRole("button", { name: "Publicar", exact: true })
      .click();
    await morador.getByText("Em análise", { exact: true }).waitFor();
    await moderador
      .getByRole("button", { name: "Aprovações", exact: true })
      .click();
    await moderador
      .getByRole("button", { name: "Aprovar", exact: true })
      .click();
    await moderador
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await moderador
      .getByText("Tudo em dia por aqui", { exact: true })
      .waitFor();
    await morador
      .getByRole("button", { name: "Para a comunidade", exact: true })
      .click();
    await morador.getByText("+10 pontos", { exact: true }).waitFor();
    await morador
      .getByRole("button", { name: "0 comentários", exact: true })
      .click();
    await morador
      .getByLabel("Seu comentário", { exact: true })
      .fill("Vou experimentar a proporção de folhas secas no meu composto.");
    await morador
      .getByRole("button", { name: "Comentar", exact: true })
      .click();
    await morador
      .getByRole("button", { name: "1 comentário", exact: true })
      .waitFor();
    for (const largura of [320, 390, 768, 1440]) {
      await morador.setViewportSize({ width: largura, height: 1000 });
      assert.equal(
        await morador.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
        `Overflow em ${largura}`,
      );
      await morador.screenshot({
        path: caminho.join(pasta, `feed-${largura}.png`),
        fullPage: true,
      });
    }
    await moderador
      .getByRole("button", { name: "Para a comunidade", exact: true })
      .click();
    await moderador
      .getByRole("button", { name: "1 comentário", exact: true })
      .click();
    await moderador
      .getByRole("button", { name: "Denunciar comentário", exact: true })
      .click();
    await moderador
      .getByLabel("Por que este conteúdo deve ser analisado?", { exact: true })
      .fill("Denúncia apenas do teste de integração local.");
    await moderador
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await moderador
      .getByText("Denúncia recebida. A moderação irá analisar o conteúdo.", {
        exact: true,
      })
      .waitFor();
    await moderador
      .getByRole("button", { name: "Denúncias", exact: true })
      .click();
    await moderador
      .getByText("Comentário denunciado", { exact: true })
      .waitFor();
    await moderador
      .getByRole("button", { name: "Excluir conteúdo", exact: true })
      .click();
    await moderador
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await moderador
      .getByText("Conteúdo já excluído.", { exact: true })
      .waitFor();
    await moderador
      .getByRole("button", { name: "Concluir análise", exact: true })
      .click();
    await moderador
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await moderador
      .getByText("Nenhuma denúncia pendente", { exact: true })
      .waitFor();
    await morador.getByRole("button", { name: "Excluir", exact: true }).click();
    await morador
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await morador
      .getByText("Vamos começar uma conversa?", { exact: true })
      .waitFor();
    assert.equal(await morador.locator(".com-saldo strong").innerText(), "0");
    assert.equal(
      await morador.locator(".com-cotas").innerText(),
      "Hoje\n1/2\nEsta semana\n1/6",
    );
    await morador.route("**/comunidade/publicacoes?**", (rota) =>
      rota.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Falha temporária de teste." }),
      }),
    );
    await morador
      .getByRole("button", { name: "Minhas publicações", exact: true })
      .click();
    await morador
      .getByRole("alert")
      .filter({ hasText: "Falha temporária de teste." })
      .waitFor();
    await morador.unroute("**/comunidade/publicacoes?**");
    await morador
      .getByRole("button", { name: "Tentar novamente", exact: true })
      .click();
    await morador
      .getByText("Vamos começar uma conversa?", { exact: true })
      .waitFor();
    assert.deepEqual(erros, []);
    console.log(
      "Comunidade E2E: login dos dois perfis, envio, aprovação, crédito, comentário, denúncia, moderação, exclusão, estorno, erro/recuperação e larguras 320/390/768/1440 aprovados.",
    );
  } finally {
    await navegador.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
