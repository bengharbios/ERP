/*
  Warnings:

  - A unique constraint covering the columns `[registration_number_pearson]` on the table `students` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[enrolment_number_alsalam]` on the table `students` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "students" ADD COLUMN     "award_type" TEXT,
ADD COLUMN     "certificate_course_title" TEXT,
ADD COLUMN     "certificate_name" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "enrolment_number_alsalam" TEXT,
ADD COLUMN     "full_name_id" TEXT,
ADD COLUMN     "full_name_passport" TEXT,
ADD COLUMN     "notification_course_title" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "phone2" TEXT,
ADD COLUMN     "qualification_level" TEXT,
ADD COLUMN     "registration_date_alsalam" DATE,
ADD COLUMN     "registration_number_pearson" TEXT,
ADD COLUMN     "specialization" TEXT,
ADD COLUMN     "year_of_award" TEXT;

-- CreateTable
CREATE TABLE "settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "institute_name" TEXT NOT NULL,
    "institute_name_ar" TEXT NOT NULL,
    "institute_name_en" TEXT NOT NULL,
    "institute_logo" TEXT,
    "institute_email" TEXT,
    "institute_phone" TEXT,
    "institute_address" TEXT,
    "institute_website" TEXT,
    "awarding_bodies" JSONB NOT NULL DEFAULT '[]',
    "default_academic_year" TEXT,
    "grade_passing_percentage" INTEGER NOT NULL DEFAULT 50,
    "attendance_threshold" INTEGER NOT NULL DEFAULT 75,
    "default_language" TEXT NOT NULL DEFAULT 'ar',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
    "date_format" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "student_number_prefix" TEXT NOT NULL DEFAULT 'STU-',
    "auto_generate_student_number" BOOLEAN NOT NULL DEFAULT true,
    "email_enabled" BOOLEAN NOT NULL DEFAULT false,
    "smtp_host" TEXT,
    "smtp_port" INTEGER,
    "smtp_username" TEXT,
    "smtp_password" TEXT,
    "sms_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sms_provider" TEXT,
    "sms_api_key" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_registrations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "awarding_body_id" TEXT NOT NULL,
    "registration_number" TEXT NOT NULL,
    "registration_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_registrations_student_id_awarding_body_id_key" ON "student_registrations"("student_id", "awarding_body_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_registration_number_pearson_key" ON "students"("registration_number_pearson");

-- CreateIndex
CREATE UNIQUE INDEX "students_enrolment_number_alsalam_key" ON "students"("enrolment_number_alsalam");

-- AddForeignKey
ALTER TABLE "student_registrations" ADD CONSTRAINT "student_registrations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
