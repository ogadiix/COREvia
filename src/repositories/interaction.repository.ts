import { db } from '../db/index.ts';
import {
  interactions,
  interactionParticipants,
  interactionLinks,
  interactionCommitments,
  customers,
  users,
  opportunities,
  serviceCases,
  tasks,
  onboardingApplications,
} from '../db/schema.ts';
import { eq, and, or, sql, desc, asc, ilike, isNull, gte, lte } from 'drizzle-orm';
import {
  InteractionItem,
  InteractionParticipant,
  InteractionLink,
  InteractionCommitment,
  InteractionType,
  InteractionOutcome,
  InteractionChannel,
  InteractionSentiment,
  CommunicationProfile,
  EngagementTrendData,
  InteractionMetricsOverview,
} from '../types/index.ts';

export interface ListInteractionsParams {
  customerId?: number;
  interactionType?: string;
  channel?: string;
  outcome?: string;
  sentiment?: string;
  ownerId?: number;
  agentId?: number;
  followupRequired?: boolean;
  search?: string;
  startDate?: string;
  endDate?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateInteractionInput {
  customerId: number;
  channel: InteractionChannel | string;
  interactionType: InteractionType | string;
  subject: string;
  summary: string;
  outcome: InteractionOutcome | string;
  sentiment?: InteractionSentiment | string;
  ownerId?: number | null;
  agentId?: number | null;
  duration?: number;
  participants?: InteractionParticipant[];
  followupRequired?: boolean;
  followupDate?: string | null;
  followupOwnerId?: number | null;
  followupAction?: string | null;
  followupPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  followupTaskId?: number | null;
  customerCommitment?: string | null;
  customerCommitmentTaskId?: number | null;
  rmCommitment?: string | null;
  rmCommitmentTaskId?: number | null;
  linkedOpportunityId?: number | null;
  linkedCaseId?: number | null;
  linkedTaskId?: number | null;
  linkedRelationshipReview?: string | null;
  linkedOnboardingId?: number | null;
  commitments?: Array<{
    commitmentType: 'CUSTOMER_COMMITMENT' | 'RM_COMMITMENT';
    description: string;
    ownerName?: string | null;
    dueDate?: string | null;
    createdTaskId?: number | null;
  }>;
  links?: Array<{
    linkType: 'CUSTOMER' | 'OPPORTUNITY' | 'CASE' | 'TASK' | 'RELATIONSHIP_REVIEW' | 'ONBOARDING_APPLICATION';
    linkId: string;
    title?: string | null;
    metadata?: string | null;
  }>;
  createdBy?: number | null;
  timestamp?: string | Date;
}

export interface UpdateInteractionInput {
  channel?: InteractionChannel | string;
  interactionType?: InteractionType | string;
  subject?: string;
  summary?: string;
  outcome?: InteractionOutcome | string;
  sentiment?: InteractionSentiment | string;
  ownerId?: number | null;
  duration?: number;
  followupRequired?: boolean;
  followupDate?: string | null;
  followupOwnerId?: number | null;
  followupAction?: string | null;
  followupPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  followupTaskId?: number | null;
  customerCommitment?: string | null;
  customerCommitmentTaskId?: number | null;
  rmCommitment?: string | null;
  rmCommitmentTaskId?: number | null;
  linkedOpportunityId?: number | null;
  linkedCaseId?: number | null;
  linkedTaskId?: number | null;
  linkedRelationshipReview?: string | null;
  linkedOnboardingId?: number | null;
  updatedBy?: number | null;
}

function parseParticipantsJson(val: any): InteractionParticipant[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const interactionRepository = {
  async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const countResult = await db.execute(sql`SELECT count(*)::int as count FROM interactions`);
    const count = ((countResult.rows[0] as any)?.count || 0) + 1;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `INT-${year}-${String(count).padStart(4, '0')}${randomSuffix}`;
  },

  async list(params: ListInteractionsParams = {}): Promise<{
    items: InteractionItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (!params.includeDeleted) {
      conditions.push(isNull(interactions.deletedAt));
    }

    if (params.customerId) {
      conditions.push(eq(interactions.customerId, params.customerId));
    }

    if (params.interactionType && params.interactionType !== 'ALL') {
      conditions.push(eq(interactions.interactionType, params.interactionType.toUpperCase()));
    }

    if (params.channel && params.channel !== 'ALL') {
      conditions.push(eq(interactions.channel, params.channel.toUpperCase()));
    }

    if (params.outcome && params.outcome !== 'ALL') {
      conditions.push(eq(interactions.outcome, params.outcome.toUpperCase()));
    }

    if (params.sentiment && params.sentiment !== 'ALL') {
      conditions.push(eq(interactions.sentiment, params.sentiment.toUpperCase()));
    }

    if (params.ownerId) {
      conditions.push(eq(interactions.ownerId, params.ownerId));
    }

    if (params.agentId) {
      conditions.push(eq(interactions.agentId, params.agentId));
    }

    if (params.followupRequired !== undefined) {
      conditions.push(eq(interactions.followupRequired, params.followupRequired));
    }

    if (params.startDate) {
      conditions.push(gte(interactions.timestamp, new Date(params.startDate)));
    }

    if (params.endDate) {
      conditions.push(lte(interactions.timestamp, new Date(params.endDate)));
    }

    if (params.search && params.search.trim()) {
      const q = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(interactions.subject, q),
          ilike(interactions.summary, q),
          ilike(interactions.interactionReference, q),
          ilike(customers.name, q),
          ilike(customers.customerCode, q)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Count
    const countQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(interactions)
      .leftJoin(customers, eq(interactions.customerId, customers.id))
      .where(whereClause);

    const total = countQuery[0]?.count || 0;

    // Rows
    const rows = await db
      .select({
        id: interactions.id,
        interactionReference: interactions.interactionReference,
        customerId: interactions.customerId,
        customerName: customers.name,
        customerCode: customers.customerCode,
        channel: interactions.channel,
        interactionType: interactions.interactionType,
        subject: interactions.subject,
        summary: interactions.summary,
        outcome: interactions.outcome,
        sentiment: interactions.sentiment,
        ownerId: interactions.ownerId,
        ownerName: users.name,
        agentId: interactions.agentId,
        duration: interactions.duration,
        participants: interactions.participants,
        followupRequired: interactions.followupRequired,
        followupDate: interactions.followupDate,
        followupOwnerId: interactions.followupOwnerId,
        followupAction: interactions.followupAction,
        followupPriority: interactions.followupPriority,
        followupTaskId: interactions.followupTaskId,
        customerCommitment: interactions.customerCommitment,
        customerCommitmentTaskId: interactions.customerCommitmentTaskId,
        rmCommitment: interactions.rmCommitment,
        rmCommitmentTaskId: interactions.rmCommitmentTaskId,
        linkedOpportunityId: interactions.linkedOpportunityId,
        linkedOpportunityTitle: opportunities.title,
        linkedCaseId: interactions.linkedCaseId,
        linkedCaseNumber: serviceCases.caseNumber,
        linkedTaskId: interactions.linkedTaskId,
        linkedTaskTitle: tasks.title,
        linkedRelationshipReview: interactions.linkedRelationshipReview,
        linkedOnboardingId: interactions.linkedOnboardingId,
        linkedOnboardingNumber: onboardingApplications.applicationNumber,
        createdBy: interactions.createdBy,
        timestamp: interactions.timestamp,
        createdAt: interactions.createdAt,
        updatedAt: interactions.updatedAt,
        deletedAt: interactions.deletedAt,
      })
      .from(interactions)
      .leftJoin(customers, eq(interactions.customerId, customers.id))
      .leftJoin(users, eq(interactions.ownerId, users.id))
      .leftJoin(opportunities, eq(interactions.linkedOpportunityId, opportunities.id))
      .leftJoin(serviceCases, eq(interactions.linkedCaseId, serviceCases.id))
      .leftJoin(tasks, eq(interactions.linkedTaskId, tasks.id))
      .leftJoin(onboardingApplications, eq(interactions.linkedOnboardingId, onboardingApplications.id))
      .where(whereClause)
      .orderBy(desc(interactions.timestamp), desc(interactions.id))
      .limit(limit)
      .offset(offset);

    const items: InteractionItem[] = rows.map((r) => {
      let parsedParts = parseParticipantsJson(r.participants);
      return {
        id: r.id,
        interactionReference: r.interactionReference || `INT-2026-${String(r.id).padStart(6, '0')}`,
        customerId: r.customerId,
        customerName: r.customerName || undefined,
        customerCode: r.customerCode || undefined,
        channel: r.channel as InteractionChannel,
        interactionType: r.interactionType as InteractionType,
        subject: r.subject,
        summary: r.summary,
        outcome: r.outcome as InteractionOutcome,
        sentiment: (r.sentiment || 'NEUTRAL') as InteractionSentiment,
        ownerId: r.ownerId,
        ownerName: r.ownerName,
        agentId: r.agentId,
        duration: r.duration || 15,
        participants: parsedParts,
        followupRequired: !!r.followupRequired,
        followupDate: r.followupDate ? r.followupDate.toISOString() : null,
        followupOwnerId: r.followupOwnerId,
        followupAction: r.followupAction,
        followupPriority: (r.followupPriority || 'MEDIUM') as any,
        followupTaskId: r.followupTaskId,
        customerCommitment: r.customerCommitment,
        customerCommitmentTaskId: r.customerCommitmentTaskId,
        rmCommitment: r.rmCommitment,
        rmCommitmentTaskId: r.rmCommitmentTaskId,
        linkedOpportunityId: r.linkedOpportunityId,
        linkedOpportunityTitle: r.linkedOpportunityTitle,
        linkedCaseId: r.linkedCaseId,
        linkedCaseNumber: r.linkedCaseNumber,
        linkedTaskId: r.linkedTaskId,
        linkedTaskTitle: r.linkedTaskTitle,
        linkedRelationshipReview: r.linkedRelationshipReview,
        linkedOnboardingId: r.linkedOnboardingId,
        linkedOnboardingNumber: r.linkedOnboardingNumber,
        createdBy: r.createdBy,
        timestamp: r.timestamp.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
      };
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async findById(id: number): Promise<InteractionItem | null> {
    const rows = await db
      .select({
        id: interactions.id,
        interactionReference: interactions.interactionReference,
        customerId: interactions.customerId,
        customerName: customers.name,
        customerCode: customers.customerCode,
        channel: interactions.channel,
        interactionType: interactions.interactionType,
        subject: interactions.subject,
        summary: interactions.summary,
        outcome: interactions.outcome,
        sentiment: interactions.sentiment,
        ownerId: interactions.ownerId,
        ownerName: users.name,
        agentId: interactions.agentId,
        duration: interactions.duration,
        participants: interactions.participants,
        followupRequired: interactions.followupRequired,
        followupDate: interactions.followupDate,
        followupOwnerId: interactions.followupOwnerId,
        followupAction: interactions.followupAction,
        followupPriority: interactions.followupPriority,
        followupTaskId: interactions.followupTaskId,
        customerCommitment: interactions.customerCommitment,
        customerCommitmentTaskId: interactions.customerCommitmentTaskId,
        rmCommitment: interactions.rmCommitment,
        rmCommitmentTaskId: interactions.rmCommitmentTaskId,
        linkedOpportunityId: interactions.linkedOpportunityId,
        linkedOpportunityTitle: opportunities.title,
        linkedCaseId: interactions.linkedCaseId,
        linkedCaseNumber: serviceCases.caseNumber,
        linkedTaskId: interactions.linkedTaskId,
        linkedTaskTitle: tasks.title,
        linkedRelationshipReview: interactions.linkedRelationshipReview,
        linkedOnboardingId: interactions.linkedOnboardingId,
        linkedOnboardingNumber: onboardingApplications.applicationNumber,
        createdBy: interactions.createdBy,
        timestamp: interactions.timestamp,
        createdAt: interactions.createdAt,
        updatedAt: interactions.updatedAt,
        deletedAt: interactions.deletedAt,
      })
      .from(interactions)
      .leftJoin(customers, eq(interactions.customerId, customers.id))
      .leftJoin(users, eq(interactions.ownerId, users.id))
      .leftJoin(opportunities, eq(interactions.linkedOpportunityId, opportunities.id))
      .leftJoin(serviceCases, eq(interactions.linkedCaseId, serviceCases.id))
      .leftJoin(tasks, eq(interactions.linkedTaskId, tasks.id))
      .leftJoin(onboardingApplications, eq(interactions.linkedOnboardingId, onboardingApplications.id))
      .where(eq(interactions.id, id))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    // Fetch commitments
    const commitmentRows = await db
      .select()
      .from(interactionCommitments)
      .where(eq(interactionCommitments.interactionId, id))
      .orderBy(asc(interactionCommitments.id));

    // Fetch links
    const linkRows = await db
      .select()
      .from(interactionLinks)
      .where(eq(interactionLinks.interactionId, id))
      .orderBy(asc(interactionLinks.id));

    // Fetch participants from table if present, else fallback to JSON
    const participantRows = await db
      .select()
      .from(interactionParticipants)
      .where(eq(interactionParticipants.interactionId, id))
      .orderBy(asc(interactionParticipants.id));

    const participants: InteractionParticipant[] =
      participantRows.length > 0
        ? participantRows.map((p) => ({
            id: p.id,
            interactionId: p.interactionId,
            participantType: p.participantType as any,
            name: p.name,
            email: p.email,
            phone: p.phone,
            role: p.role,
            attended: p.attended,
          }))
        : parseParticipantsJson(r.participants);

    return {
      id: r.id,
      interactionReference: r.interactionReference || `INT-2026-${String(r.id).padStart(6, '0')}`,
      customerId: r.customerId,
      customerName: r.customerName || undefined,
      customerCode: r.customerCode || undefined,
      channel: r.channel as InteractionChannel,
      interactionType: r.interactionType as InteractionType,
      subject: r.subject,
      summary: r.summary,
      outcome: r.outcome as InteractionOutcome,
      sentiment: (r.sentiment || 'NEUTRAL') as InteractionSentiment,
      ownerId: r.ownerId,
      ownerName: r.ownerName,
      agentId: r.agentId,
      duration: r.duration || 15,
      participants,
      followupRequired: !!r.followupRequired,
      followupDate: r.followupDate ? r.followupDate.toISOString() : null,
      followupOwnerId: r.followupOwnerId,
      followupAction: r.followupAction,
      followupPriority: (r.followupPriority || 'MEDIUM') as any,
      followupTaskId: r.followupTaskId,
      customerCommitment: r.customerCommitment,
      customerCommitmentTaskId: r.customerCommitmentTaskId,
      rmCommitment: r.rmCommitment,
      rmCommitmentTaskId: r.rmCommitmentTaskId,
      linkedOpportunityId: r.linkedOpportunityId,
      linkedOpportunityTitle: r.linkedOpportunityTitle,
      linkedCaseId: r.linkedCaseId,
      linkedCaseNumber: r.linkedCaseNumber,
      linkedTaskId: r.linkedTaskId,
      linkedTaskTitle: r.linkedTaskTitle,
      linkedRelationshipReview: r.linkedRelationshipReview,
      linkedOnboardingId: r.linkedOnboardingId,
      linkedOnboardingNumber: r.linkedOnboardingNumber,
      createdBy: r.createdBy,
      timestamp: r.timestamp.toISOString(),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
      commitments: commitmentRows.map((c) => ({
        id: c.id,
        interactionId: c.interactionId,
        commitmentType: c.commitmentType as any,
        description: c.description,
        ownerName: c.ownerName,
        dueDate: c.dueDate ? c.dueDate.toISOString() : null,
        status: c.status as any,
        createdTaskId: c.createdTaskId,
        createdAt: c.createdAt.toISOString(),
        completedAt: c.completedAt ? c.completedAt.toISOString() : null,
      })),
      links: linkRows.map((l) => ({
        id: l.id,
        interactionId: l.interactionId,
        linkType: l.linkType as any,
        linkId: l.linkId,
        title: l.title,
        metadata: l.metadata,
      })),
    };
  },

  async findByReference(reference: string): Promise<InteractionItem | null> {
    const rows = await db
      .select({ id: interactions.id })
      .from(interactions)
      .where(eq(interactions.interactionReference, reference))
      .limit(1);
    if (!rows.length) return null;
    return this.findById(rows[0].id);
  },

  async findByCustomerId(customerId: number, limit = 20): Promise<InteractionItem[]> {
    const res = await this.list({ customerId, limit });
    return res.items;
  },

  async create(data: CreateInteractionInput): Promise<InteractionItem> {
    const reference = await this.generateReference();
    const participantsJson = JSON.stringify(data.participants || []);

    const [record] = await db
      .insert(interactions)
      .values({
        interactionReference: reference,
        customerId: data.customerId,
        channel: String(data.channel).toUpperCase(),
        interactionType: String(data.interactionType).toUpperCase(),
        subject: data.subject,
        summary: data.summary,
        outcome: String(data.outcome).toUpperCase(),
        sentiment: data.sentiment ? String(data.sentiment).toUpperCase() : 'NEUTRAL',
        ownerId: data.ownerId || null,
        agentId: data.agentId || data.ownerId || null,
        duration: data.duration || 15,
        participants: participantsJson,
        followupRequired: !!data.followupRequired,
        followupDate: data.followupDate ? new Date(data.followupDate) : null,
        followupOwnerId: data.followupOwnerId || null,
        followupAction: data.followupAction || null,
        followupPriority: data.followupPriority || 'MEDIUM',
        followupTaskId: data.followupTaskId || null,
        customerCommitment: data.customerCommitment || null,
        customerCommitmentTaskId: data.customerCommitmentTaskId || null,
        rmCommitment: data.rmCommitment || null,
        rmCommitmentTaskId: data.rmCommitmentTaskId || null,
        linkedOpportunityId: data.linkedOpportunityId || null,
        linkedCaseId: data.linkedCaseId || null,
        linkedTaskId: data.linkedTaskId || null,
        linkedRelationshipReview: data.linkedRelationshipReview || null,
        linkedOnboardingId: data.linkedOnboardingId || null,
        createdBy: data.createdBy || null,
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      })
      .returning();

    // Insert participants if any
    if (data.participants && data.participants.length > 0) {
      for (const p of data.participants) {
        await db.insert(interactionParticipants).values({
          interactionId: record.id,
          participantType: p.participantType || 'CUSTOMER',
          name: p.name,
          email: p.email || null,
          phone: p.phone || null,
          role: p.role || null,
          attended: p.attended !== false,
        });
      }
    }

    // Insert links if any
    if (data.links && data.links.length > 0) {
      for (const l of data.links) {
        await db.insert(interactionLinks).values({
          interactionId: record.id,
          linkType: l.linkType,
          linkId: l.linkId,
          title: l.title || null,
          metadata: l.metadata || null,
        });
      }
    }

    // Insert commitments if any
    if (data.commitments && data.commitments.length > 0) {
      for (const c of data.commitments) {
        await db.insert(interactionCommitments).values({
          interactionId: record.id,
          commitmentType: c.commitmentType,
          description: c.description,
          ownerName: c.ownerName || null,
          dueDate: c.dueDate ? new Date(c.dueDate) : null,
          status: 'PENDING',
          createdTaskId: c.createdTaskId || null,
        });
      }
    }

    const created = await this.findById(record.id);
    return created!;
  },

  async update(id: number, data: UpdateInteractionInput): Promise<InteractionItem | null> {
    const payload: Record<string, any> = { updatedAt: new Date() };

    if (data.channel) payload.channel = String(data.channel).toUpperCase();
    if (data.interactionType) payload.interactionType = String(data.interactionType).toUpperCase();
    if (data.subject !== undefined) payload.subject = data.subject;
    if (data.summary !== undefined) payload.summary = data.summary;
    if (data.outcome) payload.outcome = String(data.outcome).toUpperCase();
    if (data.sentiment) payload.sentiment = String(data.sentiment).toUpperCase();
    if (data.ownerId !== undefined) payload.ownerId = data.ownerId;
    if (data.duration !== undefined) payload.duration = data.duration;
    if (data.followupRequired !== undefined) payload.followupRequired = data.followupRequired;
    if (data.followupDate !== undefined) payload.followupDate = data.followupDate ? new Date(data.followupDate) : null;
    if (data.followupOwnerId !== undefined) payload.followupOwnerId = data.followupOwnerId;
    if (data.followupAction !== undefined) payload.followupAction = data.followupAction;
    if (data.followupPriority !== undefined) payload.followupPriority = data.followupPriority;
    if (data.followupTaskId !== undefined) payload.followupTaskId = data.followupTaskId;
    if (data.customerCommitment !== undefined) payload.customerCommitment = data.customerCommitment;
    if (data.customerCommitmentTaskId !== undefined) payload.customerCommitmentTaskId = data.customerCommitmentTaskId;
    if (data.rmCommitment !== undefined) payload.rmCommitment = data.rmCommitment;
    if (data.rmCommitmentTaskId !== undefined) payload.rmCommitmentTaskId = data.rmCommitmentTaskId;
    if (data.linkedOpportunityId !== undefined) payload.linkedOpportunityId = data.linkedOpportunityId;
    if (data.linkedCaseId !== undefined) payload.linkedCaseId = data.linkedCaseId;
    if (data.linkedTaskId !== undefined) payload.linkedTaskId = data.linkedTaskId;
    if (data.linkedRelationshipReview !== undefined) payload.linkedRelationshipReview = data.linkedRelationshipReview;
    if (data.linkedOnboardingId !== undefined) payload.linkedOnboardingId = data.linkedOnboardingId;
    if (data.updatedBy !== undefined) payload.updatedBy = data.updatedBy;

    await db.update(interactions).set(payload).where(eq(interactions.id, id));
    return this.findById(id);
  },

  async softDelete(id: number, deletedById: number): Promise<boolean> {
    const [res] = await db
      .update(interactions)
      .set({
        deletedAt: new Date(),
        deletedBy: deletedById,
        updatedAt: new Date(),
      })
      .where(eq(interactions.id, id))
      .returning();
    return !!res;
  },

  async addCommitment(
    interactionId: number,
    data: {
      commitmentType: 'CUSTOMER_COMMITMENT' | 'RM_COMMITMENT';
      description: string;
      ownerName?: string | null;
      dueDate?: string | null;
      createdTaskId?: number | null;
    }
  ): Promise<InteractionCommitment> {
    const [c] = await db
      .insert(interactionCommitments)
      .values({
        interactionId,
        commitmentType: data.commitmentType,
        description: data.description,
        ownerName: data.ownerName || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        status: 'PENDING',
        createdTaskId: data.createdTaskId || null,
      })
      .returning();

    return {
      id: c.id,
      interactionId: c.interactionId,
      commitmentType: c.commitmentType as any,
      description: c.description,
      ownerName: c.ownerName,
      dueDate: c.dueDate ? c.dueDate.toISOString() : null,
      status: c.status as any,
      createdTaskId: c.createdTaskId,
      createdAt: c.createdAt.toISOString(),
      completedAt: c.completedAt ? c.completedAt.toISOString() : null,
    };
  },

  async updateCommitment(
    commitmentId: number,
    data: {
      status?: 'PENDING' | 'COMPLETED' | 'CANCELLED';
      createdTaskId?: number | null;
    }
  ): Promise<boolean> {
    const payload: Record<string, any> = {};
    if (data.status) {
      payload.status = data.status;
      if (data.status === 'COMPLETED') {
        payload.completedAt = new Date();
      }
    }
    if (data.createdTaskId !== undefined) {
      payload.createdTaskId = data.createdTaskId;
    }
    const [res] = await db.update(interactionCommitments).set(payload).where(eq(interactionCommitments.id, commitmentId)).returning();
    return !!res;
  },

  async getMetrics(params: { customerId?: number; ownerId?: number } = {}): Promise<InteractionMetricsOverview> {
    const conditions: any[] = [isNull(interactions.deletedAt)];
    if (params.customerId) conditions.push(eq(interactions.customerId, params.customerId));
    if (params.ownerId) conditions.push(eq(interactions.ownerId, params.ownerId));

    const whereClause = and(...conditions);

    // Total
    const totalQuery = await db.select({ count: sql<number>`count(*)::int` }).from(interactions).where(whereClause);
    const totalInteractions = totalQuery[0]?.count || 0;

    // Recent 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(interactions)
      .where(and(whereClause, gte(interactions.timestamp, sevenDaysAgo)));
    const recentCount = recentQuery[0]?.count || 0;

    // Followups required
    const fuReqQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(interactions)
      .where(and(whereClause, eq(interactions.followupRequired, true)));
    const followUpsRequiredCount = fuReqQuery[0]?.count || 0;

    // Followups overdue
    const now = new Date();
    const fuOverdueQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(interactions)
      .where(
        and(
          whereClause,
          eq(interactions.followupRequired, true),
          lte(interactions.followupDate, now)
        )
      );
    const followUpsOverdueCount = fuOverdueQuery[0]?.count || 0;

    // Linked to opportunities
    const oppLinkedQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(interactions)
      .where(and(whereClause, sql`${interactions.linkedOpportunityId} IS NOT NULL`));
    const linkedToOpportunitiesCount = oppLinkedQuery[0]?.count || 0;

    // Linked to cases
    const caseLinkedQuery = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(interactions)
      .where(and(whereClause, sql`${interactions.linkedCaseId} IS NOT NULL`));
    const linkedToCasesCount = caseLinkedQuery[0]?.count || 0;

    // Breakdowns
    const typeBreakdown = await db
      .select({
        key: interactions.interactionType,
        count: sql<number>`count(*)::int`,
      })
      .from(interactions)
      .where(whereClause)
      .groupBy(interactions.interactionType);

    const channelBreakdown = await db
      .select({
        key: interactions.channel,
        count: sql<number>`count(*)::int`,
      })
      .from(interactions)
      .where(whereClause)
      .groupBy(interactions.channel);

    const outcomeBreakdown = await db
      .select({
        key: interactions.outcome,
        count: sql<number>`count(*)::int`,
      })
      .from(interactions)
      .where(whereClause)
      .groupBy(interactions.outcome);

    const byType: Record<string, number> = {};
    for (const row of typeBreakdown) {
      if (row.key) byType[row.key] = row.count;
    }

    const byChannel: Record<string, number> = {};
    for (const row of channelBreakdown) {
      if (row.key) byChannel[row.key] = row.count;
    }

    const byOutcome: Record<string, number> = {};
    for (const row of outcomeBreakdown) {
      if (row.key) byOutcome[row.key] = row.count;
    }

    return {
      totalInteractions,
      myInteractionsCount: params.ownerId ? totalInteractions : 0,
      recentCount,
      followUpsRequiredCount,
      followUpsCreatedCount: followUpsRequiredCount,
      followUpsCompletedCount: Math.max(0, followUpsRequiredCount - followUpsOverdueCount),
      followUpsOverdueCount,
      linkedToOpportunitiesCount,
      linkedToCasesCount,
      byType,
      byChannel,
      byOutcome,
    };
  },

  async getCommunicationProfile(customerId: number): Promise<CommunicationProfile> {
    const rows = await db
      .select({
        id: interactions.id,
        timestamp: interactions.timestamp,
        interactionType: interactions.interactionType,
        channel: interactions.channel,
        followupRequired: interactions.followupRequired,
        followupDate: interactions.followupDate,
      })
      .from(interactions)
      .where(and(eq(interactions.customerId, customerId), isNull(interactions.deletedAt)))
      .orderBy(desc(interactions.timestamp));

    const totalInteractions = rows.length;
    let lastInteractionDate: string | null = null;
    let lastInteractionType: InteractionType | null = null;
    let lastRmContactDate: string | null = null;
    let lastServiceContactDate: string | null = null;
    let lastMeetingDate: string | null = null;
    let openFollowUpsCount = 0;
    let overdueFollowUpsCount = 0;

    const channelCounts: Record<string, number> = {};
    const now = new Date();

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const dt = r.timestamp.toISOString();

      if (i === 0) {
        lastInteractionDate = dt;
        lastInteractionType = r.interactionType as InteractionType;
      }

      if (
        !lastRmContactDate &&
        ['CALL', 'MEETING', 'VIDEO_MEETING', 'RELATIONSHIP_REVIEW'].includes(r.interactionType)
      ) {
        lastRmContactDate = dt;
      }

      if (!lastServiceContactDate && r.interactionType === 'SERVICE_CONTACT') {
        lastServiceContactDate = dt;
      }

      if (!lastMeetingDate && ['MEETING', 'VIDEO_MEETING', 'BRANCH_VISIT'].includes(r.interactionType)) {
        lastMeetingDate = dt;
      }

      if (r.followupRequired) {
        openFollowUpsCount++;
        if (r.followupDate && new Date(r.followupDate) < now) {
          overdueFollowUpsCount++;
        }
      }

      channelCounts[r.channel] = (channelCounts[r.channel] || 0) + 1;
    }

    let preferredRecordedChannel = 'PHONE';
    let maxChannelCount = 0;
    for (const [ch, cnt] of Object.entries(channelCounts)) {
      if (cnt > maxChannelCount) {
        maxChannelCount = cnt;
        preferredRecordedChannel = ch;
      }
    }

    // Monthly average (based on customer's first interaction or default 6 months)
    const monthlyAverage = totalInteractions > 0 ? Number((totalInteractions / 3).toFixed(1)) : 0;

    let frequencyRating: 'HIGH' | 'MODERATE' | 'LOW' | 'INACTIVE' = 'INACTIVE';
    if (monthlyAverage >= 4) frequencyRating = 'HIGH';
    else if (monthlyAverage >= 1.5) frequencyRating = 'MODERATE';
    else if (totalInteractions > 0) frequencyRating = 'LOW';

    return {
      totalInteractions,
      lastInteractionDate,
      lastInteractionType,
      lastRmContactDate,
      lastServiceContactDate,
      lastMeetingDate,
      openFollowUpsCount,
      overdueFollowUpsCount,
      preferredRecordedChannel,
      frequencyRating,
      monthlyAverage,
    };
  },

  async getEngagementTrend(
    customerId: number,
    timeframe: '7d' | '30d' | '90d' | '12m' = '30d'
  ): Promise<EngagementTrendData> {
    const whereClause = and(eq(interactions.customerId, customerId), isNull(interactions.deletedAt));
    const allRows = await db
      .select({
        timestamp: interactions.timestamp,
        interactionType: interactions.interactionType,
      })
      .from(interactions)
      .where(whereClause)
      .orderBy(asc(interactions.timestamp));

    const now = new Date();
    const periods: Array<{
      periodLabel: string;
      calls: number;
      meetings: number;
      emails: number;
      serviceContacts: number;
      other: number;
      total: number;
    }> = [];

    let totalCalls = 0;
    let totalMeetings = 0;
    let totalEmails = 0;
    let totalServiceContacts = 0;
    let totalOther = 0;

    if (timeframe === '7d') {
      // 7 daily periods
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const dayStr = d.toISOString().slice(0, 10);

        let calls = 0, meetings = 0, emails = 0, serviceContacts = 0, other = 0;
        for (const row of allRows) {
          if (row.timestamp.toISOString().slice(0, 10) === dayStr) {
            if (row.interactionType === 'CALL') calls++;
            else if (['MEETING', 'VIDEO_MEETING', 'BRANCH_VISIT'].includes(row.interactionType)) meetings++;
            else if (['EMAIL', 'MESSAGE'].includes(row.interactionType)) emails++;
            else if (row.interactionType === 'SERVICE_CONTACT') serviceContacts++;
            else other++;
          }
        }
        const total = calls + meetings + emails + serviceContacts + other;
        totalCalls += calls;
        totalMeetings += meetings;
        totalEmails += emails;
        totalServiceContacts += serviceContacts;
        totalOther += other;
        periods.push({ periodLabel: label, calls, meetings, emails, serviceContacts, other, total });
      }
    } else if (timeframe === '30d') {
      // 4 weekly periods
      for (let w = 3; w >= 0; w--) {
        const start = new Date(now);
        start.setDate(start.getDate() - (w + 1) * 7);
        const end = new Date(now);
        end.setDate(end.getDate() - w * 7);
        const label = `W-${4 - w} (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

        let calls = 0, meetings = 0, emails = 0, serviceContacts = 0, other = 0;
        for (const row of allRows) {
          const t = row.timestamp.getTime();
          if (t >= start.getTime() && t < end.getTime()) {
            if (row.interactionType === 'CALL') calls++;
            else if (['MEETING', 'VIDEO_MEETING', 'BRANCH_VISIT'].includes(row.interactionType)) meetings++;
            else if (['EMAIL', 'MESSAGE'].includes(row.interactionType)) emails++;
            else if (row.interactionType === 'SERVICE_CONTACT') serviceContacts++;
            else other++;
          }
        }
        const total = calls + meetings + emails + serviceContacts + other;
        totalCalls += calls;
        totalMeetings += meetings;
        totalEmails += emails;
        totalServiceContacts += serviceContacts;
        totalOther += other;
        periods.push({ periodLabel: label, calls, meetings, emails, serviceContacts, other, total });
      }
    } else if (timeframe === '90d') {
      // 3 monthly periods
      for (let m = 2; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

        let calls = 0, meetings = 0, emails = 0, serviceContacts = 0, other = 0;
        for (const row of allRows) {
          const t = row.timestamp.getTime();
          if (t >= monthStart && t < nextMonth) {
            if (row.interactionType === 'CALL') calls++;
            else if (['MEETING', 'VIDEO_MEETING', 'BRANCH_VISIT'].includes(row.interactionType)) meetings++;
            else if (['EMAIL', 'MESSAGE'].includes(row.interactionType)) emails++;
            else if (row.interactionType === 'SERVICE_CONTACT') serviceContacts++;
            else other++;
          }
        }
        const total = calls + meetings + emails + serviceContacts + other;
        totalCalls += calls;
        totalMeetings += meetings;
        totalEmails += emails;
        totalServiceContacts += serviceContacts;
        totalOther += other;
        periods.push({ periodLabel: label, calls, meetings, emails, serviceContacts, other, total });
      }
    } else {
      // 12m: 12 months
      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const label = d.toLocaleDateString('en-US', { month: 'short' });
        const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();

        let calls = 0, meetings = 0, emails = 0, serviceContacts = 0, other = 0;
        for (const row of allRows) {
          const t = row.timestamp.getTime();
          if (t >= monthStart && t < nextMonth) {
            if (row.interactionType === 'CALL') calls++;
            else if (['MEETING', 'VIDEO_MEETING', 'BRANCH_VISIT'].includes(row.interactionType)) meetings++;
            else if (['EMAIL', 'MESSAGE'].includes(row.interactionType)) emails++;
            else if (row.interactionType === 'SERVICE_CONTACT') serviceContacts++;
            else other++;
          }
        }
        const total = calls + meetings + emails + serviceContacts + other;
        totalCalls += calls;
        totalMeetings += meetings;
        totalEmails += emails;
        totalServiceContacts += serviceContacts;
        totalOther += other;
        periods.push({ periodLabel: label, calls, meetings, emails, serviceContacts, other, total });
      }
    }

    return {
      timeframe,
      periods,
      summary: {
        totalCalls,
        totalMeetings,
        totalEmails,
        totalServiceContacts,
        totalOther,
        grandTotal: totalCalls + totalMeetings + totalEmails + totalServiceContacts + totalOther,
      },
    };
  },
};
