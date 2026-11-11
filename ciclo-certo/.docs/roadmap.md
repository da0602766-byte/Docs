# Roadmap

## Base implementada

- [x] Cartilha, briefing, marca e styleguide local.
- [x] Quatro telas React e API por camadas.
- [x] Três entidades MySQL, migrations e pontuação da cartilha.
- [x] Cadastro, Argon2, JWT, perfis e isolamento.
- [x] Gravação atômica e soma concorrente de pontos.
- [x] Correção dos tetos de peso/materiais e da precisão do formulário.
- [x] DER, README de entrega e documentação de continuidade.

## Aula 10: planejamento histórico

- [x] Discutir alternativas e escolher explicação dos pontos.
- [x] Definir um agente OpenAI, com leitura restrita e revisão humana.
- [x] Registrar fluxo/prompt em `ia.md` e marcar integração planejada no briefing.
- [x] Registrar três ensaios assistidos e ajustes do prompt, sem afirmar teste pela API.
- [x] Validar clone, banco vazio, build, testes e fluxo HTTP; registrar em `validacao.md`.
- [x] Adaptar o visual do ZIP e conferir as telas em viewports de celular/computador, com API simulada e capturas.
- [ ] Revisão pessoal em aparelhos físicos e estudo para a apresentação.

## MVP vigente — assistência no agendamento

- [x] Confirmar o recorte já escolhido: organizar materiais, sugerir categorias e pedir esclarecimento quando necessário. [Plano e histórico](ia.md).
- [x] Preparar configuração de Gemini e OpenRouter no backend, opcional e desativada por padrão.
- [ ] Escolher o provedor/modelo para o primeiro teste e definir orçamento, prazo de resposta e limite de chamadas por morador.
- [ ] Criar rota autenticada e contrato de entrada e saída. Recusar acesso e entradas inválidas antes do provedor.
- [ ] Integrar o provedor selecionado, validar a resposta e testar falhas com simulação. Em seguida, testar com exemplos fictícios na API externa.
- [ ] Adicionar prévia editável em Agendar coleta, com estados de carregamento e erro e preenchimento manual disponível.

**Aceite:** sugestão em português, categorias válidas ou dúvida explícita, nenhuma gravação automática, nenhum dado pessoal enviado e agendamento manual disponível durante falhas.

## Depois do MVP

Avaliar clareza e tempo com usuários. Multiagentes, histórico de conversas e outras integrações exigem necessidade demonstrada e ficam fora desta entrega.
