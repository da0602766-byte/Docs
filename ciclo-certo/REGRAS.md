# Regras do projeto para a IA

Atualização local de 21/10/2026, consolidada a partir da cartilha e dos PDFs das aulas 8, 9 e 10 da UC4. Adapta as regras antigas à fase atual; não é transcrição do arquivo de regras disponibilizado pelo professor.

## Antes e depois de trabalhar

- Leia `docs/CARTILHA.md`, este arquivo e `.docs/`, sobretudo `proximos-passos.md`.
- Confira o código antes de afirmar que algo existe. Diferencie implementado, planejado e não validado.
- Preserve as mudanças do aluno e a cartilha original.
- Ao terminar, atualize a documentação afetada com alterações, validação e pendências reais.

## Regra de negócio

- Cartilha **2 · Ciclo Certo**: Joana agenda e consulta suas coletas; Osmar consulta as coletas por dia e registra pesagens.
- A coleta nasce **agendada**, com **zero pontos**, e pertence ao morador identificado pelo token.
- Pontos/kg: papel **1**, vidro **1**, plástico **2**, metal **4**.
- Cada pesagem soma pontos ao total. A primeira muda a situação para **coletada**.
- Materiais informados no agendamento são uma expectativa; somente pesagens registradas geram pontos.
- Não invente tetos de peso, de quantidade de materiais, de casas decimais, de datas ou regras de premiação.
- Validações técnicas e de representação numérica não podem alterar multiplicadores nem arredondar cálculos.
- Troca de pontos por desconto, mapa, pagamento e aviso por mensagem ficam fora do escopo.
- Cancelar/editar coleta e corrigir/apagar pesagem não fazem parte da implementação atual.

## Organização e responsabilidades

- `README.md`: execução, banco, testes, rotas e permissões.
- `docs/`: cartilha, briefing, DER, marca e styleguide; `.docs/`: continuidade, decisões, roadmap e IA.
- `frontend/`: React, CSS responsivo e fetch, com carregamento, erro e resultado.
- `backend/rotas/`: APIRouter, Depends, status e tradução das exceções.
- `servicos/`: decisões, autorização por dono e cálculos da cartilha.
- `repositorios/`: acesso ao banco; a sessão é o primeiro argumento.
- `modelos/`: tabelas SQLAlchemy; `esquemas/`: entrada e saída Pydantic.
- `banco.py`: engine, Base e sessão; `seguranca.py`: Argon2/JWT; `migracoes/`: Alembic.
- `main.py` apenas monta aplicação, CORS e routers.
- Direção: rota → serviço → repositório → modelo/banco. Repositório não importa serviços.
- As dependências compartilhadas de autenticação ficam em `rotas/autenticacao.py`, conforme aulas 8 e 9, e podem ser importadas pelos demais routers.

## Tecnologias permitidas nesta fase

- Atualização autorizada pelo aluno em 28/10/2026: backend exclusivamente PostgreSQL no Supabase, com psycopg no venv. O histórico MySQL fica arquivado em `backend/legado/mysql/` para consulta. A cartilha original permanece intacta.
- MySQL, SQLAlchemy, sessão por requisição, relacionamentos e Alembic.
- Exceções próprias, try/except e status 200, 201, 401, 403, 404, 409 e 422.
- Argon2 com pwdlib, JWT com PyJWT, OAuth2PasswordRequestForm e Depends.
- Token no localStorage, Authorization: Bearer, consulta a /usuarios/eu e saída.
- O cadastro permite escolher perfil no exercício; concessão administrativa em implantação pública exige decisão própria.
- Aula 10: planejar o agente, construir e testar o prompt; implementar o módulo fica para depois.
- Use def comum no Python, configuração simples e fetch no React. Não acrescente frameworks sem necessidade.

## Segurança e persistência

- Somente `configuracao.py` lê .env com load_dotenv e os.getenv.
- .env fica fora do Git; .env.exemplo contém chaves sem segredos.
- Nunca grave senha legível, coloque senha no JWT ou devolva senha/hash.
- O dono vem do token validado. Sem autenticação: 401; perfil errado ou coleta de outro morador: 403.
- CORS usa origem exata; allow_origins=["*"] continua proibido.
- Banco existente exige nova migration; não apague registros nem reescreva revisões aplicadas.
- Testes usam banco descartável; não crie contas fictícias no banco de uso normal.

## Escrita e autoria

- Código, variáveis, comentários, documentação e mensagens em português do Brasil; preserve nomes exigidos por bibliotecas/protocolos.
- Antes de criar função, explique a camada e o motivo; identifique infraestrutura e testes.
- Comente a intenção de funções, rotas e blocos novos; explique conceitos novos em uma linha.
- Justifique decisões e indique como testar. Não invente resultados, revisões do aluno ou aprovação do professor.
- Respeite a autoria do briefing, da marca e do styleguide. Discuta decisões novas de produto.
- Faça somente trabalho autorizado; não publique, envie mensagens ou faça commit no repositório principal sem pedido.

## Agente de IA planejado

- Escolha do aluno: **um agente OpenAI explica os pontos de uma coleta para o morador**.
- Somente leitura da coleta autorizada; sem nome, endereço, e-mail, senha, hash ou JWT no provedor.
- O sistema calcula e autoriza; o agente explica os dados recebidos.
- Não cria pontos, pesagens, descontos, regras ou operações de escrita.
- Com dados insuficientes, pede esclarecimento; com inconsistência ou falha, preserva os dados e as telas atuais.
- Prompt, fluxo e testes: `.docs/ia.md`; implementação futura: `.docs/roadmap.md`.
