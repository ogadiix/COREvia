import { notificationRepository, CreateNotificationInput } from '../repositories/notification.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import {
  NotificationItem,
  NotificationFilter,
  NotificationSummaryStats,
  UserNotificationPreferences,
  NotificationCategory,
} from '../types/index.ts';

export interface ActorContext {
  userId: number | string;
  name: string;
  role?: string;
  requestId?: string;
}

export const notificationService = {
  async createNotification(
    input: CreateNotificationInput,
    actorContext?: ActorContext
  ): Promise<NotificationItem | null> {
    const requestId = actorContext?.requestId || `req-notif-${Date.now()}`;

    // 1. Check user preferences for category suppression (except CRITICAL alerts which are never suppressed)
    if (input.severity !== 'CRITICAL') {
      try {
        const prefs = await notificationRepository.getUserPreferences(input.userId);
        const categoryKeyMap: Record<NotificationCategory, keyof UserNotificationPreferences> = {
          SERVICE: 'serviceAlerts',
          TASK: 'taskAlerts',
          OPPORTUNITY: 'opportunityAlerts',
          RELATIONSHIP: 'relationshipAlerts',
          CUSTOMER: 'customerActivity',
          OPERATIONAL: 'operationalAlerts',
          SYSTEM: 'systemAlerts',
          ENGAGEMENT: 'relationshipAlerts',
        };

        const prefKey = categoryKeyMap[input.category];
        if (prefKey && prefs[prefKey] === false) {
          console.log(
            `[notification.suppressed] User ${input.userId} disabled category ${input.category}. Suppressing notification.`
          );
          return null;
        }
      } catch (err) {
        console.warn(`[notification.prefCheckError] Non-blocking error checking preferences:`, err);
      }
    }

    // 2. Deterministic deduplication
    if (input.dedupKey) {
      const existing = await notificationRepository.findByDedupKey(input.userId, input.dedupKey, true);
      if (existing) {
        console.log(
          `[notification.deduplicated] Active notification with dedupKey ${input.dedupKey} already exists for user ${input.userId}. Skipping.`
        );
        return existing;
      }
    }

    // 3. Persist notification to PostgreSQL
    const created = await notificationRepository.create(input);

    // 4. Audit logging
    await auditRepository.createLog({
      actorId: String(actorContext?.userId || 'SYSTEM_NOTIFICATION_ENGINE'),
      actorName: actorContext?.name || 'Notification Engine',
      action: 'NOTIFICATION_CREATED',
      resourceType: 'NOTIFICATION',
      resourceId: String(created.id),
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        userId: created.userId,
        customerId: created.customerId,
        type: created.notificationType,
        severity: created.severity,
        category: created.category,
        sourceEntityType: created.sourceEntityType,
        sourceEntityId: created.sourceEntityId,
      },
    });

    console.log(
      `[notification.created] ID: ${created.id} | User: ${created.userId} | Type: ${created.notificationType} | Severity: ${created.severity}`
    );

    return created;
  },

  async getUserNotifications(
    userId: number,
    filter: NotificationFilter = {}
  ): Promise<{ data: NotificationItem[]; total: number; page: number; limit: number }> {
    return notificationRepository.findMany(userId, filter);
  },

  async getNotificationById(id: number, userId: number): Promise<NotificationItem | null> {
    return notificationRepository.findById(id, userId);
  },

  async getUnreadCount(userId: number): Promise<number> {
    return notificationRepository.countUnread(userId);
  },

  async getSummaryStats(userId: number): Promise<NotificationSummaryStats> {
    return notificationRepository.getSummaryStats(userId);
  },

  async markAsRead(id: number, userId: number, actorContext?: ActorContext): Promise<boolean> {
    const success = await notificationRepository.markAsRead(id, userId);
    if (success) {
      await auditRepository.createLog({
        actorId: String(actorContext?.userId || userId),
        actorName: actorContext?.name || 'Banking Officer',
        action: 'NOTIFICATION_READ',
        resourceType: 'NOTIFICATION',
        resourceId: String(id),
        requestId: actorContext?.requestId || `req-read-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: { userId },
      });
      console.log(`[notification.read] ID: ${id} | User: ${userId}`);
    }
    return success;
  },

  async markAllAsRead(userId: number, actorContext?: ActorContext): Promise<number> {
    const count = await notificationRepository.markAllAsRead(userId);
    if (count > 0) {
      await auditRepository.createLog({
        actorId: String(actorContext?.userId || userId),
        actorName: actorContext?.name || 'Banking Officer',
        action: 'NOTIFICATION_READ_ALL',
        resourceType: 'NOTIFICATION',
        resourceId: `user-${userId}`,
        requestId: actorContext?.requestId || `req-readall-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: { userId, markedCount: count },
      });
      console.log(`[notification.read_all] Count: ${count} | User: ${userId}`);
    }
    return count;
  },

  async acknowledge(id: number, userId: number, actorContext?: ActorContext): Promise<boolean> {
    const success = await notificationRepository.acknowledge(id, userId);
    if (success) {
      await auditRepository.createLog({
        actorId: String(actorContext?.userId || userId),
        actorName: actorContext?.name || 'Banking Officer',
        action: 'NOTIFICATION_ACKNOWLEDGED',
        resourceType: 'NOTIFICATION',
        resourceId: String(id),
        requestId: actorContext?.requestId || `req-ack-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: { userId },
      });
      console.log(`[notification.acknowledged] ID: ${id} | User: ${userId}`);
    }
    return success;
  },

  async dismiss(id: number, userId: number, actorContext?: ActorContext): Promise<boolean> {
    const success = await notificationRepository.dismiss(id, userId);
    if (success) {
      await auditRepository.createLog({
        actorId: String(actorContext?.userId || userId),
        actorName: actorContext?.name || 'Banking Officer',
        action: 'NOTIFICATION_DISMISSED',
        resourceType: 'NOTIFICATION',
        resourceId: String(id),
        requestId: actorContext?.requestId || `req-dsm-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: { userId },
      });
      console.log(`[notification.dismissed] ID: ${id} | User: ${userId}`);
    }
    return success;
  },

  async expireBySource(sourceEntityType: string, sourceEntityId: string): Promise<number> {
    const count = await notificationRepository.expireBySource(sourceEntityType, sourceEntityId);
    if (count > 0) {
      console.log(`[notification.expired] Expired ${count} alerts for ${sourceEntityType}:${sourceEntityId}`);
    }
    return count;
  },

  async getUserPreferences(userId: number): Promise<UserNotificationPreferences> {
    return notificationRepository.getUserPreferences(userId);
  },

  async getSummary(userId: number): Promise<NotificationSummaryStats> {
    return notificationRepository.getSummaryStats(userId);
  },

  async updateUserPreferences(
    userId: number,
    prefs: Partial<UserNotificationPreferences>,
    actorContext?: ActorContext
  ): Promise<UserNotificationPreferences> {
    const updated = await notificationRepository.updateUserPreferences(userId, prefs);
    await auditRepository.createLog({
      actorId: String(actorContext?.userId || userId),
      actorName: actorContext?.name || 'Banking Officer',
      action: 'NOTIFICATION_PREFERENCES_UPDATED',
      resourceType: 'NOTIFICATION_PREFERENCES',
      resourceId: String(userId),
      requestId: actorContext?.requestId || `req-pref-${Date.now()}`,
      outcome: 'SUCCESS',
      metadata: { userId, updatedPreferences: prefs },
    });
    console.log(`[notification.preferences_updated] User: ${userId}`);
    return updated;
  },
};
