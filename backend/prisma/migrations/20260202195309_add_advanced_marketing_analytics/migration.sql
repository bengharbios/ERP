-- CreateEnum
CREATE TYPE "FunnelStage" AS ENUM ('AWARENESS', 'INTEREST', 'CONSIDERATION', 'INTENT', 'PURCHASE');

-- CreateEnum
CREATE TYPE "LeadQuality" AS ENUM ('HOT', 'WARM', 'COLD');

-- CreateTable
CREATE TABLE "marketing_funnels" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "stage" "FunnelStage" NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "drop_off_rate" DECIMAL(5,2),
    "date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketing_funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_scoring" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "demographic_score" INTEGER NOT NULL DEFAULT 50,
    "engagement_score" INTEGER NOT NULL DEFAULT 50,
    "behavior_score" INTEGER NOT NULL DEFAULT 50,
    "total_score" INTEGER NOT NULL DEFAULT 50,
    "quality" "LeadQuality" NOT NULL DEFAULT 'COLD',
    "conversion_probability" DECIMAL(5,2),
    "recommended_action" TEXT,
    "last_calculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_scoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_roi" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "total_spent" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "setup_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "media_cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cost_per_lead" DECIMAL(10,2),
    "cost_per_acquisition" DECIMAL(10,2),
    "roi" DECIMAL(10,2),
    "roas" DECIMAL(10,2),
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_roi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lead_activities" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "channel" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lead_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "marketing_funnels_campaign_id_stage_date_key" ON "marketing_funnels"("campaign_id", "stage", "date");

-- CreateIndex
CREATE UNIQUE INDEX "lead_scoring_lead_id_key" ON "lead_scoring"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "campaign_roi_campaign_id_key" ON "campaign_roi"("campaign_id");

-- CreateIndex
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities"("lead_id");

-- CreateIndex
CREATE INDEX "lead_activities_activity_type_idx" ON "lead_activities"("activity_type");

-- AddForeignKey
ALTER TABLE "marketing_funnels" ADD CONSTRAINT "marketing_funnels_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_roi" ADD CONSTRAINT "campaign_roi_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
