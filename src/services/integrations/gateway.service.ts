/**
 * COREvia Phase 38: Internal API Gateway Service
 * Handles routing, authentication, idempotency, rate limiting, circuit breaker,
 * timeout enforcement, payload masking, event logging, and exception escalation.
 */

import { db } from '../../db/index.ts';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';
import { adapterRegistry } from './adapters/index.ts';
import {
  AdapterContext,
  AdapterResponse,
  IntegrationErrorCode,
  CircuitBreakerState,
} from '../../types/integration.types.ts';
import { auditRepository } from '../../repositories/audit.repository.ts';

// In-memory rate limiting map (IP / Key -> timestamps)
const rateLimitMap = new Map<string, number[]>();

export class GatewayService {
  /**
   * Masks sensitive fields in a payload
   */
  maskPayload(payload: any): { masked: any; maskedFields: string[] } {
    if (!payload || typeof payload !== 'object') {
      return { masked: payload, maskedFields: [] };
    }

    const maskedFields: string[] = [];
    const copy = JSON.parse(JSON.stringify(payload));

    const maskValue = (key: string, val: any): any => {
      const lowerKey = key.toLowerCase();
      if (typeof val === 'string') {
        if (lowerKey.includes('pan') && val.length === 10) {
          maskedFields.push(key);
          return `${val.slice(0, 3)}****${val.slice(-1)}`;
        }
        if (lowerKey.includes('aadhaar') || lowerKey.includes('uid')) {
          maskedFields.push(key);
          return `XXXX-XXXX-${val.slice(-4)}`;
        }
        if (lowerKey.includes('account') && val.length >= 8) {
          maskedFields.push(key);
          return `XXXX-XXXX-${val.slice(-4)}`;
        }
        if (
          lowerKey.includes('password') ||
          lowerKey.includes('secret') ||
          lowerKey.includes('key') ||
          lowerKey.includes('token')
        ) {
          maskedFields.push(key);
          return '********';
        }
      } else if (typeof val === 'object' && val !== null) {
        for (const subKey of Object.keys(val)) {
          val[subKey] = maskValue(subKey, val[subKey]);
        }
      }
      return val;
    };

    for (const key of Object.keys(copy)) {
      copy[key] = maskValue(key, copy[key]);
    }

    return { masked: copy, maskedFields };
  }

  /**
   * Rate limiting enforcement
   */
  checkRateLimit(identifier: string, limitRpm: number): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - 60000;
    const timestamps = (rateLimitMap.get(identifier) || []).filter((t) => t > windowStart);

    if (timestamps.length >= limitRpm) {
      rateLimitMap.set(identifier, timestamps);
      return { allowed: false, remaining: 0 };
    }

    timestamps.push(now);
    rateLimitMap.set(identifier, timestamps);
    return { allowed: true, remaining: limitRpm - timestamps.length };
  }

  /**
   * Process an API Gateway Request with Idempotency and Circuit Breaker
   */
  async processRequest(params: {
    integrationId: string;
    operation: string;
    endpointPath: string;
    payload: any;
    context: AdapterContext;
  }): Promise<AdapterResponse> {
    const { integrationId, operation, endpointPath, payload, context } = params;
    const startTime = Date.now();

    // 1. Fetch Integration & Circuit Breaker State from DB
    const [intRecord] = (await db.execute(sql`
      SELECT id, integration_id, name, status, mode, circuit_breaker, timeout_ms, rate_limit_rpm
      FROM integrations
      WHERE integration_id = ${integrationId}
      LIMIT 1
    `)).rows as any[];

    if (!intRecord) {
      return {
        success: false,
        statusCode: 404,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: `Integration ${integrationId} is not registered in Gateway.`,
          retryable: false,
        },
        latencyMs: 5,
        simulated: false,
        correlationId: context.correlationId,
      };
    }

    if (intRecord.status === 'DISABLED') {
      return {
        success: false,
        statusCode: 503,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: `Integration ${integrationId} is currently DISABLED.`,
          retryable: false,
        },
        latencyMs: 5,
        simulated: intRecord.mode === 'SIMULATOR',
        correlationId: context.correlationId,
      };
    }

    // 2. Circuit Breaker Inspection
    const cbConfig = intRecord.circuit_breaker || {
      state: 'CLOSED',
      failureThreshold: 5,
      consecutiveFailures: 0,
      resetTimeoutMs: 30000,
    };

    if (cbConfig.state === 'OPEN') {
      const lastChange = cbConfig.lastStateChange ? new Date(cbConfig.lastStateChange).getTime() : 0;
      if (Date.now() - lastChange < (cbConfig.resetTimeoutMs || 30000)) {
        return {
          success: false,
          statusCode: 503,
          error: {
            code: 'CIRCUIT_BREAKER_OPEN',
            message: `Circuit breaker is OPEN for integration ${integrationId}. Upstream calls paused.`,
            retryable: true,
          },
          latencyMs: 5,
          simulated: intRecord.mode === 'SIMULATOR',
          correlationId: context.correlationId,
        };
      }
      // Transition to HALF_OPEN to test upstream
      cbConfig.state = 'HALF_OPEN';
    }

    // 3. Rate Limit Check
    const rateCheck = this.checkRateLimit(`${context.actorId}:${integrationId}`, intRecord.rate_limit_rpm || 120);
    if (!rateCheck.allowed) {
      return {
        success: false,
        statusCode: 429,
        error: {
          code: 'RATE_LIMIT',
          message: `Rate limit of ${intRecord.rate_limit_rpm} RPM exceeded for integration ${integrationId}.`,
          retryable: true,
        },
        latencyMs: 5,
        simulated: intRecord.mode === 'SIMULATOR',
        correlationId: context.correlationId,
      };
    }

    // 4. Idempotency Control
    let requestHash = '';
    if (context.idempotencyKey) {
      requestHash = crypto
        .createHash('sha256')
        .update(`${endpointPath}:${JSON.stringify(payload || {})}`)
        .digest('hex');

      const [existingIdemp] = (await db.execute(sql`
        SELECT idempotency_key, request_hash, status, response_status, response_data, expires_at
        FROM idempotency_records
        WHERE idempotency_key = ${context.idempotencyKey}
        LIMIT 1
      `)).rows as any[];

      if (existingIdemp) {
        if (existingIdemp.request_hash !== requestHash) {
          return {
            success: false,
            statusCode: 422,
            error: {
              code: 'DUPLICATE_REQUEST',
              message: `Idempotency-Key '${context.idempotencyKey}' was previously used with a different request payload.`,
              retryable: false,
            },
            latencyMs: 5,
            simulated: intRecord.mode === 'SIMULATOR',
            correlationId: context.correlationId,
          };
        }

        if (existingIdemp.status === 'PROCESSING') {
          return {
            success: false,
            statusCode: 409,
            error: {
              code: 'DUPLICATE_REQUEST',
              message: `A request with Idempotency-Key '${context.idempotencyKey}' is currently in progress.`,
              retryable: true,
            },
            latencyMs: 5,
            simulated: intRecord.mode === 'SIMULATOR',
            correlationId: context.correlationId,
          };
        }

        // Return cached idempotent response
        return {
          success: existingIdemp.response_status < 400,
          statusCode: existingIdemp.response_status || 200,
          data: existingIdemp.response_data,
          latencyMs: 8,
          simulated: intRecord.mode === 'SIMULATOR',
          correlationId: context.correlationId,
        };
      }

      // Record new processing idempotency entry (24h expiry)
      await db.execute(sql`
        INSERT INTO idempotency_records (
          idempotency_key, request_hash, endpoint, actor_id, status, expires_at
        ) VALUES (
          ${context.idempotencyKey}, ${requestHash}, ${endpointPath},
          ${context.actorId}, 'PROCESSING', NOW() + INTERVAL '24 hours'
        )
      `);
    }

    // 5. Retrieve Adapter
    const adapter = adapterRegistry.get(integrationId);
    if (!adapter) {
      return {
        success: false,
        statusCode: 501,
        error: {
          code: 'CONFIGURATION_ERROR',
          message: `Adapter implementation not registered for ${integrationId}.`,
          retryable: false,
        },
        latencyMs: 5,
        simulated: false,
        correlationId: context.correlationId,
      };
    }

    // 6. Execute Adapter with Bounded Timeout
    const timeoutMs = intRecord.timeout_ms || 5000;
    let response: AdapterResponse;

    try {
      const executionPromise = adapter.execute(operation, payload, context);
      const timeoutPromise = new Promise<AdapterResponse>((_, reject) =>
        setTimeout(() => reject(new Error('GATEWAY_TIMEOUT')), timeoutMs)
      );

      response = await Promise.race([executionPromise, timeoutPromise]);
    } catch (err: any) {
      const isTimeout = err.message === 'GATEWAY_TIMEOUT';
      response = {
        success: false,
        statusCode: isTimeout ? 504 : 500,
        error: {
          code: isTimeout ? 'TIMEOUT' : 'PROVIDER_ERROR',
          message: isTimeout
            ? `Gateway timeout: Adapter failed to respond within ${timeoutMs}ms.`
            : err.message || 'Adapter execution failed.',
          retryable: isTimeout,
        },
        latencyMs: Date.now() - startTime,
        simulated: intRecord.mode === 'SIMULATOR',
        correlationId: context.correlationId,
      };
    }

    const totalLatency = Date.now() - startTime;

    // 7. Update Circuit Breaker & Health metrics
    if (!response.success && response.statusCode >= 500) {
      cbConfig.consecutiveFailures = (cbConfig.consecutiveFailures || 0) + 1;
      if (cbConfig.consecutiveFailures >= (cbConfig.failureThreshold || 5)) {
        cbConfig.state = 'OPEN';
        cbConfig.lastStateChange = new Date().toISOString();

        // Escalate to Operations Exception and Signal
        await this.escalateFailure({
          integrationId,
          name: intRecord.name,
          error: response.error?.message || 'Consecutive failure threshold exceeded',
          correlationId: context.correlationId,
        });
      }
    } else if (response.success) {
      if (cbConfig.state === 'HALF_OPEN') {
        cbConfig.state = 'CLOSED';
        cbConfig.consecutiveFailures = 0;
        cbConfig.lastStateChange = new Date().toISOString();
      } else {
        cbConfig.consecutiveFailures = 0;
      }
    }

    // Persist updated circuit breaker state
    await db.execute(sql`
      UPDATE integrations
      SET
        circuit_breaker = ${JSON.stringify(cbConfig)},
        last_successful_event = CASE WHEN ${response.success} THEN NOW() ELSE last_successful_event END,
        failure_count = CASE WHEN ${!response.success} THEN failure_count + 1 ELSE failure_count END,
        updated_at = NOW()
      WHERE integration_id = ${integrationId}
    `);

    // 8. Update Idempotency Record if key was present
    if (context.idempotencyKey) {
      await db.execute(sql`
        UPDATE idempotency_records
        SET
          status = ${response.success ? 'COMPLETED' : 'FAILED'},
          response_status = ${response.statusCode},
          response_data = ${JSON.stringify(response.data || response.error || {})},
          expires_at = NOW() + INTERVAL '24 hours'
        WHERE idempotency_key = ${context.idempotencyKey}
      `);
    }

    // 9. Mask and Log Integration Event
    const { masked, maskedFields } = this.maskPayload(payload);
    const eventId = `EVT-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

    await db.execute(sql`
      INSERT INTO integration_events (
        event_id, integration_id, event_type, direction, status,
        correlation_id, related_entity_type, related_entity_id,
        started_at, completed_at, latency_ms, error_code, error_message,
        retryable, retry_count, payload_metadata
      ) VALUES (
        ${eventId}, ${integrationId}, ${operation}, 'OUTBOUND',
        ${response.success ? 'SUCCESS' : response.error?.code === 'TIMEOUT' ? 'TIMEOUT' : 'FAILED'},
        ${context.correlationId}, ${payload?.entityType || null},
        ${payload?.entityId || payload?.customerCode || payload?.accountNumber || null},
        NOW() - (${totalLatency} || ' milliseconds')::INTERVAL, NOW(),
        ${totalLatency}, ${response.error?.code || null},
        ${response.error?.message || null}, ${response.error?.retryable || false}, 0,
        ${JSON.stringify({
          sizeBytes: JSON.stringify(payload || {}).length,
          schemaVersion: '1.0',
          maskedFields,
          sanitizedPreview: masked,
        })}
      )
    `);

    return response;
  }

  /**
   * Escalates integration failures to Phase 36 Operations and Phase 27 Signals
   */
  private async escalateFailure(params: {
    integrationId: string;
    name: string;
    error: string;
    correlationId: string;
  }) {
    try {
      const exceptionId = `OEX-INT-${Date.now().toString().slice(-6)}`;
      await db.execute(sql`
        INSERT INTO operational_exceptions (
          exception_id, title, description, category, severity,
          status, source_module, related_entity_type, related_entity_id,
          sla_deadline, metadata
        ) VALUES (
          ${exceptionId},
          ${`Integration Outage: ${params.name}`},
          ${`Circuit breaker opened due to repeated failure: ${params.error}`},
          'SYSTEM_EXCEPTION', 'HIGH', 'OPEN', 'OPERATIONS_WORKSPACE',
          'INTEGRATION', ${params.integrationId},
          NOW() + INTERVAL '2 hours',
          ${JSON.stringify({ correlationId: params.correlationId, integrationId: params.integrationId })}
        )
        ON CONFLICT (exception_id) DO NOTHING;
      `);

      // Audit escalation
      await auditRepository.createLog({
        actorId: 'SYSTEM_GATEWAY',
        actorName: 'API Gateway Circuit Breaker',
        action: 'INTEGRATION_FAILURE',
        resourceType: 'INTEGRATION',
        resourceId: params.integrationId,
        requestId: params.correlationId,
        outcome: 'FAILURE',
        metadata: {
          error: params.error,
          exceptionId,
        },
      });
    } catch (e: any) {
      console.warn(`[Gateway Escalation Deferred] ${e.message}`);
    }
  }
}

export const gatewayService = new GatewayService();
