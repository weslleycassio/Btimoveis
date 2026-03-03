-- AlterTable
ALTER TABLE "Imovel" ADD COLUMN "corretorCaptadorId" TEXT;

-- Backfill with a fallback user id (required before making column NOT NULL)
UPDATE "Imovel"
SET "corretorCaptadorId" = (
  SELECT "id"
  FROM "User"
  ORDER BY "createdAt" ASC
  LIMIT 1
)
WHERE "corretorCaptadorId" IS NULL;

-- Make required after backfill
ALTER TABLE "Imovel" ALTER COLUMN "corretorCaptadorId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Imovel_corretorCaptadorId_idx" ON "Imovel"("corretorCaptadorId");

-- AddForeignKey
ALTER TABLE "Imovel"
ADD CONSTRAINT "Imovel_corretorCaptadorId_fkey"
FOREIGN KEY ("corretorCaptadorId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
