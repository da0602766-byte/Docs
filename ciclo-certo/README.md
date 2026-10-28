# Ciclo Certo

**Frontend e API em localhost; banco no Supabase.** Por solicitação do aluno em 28/10/2026, a persistência foi migrada para PostgreSQL no projeto da conexão Supabase “Docs”, referência `plhfkhxzmxzyfygjyzbk`. O GitHub continua usado para versionar o código, sem publicação pelo GitHub Pages. Frontend em `http://127.0.0.1:5175` e API em `http://127.0.0.1:8000`.

Uma cooperativa agenda coletas de recicláveis e mostra ao morador os pontos de cada pesagem, substituindo o acompanhamento por telefone e planilha.

- **Morador (Joana, celular):** agenda, acompanha suas coletas e consulta pesagens/pontos.
- **Cooperativa (Osmar, computador):** consulta coletas por dia e registra pesagens.
- **Implementado:** React/Vite, FastAPI, PostgreSQL/Supabase com SQLAlchemy, Argon2, JWT e perfis; driver psycopg no ambiente virtual; histórico MySQL arquivado para consulta.
- **Planejado:** um agente OpenAI para explicar os pontos, conforme [plano de IA](.docs/ia.md). Nenhuma chamada ao provedor está implementada.

Fontes: [cartilha](docs/CARTILHA.md), [briefing](docs/BRIEFING.md), [DER](docs/DER.md), [marca e styleguide](docs/styleguide/README.md). Continuidade em [.docs/](.docs/README.md); regras de trabalho em [REGRAS.md](REGRAS.md).

Visual adaptado de `volta-projeto.zip`: página inicial, acesso e quatro telas responsivas. A página pública leva ao login; contas, coletas e pesagens continuam ligadas à API real. Veja a [análise e adaptação](.docs/visual-volta.md).

## Conexão atual: Supabase

Instale `backend/requirements.txt` no ambiente virtual e configure `DATABASE_URL` em `backend/.env`, usando o driver `postgresql+psycopg`, o pooler de sessão (porta 5432) e `sslmode=require`. A credencial fica somente no backend e fora do Git; nenhuma chave Supabase é necessária no frontend. A autenticação continua sendo Argon2/JWT da aplicação.

O projeto usa um usuário PostgreSQL próprio, `ciclo_certo_backend`, com permissões limitadas às três tabelas. As tabelas têm RLS e bloqueiam acesso por `anon`/`authenticated`; a API continua autorizando cada usuário por perfil e proprietário. O MySQL original foi preservado. Consulte [a operação de migração](backend/supabase/README.md) para validação, backup, sequences e retorno.

Para conferir a conexão, a partir desta pasta:

```powershell
.\venv\Scripts\python.exe backend/supabase/verificar_conexao.py
```

A estrutura PostgreSQL está em `backend/supabase/estrutura.sql`, registrada no histórico de migrations do projeto; `backend/banco.sql` contém a mesma referência. Novas alterações devem ser migrations SQL incrementais. Os scripts e revisões MySQL foram arquivados em `backend/legado/mysql/` e não integram a execução atual.

## Preparação em uma instalação nova

Requisitos: Python 3.13, PostgreSQL no Supabase e Node compatível com o Vite instalado. Os comandos partem desta pasta (`ciclo-certo/`).

```powershell
python -m venv venv
.\venv\Scripts\python.exe -m pip install -r backend/requirements.txt
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.exemplo backend/.env }
```

Preencha `DATABASE_URL`, `ORIGEM_FRONTEND` e `CHAVE_DO_TOKEN` no `.env`. A URL usa `postgresql+psycopg://USUARIO:SENHA@HOST:5432/postgres?sslmode=require`; obtenha host e usuário no painel do seu projeto e codifique caracteres especiais da senha na URL. A chave JWT deve ter pelo menos 32 caracteres. Em uma instalação existente, preserve a chave JWT e as credenciais. `.env` e `venv` ficam fora do Git.

`DATABASE_URL` é obrigatória: vazia ou apontando para outro tipo de banco faz a aplicação recusar a inicialização. O backend não depende mais de servidor ou driver MySQL.

### Banco novo

O projeto Supabase atual já está preparado; não recrie suas tabelas. Em um novo projeto, um administrador provisiona o papel restrito `ciclo_certo_backend` e aplica `backend/supabase/estrutura.sql` pelo gerenciador de migrations. O script `criar_tabelas.py` é uma alternativa transacional para um schema `public` vazio, com conexão administrativa e o papel já provisionado; recusa tabelas existentes. A credencial administrativa não deve ficar na configuração normal da API.

### Iniciar a API

Entre na pasta `backend/`:

```powershell
cd backend
$env:PYTHONUTF8 = "1"
..\venv\Scripts\python.exe -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Alternativa com o ambiente ativado: `fastapi dev main.py`.

Abra <http://127.0.0.1:8000/docs>. Grupos: Autenticação, Usuários, Coletas e Pesagens; o botão Authorize usa o e-mail em username e a senha em password.

### Iniciar o frontend

Em outro terminal, partindo da pasta deste README:

```powershell
cd frontend
npm ci
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Abra <http://127.0.0.1:5173>. O endereço deve coincidir exatamente com ORIGEM_FRONTEND. Se a porta estiver ocupada, escolha outra explicitamente e ajuste o .env antes de reiniciar o backend.

### Acessos por perfil

Na porta local 5175 usada neste ambiente:

- Morador: <http://127.0.0.1:5175/login>, acessível pelos links de agendamento na página inicial.
- Cooperador: <http://127.0.0.1:5175/cooperador>, acessível pelos links da cooperativa.

Cada endereço apresenta login e cadastro do próprio perfil, sem seletor. O cadastro envia `morador` em `/login` e `cooperativa` em `/cooperador`. Após o login, `/usuarios/eu` confirma o perfil: contas do outro perfil recebem uma mensagem e um link para o acesso correspondente. Atualizar, sair e entrar novamente conserva o endereço do acesso. Se usar outra porta, substitua 5175 nos links.

A API padrão é http://127.0.0.1:8000. Para outra, configure VITE_API_URL no ambiente do frontend e reinicie/recompile; essa variável contém só endereço, nunca segredo.

Para gerar e servir a versão compilada, dentro de frontend/:

```powershell
npm run build
npm run preview -- --host 127.0.0.1 --port 5173 --strictPort
```

## Contas e roteiro de teste

**Somente no banco isolado de estudo**, crie uma conta por perfil em POST /usuarios, pelo Swagger. Os dados abaixo são fictícios e não são inseridos automaticamente:

```json
{"nome":"Moradora de teste","email":"moradora@example.org","senha":"TesteLocal2026!","tipo":"morador"}
```

```json
{"nome":"Cooperativa de teste","email":"cooperativa@example.org","senha":"TesteLocal2026!","tipo":"cooperativa"}
```

Essa senha serve apenas à demonstração local. No banco de uso normal, cadastre seus próprios dados e senhas. A criação deve responder 201 sem senha/hash; repetir e-mail responde 409.

1. Entre como moradora e agende uma coleta com endereço, dia e materiais informados. Deve começar agendada com zero pontos.
2. Abra Minhas coletas: Aguardando pesagem e histórico inicialmente vazio.
3. Saia e entre como cooperativa. Em A rota, filtre pelo dia e abra a coleta na balança.
4. Registre 2,5 kg de papel: 2,5 pontos e situação coletada. Acrescente 1,25 kg de plástico: mais 2,5 e total 5.
5. Volte como moradora: consulte suas pesagens e o total 5. Um segundo morador não pode ver essa coleta.
6. No Swagger, sem Authorize, uma rota protegida responde 401; morador tentando registrar pesagem responde 403; coleta inexistente, com perfil permitido, responde 404.
7. Peso zero/negativo ou material não previsto responde 422. Peso 1.001 kg de papel e peso 0,001 kg são aceitos: não existe teto de 1.000 kg ou precisão obrigatória de centésimos.
8. Confira senha incorreta, F5, Sair e token vencido: o front não salva a senha e pede novo login quando recebe 401.

O cadastro pela API continua aceitando os dois perfis, conforme o exercício; na interface, o perfil é definido pelo endereço de acesso. Em implantação pública, a concessão do perfil cooperativa precisa de uma decisão administrativa que não faz parte desta entrega.

## Rotas e permissões

| Método | Caminho | Quem pode / resultado | Recusas documentadas |
|---|---|---|---|
| POST | /usuarios | Público; cadastro 201. | 409 e-mail em uso; 422 entrada inválida. |
| POST | /login | Público; formulário OAuth2, token 200. | 401 e-mail/senha incorretos; 422 formulário inválido. |
| GET | /usuarios/eu | Qualquer usuário autenticado; 200. | 401 token ausente, inválido ou vencido. |
| GET | /usuarios | Cooperativa; lista 200. | 401 sem autenticação; 403 morador. |
| GET | /coletas | Morador: somente suas; cooperativa: todas; 200. Filtros dia/morador_id. | 401 sem autenticação; 403 morador filtrando outro; 422 filtro inválido. |
| POST | /coletas | Morador; 201. Dono pelo token; sem morador_id no corpo. | 401 sem autenticação; 403 cooperativa; 422 entrada inválida. |
| GET | /coletas/{coleta_id} | Dono ou cooperativa; 200. | 401 sem autenticação; 403 outro morador; 404 inexistente; 422 ID inválido. |
| GET | /coletas/{coleta_id}/pesagens | Dono ou cooperativa; histórico 200. | 401 sem autenticação; 403 outro morador; 404 coleta inexistente; 422 ID inválido. |
| POST | /coletas/{coleta_id}/pesagens | Cooperativa; 201. | 401 sem autenticação; 403 morador; 404 coleta inexistente; 422 material/peso/ID inválido ou estouro numérico. |

Uma requisição pode ter mais de um problema; a primeira validação executada determina a resposta. Falha inesperada de infraestrutura pode produzir 500, sem representar uma regra da cartilha.

## Regra, arquitetura e segurança

A coleta começa agendada, com zero pontos. Papel/vidro valem 1 ponto/kg; plástico 2; metal 4. Cada pesagem soma pontos; a primeira muda para coletada. Materiais informados não geram pontos. Troca de descontos, mapa, pagamentos e mensagens ficam fora do escopo.

A rota recebe/valida HTTP, o serviço aplica regra e autorização e o repositório usa SQLAlchemy. Pesagem e total são confirmados juntos, com bloqueio da coleta para impedir perda de pontos em pedidos simultâneos. As três tabelas são usuarios, coletas e pesagens; quilos/pontos usam DOUBLE, sem arredondamento no cálculo. Valores não finitos ou que ultrapassam a representação numérica são recusados antes de gravar.

**Por que hash, em vez de criptografia?** A criptografia permite recuperar a senha com uma chave; para autenticar só precisamos conferir se a senha informada é correta. O hash Argon2 permite essa verificação sem guardar uma senha recuperável. É lento de propósito e usa um sal aleatório: senhas iguais produzem hashes diferentes. Senha e hash não saem nos esquemas de resposta.

O JWT contém sub (id em texto) e exp (validade), assinado com HS256 e segredo do .env. O conteúdo é legível e não contém senha. O perfil é consultado no banco; o cliente não concede permissões. Usuários antigos continuam com email/senha_hash NULL e não ganham credenciais inventadas.

## Verificação e entrega

Dentro de `backend/`, com `.env` apontando para PostgreSQL, execute os 17 testes somente em um schema descartável previamente criado por um administrador. Consulte [o preparo dos testes](backend/supabase/README.md#testes).

```powershell
$env:SUPABASE_ESQUEMA_TESTE = 'ciclo_certo_teste_IDENTIFICADOR_HEXADECIMAL_DE_32_CARACTERES'
..\venv\Scripts\python.exe -m unittest teste_banco -v
```

A suíte recusa nome inválido, schema ausente ou que já contenha tabelas. Cobre hash, login, usuário sem credenciais, validação, isolamento, perfis, filtros, persistência entre processos, concorrência, transação e limites da cartilha. Não escreve dados de teste no schema `public`. O administrador remove o schema vazio depois.

### Interface responsiva

Com Edge instalado e frontend em `http://127.0.0.1:5175`, execute na pasta `frontend`:

```powershell
npm run test:visual
```

Playwright com API simulada, sem escrever no banco real. Exercita os fluxos em 1440, 390 e 320 px e salva capturas em `resultados-visuais/` (ignorado pelo Git). Para outra porta, configure `$env:URL_VISUAL = 'http://127.0.0.1:5173'`. Fotos, fontes e licenças em `public/`, sem carregamento de terceiros durante o uso.

Valide também o README em um clone limpo, sem copiar venv, node_modules ou .env: instale dependências, configure um banco vazio e execute o roteiro acima. Resultados e limites da validação desta entrega em [.docs/validacao.md](.docs/validacao.md).

O professor/aluno pode retomar o trabalho por [.docs/proximos-passos.md](.docs/proximos-passos.md). A IA permanece planejada; seu MVP está no [roadmap](.docs/roadmap.md).
