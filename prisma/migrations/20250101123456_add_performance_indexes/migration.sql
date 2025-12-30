-- CreateEnum for ActivityType
CREATE TYPE "ActivityType" AS ENUM ('CLIENT_CREATED', 'ORDER_CREATED', 'ORDER_STATUS_CHANGED', 'PROJECT_CREATED', 'PROJECT_STATUS_CHANGED', 'PAYMENT_RECEIVED', 'EVENT_CREATED', 'MEASUREMENT_ADDED');

-- CreateEnum for NotificationType
CREATE TYPE "NotificationType" AS ENUM ('ORDER_STATUS', 'PAYMENT_RECEIVED', 'CLIENT_ADDED', 'PROJECT_UPDATE', 'SYSTEM_ALERT', 'REMINDER');

-- CreateEnum for NotificationPriority
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateTable RecentUpdate
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

-- CreateTable Notification
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "priority" "NotificationPriority" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "entityId" TEXT,
    "entityType" TEXT,
    "actionUrl" TEXT,
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- Add composite indexes with performance optimization
CREATE INDEX "RecentUpdate_adminId_createdAt_idx" ON "RecentUpdate"("adminId", "createdAt" DESC);
CREATE INDEX "RecentUpdate_type_idx" ON "RecentUpdate"("type");

CREATE INDEX "Notification_adminId_isRead_createdAt_idx" ON "Notification"("adminId", "isRead", "createdAt" DESC);
CREATE INDEX "Notification_adminId_createdAt_idx" ON "Notification"("adminId", "createdAt" DESC);
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- AddForeignKey
ALTER TABLE "RecentUpdate" ADD CONSTRAINT "RecentUpdate_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE;
