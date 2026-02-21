// Basic 404 handler
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        message: 'Resource not found'
    });
};

// Centralized error handler
const errorHandler = (err, req, res, _next) => {
    // Don't log sensitive error details in production
    
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
            message: 'Tipi i skedarit nuk lejohet. Tipet e lejuara: PDF, JPG, PNG, DOCX'
        });
    }
    
    // Handle validation errors without exposing internal details
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Të dhënat e dërguara nuk janë të vlefshme'
        });
    }
    
    // Handle cast errors (invalid ObjectId, etc.)
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'ID e dërguar nuk është e vlefshme'
        });
    }
    
    const status = err.status || err.statusCode || 500;
    
    // Don't expose internal error details in production
    // Always use generic messages to avoid exposing sensitive information
    res.status(status).json({
        message: 'Diçka shkoi keq. Ju lutem provoni përsëri.'
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};



