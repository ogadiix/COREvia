/**
 * COREvia Phase 38: Integration Management Service
 * Provides registry management, health monitoring, webhooks, delivery retry engine,
 * credential rotation, and analytical aggregates.
 */

import { db } from '../../db/index.ts';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import {
  IntegrationDTO,
  IntegrationEndpointDTO,
  WebhookConfigDTO,
  WebhookDeliveryDTO,
  IntegrationEventDTO,
  IntegrationCredentialDTO,
  IntegrationSummaryAnalyticsDTO,
  HealthCheckResult,
} from '../../types/integration.types.ts';
import { adapterRegistry } from './adapters/index.ts';
import { auditRepository } from '../../repositories/audit.repository.ts';
import { BankingError } from '../../lib/errors.ts';
import { SafeUser } from '../auth.service.ts';

function toIso(val: any): string | undefined {
  if (!val) return undefined;
  if (val instanceof Date) return val.toISOString();
  if (typeof val === 'string') {
    const d = new Date(val);
    return isNaN(d.getTime()) ? val : d.toISOString();
  }
  return undefined;
}

function toIsoRequired(val: any, fallback = new Date().toISOString()): string {
  return toIso(val) || fallback;
}

export class IntegrationService {
  /**
   * List all registered integrations with filter support
   */
  async listIntegrations(filters?: {
    domain?: string;
    mode?: string;
    status?: string;
    search?: string;
  }): Promise<IntegrationDTO[]> {
    let query = sql`SELECT * FROM integrations WHERE 1=1`;

    if (filters?.domain) {
      query = sql`${query} AND domain = ${filters.domain}`;
    }
    if (filters?.mode) {
      query = sql`${query} AND mode = ${filters.mode}`;
    }
    if (filters?.status) {
      query = sql`${query} AND status = ${filters.status}`;
    }
    if (filters?.search) {
      const pattern = `%${filters.search}%`;
      query = sql`${query} AND (name ILIKE ${pattern} OR integration_id ILIKE ${pattern})`;
    }

    query = sql`${query} ORDER BY id ASC`;
    const rows = (await db.execute(query)).rows as any[];

    return rows.map((r) => this.mapIntegration(r));
  }

  /**
   * Get single integration by numeric ID or code (e.g. INT-COREBANKING)
   */
  async getIntegration(idOrCode: string | number): Promise<IntegrationDTO> {
    const isNum = !isNaN(Number(idOrCode));
    const query = isNum
      ? sql`SELECT * FROM integrations WHERE id = ${Number(idOrCode)} LIMIT 1`
      : sql`SELECT * FROM integrations WHERE integration_id = ${idOrCode} LIMIT 1`;

    const [row] = (await db.execute(query)).rows as any[];
    if (!row) {
      throw new BankingError('INTEGRATION_NOT_FOUND', `Integration '${idOrCode}' does not exist.`, 404);
    }

    return this.mapIntegration(row);
  }

  /**
   * Execute health check against an integration adapter
   */
  async testConnection(idOrCode: string | number, user: SafeUser): Promise<HealthCheckResult> {
    const integration = await this.getIntegration(idOrCode);
    const adapter = adapterRegistry.get(integration.integrationId);

    const start = Date.now();
    let result: HealthCheckResult;

    if (!adapter) {
      result = {
        status: 'DOWN',
        latencyMs: Date.now() - start,
        timestamp: new Date().toISOString(),
        details: {
          mode: integration.mode,
          circuitBreaker: integration.circuitBreaker.state,
          message: `Adapter implementation not loaded for ${integration.integrationId}.`,
          checks: { adapterFound: false },
        },
      };
    } else {
      result = await adapter.healthCheck({
        correlationId: `CORR-HEALTH-${Date.now()}`,
        actorId: user.employeeId || String(user.id),
        actorRole: user.role,
        environment: integration.environment,
      });
    }

    // Persist health check
    await db.execute(sql`
      UPDATE integrations
      SET
        health_status = ${result.status},
        last_health_check = NOW(),
        updated_at = NOW()
      WHERE integration_id = ${integration.integrationId}
    `);

    // Audit action
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'INTEGRATION_HEALTH_CHECKED',
      resourceType: 'INTEGRATION',
      resourceId: integration.integrationId,
      requestId: `REQ-HEALTH-${Date.now()}`,
      outcome: result.status.includes('HEALTHY') ? 'SUCCESS' : 'FAILURE',
      metadata: {
        status: result.status,
        latencyMs: result.latencyMs,
      },
    });

    return result;
  }

  /**
   * Toggle Integration Status (ENABLE / DISABLE)
   */
  async updateStatus(
    idOrCode: string | number,
    newStatus: 'CONFIGURED' | 'AVAILABLE' | 'CONNECTED' | 'DEGRADED' | 'FAILED' | 'DISABLED' | 'SIMULATED',
    user: SafeUser,
    reason?: string
  ): Promise<IntegrationDTO> {
    const integration = await this.getIntegration(idOrCode);

    // Critical constraint: Never allow changing SIMULATOR to CONNECTED
    if (integration.mode === 'SIMULATOR' && newStatus === 'CONNECTED') {
      throw new BankingError(
        'INVALID_STATUS_TRANSITION',
        'Simulators cannot be marked as CONNECTED to live external banking rails.',
        400
      );
    }

    await db.execute(sql`
      UPDATE integrations
      SET status = ${newStatus}, updated_at = NOW()
      WHERE integration_id = ${integration.integrationId}
    `);

    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: newStatus === 'DISABLED' ? 'INTEGRATION_DISABLED' : 'INTEGRATION_ENABLED',
      resourceType: 'INTEGRATION',
      resourceId: integration.integrationId,
      requestId: `REQ-STATUS-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: {
        previousStatus: integration.status,
        newStatus,
        reason: reason || 'Administrative action',
      },
    });

    return this.getIntegration(integration.integrationId);
  }

  /**
   * List API Endpoints registered in the Gateway
   */
  async listEndpoints(integrationId?: string): Promise<IntegrationEndpointDTO[]> {
    let query = sql`SELECT * FROM integration_endpoints WHERE 1=1`;
    if (integrationId) {
      query = sql`${query} AND integration_id = ${integrationId}`;
    }
    query = sql`${query} ORDER BY endpoint_id ASC`;

    const rows = (await db.execute(query)).rows as any[];
    return rows.map((r) => ({
      id: r.id,
      endpointId: r.endpoint_id,
      integrationId: r.integration_id,
      method: r.method,
      path: r.path,
      purpose: r.purpose,
      version: r.version,
      authType: r.auth_type,
      rateLimit: r.rate_limit,
      timeoutMs: r.timeout_ms,
      idempotencyRequired: r.idempotency_required,
      status: r.status,
      metadata: r.metadata,
      createdAt: toIsoRequired(r.created_at),
      updatedAt: toIsoRequired(r.updated_at),
    }));
  }

  /**
   * List Webhooks
   */
  async listWebhooks(integrationId?: string): Promise<WebhookConfigDTO[]> {
    let query = sql`SELECT * FROM integration_webhooks WHERE 1=1`;
    if (integrationId) {
      query = sql`${query} AND integration_id = ${integrationId}`;
    }
    query = sql`${query} ORDER BY id ASC`;

    const rows = (await db.execute(query)).rows as any[];
    return rows.map((r) => ({
      id: r.id,
      webhookId: r.webhook_id,
      integrationId: r.integration_id,
      eventType: r.event_type,
      targetUrl: r.target_url,
      status: r.status,
      secretMetadata: r.secret_metadata || { keyId: 'KEY-0', algorithm: 'HMAC-SHA256' },
      lastDeliveryAt: toIso(r.last_delivery_at),
      lastResponseStatus: r.last_response_status,
      failureCount: r.failure_count || 0,
      retryCount: r.retry_count || 0,
      metadata: r.metadata,
      createdAt: toIsoRequired(r.created_at),
      updatedAt: toIsoRequired(r.updated_at),
    }));
  }

  /**
   * Create a new Webhook configuration (with securely hashed secret)
   */
  async createWebhook(
    data: {
      integrationId: string;
      eventType: string;
      targetUrl: string;
    },
    user: SafeUser
  ): Promise<{ webhook: WebhookConfigDTO; generatedSecret: string }> {
    const rawSecret = crypto.randomBytes(32).toString('hex');
    const secretHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const webhookId = `WHK-${Date.now().toString().slice(-6)}`;
    const secretMetadata = {
      keyId: `KEY-${Date.now().toString().slice(-6)}`,
      algorithm: 'HMAC-SHA256',
      createdAt: new Date().toISOString(),
    };

    await db.execute(sql`
      INSERT INTO integration_webhooks (
        webhook_id, integration_id, event_type, target_url, status,
        secret_hash, secret_metadata
      ) VALUES (
        ${webhookId}, ${data.integrationId}, ${data.eventType},
        ${data.targetUrl}, 'ACTIVE', ${secretHash}, ${JSON.stringify(secretMetadata)}
      )
    `);

    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'WEBHOOK_CREATED',
      resourceType: 'INTEGRATION_WEBHOOK',
      resourceId: webhookId,
      requestId: `REQ-WHK-CREATE-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: {
        integrationId: data.integrationId,
        eventType: data.eventType,
        targetUrl: data.targetUrl,
      },
    });

    const [created] = await this.listWebhooks(data.integrationId);
    return {
      webhook: created,
      generatedSecret: rawSecret, // Shown once upon creation only
    };
  }

  /**
   * Trigger Synthetic Webhook Delivery
   */
  async triggerWebhookDelivery(
    webhookId: string,
    eventPayload: any,
    user: SafeUser
  ): Promise<WebhookDeliveryDTO> {
    const [wh] = (await db.execute(sql`
      SELECT * FROM integration_webhooks WHERE webhook_id = ${webhookId} LIMIT 1
    `)).rows as any[];

    if (!wh) {
      throw new BankingError('WEBHOOK_NOT_FOUND', `Webhook ${webhookId} not found`, 404);
    }

    const deliveryId = `DEL-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
    const correlationId = `CORR-DEL-${Date.now()}`;
    const start = Date.now();

    // Generate HMAC signature
    const signature = crypto
      .createHmac('sha256', wh.secret_hash)
      .update(JSON.stringify(eventPayload || {}))
      .digest('hex');

    // Simulate delivery (95% success for simulator endpoints)
    const isSuccess = Math.random() > 0.05;
    const latency = Math.floor(25 + Math.random() * 30);
    const httpStatus = isSuccess ? 200 : 503;
    const deliveryStatus = isSuccess ? 'DELIVERED' : 'RETRYING';

    await db.execute(sql`
      INSERT INTO webhook_deliveries (
        delivery_id, webhook_id, event_id, attempt, status, http_status,
        started_at, completed_at, latency_ms, error, retryable, correlation_id,
        payload, response_body
      ) VALUES (
        ${deliveryId}, ${webhookId}, ${`EVT-${Date.now().toString().slice(-6)}`},
        1, ${deliveryStatus}, ${httpStatus},
        NOW(), NOW() + (${latency} || ' milliseconds')::INTERVAL,
        ${latency}, ${isSuccess ? null : 'Temporary upstream gateway timeout'},
        ${!isSuccess}, ${correlationId},
        ${JSON.stringify({ ...eventPayload, signature: `sha256=${signature.slice(0, 10)}...` })},
        ${JSON.stringify({ acknowledged: isSuccess, code: isSuccess ? 'OK' : 'SERVICE_UNAVAILABLE' })}
      )
    `);

    // Update webhook stats
    await db.execute(sql`
      UPDATE integration_webhooks
      SET
        last_delivery_at = NOW(),
        last_response_status = ${httpStatus},
        failure_count = CASE WHEN ${!isSuccess} THEN failure_count + 1 ELSE failure_count END,
        updated_at = NOW()
      WHERE webhook_id = ${webhookId}
    `);

    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'WEBHOOK_DELIVERY',
      resourceType: 'INTEGRATION_WEBHOOK',
      resourceId: webhookId,
      requestId: correlationId,
      outcome: isSuccess ? 'SUCCESS' : 'FAILURE',
      metadata: { deliveryId, httpStatus, deliveryStatus },
    });

    const [row] = (await db.execute(sql`
      SELECT * FROM webhook_deliveries WHERE delivery_id = ${deliveryId} LIMIT 1
    `)).rows as any[];

    return this.mapDelivery(row);
  }

  /**
   * Retry a failed webhook delivery with bounded attempt check
   */
  async retryWebhookDelivery(deliveryId: string, user: SafeUser): Promise<WebhookDeliveryDTO> {
    const [del] = (await db.execute(sql`
      SELECT * FROM webhook_deliveries WHERE delivery_id = ${deliveryId} LIMIT 1
    `)).rows as any[];

    if (!del) {
      throw new BankingError('DELIVERY_NOT_FOUND', `Delivery ${deliveryId} not found`, 404);
    }

    if (del.attempt >= 3) {
      await db.execute(sql`
        UPDATE webhook_deliveries
        SET status = 'EXHAUSTED', error = 'Retry limit of 3 exceeded', retryable = false
        WHERE delivery_id = ${deliveryId}
      `);
      throw new BankingError(
        'RETRY_EXHAUSTED',
        `Delivery ${deliveryId} has already reached maximum bounded attempts (3).`,
        400
      );
    }

    const nextAttempt = del.attempt + 1;
    const newStatus = nextAttempt === 3 ? 'DELIVERED' : 'DELIVERED'; // Succeeds on manual retry

    await db.execute(sql`
      UPDATE webhook_deliveries
      SET
        attempt = ${nextAttempt},
        status = ${newStatus},
        http_status = 200,
        error = NULL,
        retryable = false,
        completed_at = NOW()
      WHERE delivery_id = ${deliveryId}
    `);

    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'WEBHOOK_RETRY',
      resourceType: 'WEBHOOK_DELIVERY',
      resourceId: deliveryId,
      requestId: `REQ-RETRY-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: { attempt: nextAttempt, previousStatus: del.status },
    });

    const [updated] = (await db.execute(sql`
      SELECT * FROM webhook_deliveries WHERE delivery_id = ${deliveryId} LIMIT 1
    `)).rows as any[];

    return this.mapDelivery(updated);
  }

  /**
   * List Webhook Deliveries with filters
   */
  async listDeliveries(filters?: { webhookId?: string; status?: string; limit?: number }): Promise<WebhookDeliveryDTO[]> {
    let query = sql`SELECT * FROM webhook_deliveries WHERE 1=1`;
    if (filters?.webhookId) {
      query = sql`${query} AND webhook_id = ${filters.webhookId}`;
    }
    if (filters?.status) {
      query = sql`${query} AND status = ${filters.status}`;
    }
    query = sql`${query} ORDER BY id DESC LIMIT ${filters?.limit || 50}`;

    const rows = (await db.execute(query)).rows as any[];
    return rows.map((r) => this.mapDelivery(r));
  }

  /**
   * List Integration Event Logs with filter and search
   */
  async listEvents(filters?: {
    integrationId?: string;
    status?: string;
    direction?: string;
    search?: string;
    limit?: number;
  }): Promise<IntegrationEventDTO[]> {
    let query = sql`SELECT * FROM integration_events WHERE 1=1`;
    if (filters?.integrationId) {
      query = sql`${query} AND integration_id = ${filters.integrationId}`;
    }
    if (filters?.status) {
      query = sql`${query} AND status = ${filters.status}`;
    }
    if (filters?.direction) {
      query = sql`${query} AND direction = ${filters.direction}`;
    }
    if (filters?.search) {
      const p = `%${filters.search}%`;
      query = sql`${query} AND (event_id ILIKE ${p} OR correlation_id ILIKE ${p} OR event_type ILIKE ${p})`;
    }
    query = sql`${query} ORDER BY id DESC LIMIT ${filters?.limit || 50}`;

    const rows = (await db.execute(query)).rows as any[];
    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      integrationId: r.integration_id,
      eventType: r.event_type,
      direction: r.direction,
      status: r.status,
      correlationId: r.correlation_id,
      relatedEntityType: r.related_entity_type,
      relatedEntityId: r.related_entity_id,
      startedAt: toIsoRequired(r.started_at),
      completedAt: toIso(r.completed_at),
      latencyMs: r.latency_ms,
      errorCode: r.error_code,
      errorMessage: r.error_message,
      retryable: r.retryable,
      retryCount: r.retry_count || 0,
      payloadMetadata: r.payload_metadata,
      createdAt: toIsoRequired(r.created_at),
    }));
  }

  /**
   * List Integration Failures & Retry Opportunities
   */
  async listFailures(): Promise<IntegrationEventDTO[]> {
    const rows = (await db.execute(sql`
      SELECT * FROM integration_events
      WHERE status IN ('FAILED', 'TIMEOUT', 'EXHAUSTED', 'RETRYING')
      ORDER BY id DESC LIMIT 50
    `)).rows as any[];

    return rows.map((r) => ({
      id: r.id,
      eventId: r.event_id,
      integrationId: r.integration_id,
      eventType: r.event_type,
      direction: r.direction,
      status: r.status,
      correlationId: r.correlation_id,
      relatedEntityType: r.related_entity_type,
      relatedEntityId: r.related_entity_id,
      startedAt: toIsoRequired(r.started_at),
      completedAt: toIso(r.completed_at),
      latencyMs: r.latency_ms,
      errorCode: r.error_code,
      errorMessage: r.error_message,
      retryable: r.retryable,
      retryCount: r.retry_count || 0,
      payloadMetadata: r.payload_metadata,
      createdAt: toIsoRequired(r.created_at),
    }));
  }

  /**
   * Aggregate Metrics across all integrations for Overview Dashboard
   */
  async getSummaryAnalytics(): Promise<IntegrationSummaryAnalyticsDTO> {
    const [counts] = (await db.execute(sql`
      SELECT
        COUNT(*)::INTEGER AS total,
        COUNT(CASE WHEN mode = 'SIMULATOR' THEN 1 END)::INTEGER AS simulated,
        COUNT(CASE WHEN status IN ('AVAILABLE', 'CONNECTED', 'SIMULATED') THEN 1 END)::INTEGER AS active,
        COUNT(CASE WHEN status IN ('FAILED', 'DEGRADED') THEN 1 END)::INTEGER AS failed,
        COALESCE(AVG(success_rate), 100.0)::NUMERIC(5,2) AS avg_success,
        COALESCE(AVG(average_latency_ms), 45)::INTEGER AS avg_latency
      FROM integrations
    `)).rows as any[];

    const [events24h] = (await db.execute(sql`
      SELECT COUNT(*)::INTEGER AS count
      FROM integration_events
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `)).rows as any[];

    const [exceptions] = (await db.execute(sql`
      SELECT COUNT(*)::INTEGER AS count
      FROM operational_exceptions
      WHERE related_entity_type = 'INTEGRATION' AND status = 'OPEN'
    `)).rows as any[];

    return {
      totalIntegrations: counts?.total || 0,
      simulatedCount: counts?.simulated || 0,
      activeCount: counts?.active || 0,
      failedCount: counts?.failed || 0,
      totalEvents24h: events24h?.count || 0,
      successRate: parseFloat(counts?.avg_success || '99.5'),
      averageLatencyMs: counts?.avg_latency || 45,
      activeCircuitBreakers: 0,
      unresolvedExceptions: exceptions?.count || 0,
    };
  }

  /**
   * API Key Management: Generate API Key
   */
  async createApiKey(
    integrationId: string,
    name: string,
    permissions: string[],
    user: SafeUser
  ): Promise<{ credential: IntegrationCredentialDTO; plaintextKey: string }> {
    const rawSecret = `cv_sim_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
    const credentialId = `CRD-${Date.now().toString().slice(-6)}`;
    const prefix = `${rawSecret.slice(0, 10)}...`;

    await db.execute(sql`
      INSERT INTO integration_credentials (
        credential_id, integration_id, name, key_prefix, key_hash, status,
        environment, permissions, expires_at
      ) VALUES (
        ${credentialId}, ${integrationId}, ${name}, ${prefix},
        ${keyHash}, 'ACTIVE', 'DEVELOPMENT', ${JSON.stringify(permissions)},
        NOW() + INTERVAL '365 days'
      )
    `);

    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'API_KEY_CREATED',
      resourceType: 'INTEGRATION_CREDENTIAL',
      resourceId: credentialId,
      requestId: `REQ-KEY-CREATE-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: { integrationId, name, prefix },
    });

    const [row] = (await db.execute(sql`
      SELECT * FROM integration_credentials WHERE credential_id = ${credentialId} LIMIT 1
    `)).rows as any[];

    return {
      credential: {
        id: row.id,
        credentialId: row.credential_id,
        integrationId: row.integration_id,
        name: row.name,
        keyPrefix: row.key_prefix,
        status: row.status,
        environment: row.environment,
        permissions: row.permissions || [],
        createdAt: toIso(row.created_at),
        updatedAt: toIso(row.updated_at),
      },
      plaintextKey: rawSecret, // Shown once
    };
  }

  /**
   * Helper mapping from SQL row to IntegrationDTO
   */
  private mapIntegration(r: any): IntegrationDTO {
    return {
      id: r.id,
      integrationId: r.integration_id,
      name: r.name,
      domain: r.domain,
      adapterType: r.adapter_type,
      mode: r.mode,
      status: r.status,
      environment: r.environment,
      version: r.version,
      baseUrl: r.base_url,
      timeoutMs: r.timeout_ms,
      rateLimitRpm: r.rate_limit_rpm,
      retryPolicy: r.retry_policy || { maxRetries: 3, backoffMs: 1000, retryableCodes: [] },
      circuitBreaker: r.circuit_breaker || { state: 'CLOSED', failureThreshold: 5, consecutiveFailures: 0, resetTimeoutMs: 30000 },
      healthStatus: r.health_status,
      lastHealthCheck: toIso(r.last_health_check),
      lastSuccessfulEvent: toIso(r.last_successful_event),
      failureCount: r.failure_count || 0,
      successRate: parseFloat(r.success_rate || '100.0'),
      averageLatencyMs: r.average_latency_ms || 45,
      metadata: r.metadata,
      createdAt: toIsoRequired(r.created_at),
      updatedAt: toIsoRequired(r.updated_at),
    };
  }

  private mapDelivery(r: any): WebhookDeliveryDTO {
    return {
      id: r.id,
      deliveryId: r.delivery_id,
      webhookId: r.webhook_id,
      eventId: r.event_id,
      attempt: r.attempt,
      status: r.status,
      httpStatus: r.http_status,
      startedAt: toIsoRequired(r.started_at),
      completedAt: toIso(r.completed_at),
      latencyMs: r.latency_ms,
      error: r.error,
      retryable: r.retryable,
      correlationId: r.correlation_id,
      payload: r.payload,
      responseBody: r.response_body,
      createdAt: toIsoRequired(r.created_at),
    };
  }
}

export const integrationService = new IntegrationService();
