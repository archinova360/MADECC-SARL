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
