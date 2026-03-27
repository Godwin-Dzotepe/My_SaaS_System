-- DropForeignKey
ALTER TABLE "Announcement" DROP CONSTRAINT "Announcement_school_id_fkey";

-- AlterTable
ALTER TABLE "Announcement" ALTER COLUMN "school_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;
