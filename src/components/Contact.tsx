import React, { useState } from 'react';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { useLanguage } from '../lib/LanguageContext.tsx';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Building2 
} from 'lucide-react';

export default function Contact() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const [captcha, setCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [responseMsg, setResponseMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) return;
    
    if (captcha.trim() !== '5') {
      setCaptchaError(true);
      setStatus('error');
      setResponseMsg('Incorrect anti-bot verification answer. Please solve the equation correctly.');
      return;
    }
    
    setCaptchaError(false);
    setStatus('submitting');
    try {
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        // Submit to Netlify forms also
        try {
          await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              'form-name': 'contact',
              'name': name,
              'email': email,
              'subject': subject,
              'message': message
            }).toString()
          });
        } catch (netlifyErr) {
          console.warn('Netlify form submission failed, continuing anyway:', netlifyErr);
        }

        setStatus('success');
        setResponseMsg('Your message was successfully submitted to our office. Our directors will review it shortly.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setCaptcha('');
      } else {
        setStatus('error');
        setResponseMsg(data.error || 'Failed to submit inquiry.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setResponseMsg('A network error occurred. Please check your connection and try again.');
    }
  };

  return (
    <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen">
      
      {/* Contact Header */}
      <section className="bg-slate-950/80 border-b border-slate-850/60 text-white py-16 relative overflow-hidden" id="contact-header">
         <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
           <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block mb-2">{t('office_directory')}</span>
           <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('contact_header_title')}</h1>
           <p className="text-slate-400 text-sm mt-2 max-w-xl">
             {t('contact_header_subtitle')}
           </p>
         </div>
       </section>

       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
           
           {/* Column Left: Directory details */}
           <div className="lg:col-span-5 space-y-10">
             <div className="space-y-3">
               <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">{t('headquarters_location')}</span>
              <h2 className="text-2xl font-bold text-white">MADECC Group Cameroon</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Our central corporate headquarters and technical directorate are located in Yaoundé Mbankolo, Cameroon. MADECC Group executes multi-disciplinary civil engineering, infrastructure, residential, and industrial construction everywhere across Cameroon and throughout Africa.
              </p>
            </div>

            <div className="space-y-6 text-sm">
              <div className="flex items-start gap-4">
                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 p-3 rounded-lg shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t('registered_address')}</h4>
                  <p className="text-slate-400 mt-1">Yaoundé Mbankolo, Cameroon<br /><span className="text-xs text-amber-400 font-mono">Operating Everywhere in Cameroon &amp; Across Africa</span></p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 p-3 rounded-lg shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t('corporate_hotlines')}</h4>
                  <p className="text-slate-400 mt-1">
                    General & WhatsApp: +237 683 316 486<br />
                    Operations: +237 671 063 511<br />
                    Projects Desk: +237 689 115 595<br />
                    Administration: +237 671 289 643<br />
                    Customer Support: +237 640 194 505
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 p-3 rounded-lg shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t('digital_inboxes')}</h4>
                  <p className="text-slate-400 mt-1">
                    General & Tenders: kreboya603@gmail.com<br />
                    Construction Services: madecccons@gmail.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-amber-500/10 text-amber-500 border border-amber-500/20 p-3 rounded-lg shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white">{t('working_hours')}</h4>
                  <p className="text-slate-400 mt-1">Mon - Fri: 08:00 - 18:00 (WAT)<br />Sat: 09:00 - 13:00 (Site Inspections)</p>
                </div>
              </div>
            </div>

            {/* Live Google Map Location */}
            <div className="border border-slate-800/80 bg-[#0E0E10]/90 rounded-xl overflow-hidden shadow-sm">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3980.5961209540305!2d11.488756373717328!3d3.89638634810761!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x108bcff0d23b430d%3A0x6e5c797f8a468176!2sMADECC!5e0!3m2!1sen!2scm!4v1784346151859!5m2!1sen!2scm" 
                width="100%" 
                height="320" 
                style={{ border: 0 }} 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="strict-origin-when-cross-origin"
                title="MADECC Group Cameroon Google Maps Location"
              />
            </div>

          </div>

          {/* Column Right: Message submission form */}
          <div className="lg:col-span-7 bg-[#0E0E10]/90 border border-slate-850 rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
            <div className="space-y-2 mb-8">
              <h3 className="font-bold text-xl text-white">{t('send_message')}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('send_message_desc')}
              </p>
            </div>

            {status === 'success' ? (
              <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-6 rounded-xl flex flex-col items-center text-center gap-3">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
                <div>
                  <span className="font-bold text-base block mb-1">{t('success_msg')}</span>
                  <span className="text-xs">{responseMsg || t('success_desc')}</span>
                </div>
                <button
                  onClick={() => setStatus('idle')}
                  className="bg-amber-500 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs mt-3 hover:bg-amber-400"
                >
                  {t('submit_another')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">{t('full_name')}</label>
                    <input
                      type="text"
                      className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      placeholder="e.g. Eleanor Vance"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">{t('email_address')}</label>
                    <input
                      type="email"
                      className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      placeholder="e.g. eleanor@vance.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">{t('subject')}</label>
                  <input
                    type="text"
                    className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                    placeholder="e.g. Tender submission / Residential contract"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">{t('message_text')}</label>
                  <textarea
                    rows={6}
                    className="w-full bg-slate-950 border border-slate-850 focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all resize-none"
                    placeholder="Please specify your project blueprint, location, estimated budget, and safety requirements..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="bg-slate-950/60 border border-slate-850/80 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                      {t('antibot_title')}
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
                    <span>{responseMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                  id="submit-contact-btn"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  {status === 'submitting' ? t('submitting_btn') : t('submit_btn')}
                </button>

              </form>
            )}

          </div>

        </div>
      </div>

    </div>
  );
}
