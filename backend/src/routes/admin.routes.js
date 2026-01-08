const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/admin.controller");

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, authorize(0));

router.get("/profile", controller.getProfile);
router.put("/profile", controller.updateProfile);
router.put("/change-password", controller.changePassword);

module.exports = router;
