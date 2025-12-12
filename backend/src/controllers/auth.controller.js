const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Instructor = require('../models/Instructor');

const signToken = (user) => {
    const payload = { id: user._id, role: user.role };
    return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
};

// Allow first user creation even without auth; afterwards only admins should create via /users
const register = async (req, res, next) => {
    try {
        const { firstName, lastName, email = '', password, role } = req.body;
        
        if (!firstName || !lastName || !email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        
        if (!['admin', 'instructor'].includes(role)) {
            return res.status(400).json({ message: 'Role must be admin or instructor' });
        }
        
        const userCount = await User.countDocuments();
        
        // Allow first user (no auth required)
        // After first user, only admins can create users
        if (userCount > 0) {
            if (!req.user || req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Only admin can create new users' });
            }
        }
        
        const user = await User.create({ firstName, lastName, email: normalizedEmail, password, role });
        if (role === 'instructor') {
            await Instructor.create({ user: user._id });
        }
        const token = signToken(user);
        res.status(201).json({ 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName
            }, 
            token 
        });
    } catch (err) {
        console.error('Register error:', err);
        next(err);
    }
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
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            console.log('Login failed: User not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        
        console.log('User found:', { id: user._id, email: user.email, role: user.role });
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
        const token = signToken(user);
        res.json({
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role, 
                firstName: user.firstName, 
                lastName: user.lastName 
            },
            token
        });
    } catch (err) {
        console.error('Login error:', err);
        next(err);
    }
};

const me = async (req, res) => {
    const user = req.user;
    res.json({
        user: { id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName }
    });
};

// Debug endpoint - remove in production
const checkUser = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select('email role password');
        if (!user) {
            return res.status(404).json({ message: 'User not found', email: normalizedEmail });
        }
        res.json({
            found: true,
            email: user.email,
            role: user.role,
            passwordLength: user.password.length,
            passwordStartsWith: user.password.substring(0, 10),
            isHashed: user.password.startsWith('$2a$') || user.password.startsWith('$2b$')
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    register,
    login,
    me,
    checkUser
};
