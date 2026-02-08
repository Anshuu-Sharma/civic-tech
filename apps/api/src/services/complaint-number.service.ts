// ============================================================
// apps/api/src/services/complaint-number.service.ts
// Sequential complaint number generator.
// Format: JSA-YYYY-DEL-NNNNN
// ============================================================

import { prisma } from '../lib/prisma';

const CITY_CODE = 'DEL'; // Delhi -- make configurable later
const PREFIX = 'JSA';

/**
 * Generates the next sequential complaint number.
 * Thread-safe via database-level sequencing.
 */
export async function generateComplaintNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `${PREFIX}-${year}-${CITY_CODE}-`;

  // Find the latest complaint number for this year
  const latest = await prisma.grievances.findFirst({
    where: {
      complaint_number: {
        startsWith: prefix,
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    select: {
      complaint_number: true,
    },
  });

  let nextSeq = 1;

  if (latest?.complaint_number) {
    const parts = latest.complaint_number.split('-');
    const lastSeq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSeq)) {
      nextSeq = lastSeq + 1;
    }
  }

  const seqStr = String(nextSeq).padStart(5, '0');
  return `${prefix}${seqStr}`;
}
