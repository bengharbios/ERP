-- AlterTable
ALTER TABLE "crm_leads" ADD COLUMN     "duplicate_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "is_duplicate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mobile_normalized" TEXT,
ADD COLUMN     "phone_normalized" TEXT;
