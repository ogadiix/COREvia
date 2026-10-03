/**
 * COREvia Phase 38: Enterprise Integration & API Gateway Types
 * Strict typed definitions for adapters, simulators, API registry, webhooks, retries, and events.
 */

export type IntegrationDomain =
  | 'CORE_BANKING'
  | 'CRM'
  | 'KYC'
  | 'AML'
  | 'DOCUMENT_MANAGEMENT'
  | 'EMAIL'
  | 'SMS'
  | 'NOTIFICATION'
  | 'PAYMENTS'
  | 'IDENTITY'
  | 'ANALYTICS'
  | 'ACCOUNTING'
  | 'AUDIT'
  | 'OTHER';

export type IntegrationMode = 'SIMULATOR' | 'ADAPTER' | 'EXTERNAL';

export type IntegrationStatus =
  | 'NOT_CONFIGURED'
  | 'CONFIGURED'
  | 'AVAILABLE'
  | 'CONNECTED'
  | 'DEGRADED'
  | 'FAILED'
  | 'DISABLED'
  | 'SIMULATED';

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export type WebhookStatus = 'ACTIVE' | 'PAUSED' | 'DISABLED' | 'FAILED';

export type WebhookDeliveryStatus =
  | 'PENDING'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETRYING'
  | 'EXHAUSTED';

export type EventDirection = 'INBOUND' | 'OUTBOUND';

export type EventStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRYING'
  | 'EXHAUSTED'
  | 'TIMEOUT';

export type IntegrationErrorCode =
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'TIMEOUT'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'TRANSFORMATION_ERROR'
  | 'DUPLICATE_REQUEST'
  | 'SIGNATURE_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'CIRCUIT_BREAKER_OPEN'
  | 'UNKNOWN';

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  retryableCodes: string[];
}

export interface CircuitBreakerConfig {
  state: CircuitBreakerState;
  failureThreshold: number;
  consecutiveFailures: number;
  resetTimeoutMs: number;
  lastStateChange?: string;
}

export interface IntegrationDTO {
  id: number;
  integrationId: string; // e.g. INT-COREBANKING, INT-KYC
  name: string;
  domain: IntegrationDomain;
  adapterType: string;
  mode: IntegrationMode;
  status: IntegrationStatus;
  environment: 'DEVELOPMENT' | 'TEST' | 'STAGING' | 'PRODUCTION';
  version: string;
  baseUrl: string;
  timeoutMs: number;
  rateLimitRpm: number;
  retryPolicy: RetryPolicy;
  circuitBreaker: CircuitBreakerConfig;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'SIMULATOR_HEALTHY';
  lastHealthCheck?: string;
  lastSuccessfulEvent?: string;
  failureCount: number;
  successRate: number;
  averageLatencyMs: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationEndpointDTO {
  id: number;
  endpointId: string;
  integrationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  purpose: string;
  version: string;
  authType: 'SESSION' | 'SERVICE_TOKEN' | 'API_KEY' | 'WEBHOOK_SIGNATURE' | 'INTERNAL';
  rateLimit: number;
  timeoutMs: number;
  idempotencyRequired: boolean;
  status: 'ACTIVE' | 'DEPRECATED' | 'DISABLED';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookConfigDTO {
  id: number;
  webhookId: string;
  integrationId: string;
  eventType: string;
  targetUrl: string;
  status: WebhookStatus;
  secretMetadata: {
    keyId: string;
    algorithm: string;
    createdAt: string;
  };
  lastDeliveryAt?: string;
  lastResponseStatus?: number;
  failureCount: number;
  retryCount: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookDeliveryDTO {
  id: number;
  deliveryId: string;
  webhookId: string;
  eventId: string;
  attempt: number;
  status: WebhookDeliveryStatus;
  httpStatus?: number;
  startedAt: string;
  completedAt?: string;
  latencyMs?: number;
  error?: string;
  retryable: boolean;
  correlationId: string;
  payload?: Record<string, any>;
  responseBody?: Record<string, any>;
  createdAt: string;
}

export interface IntegrationEventDTO {
  id: number;
  eventId: string;
  integrationId: string;
  eventType: string;
  direction: EventDirection;
  status: EventStatus;
  correlationId: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  startedAt: string;
  completedAt?: string;
  latencyMs?: number;
  errorCode?: IntegrationErrorCode;
  errorMessage?: string;
  retryable: boolean;
  retryCount: number;
  payloadMetadata?: {
    sizeBytes: number;
    schemaVersion: string;
    maskedFields?: string[];
    sanitizedPreview?: Record<string, any>;
  };
  createdAt: string;
}

export interface IdempotencyRecordDTO {
  id: number;
  idempotencyKey: string;
  requestHash: string;
  endpoint: string;
  actorId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  responseStatus?: number;
  responseData?: Record<string, any>;
  createdAt: string;
  expiresAt: string;
}

export interface IntegrationCredentialDTO {
  id: number;
  credentialId: string;
  integrationId: string;
  name: string;
  keyPrefix: string;
  status: 'ACTIVE' | 'ROTATED' | 'REVOKED' | 'EXPIRED';
  environment: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckResult {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'SIMULATOR_HEALTHY';
  latencyMs: number;
  timestamp: string;
  details: {
    mode: IntegrationMode;
    circuitBreaker: CircuitBreakerState;
    message: string;
    checks: Record<string, boolean>;
  };
}

export interface AdapterContext {
  correlationId: string;
  actorId: string;
  actorRole: string;
  environment: string;
  idempotencyKey?: string;
}

export interface AdapterResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: {
    code: IntegrationErrorCode;
    message: string;
    retryable: boolean;
    details?: any;
  };
  latencyMs: number;
  simulated: boolean;
  correlationId: string;
}

export interface WebhookVerificationResult {
  valid: boolean;
  reason?: string;
}

export interface IntegrationSummaryAnalyticsDTO {
  totalIntegrations: number;
  simulatedCount: number;
  activeCount: number;
  failedCount: number;
  totalEvents24h: number;
  successRate: number;
  averageLatencyMs: number;
  activeCircuitBreakers: number;
  unresolvedExceptions: number;
}
