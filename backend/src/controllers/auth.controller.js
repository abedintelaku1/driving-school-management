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
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        // Get raw document to see actual role value in DB (before Mongoose casting)
        const userRaw = await User.findOne({ email: normalizedEmail }).lean();
        const rawRole = userRaw?.role;
        
        console.log('User found:', { id: user._id, email: user.email });
        console.log('Role from Mongoose model:', user.role, 'Type:', typeof user.role);
        console.log('Role from raw DB document:', rawRole, 'Type:', typeof rawRole);
        console.log('Password in DB (full):', user.password);
        console.log('Password in DB length:', user.password.length);
        console.log('Password is hashed:', user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));
        console.log('Password from request:', password);
        console.log('Password from request length:', password.length);
        
        // Check if password is hashed or plain text
        const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        let valid = false;
        
        if (isHashed) {
            // Use bcrypt comparison
            valid = await user.comparePassword(password);
            console.log('Using bcrypt comparison, result:', valid);
        } else {
            // Plain text comparison
            valid = user.password === password;
            console.log('Using plain text comparison, result:', valid);
            console.log('DB password === Request password?', user.password === password);
        }
        
        if (!valid) {
            console.log('Login failed: Invalid password');
            return res.status(400).json({ message: 'Invalid credentials' });
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
            } else {
                console.error('⚠️ Unknown role string:', roleToConvert);
                roleNum = 0; // Default to admin
            }
            console.log('Converted role from string to number:', roleNum);
        } else if (typeof roleToConvert === 'number') {
            // Already a number, just ensure it's 0 or 1
            if (roleToConvert !== 0 && roleToConvert !== 1) {
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
                role: roleNum, // 0 or 1
                firstName: user.firstName, 
                lastName: user.lastName 
            },
            token
        };
        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (err) {
        console.error('Login error:', err);
        next(err);
    }
};

const me = async (req, res) => {
    const user = req.user;
    
    // Convert role to number if it's a string (for backward compatibility)
    let roleNum = user.role;
    if (typeof user.role === 'string') {
        roleNum = user.role === 'admin' ? 0 : user.role === 'instructor' ? 1 : user.role;
    }
    
    res.json({
        user: { 
            id: user._id.toString(), 
            email: user.email, 
            role: roleNum, // 0 or 1
            firstName: user.firstName, 
            lastName: user.lastName 
        }
    });
};

module.exports = {
    login,
    me
};
