const Notification = require('../models/Notification');

/**
 * Create a new notification
 * @param {Object} data - Notification data
 * @param {string} data.userId - User ID to notify
 * @param {string} data.title - Notification title
 * @param {string} data.message - Notification message
 * @param {string} data.type - Notification type (info, success, warning, error)
 * @param {string} data.relatedEntity - Related entity type
 * @param {string} data.relatedEntityId - Related entity ID
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async ({
    userId,
    title,
    message,
    type = 'info',
    relatedEntity = 'system',
    relatedEntityId = null
}) => {
    try {
        if (!userId || !title || !message) {
            throw new Error('UserId, title, and message are required');
        }

        const notification = await Notification.create({
            userId,
            title,
            message,
            type,
            relatedEntity,
            relatedEntityId
        });

        return notification;
    } catch (error) {
        throw error;
    }
};

/**
 * Get all notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {boolean} options.read - Filter by read status
 * @param {number} options.limit - Limit number of results
 * @param {number} options.skip - Skip number of results
 * @returns {Promise<Object>} - Notifications and count
 */
const getUserNotifications = async (userId, options = {}) => {
    try {
        const { read, limit = 50, skip = 0 } = options;

        const query = { userId };

        if (read !== undefined) {
            query.read = read;
        }

        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(skip)
                .lean(),
            Notification.countDocuments(query)
        ]);

        return {
            notifications,
            total,
            unread: read === false ? total : await Notification.countDocuments({ userId, read: false })
        };
    } catch (error) {
        throw error;
    }
};

/**
 * Get unread count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread count
 */
const getUnreadCount = async (userId) => {
    try {
        return await Notification.countDocuments({ userId, read: false });
    } catch (error) {
        throw error;
    }
};

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object>} - Updated notification
 */
const markAsRead = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOne({
            _id: notificationId,
            userId
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        notification.read = true;
        await notification.save();

        return notification;
    } catch (error) {
        throw error;
    }
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Update result
 */
const markAllAsRead = async (userId) => {
    try {
        const result = await Notification.updateMany(
            { userId, read: false },
            { $set: { read: true } }
        );

        return result;
    } catch (error) {
        throw error;
    }
};

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for security)
 * @returns {Promise<Object>} - Deletion result
 */
const deleteNotification = async (notificationId, userId) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        if (!notification) {
            throw new Error('Notification not found');
        }

        return { success: true };
    } catch (error) {
        throw error;
    }
};

/**
 * Create notification for candidate creation
 * @param {Object} candidate - Candidate object
 * @param {string} createdByUserId - User ID who created the candidate
 * @returns {Promise<Object>}
 */
const notifyCandidateCreated = async (candidate, createdByUserId) => {
    // Notify admin users about new candidate
    const User = require('../models/User');
    const adminUsers = await User.find({ role: 0 }).select('_id');

    const notifications = adminUsers.map(admin => ({
        userId: admin._id,
        title: 'Kandidat i ri u shtua',
        message: `${candidate.firstName} ${candidate.lastName} u shtua në sistem`,
        type: 'info',
        relatedEntity: 'candidate',
        relatedEntityId: candidate._id
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }

    // If candidate has an instructor, notify them
    if (candidate.instructorId) {
        const Instructor = require('../models/Instructor');
        const instructor = await Instructor.findById(candidate.instructorId).populate('user');
        if (instructor && instructor.user) {
            const userId = instructor.user._id || instructor.user;
            await createNotification({
                userId: userId,
                title: 'Kandidat i ri u caktua',
                message: `${candidate.firstName} ${candidate.lastName} u caktua për ju`,
                type: 'success',
                relatedEntity: 'candidate',
                relatedEntityId: candidate._id
            });
        }
    }
};

/**
 * Create notification for instructor creation
 * @param {Object} instructor - Instructor object with populated user
 * @param {string} createdByUserId - User ID who created the instructor
 * @returns {Promise<Object>}
 */
const notifyInstructorCreated = async (instructor, createdByUserId) => {
    // Notify admin users about new instructor
    const User = require('../models/User');
    const adminUsers = await User.find({ role: 0 }).select('_id');

    const instructorName = instructor.user 
        ? `${instructor.user.firstName} ${instructor.user.lastName}`
        : 'Instruktor i ri';

    const notifications = adminUsers.map(admin => ({
        userId: admin._id,
        title: 'Instruktor i ri u shtua',
        message: `${instructorName} u shtua si instruktor në sistem`,
        type: 'info',
        relatedEntity: 'instructor',
        relatedEntityId: instructor._id
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }
};

/**
 * Create notification for appointment creation
 * @param {Object} appointment - Appointment object
 * @returns {Promise<Object>}
 */
const notifyAppointmentCreated = async (appointment) => {
    const Candidate = require('../models/Candidate');
    const Instructor = require('../models/Instructor');

    // Notify instructor
    if (appointment.instructorId) {
        const instructor = await Instructor.findById(appointment.instructorId).populate('user');
        const candidate = await Candidate.findById(appointment.candidateId);
        
        if (instructor && instructor.user && candidate) {
            const userId = instructor.user._id || instructor.user;
            await createNotification({
                userId: userId,
                title: 'Takim i ri u programua',
                message: `Takim me ${candidate.firstName} ${candidate.lastName} u programua`,
                type: 'info',
                relatedEntity: 'appointment',
                relatedEntityId: appointment._id
            });
        }
    }
};

/**
 * Create notification for car creation
 * @param {Object} car - Car object
 * @returns {Promise<Object>}
 */
const notifyCarCreated = async (car) => {
    try {
        // Notify admin users about new car
        const User = require('../models/User');
        const adminUsers = await User.find({ role: 0 }).select('_id');

        if (adminUsers.length === 0) {
            return;
        }

        const notifications = adminUsers.map(admin => ({
            userId: admin._id,
            title: 'Makinë e re u shtua',
            message: `${car.model} (${car.licensePlate}) u shtua në sistem`,
            type: 'info',
            relatedEntity: 'car',
            relatedEntityId: car._id
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Create notification for package creation
 * @param {Object} pkg - Package object
 * @returns {Promise<Object>}
 */
const notifyPackageCreated = async (pkg) => {
    try {
        // Notify admin users about new package
        const User = require('../models/User');
        const adminUsers = await User.find({ role: 0 }).select('_id');

        if (adminUsers.length === 0) {
            return;
        }

        const notifications = adminUsers.map(admin => ({
            userId: admin._id,
            title: 'Paketë e re u shtua',
            message: `${pkg.name} (${pkg.category}) u shtua në sistem`,
            type: 'info',
            relatedEntity: 'package',
            relatedEntityId: pkg._id
        }));

        if (notifications.length > 0) {
            await Notification.insertMany(notifications);
        }
    } catch (error) {
        throw error;
    }
};

/**
 * Create notification for payment creation
 * @param {Object} payment - Payment object
 * @returns {Promise<Object>}
 */
const notifyPaymentCreated = async (payment) => {
    const Candidate = require('../models/Candidate');
    const User = require('../models/User');

    const candidate = await Candidate.findById(payment.candidateId);
    if (!candidate) return;

    // Notify admin users
    const adminUsers = await User.find({ role: 0 }).select('_id');
    const notifications = adminUsers.map(admin => ({
        userId: admin._id,
        title: 'Pagesë e re',
        message: `Pagesë prej ${payment.amount} ALL nga ${candidate.firstName} ${candidate.lastName}`,
        type: 'success',
        relatedEntity: 'payment',
        relatedEntityId: payment._id
    }));

    if (notifications.length > 0) {
        await Notification.insertMany(notifications);
    }
};

module.exports = {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    notifyCandidateCreated,
    notifyInstructorCreated,
    notifyCarCreated,
    notifyPackageCreated,
    notifyAppointmentCreated,
    notifyPaymentCreated
};

