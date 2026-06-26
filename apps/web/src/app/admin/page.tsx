'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import Link from 'next/link';
import {
  AlertTriangle, CheckCircle, Clock, Eye, FileText,
  TrendingUp, ArrowUpRight, Loader2, Inbox, BarChart3
} from 'lucide-react';

interface DashboardStats {
  total_active: number;
  open: number;
  acknowledged: number;
  in_progress: number;
  escalated: number;
  resolved_today: number;
}

interface TimelineEvent {
  id: string;
  event_type: string;
  description: string;
  created_at: string;
  grievance_id: string;
  actor: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Inbox },
  acknowledged: { label: 'Acknowledged', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', icon: Eye },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  escalated: { label: 'Escalated', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
  resolved: { label: 'Resolved Today', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
};

export default function AdminDashboardPage() {
  const { data: session } = useSession();
  const adminFetch = useAdminFetch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.departmentId) return;

    async function load() {
      try {
        const [statsRes, queueRes] = await Promise.all([
          adminFetch(`/api/v1/admin/stats`).catch(() => null),
          adminFetch(`/api/v1/admin/queue?department_id=${session!.user.departmentId}&limit=5&sort_by=updated_at&sort_order=desc`).catch(() => null),
        ]);

        if (statsRes) {
          setStats(statsRes.stats || statsRes);
        } else {
          // Fallback: compute from queue
          setStats({
            total_active: 0, open: 0, acknowledged: 0,
            in_progress: 0, escalated: 0, resolved_today: 0,
          });
        }

        if (queueRes?.grievances) {
          setActivity(queueRes.grievances.slice(0, 8).map((g: any) => ({
            id: g.id,
            event_type: g.status,
            description: g.description?.substring(0, 100) + '...',
            created_at: g.updated_at || g.created_at,
            grievance_id: g.id,
            actor: g.complaint_number || g.id.slice(0, 8),
          })));
        }
      } catch {
        // silent fail
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [session?.user?.departmentId, adminFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  const statCards = [
    { key: 'open', value: stats?.open ?? 0, ...STATUS_CONFIG.open },
    { key: 'acknowledged', value: stats?.acknowledged ?? 0, ...STATUS_CONFIG.acknowledged },
    { key: 'in_progress', value: stats?.in_progress ?? 0, ...STATUS_CONFIG.in_progress },
    { key: 'escalated', value: stats?.escalated ?? 0, ...STATUS_CONFIG.escalated },
    { key: 'resolved', value: stats?.resolved_today ?? 0, ...STATUS_CONFIG.resolved },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-bold text-civic-900">
          Welcome back, {session?.user?.name?.split(' ')[0] || 'Officer'}
        </h2>
        <p className="text-sm text-gray-500">{session?.user?.departmentName} — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.key}
              className={`rounded-lg border px-4 py-3 ${card.bg} transition-all hover:shadow-sm`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon className={`w-4 h-4 ${card.color}`} />
                {card.key === 'escalated' && card.value > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Quick actions + Recent activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick actions */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Actions</h3>

          <Link
            href="/admin/queue"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-saffron-300 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-saffron-50 flex items-center justify-center group-hover:bg-saffron-100 transition-colors">
              <ListIcon className="w-4 h-4 text-saffron-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-civic-900">View Queue</p>
              <p className="text-[11px] text-gray-400">Manage pending grievances</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-saffron-500 transition-colors" />
          </Link>

          <Link
            href="/admin/escalations"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-red-300 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-civic-900">Escalations</p>
              <p className="text-[11px] text-gray-400">Review escalated complaints</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-lg hover:border-civic-300 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-md bg-civic-50 flex items-center justify-center group-hover:bg-civic-100 transition-colors">
              <BarChart3 className="w-4 h-4 text-civic-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-civic-900">Public Dashboard</p>
              <p className="text-[11px] text-gray-400">View city-wide analytics</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-civic-500 transition-colors" />
          </Link>
        </div>

        {/* Recent activity */}
        <div className="lg:col-span-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Queue Activity</h3>

          {activity.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent grievances in your department</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {activity.map((item) => {
                const cfg = STATUS_CONFIG[item.event_type] || STATUS_CONFIG.open;
                const Icon = cfg.icon;
                return (
                  <Link
                    key={item.id}
                    href={`/admin/grievance/${item.grievance_id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                      <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{item.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">{item.actor}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 mt-1">
                      {formatRelativeTime(item.created_at)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ListIcon(props: { className?: string }) {
  return <FileText {...props} />;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
