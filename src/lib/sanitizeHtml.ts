/**
 * Client-side deterministic HTML sanitizer for CMS rich-text and legal pages.
 * Strips executable scripts, inline event handlers, javascript: URIs, and untrusted embeds.
 */
export function sanitizeCmsHtml(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return '';

  let cleaned = html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<(object|embed|applet|form|input|textarea|button|meta|base|link)\b[^>]*>/gi, '')
    .replace(/<\/(object|embed|applet|form|button)>/gi, '')
    .replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (match, attrs) => {
      const srcMatch = String(attrs || '').match(/src\s*=\s*["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      const isSafeVideo =
        src.startsWith('https://www.youtube.com/embed/') ||
        src.startsWith('https://youtube.com/embed/') ||
        src.startsWith('https://www.youtube-nocookie.com/embed/') ||
        src.startsWith('https://player.vimeo.com/video/');
      return isSafeVideo ? match : '';
    });

  // Remove inline event handlers (onclick, onload, onerror, etc.)
  cleaned = cleaned.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  // Neutralize javascript:/vbscript:/data:text/html URIs in href/src
  cleaned = cleaned.replace(
    /(href|src)\s*=\s*(["'])\s*(?:javascript:|vbscript:|data:text\/html)[\s\S]*?\2/gi,
    '$1=$2#$2'
  );

  return cleaned;
}

export function stripHtmlToPlainText(html: string | null | undefined): string {
  if (!html || typeof html !== 'string') return '';
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
