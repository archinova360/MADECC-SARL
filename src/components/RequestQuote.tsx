import React, { useState, useEffect } from 'react';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  Clock, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  AlertCircle, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  HelpCircle,
  Paperclip,
  Check,
  X,
  Briefcase,
  Layers,
  Ruler,
  Copy,
  Printer,
  Download,
  Home,
  Info
} from 'lucide-react';

interface RequestQuoteProps {
  onNavigateToTab: (tab: string, extraState?: any) => void;
  preselectedService?: string;
}

const CAMEROON_REGIONS = [
  'Centre (Yaoundé)',
  'Littoral (Douala)',
  'West (Bafoussam)',
  'North West (Bamenda)',
  'South West (Buea/Limbe)',
  'South (Ebolowa/Kribi)',
  'East (Bertoua)',
  'Adamawa (Ngaoundéré)',
  'North (Garoua)',
  'Far North (Maroua)',
  'Diaspora / International Client'
];

const SERVICE_OPTIONS = [
  'General Construction & Contracting',
  'Structural & Civil Engineering',
  'Architectural Design & Planning',
  'BOQ Preparation & Cost Estimation',
  'Project Management & Supervision',
  'Renovation, Extension & Remodeling',
  'Geotechnical & Land Surveying',
  'Interior Design & High-End Finishes',
  'Infrastructure & Earthworks'
];

const PROJECT_TYPES = [
  'Residential Building',
  'Commercial Property',
  'Industrial Facility',
  'Institutional / Public Building',
  'Infrastructure / Civil Works',
  'Renovation / Extension',
  'Other Construction'
];

const BUILDING_TYPES = [
  'Bungalow / Single Storey',
  'Duplex / Multi-Storey Residence',
  'Apartment Complex',
  'Commercial Villa / Office',
  'Hotel / Hospitality',
  'Warehouse / Factory',
  'School / Educational Facility',
  'Hospital / Clinic',
  'Retail Store / Shopping Center',
  'Other'
];

const PROJECT_STAGES = [
  'Idea / Concept Stage',
  'Land Acquired (No Design Yet)',
  'Architectural Drawings Ready',
  'Structural Calculations Ready',
  'Full BOQ / Estimate Available',
  'Ready for Contractor Bidding',
  'Construction Started (In Progress)',
  'Renovation / Extension Required'
];

const SITE_STATUSES = [
  'Land fully acquired & clear',
  'Land in process of acquisition',
  'Existing structure to be demolished',
  'Existing structure requiring extension',
  'Construction partially started'
];

export const RequestQuote: React.FC<RequestQuoteProps> = ({ onNavigateToTab, preselectedService }) => {
  const [activeTab, setActiveTab] = useState<'request' | 'track'>('request');
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any | null>(null);

  // Status Tracker State
  const [trackRef, setTrackRef] = useState<string>('');
  const [trackLoading, setTrackLoading] = useState<boolean>(false);
  const [trackResult, setTrackResult] = useState<any | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [copiedRefText, setCopiedRefText] = useState<boolean>(false);

  const handleCopyReference = (refCode: string) => {
    if (!refCode) return;
    navigator.clipboard.writeText(refCode);
    setCopiedRefText(true);
    setTimeout(() => setCopiedRefText(false), 3000);
  };

  const handlePrintSummary = () => {
    window.print();
  };

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Project & Services
    projectName: '',
    projectType: 'Residential Building',
    buildingType: 'Duplex / Multi-Storey Residence',
    servicesRequested: [] as string[],
    projectStage: 'Idea / Concept Stage',
    storeys: 1,
    floorArea: '',
    floorAreaUnit: 'm²',

    // Step 2: Site & Location
    region: 'Centre (Yaoundé)',
    division: '',
    subdivision: '',
    city: 'Yaoundé',
    neighborhood: '',
    siteAddress: '',
    siteStatus: 'Land fully acquired & clear',

    // Step 3: Budget & Timeline
    budgetCurrency: 'XAF',
    budgetMin: '',
    budgetMax: '',
    urgency: 'Standard',
    desiredStartDate: '',
    expectedCompletionDate: '',
    projectDescription: '',
    additionalNotes: '',

    // Step 4: Contact Information
    clientName: '',
    clientCompany: '',
    clientEmail: '',
    clientPhone: '',
    whatsappNumber: '',
    preferredContactMethod: 'WhatsApp',
    preferredContactTime: 'Any time'
  });

  // Attached Document Simulation / File upload state
  const [attachedFiles, setAttachedFiles] = useState<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }[]>([]);

  // Initialize preselected service if passed
  useEffect(() => {
    if (preselectedService) {
      // Find matching service option or add it
      const matched = SERVICE_OPTIONS.find(s => s.toLowerCase().includes(preselectedService.toLowerCase())) || preselectedService;
      setFormData(prev => ({
        ...prev,
        servicesRequested: prev.servicesRequested.includes(matched) ? prev.servicesRequested : [...prev.servicesRequested, matched]
      }));
    }
  }, [preselectedService]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleService = (service: string) => {
    setFormData(prev => {
      const exists = prev.servicesRequested.includes(service);
      if (exists) {
        return { ...prev, servicesRequested: prev.servicesRequested.filter(s => s !== service) };
      } else {
        return { ...prev, servicesRequested: [...prev.servicesRequested, service] };
      }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Simulate file metadata addition
    const newDocs = Array.from(files).map((file: File) => ({
      fileName: file.name,
      fileUrl: URL.createObjectURL(file), // Local preview
      fileType: file.type || 'application/pdf',
      fileSize: file.size
    }));

    setAttachedFiles(prev => [...prev, ...newDocs]);
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    setError(null);
    if (step === 1) {
      if (!formData.projectName.trim()) {
        setError('Please enter a descriptive Project Name.');
        return false;
      }
      if (formData.servicesRequested.length === 0) {
        setError('Please select at least one service required for your project.');
        return false;
      }
    } else if (step === 2) {
      if (!formData.region) {
        setError('Please select your project region.');
        return false;
      }
      if (!formData.city.trim()) {
        setError('Please specify the city or town.');
        return false;
      }
    } else if (step === 4) {
      if (!formData.clientName.trim()) {
        setError('Please enter your Full Name.');
        return false;
      }
      if (!formData.clientEmail.trim() || !formData.clientEmail.includes('@')) {
        setError('Please enter a valid Email Address.');
        return false;
      }
      if (!formData.clientPhone.trim()) {
        setError('Please enter your Phone or WhatsApp number.');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  // Anti-Bot Human Verification state
  const [challenge, setChallenge] = useState<{ challengeId: string; equation: string; expiresAt: string } | null>(null);
  const [challengeLoading, setChallengeLoading] = useState<boolean>(false);
  const [challengeAnswer, setChallengeAnswer] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [verificationLoading, setVerificationLoading] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<string>('10:00');

  useEffect(() => {
    if (currentStep === 4 && !challenge) {
      fetchChallenge();
    }
  }, [currentStep]);

  useEffect(() => {
    if (!challenge?.expiresAt) return;
    const interval = setInterval(() => {
      const diff = new Date(challenge.expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining('Expired');
        setIsVerified(false);
        setVerificationError('This verification has expired. Please generate a new verification challenge.');
        clearInterval(interval);
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [challenge]);

  const fetchChallenge = async () => {
    setChallengeLoading(true);
    setVerificationError(null);
    setIsVerified(false);
    setChallengeAnswer('');
    try {
      const res = await fetch('/api/public/quote-requests/challenge');
      if (!res.ok) throw new Error('Failed to fetch challenge');
      const data = await res.json();
      setChallenge(data);
    } catch (err: any) {
      setVerificationError('Could not load human verification challenge. Please refresh or try again.');
    } finally {
      setChallengeLoading(false);
    }
  };

  const handleVerifyChallengeClick = async () => {
    if (!challenge) return;
    if (!challengeAnswer.trim()) {
      setVerificationError('Please enter the value of x.');
      return;
    }

    setVerificationLoading(true);
    setVerificationError(null);

    try {
      const csrfHeaders = await getCsrfHeaders();
      const res = await fetch('/api/public/quote-requests/verify-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          challengeAnswer: challengeAnswer.trim()
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setIsVerified(false);
        setVerificationError(data.error || 'Incorrect answer. Please try again.');
        if (data.expired || data.consumed || data.maxAttemptsExceeded) {
          setTimeout(() => fetchChallenge(), 1500);
        }
        return;
      }

      setIsVerified(true);
      setVerificationError(null);
    } catch (err: any) {
      setIsVerified(false);
      setVerificationError('We could not verify your submission. Please refresh the verification challenge and try again.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    const csrfHeaders = await getCsrfHeaders();

    if (!isVerified) {
      if (challenge && challengeAnswer.trim()) {
        setVerificationLoading(true);
        try {
          const verifyRes = await fetch('/api/public/quote-requests/verify-challenge', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...csrfHeaders
            },
            body: JSON.stringify({
              challengeId: challenge.challengeId,
              challengeAnswer: challengeAnswer.trim()
            })
          });
          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setError(verifyData.error || 'Incorrect answer. Please try again.');
            setVerificationError(verifyData.error || 'Incorrect answer. Please try again.');
            setIsVerified(false);
            if (verifyData.expired || verifyData.consumed || verifyData.maxAttemptsExceeded) {
              fetchChallenge();
            }
            return;
          }
          setIsVerified(true);
        } catch (verErr: any) {
          setError('We could not verify your submission. Please refresh the verification challenge and try again.');
          return;
        } finally {
          setVerificationLoading(false);
        }
      } else {
        setError('Anti-Bot Human Verification is required. Please solve the equation.');
        setVerificationError('Anti-Bot Human Verification is required. Please solve the equation.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        whatsappNumber: formData.whatsappNumber || formData.clientPhone,
        documents: attachedFiles,
        source: preselectedService ? `Services Page (${preselectedService})` : 'Quote Request Page',
        challengeId: challenge?.challengeId,
        challengeAnswer: challengeAnswer.trim(),
        honeypot
      };

      const res = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to submit quote request.');
      }

      const result = await res.json();
      setSuccessData(result);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred while submitting your request.');
      if (err.message?.toLowerCase().includes('verification') || err.message?.toLowerCase().includes('challenge') || err.message?.toLowerCase().includes('expired')) {
        setIsVerified(false);
        fetchChallenge();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTrackLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;

    setTrackLoading(true);
    setTrackError(null);
    setTrackResult(null);

    try {
      const cleanRef = trackRef.trim().toUpperCase();
      const res = await fetch(`/api/public/quote-requests/status/${encodeURIComponent(cleanRef)}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error(`Reference number "${cleanRef}" not found. Please double check your code.`);
        }
        throw new Error('Could not retrieve status. Please try again.');
      }

      const data = await res.json();
      setTrackResult(data);
    } catch (err: any) {
      setTrackError(err.message || 'Error tracking quote request.');
    } finally {
      setTrackLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumb / Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <button
              onClick={() => onNavigateToTab('services')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Services
            </button>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Request a Project Quote
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Get an official, quantity-surveyor verified construction budget estimate, structural proposal, or turnkey project quotation tailored to Cameroonian building standards.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex bg-slate-200/80 p-1 rounded-2xl self-start md:self-auto">
            <button
              onClick={() => { setActiveTab('request'); setError(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'request'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Submit New Request
            </button>
            <button
              onClick={() => { setActiveTab('track'); setError(null); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'track'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" /> Track Status
            </button>
          </div>
        </div>

        {/* TRACK STATUS VIEW */}
        {activeTab === 'track' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
            <div className="max-w-xl mx-auto text-center space-y-3">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <Search className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Track Project Enquiry Status
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Enter your unique MADECC Reference Code (e.g., <span className="font-mono font-bold text-slate-800">MADECC-REQ-2026-0001</span>) to view real-time estimation, engineering review, and quotation progress.
              </p>

              <form onSubmit={handleTrackLookup} className="flex flex-col sm:flex-row gap-2 pt-2">
                <input
                  type="text"
                  placeholder="e.g. MADECC-REQ-2026-0001"
                  value={trackRef}
                  onChange={(e) => setTrackRef(e.target.value)}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {trackLoading ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>Search Code</>
                  )}
                </button>
              </form>

              {trackError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs text-left flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>{trackError}</div>
                </div>
              )}
            </div>

            {/* TRACK RESULT DETAIL CARD */}
            {trackResult && (
              <div className="max-w-3xl mx-auto border border-slate-200 rounded-3xl p-6 sm:p-8 bg-slate-50/90 space-y-6 mt-6 shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">MADECC Project Reference</span>
                    <span className="text-xl font-black font-mono text-slate-900">{trackResult.referenceNumber}</span>
                  </div>
                  <div>
                    <span className={`inline-block px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                      trackResult.status === 'NEW' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      trackResult.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      trackResult.status === 'ESTIMATING' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                      trackResult.status === 'QUOTATION_SENT' || trackResult.status === 'WON' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {trackResult.status?.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* VISUAL STAGE TIMELINE */}
                <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-3">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block">
                    Engineering Progress Stages
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className={`p-2.5 rounded-xl border ${
                      ['NEW', 'UNDER_REVIEW', 'ESTIMATING', 'QUOTATION_SENT', 'WON'].includes(trackResult.status)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      01. Enquiry Received
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      ['UNDER_REVIEW', 'ESTIMATING', 'QUOTATION_SENT', 'WON'].includes(trackResult.status)
                        ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold'
                        : trackResult.status === 'NEW'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <Clock className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                      02. Technical Review
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      ['ESTIMATING', 'QUOTATION_SENT', 'WON'].includes(trackResult.status)
                        ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold'
                        : trackResult.status === 'UNDER_REVIEW'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <Building2 className="w-4 h-4 mx-auto mb-1 text-purple-600" />
                      03. Quantity Estimation
                    </div>

                    <div className={`p-2.5 rounded-xl border ${
                      ['QUOTATION_SENT', 'WON'].includes(trackResult.status)
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                        : trackResult.status === 'ESTIMATING'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold animate-pulse'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}>
                      <FileText className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                      04. Quotation Issued
                    </div>
                  </div>
                </div>

                {/* PUBLIC STATUS DEFINITION */}
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs space-y-1">
                  <span className="font-extrabold text-amber-900 uppercase tracking-wider block text-[11px]">Current Status Note:</span>
                  <p className="text-slate-800 leading-relaxed font-medium">
                    {trackResult.status === 'NEW' && "Your project enquiry has been successfully logged. Our Senior Quantity Surveyor and Civil Engineering team will begin reviewing your scope."}
                    {trackResult.status === 'UNDER_REVIEW' && "Our engineering team is currently analyzing your architectural specifications, site location, and structural parameters."}
                    {trackResult.status === 'ESTIMATING' && "Our Quantity Surveying division is calculating material quantities, labor hours, and local Cameroonian supply rates for your project."}
                    {trackResult.status === 'QUOTATION_SENT' && "A formal cost estimate and structural proposal has been generated and dispatched to your email address."}
                    {trackResult.status === 'WON' && "This enquiry has been officially converted into an active MADECC Group construction contract file."}
                    {trackResult.status === 'LOST' && "This enquiry file is currently archived."}
                  </p>
                </div>

                {/* ENQUIRY DETAILS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-slate-500 block font-semibold">Project Name:</span>
                    <span className="font-bold text-slate-900">{trackResult.projectName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold">Client Name:</span>
                    <span className="font-bold text-slate-900">{trackResult.clientName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold">Location:</span>
                    <span className="font-bold text-slate-900">{trackResult.city}, {trackResult.region}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold">Date Submitted:</span>
                    <span className="font-bold text-slate-900">{new Date(trackResult.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {trackResult.servicesRequested && (
                  <div className="text-xs">
                    <span className="text-slate-500 block font-semibold mb-1">Services Requested:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.isArray(trackResult.servicesRequested) ? (
                        trackResult.servicesRequested.map((s: string, idx: number) => (
                          <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-700">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-1 bg-white border border-slate-200 rounded-lg">{String(trackResult.servicesRequested)}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* PRIVACY NOTICE */}
                <div className="text-[11px] text-slate-500 italic flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Internal technical notes, staff communications, and material calculations are kept secure and confidential by MADECC Group.</span>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={() => handleCopyReference(trackResult.referenceNumber)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    {copiedRefText ? 'Code Copied!' : 'Copy Code'}
                  </button>

                  <button
                    onClick={() => onNavigateToTab('schedule-consultation')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm"
                  >
                    Schedule Direct Consultation
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBMISSION SUCCESS SCREEN */}
        {activeTab === 'request' && successData && (
          <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-2xl space-y-8">
            
            {/* Header / Intro */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <span className="inline-block text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-3.5 py-1 rounded-full">
                Enquiry Successfully Submitted
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Your Project Enquiry Has Been Submitted
              </h2>

              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
                Thank you, <strong>{formData.clientName}</strong>. Your project details have been successfully received by MADECC Group. Our Quantity Surveying, Engineering, and Project team will review the information provided and determine the appropriate next steps for your project.
              </p>
            </div>

            {/* Official Tracking Reference Banner */}
            <div className="max-w-xl mx-auto p-6 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-500/30 rounded-3xl text-center space-y-3 shadow-sm">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-600 block">
                Your Official MADECC Reference Code
              </span>

              <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900 tracking-wider">
                {successData.referenceNumber || 'MADECC-REQ-2026-0001'}
              </div>

              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Save or write down this unique code. You can use it anytime under <strong>Track Status</strong> to view review progress and engineer updates.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={() => handleCopyReference(successData.referenceNumber || 'MADECC-REQ-2026-0001')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedRefText ? 'Reference Copied!' : 'Copy Reference'}
                </button>

                <button
                  onClick={handlePrintSummary}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save Summary
                </button>
              </div>

              {copiedRefText && (
                <div className="text-xs font-bold text-emerald-600 transition-all">
                  ✓ Reference copied to clipboard!
                </div>
              )}
            </div>

            {/* Dynamic Project Enquiry Summary Card */}
            <div className="max-w-3xl mx-auto bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" /> Submitted Enquiry Summary
                </h3>
                <span className="text-[11px] font-mono text-slate-500">{new Date().toLocaleDateString()}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block font-semibold">Client Name:</span>
                  <span className="font-bold text-slate-900">{formData.clientName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Reference Number:</span>
                  <span className="font-mono font-bold text-amber-700">{successData.referenceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Project Title:</span>
                  <span className="font-bold text-slate-900">{formData.projectName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Project / Building Type:</span>
                  <span className="font-bold text-slate-900">{formData.projectType} ({formData.buildingType})</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Floor Area:</span>
                  <span className="font-bold text-slate-900">{formData.floorArea ? `${formData.floorArea} ${formData.floorAreaUnit}` : 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Location:</span>
                  <span className="font-bold text-slate-900">{formData.city}, {formData.region}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Requested Services:</span>
                  <span className="font-bold text-slate-900">{formData.servicesRequested.join(', ')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">Current Status:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full inline-block text-[10px] uppercase">
                    NEW (Enquiry Received)
                  </span>
                </div>
              </div>
            </div>

            {/* What Happens Next Section */}
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="flex items-center gap-2 font-black text-slate-900 text-sm sm:text-base border-b border-slate-200 pb-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> What Happens Next?
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="font-black text-amber-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-[10px]">01</span>
                    Project Review
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Our technical team will analyze your project details, floor area ({formData.floorArea || 'N/A'} {formData.floorAreaUnit}), location, requested services, project stage, and attached drawings/documents.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="font-black text-amber-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-[10px]">02</span>
                    Client Contact
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    We will reach out via <strong>{formData.preferredContactMethod}</strong> ({formData.whatsappNumber || formData.clientPhone}) to clarify requirements, discuss scope, and arrange a site assessment where appropriate.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="font-black text-amber-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-[10px]">03</span>
                    Cost & Technical Assessment
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Where applicable, our Quantity Surveyors perform quantity take-offs, BOQ preparation, cost estimation, engineering review, and construction quotation based on market rates.
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 shadow-2xs">
                  <div className="font-black text-amber-600 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center font-bold text-[10px]">04</span>
                    Next Project Stage
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Depending on your project stage, we guide you through site assessment, design coordination, BOQ preparation, cost estimation, quotation, project management, and construction supervision.
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Disclaimer Box */}
            <div className="max-w-3xl mx-auto p-4 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 text-[11px] leading-relaxed text-left flex items-start gap-3">
              <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-slate-800 mb-0.5 uppercase tracking-wider text-[10px]">Important Notice:</strong>
                Submission of a project enquiry confirms that MADECC Group has received your information. It does not constitute a quotation, contract, project acceptance, or guarantee of service. Final project costs and technical recommendations are subject to project-specific information, drawings, specifications, site conditions, quantities, material prices, labour, logistics, taxes, and other applicable factors.
              </div>
            </div>

            {/* Confirmation Page Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setActiveTab('track');
                  setTrackRef(successData.referenceNumber || '');
                  handleTrackLookup({ preventDefault: () => {} } as any);
                }}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-amber-400" /> Track My Request
              </button>

              <button
                onClick={() => onNavigateToTab('schedule-consultation')}
                className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" /> Schedule Direct Consultation
              </button>

              <button
                onClick={() => {
                  setSuccessData(null);
                  setCurrentStep(1);
                  setFormData({
                    projectName: '',
                    projectType: 'Residential Building',
                    buildingType: 'Duplex / Multi-Storey Residence',
                    servicesRequested: [],
                    projectStage: 'Idea / Concept Stage',
                    storeys: 1,
                    floorArea: '',
                    floorAreaUnit: 'm²',
                    region: 'Centre (Yaoundé)',
                    division: '',
                    subdivision: '',
                    city: 'Yaoundé',
                    neighborhood: '',
                    siteAddress: '',
                    siteStatus: 'Land fully acquired & clear',
                    budgetCurrency: 'XAF',
                    budgetMin: '',
                    budgetMax: '',
                    urgency: 'Standard',
                    desiredStartDate: '',
                    expectedCompletionDate: '',
                    projectDescription: '',
                    additionalNotes: '',
                    clientName: '',
                    clientCompany: '',
                    clientEmail: '',
                    clientPhone: '',
                    whatsappNumber: '',
                    preferredContactMethod: 'WhatsApp',
                    preferredContactTime: 'Any time'
                  });
                }}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs sm:text-sm rounded-xl transition-all"
              >
                Submit Another Request
              </button>

              <button
                onClick={() => onNavigateToTab('home')}
                className="px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5"
              >
                <Home className="w-4 h-4 text-slate-500" /> Return to Home
              </button>
            </div>

          </div>
        )}

        {/* FORM VIEW (WHEN NOT SUCCESS & TAB IS REQUEST) */}
        {activeTab === 'request' && !successData && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-8">
            
            {/* Step Progress Bar */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Step {currentStep} of 4</span>
                <span className="text-amber-600 uppercase tracking-wider">
                  {currentStep === 1 && '1. Project & Services'}
                  {currentStep === 2 && '2. Site & Location'}
                  {currentStep === 3 && '3. Budget & Timeline'}
                  {currentStep === 4 && '4. Contact & Submission'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300 rounded-full" 
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Error Notification Banner */}
            {error && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 font-bold text-sm">
                  &times;
                </button>
              </div>
            )}

            <form onSubmit={currentStep === 4 ? handleSubmitQuote : (e) => e.preventDefault()} className="space-y-6">

              {/* STEP 1: PROJECT & SERVICES */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-amber-500" /> Project Title & Type
                    </h2>
                    <p className="text-xs text-slate-500">Specify basic details about your proposed construction project.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Project Name / Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 4-Bedroom Modern Duplex in Bastos, Yaoundé"
                        value={formData.projectName}
                        onChange={(e) => handleInputChange('projectName', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Project Category</label>
                      <select
                        value={formData.projectType}
                        onChange={(e) => handleInputChange('projectType', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {PROJECT_TYPES.map((pt, idx) => (
                          <option key={idx} value={pt}>{pt}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Building Typology</label>
                      <select
                        value={formData.buildingType}
                        onChange={(e) => handleInputChange('buildingType', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {BUILDING_TYPES.map((bt, idx) => (
                          <option key={idx} value={bt}>{bt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Services Needed Multi-Select */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Services Required <span className="text-rose-500">*</span> (Select all that apply)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {SERVICE_OPTIONS.map((srv, idx) => {
                        const isSelected = formData.servicesRequested.includes(srv);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => toggleService(srv)}
                            className={`p-3 rounded-2xl border text-xs font-medium text-left transition-all flex items-center justify-between ${
                              isSelected
                                ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-sm font-bold'
                                : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>{srv}</span>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${
                              isSelected ? 'bg-amber-500 border-amber-600 text-slate-950' : 'border-slate-300'
                            }`}>
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Project Stage & Scale */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Stage</label>
                      <select
                        value={formData.projectStage}
                        onChange={(e) => handleInputChange('projectStage', e.target.value)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {PROJECT_STAGES.map((st, idx) => (
                          <option key={idx} value={st}>{st}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Number of Storeys</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={formData.storeys}
                        onChange={(e) => handleInputChange('storeys', parseInt(e.target.value) || 1)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Est. Floor Area (m²)</label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={formData.floorArea}
                        onChange={(e) => handleInputChange('floorArea', e.target.value)}
                        className="w-full px-3.5 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: SITE & LOCATION */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-amber-500" /> Location & Site Parameters
                    </h2>
                    <p className="text-xs text-slate-500">
                      Construction material transport and ground condition factors vary across Cameroon regions.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Region <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.region}
                        onChange={(e) => handleInputChange('region', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {CAMEROON_REGIONS.map((reg, idx) => (
                          <option key={idx} value={reg}>{reg}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        City / Town <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Yaoundé, Douala, Kribi, Limbe"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Neighborhood / District</label>
                      <input
                        type="text"
                        placeholder="e.g. Bastos, Odza, Bonapriso, Santa Barbara"
                        value={formData.neighborhood}
                        onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Site Status</label>
                      <select
                        value={formData.siteStatus}
                        onChange={(e) => handleInputChange('siteStatus', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {SITE_STATUSES.map((ss, idx) => (
                          <option key={idx} value={ss}>{ss}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Specific Site Address or Landmark</label>
                      <input
                        type="text"
                        placeholder="e.g. Opposite Total Station, 200m from main paved road"
                        value={formData.siteAddress}
                        onChange={(e) => handleInputChange('siteAddress', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: BUDGET & TIMELINE */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-500" /> Budget, Timeline & Scope Notes
                    </h2>
                    <p className="text-xs text-slate-500">Provide budget boundaries to help us formulate realistic engineering options.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Currency</label>
                      <select
                        value={formData.budgetCurrency}
                        onChange={(e) => handleInputChange('budgetCurrency', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="XAF">XAF (FCFA)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Min Budget Target</label>
                      <input
                        type="number"
                        placeholder="e.g. 15,000,000"
                        value={formData.budgetMin}
                        onChange={(e) => handleInputChange('budgetMin', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Max Budget Target</label>
                      <input
                        type="number"
                        placeholder="e.g. 35,000,000"
                        value={formData.budgetMax}
                        onChange={(e) => handleInputChange('budgetMax', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Desired Start Date</label>
                      <input
                        type="date"
                        value={formData.desiredStartDate}
                        onChange={(e) => handleInputChange('desiredStartDate', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Project Urgency</label>
                      <select
                        value={formData.urgency}
                        onChange={(e) => handleInputChange('urgency', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Low">Low (Planning for future)</option>
                        <option value="Standard">Standard (Within 1-3 months)</option>
                        <option value="High">High (Immediate action needed)</option>
                        <option value="Urgent">Urgent (Site active / Emergency)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Project Description & Key Requirements
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your vision, specific materials, desired finishes, structural features, or any existing challenges..."
                      value={formData.projectDescription}
                      onChange={(e) => handleInputChange('projectDescription', e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* File Upload / Attach Drawings Section */}
                  <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-amber-500" /> Attach Architectural Drawings, BOQs or Sketches
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Upload PDF, DWG, PNG, or JPG files (Max 25MB each).
                        </div>
                      </div>

                      <label className="cursor-pointer px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" /> Choose Files
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.png,.jpg,.jpeg,.dwg,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {attachedFiles.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-200">
                        {attachedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200 text-xs">
                            <span className="font-medium text-slate-800 truncate max-w-xs">{file.fileName}</span>
                            <button
                              type="button"
                              onClick={() => removeFile(idx)}
                              className="text-rose-500 hover:text-rose-700 font-bold p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: CONTACT & SUBMISSION */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <User className="w-5 h-5 text-amber-500" /> Client Contact Information
                    </h2>
                    <p className="text-xs text-slate-500">How should our Quantity Surveyor team deliver your quotation?</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Dr. Jean-Paul Mbida"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Mbida Investments SARL"
                        value={formData.clientCompany}
                        onChange={(e) => handleInputChange('clientCompany', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. jp.mbida@example.com"
                        value={formData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +237 671 06 35 11"
                        value={formData.clientPhone}
                        onChange={(e) => handleInputChange('clientPhone', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +237 671 06 35 11"
                        value={formData.whatsappNumber}
                        onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Preferred Contact Channel</label>
                      <select
                        value={formData.preferredContactMethod}
                        onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="WhatsApp">WhatsApp Message / Voice</option>
                        <option value="Phone Call">Direct Phone Call</option>
                        <option value="Email">Official Email Statement</option>
                      </select>
                    </div>
                  </div>

                  {/* ANTI-BOT HUMAN VERIFICATION SECTION */}
                  <div className="p-5 sm:p-6 bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl space-y-4 relative overflow-hidden my-4">
                    {/* Background accent */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                    {/* Hidden Honeypot Trap Field */}
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                      className="hidden opacity-0 pointer-events-none absolute -left-[9999px]"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />

                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                        <h3 className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase">
                          Anti-Bot Human Verification
                        </h3>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                        Required
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      To safeguard our portal against automated spam, please solve the equation:
                    </p>

                    {/* Challenge Box */}
                    <div className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3">
                      {challengeLoading ? (
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-3">
                          <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                          Generating verification challenge...
                        </div>
                      ) : challenge ? (
                        <>
                          <div className="text-center">
                            <div className="text-xl sm:text-2xl font-black font-mono text-amber-400 tracking-wider">
                              {challenge.equation}
                            </div>
                          </div>

                          {/* Answer Input + Verify Button */}
                          <div className="space-y-2">
                            <label htmlFor="anti-bot-input" className="block text-xs font-bold text-slate-300">
                              Enter the value of x
                            </label>

                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                id="anti-bot-input"
                                type="text"
                                inputMode="numeric"
                                placeholder="e.g. 5"
                                value={challengeAnswer}
                                disabled={isVerified}
                                onChange={(e) => {
                                  setChallengeAnswer(e.target.value);
                                  setVerificationError(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (!isVerified) handleVerifyChallengeClick();
                                  }
                                }}
                                className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-60"
                              />

                              {!isVerified ? (
                                <button
                                  type="button"
                                  onClick={handleVerifyChallengeClick}
                                  disabled={verificationLoading || !challengeAnswer.trim()}
                                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                                >
                                  {verificationLoading ? (
                                    <>
                                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                                      Verifying...
                                    </>
                                  ) : (
                                    'Verify'
                                  )}
                                </button>
                              ) : (
                                <div className="px-4 py-2.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shrink-0">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Success State Badge */}
                          {isVerified && (
                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-center gap-2">
                              <Check className="w-4 h-4 stroke-[3]" />
                              ✓ Human verification completed
                            </div>
                          )}

                          {/* Error Banner */}
                          {verificationError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
                              <span>{verificationError}</span>
                              <button
                                type="button"
                                onClick={fetchChallenge}
                                className="text-amber-400 hover:text-amber-300 underline font-bold text-xs shrink-0"
                              >
                                Get New Challenge
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                            <span>Time remaining: <strong className="font-mono text-slate-300">{timeRemaining}</strong></span>
                            <button
                              type="button"
                              onClick={fetchChallenge}
                              className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1"
                            >
                              Get New Challenge
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-rose-400 text-center space-y-2 py-2">
                          <p>Could not load verification challenge.</p>
                          <button
                            type="button"
                            onClick={fetchChallenge}
                            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                    <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Request Summary</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-600">
                      <div>• Project: <strong>{formData.projectName || 'Untitled Project'}</strong></div>
                      <div>• Location: <strong>{formData.city}, {formData.region}</strong></div>
                      <div>• Services: <strong>{formData.servicesRequested.length} selected</strong></div>
                      <div>• Urgency: <strong>{formData.urgency}</strong></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Controls / Navigation Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" /> Previous Step
                  </button>
                ) : <div />}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5 ml-auto"
                  >
                    Next Step <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading || (!isVerified && !challengeAnswer.trim())}
                    className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> Submit Quotation Enquiry
                      </>
                    )}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

      </div>
    </div>
  );
};
