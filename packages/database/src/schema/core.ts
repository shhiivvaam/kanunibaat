/**
 * Core domain tables (Phase 2). Better Auth `user` remains the identity anchor (`user.id`).
 */
import { relations } from 'drizzle-orm';
import { pgEnum, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

import { user } from './auth';

export const kbUserRoleEnum = pgEnum('kb_user_role', ['user', 'lawyer', 'admin']);

export const lawyerVerificationStatusEnum = pgEnum('lawyer_verification_status', [
  'draft',
  'pending',
  'verified',
  'rejected',
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
  barState: text('bar_state'),
  enrollmentNumber: text('enrollment_number'),
  verificationStatus: lawyerVerificationStatusEnum('verification_status').notNull().default('draft'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, { fields: [userProfile.userId], references: [user.id] }),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, { fields: [userRole.userId], references: [user.id] }),
}));

export const lawyerProfileRelations = relations(lawyerProfile, ({ one }) => ({
  user: one(user, { fields: [lawyerProfile.userId], references: [user.id] }),
}));
