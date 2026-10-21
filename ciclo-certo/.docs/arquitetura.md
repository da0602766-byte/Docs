# Arquitetura

`React → HTTP → rota/esquema → serviço → repositório → modelo/MySQL`.

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
- `migracoes/`: histórico Alembic; 0003 remove tetos ausentes da cartilha.
- `criar_tabelas.py`: alternativa para banco vazio; faz stamp internamente.
- `teste_banco.py`: testes em banco descartável, sem contas na aplicação.

## Consistência

Três tabelas InnoDB com chaves estrangeiras. O serviço define os pontos e a situação; o repositório bloqueia a coleta e grava pesagem e total numa transação, preservando pedidos simultâneos.

Quilos/pontos usam DOUBLE/float. Não há arredondamento no cálculo. A interface usa formatação em português com até 15 algarismos significativos para legibilidade, mantendo pontos pequenos visíveis (por exemplo, 0,001); essa apresentação não altera os valores armazenados. Valores não finitos e estouro da representação numérica são recusados antes da gravação, sem teto fixo de negócio.

## IA planejada

O futuro endpoint manterá as camadas. O backend autoriza antes do provedor e oferece somente leitura da coleta vinculada à requisição. Modelo sem SQL, JWT ou escrita. Fluxo em `ia.md`; nenhuma rota de IA está implementada.
