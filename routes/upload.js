const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const documentProcessor = require('../services/documentProcessor');
const { validateFileUpload } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    fs.ensureDirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/plain',
    'text/csv',
    'application/json'
  ];

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.txt', '.csv', '.json'];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 5 // Maximum 5 files at once
  }
});

// Single file upload
router.post('/single', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please select a file to upload'
      });
    }

    const { sessionId, purpose = 'analysis' } = req.body;

    logger.info(`File uploaded: ${req.file.originalname} - ${req.file.size} bytes`);

    // Process the uploaded document
    const processed = await documentProcessor.processDocument(req.file, {
      sessionId,
      purpose
    });

    res.json({
      success: true,
      file: {
        id: processed.id,
        originalName: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      },
      content: processed.content,
      analysis: processed.analysis,
      suggestions: processed.suggestions
    });

  } catch (error) {
    logger.error('File upload error:', error);
    
    // Clean up file if processing failed
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        logger.error('File cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'File processing failed',
      message: error.message || 'Unable to process the uploaded file'
    });
  }
});

// Multiple files upload
router.post('/multiple', upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please select files to upload'
      });
    }

    const { sessionId, purpose = 'analysis' } = req.body;
    const results = [];

    for (const file of req.files) {
      try {
        const processed = await documentProcessor.processDocument(file, {
          sessionId,
          purpose
        });

        results.push({
          success: true,
          file: {
            id: processed.id,
            originalName: file.originalname,
            size: file.size,
            type: file.mimetype,
            uploadedAt: new Date().toISOString()
          },
          content: processed.content,
          analysis: processed.analysis
        });
      } catch (error) {
        logger.error(`Processing failed for ${file.originalname}:`, error);
        
        // Clean up failed file
        try {
          await fs.remove(file.path);
        } catch (cleanupError) {
          logger.error('File cleanup error:', cleanupError);
        }

        results.push({
          success: false,
          file: {
            originalName: file.originalname,
            error: error.message
          }
        });
      }
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: successful.length > 0,
      processed: successful.length,
      failed: failed.length,
      results,
      summary: successful.length > 0 ? 
        await documentProcessor.generateSummary(successful.map(r => r.content)) : 
        null
    });

  } catch (error) {
    logger.error('Multiple file upload error:', error);
    res.status(500).json({
      error: 'File processing failed',
      message: 'Unable to process the uploaded files'
    });
  }
});

// Get file content
router.get('/content/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    const content = await documentProcessor.getFileContent(fileId);

    if (!content) {
      return res.status(404).json({
        error: 'File not found',
        message: 'The requested file was not found'
      });
    }

    res.json({
      success: true,
      content,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get file content error:', error);
    res.status(500).json({
      error: 'Failed to retrieve file content',
      message: 'Unable to get file content'
    });
  }
});

// Delete uploaded file
router.delete('/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params;
    await documentProcessor.deleteFile(fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    logger.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      message: 'Unable to delete the file'
    });
  }
});

// Get upload history
router.get('/history/:sessionId?', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const history = await documentProcessor.getUploadHistory(sessionId);

    res.json({
      success: true,
      history,
      retrievedAt: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Get upload history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve upload history',
      message: 'Unable to get upload history'
    });
  }
});

// Analyze document for ERP requirements
router.post('/analyze-erp', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a document for ERP analysis'
      });
    }

    const { sessionId, erpFocus = 'general' } = req.body;

    const analysis = await documentProcessor.analyzeForERP(req.file, {
      sessionId,
      erpFocus
    });

    res.json({
      success: true,
      analysis,
      recommendations: analysis.recommendations,
      requirements: analysis.requirements,
      gaps: analysis.gaps
    });

  } catch (error) {
    logger.error('ERP analysis error:', error);
    
    if (req.file && req.file.path) {
      try {
        await fs.remove(req.file.path);
      } catch (cleanupError) {
        logger.error('File cleanup error:', cleanupError);
      }
    }

    res.status(500).json({
      error: 'ERP analysis failed',
      message: 'Unable to analyze document for ERP requirements'
    });
  }
});

module.exports = router;