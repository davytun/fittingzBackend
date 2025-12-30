-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN     "orderId" TEXT;

-- CreateIndex
CREATE INDEX "Measurement_orderId_idx" ON "Measurement"("orderId");

-- AddForeignKey
ALTER TABLE "Measurement" ADD CONSTRAINT "Measurement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;