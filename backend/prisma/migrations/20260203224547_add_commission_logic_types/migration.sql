-- CreateEnum
CREATE TYPE "CommissionLogic" AS ENUM ('POSITIVE', 'NEGATIVE');

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "commission_logic" "CommissionLogic" NOT NULL DEFAULT 'POSITIVE',
ADD COLUMN     "minimum_salary_floor" DECIMAL(10,2) NOT NULL DEFAULT 0;
