/**
 * COREvia Phase 38: National Identity & KYC Gateway Simulator Adapter
 * Masks sensitive identifiers (Aadhaar, PAN) and produces deterministic synthetic KYC checks.
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

export class KycSimulatorAdapter implements IntegrationAdapter {
  readonly integrationId = 'INT-KYC';
  readonly name = 'National Identity & KYC Gateway Simulator';
  readonly domain = 'KYC';
  readonly version = '2.1.0';

  async healthCheck(_context: AdapterContext): Promise<HealthCheckResult> {
    const start = Date.now();
    return {
      status: 'SIMULATOR_HEALTHY',
      latencyMs: Date.now() - start + 25,
      timestamp: new Date().toISOString(),
      details: {
        mode: 'SIMULATOR',
        circuitBreaker: 'CLOSED',
        message: 'KYC & National Identity Simulator operational.',
        checks: {
          panVerificationService: true,
          aadhaarVerificationService: true,
          ckycRegistry: true,
        },
      },
    };
  }

  validate(operation: string, payload: any): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];
    if (!operation) errors.push('Operation is required');

    switch (operation) {
      case 'verifyIdentity':
        if (!payload?.customerCode && !payload?.idNumber) {
          errors.push('customerCode or idNumber is required');
        }
        if (!payload?.idType) {
          errors.push('idType (PAN, AADHAAR, PASSPORT, VOTER_ID) is required');
        }
        break;
      case 'getKycStatus':
        if (!payload?.customerCode) errors.push('customerCode is required');
        break;
      case 'submitReview':
        if (!payload?.customerCode) errors.push('customerCode is required');
        if (!payload?.decision) errors.push('decision (APPROVED, REJECTED, CONDITIONAL) is required');
        break;
      default:
        errors.push(`Unsupported KYC operation: ${operation}`);
    }

    return { valid: errors.length === 0, errors: errors.length ? errors : undefined };
  }

  transform(direction: 'INBOUND' | 'OUTBOUND', data: any): any {
    if (direction === 'OUTBOUND') {
      const masked = { ...data };
      if (masked.pan) {
        masked.pan = `${masked.pan.slice(0, 3)}****${masked.pan.slice(-1)}`;
      }
      if (masked.aadhaar) {
        masked.aadhaar = `XXXX-XXXX-${masked.aadhaar.slice(-4)}`;
      }
      return {
        ...masked,
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
    const simulatedLatency = Math.floor(40 + Math.random() * 35);

    switch (operation) {
      case 'verifyIdentity': {
        const idType = String(payload.idType).toUpperCase();
        const idVal = String(payload.idNumber || 'ABCDE1234F');
        const maskedId = idType === 'PAN'
          ? `${idVal.slice(0, 3)}****${idVal.slice(-1)}`
          : idType === 'AADHAAR'
          ? `XXXX-XXXX-${idVal.slice(-4)}`
          : `${idVal.slice(0, 2)}****`;

        return {
          success: true,
          statusCode: 200,
          data: {
            verificationRef: `VRF-KYC-${Date.now().toString().slice(-6)}`,
            customerCode: payload.customerCode || 'CUS-10482',
            idType,
            maskedIdentifier: maskedId,
            verificationStatus: 'VERIFIED',
            confidenceScore: 0.98,
            registrySource: 'CKYC_REGISTRY_SIMULATOR',
            verifiedAt: new Date().toISOString(),
            source: 'SIMULATOR',
            simulatedNotice: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      case 'getKycStatus': {
        return {
          success: true,
          statusCode: 200,
          data: {
            customerCode: payload.customerCode,
            status: 'COMPLIANT',
            kycLevel: 'FULL_KYC',
            lastVerifiedDate: new Date(Date.now() - 45 * 86400000).toISOString(),
            nextReviewDue: new Date(Date.now() + 320 * 86400000).toISOString(),
            riskCategory: 'LOW',
            ckycNumber: `CKYC-${Date.now().toString().slice(-8)}`,
            source: 'SIMULATOR',
            simulatedNotice: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
          },
          latencyMs: Date.now() - start + simulatedLatency,
          simulated: true,
          correlationId: context.correlationId,
        };
      }

      case 'submitReview': {
        return {
          success: true,
          statusCode: 200,
          data: {
            reviewId: `REV-${Date.now().toString().slice(-6)}`,
            customerCode: payload.customerCode,
            decision: payload.decision,
            remarks: payload.remarks || 'Standard automated compliance validation passed.',
            reviewedBy: context.actorId,
            reviewedAt: new Date().toISOString(),
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
