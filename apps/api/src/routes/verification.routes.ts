// ============================================================
// apps/api/src/routes/verification.routes.ts
// Public routes for citizen resolution verification.
// No auth required - access is controlled by token.
// ============================================================

import { Router } from 'express';
import {
  getVerificationPage,
  submitVerification,
} from '../controllers/verification.controller';

const router = Router();

// GET /api/v1/grievance/:id/verify/:token - Validate token and get grievance summary
router.get('/grievance/:id/verify/:token', getVerificationPage);

// GET /api/v1/grievance/verify-by-token/:token - Lookup grievance by token only (for frontend /verify/[token] page)
router.get('/grievance/verify-by-token/:token', async (req, res) => {
  try {
    const token = req.params.token as string;
    const { prisma } = await import('../lib/prisma');

    // Look up the token
    const tokenRecord = await prisma.verification_tokens.findUnique({
      where: { token },
      include: {
        grievance: {
          include: {
            department: true,
            officer: true,
            timeline: {
              orderBy: { created_at: 'desc' },
              take: 20,
            },
          },
        },
      },
    });

    if (!tokenRecord) {
      return res.status(404).json({ success: false, error: 'Invalid verification token.' });
    }

    if (tokenRecord.used) {
      return res.status(400).json({ success: false, error: 'This verification link has already been used.' });
    }

    if (new Date() > tokenRecord.expires_at) {
      return res.status(400).json({ success: false, error: 'This verification link has expired.' });
    }

    const g = tokenRecord.grievance as any;

    // Extract resolution notes from timeline
    const resolvedEntry = g.timeline?.find((t: any) => t.event_type === 'resolved');
    const resolutionNotes = resolvedEntry?.metadata?.notes || resolvedEntry?.description || '';

    // Calculate days to resolve
    const createdAt = new Date(g.created_at);
    const resolvedAt = g.resolved_at ? new Date(g.resolved_at) : new Date();
    const daysToResolve = Math.ceil((resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    return res.json({
      success: true,
      data: {
        grievance: {
          id: g.id,
          complaint_number: g.complaint_number,
          category: g.category,
          description: g.description,
          address: g.address,
          resolution_notes: resolutionNotes,
          department: g.department?.name || 'Unknown',
          officer: g.officer?.name || '',
          days_to_resolve: daysToResolve,
        },
        token: {
          valid: true,
          expires_at: tokenRecord.expires_at.toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('[VerifyByToken] Error:', error.message);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/v1/grievance/:id/verify - Submit verification decision
router.post('/grievance/:id/verify', submitVerification);

export default router;
