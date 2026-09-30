/**
 * COREvia Phase 33: Customer Journey Orchestrator & Lifecycle Management API Routes
 * Exposes governed endpoints for templates, customer journeys, step transitions,
 * evidence inspection, handoffs, escalations, outcomes, and portfolio analytics.
 */

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { journeyService } from '../services/journey.service.ts';
import { BankingError } from '../lib/errors.ts';

export const journeyRouter = Router();

/**
 * GET /api/journeys/templates
 * List all active lifecycle journey templates
 */
journeyRouter.get('/templates', requireAuth, async (req: AuthRequest, res: Response) => {
  const templates = await journeyService.listTemplates();
  return res.json({
    success: true,
    data: templates,
  });
});

/**
 * GET /api/journeys/analytics
 * Portfolio journey metrics, status distributions, and bottleneck detection
 */
journeyRouter.get('/analytics', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const analytics = await journeyService.getPortfolioAnalytics(user, req.requestId!);
  return res.json({
    success: true,
    data: analytics,
  });
});

/**
 * GET /api/journeys
 * List customer journeys with optional filters (customerId, status, priority, slaStatus, type, search)
 */
journeyRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
  const status = req.query.status as any;
  const priority = req.query.priority as any;
  const slaStatus = req.query.slaStatus as any;
  const journeyType = req.query.journeyType as string | undefined;
  const ownerId = req.query.ownerId ? Number(req.query.ownerId) : undefined;
  const search = req.query.search as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const offset = req.query.offset ? Number(req.query.offset) : 0;

  const journeys = await journeyService.listJourneys(
    {
      customerId,
      status,
      priority,
      slaStatus,
      journeyType,
      ownerId,
      search,
      limit,
      offset,
    },
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: journeys,
  });
});

/**
 * POST /api/journeys
 * Create and initiate a customer journey
 */
journeyRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const { customerId, templateCode, name, description, priority, ownerId, metadata } = req.body;

  if (!customerId || !templateCode) {
    throw new BankingError(400, 'customerId and templateCode are required to start a journey.');
  }

  const journey = await journeyService.createJourney(
    {
      customerId: Number(customerId),
      templateCode,
      name,
      description,
      priority,
      ownerId: ownerId ? Number(ownerId) : undefined,
      metadata,
    },
    user,
    req.requestId!
  );

  return res.status(201).json({
    success: true,
    data: journey,
  });
});

/**
 * GET /api/journeys/:id
 * Retrieve full journey details with progress, steps, and timeline
 */
journeyRouter.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const journey = await journeyService.getJourney(idOrCode, user, req.requestId!);
  return res.json({
    success: true,
    data: journey,
  });
});

/**
 * GET /api/journeys/:id/steps
 * Retrieve steps for a journey
 */
journeyRouter.get('/:id/steps', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const journey = await journeyService.getJourney(idOrCode, user, req.requestId!);
  return res.json({
    success: true,
    data: journey.steps || [],
  });
});

/**
 * GET /api/journeys/:id/timeline
 * Retrieve consolidated real-event timeline for a journey
 */
journeyRouter.get('/:id/timeline', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const journey = await journeyService.getJourney(idOrCode, user, req.requestId!);
  return res.json({
    success: true,
    data: journey.timeline || [],
  });
});

/**
 * GET /api/journeys/:id/evidence
 * Retrieve all completion evidence records for a journey
 */
journeyRouter.get('/:id/evidence', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const idOrCode = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const journey = await journeyService.getJourney(idOrCode, user, req.requestId!);
  const evidenceList = (journey.steps || [])
    .filter((s) => !!s.completionEvidence)
    .map((s) => ({
      stepId: s.stepId,
      stepName: s.name,
      stepNumber: s.stepNumber,
      completedAt: s.completedAt,
      evidence: s.completionEvidence,
    }));

  return res.json({
    success: true,
    data: evidenceList,
  });
});

/**
 * PATCH /api/journeys/:id/steps/:stepId
 * Governed step transition with evidence validation and dependency cascade
 */
journeyRouter.patch('/:id/steps/:stepId', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const journeyId = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const stepId = !isNaN(Number(req.params.stepId)) ? Number(req.params.stepId) : req.params.stepId;
  const { status, notes, completionEvidence, blockedReason } = req.body;

  const updatedJourney = await journeyService.updateStep(
    journeyId,
    stepId,
    {
      status,
      notes,
      completionEvidence,
      blockedReason,
    },
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: updatedJourney,
  });
});

/**
 * POST /api/journeys/:id/handoff
 * Controlled ownership transfer
 */
journeyRouter.post('/:id/handoff', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const journeyId = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const { newOwnerId, newOwnerRole, reason } = req.body;

  if (!newOwnerId || !reason) {
    throw new BankingError(400, 'newOwnerId and reason are required for journey handoff.');
  }

  const updated = await journeyService.handoffJourney(
    journeyId,
    {
      newOwnerId: Number(newOwnerId),
      newOwnerRole,
      reason,
    },
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: updated,
  });
});

/**
 * POST /api/journeys/:id/escalate
 * Controlled journey escalation with Decision Trace link
 */
journeyRouter.post('/:id/escalate', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const journeyId = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const { escalateToUserId, reason } = req.body;

  if (!escalateToUserId || !reason) {
    throw new BankingError(400, 'escalateToUserId and reason are required for escalation.');
  }

  const updated = await journeyService.escalateJourney(
    journeyId,
    {
      escalateToUserId: Number(escalateToUserId),
      reason,
    },
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: updated,
  });
});

/**
 * POST /api/journeys/:id/outcome
 * Record formal journey outcome
 */
journeyRouter.post('/:id/outcome', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const journeyId = !isNaN(Number(req.params.id)) ? Number(req.params.id) : req.params.id;
  const { outcomeType, outcome, summary, evidence } = req.body;

  if (!outcomeType || !outcome || !summary) {
    throw new BankingError(400, 'outcomeType, outcome, and summary are required.');
  }

  const updated = await journeyService.recordOutcome(
    journeyId,
    {
      outcomeType,
      outcome,
      summary,
      evidence,
    },
    user,
    req.requestId!
  );

  return res.json({
    success: true,
    data: updated,
  });
});
