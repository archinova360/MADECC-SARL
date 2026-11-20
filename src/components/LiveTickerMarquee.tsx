import React, { useState } from 'react';
import { 
  Radio, 
  Pause, 
  Play, 
  X
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext.tsx';

interface TickerItem {
  id: string;
  tag: string;
  tagColor: string;
  headline: string;
  subtext?: string;
  targetTab?: string;
  badge?: string;
}

interface LiveTickerMarqueeProps {
  onNavigateToTab?: (tab: string) => void;
  speed?: 'normal' | 'slow' | 'fast';
}

const DEFAULT_TICKER_ITEMS: TickerItem[] = [
  {
    id: 't1',
    tag: 'LIVE SITE',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    headline: 'Yaoundé Commercial Complex (Phase 2): Structural raft foundation poured & cured to 38.5 MPa.',
    targetTab: 'projects',
    badge: 'On Schedule'
  },
  {
    id: 't2',
    tag: 'MINTP CERTIFIED',
    tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    headline: 'Grade A Civil Works Accreditation renewed under Cameroon Ministry of Public Works (MINTP).',
    targetTab: 'about',
    badge: 'Verified'
  },
  {
    id: 't3',
    tag: 'SAFETY RECORD',
    tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    headline: 'Surpassed 2,850,000 continuous man-hours with Zero Lost Time Injuries (LTI) across all operational hubs.',
    targetTab: 'safety',
    badge: '100% Zero-Harm'
  },
  {
    id: 't4',
    tag: 'LAB COMPLIANCE',
    tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
    headline: 'All concrete mixes lab-tested strictly to Eurocode 2 and BAEL 91 structural standards with certified 28-day compression certificates.',
    targetTab: 'services',
    badge: 'Eurocode 2'
  },
  {
    id: 't5',
    tag: 'BUDGET ENGINE',
    tagColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    headline: 'Instant Construction Cost Guide & Budget Calculator updated with current 2026 material index for Central Africa.',
    targetTab: 'budget-calculator',
    badge: 'Free Tool'
  },
  {
    id: 't6',
    tag: 'DOUALA LOGISTICS',
    tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    headline: 'Douala Akwa High-Rise: Pre-stressed steel superstructure delivery completed ahead of target milestone.',
    targetTab: 'projects',
    badge: 'Active'
  },
  {
    id: 't7',
    tag: 'PUBLIC TENDERS',
    tagColor: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    headline: 'Open bidding invitations published for regional geotechnical exploration and civil earthworks supply chains.',
    targetTab: 'tenders',
    badge: 'Open RFP'
  }
];

export function LiveTickerMarquee({ onNavigateToTab, speed = 'normal' }: LiveTickerMarqueeProps) {
  const { theme } = useTheme();
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  const durationClass = 
    speed === 'fast' ? 'animate-[marquee_30s_linear_infinite]' :
    speed === 'slow' ? 'animate-[marquee_70s_linear_infinite]' :
    'animate-[marquee_45s_linear_infinite]';

  return (
    <div 
      className={`relative w-full border-y overflow-hidden z-30 transition-colors select-none ${
        theme === 'light' 
          ? 'bg-slate-900 text-slate-200 border-slate-800' 
          : 'bg-[#08080A] text-slate-300 border-amber-500/20'
      }`}
      role="region"
      aria-label="Live Project and Structural Ticker"
    >
      <div className="flex items-center w-full">
        {/* Fixed Left Live Beacon Indicator */}
        <div className={`relative z-20 flex items-center gap-2 px-3 sm:px-4 py-2 border-r font-mono text-xs font-black shrink-0 tracking-wider shadow-md ${
          theme === 'light' 
            ? 'bg-amber-500 text-slate-950 border-amber-600' 
            : 'bg-amber-500 text-slate-950 border-amber-400'
        }`}>
          <span className="inline-flex rounded-full h-2 w-2 bg-slate-950" aria-hidden="true" />
          <Radio className="w-3.5 h-3.5 text-slate-950" aria-hidden="true" />
          <span className="hidden sm:inline uppercase">LIVE DISPATCH</span>
          <span className="sm:hidden uppercase">LIVE</span>
        </div>

        {/* Continuous Moving Text Marquee Track */}
        <div 
          className="relative flex overflow-x-hidden flex-1 py-1.5"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div 
            className={`flex items-center gap-8 whitespace-nowrap will-change-transform ${durationClass}`}
            style={{ 
              animationPlayState: isPaused ? 'paused' : 'running' 
            }}
          >
            {/* Duplicated arrays create seamless infinite scrolling */}
            {[...DEFAULT_TICKER_ITEMS, ...DEFAULT_TICKER_ITEMS].map((item, idx) => (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                aria-hidden={idx >= DEFAULT_TICKER_ITEMS.length}
                tabIndex={idx >= DEFAULT_TICKER_ITEMS.length ? -1 : 0}
                className="inline-flex items-center gap-2.5 group cursor-pointer hover:text-amber-400 transition-colors text-left"
                onClick={() => {
                  if (item.targetTab && onNavigateToTab) {
                    onNavigateToTab(item.targetTab);
                  }
                }}
              >
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${item.tagColor}`}>
                  {item.tag}
                </span>

                <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors">
                  {item.headline}
                </span>

                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {item.badge}
                  </span>
                )}

                <span className="text-amber-400 font-bold mx-2 select-none" aria-hidden="true">•</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Action Controls: Pause / Play & Dismiss */}
        <div className={`relative z-20 flex items-center gap-1 px-2 py-0.5 border-l shrink-0 ${
          theme === 'light' ? 'bg-slate-900 border-slate-800' : 'bg-[#08080A] border-amber-500/20'
        }`}>
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-amber-400 transition-colors text-xs cursor-pointer"
            title={isPaused ? 'Resume Moving Text (Animation)' : 'Pause Moving Text'}
            aria-label={isPaused ? 'Resume text scroll' : 'Pause text scroll'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          </button>

          <button
            type="button"
            onClick={() => setIsVisible(false)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors text-xs cursor-pointer"
            title="Dismiss Ticker"
            aria-label="Dismiss Ticker"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LiveTickerMarquee;
