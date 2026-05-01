const notificationService = require('../services/notification.services');

exports.getMyNotifications = async (req, res, next) => {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 20;
        const data = await notificationService.getMyNotifications(req.user.user_id, limit);
        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

exports.markRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markNotificationRead(
            Number(req.params.id),
            req.user.user_id
        );
        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        if (error.message === 'Notification not found') {
            return res.status(404).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.markAllRead = async (req, res, next) => {
    try {
        await notificationService.markAllNotificationsRead(req.user.user_id);
        res.status(200).json({ success: true, message: 'Notifications marked as read' });
    } catch (error) {
        next(error);
    }
};
