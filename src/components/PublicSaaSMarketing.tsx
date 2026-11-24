import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Building2,
  ArrowRight,
  Layers,
  Cpu,
  Globe,
  CheckCircle2,
  Share2,
  Download,
  Printer,
  RefreshCw,
  Send,
  X,
  ExternalLink,
  Copy,
  Check,
  Search,
  Upload,
  FileText,
  Palette,
  Calculator,
  FileSpreadsheet,
  ShieldCheck
} from 'lucide-react';
import { Tenant, SaaSPlan, PlanCode } from '../types.ts';
import { SubscriptionService, DEFAULT_PLANS } from '../services/subscriptionService.ts';
import { TenantService, INITIAL_PILOT_TENANTS, uploadSaasAssetFile } from '../services/tenantService.ts';

interface PublicSaaSMarketingProps {
  onEnterFlagshipTenant: () => void;
  onEnterTenant?: (tenant: Tenant) => void;
  onOpenOnboarding: (planCode?: PlanCode, billingCycle?: 'MONTHLY' | 'ANNUAL') => void;
  onOpenSuperAdmin: () => void;
  onBackToHome?: () => void;
}

interface CloudAnalyticsSummary {
  mrr: number;
  arr: number;
  totalCollected: number;
  activeTenantsCount: number;
  publishedTenantsCount: number;
  totalTenantsCount: number;
  totalVersionsCount: number;
  totalAuditLogsCount: number;
  totalStorageGb: number;
  usageSummary?: {
    totalRuns: number;
    totalCreditsUsed: number;
  };
}

// Genuine valid ASCII DXF CAD drawing representing an 18m x 12m reinforced-concrete structural grid
const VALID_STRUCTURAL_DXF_PLAN = `0
SECTION
2
HEADER
0
ENDSEC
0
SECTION
2
ENTITIES
0
LINE
8
STRUCT_WALLS_EXT
10
0.0
20
0.0
11
18.0
21
0.0
0
LINE
8
STRUCT_WALLS_EXT
10
18.0
20
0.0
11
18.0
21
12.0
0
LINE
8
STRUCT_WALLS_EXT
10
18.0
20
12.0
11
0.0
21
12.0
0
LINE
8
STRUCT_WALLS_EXT
10
0.0
20
12.0
11
0.0
21
0.0
0
LINE
8
STRUCT_PARTITIONS
10
6.0
20
0.0
11
6.0
21
12.0
0
LINE
8
STRUCT_PARTITIONS
10
12.0
20
0.0
11
12.0
21
12.0
0
LINE
8
STRUCT_PARTITIONS
10
0.0
20
6.0
11
18.0
21
6.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
0.0
20
0.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
6.0
20
0.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
12.0
20
0.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
18.0
20
0.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
0.0
20
6.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
6.0
20
6.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
12.0
20
6.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
18.0
20
6.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
0.0
20
12.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
6.0
20
12.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
12.0
20
12.0
0
INSERT
8
STRUCT_COLUMNS
2
COL_250X250
10
18.0
20
12.0
0
ENDSEC
0
EOF`;

export const PublicSaaSMarketing: React.FC<PublicSaaSMarketingProps> = ({
  onEnterFlagshipTenant,
  onEnterTenant,
  onOpenOnboarding,
  onOpenSuperAdmin,
  onBackToHome
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [plans, setPlans] = useState<SaaSPlan[]>(DEFAULT_PLANS);
  const [publishedTenants, setPublishedTenants] = useState<Tenant[]>(INITIAL_PILOT_TENANTS);
  const [analytics, setAnalytics] = useState<CloudAnalyticsSummary | null>(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [tenantSearch, setTenantSearch] = useState('');

  // Share via SMTP Modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareNote, setShareNote] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Interactive Workbench Tabs
  const [workbenchTab, setWorkbenchTab] = useState<'takeoff' | 'eurocode' | 'whitelabel'>('takeoff');

  // TAB 1: Real CAD DXF / SVG / Gemini Vision Takeoff State
  const [drawingName, setDrawingName] = useState('');
  const [drawingMime, setDrawingMime] = useState('application/dxf');
  const [drawingTextContent, setDrawingTextContent] = useState('');
  const [drawingBase64, setDrawingBase64] = useState('');
  const [takeoffStoreys, setTakeoffStoreys] = useState(2);
  const [takeoffScale, setTakeoffScale] = useState(1);
  const [takeoffRegion, setTakeoffRegion] = useState<'CENTRE_YAOUNDE' | 'LITTORAL_DOUALA' | 'NORTH_GAROUA'>('CENTRE_YAOUNDE');
  const [takeoffProjectName, setTakeoffProjectName] = useState('Bastos Commercial Building R+1');
  const [takeoffClientName, setTakeoffClientName] = useState('MADECC Structural Client');
  const [takeoffSaveDb, setTakeoffSaveDb] = useState(false);
  const [takeoffLoading, setTakeoffLoading] = useState(false);
  const [takeoffError, setTakeoffError] = useState<string | null>(null);
  const [takeoffResult, setTakeoffResult] = useState<any | null>(null);

  // TAB 2: Real Eurocode 2 (EN 1992-1-1) Calculator State
  const [ecElement, setEcElement] = useState<'BEAM' | 'COLUMN' | 'SLAB' | 'FOOTING'>('BEAM');
  const [ecConcrete, setEcConcrete] = useState<'C20/25' | 'C25/30' | 'C30/37' | 'C35/45'>('C25/30');
  const [ecSteel, setEcSteel] = useState<'FeE500' | 'FeE400'>('FeE500');
  const [ecWidthMm, setEcWidthMm] = useState(250);
  const [ecDepthMm, setEcDepthMm] = useState(500);
  const [ecSpanM, setEcSpanM] = useState(5.5);
  const [ecCoverMm, setEcCoverMm] = useState(30);
  const [ecMomentKnm, setEcMomentKnm] = useState(115);
  const [ecShearKn, setEcShearKn] = useState(85);
  const [ecAxialKn, setEcAxialKn] = useState(650);
  const [ecSoilBearingKpa, setEcSoilBearingKpa] = useState(200);
  const [ecProjectName, setEcProjectName] = useState('Cloud EN 1992 Structural Note');
  const [ecSaveDb, setEcSaveDb] = useState(false);
  const [ecLoading, setEcLoading] = useState(false);
  const [ecError, setEcError] = useState<string | null>(null);
  const [ecResult, setEcResult] = useState<any | null>(null);

  // TAB 3: Live White-Label Tenant Studio State
  const [studioTenantId, setStudioTenantId] = useState<number>(1);
  const [studioBrandName, setStudioBrandName] = useState('');
  const [studioTagline, setStudioTagline] = useState('');
  const [studioPrimaryColor, setStudioPrimaryColor] = useState('#F59E0B');
  const [studioDomain, setStudioDomain] = useState('');
  const [studioPhone, setStudioPhone] = useState('');
  const [studioEmail, setStudioEmail] = useState('');
  const [studioLogoUrl, setStudioLogoUrl] = useState('');
  const [studioLogoProgress, setStudioLogoProgress] = useState<string | null>(null);
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioNotice, setStudioNotice] = useState<{ text: string; isError?: boolean } | null>(null);

  const loadLiveSaaSData = async () => {
    setLoadingLive(true);
    try {
      const [livePlans, liveTenants, analyticsResp] = await Promise.all([
        SubscriptionService.fetchPlansFromApi({ includeUnpublished: false }),
        TenantService.fetchTenantsFromApi({ publishedOnly: true }),
        fetch('/api/saas/analytics').then(r => (r.ok ? r.json() : null)).catch(() => null)
      ]);
      SubscriptionService.fetchPaymentConfigFromApi().catch(() => {});
      if (Array.isArray(livePlans) && livePlans.length > 0) setPlans(livePlans);
      if (Array.isArray(liveTenants) && liveTenants.length > 0) setPublishedTenants(liveTenants);
      if (analyticsResp && typeof analyticsResp.totalTenantsCount === 'number') {
        setAnalytics(analyticsResp);
      }
    } catch (e) {
      console.warn('[SAAS_MARKETING_SYNC_WARN]', e);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    loadLiveSaaSData();
  }, []);

  const flagshipTenant = useMemo(
    () =>
      publishedTenants.find(t => t.isFlagship || t.id === 1) ||
      publishedTenants[0] ||
      TenantService.getActiveTenant(),
    [publishedTenants]
  );

  // Sync White-Label Studio fields when selected tenant changes
  const selectedStudioTenant = useMemo(
    () => publishedTenants.find(t => t.id === studioTenantId) || flagshipTenant,
    [publishedTenants, studioTenantId, flagshipTenant]
  );

  useEffect(() => {
    if (!selectedStudioTenant) return;
    setStudioBrandName(selectedStudioTenant.name || '');
    setStudioTagline(
      selectedStudioTenant.settings?.tagline ||
        'Civil Engineering, Infrastructure & Turnkey Contracting Workspace'
    );
    setStudioPrimaryColor(selectedStudioTenant.settings?.primaryColor || '#F59E0B');
    setStudioDomain(selectedStudioTenant.customDomain || selectedStudioTenant.primaryDomain || '');
    setStudioPhone(selectedStudioTenant.phone || '+237 671 063 511');
    setStudioEmail(selectedStudioTenant.email || 'kreboya603@gmail.com');
    setStudioLogoUrl(selectedStudioTenant.logoUrl || '/logo.png');
  }, [selectedStudioTenant]);

  const filteredTenants = useMemo(() => {
    const q = tenantSearch.trim().toLowerCase();
    if (!q) return publishedTenants;
    return publishedTenants.filter(
      t =>
        (t.name || '').toLowerCase().includes(q) ||
        (t.primaryDomain || '').toLowerCase().includes(q) ||
        (t.customDomain || '').toLowerCase().includes(q) ||
        (t.planCode || '').toLowerCase().includes(q)
    );
  }, [publishedTenants, tenantSearch]);

  // Handle Real Drawing File Selection (.dxf, .svg, .pdf, image/*)
  const handleDrawingFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTakeoffError(null);
    setDrawingName(file.name);
    setDrawingMime(file.type || 'application/octet-stream');

    const lower = file.name.toLowerCase();
    if (lower.endsWith('.dxf') || lower.endsWith('.svg')) {
      const txt = await file.text();
      setDrawingTextContent(txt);
      setDrawingBase64('');
    } else {
      const b64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Failed to read blueprint file.'));
        reader.readAsDataURL(file);
      });
      setDrawingBase64(b64);
      setDrawingTextContent('');
    }
  };

  const handleLoadSampleDxf = () => {
    setTakeoffError(null);
    setDrawingName('structural_grid_18x12m.dxf');
    setDrawingMime('application/dxf');
    setDrawingTextContent(VALID_STRUCTURAL_DXF_PLAN);
    setDrawingBase64('');
  };

  const handleRunTakeoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawingTextContent && !drawingBase64) {
      setTakeoffError('Select a real .DXF, .SVG, .PDF, or blueprint image file first.');
      return;
    }

    setTakeoffLoading(true);
    setTakeoffError(null);
    try {
      const lower = drawingName.toLowerCase();
      const fileType = lower.endsWith('.dxf')
        ? 'DXF'
        : lower.endsWith('.svg')
          ? 'SVG'
          : lower.endsWith('.pdf')
            ? 'PDF'
            : 'IMAGE';

      const res = await fetch('/api/saas/takeoff/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drawingName: drawingName || 'Architectural_Drawing.dxf',
          fileType,
          mimeType: drawingMime,
          fileContentText: drawingTextContent,
          drawingDataBase64: drawingBase64,
          projectStoreys: takeoffStoreys,
          scaleFactor: takeoffScale,
          region: takeoffRegion,
          projectName: takeoffProjectName,
          clientName: takeoffClientName,
          tenantId: flagshipTenant?.id,
          saveToDb: takeoffSaveDb
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setTakeoffError(data.error || `Takeoff failed (HTTP ${res.status})`);
        return;
      }
      setTakeoffResult(data);
    } catch (err: any) {
      setTakeoffError(err?.message || 'Unable to execute CAD takeoff engine.');
    } finally {
      setTakeoffLoading(false);
    }
  };

  const handleExportTakeoffCsv = () => {
    if (!takeoffResult?.boqItems?.length) return;
    const headers = ['Code', 'Trade', 'Description', 'Unit', 'Quantity', 'Unit Rate (XAF)', 'Total (XAF)'];
    const rows = takeoffResult.boqItems.map((r: any) => [
      r.code,
      r.trade,
      r.description,
      r.unit,
      r.quantity,
      r.unitRateXaf,
      r.totalXaf
    ]);
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map((r: any[]) => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${takeoffResult.takeoffRef || 'MADECC-Takeoff'}-BOQ.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Run real EN 1992-1-1 Eurocode 2 solver
  const handleRunEurocode = async (e: React.FormEvent) => {
    e.preventDefault();
    setEcLoading(true);
    setEcError(null);
    try {
      const res = await fetch('/api/saas/eurocode/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elementType: ecElement,
          concreteClass: ecConcrete,
          steelGrade: ecSteel,
          widthMm: ecWidthMm,
          depthMm: ecDepthMm,
          spanM: ecSpanM,
          coverMm: ecCoverMm,
          momentEdKnm: ecMomentKnm,
          shearEdKn: ecShearKn,
          axialEdKn: ecAxialKn,
          soilBearingKpa: ecSoilBearingKpa,
          projectName: ecProjectName,
          tenantId: flagshipTenant?.id,
          saveToDb: ecSaveDb
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setEcError(data.error || `Calculation failed (HTTP ${res.status})`);
        return;
      }
      setEcResult(data);
    } catch (err: any) {
      setEcError(err?.message || 'Eurocode calculation request failed.');
    } finally {
      setEcLoading(false);
    }
  };

  // Generate real A4 EN 1992 Calculation Note PDF
  const handleDownloadEurocodePdf = () => {
    if (!ecResult) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFillColor(11, 15, 20);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MADECC CONSTRUCTION CLOUD — EN 1992-1-1 CALCULATION NOTE', 14, 13);
    doc.setTextColor(226, 232, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Project: ${ecProjectName} | Code: ${ecResult.projectCode} | Standard: ${ecResult.standard}`, 14, 21);

    autoTable(doc, {
      startY: 36,
      head: [['Parameter / Verification', 'Computed Value']],
      body: [
        ['Structural Element', String(ecResult.elementType)],
        ['Verification Status', String(ecResult.checks?.status || 'VERIFIED')],
        ['Concrete Design Strength (f_cd)', `${ecResult.materials?.fcdMpa} MPa (${ecResult.materials?.concreteClass})`],
        ['Steel Design Yield (f_yd)', `${ecResult.materials?.fydMpa} MPa (${ecResult.materials?.steelGrade})`],
        ['Section Geometry', JSON.stringify(ecResult.section)],
        ['Main Reinforcement', String(ecResult.reinforcement?.arrangement || '-')],
        ['Links / Shear Spec', String(ecResult.reinforcement?.stirrupSpec || ecResult.reinforcement?.linksArrangement || 'Nominal')],
        ['Total Reinforcement Steel Mass', `${ecResult.reinforcement?.steelWeightKg ?? '-'} kg`]
      ],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [17, 22, 29], textColor: [245, 158, 11] }
    });

    doc.save(`${ecResult.projectCode || 'EN1992-Note'}.pdf`);
  };

  // Real Logo Upload for White-Label Studio
  const handleStudioLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStudioNotice(null);
    setStudioLogoProgress('Uploading logo...');
    try {
      const url = await uploadSaasAssetFile(file, label => setStudioLogoProgress(label));
      setStudioLogoUrl(url);
      setStudioLogoProgress(null);
      setStudioNotice({ text: 'Logo uploaded to cloud storage. Save & Republish to persist on workspace.' });
    } catch (err: any) {
      setStudioLogoProgress(null);
      setStudioNotice({ text: err?.message || 'Logo upload failed.', isError: true });
    }
  };

  // Save White-Label Branding & Republish Tenant to Neon
  const handleSaveWhiteLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudioTenant) return;
    setStudioSaving(true);
    setStudioNotice(null);
    try {
      const updated = await TenantService.updateTenant(selectedStudioTenant.id, {
        name: studioBrandName.trim(),
        logoUrl: studioLogoUrl || undefined,
        customDomain: studioDomain.trim() || undefined,
        phone: studioPhone.trim() || undefined,
        email: studioEmail.trim() || undefined,
        settings: {
          ...(selectedStudioTenant.settings || {}),
          primaryColor: studioPrimaryColor,
          tagline: studioTagline.trim(),
          logoUrl: studioLogoUrl || selectedStudioTenant.settings?.logoUrl
        },
        changelog: 'White-label branding updated via Construction Cloud Studio',
        createVersionSnapshot: true
      });
      await TenantService.republishTenant(updated.id, {
        changelog: 'Live white-label portal republished',
        notifyTenant: false
      });
      await loadLiveSaaSData();
      setStudioNotice({ text: `Saved and republished ${studioBrandName} live to Neon PostgreSQL.` });
    } catch (err: any) {
      setStudioNotice({ text: err?.message || 'Unable to update tenant branding.', isError: true });
    } finally {
      setStudioSaving(false);
    }
  };

  const handleDownloadPricingCsv = () => {
    const headers = ['Code', 'Plan Name', 'Monthly (XAF)', 'Annual (XAF)', 'Max Users', 'Max Projects', 'Storage (GB)', 'AI Credits/Mo', 'Version'];
    const rows = plans.map(p => [
      p.code,
      p.name,
      p.monthlyPrice,
      p.annualPrice,
      p.maxUsers === -1 ? 'Unlimited' : p.maxUsers,
      p.maxProjects === -1 ? 'Unlimited' : p.maxProjects,
      p.maxStorageGb,
      p.aiCreditsMonthly,
      `v${p.version || 1}`
    ]);
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MADECC-Cloud-SaaS-Pricing-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadBrochurePdf = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFillColor(11, 15, 20);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MADECC CONSTRUCTION CLOUD — ENTERPRISE SAAS', 14, 15);
    doc.setTextColor(226, 232, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Multi-Tenant Civil Engineering ERP · DXF/Vision AI Takeoff · EN 1992 Eurocode Studio', 14, 24);

    autoTable(doc, {
      startY: 40,
      head: [['Tier', 'Monthly (XAF)', 'Annual (XAF)', 'Users', 'Projects', 'Storage', 'AI Credits/Mo']],
      body: plans.map(p => [
        p.name,
        SubscriptionService.formatPrice(p.monthlyPrice, p.currency || 'XAF'),
        SubscriptionService.formatPrice(p.annualPrice, p.currency || 'XAF'),
        p.maxUsers === -1 ? 'Unlimited' : String(p.maxUsers),
        p.maxProjects === -1 ? 'Unlimited' : String(p.maxProjects),
        `${p.maxStorageGb} GB`,
        String(p.aiCreditsMonthly)
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [17, 22, 29], textColor: [245, 158, 11] }
    });

    doc.save(`MADECC-Construction-Cloud-Brochure-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleShareViaSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setSharing(true);
    setShareStatus(null);
    try {
      const res = await SubscriptionService.shareSaasOverview(shareEmail.trim(), shareNote.trim());
      setShareStatus({ text: res.message || `Overview sent to ${shareEmail}` });
      setShareEmail('');
      setShareNote('');
    } catch (err: any) {
      setShareStatus({ text: err.message || 'SMTP dispatch failed', isError: true });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* 3-Zone Top Bar */}
      <header className="border-b border-slate-800 bg-[#0B0F14]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="whitespace-nowrap">
              <span className="text-base font-extrabold text-white tracking-tight">
                MADECC <span className="text-amber-400">Cloud</span>
              </span>
              <span className="hidden sm:block text-[10px] font-mono text-slate-400 -mt-0.5">
                Multi-Tenant Construction OS
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#cloud-directory" className="hover:text-amber-400 whitespace-nowrap">Tenants</a>
            <a href="#cloud-workbench" className="hover:text-amber-400 whitespace-nowrap">Engineering Studio</a>
            <a href="#cloud-pricing" className="hover:text-amber-400 whitespace-nowrap">Pricing Matrix</a>
            <button onClick={onEnterFlagshipTenant} className="hover:text-amber-400 whitespace-nowrap">
              Flagship Portal
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {onBackToHome && (
              <button
                onClick={onBackToHome}
                className="px-3 py-2 bg-[#11161D] hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold border border-slate-800 whitespace-nowrap"
              >
                Main Site
              </button>
            )}
            <button
              onClick={() => onOpenOnboarding('PROFESSIONAL', billingCycle)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap"
            >
              Launch Company Portal
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 pt-14 pb-10 max-w-7xl w-full mx-auto">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
            Civil Engineering ERP &middot; Deterministic CAD Takeoff &middot; EN 1992 Eurocode 2
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] [text-wrap:balance]">
            Power Your Construction Enterprise with <span className="text-amber-400">Intelligent Cloud SaaS</span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Run real DXF/SVG/Vision CAD quantity takeoffs connected to live Neon regional pricing, verify EN 1992-1-1 beams, columns, slabs and footings, and manage white-label contracting portals in one workspace.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onOpenOnboarding('PROFESSIONAL', billingCycle)}
              className="px-7 py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-xl text-sm flex items-center gap-2"
            >
              <span>Create Company Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onEnterFlagshipTenant}
              className="px-6 py-3.5 bg-[#11161D] hover:bg-slate-800 text-white font-bold rounded-xl text-sm border border-slate-700 flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>Explore Flagship ({flagshipTenant.name})</span>
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              className="px-4 py-3.5 bg-[#11161D] hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-sm border border-slate-800 flex items-center gap-2"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Live Neon Platform Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-12">
          {[
            { label: 'Active Tenants', value: analytics ? analytics.activeTenantsCount : publishedTenants.length },
            { label: 'Published Portals', value: analytics ? analytics.publishedTenantsCount : publishedTenants.length },
            { label: 'Commercial Plans', value: plans.length },
            { label: 'Workspace Snapshots', value: analytics ? analytics.totalVersionsCount : 0 },
            { label: 'Verified Usage Runs', value: analytics?.usageSummary?.totalRuns ?? 0 },
            { label: 'Cloud Storage Used', value: `${analytics?.totalStorageGb ?? 0} GB` }
          ].map((stat, idx) => (
            <div key={idx} className="bg-[#11161D] border border-slate-800 rounded-xl p-4">
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">{stat.label}</div>
              <div className="text-xl font-extrabold text-white font-mono tabular-nums mt-1">{stat.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Flagship & Searchable Multi-Tenant Directory */}
      <section id="cloud-directory" className="px-4 sm:px-6 pb-14 max-w-7xl w-full mx-auto space-y-5">
        <div className="bg-[#11161D] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
              <img
                src={flagshipTenant.logoUrl || '/logo.png'}
                alt={flagshipTenant.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-amber-400">
                Reference Flagship Tenant #001 &middot; v{flagshipTenant.publishedVersion || 1}.0 &middot; {flagshipTenant.planCode}
              </div>
              <div className="text-base font-bold text-white">{flagshipTenant.name}</div>
              <div className="text-xs text-slate-400">
                Live operational headquarters with BOQ Revision Tree, AI CAD Takeoffs, Eurocode Calcs &amp; Document Studio
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={loadLiveSaaSData}
              disabled={loadingLive}
              className="p-2.5 bg-[#0B0F14] hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800"
              title="Refresh live Neon directory"
            >
              <RefreshCw className={`w-4 h-4 ${loadingLive ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onEnterFlagshipTenant}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
            >
              Enter Flagship Workspace &rarr;
            </button>
          </div>
        </div>

        {/* Searchable Published Tenants Grid */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-white">
              Published Company Workspaces ({filteredTenants.length})
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search company, domain or plan..."
                value={tenantSearch}
                onChange={e => setTenantSearch(e.target.value)}
                className="w-full bg-[#11161D] border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredTenants.map(t => (
              <div
                key={t.id}
                className="bg-[#11161D] border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#0B0F14] border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                    {t.logoUrl ? (
                      <img
                        src={t.logoUrl}
                        alt={t.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{t.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono truncate">
                      {t.customDomain || t.primaryDomain} &middot; {t.planCode}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setStudioTenantId(t.id);
                      setWorkbenchTab('whitelabel');
                      document.getElementById('cloud-workbench')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-2.5 py-1.5 bg-[#0B0F14] hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg text-[11px] font-semibold"
                    title="Customize white-label portal"
                  >
                    Brand
                  </button>
                  <button
                    type="button"
                    onClick={() => (onEnterTenant ? onEnterTenant(t) : onEnterFlagshipTenant())}
                    className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 rounded-lg text-[11px] font-bold flex items-center gap-1"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* REAL INTERACTIVE CONSTRUCTION CLOUD ENGINEERING WORKBENCH */}
      <section id="cloud-workbench" className="px-4 sm:px-6 py-14 bg-[#11161D] border-y border-slate-800">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
                Production Engineering Workbench &middot; Zero Simulated Data
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Execute Live Engineering Computations &amp; White-Label Provisioning
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setWorkbenchTab('takeoff')}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  workbenchTab === 'takeoff'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-[#0B0F14] text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>AI CAD &amp; Drawing Takeoff</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkbenchTab('eurocode')}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  workbenchTab === 'eurocode'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-[#0B0F14] text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Calculator className="w-4 h-4" />
                <span>Eurocode 2 (EN 1992) Studio</span>
              </button>
              <button
                type="button"
                onClick={() => setWorkbenchTab('whitelabel')}
                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 ${
                  workbenchTab === 'whitelabel'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-[#0B0F14] text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>White-Label Portal Studio</span>
              </button>
            </div>
          </div>

          {/* WORKBENCH TAB 1: REAL CAD DXF / SVG / GEMINI 4 VISION TAKEOFF */}
          {workbenchTab === 'takeoff' && (
            <div className="grid lg:grid-cols-12 gap-6">
              <form onSubmit={handleRunTakeoff} className="lg:col-span-5 bg-[#0B0F14] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    <span>Upload CAD / Blueprint Plan</span>
                  </h3>
                  <button
                    type="button"
                    onClick={handleLoadSampleDxf}
                    className="text-[11px] font-mono text-amber-400 hover:underline"
                  >
                    Load Valid 18x12m .DXF
                  </button>
                </div>

                <label className="block border border-dashed border-slate-700 hover:border-amber-500/70 rounded-xl p-4 text-center cursor-pointer bg-[#11161D]">
                  <input
                    type="file"
                    accept=".dxf,.svg,.pdf,image/*"
                    onChange={handleDrawingFileSelect}
                    className="hidden"
                  />
                  <div className="text-xs font-semibold text-white">
                    {drawingName || 'Choose .DXF, .SVG, .PDF or Blueprint Image'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    DXF &amp; SVG parse deterministically via geometry coordinates; raster plans analyze via Gemini Vision AI.
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Project Name</label>
                    <input
                      type="text"
                      value={takeoffProjectName}
                      onChange={e => setTakeoffProjectName(e.target.value)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Client / Firm</label>
                    <input
                      type="text"
                      value={takeoffClientName}
                      onChange={e => setTakeoffClientName(e.target.value)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Cameroon Price Region</label>
                    <select
                      value={takeoffRegion}
                      onChange={e => setTakeoffRegion(e.target.value as any)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="CENTRE_YAOUNDE">Centre — Yaoundé</option>
                      <option value="LITTORAL_DOUALA">Littoral — Douala</option>
                      <option value="NORTH_GAROUA">North — Garoua</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-1">Storeys</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={takeoffStoreys}
                        onChange={e => setTakeoffStoreys(Number(e.target.value))}
                        className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Scale</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        value={takeoffScale}
                        onChange={e => setTakeoffScale(Number(e.target.value))}
                        className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={takeoffSaveDb}
                    onChange={e => setTakeoffSaveDb(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>Persist takeoff record to Neon PostgreSQL (`drawing_takeoffs`)</span>
                </label>

                {takeoffError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    {takeoffError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={takeoffLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                >
                  {takeoffLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                  <span>{takeoffLoading ? 'Parsing Drawing & Computing BOQ...' : 'Extract Quantities & Price BOQ'}</span>
                </button>
              </form>

              <div className="lg:col-span-7 bg-[#0B0F14] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                {!takeoffResult ? (
                  <div className="text-center py-14 space-y-2">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-300">Ready for Deterministic CAD / AI Extraction</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Upload a `.dxf`, `.svg`, `.pdf`, or blueprint image (or load the 18m x 12m valid DXF plan) to generate real element geometry and Neon regional BOQ totals.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <div className="text-[11px] font-mono text-emerald-400">
                          {takeoffResult.engineSource} &middot; {takeoffResult.confidence}% Confidence
                        </div>
                        <div className="text-sm font-bold text-white">
                          Ref: {takeoffResult.takeoffRef} {takeoffResult.savedTakeoffId ? `(Saved ID #${takeoffResult.savedTakeoffId})` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleExportTakeoffCsv}
                        className="px-3 py-1.5 bg-[#11161D] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-amber-400 flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Export BOQ CSV</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono tabular-nums">
                      <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">FOOTPRINT / GFA</div>
                        <div className="text-white font-bold mt-0.5">{takeoffResult.metrics?.grossFloorAreaM2} m&sup2;</div>
                      </div>
                      <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">CONCRETE C25/30</div>
                        <div className="text-white font-bold mt-0.5">{takeoffResult.materialsSummary?.totalConcreteM3} m&sup3;</div>
                      </div>
                      <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">CEMENT / REBAR</div>
                        <div className="text-white font-bold mt-0.5">
                          {takeoffResult.materialsSummary?.cementBags50kg} bags &middot; {takeoffResult.materialsSummary?.rebarTonnes}t
                        </div>
                      </div>
                      <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">EST. STRUCTURAL COST</div>
                        <div className="text-amber-400 font-bold mt-0.5">
                          {Number(takeoffResult.totalEstimatedXaf || 0).toLocaleString('fr-FR')} XAF
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-800 rounded-lg">
                      <table className="w-full text-left text-xs font-mono tabular-nums">
                        <thead className="bg-[#11161D] text-slate-400 text-[10px] uppercase">
                          <tr>
                            <th className="p-2.5">Code</th>
                            <th className="p-2.5">Trade &amp; Scope</th>
                            <th className="p-2.5 text-right">Qty</th>
                            <th className="p-2.5 text-right">Rate (XAF)</th>
                            <th className="p-2.5 text-right">Total (XAF)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {(takeoffResult.boqItems || []).map((row: any) => (
                            <tr key={row.code} className="text-slate-200">
                              <td className="p-2.5 text-amber-400 font-bold">{row.code}</td>
                              <td className="p-2.5 font-sans">
                                <div className="font-semibold text-white">{row.trade}</div>
                                <div className="text-[11px] text-slate-400">{row.description}</div>
                              </td>
                              <td className="p-2.5 text-right">{row.quantity} {row.unit}</td>
                              <td className="p-2.5 text-right">{Number(row.unitRateXaf).toLocaleString('fr-FR')}</td>
                              <td className="p-2.5 text-right text-emerald-400 font-bold">{Number(row.totalXaf).toLocaleString('fr-FR')}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WORKBENCH TAB 2: EUROCODE 2 (EN 1992-1-1) STRUCTURAL SOLVER */}
          {workbenchTab === 'eurocode' && (
            <div className="grid lg:grid-cols-12 gap-6">
              <form onSubmit={handleRunEurocode} className="lg:col-span-5 bg-[#0B0F14] border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-amber-400" />
                  <span>EN 1992-1-1 Design Parameters</span>
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Structural Element</label>
                    <select
                      value={ecElement}
                      onChange={e => setEcElement(e.target.value as any)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="BEAM">RC Beam (Flexure &amp; Shear)</option>
                      <option value="COLUMN">RC Column (Axial ULS)</option>
                      <option value="SLAB">One-Way RC Slab (1m Strip)</option>
                      <option value="FOOTING">Isolated Pad Footing</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Concrete / Steel</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={ecConcrete}
                        onChange={e => setEcConcrete(e.target.value as any)}
                        className="bg-[#11161D] border border-slate-700 rounded-lg px-2 py-2 text-white font-mono"
                      >
                        <option value="C20/25">C20/25</option>
                        <option value="C25/30">C25/30</option>
                        <option value="C30/37">C30/37</option>
                        <option value="C35/45">C35/45</option>
                      </select>
                      <select
                        value={ecSteel}
                        onChange={e => setEcSteel(e.target.value as any)}
                        className="bg-[#11161D] border border-slate-700 rounded-lg px-2 py-2 text-white font-mono"
                      >
                        <option value="FeE500">FeE500</option>
                        <option value="FeE400">FeE400</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Width b (mm)</label>
                    <input type="number" value={ecWidthMm} onChange={e => setEcWidthMm(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Depth / Thickness h (mm)</label>
                    <input type="number" value={ecDepthMm} onChange={e => setEcDepthMm(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Span / Height (m)</label>
                    <input type="number" step="0.1" value={ecSpanM} onChange={e => setEcSpanM(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Cover c_nom (mm)</label>
                    <input type="number" value={ecCoverMm} onChange={e => setEcCoverMm(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                  </div>

                  {(ecElement === 'BEAM' || ecElement === 'SLAB') ? (
                    <>
                      <div>
                        <label className="text-slate-400 block mb-1">Moment M_Ed (kNm)</label>
                        <input type="number" value={ecMomentKnm} onChange={e => setEcMomentKnm(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Shear V_Ed (kN)</label>
                        <input type="number" value={ecShearKn} onChange={e => setEcShearKn(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="text-slate-400 block mb-1">Axial Load N_Ed (kN)</label>
                        <input type="number" value={ecAxialKn} onChange={e => setEcAxialKn(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                      </div>
                      {ecElement === 'FOOTING' && (
                        <div>
                          <label className="text-slate-400 block mb-1">Soil Bearing q_allow (kPa)</label>
                          <input type="number" value={ecSoilBearingKpa} onChange={e => setEcSoilBearingKpa(Number(e.target.value))} className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono" />
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Calculation Note Title</label>
                  <input
                    type="text"
                    value={ecProjectName}
                    onChange={e => setEcProjectName(e.target.value)}
                    className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ecSaveDb}
                    onChange={e => setEcSaveDb(e.target.checked)}
                    className="rounded border-slate-700"
                  />
                  <span>Archive calculation note in Neon PostgreSQL (`structural_projects`)</span>
                </label>

                {ecError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    {ecError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={ecLoading}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                >
                  {ecLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{ecLoading ? 'Solving EN 1992...' : 'Solve & Verify Eurocode 2'}</span>
                </button>
              </form>

              <div className="lg:col-span-7 bg-[#0B0F14] border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                {!ecResult ? (
                  <div className="text-center py-14 space-y-2">
                    <Layers className="w-8 h-8 text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-slate-300">EN 1992-1-1 Verification Output</div>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Submit section dimensions and design forces to compute exact f_cd, f_yd, required steel area A_s, rebar detailing, and downloadable A4 calculation notes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                      <div>
                        <div className="text-[11px] font-mono text-amber-400">{ecResult.standard}</div>
                        <div className="text-sm font-bold text-white">
                          {ecResult.projectCode} {ecResult.savedProjectId ? `(Saved Project #${ecResult.savedProjectId})` : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                            String(ecResult.checks?.status).startsWith('PASS')
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {ecResult.checks?.status}
                        </span>
                        <button
                          type="button"
                          onClick={handleDownloadEurocodePdf}
                          className="px-3 py-1.5 bg-[#11161D] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-amber-400 flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>A4 Calc Note PDF</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
                      <div className="bg-[#11161D] p-3.5 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">MATERIAL DESIGN</div>
                        <div className="text-white font-bold mt-1">f_cd = {ecResult.materials?.fcdMpa} MPa</div>
                        <div className="text-slate-300 mt-0.5">f_yd = {ecResult.materials?.fydMpa} MPa</div>
                      </div>
                      <div className="bg-[#11161D] p-3.5 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">REINFORCEMENT DETAILING</div>
                        <div className="text-amber-400 font-bold mt-1">{ecResult.reinforcement?.arrangement}</div>
                        <div className="text-slate-300 mt-0.5">
                          {ecResult.reinforcement?.stirrupSpec || ecResult.reinforcement?.linksArrangement || 'Biaxial Pad Mesh'}
                        </div>
                      </div>
                      <div className="bg-[#11161D] p-3.5 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400">STEEL AREA &amp; MASS</div>
                        <div className="text-white font-bold mt-1">
                          A_s,prov: {ecResult.reinforcement?.asProvidedMm2 ?? ecResult.reinforcement?.asRequiredMm2PerM} mm&sup2;
                        </div>
                        <div className="text-emerald-400 mt-0.5">Mass: {ecResult.reinforcement?.steelWeightKg} kg</div>
                      </div>
                    </div>

                    <pre className="p-3.5 rounded-lg bg-[#11161D] border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                      {JSON.stringify({ checks: ecResult.checks, section: ecResult.section }, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* WORKBENCH TAB 3: WHITE-LABEL COMPANY PORTAL STUDIO */}
          {workbenchTab === 'whitelabel' && (
            <div className="grid lg:grid-cols-12 gap-6">
              <form onSubmit={handleSaveWhiteLabel} className="lg:col-span-5 bg-[#0B0F14] border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <span>Live White-Label Customizer</span>
                  </h3>
                  <select
                    value={studioTenantId}
                    onChange={e => setStudioTenantId(Number(e.target.value))}
                    className="bg-[#11161D] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    {publishedTenants.map(t => (
                      <option key={t.id} value={t.id}>
                        #{t.id} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Company Display Name</label>
                    <input
                      type="text"
                      required
                      value={studioBrandName}
                      onChange={e => setStudioBrandName(e.target.value)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-400 block mb-1">Portal Tagline</label>
                    <input
                      type="text"
                      value={studioTagline}
                      onChange={e => setStudioTagline(e.target.value)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Primary Accent Hex</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={studioPrimaryColor}
                        onChange={e => setStudioPrimaryColor(e.target.value)}
                        className="w-9 h-9 rounded bg-transparent border border-slate-700 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={studioPrimaryColor}
                        onChange={e => setStudioPrimaryColor(e.target.value)}
                        className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-2.5 py-2 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Custom Portal Domain</label>
                    <input
                      type="text"
                      value={studioDomain}
                      onChange={e => setStudioDomain(e.target.value)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Support Phone</label>
                    <input
                      type="text"
                      value={studioPhone}
                      onChange={e => setStudioPhone(e.target.value)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Contact Email</label>
                    <input
                      type="email"
                      value={studioEmail}
                      onChange={e => setStudioEmail(e.target.value)}
                      className="w-full bg-[#11161D] border border-slate-700 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <label className="cursor-pointer px-3 py-2 bg-[#11161D] hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>{studioLogoProgress || 'Upload Company Logo'}</span>
                    <input type="file" accept="image/*" onChange={handleStudioLogoUpload} className="hidden" />
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      selectedStudioTenant &&
                      (onEnterTenant ? onEnterTenant(selectedStudioTenant) : onEnterFlagshipTenant())
                    }
                    className="text-xs text-amber-400 hover:underline font-semibold"
                  >
                    Open Active Portal &rarr;
                  </button>
                </div>

                {studioNotice && (
                  <div
                    className={`p-3 rounded-lg text-xs border ${
                      studioNotice.isError
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    {studioNotice.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={studioSaving}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                >
                  {studioSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>{studioSaving ? 'Saving & Republishing...' : 'Save & Republish Live to Neon'}</span>
                </button>
              </form>

              {/* Live White-Label Client Storefront Preview */}
              <div className="lg:col-span-7 bg-[#0B0F14] border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="px-4 py-2.5 bg-[#161C24] border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>LIVE TENANT CLIENT PREVIEW</span>
                  <span>https://{studioDomain || 'portal.madeccgroup.online'}</span>
                </div>
                <div className="p-6 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-lg bg-[#11161D] border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                        <img
                          src={studioLogoUrl || '/logo.png'}
                          alt={studioBrandName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-white text-base">{studioBrandName || 'Company Workspace'}</div>
                        <div className="text-xs text-slate-400">{studioDomain || 'custom-domain.cm'}</div>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950"
                      style={{ backgroundColor: studioPrimaryColor }}
                    >
                      Request Quote
                    </span>
                  </div>

                  <div className="space-y-2 py-4">
                    <div className="text-[11px] font-mono uppercase tracking-wider" style={{ color: studioPrimaryColor }}>
                      White-Label Contracting Portal
                    </div>
                    <h4 className="text-2xl font-black text-white">{studioBrandName} Engineering Cloud</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{studioTagline}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs pt-4 border-t border-slate-800">
                    <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Active Plan</div>
                      <div className="text-white font-mono font-bold mt-0.5">{selectedStudioTenant?.planCode}</div>
                    </div>
                    <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Direct Phone</div>
                      <div className="text-white font-mono font-bold mt-0.5 truncate">{studioPhone}</div>
                    </div>
                    <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                      <div className="text-slate-400">Client Desk</div>
                      <div className="text-white font-mono font-bold mt-0.5 truncate">{studioEmail}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pricing & Complete Feature Comparison Matrix */}
      <section id="cloud-pricing" className="px-4 sm:px-6 py-16 max-w-7xl w-full mx-auto space-y-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
              Transparent Commercial SaaS Licensing
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Choose Your Construction Cloud Tier
            </h2>
            <p className="text-slate-400 text-sm max-w-xl">
              Direct activation via MTN MoMo, Orange Money, or bank wire. Annual subscriptions include two months free.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex items-center bg-[#11161D] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                  billingCycle === 'MONTHLY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold ${
                  billingCycle === 'ANNUAL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Annual (2 Mos Free)
              </button>
            </div>

            <button
              onClick={handleDownloadPricingCsv}
              className="px-3 py-2 bg-[#11161D] hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleDownloadBrochurePdf}
              className="px-3 py-2 bg-[#11161D] hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>PDF Brochure</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-[#11161D] hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Tier Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(p => {
            const price = billingCycle === 'MONTHLY' ? p.monthlyPrice : p.annualPrice;
            return (
              <div
                key={p.code}
                className={`bg-[#11161D] border rounded-2xl p-7 flex flex-col justify-between ${
                  p.isPopular ? 'border-amber-500' : 'border-slate-800'
                }`}
              >
                <div className="space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] uppercase text-amber-400">{p.code}</span>
                      {p.isPopular && <span className="text-[11px] font-bold text-amber-300">Most Popular</span>}
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  </div>

                  <div>
                    <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
                      {SubscriptionService.formatPrice(price, p.currency || 'XAF')}
                    </div>
                    <span className="text-xs text-slate-400">
                      per {billingCycle === 'MONTHLY' ? 'month' : 'year'}
                    </span>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
                    {p.features?.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-7">
                  <button
                    onClick={() => onOpenOnboarding(p.code as PlanCode, billingCycle)}
                    className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 ${
                      p.isPopular
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Select {p.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Structured Quota & Feature Comparison Matrix */}
        <div className="bg-[#11161D] border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Enterprise Quota &amp; Engineering Matrix</h3>
            <span className="text-[11px] font-mono text-slate-400">Live Neon Tier Specifications</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F14] text-slate-400 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Capability / Resource Quota</th>
                  {plans.map(p => (
                    <th key={p.code} className="p-3.5 text-white">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono tabular-nums">
                <tr>
                  <td className="p-3.5 font-sans font-semibold text-white">Authorized Team Users</td>
                  {plans.map(p => <td key={p.code} className="p-3.5">{p.maxUsers === -1 ? 'Unlimited' : p.maxUsers}</td>)}
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-semibold text-white">Active Construction Projects</td>
                  {plans.map(p => <td key={p.code} className="p-3.5">{p.maxProjects === -1 ? 'Unlimited' : p.maxProjects}</td>)}
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-semibold text-white">Dedicated Cloud Storage</td>
                  {plans.map(p => <td key={p.code} className="p-3.5">{p.maxStorageGb} GB</td>)}
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-semibold text-white">Monthly AI Takeoff Credits</td>
                  {plans.map(p => <td key={p.code} className="p-3.5">{p.aiCreditsMonthly.toLocaleString('fr-FR')}</td>)}
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-semibold text-white">EN 1992 Eurocode 2 Studio</td>
                  {plans.map(p => <td key={p.code} className="p-3.5 text-emerald-400">Included</td>)}
                </tr>
                <tr>
                  <td className="p-3.5 font-sans font-semibold text-white">White-Label Custom Domain</td>
                  {plans.map(p => (
                    <td key={p.code} className="p-3.5">
                      {p.code === 'STARTER' ? 'Subdomain' : <span className="text-emerald-400">Custom SSL Domain</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#0B0F14] py-10 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">MADECC Construction Cloud</span>
            <span>&copy; {new Date().getFullYear()} MADECC GROUP S.A.R.L.</span>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <button onClick={onOpenSuperAdmin} className="text-amber-400 hover:underline font-semibold">
              SaaS Super Admin
            </button>
            <button onClick={onEnterFlagshipTenant} className="hover:text-white">
              Flagship Showcase
            </button>
            <button onClick={() => onOpenOnboarding('PROFESSIONAL', billingCycle)} className="hover:text-white">
              Tenant Registration
            </button>
            <button onClick={() => setShowShareModal(true)} className="hover:text-white">
              Share Pricing
            </button>
          </div>
        </div>
      </footer>

      {/* Modal: Share SaaS Brochure via SMTP */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#11161D] border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Share MADECC Construction Cloud</span>
              </h3>
              <button onClick={() => setShowShareModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-[#0B0F14] p-2.5 rounded-lg border border-slate-800 text-xs">
              <span className="truncate font-mono text-slate-300 flex-1">
                {typeof window !== 'undefined' ? `${window.location.origin}/?tab=saas` : 'https://madeccgroup.online/?tab=saas'}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${window.location.origin}/?tab=saas`);
                  setCopiedUrl(true);
                  setTimeout(() => setCopiedUrl(false), 2000);
                }}
                className="px-2.5 py-1 bg-slate-800 text-amber-400 rounded font-semibold flex items-center gap-1"
              >
                {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <form onSubmit={handleShareViaSmtp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Recipient Email Address</label>
                <input
                  type="email"
                  required
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                  placeholder="director@contractor-firm.com"
                  className="w-full bg-[#0B0F14] border border-slate-700 text-white rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Optional Note</label>
                <textarea
                  rows={2}
                  value={shareNote}
                  onChange={e => setShareNote(e.target.value)}
                  placeholder="Recommended engineering ERP & BOQ workspace..."
                  className="w-full bg-[#0B0F14] border border-slate-700 text-white rounded-lg p-2.5"
                />
              </div>
              {shareStatus && (
                <div
                  className={`p-2.5 rounded-lg text-xs border ${
                    shareStatus.isError
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  }`}
                >
                  {shareStatus.text}
                </div>
              )}
              <button
                type="submit"
                disabled={sharing}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sharing ? 'Dispatching via SMTP...' : 'Send Pricing & Link via Email'}</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
