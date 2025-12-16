const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    uniqueClientNumber: {
        type: String,
        unique: true,
        sparse: true
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
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    phone: {
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
    packageId: {
        type: String,
        default: ''
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        default: null
    },
    carId: {
        type: String,
        default: ''
    },
    paymentFrequency: {
        type: String,
        enum: ['deposit', 'one-time', 'installments'],
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    documents: {
        type: [{
            name: String,
            status: {
                type: String,
                enum: ['pending', 'submitted', 'approved', 'rejected'],
                default: 'pending'
            },
            submittedAt: Date,
            approvedAt: Date,
            notes: String
        }],
        default: []
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

// Generate unique client number before saving
CandidateSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Generate unique client number if not provided
    if (!this.uniqueClientNumber) {
        const count = await mongoose.model('Candidate').countDocuments();
        this.uniqueClientNumber = `CLI-${String(count + 1).padStart(6, '0')}`;
    }
    
    next();
});

module.exports = mongoose.model('Candidate', CandidateSchema);

