const BaseRepository = require('./base.repository');

class VendorAvailabilityRepository extends BaseRepository {
    constructor() {
        super('vendorAvailability');
    }

    async findByVendor(vendorId) {
        return await this.model.findMany({
            where: { vendor_id: vendorId },
            orderBy: { day_of_week: 'asc' },
        });
    }

    async upsertSchedule(vendorId, schedule) {
        const operations = schedule.map((item) =>
            this.model.upsert({
                where: {
                    vendor_id_day_of_week: {
                        vendor_id: vendorId,
                        day_of_week: item.day_of_week,
                    },
                },
                update: {
                    is_active: item.is_active,
                    start_time: item.start_time,
                    end_time: item.end_time,
                },
                create: {
                    vendor_id: vendorId,
                    day_of_week: item.day_of_week,
                    is_active: item.is_active,
                    start_time: item.start_time,
                    end_time: item.end_time,
                },
            })
        );

        await Promise.all(operations);
        return this.findByVendor(vendorId);
    }
}

module.exports = new VendorAvailabilityRepository();
