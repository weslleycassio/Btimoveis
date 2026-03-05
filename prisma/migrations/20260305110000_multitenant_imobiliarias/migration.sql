-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CORRETOR';

-- CreateEnum
CREATE TYPE "RegistroStatus" AS ENUM ('ATIVO', 'INATIVO');

-- CreateTable
CREATE TABLE "Imobiliaria" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "cnpj" TEXT,
    "status" "RegistroStatus" NOT NULL DEFAULT 'ATIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Imobiliaria_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN "nome" TEXT,
    ADD COLUMN "telefone" TEXT,
    ADD COLUMN "status" "RegistroStatus" NOT NULL DEFAULT 'ATIVO',
    ADD COLUMN "imobiliariaId" TEXT;

ALTER TABLE "Imovel"
    ADD COLUMN "imobiliariaId" TEXT;

-- Seed de compatibilidade para ambientes existentes
INSERT INTO "Imobiliaria" ("id", "nome", "telefone", "email", "status", "createdAt", "updatedAt")
SELECT
    'imob_default',
    'Imobiliária Default',
    '00000000000',
    NULL,
    'ATIVO'::"RegistroStatus",
    NOW(),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Imobiliaria");

UPDATE "User"
SET
    "nome" = COALESCE("nome", split_part("email", '@', 1)),
    "telefone" = COALESCE("telefone", '00000000000'),
    "imobiliariaId" = COALESCE("imobiliariaId", 'imob_default');

UPDATE "Imovel"
SET "imobiliariaId" = COALESCE("imobiliariaId", 'imob_default');

-- Enforce not null após backfill
ALTER TABLE "User"
    ALTER COLUMN "nome" SET NOT NULL,
    ALTER COLUMN "telefone" SET NOT NULL,
    ALTER COLUMN "imobiliariaId" SET NOT NULL;

ALTER TABLE "Imovel"
    ALTER COLUMN "imobiliariaId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User"
ADD CONSTRAINT "User_imobiliariaId_fkey"
FOREIGN KEY ("imobiliariaId") REFERENCES "Imobiliaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Imovel"
ADD CONSTRAINT "Imovel_imobiliariaId_fkey"
FOREIGN KEY ("imobiliariaId") REFERENCES "Imobiliaria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
