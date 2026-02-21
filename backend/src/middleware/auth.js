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
        const user = await User.findById(payload.id).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        // If token has role as number, use it; otherwise use role from DB
        // This ensures backward compatibility
        if (payload.role !== undefined && (payload.role === 0 || payload.role === 1 || payload.role === 2)) {
            user.role = payload.role; // Override with role from token (already converted to number)
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
            const user = await User.findById(payload.id).select('-password');
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
// roles can be numbers (0, 1) or strings ('admin', 'instructor') for backward compatibility
const authorize = (...roles) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Convert user role to number if it's a string (for backward compatibility)
    let userRole = req.user.role;
    if (typeof req.user.role === 'string') {
        const roleLower = req.user.role.toLowerCase().trim();
        userRole = roleLower === 'admin' ? 0 : roleLower === 'instructor' ? 1 : roleLower === 'staff' ? 2 : req.user.role;
    }
    
    // Convert allowed roles to numbers for comparison
    const allowedRoles = roles.map(r => {
        if (typeof r === 'string') {
            return r === 'admin' ? 0 : r === 'instructor' ? 1 : r === 'staff' ? 2 : null;
        }
        return r;
    });
    
    if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
};

module.exports = {
    authenticate,
    authenticateOptional,
    authorize
};
