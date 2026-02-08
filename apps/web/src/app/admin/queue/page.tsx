'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, CheckCircle, Clock, Eye, Inbox, Search,
  ChevronLeft, ChevronRight, Loader2, SlidersHorizontal,
  ArrowUpDown, Timer, ShieldAlert
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'acknowledged', label: 'Acknowledged' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'escalated', label: 'Escalated' },
  { key: 'resolved', label: 'Resolved' },
];

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  open: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50' },
  acknowledged: { label: 'Acknowledged', color: 'text-cyan-700', bg: 'bg-cyan-50' },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50' },
  escalated: { label: 'Escalated', color: 'text-red-700', bg: 'bg-red-50' },
  resolved: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-50' },
  reopened: { label: 'Reopened', color: 'text-purple-700', bg: 'bg-purple-50' },
};

const CATEGORY_LABELS: Record<string, string> = {
  water_supply: 'Water Supply',
  electricity: 'Electricity',
  roads_potholes: 'Roads/Potholes',
  sanitation_garbage: 'Sanitation',
  drainage_sewage: 'Drainage',
  street_lighting: 'Street Lights',
  public_transport: 'Transport',
  ration_card_pds: 'Ration/PDS',
  pension_welfare: 'Pension/Welfare',
  corruption_misconduct: 'Corruption',
  building_construction: 'Building',
  parks_public_spaces: 'Parks',
};

interface Grievance {
  id: string;
  complaint_number: string;
  category: string;
  sub_category: string;
  description: string;
  severity_score: number;
  status: string;
  escalation_level: number;
  created_at: string;
  updated_at: string;
  days_since_filed: number;
  sla_deadline: string;
  sla_breached: boolean;
  citizen?: { name: string; phone: string; vulnerability_flags: string[] };
  assigned_officer?: { name: string };
}

export default function QueuePage() {
  const { data: session } = useSession();
  const adminFetch = useAdminFetch();
  const router = useRouter();

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState('severity_score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchQueue = useCallback(async () => {
    if (!session?.user?.departmentId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        sort_by: sortBy,
        sort_order: sortOrder,
      });
      if (activeTab !== 'all') params.set('status', activeTab);

      const res = await adminFetch(`/api/v1/admin/queue/${session.user.departmentId}?${params}`);
      setGrievances(res.grievances || []);
      setTotalPages(res.pagination?.total_pages || 1);
      setTotal(res.pagination?.total || 0);
    } catch {
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.departmentId, page, activeTab, sortBy, sortOrder, adminFetch]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const filteredGrievances = search
    ? grievances.filter(
        (g) =>
          g.complaint_number?.toLowerCase().includes(search.toLowerCase()) ||
          g.description?.toLowerCase().includes(search.toLowerCase()) ||
          g.citizen?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : grievances;

  function getSeverityColor(score: number) {
    if (score >= 80) return 'text-red-700 bg-red-50';
    if (score >= 60) return 'text-orange-700 bg-orange-50';
    if (score >= 40) return 'text-amber-700 bg-amber-50';
    return 'text-green-700 bg-green-50';
  }

  function toggleSort(field: string) {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setPage(1);
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-civic-900">Department Queue</h2>
          <p className="text-xs text-gray-500">{total} total grievances</p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search complaints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-saffron-500/30 focus:border-saffron-500 w-64"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`
              px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all
              ${activeTab === tab.key
                ? 'bg-civic-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : filteredGrievances.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <Inbox className="w-8 h-8 mb-2" />
            <p className="text-sm">No grievances found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Complaint</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Citizen</th>
                  <th
                    className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-civic-700 select-none"
                    onClick={() => toggleSort('severity_score')}
                  >
                    <span className="flex items-center gap-1">
                      Severity
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th
                    className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-civic-700 select-none"
                    onClick={() => toggleSort('created_at')}
                  >
                    <span className="flex items-center gap-1">
                      Age
                      <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">SLA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredGrievances.map((g) => {
                  const statusCfg = STATUS_BADGE[g.status] || STATUS_BADGE.open;
                  const hasVulnerability = g.citizen?.vulnerability_flags?.length;

                  return (
                    <tr
                      key={g.id}
                      onClick={() => router.push(`/admin/grievance/${g.id}`)}
                      className={`
                        cursor-pointer hover:bg-gray-50 transition-colors
                        ${g.sla_breached ? 'bg-red-50/30' : ''}
                        ${g.escalation_level >= 3 ? 'border-l-2 border-l-red-400' : ''}
                      `}
                    >
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-civic-700 font-medium">{g.complaint_number}</p>
                        <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{g.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700">{CATEGORY_LABELS[g.category] || g.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-700">{g.citizen?.name || 'Anonymous'}</p>
                        {hasVulnerability ? (
                          <div className="flex gap-1 mt-0.5">
                            {g.citizen!.vulnerability_flags.map((f) => (
                              <span key={f} className="text-[9px] font-semibold px-1 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">
                                {f}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${getSeverityColor(g.severity_score)}`}>
                          {g.severity_score}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {g.escalation_level > 0 && (
                          <span className="ml-1 text-[9px] font-bold text-red-600">
                            L{g.escalation_level}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Timer className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-600">{g.days_since_filed}d</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {g.sla_breached ? (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <ShieldAlert className="w-3 h-3" />
                            Breached
                          </span>
                        ) : (
                          <span className="text-[11px] text-green-600 font-medium">On Track</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
