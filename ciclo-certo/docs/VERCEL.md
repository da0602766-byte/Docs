# Publicação na Vercel

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

No projeto Supabase atual, use o host `aws-0-us-east-2.pooler.supabase.com`, usuário `ciclo_certo_backend.plhfkhxzmxzyfygjyzbk` e banco `postgres`. A URL local já contém a senha; para a nuvem, troque somente a porta `5432` por `6543`, mantendo `postgresql+psycopg` e `sslmode=require`. A conexão nessa porta foi validada com TLS. Marque `DATABASE_URL` e `CHAVE_DO_TOKEN` como sensíveis no painel.

`VERCEL=1` é fornecida pela plataforma. Nesse ambiente a API usa `NullPool`, mantém prepared statements desativados e exige `ORIGEM_FRONTEND` HTTPS válida. Credenciais não recebem prefixo `VITE_`; esse prefixo expõe o valor ao navegador. Nenhum `.env` ou backup deve ser enviado ao GitHub. Os arquivos `.vercelignore` também os excluem de uploads via CLI.

## Ordem de configuração

1. Importe o repositório duas vezes, usando as pastas e presets da tabela. Identifique os domínios de produção dos dois projetos. Um primeiro build sem as variáveis obrigatórias será recusado intencionalmente.
2. Cadastre as três variáveis do backend, incluindo a origem exata do frontend, e publique a API.
3. Confirme que `https://SUA-API.vercel.app/saude` responde `{"status":"ok"}`. Essa rota verifica a aplicação, não a disponibilidade do banco.
4. Cadastre `VITE_API_URL` no frontend e publique. Mudanças nessa variável exigem novo build.
5. Verifique `/`, `/login` e `/cooperador`, inclusive atualizando a página. O rewrite mantém as rotas da SPA funcionando.
6. Entre com uma conta existente e consulte suas coletas para validar API, CORS e banco. Não crie registros fictícios no banco de uso normal.

Para Preview, use banco e credenciais de teste e configure a origem exata do frontend de teste. Não libere `*.vercel.app` no CORS. Se a API de Preview usar Deployment Protection, o frontend separado também precisará de um acesso de teste autorizado; essa proteção não é alterada pelo código.

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
