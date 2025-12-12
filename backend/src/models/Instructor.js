const mongoose = require('mongoose');

const InstructorSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    phone: { type: String },
    dateOfBirth: { type: String },
    personalNumber: { type: String },
    address: { type: String },
    experienceYears: { type: Number, default: 0 },
    specialties: [{ type: String }], // categories
    assignedCarIds: [{ type: String }], // store car ids or license plates
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    totalHours: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Instructor', InstructorSchema);

