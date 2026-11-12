"""Autorização e recompensas da comunidade, isoladas das recompensas de coleta."""
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from hashlib import sha256
from difflib import SequenceMatcher
import re
import unicodedata
from sqlalchemy.exc import IntegrityError
from modelos.comunidade import Publicacao, Comentario, Credito, Denuncia, NotificacaoComunidade
from validacao_youtube import identificar_video
from repositorios import comunidade as repo
from servicos.operacao import Recusa
from Ia.denuncias import analisar, GRAVES, PUNIVEIS
from Ia.moderacao import classificar

CATEGORIAS = ['Plantio', 'Reciclagem', 'Curiosidades', 'Compostagem', 'Reutilização', 'Sugestões']
BRASILIA = ZoneInfo('America/Sao_Paulo')


def agora():
    """Relógio substituível nos testes de virada de dia e semana."""
    return datetime.now(timezone.utc)


def periodos(instante):
    dia = instante.astimezone(BRASILIA).date()
    return dia, dia - timedelta(days=dia.weekday())


def normalizar(conteudo):
    """Ignora caixa, acentos, espaços, pontuação e caracteres invisíveis nas repetições."""
    texto = unicodedata.normalize('NFKD', conteudo.casefold())
    texto = ''.join(c for c in texto if not unicodedata.category(c).startswith(('M', 'C')))
    return re.sub(r'\W+', '', texto)


def identidade(conteudo):
    normalizado = normalizar(conteudo)
    if len(normalizado) < 2:
        raise Recusa('Escreva um conteúdo com palavras, além de símbolos.', 422)
    return normalizado, sha256(normalizado.encode()).hexdigest()


def exigir_moderador(sessao, usuario):
    if not repo.moderador(sessao, usuario.id):
        raise Recusa('Somente moderadores podem realizar esta operação.', 403)


def limitar(sessao, modelo, usuario_id, instante, intervalo, teto):
    """Contabiliza também exclusões para que apagar não contorne os limites antispam."""
    inicio = datetime.combine(instante.astimezone(BRASILIA).date(), datetime.min.time(), BRASILIA)
    quantidade, ultimo = repo.atividade(sessao, modelo, usuario_id, inicio)
    if quantidade >= teto or (ultimo and (instante - ultimo).total_seconds() < intervalo):
        raise Recusa('Aguarde antes de enviar novamente. Limite de participação atingido.', 429)


def texto_sancao(sancao):
    fim = sancao.sancao_ate.astimezone(BRASILIA).strftime("%d/%m às %H:%M")
    if sancao.analise in GRAVES:
        return f"Sua participação na Comunidade está suspensa até {fim} (horário de Brasília)."
    return f"Você poderá voltar a publicar e comentar na Comunidade em {fim} (horário de Brasília)."


def exigir_participacao(sessao, usuario, so_grave=False):
    sancao = repo.sancao_ativa(sessao, usuario.id, agora(), so_grave)
    if sancao:
        raise Recusa(texto_sancao(sancao), 403)


def resumo(sessao, usuario):
    regras = repo.regras(sessao)
    dia, semana = periodos(agora())
    diaria, semanal, saldo = repo.cotas(sessao, usuario.id, dia, semana)
    sancao = repo.sancao_ativa(sessao, usuario.id, agora())
    return dict(restricao=texto_sancao(sancao) if sancao else None,
                restricao_ate=sancao.sancao_ate if sancao else None, categorias=CATEGORIAS, moderador=repo.moderador(sessao, usuario.id), pontos=regras.pontos,
                limite_dia=regras.limite_dia, limite_semana=regras.limite_semana, usadas_dia=diaria,
                usadas_semana=semanal, saldo=saldo, dia=dia, semana=semana)


def criar(sessao, usuario, dados):
    repo.bloquear_autor(sessao, usuario.id)
    exigir_participacao(sessao, usuario)
    instante = agora()
    youtube_id = identificar_video(dados.youtube_url)
    if youtube_id and repo.video_repetido(sessao, usuario.id, youtube_id):
        raise Recusa('Você já compartilhou este vídeo. Escolha outro conteúdo para a comunidade.')
    normalizado, resumo_texto = identidade(dados.conteudo)
    if len(normalizado) < 10:
        raise Recusa('Escreva pelo menos 10 letras ou números na publicação.', 422)
    if repo.repetida(sessao, resumo_texto) or any(SequenceMatcher(None, normalizado, anterior, autojunk=False).ratio() >= .90 for anterior in repo.recentes(sessao, usuario.id)):
        raise Recusa('Este conteúdo já foi enviado ou é muito parecido com uma publicação anterior.')
    limitar(sessao, Publicacao, usuario.id, instante, 60, 20)
    try:
        registro = repo.gravar(sessao, Publicacao(autor_id=usuario.id, categoria=dados.categoria,
            conteudo=dados.conteudo, youtube_id=youtube_id, publica=dados.publica, normalizado=normalizado, resumo=resumo_texto, criado_em=instante))
        moderar_com_cici(sessao, registro)
        sessao.commit()
    except IntegrityError:
        sessao.rollback()
        raise Recusa('Este conteúdo já foi enviado.')
    return dict(id=registro.id, estado=registro.estado)


def pagina(linhas, limite, transformar):
    itens = [transformar(linha) for linha in linhas[:limite]]
    return dict(itens=itens, proximo=itens[-1]['id'] if len(linhas) > limite else None)


def listar(sessao, usuario, modo, categoria, perfil, antes, limite):
    if modo == 'moderacao':
        exigir_moderador(sessao, usuario)
    else:
        exigir_participacao(sessao, usuario, so_grave=True)
    moderador = repo.moderador(sessao, usuario.id)
    from repositorios.participacao import ids_favoritos
    linhas, contagens = repo.publicacoes(sessao, usuario.id, modo, categoria, perfil, antes, limite)
    favoritos = ids_favoritos(sessao, usuario.id, [r[0].id for r in linhas])

    def apresentar(linha):
        p, nome, tipo, pontos, estornado = linha
        return dict(id=p.id, conteudo=p.conteudo, youtube_id=p.youtube_id, publica=p.publica, revisao=p.revisao, categoria=p.categoria, estado=p.estado, criado_em=p.criado_em,
                    autor=dict(nome=nome, perfil=tipo), minha=p.autor_id == usuario.id,
                    salva=p.id in favoritos, pode_excluir=moderador or p.autor_id == usuario.id, comentarios=contagens.get(p.id, 0),
                    pontos=0 if estornado else (pontos or 0), motivo=p.motivo if modo != 'feed' else None)
    return pagina(linhas, limite, apresentar)


def obter_publicacao(sessao, identificador, bloquear=False):
    registro = repo.obter(sessao, Publicacao, identificador, bloquear)
    if registro is None:
        raise Recusa('Publicação não encontrada.', 404)
    return registro


def moderar(sessao, usuario, identificador, dados):
    exigir_moderador(sessao, usuario)
    registro = obter_publicacao(sessao, identificador)
    repo.bloquear_autor(sessao, registro.autor_id)
    registro = obter_publicacao(sessao, identificador, True)
    if registro.estado != 'pendente':
        if registro.estado == ('aprovada' if dados.aprovar else 'rejeitada'):
            return dict(estado=registro.estado)
        raise Recusa('Esta publicação já foi analisada ou excluída.')
    if not dados.aprovar and len(dados.motivo.strip()) < 10:
        raise Recusa('Informe o motivo da rejeição com pelo menos 10 caracteres.', 422)
    motivo = motivo_da_analise(registro.conteudo, categoria=registro.categoria) if dados.aprovar else dados.motivo
    registrar_decisao(sessao, registro, dados.aprovar and motivo is None, motivo or dados.motivo, usuario.id)
    sessao.commit()
    return dict(estado=registro.estado)


def moderar_com_cici(sessao, registro):
    motivo = motivo_da_analise(registro.conteudo, categoria=registro.categoria)
    if motivo is None and registro.youtube_id:
        registro.motivo = 'Texto verificado. O vídeo aguarda revisão da moderação.'
        return
    registrar_decisao(sessao, registro, motivo is None, motivo or 'Verificada pela Cici.')


def motivo_da_analise(conteudo, **contexto):
    resultado = classificar(conteudo, **contexto)
    if resultado == 'indisponivel':
        raise Recusa('A Cici não conseguiu analisar agora. Tente enviar novamente em instantes.', 503)
    return {
        'pertinente': None,
        'fora_do_tema': 'Mantenha todo o texto relacionado aos temas da Comunidade, sem ofensas, política partidária ou propaganda.',
        'incerto': 'Explique melhor como o texto se relaciona com a Comunidade do Ciclo Certo.',
        'restrito': 'Retire links do texto e remova informações pessoais antes de reenviar.',
    }[resultado]


def registrar_decisao(sessao, registro, aprovar, motivo, moderador_id=None):
    instante = agora()
    registro.estado = 'aprovada' if aprovar else 'rejeitada'
    registro.moderado_em, registro.moderador_id = instante, moderador_id
    registro.motivo = motivo or None
    pontos = 0
    if aprovar:
        dia, semana = periodos(instante)
        regras = repo.regras(sessao)
        diaria, semanal, _ = repo.cotas(sessao, registro.autor_id, dia, semana)
        if diaria < regras.limite_dia and semanal < regras.limite_semana:
            pontos = regras.pontos
            repo.gravar(sessao, Credito(publicacao_id=registro.id, usuario_id=registro.autor_id,
                pontos=regras.pontos, dia=dia, semana=semana, criado_em=instante))
    # Aviso e crédito confirmam juntos: retries da decisão não duplicam nenhum dos dois.
    mensagem = (f'Sua publicação em {registro.categoria} foi aprovada. '
                + (f'Você recebeu {pontos} pontos na comunidade.' if pontos else 'Ela aparece no feed, sem pontos porque sua cota foi atingida.')) if aprovar else f'Sua publicação em {registro.categoria} não foi aprovada. Motivo: {motivo.strip()}'
    repo.gravar(sessao, NotificacaoComunidade(usuario_id=registro.autor_id, publicacao_id=registro.id,
        estado=registro.estado, chave=f"moderacao:{registro.id}:{registro.revisao}", mensagem=mensagem, criado_em=instante))


def listar_notificacoes(sessao, usuario):
    return dict(itens=[dict(id=n.id, publicacao_id=n.publicacao_id, estado=n.estado, mensagem=n.mensagem,
                           criado_em=n.criado_em) for n in repo.notificacoes(sessao, usuario.id)])


def ler_notificacao(sessao, usuario, identificador):
    aviso = repo.obter(sessao, NotificacaoComunidade, identificador, True)
    if aviso is None or aviso.usuario_id != usuario.id:
        raise Recusa('Notificação não encontrada.', 404)
    aviso.lida = True
    sessao.commit()
    return dict(lida=True)


def excluir(sessao, usuario, identificador):
    registro = obter_publicacao(sessao, identificador)
    if registro.autor_id != usuario.id:
        exigir_moderador(sessao, usuario)
    repo.bloquear_autor(sessao, registro.autor_id)
    registro = obter_publicacao(sessao, identificador, True)
    if registro.estado != 'excluida':
        instante = agora()
        registro.estado, registro.conteudo = 'excluida', ''
        registro.excluido_em, registro.excluido_por = instante, usuario.id
        credito = repo.credito(sessao, registro.id)
        if credito and credito.estornado_em is None:
            credito.estornado_em = instante
        sessao.commit()
    return dict(excluida=True)


def exigir_visivel(sessao, identificador, bloquear=False):
    registro = obter_publicacao(sessao, identificador, bloquear)
    if registro.estado != 'aprovada':
        raise Recusa('Publicação indisponível.', 404)
    return registro


def listar_comentarios(sessao, usuario, identificador, antes, limite):
    exigir_participacao(sessao, usuario, so_grave=True)
    exigir_visivel(sessao, identificador)
    moderador = repo.moderador(sessao, usuario.id)
    return pagina(repo.comentarios(sessao, identificador, antes, limite), limite,
        lambda r: dict(id=r[0].id, resposta_id=r[0].resposta_id, conteudo=r[0].conteudo, criado_em=r[0].criado_em,
                       autor=dict(nome=r[1], perfil=r[2]), pode_excluir=moderador or r[0].autor_id == usuario.id))


def comentar(sessao, usuario, identificador, dados):
    repo.bloquear_autor(sessao, usuario.id)
    exigir_participacao(sessao, usuario)
    publicacao = exigir_visivel(sessao, identificador, True)
    resposta = None
    if dados.resposta_id:
        resposta = repo.obter(sessao, Comentario, dados.resposta_id)
        if resposta is None or resposta.publicacao_id != identificador or resposta.excluido_em:
            raise Recusa('Comentário respondido indisponível.', 404)
    instante = agora()
    _, resumo_texto = identidade(dados.conteudo)
    if repo.comentario_repetido(sessao, usuario.id, identificador, resumo_texto):
        raise Recusa('Você já enviou este comentário.')
    limitar(sessao, Comentario, usuario.id, instante, 10, 100)
    contexto = (publicacao.conteudo, resposta.conteudo) if resposta else (publicacao.conteudo,)
    motivo = motivo_da_analise(dados.conteudo, categoria=publicacao.categoria, contexto=contexto)
    if motivo:
        raise Recusa(motivo, 422)
    registro = repo.gravar(sessao, Comentario(publicacao_id=identificador, autor_id=usuario.id,
        conteudo=dados.conteudo, resposta_id=dados.resposta_id, resumo=resumo_texto, criado_em=instante))
    if resposta and resposta.autor_id != usuario.id:
        repo.gravar(sessao, NotificacaoComunidade(usuario_id=resposta.autor_id, publicacao_id=identificador,
            estado='resposta', chave=f'resposta:{registro.id}', mensagem=f'{usuario.nome} respondeu ao seu comentário: {dados.conteudo[:450]}', criado_em=instante))
    sessao.commit()
    return dict(id=registro.id)


def excluir_comentario(sessao, usuario, identificador):
    registro = repo.obter(sessao, Comentario, identificador, True)
    if registro is None:
        raise Recusa('Comentário não encontrado.', 404)
    if registro.autor_id != usuario.id:
        exigir_moderador(sessao, usuario)
    if registro.excluido_em is None:
        registro.conteudo = ''
        registro.excluido_em, registro.excluido_por = agora(), usuario.id
        sessao.commit()
    return dict(excluido=True)


def denunciar(sessao, usuario, identificador, dados):
    # Persiste a denúncia antes de chamar o provedor, sem segurar locks durante a chamada.
    repo.bloquear_autor(sessao, usuario.id)
    publicacao = exigir_visivel(sessao, identificador)
    alvo = publicacao
    if dados.comentario_id:
        alvo = repo.obter(sessao, Comentario, dados.comentario_id)
        if alvo is None or alvo.publicacao_id != identificador or alvo.excluido_em:
            raise Recusa('Comentário indisponível.', 404)
    if alvo.autor_id == usuario.id:
        raise Recusa('Você pode excluir seu próprio conteúdo sem denunciá-lo.', 422)
    if repo.denuncia_existente(sessao, usuario.id, identificador, dados.comentario_id):
        return dict(recebida=True)
    instante = agora()
    limitar(sessao, Denuncia, usuario.id, instante, 10, 30)
    registro = repo.gravar(sessao, Denuncia(publicacao_id=identificador, comentario_id=dados.comentario_id,
        autor_id=usuario.id, motivo=dados.motivo, criado_em=instante, revisao_denunciada=publicacao.revisao))
    denuncia_id, autor_id, conteudo = registro.id, alvo.autor_id, alvo.conteudo
    revisao, video = publicacao.revisao, not dados.comentario_id and bool(publicacao.youtube_id)
    sessao.commit()

    resultado, evidencia = analisar(conteudo, video)
    # A trava por conta impede estender a punição com denúncias repetidas.
    autor = repo.bloquear_autor(sessao, autor_id)
    publicacao = repo.obter(sessao, Publicacao, identificador, True)
    alvo = repo.obter(sessao, Comentario, dados.comentario_id, True) if dados.comentario_id else publicacao
    registro = repo.obter(sessao, Denuncia, denuncia_id, True)
    if registro is None or registro.resolvido_em is not None:
        return dict(recebida=True)
    if (autor is None or publicacao is None or publicacao.estado != 'aprovada'
        or publicacao.revisao != revisao or alvo is None or alvo.excluido_em
        or alvo.autor_id != autor_id or alvo.conteudo != conteudo):
        registro.analise = "alterado"
    elif resultado in PUNIVEIS and (not evidencia or evidencia not in conteudo):
        registro.analise = "incerta"
    elif resultado in PUNIVEIS and repo.sancao_ja_aplicada(sessao, identificador, dados.comentario_id, revisao):
        registro.analise = "ja_aplicada"
    else:
        registro.analise = resultado
        registro.evidencia = evidencia
        if resultado in PUNIVEIS:
            instante = agora()
            registro.restringido_id = autor_id
            registro.sancao_ate = instante + (timedelta(hours=4) if resultado in GRAVES else timedelta(minutes=15))
            motivo = {"ofensa": "ataque pessoal", "ameaca": "ameaça", "odio": "discurso de ódio", "assedio_grave": "assédio grave"}[resultado]
            repo.gravar(sessao, NotificacaoComunidade(usuario_id=autor_id, publicacao_id=identificador,
                estado='sancao', chave=f'sancao:{registro.id}', criado_em=instante,
                mensagem=f"{texto_sancao(registro)} Motivo: {motivo}. A moderação pode rever a decisão."))
    sessao.commit()
    return dict(recebida=True)


def listar_denuncias(sessao, usuario, antes, limite):
    exigir_moderador(sessao, usuario)
    return pagina(repo.denuncias(sessao, antes, limite, agora()), limite, lambda r: dict(
        id=r[0].id, publicacao_id=r[0].publicacao_id, comentario_id=r[0].comentario_id,
        motivo=r[0].motivo, criado_em=r[0].criado_em, analise=r[0].analise, evidencia=r[0].evidencia,
        sancao_ate=r[0].sancao_ate, revogada_em=r[0].revogada_em, resolvido_em=r[0].resolvido_em, conteudo=r[3] if r[0].comentario_id else r[1],
        excluido=bool(r[4]) if r[0].comentario_id else r[2] == 'excluida'))


def resolver_denuncia(sessao, usuario, identificador, revogar=False):
    exigir_moderador(sessao, usuario)
    registro = repo.obter(sessao, Denuncia, identificador, True)
    if registro is None:
        raise Recusa('Denúncia não encontrada.', 404)
    if revogar and registro.sancao_ate is not None and registro.revogada_em is None:
        registro.revogada_em, registro.revogada_por = agora(), usuario.id
        repo.gravar(sessao, NotificacaoComunidade(usuario_id=registro.restringido_id, publicacao_id=registro.publicacao_id,
            estado='sancao', chave=f'revogacao:{registro.id}', criado_em=agora(),
            mensagem="A moderação cancelou uma restrição aplicada à sua participação na Comunidade."))
    if registro.resolvido_em is None:
        registro.resolvido_em, registro.resolvido_por = agora(), usuario.id
    sessao.commit()
    return dict(resolvida=True)
