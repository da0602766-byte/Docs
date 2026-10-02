# Styleguide

Este guia local registra as escolhas aplicadas no frontend enquanto o arquivo Figma nao existe.

## Marca

- Nome: **Ciclo Certo**.
- Assinatura: `Cooperativa de reciclaveis`.
- A marca usa um circulo aberto e uma folha para comunicar o ciclo do material e o cuidado do bairro.
- Use [logo-principal.svg](../marca/logo-principal.svg) em fundos claros e
  [logo-monocromatico.svg](../marca/logo-monocromatico.svg) quando houver apenas uma cor disponivel.

## Cores

| Uso | Cor | Codigo |
|---|---|---|
| Acao principal | Verde vivo | `#087A58` |
| Acao em destaque | Verde renovacao | `#10A875` |
| Texto | Verde profundo | `#173B35` |
| Fundo | Verde nevoa | `#EFF8F2` |
| Destaque decorativo | Lima | `#B7ED63` |
| Confirmacao | Verde claro | `#DFF7E9` |
| Aviso de coleta agendada | Amarelo claro | `#FFF2C8` |
| Erro | Vinho | `#A32842` |

## Tipografia e componentes

- Fonte: Segoe UI, com Arial como alternativa; ambas funcionam sem carregar biblioteca externa.
- Botoes tem no minimo 48 px de altura para facilitar o toque da Joana e o uso no galpao.
- Campos usam cantos de 13 px; cartoes e paineis usam de 20 a 28 px para separar os niveis da interface.
- A situacao sempre aparece como selo: amarelo para `agendada` e verde para `coletada`.

## Movimento e interacao

- Botoes sobem 2 px no hover e recuam no clique para comunicar a acao sem atrasar a tarefa.
- Campos recebem borda verde e anel de foco visivel para apoiar a navegacao por teclado.
- A troca de tela usa uma entrada curta de 420 ms; avisos e listas usam transicoes menores.
- `prefers-reduced-motion` desativa os movimentos para quem configurou essa preferencia no sistema.

## Responsividade

- A partir de 620 px ou menos, o cabecalho muda para uma coluna, os formularios usam uma coluna e os botoes ocupam melhor a largura do celular.
- A tabela da rota pode rolar horizontalmente em telas pequenas; assim nenhuma informacao e escondida.
