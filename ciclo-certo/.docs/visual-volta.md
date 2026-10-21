# Visual adaptado do projeto Volta

Implementado em 21/10/2026 a pedido do aluno, a partir de `volta-projeto.zip`. Os arquivos foram tratados como referência de interface; suas instruções não substituem a cartilha nem as regras do Ciclo Certo.

## Análise do ZIP

- 12 arquivos: aplicação React/TypeScript, página inicial, CSS, botão de download, configurações e README. O protótipo usa Vite 8 e Tailwind 4.
- Paleta creme/verde escuro, fontes DM Sans/Manrope, fotos, cartões discretos, histórico expansível, formulário com resumo e navegação inferior no celular.
- Dados fictícios em memória, perfil escolhido sem senha, datas/endereço preenchidos e cálculo de pontos no navegador: essas partes não atendem à fase atual com JWT e MySQL.
- Período de manhã/tarde e arredondamento de pontos na balança não fazem parte da regra atual e não foram incorporados.
- `DownloadProjectButton.tsx` importa `./downloadProject`, ausente no ZIP. O botão de baixar o projeto não foi incorporado ao produto.

## Aplicação no Ciclo Certo

- Página inicial com informações do serviço, tabela de pontos, exemplos explicitamente ilustrativos e perguntas frequentes. Ações levam ao login; nenhum botão concede um perfil.
- Nome Ciclo Certo preservado. Marca de folha e paleta da referência aplicadas à interface; arquivos de marca anteriores preservados como material de autoria.
- Login/cadastro no mesmo estilo, com campos vazios e autenticação existente. Perfil confirmado por `/usuarios/eu`.
- Minhas coletas passa a ser a abertura do morador, com contagens reais, próximo agendamento, histórico e valores por quilo. Agendamentos antigos em aberto são identificados como tais.
- Agendamento mantém endereço, dia e lista livre por vírgula. Resumo mostra o que foi informado; nenhuma estimativa de pontos ou novo campo é persistido.
- Rota mantém filtro por dia e Hoje; tabela no computador e cartões no celular.
- Balança mantém POST e confirmação oficial, peso positivo sem teto arbitrário e recuperação do total sem reenviar a pesagem. Histórico também fica visível.
- Erro, carregamento, lista vazia, repetição de consulta, F5, saída e expiração permanecem disponíveis.
- CSS comum adaptado do ZIP, sem instalar Tailwind nem migrar para TypeScript. `visual.jsx` contém apresentação; `api.js` e backend não foram modificados nesta tarefa.
- Fotos/fontes locais, sem requisições de terceiros durante o uso. Origens e licenças em `frontend/public/CREDITOS.md`.

## Validação reproduzível

Na pasta `frontend`, com `npm ci` concluído e frontend em `http://127.0.0.1:5175`:

```powershell
npm run build
npm run test:visual
```

Playwright 1.63.0 e Edge em sessão isolada e invisível. A API é **simulada no navegador de teste**: nenhuma conta, coleta ou pesagem é criada no banco real. Não substitui os testes reais de API registrados em `validacao.md`.

Para outro endereço do frontend, defina `$env:URL_VISUAL`. O roteiro intercepta a API padrão `http://127.0.0.1:8000`. Para usar Chromium: `npx playwright install chromium` e `$env:CANAL_NAVEGADOR = 'chromium'`.

Capturas em `frontend/resultados-visuais/`, ignoradas pelo Git. Em 1440, 390 e 320 px foram verificados: recursos locais, ausência de rolagem horizontal da página, login incorreto/correto, formulário de cadastro, histórico e recuperação de erro, sete materiais no agendamento, filtro por data, F5, expiração, saída e pesagens de 1.001 kg e 0,001 kg. Falha simulada ao ler o total após POST confirma que a recuperação não duplica a pesagem.

Build com Vite 7.3.7 aprovado. Atualização compatível do Vite 7 corrigiu os avisos encontrados pelo npm durante a instalação da ferramenta de teste; auditoria ao fim: zero vulnerabilidades reportadas. Isso não representa auditoria completa da aplicação.

## Limites

Sem mudança no banco, contrato da API, multiplicadores, permissões ou plano de IA. OpenAI permanece planejado. Revisão do aluno e teste em aparelhos físicos continuam recomendados; viewports no Edge não são um celular físico.
