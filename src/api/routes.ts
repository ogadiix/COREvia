import { Router } from 'express';
import { requireAuth, requirePermission, requireRole, AuthRequest } from '../middleware/auth.ts';
import { authService } from '../services/auth.service.ts';
import { customerService } from '../services/customer.service.ts';
import { caseService } from '../services/case.service.ts';
import { taskService } from '../services/task.service.ts';
import { opportunityService } from '../services/opportunity.service.ts';
import { interactionService } from '../services/interaction.service.ts';
import { interactionRepository } from '../repositories/interaction.repository.ts';
import { accountService } from '../services/account.service.ts';
import { loanService } from '../services/loan.service.ts';
import { productService } from '../services/product.service.ts';
import { financialRelationshipService } from '../services/financialRelationship.service.ts';
import { relationshipIntelligenceService } from '../services/relationshipIntelligence.service.ts';
import { nextBestActionService } from '../services/nextBestAction.service.ts';
import { opportunityRadarService } from '../services/opportunityRadar.service.ts';
import { forexService } from '../services/forex.service.ts';
import { aiService } from '../services/ai.service.ts';
import { copilotService } from '../services/copilot/copilot.service.ts';
import { pendingActionService } from '../services/copilot/pendingActions.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { marketNewsService } from '../services/marketNews.service.ts';
import { notificationService } from '../services/notification.service.ts';
import { notificationRuleService } from '../services/notificationRule.service.ts';
import { analyticsService } from '../services/analytics.service.ts';
import { onboardingService } from '../services/onboarding.service.ts';
import { documentService } from '../services/document.service.ts';
import { formatErrorResponse } from '../lib/errors.ts';
import { db } from '../db/index.ts';
import { auditLogs, users } from '../db/schema.ts';
import { desc } from 'drizzle-orm';
import { DEV_TEST_PASSWORD } from '../db/seedAuthUsers.ts';
import { resourceAuth } from '../lib/resourceAuth.ts';
import { maskAccountNumber, maskPAN } from '../lib/masking.ts';
import { filterAllowlist, validatePagination, sanitizeText } from '../lib/sanitizer.ts';
import { copilotRateLimiter, exportRateLimiter } from '../middleware/security.ts';

export const apiRouter = Router();

// Rate limiting state for banking login protection
const loginAttemptsMap = new Map<string, { count: number; firstAttemptTime: number }>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED_ATTEMPTS = 5; // 5 attempts per window for bank-grade protection

/**
 * GET /api/health
 * Controlled operational endpoint - Returns basic status without leaking database credentials or internal variables
 */
apiRouter.get('/health', async (req, res) => {
  let isDbConnected = true;
  try {
    await db.select().from(users).limit(1);
  } catch {
    isDbConnected = false;
  }

  const status = isDbConnected ? 'HEALTHY' : 'DEGRADED';
  res.status(isDbConnected ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    service: 'COREvia Banking CRM',
  });
});

/**
 * GET /api/health/ready
 * Database readiness endpoint - minimal response
 */
apiRouter.get('/health/ready', async (req, res) => {
  try {
    await db.select().from(users).limit(1);
    res.json({ ready: true, timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ ready: false, timestamp: new Date().toISOString() });
  }
});

/**
 * GET /api/system/status
 * Administrative diagnostic endpoint - strictly restricted to ADMINISTRATOR role
 */
apiRouter.get('/system/status', requireAuth, requireRole('ADMINISTRATOR'), async (req: AuthRequest, res) => {
  try {
    const userSample = await db.select().from(users).limit(5);
    const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10);
    const isProd = process.env.NODE_ENV === 'production';

    res.json({
      status: 'OPERATIONAL',
      timestamp: new Date().toISOString(),
      service: 'COREvia Banking Suite',
      environment: isProd ? 'production' : 'development',
      geminiEngine: hasGeminiKey ? 'CONFIGURED' : 'NOT_FOUND',
      database: {
        status: userSample.length > 0 ? 'ONLINE' : 'DEGRADED',
        dialect: 'PostgreSQL',
      },
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DEGRADED',
      error: 'System diagnostic inspection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// ----------------------------------------------------
// AUTHENTICATION APIS
// ----------------------------------------------------

/**
 * POST /api/auth/login
 * Authenticates bank employee credentials against PostgreSQL
 */
apiRouter.post('/auth/login', async (req, res) => {
  const reqId = `REQ-LOGIN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  try {
    const { email, password } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Both Email / Employee ID and Password are required.',
          requestId: reqId,
        },
      });
    }

    // Rate Limiting Check
    const rateLimitKey = `${ipAddress}:${email.trim().toLowerCase()}`;
    const now = Date.now();
    const attemptRecord = loginAttemptsMap.get(rateLimitKey);

    if (attemptRecord) {
      if (now - attemptRecord.firstAttemptTime < RATE_LIMIT_WINDOW_MS) {
        if (attemptRecord.count >= MAX_FAILED_ATTEMPTS) {
          const remainingSecs = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - attemptRecord.firstAttemptTime)) / 1000);
          
          await auditRepository.createLog({
            actorId: email.trim().toLowerCase().substring(0, 50),
            actorName: 'Anonymous / Unauthenticated',
            action: 'AUTH_ACCOUNT_LOCKED',
            resourceType: 'AUTH_SESSION',
            resourceId: rateLimitKey,
            requestId: reqId,
            outcome: 'DENIED',
            metadata: {
              ipAddress,
              reason: 'EXCESSIVE_FAILED_LOGINS',
              lockoutDurationSecs: remainingSecs,
            },
          });

          return res.status(429).json({
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: `Too many failed login attempts. Terminal locked for ${remainingSecs} seconds.`,
              requestId: reqId,
            },
          });
        }
      } else {
        // Reset window
        loginAttemptsMap.set(rateLimitKey, { count: 0, firstAttemptTime: now });
      }
    }

    const result = await authService.login({
      identifier: String(email).trim(),
      password: String(password),
      ipAddress,
      userAgent,
      requestId: reqId,
    });

    if (!result.success) {
      // Record failed attempt for rate limiting
      const current = loginAttemptsMap.get(rateLimitKey) || { count: 0, firstAttemptTime: now };
      loginAttemptsMap.set(rateLimitKey, {
        count: current.count + 1,
        firstAttemptTime: current.firstAttemptTime,
      });

      return res.status(result.statusCode).json({
        error: {
          code: result.statusCode === 403 ? 'ACCOUNT_RESTRICTED' : 'INVALID_CREDENTIALS',
          message: result.message,
          requestId: reqId,
        },
      });
    }

    // Clear rate limiter upon successful login
    loginAttemptsMap.delete(rateLimitKey);

    // Set secure HTTP-only cookie
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('corevia_session', result.sessionToken, {
      httpOnly: true,
      secure: true, // Always true for HTTPS/iframes in AI Studio
      sameSite: 'none', // Must be 'none' to work inside cross-origin AI Studio iframe
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.status(200).json({
      status: 'SUCCESS',
      message: 'Authentication successful',
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
      user: result.user,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected banking security error occurred during authentication.',
        requestId: reqId,
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Retrieves the currently authenticated bank officer's safe profile and permissions
 */
apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res) => {
  return res.json({
    user: req.user,
  });
});

/**
 * POST /api/auth/logout
 * Invalidates the current session in PostgreSQL and clears the session cookie
 */
apiRouter.post('/auth/logout', async (req: AuthRequest, res) => {
  let sessionToken = req.cookies?.corevia_session;
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.substring(7).trim();
  }

  const reason = req.body?.reason || 'MANUAL_USER_LOGOUT';

  if (sessionToken) {
    await authService.logout(
      sessionToken,
      {
        employeeId: req.user?.employeeId || 'ANONYMOUS',
        name: req.user?.name || 'Bank Officer',
      },
      reason
    );
  }

  res.clearCookie('corevia_session', { path: '/', sameSite: 'none', secure: true });
  return res.json({
    status: 'SUCCESS',
    message: 'Session invalidated and logged out successfully.',
  });
});

/**
 * POST /api/auth/heartbeat
 * Updates the session lastActivityAt timestamp to extend the active banking session
 */
apiRouter.post('/auth/heartbeat', requireAuth, async (req: AuthRequest, res) => {
  let sessionToken = req.cookies?.corevia_session;
  if (!sessionToken && req.headers.authorization?.startsWith('Bearer ')) {
    sessionToken = req.headers.authorization.substring(7).trim();
  }

  if (sessionToken) {
    await authService.extendSession(sessionToken);
  }

  return res.json({
    status: 'SUCCESS',
    timestamp: new Date().toISOString(),
    user: req.user,
  });
});

/**
 * GET /api/auth/dev-credentials
 * Safe development-only endpoint documenting synthetic test roles for evaluation
 */
apiRouter.get('/auth/dev-credentials', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      error: {
        code: 'PRODUCTION_FORBIDDEN',
        message: 'Development credentials endpoint is strictly disabled in production environments.',
      },
    });
  }

  res.json({
    syntheticTestPassword: DEV_TEST_PASSWORD,
    accounts: [
      {
        role: 'RELATIONSHIP_MANAGER',
        roleTitle: 'Relationship Manager',
        email: 'rm@corevia.bank.in',
        employeeId: 'EMP-RM401',
        name: 'Priya Sharma',
        description: 'Customer 360 portfolio, accounts, lending origination, opportunities',
      },
      {
        role: 'BRANCH_MANAGER',
        roleTitle: 'Branch Manager',
        email: 'branch.manager@corevia.bank.in',
        employeeId: 'EMP-BM104',
        name: 'Aditya Raj',
        description: 'Branch oversight, maker-checker authorization, high-limit approvals',
      },
      {
        role: 'SERVICE_AGENT',
        roleTitle: 'Service Agent',
        email: 'service.agent@corevia.bank.in',
        employeeId: 'EMP-SVC302',
        name: 'Kiran Deshmukh',
        description: 'Service desk, tickets, customer queries, interactions',
      },
      {
        role: 'OPERATIONS',
        roleTitle: 'Operations Officer',
        email: 'operations@corevia.bank.in',
        employeeId: 'EMP-OPS591',
        name: 'Pooja Iyer',
        description: 'Accounts servicing, clearing, transaction execution, product enrollment',
      },
      {
        role: 'ANALYST',
        roleTitle: 'Credit & Risk Analyst',
        email: 'analyst@corevia.bank.in',
        employeeId: 'EMP-ANL771',
        name: 'Rohit Kulkarni',
        description: 'Dynamic CORE score calculations, portfolio risk analytics, insights',
      },
      {
        role: 'ADMINISTRATOR',
        roleTitle: 'System Administrator',
        email: 'admin@corevia.bank.in',
        employeeId: 'EMP-ADM001',
        name: 'Vikramaditya Rao',
        description: 'Full governance, user roles, security auditing, and system configuration',
      },
      {
        role: 'SERVICE_AGENT',
        roleTitle: 'Inactive User (Test Negative Auth)',
        email: 'inactive.user@corevia.bank.in',
        employeeId: 'EMP-INACT99',
        name: 'Suresh Mehta',
        description: 'Status: INACTIVE - Tests account deactivation prevention',
      },
      {
        role: 'OPERATIONS',
        roleTitle: 'Suspended User (Test Negative Auth)',
        email: 'suspended.user@corevia.bank.in',
        employeeId: 'EMP-SUSP88',
        name: 'Anand Verma',
        description: 'Status: SUSPENDED - Tests compliance suspension denial',
      },
    ],
  });
});

// ----------------------------------------------------
// CUSTOMER APIS
// ----------------------------------------------------
apiRouter.get('/customers', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    const { search, riskCategory, status, page, limit } = req.query;
    const pagination = validatePagination(page, limit, 100);

    // If Relationship Manager, enforce assignment scope strictly
    const rmId = req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : undefined;

    const result = await customerService.listCustomers({
      search: search ? sanitizeText(String(search), 100) : undefined,
      riskCategory: riskCategory as string,
      status: status as string,
      rmId,
      page: pagination.page,
      limit: pagination.limit,
    });

    // PII Masking: Mask PAN in customer listings
    const maskedData = result.data.map((c: any) => ({
      ...c,
      panNumber: maskPAN(c.panNumber),
    }));

    res.json({
      ...result,
      data: maskedData,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    const customer = await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ', req.requestId);
    res.json({
      ...customer,
      panNumber: maskPAN(customer.panNumber),
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/360', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'VIEW_360', req.requestId);
    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const data360 = await customerService.getCustomer360(req.params.id, actorContext);
    
    // Mask sensitive financial identifiers in 360 view
    if (data360.customer) {
      data360.customer.panNumber = maskPAN(data360.customer.panNumber);
    }
    if (Array.isArray(data360.accounts)) {
      data360.accounts = data360.accounts.map((acc: any) => ({
        ...acc,
        accountNumber: maskAccountNumber(acc.accountNumber),
      }));
    }

    res.json(data360);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/accounts', requireAuth, requirePermission('account:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_ACCOUNTS', req.requestId);
    const accounts = await customerService.getCustomerAccounts(req.params.id);
    const maskedAccounts = accounts.map((acc: any) => ({
      ...acc,
      accountNumber: maskAccountNumber(acc.accountNumber),
    }));
    res.json(maskedAccounts);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/loans', requireAuth, requirePermission('loan:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_LOANS', req.requestId);
    const loans = await customerService.getCustomerLoans(req.params.id);
    res.json(loans);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/interactions', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_INTERACTIONS', req.requestId);
    const customerId = Number(req.params.id);
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const items = await interactionRepository.findByCustomerId(customerId, limit);
    res.json(items);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/communication-profile', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_COMMUNICATION_PROFILE', req.requestId);
    const customerId = Number(req.params.id);
    const profile = await interactionService.getCustomerCommunicationProfile(customerId);
    res.json(profile);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/engagement-trend', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_ENGAGEMENT_TREND', req.requestId);
    const customerId = Number(req.params.id);
    const timeframe = (req.query.timeframe as any) || '30d';
    const trend = await interactionService.getCustomerEngagementTrend(customerId, timeframe);
    res.json(trend);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/insights', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_INSIGHTS', req.requestId);
    const customerId = Number(req.params.id);
    const insights = await relationshipIntelligenceService.getCustomerInsights(customerId);
    res.json(insights);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/intelligence', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_INSIGHTS', req.requestId);
    const customerId = Number(req.params.id);
    const insights = await relationshipIntelligenceService.getCustomerInsights(customerId);
    res.json(insights);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/customers/:id/intelligence/recalculate', requireAuth, requirePermission('customer:update'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'RECALCULATE_INSIGHTS', req.requestId);
    const customerId = Number(req.params.id);
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const insights = await relationshipIntelligenceService.evaluateCustomer(customerId, actorContext);
    res.json({
      status: 'SUCCESS',
      message: 'Relationship intelligence recalculated successfully.',
      insights,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/customers/:id/next-best-actions
 * Retrieve prioritized, explainable Next Best Actions for a customer
 */
apiRouter.get('/customers/:id/next-best-actions', requireAuth, requirePermission('nba:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_NBA', req.requestId);
    const customerId = Number(req.params.id);
    const actions = await nextBestActionService.getCustomerActions(customerId);
    res.json(actions);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/customers/:id/next-best-actions/recalculate
 * Deterministically evaluate and regenerate Next Best Actions for a customer
 */
apiRouter.post('/customers/:id/next-best-actions/recalculate', requireAuth, requirePermission('nba:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'RECALCULATE_NBA', req.requestId);
    const customerId = Number(req.params.id);
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const actions = await nextBestActionService.evaluateCustomer(customerId, actorContext);
    res.json({
      status: 'SUCCESS',
      message: 'Next Best Actions recalculated successfully.',
      actions,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// TASK APIS & FOLLOWUPS
// ----------------------------------------------------
apiRouter.get('/tasks', requireAuth, requirePermission('task:read'), async (req: AuthRequest, res) => {
  try {
    const { customerId, status, limit } = req.query;
    const customerIdStr = customerId ? String(customerId) : undefined;
    if (customerIdStr) {
      await resourceAuth.authorizeCustomer(req.user!, customerIdStr, 'READ_TASKS', req.requestId);
    }
    const pagination = validatePagination(1, limit, 100);
    const tasks = await taskService.listTasks({
      customerId: customerIdStr ? Number(customerIdStr) : undefined,
      status: status as string,
      assignedToId: req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : undefined,
      limit: pagination.limit,
    });
    res.json(tasks);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/tasks', requireAuth, requirePermission('task:create'), async (req: AuthRequest, res) => {
  try {
    // Mass assignment prevention
    const sanitizedBody = filterAllowlist(req.body, [
      'customerId',
      'assignedToId',
      'title',
      'description',
      'priority',
      'dueDate',
      'category',
      'status',
    ]);

    if (sanitizedBody.customerId) {
      await resourceAuth.authorizeCustomer(req.user!, sanitizedBody.customerId, 'CREATE_TASK', req.requestId);
    }

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const task = await taskService.createTask(sanitizedBody as any, actorContext);
    res.status(201).json(task);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.patch('/tasks/:id', requireAuth, requirePermission('task:update'), async (req: AuthRequest, res) => {
  try {
    const taskId = Number(req.params.id);
    await resourceAuth.authorizeTask(req.user!, taskId, 'UPDATE', req.requestId);

    // Mass assignment prevention
    const sanitizedBody = filterAllowlist(req.body, [
      'title',
      'description',
      'priority',
      'dueDate',
      'status',
      'resolutionNotes',
      'assignedToId',
    ]);

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const updated = await taskService.updateTask(taskId, sanitizedBody, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/followups', requireAuth, requirePermission('task:create'), async (req: AuthRequest, res) => {
  try {
    const sanitizedBody = filterAllowlist(req.body, [
      'customerId',
      'title',
      'description',
      'dueDate',
      'priority',
      'type',
    ]);

    if (sanitizedBody.customerId) {
      await resourceAuth.authorizeCustomer(req.user!, sanitizedBody.customerId, 'CREATE_TASK', req.requestId);
    }

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const followup = await taskService.createFollowup(sanitizedBody as any, actorContext);
    res.status(201).json(followup);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// INTERACTIONS (PHASE 24)
// ----------------------------------------------------
apiRouter.get('/interactions', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    const params = {
      customerId: req.query.customerId ? Number(req.query.customerId) : undefined,
      interactionType: req.query.interactionType as string | undefined,
      channel: req.query.channel as string | undefined,
      outcome: req.query.outcome as string | undefined,
      sentiment: req.query.sentiment as string | undefined,
      ownerId: req.query.ownerId ? Number(req.query.ownerId) : undefined,
      agentId: req.query.agentId ? Number(req.query.agentId) : undefined,
      followupRequired: req.query.followupRequired !== undefined ? req.query.followupRequired === 'true' : undefined,
      search: req.query.search as string | undefined,
      startDate: req.query.startDate as string | undefined,
      endDate: req.query.endDate as string | undefined,
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    if (params.customerId) {
      await resourceAuth.authorizeCustomer(req.user!, params.customerId, 'READ_INTERACTIONS', req.requestId);
    }

    const result = await interactionService.listInteractions(params);
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/interactions/metrics', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const ownerId = req.query.myOnly === 'true' && req.user?.id ? req.user.id : undefined;

    if (customerId) {
      await resourceAuth.authorizeCustomer(req.user!, customerId, 'READ_INTERACTIONS', req.requestId);
    }

    const metrics = await interactionService.getMetrics({ customerId, ownerId });
    res.json(metrics);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/interactions/reference/:ref', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    const item = await interactionService.getInteractionByReference(req.params.ref);
    await resourceAuth.authorizeCustomer(req.user!, item.customerId, 'READ_INTERACTIONS', req.requestId);
    res.json(item);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/interactions/:id', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const item = await interactionService.getInteraction(id);
    await resourceAuth.authorizeCustomer(req.user!, item.customerId, 'READ_INTERACTIONS', req.requestId);
    res.json(item);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/interactions', requireAuth, requirePermission('customer:update'), async (req: AuthRequest, res) => {
  try {
    const sanitizedBody = filterAllowlist(req.body, [
      'customerId',
      'channel',
      'interactionType',
      'subject',
      'summary',
      'outcome',
      'sentiment',
      'ownerId',
      'agentId',
      'duration',
      'participants',
      'followupRequired',
      'followupDate',
      'followupOwnerId',
      'followupAction',
      'followupPriority',
      'followupTaskId',
      'customerCommitment',
      'customerCommitmentTaskId',
      'rmCommitment',
      'rmCommitmentTaskId',
      'linkedOpportunityId',
      'linkedCaseId',
      'linkedTaskId',
      'linkedRelationshipReview',
      'linkedOnboardingId',
      'commitments',
      'links',
      'timestamp',
    ]);

    if (sanitizedBody.customerId) {
      await resourceAuth.authorizeCustomer(req.user!, sanitizedBody.customerId, 'RECORD_INTERACTION', req.requestId);
    }

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      userId: req.user?.id || 3,
      role: req.user?.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const interaction = await interactionService.recordInteraction(sanitizedBody as any, actorContext);
    res.status(201).json(interaction);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.patch('/interactions/:id', requireAuth, requirePermission('customer:update'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await interactionService.getInteraction(id);
    await resourceAuth.authorizeCustomer(req.user!, existing.customerId, 'UPDATE_INTERACTION', req.requestId);

    const sanitizedBody = filterAllowlist(req.body, [
      'channel',
      'interactionType',
      'subject',
      'summary',
      'outcome',
      'sentiment',
      'ownerId',
      'duration',
      'followupRequired',
      'followupDate',
      'followupOwnerId',
      'followupAction',
      'followupPriority',
      'followupTaskId',
      'customerCommitment',
      'customerCommitmentTaskId',
      'rmCommitment',
      'rmCommitmentTaskId',
      'linkedOpportunityId',
      'linkedCaseId',
      'linkedTaskId',
      'linkedRelationshipReview',
      'linkedOnboardingId',
    ]);

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      userId: req.user?.id || 3,
      role: req.user?.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const updated = await interactionService.updateInteraction(id, sanitizedBody as any, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.delete('/interactions/:id', requireAuth, requirePermission('customer:update'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await interactionService.getInteraction(id);
    await resourceAuth.authorizeCustomer(req.user!, existing.customerId, 'DELETE_INTERACTION', req.requestId);

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      userId: req.user?.id || 3,
      role: req.user?.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const success = await interactionService.deleteInteraction(id, actorContext);
    res.json({ success });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/interactions/:id/commitments', requireAuth, requirePermission('customer:update'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await interactionService.getInteraction(id);
    await resourceAuth.authorizeCustomer(req.user!, existing.customerId, 'ADD_COMMITMENT', req.requestId);

    const sanitizedBody = filterAllowlist(req.body, [
      'commitmentType',
      'description',
      'ownerName',
      'dueDate',
      'createTask',
    ]);

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      userId: req.user?.id || 3,
      role: req.user?.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const commitment = await interactionService.addCommitment(id, sanitizedBody as any, actorContext);
    res.status(201).json(commitment);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.patch('/interactions/commitments/:commitmentId', requireAuth, requirePermission('customer:update'), async (req: AuthRequest, res) => {
  try {
    const commitmentId = Number(req.params.commitmentId);
    const sanitizedBody = filterAllowlist(req.body, ['status', 'createdTaskId']);

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      userId: req.user?.id || 3,
      role: req.user?.role,
      requestId: req.requestId || `REQ-${Date.now()}`,
    };

    const result = await interactionService.updateCommitment(commitmentId, sanitizedBody as any, actorContext);
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// OPPORTUNITIES
// ----------------------------------------------------
apiRouter.get('/opportunities', requireAuth, requirePermission('opportunity:read'), async (req: AuthRequest, res) => {
  try {
    const { customerId, stage, limit } = req.query;
    const customerIdStr = customerId ? String(customerId) : undefined;
    if (customerIdStr) {
      await resourceAuth.authorizeCustomer(req.user!, customerIdStr, 'READ_OPPORTUNITIES', req.requestId);
    }
    const pagination = validatePagination(1, limit, 100);
    const list = await opportunityService.listOpportunities({
      customerId: customerIdStr ? Number(customerIdStr) : undefined,
      stage: stage as string,
      assignedToId: req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : undefined,
      limit: pagination.limit,
    });
    res.json(list);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/opportunities/:id', requireAuth, requirePermission('opportunity:read'), async (req: AuthRequest, res) => {
  try {
    const oppId = Number(req.params.id);
    const opp = await resourceAuth.authorizeOpportunity(req.user!, oppId, 'READ', req.requestId);
    res.json(opp);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/opportunities', requireAuth, requirePermission('opportunity:create'), async (req: AuthRequest, res) => {
  try {
    const sanitizedBody = filterAllowlist(req.body, [
      'customerId',
      'productId',
      'title',
      'dealValue',
      'confidenceScore',
      'priority',
      'stage',
      'nextStep',
      'expectedCloseDate',
      'assignedRmId',
    ]);

    if (sanitizedBody.customerId) {
      await resourceAuth.authorizeCustomer(req.user!, sanitizedBody.customerId, 'CREATE_OPPORTUNITY', req.requestId);
    }

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const opp = await opportunityService.createOpportunity(sanitizedBody as any, actorContext);
    res.status(201).json(opp);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.patch('/opportunities/:id', requireAuth, requirePermission('opportunity:update'), async (req: AuthRequest, res) => {
  try {
    const oppId = Number(req.params.id);
    await resourceAuth.authorizeOpportunity(req.user!, oppId, 'UPDATE', req.requestId);

    const sanitizedBody = filterAllowlist(req.body, [
      'title',
      'dealValue',
      'confidenceScore',
      'priority',
      'stage',
      'nextStep',
      'expectedCloseDate',
      'notes',
      'status',
    ]);

    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const updated = await opportunityService.updateOpportunity(oppId, sanitizedBody, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// SERVICE CASES
// ----------------------------------------------------
apiRouter.get('/cases', requireAuth, requirePermission('case:read'), async (req: AuthRequest, res) => {
  try {
    const { customerId, status, priority, page, limit } = req.query;
    const customerIdStr = customerId ? String(customerId) : undefined;
    if (customerIdStr) {
      await resourceAuth.authorizeCustomer(req.user!, customerIdStr, 'READ_CASES', req.requestId);
    }
    const pagination = validatePagination(page, limit, 50);
    const result = await caseService.listCases({
      customerId: customerIdStr ? Number(customerIdStr) : undefined,
      status: status as string,
      priority: priority as string,
      page: pagination.page,
      limit: pagination.limit,
    });
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// ACCOUNTS APIS
// ----------------------------------------------------
apiRouter.get('/accounts', requireAuth, requirePermission('account:read'), async (req: AuthRequest, res) => {
  try {
    const { search, accountType, status, branchCode, customerId, page, limit, sortBy, sortOrder } = req.query;
    const customerIdStr = customerId ? String(customerId) : undefined;
    if (customerIdStr) {
      await resourceAuth.authorizeCustomer(req.user!, customerIdStr, 'READ_ACCOUNTS', req.requestId);
    }
    const pagination = validatePagination(page, limit, 50);
    const result = await accountService.listAccounts({
      search: search ? sanitizeText(String(search), 100) : undefined,
      accountType: accountType as string,
      status: status as string,
      branchCode: branchCode as string,
      customerId: customerIdStr ? Number(customerIdStr) : undefined,
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });

    // PII Masking for account numbers
    const maskedData = result.data.map((acc: any) => ({
      ...acc,
      accountNumber: maskAccountNumber(acc.accountNumber),
    }));

    res.json({
      ...result,
      data: maskedData,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/accounts/stats', requireAuth, requirePermission('account:read'), async (req: AuthRequest, res) => {
  try {
    const stats = await accountService.getSummaryStats();
    res.json(stats);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/accounts/:id', requireAuth, requirePermission('account:read'), async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const account = await accountService.getAccountById(req.params.id, actorContext);
    if (!account) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Account not found.' } });
    }

    // Verify access to customer account
    if (account.customerId) {
      await resourceAuth.authorizeCustomer(req.user!, account.customerId, 'READ_ACCOUNTS', req.requestId);
    }

    res.json({
      ...account,
      accountNumber: maskAccountNumber(account.accountNumber),
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/accounts/:id/transactions', requireAuth, requirePermission('account:read'), async (req: AuthRequest, res) => {
  try {
    const { page, limit, type, status } = req.query;
    const pagination = validatePagination(page, limit, 50);
    const result = await accountService.getAccountTransactions(req.params.id, {
      page: pagination.page,
      limit: pagination.limit,
      type: type as string,
      status: status as string,
    });
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// LOANS APIS
// ----------------------------------------------------
apiRouter.get('/loans', requireAuth, requirePermission('loan:read'), async (req: AuthRequest, res) => {
  try {
    const { search, loanType, assetClassification, customerId, rmId, page, limit, sortBy, sortOrder } = req.query;
    const customerIdStr = customerId ? String(customerId) : undefined;
    if (customerIdStr) {
      await resourceAuth.authorizeCustomer(req.user!, customerIdStr, 'READ_LOANS', req.requestId);
    }
    const pagination = validatePagination(page, limit, 50);
    const result = await loanService.listLoans({
      search: search ? sanitizeText(String(search), 100) : undefined,
      loanType: loanType as string,
      assetClassification: assetClassification as string,
      customerId: customerIdStr ? Number(customerIdStr) : undefined,
      rmId: req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : (rmId ? Number(rmId) : undefined),
      page: pagination.page,
      limit: pagination.limit,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/loans/stats', requireAuth, requirePermission('loan:read'), async (req: AuthRequest, res) => {
  try {
    const stats = await loanService.getSummaryStats();
    res.json(stats);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/loans/:id', requireAuth, requirePermission('loan:read'), async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      actorId: req.user?.employeeId || 'EMP-782194',
      actorName: req.user?.name || 'Bank Officer',
      requestId: req.requestId || `REQ-${Date.now()}`,
    };
    const loan = await loanService.getLoanById(req.params.id, actorContext);
    if (!loan) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Loan not found.' } });
    }

    if (loan.customerId) {
      await resourceAuth.authorizeCustomer(req.user!, loan.customerId, 'READ_LOANS', req.requestId);
    }

    res.json(loan);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/loans/:id/repayments', requireAuth, requirePermission('loan:read'), async (req: AuthRequest, res) => {
  try {
    const { page, limit } = req.query;
    const pagination = validatePagination(page, limit, 50);
    const result = await loanService.getLoanRepayments(req.params.id, {
      page: pagination.page,
      limit: pagination.limit,
    });
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// BANKING PRODUCTS APIS
// ----------------------------------------------------
apiRouter.get('/products', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { search, category, isActive } = req.query;
    const result = await productService.listProducts({
      search: search as string,
      category: category as string,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/products/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json(product);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.get('/customers/:id/products', requireAuth, requirePermission('account:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_PRODUCTS', req.requestId);
    const customerProducts = await productService.getCustomerProducts(req.params.id);
    res.json(customerProducts);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/customers/:id/products', requireAuth, requirePermission('account:create'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'ENROLL_PRODUCT', req.requestId);
    const { productId, accountId } = req.body;
    const enrollment = await productService.enrollCustomerProduct(req.params.id, productId, accountId);
    res.status(201).json(enrollment);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// FINANCIAL RELATIONSHIP & INTELLIGENCE APIS
// ----------------------------------------------------
apiRouter.get('/customers/:id/financial-summary', requireAuth, requirePermission('customer:read'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'READ_FINANCIAL_SUMMARY', req.requestId);
    const summary = await financialRelationshipService.getCustomerFinancialSummary(req.params.id);
    res.json(summary);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

apiRouter.post('/customers/:id/recalculate-core-score', requireAuth, requirePermission('customer:update'), async (req: AuthRequest, res) => {
  try {
    await resourceAuth.authorizeCustomer(req.user!, req.params.id, 'RECALCULATE_CORE_SCORE', req.requestId);
    const summary = await financialRelationshipService.recalculateAndSyncCoreScore(req.params.id);
    res.json({
      status: 'SUCCESS',
      message: 'CORE Relationship Score dynamically recalculated and updated in PostgreSQL.',
      summary,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// GLOBAL SEARCH API (Customers, Accounts, Loans, Products)
// ----------------------------------------------------
apiRouter.get('/search', requireAuth, async (req: AuthRequest, res) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    const query = sanitizeText(rawQuery, 100);
    if (!query) {
      return res.json({ customers: [], accounts: [], loans: [], products: [], onboarding: [] });
    }

    const [customerResults, accountResults, loanResults, productResults, onboardingResults] = await Promise.all([
      customerService.listCustomers({
        search: query,
        rmId: req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : undefined,
        limit: 5,
      }),
      accountService.listAccounts({
        search: query,
        limit: 5,
      }),
      loanService.listLoans({
        search: query,
        rmId: req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : undefined,
        limit: 5,
      }),
      productService.listProducts({ search: query }),
      onboardingService.listApplications(
        { search: query, limit: 5 },
        { id: req.user!.id, name: req.user!.name, role: req.user!.role, requestId: req.requestId }
      ),
    ]);

    // Mask PII in returned search records
    const maskedCustomers = customerResults.data.map((c: any) => ({
      ...c,
      panNumber: maskPAN(c.panNumber),
    }));

    const maskedAccounts = accountResults.data.map((a: any) => ({
      ...a,
      accountNumber: maskAccountNumber(a.accountNumber),
    }));

    res.json({
      customers: maskedCustomers,
      accounts: maskedAccounts,
      loans: loanResults.data,
      products: productResults.slice(0, 5),
      onboarding: onboardingResults.data,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
apiRouter.get('/audit-logs', requireAuth, requireRole('ADMINISTRATOR', 'COMPLIANCE_OFFICER'), async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 20);
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);
    res.json(logs);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// PHASE 10: RELATIONSHIP INTELLIGENCE ENGINE APIS
// ----------------------------------------------------

/**
 * GET /api/intelligence
 * List relationship signals and explainable intelligence with filtering and search
 */
apiRouter.get('/intelligence', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { customerId, category, priority, status, search, assignedRm, page, limit } = req.query;
    const result = await relationshipIntelligenceService.listInsights({
      customerId: customerId ? Number(customerId) : undefined,
      category: category as string,
      priority: priority as string,
      status: status as string,
      search: search as string,
      assignedRm: assignedRm as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/intelligence/summary
 * Returns relationship intelligence queue metrics and executive summary
 */
apiRouter.get('/intelligence/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const summary = await relationshipIntelligenceService.getSummary();
    res.json(summary);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/intelligence/recalculate-all
 * Batch recalculates relationship intelligence across the customer base
 */
apiRouter.post('/intelligence/recalculate-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
    };
    const stats = await relationshipIntelligenceService.recalculateAll(actorContext);
    res.json({
      status: 'SUCCESS',
      message: 'Batch relationship intelligence recalculation completed.',
      ...stats,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/intelligence/:id
 * Retrieve a specific insight with structured evidence records
 */
apiRouter.get('/intelligence/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const insight = await relationshipIntelligenceService.getInsightById(Number(req.params.id));
    res.json(insight);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/intelligence/:id/acknowledge
 * Officer acknowledges insight for follow-up
 */
apiRouter.post('/intelligence/:id/acknowledge', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
    };
    const note = req.body?.note;
    const updated = await relationshipIntelligenceService.acknowledgeInsight(
      Number(req.params.id),
      actorContext,
      note
    );
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/intelligence/:id/resolve
 * Officer resolves insight with resolution note
 */
apiRouter.post('/intelligence/:id/resolve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
    };
    const note = req.body?.note;
    const updated = await relationshipIntelligenceService.resolveInsight(
      Number(req.params.id),
      actorContext,
      note
    );
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// PHASE 11: NEXT BEST ACTION ENGINE APIS
// ----------------------------------------------------

/**
 * GET /api/next-best-actions
 * List and filter Next Best Actions across RM portfolio with status, priority, and type filters
 */
apiRouter.get('/next-best-actions', requireAuth, requirePermission('nba:read'), async (req: AuthRequest, res) => {
  try {
    const { customerId, assignedRmId, actionType, priority, urgency, status, search, page, limit } = req.query;
    const result = await nextBestActionService.listActions({
      customerId: customerId ? Number(customerId) : undefined,
      assignedRmId: assignedRmId ? Number(assignedRmId) : (req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : undefined),
      actionType: actionType as string,
      priority: priority as string,
      urgency: urgency as string,
      status: status as string,
      search: search as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/next-best-actions/brief
 * Returns the Daily Relationship Brief for the logged-in RM (or branch portfolio)
 */
apiRouter.get('/next-best-actions/brief', requireAuth, requirePermission('nba:read'), async (req: AuthRequest, res) => {
  try {
    const assignedRmId = req.user?.role === 'RELATIONSHIP_MANAGER' ? req.user.id : undefined;
    const brief = await nextBestActionService.getDailyRelationshipBrief(assignedRmId);
    res.json(brief);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/next-best-actions/recalculate-all
 * Batch recalculates Next Best Actions across all customers in the database
 */
apiRouter.post('/next-best-actions/recalculate-all', requireAuth, requirePermission('nba:read'), async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const stats = await nextBestActionService.recalculateAll(actorContext);
    res.json({
      status: 'SUCCESS',
      message: 'Next Best Actions batch evaluation completed.',
      ...stats,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/next-best-actions/:id
 * Retrieve a specific action with normalized evidence records
 */
apiRouter.get('/next-best-actions/:id', requireAuth, requirePermission('nba:read'), async (req: AuthRequest, res) => {
  try {
    const action = await nextBestActionService.getActionById(Number(req.params.id));
    res.json(action);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/next-best-actions/:id/accept
 * Officer accepts a recommendation
 */
apiRouter.post('/next-best-actions/:id/accept', requireAuth, requirePermission('nba:accept'), async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const updated = await nextBestActionService.acceptAction(Number(req.params.id), actorContext);
    res.json({
      status: 'SUCCESS',
      message: 'Recommendation accepted.',
      action: updated,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/next-best-actions/:id/dismiss
 * Officer dismisses a recommendation with mandatory reason
 */
apiRouter.post('/next-best-actions/:id/dismiss', requireAuth, requirePermission('nba:dismiss'), async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const reason = req.body?.reason;
    const updated = await nextBestActionService.dismissAction(Number(req.params.id), actorContext, reason);
    res.json({
      status: 'SUCCESS',
      message: 'Recommendation dismissed.',
      action: updated,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/next-best-actions/:id/create-task
 * Converts a Next Best Action directly into an institutional Task
 */
apiRouter.post('/next-best-actions/:id/create-task', requireAuth, requirePermission('nba:create-task'), async (req: AuthRequest, res) => {
  try {
    const actorContext = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const result = await nextBestActionService.createTaskFromAction(
      Number(req.params.id),
      actorContext,
      req.body
    );
    res.json({
      status: 'SUCCESS',
      message: 'Task created successfully from Next Best Action.',
      ...result,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// PHASE 12: CUSTOMER OPPORTUNITY RADAR APIS
// ----------------------------------------------------

/**
 * GET /api/opportunity-radar
 * List deterministic radar signals with search, filtering, and pagination
 */
apiRouter.get('/opportunity-radar', requireAuth, requirePermission('radar:read'), async (req: AuthRequest, res) => {
  try {
    const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;
    const isRM = req.user?.role === 'RELATIONSHIP_MANAGER';
    const assignedRmId = isRM ? req.user!.id : (req.query.assignedRmId ? Number(req.query.assignedRmId) : undefined);
    const category = req.query.category as string | undefined;
    const priority = req.query.priority as string | undefined;
    const status = req.query.status as string | undefined;
    const signalType = req.query.signalType as string | undefined;
    const search = req.query.search as string | undefined;
    const sortBy = req.query.sortBy as any;
    const sortOrder = req.query.sortOrder as any;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const result = await opportunityRadarService.listSignals({
      customerId,
      assignedRmId,
      category,
      priority,
      status,
      signalType,
      search: search ? sanitizeText(search, 100) : undefined,
      sortBy,
      sortOrder,
      page,
      limit,
    });

    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/opportunity-radar/stats
 * Summary statistics for the Opportunity Radar Dashboard
 */
apiRouter.get('/opportunity-radar/stats', requireAuth, requirePermission('radar:read'), async (req: AuthRequest, res) => {
  try {
    const isRM = req.user?.role === 'RELATIONSHIP_MANAGER';
    const assignedRmId = isRM ? req.user!.id : (req.query.assignedRmId ? Number(req.query.assignedRmId) : undefined);
    const stats = await opportunityRadarService.getSummaryStats(assignedRmId);
    res.json(stats);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/opportunity-radar/:id
 * Retrieve single radar signal with deep normalized evidence records
 */
apiRouter.get('/opportunity-radar/:id', requireAuth, requirePermission('radar:read'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const signal = await opportunityRadarService.getSignalById(id);
    res.json(signal);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/opportunity-radar/recalculate-all
 * Batch recalculate radar signals for all customers
 */
apiRouter.post('/opportunity-radar/recalculate-all', requireAuth, requirePermission('radar:read'), async (req: AuthRequest, res) => {
  try {
    const actor = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const result = await opportunityRadarService.recalculateAll(actor);
    res.json({
      success: true,
      message: `Opportunity Radar evaluated across ${result.processed} customer portfolios (${result.generated} active signals generated).`,
      ...result,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/opportunity-radar/customer/:cif/recalculate
 * Deterministically evaluate radar signals for single customer
 */
apiRouter.post('/opportunity-radar/customer/:cif/recalculate', requireAuth, requirePermission('radar:read'), async (req: AuthRequest, res) => {
  try {
    const cif = req.params.cif;
    const customer = await customerService.getCustomerById(cif);
    await resourceAuth.authorizeCustomer(req.user!, customer.id, 'RECALCULATE_RADAR', req.requestId);
    const actor = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const signals = await opportunityRadarService.evaluateCustomer(customer.id, actor);
    res.json({
      success: true,
      customerId: customer.id,
      cifNumber: customer.cifNumber,
      signals,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/opportunity-radar/:id/review
 * Mark signal as reviewed by relationship officer
 */
apiRouter.post('/opportunity-radar/:id/review', requireAuth, requirePermission('radar:review'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const actor = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const updated = await opportunityRadarService.markReviewed(id, actor);
    res.json({
      success: true,
      message: 'Radar signal marked as reviewed.',
      signal: updated,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/opportunity-radar/:id/convert
 * Convert radar signal into a formal pipeline opportunity
 */
apiRouter.post('/opportunity-radar/:id/convert', requireAuth, requirePermission('radar:convert'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const actor = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const { title, stage, expectedValue, probability, expectedCloseDate, notes } = req.body;
    const result = await opportunityRadarService.convertToOpportunity(id, actor, {
      title,
      stage,
      expectedValue,
      probability,
      expectedCloseDate,
      notes,
    });
    res.json({
      success: true,
      message: `Radar signal converted into Opportunity ${result.opportunity.opportunityCode}.`,
      ...result,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/opportunity-radar/:id/dismiss
 * Dismiss radar signal with audit-required reason
 */
apiRouter.post('/opportunity-radar/:id/dismiss', requireAuth, requirePermission('radar:dismiss'), async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const { reason } = req.body;
    const actor = {
      id: req.user?.id,
      employeeId: req.user?.employeeId,
      name: req.user?.name,
      email: req.user?.email,
      requestId: req.requestId,
    };
    const updated = await opportunityRadarService.dismissSignal(id, actor, reason);
    res.json({
      success: true,
      message: 'Radar signal dismissed and audit-logged.',
      signal: updated,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// FOREX & CROSS-BORDER CONVERSION APIS
// ----------------------------------------------------

/**
 * GET /api/forex/rates
 * Returns live/daily reference Forex conversion rates with FEDAI Card spreads
 */
apiRouter.get('/forex/rates', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const rates = await forexService.fetchLiveRates(forceRefresh);
    res.json(rates);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, `REQ-FX-${Date.now()}`);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/forex/convert
 * Calculates cross-border settlement with FEDAI spread, GST Rule 32(2), and cash margin
 */
apiRouter.post('/forex/convert', async (req, res) => {
  try {
    const {
      fromCurrency = 'USD',
      toCurrency = 'INR',
      amount = 10000,
      settlementType = 'TT_SELLING',
      tradeInstrument,
      cashMarginPercentage,
    } = req.body;

    const result = await forexService.calculateConversion({
      fromCurrency: String(fromCurrency),
      toCurrency: String(toCurrency),
      amount: Number(amount) || 0,
      settlementType,
      tradeInstrument,
      cashMarginPercentage: cashMarginPercentage ? Number(cashMarginPercentage) : undefined,
    });

    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, `REQ-FX-CONV-${Date.now()}`);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// AI ASSISTANT & MARKET / MUTUAL FUND ENDPOINTS
// ----------------------------------------------------

/**
 * POST /api/ai/chat
 * Answers banking, treasury, currency, loan, and mutual fund/SIP queries using Gemini 3.8 Flash
 */
apiRouter.post('/ai/chat', async (req, res) => {
  try {
    const { prompt, history, context } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const response = await aiService.askAssistant({
      prompt: prompt.trim(),
      history: Array.isArray(history) ? history : [],
      context: context ? String(context) : undefined,
    });

    res.json(response);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, `REQ-AI-${Date.now()}`);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/market/news
 * Fetches latest daily financial and treasury news headlines
 */
apiRouter.get('/market/news', (req, res) => {
  try {
    const { category } = req.query;
    const news = marketNewsService.getLatestHeadlines(category ? String(category) : undefined);
    res.json({
      headlines: news,
      lastUpdated: new Date().toISOString(),
      total: news.length,
    });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, `REQ-NEWS-${Date.now()}`);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/market/sip-stats
 * Returns latest AMFI Mutual Fund and SIP industry data
 */
apiRouter.get('/market/sip-stats', (req, res) => {
  try {
    const stats = marketNewsService.getAmfiStatistics();
    res.json(stats);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, `REQ-SIP-${Date.now()}`);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/market/sip-calculate
 * Calculates SIP compounding returns and wealth multiplier
 */
apiRouter.post('/market/sip-calculate', (req, res) => {
  try {
    const {
      monthlyInvestment = 10000,
      annualReturnRate = 12.5,
      tenureYears = 10,
    } = req.body;

    const projection = marketNewsService.calculateSipProjection(
      Number(monthlyInvestment) || 10000,
      Number(annualReturnRate) || 12.5,
      Number(tenureYears) || 10
    );

    res.json(projection);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, `REQ-SIP-CALC-${Date.now()}`);
    res.status(statusCode).json(body);
  }
});

// ----------------------------------------------------
// PHASE 14: GEMINI BANKING COPILOT APIS
// ----------------------------------------------------

/**
 * POST /api/copilot/chat
 * Primary context-aware Banking CRM conversation endpoint
 */
apiRouter.post('/copilot/chat', requireAuth, copilotRateLimiter, async (req: AuthRequest, res) => {
  try {
    const rawMessage = req.body.message || (Array.isArray(req.body.messages) ? req.body.messages[req.body.messages.length - 1]?.content : undefined);
    const message = typeof rawMessage === 'string' ? rawMessage.trim() : '';
    const conversation_id = req.body.conversation_id || req.body.conversationId;
    const context_type = req.body.context_type || req.body.context?.type;
    const context_id = req.body.context_id || req.body.context?.code || (req.body.context?.id ? String(req.body.context?.id) : undefined);
    const history = req.body.history || (Array.isArray(req.body.messages) ? req.body.messages.slice(0, -1) : undefined);

    if (!message) {
      return res.status(400).json({ error: 'Message content is required.' });
    }

    const response = await copilotService.processChat(
      {
        conversation_id,
        message,
        context_type,
        context_id,
        history,
      },
      {
        id: req.user!.id,
        name: req.user!.name,
        employeeId: req.user!.employeeId,
        role: req.user!.role,
        department: req.user!.department,
        permissions: req.user!.permissions || [],
      },
      req.requestId
    );

    res.json(response);
  } catch (err: any) {
    await auditRepository.createLog({
      actorId: String(req.user?.id || 0),
      actorName: req.user?.name || 'UNKNOWN',
      action: 'COPILOT_ERROR',
      resourceType: 'COPILOT_API',
      resourceId: req.body?.conversation_id || 'UNKNOWN',
      requestId: req.requestId,
      outcome: 'FAILURE',
      metadata: { error: err?.message || String(err) },
    });
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/copilot/actions/:id/confirm
 * Explicit user confirmation of a proposed Copilot action
 */
apiRouter.post('/copilot/actions/:id/confirm', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actionId = req.params.id;
    const pendingAction = pendingActionService.validateAndConsume(actionId, req.user!.id);

    let createdEntity: any = null;

    if (pendingAction.actionType === 'CREATE_TASK' || pendingAction.actionType === 'CREATE_FOLLOWUP') {
      const task = await taskService.createTask(
        {
          customerId: pendingAction.payload.customerId,
          title: pendingAction.payload.title,
          description: pendingAction.payload.description || pendingAction.payload.notes || 'Created via Banking Copilot',
          dueDate: pendingAction.payload.dueDate,
          priority: pendingAction.payload.priority || 'MEDIUM',
          assignedToId: req.user!.id,
          relatedType: 'CUSTOMER',
          relatedId: pendingAction.payload.customerId,
        },
        {
          actorId: String(req.user!.id),
          actorName: req.user!.name,
          requestId: req.requestId,
        }
      );
      createdEntity = { entityType: 'TASK', entityId: `TASK-${task.id}`, entity: task };
    } else if (pendingAction.actionType === 'CREATE_OPPORTUNITY') {
      const opp = await opportunityService.createOpportunity(
        {
          customerId: pendingAction.payload.customerId,
          title: pendingAction.payload.title,
          expectedValue: pendingAction.payload.expectedValue,
          stage: pendingAction.payload.stage || 'PROSPECT',
          probability: pendingAction.payload.probability || 50,
          assignedToId: req.user!.id,
        },
        {
          actorId: String(req.user!.id),
          actorName: req.user!.name,
          requestId: req.requestId,
        }
      );
      createdEntity = { entityType: 'OPPORTUNITY', entityId: opp.opportunityCode, entity: opp };
    } else if (pendingAction.actionType === 'UPDATE_CASE') {
      const updated = await caseService.updateCase(
        pendingAction.payload.caseId,
        {
          status: pendingAction.payload.status,
          priority: pendingAction.payload.priority,
          resolutionSummary: pendingAction.payload.resolutionSummary,
        },
        {
          actorId: String(req.user!.id),
          actorName: req.user!.name,
          requestId: req.requestId,
        }
      );
      createdEntity = { entityType: 'CASE', entityId: updated.caseNumber, entity: updated };
    } else if (pendingAction.actionType === 'ACKNOWLEDGE_NOTIFICATION') {
      const notifId = Number(pendingAction.payload.notificationId);
      await notificationService.acknowledge(notifId, req.user!.id, {
        userId: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        requestId: req.requestId,
      });
      createdEntity = { entityType: 'NOTIFICATION', entityId: String(notifId), entity: { id: notifId, status: 'ACKNOWLEDGED' } };
    } else if (pendingAction.actionType === 'DISMISS_NOTIFICATION') {
      const notifId = Number(pendingAction.payload.notificationId);
      await notificationService.dismiss(notifId, req.user!.id, {
        userId: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
        requestId: req.requestId,
      });
      createdEntity = { entityType: 'NOTIFICATION', entityId: String(notifId), entity: { id: notifId, status: 'DISMISSED' } };
    } else if (pendingAction.actionType === 'VERIFY_DOCUMENT') {
      const docId = Number(pendingAction.payload.documentId);
      const updated = await documentService.verifyDocument(
        docId,
        pendingAction.payload.comments || 'Verified via Copilot Action confirmation',
        {
          userId: req.user!.id,
          userName: req.user!.name,
          role: req.user!.role,
          requestId: req.requestId || `REQ-${Date.now()}`,
        }
      );
      createdEntity = { entityType: 'DOCUMENT', entityId: updated.documentCode, entity: updated };
    } else if (pendingAction.actionType === 'REJECT_DOCUMENT') {
      const docId = Number(pendingAction.payload.documentId);
      const updated = await documentService.rejectDocument(
        docId,
        {
          reason: pendingAction.payload.reason,
          createTask: true,
        },
        {
          userId: req.user!.id,
          userName: req.user!.name,
          role: req.user!.role,
          requestId: req.requestId || `REQ-${Date.now()}`,
        }
      );
      createdEntity = { entityType: 'DOCUMENT', entityId: updated.documentCode, entity: updated };
    } else if (pendingAction.actionType === 'REQUEST_DOCUMENT_REPLACEMENT') {
      const docId = Number(pendingAction.payload.documentId);
      const updated = await documentService.requestReplacement(
        docId,
        {
          reason: pendingAction.payload.reason,
          requestedDocType: pendingAction.payload.requestedDocType,
          dueDate: pendingAction.payload.dueDate,
        },
        {
          userId: req.user!.id,
          userName: req.user!.name,
          role: req.user!.role,
          requestId: req.requestId || `REQ-${Date.now()}`,
        }
      );
      createdEntity = { entityType: 'DOCUMENT', entityId: updated.documentCode, entity: updated };
    }

    await auditRepository.createLog({
      actorId: String(req.user!.id),
      actorName: req.user!.name,
      action: 'COPILOT_ACTION_CONFIRMED',
      resourceType: 'COPILOT_PENDING_ACTION',
      resourceId: actionId,
      requestId: req.requestId,
      outcome: 'SUCCESS',
      metadata: {
        actionType: pendingAction.actionType,
        createdEntity,
      },
    });

    await auditRepository.createLog({
      actorId: String(req.user!.id),
      actorName: req.user!.name,
      action: 'COPILOT_ACTION_COMPLETED',
      resourceType: createdEntity?.entityType || 'COPILOT_ENTITY',
      resourceId: createdEntity?.entityId || actionId,
      requestId: req.requestId,
      outcome: 'SUCCESS',
      metadata: {
        actionId,
        createdEntity,
      },
    });

    res.json({
      success: true,
      message: `${createdEntity?.entityType === 'TASK' ? 'Task' : 'Action'} confirmed and executed successfully.`,
      actionId,
      status: 'CONFIRMED',
      entityType: createdEntity?.entityType,
      entityId: createdEntity?.entityId,
      entity: createdEntity?.entity,
    });
  } catch (err: any) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/copilot/actions/:id/cancel
 * Explicit cancellation of a proposed action
 */
apiRouter.post('/copilot/actions/:id/cancel', requireAuth, async (req: AuthRequest, res) => {
  try {
    const actionId = req.params.id;
    const cancelled = pendingActionService.cancelAction(actionId, req.user!.id);

    await auditRepository.createLog({
      actorId: String(req.user!.id),
      actorName: req.user!.name,
      action: 'COPILOT_ACTION_REJECTED',
      resourceType: 'COPILOT_PENDING_ACTION',
      resourceId: actionId,
      requestId: req.requestId,
      outcome: 'SUCCESS',
      metadata: {
        actionType: cancelled.actionType,
        reason: 'User explicitly rejected or cancelled proposal in UI',
      },
    });

    res.json({
      success: true,
      message: 'Action proposal cancelled. No changes were made.',
      actionId,
      status: 'CANCELLED',
    });
  } catch (err: any) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/copilot/actions/:id
 * Status of a pending action
 */
apiRouter.get('/copilot/actions/:id', requireAuth, (req: AuthRequest, res) => {
  const action = pendingActionService.getPendingAction(req.params.id);
  if (!action) {
    return res.status(404).json({ error: 'Action not found.' });
  }
  res.json(action);
});

// ----------------------------------------------------
// PHASE 15: NOTIFICATIONS & INTELLIGENT ALERTS APIS
// ----------------------------------------------------

/**
 * GET /api/notifications
 * List notifications for the authenticated user with multi-dimensional filtering and pagination
 */
apiRouter.get('/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { status, category, severity, notificationType, customerId, page, limit } = req.query;
    const userId = req.user!.id;

    const result = await notificationService.getUserNotifications(userId, {
      status: status as any,
      category: category as any,
      severity: severity as any,
      notificationType: notificationType as any,
      customerId: customerId ? Number(customerId) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 25,
    });

    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/notifications/unread-count
 * Returns unread notification count for authenticated user
 */
apiRouter.get('/notifications/unread-count', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/notifications/summary
 * Returns aggregated metrics by severity, status, and category
 */
apiRouter.get('/notifications/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const summary = await notificationService.getSummaryStats(userId);
    res.json(summary);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/notifications/:id/read
 * Mark notification as read
 */
apiRouter.post('/notifications/:id/read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.id;
    const actorContext = {
      userId,
      name: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId,
    };

    const success = await notificationService.markAsRead(id, userId, actorContext);
    if (!success) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found or access denied.' } });
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all unread notifications as read for current user
 */
apiRouter.post('/notifications/mark-all-read', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const actorContext = {
      userId,
      name: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId,
    };

    const count = await notificationService.markAllAsRead(userId, actorContext);
    res.json({ success: true, count, message: `${count} notifications marked as read.` });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/notifications/:id/acknowledge
 * Acknowledge an alert (critical/warning workflow)
 */
apiRouter.post('/notifications/:id/acknowledge', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.id;
    const actorContext = {
      userId,
      name: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId,
    };

    const success = await notificationService.acknowledge(id, userId, actorContext);
    if (!success) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found or access denied.' } });
    }

    res.json({ success: true, message: 'Alert acknowledged.' });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/notifications/:id/dismiss
 * Dismiss an alert
 */
apiRouter.post('/notifications/:id/dismiss', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user!.id;
    const actorContext = {
      userId,
      name: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId,
    };

    const success = await notificationService.dismiss(id, userId, actorContext);
    if (!success) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Notification not found or access denied.' } });
    }

    res.json({ success: true, message: 'Alert dismissed.' });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/notifications/preferences
 * Get notification category preferences for current user
 */
apiRouter.get('/notifications/preferences', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const prefs = await notificationService.getUserPreferences(userId);
    res.json(prefs);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PUT /api/notifications/preferences
 * Update user notification preferences
 */
apiRouter.put('/notifications/preferences', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const actorContext = {
      userId,
      name: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId,
    };

    const updated = await notificationService.updateUserPreferences(userId, req.body, actorContext);
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/notifications/sync
 * Scan operational pipeline (tasks, cases, radar, score changes) and synchronize alerts
 */
apiRouter.post('/notifications/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const actorContext = {
      userId,
      name: req.user!.name,
      role: req.user!.role,
      requestId: req.requestId,
    };

    await notificationRuleService.runOperationalScan(userId, actorContext);
    const summary = await notificationService.getSummaryStats(userId);
    res.json({ success: true, summary, message: 'Operational alerts synchronized.' });
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// =========================================================================
// PHASE 16: ADVANCED ANALYTICS & MANAGEMENT INTELLIGENCE ENDPOINTS
// =========================================================================

function extractAnalyticsFilter(req: AuthRequest) {
  const q = req.query;
  const isRM = req.user?.role === 'RELATIONSHIP_MANAGER';
  return {
    period: q.period as any,
    startDate: q.startDate as string,
    endDate: q.endDate as string,
    branch: q.branch as string,
    rmId: isRM ? req.user!.id : (q.rmId ? Number(q.rmId) : undefined),
    segment: q.segment as string,
    status: q.status as string,
    scoreBand: q.scoreBand as string,
    momentum: q.momentum as any,
    productCount: q.productCount as string,
    oppStage: q.oppStage as string,
    oppPriority: q.oppPriority as string,
    oppProductId: q.oppProductId ? Number(q.oppProductId) : undefined,
    caseStatus: q.caseStatus as string,
    casePriority: q.casePriority as string,
    caseSlaState: q.caseSlaState as string,
  };
}

function getAuditUser(req: AuthRequest) {
  return {
    userId: req.user!.id,
    employeeId: req.user!.employeeId,
    name: req.user!.name,
    role: req.user!.role,
    ipAddress: req.ip,
  };
}

/**
 * GET /api/analytics/overview
 * Executive Overview with 10 KPIs, comparisons, and deltas
 */
apiRouter.get('/analytics/overview', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const overview = await analyticsService.getExecutiveOverview(filter, user);
    res.json(overview);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/portfolio
 * Relationship Portfolio analytics with breakdowns (Segment, Branch, RM, Score Band, Momentum)
 */
apiRouter.get('/analytics/portfolio', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const portfolio = await analyticsService.getRelationshipPortfolio(filter, user);
    res.json(portfolio);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/health
 * Customer Health distribution, score movement, and needs-attention list
 */
apiRouter.get('/analytics/health', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const health = await analyticsService.getCustomerHealth(filter, user);
    res.json(health);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/core-score-trends
 * Deterministic CORE score trends from persisted historical snapshots
 */
apiRouter.get('/analytics/core-score-trends', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const trends = await analyticsService.getCoreScoreTrends(filter, user);
    res.json(trends);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/opportunities
 * Opportunity performance, pipeline funnel, and velocity
 */
apiRouter.get('/analytics/opportunities', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const opps = await analyticsService.getOpportunityAnalytics(filter, user);
    res.json(opps);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/service-performance
 * Service desk performance, SLA adherence, and resolution velocity
 */
apiRouter.get('/analytics/service-performance', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const service = await analyticsService.getServicePerformance(filter, user);
    res.json(service);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/rm-productivity
 * Relationship Manager operational workload and capacity metrics
 */
apiRouter.get('/analytics/rm-productivity', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const rm = await analyticsService.getRmProductivity(filter, user);
    res.json(rm);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/product-penetration
 * Product catalog penetration and relationship depth (0, 1, 2, 3, 4+ products)
 */
apiRouter.get('/analytics/product-penetration', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const prods = await analyticsService.getProductPenetration(filter, user);
    res.json(prods);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/engagement
 * Client interaction volume across branch, visits, phone, net banking
 */
apiRouter.get('/analytics/engagement', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const engagement = await analyticsService.getEngagementAnalytics(filter, user);
    res.json(engagement);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/tasks
 * Officer task lifecycle, overdue tracking, and aging buckets
 */
apiRouter.get('/analytics/tasks', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const tasksData = await analyticsService.getTaskAnalytics(filter, user);
    res.json(tasksData);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/intelligence
 * Relationship intelligence, Next Best Action, and Opportunity Radar operational volume
 */
apiRouter.get('/analytics/intelligence', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const intelligence = await analyticsService.getIntelligenceAnalytics(filter, user);
    res.json(intelligence);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/what-changed
 * "What Changed?" comparison engine between current period and prior period
 */
apiRouter.get('/analytics/what-changed', requireAuth, requirePermission('analytics:read'), async (req: AuthRequest, res) => {
  try {
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);
    const changed = await analyticsService.getWhatChanged(filter, user);
    res.json(changed);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/analytics/export
 * Export analytical table data to CSV format
 */
apiRouter.get('/analytics/export', requireAuth, requirePermission('analytics:export'), exportRateLimiter, async (req: AuthRequest, res) => {
  try {
    const type = (req.query.type as string) || 'portfolio';
    const filter = extractAnalyticsFilter(req);
    const user = getAuditUser(req);

    const { filename, content } = await analyticsService.exportCsv(type, filter, user);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ====================================================
// PHASE 22: ONBOARDING & KYC WORKSPACE API ENDPOINTS
// ====================================================

/**
 * GET /api/onboarding/metrics
 * Returns summary metrics for the onboarding workspace
 */
apiRouter.get('/onboarding/metrics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const metrics = await onboardingService.getMetrics({
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(metrics);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/onboarding/applications
 * Returns paginated applications with queue filtering
 */
apiRouter.get('/onboarding/applications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const params = {
      search: req.query.search ? String(req.query.search) : undefined,
      status: req.query.status ? String(req.query.status) : undefined,
      queue: req.query.queue ? (String(req.query.queue) as any) : undefined,
      kycStatus: req.query.kycStatus ? String(req.query.kycStatus) : undefined,
      customerType: req.query.customerType ? String(req.query.customerType) : undefined,
      branchCode: req.query.branchCode ? String(req.query.branchCode) : undefined,
      slaStatus: req.query.slaStatus ? String(req.query.slaStatus) : undefined,
      priority: req.query.priority ? String(req.query.priority) : undefined,
      page: req.query.page ? parseInt(String(req.query.page), 10) : 1,
      limit: req.query.limit ? parseInt(String(req.query.limit), 10) : 20,
    };

    const result = await onboardingService.listApplications(params, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });

    res.json(result);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/onboarding/applications/:id
 * Returns full application details with child entities
 */
apiRouter.get('/onboarding/applications/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const app = await onboardingService.getApplicationById(req.params.id, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(app);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * GET /api/onboarding/customer/:customerId
 * Returns onboarding history & active application for Customer 360
 */
apiRouter.get('/onboarding/customer/:customerId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.customerId, 10);
    const data = await onboardingService.getCustomerOnboarding(customerId, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(data);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/onboarding/applications
 * Creates a new onboarding application
 */
apiRouter.post('/onboarding/applications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const app = await onboardingService.createApplication(req.body, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.status(201).json(app);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/onboarding/applications/:id/status
 * Transitions application status (Maker/Checker verified)
 */
apiRouter.patch('/onboarding/applications/:id/status', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, reason } = req.body;
    const updated = await onboardingService.updateStatus(id, status, reason, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/onboarding/applications/:id/kyc
 * Updates KYC review checklist & status
 */
apiRouter.patch('/onboarding/applications/:id/kyc', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await onboardingService.updateKycReview(id, req.body, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/onboarding/applications/:id/kyb
 * Updates KYB entity diligence checklist & status
 */
apiRouter.patch('/onboarding/applications/:id/kyb', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await onboardingService.updateKybReview(id, req.body, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/onboarding/applications/:id/documents
 * Uploads a new document to the application
 */
apiRouter.post('/onboarding/applications/:id/documents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const doc = await onboardingService.uploadDocument(id, req.body, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.status(201).json(doc);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/onboarding/documents/:docId
 * Reviews document (VERIFY, REJECT, REQUEST_REPLACEMENT)
 */
apiRouter.patch('/onboarding/documents/:docId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const docId = parseInt(req.params.docId, 10);
    const updated = await onboardingService.reviewDocument(docId, req.body, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/onboarding/applications/:id/exceptions
 * Raises an exception on an onboarding application
 */
apiRouter.post('/onboarding/applications/:id/exceptions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const exc = await onboardingService.raiseException({
      ...req.body,
      applicationId: id,
      actor: {
        id: req.user!.id,
        name: req.user!.name,
        role: req.user!.role,
      },
    }, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.status(201).json(exc);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/onboarding/exceptions/:excId/resolve
 * Resolves an open exception
 */
apiRouter.patch('/onboarding/exceptions/:excId/resolve', requireAuth, async (req: AuthRequest, res) => {
  try {
    const excId = parseInt(req.params.excId, 10);
    const { resolution } = req.body;
    const exc = await onboardingService.resolveException(excId, resolution, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(exc);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * PATCH /api/onboarding/exceptions/:excId/waive
 * Waives an exception (Authorized roles only)
 */
apiRouter.patch('/onboarding/exceptions/:excId/waive', requireAuth, async (req: AuthRequest, res) => {
  try {
    const excId = parseInt(req.params.excId, 10);
    const { waiveReason } = req.body;
    const exc = await onboardingService.waiveException(excId, waiveReason, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(exc);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

/**
 * POST /api/onboarding/applications/:id/reassign
 * Reassigns application to another officer/RM
 */
apiRouter.post('/onboarding/applications/:id/reassign', requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await onboardingService.reassign(id, req.body, {
      id: req.user!.id,
      name: req.user!.name,
      role: req.user!.role,
      employeeId: req.user!.employeeId,
      requestId: req.requestId,
    });
    res.json(updated);
  } catch (err) {
    const { statusCode, body } = formatErrorResponse(err, req.requestId);
    res.status(statusCode).json(body);
  }
});

// ==========================================
// PHASE 25: BANKING DOCUMENT INTELLIGENCE
// ==========================================
import { documentRouter } from './documentRoutes.ts';
apiRouter.use('/documents', documentRouter);

// ==========================================
// PHASE 26: RELATIONSHIP DIGITAL TWIN
// ==========================================
import { relationshipTwinRouter } from './relationshipTwinRoutes.ts';
apiRouter.use('/relationship-twin', relationshipTwinRouter);






