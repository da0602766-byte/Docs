# Kit de equipamentos por coleta

Publicado em 04/11/2026 a pedido do usuário, na versão atual de `Docs/revisao-interface`.

## Uso

Em Pedidos, abrir uma coleta agendada e selecionar **Preparar kit e assumir**. Escolher os itens individualmente ou adicionar o **Kit essencial** (balança, luvas e sacos). A confirmação salva a responsabilidade e o kit atomicamente. A seleção é opcional e não reserva estoque. O responsável pode usar **Revisar kit** durante `em_coleta`; depois da finalização ou cancelamento, permanece apenas a consulta. A lista de pedidos indica a quantidade planejada.

Dez equipamentos: balança portátil, luvas de proteção, botas de segurança, colete refletivo, carrinho de carga, cintas de amarração, sacos de separação, caixas rígidas, lona de apoio e lanterna. Grupos: Pesagem, Proteção, Transporte, Organização e Apoio.

## Implementação

- Catálogo compartilhado da API em `servicos/equipamentos.py`, exposto por `/catalogo`. Aceita apenas códigos conhecidos e elimina duplicatas.
- `Assumir` recebe `equipamentos` opcional; `PUT /coletas/{identificador}/equipamentos` permite revisão somente pelo cooperador responsável em atendimento. Autenticação e bloqueio transacional existentes foram preservados.
- Coluna `coletas.equipamentos` JSON não nula, padrão `[]`. Nenhuma alteração nas regras de pesagens, pontos ou avaliações.
- Migração local `20261104231436_equipamentos_coleta.sql` registrada remotamente como `20261104232126_equipamentos_coleta`: é a mesma migração, não reaplicar.

## Validação

43 testes backend e nove frontend aprovados. Teste HTTP do kit cobre gravação, leitura, deduplicação, catálogo inválido, responsável errado, morador, ausência de sessão e edição após cancelamento. `node testes/equipamentos.interface.cjs` passou com a API real e PostgreSQL local descartável em 320/673/1440 px: selecionar essenciais e carrinho, assumir, revisar com lanterna, salvar, recarregar e consultar o kit. Sem erros JavaScript ou overflow horizontal. Capturas em `frontend/resultados-visuais/equipamentos/`. Nenhuma conta ou coleta artificial foi criada em produção.

Seis coletas existentes preservadas na migração; hash dos campos anteriores idêntico antes/depois: `1fb95c069a65e030c72bac05c0697418`. Kits iniciais vazios. Advisor de segurança sem alertas.

## Publicação

Equipe `projetos-fd50`. API `dpl_5yYZJctgtXBQjN4n2qq3FgAnpNti`, frontend `dpl_9S19hsX3A3yjX6rGtPLZnmFEkeYH`, ambos preparados em produção sem domínio e promovidos após conferência. Bundle oficial `/assets/index-UuD2ht0f.js`. Site `/cooperador` 200, catálogo oficial com dez opções e edição sem sessão 401. Escritas autenticadas foram testadas somente no banco local, sem mudar dados reais para validação. Publicação direta das fontes locais, sem commit ou push.
