import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  User,
  Shield,
} from 'lucide-react';
import { ExportHistoryLog } from '../types/exportTypes.ts';

export const ExportHistoryPanel: React.FC<{ showToast?: (m: string, t: 'success' | 'error' | 'info') => void }> = ({ showToast }) => {
  const [logs, setLogs] = useState<ExportHistoryLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/export/history');
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
      }
    } catch (e) {
      console.warn('Failed to fetch export history:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.documentTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.recordId || '').toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModule = filterModule === 'all' || log.moduleType === filterModule;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" /> Document Export Audit Trail Log
          </h3>
          <p className="text-xs text-slate-400">
            Real-time verification log of generated A4 PDF and Word (.DOCX) files across enterprise modules.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh Log
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, record ID, user..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-amber-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          value={filterModule}
          onChange={(e) => setFilterModule(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="all">All Enterprise Modules</option>
          <option value="civil_works">Civil Works</option>
          <option value="articles_of_association">Articles of Association</option>
          <option value="blueprints">Blueprints</option>
          <option value="safety_inspections">Safety Inspections</option>
          <option value="pedagogical_lessons">Pedagogical Lessons</option>
        </select>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3">Module</th>
                <th className="p-3">Record ID</th>
                <th className="p-3">Document Title</th>
                <th className="p-3">Format</th>
                <th className="p-3">Version</th>
                <th className="p-3">Exported By</th>
                <th className="p-3">Date / Time</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500 text-xs">
                    No document export history records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-semibold text-white uppercase text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono text-[10px]">
                        {log.moduleType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-300 font-bold">{log.recordId}</td>
                    <td className="p-3 font-medium text-white max-w-xs truncate">{log.documentTitle}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-mono font-bold text-[10px] uppercase ${
                          log.format === 'pdf'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {log.format === 'pdf' ? <FileText className="w-3 h-3" /> : <FileDown className="w-3 h-3" />}
                        {log.format}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400">V{log.version}</td>
                    <td className="p-3 text-slate-400 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-500" /> {log.userEmail || 'admin@madeccgroup.cm'}
                    </td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString('en-GB')}
                    </td>
                    <td className="p-3 text-right">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 font-bold text-[10px]">
                          <AlertCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
