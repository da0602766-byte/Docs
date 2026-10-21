# Roadmap

## Base implementada

- [x] Cartilha, briefing, marca e styleguide local.
- [x] Quatro telas React e API por camadas.
- [x] Três entidades MySQL, migrations e pontuação da cartilha.
- [x] Cadastro, Argon2, JWT, perfis e isolamento.
- [x] Gravação atômica e soma concorrente de pontos.
- [x] Correção dos tetos de peso/materiais e da precisão do formulário.
- [x] DER, README de entrega e documentação de continuidade.

## Aula 10: planejamento

- [x] Discutir alternativas e escolher explicação dos pontos.
- [x] Definir um agente OpenAI, com leitura restrita e revisão humana.
- [x] Registrar fluxo/prompt em `ia.md` e marcar integração planejada no briefing.
- [x] Registrar três ensaios assistidos e ajustes do prompt, sem afirmar teste pela API.
- [x] Validar clone, banco vazio, build, testes e fluxo HTTP; registrar em `validacao.md`.
- [x] Adaptar o visual do ZIP e conferir as telas em viewports de celular/computador, com API simulada e capturas.
- [ ] Revisão pessoal em aparelhos físicos e estudo para a apresentação.

## MVP futuro — não implementado

1. **Configuração:** definir modelo compatível, orçamento, timeout e limite de chamadas. Na implementação, acrescentar OPENAI_API_KEY/OPENAI_MODEL à configuração; apenas chaves vazias ao .env.exemplo.
2. **Ferramenta:** `consultar_pontos_da_coleta`, sem ID ou usuário livre: backend vincula a coleta previamente autorizada. Reutilizar serviços e preparar retrato consistente sem dados pessoais.
3. **Endpoint proposto:** `POST /coletas/{coleta_id}/explicacao`, exclusivo do morador dono. Planejar 200 para explicação/estado; 401 sem autenticação; 403 sem permissão; 404 inexistente; 422 entrada inválida; 503 provedor indisponível. Ainda não existe no contrato atual.
4. **OpenAI:** Responses API com function calling para leitura e saída estruturada no formato de `ia.md`. Backend executa a ferramenta; modelo sem banco direto. Limitar rodadas e ferramentas permitidas.
5. **Validação/revisão:** conferir estrutura, estado, coleta e referências; mostrar pesagens oficiais junto da explicação. Texto gerado nunca substitui nem altera o histórico. Usuário pode descartar a explicação.
6. **Tela:** botão Explicar meus pontos no detalhe, carregamento e erro recuperável, sem bloquear as funções atuais ou gravar dados automaticamente.
7. **Testes:** normal, vago, fora do assunto, sem pesagem, dados inconsistentes, tentativa de mudar regras, coleta de outro morador, injeção no texto, token inválido, provedor indisponível, timeout e resposta inválida. Recusas de acesso não chamam o provedor; nenhuma explicação altera banco.

**Aceite:** somente coleta autorizada, valores preservados, ausência/inconsistência indicadas e falha da IA sem impedir agendamento, histórico ou pesagem.

## Depois do MVP

Avaliar clareza e tempo com usuários. Multiagentes, histórico de conversas e outras integrações exigem necessidade demonstrada e ficam fora desta entrega.
