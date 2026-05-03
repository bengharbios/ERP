-- CreateEnum
CREATE TYPE "JourneyStage" AS ENUM ('AWARENESS', 'CONSIDERATION', 'DECISION', 'RETENTION', 'ADVOCACY');

-- CreateEnum
CREATE TYPE "TouchpointType" AS ENUM ('MARKETING_CAMPAIGN', 'EMAIL_OPEN', 'LINK_CLICK', 'WEBSITE_VISIT', 'FORM_SUBMISSION', 'PHONE_CALL', 'MEETING', 'PURCHASE', 'SUPPORT_TICKET', 'SOCIAL_INTERACTION');

-- CreateTable
CREATE TABLE "customer_journeys" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "current_stage" "JourneyStage" NOT NULL DEFAULT 'AWARENESS',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_updated" TIMESTAMP(3) NOT NULL,
    "is_converted" BOOLEAN NOT NULL DEFAULT false,
    "converted_at" TIMESTAMP(3),
    "conversion_value" DECIMAL(10,2),
    "touchpoint_count" INTEGER NOT NULL DEFAULT 0,
    "duration_days" INTEGER,

    CONSTRAINT "customer_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journey_touchpoints" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "type" "TouchpointType" NOT NULL,
    "stage" "JourneyStage" NOT NULL,
    "channel" TEXT,
    "campaign_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "engagement_score" INTEGER,

    CONSTRAINT "journey_touchpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_journeys_lead_id_idx" ON "customer_journeys"("lead_id");

-- CreateIndex
CREATE INDEX "journey_touchpoints_journey_id_idx" ON "journey_touchpoints"("journey_id");

-- CreateIndex
CREATE INDEX "journey_touchpoints_type_idx" ON "journey_touchpoints"("type");

-- AddForeignKey
ALTER TABLE "journey_touchpoints" ADD CONSTRAINT "journey_touchpoints_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "customer_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
