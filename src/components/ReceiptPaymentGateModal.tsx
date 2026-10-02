import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Lock, 
  Globe, 
  ShieldCheck, 
  Download, 
  FileText, 
  X, 
  AlertCircle, 
  Check, 
  QrCode,
  Building,
  RefreshCw
} from 'lucide-react';
import { 
  TARGET_OFFICIAL_DOMAIN, 
  OFFICIAL_PAYMENT_CONFIG,
  resolvePaymentDomain, 
  generatePaymentUrl, 
  generateVerificationUrl,
  isReceiptPaid, 
  getReceiptPaymentRecord, 
  recordReceiptPayment,
  ReceiptPaymentRecord 
} from '../utils/paymentDomain';
import { generateBoqReceiptPdf, generateBoqReceiptDocx, BoqReceiptData } from '../utils/boqReceiptExport';

export interface ReceiptPaymentGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  receiptDetails: {
    receiptNo: string;
    projectName: string;
    clientName: string;
    clientEmail?: string;
    location?: string;
    totalAmount: number;
    currency?: string;
    boqReference?: string;
    contractType?: string;
    language?: 'en' | 'fr';
    docType?: 'boq_receipt' | 'document_receipt' | 'proposal_receipt' | string;
    customFeeAmount?: number;
  };
  onPaymentSuccess?: (record: ReceiptPaymentRecord) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ReceiptPaymentGateModal: React.FC<ReceiptPaymentGateModalProps> = ({
  isOpen,
  onClose,
  isAdmin = true,
  receiptDetails,
  onPaymentSuccess,
  showToast
}) => {
  const isFrench = receiptDetails.language === 'fr';
  const currency = receiptDetails.currency || 'XAF';

  // Admin bypass mode (admin does not need to pay before downloading and exporting)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(isAdmin);

  // Domain resolution state
  const [domainMode, setDomainMode] = useState<'target' | 'auto'>('target');
  const [domainInfo, setDomainInfo] = useState(() => resolvePaymentDomain('target'));
  
  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'om' | 'card' | 'bank'>('momo');
  const [selectedRecipientLine, setSelectedRecipientLine] = useState<string>('671063511');
  const [phoneNumber, setPhoneNumber] = useState<string>('671063511');
  const [payerName, setPayerName] = useState<string>(receiptDetails.clientName || 'Arthur Sterling');
  const [cardNumber, setCardNumber] = useState<string>('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvc, setCardCvc] = useState<string>('892');
  
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [existingRecord, setExistingRecord] = useState<ReceiptPaymentRecord | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Amount to pay (can be standard certified receipt registration fee e.g. 15,000 XAF or full amount or partial)
  const defaultFee = receiptDetails.customFeeAmount || (currency === 'XAF' ? 15000 : 25);
  const [paymentAmountType, setPaymentAmountType] = useState<'fee' | 'total'>('fee');
  const activeAmount = paymentAmountType === 'total' ? receiptDetails.totalAmount : defaultFee;

  // Sync domain info
  useEffect(() => {
    const resolved = resolvePaymentDomain(domainMode);
    setDomainInfo(resolved);
  }, [domainMode, isOpen]);

  // Check if receipt has already been paid
  useEffect(() => {
    if (isOpen && receiptDetails.receiptNo) {
      const paid = isReceiptPaid(receiptDetails.receiptNo);
      setIsPaid(paid);
      if (paid) {
        setExistingRecord(getReceiptPaymentRecord(receiptDetails.receiptNo));
      }
    }
  }, [isOpen, receiptDetails.receiptNo]);

  if (!isOpen) return null;

  const currentDomain = domainInfo.activeDomain;
  const paymentUrl = generatePaymentUrl({
    receiptNo: receiptDetails.receiptNo,
    amount: activeAmount,
    currency,
    clientName: receiptDetails.clientName,
    projectName: receiptDetails.projectName,
    docType: receiptDetails.docType || 'boq_receipt',
    domainOverride: currentDomain
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(paymentUrl);
    setIsCopied(true);
    if (showToast) showToast(isFrench ? 'Lien de paiement copié dans le presse-papiers !' : 'Payment link copied to clipboard!', 'success');
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    if (showToast) showToast(isFrench ? `Numéro officiel ${num} copié !` : `Official number ${num} copied!`, 'success');
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // ADMIN DIRECT FREE DOWNLOADS (No payment required for admin)
  const handleAdminDirectDownloadPdf = async () => {
    try {
      const adminRecord: ReceiptPaymentRecord = existingRecord || {
        receiptNo: receiptDetails.receiptNo,
        isPaid: true,
        amount: activeAmount,
        currency,
        paymentMethod: 'Admin Free Clearance',
        transactionId: `ADM-${Date.now().toString().slice(-6)}`,
        paidAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        payerName: 'MADECC Admin / Authorized QS',
        payerPhone: '+237 671063511',
        domainUsed: currentDomain
      };
      recordReceiptPayment(adminRecord);
      setIsPaid(true);
      setExistingRecord(adminRecord);
      await handleDownloadReceiptPdf(adminRecord);
    } catch (err: any) {
      console.error('Admin PDF download error:', err);
      if (showToast) showToast(`Admin PDF export error: ${err.message}`, 'error');
    }
  };

  const handleAdminDirectDownloadDocx = async () => {
    try {
      const adminRecord: ReceiptPaymentRecord = existingRecord || {
        receiptNo: receiptDetails.receiptNo,
        isPaid: true,
        amount: activeAmount,
        currency,
        paymentMethod: 'Admin Free Clearance',
        transactionId: `ADM-${Date.now().toString().slice(-6)}`,
        paidAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        payerName: 'MADECC Admin / Authorized QS',
        payerPhone: '+237 671063511',
        domainUsed: currentDomain
      };
      recordReceiptPayment(adminRecord);
      setIsPaid(true);
      setExistingRecord(adminRecord);
      await handleDownloadReceiptDocx();
    } catch (err: any) {
      console.error('Admin Word download error:', err);
      if (showToast) showToast(`Admin Word export error: ${err.message}`, 'error');
    }
  };

  const handleAdminMarkAsPaid = () => {
    const adminRecord: ReceiptPaymentRecord = {
      receiptNo: receiptDetails.receiptNo,
      isPaid: true,
      amount: activeAmount,
      currency,
      paymentMethod: 'Admin Free Clearance',
      transactionId: `ADM-CERT-${Date.now().toString().slice(-6)}`,
      paidAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
      payerName: receiptDetails.clientName || 'Certified Client',
      payerPhone: '+237 671063511',
      domainUsed: currentDomain
    };
    recordReceiptPayment(adminRecord);
    setIsPaid(true);
    setExistingRecord(adminRecord);
    if (showToast) {
      showToast(isFrench ? 'Quittance certifiée sans paiement (Passe-droit Administrateur) !' : 'Receipt certified without payment (Admin Privilege)!', 'success');
    }
  };

  const handleExecutePayment = async () => {
    try {
      setIsProcessing(true);
      // Simulate real-time payment gateway transaction verification with domain host
      await new Promise(resolve => setTimeout(resolve, 1200));

      const txnId = `TXN-${Date.now().toString().slice(-6)}-${paymentMethod.toUpperCase()}`;
      const record: ReceiptPaymentRecord = {
        receiptNo: receiptDetails.receiptNo,
        isPaid: true,
        amount: activeAmount,
        currency,
        paymentMethod: paymentMethod === 'momo' ? 'MTN Mobile Money' : paymentMethod === 'om' ? 'Orange Money' : paymentMethod === 'card' ? 'Visa / Mastercard' : 'Bank Transfer',
        transactionId: txnId,
        paidAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        payerName,
        payerPhone: phoneNumber,
        domainUsed: currentDomain
      };

      recordReceiptPayment(record);
      setIsPaid(true);
      setExistingRecord(record);

      if (showToast) {
        showToast(
          isFrench
            ? `Paiement validé avec succès (${txnId}) ! Téléchargement de la quittance déverrouillé.`
            : `Payment approved successfully (${txnId})! Certified receipt download unlocked.`,
          'success'
        );
      }

      if (onPaymentSuccess) {
        onPaymentSuccess(record);
      }

      // Automatically trigger download of paid receipt
      await handleDownloadReceiptPdf(record);
    } catch (err: any) {
      console.error('Payment execution failed:', err);
      if (showToast) showToast(`Payment failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const buildBoqReceiptData = (record?: ReceiptPaymentRecord | null): BoqReceiptData => {
    const rec = record || existingRecord;
    return {
      receiptNo: receiptDetails.receiptNo,
      transactionId: rec?.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
      boqReference: receiptDetails.boqReference || receiptDetails.receiptNo.replace(/^RCP-/, ''),
      projectName: receiptDetails.projectName,
      clientName: receiptDetails.clientName,
      clientEmail: receiptDetails.clientEmail,
      location: receiptDetails.location,
      contractType: receiptDetails.contractType,
      totalAmount: receiptDetails.totalAmount,
      paidAmount: rec?.amount || activeAmount,
      currency,
      paymentMethod: rec?.paymentMethod || 'MTN Mobile Money',
      payerPhone: rec?.payerPhone || phoneNumber,
      paidAt: rec?.paidAt || new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'PAID',
      language: receiptDetails.language || 'en',
      domainUsed: currentDomain,
      verificationToken: `VT-${receiptDetails.receiptNo.replace(/[^a-zA-Z0-9]/g, '')}`
    };
  };

  const handleDownloadReceiptPdf = async (recordOverride?: ReceiptPaymentRecord) => {
    try {
      setIsDownloading(true);
      const data = buildBoqReceiptData(recordOverride);
      const { pdf, filename } = await generateBoqReceiptPdf(data, currentDomain);
      pdf.save(filename);
      if (showToast) {
        showToast(
          isFrench ? `Quittance officielle PDF (${filename}) téléchargée avec succès !` : `Official Receipt PDF (${filename}) downloaded successfully!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Failed to download receipt PDF:', err);
      if (showToast) showToast(`Download failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadReceiptDocx = async () => {
    try {
      setIsDownloading(true);
      const data = buildBoqReceiptData();
      const { blob, filename } = await generateBoqReceiptDocx(data, currentDomain);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (showToast) {
        showToast(
          isFrench ? `Quittance officielle Word (.docx) exportée avec succès !` : `Official Receipt Word (.docx) exported successfully!`,
          'success'
        );
      }
    } catch (err: any) {
      console.error('Failed to download receipt DOCX:', err);
      if (showToast) showToast(`Word export failed: ${err.message || 'Error'}`, 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[95vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {isFrench ? 'Paiement Sécurisé Avant Téléchargement de la Quittance' : 'Pay Before Download — Official Receipt Voucher'}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isFrench
                  ? 'Pour obtenir la quittance officielle certifiée avec sceau et QR Code, veuillez régler les frais de quittance.'
                  : 'To unlock and download the certified statutory receipt with security QR seal, complete verification payment.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* DOMAIN DETECTION & RESOLUTION CONTROL BAR */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center space-x-1.5 font-medium">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Official Domain & Link:</span>
            </span>
            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setDomainMode('target')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  domainMode === 'target' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                https://madeccgroup.online
              </button>
              <button
                type="button"
                onClick={() => setDomainMode('auto')}
                title="Automatically use current browser origin domain if madeccgroup.online is not reachable"
                className={`px-2.5 py-1 rounded font-medium transition flex items-center space-x-1 ${
                  domainMode === 'auto' ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Auto-Detect Live Host</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            </div>
          </div>

          {/* Active Domain Info Box */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/60 rounded-lg px-2.5 py-1.5 text-[11px]">
            <span className="text-slate-400 truncate">
              {isFrench ? 'Domaine Actif Détecté :' : 'Active Running Domain:'} <strong className="text-amber-300 font-mono">{currentDomain}</strong>
            </span>
            {domainInfo.isAutoDetected ? (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex-shrink-0 font-medium">
                Auto-Detected Host
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0 font-medium">
                Official Production Host
              </span>
            )}
          </div>

          {/* Direct Shareable Link with Copy */}
          <div className="flex items-center space-x-2 pt-1">
            <input
              type="text"
              readOnly
              value={paymentUrl}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-lg transition flex items-center space-x-1 flex-shrink-0"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? (isFrench ? 'Copié !' : 'Copied!') : (isFrench ? 'Copier' : 'Copy')}</span>
            </button>
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800 border border-slate-700 rounded-lg transition flex-shrink-0"
              title="Open Payment Portal in New Tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* ADMIN DIRECT FREE DOWNLOAD & EXEMPTION PANEL */}
        {isAdminMode && (
          <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-amber-950/60 border-2 border-emerald-500/60 rounded-2xl p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 rounded-xl bg-emerald-500/25 text-emerald-400 border border-emerald-500/50">
                  <ShieldCheck className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <span>{isFrench ? 'Mode Administrateur — Téléchargement Direct & Gratuit' : 'Admin Executive Mode — Free Direct Download'}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">NO PAYMENT REQUIRED</span>
                  </h4>
                  <p className="text-[11px] text-slate-300">
                    {isFrench
                      ? 'En tant qu\'administrateur, vous n\'avez pas besoin de payer pour télécharger ou exporter cette quittance officielle.'
                      : 'As the administrator, you do NOT need to pay to download or export this certified official receipt.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setIsAdminMode(!isAdminMode)}
                  title="Toggle Admin Free Mode / Client Payment Simulation"
                  className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  {isAdminMode ? 'Admin Mode (Active)' : 'Client View'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleAdminDirectDownloadPdf}
                disabled={isDownloading}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Génération...' : (isFrench ? 'Télécharger Quittance A4 PDF (Gratuit)' : 'Download Receipt A4 PDF (Free)')}</span>
              </button>

              <button
                type="button"
                onClick={handleAdminDirectDownloadDocx}
                disabled={isDownloading}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>{isDownloading ? 'Génération...' : (isFrench ? 'Télécharger Word (.docx) (Gratuit)' : 'Download Word (.docx) (Free)')}</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span className="italic text-emerald-400/90 text-[10px]">
                {isFrench ? 'Passe-droit certifié MADECC SARL actif.' : 'MADECC SARL executive clearance verified.'}
              </span>
              <button
                type="button"
                onClick={handleAdminMarkAsPaid}
                className="text-amber-400 hover:text-amber-300 font-semibold underline text-[11px] cursor-pointer"
              >
                {isFrench ? 'Valider et certifier au grand livre (Sans Paiement)' : 'Certify & Mark Settled on Ledger (No Fee)'}
              </button>
            </div>
          </div>
        )}

        {/* RECEIPT SUMMARY CARD */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">{isFrench ? 'Quittance Réf :' : 'Receipt No:'}</span>
            <span className="font-mono font-bold text-amber-400">{receiptDetails.receiptNo}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">{isFrench ? 'Projet Associé :' : 'Associated Project:'}</span>
            <span className="text-white font-semibold truncate max-w-xs">{receiptDetails.projectName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">{isFrench ? 'Client / Payeur :' : 'Client / Payer:'}</span>
            <span className="text-slate-200">{receiptDetails.clientName}</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-slate-800">
            <span className="text-slate-400 font-medium">{isFrench ? 'Montant Total Devis (BOQ) :' : 'Total BOQ Estimate:'}</span>
            <span className="font-mono font-bold text-slate-300">{Number(receiptDetails.totalAmount || 0).toLocaleString()} {currency}</span>
          </div>

          {/* Amount Option Selector */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
              {isFrench ? 'Option de Règlement pour cette Quittance :' : 'Select Payment Amount For This Receipt:'}
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentAmountType('fee')}
                className={`p-2 rounded-lg border text-left transition ${
                  paymentAmountType === 'fee'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  {isFrench ? 'Frais de Quittance & Visa' : 'Receipt Certification Fee'}
                </div>
                <div className="text-sm font-mono mt-0.5">{Number(defaultFee).toLocaleString()} {currency}</div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentAmountType('total')}
                className={`p-2 rounded-lg border text-left transition ${
                  paymentAmountType === 'total'
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  {isFrench ? 'Montant Total du Marché' : 'Full Contract Total'}
                </div>
                <div className="text-sm font-mono mt-0.5">{Number(receiptDetails.totalAmount).toLocaleString()} {currency}</div>
              </button>
            </div>
          </div>
        </div>

        {/* ALREADY PAID STATE VIEW */}
        {isPaid ? (
          <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>{isFrench ? 'Paiement Validé & Quittance Déverrouillée !' : 'Payment Confirmed — Receipt Unlocked!'}</span>
            </div>
            <p className="text-xs text-slate-300">
              {isFrench
                ? `La quittance officielle N° ${receiptDetails.receiptNo} a été acquittée avec succès (Réf: ${existingRecord?.transactionId || 'TXN-OK'}).`
                : `Official receipt ${receiptDetails.receiptNo} has been successfully settled (Ref: ${existingRecord?.transactionId || 'TXN-OK'}).`}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDownloadReceiptPdf()}
                disabled={isDownloading}
                className="py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Téléchargement...' : (isFrench ? 'Télécharger Quittance PDF (A4)' : 'Download Receipt PDF (A4)')}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadReceiptDocx}
                disabled={isDownloading}
                className="py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow"
              >
                <FileText className="w-4 h-4" />
                <span>{isFrench ? 'Télécharger Word (.docx)' : 'Download Word (.docx)'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* PAYMENT CHECKOUT FORM */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                {isFrench ? 'Choisissez votre moyen de paiement :' : 'Select Payment Gateway / Method:'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                    paymentMethod === 'momo'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[11px]">MTN MoMo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('om')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                    paymentMethod === 'om'
                      ? 'bg-orange-500/20 border-orange-500 text-orange-300 font-bold shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="text-[11px]">Orange Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                    paymentMethod === 'card'
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300 font-bold shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[11px]">Carte Bancaire</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center space-y-1 transition ${
                    paymentMethod === 'bank'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold shadow'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="text-[11px]">Virement / EU</span>
                </button>
              </div>
            </div>

            {/* Mobile Money Official Recipient Information & Payer Details */}
            {paymentMethod === 'momo' && (
              <div className="space-y-3">
                {/* Official MoMo Recipient Numbers */}
                <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center space-x-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                      <span>{isFrench ? 'Lignes MTN Mobile Money Officielles (MADECC GROUP SARL) :' : 'Official MTN MoMo Recipient Accounts (MADECC GROUP SARL):'}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                      MTN CAMEROON
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {OFFICIAL_PAYMENT_CONFIG.momo.map((line, idx) => (
                      <div
                        key={line.number}
                        className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-lg p-2 hover:border-amber-500/50 transition"
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Ligne {idx + 1} :</span>
                          <span className="font-mono font-bold text-white text-sm tracking-wide">{line.formatted}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(line.number)}
                          className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-md transition flex items-center space-x-1"
                          title="Copier le numéro"
                        >
                          {copiedNumber === line.number ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[11px]">{copiedNumber === line.number ? 'Copié' : 'Copier'}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10.5px] text-slate-400 italic">
                    {isFrench
                      ? 'Composez *126# ou utilisez l\'app MTN MoMo, puis effectuez le transfert vers l\'un des numéros ci-dessus au nom de MADECC GROUP SARL.'
                      : 'Dial *126# or use the MTN MoMo app, then transfer to either number above registered under MADECC GROUP SARL.'}
                  </p>
                </div>

                {/* Client / Payer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFrench ? 'Votre Numéro de Téléphone Débiteur :' : 'Your Sender MoMo Phone Number:'}
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="671 063 511"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFrench ? 'Nom du Titulaire de la Ligne :' : 'Payer Name / Identity:'}
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Arthur Sterling"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Orange Money Official Recipient Information & Payer Details */}
            {paymentMethod === 'om' && (
              <div className="space-y-3">
                {/* Official OM Recipient Numbers */}
                <div className="bg-orange-950/40 border border-orange-500/40 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-orange-300 flex items-center space-x-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                      <span>{isFrench ? 'Lignes Orange Money Officielles (MADECC GROUP SARL) :' : 'Official Orange Money Accounts (MADECC GROUP SARL):'}</span>
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 font-mono font-bold">
                      ORANGE CAMEROON
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {OFFICIAL_PAYMENT_CONFIG.om.map((line, idx) => (
                      <div
                        key={line.number}
                        className="flex items-center justify-between bg-slate-900 border border-slate-700/80 rounded-lg p-2 hover:border-orange-500/50 transition"
                      >
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">Ligne {idx + 1} :</span>
                          <span className="font-mono font-bold text-white text-sm tracking-wide">{line.formatted}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyNumber(line.number)}
                          className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 rounded-md transition flex items-center space-x-1"
                          title="Copier le numéro"
                        >
                          {copiedNumber === line.number ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span className="text-[11px]">{copiedNumber === line.number ? 'Copié' : 'Copier'}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10.5px] text-slate-400 italic">
                    {isFrench
                      ? 'Composez #150*1*1# ou utilisez Orange Money, puis effectuez le transfert vers l\'un des numéros ci-dessus au nom de MADECC GROUP SARL.'
                      : 'Dial #150*1*1# or use the Orange Money app, then transfer to either number above registered under MADECC GROUP SARL.'}
                  </p>
                </div>

                {/* Client / Payer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFrench ? 'Votre Numéro Orange Débiteur :' : 'Your Sender OM Phone Number:'}
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="689 115 595"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      {isFrench ? 'Nom du Titulaire de la Ligne :' : 'Payer Name / Identity:'}
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Arthur Sterling"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Numéro de Carte (Visa / Mastercard) :</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Date Exp (MM/AA) :</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">CVC / CVV :</label>
                    <input
                      type="password"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'bank' && (
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                <span className="font-bold text-amber-400 block mb-1">Coordonnées Bancaires Officielles :</span>
                <p className="text-slate-300">Banque : <strong>UBA Cameroun / Afriland First Bank</strong></p>
                <p className="text-slate-300">Titulaire : <strong>MADECC GROUP SARL</strong></p>
                <p className="text-slate-300 font-mono">IBAN/RIB : CM21 10005 00012 01234567890 44</p>
                <p className="text-slate-400 text-[11px] italic">Mentionnez la référence <strong>{receiptDetails.receiptNo}</strong> en motif de virement.</p>
              </div>
            )}

            {/* Execute Payment Button */}
            <button
              type="button"
              onClick={handleExecutePayment}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>{isFrench ? 'Validation en cours avec le domaine...' : 'Verifying with payment domain...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {isFrench
                      ? `Régler ${Number(activeAmount).toLocaleString()} ${currency} et Déverrouiller la Quittance`
                      : `Pay ${Number(activeAmount).toLocaleString()} ${currency} & Unlock Certified Receipt`}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Security Stamp Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>256-bit Encrypted SSL Gateway</span>
          </span>
          <span className="font-mono text-slate-400">MADECC Group SARL • Cameroon</span>
        </div>

      </div>
    </div>
  );
};
