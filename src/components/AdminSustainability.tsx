import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Save, 
  Download, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FileText, 
  Layers, 
  ArrowUp, 
  ArrowDown, 
  Upload, 
  X,
  History,
  Globe,
  Award,
  Users
} from 'lucide-react';
import { exportSustainabilityPDF, exportSustainabilityDOCX } from '../lib/exportEngine.ts';

interface SustainabilityContent {
  title: string;
  heroSubtitle: string;
  introduction: string;
  environmentalPolicy: string;
  safetyPolicy: string;
  localEconomicCommitment: string;
  documents: { title: string; fileUrl: string; docType: string }[];
}

interface Initiative {
  id: number;
  title: string;
  category: string;
  description: string;
  impactSummary: string;
  image: string;
  displayOrder: number;
  status: string;
}

interface SocialProject {
  id: number;
  title: string;
  category: string;
  location: string;
  dateCompleted: string;
  description: string;
  impactMetricsText: string;
  image: string;
  displayOrder: number;
  status: string;
}

interface Metric {
  id: number;
  label: string;
  value: string;
  category: string;
  icon: string;
  displayOrder: number;
  status: string;
}

export const AdminSustainability: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'initiatives' | 'social' | 'metrics' | 'audit'>('overview');
  
  // Data state
  const [content, setContent] = useState<SustainabilityContent>({
    title: 'Sustainability & Social Impact',
    heroSubtitle: 'Building responsibly. Creating lasting value.',
    introduction: '',
    environmentalPolicy: '',
    safetyPolicy: '',
    localEconomicCommitment: '',
    documents: []
  });

  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [socialProjects, setSocialProjects] = useState<SocialProject[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [savingOverview, setSavingOverview] = useState(false);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State for Initiatives
  const [initModalOpen, setInitModalOpen] = useState(false);
  const [editingInit, setEditingInit] = useState<Partial<Initiative> | null>(null);

  // Modal State for Social Projects
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [editingSocial, setEditingSocial] = useState<Partial<SocialProject> | null>(null);

  // Modal State for Metrics
  const [metricModalOpen, setMetricModalOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<Partial<Metric> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetch('/api/admin/sustainability')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.content) setContent(data.content);
          if (data.initiatives) setInitiatives(data.initiatives);
          if (data.socialProjects) setSocialProjects(data.socialProjects);
          if (data.metrics) setMetrics(data.metrics);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
        }
      })
      .catch(err => console.error('Failed to load admin sustainability data:', err));
  };

  const handleSaveOverview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingOverview(true);
    setMsg(null);

    try {
      const res = await fetch('/api/admin/sustainability/overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: 'Overview content saved successfully!', type: 'success' });
        loadData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Save failed', type: 'error' });
    } finally {
      setSavingOverview(false);
    }
  };

  const handleSaveInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInit?.title) return;

    try {
      const res = await fetch('/api/admin/sustainability/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingInit)
      });
      const data = await res.json();
      if (data.success) {
        setInitModalOpen(false);
        setEditingInit(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInitiative = async (id: number) => {
    if (!confirm('Are you sure you want to delete this initiative?')) return;
    try {
      await fetch(`/api/admin/sustainability/initiatives/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSocialProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSocial?.title) return;

    try {
      const res = await fetch('/api/admin/sustainability/social-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSocial)
      });
      const data = await res.json();
      if (data.success) {
        setSocialModalOpen(false);
        setEditingSocial(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSocialProject = async (id: number) => {
    if (!confirm('Delete this social impact project?')) return;
    try {
      await fetch(`/api/admin/sustainability/social-projects/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMetric?.label) return;

    try {
      const res = await fetch('/api/admin/sustainability/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMetric)
      });
      const data = await res.json();
      if (data.success) {
        setMetricModalOpen(false);
        setEditingMetric(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMetric = async (id: number) => {
    if (!confirm('Delete this metric indicator?')) return;
    try {
      await fetch(`/api/admin/sustainability/metrics/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800">
      
      {/* MODULE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">
            <Leaf className="w-4 h-4" />
            <span>MADECC CMS • ESG Management</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Sustainability & Social Impact CMS</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportSustainabilityPDF({ content, initiatives, socialProjects, metrics })}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export PDF Report</span>
          </button>

          <button
            onClick={() => exportSustainabilityDOCX({ content, initiatives, socialProjects, metrics })}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Export DOCX</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl text-xs ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* TABS HEADER */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Executive Vision & Policies' },
          { id: 'initiatives', label: `Green Initiatives (${initiatives.length})` },
          { id: 'social', label: `Social Projects (${socialProjects.length})` },
          { id: 'metrics', label: `Impact Metrics (${metrics.length})` },
          { id: 'audit', label: 'Activity Logs' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EXECUTIVE VISION & POLICIES */}
      {activeTab === 'overview' && (
        <form onSubmit={handleSaveOverview} className="space-y-6">
          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Page Hero Title</label>
            <input 
              type="text" 
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">Hero Subtitle</label>
            <input 
              type="text" 
              value={content.heroSubtitle}
              onChange={(e) => setContent({ ...content, heroSubtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-300 mb-1">1. Executive Vision & Commitment Statement</label>
            <textarea
              rows={5}
              value={content.introduction}
              onChange={(e) => setContent({ ...content, introduction: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">Environmental Policy Statement</label>
              <textarea
                rows={4}
                value={content.environmentalPolicy}
                onChange={(e) => setContent({ ...content, environmentalPolicy: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 mb-1">QHSE & Worksite Safety Policy</label>
              <textarea
                rows={4}
                value={content.safetyPolicy}
                onChange={(e) => setContent({ ...content, safetyPolicy: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={savingOverview}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{savingOverview ? 'Saving Changes...' : 'Save Executive Vision'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: INITIATIVES */}
      {activeTab === 'initiatives' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white">Sustainable Construction Initiatives</h3>
            <button
              onClick={() => {
                setEditingInit({ category: 'Sustainable Construction', status: 'PUBLISHED', displayOrder: initiatives.length + 1 });
                setInitModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Initiative</span>
            </button>
          </div>

          <div className="space-y-3">
            {initiatives.map((init) => (
              <div key={init.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{init.title}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{init.category}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{init.status}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{init.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingInit(init);
                      setInitModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteInitiative(init.id)}
                    className="p-2 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SOCIAL PROJECTS */}
      {activeTab === 'social' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white">Social Impact & Community Projects</h3>
            <button
              onClick={() => {
                setEditingSocial({ category: 'Community Participation', status: 'PUBLISHED', displayOrder: socialProjects.length + 1 });
                setSocialModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Social Project</span>
            </button>
          </div>

          <div className="space-y-3">
            {socialProjects.map((proj) => (
              <div key={proj.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">{proj.title}</span>
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{proj.location}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1">{proj.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingSocial(proj);
                      setSocialModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteSocialProject(proj.id)}
                    className="p-2 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: METRICS */}
      {activeTab === 'metrics' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white">Verified Impact Metrics Indicators</h3>
            <button
              onClick={() => {
                setEditingMetric({ category: 'Social Impact', status: 'PUBLISHED', displayOrder: metrics.length + 1 });
                setMetricModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Metric</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {metrics.map((m) => (
              <div key={m.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-extrabold text-amber-400 block">{m.value}</span>
                  <span className="text-xs font-medium text-white">{m.label}</span>
                  <span className="text-[10px] font-mono text-slate-500 block">{m.category}</span>
                </div>

                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setEditingMetric(m);
                      setMetricModalOpen(true);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteMetric(m.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 p-6 text-center">No CMS activity history logged yet.</p>
          ) : (
            auditLogs.map((log, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
                <span className="text-amber-400">{log.action}</span>
                <span className="text-slate-300">{log.recordTitle}</span>
                <span className="text-slate-500">{log.performedBy}</span>
                <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* EDIT INITIATIVE MODAL */}
      {initModalOpen && editingInit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit Initiative</h3>
            <form onSubmit={handleSaveInitiative} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Title</label>
                <input 
                  type="text" 
                  required
                  value={editingInit.title || ''}
                  onChange={(e) => setEditingInit({ ...editingInit, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Category</label>
                <select
                  value={editingInit.category || 'Sustainable Construction'}
                  onChange={(e) => setEditingInit({ ...editingInit, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="Sustainable Construction">Sustainable Construction</option>
                  <option value="Environmental Responsibility">Environmental Responsibility</option>
                  <option value="Resource Efficiency">Resource Efficiency</option>
                  <option value="Safety & Health">Safety & Health</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingInit.description || ''}
                  onChange={(e) => setEditingInit({ ...editingInit, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Impact Summary / Metric</label>
                <input 
                  type="text" 
                  value={editingInit.impactSummary || ''}
                  onChange={(e) => setEditingInit({ ...editingInit, impactSummary: e.target.value })}
                  placeholder="e.g. 28% reduction in embodied CO2"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Initiative
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SOCIAL PROJECT MODAL */}
      {socialModalOpen && editingSocial && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit Social Project</h3>
            <form onSubmit={handleSaveSocialProject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Project Title</label>
                <input 
                  type="text" 
                  required
                  value={editingSocial.title || ''}
                  onChange={(e) => setEditingSocial({ ...editingSocial, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Location</label>
                <input 
                  type="text" 
                  value={editingSocial.location || ''}
                  onChange={(e) => setEditingSocial({ ...editingSocial, location: e.target.value })}
                  placeholder="e.g. Douala, Littoral Region"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingSocial.description || ''}
                  onChange={(e) => setEditingSocial({ ...editingSocial, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Impact Metrics Summary</label>
                <input 
                  type="text" 
                  value={editingSocial.impactMetricsText || ''}
                  onChange={(e) => setEditingSocial({ ...editingSocial, impactMetricsText: e.target.value })}
                  placeholder="e.g. 120 Youth Trained | 94% Placement"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSocialModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT METRIC MODAL */}
      {metricModalOpen && editingMetric && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit Metric Indicator</h3>
            <form onSubmit={handleSaveMetric} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Label</label>
                <input 
                  type="text" 
                  required
                  value={editingMetric.label || ''}
                  onChange={(e) => setEditingMetric({ ...editingMetric, label: e.target.value })}
                  placeholder="e.g. Local Workers Engaged"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Achieved Value</label>
                <input 
                  type="text" 
                  required
                  value={editingMetric.value || ''}
                  onChange={(e) => setEditingMetric({ ...editingMetric, value: e.target.value })}
                  placeholder="e.g. 85%+"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMetricModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Metric
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
