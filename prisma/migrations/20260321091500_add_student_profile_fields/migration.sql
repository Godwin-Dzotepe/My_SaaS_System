-- AlterTable
ALTER TABLE "Student"
ADD COLUMN "date_of_birth" TIMESTAMP(3),
ADD COLUMN "gender" TEXT,
ADD COLUMN "nationality" TEXT,
ADD COLUMN "admission_date" TIMESTAMP(3),
ADD COLUMN "previous_school" TEXT,
ADD COLUMN "residential_address" TEXT,
ADD COLUMN "digital_address" TEXT,
ADD COLUMN "emergency_contact_name" TEXT,
ADD COLUMN "emergency_contact_phone" TEXT,
ADD COLUMN "medical_notes" TEXT,
ADD COLUMN "profile_image" TEXT;
