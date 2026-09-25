import {
  BankAccount,
  CustomerKYC,
  LoanAccount,
  PaymentTransaction,
  TradeFinanceItem,
  PendingAuthorization,
  AuditLogEntry,
  BankExecutiveMetrics,
} from '../types/index.ts';

export const BANK_META = {
  institutionName: 'COREvia Bank of India',
  rbiLicense: 'RBI/SCB-2018/0428-MUM',
  scheduledCommercialBank: true,
  currentBranch: {
    code: '0104',
    name: 'Mumbai Fort Branch',
    ifsc: 'CRVI0001042',
    micr: '400078002',
    address: 'Maker Chambers IV, Ground Floor, Nariman Point, Mumbai - 400021',
    circle: 'Western Commercial Hub',
    clearingZone: 'Mumbai Metropolitan CTS Hub',
  },
  systemTerminal: {
    terminalId: 'TER-MUM-0104-A',
    workstationUser: 'Aditya Raj',
    userRole: 'Branch Operations Head / Checker L3',
    employeeId: 'EMP-782194',
    authLevel: 'LEVEL_3_UNRESTRICTED',
  },
  activeBusinessDate: '09-SEP-2026',
  systemStatus: 'ONLINE_ACTIVE',
  dayStatus: 'DAY_BEGIN_COMPLETED',
  eodScheduleTime: '20:30 IST',
};

export const INITIAL_METRICS: BankExecutiveMetrics = {
  totalDepositsInr: 482504200000, // ₹48,250.42 Cr
  totalAdvancesInr: 391802500000, // ₹39,180.25 Cr
  casaRatioPercentage: 43.8,
  crrMaintainedPercentage: 4.54, // Target 4.50%
  slrMaintainedPercentage: 18.65, // Target 18.00%
  netDemandAndTimeLiabilities: 512900000000, // ₹51,290.00 Cr
  crarCapitalAdequacyPercentage: 16.42, // Basel III min 11.5%
  grossNpaPercentage: 1.84,
  netNpaPercentage: 0.42,
  dailyClearingVolumeInr: 3845000000, // ₹384.50 Cr today
  dailyClearingTransactionsCount: 14290,
  vaultCashInHandInr: 42500000, // ₹4.25 Cr
  vaultCashAuthorizedLimitInr: 50000000, // ₹5.00 Cr
  pendingMakerCheckerCount: 4,
  activeBranchesCount: 428,
};

export const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    accountNumber: '10420100084912',
    cifNumber: 'CIF-9840192',
    customerName: 'Kalyan Steels & Forgings Ltd',
    accountType: 'CURRENT',
    schemeCode: 'CA-CORP-PREMIER',
    schemeName: 'Corporate High-Volume Current Account',
    currency: 'INR',
    availableBalance: 84250000, // ₹8.42 Cr
    ledgerBalance: 86450000,
    lienAmount: 2200000, // ₹22 Lakhs lien for inland LC
    unclearBalance: 0,
    interestRate: 0.0,
    openDate: '14-MAR-2021',
    status: 'ACTIVE',
    branchCode: '0104',
    branchName: 'Mumbai Fort Branch',
    ifscCode: 'CRVI0001042',
    panNumber: 'AAACK7849M',
  },
  {
    accountNumber: '10420200034189',
    cifNumber: 'CIF-3104921',
    customerName: 'Sun Solar Engineering Pvt Ltd',
    accountType: 'CURRENT',
    schemeCode: 'CA-SMART-BIZ',
    schemeName: 'MSME Smart Business Current',
    currency: 'INR',
    availableBalance: 12580000,
    ledgerBalance: 12580000,
    lienAmount: 0,
    unclearBalance: 0,
    interestRate: 0.0,
    openDate: '10-NOV-2022',
    status: 'ACTIVE',
    branchCode: '0104',
    branchName: 'Mumbai Fort Branch',
    ifscCode: 'CRVI0001042',
    panNumber: 'AACCS4910K',
  },
  {
    accountNumber: '10420300078120',
    cifNumber: 'CIF-8192044',
    customerName: 'Rajeshwari Sharma',
    accountType: 'SAVINGS',
    schemeCode: 'SB-GEN-PRIVILEGE',
    schemeName: 'Resident Savings Privilege',
    currency: 'INR',
    availableBalance: 1485600, // ₹14.85 Lakhs
    ledgerBalance: 1485600,
    lienAmount: 0,
    unclearBalance: 0,
    interestRate: 3.5,
    openDate: '02-JAN-2019',
    status: 'ACTIVE',
    branchCode: '0104',
    branchName: 'Mumbai Fort Branch',
    ifscCode: 'CRVI0001042',
    nomineeName: 'Vikram Sharma',
    nomineeRelation: 'Spouse',
    panNumber: 'BZVPS9012F',
  },
  {
    accountNumber: '10420300099415',
    cifNumber: 'CIF-5510294',
    customerName: 'Anand K. Varma',
    accountType: 'SAVINGS',
    schemeCode: 'SB-SAL-CORP',
    schemeName: 'Corporate Salary Account',
    currency: 'INR',
    availableBalance: 420800,
    ledgerBalance: 420800,
    lienAmount: 0,
    unclearBalance: 0,
    interestRate: 3.5,
    openDate: '19-JUL-2023',
    status: 'ACTIVE',
    branchCode: '0104',
    branchName: 'Mumbai Fort Branch',
    ifscCode: 'CRVI0001042',
    nomineeName: 'Shalini Varma',
    nomineeRelation: 'Mother',
    panNumber: 'AFGPV4321A',
  },
  {
    accountNumber: '10420400011834',
    cifNumber: 'CIF-9840192',
    customerName: 'Kalyan Steels & Forgings Ltd',
    accountType: 'FIXED_DEPOSIT',
    schemeCode: 'FD-CUMULATIVE-555',
    schemeName: 'Special 555-Day Cumulative Fixed Deposit',
    currency: 'INR',
    availableBalance: 50000000, // ₹5.00 Cr
    ledgerBalance: 50000000,
    lienAmount: 50000000, // ₹5 Cr marked as 100% lien against Bank Guarantee
    unclearBalance: 0,
    interestRate: 7.25,
    openDate: '15-MAY-2025',
    status: 'ACTIVE',
    branchCode: '0104',
    branchName: 'Mumbai Fort Branch',
    ifscCode: 'CRVI0001042',
    panNumber: 'AAACK7849M',
  },
  {
    accountNumber: '10420400045210',
    cifNumber: 'CIF-8192044',
    customerName: 'Rajeshwari Sharma',
    accountType: 'FIXED_DEPOSIT',
    schemeCode: 'FD-REINVEST-SR-CITIZEN',
    schemeName: 'Senior Citizen Tax Saver FD (Sec 80C)',
    currency: 'INR',
    availableBalance: 1500000, // ₹15 Lakhs
    ledgerBalance: 1500000,
    lienAmount: 0,
    unclearBalance: 0,
    interestRate: 7.75,
    openDate: '01-OCT-2024',
    status: 'ACTIVE',
    branchCode: '0104',
    branchName: 'Mumbai Fort Branch',
    ifscCode: 'CRVI0001042',
    nomineeName: 'Vikram Sharma',
    nomineeRelation: 'Spouse',
    panNumber: 'BZVPS9012F',
  },
  {
    accountNumber: '10420100067341',
    cifNumber: 'CIF-1192834',
    customerName: 'Deccan Agro Exports LLP',
    accountType: 'CURRENT',
    schemeCode: 'CA-TRADE-EXIM',
    schemeName: 'Export-Import Current Account',
    currency: 'INR',
    availableBalance: 3410000,
    ledgerBalance: 3410000,
    lienAmount: 0,
    unclearBalance: 0,
    interestRate: 0.0,
    openDate: '08-AUG-2022',
    status: 'DEBIT_FREEZE', // Marked debit freeze under court order / statutory attachment
    branchCode: '0104',
    branchName: 'Mumbai Fort Branch',
    ifscCode: 'CRVI0001042',
    panNumber: 'AABFD8834J',
  },
];

export const INITIAL_CUSTOMERS: CustomerKYC[] = [
  {
    cifNumber: 'CIF-9840192',
    name: 'Kalyan Steels & Forgings Ltd',
    entityType: 'PUBLIC_LIMITED',
    cKycNumber: 'IN-CKYC-202100849281',
    panNumber: 'AAACK7849M',
    aadhaarStatus: 'EXEMPTED',
    gstin: '27AAACK7849M1Z5',
    riskCategory: 'MEDIUM',
    cibilScore: 810,
    occupationOrSector: 'Heavy Metallurgy & Industrial Auto Components',
    annualTurnoverOrIncome: 1450000000, // ₹145 Cr
    onboardingDate: '14-MAR-2021',
    kycLastReviewedDate: '12-JAN-2026',
    kycNextReviewDue: '12-JAN-2028',
    amlAlertCount: 0,
    email: 'treasury@kalyansteels.co.in',
    phone: '+91 22 6678 9400',
    registeredAddress: 'Plot 42, MIDC Industrial Area, Taloja, Raigad, Maharashtra - 410208',
    accountsCount: 3,
    totalRelationshipValue: 134250000, // ₹13.42 Cr
  },
  {
    cifNumber: 'CIF-3104921',
    name: 'Sun Solar Engineering Pvt Ltd',
    entityType: 'PRIVATE_LIMITED',
    cKycNumber: 'IN-CKYC-202209182736',
    panNumber: 'AACCS4910K',
    aadhaarStatus: 'EXEMPTED',
    gstin: '27AACCS4910K1Z9',
    riskCategory: 'LOW',
    cibilScore: 785,
    occupationOrSector: 'Renewable Power & EPC Contracting',
    annualTurnoverOrIncome: 380000000, // ₹38 Cr
    onboardingDate: '10-NOV-2022',
    kycLastReviewedDate: '14-FEB-2026',
    kycNextReviewDue: '14-FEB-2029',
    amlAlertCount: 0,
    email: 'accounts@sunsolareng.com',
    phone: '+91 22 2847 1190',
    registeredAddress: 'Unit 502, B-Wing, Lodha Supremus, Kanjurmarg West, Mumbai - 400078',
    accountsCount: 2,
    totalRelationshipValue: 34580000,
  },
  {
    cifNumber: 'CIF-8192044',
    name: 'Rajeshwari Sharma',
    entityType: 'INDIVIDUAL',
    cKycNumber: 'IN-CKYC-201901928471',
    panNumber: 'BZVPS9012F',
    aadhaarStatus: 'VERIFIED',
    riskCategory: 'LOW',
    cibilScore: 842,
    occupationOrSector: 'Senior Consultant - Healthcare Analytics',
    annualTurnoverOrIncome: 4800000, // ₹48 Lakhs
    onboardingDate: '02-JAN-2019',
    kycLastReviewedDate: '10-DEC-2025',
    kycNextReviewDue: '10-DEC-2030',
    amlAlertCount: 0,
    email: 'r.sharma@medtechconsult.in',
    phone: '+91 98201 44589',
    registeredAddress: 'Flat 1402, Sea Crest Towers, Worli Seaface, Mumbai - 400030',
    accountsCount: 2,
    totalRelationshipValue: 2985600,
  },
  {
    cifNumber: 'CIF-5510294',
    name: 'Anand K. Varma',
    entityType: 'INDIVIDUAL',
    cKycNumber: 'IN-CKYC-202307182941',
    panNumber: 'AFGPV4321A',
    aadhaarStatus: 'VERIFIED',
    riskCategory: 'LOW',
    cibilScore: 760,
    occupationOrSector: 'Software Engineering Architect',
    annualTurnoverOrIncome: 3600000,
    onboardingDate: '19-JUL-2023',
    kycLastReviewedDate: '19-JUL-2023',
    kycNextReviewDue: '19-JUL-2031',
    amlAlertCount: 0,
    email: 'anand.varma@cloudinfra.io',
    phone: '+91 98450 12894',
    registeredAddress: 'B-404, Green Acres, Powai Lake Road, Mumbai - 400076',
    accountsCount: 1,
    totalRelationshipValue: 420800,
  },
  {
    cifNumber: 'CIF-1192834',
    name: 'Deccan Agro Exports LLP',
    entityType: 'PROPRIETORSHIP',
    cKycNumber: 'IN-CKYC-202208110934',
    panNumber: 'AABFD8834J',
    aadhaarStatus: 'VERIFIED',
    gstin: '27AABFD8834J1ZA',
    riskCategory: 'HIGH', // High risk due to international remittance exposure
    cibilScore: 685,
    occupationOrSector: 'Agricultural Commodities Export',
    annualTurnoverOrIncome: 92000000,
    onboardingDate: '08-AUG-2022',
    kycLastReviewedDate: '15-MAY-2026',
    kycNextReviewDue: '15-NOV-2026', // Bi-annual review for high risk
    amlAlertCount: 2,
    email: 'director@deccanagroexports.com',
    phone: '+91 22 2341 8920',
    registeredAddress: 'APMC Market Phase II, Sector 19, Vashi, Navi Mumbai - 400703',
    accountsCount: 1,
    totalRelationshipValue: 3410000,
  },
];

export const INITIAL_LOANS: LoanAccount[] = [
  {
    loanAccountNumber: '20420100018491',
    cifNumber: 'CIF-9840192',
    borrowerName: 'Kalyan Steels & Forgings Ltd',
    loanType: 'WORKING_CAPITAL_CC',
    sanctionedLimit: 120000000, // ₹12.00 Cr Cash Credit limit
    drawingPower: 114500000, // ₹11.45 Cr against monthly stock & book debt statements
    outstandingPrincipal: 98400000, // ₹9.84 Cr utilized
    interestDue: 742000,
    interestRate: 8.95,
    benchmarkRate: '1-Yr EBLR (Repo 6.50% + 2.45%)',
    sanctionDate: '20-MAR-2024',
    maturityDate: '19-MAR-2025',
    nextEmiDate: '30-SEP-2026',
    emiAmount: 0, // Monthly interest servicing for CC
    overdueDays: 0,
    assetClassification: 'STANDARD',
    collateralType: 'Hypothecation of Raw Material & Finished Goods + Factory Land & Building',
    collateralValue: 185000000, // ₹18.50 Cr (LTV: 64%)
    hypothecationDetails: 'Registered ROC Charge ID: CHG-98401-MUM',
    prioritySector: false,
    provisionAmount: 393600, // Standard asset provisioning 0.40%
  },
  {
    loanAccountNumber: '20420200034102',
    cifNumber: 'CIF-3104921',
    borrowerName: 'Sun Solar Engineering Pvt Ltd',
    loanType: 'MSME_PRIORITY',
    sanctionedLimit: 22000000, // ₹2.20 Cr
    drawingPower: 22000000,
    outstandingPrincipal: 17450000,
    interestDue: 142000,
    interestRate: 9.40,
    benchmarkRate: '1-Yr EBLR + 2.90%',
    sanctionDate: '15-DEC-2023',
    maturityDate: '15-DEC-2028',
    nextEmiDate: '05-OCT-2026',
    emiAmount: 458900,
    overdueDays: 0,
    assetClassification: 'STANDARD',
    collateralType: 'Commercial Office Space & Plant Equipment CGTMSE Covered',
    collateralValue: 28000000,
    hypothecationDetails: 'CGTMSE Guarantee No. CG-2023-89410',
    prioritySector: true, // Priority Sector Lending (Renewable Energy MSME)
    provisionAmount: 43625, // 0.25% for MSME priority
  },
  {
    loanAccountNumber: '20420300089104',
    cifNumber: 'CIF-8192044',
    borrowerName: 'Rajeshwari Sharma',
    loanType: 'HOUSING_LOAN',
    sanctionedLimit: 14000000, // ₹1.40 Cr Home Loan
    drawingPower: 14000000,
    outstandingPrincipal: 11240000,
    interestDue: 0,
    interestRate: 8.45,
    benchmarkRate: 'Repo Linked Rate (Repo 6.50% + 1.95%)',
    sanctionDate: '10-MAY-2022',
    maturityDate: '10-MAY-2042',
    nextEmiDate: '10-SEP-2026',
    emiAmount: 121400,
    overdueDays: 0,
    assetClassification: 'STANDARD',
    collateralType: 'Equitable Mortgage on Flat 1402, Sea Crest Towers',
    collateralValue: 24000000,
    hypothecationDetails: 'Title deeds deposited with Fort Branch Vault',
    prioritySector: true, // Priority sector retail housing
    provisionAmount: 28100, // 0.25%
  },
  {
    loanAccountNumber: '20420100067812',
    cifNumber: 'CIF-1192834',
    borrowerName: 'Deccan Agro Exports LLP',
    loanType: 'WORKING_CAPITAL_CC',
    sanctionedLimit: 35000000, // ₹3.50 Cr
    drawingPower: 28000000,
    outstandingPrincipal: 31200000, // Outstanding exceeds Drawing Power
    interestDue: 489000,
    interestRate: 11.20,
    benchmarkRate: '1-Yr EBLR + 4.70% (including penal interest)',
    sanctionDate: '01-OCT-2022',
    maturityDate: '30-SEP-2025',
    nextEmiDate: '31-AUG-2026',
    emiAmount: 0,
    overdueDays: 38, // 38 days overdue -> SMA-1 per RBI Prudential Norms
    assetClassification: 'SMA_1',
    collateralType: 'Warehouse Stock of Basmati Rice & Cashew Kernels',
    collateralValue: 33000000,
    hypothecationDetails: 'Letter of Hypothecation dated 01-OCT-2022',
    prioritySector: true, // Agro export
    provisionAmount: 1560000, // 5% provisioning under early stress
  },
];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [
  {
    transactionId: 'TXN-20260909-001',
    utrNumber: 'CRVIAR52026090900049281',
    rail: 'RTGS',
    timestamp: '09-SEP-2026 10:14:22 IST',
    sourceAccount: '10420100084912',
    sourceName: 'Kalyan Steels & Forgings Ltd',
    sourceBankIfsc: 'CRVI0001042',
    destAccount: '00040500192834',
    destName: 'Tata Steel Raw Material Sourcing',
    destBankIfsc: 'SBIN0000300',
    amount: 14500000, // ₹1.45 Cr
    status: 'SETTLED',
    narration: 'Payment for Hot Rolled Coils PO-49201',
    settlementCycle: 'RTGS Batch 20260909-02',
  },
  {
    transactionId: 'TXN-20260909-002',
    utrNumber: 'CRVIN26252910482',
    rail: 'NEFT',
    timestamp: '09-SEP-2026 10:45:18 IST',
    sourceAccount: '10420200034189',
    sourceName: 'Sun Solar Engineering Pvt Ltd',
    sourceBankIfsc: 'CRVI0001042',
    destAccount: '91201004819201',
    destName: 'Waaree Energies Inverters Ltd',
    destBankIfsc: 'UTIB0000010',
    amount: 2840000, // ₹28.40 Lakhs
    status: 'SETTLED',
    narration: 'Inverter supply Invoice INV-8841',
    batchNumber: 'NEFT-BATCH-B1100',
  },
  {
    transactionId: 'TXN-20260909-003',
    utrNumber: 'CRVI20260909009841',
    rail: 'IMPS',
    timestamp: '09-SEP-2026 11:02:44 IST',
    sourceAccount: '10420300078120',
    sourceName: 'Rajeshwari Sharma',
    sourceBankIfsc: 'CRVI0001042',
    destAccount: '50100294819283',
    destName: 'Dr. Vikram Sharma Clinic',
    destBankIfsc: 'HDFC0000001',
    amount: 75000,
    status: 'SETTLED',
    narration: 'Clinic equipment reimbursement',
  },
  {
    transactionId: 'TXN-20260909-004',
    utrNumber: 'CRVIU26252094812',
    rail: 'UPI',
    timestamp: '09-SEP-2026 11:15:30 IST',
    sourceAccount: '10420300099415',
    sourceName: 'Anand K. Varma',
    sourceBankIfsc: 'CRVI0001042',
    destAccount: 'upi:reliancefresh@icici',
    destName: 'Reliance Retail Hypermarket',
    destBankIfsc: 'ICIC0000001',
    amount: 4890,
    status: 'SETTLED',
    narration: 'UPI Merchant Purchase POS',
  },
  {
    transactionId: 'TXN-20260909-005',
    utrNumber: 'CRVICTS202609090012',
    rail: 'CTS_CHEQUE',
    timestamp: '09-SEP-2026 11:30:00 IST',
    sourceAccount: '10420100084912',
    sourceName: 'Kalyan Steels & Forgings Ltd',
    sourceBankIfsc: 'CRVI0001042',
    destAccount: '31049281920',
    destName: 'Mahindra Heavy Logistics',
    destBankIfsc: 'PUNB0000100',
    amount: 685000,
    status: 'PENDING_CLEARING',
    narration: 'CTS-2010 Cheque clearing Outward Batch 1',
    chequeNumber: '004921',
  },
  {
    transactionId: 'TXN-20260909-006',
    utrNumber: 'CRVIAR52026090900059102',
    rail: 'RTGS',
    timestamp: '09-SEP-2026 11:42:15 IST',
    sourceAccount: '10420100084912',
    sourceName: 'Kalyan Steels & Forgings Ltd',
    sourceBankIfsc: 'CRVI0001042',
    destAccount: '1004928192004',
    destName: 'JSW Infrastructure Port Berth',
    destBankIfsc: 'BARB0NARIMA',
    amount: 32000000, // ₹3.20 Cr -> Requires Maker-Checker approval
    status: 'HELD_FOR_VERIFICATION',
    narration: 'Port terminal handling charges high value',
  },
];

export const INITIAL_TRADE_FINANCE: TradeFinanceItem[] = [
  {
    referenceNumber: 'LC-CRVI-2026-0041',
    instrumentType: 'LETTER_OF_CREDIT',
    applicantName: 'Kalyan Steels & Forgings Ltd',
    beneficiaryName: 'Outokumpu Stainless Steel Oy (Finland)',
    currency: 'EUR',
    amount: 450000, // €450,000 (~₹4.1 Cr)
    issueDate: '12-AUG-2026',
    expiryDate: '15-DEC-2026',
    status: 'ISSUED',
    advisingBankIfscOrSwift: 'NDEASIFI (Nordea Bank Helsinki)',
    cashMarginPercentage: 15,
    underlyingGoods: 'High-grade nickel alloy billets for aerospace forgings',
    femaCompliant: true,
  },
  {
    referenceNumber: 'BG-CRVI-2026-0108',
    instrumentType: 'BANK_GUARANTEE',
    applicantName: 'Sun Solar Engineering Pvt Ltd',
    beneficiaryName: 'Maharashtra State Electricity Distribution Co Ltd (MSEDCL)',
    currency: 'INR',
    amount: 50000000, // ₹5.00 Cr
    issueDate: '15-MAY-2025',
    expiryDate: '14-MAY-2028',
    status: 'ACCEPTED',
    advisingBankIfscOrSwift: 'SBIN0000300 (SBI Fort Branch)',
    cashMarginPercentage: 100, // 100% secured by FD-CUMULATIVE
    underlyingGoods: 'Performance Guarantee for 25MW Solar Micro-Grid Grid Substation',
    femaCompliant: true,
  },
  {
    referenceNumber: 'IB-CRVI-2026-0089',
    instrumentType: 'INLAND_BILL_DISCOUNTING',
    applicantName: 'Deccan Agro Exports LLP',
    beneficiaryName: 'Agricultural Produce Marketing Committee (APMC Vashi)',
    currency: 'INR',
    amount: 12500000, // ₹1.25 Cr
    issueDate: '20-JUL-2026',
    expiryDate: '20-OCT-2026',
    status: 'ISSUED',
    advisingBankIfscOrSwift: 'CRVI0001042',
    cashMarginPercentage: 10,
    underlyingGoods: 'Basmati Rice Lot B-109 with Warehouse Receipts',
    femaCompliant: true,
  },
];

export const INITIAL_AUTHORIZATIONS: PendingAuthorization[] = [
  {
    id: 'AUTH-20260909-01',
    voucherNumber: 'VCH-RTGS-0104-9812',
    timestamp: '09-SEP-2026 11:42:15 IST',
    actionType: 'RTGS_OUTWARD_APPROVAL',
    description: 'High Value RTGS Transfer exceeding ₹1.00 Cr limit',
    makerUserId: 'EMP-401928',
    makerUserName: 'Deepak Nambiar (Maker L1)',
    makerRole: 'Clearing Desk Officer',
    accountNumber: '10420100084912',
    cifNumber: 'CIF-9840192',
    amount: 32000000, // ₹3.20 Cr
    criticality: 'CRITICAL',
    status: 'PENDING',
    auditReason: 'Dual authorization mandated under Bank Circular CBS-CIR-2024-88 for debits > ₹1 Cr.',
    details: {
      remitter: 'Kalyan Steels & Forgings Ltd',
      beneficiary: 'JSW Infrastructure Port Berth',
      beneficiaryBank: 'Bank of Baroda (BARB0NARIMA)',
      sourceBalanceBefore: '₹8,42,50,000',
      sourceBalanceAfter: '₹5,22,50,000',
    },
  },
  {
    id: 'AUTH-20260909-02',
    voucherNumber: 'VCH-LIEN-0104-0412',
    timestamp: '09-SEP-2026 10:30:11 IST',
    actionType: 'ACCOUNT_LIEN_MARK',
    description: 'Mark Lien of ₹50,00,000 against CA for Inland LC Issuance',
    makerUserId: 'EMP-591024',
    makerUserName: 'Pooja Iyer (Maker L2)',
    makerRole: 'Trade Finance Officer',
    accountNumber: '10420200034189',
    cifNumber: 'CIF-3104921',
    amount: 5000000,
    criticality: 'HIGH',
    status: 'PENDING',
    auditReason: 'Trade margin requirement for LC issuance to Inverter Supplier.',
    details: {
      customer: 'Sun Solar Engineering Pvt Ltd',
      instrumentRef: 'LC-CRVI-2026-0044',
      marginRatio: '20%',
    },
  },
  {
    id: 'AUTH-20260909-03',
    voucherNumber: 'VCH-CASH-0104-1102',
    timestamp: '09-SEP-2026 11:10:05 IST',
    actionType: 'CASH_VAULT_DEPOSIT',
    description: 'Physical Currency Chest Cash Transfer to RBI Vault',
    makerUserId: 'EMP-310948',
    makerUserName: 'Suresh Patil (Head Teller)',
    makerRole: 'Vault Custodian',
    amount: 15000000, // ₹1.50 Cr
    criticality: 'HIGH',
    status: 'PENDING',
    auditReason: 'Branch vault cash holding exceeded retention limit of ₹4.00 Cr; remitting surplus to RBI Belapur Vault.',
    details: {
      escortOfficer: 'Inspector R. Pawar (Armored Van V-402)',
      denomination500Notes: '30,000 bundles',
      totalPieces: '30,000',
    },
  },
  {
    id: 'AUTH-20260909-04',
    voucherNumber: 'VCH-KYC-0104-3391',
    timestamp: '09-SEP-2026 09:45:00 IST',
    actionType: 'KYC_RISK_OVERRIDE',
    description: 'Reclassify Customer Risk Profile from Medium to High',
    makerUserId: 'EMP-771029',
    makerUserName: 'Rohit Kulkarni (Maker L2)',
    makerRole: 'AML Compliance Officer',
    cifNumber: 'CIF-1192834',
    criticality: 'NORMAL',
    status: 'PENDING',
    auditReason: 'Overdue trade bills and repeated court freeze notice on export remittances.',
    details: {
      customer: 'Deccan Agro Exports LLP',
      existingRisk: 'MEDIUM',
      proposedRisk: 'HIGH',
      cKycRef: 'IN-CKYC-202208110934',
    },
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'LOG-20260909-0091',
    timestamp: '09-SEP-2026 11:42:15 IST',
    operatorId: 'EMP-401928',
    operatorName: 'Deepak Nambiar',
    terminalId: 'TER-MUM-0104-D',
    module: 'PAYMENTS_RTGS',
    action: 'INITIATE_HIGH_VALUE_TRANSFER',
    recordIdentifier: 'TXN-20260909-006 (₹3.20 Cr)',
    ipAddress: '10.14.104.42',
    authorizationLevel: 'LEVEL_1_MAKER',
    severity: 'ALERT',
    rbiReportable: true,
  },
  {
    id: 'LOG-20260909-0090',
    timestamp: '09-SEP-2026 11:15:20 IST',
    operatorId: 'EMP-782194',
    operatorName: 'Aditya Raj',
    terminalId: 'TER-MUM-0104-A',
    module: 'CORE_VAULT',
    action: 'PHYSICAL_CASH_VERIFICATION',
    recordIdentifier: 'VAULT-0104-MUM',
    ipAddress: '10.14.104.11',
    authorizationLevel: 'LEVEL_3_CHECKER',
    severity: 'INFO',
    rbiReportable: false,
  },
  {
    id: 'LOG-20260909-0089',
    timestamp: '09-SEP-2026 10:14:25 IST',
    operatorId: 'EMP-782194',
    operatorName: 'Aditya Raj',
    terminalId: 'TER-MUM-0104-A',
    module: 'PAYMENTS_RTGS',
    action: 'AUTHORIZE_RTGS_OUTWARD',
    recordIdentifier: 'UTR: CRVIAR52026090900049281 (₹1.45 Cr)',
    ipAddress: '10.14.104.11',
    authorizationLevel: 'LEVEL_3_CHECKER',
    severity: 'INFO',
    rbiReportable: true,
  },
  {
    id: 'LOG-20260909-0088',
    timestamp: '09-SEP-2026 09:00:00 IST',
    operatorId: 'SYSTEM_DAEMON',
    operatorName: 'COREvia CBS Engine v26.4',
    terminalId: 'SRV-CBS-DC01',
    module: 'DAY_BEGIN_OPERATIONS',
    action: 'BOD_BATCH_COMPLETED',
    recordIdentifier: 'BUSINESS_DATE_09_SEP_2026',
    ipAddress: '10.14.0.1',
    authorizationLevel: 'SYSTEM_SUPERVISOR',
    severity: 'NOTICE',
    rbiReportable: false,
  },
  {
    id: 'LOG-20260909-0087',
    timestamp: '08-SEP-2026 20:45:10 IST',
    operatorId: 'EMP-782194',
    operatorName: 'Aditya Raj',
    terminalId: 'TER-MUM-0104-A',
    module: 'REGULATORY_COMPLIANCE',
    action: 'TRANSMIT_RBI_FORM_A',
    recordIdentifier: 'RBI-NDTL-SUBMISSION-W36',
    ipAddress: '10.14.104.11',
    authorizationLevel: 'LEVEL_3_CHECKER',
    severity: 'NOTICE',
    rbiReportable: true,
  },
];

/**
 * Format currency in Indian numbering system (Lakhs and Crores)
 * e.g. 14500000 -> ₹1,45,00,000.00
 */
export function formatINR(amountRaw: number, options?: { showPaisa?: boolean; compact?: boolean }): string {
  const amount = (typeof amountRaw === 'number' && !isNaN(amountRaw)) ? amountRaw : (parseFloat(String(amountRaw)) || 0);
  const showPaisa = options?.showPaisa ?? true;
  const compact = options?.compact ?? false;

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)} K`;
    }
    return `₹${amount.toFixed(0)}`;
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const parts = absAmount.toFixed(showPaisa ? 2 : 0).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  // Indian format: last 3 digits, then groups of 2 digits
  let result = '';
  if (integerPart.length > 3) {
    const lastThree = integerPart.substring(integerPart.length - 3);
    const rest = integerPart.substring(0, integerPart.length - 3);
    result = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  } else {
    result = integerPart;
  }

  if (showPaisa && decimalPart) {
    result = `${result}.${decimalPart}`;
  }

  return `${isNegative ? '-' : ''}₹${result}`;
}
