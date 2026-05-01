const BaseRepository = require('./base.repository');

class NotificationRepository extends BaseRepository {
    constructor() {
        super('notification');
    }

    async findForRecipient(recipientUserId, limit = 20) {
        return await this.model.findMany({
            where: { recipient_user_id: recipientUserId },
            include: {
                booking: {
                    include: {
                        vendor_service: {
                            include: {
                                category: true,
                                vendor: {
                                    select: {
                                        vendor_id: true,
                                        business_name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: limit,
        });
    }

    async countUnread(recipientUserId) {
        return await this.model.count({
            where: {
                recipient_user_id: recipientUserId,
                is_read: false,
            },
        });
    }

    async markAsRead(notificationId, recipientUserId) {
        return await this.model.update({
            where: { notification_id: notificationId },
            data: {
                is_read: true,
                read_at: new Date(),
            },
        });
    }

    async markAllAsRead(recipientUserId) {
        return await this.model.updateMany({
            where: {
                recipient_user_id: recipientUserId,
                is_read: false,
            },
            data: {
                is_read: true,
                read_at: new Date(),
            },
        });
    }
}

module.exports = new NotificationRepository();
