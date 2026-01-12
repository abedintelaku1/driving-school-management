const mongoose = require("mongoose");

const AppointmentSchema = new mongoose.Schema({
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Instructor",
    required: true,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true,
  },
  carId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Car",
    required: false, // Optional - can be assigned later by admin
    default: null,
  },
  date: {
    type: Date,
    required: true,
  },
  startTime: {
    type: String,
    required: true,
    trim: true,
    // Format: "HH:MM" (e.g., "09:00", "14:30")
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Please provide a valid time in HH:MM format",
    ],
  },
  endTime: {
    type: String,
    required: true,
    trim: true,
    match: [
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Please provide a valid time in HH:MM format",
    ],
  },
  hours: {
    type: Number,
    required: true,
    min: 0,
    max: 24, // Reasonable max for a single appointment
  },
  notes: {
    type: String,
    trim: true,
    default: "",
  },
  status: {
    type: String,
    enum: ["scheduled", "completed", "cancelled"],
    default: "scheduled",
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

// Auto-update updatedAt timestamp
AppointmentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate hours automatically from startTime and endTime if not provided
// Note: 1 lesson hour = 45 minutes
AppointmentSchema.pre("save", function (next) {
  if (this.startTime && this.endTime && (!this.hours || this.hours === 0)) {
    const parseTime = (timeString) => {
      const [hours, minutes] = timeString.split(":").map(Number);
      if (isNaN(hours) || isNaN(minutes)) return null;
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    };

    const start = parseTime(this.startTime);
    const end = parseTime(this.endTime);
    if (start && end) {
      let diffMs = end - start;
      // Handle case where end time is next day (e.g., 23:00 to 01:00)
      if (diffMs < 0) {
        diffMs = 24 * 60 * 60 * 1000 + diffMs;
      }
      // Convert to lesson hours (45 minutes = 1 hour)
      const calculatedHours = diffMs / (45 * 60 * 1000);
      this.hours = Math.round(calculatedHours * 100) / 100; // Round to 2 decimal places
    }
  }
  next();
});

// Indexes for faster queries
AppointmentSchema.index({ instructorId: 1, date: -1 });
AppointmentSchema.index({ candidateId: 1, date: -1 });
AppointmentSchema.index({ date: -1, startTime: 1 });
AppointmentSchema.index({ status: 1 });

module.exports = mongoose.model("Appointment", AppointmentSchema);
