// Basic 404 handler
const notFoundHandler = (req, res, _next) => {
    res.status(404).json({
        message: 'Resource not found'
    });
};

// Centralized error handler
const errorHandler = (err, req, res, _next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            message: 'Skedari është shumë i madh. Maksimumi është 15MB'
        });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            message: 'Skedari i papritur. Ju lutem përdorni fushën "file"'
        });
    }
    if (err.message && (err.message.includes('File type not allowed') || err.message.includes('Lloji i skedarit'))) {
        return res.status(400).json({
            message: 'Tipi i skedarit nuk lejohet. Tipet e lejuara: PDF, JPG, PNG, DOCX'
        });
    }
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Të dhënat e dërguara nuk janë të vlefshme'
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({
            message: 'ID e dërguar nuk është e vlefshme'
        });
    }
    const status = err.status || err.statusCode || 500;
    res.status(status).json({
        message: err.message || 'Diçka shkoi keq. Ju lutem provoni përsëri.'
    });
};

module.exports = {
    notFoundHandler,
    errorHandler
};



