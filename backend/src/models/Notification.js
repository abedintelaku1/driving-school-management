const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['info', 'success', 'warning', 'error'],
        default: 'info'
    },
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    relatedEntity: {
        type: String,
        enum: ['candidate', 'appointment', 'payment', 'instructor', 'car', 'package', 'system'],
        default: 'system'
    },
    relatedEntityId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Index for efficient queries
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

