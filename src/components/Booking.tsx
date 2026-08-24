import React, { useState, useEffect } from 'react';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { 
  Calendar, 
  Clock, 
  Briefcase, 
  User as UserIcon, 
  Mail, 
  FileText, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';
import { Service } from '../types.ts';

export default function Booking() {
  const [services, setServices] = useState<Service[]>([]);
  
  // Form fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [notes, setNotes] = useState('');

  const [captcha, setCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          setServices(data);
          if (data.length > 0) {
            setServiceName(data[0].name); // Default selection
          }
        }
      } catch (err) {
        console.error('Error fetching services for booking:', err);
      }
    };
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !serviceName || !appointmentDate) return;

    if (captcha.trim() !== '5') {
      setCaptchaError(true);
      setStatus('error');
      setMsg('Incorrect anti-bot verification answer. Please solve the equation correctly.');
      return;
    }

    setCaptchaError(false);
    setStatus('submitting');
    try {
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({
          clientName,
          clientEmail,
          serviceName,
          appointmentDate,
          notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // Submit to Netlify forms also
        try {
          await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              'form-name': 'booking',
              'clientName': clientName,
              'email': clientEmail,
              'phone': '',
              'date': appointmentDate,
              'time': '',
              'service': serviceName,
              'notes': notes
            }).toString()
          });
        } catch (netlifyErr) {
          console.warn('Netlify booking form submission failed:', netlifyErr);
        }

        setStatus('success');
        setMsg('Consultation successfully requested! Our technical planning directors will review availability and dispatch a confirmation email.');
        setClientName('');
        setClientEmail('');
        setNotes('');
        setCaptcha('');
      } else {
        setStatus('error');
        setMsg(data.error || 'Failed to request consultation.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMsg('Network failure. Please try again.');
    }
  };

  return (
    <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen">
      
      {/* Booking Header */}
      <section className="bg-slate-950/80 border-b border-slate-850/60 text-white py-16 relative overflow-hidden" id="booking-header">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block mb-2">Tenders & Estimations</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Book a Consultation</h1>
          <p className="text-slate-400 text-sm mt-2 max-w-xl">
            Schedule a virtual or on-site conference with our civil planners, blueprint architects, and quantity estimation surveyors.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Column Left: Booking Information */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Conference Protocols</span>
              <h2 className="text-2xl font-bold text-white">What to Expect</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our initial consulting conferences are structured to save time and align structural ambitions precisely before formal tender submissions.
              </p>
            </div>

            <div className="space-y-6 text-xs text-slate-400">
              <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3.5 shadow-xs">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold font-mono shrink-0">1</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Scope Alignment</h4>
                  <p className="mt-1 leading-relaxed">We review your primary land credentials, local authority boundaries, and preliminary blueprint ideas.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3.5 shadow-xs">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold font-mono shrink-0">2</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Feasibility & BIM Sandbox</h4>
                  <p className="mt-1 leading-relaxed">We evaluate soil resilence vectors, structural concrete tolerances, and run simulated cost estimations on our CAD systems.</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 border border-slate-800/80 rounded-xl flex items-start gap-3.5 shadow-xs">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold font-mono shrink-0">3</span>
                <div>
                  <h4 className="font-bold text-white text-sm">Comprehensive Quotation</h4>
                  <p className="mt-1 leading-relaxed">We supply a complete, legally compliant, BREEAM-audited quotation and material supply-chain checklist.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column Right: Interactive appointment request form */}
          <div className="lg:col-span-7 bg-[#0E0E10]/90 border border-slate-850 rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="space-y-2 mb-8">
              <h3 className="font-bold text-xl text-white">Schedule Consultation Request</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide contact particulars. Confirmations will be dispatched via email.
              </p>
            </div>

            {status === 'success' ? (
              <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-6 rounded-xl flex flex-col items-center text-center gap-3">
                <CheckCircle className="w-12 h-12 text-emerald-500 animate-bounce" />
                <div>
                  <span className="font-bold text-base block mb-1">Consultation Queued!</span>
                  <span className="text-xs">{msg}</span>
                </div>
                <button
                  onClick={() => setStatus('idle')}
                  className="bg-amber-500 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs mt-3 hover:bg-amber-400"
                >
                  Schedule Another Conference
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Your Full Name</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500"><UserIcon className="w-4 h-4" /></span>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                        placeholder="e.g. Richard Sterling"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Email Address</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500"><Mail className="w-4 h-4" /></span>
                      <input
                        type="email"
                        className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                        placeholder="e.g. richard@sterling.com"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Select Targeted Service</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-slate-500"><Briefcase className="w-4 h-4" /></span>
                      <select
                        className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white outline-none"
                        value={serviceName}
                        onChange={(e) => setServiceName(e.target.value)}
                        required
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.name} className="bg-slate-950 text-white">{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Target Date & Time</label>
                    <div className="relative">
                      <input
                        type="datetime-local"
                        className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2 px-3 text-sm text-white outline-none transition-all"
                        style={{ colorScheme: 'dark' }}
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">Brief Project Description / Notes</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500"><FileText className="w-4 h-4" /></span>
                    <textarea
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all resize-none"
                      placeholder="Specify blueprint status, safety requirements, land credentials, or general inquiries..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-slate-850/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      Anti-Bot Human Verification
                    </span>
                    <span className="text-[10px] font-mono text-amber-500 font-bold">
                      Required
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    To safeguard our portal against automated spam, please solve the equation:<br />
                    <span className="text-white font-mono font-bold bg-slate-900 px-2.5 py-1 rounded inline-block my-1.5">15x + 5x - 10 = 90</span><br />
                    Find the value of x.
                  </p>
                  <div>
                    <input
                      type="text"
                      className={`w-full bg-slate-950 border ${captchaError ? 'border-red-500' : 'border-slate-850'} focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all`}
                      placeholder="Enter the value of x (numerical)"
                      value={captcha}
                      onChange={(e) => {
                        setCaptcha(e.target.value);
                        setCaptchaError(false);
                      }}
                      required
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div className="bg-red-950/40 border border-red-800 text-red-300 p-4 rounded-lg text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{msg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                  id="submit-booking-btn"
                >
                  <Calendar className="w-4 h-4 text-slate-950" />
                  {status === 'submitting' ? 'Scheduling Conference...' : 'Schedule Consulting Conference'}
                </button>

              </form>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
