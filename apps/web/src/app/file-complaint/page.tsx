'use client';

import { useState, useCallback, useRef } from 'react';
import {
  MapPin, Phone, User, FileText, Camera, Shield, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, AlertTriangle, Upload, X, Mic, Globe,
  Droplets, Zap, Construction, Trash2, CloudRain, Lamp, Bus, Wheat, Heart, Scale, Building2, Trees
} from 'lucide-react';
import { apiPost } from '@/lib/api';
import Navbar from '@/components/Navbar';

// ─── Types ──────────────────────────────────────────────────────────────────
interface FormData {
  description: string;
  photos: File[];
  photoPreviewUrls: string[];
  latitude: number | null;
  longitude: number | null;
  address: string;
  phone: string;
  name: string;
  language: string;
  vulnerabilityFlags: string[];
}

interface SubmitResult {
  complaint_number: string;
  category: string;
  sub_category?: string;
  severity_score: number;
  assigned_department: string;
  assigned_officer?: string | null;
  legal_rights_summary: string;
  status: string;
  escalation_level: number;
  community_issue_id?: string | null;
}

const INITIAL_FORM: FormData = {
  description: '',
  photos: [],
  photoPreviewUrls: [],
  latitude: null,
  longitude: null,
  address: '',
  phone: '',
  name: '',
  language: 'hi',
  vulnerabilityFlags: [],
};

const CATEGORIES = [
  { key: 'water_supply', label: 'Water Supply', labelHi: 'जल आपूर्ति', icon: Droplets, color: '#3B82F6' },
  { key: 'electricity', label: 'Electricity', labelHi: 'बिजली', icon: Zap, color: '#F59E0B' },
  { key: 'roads_potholes', label: 'Roads & Potholes', labelHi: 'सड़कें और गड्ढे', icon: Construction, color: '#EF4444' },
  { key: 'sanitation_garbage', label: 'Sanitation', labelHi: 'स्वच्छता', icon: Trash2, color: '#10B981' },
  { key: 'drainage_sewage', label: 'Drainage', labelHi: 'नाली और सीवर', icon: CloudRain, color: '#6366F1' },
  { key: 'street_lighting', label: 'Street Lights', labelHi: 'स्ट्रीट लाइट', icon: Lamp, color: '#F97316' },
  { key: 'public_transport', label: 'Transport', labelHi: 'परिवहन', icon: Bus, color: '#8B5CF6' },
  { key: 'ration_card_pds', label: 'Ration / PDS', labelHi: 'राशन कार्ड', icon: Wheat, color: '#EC4899' },
  { key: 'pension_welfare', label: 'Pension', labelHi: 'पेंशन', icon: Heart, color: '#14B8A6' },
  { key: 'corruption_misconduct', label: 'Corruption', labelHi: 'भ्रष्टाचार', icon: Scale, color: '#DC2626' },
  { key: 'building_construction', label: 'Building', labelHi: 'भवन निर्माण', icon: Building2, color: '#78716C' },
  { key: 'parks_public_spaces', label: 'Parks', labelHi: 'पार्क', icon: Trees, color: '#22C55E' },
];

const LANGUAGES = [
  { code: 'hi', name: 'हिंदी', nameEn: 'Hindi' },
  { code: 'en', name: 'English', nameEn: 'English' },
  { code: 'bn', name: 'বাংলা', nameEn: 'Bengali' },
  { code: 'te', name: 'తెలుగు', nameEn: 'Telugu' },
  { code: 'mr', name: 'मराठी', nameEn: 'Marathi' },
  { code: 'ta', name: 'தமிழ்', nameEn: 'Tamil' },
  { code: 'gu', name: 'ગુજરાતી', nameEn: 'Gujarati' },
  { code: 'kn', name: 'ಕನ್ನಡ', nameEn: 'Kannada' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', nameEn: 'Punjabi' },
  { code: 'ur', name: 'اردو', nameEn: 'Urdu' },
];

const VULNERABILITY_OPTIONS = [
  { key: 'elderly', label: 'Senior Citizen (60+)', labelHi: 'वरिष्ठ नागरिक', icon: '👴' },
  { key: 'disabled', label: 'Person with Disability', labelHi: 'दिव्यांग', icon: '♿' },
  { key: 'bpl', label: 'Below Poverty Line', labelHi: 'गरीबी रेखा से नीचे', icon: '📋' },
  { key: 'pregnant', label: 'Pregnant Woman', labelHi: 'गर्भवती महिला', icon: '🤰' },
];

const STEPS = ['Describe', 'Location', 'Details', 'Review'];

// ─── Main Component ─────────────────────────────────────────────────────────

export default function FileComplaintPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((partial: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...partial }));
  }, []);

  const handlePhotoAdd = useCallback((files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).slice(0, 5 - form.photos.length);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    update({
      photos: [...form.photos, ...newFiles],
      photoPreviewUrls: [...form.photoPreviewUrls, ...newPreviews],
    });
  }, [form.photos, form.photoPreviewUrls, update]);

  const removePhoto = useCallback((idx: number) => {
    URL.revokeObjectURL(form.photoPreviewUrls[idx]);
    update({
      photos: form.photos.filter((_, i) => i !== idx),
      photoPreviewUrls: form.photoPreviewUrls.filter((_, i) => i !== idx),
    });
  }, [form.photos, form.photoPreviewUrls, update]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        // Reverse geocode
        fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`)
          .then(r => r.json())
          .then(data => {
            if (data.results?.[0]) {
              update({ address: data.results[0].formatted_address });
            }
          })
          .catch(() => {})
          .finally(() => setLocating(false));
      },
      () => {
        setError('Could not detect location. Please enter manually.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [update]);

  const toggleVulnerability = useCallback((flag: string) => {
    setForm((prev) => ({
      ...prev,
      vulnerabilityFlags: prev.vulnerabilityFlags.includes(flag)
        ? prev.vulnerabilityFlags.filter((f) => f !== flag)
        : [...prev.vulnerabilityFlags, flag],
    }));
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<SubmitResult>('/grievance/file', {
        phone: form.phone,
        name: form.name || undefined,
        description: form.description,
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        address: form.address,
        language: form.language,
        channel: 'web',
        media_urls: [],
        vulnerability_flags: form.vulnerabilityFlags,
      });
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        const err = res.error;
        setError(typeof err === 'string' ? err : (err as any)?.message || 'Submission failed. Please try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = [
    form.description.length >= 10,
    form.latitude !== null || form.address.length > 5,
    form.phone.length >= 10,
    true,
  ];

  // ─── Success View ──────────────────────────────────────────────────────────
  if (result) {
    const cat = CATEGORIES.find((c) => c.key === result.category);
    const CatIcon = cat?.icon || FileText;
    return (
      <div className="min-h-screen bg-gradient-to-b from-saffron-50 to-white">
        <div className="saffron-strip" />
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="success-fade">
            {/* Success header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-tricolor-green/10 flex items-center justify-center">
                <svg className="success-check w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="#138808" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-civic-900">Complaint Filed Successfully</h1>
              <p className="text-gray-500 mt-1">शिकायत सफलतापूर्वक दर्ज हो गई</p>
            </div>

            {/* Complaint card */}
            <div className="bg-white rounded-2xl border border-saffron-200 shadow-lg overflow-hidden">
              {/* Complaint number banner */}
              <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 px-6 py-4 text-white">
                <p className="text-sm font-medium opacity-80">Complaint Number / शिकायत संख्या</p>
                <p className="text-2xl font-bold tracking-wider mt-1">{result.complaint_number}</p>
              </div>

              <div className="p-6 space-y-4">
                {/* Category + Severity */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat?.color}15` }}>
                    <CatIcon className="w-6 h-6" style={{ color: cat?.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{cat?.label || result.category}</p>
                    {result.sub_category && <p className="text-sm text-gray-500">{result.sub_category}</p>}
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                      result.severity_score >= 70 ? 'bg-red-50 text-red-700' :
                      result.severity_score >= 40 ? 'bg-amber-50 text-amber-700' :
                      'bg-green-50 text-green-700'
                    }`}>
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Severity: {result.severity_score}/100
                    </div>
                  </div>
                </div>

                <hr className="border-gray-100" />

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400 font-medium">Department</p>
                    <p className="text-gray-800 mt-0.5">{result.assigned_department}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Status</p>
                    <p className="text-gray-800 mt-0.5 capitalize">{result.status?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Escalation Level</p>
                    <p className="text-gray-800 mt-0.5">Level {result.escalation_level}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 font-medium">Officer</p>
                    <p className="text-gray-800 mt-0.5">{result.assigned_officer || 'Being assigned'}</p>
                  </div>
                </div>

                {/* Legal rights */}
                {result.legal_rights_summary && (
                  <>
                    <hr className="border-gray-100" />
                    <div className="bg-civic-50 border border-civic-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-civic-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-semibold text-civic-800 text-sm">Your Legal Rights</p>
                          <p className="text-civic-700 text-sm mt-1 leading-relaxed">{result.legal_rights_summary}</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex gap-3">
              <a href="/track" className="flex-1 py-3 text-center rounded-xl border-2 border-saffron-300 text-saffron-700 font-semibold hover:bg-saffron-50 transition-colors">
                Track Status
              </a>
              <a href="/file-complaint" className="flex-1 py-3 text-center rounded-xl bg-saffron-500 text-white font-semibold hover:bg-saffron-600 transition-colors">
                File Another
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form View ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-saffron-50 via-white to-civic-50 noise-bg">
      <div className="saffron-strip" />
      <Navbar />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-civic-900 tracking-tight">
            File a Grievance
          </h1>
          <p className="text-gray-500 mt-2">शिकायत दर्ज करें — Report a civic issue in your area</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 px-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  i < step ? 'bg-tricolor-green text-white cursor-pointer hover:ring-2 hover:ring-tricolor-green/30' :
                  i === step ? 'bg-saffron-500 text-white step-active' :
                  'bg-gray-200 text-gray-400'
                }`}
              >
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
              </button>
              <span className={`text-sm hidden sm:inline font-medium ${
                i <= step ? 'text-gray-800' : 'text-gray-400'
              }`}>{label}</span>
              {i < 3 && <div className={`hidden sm:block w-8 h-0.5 ${i < step ? 'bg-tricolor-green' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            {error}
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
          <div className="p-6 sm:p-8 form-step-enter" key={step}>
            {/* Step 1: Describe */}
            {step === 0 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <FileText className="w-4 h-4 inline mr-1.5 text-saffron-500" />
                    Describe your issue / अपनी समस्या बताएं *
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) => update({ description: e.target.value })}
                    placeholder="E.g., There is no water supply in my area since 3 days. The pipeline is broken near the main road..."
                    rows={5}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent transition-shadow resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.description.length}/2000 characters (min 10)</p>
                </div>

                {/* Photo upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <Camera className="w-4 h-4 inline mr-1.5 text-saffron-500" />
                    Photos (optional, up to 5)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-saffron-400 hover:bg-saffron-50/30 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload photos of the issue</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB each</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handlePhotoAdd(e.target.files)}
                  />
                  {form.photoPreviewUrls.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {form.photoPreviewUrls.map((url, i) => (
                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden group">
                          <img src={url} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => removePhoto(i)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <X className="w-5 h-5 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1.5 text-saffron-500" />
                    Location / स्थान *
                  </label>
                  <button
                    onClick={detectLocation}
                    disabled={locating}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-saffron-500 to-saffron-600 text-white font-semibold rounded-xl hover:from-saffron-600 hover:to-saffron-700 transition-all disabled:opacity-70 shadow-sm"
                  >
                    {locating ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Detecting location...</>
                    ) : (
                      <><MapPin className="w-5 h-5" /> Auto-detect my location</>
                    )}
                  </button>
                  {form.latitude && (
                    <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Location detected: {form.latitude.toFixed(4)}, {form.longitude?.toFixed(4)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    Address / पता *
                  </label>
                  <textarea
                    value={form.address}
                    onChange={(e) => update({ address: e.target.value })}
                    placeholder="Enter your full address, nearest landmark..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent transition-shadow resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      <Phone className="w-4 h-4 inline mr-1.5 text-saffron-500" />
                      Phone Number *
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl">+91</span>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        placeholder="9876543210"
                        className="flex-1 border border-gray-300 rounded-r-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      <User className="w-4 h-4 inline mr-1.5 text-saffron-500" />
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update({ name: e.target.value })}
                      placeholder="Your name"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-saffron-400 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <Globe className="w-4 h-4 inline mr-1.5 text-saffron-500" />
                    Preferred Language / भाषा चुनें
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => update({ language: lang.code })}
                        className={`px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                          form.language === lang.code
                            ? 'border-saffron-500 bg-saffron-50 text-saffron-800 ring-1 ring-saffron-300'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className="font-semibold">{lang.name}</span>
                        {lang.code !== 'en' && <span className="text-xs text-gray-400 ml-1">({lang.nameEn})</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vulnerability */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    <Shield className="w-4 h-4 inline mr-1.5 text-saffron-500" />
                    Priority Status (if applicable)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {VULNERABILITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => toggleVulnerability(opt.key)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm transition-all text-left ${
                          form.vulnerabilityFlags.includes(opt.key)
                            ? 'border-civic-500 bg-civic-50 text-civic-800'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg">{opt.icon}</span>
                        <div>
                          <p className="font-medium">{opt.label}</p>
                          <p className="text-xs text-gray-400">{opt.labelHi}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Review Your Complaint</h3>

                <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400 font-medium">Description:</span>
                    <p className="text-gray-800 mt-0.5">{form.description}</p>
                  </div>
                  {form.photoPreviewUrls.length > 0 && (
                    <div>
                      <span className="text-gray-400 font-medium">Photos:</span>
                      <div className="flex gap-2 mt-1">
                        {form.photoPreviewUrls.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-400 font-medium">Location:</span>
                      <p className="text-gray-800 mt-0.5">{form.address || `${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)}`}</p>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Phone:</span>
                      <p className="text-gray-800 mt-0.5">+91 {form.phone}</p>
                    </div>
                    {form.name && (
                      <div>
                        <span className="text-gray-400 font-medium">Name:</span>
                        <p className="text-gray-800 mt-0.5">{form.name}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400 font-medium">Language:</span>
                      <p className="text-gray-800 mt-0.5">{LANGUAGES.find((l) => l.code === form.language)?.name}</p>
                    </div>
                  </div>
                  {form.vulnerabilityFlags.length > 0 && (
                    <div>
                      <span className="text-gray-400 font-medium">Priority Status:</span>
                      <div className="flex gap-2 mt-1">
                        {form.vulnerabilityFlags.map((f) => {
                          const opt = VULNERABILITY_OPTIONS.find((v) => v.key === f);
                          return (
                            <span key={f} className="inline-flex items-center gap-1 bg-civic-50 text-civic-700 px-2 py-1 rounded-lg text-xs">
                              {opt?.icon} {opt?.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-sm">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">AI will process your complaint</p>
                    <p className="text-amber-700 mt-0.5">Our AI will classify, score severity, assign to the right department, and provide your legal rights.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex justify-between gap-3">
            {step > 0 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1.5 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed[step]}
                className="flex items-center gap-1.5 px-8 py-3 rounded-xl bg-saffron-500 text-white font-semibold hover:bg-saffron-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-tricolor-green to-emerald-600 text-white font-bold hover:from-emerald-700 hover:to-emerald-700 transition-all disabled:opacity-70 shadow-sm"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Submit Complaint</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Category hint */}
        <div className="mt-8 px-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Categories we handle:</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <span
                key={cat.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: `${cat.color}12`, color: cat.color }}
              >
                <cat.icon className="w-3 h-3" />
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
