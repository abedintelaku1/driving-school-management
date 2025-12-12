/**
 * Script për të hash-uar password-in e adminit ekzistues
 * Përdor: node src/scripts/hashPassword.js <email> <newPassword>
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const hashPassword = async () => {
    try {
        await connectDB();
        
        const email = process.argv[2];
        const newPassword = process.argv[3];
        
        if (!email || !newPassword) {
            console.log('Usage: node src/scripts/hashPassword.js <email> <newPassword>');
            console.log('Example: node src/scripts/hashPassword.js admin@drivershub.com demo123');
            process.exit(1);
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        
        if (!user) {
            console.log('❌ User not found with email:', normalizedEmail);
            process.exit(1);
        }
        
        console.log('Found user:', user.email, 'Role:', user.role);
        console.log('Current password (first 20 chars):', user.password.substring(0, 20));
        
        // Update password - pre-save hook will hash it automatically
        user.password = newPassword;
        await user.save();
        
        console.log('✅ Password updated and hashed successfully!');
        console.log('Email:', user.email);
        console.log('New password:', newPassword);
        console.log('Hashed password (first 20 chars):', user.password.substring(0, 20));
        console.log('\nYou can now login with these credentials.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating password:', error);
        process.exit(1);
    }
};

hashPassword();



