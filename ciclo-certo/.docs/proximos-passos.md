# Próximos passos

Atualizado em 28/10/2026; consulte `validacao.md` para o que foi efetivamente executado.

## Entrega atual

Solicitação posterior de 28/10/2026: preparar publicação na Vercel. Configurações, build e testes locais de publicação concluídos; falta conectar a conta Vercel, configurar as variáveis dos dois projetos e validar o deploy remoto. Siga `docs/VERCEL.md`. O pedido anterior de execução local não limita essa nova publicação autorizada.

Decisão do aluno: manter frontend e API em localhost e migrar o banco para Supabase. O GitHub Pages foi desativado e seu workflow removido; não publicar novamente sem solicitação explícita. Frontend local em `http://127.0.0.1:5175`, API em `http://127.0.0.1:8000` e PostgreSQL no projeto Supabase `plhfkhxzmxzyfygjyzbk`. O `.env` já aponta para esse destino; o MySQL original foi preservado como snapshot, sem sincronização automática.

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
