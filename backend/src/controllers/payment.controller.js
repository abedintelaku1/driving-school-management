const Payment = require("../models/Payment");
const Candidate = require("../models/Candidate");

const list = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate("candidateId", "firstName lastName uniqueClientNumber email")
      // packageId populate removed - packages are mock for now
      .sort({ date: -1, createdAt: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate(
      "candidateId",
      "firstName lastName uniqueClientNumber email"
    );
    // packageId populate removed - packages are mock for now
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json(payment);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { candidateId, amount, method, date, packageId, notes } = req.body;

    // Validate required fields
    if (!candidateId || !amount || !method || !date) {
      return res
        .status(400)
        .json({ message: "Candidate, amount, method, and date are required" });
    }

    // Validate amount
    if (typeof amount !== "number" || amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be a positive number" });
    }

    // Validate method
    if (!["bank", "cash"].includes(method)) {
      return res
        .status(400)
        .json({ message: 'Payment method must be "bank" or "cash"' });
    }

    // Validate candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Package validation removed - packages are handled by another team member
    // packageId will be stored as-is if provided, but not validated

    // Validate date
    const paymentDate = new Date(date);
    if (isNaN(paymentDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    // Create payment
    const payment = await Payment.create({
      candidateId,
      amount,
      method,
      date: paymentDate,
      packageId: packageId || null,
      notes: notes || "",
    });

    // Populate and return (packageId populate removed - packages are mock for now)
    const populated = await Payment.findById(payment._id).populate(
      "candidateId",
      "firstName lastName uniqueClientNumber email"
    );

    // Send payment confirmation email (async, don't wait for it)
    const emailService = require('../services/email.service');
    const notificationService = require('../services/notification.service');
    
    if (populated.candidateId && populated.candidateId.email) {
      emailService.sendPaymentConfirmation(populated, populated.candidateId).catch(err => {
        console.error('Error sending payment confirmation email:', err);
      });
    }
    
    // Create notifications (async, don't wait for it)
    notificationService.notifyPaymentCreated(populated).catch(err => {
      console.error('Error creating payment notifications:', err);
    });

    res.status(201).json(populated);
  } catch (err) {
    console.error("Error creating payment:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid candidate ID" });
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { amount, method, date, packageId, notes } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update fields if provided
    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a positive number" });
      }
      payment.amount = amount;
    }

    if (method !== undefined) {
      if (!["bank", "cash"].includes(method)) {
        return res
          .status(400)
          .json({ message: 'Payment method must be "bank" or "cash"' });
      }
      payment.method = method;
    }

    if (date !== undefined) {
      const paymentDate = new Date(date);
      if (isNaN(paymentDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      payment.date = paymentDate;
    }

    if (packageId !== undefined) {
      // Package validation removed - packages are handled by another team member
      // packageId will be stored as-is if provided, but not validated
      payment.packageId = packageId || null;
    }

    if (notes !== undefined) {
      payment.notes = notes || "";
    }

    await payment.save();

    // Populate and return (packageId populate removed - packages are mock for now)
    const populated = await Payment.findById(payment._id).populate(
      "candidateId",
      "firstName lastName uniqueClientNumber email"
    );

    res.json(populated);
  } catch (err) {
    console.error("Error updating payment:", err);
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: "Payment deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Get payments by candidate
const getByCandidate = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const payments = await Payment.find({ candidateId })
      // packageId populate removed - packages are mock for now
      .sort({ date: -1 });
    res.json(payments);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  getByCandidate,
};
