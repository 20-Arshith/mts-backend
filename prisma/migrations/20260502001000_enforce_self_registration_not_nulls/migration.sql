UPDATE "vendor_services"
SET "image_urls" = ARRAY[]::TEXT[]
WHERE "image_urls" IS NULL;

ALTER TABLE "vendor_services"
    ALTER COLUMN "image_urls" SET NOT NULL,
    ALTER COLUMN "image_urls" SET DEFAULT ARRAY[]::TEXT[];
