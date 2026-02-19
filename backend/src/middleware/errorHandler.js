// Basic 404 handler
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        message: 'Resource not found'
    });
};

// Centralized error handler
const errorHandler = (err, req, res, _next) => {
    console.error('Error:', err);
    
    // Handle Multer errors specifically
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: 'Skedari është shumë i madh. Maksimumi është 10MB'
        });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            message: 'Skedari i papritur. Ju lutem përdorni fushën "file"'
        });
    }
    
    // Handle Multer file filter errors
    if (err.message && err.message.includes('File type not allowed')) {
        return res.status(400).json({
            message: err.message
        });
    }
    
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.message || 'Something went wrong',
        errors: err.errors || undefined
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};



