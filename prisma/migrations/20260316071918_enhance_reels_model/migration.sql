/*
  Warnings:

  - Added the required column `updated_at` to the `reels` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "reels" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "category_id" INTEGER,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "thumbnail_url" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "expiry_date" DROP NOT NULL;
