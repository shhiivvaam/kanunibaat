import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as DbSchema from '@kb/database/schema';
import { lawyerProfile, user, userProfile, userRole } from '@kb/database/schema';

import type { KbRole } from './context';

export interface ProfileBundle {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    phoneNumber: string | null;
    phoneNumberVerified: boolean;
  };
  profile: {
    userId: string;
    displayName: string | null;
    locale: string;
    avatarUrl: string | null;
  };
  roles: KbRole[];
  lawyer: {
    userId: string;
    barState: string | null;
    enrollmentNumber: string | null;
    verificationStatus: (typeof lawyerProfile.$inferSelect)['verificationStatus'];
  } | null;
}

export async function ensureDefaultUserRole(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
): Promise<void> {
  const existing = await db
    .select({ role: userRole.role })
    .from(userRole)
    .where(and(eq(userRole.userId, userId), eq(userRole.role, 'user')))
    .limit(1);
  if (existing.length > 0) return;
  await db.insert(userRole).values({ userId, role: 'user' });
}

export async function ensureUserProfileRow(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
  fallbackName: string,
): Promise<void> {
  const existing = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  if (existing.length > 0) return;
  await db.insert(userProfile).values({
    userId,
    displayName: fallbackName,
    locale: 'en',
  });
}

export async function loadProfileBundle(
  db: PostgresJsDatabase<typeof DbSchema>,
  userId: string,
): Promise<ProfileBundle | null> {
  const [u] = await db.select().from(user).where(eq(user.id, userId)).limit(1);
  if (!u) return null;

  const [p] = await db.select().from(userProfile).where(eq(userProfile.userId, userId)).limit(1);
  if (!p) return null;

  const roleRows = await db.select({ role: userRole.role }).from(userRole).where(eq(userRole.userId, userId));
  const [law] = await db.select().from(lawyerProfile).where(eq(lawyerProfile.userId, userId)).limit(1);

  return {
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      emailVerified: u.emailVerified,
      image: u.image,
      phoneNumber: u.phoneNumber ?? null,
      phoneNumberVerified: u.phoneNumberVerified,
    },
    profile: {
      userId: p.userId,
      displayName: p.displayName,
      locale: p.locale,
      avatarUrl: p.avatarUrl,
    },
    roles: roleRows.map((r) => r.role),
    lawyer: law
      ? {
        userId: law.userId,
        barState: law.barState,
        enrollmentNumber: law.enrollmentNumber,
        verificationStatus: law.verificationStatus,
      }
      : null,
  };
}
