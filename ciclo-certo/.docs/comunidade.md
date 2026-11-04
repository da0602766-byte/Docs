# Comunidade — atualização de 04/11/2026

## Estado da entrega

Implementada e integrada às fontes da produção recuperadas pela CLI autenticada da Vercel. Mercado, Gestão, recuperação de senha, catálogo e refinamentos visuais foram restaurados da publicação existente; os metadados Git dessa publicação ainda apontavam para `6f16815`, mas seus arquivos-fonte continham alterações posteriores. Fontes: API `dpl_gy9CQ22n5MGNCeQjBoPQDtc8FrQr` e frontend `dpl_4WrFftx5LZinLiJSFApSrmHJn4CC`. Arquivos recuperados conferidos por SHA-1 antes da integração.

As migrações `20261029231401_mercado_gestao_local.sql` e `20261029231407_refinamento_interface_recuperacao.sql` foram recuperadas do histórico Supabase para reprodução local. **Já estão aplicadas em produção; não reaplicar.** Somente `20261104184651_comunidade.sql` será aplicada nesta entrega. Build e testes integrados aprovados; publicação em andamento.

Conta indicada pelo usuário para moderação: `da0602766@gmail.com`, existente no banco, perfil cooperativa. A concessão será feita na implantação; nunca criar conta nem modificar senha para testar.

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
