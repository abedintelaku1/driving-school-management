const Instructor = require('../models/Instructor');
const User = require('../models/User');
const notificationService = require('../services/notification.service');
const emailService = require('../services/email.service');

const list = async (_req, res, next) => {
    try {
        const instructors = await Instructor.find()
            .populate('user', 'firstName lastName email role')
            .sort({ createdAt: -1 });
        res.json(instructors);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const instructor = await Instructor.findById(req.params.id)
            .populate('user', 'firstName lastName email role');
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
            .populate('user', 'firstName lastName email role');
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
        const { firstName, lastName, email = '', password, phone, address, dateOfBirth, personalNumber, specialties = [], assignedCarIds = [] } = req.body;
        
        console.log('Creating instructor with data:', { firstName, lastName, email, phone, address, dateOfBirth, personalNumber });
        
        // Validate required fields
        if (!firstName || !lastName || !email || !password || !phone || !address || !dateOfBirth || !personalNumber) {
            console.log('Validation failed: Missing required fields');
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
        
        // Create instructor profile
        const instructor = await Instructor.create({
            user: user._id,
            phone,
            address,
            dateOfBirth: new Date(dateOfBirth),
            personalNumber,
            specialties,
            assignedCarIds
        });
        
        // Populate and return
        const populated = await Instructor.findById(instructor._id)
            .populate('user', 'firstName lastName email role');
        
        // Send welcome email to instructor (async, don't wait for it)
        emailService.sendInstructorWelcomeEmail(populated).catch(err => {
            console.error('❌ Failed to send welcome email to instructor', populated.user?.email, ':', err.message);
        });
        
        // Create notifications for admin users (async, don't wait for it)
        notificationService.notifyInstructorCreated(populated, req.user.id).catch(err => {
            console.error('Error creating notifications for instructor:', err);
        });
        
        console.log('Instructor created successfully:', populated._id);
        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating instructor:', err);
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
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { phone, address, dateOfBirth, personalNumber, specialties, assignedCarIds, status } = req.body;
        
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
        if (status !== undefined) instructor.status = status;
        
        await instructor.save();
        
        const populated = await Instructor.findById(instructor._id)
            .populate('user', 'firstName lastName email role');
        
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
            .populate('user', 'firstName lastName email role');
        
        if (!instructor) {
            return res.status(404).json({ message: 'Instructor profile not found' });
        }
        
        res.json({
            id: instructor.user._id,
            firstName: instructor.user.firstName,
            lastName: instructor.user.lastName,
            email: instructor.user.email,
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
        
        res.json({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
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

