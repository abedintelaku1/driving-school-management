const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: Number, enum: [0, 1, 2], required: true }, // 0 = Admin, 1 = Instructor, 2 = Staff
    createdAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', async function hashPassword(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = async function comparePassword(candidate) {
    // If password is already hashed (starts with $2a$ or $2b$), use bcrypt
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
        return bcrypt.compare(candidate, this.password);
    }
    // Otherwise, compare plain text (for testing/legacy users)
    return candidate === this.password;
};

module.exports = mongoose.model('User', UserSchema);

