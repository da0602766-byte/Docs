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
    await morador.addInitScript(() => {
      window.notasPublicadas = 0;
      const iniciar = OscillatorNode.prototype.start;
      OscillatorNode.prototype.start = function (...argumentos) {
        window.notasPublicadas++;
        return iniciar.apply(this, argumentos);
      };
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
      .getByRole("region", { name: "Publicações de demonstração", exact: true })
      .waitFor();
    await morador.screenshot({
      path: caminho.join(pasta, "celular-vazio.png"),
      fullPage: true,
    });
    assert.equal(
      await morador.getByRole("textbox").count(),
      0,
      "Feed não abre campos de texto sozinho",
    );
    assert.equal(await morador.locator(".com-exemplo").count(), 6);
    await morador
      .getByRole("button", { name: /O que vamos cultivar hoje/ })
      .click();
    await morador
      .getByLabel("Sua publicação", { exact: true })
      .fill("Meu rascunho fica guardado ao fechar a janela.");
    await morador.keyboard.press("Escape");
    await morador.getByRole("dialog").waitFor({ state: "hidden" });
    await morador
      .getByRole("button", { name: /Continuar meu rascunho/ })
      .click();
    await morador.screenshot({
      path: caminho.join(pasta, "rascunho-reaberto.png"),
    });
    assert.equal(
      await morador.getByLabel("Sua publicação", { exact: true }).inputValue(),
      "Meu rascunho fica guardado ao fechar a janela.",
    );
    assert.equal(
      await morador
        .getByRole("button", { name: "Publicar", exact: true })
        .isDisabled(),
      true,
      "Categoria obrigatória",
    );
    for (const largura of [320, 390, 768, 1440]) {
      await morador.setViewportSize({ width: largura, height: 844 });
      const medidas = await morador
        .getByLabel("Sua publicação", { exact: true })
        .evaluate((e) => ({
          altura: e.getBoundingClientRect().height,
          resize: getComputedStyle(e).resize,
          largura: document.documentElement.scrollWidth,
          tela: innerWidth,
        }));
      assert.ok(medidas.altura <= 220 && medidas.altura >= 110);
      assert.equal(medidas.resize, "none");
      assert.ok(medidas.largura <= medidas.tela);
      await morador.screenshot({
        path: caminho.join(pasta, `compositor-${largura}.png`),
        fullPage: true,
      });
    }
    await morador.setViewportSize({ width: 390, height: 844 });
    await morador
      .getByLabel("Sua publicação", { exact: true })
      .fill(
        "No teste local, folhas secas e restos vegetais ajudam a preparar o composto da horta.",
      );
    await morador
      .getByLabel("Categoria obrigatória", { exact: true })
      .selectOption("Compostagem");
    await morador
      .getByRole("button", { name: "+ Adicionar vídeo do YouTube" })
      .click();
    await morador
      .getByLabel("Link do YouTube (opcional)")
      .fill("https://youtube.com.evil.org/watch?v=M7lc1UVf-VE");
    assert.equal(
      await morador
        .getByRole("button", { name: "Publicar", exact: true })
        .isDisabled(),
      true,
    );
    await morador
      .getByLabel("Link do YouTube (opcional)")
      .fill("https://youtu.be/M7lc1UVf-VE?si=teste");
    assert.equal(
      await morador.locator("iframe").count(),
      0,
      "Vídeo só carrega ao tocar",
    );
    // Uma falha mantém rascunho e categoria, sem tocar o som de sucesso.
    await morador.route("**/comunidade/publicacoes", (rota) =>
      rota.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Envio indisponível no teste." }),
      }),
    );
    await morador
      .getByRole("button", { name: "Publicar", exact: true })
      .click();
    await morador.getByText("Envio indisponível no teste.").waitFor();
    assert.equal(
      await morador
        .getByLabel("Categoria obrigatória", { exact: true })
        .inputValue(),
      "Compostagem",
    );
    assert.ok(
      (
        await morador.getByLabel("Sua publicação", { exact: true }).inputValue()
      ).includes("No teste local"),
    );
    assert.equal(await morador.evaluate(() => window.notasPublicadas), 0);
    await morador.unroute("**/comunidade/publicacoes");
    await morador
      .getByRole("button", { name: "Publicar", exact: true })
      .click();
    await morador.getByText(/Em análise/).waitFor();
    await morador
      .getByText("Sua ideia ganhou raízes!", { exact: true })
      .waitFor();
    assert.equal(await morador.evaluate(() => window.notasPublicadas), 2);
    assert.equal(await morador.locator(".com-folhas > span").count(), 7);
    const folhasPublicacao = await morador
      .locator(".com-folhas > span")
      .evaluateAll((itens) => itens.map((e) => e.getAttribute("style")));
    assert.equal(
      new Set(folhasPublicacao).size,
      7,
      "Cada folha tem trajetória própria",
    );
    await morador.screenshot({
      path: caminho.join(pasta, "publicacao-confirmada.png"),
      fullPage: true,
    });
    await morador.getByRole("button", { name: "Fechar notificação" }).click();
    await morador
      .getByRole("button", { name: "Coletas", exact: true })
      .filter({ visible: true })
      .click();
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
    await morador.evaluate(() => window.dispatchEvent(new Event("focus")));
    await morador
      .getByText("Sua publicação foi aprovada!", { exact: true })
      .waitFor();
    assert.equal(
      await morador.evaluate(() => window.notasPublicadas),
      4,
      "Aprovação também toca som, fora da Comunidade",
    );
    assert.notDeepEqual(
      await morador
        .locator(".com-folhas > span")
        .evaluateAll((itens) => itens.map((e) => e.getAttribute("style"))),
      folhasPublicacao,
    );
    await morador.screenshot({
      path: caminho.join(pasta, "aviso-aprovada.png"),
    });
    await morador.getByRole("button", { name: "Fechar notificação" }).click();
    await morador
      .getByRole("button", { name: "Comunidade", exact: true })
      .filter({ visible: true })
      .click();
    await morador
      .getByRole("button", { name: "Para a comunidade", exact: true })
      .click();
    await morador.getByText("+10 pontos", { exact: true }).waitFor();
    // O player usa endereço construído a partir do ID validado e conserva um caminho alternativo.
    await morador.route("https://www.youtube-nocookie.com/embed/**", (rota) =>
      rota.fulfill({
        contentType: "text/html",
        body: "<html><body>Player controlado de teste</body></html>",
      }),
    );
    await morador
      .getByRole("button", { name: "Assistir vídeo aqui", exact: true })
      .click();
    const player = morador.locator("iframe");
    assert.match(
      await player.getAttribute("src"),
      /^https:\/\/www.youtube-nocookie.com\/embed\/M7lc1UVf-VE\?/,
    );
    assert.equal(
      await player.getAttribute("referrerpolicy"),
      "strict-origin-when-cross-origin",
    );
    assert.equal(
      await morador
        .getByRole("link", { name: "Abrir no YouTube ↗" })
        .getAttribute("href"),
      "https://www.youtube.com/watch?v=M7lc1UVf-VE",
    );
    await morador.screenshot({ path: caminho.join(pasta, "video-feed.png") });
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
    assert.equal(
      await morador
        .getByRole("button", { name: "1 comentário", exact: true })
        .getAttribute("aria-expanded"),
      "true",
    );
    await morador
      .getByText(
        "Vou experimentar a proporção de folhas secas no meu composto.",
        { exact: true },
      )
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
    await morador.getByLabel('Mais ações da publicação').click();
    await morador.getByRole("button", { name: "Excluir", exact: true }).click();
    await morador
      .getByRole("button", { name: "Confirmar", exact: true })
      .click();
    await morador
      .getByRole("button", { name: "Excluir", exact: true })
      .waitFor({ state: "hidden" });
    await morador
      .getByRole("button", { name: "Ver meus pontos e regras da comunidade" })
      .click();
    assert.equal(await morador.locator(".com-saldo strong").innerText(), "0");
    assert.equal(
      await morador.locator(".com-cotas").innerText(),
      "Hoje\n1/2\nEsta semana\n1/6",
    );
    await morador.getByRole("button", { name: "Fechar formulário" }).click();
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
