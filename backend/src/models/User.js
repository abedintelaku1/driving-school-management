const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'instructor'], required: true },
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

