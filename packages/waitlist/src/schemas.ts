import { z } from 'zod';

export const userWaitlistInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(320),
  phone: z.string().trim().max(20).optional(),
  referrer: z.string().trim().max(200).optional(),
});

export const lawyerWaitlistInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(320),
  phone: z.string().trim().min(10, 'Enter a valid phone number').max(20),
  referrer: z.string().trim().max(200).optional(),
  barState: z.string().trim().min(1, 'State bar council is required').max(80),
  enrollmentNumber: z.string().trim().min(1, 'Enrollment number is required').max(80),
  practiceAreas: z.string().trim().max(500).optional(),
});

export type UserWaitlistInput = z.infer<typeof userWaitlistInputSchema>;
export type LawyerWaitlistInput = z.infer<typeof lawyerWaitlistInputSchema>;
