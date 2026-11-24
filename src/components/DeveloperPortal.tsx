import React, { useState, useEffect, useMemo } from 'react';
import {
  Key,
  Terminal,
  CheckCircle,
  Copy,
  ArrowRight,
  DollarSign,
  Smartphone,
  Upload,
  AlertCircle,
  Play,
  RefreshCw,
  Lock,
  Check,
  Search,
  Send,
  Download,
  Code2,
  ShieldCheck
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { uploadMediaAssetDirect } from '../lib/directMediaUpload.ts';

interface DeveloperPortalProps {
  onNavigateToTab?: (tab: string, state?: any) => void;
}

type EndpointId = 'concrete' | 'reinforcement' | 'boq' | 'budget' | 'costs' | 'eurocode';

const PAID_FALLBACK_PLANS = [
  {
    code: 'STARTER_SANDBOX',
    name: 'Verified Developer Sandbox',
    price: 9999,
    currency: 'XAF',
    billingCycle: 'MONTHLY',
    rateLimitPerMinute: 20,
    monthlyQuota: 2500,
    maxApiKeys: 1,
    description: 'Paid verification key for staging, sandbox integration testing, and prototype verification.',
    features: ['2,500 verified API calls / month', 'Rate limit: 20 req/min', '1 Production/Staging API Key', 'OpenAPI 3.0.3 Spec Download'],
    isPopular: false
  },
  {
    code: 'STARTER',
    name: 'Starter Architecture',
    price: 25000,
    currency: 'XAF',
    billingCycle: 'MONTHLY',
    rateLimitPerMinute: 60,
    monthlyQuota: 10000,
    maxApiKeys: 2,
    description: 'For civil engineering bureaus, quantity surveyors, and project estimators.',
    features: ['10,000 requests / month', 'Rate limit: 60 req/min', 'Concrete, BOQ, Budget & Rebar APIs', '2 Active API Keys', 'OpenAPI 3.0.3 Spec Download'],
    isPopular: false
  },
  {
    code: 'PRO',
    name: 'Professional Enterprise',
    price: 75000,
    currency: 'XAF',
    billingCycle: 'MONTHLY',
    rateLimitPerMinute: 120,
    monthlyQuota: 50000,
    maxApiKeys: 5,
    description: 'For contracting firms, real-estate platforms, and commercial ERP backends.',
    features: ['50,000 requests / month', 'Rate limit: 120 req/min', 'All 6 Engineering & Cost APIs', '5 Active API Keys', 'Regional Material Price Feed', 'Priority SLA'],
    isPopular: true
  },
  {
    code: 'ENTERPRISE',
    name: 'Enterprise High-Volume',
    price: 250000,
    currency: 'XAF',
    billingCycle: 'MONTHLY',
    rateLimitPerMinute: 300,
    monthlyQuota: -1,
    maxApiKeys: 25,
    description: 'For nationwide infrastructure groups and multi-tenant construction portals.',
    features: ['Unlimited Fair-Use Monthly Quota', 'Rate limit: 300+ req/min', 'Up to 25 Active API Keys', 'Custom Neon Rate Feed', 'Direct Engineering Support'],
    isPopular: false
  }
];

const ENDPOINT_CATALOG: Array<{
  id: EndpointId;
  name: string;
  method: 'POST';
  path: string;
  desc: string;
}> = [
  { id: 'concrete', name: 'Concrete Mix Proportioning', method: 'POST', path: '/api/v1/concrete/calculate-mix', desc: 'EN 1992 cement bags, sand, aggregate, water & 28-day strength timeline.' },
  { id: 'reinforcement', name: 'Eurocode Rebar Designer', method: 'POST', path: '/api/v1/reinforcement/calculate', desc: 'EN 1992 / BS 8666 cut lengths, 12m bar count, stirrups & steel tonnage.' },
  { id: 'boq', name: 'Enterprise BOQ Engine', method: 'POST', path: '/api/v1/boq/calculate', desc: 'Sectional Bill of Quantities, VAT 19.25%, contingency & cost/m² breakdown.' },
  { id: 'budget', name: 'Turnkey Budget Estimator', method: 'POST', path: '/api/v1/budget/calculate', desc: 'Parametric regional turnkey project budget for Yaoundé, Douala, or Garoua.' },
  { id: 'costs', name: 'Regional Materials Index', method: 'POST', path: '/api/v1/costs/materials', desc: 'Verified Central African cement, rebar, sand, gravel, and block unit rates.' },
  { id: 'eurocode', name: 'Geotechnical Bearing Capacity', method: 'POST', path: '/api/v1/eurocode/bearing-capacity', desc: 'EN 1997 Terzaghi/Meyerhof footing allowable bearing pressure & safe load.' }
];

export default function DeveloperPortal({ onNavigateToTab }: DeveloperPortalProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'docs' | 'pricing' | 'checkout' | 'dashboard'>('docs');

  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>(PAID_FALLBACK_PLANS);
  const [mtnNumbers, setMtnNumbers] = useState<string[]>(['671063511', '683316486', '671289643']);
  const [orangeNumbers, setOrangeNumbers] = useState<string[]>(['689115595', '640194505']);
  const [accountHolderName, setAccountHolderName] = useState<string>('Kasah Rodrick Reboya');

  const [selectedPlanCode, setSelectedPlanCode] = useState<string>('PRO');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string>('all-engineering-apis');

  // Interactive Endpoint Explorer State
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointId>('concrete');
  const [testApiKey, setTestApiKey] = useState('');
  const [testRequestBody, setTestRequestBody] = useState<string>(JSON.stringify({
    concreteGrade: 'C25/30',
    volumeM3: 10,
    exposureClass: 'XC2',
    cementType: 'CEM II/B-P 42.5R'
  }, null, 2));
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isExecutingApi, setIsExecutingApi] = useState(false);
  const [isDownloadingSdk, setIsDownloadingSdk] = useState(false);
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

  // Developer Dashboard State
  const [devEmail, setDevEmail] = useState('');
  const [devKeys, setDevKeys] = useState<any[]>([]);
  const [devEntitlements, setDevEntitlements] = useState<any[]>([]);
  const [devRequests, setDevRequests] = useState<any[]>([]);
  const [loadingDevData, setLoadingDevData] = useState(false);
  const [generatedSecretModal, setGeneratedSecretModal] = useState<any | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [portalCms, setPortalCms] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/v1/products')
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : [];
        if (list.length > 0) setProducts(list);
      })
      .catch(console.error);

    fetch('/api/v1/plans')
      .then(r => r.json())
      .then(data => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.plans) ? data.plans : [];
        if (raw.length > 0) {
          const sanitized = raw.map((p: any) => ({
            ...p,
            price: Number(p.price) > 0 ? Number(p.price) : 9999
          }));
          setPlans(sanitized);
        }
      })
      .catch(console.error);

    fetch('/api/v1/company-payment-config')
      .then(r => r.json())
      .then(data => {
        if (data?.paymentNumbers) {
          if (Array.isArray(data.paymentNumbers.mtnMobileMoney)) setMtnNumbers(data.paymentNumbers.mtnMobileMoney);
          if (Array.isArray(data.paymentNumbers.orangeMoney)) setOrangeNumbers(data.paymentNumbers.orangeMoney);
        }
        if (data?.developer) setAccountHolderName(data.developer);
      })
      .catch(console.error);

    fetch('/api/cms/developer-portal')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data?.success && data.portalContent) setPortalCms(data.portalContent);
      })
      .catch(() => {});
  }, []);

  // Sync Explorer default JSON payloads strictly with backend schemas
  useEffect(() => {
    if (selectedEndpoint === 'concrete') {
      setTestRequestBody(JSON.stringify({
        concreteGrade: 'C25/30',
        volumeM3: 10,
        exposureClass: 'XC2',
        cementType: 'CEM II/B-P 42.5R'
      }, null, 2));
    } else if (selectedEndpoint === 'reinforcement') {
      setTestRequestBody(JSON.stringify({
        elementType: 'BEAM',
        spanOrHeightMeters: 6.0,
        widthMm: 200,
        depthMm: 450,
        mainBarDiameterMm: 16,
        mainBarCount: 4,
        stirrupDiameterMm: 8,
        stirrupSpacingMm: 150,
        quantityOfElements: 8
      }, null, 2));
    } else if (selectedEndpoint === 'boq') {
      setTestRequestBody(JSON.stringify({
        projectType: 'Residential Villa (R+1)',
        builtUpArea: 250,
        numberOfFloors: 2,
        finishesLevel: 'STANDARD',
        location: 'Yaoundé',
        currency: 'XAF'
      }, null, 2));
    } else if (selectedEndpoint === 'budget') {
      setTestRequestBody(JSON.stringify({
        areaM2: 240,
        floors: 2,
        finishesLevel: 'STANDARD',
        location: 'Douala'
      }, null, 2));
    } else if (selectedEndpoint === 'costs') {
      setTestRequestBody(JSON.stringify({
        location: 'Yaoundé',
        region: 'CENTRE_YAOUNDE',
        category: 'Cement'
      }, null, 2));
    } else if (selectedEndpoint === 'eurocode') {
      setTestRequestBody(JSON.stringify({
        soilType: 'FIRM_LATERITIC_CLAY',
        foundationDepthMeters: 1.5,
        footingWidthMeters: 1.2,
        footingLengthMeters: 1.2,
        groundWaterLevelMeters: 4.0
      }, null, 2));
    }
  }, [selectedEndpoint]);

  const activeEndpointMeta = useMemo(
    () => ENDPOINT_CATALOG.find(e => e.id === selectedEndpoint) || ENDPOINT_CATALOG[0],
    [selectedEndpoint]
  );

  const generatedSdkSnippet = useMemo(() => {
    const keyPlaceholder = testApiKey.trim() || 'sec_live_YOUR_PAID_API_KEY';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://madeccgroup.online';
    const fullUrl = `${baseUrl}${activeEndpointMeta.path}`;
    const bodyCompact = testRequestBody.trim();

    if (codeLanguage === 'curl') {
      return `curl -X POST "${fullUrl}" \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer ${keyPlaceholder}" \\\n  -d '${bodyCompact}'`;
    }
    if (codeLanguage === 'js') {
      return `const response = await fetch("${fullUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer ${keyPlaceholder}"\n  },\n  body: JSON.stringify(${bodyCompact})\n});\nconst data = await response.json();\nconsole.log(data);`;
    }
    if (codeLanguage === 'ts') {
      return `interface EngineeringApiResponse<T = Record<string, unknown>> {\n  success: boolean;\n  error?: string;\n  [key: string]: unknown;\n}\n\nconst res = await fetch("${fullUrl}", {\n  method: "POST",\n  headers: {\n    "Content-Type": "application/json",\n    "Authorization": "Bearer ${keyPlaceholder}"\n  },\n  body: JSON.stringify(${bodyCompact})\n});\nconst payload: EngineeringApiResponse = await res.json();`;
    }
    return `import requests\n\nresponse = requests.post(\n    "${fullUrl}",\n    headers={\n        "Content-Type": "application/json",\n        "Authorization": "Bearer ${keyPlaceholder}"\n    },\n    json=${bodyCompact.replace(/"/g, '"')}\n)\nprint(response.json())`;
  }, [activeEndpointMeta.path, codeLanguage, testApiKey, testRequestBody]);

  // Execute live API test strictly requiring a paid API key
  const handleRunApiTest = async () => {
    if (!testApiKey.trim()) {
      showToast('A verified paid API key is required before invoking live endpoints.', 'error');
      return;
    }

    setIsExecutingApi(true);
    setTestResponse(null);
    try {
      let parsedBody = {};
      try {
        parsedBody = JSON.parse(testRequestBody);
      } catch {
        showToast('Invalid JSON in request body', 'error');
        setIsExecutingApi(false);
        return;
      }

      const res = await fetch(activeEndpointMeta.path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testApiKey.trim()}`
        },
        body: JSON.stringify(parsedBody)
      });

      const resData = await res.json();
      setTestResponse(JSON.stringify(resData, null, 2));
      if (res.ok) {
        showToast('API calculation executed cleanly!', 'success');
      } else {
        showToast(`API Error (${res.status}): ${resData.error || res.statusText}`, 'error');
      }
    } catch (err: any) {
      setTestResponse(JSON.stringify({ error: err.message || 'Execution failed' }, null, 2));
      showToast(err.message || 'API request failed', 'error');
    } finally {
      setIsExecutingApi(false);
    }
  };

  // Strict Pay-Gated OpenAPI 3.0.3 Spec Download
  const handleDownloadOpenApiSpec = async () => {
    if (!testApiKey.trim()) {
      showToast('Purchase and enter a confirmed paid API key to download the OpenAPI SDK spec.', 'error');
      return;
    }

    setIsDownloadingSdk(true);
    try {
      const res = await fetch('/api/v1/sdk/openapi.json', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${testApiKey.trim()}`
        }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || `Download blocked (${res.status}): Paid subscription required.`, 'error');
        return;
      }

      const spec = await res.json();
      const blob = new Blob([JSON.stringify(spec, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'madecc-engineering-api-v1.openapi.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('OpenAPI 3.0.3 SDK specification downloaded.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'SDK download failed', 'error');
    } finally {
      setIsDownloadingSdk(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReceipt(true);
    try {
      const result = await uploadMediaAssetDirect({
        file,
        folder: 'api_payment_proofs',
        useCmsEndpoint: false
      });
      setCheckoutReceiptUrl(result.url);
      showToast('Payment proof uploaded successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Could not upload receipt image. Enter your SMS transaction code manually.', 'error');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutName.trim() || !checkoutEmail.trim()) {
      showToast('Please provide your name and email address.', 'error');
      return;
    }
    if (checkoutTxRef.trim().length < 4 && !checkoutReceiptUrl) {
      showToast('Payment confirmation required: enter your Mobile Money transaction code (min 4 characters) or upload payment receipt.', 'error');
      return;
    }

    setIsSubmittingCheckout(true);
    try {
      const res = await fetch('/api/v1/checkout/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          developerName: checkoutName.trim(),
          companyName: (checkoutOrg || checkoutName).trim(),
          contactEmail: checkoutEmail.trim(),
          contactPhone: checkoutPhone.trim(),
          planCode: selectedPlanCode,
          productSlug: selectedProductSlug,
          paymentMethod: checkoutPaymentMethod,
          transactionReference: checkoutTxRef.trim(),
          paymentReceiptUrl: checkoutReceiptUrl || undefined
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCheckoutCompletedData(data);
        showToast('Paid API access request logged for admin payment verification.', 'success');
        setDevEmail(checkoutEmail.trim());
      } else {
        showToast(data.error || 'Failed to submit payment request', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error completing checkout', 'error');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handleLookupDevAccount = async () => {
    if (!devEmail.trim()) {
      showToast('Enter your registered developer email', 'error');
      return;
    }
    setLoadingDevData(true);
    try {
      const res = await fetch(`/api/v1/developer/me?email=${encodeURIComponent(devEmail.trim())}`);
      const data = await res.json();
      if (res.ok) {
        setDevKeys(data.keys || []);
        setDevEntitlements(data.entitlements || []);
        setDevRequests(data.requests || []);
        showToast('Developer workspace synced.', 'success');
      } else {
        showToast(data.error || 'No developer account found for this email', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Account lookup failed', 'error');
    } finally {
      setLoadingDevData(false);
    }
  };

  const handleGenerateKey = async () => {
    if (!devEmail.trim()) {
      showToast('Enter your registered email first', 'error');
      return;
    }
    setIsGeneratingKey(true);
    try {
      const res = await fetch('/api/v1/developer/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: devEmail.trim(),
          keyName: newKeyName.trim() || 'Production Key'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setGeneratedSecretModal(data);
        setNewKeyName('');
        handleLookupDevAccount();
        showToast('Paid API Key generated cleanly!', 'success');
      } else {
        showToast(data.error || 'Payment verification required before issuing keys.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Key generation error', 'error');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleRevokeKey = async (keyId: number) => {
    try {
      const res = await fetch(`/api/v1/developer/keys/${keyId}/revoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: devEmail.trim() })
      });
      if (res.ok) {
        showToast('API Key revoked', 'success');
        handleLookupDevAccount();
      }
    } catch {
      showToast('Could not revoke key', 'error');
    }
  };

  const activePlanDetails = plans.find(p => p.code === selectedPlanCode) || plans[0];
  const hasPaidEntitlement = devEntitlements.some((e: any) => e.status === 'ACTIVE');

  return (
    <div className="bg-[#0B0F14] text-slate-100 min-h-screen font-sans" id="developer-portal-root">
      {/* Header Hero */}
      <div className="border-b border-slate-800 bg-[#11161D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-2xl space-y-4">
              <div className="text-xs font-mono uppercase tracking-widest text-amber-400">
                MADECC Commercial API Platform · Paid Subscription Required
              </div>
              {portalCms?.announcementNotice && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  {portalCms.announcementNotice}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                {portalCms?.heroTitle || (
                  <>
                    Integrate Cameroon's Premier <span className="text-amber-400">Construction &amp; BOQ APIs</span>
                  </>
                )}
              </h1>
              <p className="text-slate-300 text-base leading-relaxed">
                {portalCms?.heroSubtitle ||
                  'Programmatic REST access to Eurocode 2 concrete mixes, rebar cut-length schedules, itemized BOQs, regional material rates, and EN 1997 soil bearing capacities.'}
              </p>

              {/* Tab Switcher */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3">
                <button
                  onClick={() => setActiveTab('docs')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'docs'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>API Explorer &amp; SDK</span>
                </button>
                <button
                  onClick={() => setActiveTab('pricing')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'pricing'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Paid API Plans</span>
                </button>
                <button
                  onClick={() => setActiveTab('checkout')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'checkout'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pay &amp; Unlock Key</span>
                </button>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 whitespace-nowrap ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Key className="w-4 h-4" />
                  <span>Key Management</span>
                </button>
              </div>
            </div>

            {/* Live Auth Contract Preview */}
            <div className="w-full lg:w-[400px] bg-[#0B0F14] border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-3 shrink-0">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
                <span>PAID AUTH CONTRACT (HTTPS)</span>
                <span className="text-amber-400 font-semibold">Bearer Auth Required</span>
              </div>
              <div className="space-y-1 text-slate-300 text-[11px] overflow-x-auto">
                <div className="text-amber-400">$ curl -X POST /api/v1/concrete/calculate-mix \</div>
                <div className="pl-3">-H "Authorization: Bearer sec_live_..." \</div>
                <div className="pl-3">-d '{"{"}"concreteGrade":"C25/30","volumeM3":10{"}"}'</div>
              </div>
              <div className="bg-[#11161D] p-2.5 rounded border border-slate-800 text-emerald-400 text-[11px]">
                <div>HTTP 401/402 if unpaid or missing key</div>
                <div>HTTP 200 OK -&gt; verified EN 1992 batching JSON</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: API EXPLORER & SDK */}
      {activeTab === 'docs' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Catalog & Paid Key Gate */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Commercial Endpoints ({ENDPOINT_CATALOG.length})
                </h2>
                {products.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-400">{products.length} modules</span>
                )}
              </div>

              <div className="space-y-2">
                {ENDPOINT_CATALOG.map(ep => (
                  <button
                    key={ep.id}
                    onClick={() => setSelectedEndpoint(ep.id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                      selectedEndpoint === ep.id
                        ? 'bg-[#161C24] border-amber-500/80'
                        : 'bg-[#11161D] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-white text-sm">{ep.name}</span>
                      <span className="font-mono text-[10px] font-bold text-emerald-400">{ep.method}</span>
                    </div>
                    <div className="font-mono text-xs text-amber-400 truncate">{ep.path}</div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{ep.desc}</p>
                  </button>
                ))}
              </div>

              {/* Strict Paid Key Input */}
              <div className="bg-[#11161D] p-4 rounded-xl border border-amber-500/30 space-y-3 mt-4">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Paid API Key Required (Authorization: Bearer)</span>
                </label>
                <input
                  type="text"
                  placeholder="sec_live_xxxxxxxxxxxxxxxxxxxxxxxx"
                  value={testApiKey}
                  onChange={e => setTestApiKey(e.target.value)}
                  className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Unpaid API calls and OpenAPI spec downloads are strictly blocked (HTTP 401/402). Purchase a verified key to run live requests.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pricing')}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                  >
                    Purchase Paid Key
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadOpenApiSpec}
                    disabled={isDownloadingSdk || !testApiKey.trim()}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-45 disabled:cursor-not-allowed text-slate-100 font-semibold rounded-lg text-xs flex items-center gap-1.5 border border-slate-700"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isDownloadingSdk ? 'Downloading...' : 'OpenAPI Spec (.json)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Request & Code Runner */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[#11161D] rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-[#161C24] border-b border-slate-800 text-xs">
                  <div className="flex items-center gap-2 font-mono">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-200 font-semibold">Request Payload (JSON)</span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">{activeEndpointMeta.path}</span>
                </div>

                <div className="p-4 bg-[#0B0F14]">
                  <textarea
                    rows={8}
                    value={testRequestBody}
                    onChange={e => setTestRequestBody(e.target.value)}
                    className="w-full bg-transparent text-amber-300 font-mono text-xs focus:outline-none resize-y"
                    spellCheck={false}
                  />
                </div>

                <div className="px-4 py-3 bg-[#11161D] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400 font-mono">
                    {testApiKey.trim()
                      ? 'Key detected — ready for authenticated paid call'
                      : 'Payment Locked: Enter a confirmed paid API key to unlock execution'}
                  </span>
                  <button
                    onClick={handleRunApiTest}
                    disabled={isExecutingApi || !testApiKey.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2"
                  >
                    {isExecutingApi ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Executing...</span>
                      </>
                    ) : !testApiKey.trim() ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Send Live API Request (Key Required)</span>
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

              {/* Multi-Language Integration Snippet */}
              <div className="bg-[#11161D] rounded-xl border border-slate-800 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-[#161C24] border-b border-slate-800 text-xs gap-2">
                  <div className="flex items-center gap-2 font-mono text-slate-200 font-semibold">
                    <Code2 className="w-4 h-4 text-amber-400" />
                    <span>SDK Integration Snippet</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {(['curl', 'js', 'ts', 'python'] as const).map(lang => (
                      <button
                        key={lang}
                        onClick={() => setCodeLanguage(lang)}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono ${
                          codeLanguage === lang
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {lang.toUpperCase()}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedSdkSnippet);
                        showToast('Snippet copied to clipboard', 'success');
                      }}
                      className="ml-2 px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
                <pre className="p-4 bg-[#0B0F14] text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
                  {generatedSdkSnippet}
                </pre>
              </div>

              {/* Live Response Payload */}
              {testResponse && (
                <div className="bg-[#11161D] rounded-xl border border-slate-800 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#161C24] border-b border-slate-800 text-xs">
                    <div className="flex items-center gap-2 font-mono text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>Live Server Response</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(testResponse);
                        showToast('Response copied to clipboard', 'success');
                      }}
                      className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-[#0B0F14] text-slate-200 font-mono text-xs overflow-x-auto max-h-80">
                    {testResponse}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAID API PLANS (ZERO FREE TIERS) */}
      {activeTab === 'pricing' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="max-w-2xl mb-10 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Licensed Commercial API Plans (100% Pay-Before-Access)
            </h2>
            <p className="text-slate-400 text-sm">
              Every API key, endpoint calculation, and OpenAPI download requires confirmed Mobile Money or bank payment verified by an administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((tier: any) => {
              const quotaLabel = tier.monthlyQuota === -1
                ? 'Unlimited fair-use'
                : `${Number(tier.monthlyQuota || 2500).toLocaleString('fr-FR')} req/month`;
              const featureList: string[] = Array.isArray(tier.features) && tier.features.length > 0
                ? tier.features
                : [
                    quotaLabel,
                    `Rate limit: ${tier.rateLimitPerMinute || 60} req/min`,
                    `${tier.maxApiKeys || 1} Active API Keys`,
                    'OpenAPI 3.0.3 Spec Included'
                  ];

              return (
                <div
                  key={tier.code}
                  className={`bg-[#11161D] rounded-xl p-6 border flex flex-col justify-between ${
                    tier.isPopular ? 'border-amber-500' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] uppercase text-amber-400">{tier.code}</span>
                      {tier.isPopular && (
                        <span className="text-[11px] font-bold text-amber-300">Recommended</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                    <div className="mt-3 flex items-baseline gap-1 font-mono tabular-nums">
                      <span className="text-2xl font-black text-amber-400">
                        {Number(tier.price || 9999).toLocaleString('fr-FR')} {tier.currency || 'XAF'}
                      </span>
                      <span className="text-xs text-slate-400">/mo</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{tier.description}</p>

                    <div className="mt-5 pt-4 border-t border-slate-800 space-y-2">
                      {featureList.map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
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
                    className={`w-full mt-6 py-2.5 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
                      tier.isPopular
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Select &amp; Pay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CHECKOUT & PAYMENT PROOF */}
      {activeTab === 'checkout' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {checkoutCompletedData ? (
            <div className="bg-[#11161D] border border-emerald-500/40 rounded-xl p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-500/15 text-emerald-400 rounded-xl flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-white">Paid API Access Request Logged</h2>
              <p className="text-slate-300 text-sm max-w-lg mx-auto">
                Your payment reference for <strong className="text-amber-400">{selectedPlanCode}</strong> has been queued in Neon PostgreSQL for administrator verification. Keys activate strictly after transaction confirmation.
              </p>
              <div className="p-4 bg-[#0B0F14] rounded-xl border border-slate-800 max-w-md mx-auto text-xs font-mono text-left space-y-1 text-slate-300">
                <div>Request ID: {checkoutCompletedData.requestId}</div>
                <div>Status: <span className="text-amber-400 font-bold">{checkoutCompletedData.status || 'PENDING'}</span></div>
                <div>Email: {checkoutEmail}</div>
                <div>Tx Ref: {checkoutTxRef || 'Payment proof uploaded'}</div>
              </div>
              <div className="pt-3 flex justify-center gap-3">
                <button
                  onClick={() => {
                    setCheckoutCompletedData(null);
                    setActiveTab('dashboard');
                    handleLookupDevAccount();
                  }}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Open Key Management
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#11161D] rounded-xl border border-slate-800 p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono uppercase text-amber-400 font-semibold">
                    Pay-Before-Key Verification
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {activePlanDetails?.name || selectedPlanCode} — {Number(activePlanDetails?.price || 75000).toLocaleString('fr-FR')} {activePlanDetails?.currency || 'XAF'}
                  </h2>
                </div>
                <select
                  value={selectedPlanCode}
                  onChange={e => setSelectedPlanCode(e.target.value)}
                  className="bg-[#0B0F14] border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-400"
                >
                  {plans.map((p: any) => (
                    <option key={p.code} value={p.code}>
                      {p.name} ({Number(p.price).toLocaleString('fr-FR')} {p.currency || 'XAF'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-[#0B0F14] p-5 rounded-xl border border-amber-500/30 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>Official MADECC Mobile Money Numbers ({accountHolderName})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold block mb-1">MTN Mobile Money</span>
                    {mtnNumbers.map((num, idx) => (
                      <div key={idx} className="text-slate-200">{num}</div>
                    ))}
                  </div>
                  <div className="bg-[#11161D] p-3 rounded-lg border border-slate-800">
                    <span className="text-orange-400 font-bold block mb-1">Orange Money</span>
                    {orangeNumbers.map((num, idx) => (
                      <div key={idx} className="text-slate-200">{num}</div>
                    ))}
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmitCheckout} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Developer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={checkoutName}
                      onChange={e => setCheckoutName(e.target.value)}
                      placeholder="Engr. Marc Nkono"
                      className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Developer Email *</label>
                    <input
                      type="email"
                      required
                      value={checkoutEmail}
                      onChange={e => setCheckoutEmail(e.target.value)}
                      placeholder="developer@company.cm"
                      className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Company / Organization *</label>
                    <input
                      type="text"
                      required
                      value={checkoutOrg}
                      onChange={e => setCheckoutOrg(e.target.value)}
                      placeholder="BuildTech Cameroon SARL"
                      className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={checkoutPhone}
                      onChange={e => setCheckoutPhone(e.target.value)}
                      placeholder="+237 6xx xxx xxx"
                      className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">API Product Scope</label>
                    <select
                      value={selectedProductSlug}
                      onChange={e => setSelectedProductSlug(e.target.value)}
                      className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="all-engineering-apis">All 6 Engineering APIs</option>
                      {products.map((prod: any) => (
                        <option key={prod.slug} value={prod.slug}>{prod.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Payment Method *</label>
                    <select
                      value={checkoutPaymentMethod}
                      onChange={e => setCheckoutPaymentMethod(e.target.value as any)}
                      className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                    >
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="CARD">Bank Wire / Visa</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Transaction Ref (min 4 chars) *</label>
                    <input
                      type="text"
                      value={checkoutTxRef}
                      onChange={e => setCheckoutTxRef(e.target.value)}
                      placeholder="MP260902.1245.A44122"
                      className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Upload Payment Receipt Screenshot (Required if SMS ref unavailable):
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <Upload className={`w-4 h-4 ${isUploadingReceipt ? 'animate-spin' : ''}`} />
                      <span>{isUploadingReceipt ? 'Uploading Proof...' : 'Upload Payment Screenshot'}</span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    {checkoutReceiptUrl && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                        <CheckCircle className="w-3.5 h-3.5" /> Attached
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('pricing')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    &larr; Back to Plans
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCheckout}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2"
                  >
                    {isSubmittingCheckout ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Logging Payment...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Payment for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEVELOPER DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
          <div className="bg-[#11161D] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Key className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h2 className="text-sm font-bold text-white">Paid API Key &amp; Entitlement Workspace</h2>
                <p className="text-xs text-slate-400">Look up your email to inspect payment approval, entitlements, and cryptographic keys.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="developer@company.cm"
                value={devEmail}
                onChange={e => setDevEmail(e.target.value)}
                className="bg-[#0B0F14] border border-slate-700 text-xs text-white rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={handleLookupDevAccount}
                disabled={loadingDevData}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 whitespace-nowrap"
              >
                {loadingDevData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Fetch Keys</span>
              </button>
            </div>
          </div>

          {devRequests.length > 0 && (
            <div className="bg-[#11161D] border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400">Submitted Payment Requests</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {devRequests.map((reqRow: any) => (
                  <div key={reqRow.id} className="bg-[#0B0F14] border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-amber-400 font-bold">{reqRow.requestId}</span>
                      <span className={reqRow.status === 'APPROVED' ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                        {reqRow.status}
                      </span>
                    </div>
                    <div className="text-slate-300">{reqRow.planCode} · {Number(reqRow.amount || 0).toLocaleString('fr-FR')} {reqRow.currency || 'XAF'}</div>
                    <div className="text-slate-500 font-mono truncate">Ref: {reqRow.transactionReference}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#11161D] border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Generate Paid API Key</span>
              </h3>
              <p className="text-xs text-slate-400">
                Requires an active entitlement backed by an administrator-approved payment transaction (&gt; 0 XAF).
              </p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Key Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Production ERP Integration"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    className="w-full bg-[#0B0F14] border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <button
                  onClick={handleGenerateKey}
                  disabled={isGeneratingKey || !hasPaidEntitlement}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg text-xs flex items-center justify-center gap-2"
                >
                  {isGeneratingKey && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{hasPaidEntitlement ? 'Generate Cryptographic Key' : 'Payment Approval Required'}</span>
                </button>
                {!hasPaidEntitlement && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('pricing')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-semibold rounded-lg text-xs"
                  >
                    View Paid Plans &amp; Checkout
                  </button>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-[#11161D] border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Active Developer Credentials ({devKeys.length})</span>
              </h3>

              {devKeys.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No API keys found for this email. Purchase a plan and wait for payment confirmation first.
                </div>
              ) : (
                <div className="space-y-2">
                  {devKeys.map((k: any) => (
                    <div key={k.id} className="bg-[#0B0F14] border border-slate-800 p-3 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                      <div>
                        <div className="font-bold text-amber-400">{k.secretPrefix || k.keyId}</div>
                        <div className="text-slate-400 text-[11px]">
                          {k.name} · {k.environment || 'production'} · {k.rateLimitPerMinute || 60} rpm
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={k.status === 'ACTIVE' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          {k.status}
                        </span>
                        {k.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleRevokeKey(k.id)}
                            className="text-rose-400 hover:text-rose-300 font-sans text-xs underline"
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
          <div className="bg-[#11161D] border border-amber-500 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-white">Save Your API Secret Key</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Copy and store this paid API secret now. <strong>For security reasons, it will never be displayed again.</strong>
            </p>

            <div className="p-3 bg-[#0B0F14] rounded-lg border border-slate-800 font-mono text-xs text-amber-300 break-all select-all flex items-center justify-between gap-2">
              <span>
                {generatedSecretModal.key?.secret ||
                  generatedSecretModal.key?.keyId ||
                  generatedSecretModal.apiKey ||
                  generatedSecretModal.rawSecret}
              </span>
              <button
                onClick={() => {
                  const val =
                    generatedSecretModal.key?.secret ||
                    generatedSecretModal.key?.keyId ||
                    generatedSecretModal.apiKey ||
                    generatedSecretModal.rawSecret ||
                    '';
                  navigator.clipboard.writeText(val);
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
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs"
            >
              I Have Stored My API Secret Securely
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
