# Ciclo Certo

Cartilha 2 · cooperativa de recicláveis. Backend organizado conforme a
[aula 8](https://dannbeckersenac.github.io/SlidesPJP/aulas/aula-08.html#11), com
SQLAlchemy, Alembic, cadastro, senha com hash Argon2 e autenticação JWT.

## Como rodar o backend

Na raiz do projeto, prepare o ambiente virtual e as dependências:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r backend/requirements.txt
cd backend
```

O ambiente virtual existente permanece na raiz para não quebrar seus executáveis.
Ele e os arquivos `.env` ficam fora do Git. Copie `backend/.env.exemplo` para
`backend/.env` se necessário e preencha todas as chaves:

- `ORIGEM_FRONTEND`: origem exata aberta no navegador, incluindo a porta.
- `MYSQL_HOST`, `MYSQL_PORTA`, `MYSQL_USUARIO`, `MYSQL_SENHA`, `MYSQL_BANCO`: acesso local ao MySQL.
- `CHAVE_DO_TOKEN`: segredo aleatório com pelo menos 32 caracteres, exclusivo desta máquina.

Para gerar o segredo, execute `python -c "import secrets; print(secrets.token_hex(32))"`
e coloque o resultado somente no `.env`. Nunca use a senha do MySQL como segredo JWT.
Somente `configuracao.py` lê as variáveis de ambiente.

O banco informado deve existir no MySQL 8.0.16 ou superior. Dentro de `backend/`,
para um banco vazio, execute:

```powershell
python -m alembic upgrade head
```

Como alternativa apenas para um banco vazio, `python criar_tabelas.py` cria as
tabelas pelos modelos e registra a revisão atual do Alembic. Não execute as duas
formas em sequência. Nenhuma delas cria contas ou atribui senhas.

Para o banco antigo deste projeto, com as três tabelas e sem controle do Alembic,
a atualização foi feita após conferir a estrutura e guardar uma cópia dos dados:

```powershell
python -m alembic stamp 0001_estrutura
python -m alembic upgrade head
```

Não use `stamp` em um banco diferente sem conferir se ele corresponde à revisão
inicial. Nas próximas atualizações use apenas `python -m alembic upgrade head`.
Não use `downgrade` sem planejamento: a reversão da aula 8 remove as credenciais.

Para subir o servidor, ainda dentro de `backend/`:

```powershell
$env:PYTHONUTF8 = "1"
fastapi dev main.py
```

Abra <http://127.0.0.1:8000/docs>. Devem aparecer os grupos **Autenticação**,
**Usuários**, **Coletas** e **Pesagens**, com o botão **Authorize**. Cadastre sua
própria conta em `POST /usuarios`; no login/Authorize, `username` é o e-mail
e `password` é a senha que você cadastrou.

## Organização e regras de acesso

As rotas chamam serviços; os serviços chamam repositórios; estes acessam modelos
SQLAlchemy recebendo a sessão como primeiro argumento. `banco.py` fornece a sessão
com `obter_sessao`. `main.py` apenas cria a aplicação, configura CORS e inclui routers.
As migrações estão em `migracoes/`. `banco.sql` é referência, sem inserções de exemplo.

| Operação | Acesso |
|---|---|
| `POST /usuarios`, `POST /login` | Público: cadastro e login com dados reais informados pela pessoa. |
| `GET /usuarios/eu` | Usuário autenticado. |
| `GET /usuarios` | Cooperativa. |
| `POST /coletas` | Morador; o dono vem do token, não do corpo da requisição. |
| `GET /coletas`, `GET /coletas/{id}`, `GET /coletas/{id}/pesagens` | Morador vê somente suas coletas; cooperativa pode consultar todas. |
| `POST /coletas/{id}/pesagens` | Cooperativa. |

O cadastro permite escolher o perfil, conforme o exercício do curso. Em uma
implantação pública, a concessão do perfil cooperativa precisa de aprovação
administrativa; esta implementação não representa essa aprovação.

Ausência/token inválido resulta em 401; falta de permissão, em 403. Senha e hash
nunca fazem parte das respostas. O token dura 60 minutos. Os usuários anteriores
foram preservados com e-mail e hash vazios; não receberam credenciais inventadas
e não podem entrar enquanto não tiverem credenciais reais cadastradas por um
procedimento específico. A interface usa o cadastro para novas contas.

As três tabelas continuam sendo `usuarios`, `coletas` e `pesagens`. E-mail e
`senha_hash` foram acrescentados a `usuarios`. Materiais ficam em JSON; quilos e
pontos, em DOUBLE. Cada pesagem e a atualização da coleta são confirmadas juntas,
com bloqueio da linha para preservar o total em pedidos simultâneos.

## Como rodar o frontend

Em outro terminal, dentro de `frontend/`:

```powershell
npm install
npm run dev
```

Abra o endereço informado pelo Vite e ajuste `ORIGEM_FRONTEND` no backend para
essa origem exata. A API padrão é `http://127.0.0.1:8000`; `VITE_API_URL` pode
alterá-la. Para compilar, execute `npm run build`.

A prévia local já compilada pode ser servida sem o Vite:

```powershell
python -m http.server 5175 --bind 127.0.0.1 --directory frontend/dist
```

Esse último comando parte da raiz do projeto. Configure a origem
`http://127.0.0.1:5175` no backend para usar a prévia.

## Conferir o fluxo

1. Abra a interface e cadastre sua própria conta de morador com e-mail e senha.
2. Entre, agende uma coleta e confira **Minhas coletas**.
3. Saia e use uma conta real de cooperativa para abrir **A rota** e registrar a pesagem.
4. Entre novamente como morador e confira os pontos e o histórico.

A interface guarda somente o token, não a senha. Ela consulta `/usuarios/eu`
para confirmar o perfil e encerra a sessão se o token vencer ou for recusado.

## Testes

Dentro de `backend/`, com o ambiente virtual ativo e o `.env` preenchido:

```powershell
python -m unittest teste_banco -v
python -m alembic check
```

Os 15 testes verificam migrações, hash, login, validações sem exposição da senha,
tokens inválidos, permissões, isolamento, pontuação, concorrência e persistência.
Os dados de teste existem somente em um banco temporário chamado
`ciclo_certo_teste_` seguido de um identificador aleatório, removido ao terminar.
O usuário MySQL precisa de permissão para criar e remover esse banco temporário.
Os testes não criam contas no banco da aplicação.
