import React, { useState } from 'react';
import { 
  Building2, 
  Truck, 
  HardHat, 
  ShieldCheck, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Send, 
  Lock, 
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  UserCheck
} from 'lucide-react';

interface ComplianceDoc {
  title: string;
  docType: string;
  fileUrl: string;
  fileName?: string;
}

const CAMEROON_REGIONS = [
  'Centre (Yaoundé)',
  'Littoral (Douala)',
  'West (Bafoussam)',
  'North West (Bamenda)',
  'South West (Buea)',
  'South (Ebolowa)',
  'East (Bertoua)',
  'Adamawa (Ngaoundéré)',
  'North (Garoua)',
  'Far North (Maroua)'
];

const SUPPLIER_CATEGORIES = [
  'Cement & Concrete Products',
  'Reinforcement Steel & Structural Metals',
  'Aggregates, Sand & Stone Quarry',
  'Plumbing, Piping & Sanitary Fixtures',
  'Electrical, Wiring & Power Distribution',
  'Paints, Waterproofing & Sealants',
  'Heavy Equipment & Machinery Rental',
  'Timber, Formwork & Joinery',
  'Roofing, Sheet Metals & Cladding',
  'Tiles, Granite & Flooring',
  'Glass, Aluminium & Openings',
  'Specialist Safety & Security Gear'
];

const SUBCONTRACTOR_TRADES = [
  'Structural Masonry & Concrete Works',
  'Steel Fixing & Rebar Reinforcement',
  'Carpentry, Formwork & Scaffolding',
  'Plumbing & Hydraulic Infrastructure',
  'Electrical Installation & High-Voltage',
  'HVAC & Air Conditioning',
  'Roofing & Waterproofing',
  'Tiling, Plastering & Finishing',
  'Earthworks, Excavation & Drainage',
  'Roads, Paving & External Works',
  'Land Surveying & Geotechnical Testing'
];

interface Props {
  onNavigateToTab?: (tab: string) => void;
}

export const SuppliersSubcontractors: React.FC<Props> = ({ onNavigateToTab }) => {
  const [activeTab, setActiveTab] = useState<'supplier' | 'subcontractor'>('supplier');

  // Supplier Form State
  const [supCompany, setSupCompany] = useState('');
  const [supRegNo, setSupRegNo] = useState('');
  const [supType, setSupType] = useState('SARL');
  const [supRegion, setSupRegion] = useState('Littoral (Douala)');
  const [supCity, setSupCity] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supWebsite, setSupWebsite] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPosition, setSupPosition] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supWhatsapp, setSupWhatsapp] = useState('');
  const [supCategory, setSupCategory] = useState(SUPPLIER_CATEGORIES[0]);
  const [supProducts, setSupProducts] = useState('');
  const [supYears, setSupYears] = useState(3);
  const [supCapacity, setSupCapacity] = useState('');
  const [supProjects, setSupProjects] = useState('');
  const [supDeclaration, setSupDeclaration] = useState(false);

  // Subcontractor Form State
  const [subCompany, setSubCompany] = useState('');
  const [subTrade, setSubTrade] = useState(SUBCONTRACTOR_TRADES[0]);
  const [subYears, setSubYears] = useState(3);
  const [subWorkforce, setSubWorkforce] = useState(10);
  const [subEquipment, setSubEquipment] = useState('');
  const [subProjects, setSubProjects] = useState('');
  const [subRegion, setSubRegion] = useState('Littoral (Douala)');
  const [subCity, setSubCity] = useState('');
  const [subAddress, setSubAddress] = useState('');
  const [subContact, setSubContact] = useState('');
  const [subPosition, setSubPosition] = useState('');
  const [subEmail, setSubEmail] = useState('');
  const [subPhone, setSubPhone] = useState('');
  const [subWhatsapp, setSubWhatsapp] = useState('');
  const [subDeclaration, setSubDeclaration] = useState(false);

  // File Upload State
  const [uploadedDocs, setUploadedDocs] = useState<ComplianceDoc[]>([]);
  const [uploading, setUploading] = useState(false);

  // Form Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle document file upload using existing upload API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setUploadedDocs([
          ...uploadedDocs,
          {
            title: docType,
            docType,
            fileUrl: data.url,
            fileName: files[0].name
          }
        ]);
      }
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  // Submit Supplier Application
  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supCompany || !supRegNo || !supEmail || !supPhone || !supProducts) {
      setErrorMsg('Please fill out all mandatory company and contact fields.');
      return;
    }
    if (!supDeclaration) {
      setErrorMsg('You must accept the truthfulness declaration before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/public/suppliers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: supCompany,
          registrationNumber: supRegNo,
          companyType: supType,
          region: supRegion,
          city: supCity,
          address: supAddress,
          website: supWebsite,
          contactPerson: supContact,
          position: supPosition,
          email: supEmail,
          phone: supPhone,
          whatsapp: supWhatsapp,
          supplierCategory: supCategory,
          products: supProducts,
          yearsInBusiness: Number(supYears),
          capacity: supCapacity,
          previousProjects: supProjects,
          complianceDocuments: uploadedDocs,
          declarationAccepted: supDeclaration
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedRef(data.applicationNumber || 'MADECC-SUP-2026-REG');
      } else {
        throw new Error(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Subcontractor Application
  const handleSubcontractorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCompany || !subEmail || !subPhone || !subContact) {
      setErrorMsg('Please fill out all mandatory company and contact fields.');
      return;
    }
    if (!subDeclaration) {
      setErrorMsg('You must accept the truthfulness declaration before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/public/subcontractors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: subCompany,
          trade: subTrade,
          yearsInBusiness: Number(subYears),
          workforceSize: Number(subWorkforce),
          equipmentOwned: subEquipment,
          previousProjects: subProjects,
          region: subRegion,
          city: subCity,
          address: subAddress,
          contactPerson: subContact,
          position: subPosition,
          email: subEmail,
          phone: subPhone,
          whatsapp: subWhatsapp,
          complianceDocuments: uploadedDocs,
          declarationAccepted: subDeclaration
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmittedRef(data.applicationNumber || 'MADECC-SUB-2026-REG');
      } else {
        throw new Error(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      
      {/* HERO BANNER */}
      <section className="relative py-20 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest mb-4">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Procurement & Supply Chain Portal</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Suppliers & Subcontractors Prequalification
          </h1>

          <p className="text-slate-300 text-base max-w-2xl mx-auto mb-6">
            Partner with MADECC Group to deliver quality construction and engineering solutions across Cameroon.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Confidential Application: Submitted data is securely transmitted directly to MADECC Procurement Officers.</span>
          </div>
        </div>
      </section>

      {/* MAIN REGISTRATION FORM AREA */}
      <section className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {submittedRef ? (
          <div className="p-10 rounded-3xl bg-slate-900 border border-emerald-500/40 text-center max-w-2xl mx-auto shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest block mb-1">
              Application Successfully Submitted
            </span>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Registration Received
            </h2>

            <div className="my-6 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-amber-400 text-lg font-bold">
              Ref #: {submittedRef}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Thank you for applying to partner with MADECC Group. Our procurement and engineering evaluation committee will review your company credentials. A confirmation message has been dispatched to your email address.
            </p>

            <button
              onClick={() => {
                setSubmittedRef(null);
                setUploadedDocs([]);
              }}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
            >
              Submit Another Prequalification Application
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl">
            
            {/* TAB SWITCHER */}
            <div className="grid grid-cols-2 gap-3 p-1.5 rounded-2xl bg-slate-950 border border-slate-800 mb-8">
              <button
                type="button"
                onClick={() => { setActiveTab('supplier'); setErrorMsg(''); }}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'supplier'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Become a Material Supplier</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('subcontractor'); setErrorMsg(''); }}
                className={`py-3.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'subcontractor'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <HardHat className="w-4 h-4" />
                <span>Apply as Subcontractor</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SUPPLIER FORM */}
            {activeTab === 'supplier' && (
              <form onSubmit={handleSupplierSubmit} className="space-y-6">
                
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <span>1. Company Identification & Category</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Company Registered Name *</label>
                    <input 
                      type="text" 
                      required
                      value={supCompany}
                      onChange={(e) => setSupCompany(e.target.value)}
                      placeholder="e.g. Cimenterie du Littoral SARL"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Tax / Registration No (RCCM / NIU) *</label>
                    <input 
                      type="text" 
                      required
                      value={supRegNo}
                      onChange={(e) => setSupRegNo(e.target.value)}
                      placeholder="e.g. M0123456789A"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Company Legal Entity</label>
                    <select
                      value={supType}
                      onChange={(e) => setSupType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    >
                      <option value="SARL">SARL (Société à Responsabilité Limitée)</option>
                      <option value="SA">SA (Société Anonyme)</option>
                      <option value="ETS">ETS (Etablissement Individual)</option>
                      <option value="Multinational">Multinational Branch</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Primary Supply Category *</label>
                    <select
                      value={supCategory}
                      onChange={(e) => setSupCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    >
                      {SUPPLIER_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Products & Materials Supplied *</label>
                  <textarea
                    rows={3}
                    required
                    value={supProducts}
                    onChange={(e) => setSupProducts(e.target.value)}
                    placeholder="List specific items, brands, cement grades, rebar diameters (e.g., FeE500 8mm-16mm), or quarry aggregate sizes..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Primary Operational Region</label>
                    <select
                      value={supRegion}
                      onChange={(e) => setSupRegion(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    >
                      {CAMEROON_REGIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Headquarters City</label>
                    <input 
                      type="text" 
                      value={supCity}
                      onChange={(e) => setSupCity(e.target.value)}
                      placeholder="e.g. Douala"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Years in Business</label>
                    <input 
                      type="number" 
                      min={1}
                      value={supYears}
                      onChange={(e) => setSupYears(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 pt-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  <span>2. Contact & Commercial Desk</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Contact Person Name *</label>
                    <input 
                      type="text" 
                      required
                      value={supContact}
                      onChange={(e) => setSupContact(e.target.value)}
                      placeholder="e.g. Alain Nguema"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Position / Role</label>
                    <input 
                      type="text" 
                      value={supPosition}
                      onChange={(e) => setSupPosition(e.target.value)}
                      placeholder="e.g. Sales Manager"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={supEmail}
                      onChange={(e) => setSupEmail(e.target.value)}
                      placeholder="commercial@company.cm"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      value={supPhone}
                      onChange={(e) => setSupPhone(e.target.value)}
                      placeholder="+237 600 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">WhatsApp Line</label>
                    <input 
                      type="text" 
                      value={supWhatsapp}
                      onChange={(e) => setSupWhatsapp(e.target.value)}
                      placeholder="+237 600 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* FILE ATTACHMENTS */}
                <div className="pt-4 border-t border-slate-800">
                  <label className="block text-xs font-mono text-slate-300 mb-2">Compliance Documents & Catalogs (Optional)</label>
                  <div className="flex items-center gap-4">
                    <label className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>{uploading ? 'Uploading...' : 'Upload Document'}</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, 'Compliance Document')}
                      />
                    </label>
                  </div>

                  {uploadedDocs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {uploadedDocs.map((doc, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                          <span className="text-slate-300">{doc.fileName || doc.title}</span>
                          <span className="text-emerald-400 font-mono text-[10px]">Uploaded</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DECLARATION */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <input 
                    type="checkbox"
                    id="supDec"
                    checked={supDeclaration}
                    onChange={(e) => setSupDeclaration(e.target.checked)}
                    className="mt-1 accent-amber-500"
                  />
                  <label htmlFor="supDec" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                    I declare that all company information and product details provided are accurate and authentic. I authorize MADECC Group procurement committee to evaluate this prequalification file.
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Submitting File...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Supplier Application</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

            {/* SUBCONTRACTOR FORM */}
            {activeTab === 'subcontractor' && (
              <form onSubmit={handleSubcontractorSubmit} className="space-y-6">
                
                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-500" />
                  <span>1. Technical Trade & Operational Profile</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Subcontractor Enterprise Name *</label>
                    <input 
                      type="text" 
                      required
                      value={subCompany}
                      onChange={(e) => setSubCompany(e.target.value)}
                      placeholder="e.g. ETS General Construction & Steel Works"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Primary Specialist Trade *</label>
                    <select
                      value={subTrade}
                      onChange={(e) => setSubTrade(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    >
                      {SUBCONTRACTOR_TRADES.map(trade => (
                        <option key={trade} value={trade}>{trade}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Years in Construction Trade</label>
                    <input 
                      type="number" 
                      min={1}
                      value={subYears}
                      onChange={(e) => setSubYears(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Permanent Skilled Workforce Size</label>
                    <input 
                      type="number" 
                      min={1}
                      value={subWorkforce}
                      onChange={(e) => setSubWorkforce(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Equipment & Tools Owned</label>
                  <textarea
                    rows={2}
                    value={subEquipment}
                    onChange={(e) => setSubEquipment(e.target.value)}
                    placeholder="e.g., Concrete mixers, scaffolding sets, total station, vibrators, welding rigs..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Track Record & Previous Projects</label>
                  <textarea
                    rows={3}
                    value={subProjects}
                    onChange={(e) => setSubProjects(e.target.value)}
                    placeholder="Highlight 2 to 3 recent projects completed in Cameroon (Client, location, scope of work)..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 pt-4 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-500" />
                  <span>2. Contact & Regional Coverage</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Primary Contact Name *</label>
                    <input 
                      type="text" 
                      required
                      value={subContact}
                      onChange={(e) => setSubContact(e.target.value)}
                      placeholder="e.g. Master Builder Joseph Kamga"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      required
                      value={subEmail}
                      onChange={(e) => setSubEmail(e.target.value)}
                      placeholder="subcontractor@mail.cm"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 mb-1">Phone Number *</label>
                    <input 
                      type="text" 
                      required
                      value={subPhone}
                      onChange={(e) => setSubPhone(e.target.value)}
                      placeholder="+237 670 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* DECLARATION */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <input 
                    type="checkbox"
                    id="subDec"
                    checked={subDeclaration}
                    onChange={(e) => setSubDeclaration(e.target.checked)}
                    className="mt-1 accent-amber-500"
                  />
                  <label htmlFor="subDec" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                    I confirm that our trade team upholds strict site safety and quality standards. I authorize MADECC Group to review our technical profile for upcoming subcontracts.
                  </label>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    {submitting ? (
                      <span>Submitting Application...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Subcontractor Application</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

      </section>

    </div>
  );
};
