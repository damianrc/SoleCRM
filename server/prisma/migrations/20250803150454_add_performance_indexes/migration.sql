-- CreateIndex
CREATE INDEX "contacts_userId_idx" ON "public"."contacts"("userId");

-- CreateIndex
CREATE INDEX "contacts_userId_createdAt_idx" ON "public"."contacts"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "contacts_userId_contactType_idx" ON "public"."contacts"("userId", "contactType");

-- CreateIndex
CREATE INDEX "contacts_userId_status_idx" ON "public"."contacts"("userId", "status");

-- CreateIndex
CREATE INDEX "contacts_name_idx" ON "public"."contacts"("name");

-- CreateIndex
CREATE INDEX "contacts_email_idx" ON "public"."contacts"("email");
