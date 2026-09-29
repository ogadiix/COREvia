/**
 * COREvia Phase 31: Governed Agent REST API Endpoints
 * Routes mounted at /api/agent with strict authentication, role-based checks,
 * rate limiting, IDOR prevention, and comprehensive audit trails.
 */

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { agentRepository } from '../repositories/agent.repository.ts';
import { agentPlanningService } from '../services/agent/agentPlanning.service.ts';
import { agentExecutionService } from '../services/agent/agentExecution.service.ts';
import { contextResolver } from '../services/agent/contextResolver.ts';
import { AGENT_TOOL_REGISTRY } from '../services/agent/agentTools.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { BankingError } from '../lib/errors.ts';

const router = Router();

// Rate limiting state per user
const userRateLimits = new Map<number, { plansCount: number; lastReset: number; activeSessions: number }>();
const MAX_PLANS_PER_MINUTE = 10;
const MAX_ACTIVE_SESSIONS = 5;

function checkRateLimit(userId: number): void {
  const now = Date.now();
  let entry = userRateLimits.get(userId);
  if (!entry || now - entry.lastReset > 60000) {
    entry = { plansCount: 0, lastReset: now, activeSessions: entry?.activeSessions || 0 };
    userRateLimits.set(userId, entry);
  }

  if (entry.plansCount >= MAX_PLANS_PER_MINUTE) {
    throw new BankingError('RATE_LIMIT_EXCEEDED', 'Agent plan creation limit reached (maximum 10 plans/minute).', 429);
  }
  entry.plansCount++;
}

/**
 * GET /api/agent/tools
 * Returns the immutable governed tool catalog
 */
router.get('/tools', requireAuth, async (req: AuthRequest, res: Response) => {
  return res.json({
    success: true,
    data: Object.values(AGENT_TOOL_REGISTRY),
    totalCount: Object.keys(AGENT_TOOL_REGISTRY).length,
  });
});

/**
 * POST /api/agent/sessions
 * Start a new governed agent session with authorized context
 */
router.post('/sessions', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { contextType, contextId, customerId } = req.body;

  if (!contextType) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'contextType is required.' } });
  }

  // Resolve and authorize context server-side
  const resolvedContext = await contextResolver.resolveContext({
    user,
    contextType,
    contextId,
    customerId,
    requestId: req.requestId!,
  });

  const sessionCode = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const session = await agentRepository.createSession({
    sessionId: sessionCode,
    userId: user.id,
    customerId: resolvedContext.customerId,
    contextType,
    contextId: contextId ? String(contextId) : null,
    status: 'ACTIVE',
    metadata: {
      initialSummary: resolvedContext.summary,
      authorizedScope: resolvedContext.authorizedScope,
    },
  });

  session.context = resolvedContext;

  await auditRepository.createLog({
    actorId: user.employeeId,
    actorName: user.name,
    action: 'AGENT_SESSION_STARTED',
    resourceType: 'AGENT_SESSION',
    resourceId: session.sessionId,
    requestId: req.requestId!,
    outcome: 'SUCCESS',
    metadata: {
      contextType,
      customerId: resolvedContext.customerId,
      customerCode: resolvedContext.customerCode,
    },
  });

  return res.status(201).json({
    success: true,
    data: session,
  });
});

/**
 * GET /api/agent/sessions
 * List active & historical sessions for current user
 */
router.get('/sessions', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  const sessions = await agentRepository.listSessions({
    userId: user.role === 'ADMINISTRATOR' ? undefined : user.id,
    limit,
  });

  return res.json({
    success: true,
    data: sessions,
  });
});

/**
 * GET /api/agent/sessions/:id
 * Retrieve session details with authorized context
 */
router.get('/sessions/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = req.params.id;

  const session = await agentRepository.findSessionById(isNaN(Number(idOrCode)) ? idOrCode : Number(idOrCode));
  if (!session) {
    return res.status(404).json({ error: { code: 'SESSION_NOT_FOUND', message: 'Agent session not found.' } });
  }

  // Authorization: Session owner or Admin
  if (session.userId !== user.id && user.role !== 'ADMINISTRATOR' && user.role !== 'BRANCH_MANAGER') {
    return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You cannot access another officer’s agent session.' } });
  }

  // Re-resolve live context
  try {
    session.context = await contextResolver.resolveContext({
      user,
      contextType: session.contextType,
      contextId: session.contextId || undefined,
      customerId: session.customerId,
      requestId: req.requestId!,
    });
  } catch (e) {
    // If target context has shifted, keep historical metadata
  }

  return res.json({
    success: true,
    data: session,
  });
});

/**
 * POST /api/agent/plans
 * Draft and validate an agent plan
 */
router.post('/plans', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  checkRateLimit(user.id);

  const { sessionId, title, objective, decisionTraceId, scenarioId, steps } = req.body;

  if (!sessionId || !title || !objective || !steps) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'sessionId, title, objective, and steps are required.' },
    });
  }

  const plan = await agentPlanningService.createPlan(
    {
      sessionId,
      title,
      objective,
      decisionTraceId,
      scenarioId,
      steps,
    },
    user,
    req.requestId!
  );

  return res.status(201).json({
    success: true,
    data: plan,
  });
});

/**
 * POST /api/agent/plans/from-scenario
 * Create an agent plan directly from Strategy Simulator scenario
 */
router.post('/plans/from-scenario', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { scenarioId } = req.body;

  if (!scenarioId) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'scenarioId is required.' } });
  }

  const plan = await agentPlanningService.createPlanFromStrategyScenario(scenarioId, user, req.requestId!);

  return res.status(201).json({
    success: true,
    data: plan,
  });
});

/**
 * POST /api/agent/plans/from-context
 * Create an agent plan directly from Signal Center / NBA / Customer 360 / Twin
 */
router.post('/plans/from-context', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { customerId, source, title, objective, decisionTraceId } = req.body;

  if (!customerId || !source) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'customerId and source are required.' } });
  }

  const plan = await agentPlanningService.createPlanFromSignalOrNba(
    Number(customerId),
    source,
    title,
    objective,
    user,
    req.requestId!,
    decisionTraceId
  );

  return res.status(201).json({
    success: true,
    data: plan,
  });
});

/**
 * GET /api/agent/plans/:id
 * Retrieve plan details with staleness evaluation
 */
router.get('/plans/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = req.params.id;

  const plan = await agentRepository.findPlanById(isNaN(Number(idOrCode)) ? idOrCode : Number(idOrCode));
  if (!plan) {
    return res.status(404).json({ error: { code: 'PLAN_NOT_FOUND', message: 'Agent plan not found.' } });
  }

  // Check staleness
  plan.isStale = await agentPlanningService.checkPlanStaleness(plan);
  if (plan.isStale) {
    plan.staleReason = 'Plan has expired or underlying banking state changed. Revalidation required.';
  }

  return res.json({
    success: true,
    data: plan,
  });
});

/**
 * POST /api/agent/plans/:id/approve
 * Human authorization gate: Approve plan or approve selected steps (partial approval)
 */
router.post('/plans/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = req.params.id;
  const { approvedStepNumbers } = req.body;

  const approvedPlan = await agentPlanningService.approvePlan(
    isNaN(Number(idOrCode)) ? idOrCode : Number(idOrCode),
    approvedStepNumbers,
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: approvedPlan,
    message: 'Agent plan successfully approved for governed execution.',
  });
});

/**
 * POST /api/agent/plans/:id/reject
 * Reject a plan
 */
router.post('/plans/:id/reject', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = req.params.id;
  const { reason } = req.body;

  const rejected = await agentPlanningService.rejectPlan(
    isNaN(Number(idOrCode)) ? idOrCode : Number(idOrCode),
    reason,
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: rejected,
    message: 'Agent plan rejected and cancelled.',
  });
});

/**
 * POST /api/agent/plans/:id/execute
 * Governed execution orchestrator trigger
 */
router.post('/plans/:id/execute', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = req.params.id;

  const report = await agentExecutionService.executePlan(
    isNaN(Number(idOrCode)) ? idOrCode : Number(idOrCode),
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: report,
    message: `Plan execution completed with status: ${report.status}`,
  });
});

/**
 * GET /api/agent/plans/:id/report
 * Retrieve final execution report and audit trail
 */
router.get('/plans/:id/report', requireAuth, async (req: AuthRequest, res: Response) => {
  const idOrCode = req.params.id;
  const plan = await agentRepository.findPlanById(isNaN(Number(idOrCode)) ? idOrCode : Number(idOrCode));

  if (!plan) {
    return res.status(404).json({ error: { code: 'PLAN_NOT_FOUND', message: 'Plan not found.' } });
  }

  const completed = plan.steps.filter(s => s.status === 'COMPLETED').length;
  const skipped = plan.steps.filter(s => s.status === 'SKIPPED').length;
  const failed = plan.steps.filter(s => s.status === 'FAILED').length;

  const auditReferences = plan.steps
    .filter(s => s.auditLogId !== null && s.auditLogId !== undefined)
    .map(s => ({
      stepNumber: s.stepNumber,
      action: s.actionType,
      auditLogId: s.auditLogId!,
      timestamp: s.completedAt || plan.completedAt || new Date().toISOString(),
    }));

  return res.json({
    success: true,
    data: {
      planId: plan.planId,
      sessionId: String(plan.sessionId),
      status: plan.status,
      totalSteps: plan.steps.length,
      completedStepsCount: completed,
      skippedStepsCount: skipped,
      failedStepsCount: failed,
      startedAt: plan.createdAt,
      completedAt: plan.completedAt,
      executionSteps: plan.steps.map(s => ({
        stepNumber: s.stepNumber,
        actionType: s.actionType,
        status: s.status,
        entityType: s.targetEntityType,
        entityId: s.targetEntityId,
        resultSummary: s.resultSummary || s.errorMessage || '',
        verified: s.verifiedAt !== null,
        auditLogId: s.auditLogId,
        idempotencyKey: s.idempotencyKey,
      })),
      auditReferences,
      summary: `Plan ${plan.planId} executed: ${completed} completed, ${skipped} skipped, ${failed} failed.`,
    },
  });
});

export default router;
