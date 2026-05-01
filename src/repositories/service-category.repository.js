const BaseRepository = require('./base.repository');
const prisma = require('../config/db');

class ServiceCategoryRepository extends BaseRepository {
    constructor() {
        super('serviceCategory');
    }

    async findAll(params = {}) {
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "service_categories"
            ADD COLUMN IF NOT EXISTS "icon_name" TEXT NOT NULL DEFAULT 'general'
        `);

        return await prisma.$queryRawUnsafe(`
            SELECT
                "category_id",
                "category_name",
                COALESCE("icon_name", 'general') AS "icon_name"
            FROM "service_categories"
            ORDER BY "category_id" ASC
        `);
    }
}

module.exports = new ServiceCategoryRepository();
