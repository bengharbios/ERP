/*
  Warnings:

  - You are about to drop the column `emergency_contact` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "emergency_contact",
ADD COLUMN     "bank_name" TEXT,
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "emergency_contact_name" TEXT,
ADD COLUMN     "emergency_contact_phone" TEXT,
ADD COLUMN     "emergency_contact_relation" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "id_expiry" DATE,
ADD COLUMN     "joining_date" DATE,
ADD COLUMN     "labor_card_expiry" DATE,
ADD COLUMN     "labor_card_number" TEXT,
ADD COLUMN     "marital_status" TEXT,
ADD COLUMN     "national_id" TEXT,
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "notice_period" INTEGER DEFAULT 30,
ADD COLUMN     "passport_expiry" DATE,
ADD COLUMN     "passport_number" TEXT,
ADD COLUMN     "probation_period" INTEGER DEFAULT 90,
ADD COLUMN     "swift_code" TEXT,
ADD COLUMN     "visa_expiry" DATE,
ADD COLUMN     "visa_number" TEXT;

-- CreateTable
CREATE TABLE "employee_commission_tiers" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "target_number" INTEGER NOT NULL,
    "target_threshold" DECIMAL(10,2) NOT NULL,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_commission_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_commission_tiers_employee_id_target_number_key" ON "employee_commission_tiers"("employee_id", "target_number");

-- AddForeignKey
ALTER TABLE "employee_commission_tiers" ADD CONSTRAINT "employee_commission_tiers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
