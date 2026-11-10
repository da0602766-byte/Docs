const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=`<html lang="pt-BR"><link rel="stylesheet" href="/fontes/fontes.css"><meta name="viewport" content="width=device-width, initial-scale=1"><div id="root"></div><script type="module">
import React from '/node_modules/.vite/deps/react.js';
import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';const {createRoot}=ReactDOM;
import {Navegacao} from '/src/visual.jsx';
import Comunidade from '/src/operacao/Comunidade.jsx';
import AvisosComunidade from '/src/operacao/AvisosComunidade.jsx';
import {Impacto,CentralAvisos} from '/src/operacao/Participacao.jsx';
import '/src/styles.css';import '/src/ajustes.css';import '/src/refinamentos.css';import '/src/comunidade.css';
const perfil={id:1,nome:'Mateus Vilmar',tipo:new URLSearchParams(location.search).get('tipo')||'morador'};
function Tela(){const [tela,setTela]=React.useState('comunidade');return React.createElement('div',{className:'ws'},React.createElement(AvisosComunidade,{perfil},React.createElement(Navegacao,{perfil,tela,aoMudarTela:setTela,aoSair:()=>window.saiu=true,abrirAviso:()=>{},}),React.createElement('main',{id:'conteudo',className:'ws-container ws-main'},tela==='impacto'?React.createElement(Impacto):tela==='avisos'?React.createElement(CentralAvisos,{abrir:()=>{}}):React.createElement(Comunidade,{perfil}))));}
createRoot(document.getElementById('root')).render(React.createElement(Tela));</script></html>`;
const itens=[1,2,3].map(id=>({id,autor:{nome:'Mateus Vilmar',perfil:'morador'},criado_em:'2026-11-04T12:00:00Z',categoria:'Plantio',estado:'aprovada',pontos:10,conteudo:'Muito boa essa sua ideia. Vamos separar os materiais para a próxima coleta.',comentarios:0,pode_excluir:true,minha:true,publica:false}));
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});const erros=[];fs.mkdirSync('resultados-visuais/revisao-interface',{recursive:true});try{
for(const [width,tipo] of [320,390,673,960,1440,1920].flatMap(w=>[[w,"morador"],[w,"cooperativa"]])){
const page=await browser.newPage({viewport:{width,height:800}});page.setDefaultTimeout(10000);page.on('pageerror',e=>{erros.push(e.message);console.error(e.message)});
await page.route('**/__qa*',r=>r.fulfill({contentType:'text/html',body:html}));
await page.route('http://127.0.0.1:8000/**',r=>{const path=new URL(r.request().url()).pathname;let data=[];
if(path==='/comunidade/resumo') data={saldo:20,usadas_dia:2,limite_dia:3,categorias:['Plantio'],moderador:false};
else if(path==='/comunidade/publicacoes')data={itens,proximo:null};
else if(path==='/comunidade/impacto')data={coletas:5,materiais:[{material:'plastico',quilos:6.8},{material:'aluminio',quilos:5.8},{material:'papel_misto',quilos:5.7},{material:'vidro_colorido',quilos:5.7},{material:'eletronicos',quilos:5.2}],meses:[{mes:'2026-11',quilos:29.2}]};
else if(path==='/comunidade/avisos')data={itens:[{id:1,publicacao_id:1,estado:'resposta',mensagem:'Seu comentário recebeu uma resposta.',lida:true,criado_em:'2026-11-04T12:00:00Z'}],proximo:null};
else if(path.includes('comentarios')||path==='/comunidade/notificacoes')data={itens:[],proximo:null};
return r.fulfill({json:data});});
await page.goto('http://127.0.0.1:5180/__qa?tipo='+tipo);
await page.locator('.com-publicacao').first().waitFor();
assert.equal(await page.locator('.ws-conta-menu .botao-sair').isVisible(),false);
const conta=await page.locator('.ws-conta').boundingBox();assert.ok(conta.x>width/2,'Conta à direita');
await page.locator('.ws-conta summary').click();assert.ok(await page.locator('.ws-conta-menu .botao-sair').isVisible());await page.keyboard.press('Escape');assert.equal(await page.locator('.ws-conta-menu .botao-sair').isVisible(),false);
const post=page.locator('.com-publicacao').first();await post.locator('.com-mais-acoes summary').click();await post.getByRole('button',{name:'Excluir',exact:true}).scrollIntoViewIfNeeded();
const top=await post.locator('.com-publicacao-topo').boundingBox(),menu=await post.locator('.com-mais-acoes > div').boundingBox();assert.ok(menu.y>=top.y&&menu.x+menu.width<=width,'Menu dentro da tela');
assert.ok(await post.getByRole('button',{name:'Denunciar',exact:true}).isVisible());
const hit=await post.getByRole('button',{name:'Excluir',exact:true}).evaluate(e=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e.contains(hit);});assert.ok(hit,'Menu sem corte ou sobreposição');
await page.screenshot({path:`resultados-visuais/revisao-interface/menu-${tipo}-${width}.png`});await page.keyboard.press('Escape');
await post.getByRole('button',{name:'0 comentários',exact:true}).click();
const area=await post.getByRole('textbox').boundingBox(),botao=await post.getByRole('button',{name:'Comentar',exact:true}).boundingBox();assert.ok(botao.y-area.y-area.height>=15,'Espaço entre textarea e botão');
await post.getByRole('button',{name:'Comentar',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:`resultados-visuais/revisao-interface/comentario-${tipo}-${width}.png`});
await page.getByRole('button',{name:'Notificações',exact:true}).click();await page.getByRole('button',{name:'Ver todas as notificações →'}).click();await page.getByRole('heading',{name:'Central de notificações'}).waitFor();
await page.getByRole('button',{name:'Mais',exact:true}).filter({visible:true}).click();assert.equal(await page.getByRole('dialog').getByRole('button',{name:'Notificações'}).count(),0);await page.getByRole('button',{name:'Meu impacto',exact:true}).click();await page.getByRole('term').first().waitFor();assert.equal(await page.locator('.com-materiais dd').count(),5);assert.ok(await page.getByText('Papel misto',{exact:true}).isVisible());
await page.screenshot({path:`resultados-visuais/revisao-interface/impacto-${tipo}-${width}.png`});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'Sem rolagem horizontal');
await page.locator('.ws-conta summary').click();await page.locator('.botao-sair').click();assert.ok(await page.evaluate(()=>window.saiu));console.log(`OK ${tipo} ${width}px`);await page.close();}
assert.deepEqual(erros,[]);console.log('Cinco ajustes aprovados, sem erros JS.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
