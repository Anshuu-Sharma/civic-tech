// ============================================================
// apps/api/src/services/legal.service.ts
// Legal rights lookup from database.
// ============================================================

import type { GrievanceCategory } from '@jansunwai/shared';
import { prisma } from '../lib/prisma';

export interface LegalRightRecord {
  id: string;
  category: string;
  law_name: string;
  summary: string;
  sla_days: number;
  source_section: string;
  state: string;
}

/**
 * Fetches all legal rights records for a given grievance category.
 */
export async function getLegalRightsByCategory(
  category: GrievanceCategory
): Promise<LegalRightRecord[]> {
  const rights = await prisma.legal_rights.findMany({
    where: { category },
  });

  return rights.map((r) => ({
    id: r.id,
    category: r.category,
    law_name: r.law_name,
    summary: r.summary,
    sla_days: r.sla_days,
    source_section: r.source_section,
    state: r.state,
  }));
}

/**
 * Fetches all legal rights records (for all categories).
 */
export async function getAllLegalRights(): Promise<LegalRightRecord[]> {
  const rights = await prisma.legal_rights.findMany({
    orderBy: { category: 'asc' },
  });

  return rights.map((r) => ({
    id: r.id,
    category: r.category,
    law_name: r.law_name,
    summary: r.summary,
    sla_days: r.sla_days,
    source_section: r.source_section,
    state: r.state,
  }));
}
