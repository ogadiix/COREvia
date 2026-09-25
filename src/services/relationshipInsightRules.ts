import type {
  CustomerInsight,
  InsightType,
  InsightCategory,
  InsightPriority,
  InsightConfidence,
  InsightEvidence,
  SourceEntityType,
} from '../types/index.ts';

export interface RuleEvaluationContext {
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
}

export interface GeneratedInsightCandidate {
  dedupKey: string;
  customerId: number;
  insightId: string;
  insightType: InsightType;
  category: InsightCategory;
  title: string;
  summary: string;
  description: string;
  impact: string;
  priority: InsightPriority;
  confidence: InsightConfidence;
  confidenceScore: number;
  sourceEntityType: SourceEntityType;
  sourceEntityId: string;
  evidence: InsightEvidence[];
  recommendedActionType: string;
  recommendedActionContext: string;
  ruleVersion: string;
}

export const RULE_VERSION = 'RI-v1';

/**
 * Deterministic Relationship Intelligence Rules Engine
 * Generates structured, explainable insights strictly from verified CRM data.
 * Zero LLM / Zero hallucinations.
 */
export function evaluateRulesForCustomer(ctx: RuleEvaluationContext): GeneratedInsightCandidate[] {
  const insights: GeneratedInsightCandidate[] = [];
  const now = new Date();
  const customerId = ctx.customer.id;
  const customerCode = ctx.customer.customerCode || `CUST-${customerId}`;

  // Helper to compute days difference
  const daysDiff = (d1: Date, d2: Date) => Math.floor(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));

  // Compute aggregate financial balances
  let totalCasaBalance = 0;
  ctx.accounts.forEach((acc) => {
    const bal = Number(acc.balance?.availableBalance || acc.availableBalance || 0);
    totalCasaBalance += isNaN(bal) ? 0 : bal;
  });

  const relVal = Number(ctx.customer.relationshipValue || 0);
  const activeProductsCount = ctx.products?.length || ctx.accounts?.length || 0;

  // ----------------------------------------------------
  // RULE 1: SERVICE DETERIORATION & SLA BREACH
  // ----------------------------------------------------
  const openCases = ctx.cases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const breachedCases = openCases.filter((c) => {
    if (c.slaBreached) return true;
    if (c.slaDeadline && new Date(c.slaDeadline).getTime() < now.getTime()) return true;
    return false;
  });

  if (breachedCases.length > 0) {
    const evidence: InsightEvidence[] = breachedCases.map((c) => ({
      sourceType: 'CASE',
      sourceId: c.id,
      sourceCode: c.caseNumber || `CAS-${c.id}`,
      recordTitle: c.title,
      detail: `Priority: ${c.priority} | Category: ${c.category} | SLA Deadline: ${new Date(c.slaDeadline).toLocaleDateString('en-IN')}. Case remains open past statutory SLA buffer.`,
      timestamp: c.createdAt,
      routePath: '/service-desk',
    }));

    const isCritical = breachedCases.some((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH') || breachedCases.length >= 2;

    insights.push({
      dedupKey: `${customerId}:SLA_BREACHED:CASE:${breachedCases[0].id}`,
      customerId,
      insightId: `INS-SLA-${customerId}-${breachedCases[0].id}`,
      insightType: 'SERVICE_CONCERN',
      category: 'SLA_BREACHED',
      title: `${breachedCases.length} service grievance(s) have breached turnaround SLA`,
      summary: `Customer has ${breachedCases.length} open service case(s) where turnaround benchmark was exceeded. Immediate resolution required.`,
      description: `Active case ${breachedCases[0].caseNumber} (${breachedCases[0].title}) failed to meet mandated SLA deadline of ${new Date(breachedCases[0].slaDeadline).toLocaleDateString('en-IN')}.`,
      impact: 'Escalation risks regulatory complaint under RBI Banking Ombudsman scheme and causes client relationship dissatisfaction.',
      priority: isCritical ? 'CRITICAL' : 'HIGH',
      confidence: 'HIGH',
      confidenceScore: 0.98,
      sourceEntityType: 'CASE',
      sourceEntityId: String(breachedCases[0].id),
      evidence,
      recommendedActionType: 'RESOLVE_CASE',
      recommendedActionContext: JSON.stringify({ caseId: breachedCases[0].id, caseNumber: breachedCases[0].caseNumber }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 2: SERVICE CONCERN — HIGH-PRIORITY CASE APPROACHING SLA BREACH
  // ----------------------------------------------------
  const impendingBreachCases = openCases.filter((c) => {
    if (breachedCases.some((b) => b.id === c.id)) return false;
    if (!c.slaDeadline) return false;
    const deadline = new Date(c.slaDeadline).getTime();
    const hoursLeft = (deadline - now.getTime()) / (1000 * 3600);
    return (c.priority === 'HIGH' || c.priority === 'CRITICAL') && hoursLeft > 0 && hoursLeft <= 48;
  });

  if (impendingBreachCases.length > 0) {
    const topCase = impendingBreachCases[0];
    const deadline = new Date(topCase.slaDeadline);
    const hoursLeft = Math.max(1, Math.round((deadline.getTime() - now.getTime()) / (1000 * 3600)));

    const evidence: InsightEvidence[] = impendingBreachCases.map((c) => ({
      sourceType: 'CASE',
      sourceId: c.id,
      sourceCode: c.caseNumber || `CAS-${c.id}`,
      recordTitle: c.title,
      detail: `Case ${c.caseNumber} is in status '${c.status}'. SLA breach imminent in ~${hoursLeft} hours.`,
      timestamp: c.createdAt,
      routePath: '/service-desk',
    }));

    insights.push({
      dedupKey: `${customerId}:SLA_AT_RISK:CASE:${topCase.id}`,
      customerId,
      insightId: `INS-SLARISK-${customerId}-${topCase.id}`,
      insightType: 'SERVICE_CONCERN',
      category: 'SLA_AT_RISK',
      title: `High-priority grievance approaching SLA breach deadline (${hoursLeft}h left)`,
      summary: `Urgent case ${topCase.caseNumber} has less than 48 hours remaining before SLA breach.`,
      description: `Service grievance '${topCase.title}' assigned to service desk requires immediate handling before SLA deadline (${deadline.toLocaleString('en-IN')}).`,
      impact: 'Preventative resolution protects branch quality metrics and prevents formal customer complaint escalation.',
      priority: 'HIGH',
      confidence: 'HIGH',
      confidenceScore: 0.94,
      sourceEntityType: 'CASE',
      sourceEntityId: String(topCase.id),
      evidence,
      recommendedActionType: 'RESOLVE_CASE',
      recommendedActionContext: JSON.stringify({ caseId: topCase.id, caseNumber: topCase.caseNumber }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 3: REPEATED ISSUE CATEGORY
  // ----------------------------------------------------
  const categoryCounts: Record<string, any[]> = {};
  ctx.cases.forEach((c) => {
    const cat = c.category || 'GENERAL';
    if (!categoryCounts[cat]) categoryCounts[cat] = [];
    categoryCounts[cat].push(c);
  });

  for (const [cat, catCases] of Object.entries(categoryCounts)) {
    if (catCases.length >= 2) {
      const evidence: InsightEvidence[] = catCases.slice(0, 4).map((c) => ({
        sourceType: 'CASE',
        sourceId: c.id,
        sourceCode: c.caseNumber || `CAS-${c.id}`,
        recordTitle: c.title,
        detail: `Issue filed: ${new Date(c.createdAt).toLocaleDateString('en-IN')}. Status: ${c.status}. Priority: ${c.priority}.`,
        timestamp: c.createdAt,
        routePath: '/service-desk',
      }));

      insights.push({
        dedupKey: `${customerId}:REPEATED_ISSUE:CASE_CAT:${cat}`,
        customerId,
        insightId: `INS-REPCAT-${customerId}-${cat.replace(/\s+/g, '')}`,
        insightType: 'SERVICE_CONCERN',
        category: 'REPEATED_ISSUE',
        title: `Repeated service friction: ${catCases.length} cases in '${cat}' category`,
        summary: `Customer has encountered multiple repeated issues in '${cat}'. Potential operational pattern.`,
        description: `Persistent grievances in '${cat}' indicate systemic process bottleneck or recurring operational friction for this account.`,
        impact: 'Repeated friction in a single banking area is a leading indicator of relationship churn.',
        priority: catCases.some((c) => c.status !== 'RESOLVED') ? 'HIGH' : 'MEDIUM',
        confidence: 'HIGH',
        confidenceScore: 0.92,
        sourceEntityType: 'CASE',
        sourceEntityId: String(catCases[0].id),
        evidence,
        recommendedActionType: 'RESOLVE_CASE',
        recommendedActionContext: JSON.stringify({ category: cat, totalCases: catCases.length }),
        ruleVersion: RULE_VERSION,
      });
      break; // Emit one repeated category per customer to avoid noise
    }
  }

  // ----------------------------------------------------
  // RULE 4: OVERDUE CUSTOMER TASKS & OFFICER NEGLECT
  // ----------------------------------------------------
  const overdueTasks = ctx.tasks.filter((t) => {
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
    if (!t.dueDate) return false;
    return new Date(t.dueDate).getTime() < now.getTime();
  });

  if (overdueTasks.length > 0) {
    const topTask = overdueTasks[0];
    const evidence: InsightEvidence[] = overdueTasks.map((t) => ({
      sourceType: 'TASK',
      sourceId: t.id,
      sourceCode: t.taskCode || `TSK-${t.id}`,
      recordTitle: t.title,
      detail: `Due Date: ${new Date(t.dueDate).toLocaleDateString('en-IN')} (Overdue). Priority: ${t.priority}. Assigned to: ${t.assignedToName || 'Officer'}.`,
      timestamp: t.dueDate,
      routePath: '/tasks',
    }));

    const isHighPriority = overdueTasks.some((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL') || overdueTasks.length >= 2;

    insights.push({
      dedupKey: `${customerId}:TASK_OVERDUE:TASK:${topTask.id}`,
      customerId,
      insightId: `INS-TSKOVD-${customerId}-${topTask.id}`,
      insightType: 'OPERATIONAL_SIGNAL',
      category: 'TASK_OVERDUE',
      title: `${overdueTasks.length} officer follow-up task(s) past due date`,
      summary: `Customer has ${overdueTasks.length} pending task(s) that have passed their committed completion dates.`,
      description: `Task '${topTask.title}' was scheduled for ${new Date(topTask.dueDate).toLocaleDateString('en-IN')} but has not been finalized.`,
      impact: 'Delayed follow-ups degrade customer trust and risk missing regulatory or transaction closing windows.',
      priority: isHighPriority ? 'HIGH' : 'MEDIUM',
      confidence: 'HIGH',
      confidenceScore: 0.95,
      sourceEntityType: 'TASK',
      sourceEntityId: String(topTask.id),
      evidence,
      recommendedActionType: 'COMPLETE_TASK',
      recommendedActionContext: JSON.stringify({ taskId: topTask.id, taskTitle: topTask.title }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 5: MULTIPLE PENDING OPERATIONAL TASKS
  // ----------------------------------------------------
  const pendingTasks = ctx.tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  if (pendingTasks.length >= 3 && overdueTasks.length === 0) {
    const evidence: InsightEvidence[] = pendingTasks.slice(0, 4).map((t) => ({
      sourceType: 'TASK',
      sourceId: t.id,
      sourceCode: t.taskCode || `TSK-${t.id}`,
      recordTitle: t.title,
      detail: `Scheduled: ${new Date(t.dueDate).toLocaleDateString('en-IN')}. Priority: ${t.priority}. Status: ${t.status}.`,
      timestamp: t.dueDate,
      routePath: '/tasks',
    }));

    insights.push({
      dedupKey: `${customerId}:MULTIPLE_PENDING_TASKS:TASK:${pendingTasks[0].id}`,
      customerId,
      insightId: `INS-TSKBACKLOG-${customerId}-${pendingTasks[0].id}`,
      insightType: 'OPERATIONAL_SIGNAL',
      category: 'MULTIPLE_PENDING_TASKS',
      title: `Operational backlog: ${pendingTasks.length} incomplete tasks pending`,
      summary: `Customer has accumulated multiple open operational tasks awaiting relationship officer action.`,
      description: `Pending queue includes ${pendingTasks.length} items across compliance, onboarding, or client servicing.`,
      impact: 'Backlog slows customer onboarding and delays fee-generating service execution.',
      priority: 'MEDIUM',
      confidence: 'HIGH',
      confidenceScore: 0.88,
      sourceEntityType: 'TASK',
      sourceEntityId: String(pendingTasks[0].id),
      evidence,
      recommendedActionType: 'COMPLETE_TASK',
      recommendedActionContext: JSON.stringify({ pendingCount: pendingTasks.length }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 6: CORE SCORE HEALTH DETERIORATION
  // ----------------------------------------------------
  if (ctx.score) {
    const totalScore = Number(ctx.score.totalScore || 0);
    const finScore = Number(ctx.score.financialScore || 0);
    const engScore = Number(ctx.score.engagementScore || 0);
    const srvScore = Number(ctx.score.serviceScore || 0);

    if (totalScore < 60 || engScore < 45 || srvScore < 45) {
      const evidence: InsightEvidence[] = [
        {
          sourceType: 'CORE_SCORE',
          sourceId: ctx.score.id,
          sourceCode: `SCORE-${customerId}`,
          recordTitle: `Overall CORE Score: ${totalScore}/100 (${ctx.score.relationshipBand || 'WATCHLIST'})`,
          detail: `Financial Health: ${finScore}/100 | Engagement Index: ${engScore}/100 | Service Score: ${srvScore}/100.`,
          timestamp: ctx.score.updatedAt || ctx.score.createdAt,
          metricValue: totalScore,
          routePath: '/customers',
        },
      ];

      // Add supporting evidence from accounts or cases
      if (openCases.length > 0) {
        evidence.push({
          sourceType: 'CASE',
          sourceId: openCases[0].id,
          sourceCode: openCases[0].caseNumber || `CAS-${openCases[0].id}`,
          recordTitle: openCases[0].title,
          detail: `Active service case weighing down service health score component.`,
          routePath: '/service-desk',
        });
      }

      insights.push({
        dedupKey: `${customerId}:SCORE_DECLINE:CORE_SCORE:${ctx.score.id}`,
        customerId,
        insightId: `INS-COREHEALTH-${customerId}-${ctx.score.id}`,
        insightType: 'RELATIONSHIP_RISK',
        category: 'SCORE_DECLINE',
        title: `Relationship Health Score in warning zone (${totalScore}/100)`,
        summary: `Institutional relationship score indicates stress across ${engScore < 45 ? 'engagement' : 'service'} parameters.`,
        description: `Customer relationship band is '${ctx.score.relationshipBand || 'NEEDS_ATTENTION'}' with low component scores (Engagement: ${engScore}, Service: ${srvScore}).`,
        impact: 'Low relationship health score strongly correlates with subsequent deposit withdrawals or credit facility non-utilization.',
        priority: totalScore < 50 ? 'CRITICAL' : 'HIGH',
        confidence: 'HIGH',
        confidenceScore: 0.95,
        sourceEntityType: 'CORE_SCORE',
        sourceEntityId: String(ctx.score.id),
        evidence,
        recommendedActionType: 'REVIEW_CUSTOMER',
        recommendedActionContext: JSON.stringify({ totalScore, band: ctx.score.relationshipBand }),
        ruleVersion: RULE_VERSION,
      });
    }
  }

  // ----------------------------------------------------
  // RULE 7: ENGAGEMENT DECLINE — PROLONGED DORMANCY
  // ----------------------------------------------------
  const recentInteractions = [...ctx.interactions].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const lastInteraction = recentInteractions[0];
  const daysSinceContact = lastInteraction ? daysDiff(now, new Date(lastInteraction.timestamp)) : 999;

  // If customer has meaningful balances (> ₹1 Lakh) or loan exposure but no contact in > 60 days
  if ((totalCasaBalance >= 100000 || ctx.loans.length > 0) && daysSinceContact >= 60) {
    const evidence: InsightEvidence[] = [
      {
        sourceType: 'INTERACTION',
        sourceId: lastInteraction ? lastInteraction.id : 0,
        sourceCode: lastInteraction ? (lastInteraction.interactionCode || `INT-${lastInteraction.id}`) : 'INT-NONE',
        recordTitle: lastInteraction ? `Last Contact: ${lastInteraction.type}` : 'No Logged Contact History',
        detail: lastInteraction
          ? `Last logged meeting/call took place on ${new Date(lastInteraction.timestamp).toLocaleDateString('en-IN')} (${daysSinceContact} days ago).`
          : 'Zero officer touchpoints recorded in institutional CRM log.',
        timestamp: lastInteraction?.timestamp,
        routePath: '/customers',
      },
      {
        sourceType: 'ACCOUNT',
        sourceId: ctx.accounts[0]?.id || 0,
        sourceCode: ctx.accounts[0]?.accountNumber || customerCode,
        recordTitle: 'Relationship Value & Balances',
        detail: `Current total CASA deposit position: ₹${totalCasaBalance.toLocaleString('en-IN')}. Active accounts: ${ctx.accounts.length}.`,
        metricValue: totalCasaBalance,
        routePath: '/accounts',
      },
    ];

    insights.push({
      dedupKey: `${customerId}:ENGAGEMENT_DECLINE:CUSTOMER:${customerId}`,
      customerId,
      insightId: `INS-ENGDECL-${customerId}`,
      insightType: 'RELATIONSHIP_RISK',
      category: 'ENGAGEMENT_DECLINE',
      title: `Relationship touchpoints absent for ${daysSinceContact > 365 ? 'over 1 year' : `${daysSinceContact} days`}`,
      summary: `High-value customer has not had a recorded officer meeting, call, or review in ${daysSinceContact} days.`,
      description: `Account holds ₹${totalCasaBalance.toLocaleString('en-IN')} in deposits, yet officer interaction has lapsed beyond the 60-day relationship benchmark.`,
      impact: 'Prolonged officer detachment creates client vulnerability to competitive poaching by peer private banks.',
      priority: totalCasaBalance >= 500000 ? 'HIGH' : 'MEDIUM',
      confidence: 'HIGH',
      confidenceScore: 0.91,
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: String(customerId),
      evidence,
      recommendedActionType: 'CONTACT_CUSTOMER',
      recommendedActionContext: JSON.stringify({ daysSinceContact, totalBalance: totalCasaBalance }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 8: GROWTH OPPORTUNITY — PRODUCT DEPTH GAP
  // ----------------------------------------------------
  // High deposits (>= ₹5 Lakhs) or high relationship value, but <= 2 banking products
  if ((totalCasaBalance >= 500000 || relVal >= 1000000) && activeProductsCount <= 2) {
    const evidence: InsightEvidence[] = [
      {
        sourceType: 'CUSTOMER',
        sourceId: customerId,
        sourceCode: customerCode,
        recordTitle: ctx.customer.name,
        detail: `Relationship Value: ₹${relVal.toLocaleString('en-IN')} | Net CASA Balance: ₹${totalCasaBalance.toLocaleString('en-IN')}.`,
        metricValue: relVal,
        routePath: '/customers',
      },
      {
        sourceType: 'ACCOUNT',
        sourceId: ctx.accounts[0]?.id || 0,
        sourceCode: ctx.accounts[0]?.accountNumber || 'CASA',
        recordTitle: 'Current Product Depth',
        detail: `Customer holds only ${activeProductsCount} active product(s). Lacks Wealth Advisory, Term Deposits, or Lending facilities.`,
        metricValue: activeProductsCount,
        routePath: '/products',
      },
    ];

    insights.push({
      dedupKey: `${customerId}:PRODUCT_DEPTH_GAP:CUSTOMER:${customerId}`,
      customerId,
      insightId: `INS-DEPTHGAP-${customerId}`,
      insightType: 'GROWTH_OPPORTUNITY',
      category: 'PRODUCT_DEPTH_GAP',
      title: `Substantial product depth gap: High-balance depositor with only ${activeProductsCount} product(s)`,
      summary: `Customer maintains significant liquidity (₹${totalCasaBalance.toLocaleString('en-IN')}) but holds very low product penetration.`,
      description: `Analysis confirms substantial surplus CASA liquidity that can be structured into Term Deposits, Mutual Fund SIPs, or Sovereign Gold Bonds.`,
      impact: 'Capturing surplus liquidity into wealth/investment products locks in long-term sticky client assets.',
      priority: totalCasaBalance >= 1500000 ? 'HIGH' : 'MEDIUM',
      confidence: 'HIGH',
      confidenceScore: 0.93,
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: String(customerId),
      evidence,
      recommendedActionType: 'REVIEW_CUSTOMER',
      recommendedActionContext: JSON.stringify({ suggestedCategory: 'WEALTH_AND_TERM_DEPOSIT', availableBalance: totalCasaBalance }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 9: GROWTH OPPORTUNITY — HIGH-PROBABILITY DEAL NEARING EXECUTION
  // ----------------------------------------------------
  const highProbOpps = ctx.opportunities.filter((o) => {
    if (o.status !== 'OPEN') return false;
    const prob = Number(o.probability || 0);
    return prob >= 70 && (o.stage === 'PROPOSAL_SENT' || o.stage === 'NEGOTIATION' || o.stage === 'SANCTION_PENDING');
  });

  if (highProbOpps.length > 0) {
    const opp = highProbOpps[0];
    const val = Number(opp.expectedValue || 0);

    const evidence: InsightEvidence[] = [
      {
        sourceType: 'OPPORTUNITY',
        sourceId: opp.id,
        sourceCode: opp.opportunityCode || `OPP-${opp.id}`,
        recordTitle: opp.title,
        detail: `Deal Stage: '${opp.stage}' | Probability: ${opp.probability}% | Value: ₹${val.toLocaleString('en-IN')}. Target Close: ${opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString('en-IN') : 'Upcoming'}.`,
        metricValue: val,
        timestamp: opp.expectedCloseDate || opp.createdAt,
        routePath: '/opportunities',
      },
    ];

    insights.push({
      dedupKey: `${customerId}:HIGH_PROBABILITY_DEAL:OPPORTUNITY:${opp.id}`,
      customerId,
      insightId: `INS-OPPCLOSE-${customerId}-${opp.id}`,
      insightType: 'GROWTH_OPPORTUNITY',
      category: 'HIGH_PROBABILITY_DEAL',
      title: `High-probability opportunity nearing sanction & execution: ₹${val.toLocaleString('en-IN')}`,
      summary: `Deal '${opp.title}' has reached ${opp.probability}% probability in '${opp.stage}' stage.`,
      description: `Opportunity ${opp.opportunityCode} requires final sanction approval and documentation dispatch to secure closure.`,
      impact: 'Closing this deal will directly contribute to quarterly branch asset & fee-income targets.',
      priority: val >= 2500000 ? 'CRITICAL' : 'HIGH',
      confidence: 'HIGH',
      confidenceScore: 0.96,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: String(opp.id),
      evidence,
      recommendedActionType: 'FOLLOW_UP_OPPORTUNITY',
      recommendedActionContext: JSON.stringify({ opportunityId: opp.id, expectedValue: val }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 10: OPPORTUNITY STAGNATION (> 30 days in stage)
  // ----------------------------------------------------
  const stagnantOpps = ctx.opportunities.filter((o) => {
    if (o.status !== 'OPEN') return false;
    const updateTime = new Date(o.updatedAt || o.createdAt).getTime();
    const daysIdle = (now.getTime() - updateTime) / (1000 * 3600 * 24);
    return daysIdle >= 28 && o.stage !== 'PROPOSAL_SENT';
  });

  if (stagnantOpps.length > 0) {
    const opp = stagnantOpps[0];
    const updateTime = new Date(opp.updatedAt || opp.createdAt);
    const daysIdle = Math.round((now.getTime() - updateTime.getTime()) / (1000 * 3600 * 24));

    const evidence: InsightEvidence[] = [
      {
        sourceType: 'OPPORTUNITY',
        sourceId: opp.id,
        sourceCode: opp.opportunityCode || `OPP-${opp.id}`,
        recordTitle: opp.title,
        detail: `Idle in stage '${opp.stage}' for ${daysIdle} days. Value: ₹${Number(opp.expectedValue || 0).toLocaleString('en-IN')}.`,
        timestamp: opp.updatedAt || opp.createdAt,
        routePath: '/opportunities',
      },
    ];

    insights.push({
      dedupKey: `${customerId}:OPPORTUNITY_STAGNATION:OPPORTUNITY:${opp.id}`,
      customerId,
      insightId: `INS-OPPSTAG-${customerId}-${opp.id}`,
      insightType: 'OPERATIONAL_SIGNAL',
      category: 'OPPORTUNITY_STAGNATION',
      title: `Commercial pipeline stagnation: Deal inactive for ${daysIdle} days`,
      summary: `Deal '${opp.title}' has shown zero stage movement or activity update in ${daysIdle} days.`,
      description: `Opportunity ${opp.opportunityCode} is stalling in stage '${opp.stage}'. Officer review needed to re-engage client or qualify out.`,
      impact: 'Stagnant opportunities inflate pipeline metrics and mask real conversion velocity.',
      priority: 'MEDIUM',
      confidence: 'HIGH',
      confidenceScore: 0.90,
      sourceEntityType: 'OPPORTUNITY',
      sourceEntityId: String(opp.id),
      evidence,
      recommendedActionType: 'FOLLOW_UP_OPPORTUNITY',
      recommendedActionContext: JSON.stringify({ opportunityId: opp.id, daysIdle }),
      ruleVersion: RULE_VERSION,
    });
  }

  // ----------------------------------------------------
  // RULE 11: RECENT INTERACTION SPIKE (ENGAGEMENT SIGNAL)
  // ----------------------------------------------------
  const interactionsLast14Days = ctx.interactions.filter((i) => {
    const t = new Date(i.timestamp).getTime();
    return (now.getTime() - t) / (1000 * 3600 * 24) <= 14;
  });

  if (interactionsLast14Days.length >= 3) {
    const evidence: InsightEvidence[] = interactionsLast14Days.slice(0, 4).map((i) => ({
      sourceType: 'INTERACTION',
      sourceId: i.id,
      sourceCode: i.interactionCode || `INT-${i.id}`,
      recordTitle: `${i.type}: ${i.subject || i.summary?.substring(0, 30) || 'Client Discussion'}`,
      detail: `Conducted on ${new Date(i.timestamp).toLocaleDateString('en-IN')} by ${i.officerName || 'Officer'}. Sentiment: ${i.sentiment || 'NEUTRAL'}.`,
      timestamp: i.timestamp,
      routePath: '/customers',
    }));

    insights.push({
      dedupKey: `${customerId}:INTERACTION_SPIKE:CUSTOMER:${customerId}`,
      customerId,
      insightId: `INS-INTSPIKE-${customerId}`,
      insightType: 'ENGAGEMENT_SIGNAL',
      category: 'INTERACTION_SPIKE',
      title: `Elevated engagement velocity: ${interactionsLast14Days.length} touchpoints in last 14 days`,
      summary: `Customer has had ${interactionsLast14Days.length} recent interactions, indicating active business or transaction preparations.`,
      description: `High interaction cadence observed across recent calls and branch visits. Optimal window for relationship review.`,
      impact: 'High customer receptivity window. Strong timing for cross-selling and credit reviews.',
      priority: 'MEDIUM',
      confidence: 'HIGH',
      confidenceScore: 0.92,
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: String(customerId),
      evidence,
      recommendedActionType: 'REVIEW_CUSTOMER',
      recommendedActionContext: JSON.stringify({ recentCount: interactionsLast14Days.length }),
      ruleVersion: RULE_VERSION,
    });
  }

  return insights;
}
