# Participação, compartilhamento e ações do bairro

Implementação autorizada em 04/11/2026 após a lista de sugestões. Mantém a identidade visual e as regras da Comunidade: 10 pontos por aprovação, até 2/dia e 6/semana, Brasília, semana na segunda-feira; comentários, favoritos, inscrições e destaque editorial não concedem pontos. Coletas permanecem separadas.

## Jornadas implementadas

- `/comunidade`: leitura pública somente de publicações aprovadas com consentimento explícito. As publicações anteriores continuam privadas para visitantes; nome e conteúdo só entram no contrato público com `publica=true`. Comentários continuam autenticados.
- `/comunidade/publicacao/{id}`: leitura individual. `/p/{id}` usa rewrite para HTML da API com Open Graph, texto escapado e imagem institucional; redireciona o navegador para a página individual. Conteúdo privado, pendente ou excluído retorna 404 e não entra na prévia. Cache `no-store`.
- WhatsApp por link e cópia do endereço público. Favoritos por conta e aba Salvas. Leitura longa com Ler mais, data relativa com data completa acessível, ações secundárias em menu.
- Respostas a comentários da mesma publicação; aviso durável somente ao autor respondido, sem pontos. Central de notificações com paginação, estados e botão para abrir o conteúdo, inclusive pelo aviso flutuante.
- Autor pode corrigir publicação recusada após um minuto e reenviar. Preserva versão, texto e motivo anteriores; incrementa revisão, volta para pendente, e cria nova notificação na próxima decisão. Publicações aprovadas/excluídas não podem ser reenviadas. Hashes históricos impedem republicar conteúdo antigo, e vídeos anteriores também são verificados. Crédito mantém chave única por publicação.
- Agendar novamente: seletor de coleta anterior reaproveita somente endereço e materiais; limpa data/hora e exige nova confirmação dos dados. Nenhuma coleta é criada ao selecionar.
- Meu impacto apresenta coletas concluídas e pesos reais, por material e por mês, isolados por morador ou cooperador responsável. Sem estimativa de CO₂, árvores ou peso não registrado.
- Navegação móvel com quatro destinos principais e Mais. Perfil, notificações, impacto, ações e convites ficam acessíveis pelo menu; ferramentas anteriores da cooperativa são preservadas.
- Moderação cadastra ações reais (evento, pergunta ou destaque), com período, descrição, local para eventos e inscrição idempotente. Destaque requer publicação pública aprovada e não concede bônus. Encerramento preserva inscrições; destaque removido/privado sai da vitrine. Ações abertas também aparecem na página pública.
- Pergunta da semana convida à composição de resposta; destaque abre a publicação. Exemplos editoriais explícitos só aparecem quando a seleção do feed não contém publicações reais.
- QR code local para agendamento, comunidade ou link público, com download PNG; biblioteca `qrcode@1.5.4`, carregada sob demanda. Nenhum parceiro ou evento fictício criado em produção.
- Indicadores exclusivos da moderação: sessões visitantes e novos cadastros em 30 dias, cadastros atribuídos à comunidade na mesma aba, contas com primeiro agendamento, acessos, retorno entre dias 1–7 e tempo médio entre criação/análise. Data de criação de contas antigas permanece desconhecida, sem backfill inventado. Sessão não equivale a pessoa; retorno começa na instrumentação; agendamento histórico pode ter sido cancelado.

## Persistência e privacidade

Migração local `supabase/migrations/20261104214055_comunidade_participacao.sql`: seis tabelas novas, três extensões de tabelas da Comunidade e data opcional de criação em usuários. Dados existentes não são reescritos para publicidade. RLS habilitado, nenhum acesso direto concedido a `anon` ou `authenticated`; todas as decisões de autoria/perfil ficam na API autenticada. Chave de notificação nullable permite a transição com a API anterior; a API nova sempre grava chave idempotente.

Feed autenticado usa lotes de 12 com janela de 60; feed público consulta 12 e mantém no máximo 60 cartões. Histórico de avisos usa páginas de 20; versões mostram as últimas 30. Ações ativas limitadas a 50. Favoritos são consultados somente para a página atual. Nenhum segredo no cliente ou no QR.

## Validação local

- `python -m unittest teste_participacao teste_operacao teste_comunidade teste_publicacao`: 42 testes aprovados em PostgreSQL descartável com papel restrito, incluindo preservação histórica, RLS, concorrência, consentimento, correção/revisão/crédito único, resposta cruzada recusada, favoritos privados, inscrição sem duplicidade, datas e impacto somente de coletas concluídas.
- Nove testes Node aprovados e build Vite aprovado.
- Playwright: `comunidade.interface.cjs`, `comunidade.avisos-video.cjs`, `comunidade.rolagem.cjs` e `participacao.interface.cjs`. O último cobre publicação pública, destino após login, favorito, resposta com aviso, central, inscrição, QR e reaproveitamento de endereço sem data/hora. Larguras 320, 390, 768 e 1440, sem erros JavaScript nem rolagem horizontal.
- Contas e conteúdos de validação exclusivamente no PostgreSQL local. Capturas em `frontend/resultados-visuais/participacao/`, ignoradas pelo Git.

Teste de prévia real do WhatsApp e aparelho físico depende do uso normal após uma publicação autorizada pelo autor; não se publica conteúdo fictício para produzir essa evidência.

## Implantação

Publicado em 04/11/2026, código `54195d7`. API `dpl_GxCtEVBAm3GuDXjAhNbC2vJiRN4E` e frontend `dpl_4uiYy24AA44yMhcxZwcAs7KAFxap`, ambos READY, preparados sem domínio e promovidos nesta ordem após conferência. Bundle oficial `/assets/index-BS5WuJcw.js`.

Migração local `20261104214055_comunidade_participacao.sql` registrada remotamente como `20261104220504_comunidade_participacao`: **é a mesma migração, não reaplicar**. Advisor de segurança sem alertas. Hashes antes/depois idênticos dos campos anteriores de usuários, publicações, coletas e pesagens. No momento da migração: cinco usuários, cinco coletas, 14 pesagens, três publicações, dois créditos e nenhum comentário; todas as publicações existentes continuam `publica=false`.

API oficial: saúde e leituras públicas 200; avisos, indicadores e detalhe autenticado 401 sem token; 58 caminhos preservando os 41 anteriores; CORS da origem oficial aprovado. Link compartilhado de conteúdo privado retorna 404 pelo rewrite. Início, login, cooperador e comunidade pública conferidos em 320/390/1440 px, HTTP 200, sem erro JavaScript nem overflow. Visitas de validação interceptadas no navegador para não contaminar os indicadores. Logs error/fatal da API: zero registros após a promoção.

Os fluxos autenticados foram validados com API real e PostgreSQL local descartável; não se criaram contas, tokens ou conteúdo artificial em produção. Novas perguntas, eventos e destaques dependem do cadastro de informações reais pela moderação em Mais → Ações do bairro.
