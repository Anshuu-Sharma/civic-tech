'use client';

import { useState } from 'react';
import {
  Shield, Filter, X, MapPin, TrendingUp, TrendingDown,
  AlertTriangle, ChevronDown, Loader2, RefreshCw,
  Map as MapIcon, Table as TableIcon,
  Droplets, Zap, Construction, Trash2, CloudRain, Lamp, Bus, Wheat,
  Briefcase, Home, TreePine
} from 'lucide-react';
import Link from 'next/link';
import {
  useHeatmapData,
  useWardScorecards,
  type HeatmapFilters,
  type HeatmapSummary,
  type HeatmapGrievance,
  type WardScorecard,
} from '@/hooks/useAnalytics';
import { useEffect, useRef } from 'react';

const CATEGORY_OPTIONS = [
  { value: 'water_supply', label: 'Water Supply', icon: Droplets, color: '#3B82F6' },
  { value: 'electricity', label: 'Electricity', icon: Zap, color: '#F59E0B' },
  { value: 'roads_potholes', label: 'Roads & Potholes', icon: Construction, color: '#EF4444' },
  { value: 'sanitation_garbage', label: 'Sanitation', icon: Trash2, color: '#10B981' },
  { value: 'drainage_sewage', label: 'Drainage', icon: CloudRain, color: '#6366F1' },
  { value: 'street_lighting', label: 'Street Lights', icon: Lamp, color: '#F97316' },
  { value: 'public_transport', label: 'Transport', icon: Bus, color: '#8B5CF6' },
  { value: 'ration_card_pds', label: 'Ration / PDS', icon: Wheat, color: '#EC4899' },
  { value: 'pension_welfare', label: 'Pension', icon: Briefcase, color: '#14B8A6' },
  { value: 'corruption_misconduct', label: 'Corruption', icon: AlertTriangle, color: '#DC2626' },
  { value: 'building_construction', label: 'Building', icon: Home, color: '#78716C' },
  { value: 'parks_public_spaces', label: 'Parks', icon: TreePine, color: '#22C55E' },
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open', color: 'bg-amber-500' },
  { value: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-500' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-indigo-500' },
  { value: 'resolved', label: 'Resolved', color: 'bg-emerald-500' },
  { value: 'escalated', label: 'Escalated', color: 'bg-red-500' },
  { value: 'reopened', label: 'Reopened', color: 'bg-orange-500' },
];

const CATEGORY_COLORS: Record<string, string> = {
  water_supply: '#3B82F6',
  electricity: '#F59E0B',
  roads_potholes: '#EF4444',
  sanitation_garbage: '#10B981',
  drainage_sewage: '#6366F1',
  street_lighting: '#F97316',
  public_transport: '#8B5CF6',
  ration_card_pds: '#EC4899',
  pension_welfare: '#14B8A6',
  corruption_misconduct: '#DC2626',
  building_construction: '#78716C',
  parks_public_spaces: '#22C55E',
};

function StatsBar({ summary }: { summary: HeatmapSummary }) {
  const stats = [
    { label: 'Total', value: summary.total_grievances, color: 'text-civic-900', bg: 'bg-gray-100' },
    { label: 'Open', value: summary.open, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'In Progress', value: summary.in_progress, color: 'text-indigo-700', bg: 'bg-indigo-50' },
    { label: 'Resolved', value: summary.resolved, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Escalated', value: summary.escalated, color: 'text-red-700', bg: 'bg-red-50' },
  ];

  return (
    <div className="flex gap-2 px-4 py-3 border-b bg-white overflow-x-auto">
      {stats.map((s) => (
        <div key={s.label} className={`${s.bg} px-4 py-2 rounded-xl flex items-center gap-2 shrink-0`}>
          <span className={`text-xl font-extrabold ${s.color}`}>{s.value}</span>
          <span className="text-xs text-gray-500 font-medium">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function FilterPanel({
  filters,
  onApply,
  onReset,
  onClose,
}: {
  filters: HeatmapFilters;
  onApply: (f: HeatmapFilters) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState<HeatmapFilters>(filters);

  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-civic-900 text-sm">Filters</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 lg:hidden">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Category</label>
        <div className="grid grid-cols-2 gap-1.5">
          {CATEGORY_OPTIONS.map((cat) => {
            const Icon = cat.icon;
            const active = local.category === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setLocal({ ...local, category: active ? undefined : cat.value })}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active ? 'bg-saffron-50 text-saffron-700 border border-saffron-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <Icon className="w-3 h-3" style={{ color: cat.color }} />
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((s) => {
            const active = local.status === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setLocal({ ...local, status: active ? undefined : s.value })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  active ? 'bg-saffron-50 text-saffron-700 border border-saffron-200' : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${s.color}`} />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity range */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Severity Range</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Min"
            value={local.severity_min ?? ''}
            onChange={(e) => setLocal({ ...local, severity_min: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-saffron-400"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min={0}
            max={100}
            placeholder="Max"
            value={local.severity_max ?? ''}
            onChange={(e) => setLocal({ ...local, severity_max: e.target.value ? Number(e.target.value) : undefined })}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-saffron-400"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onApply(local)}
          className="flex-1 bg-saffron-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-saffron-600 transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={() => { setLocal({}); onReset(); }}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function GrievanceMapView({
  grievances,
  loading,
}: {
  grievances: HeatmapGrievance[];
  loading: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'markers' | 'heatmap'>('markers');

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;
    if (typeof google !== 'undefined' && google.maps) {
      setMapLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,marker&v=weekly`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 28.6139, lng: 77.209 },
      zoom: 12,
      mapId: 'jansunwai-dashboard',
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });
  }, [mapLoaded]);

  useEffect(() => {
    if (!mapInstanceRef.current || !grievances.length) return;

    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current = [];

    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }

    if (viewMode === 'heatmap') {
      const heatmapData = grievances.map((g) => ({
        location: new google.maps.LatLng(g.latitude, g.longitude),
        weight: g.severity_score / 100,
      }));

      heatmapRef.current = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: mapInstanceRef.current,
        radius: 30,
        opacity: 0.7,
      });
    } else {
      grievances.forEach((g) => {
        const color = CATEGORY_COLORS[g.category] || '#6B7280';
        const pin = document.createElement('div');
        pin.style.cssText = `
          width: 12px; height: 12px; border-radius: 50%;
          background: ${color}; border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          cursor: pointer;
        `;

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapInstanceRef.current!,
          position: { lat: g.latitude, lng: g.longitude },
          content: pin,
          title: g.complaint_number,
        });

        marker.addListener('click', () => {
          const info = new google.maps.InfoWindow({
            content: `
              <div style="font-family: system-ui; max-width: 260px;">
                <p style="font-weight: 700; font-size: 13px; margin: 0 0 4px;">${g.complaint_number}</p>
                <p style="font-size: 12px; color: #666; margin: 0 0 4px;">${g.description}</p>
                <div style="display: flex; gap: 8px; font-size: 11px; color: #999;">
                  <span style="background: ${color}15; color: ${color}; padding: 2px 6px; border-radius: 4px;">${g.category.replace(/_/g, ' ')}</span>
                  <span>Severity: ${g.severity_score}</span>
                </div>
              </div>
            `,
          });
          info.open(mapInstanceRef.current!, marker);
        });

        markersRef.current.push(marker);
      });
    }
  }, [grievances, viewMode, mapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 left-3 z-10 flex bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <button
          onClick={() => setViewMode('markers')}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            viewMode === 'markers' ? 'bg-saffron-500 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Markers
        </button>
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
            viewMode === 'heatmap' ? 'bg-saffron-500 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          Heatmap
        </button>
      </div>

      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-md border border-gray-200 text-xs font-semibold text-gray-600">
        {grievances.length} complaints
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />

      {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center p-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Google Maps API key not configured</p>
            <p className="text-gray-400 text-sm mt-1">Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</p>
          </div>
        </div>
      )}
    </div>
  );
}

function WardScorecardsView({
  wards,
  loading,
  onSort,
}: {
  wards: WardScorecard[];
  loading: boolean;
  onSort: (sortBy: string, sortOrder: string) => void;
}) {
  const [sortBy, setSortBy] = useState('total_complaints');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (col: string) => {
    const newOrder = sortBy === col && sortOrder === 'desc' ? 'asc' : 'desc';
    setSortBy(col);
    setSortOrder(newOrder);
    onSort(col, newOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-saffron-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            {[
              { key: 'name', label: 'Ward' },
              { key: 'total_complaints', label: 'Total' },
              { key: 'avg_resolution_days', label: 'Avg Days' },
              { key: 'sla_compliance', label: 'SLA %' },
            ].map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-600 transition-colors"
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {sortBy === col.key && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </span>
              </th>
            ))}
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Trend</th>
          </tr>
        </thead>
        <tbody>
          {wards.map((ward) => (
            <tr key={ward.ward_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <p className="font-semibold text-civic-900">{ward.ward_name}</p>
                <p className="text-xs text-gray-400">{ward.zone} - Ward #{ward.ward_number}</p>
              </td>
              <td className="py-3 px-4 font-bold text-civic-900">{ward.total_complaints}</td>
              <td className="py-3 px-4">
                <span className={`font-semibold ${
                  (ward.avg_resolution_days ?? 0) > 7 ? 'text-red-600' : 'text-emerald-600'
                }`}>
                  {ward.avg_resolution_days ?? '-'}
                </span>
              </td>
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ward.sla_compliance_pct >= 80 ? 'bg-emerald-500' :
                        ward.sla_compliance_pct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(ward.sla_compliance_pct, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{ward.sla_compliance_pct}%</span>
                </div>
              </td>
              <td className="py-3 px-4">
                <div className="flex gap-1">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">{ward.open_count}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">{ward.in_progress_count}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">{ward.resolved_count}</span>
                  {ward.escalated_count > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700">{ward.escalated_count}</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                {ward.month_over_month_pct !== 0 ? (
                  <span className={`flex items-center gap-1 text-xs font-bold ${
                    ward.month_over_month_pct > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}>
                    {ward.month_over_month_pct > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(ward.month_over_month_pct)}%
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
            </tr>
          ))}
          {wards.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400">
                No ward data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading, error, filters, applyFilters, resetFilters } = useHeatmapData();
  const { wards, loading: wardsLoading, refetch: refetchWards } = useWardScorecards();

  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'wards'>('map');

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="saffron-strip" />

      {/* Header */}
      <header className="border-b border-gray-100 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-civic-900 text-sm tracking-tight">JanSunwai</span>
                <span className="text-saffron-500 font-bold text-sm ml-0.5">AI</span>
              </div>
            </Link>
            <div className="hidden sm:block border-l border-gray-200 pl-4">
              <h1 className="text-sm font-bold text-civic-900">Public Dashboard</h1>
              <p className="text-[11px] text-gray-400">
                {data
                  ? `${data.summary.total_grievances} grievances across Delhi`
                  : 'Loading dashboard data...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setActiveTab('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'map' ? 'bg-white text-civic-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" /> Map
              </button>
              <button
                onClick={() => setActiveTab('wards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'wards' ? 'bg-white text-civic-900 shadow-sm' : 'text-gray-500'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Wards
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                showFilters || Object.keys(filters).length > 0
                  ? 'bg-saffron-50 border-saffron-200 text-saffron-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
              {Object.keys(filters).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-saffron-500 text-white text-[10px] flex items-center justify-center">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>

            <button
              onClick={() => { applyFilters(filters); refetchWards(); }}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-saffron-500 hover:border-saffron-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <Link
              href="/file-complaint"
              className="hidden sm:inline-flex bg-saffron-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-saffron-600 transition-colors"
            >
              File Complaint
            </Link>
          </div>
        </div>
      </header>

      {/* Stats */}
      {data && <StatsBar summary={data.summary} />}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {showFilters && (
          <aside className="w-72 border-r border-gray-200 bg-white overflow-y-auto shrink-0">
            <FilterPanel
              filters={filters}
              onApply={(f) => { applyFilters(f); setShowFilters(false); }}
              onReset={() => { resetFilters(); setShowFilters(false); }}
              onClose={() => setShowFilters(false)}
            />
          </aside>
        )}

        <main className="flex-1 overflow-hidden relative">
          {error && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-xl text-sm font-medium shadow-lg">
              {error}
            </div>
          )}

          {activeTab === 'map' && data && (
            <GrievanceMapView grievances={data.grievances} loading={loading} />
          )}

          {activeTab === 'map' && !data && loading && (
            <div className="w-full h-full flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <Loader2 className="w-8 h-8 text-saffron-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Loading map data...</p>
              </div>
            </div>
          )}

          {activeTab === 'wards' && (
            <div className="p-6 overflow-y-auto h-full">
              <div className="max-w-[1200px] mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-civic-900">Ward Scorecards</h2>
                    <p className="text-sm text-gray-400 mt-0.5">Performance metrics for all {wards.length} wards</p>
                  </div>
                  <div className="flex gap-1 text-[10px] font-semibold">
                    <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">Open</span>
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded">Progress</span>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">Resolved</span>
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded">Escalated</span>
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <WardScorecardsView
                    wards={wards}
                    loading={wardsLoading}
                    onSort={refetchWards}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
