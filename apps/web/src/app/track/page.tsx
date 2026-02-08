'use client';

import { useState } from 'react';
import {
  Shield, Search, Clock, ChevronRight, AlertTriangle,
  CheckCircle2, RotateCcw, ArrowUpRight, Phone, Hash,
  MapPin, Calendar, FileText, Scale, Building2, User,
  Loader2, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface TimelineEntry {
  id: string;
  status: string;
  note: string;
  created_at: string;
}

interface GrievanceDetail {
  id: string;
  complaint_number: string;
  category: string;
  sub_category: string;
  description: string;
  address: string;
  severity_score: number;
  status: string;
  escalation_level: number;
  created_at: string;
  resolved_at: string | null;
  assigned_department?: { name: string };
  assigned_officer?: { name: string };
  citizen?: { phone: string; name: string | null };
  legal_rights_summary: string | null;
  timeline: TimelineEntry[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  acknowledged: { label: 'Acknowledged', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200', icon: RotateCcw },
  resolved: { label: 'Resolved', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
  escalated: { label: 'Escalated', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: ArrowUpRight },
  reopened: { label: 'Reopened', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle },
};

const CATEGORY_LABELS: Record<string, string> = {
  water_supply: 'Water Supply',
  electricity: 'Electricity',
  roads_potholes: 'Roads & Potholes',
  sanitation_garbage: 'Sanitation & Garbage',
  drainage_sewage: 'Drainage & Sewage',
  street_lighting: 'Street Lighting',
  public_transport: 'Public Transport',
  ration_card_pds: 'Ration / PDS',
  pension_welfare: 'Pension & Welfare',
  corruption_misconduct: 'Corruption',
  building_construction: 'Building & Construction',
  parks_public_spaces: 'Parks & Public Spaces',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}

function getSeverityInfo(score: number) {
  if (score >= 80) return { label: 'Critical', color: 'text-red-700 bg-red-50 border-red-200' };
  if (score >= 60) return { label: 'High', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  if (score >= 40) return { label: 'Medium', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Low', color: 'text-green-700 bg-green-50 border-green-200' };
}

export default function TrackPage() {
  const [searchType, setSearchType] = useState<'complaint' | 'phone'>('complaint');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grievance, setGrievance] = useState<GrievanceDetail | null>(null);
  const [searchResults, setSearchResults] = useState<GrievanceDetail[] | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setGrievance(null);
    setSearchResults(null);

    try {
      if (searchType === 'complaint') {
        const res = await fetch(`${API_BASE}/api/v1/grievance/${encodeURIComponent(query.trim())}/status`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'Complaint not found. Please check the complaint number.');
          return;
        }
        setGrievance(data.data);
      } else {
        const phone = query.trim().replace(/\D/g, '');
        const res = await fetch(`${API_BASE}/api/v1/grievance/search?phone=${encodeURIComponent(phone)}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || 'No complaints found for this phone number.');
          return;
        }
        if (data.data.length === 1) {
          setGrievance(data.data[0]);
        } else if (data.data.length > 1) {
          setSearchResults(data.data);
        } else {
          setError('No complaints found for this phone number.');
        }
      }
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function selectGrievance(g: GrievanceDetail) {
    setGrievance(g);
    setSearchResults(null);
  }

  function resetSearch() {
    setGrievance(null);
    setSearchResults(null);
    setError(null);
    setQuery('');
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="saffron-strip" />

      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-civic-900 text-lg tracking-tight">JanSunwai</span>
              <span className="text-saffron-500 font-bold text-lg ml-0.5">AI</span>
            </div>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/file-complaint" className="hover:text-saffron-600 transition-colors">File Complaint</Link>
            <Link href="/track" className="text-saffron-600 font-semibold">Track</Link>
            <Link href="/dashboard" className="hover:text-saffron-600 transition-colors">Dashboard</Link>
          </div>
          <Link href="/file-complaint" className="bg-saffron-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-saffron-600 transition-colors">
            File Now
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Search Section */}
        {!grievance && !searchResults && (
          <div className="form-step-enter">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-saffron-50 mb-4">
                <Search className="w-8 h-8 text-saffron-500" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-civic-900 tracking-tight">
                Track Your Complaint
              </h1>
              <p className="text-gray-500 mt-2 text-lg">
                Enter your complaint number or phone number to check status
              </p>
            </div>

            {/* Search type toggle */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => { setSearchType('complaint'); setQuery(''); setError(null); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    searchType === 'complaint'
                      ? 'bg-white text-civic-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  Complaint Number
                </button>
                <button
                  onClick={() => { setSearchType('phone'); setQuery(''); setError(null); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    searchType === 'phone'
                      ? 'bg-white text-civic-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Phone className="w-4 h-4" />
                  Phone Number
                </button>
              </div>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch} className="max-w-lg mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder={searchType === 'complaint' ? 'JSA-2026-DEL-00001' : '9876543210'}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full px-5 py-4 pr-14 border-2 border-gray-200 rounded-2xl text-lg focus:outline-none focus:border-saffron-400 transition-colors placeholder:text-gray-300"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-saffron-500 text-white flex items-center justify-center hover:bg-saffron-600 transition-colors disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                </button>
              </div>
            </form>

            {error && (
              <div className="max-w-lg mx-auto mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Info box */}
            <div className="max-w-lg mx-auto mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">
                <strong className="text-gray-700">Complaint Number</strong> was sent to you via SMS when you filed the complaint.
                Format: <code className="bg-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">JSA-YYYY-DEL-NNNNN</code>
              </p>
            </div>
          </div>
        )}

        {/* Multiple results */}
        {searchResults && (
          <div className="form-step-enter">
            <button onClick={resetSearch} className="flex items-center gap-1 text-sm text-gray-500 hover:text-saffron-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </button>
            <h2 className="text-xl font-bold text-civic-900 mb-1">
              Found {searchResults.length} complaint{searchResults.length > 1 ? 's' : ''}
            </h2>
            <p className="text-gray-500 text-sm mb-6">Select a complaint to view details</p>

            <div className="space-y-3">
              {searchResults.map((g) => {
                const statusCfg = STATUS_CONFIG[g.status] || STATUS_CONFIG.open;
                const StatusIcon = statusCfg.icon;
                return (
                  <button
                    key={g.id}
                    onClick={() => selectGrievance(g)}
                    className="w-full text-left p-4 border border-gray-200 rounded-xl hover:border-saffron-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm font-bold text-civic-900">{g.complaint_number}</span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-1">{g.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>{CATEGORY_LABELS[g.category] || g.category}</span>
                      <span>{formatDate(g.created_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Detail view */}
        {grievance && (
          <div className="form-step-enter">
            <button onClick={resetSearch} className="flex items-center gap-1 text-sm text-gray-500 hover:text-saffron-600 mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Search
            </button>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-sm text-gray-400 font-medium mb-1">Complaint Number</p>
                <h1 className="text-2xl font-extrabold text-civic-900 font-mono tracking-tight">
                  {grievance.complaint_number}
                </h1>
              </div>
              {(() => {
                const statusCfg = STATUS_CONFIG[grievance.status] || STATUS_CONFIG.open;
                const StatusIcon = statusCfg.icon;
                return (
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${statusCfg.bg} ${statusCfg.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusCfg.label}
                  </span>
                );
              })()}
            </div>

            {/* Info Grid */}
            <div className="grid sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <FileText className="w-3.5 h-3.5" /> Category
                </div>
                <p className="font-semibold text-civic-900">{CATEGORY_LABELS[grievance.category] || grievance.category}</p>
                <p className="text-sm text-gray-500 mt-0.5">{grievance.sub_category?.replace(/_/g, ' ')}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Severity
                </div>
                {(() => {
                  const sev = getSeverityInfo(grievance.severity_score);
                  return (
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-extrabold text-civic-900">{grievance.severity_score}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${sev.color}`}>{sev.label}</span>
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <Building2 className="w-3.5 h-3.5" /> Assigned Department
                </div>
                <p className="font-semibold text-civic-900">{grievance.assigned_department?.name || 'Pending Assignment'}</p>
                {grievance.assigned_officer?.name && (
                  <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> {grievance.assigned_officer.name}
                  </p>
                )}
              </div>

              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  <MapPin className="w-3.5 h-3.5" /> Location
                </div>
                <p className="font-semibold text-civic-900 text-sm leading-relaxed">{grievance.address || 'Location provided'}</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
              <div className="p-4 bg-white border border-gray-200 rounded-xl">
                <p className="text-gray-700 leading-relaxed">{grievance.description}</p>
              </div>
            </div>

            {/* Dates */}
            <div className="flex flex-wrap gap-6 mb-8 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Filed: <strong className="text-gray-700">{formatDate(grievance.created_at)}</strong></span>
              </div>
              {grievance.resolved_at && (
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolved: <strong>{formatDate(grievance.resolved_at)}</strong></span>
                </div>
              )}
              {grievance.escalation_level > 0 && (
                <div className="flex items-center gap-2 text-red-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Escalation Level: <strong>{grievance.escalation_level}</strong></span>
                </div>
              )}
            </div>

            {/* Timeline */}
            {grievance.timeline && grievance.timeline.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Timeline</h3>
                <div className="relative pl-8 space-y-0">
                  {/* Vertical line */}
                  <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-gray-200" />

                  {grievance.timeline.map((entry, i) => {
                    const entryCfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.open;
                    const EntryIcon = entryCfg.icon;
                    return (
                      <div key={entry.id || i} className="relative pb-6 last:pb-0">
                        <div className={`absolute left-[-21px] top-1 w-7 h-7 rounded-full border-2 bg-white flex items-center justify-center ${
                          i === 0 ? 'border-saffron-500' : 'border-gray-300'
                        }`}>
                          <EntryIcon className={`w-3.5 h-3.5 ${i === 0 ? 'text-saffron-500' : 'text-gray-400'}`} />
                        </div>
                        <div className="ml-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-sm font-bold ${entryCfg.color}`}>{entryCfg.label}</span>
                            <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-gray-600">{entry.note}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legal Rights */}
            {grievance.legal_rights_summary && (
              <div className="p-5 bg-tricolor-green/5 border border-tricolor-green/20 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="w-5 h-5 text-tricolor-green" />
                  <h3 className="font-bold text-tricolor-green">Your Legal Rights</h3>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {grievance.legal_rights_summary}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-saffron-500" />
            <span>JanSunwai AI</span>
          </div>
          <p>AI-powered civic grievance resolution for Indian citizens</p>
        </div>
      </footer>
    </div>
  );
}
