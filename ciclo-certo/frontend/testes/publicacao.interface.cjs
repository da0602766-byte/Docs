// Testa o frontend compilado sem login, cadastros ou chamadas ao banco real.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

(async () => {
  const { preview } = await import('vite');
  const servidor = await preview({ preview: { host: '127.0.0.1', port: 4187, strictPort: true } });
  let navegador;
  try {
    navegador = await chromium.launch({ channel: 'msedge', headless: true });
    const pagina = await navegador.newPage();
    const erros = [];
    pagina.on('pageerror', erro => erros.push(erro.message));
    await pagina.route('http://127.0.0.1:8000/**', rota => rota.abort());
    for (const caminho of ['/', '/login', '/cooperador']) {
      const resposta = await pagina.goto('http://127.0.0.1:4187' + caminho);
      assert.equal(resposta.status(), 200);
      if (caminho !== '/') {
        await pagina.getByRole('button', { name: 'Entrar', exact: true }).waitFor();
        assert.equal(await pagina.getByRole('button', { name: 'Criar minha conta', exact: true }).count(), caminho === '/login' ? 1 : 0);
      }
      assert.equal((await pagina.reload()).status(), 200);
    }
    assert.deepEqual(erros, []);
    console.log('Interface compilada: início, login, cooperador e recarga aprovados.');
  } finally {
    if (navegador) await navegador.close();
    await new Promise(resolve => servidor.httpServer.close(resolve));
  }
})().catch(erro => { console.error(erro); process.exitCode = 1; });
