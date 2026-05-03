/*
  Warnings:

  - A unique constraint covering the columns `[expense_number]` on the table `expenses` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "expense_number" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "paid_to" TEXT,
ADD COLUMN     "tax_amount" DECIMAL(10,2) DEFAULT 0,
ADD COLUMN     "tax_rate" DECIMAL(5,2) DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "tax_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 15;

-- CreateIndex
CREATE UNIQUE INDEX "expenses_expense_number_key" ON "expenses"("expense_number");
