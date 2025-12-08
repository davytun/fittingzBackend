-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('CLIENT_CREATED', 'ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'PROJECT_CREATED', 'PROJECT_STATUS_CHANGED', 'PAYMENT_RECEIVED', 'EVENT_CREATED', 'MEASUREMENT_ADDED');

-- CreateTable
CREATE TABLE "RecentUpdate" (
    "id" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecentUpdate_adminId_idx" ON "RecentUpdate"("adminId");

-- CreateIndex
CREATE INDEX "RecentUpdate_createdAt_idx" ON "RecentUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "RecentUpdate_type_idx" ON "RecentUpdate"("type");

-- AddForeignKey
ALTER TABLE "RecentUpdate" ADD CONSTRAINT "RecentUpdate_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE;