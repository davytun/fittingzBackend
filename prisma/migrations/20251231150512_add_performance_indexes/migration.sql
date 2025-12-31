-- CreateIndex
CREATE INDEX "Admin_email_idx" ON "public"."Admin"("email");

-- CreateIndex
CREATE INDEX "Admin_createdAt_idx" ON "public"."Admin"("createdAt");

-- CreateIndex
CREATE INDEX "Client_name_idx" ON "public"."Client"("name");

-- CreateIndex
CREATE INDEX "Client_email_idx" ON "public"."Client"("email");

-- CreateIndex
CREATE INDEX "Client_phone_idx" ON "public"."Client"("phone");

-- CreateIndex
CREATE INDEX "Client_createdAt_idx" ON "public"."Client"("createdAt");

-- CreateIndex
CREATE INDEX "Measurement_createdAt_idx" ON "public"."Measurement"("createdAt");

-- CreateIndex
CREATE INDEX "Measurement_clientId_isDefault_idx" ON "public"."Measurement"("clientId", "isDefault");

-- CreateIndex
CREATE INDEX "Measurement_clientId_createdAt_idx" ON "public"."Measurement"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "public"."Order"("createdAt");

-- CreateIndex
CREATE INDEX "Order_dueDate_idx" ON "public"."Order"("dueDate");

-- CreateIndex
CREATE INDEX "Order_adminId_status_idx" ON "public"."Order"("adminId", "status");

-- CreateIndex
CREATE INDEX "Order_clientId_status_idx" ON "public"."Order"("clientId", "status");

-- CreateIndex
CREATE INDEX "StyleImage_createdAt_idx" ON "public"."StyleImage"("createdAt");

-- CreateIndex
CREATE INDEX "StyleImage_adminId_createdAt_idx" ON "public"."StyleImage"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "StyleImage_clientId_createdAt_idx" ON "public"."StyleImage"("clientId", "createdAt");
