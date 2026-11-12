# Análise da integração de IA — 10/11/2026

## Resultado

A cópia local do Ciclo Certo contém um esboço de seleção de modelos, mas ainda não oferece IA no site. Foram lidos todos os quatro arquivos de `backend/Ia`, a configuração, as dependências, a montagem da API, a autenticação, o formulário de agendamento e a documentação de IA. Nenhuma chamada de inferência, alteração no banco ou publicação foi realizada. As alterações anteriores do aluno foram preservadas.

## Análise de cada arquivo de IA

| Arquivo | Estado observado | Ação necessária |
| --- | --- | --- |
| `backend/Ia/modelos.py` | 9 linhas: Gemini principal, OpenRouter como reserva e Claude como última reserva. Importa `configuracao.chave_do_gemini`, `chave_do_openrouter` e `chave_do_claude`, que não existem. | Definir configurações no backend, conferir dependências e construir os clientes com tratamento de indisponibilidade. |
| `backend/Ia/sugestao.py` | Vazio, 0 bytes. | Implementar instruções da assistência, chamada ao modelo, validação da resposta e tradução de falhas. |
| `backend/Ia/ferramentas.py` | Vazio, 0 bytes. | O fluxo atual não precisa de ferramenta com acesso ao banco. Caso seja útil, fornecer somente o catálogo permitido pelo backend; manter este arquivo dispensável até haver necessidade. |
| `backend/Ia/init.py` | Vazio, 0 bytes. | Se a intenção é inicializar um pacote Python convencional, usar `__init__.py`. `init.py` é um módulo comum. A ausência de `__init__.py` não impediu o import local como namespace package. |

### Observações sobre modelos.py

- A composição `gemini.with_fallback(openrouter, claude)` existe na versão instalada do Jangada AI. Ela representa troca sequencial de provedor, não um sistema multiagente.
- O erro atual ocorre na linha 3, antes de qualquer chamada: `AttributeError: module 'configuracao' has no attribute 'chave_do_gemini'`.
- O fallback não corrige esse erro de importação. Na biblioteca instalada, falhas de autenticação e requisições inválidas também não acionam a troca por padrão; a política precisa ser deliberada.
- Os clientes são definidos no nível do módulo. Ao integrar o router, uma falha de configuração pode afetar o carregamento da API. A construção controlada e reutilizável dos clientes permite que a assistência fique indisponível sem derrubar o restante do site.
- Não há instruções de sistema, contrato de saída, limite de tokens específico da tarefa, timeout explícito ou orçamento. O Jangada instalado usa por padrão `max_retries=2` e `max_tokens=8192`; esses valores precisam ser adequados à assistência curta.
- A API está configurada com duração máxima de 30 segundos em `backend/vercel.json`. Tentativas e três provedores precisam caber num prazo total menor, incluindo a resposta HTTP. O timeout de cada SDK deve respeitar a unidade e o formato específicos desse SDK.
- A reserva Claude pode gerar cobrança. A troca deve ter limite de custo e opção de desativação; o comentário “só entra quando os outros falham” não cobre todas as categorias de falha.

Os IDs `gemini-3.8-flash` e `claude-opus-5-5` constam nas documentações oficiais consultadas. Isso não comprova acesso, cota ou saldo das contas. Fontes: [Gemini 3.8 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [migração Claude Opus 5.5](https://platform.claude.com/docs/en/models/opus-5-5/migration-guide).

O identificador `openrouter/free` também é documentado. O roteador escolhe modelos gratuitos; a compatibilidade da saída estruturada deve ser validada para a requisição usada. Fonte: [OpenRouter — variantes gratuitas e roteador](https://openrouter.ai/docs/guides/routing/model-variants/free).

## Chaves e dependências

Na cópia local examinada, `backend/.env` tem variáveis de origem, JWT e banco; não foram encontradas as chaves dos três provedores nesse arquivo. Os `.env.local` do frontend/backend têm variável de autenticação da Vercel, que não substitui uma chave de IA. As variáveis convencionais dos provedores também estavam ausentes do processo de análise. Nenhum valor de segredo foi registrado.

A busca nos arquivos textuais do projeto, excluindo dependências e artefatos gerados, encontrou referências às credenciais somente em `Ia/modelos.py`, sem suas definições. As chaves podem estar em outra cópia aberta no VS Code ou em um ambiente remoto; isso não foi confirmado. Portanto, “chaves já no projeto” não corresponde à configuração disponível nesta pasta.

Os `.env` locais estão ignorados pelo Git. O código deve continuar lendo variáveis apenas em `configuracao.py`, conforme `REGRAS.md`. Proposta de nomes: `GEMINI_API_KEY`, `OPENROUTER_API_KEY` e `ANTHROPIC_API_KEY`, mapeados para os atributos usados pelo módulo. Exemplos devem conter somente valores vazios. Nenhuma chave de provedor deve usar prefixo `VITE_`.

| Local | Constatação |
| --- | --- |
| `backend/requirements.txt` | Declara `jangada-ai==1.14.1`, sem os extras dos provedores. |
| `ciclo-certo/venv` | Jangada 1.14.1 instalado; `google-genai`, `anthropic` e `openai` ausentes. |
| `requirements.txt` na raiz de Docs | Lista os três SDKs, mas é um arquivo separado do manifest usado pelo procedimento do backend. Sua existência não instala pacotes no venv. Está codificado em UTF-16. |
| `frontend/package.json` | Não precisa receber SDK nem credencial de provedor; o frontend deve consumir a API própria. |

Na implementação, declarar os extras Gemini, OpenRouter e Anthropic compatíveis com o Jangada fixado no manifest efetivamente usado, e instalar no mesmo interpretador que executa a API. O adaptador OpenRouter utiliza o SDK compatível OpenAI; isso não exige escolher a OpenAI como provedor do produto.

## Integração com o sistema existente

`main.py` registra os routers atuais, sem importar o módulo `Ia` ou expor uma rota de assistência. `frontend/src/api.js` já centraliza o Bearer token e pode ser reutilizado. `rotas/autenticacao.py` já fornece `exigir_morador`, adequado à assistência no agendamento.

`frontend/src/operacao/Agendar.jsx` já tem sugestões por busca textual no catálogo, avisos de cuidado e inclusão manual de materiais. Essas sugestões são determinísticas. O componente ainda não chama IA, não faz perguntas de esclarecimento e não apresenta uma prévia gerada.

O contrato atual de agendamento é `esquemas/operacao.py:Agendamento`, utilizado por `rotas/operacao.py`; recebe `materiais_informados: list[str]`. O plano em `.docs/ia.md` menciona o esquema antigo `esquemas/coleta.py`, portanto essa referência precisa ser atualizada.

## Decisão funcional documentada

O início de `.docs/ia.md` registra como escolha mais recente ajudar a organizar materiais no agendamento, sugerir papel/vidro/plástico/metal e perguntar quando houver ambiguidade. A explicação de pontos aparece depois como histórico.

`REGRAS.md`, `.docs/README.md`, `.docs/roadmap.md` e `.docs/proximos-passos.md` ainda descrevem explicar pontos. O plano recente cita OpenAI, enquanto o esboço atual usa Gemini, OpenRouter e Claude. Essa divergência deve ser consolidada antes de apresentar a integração como concluída. Para uma primeira implementação, a referência funcional mais recente é a assistência aos materiais; a escolha de provedores deve refletir a decisão atual do aluno.

## Caminho proposto para implementação

1. Configuração e infraestrutura: alinhar variáveis e dependências; permitir que falhas da IA não impeçam o carregamento do site.
2. Esquemas: criar entrada e saída Pydantic próprias, com descrição, esclarecimentos e itens com categoria opcional. O backend valida a estrutura e as categorias permitidas.
3. Serviço: usar `Ia/sugestao.py` para organizar somente materiais, com instruções em português e prazo/custo limitados. O modelo não calcula pontos, não estima pesos e não cria coletas.
4. Rota: propor `POST /ia/sugestao-materiais`, autenticada com perfil morador, em router separado registrado no `main.py`. Autorizar e validar antes de chamar o provedor; limitar chamadas por usuário.
5. Dados: enviar somente descrição dos materiais e esclarecimentos necessários. Não enviar o objeto inteiro do formulário, endereço, histórico de coletas, fotos, assinatura ou JWT. Tratar o texto livre como entrada sem autoridade para alterar instruções.
6. Interface: em `Agendar.jsx`, adicionar ação de assistência, carregamento, pergunta curta e prévia editável. “Usar descrição” apenas preenche os materiais; a confirmação normal continua criando a coleta. Falhas preservam o texto e permitem preenchimento manual.
7. Validação: testar autorização sem chamada ao provedor, texto ambíguo, assunto indevido, tentativa de alterar regras, resposta malformada, timeout, indisponibilidade e sequência de fallback. Conferir que a assistência não grava dados nem envia informações pessoais.

Essa funcionalidade, mantendo a lista textual de materiais, não exige uma nova tabela nem migration. Histórico de conversas e persistência de categorias seriam mudanças adicionais de escopo.

## Verificações realizadas e limites

- Os quatro arquivos de IA passaram na compilação de sintaxe em memória, sem alteração de código.
- A importação real de `Ia.modelos` foi executada no venv do projeto e falhou com o `AttributeError` registrado acima.
- A presença das dependências foi conferida por metadados do mesmo interpretador.
- A presença de variáveis foi examinada sem imprimir seus valores.
- Não foram executadas inferências, testes em contas reais, acesso ao banco, instalação de pacotes ou publicação.
- A análise confirma o estado desta pasta local; não confirma o conteúdo de outra pasta do VS Code nem o ambiente da produção.
