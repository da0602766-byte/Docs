# Verificação antes do push — 10/11/2026

A auditoria abaixo foi concluída antes do push. A publicação posterior, autorizada pelo usuário, está registrada ao final. Nenhuma migração foi reaplicada no Supabase remoto.

## Preservação da versão publicada

- GitHub consultado novamente: `origin/main` continua em `55cd887`; nenhuma atualização remota ficou fora da integração.
- Vercel conferida pela CLI autenticada, pois o conector retornou 403/404. Produção do frontend: `dpl_9S19hsX3A3yjX6rGtPLZnmFEkeYH`; API: `dpl_5yYZJctgtXBQjN4n2qq3FgAnpNti`. São as publicações com equipamentos e revisão de interface, feitas anteriormente a partir de fontes locais ainda sem commit.
- Integração Git dos dois projetos: repositório `da0602766-byte/Docs`, branch `main`; diretórios `ciclo-certo/frontend` e `ciclo-certo/backend`. Um push nessa branch pode iniciar novos builds de produção.
- Todos os 54 arquivos ativos da API presentes nas fontes da publicação correspondem aos locais, descontadas apenas as terminações de linha. O frontend também preserva as fontes ativas. A única remoção de componente é `Carteira.jsx`, já sem importadores: `Operacao.jsx` importa `Loja.jsx` com o nome local `Carteira`.
- Build local com `VERCEL=1` e `VITE_API_URL=https://ciclo-certo-api.vercel.app`: os três assets gerados correspondem byte a byte aos servidos no domínio oficial: `index-UuD2ht0f.js`, `browser-TlHhcbf_.js` e `index-CwQmvzfy.css`. A remoção do componente antigo não modifica o bundle.
- API local e publicada têm as mesmas 69 combinações de caminho e método. Nenhuma operação foi removida ou duplicada; não há definições Python repetidas no mesmo escopo.

## Riscos encontrados e correções locais

1. Cinco migrações tinham IDs locais diferentes dos registrados no Supabase. Foram renomeadas para os IDs remotos existentes. O baseline remoto foi restaurado no histórico local. As oito migrações agora correspondem ao histórico remoto, com SQL equivalente após desconsiderar comentários e espaços. Nenhum SQL aplicado foi alterado.
2. Os inicializadores e testes locais passaram a considerar o baseline dentro do histórico, executando-o somente uma vez. O teste continua inserindo registros históricos entre o baseline e as evoluções, verificando preservação de dados.
3. Instruções ativas de README/Vercel ainda mandavam aplicar uma migração já executada. Foram corrigidas. Referências antigas em relatos históricos permanecem como registro da operação original.
4. O `.vercelignore` da raiz era específico de upload do frontend e excluía todo o backend. Agora contém exclusões compartilhadas, sem omitir o backend; a cópia `revisao-interface` fica excluída de uploads. As regras próprias de cada projeto permanecem em seus diretórios.

## Histórico conferido

| ID remoto e local atual | Migração |
| --- | --- |
| 20261028224800 | ciclo_certo_estrutura_postgresql |
| 20261029033020 | fluxo_coletas_recompensas |
| 20261029231401 | mercado_gestao_local |
| 20261029231407 | refinamento_interface_recuperacao |
| 20261104191136 | comunidade |
| 20261104202335 | comunidade_avisos_youtube |
| 20261104220504 | comunidade_participacao |
| 20261104232126 | equipamentos_coleta |

Não reaplicar essas migrações em produção. `main:app` não executa migrações na inicialização. `backend/supabase/estrutura.sql` permanece como snapshot para testes históricos; a inicialização atual usa somente o histórico completo em `supabase/migrations/`.

## Validação e limites

Após as correções, os 44 testes de operação, comunidade e participação passaram novamente em PostgreSQL local descartável, incluindo preservação de dados, concorrência, acesso e kit de equipamentos. O build de produção passou e seus assets foram comparados ao site. Os nove testes Node haviam passado na consolidação, e nenhum código ativo do frontend foi alterado nesta auditoria.

O backend mantém faixas de versões em `requirements.txt`. O contrato OpenAPI difere somente na anotação `pattern` do campo decimal `Peso.quilos`, gerada pelo validador instalado localmente; caminhos, métodos e os demais campos coincidem com a produção. Portanto, igualdade das fontes não garante dependências idênticas em um novo build. Não foram alteradas versões de dependências nesta revisão.

Não foram realizados login nem escritas em produção. A verificação confirma preservação do código publicado e elimina as duplicidades encontradas; não constitui garantia de ausência de qualquer erro futuro.

## Push e publicação concluídos — 10/11/2026

Após autorização explícita, os oito commits foram enviados a `da0602766-byte/Docs`, branch `main`, até `ced38f6d68fa1542bc7cf451c4557f66556775bb`. A integração Git iniciou os dois deploys de produção; ambos chegaram a `READY` / `PROMOTED` e receberam os domínios oficiais:

- Frontend: `dpl_A9iar7cxj62CBDPYrpodtXge2zpL`, em https://ciclo-certo.vercel.app.
- API: `dpl_Eq7H9ghn4Nc5jpwGrMJhAH2jsqHF`, em https://ciclo-certo-api.vercel.app.

Conferência posterior: início, login e cooperador com HTTP 200; JavaScript e CSS principais idênticos à publicação anterior; saúde e catálogo com HTTP 200, incluindo os dez equipamentos; coletas, gestão de usuários e avisos protegidos com HTTP 401 sem sessão. CORS mantém a origem oficial. O contrato OpenAPI completo é idêntico ao anterior, com as mesmas 69 operações.

`node testes/revisao-interface-producao.cjs` passou nos dois perfis, em 320/673/1440 px, sem erros JavaScript ou overflow. O frontend foi acessado no domínio oficial com chamadas à API interceptadas e dados simulados; nenhum token real, conta ou registro de produção foi usado. As oito migrações remotas permanecem inalteradas, sem reaplicação durante o deploy.
