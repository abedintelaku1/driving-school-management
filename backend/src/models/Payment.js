const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  method: {
    type: String,
    enum: ["bank", "cash"],
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  packageId: {
    type: String, // Changed from ObjectId to String
    default: null,
    // Removed ref: "Package" since packages are mock data
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
PaymentSchema.index({ candidateId: 1, date: -1 });
PaymentSchema.index({ date: -1 });

module.exports = mongoose.model("Payment", PaymentSchema);
