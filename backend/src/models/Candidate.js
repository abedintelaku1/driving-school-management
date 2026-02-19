const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
    uniqueClientNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    dateOfBirth: {
        type: Date,
        required: true
    },
    personalNumber: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    packageId: {
        type: String,
        default: ''
    },
    instructorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Instructor',
        default: null
    },
    carId: {
        type: String,
        default: ''
    },
    paymentFrequency: {
        type: String,
        enum: ['deposit', 'one-time', 'installments'],
        default: ''
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    documents: {
        type: [{
            name: {
                type: String,
                required: true,
                trim: true
            },
            type: {
                type: String,
                enum: ['PDF', 'JPG', 'PNG', 'DOCX'],
                required: true
            },
            uploadDate: {
                type: Date,
                default: Date.now
            },
            updatedDate: {
                type: Date,
                default: null
            },
            uploadedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            filePath: {
                type: String,
                required: true
            },
            fileSize: {
                type: Number,
                default: 0
            },
            originalName: {
                type: String,
                required: true
            }
        }],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate unique client number before saving
CandidateSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // Generate unique client number if not provided
    if (!this.uniqueClientNumber || this.uniqueClientNumber.trim() === '') {
        let uniqueNumber;
        let attempts = 0;
        const maxAttempts = 10;
        
        // Try to generate a unique client number
        do {
            const count = await mongoose.model('Candidate').countDocuments();
            uniqueNumber = `CLI-${String(count + 1 + attempts).padStart(6, '0')}`;
            const exists = await mongoose.model('Candidate').findOne({ uniqueClientNumber: uniqueNumber });
            if (!exists) {
                break;
            }
            attempts++;
        } while (attempts < maxAttempts);
        
        // If still not unique, use timestamp-based approach
        if (attempts >= maxAttempts) {
            uniqueNumber = `CLI-${Date.now().toString().slice(-6)}`;
        }
        
        this.uniqueClientNumber = uniqueNumber;
    }
    
    next();
});

module.exports = mongoose.model('Candidate', CandidateSchema);

