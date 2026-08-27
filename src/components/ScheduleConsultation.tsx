import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Send, 
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { getCsrfHeaders } from '../lib/csrf.ts';

interface ScheduleConsultationProps {
  onNavigateToTab: (tab: string, extraState?: any) => void;
}

const CONSULTATION_TYPES = [
  'Project Feasibility & Cost Review (30 Mins)',
  'BOQ & Architectural Drawing Audit',
  'Structural Health Check & Site Assessment',
  'Diaspora Project Planning Session',
  'General Construction Consultation'
];

const MEETING_MODES = [
  'Virtual Video Meeting (Google Meet / Zoom)',
  'In-Person at MADECC Yaoundé Office',
  'On-Site Meeting at Project Location'
];

export const ScheduleConsultation: React.FC<ScheduleConsultationProps> = ({ onNavigateToTab }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    consultationType: CONSULTATION_TYPES[0],
    meetingMode: MEETING_MODES[0],
    preferredDate: '',
    preferredTime: '10:00 AM',
    projectLocation: 'Yaoundé',
    notes: '',
    agreeTerms: true,
    captchaAnswer: ''
  });

  const [captchaError, setCaptchaError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.agreeTerms) {
      setErrorMessage('Please accept the Terms & Conditions and Privacy Policy to schedule your session.');
      return;
    }

    if (formData.captchaAnswer.trim() !== '5') {
      setCaptchaError(true);
      setErrorMessage('Incorrect anti-bot verification answer. Please solve the equation correctly (x = 5).');
      return;
    }

    setCaptchaError(false);
    setLoading(true);

    try {
      const csrfHeaders = await getCsrfHeaders();
      const combinedNotes = `[Type: ${formData.consultationType}] [Mode: ${formData.meetingMode}] [Location: ${formData.projectLocation}] [Time Window: ${formData.preferredTime}] [Phone: ${formData.clientPhone}] ${formData.notes ? `\n\nNotes: ${formData.notes}` : ''}`;
      
      const appointmentIso = formData.preferredDate 
        ? new Date(`${formData.preferredDate}T10:00:00`).toISOString()
        : new Date(Date.now() + 24 * 3600 * 1000).toISOString();

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          serviceName: formData.consultationType,
          appointmentDate: appointmentIso,
          notes: combinedNotes
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit consultation booking.');
      }

      setLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      console.error('Consultation booking error:', err);
      setErrorMessage(err.message || 'Unable to submit booking. Please check your network and try again.');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Consultation Scheduled!
          </h1>

          <p className="text-slate-600 text-sm leading-relaxed">
            Thank you, <strong>{formData.clientName}</strong>. Our engineering consultation coordinator has received your booking request and will confirm your meeting details via WhatsApp or email. A confirmation email has been dispatched to <strong>{formData.clientEmail}</strong>.
          </p>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left text-slate-700 space-y-1">
            <div className="font-bold text-slate-900 mb-1">Session Summary:</div>
            <div>• Type: {formData.consultationType}</div>
            <div>• Mode: {formData.meetingMode}</div>
            <div>• Contact: {formData.clientPhone} ({formData.clientEmail})</div>
            <div>• Preferred Date/Window: {formData.preferredDate || 'Upcoming'} ({formData.preferredTime})</div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigateToTab('services')}
              className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              Explore Our Services
            </button>

            <button
              onClick={() => onNavigateToTab('home')}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* Header */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-extrabold uppercase tracking-wider border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Direct Technical Advisory
          </span>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Schedule an Engineering Consultation
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-xl mx-auto">
            Book a dedicated 1-on-1 session with MADECC Group civil engineers or quantity surveyors to review drawings, cost estimates, or site feasibility across Cameroon and Central Africa.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
          
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Consultation Objective *</label>
              <select
                value={formData.consultationType}
                onChange={(e) => setFormData({ ...formData, consultationType: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {CONSULTATION_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Meeting Mode *</label>
              <select
                value={formData.meetingMode}
                onChange={(e) => setFormData({ ...formData, meetingMode: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {MEETING_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcella Ngu"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Phone / WhatsApp Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+237 670 000 000"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="client@example.cm"
                value={formData.clientEmail}
                onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Preferred Date</label>
                <input
                  type="date"
                  value={formData.preferredDate}
                  onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Preferred Time Window</label>
                <select
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="10:00 AM">10:00 AM (Morning)</option>
                  <option value="02:00 PM">02:00 PM (Afternoon)</option>
                  <option value="04:30 PM">04:30 PM (Late Afternoon)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Project Notes or Specific Questions</label>
              <textarea
                rows={3}
                placeholder="Briefly state what you wish to cover during the consultation..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Anti-Bot Human Verification */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-slate-800 tracking-wider">
                  Anti-Bot Human Verification *
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded">
                  Required
                </span>
              </div>
              <p className="text-xs text-slate-600">
                To protect against spam submissions, please solve the equation:<br />
                <span className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded inline-block my-1">
                  15x + 5x - 10 = 90
                </span><br />
                Find the value of x.
              </p>
              <input
                type="text"
                required
                placeholder="Enter value of x (numerical)"
                value={formData.captchaAnswer}
                onChange={(e) => {
                  setFormData({ ...formData, captchaAnswer: e.target.value });
                  setCaptchaError(false);
                }}
                className={`w-full px-4 py-2.5 bg-white border ${captchaError ? 'border-red-500 ring-1 ring-red-500' : 'border-slate-300'} rounded-xl font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500`}
              />
            </div>

            {/* Terms and Privacy Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.agreeTerms}
                  onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                  className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 mt-0.5"
                  required
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I agree to the <button type="button" onClick={() => onNavigateToTab('terms')} className="text-amber-600 underline font-semibold hover:text-amber-700">Terms &amp; Conditions</button> and <button type="button" onClick={() => onNavigateToTab('privacy')} className="text-amber-600 underline font-semibold hover:text-amber-700">Privacy Policy</button>. I consent to MADECC Group contacting me regarding this consultation request.
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => onNavigateToTab('services')}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Booking Session...' : 'Confirm Consultation Booking'}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
};

