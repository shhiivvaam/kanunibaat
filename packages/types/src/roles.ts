import { z } from 'zod';

export const UserRoleSchema = z.enum(['NAAGRIK', 'VAKIL', 'ADMIN', 'SUPER_ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;
