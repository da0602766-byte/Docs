# Cada classe comunica um motivo de recusa; somente as rotas escolhem o status HTTP.


# O cadastro não pode reutilizar um e-mail que já identifica outra pessoa.
class EmailEmUso(Exception):
    pass


# A pessoa foi identificada, mas seu perfil ou a propriedade não permite a operação.
class AcessoNegado(Exception):
    pass


# A pesagem aceita somente os materiais definidos na cartilha.
class MaterialInvalido(Exception):
    pass


# Informa um limite de representação numérica, sem criar um teto de negócio em quilos.
class ValorNumericoInvalido(Exception):
    pass
