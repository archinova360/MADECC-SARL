/**
 * Utility functions for optimization and formatting
 */

/**
 * Ensures web URLs have a valid protocol prefix (https://) if entered without one.
 */
export function ensureAbsoluteUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('/') || 
    trimmed.startsWith('data:') || 
    trimmed.startsWith('http://') || 
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }
  return 'https://' + trimmed;
}

/**
 * Extracts YouTube video ID and returns an embeddable iframe URL (https://www.youtube.com/embed/...)
 * Returns null if the URL is not a valid YouTube link (e.g., raw MP4/MOV file).
 */
export function getYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.includes('youtube.com/embed/')) return trimmed;
  
  const match = trimmed.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
}

/**
 * Optimizes image URLs (especially Unsplash) by appending format/quality/width parameters.
 * Replaces direct heavy assets with compressed WebP formats and optimized sizes to reduce LCP.
 */
export function getOptimizedImageUrl(url: string | null | undefined, width = 800, quality = 80): string {
  if (!url) return '';
  
  let formattedUrl = ensureAbsoluteUrl(url);
  if (!formattedUrl) return '';

  // Handle relative paths (like /uploads/...) or data URIs directly
  if (formattedUrl.startsWith('/') || formattedUrl.startsWith('data:')) {
    return formattedUrl;
  }

  // Handle Unsplash URLs for WebP conversion and resizing
  if (formattedUrl.includes('images.unsplash.com')) {
    try {
      const parsedUrl = new URL(formattedUrl);
      parsedUrl.searchParams.set('fm', 'webp');
      parsedUrl.searchParams.set('q', quality.toString());
      if (width) {
        parsedUrl.searchParams.set('w', width.toString());
      }
      parsedUrl.searchParams.delete('auto');
      return parsedUrl.toString();
    } catch (e) {
      // Return formatted URL if URL parsing fails
      return formattedUrl;
    }
  }
  
  return formattedUrl;
}

/**
 * Utility to trigger CSV file download in browser
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]): void {
  if (typeof window === 'undefined') return;
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export { 
  formatCurrency, 
  DEFAULT_CURRENCY, 
  SUPPORTED_CURRENCIES, 
  getCurrencySymbol, 
  getProjectCurrency 
} from '../services/currency.ts';

