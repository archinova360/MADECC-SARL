import React, { useState, useEffect } from 'react';
import {
  Globe,
  Code,
  ShoppingBag,
  Search,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Sparkles,
  Server,
  Smartphone,
  Layers,
  CreditCard,
  X,
  RefreshCw,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { FadeIn, StaggerContainer, StaggerItem } from './MotionReveal.tsx';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';
import { useCmsPage } from '../lib/useCmsPage.ts';
import { CmsCustomSections } from './cms/CmsCustomSections.tsx';

interface WebsiteDevelopmentServicesProps {
  onNavigateToTab: (tab: string, extraState?: any) => void;
}

interface WebServiceRecord {
  id: number | string;
  slug: string;
  serviceCode?: string;
  name: string;
  shortDescription?: string;
  description: string;
  fullDescription?: string;
  category?: string;
  priceRange?: string;
  icon?: string;
  overview?: string;
  whatWeDeliver?: string[];
  deliverables?: string[];
  processSteps?: { title: string; desc: string }[];
  typicalProjects?: string[];
  industriesServed?: string[];
  faqs?: { q: string; a: string }[];
  ctaText?: string;
}

const ICON_MAP: Record<string, any> = {
  Globe,
  Code,
  ShoppingBag,
  Search,
  Server,
  Layers
};

export const WebsiteDevelopmentServices: React.FC<WebsiteDevelopmentServicesProps> = ({
  onNavigateToTab
}) => {
  const { settings } = useSiteSettings();
  const { hero: cmsHero, getCustomSections } = useCmsPage('website-development');
  const siteName = settings?.siteName || 'MADECC GROUP';

  const [services, setServices] = useState<WebServiceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<WebServiceRecord | null>(null);

  const fetchWebServices = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/services');
      if (!res.ok) {
        throw new Error(`Failed to load services (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        const webOnly = data
          .filter((s: any) => {
            const cat = (s.category || '').toLowerCase();
            return cat.includes('website') || cat.includes('digital') || cat.includes('web');
          })
          .sort((a: any, b: any) => Number(a.displayOrder || 99) - Number(b.displayOrder || 99));
        setServices(webOnly);
      } else {
        setServices([]);
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Unable to reach operations catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebServices();
  }, []);

  const handleRequestQuote = (serviceName?: string) => {
    onNavigateToTab('request-a-quote', serviceName ? { selectedService: serviceName } : undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* HERO SECTION */}
      {cmsHero?.showHero !== false && (
      <section className="bg-slate-900 text-white border-b border-slate-800 py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/15 text-amber-400 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 border border-amber-500/30">
            <Globe className="w-3.5 h-3.5" /> {cmsHero?.eyebrow || `${siteName} Digital Engineering`}
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl">
            {cmsHero?.title || 'Production Website & Full-Stack Portal Development'}
          </h1>

          <p className="text-slate-300 text-base sm:text-xl max-w-3xl leading-relaxed mb-10 font-normal">
            {cmsHero?.subtitle || 'From authoritative corporate websites to custom PostgreSQL client portals, MTN MoMo / Orange Money e-commerce checkouts, and technical Schema.org SEO—engineered with the same rigor as our civil infrastructure works.'}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => handleRequestQuote('Corporate & Business Website Development')}
              className="px-7 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Request a Website Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('client-portal')}
              className="px-7 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Order via Client Portal</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateToTab('schedule-consultation')}
              className="px-7 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Technical Scoping Call</span>
            </button>
          </div>
        </div>
      </section>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* LIVE DATABASE CATALOG */}
        <section>
          <FadeIn className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono block mb-1.5">
                Live Operations Catalog
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Website &amp; Software Engineering Packages
              </h2>
              <p className="text-slate-600 text-sm sm:text-base mt-2 max-w-2xl">
                Transparent scopes, deliverables, and Cameroon FCFA pricing benchmarks managed live in our operations database.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onNavigateToTab('services')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start md:self-auto"
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>View All Construction &amp; Web Services</span>
            </button>
          </FadeIn>

          {loading ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-7 h-7 text-amber-500 animate-spin" />
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
                Loading live Website Development packages...
              </span>
            </div>
          ) : loadError ? (
            <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-rose-700">{loadError}</p>
              <button
                type="button"
                onClick={fetchWebServices}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Retry Loading Services
              </button>
            </div>
          ) : (
            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {services.map((srv) => {
                const IconComp = ICON_MAP[srv.icon || 'Globe'] || Globe;
                const deliverables = Array.isArray(srv.whatWeDeliver) ? srv.whatWeDeliver : [];
                return (
                  <StaggerItem
                    key={srv.id}
                    className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-md hover:shadow-xl hover:border-amber-400 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors shrink-0">
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div className="text-right">
                          {srv.serviceCode && (
                            <span className="text-[10px] font-mono text-slate-400 uppercase block">
                              {srv.serviceCode}
                            </span>
                          )}
                          {srv.priceRange && (
                            <span className="inline-block mt-0.5 text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                              {srv.priceRange}
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="text-xl font-extrabold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                        {srv.name}
                      </h3>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
                        {srv.shortDescription || srv.description}
                      </p>

                      {deliverables.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                            Key Technical Deliverables
                          </div>
                          {deliverables.slice(0, 4).map((d, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedService(srv)}
                        className="flex-1 py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        <span>Inspect Scope &amp; FAQ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRequestQuote(srv.name)}
                        className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>{srv.ctaText || 'Request Quote'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          )}
        </section>

        {/* ARCHITECTURE & CAPABILITIES MATRIX */}
        <FadeIn className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-lg">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-mono block mb-1.5">
              Production Standards
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Engineered for Reliability, Search Visibility &amp; Local Payments
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Smartphone,
                title: 'Mobile-First Speed',
                desc: 'Code-split React & TypeScript interfaces tuned for low-latency browsing across Cameroon mobile networks.'
              },
              {
                icon: Server,
                title: 'Real PostgreSQL Backends',
                desc: 'Every quote form, client portal, and CMS module persists directly to encrypted PostgreSQL—zero fragile mock state.'
              },
              {
                icon: CreditCard,
                title: 'MTN MoMo & Orange Money',
                desc: 'Integrated Cameroon checkout workflows with transaction verification, order tracking, and automated receipts.'
              },
              {
                icon: Search,
                title: 'Technical SEO & Schema',
                desc: 'Canonical URLs, Schema.org JSON-LD graphs, dynamic OpenGraph tags, XML sitemaps, and AdSense readiness.'
              }
            ].map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 hover:border-amber-400/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{cap.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{cap.desc}</p>
                </div>
              );
            })}
          </div>
        </FadeIn>

        {/* CLIENT PORTAL & PUBLIC INTAKE CTA */}
        <FadeIn className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 border border-slate-800 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Already a MADECC GROUP Client?
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Submit &amp; Track Website Requests Inside Your Client Portal
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Sign in to the Client Portal to request a corporate site, custom portal, or SEO upgrade linked directly to your account with real-time status tracking and instant SMTP confirmation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToTab('client-portal')}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Open Client Portal</span>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleRequestQuote('Corporate & Business Website Development')}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              Public Quote Form
            </button>
          </div>
        </FadeIn>

        <CmsCustomSections sections={getCustomSections(['services'])} onNavigateToTab={onNavigateToTab} />
      </div>

      {/* SERVICE SPECIFICATION MODAL */}
      {selectedService && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              aria-label="Close service specifications"
              className="absolute right-6 top-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 mb-4 pr-10">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                {React.createElement(ICON_MAP[selectedService.icon || 'Globe'] || Globe, {
                  className: 'w-6 h-6'
                })}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                    {selectedService.category || 'Website & Digital Development'}
                  </span>
                  {selectedService.priceRange && (
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {selectedService.priceRange}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                  {selectedService.name}
                </h3>
              </div>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 border-b border-slate-100 pb-4">
              {selectedService.fullDescription || selectedService.overview || selectedService.description}
            </p>

            <div className="space-y-6 text-xs sm:text-sm">
              {Array.isArray(selectedService.whatWeDeliver) && selectedService.whatWeDeliver.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Scope &amp; Engineering Included
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedService.whatWeDeliver.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100"
                      >
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(selectedService.processSteps) && selectedService.processSteps.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Delivery Workflow</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selectedService.processSteps.map((step, i) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                        <div className="font-bold text-slate-900 text-xs">
                          0{i + 1}. {step.title}
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5">{step.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(selectedService.deliverables) && selectedService.deliverables.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Production Deliverables
                  </h4>
                  <ul className="space-y-1.5 text-slate-700">
                    {selectedService.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(selectedService.faqs) && selectedService.faqs.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">Technical FAQs</h4>
                  <div className="space-y-2">
                    {selectedService.faqs.map((f, i) => (
                      <div key={i} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
                        <div className="font-bold text-slate-900 text-xs">{f.q}</div>
                        <div className="text-slate-700 text-[11px] mt-1">{f.a}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  const name = selectedService.name;
                  setSelectedService(null);
                  handleRequestQuote(name);
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Request Quote for {selectedService.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteDevelopmentServices;
