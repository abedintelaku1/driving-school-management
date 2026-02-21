const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
    const payload = { id: user._id, role: user.role }; // role is now 0 or 1
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
};

const login = async (req, res, next) => {
    try {
        const { email = '', password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Get user with Mongoose model (for methods like comparePassword)
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const storedPassword = user.password;
        if (!storedPassword || typeof storedPassword !== 'string') {
            return res.status(500).json({ message: 'Account configuration error. Contact support.' });
        }
        
        // Get raw document to see actual role value in DB (before Mongoose casting)
        const userRaw = await User.findOne({ email: normalizedEmail }).lean();
        const rawRole = userRaw?.role;
        
        // Check if password is hashed or plain text
        const isHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$');
        let valid = false;
        
        try {
            if (isHashed) {
                valid = await user.comparePassword(password);
            } else {
                valid = storedPassword === password;
            }
        } catch (compareErr) {
            return res.status(500).json({ message: 'Login failed. Please try again.' });
        }
        
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Use raw role from database (before Mongoose casting) for accurate conversion
        const roleToConvert = rawRole !== undefined ? rawRole : user.role;
        
        // Convert role to number if it's a string (for backward compatibility)
        let roleNum = roleToConvert;
        if (typeof roleToConvert === 'string') {
            const roleLower = roleToConvert.toLowerCase().trim();
            if (roleLower === 'admin') {
                roleNum = 0;
            } else if (roleLower === 'instructor') {
                roleNum = 1;
            } else if (roleLower === 'staff') {
                roleNum = 2;
            } else {
                roleNum = 0; // Default to admin
            }
        } else if (typeof roleToConvert === 'number') {
            // Already a number, just ensure it's 0, 1 or 2
            if (roleToConvert !== 0 && roleToConvert !== 1 && roleToConvert !== 2) {
                roleNum = 0;
            }
        } else {
            roleNum = 0;
        }
        
        // Create a user object with converted role for token signing
        const userForToken = {
            _id: user._id,
            role: roleNum // Use converted role number
        };
        const token = signToken(userForToken);
        const response = {
            user: { 
                id: user._id.toString(), 
                email: user.email, 
                role: roleNum, // 0 = Admin, 1 = Instructor, 2 = Staff
                firstName: user.firstName, 
                lastName: user.lastName 
            },
            token
        };
        res.json(response);
    } catch (err) {
        // Return 500 with generic message so frontend doesn't see stack/details
        return res.status(500).json({ message: 'Login failed. Please try again.' });
    }
};

const me = async (req, res) => {
    const user = req.user;
    
    // Convert role to number if it's a string (for backward compatibility)
    let roleNum = user.role;
    if (typeof user.role === 'string') {
        roleNum = user.role === 'admin' ? 0 : user.role === 'instructor' ? 1 : user.role === 'staff' ? 2 : user.role;
    }
    
    res.json({
        user: { 
            id: user._id.toString(), 
            email: user.email, 
            role: roleNum, // 0 = Admin, 1 = Instructor, 2 = Staff
            firstName: user.firstName, 
            lastName: user.lastName 
        }
    });
};

module.exports = {
    login,
    me
};
