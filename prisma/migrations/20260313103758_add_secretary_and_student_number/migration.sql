/*
  Warnings:

  - A unique constraint covering the columns `[student_number]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'secretary';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "student_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Student_student_number_key" ON "Student"("student_number");
