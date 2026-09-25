import { notificationService, ActorContext } from './notification.service.ts';
import { db } from '../db/index.ts';
import {
  tasks,
  serviceCases,
  opportunities,
  customers,
  customerScores,
  customerInsights,
  nextBestActions,
  customerOpportunityRadar,
  users,
} from '../db/schema.ts';
import { eq, and, sql, desc, or } from 'drizzle-orm';
import {
  NotificationCategory,
  NotificationSeverity,
  NotificationType,
} from '../types/index.ts';

export const notificationRuleService = {
  // A. TASK RULES
  async evaluateTaskEvent(
    task: {
      id: number;
      title: string;
      dueDate: string | Date;
      priority?: string;
      status?: string;
      assignedToId?: number | null;
      customerId: number;
    },
    eventType: 'CREATED' | 'ASSIGNED' | 'REASSIGNED' | 'DUE_CHECK' | 'COMPLETED',
    customerName?: string,
    actorContext?: ActorContext
  ) {
    if (!task.assignedToId || task.status === 'COMPLETED' || task.status === 'CANCELLED') {
      if (eventType === 'COMPLETED') {
        // Expire existing alerts for this task
        await notificationService.expireBySource('TASK', String(task.id));
      }
      return null;
    }

    const cName = customerName || 'the customer';
    const due = new Date(task.dueDate);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const diffDays = Math.round((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (eventType === 'ASSIGNED' || eventType === 'CREATED') {
      const dedupKey = `TASK:${task.id}:ASSIGNED:${task.assignedToId}`;
      return notificationService.createNotification(
        {
          userId: task.assignedToId,
          customerId: task.customerId,
          notificationType: 'TASK_ASSIGNED',
          category: 'TASK',
          severity: 'INFO',
          title: 'New Task Assigned',
          message: `Task "${task.title}" for ${cName} has been assigned to you.`,
          actionLabel: 'Open Task',
          actionUrl: `/tasks?id=${task.id}`,
          sourceEntityType: 'TASK',
          sourceEntityId: String(task.id),
          metadata: { taskId: task.id, priority: task.priority, dueDate: task.dueDate },
          dedupKey,
        },
        actorContext
      );
    }

    if (eventType === 'REASSIGNED') {
      const dedupKey = `TASK:${task.id}:REASSIGNED:${task.assignedToId}`;
      return notificationService.createNotification(
        {
          userId: task.assignedToId,
          customerId: task.customerId,
          notificationType: 'TASK_REASSIGNED',
          category: 'TASK',
          severity: 'INFO',
          title: 'Task Reassigned',
          message: `Task "${task.title}" for ${cName} was reassigned to you.`,
          actionLabel: 'Open Task',
          actionUrl: `/tasks?id=${task.id}`,
          sourceEntityType: 'TASK',
          sourceEntityId: String(task.id),
          metadata: { taskId: task.id, priority: task.priority, dueDate: task.dueDate },
          dedupKey,
        },
        actorContext
      );
    }

    // Due check / scheduled evaluation
    if (diffDays < 0) {
      // Overdue
      const daysOverdue = Math.abs(diffDays);
      const dedupKey = `TASK:${task.id}:OVERDUE:${now.toISOString().slice(0, 10)}`;
      return notificationService.createNotification(
        {
          userId: task.assignedToId,
          customerId: task.customerId,
          notificationType: 'TASK_OVERDUE',
          category: 'TASK',
          severity: 'WARNING',
          title: 'Follow-up Task Overdue',
          message: `Customer follow-up "${task.title}" for ${cName} is overdue by ${daysOverdue} day${daysOverdue > 1 ? 's' : ''}.`,
          actionLabel: 'Open Task',
          actionUrl: `/tasks?id=${task.id}`,
          sourceEntityType: 'TASK',
          sourceEntityId: String(task.id),
          metadata: { taskId: task.id, daysOverdue, dueDate: task.dueDate },
          dedupKey,
        },
        actorContext
      );
    } else if (diffDays <= 2) {
      // Due soon
      const dedupKey = `TASK:${task.id}:DUE_SOON:${now.toISOString().slice(0, 10)}`;
      return notificationService.createNotification(
        {
          userId: task.assignedToId,
          customerId: task.customerId,
          notificationType: 'TASK_DUE_SOON',
          category: 'TASK',
          severity: 'WARNING',
          title: 'Task Approaching Due Date',
          message: `Task "${task.title}" for ${cName} is due in ${diffDays === 0 ? 'today' : `${diffDays} day(s)`}.`,
          actionLabel: 'Open Task',
          actionUrl: `/tasks?id=${task.id}`,
          sourceEntityType: 'TASK',
          sourceEntityId: String(task.id),
          metadata: { taskId: task.id, daysRemaining: diffDays, dueDate: task.dueDate },
          dedupKey,
        },
        actorContext
      );
    }

    return null;
  },

  // B. SERVICE DESK / CASE RULES
  async evaluateCaseEvent(
    serviceCase: {
      id: number;
      caseNumber: string;
      title: string;
      category: string;
      priority: string;
      status: string;
      assignedToId?: number | null;
      customerId: number;
      slaDueDate?: string | Date | null;
    },
    eventType: 'ASSIGNED' | 'ESCALATED' | 'SLA_CHECK' | 'RESOLVED',
    customerName?: string,
    actorContext?: ActorContext
  ) {
    if (!serviceCase.assignedToId) return null;
    const cName = customerName || 'the customer';

    if (eventType === 'RESOLVED') {
      await notificationService.expireBySource('CASE', String(serviceCase.id));
      const dedupKey = `CASE:${serviceCase.id}:RESOLVED`;
      return notificationService.createNotification(
        {
          userId: serviceCase.assignedToId,
          customerId: serviceCase.customerId,
          notificationType: 'SERVICE_CASE_RESOLVED',
          category: 'SERVICE',
          severity: 'SUCCESS',
          title: 'Service Case Resolved',
          message: `Case ${serviceCase.caseNumber} for ${cName} has been successfully resolved.`,
          actionLabel: 'Open Case',
          actionUrl: `/service-desk?caseId=${serviceCase.caseNumber}`,
          sourceEntityType: 'CASE',
          sourceEntityId: String(serviceCase.id),
          metadata: { caseNumber: serviceCase.caseNumber, category: serviceCase.category },
          dedupKey,
        },
        actorContext
      );
    }

    if (eventType === 'ESCALATED' || serviceCase.status === 'ESCALATED') {
      const dedupKey = `CASE:${serviceCase.id}:ESCALATED`;
      return notificationService.createNotification(
        {
          userId: serviceCase.assignedToId,
          customerId: serviceCase.customerId,
          notificationType: 'SERVICE_CASE_ESCALATED',
          category: 'SERVICE',
          severity: 'CRITICAL',
          title: 'Service Case Escalated',
          message: `Case ${serviceCase.caseNumber} (${serviceCase.category}) for ${cName} has been escalated: ${serviceCase.title}.`,
          actionLabel: 'Open Case',
          actionUrl: `/service-desk?caseId=${serviceCase.caseNumber}`,
          sourceEntityType: 'CASE',
          sourceEntityId: String(serviceCase.id),
          metadata: { caseNumber: serviceCase.caseNumber, priority: serviceCase.priority },
          dedupKey,
        },
        actorContext
      );
    }

    if (eventType === 'ASSIGNED') {
      const dedupKey = `CASE:${serviceCase.id}:ASSIGNED:${serviceCase.assignedToId}`;
      return notificationService.createNotification(
        {
          userId: serviceCase.assignedToId,
          customerId: serviceCase.customerId,
          notificationType: 'SERVICE_CASE_ASSIGNED',
          category: 'SERVICE',
          severity: 'INFO',
          title: 'Service Case Assigned',
          message: `Case ${serviceCase.caseNumber} (${serviceCase.category}) for ${cName} has been assigned to you.`,
          actionLabel: 'Open Case',
          actionUrl: `/service-desk?caseId=${serviceCase.caseNumber}`,
          sourceEntityType: 'CASE',
          sourceEntityId: String(serviceCase.id),
          metadata: { caseNumber: serviceCase.caseNumber },
          dedupKey,
        },
        actorContext
      );
    }

    // SLA Evaluation
    if (serviceCase.slaDueDate && serviceCase.status !== 'RESOLVED' && serviceCase.status !== 'CLOSED') {
      const slaDate = new Date(serviceCase.slaDueDate);
      const now = new Date();
      const diffMinutes = Math.round((slaDate.getTime() - now.getTime()) / (1000 * 60));

      if (diffMinutes < 0) {
        // SLA Breached
        const dedupKey = `CASE:${serviceCase.id}:SLA_BREACHED`;
        return notificationService.createNotification(
          {
            userId: serviceCase.assignedToId,
            customerId: serviceCase.customerId,
            notificationType: 'SERVICE_SLA_BREACHED',
            category: 'SERVICE',
            severity: 'CRITICAL',
            title: 'SLA Breached',
            message: `Case ${serviceCase.caseNumber} for ${cName} has breached its service SLA deadline. Immediate resolution required.`,
            actionLabel: 'Open Case',
            actionUrl: `/service-desk?caseId=${serviceCase.caseNumber}`,
            sourceEntityType: 'CASE',
            sourceEntityId: String(serviceCase.id),
            metadata: { caseNumber: serviceCase.caseNumber, slaDueDate: serviceCase.slaDueDate },
            dedupKey,
          },
          actorContext
        );
      } else if (diffMinutes <= 240) {
        // Within 4 hours -> SLA at risk
        const hours = Math.max(1, Math.round(diffMinutes / 60));
        const dedupKey = `CASE:${serviceCase.id}:SLA_AT_RISK:${now.toISOString().slice(0, 13)}`;
        return notificationService.createNotification(
          {
            userId: serviceCase.assignedToId,
            customerId: serviceCase.customerId,
            notificationType: 'SERVICE_SLA_AT_RISK',
            category: 'SERVICE',
            severity: 'WARNING',
            title: 'SLA At Risk',
            message: `Case ${serviceCase.caseNumber} for ${cName} is approaching its SLA deadline (${hours} hour${hours > 1 ? 's' : ''} remaining).`,
            actionLabel: 'Open Case',
            actionUrl: `/service-desk?caseId=${serviceCase.caseNumber}`,
            sourceEntityType: 'CASE',
            sourceEntityId: String(serviceCase.id),
            metadata: { caseNumber: serviceCase.caseNumber, hoursRemaining: hours, slaDueDate: serviceCase.slaDueDate },
            dedupKey,
          },
          actorContext
        );
      }
    }

    return null;
  },

  // C. OPPORTUNITY RULES
  async evaluateOpportunityEvent(
    opp: {
      id: number;
      opportunityCode: string;
      title: string;
      stage: string;
      expectedCloseDate?: string | Date | null;
      assignedToId?: number | null;
      customerId: number;
      expectedValue?: string | number;
    },
    eventType: 'ASSIGNED' | 'STAGE_CHANGED' | 'CLOSING_CHECK',
    customerName?: string,
    actorContext?: ActorContext
  ) {
    if (!opp.assignedToId) return null;
    const cName = customerName || 'the customer';

    if (opp.stage === 'WON' || opp.stage === 'LOST') {
      await notificationService.expireBySource('OPPORTUNITY', String(opp.id));
    }

    if (eventType === 'STAGE_CHANGED') {
      const dedupKey = `OPP:${opp.id}:STAGE:${opp.stage}`;
      const isWon = opp.stage === 'WON';
      return notificationService.createNotification(
        {
          userId: opp.assignedToId,
          customerId: opp.customerId,
          notificationType: 'OPPORTUNITY_STAGE_CHANGED',
          category: 'OPPORTUNITY',
          severity: isWon ? 'SUCCESS' : 'INFO',
          title: isWon ? 'Opportunity Won' : 'Opportunity Stage Updated',
          message: `${opp.title} for ${cName} moved to stage ${opp.stage}.`,
          actionLabel: 'Open Opportunity',
          actionUrl: `/opportunities?code=${opp.opportunityCode}`,
          sourceEntityType: 'OPPORTUNITY',
          sourceEntityId: String(opp.id),
          metadata: { oppCode: opp.opportunityCode, stage: opp.stage, value: opp.expectedValue },
          dedupKey,
        },
        actorContext
      );
    }

    if (eventType === 'ASSIGNED') {
      const dedupKey = `OPP:${opp.id}:ASSIGNED:${opp.assignedToId}`;
      return notificationService.createNotification(
        {
          userId: opp.assignedToId,
          customerId: opp.customerId,
          notificationType: 'OPPORTUNITY_ASSIGNED',
          category: 'OPPORTUNITY',
          severity: 'INFO',
          title: 'Opportunity Assigned',
          message: `Deal "${opp.title}" for ${cName} has been assigned to your relationship portfolio.`,
          actionLabel: 'Open Opportunity',
          actionUrl: `/opportunities?code=${opp.opportunityCode}`,
          sourceEntityType: 'OPPORTUNITY',
          sourceEntityId: String(opp.id),
          metadata: { oppCode: opp.opportunityCode, stage: opp.stage },
          dedupKey,
        },
        actorContext
      );
    }

    // Closing soon check (within 7 days)
    if (opp.expectedCloseDate && opp.stage !== 'WON' && opp.stage !== 'LOST') {
      const closeDate = new Date(opp.expectedCloseDate);
      const now = new Date();
      const diffDays = Math.round((closeDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 7) {
        const dedupKey = `OPP:${opp.id}:CLOSING_SOON:${now.toISOString().slice(0, 10)}`;
        return notificationService.createNotification(
          {
            userId: opp.assignedToId,
            customerId: opp.customerId,
            notificationType: 'OPPORTUNITY_CLOSING_SOON',
            category: 'OPPORTUNITY',
            severity: 'WARNING',
            title: 'Opportunity Closing Soon',
            message: `"${opp.title}" for ${cName} has ${diffDays} day${diffDays === 1 ? '' : 's'} remaining to expected close.`,
            actionLabel: 'Open Opportunity',
            actionUrl: `/opportunities?code=${opp.opportunityCode}`,
            sourceEntityType: 'OPPORTUNITY',
            sourceEntityId: String(opp.id),
            metadata: { oppCode: opp.opportunityCode, daysRemaining: diffDays, stage: opp.stage },
            dedupKey,
          },
          actorContext
        );
      }
    }

    return null;
  },

  // D. CORE SCORE RULES
  async evaluateScoreChange(
    customerId: number,
    previousScore: number,
    currentScore: number,
    assignedRmId?: number | null,
    customerName?: string,
    actorContext?: ActorContext
  ) {
    if (!assignedRmId) return null;
    const delta = currentScore - previousScore;
    // Only notify on meaningful changes (>= 5 points)
    if (Math.abs(delta) < 5) return null;

    const cName = customerName || 'Customer';
    const isDecline = delta < 0;
    const dedupKey = `SCORE:${customerId}:${previousScore}->${currentScore}`;

    return notificationService.createNotification(
      {
        userId: assignedRmId,
        customerId,
        notificationType: isDecline ? 'RELATIONSHIP_SCORE_DECLINED' : 'RELATIONSHIP_SCORE_IMPROVED',
        category: 'RELATIONSHIP',
        severity: isDecline ? 'WARNING' : 'SUCCESS',
        title: isDecline ? 'Relationship Health Changed' : 'Relationship Health Improved',
        message: `${cName}'s CORE Score ${isDecline ? 'decreased' : 'increased'} from ${previousScore} to ${currentScore} (${isDecline ? '' : '+'}${delta} pts).`,
        actionLabel: 'View Customer',
        actionUrl: `/customers?id=${customerId}&tab=KYC`,
        sourceEntityType: 'CORE_SCORE',
        sourceEntityId: String(customerId),
        metadata: {
          previousScore,
          currentScore,
          delta,
          scoreCategory: currentScore >= 75 ? 'OPTIMAL' : currentScore >= 50 ? 'WATCH' : 'CRITICAL',
        },
        dedupKey,
      },
      actorContext
    );
  },

  // E. RELATIONSHIP INTELLIGENCE RULES
  async evaluateRelationshipInsight(
    insight: {
      id: number;
      insightId?: string;
      title: string;
      summary?: string;
      priority: string;
      status: string;
      customerId: number;
    },
    assignedRmId?: number | null,
    customerName?: string,
    actorContext?: ActorContext
  ) {
    if (!assignedRmId || insight.status !== 'ACTIVE') return null;
    if (insight.priority !== 'HIGH' && insight.priority !== 'CRITICAL') return null;

    const cName = customerName || 'the customer';
    const dedupKey = `RI:${insight.id}:${insight.priority}`;

    return notificationService.createNotification(
      {
        userId: assignedRmId,
        customerId: insight.customerId,
        notificationType: 'RELATIONSHIP_INTELLIGENCE_ALERT',
        category: 'RELATIONSHIP',
        severity: insight.priority === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: 'Relationship Concern Detected',
        message: `${insight.summary || insight.title} for ${cName}.`,
        actionLabel: 'View Intelligence',
        actionUrl: `/customers?id=${insight.customerId}&tab=INTELLIGENCE`,
        sourceEntityType: 'RELATIONSHIP_INTELLIGENCE',
        sourceEntityId: String(insight.id),
        metadata: { insightId: insight.insightId || insight.id, priority: insight.priority },
        dedupKey,
      },
      actorContext
    );
  },

  // F. NEXT BEST ACTION RULES
  async evaluateNextBestAction(
    nba: {
      id: number;
      actionId?: string;
      title: string;
      priority: string;
      status: string;
      customerId: number;
    },
    assignedRmId?: number | null,
    customerName?: string,
    actorContext?: ActorContext
  ) {
    if (!assignedRmId || nba.status !== 'ACTIVE') return null;
    if (nba.priority !== 'HIGH' && nba.priority !== 'CRITICAL') return null;

    const cName = customerName || 'the customer';
    const dedupKey = `NBA:${nba.id}:${nba.priority}`;

    return notificationService.createNotification(
      {
        userId: assignedRmId,
        customerId: nba.customerId,
        notificationType: 'NEXT_BEST_ACTION_AVAILABLE',
        category: 'RELATIONSHIP',
        severity: 'INFO',
        title: 'Priority Action Available',
        message: `High-priority relationship action available for ${cName}: "${nba.title}".`,
        actionLabel: 'Review Action',
        actionUrl: `/customers?id=${nba.customerId}&tab=ACTIONS`,
        sourceEntityType: 'NBA',
        sourceEntityId: String(nba.id),
        metadata: { actionId: nba.actionId || nba.id, priority: nba.priority },
        dedupKey,
      },
      actorContext
    );
  },

  // G. OPPORTUNITY RADAR RULES
  async evaluateRadarSignal(
    radar: {
      id: number;
      radarId?: string;
      title: string;
      priority: string;
      status: string;
      confidence: string;
      customerId: number;
      serviceDeprioritized?: boolean;
      healthGateApplied?: boolean;
    },
    assignedRmId?: number | null,
    customerName?: string,
    actorContext?: ActorContext
  ) {
    if (!assignedRmId || radar.status !== 'DETECTED') return null;
    // Strict safety gates check: Do NOT notify if service-first safety gate or health gate suppressed it
    if (radar.serviceDeprioritized || radar.healthGateApplied) return null;
    if (radar.confidence !== 'HIGH' && radar.priority !== 'HIGH' && radar.priority !== 'CRITICAL') return null;

    const cName = customerName || 'the customer';
    const dedupKey = `RADAR:${radar.id}:${radar.priority}`;

    return notificationService.createNotification(
      {
        userId: assignedRmId,
        customerId: radar.customerId,
        notificationType: 'OPPORTUNITY_RADAR_SIGNAL',
        category: 'OPPORTUNITY',
        severity: 'INFO',
        title: 'Relationship Opportunity Signal',
        message: `${cName} may have an uncovered product opportunity: ${radar.title}.`,
        actionLabel: 'Review Radar',
        actionUrl: `/customers?id=${radar.customerId}&tab=RADAR`,
        sourceEntityType: 'RADAR',
        sourceEntityId: String(radar.id),
        metadata: { radarId: radar.radarId || radar.id, confidence: radar.confidence },
        dedupKey,
      },
      actorContext
    );
  },

  // H. OPERATIONAL SCAN FOR USER / RM PORTFOLIO
  async runOperationalScan(userId: number, actorContext?: ActorContext) {
    try {
      // 1. Get user details
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return;

      // 2. Scan active tasks assigned to user
      const userTasks = await db
        .select({
          task: tasks,
          customerName: customers.name,
        })
        .from(tasks)
        .leftJoin(customers, eq(tasks.customerId, customers.id))
        .where(
          and(
            eq(tasks.assignedToId, userId),
            or(eq(tasks.status, 'PENDING'), eq(tasks.status, 'IN_PROGRESS'))
          )
        );

      for (const t of userTasks) {
        await this.evaluateTaskEvent(t.task, 'DUE_CHECK', t.customerName || undefined, actorContext);
      }

      // 3. Scan active service cases assigned to user (or branch operations)
      const userCases = await db
        .select({
          serviceCase: serviceCases,
          customerName: customers.name,
        })
        .from(serviceCases)
        .leftJoin(customers, eq(serviceCases.customerId, customers.id))
        .where(
          and(
            eq(serviceCases.assignedToId, userId),
            or(eq(serviceCases.status, 'OPEN'), eq(serviceCases.status, 'IN_PROGRESS'), eq(serviceCases.status, 'ESCALATED'))
          )
        );

      for (const c of userCases) {
        await this.evaluateCaseEvent(c.serviceCase, 'SLA_CHECK', c.customerName || undefined, actorContext);
      }

      // 4. Scan opportunities assigned to user
      const userOpps = await db
        .select({
          opportunity: opportunities,
          customerName: customers.name,
        })
        .from(opportunities)
        .leftJoin(customers, eq(opportunities.customerId, customers.id))
        .where(
          and(
            eq(opportunities.assignedToId, userId),
            sql`${opportunities.stage} NOT IN ('WON', 'LOST')`
          )
        );

      for (const o of userOpps) {
        await this.evaluateOpportunityEvent(o.opportunity, 'CLOSING_CHECK', o.customerName || undefined, actorContext);
      }

      // 5. Scan assigned customers for high-priority insights, NBAs, and radar signals
      const assignedCustomers = await db
        .select()
        .from(customers)
        .where(eq(customers.assignedRmId, userId));

      for (const cust of assignedCustomers) {
        // Check active insights
        const insights = await db
          .select()
          .from(customerInsights)
          .where(and(eq(customerInsights.customerId, cust.id), eq(customerInsights.status, 'ACTIVE')))
          .limit(3);

        for (const ins of insights) {
          await this.evaluateRelationshipInsight(ins, userId, cust.name, actorContext);
        }

        // Check active top NBAs
        const nbas = await db
          .select()
          .from(nextBestActions)
          .where(and(eq(nextBestActions.customerId, cust.id), eq(nextBestActions.status, 'ACTIVE')))
          .limit(2);

        for (const n of nbas) {
          await this.evaluateNextBestAction(n, userId, cust.name, actorContext);
        }

        // Check detected radar signals
        const radars = await db
          .select()
          .from(customerOpportunityRadar)
          .where(and(eq(customerOpportunityRadar.customerId, cust.id), eq(customerOpportunityRadar.status, 'DETECTED')))
          .limit(2);

        for (const r of radars) {
          await this.evaluateRadarSignal(r, userId, cust.name, actorContext);
        }
      }
    } catch (err) {
      console.error('[notificationRuleService.runOperationalScan] Error during scan:', err);
    }
  },
};
