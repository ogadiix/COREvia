import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { eq, or, and, gt, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  users,
  sessions,
  roles,
  permissions,
  rolePermissions,
  userRoles,
  auditLogs,
} from '../db/schema.ts';

export interface SafeUser {
  id: number;
  uid: string;
  employeeId: string;
  email: string;
  name: string;
  role: string;
  roleName: string;
  department: string;
  status: string;
  permissions: string[];
}

export interface LoginResult {
  success: boolean;
  statusCode: number;
  message: string;
  sessionToken?: string;
  expiresAt?: Date;
  user?: SafeUser;
}

export const authService = {
  /**
   * Enterprise Banking Authentication Flow
   * Identifier: Email address or Employee ID
   */
  async login(params: {
    identifier: string;
    password: string;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  }): Promise<LoginResult> {
    const { identifier, password, ipAddress, userAgent } = params;
    const reqId = params.requestId || `REQ-AUTH-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const cleanIdentifier = identifier.trim().toLowerCase();

    // 1. Query user by email or employee ID
    const foundUsers = await db
      .select()
      .from(users)
      .where(
        or(
          sql`LOWER(${users.email}) = ${cleanIdentifier}`,
          sql`LOWER(${users.employeeId}) = ${cleanIdentifier}`
        )
      )
      .limit(1);

    const user = foundUsers[0];

    // Generic error message to prevent user enumeration
    const genericFailureMsg = 'Invalid credentials. Please verify your details and try again.';

    if (!user) {
      // Audit log failed attempt
      await db.insert(auditLogs).values({
        actorId: cleanIdentifier.substring(0, 50),
        actorName: 'Anonymous / Unauthenticated',
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH_SESSION',
        resourceId: 'NONE',
        requestId: reqId,
        outcome: 'FAILURE',
        metadata: JSON.stringify({ reason: 'USER_NOT_FOUND', ipAddress }),
      });

      return {
        success: false,
        statusCode: 401,
        message: genericFailureMsg,
      };
    }

    // 2. Verify Password Hash
    if (!user.passwordHash) {
      await db.insert(auditLogs).values({
        actorId: user.employeeId,
        actorName: user.name,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH_SESSION',
        resourceId: 'NONE',
        requestId: reqId,
        outcome: 'FAILURE',
        metadata: JSON.stringify({ reason: 'NO_PASSWORD_HASH', ipAddress }),
      });

      return {
        success: false,
        statusCode: 401,
        message: genericFailureMsg,
      };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      await db.insert(auditLogs).values({
        actorId: user.employeeId,
        actorName: user.name,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH_SESSION',
        resourceId: 'NONE',
        requestId: reqId,
        outcome: 'FAILURE',
        metadata: JSON.stringify({ reason: 'PASSWORD_MISMATCH', ipAddress }),
      });

      return {
        success: false,
        statusCode: 401,
        message: genericFailureMsg,
      };
    }

    // 3. Verify User Status (Inactive or Suspended accounts)
    if (user.status === 'INACTIVE' || !user.isActive) {
      await db.insert(auditLogs).values({
        actorId: user.employeeId,
        actorName: user.name,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH_SESSION',
        resourceId: 'NONE',
        requestId: reqId,
        outcome: 'DENIED',
        metadata: JSON.stringify({ reason: 'ACCOUNT_INACTIVE', ipAddress }),
      });

      return {
        success: false,
        statusCode: 403,
        message: 'Account is inactive. Please contact your Branch System Administrator.',
      };
    }

    if (user.status === 'SUSPENDED') {
      await db.insert(auditLogs).values({
        actorId: user.employeeId,
        actorName: user.name,
        action: 'LOGIN_FAILURE',
        resourceType: 'AUTH_SESSION',
        resourceId: 'NONE',
        requestId: reqId,
        outcome: 'DENIED',
        metadata: JSON.stringify({ reason: 'ACCOUNT_SUSPENDED', ipAddress }),
      });

      return {
        success: false,
        statusCode: 403,
        message: 'Account has been suspended by Bank Compliance. Please contact Security Operations.',
      };
    }

    // 4. Create Secure Session in PostgreSQL
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await db.insert(sessions).values({
      sessionToken,
      userId: user.id,
      expiresAt,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent ? userAgent.substring(0, 255) : 'Unknown',
    });

    // 5. Fetch Role and Permissions
    const userRoleInfo = await this.getUserPermissions(user.id, user.role);

    // 6. Record Successful Audit Log
    await db.insert(auditLogs).values({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'LOGIN_SUCCESS',
      resourceType: 'AUTH_SESSION',
      resourceId: sessionToken.substring(0, 8) + '***',
      requestId: reqId,
      outcome: 'SUCCESS',
      metadata: JSON.stringify({
        role: user.role,
        department: user.department,
        ipAddress,
      }),
    });

    const safeUser: SafeUser = {
      id: user.id,
      uid: user.uid,
      employeeId: user.employeeId,
      email: user.email,
      name: user.name,
      role: user.role,
      roleName: userRoleInfo.roleName,
      department: user.department,
      status: user.status,
      permissions: userRoleInfo.permissions,
    };

    return {
      success: true,
      statusCode: 200,
      message: 'Authentication successful',
      sessionToken,
      expiresAt,
      user: safeUser,
    };
  },

  /**
   * Validate session token from Cookie or Authorization header
   */
  async validateSession(sessionToken: string): Promise<{ user: SafeUser; session: any } | null> {
    if (!sessionToken || sessionToken.trim() === '') {
      return null;
    }

    const foundSessions = await db
      .select({
        sessionId: sessions.id,
        sessionToken: sessions.sessionToken,
        expiresAt: sessions.expiresAt,
        lastActivityAt: sessions.lastActivityAt,
        userId: users.id,
        uid: users.uid,
        employeeId: users.employeeId,
        email: users.email,
        name: users.name,
        role: users.role,
        department: users.department,
        status: users.status,
        isActive: users.isActive,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(
        and(
          eq(sessions.sessionToken, sessionToken),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (foundSessions.length === 0) {
      return null;
    }

    const sessionData = foundSessions[0];

    if (sessionData.status !== 'ACTIVE' || !sessionData.isActive) {
      return null;
    }

    // Banking Inactivity Timeout Validation (Default: 15 minutes)
    const IDLE_TIMEOUT_MS = parseInt(process.env.SESSION_IDLE_TIMEOUT_MINUTES || '15', 10) * 60 * 1000;
    const now = new Date();
    const lastActive = sessionData.lastActivityAt ? new Date(sessionData.lastActivityAt).getTime() : now.getTime();

    if (now.getTime() - lastActive > IDLE_TIMEOUT_MS) {
      // Inactivity timeout exceeded: Delete session record and log audit
      await db.delete(sessions).where(eq(sessions.id, sessionData.sessionId));
      await db.insert(auditLogs).values({
        actorId: sessionData.employeeId,
        actorName: sessionData.name,
        action: 'SESSION_IDLE_TIMEOUT',
        resourceType: 'AUTH_SESSION',
        resourceId: sessionToken.substring(0, 8) + '***',
        requestId: `REQ-TIMEOUT-${Date.now()}`,
        outcome: 'EXPIRED',
        metadata: JSON.stringify({
          reason: 'INACTIVITY_TIMEOUT',
          idleDurationMs: now.getTime() - lastActive,
          maxAllowedMs: IDLE_TIMEOUT_MS,
        }),
      });
      return null;
    }

    // Refresh lastActivityAt in database if more than 10 seconds have elapsed
    if (now.getTime() - lastActive > 10000) {
      await db
        .update(sessions)
        .set({ lastActivityAt: now })
        .where(eq(sessions.id, sessionData.sessionId));
    }

    const userRoleInfo = await this.getUserPermissions(sessionData.userId, sessionData.role);

    const safeUser: SafeUser = {
      id: sessionData.userId,
      uid: sessionData.uid,
      employeeId: sessionData.employeeId,
      email: sessionData.email,
      name: sessionData.name,
      role: sessionData.role,
      roleName: userRoleInfo.roleName,
      department: sessionData.department,
      status: sessionData.status,
      permissions: userRoleInfo.permissions,
    };

    return {
      user: safeUser,
      session: {
        id: sessionData.sessionId,
        expiresAt: sessionData.expiresAt,
        lastActivityAt: sessionData.lastActivityAt,
      },
    };
  },

  /**
   * Extend active session by updating lastActivityAt in database
   */
  async extendSession(sessionToken: string): Promise<boolean> {
    if (!sessionToken || sessionToken.trim() === '') return false;
    try {
      const now = new Date();
      await db
        .update(sessions)
        .set({ lastActivityAt: now })
        .where(eq(sessions.sessionToken, sessionToken));
      return true;
    } catch (e) {
      console.warn('Failed to extend session timestamp:', e);
      return false;
    }
  },

  /**
   * Logout: Invalidate session in database
   */
  async logout(
    sessionToken: string,
    actorContext?: { employeeId: string; name: string },
    reason?: string
  ): Promise<boolean> {
    if (!sessionToken) return true;

    try {
      await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken));

      const reqId = `REQ-LOGOUT-${Date.now()}`;
      await db.insert(auditLogs).values({
        actorId: actorContext?.employeeId || 'SYSTEM',
        actorName: actorContext?.name || 'Bank Officer',
        action: reason === 'INACTIVITY_TIMEOUT' ? 'SESSION_IDLE_TIMEOUT' : 'LOGOUT',
        resourceType: 'AUTH_SESSION',
        resourceId: sessionToken.substring(0, 8) + '***',
        requestId: reqId,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          event: 'SESSION_INVALIDATED',
          reason: reason || 'MANUAL_USER_LOGOUT',
        }),
      });

      return true;
    } catch (err) {
      console.error('Error invalidating session:', err);
      return false;
    }
  },

  /**
   * Fetch Role details and all assigned permissions for user
   */
  async getUserPermissions(userId: number, roleCode: string): Promise<{ roleName: string; permissions: string[] }> {
    try {
      // 1. Role name lookup
      const roleRecords = await db.select().from(roles).where(eq(roles.code, roleCode)).limit(1);
      const roleName = roleRecords[0]?.name || roleCode.replace(/_/g, ' ');

      // 2. Fetch permissions mapped via role_permissions
      let permCodes: string[] = [];
      if (roleRecords[0]?.id) {
        const mappedPerms = await db
          .select({ code: permissions.code })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, roleRecords[0].id));

        permCodes = mappedPerms.map((p) => p.code);
      }

      // 3. If no mapped permissions found in table, apply standard enterprise RBAC defaults
      if (permCodes.length === 0) {
        permCodes = this.getDefaultPermissionsForRole(roleCode);
      }

      return { roleName, permissions: permCodes };
    } catch (e) {
      return {
        roleName: roleCode.replace(/_/g, ' '),
        permissions: this.getDefaultPermissionsForRole(roleCode),
      };
    }
  },

  /**
   * Canonical enterprise permissions matrix by role
   */
  getDefaultPermissionsForRole(roleCode: string): string[] {
    const base = ['dashboard:view', 'search:access', 'nba:read', 'radar:read', 'analytics:read', 'analytics:export'];
    switch (roleCode) {
      case 'ADMINISTRATOR':
      case 'BRANCH_OPS_HEAD':
      case 'BRANCH_MANAGER':
        return [
          ...base,
          'admin:all',
          'users:manage',
          'roles:manage',
          'audit:read',
          'customers:all',
          'accounts:all',
          'loans:all',
          'settings:manage',
          'maker_checker:authorize',
          'intelligence:read',
          'intelligence:view',
          'intelligence:acknowledge',
          'intelligence:resolve',
          'nba:read',
          'nba:accept',
          'nba:dismiss',
          'nba:create-task',
          'radar:read',
          'radar:review',
          'radar:convert',
          'radar:dismiss',
        ];
      case 'RELATIONSHIP_MANAGER':
        return [
          ...base,
          'customers:read',
          'customers:write',
          'customer360:view',
          'accounts:read',
          'loans:read',
          'opportunities:manage',
          'tasks:manage',
          'interactions:log',
          'products:enroll',
          'intelligence:view',
          'intelligence:read',
          'intelligence:acknowledge',
          'intelligence:resolve',
          'nba:read',
          'nba:accept',
          'nba:dismiss',
          'nba:create-task',
          'radar:read',
          'radar:review',
          'radar:convert',
          'radar:dismiss',
        ];
      case 'MAKER_L2':
      case 'OPERATIONS':
        return [
          ...base,
          'customers:read',
          'accounts:read',
          'accounts:manage',
          'transactions:execute',
          'loans:disburse',
          'products:enroll',
          'maker_checker:submit',
          'intelligence:view',
          'intelligence:read',
          'nba:read',
          'nba:create-task',
          'radar:read',
          'radar:review',
        ];
      case 'SERVICE_AGENT':
        return [
          ...base,
          'customers:read',
          'customer360:view',
          'accounts:read',
          'cases:manage',
          'tasks:read',
          'tasks:write',
          'interactions:log',
          'intelligence:view',
          'intelligence:read',
          'nba:read',
          'nba:create-task',
          'radar:read',
        ];
      case 'COMPLIANCE_OFFICER':
      case 'ANALYST':
        return [
          ...base,
          'customers:read',
          'customer360:view',
          'accounts:read',
          'loans:read',
          'scores:calculate',
          'reports:view',
          'analytics:read',
          'intelligence:view',
          'intelligence:read',
          'nba:read',
          'radar:read',
          'radar:review',
        ];
      default:
        return base;
    }
  },
};
