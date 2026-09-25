import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { opportunities, opportunityActivities, customers, products, users } from '../db/schema.ts';

export interface CreateOpportunityInput {
  customerId: number;
  productId?: number;
  title: string;
  stage?: string;
  expectedValue?: string;
  probability?: number;
  expectedCloseDate?: string;
  notes?: string;
  assignedToId?: number;
}

export const opportunityRepository = {
  async findMany(params: { customerId?: number; stage?: string; limit?: number; assignedToId?: number } = {}) {
    const limit = Math.min(100, params.limit || 50);
    const conditions = [];

    if (params.customerId) conditions.push(eq(opportunities.customerId, params.customerId));
    if (params.stage) conditions.push(eq(opportunities.stage, params.stage.toUpperCase()));
    if (params.assignedToId) conditions.push(eq(opportunities.assignedToId, params.assignedToId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        opportunity: opportunities,
        customerName: customers.name,
        customerCode: customers.customerCode,
        productName: products.name,
        assignedToName: users.name,
      })
      .from(opportunities)
      .leftJoin(customers, eq(opportunities.customerId, customers.id))
      .leftJoin(products, eq(opportunities.productId, products.id))
      .leftJoin(users, eq(opportunities.assignedToId, users.id))
      .where(whereClause)
      .orderBy(desc(opportunities.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      ...r.opportunity,
      customerName: r.customerName,
      customerCode: r.customerCode,
      productName: r.productName,
      assignedToName: r.assignedToName,
    }));
  },

  async findById(id: number) {
    const [record] = await db
      .select({
        opportunity: opportunities,
        customerName: customers.name,
        customerCode: customers.customerCode,
        productName: products.name,
        assignedToName: users.name,
      })
      .from(opportunities)
      .leftJoin(customers, eq(opportunities.customerId, customers.id))
      .leftJoin(products, eq(opportunities.productId, products.id))
      .leftJoin(users, eq(opportunities.assignedToId, users.id))
      .where(eq(opportunities.id, id));

    if (!record) return null;

    const activities = await db
      .select()
      .from(opportunityActivities)
      .where(eq(opportunityActivities.opportunityId, id))
      .orderBy(desc(opportunityActivities.timestamp));

    return {
      ...record.opportunity,
      customerName: record.customerName,
      customerCode: record.customerCode,
      productName: record.productName,
      assignedToName: record.assignedToName,
      activities,
    };
  },

  async create(data: CreateOpportunityInput) {
    const oppCode = `OPP-${Date.now().toString().slice(-6)}`;
    const [record] = await db
      .insert(opportunities)
      .values({
        opportunityCode: oppCode,
        customerId: data.customerId,
        productId: data.productId || null,
        title: data.title,
        stage: (data.stage || 'PROSPECT').toUpperCase(),
        expectedValue: data.expectedValue || '0.00',
        probability: data.probability || 50,
        expectedCloseDate: data.expectedCloseDate || null,
        notes: data.notes || null,
        assignedToId: data.assignedToId || null,
      })
      .returning();

    // Log creation activity
    await db.insert(opportunityActivities).values({
      opportunityId: record.id,
      activityType: 'CREATION',
      description: `Opportunity created in stage ${record.stage}`,
      performedById: data.assignedToId || null,
    });

    return record;
  },

  async update(id: number, data: { stage?: string; probability?: number; notes?: string; expectedValue?: string }, actorId?: number) {
    const payload: Record<string, any> = { updatedAt: new Date() };
    if (data.stage) payload.stage = data.stage.toUpperCase();
    if (data.probability !== undefined) payload.probability = data.probability;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.expectedValue !== undefined) payload.expectedValue = data.expectedValue;

    const [updated] = await db
      .update(opportunities)
      .set(payload)
      .where(eq(opportunities.id, id))
      .returning();

    if (updated && data.stage) {
      await db.insert(opportunityActivities).values({
        opportunityId: id,
        activityType: 'STAGE_CHANGE',
        description: `Stage updated to ${data.stage.toUpperCase()}`,
        performedById: actorId || null,
      });
    }

    return updated || null;
  },
};
