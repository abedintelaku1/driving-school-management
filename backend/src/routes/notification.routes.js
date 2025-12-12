const express = require('express');
const { authenticate } = require('../middleware/auth');
const controller = require('../controllers/notification.controller');

const router = express.Router();

router.get('/', authenticate, controller.list);

module.exports = router;

