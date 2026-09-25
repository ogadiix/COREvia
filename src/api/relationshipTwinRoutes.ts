import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { formatErrorResponse } from '../lib/errors.ts';
import { relationshipTwinService } from '../services/relationshipTwin.service.ts';

export const relationshipTwinRouter = Router();

/**
 * GET /api/relationship-twin/analytics
 * High-level portfolio digital twin distribution, signals, and action execution
 */
relationshipTwinRouter.get('/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const analytics = await relationshipTwinService.getAnalytics({
      id: req.user!.id,
      role: req.user!.role,
    });
    res.json(analytics);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/relationship-twin/:customerId
 * Comprehensive synthesized Relationship Twin state for a customer
 */
relationshipTwinRouter.get('/:customerId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const overview = await relationshipTwinService.getRelationshipTwin(customerId, {
      id: req.user!.id,
      role: req.user!.role,
      name: req.user!.name,
    });
    res.json(overview);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/relationship-twin/:customerId/compare
 * Compare two historical snapshots (e.g. ?snapA=SNP-01&snapB=SNP-02)
 */
relationshipTwinRouter.get('/:customerId/compare', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const snapA = req.query.snapA as string;
    const snapB = req.query.snapB as string;

    if (!snapA || !snapB) {
      return res.status(400).json({ error: 'Both snapA and snapB query parameters are required' });
    }

    const comparison = await relationshipTwinService.compareSnapshots(customerId, snapA, snapB);
    res.json(comparison);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/relationship-twin/:customerId/snapshot
 * Generate a point-in-time snapshot
 */
relationshipTwinRouter.post('/:customerId/snapshot', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const { summaryNotes } = req.body;
    const snapshot = await relationshipTwinService.createSnapshot(
      customerId,
      {
        id: req.user!.id,
        role: req.user!.role,
        name: req.user!.name,
      },
      summaryNotes
    );
    res.status(201).json(snapshot);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/relationship-twin/:customerId/signals/:signalId
 * Acknowledge, resolve, or dismiss a relationship signal
 */
relationshipTwinRouter.patch('/:customerId/signals/:signalId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const signalId = parseInt(req.params.signalId, 10);
    const { status, notes } = req.body;

    const updated = await relationshipTwinService.updateSignalStatus(
      customerId,
      signalId,
      status,
      {
        id: req.user!.id,
        name: req.user!.name,
      },
      notes
    );
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/relationship-twin/:customerId/actions
 * Log an action trace originating from the Relationship Twin
 */
relationshipTwinRouter.post('/:customerId/actions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const trace = await relationshipTwinService.logActionTrace(
      customerId,
      req.body,
      {
        id: req.user!.id,
        name: req.user!.name,
      }
    );
    res.status(201).json(trace);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});
