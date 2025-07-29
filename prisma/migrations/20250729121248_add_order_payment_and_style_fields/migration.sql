-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "deposit" DECIMAL(10,2),
ADD COLUMN     "styleDescription" TEXT;

-- CreateTable
CREATE TABLE "OrderStyleImage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "styleImageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStyleImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderStyleImage_orderId_idx" ON "OrderStyleImage"("orderId");

-- CreateIndex
CREATE INDEX "OrderStyleImage_styleImageId_idx" ON "OrderStyleImage"("styleImageId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderStyleImage_orderId_styleImageId_key" ON "OrderStyleImage"("orderId", "styleImageId");

-- AddForeignKey
ALTER TABLE "OrderStyleImage" ADD CONSTRAINT "OrderStyleImage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStyleImage" ADD CONSTRAINT "OrderStyleImage_styleImageId_fkey" FOREIGN KEY ("styleImageId") REFERENCES "StyleImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
