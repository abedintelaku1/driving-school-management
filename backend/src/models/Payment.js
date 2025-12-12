const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    amount: { type: Number, required: true },
    method: { type: String, enum: ['bank', 'cash'], default: 'cash' },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);



