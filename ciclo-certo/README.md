> **Kit de equipamentos publicado em 04/11/2026:** em Pedidos, abrir a coleta e usar Preparar kit e assumir; dez equipamentos, atalho de kit essencial e revisão pelo responsável. [Operação e validação](.docs/equipamentos.md).

> **Comunidade — 04/11/2026:** integrada à versão em produção, preservando Mercado, Gestão e recuperação de senha. Fontes recuperadas da Vercel; 32 testes backend, 7 frontend e fluxo completo no navegador aprovados. Publicação concluída nos endereços oficiais, com dados preservados e moderação concedida a `da0602766@gmail.com`; detalhes em `ciclo-certo/.docs/comunidade.md`.

> **Publicado em 29/10/2026:** frontend e API atualizados na Vercel, incluindo o espaçamento de 24 px entre busca e coletas. API `dpl_gy9CQ22n5MGNCeQjBoPQDtc8FrQr`; frontend `dpl_4WrFftx5LZinLiJSFApSrmHJn4CC`. Publicação direta do código local, sem push ou commit.
> Migrações locais `20261029222158` e `20261029225256` registradas remotamente como `20261029231401` e `20261029231407`. Não reaplicar. A segunda associa fotos pelo nome do produto, sem depender de IDs gerados. Banco preserva 5 usuários e 3 coletas; catálogo contém 8 produtos.
> Saúde, catálogo, depoimentos, frontend e CORS aprovados; coletas sem sessão retornam 401. Login autenticado e gravações não foram testados em produção. SMTP não configurado: recuperação por e-mail está indisponível em produção; a caixa local permanece no preview. Permissão administrativa de expurgo não foi concedida a contas reais.
> As notas de entrega exclusivamente local abaixo são históricas.

> **Nova evolução local (29/10/2026): loja de recompensas e painel de gestão. Não publicada.**
> Pontos são usados exclusivamente em produtos/cupons fictícios. Conversão e resgate em dinheiro foram removidos.
> Refinamento local: sino com atualização automática, avisos temporários, catálogo editável com fotos, listas compactas, detalhes e avaliações redesenhados. Recuperação de senha usa caixa de saída local, conforme solicitado. Validação: 24 testes de API, 7 de frontend e build aprovados.
> Execute a demonstração isolada conforme [.docs/mercado-gestao.md](.docs/mercado-gestao.md). O `.env` antigo aponta para produção: use `preview_teste:app` para revisar esta entrega.
> As notas de publicação e regras monetárias abaixo são históricas e não descrevem esta evolução local.

> Atualização de 29/10/2026: versão `cb9cb24` publicada no frontend e na API da Vercel. Migração aplicada ao Supabase, preservando os 5 usuários, 1 coleta e 3 pesagens. Páginas públicas, catálogo, saúde, CORS e bloqueio sem token aprovados. Validação local: 20 testes backend, 3 frontend e build aprovados. Login em produção e câmera/assinatura em aparelho físico ainda pendentes. A revisão automática bloqueou o teste que criaria tokens para contas reais; ele não foi executado.
>
> A migração local `20261029023257_fluxo_coletas_recompensas.sql` foi registrada pelo MCP no histórico remoto como `20261029033020_fluxo_coletas_recompensas`: é a mesma migração, não reaplicar. As referências abaixo a entrega somente local ou produção antiga registram o estado anterior a esta publicação.

# Ciclo Certo

Aplicação de agendamento e confirmação de coletas, com FastAPI, React/Vite e PostgreSQL. O repositório DOCs contém o projeto em `ciclo-certo/`.

**Evolução local implementada:** calendários com horários, responsabilidade do cooperador, pesagens editáveis, foto e assinatura, cancelamento com aviso, avaliação, carteira fictícia e edição de perfil. [Etapas, regras e validação](.docs/melhorias-coletas.md).

A publicação em [ciclo-certo.vercel.app](https://ciclo-certo.vercel.app), com API em [ciclo-certo-api.vercel.app](https://ciclo-certo-api.vercel.app/saude), ainda corresponde à versão anterior. As melhorias desta entrega não foram enviadas ao GitHub nem implantadas. [Operação da publicação](docs/VERCEL.md).

## Fluxo atual

1. Morador escolhe um dia/horário disponível e informa endereço e materiais; sugestões de categorias e avisos de cuidado ajudam no preenchimento.
2. Cooperador abre a coleta e confirma sua responsabilidade em um formulário compacto.
3. O responsável registra, corrige ou remove pesos durante o atendimento.
4. O solicitante confere os pesos e assina; foto e assinatura são obrigatórias para finalizar. Depois disso os pesos ficam bloqueados.
5. A avaliação é solicitada automaticamente nas notificações do morador; o responsável pode reenviar o aviso.
6. Qualquer nota libera a mesma recompensa. No modo padrão, os pontos são convertidos automaticamente em dinheiro fictício; também é possível acumular pontos e gerar um vale fictício.

O responsável pode cancelar por ausência do morador ou outro impedimento, informando o motivo. O morador recebe o aviso na própria conta. Não há mensageria externa, pagamento ou saque real.

A referência inicial divide o preço médio de cada faixa em 50% para o morador e 50% para a cooperativa, configurável. **100 pontos = R$ 1 fictício.** Valores detalhados e equivalências estão no catálogo da API e na [regra de conversão](.docs/melhorias-coletas.md). O preço não é uma cotação em tempo real. A cartilha original permanece em [docs/CARTILHA.md](docs/CARTILHA.md).

## Instalação e execução com banco configurado

Use Python 3.13 ou superior e Node compatível com Vite 7. Comandos a partir de `ciclo-certo/`:

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r backend/requirements.txt
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.exemplo backend/.env }
```

Configure `DATABASE_URL`, `CHAVE_DO_TOKEN` (ao menos 32 caracteres) e `ORIGEM_FRONTEND=http://127.0.0.1:5175` no `.env`. A conexão deve usar `postgresql+psycopg`, o pooler de sessão para execução local, e SSL. Preserve credenciais existentes; nunca copie segredos para o frontend.

O projeto de produção documentado usa Supabase `plhfkhxzmxzyfygjyzbk`, com papel restrito `ciclo_certo_backend`. Este clone não contém o `.env` de produção. Não recrie tabelas em um banco existente.

**Migrações:** os oito arquivos em `supabase/migrations/` correspondem ao histórico já aplicado em produção, com os mesmos IDs. Não reaplique essas migrações no banco existente. Para evoluções futuras, crie uma nova migração e confira o histórico remoto antes de executá-la. O script `backend/criar_tabelas.py` prepara o histórico completo apenas em um `public` vazio, exigindo os papéis previamente provisionados. Histórico MySQL em `backend/legado/mysql/`.

Inicie a API:

```powershell
cd backend
..\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Em outro terminal, a partir de `ciclo-certo/`:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Abra [morador](http://127.0.0.1:5175/login), [cooperador](http://127.0.0.1:5175/cooperador) ou [Swagger](http://127.0.0.1:8000/docs). Se mudar a porta, ajuste CORS. `VITE_API_URL` altera a URL da API; por padrão é `http://127.0.0.1:8000`.

Cadastro público de cooperativa continua limitado ao ambiente local. Na Vercel, novas contas de cooperativa exigem liberação administrativa. Moradores podem atualizar e-mail/senha no perfil, com confirmação da senha atual e encerramento dos tokens antigos.

As sessões ficam em `sessionStorage`, separadas por aba e perfil. É possível abrir `/login` e `/cooperador` ao mesmo tempo, com uma conta diferente em cada aba. Recarregar preserva a sessão; sair ou expirar em uma aba não encerra a outra. A sessão compartilhada antiga em `localStorage` não é reutilizada: após esta atualização, entre novamente em cada perfil. Fechar a aba encerra sua sessão. A API continua verificando o tipo real da conta.

Regressão de sessões simultâneas: `node --test testes/sessao.test.js testes/listagem.test.js testes/publicacao.test.js`, na pasta `frontend`. Sete testes passaram, incluindo isolamento entre perfis, recarga, saída, expiração e resposta 401 atrasada; build aprovado. Testes usam respostas simuladas, sem credenciais reais.

## Testes locais isolados

A suíte usa PostgreSQL portátil de teste, nunca o Supabase de uso normal. A partir de `ciclo-certo/`:

```powershell
npm install --prefix .test-infra --save-exact embedded-postgres@17.10.0-beta.17
node scripts/postgres-teste.mjs
```

O banco escuta somente em `127.0.0.1:55439`. Credencial aleatória e dados ficam em `.test-infra/`, ignorada pelo Git. Se o gerenciador bloquear scripts de instalação, revise e permita apenas o pacote de binários da plataforma; não desative proteções globalmente.

Em outro terminal:

```powershell
cd backend
..\venv\Scripts\python.exe -m unittest teste_operacao teste_publicacao -v
```

A suíte cria schemas descartáveis, aplica baseline e migração, verifica preservação e RLS e executa a API com o papel restrito. Remove apenas os schemas criados pelo próprio teste. **20 testes passaram**; inclui concorrência por vaga, responsável, avaliação e resgate, comprovação obrigatória, isolamento, precisão e revogação de sessões. A suíte da pontuação antiga está arquivada em `backend/legado/fluxo_v1/`.

No frontend:

```powershell
node --test testes/publicacao.test.js
npm run build
```

Os scripts antigos de comparação visual com API simulada não cobrem o fluxo novo. A verificação manual e suas limitações estão em `.docs/melhorias-coletas.md`.

### Prévia de demonstração

Com o PostgreSQL portátil em execução, inicie a API de teste:

```powershell
cd backend
..\venv\Scripts\python.exe -m uvicorn preview_teste:app --host 127.0.0.1 --port 8001
```

Em outro terminal, na pasta `frontend/`:

```powershell
$env:VITE_API_URL = 'http://127.0.0.1:8001'
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Esse módulo usa exclusivamente `ciclo_certo_teste_local`, cria `morador@example.org` e `cooperador@example.org` com senha `TesteLocal123!` e não deve ser implantado. Os dados são fictícios. `main:app` continua sendo a entrada de produção.

## API e arquitetura

- Público: `POST /usuarios`, `POST /login`, `GET /catalogo`, `GET /saude`.
- Autenticado: `GET/PATCH /usuarios/eu`, `GET /agenda`, `GET /coletas`, `GET /coletas/{id}`, `GET /coletas/{id}/pesagens`.
- Morador: `POST /coletas`, `POST /coletas/{id}/avaliar`, `GET /carteira`, `PUT /carteira/preferencia`, `POST /carteira/resgatar`.
- Cooperador: `PUT /agenda`, `POST /coletas/{id}/assumir`; somente o responsável usa `POST/PUT/DELETE .../pesagens`, `POST .../finalizar`, `POST .../cancelar` e `POST .../solicitar-avaliacao`.
- Privado: `GET /coletas/{id}/comprovante` (morador dono ou responsável), `GET /notificacoes`, `PUT /notificacoes/{id}/lida` (dono).

Rotas chamam serviços; serviços aplicam autorização e transações; repositórios concentram SQLAlchemy. `operacao.py` reúne o novo fluxo em cada camada. Frontend separado em componentes de agenda, listagem, detalhe, carteira e perfil. [Modelo de dados](docs/DER.md).

JWT HS256 com `sub`, `exp` e versão de sessão, senha Argon2, CORS de origem exata, dados privados protegidos por API e RLS. Créditos/resgates são transacionais e idempotentes. Imagens não possuem URL pública. `.env`, ambientes, dependências, testes locais e builds ficam fora do Git.

Regras de trabalho em [REGRAS.md](REGRAS.md); continuidade em [.docs/proximos-passos.md](.docs/proximos-passos.md). O agente de IA permanece planejado, sem chamadas a provedores.
