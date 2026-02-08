import { prisma } from '../lib/prisma';
import type { HeatmapQuery, WardsQuery, TrendsQuery } from '../validators/analytics.validator';

export class AnalyticsService {
  async getHeatmapData(filters: HeatmapQuery) {
    const defaultDateFrom = new Date();
    defaultDateFrom.setDate(defaultDateFrom.getDate() - 30);

    const dateFrom = filters.date_from ?? defaultDateFrom;
    const dateTo = filters.date_to ?? new Date();

    const conditions: string[] = ['g.created_at >= $1', 'g.created_at <= $2'];
    const params: any[] = [dateFrom, dateTo];
    let paramIdx = 3;

    if (filters.category) {
      conditions.push(`g.category = $${paramIdx}`);
      params.push(filters.category);
      paramIdx++;
    }

    if (filters.status) {
      conditions.push(`g.status = $${paramIdx}`);
      params.push(filters.status);
      paramIdx++;
    }

    if (filters.ward_id) {
      conditions.push(`g.ward_id = $${paramIdx}::uuid`);
      params.push(filters.ward_id);
      paramIdx++;
    }

    if (filters.severity_min !== undefined) {
      conditions.push(`g.severity_score >= $${paramIdx}`);
      params.push(filters.severity_min);
      paramIdx++;
    }

    if (filters.severity_max !== undefined) {
      conditions.push(`g.severity_score <= $${paramIdx}`);
      params.push(filters.severity_max);
      paramIdx++;
    }

    if (
      filters.sw_lat !== undefined &&
      filters.sw_lng !== undefined &&
      filters.ne_lat !== undefined &&
      filters.ne_lng !== undefined
    ) {
      conditions.push(
        `ST_Within(g.location, ST_MakeEnvelope($${paramIdx}, $${paramIdx + 1}, $${paramIdx + 2}, $${paramIdx + 3}, 4326))`
      );
      params.push(filters.sw_lng, filters.sw_lat, filters.ne_lng, filters.ne_lat);
      paramIdx += 4;
    }

    const whereClause = conditions.join(' AND ');

    const grievancesQuery = `
      SELECT
        g.id,
        g.complaint_number,
        g.category,
        g.sub_category,
        LEFT(g.description, 200) AS description,
        ST_Y(g.location::geometry) AS latitude,
        ST_X(g.location::geometry) AS longitude,
        g.address,
        g.severity_score,
        g.status,
        g.escalation_level,
        g.created_at,
        d.name AS assigned_department
      FROM grievances g
      LEFT JOIN departments d ON g.assigned_department_id = d.id
      WHERE ${whereClause}
      ORDER BY g.severity_score DESC, g.created_at DESC
      LIMIT 2000
    `;

    const grievances = await prisma.$queryRawUnsafe(grievancesQuery, ...params);

    const ciConditions: string[] = ['ci.created_at >= $1', 'ci.created_at <= $2'];
    const ciParams: any[] = [dateFrom, dateTo];
    let ciIdx = 3;

    if (filters.category) {
      ciConditions.push(`ci.category = $${ciIdx}`);
      ciParams.push(filters.category);
      ciIdx++;
    }

    const ciWhereClause = ciConditions.join(' AND ');

    const communityIssuesQuery = `
      SELECT
        ci.id,
        ci.title,
        ci.category,
        ST_Y(ci.centroid::geometry) AS latitude,
        ST_X(ci.centroid::geometry) AS longitude,
        ci.radius_meters,
        ci.linked_grievance_count,
        ci.severity_score,
        ci.status
      FROM community_issues ci
      WHERE ${ciWhereClause}
      ORDER BY ci.severity_score DESC
      LIMIT 200
    `;

    const communityIssues = await prisma.$queryRawUnsafe(communityIssuesQuery, ...ciParams);

    const summaryQuery = `
      SELECT
        COUNT(*)::int AS total_grievances,
        COUNT(*) FILTER (WHERE g.status = 'open')::int AS open,
        COUNT(*) FILTER (WHERE g.status = 'in_progress')::int AS in_progress,
        COUNT(*) FILTER (WHERE g.status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE g.status = 'escalated')::int AS escalated,
        COUNT(*) FILTER (WHERE g.status = 'acknowledged')::int AS acknowledged,
        COUNT(*) FILTER (WHERE g.status = 'reopened')::int AS reopened
      FROM grievances g
      WHERE ${whereClause}
    `;

    const summaryRows = await prisma.$queryRawUnsafe(summaryQuery, ...params) as any[];
    const summary = summaryRows[0];

    return {
      grievances,
      community_issues: communityIssues,
      summary: {
        total_grievances: summary.total_grievances,
        open: summary.open,
        acknowledged: summary.acknowledged,
        in_progress: summary.in_progress,
        resolved: summary.resolved,
        escalated: summary.escalated,
        reopened: summary.reopened,
      },
    };
  }

  async getWardScorecards(query: WardsQuery) {
    const sortColumn: Record<string, string> = {
      total_complaints: 'total_complaints',
      avg_resolution_days: 'avg_resolution_days',
      sla_compliance: 'sla_compliance_pct',
      satisfaction_score: 'avg_satisfaction',
      name: 'w.name',
    };

    const sort = sortColumn[query.sort_by] || 'total_complaints';
    const order = query.sort_order === 'asc' ? 'ASC' : 'DESC';

    const wardScorecardsQuery = `
      WITH ward_stats AS (
        SELECT
          w.id AS ward_id,
          w.name AS ward_name,
          w.number AS ward_number,
          w.zone,
          COUNT(g.id)::int AS total_complaints,
          ROUND(
            AVG(
              CASE WHEN g.resolved_at IS NOT NULL
                THEN EXTRACT(EPOCH FROM (g.resolved_at - g.created_at)) / 86400.0
                ELSE NULL
              END
            )::numeric, 1
          ) AS avg_resolution_days,
          ROUND(AVG(g.satisfaction_score)::numeric, 1) AS avg_satisfaction,
          COUNT(*) FILTER (WHERE g.status = 'open')::int AS open_count,
          COUNT(*) FILTER (WHERE g.status = 'in_progress')::int AS in_progress_count,
          COUNT(*) FILTER (WHERE g.status = 'resolved')::int AS resolved_count,
          COUNT(*) FILTER (WHERE g.status = 'escalated')::int AS escalated_count,
          COUNT(*) FILTER (
            WHERE g.created_at >= date_trunc('month', CURRENT_DATE)
          )::int AS this_month_count,
          COUNT(*) FILTER (
            WHERE g.created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
              AND g.created_at < date_trunc('month', CURRENT_DATE)
          )::int AS last_month_count
        FROM wards w
        LEFT JOIN grievances g ON g.ward_id = w.id
        GROUP BY w.id, w.name, w.number, w.zone
      ),
      sla_stats AS (
        SELECT
          g.ward_id,
          COUNT(*) FILTER (
            WHERE g.resolved_at IS NOT NULL
              AND EXTRACT(EPOCH FROM (g.resolved_at - g.created_at)) / 86400.0
                  <= COALESCE(lr.sla_days, 14)
          )::float
          /
          NULLIF(COUNT(*) FILTER (WHERE g.resolved_at IS NOT NULL), 0)::float
          * 100 AS sla_compliance_pct
        FROM grievances g
        LEFT JOIN legal_rights lr ON lr.category = g.category AND lr.state = 'central'
        GROUP BY g.ward_id
      )
      SELECT
        ws.ward_id,
        ws.ward_name,
        ws.ward_number,
        ws.zone,
        ws.total_complaints,
        ws.avg_resolution_days,
        ROUND(COALESCE(ss.sla_compliance_pct, 0)::numeric, 1) AS sla_compliance_pct,
        ws.avg_satisfaction,
        ws.open_count,
        ws.in_progress_count,
        ws.resolved_count,
        ws.escalated_count,
        ws.this_month_count,
        ws.last_month_count,
        CASE
          WHEN ws.last_month_count = 0 THEN 0
          ELSE ROUND(
            ((ws.this_month_count - ws.last_month_count)::numeric
              / ws.last_month_count::numeric) * 100, 1
          )
        END AS month_over_month_pct
      FROM ward_stats ws
      LEFT JOIN sla_stats ss ON ss.ward_id = ws.ward_id
      ORDER BY ${sort} ${order}
    `;

    const wards = await prisma.$queryRawUnsafe(wardScorecardsQuery);
    return { wards };
  }

  async getTrends(query: TrendsQuery) {
    const defaultDateFrom = new Date();
    defaultDateFrom.setMonth(defaultDateFrom.getMonth() - 6);

    const dateFrom = query.date_from ?? defaultDateFrom;
    const dateTo = query.date_to ?? new Date();

    const truncInterval: Record<string, string> = {
      daily: 'day',
      weekly: 'week',
      monthly: 'month',
    };

    const interval = truncInterval[query.period] || 'week';

    const conditions: string[] = ['g.created_at >= $1', 'g.created_at <= $2'];
    const params: any[] = [dateFrom, dateTo];
    let paramIdx = 3;

    if (query.ward_id) {
      conditions.push(`g.ward_id = $${paramIdx}::uuid`);
      params.push(query.ward_id);
      paramIdx++;
    }

    if (query.category) {
      conditions.push(`g.category = $${paramIdx}`);
      params.push(query.category);
      paramIdx++;
    }

    const whereClause = conditions.join(' AND ');

    const trendsQuery = `
      SELECT
        date_trunc('${interval}', g.created_at) AS period_start,
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE g.status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE g.status = 'escalated')::int AS escalated,
        ROUND(AVG(g.severity_score)::numeric, 1) AS avg_severity
      FROM grievances g
      WHERE ${whereClause}
      GROUP BY period_start
      ORDER BY period_start ASC
    `;

    const categoryBreakdownQuery = `
      SELECT
        date_trunc('${interval}', g.created_at) AS period_start,
        g.category,
        COUNT(*)::int AS count
      FROM grievances g
      WHERE ${whereClause}
      GROUP BY period_start, g.category
      ORDER BY period_start ASC, count DESC
    `;

    const [trendRows, categoryRows] = await Promise.all([
      prisma.$queryRawUnsafe(trendsQuery, ...params),
      prisma.$queryRawUnsafe(categoryBreakdownQuery, ...params),
    ]);

    return {
      period: query.period,
      trends: trendRows,
      category_breakdown: categoryRows,
    };
  }
}
