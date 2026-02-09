'use client';

import { useEffect, useState } from 'react';
import {
  Shield, FileText, Search, BarChart3, Phone, ArrowRight, ChevronRight,
  Droplets, Zap, Construction, Trash2, CloudRain, Lamp, Bus, Wheat,
  Mic, Globe, Scale, TrendingUp, Users, Clock, CheckCircle2,
  AlertTriangle, MapPin, Megaphone, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface PlatformStats {
  total_complaints: number;
  resolved_complaints: number;
  escalated_complaints: number;
  avg_resolution_days: number;
  languages_supported: number;
  wards_covered: number;
  resolution_rate: number;
}

const CATEGORIES_SAMPLE = [
  { icon: Droplets, label: 'Water Supply', labelHi: 'जल आपूर्ति', color: '#3B82F6' },
  { icon: Zap, label: 'Electricity', labelHi: 'बिजली', color: '#F59E0B' },
  { icon: Construction, label: 'Roads & Potholes', labelHi: 'सड़कें', color: '#EF4444' },
  { icon: Trash2, label: 'Sanitation', labelHi: 'स्वच्छता', color: '#10B981' },
  { icon: CloudRain, label: 'Drainage', labelHi: 'नाली/सीवर', color: '#6366F1' },
  { icon: Lamp, label: 'Street Lights', labelHi: 'स्ट्रीट लाइट', color: '#F97316' },
  { icon: Bus, label: 'Transport', labelHi: 'परिवहन', color: '#8B5CF6' },
  { icon: Wheat, label: 'Ration / PDS', labelHi: 'राशन', color: '#EC4899' },
];

const PROBLEMS = [
  { stat: '2.8 Cr', label: 'Pending grievances across India', icon: AlertTriangle },
  { stat: '45 days', label: 'Average resolution time for civic issues', icon: Clock },
  { stat: '67%', label: 'Citizens unaware of their legal rights', icon: Scale },
  { stat: '12+', label: 'Departments with no cross-communication', icon: Users },
];

const CHANNELS = [
  {
    title: 'File Online',
    titleHi: 'ऑनलाइन शिकायत',
    desc: 'Type your complaint in any language. AI classifies, routes, and tracks automatically.',
    icon: FileText,
    href: '/file-complaint',
    color: 'from-saffron-500 to-saffron-600',
    badge: 'Most Popular',
  },
  {
    title: 'Voice Call',
    titleHi: 'फ़ोन से शिकायत',
    desc: 'Speak to our AI agent in Hindi or English. No typing needed — just talk.',
    icon: Phone,
    href: '/voice-assistant',
    color: 'from-tricolor-green to-emerald-600',
    badge: 'New',
  },
  {
    title: 'Track & Dashboard',
    titleHi: 'शिकायत ट्रैक करें',
    desc: 'Monitor your complaint status, see ward heatmaps, and department performance.',
    icon: BarChart3,
    href: '/dashboard',
    color: 'from-civic-700 to-civic-900',
    badge: null,
  },
];

export default function Home() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/analytics/stats`);
        const json = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      } catch {
        // Silently fail — show static fallbacks
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Tricolor strip */}
      <div className="saffron-strip" />

      {/* Nav */}
      <Navbar />

      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-50 via-white to-civic-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-saffron-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-civic-200/20 rounded-full blur-3xl" />
        <div className="absolute top-40 left-1/2 w-96 h-96 bg-tricolor-green/5 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-tricolor-green/10 text-tricolor-green px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <span className="w-2 h-2 bg-tricolor-green rounded-full animate-pulse" />
              AI-Powered Civic Grievance Platform
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-civic-900 leading-tight tracking-tight">
              Your voice matters.
              <br />
              <span className="text-saffron-500">We make it heard.</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-500 mt-6 max-w-2xl leading-relaxed">
              File civic grievances with AI-powered classification, automatic routing to the right department, real-time tracking, and legal rights awareness.
            </p>
            <p className="text-base text-gray-400 mt-2 font-[family-name:var(--font-hindi)]">
              आपकी आवाज़ मायने रखती है। हम इसे सुनवाई तक पहुंचाते हैं।
            </p>

            <div className="flex flex-wrap gap-4 mt-8">
              <Link
                href="/file-complaint"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-saffron-600 hover:to-saffron-700 transition-all shadow-lg shadow-saffron-500/20"
              >
                <FileText className="w-5 h-5" />
                File a Complaint
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/voice-assistant"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-tricolor-green to-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Phone className="w-5 h-5" />
                Call to File
              </Link>
              <Link
                href="/track"
                className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-saffron-400 hover:text-saffron-700 transition-all"
              >
                <Search className="w-5 h-5" />
                Track Complaint
              </Link>
            </div>

            <p className="text-sm text-gray-400 mt-6">
              No login required. Works in Hindi, English, and 10+ Indian languages.
            </p>
          </div>
        </div>
      </section>

      {/* ========== LIVE STATS ========== */}
      <section className="bg-civic-900 text-white py-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-saffron-400">
                {stats ? stats.total_complaints.toLocaleString() : '—'}
              </p>
              <p className="text-sm text-gray-300 mt-1">Total Complaints</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                {stats ? `${stats.resolution_rate}%` : '—'}
              </p>
              <p className="text-sm text-gray-300 mt-1">Resolution Rate</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-saffron-400">
                {stats ? `${stats.avg_resolution_days}d` : '—'}
              </p>
              <p className="text-sm text-gray-300 mt-1">Avg Resolution</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
                {stats ? stats.wards_covered : '12'}
              </p>
              <p className="text-sm text-gray-300 mt-1">Wards Covered</p>
            </div>
          </div>
          {stats && (
            <p className="text-center text-xs text-gray-500 mt-4">Live data from platform</p>
          )}
        </div>
      </section>

      {/* ========== THE PROBLEM ========== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-red-500 uppercase tracking-wider mb-2">The Problem</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-civic-900">
            India's civic grievance system is broken
          </h2>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto">
            Citizens face unresponsive departments, lost complaints, and zero accountability.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PROBLEMS.map((p) => (
            <div key={p.label} className="bg-red-50/60 border border-red-100 rounded-2xl p-5">
              <p.icon className="w-6 h-6 text-red-500 mb-3" />
              <p className="text-2xl font-extrabold text-civic-900">{p.stat}</p>
              <p className="text-sm text-gray-600 mt-1">{p.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-bold text-saffron-500 uppercase tracking-wider mb-2">How It Works</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-civic-900">Three steps. That&apos;s it.</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe & Submit',
                titleHi: 'बताएं और जमा करें',
                desc: 'Type or speak about the issue. Upload photos, share location. AI classifies it automatically.',
                icon: Megaphone,
              },
              {
                step: '02',
                title: 'AI Routes & Scores',
                titleHi: 'AI वर्गीकरण',
                desc: 'Our AI determines severity (1-10), finds the right department, and flags your legal rights.',
                icon: TrendingUp,
              },
              {
                step: '03',
                title: 'Track & Resolve',
                titleHi: 'ट्रैक और समाधान',
                desc: 'Follow your complaint in real-time. Auto-escalation with SLA ensures accountability at every level.',
                icon: CheckCircle2,
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-saffron-50 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-saffron-600" />
                  </div>
                  <span className="text-3xl font-extrabold text-saffron-200">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold text-civic-900 mb-1">{item.title}</h3>
                <p className="text-xs text-saffron-500 font-medium mb-2">{item.titleHi}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FILING CHANNELS ========== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-tricolor-green uppercase tracking-wider mb-2">Multiple Channels</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-civic-900">File your way</h2>
          <p className="text-gray-500 mt-2">Choose whatever works best for you</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          {CHANNELS.map((ch) => (
            <Link
              key={ch.title}
              href={ch.href}
              className="group relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all"
            >
              {ch.badge && (
                <span className="absolute top-4 right-4 text-xs font-bold px-2 py-0.5 bg-saffron-100 text-saffron-700 rounded-full">
                  {ch.badge}
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ch.color} flex items-center justify-center mb-4`}>
                <ch.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-civic-900 mb-1">{ch.title}</h3>
              <p className="text-xs text-gray-400 font-medium mb-2">{ch.titleHi}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{ch.desc}</p>
              <div className="mt-4 flex items-center gap-1 text-saffron-600 text-sm font-semibold group-hover:gap-2 transition-all">
                Get Started <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== CATEGORIES ========== */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-civic-900">We handle all civic issues</h2>
            <p className="text-gray-500 mt-2">12 categories covering every aspect of municipal governance</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES_SAMPLE.map((cat) => (
              <div
                key={cat.label}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-default"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                  <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                </div>
                <div>
                  <span className="font-medium text-gray-800 text-sm block">{cat.label}</span>
                  <span className="text-xs text-gray-400">{cat.labelHi}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== KEY FEATURES ========== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-saffron-500 uppercase tracking-wider mb-2">Key Features</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-civic-900">What makes JanSunwai AI different</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: Globe, title: 'Multilingual AI', desc: 'File in Hindi, English, or any Indian language. AI understands and classifies in real-time.' },
            { icon: TrendingUp, title: '5-Level Auto-Escalation', desc: 'SLA-based escalation ladder from field officer to district magistrate. No complaint stays stuck.' },
            { icon: Scale, title: 'Legal Rights Awareness', desc: 'Every complaint is mapped to relevant laws — Article 21, RTI Act, Municipal Acts.' },
            { icon: ShieldCheck, title: 'Citizen Verification', desc: 'Citizens verify resolution via SMS/WhatsApp link. Unsatisfied? Complaint auto-reopens.' },
            { icon: MapPin, title: 'Ward-Level Heatmaps', desc: 'Geospatial analytics show problem hotspots. Hold your ward accountable with data.' },
            { icon: Mic, title: 'Voice Agent (Hindi)', desc: 'Speak to an AI agent in Hindi to file complaints. Perfect for low-literacy citizens.' },
          ].map((f) => (
            <div key={f.title} className="border border-gray-200 rounded-2xl p-5 hover:border-saffron-200 hover:shadow-sm transition-all">
              <f.icon className="w-6 h-6 text-saffron-500 mb-3" />
              <h3 className="font-bold text-civic-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-civic-800 to-civic-900 rounded-3xl p-10 sm:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-saffron-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-tricolor-green/10 rounded-full blur-3xl" />
          <div className="relative text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to make your voice heard?
            </h2>
            <p className="text-civic-200 text-lg max-w-xl mx-auto">
              Every complaint you file helps improve your community. Start now — no login required.
            </p>
            <p className="text-civic-300 text-sm mt-2 font-[family-name:var(--font-hindi)]">
              आपकी हर शिकायत आपके समुदाय को बेहतर बनाती है।
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/file-complaint" className="inline-flex items-center gap-2 bg-saffron-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-saffron-600 transition-colors shadow-lg shadow-saffron-500/30">
                File a Grievance <ChevronRight className="w-5 h-5" />
              </Link>
              <Link href="/voice-assistant" className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/20 transition-colors">
                <Phone className="w-5 h-5" />
                Voice Call
              </Link>
              <Link href="/dashboard" className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-colors">
                <BarChart3 className="w-5 h-5" />
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-gray-200 py-10 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-saffron-500" />
                <span className="font-bold text-civic-900">JanSunwai AI</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI-powered civic grievance resolution platform for Indian citizens.
                Built for transparency, accountability, and citizen empowerment.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-civic-900 text-sm mb-3">Platform</h4>
              <div className="space-y-2 text-sm">
                <Link href="/file-complaint" className="block text-gray-500 hover:text-saffron-600 transition-colors">File Complaint</Link>
                <Link href="/track" className="block text-gray-500 hover:text-saffron-600 transition-colors">Track Complaint</Link>
                <Link href="/dashboard" className="block text-gray-500 hover:text-saffron-600 transition-colors">Public Dashboard</Link>
                <Link href="/voice-assistant" className="block text-gray-500 hover:text-saffron-600 transition-colors">Voice Assistant</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-civic-900 text-sm mb-3">For Officers</h4>
              <div className="space-y-2 text-sm">
                <Link href="/admin/login" className="block text-gray-500 hover:text-saffron-600 transition-colors">Officer Login</Link>
                <Link href="/admin" className="block text-gray-500 hover:text-saffron-600 transition-colors">Admin Dashboard</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p>Built with AI for Bharat. JanSunwai AI — Hackathon Project.</p>
            <p className="font-[family-name:var(--font-hindi)]">जनसुनवाई AI — हर नागरिक की आवाज़</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
