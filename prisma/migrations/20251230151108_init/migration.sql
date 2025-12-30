-- CreateEnum
CREATE TYPE "public"."TokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "public"."ProjectStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "contactPhone" TEXT,
    "businessAddress" TEXT,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "public"."TokenType" NOT NULL,
    "email" TEXT NOT NULL,
    "adminId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."ProjectStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "dueDate" TIMESTAMP(3),
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "projectId" TEXT,
    "deposit" DECIMAL(10,2),
    "styleDescription" TEXT,
    "eventId" TEXT,
    "details" JSONB,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderStyleImage" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "styleImageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStyleImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "gender" TEXT,
    "eventType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,
    "additionalDetails" TEXT,
    "bodyShape" TEXT,
    "dislikedColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "favoriteColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "preferredStyles" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Measurement" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "orderId" TEXT,
    "fields" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Measurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StyleImage" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "adminId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StyleImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" TIMESTAMP(3),
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventClient" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "public"."Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_email_type_idx" ON "public"."VerificationToken"("email", "type");

-- CreateIndex
CREATE INDEX "VerificationToken_adminId_idx" ON "public"."VerificationToken"("adminId");

-- CreateIndex
CREATE INDEX "Project_clientId_idx" ON "public"."Project"("clientId");

-- CreateIndex
CREATE INDEX "Project_adminId_idx" ON "public"."Project"("adminId");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "public"."Project"("status");

-- CreateIndex
CREATE INDEX "Order_clientId_idx" ON "public"."Order"("clientId");

-- CreateIndex
CREATE INDEX "Order_adminId_idx" ON "public"."Order"("adminId");

-- CreateIndex
CREATE INDEX "Order_projectId_idx" ON "public"."Order"("projectId");

-- CreateIndex
CREATE INDEX "Order_eventId_idx" ON "public"."Order"("eventId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "public"."Order"("status");

-- CreateIndex
CREATE INDEX "Order_orderNumber_idx" ON "public"."Order"("orderNumber");

-- CreateIndex
CREATE INDEX "OrderStyleImage_orderId_idx" ON "public"."OrderStyleImage"("orderId");

-- CreateIndex
CREATE INDEX "OrderStyleImage_styleImageId_idx" ON "public"."OrderStyleImage"("styleImageId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderStyleImage_orderId_styleImageId_key" ON "public"."OrderStyleImage"("orderId", "styleImageId");

-- CreateIndex
CREATE INDEX "Client_adminId_idx" ON "public"."Client"("adminId");

-- CreateIndex
CREATE UNIQUE INDEX "Measurement_clientId_key" ON "public"."Measurement"("clientId");

-- CreateIndex
CREATE INDEX "Measurement_clientId_idx" ON "public"."Measurement"("clientId");

-- CreateIndex
CREATE INDEX "Measurement_orderId_idx" ON "public"."Measurement"("orderId");

-- CreateIndex
CREATE INDEX "StyleImage_clientId_idx" ON "public"."StyleImage"("clientId");

-- CreateIndex
CREATE INDEX "StyleImage_adminId_idx" ON "public"."StyleImage"("adminId");

-- CreateIndex
CREATE INDEX "StyleImage_category_idx" ON "public"."StyleImage"("category");

-- CreateIndex
CREATE INDEX "Event_adminId_idx" ON "public"."Event"("adminId");

-- CreateIndex
CREATE INDEX "EventClient_eventId_idx" ON "public"."EventClient"("eventId");

-- CreateIndex
CREATE INDEX "EventClient_clientId_idx" ON "public"."EventClient"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "EventClient_eventId_clientId_key" ON "public"."EventClient"("eventId", "clientId");

-- CreateIndex
CREATE INDEX "Payment_orderId_idx" ON "public"."Payment"("orderId");

-- AddForeignKey
ALTER TABLE "public"."VerificationToken" ADD CONSTRAINT "VerificationToken_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderStyleImage" ADD CONSTRAINT "OrderStyleImage_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderStyleImage" ADD CONSTRAINT "OrderStyleImage_styleImageId_fkey" FOREIGN KEY ("styleImageId") REFERENCES "public"."StyleImage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Client" ADD CONSTRAINT "Client_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Measurement" ADD CONSTRAINT "Measurement_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Measurement" ADD CONSTRAINT "Measurement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StyleImage" ADD CONSTRAINT "StyleImage_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StyleImage" ADD CONSTRAINT "StyleImage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."Admin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventClient" ADD CONSTRAINT "EventClient_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EventClient" ADD CONSTRAINT "EventClient_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
