/**
 * CORS configuration for EVA ERP Assistant
 */

const cors = require('cors');

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      // Add your production domains here
      process.env.FRONTEND_URL,
      process.env.ALLOWED_ORIGIN
    ].filter(Boolean); // Remove undefined values
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Development mode - allow all origins
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS: Blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  
  credentials: true,
  
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Session-ID',
    'X-API-Key',
    'Cache-Control'
  ],
  
  exposedHeaders: [
    'X-Session-ID',
    'X-Rate-Limit-Remaining',
    'X-Rate-Limit-Reset'
  ],
  
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  
  maxAge: 86400 // 24 hours
};

// Create CORS middleware
const corsMiddleware = cors(corsOptions);

// Handle preflight requests
const handlePreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  next();
};

// Custom CORS handler for specific routes
const customCors = (allowedOrigins = []) => {
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };
};

// CORS error handler
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS: Origin not allowed',
      origin: req.headers.origin
    });
  }
  next(err);
};

// Security headers for CORS
const securityCors = (req, res, next) => {
  // Prevent CSRF attacks
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  // Check for potential CSRF
  if (req.method !== 'GET' && req.method !== 'OPTIONS') {
    if (origin && referer) {
      try {
        const originUrl = new URL(origin);
        const refererUrl = new URL(referer);
        
        if (originUrl.hostname !== refererUrl.hostname) {
          console.warn(`CORS Security: Origin/Referer mismatch - Origin: ${origin}, Referer: ${referer}`);
        }
      } catch (error) {
        console.warn('CORS Security: Invalid Origin or Referer URL');
      }
    }
  }
  
  // Add security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'SAMEORIGIN');
  res.header('X-XSS-Protection', '1; mode=block');
  
  next();
};

// Development CORS (allows all origins)
const developmentCors = cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: corsOptions.allowedHeaders,
  exposedHeaders: corsOptions.exposedHeaders
});

// Production CORS (strict)
const productionCors = cors(corsOptions);

// Export appropriate CORS configuration based on environment
const configureCors = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('CORS: Using development configuration (all origins allowed)');
    return developmentCors;
  } else {
    console.log('CORS: Using production configuration (restricted origins)');
    return productionCors;
  }
};

module.exports = {
  corsMiddleware,
  handlePreflight,
  customCors,
  corsErrorHandler,
  securityCors,
  developmentCors,
  productionCors,
  configureCors,
  corsOptions
};