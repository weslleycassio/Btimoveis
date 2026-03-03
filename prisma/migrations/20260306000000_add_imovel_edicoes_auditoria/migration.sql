CREATE TABLE "ImovelEdicao" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "editadoPorUserId" TEXT NOT NULL,
    "motivoEdicao" TEXT NOT NULL,
    "camposAlterados" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImovelEdicao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ImovelEdicao_imovelId_idx" ON "ImovelEdicao"("imovelId");
CREATE INDEX "ImovelEdicao_editadoPorUserId_idx" ON "ImovelEdicao"("editadoPorUserId");

ALTER TABLE "ImovelEdicao"
ADD CONSTRAINT "ImovelEdicao_imovelId_fkey"
FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ImovelEdicao"
ADD CONSTRAINT "ImovelEdicao_editadoPorUserId_fkey"
FOREIGN KEY ("editadoPorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
