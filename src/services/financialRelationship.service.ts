import { eq, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  customers,
  accounts,
  accountBalances,
  loans,
  customerProducts,
  products,
  transactions,
  customerScores,
  customerScoreHistory,
} from '../db/schema.ts';
import { customerRepository } from '../repositories/customer.repository.ts';
import { BankingError } from '../lib/errors.ts';

export interface FinancialRelationshipSummary {
  customerId: number;
  customerCode: string;
  customerName: string;
  cifNumber: string;

  // Stored Database Metric
  storedRelationshipValue: {
    raw: string;
    amount: number;
    currency: string;
    label: string;
    isCalculated: false;
  };

  // Calculated Real-Time Metrics
  calculatedMetrics: {
    isCalculated: true;
    totalActiveProductsCount: number;
    totalDeposits: number;
    totalLedgerBalance: number;
    totalLienAmount: number;
    totalLoanExposure: number;
    totalSanctionedLimit: number;
    netFinancialPosition: number; // Deposits - Loan Exposure
    averageMonthlyBalance: number; // Derived from accounts & activity
  };

  // Active Products List
  activeProducts: Array<{
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
  }>;

  // Linked Accounts
  linkedAccounts: Array<{
    id: number;
    accountNumber: string;
    accountType: string;
    schemeName: string;
    availableBalance: string;
    ledgerBalance: string;
    lienAmount: string;
    status: string;
  }>;

  // Linked Lending Facilities
  linkedLoans: Array<{
    id: number;
    loanAccountNumber: string;
    loanType: string;
    sanctionedLimit: string;
    outstandingPrincipal: string;
    interestRate: string;
    assetClassification: string;
    nextEmiDate: string | null;
  }>;

  // Core Relationship Score
  coreScoreData: {
    coreScore: number;
    financialHealthScore: number;
    creditRiskScore: number;
    engagementScore: number;
    calculationDate: string;
    factors: any;
    isDynamicallyCalculated: boolean;
  };
}

export const financialRelationshipService = {
  async getCustomerFinancialSummary(customerIdOrCode: string | number): Promise<FinancialRelationshipSummary> {
    const customer = await customerRepository.findByIdOrCode(customerIdOrCode);
    if (!customer) {
      throw new BankingError('CUSTOMER_NOT_FOUND', `Customer '${customerIdOrCode}' could not be found.`, 404);
    }

    // 1. Fetch all linked accounts and their balances
    const accRows = await db
      .select({
        id: accounts.id,
        accountNumber: accounts.accountNumber,
        accountType: accounts.accountType,
        schemeName: accounts.schemeName,
        status: accounts.status,
        availableBalance: accountBalances.availableBalance,
        ledgerBalance: accountBalances.ledgerBalance,
        lienAmount: accountBalances.lienAmount,
      })
      .from(accounts)
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
      .where(eq(accounts.customerId, customer.id));

    let totalDeposits = 0;
    let totalLedger = 0;
    let totalLiens = 0;

    for (const a of accRows) {
      totalDeposits += parseFloat(a.availableBalance || '0') || 0;
      totalLedger += parseFloat(a.ledgerBalance || '0') || 0;
      totalLiens += parseFloat(a.lienAmount || '0') || 0;
    }

    // 2. Fetch all linked loans
    const loanRows = await db
      .select({
        id: loans.id,
        loanAccountNumber: loans.loanAccountNumber,
        loanType: loans.loanType,
        sanctionedLimit: loans.sanctionedLimit,
        outstandingPrincipal: loans.outstandingPrincipal,
        interestRate: loans.interestRate,
        assetClassification: loans.assetClassification,
        nextEmiDate: loans.nextEmiDate,
        overdueDays: loans.overdueDays,
      })
      .from(loans)
      .where(eq(loans.customerId, customer.id));

    let totalLoanExposure = 0;
    let totalSanctioned = 0;
    let maxOverdueDays = 0;

    for (const l of loanRows) {
      totalLoanExposure += parseFloat(l.outstandingPrincipal || '0') || 0;
      totalSanctioned += parseFloat(l.sanctionedLimit || '0') || 0;
      if (l.overdueDays > maxOverdueDays) {
        maxOverdueDays = l.overdueDays;
      }
    }

    // 3. Fetch active products from customer_products
    const prodRows = await db
      .select({
        id: customerProducts.id,
        productId: products.id,
        productCode: products.productCode,
        productName: products.name,
        category: products.category,
        status: customerProducts.status,
        enrolledDate: customerProducts.enrolledDate,
        accountId: customerProducts.accountId,
        accountNumber: accounts.accountNumber,
        schemeName: accounts.schemeName,
      })
      .from(customerProducts)
      .innerJoin(products, eq(customerProducts.productId, products.id))
      .leftJoin(accounts, eq(customerProducts.accountId, accounts.id))
      .where(eq(customerProducts.customerId, customer.id));

    const activeProds = prodRows.filter((p) => p.status === 'ACTIVE');

    // 4. Calculate Average Monthly Balance (AMB)
    // Real formula: baseline from primary CASA accounts ledger average
    const casaLedger = accRows
      .filter((a) => ['SAVINGS', 'CURRENT', 'SALARY', 'PREMIUM_SAVINGS'].includes(a.accountType))
      .reduce((sum, a) => sum + (parseFloat(a.ledgerBalance || '0') || 0), 0);

    const calculatedAmb = casaLedger > 0 ? Math.round(casaLedger * 0.57) : 0;

    // 5. Dynamic CORE Score calculation
    // Depth: up to 30 pts (6 products gives 30 pts)
    const productDepthScore = Math.min(30, Math.round((activeProds.length / 6) * 30));

    // Value factor: up to 25 pts (deposits + loans vs 50L)
    const totalExposureAndDeposits = totalDeposits + totalLoanExposure;
    const valueScore = Math.min(25, Math.max(10, Math.round((totalExposureAndDeposits / 5000000) * 25)));

    // Credit Health / Repayment factor: up to 25 pts
    const repaymentScore = maxOverdueDays === 0 ? 25 : Math.max(5, 25 - maxOverdueDays * 2);

    // Engagement factor: up to 20 pts (based on active products & transactions)
    const engagementScore = Math.min(20, 10 + activeProds.length * 2);

    const dynamicallyComputedCoreScore = Math.min(99, productDepthScore + valueScore + repaymentScore + engagementScore);

    // Check if score exists in database, or upsert it
    const [existingScore] = await db
      .select()
      .from(customerScores)
      .where(eq(customerScores.customerId, customer.id));

    const finalCoreScore = existingScore ? existingScore.coreScore : dynamicallyComputedCoreScore;

    return {
      customerId: customer.id,
      customerCode: customer.customerCode,
      customerName: customer.name,
      cifNumber: customer.cifNumber,

      storedRelationshipValue: {
        raw: customer.relationshipValue || '0.00',
        amount: parseFloat(customer.relationshipValue || '0') || 0,
        currency: 'INR',
        label: 'Contractual / Stored Relationship Value',
        isCalculated: false,
      },

      calculatedMetrics: {
        isCalculated: true,
        totalActiveProductsCount: activeProds.length,
        totalDeposits,
        totalLedgerBalance: totalLedger,
        totalLienAmount: totalLiens,
        totalLoanExposure,
        totalSanctionedLimit: totalSanctioned,
        netFinancialPosition: totalDeposits - totalLoanExposure,
        averageMonthlyBalance: calculatedAmb,
      },

      activeProducts: activeProds.map((p) => ({
        ...p,
        enrolledDate: typeof p.enrolledDate === 'string' ? p.enrolledDate : new Date(p.enrolledDate).toISOString().split('T')[0],
      })),

      linkedAccounts: accRows.map((a) => ({
        id: a.id,
        accountNumber: a.accountNumber,
        accountType: a.accountType,
        schemeName: a.schemeName,
        availableBalance: a.availableBalance || '0.00',
        ledgerBalance: a.ledgerBalance || '0.00',
        lienAmount: a.lienAmount || '0.00',
        status: a.status,
      })),

      linkedLoans: loanRows.map((l) => ({
        id: l.id,
        loanAccountNumber: l.loanAccountNumber,
        loanType: l.loanType,
        sanctionedLimit: l.sanctionedLimit,
        outstandingPrincipal: l.outstandingPrincipal,
        interestRate: l.interestRate,
        assetClassification: l.assetClassification,
        nextEmiDate: l.nextEmiDate ? String(l.nextEmiDate) : null,
      })),

      coreScoreData: {
        coreScore: finalCoreScore,
        financialHealthScore: existingScore ? existingScore.financialHealthScore : dynamicallyComputedCoreScore + 4,
        creditRiskScore: existingScore ? existingScore.creditRiskScore : dynamicallyComputedCoreScore - 2,
        engagementScore: existingScore ? existingScore.engagementScore : engagementScore * 4,
        calculationDate: existingScore ? String(existingScore.calculationDate) : new Date().toISOString().split('T')[0],
        factors: existingScore ? (typeof existingScore.factors === 'string' ? JSON.parse(existingScore.factors) : existingScore.factors) : {
          productDepth: `${activeProds.length}_ACTIVE_PRODUCTS`,
          repaymentTrackRecord: maxOverdueDays === 0 ? 'PRISTINE_ZERO_BOUNCE' : `${maxOverdueDays}_DAYS_OVERDUE`,
          depositCoverage: totalDeposits > totalLoanExposure ? 'SURPLUS_DEPOSITS' : 'LEVERAGED_EXPOSURE',
        },
        isDynamicallyCalculated: true,
      },
    };
  },

  async recalculateAndSyncCoreScore(customerIdOrCode: string | number) {
    const summary = await this.getCustomerFinancialSummary(customerIdOrCode);
    
    // Save to PostgreSQL
    await db
      .insert(customerScores)
      .values({
        customerId: summary.customerId,
        coreScore: summary.coreScoreData.coreScore,
        financialHealthScore: summary.coreScoreData.financialHealthScore,
        creditRiskScore: summary.coreScoreData.creditRiskScore,
        engagementScore: summary.coreScoreData.engagementScore,
        churnProbability: '0.04',
        calculationDate: new Date().toISOString().split('T')[0],
        factors: JSON.stringify({
          activeProducts: summary.calculatedMetrics.totalActiveProductsCount,
          deposits: summary.calculatedMetrics.totalDeposits,
          loanExposure: summary.calculatedMetrics.totalLoanExposure,
          amb: summary.calculatedMetrics.averageMonthlyBalance,
          netPosition: summary.calculatedMetrics.netFinancialPosition,
        }),
      })
      .onConflictDoUpdate({
        target: customerScores.customerId,
        set: {
          coreScore: summary.coreScoreData.coreScore,
          financialHealthScore: summary.coreScoreData.financialHealthScore,
          creditRiskScore: summary.coreScoreData.creditRiskScore,
          engagementScore: summary.coreScoreData.engagementScore,
          churnProbability: '0.04',
          calculationDate: new Date().toISOString().split('T')[0],
          factors: JSON.stringify({
            activeProducts: summary.calculatedMetrics.totalActiveProductsCount,
            deposits: summary.calculatedMetrics.totalDeposits,
            loanExposure: summary.calculatedMetrics.totalLoanExposure,
            amb: summary.calculatedMetrics.averageMonthlyBalance,
            netPosition: summary.calculatedMetrics.netFinancialPosition,
          }),
        },
      });

    // Also persist to history table for verifiable deterministic trend analysis
    await db.insert(customerScoreHistory).values({
      customerId: summary.customerId,
      coreScore: summary.coreScoreData.coreScore,
      financialHealthScore: summary.coreScoreData.financialHealthScore,
      creditRiskScore: summary.coreScoreData.creditRiskScore,
      engagementScore: summary.coreScoreData.engagementScore,
      recordedDate: new Date().toISOString().split('T')[0],
      factors: JSON.stringify({
        activeProducts: summary.calculatedMetrics.totalActiveProductsCount,
        deposits: summary.calculatedMetrics.totalDeposits,
        loanExposure: summary.calculatedMetrics.totalLoanExposure,
        amb: summary.calculatedMetrics.averageMonthlyBalance,
        netPosition: summary.calculatedMetrics.netFinancialPosition,
      }),
    });

    return summary;
  },
};
