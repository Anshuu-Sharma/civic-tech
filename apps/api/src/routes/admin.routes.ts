import { Router, Response } from 'express';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';
import { checkAndEscalate } from '../services/escalation.service';
import logger from '../lib/logger';

const router = Router();
const log = logger.scope('Admin');

// All admin routes require authentication
router.use(requireAuth);

// ---------- GET /api/v1/admin/queue ----------
// Get department's grievance queue (filterable by status, sortable, paginated)
// Uses the officer's own department by default, or accepts departmentId query param for commissioners
router.get('/queue', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      department_id,
      status,
      escalation_level,
      category,
      page = '1',
      limit = '20',
      sort_by = 'severity_score',
      sort_order = 'desc',
    } = req.query;

    // Determine which department to query
    const departmentId = (department_id as string) || req.officer!.departmentId;

    // Authorization: officer can only view their own department queue
    // Commissioners can view any department
    if (req.officer!.role !== 'commissioner' && req.officer!.departmentId !== departmentId) {
      return res.status(403).json({ success: false, message: 'You can only view your own department queue' });
    }

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = { assigned_department_id: departmentId };
    if (status) where.status = status;
    if (escalation_level) where.escalation_level = parseInt(escalation_level as string, 10);
    if (category) where.category = category;

    // Build orderBy
    const validSortFields = ['severity_score', 'created_at', 'escalation_level', 'updated_at'];
    const orderField = validSortFields.includes(sort_by as string)
      ? (sort_by as string)
      : 'severity_score';
    const orderDir = sort_order === 'asc' ? 'asc' : 'desc';

    const [grievances, total] = await Promise.all([
      prisma.grievances.findMany({
        where,
        orderBy: { [orderField]: orderDir },
        skip,
        take: limitNum,
        include: {
          citizen: { select: { id: true, name: true, phone: true, vulnerability_flags: true } },
          officer: { select: { id: true, name: true } },
          ward: { select: { id: true, name: true, number: true } },
        },
      }),
      prisma.grievances.count({ where }),
    ]);

    // Compute SLA deadline for each grievance based on legal_rights sla_days
    const enriched = grievances.map((g: any) => {
      const daysSinceFiled = Math.floor(
        (Date.now() - new Date(g.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );
      // Default SLA is 7 days if no legal_rights entry found
      const slaDeadline = new Date(g.created_at);
      slaDeadline.setDate(slaDeadline.getDate() + 7);

      return {
        ...g,
        days_since_filed: daysSinceFiled,
        sla_deadline: slaDeadline.toISOString(),
        sla_breached: new Date() > slaDeadline && g.status !== 'resolved',
      };
    });

    return res.json({
      success: true,
      grievances: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    log.error('[Admin] Queue error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------- GET /api/v1/admin/grievance/:id ----------
// Get full grievance detail for admin view
router.get('/grievance/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;

    const grievance = await prisma.grievances.findUnique({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            phone: true,
            preferred_language: true,
            preferred_channel: true,
            vulnerability_flags: true,
            total_complaints: true,
          },
        },
        officer: { select: { id: true, name: true, email: true, role: true } },
        department: { select: { id: true, name: true } },
        ward: { select: { id: true, name: true, number: true } },
        community_issue: { select: { id: true, title: true, linked_grievance_count: true } },
        timeline: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    // Authorization: officer can only view grievances in their department (commissioners can view all)
    if (
      req.officer!.role !== 'commissioner' &&
      grievance.assigned_department_id !== req.officer!.departmentId
    ) {
      return res.status(403).json({ success: false, message: 'You can only view grievances in your own department' });
    }

    // Fetch legal rights for this category
    const legalRights = await prisma.legal_rights.findMany({
      where: { category: grievance.category },
    });

    // Compute SLA info
    const daysSinceFiled = Math.floor(
      (Date.now() - new Date(grievance.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    const slaDays = legalRights.length > 0 ? Math.min(...legalRights.map((r) => r.sla_days)) : 7;
    const slaDeadline = new Date(grievance.created_at);
    slaDeadline.setDate(slaDeadline.getDate() + slaDays);

    return res.json({
      success: true,
      grievance: {
        ...grievance,
        days_since_filed: daysSinceFiled,
        sla_days: slaDays,
        sla_deadline: slaDeadline.toISOString(),
        sla_breached: new Date() > slaDeadline && grievance.status !== 'resolved',
      },
      legal_rights: legalRights,
    });
  } catch (error: any) {
    log.error('[Admin] Grievance detail error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------- PATCH /api/v1/admin/grievance/:id/update ----------
// Update status (acknowledge, assign, in_progress, resolved), assign officer, add notes
router.patch('/grievance/:id/update', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status, officer_id, notes } = req.body;

    const grievance = await prisma.grievances.findUnique({ where: { id } });
    if (!grievance) {
      return res.status(404).json({ success: false, message: 'Grievance not found' });
    }

    // Authorization: officer can only modify grievances in their department
    if (
      req.officer!.role !== 'commissioner' &&
      grievance.assigned_department_id !== req.officer!.departmentId
    ) {
      return res.status(403).json({ success: false, message: 'You can only modify grievances in your own department' });
    }

    // Status transition validation
    const validTransitions: Record<string, string[]> = {
      open: ['acknowledged', 'in_progress'],
      acknowledged: ['in_progress', 'resolved'],
      in_progress: ['resolved'],
      resolved: ['reopened'],
      reopened: ['in_progress', 'resolved'],
      escalated: ['acknowledged', 'in_progress', 'resolved'],
    };

    if (status) {
      const allowed = validTransitions[grievance.status] || [];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid transition: '${grievance.status}' -> '${status}'. Allowed: ${allowed.join(', ')}`,
        });
      }

      if (status === 'resolved' && !notes) {
        return res.status(400).json({ success: false, message: 'Notes are required when resolving a grievance' });
      }
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date(),
    };

    if (status) {
      updateData.status = status;
      if (status === 'resolved') {
        updateData.resolved_at = new Date();
      }
    }

    if (officer_id) {
      // Verify the target officer exists
      const targetOfficer = await prisma.officers.findUnique({
        where: { id: officer_id },
        select: { id: true, name: true, department_id: true },
      });
      if (!targetOfficer) {
        return res.status(404).json({ success: false, message: 'Target officer not found' });
      }
      // Ward officers cannot reassign others' complaints
      if (req.officer!.role === 'ward_officer' && req.officer!.officerId !== grievance.assigned_officer_id) {
        return res.status(403).json({ success: false, message: 'Ward officers cannot reassign others\' complaints' });
      }
      updateData.assigned_officer_id = officer_id;
    }

    // If acknowledging and no officer assigned yet, assign to current officer
    if (status === 'acknowledged' && !grievance.assigned_officer_id && !officer_id) {
      updateData.assigned_officer_id = req.officer!.officerId;
    }

    // Build timeline entry
    let timelineDescription = '';
    let timelineEventType: 'acknowledged' | 'assigned' | 'status_change' | 'resolved' = 'status_change';

    if (status === 'acknowledged') {
      timelineEventType = 'acknowledged';
      timelineDescription = 'Complaint acknowledged by officer';
    } else if (status === 'resolved') {
      timelineEventType = 'resolved';
      timelineDescription = notes ? `Resolved: ${notes}` : 'Complaint resolved';
    } else if (status) {
      timelineDescription = notes
        ? `Status changed to '${status}': ${notes}`
        : `Status changed to '${status}'`;
    } else if (officer_id) {
      timelineEventType = 'assigned';
      const targetOfficer = await prisma.officers.findUnique({
        where: { id: officer_id },
        select: { name: true },
      });
      timelineDescription = `Assigned to ${targetOfficer?.name || 'officer'}`;
    } else {
      // notes-only update
      timelineDescription = notes || 'Updated by officer';
    }

    const [updated, timeline] = await prisma.$transaction([
      prisma.grievances.update({
        where: { id },
        data: updateData,
      }),
      prisma.grievance_timeline.create({
        data: {
          grievance_id: id,
          event_type: timelineEventType,
          description: timelineDescription,
          actor: req.officer!.officerId,
          metadata: {
            from_status: grievance.status,
            to_status: status || grievance.status,
            notes: notes || null,
            officer_email: req.officer!.email,
            assigned_officer_id: officer_id || null,
          },
        },
      }),
    ]);

    return res.json({ success: true, grievance: updated, timeline_entry: timeline });
  } catch (error: any) {
    log.error('[Admin] Grievance update error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------- GET /api/v1/admin/stats ----------
// Department-level stats for admin dashboard
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const departmentId = (req.query.department_id as string) || req.officer!.departmentId;

    if (req.officer!.role !== 'commissioner' && req.officer!.departmentId !== departmentId) {
      return res.status(403).json({ success: false, message: 'You can only view your own department stats' });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      openCount,
      acknowledgedCount,
      inProgressCount,
      resolvedTodayCount,
      escalatedCount,
      totalResolved,
      categoryBreakdown,
      avgResolutionTimeResult,
      slaBreachCount,
    ] = await Promise.all([
      prisma.grievances.count({
        where: { assigned_department_id: departmentId, status: 'open' },
      }),
      prisma.grievances.count({
        where: { assigned_department_id: departmentId, status: 'acknowledged' },
      }),
      prisma.grievances.count({
        where: { assigned_department_id: departmentId, status: 'in_progress' },
      }),
      prisma.grievances.count({
        where: {
          assigned_department_id: departmentId,
          status: 'resolved',
          resolved_at: { gte: todayStart },
        },
      }),
      prisma.grievances.count({
        where: { assigned_department_id: departmentId, escalation_level: { gte: 2 } },
      }),
      prisma.grievances.count({
        where: { assigned_department_id: departmentId, status: 'resolved' },
      }),
      prisma.grievances.groupBy({
        by: ['category'],
        where: { assigned_department_id: departmentId },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // Average resolution time in hours for resolved grievances
      prisma.$queryRaw`
        SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_hours
        FROM grievances
        WHERE assigned_department_id = ${departmentId}::uuid
          AND status = 'resolved'
          AND resolved_at IS NOT NULL
      ` as Promise<Array<{ avg_hours: number | null }>>,
      // SLA breach: still open past 7 days
      prisma.grievances.count({
        where: {
          assigned_department_id: departmentId,
          created_at: { lte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          status: { not: 'resolved' },
        },
      }),
    ]);

    const avgResolutionHours = avgResolutionTimeResult[0]?.avg_hours
      ? Math.round(Number(avgResolutionTimeResult[0].avg_hours) * 10) / 10
      : null;

    return res.json({
      success: true,
      department_id: departmentId,
      stats: {
        open: openCount,
        acknowledged: acknowledgedCount,
        in_progress: inProgressCount,
        resolved_today: resolvedTodayCount,
        total_resolved: totalResolved,
        escalated: escalatedCount,
        avg_resolution_hours: avgResolutionHours,
        sla_breaches: slaBreachCount,
      },
      by_category: categoryBreakdown.map((c: any) => ({
        category: c.category,
        count: c._count.id,
      })),
    });
  } catch (error: any) {
    log.error('[Admin] Stats error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------- GET /api/v1/admin/escalations ----------
// Get escalated grievances (department_head and commissioner only)
router.get(
  '/escalations',
  requireRole('department_head', 'commissioner'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page = '1', limit = '50' } = req.query;
      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const where: any = { escalation_level: { gte: 2 } };

      // Department heads only see their own department escalations
      if (req.officer!.role === 'department_head') {
        where.assigned_department_id = req.officer!.departmentId;
      }

      const [grievances, total] = await Promise.all([
        prisma.grievances.findMany({
          where,
          orderBy: [{ escalation_level: 'desc' }, { severity_score: 'desc' }],
          skip,
          take: limitNum,
          include: {
            citizen: { select: { id: true, name: true, phone: true } },
            officer: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
          },
        }),
        prisma.grievances.count({ where }),
      ]);

      // Add time-until-next-escalation
      const escalationThresholds: Record<number, number> = {
        2: 96, // hours until Level 3
        3: 168, // hours until Level 4 (7 days total)
        4: 336, // hours until Level 5 (14 days total)
        5: 0, // already max level
      };

      const enriched = grievances.map((g: any) => {
        const hoursSinceFiled = (Date.now() - new Date(g.created_at).getTime()) / (1000 * 60 * 60);
        const nextThreshold = escalationThresholds[g.escalation_level] || 0;
        const hoursUntilNextEscalation =
          nextThreshold > 0 ? Math.max(0, nextThreshold - hoursSinceFiled) : null;

        return {
          ...g,
          hours_since_filed: Math.round(hoursSinceFiled),
          hours_until_next_escalation: hoursUntilNextEscalation
            ? Math.round(hoursUntilNextEscalation)
            : null,
          next_escalation_level: g.escalation_level < 5 ? g.escalation_level + 1 : null,
        };
      });

      return res.json({
        success: true,
        grievances: enriched,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error: any) {
      log.error('[Admin] Escalations error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ---------- POST /api/v1/admin/grievance/:id/escalate ----------
// Manually trigger escalation for a specific grievance
router.post(
  '/grievance/:id/escalate',
  requireRole('department_head', 'commissioner'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;

      const grievance = await prisma.grievances.findUnique({ where: { id } });
      if (!grievance) {
        return res.status(404).json({ success: false, message: 'Grievance not found' });
      }

      if (grievance.escalation_level >= 5) {
        return res.status(400).json({ success: false, message: 'Grievance is already at maximum escalation level' });
      }

      if (grievance.status === 'resolved') {
        return res.status(400).json({ success: false, message: 'Cannot escalate a resolved grievance' });
      }

      const newLevel = grievance.escalation_level + 1;
      const updateData: any = {
        escalation_level: newLevel,
        updated_at: new Date(),
      };

      // Determine new assignee based on escalation level
      if (newLevel === 2 && grievance.assigned_department_id) {
        const dept = await prisma.departments.findUnique({
          where: { id: grievance.assigned_department_id },
          select: { head_officer_id: true },
        });
        if (dept?.head_officer_id) {
          updateData.assigned_officer_id = dept.head_officer_id;
        }
      } else if (newLevel >= 3) {
        const commissioner = await prisma.officers.findFirst({
          where: { role: 'commissioner' },
          select: { id: true },
        });
        if (commissioner) {
          updateData.assigned_officer_id = commissioner.id;
        }
      }

      if (newLevel === 5) {
        updateData.status = 'escalated';
      }

      const [updated, timeline] = await prisma.$transaction([
        prisma.grievances.update({
          where: { id },
          data: updateData,
        }),
        prisma.grievance_timeline.create({
          data: {
            grievance_id: id,
            event_type: 'escalated',
            description: reason
              ? `Manually escalated to Level ${newLevel}: ${reason}`
              : `Manually escalated to Level ${newLevel}`,
            actor: req.officer!.officerId,
            metadata: {
              from_level: grievance.escalation_level,
              to_level: newLevel,
              manual: true,
              reason: reason || 'Manual escalation by officer',
              officer_email: req.officer!.email,
              reassigned_to: updateData.assigned_officer_id || 'none',
            },
          },
        }),
      ]);

      return res.json({ success: true, grievance: updated, timeline_entry: timeline });
    } catch (error: any) {
      log.error('[Admin] Manual escalation error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

// ---------- GET /api/v1/admin/officers ----------
// Returns officers in a department (for the assignment dropdown)
router.get('/officers', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const departmentId = (req.query.department_id as string) || req.officer!.departmentId;

    const officers = await prisma.officers.findMany({
      where: { department_id: departmentId },
      select: { id: true, name: true, email: true, role: true, ward_id: true },
      orderBy: { name: 'asc' },
    });

    return res.json({ success: true, officers });
  } catch (error: any) {
    log.error('[Admin] Officers list error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------- GET /api/v1/admin/activity ----------
// Returns recent timeline entries across all complaints for the activity feed
router.get('/activity', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { limit = '10' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

    const where: any = {};
    // Non-commissioners only see their department activity
    if (req.officer!.role !== 'commissioner') {
      where.grievance = { assigned_department_id: req.officer!.departmentId };
    }

    const entries = await prisma.grievance_timeline.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limitNum,
      include: {
        grievance: {
          select: { id: true, complaint_number: true, category: true },
        },
      },
    });

    return res.json({ success: true, entries });
  } catch (error: any) {
    log.error('[Admin] Activity error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// ---------- POST /api/v1/admin/escalation/run ----------
// Manual trigger for escalation check (useful for demos)
router.post(
  '/escalation/run',
  requireRole('department_head', 'commissioner'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await checkAndEscalate();
      return res.json({
        success: true,
        message: 'Escalation check completed',
        ...result,
      });
    } catch (error: any) {
      log.error('[Admin] Manual escalation run error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
);

export default router;
