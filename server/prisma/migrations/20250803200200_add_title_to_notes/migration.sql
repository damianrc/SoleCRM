/*
  Warnings:

  - Added the required column `title` to the `notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Add title column with default value first
ALTER TABLE "public"."notes" ADD COLUMN "title" TEXT NOT NULL DEFAULT 'Untitled Note';

-- Update existing records to have meaningful titles based on content
UPDATE "public"."notes" 
SET "title" = CASE 
  WHEN LENGTH("content") > 50 THEN LEFT("content", 47) || '...'
  ELSE "content"
END
WHERE "title" = 'Untitled Note';

-- Remove the default value constraint (future records must provide title)
ALTER TABLE "public"."notes" ALTER COLUMN "title" DROP DEFAULT;
