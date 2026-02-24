const path = require('path');
const fs = require('fs');
const multer = require('multer');

const ALLOWED_MIMES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
};

const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'candidates');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const candidateId = req.params.id || req.params.candidateId || 'temp';
    const dir = path.join(uploadsDir, String(candidateId));
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      return cb(e);
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || (file.mimetype === 'application/pdf' ? '.pdf' : '.bin');
    const base = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    const name = base ? `${Date.now()}-${base}` : `${Date.now()}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIMES[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Lloji i skedarit nuk lejohet. Përdorni PDF, JPG, PNG ose DOCX.'), false);
  }
};

const candidateDocumentUpload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter,
});

module.exports = { candidateDocumentUpload, ALLOWED_MIMES, uploadsDir };
