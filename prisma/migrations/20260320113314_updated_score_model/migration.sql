/*
  Warnings:

  - You are about to drop the column `score` on the `Score` table. All the data in the column will be lost.
  - You are about to drop the `Fee` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[school_id,student_number]` on the table `Student` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `Score` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('MOMO', 'BANK_TRANSFER', 'CARD', 'CASH');

-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('TUITION', 'LUNCH', 'TRANSPORT', 'CLASS', 'OTHER');

-- DropForeignKey
ALTER TABLE "Fee" DROP CONSTRAINT "Fee_student_id_fkey";

-- DropIndex
DROP INDEX "Student_student_number_key";

-- AlterTable
ALTER TABLE "Score" DROP COLUMN "score",
ADD COLUMN     "classScore" DOUBLE PRECISION,
ADD COLUMN     "examScore" DOUBLE PRECISION,
ADD COLUMN     "grade" TEXT,
ADD COLUMN     "remark" TEXT,
ADD COLUMN     "totalScore" DOUBLE PRECISION,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "parent_name" TEXT,
ADD COLUMN     "parent_relation" TEXT DEFAULT 'Guardian',
ALTER COLUMN "parent_phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailVerified" TIMESTAMP(3),
ADD COLUMN     "image" TEXT,
ADD COLUMN     "lastOtpSentAt" TIMESTAMP(3),
ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otpAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "otpExpiresAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "Fee";

-- DropEnum
DROP TYPE "FeeStatus";

-- CreateTable
CREATE TABLE "SchoolPaymentDetail" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "momoNumber" TEXT,
    "bankAccountNumber" TEXT,
    "bankName" TEXT,
    "paymentInstructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolPaymentDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" "PaymentMethod" NOT NULL,
    "referralName" TEXT NOT NULL,
    "transactionId" TEXT,
    "paidAt" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingConfig" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "min_score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "remark" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GradingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolFee" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "fee_type" "FeeType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "academic_year" TEXT NOT NULL,
    "term" TEXT,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchoolFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeacherSubjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TeacherSubjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchoolPaymentDetail_school_id_key" ON "SchoolPaymentDetail"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "GradingConfig_school_id_grade_key" ON "GradingConfig"("school_id", "grade");

-- CreateIndex
CREATE INDEX "_TeacherSubjects_B_index" ON "_TeacherSubjects"("B");

-- CreateIndex
CREATE INDEX "Score_student_id_subject_id_academic_year_term_idx" ON "Score"("student_id", "subject_id", "academic_year", "term");

-- CreateIndex
CREATE UNIQUE INDEX "Student_school_id_student_number_key" ON "Student"("school_id", "student_number");

-- CreateIndex
CREATE INDEX "User_phone_role_idx" ON "User"("phone", "role");

-- CreateIndex
CREATE INDEX "User_school_id_phone_idx" ON "User"("school_id", "phone");

-- AddForeignKey
ALTER TABLE "SchoolPaymentDetail" ADD CONSTRAINT "SchoolPaymentDetail_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingConfig" ADD CONSTRAINT "GradingConfig_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolFee" ADD CONSTRAINT "SchoolFee_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeacherSubjects" ADD CONSTRAINT "_TeacherSubjects_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
