-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "hr_absence_threshold" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "hr_late_grace_period" INTEGER NOT NULL DEFAULT 15,
ADD COLUMN     "hr_late_hour_deduction" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "hr_shift_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hr_work_end_time" TEXT NOT NULL DEFAULT '17:00',
ADD COLUMN     "hr_work_start_time" TEXT NOT NULL DEFAULT '09:00',
ADD COLUMN     "hr_working_days" JSONB NOT NULL DEFAULT '["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]';
