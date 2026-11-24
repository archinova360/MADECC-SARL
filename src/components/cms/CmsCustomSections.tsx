import React from 'react';
import { ArrowRight } from 'lucide-react';
import { PageSection } from '../../types.ts';
import { useTheme } from '../../lib/ThemeContext.tsx';

/**
 * Strips potentially unsafe script/event tags while preserving formatted HTML from CMS Rich Text Editor.
 */
export function sanitizeClientHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '#');
}

interface CmsCustomSectionsProps {
  sections: PageSection[];
  onNavigateToTab?: (tab: string) => void;
  className?: string;
}

export const CmsCustomSections: React.FC<CmsCustomSectionsProps> = ({
  sections,
  onNavigateToTab,
  className = ''
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (!Array.isArray(sections) || sections.length === 0) return null;

  const handleCtaClick = (link?: string) => {
    if (!link) return;
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('mailto:') || link.startsWith('tel:')) {
      window.location.href = link;
      return;
    }
    const cleanTab = link.replace(/^\//, '').trim() || 'home';
    if (onNavigateToTab) {
      onNavigateToTab(cleanTab);
    } else {
      window.history.pushState({}, '', `/${cleanTab === 'home' ? '' : cleanTab}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {sections.map((sec, idx) => {
        if (sec.enabled === false) return null;
        const html = typeof sec.content === 'string' ? sanitizeClientHtml(sec.content) : '';
        const isVideoMedia = Boolean(
          sec.mediaUrl && /\.(mp4|webm|mov|m4v)(\?|$)/i.test(sec.mediaUrl)
        );

        return (
          <section
            key={sec.id || `cms-custom-${idx}`}
            className={`py-12 px-4 sm:px-6 lg:px-8 border-t ${
              isLight ? 'border-slate-200 bg-white text-slate-800' : 'border-slate-800/80 bg-[#0A0A0C] text-slate-200'
            }`}
            id={sec.id ? `cms-section-${sec.id}` : undefined}
          >
            <div className="max-w-7xl mx-auto">
              <div className={`grid grid-cols-1 ${sec.mediaUrl ? 'lg:grid-cols-12 gap-8 items-center' : ''}`}>
                <div className={sec.mediaUrl ? 'lg:col-span-7 space-y-4' : 'space-y-4 max-w-4xl'}>
                  {sec.title && (
                    <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {sec.title}
                    </h2>
                  )}
                  {sec.subtitle && (
                    <p className={`text-sm sm:text-base font-medium ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      {sec.subtitle}
                    </p>
                  )}
                  {html && (
                    <div
                      className={`prose max-w-none text-sm sm:text-base leading-relaxed space-y-3 ${
                        isLight ? 'text-slate-700 prose-slate' : 'text-slate-300 prose-invert'
                      }`}
                      dangerouslySetInnerHTML={{ __html: html }}
                    />
                  )}
                  {sec.ctaText && sec.ctaLink && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleCtaClick(sec.ctaLink)}
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg transition-all cursor-pointer"
                      >
                        <span>{sec.ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {sec.mediaUrl && (
                  <div className="lg:col-span-5">
                    <figure className={`rounded-2xl overflow-hidden border ${isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900'}`}>
                      {isVideoMedia ? (
                        <video
                          src={sec.mediaUrl}
                          controls
                          className="w-full h-auto max-h-[380px] object-cover"
                        />
                      ) : (
                        <img
                          src={sec.mediaUrl}
                          alt={sec.imageAlt || sec.title || 'MADECC Group Media'}
                          loading="lazy"
                          className="w-full h-auto max-h-[380px] object-cover"
                        />
                      )}
                      {sec.caption && (
                        <figcaption className={`px-4 py-2.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                          {sec.caption}
                        </figcaption>
                      )}
                    </figure>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};
