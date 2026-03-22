ALTER TABLE "User"
ADD COLUMN "temporary_password" TEXT,
ADD COLUMN "password_generated_at" TIMESTAMP(3);
