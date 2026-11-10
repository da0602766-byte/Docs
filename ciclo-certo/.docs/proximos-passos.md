> **Participação ampliada — publicado em 04/11/2026:** leitura pública opt-in, links/WhatsApp, favoritos, respostas, correções com histórico, central de avisos, agendar novamente, impacto real, menu Mais, ações do bairro, QR e indicadores. 42 testes backend, nove frontend e jornadas no navegador aprovados. Migração incremental e domínios oficiais conferidos; dados preservados. Operação, limites e IDs em [participacao.md](participacao.md).
>
> **Comunidade: avisos e YouTube — publicado em 04/11/2026:** avisos persistentes de aprovação/recusa com som, folhas aleatórias, cartões separados e vídeos por link. Migração aditiva aplicada, dados preservados, 36 testes backend e nove frontend aprovados. Detalhes em [comunidade.md](comunidade.md).
>
> **Redesenho da Comunidade — publicado em 04/11/2026:** compositor sob demanda, folhas e som de confirmação, pontos compactos, exemplos explicitamente ilustrativos e rolagem por lotes com limite de 60 registros. Validação local concluída: fluxo real, rolagem/falhas, acessibilidade, 32 testes backend e 7 frontend. Domínio oficial conferido com o novo build. Sem migração nem conteúdo fictício no banco. Detalhes e comandos em [comunidade.md](comunidade.md).
>
> **Comunidade — primeira publicação de 04/11/2026:** integrada à versão em produção, preservando Mercado, Gestão e recuperação de senha. Fontes recuperadas da Vercel; 32 testes backend, 7 frontend e fluxo completo no navegador aprovados. Publicação concluída nos endereços oficiais, com dados preservados e moderação concedida a `da0602766@gmail.com`; detalhes em `ciclo-certo/.docs/comunidade.md`.

> Evolução local de loja e gestão concluída em 29/10/2026, ainda sem publicação. Consulte [mercado-gestao.md](mercado-gestao.md) antes de seguir as notas históricas abaixo.

> Atualização de 29/10/2026: versão `cb9cb24` publicada no frontend e na API da Vercel. Migração aplicada ao Supabase, preservando os 5 usuários, 1 coleta e 3 pesagens. Páginas públicas, catálogo, saúde, CORS e bloqueio sem token aprovados. Validação local: 20 testes backend, 3 frontend e build aprovados. Login em produção e câmera/assinatura em aparelho físico ainda pendentes. A revisão automática bloqueou o teste que criaria tokens para contas reais; ele não foi executado.
>
> A migração local `20261029023257_fluxo_coletas_recompensas.sql` foi registrada pelo MCP no histórico remoto como `20261029033020_fluxo_coletas_recompensas`: é a mesma migração, não reaplicar. As referências abaixo a entrega somente local ou produção antiga registram o estado anterior a esta publicação.

# Próximos passos

## Evolução local após a lista de melhorias

As funcionalidades solicitadas estão implementadas localmente; etapas, regras, 20 testes e limites em [melhorias-coletas.md](melhorias-coletas.md). A produção descrita abaixo ainda é a versão anterior. Próximo passo de implantação: migração incremental + API + frontend, com teste manual de câmera/assinatura. Não executar novamente a estrutura inicial sobre o banco existente. Suíte vigente: `teste_operacao` e `teste_publicacao`; a suíte antiga está em `backend/legado/fluxo_v1/`.

Atualizado em 28/10/2026; consulte `validacao.md` para o que foi efetivamente executado.

## Entrega atual

Solicitação posterior de 28/10/2026: publicação na Vercel concluída na equipe `projetos-fd50`. Frontend em `https://ciclo-certo.vercel.app` e API em `https://ciclo-certo-api.vercel.app`, conectados ao GitHub na branch `main`, com variáveis de Production. Fluxo de leitura validado em navegador para os dois perfis. Veja `docs/VERCEL.md`. O pedido anterior de execução local não limita essa nova publicação autorizada.

Decisão anterior, ampliada pela publicação autorizada acima: manter execução local disponível e migrar o banco para Supabase. O GitHub Pages foi desativado e seu workflow removido; não publicar novamente no Pages sem solicitação explícita. Frontend local em `http://127.0.0.1:5175`, API em `http://127.0.0.1:8000` e PostgreSQL no projeto Supabase `plhfkhxzmxzyfygjyzbk`. O `.env` já aponta para esse destino; o MySQL original foi preservado como snapshot, sem sincronização automática.

Migração concluída em 28/10/2026: 4 usuários preservados, nenhuma coleta/pesagem existente; 17 testes passaram em cada banco. Ao iniciar a API pelo comando do README, ela usa Supabase. Não havia servidor local em execução durante a troca. Operação e backup em `backend/supabase/README.md`. O backend agora é exclusivamente PostgreSQL, sem fallback MySQL; scripts antigos em `backend/legado/mysql/`. Os testes atuais são executados por `python -m unittest teste_banco -v` no schema PostgreSQL descartável.

1. Revisar pessoalmente o novo visual e conferir em aparelhos físicos. As quatro telas foram inspecionadas e exercitadas em Edge, nas larguras 1440, 390 e 320 px; detalhes em `visual-volta.md`.
2. Repetir o roteiro integrado com contas autorizadas se houver mudanças na API. Login incorreto, F5, Sair, expiração e recuperação de falhas passaram no navegador com API simulada; testes HTTP reais anteriores em `validacao.md`.
3. Estudar decisões, DER e plano de IA; preparar explicação pessoal de negócio, camadas, Argon2, JWT, 401/403 e limites do agente.
4. Preparar a apresentação da entrega. O código e as alterações autorais do briefing estão versionados no GitHub.

Execução em clone local limpo de um snapshot das fontes atuais, banco vazio, revisão 0003, preservação de registros no banco local e testes HTTP já concluídos; evidências em `validacao.md`.

## Implementação futura de IA

1. Definir modelo OpenAI, orçamento e credencial somente no backend.
2. Implementar leitura autorizada e endpoint planejado; testar acesso antes do provedor.
3. Integrar Responses API, ferramenta restrita e validação de resposta/falhas/timeout.
4. Adicionar botão e estados de carregamento/erro ao detalhe da coleta.
5. Repetir ensaios pelo caminho real da API e comparar com o histórico.

IA ainda não implementada. Não criar chamadas pagas, dados reais ou contas na aplicação para apresentar o plano como concluído.
