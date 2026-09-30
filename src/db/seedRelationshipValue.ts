/**
 * COREvia Phase 32: Relationship Value Intelligence Demonstration Seed Data
 * Seeds historical snapshots for canonical customer Rahul Sharma (ID 1) and other active clients.
 */

import { db } from './index.ts';
import { customers, relationshipValueSnapshots } from './schema.ts';
import { eq, desc } from 'drizzle-orm';

export async function seedRelationshipValueData() {
  console.log('Seeding Phase 32 Relationship Value Historical Snapshots...');

  // 1. Get canonical customer Rahul Sharma (ID 1)
  const [rahul] = await db.select().from(customers).where(eq(customers.id, 1)).limit(1);
  if (!rahul) {
    console.warn('⚠️ Canonical customer 1 (Rahul Sharma) not found. Skipping Relationship Value seed.');
    return;
  }

  // Check if snapshots already exist
  const existing = await db
    .select()
    .from(relationshipValueSnapshots)
    .where(eq(relationshipValueSnapshots.customerId, rahul.id))
    .limit(1);

  if (existing.length > 0) {
    console.log('✅ Relationship Value snapshots already seeded for Rahul Sharma.');
    return;
  }

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  // 90-day history trajectory for Rahul Sharma
  // Shows how CORE Score dropped due to open service issue & wire fee grievance, then stabilized
  const historyData = [
    {
      customerId: rahul.id,
      daysAgo: 90,
      coreScore: 84,
      productDepth: 6,
      engagement: 76,
      serviceHealth: 'GOOD',
      relationshipMomentum: 'STRONG',
      opportunityCoverage: 80,
      commitmentHealth: 88,
      activityHealth: 85,
      relationshipState: 'STABLE',
    },
    {
      customerId: rahul.id,
      daysAgo: 60,
      coreScore: 82,
      productDepth: 6,
      engagement: 72,
      serviceHealth: 'GOOD',
      relationshipMomentum: 'MODERATE',
      opportunityCoverage: 75,
      commitmentHealth: 80,
      activityHealth: 78,
      relationshipState: 'STABLE',
    },
    {
      customerId: rahul.id,
      daysAgo: 30,
      coreScore: 78,
      productDepth: 6,
      engagement: 66,
      serviceHealth: 'FAIR',
      relationshipMomentum: 'DECLINING',
      opportunityCoverage: 60,
      commitmentHealth: 70,
      activityHealth: 65,
      relationshipState: 'ATTENTION_REQUIRED',
    },
    {
      customerId: rahul.id,
      daysAgo: 7,
      coreScore: 79,
      productDepth: 6,
      engagement: 68,
      serviceHealth: 'FAIR',
      relationshipMomentum: 'DECLINING',
      opportunityCoverage: 62,
      commitmentHealth: 71,
      activityHealth: 64,
      relationshipState: 'SERVICE_RECOVERY',
    },
  ];

  for (const h of historyData) {
    const snapDate = new Date(now - h.daysAgo * DAY_MS).toISOString().split('T')[0];
    await db.insert(relationshipValueSnapshots).values({
      customerId: h.customerId,
      snapshotDate: snapDate,
      relationshipValue: String(rahul.relationshipValue || 4280000),
      coreScore: h.coreScore,
      productDepth: h.productDepth,
      engagement: h.engagement,
      serviceHealth: h.serviceHealth,
      relationshipMomentum: h.relationshipMomentum,
      opportunityCoverage: String(h.opportunityCoverage),
      commitmentHealth: String(h.commitmentHealth),
      activityHealth: String(h.activityHealth),
      relationshipState: h.relationshipState,
      sourceVersion: 'Phase32-Seed',
      createdAt: new Date(now - h.daysAgo * DAY_MS),
      metadata: {
        seeded: true,
        daysAgo: h.daysAgo,
      },
    });
  }

  console.log(`✅ Seeded ${historyData.length} historical relationship value snapshots for Rahul Sharma.`);
}
