import type {
  NextBestAction,
  ActionType,
  ActionPriority,
  ActionUrgency,
  ActionEvidence,
  SourceEntityType,
} from '../types/index.ts';

export interface NBAEvaluationContext {
  customer: any;
  addresses: any[];
  contacts: any[];
  accounts: any[];
  loans: any[];
  interactions: any[];
  cases: any[];
  tasks: any[];
  opportunities: any[];
  score: any | null;
  products: any[];
  insights: any[];
  radarSignals?: any[];
}

export interface GeneratedNBACandidate {
  dedupKey: string;
  customerId: number;
  actionId: string;
  actionType: ActionType;
  category: string;
  title: string;
  description: string;
  priority: ActionPriority;
  urgency: ActionUrgency;
  rationale: string;
  expectedImpact: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  confidenceScore: number;
  rankScore: number;
  ruleId: string;
  ruleVersion: string;
  sourceEntityType: SourceEntityType | string;
  sourceEntityId: string;
  sourceEntityCode?: string;
  evidence: ActionEvidence[];
  actionRoute: string;
  targetEntityContext?: string;
}

export const NBA_RULE_VERSION = 'NBA-v1';

/**
 * Deterministic Next Best Action Rules Engine
 *
 * Implements the core banking CRM principle:
 * "Resolve relationship-damaging service problems before aggressive cross-selling."
 *
 * Evaluates verified CRM data, CORE scores, and Relationship Intelligence signals
 * to produce actionable, explainable, prioritized recommendations.
 * ZERO LLM / ZERO hallucinations.
 */
export function evaluateNextBestActions(ctx: NBAEvaluationContext): GeneratedNBACandidate[] {
  const candidates: GeneratedNBACandidate[] = [];
  const now = new Date();
  const customerId = ctx.customer.id;
  const customerCode = ctx.customer.customerCode || `CUST-${customerId}`;

  // Helper date calculations
  const daysDiff = (d1: Date, d2: Date) =>
    Math.floor(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));

  // Compute aggregate financial balances
  let totalCasaBalance = 0;
  ctx.accounts.forEach((acc) => {
    const bal = Number(acc.balance?.availableBalance || acc.availableBalance || 0);
    totalCasaBalance += isNaN(bal) ? 0 : bal;
  });

  const relVal = Number(ctx.customer.relationshipValue || 0);
  const activeProductsCount = ctx.products?.length || ctx.accounts?.length || 0;
  const coreScoreValue = ctx.score ? Number(ctx.score.totalScore || 0) : 70;

  // Open Service Cases
  const openCases = ctx.cases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');

  // Check for critical / breached / at-risk service grievances
  const breachedCases = openCases.filter((c) => {
    if (c.slaBreached) return true;
    if (c.slaDeadline && new Date(c.slaDeadline).getTime() < now.getTime()) return true;
    return false;
  });

  const impendingCases = openCases.filter((c) => {
    if (breachedCases.some((b) => b.id === c.id)) return false;
    if (!c.slaDeadline) return false;
    const deadline = new Date(c.slaDeadline).getTime();
    const hoursLeft = (deadline - now.getTime()) / (1000 * 3600);
    return (c.priority === 'HIGH' || c.priority === 'CRITICAL') && hoursLeft > 0 && hoursLeft <= 48;
  });

  // Flag: Service friction exists (Enforces the Service-First Principle)
  const hasCriticalServiceFriction = breachedCases.length > 0 || impendingCases.length > 0;
  const hasAnyOpenServiceCase = openCases.length > 0;

  // -------------------------------------------------------------------------
  // RULE 1: NBA-SERVICE-001 — Resolve SLA-Risk or Breached Service Case
  // -------------------------------------------------------------------------
  if (breachedCases.length > 0) {
    const topCase = breachedCases[0];
    const evidence: ActionEvidence[] = breachedCases.map((c) => ({
      sourceEntityType: 'CASE',
      sourceEntityId: c.id,
      sourceEntityCode: c.caseNumber || `CAS-${c.id}`,
      recordTitle: c.title,
      evidenceSummary: `Case ${c.caseNumber} breached SLA on ${new Date(c.slaDeadline).toLocaleDateString('en-IN')}`,
      detail: `Priority: ${c.priority} | Category: ${c.category} | Status: ${c.status}. Turnaround buffer exceeded.`,
      timestamp: c.createdAt,
      routePath: '/service-desk',
    }));

    candidates.push({
      dedupKey: `${customerId}:NBA-SERVICE-001:CASE:${topCase.id}`,
      customerId,
      actionId: `NBA-SVC-BRCH-${customerId}-${topCase.id}`,
      actionType: 'SERVICE',
      category: 'SLA_BREACH_RESOLUTION',
      title: `Resolve breached service grievance: ${topCase.caseNumber}`,
      description: `Case ${topCase.caseNumber} ('${topCase.title}') has breached its statutory resolution SLA. Immediate escalation and customer redress required.`,
      priority: 'CRITICAL',
      urgency: 'IMMEDIATE',
      rationale: `Customer has an active unresolved grievance exceeding maximum turnaround limits. Resolving service failures takes priority over commercial cross-selling.`,
      expectedImpact: `Protect relationship health, prevent formal Banking Ombudsman escalation, and arrest customer dissatisfaction.`,
      confidence: 'HIGH',
      confidenceScore: 0.98,
      rankScore: 1650, // Base 1000 + Immediate 400 + Service Bonus 250
      ruleId: 'NBA-SERVICE-001',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'CASE',
      sourceEntityId: String(topCase.id),
      sourceEntityCode: topCase.caseNumber,
      evidence,
      actionRoute: '/service-desk',
      targetEntityContext: JSON.stringify({
        caseId: topCase.id,
        caseNumber: topCase.caseNumber,
        title: topCase.title,
        priority: topCase.priority,
        suggestedTaskTitle: `Expedite resolution for breached case ${topCase.caseNumber}`,
      }),
    });
  } else if (impendingCases.length > 0) {
    const topCase = impendingCases[0];
    const deadline = new Date(topCase.slaDeadline);
    const hoursLeft = Math.max(1, Math.round((deadline.getTime() - now.getTime()) / (1000 * 3600)));

    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'CASE',
        sourceEntityId: topCase.id,
        sourceEntityCode: topCase.caseNumber || `CAS-${topCase.id}`,
        recordTitle: topCase.title,
        evidenceSummary: `Case ${topCase.caseNumber} has ~${hoursLeft}h left before SLA breach`,
        detail: `Priority: ${topCase.priority} | SLA Deadline: ${deadline.toLocaleString('en-IN')}. Status: ${topCase.status}.`,
        timestamp: topCase.createdAt,
        routePath: '/service-desk',
      },
    ];

    candidates.push({
      dedupKey: `${customerId}:NBA-SERVICE-001:CASE:${topCase.id}`,
      customerId,
      actionId: `NBA-SVC-RISK-${customerId}-${topCase.id}`,
      actionType: 'SERVICE',
      category: 'SLA_RISK_RESOLUTION',
      title: `Expedite resolution of high-priority case (${hoursLeft}h before SLA breach)`,
      description: `High-priority grievance ${topCase.caseNumber} is approaching its SLA deadline. Swift intervention prevents statutory non-compliance.`,
      priority: 'HIGH',
      urgency: hoursLeft <= 24 ? 'IMMEDIATE' : 'TODAY',
      rationale: `Customer's high-severity service case is within 48 hours of benchmark SLA expiration.`,
      expectedImpact: `Ensure on-time service delivery and maintain institutional SLA compliance benchmarks.`,
      confidence: 'HIGH',
      confidenceScore: 0.95,
      rankScore: 1150, // Base 500 + Urgency 400 + Service Bonus 250
      ruleId: 'NBA-SERVICE-001',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'CASE',
      sourceEntityId: String(topCase.id),
      sourceEntityCode: topCase.caseNumber,
      evidence,
      actionRoute: '/service-desk',
      targetEntityContext: JSON.stringify({
        caseId: topCase.id,
        caseNumber: topCase.caseNumber,
        title: topCase.title,
        hoursLeft,
        suggestedTaskTitle: `Follow up on SLA-risk case ${topCase.caseNumber}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 2: NBA-TASK-001 — Complete Overdue Customer Follow-Up
  // -------------------------------------------------------------------------
  const overdueTasks = ctx.tasks.filter((t) => {
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate).getTime() < now.getTime();
  });

  if (overdueTasks.length > 0) {
    const topTask = overdueTasks[0];
    const daysOverdue = daysDiff(now, new Date(topTask.dueDate));
    const isHighValue = relVal >= 1000000 || totalCasaBalance >= 500000;

    const evidence: ActionEvidence[] = overdueTasks.map((t) => ({
      sourceEntityType: 'TASK',
      sourceEntityId: t.id,
      sourceEntityCode: t.taskCode || `TSK-${t.id}`,
      recordTitle: t.title,
      evidenceSummary: `Task scheduled for ${new Date(t.dueDate).toLocaleDateString('en-IN')} is overdue`,
      detail: `Priority: ${t.priority} | Assigned: ${t.assignedToName || 'Officer'}. Status: ${t.status}.`,
      timestamp: t.dueDate,
      routePath: '/tasks',
    }));

    const isCritical = topTask.priority === 'CRITICAL' || (daysOverdue >= 3 && isHighValue);

    candidates.push({
      dedupKey: `${customerId}:NBA-TASK-001:TASK:${topTask.id}`,
      customerId,
      actionId: `NBA-TSK-OVD-${customerId}-${topTask.id}`,
      actionType: 'TASK',
      category: 'OVERDUE_FOLLOWUP',
      title: `Complete overdue customer follow-up: ${topTask.title}`,
      description: `Follow-up task '${topTask.title}' was scheduled for ${new Date(topTask.dueDate).toLocaleDateString('en-IN')} (${daysOverdue} days overdue).`,
      priority: isCritical ? 'CRITICAL' : 'HIGH',
      urgency: daysOverdue >= 2 ? 'IMMEDIATE' : 'TODAY',
      rationale: `Officer task commitment for ${ctx.customer.name} has passed its scheduled date without recorded completion.`,
      expectedImpact: `Close open operational loops, preserve client trust, and prevent servicing bottlenecks.`,
      confidence: 'HIGH',
      confidenceScore: 0.94,
      rankScore: isCritical ? 1300 : 850 + Math.min(100, daysOverdue * 20),
      ruleId: 'NBA-TASK-001',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'TASK',
      sourceEntityId: String(topTask.id),
      sourceEntityCode: topTask.taskCode,
      evidence,
      actionRoute: '/tasks',
      targetEntityContext: JSON.stringify({
        taskId: topTask.id,
        taskTitle: topTask.title,
        daysOverdue,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 3: NBA-OPP-001 — Opportunity Approaching Target Close Date
  // -------------------------------------------------------------------------
  const openOpps = ctx.opportunities.filter((o) => o.status === 'OPEN');
  const closingSoonOpps = openOpps.filter((o) => {
    if (!o.expectedCloseDate) return false;
    const closeDate = new Date(o.expectedCloseDate).getTime();
    const daysLeft = (closeDate - now.getTime()) / (1000 * 3600 * 24);
    const prob = Number(o.probability || 0);
    return daysLeft >= 0 && daysLeft <= 10 && prob >= 50;
  });

  if (closingSoonOpps.length > 0) {
    const opp = closingSoonOpps[0];
    const daysLeft = Math.ceil((new Date(opp.expectedCloseDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
    const val = Number(opp.expectedValue || 0);

    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'OPPORTUNITY',
        sourceEntityId: opp.id,
        sourceEntityCode: opp.opportunityCode || `OPP-${opp.id}`,
        recordTitle: opp.title,
        evidenceSummary: `Opportunity ${opp.opportunityCode} target close in ${daysLeft} days`,
        detail: `Stage: ${opp.stage} | Expected Value: ₹${val.toLocaleString('en-IN')} | Probability: ${opp.probability}%.`,
        timestamp: opp.expectedCloseDate,
        metricValue: val,
        routePath: '/opportunities',
      },
    ];

    // Priority adjusted based on value and whether service friction exists
    const isCriticalVal = val >= 2500000;
    const priority: ActionPriority = isCriticalVal ? 'HIGH' : 'MEDIUM';
    const urgency: ActionUrgency = daysLeft <= 3 ? 'IMMEDIATE' : 'SOON';

    // Service-First Principle adjustment: If client has critical service issues, demote opportunity follow-up
    const servicePenalty = hasCriticalServiceFriction ? -400 : 0;
    const oppBonus = Math.min(200, Math.round((val / 100000) * (Number(opp.probability || 50) / 100)));

    candidates.push({
      dedupKey: `${customerId}:NBA-OPP-001:OPPORTUNITY:${opp.id}`,
      customerId,
      actionId: `NBA-OPP-CLOSE-${customerId}-${opp.id}`,
      actionType: 'OPPORTUNITY',
      category: 'OPPORTUNITY_CLOSING_SOON',
      title: `Advance opportunity toward closure: ${opp.title}`,
      description: `Opportunity ${opp.opportunityCode} (₹${val.toLocaleString('en-IN')}) is in '${opp.stage}' with expected close date on ${new Date(opp.expectedCloseDate).toLocaleDateString('en-IN')} (${daysLeft} days left).`,
      priority,
      urgency,
      rationale: `High-probability deal (${opp.probability}%) is nearing its target close date. Proactive outreach secures final terms and documentation.`,
      expectedImpact: `Convert active pipeline deal into realized branch loan balance and fee revenue.`,
      confidence: 'HIGH',
      confidenceScore: 0.93,
      rankScore: (priority === 'HIGH' ? 650 : 350) + oppBonus + servicePenalty,
      ruleId: 'NBA-OPP-001',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: String(opp.id),
      sourceEntityCode: opp.opportunityCode,
      evidence,
      actionRoute: '/opportunities',
      targetEntityContext: JSON.stringify({
        opportunityId: opp.id,
        opportunityCode: opp.opportunityCode,
        title: opp.title,
        expectedValue: val,
        suggestedTaskTitle: `Finalize documents for closing opportunity ${opp.opportunityCode}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 4: NBA-OPP-002 — Stalled Commercial Opportunity
  // -------------------------------------------------------------------------
  const stagnantOpps = openOpps.filter((o) => {
    if (closingSoonOpps.some((c) => c.id === o.id)) return false;
    const updateTime = new Date(o.updatedAt || o.createdAt).getTime();
    const daysIdle = (now.getTime() - updateTime) / (1000 * 3600 * 24);
    return daysIdle >= 21 && o.stage !== 'PROPOSAL_SENT';
  });

  if (stagnantOpps.length > 0) {
    const opp = stagnantOpps[0];
    const updateTime = new Date(opp.updatedAt || opp.createdAt);
    const daysIdle = Math.round((now.getTime() - updateTime.getTime()) / (1000 * 3600 * 24));
    const val = Number(opp.expectedValue || 0);

    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'OPPORTUNITY',
        sourceEntityId: opp.id,
        sourceEntityCode: opp.opportunityCode || `OPP-${opp.id}`,
        recordTitle: opp.title,
        evidenceSummary: `Opportunity ${opp.opportunityCode} stagnant for ${daysIdle} days`,
        detail: `Current Stage: '${opp.stage}' | Expected Value: ₹${val.toLocaleString('en-IN')}. Last updated: ${updateTime.toLocaleDateString('en-IN')}.`,
        timestamp: opp.updatedAt || opp.createdAt,
        metricValue: val,
        routePath: '/opportunities',
      },
    ];

    const servicePenalty = hasCriticalServiceFriction ? -400 : 0;

    candidates.push({
      dedupKey: `${customerId}:NBA-OPP-002:OPPORTUNITY:${opp.id}`,
      customerId,
      actionId: `NBA-OPP-STAG-${customerId}-${opp.id}`,
      actionType: 'OPPORTUNITY',
      category: 'STALLED_OPPORTUNITY',
      title: `Follow up on stalled opportunity: ${opp.title}`,
      description: `Opportunity ${opp.opportunityCode} has remained in stage '${opp.stage}' for ${daysIdle} days without recorded activity or stage advancement.`,
      priority: val >= 1000000 ? 'HIGH' : 'MEDIUM',
      urgency: 'SOON',
      rationale: `Deal has remained stagnant for ${daysIdle} days. Relationship manager should follow up with the customer to re-engage or update qualification.`,
      expectedImpact: `Prevent pipeline decay, validate client requirement, or qualify out stalled opportunities.`,
      confidence: 'HIGH',
      confidenceScore: 0.90,
      rankScore: 350 + (val >= 1000000 ? 150 : 0) + servicePenalty,
      ruleId: 'NBA-OPP-002',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: String(opp.id),
      sourceEntityCode: opp.opportunityCode,
      evidence,
      actionRoute: '/opportunities',
      targetEntityContext: JSON.stringify({
        opportunityId: opp.id,
        opportunityCode: opp.opportunityCode,
        daysIdle,
        suggestedTaskTitle: `Re-engage customer regarding stalled opportunity ${opp.opportunityCode}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 5: NBA-ENG-001 — Engagement Decline & Prolonged Inactivity
  // -------------------------------------------------------------------------
  const recentInteractions = [...ctx.interactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const lastInteraction = recentInteractions[0];
  const daysSinceContact = lastInteraction ? daysDiff(now, new Date(lastInteraction.timestamp)) : 999;

  // Trigger if customer has meaningful balances (> ₹1 Lakh) or loans, but no contact in > 60 days
  if ((totalCasaBalance >= 100000 || ctx.loans.length > 0) && daysSinceContact >= 60) {
    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'INTERACTION',
        sourceEntityId: lastInteraction ? lastInteraction.id : 0,
        sourceEntityCode: lastInteraction ? (lastInteraction.interactionCode || `INT-${lastInteraction.id}`) : 'INT-NONE',
        recordTitle: lastInteraction ? `Last Touchpoint: ${lastInteraction.type}` : 'No Logged Contact History',
        evidenceSummary: `No interaction recorded in ${daysSinceContact} days`,
        detail: lastInteraction
          ? `Last logged discussion took place on ${new Date(lastInteraction.timestamp).toLocaleDateString('en-IN')}.`
          : 'Zero officer touchpoints recorded in institutional CRM history.',
        timestamp: lastInteraction?.timestamp,
        routePath: '/customers',
      },
      {
        sourceEntityType: 'ACCOUNT',
        sourceEntityId: ctx.accounts[0]?.id || 0,
        sourceEntityCode: ctx.accounts[0]?.accountNumber || customerCode,
        recordTitle: 'Relationship Value & Deposits',
        evidenceSummary: `Current CASA deposits: ₹${totalCasaBalance.toLocaleString('en-IN')}`,
        detail: `Total CASA deposits: ₹${totalCasaBalance.toLocaleString('en-IN')} across ${ctx.accounts.length} account(s).`,
        metricValue: totalCasaBalance,
        routePath: '/accounts',
      },
    ];

    const isHighVal = totalCasaBalance >= 1000000 || relVal >= 2000000;

    candidates.push({
      dedupKey: `${customerId}:NBA-ENG-001:CUSTOMER:${customerId}`,
      customerId,
      actionId: `NBA-ENG-DECL-${customerId}`,
      actionType: 'ENGAGEMENT',
      category: 'ENGAGEMENT_DECLINE',
      title: `Schedule relationship review: ${daysSinceContact > 365 ? '1+ year' : `${daysSinceContact} days`} since last contact`,
      description: `High-value customer has not had a recorded officer meeting, call, or relationship review in ${daysSinceContact} days.`,
      priority: isHighVal ? 'HIGH' : 'MEDIUM',
      urgency: daysSinceContact >= 120 ? 'TODAY' : 'SOON',
      rationale: `Customer maintains meaningful financial relationship (₹${totalCasaBalance.toLocaleString('en-IN')} in deposits) but lacks recent relationship touchpoints.`,
      expectedImpact: `Reinforce relationship loyalty, assess service satisfaction, and guard against deposit attrition to peer banks.`,
      confidence: 'HIGH',
      confidenceScore: 0.92,
      rankScore: (isHighVal ? 550 : 350) + (daysSinceContact >= 120 ? 100 : 50),
      ruleId: 'NBA-ENG-001',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: String(customerId),
      sourceEntityCode: customerCode,
      evidence,
      actionRoute: '/customers',
      targetEntityContext: JSON.stringify({
        daysSinceContact,
        totalBalance: totalCasaBalance,
        suggestedTaskTitle: `Schedule quarterly relationship review call with ${ctx.customer.name}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 6: NBA-REL-001 — CORE Score Deterioration / Health Warning
  // -------------------------------------------------------------------------
  if (ctx.score) {
    const totalScore = Number(ctx.score.totalScore || 0);
    const engScore = Number(ctx.score.engagementScore || 0);
    const srvScore = Number(ctx.score.serviceScore || 0);

    if (totalScore < 60 || engScore < 45 || srvScore < 45) {
      const weakestComponent = srvScore < 45 ? 'Service' : engScore < 45 ? 'Engagement' : 'Financial Health';

      const evidence: ActionEvidence[] = [
        {
          sourceEntityType: 'CORE_SCORE',
          sourceEntityId: ctx.score.id,
          sourceEntityCode: `SCORE-${customerId}`,
          recordTitle: `Overall CORE Score: ${totalScore}/100 (${ctx.score.relationshipBand || 'WATCHLIST'})`,
          evidenceSummary: `CORE Score depressed at ${totalScore}/100`,
          detail: `Financial Health: ${ctx.score.financialScore || 0} | Engagement: ${engScore} | Service: ${srvScore}.`,
          timestamp: ctx.score.updatedAt || ctx.score.createdAt,
          metricValue: totalScore,
          routePath: '/customers',
        },
      ];

      if (openCases.length > 0) {
        evidence.push({
          sourceEntityType: 'CASE',
          sourceEntityId: openCases[0].id,
          sourceEntityCode: openCases[0].caseNumber || `CAS-${openCases[0].id}`,
          recordTitle: openCases[0].title,
          evidenceSummary: `Open service grievance contributing to score decline`,
          detail: `Active case '${openCases[0].title}' impacting service health index.`,
          routePath: '/service-desk',
        });
      }

      const isCriticalScore = totalScore < 50;

      candidates.push({
        dedupKey: `${customerId}:NBA-REL-001:CORE_SCORE:${ctx.score.id}`,
        customerId,
        actionId: `NBA-REL-HEALTH-${customerId}-${ctx.score.id}`,
        actionType: 'RELATIONSHIP',
        category: 'SCORE_DECLINE',
        title: `Review relationship health (CORE Score: ${totalScore}/100)`,
        description: `Customer relationship band is '${ctx.score.relationshipBand || 'NEEDS_ATTENTION'}'. Weakness detected in ${weakestComponent} score component.`,
        priority: isCriticalScore ? 'CRITICAL' : 'HIGH',
        urgency: isCriticalScore ? 'IMMEDIATE' : 'SOON',
        rationale: `Customer CORE score has deteriorated into the warning zone. Prompt relationship audit required to identify friction drivers.`,
        expectedImpact: `Arrest relationship degradation, restore customer satisfaction, and protect portfolio retention.`,
        confidence: 'HIGH',
        confidenceScore: 0.96,
        rankScore: (isCriticalScore ? 1100 : 750) + (srvScore < 45 ? 100 : 50),
        ruleId: 'NBA-REL-001',
        ruleVersion: NBA_RULE_VERSION,
        sourceEntityType: 'CORE_SCORE',
        sourceEntityId: String(ctx.score.id),
        sourceEntityCode: `SCORE-${customerId}`,
        evidence,
        actionRoute: '/customers',
        targetEntityContext: JSON.stringify({
          totalScore,
          band: ctx.score.relationshipBand,
          suggestedTaskTitle: `Conduct relationship audit for ${ctx.customer.name} (CORE Score: ${totalScore})`,
        }),
      });
    }
  }

  // -------------------------------------------------------------------------
  // RULE 7: NBA-REL-002 — Relationship Momentum At Risk
  // -------------------------------------------------------------------------
  // Triggered when Relationship Intelligence reports MOMENTUM_AT_RISK or ENGAGEMENT_DECLINE, and no critical service issue
  const momentumInsight = ctx.insights.find(
    (ins) =>
      ins.status === 'ACTIVE' &&
      (ins.category === 'MOMENTUM_AT_RISK' ||
        ins.category === 'ENGAGEMENT_DECLINE' ||
        ins.category === 'OPERATIONAL_NEGLECT')
  );

  if (momentumInsight && !hasCriticalServiceFriction) {
    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'RELATIONSHIP_INTELLIGENCE',
        sourceEntityId: momentumInsight.id,
        sourceEntityCode: momentumInsight.insightId || `INS-${momentumInsight.id}`,
        recordTitle: momentumInsight.title,
        evidenceSummary: `Relationship Intelligence: ${momentumInsight.category}`,
        detail: momentumInsight.summary || momentumInsight.description,
        timestamp: momentumInsight.detectedAt || momentumInsight.createdAt,
        routePath: '/intelligence',
      },
    ];

    candidates.push({
      dedupKey: `${customerId}:NBA-REL-002:INSIGHT:${momentumInsight.id}`,
      customerId,
      actionId: `NBA-REL-MOMENTUM-${customerId}-${momentumInsight.id}`,
      actionType: 'RELATIONSHIP',
      category: 'MOMENTUM_STABILIZATION',
      title: `Re-engage customer to stabilize relationship momentum`,
      description: `Relationship momentum trajectory is under stress due to ${momentumInsight.title.toLowerCase()}. Proactive officer touchpoint recommended.`,
      priority: 'HIGH',
      urgency: 'TODAY',
      rationale: `Intelligence signal confirms deteriorating interaction cadence. Re-engagement restores confidence.`,
      expectedImpact: `Re-establish relationship momentum and uncover unmet client requirements.`,
      confidence: 'HIGH',
      confidenceScore: 0.91,
      rankScore: 680,
      ruleId: 'NBA-REL-002',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: String(customerId),
      sourceEntityCode: customerCode,
      evidence,
      actionRoute: '/customers',
      targetEntityContext: JSON.stringify({
        insightId: momentumInsight.id,
        suggestedTaskTitle: `Re-engagement call with ${ctx.customer.name}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 8: NBA-PROD-001 — Review Product Relationship Depth / Expansion
  // -------------------------------------------------------------------------
  // SERVICE-FIRST PRINCIPLE:
  // "Resolve relationship-damaging service problems before aggressive cross-selling."
  // Only evaluate product depth expansion if customer has NO active critical service friction.
  if (!hasCriticalServiceFriction && (totalCasaBalance >= 500000 || relVal >= 1000000) && activeProductsCount <= 2) {
    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'CUSTOMER',
        sourceEntityId: customerId,
        sourceEntityCode: customerCode,
        recordTitle: ctx.customer.name,
        evidenceSummary: `Relationship Value: ₹${relVal.toLocaleString('en-IN')}`,
        detail: `Net CASA Balances: ₹${totalCasaBalance.toLocaleString('en-IN')} across ${ctx.accounts.length} account(s).`,
        metricValue: relVal,
        routePath: '/customers',
      },
      {
        sourceEntityType: 'ACCOUNT',
        sourceEntityId: ctx.accounts[0]?.id || 0,
        sourceEntityCode: ctx.accounts[0]?.accountNumber || 'CASA',
        recordTitle: 'Product Penetration Depth',
        evidenceSummary: `Customer holds only ${activeProductsCount} active product(s)`,
        detail: `Lacks Term Deposits, Mutual Fund SIP, or Credit facilities despite substantial liquidity surplus.`,
        metricValue: activeProductsCount,
        routePath: '/products',
      },
    ];

    candidates.push({
      dedupKey: `${customerId}:NBA-PROD-001:CUSTOMER:${customerId}`,
      customerId,
      actionId: `NBA-PROD-DEPTH-${customerId}`,
      actionType: 'PRODUCT',
      category: 'PRODUCT_DEPTH_EXPANSION',
      title: `Review relationship expansion opportunity (Product Depth Gap)`,
      description: `Customer maintains ₹${totalCasaBalance.toLocaleString('en-IN')} in surplus CASA liquidity with only ${activeProductsCount} product(s). Propose structured Term Deposit or Wealth advisory.`,
      priority: totalCasaBalance >= 1500000 ? 'HIGH' : 'MEDIUM',
      urgency: 'SOON',
      rationale: `Substantial surplus liquidity with zero active service friction represents prime institutional cross-sell potential.`,
      expectedImpact: `Lock in sticky retail deposits, enhance fee income, and deepen client retention.`,
      confidence: 'HIGH',
      confidenceScore: 0.92,
      rankScore: totalCasaBalance >= 1500000 ? 520 : 380,
      ruleId: 'NBA-PROD-001',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: String(customerId),
      sourceEntityCode: customerCode,
      evidence,
      actionRoute: '/products',
      targetEntityContext: JSON.stringify({
        totalBalance: totalCasaBalance,
        activeProductsCount,
        suggestedProductType: 'TERM_DEPOSIT_OR_WEALTH',
        suggestedTaskTitle: `Discuss Term Deposit and Wealth advisory options with ${ctx.customer.name}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 9: NBA-SERVICE-002 — Follow Up on Unresolved Service Case
  // -------------------------------------------------------------------------
  const unresolvedStaleCases = openCases.filter((c) => {
    if (breachedCases.some((b) => b.id === c.id) || impendingCases.some((i) => i.id === c.id)) return false;
    const caseAgeDays = (now.getTime() - new Date(c.createdAt).getTime()) / (1000 * 3600 * 24);
    return caseAgeDays >= 4;
  });

  if (unresolvedStaleCases.length > 0) {
    const topCase = unresolvedStaleCases[0];
    const caseAgeDays = Math.round((now.getTime() - new Date(topCase.createdAt).getTime()) / (1000 * 3600 * 24));

    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'CASE',
        sourceEntityId: topCase.id,
        sourceEntityCode: topCase.caseNumber || `CAS-${topCase.id}`,
        recordTitle: topCase.title,
        evidenceSummary: `Case ${topCase.caseNumber} pending for ${caseAgeDays} days`,
        detail: `Status: ${topCase.status} | Priority: ${topCase.priority} | Filed: ${new Date(topCase.createdAt).toLocaleDateString('en-IN')}.`,
        timestamp: topCase.createdAt,
        routePath: '/service-desk',
      },
    ];

    candidates.push({
      dedupKey: `${customerId}:NBA-SERVICE-002:CASE:${topCase.id}`,
      customerId,
      actionId: `NBA-SVC-STALE-${customerId}-${topCase.id}`,
      actionType: 'SERVICE',
      category: 'UNRESOLVED_CASE_FOLLOWUP',
      title: `Follow up on unresolved service case: ${topCase.caseNumber}`,
      description: `Service grievance '${topCase.title}' has been open for ${caseAgeDays} days in status '${topCase.status}'. Officer check-in required.`,
      priority: 'MEDIUM',
      urgency: 'TODAY',
      rationale: `Customer inquiry is open without final resolution. A status update reassures the customer.`,
      expectedImpact: `Improve resolution velocity and keep customer informed.`,
      confidence: 'HIGH',
      confidenceScore: 0.90,
      rankScore: 480,
      ruleId: 'NBA-SERVICE-002',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'CASE',
      sourceEntityId: String(topCase.id),
      sourceEntityCode: topCase.caseNumber,
      evidence,
      actionRoute: '/service-desk',
      targetEntityContext: JSON.stringify({
        caseId: topCase.id,
        caseNumber: topCase.caseNumber,
        suggestedTaskTitle: `Check operational status of case ${topCase.caseNumber}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // RULE 10: NBA-ENG-002 — Periodic Relationship Review for Top-Tier Account
  // -------------------------------------------------------------------------
  if (
    !hasAnyOpenServiceCase &&
    relVal >= 1500000 &&
    activeProductsCount >= 3 &&
    daysSinceContact >= 45 &&
    !candidates.some((c) => c.actionType === 'ENGAGEMENT')
  ) {
    const evidence: ActionEvidence[] = [
      {
        sourceEntityType: 'CUSTOMER',
        sourceEntityId: customerId,
        sourceEntityCode: customerCode,
        recordTitle: ctx.customer.name,
        evidenceSummary: `High Relationship Value: ₹${relVal.toLocaleString('en-IN')}`,
        detail: `Tier-1 relationship with ${activeProductsCount} products. No active service issues.`,
        metricValue: relVal,
        routePath: '/customers',
      },
    ];

    candidates.push({
      dedupKey: `${customerId}:NBA-ENG-002:CUSTOMER:${customerId}`,
      customerId,
      actionId: `NBA-ENG-REV-${customerId}`,
      actionType: 'ENGAGEMENT',
      category: 'PERIODIC_REVIEW',
      title: `Schedule annual portfolio & credit relationship review`,
      description: `High-value customer has a strong clean relationship and is due for routine annual portfolio review.`,
      priority: 'LOW',
      urgency: 'PLANNED',
      rationale: `Healthy multi-product corporate/retail relationship due for periodic strategic review.`,
      expectedImpact: `Deepen wallet share and consolidate overall banking relationship.`,
      confidence: 'HIGH',
      confidenceScore: 0.88,
      rankScore: 220,
      ruleId: 'NBA-ENG-002',
      ruleVersion: NBA_RULE_VERSION,
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: String(customerId),
      sourceEntityCode: customerCode,
      evidence,
      actionRoute: '/customers',
      targetEntityContext: JSON.stringify({
        suggestedTaskTitle: `Annual portfolio review with ${ctx.customer.name}`,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // 6. OPPORTUNITY RADAR INTEGRATION: Evidence-Backed Signals (Phase 12)
  // -------------------------------------------------------------------------
  if (ctx.radarSignals && ctx.radarSignals.length > 0 && !hasCriticalServiceFriction) {
    const topRadar = ctx.radarSignals
      .filter((s) => s.status === 'DETECTED' || s.status === 'REVIEW_SUGGESTED')
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))[0];

    if (topRadar && (topRadar.relevanceScore || 0) >= 70) {
      const radarEvidence: ActionEvidence[] = (topRadar.evidence || []).map((ev: any) => ({
        sourceEntityType: ev.sourceEntityType || 'RADAR',
        sourceEntityId: String(ev.sourceEntityId || topRadar.id),
        sourceEntityCode: ev.sourceEntityCode || topRadar.radarId,
        recordTitle: ev.recordTitle || topRadar.title,
        evidenceType: ev.evidenceType || 'RADAR_SIGNAL',
        evidenceSummary: ev.evidenceSummary || topRadar.summary,
        detail: ev.detail || topRadar.rationale,
        metricValue: ev.metricValue || `${topRadar.relevanceScore}% Relevance`,
        routePath: '/opportunity-radar',
      }));

      candidates.push({
        dedupKey: `${customerId}:NBA-RADAR-001:${topRadar.radarId}`,
        customerId,
        actionId: `NBA-RADAR-${topRadar.radarId}`,
        actionType: 'OPPORTUNITY',
        category: topRadar.category || 'OPPORTUNITY_RADAR',
        title: `Review Opportunity Radar: ${topRadar.title}`,
        description: topRadar.summary,
        priority: topRadar.priority === 'CRITICAL' ? 'CRITICAL' : topRadar.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        urgency: topRadar.priority === 'HIGH' ? 'SOON' : 'PLANNED',
        rationale: topRadar.rationale,
        expectedImpact: `Convert evidence-backed relationship gap into qualified banking opportunity (${topRadar.expectedValueBand || 'High Value'}).`,
        confidence: topRadar.confidence || 'HIGH',
        confidenceScore: (topRadar.relevanceScore || 75) / 100,
        rankScore: 280 + Math.floor((topRadar.relevanceScore || 70) / 2),
        ruleId: 'NBA-RADAR-001',
        ruleVersion: NBA_RULE_VERSION,
        sourceEntityType: 'RADAR',
        sourceEntityId: String(topRadar.id),
        sourceEntityCode: topRadar.radarId,
        evidence: radarEvidence,
        actionRoute: '/opportunity-radar',
        targetEntityContext: JSON.stringify({
          radarId: topRadar.id,
          radarCode: topRadar.radarId,
          targetProduct: topRadar.targetProductName,
        }),
      });
    }
  }

  // -------------------------------------------------------------------------
  // DETERMINISTIC RANKING ENGINE & CONFLICT RESOLUTION
  // -------------------------------------------------------------------------
  // 1. Sort by rankScore in descending order
  candidates.sort((a, b) => b.rankScore - a.rankScore);

  // 2. Select Top Recommendation (#1)
  if (candidates.length > 0) {
    // Return max 5 actions total (1 top + max 4 other actions)
    return candidates.slice(0, 5);
  }

  return candidates;
}
