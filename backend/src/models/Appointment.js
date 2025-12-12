const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    date: { type: String, required: true }, // ISO date string (YYYY-MM-DD)
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true },
    hours: { type: Number },
    topic: { type: String },
    notes: { type: String },
    status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

AppointmentSchema.pre('save', function updateTimestamp(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Appointment', AppointmentSchema);


