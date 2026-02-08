'use client';

import {
  Shield, FileText, Search, BarChart3, Phone, ArrowRight, ChevronRight,
  Droplets, Zap, Construction, Trash2, CloudRain, Lamp, Bus, Wheat
} from 'lucide-react';
import Link from 'next/link';

const STATS = [
  { value: '24/7', label: 'AI-Powered Support' },
  { value: '12', label: 'Civic Categories' },
  { value: '48hrs', label: 'Avg Response Time' },
  { value: '100%', label: 'Transparent Tracking' },
];

const CATEGORIES_SAMPLE = [
  { icon: Droplets, label: 'Water Supply', color: '#3B82F6' },
  { icon: Zap, label: 'Electricity', color: '#F59E0B' },
  { icon: Construction, label: 'Roads', color: '#EF4444' },
  { icon: Trash2, label: 'Sanitation', color: '#10B981' },
  { icon: CloudRain, label: 'Drainage', color: '#6366F1' },
  { icon: Lamp, label: 'Street Lights', color: '#F97316' },
  { icon: Bus, label: 'Transport', color: '#8B5CF6' },
  { icon: Wheat, label: 'Ration / PDS', color: '#EC4899' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Tricolor strip */}
      <div className="saffron-strip" />

      {/* Nav */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-saffron-500 to-saffron-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-civic-900 text-lg tracking-tight">JanSunwai</span>
              <span className="text-saffron-500 font-bold text-lg ml-0.5">AI</span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/file-complaint" className="hover:text-saffron-600 transition-colors">File Complaint</Link>
            <Link href="/track" className="hover:text-saffron-600 transition-colors">Track</Link>
            <Link href="/dashboard" className="hover:text-saffron-600 transition-colors">Dashboard</Link>
          </div>
          <Link href="/file-complaint" className="bg-saffron-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-saffron-600 transition-colors">
            File Now
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-saffron-50 via-white to-civic-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-saffron-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-civic-200/20 rounded-full blur-3xl" />

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
                href="/track"
                className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-8 py-4 rounded-xl text-lg font-semibold hover:border-saffron-400 hover:text-saffron-700 transition-all"
              >
                <Search className="w-5 h-5" />
                Track Complaint
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-civic-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-extrabold text-saffron-400">{s.value}</p>
              <p className="text-sm text-gray-300 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-civic-900">We handle all civic issues</h2>
          <p className="text-gray-500 mt-2">12 categories covering every aspect of municipal governance</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CATEGORIES_SAMPLE.map((cat) => (
            <div
              key={cat.label}
              className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all cursor-default"
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15` }}>
                <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <span className="font-medium text-gray-800 text-sm">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-civic-900">How it works</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Describe & Submit', desc: 'Tell us about the issue. Upload photos, share location. AI classifies automatically.' },
              { step: '02', title: 'AI Routes & Scores', desc: 'Our AI determines severity, finds the right department, and flags your legal rights.' },
              { step: '03', title: 'Track & Resolve', desc: 'Follow your complaint in real-time. Auto-escalation ensures accountability.' },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-4xl font-extrabold text-saffron-200 mb-3">{item.step}</div>
                <h3 className="text-lg font-bold text-civic-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-br from-civic-800 to-civic-900 rounded-3xl p-10 sm:p-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to make your voice heard?
          </h2>
          <p className="text-civic-200 text-lg max-w-xl mx-auto">
            Every complaint you file helps improve your community. Start now.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/file-complaint" className="inline-flex items-center gap-2 bg-saffron-500 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-saffron-600 transition-colors">
              File a Grievance <ChevronRight className="w-5 h-5" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-colors">
              <BarChart3 className="w-5 h-5" />
              View Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
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
