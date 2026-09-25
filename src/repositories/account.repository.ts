import { eq, ilike, or, desc, asc, and, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  accounts,
  accountBalances,
  customers,
  transactions,
} from '../db/schema.ts';

export interface AccountFilterParams {
  search?: string;
  accountType?: string;
  status?: string;
  branchCode?: string;
  customerId?: number;
  page?: number;
  limit?: number;
  sortBy?: 'accountNumber' | 'openDate' | 'balance' | 'customerName';
  sortOrder?: 'asc' | 'desc';
}

export function maskAccountNumber(accNum: string): string {
  if (!accNum || accNum.length < 4) return '****';
  return `****${accNum.slice(-4)}`;
}

export const accountRepository = {
  async findMany(params: AccountFilterParams = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(accounts.accountNumber, term),
          ilike(customers.name, term),
          ilike(customers.cifNumber, term),
          ilike(customers.panNumber, term),
          ilike(accounts.schemeName, term)
        )
      );
    }

    if (params.accountType && params.accountType !== 'ALL') {
      conditions.push(eq(accounts.accountType, params.accountType));
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(accounts.status, params.status));
    }

    if (params.branchCode && params.branchCode !== 'ALL') {
      conditions.push(eq(accounts.branchCode, params.branchCode));
    }

    if (params.customerId) {
      conditions.push(eq(accounts.customerId, params.customerId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(accounts)
      .innerJoin(customers, eq(accounts.customerId, customers.id))
      .where(whereClause);

    const total = countResult?.count || 0;

    // Fetch accounts with join to balances and customer
    const rows = await db
      .select({
        id: accounts.id,
        accountNumber: accounts.accountNumber,
        accountType: accounts.accountType,
        schemeCode: accounts.schemeCode,
        schemeName: accounts.schemeName,
        currency: accounts.currency,
        interestRate: accounts.interestRate,
        status: accounts.status,
        branchCode: accounts.branchCode,
        branchName: accounts.branchName,
        ifscCode: accounts.ifscCode,
        openDate: accounts.openDate,
        customerId: accounts.customerId,
        customerName: customers.name,
        customerCode: customers.customerCode,
        cifNumber: customers.cifNumber,
        panNumber: customers.panNumber,
        availableBalance: accountBalances.availableBalance,
        ledgerBalance: accountBalances.ledgerBalance,
        lienAmount: accountBalances.lienAmount,
        unclearBalance: accountBalances.unclearBalance,
        asOfDate: accountBalances.asOfDate,
      })
      .from(accounts)
      .innerJoin(customers, eq(accounts.customerId, customers.id))
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
      .where(whereClause)
      .orderBy(desc(accounts.openDate))
      .limit(limit)
      .offset(offset);

    // Also get last activity date for each account
    const accountIds = rows.map((r) => r.id);
    let latestActivityMap: Record<number, string> = {};

    if (accountIds.length > 0) {
      const latestTxns = await db
        .select({
          accountId: transactions.accountId,
          maxTimestamp: sql<string>`max(${transactions.timestamp})`,
        })
        .from(transactions)
        .where(sql`${transactions.accountId} IN (${sql.join(accountIds, sql`, `)})`)
        .groupBy(transactions.accountId);

      for (const t of latestTxns) {
        latestActivityMap[t.accountId] = t.maxTimestamp;
      }
    }

    const sanitizedRows = rows.map((r) => ({
      ...r,
      maskedAccountNumber: maskAccountNumber(r.accountNumber),
      availableBalance: r.availableBalance || '0.00',
      ledgerBalance: r.ledgerBalance || '0.00',
      lienAmount: r.lienAmount || '0.00',
      lastActivityDate: latestActivityMap[r.id] || r.openDate,
    }));

    return {
      data: sanitizedRows,
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
        id: accounts.id,
        accountNumber: accounts.accountNumber,
        accountType: accounts.accountType,
        schemeCode: accounts.schemeCode,
        schemeName: accounts.schemeName,
        currency: accounts.currency,
        interestRate: accounts.interestRate,
        status: accounts.status,
        branchCode: accounts.branchCode,
        branchName: accounts.branchName,
        ifscCode: accounts.ifscCode,
        openDate: accounts.openDate,
        customerId: accounts.customerId,
        customerName: customers.name,
        customerCode: customers.customerCode,
        cifNumber: customers.cifNumber,
        panNumber: customers.panNumber,
        nomineeName: accounts.nomineeName,
        nomineeRelation: accounts.nomineeRelation,
        availableBalance: accountBalances.availableBalance,
        ledgerBalance: accountBalances.ledgerBalance,
        lienAmount: accountBalances.lienAmount,
        unclearBalance: accountBalances.unclearBalance,
        asOfDate: accountBalances.asOfDate,
      })
      .from(accounts)
      .innerJoin(customers, eq(accounts.customerId, customers.id))
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
      .where(eq(accounts.id, id));

    if (!row) return null;

    // Get latest activity
    const [latestTxn] = await db
      .select({ maxTimestamp: sql<string>`max(${transactions.timestamp})` })
      .from(transactions)
      .where(eq(transactions.accountId, id));

    return {
      ...row,
      maskedAccountNumber: maskAccountNumber(row.accountNumber),
      availableBalance: row.availableBalance || '0.00',
      ledgerBalance: row.ledgerBalance || '0.00',
      lienAmount: row.lienAmount || '0.00',
      lastActivityDate: latestTxn?.maxTimestamp || row.openDate,
    };
  },

  async findByAccountNumber(accountNumber: string) {
    const [row] = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.accountNumber, accountNumber));
    if (!row) return null;
    return this.findById(row.id);
  },

  async getAccountTransactions(
    accountId: number,
    params: { page?: number; limit?: number; type?: string; status?: string } = {}
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(params.limit) || 10)); // Never load unlimited history
    const offset = (page - 1) * limit;

    const conditions = [eq(transactions.accountId, accountId)];

    if (params.type && params.type !== 'ALL') {
      conditions.push(eq(transactions.txnType, params.type));
    }

    if (params.status && params.status !== 'ALL') {
      conditions.push(eq(transactions.status, params.status));
    }

    const whereClause = and(...conditions);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactions)
      .where(whereClause);

    const total = countResult?.count || 0;

    const rows = await db
      .select({
        id: transactions.id,
        transactionId: transactions.transactionId,
        utrNumber: transactions.utrNumber,
        txnType: transactions.txnType,
        rail: transactions.rail,
        amount: transactions.amount,
        balanceAfter: transactions.balanceAfter,
        counterpartyAccount: transactions.counterpartyAccount,
        counterpartyName: transactions.counterpartyName,
        counterpartyIfsc: transactions.counterpartyIfsc,
        narration: transactions.narration,
        status: transactions.status,
        timestamp: transactions.timestamp,
      })
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.timestamp))
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

  async getSummaryStats() {
    const rows = await db
      .select({
        accountType: accounts.accountType,
        status: accounts.status,
        availableBalance: accountBalances.availableBalance,
        ledgerBalance: accountBalances.ledgerBalance,
        lienAmount: accountBalances.lienAmount,
      })
      .from(accounts)
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId));

    let totalCasa = 0;
    let totalTermDeposits = 0;
    let totalLiens = 0;
    let frozenCount = 0;
    let totalAccounts = rows.length;

    for (const r of rows) {
      const avail = parseFloat(r.availableBalance || '0') || 0;
      const lien = parseFloat(r.lienAmount || '0') || 0;
      totalLiens += lien;

      if (['SAVINGS', 'CURRENT', 'SALARY', 'PREMIUM_SAVINGS'].includes(r.accountType)) {
        totalCasa += avail;
      } else if (['FIXED_DEPOSIT', 'RECURRING_DEPOSIT'].includes(r.accountType)) {
        totalTermDeposits += avail;
      }

      if (['DEBIT_FREEZE', 'TOTAL_FREEZE', 'DORMANT'].includes(r.status)) {
        frozenCount++;
      }
    }

    return {
      totalCasaDeposits: totalCasa,
      totalTermDeposits,
      totalLiensMarked: totalLiens,
      frozenAccountsCount: frozenCount,
      totalAccountsCount: totalAccounts,
    };
  },
};
