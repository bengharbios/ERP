-- AlterTable
ALTER TABLE "crm_activity_types" ADD COLUMN     "action" TEXT NOT NULL DEFAULT 'none',
ADD COLUMN     "chaining_type" TEXT NOT NULL DEFAULT 'suggest',
ADD COLUMN     "color" TEXT NOT NULL DEFAULT '#06b6d4',
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "icon" SET DEFAULT 'fa-tasks';

-- AlterTable
ALTER TABLE "crm_leads" ADD COLUMN     "custom_fields" JSONB;

-- AlterTable
ALTER TABLE "crm_stages" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_lost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "name_ar" TEXT;

-- AlterTable
ALTER TABLE "employee_shifts" ADD COLUMN     "break_duration" INTEGER DEFAULT 0,
ADD COLUMN     "end_time_2" TEXT,
ADD COLUMN     "is_split" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "start_time_2" TEXT,
ADD COLUMN     "total_hours" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "type" TEXT DEFAULT 'M';

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "active_template" TEXT NOT NULL DEFAULT 'legacy',
ADD COLUMN     "announcement_ticker" TEXT;

-- AlterTable
ALTER TABLE "staff_attendance" ADD COLUMN     "late_minutes" INTEGER DEFAULT 0,
ADD COLUMN     "target_break_minutes" INTEGER DEFAULT 0,
ADD COLUMN     "target_work_hours" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "crm_activity_plans" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activity_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activity_plan_steps" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "activity_type_id" TEXT NOT NULL,
    "summary" TEXT,
    "assignment" TEXT NOT NULL DEFAULT 'ask',
    "assigned_to_id" TEXT,
    "interval" INTEGER NOT NULL DEFAULT 0,
    "interval_unit" TEXT NOT NULL DEFAULT 'days',
    "trigger" TEXT NOT NULL DEFAULT 'after',
    "sequence" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "crm_activity_plan_steps_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "crm_activity_plan_steps" ADD CONSTRAINT "crm_activity_plan_steps_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "crm_activity_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activity_plan_steps" ADD CONSTRAINT "crm_activity_plan_steps_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "crm_activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activity_plan_steps" ADD CONSTRAINT "crm_activity_plan_steps_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
