// Basic 404 handler
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        message: 'Resource not found'
    });
};

// Centralized error handler
const errorHandler = (err, req, res, _next) => {
    console.error('Error:', err);
    const status = err.status || 500;
    res.status(status).json({
        message: err.message || 'Something went wrong',
        errors: err.errors || undefined
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};



