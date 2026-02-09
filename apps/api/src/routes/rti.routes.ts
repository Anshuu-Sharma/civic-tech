// ============================================================
// apps/api/src/routes/rti.routes.ts
// RTI (Right to Information) application generation endpoints.
// Public routes - no auth required.
// ============================================================

import { Router, type Request, type Response } from 'express';
import { prisma } from '../lib/prisma';
import { generateRtiApplication } from '../services/rti.service';
import type { GrievanceForRti, LegalRightRecord } from '../services/rti.service';
import logger from '../lib/logger';

const rtiLog = logger.scope('RTI');

const router = Router();

// ------------------------------------------------------------------
// POST /api/v1/rti/generate/:grievanceId
// Generate an RTI application for a grievance at escalation Level 4+.
// ------------------------------------------------------------------

router.post('/generate/:grievanceId', async (req: Request, res: Response) => {
  try {
    const grievanceId = req.params.grievanceId as string;

    if (!grievanceId) {
      return res.status(400).json({
        success: false,
        error: 'grievanceId is required.',
      });
    }

    // Fetch grievance with all related data needed for RTI generation
    const grievance = await prisma.grievances.findUnique({
      where: { id: grievanceId },
      include: {
        department: { select: { name: true } },
        officer: { select: { name: true } },
        citizen: { select: { name: true, preferred_language: true } },
        ward: { select: { name: true, number: true } },
        timeline: {
          orderBy: { created_at: 'asc' },
          select: {
            event_type: true,
            description: true,
            created_at: true,
          },
        },
      },
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.',
      });
    }

    // Validate escalation level
    if (grievance.escalation_level < 4) {
      return res.status(400).json({
        success: false,
        error:
          'RTI generation is available for complaints at escalation Level 4 or above. ' +
          `This complaint is at Level ${grievance.escalation_level}.`,
      });
    }

    // Check for existing RTI (return cached if exists and is less than 24 hours old)
    const existingRti = await prisma.rti_applications.findFirst({
      where: { grievance_id: grievanceId },
      orderBy: { created_at: 'desc' },
    });

    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    if (existingRti && existingRti.created_at > twentyFourHoursAgo) {
      return res.status(200).json({
        success: true,
        data: {
          id: existingRti.id,
          grievance_id: existingRti.grievance_id,
          subject: existingRti.subject,
          body: existingRti.body,
          body_hindi: existingRti.body_hindi,
          addressed_to: existingRti.addressed_to,
          department_name: existingRti.department_name,
          reference_laws: existingRti.reference_laws,
          fee_amount: existingRti.fee_amount,
          created_at: existingRti.created_at,
          cached: true,
        },
      });
    }

    // Fetch legal rights for this category
    const legalRights = await prisma.legal_rights.findMany({
      where: { category: grievance.category },
    });

    // Map to RTI service types (cast to any to access included relations)
    const g = grievance as any;
    const grievanceForRti: GrievanceForRti = {
      complaint_number: g.complaint_number,
      category: g.category,
      sub_category: g.sub_category,
      description: g.description,
      address: g.address,
      created_at: g.created_at,
      escalation_level: g.escalation_level,
      department: g.department,
      officer: g.officer,
      citizen: g.citizen,
      ward: g.ward,
      timeline: g.timeline,
    };

    const legalRightsForRti: LegalRightRecord[] = legalRights.map((lr) => ({
      law_name: lr.law_name,
      summary: lr.summary,
      sla_days: lr.sla_days,
      source_section: lr.source_section,
      state: lr.state,
    }));

    // Generate RTI via Gemini
    const rtiResult = await generateRtiApplication(grievanceForRti, legalRightsForRti);

    // Save to database
    const savedRti = await prisma.rti_applications.create({
      data: {
        grievance_id: grievanceId,
        subject: rtiResult.subject,
        body: rtiResult.body,
        body_hindi: rtiResult.body_hindi,
        addressed_to: rtiResult.addressed_to,
        department_name: g.department?.name || 'Unknown Department',
        reference_laws: rtiResult.reference_laws as any,
        fee_amount: rtiResult.fee_amount,
        language: 'en',
        generated_by: 'gemini',
        gemini_model: rtiResult.gemini_model,
      },
    });

    // Timeline entry
    await prisma.grievance_timeline.create({
      data: {
        grievance_id: grievanceId,
        event_type: 'status_change',
        description: 'RTI application generated for this complaint.',
        actor: 'system',
        metadata: {
          rti_id: savedRti.id,
          escalation_level: grievance.escalation_level,
        } as any,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        id: savedRti.id,
        grievance_id: savedRti.grievance_id,
        subject: savedRti.subject,
        body: savedRti.body,
        body_hindi: savedRti.body_hindi,
        addressed_to: savedRti.addressed_to,
        department_name: savedRti.department_name,
        reference_laws: savedRti.reference_laws,
        fee_amount: savedRti.fee_amount,
        created_at: savedRti.created_at,
        cached: false,
      },
    });
  } catch (error) {
    rtiLog.error('Generate RTI failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate RTI application. Please try again.',
    });
  }
});

// ------------------------------------------------------------------
// GET /api/v1/rti/:grievanceId
// Get existing RTI applications for a grievance.
// ------------------------------------------------------------------

router.get('/:grievanceId', async (req: Request, res: Response) => {
  try {
    const grievanceId = req.params.grievanceId as string;

    // Check for existing RTI
    const existingRtis = await prisma.rti_applications.findMany({
      where: { grievance_id: grievanceId },
      orderBy: { created_at: 'desc' },
    });

    if (existingRtis.length > 0) {
      return res.status(200).json({
        success: true,
        data: existingRtis.map((rti) => ({
          id: rti.id,
          grievance_id: rti.grievance_id,
          subject: rti.subject,
          body: rti.body,
          body_hindi: rti.body_hindi,
          addressed_to: rti.addressed_to,
          department_name: rti.department_name,
          reference_laws: rti.reference_laws,
          fee_amount: rti.fee_amount,
          language: rti.language,
          created_at: rti.created_at,
        })),
      });
    }

    // No existing RTI - check if grievance qualifies
    const grievance = await prisma.grievances.findUnique({
      where: { id: grievanceId },
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.',
      });
    }

    if (grievance.escalation_level < 4) {
      return res.status(404).json({
        success: false,
        error:
          'No RTI application exists for this complaint. RTI generation requires escalation Level 4+.',
      });
    }

    // Grievance qualifies but no RTI generated yet
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No RTI applications generated yet. Use POST /api/v1/rti/generate/:grievanceId to create one.',
    });
  } catch (error) {
    rtiLog.error('Get RTI failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
});

export default router;
