# Validação da entrega

## Evolução local concluída em 29/10/2026

20 testes (`teste_operacao` + `teste_publicacao`) passaram em PostgreSQL local isolado; 1 teste de configuração do frontend passou; `npm run build` concluiu com sucesso. Calendário, agendamento, responsabilidade, edição de peso, notificação, avaliação e carteira foram exercitados no navegador. A extensão bloqueou upload de arquivos; confirmação com imagens foi testada via API, e câmera/desenho/envio em celular seguem como conferência manual. Etapas e evidências detalhadas em [melhorias-coletas.md](melhorias-coletas.md). Nenhuma alteração foi implantada em produção. O restante deste arquivo registra entregas anteriores.

Data: 21/10/2026, com validação dos acessos separados em 22/10/2026. Este registro distingue testes executados de verificações pendentes.

## Acessos separados — 22/10/2026

- Correção posterior das cores: removida a declaração `color: inherit` de `.lp a`, que sobrepunha as cores dos links com aparência de botão. Botões verdes voltam a ter texto branco; variantes claras e contornadas conservam suas cores. Build e testes de interface aprovados novamente em 1440, 390 e 320 px; captura da página inicial inspecionada.

- Compilação `npm run build`: aprovada com Vite 7.3.7.
- `npm run test:visual`: aprovado no Edge em 1440, 390 e 320 px, com API simulada e sem escrita no banco real.
- Conferidos links da página inicial para `/login` e `/cooperador`, abertura direta e F5 no cooperador, voltar/avançar no navegador e permanência no acesso ao sair e entrar novamente.
- Cadastros dos dois acessos enviam o perfil correspondente, sem seletor. Login com perfil incompatível é recusado pela interface, remove o token e oferece o link correto; trocar de formulário limpa o aviso anterior.
- Repetidos os fluxos existentes de histórico, agendamento, expiração, rota e pesagens, incluindo recuperação do total sem duplicar registro.
- Capturas de login/cadastro inspecionadas em computador e celular; sem rolagem horizontal nas larguras verificadas.
- Backend e banco não foram alterados. A validação desta mudança usa respostas simuladas; não comprova disponibilidade do MySQL nem substitui o teste integrado com contas reais autorizadas.

## Executado no projeto

- 17 testes `python -m unittest teste_banco -v`: passaram após a revisão 0003.
- Cobertura das correções: peso 1.001 kg, peso 0,001 kg, lista com sete itens informados e multiplicadores preservados.
- Valores não finitos e estouro no cálculo/total: 422, sem gravação parcial.
- Usuário anterior à migração permanece sem credenciais inventadas; isolamento, perfis, concorrência e persistência continuam verificados.
- Três ensaios assistidos de prompt registrados em `ia.md`, sem integração ou chamada paga à API.
- Formato JSON dos três ensaios e existência dos links locais da documentação conferidos.
- Build final do frontend no projeto original: aprovado com Vite 7.3.6.
- Banco local atualizado para `0003_limites_cartilha (head)`; comparação de todas as linhas de usuários, coletas e pesagens antes/depois confirmou preservação de registros e valores, sem imprimir dados pessoais.
- `alembic check` no banco local: nenhuma operação pendente.

## Clone limpo e fluxo real

- Preparado um snapshot Git temporário das fontes atuais, incluindo as alterações ainda não commitadas, e feito clone local sem copiar .env, venv, node_modules ou dist. O índice do projeto original não foi alterado.
- Criados venv, instalação por requirements.txt, npm ci e banco vazio exclusivo com prefixo `ciclo_certo_readme_`.
- Dependências novas: Python 3.13.12, Node 24.20.0, FastAPI 0.159.1, SQLAlchemy 2.0.55, Pydantic 2.14.1 e Vite 7.3.6.
- Migrations até 0003 e alembic check: aprovados. Os 17 testes também passaram nesse ambiente novo.
- Build final do clone: aprovado. Servidores de teste restritos a 127.0.0.1, portas 8187/5187, com segredo próprio e banco isolado.
- Verificação por HTTP real: cadastro dos dois perfis, duplicidade 409, senha errada 401, criação agendada/zero, papel 2,5 + plástico 1,25 resultando em 5 pontos, mudança para coletada, histórico e isolamento 403.
- Conferidos 401 sem token, 403 perfil incorreto, 404 inexistente, 422 peso zero/negativo, pesos 0,001 e 1.001 aceitos, CORS da origem exata e recusa de JWT vencido.
- Swagger acessível e status de recusa presentes no OpenAPI.
- Reversão da migration 0003 para os limites antigos: recusada no banco descartável com dados incompatíveis, preservando linhas, revisão e restrições.
- Após a validação, servidores encerrados, banco descartável removido e clone/configurações temporárias apagados. O banco e o .env do projeto foram preservados.

## Histórico da limitação visual na entrega anterior

- A ferramenta de navegador informou que o navegador interno estava indisponível e a lista de navegadores retornou vazia.
- Portanto, não foi executada inspeção visual das quatro telas em celular/computador, nem interação com formulários, F5 e Sair no navegador. Os testes HTTP não substituem essa revisão.
- Essa limitação foi superada na tarefa seguinte usando Playwright/Edge, conforme o registro abaixo.

## Novo visual do ZIP — 21/10/2026

- Página inicial, login/cadastro e quatro telas adaptadas ao Volta; fontes/fotos locais e regras existentes preservadas.
- Build aprovado com Vite 7.3.7. Playwright 1.63.0 somente como dependência de desenvolvimento.
- Edge isolado em 1440, 390 e 320 px: login correto/incorreto, formulário de cadastro, histórico com repetição de erro, sete materiais no agendamento, filtro de data, F5, saída, expiração e pesagens 1.001/0,001 kg.
- Falha simulada na leitura do total após POST: gravação bloqueada, leitura repetida e contagem de POST preservada em um. Detalhes exibem os pontos retornados sem perder 0,001.
- Ausência de erros JavaScript e rolagem horizontal da página nas telas verificadas. Capturas inspecionadas para desktop e celular.
- Testes de interface usam API simulada; nenhuma conta/coleta foi criada no banco normal. Backend, .env e banco não foram modificados nesta tarefa.
- Roteiro: `npm run test:visual` na pasta frontend. Capturas em `frontend/resultados-visuais/`, fora do Git. Análise e limites em `visual-volta.md`.

## Limites

- Após a confirmação de uso em localhost, Pages foi desativado pela API do GitHub (DELETE 204; consulta posterior 404). A configuração de publicação foi revertida; nenhum banco ou dado de usuário foi removido.

- Ensaio de prompt nesta conversa não é teste independente do modelo ou da API OpenAI.
- O módulo de IA não está implementado; seus testes de integração ficam no roadmap.
- A leitura/revisão pessoal para apresentação e a entrega final pertencem ao aluno.
- Nenhum commit foi feito no repositório principal. As alterações previamente preparadas no briefing foram preservadas.

## Migração Supabase — 28/10/2026

Solicitada pelo aluno para o projeto da conexão Docs, referência plhfkhxzmxzyfygjyzbk. Dados copiados e comparados integralmente: 4 usuários, 0 coletas e 0 pesagens, preservando IDs e hashes. MySQL original e configuração JWT preservados; backup local fora do Git. DATABASE_URL ativa aponta para PostgreSQL via pooler de sessão com TLS.

Validação executada: 17 testes no MySQL e os mesmos 17 contratos no PostgreSQL (login, perfis, isolamento, pontos, limites numéricos, persistência em outro processo, rollback e concorrência). Schema temporário removido. A API com a configuração final leu os 4 usuários migrados, respondeu 401 sem token e não expôs hashes. Comparação Alembic/SQLAlchemy encontrou zero diferenças estruturais no destino. Auditor Supabase de segurança sem apontamentos; desempenho apenas indicou índices ainda não usados em tabelas vazias, preservados para os filtros previstos.

Nenhum servidor local estava em execução, portanto a validação HTTP usou TestClient. A rotina de login foi testada com contas descartáveis; as senhas reais não foram solicitadas. Operação e retorno em backend/supabase/README.md.

## Backend exclusivo PostgreSQL — 28/10/2026

A pedido do aluno, removido o fallback MySQL da conexão e da configuração ativa. Modelos usam tipos SQLAlchemy/PostgreSQL e CHECKs compatíveis; tratamento de unicidade usa SQLSTATE 23505. banco.sql contém o baseline PostgreSQL e criar_tabelas.py recusa schema existente. Scripts e revisões antigos foram arquivados em backend/legado/mysql/, sem reescrever as migrations aplicadas.

psycopg[binary] 3.2.13 confirmado no venv; mysql-connector-python removido e pip check sem conflitos. A suíte agora está unificada em teste_banco.py e seus 17 testes passaram no PostgreSQL em 156,393 segundos. Schema descartável removido depois. Conexão TLS validada, metadata sem divergências, configuração vazia/MySQL recusada e tentativa de recriar o banco existente bloqueada. Os dados reais permaneceram em 4 usuários, 0 coletas e 0 pesagens.

## Preparação Vercel — 28/10/2026

Dois projetos configurados por vercel.json: frontend Vite e backend FastAPI/Python 3.13. Rewrite SPA, exclusão de arquivos locais/legado, validação da URL pública da API, CORS HTTPS exato e NullPool na nuvem. Cadastro público de cooperativa bloqueado na Vercel; contas existentes continuam com login. Guia em docs/VERCEL.md.

Validação: build Vite local e com variáveis Vercel aprovados; bundle de nuvem não contém fallback localhost. Um teste do frontend aprovado; três testes de backend aprovados, cobrindo saúde, CORS, configuração inválida, pool e perfil. Navegador headless abriu início, login, cooperador e recarregou as rotas sem erro JavaScript. Leitura de quatro usuários pelo pooler Supabase na porta 6543 com TLS aprovada. Nenhum dado real alterado. Publicação remota concluída conforme o registro abaixo.

## Publicação Vercel — 28/10/2026

Frontend: https://ciclo-certo.vercel.app. API: https://ciclo-certo-api.vercel.app. Projetos `ciclo-certo` e `ciclo-certo-api` na equipe `projetos-fd50`, conectados ao repositório `da0602766-byte/Docs`, branch `main`. Builds remotos do commit `6c47a377f9ba3cbc6a745dca1c40b85362b079b2` concluídos com estado READY. Credenciais cadastradas como Secret somente em Production; endereços públicos como Config.

Validação remota: `/saude` retornou 200; `/usuarios/eu` sem token retornou 401. Preflight CORS aceitou a origem configurada (200) e recusou origem externa (400). `/`, `/login` e `/cooperador` abriram e recarregaram com HTTP 200 no Edge headless, sem erro JavaScript; cadastro de cooperativa oculto.

Leitura autenticada: `/usuarios/eu` e `/coletas` retornaram 200 para morador e cooperativa. O navegador consultou a API de produção e exibiu os estados de lista vazia dos dois perfis, confirmando o caminho interface → API → Supabase → interface. Foram usados JWTs temporários de cinco minutos para contas existentes, mantidos somente em memória. Não foram solicitadas senhas nem criados usuários, coletas ou pesagens. O teste remoto não cobriu login por senha nem operações de escrita; essas regras foram verificadas anteriormente nos testes locais/isolados. Um seletor do teste ad hoc de morador foi corrigido para o texto real `Nada agendado`; a repetição passou sem mudança na aplicação.
