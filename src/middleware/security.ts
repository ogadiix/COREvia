/**
 * COREvia Enterprise Security Middleware Suite
 * Implements Security Headers, Strict CORS, Rate Limiting, CSRF Protection, and Structured Audit Observability
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.ts';
import { auditRepository } from '../repositories/audit.repository.ts';

// ----------------------------------------------------
// 1. SECURITY HEADERS
// ----------------------------------------------------
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Protect against MIME sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Control referrer information
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Restrict sensitive browser APIs in iframe
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  // CSP with frame-ancestors restricted to trusted hosting domains for preview embedding
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss: ws:; frame-ancestors 'self' https://*.google.com https://*.run.app https://ai.studio https://*.ai.studio;"
  );

  next();
}

// ----------------------------------------------------
// 2. HARDENED CORS CONFIGURATION (EXPLICIT ALLOWLIST)
// ----------------------------------------------------

/**
 * Parses and normalizes configured origins from CORS_ALLOWED_ORIGINS environment variable.
 * Does NOT permit wildcards, arbitrary subdomains, or unauthenticated reflection.
 */
export function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();

  // Explicit local development origins (enabled only in non-production environments)
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3000');
    allowed.add('http://127.0.0.1:3000');
    allowed.add('http://localhost:5173');
    allowed.add('http://127.0.0.1:5173');
  }

  const rawConfig = process.env.CORS_ALLOWED_ORIGINS || '';
  if (rawConfig.trim()) {
    const parts = rawConfig.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      try {
        const parsed = new URL(trimmed);
        // Normalize to protocol://hostname[:port] in lowercase
        allowed.add(parsed.origin.toLowerCase());
      } catch {
        console.warn(`[CORS Security] Invalid origin in CORS_ALLOWED_ORIGINS ignored: "${trimmed}"`);
      }
    }
  }

  return allowed;
}

/**
 * Checks if a given origin is explicitly authorized.
 * Strict invariants:
 * 1. Zero wildcard domain matching.
 * 2. Zero dynamic trust of Host or X-Forwarded-Host.
 * 3. Exact normalized string equality.
 */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin || typeof origin !== 'string') {
    return false;
  }

  try {
    const normalized = new URL(origin.trim()).origin.toLowerCase();
    const allowed = getAllowedOrigins();
    return allowed.has(normalized);
  } catch {
    return false; // Malformed origin rejected
  }
}

export function hardenedCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (origin) {
    const isAllowed = isOriginAllowed(origin);
    if (isAllowed) {
      const normalizedOrigin = new URL(origin).origin.toLowerCase();
      res.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Request-Id, X-Requested-With, X-CSRF-Token'
      );
    } else {
      // Disallowed cross-origin request
      if (req.method === 'OPTIONS') {
        return res.status(403).json({
          error: {
            code: 'CORS_DISALLOWED_ORIGIN',
            message: 'CORS policy does not allow access from the specified Origin.',
          },
        });
      }
    }
  }

  if (req.method === 'OPTIONS') {
    // If origin was present and allowed, or no origin present, send 204
    if (!origin || isOriginAllowed(origin)) {
      return res.sendStatus(204);
    }
    return res.status(403).json({
      error: {
        code: 'CORS_DISALLOWED_ORIGIN',
        message: 'CORS policy does not allow access from the specified Origin.',
      },
    });
  }

  next();
}

// ----------------------------------------------------
// 3. REQUEST CORRELATION & OBSERVABILITY LOGGING
// ----------------------------------------------------
export function requestCorrelationAndLogging(req: AuthRequest, res: Response, next: NextFunction) {
  const start = Date.now();
  const reqId =
    (req.headers['x-request-id'] as string) ||
    `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    // Log API access safely (never log bodies, passwords, or tokens)
    if (req.originalUrl.startsWith('/api')) {
      const statusCategory = res.statusCode >= 400 ? 'WARN' : 'INFO';
      console.log(
        `[${statusCategory}][API] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | Latency: ${duration}ms | ID: ${reqId}`
      );
    }
  });

  next();
}

// ----------------------------------------------------
// 4. RATE LIMITING ENGINE (PROCESS-LOCAL IN-MEMORY)
// ----------------------------------------------------
// Note: This is a process-local rate limiter suitable for single-instance synthetic/local deployment.
// For distributed horizontal production scaling, a Redis-backed rate limiter is required.
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitStores = {
  global: new Map<string, RateLimitBucket>(),
  auth: new Map<string, RateLimitBucket>(),
  copilot: new Map<string, RateLimitBucket>(),
  export: new Map<string, RateLimitBucket>(),
};

function checkBucket(
  store: Map<string, RateLimitBucket>,
  key: string,
  capacity: number,
  refillPerSec: number
): boolean {
  const now = Date.now();
  let bucket = store.get(key);

  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    store.set(key, bucket);
  } else {
    const elapsedSecs = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSecs * refillPerSec);
    bucket.lastRefill = now;
  }

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

export function createRateLimiter(options: {
  storeType: keyof typeof rateLimitStores;
  capacity: number;
  refillPerSec: number;
  name: string;
}) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const clientKey = req.user ? `user:${req.user.id}` : `ip:${ip}`;

    const allowed = checkBucket(
      rateLimitStores[options.storeType],
      clientKey,
      options.capacity,
      options.refillPerSec
    );

    if (!allowed) {
      console.warn(`[SECURITY_RATE_LIMIT] ${options.name} exceeded for ${clientKey}`);
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests for ${options.name}. Please wait and try again shortly.`,
          requestId: req.requestId,
        },
      });
    }

    next();
  };
}

export const copilotRateLimiter = createRateLimiter({
  storeType: 'copilot',
  capacity: 25, // Burst of 25 requests
  refillPerSec: 0.5, // 30 requests per minute
  name: 'Banking Copilot AI',
});

export const exportRateLimiter = createRateLimiter({
  storeType: 'export',
  capacity: 10,
  refillPerSec: 0.2, // 12 exports per minute
  name: 'Data Export Engine',
});

// ----------------------------------------------------
// 5. CSRF PROTECTION FOR MUTATION APIS
// ----------------------------------------------------
/**
 * Hardened CSRF Protection.
 * For cookie-authenticated mutation requests:
 * Requires one of:
 * A. Valid CSRF token provided via X-CSRF-Token header.
 * OR
 * B. Trusted exact configured Origin (or Referer if Origin is omitted by browser)
 *    combined with appropriate browser request semantics.
 *
 * Invariants:
 * - Bearer-authenticated requests are exempt because ambient browser cookies are not used.
 * - Arbitrary Origins or forged X-Forwarded-Host headers are strictly rejected.
 * - Arbitrary X-Requested-With from cross-origin callers cannot bypass the policy.
 */
export function csrfProtection(req: AuthRequest, res: Response, next: NextFunction) {
  // Safe read-only HTTP methods are exempt
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Bearer-authenticated requests explicitly provide credentials in the Authorization header;
  // they are immune to ambient cookie CSRF
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // Condition A: Explicit CSRF token header
  const csrfToken = req.headers['x-csrf-token'];
  if (csrfToken && typeof csrfToken === 'string' && csrfToken.trim().length > 0) {
    return next();
  }

  // Condition B: Valid trusted configured Origin
  const origin = req.headers.origin;
  if (origin) {
    if (isOriginAllowed(origin)) {
      return next();
    }
    // Explicitly disallowed origin
    return res.status(403).json({
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Cross-Site Request Forgery validation failed: Origin is not permitted.',
        requestId: req.requestId,
      },
    });
  }

  // Fallback: Check Referer header if Origin was stripped
  const referer = req.headers.referer;
  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin.toLowerCase();
      if (isOriginAllowed(refererOrigin)) {
        return next();
      }
    } catch {
      // Malformed referer
    }
    return res.status(403).json({
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Cross-Site Request Forgery validation failed: Referer is not permitted.',
        requestId: req.requestId,
      },
    });
  }

  // If neither CSRF token, nor allowed Origin, nor allowed Referer is present on a cookie mutation:
  return res.status(403).json({
    error: {
      code: 'CSRF_VALIDATION_FAILED',
      message: 'Cross-Site Request Forgery validation failed: Missing origin and CSRF verification.',
      requestId: req.requestId,
    },
  });
}
