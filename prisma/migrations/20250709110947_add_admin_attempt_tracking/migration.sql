-- CreateEnum
CREATE TYPE "LoginVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED');

-- AlterEnum
ALTER TYPE "TokenType" ADD VALUE 'IP_LOGIN_VERIFICATION';

-- CreateTable
CREATE TABLE "AdminLoginAttempt" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT,
    "verificationCode" TEXT,
    "verificationCodeExpiresAt" TIMESTAMP(3),
    "status" "LoginVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminLoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_adminId_idx" ON "AdminLoginAttempt"("adminId");

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_ipAddress_idx" ON "AdminLoginAttempt"("ipAddress");

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_status_idx" ON "AdminLoginAttempt"("status");

-- CreateIndex
CREATE INDEX "AdminLoginAttempt_adminId_ipAddress_status_idx" ON "AdminLoginAttempt"("adminId", "ipAddress", "status");

-- AddForeignKey
ALTER TABLE "AdminLoginAttempt" ADD CONSTRAINT "AdminLoginAttempt_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
