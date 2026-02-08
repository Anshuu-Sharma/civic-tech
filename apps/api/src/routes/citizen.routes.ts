// ============================================================
// apps/api/src/routes/citizen.routes.ts
// Citizen-facing endpoints for legal rights and RTI.
// ============================================================

import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import type { GrievanceCategory } from '@jansunwai/shared';

const router = Router();

// ------------------------------------------------------------------
// GET /api/v1/citizen/rights/:category
// Returns legal rights information for a given grievance category.
// ------------------------------------------------------------------

router.get('/rights/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    // Validate category
    const validCategories: GrievanceCategory[] = [
      'water_supply', 'electricity', 'roads_potholes', 'sanitation_garbage',
      'drainage_sewage', 'street_lighting', 'public_transport', 'ration_card_pds',
      'pension_welfare', 'corruption_misconduct', 'building_construction', 'parks_public_spaces',
    ];

    if (!validCategories.includes(category as GrievanceCategory)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: `Invalid category "${category}". Must be one of: ${validCategories.join(', ')}`,
        },
      });
    }

    const rights = await prisma.legal_rights.findMany({
      where: { category: category as any },
      orderBy: { law_name: 'asc' },
    });

    return res.json({
      success: true,
      data: rights.map((r) => ({
        id: r.id,
        law_name: r.law_name,
        summary: r.summary,
        sla_days: r.sla_days,
        source_section: r.source_section,
        state: r.state,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'FETCH_FAILED', message: err.message },
    });
  }
});

// ------------------------------------------------------------------
// Stub for future phases
// ------------------------------------------------------------------

router.post('/rti/generate', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented - Phase 5',
  });
});

export default router;
