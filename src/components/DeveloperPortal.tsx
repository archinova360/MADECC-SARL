import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Key, 
  Cpu, 
  Terminal, 
  CheckCircle, 
  Copy, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  ExternalLink, 
  DollarSign, 
  Smartphone, 
  CreditCard, 
  Upload, 
  FileText, 
  AlertCircle, 
  Play, 
  RefreshCw, 
  Lock, 
  Activity, 
  Check, 
  ChevronRight,
  Database,
  Sparkles,
  Search,
  BookOpen,
  Send
} from 'lucide-react';
import { useToast } from './Toast.tsx';

interface DeveloperPortalProps {
  onNavigateToTab?: (tab: string, state?: any) => void;
}

export default function DeveloperPortal({ onNavigateToTab }: DeveloperPortalProps) {
  const { showToast } = useToast();

  // Navigation tabs in Dev Portal
  const [activeTab, setActiveTab] = useState<'docs' | 'pricing' | 'checkout' | 'dashboard'>('docs');

  // Dynamic products & plans fetched from live API backend
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<any>({
    mtnNumbers: ['671063511', '683316486', '671289643'],
    orangeNumbers: ['689115595', '640194505'],
    developerName: 'Kasah Rodrick Reboya'
  });

  // Selected plan for checkout
  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('PRO');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('all');

  // Interactive Endpoint Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState<'boq' | 'concrete' | 'reinforcement' | 'costs' | 'eurocode'>('concrete');
  const [testApiKey, setTestApiKey] = useState('');
  const [testRequestBody, setTestRequestBody] = useState<string>('{\n  "targetStrengthMpa": 25,\n  "slumpMm": 100,\n  "maxAggregateMm": 20,\n  "volumeM3": 10\n}');
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isExecutingApi, setIsExecutingApi] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'js' | 'python' | 'ts'>('curl');

  // Checkout Form State
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutOrg, setCheckoutOrg] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'MTN_MOMO' | 'ORANGE_MONEY' | 'CARD'>('MTN_MOMO');
  const [checkoutTxRef, setCheckoutTxRef] = useState('');
  const [checkoutReceiptUrl, setCheckoutReceiptUrl] = useState('');
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [checkoutCompletedData, setCheckoutCompletedData] = useState<any | null>(null);

  // Developer Dashboard / Key Generation State
  const [devEmail, setDevEmail] = useState('');
  const [devKeys, setDevKeys] = useState<any[]>([]);
  const [devEntitlements, setDevEntitlements] = useState<any[]>([]);
  const [loadingDevData, setLoadingDevData] = useState(false);
  const [generatedSecretModal, setGeneratedSecretModal] = useState<any | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  // Load products & plans
  useEffect(() => {
    fetch('/api/v1/products')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setProducts(data))
      .catch(console.error);

    fetch('/api/v1/plans')
      .then(r => r.json())
      .then(data => Array.isArray(data) && setPlans(data))
      .catch(console.error);

    fetch('/api/v1/company-payment-config')
      .then(r => r.json())
      .then(data => data && setPaymentConfig(data))
      .catch(console.error);
  }, []);

  // Update default payload when endpoint changes
  useEffect(() => {
    if (selectedEndpoint === 'concrete') {
      setTestRequestBody(JSON.stringify({
        targetStrengthMpa: 25,
        slumpMm: 100,
        maxAggregateMm: 20,
        volumeM3: 10
      }, null, 2));
    } else if (selectedEndpoint === 'reinforcement') {
      setTestRequestBody(JSON.stringify({
        beamWidthMm: 250,
        beamDepthMm: 500,
        bendingMomentKnm: 120,
        concreteStrengthFck: 25,
        steelGradeFyk: 500
      }, null, 2));
    } else if (selectedEndpoint === 'boq') {
      setTestRequestBody(JSON.stringify({
        items: [
          { code: "01.01", description: "Site Clearance & Topsoil Excavation", unit: "m2", quantity: 450, unitRateXaf: 1200 },
          { code: "02.04", description: "Mass Concrete Foundations (C25/30)", unit: "m3", quantity: 38, unitRateXaf: 85000 },
          { code: "03.01", description: "High-Yield Rebar Reinforcement", unit: "kg", quantity: 4200, unitRateXaf: 950 }
        ],
        currency: "XAF",
        contingencyPercent: 5
      }, null, 2));
    } else if (selectedEndpoint === 'costs') {
      setTestRequestBody(JSON.stringify({
        location: "Yaoundé, Cameroon",
        category: "Structural"
      }, null, 2));
    } else if (selectedEndpoint === 'eurocode') {
      setTestRequestBody(JSON.stringify({
        soilType: "Cohesive Clay / Laterite",
        cohesionKpa: 45,
        frictionAngleDeg: 24,
        footingWidthM: 1.5,
        footingLengthM: 1.5,
        embedmentDepthM: 1.2
      }, null, 2));
    }
  }, [selectedEndpoint]);

  // Execute test API call
  const handleRunApiTest = async () => {
    setIsExecutingApi(true);
    setTestResponse(null);
    try {
      let endpointPath = '/api/v1/concrete/calculate-mix';
      if (selectedEndpoint === 'reinforcement') endpointPath = '/api/v1/reinforcement/calculate';
      if (selectedEndpoint === 'boq') endpointPath = '/api/v1/boq/calculate';
      if (selectedEndpoint === 'costs') endpointPath = '/api/v1/costs/materials';
      if (selectedEndpoint === 'eurocode') endpointPath = '/api/v1/eurocode/bearing-capacity';

      let parsedBody = {};
      try {
        parsedBody = JSON.parse(testRequestBody);
      } catch (e) {
        showToast('Invalid JSON in request body', 'error');
        setIsExecutingApi(false);
        return;
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (testApiKey.trim()) {
        headers['Authorization'] = `Bearer ${testApiKey.trim()}`;
      }

      const res = await fetch(endpointPath, {
        method: 'POST',
        headers,
        body: JSON.stringify(parsedBody)
      });

      const resData = await res.json();
      setTestResponse(JSON.stringify(resData, null, 2));
      if (res.ok) {
        showToast('API calculation executed successfully!', 'success');
      } else {
        showToast(`API Error: ${resData.error || res.statusText}`, 'error');
      }
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err.message || 'Execution failed' }, null, 2));
      showToast(err.message || 'API request failed', 'error');
    } finally {
      setIsExecutingApi(false);
    }
  };

  // Upload payment proof receipt (supports up to 2000 MB / 2 GB)
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'api_payment_proofs');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setCheckoutReceiptUrl(data.url || data.secure_url);
        showToast('Payment proof uploaded successfully!', 'success');
      } else {
        showToast('Could not upload receipt image. Please paste transaction ref manually.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Upload error', 'error');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Submit checkout / access request
  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName || !checkoutEmail) {
      showToast('Please provide your name and email', 'error');
      return;
    }

    setIsSubmittingCheckout(true);
    try {
      const res = await fetch('/api/v1/checkout/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: checkoutName,
          email: checkoutEmail,
          organization: checkoutOrg,
          phone: checkoutPhone,
          planCode: selectedPlanCode,
          productSlug: selectedProductSlug,
          paymentMethod: checkoutPaymentMethod,
          txReference: checkoutTxRef,
          receiptUrl: checkoutReceiptUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCheckoutCompletedData(data);
        showToast('API Access Request Submitted Successfully!', 'success');
        setDevEmail(checkoutEmail);
      } else {
        showToast(data.error || 'Failed to submit request', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error completing checkout', 'error');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  // Fetch developer keys & status
  const handleLookupDevAccount = async () => {
    if (!devEmail) {
      showToast('Enter your registered developer email', 'error');
      return;
    }
    setLoadingDevData(true);
    try {
      const res = await fetch(`/api/v1/developer/me?email=${encodeURIComponent(devEmail)}`);
      const data = await res.json();
      if (res.ok) {
        setDevKeys(data.keys || []);
        setDevEntitlements(data.entitlements || []);
        showToast('Developer account retrieved successfully!', 'success');
      } else {
        showToast(data.error || 'No developer account found for this email', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Account lookup failed', 'error');
    } finally {
      setLoadingDevData(false);
    }
  };

  // Generate cryptographically secure API key
  const handleGenerateKey = async () => {
    if (!devEmail) {
      showToast('Enter your registered email first', 'error');
      return;
    }
    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/v1/developer/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: devEmail,
          name: newKeyName || 'Production Key',
          planCode: selectedPlanCode || 'DEVELOPER'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedSecretModal(data);
        setNewKeyName('');
        handleLookupDevAccount();
        showToast('API Key generated successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to generate key. Ensure your account is approved.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Key generation error', 'error');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  // Revoke key
  const handleRevokeKey = async (keyId: number) => {
    try {
      const res = await fetch(`/api/v1/developer/keys/${keyId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devEmail })
      });
      if (res.ok) {
        showToast('API Key revoked', 'success');
        handleLookupDevAccount();
      }
    } catch (err: any) {
      showToast('Could not revoke key', 'error');
    }
  };

  const getActivePlan = () => {
    return plans.find(p => p.code === selectedPlanCode) || {
      name: 'Professional API Access',
      priceXaf: 75000,
      monthlyQuota: 50000,
      rateLimitRpm: 120
    };
  };

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans" id="developer-portal-root">
      {/* Top Banner / Hero */}
      <div className="border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono">
                <Cpu className="w-3.5 h-3.5" />
                <span>MADECC Cloud High-Performance Engineering Engine v1.0</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Integrate Cameroon's Premier <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Construction & BOQ APIs</span>
              </h1>
              <p className="text-slate-400 text-base sm:text-lg leading-relaxed">
                Empower your ERP, prop-tech platform, or architectural tool with programmatic access to bill of quantities, structural Eurocode bearing capacities, concrete mix designs, and localized Central African material unit rates.
              </p>

              {/* Navigation Pill Switcher */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button
                  onClick={() => setActiveTab('docs')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'docs'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Interactive API Explorer</span>
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'pricing'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Pricing & Subscriptions</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Developer Dashboard</span>
                </button>
              </div>
            </div>

            {/* Quick Live Terminal Preview Card */}
            <div className="w-full lg:w-96 bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-2xl font-mono text-xs text-slate-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                </div>
                <span className="text-[10px] text-slate-500">api.madeccgroup.online</span>
              </div>
              <div className="space-y-1 text-slate-400">
                <div className="text-amber-400">$ curl -X POST https://madeccgroup.online/api/v1/concrete/calculate-mix \</div>
                <div className="pl-4">-H "Authorization: Bearer mk_live_..." \</div>
                <div className="pl-4">-d '{"{"}"targetStrengthMpa": 25, "volumeM3": 10{"}"}'</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80 text-emerald-400 text-[11px] leading-relaxed">
                <div>HTTP/2 200 OK</div>
                <div>{"{"} "cementBags": 78, "sandTonnes": 6.8, "waterLitres": 1950 {"}"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: INTERACTIVE DOCS & EXPLORER */}
      {activeTab === 'docs' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: API Catalog & Endpoint Selector */}
            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Available Endpoints (v1)
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'concrete', name: 'Concrete Mix Proportioning', method: 'POST', path: '/api/v1/concrete/calculate-mix', desc: 'Compute cement bags, aggregate, sand, water for C20-C45.' },
                  { id: 'reinforcement', name: 'Eurocode Rebar Designer', method: 'POST', path: '/api/v1/reinforcement/calculate', desc: 'Calculates Ast, minimum steel %, bar sizes & spacing.' },
                  { id: 'boq', name: 'Enterprise BOQ Engine', method: 'POST', path: '/api/v1/boq/calculate', desc: 'Bill of Quantities tabulation, subtotal & VAT rollup.' },
                  { id: 'costs', name: 'Regional Materials Index', method: 'POST', path: '/api/v1/costs/materials', desc: 'Real-time Yaoundé/Douala material market benchmarks.' },
                  { id: 'eurocode', name: 'Geotechnical Bearing Capacity', method: 'POST', path: '/api/v1/eurocode/bearing-capacity', desc: 'Meyerhof/Terzaghi allowable foundation bearing pressure.' }
                ].map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep.id as any)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      selectedEndpoint === ep.id
                        ? 'bg-slate-800 border-amber-500/80 shadow-md shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{ep.name}</span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {ep.method}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-amber-400/90 truncate">{ep.path}</div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ep.desc}</p>
                  </button>
                ))}
              </div>

              {/* Developer Key Input in Explorer */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2 mt-6">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Test API Key (Optional for Public Sandbox):</span>
                </label>
                <input
                  type="text"
                  placeholder="mk_live_xxxxxxxxxxxxxxxx"
                  value={testApiKey}
                  onChange={e => setTestApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-500">
                  Leave blank to execute in standard developer sandbox rate limits.
                </p>
              </div>
            </div>

            {/* Right Column: Interactive Code & Live Request Runner */}
            <div className="lg:col-span-8 space-y-6">
              {/* Code Sample Selector */}
              <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-300 font-semibold">Request Body (JSON)</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {['curl', 'js', 'python', 'ts'].map(lang => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang as any)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all ${
                          codeLanguage === lang
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-950">
                  <textarea
                    rows={8}
                    value={testRequestBody}
                    onChange={e => setTestRequestBody(e.target.value)}
                    className="w-full bg-transparent text-amber-300 font-mono text-xs focus:outline-none resize-y"
                    spellCheck={false}
                  />
                </div>

                <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-mono">
                    Target: /api/v1/{selectedEndpoint === 'concrete' ? 'concrete/calculate-mix' : selectedEndpoint}
                  </span>
                  <button
                    onClick={handleRunApiTest}
                    disabled={isExecutingApi}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md flex items-center gap-2"
                  >
                    {isExecutingApi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Calculating in Engine...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Send Live API Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Response Viewer */}
              {testResponse && (
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-xl animate-in fade-in duration-200">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/80 border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2 font-mono text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Live Response Payload (200 OK)</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(testResponse);
                        showToast('Response copied to clipboard!', 'success');
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-80">
                    {testResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: PRICING & SUBSCRIPTIONS */}
      {activeTab === 'pricing' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Transparent, Developer-Friendly API Pricing
            </h2>
            <p className="text-slate-400 text-base">
              Direct Mobile Money payments via MTN MoMo and Orange Money with instant verified administrator approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                code: 'FREE',
                name: 'Developer Sandbox',
                price: 'Free',
                desc: 'For prototyping and local development.',
                features: ['100 requests / day', 'Rate limit: 20 req/min', 'Community Documentation', '1 API Key'],
                cta: 'Start Free Sandbox',
                popular: false
              },
              {
                code: 'STARTER',
                name: 'Starter Architecture',
                price: '25,000 XAF',
                period: '/month',
                desc: 'For small engineering bureaus and individual surveyors.',
                features: ['10,000 requests / month', 'Rate limit: 60 req/min', 'Concrete, BOQ & Rebar APIs', '2 Active API Keys', 'Standard Email Support'],
                cta: 'Subscribe via MoMo',
                popular: false
              },
              {
                code: 'PRO',
                name: 'Professional Enterprise',
                price: '75,000 XAF',
                period: '/month',
                desc: 'For construction firms & SaaS application backends.',
                features: ['50,000 requests / month', 'Rate limit: 120 req/min', 'Full 5 Engineering APIs', '5 Active API Keys', 'Priority SLA & Webhooks', 'Custom Material Rates Feed'],
                cta: 'Select Professional',
                popular: true
              },
              {
                code: 'ENTERPRISE',
                name: 'Unlimited High-Volume',
                price: '250,000 XAF',
                period: '/month',
                desc: 'For nationwide infrastructure contractors and high-throughput portals.',
                features: ['Unlimited monthly quota (Fair-Use)', 'Dedicated Rate Limits (300+ RPM)', 'Custom Microservice Dedicated IP', 'Unlimited API Keys', 'Direct WhatsApp Developer Lead'],
                cta: 'Get Unlimited Access',
                popular: false
              }
            ].map(tier => (
              <div
                key={tier.code}
                className={`bg-slate-900 rounded-2xl p-6 border flex flex-col justify-between transition-all relative ${
                  tier.popular
                    ? 'border-amber-500 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-400">{tier.price}</span>
                    {tier.period && <span className="text-xs text-slate-400">{tier.period}</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">{tier.desc}</p>

                  <div className="mt-6 pt-4 border-t border-slate-800 space-y-2.5">
                    {tier.features.map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanCode(tier.code);
                    setActiveTab('checkout');
                  }}
                  className={`w-full mt-8 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    tier.popular
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: CHECKOUT & PAYMENT PROOF */}
      {activeTab === 'checkout' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {checkoutCompletedData ? (
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">API Access Request Received!</h2>
              <p className="text-slate-300 text-sm max-w-lg mx-auto">
                Thank you, <strong className="text-white">{checkoutCompletedData.name || checkoutName}</strong>. Your payment reference and access application for plan <strong className="text-amber-400">{selectedPlanCode}</strong> has been logged in the system.
              </p>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 max-w-md mx-auto text-xs font-mono text-left space-y-1 text-slate-400">
                <div>Status: <span className="text-amber-400 font-bold">PENDING ADMIN VERIFICATION</span></div>
                <div>Applicant Email: {checkoutEmail}</div>
                <div>Tx Reference: {checkoutTxRef || 'Recorded'}</div>
                <div>Review Time: Typically within 15 to 30 minutes</div>
              </div>
              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setCheckoutCompletedData(null);
                    setActiveTab('dashboard');
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all"
                >
                  Go to Developer Dashboard
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-8">
              <div className="border-b border-slate-800 pb-4">
                <div className="text-xs font-mono uppercase text-amber-400 font-semibold mb-1">
                  Step 2 of 2: Confirm Order & Payment
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Purchase API Entitlement — {selectedPlanCode} Plan
                </h2>
              </div>

              {/* Payment Accounts Card */}
              <div className="bg-slate-950 p-5 rounded-xl border border-amber-500/30 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  Official MADECC Mobile Money Channels (Yaoundé / Douala)
                </h4>
                <p className="text-xs text-slate-400">
                  Please transfer the subscription fee to one of the verified numbers below and enter the transaction ID:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">MTN Mobile Money</span>
                    <div className="text-slate-200">• 671 063 511 (Kasah Rodrick Reboya)</div>
                    <div className="text-slate-200">• 683 316 486</div>
                    <div className="text-slate-200">• 671 289 643</div>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-orange-400 font-bold block mb-1">Orange Money</span>
                    <div className="text-slate-200">• 689 115 595</div>
                    <div className="text-slate-200">• 640 194 505</div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitCheckout} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name / Lead Engineer *</label>
                    <input
                      type="text"
                      required
                      value={checkoutName}
                      onChange={e => setCheckoutName(e.target.value)}
                      placeholder="e.g. Engr. Marc Nkono"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Developer Email *</label>
                    <input
                      type="email"
                      required
                      value={checkoutEmail}
                      onChange={e => setCheckoutEmail(e.target.value)}
                      placeholder="e.g. developer@company.cm"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Organization / Application Name</label>
                    <input
                      type="text"
                      value={checkoutOrg}
                      onChange={e => setCheckoutOrg(e.target.value)}
                      placeholder="e.g. BuildTech Cameroon SARL"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Phone / WhatsApp Number</label>
                    <input
                      type="text"
                      value={checkoutPhone}
                      onChange={e => setCheckoutPhone(e.target.value)}
                      placeholder="+237 6xx xxx xxx"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method Used</label>
                    <select
                      value={checkoutPaymentMethod}
                      onChange={e => setCheckoutPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="CARD">Visa / Mastercard / Wire</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Transaction Reference / SMS Code</label>
                    <input
                      type="text"
                      value={checkoutTxRef}
                      onChange={e => setCheckoutTxRef(e.target.value)}
                      placeholder="e.g. MP260902.1245.A44122"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Upload Payment Screenshot / Receipt */}
                <div className="pt-2">
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Upload Payment Receipt / SMS Screenshot (Optional):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <Upload className={`w-4 h-4 ${isUploadingReceipt ? 'animate-spin' : ''}`} />
                      <span>{isUploadingReceipt ? 'Uploading 2GB Engine...' : 'Select File / Screenshot'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    {checkoutReceiptUrl && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle className="w-3.5 h-3.5" /> Receipt Attached
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pricing')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ← Back to Pricing
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingCheckout}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg flex items-center gap-2"
                  >
                    {isSubmittingCheckout ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit API Access Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: DEVELOPER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
          {/* Account Login / Lookup Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Key className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Developer API Key & Usage Workspace</h3>
                <p className="text-xs text-slate-400">Enter your developer email to manage generated tokens and view active entitlements.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Your developer email..."
                value={devEmail}
                onChange={e => setDevEmail(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleLookupDevAccount}
                disabled={loadingDevData}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                {loadingDevData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Fetch Keys</span>
              </button>
            </div>
          </div>

          {/* Key Generator Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Generate New API Key
              </h4>
              <p className="text-xs text-slate-400">
                Keys are issued using cryptographically secure hashing. Ensure your subscription is approved by an administrator before issuing keys.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Key Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Production Backend"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  onClick={handleGenerateKey}
                  disabled={isGeneratingKey}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isGeneratingKey && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate Cryptographic Key</span>
                </button>
              </div>
            </div>

            {/* Active Keys List */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                Active Developer Credentials ({devKeys.length})
              </h4>

              {devKeys.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No active keys found. Enter your email above or purchase an approved plan to generate API credentials.
                </div>
              ) : (
                <div className="space-y-2">
                  {devKeys.map(k => (
                    <div key={k.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                      <div>
                        <div className="font-bold text-amber-400">{k.keyPrefix}...</div>
                        <div className="text-slate-400 text-[11px]">{k.name} • Created {new Date(k.createdAt).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                          k.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {k.status}
                        </span>
                        {k.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-red-400 hover:text-red-300 font-sans text-xs underline"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ONE-TIME SECRET MODAL */}
      {generatedSecretModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Save Your API Secret Key</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Please copy and store this API secret now. <strong>For security reasons, it will never be displayed again.</strong>
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 break-all select-all flex items-center justify-between gap-2">
              <span>{generatedSecretModal.apiKey || generatedSecretModal.rawSecret}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedSecretModal.apiKey || generatedSecretModal.rawSecret);
                  showToast('Secret key copied to clipboard!', 'success');
                }}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200 shrink-0"
                title="Copy Key"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setGeneratedSecretModal(null)}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md"
            >
              I Have Stored My API Secret Securely
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
