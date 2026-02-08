import { prisma } from '../lib/prisma';

/**
 * Escalation thresholds.
 * Key = current level, value = { hours: hours since created_at to trigger, blockingStatuses: statuses that PREVENT escalation }
 *
 * Level 1 -> 2: No acknowledgment within 48 hours
 * Level 2 -> 3: No action within 96 hours (4 days)
 * Level 3 -> 4: Not resolved within 168 hours (7 days)
 * Level 4 -> 5: Not resolved within 336 hours (14 days)
 */
const ESCALATION_RULES: Record<
  number,
  { hours: number; blockingStatuses: string[]; label: string }
> = {
  1: {
    hours: 48,
    blockingStatuses: ['acknowledged', 'in_progress', 'resolved', 'reopened'],
    label: 'Auto-escalated to Level 2: no acknowledgment within 48 hours',
  },
  2: {
    hours: 96,
    blockingStatuses: ['in_progress', 'resolved'],
    label: 'Auto-escalated to Level 3: no action within 96 hours',
  },
  3: {
    hours: 168, // 7 days
    blockingStatuses: ['resolved'],
    label: 'Auto-escalated to Level 4: not resolved within 7 days',
  },
  4: {
    hours: 336, // 14 days
    blockingStatuses: ['resolved'],
    label: 'Auto-escalated to Level 5: not resolved within 14 days',
  },
};

/**
 * For Level 2 escalation, reassign to department head.
 * For Level 3+, reassign to commissioner.
 */
async function getEscalationTarget(
  grievance: { assigned_department_id: string | null },
  newLevel: number
): Promise<string | null> {
  if (newLevel === 2 && grievance.assigned_department_id) {
    // Reassign to department head
    const dept = await prisma.departments.findUnique({
      where: { id: grievance.assigned_department_id },
      select: { head_officer_id: true },
    });
    return dept?.head_officer_id || null;
  }

  if (newLevel >= 3) {
    // Reassign to commissioner (role = 'commissioner')
    const commissioner = await prisma.officers.findFirst({
      where: { role: 'commissioner' },
      select: { id: true },
    });
    return commissioner?.id || null;
  }

  return null;
}

export interface EscalationResult {
  total_checked: number;
  escalated: number;
  by_level: Record<number, number>;
  errors: number;
}

/**
 * Core escalation logic. Called by cron job every hour and by manual trigger.
 *
 * Algorithm:
 * 1. Query all unresolved grievances that are not at max escalation level
 * 2. For each, check if current level has a rule and if time threshold is exceeded
 * 3. Check if grievance status is NOT in the blocking list (blocking means progress has been made)
 * 4. If escalation is needed: update level, reassign, create timeline entry, apply special flags
 */
export async function checkAndEscalate(): Promise<EscalationResult> {
  const result: EscalationResult = {
    total_checked: 0,
    escalated: 0,
    by_level: { 2: 0, 3: 0, 4: 0, 5: 0 },
    errors: 0,
  };

  try {
    // Fetch all grievances that are NOT resolved and NOT already at max escalation
    const grievances = await prisma.grievances.findMany({
      where: {
        status: { notIn: ['resolved'] },
        escalation_level: { lt: 5 },
      },
      select: {
        id: true,
        complaint_number: true,
        status: true,
        escalation_level: true,
        created_at: true,
        assigned_department_id: true,
        assigned_officer_id: true,
        category: true,
      },
    });

    result.total_checked = grievances.length;
    const now = Date.now();

    for (const grievance of grievances) {
      try {
        const currentLevel = grievance.escalation_level;
        const rule = ESCALATION_RULES[currentLevel];

        if (!rule) continue; // No rule for this level (shouldn't happen for levels 1-4)

        const hoursSinceFiled =
          (now - new Date(grievance.created_at).getTime()) / (1000 * 60 * 60);

        // Check if time threshold has been exceeded
        if (hoursSinceFiled < rule.hours) continue;

        // Check if current status blocks this escalation
        if (rule.blockingStatuses.includes(grievance.status)) continue;

        // --- ESCALATE ---
        const newLevel = currentLevel + 1;
        const newOfficerId = await getEscalationTarget(grievance, newLevel);

        const updateData: any = {
          escalation_level: newLevel,
          updated_at: new Date(),
        };

        // Reassign if a target officer was found
        if (newOfficerId) {
          updateData.assigned_officer_id = newOfficerId;
        }

        // Level 5: mark status as escalated for visibility
        if (newLevel === 5) {
          updateData.status = 'escalated';
        }

        await prisma.$transaction([
          prisma.grievances.update({
            where: { id: grievance.id },
            data: updateData,
          }),
          prisma.grievance_timeline.create({
            data: {
              grievance_id: grievance.id,
              event_type: 'escalated',
              description: rule.label,
              actor: 'system',
              metadata: {
                from_level: currentLevel,
                to_level: newLevel,
                hours_since_filed: Math.round(hoursSinceFiled),
                reassigned_to: newOfficerId || 'none',
                reason:
                  newLevel === 4
                    ? 'RTI auto-draft now available for citizen'
                    : newLevel === 5
                    ? 'Marked as systemic failure'
                    : 'Time threshold exceeded',
              },
            },
          }),
        ]);

        result.escalated++;
        result.by_level[newLevel] = (result.by_level[newLevel] || 0) + 1;

        console.log(
          `[Escalation] ${grievance.complaint_number}: Level ${currentLevel} -> ${newLevel} (${Math.round(hoursSinceFiled)}h old)`
        );
      } catch (err: any) {
        result.errors++;
        console.error(`[Escalation] Error processing ${grievance.id}:`, err.message);
      }
    }

    console.log(
      `[Escalation] Complete: checked=${result.total_checked}, escalated=${result.escalated}, by_level=${JSON.stringify(result.by_level)}, errors=${result.errors}`
    );

    return result;
  } catch (error: any) {
    console.error('[Escalation] Fatal error:', error);
    throw error;
  }
}
