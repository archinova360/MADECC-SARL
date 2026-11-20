import React, { useEffect, useState } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import { cmsFetch, formatDateTimeInTz, getStatusBadgeClass } from './cmsClient.ts';

export default function CmsActivityLogsPanel() {
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [pubHistory, setPubHistory] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'publication' | 'activity'>('publication');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        cmsFetch('/api/cms/activity-logs?limit=150'),
        cmsFetch('/api/cms/publication-history?limit=150'),
      ]);
      setActivityLogs(aRes.logs || []);
      setPubHistory(pRes.history || []);
    } catch {
      // handled gracefully
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const q = query.trim().toLowerCase();
  const filteredPub = pubHistory.filter((h) => !q || JSON.stringify(h).toLowerCase().includes(q));
  const filteredAct = activityLogs.filter((l) => !q || JSON.stringify(l).toLowerCase().includes(q));

  return (
    <div className="space-y-5 text-slate-200" id="cms-activity-logs-panel">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <History className="w-5 h-5 text-amber-500" />
            Publishing Activity & Failure Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable Neon PostgreSQL audit trail of drafts, reviews, scheduled runs, publications, failures, and configuration updates.
          </p>
        </div>
        <button onClick={loadLogs} className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 self-start sm:self-auto">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setTab('publication')}
            className={`px-3 py-1.5 rounded font-bold ${tab === 'publication' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
          >
            Publication History ({filteredPub.length})
          </button>
          <button
            onClick={() => setTab('activity')}
            className={`px-3 py-1.5 rounded font-bold ${tab === 'activity' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
          >
            CMS Module Logs ({filteredAct.length})
          </button>
        </div>

        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter logs by page, user, action, or error..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-[600px] overflow-y-auto">
        {tab === 'publication' ? (
          filteredPub.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-500">No publication events match your filter.</div>
          ) : (
            filteredPub.map((h) => (
              <div key={h.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${getStatusBadgeClass(h.success ? h.toStatus || h.action : 'FAIL')}`}>
                      {h.action}
                    </span>
                    <span className="font-bold text-white">{h.targetTitle || h.targetSlug}</span>
                    <span className="font-mono text-[10px] text-slate-500">[{h.targetType}]</span>
                  </div>
                  <p className="text-slate-400 mt-1">{h.errorMessage || h.details || `${h.fromStatus || '—'} → ${h.toStatus || '—'}`}</p>
                </div>
                <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
                  <div>{h.performedBy}</div>
                  <div>{formatDateTimeInTz(h.createdAt)}</div>
                </div>
              </div>
            ))
          )
        ) : filteredAct.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-500">No CMS activity logs match your filter.</div>
        ) : (
          filteredAct.map((l) => (
            <div key={l.id} className="p-4 flex items-start justify-between gap-4 text-xs">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 font-mono text-[10px] font-bold">{l.module}</span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">{l.action}</span>
                  <span className="font-bold text-white">{l.recordTitle || l.recordId}</span>
                </div>
                <p className="text-slate-400 mt-1">{l.details}</p>
              </div>
              <div className="text-right font-mono text-[10px] text-slate-500 shrink-0">
                <div>{l.performedBy}</div>
                <div>{formatDateTimeInTz(l.timestamp)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
