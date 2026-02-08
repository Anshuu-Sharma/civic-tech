// =============================================================================
// JanSunwai AI - Shared Constants
// =============================================================================

/** Prefix for complaint numbers: JSA-YYYY-DEL-XXXXX */
export const COMPLAINT_NUMBER_PREFIX = 'JSA';

/** City code used in complaint numbers */
export const CITY_CODE = 'DEL';

export const ESCALATION_TIMEFRAMES = {
  LEVEL_1_TO_2_HOURS: 48,
  LEVEL_2_TO_3_HOURS: 96,
  LEVEL_3_TO_4_HOURS: 168,
  LEVEL_4_TO_5_HOURS: 336,
} as const;

export const SEVERITY_WEIGHTS = {
  ISSUE_TYPE_BASE: 0.30,
  AFFECTED_POPULATION: 0.25,
  VULNERABILITY_INDEX: 0.20,
  TIME_SENSITIVITY: 0.15,
  RECURRENCE: 0.10,
} as const;

export const DUPLICATE_DETECTION = {
  GEO_RADIUS_METERS: 500,
  TIME_WINDOW_DAYS: 7,
  SIMILARITY_THRESHOLD: 0.75,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const SLA_DEFAULTS = {
  ACKNOWLEDGMENT_HOURS: 24,
  FIRST_ACTION_HOURS: 72,
  RESOLUTION_TARGET_DAYS: 14,
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'hi', name: 'Hindi', nativeName: '\u0939\u093F\u0902\u0926\u0940' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bengali', nativeName: '\u09AC\u09BE\u0982\u09B2\u09BE' },
  { code: 'te', name: 'Telugu', nativeName: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41' },
  { code: 'mr', name: 'Marathi', nativeName: '\u092E\u0930\u093E\u0920\u0940' },
  { code: 'ta', name: 'Tamil', nativeName: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD' },
  { code: 'gu', name: 'Gujarati', nativeName: '\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0' },
  { code: 'kn', name: 'Kannada', nativeName: '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1' },
  { code: 'ml', name: 'Malayalam', nativeName: '\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02' },
  { code: 'pa', name: 'Punjabi', nativeName: '\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40' },
  { code: 'or', name: 'Odia', nativeName: '\u0B13\u0B21\u0B3C\u0B3F\u0B06' },
  { code: 'ur', name: 'Urdu', nativeName: '\u0627\u0631\u062F\u0648' },
] as const;
