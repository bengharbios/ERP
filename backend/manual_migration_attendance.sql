-- Add new columns to staff_attendance
ALTER TABLE "staff_attendance" 
ADD COLUMN IF NOT EXISTS "first_check_in" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "last_check_out" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "total_break_minutes" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "total_work_minutes" INTEGER DEFAULT 0;

-- Create attendance_events table
CREATE TABLE IF NOT EXISTS "attendance_events" (
    "id" TEXT NOT NULL,
    "attendance_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "device_info" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_events_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "attendance_events_attendance_id_idx" ON "attendance_events"("attendance_id");
CREATE INDEX IF NOT EXISTS "attendance_events_event_time_idx" ON "attendance_events"("event_time");

-- Add foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'attendance_events_attendance_id_fkey'
    ) THEN
        ALTER TABLE "attendance_events" 
        ADD CONSTRAINT "attendance_events_attendance_id_fkey" 
        FOREIGN KEY ("attendance_id") REFERENCES "staff_attendance"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
