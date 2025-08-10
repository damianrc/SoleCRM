-- CreateTable
CREATE TABLE "public"."user_contact_properties" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "typeOptions" TEXT[],
    "sourceOptions" TEXT[],
    "statusOptions" TEXT[],

    CONSTRAINT "user_contact_properties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_contact_properties_userId_key" ON "public"."user_contact_properties"("userId");

-- AddForeignKey
ALTER TABLE "public"."user_contact_properties" ADD CONSTRAINT "user_contact_properties_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
