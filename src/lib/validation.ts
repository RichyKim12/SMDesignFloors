import { z } from 'zod';

export const contractorRegistrationSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().email('Invalid email address').max(254),
  phone: z.string().trim().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Invalid phone number format').optional().or(z.literal('')),
  business: z.string().trim().max(120).optional(),
  website: z.string().trim().url('Website must start with https://').max(2048).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional(),
  selectedProfs: z.array(z.string()).min(1, 'Select at least one trade'),
});