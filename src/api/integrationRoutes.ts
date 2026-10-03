/**
 * COREvia Phase 38: Enterprise Integration & API Gateway Routes
 * Exposes governed endpoints for registry, adapters, simulators, webhooks, and events.
 */

import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { integrationService } from '../services/integrations/integration.service.ts';
import { gatewayService } from '../services/integrations/gateway.service.ts';
import { formatErrorResponse } from '../lib/errors.ts';

export const integrationRouter = Router();
integrationRouter.use(requireAuth);

const INTEGRATION_ADMIN_ROLES = [
  'ADMINISTRATOR',
  'BRANCH_OPS_HEAD',
  'COMPLIANCE_OFFICER',
  'OPERATIONS',
  'BRANCH_MANAGER',
  'RELATIONSHIP_MANAGER',
];

/**
 * GET /api/integrations/summary
 * Aggregate metrics for Overview panel
 */
integrationRouter.get('/summary', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const summary = await integrationService.getSummaryAnalytics();
    return res.json({ success: true, data: summary });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-SUMMARY');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/integrations/endpoints/all
 * List all registered API endpoints
 */
integrationRouter.get('/endpoints/all', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const integrationId = req.query.integrationId as string | undefined;
    const endpoints = await integrationService.listEndpoints(integrationId);
    return res.json({ success: true, data: endpoints });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-ENDPOINTS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/integrations/webhooks/all
 * List registered webhooks
 */
integrationRouter.get('/webhooks/all', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const integrationId = req.query.integrationId as string | undefined;
    const webhooks = await integrationService.listWebhooks(integrationId);
    return res.json({ success: true, data: webhooks });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-WEBHOOKS');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/integrations/webhooks
 * Register a new webhook (Admin only)
 */
integrationRouter.post('/webhooks', requireRole('ADMINISTRATOR', 'BRANCH_OPS_HEAD'), async (req: AuthRequest, res: Response) => {
  try {
    const { integrationId, eventType, targetUrl } = req.body;
    const result = await integrationService.createWebhook({ integrationId, eventType, targetUrl }, req.user!);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-WHK-CREATE');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/integrations/webhooks/:webhookId/test
 * Trigger synthetic webhook delivery test
 */
integrationRouter.post('/webhooks/:webhookId/test', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const delivery = await integrationService.triggerWebhookDelivery(req.params.webhookId, req.body.payload || {}, req.user!);
    return res.json({ success: true, data: delivery });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-WHK-TEST');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/integrations/deliveries/all
 * List webhook delivery history
 */
integrationRouter.get('/deliveries/all', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const deliveries = await integrationService.listDeliveries({
      webhookId: req.query.webhookId as string,
      status: req.query.status as string,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    return res.json({ success: true, data: deliveries });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-DELIVERIES');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/integrations/deliveries/:deliveryId/retry
 * Retry a failed webhook delivery
 */
integrationRouter.post('/deliveries/:deliveryId/retry', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const retried = await integrationService.retryWebhookDelivery(req.params.deliveryId, req.user!);
    return res.json({ success: true, data: retried });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-DELIVERY-RETRY');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/integrations/events/all
 * List integration events
 */
integrationRouter.get('/events/all', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const events = await integrationService.listEvents({
      integrationId: req.query.integrationId as string,
      status: req.query.status as string,
      direction: req.query.direction as string,
      search: req.query.search as string,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    return res.json({ success: true, data: events });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-EVENTS');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/integrations/failures/all
 * List failures and retry opportunities
 */
integrationRouter.get('/failures/all', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const failures = await integrationService.listFailures();
    return res.json({ success: true, data: failures });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-FAILURES');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/integrations/:id/health-check
 * Run live connectivity/health check on an adapter
 */
integrationRouter.post('/:id/health-check', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const result = await integrationService.testConnection(req.params.id, req.user!);
    return res.json({ success: true, data: result });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-HEALTH');
    return res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/integrations/:id/status
 * Enable or Disable integration (Admin only)
 */
integrationRouter.patch('/:id/status', requireRole('ADMINISTRATOR', 'BRANCH_OPS_HEAD'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, reason } = req.body;
    const updated = await integrationService.updateStatus(req.params.id, status, req.user!, reason);
    return res.json({ success: true, data: updated });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-STATUS');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/integrations/:id/execute
 * Test execute an operation through API Gateway with idempotency & rate limiting
 */
integrationRouter.post('/:id/execute', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const { operation, payload } = req.body;
    const idempotencyKey = (req.headers['idempotency-key'] as string) || (req.body.idempotencyKey as string);
    const correlationId = (req.headers['x-correlation-id'] as string) || `CORR-EXE-${Date.now()}`;

    const response = await gatewayService.processRequest({
      integrationId: req.params.id,
      operation,
      endpointPath: `/api/integrations/${req.params.id}/execute`,
      payload: payload || {},
      context: {
        correlationId,
        actorId: req.user!.employeeId || String(req.user!.id),
        actorRole: req.user!.role,
        environment: 'DEVELOPMENT',
        idempotencyKey,
      },
    });

    return res.status(response.statusCode).json({
      success: response.success,
      data: response.data,
      error: response.error,
      latencyMs: response.latencyMs,
      simulated: response.simulated,
      correlationId: response.correlationId,
    });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-EXECUTE');
    return res.status(statusCode).json(body);
  }
});

/**
 * POST /api/integrations/:id/api-keys
 * Generate new API Key (Admin only)
 */
integrationRouter.post('/:id/api-keys', requireRole('ADMINISTRATOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, permissions } = req.body;
    const result = await integrationService.createApiKey(
      req.params.id,
      name || 'Default Service Key',
      permissions || ['read', 'execute'],
      req.user!
    );
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-APIKEY');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/integrations/:id
 * Retrieve single integration details
 */
integrationRouter.get('/:id', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const item = await integrationService.getIntegration(req.params.id);
    return res.json({ success: true, data: item });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-GET');
    return res.status(statusCode).json(body);
  }
});

/**
 * GET /api/integrations
 * List all integrations with filters
 */
integrationRouter.get('/', requireRole(...INTEGRATION_ADMIN_ROLES), async (req: AuthRequest, res: Response) => {
  try {
    const items = await integrationService.listIntegrations({
      domain: req.query.domain as string,
      mode: req.query.mode as string,
      status: req.query.status as string,
      search: req.query.search as string,
    });
    return res.json({ success: true, data: items });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, req.requestId || 'REQ-INT-LIST');
    return res.status(statusCode).json(body);
  }
});
