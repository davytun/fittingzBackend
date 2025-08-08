-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "additionalDetails" TEXT,
ADD COLUMN     "bodyShape" TEXT,
ADD COLUMN     "dislikedColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "favoriteColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "preferredStyles" TEXT[] DEFAULT ARRAY[]::TEXT[];
