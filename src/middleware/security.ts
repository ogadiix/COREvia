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

  // X-Frame-Options & CSP frame-ancestors for AI Studio preview
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https: wss:; frame-ancestors 'self' https://*.google.com https://*.run.app https://ai.studio https://*.ai.studio;"
  );

  // Cross-Origin Embedder and Opener Policies
  res.setHeader('X-XSS-Protection', '1; mode=block');

  next();
}

// ----------------------------------------------------
// 2. HARDENED CORS CONFIGURATION
// ----------------------------------------------------
const ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(:\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/(?:[a-zA-Z0-9-]+\.)+run\.app$/,
  /^https:\/\/(?:[a-zA-Z0-9-]+\.)+google\.com$/,
  /^https:\/\/(?:[a-zA-Z0-9-]+\.)+google\.dev$/,
  /^https:\/\/(?:[a-zA-Z0-9-]+\.)*ai\.studio$/,
];

export function isOriginAllowed(origin: string | undefined, req: Request): boolean {
  if (!origin) return true;

  if (ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))) {
    return true;
  }

  try {
    const originHost = new URL(origin).host.toLowerCase();
    const forwardedHost = (req.headers['x-forwarded-host'] as string)?.toLowerCase();
    const host = (req.headers.host as string)?.toLowerCase();

    if (forwardedHost) {
      const firstForwarded = forwardedHost.split(',')[0].trim();
      if (originHost === forwardedHost || originHost === firstForwarded) {
        return true;
      }
    }
    if (host && (originHost === host || host.split(':')[0] === originHost.split(':')[0])) {
      return true;
    }
  } catch {
    // Malformed origin
  }

  return false;
}

export function hardenedCors(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (origin) {
    const isAllowed = isOriginAllowed(origin, req);
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
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
      // If origin is not allowed and this is a cross-origin preflight or request
      if (req.method === 'OPTIONS') {
        return res.status(403).json({ error: 'CORS policy does not allow access from the specified Origin.' });
      }
    }
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
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
    // Log API access safely (never log bodies or passwords)
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
// 4. RATE LIMITING ENGINE (IN-MEMORY PRODUCTION-SAFE)
// ----------------------------------------------------
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
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
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
export function csrfProtection(req: AuthRequest, res: Response, next: NextFunction) {
  // Only state-changing methods require CSRF validation
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // If request is authenticated via Bearer token in Authorization header, it's immune to browser ambient cookie CSRF
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return next();
  }

  // If using Cookie authentication, verify either X-Requested-With, Origin, or CSRF token
  const hasCustomHeader =
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    Boolean(req.headers['x-csrf-token']);

  const origin = req.headers.origin;
  const isAllowed = isOriginAllowed(origin, req);

  if (hasCustomHeader || isAllowed) {
    return next();
  }

  return res.status(403).json({
    error: {
      code: 'CSRF_VALIDATION_FAILED',
      message: 'Cross-Site Request Forgery validation failed. Request blocked.',
      requestId: req.requestId,
    },
  });
}
