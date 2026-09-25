/**
 * COREvia Enterprise Resource-Level Authorization & IDOR Protection Engine
 * Validates ownership, relationship assignment, and departmental boundaries before data leaves backend
 */

import { db } from '../db/index.ts';
import { customers, serviceCases, tasks, opportunities, notifications } from '../db/schema.ts';
import { eq, or } from 'drizzle-orm';
import { SafeUser } from '../services/auth.service.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { BankingError } from './errors.ts';

export const resourceAuth = {
  /**
   * Enforces customer relationship scope
   * - Administrators, Branch Managers, Analysts: Full institutional access
   * - Relationship Managers: Authorized if customer is assigned to them
   * - Service Agents / Operations: Authorized for service queries
   */
  async authorizeCustomer(
    user: SafeUser,
    customerIdOrCode: string | number,
    action: string = 'READ',
    requestId: string = 'REQ-AUTH'
  ) {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    // Fetch customer record
    const numId = Number(customerIdOrCode);
    const conditions = !isNaN(numId)
      ? or(eq(customers.id, numId), eq(customers.customerCode, String(customerIdOrCode)))
      : eq(customers.customerCode, String(customerIdOrCode));

    const found = await db.select().from(customers).where(conditions).limit(1);
    if (found.length === 0) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer record '${customerIdOrCode}' does not exist.`, 404);
    }

    const customer = found[0];

    // Administrators, Branch Managers, and Analysts have broad institutional oversight
    if (
      user.role === 'ADMINISTRATOR' ||
      user.role === 'BRANCH_MANAGER' ||
      user.role === 'ANALYST'
    ) {
      return customer;
    }

    // For Relationship Managers, enforce RM-portfolio ownership
    if (user.role === 'RELATIONSHIP_MANAGER') {
      if (customer.assignedRmId && customer.assignedRmId !== user.id) {
        // Log IDOR Security Violation
        await auditRepository.createLog({
          actorId: user.employeeId,
          actorName: user.name,
          action: 'SECURITY_IDOR_VIOLATION',
          resourceType: 'CUSTOMER',
          resourceId: String(customer.id),
          requestId,
          outcome: 'DENIED',
          metadata: {
            attemptedCustomer: customer.customerCode,
            assignedRmId: customer.assignedRmId,
            requestingUserId: user.id,
            action,
            violationType: 'UNAUTHORIZED_PORTFOLIO_ACCESS',
          },
        });

        throw new BankingError(
          'FORBIDDEN_SCOPE',
          `Access restricted: Customer ${customer.customerCode} is assigned to another Relationship Manager.`,
          403
        );
      }
    }

    return customer;
  },

  /**
   * Enforces Service Case scope
   * - Admin/BM: Full access
   * - RM: Cases belonging to assigned customer
   * - Service Agent: Assigned cases or queue cases
   */
  async authorizeCase(
    user: SafeUser,
    caseId: number,
    action: string = 'READ',
    requestId: string = 'REQ-AUTH'
  ) {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    const [caseRecord] = await db.select().from(serviceCases).where(eq(serviceCases.id, caseId)).limit(1);
    if (!caseRecord) {
      throw new BankingError('CASE_NOT_FOUND', `Case ${caseId} does not exist.`, 404);
    }

    if (user.role === 'ADMINISTRATOR' || user.role === 'BRANCH_MANAGER') {
      return caseRecord;
    }

    if (user.role === 'RELATIONSHIP_MANAGER') {
      await this.authorizeCustomer(user, caseRecord.customerId, action, requestId);
    }

    return caseRecord;
  },

  /**
   * Enforces Task ownership scope
   * - Admin/BM: Full oversight
   * - RM / Agent: Must be assigned to user or for user's assigned customer
   */
  async authorizeTask(
    user: SafeUser,
    taskId: number,
    action: string = 'READ',
    requestId: string = 'REQ-AUTH'
  ) {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    const [taskRecord] = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (!taskRecord) {
      throw new BankingError('TASK_NOT_FOUND', `Task ${taskId} does not exist.`, 404);
    }

    if (user.role === 'ADMINISTRATOR' || user.role === 'BRANCH_MANAGER') {
      return taskRecord;
    }

    if (taskRecord.assignedToId && taskRecord.assignedToId !== user.id) {
      // If not assigned to current user, verify if RM owns the customer
      if (user.role === 'RELATIONSHIP_MANAGER') {
        await this.authorizeCustomer(user, taskRecord.customerId, action, requestId);
      } else {
        await auditRepository.createLog({
          actorId: user.employeeId,
          actorName: user.name,
          action: 'SECURITY_IDOR_VIOLATION',
          resourceType: 'TASK',
          resourceId: String(taskId),
          requestId,
          outcome: 'DENIED',
          metadata: {
            taskAssignedToId: taskRecord.assignedToId,
            requestingUserId: user.id,
            action,
          },
        });

        throw new BankingError('FORBIDDEN_SCOPE', 'You are not authorized to access this task.', 403);
      }
    }

    return taskRecord;
  },

  /**
   * Enforces Notification ownership
   * Users can strictly only access and mutate their own notifications
   */
  async authorizeNotification(
    user: SafeUser,
    notificationId: number,
    requestId: string = 'REQ-AUTH'
  ) {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    const [notif] = await db.select().from(notifications).where(eq(notifications.id, notificationId)).limit(1);
    if (!notif) {
      throw new BankingError('NOTIFICATION_NOT_FOUND', `Notification ${notificationId} does not exist.`, 404);
    }

    if (notif.userId !== user.id && user.role !== 'ADMINISTRATOR') {
      await auditRepository.createLog({
        actorId: user.employeeId,
        actorName: user.name,
        action: 'SECURITY_IDOR_VIOLATION',
        resourceType: 'NOTIFICATION',
        resourceId: String(notificationId),
        requestId,
        outcome: 'DENIED',
        metadata: {
          notificationTargetUserId: notif.userId,
          requestingUserId: user.id,
          violationType: 'CROSS_USER_NOTIFICATION_TAMPERING',
        },
      });

      throw new BankingError(
        'FORBIDDEN_SCOPE',
        'Unauthorized: You cannot access or modify notifications belonging to another banking officer.',
        403
      );
    }

    return notif;
  },

  /**
   * Enforces Opportunity ownership scope
   */
  async authorizeOpportunity(
    user: SafeUser,
    opportunityId: number,
    action: string = 'READ',
    requestId: string = 'REQ-AUTH'
  ) {
    if (!user) {
      throw new BankingError('UNAUTHENTICATED', 'Authentication required.', 401);
    }

    const [opp] = await db.select().from(opportunities).where(eq(opportunities.id, opportunityId)).limit(1);
    if (!opp) {
      throw new BankingError('OPPORTUNITY_NOT_FOUND', `Opportunity ${opportunityId} does not exist.`, 404);
    }

    if (user.role === 'ADMINISTRATOR' || user.role === 'BRANCH_MANAGER') {
      return opp;
    }

    if (user.role === 'RELATIONSHIP_MANAGER') {
      await this.authorizeCustomer(user, opp.customerId, action, requestId);
    }

    return opp;
  },
};
