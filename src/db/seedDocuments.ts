import { db } from './index.ts';
import {
  documents,
  documentVersions,
  documentRequirements,
  documentReviews,
  documentLinks,
  documentExtractions,
  customers,
  users,
  loans,
  serviceCases,
  opportunities,
  onboardingApplications,
} from './schema.ts';
import { sql } from 'drizzle-orm';
import { documentStorage } from '../services/storage/documentStorage.ts';

export async function seedPhase25Documents() {
  console.log('Checking Phase 25 Banking Document Intelligence seed data...');

  const allCustomers = await db.select().from(customers).limit(10);
  const allUsers = await db.select().from(users);
  const allLoans = await db.select().from(loans).limit(5);
  const allCases = await db.select().from(serviceCases).limit(5);
  const allOpps = await db.select().from(opportunities).limit(5);
  const allOnb = await db.select().from(onboardingApplications).limit(5);

  if (allCustomers.length === 0 || allUsers.length === 0) {
    console.log('Customers or users not available for seeding documents.');
    return;
  }

  const existingCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(documents);

  if ((existingCount[0]?.count || 0) >= 10) {
    console.log('Documents already seeded (count >= 10). Skipping seed.');
    return;
  }

  const rmUser = allUsers.find((u) => u.role === 'RM') || allUsers[0];
  const opsUser =
    allUsers.find((u) => u.role === 'OPERATIONS' || u.role === 'ADMIN') || allUsers[1] || allUsers[0];

  const c1 = allCustomers[0]; // e.g. Rahul Sharma
  const c2 = allCustomers[1] || allCustomers[0]; // e.g. Priya Nair
  const c3 = allCustomers[2] || allCustomers[0]; // e.g. Rajesh Patel
  const c4 = allCustomers[3] || allCustomers[0]; // e.g. Anita Desai
  const c5 = allCustomers[4] || allCustomers[0]; // Corporate entity

  const today = new Date();
  const pastDays = (d: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() - d);
    return dt;
  };
  const futureDays = (d: number) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  };

  const seedDocs = [
    // 1. Rahul Sharma: PAN Card (Verified)
    {
      code: 'DOC-2026-004821',
      docType: 'PAN',
      category: 'IDENTITY',
      customer: c1,
      fileName: 'rahul_sharma_pan_card.pdf',
      fileSize: '1.4 MB',
      status: 'VERIFIED',
      reviewStatus: 'APPROVED',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(45),
      reviewedBy: opsUser,
      reviewedAt: pastDays(44),
      expiryDate: null,
      description: 'Permanent Account Number identity card verified via NSDL synthetic API.',
      extractions: [
        { field: 'Permanent Account Number', value: 'ABCPS4928K', confidence: '0.99', status: 'HUMAN_VERIFIED' },
        { field: 'Name on Document', value: c1.name.toUpperCase(), confidence: '0.98', status: 'HUMAN_VERIFIED' },
        { field: 'Date of Birth', value: '14/08/1984', confidence: '0.96', status: 'HUMAN_VERIFIED' },
      ],
      reviews: [
        {
          reviewer: opsUser,
          decision: 'VERIFIED',
          comments: 'High resolution scan. Name and synthetic PAN details match core KYC database.',
          reviewedAt: pastDays(44),
        },
      ],
    },

    // 2. Rahul Sharma: Salary Slip (Under Review / Extraction pending)
    {
      code: 'DOC-2026-004822',
      docType: 'Salary Slip',
      category: 'FINANCIAL',
      customer: c1,
      fileName: 'salary_slip_august_2026.pdf',
      fileSize: '2.1 MB',
      status: 'UNDER_REVIEW',
      reviewStatus: 'PENDING',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(2),
      reviewedBy: null,
      reviewedAt: null,
      expiryDate: null,
      relatedType: 'LOAN',
      relatedId: allLoans[0]?.id ? `LOAN-${allLoans[0].id}` : 'LOAN-2026-00841',
      description: 'Monthly salary slip submitted for Home Loan top-up underwriting assessment.',
      extractions: [
        { field: 'Employer Name', value: 'Infosys BPM Technologies', confidence: '0.95', status: 'NOT_VERIFIED' },
        { field: 'Gross Salary', value: '₹2,45,000 / month', confidence: '0.97', status: 'NOT_VERIFIED' },
        { field: 'Net Inhand', value: '₹1,88,400 / month', confidence: '0.96', status: 'NOT_VERIFIED' },
        { field: 'Pay Period', value: 'August 2026', confidence: '0.99', status: 'NOT_VERIFIED' },
      ],
    },

    // 3. Rahul Sharma: Electricity Bill / Address Proof (Replacement Required)
    {
      code: 'DOC-2026-004823',
      docType: 'Utility Bill',
      category: 'ADDRESS',
      customer: c1,
      fileName: 'bescom_electricity_bill_older.pdf',
      fileSize: '980 KB',
      status: 'REPLACEMENT_REQUIRED',
      reviewStatus: 'REPLACEMENT_REQUESTED',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(10),
      reviewedBy: opsUser,
      reviewedAt: pastDays(8),
      replacementRequired: true,
      replacementReason: 'Utility bill is older than 90 days. Bank KYC compliance policy mandates statement dated within past 3 months.',
      replacementDocType: 'Current Utility Bill (< 90 Days)',
      replacementDueDate: futureDays(7),
      description: 'Address proof submitted for residential verification.',
      reviews: [
        {
          reviewer: opsUser,
          decision: 'REPLACEMENT_REQUESTED',
          comments: 'Bill dated February 2026 exceeds the permissible 3-month freshness threshold for tier-1 credit underwriting.',
          rejectionReason: 'Utility bill older than 90 days',
          replacementDocType: 'Current Utility Bill (< 90 Days)',
          replacementDueDate: futureDays(7),
          reviewedAt: pastDays(8),
        },
      ],
    },

    // 4. Priya Nair: Passport (Expired)
    {
      code: 'DOC-2026-004824',
      docType: 'Passport',
      category: 'IDENTITY',
      customer: c2,
      fileName: 'priya_nair_passport_expired.pdf',
      fileSize: '3.2 MB',
      status: 'EXPIRED',
      reviewStatus: 'REJECTED',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(120),
      reviewedBy: opsUser,
      reviewedAt: pastDays(119),
      expiryDate: pastDays(15).toISOString().split('T')[0],
      rejectionReason: 'Passport validity expired on ' + pastDays(15).toISOString().split('T')[0] + '. Customer must submit renewed passport booklet.',
      description: 'NRI/HNI identity proof for overseas remittances.',
      reviews: [
        {
          reviewer: opsUser,
          decision: 'REJECTED',
          comments: 'Validity lapsed. Renewal required immediately for outbound FEMA remittance compliance.',
          rejectionReason: 'Passport expired',
          reviewedAt: pastDays(119),
        },
      ],
    },

    // 5. Priya Nair: Bank Statement (Verified - Version 2)
    {
      code: 'DOC-2026-004825',
      docType: 'Bank Statement',
      category: 'FINANCIAL',
      customer: c2,
      fileName: 'hdfc_bank_statement_6m_certified.pdf',
      fileSize: '4.8 MB',
      status: 'VERIFIED',
      reviewStatus: 'APPROVED',
      version: 2,
      uploadedBy: rmUser,
      uploadedAt: pastDays(5),
      reviewedBy: opsUser,
      reviewedAt: pastDays(4),
      expiryDate: null,
      relatedType: 'OPPORTUNITY',
      relatedId: allOpps[0]?.id ? `OPP-${allOpps[0].id}` : 'OPP-2026-00219',
      description: '6-Month certified bank account statement reflecting high-net-worth liquidity.',
      extractions: [
        { field: 'Bank Name', value: 'HDFC Bank Ltd', confidence: '0.98', status: 'HUMAN_VERIFIED' },
        { field: 'Average Quarterly Balance', value: '₹18,50,000', confidence: '0.94', status: 'HUMAN_VERIFIED' },
        { field: 'Closing Balance', value: '₹34,12,800', confidence: '0.99', status: 'HUMAN_VERIFIED' },
      ],
      reviews: [
        {
          reviewer: opsUser,
          decision: 'VERIFIED',
          comments: 'Bank branch seal and synthetic digital verification signature validated.',
          reviewedAt: pastDays(4),
        },
      ],
      versions: [
        {
          version: 1,
          fileName: 'hdfc_bank_statement_unverified.pdf',
          fileSize: '3.1 MB',
          status: 'REJECTED',
          reviewStatus: 'REJECTED',
          changeReason: 'Initial upload omitted transaction pages 4 through 8.',
          uploadedAt: pastDays(12),
        },
      ],
    },

    // 6. Rajesh Patel: Loan Agreement (Verified)
    {
      code: 'DOC-2026-004826',
      docType: 'Loan Agreement',
      category: 'BANKING',
      customer: c3,
      fileName: 'term_loan_master_agreement_executed.pdf',
      fileSize: '5.6 MB',
      status: 'VERIFIED',
      reviewStatus: 'APPROVED',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(18),
      reviewedBy: opsUser,
      reviewedAt: pastDays(17),
      relatedType: 'LOAN',
      relatedId: allLoans[1]?.id ? `LOAN-${allLoans[1].id}` : 'LOAN-2026-00392',
      description: 'Fully signed and franked commercial loan facility agreement.',
      extractions: [
        { field: 'Facility Amount', value: '₹1,50,00,000', confidence: '0.99', status: 'HUMAN_VERIFIED' },
        { field: 'Interest Rate', value: '9.25% p.a. (Floating Repo Linked)', confidence: '0.97', status: 'HUMAN_VERIFIED' },
        { field: 'Tenure', value: '84 Months', confidence: '0.98', status: 'HUMAN_VERIFIED' },
      ],
      reviews: [
        {
          reviewer: opsUser,
          decision: 'VERIFIED',
          comments: 'Franking stamp duty of ₹30,000 verified. Signatures matched with board resolution.',
          reviewedAt: pastDays(17),
        },
      ],
    },

    // 7. Rajesh Patel: Driving Licence (Expiring in 18 Days)
    {
      code: 'DOC-2026-004827',
      docType: 'Driving Licence',
      category: 'IDENTITY',
      customer: c3,
      fileName: 'rajesh_patel_driving_licence.pdf',
      fileSize: '1.1 MB',
      status: 'VERIFIED',
      reviewStatus: 'APPROVED',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(60),
      reviewedBy: opsUser,
      reviewedAt: pastDays(59),
      expiryDate: futureDays(18),
      description: 'Secondary KYC identity proof. Scheduled for automated expiration notice.',
    },

    // 8. Anita Desai: Incorporation Certificate (Business - Verified)
    {
      code: 'DOC-2026-004828',
      docType: 'Incorporation Certificate',
      category: 'BUSINESS',
      customer: c4,
      fileName: 'desai_enterprises_certificate_of_incorporation.pdf',
      fileSize: '2.8 MB',
      status: 'VERIFIED',
      reviewStatus: 'APPROVED',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(25),
      reviewedBy: opsUser,
      reviewedAt: pastDays(24),
      relatedType: 'ONBOARDING',
      relatedId: allOnb[0]?.id ? `ONB-${allOnb[0].id}` : 'ONB-2026-00182',
      description: 'Ministry of Corporate Affairs (MCA) certificate of incorporation for corporate account.',
      extractions: [
        { field: 'Corporate Identification Number (CIN)', value: 'U72200MH2021PTC368412', confidence: '0.99', status: 'HUMAN_VERIFIED' },
        { field: 'Company Name', value: 'Desai Tech Enterprises Private Limited', confidence: '0.98', status: 'HUMAN_VERIFIED' },
        { field: 'Date of Incorporation', value: '18/11/2021', confidence: '0.96', status: 'HUMAN_VERIFIED' },
      ],
      reviews: [
        {
          reviewer: opsUser,
          decision: 'VERIFIED',
          comments: 'MCA portal digital signature validated. Status ACTIVE.',
          reviewedAt: pastDays(24),
        },
      ],
    },

    // 9. Anita Desai: GST Certificate (Business - Under Review)
    {
      code: 'DOC-2026-004829',
      docType: 'GST Certificate',
      category: 'BUSINESS',
      customer: c4,
      fileName: 'gst_registration_form_reg06.pdf',
      fileSize: '1.7 MB',
      status: 'UNDER_REVIEW',
      reviewStatus: 'UNDER_REVIEW',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(1),
      reviewedBy: null,
      reviewedAt: null,
      relatedType: 'CASE',
      relatedId: allCases[0]?.id ? `CASE-${allCases[0].id}` : 'CASE-2026-00491',
      description: 'Form GST REG-06 submitted to update business tax registration records on current account.',
      extractions: [
        { field: 'GSTIN', value: '27AABCD8842E1Z9', confidence: '0.97', status: 'NOT_VERIFIED' },
        { field: 'Legal Name', value: 'Desai Tech Enterprises Private Limited', confidence: '0.96', status: 'NOT_VERIFIED' },
        { field: 'Principal Place of Business', value: 'Nariman Point, Mumbai 400021', confidence: '0.92', status: 'NOT_VERIFIED' },
      ],
    },

    // 10. Corporate Customer / C5: Board Resolution (Verified)
    {
      code: 'DOC-2026-004830',
      docType: 'Board Resolution',
      category: 'BUSINESS',
      customer: c5,
      fileName: 'board_resolution_banking_authorizations_2026.pdf',
      fileSize: '3.4 MB',
      status: 'VERIFIED',
      reviewStatus: 'APPROVED',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(30),
      reviewedBy: opsUser,
      reviewedAt: pastDays(29),
      description: 'Certified true copy of board resolution authorizing banking signatory limits and forex derivatives.',
      extractions: [
        { field: 'Authorized Signatory 1', value: 'Vikram Mehta (Managing Director)', confidence: '0.98', status: 'HUMAN_VERIFIED' },
        { field: 'Authorized Signatory 2', value: 'Sangeeta Rao (Chief Financial Officer)', confidence: '0.97', status: 'HUMAN_VERIFIED' },
        { field: 'Signing Limit', value: 'Joint Signatures up to ₹10,00,00,000', confidence: '0.95', status: 'HUMAN_VERIFIED' },
      ],
      reviews: [
        {
          reviewer: opsUser,
          decision: 'VERIFIED',
          comments: 'Company Secretary digital signature and company seal verified.',
          reviewedAt: pastDays(29),
        },
      ],
    },

    // 11. C5: Tax Audit Report (Financial - Under Review)
    {
      code: 'DOC-2026-004831',
      docType: 'Tax Document',
      category: 'FINANCIAL',
      customer: c5,
      fileName: 'form_3cd_tax_audit_report_fy2526.pdf',
      fileSize: '8.2 MB',
      status: 'UNDER_REVIEW',
      reviewStatus: 'PENDING',
      version: 1,
      uploadedBy: rmUser,
      uploadedAt: pastDays(3),
      reviewedBy: null,
      reviewedAt: null,
      description: 'Form 3CD Chartered Accountant Tax Audit Report for annual credit limit renewal.',
    },
  ];

  for (const item of seedDocs) {
    // Generate synthetic buffer & storage key
    const synthetic = documentStorage.generateSyntheticDocumentContent({
      documentCode: item.code,
      documentType: item.docType,
      customerName: item.customer.name,
      customerCode: item.customer.customerCode,
      version: item.version,
    });

    const saved = await documentStorage.saveFile({
      documentCode: item.code,
      version: item.version,
      fileName: item.fileName,
      mimeType: 'application/pdf',
      buffer: synthetic.buffer,
    });

    // Insert Document
    const [doc] = await db
      .insert(documents)
      .values({
        documentCode: item.code,
        documentType: item.docType,
        category: item.category,
        customerId: item.customer.id,
        customerName: item.customer.name,
        relatedEntityType: item.relatedType || 'CUSTOMER',
        relatedEntityId: item.relatedId || null,
        fileName: item.fileName,
        fileSize: item.fileSize,
        mimeType: 'application/pdf',
        storageKey: saved.storageKey,
        version: item.version,
        status: item.status,
        reviewStatus: item.reviewStatus,
        uploadedById: item.uploadedBy.id,
        uploadedByName: item.uploadedBy.name,
        uploadedAt: item.uploadedAt,
        reviewedById: item.reviewedBy ? item.reviewedBy.id : null,
        reviewedByName: item.reviewedBy ? item.reviewedBy.name : null,
        reviewedAt: item.reviewedAt || null,
        expiryDate: item.expiryDate || null,
        rejectionReason: item.rejectionReason || null,
        replacementRequired: !!item.replacementRequired,
        replacementReason: item.replacementReason || null,
        replacementDocType: item.replacementDocType || null,
        replacementDueDate: item.replacementDueDate || null,
        visibility: 'INTERNAL',
        description: item.description,
        isSynthetic: true,
        createdAt: item.uploadedAt,
        updatedAt: item.reviewedAt || item.uploadedAt,
      })
      .returning();

    // Insert Version 1 or previous versions
    if (item.versions && item.versions.length > 0) {
      for (const v of item.versions) {
        await db.insert(documentVersions).values({
          documentId: doc.id,
          version: v.version,
          fileName: v.fileName,
          fileSize: v.fileSize,
          mimeType: 'application/pdf',
          storageKey: `vault/${item.code}/v${v.version}_${v.fileName}`,
          status: v.status,
          reviewStatus: v.reviewStatus,
          uploadedById: item.uploadedBy.id,
          uploadedByName: item.uploadedBy.name,
          uploadedAt: v.uploadedAt,
          changeReason: v.changeReason,
          createdAt: v.uploadedAt,
        });
      }
    }

    // Insert current version
    await db.insert(documentVersions).values({
      documentId: doc.id,
      version: item.version,
      fileName: item.fileName,
      fileSize: item.fileSize,
      mimeType: 'application/pdf',
      storageKey: saved.storageKey,
      status: item.status,
      reviewStatus: item.reviewStatus,
      uploadedById: item.uploadedBy.id,
      uploadedByName: item.uploadedBy.name,
      uploadedAt: item.uploadedAt,
      changeReason: item.version > 1 ? 'Updated version with all required pages' : 'Initial upload',
      createdAt: item.uploadedAt,
    });

    // Insert Reviews
    if (item.reviews) {
      for (const rev of (item.reviews as any[])) {
        await db.insert(documentReviews).values({
          documentId: doc.id,
          version: item.version,
          reviewerId: rev.reviewer.id,
          reviewerName: rev.reviewer.name,
          decision: rev.decision,
          comments: rev.comments,
          rejectionReason: rev.rejectionReason || null,
          replacementDocType: rev.replacementDocType || null,
          replacementDueDate: rev.replacementDueDate || null,
          reviewedAt: rev.reviewedAt,
          createdAt: rev.reviewedAt,
        });
      }
    }

    // Insert Extractions
    if (item.extractions) {
      for (const ext of item.extractions) {
        await db.insert(documentExtractions).values({
          documentId: doc.id,
          version: item.version,
          fieldName: ext.field,
          extractedValue: ext.value,
          confidence: ext.confidence,
          verificationStatus: ext.status,
          verifiedById: ext.status === 'HUMAN_VERIFIED' ? opsUser.id : null,
          verifiedByName: ext.status === 'HUMAN_VERIFIED' ? opsUser.name : null,
          verifiedAt: ext.status === 'HUMAN_VERIFIED' ? pastDays(1) : null,
          createdAt: item.uploadedAt,
          updatedAt: item.uploadedAt,
        });
      }
    }

    // Insert CRM link
    if (item.relatedId && item.relatedType) {
      await db.insert(documentLinks).values({
        documentId: doc.id,
        entityType: item.relatedType,
        entityId: item.relatedId,
        entityTitle: `${item.relatedType} #${item.relatedId}`,
        relationship: 'SUPPORTING_DOCUMENT',
        createdById: item.uploadedBy.id,
        createdAt: item.uploadedAt,
      });
    }
  }

  // Seed standard Document Requirements for each customer
  const seededRequirements = [
    // Rahul Sharma (c1)
    { customer: c1, type: 'PAN', cat: 'IDENTITY', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0001' },
    { customer: c1, type: 'Photograph', cat: 'IDENTITY', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0002' },
    { customer: c1, type: 'Address Proof', cat: 'ADDRESS', mandatory: true, status: 'REPLACEMENT_REQUIRED', code: 'REQ-2026-0003', notes: 'Replacement requested for utility bill > 90 days', due: futureDays(7) },
    { customer: c1, type: 'Income Proof / Salary Slip', cat: 'FINANCIAL', mandatory: false, status: 'SUBMITTED', code: 'REQ-2026-0004' },
    { customer: c1, type: 'Bank Statement (6 Months)', cat: 'FINANCIAL', mandatory: false, status: 'MISSING', code: 'REQ-2026-0005', due: futureDays(14) },

    // Priya Nair (c2)
    { customer: c2, type: 'Passport', cat: 'IDENTITY', mandatory: true, status: 'REPLACEMENT_REQUIRED', code: 'REQ-2026-0006', notes: 'Passport expired; renewal copy required' },
    { customer: c2, type: 'Overseas Address Proof', cat: 'ADDRESS', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0007' },
    { customer: c2, type: 'Bank Statement (6 Months)', cat: 'FINANCIAL', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0008' },

    // Rajesh Patel (c3)
    { customer: c3, type: 'PAN', cat: 'IDENTITY', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0009' },
    { customer: c3, type: 'Driving Licence', cat: 'IDENTITY', mandatory: false, status: 'VERIFIED', code: 'REQ-2026-0010' },
    { customer: c3, type: 'Loan Agreement', cat: 'BANKING', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0011' },

    // Anita Desai (c4)
    { customer: c4, type: 'Incorporation Certificate', cat: 'BUSINESS', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0012' },
    { customer: c4, type: 'GST Certificate', cat: 'BUSINESS', mandatory: true, status: 'SUBMITTED', code: 'REQ-2026-0013' },
    { customer: c4, type: 'Board Resolution', cat: 'BUSINESS', mandatory: true, status: 'MISSING', code: 'REQ-2026-0014', due: futureDays(10) },

    // Corporate (c5)
    { customer: c5, type: 'Board Resolution', cat: 'BUSINESS', mandatory: true, status: 'VERIFIED', code: 'REQ-2026-0015' },
    { customer: c5, type: 'Tax Audit Report', cat: 'FINANCIAL', mandatory: true, status: 'SUBMITTED', code: 'REQ-2026-0016' },
    { customer: c5, type: 'Annual Financial Statements', cat: 'FINANCIAL', mandatory: true, status: 'MISSING', code: 'REQ-2026-0017', due: futureDays(21) },
  ];

  for (const req of seededRequirements) {
    await db.insert(documentRequirements).values({
      requirementCode: req.code,
      customerId: req.customer.id,
      relatedEntityType: 'CUSTOMER',
      documentType: req.type,
      category: req.cat,
      isMandatory: req.mandatory,
      status: req.status,
      notes: req.notes || null,
      dueDate: req.due || null,
      createdAt: pastDays(30),
      updatedAt: pastDays(5),
    });
  }

  console.log('Phase 25 Banking Document Intelligence seeded successfully!');
}
