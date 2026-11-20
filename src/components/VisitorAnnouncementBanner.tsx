import React, { useEffect, useState } from 'react';
import { Megaphone, X, ArrowRight } from 'lucide-react';
import { CmsVisitorAnnouncement } from '../types.ts';

interface VisitorAnnouncementBannerProps {
  currentTab: string;
  onNavigate?: (tab: string) => void;
}

const DISMISSED_KEY = 'madecc_dismissed_announcements';

function readDismissed(): number[] {
  try {
    const raw = sessionStorage.getItem(DISMISSED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function VisitorAnnouncementBanner({ currentTab, onNavigate }: VisitorAnnouncementBannerProps) {
  const [announcements, setAnnouncements] = useState<CmsVisitorAnnouncement[]>([]);
  const [dismissedIds, setDismissedIds] = useState<number[]>(() => readDismissed());

  const loadActive = async () => {
    try {
      const page = encodeURIComponent(currentTab || 'home');
      const res = await fetch(`/api/cms/announcements/active?page=${page}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      }
    } catch {
      // Non-blocking fail-safe
    }
  };

  useEffect(() => {
    loadActive();
    const handler = () => loadActive();
    window.addEventListener('madecc-announcements-updated', handler);
    return () => window.removeEventListener('madecc-announcements-updated', handler);
  }, [currentTab]);

  const visible = announcements.filter((a) => !dismissedIds.includes(a.id));
  if (visible.length === 0) return null;

  const top = visible[0];

  const handleDismiss = (id: number) => {
    const next = Array.from(new Set([...dismissedIds, id]));
    setDismissedIds(next);
    try {
      sessionStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures
    }
  };

  const handleCtaClick = (link: string) => {
    if (!link) return;
    if (link.startsWith('/') && onNavigate) {
      const slug = link.replace(/^\//, '') || 'home';
      onNavigate(slug);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (/^https?:\/\//i.test(link)) {
      window.location.assign(link);
    }
  };

  const isUrgent = top.category === 'URGENT';

  return (
    <div
      className={`border-b px-4 py-2 text-xs z-40 ${
        isUrgent
          ? 'bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 border-rose-500/40 text-rose-100'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-amber-500/30 text-slate-100'
      }`}
      role="region"
      aria-label="Visitor Announcement"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span
            className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold uppercase shrink-0 inline-flex items-center gap-1 ${
              isUrgent ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
            }`}
          >
            <Megaphone className="w-3 h-3" /> {top.category || 'NOTICE'}
          </span>
          <span className="font-bold text-white truncate">{top.title}:</span>
          <span className="text-slate-200 truncate">{top.message}</span>
          {top.ctaText && top.ctaLink && (
            <button
              type="button"
              onClick={() => handleCtaClick(top.ctaLink!)}
              className="inline-flex items-center gap-1 font-bold text-amber-400 hover:text-amber-300 underline shrink-0 cursor-pointer"
            >
              <span>{top.ctaText}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {top.dismissible !== false && (
          <button
            type="button"
            onClick={() => handleDismiss(top.id)}
            className="p-1 rounded hover:bg-slate-800/80 text-slate-300 hover:text-white shrink-0 cursor-pointer"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
