import { z } from 'zod';

const CATEGORIES = [
  'water_supply', 'electricity', 'roads_potholes', 'sanitation_garbage',
  'drainage_sewage', 'street_lighting', 'public_transport', 'ration_card_pds',
  'pension_welfare', 'corruption_misconduct', 'building_construction',
  'parks_public_spaces',
] as const;

const STATUSES = [
  'open', 'acknowledged', 'in_progress', 'resolved', 'reopened', 'escalated',
] as const;

export const heatmapQuerySchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  status: z.enum(STATUSES).optional(),
  ward_id: z.string().uuid().optional(),
  severity_min: z.coerce.number().int().min(0).max(100).optional(),
  severity_max: z.coerce.number().int().min(0).max(100).optional(),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
  sw_lat: z.coerce.number().min(-90).max(90).optional(),
  sw_lng: z.coerce.number().min(-180).max(180).optional(),
  ne_lat: z.coerce.number().min(-90).max(90).optional(),
  ne_lng: z.coerce.number().min(-180).max(180).optional(),
});

export const wardsQuerySchema = z.object({
  sort_by: z.enum([
    'total_complaints', 'avg_resolution_days', 'sla_compliance',
    'satisfaction_score', 'name',
  ]).default('total_complaints'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const trendsQuerySchema = z.object({
  ward_id: z.string().uuid().optional(),
  category: z.enum(CATEGORIES).optional(),
  period: z.enum(['daily', 'weekly', 'monthly']).default('weekly'),
  date_from: z.coerce.date().optional(),
  date_to: z.coerce.date().optional(),
});

export type HeatmapQuery = z.infer<typeof heatmapQuerySchema>;
export type WardsQuery = z.infer<typeof wardsQuerySchema>;
export type TrendsQuery = z.infer<typeof trendsQuerySchema>;
