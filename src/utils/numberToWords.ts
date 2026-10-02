/**
 * Converts a numeric amount to formal written English words for BOQ and financial contracts.
 * e.g. 69592200 -> "Sixty-Nine Million Five Hundred Ninety-Two Thousand Two Hundred XAF"
 */

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
const TEENS = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const SCALES = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];

function convertThreeDigits(num: number): string {
  let str = '';
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    str += `${ONES[hundreds]} Hundred`;
    if (remainder > 0) str += ' and ';
  }

  if (remainder >= 10 && remainder < 20) {
    str += TEENS[remainder - 10];
  } else {
    const tens = Math.floor(remainder / 10);
    const ones = remainder % 10;
    if (tens > 0) {
      str += TENS[tens];
      if (ones > 0) str += `-${ONES[ones]}`;
    } else if (ones > 0) {
      str += ONES[ones];
    }
  }

  return str.trim();
}

export function numberToWords(amount: number | string, currency: string = 'XAF'): string {
  const num = Math.round(Math.abs(Number(amount) || 0));
  if (num === 0) return `Zero ${currency} Only`;

  let n = num;
  const chunks: number[] = [];

  while (n > 0) {
    chunks.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  const words: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk > 0) {
      const chunkWords = convertThreeDigits(chunk);
      const scale = SCALES[i];
      if (scale) {
        words.push(`${chunkWords} ${scale}`);
      } else {
        words.push(chunkWords);
      }
    }
  }

  return `${words.join(' ')} ${currency.toUpperCase()} Only`;
}

// -------------------------------------------------------------
// FRENCH NUMBER TO WORDS ENGINE (Standards OHADA / CEMAC / BTP)
// -------------------------------------------------------------
const FR_UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
const FR_TEENS = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const FR_TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

function convertUnderHundredFr(n: number): string {
  if (n < 10) return FR_UNITS[n];
  if (n >= 10 && n < 20) return FR_TEENS[n - 10];

  const tens = Math.floor(n / 10);
  const units = n % 10;

  if (tens === 7) {
    if (units === 1) return 'soixante et onze';
    return `soixante-${FR_TEENS[units]}`;
  }

  if (tens === 8) {
    if (units === 0) return 'quatre-vingts';
    return `quatre-vingt-${FR_UNITS[units]}`;
  }

  if (tens === 9) {
    return `quatre-vingt-${FR_TEENS[units]}`;
  }

  if (units === 1) {
    return `${FR_TENS[tens]} et un`;
  }

  if (units > 1) {
    return `${FR_TENS[tens]}-${FR_UNITS[units]}`;
  }

  return FR_TENS[tens];
}

function convertThreeDigitsFr(n: number): string {
  let str = '';
  const hundreds = Math.floor(n / 100);
  const rem = n % 100;

  if (hundreds > 0) {
    if (hundreds === 1) {
      str += 'cent';
    } else {
      str += `${FR_UNITS[hundreds]} cent${rem === 0 ? 's' : ''}`;
    }
    if (rem > 0) str += ' ';
  }

  if (rem > 0) {
    str += convertUnderHundredFr(rem);
  }

  return str.trim();
}

export function numberToWordsFr(amount: number | string, currency: string = 'XAF'): string {
  const num = Math.round(Math.abs(Number(amount) || 0));
  if (num === 0) {
    const curLabel = currency.toUpperCase() === 'XAF' ? 'Francs CFA (XAF)' : currency.toUpperCase();
    return `Zéro ${curLabel}`;
  }

  let n = num;
  const billions = Math.floor(n / 1000000000);
  n %= 1000000000;
  const millions = Math.floor(n / 1000000);
  n %= 1000000;
  const thousands = Math.floor(n / 1000);
  const units = n % 1000;

  const parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) {
      parts.push('un milliard');
    } else {
      parts.push(`${convertThreeDigitsFr(billions)} milliards`);
    }
  }

  if (millions > 0) {
    if (millions === 1) {
      parts.push('un million');
    } else {
      parts.push(`${convertThreeDigitsFr(millions)} millions`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('mille');
    } else {
      parts.push(`${convertThreeDigitsFr(thousands)} mille`);
    }
  }

  if (units > 0) {
    parts.push(convertThreeDigitsFr(units));
  }

  const rawWords = parts.join(' ');
  // Capitalize first letter of each major word for formal contract presentation
  const capitalized = rawWords
    .split(' ')
    .map(w => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');

  let currencyName = currency.toUpperCase();
  if (currencyName === 'XAF') {
    currencyName = 'Francs CFA (XAF)';
  } else if (currencyName === 'EUR') {
    currencyName = 'Euros';
  } else if (currencyName === 'USD') {
    currencyName = 'Dollars Américains';
  }

  return `${capitalized} ${currencyName}`;
}

