const Candidate = require('../models/Candidate');
const path = require('path');
const fs = require('fs');

// Upload a document for a candidate
const uploadDocument = async (req, res, next) => {
    try {
        console.log('Upload document request received');
        console.log('Request params:', req.params);
        console.log('Request file:', req.file ? {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        } : 'No file');
        console.log('Request body:', req.body);
        console.log('Request user:', req.user ? { id: req.user._id, email: req.user.email, role: req.user.role } : 'No user');
        
        const { candidateId } = req.params;
        const file = req.file;
        
        if (!file) {
            console.error('No file in request');
            return res.status(400).json({ message: 'Nuk u zgjodh asnjë skedar. Ju lutem zgjidhni një skedar për të ngarkuar.' });
        }
        
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
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
        const documentName = req.body.name || path.basename(file.originalname, path.extname(file.originalname));
        
        // Add document to candidate
        const newDocument = {
            name: documentName,
            type: documentType,
            uploadDate: new Date(),
            uploadedBy: req.user._id,
            filePath: file.path,
            fileSize: file.size,
            originalName: file.originalname
        };
        
        candidate.documents.push(newDocument);
        await candidate.save();
        
        // Populate uploadedBy field with role information
        const populatedCandidate = await Candidate.findById(candidateId)
            .populate('documents.uploadedBy', 'firstName lastName email role');
        
        const uploadedDoc = populatedCandidate.documents[populatedCandidate.documents.length - 1];
        
        res.status(201).json({
            message: 'Document uploaded successfully',
            document: uploadedDoc
        });
    } catch (err) {
        console.error('Error uploading document:', err);
        console.error('Error stack:', err.stack);
        // Delete file if there was an error
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) {
                console.error('Error deleting file:', unlinkErr);
            }
        }
        
        // Provide more specific error messages
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Të dhënat e dokumentit nuk janë të vlefshme: ' + err.message
            });
        }
        
        if (err.name === 'CastError') {
            return res.status(400).json({
                message: 'ID e kandidatit nuk është e vlefshme'
            });
        }
        
        // Default error response
        res.status(500).json({
            message: err.message || 'Dështoi ngarkimi i dokumentit. Ju lutem provoni përsëri.'
        });
    }
};

// Get all documents for a candidate
const getDocuments = async (req, res, next) => {
    try {
        const { candidateId } = req.params;
        
        const candidate = await Candidate.findById(candidateId)
            .populate('documents.uploadedBy', 'firstName lastName email role')
            .select('documents');
        
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        res.json(candidate.documents || []);
    } catch (err) {
        next(err);
    }
};

// Get a specific document
const getDocument = async (req, res, next) => {
    try {
        const { candidateId, documentId } = req.params;
        
        const candidate = await Candidate.findById(candidateId)
            .populate('documents.uploadedBy', 'firstName lastName email role');
        
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const document = candidate.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        res.json(document);
    } catch (err) {
        next(err);
    }
};

// Download a document file
const downloadDocument = async (req, res, next) => {
    try {
        const { candidateId, documentId } = req.params;
        
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const document = candidate.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        const filePath = document.filePath;
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
        
        // Don't use Connection: close header as it can cause issues with proxy
        // Send file using res.sendFile which handles streaming better
        res.sendFile(path.resolve(filePath), (err) => {
            if (err) {
                console.error('Error sending file:', err);
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error downloading file' });
                }
            }
        });
    } catch (err) {
        console.error('Error in downloadDocument:', err);
        next(err);
    }
};

// Delete a document (admin only)
const deleteDocument = async (req, res, next) => {
    try {
        const { candidateId, documentId } = req.params;
        
        const candidate = await Candidate.findById(candidateId);
        if (!candidate) {
            return res.status(404).json({ message: 'Candidate not found' });
        }
        
        const document = candidate.documents.id(documentId);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }
        
        // Delete file from filesystem
        const filePath = document.filePath;
        if (fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (unlinkErr) {
                console.error('Error deleting file:', unlinkErr);
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
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Document name is required' });
        }
        
        const candidate = await Candidate.findById(candidateId);
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
        
        const populatedCandidate = await Candidate.findById(candidateId)
            .populate('documents.uploadedBy', 'firstName lastName email role');
        
        const updatedDoc = populatedCandidate.documents.id(documentId);
        
        res.json({
            message: 'Document updated successfully',
            document: updatedDoc
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

