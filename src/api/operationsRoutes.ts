/**
 * COREvia Phase 36: Banking Operations Workspace API Routes
 */

import { Router } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { operationsService } from '../services/operations.service.ts';
import { formatErrorResponse } from '../lib/errors.ts';

export const operationsRouter = Router();
operationsRouter.use(requireAuth);

const OPERATIONS_ROLES = [
  'ADMINISTRATOR',
  'BRANCH_OPS_HEAD',
  'BRANCH_MANAGER',
  'OPERATIONS',
  'MAKER_L2',
  'COMPLIANCE_OFFICER',
  'RELATIONSHIP_MANAGER',
];

/**
 * GET /api/operations/summary
 * Database-backed operational metrics
 */
operationsRouter.get('/summary', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const summary = await operationsService.getSummary(req.user!);
    return res.json({ success: true, data: summary });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-SUMMARY');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/approvals
 * Maker-checker approval queue
 */
operationsRouter.get('/approvals', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { status, priority, requestType, customerId, limit } = req.query;
    const approvals = await operationsService.getApprovals(
      {
        status: status as string,
        priority: priority as string,
        requestType: requestType as string,
        customerId: customerId ? parseInt(customerId as string, 10) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
      },
      req.user!
    );
    return res.json({ success: true, data: approvals });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-APPROVALS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/approvals/:id
 */
operationsRouter.get('/approvals/:id', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const approval = await operationsService.getApprovalById(req.params.id, req.user!);
    return res.json({ success: true, data: approval });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-APPROVAL-GET');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/approvals
 * Create approval request (Maker action)
 */
operationsRouter.post('/approvals', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const created = await operationsService.createApproval(req.body, req.user!, req.requestId);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-APPROVAL-CREATE');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/approvals/:id/action
 * Maker-checker dual-control action: APPROVE, REJECT, RETURN
 */
operationsRouter.post('/approvals/:id/action', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { action, checkerNotes } = req.body;
    const updated = await operationsService.actOnApproval(
      req.params.id,
      action,
      checkerNotes,
      req.user!,
      req.requestId
    );
    return res.json({ success: true, data: updated });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-APPROVAL-ACTION');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/exceptions
 * List operational exceptions
 */
operationsRouter.get('/exceptions', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { category, severity, status, customerId, search, limit } = req.query;
    const exceptions = await operationsService.getExceptions(
      {
        category: category as string,
        severity: severity as string,
        status: status as string,
        customerId: customerId ? parseInt(customerId as string, 10) : undefined,
        search: search as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
      },
      req.user!
    );
    return res.json({ success: true, data: exceptions });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-EXCEPTIONS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/exceptions/:id
 */
operationsRouter.get('/exceptions/:id', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const ex = await operationsService.getExceptionById(req.params.id, req.user!);
    return res.json({ success: true, data: ex });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-EXCEPTION-GET');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/exceptions
 */
operationsRouter.post('/exceptions', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const created = await operationsService.createException(req.body, req.user!, req.requestId);
    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-EXCEPTION-CREATE');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/exceptions/:id/acknowledge
 */
operationsRouter.post('/exceptions/:id/acknowledge', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { notes } = req.body;
    const ack = await operationsService.acknowledgeException(req.params.id, notes, req.user!, req.requestId);
    return res.json({ success: true, data: ack });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-EXCEPTION-ACK');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/exceptions/:id/assign
 */
operationsRouter.post('/exceptions/:id/assign', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { assignedToUserId, notes } = req.body;
    const assigned = await operationsService.assignException(
      req.params.id,
      Number(assignedToUserId),
      notes,
      req.user!,
      req.requestId
    );
    return res.json({ success: true, data: assigned });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-EXCEPTION-ASSIGN');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/exceptions/:id/resolve
 */
operationsRouter.post('/exceptions/:id/resolve', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { resolutionNotes } = req.body;
    const resolved = await operationsService.resolveException(
      req.params.id,
      resolutionNotes,
      req.user!,
      req.requestId
    );
    return res.json({ success: true, data: resolved });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-EXCEPTION-RESOLVE');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/reconciliation
 */
operationsRouter.get('/reconciliation', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { status, reconciliationType, source, limit } = req.query;
    const recs = await operationsService.getReconciliationRecords(
      {
        status: status as string,
        reconciliationType: reconciliationType as string,
        source: source as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
      },
      req.user!
    );
    return res.json({ success: true, data: recs });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-RECONCILIATION');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/reconciliation/:id/review
 */
operationsRouter.post('/reconciliation/:id/review', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { notes, status } = req.body;
    const reviewed = await operationsService.reviewReconciliation(
      req.params.id,
      notes,
      status || 'INVESTIGATING',
      req.user!,
      req.requestId
    );
    return res.json({ success: true, data: reviewed });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-RECON-REVIEW');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/reconciliation/:id/resolve
 */
operationsRouter.post('/reconciliation/:id/resolve', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { resolutionNotes } = req.body;
    const resolved = await operationsService.resolveReconciliation(
      req.params.id,
      resolutionNotes,
      req.user!,
      req.requestId
    );
    return res.json({ success: true, data: resolved });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-RECON-RESOLVE');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/failed-workflows
 */
operationsRouter.get('/failed-workflows', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const workflows = await operationsService.getFailedWorkflows(req.user!);
    return res.json({ success: true, data: workflows });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-FAILED-WORKFLOWS');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/operations/failed-workflows/:id/retry
 */
operationsRouter.post('/failed-workflows/:id/retry', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { workflowType } = req.body;
    const retryResult = await operationsService.retryWorkflow(
      req.params.id,
      workflowType || 'OPERATIONAL_WORKFLOW',
      req.user!,
      req.requestId
    );
    return res.json({ success: true, data: retryResult });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-WORKFLOW-RETRY');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/tasks
 */
operationsRouter.get('/tasks', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const tasksList = await operationsService.getOperationalTasks(req.user!);
    return res.json({ success: true, data: tasksList });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-TASKS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/operations/events
 */
operationsRouter.get('/events', requireRole(...OPERATIONS_ROLES), async (req: AuthRequest, res) => {
  try {
    const { severity, eventType, limit } = req.query;
    const events = await operationsService.getOperationalEvents(
      {
        severity: severity as string,
        eventType: eventType as string,
        limit: limit ? parseInt(limit as string, 10) : 50,
      },
      req.user!
    );
    return res.json({ success: true, data: events });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-OPS-EVENTS');
    return res.status(statusCode).json(body);
  }
});
