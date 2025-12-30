-- AlterTable
ALTER TABLE "public"."Measurement" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE INDEX "Measurement_isDefault_idx" ON "public"."Measurement"("isDefault");
