# BTImoveis Backend

API backend em **Node.js + Express + TypeScript** com autenticação JWT e CRUD de imóveis.

## Stack

- Node.js
- Express
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT (autenticação)
- bcrypt (hash de senha)
- Zod (validação)

## Estrutura

```txt
src/
  config/
  db/
  middlewares/
  modules/
    auth/
    imoveis/
  utils/
  app.ts
  server.ts
prisma/
  schema.prisma
```

## Pré-requisitos

- Node.js 18+
- PostgreSQL

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

3. Ajuste as variáveis no `.env`:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT`

4. Gere o client do Prisma:

```bash
npm run prisma:generate
```

5. Execute as migrações:

```bash
npm run prisma:migrate -- --name init
```

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

Ambos retornam:

```json
{
  "token": "jwt_token"
}
```

### Imóveis (protegidos por JWT)

- `POST /imoveis`
- `GET /imoveis` (com filtros e paginação)
- `GET /imoveis/:id`
- `PUT /imoveis/:id`
- `DELETE /imoveis/:id`

Use header:

```txt
Authorization: Bearer <token>
```

## Filtros e paginação (`GET /imoveis`)

Query params suportados:

- `tipo`
- `finalidade`
- `bairro`
- `cidade`
- `status` (`ATIVO` ou `INATIVO`)
- `minPreco`
- `maxPreco`
- `page` (default: `1`)
- `limit` (default: `10`, max: `100`)

## Modelo de dados

### User

- `id` (cuid)
- `email` (unique)
- `passwordHash`
- `role` (default `ADMIN`)
- `createdAt`
- `updatedAt`

### Imovel

- `id` (cuid)
- `titulo`
- `tipo`
- `finalidade`
- `bairro`
- `cidade`
- `preco` (`decimal(14,2)`)
- `descricao` (optional)
- `status` (default `ATIVO`)
- `createdAt`
- `updatedAt`
