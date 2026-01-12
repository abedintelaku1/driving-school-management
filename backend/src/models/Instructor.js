const mongoose = require('mongoose');

const InstructorSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    personalNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    specialties: {
        type: [String],
        default: []
    },
    assignedCarIds: {
        type: [String], // Store as strings, frontend will use mock data for car details
        default: []
    },
    personalCarIds: {
        type: [String], // Personal cars owned by this instructor
        default: []
    },
    totalHours: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

InstructorSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Instructor', InstructorSchema);
