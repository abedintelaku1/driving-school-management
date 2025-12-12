const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/instructor.controller');

const router = express.Router();

// Allow instructors to get their own profile
router.get('/me', authenticate, controller.getMe);

// Admin-only routes
router.use(authenticate, authorize('admin'));

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;



