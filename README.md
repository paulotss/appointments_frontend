# Appointments Frontend

Frontend da aplicacao de agendamentos, construido com React, TypeScript e Vite.

## Requisitos

- Node.js 20+
- npm 10+
- Docker e Docker Compose (opcional, para execucao em container)

## Variaveis de ambiente

Crie ou ajuste o arquivo `.env` na raiz do projeto:

```env
VITE_API_URL=http://localhost:3000
FRONTEND_DEV_PORT=5174
FRONTEND_PROD_PORT=8080
```

## Execucao local (sem Docker)

1. Instale as dependencias:

```bash
npm ci
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Acesse no navegador:

- `http://localhost:5173`

## Execucao com Docker (desenvolvimento)

Suba o container de desenvolvimento:

```bash
docker compose --profile dev up --build
```

Acesse no navegador:

- `http://localhost:${FRONTEND_DEV_PORT}` (padrao: `http://localhost:5174`)

Para parar:

```bash
docker compose --profile dev down
```

## Execucao com Docker (producao)

Suba o container de producao:

```bash
docker compose --profile prod up --build -d
```

Acesse no navegador:

- `http://localhost:${FRONTEND_PROD_PORT}` (padrao: `http://localhost:8080`)

Para parar:

```bash
docker compose --profile prod down
```

## Scripts uteis

- `npm run dev`: inicia ambiente de desenvolvimento
- `npm run build`: gera build de producao
- `npm run preview`: serve o build localmente
- `npm run lint`: executa lint do projeto
