-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "eventId" TEXT;

-- CreateIndex
CREATE INDEX "Order_eventId_idx" ON "Order"("eventId");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;
