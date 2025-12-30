const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/payment.controller");

const router = express.Router();

// All payment routes require authentication and admin role
router.use(authenticate, authorize(0)); // 0 = admin

router.get("/", controller.list);
router.get("/candidate/:candidateId", controller.getByCandidate);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
