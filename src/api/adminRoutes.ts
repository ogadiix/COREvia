/**
 * COREvia Phase 39: Enterprise Administration & Governance API Routes
 * Mount path: /api/admin
 *
 * Strict security invariants:
 * 1. requireAuth + requireRole('ADMINISTRATOR') enforced across all routes.
 * 2. Unauthenticated requests -> 401 Unauthorized.
 * 3. Authenticated non-admin requests -> 403 Forbidden.
 * 4. Zero disclosure of passwords, hashes, session tokens, or API secrets.
 * 5. State mutations strictly require explicit confirmations and audit logging.
 */

import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { adminService } from '../services/admin/admin.service.ts';

export const adminRouter = Router();

// Apply Enterprise Security Gateways: Authentication & Role Check
adminRouter.use(requireAuth);
adminRouter.use(requireRole('ADMINISTRATOR'));

// ============================================================================
// 1. ADMIN OVERVIEW
// ============================================================================

adminRouter.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const overview = await adminService.getAdminOverview();
    return res.json({ success: true, data: overview });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'ADMIN_OVERVIEW_ERROR', message: err.message } });
  }
});

// ============================================================================
// 2. USER ADMINISTRATION
// ============================================================================

adminRouter.get('/users', async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, role, department, limit, offset } = req.query;
    const result = await adminService.getUsers({
      search: search as string,
      status: status as string,
      role: role as string,
      department: department as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
      offset: offset ? parseInt(offset as string, 10) : undefined,
    });
    return res.json({ success: true, data: result.users, total: result.total });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'USERS_FETCH_ERROR', message: err.message } });
  }
});

adminRouter.get('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: { code: 'INVALID_USER_ID', message: 'User ID must be a numeric integer.' } });
    }

    const detail = await adminService.getUserDetail(userId);
    if (!detail) {
      return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: `User #${userId} was not found.` } });
    }

    return res.json({ success: true, data: detail });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'USER_DETAIL_ERROR', message: err.message } });
  }
});

adminRouter.post('/users/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { status, reason, confirmation } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Administrative user mutations require explicit confirmation.' },
      });
    }

    if (!['ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED'].includes(status)) {
      return res.status(400).json({
        error: { code: 'INVALID_STATUS', message: 'Status must be one of: ACTIVE, INACTIVE, LOCKED, SUSPENDED' },
      });
    }

    const actor = req.user!;
    const requestId = req.requestId || `REQ-ADMIN-${Date.now()}`;

    const result = await adminService.updateUserStatus({
      actorUserId: actor.id,
      actorName: actor.name,
      actorEmployeeId: actor.employeeId,
      targetUserId,
      status,
      reason: reason || 'Administrative status transition requested',
      requestId,
    });

    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    const status = err.message.includes('Self-deactivation') ? 403 : 500;
    return res.status(status).json({ error: { code: 'USER_STATUS_UPDATE_ERROR', message: err.message } });
  }
});

adminRouter.post('/users/:id/reset-access', async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { reason, confirmation } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Credential reset requires explicit administrative confirmation.' },
      });
    }

    const actor = req.user!;
    const requestId = req.requestId || `REQ-ADMIN-${Date.now()}`;

    const result = await adminService.resetUserAccess({
      actorUserId: actor.id,
      actorName: actor.name,
      actorEmployeeId: actor.employeeId,
      targetUserId,
      reason: reason || 'Administrative access credential reset requested',
      requestId,
    });

    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'RESET_ACCESS_ERROR', message: err.message } });
  }
});

// ============================================================================
// 3. ROLES & PERMISSIONS
// ============================================================================

adminRouter.get('/roles', async (req: AuthRequest, res: Response) => {
  try {
    const roles = await adminService.getRoles();
    return res.json({ success: true, data: roles });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'ROLES_FETCH_ERROR', message: err.message } });
  }
});

adminRouter.get('/permissions', async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await adminService.getPermissions();
    return res.json({ success: true, data: permissions });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'PERMISSIONS_FETCH_ERROR', message: err.message } });
  }
});

// ============================================================================
// 4. SESSIONS & LOGIN ACTIVITY
// ============================================================================

adminRouter.get('/sessions', async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await adminService.getSessions();
    return res.json({ success: true, data: sessions });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SESSIONS_FETCH_ERROR', message: err.message } });
  }
});

adminRouter.post('/sessions/:id/revoke', async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    const { reason, confirmation } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Session revocation requires explicit confirmation.' },
      });
    }

    const actor = req.user!;
    const requestId = req.requestId || `REQ-ADMIN-${Date.now()}`;

    const result = await adminService.revokeSession({
      actorEmployeeId: actor.employeeId,
      actorName: actor.name,
      sessionId,
      reason: reason || 'Administrative session revocation',
      requestId,
    });

    return res.json({ success: true, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SESSION_REVOCATION_ERROR', message: err.message } });
  }
});

adminRouter.post('/users/:id/revoke-sessions', async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id, 10);
    const { reason, confirmation } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Bulk session revocation requires explicit confirmation.' },
      });
    }

    const actor = req.user!;
    const requestId = req.requestId || `REQ-ADMIN-${Date.now()}`;

    const result = await adminService.revokeAllSessionsForUser({
      actorEmployeeId: actor.employeeId,
      actorName: actor.name,
      targetUserId,
      reason: reason || 'Bulk session revocation for user',
      requestId,
    });

    return res.json({ success: true, count: result.count, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'BULK_SESSION_REVOCATION_ERROR', message: err.message } });
  }
});

adminRouter.get('/login-activity', async (req: AuthRequest, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
    const activity = await adminService.getLoginActivity(limit);
    return res.json({ success: true, data: activity });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'LOGIN_ACTIVITY_ERROR', message: err.message } });
  }
});

// ============================================================================
// 5. SECURITY EVENTS
// ============================================================================

adminRouter.get('/security-events', async (req: AuthRequest, res: Response) => {
  try {
    const { type, severity, limit } = req.query;
    const events = await adminService.getSecurityEvents({
      type: type as string,
      severity: severity as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    return res.json({ success: true, data: events });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SECURITY_EVENTS_ERROR', message: err.message } });
  }
});

adminRouter.get('/security-events/:id', async (req: AuthRequest, res: Response) => {
  try {
    const event = await adminService.getSecurityEventDetail(req.params.id);
    if (!event) {
      return res.status(404).json({ error: { code: 'EVENT_NOT_FOUND', message: `Event ${req.params.id} not found.` } });
    }
    return res.json({ success: true, data: event });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SECURITY_EVENT_DETAIL_ERROR', message: err.message } });
  }
});

// ============================================================================
// 6. AI GOVERNANCE
// ============================================================================

adminRouter.get('/ai-governance', async (req: AuthRequest, res: Response) => {
  try {
    const aiGov = await adminService.getAiGovernance();
    return res.json({ success: true, data: aiGov });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'AI_GOVERNANCE_ERROR', message: err.message } });
  }
});

// ============================================================================
// 7. INTEGRATIONS ADMINISTRATION
// ============================================================================

adminRouter.get('/integrations', async (req: AuthRequest, res: Response) => {
  try {
    const summary = await adminService.getIntegrationsSummary();
    return res.json({ success: true, data: summary });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'INTEGRATIONS_SUMMARY_ERROR', message: err.message } });
  }
});

// ============================================================================
// 8. NOTIFICATIONS & SLA
// ============================================================================

adminRouter.get('/notifications', async (req: AuthRequest, res: Response) => {
  try {
    const policies = adminService.getNotificationPolicies();
    return res.json({ success: true, data: policies });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'NOTIFICATIONS_FETCH_ERROR', message: err.message } });
  }
});

adminRouter.get('/sla', async (req: AuthRequest, res: Response) => {
  try {
    const policies = adminService.getSlaPolicies();
    return res.json({ success: true, data: policies });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SLA_FETCH_ERROR', message: err.message } });
  }
});

// ============================================================================
// 9. FEATURE FLAGS
// ============================================================================

adminRouter.get('/feature-flags', async (req: AuthRequest, res: Response) => {
  try {
    const flags = await adminService.getFeatureFlags();
    return res.json({ success: true, data: flags });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'FEATURE_FLAGS_ERROR', message: err.message } });
  }
});

adminRouter.post('/feature-flags/:key/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const flagKey = req.params.key;
    const { enabled, reason, confirmation } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Feature flag mutations require explicit confirmation.' },
      });
    }

    const actor = req.user!;
    const requestId = req.requestId || `REQ-ADMIN-${Date.now()}`;

    const result = await adminService.toggleFeatureFlag({
      actorEmployeeId: actor.employeeId,
      actorName: actor.name,
      flagKey,
      enabled: Boolean(enabled),
      reason: reason || 'Administrative feature flag toggle',
      requestId,
    });

    return res.json({ success: true, flag: result.flag, message: result.message });
  } catch (err: any) {
    const status = err.message.includes('bypass') ? 403 : 500;
    return res.status(status).json({ error: { code: 'FEATURE_FLAG_MUTATION_ERROR', message: err.message } });
  }
});

// ============================================================================
// 10. SYSTEM CONFIGURATION & DATABASE HEALTH
// ============================================================================

adminRouter.get('/system-config', async (req: AuthRequest, res: Response) => {
  try {
    const config = await adminService.getSystemConfig();
    return res.json({ success: true, data: config });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'SYSTEM_CONFIG_ERROR', message: err.message } });
  }
});

adminRouter.get('/database-health', async (req: AuthRequest, res: Response) => {
  try {
    const health = await adminService.getDatabaseHealth();
    return res.json({ success: true, data: health });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'DATABASE_HEALTH_ERROR', message: err.message } });
  }
});

// ============================================================================
// 11. BACKGROUND JOBS
// ============================================================================

adminRouter.get('/jobs', async (req: AuthRequest, res: Response) => {
  try {
    const jobs = await adminService.getBackgroundJobs();
    return res.json({ success: true, data: jobs });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'BACKGROUND_JOBS_ERROR', message: err.message } });
  }
});

// ============================================================================
// 12. MAINTENANCE MODE
// ============================================================================

adminRouter.get('/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const config = await adminService.getMaintenanceMode();
    return res.json({ success: true, data: config });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'MAINTENANCE_FETCH_ERROR', message: err.message } });
  }
});

adminRouter.post('/maintenance', async (req: AuthRequest, res: Response) => {
  try {
    const { active, reason, expectedDurationMinutes, confirmation } = req.body;

    if (!confirmation) {
      return res.status(400).json({
        error: { code: 'CONFIRMATION_REQUIRED', message: 'Maintenance mode transitions require explicit confirmation.' },
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        error: { code: 'REASON_REQUIRED', message: 'A verified operational reason is mandatory for maintenance mode.' },
      });
    }

    const actor = req.user!;
    const requestId = req.requestId || `REQ-ADMIN-${Date.now()}`;

    const result = await adminService.setMaintenanceMode({
      actorEmployeeId: actor.employeeId,
      actorName: actor.name,
      active: Boolean(active),
      reason,
      expectedDurationMinutes: expectedDurationMinutes ? parseInt(expectedDurationMinutes, 10) : undefined,
      requestId,
    });

    return res.json({ success: true, config: result.config, message: result.message });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'MAINTENANCE_TOGGLE_ERROR', message: err.message } });
  }
});

// ============================================================================
// 13. GOVERNANCE EXCEPTIONS & AUDIT TRAIL
// ============================================================================

adminRouter.get('/governance-exceptions', async (req: AuthRequest, res: Response) => {
  try {
    const { status, severity, limit } = req.query;
    const exceptions = await adminService.getGovernanceExceptions({
      status: status as string,
      severity: severity as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    return res.json({ success: true, data: exceptions });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'GOVERNANCE_EXCEPTIONS_ERROR', message: err.message } });
  }
});

adminRouter.get('/audit', async (req: AuthRequest, res: Response) => {
  try {
    const { actorId, action, outcome, limit } = req.query;
    const logs = await adminService.getAuditTrail({
      actorId: actorId as string,
      action: action as string,
      outcome: outcome as string,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });
    return res.json({ success: true, data: logs });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'AUDIT_TRAIL_ERROR', message: err.message } });
  }
});

adminRouter.get('/audit/verify-integrity', async (req: AuthRequest, res: Response) => {
  try {
    const result = await adminService.verifyAuditIntegrity();
    return res.json({ success: true, data: result });
  } catch (err: any) {
    return res.status(500).json({ error: { code: 'AUDIT_INTEGRITY_ERROR', message: err.message } });
  }
});
