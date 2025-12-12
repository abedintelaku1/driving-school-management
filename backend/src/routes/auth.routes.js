const express = require('express');
const { register, login, me, checkUser } = require('../controllers/auth.controller');
const { authenticate, authenticateOptional } = require('../middleware/auth');

const router = express.Router();

router.post('/register', authenticateOptional, register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/check-user', checkUser); // Debug endpoint

module.exports = router;
