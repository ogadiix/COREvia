import { db } from './index.ts';
import {
  users,
  customers,
  products,
  accounts,
  accountBalances,
  customerProducts,
  loans,
  loanRepayments,
  transactions,
  customerScores,
  auditLogs,
} from './schema.ts';
import { eq } from 'drizzle-orm';

export async function seedPhase5Data() {
  console.log('--- Starting COREvia Phase 5 Seeding ---');

  const allUsers = await db.select().from(users);
  const userDeepak = allUsers.find((u) => u.employeeId === 'EMP-401928') || allUsers[0];
  const userPooja = allUsers.find((u) => u.employeeId === 'EMP-591024') || allUsers[0];
  const userAditya = allUsers.find((u) => u.employeeId === 'EMP-782194') || allUsers[0];

  const allCustomers = await db.select().from(customers);
  const custRahul = allCustomers.find((c) => c.customerCode === 'CUS-10482') || allCustomers[0];
  const custKalyan = allCustomers.find((c) => c.customerCode === 'CUS-20841') || allCustomers[1];
  const custMeera = allCustomers.find((c) => c.customerCode === 'CUS-30915') || allCustomers[2];
  const custSunil = allCustomers.find((c) => c.customerCode === 'CUS-40182') || allCustomers[3];
  const custAnanya = allCustomers.find((c) => c.customerCode === 'CUS-50824') || allCustomers[4];

  // 1. Upsert / Seed Full Products Catalog
  const productsList = [
    {
      productCode: 'PRD-SB-GEN',
      category: 'CASA',
      name: 'Regular Savings Account',
      description: 'Flexible retail savings account with multi-currency debit card and UPI integration',
      eligibility: 'Resident Individuals, HUF, Min age 18',
      interestRateRange: '3.00% - 3.50%',
      minBalance: '10000.00',
      features: 'Free netbanking, UPI 2.0, 5 free ATM withdrawals/month, instant virtual card',
      isActive: true,
    },
    {
      productCode: 'PRD-SB-SAL',
      category: 'CASA',
      name: 'Corporate Salary Savings Plus',
      description: 'Zero-balance premium salary account with complementary personal accident cover',
      eligibility: 'Salaried employees with monthly net credit >= ₹50,000',
      interestRateRange: '3.50% - 4.00%',
      minBalance: '0.00',
      features: 'Zero balance requirement, Platinum debit card, unlimited branch cash deposit, ₹50L air accident cover',
      isActive: true,
    },
    {
      productCode: 'PRD-SB-PREM',
      category: 'CASA',
      name: 'Premium Savings Pinnacle',
      description: 'High net worth savings account with dedicated relationship manager and lounge access',
      eligibility: 'High Net-Worth Individuals with Total Relationship Value >= ₹25 Lakhs',
      interestRateRange: '4.00% - 5.00%',
      minBalance: '100000.00',
      features: 'Dedicated Relationship Manager, complimentary airport lounge access, 50% discount on locker rent',
      isActive: true,
    },
    {
      productCode: 'PRD-CA-MSME',
      category: 'CASA',
      name: 'MSME Business Current Plus',
      description: 'Current account tailored for small and medium enterprises with dynamic cash limits',
      eligibility: 'Proprietorships, Partnerships, MSME registered manufacturing & service entities',
      interestRateRange: '0.00%',
      minBalance: '50000.00',
      features: 'High daily cash deposit limit of ₹10L, POS terminal integration, zero outward NEFT/RTGS charges',
      isActive: true,
    },
    {
      productCode: 'PRD-CA-PREM',
      category: 'CASA',
      name: 'Corporate Premier Current Account',
      description: 'Enterprise-grade current account with host-to-host CMS and multi-signatory workflow',
      eligibility: 'Private & Public Limited Companies, Trusts with turnover > ₹10 Crores',
      interestRateRange: '0.00%',
      minBalance: '500000.00',
      features: 'Host-to-host ERP integration, automated sweep-in/out, multi-layer maker-checker authorization',
      isActive: true,
    },
    {
      productCode: 'PRD-FD-TAX',
      category: 'CASA',
      name: 'Tax-Saver 5-Year Fixed Deposit',
      description: 'Section 80C compliant term deposit with compounding quarterly interest',
      eligibility: 'Resident individuals & HUF',
      interestRateRange: '7.10% - 7.60%',
      minBalance: '10000.00',
      features: 'Income Tax benefit up to ₹1.5L under Sec 80C, 5-year statutory lock-in, quarterly compounding',
      isActive: true,
    },
    {
      productCode: 'PRD-RD-FLEX',
      category: 'CASA',
      name: 'Recurring Deposit FlexiPlus',
      description: 'Monthly disciplined savings deposit with flexible top-up options and loan against deposit',
      eligibility: 'All KYC verified individual account holders',
      interestRateRange: '6.80% - 7.25%',
      minBalance: '2000.00',
      features: 'Tenure from 12 to 120 months, standing instruction automation, loan against deposit up to 90%',
      isActive: true,
    },
    {
      productCode: 'PRD-CRD-MET',
      category: 'CARDS',
      name: 'Signature Metal RuPay Credit Card',
      description: 'Super-premium metal credit card with international lounge access and UPI credit line linkage',
      eligibility: 'Annual income >= ₹15 Lakhs or Bank TRV >= ₹10 Lakhs',
      interestRateRange: '3.49% per month (41.88% p.a.)',
      minBalance: '0.00',
      features: 'Complimentary golf access, 2% reward rate on dining & travel, zero forex markup, RuPay UPI linkage',
      isActive: true,
    },
    {
      productCode: 'PRD-LN-HL',
      category: 'ASSET_LOAN',
      name: 'Prime Home Loan',
      description: 'External benchmark repo-linked home loan for purchase, construction or extension',
      eligibility: 'Salaried/Self-employed with CIBIL >= 750',
      interestRateRange: '8.35% - 8.90%',
      minBalance: '0.00',
      features: 'Up to 85% LTV, 30-year max tenure, zero prepayment penalty for floating rate, PMAY subsidy support',
      isActive: true,
    },
    {
      productCode: 'PRD-LN-PL',
      category: 'ASSET_LOAN',
      name: 'Express Personal Loan',
      description: 'Instant unsecured personal loan with digital sanction and minimal documentation',
      eligibility: 'Salaried professionals with minimum 2 years work experience',
      interestRateRange: '10.50% - 13.75%',
      minBalance: '0.00',
      features: 'Sanction within 15 minutes, flexible tenure up to 60 months, zero collateral needed',
      isActive: true,
    },
    {
      productCode: 'PRD-LN-EDU',
      category: 'ASSET_LOAN',
      name: 'Global Scholar Education Loan',
      description: 'Comprehensive higher education financing for premier Indian & overseas universities',
      eligibility: 'Admitted students in recognized accredited courses with co-borrower parents',
      interestRateRange: '8.75% - 9.50%',
      minBalance: '0.00',
      features: '100% tuition & living cost coverage, moratorium period of course duration + 1 year',
      isActive: true,
    },
    {
      productCode: 'PRD-LN-VEH',
      category: 'ASSET_LOAN',
      name: 'Auto Drive Car Loan',
      description: 'Competitive vehicle financing for new passenger vehicles and electric vehicles',
      eligibility: 'Individuals with net annual income >= ₹4 Lakhs',
      interestRateRange: '8.65% - 9.20%',
      minBalance: '0.00',
      features: 'Up to 90% on-road financing, 7-year tenure, 0.25% green discount for electric vehicles',
      isActive: true,
    },
    {
      productCode: 'PRD-LN-WC',
      category: 'ASSET_LOAN',
      name: 'Working Capital Cash Credit Facility',
      description: 'Revolving credit line against hypothecation of raw materials, stock, and trade debtors',
      eligibility: 'Operating businesses with audited balance sheets for 3 continuous years',
      interestRateRange: '9.15% - 10.25%',
      minBalance: '0.00',
      features: 'Monthly drawing power based on stock statements, interest charged on actual daily utilization',
      isActive: true,
    },
    {
      productCode: 'PRD-INS-HLTH',
      category: 'INSURANCE',
      name: 'Comprehensive Health & Life Assurance',
      description: 'Bancassurance group term life and critical illness health insurance coverage',
      eligibility: 'Bank account holders aged 18-65 years',
      interestRateRange: 'N/A',
      minBalance: '0.00',
      features: 'Cashless hospital network across 8,000+ facilities, tax deduction benefit under Sec 80D',
      isActive: true,
    },
    {
      productCode: 'PRD-INV-WEALTH',
      category: 'WEALTH',
      name: 'Sovereign Wealth & Mutual Fund Portfolio',
      description: 'Curated equity, debt, and hybrid mutual fund baskets with automated SIP',
      eligibility: 'KYC & CAMS/KFintech compliant investors',
      interestRateRange: 'Market Linked (Expected 11-14%)',
      minBalance: '5000.00',
      features: 'Zero-commission direct funds, goal-based portfolio rebalancing, integrated consolidated account statement',
      isActive: true,
    },
  ];

  for (const p of productsList) {
    await db
      .insert(products)
      .values(p)
      .onConflictDoUpdate({
        target: products.productCode,
        set: {
          category: p.category,
          name: p.name,
          description: p.description,
          eligibility: p.eligibility,
          interestRateRange: p.interestRateRange,
          minBalance: p.minBalance,
          features: p.features,
          isActive: p.isActive,
        },
      });
  }

  const allDbProducts = await db.select().from(products);
  const getProd = (code: string) => allDbProducts.find((p) => p.productCode === code)!;

  // 2. Insert Accounts with realistic types: SAVINGS, CURRENT, SALARY, PREMIUM_SAVINGS, FIXED_DEPOSIT, RECURRING_DEPOSIT
  const accountsList = [
    // Rahul Sharma Accounts
    {
      accountNumber: '10420100089104',
      customerId: custRahul.id,
      accountType: 'SALARY',
      schemeCode: 'SB-SAL-PREMIER',
      schemeName: 'Corporate Salary Savings Plus',
      currency: 'INR',
      interestRate: '3.50',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2021-06-15',
      panNumber: custRahul.panNumber,
      nomineeName: 'Pooja Sharma',
      nomineeRelation: 'SPOUSE',
    },
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
      panNumber: custRahul.panNumber,
      nomineeName: 'Pooja Sharma',
      nomineeRelation: 'SPOUSE',
    },
    {
      accountNumber: '10420100089106',
      customerId: custRahul.id,
      accountType: 'RECURRING_DEPOSIT',
      schemeCode: 'RD-FLEX-GOLD',
      schemeName: 'FlexiPlus Monthly Recurring Deposit',
      currency: 'INR',
      interestRate: '6.90',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2023-08-10',
      panNumber: custRahul.panNumber,
      nomineeName: 'Pooja Sharma',
      nomineeRelation: 'SPOUSE',
    },

    // Kalyan Steels Accounts
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
      panNumber: custKalyan.panNumber,
    },
    {
      accountNumber: '10420100084913',
      customerId: custKalyan.id,
      accountType: 'CURRENT',
      schemeCode: 'CA-EXPORT-ESCROW',
      schemeName: 'Corporate Export Escrow Account',
      currency: 'INR',
      interestRate: '0.00',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2020-05-12',
      panNumber: custKalyan.panNumber,
    },

    // Meera Sundaram Accounts
    {
      accountNumber: '10420100084914',
      customerId: custMeera.id,
      accountType: 'PREMIUM_SAVINGS',
      schemeCode: 'SB-NRE-PRIME',
      schemeName: 'Non-Resident External (NRE) Prime Savings',
      currency: 'INR',
      interestRate: '4.25',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2019-11-04',
      panNumber: custMeera.panNumber,
    },
    {
      accountNumber: '10420100084915',
      customerId: custMeera.id,
      accountType: 'FIXED_DEPOSIT',
      schemeCode: 'FD-FCNR-USD',
      schemeName: 'FCNR USD Foreign Currency Term Deposit',
      currency: 'INR',
      interestRate: '5.60',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2021-02-18',
      panNumber: custMeera.panNumber,
    },

    // Sunil Varma Accounts
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
      panNumber: custSunil.panNumber,
    },
    {
      accountNumber: '10420100084917',
      customerId: custSunil.id,
      accountType: 'SAVINGS',
      schemeCode: 'SB-REG-RETAIL',
      schemeName: 'Regular Resident Savings Account',
      currency: 'INR',
      interestRate: '3.00',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2023-01-14',
      panNumber: custSunil.panNumber,
    },

    // Ananya Deshmukh Accounts
    {
      accountNumber: '10420100084918',
      customerId: custAnanya.id,
      accountType: 'SAVINGS',
      schemeCode: 'SB-PRO-SMART',
      schemeName: 'Professional Super Savings',
      currency: 'INR',
      interestRate: '3.50',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2020-02-14',
      panNumber: custAnanya.panNumber,
    },
    {
      accountNumber: '10420100084919',
      customerId: custAnanya.id,
      accountType: 'FIXED_DEPOSIT',
      schemeCode: 'FD-MOD-FLEXI',
      schemeName: 'Multi-Option Deposit Scheme (MODS)',
      currency: 'INR',
      interestRate: '7.00',
      status: 'ACTIVE',
      branchCode: '0104',
      branchName: 'Mumbai Fort Branch',
      ifscCode: 'CRVI0001042',
      openDate: '2021-09-20',
      panNumber: custAnanya.panNumber,
    },
  ];

  for (const acc of accountsList) {
    await db
      .insert(accounts)
      .values(acc)
      .onConflictDoUpdate({
        target: accounts.accountNumber,
        set: {
          accountType: acc.accountType,
          schemeCode: acc.schemeCode,
          schemeName: acc.schemeName,
          status: acc.status,
          branchName: acc.branchName,
          interestRate: acc.interestRate,
        },
      });
  }

  const allDbAccounts = await db.select().from(accounts);
  const getAcc = (num: string) => allDbAccounts.find((a) => a.accountNumber === num)!;

  // 3. Upsert Account Balances
  const balancesList = [
    {
      accountId: getAcc('10420100089104').id,
      availableBalance: '842500.00',
      ledgerBalance: '842500.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100089105').id,
      availableBalance: '1500000.00',
      ledgerBalance: '1500000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100089106').id,
      availableBalance: '500000.00',
      ledgerBalance: '500000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084912').id,
      availableBalance: '84250000.00',
      ledgerBalance: '86450000.00',
      lienAmount: '2200000.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084913').id,
      availableBalance: '18500000.00',
      ledgerBalance: '18500000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084914').id,
      availableBalance: '2415000.00',
      ledgerBalance: '2415000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084915').id,
      availableBalance: '4500000.00',
      ledgerBalance: '4500000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084916').id,
      availableBalance: '4280000.00',
      ledgerBalance: '4280000.00',
      lienAmount: '500000.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084917').id,
      availableBalance: '650000.00',
      ledgerBalance: '650000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084918').id,
      availableBalance: '1820000.00',
      ledgerBalance: '1820000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
    {
      accountId: getAcc('10420100084919').id,
      availableBalance: '1250000.00',
      ledgerBalance: '1250000.00',
      lienAmount: '0.00',
      unclearBalance: '0.00',
      currency: 'INR',
    },
  ];

  for (const b of balancesList) {
    await db
      .insert(accountBalances)
      .values(b)
      .onConflictDoUpdate({
        target: accountBalances.accountId,
        set: {
          availableBalance: b.availableBalance,
          ledgerBalance: b.ledgerBalance,
          lienAmount: b.lienAmount,
          asOfDate: new Date(),
          updatedAt: new Date(),
        },
      });
  }

  // 4. Upsert Loans with realistic Loan Types: HOME_LOAN, PERSONAL_LOAN, EDUCATION_LOAN, VEHICLE_LOAN, BUSINESS_LOAN
  const loansList = [
    // Rahul Sharma - Home Loan
    {
      loanAccountNumber: '10427010009412',
      customerId: custRahul.id,
      loanType: 'HOME_LOAN',
      sanctionedLimit: '4500000.00',
      drawingPower: '4500000.00',
      outstandingPrincipal: '3850000.00',
      interestDue: '0.00',
      interestRate: '8.40',
      benchmarkRate: 'Repo Rate 6.50% + Spread 1.90%',
      tenureMonths: 240,
      relationshipManagerId: userDeepak.id,
      sanctionDate: '2023-01-10',
      maturityDate: '2043-01-10',
      nextEmiDate: '2026-10-05',
      emiAmount: '38750.00',
      overdueDays: 0,
      assetClassification: 'STANDARD',
      collateralType: 'Registered Equitable Mortgage of Residential Flat',
      collateralValue: '6500000.00',
      hypothecationDetails: 'Emerald Towers Flat 902, Prabhadevi, Worli Sea Face, Mumbai',
      prioritySector: false,
      provisionAmount: '15400.00',
    },

    // Kalyan Steels - Working Capital Business Loan
    {
      loanAccountNumber: '10427010008491',
      customerId: custKalyan.id,
      loanType: 'BUSINESS_LOAN',
      sanctionedLimit: '150000000.00',
      drawingPower: '138000000.00',
      outstandingPrincipal: '112000000.00',
      interestDue: '0.00',
      interestRate: '9.25',
      benchmarkRate: '1-Yr MCLR 8.10% + Spread 1.15%',
      tenureMonths: 60,
      relationshipManagerId: userPooja.id,
      sanctionDate: '2022-04-10',
      maturityDate: '2027-04-09',
      nextEmiDate: '2026-09-30',
      emiAmount: '0.00',
      overdueDays: 0,
      assetClassification: 'STANDARD',
      collateralType: 'First Charge on Raw Material Stock & Plant Machinery',
      collateralValue: '210000000.00',
      hypothecationDetails: 'Steel Billets, Heavy Hydraulic Presses, Boisar Plant Unit 4',
      prioritySector: false,
      provisionAmount: '448000.00',
    },

    // Sunil Varma - MSME Priority Business Loan
    {
      loanAccountNumber: '10427010008493',
      customerId: custSunil.id,
      loanType: 'BUSINESS_LOAN',
      sanctionedLimit: '7500000.00',
      drawingPower: '7200000.00',
      outstandingPrincipal: '5400000.00',
      interestDue: '42500.00',
      interestRate: '9.75',
      benchmarkRate: 'Repo Rate 6.50% + Spread 3.25%',
      tenureMonths: 72,
      relationshipManagerId: userDeepak.id,
      sanctionDate: '2022-10-18',
      maturityDate: '2028-10-15',
      nextEmiDate: '2026-09-15',
      emiAmount: '112500.00',
      overdueDays: 14,
      assetClassification: 'SMA_0',
      collateralType: 'Commercial Shed & Powerloom Machinery Hypothecation',
      collateralValue: '11000000.00',
      hypothecationDetails: 'Bhiwandi Industrial Complex Shed No 42, Powerloom Looms #1-8',
      prioritySector: true,
      provisionAmount: '27000.00',
    },

    // Meera Sundaram - Vehicle Loan
    {
      loanAccountNumber: '10427010009415',
      customerId: custMeera.id,
      loanType: 'VEHICLE_LOAN',
      sanctionedLimit: '2800000.00',
      drawingPower: '2800000.00',
      outstandingPrincipal: '1420000.00',
      interestDue: '0.00',
      interestRate: '8.75',
      benchmarkRate: 'Fixed Bank Base Lending Rate',
      tenureMonths: 60,
      relationshipManagerId: userDeepak.id,
      sanctionDate: '2023-06-15',
      maturityDate: '2028-06-15',
      nextEmiDate: '2026-10-01',
      emiAmount: '57800.00',
      overdueDays: 0,
      assetClassification: 'STANDARD',
      collateralType: 'Hypothecation of Electric Luxury Vehicle',
      collateralValue: '3400000.00',
      hypothecationDetails: 'BMW i4 eDrive40, Registration MH01-EX-4019',
      prioritySector: false,
      provisionAmount: '5680.00',
    },

    // Ananya Deshmukh - Personal Loan
    {
      loanAccountNumber: '10427010009418',
      customerId: custAnanya.id,
      loanType: 'PERSONAL_LOAN',
      sanctionedLimit: '1200000.00',
      drawingPower: '1200000.00',
      outstandingPrincipal: '640000.00',
      interestDue: '0.00',
      interestRate: '10.90',
      benchmarkRate: 'Bank Unsecured Lending Benchmark',
      tenureMonths: 48,
      relationshipManagerId: userDeepak.id,
      sanctionDate: '2024-03-10',
      maturityDate: '2028-03-10',
      nextEmiDate: '2026-09-25',
      emiAmount: '30950.00',
      overdueDays: 0,
      assetClassification: 'STANDARD',
      collateralType: 'Clean / Unsecured Personal Credit Facility',
      collateralValue: '0.00',
      hypothecationDetails: 'Standing Instruction on Professional Account 10420100084918',
      prioritySector: false,
      provisionAmount: '2560.00',
    },
  ];

  for (const l of loansList) {
    await db
      .insert(loans)
      .values(l)
      .onConflictDoUpdate({
        target: loans.loanAccountNumber,
        set: {
          loanType: l.loanType,
          sanctionedLimit: l.sanctionedLimit,
          drawingPower: l.drawingPower,
          outstandingPrincipal: l.outstandingPrincipal,
          interestRate: l.interestRate,
          tenureMonths: l.tenureMonths,
          relationshipManagerId: l.relationshipManagerId,
          emiAmount: l.emiAmount,
          assetClassification: l.assetClassification,
        },
      });
  }

  const allDbLoans = await db.select().from(loans);
  const loanRahulHl = allDbLoans.find((l) => l.loanAccountNumber === '10427010009412')!;

  // 5. Seed Loan Repayment History for Rahul Sharma's Home Loan
  const repaymentsList = [
    {
      loanId: loanRahulHl.id,
      installmentNumber: 1,
      dueDate: '2025-10-05',
      paidDate: '2025-10-05',
      principalPaid: '11800.00',
      interestPaid: '26950.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4088200.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20251005-90142',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 2,
      dueDate: '2025-11-05',
      paidDate: '2025-11-05',
      principalPaid: '11880.00',
      interestPaid: '26870.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4076320.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20251105-88192',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 3,
      dueDate: '2025-12-05',
      paidDate: '2025-12-05',
      principalPaid: '11960.00',
      interestPaid: '26790.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4064360.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20251205-77182',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 4,
      dueDate: '2026-01-05',
      paidDate: '2026-01-05',
      principalPaid: '12040.00',
      interestPaid: '26710.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4052320.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260105-66191',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 5,
      dueDate: '2026-02-05',
      paidDate: '2026-02-05',
      principalPaid: '12120.00',
      interestPaid: '26630.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4040200.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260205-55102',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 6,
      dueDate: '2026-03-05',
      paidDate: '2026-03-05',
      principalPaid: '12200.00',
      interestPaid: '26550.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4028000.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260305-44182',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 7,
      dueDate: '2026-04-05',
      paidDate: '2026-04-05',
      principalPaid: '12280.00',
      interestPaid: '26470.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4015720.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260405-33190',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 8,
      dueDate: '2026-05-05',
      paidDate: '2026-05-05',
      principalPaid: '12360.00',
      interestPaid: '26390.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '4003360.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260505-22183',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 9,
      dueDate: '2026-06-05',
      paidDate: '2026-06-05',
      principalPaid: '12440.00',
      interestPaid: '26310.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '3990920.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260605-11928',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 10,
      dueDate: '2026-07-05',
      paidDate: '2026-07-05',
      principalPaid: '12520.00',
      interestPaid: '26230.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '3978400.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260705-99182',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 11,
      dueDate: '2026-08-05',
      paidDate: '2026-08-05',
      principalPaid: '12600.00',
      interestPaid: '26150.00',
      totalAmount: '38750.00',
      outstandingBalanceAfter: '3965800.00',
      paymentMode: 'AUTO_DEBIT',
      referenceNumber: 'NACH-20260805-88192',
      status: 'PAID',
    },
    {
      loanId: loanRahulHl.id,
      installmentNumber: 12,
      dueDate: '2026-09-05',
      paidDate: '2026-09-05',
      principalPaid: '115800.00', // includes ₹1,00,000 part prepayment
      interestPaid: '26070.00',
      totalAmount: '141870.00',
      outstandingBalanceAfter: '3850000.00',
      paymentMode: 'RTGS',
      referenceNumber: 'CRVIR52026090549102',
      status: 'PAID',
    },
  ];

  await db.delete(loanRepayments).where(eq(loanRepayments.loanId, loanRahulHl.id));
  await db.insert(loanRepayments).values(repaymentsList);

  // 6. Customer Products: Rahul Sharma has 6 Active Products
  // Savings Account, Current Account/RD, Credit Card, Fixed Deposit, Home Loan, Insurance
  const customerProductsList = [
    // Rahul Sharma: 6 Active Products
    {
      customerId: custRahul.id,
      productId: getProd('PRD-SB-SAL').id,
      accountId: getAcc('10420100089104').id,
      status: 'ACTIVE',
      enrolledDate: '2021-06-15',
    },
    {
      customerId: custRahul.id,
      productId: getProd('PRD-FD-TAX').id,
      accountId: getAcc('10420100089105').id,
      status: 'ACTIVE',
      enrolledDate: '2022-03-28',
    },
    {
      customerId: custRahul.id,
      productId: getProd('PRD-RD-FLEX').id,
      accountId: getAcc('10420100089106').id,
      status: 'ACTIVE',
      enrolledDate: '2023-08-10',
    },
    {
      customerId: custRahul.id,
      productId: getProd('PRD-LN-HL').id,
      status: 'ACTIVE',
      enrolledDate: '2023-01-10',
    },
    {
      customerId: custRahul.id,
      productId: getProd('PRD-CRD-MET').id,
      status: 'ACTIVE',
      enrolledDate: '2022-11-14',
    },
    {
      customerId: custRahul.id,
      productId: getProd('PRD-INS-HLTH').id,
      status: 'ACTIVE',
      enrolledDate: '2021-07-01',
    },

    // Kalyan Steels: 4 Active Products
    {
      customerId: custKalyan.id,
      productId: getProd('PRD-CA-PREM').id,
      accountId: getAcc('10420100084912').id,
      status: 'ACTIVE',
      enrolledDate: '2018-03-22',
    },
    {
      customerId: custKalyan.id,
      productId: getProd('PRD-LN-WC').id,
      status: 'ACTIVE',
      enrolledDate: '2022-04-10',
    },
    {
      customerId: custKalyan.id,
      productId: getProd('PRD-CA-PREM').id,
      accountId: getAcc('10420100084913').id,
      status: 'ACTIVE',
      enrolledDate: '2020-05-12',
    },
    {
      customerId: custKalyan.id,
      productId: getProd('PRD-TF-ILC').id,
      status: 'ACTIVE',
      enrolledDate: '2019-08-20',
    },

    // Meera Sundaram: 4 Active Products
    {
      customerId: custMeera.id,
      productId: getProd('PRD-SB-PREM').id,
      accountId: getAcc('10420100084914').id,
      status: 'ACTIVE',
      enrolledDate: '2019-11-04',
    },
    {
      customerId: custMeera.id,
      productId: getProd('PRD-FD-TAX').id,
      accountId: getAcc('10420100084915').id,
      status: 'ACTIVE',
      enrolledDate: '2021-02-18',
    },
    {
      customerId: custMeera.id,
      productId: getProd('PRD-LN-VEH').id,
      status: 'ACTIVE',
      enrolledDate: '2023-06-15',
    },
    {
      customerId: custMeera.id,
      productId: getProd('PRD-INV-WEALTH').id,
      status: 'ACTIVE',
      enrolledDate: '2020-09-10',
    },

    // Sunil Varma: 3 Active Products
    {
      customerId: custSunil.id,
      productId: getProd('PRD-CA-MSME').id,
      accountId: getAcc('10420100084916').id,
      status: 'ACTIVE',
      enrolledDate: '2022-08-19',
    },
    {
      customerId: custSunil.id,
      productId: getProd('PRD-SB-GEN').id,
      accountId: getAcc('10420100084917').id,
      status: 'ACTIVE',
      enrolledDate: '2023-01-14',
    },
    {
      customerId: custSunil.id,
      productId: getProd('PRD-LN-WC').id,
      status: 'ACTIVE',
      enrolledDate: '2022-10-18',
    },

    // Ananya Deshmukh: 4 Active Products
    {
      customerId: custAnanya.id,
      productId: getProd('PRD-SB-GEN').id,
      accountId: getAcc('10420100084918').id,
      status: 'ACTIVE',
      enrolledDate: '2020-02-14',
    },
    {
      customerId: custAnanya.id,
      productId: getProd('PRD-FD-TAX').id,
      accountId: getAcc('10420100084919').id,
      status: 'ACTIVE',
      enrolledDate: '2021-09-20',
    },
    {
      customerId: custAnanya.id,
      productId: getProd('PRD-LN-PL').id,
      status: 'ACTIVE',
      enrolledDate: '2024-03-10',
    },
    {
      customerId: custAnanya.id,
      productId: getProd('PRD-CRD-MET').id,
      status: 'ACTIVE',
      enrolledDate: '2023-05-15',
    },
  ];

  await db.delete(customerProducts);
  await db.insert(customerProducts).values(customerProductsList);

  // 7. Insert Realistic Transactions for Accounts
  const txnsList = [
    // Account 10420100089104 (Rahul Salary)
    {
      transactionId: 'TXN-2026-0909-101',
      utrNumber: 'CRVIR52026090900142981',
      accountId: getAcc('10420100089104').id,
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
      timestamp: new Date('2026-09-01T10:30:00Z'),
    },
    {
      transactionId: 'TXN-2026-0909-102',
      utrNumber: 'CRVIR52026090900184913',
      accountId: getAcc('10420100089104').id,
      customerId: custRahul.id,
      txnType: 'DEBIT',
      rail: 'RTGS',
      amount: '38750.00',
      balanceAfter: '597500.00',
      counterpartyAccount: '10427010009412',
      counterpartyName: 'COREvia Home Loan Division',
      counterpartyIfsc: 'CRVI0001042',
      narration: 'Automated EMI Debit - Loan 10427010009412',
      status: 'SETTLED',
      timestamp: new Date('2026-09-05T04:15:00Z'),
    },
    {
      transactionId: 'TXN-2026-0909-103',
      utrNumber: 'CRVIR52026090900192841',
      accountId: getAcc('10420100089104').id,
      customerId: custRahul.id,
      txnType: 'DEBIT',
      rail: 'UPI',
      amount: '18500.00',
      balanceAfter: '579000.00',
      counterpartyAccount: 'tata-cliq@icici',
      counterpartyName: 'Tata Digital Retails',
      counterpartyIfsc: 'ICIC0000001',
      narration: 'UPI E-Commerce Purchase Ref #TATA99120',
      status: 'SETTLED',
      timestamp: new Date('2026-09-06T14:22:00Z'),
    },
    {
      transactionId: 'TXN-2026-0909-104',
      utrNumber: 'CRVIR52026090900201948',
      accountId: getAcc('10420100089104').id,
      customerId: custRahul.id,
      txnType: 'CREDIT',
      rail: 'IMPS',
      amount: '125000.00',
      balanceAfter: '704000.00',
      counterpartyAccount: '9012010049281',
      counterpartyName: 'Consulting Honorarium Apex Advisors',
      counterpartyIfsc: 'SBIN0000104',
      narration: 'Professional Advisory Fee Retainer',
      status: 'SETTLED',
      timestamp: new Date('2026-09-07T11:45:00Z'),
    },
    {
      transactionId: 'TXN-2026-0909-105',
      utrNumber: 'CRVIR52026090900214829',
      accountId: getAcc('10420100089104').id,
      customerId: custRahul.id,
      txnType: 'DEBIT',
      rail: 'CTS_CHEQUE',
      amount: '50000.00',
      balanceAfter: '654000.00',
      counterpartyAccount: '0104020084910',
      counterpartyName: 'Emerald Towers Maintenance Society',
      counterpartyIfsc: 'UTIB0000042',
      narration: 'Cheque #401920 Clearing - Q3 Society Maintenance',
      status: 'SETTLED',
      timestamp: new Date('2026-09-08T09:10:00Z'),
    },

    // Account 10420100084912 (Kalyan Steels Corporate Current)
    {
      transactionId: 'TXN-2026-0909-201',
      utrNumber: 'CRVIR52026090900224912',
      accountId: getAcc('10420100084912').id,
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
      timestamp: new Date('2026-09-08T12:00:00Z'),
    },
    {
      transactionId: 'TXN-2026-0909-202',
      utrNumber: 'CRVIR52026090900238192',
      accountId: getAcc('10420100084912').id,
      customerId: custKalyan.id,
      txnType: 'CREDIT',
      rail: 'RTGS',
      amount: '22000000.00',
      balanceAfter: '98750000.00',
      counterpartyAccount: '5010020194820',
      counterpartyName: 'Larsen & Toubro Ltd Construction Div',
      counterpartyIfsc: 'HDFC0000120',
      narration: 'Institutional Project Milestone 4 Bill Payment',
      status: 'SETTLED',
      timestamp: new Date('2026-09-09T08:30:00Z'),
    },
  ];

  for (const t of txnsList) {
    await db
      .insert(transactions)
      .values(t)
      .onConflictDoNothing();
  }

  // 8. Update Customer Score for Rahul Sharma reflecting 6 products, zero overdue, and high AMB
  await db
    .insert(customerScores)
    .values({
      customerId: custRahul.id,
      coreScore: 88,
      financialHealthScore: 92,
      creditRiskScore: 86,
      engagementScore: 90,
      churnProbability: '0.03',
      calculationDate: '2026-09-09',
      factors: JSON.stringify({
        productDepth: '6_ACTIVE_PRODUCTS_HIGH_DIVERSITY',
        relationshipValue: '₹42.8L_STABLE_ASSET_LIABILITY_MIX',
        engagement: 'DAILY_MOBILE_AND_AUTO_CLEARING',
        repaymentTrackRecord: 'PRISTINE_ZERO_BOUNCE_12_CYCLES',
        averageMonthlyBalance: '₹4.8L_ABOVE_PEER_BENCHMARK',
      }),
    })
    .onConflictDoUpdate({
      target: customerScores.customerId,
      set: {
        coreScore: 88,
        financialHealthScore: 92,
        creditRiskScore: 86,
        engagementScore: 90,
        calculationDate: '2026-09-09',
        factors: JSON.stringify({
          productDepth: '6_ACTIVE_PRODUCTS_HIGH_DIVERSITY',
          relationshipValue: '₹42.8L_STABLE_ASSET_LIABILITY_MIX',
          engagement: 'DAILY_MOBILE_AND_AUTO_CLEARING',
          repaymentTrackRecord: 'PRISTINE_ZERO_BOUNCE_12_CYCLES',
          averageMonthlyBalance: '₹4.8L_ABOVE_PEER_BENCHMARK',
        }),
      },
    });

  // Audit log
  await db.insert(auditLogs).values({
    actorId: userAditya.employeeId,
    actorName: userAditya.name,
    action: 'PHASE_5_DATABASE_ENRICHMENT',
    resourceType: 'FINANCIAL_RELATIONSHIP_ENGINE',
    resourceId: 'PROD-COREVIA-P5',
    requestId: `REQ-P5-${Date.now()}`,
    outcome: 'SUCCESS',
    metadata: JSON.stringify({
      productsCount: productsList.length,
      accountsCount: accountsList.length,
      loansCount: loansList.length,
      repaymentsCount: repaymentsList.length,
      customerProductsCount: customerProductsList.length,
    }),
  });

  console.log('--- COREvia Phase 5 Seeding Finished Successfully ---');
}

if (process.argv[1]?.endsWith('seed_phase5.ts')) {
  seedPhase5Data()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Phase 5 seeding error:', err);
      process.exit(1);
    });
}
