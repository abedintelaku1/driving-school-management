const Candidate = require('../models/Candidate');

const list = async (req, res, next) => {
    try {
        const filter = {};
        if (req.user?.role === 'instructor') {
            const Instructor = require('../models/Instructor');
            const instructorDoc = await Instructor.findOne({ user: req.user._id });
            if (instructorDoc) {
                filter.instructor = instructorDoc._id;
            } else {
                // no instructor doc -> return empty list
                return res.json([]);
            }
        }
        const candidates = await Candidate.find(filter).populate({
            path: 'instructor',
            populate: { path: 'user', select: 'firstName lastName email' }
        });
        res.json(candidates);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id).populate({
            path: 'instructor',
            populate: { path: 'user', select: 'firstName lastName email' }
        });
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
        res.json(candidate);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const payload = { ...req.body };
        if (payload.instructorId) {
            payload.instructor = payload.instructorId;
            delete payload.instructorId;
        }
        const candidate = await Candidate.create(payload);
        const populated = await Candidate.findById(candidate._id).populate({
            path: 'instructor',
            populate: { path: 'user', select: 'firstName lastName email' }
        });
        res.status(201).json(populated);
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const updates = { ...req.body };
        if (updates.instructorId) {
            updates.instructor = updates.instructorId;
            delete updates.instructorId;
        }
        const candidate = await Candidate.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
        const populated = await Candidate.findById(candidate._id).populate({
            path: 'instructor',
            populate: { path: 'user', select: 'firstName lastName email' }
        });
        res.json(populated);
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const candidate = await Candidate.findByIdAndDelete(req.params.id);
        if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
        res.json({ message: 'Candidate deleted' });
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

