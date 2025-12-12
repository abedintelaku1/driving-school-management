const Notification = require('../models/Notification');

const list = async (_req, res, next) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 }).limit(20);
        res.json(notifications);
    } catch (err) {
        next(err);
    }
};

module.exports = { list };

