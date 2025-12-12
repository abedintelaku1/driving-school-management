const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/car.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'instructor'), controller.list);
router.get('/:id', authorize('admin', 'instructor'), controller.getById);
router.post('/', authorize('admin'), controller.create);
router.put('/:id', authorize('admin'), controller.update);
router.delete('/:id', authorize('admin'), controller.remove);

module.exports = router;


