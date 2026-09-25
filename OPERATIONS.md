# COREvia Operations Runbook

## High Error Rate or Latency Spikes
**Symptoms**: Users report slow page loads, or monitoring shows increased 5xx responses.
**Checks**:
1. Check CPU and Memory utilization of application containers.
2. Check database connection pool limits.
3. Review APM/Metrics for slow queries.
**Action**: If CPU bound, scale out containers. If DB connection bound, adjust pool size or investigate long-running analytical queries.

## Application Won't Start (Crash Loop)
**Symptoms**: New deployment fails to become healthy; container restarts continuously.
**Checks**:
1. Check container logs for `CRITICAL ERROR: Missing required environment variables`.
2. Ensure database host is reachable from the new container instance.
**Action**: Fix the missing environment variables in the secret manager or rollback to previous deployment.

## Failed Database Migration
**Symptoms**: `db:migrate` script fails during deployment pipeline.
**Checks**:
1. Review the migration error log for syntax errors or constraint violations.
**Action**: Do not deploy the application code if migration fails. Rollback the database manually if the migration was partially applied (or rely on transactional DDL if supported). Fix the schema definitions and retry.

## Credential Rotation
**Procedure**:
1. Generate the new secret (e.g., new `GEMINI_API_KEY`).
2. Update the value in the cloud secret manager.
3. Perform a rolling restart of the COREvia application containers to inject the new environment variable.
4. Verify the application is healthy.
5. Invalidate/Delete the old secret.

## Maintenance Mode
If you need to take the system offline for critical maintenance:
1. Set `MAINTENANCE_MODE=true` in the environment configuration.
2. (Requires explicit implementation in ingress or app layer to serve a 503 Maintenance page).
