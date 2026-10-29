# O FastAPI cria a aplicacao que reunira as rotas do sistema.
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import configuracao as configuracao
from rotas import usuarios as rotas_usuarios
from rotas import autenticacao as rotas_autenticacao
from rotas.operacao import router as rotas_operacao
from servicos.operacao import Recusa
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


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
app.include_router(rotas_operacao)


# Infraestrutura traduz erros sem devolver senhas, imagens ou corpos enviados.
@app.exception_handler(Recusa)
def tratar_recusa(requisicao, erro):
    return JSONResponse(status_code=erro.status, content={"detail": str(erro)})


@app.exception_handler(RequestValidationError)
def tratar_validacao(requisicao, erro):
    return JSONResponse(status_code=422, content={"detail": [{"loc": list(e["loc"]), "msg": e["msg"], "type": e["type"]} for e in erro.errors()]})


# Verificação de disponibilidade da aplicação, sem consultar dados ou expor configuração.
@app.get("/saude", tags=["Infraestrutura"])
def consultar_saude():
    return {"status": "ok"}
