import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';

export type CopilotContextType = 'GLOBAL' | 'CUSTOMER' | 'OPPORTUNITY' | 'CASE' | 'TASK';

export interface CopilotContextEntity {
  type: CopilotContextType;
  id?: string | number;
  label?: string;
  code?: string;
  metadata?: Record<string, any>;
}

export interface CopilotSourceItem {
  type: 'CUSTOMER' | 'CORE_SCORE' | 'CASE' | 'OPPORTUNITY' | 'TASK' | 'INTERACTION' | 'NBA' | 'RADAR' | 'INTELLIGENCE' | 'ACCOUNT';
  id: string;
  label: string;
  link?: string;
  preview?: string;
}

export interface PendingActionDetails {
  action_id: string;
  action_type: string;
  title: string;
  summary: string;
  details: Record<string, any>;
  expires_at: string;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: CopilotSourceItem[];
  suggestedActions?: string[];
  pendingConfirmation?: PendingActionDetails | null;
  actionResult?: {
    status: 'CONFIRMED' | 'CANCELLED';
    message: string;
    entityId?: string;
    entityType?: string;
  } | null;
  context?: CopilotContextEntity;
  model?: string;
}

interface CopilotContextValue {
  isDrawerOpen: boolean;
  openDrawer: (context?: CopilotContextEntity, initialQuery?: string) => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  currentContext: CopilotContextEntity;
  setCopilotContext: (ctx: CopilotContextEntity) => void;
  clearCopilotContext: () => void;
  messages: CopilotMessage[];
  sendMessage: (text: string, overrideContext?: CopilotContextEntity) => Promise<void>;
  confirmAction: (actionId: string, messageId: string) => Promise<void>;
  cancelAction: (actionId: string, messageId: string) => Promise<void>;
  resetConversation: () => void;
  isLoading: boolean;
  loadingStep: string;
}

const CopilotContext = createContext<CopilotContextValue | undefined>(undefined);

const DEFAULT_CONTEXT: CopilotContextEntity = {
  type: 'GLOBAL',
  label: 'Global Portfolio',
};

const INITIAL_WELCOME_MESSAGE: CopilotMessage = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `### Welcome to COREvia Banking CRM Copilot

I am your context-aware banking assistant, grounded in real-time Core Banking records, relationship intelligence, and risk calculations.

**Ask me anything:**
• **Customer 360:** "Summarize this customer", "Show deposit and loan portfolio"
• **CORE Score:** "Why is the score 84?", "Explain recent score drivers"
• **Relationship Intelligence:** "What changed recently?", "What signals should I watch?"
• **Next Best Actions:** "What should I do next?", "Recommend priority action"
• **Officer Actions:** "Create a follow-up for tomorrow at 11 AM" *(requires your confirmation)*`,
  timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  sources: [
    {
      type: 'CUSTOMER',
      id: 'GLOBAL',
      label: 'Core Banking Customer 360',
      link: '/customers',
    },
  ],
  suggestedActions: [
    'Give me a quick overview of Rahul Sharma',
    'Why is the CORE Score 84?',
    'What changed recently?',
    'What should I do next?',
  ],
};

export const CopilotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentContext, setCurrentContext] = useState<CopilotContextEntity>(DEFAULT_CONTEXT);
  const [conversationId, setConversationId] = useState<string>(() => `conv-${Date.now()}`);
  const [messages, setMessages] = useState<CopilotMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');

  const openDrawer = useCallback((ctx?: CopilotContextEntity, initialQuery?: string) => {
    if (ctx) {
      setCurrentContext(ctx);
    }
    setIsDrawerOpen(true);
    if (initialQuery) {
      setTimeout(() => {
        sendMessage(initialQuery, ctx || currentContext);
      }, 50);
    }
  }, [currentContext]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => !prev);
  }, []);

  const setCopilotContext = useCallback((ctx: CopilotContextEntity) => {
    setCurrentContext(ctx);
  }, []);

  const clearCopilotContext = useCallback(() => {
    setCurrentContext(DEFAULT_CONTEXT);
  }, []);

  const resetConversation = useCallback(() => {
    setConversationId(`conv-${Date.now()}`);
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setCurrentContext(DEFAULT_CONTEXT);
  }, []);

  const sendMessage = async (text: string, overrideContext?: CopilotContextEntity) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const activeCtx = overrideContext || currentContext;
    const userMsgId = `user-${Date.now()}`;
    const userMsg: CopilotMessage = {
      id: userMsgId,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      context: activeCtx,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingStep('Consulting Core Banking tools...');

    try {
      // Build conversation history for context preservation
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: conversationId,
          message: trimmed,
          context_type: activeCtx.type,
          context_id: activeCtx.code || activeCtx.id,
          history,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `Server responded with status ${res.status}`);
      }

      const data = await res.json();

      const assistantMsg: CopilotMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        sources: data.sources || [],
        suggestedActions: data.suggested_actions || [],
        pendingConfirmation: data.pending_confirmation || null,
        context: data.context || activeCtx,
        model: data.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Copilot request failed:', err);
      const errorMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        role: 'system',
        content: `**Copilot Notice**: Request could not be completed (${err.message || 'Unknown network error'}). All underlying Core Banking CRM modules remain active.`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const confirmAction = async (actionId: string, messageId: string) => {
    setIsLoading(true);
    setLoadingStep('Executing authorized transaction in PostgreSQL...');
    try {
      const res = await fetch(`/api/copilot/actions/${actionId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Confirmation failed');
      }

      // Update message state
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              pendingConfirmation: null,
              actionResult: {
                status: 'CONFIRMED',
                message: data.message || 'Action executed successfully.',
                entityId: data.entityId,
                entityType: data.entityType,
              },
            };
          }
          return m;
        })
      );

      // Append confirmation acknowledgement in chat
      const ackMsg: CopilotMessage = {
        id: `ack-${Date.now()}`,
        role: 'assistant',
        content: `**Action Confirmed & Executed**
${data.message || 'Transaction committed to Core Banking database.'}
• **Entity Reference:** \`${data.entityId || actionId}\`
• **Audit Log:** Logged with actor ${user?.name} (${user?.employeeId})`,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        sources: [
          {
            type: data.entityType === 'TASK' ? 'TASK' : 'CUSTOMER',
            id: String(data.entityId),
            label: `Open ${data.entityType || 'Record'} (${data.entityId})`,
            link: data.entityType === 'TASK' ? '/tasks' : '/customers',
          },
        ],
        suggestedActions: [
          'Summarize this customer',
          'What should I do next?',
        ],
      };

      setMessages((prev) => [...prev, ackMsg]);
    } catch (err: any) {
      alert(`Action confirmation error: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const cancelAction = async (actionId: string, messageId: string) => {
    try {
      const res = await fetch(`/api/copilot/actions/${actionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === messageId) {
            return {
              ...m,
              pendingConfirmation: null,
              actionResult: {
                status: 'CANCELLED',
                message: data.message || 'Proposal cancelled. No database changes were made.',
              },
            };
          }
          return m;
        })
      );
    } catch (err: any) {
      console.error('Action cancel failed:', err);
    }
  };

  return (
    <CopilotContext.Provider
      value={{
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        currentContext,
        setCopilotContext,
        clearCopilotContext,
        messages,
        sendMessage,
        confirmAction,
        cancelAction,
        resetConversation,
        isLoading,
        loadingStep,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = () => {
  const context = useContext(CopilotContext);
  if (!context) {
    throw new Error('useCopilot must be used within a CopilotProvider');
  }
  return context;
};
