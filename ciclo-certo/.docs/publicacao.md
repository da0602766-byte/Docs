# Publicação no GitHub Pages

Endereço do frontend: https://da0602766-byte.github.io/Docs/

## Publicação automática

- Em Settings → Pages, Source deve ser **GitHub Actions**.
- `.github/workflows/publicar-pages.yml` compila `ciclo-certo/frontend` com Node 24 e `npm ci` e publica somente o conteúdo de `dist`.
- O workflow roda nos pushes em `main` que alteram o frontend ou o próprio workflow. Também permite execução manual em Actions.
- `npm run build:pages` usa a base `/Docs/`. O build local habitual continua com base `/`.
- Imagens usam `import.meta.env.BASE_URL`; fontes usam caminhos relativos ao CSS. Não é necessário copiar arquivos compilados para uma pasta `/docs` nem versionar `dist`.

## Limite atual

GitHub Pages serve o frontend estático, não executa FastAPI ou MySQL. Sem `VITE_API_URL`, o site remoto apresenta a página pública e informa que o acesso às contas ainda está indisponível. Os formulários ficam desabilitados; não há login fictício nem acesso ao localhost do visitante.

Em localhost/127.0.0.1, o aplicativo continua usando a API local em `http://127.0.0.1:8000`, preservando o fluxo de desenvolvimento.

Para habilitar o sistema online completo:

1. Hospedar FastAPI e MySQL em ambiente apropriado, com HTTPS, credenciais próprias e migrations.
2. Definir CORS para a origem exata `https://da0602766-byte.github.io` (sem `/Docs/`, pois origem não inclui caminho).
3. Revisar a concessão do perfil cooperativa antes de abrir cadastro público, conforme as regras do projeto.
4. Em Settings → Secrets and variables → Actions → Variables, criar `VITE_API_URL` com a URL pública HTTPS da API, sem barra final. Essa variável é pública no JavaScript; nunca colocar senha, JWT ou chave OpenAI nela.
5. Executar novamente o workflow e validar login, autorização por dono, agendamento e pesagem contra a API hospedada.

Nenhum provedor foi contratado, banco transferido ou segredo publicado nesta etapa.

## Verificações locais executadas

```powershell
# Na pasta frontend, com o preview local disponível em 127.0.0.1:5175:
npm run build
npm run test:visual
npm run build:pages -- --outDir dist-pages
npm run test:pages
```

- Fluxos locais com API simulada aprovados nas larguras 1440, 390 e 320 px.
- Build de Pages exercitado num domínio simulado, sob `/Docs/`: página inicial, fotos, fontes, entrada/retorno e aviso de indisponibilidade.
- Teste recusa qualquer recurso fora da base esperada e confirma ausência de chamadas ao localhost quando o site está num domínio público sem API configurada.
- `dist-pages` e capturas ficam fora do Git. O teste não escreve no banco real.
