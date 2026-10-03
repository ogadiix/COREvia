/**
 * COREvia Phase 38: Integration Adapter Interface
 * Common contract for all simulators, protocol adapters, and external connectors.
 */

import {
  IntegrationDomain,
  HealthCheckResult,
  AdapterContext,
  AdapterResponse,
  WebhookVerificationResult,
} from '../../../types/integration.types.ts';

export interface IntegrationAdapter {
  readonly integrationId: string;
  readonly name: string;
  readonly domain: IntegrationDomain;
  readonly version: string;

  healthCheck(context: AdapterContext): Promise<HealthCheckResult>;
  execute(operation: string, payload: any, context: AdapterContext): Promise<AdapterResponse>;
  validate(operation: string, payload: any): { valid: boolean; errors?: string[] };
  transform(direction: 'INBOUND' | 'OUTBOUND', data: any): any;
  handleWebhook(event: any, signature: string, timestamp: number): Promise<WebhookVerificationResult>;
}
