const Instructor = require('../models/Instructor');
const User = require('../models/User');
const Car = require('../models/Car');
const Appointment = require('../models/Appointment');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');

const list = async (_req, res, next) => {
    try {
        const instructors = await Instructor.find()
            .populate('user', 'firstName lastName role')
            .sort({ createdAt: -1 });
        
        // Calculate totalHours for all instructors using aggregation
        const hoursByInstructor = await Appointment.aggregate([
            { $match: { status: 'completed' } },
            { $group: {
                _id: '$instructorId',
                totalHours: { $sum: { $ifNull: ['$hours', 0] } }
            }}
        ]);
        
        // Create a map for quick lookup
        const hoursMap = new Map();
        hoursByInstructor.forEach(item => {
            if (item._id) {
                hoursMap.set(item._id.toString(), item.totalHours);
            }
        });
        
        // Update totalHours for each instructor if needed
        const updatePromises = instructors.map(async (instructor) => {
            const calculatedHours = hoursMap.get(instructor._id.toString()) || 0;
            if (instructor.totalHours !== calculatedHours) {
                instructor.totalHours = calculatedHours;
                await instructor.save();
            }
            return instructor;
        });
        
        await Promise.all(updatePromises);
        
        res.json(instructors);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const instructor = await Instructor.findById(req.params.id)
            .populate('user', 'firstName lastName role');
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        res.json(instructor);
    } catch (err) {
        next(err);
    }
};

const getMe = async (req, res, next) => {
    try {
        const instructor = await Instructor.findOne({ user: req.user._id })
            .populate('user', 'firstName lastName role');
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor profile not found' });
        }
        res.json(instructor);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { firstName, lastName, email = '', password, phone, address, dateOfBirth, personalNumber, specialties = [], assignedCarIds = [], personalCar, instructorType = 'insider', ratePerHour = 0, debtPerHour = 0 } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !phone || !address || !dateOfBirth || !personalNumber) {
            return res.status(400).json({ message: 'All required fields must be provided' });
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
        
        // Check if email already exists
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        
        // Create user with role 1 (instructor)
        const user = await User.create({
            firstName,
            lastName,
            email: normalizedEmail,
            password,
            role: 1 // 1 = instructor
        });
        
        // Validate instructor type
        if (instructorType && !['insider', 'outsider'].includes(instructorType)) {
            return res.status(400).json({ message: 'Instructor type must be "insider" or "outsider"' });
        }
        
        // Validate rate for outsider
        if (instructorType === 'outsider') {
            if (typeof ratePerHour !== 'number' || ratePerHour < 0) {
                return res.status(400).json({ message: 'Rate per hour must be a non-negative number for outsider instructors' });
            }
        }
        
        // Create instructor profile
        const instructor = await Instructor.create({
            user: user._id,
            phone,
            address,
            dateOfBirth: new Date(dateOfBirth),
            personalNumber,
            specialties,
            assignedCarIds,
            personalCarIds: [],
            instructorType: instructorType || 'insider',
            ratePerHour: instructorType === 'outsider' ? (ratePerHour || 0) : 0,
            debtPerHour: 0,
            totalCredits: 0,
            totalDebt: 0
        });
        
        // Create personal car if provided
        let personalCarId = null;
        if (personalCar && personalCar.model) {
            try {
                // Validate personal car fields
                if (!personalCar.model || !personalCar.yearOfManufacture || !personalCar.chassisNumber || 
                    !personalCar.transmission || !personalCar.fuelType || !personalCar.licensePlate || 
                    !personalCar.ownership || !personalCar.registrationExpiry || 
                    !personalCar.lastInspection || !personalCar.nextInspection) {
                    throw new Error('All personal car fields must be provided');
                }
                
                // Validate transmission type
                if (!["manual", "automatic"].includes(personalCar.transmission)) {
                    throw new Error('Transmission must be "manual" or "automatic"');
                }
                
                // Validate fuel type
                if (!["petrol", "diesel", "electric", "hybrid"].includes(personalCar.fuelType)) {
                    throw new Error('Invalid fuel type');
                }
                
                // Validate ownership type (for personal cars: owned or instructor)
                if (!["owned", "instructor"].includes(personalCar.ownership)) {
                    throw new Error('Ownership must be "owned" or "instructor" for personal cars');
                }
                
                // Validate year
                const currentYear = new Date().getFullYear();
                if (personalCar.yearOfManufacture < 1900 || personalCar.yearOfManufacture > currentYear + 1) {
                    throw new Error('Invalid year of manufacture');
                }
                
                // Normalize license plate
                const normalizedLicensePlate = personalCar.licensePlate.trim().toUpperCase().replace(/\s+/g, '');
                
                // Create personal car linked to this instructor
                const car = await Car.create({
                    model: personalCar.model.trim(),
                    yearOfManufacture: personalCar.yearOfManufacture,
                    chassisNumber: personalCar.chassisNumber.trim(),
                    transmission: personalCar.transmission,
                    fuelType: personalCar.fuelType,
                    licensePlate: normalizedLicensePlate,
                    ownership: personalCar.ownership,
                    registrationExpiry: new Date(personalCar.registrationExpiry),
                    lastInspection: new Date(personalCar.lastInspection),
                    nextInspection: new Date(personalCar.nextInspection),
                    status: personalCar.status || 'active',
                    instructorId: instructor._id
                });
                
                personalCarId = car._id.toString();
                
                // Update instructor with personal car ID
                instructor.personalCarIds = [personalCarId];
                await instructor.save();
            } catch (carErr) {
                // If car creation fails, we should still return the instructor but log the error
                // Optionally, you could delete the instructor here if car creation is critical
                if (carErr.code === 11000) {
                    if (carErr.keyPattern?.chassisNumber) {
                        return res.status(400).json({ message: 'Chassis number already in use' });
                    }
                    if (carErr.keyPattern?.licensePlate) {
                        return res.status(400).json({ message: 'License plate already in use' });
                    }
                }
                // If it's a validation error, return it
                if (carErr.message && !carErr.code) {
                    return res.status(400).json({ message: carErr.message });
                }
                // Otherwise, continue without the personal car
            }
        }
        
        // Populate and return
        const populated = await Instructor.findById(instructor._id)
            .populate('user', 'firstName lastName role');
        
        // Send welcome email to instructor (async, don't wait for it)
        emailService.sendInstructorWelcomeEmail(populated).catch(() => {
            // Silently handle email errors
        });
        
        // Create notifications for admin users (async, don't wait for it)
        notificationService.notifyInstructorCreated(populated, req.user.id).catch(() => {
            // Silently handle notification errors
        });
        
        res.status(201).json(populated);
    } catch (err) {
        if (err.code === 11000) {
            // Check which field caused the duplicate
            if (err.keyPattern?.email) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            if (err.keyPattern?.personalNumber) {
                return res.status(400).json({ message: 'Personal number already in use' });
            }
            return res.status(400).json({ message: 'Email or personal number already in use' });
        }
        if (err.code === 11000) {
            // Duplicate key error
            if (err.keyPattern?.email) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            if (err.keyPattern?.personalNumber) {
                return res.status(400).json({ message: 'Personal number already in use' });
            }
            return res.status(400).json({ message: 'Email or personal number already in use' });
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { phone, address, dateOfBirth, personalNumber, specialties, assignedCarIds, status, personalCarIds, instructorType, ratePerHour, debtPerHour } = req.body;
        
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        
        // Update fields
        if (phone !== undefined) instructor.phone = phone;
        if (address !== undefined) instructor.address = address;
        if (dateOfBirth !== undefined) instructor.dateOfBirth = new Date(dateOfBirth);
        if (personalNumber !== undefined) instructor.personalNumber = personalNumber;
        if (specialties !== undefined) instructor.specialties = specialties;
        if (assignedCarIds !== undefined) instructor.assignedCarIds = assignedCarIds;
        if (personalCarIds !== undefined) instructor.personalCarIds = personalCarIds;
        if (status !== undefined) instructor.status = status;
        
        // Update instructor type and payment fields
        if (instructorType !== undefined) {
            if (!['insider', 'outsider'].includes(instructorType)) {
                return res.status(400).json({ message: 'Instructor type must be "insider" or "outsider"' });
            }
            instructor.instructorType = instructorType;
            
            // If changing to insider, reset rate and debt
            if (instructorType === 'insider') {
                instructor.ratePerHour = 0;
                instructor.debtPerHour = 0;
            }
        }
        
        // Update rate only for outsider
        if (instructor.instructorType === 'outsider') {
            if (ratePerHour !== undefined) {
                if (typeof ratePerHour !== 'number' || ratePerHour < 0) {
                    return res.status(400).json({ message: 'Rate per hour must be a non-negative number' });
                }
                instructor.ratePerHour = ratePerHour;
            }
            // Always set debtPerHour to 0
            instructor.debtPerHour = 0;
        }
        
        await instructor.save();
        
        const populated = await Instructor.findById(instructor._id)
            .populate('user', 'firstName lastName role');
        
        res.json(populated);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Personal number already in use' });
        }
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const instructor = await Instructor.findById(req.params.id);
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor not found' });
        }
        
        // Delete associated user
        await User.findByIdAndDelete(instructor.user);
        
        // Delete instructor
        await Instructor.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Instructor deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Get instructor profile (for logged-in instructor)
const getProfile = async (req, res, next) => {
    try {
        const instructor = await Instructor.findOne({ user: req.user._id })
            .populate('user', 'firstName lastName role');
        
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor profile not found' });
        }
        
        // Only return email for own profile (instructor viewing their own profile)
        res.json({
            id: instructor.user._id,
            firstName: instructor.user.firstName,
            lastName: instructor.user.lastName,
            email: instructor.user.email, // Own email is OK for profile view
            role: instructor.user.role,
            phone: instructor.phone,
            address: instructor.address,
            dateOfBirth: instructor.dateOfBirth,
            personalNumber: instructor.personalNumber,
            createdAt: instructor.user.createdAt,
        });
    } catch (err) {
        next(err);
    }
};

// Update instructor profile (for logged-in instructor)
const updateProfile = async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, address } = req.body;
        
        // Validate required fields
        if (!firstName || !lastName || !email) {
            return res.status(400).json({
                message: 'First name, last name, and email are required',
            });
        }
        
        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        const normalizedEmail = email.toLowerCase().trim();
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Check if email is already in use by another user
        const existingUser = await User.findOne({
            email: normalizedEmail,
            _id: { $ne: req.user._id },
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        
        // Get instructor
        const instructor = await Instructor.findOne({ user: req.user._id });
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor profile not found' });
        }
        
        // Update user
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: normalizedEmail,
            },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Update instructor fields if provided
        if (phone !== undefined) instructor.phone = phone;
        if (address !== undefined) instructor.address = address;
        await instructor.save();
        
        // Only return email for own profile (instructor updating their own profile)
        res.json({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email, // Own email is OK for profile view
            role: user.role,
            phone: instructor.phone,
            address: instructor.address,
            dateOfBirth: instructor.dateOfBirth,
            personalNumber: instructor.personalNumber,
            createdAt: user.createdAt,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Email already in use' });
        }
        next(err);
    }
};

// Change password (for logged-in instructor)
const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required',
            });
        }
        
        // Validate password length
        if (newPassword.length < 6) {
            return res.status(400).json({
                message: 'New password must be at least 6 characters long',
            });
        }
        
        // Get user with password
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    list,
    getById,
    getMe,
    create,
    update,
    remove,
    getProfile,
    updateProfile,
    changePassword
};

