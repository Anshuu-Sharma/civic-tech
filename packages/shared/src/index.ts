// Re-export new canonical types (Phase 2) -- these are the authoritative type definitions
export * from './types/grievance.types';

// Re-export categories and constants (no conflicts)
export * from './categories';
export * from './constants';

// Re-export from types.ts, but exclude names that conflict with grievance.types.ts
export {
  // Enums that are NOT re-exported from grievance.types.ts
  GrievanceCategory as GrievanceCategoryEnum,
  GrievanceStatus as GrievanceStatusEnum,
  Channel as ChannelEnum,
  VulnerabilityFlag as VulnerabilityFlagEnum,
  TimelineEventType as TimelineEventTypeEnum,
  PreferredChannel,
  OfficerRole,
  CommunityIssueStatus,
  // Entity interfaces that don't conflict
  type Citizen,
  type Grievance,
  type GrievanceTimeline,
  type CommunityIssue,
  type Department,
  type Officer,
  type Ward,
  type LegalRight,
  // Utility types
  type GeoPoint,
  type ApiResponse,
  type PaginatedResponse,
  // API types that don't conflict (or renamed)
  type GrievanceStatusResponse as GrievanceStatusResponseLegacy,
  type FileGrievanceRequest as FileGrievanceRequestLegacy,
  type FileGrievanceResponse as FileGrievanceResponseLegacy,
  type HeatmapDataPoint,
  type WardScorecard,
} from './types';
