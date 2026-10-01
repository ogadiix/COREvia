import { db } from './index';
import { customers, users, relationshipScenarios, relationshipScenarioActions } from './schema';
import { eq } from 'drizzle-orm';
import { strategySimulatorService } from '../services/strategySimulator.service';

export async function seedStrategyScenarios() {
  console.log('Seeding Phase 30 Strategy Simulator scenarios...');

  // Find demo customer Rahul Sharma
  const [rahul] = await db
    .select()
    .from(customers)
    .where(eq(customers.customerCode, 'CUS-10482'));

  if (!rahul) {
    console.warn('Customer CUS-10482 (Rahul Sharma) not found. Skipping scenario seed.');
    return;
  }

  // Find admin/RM user
  const allUsers = await db.select().from(users);
  const adminUser = allUsers.find((u) => u.role === 'ADMINISTRATOR' || u.role === 'BRANCH_OPS_HEAD') || allUsers[0];

  if (!adminUser) {
    console.warn('No active user found for scenario seed. Skipping.');
    return;
  }

  const mockUser = {
    id: adminUser.id,
    email: adminUser.email,
    name: adminUser.name,
    role: adminUser.role,
    department: adminUser.department,
    status: adminUser.status,
    isActive: adminUser.isActive,
    employeeId: adminUser.employeeId,
  } as any;


  // Check if scenarios already seeded
  const existing = await db
    .select()
    .from(relationshipScenarios)
    .where(eq(relationshipScenarios.customerId, rahul.id));

  if (existing.length >= 4) {
    console.log(`Customer ${rahul.name} already has ${existing.length} strategy scenarios seeded. Skipping.`);
    return;
  }

  // Get live base snapshot for Rahul
  const baseSnapshot = await strategySimulatorService.getBaseSnapshot(rahul.id, mockUser);

  // Scenario 1: Service Recovery
  console.log('Creating Scenario 1: Service Recovery...');
  const sc1 = await strategySimulatorService.createScenario(
    {
      customerId: rahul.id,
      name: 'Service Recovery',
      description: 'Simulate resolving the open high-priority service ticket to eliminate SLA friction and restore service health.',
      actions: [
        {
          actionType: 'RESOLVE_SERVICE_CASE',
          targetEntityType: 'SERVICE_CASE',
          targetEntityId: 'SR-4921',
          orderIndex: 0,
          label: 'Resolve Ticket #SR-4921',
          description: 'Mark dispute over inward UPI merchant credit as resolved',
        },
      ],
    },
    mockUser
  );
  await strategySimulatorService.simulateExistingScenario(sc1.id, mockUser);
  await strategySimulatorService.saveScenario(sc1.id, mockUser);

  // Scenario 2: Relationship Review Cadence
  console.log('Creating Scenario 2: Relationship Review...');
  const sc2 = await strategySimulatorService.createScenario(
    {
      customerId: rahul.id,
      name: 'Annual Relationship Review',
      description: 'Establish proactive governance cadence by scheduling an institutional relationship review meeting with the client.',
      actions: [
        {
          actionType: 'SCHEDULE_RELATIONSHIP_REVIEW',
          targetEntityType: 'RELATIONSHIP_REVIEW',
          orderIndex: 0,
          label: 'Schedule Annual Review',
          description: 'Calendar review session with primary signatories and family members',
        },
        {
          actionType: 'LOG_RELATIONSHIP_INTERACTION',
          targetEntityType: 'CUSTOMER',
          orderIndex: 1,
          label: 'Log Agenda Call',
          description: 'Preliminary agenda discussion call resetting interaction recency',
        },
      ],
    },
    mockUser
  );
  await strategySimulatorService.simulateExistingScenario(sc2.id, mockUser);
  await strategySimulatorService.saveScenario(sc2.id, mockUser);

  // Scenario 3: Opportunity Follow-up
  console.log('Creating Scenario 3: Opportunity Follow-up...');
  const sc3 = await strategySimulatorService.createScenario(
    {
      customerId: rahul.id,
      name: 'Opportunity Follow-up',
      description: 'Unblock stalled Senior Citizen Fixed Deposit & wealth advisory opportunity via structured RM outreach.',
      actions: [
        {
          actionType: 'FOLLOW_UP_OPPORTUNITY',
          targetEntityType: 'OPPORTUNITY',
          targetEntityId: 'OPP-10482-01',
          orderIndex: 0,
          label: 'Follow up on Senior Citizen FD',
          description: 'Re-engage customer regarding parents liquidity allocation in 8.25% FD',
        },
      ],
    },
    mockUser
  );
  await strategySimulatorService.simulateExistingScenario(sc3.id, mockUser);
  await strategySimulatorService.saveScenario(sc3.id, mockUser);

  // Scenario 4: Full Relationship Recovery & Expansion Plan
  console.log('Creating Scenario 4: Full Relationship Recovery Plan...');
  const sc4 = await strategySimulatorService.createScenario(
    {
      customerId: rahul.id,
      name: 'Full Relationship Recovery & Expansion Plan',
      description: 'Multi-action comprehensive transformation: resolve open service friction, deliver overdue banker commitment, schedule relationship review, and unblock stalled opportunity.',
      actions: [
        {
          actionType: 'RESOLVE_SERVICE_CASE',
          targetEntityType: 'SERVICE_CASE',
          targetEntityId: 'SR-4921',
          orderIndex: 0,
          label: '1. Resolve Service Dispute',
          description: 'Clear the 72h SLA breach on merchant payment',
        },
        {
          actionType: 'COMPLETE_COMMITMENT',
          targetEntityType: 'COMMITMENT',
          orderIndex: 1,
          label: '2. Complete Overdue Commitment',
          description: 'Deliver updated consolidated wealth statement',
        },
        {
          actionType: 'SCHEDULE_RELATIONSHIP_REVIEW',
          targetEntityType: 'RELATIONSHIP_REVIEW',
          orderIndex: 2,
          label: '3. Schedule Relationship Review',
          description: 'Formal branch or virtual executive review session',
        },
        {
          actionType: 'FOLLOW_UP_OPPORTUNITY',
          targetEntityType: 'OPPORTUNITY',
          targetEntityId: 'OPP-10482-01',
          orderIndex: 3,
          label: '4. Follow Up Opportunity',
          description: 'Present finalized FD allocation structure',
        },
      ],
    },
    mockUser
  );
  await strategySimulatorService.simulateExistingScenario(sc4.id, mockUser);
  await strategySimulatorService.saveScenario(sc4.id, mockUser);

  console.log('✅ Strategy Simulator synthetic scenarios successfully seeded!');
}

// Direct execution support
if (process.argv[1]?.endsWith('seedStrategyScenarios.ts')) {
  seedStrategyScenarios()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Failed to seed strategy scenarios:', err);
      process.exit(1);
    });
}
