// ============================================================
// apps/api/src/routes/grievance.routes.ts
// Grievance filing and query endpoints.
// ============================================================

import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { classifyGrievance, generateLegalRightsSummary } from '../services/gemini.service';
import { calculateSeverityScore } from '../services/severity.service';
import { routeGrievance, resolveWard } from '../services/routing.service';
import { findDuplicates } from '../services/duplicate.service';
import { generateComplaintNumber } from '../services/complaint-number.service';
import {
  fileGrievanceSchema,
  searchGrievanceSchema,
  grievanceIdParamSchema,
} from '../validators/grievance.validator';
import type { VulnerabilityFlag, Language, GrievanceCategory } from '@jansunwai/shared';

const router = Router();

// ------------------------------------------------------------------
// POST /api/v1/grievance/file
// ------------------------------------------------------------------

router.post('/file', async (req: Request, res: Response) => {
  try {
    // 1. Validate input
    const parseResult = fileGrievanceSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: parseResult.error.flatten().fieldErrors,
        },
      });
    }

    const input = parseResult.data;

    // 2. Find or create citizen by phone
    let citizen = await prisma.citizens.findUnique({
      where: { phone: input.phone },
    });

    if (!citizen) {
      citizen = await prisma.citizens.create({
        data: {
          phone: input.phone,
          name: input.name || null,
          preferred_language: input.language,
          preferred_channel: input.channel === 'missed_call' ? 'voice' : (input.channel as any),
          vulnerability_flags: input.vulnerability_flags as any[],
          total_complaints: 0,
        },
      });
    } else if (input.name && !citizen.name) {
      // Update name if citizen exists but had no name
      citizen = await prisma.citizens.update({
        where: { id: citizen.id },
        data: { name: input.name },
      });
    }

    // 3. AI Classification (Gemini)
    console.log('[Grievance] Classifying with Gemini...');
    const classification = await classifyGrievance(
      input.description,
      input.media_urls.length > 0 ? input.media_urls : undefined
    );
    console.log('[Grievance] Classification result:', classification);

    // 4. Resolve ward from coordinates
    const wardResult = await resolveWard(input.latitude, input.longitude);

    // 5. Duplicate detection
    console.log('[Grievance] Checking for duplicates...');
    const duplicateResult = await findDuplicates(
      input.latitude,
      input.longitude,
      classification.category,
      input.description
    );
    console.log('[Grievance] Duplicate result:', duplicateResult);

    // 6. Severity scoring
    console.log('[Grievance] Calculating severity...');
    const severityScore = await calculateSeverityScore({
      category: classification.category,
      latitude: input.latitude,
      longitude: input.longitude,
      vulnerabilityFlags: input.vulnerability_flags as VulnerabilityFlag[],
      communityIssueId: duplicateResult.community_issue_id,
    });
    console.log('[Grievance] Severity score:', severityScore);

    // 7. Department routing
    const routing = await routeGrievance(
      classification.category,
      wardResult?.ward_id
    );

    // 8. Generate complaint number
    const complaintNumber = await generateComplaintNumber();

    // 9. Fetch legal rights from database
    const legalRights = await prisma.legal_rights.findMany({
      where: { category: classification.category },
    });

    // 10. Generate legal rights summary via Gemini
    console.log('[Grievance] Generating legal rights summary...');
    const legalRightsSummary = await generateLegalRightsSummary(
      classification.category,
      input.language as Language,
      legalRights.map((lr) => ({
        law_name: lr.law_name,
        summary: lr.summary,
        sla_days: lr.sla_days,
        source_section: lr.source_section,
        state: lr.state,
      }))
    );

    // 11. Create grievance record
    // Using raw SQL for the PostGIS location column
    const grievanceId = crypto.randomUUID();

    await prisma.$executeRaw`
      INSERT INTO grievances (
        id, complaint_number, citizen_id, category, sub_category,
        description, raw_input, location, address, ward_id,
        severity_score, status, channel, language, media_urls,
        assigned_department_id, assigned_officer_id, community_issue_id,
        escalation_level, resolution_verified, legal_rights_summary,
        created_at, updated_at
      ) VALUES (
        ${grievanceId}::uuid,
        ${complaintNumber},
        ${citizen.id}::uuid,
        ${classification.category}::"GrievanceCategory",
        ${classification.sub_category},
        ${classification.structured_description},
        ${JSON.stringify({ original_text: input.description, classification })}::jsonb,
        ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326),
        ${input.address},
        ${wardResult?.ward_id ?? null}::uuid,
        ${severityScore},
        'open'::"GrievanceStatus",
        ${input.channel}::"Channel",
        ${input.language},
        ${input.media_urls}::text[],
        ${routing.department_id}::uuid,
        ${routing.officer_id}::uuid,
        ${duplicateResult.community_issue_id}::uuid,
        1,
        false,
        ${legalRightsSummary},
        NOW(),
        NOW()
      )
    `;

    // 12. Create timeline entry
    await prisma.grievance_timeline.create({
      data: {
        grievance_id: grievanceId,
        event_type: 'filed',
        description: `Grievance filed via ${input.channel}. Category auto-detected: ${classification.category}/${classification.sub_category}. Severity score: ${severityScore}.`,
        actor: 'system',
        metadata: {
          channel: input.channel,
          classification: JSON.parse(JSON.stringify(classification)),
          severity_score: severityScore,
          duplicate_detected: duplicateResult.is_duplicate,
          community_issue_id: duplicateResult.community_issue_id,
        } as any,
      },
    });

    // 13. Update citizen's total_complaints count
    await prisma.citizens.update({
      where: { id: citizen.id },
      data: {
        total_complaints: { increment: 1 },
      },
    });

    // 14. Return response
    return res.status(201).json({
      success: true,
      data: {
        complaint_number: complaintNumber,
        category: classification.category,
        sub_category: classification.sub_category,
        severity_score: severityScore,
        assigned_department: routing.department_name,
        assigned_officer: routing.officer_name,
        legal_rights_summary: legalRightsSummary,
        status: 'open' as const,
        escalation_level: 1,
        community_issue_id: duplicateResult.community_issue_id,
      },
    });
  } catch (err: any) {
    console.error('[Grievance] Filing error:', err);
    return res.status(500).json({
      success: false,
      error: {
        code: 'FILING_FAILED',
        message: 'Failed to file grievance. Please try again.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }
});

// ------------------------------------------------------------------
// GET /api/v1/grievance/:id/status
// ------------------------------------------------------------------

router.get('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = grievanceIdParamSchema.parse(req.params);

    const grievance = await prisma.grievances.findUnique({
      where: { id },
      include: {
        department: { select: { name: true } },
        officer: { select: { name: true } },
      },
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Grievance not found' },
      });
    }

    return res.json({
      success: true,
      data: {
        complaint_number: grievance.complaint_number,
        status: grievance.status,
        escalation_level: grievance.escalation_level,
        severity_score: grievance.severity_score,
        category: grievance.category,
        sub_category: grievance.sub_category,
        assigned_department: grievance.department?.name ?? 'Unassigned',
        assigned_officer: grievance.officer?.name ?? null,
        created_at: grievance.created_at.toISOString(),
        updated_at: grievance.updated_at.toISOString(),
        resolved_at: grievance.resolved_at?.toISOString() ?? null,
      },
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: err.message },
    });
  }
});

// ------------------------------------------------------------------
// GET /api/v1/grievance/:id/timeline
// ------------------------------------------------------------------

router.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const { id } = grievanceIdParamSchema.parse(req.params);

    const grievance = await prisma.grievances.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Grievance not found' },
      });
    }

    const timeline = await prisma.grievance_timeline.findMany({
      where: { grievance_id: id },
      orderBy: { created_at: 'asc' },
    });

    return res.json({
      success: true,
      data: timeline.map((t) => ({
        id: t.id,
        event_type: t.event_type,
        description: t.description,
        actor: t.actor,
        metadata: t.metadata,
        created_at: t.created_at.toISOString(),
      })),
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: err.message },
    });
  }
});

// ------------------------------------------------------------------
// GET /api/v1/grievance/search?phone=XXX or ?complaint_number=XXX
// ------------------------------------------------------------------

router.get('/search', async (req: Request, res: Response) => {
  try {
    const parseResult = searchGrievanceSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0].message,
        },
      });
    }

    const { phone, complaint_number } = parseResult.data;

    let grievances: any[] = [];

    if (complaint_number) {
      // Search by complaint number (exact match)
      const grievance = await prisma.grievances.findUnique({
        where: { complaint_number },
        include: {
          department: { select: { name: true } },
          officer: { select: { name: true } },
          citizen: { select: { name: true, phone: true } },
        },
      });

      grievances = grievance ? [grievance] : [];
    } else if (phone) {
      // Search by phone (all grievances for this citizen)
      const citizen = await prisma.citizens.findUnique({
        where: { phone },
      });

      if (!citizen) {
        return res.json({ success: true, data: [] });
      }

      grievances = await prisma.grievances.findMany({
        where: { citizen_id: citizen.id },
        include: {
          department: { select: { name: true } },
          officer: { select: { name: true } },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
      });
    } else {
      grievances = [];
    }

    return res.json({
      success: true,
      data: grievances.map((g: any) => ({
        id: g.id,
        complaint_number: g.complaint_number,
        category: g.category,
        sub_category: g.sub_category,
        status: g.status,
        severity_score: g.severity_score,
        escalation_level: g.escalation_level,
        assigned_department: g.department?.name ?? 'Unassigned',
        assigned_officer: g.officer?.name ?? null,
        address: g.address,
        created_at: g.created_at.toISOString(),
        updated_at: g.updated_at.toISOString(),
      })),
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SEARCH_FAILED', message: err.message },
    });
  }
});

// ------------------------------------------------------------------
// Stubs for future phases
// ------------------------------------------------------------------

router.patch('/:id/update', async (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented - Phase 4',
  });
});

export default router;
