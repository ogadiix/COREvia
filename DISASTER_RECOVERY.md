# COREvia Disaster Recovery (DR) & Business Continuity Plan

This document establishes the recovery protocols, operational responsibilities, and continuity targets for COREvia.

---

## 1. Scope & Implementation Boundaries

| Component | Status in Codebase | Operational Classification |
|---|---|---|
| **Cryptographic Audit Log Chaining** | **IMPLEMENTED IN CODE** | Automated SHA-256 tamper-evident chaining on PostgreSQL `audit_logs` table. |
| **Circuit Breakers & Retries** | **IMPLEMENTED IN CODE** | Automatic failure state isolation in integration gateway. |
| **Deterministic AI Fallback** | **IMPLEMENTED IN CODE** | Graceful degradation to deterministic responses when Gemini is offline. |
| **Database Backups & WAL Archiving** | **NOT AUTOMATED IN CODE** | **OPERATIONAL RESPONSIBILITY** (requires cloud infrastructure or cron jobs). |
| **Cross-Region Active-Active Failover**| **NOT CONFIGURED** | **OPERATIONAL RESPONSIBILITY** (cold standby / container redeployment). |
| **Point-in-Time Recovery (PITR)** | **NOT AUTOMATED IN CODE** | **OPERATIONAL RESPONSIBILITY** (dependent on RDS / Cloud SQL / pg_backrest). |

---

## 2. Operational Continuity Targets (SLA Goals)

> [!NOTE]
> The figures below represent **operational targets** under standard enterprise hosting conditions, not guaranteed capabilities of the standalone repository.

- **Recovery Point Objective (RPO Target)**: `<= 15 minutes` (achieved via continuous PostgreSQL WAL archiving).
- **Recovery Time Objective (RTO Target)**: `<= 1 hour` (achieved via automated container redeployment and database snapshot restore).

---

## 3. Database Disaster Recovery Protocols

### 3.1 Recommended Backup Strategy (Operational Responsibility)
1. **Daily Physical Snapshots**: Automated volume-level snapshot or `pg_dump` taken during off-peak hours (e.g. 02:00 UTC).
   ```bash
   # Recommended manual snapshot command
   pg_dump -Fc -v -d "$DATABASE_URL" -f "corevia_backup_$(date +%Y%m%d_%H%M%S).dump"
   ```
2. **Continuous WAL Archiving**: Configure PostgreSQL `archive_mode = on` shipping WAL segments to encrypted object storage (S3 / GCS).

### 3.2 Restore Validation Procedure
1. Provision a staging or isolated recovery PostgreSQL instance.
2. Restore the dump file:
   ```bash
   pg_restore -v -d "$RECOVERY_DATABASE_URL" "corevia_backup_YYYYMMDD_HHMMSS.dump"
   ```
3. Run migrations to ensure schema consistency:
   ```bash
   npm run db:migrate
   ```
4. Verify table row counts and execute test suite:
   ```bash
   npm test
   ```

---

## 4. Application Redeployment Protocol

If the application hosting tier experiences catastrophic container or VM failure:

1. **Provision Container Environment**:
   Deploy the pre-built Docker image (`corevia-core-banking`) to a new instance or cluster.
2. **Inject Secrets from Secret Manager**:
   Inject `DATABASE_URL`, `SESSION_SECRET`, `APP_URL`, and optionally `GEMINI_API_KEY`.
3. **Verify Health Endpoint**:
   ```bash
   curl -f http://<new-instance-host>:3000/api/health
   ```
4. **Update DNS / Ingress**:
   Switch reverse proxy or load balancer traffic to the newly provisioned instance.

---

## 5. Secret Compromise & Rotation Protocol

If credentials or session secrets are leaked:
1. **Immediate Rotation**: Generate a new 32+ character `SESSION_SECRET` in environment variables.
2. **Service Restart**: Restart the Node application servers. Existing user sessions will immediately be invalidated due to HMAC secret mismatch, preventing attacker session hijacking.
3. **Database Password Rotation**: Update database credentials in PostgreSQL and update `DATABASE_URL`.
4. **Gemini Key Rotation**: Rotate the Google Gemini API key via Google AI Studio / GCP Console and update `GEMINI_API_KEY`.
