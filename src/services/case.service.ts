import { caseRepository } from '../repositories/case.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { notificationRuleService } from './notificationRule.service.ts';
import { BankingError } from '../lib/errors.ts';

export const caseService = {
  async listCases(params: { customerId?: number; status?: string; priority?: string; page?: number; limit?: number }) {
    return await caseRepository.findMany(params);
  },

  async getCaseById(id: number) {
    const caseItem = await caseRepository.findById(id);
    if (!caseItem) {
      throw new BankingError('CASE_NOT_FOUND', `Service case #${id} could not be found.`, 404);
    }
    return caseItem;
  },

  async updateCase(
    id: number,
    data: { status?: string; priority?: string; resolutionSummary?: string; assignedToId?: number },
    actorContext: { actorId: string; actorName: string; requestId: string }
  ) {
    const existing = await caseRepository.findById(id);
    if (!existing) {
      throw new BankingError('CASE_NOT_FOUND', `Service case #${id} could not be found.`, 404);
    }

    const validStatuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'];
    if (data.status && !validStatuses.includes(data.status.toUpperCase())) {
      throw new BankingError('INVALID_STATUS', `Status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const updated = await caseRepository.updateCase(id, data);

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'UPDATE_SERVICE_CASE',
      resourceType: 'SERVICE_CASE',
      resourceId: String(id),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: {
        changes: data,
        previousStatus: existing.status,
      },
    });

    // Phase 15: Event-driven Notification Triggering
    try {
      if (data.status === 'ESCALATED') {
        await notificationRuleService.evaluateCaseEvent(
          updated,
          'ESCALATED',
          existing.customerName || undefined,
          { userId: actorContext.actorId, name: actorContext.actorName, requestId: actorContext.requestId }
        );
      } else if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
        await notificationRuleService.evaluateCaseEvent(
          updated,
          'RESOLVED',
          existing.customerName || undefined,
          { userId: actorContext.actorId, name: actorContext.actorName, requestId: actorContext.requestId }
        );
      } else if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
        await notificationRuleService.evaluateCaseEvent(
          updated,
          'ASSIGNED',
          existing.customerName || undefined,
          { userId: actorContext.actorId, name: actorContext.actorName, requestId: actorContext.requestId }
        );
      }
    } catch (notifErr) {
      console.warn('[caseService] Non-blocking notification evaluation error:', notifErr);
    }

    return updated;
  },

  async addComment(
    caseId: number,
    commentText: string,
    actorContext: { actorId: string; actorName: string; requestId: string }
  ) {
    if (!commentText || !commentText.trim()) {
      throw new BankingError('EMPTY_COMMENT', 'Case comment text cannot be empty.', 400);
    }

    const existing = await caseRepository.findById(caseId);
    if (!existing) {
      throw new BankingError('CASE_NOT_FOUND', `Service case #${caseId} could not be found.`, 404);
    }

    const comment = await caseRepository.addComment(caseId, actorContext.actorName, commentText.trim());

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'ADD_CASE_COMMENT',
      resourceType: 'SERVICE_CASE',
      resourceId: String(caseId),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
    });

    return comment;
  },
};

