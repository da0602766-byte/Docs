# Decisões

## Ampliação solicitada em 28/10/2026

O usuário pediu calendários, responsabilidade individual, foto/assinatura, cancelamento com aviso, avaliação, perfil e recompensa fictícia. A implementação ativa e suas hipóteses configuráveis estão em [melhorias-coletas.md](melhorias-coletas.md). A participação inicial de 50% não representa estudo de viabilidade. Os registros a seguir preservam decisões históricas anteriores à ampliação.

Base: cartilha, código e escolhas do aluno em 21/10/2026. Registros para estudo; não afirmam revisão pelo professor.

## MySQL e três entidades

- Decisão: persistir usuário, coleta e pesagem, com histórico Alembic; materiais informados em JSON.
- Motivo: preservar dados após reiniciar sem inventar outra entidade.
- Fora: mapas, descontos, pagamentos e cadastro adicional de materiais.
- Onde: modelos, repositórios, migrations e `docs/DER.md`.

## Argon2 e JWT

- Decisão: somente hash da senha; JWT de 60 minutos.
- Motivo: conferir a senha sem recuperá-la; identificar React e Swagger.
- Fora: renovação automática, recuperação de senha e sessões no servidor.
- Onde: `seguranca.py`, `servicos/usuario.py`, `rotas/autenticacao.py`.

## Dono e perfil verificados no backend

- Decisão: dono pelo token; morador vê suas coletas; cooperativa consulta todas e pesa.
- Motivo: mudar um ID no cliente não pode dar acesso ao outro morador.
- Fora: poderes concedidos pela interface. A API permite cadastro dos dois perfis no exercício; implantação pública exigiria outra decisão administrativa.

## Acessos separados — 22/10/2026

- Pedido do aluno: endereço exclusivo `/cooperador` e acesso normal do morador pelo site, em `/login`.
- Interface: links reais na página inicial; login e cadastro com perfil fixo pelo endereço, sem seletor. O valor interno do cooperador continua `cooperativa`.
- Conferência: `/usuarios/eu` confirma o perfil da conta antes de exibir as telas. Perfil incompatível limpa o token da sessão e oferece o link correto. As permissões das rotas continuam sendo verificadas pelo backend.
- Não foi criada aprovação administrativa de contas. Os dois cadastros continuam disponíveis no exercício.
- Onde: serviços, dependências de autenticação e tabela do README.

## Pesagem e total juntos

- Decisão: serviço calcula; repositório bloqueia, soma e confirma numa transação.
- Motivo: impedir gravação parcial e perda de pontos concorrentes.
- Fora: apagar/corrigir pesagens, que exigiria regra adicional.
- Onde: `servicos/pesagem.py` e `repositorios/pesagem.py`.

## Limites da cartilha

- Decisão: retirar teto de 1.000 kg, seis itens informados e centésimos obrigatórios no formulário.
- Motivo: a cartilha não proíbe essas operações. Peso permanece positivo e os números precisam caber na representação do sistema.
- Fora: novos limites arbitrários ou arredondamento dos cálculos.
- Onde: esquemas, modelos, formulário, SQL de referência e nova migration 0003, sem reescrever revisões aplicadas.

## Transparência na tela

- Decisão: separar expectativa de pesagem e mostrar Aguardando pesagem antes da primeira leitura.
- Motivo: explicar de onde vêm os pontos, mantendo o zero inicial disponível no detalhe.
- Fora: recompensa estimada no agendamento.
- Onde: `frontend/src/App.jsx` e briefing.

## Um agente OpenAI — planejado

- Escolha do aluno: explicar pontos ao morador com um agente e OpenAI.
- Motivo: atende à dor principal com dados existentes; não foi identificada necessidade de vários agentes.
- Alternativas discutidas: descrição dos materiais no agendamento ou resumo das coletas do dia.
- Fora: cálculo pela IA, escrita, dados de outros moradores, dados pessoais, pesquisa web e implementação nesta aula.
- Onde: `ia.md`, briefing e roadmap. Modelo e orçamento serão definidos antes da implementação.

## Visual solicitado a partir do ZIP

Uso definido posteriormente pelo aluno: localhost, com GitHub somente para versionamento. A publicação temporária no Pages foi desativada e a configuração de publicação revertida, preservando o visual e as funcionalidades locais.

- Decisão: adaptar a composição do Volta ao Ciclo Certo, incluindo página pública e acesso; preservar nome, autenticação e chamadas reais da API.
- Motivo: aplicar o visual sem transferir dados fictícios, perfil sem senha, período de coleta ou arredondamento de pontos do protótipo.
- Implementação: CSS comum, fontes/fotos locais, navegação inferior e rota em cartões no celular; Playwright como ferramenta de desenvolvimento.
- Análise e validação: `visual-volta.md`. Banco e regras não foram alterados nesta tarefa.
