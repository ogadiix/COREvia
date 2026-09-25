import { eq, ilike, or, desc, and, isNull } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  customers,
  customerAddresses,
  customerContacts,
  accounts,
  accountBalances,
  loans,
  interactions,
  serviceCases,
  tasks,
  opportunities,
  customerScores,
  customerInsights,
  customerProducts,
  products,
} from '../db/schema.ts';

export interface CustomerFilterParams {
  search?: string;
  riskCategory?: string;
  status?: string;
  rmId?: number;
  page?: number;
  limit?: number;
}

export const customerRepository = {
  async findMany(params: CustomerFilterParams = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions = [];

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(customers.name, term),
          ilike(customers.customerCode, term),
          ilike(customers.cifNumber, term),
          ilike(customers.panNumber, term)
        )
      );
    }

    if (params.riskCategory) {
      conditions.push(eq(customers.riskCategory, params.riskCategory.toUpperCase()));
    }

    if (params.status) {
      conditions.push(eq(customers.status, params.status.toUpperCase()));
    }
    
    if (params.rmId) {
      conditions.push(eq(customers.assignedRmId, params.rmId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.relationshipValue))
      .limit(limit)
      .offset(offset);

    // Get total count
    const all = await db.select({ id: customers.id }).from(customers).where(whereClause);

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total: all.length,
        totalPages: Math.ceil(all.length / limit),
      },
    };
  },

  async findByIdOrCode(idOrCode: string | number) {
    if (typeof idOrCode === 'number' || !isNaN(Number(idOrCode))) {
      const id = Number(idOrCode);
      const [record] = await db.select().from(customers).where(eq(customers.id, id));
      if (record) return record;
    }

    const [byCode] = await db
      .select()
      .from(customers)
      .where(
        or(
          eq(customers.customerCode, String(idOrCode)),
          eq(customers.cifNumber, String(idOrCode))
        )
      );
    return byCode || null;
  },

  async getCustomer360(customerId: number) {
    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
    if (!customer) return null;

    const [
      addresses,
      contacts,
      accountsList,
      loansList,
      interactionsList,
      casesList,
      tasksList,
      opportunitiesList,
      scoreRecord,
      insightsList,
      customerProductsList,
    ] = await Promise.all([
      db.select().from(customerAddresses).where(eq(customerAddresses.customerId, customerId)),
      db.select().from(customerContacts).where(eq(customerContacts.customerId, customerId)),
      db
        .select({
          account: accounts,
          balance: accountBalances,
        })
        .from(accounts)
        .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
        .where(eq(accounts.customerId, customerId)),
      db.select().from(loans).where(eq(loans.customerId, customerId)),
      db
        .select()
        .from(interactions)
        .where(and(eq(interactions.customerId, customerId), isNull(interactions.deletedAt)))
        .orderBy(desc(interactions.timestamp))
        .limit(20),
      db
        .select()
        .from(serviceCases)
        .where(eq(serviceCases.customerId, customerId))
        .orderBy(desc(serviceCases.createdAt)),
      db
        .select()
        .from(tasks)
        .where(eq(tasks.customerId, customerId))
        .orderBy(desc(tasks.dueDate)),
      db
        .select()
        .from(opportunities)
        .where(eq(opportunities.customerId, customerId))
        .orderBy(desc(opportunities.createdAt)),
      db.select().from(customerScores).where(eq(customerScores.customerId, customerId)),
      db
        .select()
        .from(customerInsights)
        .where(eq(customerInsights.customerId, customerId))
        .orderBy(desc(customerInsights.createdAt)),
      db
        .select({
          customerProduct: customerProducts,
          product: products,
        })
        .from(customerProducts)
        .innerJoin(products, eq(customerProducts.productId, products.id))
        .where(eq(customerProducts.customerId, customerId)),
    ]);

    return {
      customer,
      addresses,
      contacts,
      accounts: accountsList.map((item) => ({
        ...item.account,
        balance: item.balance || {
          availableBalance: '0.00',
          ledgerBalance: '0.00',
          lienAmount: '0.00',
          unclearBalance: '0.00',
        },
      })),
      loans: loansList,
      interactions: interactionsList,
      cases: casesList,
      tasks: tasksList,
      opportunities: opportunitiesList,
      score: scoreRecord[0] || null,
      insights: insightsList.map((ins) => ({
        ...ins,
        evidence: (() => {
          try {
            return ins.evidence ? JSON.parse(ins.evidence) : [];
          } catch {
            return [];
          }
        })(),
      })),
      products: customerProductsList.map((cp) => ({
        ...cp.product,
        enrolledDate: cp.customerProduct.enrolledDate,
        status: cp.customerProduct.status,
      })),
    };
  },

  async getCustomerAccounts(customerId: number) {
    const list = await db
      .select({
        account: accounts,
        balance: accountBalances,
      })
      .from(accounts)
      .leftJoin(accountBalances, eq(accounts.id, accountBalances.accountId))
      .where(eq(accounts.customerId, customerId));

    return list.map((item) => ({
      ...item.account,
      balance: item.balance || {
        availableBalance: '0.00',
        ledgerBalance: '0.00',
        lienAmount: '0.00',
      },
    }));
  },

  async getCustomerLoans(customerId: number) {
    return await db.select().from(loans).where(eq(loans.customerId, customerId));
  },

  async getCustomerInteractions(customerId: number) {
    return await db
      .select()
      .from(interactions)
      .where(and(eq(interactions.customerId, customerId), isNull(interactions.deletedAt)))
      .orderBy(desc(interactions.timestamp));
  },

  async getCustomerCases(customerId: number) {
    return await db
      .select()
      .from(serviceCases)
      .where(eq(serviceCases.customerId, customerId))
      .orderBy(desc(serviceCases.createdAt));
  },

  async getCustomerOpportunities(customerId: number) {
    return await db
      .select()
      .from(opportunities)
      .where(eq(opportunities.customerId, customerId))
      .orderBy(desc(opportunities.createdAt));
  },

  async getCustomerScore(customerId: number) {
    const [record] = await db
      .select()
      .from(customerScores)
      .where(eq(customerScores.customerId, customerId));
    return record || null;
  },

  async getCustomerInsights(customerId: number) {
    return await db
      .select()
      .from(customerInsights)
      .where(eq(customerInsights.customerId, customerId))
      .orderBy(desc(customerInsights.createdAt));
  },
};
