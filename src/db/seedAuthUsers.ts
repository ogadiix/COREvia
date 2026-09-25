import bcrypt from 'bcryptjs';
import { db } from './index.ts';
import { users, roles, permissions, rolePermissions } from './schema.ts';
import { eq } from 'drizzle-orm';

export const DEV_TEST_PASSWORD = process.env.DEV_DEFAULT_PASSWORD || 'CoreViaDev#2026!';

export async function seedAuthUsersAndRoles() {
  console.log('[Auth Seed] Initializing Enterprise Roles & Permissions in PostgreSQL...');

  // 1. Enterprise Roles
  const rolesToSeed = [
    { code: 'ADMINISTRATOR', name: 'System Administrator', description: 'Full system administration & governance' },
    { code: 'BRANCH_MANAGER', name: 'Branch Manager', description: 'Branch administration, approval limits & checker authority' },
    { code: 'RELATIONSHIP_MANAGER', name: 'Relationship Manager', description: 'Customer 360 portfolio, cross-sell & credit origination' },
    { code: 'OPERATIONS', name: 'Operations Officer', description: 'Accounts servicing, clearing, and transactions processing' },
    { code: 'SERVICE_AGENT', name: 'Service Agent', description: 'Customer service desk, queries, and ticketing' },
    { code: 'ANALYST', name: 'Credit & Risk Analyst', description: 'Credit scoring, portfolio risk, and regulatory analytics' },
  ];

  for (const r of rolesToSeed) {
    await db.insert(roles).values(r).onConflictDoNothing();
  }

  // 2. Hash default development test password
  const passwordHash = await bcrypt.hash(DEV_TEST_PASSWORD, 10);

  // 3. Enterprise Synthetic Test Users
  const authUsersToSeed = [
    {
      uid: 'USR-EMP-ADM001',
      employeeId: 'EMP-ADM001',
      email: 'admin@corevia.bank.in',
      name: 'Vikramaditya Rao (Admin)',
      passwordHash,
      role: 'ADMINISTRATOR',
      department: 'INFORMATION_SECURITY',
      status: 'ACTIVE',
      isActive: true,
    },
    {
      uid: 'USR-EMP-BM104',
      employeeId: 'EMP-BM104',
      email: 'branch.manager@corevia.bank.in',
      name: 'Aditya Raj (Branch Manager)',
      passwordHash,
      role: 'BRANCH_MANAGER',
      department: 'BRANCH_OPERATIONS',
      status: 'ACTIVE',
      isActive: true,
    },
    {
      uid: 'USR-EMP-RM401',
      employeeId: 'EMP-RM401',
      email: 'rm@corevia.bank.in',
      name: 'Priya Sharma (RM)',
      passwordHash,
      role: 'RELATIONSHIP_MANAGER',
      department: 'CORPORATE_RELATIONSHIPS',
      status: 'ACTIVE',
      isActive: true,
    },
    {
      uid: 'USR-EMP-OPS591',
      employeeId: 'EMP-OPS591',
      email: 'operations@corevia.bank.in',
      name: 'Pooja Iyer (Operations)',
      passwordHash,
      role: 'OPERATIONS',
      department: 'CENTRAL_OPERATIONS',
      status: 'ACTIVE',
      isActive: true,
    },
    {
      uid: 'USR-EMP-SVC302',
      employeeId: 'EMP-SVC302',
      email: 'service.agent@corevia.bank.in',
      name: 'Kiran Deshmukh (Service Desk)',
      passwordHash,
      role: 'SERVICE_AGENT',
      department: 'CUSTOMER_SERVICE',
      status: 'ACTIVE',
      isActive: true,
    },
    {
      uid: 'USR-EMP-ANL771',
      employeeId: 'EMP-ANL771',
      email: 'analyst@corevia.bank.in',
      name: 'Rohit Kulkarni (Analyst)',
      passwordHash,
      role: 'ANALYST',
      department: 'RISK_INTELLIGENCE',
      status: 'ACTIVE',
      isActive: true,
    },
    // Test accounts for negative testing (Inactive & Suspended)
    {
      uid: 'USR-EMP-INACT99',
      employeeId: 'EMP-INACT99',
      email: 'inactive.user@corevia.bank.in',
      name: 'Suresh Mehta (Inactive)',
      passwordHash,
      role: 'SERVICE_AGENT',
      department: 'RETAIL_SUPPORT',
      status: 'INACTIVE',
      isActive: false,
    },
    {
      uid: 'USR-EMP-SUSP88',
      employeeId: 'EMP-SUSP88',
      email: 'suspended.user@corevia.bank.in',
      name: 'Anand Verma (Suspended)',
      passwordHash,
      role: 'OPERATIONS',
      department: 'CLEARING_OPERATIONS',
      status: 'SUSPENDED',
      isActive: false,
    },
  ];

  for (const u of authUsersToSeed) {
    const existing = await db.select().from(users).where(eq(users.email, u.email)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values(u);
    } else {
      await db
        .update(users)
        .set({
          passwordHash: u.passwordHash,
          status: u.status,
          role: u.role,
          isActive: u.isActive,
          name: u.name,
        })
        .where(eq(users.id, existing[0].id));
    }
  }

  // Also update existing users with password hashes so their existing data remains fully accessible
  const existingUsers = await db.select().from(users);
  for (const u of existingUsers) {
    if (!u.passwordHash) {
      await db.update(users).set({ passwordHash, status: 'ACTIVE' }).where(eq(users.id, u.id));
    }
  }

  console.log('[Auth Seed] Successfully seeded enterprise users and roles.');
}
