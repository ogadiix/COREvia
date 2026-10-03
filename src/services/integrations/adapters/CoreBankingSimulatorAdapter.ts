/**
 * COREvia Phase 38: Core Banking Simulator Adapter
 * Provides synthetic CBS account, balance, ledger, and service request operations.
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
import crypto from 'crypto';

export class CoreBankingSimulatorAdapter implements IntegrationAdapter {
  readonly integrationId = 'INT-COREBANKING';
  readonly name = 'Core Banking Engine Simulator';
  readonly domain = 'CORE_BANKING';
  readonly version = '1.4.0';

  async healthCheck(_context: AdapterContext): Promise<HealthCheckResult> {
    const start = Date.now();
    return {
      status: 'SIMULATOR_HEALTHY',
      latencyMs: Date.now() - start + 12,
      timestamp: new Date().toISOString(),
      details: {
        mode: 'SIMULATOR',
        circuitBreaker: 'CLOSED',
        message: 'Core Banking Engine Simulator online and responsive.',
        checks: {
          ledgerService: true,
          accountMaster: true,
          clearingInterface: true,
        },
      },
    };
  }

  validate(operation: string, payload: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!operation) errors.push('Operation is required');

    switch (operation) {
      case 'getAccount':
      case 'getBalance':
        if (!payload?.accountNumber) errors.push('accountNumber is required');
        break;
      case 'getTransactions':
        if (!payload?.accountNumber) errors.push('accountNumber is required');
        break;
      case 'createServiceRequest':
        if (!payload?.accountNumber) errors.push('accountNumber is required');
        if (!payload?.requestType) errors.push('requestType is required');
        if (!payload?.reason) errors.push('reason is required');
        break;
      default:
        errors.push(`Unsupported Core Banking operation: ${operation}`);
    }

    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  transform(direction: 'INBOUND' | 'OUTBOUND', data: any): any {
    if (direction === 'OUTBOUND') {
      return {
        ...data,
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

    // Simulated latency
    const simulatedLatency = Math.floor(20 + Math.random() * 25);

    switch (operation) {
      case 'getAccount': {
        const accNum = String(payload.accountNumber);
        const masked = accNum.length > 4 ? `XXXX-XXXX-${accNum.slice(-4)}` : accNum;
        return {
          success: true,
          statusCode: 200,
          data: {
            accountNumber: accNum,
            maskedAccountNumber: masked,
            accountType: payload.accountType || 'CURRENT',
            status: 'ACTIVE',
            currency: 'INR',
            branchCode: payload.branchCode || 'BR-MUM-01',
            cifNumber: `CIF-${Math.abs(crypto.createHash('md5').update(accNum).digest().readInt32BE(0)) % 900000 + 100000}`,
            source: 'SIMULATOR',
            simulatedNotice: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      case 'getBalance': {
        const accNum = String(payload.accountNumber);
        return {
          success: true,
          statusCode: 200,
          data: {
            accountNumber: accNum,
            availableBalance: 8452000.5,
            ledgerBalance: 8500000.0,
            lienAmount: 47999.5,
            currency: 'INR',
            asOf: new Date().toISOString(),
            source: 'SIMULATOR',
            simulatedNotice: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      case 'getTransactions': {
        const accNum = String(payload.accountNumber);
        const limit = Math.min(Number(payload.limit) || 5, 20);
        const txns = Array.from({ length: limit }).map((_, i) => ({
          txnId: `TXN-CBS-${Date.now().toString().slice(-6)}-${i + 1}`,
          accountNumber: accNum,
          type: i % 2 === 0 ? 'CREDIT' : 'DEBIT',
          amount: (i + 1) * 125000,
          currency: 'INR',
          description: i % 2 === 0 ? 'Inward RTGS Clearing' : 'Corporate Vendor Settlement',
          valueDate: new Date(Date.now() - i * 86400000).toISOString(),
          status: 'SETTLED',
        }));
        return {
          success: true,
          statusCode: 200,
          data: {
            accountNumber: accNum,
            count: txns.length,
            transactions: txns,
            source: 'SIMULATOR',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      case 'createServiceRequest': {
        const srvId = `SRV-CBS-${Date.now().toString().slice(-6)}`;
        return {
          success: true,
          statusCode: 201,
          data: {
            requestId: srvId,
            accountNumber: payload.accountNumber,
            requestType: payload.requestType,
            status: 'REGISTERED_IN_CBS',
            reason: payload.reason,
            acknowledgedAt: new Date().toISOString(),
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

  async handleWebhook(event: any, signature: string, timestamp: number): Promise<WebhookVerificationResult> {
    if (!signature) return { valid: false, reason: 'Missing webhook signature' };
    const age = Math.abs(Date.now() - timestamp);
    if (age > 300000) return { valid: false, reason: 'Webhook timestamp expired (>300s)' };
    return { valid: true };
  }
}
