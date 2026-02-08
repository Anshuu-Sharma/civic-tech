'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Loader2, ShieldAlert, Timer, ArrowUpRight, Ban } from 'lucide-react';

interface EscalatedGrievance {
  id: string;
  complaint_number: string;
  category: string;
  description: string;
  severity_score: number;
  status: string;
  escalation_level: number;
  created_at: string;
  days_since_filed: number;
  sla_breached: boolean;
  citizen?: { name: string; phone: string };
  assigned_officer?: { name: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  water_supply: 'Water Supply', electricity: 'Electricity', roads_potholes: 'Roads/Potholes',
  sanitation_garbage: 'Sanitation', drainage_sewage: 'Drainage', street_lighting: 'Street Lights',
  public_transport: 'Transport', ration_card_pds: 'Ration/PDS', pension_welfare: 'Pension/Welfare',
  corruption_misconduct: 'Corruption', building_construction: 'Building', parks_public_spaces: 'Parks',
};

const LEVEL_CONFIG: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'L1 — Ward Officer', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  2: { label: 'L2 — Senior Officer', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' },
  3: { label: 'L3 — Dept Head', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  4: { label: 'L4 — Commissioner', color: 'text-red-800', bg: 'bg-red-100 border-red-300' },
  5: { label: 'L5 — Public Notice', color: 'text-red-900', bg: 'bg-red-200 border-red-400' },
};

export default function EscalationsPage() {
  const { data: session } = useSession();
  const adminFetch = useAdminFetch();
  const router = useRouter();

  const [grievances, setGrievances] = useState<EscalatedGrievance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEscalated = useCallback(async () => {
    if (!session?.user?.departmentId) return;
    setLoading(true);
    try {
      const res = await adminFetch(
        `/api/v1/admin/queue/${session.user.departmentId}?status=escalated&sort_by=escalation_level&sort_order=desc&limit=50`
      );
      setGrievances(res.grievances || []);
    } catch {
      setGrievances([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.departmentId, adminFetch]);

  useEffect(() => {
    fetchEscalated();
  }, [fetchEscalated]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-civic-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Escalated Complaints
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          {grievances.length} complaint{grievances.length !== 1 ? 's' : ''} requiring urgent attention
        </p>
      </div>

      {grievances.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <ShieldAlert className="w-8 h-8 text-green-400 mx-auto mb-2" />
          <p className="text-sm text-green-700 font-medium">No escalated complaints</p>
          <p className="text-xs text-green-600 mt-1">All grievances are within SLA timelines</p>
        </div>
      ) : (
        <div className="space-y-3">
          {grievances.map((g) => {
            const levelCfg = LEVEL_CONFIG[g.escalation_level] || LEVEL_CONFIG[1];
            return (
              <div
                key={g.id}
                onClick={() => router.push(`/admin/grievance/${g.id}`)}
                className={`
                  bg-white border rounded-lg p-4 cursor-pointer hover:shadow-md transition-all
                  ${g.escalation_level >= 4 ? 'border-red-300 border-l-4 border-l-red-500' : 'border-gray-200 border-l-4 border-l-orange-400'}
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-civic-700">{g.complaint_number}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${levelCfg.bg} ${levelCfg.color}`}>
                        {levelCfg.label}
                      </span>
                      {g.sla_breached && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white flex items-center gap-0.5">
                          <Ban className="w-2.5 h-2.5" /> SLA BREACHED
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 line-clamp-2">{g.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{CATEGORY_LABELS[g.category] || g.category}</span>
                      <span className="flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {g.days_since_filed} days old
                      </span>
                      <span>Severity: <strong className={g.severity_score >= 70 ? 'text-red-600' : 'text-gray-700'}>{g.severity_score}</strong></span>
                      {g.citizen?.name && <span>Citizen: {g.citizen.name}</span>}
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0 mt-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
