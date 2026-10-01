import { db } from './index.ts';
import { relationshipEdges, customers } from './schema.ts';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Ensures table relationship_edges exists with proper indices before seeding
 */
export async function ensureRelationshipGraphTablesExist() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS relationship_edges (
      id SERIAL PRIMARY KEY,
      source_entity_type TEXT NOT NULL,
      source_entity_id TEXT NOT NULL,
      target_entity_type TEXT NOT NULL,
      target_entity_id TEXT NOT NULL,
      relationship_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      provenance_type TEXT NOT NULL DEFAULT 'DIRECT_RECORD',
      provenance_id TEXT,
      visibility_scope TEXT NOT NULL DEFAULT 'BRANCH',
      metadata TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_rel_edge_source ON relationship_edges(source_entity_type, source_entity_id);
    CREATE INDEX IF NOT EXISTS idx_rel_edge_target ON relationship_edges(target_entity_type, target_entity_id);
    CREATE INDEX IF NOT EXISTS idx_rel_edge_type ON relationship_edges(relationship_type);
    CREATE INDEX IF NOT EXISTS idx_rel_edge_status ON relationship_edges(status);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_rel_edge_unique_pair ON relationship_edges(
      source_entity_type,
      source_entity_id,
      target_entity_type,
      target_entity_id,
      relationship_type
    );
  `);
}

/**
 * Enterprise Banking Seed for Phase 28: Relationship Graph & Network Intelligence
 * Adds realistic Indian banking household, corporate affiliation, and entity links for Rahul Sharma
 */
export async function seedPhase28RelationshipGraphData() {
  console.log('[Seed] Seeding Phase 28 Relationship Graph explicit edges...');

  await ensureRelationshipGraphTablesExist();

  // Find canonical customer Rahul Sharma (CUS-10482)
  const [rahul] = await db
    .select()
    .from(customers)
    .where(eq(customers.customerCode, 'CUS-10482'))
    .limit(1);

  const rahulId = rahul ? String(rahul.id) : '1';

  // Find canonical customer Sunil Varma (CUS-40182)
  const [sunil] = await db
    .select()
    .from(customers)
    .where(eq(customers.customerCode, 'CUS-40182'))
    .limit(1);

  const sunilId = sunil ? String(sunil.id) : '4';

  const edgesToSeed = [
    {
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: rahulId,
      targetEntityType: 'HOUSEHOLD',
      targetEntityId: 'HH-10482',
      relationshipType: 'CUSTOMER_BELONGS_TO_HOUSEHOLD',
      status: 'ACTIVE',
      provenanceType: 'DIRECT_RECORD',
      provenanceId: 'HH-DOC-2026-01',
      visibilityScope: 'BRANCH',
      metadata: JSON.stringify({
        householdName: 'Sharma Family Household',
        headOfFamily: 'Rahul Sharma',
        registeredAddress: '702, Sea Pearl Heights, Bandra West, Mumbai 400050',
        totalHouseholdWealth: '₹ 4,85,00,000',
        relationshipTier: 'PRIVATE_BANKING_FAMILY',
        nomineeRegistration: 'COMPLETED',
      }),
    },
    {
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: rahulId,
      targetEntityType: 'BUSINESS',
      targetEntityId: 'BIZ-10482',
      relationshipType: 'CUSTOMER_ASSOCIATED_WITH_BUSINESS',
      status: 'ACTIVE',
      provenanceType: 'DIRECT_RECORD',
      provenanceId: 'ROC-CIN-MH2021PTC368291',
      visibilityScope: 'BRANCH',
      metadata: JSON.stringify({
        companyName: 'Sharma Bio-Agro Tech Pvt Ltd',
        role: 'Managing Director & 62% Shareholder',
        cin: 'U01111MH2021PTC368291',
        gstin: '27AABCS1429B1ZX',
        annualTurnover: '₹ 18,50,00,000',
        primaryBankRelation: 'COREvia Corporate Banking Division',
      }),
    },
    {
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: sunilId,
      targetEntityType: 'BUSINESS',
      targetEntityId: 'BIZ-40182',
      relationshipType: 'CUSTOMER_ASSOCIATED_WITH_BUSINESS',
      status: 'ACTIVE',
      provenanceType: 'DIRECT_RECORD',
      provenanceId: 'ROC-PROP-DL2019',
      visibilityScope: 'BRANCH',
      metadata: JSON.stringify({
        companyName: 'Varma Global Logistics & Supply Chain',
        role: 'Sole Proprietor',
        annualTurnover: '₹ 6,20,00,000',
      }),
    },
  ];

  for (const edge of edgesToSeed) {
    const existing = await db
      .select()
      .from(relationshipEdges)
      .where(
        and(
          eq(relationshipEdges.sourceEntityType, edge.sourceEntityType),
          eq(relationshipEdges.sourceEntityId, edge.sourceEntityId),
          eq(relationshipEdges.targetEntityType, edge.targetEntityType),
          eq(relationshipEdges.targetEntityId, edge.targetEntityId),
          eq(relationshipEdges.relationshipType, edge.relationshipType)
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(relationshipEdges).values(edge);
    }
  }

  console.log('[Seed] Phase 28 Relationship Graph edges verified successfully.');
}
