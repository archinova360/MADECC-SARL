import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Power,
} from 'lucide-react';
import { cmsFetch, CMS_TIMEZONES, formatDateTimeInTz, getStatusBadgeClass } from './cmsClient.ts';
import { CmsVisitorAnnouncement } from '../../types.ts';

const DISPLAY_LOCATIONS = [
  { id: 'site_wide_banner', label: 'Site-Wide Top Banner' },
  { id: 'homepage_banner', label: 'Homepage Banner Only' },
  { id: 'api_platform', label: 'Developer & Paid API Portal' },
  { id: 'selected_page', label: 'Selected Specific Pages' },
  { id: 'maintenance_notice', label: 'Maintenance Advisory Zone' },
];

const TARGET_PAGE_OPTIONS = ['home', 'about', 'services', 'website-development', 'projects', 'developers', 'legal', 'contact', 'sitemap', 'tenders', 'store'];

export default function CmsAnnouncementsPanel() {
  const [list, setList] = useState<CmsVisitorAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState<'NOTICE' | 'ENGINEERING' | 'LEGAL' | 'API_PLATFORM' | 'URGENT' | 'PROMOTION'>('NOTICE');
  const [priority, setPriority] = useState(1);
  const [displayLocation, setDisplayLocation] = useState<'homepage_banner' | 'site_wide_banner' | 'maintenance_notice' | 'selected_page' | 'api_platform'>('site_wide_banner');
  const [targetPages, setTargetPages] = useState<string[]>(['home']);
  const [ctaText, setCtaText] = useState('');
  const [ctaLink, setCtaLink] = useState('');
  const [dismissible, setDismissible] = useState(true);
  const [active, setActive] = useState(true);
  const [publishAt, setPublishAt] = useState('');
  const [expireAt, setExpireAt] = useState('');
  const [timezone, setTimezone] = useState('Africa/Douala');
  const [notifySubscribersSmtp, setNotifySubscribersSmtp] = useState(false);

  const loadList = async () => {
    setLoading(true);
    try {
      const res = await cmsFetch('/api/cms/announcements');
      setList(res.announcements || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load announcements' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await cmsFetch('/api/cms/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title,
          message,
          category,
          priority,
          displayLocation,
          targetPages,
          ctaText,
          ctaLink,
          dismissible,
          active,
          publishAt: publishAt ? new Date(publishAt).toISOString() : null,
          expireAt: expireAt ? new Date(expireAt).toISOString() : null,
          timezone,
          notifySubscribersSmtp,
        }),
      });
      setTitle('');
      setMessage('');
      setCtaText('');
      setCtaLink('');
      setMsg({ type: 'success', text: `Announcement created! (${res.smtpStatus})` });
      window.dispatchEvent(new Event('madecc-announcements-updated'));
      await loadList();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Create failed' });
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (item: CmsVisitorAnnouncement) => {
    try {
      await cmsFetch(`/api/cms/announcements/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: !item.active }),
      });
      window.dispatchEvent(new Event('madecc-announcements-updated'));
      loadList();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await cmsFetch(`/api/cms/announcements/${id}`, { method: 'DELETE' });
      window.dispatchEvent(new Event('madecc-announcements-updated'));
      loadList();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6 text-slate-200" id="cms-announcements-panel">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Megaphone className="w-5 h-5 text-amber-500" />
            Visitor Announcements & Targeted Banner Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Publish scheduled or immediate announcement banners across specific routes, the Developer Portal, or the entire public website.
          </p>
        </div>
        <button onClick={loadList} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          <CheckCircle2 className="w-4 h-4" /> {msg.text}
        </div>
      )}

      {/* Create Form */}
      <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 text-xs">
        <h3 className="text-sm font-bold text-white">Create New Announcement Banner</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Banner Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 2026 Engineering Tender Window Open"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            >
              {['NOTICE', 'ENGINEERING', 'LEGAL', 'API_PLATFORM', 'URGENT', 'PROMOTION'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Display Location</label>
            <select
              value={displayLocation}
              onChange={(e) => setDisplayLocation(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            >
              {DISPLAY_LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Message Body *</label>
          <textarea
            rows={2}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Clear visitor notice displayed in banner..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          />
        </div>

        {displayLocation === 'selected_page' && (
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Target Public Pages</label>
            <div className="flex flex-wrap gap-2">
              {TARGET_PAGE_OPTIONS.map((pg) => {
                const checked = targetPages.includes(pg);
                return (
                  <label key={pg} className={`px-2.5 py-1 rounded border cursor-pointer font-mono ${checked ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={checked}
                      onChange={() =>
                        setTargetPages((prev) =>
                          prev.includes(pg) ? prev.filter((p) => p !== pg) : [...prev, pg]
                        )
                      }
                    />
                    /{pg}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">CTA Button Text</label>
            <input
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g., View Details"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">CTA Link / Route Tab</label>
            <input
              type="text"
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
              placeholder="e.g., /tenders or https://..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Publish At (Optional)</label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Expire At (Optional)</label>
            <input
              type="datetime-local"
              value={expireAt}
              onChange={(e) => setExpireAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <span>Active Immediately</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={dismissible} onChange={(e) => setDismissible(e.target.checked)} />
            <span>Allow Visitor to Dismiss</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={notifySubscribersSmtp} onChange={(e) => setNotifySubscribersSmtp(e.target.checked)} />
            <span>Send SMTP Notice Summary (kreboya603@gmail.com)</span>
          </label>
          <div className="flex items-center gap-2">
            <span>Priority:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
            />
          </div>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
          >
            {CMS_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>

          <button
            type="submit"
            disabled={busy}
            className="ml-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Create Announcement
          </button>
        </div>
      </form>

      {/* Existing Announcements */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-white">Configured Announcements ({list.length})</h3>
        {list.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No announcements created yet.</p>
        ) : (
          <div className="space-y-2.5">
            {list.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${getStatusBadgeClass(item.active ? 'ACTIVE' : 'CANCELLED')}`}>
                      {item.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono text-[10px]">{item.category}</span>
                    <span className="font-bold text-white">{item.title}</span>
                    <span className="text-[11px] font-mono text-slate-500">[{item.displayLocation}]</span>
                  </div>
                  <p className="text-slate-300">{item.message}</p>
                  <div className="text-[11px] font-mono text-slate-500">
                    Publish: {formatDateTimeInTz(item.publishAt, item.timezone)} • Expire: {formatDateTimeInTz(item.expireAt, item.timezone)} • SMTP: {item.lastSmtpStatus || '—'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleActive(item)}
                    className={`px-3 py-1.5 rounded font-bold flex items-center gap-1 ${item.active ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}
                  >
                    <Power className="w-3.5 h-3.5" /> {item.active ? 'Disable' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400"
                    title="Delete Announcement"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
