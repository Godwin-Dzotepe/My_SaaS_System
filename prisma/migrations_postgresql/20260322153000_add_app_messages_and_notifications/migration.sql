-- CreateTable
CREATE TABLE "AppMessage" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "recipient_id" TEXT NOT NULL,
    "sender_role" "Role" NOT NULL,
    "recipient_role" "Role" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "school_name" TEXT,
    "is_edited" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppNotification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "school_id" TEXT,
    "message_id" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "source_role" "Role",
    "source_name" TEXT,
    "school_name" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppNotification_user_id_is_read_created_at_idx" ON "AppNotification"("user_id", "is_read", "created_at");

-- AddForeignKey
ALTER TABLE "AppMessage" ADD CONSTRAINT "AppMessage_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMessage" ADD CONSTRAINT "AppMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppMessage" ADD CONSTRAINT "AppMessage_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "School"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppNotification" ADD CONSTRAINT "AppNotification_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "AppMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
