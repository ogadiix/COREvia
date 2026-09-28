import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { decisionTraceService } from '../services/decisionTrace.service.ts';
import { formatErrorResponse } from '../lib/errors.ts';

export const decisionTraceRouter = Router();

/**
 * GET /api/decision-traces
 * List decision traces with optional customerId, sourceEngine, and pagination
 */
decisionTraceRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = req.query.customerId ? parseInt(String(req.query.customerId), 10) : undefined;
    const sourceEngine = req.query.sourceEngine ? String(req.query.sourceEngine) : undefined;
    const decisionType = req.query.decisionType ? String(req.query.decisionType) : undefined;
    const decisionStatus = req.query.decisionStatus ? String(req.query.decisionStatus) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;
    const offset = req.query.offset ? parseInt(String(req.query.offset), 10) : 0;

    const result = await decisionTraceService.listDecisionTraces(
      { customerId, sourceEngine, decisionType, decisionStatus, limit, offset },
      req.user!,
      req.requestId
    );
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/decision-traces/analytics
 * Retrieve descriptive explainability analytics
 */
decisionTraceRouter.get('/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const analytics = await decisionTraceService.getAnalytics(req.user!, req.requestId);
    res.json(analytics);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/decision-traces/search
 * Global search across decision trace IDs, recommendations, and summaries
 */
decisionTraceRouter.get('/search', requireAuth, async (req: AuthRequest, res) => {
  try {
    const query = String(req.query.q || '');
    const results = await decisionTraceService.searchDecisionTraces(query, req.user!, req.requestId);
    res.json(results);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/decision-traces/:id
 * Retrieve a specific decision trace with evidence, source chain, and data freshness
 */
decisionTraceRouter.get('/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const trace = await decisionTraceService.getDecisionTrace(req.params.id, req.user!, req.requestId);
    res.json(trace);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/decision-traces/:id/evidence
 * Retrieve granular evidence list contributing to this decision
 */
decisionTraceRouter.get('/:id/evidence', requireAuth, async (req: AuthRequest, res) => {
  try {
    const evidence = await decisionTraceService.getDecisionEvidence(req.params.id, req.user!, req.requestId);
    res.json(evidence);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/decision-traces/:id/sources
 * Retrieve source chain nodes showing originating banking systems and data flow
 */
decisionTraceRouter.get('/:id/sources', requireAuth, async (req: AuthRequest, res) => {
  try {
    const sources = await decisionTraceService.getDecisionSources(req.params.id, req.user!, req.requestId);
    res.json(sources);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/decision-traces/:id/history
 * Retrieve chronological decision history for the customer associated with this trace (or customerId)
 */
decisionTraceRouter.get('/:id/history', requireAuth, async (req: AuthRequest, res) => {
  try {
    const param = req.params.id;
    let customerId: number;

    if (/^\d+$/.test(param)) {
      // Check if it's a customer ID or a trace ID
      const asTrace = await decisionTraceService.getDecisionTrace(param, req.user!, req.requestId).catch(() => null);
      customerId = asTrace?.customerId || parseInt(param, 10);
    } else {
      const trace = await decisionTraceService.getDecisionTrace(param, req.user!, req.requestId);
      if (!trace.customerId) {
        return res.status(400).json({ error: 'Decision trace has no associated customer.' });
      }
      customerId = trace.customerId;
    }

    const history = await decisionTraceService.getDecisionHistory(customerId, req.user!, req.requestId);
    res.json(history);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/decision-traces/:id/compare/:otherId
 * Compare two decision traces and return structural deltas
 */
decisionTraceRouter.get('/:id/compare/:otherId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const comparison = await decisionTraceService.compareDecisionTraces(
      req.params.id,
      req.params.otherId,
      req.user!,
      req.requestId
    );
    res.json(comparison);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/decision-traces/:id/confirm
 * Human officer confirms recommendation
 */
decisionTraceRouter.post('/:id/confirm', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { notes } = req.body || {};
    const updated = await decisionTraceService.confirmDecisionAction(
      req.params.id,
      notes || '',
      req.user!,
      req.requestId
    );
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/decision-traces/:id/reject
 * Human officer rejects/dismisses recommendation with reason
 */
decisionTraceRouter.post('/:id/reject', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { reason } = req.body || {};
    const updated = await decisionTraceService.rejectDecisionAction(
      req.params.id,
      reason,
      req.user!,
      req.requestId
    );
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/decision-traces/:id/execute
 * Human officer executes the confirmed action in core banking workflow
 */
decisionTraceRouter.post('/:id/execute', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { outcome } = req.body || {};
    const updated = await decisionTraceService.executeDecisionAction(
      req.params.id,
      outcome || 'Action successfully completed in core banking workflow.',
      req.user!,
      undefined,
      req.requestId
    );
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});
