/**
 * COREvia Phase 37: Advanced Portfolio Intelligence API Routes
 * Explainable, non-predictive portfolio analytics and changelog.
 */

import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { portfolioIntelligenceService } from '../services/portfolioIntelligence.service.ts';
import { formatErrorResponse } from '../lib/errors.ts';
import { exportRateLimiter } from '../middleware/security.ts';
import { PortfolioFilterParams } from '../types/portfolioIntelligence.types.ts';

export const portfolioIntelligenceRouter = Router();
portfolioIntelligenceRouter.use(requireAuth);

const PORTFOLIO_ROLES = [
  'ADMINISTRATOR',
  'BRANCH_MANAGER',
  'RELATIONSHIP_MANAGER',
  'BRANCH_OPS_HEAD',
  'COMPLIANCE_OFFICER',
  'OPERATIONS',
];

/**
 * Helper to extract portfolio query filters
 */
function parsePortfolioFilters(query: any): PortfolioFilterParams {
  return {
    rmId: query.rmId ? parseInt(query.rmId as string, 10) : undefined,
    branchId: query.branchId ? parseInt(query.branchId as string, 10) : undefined,
    segment: query.segment as string | undefined,
    entityType: query.entityType as string | undefined,
    tier: query.tier as string | undefined,
    status: query.status as string | undefined,
    coreScoreBand: query.coreScoreBand as any,
    momentumState: query.momentumState as any,
    serviceHealth: query.serviceHealth as any,
    opportunityStage: query.opportunityStage as string | undefined,
    signalSeverity: query.signalSeverity as any,
    period: query.period as any,
    startDate: query.startDate as string | undefined,
    endDate: query.endDate as string | undefined,
    search: query.search as string | undefined,
  };
}

/**
 * GET /api/portfolio-intelligence/overview
 */
portfolioIntelligenceRouter.get('/overview', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getPortfolioOverview(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-OVERVIEW');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/health-distribution
 */
portfolioIntelligenceRouter.get('/health-distribution', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getRelationshipHealthDistribution(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-HEALTH');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/core-score-analysis
 */
portfolioIntelligenceRouter.get('/core-score-analysis', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getCoreScoreAnalysis(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-CORE');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/relationship-value
 */
portfolioIntelligenceRouter.get('/relationship-value', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getRelationshipValueAnalysis(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-VAL');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/product-penetration
 */
portfolioIntelligenceRouter.get('/product-penetration', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getProductPenetration(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-PROD');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/engagement
 */
portfolioIntelligenceRouter.get('/engagement', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getEngagementIntelligence(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-ENG');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/service-quality
 */
portfolioIntelligenceRouter.get('/service-quality', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getServiceQuality(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-SRV');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/opportunities
 */
portfolioIntelligenceRouter.get('/opportunities', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getOpportunityPortfolio(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-OPP');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/signals
 */
portfolioIntelligenceRouter.get('/signals', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getSignalPortfolio(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-SIG');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/nbas
 */
portfolioIntelligenceRouter.get('/nbas', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getNbaPortfolio(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-NBA');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/action-outcomes
 */
portfolioIntelligenceRouter.get('/action-outcomes', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getActionOutcomes(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-ACT');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/what-changed
 */
portfolioIntelligenceRouter.get('/what-changed', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getWhatChanged(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-CHG');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/changelog
 */
portfolioIntelligenceRouter.get('/changelog', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getPortfolioChangelog(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-LOG');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/health-matrix
 */
portfolioIntelligenceRouter.get('/health-matrix', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getHealthMatrix(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-MTX');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/focus-areas
 */
portfolioIntelligenceRouter.get('/focus-areas', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const data = await portfolioIntelligenceService.getFocusAreas(req.user!, filters);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-FOC');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/customers
 * Drill-down customer table with pagination
 */
portfolioIntelligenceRouter.get('/customers', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const allCustomers = await portfolioIntelligenceService.getCustomerDrillDownList(req.user!, filters);
    const total = allCustomers.length;
    const start = (page - 1) * limit;
    const paginated = allCustomers.slice(start, start + limit);
    return res.json({
      success: true,
      data: {
        customers: paginated,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-CUSTS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/customers/:id
 * Individual customer portfolio profile drawer data
 */
portfolioIntelligenceRouter.get('/customers/:id', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.id, 10);
    const data = await portfolioIntelligenceService.getCustomerPortfolioProfile(customerId, req.user!);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-CUST-PROFILE');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/comparison
 * Compare two historical or current periods
 */
portfolioIntelligenceRouter.get('/comparison', requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const period1 = (req.query.period1 as string) || '30D_AGO';
    const period2 = (req.query.period2 as string) || 'CURRENT';
    const data = await portfolioIntelligenceService.getPortfolioComparison(req.user!, period1, period2);
    return res.json({ success: true, data });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-COMP');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/portfolio-intelligence/export
 * Export portfolio customer data as CSV with rate limiting and audit logging
 */
portfolioIntelligenceRouter.get('/export', exportRateLimiter, requireRole(...PORTFOLIO_ROLES), async (req: AuthRequest, res) => {
  try {
    const filters = parsePortfolioFilters(req.query);
    const csvContent = await portfolioIntelligenceService.exportPortfolioCSV(
      req.user!,
      filters,
      req.requestId || 'REQ-PORT-EXP'
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="portfolio-intelligence-${Date.now()}.csv"`);
    return res.status(200).send(csvContent);
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-PORT-EXPORT');
    return res.status(statusCode).json(body);
  }
});
