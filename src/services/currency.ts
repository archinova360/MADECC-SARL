/**
 * Centralized Currency Service for MADECC Group Application.
 * Single source of truth for currency formatting, defaults, and currency codes.
 */

export const DEFAULT_CURRENCY = 'XAF';

export const SUPPORTED_CURRENCIES = [
  { code: 'XAF', symbol: 'XAF', label: 'XAF (Central African CFA Franc)' },
  { code: 'USD', symbol: '$', label: 'USD (US Dollar)' },
  { code: 'EUR', symbol: '€', label: 'EUR (Euro)' },
  { code: 'GBP', symbol: '£', label: 'GBP (British Pound)' },
  { code: 'NGN', symbol: '₦', label: 'NGN (Nigerian Naira)' },
  { code: 'CAD', symbol: 'CA$', label: 'CAD (Canadian Dollar)' },
];

/**
 * Formats a numeric value or numeric string into a localized currency string.
 * Supports XAF, USD, EUR, GBP, NGN, CAD, and arbitrary currency codes.
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = DEFAULT_CURRENCY,
  includeDecimals: boolean = false
): string {
  if (amount === null || amount === undefined || amount === '') {
    const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase().trim();
    return formatValueWithCode(0, code, includeDecimals);
  }

  const numericVal = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
  if (isNaN(numericVal)) {
    const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase().trim();
    return formatValueWithCode(0, code, includeDecimals);
  }

  const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase().trim();
  return formatValueWithCode(numericVal, code, includeDecimals);
}

function formatValueWithCode(num: number, code: string, includeDecimals: boolean): string {
  const minDigits = includeDecimals ? 2 : 0;
  const maxDigits = includeDecimals ? 2 : 2;

  switch (code) {
    case 'USD':
      return `$${num.toLocaleString('en-US', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}`;
    case 'EUR':
      return `€${num.toLocaleString('de-DE', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}`;
    case 'GBP':
      return `£${num.toLocaleString('en-GB', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}`;
    case 'NGN':
      return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}`;
    case 'CAD':
      return `CA$${num.toLocaleString('en-CA', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })}`;
    case 'XAF':
    case 'FCFA':
    case 'CFA':
      return `${num.toLocaleString('fr-FR', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })} XAF`;
    default:
      return `${num.toLocaleString('en-US', { minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits })} ${code}`;
  }
}

/**
 * Returns the currency symbol for a given currency code.
 */
export function getCurrencySymbol(currencyCode: string = DEFAULT_CURRENCY): string {
  const code = (currencyCode || DEFAULT_CURRENCY).toUpperCase().trim();
  switch (code) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'NGN': return '₦';
    case 'CAD': return 'CA$';
    case 'XAF':
    case 'FCFA':
    case 'CFA': return 'XAF';
    default: return code;
  }
}

/**
 * Safely retrieves project currency or defaults to XAF.
 */
export function getProjectCurrency(project?: { currency?: string; currency_code?: string } | null): string {
  if (!project) return DEFAULT_CURRENCY;
  return project.currency_code || project.currency || DEFAULT_CURRENCY;
}
