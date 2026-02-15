const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/payment.controller");

const router = express.Router();

// All payment routes require authentication
router.use(authenticate);

// List, get by candidate, get by id: Admin (0) or Staff (2)
router.get("/", authorize(0, 2), controller.list);
router.get("/candidate/:candidateId", authorize(0, 2), controller.getByCandidate);
router.get("/:id", authorize(0, 2), controller.getById);

// Create payment: Admin (0) or Staff (2)
router.post("/", authorize(0, 2), controller.create);

// Update and delete: Admin (0) only – Staff cannot edit or delete payments
router.put("/:id", authorize(0), controller.update);
router.delete("/:id", authorize(0), controller.remove);

module.exports = router;
