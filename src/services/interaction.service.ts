import {
  interactionRepository,
  CreateInteractionInput,
  UpdateInteractionInput,
  ListInteractionsParams,
} from '../repositories/interaction.repository.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { taskRepository } from '../repositories/task.repository.ts';
import { notificationRepository } from '../repositories/notification.repository.ts';
import { BankingError } from '../lib/errors.ts';
import { InteractionItem } from '../types/index.ts';

export interface ActorContext {
  actorId: string;
  actorName: string;
  userId?: number;
  requestId: string;
  role?: string;
}

export const interactionService = {
  async recordInteraction(
    input: CreateInteractionInput,
    actorContext: ActorContext
  ): Promise<InteractionItem> {
    if (!input.customerId || !input.subject || !input.summary) {
      throw new BankingError('VALIDATION_ERROR', 'Customer ID, subject, and summary are required.', 400);
    }

    const customer = await customerRepository.findByIdOrCode(input.customerId);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer #${input.customerId} not found.`, 404);
    }

    const currentUserId = actorContext.userId ? Number(actorContext.userId) : 3;

    // 1. If follow-up is required, create the corresponding Task in COREvia
    let createdFollowupTaskId: number | undefined = input.followupTaskId || undefined;
    if (input.followupRequired && !createdFollowupTaskId) {
      const dueDate = input.followupDate
        ? new Date(input.followupDate).toISOString().slice(0, 10)
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const task = await taskRepository.create({
        customerId: customer.id,
        title: input.followupAction ? `Follow-up: ${input.followupAction}` : `Follow-up: ${input.subject}`,
        description: `Generated from interaction record: "${input.subject}". Summary: ${input.summary}`,
        dueDate,
        priority: (input.followupPriority || 'MEDIUM').toUpperCase(),
        status: 'PENDING',
        assignedToId: input.followupOwnerId || currentUserId,
        relatedType: 'INTERACTION',
        relatedId: 'PENDING',
      });
      if (task) {
        createdFollowupTaskId = task.id;
      }
    }

    // 2. Prepare commitment tasks if any commitment requests task creation
    const processedCommitments = (input.commitments || []).map((c) => ({
      ...c,
      createdTaskId: c.createdTaskId || null,
    }));

    for (const c of processedCommitments) {
      if (!c.createdTaskId && c.dueDate) {
        try {
          const cTask = await taskRepository.create({
            customerId: customer.id,
            title: `Commitment (${c.commitmentType === 'CUSTOMER_COMMITMENT' ? 'Customer' : 'RM'}): ${c.description}`,
            description: `Interaction commitment. Owner: ${c.ownerName || 'RM'}`,
            dueDate: new Date(c.dueDate).toISOString().slice(0, 10),
            priority: 'MEDIUM',
            status: 'PENDING',
            assignedToId: currentUserId,
            relatedType: 'INTERACTION',
            relatedId: 'PENDING',
          });
          if (cTask) {
            c.createdTaskId = cTask.id;
          }
        } catch {
          // Continue if task creation was optional
        }
      }
    }

    // 3. Create the interaction record
    const record = await interactionRepository.create({
      ...input,
      customerId: customer.id,
      ownerId: input.ownerId || currentUserId,
      agentId: input.agentId || currentUserId,
      createdBy: currentUserId,
      followupTaskId: createdFollowupTaskId || null,
      commitments: processedCommitments,
    });

    // 4. Update the created task with the real interaction ID
    if (createdFollowupTaskId) {
      await taskRepository.update(createdFollowupTaskId, {
        description: `Generated from interaction [${record.interactionReference}]: "${record.subject}".\nSummary: ${record.summary}`,
      });
    }

    // 5. Send notification to follow-up owner if different from current user
    if (input.followupRequired && input.followupOwnerId && input.followupOwnerId !== currentUserId) {
      try {
        await notificationRepository.create({
          userId: input.followupOwnerId,
          customerId: customer.id,
          notificationType: 'TASK_ASSIGNED' as any,
          category: 'TASK' as any,
          severity: (input.followupPriority === 'HIGH' || input.followupPriority === 'URGENT') ? 'WARNING' as any : 'INFO' as any,
          title: `Interaction Follow-up Assigned: ${customer.name}`,
          message: `${actorContext.actorName} assigned a follow-up task from interaction ${record.interactionReference}: "${input.followupAction || input.subject}"`,
          actionLabel: 'View Interaction',
          actionUrl: `/interactions?ref=${record.interactionReference}`,
          sourceEntityType: 'INTERACTION',
          sourceEntityId: String(record.id),
        });
      } catch {
        // Notification failure should not block interaction logging
      }
    }

    // 6. Audit logging
    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'RECORD_CUSTOMER_INTERACTION',
      resourceType: 'INTERACTION',
      resourceId: String(record.id),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: {
        interactionReference: record.interactionReference,
        customerId: customer.id,
        customerName: customer.name,
        channel: input.channel,
        interactionType: input.interactionType,
        outcome: input.outcome,
        subject: input.subject,
        followupRequired: !!input.followupRequired,
        followupTaskId: createdFollowupTaskId,
      },
    });

    return record;
  },

  async updateInteraction(
    id: number,
    input: UpdateInteractionInput,
    actorContext: ActorContext
  ): Promise<InteractionItem> {
    const existing = await interactionRepository.findById(id);
    if (!existing) {
      throw new BankingError('INTERACTION_NOT_FOUND', `Interaction #${id} not found.`, 404);
    }

    const currentUserId = actorContext.userId ? Number(actorContext.userId) : 3;

    // Check if followupRequired changed to true and no task exists yet
    let createdFollowupTaskId = existing.followupTaskId;
    if (input.followupRequired && !createdFollowupTaskId) {
      const dueDate = input.followupDate
        ? new Date(input.followupDate).toISOString().slice(0, 10)
        : new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const task = await taskRepository.create({
        customerId: existing.customerId,
        title: input.followupAction ? `Follow-up: ${input.followupAction}` : `Follow-up: ${existing.subject}`,
        description: `Follow-up from interaction ${existing.interactionReference}. Action: ${input.followupAction || existing.summary}`,
        dueDate,
        priority: (input.followupPriority || existing.followupPriority || 'MEDIUM').toUpperCase(),
        status: 'PENDING',
        assignedToId: input.followupOwnerId || existing.followupOwnerId || currentUserId,
        relatedType: 'INTERACTION',
        relatedId: String(existing.id),
      });
      if (task) {
        createdFollowupTaskId = task.id;
      }
    }

    const updated = await interactionRepository.update(id, {
      ...input,
      followupTaskId: createdFollowupTaskId || undefined,
      updatedBy: currentUserId,
    });

    if (!updated) {
      throw new BankingError('INTERACTION_NOT_FOUND', `Failed to update interaction #${id}.`, 404);
    }

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'UPDATE_CUSTOMER_INTERACTION',
      resourceType: 'INTERACTION',
      resourceId: String(id),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: {
        interactionReference: existing.interactionReference,
        changedFields: Object.keys(input),
      },
    });

    return updated;
  },

  async deleteInteraction(id: number, actorContext: ActorContext): Promise<boolean> {
    const existing = await interactionRepository.findById(id);
    if (!existing) {
      throw new BankingError('INTERACTION_NOT_FOUND', `Interaction #${id} not found.`, 404);
    }

    const currentUserId = actorContext.userId ? Number(actorContext.userId) : 3;
    const deleted = await interactionRepository.softDelete(id, currentUserId);

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'DELETE_CUSTOMER_INTERACTION',
      resourceType: 'INTERACTION',
      resourceId: String(id),
      requestId: actorContext.requestId,
      outcome: deleted ? 'SUCCESS' : 'FAILURE',
      metadata: {
        interactionReference: existing.interactionReference,
        customerId: existing.customerId,
      },
    });

    return deleted;
  },

  async getInteraction(id: number): Promise<InteractionItem> {
    const item = await interactionRepository.findById(id);
    if (!item) {
      throw new BankingError('INTERACTION_NOT_FOUND', `Interaction #${id} not found.`, 404);
    }
    return item;
  },

  async getInteractionByReference(ref: string): Promise<InteractionItem> {
    const item = await interactionRepository.findByReference(ref);
    if (!item) {
      throw new BankingError('INTERACTION_NOT_FOUND', `Interaction with reference "${ref}" not found.`, 404);
    }
    return item;
  },

  async listInteractions(params: ListInteractionsParams) {
    return interactionRepository.list(params);
  },

  async getMetrics(params: { customerId?: number; ownerId?: number } = {}) {
    return interactionRepository.getMetrics(params);
  },

  async getCustomerCommunicationProfile(customerId: number) {
    const customer = await customerRepository.findByIdOrCode(customerId);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer #${customerId} not found.`, 404);
    }
    return interactionRepository.getCommunicationProfile(customer.id);
  },

  async getCustomerEngagementTrend(customerId: number, timeframe: '7d' | '30d' | '90d' | '12m' = '30d') {
    const customer = await customerRepository.findByIdOrCode(customerId);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer #${customerId} not found.`, 404);
    }
    return interactionRepository.getEngagementTrend(customer.id, timeframe);
  },

  async addCommitment(
    interactionId: number,
    data: {
      commitmentType: 'CUSTOMER_COMMITMENT' | 'RM_COMMITMENT';
      description: string;
      ownerName?: string | null;
      dueDate?: string | null;
      createTask?: boolean;
    },
    actorContext: ActorContext
  ) {
    const interaction = await interactionRepository.findById(interactionId);
    if (!interaction) {
      throw new BankingError('INTERACTION_NOT_FOUND', `Interaction #${interactionId} not found.`, 404);
    }

    let createdTaskId: number | null = null;
    const currentUserId = actorContext.userId ? Number(actorContext.userId) : 3;

    if (data.createTask && data.dueDate) {
      const task = await taskRepository.create({
        customerId: interaction.customerId,
        title: `Commitment: ${data.description}`,
        description: `Created from interaction ${interaction.interactionReference}. Owner: ${data.ownerName || 'RM'}`,
        dueDate: new Date(data.dueDate).toISOString().slice(0, 10),
        priority: 'MEDIUM',
        status: 'PENDING',
        assignedToId: currentUserId,
        relatedType: 'INTERACTION',
        relatedId: String(interactionId),
      });
      if (task) {
        createdTaskId = task.id;
      }
    }

    const commitment = await interactionRepository.addCommitment(interactionId, {
      commitmentType: data.commitmentType,
      description: data.description,
      ownerName: data.ownerName,
      dueDate: data.dueDate,
      createdTaskId,
    });

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'ADD_INTERACTION_COMMITMENT',
      resourceType: 'INTERACTION',
      resourceId: String(interactionId),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: {
        commitmentId: commitment.id,
        commitmentType: data.commitmentType,
        createdTaskId,
      },
    });

    return commitment;
  },

  async updateCommitment(
    commitmentId: number,
    data: { status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'; createdTaskId?: number | null },
    actorContext: ActorContext
  ) {
    const success = await interactionRepository.updateCommitment(commitmentId, data);
    if (!success) {
      throw new BankingError('NOT_FOUND', `Commitment #${commitmentId} not found.`, 404);
    }

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'UPDATE_INTERACTION_COMMITMENT',
      resourceType: 'INTERACTION_COMMITMENT',
      resourceId: String(commitmentId),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: data,
    });

    return { success: true };
  },
};
