# BTImoveis Backend

API backend em **Node.js + Express + TypeScript** com autenticação JWT e CRUD de imóveis, agora com **multi-imobiliárias (multi-tenant simples)** por `imobiliariaId`.

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
    imobiliarias/
    imoveis/
  utils/
  app.ts
  server.ts
prisma/
  schema.prisma
  migrations/
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
npm run prisma:migrate
```

> A migração de multi-tenant já faz backfill de compatibilidade criando uma imobiliária default e vinculando usuários/imóveis existentes quando houver dados legados.

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

### 1) Cadastro de imobiliária

#### `POST /imobiliarias`

Cria uma imobiliária e um usuário ADMIN dono no mesmo fluxo.

Request:

```json
{
  "imobiliaria": {
    "nome": "Imob XPTO",
    "telefone": "11999999999",
    "email": "contato@xpto.com"
  },
  "admin": {
    "nome": "Wes",
    "telefone": "11999999999",
    "email": "wes@exemplo.com",
    "password": "123456"
  },
  "returnToken": true
}
```

Response:

```json
{
  "imobiliaria": { "id": "...", "nome": "Imob XPTO", "telefone": "11999999999" },
  "admin": { "id": "...", "nome": "Wes", "email": "wes@exemplo.com", "role": "ADMIN", "imobiliariaId": "..." },
  "token": "jwt_token_opcional"
}
```

### 2) Auth

#### `POST /auth/login`

Retorna token JWT com `sub`, `email`, `role` e `imobiliariaId`, além dos dados do usuário autenticado.

Response:

```json
{
  "token": "jwt_token",
  "user": {
    "id": "...",
    "nome": "Wes",
    "telefone": "11999999999",
    "email": "wes@exemplo.com",
    "role": "ADMIN",
    "imobiliariaId": "..."
  }
}
```

#### `POST /auth/register`

Protegido por JWT e permitido somente para `ADMIN`.
Cria usuário dentro da mesma `imobiliariaId` do token autenticado.

Request:

```json
{
  "nome": "Corretor 1",
  "telefone": "11999999999",
  "email": "corretor1@exemplo.com",
  "password": "123456",
  "role": "CORRETOR"
}
```

### 3) Usuários (protegido por JWT)

- `GET /usuarios` (permitido para `ADMIN` e `CORRETOR`)

Retorna a listagem de usuários da mesma `imobiliariaId` do usuário autenticado, sem expor `passwordHash`.

### 4) Imóveis (protegidos por JWT)

- `POST /imoveis`
- `GET /imoveis`
- `GET /imoveis/:id`
- `PUT /imoveis/:id`
- `DELETE /imoveis/:id`

Todos os endpoints de imóveis respeitam isolamento por `imobiliariaId` do usuário autenticado:

- CREATE ignora qualquer `imobiliariaId` enviado pelo cliente
- LIST/GET/UPDATE/DELETE sempre filtram por `imobiliariaId` do token

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

### Imobiliaria

- `id` (cuid)
- `nome`
- `telefone`
- `email` (opcional)
- `cnpj` (opcional)
- `status` (`ATIVO`/`INATIVO`)
- `createdAt`
- `updatedAt`

### User

- `id` (cuid)
- `nome`
- `telefone`
- `email` (unique global)
- `passwordHash`
- `role` (`ADMIN`/`CORRETOR`)
- `status` (`ATIVO`/`INATIVO`)
- `imobiliariaId` (FK)
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
- `imobiliariaId` (FK)
- `createdAt`
- `updatedAt`
