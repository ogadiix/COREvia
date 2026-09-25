import { eq, desc, and, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { notifications, userNotificationPreferences, customers, users } from '../db/schema.ts';
import {
  NotificationItem,
  NotificationCategory,
  NotificationSeverity,
  NotificationStatus,
  NotificationType,
  UserNotificationPreferences,
  NotificationFilter,
  NotificationSummaryStats,
} from '../types/index.ts';

export interface CreateNotificationInput {
  userId: number;
  customerId?: number | null;
  notificationType: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  metadata?: Record<string, any> | null;
  status?: NotificationStatus;
  expiresAt?: Date | null;
  dedupKey?: string | null;
}

export const notificationRepository = {
  async findMany(userId: number, filters: NotificationFilter = {}): Promise<{ data: NotificationItem[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 25));
    const offset = (page - 1) * limit;

    const conditions = [eq(notifications.userId, userId)];

    if (filters.status && filters.status !== 'ALL') {
      conditions.push(eq(notifications.status, filters.status));
    }
    if (filters.category && filters.category !== 'ALL') {
      conditions.push(eq(notifications.category, filters.category));
    }
    if (filters.severity && filters.severity !== 'ALL') {
      conditions.push(eq(notifications.severity, filters.severity));
    }
    if (filters.notificationType) {
      conditions.push(eq(notifications.notificationType, filters.notificationType));
    }
    if (filters.customerId) {
      conditions.push(eq(notifications.customerId, filters.customerId));
    }

    const whereClause = and(...conditions);

    // Total count query
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(whereClause);
    const total = countResult?.count || 0;

    // Severity order expression for banking operational triage: CRITICAL (1), WARNING (2), INFO (3), SUCCESS (4)
    const severityOrder = sql`CASE 
      WHEN ${notifications.severity} = 'CRITICAL' THEN 1 
      WHEN ${notifications.severity} = 'WARNING' THEN 2 
      WHEN ${notifications.severity} = 'INFO' THEN 3 
      ELSE 4 
    END`;

    const rows = await db
      .select({
        notif: notifications,
        customerName: customers.name,
        customerCode: customers.customerCode,
      })
      .from(notifications)
      .leftJoin(customers, eq(notifications.customerId, customers.id))
      .where(whereClause)
      .orderBy(severityOrder, desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    const data: NotificationItem[] = rows.map((r) => ({
      id: r.notif.id,
      userId: r.notif.userId,
      customerId: r.notif.customerId,
      customerName: r.customerName || null,
      customerCode: r.customerCode || null,
      notificationType: r.notif.notificationType as NotificationType,
      category: r.notif.category as NotificationCategory,
      severity: r.notif.severity as NotificationSeverity,
      title: r.notif.title,
      message: r.notif.message,
      actionLabel: r.notif.actionLabel,
      actionUrl: r.notif.actionUrl,
      sourceEntityType: r.notif.sourceEntityType,
      sourceEntityId: r.notif.sourceEntityId,
      metadata: r.notif.metadata ? JSON.parse(r.notif.metadata) : null,
      status: r.notif.status as NotificationStatus,
      isRead: r.notif.status === 'READ' || r.notif.status === 'ACKNOWLEDGED' || r.notif.isRead,
      linkUrl: r.notif.actionUrl || r.notif.linkUrl,
      readAt: r.notif.readAt ? r.notif.readAt.toISOString() : null,
      acknowledgedAt: r.notif.acknowledgedAt ? r.notif.acknowledgedAt.toISOString() : null,
      expiresAt: r.notif.expiresAt ? r.notif.expiresAt.toISOString() : null,
      dedupKey: r.notif.dedupKey,
      createdAt: r.notif.createdAt.toISOString(),
    }));

    return { data, total, page, limit };
  },

  async findById(id: number, userId?: number): Promise<NotificationItem | null> {
    const conditions = [eq(notifications.id, id)];
    if (userId !== undefined) {
      conditions.push(eq(notifications.userId, userId));
    }

    const rows = await db
      .select({
        notif: notifications,
        customerName: customers.name,
        customerCode: customers.customerCode,
      })
      .from(notifications)
      .leftJoin(customers, eq(notifications.customerId, customers.id))
      .where(and(...conditions))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.notif.id,
      userId: r.notif.userId,
      customerId: r.notif.customerId,
      customerName: r.customerName || null,
      customerCode: r.customerCode || null,
      notificationType: r.notif.notificationType as NotificationType,
      category: r.notif.category as NotificationCategory,
      severity: r.notif.severity as NotificationSeverity,
      title: r.notif.title,
      message: r.notif.message,
      actionLabel: r.notif.actionLabel,
      actionUrl: r.notif.actionUrl,
      sourceEntityType: r.notif.sourceEntityType,
      sourceEntityId: r.notif.sourceEntityId,
      metadata: r.notif.metadata ? JSON.parse(r.notif.metadata) : null,
      status: r.notif.status as NotificationStatus,
      isRead: r.notif.status === 'READ' || r.notif.status === 'ACKNOWLEDGED' || r.notif.isRead,
      linkUrl: r.notif.actionUrl || r.notif.linkUrl,
      readAt: r.notif.readAt ? r.notif.readAt.toISOString() : null,
      acknowledgedAt: r.notif.acknowledgedAt ? r.notif.acknowledgedAt.toISOString() : null,
      expiresAt: r.notif.expiresAt ? r.notif.expiresAt.toISOString() : null,
      dedupKey: r.notif.dedupKey,
      createdAt: r.notif.createdAt.toISOString(),
    };
  },

  async countUnread(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, 'UNREAD')
        )
      );
    return result?.count || 0;
  },

  async getSummaryStats(userId: number): Promise<NotificationSummaryStats> {
    const rows = await db
      .select({
        status: notifications.status,
        severity: notifications.severity,
        category: notifications.category,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          sql`${notifications.status} != 'EXPIRED' AND ${notifications.status} != 'DISMISSED'`
        )
      );

    let unreadCount = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let infoCount = 0;
    let serviceCount = 0;
    let taskCount = 0;
    let opportunityCount = 0;
    let relationshipCount = 0;

    for (const r of rows) {
      if (r.status === 'UNREAD') unreadCount++;
      if (r.severity === 'CRITICAL') criticalCount++;
      else if (r.severity === 'WARNING') warningCount++;
      else if (r.severity === 'INFO') infoCount++;

      if (r.category === 'SERVICE') serviceCount++;
      else if (r.category === 'TASK') taskCount++;
      else if (r.category === 'OPPORTUNITY') opportunityCount++;
      else if (r.category === 'RELATIONSHIP') relationshipCount++;
    }

    return {
      totalCount: rows.length,
      unreadCount,
      criticalCount,
      warningCount,
      infoCount,
      serviceCount,
      taskCount,
      opportunityCount,
      relationshipCount,
    };
  },

  async findByDedupKey(userId: number, dedupKey: string, activeOnly = true): Promise<NotificationItem | null> {
    if (!dedupKey) return null;
    const conditions = [
      eq(notifications.userId, userId),
      eq(notifications.dedupKey, dedupKey),
    ];
    if (activeOnly) {
      conditions.push(sql`${notifications.status} NOT IN ('EXPIRED', 'DISMISSED')`);
    }

    const rows = await db
      .select()
      .from(notifications)
      .where(and(...conditions))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      userId: r.userId,
      customerId: r.customerId,
      notificationType: r.notificationType as NotificationType,
      category: r.category as NotificationCategory,
      severity: r.severity as NotificationSeverity,
      title: r.title,
      message: r.message,
      actionLabel: r.actionLabel,
      actionUrl: r.actionUrl,
      sourceEntityType: r.sourceEntityType,
      sourceEntityId: r.sourceEntityId,
      metadata: r.metadata ? JSON.parse(r.metadata) : null,
      status: r.status as NotificationStatus,
      isRead: r.status === 'READ' || r.status === 'ACKNOWLEDGED' || r.isRead,
      linkUrl: r.actionUrl || r.linkUrl,
      readAt: r.readAt ? r.readAt.toISOString() : null,
      acknowledgedAt: r.acknowledgedAt ? r.acknowledgedAt.toISOString() : null,
      expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
      dedupKey: r.dedupKey,
      createdAt: r.createdAt.toISOString(),
    };
  },

  async create(input: CreateNotificationInput): Promise<NotificationItem> {
    const [inserted] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        customerId: input.customerId || null,
        notificationType: input.notificationType,
        category: input.category,
        severity: input.severity,
        title: input.title,
        message: input.message,
        actionLabel: input.actionLabel || null,
        actionUrl: input.actionUrl || null,
        sourceEntityType: input.sourceEntityType || null,
        sourceEntityId: input.sourceEntityId || null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        status: input.status || 'UNREAD',
        isRead: input.status === 'READ' || input.status === 'ACKNOWLEDGED',
        linkUrl: input.actionUrl || null,
        expiresAt: input.expiresAt || null,
        dedupKey: input.dedupKey || null,
      })
      .returning();

    return {
      id: inserted.id,
      userId: inserted.userId,
      customerId: inserted.customerId,
      notificationType: inserted.notificationType as NotificationType,
      category: inserted.category as NotificationCategory,
      severity: inserted.severity as NotificationSeverity,
      title: inserted.title,
      message: inserted.message,
      actionLabel: inserted.actionLabel,
      actionUrl: inserted.actionUrl,
      sourceEntityType: inserted.sourceEntityType,
      sourceEntityId: inserted.sourceEntityId,
      metadata: inserted.metadata ? JSON.parse(inserted.metadata) : null,
      status: inserted.status as NotificationStatus,
      isRead: inserted.isRead,
      linkUrl: inserted.linkUrl,
      readAt: inserted.readAt ? inserted.readAt.toISOString() : null,
      acknowledgedAt: inserted.acknowledgedAt ? inserted.acknowledgedAt.toISOString() : null,
      expiresAt: inserted.expiresAt ? inserted.expiresAt.toISOString() : null,
      dedupKey: inserted.dedupKey,
      createdAt: inserted.createdAt.toISOString(),
    };
  },

  async markAsRead(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({
        status: 'READ',
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });

    return result.length > 0;
  },

  async markAllAsRead(userId: number): Promise<number> {
    const updated = await db
      .update(notifications)
      .set({
        status: 'READ',
        isRead: true,
        readAt: new Date(),
      })
      .where(and(eq(notifications.userId, userId), eq(notifications.status, 'UNREAD')))
      .returning({ id: notifications.id });

    return updated.length;
  },

  async acknowledge(id: number, userId: number): Promise<boolean> {
    const now = new Date();
    const result = await db
      .update(notifications)
      .set({
        status: 'ACKNOWLEDGED',
        isRead: true,
        acknowledgedAt: now,
        readAt: sql`COALESCE(${notifications.readAt}, ${now})`,
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });

    return result.length > 0;
  },

  async dismiss(id: number, userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({
        status: 'DISMISSED',
      })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning({ id: notifications.id });

    return result.length > 0;
  },

  async expireBySource(sourceEntityType: string, sourceEntityId: string): Promise<number> {
    const updated = await db
      .update(notifications)
      .set({
        status: 'EXPIRED',
      })
      .where(
        and(
          eq(notifications.sourceEntityType, sourceEntityType),
          eq(notifications.sourceEntityId, sourceEntityId),
          sql`${notifications.status} NOT IN ('EXPIRED', 'DISMISSED')`
        )
      )
      .returning({ id: notifications.id });

    return updated.length;
  },

  // User Preferences
  async getUserPreferences(userId: number): Promise<UserNotificationPreferences> {
    const [existing] = await db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, userId))
      .limit(1);

    if (existing) {
      return {
        id: existing.id,
        userId: existing.userId,
        serviceAlerts: existing.serviceAlerts,
        taskAlerts: existing.taskAlerts,
        opportunityAlerts: existing.opportunityAlerts,
        relationshipAlerts: existing.relationshipAlerts,
        customerActivity: existing.customerActivity,
        operationalAlerts: existing.operationalAlerts,
        systemAlerts: existing.systemAlerts,
        criticalAlertsLocked: true,
        updatedAt: existing.updatedAt.toISOString(),
      };
    }

    // Initialize default preferences
    const [created] = await db
      .insert(userNotificationPreferences)
      .values({
        userId,
        serviceAlerts: true,
        taskAlerts: true,
        opportunityAlerts: true,
        relationshipAlerts: true,
        customerActivity: true,
        operationalAlerts: true,
        systemAlerts: true,
      })
      .returning();

    return {
      id: created.id,
      userId: created.userId,
      serviceAlerts: created.serviceAlerts,
      taskAlerts: created.taskAlerts,
      opportunityAlerts: created.opportunityAlerts,
      relationshipAlerts: created.relationshipAlerts,
      customerActivity: created.customerActivity,
      operationalAlerts: created.operationalAlerts,
      systemAlerts: created.systemAlerts,
      criticalAlertsLocked: true,
      updatedAt: created.updatedAt.toISOString(),
    };
  },

  async updateUserPreferences(
    userId: number,
    prefs: Partial<UserNotificationPreferences>
  ): Promise<UserNotificationPreferences> {
    // Ensure critical alerts are never disabled
    await this.getUserPreferences(userId); // ensure row exists

    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (typeof prefs.serviceAlerts === 'boolean') updatePayload.serviceAlerts = prefs.serviceAlerts;
    if (typeof prefs.taskAlerts === 'boolean') updatePayload.taskAlerts = prefs.taskAlerts;
    if (typeof prefs.opportunityAlerts === 'boolean') updatePayload.opportunityAlerts = prefs.opportunityAlerts;
    if (typeof prefs.relationshipAlerts === 'boolean') updatePayload.relationshipAlerts = prefs.relationshipAlerts;
    if (typeof prefs.customerActivity === 'boolean') updatePayload.customerActivity = prefs.customerActivity;
    if (typeof prefs.operationalAlerts === 'boolean') updatePayload.operationalAlerts = prefs.operationalAlerts;
    if (typeof prefs.systemAlerts === 'boolean') updatePayload.systemAlerts = prefs.systemAlerts;

    const [updated] = await db
      .update(userNotificationPreferences)
      .set(updatePayload)
      .where(eq(userNotificationPreferences.userId, userId))
      .returning();

    return {
      id: updated.id,
      userId: updated.userId,
      serviceAlerts: updated.serviceAlerts,
      taskAlerts: updated.taskAlerts,
      opportunityAlerts: updated.opportunityAlerts,
      relationshipAlerts: updated.relationshipAlerts,
      customerActivity: updated.customerActivity,
      operationalAlerts: updated.operationalAlerts,
      systemAlerts: updated.systemAlerts,
      criticalAlertsLocked: true,
      updatedAt: updated.updatedAt.toISOString(),
    };
  },
};
