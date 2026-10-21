# Briefing · Ciclo Certo

Cartilha 2 · cooperativa de recicláveis. Fonte do problema: [CARTILHA.md](CARTILHA.md).

## Problema

Hoje a coleta é marcada por telefone, e os pontos ficam numa planilha que o morador nunca vê.

A dor que pesa mais são **os pontos invisíveis**. O telefone é incômodo, mas funciona: a coleta
acontece. Já a pontuação que a Joana nunca vê tira o motivo de ela continuar separando o lixo.

- **O morador perde:** não sabe se o esforço valeu nem quanto tem para trocar.
- **A cooperativa perde:** a confiança do morador, e continua dependendo de ligação e de planilha
  para tudo.

## Objetivo

Permitir que o morador agende e acompanhe suas coletas sem depender do telefone, enquanto a cooperativa
visualiza as coletas do dia e registra as pesagens com clareza e segurança.

**Sinais de que funcionou:**

- Joana conclui um agendamento pelo celular sem precisar ligar para a cooperativa.
- Osmar registra uma pesagem e confere os pontos sem sair da tela da balança.

## Público

- **Joana, moradora. Usa no celular.** Tem pressa: usa em pé ou entre uma sala e outra, em poucos
  minutos e com uma mão. Está acostumada com celular, mas não tem paciência para formulário longo.
- **Osmar, coordenador da cooperativa. Usa no computador.** Usa o computador do galpão, em pé, entre
  uma descarga e outra do caminhão. O ambiente é barulhento, e às vezes ele está de luva ou com a mão
  suja. Precisa de poucos cliques e de números fáceis de ler.

## Dores e soluções

### Joana, moradora

| Dor ou necessidade | Solução proposta |
|---|---|
| Depender de uma ligação para agendar. | Formulário direto com endereço, dia e informação sobre o material separado, seguido de confirmação do envio. |
| Não conseguir consultar os pontos das entregas. | Mostrar o total de pontos em cada coleta e permitir consultar as pesagens relacionadas. |
| Precisar saber a situação das próprias coletas. | Lista com data, endereço, situação e pontos, sem exigir que a pessoa abra cada item para entender o básico. |
| Agendar em pouco tempo pelo celular. | Formulário de uma etapa, rótulos claros, campos organizados verticalmente e uma ação principal fácil de encontrar. |
| Possível confusão entre material informado e material pesado (risco inferido). | Diferenciar "material informado no agendamento" de "pesagem registrada". Antes da primeira pesagem, mostrar "Aguardando pesagem" no lugar dos pontos. |

### Osmar, coordenador da cooperativa

| Dor ou necessidade | Solução proposta |
|---|---|
| Não conseguir enxergar rapidamente tudo que precisa acontecer naquele dia. | Tela **A rota** com filtro por dia e todas as coletas daquele dia numa tabela única. |
| Precisar registrar uma pesagem assim que o material chega, sem perder tempo procurando funções. | Tela **A balança** com formulário direto de material e quilos, e a coleta já selecionada. |
| Precisar conferir quanto a coleta gerou sem fazer contas manualmente. | Mostrar o total de pontos atualizado após cada pesagem, deixando o cálculo para o serviço. |
| Registrar a pesagem na coleta errada (risco inferido). | Manter no topo da balança o contexto da coleta: nome do morador, endereço, dia e situação, antes do formulário. |

## Decisões de modelagem e de interface

- **Usuário, coleta e pesagem são persistidos no MySQL.** SQLAlchemy faz o acesso e Alembic
  mantém o histórico das mudanças. O sistema saiu da memória para preservar coletas e pontos
  depois de reiniciar a API, mantendo as três entidades da cartilha.
- **O perfil vem do login confirmado pelo backend.** O cadastro protege a senha com Argon2;
  o login entrega um JWT válido por 60 minutos. A coleta guarda o `morador_id` do usuário
  autenticado. Joana vê somente suas coletas; Osmar consulta a rota e registra pesagens.
  O seletor sem senha usado antes do ciclo 4 foi substituído pelo login.
- **O que a Joana separou fica na coleta, no campo `materiais_informados`.** A cartilha pede essa
  informação no agendamento; sem guardá-la, ela se perderia depois do envio. Não é uma quarta
  entidade nem regra nova. Materiais informados são a expectativa da Joana; as pesagens são o que
  chegou de fato, e só elas geram pontos.
- **Antes da primeira pesagem, a tela mostra "Aguardando pesagem".** No back a coleta segue como a
  cartilha manda: agendada, com 0 pontos. Na tela da Joana, o estado vem primeiro, com a linha
  secundária "Os pontos aparecerão após a pesagem do material." Nos detalhes aparece "0 pontos até
  o momento": a regra não é escondida, só explicada.
- **Osmar chega à balança clicando numa coleta da rota** (A rota → selecionar coleta → A balança).
  A coleta já aparece identificada com morador, endereço, dia e situação. Ele não escolhe a coleta
  de novo, o que reduz o risco de pesar na coleta errada. É uma decisão de navegação, não regra nova.
- **Balança aberta sem coleta selecionada** (página recarregada ou acesso direto): a tela não mostra
  o formulário, e sim a mensagem "Escolha uma coleta na rota" com um botão de volta para A rota.
  Assim a pesagem nunca fica sem coleta, e a demonstração não quebra.

- **Peso positivo, sem teto de negócio ou precisão fixa.** A cartilha não limita pesagens a
  1.000 kg nem exige centésimos de quilo. Esses limites foram retirados; o backend continua
  validando números positivos e representáveis. A quantidade de itens informados no
  agendamento também não tem teto de seis itens. Os multiplicadores permanecem os da cartilha.

## Funcionalidade com IA — planejada

**Escolha do aluno em 21/10/2026:** explicar os pontos de uma coleta para o morador,
usando um agente e o provedor OpenAI. A integração ainda não está implementada.

- **Problema e benefício:** a dor principal é não entender de onde vieram os pontos. Joana poderá
  pedir uma explicação curta, associando cada pesagem aos pontos registrados.
- **Alternativas discutidas:** ajudar a descrever materiais no agendamento ou resumir as coletas
  do dia para Osmar. A explicação foi escolhida por tratar a dor prioritária com dados existentes.
- **Um agente:** consulta dados autorizados e explica. O objetivo único não exige dividir a
  tarefa entre vários agentes; isso acrescentaria etapas sem necessidade identificada.
- **Fluxo planejado:** Joana abre uma coleta e pede a explicação; o backend valida token e dono,
  oferece uma ferramenta restrita àquela coleta, consulta a OpenAI e valida a resposta.
- **Dados acessados:** identificador, situação, materiais, quilos e pontos das pesagens,
  multiplicadores oficiais e total calculado. Nome, endereço, e-mail e credenciais ficam de fora.
- **Limites:** a IA não pesa, calcula, altera pontos, muda situação, concede descontos ou cria
  coletas. Não acessa dados de outros moradores nem recebe ferramentas de escrita.
- **Revisão humana:** Joana confere a explicação com as pesagens exibidas. Um erro na explicação
  não altera o histórico; eventual divergência é sinalizada sem correção automática.
- **Falhas:** pedir esclarecimento se faltar contexto; não inventar dados inconsistentes;
  se o provedor falhar, informar indisponibilidade e preservar a consulta convencional.
- **Entrega desta etapa:** prompt, ensaios e integração em [`.docs/ia.md`](../.docs/ia.md);
  implementação futura no [roadmap](../.docs/roadmap.md).

## Tom e personalidade da marca

O Ciclo Certo fala com a Joana como um vizinho organizado falaria.

- **Clara:** mostra sempre a situação da coleta e os pontos, sem a pessoa precisar procurar.
- **Confiável:** os pontos vêm da balança, não de uma promessa.
- **Próxima:** fala como alguém do bairro, não como uma empresa.
- **Evitar: burocrática.** É exatamente o que a planilha e o telefone representam hoje.

## Diferencial

**Transparência da coleta, do agendamento à pesagem.** A Joana sempre sabe em que pé está a coleta
dela e de onde veio cada ponto. Três escolhas sustentam isso:

- separar o que a Joana informou do que foi de fato pesado;
- mostrar "Aguardando pesagem" em vez de um zero seco;
- deixar a balança sempre mostrando de quem é a coleta que está sendo pesada.

## Fora do escopo

Definido pela cartilha: troca dos pontos por desconto, mapa da rota, pagamento e aviso por mensagem.

Deixado de fora por decisão minha:

- **Cancelar ou editar uma coleta agendada.** A cartilha não pede, e seria uma regra nova no serviço.
- **Corrigir ou apagar uma pesagem.** Mudaria os pontos depois de somados, e a regra da cartilha só
  fala em somar.
