"""Decisões de privacidade, autoria e organização da participação local."""
from repositorios import participacao as repo
from servicos import comunidade as comunidade
from servicos.operacao import Recusa
from validacao_youtube import identificar_video
from sqlalchemy.exc import IntegrityError


def publico(sessao,antes,categoria,identificador=None):
    itens=repo.publico(sessao,antes,categoria,identificador)
    if identificador and not itens: raise Recusa('Publicação pública indisponível.',404)
    return dict(itens=itens[:12],proximo=itens[11]['id'] if len(itens)>12 else None)


def salvar(sessao,usuario,identificador,valor):
    comunidade.repo.bloquear_autor(sessao,usuario.id)
    comunidade.exigir_participacao(sessao,usuario,so_grave=True)
    comunidade.exigir_visivel(sessao,identificador,True)
    repo.favorito(sessao,usuario.id,identificador,valor)
    sessao.commit()
    return dict(salvo=valor)


def reenviar(sessao,usuario,identificador,dados):
    comunidade.repo.bloquear_autor(sessao,usuario.id)
    comunidade.exigir_participacao(sessao,usuario)
    p=comunidade.obter_publicacao(sessao,identificador,True)
    if p.autor_id!=usuario.id: raise Recusa('Somente o autor pode corrigir a publicação.',403)
    if p.estado!='rejeitada': raise Recusa('Somente publicações recusadas podem ser reenviadas.')
    normalizado,resumo=comunidade.identidade(dados.conteudo)
    if len(normalizado)<10: raise Recusa('Escreva pelo menos 10 letras ou números.',422)
    if resumo!=p.resumo and comunidade.repo.repetida(sessao,resumo): raise Recusa('Este conteúdo já foi enviado.')
    if any(comunidade.SequenceMatcher(None,normalizado,anterior,autojunk=False).ratio()>=.90 for anterior in comunidade.repo.recentes(sessao,usuario.id,p.id)):
        raise Recusa('Este conteúdo é muito parecido com outra publicação sua.')
    video=identificar_video(dados.youtube_url)
    if video!=p.youtube_id and video and comunidade.repo.video_repetido(sessao,usuario.id,video): raise Recusa('Você já compartilhou este vídeo.')
    instante=comunidade.agora()
    if p.moderado_em and (instante-p.moderado_em).total_seconds()<60: raise Recusa('Aguarde um minuto após a análise antes de reenviar.',429)
    repo.arquivar(sessao,p,instante)
    p.conteudo,p.normalizado,p.resumo,p.youtube_id,p.categoria,p.publica=dados.conteudo,normalizado,resumo,video,dados.categoria,dados.publica
    p.revisao+=1
    p.estado,p.motivo,p.moderado_em,p.moderador_id='pendente',None,None,None
    try:
        comunidade.moderar_com_cici(sessao,p)
        sessao.commit()
    except IntegrityError:
        sessao.rollback()
        raise Recusa('Este conteúdo já foi enviado.')
    return dict(id=p.id,estado=p.estado)


def historico(sessao,usuario,identificador):
    p=comunidade.obter_publicacao(sessao,identificador)
    if p.autor_id!=usuario.id: comunidade.exigir_moderador(sessao,usuario)
    return dict(itens=repo.historico(sessao,identificador))


def avisos(sessao,usuario,antes):
    itens=repo.avisos(sessao,usuario.id,antes)
    return dict(itens=itens[:20],proximo=itens[19]['id'] if len(itens)>20 else None)


def criar_acao(sessao,usuario,dados):
    comunidade.exigir_moderador(sessao,usuario)
    if dados.inicio.tzinfo is None or dados.fim.tzinfo is None or dados.fim<=dados.inicio or dados.fim<=comunidade.agora(): raise Recusa('Informe datas futuras com início anterior ao fim.',422)
    if dados.tipo=='evento' and not dados.local: raise Recusa('Informe o local da ação.',422)
    if dados.tipo=='destaque':
        if not dados.publicacao_id: raise Recusa('Escolha a publicação do destaque.',422)
        p=comunidade.exigir_visivel(sessao,dados.publicacao_id)
        if not p.publica: raise Recusa('O destaque exige autorização de leitura pública.',422)
    resultado=repo.criar_acao(sessao,usuario.id,dados.model_dump())
    sessao.commit()
    return resultado


def participar(sessao,usuario,identificador,valor):
    if valor:
        comunidade.repo.bloquear_autor(sessao,usuario.id)
        comunidade.exigir_participacao(sessao,usuario,so_grave=True)
    acao=repo.obter_acao(sessao,identificador)
    if not acao or not acao['ativa'] or acao['fim']<=comunidade.agora() or acao['tipo']!='evento': raise Recusa('Ação indisponível.',404)
    repo.inscrever(sessao,usuario.id,identificador,valor)
    sessao.commit()
    return dict(inscrito=valor)


def cancelar(sessao,usuario,identificador):
    comunidade.exigir_moderador(sessao,usuario)
    if not repo.obter_acao(sessao,identificador): raise Recusa('Ação não encontrada.',404)
    repo.cancelar_acao(sessao,identificador);sessao.commit()
    return dict(cancelada=True)


def impacto(sessao,usuario):
    return repo.impacto(sessao,usuario.id,usuario.tipo=='cooperativa')


def acoes(sessao,usuario=None):
    return dict(itens=[{k:v for k,v in a.items() if k!='autor_id'} for a in repo.acoes(sessao,usuario.id if usuario else None)])


def registrar_visita(sessao,identificador):
    repo.visita(sessao,identificador);sessao.commit()
    return dict(registrada=True)


def registrar_acesso(sessao,usuario):
    repo.acesso(sessao,usuario.id);sessao.commit()
    return dict(registrado=True)


def conversao(sessao,usuario,identificador):
    if usuario.criado_em and 0<=(comunidade.agora()-usuario.criado_em).total_seconds()<600:
        repo.conversao(sessao,usuario.id,identificador);sessao.commit()
    return dict(registrada=True)


def metricas(sessao,usuario):
    comunidade.exigir_moderador(sessao,usuario)
    return repo.metricas(sessao)


def detalhe(sessao,usuario,identificador):
    comunidade.exigir_participacao(sessao,usuario,so_grave=True)
    p=comunidade.obter_publicacao(sessao,identificador)
    if p.estado=='excluida': raise Recusa('Esta publicação foi excluída.',404)
    if p.estado!='aprovada' and p.autor_id!=usuario.id: comunidade.exigir_moderador(sessao,usuario)
    return repo.detalhe(sessao,usuario.id,identificador,comunidade.repo.moderador(sessao,usuario.id))
