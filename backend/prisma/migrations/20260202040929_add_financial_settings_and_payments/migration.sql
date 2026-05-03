/*
  Warnings:

  - You are about to drop the column `is_included_in_tuition` on the `fee_calculation_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "fee_calculation_items" DROP COLUMN "is_included_in_tuition";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "installment_id" TEXT,
ADD COLUMN     "late_fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "receipt_number" TEXT;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "full_payment_discount_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "full_payment_discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "late_fee_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "late_fee_grace_days" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "payments_installment_id_idx" ON "payments"("installment_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_installment_id_fkey" FOREIGN KEY ("installment_id") REFERENCES "installments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
