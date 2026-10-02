# Ciclo Certo

Cartilha 2 · cooperativa de recicláveis.

## Como rodar o back

No terminal, na raiz do projeto, crie o ambiente virtual, instale as dependencias e inicie a API:

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install "fastapi[standard]" python-dotenv
cd backend
fastapi dev main.py
```

Abra `http://127.0.0.1:8000/docs`. A tela deve mostrar as rotas de usuarios, coletas e pesagens.

## Como rodar o front

Em outro terminal, entre em `frontend`, instale as dependencias e inicie o Vite:

```powershell
cd frontend
npm install
npm run dev
```

Abra o endereco informado pelo Vite, normalmente `http://localhost:5173`. Deixe o back em execucao antes de usar os formularios.

## Como testar o fluxo principal

1. Escolha Joana e agende uma coleta.
2. Escolha Osmar, abra **A rota**, selecione a coleta e registre uma pesagem.
3. Escolha Joana outra vez e abra **Minhas coletas** para conferir a situacao, os pontos e a pesagem.
