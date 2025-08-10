/*
  Warnings:

  - You are about to drop the column `contactType` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `leadSource` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the column `suburb` on the `contacts` table. All the data in the column will be lost.
  - You are about to drop the `contact_custom_fields` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_contact_properties` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."CustomFieldType" ADD VALUE 'DATETIME';
ALTER TYPE "public"."CustomFieldType" ADD VALUE 'DROPDOWN';
ALTER TYPE "public"."CustomFieldType" ADD VALUE 'MULTISELECT';
ALTER TYPE "public"."CustomFieldType" ADD VALUE 'URL';
ALTER TYPE "public"."CustomFieldType" ADD VALUE 'TEXTAREA';

-- DropForeignKey
ALTER TABLE "public"."contact_custom_fields" DROP CONSTRAINT "contact_custom_fields_contactId_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_contact_properties" DROP CONSTRAINT "user_contact_properties_userId_fkey";

-- DropIndex
DROP INDEX "public"."contacts_userId_contactType_idx";

-- DropIndex
DROP INDEX "public"."contacts_userId_status_idx";

-- AlterTable
ALTER TABLE "public"."contacts" DROP COLUMN "contactType",
DROP COLUMN "leadSource",
DROP COLUMN "status",
DROP COLUMN "suburb";

-- DropTable
DROP TABLE "public"."contact_custom_fields";

-- DropTable
DROP TABLE "public"."user_contact_properties";

-- DropEnum
DROP TYPE "public"."ContactStatus";

-- DropEnum
DROP TYPE "public"."ContactType";

-- CreateTable
CREATE TABLE "public"."custom_property_definitions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fieldKey" TEXT NOT NULL,
    "fieldType" "public"."CustomFieldType" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "defaultValue" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_property_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."custom_property_options" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_property_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."contact_custom_field_values" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "custom_property_definitions_userId_isActive_idx" ON "public"."custom_property_definitions"("userId", "isActive");

-- CreateIndex
CREATE INDEX "custom_property_definitions_userId_sortOrder_idx" ON "public"."custom_property_definitions"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "custom_property_definitions_userId_fieldKey_key" ON "public"."custom_property_definitions"("userId", "fieldKey");

-- CreateIndex
CREATE INDEX "custom_property_options_propertyId_sortOrder_idx" ON "public"."custom_property_options"("propertyId", "sortOrder");

-- CreateIndex
CREATE INDEX "contact_custom_field_values_contactId_idx" ON "public"."contact_custom_field_values"("contactId");

-- CreateIndex
CREATE INDEX "contact_custom_field_values_propertyId_idx" ON "public"."contact_custom_field_values"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_custom_field_values_contactId_propertyId_key" ON "public"."contact_custom_field_values"("contactId", "propertyId");

-- AddForeignKey
ALTER TABLE "public"."custom_property_definitions" ADD CONSTRAINT "custom_property_definitions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."custom_property_options" ADD CONSTRAINT "custom_property_options_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."custom_property_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_custom_field_values" ADD CONSTRAINT "contact_custom_field_values_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."contact_custom_field_values" ADD CONSTRAINT "contact_custom_field_values_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."custom_property_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
