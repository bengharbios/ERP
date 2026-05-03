-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('FIXED', 'SALARY_COMMISSION', 'COMMISSION_ONLY', 'HOURLY');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('TRANSACTIONS', 'AMOUNT');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "commission_rate" DECIMAL(10,2),
ADD COLUMN     "hourly_rate" DECIMAL(10,2),
ADD COLUMN     "hourly_unit" INTEGER DEFAULT 1,
ADD COLUMN     "is_commission_percentage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "salary_type" "SalaryType" NOT NULL DEFAULT 'FIXED',
ADD COLUMN     "target_type" "TargetType",
ADD COLUMN     "target_value" DECIMAL(10,2);
