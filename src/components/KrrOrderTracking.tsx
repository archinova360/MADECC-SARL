import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Package, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Lock, 
  CreditCard, 
  Smartphone, 
  Upload, 
  Copy, 
  FileText, 
  Check, 
  ArrowLeft,
  ShieldCheck,
  Building2,
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { useTheme } from '../lib/ThemeContext.tsx';

interface OrderItem {
  id: number;
  productId: number;
  productTitle: string;
  productSku: string;
  productFormat: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  downloadCount: number;
  isDigitalAvailable: boolean;
  downloadUrl: string | null;
}

interface PaymentSubmission {
  id: number;
  amount: number;
  paymentMethod: string;
  transactionReference: string;
  payerPhone: string;
  payerName: string;
  proofImageUrl?: string;
  status: 'AWAITING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
}

interface TrackedOrder {
  id: number;
  orderReference: string;
  accessToken?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp?: string;
  shippingCity: string;
  shippingAddress?: string;
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  currency: string;
  orderStatus: 'PENDING' | 'PROCESSING' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'AWAITING_VERIFICATION' | 'VERIFIED_PAID' | 'PAYMENT_REJECTED' | 'REFUNDED';
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
  payments: PaymentSubmission[];
  paymentInstructions?: string;
  mtnNumbers?: string;
  orangeNumbers?: string;
}

interface KrrOrderTrackingProps {
  initialOrderRef?: string;
  initialToken?: string;
  onNavigateToTab?: (tab: string) => void;
}

export const KrrOrderTracking: React.FC<KrrOrderTrackingProps> = ({
  initialOrderRef = '',
  initialToken = '',
  onNavigateToTab
}) => {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [orderReference, setOrderReference] = useState(initialOrderRef);
  const [accessToken, setAccessToken] = useState(initialToken);
  const [customerEmail, setCustomerEmail] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment proof submission state
  const [paymentTxid, setPaymentTxid] = useState('');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'ORANGE_MONEY' | 'BANK_TRANSFER'>('MTN_MOMO');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  // Check URL search parameters on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlOrder = params.get('order') || initialOrderRef;
      const urlToken = params.get('token') || initialToken;
      const urlEmail = params.get('email');

      if (urlOrder) {
        setOrderReference(urlOrder);
        if (urlToken) setAccessToken(urlToken);
        if (urlEmail) setCustomerEmail(urlEmail);
        fetchOrderDetails(urlOrder, urlToken, urlEmail || '');
      }
    } catch {}
  }, []);

  const fetchOrderDetails = async (ref: string, token: string, email: string) => {
    if (!ref.trim()) {
      setErrorMsg('Please enter your order reference.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const query = new URLSearchParams({ orderReference: ref.trim() });
      if (token.trim()) query.set('accessToken', token.trim());
      if (email.trim()) query.set('customerEmail', email.trim().toLowerCase());

      const res = await fetch(`/api/sales/orders/track?${query.toString()}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Order lookup failed');
      }

      setTrackedOrder(data.order);
      setPayerName(data.order.customerName);
      setPayerPhone(data.order.customerPhone);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to locate order');
      setTrackedOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrderDetails(orderReference, accessToken, customerEmail);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFile(file);
    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setProofPreviewUrl(data.url);
        showToast('Receipt image uploaded successfully.', 'success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      showToast('Error uploading proof image: ' + err.message, 'error');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handlePaymentProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedOrder) return;

    if (!paymentTxid.trim()) {
      showToast('Please enter the Mobile Money or bank transaction reference (TXID).', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/sales/orders/${trackedOrder.orderReference}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionReference: paymentTxid.trim(),
          payerName: payerName.trim() || trackedOrder.customerName,
          payerPhone: payerPhone.trim() || trackedOrder.customerPhone,
          paymentMethod,
          proofImageUrl: proofPreviewUrl || null,
          accessToken: accessToken || undefined,
          customerEmail: customerEmail || undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment submission failed');
      }

      showToast('Payment proof submitted successfully! Staff will verify shortly.', 'success');
      // Refresh order state
      fetchOrderDetails(orderReference, accessToken, customerEmail);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit payment proof', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [isFastUnlocking, setIsFastUnlocking] = useState(false);

  const handleFastUnlockOrder = async () => {
    if (!trackedOrder) return;
    setIsFastUnlocking(true);
    try {
      const res = await fetch(`/api/sales/orders/${trackedOrder.orderReference}/fast-unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Fast unlock failed');
      }
      showToast('Order approved! Digital textbook download is now immediately available.', 'success');
      // Refresh order state
      fetchOrderDetails(trackedOrder.orderReference, accessToken || trackedOrder.accessToken, customerEmail || trackedOrder.customerEmail);
    } catch (err: any) {
      showToast(err.message || 'Fast unlock failed', 'error');
    } finally {
      setIsFastUnlocking(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLabel(label);
    setTimeout(() => setCopiedLabel(null), 2500);
    showToast(`Copied ${label} to clipboard!`, 'info');
  };

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto ${
      theme === 'light' ? 'text-slate-900' : 'text-slate-100'
    }`} id="krr-order-tracking">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
            <Package className="w-4 h-4" />
            <span>KRR Group Order Verification & Fulfilment</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Order Tracking & Digital Downloads
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track order delivery status, submit Mobile Money payment receipts, and download secured digital textbooks.
          </p>
        </div>

        {onNavigateToTab && (
          <button
            onClick={() => onNavigateToTab('store')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Bookstore</span>
          </button>
        )}
      </div>

      {/* Lookup Form */}
      <div className={`p-6 rounded-2xl border mb-8 shadow-md ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <form onSubmit={handleLookupSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Order Reference *</label>
            <input
              type="text"
              required
              value={orderReference}
              onChange={e => setOrderReference(e.target.value.toUpperCase())}
              placeholder="e.g. KRR-ORD-2026-0042"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Customer Email or Access Token *</label>
            <input
              type="text"
              value={accessToken || customerEmail}
              onChange={e => {
                const val = e.target.value;
                if (val.startsWith('krr_token_')) {
                  setAccessToken(val);
                } else {
                  setCustomerEmail(val);
                }
              }}
              placeholder="Email address or token"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Track Order</span>
                </>
              )}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Tracked Order Details */}
      {trackedOrder && (
        <div className="space-y-6">
          
          {/* Top Status Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-slate-400 block">Order Reference</span>
                <span className="text-xl font-black text-amber-400 font-mono tracking-wider">
                  {trackedOrder.orderReference}
                </span>
                <span className="text-xs text-slate-500 block font-mono mt-0.5">
                  Placed on {new Date(trackedOrder.createdAt).toLocaleDateString()} &bull; Fulfilment: {trackedOrder.deliveryMethod}
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Order Status */}
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Order Status</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    trackedOrder.orderStatus === 'COMPLETED'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : trackedOrder.orderStatus === 'PROCESSING'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : trackedOrder.orderStatus === 'DISPATCHED'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {trackedOrder.orderStatus}
                  </span>
                </div>

                {/* Payment Status */}
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Payment Status</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider ${
                    trackedOrder.paymentStatus === 'VERIFIED_PAID'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : trackedOrder.paymentStatus === 'AWAITING_VERIFICATION'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : trackedOrder.paymentStatus === 'PAYMENT_REJECTED'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {trackedOrder.paymentStatus === 'VERIFIED_PAID' ? '✓ VERIFIED PAID' : trackedOrder.paymentStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Stepper Flow */}
            <div className="grid grid-cols-4 gap-2 mt-6 text-center text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span className="text-slate-200 block font-bold">1. Placed</span>
                <span className="text-[10px] text-slate-500">Recorded</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                trackedOrder.paymentStatus === 'AWAITING_VERIFICATION' || trackedOrder.paymentStatus === 'VERIFIED_PAID'
                  ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}>
                <Clock className="w-4 h-4 mx-auto mb-1" />
                <span className="block font-bold">2. Payment</span>
                <span className="text-[10px]">{trackedOrder.paymentStatus === 'VERIFIED_PAID' ? 'Verified' : 'In Review'}</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                trackedOrder.orderStatus === 'PROCESSING' || trackedOrder.orderStatus === 'COMPLETED'
                  ? 'bg-slate-950 border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}>
                <Package className="w-4 h-4 mx-auto mb-1" />
                <span className="block font-bold">3. Processing</span>
                <span className="text-[10px]">Preparation</span>
              </div>
              <div className={`p-3 rounded-xl border ${
                trackedOrder.orderStatus === 'COMPLETED'
                  ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-950/50 border-slate-800 text-slate-500'
              }`}>
                <ShieldCheck className="w-4 h-4 mx-auto mb-1" />
                <span className="block font-bold">4. Fulfilled</span>
                <span className="text-[10px]">Unlocked</span>
              </div>
            </div>
          </div>

          {/* Payment Action Callout (If Unpaid or Rejected) */}
          {(trackedOrder.paymentStatus === 'UNPAID' || trackedOrder.paymentStatus === 'PAYMENT_REJECTED') && (
            <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-300">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-base text-white">Payment Submission Required</h3>
                  <p className="text-xs text-amber-200/80 leading-relaxed mt-0.5">
                    Please transfer the total amount of <strong className="text-white font-mono">{trackedOrder.grandTotal.toLocaleString()} XAF</strong> using MTN Mobile Money or Orange Money. Then record your transaction reference (TXID) below.
                  </p>
                </div>
              </div>

              {/* Official Numbers Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">MTN Mobile Money Numbers:</span>
                    <span className="text-sm font-bold text-white font-mono">{trackedOrder.mtnNumbers || '671063511, 683316486'}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(trackedOrder.mtnNumbers || '671063511', 'MTN numbers')}
                    className="text-amber-400 hover:text-white p-2 rounded-lg bg-slate-800"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block">Orange Money Numbers:</span>
                    <span className="text-sm font-bold text-white font-mono">{trackedOrder.orangeNumbers || '689115595, 640194505'}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(trackedOrder.orangeNumbers || '689115595', 'Orange numbers')}
                    className="text-amber-400 hover:text-white p-2 rounded-lg bg-slate-800"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Submission Form */}
              <form onSubmit={handlePaymentProofSubmit} className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                  Submit Mobile Money Transaction Proof
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Transaction Ref / TXID *</label>
                    <input
                      type="text"
                      required
                      value={paymentTxid}
                      onChange={e => setPaymentTxid(e.target.value)}
                      placeholder="e.g. 1982736450"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Payer Name</label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={e => setPayerName(e.target.value)}
                      placeholder="Name on MoMo account"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">Payer Phone Number</label>
                    <input
                      type="tel"
                      value={payerPhone}
                      onChange={e => setPayerPhone(e.target.value)}
                      placeholder="+237 6XX XXX XXX"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Receipt Upload */}
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Upload Receipt Screenshot (Optional but speeds up verification)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isUploadingProof ? 'Uploading...' : 'Choose File'}</span>
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        disabled={isUploadingProof}
                      />
                    </label>
                    {proofPreviewUrl && (
                      <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                        <Check className="w-3 h-3" /> Proof attached
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || isUploadingProof}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Payment Verification Details</span>
                </button>
              </form>
            </div>
          )}

          {/* Under Review Notice */}
          {trackedOrder.paymentStatus === 'AWAITING_VERIFICATION' && (
            <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-blue-300 flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">Payment Verification in Progress</h4>
                <p className="text-xs text-blue-200/80 mt-1 leading-relaxed">
                  Your transaction reference has been logged. Our finance accounting team in Yaoundé is validating the incoming transfer with the telecom network. Your digital downloads and delivery tracking will activate immediately once approved.
                </p>
              </div>
            </div>
          )}

          {/* Admin / Instant Fast-Unlock Panel for Store Owner & Testing */}
          {trackedOrder.paymentStatus !== 'VERIFIED_PAID' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <span>Store Administrator &amp; Fast Approval Desk</span>
                    <span className="text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">Admin Bypass</span>
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Testing or approving this transaction? Click below to immediately approve this order and activate all PDF textbook downloads.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFastUnlockOrder}
                disabled={isFastUnlocking}
                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {isFastUnlocking ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Unlocking...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>⚡ 1-Click Fast Unlock (Activate Downloads)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Verified Success Notice */}
          {trackedOrder.paymentStatus === 'VERIFIED_PAID' && (
            <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-white">Payment Verified &amp; Files Unlocked</h4>
                <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                  Your payment of <strong className="text-white font-mono">{trackedOrder.grandTotal.toLocaleString()} XAF</strong> has been confirmed. You may now download your secured PDF textbooks below.
                </p>
              </div>
            </div>
          )}

          {/* Purchased Items & Digital Downloads Section */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <h3 className="font-bold text-base text-white mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-500" />
              <span>Purchased Publications &amp; Digital Downloads</span>
            </h3>

            <div className="divide-y divide-slate-800">
              {trackedOrder.items.map(item => (
                <div key={item.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-white">{item.productTitle}</h4>
                    <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                      <span>SKU: {item.productSku}</span>
                      <span>Format: {item.productFormat}</span>
                      <span>Qty: {item.quantity}</span>
                      <span className="text-amber-400 font-bold">{item.totalPrice.toLocaleString()} XAF</span>
                    </div>
                  </div>

                  {/* Download Action Button */}
                  <div>
                    {item.isDigitalAvailable && item.downloadUrl ? (
                      <a
                        href={item.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md transition-all cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF Manual</span>
                      </a>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-500">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unlocks upon verification</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Total breakdown */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-baseline font-mono text-xs">
              <span className="text-slate-400">Total Paid / Payable:</span>
              <span className="text-base font-extrabold text-amber-400">
                {trackedOrder.grandTotal.toLocaleString()} XAF
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KrrOrderTracking;
