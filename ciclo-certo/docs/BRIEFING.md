# Briefing · Ciclo Certo

Cartilha 2 · cooperativa de recicláveis. Fonte do problema: [CARTILHA.md](CARTILHA.md).

## Problema

Hoje a coleta é marcada por telefone, e os pontos ficam numa planilha que o morador nunca vê.

(a responder: qual das duas dores pesa mais, e o que a cooperativa e o morador perdem com isso)

## Objetivo

Permitir que o morador agende e acompanhe suas coletas sem depender do telefone, enquanto a cooperativa
visualiza as coletas do dia e registra as pesagens com clareza e segurança.

**Sinais de que funcionou:**

- Joana conclui um agendamento pelo celular sem precisar ligar para a cooperativa.
- Osmar registra uma pesagem e confere os pontos sem sair da tela da balança.

## Público

- **Joana, moradora.** Usa no celular.
- **Osmar, coordenador da cooperativa.** Usa no computador.

(a responder: pressa, costume com tecnologia e onde cada um está quando usa o sistema)

## Dores e soluções

### Joana, moradora

| Dor ou necessidade | Solução proposta |
|---|---|
| Depender de uma ligação para agendar. | Formulário direto com endereço, dia e informação sobre o material separado, seguido de confirmação do envio. |
| Não conseguir consultar os pontos das entregas. | Mostrar o total de pontos em cada coleta e permitir consultar as pesagens relacionadas. |
| Precisar saber a situação das próprias coletas. | Lista com data, endereço, situação e pontos, sem exigir que a pessoa abra cada item para entender o básico. |
| Agendar em pouco tempo pelo celular. | Formulário de uma etapa, rótulos claros, campos organizados verticalmente e uma ação principal fácil de encontrar. |
| Possível confusão entre material informado e material pesado (risco inferido). | Diferenciar "material informado no agendamento" de "pesagem registrada". Não apresentar pontos antes de existir uma pesagem. |

### Osmar, coordenador da cooperativa

| Dor ou necessidade | Solução proposta |
|---|---|
| Não conseguir enxergar rapidamente tudo que precisa acontecer naquele dia. | Tela **A rota** com filtro por dia e todas as coletas daquele dia numa tabela única. |
| Precisar registrar uma pesagem assim que o material chega, sem perder tempo procurando funções. | Tela **A balança** com formulário direto de material e quilos, e a coleta já selecionada. |
| Precisar conferir quanto a coleta gerou sem fazer contas manualmente. | Mostrar o total de pontos atualizado após cada pesagem, deixando o cálculo para o serviço. |
| Registrar a pesagem na coleta errada (risco inferido). | Manter no topo da balança o contexto da coleta: nome do morador, endereço, dia e situação, antes do formulário. |

## Decisões de modelagem e de interface

- **Usuário fica no back, em memória.** A cartilha define o usuário como uma das três entidades e
  diferencia morador de cooperativa. A coleta guarda o `morador_id`, e o back devolve o nome do
  morador para a tela, sem uma tabela fixa de nomes no React. Sem banco e sem login: o perfil
  continua escolhido numa lista, sem senha.
- **O que a Joana separou fica na coleta, no campo `materiais_informados`.** A cartilha pede essa
  informação no agendamento; sem guardá-la, ela se perderia depois do envio. Não é uma quarta
  entidade nem regra nova. Materiais informados são a expectativa da Joana; as pesagens são o que
  chegou de fato, e só elas geram pontos.
- **Antes da primeira pesagem, a tela mostra "Aguardando pesagem".** No back a coleta segue como a
  cartilha manda: agendada, com 0 pontos. Na tela da Joana, o estado vem primeiro, com a linha
  secundária "Os pontos aparecerão após a pesagem do material." Nos detalhes aparece "0 pontos até
  o momento": a regra não é escondida, só explicada.

## Tom e personalidade da marca

(a responder: como a marca fala com a Joana, três características que deve transmitir e uma que deve evitar)

## Diferencial

(a responder: o que torna esta solução diferente da do colega)

## Fora do escopo

Definido pela cartilha: troca dos pontos por desconto, mapa da rota, pagamento e aviso por mensagem.

(a responder: se mais alguma coisa fica de fora, de propósito)
