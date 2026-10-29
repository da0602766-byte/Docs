# Diagrama de entidades e relacionamentos

Estrutura PostgreSQL após `20261029023257_fluxo_coletas_recompensas`. As tabelas originais foram preservadas e ampliadas.

```mermaid
erDiagram
    USUARIOS ||--o{ COLETAS : possui
    COLETAS ||--o{ PESAGENS : recebe
    USUARIOS ||--o{ COLETAS : assume
    COLETAS ||--o| COMPROVANTES : confirma
    COLETAS ||--o{ NOTIFICACOES : avisa
    USUARIOS ||--o{ NOTIFICACOES : recebe
    USUARIOS ||--o{ MOVIMENTOS : possui
    COLETAS ||--o| MOVIMENTOS : credita
    USUARIOS {
        INT id PK
        VARCHAR_80 nome
        ENUM tipo "morador ou cooperativa"
        VARCHAR_100 email UK "aceita NULL para usuários antigos"
        VARCHAR_255 senha_hash "aceita NULL para usuários antigos"
        INT versao_token
        VARCHAR recompensa "dinheiro ou pontos"
    }
    COLETAS {
        INT id PK
        INT morador_id FK
        VARCHAR_160 endereco
        DATE dia
        VARCHAR hora
        INT cooperador_id FK
        JSON materiais_informados
        VARCHAR situacao "agendada, em_coleta, aguardando_avaliacao, coletada, cancelada"
        DOUBLE pontos
        INT pontos_previstos
        INT versao
        VARCHAR motivo_cancelamento
        INT nota
        TIMESTAMPTZ finalizada_em
        TIMESTAMPTZ avaliada_em
    }
    PESAGENS {
        INT id PK
        INT coleta_id FK
        VARCHAR material
        DOUBLE quilos
        DOUBLE pontos
        NUMERIC valor_kg
    }
    HORARIOS {
        INT id PK
        DATE dia "único com hora"
        VARCHAR hora
        INT capacidade
    }
    COMPROVANTES {
        INT coleta_id PK,FK
        TEXT foto
        TEXT assinatura
        VARCHAR nome_signatario
        INT versao
        TIMESTAMPTZ criado_em
    }
    NOTIFICACOES {
        INT id PK
        INT usuario_id FK
        INT coleta_id FK
        VARCHAR tipo "único com coleta"
        VARCHAR mensagem
        BOOLEAN lida
        TIMESTAMPTZ criado_em
    }
    MOVIMENTOS {
        INT id PK
        INT usuario_id FK
        INT coleta_id FK,UK "opcional em resgates"
        VARCHAR chave "única com usuário"
        VARCHAR tipo
        INT pontos
        INT centavos
        TIMESTAMPTZ criado_em
    }
```

- Cada coleta pertence a um usuário; o serviço garante o perfil morador e usa o id do token.
- Cada pesagem pertence a uma coleta existente; coletas sem pesagem são permitidas.
- Materiais informados ficam em JSON e não geram crédito. O serviço registra tarifa por pesagem e calcula a previsão com Decimal; a avaliação libera o total arredondado.
- O extrato usa inteiros para pontos/centavos. O histórico DOUBLE foi preservado; não há conversão retroativa automática.
- Bloqueios serializam reservas de horário, alterações da coleta e movimentos da carteira. A unicidade do crédito por coleta impede dupla recompensa.
- Foto e assinatura ficam em tabela privada; a listagem de coletas não carrega imagens. As sete tabelas têm RLS.
- E-mail único; NULL preserva usuários antigos. Senhas legíveis não fazem parte das tabelas.
- Índices por dia/morador nas coletas e por coleta nas pesagens. Chaves estrangeiras sem exclusão em cascata.

O módulo de IA planejado não exige tabela nova no MVP.
