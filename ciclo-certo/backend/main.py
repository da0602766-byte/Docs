# O FastAPI cria a aplicacao que reunira as rotas do sistema.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import configuracao as configuracao
from rotas import coletas as rotas_coletas
from rotas import pesagens as rotas_pesagens
from rotas import usuarios as rotas_usuarios
from rotas import autenticacao as rotas_autenticacao


# Cria a aplicacao sem concentrar aqui nenhuma rota de recurso.
app = FastAPI(title="Ciclo Certo")

# Libera somente o front configurado para que ele possa chamar esta API no navegador.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[configuracao.origem_frontend],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conecta os routers, que mantem cada recurso separado da inicializacao da aplicacao.
app.include_router(rotas_usuarios.router)
app.include_router(rotas_autenticacao.router)
app.include_router(rotas_coletas.router)
app.include_router(rotas_pesagens.router)
