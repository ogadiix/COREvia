/**
 * COREvia Banking Copilot AI Security & Guardrails Engine
 * Defends against prompt injection, cross-customer context leakage, and unauthorized tool calls
 */

import { SafeUser } from '../auth.service.ts';
import { auditRepository } from '../../repositories/audit.repository.ts';
import { resourceAuth } from '../../lib/resourceAuth.ts';
import { BankingError } from '../../lib/errors.ts';

// Known prompt injection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior)\s+instructions/i,
  /reveal\s+(the\s+)?system\s+prompt/i,
  /output\s+(the\s+)?initial\s+instructions/i,
  /bypass\s+(rbac|security|authorization|rules)/i,
  /act\s+as\s+(an\s+)?administrator/i,
  /you\s+are\s+now\s+in\s+developer\s+mode/i,
  /dump\s+(all\s+)?(customers|passwords|database|tables)/i,
  /drop\s+table\s+/i,
  /select\s+\*\s+from\s+/i,
  /system:\s*role\s*override/i,
];

export interface CopilotSecurityCheckResult {
  isSafe: boolean;
  sanitizedMessage: string;
  threatDetected?: string;
}

export const copilotSecurity = {
  /**
   * Evaluates incoming officer message for prompt injection or jailbreak attempts
   */
  async inspectMessage(
    message: string,
    user: SafeUser,
    requestId: string
  ): Promise<CopilotSecurityCheckResult> {
    const trimmed = String(message || '').trim();

    // Cap message length to prevent denial-of-service or context window stuffing
    const MAX_MESSAGE_LENGTH = 2000;
    const boundedMessage = trimmed.slice(0, MAX_MESSAGE_LENGTH);

    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      if (pattern.test(boundedMessage)) {
        await auditRepository.createLog({
          actorId: user.employeeId,
          actorName: user.name,
          action: 'COPILOT_PROMPT_INJECTION_DETECTED',
          resourceType: 'COPILOT_MESSAGE',
          resourceId: 'MESSAGE_FILTER',
          requestId,
          outcome: 'DENIED',
          metadata: {
            detectedPattern: pattern.source,
            sample: boundedMessage.substring(0, 100),
            userRole: user.role,
          },
        });

        // Neutralize by neutralizing command prefix and annotating
        const neutralized = `[System Notice: Malicious or prompt-override pattern neutralized] ${boundedMessage}`;
        return {
          isSafe: false,
          sanitizedMessage: neutralized,
          threatDetected: pattern.source,
        };
      }
    }

    return {
      isSafe: true,
      sanitizedMessage: boundedMessage,
    };
  },

  /**
   * Wraps CRM text fields (notes, tickets, case remarks) in untrusted data tags
   */
  wrapUntrustedCrmData(data: string): string {
    if (!data) return '';
    return `<untrusted_crm_content>\n${data}\n</untrusted_crm_content>`;
  },

  /**
   * Re-authorizes copilot tool execution based on user's server-side permissions and scope
   */
  async authorizeToolExecution(
    toolName: string,
    args: Record<string, any>,
    user: SafeUser,
    requestId: string
  ): Promise<void> {
    // 1. Permission checks
    const analyticsTools = [
      'getManagementKpiSummary',
      'getExecutivePortfolioHealth',
      'getOfficerPerformanceScorecard',
      'getServiceDeskOperationsAnalytics',
      'getOpportunityPipelineAnalytics',
      'getPredictiveRiskIntelligence',
      'getRelationshipPortfolioDistribution',
    ];

    if (analyticsTools.includes(toolName)) {
      const hasAnalytics =
        user.role === 'ADMINISTRATOR' ||
        user.role === 'BRANCH_MANAGER' ||
        user.role === 'ANALYST' ||
        user.permissions?.includes('analytics:read') ||
        user.permissions?.includes('admin:all');

      if (!hasAnalytics) {
        await auditRepository.createLog({
          actorId: user.employeeId,
          actorName: user.name,
          action: 'COPILOT_TOOL_UNAUTHORIZED',
          resourceType: 'COPILOT_TOOL',
          resourceId: toolName,
          requestId,
          outcome: 'DENIED',
          metadata: { reason: 'MISSING_ANALYTICS_PERMISSION', userRole: user.role },
        });

        throw new BankingError(
          'FORBIDDEN',
          `Officer does not have permission 'analytics:read' to access management intelligence tools.`,
          403
        );
      }
    }

    // 2. Customer Scoping checks
    if (args?.customerId) {
      await resourceAuth.authorizeCustomer(user, args.customerId, 'COPILOT_TOOL', requestId);
    }
  },
};
