const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/package.controller');

const router = express.Router();

// All routes require authentication and admin authorization
router.use(authenticate, authorize(0)); // 0 = admin

router.get('/license-categories', controller.getLicenseCategories);
router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

