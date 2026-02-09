'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  Shield, FileText, Loader2, AlertTriangle, ArrowLeft,
  Download, Scale, Building2, Calendar, Printer, Globe
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface RtiApplication {
  id: string;
  subject: string;
  body: string;
  body_hindi: string | null;
  addressed_to: string;
  department_name: string;
  reference_laws: string[];
  fee_amount: string;
  language: string;
  created_at: string;
}

interface RtiPageData {
  applications: RtiApplication[];
  grievance_id: string;
  can_generate: boolean;
}

export default function RtiPage() {
  const params = useParams();
  const grievanceId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [data, setData] = useState<RtiPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [selectedRti, setSelectedRti] = useState<RtiApplication | null>(null);

  useEffect(() => {
    if (!grievanceId) return;
    fetchRti();
  }, [grievanceId]);

  async function fetchRti() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/rti/${grievanceId}`);
      const json = await res.json();

      if (!res.ok) {
        if (res.status === 404) {
          setData({ applications: [], grievance_id: grievanceId, can_generate: json.can_generate ?? false });
        } else {
          setError(json.error || 'Failed to load RTI data.');
        }
        return;
      }

      const apps = json.data?.applications || json.applications || [];
      setData({
        applications: apps,
        grievance_id: grievanceId,
        can_generate: json.can_generate ?? true,
      });
      if (apps.length > 0) {
        setSelectedRti(apps[0]);
      }
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    setGenerating(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/rti/generate/${grievanceId}`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to generate RTI application.');
        return;
      }

      // Refresh the list
      await fetchRti();
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setGenerating(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-saffron-500 mx-auto mb-3" />
          <p className="text-gray-500">Loading RTI application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="saffron-strip" />

      {/* Nav */}
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="print:hidden">
          <Link href="/track" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-saffron-600 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Tracking
          </Link>

          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-tricolor-green/10 flex items-center justify-center">
                  <Scale className="w-6 h-6 text-tricolor-green" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-civic-900">RTI Application</h1>
                  <p className="text-sm text-gray-500">Right to Information Act, 2005</p>
                </div>
              </div>
            </div>

            {selectedRti && (
              <div className="flex items-center gap-2">
                {/* Language toggle */}
                {selectedRti.body_hindi && (
                  <button
                    onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                    className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                    {language === 'en' ? 'Hindi' : 'English'}
                  </button>
                )}
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-civic-900 text-white rounded-lg text-sm font-medium hover:bg-civic-800 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Print / Save PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3 mb-6 print:hidden">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* No RTI yet */}
        {data && data.applications.length === 0 && (
          <div className="text-center py-16 print:hidden">
            <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-xl font-bold text-civic-900 mb-2">No RTI Application Generated Yet</h2>
            {data.can_generate ? (
              <>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">
                  Your complaint qualifies for an RTI application. Click below to generate one using AI.
                </p>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-2 bg-tricolor-green text-white px-6 py-3 rounded-xl font-semibold hover:bg-tricolor-green/90 transition-colors disabled:opacity-50"
                >
                  {generating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Scale className="w-5 h-5" />
                  )}
                  {generating ? 'Generating...' : 'Generate RTI Application'}
                </button>
              </>
            ) : (
              <p className="text-gray-500 max-w-md mx-auto">
                RTI applications are available for complaints at escalation Level 4 or above.
                Your complaint has not reached that level yet.
              </p>
            )}
          </div>
        )}

        {/* RTI Document */}
        {selectedRti && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 print:border-none print:p-0 print:rounded-none">
            {/* RTI Header */}
            <div className="text-center mb-8 pb-6 border-b border-gray-200 print:border-black">
              <h2 className="text-xl font-bold text-civic-900 uppercase tracking-wide">
                Application Under Right to Information Act, 2005
              </h2>
              <p className="text-sm text-gray-500 mt-1">Section 6(1) Read with Section 6(3)</p>
            </div>

            {/* Addressed To */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider mb-1">To,</p>
              <p className="text-gray-800 font-medium whitespace-pre-line">{selectedRti.addressed_to}</p>
            </div>

            {/* Subject */}
            <div className="mb-6">
              <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider mb-1">Subject:</p>
              <p className="text-gray-900 font-semibold">{selectedRti.subject}</p>
            </div>

            {/* Body */}
            <div className="mb-8 leading-relaxed text-gray-700 whitespace-pre-line">
              {language === 'hi' && selectedRti.body_hindi
                ? selectedRti.body_hindi
                : selectedRti.body}
            </div>

            {/* Reference Laws */}
            {selectedRti.reference_laws && selectedRti.reference_laws.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 print:bg-white print:border print:border-gray-400">
                <p className="text-sm font-bold text-civic-900 mb-2 flex items-center gap-2">
                  <Scale className="w-4 h-4" />
                  Referenced Laws & Sections
                </p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  {selectedRti.reference_laws.map((law, i) => (
                    <li key={i}>{law}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Fee Info */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                Department: {selectedRti.department_name}
              </span>
              <span>Fee: Rs. {selectedRti.fee_amount}</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Generated: {new Date(selectedRti.created_at).toLocaleDateString('en-IN')}
              </span>
            </div>

            {/* Signature area */}
            <div className="mt-12 pt-6 border-t border-gray-200 print:border-black">
              <div className="text-right">
                <div className="h-16 mb-2" />
                <p className="text-sm text-gray-500">(Signature of Applicant)</p>
                <p className="text-sm text-gray-700 font-medium mt-4">Date: _______________</p>
                <p className="text-sm text-gray-700 font-medium mt-1">Place: _______________</p>
              </div>
            </div>
          </div>
        )}

        {/* Generate another */}
        {data && data.applications.length > 0 && data.can_generate && (
          <div className="mt-6 text-center print:hidden">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-saffron-600 font-medium transition-colors disabled:opacity-50"
            >
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Regenerate RTI Application'}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-5 bg-tricolor-green/5 border border-tricolor-green/20 rounded-2xl print:hidden">
          <h3 className="font-bold text-tricolor-green mb-3 flex items-center gap-2">
            <Scale className="w-5 h-5" />
            How to File This RTI
          </h3>
          <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
            <li>Print this application or save as PDF using the button above</li>
            <li>Attach a Postal Order or Demand Draft of Rs. {selectedRti?.fee_amount || '10'} payable to the PIO</li>
            <li>Send via registered post to the address mentioned in the application</li>
            <li>You can also file online at <strong>rtionline.gov.in</strong></li>
            <li>The PIO must respond within 30 days (Section 7(1) of RTI Act)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
