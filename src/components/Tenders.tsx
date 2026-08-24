import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Send, 
  X, 
  Eye, 
  Sparkles, 
  Upload, 
  ShieldCheck, 
  ChevronRight,
  Briefcase,
  Layers,
  Award,
  Phone,
  Mail,
  HelpCircle,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { exportTenderNoticePDF, exportTenderNoticeDOCX } from '../lib/exportEngine.ts';

interface Tender {
  id: number;
  tenderNumber: string;
  title: string;
  slug: string;
  categoryName: string;
  clientProject: string;
  location: string;
  description: string;
  scopeOfWork: string;
  eligibility: string;
  requiredExperience?: string;
  requiredDocuments?: string;
  submissionMethod?: string;
  openingDate: string;
  closingDate: string;
  status: 'OPEN' | 'CLOSING_SOON' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
  contactInstructions?: string;
  attachments?: { title: string; fileUrl: string; fileType?: string }[];
}

interface Props {
  onNavigateToTab?: (tab: string, state?: any) => void;
}

export const Tenders: React.FC<Props> = ({ onNavigateToTab }) => {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Tender for Modal Detail
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);

  // Expression of Interest (EOI) Modal
  const [eoiModalOpen, setEoiModalOpen] = useState(false);
  const [eoiCompany, setEoiCompany] = useState('');
  const [eoiContact, setEoiContact] = useState('');
  const [eoiEmail, setEoiEmail] = useState('');
  const [eoiPhone, setEoiPhone] = useState('');
  const [eoiStatement, setEoiStatement] = useState('');
  const [eoiDocs, setEoiDocs] = useState<{ title: string; fileUrl: string }[]>([]);
  const [uploadingEoi, setUploadingEoi] = useState(false);
  const [submittingEoi, setSubmittingEoi] = useState(false);
  const [eoiSuccess, setEoiSuccess] = useState<string | null>(null);
  const [eoiError, setEoiError] = useState('');

  const defaultTenders: Tender[] = [
    {
      id: 1,
      tenderNumber: 'TND-2026-MDCC-001',
      title: 'Subcontract Supply & Erection of Structural Steel Framing for Commercial Complex',
      slug: 'structural-steel-framing-douala',
      categoryName: 'Structural Works',
      clientProject: 'Douala Commercial Hub Phase II',
      location: 'Douala, Littoral Region',
      description: 'MADECC is calling for Expressions of Interest (EOI) from certified structural steel fabrication subcontractors for the supply, galvanization, transport, and site erection of 350 Metric Tons of structural steel framework.',
      scopeOfWork: 'Detailed workshop fabrication drawings, precision CNC steel cutting and welding, anti-corrosion shop primer coating, transport to project site, crane hoisting, and high-strength bolted assembly.',
      eligibility: 'Subcontractors must possess proven technical capacity with minimum 5 years in heavy structural steel works in CEMAC, valid tax compliance certificate, and ISO/HSE safety qualification.',
      requiredExperience: 'Minimum 3 completed structural steel contracts exceeding 100 Tons in Central Africa within the last 5 years.',
      requiredDocuments: 'Company Registration, Tax Clearance, Past Contract Certificates, Key Staff CVs, HSE Policy, Audited Financial Statements.',
      submissionMethod: 'Online EOI Dossier Submission via MADECC Portal or physical submission at MADECC Head Office (Douala / Yaoundé Mbankolo, Cameroon).',
      openingDate: '2026-08-11',
      closingDate: '2026-09-10',
      status: 'OPEN',
      contactInstructions: 'For tender clarifications, contact procurement@madeccgroup.com or call +237 683 316 486.'
    },
    {
      id: 2,
      tenderNumber: 'TND-2026-MDCC-002',
      title: 'Procurement & Scheduled Delivery of CEM II 42.5R High-Grade Portland Cement (Bulk Supply)',
      slug: 'bulk-cement-supply-yaounde-kribi',
      categoryName: 'Materials Supply',
      clientProject: 'Yaoundé Residential Estate & Kribi Logistics Base',
      location: 'Yaoundé & Kribi',
      description: 'Prequalification tender for national building material manufacturers and accredited distributors to supply 15,000 bags (50kg) and 1,200 metric tons of bulk high-early-strength CEM II 42.5R Portland Cement.',
      scopeOfWork: '1. Phased scheduled delivery to active MADECC staging yards in Yaoundé and Kribi.\n2. Continuous laboratory test certificates for each production batch guaranteeing 28-day compressive strength ≥ 42.5 MPa.\n3. Weatherproof palletized transport and offloading on site.',
      eligibility: 'Authorized cement manufacturing plants or primary registered building materials distributors in Cameroon with adequate fleet logistics.',
      requiredExperience: 'Demonstrated continuous bulk supply capacity of at least 500 tons per month.',
      requiredDocuments: 'Manufacturer Authorization Letter, RCCM, NIU Tax ID, Quality Lab Accreditations.',
      openingDate: '2026-08-11',
      closingDate: '2026-09-15',
      status: 'CLOSING_SOON',
      contactInstructions: 'Procurement desk hotline: +237 683 316 486.'
    },
    {
      id: 3,
      tenderNumber: 'TND-2026-MDCC-003',
      title: 'Geotechnical Soil Investigation, Rotary Core Drilling & Plate Load Testing',
      slug: 'geotechnical-investigation-littoral',
      categoryName: 'Engineering & Geotechnics',
      clientProject: 'Kribi Industrial Corridor Deep Foundation Project',
      location: 'Kribi, South Region',
      description: 'MADECC Group is seeking certified geotechnical testing laboratories to conduct rotary core drilling to 35-meter depths, Standard Penetration Tests (SPT), dynamic cone penetrometer soundings, and laboratory soil mechanics analysis.',
      scopeOfWork: '1. 8 exploratory boreholes to 35m depth with continuous core recovery.\n2. In-situ SPT testing at 1.5m intervals and groundwater level monitoring.\n3. Laboratory Triaxial, Oedometer consolidation, and Atterberg limits testing.\n4. Comprehensive Geotechnical Factual and Interpretative Engineering Report with safe bearing capacity recommendations.',
      eligibility: 'Accredited geotechnical engineering firms with owned drilling rigs and certified soil laboratory.',
      requiredExperience: 'Minimum 5 years of geotechnical investigation in coastal and alluvial geology of Cameroon.',
      requiredDocuments: 'Accreditation certificates, drill rig specifications, Lead Geotechnical Engineer CV.',
      openingDate: '2026-02-15',
      closingDate: '2026-04-10',
      status: 'OPEN',
      contactInstructions: 'Email bids to kreboya603@gmail.com with subject: EOI - Geotechnical Investigation Kribi.'
    }
  ];

  useEffect(() => {
    // 1. Fetch live tenders from backend API
    fetch('/api/public/tenders')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.tenders) && data.tenders.length > 0) {
          const serverList: Tender[] = data.tenders.map((t: any, idx: number) => ({
            ...t,
            id: t.id ? Number(t.id) : (idx + 1)
          }));
          let nextId = Math.max(...serverList.map(m => m.id), 0) + 1;
          const merged: Tender[] = [...serverList];
          defaultTenders.forEach(dt => {
            if (!merged.some(m => m.tenderNumber === dt.tenderNumber)) {
              merged.push({
                ...dt,
                id: nextId++
              });
            }
          });
          setTenders(merged);
          const cats = Array.from(new Set(merged.map((t: Tender) => t.categoryName))) as string[];
          setCategories(['All', ...cats]);
        } else {
          loadFallbackTenders();
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Using enriched fallback tender notices:', err);
        loadFallbackTenders();
        setLoading(false);
      });

    // 2. Inject ItemList / WebPage JSON-LD Structured Data
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'tenders-schema';
    schemaScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      'name': 'MADECC Group Tenders & Procurement Opportunities',
      'description': 'Public procurement, subcontracting, and materials supply tender notices by MADECC Group.',
      'itemListElement': defaultTenders.map((t, idx) => ({
        '@type': 'ListItem',
        'position': idx + 1,
        'item': {
          '@type': 'Thing',
          'name': t.title,
          'identifier': t.tenderNumber,
          'description': t.description,
          'location': t.location
        }
      }))
    });
    document.head.appendChild(schemaScript);

    return () => {
      const existing = document.getElementById('tenders-schema');
      if (existing) existing.remove();
    };
  }, []);

  const loadFallbackTenders = () => {
    setTenders(defaultTenders);
    const cats = Array.from(new Set(defaultTenders.map(t => t.categoryName)));
    setCategories(['All', ...cats]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingEoi(true);
    setEoiError('');
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/public/upload', { method: 'POST', body: formData });
      const data = await res.json();
      const uploadedUrl = data.fileUrl || data.url;
      if (uploadedUrl) {
        setEoiDocs(prev => [...prev, { 
          title: data.fileName || file.name, 
          fileUrl: uploadedUrl,
          fileName: data.fileName || file.name,
          fileType: data.fileType || file.type || 'application/pdf',
          fileSize: data.fileSize || file.size
        }]);
      } else {
        throw new Error(data.error || 'Upload returned no URL');
      }
    } catch (err: any) {
      console.error('File upload failed:', err);
      setEoiError('Failed to upload file. Please verify file format and size (max 50MB).');
    } finally {
      setUploadingEoi(false);
      e.target.value = '';
    }
  };

  const handleEoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTender) return;
    if (!eoiCompany || !eoiContact || !eoiEmail || !eoiPhone) {
      setEoiError('Please fill out all mandatory contact fields.');
      return;
    }

    setSubmittingEoi(true);
    setEoiError('');

    try {
      const res = await fetch(`/api/public/tenders/${selectedTender.id}/submit-interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderReference: selectedTender.tenderNumber,
          companyName: eoiCompany,
          contactPerson: eoiContact,
          email: eoiEmail,
          phone: eoiPhone,
          expressionOfInterest: eoiStatement,
          supportingDocuments: eoiDocs
        })
      });

      const data = await res.json();
      if (data.success) {
        setEoiSuccess(data.submissionNumber || `EOI-${Date.now().toString().slice(-6)}`);
      } else {
        throw new Error(data.error || 'Submission failed.');
      }
    } catch (err: any) {
      setEoiError(err.message || 'Failed to submit expression of interest.');
    } finally {
      setSubmittingEoi(false);
    }
  };

  const filteredTenders = tenders.filter(t => {
    const matchesCat = selectedCategory === 'All' || t.categoryName === selectedCategory;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      t.title.toLowerCase().includes(query) || 
      t.tenderNumber.toLowerCase().includes(query) || 
      t.location.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query);
    return matchesCat && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold">OPEN</span>;
      case 'CLOSING_SOON':
        return <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-bold">CLOSING SOON</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-mono">CLOSED</span>;
      default:
        return <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono">{status}</span>;
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      
      {/* HERO BANNER */}
      <section className="relative py-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6 flex justify-center">
            <ol className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <li>
                <button 
                  onClick={() => onNavigateToTab && onNavigateToTab('home')}
                  className="hover:text-amber-400 transition-colors"
                >
                  Home
                </button>
              </li>
              <li>/</li>
              <li className="text-amber-400 font-semibold" aria-current="page">
                Tenders & Procurement
              </li>
            </ol>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Briefcase className="w-4 h-4 text-amber-400" />
            <span>Procurement & Subcontracting Opportunities</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            MADECC Group Tenders & Procurement Opportunities
          </h1>

          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Public Expressions of Interest (EOI), trade subcontracting packages, and materials supply tenders across civil engineering projects in Cameroon.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              aria-label="Search tenders"
              placeholder="Search by tender reference, trade category, project title, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 shadow-xl"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* MAIN LISTINGS SECTION */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category & Status Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-800">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 scrollbar-none" role="tablist">
            {categories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={selectedCategory === cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {['ALL', 'OPEN', 'CLOSING_SOON', 'CLOSED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-slate-800 text-amber-400 border border-amber-500/40 font-bold'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

        {/* TENDER CARDS GRID */}
        {filteredTenders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No active tender notices match your query</h3>
            <p className="text-xs text-slate-400 mb-6 max-w-md mx-auto">
              No active tenders are currently published under this filter. Return to this portal for future procurement opportunities or submit a general supplier prequalification.
            </p>
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('suppliers')}
                className="px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 cursor-pointer shadow-md"
                id="supplier-prequalification-btn"
              >
                Register as Supplier / Subcontractor
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenders.map((tender) => (
              <div 
                key={tender.id}
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                id={`tender-card-${tender.id}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                      {tender.tenderNumber}
                    </span>
                    {getStatusBadge(tender.status)}
                  </div>

                  <h3 className="text-base font-bold text-white mb-2 leading-snug">
                    {tender.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                    {tender.description}
                  </p>

                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 mb-6">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{tender.location}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span className="truncate">{tender.clientProject}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Closes: {tender.closingDate ? new Date(tender.closingDate).toLocaleDateString() : 'Open'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded truncate max-w-[120px]">
                    {tender.categoryName}
                  </span>

                  <button
                    onClick={() => setSelectedTender(tender)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    id={`view-tender-${tender.id}-btn`}
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Opportunity</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROCUREMENT TRANSPARENCY NOTICE */}
        <div className="mt-16 p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase">
              <ShieldCheck className="w-4 h-4" />
              <span>MADECC Group Fair Procurement Policy</span>
            </div>
            <h2 className="text-xl font-bold text-white">Ethical, Transparent & Competitive Tendering</h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              All bids are evaluated by our Independent Technical Evaluation Committee based strictly on technical competence, quality assurance, safety compliance (QHSE), and financial value. MADECC maintains zero tolerance for corrupt practices.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('faq')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 cursor-pointer"
                id="tenders-faq-link-btn"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Tenders FAQ</span>
              </button>
            )}
            <a
              href="mailto:procurement@madeccgroup.com"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Mail className="w-4 h-4" />
              <span>Procurement Desk</span>
            </a>
          </div>
        </div>

      </section>

      {/* TENDER DETAIL MODAL */}
      {selectedTender && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 relative shadow-2xl my-8">
            
            <button
              onClick={() => setSelectedTender(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-1"
              id="close-tender-detail-modal"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/30">
                {selectedTender.tenderNumber}
              </span>
              {getStatusBadge(selectedTender.status)}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
              {selectedTender.title}
            </h2>

            <p className="text-xs font-mono text-slate-400 mb-6">
              Client / Project: <strong className="text-slate-200">{selectedTender.clientProject}</strong> • Location: <strong className="text-slate-200">{selectedTender.location}</strong>
            </p>

            <div className="space-y-6 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-amber-400 mb-2">1. Overview & Project Context</h4>
                <p className="whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans">{selectedTender.description}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-amber-400 mb-2">2. Detailed Scope of Work</h4>
                <p className="whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans">{selectedTender.scopeOfWork}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-amber-400 mb-2">3. Eligibility & Technical Prequalification</h4>
                <p className="whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans">{selectedTender.eligibility}</p>
              </div>

              {selectedTender.requiredDocuments && (
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono text-amber-400 mb-2">4. Mandatory Supporting Documents</h4>
                  <p className="whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800 font-sans">{selectedTender.requiredDocuments}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block">Notice Opening Date</span>
                  <span className="text-white font-bold">{selectedTender.openingDate ? new Date(selectedTender.openingDate).toLocaleDateString() : 'Immediate'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Submission Deadline</span>
                  <span className="text-amber-400 font-bold">{selectedTender.closingDate ? new Date(selectedTender.closingDate).toLocaleDateString() : 'Open'}</span>
                </div>
              </div>

            </div>

            {/* ACTION FOOTER */}
            <div className="pt-6 mt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => exportTenderNoticePDF(selectedTender)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 cursor-pointer"
                  id="download-tender-pdf-btn"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>Notice PDF</span>
                </button>

                <button
                  onClick={() => exportTenderNoticeDOCX(selectedTender)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 cursor-pointer"
                  id="download-tender-docx-btn"
                >
                  <FileText className="w-4 h-4 text-amber-400" />
                  <span>Notice DOCX</span>
                </button>
              </div>

              {selectedTender.status !== 'CLOSED' && (
                <button
                  onClick={() => {
                    setEoiModalOpen(true);
                    setEoiSuccess(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  id="open-eoi-modal-btn"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Expression of Interest (EOI)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* EXPRESSION OF INTEREST (EOI) SUBMISSION MODAL */}
      {eoiModalOpen && selectedTender && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 relative shadow-2xl">
            
            <button
              onClick={() => setEoiModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              id="close-eoi-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-500" />
              <span>Submit Expression of Interest</span>
            </h3>
            <p className="text-xs font-mono text-amber-400 mb-6">
              Ref: {selectedTender.tenderNumber} — {selectedTender.title}
            </p>

            {eoiSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white mb-1">EOI Submitted Successfully!</h4>
                <p className="text-xs text-slate-300 mb-2">
                  Submission Code: <strong className="text-amber-400 font-mono">{eoiSuccess}</strong>
                </p>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  Our procurement evaluation committee has logged your company application file. We will contact your nominated representative upon shortlist review.
                </p>
                <button
                  onClick={() => {
                    setEoiModalOpen(false);
                    setSelectedTender(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleEoiSubmit} className="space-y-4">
                {eoiError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {eoiError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Company / Enterprise Name *</label>
                  <input 
                    type="text" 
                    required
                    value={eoiCompany}
                    onChange={(e) => setEoiCompany(e.target.value)}
                    placeholder="e.g. Cameroon Building Solutions SA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Contact Person *</label>
                    <input 
                      type="text" 
                      required
                      value={eoiContact}
                      onChange={(e) => setEoiContact(e.target.value)}
                      placeholder="e.g. Eng. Paul Nkou"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={eoiEmail}
                      onChange={(e) => setEoiEmail(e.target.value)}
                      placeholder="tender@company.cm"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Phone / WhatsApp *</label>
                  <input 
                    type="text" 
                    required
                    value={eoiPhone}
                    onChange={(e) => setEoiPhone(e.target.value)}
                    placeholder="+237 683 316 486"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Technical Capacity Summary</label>
                  <textarea
                    rows={3}
                    value={eoiStatement}
                    onChange={(e) => setEoiStatement(e.target.value)}
                    placeholder="Briefly state your technical capacity, available machinery, manpower, and similar executed contracts..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Attach Technical Dossier (PDF / ZIP)</label>
                  <label className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-300 text-xs font-medium cursor-pointer inline-flex items-center gap-2 transition-colors">
                    {uploadingEoi ? (
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 text-amber-400" />
                    )}
                    <span>{uploadingEoi ? 'Uploading Technical Dossier...' : 'Upload File'}</span>
                    <input 
                      type="file" 
                      accept=".pdf,.zip,.rar,.docx,.doc" 
                      disabled={uploadingEoi}
                      className="hidden" 
                      onChange={handleFileUpload} 
                    />
                  </label>

                  {eoiDocs.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {eoiDocs.map((doc, i) => (
                        <div key={i} className="flex items-center justify-between text-xs font-mono bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-emerald-400">
                          <div className="flex items-center gap-2 truncate max-w-[80%]">
                            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="truncate hover:underline text-slate-200">
                              {doc.title || doc.fileName}
                            </a>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEoiDocs(prev => prev.filter((_, idx) => idx !== i))}
                            className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                            title="Remove file"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEoiModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEoi}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
                    id="submit-eoi-btn"
                  >
                    {submittingEoi ? (
                      <span>Submitting EOI...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Confirm EOI Submission</span>
                      </>
                    )}
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
