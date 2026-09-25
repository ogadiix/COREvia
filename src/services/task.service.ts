import { taskRepository, CreateTaskInput } from '../repositories/task.repository.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { notificationRuleService } from './notificationRule.service.ts';
import { BankingError } from '../lib/errors.ts';

export const taskService = {
  async listTasks(params: { customerId?: number; status?: string; limit?: number; assignedToId?: number }) {
    return await taskRepository.findMany(params);
  },

  async createTask(
    input: CreateTaskInput,
    actorContext: { actorId: string; actorName: string; requestId: string }
  ) {
    if (!input.title || !input.title.trim()) {
      throw new BankingError('VALIDATION_ERROR', 'Task title is required.', 400);
    }
    if (!input.customerId) {
      throw new BankingError('VALIDATION_ERROR', 'Customer ID is required.', 400);
    }
    if (!input.dueDate) {
      throw new BankingError('VALIDATION_ERROR', 'Due date is required (YYYY-MM-DD).', 400);
    }

    const customer = await customerRepository.findByIdOrCode(input.customerId);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer #${input.customerId} not found.`, 404);
    }

    const task = await taskRepository.create({
      ...input,
      customerId: customer.id,
    });

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'CREATE_TASK',
      resourceType: 'TASK',
      resourceId: String(task.id),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: {
        customerCode: customer.customerCode,
        title: input.title,
        dueDate: input.dueDate,
      },
    });

    // Phase 15: Event-driven Notification Generation
    try {
      if (task.assignedToId) {
        await notificationRuleService.evaluateTaskEvent(
          task,
          'ASSIGNED',
          customer.name,
          { userId: actorContext.actorId, name: actorContext.actorName, requestId: actorContext.requestId }
        );
      }
    } catch (notifErr) {
      console.warn('[taskService] Non-blocking notification evaluation error:', notifErr);
    }

    return task;
  },

  async createFollowup(
    input: { customerId: number; title: string; dueDate: string; notes?: string; channel?: string },
    actorContext: { actorId: string; actorName: string; requestId: string }
  ) {
    if (!input.title || !input.dueDate) {
      throw new BankingError('VALIDATION_ERROR', 'Title and due date are required for follow-up.', 400);
    }

    const task = await this.createTask(
      {
        customerId: input.customerId,
        title: `[Follow-up] ${input.title}`,
        description: input.notes,
        dueDate: input.dueDate,
        priority: 'HIGH',
        relatedType: 'FOLLOWUP',
      },
      actorContext
    );

    return task;
  },

  async updateTask(
    id: number,
    data: { status?: string; priority?: string; dueDate?: string; description?: string },
    actorContext: { actorId: string; actorName: string; requestId: string }
  ) {
    const updated = await taskRepository.update(id, data);
    if (!updated) {
      throw new BankingError('TASK_NOT_FOUND', `Task #${id} not found.`, 404);
    }

    await auditRepository.createLog({
      actorId: actorContext.actorId,
      actorName: actorContext.actorName,
      action: 'UPDATE_TASK',
      resourceType: 'TASK',
      resourceId: String(id),
      requestId: actorContext.requestId,
      outcome: 'SUCCESS',
      metadata: data,
    });

    // Phase 15: Event-driven Notification Expiry or Status Update
    try {
      if (data.status === 'COMPLETED' || data.status === 'CANCELLED') {
        await notificationRuleService.evaluateTaskEvent(
          updated,
          'COMPLETED',
          undefined,
          { userId: actorContext.actorId, name: actorContext.actorName, requestId: actorContext.requestId }
        );
      }
    } catch (notifErr) {
      console.warn('[taskService] Non-blocking notification update error:', notifErr);
    }

    return updated;
  },
};

