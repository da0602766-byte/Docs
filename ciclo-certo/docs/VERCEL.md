> **Comunidade — 04/11/2026:** integrada à versão em produção, preservando Mercado, Gestão e recuperação de senha. Fontes recuperadas da Vercel; 32 testes backend, 7 frontend e fluxo completo no navegador aprovados. Publicação concluída nos endereços oficiais, com dados preservados e moderação concedida a `da0602766@gmail.com`; detalhes em `ciclo-certo/.docs/comunidade.md`.

> **Publicado em 29/10/2026:** frontend e API atualizados na Vercel, incluindo o espaçamento de 24 px entre busca e coletas. API `dpl_gy9CQ22n5MGNCeQjBoPQDtc8FrQr`; frontend `dpl_4WrFftx5LZinLiJSFApSrmHJn4CC`. Publicação direta do código local, sem push ou commit.
> Migrações locais `20261029222158` e `20261029225256` registradas remotamente como `20261029231401` e `20261029231407`. Não reaplicar. A segunda associa fotos pelo nome do produto, sem depender de IDs gerados. Banco preserva 5 usuários e 3 coletas; catálogo contém 8 produtos.
> Saúde, catálogo, depoimentos, frontend e CORS aprovados; coletas sem sessão retornam 401. Login autenticado e gravações não foram testados em produção. SMTP não configurado: recuperação por e-mail está indisponível em produção; a caixa local permanece no preview. Permissão administrativa de expurgo não foi concedida a contas reais.
> As notas de entrega exclusivamente local abaixo são históricas.

> Atualização de 29/10/2026: versão `cb9cb24` publicada no frontend e na API da Vercel. Migração aplicada ao Supabase, preservando os 5 usuários, 1 coleta e 3 pesagens. Páginas públicas, catálogo, saúde, CORS e bloqueio sem token aprovados. Validação local: 20 testes backend, 3 frontend e build aprovados. Login em produção e câmera/assinatura em aparelho físico ainda pendentes. A revisão automática bloqueou o teste que criaria tokens para contas reais; ele não foi executado.
>
> A migração local `20261029023257_fluxo_coletas_recompensas.sql` foi registrada pelo MCP no histórico remoto como `20261029033020_fluxo_coletas_recompensas`: é a mesma migração, não reaplicar. As referências abaixo a entrega somente local ou produção antiga registram o estado anterior a esta publicação.

# Publicação na Vercel

**Migrações e publicação:** as melhorias descritas abaixo já foram implantadas. O histórico local foi alinhado aos oito IDs registrados em produção; não reaplique essas migrações antes de um deploy. Nenhuma migração é executada automaticamente por `main:app`. Confira o histórico remoto e aplique somente migrações novas quando houver evolução de schema. Regras e histórico em [melhorias-coletas](../.docs/melhorias-coletas.md). `main:app` continua sendo a entrada de produção; nunca publicar `preview_teste:app`.

Publicação concluída em 28/10/2026: dois projetos Vercel na equipe `projetos-fd50`, ligados a `da0602766-byte/Docs`, branch de produção `main`. O banco continua no Supabase. Variáveis de Production configuradas e builds remotos aprovados.

- Site: [ciclo-certo.vercel.app](https://ciclo-certo.vercel.app).
- Cooperativa: [ciclo-certo.vercel.app/cooperador](https://ciclo-certo.vercel.app/cooperador).
- Saúde da API: [ciclo-certo-api.vercel.app/saude](https://ciclo-certo-api.vercel.app/saude).
- Projetos: `ciclo-certo` (frontend) e `ciclo-certo-api` (backend).

## Projetos

| Configuração | Frontend | Backend |
|---|---|---|
| Root Directory | `ciclo-certo/frontend` | `ciclo-certo/backend` |
| Framework Preset | Vite | FastAPI |
| Install Command | `npm ci` | Automático: `requirements.txt` |
| Build Command | `npm run build` | Padrão do framework |
| Output Directory | `dist` | Padrão do framework |
| Entrada | `index.html` | `main.py`, objeto `app` |
| Runtime | Node compatível com Vite 7; validado em 24.20.0 | Python 3.13, definido em `.python-version` |

Não use a raiz inteira `Docs` como Root Directory. Cada pasta possui seu próprio `vercel.json`. O backend não usa `uvicorn` como comando de inicialização na Vercel: a plataforma carrega `main:app`.

## Variáveis

Cadastre em Settings → Environment Variables de cada projeto, para Production. Use os endereços reais atribuídos pela Vercel, sem caminhos.

| Projeto | Variável | Valor |
|---|---|---|
| Frontend | `VITE_API_URL` | Origem HTTPS pública do backend, por exemplo `https://SUA-API.vercel.app` |
| Backend | `ORIGEM_FRONTEND` | Origem HTTPS pública do frontend, por exemplo `https://SEU-FRONT.vercel.app` |
| Backend | `DATABASE_URL` | URL PostgreSQL do Supabase, com usuário restrito e senha, usando pooler de transações na porta **6543** |
| Backend | `CHAVE_DO_TOKEN` | Segredo JWT com pelo menos 32 caracteres; preserve o valor local para manter compatibilidade com os tokens atuais |
| Backend | `GEMINI_API_KEY` | Chave opcional do Gemini, provedor principal do assistente de materiais |
| Backend | `OPENROUTER_API_KEY` | Chave opcional do OpenRouter, usada como reserva ou como único provedor |

Para ativar o assistente em produção, cadastre pelo menos uma das chaves de IA como segredo em **Settings → Environment Variables → Production** no projeto `ciclo-certo-api`. As variáveis passam a valer em um novo deploy da API. A tela de agendamento também precisa da versão do frontend que inclui **Ajudar com os materiais**. [Documentação de variáveis da Vercel](https://vercel.com/docs/environment-variables).

No projeto Supabase atual, use o host `aws-0-us-east-2.pooler.supabase.com`, usuário `ciclo_certo_backend.plhfkhxzmxzyfygjyzbk` e banco `postgres`. A URL local já contém a senha; para a nuvem, troque somente a porta `5432` por `6543`, mantendo `postgresql+psycopg` e `sslmode=require`. A conexão nessa porta foi validada com TLS. Marque `DATABASE_URL` e `CHAVE_DO_TOKEN` como sensíveis no painel.

`VERCEL=1` é fornecida pela plataforma. Nesse ambiente a API usa `NullPool`, mantém prepared statements desativados e exige `ORIGEM_FRONTEND` HTTPS válida. Credenciais não recebem prefixo `VITE_`; esse prefixo expõe o valor ao navegador. Nenhum `.env` ou backup deve ser enviado ao GitHub. Os arquivos `.vercelignore` também os excluem de uploads via CLI.

### Credenciais opcionais da IA

Quando for implantar a integração, use **Settings → Environment Variables** apenas no projeto `ciclo-certo-api`. Cadastre `GEMINI_API_KEY` e/ou `OPENROUTER_API_KEY` como [Secret](https://vercel.com/docs/environment-variables/sensitive-environment-variables), no ambiente correspondente. Use `IA_PROVEDOR` para selecionar `gemini` ou `openrouter` e preencha `GEMINI_MODEL` ou `OPENROUTER_MODEL` com o identificador exato do modelo escolhido. `IA_HABILITADA=0` mantém o recurso desligado; habilite só após a implementação e os testes. As alterações de ambiente entram no próximo deploy. Use chaves distintas para testes e produção.

O arquivo `backend/.env` é da execução local. Nesta preparação, nenhuma variável foi alterada na Vercel e nenhum deploy foi feito. Veja [plano de IA](../.docs/ia.md).

## Ordem de configuração

1. Importe o repositório duas vezes, usando as pastas e presets da tabela. Identifique os domínios de produção dos dois projetos. Um primeiro build sem as variáveis obrigatórias será recusado intencionalmente.
2. Cadastre as três variáveis do backend, incluindo a origem exata do frontend, e publique a API.
3. Confirme que `https://SUA-API.vercel.app/saude` responde `{"status":"ok"}`. Essa rota verifica a aplicação, não a disponibilidade do banco.
4. Cadastre `VITE_API_URL` no frontend e publique. Mudanças nessa variável exigem novo build.
5. Verifique `/`, `/login` e `/cooperador`, inclusive atualizando a página. O rewrite mantém as rotas da SPA funcionando.
6. Entre com uma conta existente e consulte suas coletas para validar API, CORS e banco. Não crie registros fictícios no banco de uso normal.

Para Preview, use banco e credenciais de teste e configure a origem exata do frontend de teste. Não libere `*.vercel.app` no CORS. Se a API de Preview usar Deployment Protection, o frontend separado também precisará de um acesso de teste autorizado; essa proteção não é alterada pelo código.

## Atualização da Cici e da Comunidade em 12/11/2026

- API `dpl_D2iAjyvzKaGr73sXvrAB6sduWYko` e frontend `dpl_AtettB6zcm2VpfGQiCcLtmAcZqSo` promovidos para os domínios oficiais. Deploy a partir da cópia de trabalho via Vercel CLI.
- Migração `20261112223151_endereco_preferido_morador` aplicada no Supabase. A coluna de endereço está na tabela protegida por RLS e sem leitura direta pelos papéis `anon` e `authenticated`.
- A atualização inclui o carrossel, endereço de retirada, troca de assunto na Cici, navegação móvel no topo, leitura dos avisos pelo sino, animação das respostas e moderação de texto da Comunidade.

## Assistente de materiais em produção

Publicado em 11/11/2026 via Vercel CLI a partir da cópia local, sem push. Os segredos `GEMINI_API_KEY` e `OPENROUTER_API_KEY` estão em **Production** no projeto `ciclo-certo-api`. A publicação não exige migração.

- API `dpl_AehAhvHqFXZTg9PpFhkYDFeJEmbg` com `POST /ia/sugestao-materiais` no OpenAPI, saúde 200, autenticação obrigatória e CORS para o site oficial.
- Frontend `dpl_7M3MZH6UeDyDM9mJ6qFhAVNWqPac` com o botão **Ajudar com os materiais** em **Agendar**. Em navegador, o site publicado preservou o texto após erro e aplicou a sugestão após revisão com respostas simuladas em 390 e 1440 px.
- As chamadas reais com Gemini e OpenRouter foram verificadas na API local. O teste no site publicado usou sessão simulada e não criou coletas.

## Contas de cooperativa

O cadastro público de cooperativa é bloqueado pela API quando `VERCEL=1`. O build de produção também oculta essa opção na página `/cooperador`; o login de contas existentes continua disponível. Moradores podem se cadastrar normalmente. Novas contas de cooperativa devem ser aprovadas pela administração. No exercício local com Vite em desenvolvimento e API fora da Vercel, permanece o cadastro dos dois perfis.

## Validação executada

- Build Vite de produção aprovado.
- Teste de configuração do frontend aprovado: URL HTTPS pública obrigatória na Vercel.
- Navegador headless: início, login, cooperador e recarga funcionando no build; sem erros JavaScript.
- Três testes do backend aprovados: saúde, CORS exato, recusa de origem inválida, `NullPool` e bloqueio de cadastro público de cooperativa. Sem gravar dados reais.
- Pooler Supabase na porta 6543 validado com TLS e leitura dos quatro usuários existentes.
- Builds remotos dos dois projetos em READY; páginas públicas e recarga com HTTP 200.
- Saúde 200, acesso sem token 401, preflight CORS permitido 200 e origem externa recusada 400.
- Edge headless: os dois perfis consultaram a API e exibiram os dados do Supabase, sem erros JavaScript. Sessões temporárias somente em memória; nenhum registro alterado. Login por senha e gravações não foram exercitados em produção.
- Detalhes em [validação](../.docs/validacao.md).

Comandos de teste:

```powershell
# Em ciclo-certo/frontend
node --test testes/publicacao.test.js
npm run build
node testes/publicacao.interface.cjs

# Em ciclo-certo/backend
..\venv\Scripts\python.exe -m unittest teste_publicacao -v
```

Referências: [Vite e rotas SPA](https://vercel.com/docs/frameworks/frontend/vite), [FastAPI na Vercel](https://vercel.com/docs/frameworks/backend/fastapi), [runtime Python](https://vercel.com/docs/functions/runtimes/python), [SQLAlchemy e pooler Supabase](https://supabase.com/kb/troubleshooting/using-sqlalchemy-with-supabase-FUqebT).
