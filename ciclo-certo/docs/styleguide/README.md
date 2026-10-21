# Styleguide

Atualizado em 21/10/2026 com o visual solicitado a partir de `volta-projeto.zip`. Adaptações em [visual-volta.md](../../.docs/visual-volta.md).

## Marca

- Nome **Ciclo Certo**, com folha em quadrado verde na interface.
- Os arquivos autorais [logo principal](../marca/logo-principal.svg) e [monocromático](../marca/logo-monocromatico.svg) foram preservados; não são a assinatura renderizada no novo cabeçalho.

## Cores

| Uso | Cor |
|---|---|
| Ação e próxima coleta | `#1F3D2B` |
| Ação ao passar o ponteiro | `#2D5039` |
| Texto | `#1D2A21` |
| Fundo creme | `#F7F5EE` |
| Cartões | `#FFFDF8` |
| Bordas | `#E2E0D6` |
| Destaque lima | `#D4E7A4` |
| Texto secundário | `#5F6A60` |
| Agendada | fundo `#F5E7D4`, texto `#8A5A22` |
| Coletada | fundo `#E4EED2`, texto `#3D5F2C` |
| Erro | fundo `#FFF2EC`, texto `#87371C` |

## Tipografia e componentes

- DM Sans para texto e Manrope para títulos; fontes locais, alternativas Segoe UI/sans-serif.
- Botões principais e campos com altura mínima de 48 px; ações compactas da tabela com 44 px.
- Campos com raio de 8 px e cartões com 12 px. Hierarquia por espaçamento e bordas discretas.
- Situação identificada por texto e cor.
- Pontos oficiais formatados em português com até 15 algarismos significativos. A interface não arredonda os cálculos do backend.

## Responsividade e acesso

- Navegação superior no computador; inferior até 960 px.
- Rota em cartões até 720 px; formulário, resumo e balança em uma coluna em telas menores.
- Controles por teclado, foco visível, rótulos, mensagens de erro/status e link para pular ao conteúdo.
- `prefers-reduced-motion` remove movimentos.
- Fotos/fontes locais; [créditos e licenças](../../frontend/public/CREDITOS.md).

## Verificação

Layout conferido em Edge com viewports de 1440, 390 e 320 px. Teste com API simulada: `npm run test:visual` na pasta `frontend`. Evidências e limites em [validação](../../.docs/validacao.md).
