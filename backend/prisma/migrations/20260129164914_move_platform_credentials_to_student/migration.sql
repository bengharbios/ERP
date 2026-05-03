/*
  Warnings:

  - You are about to drop the column `platform_password` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `platform_url` on the `classes` table. All the data in the column will be lost.
  - You are about to drop the column `platform_username` on the `classes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "classes" DROP COLUMN "platform_password",
DROP COLUMN "platform_url",
DROP COLUMN "platform_username";

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "platform_password" TEXT,
ADD COLUMN     "platform_username" TEXT;
