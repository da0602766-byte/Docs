> **Publicado em 29/10/2026:** frontend e API atualizados na Vercel, incluindo o espaçamento de 24 px entre busca e coletas. API `dpl_gy9CQ22n5MGNCeQjBoPQDtc8FrQr`; frontend `dpl_4WrFftx5LZinLiJSFApSrmHJn4CC`. Publicação direta do código local, sem push ou commit.
> Migrações locais `20261029222158` e `20261029225256` registradas remotamente como `20261029231401` e `20261029231407`. Não reaplicar. A segunda associa fotos pelo nome do produto, sem depender de IDs gerados. Banco preserva 5 usuários e 3 coletas; catálogo contém 8 produtos.
> Saúde, catálogo, depoimentos, frontend e CORS aprovados; coletas sem sessão retornam 401. Login autenticado e gravações não foram testados em produção. SMTP não configurado: recuperação por e-mail está indisponível em produção; a caixa local permanece no preview. Permissão administrativa de expurgo não foi concedida a contas reais.
> As notas de entrega exclusivamente local abaixo são históricas.

# Loja e gestão — entrega local de 29/10/2026

Esta evolução não foi publicada, enviada ao GitHub ou aplicada ao Supabase remoto. As alterações prévias em package.json, package-lock.json, validacao.md e entregas/qa_ia foram preservadas.

## Impacto e decisões

- Mantida a arquitetura rota → serviço → repositório → PostgreSQL. Novos módulos `mercado` concentram as trocas e operações de gestão. React mantém formulário selecionado separado dos dados atualizados em segundo plano.
- Avaliação sempre credita pontos. Removidos os contratos de preferência monetária e conversão. Saldo monetário fictício anterior é incorporado a pontos pela migração, na equivalência anterior de um centavo por ponto; registros históricos permanecem auditáveis e novos centavos são proibidos no banco.
- Oito produtos/cupons fictícios possuem descrição, categoria, preço e estoque. Trocas salvam preço e nome contratados. Carteira e produto são bloqueados na mesma transação, nessa ordem, com chave idempotente para tentativas repetidas.
- A aplicação representa uma única cooperativa. A listagem de usuários é restrita ao perfil cooperativa e nunca retorna senha/hash. Não foi introduzido suporte a múltiplas organizações.
- Administrador é uma permissão separada, falsa por padrão e não concedida pelo cadastro. Somente a conta fictícia `cooperador@example.org` do preview recebe essa permissão. Futuras permissões de produção exigem provisionamento administrativo separado.
- Depoimentos exigem consentimento explícito do morador e seleção do cooperador. A página pública mostra comentário e nota, identificados como “Morador da comunidade”. Avaliações antigas não recebem consentimento retroativo. Publicar e retirar são ações distintas da recompensa.
- Fluxos: pendentes (`agendada`), aceitas (`em_coleta`), histórico (`aguardando_avaliacao`, `coletada`, `cancelada`). O calendário permite consultar o dia e alterar capacidade por horário. A lista abre detalhes em diálogo com foco e Escape gerenciados pelo navegador.
- Expurgo remove definitivamente coleta, pesagens, comprovantes, avisos e depoimento. Preserva pontos creditados e pedidos, desvinculando o extrato. Avaliações pendentes não podem ser apagadas. A API exige administrador e confirmação `APAGAR <id>`.
- Sino no cabeçalho usa polling serial a cada três segundos enquanto o cooperador está conectado, inclusive nas outras telas e no perfil. Não é push/WebSocket: há até três segundos mais a latência da rede. Pop-up desaparece após seis segundos; as últimas 30 notificações ficam no sino durante a sessão da página. A lista de coletas atualiza a cada cinco segundos. Falhas acionam reconexão automática. Volume alto exigirá paginação e um feed incremental.

## Refinamento após os comentários de interface

- Coordenadores criam e editam nome, descrição, categoria, pontos, estoque, foto e disponibilidade em Mercado. Ocultar um produto impede novos resgates, preservando trocas anteriores. Preço e estoque são validados no servidor; moradores não acessam a edição.
- Oito fotografias locais ilustram o catálogo fictício; o seletor de fotos usa essa biblioteca. Origens registradas em `frontend/public/imagens/produtos/sources.json`. Upload de novas fotos não faz parte desta entrega.
- Listas de coletas compactas, detalhes com identificação, endereço, horário, contato, responsável, materiais e pontos organizados. O diálogo evita repetir títulos e navegação.
- Avaliações receberam estrelas, comentário destacado e estado de publicação. A tabela monetária saiu do agendamento; a página pública mantém somente uma explicação de pontos por quilo.
- Recuperação começa em “Esqueci minha senha”, informando somente o e-mail. A troca exige o link temporário enviado a esse endereço. Tokens aleatórios têm expiração de 20 minutos, uso único, hash no banco e revogação das sessões antigas; solicitações da mesma conta têm intervalo de um minuto. Respostas não revelam se o endereço existe. Referência: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- Conforme escolha do usuário, o preview grava mensagens `.eml` em `.test-infra/emails/`; abra a mensagem para usar o link local. Nenhum e-mail externo é enviado. SMTP permanece opcional e não configurado; os campos estão em `backend/.env.exemplo`. Fora do preview, sem SMTP, a API informa indisponibilidade. Antes de habilitar a entrega pública, ainda é necessário validar o provedor e configurar limitação de requisições por origem.

## Executar sem produção

O `.env` existente pode apontar para produção. Para esta revisão, use exclusivamente o módulo de preview abaixo, que fixa a conexão no banco `ciclo_certo_teste_local` em 127.0.0.1. As migrações novas são `supabase/migrations/20261029222158_mercado_gestao_local.sql` e `supabase/migrations/20261029225256_refinamento_interface_recuperacao.sql`, criadas pela CLI oficial. O preview aplica as migrações incrementais ausentes somente no banco isolado.

No primeiro terminal, a partir de `ciclo-certo`:

```powershell
npm install --prefix .test-infra --save-exact embedded-postgres@17.10.0-beta.17
node scripts/postgres-teste.mjs
```

Foi necessário usar PostgreSQL 17: o binário 18 instalado falhava no initdb deste Windows com exceção 0xC0000005. O banco portátil escuta somente em 127.0.0.1:55439. Não use um diretório de dados de outra versão principal.

No segundo terminal:

```powershell
cd backend
..\venv\Scripts\python.exe preparar_demo.py
..\venv\Scripts\python.exe -m uvicorn preview_teste:app --host 127.0.0.1 --port 8001
```

`preparar_demo.py` é opcional e não altera contas que já tenham coletas. Ele prepara dados fictícios por meio dos serviços reais: três coletas e 3.000 pontos. Não deve ser implantado.

No terceiro terminal:

```powershell
cd frontend
$env:VITE_API_URL = 'http://127.0.0.1:8001'
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

- Morador: http://127.0.0.1:5175/login — `morador@example.org`
- Administrador fictício: http://127.0.0.1:5175/cooperador — `cooperador@example.org`
- Senha de ambas as contas locais: `TesteLocal123!`
- A chave de sessão do preview muda ao reiniciar a API; entre novamente depois de reiniciá-la.

## Verificação

- 24 testes de API aprovados em PostgreSQL descartável: fluxo, isolamento, concorrência da última vaga, avaliação única, concorrência do saldo e da última unidade, idempotência, conversão removida, moderação consentida, autorização administrativa, expurgo, preservação do saldo da migração, edição autorizada de produtos e recuperação com expiração, uso único concorrente e revogação de sessões.
- Sete testes existentes do frontend aprovados e build Vite concluído.
- Navegador com API e banco locais: login dos dois perfis, loja, resgate com redução de saldo/estoque, histórico de trocas, detalhes em modal, usuários, calendário e moderação.
- Refinamento verificado no navegador: oito fotos carregadas, lista compacta, recuperação via fragmento em StrictMode, nova solicitação gerando pop-up, desaparecimento automático e consulta posterior no sino. Corrigida leitura do token durante a dupla inicialização do React em desenvolvimento. Loja conferida a 390 pixels sem transbordamento horizontal.
- Layout inspecionado em larguras 1440, 390 e 320 pixels, sem transbordamento horizontal nos cenários medidos. Não equivale a teste em todos os aparelhos físicos.
- Revisão encontrou e corrigiu diferença de timezone na resposta idempotente, substituição indevida de nomes de coluna pelo harness de migração, acentuação, identificadores duplicados de diálogos e cálculo adiado do contador de notificações.
- Câmera e assinatura em aparelho físico continuam pendentes da revisão anterior. A operação nova não foi validada em produção.

Para repetir os testes, com o PostgreSQL local ativo:

```powershell
cd backend
..\venv\Scripts\python.exe -m unittest teste_operacao teste_publicacao -v
cd ../frontend
node --test testes/sessao.test.js testes/listagem.test.js testes/publicacao.test.js
npm run build
```
