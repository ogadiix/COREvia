export type CopilotContextType = 'GLOBAL' | 'CUSTOMER' | 'OPPORTUNITY' | 'CASE' | 'TASK' | 'DOCUMENT';

export interface CopilotContext {
  type: CopilotContextType;
  id?: string | number;
  label?: string;
  code?: string;
  metadata?: Record<string, any>;
}

export interface CopilotChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CopilotSource {
  type: 'CUSTOMER' | 'CORE_SCORE' | 'CASE' | 'OPPORTUNITY' | 'TASK' | 'INTERACTION' | 'NBA' | 'RADAR' | 'INTELLIGENCE' | 'ACCOUNT' | 'NOTIFICATION' | 'ANALYTICS' | 'DOCUMENT';
  id: string;
  label: string;
  link?: string;
  preview?: string;
}

export interface CopilotPendingAction {
  actionId: string;
  userId: number;
  userName: string;
  actionType:
    | 'CREATE_TASK'
    | 'CREATE_FOLLOWUP'
    | 'CREATE_OPPORTUNITY'
    | 'UPDATE_CASE'
    | 'RECORD_INTERACTION'
    | 'ACKNOWLEDGE_NOTIFICATION'
    | 'DISMISS_NOTIFICATION'
    | 'VERIFY_DOCUMENT'
    | 'REJECT_DOCUMENT'
    | 'REQUEST_DOCUMENT_REPLACEMENT';
  title: string;
  summary: string;
  payload: Record<string, any>;
  customerContext?: {
    id: number;
    name: string;
    customerCode: string;
  };
  createdAt: number;
  expiresAt: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
}

export interface CopilotChatRequest {
  conversation_id?: string;
  message: string;
  context_type?: CopilotContextType;
  context_id?: string | number;
  history?: CopilotChatMessage[];
}

export interface CopilotChatResponse {
  conversation_id: string;
  answer: string;
  sources: CopilotSource[];
  suggested_actions: string[];
  pending_confirmation?: {
    action_id: string;
    action_type: string;
    title: string;
    summary: string;
    details: Record<string, any>;
    expires_at: string;
  } | null;
  context?: CopilotContext;
  model: string;
  timestamp: string;
  tool_calls_executed?: string[];
}
