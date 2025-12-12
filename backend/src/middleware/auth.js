const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Require a valid JWT and attach user to request
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }
        const token = authHeader.split(' ')[1];
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
        const user = await User.findById(payload.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Attach user if token is present, but do not error if missing/invalid
const authenticateOptional = async (req, _res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
            const user = await User.findById(payload.id);
            if (user) {
                req.user = user;
            }
        }
    } catch (err) {
        // ignore invalid token for optional auth
    } finally {
        next();
    }
};

// Ensure user role matches any of allowed roles
const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    next();
};

module.exports = {
    authenticate,
    authenticateOptional,
    authorize
};
