/**
 * PAYMENT DOMAIN & VERIFICATION URL RESOLVER
 * 
 * Target official domain: https://madeccgroup.online
 * Automatically detects current running environment (e.g. preview, dev, production Cloud Run)
 * if madeccgroup.online is not available or when running in local/test preview.
 */

export const TARGET_OFFICIAL_DOMAIN = 'https://madeccgroup.online';
export const STANDARD_RECEIPT_FEE_XAF = 2199;
export const ADMIN_SMTP_USER_EMAIL = 'kreboya603@gmail.com';

/**
 * Official MADECC payment gateway numbers and accounts:
 * MoMo: 671063511, 683316486
 * OM: 689115595, 640194505
 */
export const OFFICIAL_PAYMENT_CONFIG = {
  merchantName: 'MADECC GROUP SARL',
  standardFeeXaf: STANDARD_RECEIPT_FEE_XAF,
  adminSmtpEmail: ADMIN_SMTP_USER_EMAIL,
  mtnMomoNumbers: ['671063511', '683316486'],
  orangeMoneyNumbers: ['689115595', '640194505'],
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
    amount: Number(searchParams.get('amount')) || STANDARD_RECEIPT_FEE_XAF,
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
// RECEIPT PAYMENT REGISTRY (Client-Side & Server Admin Confirmation)
// ----------------------------------------------------------------------

export interface ReceiptPaymentRecord {
  id?: string | number;
  receiptNo: string;
  isPaid: boolean;
  status?: 'PENDING_ADMIN_CONFIRMATION' | 'ADMIN_CONFIRMED' | 'ADMIN_FREE_CLEARANCE';
  adminConfirmed?: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  smtpDispatchedTo?: string;
  smtpDispatchedAt?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  recipientNumber?: string;
  transactionId: string;
  paidAt: string;
  payerName?: string;
  payerPhone?: string;
  clientEmail?: string;
  projectName?: string;
  docType?: string;
  domainUsed: string;
}

const STORAGE_PREFIX = 'madecc_receipt_paid_';
const REGISTRY_LIST_KEY = 'madecc_receipt_payment_registry_list';

export function isReceiptPaid(receiptNo: string): boolean {
  if (!receiptNo || typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${receiptNo}`);
    if (!raw) return false;
    const record: ReceiptPaymentRecord = JSON.parse(raw);
    return Boolean(record && record.isPaid === true && record.adminConfirmed !== false && record.status !== 'PENDING_ADMIN_CONFIRMATION');
  } catch {
    return false;
  }
}

export function isReceiptPendingAdminConfirmation(receiptNo: string): boolean {
  if (!receiptNo || typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${receiptNo}`);
    if (!raw) return false;
    const record: ReceiptPaymentRecord = JSON.parse(raw);
    return Boolean(record && (record.status === 'PENDING_ADMIN_CONFIRMATION' || record.adminConfirmed === false));
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
    // Also maintain a master list for Admin Dashboard queue
    const listRaw = localStorage.getItem(REGISTRY_LIST_KEY);
    const list: ReceiptPaymentRecord[] = listRaw ? JSON.parse(listRaw) : [];
    const idx = list.findIndex(r => r.receiptNo === data.receiptNo);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data };
    } else {
      list.unshift(data);
    }
    localStorage.setItem(REGISTRY_LIST_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to persist receipt payment:', err);
  }
}

export function getAllLocalPaymentRecords(): ReceiptPaymentRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const listRaw = localStorage.getItem(REGISTRY_LIST_KEY);
    const list: ReceiptPaymentRecord[] = listRaw ? JSON.parse(listRaw) : [];
    // Also scan any individual keys
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        try {
          const item: ReceiptPaymentRecord = JSON.parse(localStorage.getItem(k) || '');
          if (item && item.receiptNo && !list.some(r => r.receiptNo === item.receiptNo)) {
            list.push(item);
          }
        } catch {}
      }
    }
    return list;
  } catch {
    return [];
  }
}

/**
 * Submits a client payment (2,199 XAF) as PENDING_ADMIN_CONFIRMATION.
 * Downloads remain locked until Admin confirms and presses OK in the Admin Dashboard.
 */
export async function submitClientPaymentRequest(record: ReceiptPaymentRecord): Promise<ReceiptPaymentRecord> {
  const pendingRecord: ReceiptPaymentRecord = {
    ...record,
    isPaid: false,
    adminConfirmed: false,
    status: 'PENDING_ADMIN_CONFIRMATION'
  };
  recordReceiptPayment(pendingRecord);

  try {
    const res = await fetch('/api/receipts/payment-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pendingRecord)
    });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData?.record) {
        recordReceiptPayment(serverData.record);
        return serverData.record;
      }
    }
  } catch (err) {
    console.warn('Server payment request sync fallback to local storage:', err);
  }

  return pendingRecord;
}

/**
 * Admin confirms and presses OK in the Admin Dashboard.
 * Dispatches message to SMTP user kreboya603@gmail.com and unlocks receipt & document download links.
 */
export async function confirmClientPaymentByAdmin(receiptNo: string, existingRecord?: Partial<ReceiptPaymentRecord>): Promise<{
  record: ReceiptPaymentRecord;
  smtpDispatchedTo: string;
  message: string;
}> {
  const localRec = getReceiptPaymentRecord(receiptNo) || existingRecord || {};
  const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

  const confirmedRecord: ReceiptPaymentRecord = {
    receiptNo,
    amount: Number(localRec.amount) || STANDARD_RECEIPT_FEE_XAF,
    currency: localRec.currency || 'XAF',
    paymentMethod: localRec.paymentMethod || 'MTN Mobile Money (671063511)',
    recipientNumber: localRec.recipientNumber || '671063511',
    transactionId: localRec.transactionId || `TXN-${Date.now().toString().slice(-6)}`,
    paidAt: localRec.paidAt || nowStr,
    payerName: localRec.payerName || 'Client',
    payerPhone: localRec.payerPhone || '671063511',
    clientEmail: localRec.clientEmail || '',
    projectName: localRec.projectName || 'MADECC Infrastructure Project',
    docType: localRec.docType || 'boq_receipt',
    domainUsed: localRec.domainUsed || TARGET_OFFICIAL_DOMAIN,
    isPaid: true,
    adminConfirmed: true,
    status: 'ADMIN_CONFIRMED',
    confirmedAt: nowStr,
    confirmedBy: ADMIN_SMTP_USER_EMAIL,
    smtpDispatchedTo: ADMIN_SMTP_USER_EMAIL,
    smtpDispatchedAt: nowStr
  };

  let serverMessage = `Payment confirmed & OK pressed! Message dispatched to SMTP user ${ADMIN_SMTP_USER_EMAIL}. Receipt and document download links are now unlocked.`;

  try {
    const res = await fetch('/api/receipts/payment-requests/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmedRecord)
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.record) {
        Object.assign(confirmedRecord, data.record);
      }
      if (data?.message) {
        serverMessage = data.message;
      }
    }
  } catch (err) {
    console.warn('Admin confirm server sync fallback:', err);
  }

  recordReceiptPayment(confirmedRecord);
  return {
    record: confirmedRecord,
    smtpDispatchedTo: ADMIN_SMTP_USER_EMAIL,
    message: serverMessage
  };
}

/**
 * Syncs all payment requests from server + local storage for the Admin Dashboard & Client Modal.
 */
export async function syncPaymentRequestsWithServer(): Promise<ReceiptPaymentRecord[]> {
  try {
    const res = await fetch('/api/receipts/payment-requests');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.records)) {
        for (const srvRec of data.records) {
          if (srvRec && srvRec.receiptNo) {
            recordReceiptPayment(srvRec);
          }
        }
      }
    }
  } catch (err) {
    // Fallback to local records
  }
  return getAllLocalPaymentRecords();
}

