// ============================================================
// apps/api/src/validators/grievance.validator.ts
// Zod validation schemas for grievance endpoints.
// ============================================================

import { z } from 'zod';

export const fileGrievanceSchema = z.object({
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(13, 'Phone number must be at most 13 characters')
    .regex(/^[+]?[0-9]{10,13}$/, 'Invalid phone number format'),

  name: z.string().max(100).optional(),

  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description must be at most 5000 characters'),

  latitude: z
    .number()
    .min(-90, 'Invalid latitude')
    .max(90, 'Invalid latitude')
    .optional()
    .default(0),

  longitude: z
    .number()
    .min(-180, 'Invalid longitude')
    .max(180, 'Invalid longitude')
    .optional()
    .default(0),

  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500),

  language: z.enum(['hi', 'en', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur']).default('hi'),

  channel: z.enum(['web', 'voice', 'whatsapp', 'missed_call']).default('web'),

  media_urls: z
    .array(z.string().url('Invalid media URL'))
    .max(5, 'Maximum 5 media files')
    .optional()
    .default([]),

  vulnerability_flags: z
    .array(z.enum(['elderly', 'disabled', 'bpl', 'pregnant']))
    .optional()
    .default([]),
});

export type FileGrievanceInput = z.infer<typeof fileGrievanceSchema>;

export const searchGrievanceSchema = z.object({
  phone: z.string().optional(),
  complaint_number: z.string().optional(),
}).refine(
  (data) => data.phone || data.complaint_number,
  { message: 'Either phone or complaint_number is required' }
);

export const grievanceIdParamSchema = z.object({
  id: z.string().uuid('Invalid grievance ID'),
});
