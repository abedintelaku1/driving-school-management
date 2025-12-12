const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'Instructor', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    notes: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', ReportSchema);



