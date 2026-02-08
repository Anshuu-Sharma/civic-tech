'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Shield, CheckCircle2, XCircle, Star, Loader2, AlertTriangle,
  Clock, Building2, User, FileText, MapPin, ArrowLeft, Send
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface VerificationData {
  grievance: {
    id: string;
    complaint_number: string;
    category: string;
    description: string;
    address: string;
    resolution_notes: string;
    department: string;
    officer: string;
    days_to_resolve: number;
  };
  token: {
    valid: boolean;
    expires_at: string;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  water_supply: 'Water Supply', electricity: 'Electricity',
  roads_potholes: 'Roads & Potholes', sanitation_garbage: 'Sanitation & Garbage',
  drainage_sewage: 'Drainage & Sewage', street_lighting: 'Street Lighting',
  public_transport: 'Public Transport', ration_card_pds: 'Ration / PDS',
  pension_welfare: 'Pension & Welfare', corruption_misconduct: 'Corruption',
  building_construction: 'Building & Construction', parks_public_spaces: 'Parks',
};

export default function VerifyPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<VerificationData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Verification form state
  const [verified, setVerified] = useState<boolean | null>(null);
  const [satisfaction, setSatisfaction] = useState<number>(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<'verified' | 'reopened' | null>(null);

  useEffect(() => {
    if (!token) return;

    async function loadVerification() {
      try {
        // We need the grievance ID from the URL or we fetch all verification data via token
        // The API expects /api/v1/grievance/:id/verify/:token but we only have the token
        // We'll use a simplified endpoint that looks up by token directly
        const res = await fetch(`${API_BASE}/api/v1/grievance/verify-by-token/${token}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setError(json.error || 'Invalid or expired verification link.');
          return;
        }

        setData(json.data);
      } catch {
        setError('Unable to connect to the server. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadVerification();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (verified === null || !data) return;

    if (verified && satisfaction === 0) {
      setError('Please provide a satisfaction rating.');
      return;
    }
    if (!verified && !feedback.trim()) {
      setError('Please provide feedback on why the issue is not resolved.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/grievance/${data.grievance.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          verified,
          satisfaction_score: verified ? satisfaction : undefined,
          feedback: feedback.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to submit verification.');
        return;
      }

      setSubmitted(true);
      setSubmitResult(verified ? 'verified' : 'reopened');
    } catch {
      setError('Unable to connect. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-saffron-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading verification...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-white">
        <div className="saffron-strip" />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-civic-900 mb-2">Verification Failed</h1>
          <p className="text-gray-500 mb-6">{error}</p>
          <Link href="/track" className="inline-flex items-center gap-2 text-saffron-600 font-semibold hover:text-saffron-700">
            <ArrowLeft className="w-4 h-4" /> Track your complaint instead
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-white">
        <div className="saffron-strip" />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          {submitResult === 'verified' ? (
            <>
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-civic-900 mb-2">Thank You!</h1>
              <p className="text-lg text-gray-500 mb-2">
                Your complaint <strong className="text-civic-900 font-mono">{data?.grievance.complaint_number}</strong> has been verified as resolved.
              </p>
              <p className="text-gray-400 text-sm">
                Your satisfaction rating helps us improve civic services.
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              </div>
              <h1 className="text-3xl font-extrabold text-civic-900 mb-2">Complaint Reopened</h1>
              <p className="text-lg text-gray-500 mb-2">
                Your complaint <strong className="text-civic-900 font-mono">{data?.grievance.complaint_number}</strong> has been reopened and escalated.
              </p>
              <p className="text-gray-400 text-sm">
                A senior officer will review your case within 48 hours.
              </p>
            </>
          )}
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href={`/track`} className="inline-flex items-center gap-2 bg-saffron-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-saffron-600 transition-colors">
              Track Complaint
            </Link>
            <Link href="/" className="inline-flex items-center gap-2 border-2 border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-semibold hover:border-gray-300 transition-colors">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
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
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-saffron-50 mb-4">
            <CheckCircle2 className="w-8 h-8 text-saffron-500" />
          </div>
          <h1 className="text-3xl font-extrabold text-civic-900">Verify Resolution</h1>
          <p className="text-gray-500 mt-2">
            Please confirm whether your complaint has been resolved satisfactorily.
          </p>
        </div>

        {/* Complaint Summary */}
        {data && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-sm font-bold text-civic-900">{data.grievance.complaint_number}</span>
              <span className="text-xs font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                Marked Resolved
              </span>
            </div>

            <p className="text-gray-700 text-sm leading-relaxed mb-4">{data.grievance.description}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500">
                <FileText className="w-3.5 h-3.5" />
                <span>{CATEGORY_LABELS[data.grievance.category] || data.grievance.category}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <Building2 className="w-3.5 h-3.5" />
                <span>{data.grievance.department}</span>
              </div>
              {data.grievance.address && (
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{data.grievance.address}</span>
                </div>
              )}
              {data.grievance.officer && (
                <div className="flex items-center gap-2 text-gray-500">
                  <User className="w-3.5 h-3.5" />
                  <span>{data.grievance.officer}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Resolved in {data.grievance.days_to_resolve} days</span>
              </div>
            </div>

            {data.grievance.resolution_notes && (
              <div className="mt-4 p-3 bg-white border border-gray-200 rounded-xl">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Resolution Notes</p>
                <p className="text-sm text-gray-700">{data.grievance.resolution_notes}</p>
              </div>
            )}
          </div>
        )}

        {/* Verification Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Is it resolved? */}
          <div>
            <label className="block text-sm font-bold text-civic-900 mb-3">
              Has this issue been resolved to your satisfaction?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setVerified(true); setError(null); }}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  verified === true
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <CheckCircle2 className="w-8 h-8" />
                <span className="font-semibold">Yes, Resolved</span>
                <span className="text-xs opacity-70">Haan, samasyaa hal ho gayi</span>
              </button>
              <button
                type="button"
                onClick={() => { setVerified(false); setError(null); }}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                  verified === false
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <XCircle className="w-8 h-8" />
                <span className="font-semibold">Not Resolved</span>
                <span className="text-xs opacity-70">Nahi, abhi bhi problem hai</span>
              </button>
            </div>
          </div>

          {/* Satisfaction rating (only if verified) */}
          {verified === true && (
            <div className="form-step-enter">
              <label className="block text-sm font-bold text-civic-900 mb-3">
                How satisfied are you? (1-5 stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSatisfaction(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= satisfaction
                          ? 'fill-saffron-400 text-saffron-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {satisfaction > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  {satisfaction === 5 ? 'Excellent!' : satisfaction === 4 ? 'Good' : satisfaction === 3 ? 'Average' : satisfaction === 2 ? 'Below Average' : 'Poor'}
                </p>
              )}
            </div>
          )}

          {/* Feedback (always shown but required if not resolved) */}
          {verified !== null && (
            <div className="form-step-enter">
              <label className="block text-sm font-bold text-civic-900 mb-2">
                {verified ? 'Any additional feedback? (optional)' : 'What is still unresolved? (required)'}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder={verified
                  ? 'Share your experience...'
                  : 'Please describe what is still not resolved / Kripya batayein ki kya abhi bhi theek nahi hua...'
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-saffron-400 transition-colors resize-none placeholder:text-gray-300"
                required={!verified}
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {verified !== null && (
            <button
              type="submit"
              disabled={submitting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all ${
                verified
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50`}
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  {verified ? 'Confirm Resolution' : 'Reopen Complaint'}
                </>
              )}
            </button>
          )}
        </form>

        {/* Token expiry notice */}
        {data?.token.expires_at && (
          <p className="text-center text-xs text-gray-400 mt-6">
            This verification link expires on {new Date(data.token.expires_at).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}
      </div>
    </div>
  );
}
