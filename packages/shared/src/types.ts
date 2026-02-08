// =============================================================================
// JanSunwai AI - Shared Type Definitions
// All interfaces match the Prisma schema defined in apps/api/prisma/schema.prisma
// =============================================================================

// -----------------------------------------------------------------------------
// Enums
// -----------------------------------------------------------------------------

export enum GrievanceCategory {
  WATER_SUPPLY = 'water_supply',
  ELECTRICITY = 'electricity',
  ROADS_POTHOLES = 'roads_potholes',
  SANITATION_GARBAGE = 'sanitation_garbage',
  DRAINAGE_SEWAGE = 'drainage_sewage',
  STREET_LIGHTING = 'street_lighting',
  PUBLIC_TRANSPORT = 'public_transport',
  RATION_CARD_PDS = 'ration_card_pds',
  PENSION_WELFARE = 'pension_welfare',
  CORRUPTION_MISCONDUCT = 'corruption_misconduct',
  BUILDING_CONSTRUCTION = 'building_construction',
  PARKS_PUBLIC_SPACES = 'parks_public_spaces',
}

export enum GrievanceStatus {
  OPEN = 'open',
  ACKNOWLEDGED = 'acknowledged',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  REOPENED = 'reopened',
  ESCALATED = 'escalated',
}

export enum Channel {
  WEB = 'web',
  VOICE = 'voice',
  WHATSAPP = 'whatsapp',
  MISSED_CALL = 'missed_call',
  SMS = 'sms',
}

export enum PreferredChannel {
  WEB = 'web',
  VOICE = 'voice',
  WHATSAPP = 'whatsapp',
  SMS = 'sms',
}

export enum VulnerabilityFlag {
  ELDERLY = 'elderly',
  DISABLED = 'disabled',
  BPL = 'bpl',
  PREGNANT = 'pregnant',
}

export enum TimelineEventType {
  FILED = 'filed',
  ACKNOWLEDGED = 'acknowledged',
  ASSIGNED = 'assigned',
  ESCALATED = 'escalated',
  STATUS_CHANGE = 'status_change',
  RESOLVED = 'resolved',
  VERIFIED = 'verified',
  REOPENED = 'reopened',
}

export enum OfficerRole {
  WARD_OFFICER = 'ward_officer',
  DEPARTMENT_HEAD = 'department_head',
  COMMISSIONER = 'commissioner',
}

export enum CommunityIssueStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
}

// -----------------------------------------------------------------------------
// Entity Interfaces
// -----------------------------------------------------------------------------

export interface Citizen {
  id: string;
  phone: string;
  name: string | null;
  preferred_language: string;
  preferred_channel: PreferredChannel;
  ward_id: string | null;
  vulnerability_flags: VulnerabilityFlag[];
  total_complaints: number;
  created_at: string;
}

export interface Grievance {
  id: string;
  complaint_number: string;
  citizen_id: string;
  category: GrievanceCategory;
  sub_category: string | null;
  description: string;
  raw_input: Record<string, unknown>;
  location: GeoPoint | null;
  address: string | null;
  ward_id: string | null;
  severity_score: number;
  status: GrievanceStatus;
  channel: Channel;
  language: string;
  media_urls: string[];
  assigned_department_id: string | null;
  assigned_officer_id: string | null;
  community_issue_id: string | null;
  escalation_level: number;
  resolution_verified: boolean;
  satisfaction_score: number | null;
  legal_rights_summary: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface GrievanceTimeline {
  id: string;
  grievance_id: string;
  event_type: TimelineEventType;
  description: string;
  actor: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CommunityIssue {
  id: string;
  title: string;
  category: GrievanceCategory;
  centroid: GeoPoint | null;
  radius_meters: number;
  linked_grievance_count: number;
  endorsement_count: number;
  severity_score: number;
  status: CommunityIssueStatus;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  category_mapping: GrievanceCategory[];
  head_officer_id: string | null;
}

export interface Officer {
  id: string;
  name: string;
  department_id: string;
  ward_id: string | null;
  role: OfficerRole;
  email: string;
  phone: string;
  password_hash: string;
  created_at: string;
}

export interface Ward {
  id: string;
  name: string;
  number: number;
  zone: string;
}

export interface LegalRight {
  id: string;
  category: GrievanceCategory;
  law_name: string;
  summary: string;
  sla_days: number;
  source_section: string;
  state: string;
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/** API response wrapper used by all Express endpoints */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Paginated response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

// -----------------------------------------------------------------------------
// API Request/Response Types
// -----------------------------------------------------------------------------

/** POST /api/v1/grievance/file */
export interface FileGrievanceRequest {
  phone: string;
  name?: string;
  description: string;
  category?: GrievanceCategory;
  latitude?: number;
  longitude?: number;
  address?: string;
  media_urls?: string[];
  language?: string;
  channel: Channel;
}

export interface FileGrievanceResponse {
  complaint_number: string;
  grievance_id: string;
  category: GrievanceCategory;
  severity_score: number;
  assigned_department: string;
  legal_rights_summary: string;
  estimated_resolution_days: number;
}

/** GET /api/v1/grievance/:id/status */
export interface GrievanceStatusResponse {
  complaint_number: string;
  status: GrievanceStatus;
  category: GrievanceCategory;
  severity_score: number;
  escalation_level: number;
  assigned_department: string;
  assigned_officer: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

/** GET /api/v1/analytics/heatmap */
export interface HeatmapDataPoint {
  latitude: number;
  longitude: number;
  weight: number;
  category: GrievanceCategory;
  status: GrievanceStatus;
  complaint_number: string;
}

/** GET /api/v1/analytics/wards */
export interface WardScorecard {
  ward_id: string;
  ward_name: string;
  ward_number: number;
  zone: string;
  total_complaints: number;
  open_complaints: number;
  resolved_complaints: number;
  avg_resolution_days: number;
  avg_severity: number;
  top_category: GrievanceCategory;
}
