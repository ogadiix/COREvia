import crypto from 'node:crypto';
import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';
import { desc, eq, and, sql } from 'drizzle-orm';

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

export interface AuditQueryFilters {
  actorId?: string;
  role?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  requestId?: string;
  outcome?: string;
  limit?: number;
  offset?: number;
}

export const auditRepository = {
  /**
   * Appends an audit log with cryptographic SHA-256 tamper-evident chaining.
   * previousHash links to the prior audit record's hash, forming an immutable chain.
   */
  async createLog(params: CreateAuditLogParams) {
    try {
      // Find latest record for tamper-evident chaining
      const latest = await db
        .select({ recordHash: auditLogs.recordHash })
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
        .limit(1);

      const genesisHash = '0'.repeat(64);
      const previousHash = latest.length > 0 && latest[0].recordHash ? latest[0].recordHash : genesisHash;
      const timestamp = new Date().toISOString();

      // Compute cryptographic recordHash over key fields and previousHash
      const payloadToHash = `${previousHash}|${params.actorId}|${params.action}|${params.resourceType}|${params.resourceId}|${params.requestId}|${params.outcome}|${timestamp}`;
      const recordHash = crypto.createHash('sha256').update(payloadToHash).digest('hex');

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
          previousHash,
          recordHash,
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

  async findMany(filters: AuditQueryFilters = {}) {
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const conditions = [];
    if (filters.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }
    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.resourceType) {
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    }
    if (filters.resourceId) {
      conditions.push(eq(auditLogs.resourceId, filters.resourceId));
    }
    if (filters.requestId) {
      conditions.push(eq(auditLogs.requestId, filters.requestId));
    }
    if (filters.outcome) {
      conditions.push(eq(auditLogs.outcome, filters.outcome));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return await db
      .select()
      .from(auditLogs)
      .where(whereClause)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit)
      .offset(offset);
  },

  async count(filters: AuditQueryFilters = {}): Promise<number> {
    const conditions = [];
    if (filters.actorId) {
      conditions.push(eq(auditLogs.actorId, filters.actorId));
    }
    if (filters.action) {
      conditions.push(eq(auditLogs.action, filters.action));
    }
    if (filters.resourceType) {
      conditions.push(eq(auditLogs.resourceType, filters.resourceType));
    }
    if (filters.outcome) {
      conditions.push(eq(auditLogs.outcome, filters.outcome));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const res = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(whereClause);

    return Number(res[0]?.count || 0);
  },

  /**
   * Validates the integrity of the audit log chain for the last N records.
   * Returns verification metrics and whether any link in the chain is broken.
   */
  async verifyChainIntegrity(limit: number = 100): Promise<{
    verified: boolean;
    recordsChecked: number;
    chainValid: boolean;
    brokenAtRecordId?: number;
  }> {
    const records = await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt), desc(auditLogs.id))
      .limit(limit);

    if (records.length <= 1) {
      return { verified: true, recordsChecked: records.length, chainValid: true };
    }

    // Records are ordered newest to oldest, so records[i].previousHash should match records[i+1].recordHash (if hashes exist)
    for (let i = 0; i < records.length - 1; i++) {
      const current = records[i];
      const previous = records[i + 1];

      if (current.previousHash && previous.recordHash) {
        if (current.previousHash !== previous.recordHash) {
          return {
            verified: true,
            recordsChecked: i + 1,
            chainValid: false,
            brokenAtRecordId: current.id,
          };
        }
      }
    }

    return {
      verified: true,
      recordsChecked: records.length,
      chainValid: true,
    };
  }
};
