import { eq, ilike, or, desc, and, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  loans,
  loanRepayments,
  customers,
  users,
} from '../db/schema.ts';

export interface LoanFilterParams {
  search?: string;
  loanType?: string;
  assetClassification?: string;
  customerId?: number;
  rmId?: number;
  page?: number;
  limit?: number;
  sortBy?: 'loanAccountNumber' | 'sanctionDate' | 'outstandingPrincipal';
  sortOrder?: 'asc' | 'desc';
}

export const loanRepository = {
  async findMany(params: LoanFilterParams = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(loans.loanAccountNumber, term),
          ilike(customers.name, term),
          ilike(customers.cifNumber, term),
          ilike(loans.loanType, term),
          ilike(loans.collateralType, term)
        )
      );
    }

    if (params.loanType && params.loanType !== 'ALL') {
      conditions.push(eq(loans.loanType, params.loanType));
    }

    if (params.assetClassification && params.assetClassification !== 'ALL') {
      conditions.push(eq(loans.assetClassification, params.assetClassification));
    }

    if (params.customerId) {
      conditions.push(eq(loans.customerId, params.customerId));
    }

    if (params.rmId) {
      conditions.push(eq(loans.relationshipManagerId, params.rmId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loans)
      .innerJoin(customers, eq(loans.customerId, customers.id))
      .where(whereClause);

    const total = countResult?.count || 0;

    const rows = await db
      .select({
        id: loans.id,
        loanAccountNumber: loans.loanAccountNumber,
        loanType: loans.loanType,
        sanctionedLimit: loans.sanctionedLimit,
        drawingPower: loans.drawingPower,
        outstandingPrincipal: loans.outstandingPrincipal,
        interestDue: loans.interestDue,
        interestRate: loans.interestRate,
        benchmarkRate: loans.benchmarkRate,
        tenureMonths: loans.tenureMonths,
        sanctionDate: loans.sanctionDate,
        maturityDate: loans.maturityDate,
        nextEmiDate: loans.nextEmiDate,
        emiAmount: loans.emiAmount,
        overdueDays: loans.overdueDays,
        assetClassification: loans.assetClassification,
        collateralType: loans.collateralType,
        collateralValue: loans.collateralValue,
        hypothecationDetails: loans.hypothecationDetails,
        prioritySector: loans.prioritySector,
        provisionAmount: loans.provisionAmount,
        customerId: loans.customerId,
        customerName: customers.name,
        customerCode: customers.customerCode,
        cifNumber: customers.cifNumber,
        panNumber: customers.panNumber,
        relationshipManagerId: loans.relationshipManagerId,
        rmName: users.name,
        rmEmail: users.email,
      })
      .from(loans)
      .innerJoin(customers, eq(loans.customerId, customers.id))
      .leftJoin(users, eq(loans.relationshipManagerId, users.id))
      .where(whereClause)
      .orderBy(desc(loans.sanctionDate))
      .limit(limit)
      .offset(offset);

    return {
      data: rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async findById(id: number) {
    const [row] = await db
      .select({
        id: loans.id,
        loanAccountNumber: loans.loanAccountNumber,
        loanType: loans.loanType,
        sanctionedLimit: loans.sanctionedLimit,
        drawingPower: loans.drawingPower,
        outstandingPrincipal: loans.outstandingPrincipal,
        interestDue: loans.interestDue,
        interestRate: loans.interestRate,
        benchmarkRate: loans.benchmarkRate,
        tenureMonths: loans.tenureMonths,
        sanctionDate: loans.sanctionDate,
        maturityDate: loans.maturityDate,
        nextEmiDate: loans.nextEmiDate,
        emiAmount: loans.emiAmount,
        overdueDays: loans.overdueDays,
        assetClassification: loans.assetClassification,
        collateralType: loans.collateralType,
        collateralValue: loans.collateralValue,
        hypothecationDetails: loans.hypothecationDetails,
        prioritySector: loans.prioritySector,
        provisionAmount: loans.provisionAmount,
        customerId: loans.customerId,
        customerName: customers.name,
        customerCode: customers.customerCode,
        cifNumber: customers.cifNumber,
        panNumber: customers.panNumber,
        relationshipManagerId: loans.relationshipManagerId,
        rmName: users.name,
        rmEmail: users.email,
      })
      .from(loans)
      .innerJoin(customers, eq(loans.customerId, customers.id))
      .leftJoin(users, eq(loans.relationshipManagerId, users.id))
      .where(eq(loans.id, id));

    return row || null;
  },

  async findByAccountNumber(loanAccountNumber: string) {
    const [row] = await db
      .select({ id: loans.id })
      .from(loans)
      .where(eq(loans.loanAccountNumber, loanAccountNumber));
    if (!row) return null;
    return this.findById(row.id);
  },

  async getLoanRepayments(loanId: number, params: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 12));
    const offset = (page - 1) * limit;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(loanRepayments)
      .where(eq(loanRepayments.loanId, loanId));

    const total = countResult?.count || 0;

    const rows = await db
      .select()
      .from(loanRepayments)
      .where(eq(loanRepayments.loanId, loanId))
      .orderBy(desc(loanRepayments.installmentNumber))
      .limit(limit)
      .offset(offset);

    // Repayment aggregates
    const [totals] = await db
      .select({
        totalPrincipalPaid: sql<string>`coalesce(sum(${loanRepayments.principalPaid}), 0)::text`,
        totalInterestPaid: sql<string>`coalesce(sum(${loanRepayments.interestPaid}), 0)::text`,
        totalInstallmentsPaid: sql<number>`count(*)::int`,
      })
      .from(loanRepayments)
      .where(and(eq(loanRepayments.loanId, loanId), eq(loanRepayments.status, 'PAID')));

    return {
      data: rows,
      summary: {
        totalPrincipalPaid: totals?.totalPrincipalPaid || '0.00',
        totalInterestPaid: totals?.totalInterestPaid || '0.00',
        installmentsPaidCount: totals?.totalInstallmentsPaid || 0,
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getSummaryStats() {
    const rows = await db
      .select({
        sanctionedLimit: loans.sanctionedLimit,
        outstandingPrincipal: loans.outstandingPrincipal,
        provisionAmount: loans.provisionAmount,
        assetClassification: loans.assetClassification,
      })
      .from(loans);

    let totalSanctioned = 0;
    let totalOutstanding = 0;
    let totalProvisions = 0;
    let stressedCount = 0;

    for (const r of rows) {
      totalSanctioned += parseFloat(r.sanctionedLimit || '0') || 0;
      totalOutstanding += parseFloat(r.outstandingPrincipal || '0') || 0;
      totalProvisions += parseFloat(r.provisionAmount || '0') || 0;
      if (['SMA_0', 'SMA_1', 'SMA_2', 'SUB_STANDARD', 'DOUBTFUL', 'LOSS'].includes(r.assetClassification)) {
        stressedCount++;
      }
    }

    return {
      totalSanctionedLimit: totalSanctioned,
      totalOutstandingPrincipal: totalOutstanding,
      totalProvisions: totalProvisions,
      stressedLoansCount: stressedCount,
      totalLoansCount: rows.length,
    };
  },
};
