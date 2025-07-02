/**
 * Input validation utilities for EVA ERP Assistant
 */

const validateMessage = (message) => {
  const errors = [];
  
  if (!message) {
    errors.push('Message is required');
    return { isValid: false, errors };
  }
  
  if (typeof message !== 'string') {
    errors.push('Message must be a string');
  }
  
  if (message.trim().length === 0) {
    errors.push('Message cannot be empty');
  }
  
  if (message.length > 10000) {
    errors.push('Message too long (max 10,000 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: message.trim()
  };
};

const validatePersona = (persona) => {
  const validPersonas = [
    'sap_consultant',
    'oracle_specialist', 
    'dynamics_expert',
    'erp_architect',
    'implementation_lead'
  ];
  
  if (!persona) {
    return { isValid: true, sanitized: 'sap_consultant' }; // Default
  }
  
  if (!validPersonas.includes(persona)) {
    return {
      isValid: false,
      errors: [`Invalid persona. Must be one of: ${validPersonas.join(', ')}`],
      sanitized: 'sap_consultant'
    };
  }
  
  return { isValid: true, sanitized: persona };
};

const validateFileUpload = (file) => {
  const errors = [];
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push('Invalid file type. Allowed: PDF, DOC, DOCX, TXT, XLS, XLSX');
  }
  
  if (file.size > maxSize) {
    errors.push('File too large (max 10MB)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateRequirements = (requirements) => {
  const errors = [];
  
  if (!requirements || typeof requirements !== 'object') {
    errors.push('Requirements must be an object');
    return { isValid: false, errors };
  }
  
  const required = ['businessType', 'currentSystem', 'requirements'];
  const missing = required.filter(field => !requirements[field]);
  
  if (missing.length > 0) {
    errors.push(`Missing required fields: ${missing.join(', ')}`);
  }
  
  if (requirements.requirements && requirements.requirements.length === 0) {
    errors.push('At least one requirement must be specified');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      businessType: requirements.businessType?.trim(),
      currentSystem: requirements.currentSystem?.trim(),
      requirements: requirements.requirements || [],
      budget: requirements.budget?.trim(),
      timeline: requirements.timeline?.trim(),
      teamSize: requirements.teamSize
    }
  };
};

const validateCodeRequest = (request) => {
  const errors = [];
  
  if (!request || typeof request !== 'object') {
    errors.push('Code request must be an object');
    return { isValid: false, errors };
  }
  
  if (!request.codeType) {
    errors.push('Code type is required');
  }
  
  if (!request.description) {
    errors.push('Description is required');
  }
  
  const validCodeTypes = ['abap', 'workflow', 'config', 'report', 'enhancement'];
  if (request.codeType && !validCodeTypes.includes(request.codeType)) {
    errors.push(`Invalid code type. Must be one of: ${validCodeTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      codeType: request.codeType,
      description: request.description?.trim(),
      module: request.module?.trim(),
      complexity: request.complexity || 'medium'
    }
  };
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  // Remove potentially harmful scripts
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

const validateConversationId = (conversationId) => {
  if (!conversationId) {
    return { isValid: true, sanitized: null };
  }
  
  // UUID v4 format check
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(conversationId)) {
    return {
      isValid: false,
      errors: ['Invalid conversation ID format'],
      sanitized: null
    };
  }
  
  return { isValid: true, sanitized: conversationId };
};

const validateExportRequest = (request) => {
  const errors = [];
  
  if (!request || typeof request !== 'object') {
    errors.push('Export request must be an object');
    return { isValid: false, errors };
  }
  
  if (!request.conversationId) {
    errors.push('Conversation ID is required');
  }
  
  const validFormats = ['pdf', 'docx', 'json'];
  if (!request.format || !validFormats.includes(request.format)) {
    errors.push(`Invalid format. Must be one of: ${validFormats.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      conversationId: request.conversationId,
      format: request.format,
      includeCode: request.includeCode || false,
      includeAnalysis: request.includeAnalysis || true
    }
  };
};
// Add this function to your existing validators.js file before module.exports

const validateChatInput = (data) => {
  const errors = [];
  
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid request data']
    };
  }

  // Validate message using existing validateMessage function
  const messageValidation = validateMessage(data.message);
  if (!messageValidation.isValid) {
    errors.push(...messageValidation.errors);
  }

  // Validate persona using existing validatePersona function
  const personaValidation = validatePersona(data.persona);
  if (!personaValidation.isValid) {
    errors.push(...personaValidation.errors);
  }

  // Validate conversationId using existing function
  const conversationValidation = validateConversationId(data.sessionId || data.conversationId);
  if (!conversationValidation.isValid) {
    errors.push(...conversationValidation.errors);
  }

  // Validate context (optional)
  if (data.context && typeof data.context !== 'object') {
    errors.push('Context must be an object');
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    sanitized: {
      message: messageValidation.sanitized || data.message,
      persona: personaValidation.sanitized,
      sessionId: conversationValidation.sanitized,
      context: data.context
    }
  };
};

// Update your module.exports to include the new function:
module.exports = {
  validateMessage,
  validatePersona,
  validateFileUpload,
  validateRequirements,
  validateCodeRequest,
  validateConversationId,
  validateExportRequest,
  validateChatInput,  // Add this line
  sanitizeInput
};