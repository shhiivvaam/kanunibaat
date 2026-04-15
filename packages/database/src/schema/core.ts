/**
 * Core domain tables (Phase 2–3). Better Auth `user` remains the identity anchor (`user.id`).
 */
import { relations, sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
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
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  consultation: one(consultation, { fields: [payment.consultationId], references: [consultation.id] }),
}));

export const consultationMessageRelations = relations(consultationMessage, ({ one }) => ({
  consultation: one(consultation, { fields: [consultationMessage.consultationId], references: [consultation.id] }),
  sender: one(user, { fields: [consultationMessage.senderUserId], references: [user.id] }),
}));
