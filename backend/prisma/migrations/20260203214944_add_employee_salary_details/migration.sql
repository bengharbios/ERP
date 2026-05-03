-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "contract_type" TEXT,
ADD COLUMN     "housing_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "other_allowances" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_deductions" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "transport_allowance" DECIMAL(10,2) NOT NULL DEFAULT 0;
