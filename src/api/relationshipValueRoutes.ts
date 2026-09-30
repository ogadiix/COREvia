/**
 * COREvia Phase 32: Relationship Value & Portfolio Scenario Intelligence Routes
 * Exposes governed endpoints for relationship value profiles, historical trends, scenario comparisons, and portfolio analytics.
 */

import { Router, Response } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { relationshipValueService } from '../services/relationshipValue.service.ts';
import { strategySimulatorService } from '../services/strategySimulator.service.ts';
import { BankingError } from '../lib/errors.ts';

export const relationshipValueRouter = Router();

/**
 * GET /api/relationship-value/portfolio
 * Portfolio-wide relationship value distribution and segment analytics
 */
relationshipValueRouter.get('/portfolio', requireAuth, async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const result = await relationshipValueService.getPortfolioAnalytics(user, req.requestId!, req.query);
  return res.json({
    success: true,
    data: result,
  });
});

/**
 * GET /api/relationship-value/:customerId
 * Retrieve current multi-dimensional relationship value profile
 */
relationshipValueRouter.get('/:customerId', requireAuth, async (req: AuthRequest, res: Response) => {
  const customerId = parseInt(req.params.customerId, 10);
  if (isNaN(customerId)) {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Customer ID must be a number' } });
  }

  const profile = await relationshipValueService.getCurrentProfile(customerId, req.user!, req.requestId!);
  return res.json({
    success: true,
    data: profile,
  });
});

/**
 * GET /api/relationship-value/:customerId/history
 * Historical 30/60/90-day relationship value profile timeline
 */
relationshipValueRouter.get('/:customerId/history', requireAuth, async (req: AuthRequest, res: Response) => {
  const customerId = parseInt(req.params.customerId, 10);
  if (isNaN(customerId)) {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Customer ID must be a number' } });
  }

  const history = await relationshipValueService.getHistory(customerId, req.user!, req.requestId!);
  return res.json({
    success: true,
    data: history,
  });
});

/**
 * GET /api/relationship-value/:customerId/compare/:scenarioId
 * Compares current profile against a simulated Phase 30 strategy scenario
 */
relationshipValueRouter.get('/:customerId/compare/:scenarioId', requireAuth, async (req: AuthRequest, res: Response) => {
  const customerId = parseInt(req.params.customerId, 10);
  const scenarioId = req.params.scenarioId;

  if (isNaN(customerId) || !scenarioId) {
    return res.status(400).json({ error: { code: 'INVALID_PARAMS', message: 'Customer ID and Scenario ID required' } });
  }

  const comparison = await relationshipValueService.compareScenario(customerId, scenarioId, req.user!, req.requestId!);
  return res.json({
    success: true,
    data: comparison,
  });
});

/**
 * POST /api/relationship-value/:customerId/simulate
 * Creates or simulates a quick scenario and returns the comparison profile
 */
relationshipValueRouter.post('/:customerId/simulate', requireAuth, async (req: AuthRequest, res: Response) => {
  const customerId = parseInt(req.params.customerId, 10);
  if (isNaN(customerId)) {
    return res.status(400).json({ error: { code: 'INVALID_ID', message: 'Customer ID must be a number' } });
  }

  const { actions, name, description } = req.body;
  if (!actions || !Array.isArray(actions) || actions.length === 0) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'At least 1 action is required' } });
  }

  // 1. Create a transient or saved scenario via Phase 30 Strategy Simulator
  const scenario = await strategySimulatorService.createScenario(
    {
      customerId,
      name: name || `Ad-hoc Strategy: Customer #${customerId}`,
      description: description || 'Ad-hoc relationship value impact evaluation',
      actions,
    },
    req.user!
  );

  // 2. Compare against base snapshot
  const comparison = await relationshipValueService.compareScenario(customerId, scenario.scenarioId, req.user!, req.requestId!);
  return res.status(201).json({
    success: true,
    data: comparison,
  });
});
