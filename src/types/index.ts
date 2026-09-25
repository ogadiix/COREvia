export type ModuleType =
  | 'dashboard'
  | 'accounts'
  | 'customers'
  | 'onboarding'
  | 'products'
  | 'cases'
  | 'opportunities'
  | 'tasks'
  | 'lending'
  | 'payments'
  | 'trade-finance'
  | 'maker-checker'
  | 'audit-regulatory'
  | 'intelligence'
  | 'next-best-actions'
  | 'opportunity-radar'
  | 'analytics'
  | 'copilot'
  | 'interactions'
  | 'documents'
  | 'relationship-twin';

export type AccountType = 'SAVINGS' | 'CURRENT' | 'FIXED_DEPOSIT' | 'RECURRING_DEPOSIT' | 'SALARY' | 'PREMIUM_SAVINGS';

export type AccountStatus = 'ACTIVE' | 'DORMANT' | 'DEBIT_FREEZE' | 'TOTAL_FREEZE' | 'CLOSED';

export interface BankAccount {
  id?: number;
  accountNumber: string;
  maskedAccountNumber?: string;
  cifNumber: string;
  customerName: string;
  customerCode?: string;
  customerId?: number;
  accountType: AccountType;
  schemeCode: string;
  schemeName: string;
  currency: 'INR';
  availableBalance: number;
  ledgerBalance: number;
  lienAmount: number;
  unclearBalance: number;
  interestRate: number;
  openDate: string;
  lastActivityDate?: string;
  status: AccountStatus;
  branchCode: string;
  branchName: string;
  ifscCode: string;
  nomineeName?: string;
  nomineeRelation?: string;
  panNumber: string;
}

export interface BankingProduct {
  id: number;
  productCode: string;
  category: 'CASA' | 'ASSET_LOAN' | 'CARDS' | 'WEALTH' | 'INSURANCE' | 'TRADE_FINANCE';
  name: string;
  description?: string | null;
  eligibility?: string | null;
  interestRateRange?: string | null;
  minBalance?: string | number | null;
  features?: string | null;
  isActive: boolean;
  customerCount?: number;
  createdAt?: string;
}

export interface CustomerProductEnrollment {
  id: number;
  productId: number;
  productCode: string;
  productName: string;
  category: string;
  status: string;
  enrolledDate: string;
  accountId?: number | null;
  accountNumber?: string | null;
  schemeName?: string | null;
  eligibility?: string | null;
  interestRateRange?: string | null;
  minBalance?: string | null;
  features?: string | null;
}

export interface LoanRepaymentRecord {
  id: number;
  loanId: number;
  installmentNumber: number;
  dueDate: string;
  paidDate?: string | null;
  principalPaid: string | number;
  interestPaid: string | number;
  totalAmount: string | number;
  outstandingBalanceAfter: string | number;
  paymentMode: string;
  referenceNumber?: string | null;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIALLY_PAID';
}

export type RiskCategory = 'LOW' | 'MEDIUM' | 'HIGH';
export type CustomerCategory = 'INDIVIDUAL' | 'PROPRIETORSHIP' | 'PRIVATE_LIMITED' | 'PUBLIC_LIMITED' | 'TRUST_NGO';

export interface CustomerKYC {
  id?: number;
  customerCode?: string;
  coreScore?: number;
  cifNumber: string;
  name: string;
  entityType: CustomerCategory;
  cKycNumber: string;
  panNumber: string;
  aadhaarStatus: 'VERIFIED' | 'PENDING' | 'EXEMPTED';
  gstin?: string;
  riskCategory: RiskCategory;
  cibilScore: number;
  occupationOrSector: string;
  annualTurnoverOrIncome: number;
  onboardingDate: string;
  kycLastReviewedDate: string;
  kycNextReviewDue: string;
  amlAlertCount: number;
  email: string;
  phone: string;
  registeredAddress: string;
  accountsCount: number;
  totalRelationshipValue: number;
}

export type AssetClassification = 'STANDARD' | 'SMA_0' | 'SMA_1' | 'SMA_2' | 'SUB_STANDARD' | 'DOUBTFUL' | 'LOSS';
export type LoanType =
  | 'WORKING_CAPITAL_CC'
  | 'TERM_LOAN'
  | 'MSME_PRIORITY'
  | 'HOUSING_LOAN'
  | 'HOME_LOAN'
  | 'PERSONAL_LOAN'
  | 'EDUCATION_LOAN'
  | 'VEHICLE_LOAN'
  | 'BUSINESS_LOAN';

export interface LoanAccount {
  id?: number;
  loanAccountNumber: string;
  cifNumber: string;
  borrowerName: string;
  customerName?: string;
  customerCode?: string;
  customerId?: number;
  loanType: LoanType | string;
  sanctionedLimit: number;
  drawingPower: number;
  outstandingPrincipal: number;
  interestDue: number;
  interestRate: number; // e.g. 9.25%
  benchmarkRate: string; // e.g. 1-Yr MCLR + 1.15%
  tenureMonths?: number;
  relationshipManagerId?: number | null;
  rmName?: string | null;
  rmEmail?: string | null;
  sanctionDate: string;
  maturityDate: string;
  nextEmiDate: string;
  emiAmount: number;
  overdueDays: number;
  assetClassification: AssetClassification;
  collateralType: string;
  collateralValue: number;
  hypothecationDetails: string;
  prioritySector: boolean;
  provisionAmount: number;
}

export type PaymentRail = 'NEFT' | 'RTGS' | 'IMPS' | 'UPI' | 'CTS_CHEQUE';
export type TransactionStatus = 'SETTLED' | 'PENDING_CLEARING' | 'REJECTED' | 'HELD_FOR_VERIFICATION';

export interface PaymentTransaction {
  transactionId: string;
  utrNumber: string;
  rail: PaymentRail;
  timestamp: string;
  sourceAccount: string;
  sourceName: string;
  sourceBankIfsc: string;
  destAccount: string;
  destName: string;
  destBankIfsc: string;
  amount: number;
  status: TransactionStatus;
  narration: string;
  batchNumber?: string;
  settlementCycle?: string;
  chequeNumber?: string;
  returnReason?: string;
}

export type TradeInstrument = 'LETTER_OF_CREDIT' | 'BANK_GUARANTEE' | 'INLAND_BILL_DISCOUNTING' | 'IMPORT_COLLECTION';

export interface TradeFinanceItem {
  referenceNumber: string;
  instrumentType: TradeInstrument;
  applicantName: string;
  beneficiaryName: string;
  currency: 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AED' | 'SGD' | 'CHF' | 'CAD' | 'AUD' | string;
  amount: number;
  issueDate: string;
  expiryDate: string;
  status: 'ISSUED' | 'ACCEPTED' | 'SETTLED' | 'EXPIRED' | 'INVOKED';
  advisingBankIfscOrSwift: string;
  cashMarginPercentage: number;
  underlyingGoods: string;
  femaCompliant: boolean;
  fxRateApplied?: number;
  inrCounterValue?: number;
}

export type ForexSettlementType = 'TT_BUYING' | 'TT_SELLING' | 'BILL_BUYING' | 'BILL_SELLING' | 'MID_RATE';

export interface ForexRateQuote {
  pair: string; // e.g. 'USD/INR'
  baseCurrency: string; // 'USD'
  targetCurrency: string; // 'INR'
  currencyName: string; // 'US Dollar'
  symbol: string; // '$'
  flag: string; // '🇺🇸'
  unitMultiplier: number; // usually 1, except 100 for JPY
  midRate: number; // Interbank Mid Market Rate
  rbiReferenceRate: number; // Official RBI Daily Benchmark
  ttBuyingRate: number; // FEDAI TT Buy (Inward Remittances, Export Realization)
  ttSellingRate: number; // FEDAI TT Sell (Outward Remittance, Import LC Settlement)
  billBuyingRate: number; // Export Bills Discounting
  billSellingRate: number; // Import Bills Under LC
  change24h: number;
  changePercent24h: number;
  dayHigh: number;
  dayLow: number;
  lastUpdated: string;
  status: 'LIVE' | 'INDICATIVE' | 'RBI_BENCHMARK';
  historicalTrend?: number[]; // last 7 days mid rates
}

export interface ForexRatesPayload {
  baseCurrency: string; // default 'INR' or 'USD'
  timestamp: string;
  source: string;
  isLiveFeed: boolean;
  quotes: ForexRateQuote[];
}

export interface CrossBorderConversionRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  settlementType: ForexSettlementType;
  tradeInstrument?: TradeInstrument | 'OUTWARD_REMITTANCE_A2' | 'EXPORT_REALIZATION' | 'GENERAL_CONVERSION';
  cashMarginPercentage?: number;
}

export interface CrossBorderConversionResult {
  sourceAmount: number;
  sourceCurrency: string;
  targetCurrency: string;
  appliedRate: number;
  rateType: ForexSettlementType;
  rateTypeLabel: string;
  grossTargetAmount: number;
  bankSpreadPercentage: number;
  spreadAmountInr: number;
  gstOnForexInr: number; // CGST Rule 32(2) compliance
  totalSettlementInr: number;
  cashMarginRequiredInr?: number;
  effectiveExchangeRate: number;
  femaComplianceCategory: string;
  rateTimestamp: string;
  rbiReferenceBenchmark: number;
}

export type MakerCheckerAction =
  | 'HIGH_VALUE_DEBIT'
  | 'RTGS_OUTWARD_APPROVAL'
  | 'ACCOUNT_LIEN_MARK'
  | 'ACCOUNT_STATUS_CHANGE'
  | 'LOAN_LIMIT_REVISION'
  | 'CASH_VAULT_DEPOSIT'
  | 'KYC_RISK_OVERRIDE';

export interface BiometricVerificationPayload {
  verified: boolean;
  method: 'FINGERPRINT_STQC_L1' | 'FACE_ID_LIVENESS' | 'HARDWARE_TOKEN_FALLBACK';
  tokenHash: string;
  verifiedAt: string;
  officerEmployeeId: string;
  officerName: string;
  terminalId: string;
  qualityScore?: number;
}

export interface PendingAuthorization {
  id: string;
  voucherNumber: string;
  timestamp: string;
  actionType: MakerCheckerAction;
  description: string;
  makerUserId: string;
  makerUserName: string;
  makerRole: string;
  accountNumber?: string;
  cifNumber?: string;
  amount?: number;
  criticality: 'NORMAL' | 'HIGH' | 'CRITICAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  auditReason: string;
  details: Record<string, string | number | boolean>;
  biometricVerification?: BiometricVerificationPayload;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operatorId: string;
  operatorName: string;
  terminalId: string;
  module: string;
  action: string;
  recordIdentifier: string;
  ipAddress: string;
  authorizationLevel: string;
  severity: 'INFO' | 'NOTICE' | 'WARNING' | 'ALERT';
  rbiReportable: boolean;
}

export interface BankExecutiveMetrics {
  totalDepositsInr: number;
  totalAdvancesInr: number;
  casaRatioPercentage: number;
  crrMaintainedPercentage: number; // Statutory CRR target 4.50%
  slrMaintainedPercentage: number; // Statutory SLR target 18.00%
  netDemandAndTimeLiabilities: number; // NDTL
  crarCapitalAdequacyPercentage: number; // RBI Norm: > 11.5%
  grossNpaPercentage: number;
  netNpaPercentage: number;
  dailyClearingVolumeInr: number;
  dailyClearingTransactionsCount: number;
  vaultCashInHandInr: number;
  vaultCashAuthorizedLimitInr: number;
  pendingMakerCheckerCount: number;
  activeBranchesCount: number;
}

// ----------------------------------------------------
// PHASE 10: RELATIONSHIP INTELLIGENCE ENGINE TYPES
// ----------------------------------------------------

export type InsightType =
  | 'RELATIONSHIP_RISK'
  | 'GROWTH_OPPORTUNITY'
  | 'SERVICE_CONCERN'
  | 'ENGAGEMENT_SIGNAL'
  | 'OPERATIONAL_SIGNAL';

export type InsightCategory =
  | 'SCORE_DECLINE'
  | 'ENGAGEMENT_DECLINE'
  | 'SERVICE_DETERIORATION'
  | 'OPERATIONAL_NEGLECT'
  | 'PRODUCT_DEPTH_GAP'
  | 'RELATIONSHIP_EXPANSION'
  | 'HIGH_PROBABILITY_DEAL'
  | 'SLA_AT_RISK'
  | 'SLA_BREACHED'
  | 'REPEATED_ISSUE'
  | 'HIGH_PRIORITY_CASE'
  | 'OPPORTUNITY_STAGNATION'
  | 'OPPORTUNITY_CLOSING_RISK'
  | 'TASK_OVERDUE'
  | 'MULTIPLE_PENDING_TASKS'
  | 'INTERACTION_SPIKE'
  | 'GENERAL';

export type InsightPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type InsightConfidence = 'LOW' | 'MEDIUM' | 'HIGH';
export type InsightStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'EXPIRED';

export type SourceEntityType =
  | 'CUSTOMER'
  | 'ACCOUNT'
  | 'CASE'
  | 'OPPORTUNITY'
  | 'TASK'
  | 'INTERACTION'
  | 'CORE_SCORE';

export interface InsightEvidence {
  id?: string;
  sourceType: SourceEntityType;
  sourceId: string | number;
  sourceCode: string; // e.g. CASE-004, TSK-012, OPP-002, INT-041, SCORE-001
  recordTitle: string;
  detail: string;
  timestamp?: string;
  metricValue?: string | number;
  routePath?: string; // Route link to view record in CRM
}

export interface CustomerInsight {
  id: number;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  cifNumber?: string;
  insightId: string;
  insightType: InsightType;
  category: InsightCategory | string;
  title: string;
  summary: string;
  description: string;
  impact: string;
  priority: InsightPriority;
  confidence: InsightConfidence;
  confidenceScore: number;
  status: InsightStatus;
  detectedAt: string;
  validUntil?: string | null;
  sourceEntityType: SourceEntityType;
  sourceEntityId: string;
  evidence: InsightEvidence[];
  recommendedActionType?: string | null;
  recommendedActionContext?: string | null;
  ruleVersion: string;
  dedupKey: string;
  isDismissed?: boolean;
  actionPrompt?: string | null;
  assignedRmName?: string;
  customerSegment?: string;
  customerRiskCategory?: string;
  acknowledgedById?: number | null;
  acknowledgedByName?: string | null;
  acknowledgedAt?: string | null;
  acknowledgementNote?: string | null;
  resolvedAt?: string | null;
  resolutionType?: 'AUTOMATIC' | 'MANUAL' | null;
  resolutionNote?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RelationshipIntelligenceSummary {
  totalActive: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  byType: {
    relationshipRisk: number;
    growthOpportunity: number;
    serviceConcern: number;
    engagementSignal: number;
    operationalSignal: number;
  };
  acknowledgedCount: number;
  resolvedCount: number;
  staleCount: number;
}

// ----------------------------------------------------
// Phase 11: Next Best Action Engine Types
// ----------------------------------------------------

export type ActionType =
  | 'SERVICE'
  | 'ENGAGEMENT'
  | 'OPPORTUNITY'
  | 'TASK'
  | 'RELATIONSHIP'
  | 'PRODUCT';

export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type ActionUrgency = 'IMMEDIATE' | 'TODAY' | 'SOON' | 'PLANNED';

export type ActionStatus = 'ACTIVE' | 'ACCEPTED' | 'DISMISSED' | 'COMPLETED' | 'EXPIRED';

export interface ActionEvidence {
  id?: number | string;
  sourceEntityType: SourceEntityType | string;
  sourceEntityId: string | number;
  sourceEntityCode: string;
  recordTitle: string;
  evidenceType?: string;
  evidenceSummary?: string;
  detail: string;
  routePath?: string;
  metricValue?: string | number;
  timestamp?: string;
}

export interface NextBestAction {
  id: number;
  actionId: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  cifNumber?: string;
  assignedRmId?: number | null;
  assignedRmName?: string | null;
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
  isTopRecommendation: boolean;
  status: ActionStatus;
  ruleId: string;
  ruleVersion: string;
  sourceEntityType: SourceEntityType | string;
  sourceEntityId: string;
  sourceEntityCode?: string | null;
  evidence: ActionEvidence[];
  actionRoute?: string | null;
  targetEntityContext?: string | null;
  dismissedReason?: string | null;
  dismissedById?: number | null;
  dismissedByName?: string | null;
  dismissedAt?: string | null;
  acceptedById?: number | null;
  acceptedByName?: string | null;
  acceptedAt?: string | null;
  completedAt?: string | null;
  createdTaskId?: number | null;
  generatedAt: string;
  expiresAt?: string | null;
  dedupKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyRelationshipBrief {
  actNow: NextBestAction[];
  followUp: NextBestAction[];
  watch: {
    customerId: number;
    customerName: string;
    customerCode: string;
    cifNumber: string;
    coreScore: number;
    relationshipBand: string;
    reasons: string[];
    topAction?: NextBestAction;
  }[];
  opportunities: {
    opportunityId: number;
    opportunityCode: string;
    title: string;
    customerId: number;
    customerName: string;
    expectedValue: number;
    probability: number;
    stage: string;
    expectedCloseDate: string;
    action?: NextBestAction;
  }[];
  summaryStats: {
    totalActiveActions: number;
    criticalActions: number;
    serviceFirstAlerts: number;
    immediateUrgencyCount: number;
  };
}

// ----------------------------------------------------
// Phase 12: Customer Opportunity Radar Types
// ----------------------------------------------------

export type RadarSignalType =
  | 'PRODUCT_COVERAGE_GAP'
  | 'RELATIONSHIP_EXPANSION'
  | 'OPPORTUNITY_FOLLOWUP'
  | 'RENEWAL_MATURITY'
  | 'ENGAGEMENT_OPPORTUNITY'
  | 'SERVICE_FIRST_RECOVERY';

export type RadarCategory =
  | 'INVESTMENTS'
  | 'LENDING'
  | 'DEPOSITS'
  | 'CARDS'
  | 'INSURANCE'
  | 'RELATIONSHIP_REVIEW'
  | 'TRADE_FINANCE';

export type RadarPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RadarStatus =
  | 'DETECTED'
  | 'REVIEW_SUGGESTED'
  | 'ACCEPTED'
  | 'CONVERTED'
  | 'DISMISSED'
  | 'EXPIRED';

export interface RadarEvidence {
  id?: number | string;
  sourceEntityType: string;
  sourceEntityId: string | number;
  sourceEntityCode: string;
  recordTitle: string;
  evidenceType?: string;
  evidenceSummary: string;
  detail?: string;
  routePath?: string;
  metricValue?: string | number;
  timestamp?: string;
}

export interface OpportunityRadarSignal {
  id: number;
  radarId: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  cifNumber?: string;
  assignedRmId?: number | null;
  assignedRmName?: string | null;
  signalType: RadarSignalType;
  title: string;
  summary: string;
  category: RadarCategory | string;
  priority: RadarPriority;
  relevanceScore: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
  expectedValueBand?: string | null;
  status: RadarStatus;
  ruleId: string;
  ruleVersion: string;
  detectedAt: string;
  expiresAt?: string | null;
  convertedOpportunityId?: number | null;
  convertedOpportunityCode?: string | null;
  convertedOpportunityTitle?: string | null;
  existingOpportunityId?: number | null;
  existingOpportunityCode?: string | null;
  existingOpportunityTitle?: string | null;
  targetProductId?: number | null;
  targetProductCode?: string | null;
  targetProductName?: string | null;
  dismissedReason?: string | null;
  dismissedById?: number | null;
  dismissedByName?: string | null;
  dismissedAt?: string | null;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  evidence: RadarEvidence[];
  evidenceCount?: number;
  dedupKey: string;
  createdAt: string;
  updatedAt: string;
  serviceDeprioritized?: boolean;
  healthGateApplied?: boolean;
}

export interface RadarSummaryStats {
  totalActiveSignals: number;
  highPriorityCount: number;
  productGapsCount: number;
  relationshipOpportunitiesCount: number;
  expiringSoonCount: number;
  convertedThisMonthCount: number;
  signalsByCategory: Record<string, number>;
  signalsBySignalType: Record<string, number>;
}

// ----------------------------------------------------
// PHASE 15: NOTIFICATIONS & INTELLIGENT ALERTS TYPES
// ----------------------------------------------------

export type NotificationCategory =
  | 'SERVICE'
  | 'ENGAGEMENT'
  | 'TASK'
  | 'OPPORTUNITY'
  | 'RELATIONSHIP'
  | 'CUSTOMER'
  | 'OPERATIONAL'
  | 'SYSTEM';

export type NotificationType =
  | 'SERVICE_SLA_AT_RISK'
  | 'SERVICE_SLA_BREACHED'
  | 'SERVICE_CASE_ESCALATED'
  | 'SERVICE_CASE_ASSIGNED'
  | 'SERVICE_CASE_RESOLVED'
  | 'TASK_OVERDUE'
  | 'TASK_DUE_SOON'
  | 'TASK_ASSIGNED'
  | 'TASK_REASSIGNED'
  | 'OPPORTUNITY_CLOSING_SOON'
  | 'OPPORTUNITY_STALLED'
  | 'OPPORTUNITY_ASSIGNED'
  | 'OPPORTUNITY_STAGE_CHANGED'
  | 'RELATIONSHIP_SCORE_DECLINED'
  | 'RELATIONSHIP_SCORE_IMPROVED'
  | 'RELATIONSHIP_INTELLIGENCE_ALERT'
  | 'RELATIONSHIP_MOMENTUM_CHANGED'
  | 'NEXT_BEST_ACTION_AVAILABLE'
  | 'OPPORTUNITY_RADAR_SIGNAL'
  | 'CUSTOMER_ACTIVITY_CHANGE'
  | 'CUSTOMER_SERVICE_CONCERN'
  | 'SYSTEM_ALERT'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_REVIEW_REQUIRED'
  | 'DOCUMENT_REJECTED'
  | 'DOCUMENT_REPLACEMENT_REQUIRED'
  | 'DOCUMENT_EXPIRING'
  | 'DOCUMENT_EXPIRED'
  | 'DOCUMENT_REQUIREMENT_MISSING';

export type NotificationSeverity = 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';

export type NotificationStatus = 'UNREAD' | 'READ' | 'ACKNOWLEDGED' | 'DISMISSED' | 'EXPIRED';

export interface NotificationItem {
  id: number;
  userId: number;
  customerId?: number | null;
  customerName?: string | null;
  customerCode?: string | null;
  notificationType: NotificationType;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionLabel?: string | null;
  actionUrl?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  metadata?: Record<string, any> | null;
  status: NotificationStatus;
  isRead?: boolean;
  linkUrl?: string | null;
  readAt?: string | null;
  acknowledgedAt?: string | null;
  expiresAt?: string | null;
  dedupKey?: string | null;
  createdAt: string;
}

export interface UserNotificationPreferences {
  id?: number;
  userId: number;
  serviceAlerts: boolean;
  taskAlerts: boolean;
  opportunityAlerts: boolean;
  relationshipAlerts: boolean;
  customerActivity: boolean;
  operationalAlerts: boolean;
  systemAlerts: boolean;
  criticalAlertsLocked?: boolean;
  updatedAt?: string;
}

export interface NotificationFilter {
  status?: NotificationStatus | 'ALL' | 'UNREAD';
  category?: NotificationCategory | 'ALL';
  severity?: NotificationSeverity | 'ALL';
  notificationType?: NotificationType;
  customerId?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface NotificationSummaryStats {
  totalCount: number;
  unreadCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  serviceCount: number;
  taskCount: number;
  opportunityCount: number;
  relationshipCount: number;
}

// ----------------------------------------------------
// PHASE 22: ONBOARDING & KYC WORKSPACE TYPES
// ----------------------------------------------------
export type OnboardingStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'DOCUMENT_REVIEW'
  | 'KYC_REVIEW'
  | 'ADDITIONAL_INFORMATION'
  | 'COMPLIANCE_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'COMPLETED';

export type KycStatus =
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'FAILED'
  | 'EXPIRED';

export type KybStatus =
  | 'NOT_APPLICABLE'
  | 'NOT_STARTED'
  | 'IN_REVIEW'
  | 'VERIFIED'
  | 'ADDITIONAL_INFORMATION_REQUIRED'
  | 'FAILED';

export type OnboardingDocumentStatus =
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REPLACEMENT_REQUIRED';

export type SlaStatus = 'ON_TRACK' | 'AT_RISK' | 'BREACHED';

export type ExceptionStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WAIVED';

export type ExceptionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface OnboardingProductItem {
  id: number;
  applicationId: number;
  productId?: number | null;
  productName: string;
  productCode: string;
  category: string;
  status: 'REQUESTED' | 'APPROVED' | 'PROVISIONED' | 'REJECTED';
  initialDepositAmount?: string | number;
  notes?: string | null;
}

export interface KycReviewItem {
  id: number;
  applicationId: number;
  customerId?: number | null;
  identityStatus: string;
  addressStatus: string;
  contactStatus: string;
  panVerificationStatus: string;
  panNumber?: string | null;
  aadhaarStatus?: string | null;
  ckycNumber?: string | null;
  pepStatus: string;
  sanctionsCheckStatus: string;
  adverseMediaStatus: string;
  riskCategory: string;
  status: KycStatus;
  reviewSummary?: string | null;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  simulationDisclaimer?: string;
  updatedAt?: string;
}

export interface KybReviewItem {
  id: number;
  applicationId: number;
  legalEntityName: string;
  entityType: string;
  cinOrRegistrationNumber?: string | null;
  gstin?: string | null;
  incorporationDate?: string | null;
  registeredAddress?: string | null;
  uboVerificationStatus: string;
  uboCount: number;
  boardResolutionStatus: string;
  authorizedSignatoriesStatus: string;
  status: KybStatus;
  reviewerId?: number | null;
  reviewerName?: string | null;
  reviewedAt?: string | null;
  simulationDisclaimer?: string;
  updatedAt?: string;
}

export interface OnboardingDocumentItem {
  id: number;
  documentCode: string;
  applicationId: number;
  documentType: string;
  title: string;
  fileName: string;
  fileSize: string;
  mimeType: string;
  status: OnboardingDocumentStatus;
  uploadedById?: number | null;
  uploadedByName?: string | null;
  uploadedAt: string;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  expiryDate?: string | null;
  rejectionReason?: string | null;
  replacementReason?: string | null;
  requestedDocType?: string | null;
  replacementDueDate?: string | null;
  version: number;
  metadata?: string | null;
}

export interface OnboardingExceptionItem {
  id: number;
  exceptionCode: string;
  applicationId: number;
  applicationNumber?: string;
  applicantName?: string;
  type: string;
  severity: ExceptionSeverity;
  title: string;
  description: string;
  status: ExceptionStatus;
  ownerId?: number | null;
  ownerName?: string | null;
  dueDate?: string | null;
  resolution?: string | null;
  resolvedById?: number | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  waiveReason?: string | null;
  waivedById?: number | null;
  waivedByName?: string | null;
  waivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingEventItem {
  id: number;
  applicationId: number;
  eventType: string;
  actorId?: number | null;
  actorName: string;
  actorRole: string;
  title: string;
  description?: string | null;
  metadata?: string | null;
  createdAt: string;
}

export interface OnboardingApplicationItem {
  id: number;
  applicationNumber: string;
  customerId?: number | null;
  customerCode?: string | null;
  applicantName: string;
  customerType: 'INDIVIDUAL' | 'BUSINESS';
  onboardingType: string;
  assignedRmId?: number | null;
  assignedRmName?: string | null;
  assignedOfficerId?: number | null;
  assignedOfficerName?: string | null;
  branchCode: string;
  branchName: string;
  submittedDate?: string | null;
  lastUpdated: string;
  status: OnboardingStatus;
  kycStatus: KycStatus;
  kybStatus: KybStatus;
  documentStatus: string;
  riskReviewStatus: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  slaHoursTotal: number;
  slaHoursRemaining: number;
  slaStatus: SlaStatus;
  slaDeadline?: string | null;
  exceptionCount: number;
  opportunityId?: number | null;
  opportunityTitle?: string | null;
  notes?: string | null;
  rejectionReason?: string | null;
  approvedById?: number | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  completedById?: number | null;
  completedByName?: string | null;
  completedAt?: string | null;
  createdBy?: number | null;
  createdAt: string;
  updatedAt: string;
  products?: OnboardingProductItem[];
  kycReview?: KycReviewItem | null;
  kybReview?: KybReviewItem | null;
  documents?: OnboardingDocumentItem[];
  exceptions?: OnboardingExceptionItem[];
  events?: OnboardingEventItem[];
}

export interface OnboardingSummaryMetrics {
  totalApplications: number;
  submittedCount: number;
  kycPendingCount: number;
  kybPendingCount: number;
  complianceReviewCount: number;
  approvedCount: number;
  completedCount: number;
  rejectedCount: number;
  openExceptionsCount: number;
  slaAtRiskCount: number;
  slaBreachedCount: number;
  avgProcessingTimeHours: number;
  documentRejectionRatePercent: number;
  completionRatePercent: number;
}

// ====================================================
// PHASE 24 — CUSTOMER COMMUNICATION & INTERACTION HUB
// ====================================================

export type InteractionType =
  | 'CALL'
  | 'EMAIL'
  | 'MEETING'
  | 'VIDEO_MEETING'
  | 'BRANCH_VISIT'
  | 'CHAT'
  | 'MESSAGE'
  | 'SERVICE_CONTACT'
  | 'RELATIONSHIP_REVIEW'
  | 'ONBOARDING_CONTACT'
  | 'OTHER';

export type InteractionOutcome =
  | 'NO_ACTION_REQUIRED'
  | 'FOLLOW_UP_REQUIRED'
  | 'OPPORTUNITY_IDENTIFIED'
  | 'OPPORTUNITY_PROGRESS'
  | 'SERVICE_RESOLVED'
  | 'SERVICE_ESCALATED'
  | 'DOCUMENT_REQUESTED'
  | 'ONBOARDING_PROGRESS'
  | 'COMMITMENT_MADE'
  | 'CUSTOMER_REQUEST'
  | 'OTHER';

export type InteractionChannel =
  | 'PHONE'
  | 'EMAIL'
  | 'IN_PERSON'
  | 'VIDEO'
  | 'CHAT'
  | 'MESSAGE'
  | 'BRANCH'
  | 'PORTAL'
  | 'OTHER';

export type InteractionSentiment = 'POSITIVE' | 'NEUTRAL' | 'CONCERNED' | 'ESCALATED';

export interface InteractionParticipant {
  id?: number;
  interactionId?: number;
  participantType?: 'CUSTOMER' | 'RM' | 'SPECIALIST' | 'COMPLIANCE_OFFICER' | 'THIRD_PARTY';
  type?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  attended: boolean;
}

export interface InteractionLink {
  id?: number;
  interactionId?: number;
  linkType: 'CUSTOMER' | 'OPPORTUNITY' | 'CASE' | 'TASK' | 'RELATIONSHIP_REVIEW' | 'ONBOARDING_APPLICATION';
  linkId: string;
  title?: string | null;
  metadata?: string | null;
}

export interface InteractionCommitment {
  id?: number;
  interactionId?: number;
  commitmentType: 'CUSTOMER_COMMITMENT' | 'RM_COMMITMENT';
  description: string;
  ownerName?: string | null;
  dueDate?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  createdTaskId?: number | null;
  createdAt?: string;
  completedAt?: string | null;
}

export interface InteractionItem {
  id: number;
  interactionReference: string; // e.g. INT-2026-000482
  customerId: number;
  customerName?: string;
  customerCode?: string;
  channel: InteractionChannel;
  interactionType: InteractionType;
  subject: string;
  summary: string;
  outcome: InteractionOutcome;
  sentiment?: InteractionSentiment;
  ownerId?: number | null;
  ownerName?: string | null;
  agentId?: number | null;
  agentName?: string | null;
  duration: number; // minutes
  participants: InteractionParticipant[];
  followupRequired: boolean;
  followupDate?: string | null;
  followupOwnerId?: number | null;
  followupOwnerName?: string | null;
  followupAction?: string | null;
  followupPriority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  followupTaskId?: number | null;
  customerCommitment?: string | null;
  customerCommitmentTaskId?: number | null;
  rmCommitment?: string | null;
  rmCommitmentTaskId?: number | null;
  linkedOpportunityId?: number | null;
  linkedOpportunityTitle?: string | null;
  linkedCaseId?: number | null;
  linkedCaseNumber?: string | null;
  linkedTaskId?: number | null;
  linkedTaskTitle?: string | null;
  linkedRelationshipReview?: string | null;
  linkedOnboardingId?: number | null;
  linkedOnboardingNumber?: string | null;
  createdBy?: number | null;
  createdByName?: string | null;
  updatedBy?: number | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  commitments?: InteractionCommitment[];
  links?: InteractionLink[];
}

export interface CommunicationProfile {
  totalInteractions: number;
  lastInteractionDate: string | null;
  lastInteractionType: InteractionType | null;
  lastRmContactDate: string | null;
  lastServiceContactDate: string | null;
  lastMeetingDate: string | null;
  openFollowUpsCount: number;
  overdueFollowUpsCount: number;
  preferredRecordedChannel: InteractionChannel | string;
  frequencyRating: 'HIGH' | 'MODERATE' | 'LOW' | 'INACTIVE';
  monthlyAverage: number;
}

export interface EngagementTrendPeriod {
  periodLabel: string;
  calls: number;
  meetings: number;
  emails: number;
  serviceContacts: number;
  other: number;
  total: number;
}

export interface EngagementTrendData {
  timeframe: '7d' | '30d' | '90d' | '12m';
  periods: EngagementTrendPeriod[];
  summary: {
    totalCalls: number;
    totalMeetings: number;
    totalEmails: number;
    totalServiceContacts: number;
    totalOther: number;
    grandTotal: number;
  };
}

export interface InteractionMetricsOverview {
  totalInteractions: number;
  myInteractionsCount: number;
  recentCount: number;
  followUpsRequiredCount: number;
  followUpsCreatedCount: number;
  followUpsCompletedCount: number;
  followUpsOverdueCount: number;
  linkedToOpportunitiesCount: number;
  linkedToCasesCount: number;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  byOutcome: Record<string, number>;
}

// ----------------------------------------------------
// PHASE 25: BANKING DOCUMENT INTELLIGENCE TYPES
// ----------------------------------------------------

export type DocumentCategory =
  | 'IDENTITY'
  | 'ADDRESS'
  | 'FINANCIAL'
  | 'BUSINESS'
  | 'BANKING'
  | 'RELATIONSHIP';

export type DocumentStatus =
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'REPLACEMENT_REQUIRED'
  | 'ARCHIVED';

export type DocumentReviewStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'REPLACEMENT_REQUESTED';

export type DocumentType =
  | 'PAN'
  | 'Aadhaar Card'
  | 'Passport'
  | 'Voter ID'
  | 'Driving License'
  | 'Salary Slip'
  | 'Bank Statement'
  | 'Income Tax Returns'
  | 'Audited Balance Sheet'
  | 'Form 16'
  | 'Board Resolution'
  | 'Certificate of Incorporation'
  | 'GST Registration Certificate'
  | 'Utility Bill'
  | 'Loan Agreement'
  | 'Property Title Deed'
  | 'Other';

export type DocumentVisibility = 'INTERNAL' | 'CLIENT_VISIBLE' | 'RESTRICTED';

export type DocumentRelatedEntityType =
  | 'CUSTOMER'
  | 'ONBOARDING'
  | 'LOAN'
  | 'CASE'
  | 'OPPORTUNITY'
  | 'RELATIONSHIP_REVIEW'
  | 'ACCOUNT'
  | 'TASK';

export interface DocumentItem {
  id: number;
  documentCode: string; // e.g. DOC-2026-004821
  title?: string;
  documentType: string; // PAN, Aadhaar, Salary Slip, etc.
  category: DocumentCategory;
  customerId: number;
  customerName: string;
  customerCode?: string | null;
  customer?: any;
  relatedEntityType: DocumentRelatedEntityType;
  relatedEntityId?: string | null;
  fileName: string;
  fileSize?: string | null;
  mimeType?: string | null;
  storageKey?: string | null;
  version: number;
  currentVersion?: number;
  status: DocumentStatus;
  reviewStatus: DocumentReviewStatus;
  uploadedById?: number | null;
  uploadedByName?: string | null;
  uploadedAt: string;
  reviewedById?: number | null;
  reviewedByName?: string | null;
  reviewedAt?: string | null;
  expiryDate?: string | null;
  rejectionReason?: string | null;
  replacementRequired: boolean;
  replacementReason?: string | null;
  replacementDocType?: string | null;
  replacementDueDate?: string | null;
  visibility: DocumentVisibility;
  description?: string | null;
  isSynthetic: boolean;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  // Associated relations when loaded
  versions?: DocumentVersionItem[];
  reviews?: DocumentReviewItem[];
  links?: DocumentLinkItem[];
  extractions?: DocumentExtractionItem[];
  activeTask?: any | null;
}

export interface DocumentVersionItem {
  id: number;
  documentId: number;
  version: number;
  fileName: string;
  fileSize?: string | null;
  mimeType?: string | null;
  storageKey?: string | null;
  status: DocumentStatus;
  reviewStatus: DocumentReviewStatus;
  uploadedById?: number | null;
  uploadedByName?: string | null;
  uploadedAt: string;
  changeReason?: string | null;
  rejectionReason?: string | null;
  metadata?: any;
  createdAt: string;
}

export type RequirementStatus =
  | 'MISSING'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'REJECTED'
  | 'REPLACEMENT_REQUIRED'
  | 'WAIVED';

export interface DocumentRequirementItem {
  id: number;
  requirementCode: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  relatedEntityType: DocumentRelatedEntityType;
  relatedEntityId?: string | null;
  documentType: string;
  category: DocumentCategory;
  isMandatory: boolean;
  status: RequirementStatus;
  fulfilledDocumentId?: number | null;
  fulfilledDocumentCode?: string | null;
  notes?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentReviewItem {
  id: number;
  documentId: number;
  version: number;
  reviewerId?: number | null;
  reviewerName: string;
  decision: 'VERIFIED' | 'REJECTED' | 'REPLACEMENT_REQUESTED' | 'UNDER_REVIEW';
  comments?: string | null;
  rejectionReason?: string | null;
  replacementDocType?: string | null;
  replacementDueDate?: string | null;
  reviewedAt: string;
  createdAt: string;
}

export interface DocumentLinkItem {
  id: number;
  documentId: number;
  entityType: DocumentRelatedEntityType;
  entityId: string;
  entityTitle?: string | null;
  relationship: string;
  createdById?: number | null;
  createdAt: string;
}

export interface DocumentExtractionItem {
  id: number;
  documentId: number;
  version: number;
  fieldName: string;
  extractedValue?: string | null;
  confidence?: number | null;
  verificationStatus: 'NOT_VERIFIED' | 'HUMAN_VERIFIED' | 'REJECTED';
  verifiedById?: number | null;
  verifiedByName?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentIntelligenceSignal {
  id: string;
  type:
    | 'MISSING_REQUIRED'
    | 'EXPIRED'
    | 'EXPIRING_SOON'
    | 'AWAITING_REVIEW'
    | 'REJECTED'
    | 'REPLACEMENT_REQUESTED'
    | 'MULTIPLE_VERSIONS'
    | 'REVIEW_OVERDUE';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
  documentId?: number;
  documentCode?: string;
  customerId: number;
  customerName: string;
  relatedEntity?: string;
  actionPrompt: string;
  daysRemaining?: number;
}

export interface DocumentMetricsOverview {
  totalDocuments: number;
  pendingReviewCount: number;
  verifiedCount: number;
  rejectedCount: number;
  replacementRequiredCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  missingRequirementsCount: number;
  averageReviewTimeHours: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
}

// ====================================================
// PHASE 26: RELATIONSHIP DIGITAL TWIN TYPES
// ====================================================

export type RelationshipState =
  | 'STABLE'
  | 'GROWING'
  | 'ENGAGED'
  | 'ATTENTION_REQUIRED'
  | 'SERVICE_RECOVERY'
  | 'OPPORTUNITY_ACTIVE'
  | 'ONBOARDING_ACTIVE'
  | 'FOLLOW_UP_REQUIRED';

export interface RelationshipEvidenceItem {
  title: string;
  engine: string;
  metric?: string;
  entityType?: string;
  entityId?: string | number;
  link?: string;
  details?: string;
  severity?: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE';
}

export interface RelationshipStateRecord {
  id?: number;
  customerId: number;
  state: RelationshipState;
  previousState?: string;
  reason: string;
  evidence: RelationshipEvidenceItem[];
  source: string;
  calculatedAt: string;
}

export interface RelationshipEvent {
  id: number;
  eventId: string;
  customerId: number;
  eventType: string;
  sourceEntity: string;
  sourceId: string;
  timestamp: string;
  title: string;
  description?: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  metadata?: any;
}

export interface RelationshipMaterialChange {
  category: 'CORE_SCORE' | 'SERVICE' | 'OPPORTUNITY' | 'DOCUMENT' | 'INTERACTION' | 'TASK' | 'PRODUCT';
  changeType: 'NEW' | 'CHANGED' | 'RESOLVED' | 'ESCALATED' | 'DECLINED' | 'IMPROVED';
  title: string;
  oldValue?: string | number;
  newValue?: string | number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'POSITIVE';
  evidence?: string;
  source?: string;
}

export interface RelationshipSnapshot {
  id?: number;
  snapshotCode: string;
  customerId: number;
  snapshotDate: string;
  state: RelationshipState;
  coreScore: number;
  previousCoreScore?: number;
  relationshipValue: number;
  activeProductsCount: number;
  openOpportunitiesCount: number;
  openCasesCount: number;
  openTasksCount: number;
  relationshipMomentum: string;
  metrics: {
    coreScore: number;
    relationshipMomentum: string;
    engagementScore: number;
    productDepthScore: number;
    serviceHealthScore: number;
    opportunityScore: number;
    taskCompletionScore: number;
  };
  summary: string;
  materialChanges?: RelationshipMaterialChange[];
  isMeaningful: boolean;
  createdAt?: string;
}

export interface RelationshipSignal {
  id?: number;
  signalCode: string;
  customerId: number;
  signalType: string;
  headline: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE';
  evidence: string | any;
  source: string;
  recommendedAction?: string;
  linkedNbaId?: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
  resolvedAt?: string;
  resolvedById?: number;
  resolutionNotes?: string;
  timestamp: string;
}

export interface RelationshipStateMapNode {
  id: string;
  name: string;
  status: 'NORMAL' | 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'ATTENTION';
  keyMetric: string;
  signalCount: number;
  description: string;
  items: string[];
}

export interface RelationshipHealthMetric {
  metric: string;
  value: number | string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  source: string;
  lastUpdated: string;
  benchmark?: string;
}

export interface RelationshipHeldProduct {
  id: number;
  productCode: string;
  name: string;
  category: string;
  status: string;
  openedDate: string;
  balanceOrLimit?: string;
  usageContext?: string;
  relationshipRelevance: string;
}

export interface RelationshipProductWhitespace {
  productCode: string;
  name: string;
  category: string;
  rationale: string;
  sourceEngine: string;
  potentialValue?: string;
  opportunityCode?: string;
}

export interface RelationshipCommitmentItem {
  id: string | number;
  title: string;
  dueDate: string;
  isOverdue: boolean;
  source: 'TASK' | 'REVIEW' | 'INTERACTION' | 'ONBOARDING' | 'DOCUMENT';
  recordId?: any;
  assigneeName?: string;
  status: string;
}

export interface BeforeYouActAdvisory {
  customerName: string;
  customerCode: string;
  relationshipState: RelationshipState;
  relevantContext: string[];
  potentialImplications: string[];
  sources: string[];
  recommendedPrecautions: string[];
}

export interface RelationshipActionTraceItem {
  id?: number;
  traceCode: string;
  customerId: number;
  actionTitle: string;
  actionType: string;
  originEngine: string;
  evidenceRef?: string;
  evidenceSummary?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'EXECUTED' | 'CANCELLED';
  outcomeSummary?: string;
  entityImpact?: string;
  nextStep?: string;
  executedById?: number;
  executedAt?: string;
  createdAt: string;
}

export type RelationshipActionTrace = RelationshipActionTraceItem;

export interface RelationshipTwinOverview {
  customer: {
    id: number;
    customerCode: string;
    cifNumber: string;
    name: string;
    segment: string;
    riskCategory: string;
    rmName?: string;
    occupationOrSector?: string;
    annualTurnoverOrIncome?: string;
    cibilScore?: number;
    panNumber?: string;
    aadhaarStatus?: string;
  };
  header: {
    customerCode: string;
    relationshipValue: number;
    formattedRelationshipValue: string;
    productsCount: number;
    coreScore: number;
    previousCoreScore?: number;
    relationshipMomentum: string;
    relationshipStatus: RelationshipState;
    lastInteractionDate?: string;
    lastInteractionSummary?: string;
    openOpportunitiesCount: number;
    openCasesCount: number;
    openTasksCount: number;
    activeOnboardingStatus: string;
  };
  state: RelationshipStateRecord;
  whyThisState: Array<{
    reason: string;
    engine: string;
    link?: { module: string; id?: any };
    details: string;
    severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'POSITIVE';
  }>;
  whatChanged: RelationshipMaterialChange[];
  signals: RelationshipSignal[];
  timeline: RelationshipEvent[];
  stateMap: {
    nodes: RelationshipStateMapNode[];
  };
  healthBreakdown: RelationshipHealthMetric[];
  productMap: {
    heldProducts: RelationshipHeldProduct[];
    whitespaceRecommendations: RelationshipProductWhitespace[];
  };
  serviceMap: {
    openCases: any[];
    recentCases: any[];
    slaRiskCases: any[];
    serviceHealthScore: number;
    serviceHealthStatus: string;
  };
  growthMap: {
    openOpportunities: any[];
    pipelineValue: number;
    formattedPipelineValue: string;
    stagesDistribution: Record<string, number>;
  };
  commitmentMap: {
    customerCommitments: RelationshipCommitmentItem[];
    rmCommitments: RelationshipCommitmentItem[];
  };
  beforeYouAct: BeforeYouActAdvisory;
  actionTraces: RelationshipActionTraceItem[];
  snapshots: RelationshipSnapshot[];
}






