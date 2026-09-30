import { runCoreBankingTests } from './coreBanking.test.ts';
import { runRelationshipGraphTests } from './relationshipGraph.test.ts';
import { runNotificationTests } from './notification.test.ts';
import { runDecisionTraceTests } from './decisionTrace.test.ts';
import { runStrategySimulatorTests } from './strategySimulator.test.ts';
import { runControlledAgentTests } from './controlledAgent.test.ts';
import { runRelationshipValueTests } from './relationshipValue.test.ts';
import { runCustomerJourneyTests } from './journey.test.ts';
import { runGroupTests } from './group.test.ts';

async function runAllTests() {
  console.log('========================================================================');
  console.log('   COREVIA BANKING RELATIONSHIP PLATFORM — AUTOMATED TEST SUITE');
  console.log('========================================================================\n');

  const startTime = Date.now();
  let passedSuites = 0;
  const totalSuites = 9;

  try {
    // Suite 1: Core Banking Platform & RBAC IDOR
    console.log('>>> [SUITE 1/9] CORE BANKING PLATFORM & RBAC SUITE');
    await runCoreBankingTests();
    passedSuites++;
    console.log('>>> [SUITE 1/9] PASSED\n');

    // Suite 2: Relationship Graph & Network Intelligence
    console.log('>>> [SUITE 2/9] RELATIONSHIP GRAPH & NETWORK INTELLIGENCE SUITE');
    await runRelationshipGraphTests();
    passedSuites++;
    console.log('>>> [SUITE 2/9] PASSED\n');

    // Suite 3: Notifications & Intelligent Alerts
    console.log('>>> [SUITE 3/9] NOTIFICATIONS & INTELLIGENT ALERTS SUITE');
    await runNotificationTests();
    passedSuites++;
    console.log('>>> [SUITE 3/9] PASSED\n');

    // Suite 4: AI Decision Trace & Explainability (Phase 29)
    console.log('>>> [SUITE 4/9] AI DECISION TRACE & EXPLAINABILITY SUITE (PHASE 29)');
    await runDecisionTraceTests();
    passedSuites++;
    console.log('>>> [SUITE 4/9] PASSED\n');

    // Suite 5: Relationship Strategy Simulator & What-If Sandbox (Phase 30)
    console.log('>>> [SUITE 5/9] RELATIONSHIP STRATEGY SIMULATOR & WHAT-IF SANDBOX (PHASE 30)');
    await runStrategySimulatorTests();
    passedSuites++;
    console.log('>>> [SUITE 5/9] PASSED\n');

    // Suite 6: Controlled Banking Agent & Governed Execution (Phase 31)
    console.log('>>> [SUITE 6/9] CONTROLLED BANKING AGENT & GOVERNED EXECUTION (PHASE 31)');
    await runControlledAgentTests();
    passedSuites++;
    console.log('>>> [SUITE 6/9] PASSED\n');

    // Suite 7: Relationship Value & Portfolio Scenario Intelligence (Phase 32)
    console.log('>>> [SUITE 7/9] RELATIONSHIP VALUE & PORTFOLIO SCENARIO INTELLIGENCE SUITE (PHASE 32)');
    await runRelationshipValueTests();
    passedSuites++;
    console.log('>>> [SUITE 7/9] PASSED\n');

    // Suite 8: Customer Journey Orchestrator & Lifecycle Management (Phase 33)
    console.log('>>> [SUITE 8/9] CUSTOMER JOURNEY ORCHESTRATOR & LIFECYCLE MANAGEMENT SUITE (PHASE 33)');
    await runCustomerJourneyTests();
    passedSuites++;
    console.log('>>> [SUITE 8/9] PASSED\n');

    // Suite 9: Household & Business Group 360 (Phase 34)
    console.log('>>> [SUITE 9/9] HOUSEHOLD & BUSINESS GROUP 360 SUITE (PHASE 34)');
    await runGroupTests();
    passedSuites++;
    console.log('>>> [SUITE 9/9] PASSED\n');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('========================================================================');
    console.log(`✅ ALL TEST SUITES PASSED (${passedSuites}/${totalSuites}) in ${duration}s`);
    console.log('   - Core Banking & RBAC/IDOR: PASS (18 tests)');
    console.log('   - Relationship Graph & Network: PASS (10 tests)');
    console.log('   - Notifications & Rules Engine: PASS (9 tests)');
    console.log('   - AI Decision Trace & Explainability: PASS (20 tests)');
    console.log('   - Relationship Strategy Simulator & What-If: PASS (21 tests)');
    console.log('   - Controlled Banking Agent & Governed Execution: PASS (15 tests)');
    console.log('   - Relationship Value & Portfolio Scenario Intelligence: PASS (22 tests)');
    console.log('   - Customer Journey Orchestrator & Lifecycle: PASS (33 tests)');
    console.log('   - Household & Business Group 360: PASS (30 tests)');
    console.log('   Total 178 automated integration & security verifications passed.');
    console.log('========================================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE RUNNER ENCOUNTERED FAILURE:', error);
    process.exit(1);
  }
}

runAllTests();
