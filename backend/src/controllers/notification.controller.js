const notificationService = require('../services/notification.service');

/**
 * Get all notifications for the authenticated user
 */
const getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { read, limit, skip } = req.query;

        const options = {
            read: read === 'true' ? true : read === 'false' ? false : undefined,
            limit: limit ? parseInt(limit) : 50,
            skip: skip ? parseInt(skip) : 0
        };

        const result = await notificationService.getUserNotifications(userId, options);

        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const count = await notificationService.getUnreadCount(userId);
        res.json({ count });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const notification = await notificationService.markAsRead(id, userId);
        res.json(notification);
    } catch (error) {
        if (error.message === 'Notification not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await notificationService.markAllAsRead(userId);
        res.json({ 
            message: 'All notifications marked as read',
            modifiedCount: result.modifiedCount 
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a notification
 */
const deleteNotification = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await notificationService.deleteNotification(id, userId);
        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        if (error.message === 'Notification not found') {
            return res.status(404).json({ message: error.message });
        }
        next(error);
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
};

