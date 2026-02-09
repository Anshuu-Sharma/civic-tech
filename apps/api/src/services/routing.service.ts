// ============================================================
// apps/api/src/services/routing.service.ts
// Routes grievances to the correct department and officer
// based on category and ward.
// ============================================================

import type { GrievanceCategory } from '@jansunwai/shared';
import { prisma } from '../lib/prisma';
import logger from '../lib/logger';

const log = logger.scope('Routing');

interface RoutingResult {
  department_id: string;
  department_name: string;
  officer_id: string | null;
  officer_name: string | null;
}

/**
 * Routes a grievance to the appropriate department and officer.
 *
 * Logic:
 * 1. Find the department whose category_mapping array contains this category.
 * 2. If a ward_id is provided, find a ward_officer in that department for that ward.
 * 3. If no ward officer found, fall back to the department head.
 */
export async function routeGrievance(
  category: GrievanceCategory,
  wardId?: string | null
): Promise<RoutingResult> {
  // Step 1: Find department by category mapping
  const department = await prisma.departments.findFirst({
    where: {
      category_mapping: {
        has: category,
      },
    },
    include: {
      head_officer: true,
    },
  });

  if (!department) {
    log.warn(`No department found for category "${category}"`);
    // Return a fallback -- general administration
    const fallback = await prisma.departments.findFirst({
      include: { head_officer: true },
    });
    return {
      department_id: fallback?.id ?? 'unknown',
      department_name: fallback?.name ?? 'General Administration',
      officer_id: fallback?.head_officer?.id ?? null,
      officer_name: fallback?.head_officer?.name ?? null,
    };
  }

  // Step 2: Try to find a ward-level officer
  if (wardId) {
    const wardOfficer = await prisma.officers.findFirst({
      where: {
        department_id: department.id,
        ward_id: wardId,
        role: 'ward_officer',
      },
    });

    if (wardOfficer) {
      return {
        department_id: department.id,
        department_name: department.name,
        officer_id: wardOfficer.id,
        officer_name: wardOfficer.name,
      };
    }
  }

  // Step 3: Fall back to department head
  return {
    department_id: department.id,
    department_name: department.name,
    officer_id: department.head_officer?.id ?? null,
    officer_name: department.head_officer?.name ?? null,
  };
}

/**
 * Resolves the ward for a given lat/lng using PostGIS ST_Contains.
 * Returns the ward_id if the point falls within a ward boundary, else null.
 */
export async function resolveWard(
  latitude: number,
  longitude: number
): Promise<{ ward_id: string; ward_name: string } | null> {
  try {
    const result = await prisma.$queryRaw<{ id: string; name: string }[]>`
      SELECT id, name
      FROM wards
      WHERE ST_Contains(
        boundary,
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)
      )
      LIMIT 1
    `;

    if (result.length > 0) {
      return { ward_id: result[0].id, ward_name: result[0].name };
    }

    return null;
  } catch (err) {
    log.warn('Ward resolution failed:', err);
    return null;
  }
}
