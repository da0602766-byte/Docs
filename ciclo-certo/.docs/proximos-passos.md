# Próximos passos

Atualizado em 21/10/2026; consulte `validacao.md` para o que foi efetivamente executado.

## Entrega atual

Publicação: o frontend tem workflow GitHub Pages e base `/Docs/`. Para ativar login e operações online, falta hospedar a API e o MySQL e configurar `VITE_API_URL`; roteiro em `publicacao.md`.

1. Revisar pessoalmente o novo visual e conferir em aparelhos físicos. As quatro telas foram inspecionadas e exercitadas em Edge, nas larguras 1440, 390 e 320 px; detalhes em `visual-volta.md`.
2. Repetir o roteiro integrado com contas autorizadas se houver mudanças na API. Login incorreto, F5, Sair, expiração e recuperação de falhas passaram no navegador com API simulada; testes HTTP reais anteriores em `validacao.md`.
3. Estudar decisões, DER e plano de IA; preparar explicação pessoal de negócio, camadas, Argon2, JWT, 401/403 e limites do agente.
4. Preparar a apresentação da entrega. O trabalho anterior foi registrado no commit `7d83784`, com as alterações autorais do briefing preservadas.

Execução em clone local limpo de um snapshot das fontes atuais, banco vazio, revisão 0003, preservação de registros no banco local e testes HTTP já concluídos; evidências em `validacao.md`.

## Implementação futura de IA

1. Definir modelo OpenAI, orçamento e credencial somente no backend.
2. Implementar leitura autorizada e endpoint planejado; testar acesso antes do provedor.
3. Integrar Responses API, ferramenta restrita e validação de resposta/falhas/timeout.
4. Adicionar botão e estados de carregamento/erro ao detalhe da coleta.
5. Repetir ensaios pelo caminho real da API e comparar com o histórico.

IA ainda não implementada. Não criar chamadas pagas, dados reais ou contas na aplicação para apresentar o plano como concluído.
