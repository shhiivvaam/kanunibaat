/**
 * Core domain tables (Phase 2–3). Better Auth `user` remains the identity anchor (`user.id`).
 */
import { relations, sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { user } from './auth';

export const kbUserRoleEnum = pgEnum('kb_user_role', ['user', 'lawyer', 'admin']);

export const lawyerVerificationStatusEnum = pgEnum('lawyer_verification_status', [
  'draft',
  'pending',
  'verified',
  'rejected',
]);

export const lawyerDocumentKindEnum = pgEnum('lawyer_document_kind', [
  'enrollment_certificate',
  'government_id',
]);

export const userProfile = pgTable('user_profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  locale: text('locale').notNull().default('en'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const userRole = pgTable(
  'user_role',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: kbUserRoleEnum('role').notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.role] })],
);

export const lawyerProfile = pgTable('lawyer_profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  slug: text('slug').notNull().unique(),
  barState: text('bar_state'),
  enrollmentNumber: text('enrollment_number'),
  headline: text('headline').notNull().default(''),
  bio: text('bio').notNull().default(''),
  city: text('city'),
  practiceAreas: jsonb('practice_areas').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  languages: jsonb('languages').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  yearsExperience: integer('years_experience'),
  verificationStatus: lawyerVerificationStatusEnum('verification_status').notNull().default('draft'),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerDocument = pgTable('lawyer_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  kind: lawyerDocumentKindEnum('kind').notNull(),
  storageKey: text('storage_key').notNull(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerAvailability = pgTable('lawyer_availability', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startMinute: integer('start_minute').notNull(),
  endMinute: integer('end_minute').notNull(),
  timezone: text('timezone').notNull().default('Asia/Kolkata'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const noticeScanStatusEnum = pgEnum('notice_scan_status', [
  'uploaded',
  'processing',
  'completed',
  'failed',
]);

export const noticeScan = pgTable('notice_scan', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  accessToken: uuid('access_token').notNull().defaultRandom().unique(),
  anonKey: text('anon_key'),
  storageKey: text('storage_key').notNull(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true, mode: 'date' }),
  status: noticeScanStatusEnum('status').notNull().default('uploaded'),
  ocrText: text('ocr_text'),
  noticeType: text('notice_type'),
  issuingAuthority: text('issuing_authority'),
  isLikelyGenuine: integer('is_likely_genuine'), // 1=true, 0=false, null=unknown
  deadlineDate: timestamp('deadline_date', { withTimezone: true, mode: 'date' }),
  amountInr: integer('amount_inr'),
  aiSummary: text('ai_summary'),
  recommendedActions: jsonb('recommended_actions').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  recommendedLawyerType: text('recommended_lawyer_type'),
  locale: text('locale').notNull().default('en'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const consultationModeEnum = pgEnum('consultation_mode', ['chat', 'audio', 'video']);

export const consultationStatusEnum = pgEnum('consultation_status', [
  'pending_payment',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
  'disputed',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'created',
  'paid',
  'failed',
  'refunded',
  'released',
]);

export const consultation = pgTable('consultation', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lawyerUserId: text('lawyer_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  mode: consultationModeEnum('mode').notNull(),
  status: consultationStatusEnum('status').notNull().default('pending_payment'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true, mode: 'date' }),
  issueSummary: text('issue_summary').notNull().default(''),
  amountInr: integer('amount_inr').notNull(),
  currency: text('currency').notNull().default('INR'),
  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
  endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id')
    .notNull()
    .references(() => consultation.id, { onDelete: 'cascade' }),
  status: paymentStatusEnum('status').notNull().default('created'),
  amountInr: integer('amount_inr').notNull(),
  currency: text('currency').notNull().default('INR'),
  razorpayOrderId: text('razorpay_order_id').unique(),
  razorpayPaymentId: text('razorpay_payment_id').unique(),
  razorpaySignature: text('razorpay_signature'),
  paidAt: timestamp('paid_at', { withTimezone: true, mode: 'date' }),
  releasedAt: timestamp('released_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const consultationMessage = pgTable('consultation_message', {
  id: uuid('id').primaryKey().defaultRandom(),
  consultationId: uuid('consultation_id')
    .notNull()
    .references(() => consultation.id, { onDelete: 'cascade' }),
  senderUserId: text('sender_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const vaultDocumentCategoryEnum = pgEnum('vault_document_category', [
  'property',
  'family',
  'financial',
  'wills',
  'employment',
  'court',
  'identity',
  'rental',
  'business',
  'insurance',
  'other',
]);

export const vaultDocumentUploadStatusEnum = pgEnum('vault_document_upload_status', ['pending', 'complete']);

export const vaultFolder = pgTable('vault_folder', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  parentFolderId: uuid('parent_folder_id').references((): AnyPgColumn => vaultFolder.id, {
    onDelete: 'cascade',
  }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const vaultDocument = pgTable('vault_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  folderId: uuid('folder_id').references(() => vaultFolder.id, { onDelete: 'set null' }),
  category: vaultDocumentCategoryEnum('category').notNull().default('other'),
  displayName: text('display_name').notNull(),
  tags: jsonb('tags').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  storageKey: text('storage_key').notNull(),
  byteSize: integer('byte_size').notNull().default(0),
  contentType: text('content_type').notNull().default('application/octet-stream'),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }),
  uploadStatus: vaultDocumentUploadStatusEnum('upload_status').notNull().default('pending'),
  /** PBKDF2 salt (base64) for passphrase-derived wrapping key; set when upload completes. */
  keyWrapSalt: text('key_wrap_salt'),
  /** AES-GCM wrapped DEK (base64: iv + ciphertext + tag); set when upload completes. */
  wrappedDek: text('wrapped_dek'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const vaultShare = pgTable('vault_share', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id')
    .notNull()
    .references(() => vaultDocument.id, { onDelete: 'cascade' }),
  accessToken: uuid('access_token').notNull().unique().defaultRandom(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerCourtTypeEnum = pgEnum('lawyer_court_type', [
  'district',
  'high_court',
  'supreme_court',
  'tribunal',
  'other',
]);

export const lawyerCaseStatusEnum = pgEnum('lawyer_case_status', [
  'intake',
  'active',
  'hearing_scheduled',
  'pending_docs',
  'judgement',
  'closed',
  'appealed',
]);

export const lawyerCaseTaskPriorityEnum = pgEnum('lawyer_case_task_priority', ['low', 'normal', 'high']);

export const lawyerCaseTaskStatusEnum = pgEnum('lawyer_case_task_status', ['open', 'done']);

export const lawyerCaseDocumentUploadStatusEnum = pgEnum('lawyer_case_document_upload_status', [
  'pending',
  'complete',
]);

export const lawyerClient = pgTable('lawyer_client', {
  id: uuid('id').primaryKey().defaultRandom(),
  lawyerUserId: text('lawyer_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  platformUserId: text('platform_user_id').references(() => user.id, { onDelete: 'set null' }),
  displayName: text('display_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes').notNull().default(''),
  referralSource: text('referral_source'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerCaseOutcomeEnum = pgEnum('lawyer_case_outcome', [
  'unknown',
  'won',
  'lost',
  'settled',
  'withdrawn',
]);

export const lawyerCase = pgTable('lawyer_case', {
  id: uuid('id').primaryKey().defaultRandom(),
  lawyerUserId: text('lawyer_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  lawyerClientId: uuid('lawyer_client_id').references(() => lawyerClient.id, { onDelete: 'set null' }),
  clientDisplayName: text('client_display_name'),
  courtCaseNumber: text('court_case_number'),
  cnrNumber: text('cnr_number'),
  courtName: text('court_name').notNull().default(''),
  courtType: lawyerCourtTypeEnum('court_type').notNull().default('other'),
  state: text('state').notNull().default(''),
  district: text('district').notNull().default(''),
  caseType: text('case_type').notNull().default(''),
  description: text('description').notNull().default(''),
  status: lawyerCaseStatusEnum('status').notNull().default('intake'),
  opposingParty: text('opposing_party'),
  nextHearingAt: timestamp('next_hearing_at', { withTimezone: true, mode: 'date' }),
  feeAgreedInr: integer('fee_agreed_inr'),
  outcome: text('outcome'),
  caseOutcome: lawyerCaseOutcomeEnum('case_outcome').notNull().default('unknown'),
  closedAt: timestamp('closed_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerCaseHearing = pgTable('lawyer_case_hearing', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id')
    .notNull()
    .references(() => lawyerCase.id, { onDelete: 'cascade' }),
  hearingAt: timestamp('hearing_at', { withTimezone: true, mode: 'date' }).notNull(),
  courtRoom: text('court_room'),
  judgeName: text('judge_name'),
  whatHappened: text('what_happened'),
  nextHearingAt: timestamp('next_hearing_at', { withTimezone: true, mode: 'date' }),
  actionItems: jsonb('action_items').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerCaseTask = pgTable('lawyer_case_task', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id')
    .notNull()
    .references(() => lawyerCase.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true, mode: 'date' }),
  priority: lawyerCaseTaskPriorityEnum('priority').notNull().default('normal'),
  status: lawyerCaseTaskStatusEnum('task_status').notNull().default('open'),
  assigneeUserId: text('assignee_user_id').references(() => user.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerCaseDocument = pgTable('lawyer_case_document', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id')
    .notNull()
    .references(() => lawyerCase.id, { onDelete: 'cascade' }),
  uploadedByUserId: text('uploaded_by_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  storageKey: text('storage_key').notNull(),
  fileName: text('file_name').notNull(),
  contentType: text('content_type').notNull(),
  byteSize: integer('byte_size').notNull().default(0),
  visibleToClient: boolean('visible_to_client').notNull().default(false),
  uploadStatus: lawyerCaseDocumentUploadStatusEnum('upload_status').notNull().default('pending'),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/** Phase 10: GST / firm details for invoices (one row per lawyer user). */
export const lawyerFirmProfile = pgTable('lawyer_firm_profile', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  legalName: text('legal_name').notNull().default(''),
  addressLine1: text('address_line1').notNull().default(''),
  addressLine2: text('address_line2').notNull().default(''),
  city: text('city').notNull().default(''),
  stateCode: text('state_code').notNull().default(''),
  pincode: text('pincode').notNull().default(''),
  gstin: text('gstin'),
  pan: text('pan'),
  defaultHsnSac: text('default_hsn_sac').notNull().default('998212'),
  invoicePrefix: text('invoice_prefix').notNull().default('INV'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerInvoiceCounter = pgTable(
  'lawyer_invoice_counter',
  {
    lawyerUserId: text('lawyer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fyStartYear: integer('fy_start_year').notNull(),
    lastSequence: integer('last_sequence').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.lawyerUserId, t.fyStartYear] })],
);

export const lawyerInvoiceStatusEnum = pgEnum('lawyer_invoice_status', [
  'draft',
  'sent',
  'partially_paid',
  'paid',
  'void',
]);

export const lawyerInvoiceSupplyTypeEnum = pgEnum('lawyer_invoice_supply_type', ['intrastate', 'interstate']);

export const lawyerInvoiceLineKindEnum = pgEnum('lawyer_invoice_line_kind', [
  'consultation',
  'hearing',
  'drafting',
  'time',
  'misc',
]);

export const lawyerInvoicePaymentStatusEnum = pgEnum('lawyer_invoice_payment_status', [
  'created',
  'paid',
  'failed',
]);

export const lawyerInvoice = pgTable(
  'lawyer_invoice',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lawyerUserId: text('lawyer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    caseId: uuid('case_id').references(() => lawyerCase.id, { onDelete: 'set null' }),
    consultationId: uuid('consultation_id').references(() => consultation.id, { onDelete: 'set null' }),
    invoiceNumber: text('invoice_number').notNull(),
    status: lawyerInvoiceStatusEnum('status').notNull().default('draft'),
    supplyType: lawyerInvoiceSupplyTypeEnum('supply_type').notNull().default('intrastate'),
    clientName: text('client_name').notNull().default(''),
    clientEmail: text('client_email'),
    clientGstin: text('client_gstin'),
    clientAddress: text('client_address').notNull().default(''),
    placeOfSupply: text('place_of_supply').notNull().default(''),
    taxableInr: integer('taxable_inr').notNull().default(0),
    cgstInr: integer('cgst_inr').notNull().default(0),
    sgstInr: integer('sgst_inr').notNull().default(0),
    igstInr: integer('igst_inr').notNull().default(0),
    totalInr: integer('total_inr').notNull().default(0),
    currency: text('currency').notNull().default('INR'),
    issueDate: date('issue_date', { mode: 'date' }).notNull(),
    dueDate: date('due_date', { mode: 'date' }),
    notes: text('notes').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('lawyer_invoice_number_uidx').on(t.lawyerUserId, t.invoiceNumber)],
);

export const lawyerInvoiceLine = pgTable('lawyer_invoice_line', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => lawyerInvoice.id, { onDelete: 'cascade' }),
  kind: lawyerInvoiceLineKindEnum('kind').notNull().default('misc'),
  description: text('description').notNull(),
  quantity: doublePrecision('quantity').notNull().default(1),
  unitRateInr: integer('unit_rate_inr').notNull(),
  taxRatePercent: integer('tax_rate_percent').notNull().default(18),
  taxableInr: integer('taxable_inr').notNull(),
  hsnSac: text('hsn_sac'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const lawyerTimeEntry = pgTable(
  'lawyer_time_entry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    lawyerUserId: text('lawyer_user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    caseId: uuid('case_id')
      .notNull()
      .references(() => lawyerCase.id, { onDelete: 'cascade' }),
    taskId: uuid('task_id').references(() => lawyerCaseTask.id, { onDelete: 'set null' }),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true, mode: 'date' }),
    durationSeconds: integer('duration_seconds'),
    notes: text('notes').notNull().default(''),
    billedInvoiceId: uuid('billed_invoice_id').references(() => lawyerInvoice.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
);

export const lawyerInvoicePayment = pgTable('lawyer_invoice_payment', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: uuid('invoice_id')
    .notNull()
    .references(() => lawyerInvoice.id, { onDelete: 'cascade' }),
  amountInr: integer('amount_inr').notNull(),
  currency: text('currency').notNull().default('INR'),
  status: lawyerInvoicePaymentStatusEnum('status').notNull().default('created'),
  razorpayOrderId: text('razorpay_order_id').unique(),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpaySignature: text('razorpay_signature'),
  paidAt: timestamp('paid_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/** Curated judgment snippets for lawyer research (Phase 9). Sync to Meilisearch via admin reindex. */
export const researchJudgment = pgTable('research_judgment', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  court: text('court').notNull(),
  decisionAt: timestamp('decision_at', { withTimezone: true, mode: 'date' }),
  citation: text('citation').notNull(),
  summaryExcerpt: text('summary_excerpt').notNull().default(''),
  bodyForSearch: text('body_for_search').notNull().default(''),
  topics: jsonb('topics').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/** Central Acts metadata — law library (Phase 9). */
export const researchCentralAct = pgTable('research_central_act', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  shortTitle: text('short_title').notNull(),
  category: text('category').notNull(),
  year: integer('year'),
  sourceUrl: text('source_url').notNull().default(''),
  description: text('description').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/** IPC / CrPC / IEA → BNS / BNSS / BSA illustrative mappings (verify against official conversion tables in production). */
export const researchStatuteCrosswalk = pgTable(
  'research_statute_crosswalk',
  {
    sourceStatute: text('source_statute').notNull(),
    sourceSection: text('source_section').notNull(),
    targetStatute: text('target_statute').notNull(),
    targetSection: text('target_section').notNull(),
    note: text('note').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.sourceStatute, t.sourceSection, t.targetStatute] })],
);

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, { fields: [userProfile.userId], references: [user.id] }),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, { fields: [userRole.userId], references: [user.id] }),
}));

export const lawyerProfileRelations = relations(lawyerProfile, ({ one, many }) => ({
  user: one(user, { fields: [lawyerProfile.userId], references: [user.id] }),
  documents: many(lawyerDocument),
  availability: many(lawyerAvailability),
}));

export const lawyerDocumentRelations = relations(lawyerDocument, ({ one }) => ({
  user: one(user, { fields: [lawyerDocument.userId], references: [user.id] }),
  lawyerProfile: one(lawyerProfile, {
    fields: [lawyerDocument.userId],
    references: [lawyerProfile.userId],
  }),
}));

export const lawyerAvailabilityRelations = relations(lawyerAvailability, ({ one }) => ({
  user: one(user, { fields: [lawyerAvailability.userId], references: [user.id] }),
  lawyerProfile: one(lawyerProfile, {
    fields: [lawyerAvailability.userId],
    references: [lawyerProfile.userId],
  }),
}));

export const noticeScanRelations = relations(noticeScan, ({ one }) => ({
  user: one(user, { fields: [noticeScan.userId], references: [user.id] }),
}));

export const consultationRelations = relations(consultation, ({ one, many }) => ({
  user: one(user, { fields: [consultation.userId], references: [user.id] }),
  lawyer: one(user, { fields: [consultation.lawyerUserId], references: [user.id] }),
  payments: many(payment),
  messages: many(consultationMessage),
  invoices: many(lawyerInvoice),
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  consultation: one(consultation, { fields: [payment.consultationId], references: [consultation.id] }),
}));

export const consultationMessageRelations = relations(consultationMessage, ({ one }) => ({
  consultation: one(consultation, { fields: [consultationMessage.consultationId], references: [consultation.id] }),
  sender: one(user, { fields: [consultationMessage.senderUserId], references: [user.id] }),
}));

export const vaultFolderRelations = relations(vaultFolder, ({ one, many }) => ({
  user: one(user, { fields: [vaultFolder.userId], references: [user.id] }),
  parent: one(vaultFolder, {
    fields: [vaultFolder.parentFolderId],
    references: [vaultFolder.id],
    relationName: 'vault_folder_parent',
  }),
  children: many(vaultFolder, { relationName: 'vault_folder_parent' }),
  documents: many(vaultDocument),
}));

export const vaultDocumentRelations = relations(vaultDocument, ({ one, many }) => ({
  user: one(user, { fields: [vaultDocument.userId], references: [user.id] }),
  folder: one(vaultFolder, { fields: [vaultDocument.folderId], references: [vaultFolder.id] }),
  shares: many(vaultShare),
}));

export const vaultShareRelations = relations(vaultShare, ({ one }) => ({
  document: one(vaultDocument, { fields: [vaultShare.documentId], references: [vaultDocument.id] }),
}));

export const lawyerClientRelations = relations(lawyerClient, ({ one, many }) => ({
  lawyer: one(user, {
    fields: [lawyerClient.lawyerUserId],
    references: [user.id],
    relationName: 'lawyer_client_owner',
  }),
  platformUser: one(user, {
    fields: [lawyerClient.platformUserId],
    references: [user.id],
    relationName: 'lawyer_client_platform_user',
  }),
  cases: many(lawyerCase),
}));

export const lawyerCaseRelations = relations(lawyerCase, ({ one, many }) => ({
  lawyer: one(user, { fields: [lawyerCase.lawyerUserId], references: [user.id] }),
  client: one(lawyerClient, { fields: [lawyerCase.lawyerClientId], references: [lawyerClient.id] }),
  hearings: many(lawyerCaseHearing),
  tasks: many(lawyerCaseTask),
  documents: many(lawyerCaseDocument),
  invoices: many(lawyerInvoice),
  timeEntries: many(lawyerTimeEntry),
}));

export const lawyerCaseHearingRelations = relations(lawyerCaseHearing, ({ one }) => ({
  case: one(lawyerCase, { fields: [lawyerCaseHearing.caseId], references: [lawyerCase.id] }),
}));

export const lawyerCaseTaskRelations = relations(lawyerCaseTask, ({ one, many }) => ({
  case: one(lawyerCase, { fields: [lawyerCaseTask.caseId], references: [lawyerCase.id] }),
  assignee: one(user, { fields: [lawyerCaseTask.assigneeUserId], references: [user.id] }),
  timeEntries: many(lawyerTimeEntry),
}));

export const lawyerCaseDocumentRelations = relations(lawyerCaseDocument, ({ one }) => ({
  case: one(lawyerCase, { fields: [lawyerCaseDocument.caseId], references: [lawyerCase.id] }),
  uploadedBy: one(user, { fields: [lawyerCaseDocument.uploadedByUserId], references: [user.id] }),
}));

export const lawyerFirmProfileRelations = relations(lawyerFirmProfile, ({ one }) => ({
  user: one(user, { fields: [lawyerFirmProfile.userId], references: [user.id] }),
}));

export const lawyerInvoiceCounterRelations = relations(lawyerInvoiceCounter, ({ one }) => ({
  lawyer: one(user, { fields: [lawyerInvoiceCounter.lawyerUserId], references: [user.id] }),
}));

export const lawyerInvoiceRelations = relations(lawyerInvoice, ({ one, many }) => ({
  lawyer: one(user, { fields: [lawyerInvoice.lawyerUserId], references: [user.id] }),
  case: one(lawyerCase, { fields: [lawyerInvoice.caseId], references: [lawyerCase.id] }),
  consultation: one(consultation, { fields: [lawyerInvoice.consultationId], references: [consultation.id] }),
  lines: many(lawyerInvoiceLine),
  payments: many(lawyerInvoicePayment),
}));

export const lawyerInvoiceLineRelations = relations(lawyerInvoiceLine, ({ one }) => ({
  invoice: one(lawyerInvoice, { fields: [lawyerInvoiceLine.invoiceId], references: [lawyerInvoice.id] }),
}));

export const lawyerTimeEntryRelations = relations(lawyerTimeEntry, ({ one }) => ({
  lawyer: one(user, { fields: [lawyerTimeEntry.lawyerUserId], references: [user.id] }),
  case: one(lawyerCase, { fields: [lawyerTimeEntry.caseId], references: [lawyerCase.id] }),
  task: one(lawyerCaseTask, { fields: [lawyerTimeEntry.taskId], references: [lawyerCaseTask.id] }),
  billedInvoice: one(lawyerInvoice, { fields: [lawyerTimeEntry.billedInvoiceId], references: [lawyerInvoice.id] }),
}));

export const lawyerInvoicePaymentRelations = relations(lawyerInvoicePayment, ({ one }) => ({
  invoice: one(lawyerInvoice, { fields: [lawyerInvoicePayment.invoiceId], references: [lawyerInvoice.id] }),
}));
