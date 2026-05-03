-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'lead',
    "partner_id" TEXT,
    "contact_name" TEXT,
    "email_from" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "website" TEXT,
    "expected_revenue" DECIMAL(12,2),
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "stage_id" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" TEXT NOT NULL DEFAULT '1',
    "salesperson_id" TEXT,
    "team_id" TEXT,
    "campaign_id" TEXT,
    "source_id" TEXT,
    "medium_id" TEXT,
    "date_open" TIMESTAMP(3),
    "date_closed" TIMESTAMP(3),
    "date_last_stage_update" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "date_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_stages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "probability" DOUBLE PRECISION NOT NULL DEFAULT 10.0,
    "is_won" BOOLEAN NOT NULL DEFAULT false,
    "is_folded" BOOLEAN NOT NULL DEFAULT false,
    "requirements" TEXT,

    CONSTRAINT "crm_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sequence" INTEGER NOT NULL DEFAULT 10,
    "leader_id" TEXT,
    "invoiced_target" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "crm_teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activities_new" (
    "id" TEXT NOT NULL,
    "res_id" TEXT NOT NULL,
    "activity_type_id" TEXT NOT NULL,
    "summary" TEXT,
    "note" TEXT,
    "date_deadline" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_activities_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_activity_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "days_delay" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "crm_activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_notes" (
    "id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_CrmTeamMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_teams_name_key" ON "crm_teams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_CrmTeamMembers_AB_unique" ON "_CrmTeamMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_CrmTeamMembers_B_index" ON "_CrmTeamMembers"("B");

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_stages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_salesperson_id_fkey" FOREIGN KEY ("salesperson_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "crm_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_teams" ADD CONSTRAINT "crm_teams_leader_id_fkey" FOREIGN KEY ("leader_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities_new" ADD CONSTRAINT "crm_activities_new_res_id_fkey" FOREIGN KEY ("res_id") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities_new" ADD CONSTRAINT "crm_activities_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_activities_new" ADD CONSTRAINT "crm_activities_new_activity_type_id_fkey" FOREIGN KEY ("activity_type_id") REFERENCES "crm_activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrmTeamMembers" ADD CONSTRAINT "_CrmTeamMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "crm_teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CrmTeamMembers" ADD CONSTRAINT "_CrmTeamMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
