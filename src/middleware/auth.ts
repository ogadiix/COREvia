import { Request, Response, NextFunction } from 'express';
import { authService, SafeUser } from '../services/auth.service.ts';
import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';

export interface AuthRequest extends Request {
  user?: SafeUser;
  sessionId?: number;
  sessionToken?: string;
  requestId?: string;
}

/**
 * Enterprise Banking Authentication Middleware
 * Enforces real, active sessions from PostgreSQL
 * Supports HTTP-only Cookie (`corevia_session`) and Bearer header
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const reqId =
    (req.headers['x-request-id'] as string) ||
    `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  req.requestId = reqId;

  // 1. Extract session token from HTTP-only cookie or Authorization header
  let sessionToken = req.cookies?.corevia_session;

  if (!sessionToken && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7).trim();
    }
  }

  if (!sessionToken) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required. Please sign in.',
        requestId: reqId,
      },
    });
  }

  // 2. Validate session against PostgreSQL sessions table
  try {
    const sessionData = await authService.validateSession(sessionToken);

    if (!sessionData) {
      // If token is invalid or expired, clear cookie
      res.clearCookie('corevia_session', { path: '/', sameSite: 'none', secure: true });
      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Your session has expired or is invalid. Please sign in again.',
          requestId: reqId,
        },
      });
    }

    // Attach verified user and session to request context
    req.user = sessionData.user;
    req.sessionId = sessionData.session.id;
    req.sessionToken = sessionToken;

    return next();
  } catch (err) {
    console.error('Session validation error:', err);
    return res.status(500).json({
      error: {
        code: 'AUTH_INTERNAL_ERROR',
        message: 'Internal error validating authentication session.',
        requestId: reqId,
      },
    });
  }
};

/**
 * Role-based server-side authorization middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.',
        },
      });
    }

    if (req.user.role === 'ADMINISTRATOR' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    // Audit log authorization denial
    try {
      await db.insert(auditLogs).values({
        actorId: req.user.employeeId,
        actorName: req.user.name,
        action: 'PERMISSION_DENIED',
        resourceType: 'API_ENDPOINT',
        resourceId: req.originalUrl,
        requestId: req.requestId || `REQ-${Date.now()}`,
        outcome: 'DENIED',
        metadata: JSON.stringify({
          userRole: req.user.role,
          requiredRoles: allowedRoles,
          path: req.originalUrl,
        }),
      });
    } catch (e) {
      console.error('Failed to log PERMISSION_DENIED:', e);
    }

    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have the required role privileges to access this banking resource.',
      },
    });
  };
};

/**
 * Granular Permission-based authorization middleware
 */
export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
      });
    }

    if (
      req.user.role === 'ADMINISTRATOR' ||
      req.user.permissions?.includes('admin:all') ||
      req.user.permissions?.includes(permission)
    ) {
      return next();
    }

    try {
      await db.insert(auditLogs).values({
        actorId: req.user.employeeId,
        actorName: req.user.name,
        action: 'PERMISSION_DENIED',
        resourceType: 'API_ENDPOINT',
        resourceId: req.originalUrl,
        requestId: req.requestId || `REQ-${Date.now()}`,
        outcome: 'DENIED',
        metadata: JSON.stringify({
          userRole: req.user.role,
          missingPermission: permission,
          path: req.originalUrl,
        }),
      });
    } catch (e) {
      console.error('Failed to log PERMISSION_DENIED:', e);
    }

    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permission}`,
      },
    });
  };
};
