const Instructor = require('../models/Instructor');
const User = require('../models/User');

const list = async (_req, res, next) => {
    try {
        const instructors = await Instructor.find()
            .populate('user', 'firstName lastName email role');
        res.json(instructors);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const instructor = await Instructor.findById(req.params.id).populate('user', 'firstName lastName email role');
        if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
        res.json(instructor);
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const updateData = {
            phone: req.body.phone,
            address: req.body.address,
            dateOfBirth: req.body.dateOfBirth,
            personalNumber: req.body.personalNumber,
            specialties: req.body.categories || req.body.specialties,
            assignedCarIds: req.body.assignedCarIds,
            status: req.body.status
        };
        const instructor = await Instructor.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('user', 'firstName lastName email role');
        if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
        res.json(instructor);
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) return res.status(404).json({ message: 'Instructor not found' });
        await User.findByIdAndDelete(instructor.user);
        await Instructor.findByIdAndDelete(req.params.id);
        res.json({ message: 'Instructor deleted' });
    } catch (err) {
        next(err);
    }
};

const getMe = async (req, res, next) => {
    try {
        const instructor = await Instructor.findOne({ user: req.user._id })
            .populate('user', 'firstName lastName email role');
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor profile not found' });
        }
        res.json(instructor);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    list,
    getById,
    update,
    remove,
    getMe
};

