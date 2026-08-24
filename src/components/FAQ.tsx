import React, { useState, useEffect } from 'react';
import { 
  Search, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  ArrowRight, 
  MessageSquare, 
  FileText, 
  Download, 
  Send, 
  Sparkles, 
  X,
  Phone,
  Mail,
  Building2,
  HardHat,
  ShieldCheck,
  Calculator,
  Compass,
  FileCheck
} from 'lucide-react';
import { exportFaqsPDF } from '../lib/exportEngine.ts';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  categoryName: string;
  tags?: string[];
  featured?: boolean;
  author?: string;
  relatedService?: string;
  relatedPage?: string;
}

interface FAQProps {
  onNavigateToTab?: (tab: string, state?: any) => void;
}

export const FAQ: React.FC<FAQProps> = ({ onNavigateToTab }) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIds, setOpenIds] = useState<number[]>([]);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal for asking a question
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askName, setAskName] = useState('');
  const [askEmail, setAskEmail] = useState('');
  const [askPhone, setAskPhone] = useState('');
  const [askCategory, setAskCategory] = useState('General');
  const [askQuestion, setAskQuestion] = useState('');
  const [submittingAsk, setSubmittingAsk] = useState(false);
  const [askSuccess, setAskSuccess] = useState(false);
  const [askError, setAskError] = useState('');

  const defaultFaqs: FAQItem[] = [
    // 1. General Category
    {
      id: 1,
      question: 'What is MADECC Group and where does the company operate?',
      answer: 'MADECC Group is a premier multi-disciplinary construction, civil engineering, and quantity surveying group headquartered in Yaoundé Mbankolo, Cameroon. We operate everywhere across the entire national territory of Cameroon (all 10 regions: Centre, Littoral, West, North-West, South-West, South, East, Adamawa, North, Far North) and across Africa. We deliver custom residential developments, commercial high-rises, industrial complexes, and public infrastructure projects.',
      categoryName: 'General',
      tags: ['company', 'location', 'yaounde', 'mbankolo', 'cameroon', 'africa'],
      featured: true
    },
    {
      id: 2,
      question: 'Does MADECC Group work with private residential clients as well as commercial developers?',
      answer: 'Yes. We cater to individual private homeowners, commercial real estate developers, industrial corporations, and public sector institutions. Whether building a custom duplex villa, an multi-unit apartment complex, a corporate headquarters, or an industrial logistics terminal, our engineering standards remain identical.',
      categoryName: 'General',
      tags: ['residential', 'commercial', 'developers', 'clients']
    },
    {
      id: 3,
      question: 'What engineering standards and building codes does MADECC Group adhere to?',
      answer: 'Our engineering calculations and structural designs adhere to Eurocode 2 (Design of concrete structures), BAEL 91 (Béton Armé aux États Limites), NF P standards, and local Cameroonian urban planning guidelines (MINDDU / MINMAP). All contract executions follow standard International Federation of Consulting Engineers (FIDIC) conditions.',
      categoryName: 'General',
      tags: ['eurocode', 'standards', 'fidic', 'quality', 'engineering'],
      featured: true
    },

    // 2. Construction Services
    {
      id: 4,
      question: 'What core construction and civil engineering services does MADECC provide?',
      answer: 'MADECC Group delivers end-to-end EPC (Engineering, Procurement, and Construction) services including:\n• Structural reinforced concrete framing and steel erection\n• Geotechnical soil testing and foundation design (shallow and deep piling)\n• Architectural planning and detailed MEP (Mechanical, Electrical, Plumbing) engineering\n• Earthworks, drainage infrastructure, and asphalt paving\n• Turnkey interior finishing, waterproofing, and acoustic engineering\n• On-site construction supervision and quality control auditing',
      categoryName: 'Construction Services',
      tags: ['services', 'epc', 'concrete', 'steel', 'earthworks'],
      relatedPage: 'services',
      featured: true
    },
    {
      id: 5,
      question: 'What is Concrete Mix Design and how does MADECC ensure concrete strength on site?',
      answer: 'Concrete Mix Design is the scientific formulation of water-cement ratios, sand grading, coarse aggregate sizing, and admixtures to achieve target compressive strengths (e.g. C25/30, C30/37). On every project site, we enforce standard slump tests, prepare standard 150mm test cubes, and perform 7-day and 28-day compression crush tests in accredited geotechnical laboratories to certify load-bearing capacity.',
      categoryName: 'Construction Services',
      tags: ['concrete', 'mix design', 'compression test', 'slump test']
    },
    {
      id: 6,
      question: 'How are reinforcement schedules (BBS) and structural steel elements managed?',
      answer: 'Our structural engineering team produces detailed Bar Bending Schedules (BBS) following BS 8666 / Eurocode 2. We specify high-yield deformed steel rebar (FeE500 / 500 MPa yield strength), precise hook lengths, lap splice lengths, and cover spacers to prevent corrosion and structural failure in coastal or humid regions like Douala.',
      categoryName: 'Construction Services',
      tags: ['reinforcement', 'bbs', 'rebar', 'structural steel']
    },
    {
      id: 7,
      question: 'What Quality, Health, Safety, and Environment (QHSE) protocols are enforced on site?',
      answer: 'MADECC Group enforces a strict Zero-Harm policy across all construction sites. All personnel must wear full certified PPE (hard hats, high-vis vests, steel-toe boots, eye protection). Sites maintain daily safety briefings (toolbox talks), perimeter safety netting, fall-arrest harnesses for height work, and strict compliance with environmental protection regulations (EIA guidelines).',
      categoryName: 'Construction Services',
      tags: ['qhse', 'safety', 'zero-harm', 'ppe', 'environment'],
      relatedPage: 'safety'
    },

    // 3. Cost & Estimation
    {
      id: 8,
      question: 'What is a Bill of Quantities (BOQ) and why is it essential before building?',
      answer: 'A Bill of Quantities (BOQ) is a comprehensive, itemized document prepared by a licensed Quantity Surveyor that measures and details every single item of material, labor, machinery, and preliminary required to execute a project. A professionally prepared BOQ prevents contractor price gouging, eliminates unexpected cost overruns, and provides a transparent basis for milestone payments.',
      categoryName: 'Cost & Estimation',
      tags: ['boq', 'quantity surveying', 'cost control', 'estimate'],
      relatedPage: 'construction-cost-guide',
      featured: true
    },
    {
      id: 9,
      question: 'What factors influence building construction costs per square metre in Cameroon?',
      answer: 'Key cost drivers include:\n• Foundation Type: Marshy or low-bearing capacity soils in Douala require raft foundations or micro-piles, increasing preliminary costs compared to rocky soils in Yaoundé or Bafoussam.\n• Material Price Volatility: Fluctuations in cement (CEM II 42.5R), structural steel rebar (FeE500), and aggregate transport costs.\n• Architectural Finishing Level: Standard economic finishing (180,000 - 250,000 FCFA/m²), Medium standard (260,000 - 380,000 FCFA/m²), or Premium luxury (400,000 - 650,000+ FCFA/m²).\n• Logistics & Site Access: Remote or unpaved access routes affect heavy plant delivery rates.',
      categoryName: 'Cost & Estimation',
      tags: ['cost per square meter', 'fcfa', 'budget', 'materials', 'douala', 'yaounde'],
      relatedPage: 'budget-calculator'
    },
    {
      id: 10,
      question: 'Why might a preliminary budget estimate differ from a final contractual quotation?',
      answer: 'A preliminary online budget estimate provides macro-level cost guidance based on floor area and finish category. A final binding contractual quotation requires geotechnical soil analysis, structural load calculations, topographical site survey, and final approved architectural/MEP drawings. This ensures every excavation depth, column dimension, and drainage gradient is accurately costed.',
      categoryName: 'Cost & Estimation',
      tags: ['quotation', 'preliminary estimate', 'accuracy', 'contracts']
    },

    // 4. Projects & Contracting
    {
      id: 11,
      question: 'How do I submit my architectural plans or project specifications to MADECC?',
      answer: 'You can submit project documents online through our "Request a Quote" portal, book a consultation via our "Schedule Consultation" tool, or email your files directly to kreboya603@gmail.com. We accept PDF, DWG, DXF, and IFC formats. Our quantity surveyors will review your submission and provide an engineering proposal within 24 to 48 business hours.',
      categoryName: 'Projects & Contracting',
      tags: ['submit project', 'request quote', 'drawings', 'blueprints'],
      relatedPage: 'request-a-quote',
      featured: true
    },
    {
      id: 12,
      question: 'How does MADECC structure project milestone billing and financial guarantees?',
      answer: 'All payments are structured in XAF (FCFA) based on verified physical milestones (e.g. 1. Earthworks & Substructure, 2. Superstructure Framing, 3. Roofing & Masonry, 4. MEP Rough-ins, 5. Architectural Finishes, 6. Practical Completion & Handover). Each valuation is certified with on-site photographic reports before invoice issuance.',
      categoryName: 'Projects & Contracting',
      tags: ['milestones', 'billing', 'payments', 'fcfa', 'guarantees']
    },
    {
      id: 13,
      question: 'How does the online Contract & Receipt Verification tool work?',
      answer: 'Every official contract, appointment notice, and payment receipt issued by MADECC Group includes a cryptographic verification token and secure QR code. Clients, financial institutions, and partners can enter the token into our "Verify Contract" portal to instantly validate document authenticity, signatory authority, and project status.',
      categoryName: 'Projects & Contracting',
      tags: ['verification', 'token', 'qr code', 'security', 'authenticity'],
      relatedPage: 'verify'
    },

    // 5. Technical Documents & Formats
    {
      id: 14,
      question: 'What document formats are supported for technical review and takeoff?',
      answer: 'We support all major industry formats:\n• CAD & BIM: AutoCAD (.DWG, .DXF), Revit / ArchiCAD (.IFC, .RVT), SketchUp (.SKP)\n• Documents & Specifications: Vector PDF, Microsoft Excel (.XLSX) for BoQ takeoffs, Word (.DOCX)\n• Visuals & Site Surveys: High-resolution JPG, PNG, and drone aerial orthomosaic surveys (.TIFF).',
      categoryName: 'Technical Documents',
      tags: ['cad', 'dwg', 'bim', 'pdf', 'dxf', 'formats']
    },
    {
      id: 15,
      question: 'How does MADECC ensure client intellectual property and blueprint confidentiality?',
      answer: 'All architectural drawings, cadastral plans, and financial specifications submitted to MADECC Group are protected under strict Non-Disclosure Protocols and encrypted cloud storage. Your plans are never shared with unauthorized third parties or published publicly without explicit written consent.',
      categoryName: 'Technical Documents',
      tags: ['confidentiality', 'nda', 'privacy', 'intellectual property']
    },

    // 6. Tenders & Subcontractors
    {
      id: 16,
      question: 'How can subcontractors and materials suppliers find MADECC tender opportunities?',
      answer: 'Active Requests for Proposals (RFPs), material supply contracts, and subcontracting opportunities are published on our public "Tenders" portal. Subcontractors and vendors can inspect eligibility criteria, download tender document packs, and submit Expressions of Interest (EOI) directly online.',
      categoryName: 'Tenders & Procurement',
      tags: ['tenders', 'procurement', 'rfp', 'subcontractors', 'vendors'],
      relatedPage: 'tenders',
      featured: true
    },
    {
      id: 17,
      question: 'What documentation is required from vendors submitting tender bids?',
      answer: 'Standard vendor pre-qualification requires:\n• Valid Trade Register Certificate (RCCM)\n• Taxpayer Identification Number (NIU / Attestation de Non-Redevance)\n• Proof of previous similar works (Attestations de Bonne Fin d\'Exécution)\n• Key personnel CVs and certified equipment list\n• Valid company HSE safety statement',
      categoryName: 'Tenders & Procurement',
      tags: ['rccm', 'niu', 'vendor qualification', 'bidding']
    },

    // 7. Account, Privacy & Support
    {
      id: 18,
      question: 'How do I book an in-person site inspection or engineering consultation?',
      answer: 'You can schedule an engineering consultation directly through our "Schedule Consultation" portal. Choose your preferred date, select the service required (e.g., Geotechnical Assessment, Structural Audit, BOQ Review), and an authorized senior engineer will confirm the booking within 1 business day.',
      categoryName: 'Account & Support',
      tags: ['consultation', 'booking', 'site inspection', 'appointment'],
      relatedPage: 'schedule-consultation'
    },
    {
      id: 19,
      question: 'How is user data handled in compliance with privacy laws and Google AdSense policies?',
      answer: 'MADECC Group complies with Cameroon Law No. 2010/012 on Cybersecurity and international GDPR standards. We do not sell or trade user data. Cookies are used strictly for session security, regional preference saving, and non-intrusive advertising disclosures. Full details can be reviewed in our Privacy Policy and Terms of Service.',
      categoryName: 'Account & Support',
      tags: ['privacy', 'cookies', 'adsense', 'gdpr', 'security'],
      relatedPage: 'privacy'
    },
    {
      id: 20,
      question: 'How can I reach MADECC Group offices directly for project or emergency structural queries?',
      answer: 'You can contact our central operations desk at:\n• Headquarters: Yaoundé Mbankolo, Cameroon (Operating Everywhere in Cameroon & Across Africa)\n• Telephone / WhatsApp: +237 683 316 486\n• Official Emails: kreboya603@gmail.com / madecccons@gmail.com\n• Operating Hours: Monday to Friday, 08:00 - 18:00 WAT (West Africa Time).',
      categoryName: 'Account & Support',
      tags: ['contact', 'phone', 'whatsapp', 'office', 'yaounde', 'mbankolo', 'cameroon', 'africa'],
      relatedPage: 'contact'
    }
  ];

  useEffect(() => {
    // 1. Fetch from server API
    fetch('/api/public/faqs')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.faqs) && data.faqs.length > 0) {
          // Combine server FAQs with comprehensive defaults to ensure zero thin content and zero key collision
          const serverList: FAQItem[] = data.faqs.map((f: any, idx: number) => ({
            ...f,
            id: f.id ? Number(f.id) : (idx + 1)
          }));
          
          let nextId = Math.max(...serverList.map(m => m.id), 0) + 1;
          const merged: FAQItem[] = [...serverList];
          
          defaultFaqs.forEach(df => {
            if (!merged.some(m => m.question.trim().toLowerCase() === df.question.trim().toLowerCase())) {
              merged.push({
                ...df,
                id: nextId++
              });
            }
          });
          setFaqs(merged);
          const cats = Array.from(new Set(merged.map((f: FAQItem) => f.categoryName))) as string[];
          setCategories(['All', ...cats]);
          setOpenIds(merged.slice(0, 3).map((f: FAQItem) => f.id));
        } else {
          loadFallbackFaqs();
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Using enriched fallback FAQ list:', err);
        loadFallbackFaqs();
        setLoading(false);
      });

    // 2. Inject FAQPage JSON-LD Structured Data into DOM Head
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    schemaScript.id = 'faqpage-schema';
    schemaScript.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': defaultFaqs.map(faq => ({
        '@type': 'Question',
        'name': faq.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': faq.answer.replace(/\n/g, ' ')
        }
      }))
    });
    document.head.appendChild(schemaScript);

    return () => {
      const existing = document.getElementById('faqpage-schema');
      if (existing) existing.remove();
    };
  }, []);

  const loadFallbackFaqs = () => {
    setFaqs(defaultFaqs);
    const cats = Array.from(new Set(defaultFaqs.map(f => f.categoryName)));
    setCategories(['All', ...cats]);
    setOpenIds([1, 4, 8]);
  };

  const toggleAccordion = (id: number) => {
    if (openIds.includes(id)) {
      setOpenIds(openIds.filter(i => i !== id));
    } else {
      setOpenIds([...openIds, id]);
    }
  };

  const handleCopyQuestion = (faq: FAQItem) => {
    navigator.clipboard.writeText(`Q: ${faq.question}\n\nA: ${faq.answer}`);
    setCopiedId(faq.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askName || !askEmail || !askQuestion) {
      setAskError('Please fill out all required fields.');
      return;
    }

    setSubmittingAsk(true);
    setAskError('');

    try {
      const res = await fetch('/api/public/faqs/submit-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: askName,
          email: askEmail,
          phone: askPhone,
          category: askCategory,
          question: askQuestion
        })
      });

      const data = await res.json();
      if (data.success) {
        setAskSuccess(true);
      } else {
        throw new Error(data.error || 'Failed to submit question.');
      }
    } catch (err: any) {
      setAskError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmittingAsk(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.categoryName === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      faq.question.toLowerCase().includes(query) || 
      faq.answer.toLowerCase().includes(query) ||
      (faq.tags && faq.tags.some(t => t.toLowerCase().includes(query)));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      
      {/* HEADER SECTION */}
      <section className="relative py-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80">
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
                FAQ & Help Centre
              </li>
            </ol>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest mb-4">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>MADECC Group Engineering & Client Knowledge Base</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Frequently Asked Questions & Help Centre
          </h1>

          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Verified guidance on civil engineering standards, BOQ estimation, construction costs in Cameroon, project documentation, tender opportunities, and safety protocols.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              aria-label="Search frequently asked questions"
              placeholder="Search by topic, keyword (e.g. BOQ, Eurocode 2, Cost per m², Tenders, Douala, FIDIC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-amber-500 shadow-xl transition-all"
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

      {/* MAIN CONTENT AREA */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-8" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={selectedCategory === cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action Header bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
          <span className="text-xs font-mono text-slate-400">
            Showing <strong className="text-amber-400">{filteredFaqs.length}</strong> topics in <strong className="text-white">{selectedCategory}</strong>
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => exportFaqsPDF(filteredFaqs, selectedCategory)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              id="export-faq-pdf-btn"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>Export Dossier (PDF)</span>
            </button>

            <button
              onClick={() => {
                setAskModalOpen(true);
                setAskSuccess(false);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              id="ask-question-modal-btn"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Ask a Technical Question</span>
            </button>
          </div>
        </div>

        {/* ACCORDION LIST */}
        {filteredFaqs.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No matching questions found</h3>
            <p className="text-xs text-slate-400 mb-6">Try searching with another keyword or reach out directly to our engineering desk.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-medium"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFaqs.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              return (
                <div 
                  key={faq.id} 
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen 
                      ? 'bg-slate-900/90 border-amber-500/40 shadow-lg' 
                      : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                  }`}
                  id={`faq-item-${faq.id}`}
                >
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    aria-expanded={isOpen}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500 rounded-2xl"
                  >
                    <div className="flex items-start gap-3">
                      <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-mono font-bold mt-0.5 shrink-0">
                        Q
                      </span>
                      <div>
                        <h3 className="text-base font-bold text-white leading-snug">
                          {faq.question}
                        </h3>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {faq.categoryName}
                          </span>
                          {faq.tags && faq.tags.map((t, tagIdx) => (
                            <span key={`faq-tag-${faq.id}-${t}-${tagIdx}`} className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-1.5 rounded-lg bg-slate-800 text-slate-400 shrink-0">
                      {isOpen ? <ChevronUp className="w-5 h-5 text-amber-400" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 text-sm text-slate-300 leading-relaxed">
                      <p className="whitespace-pre-line mb-4 font-sans">{faq.answer}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-800/60 text-xs">
                        {faq.relatedPage && onNavigateToTab && (
                          <button
                            onClick={() => onNavigateToTab(faq.relatedPage!)}
                            className="text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Explore Related Tool / Page</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleCopyQuestion(faq)}
                          className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px] ml-auto cursor-pointer"
                          title="Copy question and answer"
                        >
                          {copiedId === faq.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied to clipboard</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Q&A</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* STILL NEED HELP DIRECT ASSISTANCE CTA BLOCK */}
        <div className="mt-16 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <span className="text-xs font-mono text-amber-400 uppercase tracking-widest block mb-1">Direct Engineering Support</span>
            <h2 className="text-2xl font-bold text-white">Have a Specific Structural, BOQ, or Tender Inquiries?</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xl leading-relaxed">
              Our licensed structural engineers and quantity surveyors in Douala and Yaoundé are available for architectural evaluations, site inspections, and customized BOQ cost estimates.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-500" />
                <a href="tel:237683316486" className="hover:text-amber-400">+237 683 316 486</a>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-amber-500" />
                <a href="mailto:kreboya603@gmail.com" className="hover:text-amber-400">kreboya603@gmail.com</a>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 shrink-0">
            {onNavigateToTab && (
              <>
                <button
                  onClick={() => onNavigateToTab('request-a-quote')}
                  className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                  id="faq-cta-quote-btn"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Request a Project Quote</span>
                </button>

                <button
                  onClick={() => onNavigateToTab('contact')}
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs flex items-center gap-2 cursor-pointer"
                  id="faq-cta-contact-btn"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Contact Our Office</span>
                </button>
              </>
            )}
          </div>
        </div>

      </section>

      {/* ASK A QUESTION MODAL */}
      {askModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative shadow-2xl">
            <button
              onClick={() => setAskModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
              id="close-ask-faq-modal"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-500" />
              <span>Ask MADECC Group Technical Desk</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Submit your engineering or cost estimation question. Our team reviews and replies via email within 24 hours.
            </p>

            {askSuccess ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white mb-1">Question Submitted Successfully!</h4>
                <p className="text-xs text-slate-300 mb-4">
                  Thank you for reaching out. Our engineering desk has received your inquiry and will follow up promptly.
                </p>
                <button
                  onClick={() => setAskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleAskSubmit} className="space-y-4">
                {askError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
                    {askError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    required
                    value={askName}
                    onChange={(e) => setAskName(e.target.value)}
                    placeholder="e.g. Jean-Paul Mbida"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={askEmail}
                      onChange={(e) => setAskEmail(e.target.value)}
                      placeholder="jp.mbida@domain.cm"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Phone / WhatsApp</label>
                    <input 
                      type="text" 
                      value={askPhone}
                      onChange={(e) => setAskPhone(e.target.value)}
                      placeholder="+237 683 316 486"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Topic Category</label>
                  <select
                    value={askCategory}
                    onChange={(e) => setAskCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Construction Services">Construction & Structural Engineering</option>
                    <option value="Cost & Estimation">BOQ & Quantity Surveying</option>
                    <option value="Projects & Contracting">Projects & Milestone Billing</option>
                    <option value="Technical Documents">Drawings & Technical Formats</option>
                    <option value="Tenders & Procurement">Tenders & Vendor Opportunities</option>
                    <option value="Account & Support">Account, Consultation & Privacy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Your Question or Project Inquiry *</label>
                  <textarea
                    rows={4}
                    required
                    value={askQuestion}
                    onChange={(e) => setAskQuestion(e.target.value)}
                    placeholder="Describe your technical question, project location, or estimation requirements..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setAskModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingAsk}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer"
                    id="submit-faq-question-btn"
                  >
                    {submittingAsk ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Question</span>
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

export default FAQ;

