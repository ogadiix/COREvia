import { onboardingRepository, ListOnboardingParams } from '../repositories/onboarding.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { taskService } from './task.service.ts';
import { notificationRuleService } from './notificationRule.service.ts';
import { notificationService } from './notification.service.ts';
import { BankingError } from '../lib/errors.ts';
import {
  OnboardingApplicationItem,
  OnboardingStatus,
  KycStatus,
  KybStatus,
} from '../types/index.ts';

export interface ActorContext {
  id: number;
  name: string;
  role: string;
  employeeId?: string;
  requestId: string;
}

export const onboardingService = {
  async listApplications(params: ListOnboardingParams, actor: ActorContext) {
    // RBAC: Relationship Managers only see applications assigned to them unless branch manager/admin/operations/compliance
    const isRM = actor.role === 'RELATIONSHIP_MANAGER';
    const effectiveParams: ListOnboardingParams = {
      ...params,
      assignedRmId: isRM ? actor.id : params.assignedRmId,
    };

    const results = await onboardingRepository.listApplications(effectiveParams);

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'VIEW_ONBOARDING_LIST',
      resourceType: 'ONBOARDING',
      resourceId: 'QUEUE',
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { queue: params.queue, count: results.data.length },
    });

    return results;
  },

  async getApplicationById(idOrNumber: string | number, actor: ActorContext) {
    const app = await onboardingRepository.findByIdOrNumber(idOrNumber);
    if (!app) {
      throw new BankingError('APPLICATION_NOT_FOUND', `Onboarding application ${idOrNumber} not found`, 404);
    }

    // RBAC enforcement: RM can only view their own assigned applications
    if (actor.role === 'RELATIONSHIP_MANAGER' && app.assignedRmId && app.assignedRmId !== actor.id) {
      throw new BankingError('UNAUTHORIZED', 'You are not authorized to view this onboarding application.', 403);
    }

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'VIEW_ONBOARDING_APPLICATION',
      resourceType: 'ONBOARDING',
      resourceId: app.applicationNumber,
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { applicationId: app.id, status: app.status },
    });

    return app;
  },

  async getCustomerOnboarding(customerId: number, actor: ActorContext) {
    const apps = await onboardingRepository.findByCustomerId(customerId);
    const activeApp = apps.find(
      (a) => !['COMPLETED', 'REJECTED', 'WITHDRAWN'].includes(a.status)
    );
    const completedApps = apps.filter((a) => a.status === 'COMPLETED');

    return {
      activeApplication: activeApp || null,
      history: apps,
      completedCount: completedApps.length,
    };
  },

  async createApplication(
    data: {
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
    },
    actor: ActorContext
  ) {
    if (!data.applicantName || !data.applicantName.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Applicant name is required', 400);
    }

    // If customerId given, verify customer exists
    if (data.customerId) {
      const cust = await customerRepository.findByIdOrCode(data.customerId);
      if (!cust) {
        throw new BankingError('CUSTOMER_NOT_FOUND', 'Customer record not found', 404);
      }
    }

    const app = await onboardingRepository.createApplication({
      ...data,
      createdBy: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'CREATE_ONBOARDING_APPLICATION',
      resourceType: 'ONBOARDING',
      resourceId: app.applicationNumber,
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: {
        applicationId: app.id,
        applicantName: app.applicantName,
        customerType: app.customerType,
        opportunityId: app.opportunityId,
      },
    });

    return app;
  },

  async updateStatus(
    applicationId: number,
    newStatus: OnboardingStatus,
    reason: string | undefined,
    actor: ActorContext
  ) {
    const current = await onboardingRepository.findByIdOrNumber(applicationId);
    if (!current) {
      throw new BankingError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    // State machine guard checks
    if (newStatus === 'APPROVED') {
      if (current.kycStatus !== 'VERIFIED') {
        throw new BankingError(
          'INVALID_STATE_TRANSITION',
          'Cannot approve application: KYC verification has not been completed.',
          400
        );
      }
      if (current.customerType === 'BUSINESS' && current.kybStatus !== 'VERIFIED') {
        throw new BankingError(
          'INVALID_STATE_TRANSITION',
          'Cannot approve business application: KYB verification is pending.',
          400
        );
      }
      if (current.exceptionCount > 0) {
        throw new BankingError(
          'INVALID_STATE_TRANSITION',
          `Cannot approve application with ${current.exceptionCount} unresolved exception(s).`,
          400
        );
      }
    }

    const updated = await onboardingRepository.updateStatus(applicationId, newStatus, reason, {
      id: actor.id,
      name: actor.name,
      role: actor.role,
    });

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: `ONBOARDING_STATUS_${newStatus}`,
      resourceType: 'ONBOARDING',
      resourceId: current.applicationNumber,
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { previousStatus: current.status, newStatus, reason },
    });

    return updated;
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
    actor: ActorContext
  ) {
    const app = await onboardingRepository.findByIdOrNumber(applicationId);
    if (!app) {
      throw new BankingError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    const updated = await onboardingRepository.updateKycReview(applicationId, data, {
      id: actor.id,
      name: actor.name,
      role: actor.role,
    });

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'UPDATE_KYC_REVIEW',
      resourceType: 'KYC_REVIEW',
      resourceId: app.applicationNumber,
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { kycStatus: data.status, summary: data.reviewSummary },
    });

    return updated;
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
    actor: ActorContext
  ) {
    const app = await onboardingRepository.findByIdOrNumber(applicationId);
    if (!app) {
      throw new BankingError('APPLICATION_NOT_FOUND', 'Application not found', 404);
    }

    const updated = await onboardingRepository.updateKybReview(applicationId, data, {
      id: actor.id,
      name: actor.name,
      role: actor.role,
    });

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'UPDATE_KYB_REVIEW',
      resourceType: 'KYB_REVIEW',
      resourceId: app.applicationNumber,
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { kybStatus: data.status },
    });

    return updated;
  },

  async uploadDocument(
    applicationId: number,
    data: {
      documentType: string;
      title: string;
      fileName: string;
      fileSize?: string;
      mimeType?: string;
    },
    actor: ActorContext
  ) {
    const doc = await onboardingRepository.addDocument(applicationId, {
      ...data,
      uploadedById: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
    });

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'UPLOAD_ONBOARDING_DOCUMENT',
      resourceType: 'ONBOARDING_DOCUMENT',
      resourceId: doc.documentCode,
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { applicationId, documentType: data.documentType, title: data.title },
    });

    return doc;
  },

  async reviewDocument(
    documentId: number,
    data: {
      status: 'VERIFIED' | 'REJECTED' | 'REPLACEMENT_REQUIRED';
      rejectionReason?: string;
      replacementReason?: string;
      requestedDocType?: string;
      replacementDueDate?: string;
      createTaskForOfficer?: boolean;
    },
    actor: ActorContext
  ) {
    const doc = await onboardingRepository.reviewDocument(
      documentId,
      data,
      { id: actor.id, name: actor.name, role: actor.role }
    );

    if (data.status === 'REPLACEMENT_REQUIRED' && data.createTaskForOfficer && doc) {
      const app = await onboardingRepository.findByIdOrNumber(doc.applicationId);
      if (app && app.customerId) {
        try {
          await taskService.createTask(
            {
              customerId: app.customerId,
              title: `Obtain Replacement Document: ${data.requestedDocType || doc.title}`,
              description: data.replacementReason || `Document replacement requested for ${app.applicationNumber}.`,
              dueDate: data.replacementDueDate || new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
              priority: 'HIGH',
              assignedToId: app.assignedRmId || actor.id,
              relatedType: 'ONBOARDING_DOCUMENT',
              relatedId: String(documentId),
            },
            { actorId: String(actor.id), actorName: actor.name, requestId: actor.requestId }
          );
        } catch (err) {
          console.warn('[onboardingService] Task auto-creation skipped or failed:', err);
        }
      }
    }

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: `REVIEW_DOCUMENT_${data.status}`,
      resourceType: 'ONBOARDING_DOCUMENT',
      resourceId: doc?.documentCode || String(documentId),
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { status: data.status, reason: data.rejectionReason || data.replacementReason },
    });

    return doc;
  },

  async raiseException(
    data: {
      applicationId: number;
      type: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      title: string;
      description: string;
      ownerId?: number;
      dueDate?: string;
      createTask?: boolean;
    },
    actor: ActorContext
  ) {
    const exc = await onboardingRepository.createException({
      ...data,
      actor: { id: actor.id, name: actor.name, role: actor.role },
    });

    if (data.createTask) {
      const app = await onboardingRepository.findByIdOrNumber(data.applicationId);
      if (app && app.customerId) {
        try {
          await taskService.createTask(
            {
              customerId: app.customerId,
              title: `Review KYC Exception: ${data.title}`,
              description: data.description,
              dueDate: data.dueDate ? data.dueDate.slice(0, 10) : new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
              priority: data.severity === 'CRITICAL' ? 'HIGH' : (data.severity as any),
              assignedToId: data.ownerId || actor.id,
              relatedType: 'ONBOARDING_APPLICATION',
              relatedId: String(app.id),
            },
            { actorId: String(actor.id), actorName: actor.name, requestId: actor.requestId }
          );
        } catch (err) {
          console.warn('[onboardingService] Exception task auto-creation skipped:', err);
        }
      }
    }

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'RAISE_ONBOARDING_EXCEPTION',
      resourceType: 'ONBOARDING_EXCEPTION',
      resourceId: exc.exceptionCode,
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { applicationId: data.applicationId, severity: data.severity, title: data.title },
    });

    return exc;
  },

  async resolveException(
    exceptionId: number,
    resolution: string,
    actor: ActorContext
  ) {
    if (!resolution || !resolution.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Resolution explanation is mandatory', 400);
    }

    const exc = await onboardingRepository.resolveException(
      exceptionId,
      resolution,
      { id: actor.id, name: actor.name, role: actor.role }
    );

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'RESOLVE_ONBOARDING_EXCEPTION',
      resourceType: 'ONBOARDING_EXCEPTION',
      resourceId: exc?.exceptionCode || String(exceptionId),
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { resolution },
    });

    return exc;
  },

  async waiveException(
    exceptionId: number,
    waiveReason: string,
    actor: ActorContext
  ) {
    if (!waiveReason || !waiveReason.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Waive justification reason is mandatory', 400);
    }

    // Role check: Only Branch Manager, Administrator, or Compliance Officer can waive exceptions
    const allowedRoles = ['BRANCH_MANAGER', 'ADMINISTRATOR', 'COMPLIANCE_OFFICER'];
    if (!allowedRoles.includes(actor.role)) {
      throw new BankingError(
        'UNAUTHORIZED',
        'Only Branch Managers, Administrators, or Compliance Officers can waive KYC exceptions.',
        403
      );
    }

    const exc = await onboardingRepository.waiveException(
      exceptionId,
      waiveReason,
      { id: actor.id, name: actor.name, role: actor.role }
    );

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'WAIVE_ONBOARDING_EXCEPTION',
      resourceType: 'ONBOARDING_EXCEPTION',
      resourceId: exc?.exceptionCode || String(exceptionId),
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { waiveReason },
    });

    return exc;
  },

  async reassign(
    applicationId: number,
    data: {
      assignedToId: number;
      roleScope: 'RELATIONSHIP_MANAGER' | 'KYC_OFFICER' | 'OPERATIONS' | 'COMPLIANCE_OFFICER';
      reason?: string;
    },
    actor: ActorContext
  ) {
    const updated = await onboardingRepository.reassign(applicationId, {
      ...data,
      actor: { id: actor.id, name: actor.name, role: actor.role },
    });

    await auditRepository.createLog({
      actorId: String(actor.id),
      actorName: actor.name,
      action: 'REASSIGN_ONBOARDING_APPLICATION',
      resourceType: 'ONBOARDING',
      resourceId: updated?.applicationNumber || String(applicationId),
      requestId: actor.requestId,
      outcome: 'SUCCESS',
      metadata: { assignedToId: data.assignedToId, roleScope: data.roleScope, reason: data.reason },
    });

    return updated;
  },

  async getMetrics(actor: ActorContext) {
    return await onboardingRepository.getMetrics({
      userId: actor.id,
      role: actor.role,
    });
  },
};
