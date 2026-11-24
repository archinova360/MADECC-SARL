import { CmsContentReviewReport } from '../types.ts';

/**
 * Strips executable markup, inline JS handlers, unsafe URIs, and untrusted embeds.
 */
export function sanitizeRichHtml(input: unknown): string {
  if (typeof input !== 'string') return '';
  let out = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<(object|embed|applet|form|input|textarea|button|meta|base|link)\b[^>]*>/gi, '')
    .replace(/<\/(object|embed|applet|form|button)>/gi, '')
    .replace(/<iframe\b([^>]*)>[\s\S]*?<\/iframe>/gi, (match, attrs) => {
      const srcMatch = String(attrs || '').match(/src\s*=\s*["']([^"']+)["']/i);
      const src = srcMatch ? srcMatch[1] : '';
      const allowed =
        src.startsWith('https://www.youtube.com/embed/') ||
        src.startsWith('https://youtube.com/embed/') ||
        src.startsWith('https://www.youtube-nocookie.com/embed/') ||
        src.startsWith('https://player.vimeo.com/video/');
      return allowed ? match : '';
    });

  out = out.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(
    /(href|src)\s*=\s*(["'])\s*(?:javascript:|vbscript:|data:text\/html)[\s\S]*?\2/gi,
    '$1=$2#$2'
  );
  return out.trim();
}

export function sanitizeCmsPagePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return {};
  const next = { ...payload };
  const stripTags = (val: any) => (typeof val === 'string' ? val.replace(/[<>]/g, '').trim() : val);
  if (next.heroConfig && typeof next.heroConfig === 'object') {
    next.heroConfig = {
      ...next.heroConfig,
      eyebrow: stripTags(next.heroConfig.eyebrow),
      title: stripTags(next.heroConfig.title),
      subtitle: stripTags(next.heroConfig.subtitle),
      headline: stripTags(next.heroConfig.headline),
      subheadline: stripTags(next.heroConfig.subheadline),
      imageAlt: stripTags(next.heroConfig.imageAlt),
      description: typeof next.heroConfig.description === 'string' ? sanitizeRichHtml(next.heroConfig.description) : next.heroConfig.description,
    };
  }
  if (Array.isArray(next.sections)) {
    next.sections = next.sections.map((sec: any, idx: number) => ({
      ...sec,
      title: stripTags(sec.title) ?? '',
      subtitle: stripTags(sec.subtitle) ?? '',
      imageAlt: stripTags(sec.imageAlt),
      caption: stripTags(sec.caption),
      ctaText: stripTags(sec.ctaText),
      ctaLink: typeof sec.ctaLink === 'string' ? sec.ctaLink.trim() : sec.ctaLink,
      displayOrder: typeof sec.displayOrder === 'number' ? sec.displayOrder : idx + 1,
      enabled: sec.enabled !== false,
      content: typeof sec.content === 'string' ? sanitizeRichHtml(sec.content) : sec.content,
      contentHtml: typeof sec.contentHtml === 'string' ? sanitizeRichHtml(sec.contentHtml) : sec.contentHtml,
    }));
  }
  return next;
}

/**
 * Redacts accidental secrets from Developer Portal public CMS copy or code snippets.
 */
export function redactSecretsInText(text: string): string {
  if (typeof text !== 'string') return '';
  return text
    .replace(/(sk_(?:live|test)_[a-zA-Z0-9_-]{8,})/g, 'YOUR_ISSUED_API_KEY')
    .replace(/(madecc_(?:live|test)_[a-zA-Z0-9_-]{8,})/g, 'YOUR_ISSUED_API_KEY')
    .replace(/(postgres(?:ql)?:\/\/[^\s"'`]+)/gi, 'postgres://[REDACTED]')
    .replace(/(SG\.[a-zA-Z0-9_-]{10,})/g, '[REDACTED_KEY]');
}

export function sanitizeDeveloperPortalConfig(cfg: any): any {
  if (!cfg || typeof cfg !== 'object') return {};
  const clean = JSON.parse(JSON.stringify(cfg));
  const walk = (node: any): any => {
    if (typeof node === 'string') return redactSecretsInText(node);
    if (Array.isArray(node)) return node.map(walk);
    if (node && typeof node === 'object') {
      const out: Record<string, any> = {};
      for (const [k, v] of Object.entries(node)) {
        if (/secret|password|privateKey|tokenHash/i.test(k)) continue;
        out[k] = walk(v);
      }
      return out;
    }
    return node;
  };
  return walk(clean);
}

/**
 * Deterministic Editorial & Factual Verification Analyzer (Human Content Review)
 * Checks readability, grammar/punctuation hygiene, repeated phrases, exaggerated hype terms,
 * and cross-checks corporate identity claims against verified Neon DB facts.
 */
export function analyzeHumanContentEditorial(params: {
  targetType: string;
  targetSlug: string;
  rawText: string;
  verifiedFacts: {
    companyName: string;
    founderName: string;
    niuNumber: string;
    legalStatus: string;
    rccmNumber?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
}): Omit<CmsContentReviewReport, 'id' | 'reviewedBy' | 'reviewedAt' | 'reviewerNotes'> {
  const plain = params.rawText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = plain ? plain.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const sentences = plain
    ? plain.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 1)
    : [];
  const sentenceCount = Math.max(1, sentences.length);
  const avgWordsPerSentence = wordCount > 0 ? Number((wordCount / sentenceCount).toFixed(1)) : 0;

  // Approximate Flesch-like readability metric (bounded 0-100)
  const syllableCount = words.reduce((acc, w) => {
    const clean = w.toLowerCase().replace(/[^a-z]/g, '');
    if (!clean) return acc + 1;
    const matches = clean.match(/[aeiouy]{1,2}/g);
    return acc + Math.max(1, matches ? matches.length : 1);
  }, 0);
  const avgSyllables = wordCount > 0 ? syllableCount / wordCount : 1.5;
  const rawEase = Math.round(206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllables);
  const readabilityScore = wordCount === 0 ? 0 : Math.max(5, Math.min(100, rawEase));

  const readingEaseLabel =
    wordCount === 0
      ? 'No readable text supplied'
      : readabilityScore >= 60
      ? 'Clear & Accessible'
      : readabilityScore >= 40
      ? 'Professional / Technical'
      : 'Dense — Consider shorter sentences';

  // Grammar & Style Hygiene Checks
  const grammarNotes: string[] = [];
  if (/\s{2,}/.test(params.rawText.replace(/<[^>]+>/g, ' '))) {
    grammarNotes.push('Contains double spacing between words.');
  }
  if (/\b(teh|recieve|seperate|occured|untill|definately|guarentee|structral|managment|enginering)\b/i.test(plain)) {
    grammarNotes.push('Potential common typo detected (e.g., engineering/management/guarantee spelling).');
  }
  if (/[!?]{2,}/.test(plain)) {
    grammarNotes.push('Avoid repeated exclamation or question punctuation in corporate copy.');
  }
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 35).length;
  if (longSentences > 0) {
    grammarNotes.push(`${longSentences} sentence(s) exceed 35 words; splitting improves clarity.`);
  }
  if (wordCount < 25) {
    grammarNotes.push('Very short copy (<25 words); expand for clear visitor context.');
  }

  // Repeated 3-word phrases (robotic / boilerplate indicator)
  const trigramCounts: Record<string, number> = {};
  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(Boolean);
  for (let i = 0; i <= lowerWords.length - 3; i++) {
    const tri = `${lowerWords[i]} ${lowerWords[i + 1]} ${lowerWords[i + 2]}`;
    trigramCounts[tri] = (trigramCounts[tri] || 0) + 1;
  }
  const repeatedPhrases = Object.entries(trigramCounts)
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase, count]) => ({ phrase, count }));

  // Exaggerated / unverifiable hype wording check
  const hypeLexicon = [
    '#1 in the world',
    '100% guaranteed results',
    'world-leading guaranteed',
    'unbeatable perfection',
    'revolutionary ai magic',
    'zero risk guaranteed',
    'accredited since 1990',
    'iso 9001 certified',
    'iso 45001 certified',
    'ministry licensed',
  ];
  const hypeMatches = hypeLexicon.filter((term) => plain.toLowerCase().includes(term));

  // Cross-check against verified Neon DB corporate facts
  const factCheckIssues: CmsContentReviewReport['factCheckIssues'] = [];
  const lower = plain.toLowerCase();

  // Flag unverified RCCM claim if DB has none
  if (!params.verifiedFacts.rccmNumber && /\brccm\s*[:#]?\s*[a-z0-9/-]{6,}/i.test(plain) && !/pending/i.test(plain)) {
    factCheckIssues.push({
      severity: 'ERROR',
      field: 'rccmNumber',
      message: 'Content references a specific RCCM number, but verified Neon DB record shows registration pending.',
      verifiedFact: `Verified status: ${params.verifiedFacts.legalStatus}`,
    });
  }

  // Check NIU mismatch if NIU is mentioned
  const niuMatch = plain.match(/\bNIU\b[^A-Z0-9]*([A-Z0-9]{8,20})/i);
  if (niuMatch && niuMatch[1] && niuMatch[1].toUpperCase() !== params.verifiedFacts.niuNumber.toUpperCase()) {
    factCheckIssues.push({
      severity: 'ERROR',
      field: 'niuNumber',
      message: `NIU mismatch: found "${niuMatch[1]}" instead of verified taxpayer number.`,
      verifiedFact: `Verified NIU: ${params.verifiedFacts.niuNumber}`,
    });
  }

  // Check SARL overstatement if entity registration is pending
  if (
    /pending/i.test(params.verifiedFacts.legalStatus) &&
    /\bs\.?a\.?r\.?l\.?\b/i.test(plain) &&
    !/planned|upon registration|transition|pending/i.test(plain)
  ) {
    factCheckIssues.push({
      severity: 'WARNING',
      field: 'legalStatus',
      message: 'Text references "SARL" without noting that formal incorporation is currently pending/planned.',
      verifiedFact: `Verified status: ${params.verifiedFacts.legalStatus}`,
    });
  }

  if (hypeMatches.length > 0) {
    factCheckIssues.push({
      severity: 'WARNING',
      field: 'certifications',
      message: `Potentially unverified certification/superlative claim detected: ${hypeMatches.join(', ')}`,
      verifiedFact: 'Publish only verified claims backed by documentary proof.',
    });
  }

  if (lower.includes('douala') && !lower.includes('yaound')) {
    factCheckIssues.push({
      severity: 'INFO',
      field: 'headquarters',
      message: 'Page mentions Douala without mentioning primary HQ in Mbankolo, Yaoundé.',
      verifiedFact: `Primary HQ: ${params.verifiedFacts.location || 'Mbankolo, Yaoundé, Cameroon'}`,
    });
  }

  const recommendations: string[] = [];
  if (factCheckIssues.some((i) => i.severity === 'ERROR')) {
    recommendations.push('Resolve factual discrepancies against Corporate Profile before publishing.');
  }
  if (grammarNotes.length > 0) {
    recommendations.push('Review sentence length, spacing, and spelling hygiene notes.');
  }
  if (repeatedPhrases.length > 0) {
    recommendations.push('Vary phrasing to eliminate repeated 3-word templates.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Copy passed automated editorial & fact consistency checks. Ready for human admin sign-off.');
  }

  const reviewStatus: CmsContentReviewReport['reviewStatus'] =
    factCheckIssues.some((i) => i.severity === 'ERROR') || hypeMatches.length > 0
      ? 'CHANGES_RECOMMENDED'
      : grammarNotes.length > 1 || repeatedPhrases.length > 1
      ? 'REVIEW_REQUIRED'
      : 'REVIEW_REQUIRED';

  return {
    targetType: params.targetType,
    targetSlug: params.targetSlug,
    reviewStatus,
    grammarIssuesCount: grammarNotes.length,
    readabilityScore,
    repeatedPhrasesCount: repeatedPhrases.length,
    hypeFlagsCount: hypeMatches.length,
    factCheckIssues,
    reportJson: {
      wordCount,
      sentenceCount,
      avgWordsPerSentence,
      readingEaseLabel,
      grammarNotes,
      repeatedPhrases,
      hypeMatches,
      recommendations,
      disclaimer:
        'Editorial Review Assistance Only: This automated analyzer evaluates readability, repetition, and database fact consistency. It does not certify authorship or replace human editorial/legal approval.',
    },
  };
}
