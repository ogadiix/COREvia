/**
 * COREvia Phase 33: Customer Journey Orchestrator & Lifecycle Management Service
 * Manages journey templates, state machine validation, dependency resolution, SLA calculation,
 * evidence verification against existing domain entities, ownership handoff, and Decision Trace integration.
 */

import { journeyRepository } from '../repositories/journey.repository.ts';
import { resourceAuth } from '../lib/resourceAuth.ts';
import { auditRepository } from '../repositories/audit.repository.ts';
import { notificationService } from './notification.service.ts';
import { decisionTraceService } from './decisionTrace.service.ts';
import { SafeUser } from './auth.service.ts';
import { BankingError } from '../lib/errors.ts';
import { db } from '../db/index.ts';
import {
  customers,
  users,
  documents,
  tasks,
  serviceCases,
  opportunities,
  interactions,
  customerOpportunityRadar,
} from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import {
  JourneyStatus,
  JourneyStepStatus,
  JourneyStepType,
  JourneySLAStatus,
  JourneyOutcomeType,
  CustomerJourneyDTO,
  CustomerJourneyStepDTO,
  JourneyProgressDTO,
  JourneyTimelineEventDTO,
  JourneyTemplateDTO,
  CreateJourneyPayload,
  UpdateJourneyStepPayload,
  HandoffJourneyPayload,
  EscalateJourneyPayload,
  RecordJourneyOutcomePayload,
  PortfolioJourneyAnalyticsDTO,
  JourneyFilterParams,
  CompletionEvidence,
} from '../types/journey.types.ts';

// Standard 10 Lifecycle Templates
export const DEFAULT_JOURNEY_TEMPLATES = [
  {
    templateCode: 'NEW_CUSTOMER_ONBOARDING',
    name: 'New Customer Corporate Onboarding',
    description: 'End-to-end institutional client onboarding journey covering KYC, documentation, account opening, and welcome review.',
    category: 'ONBOARDING',
    defaultPriority: 'HIGH' as const,
    targetDurationDays: 14,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'kyc_verification', name: 'Identity & cKYC Verification', description: 'Validate PAN, Aadhaar status, and cKYC registry clearance.', stepType: 'KYC' as JourneyStepType, required: true, slaDays: 2, defaultOwnerRole: 'KYC_OPERATIONS', evidenceType: 'KYC_RECORD' },
      { stepOrder: 2, stepKey: 'document_collection', name: 'Constitutional Documents Collection', description: 'Collect Certificate of Incorporation, Memorandum, and Board Resolution.', stepType: 'DOCUMENT' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['kyc_verification'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'DOCUMENT' },
      { stepOrder: 3, stepKey: 'credit_operations_check', name: 'Maker-Checker Compliance Approval', description: 'Dual-control checker review of applicant profile against FIU-IND and sanctions lists.', stepType: 'APPROVAL' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['document_collection'], defaultOwnerRole: 'COMPLIANCE_OFFICER', evidenceType: 'APPROVAL' },
      { stepOrder: 4, stepKey: 'account_provisioning', name: 'Core Account & Limits Provisioning', description: 'Generate active CASA accounts and setup debit limits.', stepType: 'ONBOARDING' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['credit_operations_check'], defaultOwnerRole: 'BRANCH_OPS_HEAD', evidenceType: 'TASK' },
      { stepOrder: 5, stepKey: 'welcome_interaction', name: 'Executive Welcome & Digital Activation', description: 'Hold inaugural advisory briefing with corporate treasurers and activate portal.', stepType: 'INTERACTION' as JourneyStepType, required: false, slaDays: 3, dependencyStepKeys: ['account_provisioning'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'INTERACTION' },
    ],
  },
  {
    templateCode: 'KYC_COMPLETION',
    name: 'Periodic KYC Refresh & Due Diligence',
    description: 'Statutory periodic KYC re-verification under RBI PMLA guidelines.',
    category: 'ONBOARDING',
    defaultPriority: 'NORMAL' as const,
    targetDurationDays: 7,
    defaultOwnerRole: 'KYC_OPERATIONS',
    steps: [
      { stepOrder: 1, stepKey: 'kyc_data_audit', name: 'Review Current Identity & CIBIL Data', description: 'Audit existing identity records and trigger fresh bureau pulls.', stepType: 'KYC' as JourneyStepType, required: true, slaDays: 2, defaultOwnerRole: 'KYC_OPERATIONS', evidenceType: 'KYC_RECORD' },
      { stepOrder: 2, stepKey: 'kyc_doc_update', name: 'Updated Financials & Proof of Address', description: 'Procure latest GST returns and audited balance sheet.', stepType: 'DOCUMENT' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['kyc_data_audit'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'DOCUMENT' },
      { stepOrder: 3, stepKey: 'compliance_signoff', name: 'Compliance Sign-off', description: 'Officer confirmation of updated risk category and PEP status.', stepType: 'APPROVAL' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['kyc_doc_update'], defaultOwnerRole: 'COMPLIANCE_OFFICER', evidenceType: 'APPROVAL' },
    ],
  },
  {
    templateCode: 'LOAN_APPLICATION',
    name: 'Working Capital & Term Credit Underwriting',
    description: 'Comprehensive commercial credit facility lifecycle from initial appraisal to disbursement.',
    category: 'CREDIT',
    defaultPriority: 'HIGH' as const,
    targetDurationDays: 21,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'credit_appraisal', name: 'Financial Model & Opportunity Creation', description: 'Evaluate balance sheets, DSCR, and credit appraisal memorandum.', stepType: 'OPPORTUNITY' as JourneyStepType, required: true, slaDays: 4, defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'OPPORTUNITY' },
      { stepOrder: 2, stepKey: 'collateral_valuation', name: 'Collateral & Title Search Audit', description: 'Verify immovable property and lien registration with CERSAI.', stepType: 'DOCUMENT' as JourneyStepType, required: true, slaDays: 5, dependencyStepKeys: ['credit_appraisal'], defaultOwnerRole: 'CREDIT_OPS', evidenceType: 'DOCUMENT' },
      { stepOrder: 3, stepKey: 'credit_sanction', name: 'Sanction Committee Approval', description: 'Present facility memo to Credit Sanction Committee for terms sign-off.', stepType: 'APPROVAL' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['collateral_valuation'], defaultOwnerRole: 'BRANCH_OPS_HEAD', evidenceType: 'APPROVAL' },
      { stepOrder: 4, stepKey: 'documentation_execution', name: 'Loan Agreement & Security Execution', description: 'Sign stamped loan agreement, hypothecation deed, and personal guarantees.', stepType: 'COMMITMENT' as JourneyStepType, required: true, slaDays: 4, dependencyStepKeys: ['credit_sanction'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'TASK' },
      { stepOrder: 5, stepKey: 'disbursement_verification', name: 'Pre-Disbursement Audit & Fund Release', description: 'Final limit draw and core banking loan account activation.', stepType: 'ONBOARDING' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['documentation_execution'], defaultOwnerRole: 'BRANCH_OPS_HEAD', evidenceType: 'TASK' },
    ],
  },
  {
    templateCode: 'SERVICE_RECOVERY',
    name: 'High-Value Service Recovery & Friction Resolution',
    description: 'Systematic resolution of executive grievances, wire failures, or critical service SLA breaches.',
    category: 'SERVICE',
    defaultPriority: 'CRITICAL' as const,
    targetDurationDays: 5,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'service_case_triage', name: 'Incident Triage & Root Cause Diagnosis', description: 'Acknowledge grievance and link affected transactions or charges.', stepType: 'SERVICE_CASE' as JourneyStepType, required: true, slaDays: 1, defaultOwnerRole: 'SERVICE_DESK', evidenceType: 'SERVICE_CASE' },
      { stepOrder: 2, stepKey: 'operational_remediation', name: 'Operational Fix & Fee Adjustment', description: 'Execute corrective adjustment or technical repair with operational clearance.', stepType: 'TASK' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['service_case_triage'], defaultOwnerRole: 'BRANCH_OPS_HEAD', evidenceType: 'TASK' },
      { stepOrder: 3, stepKey: 'client_outreach', name: 'Executive Client Outreach Meeting', description: 'Conduct direct phone or video briefing explaining fix and apologizing.', stepType: 'INTERACTION' as JourneyStepType, required: true, slaDays: 1, dependencyStepKeys: ['operational_remediation'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'INTERACTION' },
      { stepOrder: 4, stepKey: 'satisfaction_signoff', name: 'Post-Recovery Relationship Health Check', description: 'Verify case closure and confirm customer satisfaction in Relationship Review.', stepType: 'REVIEW' as JourneyStepType, required: true, slaDays: 1, dependencyStepKeys: ['client_outreach'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'REVIEW' },
    ],
  },
  {
    templateCode: 'PRODUCT_ADOPTION',
    name: 'Strategic Cross-Sell & Facility Adoption',
    description: 'Structured rollout of newly approved treasury, CMS, or forex facilities to deepen relationship.',
    category: 'GROWTH',
    defaultPriority: 'NORMAL' as const,
    targetDurationDays: 14,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'product_selection', name: 'Product Scope & Commercial Proposal', description: 'Prepare tailored pricing and term sheet for client approval.', stepType: 'OPPORTUNITY' as JourneyStepType, required: true, slaDays: 3, defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'OPPORTUNITY' },
      { stepOrder: 2, stepKey: 'mandate_documents', name: 'Procure Product Mandate & Resolution', description: 'Collect specific product application forms and authorized signatory mandates.', stepType: 'DOCUMENT' as JourneyStepType, required: true, slaDays: 4, dependencyStepKeys: ['product_selection'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'DOCUMENT' },
      { stepOrder: 3, stepKey: 'system_activation', name: 'Activate Facility on Core Banking Engine', description: 'Provision limits, virtual accounts, or API keys in production.', stepType: 'TASK' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['mandate_documents'], defaultOwnerRole: 'BRANCH_OPS_HEAD', evidenceType: 'TASK' },
      { stepOrder: 4, stepKey: 'training_and_usage', name: 'Client Onboarding Training & First Transaction', description: 'Conduct client training session and monitor initial live transaction.', stepType: 'INTERACTION' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['system_activation'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'INTERACTION' },
    ],
  },
  {
    templateCode: 'RELATIONSHIP_REVIEW',
    name: 'Annual Strategic Relationship & Pricing Review',
    description: 'Comprehensive annual portfolio review analyzing product holdings, balances, and service health.',
    category: 'REVIEW',
    defaultPriority: 'NORMAL' as const,
    targetDurationDays: 10,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'review_preparation', name: 'Assemble Comprehensive Dossier & CORE Score', description: 'Consolidate 360 data, account balances, fee yields, and open grievances.', stepType: 'TASK' as JourneyStepType, required: true, slaDays: 3, defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'TASK' },
      { stepOrder: 2, stepKey: 'formal_executive_meeting', name: 'Conduct Formal Annual Relationship Review', description: 'Meet executive leadership to discuss performance, upcoming projects, and pipeline.', stepType: 'REVIEW' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['review_preparation'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'REVIEW' },
      { stepOrder: 3, stepKey: 'commitments_followup', name: 'Action Items & Service Commitments Logging', description: 'Record agreed action items, concessions, and reciprocal commitments.', stepType: 'COMMITMENT' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['formal_executive_meeting'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'TASK' },
      { stepOrder: 4, stepKey: 'pricing_signoff', name: 'Pricing & Facility Limit Confirmation', description: 'Formalize updated pricing schedules and limits with management signoff.', stepType: 'APPROVAL' as JourneyStepType, required: false, slaDays: 2, dependencyStepKeys: ['commitments_followup'], defaultOwnerRole: 'BRANCH_OPS_HEAD', evidenceType: 'APPROVAL' },
    ],
  },
  {
    templateCode: 'OPPORTUNITY_CONVERSION',
    name: 'High-Value Opportunity Radar Conversion',
    description: 'Systematic conversion workflow for radar-flagged business opportunities.',
    category: 'GROWTH',
    defaultPriority: 'HIGH' as const,
    targetDurationDays: 12,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'radar_qualification', name: 'Qualify Signal & Open Commercial Opportunity', description: 'Validate trigger signal and establish client appetite.', stepType: 'OPPORTUNITY' as JourneyStepType, required: true, slaDays: 2, defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'OPPORTUNITY' },
      { stepOrder: 2, stepKey: 'solution_pitch', name: 'Advisory Pitch & Term Sheet Delivery', description: 'Deliver tailored proposal and negotiate commercial terms.', stepType: 'INTERACTION' as JourneyStepType, required: true, slaDays: 4, dependencyStepKeys: ['radar_qualification'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'INTERACTION' },
      { stepOrder: 3, stepKey: 'contract_execution', name: 'Contract Execution & Deal Closure', description: 'Obtain signed agreements and formalize commercial win.', stepType: 'APPROVAL' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['solution_pitch'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'TASK' },
    ],
  },
  {
    templateCode: 'DOCUMENT_COMPLETION',
    name: 'Regulatory Document Deficiency Rectification',
    description: 'Resolution of missing, expired, or non-compliant regulatory files.',
    category: 'ONBOARDING',
    defaultPriority: 'HIGH' as const,
    targetDurationDays: 7,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'deficiency_identification', name: 'Audit Missing or Expired Requirements', description: 'Catalogue missing documents against account compliance rules.', stepType: 'TASK' as JourneyStepType, required: true, slaDays: 1, defaultOwnerRole: 'COMPLIANCE_OFFICER', evidenceType: 'TASK' },
      { stepOrder: 2, stepKey: 'client_request', name: 'Client Notification & Document Submission', description: 'Request required documents from client corporate secretary.', stepType: 'INTERACTION' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['deficiency_identification'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'INTERACTION' },
      { stepOrder: 3, stepKey: 'document_verification', name: 'Document Inspection & Verification Signoff', description: 'Inspect uploaded certificates for authenticity and clarity.', stepType: 'DOCUMENT' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['client_request'], defaultOwnerRole: 'KYC_OPERATIONS', evidenceType: 'DOCUMENT' },
    ],
  },
  {
    templateCode: 'CUSTOMER_RETENTION_WORKFLOW',
    name: 'Proactive Customer Retention & Attrition Defense',
    description: 'Targeted intervention triggered by high attrition risk or sharp balance depletion signals.',
    category: 'RETENTION',
    defaultPriority: 'CRITICAL' as const,
    targetDurationDays: 8,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'attrition_signal_analysis', name: 'Analyze Balance Outflow & Signals', description: 'Examine recent debit velocity, wire transfers, and competitor engagement.', stepType: 'SIGNAL' as JourneyStepType, required: true, slaDays: 1, defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'SIGNAL' },
      { stepOrder: 2, stepKey: 'retention_offer_formulation', name: 'Formulate Retention Strategy & Fee Concessions', description: 'Design competitive pricing concessions or enhanced credit limits.', stepType: 'APPROVAL' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['attrition_signal_analysis'], defaultOwnerRole: 'BRANCH_OPS_HEAD', evidenceType: 'APPROVAL' },
      { stepOrder: 3, stepKey: 'in_person_meeting', name: 'Executive Retention Meeting', description: 'Meet Chief Financial Officer in person to address friction and present package.', stepType: 'INTERACTION' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['retention_offer_formulation'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'INTERACTION' },
      { stepOrder: 4, stepKey: 'retention_closure', name: 'Implement Concessions & Affirm Commitment', description: 'Enact fee adjustments and track restored deposit balances.', stepType: 'TASK' as JourneyStepType, required: true, slaDays: 2, dependencyStepKeys: ['in_person_meeting'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'TASK' },
    ],
  },
  {
    templateCode: 'RELATIONSHIP_RECOVERY',
    name: 'Holistic Multi-Product Relationship Recovery',
    description: 'Comprehensive restorative plan combining service remediation, executive review, and limit renewal.',
    category: 'RETENTION',
    defaultPriority: 'HIGH' as const,
    targetDurationDays: 14,
    defaultOwnerRole: 'RELATIONSHIP_MANAGER',
    steps: [
      { stepOrder: 1, stepKey: 'recovery_assessment', name: 'Cross-Functional Relationship Assessment', description: 'Assemble service desk logs, review history, and credit records.', stepType: 'TASK' as JourneyStepType, required: true, slaDays: 2, defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'TASK' },
      { stepOrder: 2, stepKey: 'service_ticket_clearance', name: 'Clear All Outstanding Service Tickets', description: 'Expedite resolution of all unresolved operational friction points.', stepType: 'SERVICE_CASE' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['recovery_assessment'], defaultOwnerRole: 'SERVICE_DESK', evidenceType: 'SERVICE_CASE' },
      { stepOrder: 3, stepKey: 'senior_executive_briefing', name: 'Senior Management Strategic Alignment', description: 'Senior Vice President meeting with client promoters to realign trust.', stepType: 'INTERACTION' as JourneyStepType, required: true, slaDays: 4, dependencyStepKeys: ['service_ticket_clearance'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'INTERACTION' },
      { stepOrder: 4, stepKey: 'stabilization_review', name: 'Formal Post-Recovery Relationship Review', description: 'Formalize renewed relationship memorandum and record improved health.', stepType: 'REVIEW' as JourneyStepType, required: true, slaDays: 3, dependencyStepKeys: ['senior_executive_briefing'], defaultOwnerRole: 'RELATIONSHIP_MANAGER', evidenceType: 'REVIEW' },
    ],
  },
];

export const journeyService = {
  /**
   * Initializes default journey templates in PostgreSQL if not already present
   */
  async ensureTemplates(): Promise<void> {
    const existing = await journeyRepository.listTemplates();
    if (existing.length > 0) return;

    for (const tpl of DEFAULT_JOURNEY_TEMPLATES) {
      const created = await journeyRepository.createTemplate({
        templateCode: tpl.templateCode,
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        defaultPriority: tpl.defaultPriority,
        targetDurationDays: tpl.targetDurationDays,
        defaultOwnerRole: tpl.defaultOwnerRole,
        isActive: true,
      });

      const stepsToInsert = tpl.steps.map((s) => ({
        templateId: created.id,
        stepOrder: s.stepOrder,
        stepKey: s.stepKey,
        name: s.name,
        description: s.description,
        stepType: s.stepType,
        required: s.required,
        slaDays: s.slaDays,
        dependencyStepKeys: s.dependencyStepKeys || [],
        defaultOwnerRole: s.defaultOwnerRole,
        evidenceType: s.evidenceType,
      }));

      await journeyRepository.createTemplateSteps(stepsToInsert);
    }
  },

  /**
   * List all templates with steps
   */
  async listTemplates(): Promise<JourneyTemplateDTO[]> {
    await this.ensureTemplates();
    const records = await journeyRepository.listTemplates();
    return records.map((r) => ({
      id: r.id,
      templateCode: r.templateCode,
      name: r.name,
      description: r.description,
      category: r.category,
      defaultPriority: r.defaultPriority as any,
      targetDurationDays: r.targetDurationDays,
      defaultOwnerRole: r.defaultOwnerRole,
      isActive: r.isActive,
      metadata: r.metadata as any,
      steps: (r.steps || []).map((s) => ({
        id: s.id,
        templateId: s.templateId,
        stepOrder: s.stepOrder,
        stepKey: s.stepKey,
        name: s.name,
        description: s.description,
        stepType: s.stepType as any,
        required: s.required,
        slaDays: s.slaDays,
        dependencyStepKeys: (s.dependencyStepKeys as string[]) || [],
        defaultOwnerRole: s.defaultOwnerRole,
        evidenceType: s.evidenceType || undefined,
        createdAt: s.createdAt.toISOString(),
      })),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  },

  /**
   * Instantiate and start a governed customer journey
   */
  async createJourney(
    payload: CreateJourneyPayload,
    user: SafeUser,
    requestId: string
  ): Promise<CustomerJourneyDTO> {
    await this.ensureTemplates();
    await resourceAuth.authorizeCustomer(user, payload.customerId, 'JOURNEY_CREATE', requestId);

    // Fetch customer to verify existence and name
    const [cust] = await db.select().from(customers).where(eq(customers.id, payload.customerId)).limit(1);
    if (!cust) {
      throw new BankingError(404, `Customer with ID ${payload.customerId} not found.`);
    }

    const template = await journeyRepository.getTemplateByCode(payload.templateCode);
    if (!template) {
      throw new BankingError(404, `Journey template '${payload.templateCode}' not found.`);
    }

    const journeyCode = `JRN-${new Date().getFullYear()}-${cust.id}-${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const targetCompletionAt = new Date(now.getTime() + template.targetDurationDays * 24 * 60 * 60 * 1000);

    const journey = await journeyRepository.createJourney({
      journeyId: journeyCode,
      customerId: cust.id,
      templateId: template.id,
      journeyType: template.templateCode,
      name: payload.name || template.name,
      description: payload.description || template.description,
      status: 'ACTIVE',
      priority: payload.priority || (template.defaultPriority as any) || 'NORMAL',
      ownerId: payload.ownerId || cust.assignedRmId || user.id,
      ownerRole: template.defaultOwnerRole,
      startedAt: now,
      targetCompletionAt,
      slaStatus: 'ON_TRACK',
      createdBy: user.id,
      metadata: payload.metadata || {},
    });

    // Create steps from template
    let runningDueDate = new Date(now);
    const stepInserts = (template.steps || []).map((s, idx) => {
      const stepDueAt = new Date(runningDueDate.getTime() + s.slaDays * 24 * 60 * 60 * 1000);
      runningDueDate = stepDueAt;

      const hasDeps = s.dependencyStepKeys && (s.dependencyStepKeys as string[]).length > 0;
      const initialStatus: JourneyStepStatus = idx === 0 || !hasDeps ? 'READY' : 'PENDING';

      return {
        journeyId: journey.id,
        stepId: `${journeyCode}-S0${s.stepOrder}`,
        stepNumber: s.stepOrder,
        stepKey: s.stepKey,
        stepType: s.stepType,
        name: s.name,
        description: s.description,
        status: initialStatus,
        ownerId: journey.ownerId,
        ownerRole: s.defaultOwnerRole,
        required: s.required,
        dependency: (s.dependencyStepKeys as string[])?.join(',') || null,
        slaDays: s.slaDays,
        startedAt: initialStatus === 'READY' ? now : null,
        dueAt: stepDueAt,
        slaStatus: 'ON_TRACK',
      };
    });

    const createdSteps = await journeyRepository.createJourneySteps(stepInserts);

    // Update currentStepId on journey
    const firstReady = createdSteps.find((s) => s.status === 'READY') || createdSteps[0];
    if (firstReady) {
      await journeyRepository.updateJourney(journey.id, { currentStepId: firstReady.id });
    }

    // Send Notification: JOURNEY_STARTED
    try {
      await notificationService.createNotification({
        userId: journey.ownerId || user.id,
        customerId: cust.id,
        notificationType: 'JOURNEY_STARTED',
        category: 'CUSTOMER',
        severity: 'INFO',
        title: `Journey Started: ${journey.name}`,
        message: `Customer journey ${journey.journeyId} has been initiated for ${cust.name}.`,
        sourceEntityType: 'JOURNEY',
        sourceEntityId: String(journey.id),
      });
    } catch (err) {
      console.warn('Could not dispatch notification for journey start:', err);
    }

    // Audit Log: JOURNEY_CREATED & JOURNEY_STARTED
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'JOURNEY_CREATED',
      resourceType: 'CUSTOMER_JOURNEY',
      resourceId: journey.journeyId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        customerId: cust.id,
        journeyType: journey.journeyType,
        stepCount: createdSteps.length,
      },
    });

    return await this.getJourney(journey.id, user, requestId);
  },

  /**
   * Retrieve journey details with RBAC authorization
   */
  async resolveJourney(idOrJourneyId: number | string) {
    const numId = Number(idOrJourneyId);
    if (!isNaN(numId)) {
      const byId = await journeyRepository.getJourneyById(numId);
      if (byId) return byId;
    }
    if (typeof idOrJourneyId === 'string' || typeof idOrJourneyId === 'number') {
      return await journeyRepository.getJourneyByJourneyId(String(idOrJourneyId));
    }
    return null;
  },

  async getJourney(
    idOrJourneyId: number | string,
    user: SafeUser,
    requestId: string
  ): Promise<CustomerJourneyDTO> {
    const journey = await this.resolveJourney(idOrJourneyId);

    if (!journey) {
      throw new BankingError(404, `Customer journey '${idOrJourneyId}' was not found.`);
    }

    // RBAC customer check
    await resourceAuth.authorizeCustomer(user, journey.customerId, 'JOURNEY_READ', requestId);

    // Recompute step and journey SLA statuses
    const now = new Date();
    const steps: CustomerJourneyStepDTO[] = (journey.steps || []).map((s) => {
      let slaStatus: JourneySLAStatus = s.slaStatus as JourneySLAStatus;
      if (s.status === 'COMPLETED' || s.status === 'SKIPPED') {
        slaStatus = 'COMPLETED';
      } else if (s.dueAt) {
        const dueTime = new Date(s.dueAt).getTime();
        const diffHours = (dueTime - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 0) {
          slaStatus = 'BREACHED';
        } else if (diffHours <= 24) {
          slaStatus = 'AT_RISK';
        } else {
          slaStatus = 'ON_TRACK';
        }
      }

      return {
        id: s.id,
        journeyId: s.journeyId,
        stepId: s.stepId,
        stepNumber: s.stepNumber,
        stepKey: s.stepKey,
        stepType: s.stepType as JourneyStepType,
        name: s.name,
        description: s.description,
        status: s.status as JourneyStepStatus,
        ownerId: s.ownerId,
        ownerRole: s.ownerRole || undefined,
        required: s.required,
        dependency: s.dependency,
        dependencyStepKeys: s.dependency ? s.dependency.split(',').map((x) => x.trim()) : [],
        slaDays: s.slaDays,
        startedAt: s.startedAt ? s.startedAt.toISOString() : null,
        completedAt: s.completedAt ? s.completedAt.toISOString() : null,
        dueAt: s.dueAt ? s.dueAt.toISOString() : null,
        slaStatus,
        blockedReason: s.blockedReason,
        blockerReason: s.blockedReason,
        completionEvidence: s.completionEvidence as CompletionEvidence | null,
        evidenceVerified: !!s.completionEvidence,
        assignedRole: s.ownerRole || undefined,
        stepOrder: s.stepNumber,
        dueDate: s.dueAt ? s.dueAt.toISOString() : null,
        notes: s.notes,
        metadata: s.metadata as any,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });

    // Calculate progress
    const requiredSteps = steps.filter((s) => s.required);
    const completedRequired = requiredSteps.filter((s) => s.status === 'COMPLETED').length;
    const percentage =
      requiredSteps.length > 0 ? Math.round((completedRequired / requiredSteps.length) * 100) : 0;
    const blockedCount = steps.filter((s) => s.status === 'BLOCKED').length;
    const overdueCount = steps.filter((s) => s.slaStatus === 'BREACHED').length;

    const currentStep = steps.find((s) => s.status === 'IN_PROGRESS' || s.status === 'READY') || steps[0];
    const nextStep = steps.find(
      (s) => s.status === 'PENDING' && s.stepNumber > (currentStep?.stepNumber || 0)
    );

    const progress: JourneyProgressDTO = {
      completedSteps: completedRequired,
      totalRequiredSteps: requiredSteps.length,
      totalSteps: steps.length,
      percentage,
      progressPercentage: percentage,
      blockedStepsCount: blockedCount,
      overdueStepsCount: overdueCount,
      currentStepName: currentStep?.name,
      nextStepName: nextStep?.name,
    };

    // Synthesize Timeline
    const timeline = await this.buildTimeline(journey, steps);

    // Latest outcome
    const outcome = journey.outcomes?.[0]
      ? {
          id: journey.outcomes[0].id,
          journeyId: journey.outcomes[0].journeyId,
          outcomeType: journey.outcomes[0].outcomeType as JourneyOutcomeType,
          outcome: journey.outcomes[0].outcome,
          summary: journey.outcomes[0].summary,
          evidence: journey.outcomes[0].evidence as any,
          recordedBy: journey.outcomes[0].recordedBy,
          recordedAt: journey.outcomes[0].recordedAt.toISOString(),
        }
      : null;

    return {
      id: journey.id,
      journeyId: journey.journeyId,
      customerId: journey.customerId,
      customerCode: journey.customer?.customerCode,
      customerName: journey.customer?.name,
      customerSegment: journey.customer?.entityType,
      templateId: journey.templateId,
      journeyType: journey.journeyType,
      name: journey.name,
      description: journey.description,
      status: journey.status as JourneyStatus,
      priority: journey.priority as any,
      ownerId: journey.ownerId,
      ownerName: journey.owner?.name,
      ownerRole: journey.ownerRole,
      currentStepId: currentStep?.id,
      currentStepName: currentStep?.name,
      currentStepType: currentStep?.stepType,
      startedAt: journey.startedAt ? journey.startedAt.toISOString() : null,
      targetCompletionAt: journey.targetCompletionAt ? journey.targetCompletionAt.toISOString() : null,
      completedAt: journey.completedAt ? journey.completedAt.toISOString() : null,
      blockedReason: journey.blockedReason,
      blockedAt: journey.blockedAt ? journey.blockedAt.toISOString() : null,
      slaStatus: (journey.slaStatus as JourneySLAStatus) || 'ON_TRACK',
      escalatedAt: journey.escalatedAt ? journey.escalatedAt.toISOString() : null,
      escalatedTo: journey.escalatedTo,
      escalationReason: journey.escalationReason,
      decisionTraceId: journey.decisionTraceId,
      progress,
      steps,
      timeline,
      outcome,
      metadata: journey.metadata as any,
      journeyCode: journey.journeyId,
      blockerReason: journey.blockedReason,
      targetCompletionDate: journey.targetCompletionAt ? journey.targetCompletionAt.toISOString() : null,
      progressPercentage: percentage,
      createdBy: journey.createdBy,
      createdAt: journey.createdAt.toISOString(),
      updatedAt: journey.updatedAt.toISOString(),
    };
  },

  /**
   * List customer journeys with filtering and RBAC scoping
   */
  async listJourneys(
    params: JourneyFilterParams,
    user: SafeUser,
    requestId: string
  ): Promise<CustomerJourneyDTO[]> {
    let allowedCustomerIds: number[] | undefined = undefined;

    // RBAC: If RM, restrict to assigned portfolio unless admin or branch head
    if (user.role === 'RELATIONSHIP_MANAGER') {
      const assigned = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.assignedRmId, user.id));
      allowedCustomerIds = assigned.map((c) => c.id);
    }

    if (params.customerId) {
      await resourceAuth.authorizeCustomer(user, params.customerId, 'JOURNEY_LIST', requestId);
    }

    const records = await journeyRepository.listJourneys(params, allowedCustomerIds);
    const results: CustomerJourneyDTO[] = [];

    for (const r of records) {
      const requiredSteps = (r.steps || []).filter((s) => s.required);
      const completedSteps = requiredSteps.filter((s) => s.status === 'COMPLETED').length;
      const percentage =
        requiredSteps.length > 0 ? Math.round((completedSteps / requiredSteps.length) * 100) : 0;

      const currentStep = r.steps?.find((s) => s.status === 'IN_PROGRESS' || s.status === 'READY') || r.steps?.[0];

      results.push({
        id: r.id,
        journeyId: r.journeyId,
        customerId: r.customerId,
        customerCode: r.customer?.customerCode,
        customerName: r.customer?.name,
        customerSegment: r.customer?.entityType,
        templateId: r.templateId,
        journeyType: r.journeyType,
        name: r.name,
        description: r.description,
        status: r.status as JourneyStatus,
        priority: r.priority as any,
        ownerId: r.ownerId,
        ownerName: r.owner?.name,
        ownerRole: r.ownerRole,
        currentStepId: currentStep?.id,
        currentStepName: currentStep?.name,
        currentStepType: currentStep?.stepType as any,
        startedAt: r.startedAt ? r.startedAt.toISOString() : null,
        targetCompletionAt: r.targetCompletionAt ? r.targetCompletionAt.toISOString() : null,
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        blockedReason: r.blockedReason,
        blockedAt: r.blockedAt ? r.blockedAt.toISOString() : null,
        slaStatus: (r.slaStatus as JourneySLAStatus) || 'ON_TRACK',
        escalatedAt: r.escalatedAt ? r.escalatedAt.toISOString() : null,
        progress: {
          completedSteps,
          totalRequiredSteps: requiredSteps.length,
          totalSteps: r.steps?.length || 0,
          percentage,
          progressPercentage: percentage,
          blockedStepsCount: (r.steps || []).filter((s) => s.status === 'BLOCKED').length,
          overdueStepsCount: 0,
          currentStepName: currentStep?.name,
        },
        journeyCode: r.journeyId,
        blockerReason: r.blockedReason,
        targetCompletionDate: r.targetCompletionAt ? r.targetCompletionAt.toISOString() : null,
        progressPercentage: percentage,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      });
    }

    return results;
  },

  /**
   * Governed step transition with evidence validation and automatic dependency propagation
   */
  async updateStep(
    journeyId: number | string,
    stepId: number | string,
    payload: UpdateJourneyStepPayload,
    user: SafeUser,
    requestId: string
  ): Promise<CustomerJourneyDTO> {
    const journey = await this.resolveJourney(journeyId);

    if (!journey) {
      throw new BankingError(404, `Customer journey '${journeyId}' not found.`);
    }

    await resourceAuth.authorizeCustomer(user, journey.customerId, 'JOURNEY_STEP_UPDATE', requestId);

    if (journey.status === 'COMPLETED' || journey.status === 'CANCELLED' || journey.status === 'FAILED') {
      throw new BankingError(
        400,
        `Cannot update steps for journey ${journey.journeyId} because it is in terminal state '${journey.status}'.`
      );
    }

    const step =
      typeof stepId === 'number'
        ? await journeyRepository.getJourneyStepById(stepId)
        : (journey.steps || []).find((s) => s.stepId === stepId || s.stepKey === stepId);

    if (!step || step.journeyId !== journey.id) {
      throw new BankingError(404, `Journey step '${stepId}' not found within journey ${journey.journeyId}.`);
    }

    const currentSteps = await journeyRepository.getJourneySteps(journey.id);

    // 1. Dependency Validation: Cannot complete or start step if dependencies are unmet
    if (payload.status === 'COMPLETED' || payload.status === 'IN_PROGRESS') {
      const depKeys = step.dependency ? step.dependency.split(',').map((x) => x.trim()) : [];
      for (const dk of depKeys) {
        const depStep = currentSteps.find((s) => s.stepKey === dk);
        if (depStep && depStep.status !== 'COMPLETED' && depStep.status !== 'SKIPPED') {
          throw new BankingError(
            400,
            `Cannot transition step '${step.name}' to ${payload.status}. Prerequisite step '${depStep.name}' (${dk}) is currently ${depStep.status}.`
          );
        }
      }
    }

    // 2. Strict Evidence Verification: Required steps require authoritative entity verification
    if (payload.status === 'COMPLETED' && step.required) {
      if (!payload.completionEvidence) {
        throw new BankingError(
          400,
          `Completion rejected: Step '${step.name}' is required and requires valid completion evidence.`
        );
      }
      await this.verifyEvidence(journey.customerId, step.stepType, payload.completionEvidence, user);
    }

    // 3. Skip rule: Only optional steps may be skipped
    if (payload.status === 'SKIPPED' && step.required) {
      throw new BankingError(400, `Cannot skip step '${step.name}': Mandatory compliance step cannot be skipped.`);
    }

    // 4. Update step fields
    const now = new Date();
    const updateData: any = {};
    if (payload.status) updateData.status = payload.status;
    if (payload.notes) updateData.notes = payload.notes;
    if (payload.blockedReason) updateData.blockedReason = payload.blockedReason;

    if (payload.status === 'IN_PROGRESS' && !step.startedAt) {
      updateData.startedAt = now;
    }
    if (payload.status === 'COMPLETED') {
      updateData.completedAt = now;
      updateData.slaStatus = 'COMPLETED';
      if (payload.completionEvidence) {
        updateData.completionEvidence = {
          ...payload.completionEvidence,
          verifiedAt: now.toISOString(),
          verifiedBy: user.id,
          verifiedByName: user.name,
        };
      }
    }
    if (payload.status === 'BLOCKED') {
      const reason = (payload as any).blockerReason || payload.blockedReason;
      if (!reason || !reason.trim()) {
        throw new BankingError(400, 'A blockerReason is mandatory when marking a step as BLOCKED.');
      }
      updateData.blockedReason = reason.trim();
    }

    await journeyRepository.updateJourneyStep(step.id, updateData);

    // 5. Evaluate subsequent steps & cascade READY state
    const refreshedSteps = await journeyRepository.getJourneySteps(journey.id);
    for (const otherStep of refreshedSteps) {
      if (otherStep.status === 'PENDING') {
        const depKeys = otherStep.dependency ? otherStep.dependency.split(',').map((x) => x.trim()) : [];
        const allDepsSatisfied = depKeys.every((dk) => {
          const s = refreshedSteps.find((x) => x.stepKey === dk);
          return s && (s.status === 'COMPLETED' || s.status === 'SKIPPED');
        });
        if (allDepsSatisfied) {
          await journeyRepository.updateJourneyStep(otherStep.id, {
            status: 'READY',
            startedAt: now,
          });
        }
      }
    }

    // 6. Evaluate Overall Journey Status
    const finalSteps = await journeyRepository.getJourneySteps(journey.id);
    const anyBlocked = finalSteps.some((s) => s.status === 'BLOCKED');
    const allRequiredCompleted = finalSteps
      .filter((s) => s.required)
      .every((s) => s.status === 'COMPLETED');

    if (allRequiredCompleted) {
      await journeyRepository.updateJourney(journey.id, {
        status: 'COMPLETED',
        completedAt: now,
        slaStatus: 'COMPLETED',
      });

      // Record outcome
      await journeyRepository.createJourneyOutcome({
        journeyId: journey.id,
        outcomeType: 'COMPLETED_SUCCESSFULLY',
        outcome: 'Completed All Mandatory Steps',
        summary: `All ${finalSteps.length} lifecycle steps successfully finished with verified audit evidence.`,
        recordedBy: user.id,
        evidence: { completedStepCount: finalSteps.length, finishedAt: now.toISOString() },
      });

      // Notify completion
      await notificationService.createNotification({
        userId: journey.ownerId || user.id,
        customerId: journey.customerId,
        notificationType: 'JOURNEY_COMPLETED',
        category: 'CUSTOMER',
        severity: 'INFO',
        title: `Journey Completed: ${journey.name}`,
        message: `Customer journey ${journey.journeyId} has completed all steps successfully.`,
        sourceEntityType: 'JOURNEY',
        sourceEntityId: String(journey.id),
      });
    } else if (anyBlocked) {
      const blockedStep = finalSteps.find((s) => s.status === 'BLOCKED');
      await journeyRepository.updateJourney(journey.id, {
        status: 'BLOCKED',
        blockedReason: blockedStep?.blockedReason || 'Step execution blocked.',
        blockedAt: now,
      });

      // Create Decision Trace explaining why journey is blocked (Phase 29)
      try {
        await decisionTraceService.recordDecisionTrace(
          {
            customerId: journey.customerId,
            sourceModule: 'JOURNEY_ORCHESTRATOR',
            sourceEngine: 'Customer Journey Orchestrator',
            decisionType: 'JOURNEY_BLOCKED',
            recommendationTitle: `Journey Blocked: ${blockedStep?.name}`,
            recommendationSummary: `Customer journey ${journey.journeyId} blocked at step '${blockedStep?.name}' due to: ${blockedStep?.blockedReason}.`,
            decisionMode: 'DETERMINISTIC',
            evidence: [
              {
                evidenceType: 'JOURNEY_STEP_BLOCKER',
                sourceEngine: 'Journey State Machine',
                sourceEntityType: 'JOURNEY_STEP',
                sourceEntityId: blockedStep?.stepId || String(blockedStep?.id),
                description: blockedStep?.blockedReason || 'Missing required prerequisite or operational block.',
                observedValue: 'BLOCKED',
                contributionType: 'PRIMARY',
              },
            ],
          },
          user
        );
      } catch (err) {
        console.warn('Could not record Decision Trace for blocked journey:', err);
      }

      // Notify blocked
      await notificationService.createNotification({
        userId: journey.ownerId || user.id,
        customerId: journey.customerId,
        notificationType: 'JOURNEY_BLOCKED',
        category: 'SERVICE',
        severity: 'WARNING',
        title: `Journey Blocked: ${journey.name}`,
        message: `Step '${blockedStep?.name}' is blocked: ${blockedStep?.blockedReason}`,
        sourceEntityType: 'JOURNEY',
        sourceEntityId: String(journey.id),
      });
    } else {
      // Re-activate if was blocked or transition from NOT_STARTED
      if (journey.status === 'BLOCKED' || journey.status === 'NOT_STARTED') {
        await journeyRepository.updateJourney(journey.id, {
          status: 'IN_PROGRESS',
          blockedReason: null,
          blockedAt: null,
          startedAt: journey.startedAt || now,
        });
      }
    }

    // Audit Log: Step update
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action:
        payload.status === 'COMPLETED'
          ? 'JOURNEY_STEP_COMPLETED'
          : payload.status === 'BLOCKED'
          ? 'JOURNEY_STEP_BLOCKED'
          : 'JOURNEY_STEP_STARTED',
      resourceType: 'JOURNEY_STEP',
      resourceId: step.stepId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        journeyId: journey.journeyId,
        stepKey: step.stepKey,
        newStatus: payload.status,
      },
    });

    return await this.getJourney(journey.id, user, requestId);
  },

  /**
   * Verifies completion evidence against authoritative COREvia tables
   */
  async verifyEvidence(
    customerId: number,
    stepType: string,
    evidence: CompletionEvidence,
    user: SafeUser
  ): Promise<void> {
    if (!evidence.evidenceType || !evidence.entityId) {
      throw new BankingError(400, 'Invalid evidence: evidenceType and entityId are required.');
    }

    switch (evidence.evidenceType) {
      case 'DOCUMENT': {
        const [doc] = await db
          .select()
          .from(documents)
          .where(and(eq(documents.id, Number(evidence.entityId)), eq(documents.customerId, customerId)))
          .limit(1);
        if (!doc) {
          throw new BankingError(
            400,
            `Evidence verification failed: Document #${evidence.entityId} does not exist for customer.`
          );
        }
        if (doc.status === 'REJECTED') {
          throw new BankingError(400, `Evidence verification failed: Document #${evidence.entityId} is in REJECTED status.`);
        }
        break;
      }

      case 'TASK': {
        const [t] = await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.id, Number(evidence.entityId)), eq(tasks.customerId, customerId)))
          .limit(1);
        if (!t) {
          throw new BankingError(400, `Evidence verification failed: Task #${evidence.entityId} does not exist for customer.`);
        }
        break;
      }

      case 'SERVICE_CASE': {
        const [sc] = await db
          .select()
          .from(serviceCases)
          .where(and(eq(serviceCases.id, Number(evidence.entityId)), eq(serviceCases.customerId, customerId)))
          .limit(1);
        if (!sc) {
          throw new BankingError(
            400,
            `Evidence verification failed: Service Case #${evidence.entityId} does not exist for customer.`
          );
        }
        break;
      }

      case 'OPPORTUNITY': {
        const [opp] = await db
          .select()
          .from(opportunities)
          .where(and(eq(opportunities.id, Number(evidence.entityId)), eq(opportunities.customerId, customerId)))
          .limit(1);
        if (!opp) {
          throw new BankingError(
            400,
            `Evidence verification failed: Opportunity #${evidence.entityId} does not exist for customer.`
          );
        }
        break;
      }

      case 'REVIEW': {
        const [rev] = await db
          .select()
          .from(interactions)
          .where(and(eq(interactions.id, Number(evidence.entityId)), eq(interactions.customerId, customerId)))
          .limit(1);
        if (!rev) {
          throw new BankingError(
            400,
            `Evidence verification failed: Relationship Review #${evidence.entityId} does not exist for customer.`
          );
        }
        break;
      }

      case 'INTERACTION': {
        const [inter] = await db
          .select()
          .from(interactions)
          .where(and(eq(interactions.id, Number(evidence.entityId)), eq(interactions.customerId, customerId)))
          .limit(1);
        if (!inter) {
          throw new BankingError(
            400,
            `Evidence verification failed: Interaction #${evidence.entityId} does not exist for customer.`
          );
        }
        break;
      }

      case 'SIGNAL': {
        const [sig] = await db
          .select()
          .from(customerOpportunityRadar)
          .where(and(eq(customerOpportunityRadar.id, Number(evidence.entityId)), eq(customerOpportunityRadar.customerId, customerId)))
          .limit(1);
        if (!sig) {
          throw new BankingError(
            400,
            `Evidence verification failed: Signal #${evidence.entityId} does not exist for customer.`
          );
        }
        break;
      }

      case 'KYC_RECORD':
      case 'APPROVAL':
      case 'AGENT_PLAN':
      case 'MANUAL_VERIFICATION':
        // Authorized officer verification accepted
        break;

      default:
        throw new BankingError(400, `Unsupported evidence type '${evidence.evidenceType}'.`);
    }
  },

  /**
   * Controlled ownership handoff
   */
  async handoffJourney(
    journeyId: number | string,
    payload: HandoffJourneyPayload,
    user: SafeUser,
    requestId: string
  ): Promise<CustomerJourneyDTO> {
    const journey = await this.resolveJourney(journeyId);

    if (!journey) {
      throw new BankingError(404, `Customer journey '${journeyId}' not found.`);
    }

    await resourceAuth.authorizeCustomer(user, journey.customerId, 'JOURNEY_HANDOFF', requestId);

    const targetUserId = (payload as any).targetUserId || (payload as any).newOwnerId;
    const targetRole = (payload as any).targetRole || (payload as any).newOwnerRole;

    let newOwner: any = null;
    if (targetUserId) {
      const [u] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
      newOwner = u;
      if (!newOwner) {
        throw new BankingError(404, `Target owner with user ID ${targetUserId} not found.`);
      }
    } else if (targetRole) {
      const [u] = await db.select().from(users).where(eq(users.role, targetRole)).limit(1);
      if (u) {
        newOwner = u;
      } else {
        const [anyUser] = await db.select().from(users).limit(1);
        newOwner = anyUser ? { ...anyUser, role: targetRole } : { id: user.id, role: targetRole, name: targetRole };
      }
    } else {
      throw new BankingError(400, 'Either newOwnerId or targetRole must be specified for journey handoff.');
    }

    const previousOwnerId = journey.ownerId;
    await journeyRepository.updateJourney(journey.id, {
      ownerId: newOwner.id,
      ownerRole: targetRole || newOwner.role,
    });

    // Notify new owner
    await notificationService.createNotification({
      userId: newOwner.id,
      customerId: journey.customerId,
      notificationType: 'JOURNEY_STEP_ASSIGNED',
      category: 'CUSTOMER',
      severity: 'INFO',
      title: `Journey Assigned: ${journey.name}`,
      message: `Ownership of journey ${journey.journeyId} has been transferred to you. Reason: ${payload.reason}`,
      sourceEntityType: 'JOURNEY',
      sourceEntityId: String(journey.id),
    });

    // Audit log: JOURNEY_OWNER_CHANGED
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'JOURNEY_OWNER_CHANGED',
      resourceType: 'CUSTOMER_JOURNEY',
      resourceId: journey.journeyId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        previousOwnerId,
        newOwnerId: newOwner.id,
        reason: payload.reason,
      },
    });

    return await this.getJourney(journey.id, user, requestId);
  },

  /**
   * Controlled escalation with Decision Trace link
   */
  async escalateJourney(
    journeyId: number | string,
    payload: EscalateJourneyPayload,
    user: SafeUser,
    requestId: string
  ): Promise<CustomerJourneyDTO> {
    const journey = await this.resolveJourney(journeyId);

    if (!journey) {
      throw new BankingError(404, `Customer journey '${journeyId}' not found.`);
    }

    if (!payload.reason || !payload.reason.trim()) {
      throw new BankingError(400, 'A non-empty reason is required for escalation.');
    }

    await resourceAuth.authorizeCustomer(user, journey.customerId, 'JOURNEY_ESCALATE', requestId);

    let escalatedToUser: any = null;
    if (payload.escalateToUserId) {
      const [u] = await db
        .select()
        .from(users)
        .where(eq(users.id, payload.escalateToUserId))
        .limit(1);
      if (!u) {
        throw new BankingError(404, `Escalation target user #${payload.escalateToUserId} not found.`);
      }
      escalatedToUser = u;
    } else {
      const allUsers = await db.select().from(users).limit(10);
      const mgr = allUsers.find(
        (u) => u.role === 'ADMINISTRATOR' || u.role === 'BRANCH_MANAGER' || u.role === 'COMPLIANCE_OFFICER'
      );
      escalatedToUser = mgr || user;
    }

    const now = new Date();

    // 1. Record Decision Trace for escalation (Phase 29)
    let decisionTraceId: string | undefined = undefined;
    try {
      const trace = await decisionTraceService.recordDecisionTrace(
        {
          customerId: journey.customerId,
          sourceModule: 'JOURNEY_ORCHESTRATOR',
          sourceEngine: 'Journey Escalation Engine',
          decisionType: 'JOURNEY_ESCALATED',
          recommendationTitle: `Escalated Journey: ${journey.name}`,
          recommendationSummary: `Customer journey ${journey.journeyId} was escalated to ${escalatedToUser.name}. Reason: ${payload.reason.trim()}.`,
          decisionMode: 'SYSTEM_RULE',
          evidence: [
            {
              evidenceType: 'JOURNEY_ESCALATION_TRIGGER',
              sourceEngine: 'Journey SLA & Escalation Subsystem',
              sourceEntityType: 'JOURNEY',
              sourceEntityId: journey.journeyId,
              description: payload.reason.trim(),
              observedValue: 'ESCALATED',
              contributionType: 'PRIMARY',
            },
          ],
        },
        user
      );
      decisionTraceId = trace.decisionId;
    } catch (err) {
      console.warn('Could not record Decision Trace for journey escalation:', err);
    }

    // 2. Update journey
    await journeyRepository.updateJourney(journey.id, {
      status: 'ESCALATED',
      escalatedAt: now,
      escalatedTo: escalatedToUser.id,
      escalatedBy: user.id,
      escalationReason: payload.reason.trim(),
      priority: 'CRITICAL',
      decisionTraceId: decisionTraceId || journey.decisionTraceId,
    });

    // 3. Notify escalated recipient
    await notificationService.createNotification({
      userId: escalatedToUser.id,
      customerId: journey.customerId,
      notificationType: 'JOURNEY_ESCALATED',
      category: 'SERVICE',
      severity: 'CRITICAL',
      title: `URGENT: Escalated Journey - ${journey.name}`,
      message: `Journey ${journey.journeyId} escalated by ${user.name}: ${payload.reason}`,
      sourceEntityType: 'JOURNEY',
      sourceEntityId: String(journey.id),
    });

    // 4. Audit Log
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'JOURNEY_ESCALATED',
      resourceType: 'CUSTOMER_JOURNEY',
      resourceId: journey.journeyId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        escalatedTo: escalatedToUser.id,
        reason: payload.reason,
        decisionTraceId,
      },
    });

    return await this.getJourney(journey.id, user, requestId);
  },

  /**
   * Record Journey Outcome
   */
  async recordOutcome(
    journeyId: number | string,
    payload: RecordJourneyOutcomePayload,
    user: SafeUser,
    requestId: string
  ): Promise<CustomerJourneyDTO> {
    const journey = await this.resolveJourney(journeyId);

    if (!journey) {
      throw new BankingError(404, `Customer journey '${journeyId}' not found.`);
    }

    await resourceAuth.authorizeCustomer(user, journey.customerId, 'JOURNEY_OUTCOME', requestId);

    const outcome = await journeyRepository.createJourneyOutcome({
      journeyId: journey.id,
      outcomeType: payload.outcomeType,
      outcome: payload.outcome || payload.summary || payload.outcomeType,
      summary: payload.summary,
      evidence: payload.evidence || {},
      recordedBy: user.id,
    });

    // Update status if terminal outcome
    if (payload.outcomeType === 'CANCELLED') {
      await journeyRepository.updateJourney(journey.id, { status: 'CANCELLED' });
    } else if (payload.outcomeType === 'FAILED') {
      await journeyRepository.updateJourney(journey.id, { status: 'FAILED' });
    } else if (
      payload.outcomeType === 'GOAL_MET' ||
      payload.outcomeType === 'PARTIALLY_MET' ||
      (payload.outcomeType as string) === 'COMPLETED' ||
      payload.goalMet
    ) {
      await journeyRepository.updateJourney(journey.id, { status: 'COMPLETED', completedAt: new Date() });
    }

    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'JOURNEY_OUTCOME_RECORDED',
      resourceType: 'CUSTOMER_JOURNEY',
      resourceId: journey.journeyId,
      requestId,
      outcome: 'SUCCESS',
      metadata: {
        outcomeType: payload.outcomeType,
        outcomeId: outcome.id,
      },
    });

    return await this.getJourney(journey.id, user, requestId);
  },

  /**
   * Build unified timeline using actual records from COREvia
   */
  async buildTimeline(journey: any, steps: CustomerJourneyStepDTO[]): Promise<JourneyTimelineEventDTO[]> {
    const events: JourneyTimelineEventDTO[] = [];

    // 1. Journey started
    if (journey.startedAt) {
      events.push({
        id: `EVT-START-${journey.id}`,
        journeyId: journey.journeyId,
        timestamp: journey.startedAt.toISOString(),
        eventType: 'JOURNEY_STARTED',
        title: 'Customer Journey Initiated',
        description: `Journey ${journey.name} initiated for ${journey.customer?.name || 'Customer'}.`,
        actorName: journey.owner?.name || 'Relationship Manager',
        status: 'ACTIVE',
      });
    }

    // 2. Step milestones
    for (const s of steps) {
      if (s.startedAt && s.status !== 'PENDING') {
        events.push({
          id: `EVT-STEP-START-${s.id}`,
          journeyId: journey.journeyId,
          timestamp: s.startedAt,
          eventType: 'STEP_STARTED',
          title: `Step Started: ${s.name}`,
          description: s.description,
          actorName: s.ownerName || 'Operations Officer',
          status: s.status,
        });
      }

      if (s.completedAt && s.status === 'COMPLETED') {
        events.push({
          id: `EVT-STEP-COMP-${s.id}`,
          journeyId: journey.journeyId,
          timestamp: s.completedAt,
          eventType: 'STEP_COMPLETED',
          title: `Step Completed: ${s.name}`,
          description: s.completionEvidence?.summary || `Step ${s.stepNumber} successfully verified.`,
          actorName: s.completionEvidence?.verifiedByName || 'Authorized Officer',
          status: 'COMPLETED',
          isEvidence: true,
          entityType: s.completionEvidence?.evidenceType,
          entityId: s.completionEvidence?.entityId,
        });
      }

      if (s.status === 'BLOCKED') {
        events.push({
          id: `EVT-STEP-BLOCK-${s.id}`,
          journeyId: journey.journeyId,
          timestamp: s.updatedAt,
          eventType: 'STEP_BLOCKED',
          title: `Step Blocked: ${s.name}`,
          description: s.blockedReason || 'Step execution impeded by missing requirement.',
          status: 'BLOCKED',
        });
      }
    }

    // 3. Escalation milestone
    if (journey.escalatedAt) {
      events.push({
        id: `EVT-ESCALATE-${journey.id}`,
        journeyId: journey.journeyId,
        timestamp: journey.escalatedAt.toISOString(),
        eventType: 'JOURNEY_ESCALATED',
        title: 'Journey Escalated to Management',
        description: journey.escalationReason || 'Escalation triggered due to critical bottleneck.',
        status: 'CRITICAL',
      });
    }

    // 4. Completed milestone
    if (journey.completedAt) {
      events.push({
        id: `EVT-FINISH-${journey.id}`,
        journeyId: journey.journeyId,
        timestamp: journey.completedAt.toISOString(),
        eventType: 'JOURNEY_COMPLETED',
        title: 'Customer Journey Completed Successfully',
        description: `All mandatory stages verified with compliance evidence.`,
        status: 'COMPLETED',
      });
    }

    // Sort chronologically
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  /**
   * Aggregates portfolio analytics with RBAC scoping
   */
  async getPortfolioAnalytics(user: SafeUser, requestId: string): Promise<PortfolioJourneyAnalyticsDTO> {
    let allowedCustomerIds: number[] | undefined = undefined;
    if (user.role === 'RELATIONSHIP_MANAGER') {
      const assigned = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.assignedRmId, user.id));
      allowedCustomerIds = assigned.map((c) => c.id);
    }

    const analytics = await journeyRepository.getPortfolioAnalytics(allowedCustomerIds);

    // Audit view
    await auditRepository.createLog({
      actorId: user.employeeId || String(user.id),
      actorName: user.name,
      action: 'JOURNEY_VIEWED',
      resourceType: 'PORTFOLIO_JOURNEYS',
      resourceId: 'ALL',
      requestId,
      outcome: 'SUCCESS',
    });

    return analytics;
  },
};
