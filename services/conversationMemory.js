class ConversationMemory {
  constructor() {
    this.conversations = new Map();
    this.maxHistoryLength = 50; // Maximum number of messages to keep
    this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  }

  // Initialize new conversation session
  initializeSession(sessionId, persona = 'general') {
    const session = {
      id: sessionId,
      persona: persona,
      messages: [],
      context: {
        currentProject: null,
        businessRequirements: [],
        technicalSpecs: [],
        implementationPhase: 'discovery',
        stakeholders: [],
        decisions: [],
        openIssues: []
      },
      metadata: {
        createdAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        analysisResults: [],
        generatedArtifacts: []
      }
    };

    this.conversations.set(sessionId, session);
    return session;
  }

  // Add message to conversation history
  addMessage(sessionId, message, role = 'user') {
    let session = this.conversations.get(sessionId);
    
    if (!session) {
      session = this.initializeSession(sessionId);
    }

    const messageObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: role,
      content: message,
      timestamp: new Date(),
      metadata: {
        persona: session.persona,
        phase: session.context.implementationPhase
      }
    };

    session.messages.push(messageObj);
    session.metadata.lastActivity = new Date();
    session.metadata.messageCount++;

    // Trim history if too long
    if (session.messages.length > this.maxHistoryLength) {
      session.messages = session.messages.slice(-this.maxHistoryLength);
    }

    // Extract and update context from message
    this.updateContextFromMessage(session, messageObj);

    return messageObj;
  }

  // Get conversation history for a session
  getConversationHistory(sessionId, limit = null) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return [];
    }

    let messages = session.messages;
    if (limit) {
      messages = messages.slice(-limit);
    }

    return messages;
  }

  // Get full session context
  getSessionContext(sessionId) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: sessionId,
      persona: session.persona,
      context: session.context,
      metadata: session.metadata,
      recentMessages: session.messages.slice(-10) // Last 10 messages
    };
  }

  // Update context based on message content
  updateContextFromMessage(session, message) {
    const content = message.content.toLowerCase();

    // Detect implementation phase
    if (content.includes('requirement') || content.includes('analyze')) {
      session.context.implementationPhase = 'requirements';
    } else if (content.includes('design') || content.includes('architect')) {
      session.context.implementationPhase = 'design';
    } else if (content.includes('implement') || content.includes('configure')) {
      session.context.implementationPhase = 'implementation';
    } else if (content.includes('test') || content.includes('validate')) {
      session.context.implementationPhase = 'testing';
    } else if (content.includes('deploy') || content.includes('go-live')) {
      session.context.implementationPhase = 'deployment';
    }

    // Extract business requirements
    if (content.includes('business') && (content.includes('requirement') || content.includes('process'))) {
      const requirement = this.extractRequirementFromMessage(message.content);
      if (requirement && !session.context.businessRequirements.includes(requirement)) {
        session.context.businessRequirements.push(requirement);
      }
    }

    // Extract technical specifications
    if (content.includes('technical') || content.includes('system') || content.includes('integration')) {
      const techSpec = this.extractTechnicalSpecFromMessage(message.content);
      if (techSpec && !session.context.technicalSpecs.includes(techSpec)) {
        session.context.technicalSpecs.push(techSpec);
      }
    }

    // Extract stakeholders
    if (content.includes('stakeholder') || content.includes('team') || content.includes('user')) {
      const stakeholder = this.extractStakeholderFromMessage(message.content);
      if (stakeholder && !session.context.stakeholders.includes(stakeholder)) {
        session.context.stakeholders.push(stakeholder);
      }
    }

    // Extract decisions
    if (content.includes('decide') || content.includes('choose') || content.includes('select')) {
      const decision = this.extractDecisionFromMessage(message.content);
      if (decision) {
        session.context.decisions.push({
          decision: decision,
          timestamp: message.timestamp,
          messageId: message.id
        });
      }
    }

    // Extract open issues
    if (content.includes('issue') || content.includes('problem') || content.includes('challenge')) {
      const issue = this.extractIssueFromMessage(message.content);
      if (issue) {
        session.context.openIssues.push({
          issue: issue,
          timestamp: message.timestamp,
          status: 'open',
          messageId: message.id
        });
      }
    }
  }

  // Helper methods for context extraction
  extractRequirementFromMessage(content) {
    // Simple extraction - in production, use more sophisticated NLP
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes('requirement') || 
          sentence.toLowerCase().includes('need') ||
          sentence.toLowerCase().includes('must')) {
        return sentence.trim();
      }
    }
    return null;
  }

  extractTechnicalSpecFromMessage(content) {
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes('system') || 
          sentence.toLowerCase().includes('technical') ||
          sentence.toLowerCase().includes('integration')) {
        return sentence.trim();
      }
    }
    return null;
  }

  extractStakeholderFromMessage(content) {
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes('team') || 
          sentence.toLowerCase().includes('user') ||
          sentence.toLowerCase().includes('stakeholder')) {
        return sentence.trim();
      }
    }
    return null;
  }

  extractDecisionFromMessage(content) {
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes('decide') || 
          sentence.toLowerCase().includes('choose') ||
          sentence.toLowerCase().includes('select')) {
        return sentence.trim();
      }
    }
    return null;
  }

  extractIssueFromMessage(content) {
    const sentences = content.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.toLowerCase().includes('issue') || 
          sentence.toLowerCase().includes('problem') ||
          sentence.toLowerCase().includes('challenge')) {
        return sentence.trim();
      }
    }
    return null;
  }

  // Store analysis results
  addAnalysisResult(sessionId, analysisType, result) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return false;
    }

    const analysisResult = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: analysisType,
      result: result,
      timestamp: new Date()
    };

    session.metadata.analysisResults.push(analysisResult);
    return analysisResult;
  }

  // Store generated artifacts
  addGeneratedArtifact(sessionId, artifactType, artifact) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return false;
    }

    const generatedArtifact = {
      id: `artifact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: artifactType,
      artifact: artifact,
      timestamp: new Date()
    };

    session.metadata.generatedArtifacts.push(generatedArtifact);
    return generatedArtifact;
  }

  // Update persona for session
  updatePersona(sessionId, newPersona) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return false;
    }

    session.persona = newPersona;
    session.metadata.lastActivity = new Date();
    return true;
  }

  // Generate context summary for AI prompt
  generateContextSummary(sessionId) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return "No previous context available.";
    }

    const summary = {
      persona: session.persona,
      phase: session.context.implementationPhase,
      messageCount: session.metadata.messageCount,
      businessRequirements: session.context.businessRequirements.slice(-5), // Last 5
      technicalSpecs: session.context.technicalSpecs.slice(-3), // Last 3
      recentDecisions: session.context.decisions.slice(-3), // Last 3
      openIssues: session.context.openIssues.filter(issue => issue.status === 'open').slice(-3),
      recentMessages: session.messages.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content.substring(0, 200) + (msg.content.length > 200 ? '...' : ''),
        timestamp: msg.timestamp
      }))
    };

    return `
CONVERSATION CONTEXT:
- Current Persona: ${summary.persona}
- Implementation Phase: ${summary.phase}
- Total Messages: ${summary.messageCount}

BUSINESS REQUIREMENTS IDENTIFIED:
${summary.businessRequirements.map(req => `- ${req}`).join('\n')}

TECHNICAL SPECIFICATIONS:
${summary.technicalSpecs.map(spec => `- ${spec}`).join('\n')}

RECENT DECISIONS:
${summary.recentDecisions.map(dec => `- ${dec.decision} (${dec.timestamp})`).join('\n')}

OPEN ISSUES:
${summary.openIssues.map(issue => `- ${issue.issue} (${issue.timestamp})`).join('\n')}

RECENT CONVERSATION:
${summary.recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}
    `;
  }

  // Resolve an open issue
  resolveIssue(sessionId, issueId) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return false;
    }

    const issue = session.context.openIssues.find(i => i.messageId === issueId);
    if (issue) {
      issue.status = 'resolved';
      issue.resolvedAt = new Date();
      return true;
    }
    return false;
  }

  // Clean up expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions = [];

    for (const [sessionId, session] of this.conversations.entries()) {
      const timeSinceLastActivity = now - session.metadata.lastActivity;
      if (timeSinceLastActivity > this.sessionTimeout) {
        expiredSessions.push(sessionId);
      }
    }

    expiredSessions.forEach(sessionId => {
      this.conversations.delete(sessionId);
    });

    return expiredSessions.length;
  }

  // Export session data
  exportSession(sessionId) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      exportedAt: new Date(),
      session: session
    };
  }

  // Get conversation statistics
  getConversationStats(sessionId) {
    const session = this.conversations.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      sessionId: sessionId,
      persona: session.persona,
      totalMessages: session.metadata.messageCount,
      userMessages: session.messages.filter(m => m.role === 'user').length,
      assistantMessages: session.messages.filter(m => m.role === 'assistant').length,
      businessRequirements: session.context.businessRequirements.length,
      technicalSpecs: session.context.technicalSpecs.length,
      decisions: session.context.decisions.length,
      openIssues: session.context.openIssues.filter(i => i.status === 'open').length,
      resolvedIssues: session.context.openIssues.filter(i => i.status === 'resolved').length,
      analysisResults: session.metadata.analysisResults.length,
      generatedArtifacts: session.metadata.generatedArtifacts.length,
      sessionDuration: new Date() - session.metadata.createdAt,
      currentPhase: session.context.implementationPhase
    };
  }
}

module.exports = { ConversationMemory };