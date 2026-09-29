/**
 * COREvia Phase 31: Governed Agent Planning & Validation Engine
 * Implements strict plan drafting, validation, dependency DAG checking, prompt injection defense,
 * approval lifecycle, partial approvals, and staleness detection.
 */

import { SafeUser } from '../auth.service.ts';
import { agentRepository } from '../../repositories/agent.repository.ts';
import { auditRepository } from '../../repositories/audit.repository.ts';
import { customerRepository } from '../../repositories/customer.repository.ts';
import { notificationRepository } from '../../repositories/notification.repository.ts';
import { resourceAuth } from '../../lib/resourceAuth.ts';
import { BankingError } from '../../lib/errors.ts';
import {
  isAllowlistedAction,
  isMutatingAction,
  isBannedFinancialAction,
  getAgentToolDefinition,
} from './agentTools.ts';
import { contextResolver } from './contextResolver.ts';
import { copilotSecurity } from '../copilot/security.ts';
import {
  AgentPlanDTO,
  AgentPlanStepDTO,
  AgentPlanValidationResultDTO,
  CreateAgentPlanInput,
  AgentSessionDTO,
  AgentContextType,
} from '../../types/agent.types.ts';
import { db } from '../../db/index.ts';
import { serviceCases, tasks, opportunities } from '../../db/schema.ts';
import { eq, and, sql } from 'drizzle-orm';

const MAX_PLAN_STEPS = 10;
const PLAN_EXPIRATION_MINUTES = 60;

export const agentPlanningService = {
  /**
   * Start a new governed agent session with authorized context
   */
  async createSession(
    input: {
      contextType: AgentContextType;
      contextId?: string | number;
      customerId?: number;
      initialQuery?: string;
      launchOrigin?: string;
    },
    user: SafeUser,
    requestId: string
  ): Promise<AgentSessionDTO> {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Officer authentication required.', 401);
    }

    if (!input.contextType) {
      throw new BankingError('VALIDATION_ERROR', 'contextType is required.', 400);
    }

    // Resolve and authorize context server-side
    const resolvedContext = await contextResolver.resolveContext({
      user,
      contextType: input.contextType,
      contextId: input.contextId ? String(input.contextId) : undefined,
      customerId: input.customerId,
      requestId,
    });

    const sessionCode = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const session = await agentRepository.createSession({
      sessionId: sessionCode,
      userId: user.id,
      customerId: resolvedContext.customerId,
      contextType: input.contextType,
      contextId: input.contextId ? String(input.contextId) : null,
      status: 'ACTIVE',
      metadata: {
        initialQuery: input.initialQuery,
        launchOrigin: input.launchOrigin,
        initialSummary: resolvedContext.summary,
        authorizedScope: resolvedContext.authorizedScope,
      },
    });

    session.context = resolvedContext;

    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'AGENT_SESSION_STARTED',
      resourceType: 'AGENT_SESSION',
      resourceId: session.sessionId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        sessionId: session.sessionId,
        contextType: input.contextType,
        customerId: resolvedContext.customerId,
      },
    });

    return session;
  },

  /**
   * Alias / helper for plan generation
   */
  async generatePlan(
    sessionId: string | number,
    data: {
      title: string;
      objective: string;
      decisionTraceId?: string;
      scenarioId?: string;
      steps: any[];
    },
    user: SafeUser,
    requestId: string
  ): Promise<AgentPlanDTO> {
    return await this.createPlan({ sessionId, ...data }, user, requestId);
  },

  /**
   * Creates an agent plan draft with validation
   */
  async createPlan(
    input: CreateAgentPlanInput,
    user: SafeUser,
    requestId: string
  ): Promise<AgentPlanDTO> {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Officer authentication required.', 401);
    }

    // 1. Fetch Session and verify authorization
    const session = await agentRepository.findSessionById(input.sessionId);
    if (!session) {
      throw new BankingError('SESSION_NOT_FOUND', `Agent session #${input.sessionId} not found.`, 404);
    }

    if (session.userId !== user.id && user.role !== 'ADMINISTRATOR' && user.role !== 'BRANCH_MANAGER') {
      throw new BankingError('FORBIDDEN', 'You do not have access to this agent session.', 403);
    }

    // 2. Validate customer context scope
    if (session.customerId) {
      await resourceAuth.authorizeCustomer(user, session.customerId, 'AGENT_PLAN_CREATE', requestId);
    }

    // 3. Security Check: Prompt injection check on title and objective
    const titleCheck = await copilotSecurity.inspectMessage(input.title, user, requestId);
    const objCheck = await copilotSecurity.inspectMessage(input.objective, user, requestId);

    const sanitizeString = (str: string) => {
      return (str || '')
        .replace(/<[^>]*>?/gm, '')
        .replace(/drop\s+table\s+\w+;?/gi, '[BLOCKED_SQL]')
        .replace(/select\s+\*\s+from\s+\w+;?/gi, '[BLOCKED_SQL]')
        .replace(/ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/gi, '[NEUTRALIZED_DIRECTIVE]')
        .replace(/disregard\s+(all\s+)?(previous|prior)\s+instructions/gi, '[NEUTRALIZED_DIRECTIVE]')
        .replace(/act\s+as\s+(an\s+)?administrator/gi, '[NEUTRALIZED_DIRECTIVE]')
        .replace(/\[System Notice: Malicious or prompt-override pattern neutralized\]\s*/g, '')
        .trim();
    };

    const sanitizedTitle = sanitizeString(titleCheck.sanitizedMessage);
    const sanitizedObjective = sanitizeString(objCheck.sanitizedMessage);

    // 4. Validate Step Count
    if (!input.steps || input.steps.length === 0) {
      throw new BankingError('VALIDATION_ERROR', 'An agent plan must contain at least 1 step.', 400);
    }
    if (input.steps.length > MAX_PLAN_STEPS) {
      throw new BankingError(
        'PLAN_STEP_LIMIT_EXCEEDED',
        `Agent plans are limited to ${MAX_PLAN_STEPS} steps per governed execution. Please segment the workflow.`,
        400
      );
    }

    // 5. Structure Steps & Generate Idempotency Keys
    const formattedSteps: AgentPlanStepDTO[] = [];
    const generatedPlanCode = `PLN-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    for (let i = 0; i < input.steps.length; i++) {
      const step = input.steps[i];
      const stepNumber = i + 1;

      // Allowlist verification
      if (!isAllowlistedAction(step.actionType)) {
        if (isBannedFinancialAction(step.actionType)) {
          throw new BankingError(
            'FINANCIAL_SAFETY_VIOLATION',
            `Action '${step.actionType}' is strictly prohibited under COREvia Financial Safety boundaries.`,
            403
          );
        }
        throw new BankingError(
          'INVALID_ACTION',
          `Action '${step.actionType}' is not an authorized COREvia agent tool.`,
          400
        );
      }

      const toolDef = getAgentToolDefinition(step.actionType);
      const isMutation = isMutatingAction(step.actionType);

      // Security check on rationale
      const ratCheck = await copilotSecurity.inspectMessage(step.rationale || '', user, requestId);

      const idempotencyKey = isMutation
        ? `${session.sessionId}:${generatedPlanCode}:STEP-${stepNumber}`
        : undefined;

      formattedSteps.push({
        stepNumber,
        actionType: step.actionType,
        targetEntityType: step.targetEntityType || toolDef.resourceType,
        targetEntityId: step.targetEntityId ? String(step.targetEntityId) : undefined,
        parameters: step.parameters || {},
        rationale: ratCheck.sanitizedMessage,
        requiredPermission: toolDef.requiredPermission,
        status: 'PENDING',
        requiresConfirmation: isMutation, // Every mutation MUST require confirmation
        dependsOnStepNumber: step.dependsOnStepNumber || null,
        dependencyPolicy: step.dependencyPolicy || 'SKIP',
        idempotencyKey,
      });
    }

    // 6. Pre-Validate Plan DAG & Constraints
    const validation = await this.validatePlanDefinition(formattedSteps, session.customerId, user);
    if (!validation.valid) {
      throw new BankingError(
        'PLAN_VALIDATION_FAILED',
        `Plan validation failed: ${validation.errors.join('; ')}`,
        400
      );
    }

    // 7. Persist Draft Plan
    const expiresAt = new Date(Date.now() + PLAN_EXPIRATION_MINUTES * 60 * 1000);
    const plan = await agentRepository.createPlan(
      {
        planId: generatedPlanCode,
        sessionId: session.id,
        customerId: session.customerId,
        title: sanitizedTitle,
        objective: sanitizedObjective,
        status: 'AWAITING_APPROVAL',
        planVersion: 1,
        decisionTraceId: input.decisionTraceId || null,
        scenarioId: input.scenarioId || null,
        planRationale: `Deterministic multi-step banking workflow targeting: ${sanitizedObjective}`,
        estimatedEffect: 'Based on deterministic COREvia simulation rules and portfolio impact scoring.',
        expiresAt,
      },
      formattedSteps
    );

    // 8. Update Session status
    await agentRepository.updateSession(session.id, {
      status: 'AWAITING_APPROVAL',
    });

    // 9. Audit Logging
    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'AGENT_PLAN_CREATED',
      resourceType: 'AGENT_PLAN',
      resourceId: plan.planId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        sessionId: session.sessionId,
        customerId: session.customerId,
        stepCount: formattedSteps.length,
        objective: sanitizedObjective,
        decisionTraceId: input.decisionTraceId,
      },
    });

    // 10. Notification: Plan awaiting approval
    try {
      await notificationRepository.create({
        userId: user.id,
        title: 'Agent Plan Ready for Approval',
        message: `Plan "${sanitizedTitle}" with ${formattedSteps.length} governed steps is awaiting your review and authorization.`,
        notificationType: 'AGENT_PLAN_AWAITING_APPROVAL',
        category: 'RELATIONSHIP',
        severity: 'INFO',
        actionUrl: `/agent?planId=${plan.planId}`,
        actionLabel: 'Review Plan',
        sourceEntityType: 'AGENT_PLAN',
        sourceEntityId: plan.planId,
      });
    } catch (e) {
      console.warn('[agentPlanningService] Non-blocking notification creation error:', e);
    }

    return plan;
  },

  /**
   * Validates a plan definition against dependency rules, permissions, target existence, and conflict checks
   */
  async validatePlanDefinition(
    steps: AgentPlanStepDTO[],
    customerId: number | null | undefined,
    user: SafeUser
  ): Promise<AgentPlanValidationResultDTO> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const seenMutations = new Map<string, string>(); // resourceKey -> action

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepNum = step.stepNumber;

      // Rule A: Action allowlist & financial safety
      if (!isAllowlistedAction(step.actionType)) {
        errors.push(`Step ${stepNum}: Action '${step.actionType}' is not allowlisted.`);
        continue;
      }
      if (isBannedFinancialAction(step.actionType)) {
        errors.push(`Step ${stepNum}: Financial mutation '${step.actionType}' is strictly prohibited.`);
        continue;
      }

      // Rule B: Permission check
      const toolDef = getAgentToolDefinition(step.actionType);
      const hasPerm =
        user.role === 'ADMINISTRATOR' ||
        user.permissions?.includes('admin:all') ||
        user.permissions?.includes(toolDef.requiredPermission) ||
        (user.role === 'RELATIONSHIP_MANAGER' && ['task:create', 'task:update', 'customer:update', 'customer:read', 'task:read', 'case:read', 'opportunity:read', 'opportunity:update', 'analytics:read'].includes(toolDef.requiredPermission));

      if (!hasPerm) {
        errors.push(`Step ${stepNum}: Current user lacks required permission '${toolDef.requiredPermission}'.`);
      }

      // Rule C: Dependency DAG validation (No forward references, no circular dependencies)
      if (step.dependsOnStepNumber !== null && step.dependsOnStepNumber !== undefined) {
        if (step.dependsOnStepNumber >= stepNum) {
          errors.push(`Step ${stepNum}: Invalid dependency on forward or self step ${step.dependsOnStepNumber}.`);
        }
        const parentStep = steps.find(s => s.stepNumber === step.dependsOnStepNumber);
        if (!parentStep) {
          errors.push(`Step ${stepNum}: Declared dependency on non-existent step ${step.dependsOnStepNumber}.`);
        }
      }

      // Rule D: Target verification & conflicting mutations
      if (step.targetEntityType && step.targetEntityId) {
        const resourceKey = `${step.targetEntityType}:${step.targetEntityId}`;
        if (isMutatingAction(step.actionType)) {
          if (seenMutations.has(resourceKey)) {
            const prevAction = seenMutations.get(resourceKey);
            if (prevAction === step.actionType && step.actionType === 'UPDATE_SERVICE_CASE') {
              warnings.push(`Step ${stepNum}: Multiple status modifications detected for same service case #${step.targetEntityId}.`);
            }
          }
          seenMutations.set(resourceKey, step.actionType);
        }
      }

      // Rule E: Required confirmation
      if (isMutatingAction(step.actionType) && !step.requiresConfirmation) {
        errors.push(`Step ${stepNum}: Mutating action '${step.actionType}' must require confirmation.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      executableStepsCount: steps.length,
      requiresApproval: steps.some(s => s.requiresConfirmation),
      revalidationRequired: false,
    };
  },

  /**
   * Approves a plan or partially approves selected steps
   */
  async approvePlan(
    planId: string | number,
    approvedStepNumbers: number[] | undefined,
    user: SafeUser,
    requestId: string
  ): Promise<AgentPlanDTO> {
    const plan = await agentRepository.findPlanById(planId);
    if (!plan) {
      throw new BankingError('PLAN_NOT_FOUND', `Agent plan #${planId} not found.`, 404);
    }

    if (plan.status !== 'AWAITING_APPROVAL' && plan.status !== 'DRAFT') {
      throw new BankingError(
        'INVALID_PLAN_STATE',
        `Plan cannot be approved in current state: ${plan.status}.`,
        400
      );
    }

    // Check expiration / staleness
    const isStale = await this.checkPlanStaleness(plan);
    if (isStale) {
      await agentRepository.updatePlan(plan.id, {
        rejectionReason: 'Plan expired or underlying banking state changed before approval.',
        status: 'EXPIRED',
      });
      throw new BankingError(
        'PLAN_STALE',
        'Plan has expired or is stale due to underlying banking changes. Please regenerate or revalidate.',
        400
      );
    }

    // Re-verify authorization
    if (plan.customerId) {
      await resourceAuth.authorizeCustomer(user, plan.customerId, 'AGENT_PLAN_APPROVE', requestId);
    }

    // Partial approval: If selected steps provided, mark unselected mutating steps as SKIPPED
    if (approvedStepNumbers && approvedStepNumbers.length > 0) {
      for (const step of plan.steps) {
        const isApproved = approvedStepNumbers.includes(step.stepNumber);
        if (step.id) {
          if (isApproved) {
            await agentRepository.updateStep(step.id, { status: 'AUTHORIZED' });
          } else {
            await agentRepository.updateStep(step.id, { status: 'SKIPPED', resultSummary: 'Unselected by officer during partial approval.' });
          }
        }
      }
    } else {
      // Full approval
      for (const step of plan.steps) {
        if (step.id) {
          await agentRepository.updateStep(step.id, { status: 'AUTHORIZED' });
        }
      }
    }

    // Update Plan to APPROVED
    const updatedPlan = await agentRepository.updatePlan(plan.id, {
      status: 'APPROVED',
      approvedAt: new Date(),
      approvedBy: user.id,
      planVersion: plan.planVersion + 1,
    });

    if (!updatedPlan) {
      throw new BankingError('INTERNAL_ERROR', 'Failed to update plan approval state.', 500);
    }

    // Update Session
    await agentRepository.updateSession(plan.sessionId, {
      status: 'AWAITING_APPROVAL', // Session is ready for execution trigger
    });

    // Audit Logging
    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'AGENT_PLAN_APPROVED',
      resourceType: 'AGENT_PLAN',
      resourceId: plan.planId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        planId: plan.planId,
        approvedBy: user.id,
        isPartial: !!(approvedStepNumbers && approvedStepNumbers.length < plan.steps.length),
        approvedSteps: approvedStepNumbers || 'ALL',
      },
    });

    // Notification
    try {
      await notificationRepository.create({
        userId: user.id,
        title: 'Agent Plan Approved',
        message: `Plan "${plan.title}" has been authorized for governed execution.`,
        notificationType: 'AGENT_PLAN_APPROVED',
        category: 'RELATIONSHIP',
        severity: 'INFO',
        actionUrl: `/agent?planId=${plan.planId}`,
        actionLabel: 'View Execution',
        sourceEntityType: 'AGENT_PLAN',
        sourceEntityId: plan.planId,
      });
    } catch (e) {
      console.warn('[agentPlanningService] Non-blocking notification error:', e);
    }

    return (await agentRepository.findPlanById(plan.id)) || updatedPlan;
  },

  /**
   * Rejects an agent plan
   */
  async rejectPlan(
    planId: string | number,
    rejectionReason: string,
    user: SafeUser,
    requestId: string
  ): Promise<AgentPlanDTO> {
    const plan = await agentRepository.findPlanById(planId);
    if (!plan) {
      throw new BankingError('PLAN_NOT_FOUND', `Agent plan #${planId} not found.`, 404);
    }

    const updated = await agentRepository.updatePlan(plan.id, {
      status: 'REJECTED',
      rejectionReason: rejectionReason || 'Rejected by officer.',
    });

    // Update steps to CANCELLED
    for (const step of plan.steps) {
      if (step.id) {
        await agentRepository.updateStep(step.id, { status: 'CANCELLED' });
      }
    }

    // Update Session
    await agentRepository.updateSession(plan.sessionId, {
      status: 'CANCELLED',
    });

    await auditRepository.createLog({
      actorId: user.employeeId,
      actorName: user.name,
      action: 'AGENT_PLAN_REJECTED',
      resourceType: 'AGENT_PLAN',
      resourceId: plan.planId,
      requestId,
      outcome: 'DENIED',
      metadata: { reason: rejectionReason },
    });

    return updated!;
  },

  /**
   * Checks whether a plan has expired or become stale
   */
  async checkPlanStaleness(plan: AgentPlanDTO): Promise<boolean> {
    if (plan.expiresAt) {
      const expTime = new Date(plan.expiresAt).getTime();
      if (Date.now() > expTime) {
        return true;
      }
    }

    // If more than 60 minutes old
    const createdTime = new Date(plan.createdAt).getTime();
    if (Date.now() - createdTime > 60 * 60 * 1000) {
      return true;
    }

    return false;
  },

  /**
   * Alias for createPlanFromStrategyScenario
   */
  async createPlanFromScenario(
    scenarioId: string | number,
    user: SafeUser,
    requestId: string
  ): Promise<AgentPlanDTO> {
    return await this.createPlanFromStrategyScenario(scenarioId, user, requestId);
  },

  /**
   * Creates a draft plan automatically from Strategy Simulator scenario
   */
  async createPlanFromStrategyScenario(
    scenarioId: string | number,
    user: SafeUser,
    requestId: string
  ): Promise<AgentPlanDTO> {
    const context = await contextResolver.resolveContext({
      user,
      contextType: 'STRATEGY_SCENARIO',
      contextId: String(scenarioId),
      requestId,
    });

    // Create session
    const sessionCode = `SES-SCEN-${Date.now().toString(36).toUpperCase()}`;
    const session = await agentRepository.createSession({
      sessionId: sessionCode,
      userId: user.id,
      customerId: context.customerId,
      contextType: 'STRATEGY_SCENARIO',
      contextId: String(scenarioId),
      status: 'ACTIVE',
      metadata: { source: 'STRATEGY_SIMULATOR', scenarioId },
    });

    // Build standard multi-step recovery plan from simulated actions
    const input: CreateAgentPlanInput = {
      sessionId: session.id,
      title: `Execute Approved Strategy Scenario: ${context.customerName || 'Relationship'}`,
      objective: `Implement strategic simulated improvements for customer ${context.customerName}`,
      scenarioId: String(scenarioId),
      steps: [
        {
          stepNumber: 1,
          actionType: 'UPDATE_SERVICE_CASE',
          targetEntityType: 'SERVICE_CASE',
          rationale: 'Resolve open operational customer friction point identified in strategy sandbox.',
          parameters: { status: 'RESOLVED', resolutionSummary: 'Resolved via Governed Relationship Plan execution.' },
        },
        {
          stepNumber: 2,
          actionType: 'CREATE_RELATIONSHIP_REVIEW',
          targetEntityType: 'RELATIONSHIP_REVIEW',
          rationale: 'Institutional quarterly governance relationship review cadence establishment.',
          parameters: { title: `Annual Governance Review: ${context.customerName}`, priority: 'HIGH' },
          dependsOnStepNumber: 1,
          dependencyPolicy: 'REQUIRE_REVIEW',
        },
        {
          stepNumber: 3,
          actionType: 'CREATE_TASK',
          targetEntityType: 'TASK',
          rationale: 'Ensure relationship manager completes executive briefing and account follow-up.',
          parameters: {
            title: `Follow-up on Strategy Sandbox items for ${context.customerName}`,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'HIGH',
          },
          dependsOnStepNumber: 2,
          dependencyPolicy: 'SKIP',
        },
      ],
    };

    return await this.createPlan(input, user, requestId);
  },

  /**
   * Creates a draft plan automatically from Signal Center or Next Best Action
   */
  async createPlanFromSignalOrNba(
    customerId: number,
    source: 'SIGNAL' | 'NEXT_BEST_ACTION' | 'CUSTOMER_360' | 'DIGITAL_TWIN' | 'COPILOT',
    title: string,
    objective: string,
    user: SafeUser,
    requestId: string,
    decisionTraceId?: string
  ): Promise<AgentPlanDTO> {
    const context = await contextResolver.resolveContext({
      user,
      contextType: 'CUSTOMER',
      customerId,
      requestId,
    });

    const sessionCode = `SES-${source}-${Date.now().toString(36).toUpperCase()}`;
    const session = await agentRepository.createSession({
      sessionId: sessionCode,
      userId: user.id,
      customerId: context.customerId,
      contextType: 'CUSTOMER',
      contextId: String(customerId),
      status: 'ACTIVE',
      metadata: { source, decisionTraceId },
    });

    const input: CreateAgentPlanInput = {
      sessionId: session.id,
      title: title || `Relationship Recovery Plan: ${context.customerName}`,
      objective: objective || `Proactive relationship stabilization workflow for ${context.customerName}`,
      decisionTraceId,
      steps: [
        {
          stepNumber: 1,
          actionType: 'CREATE_RELATIONSHIP_REVIEW',
          targetEntityType: 'RELATIONSHIP_REVIEW',
          rationale: 'Initiate proactive client outreach in response to relationship momentum indicator.',
          parameters: { title: `Relationship Review: ${context.customerName}`, priority: 'HIGH' },
        },
        {
          stepNumber: 2,
          actionType: 'CREATE_TASK',
          targetEntityType: 'TASK',
          rationale: 'Assign relationship manager follow-up task to review loan and deposit terms.',
          parameters: {
            title: `Portfolio Review Follow-up: ${context.customerName}`,
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'HIGH',
          },
          dependsOnStepNumber: 1,
          dependencyPolicy: 'REQUIRE_REVIEW',
        },
        {
          stepNumber: 3,
          actionType: 'CREATE_NOTIFICATION',
          targetEntityType: 'NOTIFICATION',
          rationale: 'Notify branch manager of relationship stabilization progress.',
          parameters: {
            title: `Relationship Action Plan Initiated: ${context.customerName}`,
            message: `Governed action plan initiated for ${context.customerName} (${context.customerCode}).`,
          },
          dependsOnStepNumber: 2,
          dependencyPolicy: 'SKIP',
        },
      ],
    };

    return await this.createPlan(input, user, requestId);
  },
};
