/*
  Warnings:

  - The values [SELF_STUDY] on the enum `StudyMode` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StudyMode_new" AS ENUM ('IN_PERSON', 'ONLINE', 'SELF_PACED');
ALTER TABLE "classes" ALTER COLUMN "study_mode" DROP DEFAULT;
ALTER TABLE "classes" ALTER COLUMN "study_mode" TYPE "StudyMode_new" USING ("study_mode"::text::"StudyMode_new");
ALTER TYPE "StudyMode" RENAME TO "StudyMode_old";
ALTER TYPE "StudyMode_new" RENAME TO "StudyMode";
DROP TYPE "StudyMode_old";
ALTER TABLE "classes" ALTER COLUMN "study_mode" SET DEFAULT 'IN_PERSON';
COMMIT;

-- CreateTable
CREATE TABLE "class_unit_schedules" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "unit_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'upcoming',

    CONSTRAINT "class_unit_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "class_unit_schedules_class_id_unit_id_key" ON "class_unit_schedules"("class_id", "unit_id");

-- AddForeignKey
ALTER TABLE "class_unit_schedules" ADD CONSTRAINT "class_unit_schedules_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_unit_schedules" ADD CONSTRAINT "class_unit_schedules_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
