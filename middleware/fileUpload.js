/**
 * File upload middleware for EVA ERP Assistant
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Create session-specific directory
    const sessionId = req.user?.sessionId || 'anonymous';
    const sessionDir = path.join(uploadsDir, sessionId);
    
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }
    
    cb(null, sessionDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    const filename = `${timestamp}_${randomString}_${basename}${ext}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, DOC, DOCX, TXT, XLS, XLSX, CSV`), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Maximum 5 files per request
  },
  fileFilter: fileFilter
});

// Single file upload middleware
const uploadSingle = upload.single('document');

// Multiple files upload middleware
const uploadMultiple = upload.array('documents', 5);

// Handle upload errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum is 5 files per upload.'
      });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        error: 'Unexpected file field. Use "document" or "documents" as field name.'
      });
    }
    
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
  
  next();
};

// File validation middleware
const validateUploadedFiles = (req, res, next) => {
  const files = req.files || (req.file ? [req.file] : []);
  
  if (files.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No files uploaded'
    });
  }
  
  // Additional security checks
  for (const file of files) {
    // Check file extension matches MIME type
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;
    
    const validCombinations = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv'
    };
    
    if (validCombinations[ext] && validCombinations[ext] !== mimeType) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      
      return res.status(400).json({
        success: false,
        error: `File extension ${ext} doesn't match MIME type ${mimeType}`
      });
    }
    
    // Check for potentially malicious files
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    if (suspiciousExtensions.includes(ext)) {
      fs.unlinkSync(file.path);
      
      return res.status(400).json({
        success: false,
        error: `File type ${ext} is not allowed for security reasons`
      });
    }
  }
  
  // Add file info to request
  req.uploadedFiles = files.map(file => ({
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
    uploadedAt: new Date().toISOString()
  }));
  
  next();
};

// File cleanup middleware
const cleanupFiles = (req, res, next) => {
  // Add cleanup function to response
  res.cleanupFiles = () => {
    const files = req.uploadedFiles || [];
    files.forEach(file => {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (error) {
        console.error(`Error cleaning up file ${file.path}:`, error);
      }
    });
  };
  
  // Auto cleanup on response end if not explicitly handled
  res.on('finish', () => {
    if (res.statusCode >= 400 && req.uploadedFiles) {
      res.cleanupFiles();
    }
  });
  
  next();
};

// Temporary file cleanup job (run periodically)
const cleanupOldFiles = () => {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const now = Date.now();
  
  const cleanDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        cleanDirectory(filePath);
        
        // Remove empty directories
        try {
          fs.rmdirSync(filePath);
        } catch (error) {
          // Directory not empty, that's ok
        }
      } else if (stats.isFile()) {
        const fileAge = now - stats.mtime.getTime();
        
        if (fileAge > maxAge) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          } catch (error) {
            console.error(`Error cleaning up file ${filePath}:`, error);
          }
        }
      }
    });
  };
  
  cleanDirectory(uploadsDir);
};

// Schedule cleanup every hour
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// Get file info
const getFileInfo = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      modified: stats.mtime,
      isFile: stats.isFile()
    };
  } catch (error) {
    return { exists: false };
  }
};

// Secure file serving
const serveFile = (req, res, next) => {
  const { filename } = req.params;
  const sessionId = req.user?.sessionId;
  
  if (!sessionId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  // Construct safe file path
  const sessionDir = path.join(uploadsDir, sessionId);
  const filePath = path.join(sessionDir, filename);
  
  // Security check: ensure file is within session directory
  const normalizedSessionDir = path.normalize(sessionDir);
  const normalizedFilePath = path.normalize(filePath);
  
  if (!normalizedFilePath.startsWith(normalizedSessionDir)) {
    return res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  }
  
  // Check if file exists
  const fileInfo = getFileInfo(filePath);
  if (!fileInfo.exists || !fileInfo.isFile) {
    return res.status(404).json({
      success: false,
      error: 'File not found'
    });
  }
  
  // Serve file
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error serving file:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error serving file'
        });
      }
    }
  });
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  handleUploadError,
  validateUploadedFiles,
  cleanupFiles,
  cleanupOldFiles,
  getFileInfo,
  serveFile
};