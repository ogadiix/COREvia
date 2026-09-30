import {
  pgTable,
  serial,
  text,
  integer,
  numeric,
  timestamp,
  date,
  boolean,
  index,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 1. Users
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uid: text('uid').notNull().unique(), // Unique system user ID
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    employeeId: text('employee_id').notNull().unique(),
    passwordHash: text('password_hash'),
    role: text('role').notNull().default('RELATIONSHIP_MANAGER'),
    department: text('department').notNull().default('BRANCH_OPERATIONS'),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE, SUSPENDED
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uidIdx: uniqueIndex('users_uid_idx').on(table.uid),
    emailIdx: uniqueIndex('users_email_idx').on(table.email),
    empIdIdx: uniqueIndex('users_emp_id_idx').on(table.employeeId),
  })
);

// 1b. Sessions (Server-side session management for banking compliance)
export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    sessionToken: text('session_token').notNull(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    lastActivityAt: timestamp('last_activity_at').defaultNow().notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionTokenIdx: uniqueIndex('sessions_token_idx').on(table.sessionToken),
    sessionUserIdx: index('sessions_user_idx').on(table.userId),
  })
);

// 2. Roles
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. Permissions
export const permissions = pgTable('permissions', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  module: text('module').notNull(),
});

// 4. User Roles (Mapping)
export const userRoles = pgTable('user_roles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  roleId: integer('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
});

// 4b. Role Permissions (Mapping)
export const rolePermissions = pgTable('role_permissions', {
  id: serial('id').primaryKey(),
  roleId: integer('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  permissionId: integer('permission_id')
    .references(() => permissions.id, { onDelete: 'cascade' })
    .notNull(),
});

// 5. Customers
export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    customerCode: text('customer_code').notNull().unique(), // e.g. CUS-10482
    cifNumber: text('cif_number').notNull().unique(), // e.g. CIF-9840192
    name: text('name').notNull(),
    entityType: text('entity_type').notNull(), // INDIVIDUAL, PROPRIETORSHIP, PRIVATE_LIMITED, etc.
    cKycNumber: text('ckyc_number'),
    panNumber: text('pan_number').notNull(),
    aadhaarStatus: text('aadhaar_status').notNull().default('VERIFIED'),
    gstin: text('gstin'),
    riskCategory: text('risk_category').notNull().default('LOW'), // LOW, MEDIUM, HIGH
    cibilScore: integer('cibil_score').notNull().default(750),
    occupationOrSector: text('occupation_or_sector').notNull(),
    annualTurnoverOrIncome: numeric('annual_turnover_or_income', { precision: 18, scale: 2 }).notNull(),
    relationshipValue: numeric('relationship_value', { precision: 18, scale: 2 }).notNull(),
    onboardingDate: date('onboarding_date').notNull(),
    kycLastReviewed: date('kyc_last_reviewed'),
    kycNextReviewDue: date('kyc_next_review_due'),
    amlAlertCount: integer('aml_alert_count').notNull().default(0),
    status: text('status').notNull().default('ACTIVE'),
    assignedRmId: integer('assigned_rm_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    custCodeIdx: uniqueIndex('customers_code_idx').on(table.customerCode),
    cifIdx: uniqueIndex('customers_cif_idx').on(table.cifNumber),
    panIdx: index('customers_pan_idx').on(table.panNumber),
    riskIdx: index('customers_risk_idx').on(table.riskCategory),
  })
);

// 6. Customer Addresses
export const customerAddresses = pgTable('customer_addresses', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  addressType: text('address_type').notNull().default('REGISTERED'), // REGISTERED, COMMUNICATION, BRANCH
  line1: text('line1').notNull(),
  line2: text('line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  pinCode: text('pin_code').notNull(),
  country: text('country').notNull().default('INDIA'),
  isPrimary: boolean('is_primary').notNull().default(true),
});

// 7. Customer Contacts
export const customerContacts = pgTable('customer_contacts', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  contactType: text('contact_type').notNull(), // EMAIL, PHONE, MOBILE, LANDLINE
  contactValue: text('contact_value').notNull(),
  isPrimary: boolean('is_primary').notNull().default(true),
  isVerified: boolean('is_verified').notNull().default(true),
});

// 8. Accounts
export const accounts = pgTable(
  'accounts',
  {
    id: serial('id').primaryKey(),
    accountNumber: text('account_number').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'restrict' })
      .notNull(),
    accountType: text('account_type').notNull(), // SAVINGS, CURRENT, FIXED_DEPOSIT, RECURRING_DEPOSIT
    schemeCode: text('scheme_code').notNull(),
    schemeName: text('scheme_name').notNull(),
    currency: text('currency').notNull().default('INR'),
    interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull().default('0.00'),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, DORMANT, DEBIT_FREEZE, TOTAL_FREEZE, CLOSED
    branchCode: text('branch_code').notNull().default('0104'),
    branchName: text('branch_name').notNull().default('Mumbai Fort Branch'),
    ifscCode: text('ifsc_code').notNull().default('CRVI0001042'),
    openDate: date('open_date').notNull(),
    panNumber: text('pan_number').notNull(),
    nomineeName: text('nominee_name'),
    nomineeRelation: text('nominee_relation'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    accNumIdx: uniqueIndex('accounts_acc_num_idx').on(table.accountNumber),
    custAccIdx: index('accounts_customer_idx').on(table.customerId),
    statusIdx: index('accounts_status_idx').on(table.status),
  })
);

// 9. Account Balances
export const accountBalances = pgTable(
  'account_balances',
  {
    id: serial('id').primaryKey(),
    accountId: integer('account_id')
      .references(() => accounts.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    availableBalance: numeric('available_balance', { precision: 18, scale: 2 }).notNull().default('0.00'),
    ledgerBalance: numeric('ledger_balance', { precision: 18, scale: 2 }).notNull().default('0.00'),
    lienAmount: numeric('lien_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
    unclearBalance: numeric('unclear_balance', { precision: 18, scale: 2 }).notNull().default('0.00'),
    currency: text('currency').notNull().default('INR'),
    asOfDate: timestamp('as_of_date').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    accBalIdx: uniqueIndex('account_balances_account_id_idx').on(table.accountId),
  })
);

// 10. Transactions
export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    transactionId: text('transaction_id').notNull().unique(),
    utrNumber: text('utr_number').notNull().unique(),
    accountId: integer('account_id').references(() => accounts.id),
    customerId: integer('customer_id').references(() => customers.id),
    txnType: text('txn_type').notNull(), // CREDIT, DEBIT
    rail: text('rail').notNull(), // RTGS, NEFT, IMPS, UPI, CTS_CHEQUE
    amount: numeric('amount', { precision: 18, scale: 2 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 18, scale: 2 }),
    counterpartyAccount: text('counterparty_account'),
    counterpartyName: text('counterparty_name'),
    counterpartyIfsc: text('counterparty_ifsc'),
    narration: text('narration').notNull(),
    status: text('status').notNull().default('SETTLED'), // SETTLED, PENDING_CLEARING, REJECTED, HELD_FOR_VERIFICATION
    batchNumber: text('batch_number'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    txnIdIdx: uniqueIndex('transactions_txn_id_idx').on(table.transactionId),
    utrIdx: uniqueIndex('transactions_utr_idx').on(table.utrNumber),
    accTxnIdx: index('transactions_account_idx').on(table.accountId),
    custTxnIdx: index('transactions_customer_idx').on(table.customerId),
  })
);

// 11. Products Catalog
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  productCode: text('product_code').notNull().unique(),
  category: text('category').notNull(), // CASA, ASSET_LOAN, TRADE_FINANCE, TREASURY, WEALTH, CARDS, INSURANCE
  name: text('name').notNull(),
  description: text('description'),
  eligibility: text('eligibility'),
  interestRateRange: text('interest_rate_range'),
  minBalance: numeric('min_balance', { precision: 18, scale: 2 }).default('0.00'),
  features: text('features'), // JSON string or bullet points
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Customer Products (Subscribed / Enrolled)
export const customerProducts = pgTable('customer_products', {
  id: serial('id').primaryKey(),
  customerId: integer('customer_id')
    .references(() => customers.id, { onDelete: 'cascade' })
    .notNull(),
  productId: integer('product_id')
    .references(() => products.id, { onDelete: 'restrict' })
    .notNull(),
  accountId: integer('account_id').references(() => accounts.id),
  status: text('status').notNull().default('ACTIVE'),
  enrolledDate: date('enrolled_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Loans
export const loans = pgTable(
  'loans',
  {
    id: serial('id').primaryKey(),
    loanAccountNumber: text('loan_account_number').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'restrict' })
      .notNull(),
    loanType: text('loan_type').notNull(), // HOME_LOAN, PERSONAL_LOAN, EDUCATION_LOAN, VEHICLE_LOAN, BUSINESS_LOAN, WORKING_CAPITAL_CC, TERM_LOAN
    sanctionedLimit: numeric('sanctioned_limit', { precision: 18, scale: 2 }).notNull(),
    drawingPower: numeric('drawing_power', { precision: 18, scale: 2 }).notNull(),
    outstandingPrincipal: numeric('outstanding_principal', { precision: 18, scale: 2 }).notNull(),
    interestDue: numeric('interest_due', { precision: 18, scale: 2 }).notNull().default('0.00'),
    interestRate: numeric('interest_rate', { precision: 5, scale: 2 }).notNull(),
    benchmarkRate: text('benchmark_rate').notNull(),
    tenureMonths: integer('tenure_months').notNull().default(60),
    relationshipManagerId: integer('relationship_manager_id').references(() => users.id),
    sanctionDate: date('sanction_date').notNull(),
    maturityDate: date('maturity_date').notNull(),
    nextEmiDate: date('next_emi_date'),
    emiAmount: numeric('emi_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
    overdueDays: integer('overdue_days').notNull().default(0),
    assetClassification: text('asset_classification').notNull().default('STANDARD'), // STANDARD, SMA_0, SMA_1, SMA_2, SUB_STANDARD, DOUBTFUL, LOSS
    collateralType: text('collateral_type'),
    collateralValue: numeric('collateral_value', { precision: 18, scale: 2 }).default('0.00'),
    hypothecationDetails: text('hypothecation_details'),
    prioritySector: boolean('priority_sector').notNull().default(false),
    provisionAmount: numeric('provision_amount', { precision: 18, scale: 2 }).default('0.00'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    loanNumIdx: uniqueIndex('loans_account_num_idx').on(table.loanAccountNumber),
    custLoanIdx: index('loans_customer_idx').on(table.customerId),
    assetClassIdx: index('loans_asset_class_idx').on(table.assetClassification),
  })
);

// 14. Loan Repayments & Payment Schedule History
export const loanRepayments = pgTable(
  'loan_repayments',
  {
    id: serial('id').primaryKey(),
    loanId: integer('loan_id')
      .references(() => loans.id, { onDelete: 'cascade' })
      .notNull(),
    installmentNumber: integer('installment_number').notNull(),
    dueDate: date('due_date').notNull(),
    paidDate: date('paid_date'),
    principalPaid: numeric('principal_paid', { precision: 18, scale: 2 }).notNull().default('0.00'),
    interestPaid: numeric('interest_paid', { precision: 18, scale: 2 }).notNull().default('0.00'),
    totalAmount: numeric('total_amount', { precision: 18, scale: 2 }).notNull(),
    outstandingBalanceAfter: numeric('outstanding_balance_after', { precision: 18, scale: 2 }).notNull(),
    paymentMode: text('payment_mode').notNull().default('AUTO_DEBIT'), // AUTO_DEBIT, ECS_NACH, RTGS, CHEQUE
    referenceNumber: text('reference_number'),
    status: text('status').notNull().default('PAID'), // PAID, PENDING, OVERDUE, PARTIALLY_PAID
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    loanRepayIdx: index('loan_repayments_loan_idx').on(table.loanId),
    dueDateIdx: index('loan_repayments_due_date_idx').on(table.dueDate),
  })
);

// 13b. Loan Repayments
// (interactions defined below in Phase 24 section)

// 15. Service Cases
export const serviceCases = pgTable(
  'service_cases',
  {
    id: serial('id').primaryKey(),
    caseNumber: text('case_number').notNull().unique(), // e.g. CAS-2026-0901
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    accountId: integer('account_id').references(() => accounts.id),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull(), // PAYMENTS_CLEARING, KYC_UPDATE, LIEN_RELEASE, CHEQUE_BOOK, LOAN_DISBURSEMENT
    priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
    status: text('status').notNull().default('OPEN'), // OPEN, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED
    assignedToId: integer('assigned_to_id').references(() => users.id),
    resolutionSummary: text('resolution_summary'),
    slaDueDate: timestamp('sla_due_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    caseNumIdx: uniqueIndex('cases_number_idx').on(table.caseNumber),
    custCaseIdx: index('cases_customer_idx').on(table.customerId),
    statusCaseIdx: index('cases_status_idx').on(table.status),
  })
);

// 16. Case Comments
export const caseComments = pgTable('case_comments', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id')
    .references(() => serviceCases.id, { onDelete: 'cascade' })
    .notNull(),
  authorId: integer('author_id').references(() => users.id),
  authorName: text('author_name').notNull(),
  comment: text('comment').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 17. Tasks
export const tasks = pgTable(
  'tasks',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: date('due_date').notNull(),
    priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
    status: text('status').notNull().default('PENDING'), // PENDING, COMPLETED, CANCELLED
    assignedToId: integer('assigned_to_id').references(() => users.id),
    relatedType: text('related_type'), // CASE, KYC, LOAN, OPPORTUNITY
    relatedId: text('related_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    custTaskIdx: index('tasks_customer_idx').on(table.customerId),
    statusTaskIdx: index('tasks_status_idx').on(table.status),
  })
);

// 18. Opportunities
export const opportunities = pgTable(
  'opportunities',
  {
    id: serial('id').primaryKey(),
    opportunityCode: text('opportunity_code').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    productId: integer('product_id').references(() => products.id),
    title: text('title').notNull(),
    stage: text('stage').notNull().default('PROSPECT'), // PROSPECT, QUALIFIED, PROPOSAL, NEGOTIATION, WON, LOST
    expectedValue: numeric('expected_value', { precision: 18, scale: 2 }).notNull().default('0.00'),
    probability: integer('probability').notNull().default(50),
    expectedCloseDate: date('expected_close_date'),
    notes: text('notes'),
    assignedToId: integer('assigned_to_id').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    oppCodeIdx: uniqueIndex('opp_code_idx').on(table.opportunityCode),
    custOppIdx: index('opp_customer_idx').on(table.customerId),
    stageOppIdx: index('opp_stage_idx').on(table.stage),
  })
);

// 19. Opportunity Activities
export const opportunityActivities = pgTable('opportunity_activities', {
  id: serial('id').primaryKey(),
  opportunityId: integer('opportunity_id')
    .references(() => opportunities.id, { onDelete: 'cascade' })
    .notNull(),
  activityType: text('activity_type').notNull(), // CALL, MEETING, PROPOSAL_SENT, STAGE_CHANGE
  description: text('description').notNull(),
  performedById: integer('performed_by_id').references(() => users.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// 20. Customer Scores
export const customerScores = pgTable(
  'customer_scores',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    coreScore: integer('core_score').notNull(), // 0 to 100 overall CORE score
    financialHealthScore: integer('financial_health_score').notNull(),
    creditRiskScore: integer('credit_risk_score').notNull(),
    engagementScore: integer('engagement_score').notNull(),
    churnProbability: numeric('churn_probability', { precision: 5, scale: 2 }).notNull(),
    calculationDate: date('calculation_date').notNull(),
    factors: text('factors'), // JSON stringified factor breakdown
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    custScoreIdx: uniqueIndex('scores_customer_id_idx').on(table.customerId),
  })
);

// 21. Customer Insights (Phase 10: Relationship Intelligence Engine)
export const customerInsights = pgTable(
  'customer_insights',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    insightId: text('insight_id').notNull().default(''), // e.g. INS-10023
    insightType: text('insight_type').notNull(), // RELATIONSHIP_RISK, GROWTH_OPPORTUNITY, SERVICE_CONCERN, ENGAGEMENT_SIGNAL, OPERATIONAL_SIGNAL
    category: text('category').notNull().default('GENERAL'), // SCORE_DECLINE, ENGAGEMENT_DECLINE, SERVICE_DETERIORATION, OPERATIONAL_NEGLECT, PRODUCT_DEPTH_GAP, RELATIONSHIP_EXPANSION, SLA_AT_RISK, SLA_BREACHED, OPPORTUNITY_STAGNATION, OPPORTUNITY_CLOSING_RISK, TASK_OVERDUE, MULTIPLE_PENDING_TASKS
    title: text('title').notNull(), // Signal statement
    summary: text('summary').notNull().default(''), // Concise summary
    description: text('description').notNull(), // Detailed explanation
    impact: text('impact').notNull().default(''), // Why it matters
    priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
    urgency: text('urgency').notNull().default('MEDIUM'), // Legacy urgency
    confidence: text('confidence').notNull().default('HIGH'), // HIGH, MEDIUM, LOW (evidence completeness)
    confidenceScore: numeric('confidence_score', { precision: 4, scale: 2 }).notNull().default('0.90'),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, ACKNOWLEDGED, RESOLVED, EXPIRED
    detectedAt: timestamp('detected_at').defaultNow().notNull(),
    validUntil: timestamp('valid_until'),
    sourceEntityType: text('source_entity_type').notNull().default('CUSTOMER'), // CUSTOMER, ACCOUNT, CASE, OPPORTUNITY, TASK, INTERACTION, CORE_SCORE
    sourceEntityId: text('source_entity_id').notNull().default('0'),
    evidence: text('evidence').notNull().default('[]'), // JSON array of evidence records
    recommendedActionType: text('recommended_action_type'), // REVIEW_CUSTOMER, CONTACT_CUSTOMER, RESOLVE_CASE, FOLLOW_UP_OPPORTUNITY, COMPLETE_TASK
    recommendedActionContext: text('recommended_action_context'), // JSON context
    ruleVersion: text('rule_version').notNull().default('RI-v1'),
    dedupKey: text('dedup_key').notNull().default(''),
    actionPrompt: text('action_prompt'),
    isDismissed: boolean('is_dismissed').notNull().default(false),
    acknowledgedById: integer('acknowledged_by_id').references(() => users.id),
    acknowledgedByName: text('acknowledged_by_name'),
    acknowledgedAt: timestamp('acknowledged_at'),
    acknowledgementNote: text('acknowledgement_note'),
    resolvedAt: timestamp('resolved_at'),
    resolutionType: text('resolution_type'), // AUTOMATIC, MANUAL
    resolutionNote: text('resolution_note'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    custInsightIdx: index('cust_insight_cust_idx').on(table.customerId),
    insightStatusIdx: index('cust_insight_status_idx').on(table.status),
    insightPriorityIdx: index('cust_insight_priority_idx').on(table.priority),
    insightDedupIdx: index('cust_insight_dedup_idx').on(table.dedupKey),
  })
);

// 22. Notifications (Phase 15: Notifications & Intelligent Alerts System)
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'cascade' }),
    notificationType: text('notification_type').notNull(),
    category: text('category').notNull().default('SYSTEM'), // SERVICE, ENGAGEMENT, TASK, OPPORTUNITY, RELATIONSHIP, CUSTOMER, OPERATIONAL, SYSTEM
    severity: text('severity').notNull().default('INFO'), // INFO, SUCCESS, WARNING, CRITICAL
    title: text('title').notNull(),
    message: text('message').notNull(),
    actionLabel: text('action_label'),
    actionUrl: text('action_url'),
    sourceEntityType: text('source_entity_type'), // CASE, TASK, OPPORTUNITY, CORE_SCORE, CUSTOMER, ACCOUNT, RELATIONSHIP_INTELLIGENCE, NBA, RADAR
    sourceEntityId: text('source_entity_id'),
    metadata: text('metadata'), // JSON stringified metadata
    status: text('status').notNull().default('UNREAD'), // UNREAD, READ, ACKNOWLEDGED, DISMISSED, EXPIRED
    isRead: boolean('is_read').notNull().default(false), // backward compatibility
    linkUrl: text('link_url'), // backward compatibility
    readAt: timestamp('read_at'),
    acknowledgedAt: timestamp('acknowledged_at'),
    expiresAt: timestamp('expires_at'),
    dedupKey: text('dedup_key'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    notifUserIdx: index('notif_user_idx').on(table.userId),
    notifStatusIdx: index('notif_status_idx').on(table.status),
    notifSeverityIdx: index('notif_severity_idx').on(table.severity),
    notifTypeIdx: index('notif_type_idx').on(table.notificationType),
    notifCreatedIdx: index('notif_created_idx').on(table.createdAt),
    notifCustIdx: index('notif_cust_idx').on(table.customerId),
    notifSourceIdx: index('notif_source_idx').on(table.sourceEntityType, table.sourceEntityId),
    notifDedupIdx: index('notif_dedup_idx').on(table.dedupKey),
  })
);

// 22b. User Notification Preferences
export const userNotificationPreferences = pgTable(
  'user_notification_preferences',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull()
      .unique(),
    serviceAlerts: boolean('service_alerts').notNull().default(true),
    taskAlerts: boolean('task_alerts').notNull().default(true),
    opportunityAlerts: boolean('opportunity_alerts').notNull().default(true),
    relationshipAlerts: boolean('relationship_alerts').notNull().default(true),
    customerActivity: boolean('customer_activity').notNull().default(true),
    operationalAlerts: boolean('operational_alerts').notNull().default(true),
    systemAlerts: boolean('system_alerts').notNull().default(true),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    notifPrefUserIdx: uniqueIndex('notif_pref_user_idx').on(table.userId),
  })
);

// 23. Audit Logs
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    actorId: text('actor_id').notNull(),
    actorName: text('actor_name').notNull(),
    action: text('action').notNull(),
    resourceType: text('resource_type').notNull(),
    resourceId: text('resource_id').notNull(),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    requestId: text('request_id').notNull(),
    outcome: text('outcome').notNull(), // SUCCESS, FAILURE, DENIED
    metadata: text('metadata'), // JSON stringified payload / changes
    previousHash: text('previous_hash'), // Tamper-evident chaining hash of previous record
    recordHash: text('record_hash'), // Cryptographic SHA-256 hash of this record
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    auditActorIdx: index('audit_actor_idx').on(table.actorId),
    auditResourceIdx: index('audit_resource_idx').on(table.resourceType, table.resourceId),
    auditReqIdx: index('audit_request_idx').on(table.requestId),
    auditHashIdx: index('audit_record_hash_idx').on(table.recordHash),
  })
);

// 24. Next Best Actions (Phase 11: Next Best Action Engine)
export const nextBestActions = pgTable(
  'next_best_actions',
  {
    id: serial('id').primaryKey(),
    actionId: text('action_id').notNull().unique(), // e.g. NBA-10023
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    actionType: text('action_type').notNull(), // SERVICE, ENGAGEMENT, OPPORTUNITY, TASK, RELATIONSHIP, PRODUCT
    category: text('category').notNull().default('GENERAL'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
    urgency: text('urgency').notNull().default('SOON'), // IMMEDIATE, TODAY, SOON, PLANNED
    rationale: text('rationale').notNull(), // Why: Root explanation
    expectedImpact: text('expected_impact').notNull(),
    confidence: text('confidence').notNull().default('HIGH'), // HIGH, MEDIUM, LOW
    confidenceScore: numeric('confidence_score', { precision: 4, scale: 2 }).notNull().default('0.90'),
    rankScore: numeric('rank_score', { precision: 8, scale: 2 }).notNull().default('0.00'),
    isTopRecommendation: boolean('is_top_recommendation').notNull().default(false),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, ACCEPTED, DISMISSED, COMPLETED, EXPIRED
    ruleId: text('rule_id').notNull(),
    ruleVersion: text('rule_version').notNull().default('NBA-v1'),
    sourceEntityType: text('source_entity_type').notNull().default('CUSTOMER'), // CASE, TASK, OPPORTUNITY, CORE_SCORE, CUSTOMER, ACCOUNT, RELATIONSHIP_INTELLIGENCE
    sourceEntityId: text('source_entity_id').notNull().default('0'),
    sourceEntityCode: text('source_entity_code'),
    evidence: text('evidence').notNull().default('[]'), // JSON array of verified evidence records
    actionRoute: text('action_route'), // /service-desk, /opportunities, /tasks, /customers
    targetEntityContext: text('target_entity_context'), // JSON context payload for task creation or navigation
    dismissedReason: text('dismissed_reason'),
    dismissedById: integer('dismissed_by_id').references(() => users.id),
    dismissedByName: text('dismissed_by_name'),
    dismissedAt: timestamp('dismissed_at'),
    acceptedById: integer('accepted_by_id').references(() => users.id),
    acceptedByName: text('accepted_by_name'),
    acceptedAt: timestamp('accepted_at'),
    completedAt: timestamp('completed_at'),
    createdTaskId: integer('created_task_id').references(() => tasks.id),
    generatedAt: timestamp('generated_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    dedupKey: text('dedup_key').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    nbaCustIdx: index('nba_cust_idx').on(table.customerId),
    nbaStatusIdx: index('nba_status_idx').on(table.status),
    nbaPriorityIdx: index('nba_priority_idx').on(table.priority),
    nbaActionTypeIdx: index('nba_action_type_idx').on(table.actionType),
    nbaDedupIdx: index('nba_dedup_idx').on(table.dedupKey),
  })
);

// 25. Next Best Action Evidence (Normalized Evidence Records)
export const nextBestActionEvidence = pgTable(
  'next_best_action_evidence',
  {
    id: serial('id').primaryKey(),
    actionId: integer('action_id')
      .references(() => nextBestActions.id, { onDelete: 'cascade' })
      .notNull(),
    sourceEntityType: text('source_entity_type').notNull(),
    sourceEntityId: text('source_entity_id').notNull(),
    sourceEntityCode: text('source_entity_code').notNull(),
    recordTitle: text('record_title').notNull(),
    evidenceType: text('evidence_type').notNull().default('RECORD'),
    evidenceSummary: text('evidence_summary').notNull(),
    detail: text('detail'),
    routePath: text('route_path'),
    metricValue: text('metric_value'),
    timestamp: timestamp('timestamp'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    nbaEvActionIdx: index('nba_ev_action_idx').on(table.actionId),
  })
);

// 26. Customer Opportunity Radar (Phase 12)
export const customerOpportunityRadar = pgTable(
  'customer_opportunity_radar',
  {
    id: serial('id').primaryKey(),
    radarId: text('radar_id').notNull().unique(), // e.g. RAD-10482-001
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    signalType: text('signal_type').notNull(), // PRODUCT_COVERAGE_GAP, RELATIONSHIP_EXPANSION, OPPORTUNITY_FOLLOWUP, RENEWAL_MATURITY, ENGAGEMENT_OPPORTUNITY, SERVICE_FIRST_RECOVERY
    title: text('title').notNull(),
    summary: text('summary').notNull(),
    category: text('category').notNull(), // INVESTMENTS, LENDING, DEPOSITS, CARDS, INSURANCE, RELATIONSHIP_REVIEW, TRADE_FINANCE
    priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
    relevanceScore: integer('relevance_score').notNull().default(70), // 0-100 Radar Relevance
    confidence: text('confidence').notNull().default('MEDIUM'), // HIGH, MEDIUM, LOW
    rationale: text('rationale').notNull(),
    expectedValueBand: text('expected_value_band'), // LOW, MEDIUM, HIGH, Tier 1: High Potential Band
    status: text('status').notNull().default('DETECTED'), // DETECTED, REVIEW_SUGGESTED, ACCEPTED, CONVERTED, DISMISSED, EXPIRED
    ruleId: text('rule_id').notNull(),
    ruleVersion: text('rule_version').notNull().default('RADAR-v1'),
    detectedAt: timestamp('detected_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    convertedOpportunityId: integer('converted_opportunity_id').references(() => opportunities.id),
    existingOpportunityId: integer('existing_opportunity_id').references(() => opportunities.id),
    targetProductId: integer('target_product_id').references(() => products.id),
    dismissedReason: text('dismissed_reason'),
    dismissedById: integer('dismissed_by_id').references(() => users.id),
    dismissedByName: text('dismissed_by_name'),
    dismissedAt: timestamp('dismissed_at'),
    reviewedById: integer('reviewed_by_id').references(() => users.id),
    reviewedByName: text('reviewed_by_name'),
    reviewedAt: timestamp('reviewed_at'),
    evidence: text('evidence').notNull().default('[]'), // JSON array of verified evidence
    dedupKey: text('dedup_key').notNull().default(''),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    radarCustIdx: index('radar_cust_idx').on(table.customerId),
    radarStatusIdx: index('radar_status_idx').on(table.status),
    radarPriorityIdx: index('radar_priority_idx').on(table.priority),
    radarSignalTypeIdx: index('radar_signal_type_idx').on(table.signalType),
    radarDedupIdx: index('radar_dedup_idx').on(table.dedupKey),
  })
);

// 27. Customer Opportunity Radar Evidence (Normalized Evidence Records)
export const customerOpportunityRadarEvidence = pgTable(
  'customer_opportunity_radar_evidence',
  {
    id: serial('id').primaryKey(),
    radarId: integer('radar_id')
      .references(() => customerOpportunityRadar.id, { onDelete: 'cascade' })
      .notNull(),
    sourceEntityType: text('source_entity_type').notNull(),
    sourceEntityId: text('source_entity_id').notNull(),
    sourceEntityCode: text('source_entity_code').notNull(),
    recordTitle: text('record_title').notNull(),
    evidenceType: text('evidence_type').notNull().default('RECORD'),
    evidenceSummary: text('evidence_summary').notNull(),
    detail: text('detail'),
    routePath: text('route_path'),
    metricValue: text('metric_value'),
    timestamp: timestamp('timestamp'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    radarEvRadarIdx: index('radar_ev_radar_idx').on(table.radarId),
  })
);

// 28. Customer Score History (Phase 16: Persisted Deterministic Score History)
export const customerScoreHistory = pgTable(
  'customer_score_history',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    coreScore: integer('core_score').notNull(),
    financialHealthScore: integer('financial_health_score').notNull(),
    creditRiskScore: integer('credit_risk_score').notNull(),
    engagementScore: integer('engagement_score').notNull(),
    recordedDate: date('recorded_date').notNull(),
    factors: text('factors'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    cshCustIdx: index('csh_customer_idx').on(table.customerId),
    cshDateIdx: index('csh_date_idx').on(table.recordedDate),
  })
);

// 29. Phase 22: Onboarding Applications
export const onboardingApplications = pgTable(
  'onboarding_applications',
  {
    id: serial('id').primaryKey(),
    applicationNumber: text('application_number').notNull(),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    applicantName: text('applicant_name').notNull(),
    customerType: text('customer_type').notNull().default('INDIVIDUAL'), // INDIVIDUAL, BUSINESS
    onboardingType: text('onboarding_type').notNull().default('NEW_ACCOUNT'),
    assignedRmId: integer('assigned_rm_id').references(() => users.id, { onDelete: 'set null' }),
    assignedOfficerId: integer('assigned_officer_id').references(() => users.id, { onDelete: 'set null' }),
    branchCode: text('branch_code').notNull().default('BR-0104'),
    branchName: text('branch_name').notNull().default('Fort, Mumbai Main Branch'),
    submittedDate: timestamp('submitted_date'),
    lastUpdated: timestamp('last_updated').defaultNow().notNull(),
    status: text('status').notNull().default('DRAFT'), // DRAFT, SUBMITTED, DOCUMENT_REVIEW, KYC_REVIEW, ADDITIONAL_INFORMATION, COMPLIANCE_REVIEW, APPROVED, REJECTED, WITHDRAWN, COMPLETED
    kycStatus: text('kyc_status').notNull().default('NOT_STARTED'), // NOT_STARTED, IN_REVIEW, VERIFIED, ADDITIONAL_INFORMATION_REQUIRED, FAILED, EXPIRED
    kybStatus: text('kyb_status').default('NOT_APPLICABLE'), // NOT_APPLICABLE, NOT_STARTED, IN_REVIEW, VERIFIED, ADDITIONAL_INFORMATION_REQUIRED, FAILED
    documentStatus: text('document_status').notNull().default('PENDING'), // PENDING, UNDER_REVIEW, VERIFIED, REJECTED, REPLACEMENT_REQUIRED
    riskReviewStatus: text('risk_review_status').notNull().default('PENDING'), // PENDING, IN_PROGRESS, LOW_RISK_CONFIRMED, HIGH_RISK_ESCALATED, COMPLIANCE_HOLD
    priority: text('priority').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
    slaHoursTotal: integer('sla_hours_total').notNull().default(48),
    slaHoursRemaining: integer('sla_hours_remaining').notNull().default(48),
    slaStatus: text('sla_status').notNull().default('ON_TRACK'), // ON_TRACK, AT_RISK, BREACHED
    slaDeadline: timestamp('sla_deadline'),
    exceptionCount: integer('exception_count').notNull().default(0),
    opportunityId: integer('opportunity_id').references(() => opportunities.id, { onDelete: 'set null' }),
    notes: text('notes'),
    rejectionReason: text('rejection_reason'),
    approvedById: integer('approved_by_id').references(() => users.id, { onDelete: 'set null' }),
    approvedAt: timestamp('approved_at'),
    completedById: integer('completed_by_id').references(() => users.id, { onDelete: 'set null' }),
    completedAt: timestamp('completed_at'),
    createdBy: integer('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    onbAppNumIdx: index('idx_onb_app_num').on(table.applicationNumber),
    onbCustIdx: index('idx_onb_cust_id').on(table.customerId),
    onbStatusIdx: index('idx_onb_status').on(table.status),
    onbKycStatusIdx: index('idx_onb_kyc_status').on(table.kycStatus),
    onbSlaStatusIdx: index('idx_onb_sla_status').on(table.slaStatus),
  })
);

// 30. Onboarding Products
export const onboardingProducts = pgTable(
  'onboarding_products',
  {
    id: serial('id').primaryKey(),
    applicationId: integer('application_id')
      .references(() => onboardingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    productName: text('product_name').notNull(),
    productCode: text('product_code').notNull(),
    category: text('category').notNull(),
    status: text('status').notNull().default('REQUESTED'), // REQUESTED, APPROVED, PROVISIONED, REJECTED
    initialDepositAmount: numeric('initial_deposit_amount', { precision: 18, scale: 2 }).default('0'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    onbProdAppIdx: index('idx_onb_prod_app_id').on(table.applicationId),
  })
);

// 31. KYC Reviews
export const kycReviews = pgTable(
  'kyc_reviews',
  {
    id: serial('id').primaryKey(),
    applicationId: integer('application_id')
      .references(() => onboardingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    identityStatus: text('identity_status').notNull().default('NOT_STARTED'),
    addressStatus: text('address_status').notNull().default('NOT_STARTED'),
    contactStatus: text('contact_status').notNull().default('NOT_STARTED'),
    panVerificationStatus: text('pan_verification_status').notNull().default('SIMULATED_VERIFIED'),
    panNumber: text('pan_number'),
    aadhaarStatus: text('aadhaar_status').notNull().default('SIMULATED_VERIFIED'),
    ckycNumber: text('ckyc_number'),
    pepStatus: text('pep_status').notNull().default('NO_MATCH'),
    sanctionsCheckStatus: text('sanctions_check_status').notNull().default('PASSED_SIMULATED'),
    adverseMediaStatus: text('adverse_media_status').notNull().default('CLEAR'),
    riskCategory: text('risk_category').notNull().default('LOW'),
    status: text('status').notNull().default('NOT_STARTED'),
    reviewSummary: text('review_summary'),
    reviewerId: integer('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    simulationDisclaimer: text('simulation_disclaimer').default(
      'Simulation / Synthetic Verification - For Demonstration and Evaluation Only'
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    kycRevAppIdx: index('idx_kyc_rev_app_id').on(table.applicationId),
  })
);

// 32. KYB Reviews
export const kybReviews = pgTable(
  'kyb_reviews',
  {
    id: serial('id').primaryKey(),
    applicationId: integer('application_id')
      .references(() => onboardingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    legalEntityName: text('legal_entity_name').notNull(),
    entityType: text('entity_type').notNull().default('PRIVATE_LIMITED'),
    cinOrRegistrationNumber: text('cin_or_registration_number'),
    gstin: text('gstin'),
    incorporationDate: date('incorporation_date'),
    registeredAddress: text('registered_address'),
    uboVerificationStatus: text('ubo_verification_status').notNull().default('PENDING'),
    uboCount: integer('ubo_count').notNull().default(1),
    boardResolutionStatus: text('board_resolution_status').notNull().default('PENDING'),
    authorizedSignatoriesStatus: text('authorized_signatories_status').notNull().default('PENDING'),
    status: text('status').notNull().default('NOT_STARTED'),
    reviewerId: integer('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    simulationDisclaimer: text('simulation_disclaimer').default(
      'Simulation / Synthetic Verification - For Demonstration and Evaluation Only'
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    kybRevAppIdx: index('idx_kyb_rev_app_id').on(table.applicationId),
  })
);

// 33. Onboarding Documents
export const onboardingDocuments = pgTable(
  'onboarding_documents',
  {
    id: serial('id').primaryKey(),
    documentCode: text('document_code').notNull(),
    applicationId: integer('application_id')
      .references(() => onboardingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    documentType: text('document_type').notNull(),
    title: text('title').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: text('file_size').default('1.2 MB'),
    mimeType: text('mime_type').default('application/pdf'),
    status: text('status').notNull().default('UPLOADED'), // UPLOADED, UNDER_REVIEW, VERIFIED, REJECTED, EXPIRED, REPLACEMENT_REQUIRED
    uploadedById: integer('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    reviewedById: integer('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    reviewedAt: timestamp('reviewed_at'),
    expiryDate: date('expiry_date'),
    rejectionReason: text('rejection_reason'),
    replacementReason: text('replacement_reason'),
    requestedDocType: text('requested_doc_type'),
    replacementDueDate: date('replacement_due_date'),
    version: integer('version').notNull().default(1),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    onbDocAppIdx: index('idx_onb_doc_app_id').on(table.applicationId),
    onbDocStatusIdx: index('idx_onb_doc_status').on(table.status),
    onbDocTypeIdx: index('idx_onb_doc_type').on(table.documentType),
  })
);

// 34. Onboarding Exceptions
export const onboardingExceptions = pgTable(
  'onboarding_exceptions',
  {
    id: serial('id').primaryKey(),
    exceptionCode: text('exception_code').notNull(),
    applicationId: integer('application_id')
      .references(() => onboardingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    type: text('type').notNull(), // DOCUMENT_EXPIRED, NAME_MISMATCH, ADDRESS_MISMATCH, MISSING_DOCUMENT, ADDITIONAL_INFORMATION_REQUIRED, REVIEW_OVERDUE, MANUAL_VERIFICATION_REQUIRED
    severity: text('severity').notNull().default('MEDIUM'), // LOW, MEDIUM, HIGH, CRITICAL
    title: text('title').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('OPEN'), // OPEN, IN_PROGRESS, RESOLVED, WAIVED
    ownerId: integer('owner_id').references(() => users.id, { onDelete: 'set null' }),
    dueDate: timestamp('due_date'),
    resolution: text('resolution'),
    resolvedById: integer('resolved_by_id').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at'),
    waiveReason: text('waive_reason'),
    waivedById: integer('waived_by_id').references(() => users.id, { onDelete: 'set null' }),
    waivedAt: timestamp('waived_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    onbExcAppIdx: index('idx_onb_exc_app_id').on(table.applicationId),
    onbExcStatusIdx: index('idx_onb_exc_status').on(table.status),
    onbExcOwnerIdx: index('idx_onb_exc_owner').on(table.ownerId),
  })
);

// 35. Onboarding Assignments
export const onboardingAssignments = pgTable(
  'onboarding_assignments',
  {
    id: serial('id').primaryKey(),
    applicationId: integer('application_id')
      .references(() => onboardingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    assignedFromId: integer('assigned_from_id').references(() => users.id, { onDelete: 'set null' }),
    assignedToId: integer('assigned_to_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    roleScope: text('role_scope').notNull().default('KYC_OFFICER'),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    reason: text('reason'),
  },
  (table) => ({
    onbAsgnAppIdx: index('idx_onb_asgn_app_id').on(table.applicationId),
  })
);

// 36. Onboarding Events
export const onboardingEvents = pgTable(
  'onboarding_events',
  {
    id: serial('id').primaryKey(),
    applicationId: integer('application_id')
      .references(() => onboardingApplications.id, { onDelete: 'cascade' })
      .notNull(),
    eventType: text('event_type').notNull(),
    actorId: integer('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorName: text('actor_name').notNull(),
    actorRole: text('actor_role').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    onbEvtAppIdx: index('idx_onb_evt_app_id').on(table.applicationId),
    onbEvtTypeIdx: index('idx_onb_evt_type').on(table.eventType),
  })
);

// ====================================================
// PHASE 24 — CUSTOMER COMMUNICATION & INTERACTION HUB
// ====================================================

export const interactions = pgTable(
  'interactions',
  {
    id: serial('id').primaryKey(),
    interactionReference: text('interaction_reference'), // INT-2026-000482
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    channel: text('channel').notNull(), // PHONE, EMAIL, IN_PERSON, VIDEO, CHAT, MESSAGE, BRANCH, OTHER
    interactionType: text('interaction_type').notNull(), // CALL, EMAIL, MEETING, VIDEO_MEETING, BRANCH_VISIT, CHAT, MESSAGE, SERVICE_CONTACT, RELATIONSHIP_REVIEW, ONBOARDING_CONTACT, OTHER
    subject: text('subject').notNull(),
    summary: text('summary').notNull(),
    outcome: text('outcome').notNull(), // NO_ACTION_REQUIRED, FOLLOW_UP_REQUIRED, OPPORTUNITY_IDENTIFIED, OPPORTUNITY_PROGRESS, SERVICE_RESOLVED, SERVICE_ESCALATED, DOCUMENT_REQUESTED, ONBOARDING_PROGRESS, COMMITMENT_MADE, CUSTOMER_REQUEST, OTHER
    sentiment: text('sentiment').default('NEUTRAL'), // POSITIVE, NEUTRAL, CONCERNED, ESCALATED
    agentId: integer('agent_id').references(() => users.id),
    ownerId: integer('owner_id').references(() => users.id),
    duration: integer('duration').default(15), // in minutes
    participants: text('participants').default('[]'), // JSON array string of participants
    followupRequired: boolean('followup_required').default(false),
    followupDate: timestamp('followup_date'),
    followupOwnerId: integer('followup_owner_id').references(() => users.id),
    followupAction: text('followup_action'),
    followupPriority: text('followup_priority').default('MEDIUM'), // LOW, MEDIUM, HIGH, URGENT
    followupTaskId: integer('followup_task_id').references(() => tasks.id),
    customerCommitment: text('customer_commitment'),
    customerCommitmentTaskId: integer('customer_commitment_task_id').references(() => tasks.id),
    rmCommitment: text('rm_commitment'),
    rmCommitmentTaskId: integer('rm_commitment_task_id').references(() => tasks.id),
    linkedOpportunityId: integer('linked_opportunity_id').references(() => opportunities.id),
    linkedCaseId: integer('linked_case_id').references(() => serviceCases.id),
    linkedTaskId: integer('linked_task_id').references(() => tasks.id),
    linkedRelationshipReview: text('linked_relationship_review'), // e.g. RR-2026-00482
    linkedOnboardingId: integer('linked_onboarding_id').references(() => onboardingApplications.id),
    createdBy: integer('created_by').references(() => users.id),
    updatedBy: integer('updated_by').references(() => users.id),
    deletedBy: integer('deleted_by').references(() => users.id),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    custInterIdx: index('interactions_customer_idx').on(table.customerId),
    ownerInterIdx: index('interactions_owner_idx').on(table.ownerId),
    refInterIdx: index('interactions_reference_idx').on(table.interactionReference),
    typeInterIdx: index('interactions_type_idx').on(table.interactionType),
    timestampIdx: index('interactions_timestamp_idx').on(table.timestamp),
    delInterIdx: index('interactions_deleted_idx').on(table.deletedAt),
  })
);

export const interactionParticipants = pgTable(
  'interaction_participants',
  {
    id: serial('id').primaryKey(),
    interactionId: integer('interaction_id')
      .references(() => interactions.id, { onDelete: 'cascade' })
      .notNull(),
    participantType: text('participant_type').notNull().default('CUSTOMER'), // CUSTOMER, RM, SPECIALIST, COMPLIANCE_OFFICER, THIRD_PARTY
    name: text('name').notNull(),
    email: text('email'),
    phone: text('phone'),
    role: text('role'),
    attended: boolean('attended').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    partInterIdx: index('idx_part_inter_id').on(table.interactionId),
  })
);

export const interactionLinks = pgTable(
  'interaction_links',
  {
    id: serial('id').primaryKey(),
    interactionId: integer('interaction_id')
      .references(() => interactions.id, { onDelete: 'cascade' })
      .notNull(),
    linkType: text('link_type').notNull(), // CUSTOMER, OPPORTUNITY, CASE, TASK, RELATIONSHIP_REVIEW, ONBOARDING_APPLICATION
    linkId: text('link_id').notNull(),
    title: text('title'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    linkInterIdx: index('idx_link_inter_id').on(table.interactionId),
    linkTypeIdx: index('idx_link_type_id').on(table.linkType, table.linkId),
  })
);

export const interactionCommitments = pgTable(
  'interaction_commitments',
  {
    id: serial('id').primaryKey(),
    interactionId: integer('interaction_id')
      .references(() => interactions.id, { onDelete: 'cascade' })
      .notNull(),
    commitmentType: text('commitment_type').notNull(), // CUSTOMER_COMMITMENT, RM_COMMITMENT
    description: text('description').notNull(),
    ownerName: text('owner_name'),
    dueDate: timestamp('due_date'),
    status: text('status').notNull().default('PENDING'), // PENDING, COMPLETED, CANCELLED
    createdTaskId: integer('created_task_id').references(() => tasks.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
  },
  (table) => ({
    commitInterIdx: index('idx_commit_inter_id').on(table.interactionId),
    commitStatusIdx: index('idx_commit_status').on(table.status),
  })
);

// Relations
export const customersRelations = relations(customers, ({ many, one }) => ({
  addresses: many(customerAddresses),
  contacts: many(customerContacts),
  accounts: many(accounts),
  loans: many(loans),
  products: many(customerProducts),
  interactions: many(interactions),
  cases: many(serviceCases),
  tasks: many(tasks),
  opportunities: many(opportunities),
  score: one(customerScores, {
    fields: [customers.id],
    references: [customerScores.customerId],
  }),
  insights: many(customerInsights),
  nextBestActions: many(nextBestActions),
  opportunityRadar: many(customerOpportunityRadar),
  scoreHistory: many(customerScoreHistory),
  assignedRm: one(users, {
    fields: [customers.assignedRmId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [accounts.customerId],
    references: [customers.id],
  }),
  balance: one(accountBalances, {
    fields: [accounts.id],
    references: [accountBalances.accountId],
  }),
  transactions: many(transactions),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  customer: one(customers, {
    fields: [loans.customerId],
    references: [customers.id],
  }),
  relationshipManager: one(users, {
    fields: [loans.relationshipManagerId],
    references: [users.id],
  }),
  repayments: many(loanRepayments),
}));

export const loanRepaymentsRelations = relations(loanRepayments, ({ one }) => ({
  loan: one(loans, {
    fields: [loanRepayments.loanId],
    references: [loans.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  customerEnrollments: many(customerProducts),
  opportunities: many(opportunities),
}));

export const customerProductsRelations = relations(customerProducts, ({ one }) => ({
  customer: one(customers, {
    fields: [customerProducts.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [customerProducts.productId],
    references: [products.id],
  }),
  account: one(accounts, {
    fields: [customerProducts.accountId],
    references: [accounts.id],
  }),
}));

export const serviceCasesRelations = relations(serviceCases, ({ one, many }) => ({
  customer: one(customers, {
    fields: [serviceCases.customerId],
    references: [customers.id],
  }),
  account: one(accounts, {
    fields: [serviceCases.accountId],
    references: [accounts.id],
  }),
  comments: many(caseComments),
  assignedTo: one(users, {
    fields: [serviceCases.assignedToId],
    references: [users.id],
  }),
}));

export const opportunitiesRelations = relations(opportunities, ({ one, many }) => ({
  customer: one(customers, {
    fields: [opportunities.customerId],
    references: [customers.id],
  }),
  product: one(products, {
    fields: [opportunities.productId],
    references: [products.id],
  }),
  activities: many(opportunityActivities),
  assignedTo: one(users, {
    fields: [opportunities.assignedToId],
    references: [users.id],
  }),
}));

export const nextBestActionsRelations = relations(nextBestActions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [nextBestActions.customerId],
    references: [customers.id],
  }),
  acceptedBy: one(users, {
    fields: [nextBestActions.acceptedById],
    references: [users.id],
  }),
  dismissedBy: one(users, {
    fields: [nextBestActions.dismissedById],
    references: [users.id],
  }),
  createdTask: one(tasks, {
    fields: [nextBestActions.createdTaskId],
    references: [tasks.id],
  }),
  evidenceList: many(nextBestActionEvidence),
}));

export const nextBestActionEvidenceRelations = relations(nextBestActionEvidence, ({ one }) => ({
  action: one(nextBestActions, {
    fields: [nextBestActionEvidence.actionId],
    references: [nextBestActions.id],
  }),
}));

export const customerOpportunityRadarRelations = relations(customerOpportunityRadar, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerOpportunityRadar.customerId],
    references: [customers.id],
  }),
  targetProduct: one(products, {
    fields: [customerOpportunityRadar.targetProductId],
    references: [products.id],
  }),
  convertedOpportunity: one(opportunities, {
    fields: [customerOpportunityRadar.convertedOpportunityId],
    references: [opportunities.id],
  }),
  existingOpportunity: one(opportunities, {
    fields: [customerOpportunityRadar.existingOpportunityId],
    references: [opportunities.id],
  }),
  dismissedBy: one(users, {
    fields: [customerOpportunityRadar.dismissedById],
    references: [users.id],
  }),
  reviewedBy: one(users, {
    fields: [customerOpportunityRadar.reviewedById],
    references: [users.id],
  }),
  evidenceList: many(customerOpportunityRadarEvidence),
}));

export const customerOpportunityRadarEvidenceRelations = relations(customerOpportunityRadarEvidence, ({ one }) => ({
  radar: one(customerOpportunityRadar, {
    fields: [customerOpportunityRadarEvidence.radarId],
    references: [customerOpportunityRadar.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [notifications.customerId],
    references: [customers.id],
  }),
}));

export const userNotificationPreferencesRelations = relations(userNotificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userNotificationPreferences.userId],
    references: [users.id],
  }),
}));

export const customerScoreHistoryRelations = relations(customerScoreHistory, ({ one }) => ({
  customer: one(customers, {
    fields: [customerScoreHistory.customerId],
    references: [customers.id],
  }),
}));

export const interactionsRelations = relations(interactions, ({ one, many }) => ({
  customer: one(customers, {
    fields: [interactions.customerId],
    references: [customers.id],
  }),
  owner: one(users, {
    fields: [interactions.ownerId],
    references: [users.id],
  }),
  agent: one(users, {
    fields: [interactions.agentId],
    references: [users.id],
  }),
  followupOwner: one(users, {
    fields: [interactions.followupOwnerId],
    references: [users.id],
  }),
  followupTask: one(tasks, {
    fields: [interactions.followupTaskId],
    references: [tasks.id],
  }),
  linkedOpportunity: one(opportunities, {
    fields: [interactions.linkedOpportunityId],
    references: [opportunities.id],
  }),
  linkedCase: one(serviceCases, {
    fields: [interactions.linkedCaseId],
    references: [serviceCases.id],
  }),
  linkedTask: one(tasks, {
    fields: [interactions.linkedTaskId],
    references: [tasks.id],
  }),
  linkedOnboarding: one(onboardingApplications, {
    fields: [interactions.linkedOnboardingId],
    references: [onboardingApplications.id],
  }),
  participantsList: many(interactionParticipants),
  linksList: many(interactionLinks),
  commitmentsList: many(interactionCommitments),
}));

export const interactionParticipantsRelations = relations(interactionParticipants, ({ one }) => ({
  interaction: one(interactions, {
    fields: [interactionParticipants.interactionId],
    references: [interactions.id],
  }),
}));

export const interactionLinksRelations = relations(interactionLinks, ({ one }) => ({
  interaction: one(interactions, {
    fields: [interactionLinks.interactionId],
    references: [interactions.id],
  }),
}));

export const interactionCommitmentsRelations = relations(interactionCommitments, ({ one }) => ({
  interaction: one(interactions, {
    fields: [interactionCommitments.interactionId],
    references: [interactions.id],
  }),
  createdTask: one(tasks, {
    fields: [interactionCommitments.createdTaskId],
    references: [tasks.id],
  }),
}));

// ==========================================
// PHASE 25: BANKING DOCUMENT INTELLIGENCE
// ==========================================

// 39. Documents
export const documents = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    documentCode: text('document_code').notNull().unique(), // e.g. DOC-2026-004821
    documentType: text('document_type').notNull(), // PAN, Aadhaar, Passport, Address Proof, Salary Slip, etc.
    category: text('category').notNull().default('IDENTITY'), // IDENTITY, ADDRESS, FINANCIAL, BUSINESS, BANKING, RELATIONSHIP
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    customerName: text('customer_name').notNull(),
    relatedEntityType: text('related_entity_type').notNull().default('CUSTOMER'), // CUSTOMER, ONBOARDING, LOAN, CASE, OPPORTUNITY, RELATIONSHIP_REVIEW, ACCOUNT
    relatedEntityId: text('related_entity_id'), // e.g. ONB-2026-00182 or CASE-20491
    fileName: text('file_name').notNull(),
    fileSize: text('file_size').default('1.2 MB'),
    mimeType: text('mime_type').default('application/pdf'),
    storageKey: text('storage_key'),
    version: integer('version').notNull().default(1),
    status: text('status').notNull().default('UPLOADED'), // UPLOADED, UNDER_REVIEW, VERIFIED, REJECTED, EXPIRED, REPLACEMENT_REQUIRED, ARCHIVED
    reviewStatus: text('review_status').notNull().default('PENDING'), // PENDING, UNDER_REVIEW, APPROVED, REJECTED, REPLACEMENT_REQUESTED
    uploadedById: integer('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
    uploadedByName: text('uploaded_by_name'),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    reviewedById: integer('reviewed_by_id').references(() => users.id, { onDelete: 'set null' }),
    reviewedByName: text('reviewed_by_name'),
    reviewedAt: timestamp('reviewed_at'),
    expiryDate: date('expiry_date'),
    rejectionReason: text('rejection_reason'),
    replacementRequired: boolean('replacement_required').default(false).notNull(),
    replacementReason: text('replacement_reason'),
    replacementDocType: text('replacement_doc_type'),
    replacementDueDate: date('replacement_due_date'),
    visibility: text('visibility').notNull().default('INTERNAL'), // INTERNAL, CLIENT_VISIBLE, RESTRICTED
    description: text('description'),
    isSynthetic: boolean('is_synthetic').default(true).notNull(),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    docCodeIdx: uniqueIndex('idx_docs_code').on(table.documentCode),
    docCustIdx: index('idx_docs_customer_id').on(table.customerId),
    docStatusIdx: index('idx_docs_status').on(table.status),
    docReviewStatusIdx: index('idx_docs_review_status').on(table.reviewStatus),
    docTypeIdx: index('idx_docs_type').on(table.documentType),
    docExpiryIdx: index('idx_docs_expiry_date').on(table.expiryDate),
    docRelatedIdx: index('idx_docs_related').on(table.relatedEntityType, table.relatedEntityId),
  })
);

// 40. Document Versions
export const documentVersions = pgTable(
  'document_versions',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    version: integer('version').notNull(),
    fileName: text('file_name').notNull(),
    fileSize: text('file_size').default('1.2 MB'),
    mimeType: text('mime_type').default('application/pdf'),
    storageKey: text('storage_key'),
    status: text('status').notNull(),
    reviewStatus: text('review_status').notNull(),
    uploadedById: integer('uploaded_by_id').references(() => users.id, { onDelete: 'set null' }),
    uploadedByName: text('uploaded_by_name'),
    uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
    changeReason: text('change_reason'),
    rejectionReason: text('rejection_reason'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    docVerDocIdx: index('idx_doc_ver_doc_id').on(table.documentId),
    docVerNumIdx: index('idx_doc_ver_num').on(table.documentId, table.version),
  })
);

// 41. Document Requirements
export const documentRequirements = pgTable(
  'document_requirements',
  {
    id: serial('id').primaryKey(),
    requirementCode: text('requirement_code').notNull(), // REQ-2026-0001
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    relatedEntityType: text('related_entity_type').notNull().default('CUSTOMER'), // CUSTOMER, ONBOARDING, LOAN, CASE, OPPORTUNITY
    relatedEntityId: text('related_entity_id'),
    documentType: text('document_type').notNull(),
    category: text('category').notNull().default('IDENTITY'),
    isMandatory: boolean('is_mandatory').default(true).notNull(),
    status: text('status').notNull().default('MISSING'), // MISSING, SUBMITTED, VERIFIED, REJECTED, REPLACEMENT_REQUIRED, WAIVED
    fulfilledDocumentId: integer('fulfilled_document_id').references(() => documents.id, { onDelete: 'set null' }),
    notes: text('notes'),
    dueDate: date('due_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    docReqCustIdx: index('idx_doc_req_cust_id').on(table.customerId),
    docReqRelatedIdx: index('idx_doc_req_related').on(table.relatedEntityType, table.relatedEntityId),
    docReqStatusIdx: index('idx_doc_req_status').on(table.status),
  })
);

// 42. Document Reviews
export const documentReviews = pgTable(
  'document_reviews',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    version: integer('version').notNull().default(1),
    reviewerId: integer('reviewer_id').references(() => users.id, { onDelete: 'set null' }),
    reviewerName: text('reviewer_name').notNull(),
    decision: text('decision').notNull(), // VERIFIED, REJECTED, REPLACEMENT_REQUESTED, UNDER_REVIEW
    comments: text('comments'),
    rejectionReason: text('rejection_reason'),
    replacementDocType: text('replacement_doc_type'),
    replacementDueDate: date('replacement_due_date'),
    reviewedAt: timestamp('reviewed_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    docRevDocIdx: index('idx_doc_rev_doc_id').on(table.documentId),
  })
);

// 43. Document Links
export const documentLinks = pgTable(
  'document_links',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    entityType: text('entity_type').notNull(), // CUSTOMER, ONBOARDING, LOAN, CASE, OPPORTUNITY, RELATIONSHIP_REVIEW, ACCOUNT, TASK
    entityId: text('entity_id').notNull(),
    entityTitle: text('entity_title'),
    relationship: text('relationship').notNull().default('SUPPORTING_DOCUMENT'), // PRIMARY, SUPPORTING_DOCUMENT, RESOLUTION_PROOF, COLLATERAL_PROOF, PROPOSAL
    createdById: integer('created_by_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    docLinkDocIdx: index('idx_doc_link_doc_id').on(table.documentId),
    docLinkEntityIdx: index('idx_doc_link_entity').on(table.entityType, table.entityId),
  })
);

// 44. Document Extractions
export const documentExtractions = pgTable(
  'document_extractions',
  {
    id: serial('id').primaryKey(),
    documentId: integer('document_id')
      .references(() => documents.id, { onDelete: 'cascade' })
      .notNull(),
    version: integer('version').notNull().default(1),
    fieldName: text('field_name').notNull(), // e.g. 'Employer Name', 'Gross Income', 'Net Income', 'Statement Period'
    extractedValue: text('extracted_value'),
    confidence: numeric('confidence', { precision: 4, scale: 2 }).default('0.92'),
    verificationStatus: text('verification_status').notNull().default('NOT_VERIFIED'), // NOT_VERIFIED, HUMAN_VERIFIED, REJECTED
    verifiedById: integer('verified_by_id').references(() => users.id, { onDelete: 'set null' }),
    verifiedByName: text('verified_by_name'),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    docExtDocIdx: index('idx_doc_ext_doc_id').on(table.documentId),
  })
);

// Document Relations
export const documentsRelations = relations(documents, ({ one, many }) => ({
  customer: one(customers, {
    fields: [documents.customerId],
    references: [customers.id],
  }),
  uploader: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [documents.reviewedById],
    references: [users.id],
  }),
  versions: many(documentVersions),
  reviews: many(documentReviews),
  links: many(documentLinks),
  extractions: many(documentExtractions),
}));

export const documentVersionsRelations = relations(documentVersions, ({ one }) => ({
  document: one(documents, {
    fields: [documentVersions.documentId],
    references: [documents.id],
  }),
}));

export const documentRequirementsRelations = relations(documentRequirements, ({ one }) => ({
  customer: one(customers, {
    fields: [documentRequirements.customerId],
    references: [customers.id],
  }),
  fulfilledDocument: one(documents, {
    fields: [documentRequirements.fulfilledDocumentId],
    references: [documents.id],
  }),
}));

export const documentReviewsRelations = relations(documentReviews, ({ one }) => ({
  document: one(documents, {
    fields: [documentReviews.documentId],
    references: [documents.id],
  }),
}));

export const documentLinksRelations = relations(documentLinks, ({ one }) => ({
  document: one(documents, {
    fields: [documentLinks.documentId],
    references: [documents.id],
  }),
}));

export const documentExtractionsRelations = relations(documentExtractions, ({ one }) => ({
  document: one(documents, {
    fields: [documentExtractions.documentId],
    references: [documents.id],
  }),
}));

// ====================================================
// PHASE 26: RELATIONSHIP DIGITAL TWIN TABLES
// ====================================================

// 1. Normalized Relationship Events (Index/Timeline layer)
export const relationshipEvents = pgTable(
  'relationship_events',
  {
    id: serial('id').primaryKey(),
    eventId: text('event_id').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    eventType: text('event_type').notNull(),
    sourceEntity: text('source_entity').notNull(),
    sourceId: text('source_id').notNull(),
    timestamp: timestamp('timestamp').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    importance: text('importance').notNull().default('MEDIUM'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    relEvtCustIdx: index('idx_rel_evt_cust_id').on(table.customerId),
    relEvtTimeIdx: index('idx_rel_evt_timestamp').on(table.timestamp),
    relEvtTypeIdx: index('idx_rel_evt_type').on(table.eventType),
    relEvtSourceIdx: index('idx_rel_evt_source').on(table.sourceEntity),
  })
);

// 2. Relationship State History
export const relationshipStateHistory = pgTable(
  'relationship_state_history',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    state: text('state').notNull(),
    previousState: text('previous_state'),
    reason: text('reason').notNull(),
    evidence: text('evidence').notNull(),
    source: text('source').notNull().default('COREvia Relationship State Engine'),
    calculatedAt: timestamp('calculated_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    relStateCustIdx: index('idx_rel_state_cust_id').on(table.customerId),
    relStateCalcIdx: index('idx_rel_state_calculated_at').on(table.calculatedAt),
  })
);

// 3. Relationship Snapshots
export const relationshipSnapshots = pgTable(
  'relationship_snapshots',
  {
    id: serial('id').primaryKey(),
    snapshotCode: text('snapshot_code').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    snapshotDate: timestamp('snapshot_date').notNull(),
    state: text('state').notNull(),
    coreScore: integer('core_score').notNull(),
    previousCoreScore: integer('previous_core_score'),
    relationshipValue: numeric('relationship_value', { precision: 15, scale: 2 }).notNull(),
    activeProductsCount: integer('active_products_count').notNull().default(0),
    openOpportunitiesCount: integer('open_opportunities_count').notNull().default(0),
    openCasesCount: integer('open_cases_count').notNull().default(0),
    openTasksCount: integer('open_tasks_count').notNull().default(0),
    relationshipMomentum: text('relationship_momentum').notNull().default('STABLE'),
    metrics: text('metrics').notNull(),
    summary: text('summary').notNull(),
    materialChanges: text('material_changes'),
    isMeaningful: boolean('is_meaningful').notNull().default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    relSnapCustIdx: index('idx_rel_snap_cust_id').on(table.customerId),
    relSnapDateIdx: index('idx_rel_snap_date').on(table.snapshotDate),
  })
);

// 4. Relationship Signal Events
export const relationshipSignalEvents = pgTable(
  'relationship_signal_events',
  {
    id: serial('id').primaryKey(),
    signalCode: text('signal_code').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    signalType: text('signal_type').notNull(),
    headline: text('headline').notNull(),
    severity: text('severity').notNull(),
    evidence: text('evidence').notNull(),
    source: text('source').notNull(),
    recommendedAction: text('recommended_action'),
    linkedNbaId: integer('linked_nba_id'),
    status: text('status').notNull().default('ACTIVE'),
    resolvedAt: timestamp('resolved_at'),
    resolvedById: integer('resolved_by_id').references(() => users.id),
    resolutionNotes: text('resolution_notes'),
    timestamp: timestamp('timestamp').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    relSigCustIdx: index('idx_rel_sig_cust_id').on(table.customerId),
    relSigStatusIdx: index('idx_rel_sig_status').on(table.status),
    relSigSevIdx: index('idx_rel_sig_severity').on(table.severity),
  })
);

// 5. Relationship Action Trace
export const relationshipActionTrace = pgTable(
  'relationship_action_trace',
  {
    id: serial('id').primaryKey(),
    traceCode: text('trace_code').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    actionTitle: text('action_title').notNull(),
    actionType: text('action_type').notNull(),
    originEngine: text('origin_engine').notNull(),
    evidenceRef: text('evidence_ref'),
    evidenceSummary: text('evidence_summary'),
    status: text('status').notNull().default('PENDING'),
    outcomeSummary: text('outcome_summary'),
    entityImpact: text('entity_impact'),
    nextStep: text('next_step'),
    executedById: integer('executed_by_id').references(() => users.id),
    executedAt: timestamp('executed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    relTraceCustIdx: index('idx_rel_trace_cust_id').on(table.customerId),
    relTraceStatusIdx: index('idx_rel_trace_status').on(table.status),
  })
);

// Relations
export const relationshipEventsRelations = relations(relationshipEvents, ({ one }) => ({
  customer: one(customers, {
    fields: [relationshipEvents.customerId],
    references: [customers.id],
  }),
}));

export const relationshipStateHistoryRelations = relations(relationshipStateHistory, ({ one }) => ({
  customer: one(customers, {
    fields: [relationshipStateHistory.customerId],
    references: [customers.id],
  }),
}));

export const relationshipSnapshotsRelations = relations(relationshipSnapshots, ({ one }) => ({
  customer: one(customers, {
    fields: [relationshipSnapshots.customerId],
    references: [customers.id],
  }),
}));

export const relationshipSignalEventsRelations = relations(relationshipSignalEvents, ({ one }) => ({
  customer: one(customers, {
    fields: [relationshipSignalEvents.customerId],
    references: [customers.id],
  }),
  resolvedBy: one(users, {
    fields: [relationshipSignalEvents.resolvedById],
    references: [users.id],
  }),
}));

export const relationshipActionTraceRelations = relations(relationshipActionTrace, ({ one }) => ({
  customer: one(customers, {
    fields: [relationshipActionTrace.customerId],
    references: [customers.id],
  }),
  executedBy: one(users, {
    fields: [relationshipActionTrace.executedById],
    references: [users.id],
  }),
}));

// ====================================================
// PHASE 28: RELATIONSHIP GRAPH & NETWORK INTELLIGENCE
// ====================================================

export const relationshipEdges = pgTable(
  'relationship_edges',
  {
    id: serial('id').primaryKey(),
    sourceEntityType: text('source_entity_type').notNull(), // CUSTOMER, HOUSEHOLD, BUSINESS, ACCOUNT, etc.
    sourceEntityId: text('source_entity_id').notNull(),
    targetEntityType: text('target_entity_type').notNull(), // HOUSEHOLD, BUSINESS, CUSTOMER, ACCOUNT, etc.
    targetEntityId: text('target_entity_id').notNull(),
    relationshipType: text('relationship_type').notNull(), // CUSTOMER_BELONGS_TO_HOUSEHOLD, CUSTOMER_ASSOCIATED_WITH_BUSINESS, etc.
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE, DORMANT, PENDING, ARCHIVED
    provenanceType: text('provenance_type').notNull().default('DIRECT_RECORD'), // DIRECT_RECORD, DERIVED_FROM_ACCOUNT_OWNERSHIP, etc.
    provenanceId: text('provenance_id'),
    visibilityScope: text('visibility_scope').notNull().default('BRANCH'), // PUBLIC, BRANCH, CONFIDENTIAL, RESTRICTED
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    relEdgeSourceIdx: index('idx_rel_edge_source').on(table.sourceEntityType, table.sourceEntityId),
    relEdgeTargetIdx: index('idx_rel_edge_target').on(table.targetEntityType, table.targetEntityId),
    relEdgeTypeIdx: index('idx_rel_edge_type').on(table.relationshipType),
    relEdgeStatusIdx: index('idx_rel_edge_status').on(table.status),
    relEdgeUnique: uniqueIndex('idx_rel_edge_unique_pair').on(
      table.sourceEntityType,
      table.sourceEntityId,
      table.targetEntityType,
      table.targetEntityId,
      table.relationshipType
    ),
  })
);

// ====================================================
// PHASE 29: AI DECISION TRACE & EXPLAINABILITY PLATFORM
// ====================================================

export const decisionTraces = pgTable(
  'decision_traces',
  {
    id: serial('id').primaryKey(),
    decisionId: text('decision_id').notNull().unique(), // e.g. DT-20260928-00142
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
    sourceModule: text('source_module').notNull(), // CUSTOMER_360, NEXT_BEST_ACTION, OPPORTUNITY_RADAR, etc.
    sourceEngine: text('source_engine').notNull(), // CORE_SCORE, RELATIONSHIP_INTELLIGENCE, NEXT_BEST_ACTION, etc.
    decisionType: text('decision_type').notNull(), // CORE_SCORE_CHANGE, RELATIONSHIP_INSIGHT, etc.
    decisionStatus: text('decision_status').notNull().default('PENDING'), // PENDING, CONFIRMED, REJECTED, EXECUTED, CANCELLED, EXPIRED
    recommendationTitle: text('recommendation_title').notNull(),
    recommendationSummary: text('recommendation_summary').notNull(),
    recommendationPayload: text('recommendation_payload'), // JSON payload
    decisionMode: text('decision_mode').notNull().default('DETERMINISTIC'), // DETERMINISTIC, AI_GENERATED, HYBRID, SYSTEM_RULE
    confidence: text('confidence'), // Legitimate source engine confidence or null
    confidenceBasis: text('confidence_basis').notNull().default('Rule-based'), // 'Rule-based', 'Deterministic evidence + AI explanation'
    limitations: text('limitations'), // JSON string array of contextual limitations
    actionTitle: text('action_title'),
    actionType: text('action_type'),
    actionPayload: text('action_payload'),
    confirmedById: integer('confirmed_by_id').references(() => users.id, { onDelete: 'set null' }),
    confirmedAt: timestamp('confirmed_at'),
    executionStatus: text('execution_status'), // PENDING, SUCCESS, FAILED, CANCELLED
    executedAt: timestamp('executed_at'),
    outcome: text('outcome'),
    generatedAt: timestamp('generated_at').defaultNow().notNull(),
    dataAsOf: timestamp('data_as_of').defaultNow().notNull(),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    decisionIdIdx: uniqueIndex('idx_decision_trace_code').on(table.decisionId),
    decisionCustomerIdx: index('idx_decision_trace_customer').on(table.customerId),
    decisionEngineIdx: index('idx_decision_trace_engine').on(table.sourceEngine),
    decisionTypeIdx: index('idx_decision_trace_type').on(table.decisionType),
    decisionStatusIdx: index('idx_decision_trace_status').on(table.decisionStatus),
    decisionGeneratedIdx: index('idx_decision_trace_generated').on(table.generatedAt),
  })
);

export const decisionTraceEvidence = pgTable(
  'decision_trace_evidence',
  {
    id: serial('id').primaryKey(),
    decisionTraceId: integer('decision_trace_id')
      .references(() => decisionTraces.id, { onDelete: 'cascade' })
      .notNull(),
    evidenceType: text('evidence_type').notNull(), // CUSTOMER_FACT, SCORE_CHANGE, SERVICE_EVENT, etc.
    sourceEngine: text('source_engine').notNull(),
    sourceEntityType: text('source_entity_type').notNull(),
    sourceEntityId: text('source_entity_id').notNull(),
    sourceField: text('source_field'),
    description: text('description').notNull(),
    observedValue: text('observed_value').notNull(),
    previousValue: text('previous_value'),
    changeDirection: text('change_direction'), // INCREASE, DECREASE, STABLE, TRIGGERED, RESOLVED, BREACHED
    contributionType: text('contribution_type').notNull().default('SUPPORTING'), // PRIMARY, SUPPORTING, CONTEXT, CONSTRAINT, NEGATIVE_SIGNAL
    contributionWeight: text('contribution_weight'), // Qualitative or numeric only if source provided
    dataAsOf: timestamp('data_as_of').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    traceEvidenceTraceIdx: index('idx_trace_evidence_trace_id').on(table.decisionTraceId),
    traceEvidenceTypeIdx: index('idx_trace_evidence_type').on(table.evidenceType),
    traceEvidenceEntityIdx: index('idx_trace_evidence_entity').on(table.sourceEntityType, table.sourceEntityId),
  })
);

export const decisionTraceSourceNodes = pgTable(
  'decision_trace_source_nodes',
  {
    id: serial('id').primaryKey(),
    decisionTraceId: integer('decision_trace_id')
      .references(() => decisionTraces.id, { onDelete: 'cascade' })
      .notNull(),
    orderIndex: integer('order_index').notNull().default(0),
    sourceType: text('source_type').notNull(), // CUSTOMER, ACCOUNT, LOAN, SERVICE_CASE, etc.
    sourceId: text('source_id').notNull(),
    sourceEngine: text('source_engine').notNull(),
    description: text('description').notNull(),
    sourceTimestamp: timestamp('source_timestamp').defaultNow().notNull(),
    authorizationScope: text('authorization_scope').notNull().default('BRANCH'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    traceSourceTraceIdx: index('idx_trace_source_trace_id').on(table.decisionTraceId),
    traceSourceOrderIdx: index('idx_trace_source_order').on(table.decisionTraceId, table.orderIndex),
  })
);

export const decisionTracesRelations = relations(decisionTraces, ({ one, many }) => ({
  customer: one(customers, {
    fields: [decisionTraces.customerId],
    references: [customers.id],
  }),
  user: one(users, {
    fields: [decisionTraces.userId],
    references: [users.id],
  }),
  confirmedBy: one(users, {
    fields: [decisionTraces.confirmedById],
    references: [users.id],
  }),
  evidence: many(decisionTraceEvidence),
  sourceNodes: many(decisionTraceSourceNodes),
}));

export const decisionTraceEvidenceRelations = relations(decisionTraceEvidence, ({ one }) => ({
  trace: one(decisionTraces, {
    fields: [decisionTraceEvidence.decisionTraceId],
    references: [decisionTraces.id],
  }),
}));

export const decisionTraceSourceNodesRelations = relations(decisionTraceSourceNodes, ({ one }) => ({
  trace: one(decisionTraces, {
    fields: [decisionTraceSourceNodes.decisionTraceId],
    references: [decisionTraces.id],
  }),
}));

// ====================================================
// PHASE 30: RELATIONSHIP STRATEGY SIMULATOR & WHAT-IF SANDBOX
// ====================================================

export const relationshipScenarios = pgTable(
  'relationship_scenarios',
  {
    id: serial('id').primaryKey(),
    scenarioId: text('scenario_id').notNull().unique(), // e.g. STR-20260928-001
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    createdBy: integer('created_by')
      .references(() => users.id)
      .notNull(),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('DRAFT'), // DRAFT, SIMULATED, SAVED, ARCHIVED
    baseSnapshot: jsonb('base_snapshot').notNull(),
    resultSnapshot: jsonb('result_snapshot'),
    comparisonDelta: jsonb('comparison_delta'),
    decisionTraceId: text('decision_trace_id'),
    isStale: boolean('is_stale').default(false).notNull(),
    staleAsOf: timestamp('stale_as_of'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    scenarioCustIdx: index('idx_scenarios_customer_id').on(table.customerId),
    scenarioCreatedByIdx: index('idx_scenarios_created_by').on(table.createdBy),
    scenarioStatusIdx: index('idx_scenarios_status').on(table.status),
    scenarioCodeIdx: index('idx_scenarios_scenario_id').on(table.scenarioId),
    scenarioCreatedAtIdx: index('idx_scenarios_created_at').on(table.createdAt),
  })
);

export const relationshipScenarioActions = pgTable(
  'relationship_scenario_actions',
  {
    id: serial('id').primaryKey(),
    scenarioId: integer('scenario_id')
      .references(() => relationshipScenarios.id, { onDelete: 'cascade' })
      .notNull(),
    actionType: text('action_type').notNull(),
    targetEntityType: text('target_entity_type'),
    targetEntityId: text('target_entity_id'),
    parameters: jsonb('parameters'),
    orderIndex: integer('order_index').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    scenarioActionScenarioIdx: index('idx_scenario_actions_scenario_id').on(table.scenarioId),
    scenarioActionOrderIdx: index('idx_scenario_actions_order').on(table.scenarioId, table.orderIndex),
  })
);

export const relationshipScenariosRelations = relations(relationshipScenarios, ({ one, many }) => ({
  customer: one(customers, {
    fields: [relationshipScenarios.customerId],
    references: [customers.id],
  }),
  creator: one(users, {
    fields: [relationshipScenarios.createdBy],
    references: [users.id],
  }),
  actions: many(relationshipScenarioActions),
}));

export const relationshipScenarioActionsRelations = relations(relationshipScenarioActions, ({ one }) => ({
  scenario: one(relationshipScenarios, {
    fields: [relationshipScenarioActions.scenarioId],
    references: [relationshipScenarios.id],
  }),
}));

// ====================================================
// 26. Controlled Banking Agent & Execution Framework (Phase 31)
// ====================================================

export const agentSessions = pgTable(
  'agent_sessions',
  {
    id: serial('id').primaryKey(),
    sessionId: text('session_id').notNull().unique(), // SES-20260929-00104
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    contextType: text('context_type').notNull(), // CUSTOMER, ACCOUNT, LOAN, OPPORTUNITY, SERVICE_CASE, etc.
    contextId: text('context_id'),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, AWAITING_APPROVAL, EXECUTING, COMPLETED, PARTIALLY_COMPLETED, CANCELLED, FAILED, EXPIRED
    startedAt: timestamp('started_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    sessionUserIdx: index('idx_agent_sessions_user_id').on(table.userId),
    sessionCustIdx: index('idx_agent_sessions_customer_id').on(table.customerId),
    sessionStatusIdx: index('idx_agent_sessions_status').on(table.status),
    sessionCreatedAtIdx: index('idx_agent_sessions_created_at').on(table.createdAt),
    sessionCodeIdx: uniqueIndex('idx_agent_sessions_session_id').on(table.sessionId),
  })
);

export const agentPlans = pgTable(
  'agent_plans',
  {
    id: serial('id').primaryKey(),
    planId: text('plan_id').notNull().unique(), // PLN-20260929-00104
    sessionId: integer('session_id')
      .references(() => agentSessions.id, { onDelete: 'cascade' })
      .notNull(),
    customerId: integer('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    objective: text('objective').notNull(),
    status: text('status').notNull().default('DRAFT'), // DRAFT, AWAITING_APPROVAL, APPROVED, EXECUTING, COMPLETED, PARTIALLY_COMPLETED, REJECTED, CANCELLED, FAILED, EXPIRED
    planVersion: integer('plan_version').notNull().default(1),
    decisionTraceId: text('decision_trace_id'),
    scenarioId: text('scenario_id'),
    estimatedEffect: text('estimated_effect'),
    planRationale: text('plan_rationale'),
    rejectionReason: text('rejection_reason'),
    expiresAt: timestamp('expires_at'),
    approvedAt: timestamp('approved_at'),
    approvedBy: integer('approved_by').references(() => users.id, { onDelete: 'set null' }),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    planSessionIdx: index('idx_agent_plans_session_id').on(table.sessionId),
    planCustIdx: index('idx_agent_plans_customer_id').on(table.customerId),
    planStatusIdx: index('idx_agent_plans_status').on(table.status),
    planCreatedAtIdx: index('idx_agent_plans_created_at').on(table.createdAt),
    planCodeIdx: uniqueIndex('idx_agent_plans_plan_id').on(table.planId),
  })
);

export const agentPlanSteps = pgTable(
  'agent_plan_steps',
  {
    id: serial('id').primaryKey(),
    planId: integer('plan_id')
      .references(() => agentPlans.id, { onDelete: 'cascade' })
      .notNull(),
    stepNumber: integer('step_number').notNull(),
    actionType: text('action_type').notNull(),
    targetEntityType: text('target_entity_type'),
    targetEntityId: text('target_entity_id'),
    parameters: jsonb('parameters'),
    rationale: text('rationale').notNull(),
    requiredPermission: text('required_permission').notNull().default('customers:read'),
    status: text('status').notNull().default('PENDING'), // PENDING, AUTHORIZED, EXECUTING, COMPLETED, FAILED, SKIPPED, CANCELLED
    requiresConfirmation: boolean('requires_confirmation').notNull().default(true),
    dependsOnStepNumber: integer('depends_on_step_number'),
    dependencyPolicy: text('dependency_policy').default('SKIP'), // SKIP, REQUIRE_REVIEW
    idempotencyKey: text('idempotency_key'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    resultSummary: text('result_summary'),
    auditLogId: integer('audit_log_id'),
    verifiedAt: timestamp('verified_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    stepPlanIdx: index('idx_agent_plan_steps_plan_id').on(table.planId),
    stepStatusIdx: index('idx_agent_plan_steps_status').on(table.status),
    stepOrderIdx: index('idx_agent_plan_steps_order').on(table.planId, table.stepNumber),
    stepIdempotencyIdx: index('idx_agent_plan_steps_idempotency').on(table.idempotencyKey),
  })
);

export const agentSessionsRelations = relations(agentSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [agentSessions.userId],
    references: [users.id],
  }),
  customer: one(customers, {
    fields: [agentSessions.customerId],
    references: [customers.id],
  }),
  plans: many(agentPlans),
}));

export const agentPlansRelations = relations(agentPlans, ({ one, many }) => ({
  session: one(agentSessions, {
    fields: [agentPlans.sessionId],
    references: [agentSessions.id],
  }),
  customer: one(customers, {
    fields: [agentPlans.customerId],
    references: [customers.id],
  }),
  approver: one(users, {
    fields: [agentPlans.approvedBy],
    references: [users.id],
  }),
  steps: many(agentPlanSteps),
}));

export const agentPlanStepsRelations = relations(agentPlanSteps, ({ one }) => ({
  plan: one(agentPlans, {
    fields: [agentPlanSteps.planId],
    references: [agentPlans.id],
  }),
}));

// ====================================================
// 27. Relationship Value Intelligence (Phase 32)
// ====================================================

export const relationshipValueSnapshots = pgTable(
  'relationship_value_snapshots',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    snapshotDate: date('snapshot_date').notNull(),
    relationshipValue: numeric('relationship_value', { precision: 18, scale: 2 }).notNull().default('0.00'),
    coreScore: integer('core_score').notNull(),
    productDepth: integer('product_depth').notNull().default(0),
    engagement: integer('engagement').notNull().default(0),
    serviceHealth: text('service_health').notNull().default('GOOD'), // EXCELLENT, GOOD, FAIR, CRITICAL, POOR
    relationshipMomentum: text('relationship_momentum').notNull().default('STABLE'), // ACCELERATING, STABLE, DECLINING, STRONG, MODERATE, WEAK
    opportunityCoverage: numeric('opportunity_coverage', { precision: 5, scale: 2 }).notNull().default('0.00'),
    commitmentHealth: numeric('commitment_health', { precision: 5, scale: 2 }).notNull().default('0.00'),
    activityHealth: numeric('activity_health', { precision: 5, scale: 2 }).notNull().default('0.00'),
    relationshipState: text('relationship_state').notNull().default('STABLE'),
    sourceVersion: text('source_version').notNull().default('1.0'),
    scenarioId: text('scenario_id'),
    decisionTraceId: text('decision_trace_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    rvCustIdx: index('idx_rv_snapshots_customer_id').on(table.customerId),
    rvDateIdx: index('idx_rv_snapshots_date').on(table.snapshotDate),
    rvStateIdx: index('idx_rv_snapshots_state').on(table.relationshipState),
    rvCreatedAtIdx: index('idx_rv_snapshots_created_at').on(table.createdAt),
  })
);

export const relationshipValueSnapshotsRelations = relations(relationshipValueSnapshots, ({ one }) => ({
  customer: one(customers, {
    fields: [relationshipValueSnapshots.customerId],
    references: [customers.id],
  }),
}));

// ====================================================
// 28. Customer Journey Orchestrator & Lifecycle (Phase 33)
// ====================================================

export const journeyTemplates = pgTable(
  'journey_templates',
  {
    id: serial('id').primaryKey(),
    templateCode: text('template_code').notNull().unique(), // e.g. NEW_CUSTOMER_ONBOARDING, LOAN_APPLICATION
    name: text('name').notNull(),
    description: text('description').notNull(),
    category: text('category').notNull().default('LIFECYCLE'), // ONBOARDING, SERVICE, GROWTH, CREDIT, RETENTION, REVIEW
    defaultPriority: text('default_priority').notNull().default('NORMAL'), // LOW, NORMAL, HIGH, CRITICAL
    targetDurationDays: integer('target_duration_days').notNull().default(14),
    defaultOwnerRole: text('default_owner_role').notNull().default('RELATIONSHIP_MANAGER'),
    isActive: boolean('is_active').notNull().default(true),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    templateCodeIdx: uniqueIndex('idx_journey_templates_code').on(table.templateCode),
    categoryIdx: index('idx_journey_templates_category').on(table.category),
    activeIdx: index('idx_journey_templates_active').on(table.isActive),
  })
);

export const journeyTemplateSteps = pgTable(
  'journey_template_steps',
  {
    id: serial('id').primaryKey(),
    templateId: integer('template_id')
      .references(() => journeyTemplates.id, { onDelete: 'cascade' })
      .notNull(),
    stepOrder: integer('step_order').notNull(),
    stepKey: text('step_key').notNull(), // e.g. kyc_verification
    name: text('name').notNull(),
    description: text('description').notNull(),
    stepType: text('step_type').notNull(), // KYC, DOCUMENT, TASK, INTERACTION, REVIEW, APPROVAL, SERVICE_CASE, OPPORTUNITY, ONBOARDING, COMMITMENT, SIGNAL, AGENT_ACTION, MANUAL_CHECK, WAITING_PERIOD
    required: boolean('required').notNull().default(true),
    slaDays: integer('sla_days').notNull().default(3),
    dependencyStepKeys: jsonb('dependency_step_keys'), // string[] of prerequisite step keys
    defaultOwnerRole: text('default_owner_role').notNull().default('RELATIONSHIP_MANAGER'),
    evidenceType: text('evidence_type'), // KYC_RECORD, DOCUMENT, TASK, SERVICE_CASE, OPPORTUNITY, REVIEW, INTERACTION, APPROVAL, SIGNAL
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    tplStepIdx: index('idx_jt_steps_template_id').on(table.templateId),
    stepOrderIdx: index('idx_jt_steps_order').on(table.templateId, table.stepOrder),
  })
);

export const customerJourneys = pgTable(
  'customer_journeys',
  {
    id: serial('id').primaryKey(),
    journeyId: text('journey_id').notNull().unique(), // e.g. JRN-2026-10482-01
    customerId: integer('customer_id')
      .references(() => customers.id, { onDelete: 'cascade' })
      .notNull(),
    templateId: integer('template_id').references(() => journeyTemplates.id),
    journeyType: text('journey_type').notNull(), // templateCode
    name: text('name').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('NOT_STARTED'), // NOT_STARTED, ACTIVE, ON_HOLD, BLOCKED, COMPLETED, CANCELLED, FAILED, EXPIRED
    priority: text('priority').notNull().default('NORMAL'), // LOW, NORMAL, HIGH, CRITICAL
    ownerId: integer('owner_id').references(() => users.id),
    ownerRole: text('owner_role').notNull().default('RELATIONSHIP_MANAGER'),
    currentStepId: integer('current_step_id'),
    startedAt: timestamp('started_at'),
    targetCompletionAt: timestamp('target_completion_at'),
    completedAt: timestamp('completed_at'),
    blockedReason: text('blocked_reason'),
    blockedAt: timestamp('blocked_at'),
    slaStatus: text('sla_status').notNull().default('ON_TRACK'), // ON_TRACK, AT_RISK, BREACHED, COMPLETED
    escalatedAt: timestamp('escalated_at'),
    escalatedTo: integer('escalated_to').references(() => users.id),
    escalatedBy: integer('escalated_by').references(() => users.id),
    escalationReason: text('escalation_reason'),
    decisionTraceId: text('decision_trace_id'),
    metadata: jsonb('metadata'),
    createdBy: integer('created_by').references(() => users.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    journeyIdIdx: uniqueIndex('idx_cust_journeys_journey_id').on(table.journeyId),
    custIdx: index('idx_cust_journeys_customer_id').on(table.customerId),
    statusIdx: index('idx_cust_journeys_status').on(table.status),
    ownerIdx: index('idx_cust_journeys_owner_id').on(table.ownerId),
    typeIdx: index('idx_cust_journeys_type').on(table.journeyType),
    slaIdx: index('idx_cust_journeys_sla').on(table.slaStatus),
    createdIdx: index('idx_cust_journeys_created_at').on(table.createdAt),
  })
);

export const customerJourneySteps = pgTable(
  'customer_journey_steps',
  {
    id: serial('id').primaryKey(),
    journeyId: integer('journey_id')
      .references(() => customerJourneys.id, { onDelete: 'cascade' })
      .notNull(),
    stepId: text('step_id').notNull(), // e.g. JRN-2026-10482-01-S01
    stepNumber: integer('step_number').notNull(),
    stepKey: text('step_key').notNull(),
    stepType: text('step_type').notNull(), // KYC, DOCUMENT, TASK, INTERACTION, REVIEW, APPROVAL, SERVICE_CASE, OPPORTUNITY, ONBOARDING, COMMITMENT, SIGNAL, AGENT_ACTION, MANUAL_CHECK, WAITING_PERIOD
    name: text('name').notNull(),
    description: text('description').notNull(),
    status: text('status').notNull().default('PENDING'), // PENDING, READY, IN_PROGRESS, WAITING, BLOCKED, COMPLETED, SKIPPED, FAILED, CANCELLED
    ownerId: integer('owner_id').references(() => users.id),
    ownerRole: text('owner_role'),
    required: boolean('required').notNull().default(true),
    dependency: text('dependency'), // JSON or comma-separated step keys
    slaDays: integer('sla_days').notNull().default(3),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    dueAt: timestamp('due_at'),
    slaStatus: text('sla_status').notNull().default('ON_TRACK'), // ON_TRACK, AT_RISK, BREACHED, COMPLETED
    blockedReason: text('blocked_reason'),
    completionEvidence: jsonb('completion_evidence'), // { evidenceType, entityId, entityCode, summary, verifiedAt, verifiedBy }
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    cjsJourneyIdx: index('idx_cjs_journey_id').on(table.journeyId),
    cjsStepIdIdx: index('idx_cjs_step_id').on(table.stepId),
    cjsStatusIdx: index('idx_cjs_status').on(table.status),
    cjsOwnerIdx: index('idx_cjs_owner_id').on(table.ownerId),
    cjsDueAtIdx: index('idx_cjs_due_at').on(table.dueAt),
  })
);

export const journeyOutcomes = pgTable(
  'journey_outcomes',
  {
    id: serial('id').primaryKey(),
    journeyId: integer('journey_id')
      .references(() => customerJourneys.id, { onDelete: 'cascade' })
      .notNull(),
    outcomeType: text('outcome_type').notNull(), // COMPLETED_SUCCESSFULLY, COMPLETED_WITH_EXCEPTION, CANCELLED, FAILED, CUSTOMER_DECLINED, INTERNAL_BLOCK, EXPIRED
    outcome: text('outcome').notNull(),
    summary: text('summary').notNull(),
    evidence: jsonb('evidence'),
    recordedBy: integer('recorded_by').references(() => users.id).notNull(),
    recordedAt: timestamp('recorded_at').defaultNow().notNull(),
    metadata: jsonb('metadata'),
  },
  (table) => ({
    joJourneyIdx: index('idx_journey_outcomes_journey_id').on(table.journeyId),
    joOutcomeTypeIdx: index('idx_journey_outcomes_type').on(table.outcomeType),
  })
);

export const journeyTemplatesRelations = relations(journeyTemplates, ({ many }) => ({
  steps: many(journeyTemplateSteps),
  journeys: many(customerJourneys),
}));

export const journeyTemplateStepsRelations = relations(journeyTemplateSteps, ({ one }) => ({
  template: one(journeyTemplates, {
    fields: [journeyTemplateSteps.templateId],
    references: [journeyTemplates.id],
  }),
}));

export const customerJourneysRelations = relations(customerJourneys, ({ one, many }) => ({
  customer: one(customers, {
    fields: [customerJourneys.customerId],
    references: [customers.id],
  }),
  template: one(journeyTemplates, {
    fields: [customerJourneys.templateId],
    references: [journeyTemplates.id],
  }),
  owner: one(users, {
    fields: [customerJourneys.ownerId],
    references: [users.id],
  }),
  steps: many(customerJourneySteps),
  outcomes: many(journeyOutcomes),
}));

export const customerJourneyStepsRelations = relations(customerJourneySteps, ({ one }) => ({
  journey: one(customerJourneys, {
    fields: [customerJourneySteps.journeyId],
    references: [customerJourneys.id],
  }),
  owner: one(users, {
    fields: [customerJourneySteps.ownerId],
    references: [users.id],
  }),
}));

export const journeyOutcomesRelations = relations(journeyOutcomes, ({ one }) => ({
  journey: one(customerJourneys, {
    fields: [journeyOutcomes.journeyId],
    references: [customerJourneys.id],
  }),
  recorder: one(users, {
    fields: [journeyOutcomes.recordedBy],
    references: [users.id],
  }),
}));

// ==========================================
// 29. HOUSEHOLD & BUSINESS GROUP 360 (PHASE 34)
// ==========================================

export const relationshipGroups = pgTable(
  'relationship_groups',
  {
    id: serial('id').primaryKey(),
    groupId: text('group_id').notNull().unique(), // e.g. HH-10482, BIZ-10482
    groupType: text('group_type').notNull(), // HOUSEHOLD, BUSINESS, BUSINESS_GROUP
    name: text('name').notNull(),
    displayName: text('display_name').notNull(),
    description: text('description'),
    status: text('status').notNull().default('ACTIVE'), // ACTIVE, INACTIVE, UNDER_REVIEW, ARCHIVED
    primaryCustomerId: integer('primary_customer_id').references(() => customers.id, { onDelete: 'set null' }),
    primaryBusinessId: text('primary_business_id'),
    relationshipManagerId: integer('relationship_manager_id').references(() => users.id, { onDelete: 'set null' }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    rgGroupIdIdx: uniqueIndex('idx_relationship_groups_group_id').on(table.groupId),
    rgGroupTypeIdx: index('idx_relationship_groups_type').on(table.groupType),
    rgPrimaryCustIdx: index('idx_relationship_groups_primary_cust').on(table.primaryCustomerId),
    rgRmIdx: index('idx_relationship_groups_rm_id').on(table.relationshipManagerId),
    rgStatusIdx: index('idx_relationship_groups_status').on(table.status),
  })
);

export const relationshipGroupMembers = pgTable(
  'relationship_group_members',
  {
    id: serial('id').primaryKey(),
    groupId: integer('group_id')
      .references(() => relationshipGroups.id, { onDelete: 'cascade' })
      .notNull(),
    entityType: text('entity_type').notNull(), // CUSTOMER, BUSINESS
    entityId: text('entity_id').notNull(), // Customer ID (number as string) or Business ID
    role: text('role').notNull(), // Head of Family, Managing Director, Director, Member, Partner, etc.
    relationshipType: text('relationship_type').notNull(), // HOUSEHOLD_MEMBER, SPOUSE, DEPENDENT, PARENT, CHILD, OWNER, DIRECTOR, SHAREHOLDER, PARTNER, AUTHORIZED_SIGNATORY, BENEFICIAL_OWNER, KEY_PERSON, RELATED_BUSINESS, OTHER
    ownershipPercentage: numeric('ownership_percentage', { precision: 5, scale: 2 }),
    isPrimary: boolean('is_primary').notNull().default(false),
    validFrom: date('valid_from'),
    validTo: date('valid_to'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    rgmGroupIdIdx: index('idx_group_members_group_id').on(table.groupId),
    rgmEntityIdx: index('idx_group_members_entity').on(table.entityType, table.entityId),
    rgmRelTypeIdx: index('idx_group_members_rel_type').on(table.relationshipType),
  })
);

export const relationshipGroupsRelations = relations(relationshipGroups, ({ one, many }) => ({
  primaryCustomer: one(customers, {
    fields: [relationshipGroups.primaryCustomerId],
    references: [customers.id],
  }),
  relationshipManager: one(users, {
    fields: [relationshipGroups.relationshipManagerId],
    references: [users.id],
  }),
  members: many(relationshipGroupMembers),
}));

export const relationshipGroupMembersRelations = relations(relationshipGroupMembers, ({ one }) => ({
  group: one(relationshipGroups, {
    fields: [relationshipGroupMembers.groupId],
    references: [relationshipGroups.id],
  }),
}));

// ============================================================================
// 30. Trust & Governance Center (Phase 35)
// ============================================================================

export const governanceExceptions = pgTable(
  'governance_exceptions',
  {
    id: serial('id').primaryKey(),
    exceptionId: text('exception_id').notNull().unique(), // e.g. GEX-2026-00101
    category: text('category').notNull(), // SECURITY, AUTHORIZATION, AI, AGENT, DATA, AUDIT, CONFIGURATION, INTEGRATION, OPERATIONAL
    severity: text('severity').notNull(), // INFO, LOW, MEDIUM, HIGH, CRITICAL
    resourceType: text('resource_type'), // AGENT_PLAN, DECISION_TRACE, CUSTOMER, GROUP, JOURNEY, USER, SYSTEM
    resourceId: text('resource_id'), // Corresponding resource identifier
    description: text('description').notNull(),
    detectedAt: timestamp('detected_at').defaultNow().notNull(),
    status: text('status').notNull().default('OPEN'), // OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
    assignedTo: integer('assigned_to').references(() => users.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at'),
    resolution: text('resolution'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    gexExceptionIdIdx: uniqueIndex('idx_gex_exception_id').on(table.exceptionId),
    gexStatusIdx: index('idx_gex_status').on(table.status),
    gexCategoryIdx: index('idx_gex_category').on(table.category),
    gexSeverityIdx: index('idx_gex_severity').on(table.severity),
    gexAssignedIdx: index('idx_gex_assigned_to').on(table.assignedTo),
    gexDetectedIdx: index('idx_gex_detected_at').on(table.detectedAt),
  })
);

export const governanceExceptionsRelations = relations(governanceExceptions, ({ one }) => ({
  assignedUser: one(users, {
    fields: [governanceExceptions.assignedTo],
    references: [users.id],
  }),
}));
