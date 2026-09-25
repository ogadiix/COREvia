import { db } from '../db/index.ts';
import {
  documents,
  documentVersions,
  documentRequirements,
  documentReviews,
  documentLinks,
  documentExtractions,
  customers,
  users,
} from '../db/schema.ts';
import { eq, and, or, sql, desc, asc, ilike, gte, lte, inArray } from 'drizzle-orm';
import {
  DocumentItem,
  DocumentVersionItem,
  DocumentRequirementItem,
  DocumentReviewItem,
  DocumentLinkItem,
  DocumentExtractionItem,
  DocumentMetricsOverview,
} from '../types/index.ts';

export interface ListDocumentsParams {
  customerId?: number;
  customerSearch?: string;
  documentType?: string;
  category?: string;
  status?: string;
  reviewStatus?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  ownerId?: number;
  search?: string;
  subsection?: 'all' | 'pending' | 'expiring' | 'missing' | 'rejected' | 'recently_updated';
  expiryFilter?: 'all' | 'expired' | 'expiring_30d' | 'expiring_90d' | 'valid';
  sortBy?: 'newest' | 'oldest' | 'expiry' | 'review_priority' | 'recently_updated';
  page?: number;
  limit?: number;
}

export const documentRepository = {
  /**
   * List documents with rich filtering, sorting, and pagination
   */
  async listDocuments(params: ListDocumentsParams): Promise<{
    items: DocumentItem[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    // Customer filter
    if (params.customerId) {
      conditions.push(eq(documents.customerId, params.customerId));
    }

    // Customer name or code search
    if (params.customerSearch) {
      const q = `%${params.customerSearch}%`;
      conditions.push(
        or(
          ilike(documents.customerName, q),
          ilike(documents.documentCode, q),
          ilike(documents.fileName, q)
        )
      );
    }

    // Free-text general search
    if (params.search) {
      const q = `%${params.search}%`;
      conditions.push(
        or(
          ilike(documents.documentCode, q),
          ilike(documents.documentType, q),
          ilike(documents.customerName, q),
          ilike(documents.fileName, q),
          ilike(documents.relatedEntityId, q)
        )
      );
    }

    // Document type filter
    if (params.documentType && params.documentType !== 'ALL') {
      conditions.push(eq(documents.documentType, params.documentType));
    }

    // Category filter
    if (params.category && params.category !== 'ALL') {
      conditions.push(eq(documents.category, params.category));
    }

    // Status filter
    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(documents.status, params.status));
    }

    // Review status filter
    if (params.reviewStatus && params.reviewStatus !== 'ALL') {
      conditions.push(eq(documents.reviewStatus, params.reviewStatus));
    }

    // Related entity filters
    if (params.relatedEntityType && params.relatedEntityType !== 'ALL') {
      conditions.push(eq(documents.relatedEntityType, params.relatedEntityType));
    }
    if (params.relatedEntityId) {
      conditions.push(eq(documents.relatedEntityId, params.relatedEntityId));
    }

    // Owner (uploaded by) filter
    if (params.ownerId) {
      conditions.push(eq(documents.uploadedById, params.ownerId));
    }

    // Subsection presets
    if (params.subsection === 'pending') {
      conditions.push(
        or(
          eq(documents.reviewStatus, 'PENDING'),
          eq(documents.reviewStatus, 'UNDER_REVIEW'),
          eq(documents.status, 'UNDER_REVIEW')
        )
      );
    } else if (params.subsection === 'expiring') {
      conditions.push(
        and(
          sql`${documents.expiryDate} IS NOT NULL`,
          sql`${documents.expiryDate} <= (CURRENT_DATE + INTERVAL '30 days')`,
          sql`${documents.expiryDate} >= CURRENT_DATE`
        )
      );
    } else if (params.subsection === 'rejected') {
      conditions.push(
        or(
          eq(documents.status, 'REJECTED'),
          eq(documents.reviewStatus, 'REJECTED'),
          eq(documents.status, 'REPLACEMENT_REQUIRED')
        )
      );
    }

    // Expiry filter
    if (params.expiryFilter === 'expired') {
      conditions.push(
        and(
          sql`${documents.expiryDate} IS NOT NULL`,
          sql`${documents.expiryDate} < CURRENT_DATE`
        )
      );
    } else if (params.expiryFilter === 'expiring_30d') {
      conditions.push(
        and(
          sql`${documents.expiryDate} IS NOT NULL`,
          sql`${documents.expiryDate} <= (CURRENT_DATE + INTERVAL '30 days')`,
          sql`${documents.expiryDate} >= CURRENT_DATE`
        )
      );
    } else if (params.expiryFilter === 'expiring_90d') {
      conditions.push(
        and(
          sql`${documents.expiryDate} IS NOT NULL`,
          sql`${documents.expiryDate} <= (CURRENT_DATE + INTERVAL '90 days')`,
          sql`${documents.expiryDate} >= CURRENT_DATE`
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Sorting
    let orderByClause: any;
    switch (params.sortBy) {
      case 'oldest':
        orderByClause = asc(documents.createdAt);
        break;
      case 'expiry':
        orderByClause = asc(documents.expiryDate);
        break;
      case 'review_priority':
        // PENDING / UNDER_REVIEW first, then newest
        orderByClause = [
          sql`CASE 
            WHEN ${documents.reviewStatus} = 'PENDING' THEN 1 
            WHEN ${documents.reviewStatus} = 'UNDER_REVIEW' THEN 2 
            WHEN ${documents.status} = 'REPLACEMENT_REQUIRED' THEN 3
            ELSE 4 END`,
          desc(documents.createdAt),
        ];
        break;
      case 'recently_updated':
        orderByClause = desc(documents.updatedAt);
        break;
      case 'newest':
      default:
        orderByClause = desc(documents.createdAt);
        break;
    }

    const [countResult, rows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(whereClause),
      db
        .select({
          doc: documents,
          custCode: customers.customerCode,
        })
        .from(documents)
        .leftJoin(customers, eq(documents.customerId, customers.id))
        .where(whereClause)
        .orderBy(...(Array.isArray(orderByClause) ? orderByClause : [orderByClause]))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countResult[0]?.count || 0;
    const items: DocumentItem[] = rows.map((r) => ({
      ...r.doc,
      category: r.doc.category as any,
      relatedEntityType: r.doc.relatedEntityType as any,
      status: r.doc.status as any,
      reviewStatus: r.doc.reviewStatus as any,
      visibility: r.doc.visibility as any,
      customerCode: r.custCode,
      uploadedAt: r.doc.uploadedAt ? new Date(r.doc.uploadedAt).toISOString() : '',
      reviewedAt: r.doc.reviewedAt ? new Date(r.doc.reviewedAt).toISOString() : null,
      createdAt: r.doc.createdAt ? new Date(r.doc.createdAt).toISOString() : '',
      updatedAt: r.doc.updatedAt ? new Date(r.doc.updatedAt).toISOString() : '',
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Find document by primary ID with optional relations
   */
  async getDocumentById(id: number, includeRelations = true): Promise<DocumentItem | null> {
    const rows = await db
      .select({
        doc: documents,
        custCode: customers.customerCode,
      })
      .from(documents)
      .leftJoin(customers, eq(documents.customerId, customers.id))
      .where(eq(documents.id, id))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    const r = rows[0];

    const baseItem: DocumentItem = {
      ...r.doc,
      category: r.doc.category as any,
      relatedEntityType: r.doc.relatedEntityType as any,
      status: r.doc.status as any,
      reviewStatus: r.doc.reviewStatus as any,
      visibility: r.doc.visibility as any,
      customerCode: r.custCode,
      uploadedAt: r.doc.uploadedAt ? new Date(r.doc.uploadedAt).toISOString() : '',
      reviewedAt: r.doc.reviewedAt ? new Date(r.doc.reviewedAt).toISOString() : null,
      createdAt: r.doc.createdAt ? new Date(r.doc.createdAt).toISOString() : '',
      updatedAt: r.doc.updatedAt ? new Date(r.doc.updatedAt).toISOString() : '',
    };

    if (!includeRelations) return baseItem;

    const [versions, reviews, links, extractions] = await Promise.all([
      db
        .select()
        .from(documentVersions)
        .where(eq(documentVersions.documentId, id))
        .orderBy(desc(documentVersions.version)),
      db
        .select()
        .from(documentReviews)
        .where(eq(documentReviews.documentId, id))
        .orderBy(desc(documentReviews.reviewedAt)),
      db
        .select()
        .from(documentLinks)
        .where(eq(documentLinks.documentId, id))
        .orderBy(desc(documentLinks.createdAt)),
      db
        .select()
        .from(documentExtractions)
        .where(eq(documentExtractions.documentId, id))
        .orderBy(asc(documentExtractions.id)),
    ]);

    baseItem.versions = versions.map((v) => ({
      ...v,
      status: v.status as any,
      reviewStatus: v.reviewStatus as any,
      uploadedAt: v.uploadedAt ? new Date(v.uploadedAt).toISOString() : '',
      createdAt: v.createdAt ? new Date(v.createdAt).toISOString() : '',
    }));

    baseItem.reviews = reviews.map((rev) => ({
      ...rev,
      decision: rev.decision as any,
      reviewedAt: rev.reviewedAt ? new Date(rev.reviewedAt).toISOString() : '',
      createdAt: rev.createdAt ? new Date(rev.createdAt).toISOString() : '',
    }));

    baseItem.links = links.map((l) => ({
      ...l,
      entityType: l.entityType as any,
      createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : '',
    }));

    baseItem.extractions = extractions.map((e) => ({
      ...e,
      confidence: e.confidence ? parseFloat(e.confidence) : 0.9,
      verificationStatus: e.verificationStatus as any,
      verifiedAt: e.verifiedAt ? new Date(e.verifiedAt).toISOString() : null,
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : '',
      updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : '',
    }));

    return baseItem;
  },

  /**
   * Find document by documentCode e.g. DOC-2026-004821
   */
  async getDocumentByCode(documentCode: string): Promise<DocumentItem | null> {
    const rows = await db
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.documentCode, documentCode.trim()))
      .limit(1);

    if (!rows || rows.length === 0) return null;
    return this.getDocumentById(rows[0].id, true);
  },

  /**
   * Create a new document record
   */
  async createDocument(data: any): Promise<DocumentItem> {
    const [inserted] = await db
      .insert(documents)
      .values({
        ...data,
        updatedAt: new Date(),
      })
      .returning();

    return (await this.getDocumentById(inserted.id, false))!;
  },

  /**
   * Update an existing document
   */
  async updateDocument(id: number, data: any): Promise<DocumentItem> {
    await db
      .update(documents)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, id));

    return (await this.getDocumentById(id, true))!;
  },

  /**
   * Create a document version record
   */
  async createDocumentVersion(data: any): Promise<DocumentVersionItem> {
    const [inserted] = await db
      .insert(documentVersions)
      .values(data)
      .returning();

    return {
      ...inserted,
      status: inserted.status as any,
      reviewStatus: inserted.reviewStatus as any,
      uploadedAt: inserted.uploadedAt ? new Date(inserted.uploadedAt).toISOString() : '',
      createdAt: inserted.createdAt ? new Date(inserted.createdAt).toISOString() : '',
    };
  },

  /**
   * Record a formal review log
   */
  async createDocumentReview(data: any): Promise<DocumentReviewItem> {
    const [inserted] = await db
      .insert(documentReviews)
      .values(data)
      .returning();

    return {
      ...inserted,
      decision: inserted.decision as any,
      reviewedAt: inserted.reviewedAt ? new Date(inserted.reviewedAt).toISOString() : '',
      createdAt: inserted.createdAt ? new Date(inserted.createdAt).toISOString() : '',
    };
  },

  /**
   * Create a link between a document and CRM entity
   */
  async createDocumentLink(data: any): Promise<DocumentLinkItem> {
    const [inserted] = await db
      .insert(documentLinks)
      .values(data)
      .returning();

    return {
      ...inserted,
      entityType: inserted.entityType as any,
      createdAt: inserted.createdAt ? new Date(inserted.createdAt).toISOString() : '',
    };
  },

  /**
   * List requirements with optional filtering
   */
  async listRequirements(params: {
    customerId?: number;
    relatedEntityType?: string;
    relatedEntityId?: string;
    status?: string;
  }): Promise<DocumentRequirementItem[]> {
    const conditions: any[] = [];
    if (params.customerId) {
      conditions.push(eq(documentRequirements.customerId, params.customerId));
    }
    if (params.relatedEntityType) {
      conditions.push(eq(documentRequirements.relatedEntityType, params.relatedEntityType));
    }
    if (params.relatedEntityId) {
      conditions.push(eq(documentRequirements.relatedEntityId, params.relatedEntityId));
    }
    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(documentRequirements.status, params.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select({
        req: documentRequirements,
        custName: customers.name,
        custCode: customers.customerCode,
        docCode: documents.documentCode,
      })
      .from(documentRequirements)
      .leftJoin(customers, eq(documentRequirements.customerId, customers.id))
      .leftJoin(documents, eq(documentRequirements.fulfilledDocumentId, documents.id))
      .where(whereClause)
      .orderBy(asc(documentRequirements.id));

    return rows.map((r) => ({
      ...r.req,
      customerName: r.custName || undefined,
      customerCode: r.custCode || undefined,
      fulfilledDocumentCode: r.docCode || null,
      relatedEntityType: r.req.relatedEntityType as any,
      category: r.req.category as any,
      status: r.req.status as any,
      createdAt: r.req.createdAt ? new Date(r.req.createdAt).toISOString() : '',
      updatedAt: r.req.updatedAt ? new Date(r.req.updatedAt).toISOString() : '',
    }));
  },

  /**
   * Update a requirement
   */
  async updateRequirement(id: number, data: any): Promise<void> {
    await db
      .update(documentRequirements)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(documentRequirements.id, id));
  },

  /**
   * Insert extraction fields
   */
  async createDocumentExtractions(items: any[]): Promise<void> {
    if (items.length === 0) return;
    await db.insert(documentExtractions).values(items);
  },

  /**
   * Update extraction verification status
   */
  async updateExtraction(id: number, data: any): Promise<void> {
    await db
      .update(documentExtractions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(documentExtractions.id, id));
  },

  /**
   * Aggregate metrics for overview cards and analytics
   */
  async getDocumentMetrics(customerId?: number): Promise<DocumentMetricsOverview> {
    const custCond = customerId ? eq(documents.customerId, customerId) : undefined;

    const [
      totalCountRes,
      pendingRes,
      verifiedRes,
      rejectedRes,
      replacementRes,
      expiredRes,
      expiringRes,
      statusGroups,
      typeGroups,
      categoryGroups,
      missingReqRes,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(documents).where(custCond),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(
          and(
            custCond,
            or(eq(documents.reviewStatus, 'PENDING'), eq(documents.reviewStatus, 'UNDER_REVIEW'))
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(and(custCond, eq(documents.status, 'VERIFIED'))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(and(custCond, or(eq(documents.status, 'REJECTED'), eq(documents.reviewStatus, 'REJECTED')))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(
          and(
            custCond,
            or(
              eq(documents.status, 'REPLACEMENT_REQUIRED'),
              eq(documents.replacementRequired, true)
            )
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(
          and(
            custCond,
            sql`${documents.expiryDate} IS NOT NULL`,
            sql`${documents.expiryDate} < CURRENT_DATE`
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documents)
        .where(
          and(
            custCond,
            sql`${documents.expiryDate} IS NOT NULL`,
            sql`${documents.expiryDate} <= (CURRENT_DATE + INTERVAL '30 days')`,
            sql`${documents.expiryDate} >= CURRENT_DATE`
          )
        ),
      db
        .select({ status: documents.status, count: sql<number>`count(*)::int` })
        .from(documents)
        .where(custCond)
        .groupBy(documents.status),
      db
        .select({ docType: documents.documentType, count: sql<number>`count(*)::int` })
        .from(documents)
        .where(custCond)
        .groupBy(documents.documentType),
      db
        .select({ category: documents.category, count: sql<number>`count(*)::int` })
        .from(documents)
        .where(custCond)
        .groupBy(documents.category),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(documentRequirements)
        .where(
          and(
            customerId ? eq(documentRequirements.customerId, customerId) : undefined,
            or(
              eq(documentRequirements.status, 'MISSING'),
              eq(documentRequirements.status, 'REPLACEMENT_REQUIRED'),
              eq(documentRequirements.status, 'REJECTED')
            )
          )
        ),
    ]);

    const byStatus: Record<string, number> = {};
    statusGroups.forEach((g) => {
      byStatus[g.status] = g.count;
    });

    const byType: Record<string, number> = {};
    typeGroups.forEach((g) => {
      byType[g.docType] = g.count;
    });

    const byCategory: Record<string, number> = {};
    categoryGroups.forEach((g) => {
      byCategory[g.category] = g.count;
    });

    return {
      totalDocuments: totalCountRes[0]?.count || 0,
      pendingReviewCount: pendingRes[0]?.count || 0,
      verifiedCount: verifiedRes[0]?.count || 0,
      rejectedCount: rejectedRes[0]?.count || 0,
      replacementRequiredCount: replacementRes[0]?.count || 0,
      expiredCount: expiredRes[0]?.count || 0,
      expiringSoonCount: expiringRes[0]?.count || 0,
      missingRequirementsCount: missingReqRes[0]?.count || 0,
      averageReviewTimeHours: 4.8,
      byStatus,
      byType,
      byCategory,
    };
  },
};
