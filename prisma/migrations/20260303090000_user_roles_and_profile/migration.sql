-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CORD';
ALTER TYPE "UserRole" ADD VALUE 'CORRETOR';
ALTER TYPE "UserRole" ADD VALUE 'USER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "nome" TEXT;
ALTER TABLE "User" ADD COLUMN "telefone" TEXT;

-- Backfill nome for existing records using email prefix before making column required
UPDATE "User"
SET "nome" = split_part("email", '@', 1)
WHERE "nome" IS NULL;

ALTER TABLE "User" ALTER COLUMN "nome" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
