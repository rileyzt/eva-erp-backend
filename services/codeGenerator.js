const { GroqService } = require('./groqService');

class CodeGenerator {
  constructor() {
    this.groqService = new GroqService();
  }

  async generateABAPCode(requirement, codeType) {
    const prompt = `
You are an expert SAP ABAP developer. Generate clean, efficient ABAP code for the following requirement:

Requirement: ${requirement}
Code Type: ${codeType}

Please provide:

**ABAP CODE:**
\`\`\`abap
[Generate complete, working ABAP code here]
\`\`\`

**CODE EXPLANATION:**
- Purpose and functionality
- Key logic explanations
- Important variables and structures

**IMPLEMENTATION NOTES:**
- Prerequisites and dependencies
- Transaction codes involved
- Configuration requirements

**TESTING APPROACH:**
- Test scenarios
- Expected results
- Debugging tips

**BEST PRACTICES:**
- Performance considerations
- Error handling
- Code maintainability

Make sure the code follows SAP naming conventions and best practices.
    `;

    try {
      const code = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        code,
        codeType,
        requirement,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('ABAP Code Generation Error:', error);
      return {
        success: false,
        error: 'Failed to generate ABAP code',
        details: error.message
      };
    }
  }

  async generateSAPConfiguration(module, businessProcess) {
    const prompt = `
Generate SAP configuration steps for:
Module: ${module}
Business Process: ${businessProcess}

Provide detailed configuration guidance:

**CONFIGURATION OVERVIEW:**
- Module: ${module}
- Process: ${businessProcess}
- Scope and objectives

**STEP-BY-STEP CONFIGURATION:**

**Phase 1: Basic Setup**
1. [Step 1 with transaction code]
2. [Step 2 with transaction code]
3. [Continue with detailed steps...]

**Phase 2: Advanced Configuration**
1. [Advanced configuration steps]
2. [Integration points]
3. [Customization options]

**TRANSACTION CODES:**
- List all relevant T-codes
- Purpose of each transaction
- Navigation path

**TABLES INVOLVED:**
- Key SAP tables affected
- Important fields
- Relationships

**TESTING PROCEDURES:**
- Unit testing steps
- Integration testing
- User acceptance testing

**DOCUMENTATION:**
- Configuration documentation
- User guides needed
- Training materials

**TROUBLESHOOTING:**
- Common issues
- Resolution steps
- Support resources

Make it specific to SAP ${module} module.
    `;

    try {
      const config = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        configuration: config,
        module,
        businessProcess,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('SAP Configuration Error:', error);
      return {
        success: false,
        error: 'Failed to generate SAP configuration',
        details: error.message
      };
    }
  }

  async generateWorkflow(processDescription, approvalLevels) {
    const prompt = `
Design a SAP workflow for:
Process: ${processDescription}
Approval Levels: ${approvalLevels}

**WORKFLOW DESIGN:**

**Process Overview:**
- Workflow name and purpose
- Trigger events
- End conditions

**WORKFLOW STEPS:**
1. **Initiation:**
   - Starting conditions
   - Required data
   - User roles involved

2. **Approval Steps:**
   ${approvalLevels.map((level, index) => `
   **Level ${index + 1}: ${level}**
   - Approval criteria
   - Decision options
   - Escalation rules`).join('\n')}

3. **Completion:**
   - Final actions
   - Notifications
   - Data updates

**TECHNICAL IMPLEMENTATION:**

**Workflow Objects:**
- Business object types
- Methods required
- Events to monitor

**Organization Management:**
- Organizational units
- Position assignments
- Substitution rules

**WORKFLOW CODE SNIPPETS:**
\`\`\`abap
[Relevant ABAP code for workflow logic]
\`\`\`

**CONFIGURATION STEPS:**
1. Transaction SWDD - Workflow Builder
2. Define workflow template
3. Configure organizational assignment
4. Set up event linkages
5. Testing and activation

**MONITORING & MAINTENANCE:**
- Workflow monitoring (SWI1)
- Error handling procedures
- Performance optimization

Make it implementable in SAP Business Workflow.
    `;

    try {
      const workflow = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        workflow,
        processDescription,
        approvalLevels,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Workflow Generation Error:', error);
      return {
        success: false,
        error: 'Failed to generate workflow',
        details: error.message
      };
    }
  }

  async generateFioriApp(appRequirement, appType) {
    const prompt = `
Generate SAP Fiori app specification for:
Requirement: ${appRequirement}
App Type: ${appType}

**FIORI APP SPECIFICATION:**

**App Overview:**
- App name and purpose
- Target users
- Key functionalities

**UI5 APPLICATION STRUCTURE:**

**Views & Controllers:**
\`\`\`javascript
// Main view structure
[Generate UI5 view code]
\`\`\`

\`\`\`javascript
// Controller logic
[Generate controller code with key functions]
\`\`\`

**Data Model:**
\`\`\`javascript
// OData service integration
[Generate model binding code]
\`\`\`

**BACKEND INTEGRATION:**

**OData Service:**
- Service name and URL
- Entity sets required
- CRUD operations

**Gateway Configuration:**
- Service registration steps
- Authorization objects
- Testing procedures

**DEPLOYMENT GUIDE:**

**Development Steps:**
1. Create UI5 project structure
2. Define views and fragments
3. Implement controller logic
4. Configure routing
5. Test and deploy

**Launchpad Integration:**
- Tile configuration
- Role assignments
- Navigation setup

**PERFORMANCE OPTIMIZATION:**
- Lazy loading implementation
- Data binding optimization
- Cache strategies

**SECURITY CONSIDERATIONS:**
- Authorization checks
- Data protection
- Input validation

Make it production-ready for SAP Fiori launchpad.
    `;

    try {
      const fioriApp = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        fioriApp,
        appRequirement,
        appType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Fiori App Generation Error:', error);
      return {
        success: false,
        error: 'Failed to generate Fiori app specification',
        details: error.message
      };
    }
  }

  async generateIntegrationCode(sourceSystem, targetSystem, dataType) {
    const prompt = `
Generate integration code for:
Source: ${sourceSystem}
Target: ${targetSystem}
Data Type: ${dataType}

**INTEGRATION ARCHITECTURE:**

**Overview:**
- Integration pattern (Point-to-point/Hub/ESB)
- Data flow direction
- Frequency and volume

**TECHNICAL IMPLEMENTATION:**

**Source System Code:**
\`\`\`abap
[Code for data extraction from ${sourceSystem}]
\`\`\`

**Transformation Logic:**
\`\`\`abap
[Data mapping and transformation code]
\`\`\`

**Target System Code:**
\`\`\`abap
[Code for data loading into ${targetSystem}]
\`\`\`

**ERROR HANDLING:**
\`\`\`abap
[Exception handling and logging code]
\`\`\`

**CONFIGURATION SETUP:**

**Source System:**
- Required customizing
- User authorizations
- RFC destinations

**Target System:**
- Receiver configurations
- Data validation rules
- Processing logic

**MONITORING & TROUBLESHOOTING:**

**Monitoring Tools:**
- Transaction codes for monitoring
- Log analysis procedures
- Performance metrics

**Error Resolution:**
- Common error scenarios
- Resolution procedures
- Support contacts

**TESTING APPROACH:**
- Unit testing scenarios
- Integration testing
- Load testing considerations

Focus on reliable, maintainable integration patterns.
    `;

    try {
      const integration = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        integration,
        sourceSystem,
        targetSystem,
        dataType,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Integration Code Generation Error:', error);
      return {
        success: false,
        error: 'Failed to generate integration code',
        details: error.message
      };
    }
  }

  async generatePerformanceOptimization(performanceIssue, sapModule) {
    const prompt = `
Analyze and provide optimization solution for:
Performance Issue: ${performanceIssue}
SAP Module: ${sapModule}

**PERFORMANCE ANALYSIS:**

**Issue Assessment:**
- Problem description and impact
- Root cause analysis
- Performance bottlenecks

**OPTIMIZATION STRATEGY:**

**Code-Level Optimizations:**
\`\`\`abap
[Optimized ABAP code examples]
\`\`\`

**Database Optimizations:**
- SQL query improvements
- Index recommendations
- Table optimization

**System-Level Improvements:**
- Memory management
- Buffer optimization
- System parameter tuning

**IMPLEMENTATION PLAN:**

**Phase 1: Quick Wins**
- Immediate improvements
- Low-risk changes
- Expected benefits

**Phase 2: Structural Changes**
- Architecture improvements
- Database modifications
- Testing requirements

**MONITORING & MEASUREMENT:**

**Performance Metrics:**
- Key performance indicators
- Measurement tools (ST05, SM50, etc.)
- Baseline establishment

**Continuous Monitoring:**
- Automated monitoring setup
- Alert configurations
- Regular review processes

**BEST PRACTICES:**
- Development guidelines
- Code review standards
- Performance testing procedures

Provide specific, actionable recommendations for ${sapModule}.
    `;

    try {
      const optimization = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        optimization,
        performanceIssue,
        sapModule,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Performance Optimization Error:', error);
      return {
        success: false,
        error: 'Failed to generate performance optimization',
        details: error.message
      };
    }
  }
}

module.exports = { CodeGenerator };