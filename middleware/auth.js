/**
 * Authentication middleware for EVA ERP Assistant
 * Basic security implementation for demonstration
 */

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Simple session-based auth for demo
const authenticateSession = (req, res, next) => {
  // For demo purposes, we'll use a simple session check
  // In production, implement proper authentication
  
  const sessionId = req.headers['x-session-id'] || req.body.sessionId;
  
  if (!sessionId) {
    // Generate a new session for first-time users
    const newSessionId = generateSessionId();
    req.sessionId = newSessionId;
    res.setHeader('x-session-id', newSessionId);
  } else {
    req.sessionId = sessionId;
  }
  
  // Add user info to request
  req.user = {
    sessionId: req.sessionId,
    isAuthenticated: true,
    role: 'client' // Default role
  };
  
  next();
};

// Rate limiting middleware
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs, // 15 minutes default
    max, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Chat-specific rate limiting (more restrictive)
const chatRateLimit = createRateLimit(5 * 60 * 1000, 30); // 30 requests per 5 minutes

// File upload rate limiting
const uploadRateLimit = createRateLimit(10 * 60 * 1000, 10); // 10 uploads per 10 minutes

// API key validation (for future use)
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey && process.env.REQUIRE_API_KEY === 'true') {
    return res.status(
      401).json({
      success: false,
      error: 'API key required'
    });
  }
  
  if (apiKey && process.env.VALID_API_KEYS) {
    const validKeys = process.env.VALID_API_KEYS.split(',');
    if (!validKeys.includes(apiKey)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }
  }
  
  next();
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  next();
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CSP for XSS protection
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.groq.com"
  );
  
  next();
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl;
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip} - UA: ${userAgent}`);
  
  // Log response time
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    console.log(`[${timestamp}] ${method} ${url} - ${status} - ${duration}ms`);
  });
  
  next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Request entity too large'
    });
  }
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
  }
  
  // Default error response
  res.status(500).json({
    success: false,
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
};

// Generate session ID
const generateSessionId = () => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return `eva_${timestamp}_${random}`;
};

// Validate session ID format
const isValidSessionId = (sessionId) => {
  return /^eva_\d+_[a-z0-9]+$/.test(sessionId);
};

// Conversation access control
const validateConversationAccess = (req, res, next) => {
  const { conversationId } = req.params;
  const { sessionId } = req.user;
  
  // In a real app, you'd check database permissions
  // For demo, we'll allow access to conversations that start with the session ID
  if (conversationId && !conversationId.startsWith(sessionId.split('_')[1])) {
    return res.status(403).json({
      success: false,
      error: 'Access denied to this conversation'
    });
  }
  
  next();
};

module.exports = {
  authenticateSession,
  chatRateLimit,
  uploadRateLimit,
  validateApiKey,
  sanitizeInput,
  securityHeaders,
  requestLogger,
  errorHandler,
  generateSessionId,
  isValidSessionId,
  validateConversationAccess,
  createRateLimit
};