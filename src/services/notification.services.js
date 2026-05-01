const notificationRepository = require('../repositories/notification.repository');

exports.createNotification = async (data) => {
    return await notificationRepository.create(data);
};

exports.getMyNotifications = async (userId, limit = 20) => {
    const notifications = await notificationRepository.findForRecipient(userId, limit);
    const unreadCount = await notificationRepository.countUnread(userId);

    return {
        notifications,
        unreadCount,
    };
};

exports.markNotificationRead = async (notificationId, userId) => {
    const notifications = await notificationRepository.findForRecipient(userId, 100);
    const ownsNotification = notifications.some(
        (item) => item.notification_id === notificationId
    );

    if (!ownsNotification) {
        throw new Error('Notification not found');
    }

    return await notificationRepository.markAsRead(notificationId, userId);
};

exports.markAllNotificationsRead = async (userId) => {
    return await notificationRepository.markAllAsRead(userId);
};
