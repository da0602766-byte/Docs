# Melhorias solicitadas — etapas e entrega local

Solicitação de 28/10/2026. Esta evolução amplia a cartilha original, que foi preservada. Código implementado e validado localmente; a publicação existente ainda usa a versão anterior.

## Etapas

| Etapa | Entrega | Situação |
|---|---|---|
| 1. Dados e regras | Migração incremental, 12 categorias remuneradas, eletrônicos sem tarifa, divisão configurável e extrato | Implementado; migração testada em PostgreSQL local |
| 2. Agendamento | Calendário dos dois perfis, dias livres/fechados, horários e capacidade por horário | Implementado e verificado por API e navegador |
| 3. Atendimento | Formulário de responsabilidade, pesos editáveis, cancelamento com motivo e aviso | Implementado; concorrência e permissões testadas |
| 4. Confirmação | Foto obrigatória, assinatura desenhada do solicitante, versão dos pesos e bloqueio após confirmação | Implementado; API testada; captura/envio em aparelho físico pendente |
| 5. Avaliação | Solicitação automática ao finalizar e reenvio pelo responsável | Implementado; notificação persistida na conta do morador |
| 6. Recompensas | Avaliação libera pontos, animação, conversão automática, opção de acumular e trocar, extrato | Implementado; API e carteira verificadas no navegador |
| 7. Perfil | Troca de e-mail/senha com senha atual, prevenção de duplicidade e revogação de sessões | Implementado e testado por HTTP |
| 8. Entrega | Documentação, build, testes de transação, isolamento, migração e concorrência | Concluído localmente; implantação em produção não executada |

## Fluxo e autorização

`agendada → em_coleta → aguardando_avaliacao → coletada`

`em_coleta → cancelada` quando o atendimento não puder ocorrer. O motivo é obrigatório e aparece nas notificações e no detalhe do morador. Uma vaga cancelada volta à agenda.

- Morador agenda somente para si. A agenda expõe capacidade agregada, sem nomes/endereços de outros moradores.
- Cooperador assume pelo formulário; o responsável vem do token. Outro cooperador não pode editar pesos, cancelar, finalizar ou acessar os comprovantes privados desse atendimento.
- Pesos podem ser adicionados, corrigidos e removidos enquanto `em_coleta`. A cada mudança, a versão aumenta. A confirmação exige a versão apresentada ao solicitante: mudanças concorrentes exigem nova conferência/assinatura.
- Foto JPEG/PNG válida e assinatura desenhada são verificadas e regravadas no backend, removendo metadados. O frontend também aceita WebP e converte para JPEG. Foto de origem até 15 MB, envio reduzido até 1,6 MB; assinatura até 250 KB. Imagens ficam em tabela privada, lidas por endpoint autenticado, sem URL pública.
- A assinatura registra ciência da retirada e dos pesos no dispositivo do atendimento. Não equivale a uma assinatura digital certificada nem comprova identidade criptograficamente.
- A finalização grava comprovante e solicitação de avaliação na mesma transação. O reenvio atualiza o aviso existente, sem multiplicar notificações.
- Qualquer nota de 1 a 5 libera o mesmo valor. Comentário é opcional. Somente o morador dono avalia. Repetições e requisições concorrentes não duplicam créditos.
- Avisos são internos ao aplicativo. Não há envio de e-mail, WhatsApp, SMS ou push externo.

## Conversão e regra inicial de divisão

As faixas abaixo foram fornecidas pelo usuário, sem verificação como cotação comercial vigente. Unidades aproximadas não substituem o peso da balança.

`valor do morador = Σ(peso em kg × preço médio da faixa × participação do morador)`

`pontos = arredondar(valor do morador × 100)`; `100 pontos = R$ 1,00 fictício`.

Participação inicial: **50% para o morador e 50% para a cooperativa**. É uma hipótese configurável de simulação, sem estudo de custos que garanta viabilidade comercial. O percentual fica em `PERCENTUAL_MORADOR` (1–99). Na participação da cooperativa estão implícitos transporte, triagem, processamento e operação; não existe pagamento real para nenhum perfil.

| Categoria | Faixa de referência/kg | Morador/kg a 50% |
|---|---|---|
| Cobre | R$ 25,00–35,00 | R$ 15,0000 |
| Latinhas de alumínio | R$ 6,00–9,30 | R$ 3,8250 |
| PET | R$ 2,50–4,50 | R$ 1,7500 |
| Plástico duro (PEAD/PP) | R$ 1,80–3,40 | R$ 1,3000 |
| Plástico filme | R$ 1,50–2,50 | R$ 1,0000 |
| Ferro/sucata | R$ 0,50–1,10 | R$ 0,4000 |
| Papel branco | R$ 0,60–1,00 | R$ 0,4000 |
| Longa vida | R$ 0,60–1,00 | R$ 0,4000 |
| Papelão | R$ 0,55–0,90 | R$ 0,3625 |
| Vidro transparente | R$ 0,35–0,65 | R$ 0,2500 |
| Papel misto | R$ 0,20–0,70 | R$ 0,2250 |
| Vidro colorido/misto | R$ 0,20–0,30 | R$ 0,1250 |
| Eletrônicos | Sem tarifa definida | Sem recompensa; orientar recebimento |

Pesos com precisão de até 0,001 kg; preço salvo com quatro casas por pesagem. O cálculo usa Decimal e arredonda uma vez, no total da coleta, para o ponto/centavo inteiro mais próximo (meio para cima). Dividir uma mesma pesagem em várias não aumenta o crédito. O preço registrado é preservado depois da confirmação. Limite técnico por coleta: 2 bilhões de pontos, validado antes da gravação.

Exemplo: 3 kg de latinhas × R$ 3,8250 = R$ 11,4750 → **1.148 pontos → R$ 11,48 fictícios**. A nota da avaliação não altera esse cálculo.

A carteira usa dinheiro automático por padrão. No modo pontos, a pessoa acumula para converter posteriormente ou consumir em um vale fictício. O extrato mostra o comprovante da troca; nenhum comércio aceita esse vale de demonstração. O mesmo crédito nunca fica disponível simultaneamente como dinheiro e pontos. Resgates têm chave de idempotência e bloqueio por usuário.

Coletas antigas já concluídas mantêm seus pontos originais. Não há conversão retroativa silenciosa dos pontos da cartilha para o novo saldo. Agendamentos antigos sem hora aparecem como “Horário não informado” e podem ser atendidos normalmente.

## Agenda inicial

Fuso fixo da operação: `America/Sao_Paulo`. Segunda a sábado, 08h, 09h, 10h, 11h, 13h, 14h, 15h e 16h, com três vagas por horário; domingo fechado por padrão. São hipóteses operacionais iniciais configuráveis por `HORARIOS_COLETA` e `CAPACIDADE_HORARIO`.

O cooperador pode ajustar a capacidade de um horário ou fechar com zero. Reservas existentes são preservadas; não é possível reduzir a capacidade abaixo da ocupação. Datas/horários passados não podem receber novos agendamentos. A última vaga é protegida contra reserva simultânea.

## Validação executada

- `python -m unittest teste_operacao teste_publicacao -v`: **20 testes passaram** em PostgreSQL 18.4 portátil local, com schemas descartáveis e a API usando o papel restrito `ciclo_certo_backend`.
- Migração aplicada sobre o baseline com conta e coleta históricas; registros preservados. RLS habilitada nas sete tabelas; acesso `anon` negado às novas tabelas.
- Concorrência real: última vaga, dois responsáveis, duas avaliações e dois resgates disputando o mesmo saldo.
- Permissões de dono/responsável, comprovação obrigatória, assinatura vazia, versão obsoleta, edição bloqueada, cancelamento, zero/negativo/precisão inválida, arredondamento, eletrônicos com recompensa zero, e-mail duplicado, senha atual e invalidação de tokens.
- `npm run build`: compilação concluída. Teste de configuração Vercel do frontend executado separadamente.
- Navegador Brave, com API e PostgreSQL locais: login dos perfis, calendário, agendamento real de teste, aviso de vidro, responsabilidade, adição e edição de pesos, notificação automática, avaliação, mensagem de 1.148 pontos e extrato de R$ 11,48 fictícios.
- Layout de carteira e calendário inspecionado em desktop e aproximadamente 390 pixels CSS; navegação móvel ajustada para quatro ações.
- **Limite do teste de interface:** a extensão Brave bloqueou o envio de arquivo local por falta de “Allow access to file URLs”; o controle nativo estava indisponível. Foto/assinatura e finalização foram testadas por HTTP, e uma fixture finalizada por API permitiu verificar avaliação/carteira no navegador. Captura de câmera, desenho com dedo e envio pela interface exigem confirmação manual em aparelho físico.

## Publicação

Arquivo incremental: `supabase/migrations/20261029023257_fluxo_coletas_recompensas.sql` (nome UTC gerado pela CLI). Não reexecutar o baseline em banco existente.

Antes de disponibilizar para usuários: aplicar a migração no projeto correto, implantar API e frontend de forma coordenada, configurar as regras de agenda/participação, testar foto/assinatura em aparelho físico e repetir um fluxo autorizado de ponta a ponta. As novas colunas são aditivas e o histórico é preservado, mas o backend antigo não entende os novos estados; não manter versões antiga e nova atendendo simultaneamente após começar a gravar novos estados.

Nenhum commit, push, deploy, alteração no banco Supabase de produção ou envio de mensagem externa foi feito nesta entrega.
