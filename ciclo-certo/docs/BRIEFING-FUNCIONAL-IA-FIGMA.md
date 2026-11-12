# Ciclo Certo — briefing funcional para o Figma

## Projeto e objetivo da reestruturação

O Ciclo Certo conecta moradores que separam recicláveis à cooperativa que faz a coleta, a triagem e a pesagem. O morador pode agendar e acompanhar suas entregas. O cooperador organiza os pedidos, registra o que foi recolhido e conclui o atendimento. O sistema registra o histórico e libera pontos de acordo com as pesagens e a avaliação.

A proposta é reconstruir a experiência completa, desde a página inicial pública até a operação autenticada, com a IA como ponto de partida para as tarefas de cada perfil. A pessoa pode dizer o que precisa em linguagem natural, receber orientação e seguir para a ação correspondente. A conversa acompanha a tarefa até a revisão e a confirmação, com acesso direto às mesmas funções a qualquer momento.

Hoje, a IA publicada ajuda o morador a descrever e classificar materiais antes de agendar. As demais interações com a IA descritas neste briefing fazem parte da experiência proposta.

## Página inicial pública

- Explicar como funciona a coleta, o papel da cooperativa e o que acontece após a entrega. Responder perguntas sobre separação, acondicionamento, materiais e regras de pontuação com base nas informações oficiais do Ciclo Certo.
- Permitir que o visitante descreva materiais e receba orientações iniciais sem entrar. Quando houver dúvida sobre a composição de um objeto, a IA pede esclarecimento ou indica que a cooperativa precisa confirmar a triagem.
- Identificar a intenção do visitante e encaminhá-lo para o próximo passo. Quem quer agendar entra ou cria conta de morador. Quem vai operar a coleta segue para o acesso de cooperador com conta autorizada. Após o login, retomar a intenção e a descrição dos materiais.
- Dar acesso a perguntas frequentes, depoimentos aprovados, publicações públicas da comunidade, ações do bairro e recuperação de acesso. Consultas anônimas usam apenas informações públicas.

**Exemplo.** Uma pessoa pergunta se pode separar garrafas de vidro e latas para coleta. A IA orienta como acondicionar os materiais e oferece continuar com o agendamento. Depois de entrar, a pessoa encontra a descrição pronta para revisar e informa endereço e horário.

## Jornada do morador

| Intenção | O que a IA faz | O que o morador faz |
| --- | --- | --- |
| Agendar coleta | Organiza a descrição, sugere categorias, pergunta quando houver dúvida e consulta a disponibilidade real da agenda. Pode recuperar materiais e endereço de uma coleta anterior do próprio morador para revisão. | Corrige os itens, confere o endereço, escolhe o horário e confirma o agendamento. |
| Acompanhar uma coleta | Localiza os pedidos do morador e resume situação, data, horário e pendências. Quando houver mais de uma coleta possível, pede que ele escolha. | Abre o pedido, consulta os materiais, as pesagens e o comprovante quando disponível. |
| Entender pontos e recompensas | Explica os pesos registrados, os pontos previstos ou liberados, o motivo de uma pendência e as opções disponíveis na loja. | Consulta saldo e histórico, escolhe uma recompensa fictícia e confirma o resgate. |
| Avaliar o atendimento | Identifica a coleta que aguarda avaliação, explica o que falta para liberar os pontos e orienta o preenchimento. | Escolhe a nota e envia a avaliação. |
| Participar do bairro | Ajuda a encontrar publicações, ações e indicadores do próprio impacto com base nos dados disponíveis. Pode ajudar a preparar um texto para a comunidade. | Revisa o texto, escolhe se permite leitura pública e confirma a publicação ou a inscrição. |

O morador também pode consultar avisos, gerenciar a própria conta e acessar diretamente o histórico, a comunidade e a loja.

## Jornada do cooperador

| Intenção | O que a IA faz | O que o cooperador faz |
| --- | --- | --- |
| Organizar o dia | Consulta os pedidos pela data solicitada e resume horários, responsáveis, materiais declarados, vagas e pendências. | Abre os pedidos, confere a agenda e confirma eventuais ajustes de capacidade. |
| Preparar uma coleta | Sugere equipamentos a partir dos materiais declarados e sinaliza itens que precisam de cuidado ou confirmação. | Confere o pedido, ajusta o kit e confirma que assumiu a responsabilidade. |
| Registrar pesagens | Estrutura as medições informadas, identifica campos ausentes e apresenta os lançamentos para conferência. | Confirma categoria e peso medido, registra as pesagens e corrige ou remove lançamentos antes da finalização. |
| Finalizar ou cancelar | Indica o que falta para concluir, como pesagens, foto e assinatura. Em caso de cancelamento, organiza o motivo para revisão. | Confere os pesos com o morador, coleta as comprovações e confirma a finalização. Quando necessário, confirma o cancelamento com motivo. |
| Acompanhar pendências | Localiza coletas que aguardam avaliação e resume avisos e ocorrências. | Consulta o histórico e confirma o reenvio do lembrete quando necessário. |

As funções de gestão incluem pessoas, avaliações e depoimentos, catálogo da loja, histórico, comunidade, ações do bairro e indicadores. As funções de administração e moderação seguem as permissões específicas de cada conta.

## Regras da IA e do sistema

- A IA identifica a intenção, consulta informações autorizadas, explica regras e prepara ações para revisão. O sistema valida permissões, disponibilidade, dados e transições de estado antes de executar cada ação.
- Agendar, assumir, alterar a agenda, registrar ou corrigir peso, cancelar, finalizar, avaliar, resgatar, publicar e moderar exigem confirmação explícita da pessoa com permissão. O resultado é confirmado somente após resposta do sistema.
- A descrição inicial dos materiais ajuda a preparar a coleta. Os pontos são calculados pelo sistema a partir das pesagens registradas. A avaliação libera os pontos e qualquer nota válida libera o mesmo valor. Os resgates da loja são fictícios.
- O morador acessa somente seus dados privados. O cooperador consulta o que seu perfil permite. Alterações em uma coleta assumida, como pesagem e finalização, dependem da responsabilidade pelo atendimento.
- Informações enviadas à IA se limitam ao necessário para a tarefa. Senhas, tokens, endereços completos, fotos e assinaturas permanecem nos fluxos próprios do sistema. A IA usa o contexto autorizado para orientar a ação.
- Em caso de ambiguidade, a IA pede o dado necessário. Se uma vaga acabar antes da confirmação, consulta os horários novamente. Em caso de falha ou demora da IA, a pessoa mantém o que já preencheu e pode continuar pelo fluxo manual.

## Cenários que o Figma deve representar

1. **Visitante → morador.** Tirar dúvida sobre materiais, entrar, retomar a descrição e confirmar uma coleta com vaga disponível.
2. **Morador → acompanhamento e recompensa.** Consultar o pedido, conferir o comprovante, entender os pontos, avaliar e escolher uma recompensa.
3. **Cooperador → coleta concluída.** Consultar pedidos do dia, assumir um atendimento, preparar o kit, registrar pesos medidos, anexar foto, coletar assinatura e finalizar.
4. **Exceções.** Mostrar como seguir quando a IA pede esclarecimento, o horário deixa de estar disponível, a finalização tem dados pendentes, a conta não tem permissão ou o assistente fica indisponível.
