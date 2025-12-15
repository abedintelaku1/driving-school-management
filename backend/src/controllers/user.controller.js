const User = require('../models/User');
const Instructor = require('../models/Instructor');

const list = async (_req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { firstName, lastName, email = '', password, role, phone, categories = [], assignedCarIds = [], address, dateOfBirth, personalNumber } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !password || role === undefined) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        
        // Convert role to number if string is provided
        let roleNum = role;
        if (typeof role === 'string') {
            roleNum = role === 'admin' ? 0 : role === 'instructor' ? 1 : null;
        }
        if (roleNum !== 0 && roleNum !== 1) {
            return res.status(400).json({ message: 'Role must be 0 (admin) or 1 (instructor)' });
        }
        
        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        const normalizedEmail = email.toLowerCase().trim();
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }
        
        // Validate instructor fields if role is instructor
        if (roleNum === 1) {
            if (!phone || !phone.trim()) {
                return res.status(400).json({ message: 'Phone is required for instructors' });
            }
            if (!address || !address.trim()) {
                return res.status(400).json({ message: 'Address is required for instructors' });
            }
            if (!dateOfBirth) {
                return res.status(400).json({ message: 'Date of birth is required for instructors' });
            }
            if (!personalNumber || !personalNumber.trim()) {
                return res.status(400).json({ message: 'Personal number is required for instructors' });
            }
        }
        
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) return res.status(400).json({ message: 'Email already in use' });
        
        const user = await User.create({ firstName, lastName, email: normalizedEmail, password, role: roleNum });
        
        if (roleNum === 1) { // 1 = instructor
            await Instructor.create({
                user: user._id,
                phone,
                address,
                dateOfBirth: new Date(dateOfBirth),
                personalNumber,
                specialties: categories || [],
                assignedCarIds: assignedCarIds || []
            });
        }
        
        res.status(201).json({ 
            id: user._id, 
            email: user.email, 
            role: user.role, 
            firstName: user.firstName, 
            lastName: user.lastName 
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const updates = { ...req.body };
        delete updates.password; // password change should be separate
        const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.role === 1) { // 1 = instructor
            await Instructor.deleteMany({ user: user._id });
        }
        res.json({ message: 'User deleted' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    list,
    getById,
    create,
    update,
    remove
};

