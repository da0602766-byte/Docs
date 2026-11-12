# Restauração do sistema completo — 12/11/2026

Todas as alterações locais anteriores à sincronização foram recuperadas do backup `stash@{0}` (`Backup local antes de trazer GitHub em 2026-11-12`), incluindo os arquivos novos. O backup permanece guardado. A branch mantém o commit do GitHub `a854d36`; o sistema recuperado está na cópia de trabalho, sem novo commit ou push.

Os conflitos em `README.md`, `backend/.env.exemplo` e `backend/configuracao.py` foram resolvidos com as versões completas do backup. A preparação antiga da IA recebida do GitHub foi substituída, nesses arquivos, pela implementação efetiva. Os demais documentos recebidos do GitHub continuam disponíveis, com seus relatos de planejamento preservados como histórico.

## Comparação com a produção

Consultadas pela CLI autenticada as publicações ativas nos domínios oficiais:

- Frontend: `dpl_AtettB6zcm2VpfGQiCcLtmAcZqSo`.
- API: `dpl_D2iAjyvzKaGr73sXvrAB6sduWYko`.

Nenhum dos 101 arquivos do frontend e 69 do backend presentes nas árvores publicadas está ausente localmente. Comparação SHA-1, tolerando somente terminações de linha: 96 arquivos do frontend e 66 do backend coincidem com a publicação.

As oito diferenças foram inspecionadas: `visual.jsx` e `areas.css` contêm o menu móvel posterior; `Loja.jsx`, `CiciMorador.jsx`, `Operacao.jsx` e os três arquivos `mercado.py` de modelos, serviços e rotas contêm o checkout com endereço e data de entrega simulada. Essas melhorias locais foram preservadas, assim como `checkout.css` e a migração `20261112225128_entrega_simulada_recompensas.sql`. Portanto, esta pasta contém as fontes da produção com as evoluções locais posteriores, e não uma cópia idêntica do deploy.

O relatório de hashes e as cópias dos oito arquivos publicados usados na conferência ficam em `.test-infra/`, ignorada pelo Git. Nenhum segredo foi recuperado da nuvem.

## Validação e limites

- `python -m unittest teste_ia teste_publicacao -v`: 19 testes aprovados, incluindo 16 da IA com respostas simuladas e três de configuração da publicação.
- `node --test testes/sessao.test.js testes/listagem.test.js testes/publicacao.test.js testes/youtube.test.js`: nove testes aprovados.
- `npm run build`: aprovado.

Na etapa de restauração, não foram executadas migrações, alterações no banco, chamadas reais aos provedores, push ou deploy. A conferência posterior para envio está registrada abaixo. A revisão visual no navegador permanece pendente.

## Consolidação para envio ao GitHub

Após autorização do usuário, foram executados os 49 testes integrados de operação, comunidade e participação em PostgreSQL local descartável. Todos passaram, incluindo checkout, idempotência, concorrência, preservação de dados e permissões. Somados aos 19 testes de IA/configuração e nove testes Node da restauração, são 77 testes aprovados. O build do frontend também passou.

O Supabase possuía as 11 migrações anteriores. A migração aditiva de entrega simulada foi aplicada e registrada como `20261112235126_entrega_simulada_recompensas`. O arquivo local originalmente chamado `20261112225128_entrega_simulada_recompensas.sql` foi renomeado para o ID remoto, com o mesmo SQL. Os 12 IDs locais correspondem ao histórico remoto. Essa migração já está aplicada em produção.

Após a alteração, o banco preservou as contagens de 15 usuários, 16 coletas, 23 pesagens e dez pedidos. Os dois campos opcionais e a restrição de entrega foram confirmados. A tabela de pedidos continua com RLS e sem leitura direta por `anon` ou `authenticated`.

A conferência dos arquivos candidatos ao commit encontrou somente a URL parametrizada do banco descartável nos testes. Os arquivos de ambiente, credenciais, dependências instaladas e relatórios locais permanecem ignorados pelo Git. O envio à branch `main` foi autorizado para consolidar a IA/Cici e o sistema completo no repositório.
