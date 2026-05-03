-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('DRAFT', 'RUNNING', 'PAUSED', 'COMPLETED');

-- CreateTable
CREATE TABLE "campaign_variants" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB,
    "traffic_split" DECIMAL(5,2) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "status" "VariantStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campaign_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_results" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "conversion_rate" DECIMAL(5,2) NOT NULL,
    "click_through_rate" DECIMAL(5,2) NOT NULL,
    "p_value" DECIMAL(5,4),
    "confidence" DECIMAL(5,2),
    "sample_size" INTEGER NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_test_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_winners" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "winner_variant_id" TEXT NOT NULL,
    "improvement_rate" DECIMAL(5,2) NOT NULL,
    "confidence_level" DECIMAL(5,2) NOT NULL,
    "declared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declared_by" TEXT,
    "notes" TEXT,

    CONSTRAINT "ab_test_winners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ab_test_winners_campaign_id_key" ON "ab_test_winners"("campaign_id");

-- AddForeignKey
ALTER TABLE "campaign_variants" ADD CONSTRAINT "campaign_variants_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_results" ADD CONSTRAINT "ab_test_results_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "campaign_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
