const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/instructor.controller');

const router = express.Router();

// Public route for instructor to get their own profile
router.get('/me', authenticate, authorize(1), controller.getMe);

// Instructor profile routes (instructor can access their own profile)
router.get('/profile', authenticate, authorize(1), controller.getProfile);
router.put('/profile', authenticate, authorize(1), controller.updateProfile);
router.put('/change-password', authenticate, authorize(1), controller.changePassword);

// Admin-only routes
router.use(authenticate, authorize(0)); // 0 = admin

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

