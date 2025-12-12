const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/appointment.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'instructor'), controller.list);
router.get('/:id', authorize('admin', 'instructor'), controller.getById);
router.post('/', authorize('admin', 'instructor'), controller.create);
router.put('/:id', authorize('admin', 'instructor'), controller.update);
router.delete('/:id', authorize('admin', 'instructor'), controller.remove);

module.exports = router;



