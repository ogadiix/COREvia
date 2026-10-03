/**
 * COREvia Phase 38: Interbank Payment Gateway Simulator Adapter
 * Simulates RTGS/NEFT clearing instructions, settlement status polling, and idempotency control.
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

export class PaymentsSimulatorAdapter implements IntegrationAdapter {
  readonly integrationId = 'INT-PAYMENTS';
  readonly name = 'Interbank Payment Gateway Simulator';
  readonly domain = 'PAYMENTS';
  readonly version = '3.0.0';

  async healthCheck(_context: AdapterContext): Promise<HealthCheckResult> {
    const start = Date.now();
    return {
      status: 'SIMULATOR_HEALTHY',
      latencyMs: Date.now() - start + 28,
      timestamp: new Date().toISOString(),
      details: {
        mode: 'SIMULATOR',
        circuitBreaker: 'CLOSED',
        message: 'Payment Clearing Rail Simulator operational.',
        checks: {
          rtgsGateway: true,
          neftGateway: true,
          settlementSwitch: true,
        },
      },
    };
  }

  validate(operation: string, payload: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!operation) errors.push('Operation is required');

    switch (operation) {
      case 'getPaymentStatus':
        if (!payload?.paymentRef) errors.push('paymentRef is required');
        break;
      case 'submitPaymentInstruction':
        if (!payload?.sourceAccount) errors.push('sourceAccount is required');
        if (!payload?.beneficiaryAccount) errors.push('beneficiaryAccount is required');
        if (!payload?.beneficiaryIfsc) errors.push('beneficiaryIfsc is required');
        if (!payload?.amount || Number(payload.amount) <= 0) errors.push('positive amount is required');
        break;
      default:
        errors.push(`Unsupported Payments operation: ${operation}`);
    }

    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  transform(direction: 'INBOUND' | 'OUTBOUND', data: any): any {
    if (direction === 'OUTBOUND') {
      const sanitized = { ...data };
      if (sanitized.sourceAccount) {
        sanitized.sourceAccount = `XXXX-XXXX-${String(sanitized.sourceAccount).slice(-4)}`;
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
    const simulatedLatency = Math.floor(45 + Math.random() * 30);

    switch (operation) {
      case 'submitPaymentInstruction': {
        const paymentRef = `TXN-SIM-${Date.now().toString().slice(-6)}`;
        const utrNumber = `CORV${Date.now().toString().slice(-12)}`;
        const amount = Number(payload.amount);
        const rail = amount >= 200000 ? 'RTGS' : 'NEFT';

        return {
          success: true,
          statusCode: 201,
          data: {
            paymentRef,
            utrNumber,
            rail,
            amount,
            currency: 'INR',
            sourceAccountMasked: `XXXX-XXXX-${String(payload.sourceAccount).slice(-4)}`,
            beneficiaryIfsc: payload.beneficiaryIfsc,
            status: 'SETTLED',
            settledAt: new Date().toISOString(),
            clearingCycle: 'IMMEDIATE_SYNTHETIC',
            idempotencyKeyAcknowledged: context.idempotencyKey,
            source: 'SIMULATOR',
            simulatedNotice: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      case 'getPaymentStatus': {
        return {
          success: true,
          statusCode: 200,
          data: {
            paymentRef: payload.paymentRef,
            status: 'SETTLED',
            settledAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            rail: 'RTGS',
            source: 'SIMULATOR',
            simulatedNotice: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
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
