const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/notification.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', controller.getNotifications);
router.get('/unread-count', controller.getUnreadCount);
router.put('/:id/read', controller.markAsRead);
router.put('/read-all', controller.markAllAsRead);
router.delete('/:id', controller.deleteNotification);

module.exports = router;

