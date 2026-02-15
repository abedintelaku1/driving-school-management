const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
    const payload = { id: user._id, role: user.role }; // role is now 0 or 1
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
};

const login = async (req, res, next) => {
    try {
        console.log('=== LOGIN REQUEST ===');
        console.log('Full request body:', JSON.stringify(req.body, null, 2));
        console.log('Request headers:', req.headers['content-type']);
        console.log('Email from body:', req.body.email);
        console.log('Password from body:', req.body.password ? '***' : 'MISSING');
        
        const { email = '', password } = req.body;
        
        if (!email || !password) {
            console.log('Login failed: Missing email or password');
            return res.status(400).json({ message: 'Email and password are required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        console.log('Looking for user with email:', normalizedEmail);
        
        // Get user with Mongoose model (for methods like comparePassword)
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const storedPassword = user.password;
        if (!storedPassword || typeof storedPassword !== 'string') {
            console.error('User has no password set:', user._id);
            return res.status(500).json({ message: 'Account configuration error. Contact support.' });
        }
        
        // Get raw document to see actual role value in DB (before Mongoose casting)
        const userRaw = await User.findOne({ email: normalizedEmail }).lean();
        const rawRole = userRaw?.role;
        
        console.log('User found:', { id: user._id, email: user.email });
        console.log('Role from Mongoose model:', user.role, 'Type:', typeof user.role);
        console.log('Role from raw DB document:', rawRole, 'Type:', typeof rawRole);
        
        // Check if password is hashed or plain text
        const isHashed = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$');
        let valid = false;
        
        try {
            if (isHashed) {
                valid = await user.comparePassword(password);
                console.log('Using bcrypt comparison, result:', valid);
            } else {
                valid = storedPassword === password;
                console.log('Using plain text comparison, result:', valid);
            }
        } catch (compareErr) {
            console.error('Password comparison error:', compareErr);
            return res.status(500).json({ message: 'Login failed. Please try again.' });
        }
        
        if (!valid) {
            console.log('Login failed: Invalid password');
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        console.log('Login successful for user:', user.email);
        
        // Use raw role from database (before Mongoose casting) for accurate conversion
        const roleToConvert = rawRole !== undefined ? rawRole : user.role;
        console.log('Role to convert:', roleToConvert, 'Type:', typeof roleToConvert);
        
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
                console.error('⚠️ Unknown role string:', roleToConvert);
                roleNum = 0; // Default to admin
            }
            console.log('Converted role from string to number:', roleNum);
        } else if (typeof roleToConvert === 'number') {
            // Already a number, just ensure it's 0, 1 or 2
            if (roleToConvert !== 0 && roleToConvert !== 1 && roleToConvert !== 2) {
                console.error('⚠️ Invalid role number:', roleToConvert, 'Defaulting to 0 (admin)');
                roleNum = 0;
            }
        } else {
            console.error('⚠️ Invalid role type:', typeof roleToConvert, 'Value:', roleToConvert, 'Defaulting to 0 (admin)');
            roleNum = 0;
        }
        
        console.log('Final role being sent:', roleNum);
        
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
        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (err) {
        console.error('Login error:', err);
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
