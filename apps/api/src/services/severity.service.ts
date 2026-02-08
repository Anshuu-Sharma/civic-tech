// ============================================================
// apps/api/src/services/severity.service.ts
// 5-factor weighted severity scoring algorithm.
// ============================================================

import type { GrievanceCategory, VulnerabilityFlag } from '@jansunwai/shared';
import { prisma } from '../lib/prisma';

// ------------------------------------------------------------------
// Constants
// ------------------------------------------------------------------

/** Factor 1: Base score per category (0-100 scale, contributes 30%) */
const CATEGORY_BASE_SCORES: Record<GrievanceCategory, number> = {
  water_supply: 70,
  electricity: 65,
  roads_potholes: 60,
  sanitation_garbage: 55,
  drainage_sewage: 75,
  street_lighting: 40,
  public_transport: 45,
  ration_card_pds: 80,
  pension_welfare: 85,
  corruption_misconduct: 90,
  building_construction: 50,
  parks_public_spaces: 30,
};

/** Factor 3: Vulnerability flag bonus points (cumulative, capped at 100) */
const VULNERABILITY_POINTS: Record<VulnerabilityFlag, number> = {
  elderly: 30,
  disabled: 40,
  bpl: 35,
  pregnant: 25,
};

/** Factor 4: Seasonal boost mappings. Key = category, value = months (0-indexed) */
const SEASONAL_BOOSTS: Partial<Record<GrievanceCategory, { months: number[]; boost: number }>> = {
  drainage_sewage: { months: [5, 6, 7, 8], boost: 30 },       // June-Sept (monsoon)
  water_supply: { months: [3, 4, 5, 5, 6, 7, 8], boost: 25 }, // Apr-Sept
  electricity: { months: [3, 4, 5], boost: 20 },               // Apr-Jun (summer peak)
  sanitation_garbage: { months: [5, 6, 7, 8], boost: 15 },     // Monsoon disease risk
};

/** Weights for the 5 factors */
const WEIGHTS = {
  issueType: 0.30,
  affectedPopulation: 0.25,
  vulnerability: 0.20,
  timeSensitivity: 0.15,
  recurrence: 0.10,
};

// ------------------------------------------------------------------
// Severity Calculator
// ------------------------------------------------------------------

interface SeverityInput {
  category: GrievanceCategory;
  latitude: number;
  longitude: number;
  vulnerabilityFlags: VulnerabilityFlag[];
  communityIssueId?: string | null;
}

export async function calculateSeverityScore(input: SeverityInput): Promise<number> {
  const { category, latitude, longitude, vulnerabilityFlags, communityIssueId } = input;

  // ---- Factor 1: Issue Type Base Score (30%) ----
  const issueTypeScore = CATEGORY_BASE_SCORES[category] ?? 50;

  // ---- Factor 2: Affected Population (25%) ----
  // Count linked complaints in 500m radius with same category, open in last 30 days
  let affectedPopulationScore = 0;
  try {
    const nearbyCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM grievances
      WHERE category = ${category}::"GrievanceCategory"
        AND status NOT IN ('resolved')
        AND created_at > NOW() - INTERVAL '30 days'
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          500
        )
    `;
    const count = Number(nearbyCount[0]?.count ?? 0);
    // Scale: 0 complaints = 0, 1-2 = 20, 3-5 = 40, 6-10 = 60, 11-20 = 80, 20+ = 100
    if (count === 0) affectedPopulationScore = 0;
    else if (count <= 2) affectedPopulationScore = 20;
    else if (count <= 5) affectedPopulationScore = 40;
    else if (count <= 10) affectedPopulationScore = 60;
    else if (count <= 20) affectedPopulationScore = 80;
    else affectedPopulationScore = 100;
  } catch (err) {
    console.warn('[Severity] PostGIS nearby query failed, defaulting to 0:', err);
    affectedPopulationScore = 0;
  }

  // If linked to a community issue, boost by endorsement count
  if (communityIssueId) {
    try {
      const issue = await prisma.community_issues.findUnique({
        where: { id: communityIssueId },
        select: { linked_grievance_count: true, endorsement_count: true },
      });
      if (issue) {
        const totalAffected = issue.linked_grievance_count + issue.endorsement_count;
        const boost = Math.min(totalAffected * 5, 40); // up to +40
        affectedPopulationScore = Math.min(affectedPopulationScore + boost, 100);
      }
    } catch {
      // ignore
    }
  }

  // ---- Factor 3: Vulnerability Index (20%) ----
  let vulnerabilityScore = 0;
  for (const flag of vulnerabilityFlags) {
    vulnerabilityScore += VULNERABILITY_POINTS[flag] ?? 0;
  }
  vulnerabilityScore = Math.min(vulnerabilityScore, 100);

  // ---- Factor 4: Time Sensitivity (15%) ----
  let timeSensitivityScore = 30; // baseline
  const currentMonth = new Date().getMonth(); // 0-indexed
  const seasonalConfig = SEASONAL_BOOSTS[category];
  if (seasonalConfig && seasonalConfig.months.includes(currentMonth)) {
    timeSensitivityScore += seasonalConfig.boost;
  }
  timeSensitivityScore = Math.min(timeSensitivityScore, 100);

  // ---- Factor 5: Recurrence (10%) ----
  let recurrenceScore = 0;
  try {
    const pastCount = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM grievances
      WHERE category = ${category}::"GrievanceCategory"
        AND created_at > NOW() - INTERVAL '12 months'
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          200
        )
    `;
    const count = Number(pastCount[0]?.count ?? 0);
    // Scale: 0 = 0, 1 = 20, 2 = 40, 3 = 60, 4 = 80, 5+ = 100
    recurrenceScore = Math.min(count * 20, 100);
  } catch (err) {
    console.warn('[Severity] PostGIS recurrence query failed, defaulting to 0:', err);
    recurrenceScore = 0;
  }

  // ---- Composite Score ----
  const composite =
    issueTypeScore * WEIGHTS.issueType +
    affectedPopulationScore * WEIGHTS.affectedPopulation +
    vulnerabilityScore * WEIGHTS.vulnerability +
    timeSensitivityScore * WEIGHTS.timeSensitivity +
    recurrenceScore * WEIGHTS.recurrence;

  return Math.round(Math.min(Math.max(composite, 0), 100));
}
