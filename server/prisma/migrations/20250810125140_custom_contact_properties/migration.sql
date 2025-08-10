/*
  Warnings:

  - The `contactType` column on the `contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `contacts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."contacts" DROP COLUMN "contactType",
ADD COLUMN     "contactType" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT;

-- CreateIndex
CREATE INDEX "contacts_userId_contactType_idx" ON "public"."contacts"("userId", "contactType");

-- CreateIndex
CREATE INDEX "contacts_userId_status_idx" ON "public"."contacts"("userId", "status");
