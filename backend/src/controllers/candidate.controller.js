const Candidate = require('../models/Candidate');

const list = async (_req, res, next) => {
    try {
        const candidates = await Candidate.find()
            .populate('instructorId', 'phone address dateOfBirth personalNumber')
            .sort({ createdAt: -1 });
        res.json(candidates);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('instructorId', 'phone address dateOfBirth personalNumber');
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phone, 
            dateOfBirth, 
            personalNumber, 
            address,
            packageId,
            instructorId,
            carId,
            paymentFrequency,
            status
        } = req.body;
        
        console.log('Received candidate data:', { firstName, lastName, email, phone, dateOfBirth, personalNumber, address });
        
        // Validate required fields
        if (!firstName || !firstName.trim()) {
            return res.status(400).json({ message: 'First name is required' });
        }
        if (!lastName || !lastName.trim()) {
            return res.status(400).json({ message: 'Last name is required' });
        }
        if (!email || !email.trim()) {
            return res.status(400).json({ message: 'Email is required' });
        }
        if (!phone || !phone.trim()) {
            return res.status(400).json({ message: 'Phone is required' });
        }
        if (!dateOfBirth) {
            return res.status(400).json({ message: 'Date of birth is required' });
        }
        if (!personalNumber || !personalNumber.trim()) {
            return res.status(400).json({ message: 'Personal number is required' });
        }
        if (!address || !address.trim()) {
            return res.status(400).json({ message: 'Address is required' });
        }
        
        // Validate email format
        const emailRegex = /^\S+@\S+\.\S+$/;
        const normalizedEmail = email.toLowerCase().trim();
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ 
                message: 'Invalid email format' 
            });
        }
        
        // Check if email already exists
        const existingEmail = await Candidate.findOne({ email: normalizedEmail });
        if (existingEmail) {
            console.log('Email already exists:', normalizedEmail, 'Existing candidate:', existingEmail._id);
            return res.status(400).json({ 
                message: 'Email already in use' 
            });
        }
        
        // Check if personal number already exists
        const trimmedPersonalNumber = personalNumber.trim();
        const existingPersonalNumber = await Candidate.findOne({ personalNumber: trimmedPersonalNumber });
        if (existingPersonalNumber) {
            console.log('Personal number already exists:', trimmedPersonalNumber, 'Existing candidate:', existingPersonalNumber._id);
            return res.status(400).json({ 
                message: 'Personal number already in use' 
            });
        }
        
        // Validate date of birth
        const birthDate = new Date(dateOfBirth);
        const today = new Date();
        if (birthDate >= today) {
            return res.status(400).json({ 
                message: 'Date of birth must be in the past' 
            });
        }
        
        // Create candidate
        const candidate = await Candidate.create({
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            dateOfBirth: birthDate,
            personalNumber: personalNumber.trim(),
            address: address.trim(),
            packageId: packageId || '',
            instructorId: instructorId || null,
            carId: carId || '',
            paymentFrequency: paymentFrequency || '',
            status: status || 'active'
        });
        
        const populated = await Candidate.findById(candidate._id)
            .populate('instructorId', 'phone address dateOfBirth personalNumber');
        
        res.status(201).json(populated);
    } catch (err) {
        console.error('Error creating candidate:', err);
        console.error('Error details:', {
            code: err.code,
            keyPattern: err.keyPattern,
            keyValue: err.keyValue,
            message: err.message
        });
        if (err.code === 11000) {
            // Duplicate key error
            if (err.keyPattern?.email) {
                console.log('Duplicate email detected:', err.keyValue?.email);
                return res.status(400).json({ 
                    message: 'Email already in use' 
                });
            }
            if (err.keyPattern?.personalNumber) {
                console.log('Duplicate personal number detected:', err.keyValue?.personalNumber);
                return res.status(400).json({ 
                    message: 'Personal number already in use' 
                });
            }
            if (err.keyPattern?.uniqueClientNumber) {
                console.log('Duplicate unique client number detected:', err.keyValue?.uniqueClientNumber);
                // This shouldn't happen as we generate it, but handle it anyway
                return res.status(400).json({ 
                    message: 'Client number conflict. Please try again.' 
                });
            }
            console.log('Unknown duplicate key error:', err.keyPattern);
            return res.status(400).json({ 
                message: 'Email or personal number already in use' 
            });
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { 
            firstName, 
            lastName, 
            email, 
            phone, 
            dateOfBirth, 
            personalNumber, 
            address,
            packageId,
            instructorId,
            carId,
            paymentFrequency,
            status
        } = req.body;
        
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        // Check email uniqueness if changed
        if (email && email.toLowerCase().trim() !== candidate.email) {
            const normalizedEmail = email.toLowerCase().trim();
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({ 
                    message: 'Invalid email format' 
                });
            }
            const existingEmail = await Candidate.findOne({ 
                email: normalizedEmail,
                _id: { $ne: req.params.id }
            });
            if (existingEmail) {
                return res.status(400).json({ 
                    message: 'Email already in use' 
                });
            }
            candidate.email = normalizedEmail;
        }
        
        // Check personal number uniqueness if changed
        if (personalNumber && personalNumber.trim() !== candidate.personalNumber) {
            const existingPersonalNumber = await Candidate.findOne({ 
                personalNumber: personalNumber.trim(),
                _id: { $ne: req.params.id }
            });
            if (existingPersonalNumber) {
                return res.status(400).json({ 
                    message: 'Personal number already in use' 
                });
            }
            candidate.personalNumber = personalNumber.trim();
        }
        
        // Update fields
        if (firstName !== undefined) candidate.firstName = firstName.trim();
        if (lastName !== undefined) candidate.lastName = lastName.trim();
        if (phone !== undefined) candidate.phone = phone.trim();
        if (dateOfBirth !== undefined) candidate.dateOfBirth = new Date(dateOfBirth);
        if (address !== undefined) candidate.address = address.trim();
        if (packageId !== undefined) candidate.packageId = packageId;
        if (instructorId !== undefined) candidate.instructorId = instructorId || null;
        if (carId !== undefined) candidate.carId = carId;
        if (paymentFrequency !== undefined) candidate.paymentFrequency = paymentFrequency;
        if (status !== undefined) candidate.status = status;
        
        await candidate.save();
        
        const populated = await Candidate.findById(candidate._id)
            .populate('instructorId', 'phone address dateOfBirth personalNumber');
        
        res.json(populated);
    } catch (err) {
        console.error('Error updating candidate:', err);
        if (err.code === 11000) {
            if (err.keyPattern?.email) {
                return res.status(400).json({ 
                    message: 'Email already in use' 
                });
            }
            if (err.keyPattern?.personalNumber) {
                return res.status(400).json({ 
                    message: 'Personal number already in use' 
                });
            }
            return res.status(400).json({ 
                message: 'Email or personal number already in use' 
            });
        }
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        await Candidate.findByIdAndDelete(req.params.id);
        
        res.json({ message: 'Candidate deleted successfully' });
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
