/*
  Warnings:

  - A unique constraint covering the columns `[student_id,date,class_id]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Made the column `class_id` on table `Attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_class_id_fkey";

-- AlterTable
ALTER TABLE "Attendance" ALTER COLUMN "class_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_student_id_date_class_id_key" ON "Attendance"("student_id", "date", "class_id");

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
