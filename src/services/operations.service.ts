/**
 * COREvia Phase 36: Banking Operations Workspace Service
 * Central operational control layer for maker/checker approvals, exceptions, reconciliation, and audit.
 */

import { db } from '../db/index.ts';
import {
  operationalApprovals,
  operationalExceptions,
  reconciliationRecords,
  operationalEvents,
  customers,
  users,
  tasks,
  customerJourneySteps,
  customerJourneys,
  auditLogs,
} from '../db/schema.ts';
import { eq, desc, and, or, sql, gte, lte } from 'drizzle-orm';
import { BankingError } from '../lib/errors.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { notificationService } from './notification.service.ts';
import { SafeUser } from './auth.service.ts';
import {
  OperationsSummaryDTO,
  OperationalApprovalDTO,
  OperationalExceptionDTO,
  ReconciliationRecordDTO,
  OperationalEventDTO,
  FailedWorkflowDTO,
  OperationalTaskDTO,
} from '../types/operations.types.ts';
import { maskAccountNumber } from '../lib/masking.ts';

export class OperationsService {
  /**
   * Operations Summary KPI metrics backed by real database tables
   */
  async getSummary(user: SafeUser): Promise<OperationsSummaryDTO> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // 1. Approvals queries
    const approvalsList = await db.select().from(operationalApprovals);
    const pendingApprovals = approvalsList.filter(
      (a) => a.status === 'PENDING' || a.status === 'UNDER_REVIEW'
    ).length;
    const awaitingChecker = approvalsList.filter((a) => a.status === 'PENDING').length;

    // 2. Exceptions queries
    const exceptionsList = await db.select().from(operationalExceptions);
    const highPriorityExceptions = exceptionsList.filter(
      (e) =>
        (e.severity === 'HIGH' || e.severity === 'CRITICAL') &&
        e.status !== 'RESOLVED' &&
        e.status !== 'CLOSED'
    ).length;

    const slaAtRisk = exceptionsList.filter((e) => {
      if (e.status === 'RESOLVED' || e.status === 'CLOSED') return false;
      if (!e.slaDeadline) return false;
      const deadline = new Date(e.slaDeadline).getTime();
      return deadline < now.getTime() || deadline - now.getTime() < 12 * 3600000;
    }).length;

    const kycExceptions = exceptionsList.filter(
      (e) => e.category === 'KYC' && e.status !== 'RESOLVED' && e.status !== 'CLOSED'
    ).length;

    const documentExceptions = exceptionsList.filter(
      (e) => e.category === 'DOCUMENT' && e.status !== 'RESOLVED' && e.status !== 'CLOSED'
    ).length;

    const reconciliationExceptions = exceptionsList.filter(
      (e) => e.category === 'RECONCILIATION' && e.status !== 'RESOLVED' && e.status !== 'CLOSED'
    ).length;

    const resolvedToday = exceptionsList.filter(
      (e) => e.resolvedAt && new Date(e.resolvedAt) >= startOfDay
    ).length;

    // 3. Failed workflows count
    const workflowExceptions = exceptionsList.filter(
      (e) => e.category === 'WORKFLOW' && e.status !== 'RESOLVED' && e.status !== 'CLOSED'
    ).length;
    const failedSteps = await db
      .select()
      .from(customerJourneySteps)
      .where(eq(customerJourneySteps.status, 'FAILED'));
    const failedWorkflows = workflowExceptions + failedSteps.length;

    // 4. Operational tasks due
    const openTasks = await db
      .select()
      .from(tasks)
      .where(or(eq(tasks.status, 'PENDING'), eq(tasks.status, 'IN_PROGRESS')));
    const operationalTasksDue = openTasks.filter((t) => {
      const isOps =
        t.priority === 'HIGH' ||
        t.priority === 'CRITICAL' ||
        (t.dueDate && new Date(t.dueDate) <= new Date(now.getTime() + 24 * 3600000));
      return isOps;
    }).length;

    return {
      pendingApprovals,
      highPriorityExceptions,
      slaAtRisk,
      failedWorkflows,
      kycExceptions,
      documentExceptions,
      reconciliationExceptions,
      awaitingChecker,
      operationalTasksDue,
      resolvedToday,
      lastUpdated: now.toISOString(),
    };
  }

  /**
   * List Operational Approvals with RBAC & resource scoping
   */
  async getApprovals(
    filters: {
      status?: string;
      priority?: string;
      requestType?: string;
      customerId?: number;
      limit?: number;
    },
    user: SafeUser
  ): Promise<OperationalApprovalDTO[]> {
    let query = db.select().from(operationalApprovals).$dynamic();
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(operationalApprovals.status, filters.status));
    }
    if (filters.priority) {
      conditions.push(eq(operationalApprovals.priority, filters.priority));
    }
    if (filters.requestType) {
      conditions.push(eq(operationalApprovals.requestType, filters.requestType));
    }
    if (filters.customerId) {
      conditions.push(eq(operationalApprovals.customerId, filters.customerId));
    }

    // RBAC: If Relationship Manager, only show approvals for customers assigned to them or created by them
    if (user.role === 'RELATIONSHIP_MANAGER') {
      const rmCustomers = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.assignedRmId, user.id));
      const custIds = rmCustomers.map((c) => c.id);

      if (custIds.length > 0) {
        conditions.push(
          or(
            eq(operationalApprovals.makerId, user.id),
            sql`${operationalApprovals.customerId} IN (${sql.join(custIds.map((id) => sql`${id}`), sql`, `)})`
          )
        );
      } else {
        conditions.push(eq(operationalApprovals.makerId, user.id));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(operationalApprovals.createdAt)).limit(filters.limit || 50);
    const rows = await query;

    return rows.map((r) => ({
      id: r.id,
      approvalId: r.approvalId,
      requestType: r.requestType as any,
      customerId: r.customerId,
      customerCode: r.customerCode,
      customerName: r.customerName,
      relatedEntityType: r.relatedEntityType,
      relatedEntityId: r.relatedEntityId,
      amount: r.amount ? Number(r.amount) : null,
      currency: r.currency,
      makerId: r.makerId,
      makerName: r.makerName,
      makerRole: r.makerRole,
      checkerId: r.checkerId,
      checkerName: r.checkerName,
      checkerRole: r.checkerRole,
      status: r.status as any,
      priority: r.priority as any,
      reason: r.reason,
      evidence: r.evidence,
      checkerNotes: r.checkerNotes,
      slaDeadline: r.slaDeadline ? new Date(r.slaDeadline).toISOString() : null,
      actionedAt: r.actionedAt ? new Date(r.actionedAt).toISOString() : null,
      metadata: r.metadata,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    }));
  }

  /**
   * Get single approval by ID
   */
  async getApprovalById(id: string | number, user: SafeUser): Promise<OperationalApprovalDTO> {
    const numId = Number(id);
    const rows = await db
      .select()
      .from(operationalApprovals)
      .where(
        !isNaN(numId)
          ? or(eq(operationalApprovals.id, numId), eq(operationalApprovals.approvalId, String(id)))
          : eq(operationalApprovals.approvalId, String(id))
      )
      .limit(1);

    if (rows.length === 0) {
      throw new BankingError('APPROVAL_NOT_FOUND', `Operational approval '${id}' not found.`, 404);
    }

    const r = rows[0];
    return {
      id: r.id,
      approvalId: r.approvalId,
      requestType: r.requestType as any,
      customerId: r.customerId,
      customerCode: r.customerCode,
      customerName: r.customerName,
      relatedEntityType: r.relatedEntityType,
      relatedEntityId: r.relatedEntityId,
      amount: r.amount ? Number(r.amount) : null,
      currency: r.currency,
      makerId: r.makerId,
      makerName: r.makerName,
      makerRole: r.makerRole,
      checkerId: r.checkerId,
      checkerName: r.checkerName,
      checkerRole: r.checkerRole,
      status: r.status as any,
      priority: r.priority as any,
      reason: r.reason,
      evidence: r.evidence,
      checkerNotes: r.checkerNotes,
      slaDeadline: r.slaDeadline ? new Date(r.slaDeadline).toISOString() : null,
      actionedAt: r.actionedAt ? new Date(r.actionedAt).toISOString() : null,
      metadata: r.metadata,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    };
  }

  /**
   * Create an Operational Approval request (Maker action)
   */
  async createApproval(
    data: {
      requestType: string;
      customerId?: number;
      relatedEntityType?: string;
      relatedEntityId?: string;
      amount?: number;
      priority?: string;
      reason: string;
      evidence?: any;
    },
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<OperationalApprovalDTO> {
    if (!data.requestType || !data.reason) {
      throw new BankingError('VALIDATION_ERROR', 'Request type and reason are required.', 400);
    }

    let customerCode = null;
    let customerName = null;
    if (data.customerId) {
      const [c] = await db.select().from(customers).where(eq(customers.id, data.customerId)).limit(1);
      if (c) {
        customerCode = c.customerCode;
        customerName = c.name;
      }
    }

    const now = new Date();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const approvalId = `APR-${now.getFullYear()}-${randomSuffix}`;
    const slaDeadline = new Date(now.getTime() + 24 * 3600000); // 24-hour default SLA

    const [inserted] = await db
      .insert(operationalApprovals)
      .values({
        approvalId,
        requestType: data.requestType,
        customerId: data.customerId || null,
        customerCode,
        customerName,
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
        amount: data.amount ? String(data.amount) : null,
        currency: 'INR',
        makerId: user.id,
        makerName: user.name,
        makerRole: user.role,
        status: 'PENDING',
        priority: data.priority || 'MEDIUM',
        reason: data.reason,
        evidence: data.evidence || {},
        slaDeadline,
        metadata: { createdVia: 'OPERATIONS_WORKSPACE', clientRequestId: requestId },
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // 1. Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_APPROVAL_CREATED',
      resourceType: 'OPERATIONAL_APPROVAL',
      resourceId: approvalId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        requestType: data.requestType,
        amount: data.amount,
        customerId: data.customerId,
        maker: user.employeeId,
      },
    });

    // 2. Operational Event
    await db.insert(operationalEvents).values({
      eventId: `OEV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventType: 'APPROVAL_CREATED',
      severity: (data.priority as any) || 'MEDIUM',
      sourceModule: 'MAKER_CHECKER',
      customerId: data.customerId || null,
      relatedEntityType: 'OPERATIONAL_APPROVAL',
      relatedEntityId: approvalId,
      title: `New Approval Request: ${data.requestType}`,
      description: `Maker ${user.name} submitted request for ${customerName || 'General Account'}: ${data.reason.substring(0, 100)}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      metadata: { approvalId, amount: data.amount },
    });

    return this.getApprovalById(inserted.id, user);
  }

  /**
   * Maker / Checker Dual-Control Action (Approve, Reject, Return)
   * Back-end strictly forbids maker from approving their own request.
   */
  async actOnApproval(
    id: string | number,
    action: 'APPROVE' | 'REJECT' | 'RETURN',
    checkerNotes: string,
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<OperationalApprovalDTO> {
    const existing = await this.getApprovalById(id, user);

    if (existing.status !== 'PENDING' && existing.status !== 'UNDER_REVIEW') {
      throw new BankingError(
        'INVALID_STATE',
        `Approval '${existing.approvalId}' is already ${existing.status} and cannot be modified.`,
        400
      );
    }

    // STRICT DUAL CONTROL: Maker cannot self-approve their own request
    if (existing.makerId === user.id) {
      await auditRepository.createLog({
        actorId: user.employeeId || `USR-${user.id}`,
        actorName: user.name,
        action: 'MAKER_CHECKER_SELF_AUTHORIZATION_ATTEMPT',
        resourceType: 'OPERATIONAL_APPROVAL',
        resourceId: existing.approvalId,
        requestId,
        outcome: 'DENIED',
        metadata: { reason: 'MAKER_CANNOT_SELF_APPROVE', makerId: existing.makerId, userId: user.id },
      });

      throw new BankingError(
        'MAKER_CANNOT_SELF_APPROVE',
        'Segregation of duties violation: Maker cannot self-authorize their own operational request.',
        403
      );
    }

    // RBAC: Checker authorization check
    const canAuthorize =
      ['ADMINISTRATOR', 'BRANCH_OPS_HEAD', 'BRANCH_MANAGER', 'COMPLIANCE_OFFICER'].includes(user.role) ||
      user.permissions?.includes('maker_checker:authorize') ||
      user.permissions?.includes('admin:all');

    if (!canAuthorize) {
      throw new BankingError(
        'FORBIDDEN',
        `Officer role '${user.role}' lacks privilege 'maker_checker:authorize' to act on approvals.`,
        403
      );
    }

    if (!checkerNotes || !checkerNotes.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Checker remarks are mandatory for operational sign-off.', 400);
    }

    let targetStatus: 'APPROVED' | 'REJECTED' | 'RETURNED' = 'APPROVED';
    let auditAction = 'OPERATIONS_APPROVAL_APPROVED';
    if (action === 'REJECT') {
      targetStatus = 'REJECTED';
      auditAction = 'OPERATIONS_APPROVAL_REJECTED';
    } else if (action === 'RETURN') {
      targetStatus = 'RETURNED';
      auditAction = 'OPERATIONS_APPROVAL_RETURNED';
    }

    const now = new Date();
    await db
      .update(operationalApprovals)
      .set({
        status: targetStatus,
        checkerId: user.id,
        checkerName: user.name,
        checkerRole: user.role,
        checkerNotes: checkerNotes.trim(),
        actionedAt: now,
        updatedAt: now,
      })
      .where(eq(operationalApprovals.id, existing.id));

    // Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: auditAction,
      resourceType: 'OPERATIONAL_APPROVAL',
      resourceId: existing.approvalId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        makerId: existing.makerId,
        checkerId: user.id,
        action,
        checkerNotes,
        requestType: existing.requestType,
      },
    });

    // Operational Event
    await db.insert(operationalEvents).values({
      eventId: `OEV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventType: 'APPROVAL_COMPLETED',
      severity: targetStatus === 'APPROVED' ? 'INFO' : 'MEDIUM',
      sourceModule: 'MAKER_CHECKER',
      customerId: existing.customerId,
      relatedEntityType: 'OPERATIONAL_APPROVAL',
      relatedEntityId: existing.approvalId,
      title: `Approval ${targetStatus}: ${existing.approvalId}`,
      description: `Checker ${user.name} marked request ${targetStatus}. Remark: ${checkerNotes}`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      metadata: { approvalId: existing.approvalId, action },
    });

    // Notify Maker of result
    if (existing.makerId) {
      await notificationService.createNotification(
        {
          userId: existing.makerId,
          notificationType: 'SYSTEM_ALERT',
          category: 'OPERATIONAL',
          severity: targetStatus === 'APPROVED' ? 'INFO' : 'WARNING',
          title: `Approval ${targetStatus}: ${existing.approvalId}`,
          message: `Your ${existing.requestType} request was marked ${targetStatus} by ${user.name}.`,
          sourceEntityType: 'TASK',
          sourceEntityId: String(existing.id),
        },
        { userId: user.id, name: user.name, role: user.role }
      ).catch(() => null);
    }

    return this.getApprovalById(existing.id, user);
  }

  /**
   * List Operational Exceptions with filtering
   */
  async getExceptions(
    filters: {
      category?: string;
      severity?: string;
      status?: string;
      customerId?: number;
      search?: string;
      limit?: number;
    },
    user: SafeUser
  ): Promise<OperationalExceptionDTO[]> {
    let query = db.select().from(operationalExceptions).$dynamic();
    const conditions = [];

    if (filters.category) {
      conditions.push(eq(operationalExceptions.category, filters.category));
    }
    if (filters.severity) {
      conditions.push(eq(operationalExceptions.severity, filters.severity));
    }
    if (filters.status) {
      conditions.push(eq(operationalExceptions.status, filters.status));
    }
    if (filters.customerId) {
      conditions.push(eq(operationalExceptions.customerId, filters.customerId));
    }
    if (filters.search) {
      const q = `%${filters.search}%`;
      conditions.push(
        or(
          sql`${operationalExceptions.exceptionId} ILIKE ${q}`,
          sql`${operationalExceptions.description} ILIKE ${q}`,
          sql`${operationalExceptions.customerName} ILIKE ${q}`,
          sql`${operationalExceptions.customerCode} ILIKE ${q}`
        )
      );
    }

    // RBAC customer filtering for RM
    if (user.role === 'RELATIONSHIP_MANAGER') {
      const rmCustomers = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.assignedRmId, user.id));
      const custIds = rmCustomers.map((c) => c.id);

      if (custIds.length > 0) {
        conditions.push(
          or(
            eq(operationalExceptions.ownerId, user.id),
            sql`${operationalExceptions.customerId} IN (${sql.join(custIds.map((id) => sql`${id}`), sql`, `)})`
          )
        );
      } else {
        conditions.push(eq(operationalExceptions.ownerId, user.id));
      }
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(operationalExceptions.createdAt)).limit(filters.limit || 50);
    const rows = await query;

    return rows.map((r) => ({
      id: r.id,
      exceptionId: r.exceptionId,
      category: r.category as any,
      severity: r.severity as any,
      source: r.source,
      customerId: r.customerId,
      customerCode: r.customerCode,
      customerName: r.customerName,
      relatedEntityType: r.relatedEntityType,
      relatedEntityId: r.relatedEntityId,
      description: r.description,
      evidence: r.evidence,
      status: r.status as any,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      ownerRole: r.ownerRole,
      slaDeadline: r.slaDeadline ? new Date(r.slaDeadline).toISOString() : null,
      resolutionNotes: r.resolutionNotes,
      resolvedById: r.resolvedById,
      resolvedByName: r.resolvedByName,
      resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
      metadata: r.metadata,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    }));
  }

  /**
   * Get single exception by ID
   */
  async getExceptionById(id: string | number, user: SafeUser): Promise<OperationalExceptionDTO> {
    const numId = Number(id);
    const rows = await db
      .select()
      .from(operationalExceptions)
      .where(
        !isNaN(numId)
          ? or(eq(operationalExceptions.id, numId), eq(operationalExceptions.exceptionId, String(id)))
          : eq(operationalExceptions.exceptionId, String(id))
      )
      .limit(1);

    if (rows.length === 0) {
      throw new BankingError('EXCEPTION_NOT_FOUND', `Operational exception '${id}' not found.`, 404);
    }

    const r = rows[0];
    return {
      id: r.id,
      exceptionId: r.exceptionId,
      category: r.category as any,
      severity: r.severity as any,
      source: r.source,
      customerId: r.customerId,
      customerCode: r.customerCode,
      customerName: r.customerName,
      relatedEntityType: r.relatedEntityType,
      relatedEntityId: r.relatedEntityId,
      description: r.description,
      evidence: r.evidence,
      status: r.status as any,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      ownerRole: r.ownerRole,
      slaDeadline: r.slaDeadline ? new Date(r.slaDeadline).toISOString() : null,
      resolutionNotes: r.resolutionNotes,
      resolvedById: r.resolvedById,
      resolvedByName: r.resolvedByName,
      resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
      metadata: r.metadata,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    };
  }

  /**
   * Create an Operational Exception
   */
  async createException(
    data: {
      category: string;
      severity?: string;
      source: string;
      customerId?: number;
      relatedEntityType?: string;
      relatedEntityId?: string;
      description: string;
      evidence?: any;
      slaHours?: number;
    },
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<OperationalExceptionDTO> {
    if (!data.category || !data.description || !data.source) {
      throw new BankingError('VALIDATION_ERROR', 'Category, description, and source are required.', 400);
    }

    let customerCode = null;
    let customerName = null;
    if (data.customerId) {
      const [c] = await db.select().from(customers).where(eq(customers.id, data.customerId)).limit(1);
      if (c) {
        customerCode = c.customerCode;
        customerName = c.name;
      }
    }

    const now = new Date();
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const exceptionId = `OEX-${now.getFullYear()}-${randomSuffix}`;
    const slaDeadline = new Date(now.getTime() + (data.slaHours || 24) * 3600000);

    const [inserted] = await db
      .insert(operationalExceptions)
      .values({
        exceptionId,
        category: data.category,
        severity: data.severity || 'MEDIUM',
        source: data.source,
        customerId: data.customerId || null,
        customerCode,
        customerName,
        relatedEntityType: data.relatedEntityType || null,
        relatedEntityId: data.relatedEntityId || null,
        description: data.description,
        evidence: data.evidence || {},
        status: 'OPEN',
        ownerId: user.id,
        ownerName: user.name,
        ownerRole: user.role,
        slaDeadline,
        metadata: { clientRequestId: requestId },
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    // Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_EXCEPTION_CREATED',
      resourceType: 'OPERATIONAL_EXCEPTION',
      resourceId: exceptionId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { category: data.category, severity: data.severity, source: data.source },
    });

    // Operational Event
    await db.insert(operationalEvents).values({
      eventId: `OEV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventType: 'EXCEPTION_OPENED',
      severity: (data.severity as any) || 'MEDIUM',
      sourceModule: 'OPERATIONS_WORKSPACE',
      customerId: data.customerId || null,
      relatedEntityType: 'OPERATIONAL_EXCEPTION',
      relatedEntityId: exceptionId,
      title: `Exception Opened: [${data.category}] ${exceptionId}`,
      description: data.description.substring(0, 120),
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      metadata: { exceptionId, category: data.category },
    });

    return this.getExceptionById(inserted.id, user);
  }

  /**
   * Acknowledge an exception (transitions OPEN -> ACKNOWLEDGED)
   */
  async acknowledgeException(
    id: string | number,
    notes: string,
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<OperationalExceptionDTO> {
    const existing = await this.getExceptionById(id, user);

    const now = new Date();
    await db
      .update(operationalExceptions)
      .set({
        status: 'ACKNOWLEDGED',
        ownerId: user.id,
        ownerName: user.name,
        ownerRole: user.role,
        metadata: { ...(existing.metadata || {}), acknowledgmentNotes: notes, acknowledgedAt: now.toISOString() },
        updatedAt: now,
      })
      .where(eq(operationalExceptions.id, existing.id));

    // Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_EXCEPTION_ACKNOWLEDGED',
      resourceType: 'OPERATIONAL_EXCEPTION',
      resourceId: existing.exceptionId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { notes, previousStatus: existing.status },
    });

    return this.getExceptionById(existing.id, user);
  }

  /**
   * Assign an exception to another officer
   */
  async assignException(
    id: string | number,
    assignedToUserId: number,
    notes: string,
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<OperationalExceptionDTO> {
    const existing = await this.getExceptionById(id, user);

    const [targetUser] = await db.select().from(users).where(eq(users.id, assignedToUserId)).limit(1);
    if (!targetUser) {
      throw new BankingError('USER_NOT_FOUND', `Assignee officer user '${assignedToUserId}' does not exist.`, 404);
    }

    const now = new Date();
    await db
      .update(operationalExceptions)
      .set({
        ownerId: targetUser.id,
        ownerName: targetUser.name,
        ownerRole: targetUser.role,
        status: existing.status === 'OPEN' ? 'IN_PROGRESS' : existing.status,
        metadata: {
          ...(existing.metadata || {}),
          reassignedBy: user.name,
          reassignedAt: now.toISOString(),
          assignmentNotes: notes,
        },
        updatedAt: now,
      })
      .where(eq(operationalExceptions.id, existing.id));

    // Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_EXCEPTION_ASSIGNED',
      resourceType: 'OPERATIONAL_EXCEPTION',
      resourceId: existing.exceptionId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { assignedTo: targetUser.employeeId, assignedToName: targetUser.name, notes },
    });

    return this.getExceptionById(existing.id, user);
  }

  /**
   * Resolve an Operational Exception
   */
  async resolveException(
    id: string | number,
    resolutionNotes: string,
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<OperationalExceptionDTO> {
    const existing = await this.getExceptionById(id, user);

    if (!resolutionNotes || !resolutionNotes.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Resolution notes are required to resolve an operational exception.', 400);
    }

    const now = new Date();
    await db
      .update(operationalExceptions)
      .set({
        status: 'RESOLVED',
        resolutionNotes: resolutionNotes.trim(),
        resolvedById: user.id,
        resolvedByName: user.name,
        resolvedAt: now,
        updatedAt: now,
      })
      .where(eq(operationalExceptions.id, existing.id));

    // Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_EXCEPTION_RESOLVED',
      resourceType: 'OPERATIONAL_EXCEPTION',
      resourceId: existing.exceptionId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { resolutionNotes, resolvedBy: user.employeeId },
    });

    return this.getExceptionById(existing.id, user);
  }

  /**
   * List Reconciliation Records
   */
  async getReconciliationRecords(
    filters: {
      status?: string;
      reconciliationType?: string;
      source?: string;
      limit?: number;
    },
    user: SafeUser
  ): Promise<ReconciliationRecordDTO[]> {
    let query = db.select().from(reconciliationRecords).$dynamic();
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(reconciliationRecords.status, filters.status));
    }
    if (filters.reconciliationType) {
      conditions.push(eq(reconciliationRecords.reconciliationType, filters.reconciliationType));
    }
    if (filters.source) {
      conditions.push(eq(reconciliationRecords.source, filters.source));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(reconciliationRecords.createdAt)).limit(filters.limit || 50);
    const rows = await query;

    return rows.map((r) => ({
      id: r.id,
      reconciliationId: r.reconciliationId,
      businessDate: String(r.businessDate),
      source: r.source,
      reconciliationType: r.reconciliationType as any,
      expectedValue: Number(r.expectedValue),
      observedValue: Number(r.observedValue),
      variance: Number(r.variance),
      status: r.status as any,
      customerId: r.customerId,
      accountNumber: r.accountNumber ? maskAccountNumber(r.accountNumber) : null,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      lastChecked: new Date(r.lastChecked).toISOString(),
      notes: r.notes,
      adjustmentApprovalId: r.adjustmentApprovalId,
      resolvedAt: r.resolvedAt ? new Date(r.resolvedAt).toISOString() : null,
      resolvedById: r.resolvedById,
      metadata: r.metadata,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
    }));
  }

  /**
   * Review or change status of Reconciliation record
   */
  async reviewReconciliation(
    id: string | number,
    notes: string,
    status: 'INVESTIGATING' | 'ADJUSTMENT_PENDING' | 'RESOLVED',
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<ReconciliationRecordDTO> {
    const numId = Number(id);
    const [rec] = await db
      .select()
      .from(reconciliationRecords)
      .where(
        !isNaN(numId)
          ? or(eq(reconciliationRecords.id, numId), eq(reconciliationRecords.reconciliationId, String(id)))
          : eq(reconciliationRecords.reconciliationId, String(id))
      )
      .limit(1);

    if (!rec) {
      throw new BankingError('RECONCILIATION_NOT_FOUND', `Reconciliation record '${id}' not found.`, 404);
    }

    const now = new Date();
    await db
      .update(reconciliationRecords)
      .set({
        status,
        notes: notes ? `${rec.notes ? rec.notes + ' | ' : ''}${notes}` : rec.notes,
        ownerId: user.id,
        ownerName: user.name,
        lastChecked: now,
        updatedAt: now,
      })
      .where(eq(reconciliationRecords.id, rec.id));

    // Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_RECONCILIATION_REVIEWED',
      resourceType: 'RECONCILIATION_RECORD',
      resourceId: rec.reconciliationId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { status, notes, reviewedBy: user.employeeId },
    });

    const [updated] = await db.select().from(reconciliationRecords).where(eq(reconciliationRecords.id, rec.id));
    return {
      id: updated.id,
      reconciliationId: updated.reconciliationId,
      businessDate: String(updated.businessDate),
      source: updated.source,
      reconciliationType: updated.reconciliationType as any,
      expectedValue: Number(updated.expectedValue),
      observedValue: Number(updated.observedValue),
      variance: Number(updated.variance),
      status: updated.status as any,
      customerId: updated.customerId,
      accountNumber: updated.accountNumber ? maskAccountNumber(updated.accountNumber) : null,
      ownerId: updated.ownerId,
      ownerName: updated.ownerName,
      lastChecked: new Date(updated.lastChecked).toISOString(),
      notes: updated.notes,
      adjustmentApprovalId: updated.adjustmentApprovalId,
      resolvedAt: updated.resolvedAt ? new Date(updated.resolvedAt).toISOString() : null,
      resolvedById: updated.resolvedById,
      metadata: updated.metadata,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    };
  }

  /**
   * Resolve a Reconciliation record
   */
  async resolveReconciliation(
    id: string | number,
    resolutionNotes: string,
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<ReconciliationRecordDTO> {
    const numId = Number(id);
    const [rec] = await db
      .select()
      .from(reconciliationRecords)
      .where(
        !isNaN(numId)
          ? or(eq(reconciliationRecords.id, numId), eq(reconciliationRecords.reconciliationId, String(id)))
          : eq(reconciliationRecords.reconciliationId, String(id))
      )
      .limit(1);

    if (!rec) {
      throw new BankingError('RECONCILIATION_NOT_FOUND', `Reconciliation record '${id}' not found.`, 404);
    }

    const now = new Date();
    await db
      .update(reconciliationRecords)
      .set({
        status: 'RESOLVED',
        notes: resolutionNotes ? `${rec.notes ? rec.notes + ' | ' : ''}RESOLVED: ${resolutionNotes}` : rec.notes,
        resolvedAt: now,
        resolvedById: user.id,
        updatedAt: now,
      })
      .where(eq(reconciliationRecords.id, rec.id));

    // Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_RECONCILIATION_RESOLVED',
      resourceType: 'RECONCILIATION_RECORD',
      resourceId: rec.reconciliationId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { resolutionNotes, resolvedBy: user.employeeId },
    });

    const [updated] = await db.select().from(reconciliationRecords).where(eq(reconciliationRecords.id, rec.id));
    return {
      id: updated.id,
      reconciliationId: updated.reconciliationId,
      businessDate: String(updated.businessDate),
      source: updated.source,
      reconciliationType: updated.reconciliationType as any,
      expectedValue: Number(updated.expectedValue),
      observedValue: Number(updated.observedValue),
      variance: Number(updated.variance),
      status: updated.status as any,
      customerId: updated.customerId,
      accountNumber: updated.accountNumber ? maskAccountNumber(updated.accountNumber) : null,
      ownerId: updated.ownerId,
      ownerName: updated.ownerName,
      lastChecked: new Date(updated.lastChecked).toISOString(),
      notes: updated.notes,
      adjustmentApprovalId: updated.adjustmentApprovalId,
      resolvedAt: updated.resolvedAt ? new Date(updated.resolvedAt).toISOString() : null,
      resolvedById: updated.resolvedById,
      metadata: updated.metadata,
      createdAt: new Date(updated.createdAt).toISOString(),
      updatedAt: new Date(updated.updatedAt).toISOString(),
    };
  }

  /**
   * Fetch failed workflows with diagnostic reasons
   */
  async getFailedWorkflows(user: SafeUser): Promise<FailedWorkflowDTO[]> {
    const failedList: FailedWorkflowDTO[] = [];

    // 1. Check customer journey steps with status FAILED
    const failedSteps = await db
      .select({
        step: customerJourneySteps,
        journey: customerJourneys,
      })
      .from(customerJourneySteps)
      .innerJoin(customerJourneys, eq(customerJourneySteps.journeyId, customerJourneys.id))
      .where(eq(customerJourneySteps.status, 'FAILED'))
      .limit(10);

    for (const item of failedSteps) {
      failedList.push({
        workflowId: item.step.stepId,
        workflowType: 'CUSTOMER_JOURNEY_STEP',
        entityType: 'JOURNEY',
        entityId: String(item.journey.id),
        entityName: item.journey.name,
        failureStage: item.step.name,
        failureReason: item.step.blockedReason || 'Step execution timeout during dependency verification',
        retryAvailable: true,
        owner: item.step.ownerRole || 'OPERATIONS',
        timestamp: new Date(item.step.updatedAt).toISOString(),
        status: item.step.status,
        metadata: { journeyId: item.journey.id, stepKey: item.step.stepKey },
      });
    }

    // 2. Check operational exceptions with category WORKFLOW
    const workflowExceptions = await db
      .select()
      .from(operationalExceptions)
      .where(eq(operationalExceptions.category, 'WORKFLOW'))
      .limit(10);

    for (const ex of workflowExceptions) {
      failedList.push({
        workflowId: ex.exceptionId,
        workflowType: 'OPERATIONAL_WORKFLOW',
        entityType: ex.relatedEntityType || 'SYSTEM',
        entityId: ex.relatedEntityId || ex.exceptionId,
        entityName: ex.customerName || 'Banking Infrastructure Pipeline',
        failureStage: ex.source,
        failureReason: ex.description,
        retryAvailable: ex.status !== 'RESOLVED',
        owner: ex.ownerName || 'Branch Operations',
        timestamp: new Date(ex.createdAt).toISOString(),
        status: ex.status,
        metadata: ex.evidence,
      });
    }

    return failedList;
  }

  /**
   * Safe, Idempotent Retry of a failed workflow
   */
  async retryWorkflow(
    workflowId: string,
    workflowType: string,
    user: SafeUser,
    requestId: string = 'REQ-OPS'
  ): Promise<{ success: boolean; outcome: string; retryAttempt: number; message: string; timestamp: string }> {
    const now = new Date();

    // Query previous retry attempts for idempotency tracking
    const prevRetries = await db
      .select({ id: operationalEvents.id })
      .from(operationalEvents)
      .where(
        and(
          eq(operationalEvents.relatedEntityId, workflowId),
          eq(operationalEvents.eventType, 'WORKFLOW_RECOVERED')
        )
      );

    const retryAttempt = prevRetries.length + 1;

    // Audit the retry action
    await auditRepository.createLog({
      actorId: user.employeeId || `USR-${user.id}`,
      actorName: user.name,
      action: 'OPERATIONS_WORKFLOW_RETRIED',
      resourceType: 'WORKFLOW',
      resourceId: workflowId,
      requestId,
      outcome: 'SUCCESS',
      metadata: { workflowType, initiatedBy: user.employeeId, retryAttempt },
    });

    if (workflowType === 'CUSTOMER_JOURNEY_STEP') {
      const [step] = await db
        .select()
        .from(customerJourneySteps)
        .where(eq(customerJourneySteps.stepId, workflowId))
        .limit(1);

      if (step) {
        await db
          .update(customerJourneySteps)
          .set({
            status: 'READY',
            blockedReason: null,
            updatedAt: now,
          })
          .where(eq(customerJourneySteps.id, step.id));
      }
    } else if (workflowType === 'OPERATIONAL_WORKFLOW') {
      const [ex] = await db
        .select()
        .from(operationalExceptions)
        .where(eq(operationalExceptions.exceptionId, workflowId))
        .limit(1);

      if (ex) {
        await db
          .update(operationalExceptions)
          .set({
            status: 'IN_PROGRESS',
            updatedAt: now,
          })
          .where(eq(operationalExceptions.id, ex.id));
      }
    }

    // Emits event
    await db.insert(operationalEvents).values({
      eventId: `OEV-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      eventType: 'WORKFLOW_RECOVERED',
      severity: 'INFO',
      sourceModule: 'OPERATIONS_WORKSPACE',
      customerId: null,
      relatedEntityType: 'WORKFLOW',
      relatedEntityId: workflowId,
      title: `Workflow Retry Dispatched: ${workflowId}`,
      description: `Operator ${user.name} queued safe idempotent retry for ${workflowType} '${workflowId}' (Attempt ${retryAttempt}).`,
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      metadata: { workflowId, workflowType, retryAttempt },
    });

    return {
      success: true,
      outcome: 'RETRY_INITIATED',
      retryAttempt,
      message: `Workflow '${workflowId}' has been re-queued for governed execution (Attempt ${retryAttempt}).`,
      timestamp: now.toISOString(),
    };
  }

  /**
   * Operational Tasks requiring branch operations attention
   */
  async getOperationalTasks(user: SafeUser): Promise<OperationalTaskDTO[]> {
    const rawTasks = await db
      .select({
        task: tasks,
        customer: customers,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .where(or(eq(tasks.status, 'PENDING'), eq(tasks.status, 'IN_PROGRESS')))
      .orderBy(desc(tasks.dueDate))
      .limit(30);

    return rawTasks.map(({ task, customer }) => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
      assignedTo: task.assignedToId ? `USR-${task.assignedToId}` : 'Unassigned',
      relatedCustomerName: customer ? customer.name : undefined,
      relatedCustomerCode: customer?.customerCode || undefined,
      category: task.relatedType || 'OPERATIONAL',
    }));
  }

  /**
   * System & Operational Events Stream
   */
  async getOperationalEvents(
    filters: { severity?: string; eventType?: string; limit?: number },
    user: SafeUser
  ): Promise<OperationalEventDTO[]> {
    let query = db.select().from(operationalEvents).$dynamic();
    const conditions = [];

    if (filters.severity) {
      conditions.push(eq(operationalEvents.severity, filters.severity));
    }
    if (filters.eventType) {
      conditions.push(eq(operationalEvents.eventType, filters.eventType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    query = query.orderBy(desc(operationalEvents.createdAt)).limit(filters.limit || 50);
    const rows = await query;

    return rows.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      eventType: r.eventType as any,
      severity: r.severity as any,
      sourceModule: r.sourceModule,
      customerId: r.customerId,
      relatedEntityType: r.relatedEntityType,
      relatedEntityId: r.relatedEntityId,
      title: r.title,
      description: r.description,
      actorId: r.actorId,
      actorName: r.actorName,
      actorRole: r.actorRole,
      metadata: r.metadata,
      createdAt: new Date(r.createdAt).toISOString(),
    }));
  }
}

export const operationsService = new OperationsService();
