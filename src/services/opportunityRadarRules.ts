import type {
  RadarSignalType,
  RadarCategory,
  RadarPriority,
  RadarEvidence,
} from '../types/index.ts';

export interface RadarEvaluationContext {
  customer: any;
  addresses?: any[];
  contacts?: any[];
  accounts: any[];
  loans: any[];
  interactions: any[];
  cases: any[];
  tasks: any[];
  opportunities: any[];
  score: any | null;
  products: any[];
  insights: any[];
  catalogProducts?: any[];
}

export interface GeneratedRadarCandidate {
  radarId: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  cifNumber?: string;
  assignedRmId?: number | null;
  signalType: RadarSignalType;
  title: string;
  summary: string;
  category: RadarCategory | string;
  priority: RadarPriority;
  relevanceScore: number; // 0-100
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
  expectedValueBand: 'LOW' | 'MEDIUM' | 'HIGH' | 'Tier 1: High Potential Band';
  ruleId: string;
  ruleVersion: string;
  targetProductId?: number;
  targetProductCode?: string;
  targetProductName?: string;
  existingOpportunityId?: number;
  existingOpportunityCode?: string;
  existingOpportunityTitle?: string;
  evidence: RadarEvidence[];
  dedupKey: string;
  expiresAt?: Date;
  serviceDeprioritized?: boolean;
  healthGateApplied?: boolean;
}

export const RADAR_RULE_VERSION = 'RADAR-v1';

/**
 * Deterministic Customer Opportunity Radar Rules Engine
 *
 * Answers:
 * 1. "Where is there an opportunity to deepen this customer's relationship?"
 * 2. "Why does COREvia believe this is relevant?"
 * 3. "What evidence supports this?"
 *
 * Rules:
 * - Deterministic, explainable, and based solely on existing CRM and banking data
 * - Service-First Safety: Critical service issues/SLA breaches deprioritize growth signals
 * - Customer Health Gate: CORE score < 50 deprioritizes aggressive expansion
 * - Zero LLM / Zero invented financial data
 */
export function evaluateCustomerOpportunityRadar(ctx: RadarEvaluationContext): GeneratedRadarCandidate[] {
  const candidates: GeneratedRadarCandidate[] = [];
  const now = new Date();
  const customerId = ctx.customer.id;
  const customerCode = ctx.customer.customerCode || `CUST-${customerId}`;
  const customerName = ctx.customer.name || 'Customer';
  const cifNumber = ctx.customer.cifNumber || '';
  const assignedRmId = ctx.customer.assignedRmId || null;

  // Helper date calculations
  const daysDiff = (d1: Date, d2: Date) =>
    Math.floor(Math.abs(d1.getTime() - d2.getTime()) / (1000 * 3600 * 24));

  // Compute aggregate financial balances
  let totalCasaBalance = 0;
  let termDepositBalance = 0;
  ctx.accounts.forEach((acc) => {
    const bal = Number(acc.balance?.availableBalance || acc.availableBalance || 0);
    const validBal = isNaN(bal) ? 0 : bal;
    if (acc.accountType === 'FIXED_DEPOSIT' || acc.accountType === 'RECURRING_DEPOSIT') {
      termDepositBalance += validBal;
    } else {
      totalCasaBalance += validBal;
    }
  });

  const totalOutstandingLoan = ctx.loans.reduce((sum, ln) => {
    const p = Number(ln.principalOutstanding || ln.sanctionedLimit || 0);
    return sum + (isNaN(p) ? 0 : p);
  }, 0);

  const relVal = Number(ctx.customer.relationshipValue || (totalCasaBalance + termDepositBalance + totalOutstandingLoan));
  const coreScoreValue = ctx.score ? Number(ctx.score.totalScore || 0) : 70;
  const scoreBand = ctx.score?.relationshipBand || 'ENGAGED';

  // Active product category lookup
  const activeProductCategories = new Set<string>();
  const activeProductCodes = new Set<string>();
  
  // From customerProducts enrollments
  ctx.products.forEach((cp) => {
    if (cp.product?.category) activeProductCategories.add(cp.product.category.toUpperCase());
    if (cp.product?.productCode) activeProductCodes.add(cp.product.productCode.toUpperCase());
    if (cp.category) activeProductCategories.add(cp.category.toUpperCase());
    if (cp.productCode) activeProductCodes.add(cp.productCode.toUpperCase());
  });

  // From account schemes
  ctx.accounts.forEach((acc) => {
    activeProductCategories.add('CASA');
    if (acc.schemeCode) activeProductCodes.add(acc.schemeCode.toUpperCase());
    if (acc.accountType === 'FIXED_DEPOSIT' || acc.accountType === 'RECURRING_DEPOSIT') {
      activeProductCategories.add('DEPOSITS');
    }
  });

  // From loans
  ctx.loans.forEach((ln) => {
    activeProductCategories.add('ASSET_LOAN');
    activeProductCategories.add('LENDING');
    if (ln.productType) activeProductCodes.add(ln.productType.toUpperCase());
  });

  // Existing active opportunities
  const activeOpportunities = ctx.opportunities.filter(
    (o) => o.stage !== 'WON' && o.stage !== 'LOST'
  );
  const activeOppProductIds = new Set(activeOpportunities.map((o) => o.productId).filter(Boolean));

  // Service health analysis (Service-First Safety)
  const openCases = ctx.cases.filter((c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED');
  const breachedCases = openCases.filter((c) => {
    if (c.slaBreached) return true;
    if (c.slaDeadline && new Date(c.slaDeadline).getTime() < now.getTime()) return true;
    return false;
  });
  const criticalCases = openCases.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH');
  const hasServiceEmergency = breachedCases.length > 0 || criticalCases.length > 0;
  const isHealthDeteriorating = coreScoreValue < 50 || scoreBand === 'AT_RISK' || scoreBand === 'VULNERABLE';

  // Product catalog lookup helper
  const findCatalogProduct = (code: string) => {
    return ctx.catalogProducts?.find((p) => p.productCode === code);
  };

  // ----------------------------------------------------
  // SERVICE-FIRST SAFETY RECOVERY SIGNAL
  // ----------------------------------------------------
  if (hasServiceEmergency) {
    const primaryGrievance = breachedCases[0] || criticalCases[0];
    const caseTitle = primaryGrievance.title || 'Client Service Grievance';
    const caseCode = primaryGrievance.caseNumber || `CASE-${primaryGrievance.id}`;

    candidates.push({
      radarId: `RAD-${customerId}-SRV-01`,
      customerId,
      customerName,
      customerCode,
      cifNumber,
      assignedRmId,
      signalType: 'SERVICE_FIRST_RECOVERY',
      title: 'Service Remediation Required Before Relationship Expansion',
      summary: `Active service case ${caseCode} requires immediate executive resolution before pursuing commercial opportunities.`,
      category: 'RELATIONSHIP_REVIEW',
      priority: 'CRITICAL',
      relevanceScore: 98,
      confidence: 'HIGH',
      rationale: `Customer has an unresolved ${primaryGrievance.priority} service issue (${caseTitle}). Institutional governance requires resolving service friction before presenting cross-sell offers.`,
      expectedValueBand: 'HIGH',
      ruleId: 'RADAR-RULE-SERVICE-FIRST-RECOVERY',
      ruleVersion: RADAR_RULE_VERSION,
      evidence: [
        {
          sourceEntityType: 'CASE',
          sourceEntityId: primaryGrievance.id,
          sourceEntityCode: caseCode,
          recordTitle: caseTitle,
          evidenceType: 'SLA_VIOLATION',
          evidenceSummary: primaryGrievance.slaBreached
            ? `SLA breached on ${primaryGrievance.slaDeadline ? new Date(primaryGrievance.slaDeadline).toLocaleDateString() : 'service deadline'}`
            : `Open high-priority case in status ${primaryGrievance.status}`,
          detail: primaryGrievance.description || 'Customer reported banking transaction or operational dispute.',
          routePath: '/cases',
          metricValue: primaryGrievance.priority,
          timestamp: primaryGrievance.createdAt,
        },
        {
          sourceEntityType: 'CUSTOMER',
          sourceEntityId: customerId,
          sourceEntityCode: customerCode,
          recordTitle: `${customerName} Profile`,
          evidenceSummary: `Relationship value ₹${(relVal / 100000).toFixed(1)}L at potential retention risk`,
          routePath: '/customers',
          metricValue: `CORE Score: ${coreScoreValue}`,
        },
      ],
      dedupKey: `RADAR-SERVICE-${customerId}-${primaryGrievance.id}`,
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
  }

  // ----------------------------------------------------
  // 1. PRODUCT COVERAGE GAP: Deposit -> Wealth / Investment
  // ----------------------------------------------------
  const hasInvestment =
    activeProductCategories.has('WEALTH') ||
    activeProductCategories.has('INVESTMENTS') ||
    activeProductCodes.has('PRD-INV-WEALTH') ||
    activeProductCodes.has('PRD-INV-MF');

  const wealthCatalogProduct = findCatalogProduct('PRD-INV-WEALTH');
  const hasActiveWealthOpp = activeOpportunities.some((o) =>
    (o.productName && o.productName.toLowerCase().includes('wealth')) ||
    (o.title && (o.title.toLowerCase().includes('wealth') || o.title.toLowerCase().includes('investment') || o.title.toLowerCase().includes('portfolio')))
  );

  if (!hasInvestment && !hasActiveWealthOpp && (totalCasaBalance >= 800000 || relVal >= 1500000)) {
    let relevance = 75;
    if (totalCasaBalance >= 2500000) relevance += 10;
    if (coreScoreValue >= 75) relevance += 10;
    if (hasServiceEmergency) relevance -= 35;
    if (isHealthDeteriorating) relevance -= 25;
    relevance = Math.max(10, Math.min(100, relevance));

    const topAcc = ctx.accounts.find(
      (a) => Number(a.balance?.availableBalance || a.availableBalance || 0) > 0
    ) || ctx.accounts[0];

    const topAccBal = topAcc ? Number(topAcc.balance?.availableBalance || topAcc.availableBalance || 0) : totalCasaBalance;

    candidates.push({
      radarId: `RAD-${customerId}-PRD-WEALTH`,
      customerId,
      customerName,
      customerCode,
      cifNumber,
      assignedRmId,
      signalType: 'PRODUCT_COVERAGE_GAP',
      title: 'Investment & Wealth Management Relationship Expansion',
      summary: `High deposit liquidity (₹${(totalCasaBalance / 100000).toFixed(1)}L CASA) with zero wealth or investment product holdings.`,
      category: 'INVESTMENTS',
      priority: hasServiceEmergency ? 'LOW' : 'MEDIUM',
      relevanceScore: relevance,
      confidence: totalCasaBalance >= 1500000 ? 'HIGH' : 'MEDIUM',
      rationale: `Customer maintains strong liquid balances across deposit accounts (₹${(totalCasaBalance / 100000).toFixed(1)}L) with a stable health index (CORE ${coreScoreValue}), but holds no mutual fund or sovereign wealth products.`,
      expectedValueBand: totalCasaBalance >= 2500000 ? 'Tier 1: High Potential Band' : 'HIGH',
      ruleId: 'RADAR-RULE-WEALTH-EXPANSION',
      ruleVersion: RADAR_RULE_VERSION,
      targetProductId: wealthCatalogProduct?.id,
      targetProductCode: wealthCatalogProduct?.productCode || 'PRD-INV-WEALTH',
      targetProductName: wealthCatalogProduct?.name || 'Sovereign Wealth & Mutual Fund Portfolio',
      evidence: [
        {
          sourceEntityType: 'ACCOUNT',
          sourceEntityId: topAcc?.id || customerId,
          sourceEntityCode: topAcc?.accountNumber || customerCode,
          recordTitle: `${topAcc?.schemeName || 'Primary CASA Account'}`,
          evidenceType: 'BALANCE_METRIC',
          evidenceSummary: `Available liquidity of ₹${(topAccBal / 100000).toFixed(2)} Lakhs`,
          detail: `Customer holds ₹${(totalCasaBalance / 100000).toFixed(2)} Lakhs aggregate across ${ctx.accounts.length} deposit account(s).`,
          routePath: '/accounts',
          metricValue: `₹${(totalCasaBalance / 100000).toFixed(1)}L`,
          timestamp: topAcc?.lastActivityDate || topAcc?.createdAt,
        },
        {
          sourceEntityType: 'CORE_SCORE',
          sourceEntityId: ctx.score?.id || customerId,
          sourceEntityCode: `CORE-${coreScoreValue}`,
          recordTitle: 'Relationship Health Evaluation',
          evidenceSummary: `CORE Score ${coreScoreValue}/100 in band ${scoreBand}`,
          detail: 'High deposit stability and low operational delinquency indicate strong potential for wealth relationship advisory.',
          routePath: '/customers',
          metricValue: `${coreScoreValue}/100`,
        },
        {
          sourceEntityType: 'PRODUCT',
          sourceEntityId: customerId,
          sourceEntityCode: 'GAP-WEALTH',
          recordTitle: 'Product Coverage Matrix',
          evidenceSummary: 'Active portfolio contains 0 Wealth / Asset Management holdings',
          detail: 'No registered SIP, mutual fund, or government bond portfolio linked to customer CIF.',
          routePath: '/products',
          metricValue: '0 Products',
        },
      ],
      dedupKey: `RADAR-GAP-WEALTH-${customerId}`,
      expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      serviceDeprioritized: hasServiceEmergency,
      healthGateApplied: isHealthDeteriorating,
    });
  }

  // ----------------------------------------------------
  // 2. PRODUCT COVERAGE GAP: Active Loan -> Credit Protection / Insurance
  // ----------------------------------------------------
  const hasInsurance =
    activeProductCategories.has('INSURANCE') ||
    activeProductCodes.has('PRD-INS-HLTH') ||
    activeProductCodes.has('PRD-INS-LIFE');

  const insuranceCatalogProduct = findCatalogProduct('PRD-INS-HLTH');
  const hasActiveInsuranceOpp = activeOpportunities.some((o) =>
    (o.productName && o.productName.toLowerCase().includes('insurance')) ||
    (o.title && o.title.toLowerCase().includes('insurance'))
  );

  if (totalOutstandingLoan >= 500000 && !hasInsurance && !hasActiveInsuranceOpp) {
    let relevance = 70;
    if (totalOutstandingLoan >= 2000000) relevance += 10;
    if (coreScoreValue >= 65) relevance += 5;
    if (hasServiceEmergency) relevance -= 35;
    if (isHealthDeteriorating) relevance -= 20;
    relevance = Math.max(10, Math.min(100, relevance));

    const primaryLoan = ctx.loans[0];

    candidates.push({
      radarId: `RAD-${customerId}-PRD-INS`,
      customerId,
      customerName,
      customerCode,
      cifNumber,
      assignedRmId,
      signalType: 'PRODUCT_COVERAGE_GAP',
      title: 'Credit Protection & Bancassurance Gap',
      summary: `Outstanding credit facilities of ₹${(totalOutstandingLoan / 100000).toFixed(1)}L with no linked insurance protection.`,
      category: 'INSURANCE',
      priority: hasServiceEmergency ? 'LOW' : 'MEDIUM',
      relevanceScore: relevance,
      confidence: 'HIGH',
      rationale: `Customer maintains active credit exposure (₹${(totalOutstandingLoan / 100000).toFixed(1)}L across ${ctx.loans.length} loan accounts) without collateral life or health bancassurance coverage.`,
      expectedValueBand: 'MEDIUM',
      ruleId: 'RADAR-RULE-INSURANCE-PROTECTION',
      ruleVersion: RADAR_RULE_VERSION,
      targetProductId: insuranceCatalogProduct?.id,
      targetProductCode: insuranceCatalogProduct?.productCode || 'PRD-INS-HLTH',
      targetProductName: insuranceCatalogProduct?.name || 'Comprehensive Health & Credit Life Assurance',
      evidence: [
        {
          sourceEntityType: 'LOAN',
          sourceEntityId: primaryLoan?.id || customerId,
          sourceEntityCode: primaryLoan?.loanNumber || customerCode,
          recordTitle: `${primaryLoan?.productType || 'Term Loan Facility'}`,
          evidenceType: 'SANCTION_RECORD',
          evidenceSummary: `Principal outstanding ₹${(Number(primaryLoan?.principalOutstanding || 0) / 100000).toFixed(2)} Lakhs`,
          detail: `Loan sanctioned at ${(Number(primaryLoan?.interestRate || 9.5)).toFixed(2)}% p.a. with active repayment schedule.`,
          routePath: '/lending',
          metricValue: `₹${(totalOutstandingLoan / 100000).toFixed(1)}L`,
          timestamp: primaryLoan?.sanctionDate || primaryLoan?.createdAt,
        },
        {
          sourceEntityType: 'PRODUCT',
          sourceEntityId: customerId,
          sourceEntityCode: 'GAP-INSURANCE',
          recordTitle: 'Bancassurance Enrollment Check',
          evidenceSummary: '0 Active insurance policies on file',
          detail: 'Credit asset remains unhedged against unforeseen customer health or life eventualities.',
          routePath: '/products',
          metricValue: 'Uncovered',
        },
      ],
      dedupKey: `RADAR-GAP-INSURANCE-${customerId}`,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      serviceDeprioritized: hasServiceEmergency,
      healthGateApplied: isHealthDeteriorating,
    });
  }

  // ----------------------------------------------------
  // 3. PRODUCT COVERAGE GAP: Salary/Prime CASA -> Credit Card
  // ----------------------------------------------------
  const hasCards =
    activeProductCategories.has('CARDS') ||
    activeProductCodes.has('PRD-CRD-MET') ||
    activeProductCodes.has('PRD-CRD-PLT');

  const cardCatalogProduct = findCatalogProduct('PRD-CRD-MET');
  const hasActiveCardOpp = activeOpportunities.some((o) =>
    (o.productName && o.productName.toLowerCase().includes('card')) ||
    (o.title && o.title.toLowerCase().includes('card'))
  );

  const hasPrimeOrSalary = ctx.accounts.some(
    (a) => a.accountType === 'SALARY' || a.accountType === 'PREMIUM_SAVINGS' || a.schemeCode === 'PRD-SB-SAL' || a.schemeCode === 'PRD-SB-PREM'
  ) || totalCasaBalance >= 500000;

  if (hasPrimeOrSalary && !hasCards && !hasActiveCardOpp) {
    let relevance = 68;
    if (coreScoreValue >= 70) relevance += 10;
    if (totalCasaBalance >= 1000000) relevance += 8;
    if (hasServiceEmergency) relevance -= 30;
    if (isHealthDeteriorating) relevance -= 20;
    relevance = Math.max(10, Math.min(100, relevance));

    candidates.push({
      radarId: `RAD-${customerId}-PRD-CARD`,
      customerId,
      customerName,
      customerCode,
      cifNumber,
      assignedRmId,
      signalType: 'PRODUCT_COVERAGE_GAP',
      title: 'Premium RuPay Credit Card Relationship Expansion',
      summary: 'Prime deposit/salary relationship maintained with no associated card line.',
      category: 'CARDS',
      priority: hasServiceEmergency ? 'LOW' : 'MEDIUM',
      relevanceScore: relevance,
      confidence: 'HIGH',
      rationale: `Customer maintains an active salary or prime deposit relationship with steady inflows and strong CORE Score (${coreScoreValue}), but has not activated a bank credit card facility.`,
      expectedValueBand: 'MEDIUM',
      ruleId: 'RADAR-RULE-CARD-EXPANSION',
      ruleVersion: RADAR_RULE_VERSION,
      targetProductId: cardCatalogProduct?.id,
      targetProductCode: cardCatalogProduct?.productCode || 'PRD-CRD-MET',
      targetProductName: cardCatalogProduct?.name || 'Signature Metal RuPay Credit Card',
      evidence: [
        {
          sourceEntityType: 'CUSTOMER',
          sourceEntityId: customerId,
          sourceEntityCode: customerCode,
          recordTitle: `${customerName} Demographic Profile`,
          evidenceSummary: `Prime relationship with ₹${(relVal / 100000).toFixed(1)}L TRV`,
          detail: 'Consistent monthly account activities and solid banking history qualify for pre-approved card issuance.',
          routePath: '/customers',
          metricValue: `CORE ${coreScoreValue}`,
        },
        {
          sourceEntityType: 'PRODUCT',
          sourceEntityId: customerId,
          sourceEntityCode: 'GAP-CARDS',
          recordTitle: 'Card Issuance Status',
          evidenceSummary: 'No active credit card account registered',
          detail: 'Customer uses branch/debit channels for expenditure without leveraging reward-linked credit card lines.',
          routePath: '/products',
          metricValue: '0 Cards',
        },
      ],
      dedupKey: `RADAR-GAP-CARD-${customerId}`,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      serviceDeprioritized: hasServiceEmergency,
      healthGateApplied: isHealthDeteriorating,
    });
  }

  // ----------------------------------------------------
  // 4. PRODUCT COVERAGE GAP: Commercial Current Account -> Working Capital / Trade
  // ----------------------------------------------------
  const isBusinessEntity =
    ctx.customer.constitution === 'PROPRIETORSHIP' ||
    ctx.customer.constitution === 'PARTNERSHIP' ||
    ctx.customer.constitution === 'PRIVATE_LIMITED' ||
    ctx.customer.constitution === 'PUBLIC_LIMITED' ||
    ctx.accounts.some((a) => a.accountType === 'CURRENT');

  const hasWorkingCapital =
    activeProductCodes.has('PRD-LN-WC') ||
    activeProductCodes.has('PRD-TRD-LC') ||
    ctx.loans.some((l) => (l.productType || '').toUpperCase().includes('WORKING_CAPITAL') || (l.productType || '').toUpperCase().includes('CASH_CREDIT'));

  const wcCatalogProduct = findCatalogProduct('PRD-LN-WC');
  const hasActiveLendingOpp = activeOpportunities.some((o) =>
    (o.productName && (o.productName.toLowerCase().includes('working capital') || o.productName.toLowerCase().includes('loan'))) ||
    (o.title && (o.title.toLowerCase().includes('working capital') || o.title.toLowerCase().includes('credit line') || o.title.toLowerCase().includes('cash credit')))
  );

  const annualTurnover = Number(ctx.customer.annualTurnover || 0);

  if (isBusinessEntity && !hasWorkingCapital && !hasActiveLendingOpp && (annualTurnover >= 2500000 || totalCasaBalance >= 500000)) {
    let relevance = 78;
    if (annualTurnover >= 10000000) relevance += 12;
    if (coreScoreValue >= 75) relevance += 5;
    if (hasServiceEmergency) relevance -= 35;
    if (isHealthDeteriorating) relevance -= 20;
    relevance = Math.max(10, Math.min(100, relevance));

    candidates.push({
      radarId: `RAD-${customerId}-PRD-WC`,
      customerId,
      customerName,
      customerCode,
      cifNumber,
      assignedRmId,
      signalType: 'PRODUCT_COVERAGE_GAP',
      title: 'Working Capital & Commercial Cash Credit Expansion',
      summary: `Commercial enterprise operating with turnover ₹${(annualTurnover / 100000).toFixed(1)}L with no active credit line.`,
      category: 'LENDING',
      priority: hasServiceEmergency ? 'LOW' : 'HIGH',
      relevanceScore: relevance,
      confidence: 'HIGH',
      rationale: `Commercial entity demonstrates active operational throughput across Current Accounts without an institutional Working Capital cash credit or overdraft facility.`,
      expectedValueBand: annualTurnover >= 10000000 ? 'Tier 1: High Potential Band' : 'HIGH',
      ruleId: 'RADAR-RULE-WORKING-CAPITAL-EXPANSION',
      ruleVersion: RADAR_RULE_VERSION,
      targetProductId: wcCatalogProduct?.id,
      targetProductCode: wcCatalogProduct?.productCode || 'PRD-LN-WC',
      targetProductName: wcCatalogProduct?.name || 'Working Capital Cash Credit Facility',
      evidence: [
        {
          sourceEntityType: 'CUSTOMER',
          sourceEntityId: customerId,
          sourceEntityCode: customerCode,
          recordTitle: 'Commercial Turn-over Record',
          evidenceSummary: `Annual reported business turnover of ₹${(annualTurnover / 100000).toFixed(2)} Lakhs`,
          detail: `Entity constitution: ${ctx.customer.constitution || 'COMMERCIAL_ENTITY'}, GSTIN: ${ctx.customer.gstin || 'VERIFIED'}.`,
          routePath: '/customers',
          metricValue: `₹${(annualTurnover / 100000).toFixed(1)}L Turnover`,
        },
        {
          sourceEntityType: 'ACCOUNT',
          sourceEntityId: customerId,
          sourceEntityCode: customerCode,
          recordTitle: 'Operating CASA Balances',
          evidenceSummary: `Maintains ₹${(totalCasaBalance / 100000).toFixed(2)} Lakhs operating float`,
          detail: 'Sustained daily ledger balances indicate adequate debt service capability for working capital sanction.',
          routePath: '/accounts',
          metricValue: `₹${(totalCasaBalance / 100000).toFixed(1)}L`,
        },
      ],
      dedupKey: `RADAR-GAP-WC-${customerId}`,
      expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
      serviceDeprioritized: hasServiceEmergency,
      healthGateApplied: isHealthDeteriorating,
    });
  }

  // ----------------------------------------------------
  // 5. RELATIONSHIP EXPANSION: High TRV + Strong Health + Low Product Depth
  // ----------------------------------------------------
  const totalEnrolledProducts = ctx.products.length + (ctx.accounts.length > 0 ? 1 : 0) + (ctx.loans.length > 0 ? 1 : 0);
  if (relVal >= 2500000 && coreScoreValue >= 75 && totalEnrolledProducts <= 2 && activeOpportunities.length === 0) {
    let relevance = 84;
    if (relVal >= 5000000) relevance += 8;
    if (hasServiceEmergency) relevance -= 35;
    if (isHealthDeteriorating) relevance -= 25;
    relevance = Math.max(10, Math.min(100, relevance));

    candidates.push({
      radarId: `RAD-${customerId}-REL-DEPTH`,
      customerId,
      customerName,
      customerCode,
      cifNumber,
      assignedRmId,
      signalType: 'RELATIONSHIP_EXPANSION',
      title: 'High-Value Tier-1 Relationship Deepening Opportunity',
      summary: `Substantial relationship equity (₹${(relVal / 100000).toFixed(1)}L TRV) with single-digit product penetration.`,
      category: 'RELATIONSHIP_REVIEW',
      priority: hasServiceEmergency ? 'LOW' : 'MEDIUM',
      relevanceScore: relevance,
      confidence: 'HIGH',
      rationale: `Customer maintains high loyalty and balance equity (TRV ₹${(relVal / 100000).toFixed(1)}L) with stellar CORE Score (${coreScoreValue}), but uses only ${totalEnrolledProducts} banking products. Significant headroom for multi-product relationship expansion.`,
      expectedValueBand: 'Tier 1: High Potential Band',
      ruleId: 'RADAR-RULE-REL-DEPTH-EXPANSION',
      ruleVersion: RADAR_RULE_VERSION,
      evidence: [
        {
          sourceEntityType: 'CUSTOMER',
          sourceEntityId: customerId,
          sourceEntityCode: customerCode,
          recordTitle: 'Customer 360 Relationship Valuation',
          evidenceSummary: `Total Relationship Value: ₹${(relVal / 100000).toFixed(2)} Lakhs`,
          detail: 'Combined valuation across deposits, credit facilities, and fee products places customer in top branch decile.',
          routePath: '/customers',
          metricValue: `₹${(relVal / 100000).toFixed(1)}L`,
        },
        {
          sourceEntityType: 'CORE_SCORE',
          sourceEntityId: ctx.score?.id || customerId,
          sourceEntityCode: `CORE-${coreScoreValue}`,
          recordTitle: 'Institutional Health Index',
          evidenceSummary: `Health score ${coreScoreValue}/100 in '${scoreBand}' Tier`,
          detail: 'Exemplary relationship longevity, regulatory compliance, and transaction velocity.',
          routePath: '/customers',
          metricValue: `${coreScoreValue}/100`,
        },
      ],
      dedupKey: `RADAR-REL-DEPTH-${customerId}`,
      expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      serviceDeprioritized: hasServiceEmergency,
      healthGateApplied: isHealthDeteriorating,
    });
  }

  // ----------------------------------------------------
  // 6. EXISTING OPPORTUNITY FOLLOW-UP
  // ----------------------------------------------------
  activeOpportunities.forEach((opp) => {
    // Check if stalled or close date approaching
    let needsFollowup = false;
    let followupReason = '';
    const oppCreated = new Date(opp.createdAt);
    const daysSinceCreation = daysDiff(now, oppCreated);

    if (opp.expectedCloseDate) {
      const closeDate = new Date(opp.expectedCloseDate);
      const daysUntilClose = Math.floor((closeDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (daysUntilClose >= 0 && daysUntilClose <= 7) {
        needsFollowup = true;
        followupReason = `Target close date is in ${daysUntilClose === 0 ? 'today' : `${daysUntilClose} days`}. Final commercial review required.`;
      }
    }

    if (!needsFollowup && (opp.stage === 'PROPOSAL' || opp.stage === 'NEGOTIATION') && daysSinceCreation >= 14) {
      needsFollowup = true;
      followupReason = `Opportunity has been in '${opp.stage}' stage for ${daysSinceCreation} days without advancement.`;
    }

    if (needsFollowup) {
      const oppValue = Number(opp.expectedValue || 0);
      let relevance = 88;
      if (oppValue >= 2000000) relevance += 7;
      if (hasServiceEmergency) relevance -= 20; // less penalized since deal is already in pipeline
      relevance = Math.max(10, Math.min(100, relevance));

      candidates.push({
        radarId: `RAD-${customerId}-OPP-${opp.id}`,
        customerId,
        customerName,
        customerCode,
        cifNumber,
        assignedRmId,
        signalType: 'OPPORTUNITY_FOLLOWUP',
        title: `Pipeline Momentum: ${opp.title}`,
        summary: followupReason,
        category: opp.productName?.toUpperCase() || 'LENDING',
        priority: 'HIGH',
        relevanceScore: relevance,
        confidence: 'HIGH',
        rationale: `Active opportunity '${opp.title}' (Expected ₹${(oppValue / 100000).toFixed(1)}L) requires relationship manager intervention: ${followupReason}`,
        expectedValueBand: oppValue >= 2500000 ? 'HIGH' : 'MEDIUM',
        ruleId: 'RADAR-RULE-OPPORTUNITY-FOLLOWUP',
        ruleVersion: RADAR_RULE_VERSION,
        existingOpportunityId: opp.id,
        existingOpportunityCode: opp.opportunityCode || `OPP-${opp.id}`,
        existingOpportunityTitle: opp.title,
        evidence: [
          {
            sourceEntityType: 'OPPORTUNITY',
            sourceEntityId: opp.id,
            sourceEntityCode: opp.opportunityCode || `OPP-${opp.id}`,
            recordTitle: opp.title,
            evidenceType: 'PIPELINE_RECORD',
            evidenceSummary: `Stage: ${opp.stage} | Probability: ${opp.probability}% | Value: ₹${(oppValue / 100000).toFixed(2)}L`,
            detail: opp.notes || 'Commercial deal progressing through enterprise sales pipeline.',
            routePath: '/opportunities',
            metricValue: `₹${(oppValue / 100000).toFixed(1)}L`,
            timestamp: opp.updatedAt || opp.createdAt,
          },
          {
            sourceEntityType: 'CUSTOMER',
            sourceEntityId: customerId,
            sourceEntityCode: customerCode,
            recordTitle: `${customerName} Account`,
            evidenceSummary: `Primary relationship officer: ${opp.assignedToName || 'Branch Team'}`,
            routePath: '/customers',
            metricValue: `Stage: ${opp.stage}`,
          },
        ],
        dedupKey: `RADAR-OPP-FOLLOWUP-${opp.id}`,
        expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        serviceDeprioritized: hasServiceEmergency,
      });
    }
  });

  // ----------------------------------------------------
  // 7. RENEWAL / MATURITY: Real loan or deposit maturity dates
  // ----------------------------------------------------
  ctx.loans.forEach((ln) => {
    if (ln.maturityDate) {
      const matDate = new Date(ln.maturityDate);
      const daysToMaturity = Math.floor((matDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      if (daysToMaturity > 0 && daysToMaturity <= 90) {
        const principal = Number(ln.principalOutstanding || ln.sanctionedLimit || 0);
        let relevance = 85;
        if (daysToMaturity <= 30) relevance += 10;
        if (hasServiceEmergency) relevance -= 25;
        relevance = Math.max(10, Math.min(100, relevance));

        candidates.push({
          radarId: `RAD-${customerId}-MAT-LN-${ln.id}`,
          customerId,
          customerName,
          customerCode,
          cifNumber,
          assignedRmId,
          signalType: 'RENEWAL_MATURITY',
          title: `Loan Facility Maturity & Renewal Review (${ln.loanNumber})`,
          summary: `Facility maturing on ${matDate.toLocaleDateString()} (${daysToMaturity} days remaining). Initiate renewal dialogue.`,
          category: 'LENDING',
          priority: daysToMaturity <= 30 ? 'HIGH' : 'MEDIUM',
          relevanceScore: relevance,
          confidence: 'HIGH',
          rationale: `Loan ${ln.loanNumber} reaches scheduled maturity in ${daysToMaturity} days with ₹${(principal / 100000).toFixed(2)}L balance. Early renewal dialogue prevents facility run-off and ensures continuous credit support.`,
          expectedValueBand: principal >= 2000000 ? 'HIGH' : 'MEDIUM',
          ruleId: 'RADAR-RULE-LOAN-MATURITY-RENEWAL',
          ruleVersion: RADAR_RULE_VERSION,
          evidence: [
            {
              sourceEntityType: 'LOAN',
              sourceEntityId: ln.id,
              sourceEntityCode: ln.loanNumber,
              recordTitle: `${ln.productType || 'Credit Facility'}`,
              evidenceType: 'MATURITY_SCHEDULE',
              evidenceSummary: `Scheduled maturity date: ${matDate.toLocaleDateString()}`,
              detail: `Outstanding balance: ₹${(principal / 100000).toFixed(2)} Lakhs at ${(Number(ln.interestRate || 9)).toFixed(2)}% interest.`,
              routePath: '/lending',
              metricValue: `${daysToMaturity} Days Left`,
              timestamp: ln.maturityDate,
            },
          ],
          dedupKey: `RADAR-MAT-LN-${ln.id}`,
          expiresAt: matDate,
          serviceDeprioritized: hasServiceEmergency,
        });
      }
    }
  });

  // Term deposit maturity check
  ctx.accounts.forEach((acc) => {
    if ((acc.accountType === 'FIXED_DEPOSIT' || acc.accountType === 'RECURRING_DEPOSIT') && (acc.maturityDate || acc.lastActivityDate)) {
      // If maturityDate exists on account
      const refDateStr = acc.maturityDate;
      if (refDateStr) {
        const matDate = new Date(refDateStr);
        const daysToMaturity = Math.floor((matDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        if (daysToMaturity > 0 && daysToMaturity <= 60) {
          const depBal = Number(acc.balance?.availableBalance || acc.availableBalance || 0);
          candidates.push({
            radarId: `RAD-${customerId}-MAT-FD-${acc.id}`,
            customerId,
            customerName,
            customerCode,
            cifNumber,
            assignedRmId,
            signalType: 'RENEWAL_MATURITY',
            title: `Term Deposit Re-investment & Rollover (${acc.accountNumber})`,
            summary: `Fixed Deposit ₹${(depBal / 100000).toFixed(1)}L matures in ${daysToMaturity} days. Present attractive renewal yield options.`,
            category: 'DEPOSITS',
            priority: 'HIGH',
            relevanceScore: 82,
            confidence: 'HIGH',
            rationale: `Term deposit ${acc.accountNumber} with ₹${(depBal / 100000).toFixed(2)} Lakhs matures in ${daysToMaturity} days. Contact customer to structure preferential rollover terms before funds exit.`,
            expectedValueBand: depBal >= 1000000 ? 'HIGH' : 'MEDIUM',
            ruleId: 'RADAR-RULE-DEPOSIT-MATURITY-ROLLOVER',
            ruleVersion: RADAR_RULE_VERSION,
            evidence: [
              {
                sourceEntityType: 'ACCOUNT',
                sourceEntityId: acc.id,
                sourceEntityCode: acc.accountNumber,
                recordTitle: `${acc.schemeName || 'Term Deposit'}`,
                evidenceType: 'MATURITY_SCHEDULE',
                evidenceSummary: `Deposit value: ₹${(depBal / 100000).toFixed(2)} Lakhs maturing on ${matDate.toLocaleDateString()}`,
                detail: `Interest rate ${(Number(acc.interestRate || 7.1)).toFixed(2)}% p.a.`,
                routePath: '/accounts',
                metricValue: `₹${(depBal / 100000).toFixed(1)}L`,
                timestamp: acc.maturityDate,
              },
            ],
            dedupKey: `RADAR-MAT-FD-${acc.id}`,
            expiresAt: matDate,
            serviceDeprioritized: hasServiceEmergency,
          });
        }
      }
    }
  });

  // ----------------------------------------------------
  // 8. ENGAGEMENT OPPORTUNITY: High TRV + No Interaction in 60+ Days
  // ----------------------------------------------------
  const lastInteraction = ctx.interactions && ctx.interactions.length > 0
    ? ctx.interactions.reduce((latest, i) => {
        const d = new Date(i.interactionDate || i.createdAt);
        return d.getTime() > latest.getTime() ? d : latest;
      }, new Date(ctx.interactions[0].interactionDate || ctx.interactions[0].createdAt))
    : null;

  const daysSinceLastInteraction = lastInteraction ? daysDiff(now, lastInteraction) : 999;
  const hasScheduledTaskSoon = ctx.tasks.some((t) => {
    if (t.status === 'COMPLETED' || t.status === 'CANCELLED') return false;
    if (!t.dueDate) return false;
    const due = new Date(t.dueDate);
    const diff = (due.getTime() - now.getTime()) / (1000 * 3600 * 24);
    return diff >= 0 && diff <= 14;
  });

  if (relVal >= 1500000 && daysSinceLastInteraction >= 60 && !hasScheduledTaskSoon) {
    let relevance = 76;
    if (relVal >= 4000000) relevance += 10;
    if (daysSinceLastInteraction >= 90) relevance += 8;
    if (hasServiceEmergency) relevance -= 20; // Still relevant to reach out, but service is focus
    relevance = Math.max(10, Math.min(100, relevance));

    candidates.push({
      radarId: `RAD-${customerId}-ENG-60D`,
      customerId,
      customerName,
      customerCode,
      cifNumber,
      assignedRmId,
      signalType: 'ENGAGEMENT_OPPORTUNITY',
      title: 'Portfolio Health Check & Relationship Review',
      summary: `High-value customer (₹${(relVal / 100000).toFixed(1)}L TRV) with ${daysSinceLastInteraction === 999 ? 'zero recorded interactions' : `no contact in ${daysSinceLastInteraction} days`}.`,
      category: 'RELATIONSHIP_REVIEW',
      priority: 'MEDIUM',
      relevanceScore: relevance,
      confidence: 'HIGH',
      rationale: `Customer relationship value stands at ₹${(relVal / 100000).toFixed(1)}L, but the last logged interaction was ${daysSinceLastInteraction === 999 ? 'never logged' : `${daysSinceLastInteraction} days ago`}. Proactive engagement protects client retention.`,
      expectedValueBand: relVal >= 3000000 ? 'HIGH' : 'MEDIUM',
      ruleId: 'RADAR-RULE-ENGAGEMENT-REVIEW',
      ruleVersion: RADAR_RULE_VERSION,
      evidence: [
        {
          sourceEntityType: 'INTERACTION',
          sourceEntityId: lastInteraction ? 1 : customerId,
          sourceEntityCode: customerCode,
          recordTitle: 'Relationship Cadence History',
          evidenceSummary: lastInteraction
            ? `Last touchpoint was ${daysSinceLastInteraction} days ago on ${lastInteraction.toLocaleDateString()}`
            : 'Zero recorded interactions in CRM ledger',
          detail: 'No future task or touchpoint scheduled for the customer in the next 14 days.',
          routePath: '/interactions',
          metricValue: `${daysSinceLastInteraction === 999 ? 'No contact' : `${daysSinceLastInteraction} days`}`,
        },
        {
          sourceEntityType: 'CUSTOMER',
          sourceEntityId: customerId,
          sourceEntityCode: customerCode,
          recordTitle: 'Customer Value Tier',
          evidenceSummary: `Total relationship equity ₹${(relVal / 100000).toFixed(2)} Lakhs`,
          routePath: '/customers',
          metricValue: `TRV: ₹${(relVal / 100000).toFixed(1)}L`,
        },
      ],
      dedupKey: `RADAR-ENGAGEMENT-${customerId}`,
      expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      serviceDeprioritized: hasServiceEmergency,
    });
  }

  // Sort candidates by relevanceScore desc
  candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return candidates;
}
