import { CopilotPendingAction } from './types.ts';
import { BankingError } from '../../lib/errors.ts';

// In-memory store for server-validated pending actions (TTL 15 minutes)
const pendingActionsMap = new Map<string, CopilotPendingAction>();
const ACTION_TTL_MS = 15 * 60 * 1000; // 15 minutes

export const pendingActionService = {
  createPendingAction(params: {
    userId: number;
    userName: string;
    actionType: CopilotPendingAction['actionType'];
    title: string;
    summary: string;
    payload: Record<string, any>;
    customerContext?: {
      id: number;
      name: string;
      customerCode: string;
    };
  }): CopilotPendingAction {
    const actionId = `ACT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const now = Date.now();

    const pendingAction: CopilotPendingAction = {
      actionId,
      userId: params.userId,
      userName: params.userName,
      actionType: params.actionType,
      title: params.title,
      summary: params.summary,
      payload: params.payload,
      customerContext: params.customerContext,
      createdAt: now,
      expiresAt: now + ACTION_TTL_MS,
      status: 'PENDING',
    };

    pendingActionsMap.set(actionId, pendingAction);

    // Clean up expired items periodically
    this.cleanupExpired();

    return pendingAction;
  },

  getPendingAction(actionId: string): CopilotPendingAction | null {
    const action = pendingActionsMap.get(actionId);
    if (!action) return null;

    if (Date.now() > action.expiresAt && action.status === 'PENDING') {
      action.status = 'EXPIRED';
    }

    return action;
  },

  validateAndConsume(actionId: string, userId: number): CopilotPendingAction {
    const action = pendingActionsMap.get(actionId);
    if (!action) {
      throw new BankingError('ACTION_NOT_FOUND', `Pending action '${actionId}' was not found.`, 404);
    }

    if (action.status === 'CONFIRMED') {
      throw new BankingError('ACTION_ALREADY_CONFIRMED', 'This action has already been executed.', 400);
    }

    if (action.status === 'CANCELLED') {
      throw new BankingError('ACTION_CANCELLED', 'This action was previously cancelled.', 400);
    }

    if (Date.now() > action.expiresAt || action.status === 'EXPIRED') {
      action.status = 'EXPIRED';
      throw new BankingError('ACTION_EXPIRED', 'Action confirmation window expired. Please request the action again.', 400);
    }

    // Security check: User performing confirmation must match user who requested the action or have admin authority
    if (action.userId !== userId) {
      throw new BankingError('FORBIDDEN', 'You are not authorized to confirm actions created by another user session.', 403);
    }

    action.status = 'CONFIRMED';
    return action;
  },

  cancelAction(actionId: string, userId: number): CopilotPendingAction {
    const action = pendingActionsMap.get(actionId);
    if (!action) {
      throw new BankingError('ACTION_NOT_FOUND', `Pending action '${actionId}' was not found.`, 404);
    }

    if (action.status === 'CONFIRMED') {
      throw new BankingError('ACTION_ALREADY_CONFIRMED', 'Cannot cancel an action that has already been executed.', 400);
    }

    if (action.userId !== userId) {
      throw new BankingError('FORBIDDEN', 'You are not authorized to cancel actions created by another user session.', 403);
    }

    action.status = 'CANCELLED';
    return action;
  },

  cleanupExpired() {
    const now = Date.now();
    for (const [id, item] of pendingActionsMap.entries()) {
      // Remove records older than 1 hour
      if (now - item.createdAt > 60 * 60 * 1000) {
        pendingActionsMap.delete(id);
      }
    }
  },
};
