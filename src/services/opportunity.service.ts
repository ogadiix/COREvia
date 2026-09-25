import { opportunityRepository, CreateOpportunityInput } from '../repositories/opportunity.repository.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { notificationRuleService } from './notificationRule.service.ts';
import { BankingError } from '../lib/errors.ts';

export const opportunityService = {
  async listOpportunities(params: { customerId?: number; stage?: string; limit?: number; assignedToId?: number }) {
    return await opportunityRepository.findMany(params);
  },

  async getOpportunityById(id: number) {
    const opp = await opportunityRepository.findById(id);
    if (!opp) {
      throw new BankingError('OPPORTUNITY_NOT_FOUND', `Opportunity #${id} not found.`, 404);
    }
    return opp;
  },

  async createOpportunity(
    input: CreateOpportunityInput,
    actorContext: { actorId: string; actorName: string; requestId: string }
  ) {
    if (!input.title || !input.title.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Opportunity title is required.', 400);
    }
    if (!input.customerId) {
      throw new BankingError('VALIDATION_ERROR', 'Customer ID is required.', 400);
    }

    const customer = await customerRepository.findByIdOrCode(input.customerId);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer #${input.customerId} not found.`, 404);
    }

    const opp = await opportunityRepository.create({
      ...input,
      customerId: customer.id,
    });

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'CREATE_OPPORTUNITY',
      resourceType: 'OPPORTUNITY',
      resourceId: String(opp.id),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: {
        opportunityCode: opp.opportunityCode,
        stage: opp.stage,
        expectedValue: opp.expectedValue,
      },
    });

    // Phase 15: Event-driven Notification
    try {
      if (opp.assignedToId) {
        await notificationRuleService.evaluateOpportunityEvent(
          opp,
          'ASSIGNED',
          customer.name,
          { userId: actorContext.actorId, name: actorContext.actorName, requestId: actorContext.requestId }
        );
      }
    } catch (notifErr) {
      console.warn('[opportunityService] Non-blocking notification error:', notifErr);
    }

    return opp;
  },

  async updateOpportunity(
    id: number,
    data: { stage?: string; probability?: number; notes?: string; expectedValue?: string },
    actorContext: { actorId: string; actorName: string; requestId: string }
  ) {
    const existing = await opportunityRepository.findById(id);
    if (!existing) {
      throw new BankingError('OPPORTUNITY_NOT_FOUND', `Opportunity #${id} not found.`, 404);
    }

    const validStages = ['PROSPECT', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    if (data.stage && !validStages.includes(data.stage.toUpperCase())) {
      throw new BankingError('INVALID_STAGE', `Stage must be one of: ${validStages.join(', ')}`, 400);
    }

    const updated = await opportunityRepository.update(id, data);

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'UPDATE_OPPORTUNITY',
      resourceType: 'OPPORTUNITY',
      resourceId: String(id),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: {
        previousStage: existing.stage,
        newStage: data.stage || existing.stage,
      },
    });

    // Phase 15: Event-driven Notification on Stage change
    try {
      if (data.stage && data.stage !== existing.stage) {
        await notificationRuleService.evaluateOpportunityEvent(
          updated,
          'STAGE_CHANGED',
          existing.customerName || undefined,
          { userId: actorContext.actorId, name: actorContext.actorName, requestId: actorContext.requestId }
        );
      }
    } catch (notifErr) {
      console.warn('[opportunityService] Non-blocking notification update error:', notifErr);
    }

    return updated;
  },
};

