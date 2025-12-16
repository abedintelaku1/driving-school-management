const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    uniqueClientNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
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
    address: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    packageId: {
        type: String,
        default: null
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        default: null
    },
    carId: {
        type: String,
        default: null
    },
    paymentFrequency: {
        type: String,
        enum: ['one-time', 'installments', 'deposit'],
        default: null
    },
    documents: [{
        id: String,
        name: String,
        type: String,
        uploadedAt: Date,
        approvedAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

CandidateSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Candidate', CandidateSchema);

