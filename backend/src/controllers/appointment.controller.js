const Appointment = require('../models/Appointment');
const Instructor = require('../models/Instructor');
const Candidate = require('../models/Candidate');

// Helpers
const isAdmin = (user) => user?.role === 'admin';

const list = async (req, res, next) => {
    try {
        let filter = {};
        if (!isAdmin(req.user)) {
            const instructor = await Instructor.findOne({ user: req.user._id });
            filter = { instructor: instructor?._id };
        }
        const appointments = await Appointment.find(filter)
            .populate('candidate')
            .populate('carId')
            .populate({ path: 'instructor', populate: { path: 'user', select: 'firstName lastName email' } });
        res.json(appointments);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate('candidate')
            .populate('carId')
            .populate({ path: 'instructor', populate: { path: 'user', select: 'firstName lastName email' } });
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (!isAdmin(req.user)) {
            const instructor = await Instructor.findOne({ user: req.user._id });
            if (!instructor || appointment.instructor.toString() !== instructor._id.toString()) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }
        res.json(appointment);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { instructorId, candidateId, carId, date, startTime, endTime, hours, notes, topic, status } = req.body;
        const instructor = await Instructor.findById(instructorId);
        const candidate = await Candidate.findById(candidateId);
        if (!instructor || !candidate) {
            return res.status(400).json({ message: 'Invalid instructor or candidate' });
        }
        if (!isAdmin(req.user)) {
            const ownInstructor = await Instructor.findOne({ user: req.user._id });
            if (!ownInstructor || ownInstructor._id.toString() !== instructorId) {
                return res.status(403).json({ message: 'Instructors can only create their own appointments' });
            }
        }
        const appointment = await Appointment.create({
            instructor: instructorId,
            candidate: candidateId,
            carId: carId || undefined,
            date,
            startTime,
            endTime,
            hours: hours || undefined,
            notes: notes || undefined,
            topic: topic || undefined,
            status: status || 'scheduled'
        });
        res.status(201).json(appointment);
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (!isAdmin(req.user)) {
            const instructor = await Instructor.findOne({ user: req.user._id });
            if (!instructor || appointment.instructor.toString() !== instructor._id.toString()) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }
        Object.assign(appointment, req.body, { updatedAt: new Date() });
        await appointment.save();
        res.json(appointment);
    } catch (err) {
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (!isAdmin(req.user)) {
            const instructor = await Instructor.findOne({ user: req.user._id });
            if (!instructor || appointment.instructor.toString() !== instructor._id.toString()) {
                return res.status(403).json({ message: 'Forbidden' });
            }
        }
        await appointment.deleteOne();
        res.json({ message: 'Appointment deleted' });
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


