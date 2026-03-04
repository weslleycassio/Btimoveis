# BTImoveis Backend

API backend em **Node.js + Express + TypeScript** com autenticação JWT, CRUD de imóveis e gestão de imagens com MinIO (S3 compatível).

## Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (autenticação)
- Zod (validação)
- MinIO (storage de imagens)

## Estrutura

```txt
src/
  config/
  db/
  middlewares/
  modules/
    auth/
    imoveis/
  shared/
    storage/
  utils/
  app.ts
  server.ts
prisma/
  schema.prisma
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL
- Docker (para MinIO local)

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Suba o MinIO local:

```bash
docker compose up -d minio
```

- API MinIO: `http://localhost:9000`
- Console MinIO: `http://localhost:9001`
- Usuário/Senha: `minio` / `minio123`

> O backend cria o bucket (`MINIO_BUCKET`) automaticamente no bootstrap quando ele não existir.

4. Gere o client do Prisma:

```bash
npm run prisma:generate
```

5. Execute as migrações:

```bash
npm run prisma:migrate
```

## Variáveis de ambiente

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`
- `STORAGE_PROVIDER` (`minio`)
- `MINIO_ENDPOINT`
- `MINIO_PORT`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`
- `MINIO_USE_SSL`
- `PUBLIC_BASE_URL`

## Executar projeto

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Produção

```bash
npm run start
```

## Endpoints

### Auth

- `POST /auth/register`
- `POST /auth/login`

### Imóveis (protegidos por JWT)

- `POST /imoveis`
- `GET /imoveis` (com filtros e paginação, incluindo `imagens`)
- `GET /imoveis/:id` (inclui `imagens`)
- `PUT /imoveis/:id`
- `DELETE /imoveis/:id`
- `POST /imoveis/:id/imagens` (multipart/form-data, campo `imagens`)
- `DELETE /imoveis/:id/imagens/:imagemId`

Use header:

```txt
Authorization: Bearer <token>
```

## Exemplo Postman - Upload de imagens

### Request

- Método: `POST`
- URL: `{{baseUrl}}/imoveis/{{imovelId}}/imagens`
- Body: `form-data`
  - Chave: `imagens` (type `File`)
  - Pode repetir múltiplos arquivos

### Response 201

```json
[
  {
    "id": "cm123...",
    "url": "http://localhost:3000/btimoveis/imoveis/cmabc/1700000000000-fachada.jpg",
    "ordem": 0,
    "isCapa": true
  }
]
```

## Exemplo Postman - Remoção de imagem

### Request

- Método: `DELETE`
- URL: `{{baseUrl}}/imoveis/{{imovelId}}/imagens/{{imagemId}}`

### Response 204

Sem conteúdo.

## Regras de imagens

- Tipos permitidos: `image/jpeg`, `image/png`, `image/webp`
- Tamanho máximo por imagem: `5MB`
- Limite de imagens por imóvel: `10`
- Arquivos são salvos no MinIO, não no PostgreSQL
- Banco armazena apenas metadados (`url`, `storageKey`, `mimeType`, `size`, etc.)

## Modelo de dados (novo)

### ImovelImagem

- `id` (cuid)
- `imovelId` (FK para `Imovel`)
- `url`
- `storageProvider` (default `minio`)
- `storageKey` (ex: `imoveis/<imovelId>/<arquivo>`)
- `mimeType`
- `size`
- `ordem` (default `0`)
- `isCapa` (default `false`)
- `uploadedByUserId` (FK para `User`)
- `createdAt`
