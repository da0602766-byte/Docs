// Fluxo real exclusivamente na API local com schema descartável de preview_comunidade.py.
const assert = require("node:assert/strict");
const { chromium, request } = require("playwright");
const fs = require("node:fs");
(async () => {
  const navegador = await chromium.launch({
    channel: "msedge",
    headless: true,
  });
  const api = await request.newContext({ baseURL: "http://127.0.0.1:8001" });
  const erros = [];
  const pasta = "resultados-visuais/participacao";
  fs.mkdirSync(pasta, { recursive: true });
  try {
    const email = `participacao-${Date.now()}@example.org`,
      senha = "TesteLocal123!";
    const cadastro = await api.post("/usuarios", {
      data: { nome: "Participante local", email, senha, tipo: "morador" },
    });
    assert.equal(cadastro.status(), 201);
    async function autenticar(email) {
      const r = await api.post("/login", {
        form: { username: email, password: senha },
      });
      assert.equal(r.status(), 200);
      return { Authorization: "Bearer " + (await r.json()).access_token };
    }
    const autor = await autenticar(email),
      mod = await autenticar("moderador-comunidade@example.org");
    const criar = await api.post("/comunidade/publicacoes", {
      headers: autor,
      data: {
        categoria: "Compostagem",
        conteudo:
          Date.now() +
          " Na minha experiência, misturar folhas secas aos restos vegetais ajudou a equilibrar a umidade da composteira. " +
          "Observamos a decomposição e aprendemos com cada etapa. ".repeat(8),
        publica: true,
      },
    });
    assert.equal(criar.status(), 201);
    const id = (await criar.json()).id;
    assert.equal(
      (
        await api.post(`/comunidade/publicacoes/${id}/moderar`, {
          headers: mod,
          data: { aprovar: true },
        })
      ).status(),
      200,
    );
    const pagina = await navegador.newPage({
      viewport: { width: 390, height: 844 },
    });
    pagina.on("pageerror", (e) => erros.push(e.message));
    await pagina.goto(`http://127.0.0.1:5175/comunidade/publicacao/${id}`);
    await pagina.getByText("Participante local", { exact: true }).waitFor();
    assert.equal(
      await pagina
        .getByRole("button", { name: "Ler mais", exact: true })
        .count(),
      1,
    );
    assert.match(
      await pagina.getByRole("link", { name: /WhatsApp/ }).getAttribute("href"),
      /wa\.me/,
    );
    await pagina.screenshot({
      path: `${pasta}/publica-390.png`,
      fullPage: true,
    });
    await pagina.getByRole("link", { name: "Entrar para conversar →" }).click();
    await pagina.getByLabel("E-mail", { exact: true }).fill(email);
    await pagina.getByLabel("Senha", { exact: true }).fill(senha);
    await pagina.getByRole("button", { name: "Entrar", exact: true }).click();
    const detalhe = pagina.getByRole("dialog", {
      name: "Publicação da comunidade",
    });
    await detalhe.waitFor();
    await detalhe
      .getByRole("button", { name: "☆ Salvar", exact: true })
      .click();
    await detalhe
      .getByRole("button", { name: "★ Salva", exact: true })
      .waitFor();
    const comentario=await api.post(`/comunidade/publicacoes/${id}/comentarios`,{headers:mod,data:{conteudo:'Como você percebeu a melhora da umidade?'}});
    assert.equal(comentario.status(),201);
    await detalhe.getByRole('button',{name:/comentários/}).click();
    await detalhe.getByRole('button',{name:'Responder',exact:true}).click();
    await detalhe.getByLabel('Seu comentário').fill('O composto ficou menos encharcado ao misturar mais folhas secas.');
    await detalhe.getByRole('button',{name:'Comentar',exact:true}).click();
    await detalhe.getByText('O composto ficou menos encharcado ao misturar mais folhas secas.',{exact:true}).waitFor();
    const respostas=await api.get('/comunidade/avisos',{headers:mod});assert.ok((await respostas.json()).itens.some(a=>a.estado==='resposta'&&a.publicacao_id===id));
    await detalhe
      .getByRole("button", { name: "Fechar formulário", exact: true })
      .click();
    async function tela(nome) {
      await pagina
        .getByRole("button", { name: "Mais", exact: true })
        .filter({ visible: true })
        .click();
      await pagina
        .getByRole("dialog")
        .getByRole("button", { name: nome, exact: true })
        .click();
    }
    await tela("Notificações");
    await pagina
      .getByRole("heading", { name: "Central de notificações" })
      .waitFor();
    await pagina
      .getByRole("button", { name: "Abrir publicação →" })
      .first()
      .click();
    await detalhe.waitFor();
    await detalhe
      .getByRole("button", { name: "Fechar formulário", exact: true })
      .click();
    await pagina.getByRole("button", { name: "Salvas", exact: true }).click();
    await pagina.locator(".com-feed .com-publicacao").first().waitFor();
    const inicio = new Date(Date.now() + 86400000),
      fim = new Date(Date.now() + 90000000);
    const criado = await api.post("/comunidade/acoes", {
      headers: mod,
      data: {
        tipo: "evento",
        titulo: "Oficina de mudas do teste local",
        descricao:
          "Oficina de integração automatizada, somente no banco descartável.",
        local: "Espaço de teste local",
        inicio: inicio.toISOString(),
        fim: fim.toISOString(),
      },
    });
    assert.equal(criado.status(), 201);
    await tela("Ações do bairro");
    const evento = pagina
      .locator(".com-acao-bairro")
      .filter({ hasText: "Oficina de mudas do teste local" });
    await evento
      .getByRole("button", { name: "Quero participar", exact: true })
      .click();
    await evento
      .getByRole("button", { name: "Cancelar minha inscrição", exact: true })
      .waitFor();
    for (const largura of [320, 390, 768, 1440]) {
      await pagina.setViewportSize({ width: largura, height: 900 });
      assert.ok(
        await pagina.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        `Sem rolagem horizontal em ${largura}`,
      );
      await pagina.screenshot({
        path: `${pasta}/acoes-${largura}.png`,
        fullPage: true,
      });
    }
    await tela("Convidar e gerar QR code");
    await pagina
      .getByRole("link", { name: "Baixar QR code", exact: true })
      .waitFor();
    assert.match(
      await pagina
        .getByAltText("QR code para o destino escolhido")
        .getAttribute("src"),
      /^data:image\/png/,
    );
    await tela("Meu impacto");
    await pagina.getByText("0 coletas concluídas", { exact: true }).waitFor();
    // Uma coleta anterior alimenta apenas endereço/material; dia e horário continuam vazios.
    const coleta=await api.post('/coletas',{headers:autor,data:{endereco:'Rua das Folhas, 123',dia:'2030-02-05',hora:'08:00',materiais_informados:['Papel']}});assert.equal(coleta.status(),201);const coletaId=(await coleta.json()).id;
    await pagina
      .getByRole("button", { name: "Agendar", exact: true })
      .filter({ visible: true })
      .click();
    await pagina
      .getByText("Agendar novamente usando uma coleta anterior", {
        exact: true,
      })
      .click();
    await pagina.getByLabel("Reaproveitar endereço e materiais").waitFor();
    assert.equal(await pagina.getByLabel("Endereço completo").inputValue(), "");
    await pagina.getByLabel('Reaproveitar endereço e materiais').selectOption(String(coletaId));
    assert.equal(await pagina.getByLabel('Endereço completo').inputValue(),'Rua das Folhas, 123');
    await pagina.getByText('Selecione um dia no calendário',{exact:true}).waitFor();
    assert.equal(await pagina.getByRole('checkbox',{name:/Conferi o endereço/}).isChecked(),false);
    await pagina.screenshot({
      path: `${pasta}/agendar-1440.png`,
      fullPage: true,
    });
    assert.deepEqual(erros, []);
    console.log(
      "Participação E2E: leitura pública, login com destino, favorito, central de avisos, evento/inscrição, QR local, impacto vazio e layout 320/390/768/1440 OK.",
    );
  } finally {
    await api.dispose();
    await navegador.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
