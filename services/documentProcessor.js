const fs = require('fs');
const path = require('path');
const { GroqService } = require('./groqService');

class DocumentProcessor {
  constructor() {
    this.groqService = new GroqService();
    this.supportedTypes = ['.txt', '.md', '.csv', '.json', '.xml'];
  }

  async processUploadedDocument(filePath, analysisType = 'general') {
    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('File not found');
      }

      // Get file extension
      const ext = path.extname(filePath).toLowerCase();
      
      if (!this.supportedTypes.includes(ext)) {
        throw new Error(`Unsupported file type: ${ext}`);
      }

      // Read file content
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Process based on file type and analysis type
      let processedResult;
      
      switch (analysisType) {
        case 'business_requirements':
          processedResult = await this.analyzeBusinessRequirements(content, ext);
          break;
        case 'current_system':
          processedResult = await this.analyzeCurrentSystem(content, ext);
          break;
        case 'data_mapping':
          processedResult = await this.analyzeDataMapping(content, ext);
          break;
        case 'gap_analysis':
          processedResult = await this.performGapAnalysis(content, ext);
          break;
        default:
          processedResult = await this.performGeneralAnalysis(content, ext);
      }

      return {
        success: true,
        fileName: path.basename(filePath),
        fileType: ext,
        analysisType,
        analysis: processedResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Document Processing Error:', error);
      return {
        success: false,
        error: 'Failed to process document',
        details: error.message
      };
    }
  }

  async analyzeBusinessRequirements(content, fileType) {
    const prompt = `
Analyze the following business requirements document (${fileType}):

DOCUMENT CONTENT:
${content}

Provide a comprehensive ERP requirements analysis:

**BUSINESS PROCESS IDENTIFICATION:**
- List all business processes mentioned
- Categorize by functional area (Finance, HR, Supply Chain, etc.)
- Identify process dependencies

**FUNCTIONAL REQUIREMENTS:**
- Core functionality needed
- Integration requirements
- Reporting needs
- User access requirements

**NON-FUNCTIONAL REQUIREMENTS:**
- Performance requirements
- Security needs
- Compliance requirements
- Scalability needs

**ERP MODULE MAPPING:**
- Recommended SAP modules
- Alternative ERP solutions
- Custom development needs

**GAPS & CHALLENGES:**
- Missing information
- Unclear requirements
- Potential implementation challenges
- Additional clarification needed

**IMPLEMENTATION PRIORITY:**
- Critical (must-have)
- Important (should-have)
- Nice-to-have (could-have)

**NEXT STEPS:**
- Additional documentation needed
- Stakeholder interviews required
- Proof of concept recommendations

Focus on actionable insights for ERP selection and implementation.
    `;

    const analysis = await this.groqService.generateResponse(prompt);
    return analysis;
  }

  async analyzeCurrentSystem(content, fileType) {
    const prompt = `
Analyze the current system documentation (${fileType}):

DOCUMENT CONTENT:
${content}

Provide a comprehensive current system analysis:

**SYSTEM OVERVIEW:**
- Current technology stack
- System architecture
- Key functionalities

**STRENGTHS ANALYSIS:**
- What's working well
- Valuable features to retain
- Integration points to preserve

**WEAKNESSES IDENTIFICATION:**
- System limitations
- Performance issues
- User experience problems
- Maintenance challenges

**DATA ANALYSIS:**
- Data structures identified
- Data quality assessment
- Migration complexity
- Master data management

**INTEGRATION LANDSCAPE:**
- Connected systems
- Integration methods
- Data flow patterns
- API availability

**MIGRATION CONSIDERATIONS:**
- Data extraction challenges
- Transformation requirements
- Risk assessment
- Timeline implications

**REPLACEMENT STRATEGY:**
- Recommended approach (Big Bang/Phased)
- Critical dependencies
- Rollback procedures
- User training needs

**COST-BENEFIT ANALYSIS:**
- Current system costs
- Replacement benefits
- ROI projections
- Risk mitigation

Provide practical, implementation-focused insights.
    `;

    const analysis = await this.groqService.generateResponse(prompt);
    return analysis;
  }

  async analyzeDataMapping(content, fileType) {
    const prompt = `
Analyze the data mapping document (${fileType}):

DOCUMENT CONTENT:
${content}

Provide comprehensive data mapping analysis:

**DATA STRUCTURE ANALYSIS:**
- Source data structures identified
- Target system requirements
- Data relationships
- Key field mappings

**MAPPING COMPLEXITY:**
- Simple 1:1 mappings
- Complex transformations needed
- Data consolidation requirements
- Lookup table needs

**DATA QUALITY ASSESSMENT:**
- Data completeness
- Data accuracy issues
- Duplicate data concerns
- Validation requirements

**TRANSFORMATION LOGIC:**
- Business rule mappings
- Data format conversions
- Calculation requirements
- Conditional logic needs

**MIGRATION STRATEGY:**
- Recommended migration approach
- Data validation procedures
- Error handling requirements
- Rollback procedures

**TECHNICAL IMPLEMENTATION:**
- ETL tool recommendations
- Custom script requirements
- Performance considerations
- Monitoring needs

**RISK ASSESSMENT:**
- Data loss risks
- Transformation risks
- Timeline risks
- Quality risks

**TESTING APPROACH:**
- Data validation testing
- User acceptance testing
- Performance testing
- Integration testing

Focus on implementable data migration strategies.
    `;

    const analysis = await this.groqService.generateResponse(prompt);
    return analysis;
  }

  async performGapAnalysis(content, fileType) {
    const prompt = `
Perform gap analysis on the provided documentation (${fileType}):

DOCUMENT CONTENT:
${content}

Provide comprehensive gap analysis:

**CURRENT STATE ASSESSMENT:**
- Existing capabilities
- Current processes
- Technology limitations
- Resource constraints

**FUTURE STATE VISION:**
- Desired capabilities
- Target processes
- Technology goals
- Resource requirements

**GAP IDENTIFICATION:**

**Functional Gaps:**
- Missing business processes
- Inadequate functionality
- Integration gaps
- Reporting deficiencies

**Technical Gaps:**
- Technology limitations
- Performance issues
- Security vulnerabilities
- Scalability constraints

**Organizational Gaps:**
- Skill deficiencies
- Process maturity
- Change management
- Training needs

**PRIORITIZATION MATRIX:**
- Critical gaps (high impact, urgent)
- Important gaps (high impact, medium urgency)
- Secondary gaps (medium impact)
- Future considerations (low priority)

**SOLUTION RECOMMENDATIONS:**
- ERP module selections
- Custom development needs
- Third-party solutions
- Process improvements

**IMPLEMENTATION ROADMAP:**
- Phase 1: Critical gaps
- Phase 2: Important gaps
- Phase 3: Enhancements
- Timeline and dependencies

**RISK MITIGATION:**
- Implementation risks
- Mitigation strategies
- Contingency plans
- Success factors

Provide actionable recommendations for closing identified gaps.
    `;

    const analysis = await this.groqService.generateResponse(prompt);
    return analysis;
  }

  async performGeneralAnalysis(content, fileType) {
    const prompt = `
Analyze the uploaded document (${fileType}) from an ERP implementation perspective:

DOCUMENT CONTENT:
${content}

Provide general ERP-focused analysis:

**DOCUMENT SUMMARY:**
- Document type and purpose
- Key topics covered
- Stakeholders mentioned
- Business context

**ERP RELEVANCE:**
- ERP-related content identified
- Business processes mentioned
- System requirements noted
- Integration needs

**KEY INSIGHTS:**
- Important findings
- Business requirements
- Technical considerations
- Implementation implications

**RECOMMENDATIONS:**
- Further analysis needed
- Additional documentation required
- Stakeholder engagement
- Next steps

**QUESTIONS FOR CLARIFICATION:**
- Missing information
- Unclear requirements
- Assumptions to validate
- Additional details needed

**IMPLEMENTATION CONSIDERATIONS:**
- Complexity assessment
- Resource requirements
- Timeline implications
- Risk factors

Focus on extracting ERP-relevant insights and recommendations.
    `;

    const analysis = await this.groqService.generateResponse(prompt);
    return analysis;
  }

  async extractBusinessRules(content) {
    const prompt = `
Extract business rules from the following document:

${content}

Identify and list:

**BUSINESS RULES:**
- Decision rules
- Validation rules
- Calculation rules
- Workflow rules

**RULE CATEGORIES:**
- Mandatory rules (must implement)
- Business logic rules
- Validation rules
- Exception handling rules

**ERP IMPLEMENTATION:**
- How to configure in SAP
- Custom development needed
- Standard functionality available
- Integration requirements

Format as clear, implementable business rules.
    `;

    const rules = await this.groqService.generateResponse(prompt);
    return rules;
  }

  async generateRequirementsDocument(analysisResults) {
    const prompt = `
Based on the following analysis results, generate a formal requirements document:

${JSON.stringify(analysisResults, null, 2)}

Create a professional requirements document with:

**1. EXECUTIVE SUMMARY**
**2. BUSINESS REQUIREMENTS**
**3. FUNCTIONAL REQUIREMENTS**
**4. NON-FUNCTIONAL REQUIREMENTS**
**5. TECHNICAL REQUIREMENTS**
**6. INTEGRATION REQUIREMENTS**
**7. IMPLEMENTATION APPROACH**
**8. RISK ASSESSMENT**
**9. SUCCESS CRITERIA**
**10. NEXT STEPS**

Format as a professional document suitable for stakeholder review.
    `;

    const document = await this.groqService.generateResponse(prompt);
    return document;
  }

  async validateFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return this.supportedTypes.includes(ext);
  }

  async cleanupFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('File cleanup error:', error);
      return false;
    }
  }
}

module.exports = { DocumentProcessor };