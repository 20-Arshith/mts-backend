CREATE TABLE IF NOT EXISTS "vendor_availability" (
    "availability_id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_availability_pkey" PRIMARY KEY ("availability_id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "vendor_availability_vendor_id_day_of_week_key"
ON "vendor_availability"("vendor_id", "day_of_week");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'vendor_availability_vendor_id_fkey'
    ) THEN
        ALTER TABLE "vendor_availability"
        ADD CONSTRAINT "vendor_availability_vendor_id_fkey"
        FOREIGN KEY ("vendor_id") REFERENCES "vendors"("vendor_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
