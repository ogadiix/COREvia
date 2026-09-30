/**
 * COREvia Phase 34: Household & Business Group 360 Seed Data
 * Auto-creates relationship_groups and relationship_group_members tables if not present,
 * sets up canonical synthetic groups (HH-10482 and BIZ-10482),
 * and ensures members (Rahul Sharma CUS-10482 and Priya Sharma CUS-10821) exist.
 */

import { db } from './index.ts';
import { sql, eq } from 'drizzle-orm';
import {
  relationshipGroups,
  relationshipGroupMembers,
  customers,
  users,
  customerScores,
  relationshipEdges,
} from './schema.ts';

export async function ensureGroupTablesExist(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS relationship_groups (
      id SERIAL PRIMARY KEY,
      group_id TEXT NOT NULL UNIQUE,
      group_type TEXT NOT NULL,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      primary_customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
      primary_business_id TEXT,
      relationship_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      secondary_rm_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS relationship_group_members (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES relationship_groups(id) ON DELETE CASCADE,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      role TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      ownership_percentage NUMERIC(5, 2),
      is_primary BOOLEAN NOT NULL DEFAULT false,
      valid_from TIMESTAMP,
      valid_to TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON relationship_group_members(group_id);
    CREATE INDEX IF NOT EXISTS idx_group_members_entity ON relationship_group_members(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_groups_rm_id ON relationship_groups(relationship_manager_id);
    CREATE INDEX IF NOT EXISTS idx_groups_status ON relationship_groups(status);
  `);
}

export async function seedGroups(): Promise<void> {
  console.log('[Seed] Ensuring Relationship Group tables exist...');
  await ensureGroupTablesExist();

  // Find demo users
  const allUsers = await db.select().from(users);
  const rmAditya = allUsers.find((u) => u.employeeId === 'EMP-782194') || allUsers[0];
  const rmPooja = allUsers.find((u) => u.employeeId === 'EMP-591024') || allUsers[0];

  // 1. Ensure Rahul Sharma (CUS-10482) exists
  const rahulList = await db
    .select()
    .from(customers)
    .where(eq(customers.customerCode, 'CUS-10482'))
    .limit(1);

  let rahul = rahulList[0];
  if (!rahul) {
    const [insertedRahul] = await db
      .insert(customers)
      .values({
        customerCode: 'CUS-10482',
        cifNumber: 'CIF-1048201',
        name: 'Rahul Sharma',
        entityType: 'INDIVIDUAL',
        panNumber: 'AAAPS1294K',
        riskCategory: 'LOW',
        cibilScore: 785,
        occupationOrSector: 'Software Engineering / IT Executive',
        annualTurnoverOrIncome: '3200000.00',
        relationshipValue: '4280000.00', // ₹42.8L
        onboardingDate: '2021-06-15',
        status: 'ACTIVE',
        assignedRmId: rmAditya.id,
      })
      .returning();
    rahul = insertedRahul;
  }

  // 2. Ensure Priya Sharma (CUS-10821) exists
  const priyaList = await db
    .select()
    .from(customers)
    .where(eq(customers.customerCode, 'CUS-10821'))
    .limit(1);

  let priya = priyaList[0];
  if (!priya) {
    const [insertedPriya] = await db
      .insert(customers)
      .values({
        customerCode: 'CUS-10821',
        cifNumber: 'CIF-1082109',
        name: 'Priya Sharma',
        entityType: 'INDIVIDUAL',
        panNumber: 'BBVPS9821L',
        cKycNumber: 'CKYC-2021-10821',
        aadhaarStatus: 'VERIFIED',
        riskCategory: 'LOW',
        cibilScore: 760,
        occupationOrSector: 'Healthcare Professional & Clinical Consultant',
        annualTurnoverOrIncome: '1800000.00',
        relationshipValue: '1840000.00', // ₹18.4L
        onboardingDate: '2021-09-01',
        kycLastReviewed: '2024-06-10',
        kycNextReviewDue: '2026-06-10',
        status: 'ACTIVE',
        assignedRmId: rmAditya.id,
      })
      .returning();
    priya = insertedPriya;

    // Seed Priya's CORE score (76)
    await db.insert(customerScores).values({
      customerId: priya.id,
      coreScore: 76,
      financialHealthScore: 78,
      creditRiskScore: 80,
      engagementScore: 74,
      churnProbability: '0.04',
      calculationDate: '2026-09-30',
      factors: JSON.stringify({ note: 'Healthy savings deposit behavior and low credit utilization' }),
    }).onConflictDoNothing();
  }

  // 3. Seed Canonical Household: HH-10482 (Sharma Family Household)
  const existingHH = await db
    .select()
    .from(relationshipGroups)
    .where(eq(relationshipGroups.groupId, 'HH-10482'))
    .limit(1);

  if (existingHH.length === 0) {
    const [hh] = await db.insert(relationshipGroups).values({
      groupId: 'HH-10482',
      groupType: 'HOUSEHOLD',
      name: 'Sharma Family Household',
      displayName: 'Sharma Family',
      description: 'Private Banking Family Household Relationship — Mumbai Metro',
      status: 'ACTIVE',
      primaryCustomerId: rahul.id,
      primaryBusinessId: 'BIZ-10482',
      relationshipManagerId: rmAditya.id,
      metadata: {
        address: '702, Sea Pearl Heights, Bandra West, Mumbai 400050',
        tier: 'PRIVATE_BANKING_FAMILY',
        preferredBranch: 'Bandra West Flagship',
        establishedYear: 2021,
      },
    }).returning();

    // Seed members for HH-10482
    await db.insert(relationshipGroupMembers).values([
      {
        groupId: hh.id,
        entityType: 'CUSTOMER',
        entityId: String(rahul.id),
        role: 'Head of Household / Primary Earner',
        relationshipType: 'HOUSEHOLD_MEMBER',
        ownershipPercentage: null,
        isPrimary: true,
        validFrom: '2021-06-15',
        metadata: { customerCode: 'CUS-10482', relationRole: 'PRIMARY' },
      },
      {
        groupId: hh.id,
        entityType: 'CUSTOMER',
        entityId: String(priya.id),
        role: 'Spouse / Family Member',
        relationshipType: 'SPOUSE',
        ownershipPercentage: null,
        isPrimary: false,
        validFrom: '2021-09-01',
        metadata: { customerCode: 'CUS-10821', relationRole: 'CO_MEMBER' },
      },
      {
        groupId: hh.id,
        entityType: 'BUSINESS',
        entityId: 'BIZ-10482',
        role: 'Affiliated Enterprise',
        relationshipType: 'RELATED_BUSINESS',
        ownershipPercentage: null,
        isPrimary: false,
        metadata: { companyName: 'Sharma Bio-Agro Tech Pvt Ltd' },
      },
    ]);
  }

  // 4. Seed Canonical Business Group: BIZ-10482 (Sharma Bio-Agro Tech Pvt Ltd)
  const existingBiz = await db
    .select()
    .from(relationshipGroups)
    .where(eq(relationshipGroups.groupId, 'BIZ-10482'))
    .limit(1);

  if (existingBiz.length === 0) {
    const [biz] = await db.insert(relationshipGroups).values({
      groupId: 'BIZ-10482',
      groupType: 'BUSINESS',
      name: 'Sharma Bio-Agro Tech Pvt Ltd',
      displayName: 'Sharma Bio-Agro Tech',
      description: 'Commercial Agri-Biotechnology and High-Yield Inputs Enterprise',
      status: 'ACTIVE',
      primaryCustomerId: rahul.id,
      primaryBusinessId: 'BIZ-10482',
      relationshipManagerId: rmAditya.id,
      metadata: {
        cin: 'U01111MH2021PTC368291',
        gstin: '27AABCS1429B1ZX',
        annualTurnover: '₹ 18,50,00,000',
        industry: 'Agricultural Technology & Inputs',
        relationshipSince: '2021-08-20',
      },
    }).returning();

    await db.insert(relationshipGroupMembers).values([
      {
        groupId: biz.id,
        entityType: 'CUSTOMER',
        entityId: String(rahul.id),
        role: 'Managing Director & 62% Shareholder',
        relationshipType: 'DIRECTOR',
        ownershipPercentage: '62.00',
        isPrimary: true,
        validFrom: '2021-08-20',
        metadata: { customerCode: 'CUS-10482', votingRights: '62%' },
      },
    ]);
  }

  // 5. Ensure Priya is in Phase 28 relationshipEdges if missing
  try {
    await db.insert(relationshipEdges).values([
      {
        sourceEntityType: 'CUSTOMER',
        sourceEntityId: String(priya.id),
        targetEntityType: 'HOUSEHOLD',
        targetEntityId: 'HH-10482',
        relationshipType: 'CUSTOMER_BELONGS_TO_HOUSEHOLD',
        status: 'ACTIVE',
        provenanceType: 'DIRECT_RECORD',
        provenanceId: 'HH-DOC-2026-02',
        visibilityScope: 'BRANCH',
        metadata: JSON.stringify({
          householdName: 'Sharma Family Household',
          role: 'Spouse',
        }),
      },
      {
        sourceEntityType: 'CUSTOMER',
        sourceEntityId: String(rahul.id),
        targetEntityType: 'CUSTOMER',
        targetEntityId: String(priya.id),
        relationshipType: 'SPOUSE',
        status: 'ACTIVE',
        provenanceType: 'DIRECT_RECORD',
        provenanceId: 'HH-KYC-REL-01',
        visibilityScope: 'BRANCH',
      },
    ]).onConflictDoNothing();
  } catch (_e) {
    // Non-fatal if edge table structure is different
  }

  console.log('[Seed] Phase 34 Relationship Groups (HH-10482 & BIZ-10482) seeded successfully.');
}
