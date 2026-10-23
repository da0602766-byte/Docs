// Verificação de interface com API simulada: nunca grava no banco real.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const pasta = 'resultados-visuais';
const endereco = process.env.URL_VISUAL || 'http://127.0.0.1:5175';
fs.mkdirSync(pasta, {recursive: true});

(async () => {
  const navegador = await chromium.launch({ channel: process.env.CANAL_NAVEGADOR || 'msedge', headless: true });
  try {
    for (const largura of [1440, 390, 320]) {
      const contexto = await navegador.newContext({ viewport: { width: largura, height: 1000 }, locale: 'pt-BR' });
      const pagina = await contexto.newPage();
      pagina.setDefaultTimeout(12000);
      const erros = [];
      pagina.on('pageerror', erro => erros.push(erro.message));
      let perfil = 'morador', expirada = false, falharLista = false, falharPesagens = false, falharTotal = false, postsPesagem = 0;
      const hoje = new Date().toLocaleDateString('en-CA');
      let coletas = [
        { id: 701, nome_morador: 'Ana de Teste', morador_id: 1, dia: hoje, endereco: 'Rua de Teste, 123, Bairro Jardim', materiais_informados: ['papel', 'plástico'], situacao: 'agendada', pontos: 0 },
        { id: 702, nome_morador: 'Ana de Teste', morador_id: 1, dia: '2026-09-10', endereco: 'Rua de Teste, 123, Bairro Jardim', materiais_informados: ['papel'], situacao: 'coletada', pontos: 0.001 },
      ];
      const pesagens = {701: [], 702: [{id: 1, material: 'papel', quilos: 0.001, pontos: 0.001}]};
      await pagina.route('http://127.0.0.1:8000/**', async rota => {
        const req = rota.request(), url = new URL(req.url()), caminho = url.pathname;
        const responder = (dados, status = 200) => rota.fulfill({status, contentType: 'application/json', body: JSON.stringify(dados)});
        if (caminho === '/login') {
          if (req.postData().includes('errada')) return responder({ detail: 'E-mail ou senha incorretos.' }, 401);
          expirada = false;
          return responder({access_token: 'token-de-teste', token_type: 'bearer'});
        }
        if (caminho === '/usuarios' && req.method() === 'POST') {
          const dados = JSON.parse(req.postData());
          assert.equal(dados.tipo, new URL(pagina.url()).pathname === '/cooperador' ? 'cooperativa' : 'morador');
          return responder({id:1,...dados, senha: undefined}, 201);
        }
        assert.equal(req.headers().authorization, 'Bearer token-de-teste');
        if (expirada) return responder({detail:'Sessão expirada'},401);
        if (caminho === '/usuarios/eu') return responder({id:1,nome:'Ana de Teste',email:'ana@example.org',tipo:perfil});
        if (caminho === '/coletas' && req.method() === 'POST') {
          const corpo = JSON.parse(req.postData());
          assert.deepEqual(Object.keys(corpo).sort(), ['dia','endereco','materiais_informados']);
          assert.equal(corpo.materiais_informados.length,7);
          const coleta={...corpo,id:703,nome_morador:'Ana de Teste',morador_id:1,situacao:'agendada',pontos:0};
          coletas.push(coleta); pesagens[703]=[];
          return responder(coleta,201);
        }
        if (caminho === '/coletas') {
          if(falharLista){falharLista=false;return responder({detail:'Falha simulada na consulta.'},503);}
          return responder(coletas.filter(c => !url.searchParams.get('dia') || c.dia === url.searchParams.get('dia')));
        }
        const partes=caminho.match(/^\/coletas\/(\d+)(\/pesagens)?$/);
        if(partes){
          const id=Number(partes[1]), coleta=coletas.find(c=>c.id===id);
          if(partes[2]){
            if(req.method()==='POST'){
              postsPesagem++;
              const corpo=JSON.parse(req.postData());
              assert.deepEqual(Object.keys(corpo).sort(),['material','quilos']);
              const pontos=corpo.quilos*({papel:1,vidro:1,'plástico':2,metal:4}[corpo.material]);
              const pesagem={id:postsPesagem+10,...corpo,pontos};
              pesagens[id].push(pesagem); coleta.pontos+=pontos; coleta.situacao='coletada';
              if(postsPesagem===1) falharTotal=true;
              return responder(pesagem,201);
            }
            if(falharPesagens){falharPesagens=false;return responder({detail:'Falha simulada no histórico.'},503);}
            return responder(pesagens[id]);
          }
          if(falharTotal){falharTotal=false;return responder({detail:'Falha simulada no total.'},503);}
          return responder(coleta);
        }
        throw new Error('Rota inesperada: '+caminho);
      });
      async function capturar(nome) {
        await pagina.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
        await pagina.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
        await pagina.evaluate(()=>document.fonts.ready);
        assert.equal(await pagina.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false,'Rolagem horizontal: '+nome+' '+largura);
        await pagina.screenshot({path:`${pasta}/${largura}-${nome}.png`,fullPage:true});
      }
      async function entrar() {
        await pagina.getByLabel('E-mail',{exact:true}).fill('ana@example.org');
        await pagina.getByLabel(/^Senha/).fill('TesteLocal2026!');
        await pagina.getByRole('button',{name:'Entrar',exact:true}).click();
        await pagina.getByRole('heading',{name:perfil==='morador'?'Olá, Ana.':'Rota do dia',exact:true}).waitFor();
      }
      async function navegar(nome) {
        await pagina.getByRole('navigation',{name:largura>960?'Navegação principal':'Navegação no celular',exact:true}).getByRole('button',{name:nome,exact:true}).click();
      }
      await pagina.goto(endereco);
      await pagina.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(img=>{img.loading='eager';return img.decode();})));
      assert.equal(await pagina.locator('img').evaluateAll(imgs=>imgs.every(i=>i.complete && i.naturalWidth>0)),true);
      await capturar('inicio');
      await pagina.getByRole('link',{name:'Agendar minha coleta'}).click();
      await capturar('login');
      await pagina.getByRole('button',{name:'Criar minha conta',exact:true}).click();
      await pagina.getByLabel('Nome',{exact:true}).fill('Ana de Teste');
      assert.equal(new URL(pagina.url()).pathname, '/login');
      assert.equal(await pagina.getByRole('combobox').count(), 0);
      await capturar('cadastro');
      await pagina.getByLabel('E-mail',{exact:true}).fill('ana@example.org');
      await pagina.getByLabel(/^Senha/).fill('TesteLocal2026!');
      await pagina.getByRole('button',{name:'Criar conta e entrar',exact:true}).click();
      await pagina.getByRole('heading',{name:'Olá, Ana.',exact:true}).waitFor();
      await pagina.getByRole('button',{name:'Sair',exact:true}).click();
      await pagina.getByLabel('E-mail',{exact:true}).fill('ana@example.org');
      await pagina.getByLabel(/^Senha/).fill('errada');
      await pagina.getByRole('button',{name:'Entrar',exact:true}).click();
      await pagina.getByRole('alert').filter({hasText:'incorretos'}).waitFor();
      await entrar();
      await capturar('minhas');
      falharPesagens=true;
      await pagina.getByRole('button',{name:/Coleta nº 702/}).click();
      await pagina.getByRole('alert').filter({hasText:'histórico'}).waitFor();
      await pagina.getByRole('button',{name:'Tentar novamente'}).click();
      await pagina.getByRole('cell',{name:'0,001 kg',exact:true}).waitFor();
      await capturar('detalhe');
      await navegar('Agendar coleta');
      await pagina.getByLabel('Onde a equipe deve buscar').fill('Rua Nova, 456, Jardim');
      await pagina.getByLabel('Escolha a data').fill(hoje);
      await pagina.getByLabel('O que você separou').fill('papel, vidro, plástico, metal, caixas, jornais, latas');
      await capturar('agendar');
      await pagina.getByRole('button',{name:'Confirmar agendamento'}).click();
      await pagina.getByRole('status').filter({hasText:'Coleta agendada'}).waitFor();
      falharLista=true;
      await navegar('Minhas coletas');
      await pagina.getByRole('alert').filter({hasText:'consulta'}).waitFor();
      await pagina.getByRole('button',{name:'Tentar novamente'}).click();
      await pagina.getByRole('button',{name:/Coleta nº 703/}).waitFor();
      await pagina.reload();
      await pagina.getByRole('heading',{name:'Olá, Ana.'}).waitFor();
      assert.equal(await pagina.evaluate(()=>localStorage.getItem('token')),'token-de-teste');
      expirada=true;
      await navegar('Agendar coleta');
      await navegar('Minhas coletas');
      await pagina.getByRole('alert').filter({hasText:'Sua sessão expirou'}).waitFor();
      assert.equal(await pagina.evaluate(()=>localStorage.getItem('token')),null);
      perfil='cooperativa';
      // A área do morador recusa a conta da cooperativa antes de consultar coletas.
      await pagina.getByLabel('E-mail',{exact:true}).fill('ana@example.org');
      await pagina.getByLabel(/^Senha/).fill('TesteLocal2026!');
      await pagina.getByRole('button',{name:'Entrar',exact:true}).click();
      await pagina.getByRole('alert').filter({hasText:'exclusivo para moradores'}).waitFor();
      assert.equal(await pagina.evaluate(()=>localStorage.getItem('token')),null);
      await pagina.getByRole('link',{name:'Sou cooperador · acessar a cooperativa',exact:true}).click();
      assert.equal(new URL(pagina.url()).pathname, '/cooperador');
      await pagina.reload();
      await pagina.getByRole('heading',{name:'Acesso do cooperador',exact:true}).waitFor();
      // A recusa funciona também quando um morador tenta a área do cooperador.
      perfil='morador';
      await pagina.getByLabel('E-mail',{exact:true}).fill('ana@example.org');
      await pagina.getByLabel(/^Senha/).fill('TesteLocal2026!');
      await pagina.getByRole('button',{name:'Entrar',exact:true}).click();
      await pagina.getByRole('alert').filter({hasText:'exclusivo para cooperadores'}).waitFor();
      assert.equal(await pagina.evaluate(()=>localStorage.getItem('token')),null);
      perfil='cooperativa';
      await pagina.getByRole('button',{name:'Criar minha conta',exact:true}).click();
      assert.equal(await pagina.getByRole('alert').count(),0);
      assert.equal(await pagina.getByRole('combobox').count(),0);
      await pagina.getByLabel('Nome',{exact:true}).fill('Ana de Teste');
      await pagina.getByLabel('E-mail',{exact:true}).fill('ana@example.org');
      await pagina.getByLabel(/^Senha/).fill('TesteLocal2026!');
      await capturar('cadastro-cooperador');
      await pagina.getByRole('button',{name:'Criar conta e entrar',exact:true}).click();
      await pagina.getByRole('heading',{name:'Rota do dia',exact:true}).waitFor();
      await pagina.reload();
      await pagina.getByRole('heading',{name:'Rota do dia',exact:true}).waitFor();
      await capturar('rota');
      await pagina.getByLabel('Escolher dia').fill('2020-01-01');
      await pagina.getByText('Nenhuma coleta neste dia.',{exact:true}).waitFor();
      await pagina.getByRole('button',{name:'Hoje',exact:true}).click();
      await pagina.getByRole('button',{name:'Abrir balança'}).first().click();
      await pagina.getByRole('heading',{name:'Nova pesagem'}).waitFor();
      await pagina.locator('.ws-material-pick label').filter({hasText:'Metal'}).click();
      assert.equal(await pagina.getByRole('radio',{name:/Metal/}).isChecked(),true);
      await pagina.getByLabel('Peso conferido na balança').fill('1001');
      await capturar('balanca');
      await pagina.getByRole('button',{name:'Registrar pesagem',exact:true}).click();
      await pagina.getByRole('alert').filter({hasText:'O total não foi atualizado'}).waitFor();
      assert.equal(await pagina.getByRole('button',{name:'Registrar pesagem',exact:true}).isDisabled(),true);
      await pagina.getByRole('button',{name:'Tentar novamente'}).click();
      await pagina.getByText('Novo total da coleta: 4.004 pontos',{exact:true}).waitFor();
      assert.equal(postsPesagem,1);
      await pagina.locator('.ws-material-pick label').filter({hasText:'Papel'}).click();
      await pagina.getByLabel('Peso conferido na balança').fill('0.001');
      await pagina.getByRole('button',{name:'Registrar pesagem',exact:true}).click();
      await pagina.getByText('Novo total da coleta: 4.004,001 pontos',{exact:true}).waitFor();
      await pagina.getByRole('cell',{name:'0,001 kg',exact:true}).waitFor();
      await capturar('pesagem-confirmada');
      await pagina.getByRole('button',{name:'Sair',exact:true}).click();
      await pagina.getByRole('heading',{name:'Acesso do cooperador',exact:true}).waitFor();
      await capturar('login-cooperador');
      await entrar();
      await pagina.getByRole('button',{name:'Sair',exact:true}).click();
      await pagina.getByRole('link',{name:'Página inicial',exact:true}).click();
      await pagina.getByRole('link',{name:'Sou da cooperativa',exact:true}).click();
      assert.equal(new URL(pagina.url()).pathname,'/cooperador');
      await pagina.goBack();
      await pagina.goForward();
      await pagina.getByRole('heading',{name:'Acesso do cooperador',exact:true}).waitFor();
      assert.equal(await pagina.evaluate(()=>localStorage.getItem('token')),null);
      assert.deepEqual(erros,[]);
      console.log(`OK ${largura}px: links por perfil, cadastro sem seletor, recusa de perfil incorreto, F5, voltar/avançar, login/erro, expiração, histórico, agendamento, filtro, pesagens e saída.`);
      await contexto.close();
    }
  } finally { await navegador.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
