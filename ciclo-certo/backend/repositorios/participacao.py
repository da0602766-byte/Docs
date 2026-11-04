"""Persistência da participação: consultas limitadas e parâmetros vinculados pelo driver."""
from sqlalchemy import text


def linhas(sessao, consulta, dados=None):
    return [dict(r) for r in sessao.execute(text(consulta), dados or {}).mappings()]


def publico(sessao, antes, categoria, identificador=None):
    return linhas(sessao, """SELECT p.id,p.conteudo,p.categoria,p.youtube_id,p.criado_em,p.publica,u.nome,u.tipo
        FROM comunidade_publicacoes p JOIN usuarios u ON u.id=p.autor_id
        WHERE p.publica AND p.estado='aprovada' AND (CAST(:antes AS integer) IS NULL OR p.id<:antes)
        AND (:categoria='' OR p.categoria=:categoria) AND (CAST(:id AS integer) IS NULL OR p.id=:id)
        ORDER BY p.id DESC LIMIT 13""",dict(antes=antes,categoria=categoria,id=identificador))


def favorito(sessao, usuario, publicacao, salvar):
    sql = 'INSERT INTO comunidade_favoritos VALUES (:u,:p) ON CONFLICT DO NOTHING' if salvar else 'DELETE FROM comunidade_favoritos WHERE usuario_id=:u AND publicacao_id=:p'
    sessao.execute(text(sql),dict(u=usuario,p=publicacao))


def ids_favoritos(sessao, usuario, ids):
    return {r['publicacao_id'] for r in linhas(sessao,'SELECT publicacao_id FROM comunidade_favoritos WHERE usuario_id=:u AND publicacao_id=ANY(CAST(:ids AS integer[]))',dict(u=usuario,ids=ids))}


def historico(sessao, publicacao):
    return linhas(sessao,'SELECT revisao,conteudo,categoria,motivo,criado_em FROM comunidade_revisoes WHERE publicacao_id=:p ORDER BY revisao DESC LIMIT 30',dict(p=publicacao))


def arquivar(sessao,p,instante):
    sessao.execute(text('''INSERT INTO comunidade_revisoes(publicacao_id,revisao,conteudo,categoria,youtube_id,motivo,criado_em,resumo)
        VALUES (:p,:r,:c,:cat,:y,:m,:t,:h)'''),dict(p=p.id,r=p.revisao,c=p.conteudo,cat=p.categoria,y=p.youtube_id,m=p.motivo,t=p.moderado_em or instante,h=p.resumo))


def avisos(sessao,usuario,antes):
    return linhas(sessao,'SELECT id,publicacao_id,estado,mensagem,lida,criado_em FROM comunidade_notificacoes WHERE usuario_id=:u AND (CAST(:a AS integer) IS NULL OR id<:a) ORDER BY id DESC LIMIT 21',dict(u=usuario,a=antes))


def impacto(sessao,usuario,cooperador):
    filtro='c.cooperador_id=:u' if cooperador else 'c.morador_id=:u'
    parametros=dict(u=usuario)
    materiais=linhas(sessao,f"SELECT p.material,sum(p.quilos) AS quilos FROM pesagens p JOIN coletas c ON c.id=p.coleta_id WHERE {filtro} AND c.situacao='coletada' GROUP BY p.material ORDER BY quilos DESC",parametros)
    meses=linhas(sessao,f"SELECT to_char(c.dia,'YYYY-MM') AS mes,sum(p.quilos) AS quilos FROM pesagens p JOIN coletas c ON c.id=p.coleta_id WHERE {filtro} AND c.situacao='coletada' GROUP BY mes ORDER BY mes DESC LIMIT 12",parametros)
    coletas=linhas(sessao,f"SELECT count(*) AS quantidade FROM coletas c WHERE {filtro} AND c.situacao='coletada'",parametros)[0]['quantidade']
    return dict(materiais=materiais,meses=meses,coletas=coletas)


def acoes(sessao,usuario=None):
    return linhas(sessao,"""SELECT a.*, (SELECT count(*) FROM comunidade_inscricoes i WHERE i.acao_id=a.id) AS inscritos,
        EXISTS(SELECT 1 FROM comunidade_inscricoes i WHERE i.acao_id=a.id AND i.usuario_id=:u) AS inscrito
        FROM comunidade_acoes a WHERE a.ativa AND a.fim>now()
        AND (a.tipo!='destaque' OR EXISTS(SELECT 1 FROM comunidade_publicacoes p WHERE p.id=a.publicacao_id AND p.publica AND p.estado='aprovada'))
        ORDER BY a.inicio LIMIT 50""",dict(u=usuario))


def criar_acao(sessao,usuario,dados):
    return linhas(sessao,'''INSERT INTO comunidade_acoes(tipo,titulo,descricao,local,inicio,fim,publicacao_id,autor_id)
        VALUES (:tipo,:titulo,:descricao,:local,:inicio,:fim,:publicacao_id,:autor) RETURNING id''',dict(**dados,autor=usuario))[0]


def obter_acao(sessao,identificador):
    itens=linhas(sessao,'SELECT * FROM comunidade_acoes WHERE id=:id FOR UPDATE',dict(id=identificador))
    return itens[0] if itens else None


def cancelar_acao(sessao,identificador):
    sessao.execute(text('UPDATE comunidade_acoes SET ativa=false WHERE id=:id'),dict(id=identificador))


def inscrever(sessao,usuario,acao,participar):
    consulta='INSERT INTO comunidade_inscricoes VALUES (:a,:u) ON CONFLICT DO NOTHING' if participar else 'DELETE FROM comunidade_inscricoes WHERE acao_id=:a AND usuario_id=:u'
    sessao.execute(text(consulta),dict(a=acao,u=usuario))


def visita(sessao,sessao_id):
    sessao.execute(text('INSERT INTO comunidade_visitas(sessao) VALUES (:s) ON CONFLICT DO NOTHING'),dict(s=sessao_id))


def acesso(sessao,usuario):
    sessao.execute(text('INSERT INTO comunidade_acessos(usuario_id) VALUES (:u) ON CONFLICT DO NOTHING'),dict(u=usuario))


def conversao(sessao,usuario,identificador):
    sessao.execute(text('UPDATE comunidade_visitas SET usuario_id=:u WHERE sessao=:s AND usuario_id IS NULL AND dia=current_date'),dict(u=usuario,s=identificador))


def detalhe(sessao,usuario,identificador,moderador):
    p=linhas(sessao,"""SELECT p.*,u.nome,u.tipo,coalesce(c.pontos,0) AS pontos,c.estornado_em,
        (SELECT count(*) FROM comunidade_comentarios x WHERE x.publicacao_id=p.id AND x.excluido_em IS NULL) AS comentarios,
        EXISTS(SELECT 1 FROM comunidade_favoritos f WHERE f.publicacao_id=p.id AND f.usuario_id=:u) AS salva
        FROM comunidade_publicacoes p JOIN usuarios u ON u.id=p.autor_id LEFT JOIN comunidade_creditos c ON c.publicacao_id=p.id
        WHERE p.id=:p""",dict(u=usuario,p=identificador))[0]
    return dict(id=p['id'],conteudo=p['conteudo'],categoria=p['categoria'],youtube_id=p['youtube_id'],publica=p['publica'],revisao=p['revisao'],estado=p['estado'],criado_em=p['criado_em'],autor=dict(nome=p['nome'],perfil=p['tipo']),minha=p['autor_id']==usuario,pode_excluir=moderador or p['autor_id']==usuario,comentarios=p['comentarios'],salva=p['salva'],pontos=0 if p['estornado_em'] else p['pontos'],motivo=p['motivo'] if moderador or p['autor_id']==usuario else None)


def metricas(sessao):
    return linhas(sessao,"""SELECT
        (SELECT count(DISTINCT sessao) FROM comunidade_visitas WHERE dia>=current_date-30) AS sessoes_visitantes_30d,
        (SELECT count(DISTINCT usuario_id) FROM comunidade_visitas WHERE dia>=current_date-30) AS conversoes_30d,
        (SELECT count(DISTINCT usuario_id) FROM comunidade_acessos WHERE dia>=current_date-30) AS participantes_30d,
        (SELECT count(*) FROM usuarios u WHERE EXISTS(SELECT 1 FROM coletas c WHERE c.morador_id=u.id)) AS contas_com_coleta,
        (SELECT count(*) FROM usuarios) AS contas,
        (SELECT count(*) FROM usuarios WHERE criado_em>=now()-interval '30 days') AS cadastros_30d,
        (SELECT count(*) FROM (SELECT usuario_id,min(dia) AS primeiro FROM comunidade_acessos GROUP BY usuario_id) p
           WHERE EXISTS(SELECT 1 FROM comunidade_acessos a WHERE a.usuario_id=p.usuario_id AND a.dia BETWEEN p.primeiro+1 AND p.primeiro+7)) AS retornaram_7d,
        (SELECT avg(extract(epoch from (moderado_em-criado_em)))/3600 FROM comunidade_publicacoes WHERE moderado_em IS NOT NULL) AS horas_media_analise
    """)[0]
