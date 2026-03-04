-- CreateTable
CREATE TABLE "ImovelImagem" (
    "id" TEXT NOT NULL,
    "imovelId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'minio',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "isCapa" BOOLEAN NOT NULL DEFAULT false,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImovelImagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImovelImagem_imovelId_idx" ON "ImovelImagem"("imovelId");

-- AddForeignKey
ALTER TABLE "ImovelImagem"
ADD CONSTRAINT "ImovelImagem_imovelId_fkey"
FOREIGN KEY ("imovelId") REFERENCES "Imovel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImovelImagem"
ADD CONSTRAINT "ImovelImagem_uploadedByUserId_fkey"
FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
