// ============================================================
// apps/api/src/services/duplicate.service.ts
// Detects duplicate/related grievances using PostGIS proximity,
// category matching, and Gemini semantic similarity.
// ============================================================

import type { GrievanceCategory } from '@jansunwai/shared';
import { prisma } from '../lib/prisma';
import { checkSemanticSimilarity } from './gemini.service';

const SIMILARITY_THRESHOLD = 0.7;
const SEARCH_RADIUS_METERS = 500;
const LOOKBACK_DAYS = 7;

interface DuplicateResult {
  is_duplicate: boolean;
  community_issue_id: string | null;
  matched_grievance_id: string | null;
  similarity_score: number | null;
}

/**
 * Searches for duplicate grievances near the given location with the same category.
 *
 * Steps:
 * 1. PostGIS query: Find grievances within 500m radius, same category, last 7 days, not resolved.
 * 2. For each candidate, call Gemini semantic similarity check.
 * 3. If similarity > 0.7, link to existing community_issue or create a new one.
 */
export async function findDuplicates(
  latitude: number,
  longitude: number,
  category: GrievanceCategory,
  description: string
): Promise<DuplicateResult> {
  // Step 1: PostGIS proximity search
  let candidates: { id: string; description: string; community_issue_id: string | null }[] = [];

  try {
    candidates = await prisma.$queryRaw`
      SELECT id, description, community_issue_id
      FROM grievances
      WHERE category = ${category}::"GrievanceCategory"
        AND status NOT IN ('resolved')
        AND created_at > NOW() - INTERVAL '7 days'
        AND ST_DWithin(
          location::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
          ${SEARCH_RADIUS_METERS}
        )
      ORDER BY created_at DESC
      LIMIT 10
    `;
  } catch (err) {
    console.warn('[Duplicate] PostGIS query failed:', err);
    return {
      is_duplicate: false,
      community_issue_id: null,
      matched_grievance_id: null,
      similarity_score: null,
    };
  }

  if (candidates.length === 0) {
    return {
      is_duplicate: false,
      community_issue_id: null,
      matched_grievance_id: null,
      similarity_score: null,
    };
  }

  // Step 2: Check semantic similarity with each candidate (stop at first match)
  for (const candidate of candidates) {
    const similarity = await checkSemanticSimilarity(description, candidate.description);

    if (similarity >= SIMILARITY_THRESHOLD) {
      // Step 3a: If candidate already has a community_issue, link to it
      if (candidate.community_issue_id) {
        await prisma.community_issues.update({
          where: { id: candidate.community_issue_id },
          data: {
            linked_grievance_count: { increment: 1 },
          },
        });

        return {
          is_duplicate: true,
          community_issue_id: candidate.community_issue_id,
          matched_grievance_id: candidate.id,
          similarity_score: similarity,
        };
      }

      // Step 3b: Create a new community issue via raw SQL for PostGIS centroid
      const newIssueResult = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO community_issues (
          id, title, category, centroid, radius_meters,
          linked_grievance_count, endorsement_count, severity_score, status, created_at
        ) VALUES (
          gen_random_uuid(),
          ${`${category.replace(/_/g, ' ')} issue cluster`},
          ${category}::"GrievanceCategory",
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326),
          ${SEARCH_RADIUS_METERS},
          2,
          0,
          0,
          'open'::"CommunityIssueStatus",
          NOW()
        )
        RETURNING id
      `;

      const communityIssueId = newIssueResult[0]?.id;

      if (communityIssueId) {
        // Link the existing candidate grievance to the new community issue
        await prisma.grievances.update({
          where: { id: candidate.id },
          data: { community_issue_id: communityIssueId },
        });

        return {
          is_duplicate: true,
          community_issue_id: communityIssueId,
          matched_grievance_id: candidate.id,
          similarity_score: similarity,
        };
      }
    }
  }

  // No duplicates found
  return {
    is_duplicate: false,
    community_issue_id: null,
    matched_grievance_id: null,
    similarity_score: null,
  };
}
