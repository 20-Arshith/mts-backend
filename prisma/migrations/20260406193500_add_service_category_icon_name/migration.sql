ALTER TABLE "service_categories"
ADD COLUMN IF NOT EXISTS "icon_name" TEXT NOT NULL DEFAULT 'general';

UPDATE "service_categories"
SET "icon_name" = CASE
    WHEN LOWER("category_name") LIKE '%plumb%' OR LOWER("category_name") LIKE '%pipe%' THEN 'plumbing'
    WHEN LOWER("category_name") LIKE '%elect%' OR LOWER("category_name") LIKE '%wir%' THEN 'electrical'
    WHEN LOWER("category_name") LIKE '%clean%' OR LOWER("category_name") LIKE '%sweep%' THEN 'cleaning'
    WHEN LOWER("category_name") LIKE '%paint%' OR LOWER("category_name") LIKE '%wall%' THEN 'painting'
    WHEN LOWER("category_name") LIKE '%ac%' OR LOWER("category_name") LIKE '%cool%' THEN 'cooling'
    WHEN LOWER("category_name") LIKE '%carp%' OR LOWER("category_name") LIKE '%wood%' THEN 'carpentry'
    WHEN LOWER("category_name") LIKE '%mech%' OR LOWER("category_name") LIKE '%car%' THEN 'automotive'
    WHEN LOWER("category_name") LIKE '%mov%' OR LOWER("category_name") LIKE '%pack%' THEN 'moving'
    WHEN LOWER("category_name") LIKE '%secure%' OR LOWER("category_name") LIKE '%cctv%' THEN 'security'
    ELSE 'general'
END;
