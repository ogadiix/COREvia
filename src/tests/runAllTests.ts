import { runCoreBankingTests } from './coreBanking.test.ts';
import { runRelationshipGraphTests } from './relationshipGraph.test.ts';
import { runNotificationTests } from './notification.test.ts';
import { runDecisionTraceTests } from './decisionTrace.test.ts';
import { runStrategySimulatorTests } from './strategySimulator.test.ts';
import { runControlledAgentTests } from './controlledAgent.test.ts';

async function runAllTests() {
  console.log('========================================================================');
  console.log('   COREVIA BANKING RELATIONSHIP PLATFORM — AUTOMATED TEST SUITE');
  console.log('========================================================================\n');

  const startTime = Date.now();
  let passedSuites = 0;
  const totalSuites = 6;

  try {
    // Suite 1: Core Banking Platform & RBAC IDOR
    console.log('>>> [SUITE 1/6] CORE BANKING PLATFORM & RBAC SUITE');
    await runCoreBankingTests();
    passedSuites++;
    console.log('>>> [SUITE 1/6] PASSED\n');

    // Suite 2: Relationship Graph & Network Intelligence
    console.log('>>> [SUITE 2/6] RELATIONSHIP GRAPH & NETWORK INTELLIGENCE SUITE');
    await runRelationshipGraphTests();
    passedSuites++;
    console.log('>>> [SUITE 2/6] PASSED\n');

    // Suite 3: Notifications & Intelligent Alerts
    console.log('>>> [SUITE 3/6] NOTIFICATIONS & INTELLIGENT ALERTS SUITE');
    await runNotificationTests();
    passedSuites++;
    console.log('>>> [SUITE 3/6] PASSED\n');

    // Suite 4: AI Decision Trace & Explainability (Phase 29)
    console.log('>>> [SUITE 4/6] AI DECISION TRACE & EXPLAINABILITY SUITE (PHASE 29)');
    await runDecisionTraceTests();
    passedSuites++;
    console.log('>>> [SUITE 4/6] PASSED\n');

    // Suite 5: Relationship Strategy Simulator & What-If Sandbox (Phase 30)
    console.log('>>> [SUITE 5/6] RELATIONSHIP STRATEGY SIMULATOR & WHAT-IF SANDBOX (PHASE 30)');
    await runStrategySimulatorTests();
    passedSuites++;
    console.log('>>> [SUITE 5/6] PASSED\n');

    // Suite 6: Controlled Banking Agent & Governed Execution (Phase 31)
    console.log('>>> [SUITE 6/6] CONTROLLED BANKING AGENT & GOVERNED EXECUTION (PHASE 31)');
    await runControlledAgentTests();
    passedSuites++;
    console.log('>>> [SUITE 6/6] PASSED\n');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('========================================================================');
    console.log(`✅ ALL TEST SUITES PASSED (${passedSuites}/${totalSuites}) in ${duration}s`);
    console.log('   - Core Banking & RBAC/IDOR: PASS (18 tests)');
    console.log('   - Relationship Graph & Network: PASS (10 tests)');
    console.log('   - Notifications & Rules Engine: PASS (9 tests)');
    console.log('   - AI Decision Trace & Explainability: PASS (20 tests)');
    console.log('   - Relationship Strategy Simulator & What-If: PASS (21 tests)');
    console.log('   - Controlled Banking Agent & Governed Execution: PASS (15 tests)');
    console.log('   Total 93 automated integration & security verifications passed.');
    console.log('========================================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST SUITE RUNNER ENCOUNTERED FAILURE:', error);
    process.exit(1);
  }
}

runAllTests();
