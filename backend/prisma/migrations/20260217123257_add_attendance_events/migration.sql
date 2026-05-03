/*
  Warnings:

  - A unique constraint covering the columns `[biometric_id]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[payment_id]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ReconciliationStatus" AS ENUM ('PENDING', 'RECONCILED', 'FAILED');

-- CreateEnum
CREATE TYPE "JournalType" AS ENUM ('SALE', 'PURCHASE', 'CASH', 'BANK', 'GENERAL');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'IN_PAYMENT';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "biometric_id" TEXT;

-- AlterTable
ALTER TABLE "fee_calculation_items" ADD COLUMN     "income_account_id" TEXT,
ADD COLUMN     "is_tax_able" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "fee_items" ADD COLUMN     "income_account_id" TEXT,
ADD COLUMN     "revenue_account_id" TEXT;

-- AlterTable
ALTER TABLE "fee_templates" ADD COLUMN     "income_account_id" TEXT;

-- AlterTable
ALTER TABLE "financial_settings" ADD COLUMN     "default_bank_suspense_account_id" TEXT,
ADD COLUMN     "default_payroll_expense_account_id" TEXT,
ADD COLUMN     "default_payroll_payable_account_id" TEXT,
ADD COLUMN     "default_sales_discount_account_id" TEXT,
ADD COLUMN     "default_student_receivable_account_id" TEXT,
ADD COLUMN     "default_supplier_payable_account_id" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "payment_id" TEXT;

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "journal_id" TEXT;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "journal_id" TEXT,
ADD COLUMN     "reconciliation_status" "ReconciliationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "student_id" TEXT;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "is_tax_exempt" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "financial_journals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "type" "JournalType" NOT NULL,
    "default_account_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "biometric_devices" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 80,
    "username" TEXT NOT NULL DEFAULT 'admin',
    "password" TEXT NOT NULL,
    "protocol" TEXT NOT NULL DEFAULT 'ISAPI',
    "model" TEXT,
    "serial_number" TEXT,
    "last_sync" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "biometric_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "financial_journals_code_key" ON "financial_journals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "employees_biometric_id_key" ON "employees"("biometric_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_payment_id_key" ON "invoices"("payment_id");

-- AddForeignKey
ALTER TABLE "fee_templates" ADD CONSTRAINT "fee_templates_income_account_id_fkey" FOREIGN KEY ("income_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_items" ADD CONSTRAINT "fee_items_revenue_account_id_fkey" FOREIGN KEY ("revenue_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_items" ADD CONSTRAINT "fee_items_income_account_id_fkey" FOREIGN KEY ("income_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_calculation_items" ADD CONSTRAINT "fee_calculation_items_income_account_id_fkey" FOREIGN KEY ("income_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "financial_journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "financial_journals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "financial_journals" ADD CONSTRAINT "financial_journals_default_account_id_fkey" FOREIGN KEY ("default_account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
