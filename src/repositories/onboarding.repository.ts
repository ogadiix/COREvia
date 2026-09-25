import { db } from '../db/index.ts';
import {
  onboardingApplications,
  onboardingProducts,
  kycReviews,
  kybReviews,
  onboardingDocuments,
  onboardingExceptions,
  onboardingAssignments,
  onboardingEvents,
  customers,
  users,
  opportunities,
  products,
} from '../db/schema.ts';
import { eq, and, or, sql, desc, asc, ilike } from 'drizzle-orm';
import {
  OnboardingApplicationItem,
  OnboardingDocumentItem,
  OnboardingExceptionItem,
  OnboardingSummaryMetrics,
  OnboardingStatus,
  KycStatus,
  KybStatus,
} from '../types/index.ts';

export interface ListOnboardingParams {
  search?: string;
  status?: string;
  queue?: 'ALL' | 'APPLICATIONS' | 'KYC' | 'KYB' | 'DOCUMENTS' | 'EXCEPTIONS' | 'COMPLETED';
  kycStatus?: string;
  customerType?: string;
  branchCode?: string;
  assignedRmId?: number;
  assignedOfficerId?: number;
  slaStatus?: string;
  priority?: string;
  page?: number;
  limit?: number;
}

export const onboardingRepository = {
  async listApplications(params: ListOnboardingParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(onboardingApplications.applicationNumber, s),
          ilike(onboardingApplications.applicantName, s),
          ilike(onboardingApplications.branchCode, s),
          ilike(onboardingApplications.branchName, s)
        )
      );
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(onboardingApplications.status, params.status));
    }

    if (params.queue) {
      if (params.queue === 'KYC') {
        conditions.push(
          and(
            eq(onboardingApplications.customerType, 'INDIVIDUAL'),
            or(
              eq(onboardingApplications.status, 'KYC_REVIEW'),
              eq(onboardingApplications.status, 'DOCUMENT_REVIEW'),
              eq(onboardingApplications.status, 'ADDITIONAL_INFORMATION')
            )
          )
        );
      } else if (params.queue === 'KYB') {
        conditions.push(
          and(
            eq(onboardingApplications.customerType, 'BUSINESS'),
            or(
              eq(onboardingApplications.status, 'KYC_REVIEW'),
              eq(onboardingApplications.status, 'DOCUMENT_REVIEW'),
              eq(onboardingApplications.status, 'COMPLIANCE_REVIEW'),
              eq(onboardingApplications.status, 'ADDITIONAL_INFORMATION')
            )
          )
        );
      } else if (params.queue === 'DOCUMENTS') {
        conditions.push(
          or(
            eq(onboardingApplications.documentStatus, 'UNDER_REVIEW'),
            eq(onboardingApplications.documentStatus, 'REPLACEMENT_REQUIRED')
          )
        );
      } else if (params.queue === 'EXCEPTIONS') {
        conditions.push(sql`${onboardingApplications.exceptionCount} > 0`);
      } else if (params.queue === 'COMPLETED') {
        conditions.push(
          or(
            eq(onboardingApplications.status, 'COMPLETED'),
            eq(onboardingApplications.status, 'APPROVED')
          )
        );
      }
    }

    if (params.customerType && params.customerType !== 'ALL') {
      conditions.push(eq(onboardingApplications.customerType, params.customerType));
    }

    if (params.branchCode) {
      conditions.push(eq(onboardingApplications.branchCode, params.branchCode));
    }

    if (params.assignedRmId) {
      conditions.push(eq(onboardingApplications.assignedRmId, params.assignedRmId));
    }

    if (params.assignedOfficerId) {
      conditions.push(eq(onboardingApplications.assignedOfficerId, params.assignedOfficerId));
    }

    if (params.slaStatus && params.slaStatus !== 'ALL') {
      conditions.push(eq(onboardingApplications.slaStatus, params.slaStatus));
    }

    if (params.priority && params.priority !== 'ALL') {
      conditions.push(eq(onboardingApplications.priority, params.priority));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const countRes = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(onboardingApplications)
      .where(whereClause);

    const total = countRes[0]?.count || 0;

    const apps = await db
      .select({
        app: onboardingApplications,
        customerCode: customers.customerCode,
        rmName: users.name,
      })
      .from(onboardingApplications)
      .leftJoin(customers, eq(onboardingApplications.customerId, customers.id))
      .leftJoin(users, eq(onboardingApplications.assignedRmId, users.id))
      .where(whereClause)
      .orderBy(desc(onboardingApplications.lastUpdated))
      .limit(limit)
      .offset(offset);

    const data: OnboardingApplicationItem[] = apps.map((row) => ({
      ...row.app,
      customerCode: row.customerCode,
      assignedRmName: row.rmName,
      slaHoursTotal: row.app.slaHoursTotal,
      slaHoursRemaining: row.app.slaHoursRemaining,
      slaStatus: row.app.slaStatus as any,
      priority: row.app.priority as any,
      status: row.app.status as any,
      kycStatus: row.app.kycStatus as any,
      kybStatus: (row.app.kybStatus || 'NOT_APPLICABLE') as any,
      customerType: row.app.customerType as any,
      slaDeadline: row.app.slaDeadline ? row.app.slaDeadline.toISOString() : null,
      approvedAt: row.app.approvedAt ? row.app.approvedAt.toISOString() : null,
      completedAt: row.app.completedAt ? row.app.completedAt.toISOString() : null,
      submittedDate: row.app.submittedDate ? row.app.submittedDate.toISOString() : null,
      lastUpdated: row.app.lastUpdated ? row.app.lastUpdated.toISOString() : new Date().toISOString(),
      createdAt: row.app.createdAt ? row.app.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: row.app.updatedAt ? row.app.updatedAt.toISOString() : new Date().toISOString(),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findByIdOrNumber(idOrNumber: string | number): Promise<OnboardingApplicationItem | null> {
    const isNumeric = typeof idOrNumber === 'number' || /^\d+$/.test(String(idOrNumber).trim());

    const query = db
      .select({
        app: onboardingApplications,
        customerCode: customers.customerCode,
        assignedRmName: sql<string>`u_rm.name`,
        assignedOfficerName: sql<string>`u_off.name`,
        approvedByName: sql<string>`u_appr.name`,
        completedByName: sql<string>`u_comp.name`,
        opportunityTitle: opportunities.title,
      })
      .from(onboardingApplications)
      .leftJoin(customers, eq(onboardingApplications.customerId, customers.id))
      .leftJoin(opportunities, eq(onboardingApplications.opportunityId, opportunities.id))
      .leftJoin(sql`users u_rm`, sql`${onboardingApplications.assignedRmId} = u_rm.id`)
      .leftJoin(sql`users u_off`, sql`${onboardingApplications.assignedOfficerId} = u_off.id`)
      .leftJoin(sql`users u_appr`, sql`${onboardingApplications.approvedById} = u_appr.id`)
      .leftJoin(sql`users u_comp`, sql`${onboardingApplications.completedById} = u_comp.id`);

    let rows: any[];
    if (isNumeric) {
      rows = await query.where(eq(onboardingApplications.id, Number(idOrNumber))).limit(1);
    } else {
      rows = await query
        .where(eq(onboardingApplications.applicationNumber, String(idOrNumber).trim()))
        .limit(1);
    }

    if (!rows || rows.length === 0) {
      return null;
    }

    const row = rows[0];
    const appId = row.app.id;

    // Fetch related records in parallel
    const [prods, kyc, kyb, docs, excs, evts] = await Promise.all([
      db
        .select()
        .from(onboardingProducts)
        .where(eq(onboardingProducts.applicationId, appId)),
      db
        .select({
          kyc: kycReviews,
          reviewerName: users.name,
        })
        .from(kycReviews)
        .leftJoin(users, eq(kycReviews.reviewerId, users.id))
        .where(eq(kycReviews.applicationId, appId))
        .limit(1),
      db
        .select({
          kyb: kybReviews,
          reviewerName: users.name,
        })
        .from(kybReviews)
        .leftJoin(users, eq(kybReviews.reviewerId, users.id))
        .where(eq(kybReviews.applicationId, appId))
        .limit(1),
      db
        .select({
          doc: onboardingDocuments,
          uploadedByName: sql<string>`u_up.name`,
          reviewedByName: sql<string>`u_rev.name`,
        })
        .from(onboardingDocuments)
        .leftJoin(sql`users u_up`, sql`${onboardingDocuments.uploadedById} = u_up.id`)
        .leftJoin(sql`users u_rev`, sql`${onboardingDocuments.reviewedById} = u_rev.id`)
        .where(eq(onboardingDocuments.applicationId, appId))
        .orderBy(desc(onboardingDocuments.createdAt)),
      db
        .select({
          exc: onboardingExceptions,
          ownerName: sql<string>`u_own.name`,
          resolvedByName: sql<string>`u_res.name`,
          waivedByName: sql<string>`u_waiv.name`,
        })
        .from(onboardingExceptions)
        .leftJoin(sql`users u_own`, sql`${onboardingExceptions.ownerId} = u_own.id`)
        .leftJoin(sql`users u_res`, sql`${onboardingExceptions.resolvedById} = u_res.id`)
        .leftJoin(sql`users u_waiv`, sql`${onboardingExceptions.waivedById} = u_waiv.id`)
        .where(eq(onboardingExceptions.applicationId, appId))
        .orderBy(desc(onboardingExceptions.createdAt)),
      db
        .select()
        .from(onboardingEvents)
        .where(eq(onboardingEvents.applicationId, appId))
        .orderBy(desc(onboardingEvents.createdAt)),
    ]);

    const kycItem = kyc[0]
      ? {
          ...kyc[0].kyc,
          reviewerName: kyc[0].reviewerName,
          status: kyc[0].kyc.status as any,
          reviewedAt: kyc[0].kyc.reviewedAt ? kyc[0].kyc.reviewedAt.toISOString() : null,
          updatedAt: kyc[0].kyc.updatedAt ? kyc[0].kyc.updatedAt.toISOString() : undefined,
        }
      : null;

    const kybItem = kyb[0]
      ? {
          ...kyb[0].kyb,
          reviewerName: kyb[0].reviewerName,
          status: kyb[0].kyb.status as any,
          reviewedAt: kyb[0].kyb.reviewedAt ? kyb[0].kyb.reviewedAt.toISOString() : null,
          updatedAt: kyb[0].kyb.updatedAt ? kyb[0].kyb.updatedAt.toISOString() : undefined,
        }
      : null;

    const docItems = docs.map((d) => ({
      ...d.doc,
      uploadedByName: d.uploadedByName,
      reviewedByName: d.reviewedByName,
      status: d.doc.status as any,
      uploadedAt: d.doc.uploadedAt ? d.doc.uploadedAt.toISOString() : new Date().toISOString(),
      reviewedAt: d.doc.reviewedAt ? d.doc.reviewedAt.toISOString() : null,
      expiryDate: d.doc.expiryDate ? String(d.doc.expiryDate) : null,
      replacementDueDate: d.doc.replacementDueDate ? String(d.doc.replacementDueDate) : null,
    }));

    const excItems = excs.map((e) => ({
      ...e.exc,
      ownerName: e.ownerName,
      resolvedByName: e.resolvedByName,
      waivedByName: e.waivedByName,
      status: e.exc.status as any,
      severity: e.exc.severity as any,
      dueDate: e.exc.dueDate ? e.exc.dueDate.toISOString() : null,
      resolvedAt: e.exc.resolvedAt ? e.exc.resolvedAt.toISOString() : null,
      waivedAt: e.exc.waivedAt ? e.exc.waivedAt.toISOString() : null,
      createdAt: e.exc.createdAt ? e.exc.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: e.exc.updatedAt ? e.exc.updatedAt.toISOString() : new Date().toISOString(),
    }));

    const evtItems = evts.map((e) => ({
      ...e,
      createdAt: e.createdAt ? e.createdAt.toISOString() : new Date().toISOString(),
    }));

    return {
      ...row.app,
      customerCode: row.customerCode,
      assignedRmName: row.assignedRmName,
      assignedOfficerName: row.assignedOfficerName,
      approvedByName: row.approvedByName,
      completedByName: row.completedByName,
      opportunityTitle: row.opportunityTitle,
      slaHoursTotal: row.app.slaHoursTotal,
      slaHoursRemaining: row.app.slaHoursRemaining,
      slaStatus: row.app.slaStatus as any,
      priority: row.app.priority as any,
      status: row.app.status as any,
      kycStatus: row.app.kycStatus as any,
      kybStatus: (row.app.kybStatus || 'NOT_APPLICABLE') as any,
      customerType: row.app.customerType as any,
      submittedDate: row.app.submittedDate ? row.app.submittedDate.toISOString() : null,
      lastUpdated: row.app.lastUpdated ? row.app.lastUpdated.toISOString() : new Date().toISOString(),
      createdAt: row.app.createdAt ? row.app.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: row.app.updatedAt ? row.app.updatedAt.toISOString() : new Date().toISOString(),
      products: prods.map((p) => ({
        ...p,
        status: p.status as any,
      })),
      kycReview: kycItem,
      kybReview: kybItem,
      documents: docItems,
      exceptions: excItems,
      events: evtItems,
    };
  },

  async findByCustomerId(customerId: number): Promise<OnboardingApplicationItem[]> {
    const apps = await db
      .select()
      .from(onboardingApplications)
      .where(eq(onboardingApplications.customerId, customerId))
      .orderBy(desc(onboardingApplications.lastUpdated));

    return apps.map((app) => ({
      ...app,
      slaHoursTotal: app.slaHoursTotal,
      slaHoursRemaining: app.slaHoursRemaining,
      slaStatus: app.slaStatus as any,
      priority: app.priority as any,
      status: app.status as any,
      kycStatus: app.kycStatus as any,
      kybStatus: (app.kybStatus || 'NOT_APPLICABLE') as any,
      customerType: app.customerType as any,
      slaDeadline: app.slaDeadline ? app.slaDeadline.toISOString() : null,
      approvedAt: app.approvedAt ? app.approvedAt.toISOString() : null,
      completedAt: app.completedAt ? app.completedAt.toISOString() : null,
      submittedDate: app.submittedDate ? app.submittedDate.toISOString() : null,
      lastUpdated: app.lastUpdated ? app.lastUpdated.toISOString() : new Date().toISOString(),
      createdAt: app.createdAt ? app.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: app.updatedAt ? app.updatedAt.toISOString() : new Date().toISOString(),
    }));
  },

  async createApplication(data: {
    applicantName: string;
    customerType: 'INDIVIDUAL' | 'BUSINESS';
    onboardingType: string;
    customerId?: number | null;
    assignedRmId?: number | null;
    branchCode?: string;
    branchName?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    opportunityId?: number | null;
    notes?: string;
    products?: Array<{
      productId?: number;
      productName: string;
      productCode: string;
      category: string;
      initialDepositAmount?: number;
    }>;
    createdBy: number;
    actorName: string;
    actorRole: string;
  }): Promise<OnboardingApplicationItem> {
    const year = new Date().getFullYear();
    const countRes = await db.select({ count: sql<number>`count(*)::int` }).from(onboardingApplications);
    const nextSeq = (countRes[0]?.count || 0) + 190;
    const applicationNumber = `ONB-${year}-${String(nextSeq).padStart(5, '0')}`;

    const [created] = await db
      .insert(onboardingApplications)
      .values({
        applicationNumber,
        customerId: data.customerId || null,
        applicantName: data.applicantName,
        customerType: data.customerType,
        onboardingType: data.onboardingType,
        assignedRmId: data.assignedRmId || data.createdBy,
        branchCode: data.branchCode || 'BR-0104',
        branchName: data.branchName || 'Fort, Mumbai Main Branch',
        submittedDate: new Date(),
        lastUpdated: new Date(),
        status: 'SUBMITTED',
        kycStatus: 'NOT_STARTED',
        kybStatus: data.customerType === 'BUSINESS' ? 'NOT_STARTED' : 'NOT_APPLICABLE',
        documentStatus: 'PENDING',
        riskReviewStatus: 'PENDING',
        priority: data.priority || 'MEDIUM',
        slaHoursTotal: 48,
        slaHoursRemaining: 48,
        slaStatus: 'ON_TRACK',
        slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
        exceptionCount: 0,
        opportunityId: data.opportunityId || null,
        notes: data.notes || null,
        createdBy: data.createdBy,
      })
      .returning();

    // Create Initial KYC record
    await db.insert(kycReviews).values({
      applicationId: created.id,
      customerId: data.customerId || null,
      identityStatus: 'NOT_STARTED',
      addressStatus: 'NOT_STARTED',
      contactStatus: 'NOT_STARTED',
      panVerificationStatus: 'NOT_VERIFIED',
      status: 'NOT_STARTED',
      reviewSummary: 'Initial application queued for triage.',
    });

    // Create KYB record if business
    if (data.customerType === 'BUSINESS') {
      await db.insert(kybReviews).values({
        applicationId: created.id,
        legalEntityName: data.applicantName,
        entityType: 'PRIVATE_LIMITED',
        uboVerificationStatus: 'PENDING',
        uboCount: 1,
        boardResolutionStatus: 'PENDING',
        authorizedSignatoriesStatus: 'PENDING',
        status: 'NOT_STARTED',
      });
    }

    // Insert products if provided
    if (data.products && data.products.length > 0) {
      for (const p of data.products) {
        await db.insert(onboardingProducts).values({
          applicationId: created.id,
          productId: p.productId || null,
          productName: p.productName,
          productCode: p.productCode,
          category: p.category,
          status: 'REQUESTED',
          initialDepositAmount: String(p.initialDepositAmount || 0),
        });
      }
    }

    // Record Event
    await db.insert(onboardingEvents).values({
      applicationId: created.id,
      eventType: 'ONBOARDING_CREATED',
      actorId: data.createdBy,
      actorName: data.actorName,
      actorRole: data.actorRole,
      title: 'Application Created',
      description: `New onboarding application ${applicationNumber} created for ${data.applicantName}.`,
    });

    const fullApp = await this.findByIdOrNumber(created.id);
    return fullApp!;
  },

  async updateStatus(
    applicationId: number,
    newStatus: OnboardingStatus,
    reason: string | undefined,
    actor: { id: number; name: string; role: string }
  ) {
    const updateData: any = {
      status: newStatus,
      lastUpdated: new Date(),
      updatedAt: new Date(),
    };

    if (newStatus === 'APPROVED') {
      updateData.approvedById = actor.id;
      updateData.approvedAt = new Date();
    } else if (newStatus === 'REJECTED') {
      updateData.rejectionReason = reason || 'Declined during review';
    } else if (newStatus === 'COMPLETED') {
      updateData.completedById = actor.id;
      updateData.completedAt = new Date();
      updateData.slaHoursRemaining = 0;
    }

    await db
      .update(onboardingApplications)
      .set(updateData)
      .where(eq(onboardingApplications.id, applicationId));

    await db.insert(onboardingEvents).values({
      applicationId,
      eventType: `ONBOARDING_${newStatus}`,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      title: `Status Changed to ${newStatus.replace(/_/g, ' ')}`,
      description: reason || `Application status updated to ${newStatus}.`,
    });

    return await this.findByIdOrNumber(applicationId);
  },

  async updateKycReview(
    applicationId: number,
    data: {
      status: KycStatus;
      identityStatus?: string;
      addressStatus?: string;
      contactStatus?: string;
      panVerificationStatus?: string;
      panNumber?: string;
      aadhaarStatus?: string;
      pepStatus?: string;
      sanctionsCheckStatus?: string;
      adverseMediaStatus?: string;
      riskCategory?: string;
      reviewSummary?: string;
    },
    actor: { id: number; name: string; role: string }
  ) {
    await db
      .update(kycReviews)
      .set({
        ...data,
        reviewerId: actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(kycReviews.applicationId, applicationId));

    // Update parent application KYC status & timestamp
    const appUpdate: any = {
      kycStatus: data.status,
      lastUpdated: new Date(),
      updatedAt: new Date(),
    };

    if (data.status === 'VERIFIED') {
      appUpdate.status = 'COMPLIANCE_REVIEW';
    } else if (data.status === 'ADDITIONAL_INFORMATION_REQUIRED') {
      appUpdate.status = 'ADDITIONAL_INFORMATION';
    } else if (data.status === 'FAILED') {
      appUpdate.status = 'REJECTED';
      appUpdate.rejectionReason = data.reviewSummary || 'KYC verification criteria failed';
    }

    await db
      .update(onboardingApplications)
      .set(appUpdate)
      .where(eq(onboardingApplications.id, applicationId));

    await db.insert(onboardingEvents).values({
      applicationId,
      eventType: 'KYC_STATUS_CHANGED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      title: `KYC Review: ${data.status.replace(/_/g, ' ')}`,
      description: data.reviewSummary || `KYC verification status changed to ${data.status}.`,
    });

    return await this.findByIdOrNumber(applicationId);
  },

  async updateKybReview(
    applicationId: number,
    data: {
      status: KybStatus;
      legalEntityName?: string;
      entityType?: string;
      cinOrRegistrationNumber?: string;
      gstin?: string;
      uboVerificationStatus?: string;
      uboCount?: number;
      boardResolutionStatus?: string;
      authorizedSignatoriesStatus?: string;
    },
    actor: { id: number; name: string; role: string }
  ) {
    await db
      .update(kybReviews)
      .set({
        ...data,
        reviewerId: actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(kybReviews.applicationId, applicationId));

    await db
      .update(onboardingApplications)
      .set({
        kybStatus: data.status,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingApplications.id, applicationId));

    await db.insert(onboardingEvents).values({
      applicationId,
      eventType: 'KYB_STATUS_CHANGED',
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      title: `KYB Review: ${data.status.replace(/_/g, ' ')}`,
      description: `Entity diligence status updated to ${data.status}.`,
    });

    return await this.findByIdOrNumber(applicationId);
  },

  async addDocument(
    applicationId: number,
    data: {
      documentType: string;
      title: string;
      fileName: string;
      fileSize?: string;
      mimeType?: string;
      uploadedById: number;
      actorName: string;
      actorRole: string;
    }
  ): Promise<OnboardingDocumentItem> {
    const codeCount = await db.select({ count: sql<number>`count(*)::int` }).from(onboardingDocuments);
    const documentCode = `DOC-ONB-${String((codeCount[0]?.count || 0) + 1).padStart(3, '0')}`;

    const [doc] = await db
      .insert(onboardingDocuments)
      .values({
        documentCode,
        applicationId,
        documentType: data.documentType,
        title: data.title,
        fileName: data.fileName,
        fileSize: data.fileSize || '1.2 MB',
        mimeType: data.mimeType || 'application/pdf',
        status: 'UPLOADED',
        uploadedById: data.uploadedById,
        version: 1,
      })
      .returning();

    await db
      .update(onboardingApplications)
      .set({
        documentStatus: 'UNDER_REVIEW',
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingApplications.id, applicationId));

    await db.insert(onboardingEvents).values({
      applicationId,
      eventType: 'DOCUMENT_UPLOADED',
      actorId: data.uploadedById,
      actorName: data.actorName,
      actorRole: data.actorRole,
      title: `Document Uploaded: ${data.title}`,
      description: `Uploaded ${data.fileName} (${data.documentType}).`,
    });

    return {
      ...doc,
      status: doc.status as any,
      uploadedAt: doc.uploadedAt.toISOString(),
      reviewedAt: null,
      expiryDate: null,
      replacementDueDate: null,
    };
  },

  async reviewDocument(
    documentId: number,
    data: {
      status: 'VERIFIED' | 'REJECTED' | 'REPLACEMENT_REQUIRED';
      rejectionReason?: string;
      replacementReason?: string;
      requestedDocType?: string;
      replacementDueDate?: string;
    },
    actor: { id: number; name: string; role: string }
  ) {
    const [doc] = await db
      .update(onboardingDocuments)
      .set({
        status: data.status,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        rejectionReason: data.rejectionReason || null,
        replacementReason: data.replacementReason || null,
        requestedDocType: data.requestedDocType || null,
        replacementDueDate: data.replacementDueDate ? (data.replacementDueDate as any) : null,
        updatedAt: new Date(),
      })
      .where(eq(onboardingDocuments.id, documentId))
      .returning();

    if (doc) {
      const eventType =
        data.status === 'REPLACEMENT_REQUIRED'
          ? 'DOCUMENT_REPLACEMENT_REQUESTED'
          : data.status === 'REJECTED'
          ? 'DOCUMENT_REJECTED'
          : 'DOCUMENT_REVIEWED';

      await db.insert(onboardingEvents).values({
        applicationId: doc.applicationId,
        eventType,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        title: `Document ${data.status.replace(/_/g, ' ')}: ${doc.title}`,
        description:
          data.rejectionReason ||
          data.replacementReason ||
          `Document verified by ${actor.name}.`,
      });

      // Update parent application documentStatus
      if (data.status === 'REPLACEMENT_REQUIRED') {
        await db
          .update(onboardingApplications)
          .set({
            documentStatus: 'REPLACEMENT_REQUIRED',
            status: 'ADDITIONAL_INFORMATION',
            lastUpdated: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(onboardingApplications.id, doc.applicationId));
      }
    }

    return doc;
  },

  async createException(data: {
    applicationId: number;
    type: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    ownerId?: number;
    dueDate?: string;
    actor: { id: number; name: string; role: string };
  }): Promise<OnboardingExceptionItem> {
    const codeCount = await db.select({ count: sql<number>`count(*)::int` }).from(onboardingExceptions);
    const exceptionCode = `EXC-2026-${String((codeCount[0]?.count || 0) + 45).padStart(4, '0')}`;

    const [exc] = await db
      .insert(onboardingExceptions)
      .values({
        exceptionCode,
        applicationId: data.applicationId,
        type: data.type,
        severity: data.severity,
        title: data.title,
        description: data.description,
        status: 'OPEN',
        ownerId: data.ownerId || data.actor.id,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      })
      .returning();

    // Increment exception count on application
    await db
      .update(onboardingApplications)
      .set({
        exceptionCount: sql`${onboardingApplications.exceptionCount} + 1`,
        lastUpdated: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingApplications.id, data.applicationId));

    await db.insert(onboardingEvents).values({
      applicationId: data.applicationId,
      eventType: 'EXCEPTION_CREATED',
      actorId: data.actor.id,
      actorName: data.actor.name,
      actorRole: data.actor.role,
      title: `Exception Raised: ${data.title}`,
      description: data.description,
    });

    return {
      ...exc,
      status: exc.status as any,
      severity: exc.severity as any,
      dueDate: exc.dueDate ? exc.dueDate.toISOString() : null,
      resolvedAt: null,
      waivedAt: null,
      createdAt: exc.createdAt.toISOString(),
      updatedAt: exc.updatedAt.toISOString(),
    };
  },

  async resolveException(
    exceptionId: number,
    resolution: string,
    actor: { id: number; name: string; role: string }
  ) {
    const [exc] = await db
      .update(onboardingExceptions)
      .set({
        status: 'RESOLVED',
        resolution,
        resolvedById: actor.id,
        resolvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingExceptions.id, exceptionId))
      .returning();

    if (exc) {
      // Re-calculate open exception count
      const openCountRes = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(onboardingExceptions)
        .where(
          and(
            eq(onboardingExceptions.applicationId, exc.applicationId),
            or(eq(onboardingExceptions.status, 'OPEN'), eq(onboardingExceptions.status, 'IN_PROGRESS'))
          )
        );

      const openCount = openCountRes[0]?.count || 0;

      await db
        .update(onboardingApplications)
        .set({
          exceptionCount: openCount,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onboardingApplications.id, exc.applicationId));

      await db.insert(onboardingEvents).values({
        applicationId: exc.applicationId,
        eventType: 'EXCEPTION_RESOLVED',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        title: `Exception Resolved: ${exc.title}`,
        description: resolution,
      });
    }

    return exc;
  },

  async waiveException(
    exceptionId: number,
    waiveReason: string,
    actor: { id: number; name: string; role: string }
  ) {
    const [exc] = await db
      .update(onboardingExceptions)
      .set({
        status: 'WAIVED',
        waiveReason,
        waivedById: actor.id,
        waivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(onboardingExceptions.id, exceptionId))
      .returning();

    if (exc) {
      const openCountRes = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(onboardingExceptions)
        .where(
          and(
            eq(onboardingExceptions.applicationId, exc.applicationId),
            or(eq(onboardingExceptions.status, 'OPEN'), eq(onboardingExceptions.status, 'IN_PROGRESS'))
          )
        );

      await db
        .update(onboardingApplications)
        .set({
          exceptionCount: openCountRes[0]?.count || 0,
          lastUpdated: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(onboardingApplications.id, exc.applicationId));

      await db.insert(onboardingEvents).values({
        applicationId: exc.applicationId,
        eventType: 'EXCEPTION_WAIVED',
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        title: `Exception Waived: ${exc.title}`,
        description: `Waived by ${actor.name}. Reason: ${waiveReason}`,
      });
    }

    return exc;
  },

  async reassign(
    applicationId: number,
    data: {
      assignedToId: number;
      roleScope: 'RELATIONSHIP_MANAGER' | 'KYC_OFFICER' | 'OPERATIONS' | 'COMPLIANCE_OFFICER';
      reason?: string;
      actor: { id: number; name: string; role: string };
    }
  ) {
    await db.insert(onboardingAssignments).values({
      applicationId,
      assignedFromId: data.actor.id,
      assignedToId: data.assignedToId,
      roleScope: data.roleScope,
      reason: data.reason || null,
    });

    const updateSet: any = {
      lastUpdated: new Date(),
      updatedAt: new Date(),
    };

    if (data.roleScope === 'RELATIONSHIP_MANAGER') {
      updateSet.assignedRmId = data.assignedToId;
    } else {
      updateSet.assignedOfficerId = data.assignedToId;
    }

    await db
      .update(onboardingApplications)
      .set(updateSet)
      .where(eq(onboardingApplications.id, applicationId));

    const assignee = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, data.assignedToId))
      .limit(1);

    const assigneeName = assignee[0]?.name || `Officer #${data.assignedToId}`;

    await db.insert(onboardingEvents).values({
      applicationId,
      eventType: 'ONBOARDING_ASSIGNED',
      actorId: data.actor.id,
      actorName: data.actor.name,
      actorRole: data.actor.role,
      title: `Application Reassigned`,
      description: `Reassigned to ${assigneeName} (${data.roleScope.replace(/_/g, ' ')}). Reason: ${
        data.reason || 'Workflow rebalance'
      }`,
    });

    return await this.findByIdOrNumber(applicationId);
  },

  async getMetrics(userScope?: { userId?: number; role?: string }): Promise<OnboardingSummaryMetrics> {
    const conditions: any[] = [];
    if (userScope?.role === 'RELATIONSHIP_MANAGER' && userScope.userId) {
      conditions.push(eq(onboardingApplications.assignedRmId, userScope.userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [stats] = await db
      .select({
        total: sql<number>`count(*)::int`,
        submitted: sql<number>`count(*) filter (where ${onboardingApplications.status} = 'SUBMITTED')::int`,
        kycPending: sql<number>`count(*) filter (where ${onboardingApplications.kycStatus} in ('NOT_STARTED', 'IN_REVIEW'))::int`,
        kybPending: sql<number>`count(*) filter (where ${onboardingApplications.kybStatus} in ('NOT_STARTED', 'IN_REVIEW'))::int`,
        complianceReview: sql<number>`count(*) filter (where ${onboardingApplications.status} = 'COMPLIANCE_REVIEW')::int`,
        approved: sql<number>`count(*) filter (where ${onboardingApplications.status} = 'APPROVED')::int`,
        completed: sql<number>`count(*) filter (where ${onboardingApplications.status} = 'COMPLETED')::int`,
        rejected: sql<number>`count(*) filter (where ${onboardingApplications.status} = 'REJECTED')::int`,
        openExceptions: sql<number>`sum(${onboardingApplications.exceptionCount})::int`,
        slaAtRisk: sql<number>`count(*) filter (where ${onboardingApplications.slaStatus} = 'AT_RISK')::int`,
        slaBreached: sql<number>`count(*) filter (where ${onboardingApplications.slaStatus} = 'BREACHED')::int`,
      })
      .from(onboardingApplications)
      .where(whereClause);

    const [docStats] = await db
      .select({
        totalDocs: sql<number>`count(*)::int`,
        rejectedDocs: sql<number>`count(*) filter (where ${onboardingDocuments.status} in ('REJECTED', 'REPLACEMENT_REQUIRED'))::int`,
      })
      .from(onboardingDocuments);

    const totalDocs = docStats?.totalDocs || 1;
    const rejectedDocs = docStats?.rejectedDocs || 0;
    const documentRejectionRatePercent = Math.round((rejectedDocs / totalDocs) * 100);

    const totalApps = stats?.total || 0;
    const completedApps = stats?.completed || 0;
    const completionRatePercent = totalApps > 0 ? Math.round((completedApps / totalApps) * 100) : 0;

    return {
      totalApplications: totalApps,
      submittedCount: stats?.submitted || 0,
      kycPendingCount: stats?.kycPending || 0,
      kybPendingCount: stats?.kybPending || 0,
      complianceReviewCount: stats?.complianceReview || 0,
      approvedCount: stats?.approved || 0,
      completedCount: completedApps,
      rejectedCount: stats?.rejected || 0,
      openExceptionsCount: stats?.openExceptions || 0,
      slaAtRiskCount: stats?.slaAtRisk || 0,
      slaBreachedCount: stats?.slaBreached || 0,
      avgProcessingTimeHours: 28, // Historical average
      documentRejectionRatePercent,
      completionRatePercent,
    };
  },
};
