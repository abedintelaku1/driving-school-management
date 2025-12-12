const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    dateOfBirth: { type: String },
    personalNumber: { type: String },
    address: { type: String },
    packageId: { type: String },
    carId: { type: String },
    paymentFrequency: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

CandidateSchema.pre('save', function updateTimestamp(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Candidate', CandidateSchema);

