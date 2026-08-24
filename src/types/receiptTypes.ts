/**
 * MADECC GROUP — CANONICAL RECEIPT DOCUMENT TYPES & CALCULATION ENGINE
 * 
 * Standardized document architecture ensuring 100% fidelity between:
 * - Neon PostgreSQL database record
 * - React Form & UI state
 * - Real-time Live Document Sheet Preview
 * - A4 PDF Generation Engine
 * - Editable Word (.DOCX) Export Engine
 * - Print Preview & Public Verification Ledger
 */

export interface ReceiptDocument {
  id?: number;
  receiptNo: string;
  clientName: string;
  clientNiu?: string | null;
  clientEmail?: string | null;
  receiptProject: string;
  invoiceTotalAmount: string | number | null;
  receiptAmount: string | number; // Subtotal Paid
  remainingBalance: string | number | null;
  receiptTaxRate: string | number | null; // e.g. "0" or "19.25"
  currency: string; // e.g. "XAF"
  receiptMethod: string;
  receiptMemo?: string | null;
  receiptSignatory: string;
  receiptTypedSign: string;
  drawnCfoSignature?: string | null;
  verificationToken: string;
  version: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'VOID' | string;
  signedAt: string | Date;
  updatedAt?: string | Date;
  // Ephemeral client-side rendering assets
  qrCodeBase64?: string | null;
  barcodeBase64?: string | null;
  isDigitallySigned?: boolean;
}

export interface ReceiptFinancialSummary {
  invoiceTotal: number;
  subtotalPaid: number;
  taxRate: number;
  taxAmount: number;
  totalPaidThisReceipt: number;
  remainingBalance: number;
  isPaidInFull: boolean;
  currency: string;
  formattedInvoiceTotal: string;
  formattedSubtotalPaid: string;
  formattedTaxAmount: string;
  formattedTotalPaidThisReceipt: string;
  formattedRemainingBalance: string;
}

export interface ReceiptExportModel {
  recordId: string;
  receiptNo: string;
  id?: number;
  version: string | number;
  title: string;
  clientName: string;
  clientNiu?: string;
  clientEmail?: string;
  projectName: string;
  receiptMethod: string;
  memo?: string;
  invoiceTotalAmount: number;
  receiptAmount: number; // Subtotal
  taxRate: number;
  taxAmount: number;
  totalPaidThisReceipt: number;
  remainingBalance: number;
  isPaidInFull: boolean;
  currency: string;
  signatoryName: string;
  authorizedOfficer: string;
  drawnSignatureBase64?: string;
  verificationToken: string;
  verificationUrl: string;
  qrCodeBase64?: string;
  barcodeBase64?: string;
  isDigitallySigned: boolean;
  date: string;
  signedAt: string;
  status: string;
}

/**
 * Pure, centralized calculation engine for receipt financial values.
 * Guarantees zero discrepancy across UI, Database, PDF, DOCX, and Print.
 */
export function calculateReceiptTotals(receipt: Partial<ReceiptDocument>): ReceiptFinancialSummary {
  const currency = receipt.currency || 'XAF';
  const subtotalPaid = parseFloat(String(receipt.receiptAmount ?? '0').replace(/,/g, '')) || 0;
  const taxRate = parseFloat(String(receipt.receiptTaxRate ?? '0').replace(/,/g, '')) || 0;
  const taxAmount = (subtotalPaid * taxRate) / 100;
  const totalPaidThisReceipt = subtotalPaid + taxAmount;

  const rawInvoiceTotal = receipt.invoiceTotalAmount !== undefined && receipt.invoiceTotalAmount !== null && String(receipt.invoiceTotalAmount).trim() !== ''
    ? parseFloat(String(receipt.invoiceTotalAmount).replace(/,/g, '')) || 0
    : 0;

  let remainingBalance: number;
  if (receipt.remainingBalance !== undefined && receipt.remainingBalance !== null && String(receipt.remainingBalance).trim() !== '') {
    remainingBalance = parseFloat(String(receipt.remainingBalance).replace(/,/g, '')) || 0;
  } else if (rawInvoiceTotal > 0) {
    remainingBalance = Math.max(0, rawInvoiceTotal - subtotalPaid);
  } else {
    remainingBalance = 0;
  }

  const isPaidInFull = remainingBalance <= 0;

  return {
    invoiceTotal: rawInvoiceTotal,
    subtotalPaid,
    taxRate,
    taxAmount,
    totalPaidThisReceipt,
    remainingBalance,
    isPaidInFull,
    currency,
    formattedInvoiceTotal: `${rawInvoiceTotal.toLocaleString()} ${currency}`,
    formattedSubtotalPaid: `${subtotalPaid.toLocaleString()} ${currency}`,
    formattedTaxAmount: `${taxAmount.toLocaleString()} ${currency}`,
    formattedTotalPaidThisReceipt: `${totalPaidThisReceipt.toLocaleString()} ${currency}`,
    formattedRemainingBalance: isPaidInFull ? 'PAID IN FULL' : `${remainingBalance.toLocaleString()} ${currency}`,
  };
}

/**
 * Helper to generate a new default, empty receipt document
 */
export function createDefaultReceipt(seedNumber?: string): ReceiptDocument {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const receiptNo = seedNumber || `REC-${new Date().getFullYear()}-${randomSuffix}`;
  const verificationToken = 'REC-' + Array.from({ length: 20 }, () => Math.floor(Math.random() * 36).toString(36)).join('').toUpperCase();

  return {
    receiptNo,
    clientName: 'Valued Client Profile',
    clientNiu: 'M120934892301X',
    clientEmail: '',
    receiptProject: 'General Construction Services',
    invoiceTotalAmount: '12500000',
    receiptAmount: '4500000',
    remainingBalance: '8000000',
    receiptTaxRate: '19.25',
    currency: 'XAF',
    receiptMethod: 'Commercial Bank Direct Transfer / Swift Wire',
    receiptMemo: 'Initial project mobilization deposit & structural foundation milestone.',
    receiptSignatory: 'Dr. Amélie Fotso',
    receiptTypedSign: 'AmelieFotso_MD',
    drawnCfoSignature: null,
    verificationToken,
    version: 1,
    status: 'ISSUED',
    signedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDigitallySigned: true,
  };
}

/**
 * Creates an independent snapshot clone of a source receipt with a new unique serial and verification token
 */
export function cloneReceiptDocument(source: ReceiptDocument): ReceiptDocument {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newReceiptNo = `REC-${new Date().getFullYear()}-${randomSuffix}`;
  const newVerificationToken = 'REC-' + Array.from({ length: 20 }, () => Math.floor(Math.random() * 36).toString(36)).join('').toUpperCase();

  return {
    ...source,
    id: undefined, // Clear existing database primary key for new record creation
    receiptNo: newReceiptNo,
    verificationToken: newVerificationToken,
    version: 1,
    status: 'ISSUED',
    signedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    receiptMemo: source.receiptMemo ? `[Copy of ${source.receiptNo}] ${source.receiptMemo}` : `[Copy of ${source.receiptNo}]`,
  };
}

/**
 * Validates canonical receipt fields for document integrity
 */
export function validateReceiptDocument(doc: Partial<ReceiptDocument>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!doc.receiptNo || !doc.receiptNo.trim()) errors.push('Receipt number is required.');
  if (!doc.clientName || !doc.clientName.trim()) errors.push('Client name is required.');
  if (!doc.receiptProject || !doc.receiptProject.trim()) errors.push('Project name is required.');
  if (doc.receiptAmount === undefined || doc.receiptAmount === null || String(doc.receiptAmount).trim() === '') {
    errors.push('Paid amount is required.');
  }
  if (!doc.receiptSignatory || !doc.receiptSignatory.trim()) errors.push('Signatory name is required.');
  if (!doc.receiptTypedSign || !doc.receiptTypedSign.trim()) errors.push('Digital signature code is required.');

  return {
    isValid: errors.length === 0,
    errors,
  };
}
