-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN     "class_id" TEXT;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;
