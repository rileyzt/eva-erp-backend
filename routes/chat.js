const express = require('express');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const groqService = require('../services/groqService');
const erpAnalyzer = require('../services/erpAnalyzer');
const codeGenerator = require('../services/codeGenerator');
const { ConversationMemory } = require('../services/conversationMemory');
const conversationMemory = new ConversationMemory();
const { validateChatInput } = require('../utils/validators');
const logger = require('../utils/logger');

const router = express.Router();

// Rate limiting
const rateLimiter = new RateLimiterMemory({
  keyGenerator: (req) => req.ip,
  points: 50, // Number of requests
  duration: 60, // Per 60 seconds
});

// Apply rate limiting to all chat routes
router.use(async (req, res, next) => {
  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.round(rejRes.msBeforeNext / 1000)
    });
  }
});

// Replace your main POST route (lines 32-85) with this:

router.post('/', async (req, res) => {
  console.log('🚀 CHAT ROUTE STARTED - TOP LEVEL');
  
  try {
    console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
    
    // Skip validation for now to test
    console.log('⏭️ Skipping validation...');
    
    const { 
      message, 
      sessionId, 
      persona = 'general', 
      context = {},
      conversationHistory = []
    } = req.body;

    console.log('✅ Destructuring completed');
    console.log('📧 Message:', message?.substring(0, 50));
    console.log('🎭 Persona:', persona);
    console.log('🔍 Context:', JSON.stringify(context));

    console.log('📝 Logging with logger...');
    logger.info(`Chat request - Session: ${sessionId}, Persona: ${persona}`);
    console.log('✅ Logger completed');

    console.log('🧠 Getting memory...');
    let memory;
    try {
      const history = conversationMemory.getConversationHistory(sessionId);
      memory = { messages: history };
      console.log('✅ Memory retrieved successfully');
    } catch (memError) {
      console.error('❌ Memory error:', memError.message);
      memory = { messages: [] }; // fallback
    }
    
    console.log('💾 Adding message to memory...');
    try {
      conversationMemory.addMessage(sessionId, message, 'user');
      console.log('✅ Message added to memory');
    } catch (memError) {
      console.error('❌ Add message error:', memError.message);
    }

    console.log('🔍 CHAT ROUTE: About to call groqService.chat');
    console.log('🔍 CHAT ROUTE: context.type =', context.type);

    const response = await groqService.chat(message, {
      persona,
      context,
      conversationHistory: memory.messages || conversationHistory
    });

    console.log('🔍 CHAT ROUTE: groqService.chat completed');
    console.log('📝 Response preview:', response?.content?.substring(0, 100));

    // Try to add response to memory
    try {
      conversationMemory.addMessage(sessionId, response.content, 'assistant');
      console.log('✅ Response added to memory');
    } catch (memError) {
      console.error('❌ Add response error:', memError.message);
    }

    console.log('📤 Sending response...');
    res.json({
      success: true,
      response: response.content,
      metadata: response.metadata || {},
      sessionId,
      suggestions: response.suggestions || []
    });
    console.log('✅ Response sent successfully');

  } catch (error) {
    console.error('💥 CHAT ROUTE ERROR:', error.message);
    console.error('💥 CHAT ROUTE STACK:', error.stack);
    logger.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Chat processing failed',
      message: 'Unable to process your message. Please try again.'
    });
  }
});

// Get conversation history
router.get('/history/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const memory = conversationMemory.getMemory(sessionId);
    
    res.json({
      success: true,
      history: memory.messages || [],
      sessionInfo: {
        sessionId,
        createdAt: memory.createdAt,
        lastActivity: memory.lastActivity,
        messageCount: memory.messages?.length || 0
      }
    });
  } catch (error) {
    logger.error('History endpoint error:', error);
    res.status(500).json({
      error: 'Failed to retrieve history',
      message: 'Unable to get conversation history'
    });
  }
});

// Clear conversation
router.delete('/clear/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    conversationMemory.clearMemory(sessionId);
    
    res.json({
      success: true,
      message: 'Conversation cleared successfully'
    });
  } catch (error) {
    logger.error('Clear conversation error:', error);
    res.status(500).json({
      error: 'Failed to clear conversation',
      message: 'Unable to clear conversation history'
    });
  }
});

// ERP persona-specific endpoint - FIXED
router.post('/erp', validateChatInput, async (req, res) => {
  try {
    // Validation is now handled by middleware - no need to call it here
    const { message, sessionId, erpModule, complexity = 'medium' } = req.body;
    
    const response = await erpAnalyzer.processERPQuery(message, {
      sessionId,
      erpModule,
      complexity
    });

    res.json({
      success: true,
      response: response.content,
      analysis: response.analysis,
      recommendations: response.recommendations,
      nextSteps: response.nextSteps
    });

  } catch (error) {
    logger.error('ERP endpoint error:', error);
    res.status(500).json({
      error: 'ERP processing failed',
      message: 'Unable to process ERP query'
    });
  }
});

// Code generation endpoint
router.post('/generate-code', async (req, res) => {
  try {
    const { 
      requirements, 
      language = 'ABAP', 
      erpSystem = 'SAP', 
      sessionId 
    } = req.body;

    if (!requirements) {
      return res.status(400).json({
        error: 'Missing requirements',
        message: 'Code requirements are required'
      });
    }

    const response = await codeGenerator.generateERPCode({
      requirements,
      language,
      erpSystem,
      sessionId
    });

    res.json({
      success: true,
      code: response.code,
      explanation: response.explanation,
      documentation: response.documentation,
      testCases: response.testCases
    });

  } catch (error) {
    logger.error('Code generation error:', error);
    res.status(500).json({
      error: 'Code generation failed',
      message: 'Unable to generate code'
    });
  }
});

// Get ERP suggestions
router.get('/suggestions/:module?', (req, res) => {
  try {
    const { module } = req.params;
    const suggestions = erpAnalyzer.getSuggestions(module);
    
    res.json({
      success: true,
      suggestions,
      module: module || 'general'
    });
  } catch (error) {
    logger.error('Suggestions endpoint error:', error);
    res.status(500).json({
      error: 'Failed to get suggestions',
      message: 'Unable to retrieve suggestions'
    });
  }
});

module.exports = router;