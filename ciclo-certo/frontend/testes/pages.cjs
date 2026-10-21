// Infraestrutura de teste: serve o build em domínio simulado, sem API ou banco.
const { chromium } = require('playwright');
const { readFile, mkdir } = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const raiz = path.resolve('dist-pages');
  const falhas = [];
  const navegador = await chromium.launch({ channel: process.env.CANAL_NAVEGADOR || 'msedge', headless: true });
  try {
    const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
    pagina.setDefaultTimeout(15000);
    pagina.on('pageerror', erro => falhas.push(erro.message));
    await pagina.route('**/*', async rota => {
      const url = new URL(rota.request().url());
      if (url.origin !== 'https://publicacao.test' || !url.pathname.startsWith('/Docs/')) {
        falhas.push('Recurso fora da base: ' + url.href);
        return rota.abort();
      }
      const relativo = decodeURIComponent(url.pathname.slice('/Docs/'.length)) || 'index.html';
      const arquivo = path.resolve(raiz, relativo);
      assert.ok(arquivo.startsWith(raiz + path.sep));
      const tipos = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.ttf':'font/ttf'};
      try {
        await rota.fulfill({ body: await readFile(arquivo), contentType: tipos[path.extname(arquivo)] || 'application/octet-stream' });
      } catch (erro) { falhas.push(erro.message); await rota.abort(); }
    });
    await pagina.goto('https://publicacao.test/Docs/');
    await pagina.getByRole('heading', {name:'Separou em casa? A cooperativa busca na sua porta.'}).waitFor();
    await pagina.locator('img').evaluateAll(imagens => Promise.all(imagens.map(imagem => { imagem.loading='eager'; return imagem.decode(); })));
    await pagina.evaluate(() => document.fonts.ready);
    assert.equal(await pagina.evaluate(() => document.fonts.check('700 16px Manrope')), true);
    await mkdir('resultados-visuais', { recursive:true });
    await pagina.screenshot({ path:'resultados-visuais/pages-inicial.png' });
    await pagina.getByRole('button',{name:'Agendar minha coleta'}).click();
    await pagina.getByRole('status').filter({hasText:'O acesso às contas ainda não está disponível'}).waitFor();
    assert.equal(await pagina.getByRole('button',{name:'Entrar',exact:true}).isDisabled(),true);
    assert.equal(await pagina.getByLabel('E-mail',{exact:true}).isDisabled(),true);
    await pagina.locator('img').evaluateAll(imagens=>Promise.all(imagens.map(imagem=>imagem.decode())));
    await pagina.screenshot({path:'resultados-visuais/pages-acesso.png'});
    await pagina.getByRole('button',{name:'Página inicial',exact:true}).click();
    await pagina.getByRole('heading',{name:'Separou em casa? A cooperativa busca na sua porta.'}).waitFor();
    assert.deepEqual(falhas,[]);
    console.log('OK: build em /Docs/, imagens/fontes locais, página inicial e acesso indisponível sem chamadas ao localhost.');
  } finally { await navegador.close(); }
})().catch(erro => { console.error(erro); process.exitCode=1; });
