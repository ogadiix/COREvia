import { db } from './index.ts';
import { relationshipEdges } from './schema.ts';
import { and, eq } from 'drizzle-orm';

/**
 * Enterprise Banking Seed for Phase 28: Relationship Graph & Network Intelligence
 * Adds realistic Indian banking household, corporate affiliation, and entity links for Rahul Sharma
 */
export async function seedPhase28RelationshipGraphData() {
  console.log('[Seed] Seeding Phase 28 Relationship Graph explicit edges...');

  const edgesToSeed = [
    {
      sourceEntityType: 'CUSTOMER',
      sourceEntityId: '1',
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
      sourceEntityId: '1',
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
      sourceEntityId: '4', // Sunil Varma
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
