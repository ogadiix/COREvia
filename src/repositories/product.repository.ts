import { eq, ilike, or, and, sql } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  products,
  customerProducts,
  customers,
  accounts,
} from '../db/schema.ts';

export interface ProductFilterParams {
  search?: string;
  category?: string;
  isActive?: boolean;
}

export const productRepository = {
  async findMany(params: ProductFilterParams = {}) {
    const conditions = [];

    if (params.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      conditions.push(
        or(
          ilike(products.name, term),
          ilike(products.productCode, term),
          ilike(products.category, term),
          ilike(products.description, term)
        )
      );
    }

    if (params.category && params.category !== 'ALL') {
      conditions.push(eq(products.category, params.category));
    }

    if (params.isActive !== undefined) {
      conditions.push(eq(products.isActive, params.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get products with customer enrollment count
    const rows = await db
      .select({
        id: products.id,
        productCode: products.productCode,
        category: products.category,
        name: products.name,
        description: products.description,
        eligibility: products.eligibility,
        interestRateRange: products.interestRateRange,
        minBalance: products.minBalance,
        features: products.features,
        isActive: products.isActive,
        createdAt: products.createdAt,
      })
      .from(products)
      .where(whereClause)
      .orderBy(products.category, products.name);

    // Get active customer counts per product
    const counts = await db
      .select({
        productId: customerProducts.productId,
        customerCount: sql<number>`count(distinct ${customerProducts.customerId})::int`,
      })
      .from(customerProducts)
      .where(eq(customerProducts.status, 'ACTIVE'))
      .groupBy(customerProducts.productId);

    const countMap: Record<number, number> = {};
    for (const c of counts) {
      countMap[c.productId] = c.customerCount;
    }

    return rows.map((r) => ({
      ...r,
      customerCount: countMap[r.id] || 0,
    }));
  },

  async findById(id: number) {
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));

    if (!row) return null;

    const [enrollmentCount] = await db
      .select({
        count: sql<number>`count(distinct ${customerProducts.customerId})::int`,
      })
      .from(customerProducts)
      .where(and(eq(customerProducts.productId, id), eq(customerProducts.status, 'ACTIVE')));

    return {
      ...row,
      customerCount: enrollmentCount?.count || 0,
    };
  },

  async findByCode(code: string) {
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.productCode, code));
    if (!row) return null;
    return this.findById(row.id);
  },

  async getCustomerProducts(customerId: number) {
    const rows = await db
      .select({
        id: customerProducts.id,
        status: customerProducts.status,
        enrolledDate: customerProducts.enrolledDate,
        createdAt: customerProducts.createdAt,
        productId: products.id,
        productCode: products.productCode,
        category: products.category,
        productName: products.name,
        description: products.description,
        eligibility: products.eligibility,
        interestRateRange: products.interestRateRange,
        minBalance: products.minBalance,
        features: products.features,
        accountId: customerProducts.accountId,
        accountNumber: accounts.accountNumber,
        accountType: accounts.accountType,
        schemeName: accounts.schemeName,
      })
      .from(customerProducts)
      .innerJoin(products, eq(customerProducts.productId, products.id))
      .leftJoin(accounts, eq(customerProducts.accountId, accounts.id))
      .where(eq(customerProducts.customerId, customerId))
      .orderBy(customerProducts.enrolledDate);

    return rows;
  },

  async enrollCustomerProduct(customerId: number, productId: number, accountId?: number) {
    const [enrolled] = await db
      .insert(customerProducts)
      .values({
        customerId,
        productId,
        accountId: accountId || null,
        status: 'ACTIVE',
        enrolledDate: new Date().toISOString().split('T')[0],
      })
      .returning();
    return enrolled;
  },
};
