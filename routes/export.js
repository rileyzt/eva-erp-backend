const express = require('express');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');
const conversationMemory = require('../services/conversationMemory');
const { generatePDFReport, generateWordReport } = require('../utils/exportHelpers');
const logger = require('../utils/logger');

const router = express.Router();

// Export conversation as JSON
router.post('/conversation/json', async (req, res) => {
  try {
    const { sessionId, includeMetadata = true } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required',
        message: 'Please provide a session ID'
      });
    }

    const memory = conversationMemory.getMemory(sessionId);
    
    if (!memory.messages || memory.messages.length === 0) {
      return res.status(404).json({
        error: 'No conversation found',
        message: 'No conversation history found for this session'
      });
    }

    const exportData = {
      sessionId,
      exportedAt: new Date().toISOString(),
      conversation: {
        messages: memory.messages,
        messageCount: memory.messages.length,
        createdAt: memory.createdAt,
        lastActivity: memory.lastActivity
      }
    };

    if (includeMetadata) {
      exportData.metadata = {
        version: '1.0',
        format: 'JSON',
        source: 'EVA ERP Assistant'
      };
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="eva-conversation-${sessionId}.json"`);
    res.json(exportData);

  } catch (error) {
    logger.error('JSON export error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: 'Unable to export conversation as JSON'
    });
  }
});

// Export conversation as PDF
router.post('/conversation/pdf', async (req, res) => {
  try {
    const { 
      sessionId, 
      title = 'EVA ERP Consultation Report',
      includeAnalysis = true,
      includeRecommendations = true
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required',
        message: 'Please provide a session ID'
      });
    }

    const memory = conversationMemory.getMemory(sessionId);
    
    if (!memory.messages || memory.messages.length === 0) {
      return res.status(404).json({
        error: 'No conversation found',
        message: 'No conversation history found for this session'
      });
    }

    const pdfBuffer = await generatePDFReport({
      sessionId,
      title,
      messages: memory.messages,
      includeAnalysis,
      includeRecommendations,
      metadata: {
        createdAt: memory.createdAt,
        lastActivity: memory.lastActivity,
        messageCount: memory.messages.length
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="eva-report-${sessionId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    logger.error('PDF export error:', error);
    res.status(500).json({
      error: 'PDF export failed',
      message: 'Unable to generate PDF report'
    });
  }
});

// Export conversation as Word document
router.post('/conversation/word', async (req, res) => {
  try {
    const { 
      sessionId, 
      title = 'EVA ERP Consultation Report',
      includeAnalysis = true,
      includeRecommendations = true
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID required',
        message: 'Please provide a session ID'
      });
    }

    const memory = conversationMemory.getMemory(sessionId);
    
    if (!memory.messages || memory.messages.length === 0) {
      return res.status(404).json({
        error: 'No conversation found',
        message: 'No conversation history found for this session'
      });
    }

    const wordBuffer = await generateWordReport({
      sessionId,
      title,
      messages: memory.messages,
      includeAnalysis,
      includeRecommendations,
      metadata: {
        createdAt: memory.createdAt,
        lastActivity: memory.lastActivity,
        messageCount: memory.messages.length
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="eva-report-${sessionId}.docx"`);
    res.send(wordBuffer);

  } catch (error) {
    logger.error('Word export error:', error);
    res.status(500).json({
      error: 'Word export failed',
      message: 'Unable to generate Word document'
    });
  }
});

// Export ERP analysis report
router.post('/erp-analysis', async (req, res) => {
  try {
    const { 
      sessionId,
      format = 'pdf',
      analysisData,
      title = 'ERP Requirements Analysis Report'
    } = req.body;

    if (!sessionId && !analysisData) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Please provide either session ID or analysis data'
      });
    }

    let reportData;
    
    if (sessionId) {
      const memory = conversationMemory.getMemory(sessionId);
      // Extract ERP analysis from conversation
      reportData = extractERPAnalysis(memory.messages);
    } else {
      reportData = analysisData;
    }

    let buffer;
    let contentType;
    let filename;

    if (format === 'pdf') {
      buffer = await generatePDFReport({
        sessionId: sessionId || uuidv4(),
        title,
        analysisData: reportData,
        type: 'erp-analysis'
      });
      contentType = 'application/pdf';
      filename = `erp-analysis-${sessionId || 'report'}.pdf`;
    } else if (format === 'word') {
      buffer = await generateWordReport({
        sessionId: sessionId || uuidv4(),
        title,
        analysisData: reportData,
        type: 'erp-analysis'
      });
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `erp-analysis-${sessionId || 'report'}.docx`;
    } else {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Supported formats: pdf, word'
      });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);

  } catch (error) {
    logger.error('ERP analysis export error:', error);
    res.status(500).json({
      error: 'Export failed',
      message: 'Unable to export ERP analysis report'
    });
  }
});

// Export code generation results
router.post('/code', async (req, res) => {
  try {
    const { 
      sessionId,
      codeData,
      format = 'zip',
      language = 'ABAP'
    } = req.body;

    if (!sessionId && !codeData) {
      return res.status(400).json({
        error: 'Missing data',
        message: 'Please provide either session ID or code data'
      });
    }

    let exportData;
    
    if (sessionId) {
      const memory = conversationMemory.getMemory(sessionId);
      exportData = extractCodeGenerationResults(memory.messages);
    } else {
      exportData = codeData;
    }

    if (format === 'zip') {
      const zipBuffer = await createCodeZip(exportData, language);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="eva-code-${sessionId || 'export'}.zip"`);
      res.send(zipBuffer);
    } else {
      return res.status(400).json({
        error: 'Invalid format',
        message: 'Only ZIP format is supported for code export'
      });
    }

  } catch (error) {
    logger.error('Code export error:', error);
    res.status(500).json({
      error: 'Code export failed',
      message: 'Unable to export generated code'
    });
  }
});

// Get export history
router.get('/history/:sessionId?', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // This would typically come from a database
    // For now, return a mock response
    const history = {
      exports: [],
      sessionId: sessionId || 'all',
      retrievedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      history
    });

  } catch (error) {
    logger.error('Export history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve export history',
      message: 'Unable to get export history'
    });
  }
});

// Helper functions
function extractERPAnalysis(messages) {
  const analysisMessages = messages.filter(msg => 
    msg.metadata && msg.metadata.type === 'erp_analysis'
  );
  
  return {
    requirements: [],
    recommendations: [],
    gaps: [],
    implementation: [],
    timeline: null,
    extractedAt: new Date().toISOString()
  };
}

function extractCodeGenerationResults(messages) {
  const codeMessages = messages.filter(msg => 
    msg.metadata && msg.metadata.type === 'code_generation'
  );
  
  return {
    generatedCode: [],
    documentation: [],
    testCases: [],
    extractedAt: new Date().toISOString()
  };
}

async function createCodeZip(codeData, language) {
  return new Promise((resolve, reject) => {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks = [];

    archive.on('data', chunk => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);

    // Add generated code files
    if (codeData.generatedCode && codeData.generatedCode.length > 0) {
      codeData.generatedCode.forEach((code, index) => {
        const extension = getFileExtension(language);
        archive.append(code.content, { name: `generated_code_${index + 1}.${extension}` });
      });
    }

    // Add documentation
    if (codeData.documentation) {
      archive.append(codeData.documentation, { name: 'README.md' });
    }

    // Add test cases
    if (codeData.testCases && codeData.testCases.length > 0) {
      const testContent = codeData.testCases.join('\n\n');
      archive.append(testContent, { name: 'test_cases.txt' });
    }

    archive.finalize();
  });
}

function getFileExtension(language) {
  const extensions = {
    'ABAP': 'abap',
    'JavaScript': 'js',
    'Python': 'py',
    'Java': 'java',
    'C#': 'cs',
    'SQL': 'sql'
  };
  return extensions[language] || 'txt';
}

module.exports = router;