"""Autorização e recompensas da comunidade, isoladas das recompensas de coleta."""
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from hashlib import sha256
from difflib import SequenceMatcher
import re
import unicodedata
from sqlalchemy.exc import IntegrityError
from modelos.comunidade import Publicacao, Comentario, Credito, Denuncia
from repositorios import comunidade as repo
from servicos.operacao import Recusa

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


def resumo(sessao, usuario):
    regras = repo.regras(sessao)
    dia, semana = periodos(agora())
    diaria, semanal, saldo = repo.cotas(sessao, usuario.id, dia, semana)
    return dict(categorias=CATEGORIAS, moderador=repo.moderador(sessao, usuario.id), pontos=regras.pontos,
                limite_dia=regras.limite_dia, limite_semana=regras.limite_semana, usadas_dia=diaria,
                usadas_semana=semanal, saldo=saldo, dia=dia, semana=semana)


def criar(sessao, usuario, dados):
    repo.bloquear_autor(sessao, usuario.id)
    instante = agora()
    normalizado, resumo_texto = identidade(dados.conteudo)
    if len(normalizado) < 10:
        raise Recusa('Escreva pelo menos 10 letras ou números na publicação.', 422)
    if repo.repetida(sessao, resumo_texto) or any(SequenceMatcher(None, normalizado, anterior, autojunk=False).ratio() >= .90 for anterior in repo.recentes(sessao, usuario.id)):
        raise Recusa('Este conteúdo já foi enviado ou é muito parecido com uma publicação anterior.')
    limitar(sessao, Publicacao, usuario.id, instante, 60, 20)
    try:
        registro = repo.gravar(sessao, Publicacao(autor_id=usuario.id, categoria=dados.categoria,
            conteudo=dados.conteudo, normalizado=normalizado, resumo=resumo_texto, criado_em=instante))
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
    moderador = repo.moderador(sessao, usuario.id)
    linhas, contagens = repo.publicacoes(sessao, usuario.id, modo, categoria, perfil, antes, limite)

    def apresentar(linha):
        p, nome, tipo, pontos, estornado = linha
        return dict(id=p.id, conteudo=p.conteudo, categoria=p.categoria, estado=p.estado, criado_em=p.criado_em,
                    autor=dict(nome=nome, perfil=tipo), minha=p.autor_id == usuario.id,
                    pode_excluir=moderador or p.autor_id == usuario.id, comentarios=contagens.get(p.id, 0),
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
    instante = agora()
    registro.estado = 'aprovada' if dados.aprovar else 'rejeitada'
    registro.moderado_em, registro.moderador_id = instante, usuario.id
    registro.motivo = dados.motivo or None
    if dados.aprovar:
        dia, semana = periodos(instante)
        regras = repo.regras(sessao)
        diaria, semanal, _ = repo.cotas(sessao, registro.autor_id, dia, semana)
        if diaria < regras.limite_dia and semanal < regras.limite_semana:
            repo.gravar(sessao, Credito(publicacao_id=registro.id, usuario_id=registro.autor_id,
                pontos=regras.pontos, dia=dia, semana=semana, criado_em=instante))
    sessao.commit()
    return dict(estado=registro.estado)


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
    exigir_visivel(sessao, identificador)
    moderador = repo.moderador(sessao, usuario.id)
    return pagina(repo.comentarios(sessao, identificador, antes, limite), limite,
        lambda r: dict(id=r[0].id, conteudo=r[0].conteudo, criado_em=r[0].criado_em,
                       autor=dict(nome=r[1], perfil=r[2]), pode_excluir=moderador or r[0].autor_id == usuario.id))


def comentar(sessao, usuario, identificador, dados):
    repo.bloquear_autor(sessao, usuario.id)
    exigir_visivel(sessao, identificador, True)
    instante = agora()
    _, resumo_texto = identidade(dados.conteudo)
    if repo.comentario_repetido(sessao, usuario.id, identificador, resumo_texto):
        raise Recusa('Você já enviou este comentário.')
    limitar(sessao, Comentario, usuario.id, instante, 10, 100)
    registro = repo.gravar(sessao, Comentario(publicacao_id=identificador, autor_id=usuario.id,
        conteudo=dados.conteudo, resumo=resumo_texto, criado_em=instante))
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
    repo.bloquear_autor(sessao, usuario.id)
    exigir_visivel(sessao, identificador)
    if dados.comentario_id:
        comentario = repo.obter(sessao, Comentario, dados.comentario_id)
        if comentario is None or comentario.publicacao_id != identificador or comentario.excluido_em:
            raise Recusa('Comentário indisponível.', 404)
    if repo.denuncia_existente(sessao, usuario.id, identificador, dados.comentario_id):
        return dict(recebida=True)
    instante = agora()
    limitar(sessao, Denuncia, usuario.id, instante, 10, 30)
    repo.gravar(sessao, Denuncia(publicacao_id=identificador, comentario_id=dados.comentario_id,
        autor_id=usuario.id, motivo=dados.motivo, criado_em=instante))
    sessao.commit()
    return dict(recebida=True)


def listar_denuncias(sessao, usuario, antes, limite):
    exigir_moderador(sessao, usuario)
    return pagina(repo.denuncias(sessao, antes, limite), limite, lambda r: dict(
        id=r[0].id, publicacao_id=r[0].publicacao_id, comentario_id=r[0].comentario_id,
        motivo=r[0].motivo, criado_em=r[0].criado_em, conteudo=r[3] if r[0].comentario_id else r[1],
        excluido=bool(r[4]) if r[0].comentario_id else r[2] == 'excluida'))


def resolver_denuncia(sessao, usuario, identificador):
    exigir_moderador(sessao, usuario)
    registro = repo.obter(sessao, Denuncia, identificador, True)
    if registro is None:
        raise Recusa('Denúncia não encontrada.', 404)
    if registro.resolvido_em is None:
        registro.resolvido_em, registro.resolvido_por = agora(), usuario.id
        sessao.commit()
    return dict(resolvida=True)
