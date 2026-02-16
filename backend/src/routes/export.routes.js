const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const controller = require("../controllers/export.controller");

const router = express.Router();

// All routes require authentication and admin/staff access
router.use(authenticate);
const requireAdminOrStaff = authorize(0, 2);
router.use(requireAdminOrStaff);

// Export candidate report
router.get("/candidate", controller.exportCandidateReport);

// Export instructor report
router.get("/instructor", controller.exportInstructorReport);

module.exports = router;

