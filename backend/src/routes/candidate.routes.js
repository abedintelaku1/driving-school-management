const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const controller = require('../controllers/candidate.controller');

const router = express.Router();

router.use(authenticate, authorize(0)); // 0 = admin

router.get('/', controller.list);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

