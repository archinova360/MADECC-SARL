import React, { useEffect, useState, useMemo } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Globe,
  ArrowRight,
  Layers,
  Handshake,
  Search,
  X,
  FileText,
  Download,
  CheckCircle2,
  MapPin,
  Send,
  Briefcase,
  Info,
} from 'lucide-react';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { getOptimizedImageUrl } from '../lib/utils.ts';

export interface PublicCorporateProfile {
  id?: number;
  companyName: string;
  tradeName: string;
  motto: string;
  corporateDescription?: string;
  country: string;
  city: string;
  streetAddress: string | null;
  displayLocation: string;
  founderName: string | null;
  ownershipPercentage: number | null;
  employeeCount: number | null;
  employeeCountNote: string | null;
  legalStructure?: string;
  legalStructureLabel?: string;
  plannedLegalStructure?: string;
  registrationStatus: string;
  registrationStatusLabel: string;
  isLegallyVerified: boolean;
  statusHeadline: string;
  legalStatusBadge: string;
  registrationNumber: string | null;
  taxpayerNumber: string | null;
}

export interface PublicOpportunity {
  id: number;
  title: string;
  description: string;
  investorOriginRegion: string;
  targetCountry: string;
  registrationJurisdiction: string;
  sectorFocus: string[];
  stageLabel: string;
  ownershipImplicationNote: string;
}

export interface PublicServiceDoc {
  id?: string;
  title: string;
  fileName?: string;
  fileUrl: string;
  mimeType?: string;
}

export interface PublicDivisionService {
  id: number;
  name: string;
  slug?: string;
  categoryGroup?: string | null;
  shortDescription: string;
  fullDescription?: string | null;
  imageUrl?: string | null;
  investmentInfo?: string | null;
  documentsJson?: PublicServiceDoc[];
  pricingModel?: string;
  operationalStatus?: string;
  currency: string;
}

export interface PublicDivision {
  id: number;
  code: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  fullDescription?: string;
  imageUrl?: string | null;
  investmentInfo?: string | null;
  complianceDisclaimer?: string | null;
  documentsJson?: PublicServiceDoc[];
  operationalStatus: string;
  country: string;
  currency: string;
  regulatoryBody?: string;
  licenceRequired: boolean;
  licenceStatus: string;
  services: PublicDivisionService[];
}

export interface PublicRealEstateProject {
  id: number;
  name: string;
  slug: string;
  location: string;
  description: string;
  propertyType: string;
  landArea?: string | null;
  buildingArea?: string | null;
  floors?: number;
  estimatedBudget?: string | null;
  budgetCurrency?: string;
  investmentRequirements?: string | null;
  developmentStage: string;
  isConceptual: boolean;
  disclaimerNote?: string | null;
  photographsJson?: any[];
  architecturalDrawingsJson?: any[];
  rendersJson?: any[];
  feasibilityReportsJson?: any[];
  supportingDocsJson?: any[];
}

export const ENQUIRY_CATEGORIES = [
  'Real estate investment',
  'Pharmaceutical partnerships',
  'Construction project financing',
  'Agricultural investments',
  'Manufacturing investments',
  'Infrastructure partnerships',
  'International business collaboration',
] as const;

const OP_STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Proposed',
  UNDER_FEASIBILITY: 'Under development / feasibility',
  UNDER_DEVELOPMENT: 'Under development',
  SEEKING_INVESTMENT: 'Seeking investment',
  PARTNERSHIP_DISCUSSIONS: 'Partnership discussions',
  AWAITING_REGULATORY_APPROVAL: 'Awaiting regulatory approval',
  APPROVED_FOR_OPERATION: 'Approved for operation',
  OPERATIONAL: 'Operational',
  TEMPORARILY_INACTIVE: 'Temporarily inactive',
};

const REAL_ESTATE_STAGE_LABELS: Record<string, string> = {
  PROPOSED: 'Proposed',
  FEASIBILITY_ASSESSMENT: 'Feasibility assessment',
  LAND_DUE_DILIGENCE: 'Land due diligence',
  PLANNING_DESIGN: 'Planning and design',
  SEEKING_FINANCING: 'Seeking financing',
  AWAITING_APPROVALS: 'Awaiting approvals',
  APPROVED: 'Approved',
  UNDER_DEVELOPMENT: 'Under development',
  UNDER_CONSTRUCTION: 'Under construction',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

function mapDivisionToEnquiryCategory(code: string, name: string): string {
  const lower = `${code} ${name}`.toLowerCase();
  if (lower.includes('real estate') || lower.includes('property')) return 'Real estate investment';
  if (lower.includes('pharma') || lower.includes('health')) return 'Pharmaceutical partnerships';
  if (lower.includes('agricult') || lower.includes('agro')) return 'Agricultural investments';
  if (lower.includes('manufacturing') || lower.includes('material')) return 'Manufacturing investments';
  if (lower.includes('civil') || lower.includes('infrastructure') || lower.includes('logistics') || lower.includes('energy')) {
    return 'Infrastructure partnerships';
  }
  if (lower.includes('construction') || lower.includes('building')) return 'Construction project financing';
  return 'International business collaboration';
}

const SECTOR_FILTER_TABS = [
  { id: 'ALL', label: 'All Divisions' },
  { id: 'CONSTRUCTION', label: 'Construction & Civil' },
  { id: 'REAL_ESTATE', label: 'Real Estate' },
  { id: 'PHARMA', label: 'Pharma & Healthcare' },
  { id: 'AGRI_FOOD', label: 'Agriculture & Agro-Processing' },
  { id: 'LOGISTICS_ENERGY', label: 'Logistics & Renewable Energy' },
  { id: 'MANUFACTURING_CONSULT', label: 'Manufacturing & Consultancy' },
];

function matchSectorTab(div: PublicDivision, tabId: string): boolean {
  if (tabId === 'ALL') return true;
  const hay = `${div.code} ${div.name} ${div.category}`.toLowerCase();
  if (tabId === 'CONSTRUCTION') return hay.includes('construction') || hay.includes('civil');
  if (tabId === 'REAL_ESTATE') return hay.includes('real estate') || hay.includes('property');
  if (tabId === 'PHARMA') return hay.includes('pharma') || hay.includes('health');
  if (tabId === 'AGRI_FOOD') return hay.includes('agricult') || hay.includes('agro');
  if (tabId === 'LOGISTICS_ENERGY') return hay.includes('logistics') || hay.includes('energy') || hay.includes('solar');
  if (tabId === 'MANUFACTURING_CONSULT') return hay.includes('material') || hay.includes('manufacturing') || hay.includes('consultancy');
  return true;
}

export function usePublicCorporateData() {
  const [profile, setProfile] = useState<PublicCorporateProfile | null>(null);
  const [opportunities, setOpportunities] = useState<PublicOpportunity[]>([]);
  const [divisions, setDivisions] = useState<PublicDivision[]>([]);
  const [realEstateProjects, setRealEstateProjects] = useState<PublicRealEstateProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [profRes, divRes, reRes] = await Promise.all([
          fetch('/api/public/corporate-profile'),
          fetch('/api/public/corporate-divisions'),
          fetch('/api/public/real-estate-projects'),
        ]);
        if (profRes.ok && mounted) {
          const data = await profRes.json();
          if (data.profile) setProfile(data.profile);
          if (Array.isArray(data.publishedOpportunities)) setOpportunities(data.publishedOpportunities);
        }
        if (divRes.ok && mounted) {
          const dData = await divRes.json();
          if (Array.isArray(dData.divisions)) setDivisions(dData.divisions);
        }
        if (reRes.ok && mounted) {
          const rData = await reRes.json();
          if (Array.isArray(rData.projects)) setRealEstateProjects(rData.projects);
        }
      } catch {
        // Non-fatal fallback
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { profile, opportunities, divisions, realEstateProjects, loading };
}

export const CorporateRegistrationStatusCard: React.FC<{
  profile: PublicCorporateProfile | null;
  compact?: boolean;
}> = ({ profile, compact = false }) => {
  if (!profile) return null;

  return (
    <div
      className={`rounded-2xl border p-5 ${
        profile.isLegallyVerified
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-slate-900/85 border-amber-500/30'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {profile.isLegallyVerified ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              Corporate Status · {profile.displayLocation}
            </div>
            <div className="text-sm font-bold text-white">{profile.statusHeadline}</div>
            <div className="text-xs text-slate-300">{profile.legalStatusBadge}</div>
          </div>
        </div>
        {!compact && (
          <div className="text-xs text-slate-400 font-mono space-y-0.5 shrink-0 sm:text-right">
            {profile.founderName && (
              <div>
                Founder: <span className="text-white">{profile.founderName}</span> ({profile.ownershipPercentage ?? 100}%)
              </div>
            )}
            <div>
              {profile.registrationNumber ? `RCCM: ${profile.registrationNumber}` : 'RCCM: Pending formal registration'}
            </div>
            {profile.taxpayerNumber && (
              <div>
                NIU: <span className="text-emerald-300">{profile.taxpayerNumber}</span>
              </div>
            )}
            <div>
              Planned Form: <span className="text-slate-200">{profile.plannedLegalStructure || 'MADECC Group SARL'}</span>
            </div>
            <div>
              {profile.employeeCountNote || `Salaried Staff: ${profile.employeeCount ?? 0}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const CorporateDivisionsDirectory: React.FC<{
  divisions: PublicDivision[];
  opportunities?: PublicOpportunity[];
  realEstateProjects?: PublicRealEstateProject[];
  onInquire?: (subject: string) => void;
  theme?: 'dark' | 'light';
}> = ({ divisions, opportunities = [], realEstateProjects: reProp, onInquire, theme = 'dark' }) => {
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeDivision, setActiveDivision] = useState<PublicDivision | null>(null);
  const [localReProjects, setLocalReProjects] = useState<PublicRealEstateProject[]>([]);
  const [enquiryModal, setEnquiryModal] = useState<{ open: boolean; category: string; divisionCode?: string; subjectNote?: string }>({
    open: false,
    category: 'Real estate investment',
  });
  const [enquiryForm, setEnquiryForm] = useState({
    fullName: '',
    organization: '',
    email: '',
    phone: '',
    country: 'Republic of Cameroon',
    proposedBudget: '',
    currency: 'XAF',
    message: '',
  });
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [enquirySuccessRef, setEnquirySuccessRef] = useState<string | null>(null);

  useEffect(() => {
    if (reProp !== undefined) return;
    let mounted = true;
    fetch('/api/public/real-estate-projects')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted && d?.projects) setLocalReProjects(d.projects);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [reProp]);

  const realEstateProjects = reProp ?? localReProjects;

  const filteredDivisions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return (divisions || []).filter((div) => {
      if (!matchSectorTab(div, selectedSector)) return false;
      if (!q) return true;
      const divMatch =
        div.name.toLowerCase().includes(q) ||
        div.summary.toLowerCase().includes(q) ||
        div.code.toLowerCase().includes(q);
      const svcMatch = (div.services || []).some(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.shortDescription.toLowerCase().includes(q) ||
          (s.categoryGroup || '').toLowerCase().includes(q)
      );
      return divMatch || svcMatch;
    });
  }, [divisions, selectedSector, searchTerm]);

  const openEnquiryForDivision = (div: PublicDivision, serviceName?: string) => {
    const defaultCat = mapDivisionToEnquiryCategory(div.code, div.name);
    setEnquirySuccessRef(null);
    setEnquiryError(null);
    setEnquiryModal({
      open: true,
      category: defaultCat,
      divisionCode: div.code,
      subjectNote: serviceName ? `${div.name} — ${serviceName}` : div.name,
    });
    setEnquiryForm((prev) => ({
      ...prev,
      message: serviceName
        ? `Hello MADECC Group team, I would like to discuss ${serviceName} under your ${div.name} division.`
        : prev.message,
    }));
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingEnquiry(true);
    setEnquiryError(null);
    try {
      const csrf = await getCsrfHeaders();
      const res = await fetch('/api/public/corporate-enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrf },
        body: JSON.stringify({
          ...enquiryForm,
          enquiryType: enquiryModal.category,
          divisionCode: enquiryModal.divisionCode || null,
          message: enquiryModal.subjectNote
            ? `[Subject: ${enquiryModal.subjectNote}]\n\n${enquiryForm.message}`
            : enquiryForm.message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit enquiry');
      setEnquirySuccessRef(data.enquiry?.enquiryReference || 'RECORDED');
      setEnquiryForm({
        fullName: '',
        organization: '',
        email: '',
        phone: '',
        country: 'Republic of Cameroon',
        proposedBudget: '',
        currency: 'XAF',
        message: '',
      });
    } catch (err: any) {
      setEnquiryError(err.message || 'Unable to submit enquiry');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  if (!divisions || divisions.length === 0) return null;

  const isLight = theme === 'light';

  return (
    <div className="space-y-10">
      {/* Header & Search */}
      <div className="text-center max-w-4xl mx-auto space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">
          Multi-Sector Portfolio · {divisions.length} Business Divisions
        </div>
        <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
          MADECC Group Business Divisions &amp; Venture Scope
        </h2>
        <p className={`text-xs sm:text-sm max-w-3xl mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Each division reflects its truthful development, feasibility, investment readiness, or statutory licensing stage in Cameroon. Regulated real estate, pharmaceutical, and specialist engineering services proceed strictly under qualified licensed professionals and official approvals.
        </p>

        {/* Search + Action Bar */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search corporate divisions and services"
              placeholder="Search divisions or specific services (e.g. Apartments, Solar, Roads)..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500'
                  : 'bg-slate-900 border-slate-700 text-white placeholder:text-slate-400'
              }`}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setEnquirySuccessRef(null);
              setEnquiryError(null);
              setEnquiryModal({ open: true, category: 'Real estate investment' });
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Handshake className="w-4 h-4" /> Investor &amp; Partnership Enquiry
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {SECTOR_FILTER_TABS.map((tab) => {
            const active = selectedSector === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedSector(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-amber-500 text-slate-950'
                    : isLight
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-600'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Divisions Grid */}
      {filteredDivisions.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center text-xs ${isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-900/50 border-slate-800 text-slate-400'}`}>
          No divisions or services match "{searchTerm}". Try clearing your search filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDivisions.map((div) => {
            const groupedNames = Array.from(
              new Set((div.services || []).map((s) => s.categoryGroup).filter(Boolean))
            ) as string[];

            return (
              <div
                key={div.id}
                className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all hover:shadow-xl ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-amber-400'
                    : 'bg-slate-900/75 border-slate-800 hover:border-amber-500/40'
                }`}
              >
                <div>
                  {/* Professional Sector Image */}
                  {div.imageUrl && (
                    <div className="aspect-[16/9] w-full bg-slate-950 relative overflow-hidden">
                      <img
                        src={getOptimizedImageUrl(div.imageUrl, 800, 75)}
                        alt={div.name}
                        width={640}
                        height={360}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono font-bold text-amber-400 bg-slate-950/80 px-2 py-0.5 rounded">
                          {div.code}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-white bg-slate-950/80 border border-white/15 px-2 py-0.5 rounded">
                          {OP_STATUS_LABELS[div.operationalStatus] || div.operationalStatus}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    {!div.imageUrl && (
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-amber-500 font-bold">{div.code}</span>
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                          {OP_STATUS_LABELS[div.operationalStatus] || div.operationalStatus}
                        </span>
                      </div>
                    )}

                    <h3 className={`text-lg font-extrabold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {div.name}
                    </h3>

                    <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {div.summary}
                    </p>

                    {/* Compliance / Licensing Guardrail */}
                    {(div.complianceDisclaimer || (div.licenceRequired && div.licenceStatus !== 'APPROVED')) && (
                      <div
                        className={`text-[11px] p-2.5 rounded-xl border leading-relaxed flex items-start gap-2 ${
                          isLight
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : 'bg-amber-950/35 border-amber-500/30 text-amber-200'
                        }`}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          {div.complianceDisclaimer ||
                            `Subject to regulatory approval (${div.regulatoryBody || 'Cameroon Authorities'}) prior to commercial operation.`}
                        </span>
                      </div>
                    )}

                    {/* Sub-groups or Services Preview */}
                    {div.services && div.services.length > 0 && (
                      <div className={`pt-2.5 border-t space-y-1.5 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                        <div className="flex items-center justify-between text-[11px] font-mono font-bold text-amber-500">
                          <span>{div.services.length} Specialized Services</span>
                          {groupedNames.length > 0 && (
                            <span className={isLight ? 'text-slate-400' : 'text-slate-500'}>
                              {groupedNames.length} Sub-Groups
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {div.services.slice(0, 4).map((s) => (
                            <div
                              key={s.id}
                              className={`text-xs flex items-start gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                            >
                              <Layers className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{s.name}</span>
                            </div>
                          ))}
                          {div.services.length > 4 && (
                            <div className={`text-[11px] italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              + {div.services.length - 4} more itemized services inside details
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {div.investmentInfo && (
                      <div
                        className={`text-[11px] p-2.5 rounded-xl border ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700'
                            : 'bg-slate-950/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-bold text-amber-500 uppercase font-mono block text-[10px] mb-0.5">
                          Partnership &amp; Investment Scope
                        </span>
                        <span className="line-clamp-2">{div.investmentInfo}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Buttons */}
                <div className={`px-5 py-3.5 border-t space-y-2.5 ${isLight ? 'border-slate-100 bg-slate-50/70' : 'border-slate-800 bg-slate-950/40'}`}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      <Globe className="w-3 h-3 inline mr-1 text-amber-500" />
                      {div.country} · {div.currency}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEnquiryForDivision(div)}
                      className={`text-[11px] font-bold hover:underline cursor-pointer ${
                        isLight ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      Investment / Partner &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveDivision(div)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        isLight
                          ? 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                          : 'bg-slate-900 border-slate-700 text-white hover:border-amber-500/50'
                      }`}
                    >
                      View Details ({div.services?.length || 0})
                    </button>
                    <button
                      type="button"
                      onClick={() => (onInquire ? onInquire(div.name) : openEnquiryForDivision(div))}
                      className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold inline-flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Enquire <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Published Real Estate Projects Showcase (Only renders if admin has published projects) */}
      {realEstateProjects.length > 0 && (
        <div
          className={`rounded-3xl border p-6 sm:p-8 space-y-6 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-amber-500">
                Real Estate &amp; Property Development Pipeline
              </div>
              <h3 className={`text-xl sm:text-2xl font-extrabold mt-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Published Development Concepts &amp; Feasibility Projects
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Stages distinguish conceptual designs and feasibility studies from approved or physically under-construction properties.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEnquirySuccessRef(null);
                setEnquiryModal({ open: true, category: 'Real estate investment' });
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" /> Real Estate Investment Desk
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {realEstateProjects.map((proj) => {
              const previewImg =
                proj.photographsJson?.[0]?.fileUrl ||
                proj.rendersJson?.[0]?.fileUrl ||
                proj.architecturalDrawingsJson?.[0]?.fileUrl ||
                null;
              return (
                <div
                  key={proj.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div>
                    {previewImg && (
                      <div className="aspect-[16/10] bg-slate-900 relative overflow-hidden">
                        <img
                          src={getOptimizedImageUrl(previewImg, 800, 75)}
                          alt={proj.name}
                          width={640}
                          height={400}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                        {proj.isConceptual && (
                          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-slate-950/90 border border-amber-500/40 text-[10px] font-mono font-bold text-amber-400">
                            Proposed / Conceptual Study
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-amber-500 font-bold">{proj.propertyType}</span>
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                          {REAL_ESTATE_STAGE_LABELS[proj.developmentStage] || proj.developmentStage}
                        </span>
                      </div>
                      <h4 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{proj.name}</h4>
                      <div className={`text-xs flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {proj.location}
                      </div>
                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {proj.description}
                      </p>
                      <div className={`grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {proj.landArea && <div>Land: {proj.landArea}</div>}
                        {proj.buildingArea && <div>Built: {proj.buildingArea}</div>}
                        {proj.floors && <div>Floors: {proj.floors}</div>}
                        {proj.estimatedBudget && <div>Est. Budget: {proj.estimatedBudget} {proj.budgetCurrency || 'XAF'}</div>}
                      </div>
                      {proj.disclaimerNote && (
                        <div className={`text-[11px] p-2 rounded-lg border ${isLight ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-amber-950/20 border-amber-500/20 text-amber-200'}`}>
                          {proj.disclaimerNote}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`px-5 py-3 border-t flex items-center justify-between ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                    <span className="text-[11px] font-mono text-slate-400">
                      {proj.investmentRequirements || 'Partnership / Co-development'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEnquirySuccessRef(null);
                        setEnquiryModal({
                          open: true,
                          category: 'Real estate investment',
                          divisionCode: 'DIV-03',
                          subjectNote: `Real Estate Project: ${proj.name} (${proj.location})`,
                        });
                      }}
                      className="text-xs font-bold text-amber-500 hover:underline cursor-pointer shrink-0"
                    >
                      Inquire &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategic Partnership & Investment Desk Opportunities */}
      {opportunities.length > 0 && (
        <div
          className={`rounded-2xl border p-6 space-y-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-500">
              <Handshake className="w-4 h-4" /> Strategic Partnership &amp; Investment Desk
            </div>
            <button
              type="button"
              onClick={() => {
                setEnquirySuccessRef(null);
                setEnquiryModal({ open: true, category: 'International business collaboration' });
              }}
              className="text-xs font-bold text-amber-500 hover:underline cursor-pointer"
            >
              Submit Collaboration Enquiry &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className={`p-4 rounded-xl border space-y-2 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{opp.title}</div>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  {opp.description}
                </p>
                <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Destination: {opp.targetCountry} · Jurisdiction: {opp.registrationJurisdiction} · Status: {opp.stageLabel}
                </div>
                <div className="text-[11px] text-amber-500">{opp.ownershipImplicationNote}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIVISION DETAILS & ALL ITEMIZED SERVICES MODAL */}
      {activeDivision && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 text-slate-200 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {activeDivision.imageUrl && (
              <div className="aspect-[21/7] w-full relative bg-slate-900 overflow-hidden">
                <img
                  src={getOptimizedImageUrl(activeDivision.imageUrl, 1200, 80)}
                  alt={activeDivision.name}
                  width={1024}
                  height={340}
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <button
                  type="button"
                  onClick={() => setActiveDivision(null)}
                  aria-label="Close division details"
                  className="absolute right-4 top-4 w-10 h-10 rounded-full bg-slate-950/80 hover:bg-slate-800 text-white flex items-center justify-center cursor-pointer border border-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono mb-1.5">
                    <span className="text-amber-500 font-bold">{activeDivision.code}</span>
                    <span>·</span>
                    <span className="text-emerald-400">{OP_STATUS_LABELS[activeDivision.operationalStatus] || activeDivision.operationalStatus}</span>
                    <span>·</span>
                    <span className="text-slate-400">{activeDivision.country} ({activeDivision.currency})</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white">{activeDivision.name}</h3>
                </div>
                {!activeDivision.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setActiveDivision(null)}
                    aria-label="Close division details"
                    className="w-10 h-10 rounded-full bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {activeDivision.fullDescription || activeDivision.summary}
              </p>

              {(activeDivision.complianceDisclaimer || activeDivision.licenceRequired) && (
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white block mb-0.5">Regulatory &amp; Compliance Notice</strong>
                    {activeDivision.complianceDisclaimer ||
                      `Subject to applicable statutory licensing (${activeDivision.regulatoryBody || 'Cameroon authorities'}) and qualified professional authorization.`}
                  </div>
                </div>
              )}

              {activeDivision.investmentInfo && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                  <div className="font-mono font-bold text-amber-400 uppercase flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Investment &amp; Partnership Information
                  </div>
                  <p className="text-slate-300 leading-relaxed">{activeDivision.investmentInfo}</p>
                </div>
              )}

              {/* Grouped Services Listing */}
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-500" /> Itemized Services ({activeDivision.services?.length || 0})
                  </h4>
                </div>

                {(() => {
                  const groups = new Map<string, PublicDivisionService[]>();
                  for (const s of activeDivision.services || []) {
                    const g = s.categoryGroup || 'Core Services';
                    if (!groups.has(g)) groups.set(g, []);
                    groups.get(g)!.push(s);
                  }
                  return Array.from(groups.entries()).map(([groupTitle, items]) => (
                    <div key={groupTitle} className="space-y-2.5">
                      <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                        {groupTitle} ({items.length})
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {items.map((svc) => (
                          <div
                            key={svc.id}
                            className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/40 transition-colors flex flex-col justify-between gap-2"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-white text-xs flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{svc.name}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-relaxed">{svc.shortDescription}</p>
                              {svc.investmentInfo && (
                                <p className="text-[11px] text-amber-400/90 italic">{svc.investmentInfo}</p>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                              <span className="font-mono text-slate-500">
                                {OP_STATUS_LABELS[svc.operationalStatus || ''] || svc.operationalStatus || 'Proposed'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const d = activeDivision;
                                  setActiveDivision(null);
                                  if (onInquire) {
                                    onInquire(`${svc.name} (${d.name})`);
                                  } else {
                                    openEnquiryForDivision(d, svc.name);
                                  }
                                }}
                                className="font-bold text-amber-400 hover:underline cursor-pointer"
                              >
                                Enquire &rarr;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Public Supporting Documents */}
              {Array.isArray(activeDivision.documentsJson) && activeDivision.documentsJson.length > 0 && (
                <div className="space-y-2 border-t border-slate-800 pt-4">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-500" /> Supporting Public Briefs &amp; Documents
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeDivision.documentsJson.map((doc, idx) => (
                      <a
                        key={doc.id || idx}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500 text-xs text-slate-200 flex items-center justify-between gap-2"
                      >
                        <span className="truncate">{doc.title || doc.fileName || 'Document'}</span>
                        <Download className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Bottom Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const d = activeDivision;
                    setActiveDivision(null);
                    openEnquiryForDivision(d);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Handshake className="w-4 h-4 text-amber-400" /> Partnership / Investment Desk
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = activeDivision;
                    setActiveDivision(null);
                    if (onInquire) onInquire(d.name);
                    else openEnquiryForDivision(d);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Request Service / Quote <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INVESTOR & PARTNERSHIP ENQUIRY MODAL */}
      {enquiryModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl text-slate-200">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] font-mono uppercase text-amber-500 font-bold">
                  MADECC Group Executive Desk · Yaoundé, Republic of Cameroon
                </div>
                <h3 className="text-lg font-extrabold text-white mt-0.5">
                  Investor, Partnership &amp; Business Enquiry
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEnquiryModal((p) => ({ ...p, open: false }))}
                aria-label="Close investor enquiry modal"
                className="w-10 h-10 rounded-full bg-slate-900 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {enquirySuccessRef ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="text-base font-bold text-white">Enquiry Recorded &amp; Confirmation Dispatched</div>
                <div className="text-xs font-mono text-emerald-300">Reference Code: {enquirySuccessRef}</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Your enquiry has been saved to our corporate desk and acknowledged via email. Discussions remain subject to formal feasibility, legal registration, and regulatory requirements where applicable.
                </p>
                <button
                  type="button"
                  onClick={() => setEnquiryModal((p) => ({ ...p, open: false }))}
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitEnquiry} className="space-y-3.5 text-xs">
                {enquiryError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200">{enquiryError}</div>
                )}

                <label className="block space-y-1">
                  <span className="text-slate-400 font-medium">Enquiry Category *</span>
                  <select
                    value={enquiryModal.category}
                    onChange={(e) => setEnquiryModal((p) => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  >
                    {ENQUIRY_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-slate-400 font-medium">Full Name *</span>
                    <input
                      type="text"
                      required
                      value={enquiryForm.fullName}
                      onChange={(e) => setEnquiryForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400 font-medium">Organization / Company</span>
                    <input
                      type="text"
                      value={enquiryForm.organization}
                      onChange={(e) => setEnquiryForm((p) => ({ ...p, organization: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="space-y-1">
                    <span className="text-slate-400 font-medium">Email Address *</span>
                    <input
                      type="email"
                      required
                      value={enquiryForm.email}
                      onChange={(e) => setEnquiryForm((p) => ({ ...p, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400 font-medium">Phone / WhatsApp</span>
                    <input
                      type="text"
                      value={enquiryForm.phone}
                      onChange={(e) => setEnquiryForm((p) => ({ ...p, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="space-y-1">
                    <span className="text-slate-400 font-medium">Country</span>
                    <input
                      type="text"
                      value={enquiryForm.country}
                      onChange={(e) => setEnquiryForm((p) => ({ ...p, country: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400 font-medium">Indicative Scale / Budget</span>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={enquiryForm.proposedBudget}
                      onChange={(e) => setEnquiryForm((p) => ({ ...p, proposedBudget: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400 font-medium">Currency</span>
                    <select
                      value={enquiryForm.currency}
                      onChange={(e) => setEnquiryForm((p) => ({ ...p, currency: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    >
                      <option value="XAF">XAF</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="GHS">GHS</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1">
                  <span className="text-slate-400 font-medium">Enquiry Details / Proposal Scope *</span>
                  <textarea
                    rows={4}
                    required
                    placeholder="Outline your project scope, partnership interest, investment mandate, or request..."
                    value={enquiryForm.message}
                    onChange={(e) => setEnquiryForm((p) => ({ ...p, message: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  />
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEnquiryModal((p) => ({ ...p, open: false }))}
                    className="px-4 py-2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEnquiry}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" /> {submittingEnquiry ? 'Submitting...' : 'Submit Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
