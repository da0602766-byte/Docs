# Arquitetura

`React → HTTP → rota/esquema → serviço → repositório → modelo/SQLAlchemy → PostgreSQL no Supabase`.

Atualização de 28/10/2026: `DATABASE_URL` é obrigatória e usa PostgreSQL via psycopg e pooler de sessão com TLS na execução local. O backend não tem fallback ou dependência MySQL. Frontend e API estão publicados na Vercel, mantendo a execução local disponível. A migração não transfere a autenticação para Supabase Auth.

Publicação Vercel concluída: dois projetos, com raízes `ciclo-certo/frontend` e `ciclo-certo/backend`, apontando para o mesmo repositório. Na nuvem, `NullPool` evita reter conexões, usa-se o pooler de transações na porta 6543 e o CORS exige a origem HTTPS exata. `/saude` verifica a aplicação sem consultar dados. Cadastro público de cooperativa é bloqueado na Vercel. Guia e endereços em `docs/VERCEL.md`.

| Parte | Responsabilidade |
|---|---|
| `frontend/src/App.jsx` | Login, navegação por perfil e quatro telas. |
| `frontend/src/PaginaInicial.jsx` | Apresentação pública adaptada do ZIP; encaminha para login. |
| `frontend/src/visual.jsx` | Ícones, navegação responsiva, situação e tabela informativa de pontos. |
| `frontend/src/styles.css` e `ajustes.css` | Base visual do ZIP e integração com as telas reais. |
| `frontend/src/api.js` | fetch, token e tratamento de falhas; login por formulário. |
| `backend/rotas/` | HTTP, Depends, status e tradução de exceções. |
| `backend/esquemas/` | Entrada e saída Pydantic; senha não integra saída. |
| `backend/servicos/` | Regras, autorização por dono e cálculos. |
| `backend/repositorios/` | Consultas/transações; sessão como primeiro argumento. |
| `backend/modelos/` | Colunas, índices e integridade; veja `docs/DER.md`. |

Rotas chamam serviços; serviços chamam repositórios. Repositórios não importam serviços; falhas técnicas podem usar exceções comuns, traduzidas no serviço. Somente rotas escolhem status HTTP.

## Infraestrutura

- `frontend/public/`: fotos/fontes locais, créditos e licenças.
- `frontend/testes/visual.cjs`: Playwright com API simulada e capturas responsivas, sem escrita no banco real.

- `configuracao.py`: único leitor de .env e origem CORS exata.
- `banco.py`: engine, Base e sessão por requisição, encerrada no finally.
- `seguranca.py`: Argon2 e JWT HS256 com sub e exp.
- `rotas/autenticacao.py`: /login e dependências compartilhadas, conforme aulas 8 e 9.
- `main.py`: monta aplicação e routers, sem rotas de recursos.
- `legado/mysql/`: arquivos e histórico Alembic anteriores, arquivados para consulta e fora da execução atual.
- `supabase/estrutura.sql`: baseline PostgreSQL registrado no histórico do projeto Supabase, com RLS e privilégios do backend.
- `criar_tabelas.py`: alternativa transacional para PostgreSQL vazio, com conexão administrativa e papel do backend previamente provisionado; recusa tabelas existentes.
- `teste_banco.py`: testes em banco descartável, sem contas na aplicação.

## Consistência

Três tabelas PostgreSQL com chaves estrangeiras, índices, CHECKs e RLS. Somente o usuário restrito do backend recebe acesso; `anon` e `authenticated` não acessam as tabelas. O serviço define os pontos e a situação; o repositório bloqueia a coleta e grava pesagem e total numa transação, preservando pedidos simultâneos.

Quilos/pontos usam DOUBLE/float. Não há arredondamento no cálculo. A interface usa formatação em português com até 15 algarismos significativos para legibilidade, mantendo pontos pequenos visíveis (por exemplo, 0,001); essa apresentação não altera os valores armazenados. Valores não finitos e estouro da representação numérica são recusados antes da gravação, sem teto fixo de negócio.

## IA planejada

O futuro endpoint manterá as camadas. O backend autoriza antes do provedor e oferece somente leitura da coleta vinculada à requisição. Modelo sem SQL, JWT ou escrita. Fluxo em `ia.md`; nenhuma rota de IA está implementada.
