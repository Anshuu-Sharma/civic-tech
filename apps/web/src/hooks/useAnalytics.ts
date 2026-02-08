'use client';

import { useState, useCallback, useEffect } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export interface HeatmapFilters {
  category?: string;
  status?: string;
  ward_id?: string;
  severity_min?: number;
  severity_max?: number;
  date_from?: string;
  date_to?: string;
}

export interface HeatmapGrievance {
  id: string;
  complaint_number: string;
  category: string;
  sub_category: string;
  description: string;
  latitude: number;
  longitude: number;
  address: string;
  severity_score: number;
  status: string;
  escalation_level: number;
  created_at: string;
  assigned_department: string;
}

export interface CommunityIssue {
  id: string;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  linked_grievance_count: number;
  severity_score: number;
  status: string;
}

export interface HeatmapSummary {
  total_grievances: number;
  open: number;
  acknowledged: number;
  in_progress: number;
  resolved: number;
  escalated: number;
  reopened: number;
}

export interface HeatmapData {
  grievances: HeatmapGrievance[];
  community_issues: CommunityIssue[];
  summary: HeatmapSummary;
}

export interface WardScorecard {
  ward_id: string;
  ward_name: string;
  ward_number: number;
  zone: string;
  total_complaints: number;
  avg_resolution_days: number | null;
  sla_compliance_pct: number;
  avg_satisfaction: number | null;
  open_count: number;
  in_progress_count: number;
  resolved_count: number;
  escalated_count: number;
  this_month_count: number;
  last_month_count: number;
  month_over_month_pct: number;
}

export interface TrendPoint {
  period_start: string;
  total: number;
  resolved: number;
  escalated: number;
  avg_severity: number;
}

export interface TrendsData {
  period: 'daily' | 'weekly' | 'monthly';
  trends: TrendPoint[];
  category_breakdown: { period_start: string; category: string; count: number }[];
}

export function useHeatmapData(initialFilters?: HeatmapFilters) {
  const [data, setData] = useState<HeatmapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HeatmapFilters>(initialFilters ?? {});

  const fetchData = useCallback(async (f: HeatmapFilters) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(f).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== null) {
          params.set(key, String(value));
        }
      });

      const res = await fetch(`${API_URL}/api/v1/analytics/heatmap?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message ?? 'Failed to fetch heatmap data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, []);

  const applyFilters = useCallback((newFilters: HeatmapFilters) => {
    setFilters(newFilters);
    fetchData(newFilters);
  }, [fetchData]);

  const resetFilters = useCallback(() => {
    const empty: HeatmapFilters = {};
    setFilters(empty);
    fetchData(empty);
  }, [fetchData]);

  return { data, loading, error, filters, applyFilters, resetFilters };
}

export function useWardScorecards() {
  const [wards, setWards] = useState<WardScorecard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWards = useCallback(async (
    sortBy = 'total_complaints',
    sortOrder = 'desc'
  ) => {
    setLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/v1/analytics/wards?sort_by=${sortBy}&sort_order=${sortOrder}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setWards(json.data.wards);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWards();
  }, [fetchWards]);

  return { wards, loading, error, refetch: fetchWards };
}

export function useTrends(
  wardId?: string,
  category?: string,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
) {
  const [data, setData] = useState<TrendsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ period });
    if (wardId) params.set('ward_id', wardId);
    if (category) params.set('category', category);

    fetch(`${API_URL}/api/v1/analytics/trends?${params.toString()}`)
      .then((res) => res.json())
      .then((json) => setData(json.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [wardId, category, period]);

  return { data, loading };
}
