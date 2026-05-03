-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DRAFT', 'POSTED', 'CANCELLED');

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "financial_account_id" TEXT,
ADD COLUMN     "status" "ReceiptStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "receipts_status_idx" ON "receipts"("status");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
