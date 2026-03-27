-- CreateEnum
CREATE TYPE "PromotionAction" AS ENUM ('PROMOTED', 'REPEATED', 'GRADUATED');

-- CreateTable
CREATE TABLE "StudentPromotionHistory" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "from_class_id" TEXT NOT NULL,
    "to_class_id" TEXT,
    "action" "PromotionAction" NOT NULL,
    "note" TEXT,
    "performed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPromotionHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentPromotionHistory_school_id_created_at_idx" ON "StudentPromotionHistory"("school_id", "created_at");

-- CreateIndex
CREATE INDEX "StudentPromotionHistory_student_id_created_at_idx" ON "StudentPromotionHistory"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "StudentPromotionHistory_from_class_id_to_class_id_idx" ON "StudentPromotionHistory"("from_class_id", "to_class_id");

-- AddForeignKey
ALTER TABLE "StudentPromotionHistory" ADD CONSTRAINT "StudentPromotionHistory_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionHistory" ADD CONSTRAINT "StudentPromotionHistory_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionHistory" ADD CONSTRAINT "StudentPromotionHistory_from_class_id_fkey" FOREIGN KEY ("from_class_id") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionHistory" ADD CONSTRAINT "StudentPromotionHistory_to_class_id_fkey" FOREIGN KEY ("to_class_id") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPromotionHistory" ADD CONSTRAINT "StudentPromotionHistory_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;