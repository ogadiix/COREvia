import { db } from './index.ts';
import {
  users,
  roles,
  permissions,
  userRoles,
  customers,
  customerAddresses,
  customerContacts,
  accounts,
  accountBalances,
  transactions,
  products,
  customerProducts,
  loans,
  interactions,
  serviceCases,
  caseComments,
  tasks,
  opportunities,
  opportunityActivities,
  customerScores,
  customerScoreHistory,
  customerInsights,
  notifications,
  auditLogs,
} from './schema.ts';

export async function seedDatabase() {
  console.log('--- Starting COREvia PostgreSQL Database Seeding ---');

  // 1. Roles
  const [roleBranchHead] = await db
    .insert(roles)
    .values([
      {
        code: 'BRANCH_OPS_HEAD',
        name: 'Branch Operations Head / Checker L3',
        description: 'Unrestricted dual-control checker authorization up to statutory limits',
      },
      {
        code: 'MAKER_L2',
        name: 'Senior Maker L2',
        description: 'Trade finance, lending limit revisions, and high-value voucher creation',
      },
      {
        code: 'RELATIONSHIP_MANAGER',
        name: 'Corporate & Wealth Relationship Manager',
        description: 'Customer 360 portfolio oversight, pipeline, and advisory',
      },
      {
        code: 'COMPLIANCE_OFFICER',
        name: 'AML / Regulatory Compliance Officer',
        description: 'FIU-IND, PMLA, and RBI statutory reporting',
      },
    ])
    .onConflictDoNothing()
    .returning();

  // 2. Users
  const seededUsers = await db
    .insert(users)
    .values([
      {
        uid: 'USR-EMP-782194',
        email: 'aditya.raj@corevia.bank.in',
        name: 'Aditya Raj',
        employeeId: 'EMP-782194',
        role: 'BRANCH_OPS_HEAD',
        department: 'BRANCH_OPERATIONS',
        isActive: true,
      },
      {
        uid: 'USR-EMP-591024',
        email: 'pooja.iyer@corevia.bank.in',
        name: 'Pooja Iyer',
        employeeId: 'EMP-591024',
        role: 'MAKER_L2',
        department: 'TRADE_FINANCE_LENDING',
        isActive: true,
      },
      {
        uid: 'USR-EMP-401928',
        email: 'deepak.nambiar@corevia.bank.in',
        name: 'Deepak Nambiar',
        employeeId: 'EMP-401928',
        role: 'RELATIONSHIP_MANAGER',
        department: 'RETAIL_BANKING',
        isActive: true,
      },
      {
        uid: 'USR-EMP-771029',
        email: 'rohit.kulkarni@corevia.bank.in',
        name: 'Rohit Kulkarni',
        employeeId: 'EMP-771029',
        role: 'COMPLIANCE_OFFICER',
        department: 'COMPLIANCE_AML',
        isActive: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  // Retrieve user IDs
  const allUsers = await db.select().from(users);
  const userAditya = allUsers.find((u) => u.employeeId === 'EMP-782194') || allUsers[0];
  const userPooja = allUsers.find((u) => u.employeeId === 'EMP-591024') || allUsers[0];
  const userDeepak = allUsers.find((u) => u.employeeId === 'EMP-401928') || allUsers[0];

  // 3. Products Catalog
  const seededProducts = await db
    .insert(products)
    .values([
      {
        productCode: 'PRD-CA-PREM',
        category: 'CASA',
        name: 'Corporate Premier Current Account',
        description: 'Zero MAB, unlimited cash handling, CMS portal integration',
        isActive: true,
      },
      {
        productCode: 'PRD-SB-SAL',
        category: 'CASA',
        name: 'Corporate Salary Savings Plus',
        description: 'Zero balance salary account with complementary insurance & premium debit card',
        isActive: true,
      },
      {
        productCode: 'PRD-FD-TAX',
        category: 'CASA',
        name: 'Tax-Saver 5-Year Fixed Deposit',
        description: 'Section 80C compliant term deposit with compounding quarterly interest',
        isActive: true,
      },
      {
        productCode: 'PRD-LN-HL',
        category: 'ASSET_LOAN',
        name: 'Prime Home Loan',
        description: 'External benchmark linked repo lending rate home loan',
        isActive: true,
      },
      {
        productCode: 'PRD-LN-WC',
        category: 'ASSET_LOAN',
        name: 'Working Capital Cash Credit Facility',
        description: 'Stock & book-debt hypothecation working capital facility',
        isActive: true,
      },
      {
        productCode: 'PRD-TF-ILC',
        category: 'TRADE_FINANCE',
        name: 'Inland Letter of Credit',
        description: 'Irrevocable documentary letter of credit compliant with UCPDC 600',
        isActive: true,
      },
    ])
    .onConflictDoNothing()
    .returning();

  const allProducts = await db.select().from(products);
  const prodCa = allProducts.find((p) => p.productCode === 'PRD-CA-PREM') || allProducts[0];
  const prodSb = allProducts.find((p) => p.productCode === 'PRD-SB-SAL') || allProducts[0];
  const prodFd = allProducts.find((p) => p.productCode === 'PRD-FD-TAX') || allProducts[0];
  const prodHl = allProducts.find((p) => p.productCode === 'PRD-LN-HL') || allProducts[0];
  const prodWc = allProducts.find((p) => p.productCode === 'PRD-LN-WC') || allProducts[0];

  // 4. Customers
  await db
    .insert(customers)
    .values([
      {
        customerCode: 'CUS-10482',
        cifNumber: 'CIF-1048201',
        name: 'Rahul Sharma',
        entityType: 'INDIVIDUAL',
        cKycNumber: 'CKYC-2021-99824',
        panNumber: 'AAAPS1294K',
        aadhaarStatus: 'VERIFIED',
        riskCategory: 'LOW',
        cibilScore: 785,
        occupationOrSector: 'Software Engineering / IT Executive',
        annualTurnoverOrIncome: '3200000.00',
        relationshipValue: '4280000.00',
        onboardingDate: '2021-06-15',
        kycLastReviewed: '2024-06-10',
        kycNextReviewDue: '2026-06-10',
        amlAlertCount: 0,
        status: 'ACTIVE',
        assignedRmId: userDeepak.id,
      },
      {
        customerCode: 'CUS-20841',
        cifNumber: 'CIF-9840192',
        name: 'Kalyan Steels & Forgings Ltd',
        entityType: 'PUBLIC_LIMITED',
        cKycNumber: 'CKYC-2018-44912',
        panNumber: 'AAACK8491M',
        aadhaarStatus: 'EXEMPTED',
        gstin: '27AAACK8491M1Z5',
        riskCategory: 'LOW',
        cibilScore: 820,
        occupationOrSector: 'Heavy Industrial Engineering & Forging',
        annualTurnoverOrIncome: '185000000.00',
        relationshipValue: '84250000.00',
        onboardingDate: '2018-03-22',
        kycLastReviewed: '2024-01-15',
        kycNextReviewDue: '2026-01-15',
        amlAlertCount: 0,
        status: 'ACTIVE',
        assignedRmId: userPooja.id,
      },
      {
        customerCode: 'CUS-30915',
        cifNumber: 'CIF-3091582',
        name: 'Meera Sundaram',
        entityType: 'INDIVIDUAL',
        cKycNumber: 'CKYC-2019-11029',
        panNumber: 'BPRPS4910B',
        aadhaarStatus: 'VERIFIED',
        riskCategory: 'LOW',
        cibilScore: 805,
        occupationOrSector: 'NRI Professional / Senior Physician',
        annualTurnoverOrIncome: '6500000.00',
        relationshipValue: '7850000.00',
        onboardingDate: '2019-11-04',
        kycLastReviewed: '2024-03-12',
        kycNextReviewDue: '2026-03-12',
        amlAlertCount: 0,
        status: 'ACTIVE',
        assignedRmId: userDeepak.id,
      },
      {
        customerCode: 'CUS-40182',
        cifNumber: 'CIF-4018273',
        name: 'Sunil Varma',
        entityType: 'PROPRIETORSHIP',
        cKycNumber: 'CKYC-2022-77821',
        panNumber: 'AFEPV5829H',
        aadhaarStatus: 'VERIFIED',
        gstin: '27AFEPV5829H1ZG',
        riskCategory: 'MEDIUM',
        cibilScore: 718,
        occupationOrSector: 'Textiles & Garment Manufacturing',
        annualTurnoverOrIncome: '24000000.00',
        relationshipValue: '16500000.00',
        onboardingDate: '2022-08-19',
        kycLastReviewed: '2024-08-01',
        kycNextReviewDue: '2025-08-01',
        amlAlertCount: 1,
        status: 'ACTIVE',
        assignedRmId: userDeepak.id,
      },
      {
        customerCode: 'CUS-50824',
        cifNumber: 'CIF-5082419',
        name: 'Ananya Deshmukh',
        entityType: 'INDIVIDUAL',
        cKycNumber: 'CKYC-2020-55912',
        panNumber: 'CNRPD8291Q',
        aadhaarStatus: 'VERIFIED',
        riskCategory: 'LOW',
        cibilScore: 792,
        occupationOrSector: 'Architectural Consultant',
        annualTurnoverOrIncome: '2800000.00',
        relationshipValue: '3120000.00',
        onboardingDate: '2020-02-14',
        kycLastReviewed: '2024-02-10',
        kycNextReviewDue: '2026-02-10',
        amlAlertCount: 0,
        status: 'ACTIVE',
        assignedRmId: userDeepak.id,
      },
    ])
    .onConflictDoNothing();

  const allCustomers = await db.select().from(customers);
  const custRahul = allCustomers.find((c) => c.customerCode === 'CUS-10482') || allCustomers[0];
  const custKalyan = allCustomers.find((c) => c.customerCode === 'CUS-20841') || allCustomers[1];
  const custMeera = allCustomers.find((c) => c.customerCode === 'CUS-30915') || allCustomers[2];
  const custSunil = allCustomers.find((c) => c.customerCode === 'CUS-40182') || allCustomers[3];
  const custAnanya = allCustomers.find((c) => c.customerCode === 'CUS-50824') || allCustomers[4];

  // 5. Customer Addresses
  await db
    .insert(customerAddresses)
    .values([
      {
        customerId: custRahul.id,
        addressType: 'REGISTERED',
        line1: 'Flat 902, Emerald Towers',
        line2: 'Prabhadevi, Worli Sea Face',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400025',
        country: 'INDIA',
        isPrimary: true,
      },
      {
        customerId: custKalyan.id,
        addressType: 'REGISTERED',
        line1: 'Maker Chambers IV, 5th Floor',
        line2: 'Nariman Point',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400021',
        country: 'INDIA',
        isPrimary: true,
      },
      {
        customerId: custMeera.id,
        addressType: 'REGISTERED',
        line1: 'B-14, Bay View Apartments',
        line2: 'Marine Drive',
        city: 'Mumbai',
        state: 'Maharashtra',
        pinCode: '400020',
        country: 'INDIA',
        isPrimary: true,
      },
    ])
    .onConflictDoNothing();

  // 6. Customer Contacts
  await db
    .insert(customerContacts)
    .values([
      {
        customerId: custRahul.id,
        contactType: 'EMAIL',
        contactValue: 'rahul.sharma@techcorp.in',
        isPrimary: true,
        isVerified: true,
      },
      {
        customerId: custRahul.id,
        contactType: 'MOBILE',
        contactValue: '+91 98201 49104',
        isPrimary: true,
        isVerified: true,
      },
      {
        customerId: custKalyan.id,
        contactType: 'EMAIL',
        contactValue: 'treasury@kalyansteels.co.in',
        isPrimary: true,
        isVerified: true,
      },
      {
        customerId: custKalyan.id,
        contactType: 'PHONE',
        contactValue: '+91 22 6678 4912',
        isPrimary: true,
        isVerified: true,
      },
    ])
    .onConflictDoNothing();

  // 7. Accounts
  const seededAccounts = await db
    .insert(accounts)
    .values([
      // Rahul Sharma's Account: ****9104
      {
        accountNumber: '10420100089104',
        customerId: custRahul.id,
        accountType: 'SAVINGS',
        schemeCode: 'SB-SAL-PREMIER',
        schemeName: 'Corporate Salary Savings Plus',
        currency: 'INR',
        interestRate: '3.50',
        status: 'ACTIVE',
        branchCode: '0104',
        branchName: 'Mumbai Fort Branch',
        ifscCode: 'CRVI0001042',
        openDate: '2021-06-15',
        panNumber: 'AAAPS1294K',
        nomineeName: 'Pooja Sharma',
        nomineeRelation: 'SPOUSE',
      },
      // Rahul Sharma's Term Deposit
      {
        accountNumber: '10420100089105',
        customerId: custRahul.id,
        accountType: 'FIXED_DEPOSIT',
        schemeCode: 'FD-TAX-SAVER',
        schemeName: 'Tax-Saver 5-Year Term Deposit',
        currency: 'INR',
        interestRate: '7.10',
        status: 'ACTIVE',
        branchCode: '0104',
        branchName: 'Mumbai Fort Branch',
        ifscCode: 'CRVI0001042',
        openDate: '2022-03-28',
        panNumber: 'AAAPS1294K',
      },
      // Kalyan Steels Current Account
      {
        accountNumber: '10420100084912',
        customerId: custKalyan.id,
        accountType: 'CURRENT',
        schemeCode: 'CA-CORP-PREMIER',
        schemeName: 'Corporate High-Volume Current Account',
        currency: 'INR',
        interestRate: '0.00',
        status: 'ACTIVE',
        branchCode: '0104',
        branchName: 'Mumbai Fort Branch',
        ifscCode: 'CRVI0001042',
        openDate: '2018-03-22',
        panNumber: 'AAACK8491M',
      },
      // Meera Sundaram NRE Account
      {
        accountNumber: '10420100084914',
        customerId: custMeera.id,
        accountType: 'SAVINGS',
        schemeCode: 'SB-NRE-PRIME',
        schemeName: 'Non-Resident External (NRE) Savings',
        currency: 'INR',
        interestRate: '3.75',
        status: 'ACTIVE',
        branchCode: '0104',
        branchName: 'Mumbai Fort Branch',
        ifscCode: 'CRVI0001042',
        openDate: '2019-11-04',
        panNumber: 'BPRPS4910B',
      },
      // Sunil Varma MSME Current Account
      {
        accountNumber: '10420100084916',
        customerId: custSunil.id,
        accountType: 'CURRENT',
        schemeCode: 'CA-MSME-GROWTH',
        schemeName: 'MSME Business Current Plus',
        currency: 'INR',
        interestRate: '0.00',
        status: 'ACTIVE',
        branchCode: '0104',
        branchName: 'Mumbai Fort Branch',
        ifscCode: 'CRVI0001042',
        openDate: '2022-08-19',
        panNumber: 'AFEPV5829H',
      },
    ])
    .onConflictDoNothing()
    .returning();

  const allAccounts = await db.select().from(accounts);
  const accRahulSal = allAccounts.find((a) => a.accountNumber === '10420100089104') || allAccounts[0];
  const accRahulFd = allAccounts.find((a) => a.accountNumber === '10420100089105') || allAccounts[1];
  const accKalyan = allAccounts.find((a) => a.accountNumber === '10420100084912') || allAccounts[2];
  const accMeera = allAccounts.find((a) => a.accountNumber === '10420100084914') || allAccounts[3];
  const accSunil = allAccounts.find((a) => a.accountNumber === '10420100084916') || allAccounts[4];

  // 8. Account Balances
  await db
    .insert(accountBalances)
    .values([
      {
        accountId: accRahulSal.id,
        availableBalance: '842500.00',
        ledgerBalance: '842500.00',
        lienAmount: '0.00',
        unclearBalance: '0.00',
        currency: 'INR',
      },
      {
        accountId: accRahulFd.id,
        availableBalance: '1500000.00',
        ledgerBalance: '1500000.00',
        lienAmount: '0.00',
        unclearBalance: '0.00',
        currency: 'INR',
      },
      {
        accountId: accKalyan.id,
        availableBalance: '84250000.00',
        ledgerBalance: '86450000.00',
        lienAmount: '2200000.00',
        unclearBalance: '0.00',
        currency: 'INR',
      },
      {
        accountId: accMeera.id,
        availableBalance: '2415000.00',
        ledgerBalance: '2415000.00',
        lienAmount: '0.00',
        unclearBalance: '0.00',
        currency: 'INR',
      },
      {
        accountId: accSunil.id,
        availableBalance: '4280000.00',
        ledgerBalance: '4280000.00',
        lienAmount: '500000.00',
        unclearBalance: '0.00',
        currency: 'INR',
      },
    ])
    .onConflictDoNothing();

  // 9. Customer Products
  await db
    .insert(customerProducts)
    .values([
      {
        customerId: custRahul.id,
        productId: prodSb.id,
        accountId: accRahulSal.id,
        status: 'ACTIVE',
        enrolledDate: '2021-06-15',
      },
      {
        customerId: custRahul.id,
        productId: prodFd.id,
        accountId: accRahulFd.id,
        status: 'ACTIVE',
        enrolledDate: '2022-03-28',
      },
      {
        customerId: custRahul.id,
        productId: prodHl.id,
        status: 'ACTIVE',
        enrolledDate: '2023-01-10',
      },
      {
        customerId: custKalyan.id,
        productId: prodCa.id,
        accountId: accKalyan.id,
        status: 'ACTIVE',
        enrolledDate: '2018-03-22',
      },
      {
        customerId: custKalyan.id,
        productId: prodWc.id,
        status: 'ACTIVE',
        enrolledDate: '2019-05-15',
      },
    ])
    .onConflictDoNothing();

  // 10. Loans
  await db
    .insert(loans)
    .values([
      {
        loanAccountNumber: '10427010009412',
        customerId: custRahul.id,
        loanType: 'HOUSING_LOAN',
        sanctionedLimit: '4500000.00',
        drawingPower: '4500000.00',
        outstandingPrincipal: '3850000.00',
        interestDue: '0.00',
        interestRate: '8.40',
        benchmarkRate: 'Repo Rate 6.50% + Spread 1.90%',
        sanctionDate: '2023-01-10',
        maturityDate: '2043-01-10',
        nextEmiDate: '2026-10-05',
        emiAmount: '38750.00',
        overdueDays: 0,
        assetClassification: 'STANDARD',
        collateralType: 'Registered Equitable Mortgage of Residential Flat',
        collateralValue: '6500000.00',
        hypothecationDetails: 'Emerald Towers Flat 902, Prabhadevi, Mumbai',
        prioritySector: false,
        provisionAmount: '15400.00',
      },
      {
        loanAccountNumber: '10427010008491',
        customerId: custKalyan.id,
        loanType: 'WORKING_CAPITAL_CC',
        sanctionedLimit: '150000000.00',
        drawingPower: '138000000.00',
        outstandingPrincipal: '112000000.00',
        interestDue: '0.00',
        interestRate: '9.25',
        benchmarkRate: '1-Yr MCLR 8.10% + Spread 1.15%',
        sanctionDate: '2022-04-10',
        maturityDate: '2027-04-09',
        nextEmiDate: '2026-09-30',
        emiAmount: '0.00',
        overdueDays: 0,
        assetClassification: 'STANDARD',
        collateralType: 'First Charge on Raw Material Stock & Plant Machinery',
        collateralValue: '210000000.00',
        hypothecationDetails: 'Steel Billets, Scrap, Heavy Presses at Boisar Unit',
        prioritySector: false,
        provisionAmount: '448000.00',
      },
      {
        loanAccountNumber: '10427010008493',
        customerId: custSunil.id,
        loanType: 'MSME_PRIORITY',
        sanctionedLimit: '7500000.00',
        drawingPower: '7200000.00',
        outstandingPrincipal: '5400000.00',
        interestDue: '42500.00',
        interestRate: '9.75',
        benchmarkRate: 'Repo Rate 6.50% + Spread 3.25%',
        sanctionDate: '2022-10-18',
        maturityDate: '2028-10-15',
        nextEmiDate: '2026-09-15',
        emiAmount: '112500.00',
        overdueDays: 14,
        assetClassification: 'SMA_0',
        collateralType: 'Commercial Shed & Powerloom Machinery Hypothecation',
        collateralValue: '11000000.00',
        hypothecationDetails: 'Bhiwandi Industrial Complex Shed No 42',
        prioritySector: true,
        provisionAmount: '27000.00',
      },
    ])
    .onConflictDoNothing();

  // 11. Customer Scores
  await db
    .insert(customerScores)
    .values([
      {
        customerId: custRahul.id,
        coreScore: 88,
        financialHealthScore: 92,
        creditRiskScore: 86,
        engagementScore: 90,
        churnProbability: '0.04',
        calculationDate: '2026-09-09',
        factors: JSON.stringify({
          salaryRegularity: 'HIGH',
          investmentDiversification: 'MODERATE',
          emiTrackRecord: 'FLAWLESS_ZERO_BOUNCE',
          digitalAdoption: 'DAILY_MOBILE_ACTIVE',
        }),
      },
      {
        customerId: custKalyan.id,
        coreScore: 92,
        financialHealthScore: 94,
        creditRiskScore: 90,
        engagementScore: 91,
        churnProbability: '0.02',
        calculationDate: '2026-09-01',
        factors: JSON.stringify({
          turnoverGrowth: '14.2% YoY',
          debtServiceCoverageRatio: '2.4x',
          tradeCycleDays: 42,
          currentRatio: '1.85',
        }),
      },
      {
        customerId: custMeera.id,
        coreScore: 81,
        financialHealthScore: 85,
        creditRiskScore: 80,
        engagementScore: 82,
        churnProbability: '0.03',
        calculationDate: '2026-09-01',
        factors: JSON.stringify({
          salaryRegularity: 'HIGH',
          investmentDiversification: 'HIGH',
          termDepositCoverage: 'EXCELLENT',
        }),
      },
      {
        customerId: custSunil.id,
        coreScore: 76,
        financialHealthScore: 74,
        creditRiskScore: 72,
        engagementScore: 80,
        churnProbability: '0.12',
        calculationDate: '2026-09-01',
        factors: JSON.stringify({
          cashFlowStability: 'CYCLICAL_SEASONAL',
          overdueHistory: '14_DAYS_MILD',
          collateralCoverage: '1.45x',
        }),
      },
      {
        customerId: custAnanya.id,
        coreScore: 79,
        financialHealthScore: 82,
        creditRiskScore: 78,
        engagementScore: 78,
        churnProbability: '0.05',
        calculationDate: '2026-09-01',
        factors: JSON.stringify({
          inflowConsistency: 'STEADY_PROFESSIONAL',
          digitalAdoption: 'MODERATE',
        }),
      },
    ])
    .onConflictDoNothing();

  // 11b. Seed Persisted Customer Score History (Phase 16 - Multi-period trend snapshots)
  await db
    .insert(customerScoreHistory)
    .values([
      // Rahul Sharma: 80 -> 82 -> 84 -> 85 -> 88 (improving)
      { customerId: custRahul.id, coreScore: 80, financialHealthScore: 82, creditRiskScore: 78, engagementScore: 81, recordedDate: '2026-06-15' },
      { customerId: custRahul.id, coreScore: 82, financialHealthScore: 84, creditRiskScore: 80, engagementScore: 83, recordedDate: '2026-07-01' },
      { customerId: custRahul.id, coreScore: 84, financialHealthScore: 86, creditRiskScore: 82, engagementScore: 85, recordedDate: '2026-07-15' },
      { customerId: custRahul.id, coreScore: 84, financialHealthScore: 86, creditRiskScore: 83, engagementScore: 85, recordedDate: '2026-08-01' },
      { customerId: custRahul.id, coreScore: 85, financialHealthScore: 88, creditRiskScore: 84, engagementScore: 86, recordedDate: '2026-08-15' },
      { customerId: custRahul.id, coreScore: 86, financialHealthScore: 89, creditRiskScore: 85, engagementScore: 88, recordedDate: '2026-09-01' },
      { customerId: custRahul.id, coreScore: 88, financialHealthScore: 92, creditRiskScore: 86, engagementScore: 90, recordedDate: '2026-09-10' },
      { customerId: custRahul.id, coreScore: 88, financialHealthScore: 92, creditRiskScore: 86, engagementScore: 90, recordedDate: '2026-09-17' },

      // Kalyan Steels: 89 -> 90 -> 91 -> 92 (stable high)
      { customerId: custKalyan.id, coreScore: 89, financialHealthScore: 91, creditRiskScore: 88, engagementScore: 89, recordedDate: '2026-06-15' },
      { customerId: custKalyan.id, coreScore: 90, financialHealthScore: 92, creditRiskScore: 89, engagementScore: 90, recordedDate: '2026-07-01' },
      { customerId: custKalyan.id, coreScore: 91, financialHealthScore: 93, creditRiskScore: 89, engagementScore: 91, recordedDate: '2026-07-15' },
      { customerId: custKalyan.id, coreScore: 91, financialHealthScore: 93, creditRiskScore: 90, engagementScore: 91, recordedDate: '2026-08-01' },
      { customerId: custKalyan.id, coreScore: 92, financialHealthScore: 94, creditRiskScore: 90, engagementScore: 91, recordedDate: '2026-08-15' },
      { customerId: custKalyan.id, coreScore: 92, financialHealthScore: 94, creditRiskScore: 90, engagementScore: 91, recordedDate: '2026-09-01' },
      { customerId: custKalyan.id, coreScore: 92, financialHealthScore: 94, creditRiskScore: 90, engagementScore: 91, recordedDate: '2026-09-10' },
      { customerId: custKalyan.id, coreScore: 92, financialHealthScore: 94, creditRiskScore: 90, engagementScore: 91, recordedDate: '2026-09-17' },

      // Meera Sundaram: 77 -> 78 -> 79 -> 81 (steady growth)
      { customerId: custMeera.id, coreScore: 77, financialHealthScore: 80, creditRiskScore: 76, engagementScore: 77, recordedDate: '2026-06-15' },
      { customerId: custMeera.id, coreScore: 78, financialHealthScore: 81, creditRiskScore: 77, engagementScore: 78, recordedDate: '2026-07-15' },
      { customerId: custMeera.id, coreScore: 79, financialHealthScore: 82, creditRiskScore: 78, engagementScore: 80, recordedDate: '2026-08-15' },
      { customerId: custMeera.id, coreScore: 81, financialHealthScore: 85, creditRiskScore: 80, engagementScore: 82, recordedDate: '2026-09-01' },
      { customerId: custMeera.id, coreScore: 81, financialHealthScore: 85, creditRiskScore: 80, engagementScore: 82, recordedDate: '2026-09-17' },

      // Sunil Varma: 82 -> 80 -> 78 -> 76 (mild deterioration due to overdue)
      { customerId: custSunil.id, coreScore: 82, financialHealthScore: 81, creditRiskScore: 80, engagementScore: 83, recordedDate: '2026-06-15' },
      { customerId: custSunil.id, coreScore: 80, financialHealthScore: 79, creditRiskScore: 78, engagementScore: 82, recordedDate: '2026-07-01' },
      { customerId: custSunil.id, coreScore: 79, financialHealthScore: 77, creditRiskScore: 76, engagementScore: 81, recordedDate: '2026-07-15' },
      { customerId: custSunil.id, coreScore: 78, financialHealthScore: 76, creditRiskScore: 74, engagementScore: 81, recordedDate: '2026-08-01' },
      { customerId: custSunil.id, coreScore: 77, financialHealthScore: 75, creditRiskScore: 73, engagementScore: 80, recordedDate: '2026-08-15' },
      { customerId: custSunil.id, coreScore: 76, financialHealthScore: 74, creditRiskScore: 72, engagementScore: 80, recordedDate: '2026-09-01' },
      { customerId: custSunil.id, coreScore: 76, financialHealthScore: 74, creditRiskScore: 72, engagementScore: 80, recordedDate: '2026-09-17' },

      // Ananya Deshmukh: 74 -> 76 -> 78 -> 79 (moderate expansion)
      { customerId: custAnanya.id, coreScore: 74, financialHealthScore: 76, creditRiskScore: 73, engagementScore: 74, recordedDate: '2026-06-15' },
      { customerId: custAnanya.id, coreScore: 76, financialHealthScore: 78, creditRiskScore: 75, engagementScore: 76, recordedDate: '2026-07-15' },
      { customerId: custAnanya.id, coreScore: 78, financialHealthScore: 80, creditRiskScore: 77, engagementScore: 77, recordedDate: '2026-08-15' },
      { customerId: custAnanya.id, coreScore: 79, financialHealthScore: 82, creditRiskScore: 78, engagementScore: 78, recordedDate: '2026-09-01' },
      { customerId: custAnanya.id, coreScore: 79, financialHealthScore: 82, creditRiskScore: 78, engagementScore: 78, recordedDate: '2026-09-17' },
    ])
    .onConflictDoNothing();

  // 12. Customer Insights
  await db
    .insert(customerInsights)
    .values([
      {
        customerId: custRahul.id,
        insightType: 'CROSS_SELL',
        title: 'Pre-Approved Wealth Investment Advisory',
        description: 'Consistent monthly surplus of ₹1.4L observed over last 6 salary credits.',
        urgency: 'MEDIUM',
        actionPrompt: 'Recommend Sovereign Gold Bond or Floating Rate Savings Bonds.',
        isDismissed: false,
      },
      {
        customerId: custRahul.id,
        insightType: 'LIQUIDITY',
        title: 'Tax-Saving Section 80C Optimal Utilization',
        description: 'Current tax-saver investment window open for FY2026-27.',
        urgency: 'LOW',
        actionPrompt: 'Offer 5-Year Tax Saver Term Deposit renewal option.',
        isDismissed: false,
      },
      {
        customerId: custKalyan.id,
        insightType: 'CREDIT_RISK',
        title: 'Quarterly Stock Audit Certificate Scheduled',
        description: 'Drawing Power review due on 30-SEP-2026; chartered engineer report pending.',
        urgency: 'HIGH',
        actionPrompt: 'Notify CFO regarding stock statement upload on CBS portal.',
        isDismissed: false,
      },
    ])
    .onConflictDoNothing();

  // 13. Service Cases
  await db
    .insert(serviceCases)
    .values([
      {
        caseNumber: 'CAS-2026-0901',
        customerId: custRahul.id,
        accountId: accRahulSal.id,
        title: 'Annual Housing Loan Interest Provisional Certificate Request',
        description: 'Customer requested Form 16 IT deduction certificate for FY 2026-27.',
        category: 'LOAN_DISBURSEMENT',
        priority: 'LOW',
        status: 'RESOLVED',
        assignedToId: userDeepak.id,
        resolutionSummary: 'Certificate generated from Core Lending Subsystem and emailed to registered address.',
        slaDueDate: new Date('2026-09-12'),
      },
      {
        caseNumber: 'CAS-2026-0902',
        customerId: custKalyan.id,
        accountId: accKalyan.id,
        title: 'Foreign Inward Remittance Certificate (FIRC) Issuance',
        description: 'FIRC required for advance export receipt of USD 240,000 from European client.',
        category: 'PAYMENTS_CLEARING',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        assignedToId: userPooja.id,
        slaDueDate: new Date('2026-09-10'),
      },
    ])
    .onConflictDoNothing();

  // 14. Tasks
  await db
    .insert(tasks)
    .values([
      {
        customerId: custRahul.id,
        title: 'Annual Relationship Review & Credit Card Upgrade Follow-up',
        description: 'Offer Signature Infinite RuPay Metal Credit Card based on pristine salary flow.',
        dueDate: '2026-09-15',
        priority: 'MEDIUM',
        status: 'PENDING',
        assignedToId: userDeepak.id,
        relatedType: 'OPPORTUNITY',
      },
      {
        customerId: custKalyan.id,
        title: 'Verify Boisar Unit Stock Audit Statement for September',
        description: 'Validate raw material inventories to reaffirm drawing power of ₹13.80 Cr.',
        dueDate: '2026-09-20',
        priority: 'HIGH',
        status: 'PENDING',
        assignedToId: userPooja.id,
        relatedType: 'LOAN',
      },
    ])
    .onConflictDoNothing();

  // 15. Opportunities
  await db
    .insert(opportunities)
    .values([
      {
        opportunityCode: 'OPP-2026-10482',
        customerId: custRahul.id,
        productId: prodFd.id,
        title: 'Special Senior Citizen Fixed Deposit for Parents',
        stage: 'PROPOSAL',
        expectedValue: '1500000.00',
        probability: 75,
        expectedCloseDate: '2026-09-25',
        notes: 'Customer inquired about 7.60% special tenor scheme during last branch visit.',
        assignedToId: userDeepak.id,
      },
      {
        opportunityCode: 'OPP-2026-20841',
        customerId: custKalyan.id,
        productId: prodWc.id,
        title: 'Working Capital Limit Enhancement from ₹15 Cr to ₹20 Cr',
        stage: 'QUALIFIED',
        expectedValue: '50000000.00',
        probability: 60,
        expectedCloseDate: '2026-10-15',
        notes: 'Expansion of Boisar Forging Line 3 requires enhanced working capital headroom.',
        assignedToId: userPooja.id,
      },
    ])
    .onConflictDoNothing();

  // 16. Interactions
  await db
    .insert(interactions)
    .values([
      {
        customerId: custRahul.id,
        channel: 'IN_BRANCH',
        interactionType: 'CREDIT_REVIEW',
        subject: 'Housing Loan Pre-Payment & Tax Certificate Discussion',
        summary: 'Met RM Deepak Nambiar. Inquired about partial lump-sum repayment of ₹5.0L towards home loan.',
        outcome: 'Provided amortization schedule showing interest savings of ₹3.2L.',
        agentId: userDeepak.id,
      },
      {
        customerId: custKalyan.id,
        channel: 'RM_VISIT',
        interactionType: 'SERVICE_REQUEST',
        subject: 'Treasury Hedging & Trade LC Margin Optimization',
        summary: 'Visited Maker Chambers corporate office. Discussed upcoming European shipment LC.',
        outcome: 'Agreed on 10% cash margin lien release upon bill presentation.',
        agentId: userPooja.id,
      },
    ])
    .onConflictDoNothing();

  // 17. Transactions
  await db
    .insert(transactions)
    .values([
      {
        transactionId: 'TXN-2026-0909-001',
        utrNumber: 'CRVIR52026090900142981',
        accountId: accRahulSal.id,
        customerId: custRahul.id,
        txnType: 'CREDIT',
        rail: 'NEFT',
        amount: '245000.00',
        balanceAfter: '842500.00',
        counterpartyAccount: '0002010049128',
        counterpartyName: 'TechCorp India Pvt Ltd Payroll',
        counterpartyIfsc: 'HDFC0000002',
        narration: 'Salary Credit for August 2026',
        status: 'SETTLED',
      },
      {
        transactionId: 'TXN-2026-0909-002',
        utrNumber: 'CRVIR52026090900184912',
        accountId: accKalyan.id,
        customerId: custKalyan.id,
        txnType: 'DEBIT',
        rail: 'RTGS',
        amount: '14500000.00',
        balanceAfter: '84250000.00',
        counterpartyAccount: '0104050019284',
        counterpartyName: 'Bharat Scrap Traders Consortium',
        counterpartyIfsc: 'SBIN0000428',
        narration: 'Supplier Settlement Invoice #BST-2026-891',
        status: 'SETTLED',
      },
    ])
    .onConflictDoNothing();

  // 18. Audit Logs
  await db
    .insert(auditLogs)
    .values([
      {
        actorId: userAditya.employeeId,
        actorName: userAditya.name,
        action: 'EOD_DATABASE_INITIALIZATION',
        resourceType: 'SYSTEM_POSTGRES_SCHEMA',
        resourceId: 'PROD-COREVIA-DB-01',
        requestId: `REQ-INIT-${Date.now()}`,
        outcome: 'SUCCESS',
        metadata: JSON.stringify({
          environment: 'production',
          databaseEngine: 'PostgreSQL 15 Cloud SQL',
          tablesProvisioned: 23,
        }),
      },
    ])
    .onConflictDoNothing();

  // Phase 26 Relationship Digital Twin Seed
  try {
    const { seedRelationshipTwinData } = await import('./seedRelationshipTwin.ts');
    await seedRelationshipTwinData();
  } catch (err) {
    console.error('Failed to seed Relationship Digital Twin data:', err);
  }

  console.log('--- COREvia PostgreSQL Database Seeding Completed Successfully ---');
}

// If invoked directly
if (process.argv[1]?.endsWith('seed.ts')) {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: Database seeding is disabled in the production environment to prevent data corruption.');
    process.exit(1);
  }
  
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
