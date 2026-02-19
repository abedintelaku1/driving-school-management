const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const controller = require("../controllers/document.controller");

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload document - Admin and Staff can upload
router.post(
    "/candidate/:candidateId/upload",
    authorize(0, 2), // Admin (0) and Staff (2)
    (req, res, next) => {
        upload.single("file")(req, res, (err) => {
            if (err) {
                // Handle multer errors
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        message: 'Skedari është shumë i madh. Maksimumi është 10MB'
                    });
                }
                if (err.message && err.message.includes('File type not allowed')) {
                    return res.status(400).json({
                        message: err.message
                    });
                }
                return next(err);
            }
            next();
        });
    },
    controller.uploadDocument
);

// Get all documents for a candidate - Admin and Staff can view
router.get(
    "/candidate/:candidateId",
    authorize(0, 2),
    controller.getDocuments
);

// Get a specific document - Admin and Staff can view
router.get(
    "/candidate/:candidateId/:documentId",
    authorize(0, 2),
    controller.getDocument
);

// Download a document file - Admin and Staff can download
router.get(
    "/candidate/:candidateId/:documentId/download",
    authorize(0, 2),
    controller.downloadDocument
);

// Delete a document - Admin only
router.delete(
    "/candidate/:candidateId/:documentId",
    authorize(0),
    controller.deleteDocument
);

// Update a document - Admin only
router.put(
    "/candidate/:candidateId/:documentId",
    authorize(0),
    controller.updateDocument
);

module.exports = router;

