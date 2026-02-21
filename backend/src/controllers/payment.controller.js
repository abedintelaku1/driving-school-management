const Payment = require("../models/Payment");
const Candidate = require("../models/Candidate");

const list = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate("candidateId", "firstName lastName uniqueClientNumber")
      .populate("addedBy", "firstName lastName")
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.json(payments);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate("candidateId", "firstName lastName uniqueClientNumber")
      .populate("addedBy", "firstName lastName");
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }
    res.json(payment);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
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

    // Create payment (who added it = current user)
    const payment = await Payment.create({
      candidateId,
      amount,
      method,
      date: paymentDate,
      packageId: packageId || null,
      notes: notes || "",
      addedBy: req.user._id,
    });

    // Populate with email for email service (internal use)
    const populatedForEmail = await Payment.findById(payment._id)
      .populate("candidateId", "firstName lastName uniqueClientNumber email")
      .populate("addedBy", "firstName lastName email");

    // Send payment confirmation email (async, don't wait for it)
    const emailService = require("../services/email.service");
    const notificationService = require("../services/notification.service");

    if (populatedForEmail.candidateId && populatedForEmail.candidateId.email) {
      emailService
        .sendPaymentConfirmation(populatedForEmail, populatedForEmail.candidateId)
        .catch(() => {
          // Silently handle email errors
        });
    }

    // Create notifications (async, don't wait for it)
    notificationService.notifyPaymentCreated(populatedForEmail).catch(() => {
      // Silently handle notification errors
    });

    // Return response without email
    const populated = await Payment.findById(payment._id)
      .populate("candidateId", "firstName lastName uniqueClientNumber")
      .populate("addedBy", "firstName lastName");

    res.status(201).json(populated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid candidate ID" });
    }
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { amount, method, date, packageId, notes, candidateId } = req.body;

    // Prevent changing candidateId - payment should always belong to the same candidate
    if (candidateId !== undefined) {
      return res.status(400).json({
        message: "Cannot change the candidate associated with a payment",
      });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update fields if provided (do not allow reducing the amount)
    if (amount !== undefined) {
      if (typeof amount !== "number" || amount <= 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a positive number" });
      }
      if (amount < payment.amount) {
        return res
          .status(400)
          .json({ message: "Nuk lejohet zvogëlimi i shumës së pagesës" });
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

    const populated = await Payment.findById(payment._id)
      .populate("candidateId", "firstName lastName uniqueClientNumber")
      .populate("addedBy", "firstName lastName");

    res.json(populated);
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: "Të dhënat e dërguara nuk janë të vlefshme",
      });
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
    res.json({
      message: "Payment deleted successfully",
      deletedPayment: {
        id: payment._id,
        amount: payment.amount,
        date: payment.date,
      },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    next(err);
  }
};

// Get payments by candidate
const getByCandidate = async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const payments = await Payment.find({ candidateId })
      .populate("addedBy", "firstName lastName")
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
