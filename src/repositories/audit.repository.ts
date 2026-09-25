import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';

export interface CreateAuditLogParams {
  actorId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  metadata?: Record<string, any>;
}

export const auditRepository = {
  async createLog(params: CreateAuditLogParams) {
    try {
      const [record] = await db
        .insert(auditLogs)
        .values({
          actorId: params.actorId,
          actorName: params.actorName,
          action: params.action,
          resourceType: params.resourceType,
          resourceId: params.resourceId,
          requestId: params.requestId,
          outcome: params.outcome,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        })
        .returning();
      return record;
    } catch (error) {
      console.error('Failed to create audit log entry in PostgreSQL:', error);
      // Non-blocking for audit failures
      return null;
    }
  },

  async log(params: CreateAuditLogParams) {
    return this.createLog(params);
  },
};
