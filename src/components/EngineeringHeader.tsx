import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  MapPin,
  UserCheck,
  Cpu,
  Copy,
  Check,
  Award,
  BookOpen
} from 'lucide-react';

export interface EngineeringHeaderMetadata {
  projectName?: string;
  projectCode?: string;
  revisionNumber?: string;
  revision?: string;
  approvalStatus?: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'ISSUED' | string;
  companyLogo?: string;
  companyName?: string;
  departmentName?: string;
  clientName?: string;
  clientEmail?: string;
  location?: string;
  preparedBy?: string;
  reviewerName?: string;
  reviewerTitle?: string;
  designCode?: string;
  aiConfidence?: number;
  date?: string;
  documentTitle?: string;
}

export interface EngineeringHeaderProps extends EngineeringHeaderMetadata {
  metadata?: EngineeringHeaderMetadata;
  format?: 'A3' | 'A4';
  orientation?: 'landscape' | 'portrait';
  theme?: 'dark' | 'light';
  showMetadataRibbon?: boolean;
  compact?: boolean;
  className?: string;
  onStatusClick?: () => void;
}

export const EngineeringHeader: React.FC<EngineeringHeaderProps> = (props) => {
  const [copied, setCopied] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Merge direct props with metadata object props
  const meta = props.metadata || {};
  const projectName = props.projectName ?? meta.projectName ?? 'MADECC Commercial Tower Project';
  const projectCode = props.projectCode ?? meta.projectCode ?? 'STR-892104';
  const revisionNumber = props.revisionNumber ?? props.revision ?? meta.revisionNumber ?? meta.revision ?? 'REV-01';
  const approvalStatus = (props.approvalStatus ?? meta.approvalStatus ?? 'APPROVED').toUpperCase();
  const companyLogo = props.companyLogo ?? meta.companyLogo;
  const companyName = props.companyName ?? meta.companyName ?? 'MADECC GROUP S.A.R.L.';
  const departmentName = props.departmentName ?? meta.departmentName ?? 'Civil & Structural Engineering Department';
  const clientName = props.clientName ?? meta.clientName ?? 'SOCIETE GENERALE CAMEROUN';
  const clientEmail = props.clientEmail ?? meta.clientEmail ?? 'projects@sg-cameroon.cm';
  const location = props.location ?? meta.location ?? 'Bonanjo Financial District, Douala';
  const preparedBy = props.preparedBy ?? meta.preparedBy ?? 'Eng. Paulin Nguema, PE (ONIGC No. 2489)';
  const reviewerName = props.reviewerName ?? meta.reviewerName ?? 'Eng. Marcel Mbida, PE (ONIGC Lic #4812)';
  const reviewerTitle = props.reviewerTitle ?? meta.reviewerTitle ?? 'Chief Structural Audit Engineer';
  const designCode = props.designCode ?? meta.designCode ?? 'Eurocode EN 1992-1-1 / BS EN 1990';
  const aiConfidence = props.aiConfidence ?? meta.aiConfidence ?? 96.8;
  const date = props.date ?? meta.date ?? new Date().toISOString().split('T')[0];
  const documentTitle = props.documentTitle ?? meta.documentTitle ?? 'EUROCODE EN 1992-1-1 COMPLIANT STRUCTURAL SUBMISSION';

  const format = props.format ?? 'A3';
  const theme = props.theme ?? 'light';
  const showMetadataRibbon = props.showMetadataRibbon ?? true;
  const compact = props.compact ?? false;

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(projectCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Status Styling Helpers
  const getStatusBadge = () => {
    switch (approvalStatus) {
      case 'APPROVED':
        return {
          bg: 'bg-emerald-600 border-emerald-500 text-white',
          badgeLight: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          badgeDark: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
          label: 'APPROVED FOR CONSTRUCTION'
        };
      case 'ISSUED':
        return {
          bg: 'bg-purple-600 border-purple-500 text-white',
          badgeLight: 'bg-purple-100 text-purple-800 border-purple-300',
          badgeDark: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'ISSUED TO SITE'
        };
      case 'REVIEWED':
        return {
          bg: 'bg-blue-600 border-blue-500 text-white',
          badgeLight: 'bg-blue-100 text-blue-800 border-blue-300',
          badgeDark: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          icon: <FileText className="w-3.5 h-3.5" />,
          label: 'REVIEWED BY PE'
        };
      case 'DRAFT':
      default:
        return {
          bg: 'bg-amber-600 border-amber-500 text-white',
          badgeLight: 'bg-amber-100 text-amber-800 border-amber-300',
          badgeDark: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
          label: 'DRAFT (PRELIMINARY)'
        };
    }
  };

  const statusStyle = getStatusBadge();

  // Dark vs Light Theme Root Wrapper Styles
  const isDark = theme === 'dark';
  const containerBg = isDark
    ? 'bg-slate-950 text-white border-slate-800'
    : 'bg-slate-900 text-white border-slate-900';

  const ribbonBg = isDark
    ? 'bg-slate-900/90 text-slate-200 border-slate-800'
    : 'bg-slate-50 text-slate-800 border-slate-200';

  const ribbonLabel = isDark ? 'text-slate-400' : 'text-slate-500';
  const ribbonVal = isDark ? 'text-slate-100' : 'text-slate-900';

  return (
    <div className={`w-full font-sans space-y-3 ${props.className || ''}`}>
      {/* ISO ENGINEERING TITLE BLOCK HEADER */}
      <div
        className={`${containerBg} p-4 sm:p-5 rounded-2xl border-2 shadow-xl relative overflow-hidden transition-all ${
          format === 'A3' ? 'border-amber-500' : 'border-amber-500/80'
        }`}
      >
        {/* TOP TECHNICAL ACCENT BAR */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-600" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-1">
          {/* LEFT COLUMN: COMPANY LOGO & BRANDING */}
          <div className="flex items-center gap-3.5">
            {companyLogo && !logoError ? (
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-amber-400/50 shadow flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={companyLogo}
                  alt={companyName}
                  className="w-full h-full object-contain"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-black flex items-center justify-center flex-shrink-0 shadow-lg border border-amber-300/40">
                <Building2 className="w-6 h-6 text-slate-950" />
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight uppercase">
                  {companyName}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-mono font-bold rounded">
                  ISO 9001:2015
                </span>
              </div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400 inline" />
                {departmentName}
              </p>
              <p className="text-[10px] text-slate-300 font-mono tracking-tight flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-slate-400 inline" />
                {documentTitle}
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: REVISION, CONTROL & APPROVAL BADGE */}
          <div className="flex flex-col sm:items-end gap-1.5 w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={props.onStatusClick}
                className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow border transition ${statusStyle.bg} cursor-pointer hover:opacity-95`}
                title="Click to view or update approval workflow"
              >
                {statusStyle.icon}
                <span>{statusStyle.label}</span>
              </button>

              <span className="px-2.5 py-1 bg-slate-800/90 text-amber-400 border border-slate-700 text-xs font-mono font-bold rounded-lg shadow">
                {revisionNumber}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-slate-300 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
                title="Click to copy project reference code"
              >
                <span className="text-slate-400">Ref:</span>
                <strong className="text-white">{projectCode}</strong>
                {copied ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 hover:text-white" />
                )}
              </button>

              <span className="text-slate-600">•</span>

              <span className="text-slate-300 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {date}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* PROJECT METADATA RIBBON STRIP (A3 4-COLUMNS / A4 2-3 COLUMNS) */}
      {showMetadataRibbon && !compact && (
        <div
          className={`${ribbonBg} p-3.5 sm:p-4 rounded-xl border font-mono text-xs shadow-md transition-all ${
            format === 'A3'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4'
              : 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'
          }`}
        >
          {/* COL 1: PROJECT & LOCATION */}
          <div className="space-y-1 pr-2 border-b sm:border-b-0 sm:border-r border-slate-300/40 dark:border-slate-800 pb-2 sm:pb-0">
            <span className={`text-[10px] ${ribbonLabel} font-bold uppercase tracking-wider block font-sans`}>
              Project Title & Site
            </span>
            <p className={`font-extrabold ${ribbonVal} text-xs sm:text-sm truncate`} title={projectName}>
              {projectName}
            </p>
            <p className="text-[11px] text-slate-500 font-sans flex items-center gap-1 truncate" title={location}>
              <MapPin className="w-3 h-3 text-amber-500 flex-shrink-0" />
              {location}
            </p>
          </div>

          {/* COL 2: CLIENT & REVIEWER */}
          <div className="space-y-1 pr-2 border-b sm:border-b-0 sm:border-r border-slate-300/40 dark:border-slate-800 pb-2 sm:pb-0">
            <span className={`text-[10px] ${ribbonLabel} font-bold uppercase tracking-wider block font-sans`}>
              Client & Auditor
            </span>
            <p className={`font-bold ${ribbonVal} text-xs truncate`} title={clientName}>
              {clientName}
            </p>
            <p className="text-[11px] text-slate-500 font-sans flex items-center gap-1 truncate" title={reviewerName}>
              <UserCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              {reviewerName}
            </p>
          </div>

          {/* COL 3: DESIGN CODE & AI SCAN CONFIDENCE */}
          <div className="space-y-1 pr-2 border-b md:border-b-0 md:border-r border-slate-300/40 dark:border-slate-800 pb-2 md:pb-0">
            <span className={`text-[10px] ${ribbonLabel} font-bold uppercase tracking-wider block font-sans`}>
              Standard & AI Verification
            </span>
            <p className="font-bold text-amber-600 dark:text-amber-400 text-xs truncate" title={designCode}>
              {designCode}
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-sans font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-500" />
              {aiConfidence}% AI Scan Confidence
            </p>
          </div>

          {/* COL 4 (FULL A3 OR CONDITIONAL A4): PREPARED BY & COMPLIANCE */}
          {format === 'A3' && (
            <div className="space-y-1">
              <span className={`text-[10px] ${ribbonLabel} font-bold uppercase tracking-wider block font-sans`}>
                Engineer of Record
              </span>
              <p className={`font-bold ${ribbonVal} text-xs truncate`} title={preparedBy}>
                {preparedBy}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-sans flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-500" />
                ONIGC Registered & Certified
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EngineeringHeader;
