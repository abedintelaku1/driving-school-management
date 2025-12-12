/**
 * Script për të krijuar admin-in e parë
 * Përdor: node src/scripts/createAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/database');

const createAdmin = async () => {
    try {
        await connectDB();
        
        const email = process.argv[2] || 'admin@drivershub.com';
        const password = process.argv[3] || 'admin123';
        const firstName = process.argv[4] || 'Admin';
        const lastName = process.argv[5] || 'User';
        
        // Check if admin exists
        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            console.log('Admin already exists with email:', email);
            console.log('To reset password, delete the user first or use a different email');
            process.exit(0);
        }
        
        // Create admin
        const admin = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password, // Will be hashed automatically by pre-save hook
            role: 'admin'
        });
        
        console.log('✅ Admin created successfully!');
        console.log('Email:', admin.email);
        console.log('Password:', password);
        console.log('Role:', admin.role);
        console.log('\nYou can now login with these credentials.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();



