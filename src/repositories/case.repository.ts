import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { serviceCases, caseComments, customers, accounts, users } from '../db/schema.ts';

export const caseRepository = {
  async findMany(params: { customerId?: number; status?: string; priority?: string; page?: number; limit?: number } = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (params.customerId) conditions.push(eq(serviceCases.customerId, params.customerId));
    if (params.status) conditions.push(eq(serviceCases.status, params.status.toUpperCase()));
    if (params.priority) conditions.push(eq(serviceCases.priority, params.priority.toUpperCase()));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        caseItem: serviceCases,
        customerName: customers.name,
        customerCode: customers.customerCode,
        accountNumber: accounts.accountNumber,
        assignedToName: users.name,
      })
      .from(serviceCases)
      .leftJoin(customers, eq(serviceCases.customerId, customers.id))
      .leftJoin(accounts, eq(serviceCases.accountId, accounts.id))
      .leftJoin(users, eq(serviceCases.assignedToId, users.id))
      .where(whereClause)
      .orderBy(desc(serviceCases.createdAt))
      .limit(limit)
      .offset(offset);

    const all = await db.select({ id: serviceCases.id }).from(serviceCases).where(whereClause);

    return {
      data: rows.map((r) => ({
        ...r.caseItem,
        customerName: r.customerName,
        customerCode: r.customerCode,
        accountNumber: r.accountNumber,
        assignedToName: r.assignedToName,
      })),
      pagination: {
        page,
        limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit),
      },
    };
  },

  async findById(id: number) {
    const [record] = await db
      .select({
        caseItem: serviceCases,
        customerName: customers.name,
        customerCode: customers.customerCode,
        accountNumber: accounts.accountNumber,
      })
      .from(serviceCases)
      .leftJoin(customers, eq(serviceCases.customerId, customers.id))
      .leftJoin(accounts, eq(serviceCases.accountId, accounts.id))
      .where(eq(serviceCases.id, id));

    if (!record) return null;

    const comments = await db
      .select()
      .from(caseComments)
      .where(eq(caseComments.caseId, id))
      .orderBy(desc(caseComments.createdAt));

    return {
      ...record.caseItem,
      customerName: record.customerName,
      customerCode: record.customerCode,
      accountNumber: record.accountNumber,
      comments,
    };
  },

  async updateCase(id: number, data: { status?: string; priority?: string; resolutionSummary?: string; assignedToId?: number }) {
    const updatePayload: Record<string, any> = { updatedAt: new Date() };
    if (data.status) updatePayload.status = data.status.toUpperCase();
    if (data.priority) updatePayload.priority = data.priority.toUpperCase();
    if (data.resolutionSummary !== undefined) updatePayload.resolutionSummary = data.resolutionSummary;
    if (data.assignedToId !== undefined) updatePayload.assignedToId = data.assignedToId;

    const [updated] = await db
      .update(serviceCases)
      .set(updatePayload)
      .where(eq(serviceCases.id, id))
      .returning();

    return updated || null;
  },

  async addComment(caseId: number, authorName: string, comment: string, authorId?: number, isInternal: boolean = false) {
    const [record] = await db
      .insert(caseComments)
      .values({
        caseId,
        authorName,
        comment,
        authorId: authorId || null,
        isInternal,
      })
      .returning();
    return record;
  },
};
