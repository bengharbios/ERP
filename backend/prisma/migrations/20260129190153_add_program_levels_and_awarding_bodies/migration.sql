-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "awarding_body_id" TEXT,
ADD COLUMN     "level_id" TEXT;

-- CreateTable
CREATE TABLE "program_levels" (
    "id" TEXT NOT NULL,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_levels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "awarding_bodies" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name_ar" TEXT NOT NULL,
    "name_en" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "awarding_bodies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "awarding_bodies_code_key" ON "awarding_bodies"("code");

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_level_id_fkey" FOREIGN KEY ("level_id") REFERENCES "program_levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_awarding_body_id_fkey" FOREIGN KEY ("awarding_body_id") REFERENCES "awarding_bodies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
