/*
  Warnings:

  - You are about to drop the column `description` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `displayOrder` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Category` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Category_createdAt_idx";

-- DropIndex
DROP INDEX "Category_displayOrder_idx";

-- DropIndex
DROP INDEX "Category_isActive_idx";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "description",
DROP COLUMN "displayOrder",
DROP COLUMN "isActive";

-- CreateIndex
CREATE INDEX "Category_imageUrl_idx" ON "Category"("imageUrl");
