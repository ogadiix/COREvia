/**
 * COREvia Phase 38: Enterprise Integration & API Gateway Seed & DDL
 * Ensures integration tables and indexes exist.
 * Seeds initial synthetic simulators, registered endpoints, webhooks, and events.
 *
 * NOTE: Simulators are explicitly tagged as SIMULATOR and SIMULATED.
 * Never claim live external banking connectivity.
 */

import { db } from './index.ts';
import { sql } from 'drizzle-orm';
import crypto from 'crypto';

export async function ensureIntegrationTablesExist(): Promise<void> {
  // 1. integrations
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS integrations (
      id SERIAL PRIMARY KEY,
      integration_id TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      adapter_type TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'SIMULATOR',
      status TEXT NOT NULL DEFAULT 'SIMULATED',
      environment TEXT NOT NULL DEFAULT 'DEVELOPMENT',
      version TEXT NOT NULL DEFAULT '1.0.0',
      base_url TEXT NOT NULL DEFAULT 'http://localhost:3000/api/integrations/simulators',
      timeout_ms INTEGER NOT NULL DEFAULT 5000,
      rate_limit_rpm INTEGER NOT NULL DEFAULT 120,
      retry_policy JSONB NOT NULL DEFAULT '{"maxRetries": 3, "backoffMs": 1000, "retryableCodes": ["TIMEOUT", "NETWORK_ERROR", "503", "502"]}',
      circuit_breaker JSONB NOT NULL DEFAULT '{"state": "CLOSED", "failureThreshold": 5, "consecutiveFailures": 0, "resetTimeoutMs": 30000}',
      health_status TEXT NOT NULL DEFAULT 'SIMULATOR_HEALTHY',
      last_health_check TIMESTAMP,
      last_successful_event TIMESTAMP,
      failure_count INTEGER NOT NULL DEFAULT 0,
      success_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
      average_latency_ms INTEGER NOT NULL DEFAULT 45,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_int_integration_id ON integrations(integration_id);
    CREATE INDEX IF NOT EXISTS idx_int_domain ON integrations(domain);
    CREATE INDEX IF NOT EXISTS idx_int_status ON integrations(status);
    CREATE INDEX IF NOT EXISTS idx_int_mode ON integrations(mode);
  `);

  // 2. integration_endpoints
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS integration_endpoints (
      id SERIAL PRIMARY KEY,
      endpoint_id TEXT NOT NULL UNIQUE,
      integration_id TEXT NOT NULL,
      method TEXT NOT NULL,
      path TEXT NOT NULL,
      purpose TEXT NOT NULL,
      version TEXT NOT NULL DEFAULT 'v1',
      auth_type TEXT NOT NULL DEFAULT 'SERVICE_TOKEN',
      rate_limit INTEGER NOT NULL DEFAULT 60,
      timeout_ms INTEGER NOT NULL DEFAULT 5000,
      idempotency_required BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_ie_endpoint_id ON integration_endpoints(endpoint_id);
    CREATE INDEX IF NOT EXISTS idx_ie_integration_id ON integration_endpoints(integration_id);
    CREATE INDEX IF NOT EXISTS idx_ie_path ON integration_endpoints(path);
  `);

  // 3. integration_webhooks
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS integration_webhooks (
      id SERIAL PRIMARY KEY,
      webhook_id TEXT NOT NULL UNIQUE,
      integration_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      target_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      secret_hash TEXT NOT NULL,
      secret_metadata JSONB NOT NULL,
      last_delivery_at TIMESTAMP,
      last_response_status INTEGER,
      failure_count INTEGER NOT NULL DEFAULT 0,
      retry_count INTEGER NOT NULL DEFAULT 0,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_iw_webhook_id ON integration_webhooks(webhook_id);
    CREATE INDEX IF NOT EXISTS idx_iw_integration_id ON integration_webhooks(integration_id);
    CREATE INDEX IF NOT EXISTS idx_iw_event_type ON integration_webhooks(event_type);
  `);

  // 4. webhook_deliveries
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id SERIAL PRIMARY KEY,
      delivery_id TEXT NOT NULL UNIQUE,
      webhook_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      attempt INTEGER NOT NULL DEFAULT 1,
      status TEXT NOT NULL DEFAULT 'PENDING',
      http_status INTEGER,
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      latency_ms INTEGER,
      error TEXT,
      retryable BOOLEAN NOT NULL DEFAULT FALSE,
      correlation_id TEXT NOT NULL,
      payload JSONB,
      response_body JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_wd_delivery_id ON webhook_deliveries(delivery_id);
    CREATE INDEX IF NOT EXISTS idx_wd_webhook_id ON webhook_deliveries(webhook_id);
    CREATE INDEX IF NOT EXISTS idx_wd_status ON webhook_deliveries(status);
    CREATE INDEX IF NOT EXISTS idx_wd_correlation_id ON webhook_deliveries(correlation_id);
  `);

  // 5. integration_events
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS integration_events (
      id SERIAL PRIMARY KEY,
      event_id TEXT NOT NULL UNIQUE,
      integration_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      direction TEXT NOT NULL DEFAULT 'OUTBOUND',
      status TEXT NOT NULL DEFAULT 'SUCCESS',
      correlation_id TEXT NOT NULL,
      related_entity_type TEXT,
      related_entity_id TEXT,
      started_at TIMESTAMP NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMP,
      latency_ms INTEGER,
      error_code TEXT,
      error_message TEXT,
      retryable BOOLEAN NOT NULL DEFAULT FALSE,
      retry_count INTEGER NOT NULL DEFAULT 0,
      payload_metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_iev_event_id ON integration_events(event_id);
    CREATE INDEX IF NOT EXISTS idx_iev_integration_id ON integration_events(integration_id);
    CREATE INDEX IF NOT EXISTS idx_iev_status ON integration_events(status);
    CREATE INDEX IF NOT EXISTS idx_iev_correlation_id ON integration_events(correlation_id);
    CREATE INDEX IF NOT EXISTS idx_iev_created_at ON integration_events(created_at);
  `);

  // 6. idempotency_records
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS idempotency_records (
      id SERIAL PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      request_hash TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PROCESSING',
      response_status INTEGER,
      response_data JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMP NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_idemp_key ON idempotency_records(idempotency_key);
    CREATE INDEX IF NOT EXISTS idx_idemp_expires_at ON idempotency_records(expires_at);
  `);

  // 7. integration_credentials
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS integration_credentials (
      id SERIAL PRIMARY KEY,
      credential_id TEXT NOT NULL UNIQUE,
      integration_id TEXT NOT NULL,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      environment TEXT NOT NULL DEFAULT 'DEVELOPMENT',
      permissions JSONB NOT NULL DEFAULT '["read", "execute"]',
      last_used_at TIMESTAMP,
      expires_at TIMESTAMP,
      revoked_at TIMESTAMP,
      revoked_by TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_ic_credential_id ON integration_credentials(credential_id);
    CREATE INDEX IF NOT EXISTS idx_ic_integration_id ON integration_credentials(integration_id);
  `);
}

export async function seedIntegrationData(): Promise<void> {
  await ensureIntegrationTablesExist();

  // 1. Seed Core Simulators and Adapters
  const initialIntegrations = [
    {
      integrationId: 'INT-COREBANKING',
      name: 'Core Banking Engine Simulator',
      domain: 'CORE_BANKING',
      adapterType: 'CORE_BANKING_ADAPTER',
      mode: 'SIMULATOR',
      status: 'SIMULATED',
      environment: 'DEVELOPMENT',
      version: '1.4.0',
      baseUrl: 'http://localhost:3000/api/integrations/simulators/core-banking',
      timeoutMs: 3000,
      rateLimitRpm: 300,
      healthStatus: 'SIMULATOR_HEALTHY',
      failureCount: 0,
      successRate: '99.80',
      averageLatencyMs: 38,
      metadata: {
        vendor: 'COREvia Synthetic FinTech Lab',
        description: 'Synthetic simulator for CBS account, ledger balance, and service request operations.',
        disclaimer: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
      },
    },
    {
      integrationId: 'INT-KYC',
      name: 'National Identity & KYC Gateway Simulator',
      domain: 'KYC',
      adapterType: 'KYC_ADAPTER',
      mode: 'SIMULATOR',
      status: 'SIMULATED',
      environment: 'DEVELOPMENT',
      version: '2.1.0',
      baseUrl: 'http://localhost:3000/api/integrations/simulators/kyc',
      timeoutMs: 5000,
      rateLimitRpm: 120,
      healthStatus: 'SIMULATOR_HEALTHY',
      failureCount: 1,
      successRate: '98.50',
      averageLatencyMs: 82,
      metadata: {
        vendor: 'Synthetica KYC Services',
        description: 'Simulates identity validation, document verification, and Aadhaar/PAN status checks.',
        disclaimer: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
      },
    },
    {
      integrationId: 'INT-DOCMGMT',
      name: 'Enterprise Document Vault Simulator',
      domain: 'DOCUMENT_MANAGEMENT',
      adapterType: 'DOCUMENT_ADAPTER',
      mode: 'SIMULATOR',
      status: 'SIMULATED',
      environment: 'DEVELOPMENT',
      version: '1.2.0',
      baseUrl: 'http://localhost:3000/api/integrations/simulators/documents',
      timeoutMs: 4000,
      rateLimitRpm: 150,
      healthStatus: 'SIMULATOR_HEALTHY',
      failureCount: 0,
      successRate: '100.00',
      averageLatencyMs: 45,
      metadata: {
        vendor: 'VaultOS Document Intelligence',
        description: 'Document metadata indexing, hash verification, and synthetic storage provider.',
        disclaimer: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
      },
    },
    {
      integrationId: 'INT-PAYMENTS',
      name: 'Interbank Payment Gateway Simulator',
      domain: 'PAYMENTS',
      adapterType: 'PAYMENTS_ADAPTER',
      mode: 'SIMULATOR',
      status: 'SIMULATED',
      environment: 'DEVELOPMENT',
      version: '3.0.0',
      baseUrl: 'http://localhost:3000/api/integrations/simulators/payments',
      timeoutMs: 4500,
      rateLimitRpm: 240,
      healthStatus: 'SIMULATOR_HEALTHY',
      failureCount: 2,
      successRate: '97.90',
      averageLatencyMs: 65,
      metadata: {
        vendor: 'SimuPay Rail Engine',
        description: 'Synthetic RTGS/NEFT/IMPS payment instruction clearing and settlement status simulator.',
        disclaimer: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
      },
    },
    {
      integrationId: 'INT-NOTIF',
      name: 'Multi-Channel Notification Gateway Simulator',
      domain: 'NOTIFICATION',
      adapterType: 'NOTIFICATION_ADAPTER',
      mode: 'SIMULATOR',
      status: 'SIMULATED',
      environment: 'DEVELOPMENT',
      version: '1.1.0',
      baseUrl: 'http://localhost:3000/api/integrations/simulators/notifications',
      timeoutMs: 2500,
      rateLimitRpm: 500,
      healthStatus: 'SIMULATOR_HEALTHY',
      failureCount: 0,
      successRate: '100.00',
      averageLatencyMs: 22,
      metadata: {
        vendor: 'MessageHub Synthetic Telco',
        description: 'Dispatches synthetic SMS, email, and enterprise mobile push notifications.',
        disclaimer: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
      },
    },
    {
      integrationId: 'INT-EMAIL',
      name: 'Corporate SMTP Relay Connector',
      domain: 'EMAIL',
      adapterType: 'EMAIL_ADAPTER',
      mode: 'ADAPTER',
      status: 'NOT_CONFIGURED',
      environment: 'DEVELOPMENT',
      version: '1.0.0',
      baseUrl: 'smtp://unconfigured.local:587',
      timeoutMs: 5000,
      rateLimitRpm: 60,
      healthStatus: 'DOWN',
      failureCount: 0,
      successRate: '0.00',
      averageLatencyMs: 0,
      metadata: {
        description: 'Outbound transactional banking communications relay.',
        statusNote: 'Awaiting institutional mail server credentials.',
      },
    },
    {
      integrationId: 'INT-AML',
      name: 'Transaction Monitoring & AML Screening Simulator',
      domain: 'AML',
      adapterType: 'AML_ADAPTER',
      mode: 'SIMULATOR',
      status: 'SIMULATED',
      environment: 'DEVELOPMENT',
      version: '1.3.0',
      baseUrl: 'http://localhost:3000/api/integrations/simulators/aml',
      timeoutMs: 5000,
      rateLimitRpm: 100,
      healthStatus: 'SIMULATOR_HEALTHY',
      failureCount: 0,
      successRate: '99.50',
      averageLatencyMs: 58,
      metadata: {
        vendor: 'FinScreen Synthetic Compliance',
        description: 'Sanctions, PEP, and adverse media screening rule simulator.',
        disclaimer: 'SIMULATED DATA — NOT REAL EXTERNAL BANKING CONNECTIVITY',
      },
    },
  ];

  for (const item of initialIntegrations) {
    await db.execute(sql`
      INSERT INTO integrations (
        integration_id, name, domain, adapter_type, mode, status, environment,
        version, base_url, timeout_ms, rate_limit_rpm, health_status, failure_count,
        success_rate, average_latency_ms, metadata, last_health_check, last_successful_event
      ) VALUES (
        ${item.integrationId}, ${item.name}, ${item.domain}, ${item.adapterType},
        ${item.mode}, ${item.status}, ${item.environment}, ${item.version},
        ${item.baseUrl}, ${item.timeoutMs}, ${item.rateLimitRpm}, ${item.healthStatus},
        ${item.failureCount}, ${item.successRate}, ${item.averageLatencyMs},
        ${JSON.stringify(item.metadata)}, NOW(), NOW()
      )
      ON CONFLICT (integration_id) DO UPDATE SET
        name = EXCLUDED.name,
        domain = EXCLUDED.domain,
        adapter_type = EXCLUDED.adapter_type,
        mode = EXCLUDED.mode,
        status = EXCLUDED.status,
        version = EXCLUDED.version,
        base_url = EXCLUDED.base_url,
        health_status = EXCLUDED.health_status,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();
    `);
  }

  // 2. Seed Registered API Gateway Endpoints
  const endpoints = [
    {
      endpointId: 'EP-CB-01',
      integrationId: 'INT-COREBANKING',
      method: 'GET',
      path: '/api/v1/integrations/core-banking/accounts/:accountNumber',
      purpose: 'Retrieve account master details and verified balance from CBS simulator',
      authType: 'SERVICE_TOKEN',
      rateLimit: 120,
      timeoutMs: 3000,
      idempotencyRequired: false,
    },
    {
      endpointId: 'EP-CB-02',
      integrationId: 'INT-COREBANKING',
      method: 'POST',
      path: '/api/v1/integrations/core-banking/service-requests',
      purpose: 'Submit service hold or stop payment request into CBS simulator',
      authType: 'SERVICE_TOKEN',
      rateLimit: 60,
      timeoutMs: 4000,
      idempotencyRequired: true,
    },
    {
      endpointId: 'EP-KYC-01',
      integrationId: 'INT-KYC',
      method: 'POST',
      path: '/api/v1/integrations/kyc/verify',
      purpose: 'Simulate identity token verification against National Registry simulator',
      authType: 'SERVICE_TOKEN',
      rateLimit: 60,
      timeoutMs: 5000,
      idempotencyRequired: true,
    },
    {
      endpointId: 'EP-DOC-01',
      integrationId: 'INT-DOCMGMT',
      method: 'POST',
      path: '/api/v1/integrations/documents/metadata',
      purpose: 'Register sanitized document hash and metadata into secure vault simulator',
      authType: 'SERVICE_TOKEN',
      rateLimit: 100,
      timeoutMs: 3500,
      idempotencyRequired: true,
    },
    {
      endpointId: 'EP-PAY-01',
      integrationId: 'INT-PAYMENTS',
      method: 'POST',
      path: '/api/v1/integrations/payments/instructions',
      purpose: 'Submit interbank clearing payment instruction with strict idempotency key',
      authType: 'SERVICE_TOKEN',
      rateLimit: 60,
      timeoutMs: 4500,
      idempotencyRequired: true,
    },
    {
      endpointId: 'EP-PAY-02',
      integrationId: 'INT-PAYMENTS',
      method: 'GET',
      path: '/api/v1/integrations/payments/status/:paymentRef',
      purpose: 'Poll clearing settlement status of payment instruction',
      authType: 'SERVICE_TOKEN',
      rateLimit: 120,
      timeoutMs: 3000,
      idempotencyRequired: false,
    },
    {
      endpointId: 'EP-NOTIF-01',
      integrationId: 'INT-NOTIF',
      method: 'POST',
      path: '/api/v1/integrations/notifications/dispatch',
      purpose: 'Dispatch multi-channel synthetic customer notification',
      authType: 'SERVICE_TOKEN',
      rateLimit: 200,
      timeoutMs: 2500,
      idempotencyRequired: false,
    },
  ];

  for (const ep of endpoints) {
    await db.execute(sql`
      INSERT INTO integration_endpoints (
        endpoint_id, integration_id, method, path, purpose, version,
        auth_type, rate_limit, timeout_ms, idempotency_required, status
      ) VALUES (
        ${ep.endpointId}, ${ep.integrationId}, ${ep.method}, ${ep.path},
        ${ep.purpose}, 'v1', ${ep.authType}, ${ep.rateLimit},
        ${ep.timeoutMs}, ${ep.idempotencyRequired ? sql`true` : sql`false`}, 'ACTIVE'
      )
      ON CONFLICT (endpoint_id) DO UPDATE SET
        path = EXCLUDED.path,
        purpose = EXCLUDED.purpose,
        rate_limit = EXCLUDED.rate_limit,
        timeout_ms = EXCLUDED.timeout_ms,
        idempotency_required = EXCLUDED.idempotency_required,
        updated_at = NOW();
    `);
  }

  // 3. Seed Registered Webhooks
  const secretKey1 = crypto.randomBytes(24).toString('hex');
  const secretHash1 = crypto.createHash('sha256').update(secretKey1).digest('hex');

  const secretKey2 = crypto.randomBytes(24).toString('hex');
  const secretHash2 = crypto.createHash('sha256').update(secretKey2).digest('hex');

  const webhooks = [
    {
      webhookId: 'WHK-2026-PAY',
      integrationId: 'INT-PAYMENTS',
      eventType: 'PAYMENT_STATUS_CHANGED',
      targetUrl: 'https://corevia.internal.bank/api/webhooks/payments',
      secretHash: secretHash1,
      secretMetadata: {
        keyId: 'KEY-PAY-2026',
        algorithm: 'HMAC-SHA256',
        createdAt: new Date().toISOString(),
      },
      lastResponseStatus: 200,
    },
    {
      webhookId: 'WHK-2026-KYC',
      integrationId: 'INT-KYC',
      eventType: 'KYC_STATUS_CHANGED',
      targetUrl: 'https://corevia.internal.bank/api/webhooks/kyc',
      secretHash: secretHash2,
      secretMetadata: {
        keyId: 'KEY-KYC-2026',
        algorithm: 'HMAC-SHA256',
        createdAt: new Date().toISOString(),
      },
      lastResponseStatus: 200,
    },
  ];

  for (const wh of webhooks) {
    await db.execute(sql`
      INSERT INTO integration_webhooks (
        webhook_id, integration_id, event_type, target_url, status,
        secret_hash, secret_metadata, last_delivery_at, last_response_status
      ) VALUES (
        ${wh.webhookId}, ${wh.integrationId}, ${wh.eventType}, ${wh.targetUrl},
        'ACTIVE', ${wh.secretHash}, ${JSON.stringify(wh.secretMetadata)},
        NOW() - INTERVAL '15 minutes', ${wh.lastResponseStatus}
      )
      ON CONFLICT (webhook_id) DO UPDATE SET
        target_url = EXCLUDED.target_url,
        secret_metadata = EXCLUDED.secret_metadata,
        updated_at = NOW();
    `);
  }

  // 4. Seed Webhook Deliveries
  const deliveries = [
    {
      deliveryId: 'DEL-2026-001',
      webhookId: 'WHK-2026-PAY',
      eventId: 'EVT-PAY-1001',
      attempt: 1,
      status: 'DELIVERED',
      httpStatus: 200,
      latencyMs: 42,
      correlationId: 'CORR-DEL-2026-001',
      payload: { event: 'PAYMENT_SETTLED', paymentRef: 'TXN-SIM-98214', amount: 500000, currency: 'INR' },
      responseBody: { acknowledged: true, receivedAt: new Date().toISOString() },
    },
    {
      deliveryId: 'DEL-2026-002',
      webhookId: 'WHK-2026-PAY',
      eventId: 'EVT-PAY-1002',
      attempt: 2,
      status: 'RETRYING',
      httpStatus: 503,
      latencyMs: 120,
      error: 'Upstream gateway service temporarily unavailable',
      retryable: true,
      correlationId: 'CORR-DEL-2026-002',
      payload: { event: 'PAYMENT_CLEARED', paymentRef: 'TXN-SIM-98215', amount: 1200000, currency: 'INR' },
      responseBody: { error: 'Service Unavailable' },
    },
    {
      deliveryId: 'DEL-2026-003',
      webhookId: 'WHK-2026-KYC',
      eventId: 'EVT-KYC-1001',
      attempt: 3,
      status: 'EXHAUSTED',
      httpStatus: 504,
      latencyMs: 5000,
      error: 'Gateway timeout after 3 delivery attempts',
      retryable: false,
      correlationId: 'CORR-DEL-2026-003',
      payload: { event: 'KYC_DOCUMENT_REVERIFIED', customerCode: 'CUS-10482', documentId: 'DOC-KYC-001' },
      responseBody: { error: 'Gateway Timeout' },
    },
  ];

  for (const del of deliveries) {
    await db.execute(sql`
      INSERT INTO webhook_deliveries (
        delivery_id, webhook_id, event_id, attempt, status, http_status,
        started_at, completed_at, latency_ms, error, retryable, correlation_id,
        payload, response_body
      ) VALUES (
        ${del.deliveryId}, ${del.webhookId}, ${del.eventId}, ${del.attempt},
        ${del.status}, ${del.httpStatus}, NOW() - INTERVAL '30 minutes',
        NOW() - INTERVAL '30 minutes' + (${del.latencyMs} || ' milliseconds')::INTERVAL,
        ${del.latencyMs}, ${del.error || null}, ${del.retryable ? true : false}, ${del.correlationId},
        ${JSON.stringify(del.payload)}, ${JSON.stringify(del.responseBody)}
      )
      ON CONFLICT (delivery_id) DO NOTHING;
    `);
  }

  // 5. Seed Integration Event Log
  const events = [
    {
      eventId: 'EVT-2026-001',
      integrationId: 'INT-COREBANKING',
      eventType: 'ACCOUNT_BALANCE_CHECK',
      direction: 'OUTBOUND',
      status: 'SUCCESS',
      correlationId: 'CORR-CB-001',
      relatedEntityType: 'ACCOUNT',
      relatedEntityId: 'ACC-10482-01',
      latencyMs: 34,
      payloadMetadata: {
        sizeBytes: 256,
        schemaVersion: 'v1.0',
        maskedFields: ['accountNumber'],
        sanitizedPreview: { operation: 'getBalance', accountRef: 'ACC-***-01', balanceVerified: true },
      },
    },
    {
      eventId: 'EVT-2026-002',
      integrationId: 'INT-KYC',
      eventType: 'IDENTITY_VERIFICATION',
      direction: 'OUTBOUND',
      status: 'SUCCESS',
      correlationId: 'CORR-KYC-001',
      relatedEntityType: 'CUSTOMER',
      relatedEntityId: 'CUS-10482',
      latencyMs: 76,
      payloadMetadata: {
        sizeBytes: 512,
        schemaVersion: 'v2.1',
        maskedFields: ['pan', 'aadhaar'],
        sanitizedPreview: { operation: 'verifyIdentity', panMasked: 'ABCDE****F', aadhaarMasked: 'XXXX-XXXX-1234', verified: true },
      },
    },
    {
      eventId: 'EVT-2026-003',
      integrationId: 'INT-PAYMENTS',
      eventType: 'PAYMENT_CLEARING_DISPATCH',
      direction: 'OUTBOUND',
      status: 'FAILED',
      correlationId: 'CORR-PAY-001',
      relatedEntityType: 'PAYMENT',
      relatedEntityId: 'TXN-SIM-98215',
      latencyMs: 154,
      errorCode: 'PROVIDER_ERROR',
      errorMessage: 'SimuPay clearing rail rejected instruction: Invalid Routing Code',
      retryable: true,
      retryCount: 1,
      payloadMetadata: {
        sizeBytes: 384,
        schemaVersion: 'v3.0',
        maskedFields: ['sourceAccount'],
        sanitizedPreview: { paymentRef: 'TXN-SIM-98215', amount: 1200000, currency: 'INR' },
      },
    },
    {
      eventId: 'EVT-2026-004',
      integrationId: 'INT-DOCMGMT',
      eventType: 'DOCUMENT_HASH_RECORDED',
      direction: 'OUTBOUND',
      status: 'SUCCESS',
      correlationId: 'CORR-DOC-001',
      relatedEntityType: 'DOCUMENT',
      relatedEntityId: 'DOC-KYC-001',
      latencyMs: 48,
      payloadMetadata: {
        sizeBytes: 192,
        schemaVersion: 'v1.2',
        maskedFields: [],
        sanitizedPreview: { docHash: '8f434346648f6b96df89dda26fefac28e67a315c', verified: true },
      },
    },
    {
      eventId: 'EVT-2026-005',
      integrationId: 'INT-KYC',
      eventType: 'KYC_TIMEOUT_EXHAUSTED',
      direction: 'INBOUND',
      status: 'EXHAUSTED',
      correlationId: 'CORR-DEL-2026-003',
      relatedEntityType: 'CUSTOMER',
      relatedEntityId: 'CUS-10482',
      latencyMs: 5000,
      errorCode: 'TIMEOUT',
      errorMessage: 'National Registry simulator failed to acknowledge within 5000ms threshold after 3 attempts',
      retryable: false,
      retryCount: 3,
      payloadMetadata: {
        sizeBytes: 320,
        schemaVersion: 'v2.1',
        maskedFields: [],
        sanitizedPreview: { webhookId: 'WHK-2026-KYC', maxRetriesReached: true },
      },
    },
  ];

  for (const ev of events) {
    await db.execute(sql`
      INSERT INTO integration_events (
        event_id, integration_id, event_type, direction, status, correlation_id,
        related_entity_type, related_entity_id, started_at, completed_at, latency_ms,
        error_code, error_message, retryable, retry_count, payload_metadata
      ) VALUES (
        ${ev.eventId}, ${ev.integrationId}, ${ev.eventType}, ${ev.direction},
        ${ev.status}, ${ev.correlationId}, ${ev.relatedEntityType || null},
        ${ev.relatedEntityId || null}, NOW() - INTERVAL '1 hour',
        NOW() - INTERVAL '1 hour' + (${ev.latencyMs} || ' milliseconds')::INTERVAL,
        ${ev.latencyMs}, ${ev.errorCode || null}, ${ev.errorMessage || null},
        ${ev.retryable ? true : false}, ${sql.raw(String(ev.retryCount ?? 0))}, ${JSON.stringify(ev.payloadMetadata)}
      )
      ON CONFLICT (event_id) DO NOTHING;
    `);
  }

  // 6. Seed Credentials (Hashed, Never store plaintext)
  const testKeyPlaintext = 'cv_sim_99847120384729103948';
  const testKeyHash = crypto.createHash('sha256').update(testKeyPlaintext).digest('hex');

  await db.execute(sql`
    INSERT INTO integration_credentials (
      credential_id, integration_id, name, key_prefix, key_hash, status,
      environment, permissions, last_used_at, expires_at
    ) VALUES (
      'CRD-2026-CB01', 'INT-COREBANKING', 'Core Banking Gateway Primary Service Key',
      'cv_sim_9984...', ${testKeyHash}, 'ACTIVE', 'DEVELOPMENT',
      '["read:accounts", "write:service_requests"]', NOW() - INTERVAL '5 minutes',
      NOW() + INTERVAL '365 days'
    )
    ON CONFLICT (credential_id) DO NOTHING;
  `);
}
