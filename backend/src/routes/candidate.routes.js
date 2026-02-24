const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { candidateDocumentUpload } = require("../middleware/upload");
const controller = require("../controllers/candidate.controller");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET routes: admin, staff, or instructor (instructors see only their assigned candidates)
router.get("/", controller.list);
router.get("/:id", controller.getById);

// Document routes (must be before generic :id write routes so /:id/documents matches)
router.get("/:id/documents/:docId/file", authorize(0, 2), controller.getDocumentFile);
router.post("/:id/documents", authorize(0, 2), candidateDocumentUpload.single("file"), controller.addDocument);
router.put("/:id/documents/:docId", authorize(0), controller.updateDocument);
router.delete("/:id/documents/:docId", authorize(0), controller.deleteDocument);

// Write operations: admin only
router.post("/", authorize(0), controller.create);
router.put("/:id", authorize(0), controller.update);
router.delete("/:id", authorize(0), controller.remove);

module.exports = router;
