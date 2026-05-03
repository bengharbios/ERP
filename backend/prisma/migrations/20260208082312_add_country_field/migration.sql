-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'SA',
ADD COLUMN     "student_number_length" INTEGER NOT NULL DEFAULT 6;

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "passport_expiry_date" DATE;
