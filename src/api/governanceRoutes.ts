/**
 * COREvia Phase 35: Trust & Governance Center API Routes
 * Enterprise governance observability and exception management.
 */

import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { governanceService } from '../services/governance.service.ts';
import { formatErrorResponse } from '../lib/errors.ts';

export const governanceRouter = Router();

// Allow enterprise roles: Admin, Compliance, Branch Ops Head, RM, Auditor
const GOVERNANCE_ROLES = [
  'ADMINISTRATOR',
  'COMPLIANCE_OFFICER',
  'BRANCH_OPS_HEAD',
  'RELATIONSHIP_MANAGER',
  'AUDITOR',
];

const GOVERNANCE_ADMIN_ROLES = ['ADMINISTRATOR', 'COMPLIANCE_OFFICER', 'BRANCH_OPS_HEAD'];

/**
 * GET /api/governance/overview
 * High-level enterprise governance status & activity metrics
 */
governanceRouter.get('/overview', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const overview = await governanceService.getOverview(req.user!);
    return res.json({ success: true, data: overview });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-OVERVIEW');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/audit
 * Audit Explorer with filter criteria and tamper-evident chaining verification
 */
governanceRouter.get('/audit', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const { actor, role, event, module, customer, group, outcome, requestId, limit, offset } = req.query;
    const auditData = await governanceService.getAuditExplorer(
      {
        actor: actor as string,
        role: role as string,
        event: event as string,
        module: module as string,
        customer: customer as string,
        group: group as string,
        outcome: outcome as string,
        requestId: requestId as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      },
      req.user!
    );
    return res.json({ success: true, data: auditData });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-AUDIT');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/ai
 * AI Governance metrics, source classification breakdown, and safe Gemini configuration
 */
governanceRouter.get('/ai', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const aiGov = await governanceService.getAIGovernance(req.user!);
    return res.json({ success: true, data: aiGov });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-AI');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/agents
 * Agent Governance metrics, plan states, executions, and recent plans
 */
governanceRouter.get('/agents', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const agentGov = await governanceService.getAgentGovernance(req.user!);
    return res.json({ success: true, data: agentGov });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-AGENTS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/security
 * Security Center metrics, authorization anomalies, and configuration status
 */
governanceRouter.get(
  '/security',
  requireAuth,
  requireRole('ADMINISTRATOR', 'COMPLIANCE_OFFICER', 'BRANCH_OPS_HEAD'),
  async (req: AuthRequest, res) => {
    try {
      const securityGov = await governanceService.getSecurityGovernance(req.user!);
      return res.json({ success: true, data: securityGov });
    } catch (error) {
      const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-SECURITY');
      return res.status(statusCode).json(body);
    }
  }
);

/**
 * GET /api/governance/access
 * Access Governance events, login/logout, and denied requests
 */
governanceRouter.get('/access', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const accessGov = await governanceService.getAccessGovernance(req.user!);
    return res.json({ success: true, data: accessGov });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-ACCESS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/data
 * Data Governance metrics and canonical intelligence lineage
 */
governanceRouter.get('/data', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const dataGov = await governanceService.getDataGovernance(req.user!);
    return res.json({ success: true, data: dataGov });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-DATA');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/approvals
 * Approval Center pending approvals across agents, transfers, and sensitive operations
 */
governanceRouter.get('/approvals', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const approvals = await governanceService.getApprovals(req.user!);
    return res.json({ success: true, data: approvals });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-APPROVALS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/decisions
 * Decision Governance & Strategy Simulation integration
 */
governanceRouter.get('/decisions', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const decisions = await governanceService.getDecisionGovernance(req.user!);
    return res.json({ success: true, data: decisions });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-DECISIONS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/exports
 * Lightweight export governance tracking
 */
governanceRouter.get('/exports', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const exportsData = await governanceService.getExports(req.user!);
    return res.json({ success: true, data: exportsData });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-EXPORTS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/health
 * System Health checks: API, Database, Authentication, Gemini, Notifications, Search
 */
governanceRouter.get('/health', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const health = await governanceService.getSystemHealth(req.user!);
    return res.json({ success: true, data: health });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-HEALTH');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/governance/exceptions
 * List governance exceptions with optional filtering
 */
governanceRouter.get('/exceptions', requireAuth, requireRole(...GOVERNANCE_ROLES), async (req: AuthRequest, res) => {
  try {
    const { status, category, severity, limit, offset } = req.query;
    const exceptions = await governanceService.getExceptions(
      {
        status: status as any,
        category: category as any,
        severity: severity as any,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0,
      },
      req.user!
    );
    return res.json({ success: true, data: exceptions });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-EXCEPTIONS');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/governance/exceptions/:id/acknowledge
 * Move exception from OPEN to UNDER_REVIEW and assign to current actor
 */
governanceRouter.post(
  '/exceptions/:id/acknowledge',
  requireAuth,
  requireRole(...GOVERNANCE_ADMIN_ROLES),
  async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await governanceService.acknowledgeException(id, req.user!);
      return res.json({ success: true, data: updated });
    } catch (error) {
      const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-EXC-ACK');
      return res.status(statusCode).json(body);
    }
  }
);

/**
 * POST /api/governance/exceptions/:id/assign
 * Reassign exception to an authorized investigator
 */
governanceRouter.post(
  '/exceptions/:id/assign',
  requireAuth,
  requireRole(...GOVERNANCE_ADMIN_ROLES),
  async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { assignedTo } = req.body;
      const assignedToId = typeof assignedTo === 'number' ? assignedTo : parseInt(assignedTo, 10);
      if (!assignedToId || isNaN(assignedToId)) {
        return res.status(400).json({ error: { message: 'Valid assignedTo user ID is required' } });
      }
      const updated = await governanceService.assignException(id, assignedToId, req.user!);
      return res.json({ success: true, data: updated });
    } catch (error) {
      const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-EXC-ASSIGN');
      return res.status(statusCode).json(body);
    }
  }
);

/**
 * POST /api/governance/exceptions/:id/resolve
 * Mark exception as RESOLVED with required rationale
 */
governanceRouter.post(
  '/exceptions/:id/resolve',
  requireAuth,
  requireRole(...GOVERNANCE_ADMIN_ROLES),
  async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { resolution } = req.body;
      if (!resolution || resolution.trim().length === 0) {
        return res.status(400).json({ error: { message: 'Resolution rationale is required' } });
      }
      const updated = await governanceService.resolveException(id, resolution, req.user!);
      return res.json({ success: true, data: updated });
    } catch (error) {
      const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-EXC-RESOLVE');
      return res.status(statusCode).json(body);
    }
  }
);

/**
 * POST /api/governance/exceptions/:id/dismiss
 * Dismiss an exception with audited explanation
 */
governanceRouter.post(
  '/exceptions/:id/dismiss',
  requireAuth,
  requireRole(...GOVERNANCE_ADMIN_ROLES),
  async (req: AuthRequest, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { reason } = req.body;
      if (!reason || reason.trim().length === 0) {
        return res.status(400).json({ error: { message: 'Dismissal reason is required' } });
      }
      const updated = await governanceService.dismissException(id, reason, req.user!);
      return res.json({ success: true, data: updated });
    } catch (error) {
      const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-GOV-EXC-DISMISS');
      return res.status(statusCode).json(body);
    }
  }
);
