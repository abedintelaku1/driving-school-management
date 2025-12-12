const mongoose = require('mongoose');

const CarSchema = new mongoose.Schema({
    model: { type: String, required: true },
    licensePlate: { type: String, required: true, unique: true },
    transmission: { type: String }, // manual | automatic
    fuelType: { type: String }, // petrol | diesel | electric | hybrid
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    // Extended fields to support admin UI
    yearOfManufacture: { type: Number },
    chassisNumber: { type: String },
    ownership: { type: String }, // owned | leased | rented
    registrationExpiry: { type: String },
    lastInspection: { type: String },
    nextInspection: { type: String },
    totalHours: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Car', CarSchema);



