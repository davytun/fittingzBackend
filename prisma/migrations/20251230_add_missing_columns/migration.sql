-- Add missing gender column to Client table
ALTER TABLE "Client" ADD COLUMN "gender" TEXT;

-- Add missing note column to Order table
ALTER TABLE "Order" ADD COLUMN "note" TEXT;
