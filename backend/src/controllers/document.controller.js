const Candidate = require('../models/Candidate');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Helper function to sanitize document data (remove sensitive fields)
const sanitizeDocument = (doc) => {
    if (!doc) return null;
    const docObj = doc.toObject ? doc.toObject() : doc;
    // Remove sensitive fields: filePath, fileSize, originalName
    const { filePath, fileSize, originalName, ...sanitized } = docObj;
    
    // Sanitize uploadedBy field if it exists (remove email)
    if (sanitized.uploadedBy && typeof sanitized.uploadedBy === 'object') {
        const { email, ...userData } = sanitized.uploadedBy;
        sanitized.uploadedBy = userData;
    }
    
    return sanitized;
};

// Helper function to validate ObjectId
const isValidObjectId = (id) => {
    return mongoose.Types.ObjectId.isValid(id) && (new mongoose.Types.ObjectId(id)).toString() === id;
};

// Upload a document for a candidate
const uploadDocument = async (req, res, next) => {
    try {
        const { candidateId } = req.params;
        const file = req.file;
        
        // Validate candidateId
        if (!isValidObjectId(candidateId)) {
            if (file && file.path) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ message: 'ID e kandidatit nuk është e vlefshme' });
        }
        
        if (!file) {
            return res.status(400).json({ message: 'Nuk u zgjodh asnjë skedar. Ju lutem zgjidhni një skedar për të ngarkuar.' });
        }
        
        // Verify candidate exists (only check _id to avoid exposing candidate data)
        const candidateExists = await Candidate.findById(candidateId)
            .select('_id');
        
        if (!candidateExists) {
            // Delete uploaded file if candidate doesn't exist
            if (file.path) {
                fs.unlinkSync(file.path);
            }
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        // Determine file type from extension
        const ext = path.extname(file.originalname).toUpperCase().replace('.', '');
        let documentType = 'PDF';
        if (ext === 'JPG' || ext === 'JPEG') {
            documentType = 'JPG';
        } else if (ext === 'PNG') {
            documentType = 'PNG';
        } else if (ext === 'DOCX') {
            documentType = 'DOCX';
        } else if (ext === 'PDF') {
            documentType = 'PDF';
        } else {
            // Delete file if type is not supported
            if (file.path) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ message: 'Unsupported file type' });
        }
        
        // Get document name from request body or use original filename
        let documentName = req.body.name || path.basename(file.originalname, path.extname(file.originalname));
        
        // Validate document name
        if (!documentName || !documentName.trim()) {
            if (file.path) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ message: 'Document name is required' });
        }
        
        // Validate document name length
        documentName = documentName.trim();
        if (documentName.length > 255) {
            if (file.path) {
                fs.unlinkSync(file.path);
            }
            return res.status(400).json({ message: 'Document name is too long (max 255 characters)' });
        }
        
        // Add document to candidate using $push to avoid loading full candidate object
        const newDocument = {
            name: documentName,
            type: documentType,
            uploadDate: new Date(),
            uploadedBy: req.user._id,
            filePath: file.path,
            fileSize: file.size,
            originalName: file.originalname
        };
        
        // Use findByIdAndUpdate with $push to add document without exposing candidate data
        await Candidate.findByIdAndUpdate(
            candidateId,
            { $push: { documents: newDocument } },
            { new: false } // Don't return the updated document to avoid exposing data
        );
        
        // Populate uploadedBy field with role information (exclude email for security)
        // Use select to only fetch documents field to avoid exposing candidate data
        const populatedCandidate = await Candidate.findById(candidateId)
            .select('documents')
            .populate('documents.uploadedBy', 'firstName lastName role');
        
        const uploadedDoc = populatedCandidate.documents[populatedCandidate.documents.length - 1];
        
        res.status(201).json({
            message: 'Document uploaded successfully',
            document: sanitizeDocument(uploadedDoc)
        });
    } catch (err) {
        // Delete file if there was an error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
                // Silently handle file deletion errors
            }
        }
        
        // Provide more specific error messages (without exposing internal details)
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Të dhënat e dokumentit nuk janë të vlefshme'
            });
        }
        
        if (err.name === 'CastError') {
            return res.status(400).json({
                message: 'ID e kandidatit nuk është e vlefshme'
            });
        }
        
        // Default error response (don't expose internal error details)
        res.status(500).json({
            message: 'Dështoi ngarkimi i dokumentit. Ju lutem provoni përsëri.'
        });
    }
};

// Get all documents for a candidate
const getDocuments = async (req, res, next) => {
    try {
        const { candidateId } = req.params;
        
        // Validate candidateId
        if (!isValidObjectId(candidateId)) {
            return res.status(400).json({ message: 'ID e kandidatit nuk është e vlefshme' });
        }
        
        const candidate = await Candidate.findById(candidateId)
            .populate('documents.uploadedBy', 'firstName lastName role')
            .select('documents');
        
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        // Sanitize documents before sending
        const sanitizedDocuments = (candidate.documents || []).map(doc => sanitizeDocument(doc));
        res.json(sanitizedDocuments);
    } catch (err) {
        next(err);
    }
};

// Get a specific document
const getDocument = async (req, res, next) => {
    try {
        const { candidateId, documentId } = req.params;
        
        // Validate IDs
        if (!isValidObjectId(candidateId)) {
            return res.status(400).json({ message: 'ID e kandidatit nuk është e vlefshme' });
        }
        if (!isValidObjectId(documentId)) {
            return res.status(400).json({ message: 'ID e dokumentit nuk është e vlefshme' });
        }
        
        // Use select to only fetch documents field to avoid exposing candidate data
        const candidate = await Candidate.findById(candidateId)
            .select('documents')
            .populate('documents.uploadedBy', 'firstName lastName role');
        
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const document = candidate.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        res.json(sanitizeDocument(document));
    } catch (err) {
        next(err);
    }
};

// Download a document file
const downloadDocument = async (req, res, next) => {
    try {
        const { candidateId, documentId } = req.params;
        
        // Validate IDs
        if (!isValidObjectId(candidateId)) {
            return res.status(400).json({ message: 'ID e kandidatit nuk është e vlefshme' });
        }
        if (!isValidObjectId(documentId)) {
            return res.status(400).json({ message: 'ID e dokumentit nuk është e vlefshme' });
        }
        
        // Use select to only fetch documents field to avoid exposing candidate data
        const candidate = await Candidate.findById(candidateId)
            .select('documents');
        
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const document = candidate.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        const filePath = document.filePath;
        
        // Security: Validate that filePath is within the uploads directory to prevent path traversal
        const uploadsDir = path.join(__dirname, '../../uploads/documents');
        const resolvedFilePath = path.resolve(filePath);
        const resolvedUploadsDir = path.resolve(uploadsDir);
        
        if (!resolvedFilePath.startsWith(resolvedUploadsDir)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found on server' });
        }
        
        // Determine content type based on file extension
        const ext = path.extname(document.originalName).toLowerCase();
        const contentTypeMap = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        };
        
        const contentType = contentTypeMap[ext] || 'application/octet-stream';
        
        // Set headers for proper file download
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(document.originalName)}"`);
        
        // Get file size
        const stats = fs.statSync(filePath);
        const fileSize = document.fileSize || stats.size;
        res.setHeader('Content-Length', fileSize);
        
        // Send file using res.sendFile which handles streaming better
        res.sendFile(path.resolve(filePath), (err) => {
            if (err) {
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error downloading file' });
                }
            }
        });
    } catch (err) {
        next(err);
    }
};

// Delete a document (admin only)
const deleteDocument = async (req, res, next) => {
    try {
        const { candidateId, documentId } = req.params;
        
        // Validate IDs
        if (!isValidObjectId(candidateId)) {
            return res.status(400).json({ message: 'ID e kandidatit nuk është e vlefshme' });
        }
        if (!isValidObjectId(documentId)) {
            return res.status(400).json({ message: 'ID e dokumentit nuk është e vlefshme' });
        }
        
        // Use select to only fetch documents field to avoid exposing candidate data
        const candidate = await Candidate.findById(candidateId)
            .select('documents');
        
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const document = candidate.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        // Delete file from filesystem
        const filePath = document.filePath;
        
        // Security: Validate that filePath is within the uploads directory to prevent path traversal
        const uploadsDir = path.join(__dirname, '../../uploads/documents');
        const resolvedFilePath = path.resolve(filePath);
        const resolvedUploadsDir = path.resolve(uploadsDir);
        
        if (resolvedFilePath.startsWith(resolvedUploadsDir) && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkErr) {
                // Continue even if file deletion fails
            }
        }
        
        // Remove document from candidate
        candidate.documents.pull(documentId);
        await candidate.save();
        
        res.json({ message: 'Document deleted successfully' });
    } catch (err) {
        next(err);
    }
};

// Update document name (admin only)
const updateDocument = async (req, res, next) => {
    try {
        const { candidateId, documentId } = req.params;
        const { name } = req.body;
        
        // Validate IDs
        if (!isValidObjectId(candidateId)) {
            return res.status(400).json({ message: 'ID e kandidatit nuk është e vlefshme' });
        }
        if (!isValidObjectId(documentId)) {
            return res.status(400).json({ message: 'ID e dokumentit nuk është e vlefshme' });
        }
        
        // Validate name
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Document name is required' });
        }
        
        // Validate name length
        if (name.trim().length > 255) {
            return res.status(400).json({ message: 'Document name is too long (max 255 characters)' });
        }
        
        // Use select to only fetch documents field to avoid exposing candidate data
        const candidate = await Candidate.findById(candidateId)
            .select('documents');
        
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const document = candidate.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        document.name = name.trim();
        document.updatedDate = new Date();
        await candidate.save();
        
        // Use select to only fetch documents field to avoid exposing candidate data
        const populatedCandidate = await Candidate.findById(candidateId)
            .select('documents')
            .populate('documents.uploadedBy', 'firstName lastName role');
        
        const updatedDoc = populatedCandidate.documents.id(documentId);
        
        res.json({
            message: 'Document updated successfully',
            document: sanitizeDocument(updatedDoc)
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    uploadDocument,
    getDocuments,
    getDocument,
    downloadDocument,
    deleteDocument,
    updateDocument
};


