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
        const normalizedEmail = email.toLowerCase().trim();
        if (!['admin', 'instructor'].includes(role)) {
            return res.status(400).json({ message: 'Role must be admin or instructor' });
        }
        const existing = await User.findOne({ email: normalizedEmail });
        if (existing) return res.status(400).json({ message: 'Email already in use' });
        const user = await User.create({ firstName, lastName, email: normalizedEmail, password, role });
        if (role === 'instructor') {
            await Instructor.create({
                user: user._id,
                phone,
                address,
                dateOfBirth,
                personalNumber,
                specialties: categories,
                assignedCarIds
            });
        }
        res.status(201).json({ id: user._id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName });
    } catch (err) {
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
        if (user.role === 'instructor') {
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

