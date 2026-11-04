# Comunidade — atualização de 04/11/2026

## Redesenho solicitado após a primeira publicação

Publicado em `https://ciclo-certo.vercel.app` em 04/11/2026. Código `f92bbeb`; build de produção `dpl_6MEHUchzFJJemKJv1TiGtyUSFzxG`, preparado sem domínio, conferido e promovido. Página inicial, login e cooperador responderam 200 com o novo bundle; saúde da API 200 e Comunidade sem token 401. A API não precisou de alterações nem de migração neste redesenho.

- Feed priorizado no celular: cabeçalho com ilustração de folhas, saldo/cota em uma faixa pequena e categorias em botões horizontais. Regras completas abertas sob demanda; identidade e paleta preservadas.
- A publicação começa por um botão, sem textarea permanentemente aberto. Diálogo com altura limitada, campo sem redimensionamento, categoria obrigatória e rascunho mantido em memória ao fechar. Falhas preservam texto/categoria; envio em andamento impede fechamento por Escape e envio repetido.
- Sucesso mostra “Sua ideia ganhou raízes!”, folhas animadas e um acorde curto sintetizado com Web Audio. Som começa apenas no envio confirmado, tem controle com preferência local persistida e falhas de áudio não interrompem a publicação. Movimento reduzido desativa as animações. Não existe anúncio de crédito antes da aprovação.
- Seis exemplos editoriais solicitados pelo usuário, um por categoria, identificados como **demonstração com personagens fictícios**. Aparecem ao final dos resultados reais e respeitam os filtros. Não criam contas, registros no banco, comentários, datas, curtidas ou pontos fictícios. O botão de inspiração abre uma publicação nova com a categoria sugerida, sem copiar o conteúdo.
- Rolagem consulta lotes de 12 por cursor com IntersectionObserver, cancelamento de respostas antigas e trava contra chamadas duplicadas. Depois de 60 registros, “Continuar no feed” substitui o grupo e reposiciona a leitura abaixo do cabeçalho. Conteúdo fora da tela usa `content-visibility`; comentários continuam paginados e só são buscados quando abertos. Há botão alternativo sem Observer e repetição manual após falha, preservando resultados já carregados.
- Comentários atualizam seu contador e a conversa aberta, sem reiniciar todo o feed. Recompensas, autenticação, moderação, API e banco permanecem com as regras da primeira entrega; este redesenho não requer migração.

Validação deste redesenho: build Vite e sete testes frontend existentes aprovados; 32 testes backend aprovados no PostgreSQL descartável. `node testes/comunidade.interface.cjs` cobre os dois perfis, rascunho, erro no envio, som de sucesso, animação, publicação/aprovação/crédito, comentário sem fechar conversa, denúncia, exclusão, estorno e cotas. `node testes/comunidade.rolagem.cjs` cobre lotes, limite de memória renderizada, continuação, erro sem loop, troca rápida de filtros, perfil, silêncio persistido, movimento reduzido e viewport 320×460. Páginas públicas compiladas também verificadas. Revisão visual em 320, 390, 768 e 1440 px, sem overflow; seletor de perfil e altura do compositor corrigidos. Capturas em `frontend/resultados-visuais/comunidade/` (não versionadas).

Os testes autenticados usam somente a API e o banco locais descartáveis. Produção é conferida pelo build publicado, páginas públicas e saúde da API; som em aparelho físico depende do volume/configuração do navegador.

## Estado da entrega

Implementada e integrada às fontes da produção recuperadas pela CLI autenticada da Vercel. Mercado, Gestão, recuperação de senha, catálogo e refinamentos visuais foram restaurados da publicação existente; os metadados Git dessa publicação ainda apontavam para `6f16815`, mas seus arquivos-fonte continham alterações posteriores. Fontes: API `dpl_gy9CQ22n5MGNCeQjBoPQDtc8FrQr` e frontend `dpl_4WrFftx5LZinLiJSFApSrmHJn4CC`. Arquivos recuperados conferidos por SHA-1 antes da integração.

As migrações `20261029231401_mercado_gestao_local.sql` e `20261029231407_refinamento_interface_recuperacao.sql` foram recuperadas do histórico Supabase para reprodução local. **Já estão aplicadas em produção; não reaplicar.** Somente `20261104184651_comunidade.sql` foi aplicada nesta entrega, registrada remotamente como `20261104191136_comunidade`. É a mesma migração: não reaplicar. Publicação concluída em 04/11/2026.

Conta indicada pelo usuário para moderação: `da0602766@gmail.com`, existente no banco, perfil cooperativa. A moderação foi concedida à conta existente na implantação. Nenhuma conta ou senha foi criada/alterada para testar.

## Produto e regras

- Aba Comunidade nos dois perfis, com feed, categorias obrigatórias, filtros por categoria/perfil, publicações próprias, aprovação, comentários, denúncias e exclusões.
- Categorias: Plantio, Reciclagem, Curiosidades, Compostagem, Reutilização e Sugestões.
- Publicações entram como pendentes; somente aprovadas aparecem no feed. Autor consulta também pendentes/rejeitadas em Minhas publicações. O moderador tem abas Aprovações e Denúncias, e precisa explicar rejeições.
- Nome e perfil vêm da conta autenticada. O perfil interno `cooperativa` aparece como Cooperador. Endereço, e-mail e identidade do denunciante não aparecem no feed.
- Regra inicial igual para moradores e cooperadores: 10 pontos por publicação aprovada, até 2 recompensadas/dia e 6/semana. Considera **a data da aprovação** em `America/Sao_Paulo`; semana inicia segunda-feira. Uma publicação aprovada acima da cota aparece sem crédito e não recebe crédito retroativo na semana seguinte.
- Exclusão é lógica, retira o conteúdo do feed e estorna uma única vez o crédito original. O registro do crédito permanece consumindo a cota original. Não existe restauração/reaprovação após exclusão.
- Pontos da comunidade são exclusivos da participação: não alteram carteira, dinheiro fictício, pesos, produtos ou recompensas das coletas. Comentários não pontuam; não há botão de curtida nesta entrega.
- Identidade normalizada e SHA-256 impedem duplicação exata, inclusive entre contas e após exclusões. Entre as últimas 100 publicações da mesma conta, similaridade de 90% ou mais também é recusada. Normalização ignora espaços, caixa, acentos, pontuação e caracteres invisíveis.
- Antispam: 60 segundos entre publicações, máximo de 20 envios/dia; comentários a cada 10 segundos, até 100/dia; denúncias a cada 10 segundos, até 30/dia. Exclusões não liberam esses limites. Moderação humana complementa essas proteções; não é uma garantia contra contas múltiplas ou paráfrases.
- Conteúdo: publicação de 10 a 1.200 caracteres, comentário de 2 a 500 e denúncia de 10 a 300. A API rejeita campos de autor, perfil ou pontos enviados pelo cliente.

## Dados, autorização e transações

Migração aditiva `supabase/migrations/20261104184651_comunidade.sql`. Cria seis tabelas: `comunidade_moderadores`, `comunidade_regras`, `comunidade_publicacoes`, `comunidade_creditos`, `comunidade_comentarios`, `comunidade_denuncias`. Nenhuma tabela existente é alterada.

RLS habilitado em todas as tabelas, acesso direto de `anon`/`authenticated` revogado. A autenticação continua sendo JWT próprio da API. O papel `ciclo_certo_backend` lê moderadores/regras, mas não pode conceder moderação nem mudar pontuação. Demais tabelas permitem apenas as operações necessárias; a API verifica dono/moderador.

Bloqueio transacional da conta do autor serializa aprovações e estornos. A chave primária do crédito é a publicação, impedindo crédito duplo. Limites contam créditos inclusive estornados. Aprovações repetidas e exclusões repetidas são idempotentes. A pontuação é armazenada no momento do crédito; ajustes futuros não recalculam o passado.

Rotas → serviço → repositório → modelos; os arquivos `comunidade.py` mantêm essas responsabilidades. Interface em `frontend/src/operacao/Comunidade.jsx`, com CSS próprio na paleta existente. Listas usam cursor por ID com tamanho limitado; comentários são buscados ao abrir a conversa.

## Operação administrativa

Após migração, conceder a moderação somente à conta indicada, pela conexão administrativa:

```sql
INSERT INTO public.comunidade_moderadores (usuario_id)
SELECT id FROM public.usuarios WHERE lower(email) = 'da0602766@gmail.com'
ON CONFLICT DO NOTHING;
```

Para ajustar a regra, alterar uma linha pela conexão administrativa. Exemplo com os valores iniciais:

```sql
UPDATE public.comunidade_regras
SET pontos = 10, limite_dia = 2, limite_semana = 6
WHERE id = 1;
```

As novas aprovações usam a regra vigente; créditos históricos e estornos mantêm seu valor. Reduzir limites não remove créditos existentes. Conferir o efeito administrativo antes de alterar esses valores.

## API

Todas as rotas exigem token:

| Método/rota | Uso |
|---|---|
| GET `/comunidade/resumo` | Saldo próprio, cotas, categorias e permissão de moderação |
| GET/POST `/comunidade/publicacoes` | Feed/filtros/paginação ou nova publicação |
| DELETE `/comunidade/publicacoes/{id}` | Exclusão por autor/moderador e estorno |
| POST `/comunidade/publicacoes/{id}/moderar` | Aprovação/rejeição por moderador |
| GET/POST `/comunidade/publicacoes/{id}/comentarios` | Conversa paginada ou comentário |
| DELETE `/comunidade/comentarios/{id}` | Exclusão por autor/moderador |
| POST `/comunidade/publicacoes/{id}/denuncias` | Denúncia de publicação ou comentário |
| GET `/comunidade/denuncias` | Fila paginada, somente moderador |
| POST `/comunidade/denuncias/{id}/resolver` | Encerramento da análise, somente moderador |

Feed aceita `modo=feed|minhas|moderacao`, `categoria`, `perfil=morador|cooperativa`, `antes` e `limite` (1–50). Resposta `{itens, proximo}`. Comentários e denúncias também usam `antes`/`limite`.

## Validação executada

- 32 testes backend aprovados: regressão das coletas/publicação e dez testes de integração da Comunidade, usando PostgreSQL real descartável e o papel restrito.
- Incluem: concorrência, crédito único, exclusão concorrente, cotas/estorno, segunda-feira e horário de Brasília, mesma regra para os perfis, configuração, repetição, antispam, autorização, paginação, denúncias, RLS e ausência de alteração na carteira de coletas.
- Sete testes frontend existentes aprovados; build Vite aprovado. Gestão, trocas no Mercado e recuperação de senha (transporte simulado, sem envio de e-mail) também verificados.
- Playwright com login real na API local: publicação → aprovação → 10 pontos → comentário → denúncia → remoção pelo moderador → encerramento → exclusão da publicação → saldo zero com cota consumida. Falha temporária e Tentar novamente também verificados. Sem erros JavaScript; sem overflow nas larguras 320, 390, 768 e 1440 px. Capturas ignoradas pelo Git em `frontend/resultados-visuais/comunidade/`.
- Contas e publicações de teste existem somente no banco local descartável. Nenhum conteúdo fictício inserido em produção.

Com o PostgreSQL de teste iniciado, executar em `backend/`:

```powershell
..\venv\Scripts\python.exe -m unittest teste_operacao teste_publicacao teste_comunidade -v
..\venv\Scripts\python.exe preview_comunidade.py
```

Em outro terminal, `frontend/`:

```powershell
$env:VITE_API_URL = 'http://127.0.0.1:8001'
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Em outro terminal, na mesma pasta: `node testes/comunidade.interface.cjs`. O servidor de teste prepara schema novo e o remove ao encerrar; reinicie-o antes de repetir o roteiro. `preview_comunidade.py` não deve ser publicado; a entrada continua `main:app`.

## Publicação concluída

- Frontend: https://ciclo-certo.vercel.app — Vite, produção READY. Build `dpl_B6N9nP4Sz1asMz1dqHTeeJzn1PE8`.
- API: https://ciclo-certo-api.vercel.app — FastAPI, produção READY. Build `dpl_41H2AqCgKCxgXA5569J5aFqtmbS8`.
- Código integrado: `4f43361`. Builds feitos a partir de arquivos versionados, preparados sem atribuir domínios e depois promovidos. Nenhum `.env`, token ou módulo de teste enviado.
- As 30 rotas anteriores permanecem presentes; nove caminhos da Comunidade adicionados. API de saúde 200; Comunidade sem token 401; preflight da origem autorizada 200 e origem externa 400.
- Páginas públicas, login e cooperador verificados no navegador; recuperação aberta pelo botão do login. Bundle publicado contém Comunidade e a URL correta da API. Sem erros JavaScript nessas verificações.
- Autenticação e operações completas verificadas no PostgreSQL local descartável. Não foram criados tokens para contas reais nem conteúdo de teste em produção; o login autenticado de produção fica para o uso normal da conta do usuário.
- Contagens e resumos de integridade antes/depois idênticos: 5 usuários, 5 coletas, 14 pesagens, 5 movimentos, 8 produtos e 2 pedidos de recompensa.
- Seis tabelas novas com RLS e sem acesso direto de `anon`/`authenticated`; papel da API com permissões conferidas. Advisor de segurança sem alertas. Consulta aos logs da nova API, níveis error/fatal nos últimos 30 minutos, retornou zero registros após a publicação.
- Moderação concedida a `da0602766@gmail.com`. Entrar pelo acesso do cooperador e abrir Comunidade → Aprovações/Denúncias.
