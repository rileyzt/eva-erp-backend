const { GroqService } = require('./groqService');

class ERPAnalyzer {
  constructor() {
    this.groqService = new GroqService();
  }

  async analyzeBusinessRequirements(requirements) {
    const prompt = `
You are an expert ERP consultant. Analyze the following business requirements and provide comprehensive ERP recommendations.

Business Requirements:
${requirements}

Please provide a detailed analysis in the following format:

**BUSINESS PROCESS ANALYSIS:**
- Identify key business processes mentioned
- Highlight pain points and inefficiencies
- Assess current system gaps

**ERP MODULE RECOMMENDATIONS:**
- Recommend specific ERP modules (Finance, HR, Supply Chain, etc.)
- Explain why each module is necessary
- Prioritize implementation order

**SYSTEM ARCHITECTURE:**
- Suggest optimal ERP solution (SAP, Oracle, Microsoft Dynamics)
- Recommend deployment model (Cloud/On-premise/Hybrid)
- Integration requirements

**IMPLEMENTATION ROADMAP:**
- Phase 1: Critical modules (timeline)
- Phase 2: Secondary modules (timeline) 
- Phase 3: Advanced features (timeline)

**ESTIMATED BENEFITS:**
- Cost savings potential
- Efficiency improvements
- ROI projections

**RISK ASSESSMENT:**
- Implementation risks
- Mitigation strategies
- Critical success factors

Please be specific and actionable in your recommendations.
    `;

    try {
      const analysis = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        analysis,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('ERP Analysis Error:', error);
      return {
        success: false,
        error: 'Failed to analyze business requirements',
        details: error.message
      };
    }
  }

  async compareERPSolutions(requirements, solutions = ['SAP', 'Oracle', 'Microsoft Dynamics']) {
    const prompt = `
As an ERP expert, compare the following ERP solutions for these business requirements:

Requirements: ${requirements}

ERP Solutions to Compare: ${solutions.join(', ')}

Provide a detailed comparison in this format:

**SOLUTION COMPARISON MATRIX:**

For each solution (${solutions.join(', ')}):

**[SOLUTION NAME]:**
- **Strengths:** What this solution excels at
- **Weaknesses:** Limitations and drawbacks
- **Best Fit For:** Types of businesses/industries
- **Implementation Cost:** Rough estimate (Low/Medium/High)
- **Implementation Time:** Estimated timeline
- **Customization Level:** How flexible is it
- **Support & Community:** Quality of support ecosystem

**FINAL RECOMMENDATION:**
- Recommended solution and why
- Second choice alternative
- Key decision factors

**IMPLEMENTATION CONSIDERATIONS:**
- Critical requirements for chosen solution
- Potential challenges
- Success factors

Focus on practical, business-oriented advice.
    `;

    try {
      const comparison = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        comparison,
        solutions: solutions,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('ERP Comparison Error:', error);
      return {
        success: false,
        error: 'Failed to compare ERP solutions',
        details: error.message
      };
    }
  }

  async generateImplementationPlan(requirements, selectedERP) {
    const prompt = `
Create a detailed implementation plan for ${selectedERP} ERP based on these requirements:

${requirements}

Provide a comprehensive implementation plan:

**PROJECT OVERVIEW:**
- Project scope and objectives
- Key stakeholders
- Success criteria

**PHASE 1: FOUNDATION (Months 1-3)**
- Pre-implementation activities
- System setup and configuration
- Core team training
- Data preparation

**PHASE 2: CORE MODULES (Months 4-8)**
- Essential module implementation
- Data migration
- Integration setup
- User training

**PHASE 3: ADVANCED FEATURES (Months 9-12)**
- Advanced module deployment
- Customizations
- Performance optimization
- Go-live preparation

**RESOURCE REQUIREMENTS:**
- Team structure and roles
- Skill requirements
- Training needs
- External consultant needs

**RISK MANAGEMENT:**
- Identified risks and mitigation
- Contingency plans
- Quality assurance

**BUDGET ESTIMATION:**
- Software licensing costs
- Implementation services
- Training and support
- Total cost breakdown

**SUCCESS METRICS:**
- KPIs to track
- Measurement methods
- Timeline for benefits realization

Make it actionable and specific to ${selectedERP}.
    `;

    try {
      const plan = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        plan,
        selectedERP,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Implementation Plan Error:', error);
      return {
        success: false,
        error: 'Failed to generate implementation plan',
        details: error.message
      };
    }
  }

  async analyzeMigrationStrategy(currentSystem, targetERP, dataTypes) {
    const prompt = `
Analyze migration strategy from ${currentSystem} to ${targetERP} for the following data types:
${dataTypes.join(', ')}

Provide a comprehensive migration analysis:

**CURRENT SYSTEM ASSESSMENT:**
- ${currentSystem} strengths and limitations
- Data quality assessment
- Integration complexity

**MIGRATION STRATEGY:**
- Recommended migration approach (Big Bang/Phased/Parallel)
- Data mapping requirements
- Timeline and milestones

**DATA MIGRATION PLAN:**
For each data type (${dataTypes.join(', ')}):
- Migration complexity (Low/Medium/High)
- Required transformations
- Validation requirements
- Rollback procedures

**TECHNICAL CONSIDERATIONS:**
- Data extraction methods
- Transformation requirements
- Loading procedures
- Integration points

**RISK ASSESSMENT:**
- Data loss risks
- Business continuity risks
- Performance impacts
- Mitigation strategies

**TESTING STRATEGY:**
- Data validation approaches
- User acceptance testing
- Performance testing
- Security testing

**TIMELINE & RESOURCES:**
- Migration phases
- Resource requirements
- Critical dependencies
- Go-live criteria

Focus on practical, implementable recommendations.
    `;

    try {
      const strategy = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        strategy,
        currentSystem,
        targetERP,
        dataTypes,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Migration Strategy Error:', error);
      return {
        success: false,
        error: 'Failed to analyze migration strategy',
        details: error.message
      };
    }
  }

  async generateComplianceGuidance(industry, region, erpSystem) {
    const prompt = `
Provide ERP compliance guidance for:
- Industry: ${industry}
- Region: ${region}
- ERP System: ${erpSystem}

**REGULATORY REQUIREMENTS:**
- Key compliance standards for ${industry} in ${region}
- Mandatory reporting requirements
- Data protection regulations

**ERP CONFIGURATION:**
- ${erpSystem} compliance features
- Required configurations
- Audit trail setup

**COMPLIANCE IMPLEMENTATION:**
- Policy and procedure requirements
- User access controls
- Data governance framework

**MONITORING & REPORTING:**
- Compliance dashboards
- Automated reporting
- Audit preparation

**RISK MANAGEMENT:**
- Compliance risks
- Mitigation strategies
- Regular review processes

Make recommendations specific to ${erpSystem} capabilities.
    `;

    try {
      const guidance = await this.groqService.generateResponse(prompt);
      return {
        success: true,
        guidance,
        industry,
        region,
        erpSystem,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Compliance Guidance Error:', error);
      return {
        success: false,
        error: 'Failed to generate compliance guidance',
        details: error.message
      };
    }
  }
}

module.exports = { ERPAnalyzer };