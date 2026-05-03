-- AlterTable
ALTER TABLE "crm_activities" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "result" TEXT;

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "birthday" DATE,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "last_contacted" TIMESTAMP(3),
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "preferred_program_id" TEXT,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "crm_automation_rules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "condition" JSONB,
    "action" TEXT NOT NULL,
    "actionData" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_automation_rules_pkey" PRIMARY KEY ("id")
);
