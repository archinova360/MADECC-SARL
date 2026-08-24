import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

/**
 * Generates a high-quality Base64 Data URL for a QR Code completely locally (offline).
 * Eliminates external network calls to third-party QR code generation APIs.
 */
export async function generateQrCodeBase64(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    darkColor?: string;
    lightColor?: string;
  }
): Promise<string> {
  if (!text || typeof text !== 'string') {
    return '';
  }

  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: options?.width || 200,
      margin: options?.margin ?? 1,
      color: {
        dark: options?.darkColor || '#0f172a',
        light: options?.lightColor || '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    return dataUrl;
  } catch (err) {
    console.warn('[QR_GEN_FALLBACK] Failed to generate QR canvas data URL:', err);
    return '';
  }
}

/**
 * Generates a clean Base64 PNG Data URL for a Code-128 barcode completely locally.
 * Eliminates external network calls to metafloor / barcodeapi.
 */
export function generateBarcodeBase64(
  text: string,
  options?: {
    height?: number;
    width?: number;
    displayValue?: boolean;
    fontSize?: number;
    background?: string;
    lineColor?: string;
  }
): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  try {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, text, {
        format: 'CODE128',
        lineColor: options?.lineColor || '#0f172a',
        background: options?.background || '#ffffff',
        width: options?.width || 2,
        height: options?.height || 45,
        displayValue: options?.displayValue ?? true,
        fontSize: options?.fontSize || 12,
        font: 'monospace',
        textMargin: 4,
        margin: 4
      });
      return canvas.toDataURL('image/png');
    }
  } catch (err) {
    console.warn('[BARCODE_GEN_FALLBACK] Failed to generate barcode canvas:', err);
  }
  return '';
}

/**
 * Safely fetches a remote image URL and converts to base64 Data URL,
 * with graceful fallback to prevent unhandled console errors when offline or CORS-restricted.
 */
export async function safeFetchBase64Image(url: string, fallback = ''): Promise<string> {
  if (!url || typeof url !== 'string') {
    return fallback;
  }

  // Already a base64 data URL
  if (url.startsWith('data:')) {
    return url;
  }

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) {
      return fallback;
    }
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve(fallback);
        }
      };
      reader.onerror = () => resolve(fallback);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Network or CORS failure - handle silently and return fallback
    return fallback;
  }
}
