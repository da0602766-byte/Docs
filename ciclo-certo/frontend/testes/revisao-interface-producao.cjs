// Frontend publicado; todas as chamadas à API são interceptadas antes do envio.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const itens=[1,2,3].map(id=>({id,autor:{nome:'Mateus Vilmar',perfil:'morador'},criado_em:'2026-11-04T12:00:00Z',categoria:'Plantio',estado:'aprovada',pontos:10,conteudo:'Muito boa essa sua ideia. Vamos separar os materiais para a próxima coleta.',comentarios:0,pode_excluir:true,minha:true,publica:false}));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const erros=[];fs.mkdirSync('resultados-visuais/revisao-interface-producao',{recursive:true});try{
for(const [width,tipo] of [320,673,1440].flatMap(w=>[[w,"morador"],[w,"cooperativa"]])){
const page=await browser.newPage({viewport:{width,height:800}});page.setDefaultTimeout(10000);page.on('pageerror',e=>{erros.push(e.message);console.error(e.message)});
await page.route('https://ciclo-certo-api.vercel.app/**',r=>{const path=new URL(r.request().url()).pathname;let data=[];
if(path==='/usuarios/eu')data={id:1,nome:'Mateus Vilmar',tipo,email:'teste-interface@example.org'};else if(path==='/catalogo')data={materiais:[]};else if(path==='/comunidade/resumo') data={saldo:20,usadas_dia:2,limite_dia:3,categorias:['Plantio'],moderador:false};
else if(path==='/comunidade/publicacoes')data={itens,proximo:null};
else if(path==='/comunidade/impacto')data={coletas:5,materiais:[{material:'plastico',quilos:6.8},{material:'aluminio',quilos:5.8},{material:'papel_misto',quilos:5.7},{material:'vidro_colorido',quilos:5.7},{material:'eletronicos',quilos:5.2}],meses:[{mes:'2026-11',quilos:29.2}]};
else if(path==='/comunidade/avisos')data={itens:[{id:1,publicacao_id:1,estado:'resposta',mensagem:'Seu comentário recebeu uma resposta.',lida:true,criado_em:'2026-11-04T12:00:00Z'}],proximo:null};
else if(path.includes('comentarios')||path==='/comunidade/notificacoes')data={itens:[],proximo:null};
return r.fulfill({json:data});});
await page.addInitScript(tipo=>sessionStorage.setItem('ciclo-certo:token:'+tipo,'token-sintetico-interceptado'),tipo);await page.goto('https://ciclo-certo.vercel.app/'+(tipo==='cooperativa'?'cooperador':'login'));await page.getByRole('button',{name:'Comunidade',exact:true}).filter({visible:true}).click();
await page.locator('.com-publicacao').first().waitFor();
assert.equal(await page.locator('.ws-conta-menu .botao-sair').isVisible(),false);
const conta=await page.locator('.ws-conta').boundingBox();assert.ok(conta.x>width/2,'Conta à direita');
await page.locator('.ws-conta summary').click();assert.ok(await page.locator('.ws-conta-menu .botao-sair').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.ws-conta-menu .botao-sair').isVisible(),false);
const post=page.locator('.com-publicacao').first();await post.locator('.com-mais-acoes summary').click();await post.getByRole('button',{name:'Excluir',exact:true}).scrollIntoViewIfNeeded();
const top=await post.locator('.com-publicacao-topo').boundingBox(),menu=await post.locator('.com-mais-acoes > div').boundingBox();assert.ok(menu.y>=top.y&&menu.x+menu.width<=width,'Menu dentro da tela');
assert.ok(await post.getByRole('button',{name:'Denunciar',exact:true}).isVisible());
const hit=await post.getByRole('button',{name:'Excluir',exact:true}).evaluate(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e.contains(hit);});assert.ok(hit,'Menu sem corte ou sobreposição');
await page.screenshot({path:`resultados-visuais/revisao-interface-producao/menu-${tipo}-${width}.png`});await page.keyboard.press('Escape');
await post.getByRole('button',{name:'0 comentários',exact:true}).click();
const area=await post.getByRole('textbox').boundingBox(),botao=await post.getByRole('button',{name:'Comentar',exact:true}).boundingBox();assert.ok(botao.y-area.y-area.height>=15,'Espaço entre textarea e botão');
await post.getByRole('button',{name:'Comentar',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`resultados-visuais/revisao-interface-producao/comentario-${tipo}-${width}.png`});
await page.getByRole('button',{name:'Notificações',exact:true}).click();await page.getByRole('button',{name:'Ver todas as notificações →'}).click();await page.getByRole('heading',{name:'Central de notificações'}).waitFor();
await page.getByRole('button',{name:'Mais',exact:true}).filter({visible:true}).click();assert.equal(await page.getByRole('dialog').getByRole('button',{name:'Notificações'}).count(),0);await page.getByRole('button',{name:'Meu impacto',exact:true}).click();await page.getByRole('term').first().waitFor();assert.equal(await page.locator('.com-materiais dd').count(),5);assert.ok(await page.getByText('Papel misto',{exact:true}).isVisible());
await page.screenshot({path:`resultados-visuais/revisao-interface-producao/impacto-${tipo}-${width}.png`});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sem rolagem horizontal');
await page.locator('.ws-conta summary').click();await page.locator('.botao-sair').click();await page.getByRole('button',{name:'Entrar',exact:true}).waitFor();console.log(`OK ${tipo} ${width}px`);await page.close();}
assert.deepEqual(erros,[]);console.log('Cinco ajustes aprovados, sem erros JS.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
