const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/candidate.controller");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET routes: allow both admin and instructor (instructors see only their assigned candidates)
router.get("/", controller.list);
router.get("/:id", controller.getById);

// Write operations: admin only
router.post("/", authorize(0), controller.create);
router.put("/:id", authorize(0), controller.update);
router.delete("/:id", authorize(0), controller.remove);

module.exports = router;
