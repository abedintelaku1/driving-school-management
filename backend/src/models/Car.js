const mongoose = require("mongoose");

const CarSchema = new mongoose.Schema({
  model: {
    type: String,
    required: true,
    trim: true,
  },
  yearOfManufacture: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1,
  },
  chassisNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  transmission: {
    type: String,
    enum: ["manual", "automatic"],
    required: true,
  },
  fuelType: {
    type: String,
    enum: ["petrol", "diesel", "electric", "hybrid"],
    required: true,
  },
  licensePlate: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true,
  },
  ownership: {
    type: String,
    enum: ["owned", "leased", "rented"],
    required: true,
  },
  registrationExpiry: {
    type: Date,
    required: true,
  },
  lastInspection: {
    type: Date,
    required: true,
  },
  nextInspection: {
    type: Date,
    required: true,
  },
  totalHours: {
    type: Number,
    default: 0,
    min: 0,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

CarSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Car", CarSchema);
