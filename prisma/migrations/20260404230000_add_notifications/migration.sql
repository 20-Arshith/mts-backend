CREATE TABLE IF NOT EXISTS "notifications" (
    "notification_id" SERIAL NOT NULL,
    "recipient_user_id" INTEGER NOT NULL,
    "booking_id" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT DEFAULT 'general',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

CREATE INDEX IF NOT EXISTS "notifications_recipient_user_id_is_read_idx"
    ON "notifications"("recipient_user_id", "is_read");

CREATE INDEX IF NOT EXISTS "notifications_booking_id_idx"
    ON "notifications"("booking_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'notifications_recipient_user_id_fkey'
    ) THEN
        ALTER TABLE "notifications"
            ADD CONSTRAINT "notifications_recipient_user_id_fkey"
            FOREIGN KEY ("recipient_user_id") REFERENCES "users"("user_id")
            ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'notifications_booking_id_fkey'
    ) THEN
        ALTER TABLE "notifications"
            ADD CONSTRAINT "notifications_booking_id_fkey"
            FOREIGN KEY ("booking_id") REFERENCES "bookings"("booking_id")
            ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
