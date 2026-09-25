import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';
import {
  analyticsRepository,
  AnalyticsFilterParams,
  UserScope,
} from '../repositories/analytics.repository.ts';

export interface AuditContext {
  userId: number;
  employeeId?: string;
  name?: string;
  role: string;
  ipAddress?: string;
}

export const analyticsService = {
  /**
   * Internal audit logger for analytics actions
   */
  async logAnalyticsAudit(action: 'ANALYTICS_VIEWED' | 'ANALYTICS_EXPORT', resourceId: string, metadata: any, user: AuditContext) {
    try {
      await db.insert(auditLogs).values({
        actorId: user.employeeId || `USR-${user.userId}`,
        actorName: user.name || 'Bank Officer',
        action,
        resourceType: 'ANALYTICS',
        resourceId,
        requestId: `REQ-ANL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        outcome: 'SUCCESS',
        metadata: JSON.stringify(metadata),
      });
    } catch (err) {
      console.error('[AnalyticsService] Audit logging failed non-fatally:', err);
    }
  },

  async getExecutiveOverview(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getExecutiveOverview(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'EXECUTIVE_OVERVIEW', { period: filter.period }, user);
    return result;
  },

  async getRelationshipPortfolio(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getRelationshipPortfolio(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'RELATIONSHIP_PORTFOLIO', { branch: filter.branch, rmId: filter.rmId }, user);
    return result;
  },

  async getCustomerHealth(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getCustomerHealth(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'CUSTOMER_HEALTH', { scoreBand: filter.scoreBand }, user);
    return result;
  },

  async getCoreScoreTrends(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getCoreScoreTrends(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'CORE_SCORE_TRENDS', { period: filter.period }, user);
    return result;
  },

  async getOpportunityAnalytics(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getOpportunityAnalytics(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'OPPORTUNITY_PERFORMANCE', { stage: filter.oppStage }, user);
    return result;
  },

  async getServicePerformance(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getServicePerformance(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'SERVICE_PERFORMANCE', { status: filter.caseStatus }, user);
    return result;
  },

  async getRmProductivity(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getRmProductivity(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'RM_PRODUCTIVITY', {}, user);
    return result;
  },

  async getProductPenetration(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getProductPenetration(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'PRODUCT_PENETRATION', {}, user);
    return result;
  },

  async getEngagementAnalytics(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getEngagementAnalytics(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'ENGAGEMENT_ANALYTICS', { period: filter.period }, user);
    return result;
  },

  async getTaskAnalytics(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getTaskAnalytics(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'TASK_ANALYTICS', {}, user);
    return result;
  },

  async getIntelligenceAnalytics(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getIntelligenceAnalytics(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'INTELLIGENCE_ANALYTICS', {}, user);
    return result;
  },

  async getWhatChanged(filter: AnalyticsFilterParams, user: AuditContext) {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const result = await analyticsRepository.getWhatChanged(filter, scope);
    await this.logAnalyticsAudit('ANALYTICS_VIEWED', 'WHAT_CHANGED', {}, user);
    return result;
  },

  /**
   * Export analytical datasets to structured CSV
   */
  async exportCsv(type: string, filter: AnalyticsFilterParams, user: AuditContext): Promise<{ filename: string; content: string }> {
    const scope: UserScope = { userId: user.userId, role: user.role };
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let filename = `COREvia_${type}_${timestamp}.csv`;
    let content = '';

    if (type === 'portfolio') {
      const data = await analyticsRepository.getRelationshipPortfolio(filter, scope);
      filename = `COREvia_Portfolio_Analytics_${timestamp}.csv`;
      const headers = ['Customer Code', 'Customer Name', 'Segment', 'Status', 'Relationship Value (INR)', 'CORE Score', 'Score Band', 'Momentum', 'Active Products', 'Branch', 'Assigned RM', 'Last Activity'];
      const rows = data.customers.map((c) => [
        `"${c.customerCode}"`,
        `"${c.name}"`,
        `"${c.entityType}"`,
        `"${c.status}"`,
        c.relationshipValue,
        c.coreScore,
        `"${c.scoreBand}"`,
        `"${c.momentum}"`,
        c.activeProductCount,
        `"${c.branchCode}"`,
        `"${c.rmName}"`,
        `"${c.lastActivity}"`,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'health') {
      const data = await analyticsRepository.getCustomerHealth(filter, scope);
      filename = `COREvia_Customer_Health_${timestamp}.csv`;
      const headers = ['Customer Code', 'Customer Name', 'Segment', 'Previous Score', 'Current Score', 'Delta', 'Momentum', 'Risk Category', 'Financial Health', 'Credit Risk', 'Engagement', 'Assigned RM'];
      const rows = data.healthChanges.map((c) => [
        `"${c.customerCode}"`,
        `"${c.name}"`,
        `"${c.entityType}"`,
        c.previousScore,
        c.currentScore,
        c.delta,
        `"${c.momentum}"`,
        `"${c.riskCategory}"`,
        c.financialHealth,
        c.creditRisk,
        c.engagement,
        `"${c.rmName}"`,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'opportunities') {
      const data = await analyticsRepository.getOpportunityAnalytics(filter, scope);
      filename = `COREvia_Opportunities_Pipeline_${timestamp}.csv`;
      const headers = ['Opportunity Code', 'Title', 'Customer', 'Product', 'Stage', 'Priority', 'Expected Value (INR)', 'Probability (%)', 'Weighted Value (INR)', 'Expected Close Date', 'Days in Stage', 'Assigned Officer'];
      const rows = data.opportunities.map((o) => [
        `"${o.opportunityCode}"`,
        `"${o.title.replace(/"/g, '""')}"`,
        `"${o.customerName}"`,
        `"${o.productName}"`,
        `"${o.stage}"`,
        `"${o.priority}"`,
        o.expectedValue,
        o.probability,
        o.weightedValue,
        `"${o.expectedCloseDate || ''}"`,
        o.daysInStage,
        `"${o.assignedToName}"`,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'service_cases') {
      const data = await analyticsRepository.getServicePerformance(filter, scope);
      filename = `COREvia_Service_Desk_Performance_${timestamp}.csv`;
      const headers = ['Case Number', 'Title', 'Customer ID', 'Category', 'Priority', 'Status', 'SLA State', 'SLA Due Date', 'Assigned Agent', 'Resolution Hours'];
      const rows = data.cases.map((sc) => [
        `"${sc.caseNumber}"`,
        `"${sc.title.replace(/"/g, '""')}"`,
        sc.customerId,
        `"${sc.category}"`,
        `"${sc.priority}"`,
        `"${sc.status}"`,
        `"${sc.slaState}"`,
        `"${sc.slaDueDate || ''}"`,
        `"${sc.assignedToName}"`,
        sc.resolutionHours ?? '',
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (type === 'rm_productivity') {
      const data = await analyticsRepository.getRmProductivity(filter, scope);
      filename = `COREvia_RM_Productivity_${timestamp}.csv`;
      const headers = ['Employee ID', 'Officer Name', 'Department', 'Assigned Customers', 'Open Tasks', 'Completed Tasks', 'Overdue Tasks', 'Completion Rate (%)', 'Active Opportunities', 'Pipeline Value (INR)', 'Interactions Logged', 'Average Customer CORE Score'];
      const rows = data.officers.map((off) => [
        `"${off.employeeId}"`,
        `"${off.rmName}"`,
        `"${off.department}"`,
        off.assignedCustomersCount,
        off.openTasks,
        off.completedTasks,
        off.overdueTasks,
        off.completionRate,
        off.activeOpportunitiesCount,
        off.pipelineValue,
        off.interactionsLogged,
        off.averageCustomerCoreScore,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      const data = await analyticsRepository.getProductPenetration(filter, scope);
      filename = `COREvia_Product_Penetration_${timestamp}.csv`;
      const headers = ['Product Code', 'Product Name', 'Category', 'Enrolled Customers', 'Penetration (%)', 'Total Relationship Value (INR)'];
      const rows = data.products.map((p) => [
        `"${p.productCode}"`,
        `"${p.productName}"`,
        `"${p.category}"`,
        p.enrolledCustomers,
        p.penetrationPercentage,
        p.relationshipValueSum,
      ]);
      content = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    }

    await this.logAnalyticsAudit('ANALYTICS_EXPORT', type.toUpperCase(), { type, filename }, user);
    return { filename, content };
  },
};
