// ============================================================
// packages/shared/src/types/grievance.types.ts
// Canonical types shared between apps/api and apps/web
// ============================================================

export const GRIEVANCE_CATEGORIES = [
  'water_supply',
  'electricity',
  'roads_potholes',
  'sanitation_garbage',
  'drainage_sewage',
  'street_lighting',
  'public_transport',
  'ration_card_pds',
  'pension_welfare',
  'corruption_misconduct',
  'building_construction',
  'parks_public_spaces',
] as const;

export type GrievanceCategory = (typeof GRIEVANCE_CATEGORIES)[number];

export const GRIEVANCE_STATUSES = [
  'open',
  'acknowledged',
  'in_progress',
  'resolved',
  'reopened',
  'escalated',
] as const;

export type GrievanceStatus = (typeof GRIEVANCE_STATUSES)[number];

export const CHANNELS = ['web', 'voice', 'whatsapp', 'missed_call'] as const;
export type Channel = (typeof CHANNELS)[number];

export const VULNERABILITY_FLAGS = ['elderly', 'disabled', 'bpl', 'pregnant'] as const;
export type VulnerabilityFlag = (typeof VULNERABILITY_FLAGS)[number];

export const LANGUAGES = ['hi', 'en', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'ur'] as const;
export type Language = (typeof LANGUAGES)[number];

export const TIMELINE_EVENT_TYPES = [
  'filed',
  'acknowledged',
  'assigned',
  'escalated',
  'status_change',
  'resolved',
  'verified',
  'reopened',
] as const;

export type TimelineEventType = (typeof TIMELINE_EVENT_TYPES)[number];

// ---------- AI Classification Output ----------

export interface GrievanceClassification {
  category: GrievanceCategory;
  sub_category: string;
  severity_estimate: 'low' | 'medium' | 'high' | 'critical';
  area_type: 'residential' | 'commercial' | 'industrial' | 'highway' | 'public_space';
  structured_description: string;
}

// ---------- API Request / Response ----------

export interface FileGrievanceRequest {
  phone: string;
  name?: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  language: Language;
  channel: Channel;
  media_urls?: string[];
  vulnerability_flags?: VulnerabilityFlag[];
}

export interface FileGrievanceResponse {
  success: true;
  data: {
    complaint_number: string;
    category: GrievanceCategory;
    sub_category: string;
    severity_score: number;
    assigned_department: string;
    assigned_officer: string | null;
    legal_rights_summary: string;
    status: GrievanceStatus;
    escalation_level: number;
    community_issue_id: string | null;
  };
}

export interface GrievanceStatusResponse {
  complaint_number: string;
  status: GrievanceStatus;
  escalation_level: number;
  severity_score: number;
  category: GrievanceCategory;
  sub_category: string;
  assigned_department: string;
  assigned_officer: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface TimelineEntry {
  id: string;
  event_type: TimelineEventType;
  description: string;
  actor: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
