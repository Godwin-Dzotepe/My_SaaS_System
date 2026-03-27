-- CreateTable
CREATE TABLE "StudentFeeBalance" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_fee_id" TEXT NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentFeeBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudentFeeBalance_school_id_student_id_idx" ON "StudentFeeBalance"("school_id", "student_id");

-- CreateIndex
CREATE INDEX "StudentFeeBalance_school_fee_id_idx" ON "StudentFeeBalance"("school_fee_id");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeBalance_student_id_school_fee_id_key" ON "StudentFeeBalance"("student_id", "school_fee_id");

-- AddForeignKey
ALTER TABLE "StudentFeeBalance" ADD CONSTRAINT "StudentFeeBalance_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeBalance" ADD CONSTRAINT "StudentFeeBalance_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentFeeBalance" ADD CONSTRAINT "StudentFeeBalance_school_fee_id_fkey" FOREIGN KEY ("school_fee_id") REFERENCES "SchoolFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
