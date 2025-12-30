-- CreateTable
CREATE TABLE "public"."RecentUpdate" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entityId" TEXT,
    "entityType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecentUpdate_adminId_idx" ON "public"."RecentUpdate"("adminId");

-- CreateIndex
CREATE INDEX "RecentUpdate_createdAt_idx" ON "public"."RecentUpdate"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."RecentUpdate" ADD CONSTRAINT "RecentUpdate_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
