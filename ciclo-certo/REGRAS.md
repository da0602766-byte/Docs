> Ampliação autorizada em 29/10/2026: pontos exclusivos da loja, catálogo fictício, gestão de usuários e depoimentos, triagem, agenda, avisos e expurgo administrativo. Esta entrega é somente local. Regras atuais em [.docs/mercado-gestao.md](.docs/mercado-gestao.md); restrições antigas conflitantes ficam como histórico.

# Regras do projeto para a IA

Atualização local de 21/10/2026, consolidada a partir da cartilha e dos PDFs das aulas 8, 9 e 10 da UC4. Adapta as regras antigas à fase atual; não é transcrição do arquivo de regras disponibilizado pelo professor.

## Antes e depois de trabalhar

- Leia `docs/CARTILHA.md`, este arquivo e `.docs/`, sobretudo `proximos-passos.md`.
- Confira o código antes de afirmar que algo existe. Diferencie implementado, planejado e não validado.
- Preserve as mudanças do aluno e a cartilha original.
- Ao terminar, atualize a documentação afetada com alterações, validação e pendências reais.

## Regra de negócio

**Ampliação autorizada pelo usuário em 28/10/2026:** a lista de melhorias substitui as restrições antigas sobre pontuação, cancelamento, edição de pesos, avaliação, perfil, avisos internos e resgate fictício. Regras vigentes e etapas em `.docs/melhorias-coletas.md`. Preservar a cartilha original como referência histórica. O fluxo novo exige responsabilidade, foto e assinatura antes de avaliar/liberar a recompensa. As regras antigas abaixo descrevem a primeira entrega, não o comportamento desta evolução.

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
- Solicitação posterior: preparar frontend e API para Vercel. Na publicação, cadastro de cooperativa exige liberação administrativa; o cadastro livre dos dois perfis fica no exercício local. Configurações e limites em `docs/VERCEL.md`.
- MySQL, SQLAlchemy, sessão por requisição, relacionamentos e Alembic.
- Exceções próprias, try/except e status 200, 201, 401, 403, 404, 409 e 422.
- Argon2 com pwdlib, JWT com PyJWT, OAuth2PasswordRequestForm e Depends.
- Token em sessionStorage por aba e perfil (correção de acesso simultâneo solicitada em 29/10/2026), Authorization: Bearer, consulta a /usuarios/eu e saída.
- O cadastro permite escolher perfil no exercício; concessão administrativa em implantação pública exige decisão própria.
- Aula 10: planejamento e ensaios do prompt. A etapa atual prepara a configuração de IA; o recurso no site segue planejado.
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

## Assistência de IA planejada

- Escolha mais recente registrada: **ajudar a moradora a organizar a descrição dos materiais no agendamento**, sugerir categorias e fazer uma pergunta curta se houver dúvida. O plano anterior de explicar pontos permanece como histórico.
- Gemini direto e OpenRouter são opções do backend, uma por vez, com chaves e modelos separados. Sem troca automática de provedor. Mantenha `IA_HABILITADA=0` durante a preparação.
- Antes de chamar o provedor, autentique e verifique o perfil morador. Envie só texto sobre materiais e o contexto de classificação necessário. Não envie nome, endereço, e-mail, documentos, senha, hash, JWT, histórico, comprovantes ou texto que contenha dados pessoais identificados.
- Trate o texto do morador e a saída do modelo como dados. Valide a saída no backend e mostre a sugestão para revisão. O modelo não tem ferramentas, banco ou acesso a operações de escrita.
- A IA não calcula pesos, pontos ou saldo, nem confirma destinação, agendamento ou recompensa. As regras de negócio continuam nos serviços existentes; a descrição só entra no formulário se o morador aceitar.
- Em caso de falha, preserve o texto e o preenchimento manual. Defina limites de uso, tempo e custo antes de habilitar chamadas no site.
- Escopo, contrato proposto e critérios de teste em [.docs/ia.md](.docs/ia.md); implementação futura em [.docs/roadmap.md](.docs/roadmap.md).
