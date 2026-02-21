const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        // Don't log connection details in production
        if (process.env.NODE_ENV === 'development') {
            console.log(`MongoDB Connected: ${conn.connection.host}`);
            console.log(`Database Name: ${conn.connection.name}`);
        }

        mongoose.connection.on('error', (err) => {
            // Don't log error details in production
            if (process.env.NODE_ENV === 'development') {
                console.error(`MongoDB connection error: ${err}`);
            }
        });

        mongoose.connection.on('disconnected', () => {
            if (process.env.NODE_ENV === 'development') {
                console.log('MongoDB disconnected');
            }
        });

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            if (process.env.NODE_ENV === 'development') {
                console.log('MongoDB connection closed through app termination');
            }
            process.exit(0);
        });

    } catch (error) {
        // Don't log connection error details in production
        if (process.env.NODE_ENV === 'development') {
            console.error(`Error connecting to MongoDB: ${error.message}`);
        }
        process.exit(1);
    }
};

module.exports = connectDB;
