-- CreateTable
CREATE TABLE "attendance_events" (
    "id" TEXT NOT NULL,
    "attendance_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "device_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "staff_attendance" 
ADD COLUMN "total_break_minutes" INTEGER DEFAULT 0,
ADD COLUMN "total_work_minutes" INTEGER DEFAULT 0,
ADD COLUMN "first_check_in" TIMESTAMP(3),
ADD COLUMN "last_check_out" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "attendance_events_attendance_id_idx" ON "attendance_events"("attendance_id");

-- CreateIndex
CREATE INDEX "attendance_events_event_time_idx" ON "attendance_events"("event_time");

-- AddForeignKey
ALTER TABLE "attendance_events" ADD CONSTRAINT "attendance_events_attendance_id_fkey" 
FOREIGN KEY ("attendance_id") REFERENCES "staff_attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
