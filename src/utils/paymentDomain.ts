/**
 * PAYMENT DOMAIN & VERIFICATION URL RESOLVER
 * 
 * Target official domain: https://madeccgroup.online
 * Automatically detects current running environment (e.g. preview, dev, production Cloud Run)
 * if madeccgroup.online is not available or when running in local/test preview.
 */

export const TARGET_OFFICIAL_DOMAIN = 'https://madeccgroup.online';

/**
 * Official MADECC payment gateway numbers and accounts:
 * MoMo: 671063511, 683316486
 * OM: 689115595, 640194505
 */
export const OFFICIAL_PAYMENT_CONFIG = {
  merchantName: 'MADECC GROUP SARL',
  momo: [
    { number: '671063511', formatted: '671 063 511', label: 'MTN Mobile Money Line 1 (Primary / Finance)' },
    { number: '683316486', formatted: '683 316 486', label: 'MTN Mobile Money Line 2 (Operations / Accounting)' }
  ],
  om: [
    { number: '689115595', formatted: '689 115 595', label: 'Orange Money Line 1 (Commercial / Tenders)' },
    { number: '640194505', formatted: '640 194 505', label: 'Orange Money Line 2 (Cash Desk / Billing)' }
  ],
  bank: {
    bankName: 'UBA Cameroun / Afriland First Bank',
    accountName: 'MADECC GROUP SARL',
    ibanRib: 'CM21 10005 00012 01234567890 44'
  }
};

export interface DomainInfo {
  activeDomain: string;
  targetDomain: string;
  detectedDomain: string;
  isTargetDomainActive: boolean;
  isAutoDetected: boolean;
}

/**
 * Detects the current domain where the application is executing.
 */
export function getDetectedDomain(): string {
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.includes('about:blank')) {
      return origin;
    }
  }
  return TARGET_OFFICIAL_DOMAIN;
}

/**
 * Resolves the available domain, preferring the target official domain if available/configured,
 * or automatically falling back to the current active environment domain.
 */
export function resolvePaymentDomain(mode: 'target' | 'auto' | 'default' = 'default'): DomainInfo {
  const detected = getDetectedDomain();
  const isRunningOnTarget = detected.toLowerCase().includes('madeccgroup.online');

  let activeDomain = TARGET_OFFICIAL_DOMAIN;
  let isAuto = false;

  if (mode === 'target') {
    activeDomain = TARGET_OFFICIAL_DOMAIN;
    isAuto = false;
  } else if (mode === 'auto') {
    activeDomain = detected;
    isAuto = true;
  } else {
    // Default: Target domain https://madeccgroup.online is preferred, 
    // but if not running on it, auto-detects the active available host
    if (isRunningOnTarget) {
      activeDomain = TARGET_OFFICIAL_DOMAIN;
      isAuto = false;
    } else {
      activeDomain = detected || TARGET_OFFICIAL_DOMAIN;
      isAuto = Boolean(detected && !isRunningOnTarget);
    }
  }

  return {
    activeDomain,
    targetDomain: TARGET_OFFICIAL_DOMAIN,
    detectedDomain: detected,
    isTargetDomainActive: activeDomain === TARGET_OFFICIAL_DOMAIN,
    isAutoDetected: isAuto
  };
}

export interface PaymentLinkParams {
  receiptNo: string;
  amount: number | string;
  currency?: string;
  clientName?: string;
  projectName?: string;
  docType?: 'boq_receipt' | 'document_receipt' | 'proposal_receipt' | string;
  verificationToken?: string;
  domainOverride?: string;
}

/**
 * Generates an official payment link at the resolved domain.
 * Supports both madeccgroup.online and auto-detected active host.
 */
export function generatePaymentUrl(params: PaymentLinkParams): string {
  const domain = params.domainOverride || resolvePaymentDomain().activeDomain;
  const baseUrl = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  
  const queryParams = new URLSearchParams({
    receipt: String(params.receiptNo || 'RCP-001'),
    amount: String(params.amount || '0'),
    currency: String(params.currency || 'XAF'),
    client: String(params.clientName || 'Client'),
    project: String(params.projectName || 'Tender'),
    type: String(params.docType || 'boq_receipt'),
    token: String(params.verificationToken || `VT-${Date.now()}`),
    checkout: '1'
  });

  return `${baseUrl}/?pay=1&${queryParams.toString()}`;
}

/**
 * Parses payment details from current window location search parameters if present.
 */
export function parsePaymentUrlParams(): PaymentLinkParams | null {
  if (typeof window === 'undefined') return null;
  const searchParams = new URLSearchParams(window.location.search);
  const isPayRoute = searchParams.get('pay') === '1' || searchParams.get('checkout') === '1' || window.location.pathname.startsWith('/pay');
  const receiptNo = searchParams.get('receipt');

  if (!isPayRoute && !receiptNo) return null;

  return {
    receiptNo: receiptNo || 'RCP-ONLINE',
    amount: Number(searchParams.get('amount')) || 15000,
    currency: searchParams.get('currency') || 'XAF',
    clientName: searchParams.get('client') || 'Client',
    projectName: searchParams.get('project') || 'Contract Works',
    docType: searchParams.get('type') || 'boq_receipt',
    verificationToken: searchParams.get('token') || undefined
  };
}

/**
 * Generates the official verification URL for QR codes.
 */
export function generateVerificationUrl(verificationToken: string, receiptNo: string, domainOverride?: string): string {
  const domain = domainOverride || resolvePaymentDomain().activeDomain;
  const baseUrl = domain.endsWith('/') ? domain.slice(0, -1) : domain;
  return `${baseUrl}/?verify=${encodeURIComponent(verificationToken)}&receipt=${encodeURIComponent(receiptNo)}`;
}

// ----------------------------------------------------------------------
// RECEIPT PAYMENT REGISTRY (Client-Side & Session Storage)
// ----------------------------------------------------------------------

export interface ReceiptPaymentRecord {
  receiptNo: string;
  isPaid: boolean;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionId: string;
  paidAt: string;
  payerName?: string;
  payerPhone?: string;
  domainUsed: string;
}

const STORAGE_PREFIX = 'madecc_receipt_paid_';

export function isReceiptPaid(receiptNo: string): boolean {
  if (!receiptNo || typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${receiptNo}`);
    if (!raw) return false;
    const record: ReceiptPaymentRecord = JSON.parse(raw);
    return record && record.isPaid === true;
  } catch {
    return false;
  }
}

export function getReceiptPaymentRecord(receiptNo: string): ReceiptPaymentRecord | null {
  if (!receiptNo || typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${receiptNo}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function recordReceiptPayment(data: ReceiptPaymentRecord): void {
  if (!data?.receiptNo || typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${data.receiptNo}`, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to persist receipt payment:', err);
  }
}
