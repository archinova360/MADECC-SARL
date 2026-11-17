import React, { useEffect, useState } from 'react';
import { Building2, ShieldCheck, AlertTriangle, Globe, ArrowRight, Layers, Handshake } from 'lucide-react';

export interface PublicCorporateProfile {
  id?: number;
  companyName: string;
  tradeName: string;
  motto: string;
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

export interface PublicDivision {
  id: number;
  code: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  fullDescription?: string;
  operationalStatus: string;
  country: string;
  currency: string;
  regulatoryBody?: string;
  licenceRequired: boolean;
  licenceStatus: string;
  services: {
    id: number;
    name: string;
    shortDescription: string;
    pricingModel?: string;
    currency: string;
  }[];
}

const OP_STATUS_LABELS: Record<string, string> = {
  PROPOSED: 'Proposed',
  UNDER_FEASIBILITY: 'Under feasibility assessment',
  SEEKING_INVESTMENT: 'Seeking investment',
  PARTNERSHIP_DISCUSSIONS: 'Partnership discussions',
  AWAITING_REGULATORY_APPROVAL: 'Awaiting regulatory approval',
  APPROVED_FOR_OPERATION: 'Approved for operation',
  OPERATIONAL: 'Operational',
  TEMPORARILY_INACTIVE: 'Temporarily inactive',
};

export function usePublicCorporateData() {
  const [profile, setProfile] = useState<PublicCorporateProfile | null>(null);
  const [opportunities, setOpportunities] = useState<PublicOpportunity[]>([]);
  const [divisions, setDivisions] = useState<PublicDivision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [profRes, divRes] = await Promise.all([
          fetch('/api/public/corporate-profile'),
          fetch('/api/public/corporate-divisions'),
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

  return { profile, opportunities, divisions, loading };
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
          : 'bg-slate-900/80 border-amber-500/30'
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
  onInquire?: (subject: string) => void;
  theme?: 'dark' | 'light';
}> = ({ divisions, opportunities = [], onInquire, theme = 'dark' }) => {
  if (!divisions || divisions.length === 0) return null;

  const isLight = theme === 'light';

  return (
    <div className="space-y-10">
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-amber-500">
          Multi-Sector Portfolio
        </div>
        <h2 className={`text-2xl sm:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          MADECC Group Business Divisions &amp; Venture Scope
        </h2>
        <p className={`text-xs sm:text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          Each division reflects its current development, feasibility, or statutory licensing stage in Cameroon with complete transparency.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {divisions.map((div) => (
          <div
            key={div.id}
            className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 ${
              isLight ? 'bg-white border-slate-200' : 'bg-slate-900/70 border-slate-800'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-amber-500 font-bold">{div.code}</span>
                <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>
                  {OP_STATUS_LABELS[div.operationalStatus] || div.operationalStatus}
                </span>
              </div>
              <h3 className={`text-base font-bold leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {div.name}
              </h3>
              <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                {div.summary}
              </p>

              {div.licenceRequired && div.licenceStatus !== 'APPROVED' && (
                <div
                  className={`text-[11px] p-2.5 rounded-lg border ${
                    isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                  }`}
                >
                  Subject to regulatory approval ({div.regulatoryBody || 'Cameroon Authorities'}) prior to commercial operation.
                </div>
              )}

              {div.services && div.services.length > 0 && (
                <div className={`pt-2 border-t space-y-1 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  {div.services.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className={`text-[11px] flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}
                    >
                      <Layers className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`pt-3 border-t flex items-center justify-between text-[11px] ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
              <span className={`font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                <Globe className="w-3 h-3 inline mr-1 text-amber-500" />
                {div.country} · {div.currency}
              </span>
              {onInquire && (
                <button
                  type="button"
                  onClick={() => onInquire(div.name)}
                  className="text-amber-500 hover:text-amber-400 font-bold inline-flex items-center gap-1 cursor-pointer"
                >
                  Inquire <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {opportunities.length > 0 && (
        <div
          className={`rounded-2xl border p-6 space-y-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-amber-500">
            <Handshake className="w-4 h-4" /> Strategic Partnership &amp; Investment Desk
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
    </div>
  );
};
