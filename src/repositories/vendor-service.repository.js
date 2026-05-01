const BaseRepository = require('./base.repository');

class VendorServiceRepository extends BaseRepository {
    constructor() {
        super('vendorService');
    }

    async findByVendor(vendorId) {
        return await this.model.findMany({
            where: { vendor_id: vendorId },
            include: { category: true }
        });
    }

    async createMany(services) {
        return await this.model.createMany({
            data: services,
            skipDuplicates: true
        });
    }

    /**
     * Get all approved vendor services (only from approved & available vendors)
     * with full vendor + category details.
     */
    async findAllApproved() {
        return await this.model.findMany({
            where: {
                approval_status: 'approved',
                is_available: true,
                vendor: {
                    approval_status: 'approved',
                    is_available: true
                }
            },
            include: {
                category: true,
                vendor: {
                    select: {
                        vendor_id: true,
                        business_name: true,
                        is_available: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                        logo_url: true,
                        banner_url: true,
                    }
                },
                bookings: {
                    where: { review: { isNot: null } },
                    include: { review: true }
                },
            },
            orderBy: { id: 'desc' }
        });
    }

    /**
     * Get approved vendor services filtered by category_id.
     */
    async findByCategory(categoryId) {
        return await this.model.findMany({
            where: {
                category_id: categoryId,
                approval_status: 'approved',
                is_available: true,
                vendor: {
                    approval_status: 'approved',
                    is_available: true
                }
            },
            include: {
                category: true,
                vendor: {
                    select: {
                        vendor_id: true,
                        business_name: true,
                        is_available: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                        logo_url: true,
                        banner_url: true,
                    }
                },
                bookings: {
                    where: { review: { isNot: null } },
                    include: { review: true }
                },
            },
            orderBy: { id: 'desc' }
        });
    }

    async findApprovedByVendor(vendorId) {
        return await this.model.findMany({
            where: {
                vendor_id: vendorId,
                approval_status: 'approved',
                is_available: true,
                vendor: {
                    approval_status: 'approved',
                    is_available: true
                }
            },
            include: {
                category: true,
                vendor: {
                    select: {
                        vendor_id: true,
                        business_name: true,
                        mobile: true,
                        email: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                        is_available: true
                    }
                },
                bookings: {
                    where: {
                        review: {
                            isNot: null
                        }
                    },
                    include: {
                        review: true
                    }
                },
            },
            orderBy: { id: 'desc' }
        });
    }

    /**
     * Search approved vendor services by keyword (service_title or description).
     */
    async searchServices(keyword) {
        return await this.model.findMany({
            where: {
                approval_status: 'approved',
                is_available: true,
                vendor: {
                    approval_status: 'approved',
                    is_available: true
                },
                OR: [
                    { service_title: { contains: keyword, mode: 'insensitive' } },
                    { description: { contains: keyword, mode: 'insensitive' } },
                    { category: { category_name: { contains: keyword, mode: 'insensitive' } } },
                    { vendor: { business_name: { contains: keyword, mode: 'insensitive' } } }
                ]
            },
            include: {
                category: true,
                vendor: {
                    select: {
                        vendor_id: true,
                        business_name: true,
                        is_available: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                        logo_url: true,
                        banner_url: true,
                    }
                },
                bookings: {
                    where: { review: { isNot: null } },
                    include: { review: true }
                },
            },
            orderBy: { id: 'desc' }
        });
    }

    /**
     * Get a single vendor service with full details.
     */
    async findServiceDetails(serviceId) {
        return await this.model.findUnique({
            where: { id: serviceId },
            include: {
                category: true,
                vendor: {
                    select: {
                        vendor_id: true,
                        business_name: true,
                        mobile: true,
                        approval_status: true,
                        is_available: true
                    }
                },
                bookings: {
                    include: {
                        review: true
                    }
                }
            }
        });
    }

    /**
     * Get all categories that have at least one approved service
     * (for showing only active categories to users).
     */
    async findActiveCategories() {
        const prisma = require('../config/db');
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "service_categories"
            ADD COLUMN IF NOT EXISTS "icon_name" TEXT NOT NULL DEFAULT 'general'
        `);

        return await prisma.$queryRawUnsafe(`
            SELECT
                sc.category_id,
                sc.category_name,
                COALESCE(sc.icon_name, 'general') AS icon_name,
                COUNT(vs.id)::int AS service_count
            FROM service_categories sc
            INNER JOIN vendor_services vs
                ON vs.category_id = sc.category_id
               AND vs.approval_status = 'approved'
               AND vs.is_available = true
            INNER JOIN vendors v
                ON v.vendor_id = vs.vendor_id
               AND v.approval_status = 'approved'
               AND v.is_available = true
            GROUP BY sc.category_id, sc.category_name, sc.icon_name
            ORDER BY sc.category_name ASC
        `).then((rows) =>
            rows.map((row) => ({
                category_id: Number(row.category_id),
                category_name: row.category_name,
                icon_name: row.icon_name || 'general',
                _count: {
                    services: Number(row.service_count || 0),
                },
            }))
        );
    }
}

module.exports = new VendorServiceRepository();
