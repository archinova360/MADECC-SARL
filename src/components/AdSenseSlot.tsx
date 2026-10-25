import React, { useEffect, useRef } from 'react';

interface AdSenseSlotProps {
  slotId?: string;
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal';
  responsive?: boolean;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdSenseSlot({
  slotId = '1234567890',
  format = 'auto',
  responsive = true,
  className = ''
}: AdSenseSlotProps) {
  const adRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    // Only attempt push once per mount
    if (pushedRef.current) return;
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        window.adsbygoogle.push({});
        pushedRef.current = true;
      }
    } catch (e) {
      console.debug('AdSense slot initialization:', e);
    }
  }, []);

  return (
    <div className={`my-8 text-center overflow-hidden clear-both ${className}`} aria-label="Advertisement container">
      {/* Policy-compliant Ad Label according to Google Publisher Guidelines */}
      <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-1.5 flex items-center justify-center gap-2">
        <span className="w-6 h-[1px] bg-slate-800" />
        <span>Advertisement</span>
        <span className="w-6 h-[1px] bg-slate-800" />
      </div>

      <div className="min-h-[90px] sm:min-h-[120px] bg-slate-900/30 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block', width: '100%' }}
          data-ad-client="ca-pub-7227721489757915"
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive={responsive ? 'true' : 'false'}
        />
      </div>
    </div>
  );
}
