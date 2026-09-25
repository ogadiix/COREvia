import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { tasks, customers, users } from '../db/schema.ts';

export interface CreateTaskInput {
  customerId: number;
  title: string;
  description?: string;
  dueDate: string;
  priority?: string;
  status?: string;
  assignedToId?: number;
  relatedType?: string;
  relatedId?: string;
}

export const taskRepository = {
  async findMany(params: { customerId?: number; status?: string; limit?: number; assignedToId?: number } = {}) {
    const limit = Math.min(100, params.limit || 50);
    const conditions = [];

    if (params.customerId) conditions.push(eq(tasks.customerId, params.customerId));
    if (params.status) conditions.push(eq(tasks.status, params.status.toUpperCase()));
    if (params.assignedToId) conditions.push(eq(tasks.assignedToId, params.assignedToId));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        task: tasks,
        customerName: customers.name,
        customerCode: customers.customerCode,
        assignedToName: users.name,
      })
      .from(tasks)
      .leftJoin(customers, eq(tasks.customerId, customers.id))
      .leftJoin(users, eq(tasks.assignedToId, users.id))
      .where(whereClause)
      .orderBy(desc(tasks.dueDate))
      .limit(limit);

    return rows.map((r) => ({
      ...r.task,
      customerName: r.customerName,
      customerCode: r.customerCode,
      assignedToName: r.assignedToName,
    }));
  },

  async create(data: CreateTaskInput) {
    const [record] = await db
      .insert(tasks)
      .values({
        customerId: data.customerId,
        title: data.title,
        description: data.description || null,
        dueDate: data.dueDate,
        priority: (data.priority || 'MEDIUM').toUpperCase(),
        status: (data.status || 'PENDING').toUpperCase(),
        assignedToId: data.assignedToId || null,
        relatedType: data.relatedType || null,
        relatedId: data.relatedId || null,
      })
      .returning();
    return record;
  },

  async update(id: number, data: { status?: string; priority?: string; dueDate?: string; description?: string }) {
    const payload: Record<string, any> = { updatedAt: new Date() };
    if (data.status) payload.status = data.status.toUpperCase();
    if (data.priority) payload.priority = data.priority.toUpperCase();
    if (data.dueDate) payload.dueDate = data.dueDate;
    if (data.description !== undefined) payload.description = data.description;

    const [updated] = await db.update(tasks).set(payload).where(eq(tasks.id, id)).returning();
    return updated || null;
  },
};
