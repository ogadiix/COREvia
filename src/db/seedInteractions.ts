import { db } from './index.ts';
import {
  interactions,
  interactionParticipants,
  interactionLinks,
  interactionCommitments,
  customers,
  users,
  opportunities,
  serviceCases,
  tasks,
  onboardingApplications,
} from './schema.ts';
import { eq, sql } from 'drizzle-orm';

export async function seedPhase24Interactions() {
  console.log('Seeding Phase 24 Interactions & Hub data...');

  const allCustomers = await db.select().from(customers).limit(10);
  const allUsers = await db.select().from(users);
  const allOpps = await db.select().from(opportunities).limit(10);
  const allCases = await db.select().from(serviceCases).limit(10);
  const allTasks = await db.select().from(tasks).limit(10);
  const allOnb = await db.select().from(onboardingApplications).limit(10);

  if (allCustomers.length === 0 || allUsers.length === 0) {
    console.log('Customers or users not available for seeding interactions.');
    return;
  }

  const rmUser = allUsers.find((u) => u.role === 'RM') || allUsers[0];
  const officerUser = allUsers.find((u) => u.role === 'OPERATIONS' || u.role === 'ADMIN') || allUsers[1];

  // Check if we already have seeded Phase 24 data
  const existingCount = await db.select({ count: sql<number>`count(*)::int` }).from(interactions);
  if ((existingCount[0]?.count || 0) > 10) {
    console.log('Interactions already seeded (count > 10). Skipping seed.');
    return;
  }

  const seedData = [
    {
      ref: 'INT-2026-000481',
      customer: allCustomers[0], // Rahul Verma
      channel: 'PHONE',
      type: 'CALL',
      subject: 'Quarterly Portfolio Review & Tax Harvesting Advisory',
      summary: 'Discussed Q3 investment portfolio performance, capital gains harvesting before FY close, and potential deployment of upcoming dividend proceeds into Sovereign Gold Bonds.',
      outcome: 'FOLLOW_UP_REQUIRED',
      sentiment: 'POSITIVE',
      duration: 35,
      daysAgo: 1,
      followupRequired: true,
      followupDays: 3,
      followupAction: 'Share customized term sheet and tax-harvesting model projection',
      followupPriority: 'HIGH',
      opp: allOpps[0] || null,
      caseItem: null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: allCustomers[0].name, role: 'Primary Account Holder', attended: true },
        { type: 'RM', name: rmUser.name, role: 'Senior Relationship Manager', attended: true },
      ],
      commitments: [
        { type: 'RM_COMMITMENT', desc: 'Email Sovereign Gold Bond tranche schedule and pricing note by Friday', dueDays: 2 },
        { type: 'CUSTOMER_COMMITMENT', desc: 'Customer to review CKYC update document and return signed consent', dueDays: 5 },
      ],
    },
    {
      ref: 'INT-2026-000482',
      customer: allCustomers[1] || allCustomers[0], // Kalyan Jewellers / Commercial
      channel: 'IN_PERSON',
      type: 'MEETING',
      subject: 'Working Capital Line Enhancement & Bullion Consignment Facility',
      summary: 'In-person meeting at Maker Chambers executive boardroom with CFO and Treasury Head. Presented proposal for increasing revolving working capital line from ₹25 Cr to ₹40 Cr in view of festive retail expansion.',
      outcome: 'OPPORTUNITY_IDENTIFIED',
      sentiment: 'POSITIVE',
      duration: 75,
      daysAgo: 2,
      followupRequired: true,
      followupDays: 4,
      followupAction: 'Submit Credit Committee note with audited balance sheet annexures',
      followupPriority: 'URGENT',
      opp: allOpps[1] || allOpps[0] || null,
      caseItem: null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: 'Rajesh Kalyanaraman', role: 'Executive Director & CFO', attended: true },
        { type: 'CUSTOMER', name: 'S. Venkatachalam', role: 'VP Treasury', attended: true },
        { type: 'RM', name: rmUser.name, role: 'Principal RM - Commercial Banking', attended: true },
        { type: 'SPECIALIST', name: 'Alok Sengupta', role: 'Credit Risk Head - West Zone', attended: true },
      ],
      commitments: [
        { type: 'RM_COMMITMENT', desc: 'Draft pre-sanction term sheet with 8.45% indicative spread', dueDays: 3 },
        { type: 'CUSTOMER_COMMITMENT', desc: 'Provide provisional Q3 management accounts and stock inventory statement', dueDays: 4 },
      ],
    },
    {
      ref: 'INT-2026-000483',
      customer: allCustomers[0],
      channel: 'VIDEO',
      type: 'VIDEO_MEETING',
      subject: 'Digital Escrow API Architecture Walkthrough',
      summary: 'Virtual briefing with client technical team on COREvia Connected Banking API suite for programmatic vendor invoice settlements and instant webhooks.',
      outcome: 'OPPORTUNITY_PROGRESS',
      sentiment: 'NEUTRAL',
      duration: 45,
      daysAgo: 4,
      followupRequired: false,
      opp: allOpps[0] || null,
      caseItem: null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: allCustomers[0].name, role: 'Founder & Managing Director', attended: true },
        { type: 'RM', name: rmUser.name, role: 'Relationship Manager', attended: true },
        { type: 'SPECIALIST', name: 'Karthik Rao', role: 'API Integration Specialist', attended: true },
      ],
      commitments: [
        { type: 'RM_COMMITMENT', desc: 'Provision sandbox client credentials and postman collection in developer portal', dueDays: 2 },
      ],
    },
    {
      ref: 'INT-2026-000484',
      customer: allCustomers[2] || allCustomers[0],
      channel: 'EMAIL',
      type: 'EMAIL',
      subject: 'Inward Trade Remittance Bill of Entry Reconciliation',
      summary: 'Transmitted regulatory EDPMS reporting update regarding pending foreign outward remittance proofs for machinery consignment shipment from Hamburg port.',
      outcome: 'DOCUMENT_REQUESTED',
      sentiment: 'CONCERNED',
      duration: 15,
      daysAgo: 5,
      followupRequired: true,
      followupDays: 2,
      followupAction: 'Follow up with customs clearance agent for stamped Bill of Entry copy',
      followupPriority: 'HIGH',
      opp: null,
      caseItem: allCases[0] || null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: (allCustomers[2] || allCustomers[0]).name, role: 'Finance Controller', attended: true },
        { type: 'RM', name: rmUser.name, role: 'Trade Desk Officer', attended: true },
      ],
      commitments: [
        { type: 'CUSTOMER_COMMITMENT', desc: 'Upload ICEGATE digitally signed BOE document before 15th of the month', dueDays: 3 },
      ],
    },
    {
      ref: 'INT-2026-000485',
      customer: allCustomers[1] || allCustomers[0],
      channel: 'BRANCH',
      type: 'BRANCH_VISIT',
      subject: 'Authorized Signatory Board Resolution Submission',
      summary: 'Branch visit to Fort, Mumbai Main Branch. Handed over certified extracts of Board Resolution appointing new Chief Compliance Officer as authorized signatory for trade accounts.',
      outcome: 'SERVICE_RESOLVED',
      sentiment: 'POSITIVE',
      duration: 30,
      daysAgo: 7,
      followupRequired: false,
      opp: null,
      caseItem: allCases[1] || null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: 'Deepak Merchant', role: 'Company Secretary', attended: true },
        { type: 'RM', name: officerUser.name, role: 'Branch Operations Manager', attended: true },
      ],
      commitments: [],
    },
    {
      ref: 'INT-2026-000486',
      customer: allCustomers[0],
      channel: 'PORTAL',
      type: 'RELATIONSHIP_REVIEW',
      subject: 'Annual Strategic Banking Review & Wallet Share Assessment',
      summary: 'Comprehensive annual banking relationship review. Evaluated loan pricing, FX spread tiering, payroll account benefits, and cross-border remittance limits. Customer satisfaction high; requested competitive USD/INR spot spreads.',
      outcome: 'COMMITMENT_MADE',
      sentiment: 'POSITIVE',
      duration: 60,
      daysAgo: 10,
      followupRequired: true,
      followupDays: 5,
      followupAction: 'Provide revised FX treasury card rate structure for trade turnover > $5M',
      followupPriority: 'MEDIUM',
      opp: allOpps[0] || null,
      caseItem: null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: allCustomers[0].name, role: 'Managing Director', attended: true },
        { type: 'RM', name: rmUser.name, role: 'Senior RM', attended: true },
      ],
      commitments: [
        { type: 'RM_COMMITMENT', desc: 'Secure Treasury approval for 8 paisa spread margin on G10 currencies', dueDays: 4 },
      ],
    },
    {
      ref: 'INT-2026-000487',
      customer: allCustomers[3] || allCustomers[0],
      channel: 'PHONE',
      type: 'ONBOARDING_CONTACT',
      subject: 'Entity KYC Document Clarification — Ultimate Beneficial Owner (UBO)',
      summary: 'Contacted applicant regarding Form 3 UBO declaration for Singapore holding entity. Clarified shareholding tier breakdown and passport copy requirements.',
      outcome: 'ONBOARDING_PROGRESS',
      sentiment: 'NEUTRAL',
      duration: 25,
      daysAgo: 12,
      followupRequired: true,
      followupDays: 3,
      followupAction: 'Verify incoming notarized apostilled certificate from Singapore registrar',
      followupPriority: 'HIGH',
      opp: null,
      caseItem: null,
      onb: allOnb[0] || null,
      participants: [
        { type: 'CUSTOMER', name: (allCustomers[3] || allCustomers[0]).name, role: 'Director', attended: true },
        { type: 'RM', name: officerUser.name, role: 'Onboarding & KYC Officer', attended: true },
      ],
      commitments: [
        { type: 'CUSTOMER_COMMITMENT', desc: 'Courier certified copy of ACRA entity extract to Mumbai office', dueDays: 4 },
      ],
    },
    {
      ref: 'INT-2026-000488',
      customer: allCustomers[0],
      channel: 'CHAT',
      type: 'CHAT',
      subject: 'Bulk Salary Disbursal NEFT Batch Authorization Assistance',
      summary: 'RM live chat support. Customer encountered two-factor OTP timeout on corporate banking portal during batch payout for 140 employees.',
      outcome: 'SERVICE_RESOLVED',
      sentiment: 'POSITIVE',
      duration: 18,
      daysAgo: 14,
      followupRequired: false,
      opp: null,
      caseItem: null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: allCustomers[0].name, role: 'Authorizer', attended: true },
        { type: 'RM', name: rmUser.name, role: 'RM', attended: true },
      ],
      commitments: [],
    },
    {
      ref: 'INT-2026-000489',
      customer: allCustomers[1] || allCustomers[0],
      channel: 'PHONE',
      type: 'SERVICE_CONTACT',
      subject: 'Letter of Credit Swift MT700 Amendment Query',
      summary: 'Inquiry regarding shipment date extension on LC 9048-CRV-2026. Advised on beneficiary consent requirements and Swift amendment commission charges.',
      outcome: 'CUSTOMER_REQUEST',
      sentiment: 'NEUTRAL',
      duration: 20,
      daysAgo: 18,
      followupRequired: false,
      opp: null,
      caseItem: allCases[0] || null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: (allCustomers[1] || allCustomers[0]).name, role: 'Import Manager', attended: true },
        { type: 'RM', name: rmUser.name, role: 'Trade Services Desk', attended: true },
      ],
      commitments: [],
    },
    {
      ref: 'INT-2026-000490',
      customer: allCustomers[2] || allCustomers[0],
      channel: 'MESSAGE',
      type: 'MESSAGE',
      subject: 'Overdraft Account Interest Debit Advice & Statement Dispatch',
      summary: 'Official WhatsApp business channel dispatch of monthly OD account interest calculation sheet and GST invoice.',
      outcome: 'NO_ACTION_REQUIRED',
      sentiment: 'NEUTRAL',
      duration: 5,
      daysAgo: 22,
      followupRequired: false,
      opp: null,
      caseItem: null,
      onb: null,
      participants: [
        { type: 'CUSTOMER', name: (allCustomers[2] || allCustomers[0]).name, role: 'Finance Head', attended: true },
        { type: 'RM', name: rmUser.name, role: 'RM Desk', attended: true },
      ],
      commitments: [],
    },
  ];

  for (const s of seedData) {
    const timestamp = new Date();
    timestamp.setDate(timestamp.getDate() - s.daysAgo);

    let followupDate: Date | null = null;
    let createdTaskId: number | null = null;

    if (s.followupRequired) {
      followupDate = new Date(timestamp);
      followupDate.setDate(followupDate.getDate() + (s.followupDays || 3));

      // Create a real task in the tasks table
      const [t] = await db
        .insert(tasks)
        .values({
          customerId: s.customer.id,
          title: `Follow-up [${s.ref}]: ${s.followupAction}`,
          description: `Auto-generated follow-up task from interaction ${s.ref} ("${s.subject}").`,
          dueDate: followupDate.toISOString().slice(0, 10),
          priority: s.followupPriority || 'MEDIUM',
          status: followupDate < new Date() ? 'COMPLETED' : 'PENDING',
          assignedToId: rmUser.id,
          relatedType: 'INTERACTION',
          relatedId: s.ref,
        })
        .returning();
      createdTaskId = t?.id || null;
    }

    const [inter] = await db
      .insert(interactions)
      .values({
        interactionReference: s.ref,
        customerId: s.customer.id,
        channel: s.channel,
        interactionType: s.type,
        subject: s.subject,
        summary: s.summary,
        outcome: s.outcome,
        sentiment: s.sentiment,
        ownerId: rmUser.id,
        agentId: rmUser.id,
        duration: s.duration,
        participants: JSON.stringify(s.participants),
        followupRequired: s.followupRequired,
        followupDate: followupDate,
        followupOwnerId: s.followupRequired ? rmUser.id : null,
        followupAction: s.followupAction || null,
        followupPriority: (s.followupPriority as any) || 'MEDIUM',
        followupTaskId: createdTaskId,
        linkedOpportunityId: s.opp?.id || null,
        linkedCaseId: s.caseItem?.id || null,
        linkedTaskId: createdTaskId,
        linkedOnboardingId: s.onb?.id || null,
        createdBy: rmUser.id,
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    // Insert participants
    for (const p of s.participants) {
      await db.insert(interactionParticipants).values({
        interactionId: inter.id,
        participantType: p.type as any,
        name: p.name,
        role: p.role,
        attended: p.attended,
      });
    }

    // Insert links
    if (s.opp) {
      await db.insert(interactionLinks).values({
        interactionId: inter.id,
        linkType: 'OPPORTUNITY',
        linkId: String(s.opp.id),
        title: s.opp.title,
      });
    }
    if (s.caseItem) {
      await db.insert(interactionLinks).values({
        interactionId: inter.id,
        linkType: 'CASE',
        linkId: String(s.caseItem.id),
        title: s.caseItem.subject,
      });
    }
    if (s.onb) {
      await db.insert(interactionLinks).values({
        interactionId: inter.id,
        linkType: 'ONBOARDING_APPLICATION',
        linkId: String(s.onb.id),
        title: s.onb.applicantName,
      });
    }

    // Insert commitments
    for (const c of s.commitments) {
      const cDueDate = new Date(timestamp);
      cDueDate.setDate(cDueDate.getDate() + c.dueDays);
      await db.insert(interactionCommitments).values({
        interactionId: inter.id,
        commitmentType: c.type,
        description: c.desc,
        ownerName: c.type === 'CUSTOMER_COMMITMENT' ? s.customer.name : rmUser.name,
        dueDate: cDueDate,
        status: cDueDate < new Date() ? 'COMPLETED' : 'PENDING',
        completedAt: cDueDate < new Date() ? cDueDate : null,
      });
    }
  }

  console.log('Phase 24 interactions seeded successfully!');
}
