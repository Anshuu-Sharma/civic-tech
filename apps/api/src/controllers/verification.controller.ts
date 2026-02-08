// ============================================================
// apps/api/src/controllers/verification.controller.ts
// Handles citizen verification of resolved grievances.
// Public endpoints - no auth required (token-based access).
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import {
  validateVerificationToken,
  markTokenUsed,
} from '../services/verification.service';

/**
 * GET /api/v1/grievance/:id/verify/:token
 *
 * Validates the token and returns the complaint summary for the verification page.
 * This is a PUBLIC endpoint - no auth required.
 */
export async function getVerificationPage(req: Request, res: Response) {
  try {
    const grievanceId = req.params.id as string;
    const token = req.params.token as string;

    // Validate token
    const validation = await validateVerificationToken(token);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Ensure token belongs to this grievance
    if (validation.grievanceId !== grievanceId) {
      return res.status(400).json({
        success: false,
        error: 'Token does not match this complaint.',
      });
    }

    // Fetch grievance with related data
    const grievance = await prisma.grievances.findUnique({
      where: { id: grievanceId },
      include: {
        department: { select: { name: true } },
        officer: { select: { name: true } },
        timeline: {
          where: { event_type: 'resolved' },
          orderBy: { created_at: 'desc' },
          take: 1,
        },
      },
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.',
      });
    }

    // Calculate days to resolve
    const createdAt = new Date(grievance.created_at);
    const resolvedAt = grievance.resolved_at ? new Date(grievance.resolved_at) : new Date();
    const daysToResolve = Math.ceil(
      (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Extract resolution notes from the latest "resolved" timeline entry metadata
    const resolvedEntry = grievance.timeline[0];
    const resolutionNotes =
      (resolvedEntry?.metadata as any)?.resolutionNotes || null;

    // Get token expiry
    const tokenRecord = await prisma.verification_tokens.findUnique({
      where: { token: token },
    });

    return res.status(200).json({
      success: true,
      data: {
        grievance: {
          id: grievance.id,
          complaint_number: grievance.complaint_number,
          category: grievance.category,
          sub_category: grievance.sub_category,
          description: grievance.description,
          address: grievance.address,
          created_at: grievance.created_at,
          resolved_at: grievance.resolved_at,
          media_urls: grievance.media_urls,
          resolution_notes: resolutionNotes,
          assigned_department: grievance.department?.name || 'Unknown',
          assigned_officer: grievance.officer?.name || 'Unassigned',
          days_to_resolve: daysToResolve,
        },
        token_valid: true,
        token_expires_at: tokenRecord?.expires_at,
      },
    });
  } catch (error) {
    console.error('Error in getVerificationPage:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
}

/**
 * POST /api/v1/grievance/:id/verify
 *
 * Citizen submits their verification decision.
 *
 * Request Body:
 * {
 *   "token": "uuid-token",
 *   "verified": true | false,
 *   "satisfaction_score": 4,        // 1-5, required if verified=true
 *   "feedback": "The pothole...",   // optional if verified=true, required if verified=false
 * }
 */
export async function submitVerification(req: Request, res: Response) {
  try {
    const grievanceId = req.params.id as string;
    const { token, verified, satisfaction_score, feedback } = req.body;

    // --- Input Validation ---
    if (!token || typeof verified !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: token, verified (boolean).',
      });
    }

    if (verified && (!satisfaction_score || satisfaction_score < 1 || satisfaction_score > 5)) {
      return res.status(400).json({
        success: false,
        error: 'satisfaction_score (1-5) is required when verifying as resolved.',
      });
    }

    if (!verified && !feedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback is required when rejecting a resolution. Please describe what is still wrong.',
      });
    }

    // --- Token Validation ---
    const validation = await validateVerificationToken(token);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    if (validation.grievanceId !== grievanceId) {
      return res.status(400).json({
        success: false,
        error: 'Token does not match this complaint.',
      });
    }

    // --- Fetch Current Grievance ---
    const grievance = await prisma.grievances.findUnique({
      where: { id: grievanceId },
    });

    if (!grievance) {
      return res.status(404).json({
        success: false,
        error: 'Complaint not found.',
      });
    }

    if (grievance.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        error: `Cannot verify a complaint with status "${grievance.status}". Expected "resolved".`,
      });
    }

    // --- Mark Token as Used ---
    await markTokenUsed(token);

    // --- Handle Verification Decision ---
    if (verified) {
      // CITIZEN CONFIRMS: Resolution is genuine
      await prisma.grievances.update({
        where: { id: grievanceId },
        data: {
          resolution_verified: true,
          satisfaction_score: satisfaction_score,
          verification_feedback: feedback || null,
        },
      });

      await prisma.grievance_timeline.create({
        data: {
          grievance_id: grievanceId,
          event_type: 'verified',
          description: `Resolution verified by citizen. Satisfaction: ${satisfaction_score}/5.${feedback ? ` Feedback: "${feedback}"` : ''}`,
          actor: 'citizen',
          metadata: {
            verified: true,
            satisfaction_score: satisfaction_score,
            feedback: feedback || null,
          } as any,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          status: 'resolved',
          resolution_verified: true,
          satisfaction_score,
          message: 'Thank you for confirming. Your complaint has been closed.',
        },
      });
    } else {
      // CITIZEN DENIES: Resolution is false/incomplete
      const newEscalationLevel = Math.min(grievance.escalation_level + 1, 5);

      await prisma.grievances.update({
        where: { id: grievanceId },
        data: {
          status: 'reopened',
          resolution_verified: false,
          resolved_at: null,
          escalation_level: newEscalationLevel,
          verification_feedback: feedback,
        },
      });

      await prisma.grievance_timeline.create({
        data: {
          grievance_id: grievanceId,
          event_type: 'reopened',
          description: `Citizen rejected resolution. Complaint reopened and escalated to Level ${newEscalationLevel}. Reason: "${feedback}"`,
          actor: 'citizen',
          metadata: {
            verified: false,
            feedback,
            previous_escalation_level: grievance.escalation_level,
            new_escalation_level: newEscalationLevel,
          } as any,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          status: 'reopened',
          escalation_level: newEscalationLevel,
          message: `Your complaint has been reopened and escalated to Level ${newEscalationLevel}. We will ensure this is addressed properly.`,
        },
      });
    }
  } catch (error) {
    console.error('Error in submitVerification:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error.',
    });
  }
}
