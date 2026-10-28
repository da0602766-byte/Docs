# Migração para Supabase

Destino autorizado em 28/10/2026: projeto `plhfkhxzmxzyfygjyzbk`, exibido como `da0602766@gmail.com's Project`, na conexão chamada “Docs”. Dashboard: <https://supabase.com/dashboard/project/plhfkhxzmxzyfygjyzbk>.

## Resultado desta execução

- Copiados e comparados integralmente: 4 usuários; 0 coletas; 0 pesagens. IDs, hashes Argon2 e a chave JWT foram preservados.
- Migration remota: `20261028224800_ciclo_certo_estrutura_postgresql`.
- 17 testes MySQL e 17 testes PostgreSQL aprovados; schema temporário removido. Nenhum registro fictício ficou no banco da aplicação.
- Com `DATABASE_URL` ativa, a API leu os 4 usuários migrados e suas coletas; requisição sem token respondeu 401. Nenhuma divergência entre metadata SQLAlchemy e estrutura remota.
- Auditor de segurança sem apontamentos. O auditor de desempenho informou somente dois [índices ainda não utilizados](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index), mantidos porque atendem filtros por dia e histórico de pesagens em tabelas ainda vazias.
- Backup: `backend/backups/mysql_20261028T225128943743Z.json`; configuração anterior: `backend/.env.mysql.local`. Ambos ignorados pelo Git. A origem MySQL permanece intacta.
- A API não estava em execução; a nova conexão foi validada via TestClient/FastAPI. Iniciar o servidor continua sendo feito pelo comando documentado no README principal.

## Estrutura e acesso

`estrutura.sql` é o baseline PostgreSQL equivalente ao MySQL na revisão `0003_limites_cartilha`. Foi registrado como `ciclo_certo_estrutura_postgresql` no histórico Supabase. Execute apenas em banco vazio, depois de provisionar o papel `ciclo_certo_backend`; alterações futuras exigem novas migrations. Os arquivos Alembic históricos não foram reescritos e continuam exclusivos do MySQL.

O papel do backend tem LOGIN, sem superusuário, criação de banco/papel ou BYPASSRLS. Pode ler/inserir usuários e pesagens, ler/inserir/atualizar coletas e usar as três sequences. Não pode apagar registros nem alterar a estrutura. A senha aleatória fica em `.env`, nunca neste SQL. As policies RLS autorizam apenas esse papel; o controle por morador/cooperativa continua na API. Os perfis `anon` e `authenticated` não têm privilégios nessas tabelas.

Conexão validada: pooler de sessão `aws-0-us-east-2.pooler.supabase.com:5432`, banco `postgres`, usuário `ciclo_certo_backend.plhfkhxzmxzyfygjyzbk`, driver `postgresql+psycopg`, TLS obrigatório. `verificar_conexao.py` verifica o TLS no trecho cliente → pooler, sem imprimir credenciais. [Referência oficial de conexão](https://supabase.com/docs/guides/database/connecting-to-postgres).

## Cópia e conferência

Na migração inicial, a ferramenta de cópia bloqueou escritas nas três tabelas MySQL, salvou backup JSON em `backend/backups/` (ignorado pelo Git), recusou destino com registros e copiou numa transação. Comparou integralmente as linhas ordenadas, incluindo IDs, hashes, nulos, datas, JSON e números. A ferramenta e as revisões antigas estão agora arquivadas em `backend/legado/mysql/`, para consulta histórica, sem participar do backend atual.

Após copiar, um administrador precisa ajustar cada sequence para o maior valor entre o próximo `AUTO_INCREMENT` da origem e `MAX(id) + 1` do destino, com `setval(..., próximo_id, false)`. Isso foi feito nesta migração. A ferramenta não concede privilégios administrativos à aplicação.

`DATABASE_URL` já aponta para a URL validada. O backend agora exige PostgreSQL e não oferece retorno por esvaziar essa variável. Uma eventual restauração MySQL exige recuperar também o código antigo e reconciliar gravações posteriores: o banco original não é sincronizado automaticamente.

## Testes

`teste_banco.py` executa os 17 contratos HTTP diretamente no PostgreSQL, em um schema descartável. Um administrador cria um schema `ciclo_certo_teste_` seguido de 32 caracteres hexadecimais e concede USAGE/CREATE somente nesse schema ao papel do backend. Configure `SUPABASE_ESQUEMA_TESTE` no ambiente do processo e execute, dentro de `backend/`:

```powershell
..\venv\Scripts\python.exe -m unittest teste_banco -v
```

A suíte recusa schema fora desse formato, ausente ou com tabelas; aplica o mesmo SQL estrutural no schema temporário e remove apenas suas tabelas ao terminar. Depois, o administrador remove o schema vazio com `DROP SCHEMA nome`, sem CASCADE. Nenhuma conta de teste é inserida em `public`.
