"""Trocas atômicas, moderação consentida e exclusão restrita a administradores."""
from repositorios import mercado as repo
from repositorios import operacao
from servicos.operacao import exigir_perfil, Recusa, agora, obter_coleta
from datetime import timezone

def produto_saida(p):
    return {k: getattr(p, k) for k in ('id', 'nome', 'descricao', 'categoria', 'pontos', 'estoque', 'foto', 'ativo')}

def pedido_saida(p):
    return {**{k: getattr(p, k) for k in ('id', 'produto_id', 'nome', 'pontos')},
            'criado_em': p.criado_em.astimezone(timezone.utc)}

def loja(s, usuario):
    exigir_perfil(usuario, 'morador')
    return {'produtos': [produto_saida(p) for p in repo.produtos(s) if p.ativo],
            'pedidos': [pedido_saida(p) for p in repo.pedidos(s, usuario.id)],
            'pontos': sum(m.pontos for m in operacao.movimentos(s, usuario.id))}

def resgatar(s, dados, usuario):
    exigir_perfil(usuario, 'morador')
    # Sempre bloqueia carteira antes de estoque; duas abas não gastam o mesmo saldo.
    operacao.usuario(s, usuario.id)
    anterior = next((p for p in repo.pedidos(s, usuario.id) if p.chave == dados.chave), None)
    if anterior:
        if anterior.produto_id != dados.produto_id:
            raise Recusa('Esta chave já identifica outra troca.')
        return pedido_saida(anterior)
    produto = repo.produto(s, dados.produto_id)
    if not produto:
        raise Recusa('Produto não encontrado.', 404)
    if not produto.ativo:
        raise Recusa("Este produto foi retirado da loja.")
    if produto.estoque < 1:
        raise Recusa('Este produto esgotou.')
    if sum(m.pontos for m in operacao.movimentos(s, usuario.id)) < produto.pontos:
        raise Recusa('Saldo de pontos insuficiente.')
    pedido = repo.salvar_pedido(s, usuario_id=usuario.id, produto_id=produto.id, nome=produto.nome,
                               pontos=produto.pontos, chave=dados.chave, criado_em=agora())
    produto.estoque -= 1
    operacao.movimento(s, dict(usuario_id=usuario.id, chave='pedido-' + str(pedido.id), tipo='produto', pontos=-produto.pontos, centavos=0, criado_em=agora()))
    operacao.confirmar(s)
    return pedido_saida(pedido)

def usuarios(s, usuario):
    exigir_perfil(usuario, 'cooperativa')
    return [dict(id=u.id, nome=u.nome, email=u.email, tipo=u.tipo, administrador=u.administrador) for u in repo.usuarios(s)]

def avaliacoes(s, usuario=None):
    if usuario:
        exigir_perfil(usuario, 'cooperativa')
    return [dict(id=c.id, nota=c.nota, comentario=c.comentario,
                 autor='Morador da comunidade', publicada=c.depoimento_publicado,
                 autorizada=c.autoriza_depoimento) for c in repo.avaliacoes(s, publicas=usuario is None)]

def moderar(s, id, dados, usuario):
    exigir_perfil(usuario, 'cooperativa')
    c = obter_coleta(s, id, usuario)
    if dados.publicar and (not c.autoriza_depoimento or not c.avaliada_em or not c.comentario):
        raise Recusa('A publicação exige comentário e autorização do morador.')
    c.depoimento_publicado = dados.publicar
    operacao.confirmar(s)
    return {'publicada': c.depoimento_publicado}

def excluir(s, id, dados, usuario):
    exigir_perfil(usuario, 'cooperativa')
    if not usuario.administrador:
        raise Recusa('Somente administradores podem apagar o histórico.', 403)
    c = obter_coleta(s, id, usuario)
    if c.situacao not in ('coletada', 'cancelada'):
        raise Recusa('Finalize a coleta e sua avaliação antes de apagar.')
    if dados.confirmacao != f'APAGAR {id}':
        raise Recusa('Digite a confirmação exibida na tela.', 422)
    repo.expurgar(s, c)
    operacao.confirmar(s)
    return {'apagada': True}


def catalogo_gestao(s, usuario):
    exigir_perfil(usuario, 'cooperativa')
    return [produto_saida(p) for p in repo.produtos(s)]

def salvar_produto(s, dados, usuario, id=None):
    exigir_perfil(usuario, 'cooperativa')
    p = repo.produto(s, id) if id else repo.criar_produto(s)
    if not p:
        raise Recusa('Produto não encontrado.',404)
    for campo, valor in dados.model_dump().items():
        setattr(p,campo,valor)
    s.flush()
    operacao.confirmar(s)
    return produto_saida(p)
