/**
 * COREvia Phase 38: Multi-Channel Notification Gateway Simulator Adapter
 * Simulates SMS, Email, and Push notification dispatches.
 *
 * NOTE: SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY.
 */

import { IntegrationAdapter } from './types.ts';
import {
  HealthCheckResult,
  AdapterContext,
  AdapterResponse,
  WebhookVerificationResult,
} from '../../../types/integration.types.ts';

export class NotificationSimulatorAdapter implements IntegrationAdapter {
  readonly integrationId = 'INT-NOTIF';
  readonly name = 'Multi-Channel Notification Gateway Simulator';
  readonly domain = 'NOTIFICATION';
  readonly version = '1.1.0';

  async healthCheck(_context: AdapterContext): Promise<HealthCheckResult> {
    const start = Date.now();
    return {
      status: 'SIMULATOR_HEALTHY',
      latencyMs: Date.now() - start + 14,
      timestamp: new Date().toISOString(),
      details: {
        mode: 'SIMULATOR',
        circuitBreaker: 'CLOSED',
        message: 'Notification Gateway Simulator operational.',
        checks: {
          smsTelcoRail: true,
          emailSmtpGateway: true,
          pushService: true,
        },
      },
    };
  }

  validate(operation: string, payload: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!operation) errors.push('Operation is required');

    switch (operation) {
      case 'sendNotification':
        if (!payload?.channel) errors.push('channel (SMS, EMAIL, IN_APP, PUSH) is required');
        if (!payload?.recipient) errors.push('recipient is required');
        if (!payload?.content) errors.push('content is required');
        break;
      case 'getDeliveryReport':
        if (!payload?.messageId) errors.push('messageId is required');
        break;
      default:
        errors.push(`Unsupported Notification operation: ${operation}`);
    }

    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  transform(direction: 'INBOUND' | 'OUTBOUND', data: any): any {
    if (direction === 'OUTBOUND') {
      const sanitized = { ...data };
      if (sanitized.recipient && String(sanitized.recipient).includes('@')) {
        const parts = sanitized.recipient.split('@');
        sanitized.recipient = `${parts[0].slice(0, 2)}***@${parts[1]}`;
      } else if (sanitized.recipient) {
        sanitized.recipient = `******${String(sanitized.recipient).slice(-4)}`;
      }
      return {
        ...sanitized,
        transmittedAt: new Date().toISOString(),
        disclaimer: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
      };
    }
    return data;
  }

  async execute(operation: string, payload: any, context: AdapterContext): Promise<AdapterResponse> {
    const validation = this.validate(operation, payload);
    if (!validation.valid) {
      return {
        success: false,
        statusCode: 400,
        error: {
          code: 'VALIDATION_ERROR',
          message: validation.errors?.join(', ') || 'Validation failed',
          retryable: false,
        },
        latencyMs: 5,
        simulated: true,
        correlationId: context.correlationId,
      };
    }

    const start = Date.now();
    const simulatedLatency = Math.floor(15 + Math.random() * 15);

    switch (operation) {
      case 'sendNotification': {
        const messageId = `MSG-SIM-${Date.now().toString().slice(-6)}`;
        return {
          success: true,
          statusCode: 200,
          data: {
            messageId,
            channel: payload.channel,
            recipientMasked: String(payload.recipient).includes('@')
              ? `${String(payload.recipient).slice(0, 2)}***@${String(payload.recipient).split('@')[1]}`
              : `******${String(payload.recipient).slice(-4)}`,
            status: 'DELIVERED',
            deliveredAt: new Date().toISOString(),
            source: 'SIMULATOR',
            simulatedNotice: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      case 'getDeliveryReport': {
        return {
          success: true,
          statusCode: 200,
          data: {
            messageId: payload.messageId,
            status: 'DELIVERED',
            deliveryAttempts: 1,
            handoverTimestamp: new Date(Date.now() - 60000).toISOString(),
            source: 'SIMULATOR',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      default:
        return {
          success: false,
          statusCode: 400,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Unknown operation ${operation}`,
            retryable: false,
          },
          latencyMs: 5,
          simulated: true,
          correlationId: context.correlationId,
        };
    }
  }

  async handleWebhook(_event: any, signature: string, timestamp: number): Promise<WebhookVerificationResult> {
    if (!signature) return { valid: false, reason: 'Missing signature' };
    if (Math.abs(Date.now() - timestamp) > 300000) return { valid: false, reason: 'Timestamp skew exceeded 300s' };
    return { valid: true };
  }
}
