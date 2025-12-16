const Candidate = require('../models/Candidate');

const list = async (req, res, next) => {
    try {
        const { status, instructorId, packageId } = req.query;
        const filter = {};
        
        if (status) filter.status = status;
        if (instructorId) filter.instructorId = instructorId;
        if (packageId) filter.packageId = packageId;
        
        const candidates = await Candidate.find(filter)
            .populate('instructorId', 'phone address personalNumber')
            .sort({ createdAt: -1 });
        
        res.json(candidates);
    } catch (err) {
        next(err);
    }
};

const getById = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id)
            .populate('instructorId', 'phone address personalNumber');
        
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
            uniqueClientNumber,
            firstName,
            lastName,
            dateOfBirth,
            personalNumber,
            address,
            phone,
            email,
            status,
            packageId,
            instructorId,
            carId,
            paymentFrequency,
            documents
        } = req.body;
        
        if (!firstName || !lastName || !dateOfBirth || 
            !personalNumber || !address || !phone || !email) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        
        const emailRegex = /^\S+@\S+\.\S+$/;
        const normalizedEmail = email.toLowerCase().trim();
        if (!emailRegex.test(normalizedEmail)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }
        
        // Generate uniqueClientNumber if not provided
        let clientNumber = uniqueClientNumber;
        if (!clientNumber) {
            const year = new Date().getFullYear();
            const count = await Candidate.countDocuments({ 
                uniqueClientNumber: new RegExp(`^DH-${year}-`) 
            });
            clientNumber = `DH-${year}-${String(count + 1).padStart(3, '0')}`;
        }
        
        // Validate and convert ObjectIds
        const mongoose = require('mongoose');
        let validInstructorId = null;
        
        if (instructorId && mongoose.Types.ObjectId.isValid(instructorId) && instructorId.length === 24) {
            validInstructorId = instructorId;
        }
        
        const candidate = await Candidate.create({
            uniqueClientNumber: clientNumber,
            firstName,
            lastName,
            dateOfBirth: new Date(dateOfBirth),
            personalNumber,
            address,
            phone,
            email: normalizedEmail,
            status: status || 'active',
            packageId: packageId || null, // Store as string for mock data
            instructorId: validInstructorId,
            carId: carId || null,
            paymentFrequency: paymentFrequency || null,
            documents: documents || []
        });
        
        const populated = await Candidate.findById(candidate._id)
            .populate('instructorId', 'phone address personalNumber');
        
        res.status(201).json(populated);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ 
                message: `${field === 'uniqueClientNumber' ? 'Client number' : field === 'personalNumber' ? 'Personal number' : 'Email'} already in use` 
            });
        }
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const candidate = await Candidate.findById(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const {
            uniqueClientNumber,
            firstName,
            lastName,
            dateOfBirth,
            personalNumber,
            address,
            phone,
            email,
            status,
            packageId,
            instructorId,
            carId,
            paymentFrequency,
            documents
        } = req.body;
        
        if (uniqueClientNumber !== undefined) candidate.uniqueClientNumber = uniqueClientNumber;
        if (firstName !== undefined) candidate.firstName = firstName;
        if (lastName !== undefined) candidate.lastName = lastName;
        if (dateOfBirth !== undefined) candidate.dateOfBirth = new Date(dateOfBirth);
        if (personalNumber !== undefined) candidate.personalNumber = personalNumber;
        if (address !== undefined) candidate.address = address;
        if (phone !== undefined) candidate.phone = phone;
        if (email !== undefined) {
            const emailRegex = /^\S+@\S+\.\S+$/;
            const normalizedEmail = email.toLowerCase().trim();
            if (!emailRegex.test(normalizedEmail)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            candidate.email = normalizedEmail;
        }
        if (status !== undefined) candidate.status = status;
        
        // Validate and convert ObjectIds
        const mongoose = require('mongoose');
        if (packageId !== undefined) {
            candidate.packageId = packageId || null; // Store as string for mock data
        }
        if (instructorId !== undefined) {
            if (instructorId && mongoose.Types.ObjectId.isValid(instructorId) && instructorId.length === 24) {
                candidate.instructorId = instructorId;
            } else {
                candidate.instructorId = null;
            }
        }
        if (carId !== undefined) candidate.carId = carId || null;
        if (paymentFrequency !== undefined) candidate.paymentFrequency = paymentFrequency || null;
        if (documents !== undefined) candidate.documents = documents;
        
        await candidate.save();
        
        const populated = await Candidate.findById(candidate._id)
            .populate('instructorId', 'phone address personalNumber');
        
        res.json(populated);
    } catch (err) {
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({ 
                message: `${field === 'uniqueClientNumber' ? 'Client number' : field === 'personalNumber' ? 'Personal number' : 'Email'} already in use` 
            });
        }
        next(err);
    }
};

const remove = async (req, res, next) => {
    try {
        const candidate = await Candidate.findByIdAndDelete(req.params.id);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
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

