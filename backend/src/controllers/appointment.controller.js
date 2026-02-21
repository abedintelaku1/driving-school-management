const Appointment = require('../models/Appointment');
const Instructor = require('../models/Instructor');
const Candidate = require('../models/Candidate');
const Car = require('../models/Car');

const list = async (req, res, next) => {
    try {
        const appointments = await Appointment.find()
            .populate({
                path: 'instructorId',
                select: 'user phone address',
                populate: {
                    path: 'user',
                    select: 'firstName lastName'
                }
            })
            .populate('candidateId', 'firstName lastName uniqueClientNumber phone')
            .populate('carId', 'model licensePlate transmission')
            .sort({ date: -1, startTime: -1 });
        res.json(appointments);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id)
            .populate({
                path: 'instructorId',
                select: 'user phone address',
                populate: {
                    path: 'user',
                    select: 'firstName lastName'
                }
            })
            .populate('candidateId', 'firstName lastName uniqueClientNumber phone')
            .populate('carId', 'model licensePlate transmission');
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // If user is an instructor, verify they own this appointment
        const userRole = typeof req.user.role === 'string' 
            ? (req.user.role.toLowerCase() === 'instructor' ? 1 : 0)
            : req.user.role;
        
        if (userRole === 1) {
            const Instructor = require('../models/Instructor');
            const instructor = await Instructor.findOne({ user: req.user._id });
            
            if (!instructor || appointment.instructorId.toString() !== instructor._id.toString()) {
                return res.status(403).json({ message: 'Forbidden: You can only view your own appointments' });
            }
        }

        res.json(appointment);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { instructorId, candidateId, carId, date, startTime, endTime, hours, notes, status = 'scheduled' } = req.body;

        // Validate required fields (carId is optional)
        if (!instructorId || !candidateId || !date || !startTime || !endTime) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }

        // Validate status
        if (status && !['scheduled', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Status must be "scheduled", "completed", or "cancelled"' });
        }

        // Validate time format
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(startTime)) {
            return res.status(400).json({ message: 'Invalid start time format. Use HH:MM format (e.g., 09:00)' });
        }
        if (!timeRegex.test(endTime)) {
            return res.status(400).json({ message: 'Invalid end time format. Use HH:MM format (e.g., 11:00)' });
        }

        // Validate date
        const appointmentDate = new Date(date);
        if (isNaN(appointmentDate.getTime())) {
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // Validate instructor exists
        const instructor = await Instructor.findById(instructorId);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }

        // Validate candidate exists
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Validate car exists (if provided)
        if (carId) {
            const car = await Car.findById(carId);
            if (!car) {
                return res.status(404).json({ message: 'Car not found' });
            }
        }

        // Calculate hours if not provided
        // Note: 1 lesson hour = 45 minutes
        let calculatedHours = hours;
        if (!calculatedHours || calculatedHours === 0) {
            const parseTime = (timeString) => {
                const [h, m] = timeString.split(':').map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);
                return d;
            };
            const start = parseTime(startTime);
            const end = parseTime(endTime);
            let diffMs = end - start;
            if (diffMs < 0) {
                diffMs = (24 * 60 * 60 * 1000) + diffMs;
            }
            // Convert to lesson hours (45 minutes = 1 hour)
            calculatedHours = Math.round((diffMs / (45 * 60 * 1000)) * 100) / 100;
        }

        // Validate hours
        if (calculatedHours <= 0 || calculatedHours > 24) {
            return res.status(400).json({ message: 'Hours must be between 0 and 24' });
        }

        // Create appointment
        const appointment = await Appointment.create({
            instructorId,
            candidateId,
            carId: carId || null, // Allow null for instructors
            date: appointmentDate,
            startTime: startTime.trim(),
            endTime: endTime.trim(),
            hours: calculatedHours,
            notes: notes || '',
            status
        });

        // Populate and return
        const populated = await Appointment.findById(appointment._id)
            .populate({
                path: 'instructorId',
                select: 'user phone address',
                populate: {
                    path: 'user',
                    select: 'firstName lastName'
                }
            })
            .populate('candidateId', 'firstName lastName uniqueClientNumber phone')
            .populate('carId', 'model licensePlate transmission');

        res.status(201).json(populated);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid instructor, candidate, or car ID' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Të dhënat e dërguara nuk janë të vlefshme' });
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { instructorId, candidateId, carId, date, startTime, endTime, hours, notes, status } = req.body;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // If user is an instructor, verify they own this appointment
        const userRole = typeof req.user.role === 'string' 
            ? (req.user.role.toLowerCase() === 'instructor' ? 1 : 0)
            : req.user.role;
        
        if (userRole === 1) {
            const Instructor = require('../models/Instructor');
            const instructor = await Instructor.findOne({ user: req.user._id });
            
            if (!instructor || appointment.instructorId.toString() !== instructor._id.toString()) {
                return res.status(403).json({ message: 'Forbidden: You can only update your own appointments' });
            }
            
            // Instructors cannot change instructorId
            if (instructorId !== undefined && instructorId !== appointment.instructorId.toString()) {
                return res.status(403).json({ message: 'Forbidden: You cannot change the instructor of an appointment' });
            }
        }

        // Update fields if provided
        if (instructorId !== undefined) {
            const instructor = await Instructor.findById(instructorId);
            if (!instructor) {
                return res.status(404).json({ message: 'Instructor not found' });
            }
            appointment.instructorId = instructorId;
        }

        if (candidateId !== undefined) {
            const candidate = await Candidate.findById(candidateId);
            if (!candidate) {
                return res.status(404).json({ message: 'Candidate not found' });
            }
            appointment.candidateId = candidateId;
        }

        if (carId !== undefined) {
            if (carId) {
                const car = await Car.findById(carId);
                if (!car) {
                    return res.status(404).json({ message: 'Car not found' });
                }
                appointment.carId = carId;
            } else {
                // Allow setting carId to null
                appointment.carId = null;
            }
        }

        if (date !== undefined) {
            const appointmentDate = new Date(date);
            if (isNaN(appointmentDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }
            appointment.date = appointmentDate;
        }

        if (startTime !== undefined) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(startTime)) {
                return res.status(400).json({ message: 'Invalid start time format. Use HH:MM format' });
            }
            appointment.startTime = startTime.trim();
        }

        if (endTime !== undefined) {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(endTime)) {
                return res.status(400).json({ message: 'Invalid end time format. Use HH:MM format' });
            }
            appointment.endTime = endTime.trim();
        }

        // Recalculate hours if startTime or endTime changed
        // Note: 1 lesson hour = 45 minutes
        if ((startTime !== undefined || endTime !== undefined) && (!hours || hours === 0)) {
            const parseTime = (timeString) => {
                const [h, m] = timeString.split(':').map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);
                return d;
            };
            const start = parseTime(appointment.startTime);
            const end = parseTime(appointment.endTime);
            let diffMs = end - start;
            if (diffMs < 0) {
                diffMs = (24 * 60 * 60 * 1000) + diffMs;
            }
            // Convert to lesson hours (45 minutes = 1 hour)
            appointment.hours = Math.round((diffMs / (45 * 60 * 1000)) * 100) / 100;
        } else if (hours !== undefined) {
            if (hours <= 0 || hours > 24) {
                return res.status(400).json({ message: 'Hours must be between 0 and 24' });
            }
            appointment.hours = hours;
        }

        if (notes !== undefined) {
            appointment.notes = notes || '';
        }

        // Track if status is being changed to completed
        const wasCompleted = appointment.status === 'completed';
        let statusChangedToCompleted = false;
        
        if (status !== undefined) {
            if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
                return res.status(400).json({ message: 'Status must be "scheduled", "completed", or "cancelled"' });
            }
            // Check if status is being changed to completed
            if (status === 'completed' && appointment.status !== 'completed') {
                statusChangedToCompleted = true;
            }
            appointment.status = status;
        }

        await appointment.save();

        // Update instructor totalHours and credits if appointment is marked as completed
        if (statusChangedToCompleted && appointment.instructorId) {
            try {
                const Instructor = require('../models/Instructor');
                const instructor = await Instructor.findById(appointment.instructorId);
                
                if (instructor) {
                    const hours = appointment.hours || 0;
                    
                    // Update totalHours for all instructors
                    instructor.totalHours = (instructor.totalHours || 0) + hours;
                    
                    // Update credits only for outsider instructors
                    if (instructor.instructorType === 'outsider') {
                        const creditsToAdd = (instructor.ratePerHour || 0) * hours;
                        instructor.totalCredits = (instructor.totalCredits || 0) + creditsToAdd;
                    }
                    
                    await instructor.save();
                }
            } catch (err) {
                // Silently handle errors updating instructor hours/credits
                // Don't fail the appointment update if update fails
            }
        }

        // Populate and return
        const populated = await Appointment.findById(appointment._id)
            .populate({
                path: 'instructorId',
                select: 'user phone address',
                populate: {
                    path: 'user',
                    select: 'firstName lastName'
                }
            })
            .populate('candidateId', 'firstName lastName uniqueClientNumber phone')
            .populate('carId', 'model licensePlate transmission');

        res.json(populated);
    } catch (err) {
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid ID format' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ message: 'Të dhënat e dërguara nuk janë të vlefshme' });
        }
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        await Appointment.findByIdAndDelete(req.params.id);
        res.json({ message: 'Appointment deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Get appointments by instructor
const getByInstructor = async (req, res, next) => {
    try {
        const { instructorId } = req.params;
        const appointments = await Appointment.find({ instructorId })
            .populate('candidateId', 'firstName lastName uniqueClientNumber phone')
            .populate('carId', 'model licensePlate transmission')
            .sort({ date: -1, startTime: -1 });
        res.json(appointments);
    } catch (err) {
        next(err);
    }
};

// Get appointments by candidate
const getByCandidate = async (req, res, next) => {
    try {
        const { candidateId } = req.params;
        const appointments = await Appointment.find({ candidateId })
            .populate({
                path: 'instructorId',
                select: 'user phone address',
                populate: {
                    path: 'user',
                    select: 'firstName lastName'
                }
            })
            .populate('carId', 'model licensePlate transmission')
            .sort({ date: -1, startTime: -1 });
        res.json(appointments);
    } catch (err) {
        next(err);
    }
};

// Get appointments for the logged-in instructor
const getMyAppointments = async (req, res, next) => {
    try {
        // Get the instructor document for this user
        const instructor = await Instructor.findOne({ user: req.user._id });
        
        if (!instructor) {
            // Instructor profile not found, return empty array
            return res.json([]);
        }
        
        // Get appointments for this instructor
        const appointments = await Appointment.find({ instructorId: instructor._id })
            .populate('candidateId', 'firstName lastName uniqueClientNumber phone')
            .populate('carId', 'model licensePlate transmission')
            .sort({ date: -1, startTime: -1 });
        
        res.json(appointments);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    list,
    getById,
    create,
    update,
    remove,
    getByInstructor,
    getByCandidate,
    getMyAppointments
};

