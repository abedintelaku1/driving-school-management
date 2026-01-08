const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/appointment.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Instructor route to get their own appointments (must be before /:id)
router.get('/instructor/:instructorId', authorize(1), controller.getByInstructor);

// Admin-only routes
router.get('/', authorize(0), controller.list); // 0 = admin
router.get('/candidate/:candidateId', authorize(0), controller.getByCandidate);

// Routes accessible to both admin and instructor
router.get('/:id', controller.getById);
router.post('/', controller.create); // Both admin and instructor can create
router.put('/:id', controller.update); // Both admin and instructor can update
router.delete('/:id', authorize(0), controller.remove); // Only admin can delete

module.exports = router;

