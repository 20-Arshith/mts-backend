const BaseRepository = require('./base.repository');

class ReviewRepository extends BaseRepository {
    constructor() {
        super('review');
    }

    async getVendorRatingSummary(vendorId) {
        const summary = await this.model.aggregate({
            where: {
                booking: {
                    vendor_service: {
                        vendor_id: vendorId,
                    }
                }
            },
            _avg: {
                rating: true,
            },
            _count: {
                rating: true,
            }
        });

        return {
            rating: summary._avg.rating !== null ? Number(Number(summary._avg.rating).toFixed(1)) : null,
            review_count: summary._count.rating || 0,
        };
    }

    async upsertForBooking(bookingId, userId, data) {
        return await this.model.upsert({
            where: { booking_id: bookingId },
            update: {
                rating: data.rating,
                comment: data.comment || null,
            },
            create: {
                booking_id: bookingId,
                user_id: userId,
                rating: data.rating,
                comment: data.comment || null,
            }
        });
    }
}

module.exports = new ReviewRepository();
