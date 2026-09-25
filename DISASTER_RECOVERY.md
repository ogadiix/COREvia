# Disaster Recovery (DR) Plan

This document outlines the recovery protocols for critical failures affecting the COREvia Banking CRM.

## 1. Database Failure or Data Corruption

**Detection**: High latency, connection timeouts, or `DEGRADED` health status on `/api/health`.
**Immediate Response**: 
- Identify if the issue is connection pool exhaustion, host unavailability, or data corruption.
- If data corruption is suspected, immediately scale down application containers to prevent further data corruption.
**Recovery**:
- Trigger Point-in-Time Recovery (PITR) from the Cloud SQL / RDS console to the last known good state.
- Alternatively, restore from the latest automated snapshot.
**Verification**: Validate critical tables (`customers`, `accounts`, `transactions`) and verify consistency.
**RTO**: 1 Hour | **RPO**: 5 Minutes

## 2. Application Outage (Deployment Failure)

**Detection**: 5xx HTTP errors spiking, health checks failing, or containers crashing.
**Immediate Response**: 
- Inspect application structured logs for fatal startup errors or missing environment variables.
**Recovery**:
- Roll back to the previous stable container image tag using the cloud deployment console/CLI.
**Verification**: Confirm `/api/health` returns `HEALTHY`.

## 3. Gemini Service Outage

**Detection**: Copilot features failing consistently.
**Immediate Response**: 
- Verify Google Cloud / AI Studio service health dashboard.
**Recovery**: 
- The application is designed to degrade gracefully. Users will see a "Copilot temporarily unavailable" message while core CRM functionality (customers, loans, etc.) remains fully operational.
**Verification**: Wait for service restoration and test Copilot responses.

## 4. Secret Compromise

**Detection**: Alerts from secret scanning, suspicious audit logs, or anomaly detection.
**Immediate Response**: 
- Rotate the compromised credential (e.g., Database Password, `GEMINI_API_KEY`) in the Cloud Secret Manager immediately.
**Recovery**: 
- Restart the application servers to pick up the new rotated secrets.
**Post-Incident**: Analyze audit logs to determine the extent of unauthorized access.
