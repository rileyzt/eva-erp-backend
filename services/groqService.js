// Add immediate console.log to see if this file is being loaded
console.log('=== GROQ SERVICE FILE LOADING ===');

const Groq = require('groq-sdk');

// Try to import optional dependencies with error handling
let ChatGroq, HumanMessage, SystemMessage, AIMessage, PromptTemplate, prompts, logger;

try {
  const langchain = require('@langchain/groq');
  ChatGroq = langchain.ChatGroq;
  console.log('✓ @langchain/groq imported successfully');
} catch (error) {
  console.log('✗ @langchain/groq import failed:', error.message);
}

try {
  const langchainCore = require('@langchain/core/messages');
  HumanMessage = langchainCore.HumanMessage;
  SystemMessage = langchainCore.SystemMessage;
  AIMessage = langchainCore.AIMessage;
  console.log('✓ @langchain/core/messages imported successfully');
} catch (error) {
  console.log('✗ @langchain/core/messages import failed:', error.message);
}

try {
  const langchainPrompts = require('@langchain/core/prompts');
  PromptTemplate = langchainPrompts.PromptTemplate;
  console.log('✓ @langchain/core/prompts imported successfully');
} catch (error) {
  console.log('✗ @langchain/core/prompts import failed:', error.message);
}

try {
  prompts = require('../utils/prompts');
  console.log('✓ prompts imported successfully');
} catch (error) {
  console.log('✗ prompts import failed:', error.message);
  // Fallback prompts
  prompts = {
    generalERPPrompt: () => "You are EVA, an expert ERP assistant.",
    sapConsultantPrompt: () => "You are EVA, a SAP consultant.",
    erpAnalystPrompt: () => "You are EVA, an ERP analyst.",
    technicalArchitectPrompt: () => "You are EVA, a technical architect.",
    businessAnalystPrompt: () => "You are EVA, a business analyst.",
    implementationSpecialistPrompt: () => "You are EVA, an implementation specialist.",
    getERPPrompt: (module, complexity, industry) => `You are EVA, an expert ERP assistant specializing in ${module} for ${industry} industry with ${complexity} complexity.`,
    getCodeGenerationPrompt: (language, erpSystem, complexity) => `You are EVA, an expert ${language} developer for ${erpSystem} systems with ${complexity} complexity requirements.`
  };
}

try {
  logger = require('../utils/logger');
  console.log('✓ logger imported successfully');
} catch (error) {
  console.log('✗ logger import failed:', error.message);
  // Fallback logger
  logger = {
    info: console.log,
    error: console.error,
    warn: console.warn
  };
}

console.log('=== CREATING GROQ SERVICE CLASS ===');

class GroqService {
  constructor() {
    console.log('🚀 GroqService constructor called');
    
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is missing!');
      throw new Error('GROQ_API_KEY is required');
    }

    console.log('✓ GROQ_API_KEY found:', process.env.GROQ_API_KEY.substring(0, 10) + '...');

    try {
      this.groq = new Groq({
        apiKey: process.env.GROQ_API_KEY
      });
      console.log('✓ Groq client initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Groq client:', error);
      throw error;
    }

    if (ChatGroq) {
      try {
        this.langChainGroq = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY,
          model: process.env.GROQ_MODEL || 'llama3-70b-8192',
          temperature: 0.7,
          maxTokens: 4000,
          timeout: 60000,
        });
        console.log('✓ LangChain Groq initialized');
      } catch (error) {
        console.error('❌ Failed to initialize LangChain Groq:', error);
        this.langChainGroq = null; // Set to null if initialization fails
      }
    } else {
      this.langChainGroq = null; // Set to null if ChatGroq is not available
    }

    this.defaultModel = process.env.GROQ_MODEL || 'llama3-70b-8192';
    
    logger.info('GroqService initialized successfully');
    console.log('🎉 GroqService constructor completed');
  }

  // Main chat function with enhanced logging and error handling
  async chat(message, options = {}) {
    console.log('📞 CHAT METHOD CALLED');
    console.log('Message:', message?.substring(0, 50) + '...');
    console.log('Options:', JSON.stringify(options, null, 2));
    
    try {
      logger.info('[GROQ] Chat request started');
      console.log('[GROQ] Chat request started - CONSOLE LOG');
      
      const {
        persona = 'general',
        context = {},
        conversationHistory = [],
        maxTokens = 4000,
        temperature = 0.7
      } = options;

      console.log(`[GROQ] Persona: ${persona}, History: ${conversationHistory.length} messages`);

      // Get system prompt
      const systemPrompt = this.getSystemPrompt(persona, context);
      logger.info('[GROQ] System prompt generated');
      
      const messages = this.buildDirectMessages(systemPrompt, conversationHistory, message);
      logger.info(`[GROQ] Messages built - Total: ${messages.length}`);

      // Make API call with timeout
      console.log('🔄 Making API call...');
      const startTime = Date.now();
      
      const response = await Promise.race([
        this.groq.chat.completions.create({
          messages,
          model: this.defaultModel,
          temperature,
          max_tokens: maxTokens,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Groq API timeout after 30 seconds')), 30000)
        )
      ]);

      const responseTime = Date.now() - startTime;
      console.log(`✅ API call completed in ${responseTime}ms`);
      
      const content = response.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content in Groq response');
      }

      console.log(`📝 Response length: ${content?.length || 0} characters`);
      logger.info(`[GROQ] Response content length: ${content.length} characters`);

      // Process response
      const processedResponse = await this.processResponse(content, persona, context);
      logger.info('[GROQ] Response processed successfully');

      return {
        content: processedResponse.content,
        metadata: {
          persona,
          model: this.defaultModel,
          tokensUsed: response.usage?.total_tokens || 0,
          responseTime: responseTime,
          context: context.type || 'general'
        },
        suggestions: processedResponse.suggestions
      };

    } catch (error) {
      console.error('❌ CHAT ERROR:', error.message);
      console.error('❌ CHAT ERROR STACK:', error.stack);
      logger.error('[GROQ] Chat error:', error.message);
      
      // Return error response instead of throwing
      return {
        content: 'I apologize, but I encountered an error processing your request. Please try again.',
        metadata: {
          error: true,
          errorMessage: error.message
        },
        suggestions: []
      };
    }
  }

  // Direct Groq API call for specific use cases
  async directChat(messages, options = {}) {
    try {
      const {
        model = this.defaultModel,
        temperature = 0.7,
        maxTokens = 4000,
        stream = false
      } = options;

      logger.info('[GROQ] Direct chat request started');

      const response = await Promise.race([
        this.groq.chat.completions.create({
          messages,
          model,
          temperature,
          max_tokens: maxTokens,
          stream,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Direct chat timeout after 30 seconds')), 30000)
        )
      ]);

      return stream ? response : response.choices[0]?.message?.content;

    } catch (error) {
      logger.error('Direct Groq chat error:', error);
      throw new Error(`Direct chat failed: ${error.message}`);
    }
  }

  // Stream chat for real-time responses
  async streamChat(message, options = {}, onChunk) {
    try {
      const {
        persona = 'general',
        context = {},
        conversationHistory = []
      } = options;

      logger.info('[GROQ] Stream chat request started');

      const systemPrompt = this.getSystemPrompt(persona, context);
      const messages = this.buildDirectMessages(systemPrompt, conversationHistory, message);

      const stream = await this.groq.chat.completions.create({
        messages,
        model: this.defaultModel,
        temperature: 0.7,
        max_tokens: 4000,
        stream: true
      });

      let fullResponse = '';

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          if (onChunk) onChunk(content);
        }
      }

      return {
        content: fullResponse,
        metadata: {
          persona,
          model: this.defaultModel,
          streamed: true
        }
      };

    } catch (error) {
      logger.error('Stream chat error:', error);
      throw new Error(`Stream chat failed: ${error.message}`);
    }
  }

  // ERP-specific chat
  async erpChat(message, erpContext) {
    try {
      const {
        module = 'general',
        complexity = 'medium',
        industry = 'general',
        sessionId
      } = erpContext;

      logger.info(`[GROQ] ERP chat - Module: ${module}, Industry: ${industry}`);

      const systemPrompt = prompts.getERPPrompt ? 
        prompts.getERPPrompt(module, complexity, industry) :
        `You are EVA, an expert ERP assistant specializing in ${module} for ${industry} industry with ${complexity} complexity.`;
      
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Use direct API call instead of LangChain if LangChain is not available
      let response;
      if (this.langChainGroq && HumanMessage && SystemMessage) {
        const langChainMessages = [
          new SystemMessage(systemPrompt),
          new HumanMessage(message)
        ];
        const langChainResponse = await this.langChainGroq.invoke(langChainMessages);
        response = { content: langChainResponse.content };
      } else {
        const directResponse = await this.directChat(messages);
        response = { content: directResponse };
      }

      // Parse ERP-specific response
      const erpResponse = this.parseERPResponse(response.content, module);

      return {
        content: erpResponse.content,
        analysis: erpResponse.analysis,
        recommendations: erpResponse.recommendations,
        nextSteps: erpResponse.nextSteps,
        metadata: {
          module,
          complexity,
          industry,
          sessionId
        }
      };

    } catch (error) {
      logger.error('ERP chat error:', error);
      throw new Error(`ERP chat failed: ${error.message}`);
    }
  }

  // Code generation chat
  async codeGenerationChat(requirements, codeContext) {
    try {
      const {
        language = 'ABAP',
        erpSystem = 'SAP',
        complexity = 'medium',
        includeTests = true
      } = codeContext;

      logger.info(`[GROQ] Code generation - Language: ${language}, System: ${erpSystem}`);

      const systemPrompt = prompts.getCodeGenerationPrompt ? 
        prompts.getCodeGenerationPrompt(language, erpSystem, complexity) :
        `You are EVA, an expert ${language} developer for ${erpSystem} systems with ${complexity} complexity requirements.`;
      
      const message = `Generate ${language} code for ${erpSystem} with the following requirements:\n\n${requirements}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];

      // Use direct API call instead of LangChain if LangChain is not available
      let response;
      if (this.langChainGroq && HumanMessage && SystemMessage) {
        const langChainMessages = [
          new SystemMessage(systemPrompt),
          new HumanMessage(message)
        ];
        const langChainResponse = await this.langChainGroq.invoke(langChainMessages);
        response = { content: langChainResponse.content };
      } else {
        const directResponse = await this.directChat(messages);
        response = { content: directResponse };
      }

      // Parse code generation response
      const codeResponse = this.parseCodeResponse(response.content, language, includeTests);

      return {
        code: codeResponse.code,
        explanation: codeResponse.explanation,
        documentation: codeResponse.documentation,
        testCases: includeTests ? codeResponse.testCases : null,
        metadata: {
          language,
          erpSystem,
          complexity,
          includeTests
        }
      };

    } catch (error) {
      logger.error('Code generation chat error:', error);
      throw new Error(`Code generation failed: ${error.message}`);
    }
  }

  // Generate simple response (for erpAnalyzer compatibility)
  async generateResponse(prompt, options = {}) {
    try {
      logger.info('[GROQ] Generate response request started');
      
      const response = await this.directChat([
        { role: 'user', content: prompt }
      ], options);
      
      return response;
    } catch (error) {
      logger.error('Generate response error:', error);
      throw new Error(`Response generation failed: ${error.message}`);
    }
  }

  // Helper methods
  getSystemPrompt(persona, context) {
    console.log('🎯 Getting system prompt for persona:', persona);
    try {
      switch (persona) {
        case 'sap_consultant':
          return prompts.sapConsultantPrompt ? prompts.sapConsultantPrompt(context) : 'You are EVA, a SAP consultant.';
        case 'erp_analyst':
          return prompts.erpAnalystPrompt ? prompts.erpAnalystPrompt(context) : 'You are EVA, an ERP analyst.';
        case 'technical_architect':
          return prompts.technicalArchitectPrompt ? prompts.technicalArchitectPrompt(context) : 'You are EVA, a technical architect.';
        case 'business_analyst':
          return prompts.businessAnalystPrompt ? prompts.businessAnalystPrompt(context) : 'You are EVA, a business analyst.';
        case 'implementation_specialist':
          return prompts.implementationSpecialistPrompt ? prompts.implementationSpecialistPrompt(context) : 'You are EVA, an implementation specialist.';
        default:
          return prompts.generalERPPrompt ? prompts.generalERPPrompt(context) : 'You are EVA, an expert ERP assistant.';
      }
    } catch (error) {
      console.log('⚠️ Prompt error, using fallback:', error.message);
      logger.warn('Failed to get specific prompt, using fallback');
      return 'You are EVA, an expert ERP assistant. Help the user with their ERP-related questions.';
    }
  }

  buildMessages(systemPrompt, conversationHistory, currentMessage) {
    if (!HumanMessage || !SystemMessage || !AIMessage) {
      // Fallback to direct messages if LangChain is not available
      return this.buildDirectMessages(systemPrompt, conversationHistory, currentMessage);
    }

    const messages = [new SystemMessage(systemPrompt)];

    // Add conversation history
    conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        messages.push(new HumanMessage(msg.content));
      } else if (msg.role === 'assistant') {
        messages.push(new AIMessage(msg.content));
      }
    });

    // Add current message
    messages.push(new HumanMessage(currentMessage));

    return messages;
  }

  buildDirectMessages(systemPrompt, conversationHistory, currentMessage) {
    const messages = [{ role: 'system', content: systemPrompt }];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });

    // Add current message
    messages.push({ role: 'user', content: currentMessage });

    return messages;
  }

  async processResponse(content, persona, context) {
    // Enhanced response processing based on persona and context
    let suggestions = [];

    try {
      if (persona === 'sap_consultant') {
        suggestions = this.generateSAPSuggestions(content);
      } else if (persona === 'erp_analyst') {
        suggestions = this.generateAnalysisSuggestions(content);
      }
    } catch (error) {
      logger.warn('Error generating suggestions:', error.message);
      suggestions = [];
    }

    return {
      content,
      suggestions
    };
  }

  parseERPResponse(content, module) {
    // Parse ERP-specific response structure
    try {
      // Look for structured sections in the response
      const sections = this.extractSections(content);

      return {
        content: sections.main || content,
        analysis: sections.analysis || null,
        recommendations: sections.recommendations || [],
        nextSteps: sections.nextSteps || []
      };
    } catch (error) {
      logger.warn('ERP response parsing failed, returning raw content');
      return {
        content,
        analysis: null,
        recommendations: [],
        nextSteps: []
      };
    }
  }

  parseCodeResponse(content, language, includeTests) {
    try {
      // Extract code blocks and explanations
      const codeBlocks = this.extractCodeBlocks(content);
      const explanation = this.extractExplanation(content);
      const documentation = this.generateDocumentation(codeBlocks, language);
      const testCases = includeTests ? this.extractTestCases(content) : [];

      return {
        code: codeBlocks.join('\n\n'),
        explanation,
        documentation,
        testCases
      };
    } catch (error) {
      logger.warn('Code response parsing failed, returning raw content');
      return {
        code: content,
        explanation: 'Generated code with explanation',
        documentation: 'See code comments for documentation',
        testCases: []
      };
    }
  }

  extractSections(content) {
    const sections = {};
    
    try {
      // Simple section extraction logic
      const lines = content.split('\n');
      let currentSection = 'main';
      let currentContent = [];

      lines.forEach(line => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('analysis:') || lowerLine.includes('## analysis')) {
          sections[currentSection] = currentContent.join('\n');
          currentSection = 'analysis';
          currentContent = [];
        } else if (lowerLine.includes('recommendations:') || lowerLine.includes('## recommendations')) {
          sections[currentSection] = currentContent.join('\n');
          currentSection = 'recommendations';
          currentContent = [];
        } else if (lowerLine.includes('next steps:') || lowerLine.includes('## next steps')) {
          sections[currentSection] = currentContent.join('\n');
          currentSection = 'nextSteps';
          currentContent = [];
        } else {
          currentContent.push(line);
        }
      });

      sections[currentSection] = currentContent.join('\n');
    } catch (error) {
      logger.warn('Section extraction error:', error.message);
      sections.main = content;
    }

    return sections;
  }

  extractCodeBlocks(content) {
    try {
      const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/g;
      const codeBlocks = [];
      let match;

      while ((match = codeBlockRegex.exec(content)) !== null) {
        codeBlocks.push(match[1]);
      }

      return codeBlocks;
    } catch (error) {
      logger.warn('Code block extraction error:', error.message);
      return [content];
    }
  }

  extractExplanation(content) {
    try {
      // Remove code blocks and extract explanation text
      const withoutCode = content.replace(/```[\s\S]*?```/g, '');
      return withoutCode.trim();
    } catch (error) {
      logger.warn('Explanation extraction error:', error.message);
      return content;
    }
  }

  generateDocumentation(codeBlocks, language) {
    try {
      return `# Generated ${language} Code Documentation

## Overview
This code was generated by EVA ERP Assistant based on the provided requirements.

## Code Structure
${codeBlocks.map((block, index) => `
### Code Block ${index + 1}
\`\`\`${language.toLowerCase()}
${block}
\`\`\`
`).join('\n')}

## Usage Instructions
Please review the generated code and adapt it to your specific environment and requirements.

## Notes
- Ensure proper testing before deployment
- Follow your organization's coding standards
- Consider security and performance implications
`;
    } catch (error) {
      logger.warn('Documentation generation error:', error.message);
      return `# Generated ${language} Code Documentation\n\nGenerated code with documentation.`;
    }
  }

  extractTestCases(content) {
    try {
      // Simple test case extraction
      const testRegex = /test[:\s]+(.*)/gi;
      const testCases = [];
      let match;

      while ((match = testRegex.exec(content)) !== null) {
        testCases.push(match[1]);
      }

      return testCases;
    } catch (error) {
      logger.warn('Test case extraction error:', error.message);
      return [];
    }
  }

  generateSAPSuggestions(content) {
    try {
      return [
        'Explore SAP modules integration',
        'Review technical specifications',
        'Consider customization options',
        'Plan implementation timeline'
      ];
    } catch (error) {
      logger.warn('SAP suggestions generation error:', error.message);
      return [];
    }
  }

  generateAnalysisSuggestions(content) {
    try {
      return [
        'Analyze business requirements',
        'Review current processes',
        'Identify improvement areas',
        'Estimate implementation costs'
      ];
    } catch (error) {
      logger.warn('Analysis suggestions generation error:', error.message);
      return [];
    }
  }
}

console.log('=== CREATING GROQ SERVICE INSTANCE ===');
let groqServiceInstance;

try {
  groqServiceInstance = new GroqService();
  console.log('✅ GroqService instance created successfully');
} catch (error) {
  console.error('❌ Failed to create GroqService instance:', error);
  throw error;
}

console.log('=== EXPORTING GROQ SERVICE ===');
module.exports = groqServiceInstance;