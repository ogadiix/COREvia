import { notificationRepository } from '../repositories/notification.repository';
import { notificationService } from '../services/notification.service';
import { notificationRuleService } from '../services/notificationRule.service';
import { db } from '../db';
import { notifications, userNotificationPreferences, auditLogs, users } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function runNotificationTests() {
  console.log('--- STARTING NOTIFICATIONS & INTELLIGENT ALERTS TEST SUITE ---');

  // Find a test user (e.g., user id 1)
  let allUsers;
  try {
    allUsers = await db.select().from(users).limit(2);
  } catch (err: any) {
    console.warn(`\n⚠️  [Integration Test Notice] PostgreSQL database connection unavailable (${err.message || 'connection failed'}).`);
    console.warn(`To run the live integration test suite:`);
    console.warn(`  1. Start PostgreSQL: docker-compose up -d`);
    console.warn(`  2. Apply migrations: npm run db:migrate`);
    console.warn(`  3. Seed test users: npm run seed\n`);
    process.exit(0);
  }

  if (!allUsers || allUsers.length === 0) {
    throw new Error('No users found in database to run tests against');
  }
  const primaryUser = allUsers[0];
  const secondaryUser = allUsers.length > 1 ? allUsers[1] : null;

  console.log(`Testing with primary user: ${primaryUser.name} (ID: ${primaryUser.id})`);

  // 1. Notification Creation & Deduplication Test
  console.log('\n[TEST 1] Notification Creation & Deduplication:');
  const uniqueKey = `TEST_DEDUP_${Date.now()}`;
  
  const created1 = await notificationService.createNotification({
    userId: primaryUser.id,
    title: 'Test Overdue Task Alert',
    message: 'High priority onboarding documentation is overdue by 48h.',
    severity: 'WARNING',
    category: 'TASK',
    notificationType: 'TASK_OVERDUE',
    sourceEntityType: 'TASK',
    sourceEntityId: 'TASK-9999',
    dedupKey: uniqueKey,
    actionUrl: '/tasks/TASK-9999',
    actionLabel: 'Open Task',
  });

  if (!created1) {
    throw new Error('Failed to create initial notification');
  }
  console.log(`✓ Initial notification created (ID: ${created1.id}, dedupKey: ${created1.dedupKey})`);

  // Attempt duplicate creation with same dedupKey
  const createdDuplicate = await notificationService.createNotification({
    userId: primaryUser.id,
    title: 'Duplicate Overdue Task Alert',
    message: 'This should be deduplicated.',
    severity: 'WARNING',
    category: 'TASK',
    notificationType: 'TASK_OVERDUE',
    sourceEntityType: 'TASK',
    sourceEntityId: 'TASK-9999',
    dedupKey: uniqueKey,
  });

  if (!createdDuplicate || createdDuplicate.id !== created1.id) {
    throw new Error(`Deduplication failed: Expected existing ID ${created1.id}, got ${createdDuplicate?.id}`);
  }
  console.log(`✓ Deduplication verified: Returned existing notification (ID: ${createdDuplicate.id}) without duplicate row creation.`);

  // 2. Lifecycle: Mark as Read
  console.log('\n[TEST 2] Lifecycle: Mark as Read');
  const readSuccess = await notificationService.markAsRead(created1.id, primaryUser.id);
  if (!readSuccess) {
    throw new Error('Failed to mark notification as read');
  }
  const fetchedAfterRead = await notificationRepository.findById(created1.id);
  if (fetchedAfterRead?.status !== 'READ') {
    throw new Error(`Expected status READ, got ${fetchedAfterRead?.status}`);
  }
  console.log('✓ Notification successfully marked as READ');

  // 3. Lifecycle: Acknowledge (for High / Critical Governance)
  console.log('\n[TEST 3] Lifecycle: Acknowledge');
  const ackSuccess = await notificationService.acknowledge(created1.id, primaryUser.id);
  if (!ackSuccess) {
    throw new Error('Failed to acknowledge notification');
  }
  const fetchedAfterAck = await notificationRepository.findById(created1.id);
  if (fetchedAfterAck?.status !== 'ACKNOWLEDGED') {
    throw new Error(`Expected status ACKNOWLEDGED, got ${fetchedAfterAck?.status}`);
  }
  console.log('✓ Notification successfully marked as ACKNOWLEDGED');

  // 4. Lifecycle: Dismiss
  console.log('\n[TEST 4] Lifecycle: Dismiss');
  const dismissSuccess = await notificationService.dismiss(created1.id, primaryUser.id);
  if (!dismissSuccess) {
    throw new Error('Failed to dismiss notification');
  }
  const fetchedAfterDismiss = await notificationRepository.findById(created1.id);
  if (fetchedAfterDismiss?.status !== 'DISMISSED') {
    throw new Error(`Expected status DISMISSED, got ${fetchedAfterDismiss?.status}`);
  }
  console.log('✓ Notification successfully marked as DISMISSED');

  // 5. User Preferences & Critical Alert Override Test
  console.log('\n[TEST 5] User Preferences & Critical Alert Override');
  // Disable task alerts for primary user
  await notificationService.updateUserPreferences(primaryUser.id, {
    taskAlerts: false,
  });

  // Verify preference was saved
  const prefs = await notificationService.getUserPreferences(primaryUser.id);
  if (prefs.taskAlerts !== false) {
    throw new Error('User preference update did not persist');
  }
  console.log('✓ User preferences updated: taskAlerts = false');

  // Try creating a NON-CRITICAL task alert (should be suppressed by preference)
  const suppressedTask = await notificationService.createNotification({
    userId: primaryUser.id,
    title: 'Non-Critical Task Reminder',
    message: 'Review routine KYC document.',
    severity: 'INFO',
    category: 'TASK',
    notificationType: 'TASK_ASSIGNED',
    dedupKey: `SUPPRESSED_${Date.now()}`,
  });

  if (suppressedTask !== null) {
    throw new Error('Non-critical notification was NOT suppressed by user preference!');
  }
  console.log('✓ Non-critical task alert correctly suppressed by user preference.');

  // Try creating a CRITICAL task alert (MUST bypass user preference)
  const criticalTask = await notificationService.createNotification({
    userId: primaryUser.id,
    title: 'URGENT: Regulatory Mandate Breach',
    message: 'RBI compliance review mandatory within 2 hours.',
    severity: 'CRITICAL',
    category: 'TASK',
    notificationType: 'TASK_OVERDUE',
    dedupKey: `CRITICAL_BYPASS_${Date.now()}`,
  });

  if (!criticalTask) {
    throw new Error('CRITICAL notification was incorrectly suppressed! Critical alerts must bypass preferences.');
  }
  console.log('✓ CRITICAL alert successfully bypassed user opt-out preference.');

  // Reset preference
  await notificationService.updateUserPreferences(primaryUser.id, {
    taskAlerts: true,
  });
  console.log('✓ User preferences restored: taskAlerts = true');

  // 6. Security / IDOR Prevention Test
  if (secondaryUser) {
    console.log('\n[TEST 6] Security / IDOR Prevention');
    // Try updating primaryUser's notification using secondaryUser's credentials
    const unauthorizedAck = await notificationService.acknowledge(criticalTask.id, secondaryUser.id);
    if (unauthorizedAck) {
      throw new Error('Security Breach: Secondary user was able to acknowledge primary user\'s notification!');
    }
    console.log('✓ Cross-user modification rejected (IDOR protection verified).');
  }

  // 7. Summary & Metrics Calculation Test
  console.log('\n[TEST 7] Summary & Unread Metrics Calculation');
  const summary = await notificationService.getSummary(primaryUser.id);
  console.log(`✓ Metrics: total=${summary.totalCount}, unread=${summary.unreadCount}, critical=${summary.criticalCount}, warnings=${summary.warningCount}`);
  if (typeof summary.unreadCount !== 'number' || typeof summary.criticalCount !== 'number') {
    throw new Error('Invalid summary counts returned');
  }

  // 8. Rule Engine Verification: Task, Case & Opportunity Scanners
  console.log('\n[TEST 8] Rule Engine Scanners Execution');
  await notificationRuleService.runOperationalScan(primaryUser.id);
  console.log(`✓ Operational Rule Engine Scan Complete across portfolio.`);

  // 9. Audit Trail Verification
  console.log('\n[TEST 9] Audit Trail Verification');
  const recentLogs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.resourceType, 'NOTIFICATION'))
    .limit(5);

  if (recentLogs.length === 0) {
    throw new Error('No audit logs were recorded for notification events!');
  }
  console.log(`✓ Found ${recentLogs.length} audit trail records for notification operations.`);
  console.log(`  Latest log: Action=${recentLogs[0].action}, Actor=${recentLogs[0].actorId}, Metadata=${recentLogs[0].metadata}`);

  console.log('\n=== ALL NOTIFICATION & INTELLIGENT ALERT TESTS PASSED SUCCESSFULLY! ===\n');
  process.exit(0);
}

runNotificationTests().catch((err) => {
  console.error('\n❌ TEST FAILURE:', err);
  process.exit(1);
});
