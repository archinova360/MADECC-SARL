import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Share2,
  Ban,
  History,
  UserCog,
  Download,
  RefreshCw,
} from 'lucide-react';
import { corporateFetch, downloadCorporateServerExport } from '../lib/corporateApi.ts';
import { useToast } from './Toast.tsx';

export const CorporateAuditGovernanceHub: React.FC = () => {
  const { showToast } = useToast();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);
  const [rbacUsers, setRbacUsers] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<any>({});

  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGovernance = useCallback(async () => {
    setLoading(true);
    try {
      const roleRes = await corporateFetch('/api/corporate/me-role');
      const caps = roleRes.capabilities || {};
      setCapabilities(caps);

      const sharesRes = await corporateFetch('/api/corporate/shares');
      setShares(sharesRes.shares || []);

      if (caps.canViewAuditLogs) {
        const auditRes = await corporateFetch('/api/corporate/audit-logs');
        setAuditLogs(auditRes.logs || []);
      }

      if (caps.canAssignRoles) {
        const usersRes = await corporateFetch('/api/corporate/rbac-users');
        setRbacUsers(usersRes.users || []);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed loading governance workspace', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadGovernance();
  }, [loadGovernance]);

  const handleGlobalSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await corporateFetch(`/api/corporate/search?q=${encodeURIComponent(searchQ)}`);
      setSearchResults(res.results || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRevokeShare = async (shareId: number) => {
    try {
      await corporateFetch(`/api/corporate/shares/${shareId}/revoke`, { method: 'POST' });
      showToast('Share link revoked immediately', 'success');
      await loadGovernance();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAssignRbacRole = async (userId: number, adminRole: string) => {
    try {
      await corporateFetch(`/api/corporate/rbac-users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ adminRole }),
      });
      showToast('Updated administrator role cleanly', 'success');
      await loadGovernance();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase font-bold">Security, Traceability &amp; RBAC</div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">Corporate Governance, Search &amp; Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Append-only audit trail, controlled external share link revocation, cross-module search, and role-based access governance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => downloadCorporateServerExport('audit', 'csv')}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" /> Export Audit CSV
          </button>
          <button
            type="button"
            onClick={() => downloadCorporateServerExport('audit', 'json')}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> Audit JSON
          </button>
          <button
            type="button"
            onClick={loadGovernance}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Global Cross-Module Search */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Search className="w-4 h-4 text-amber-500" /> Global Cross-Module Search
        </h3>
        <form onSubmit={handleGlobalSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search divisions, services, registration docs, or investors..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer">
            Search
          </button>
        </form>
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            {searchResults.map((r, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <div className="text-[11px] font-mono text-amber-400">{r.module} · #{r.id}</div>
                <div className="font-bold text-white mt-0.5">{r.title}</div>
                <div className="text-slate-400 mt-0.5">{r.subtitle}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Controlled Share Links Manager */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Share2 className="w-4 h-4 text-emerald-400" /> Controlled External Share Links ({shares.length})
        </h3>
        {shares.length === 0 ? (
          <div className="text-xs text-slate-500">No active share links created yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                  <th className="py-2 px-3">Title · Token Prefix</th>
                  <th className="py-2 px-3">Entity</th>
                  <th className="py-2 px-3">Views</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Revocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {shares.map((sh) => {
                  const revoked = Boolean(sh.revokedAt);
                  const expired = sh.expiresAt && new Date(sh.expiresAt) < new Date();
                  return (
                    <tr key={sh.id}>
                      <td className="py-2.5 px-3 text-white">
                        <div className="font-semibold">{sh.title}</div>
                        <div className="font-mono text-[11px] text-slate-500">{sh.tokenPrefix}...</div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {sh.entityType} #{sh.entityId}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-slate-300">{sh.accessCount}</td>
                      <td className="py-2.5 px-3 font-mono">
                        {revoked ? (
                          <span className="text-rose-400">REVOKED</span>
                        ) : expired ? (
                          <span className="text-amber-400">EXPIRED</span>
                        ) : (
                          <span className="text-emerald-400">ACTIVE</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {!revoked && (
                          <button
                            type="button"
                            onClick={() => handleRevokeShare(sh.id)}
                            className="px-2.5 py-1 rounded border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Ban className="w-3 h-3" /> Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Granular RBAC Assignment (Super Admin Only) */}
      {capabilities.canAssignRoles && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <UserCog className="w-4 h-4 text-sky-400" /> Administrator Role-Based Access Control (RBAC)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                  <th className="py-2 px-3">User</th>
                  <th className="py-2 px-3">Base System Role</th>
                  <th className="py-2 px-3">Corporate Governance Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {rbacUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 text-white">
                      <div className="font-semibold">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">{u.role}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.adminRole || 'STANDARD'}
                        onChange={(e) => handleAssignRbacRole(u.id, e.target.value)}
                        className="px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                      >
                        <option value="SUPER_ADMIN">Super Administrator</option>
                        <option value="BUSINESS_ADMIN">Business Administrator</option>
                        <option value="LEGAL_REVIEWER">Legal / Compliance Reviewer</option>
                        <option value="CONTENT_ADMIN">Content Administrator</option>
                        <option value="STANDARD">Standard / Client</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Immutable Audit Trail */}
      {capabilities.canViewAuditLogs && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-amber-500" /> Immutable Append-Only Audit Log ({auditLogs.length})
          </h3>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase">
                  <th className="py-2 px-3">Timestamp</th>
                  <th className="py-2 px-3">Actor · Role</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Entity</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-slate-200">
                      <div>{log.actorEmail}</div>
                      <div className="text-[11px] font-mono text-amber-400">{log.actorRole}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-white font-semibold">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {log.entityType} {log.entityTitle ? `· ${log.entityTitle}` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
