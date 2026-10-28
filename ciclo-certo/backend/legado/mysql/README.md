# Histórico MySQL

Arquivos preservados para consulta histórica da migração de 28/10/2026. Não são importados nem executados pelo backend atual. As migrations já aplicadas foram preservadas sem reescrever suas revisões.

O backend ativo usa exclusivamente PostgreSQL/psycopg. Estes scripts dependem da versão antiga dos modelos e da configuração: não os execute contra o Supabase nem como ferramentas atuais. Uma restauração MySQL exige restaurar também o código histórico e reconciliar gravações posteriores à migração.

O banco original não foi removido. A configuração anterior está no arquivo local ignorado pelo Git `backend/.env.mysql.local`, e o backup de dados em `backend/backups/`.
