const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/car.controller");

const router = express.Router();

// Instructor-specific route (must be before /:id route)
router.get("/me", authenticate, authorize(1), controller.getMyCars);

// All other routes require authentication
router.use(authenticate);

// Admin-only routes
router.get("/", authorize(0), controller.list);
router.get("/:id", authorize(0), controller.getById);
router.post("/", authorize(0), controller.create);
router.put("/:id", authorize(0), controller.update);
router.delete("/:id", authorize(0), controller.remove);

module.exports = router;
