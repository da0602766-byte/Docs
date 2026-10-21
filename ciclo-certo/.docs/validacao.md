# Validação da entrega

Data: 21/10/2026. Este registro distingue testes executados de verificações pendentes.

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
