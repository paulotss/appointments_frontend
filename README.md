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

## Deploy local em servidor (Zorin OS)

Este guia sobe frontend + backend + banco localmente com Docker, de forma rapida e pratica.

### 1) Instalar Docker no Zorin OS

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg lsb-release

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Validar instalacao:

```bash
docker --version
docker compose version
```

Permitir rodar Docker sem `sudo`:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

### 2) Estrutura de pastas sugerida

```text
deploy/
  docker-compose.yml
  .env
  nginx/
    default.conf
  frontend/
    Dockerfile
    ...
  backend/
    Dockerfile
    ...
```

### 3) Dockerfile do frontend (Vite + Nginx)

Arquivo: `frontend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 4) Dockerfile do backend (Node generico)

Arquivo: `backend/Dockerfile`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

Ajuste o `CMD` conforme o seu backend (`dist/server.js`, `npm run start:prod`, etc).

### 5) Nginx de proxy reverso

Arquivo: `nginx/default.conf`

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api/ {
        proxy_pass http://backend:3000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 6) docker-compose.yml

Arquivo: `docker-compose.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: appointments_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: appointments_backend
    restart: unless-stopped
    env_file:
      - .env
    depends_on:
      - db
    expose:
      - "3000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: appointments_frontend
    restart: unless-stopped
    expose:
      - "80"

  proxy:
    image: nginx:1.27-alpine
    container_name: appointments_proxy
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
    volumes:
      - ./nginx/default.conf:/etc/nginx/conf.d/default.conf:ro
    ports:
      - "80:80"

volumes:
  postgres_data:
```

### 7) Variaveis de ambiente

Arquivo: `.env`

```env
POSTGRES_USER=appointments_user
POSTGRES_PASSWORD=troque_para_uma_senha_forte
POSTGRES_DB=appointments

PORT=3000
DB_HOST=db
DB_PORT=5432
DB_USER=appointments_user
DB_PASSWORD=troque_para_uma_senha_forte
DB_NAME=appointments
JWT_SECRET=troque_para_um_token_grande_e_forte

CORS_ORIGIN=http://IP_OU_DNS_INTERNO
```

### 8) Frontend (Vite) apontando para API

Use no frontend:

- `VITE_API_URL=/api`

E no codigo, acessar via `import.meta.env.VITE_API_URL`.

### 9) Subir os servicos

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

Acesso na rede interna:

- `http://IP_DO_SERVIDOR`

### 10) Firewall (UFW)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

Se necessario:

```bash
sudo ufw enable
```

### 11) Subida automatica no boot

```bash
sudo systemctl enable docker
sudo systemctl start docker
```

Com `restart: unless-stopped`, os containers voltam automaticamente apos reboot.
