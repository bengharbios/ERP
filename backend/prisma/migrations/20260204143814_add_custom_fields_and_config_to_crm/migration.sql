-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "custom_fields" JSONB;

-- CreateTable
CREATE TABLE "crm_configurations" (
    "id" TEXT NOT NULL DEFAULT 'GLOBAL',
    "custom_fields_config" JSONB,
    "pipeline_settings" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_configurations_pkey" PRIMARY KEY ("id")
);
