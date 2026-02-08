'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAdminFetch } from '@/hooks/useAdminFetch';
import {
  ArrowLeft, AlertTriangle, CheckCircle, Clock, Eye, Inbox,
  MapPin, Phone, User, Shield, Loader2, FileText, Calendar,
  ChevronDown, Send, UserPlus, PlayCircle, Ban
} from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  open: { label: 'Open', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Inbox },
  acknowledged: { label: 'Acknowledged', color: 'text-cyan-700', bg: 'bg-cyan-50 border-cyan-200', icon: Eye },
  in_progress: { label: 'In Progress', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  escalated: { label: 'Escalated', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
  resolved: { label: 'Resolved', color: 'text-green-700', bg: 'bg-green-50 border-green-200', icon: CheckCircle },
  reopened: { label: 'Reopened', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: AlertTriangle },
};

const CATEGORY_LABELS: Record<string, string> = {
  water_supply: 'Water Supply', electricity: 'Electricity', roads_potholes: 'Roads/Potholes',
  sanitation_garbage: 'Sanitation', drainage_sewage: 'Drainage', street_lighting: 'Street Lights',
  public_transport: 'Transport', ration_card_pds: 'Ration/PDS', pension_welfare: 'Pension/Welfare',
  corruption_misconduct: 'Corruption', building_construction: 'Building', parks_public_spaces: 'Parks',
};

interface GrievanceDetail {
  id: string;
  complaint_number: string;
  category: string;
  sub_category: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  severity_score: number;
  status: string;
  escalation_level: number;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolution_verified: boolean;
  media_urls: string[];
  citizen?: { id: string; name: string; phone: string; vulnerability_flags: string[] };
  assigned_officer?: { id: string; name: string };
  assigned_department?: { id: string; name: string };
}

interface TimelineEntry {
  id: string;
  event_type: string;
  description: string;
  actor: string;
  created_at: string;
  metadata: any;
}

export default function GrievanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const adminFetch = useAdminFetch();

  const [grievance, setGrievance] = useState<GrievanceDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [showResolveForm, setShowResolveForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [gRes, tRes] = await Promise.all([
          adminFetch(`/api/v1/grievance/${id}/status`).catch(() => null),
          adminFetch(`/api/v1/grievance/${id}/timeline`).catch(() => null),
        ]);
        if (gRes?.data) setGrievance(gRes.data);
        else if (gRes) setGrievance(gRes);
        if (tRes?.data) setTimeline(tRes.data);
        else if (Array.isArray(tRes)) setTimeline(tRes);
      } catch {
        // fail silently
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, adminFetch]);

  async function handleAction(action: string, body?: any) {
    setActionLoading(action);
    try {
      await adminFetch(`/api/v1/admin/grievance/${id}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify(body || {}),
      });
      // Reload
      const [gRes, tRes] = await Promise.all([
        adminFetch(`/api/v1/grievance/${id}/status`).catch(() => null),
        adminFetch(`/api/v1/grievance/${id}/timeline`).catch(() => null),
      ]);
      if (gRes?.data) setGrievance(gRes.data);
      else if (gRes) setGrievance(gRes);
      if (tRes?.data) setTimeline(tRes.data);
      else if (Array.isArray(tRes)) setTimeline(tRes);
      setShowResolveForm(false);
      setResolveNotes('');
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Grievance not found</p>
        <Link href="/admin/queue" className="text-saffron-600 text-sm mt-2 inline-block hover:underline">
          Back to Queue
        </Link>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[grievance.status] || STATUS_CONFIG.open;
  const StatusIcon = statusCfg.icon;
  const daysSinceFiled = Math.floor((Date.now() - new Date(grievance.created_at).getTime()) / 86400000);

  function getSeverityLabel(score: number) {
    if (score >= 80) return { label: 'Critical', color: 'text-red-700 bg-red-50' };
    if (score >= 60) return { label: 'High', color: 'text-orange-700 bg-orange-50' };
    if (score >= 40) return { label: 'Medium', color: 'text-amber-700 bg-amber-50' };
    return { label: 'Low', color: 'text-green-700 bg-green-50' };
  }

  const severity = getSeverityLabel(grievance.severity_score);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-5xl">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-mono text-sm font-bold text-civic-900">{grievance.complaint_number}</h2>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${statusCfg.bg} ${statusCfg.color}`}>
              <StatusIcon className="w-3 h-3 inline mr-1" />
              {statusCfg.label}
            </span>
            {grievance.escalation_level > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700">
                Escalation L{grievance.escalation_level}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Filed {daysSinceFiled} days ago — {new Date(grievance.created_at).toLocaleDateString('en-IN')}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left — Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Description */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Complaint Description</h3>
            <p className="text-sm text-gray-800 leading-relaxed">{grievance.description}</p>

            {grievance.media_urls?.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {grievance.media_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-md bg-gray-100 border border-gray-200 overflow-hidden hover:opacity-80 transition-opacity">
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Category</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{CATEGORY_LABELS[grievance.category] || grievance.category}</p>
              {grievance.sub_category && <p className="text-xs text-gray-500 mt-0.5">{grievance.sub_category}</p>}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Severity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold px-2 py-0.5 rounded ${severity.color}`}>{grievance.severity_score}</span>
                <span className="text-sm text-gray-600">{severity.label}</span>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Location</span>
              </div>
              <p className="text-sm text-gray-800">{grievance.address || 'Not specified'}</p>
              {grievance.latitude && (
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                  {grievance.latitude.toFixed(4)}, {grievance.longitude.toFixed(4)}
                </p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Assignment</span>
              </div>
              <p className="text-sm text-gray-800">{grievance.assigned_department?.name || 'Unassigned'}</p>
              <p className="text-xs text-gray-500 mt-0.5">Officer: {grievance.assigned_officer?.name || 'None'}</p>
            </div>
          </div>

          {/* Citizen info */}
          {grievance.citizen && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Citizen</h3>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-700">{grievance.citizen.name || 'Anonymous'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-sm text-gray-700 font-mono">{grievance.citizen.phone}</span>
                </div>
                {grievance.citizen.vulnerability_flags?.length > 0 && (
                  <div className="flex gap-1">
                    {grievance.citizen.vulnerability_flags.map((f) => (
                      <span key={f} className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Timeline</h3>
            {timeline.length === 0 ? (
              <p className="text-sm text-gray-400">No timeline events yet</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((entry, i) => {
                  const cfg = STATUS_CONFIG[entry.event_type] || STATUS_CONFIG.open;
                  const Icon = cfg.icon;
                  return (
                    <div key={entry.id || i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${cfg.bg}`}>
                          <Icon className={`w-3 h-3 ${cfg.color}`} />
                        </div>
                        {i < timeline.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm text-gray-700">{entry.description}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(entry.created_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — Actions */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</h3>
            <div className="space-y-2">
              {grievance.status === 'open' && (
                <button
                  onClick={() => handleAction('acknowledge')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-cyan-50 text-cyan-700 rounded-lg text-sm font-semibold hover:bg-cyan-100 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'acknowledge' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Acknowledge
                </button>
              )}

              {(grievance.status === 'open' || grievance.status === 'acknowledged') && (
                <button
                  onClick={() => handleAction('update', { status: 'in_progress' })}
                  disabled={!!actionLoading}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-semibold hover:bg-amber-100 disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'update' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Mark In Progress
                </button>
              )}

              {!showResolveForm && grievance.status !== 'resolved' && (
                <button
                  onClick={() => setShowResolveForm(true)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve
                </button>
              )}

              {showResolveForm && (
                <div className="border border-green-200 rounded-lg p-3 bg-green-50/50 space-y-2">
                  <textarea
                    placeholder="Resolution notes (what was done)..."
                    value={resolveNotes}
                    onChange={(e) => setResolveNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction('update', { status: 'resolved', resolution_notes: resolveNotes })}
                      disabled={!!actionLoading}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md text-xs font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === 'update' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      Confirm Resolve
                    </button>
                    <button
                      onClick={() => { setShowResolveForm(false); setResolveNotes(''); }}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-md text-xs font-semibold hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick info */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Details</h3>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-gray-500">Filed</dt>
                <dd className="text-gray-800 font-medium">{new Date(grievance.created_at).toLocaleDateString('en-IN')}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Age</dt>
                <dd className="text-gray-800 font-medium">{daysSinceFiled} days</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Escalation</dt>
                <dd className={`font-medium ${grievance.escalation_level >= 3 ? 'text-red-600' : 'text-gray-800'}`}>
                  Level {grievance.escalation_level}
                </dd>
              </div>
              {grievance.resolved_at && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Resolved</dt>
                  <dd className="text-gray-800 font-medium">{new Date(grievance.resolved_at).toLocaleDateString('en-IN')}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Verified</dt>
                <dd className={`font-medium ${grievance.resolution_verified ? 'text-green-600' : 'text-gray-400'}`}>
                  {grievance.resolution_verified ? 'Yes' : 'No'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
