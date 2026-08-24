import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Download, 
  FileText, 
  X,
  History,
  Tag,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { exportFaqsPDF } from '../lib/exportEngine.ts';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  categoryId: number;
  categoryName: string;
  tags?: string[];
  featured?: boolean;
  displayOrder?: number;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  author?: string;
  reviewer?: string;
  seoTitle?: string;
  seoDescription?: string;
  relatedService?: string;
  relatedPage?: string;
}

interface FAQCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  displayOrder: number;
}

export const AdminFaq: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faqs' | 'categories' | 'audit'>('faqs');
  
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // FAQ Edit Modal State
  const [faqModalOpen, setFaqModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);

  // Category Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Partial<FAQCategory> | null>(null);

  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetch('/api/admin/faqs')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.faqs) setFaqs(data.faqs);
          if (data.categories) setCategories(data.categories);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
        }
      })
      .catch(err => console.error('Failed to load admin FAQs data:', err));
  };

  const handleSaveFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaq?.question || !editingFaq?.answer) return;

    try {
      const res = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFaq)
      });
      const data = await res.json();
      if (data.success) {
        setFaqModalOpen(false);
        setEditingFaq(null);
        setMsg({ text: 'FAQ saved successfully!', type: 'success' });
        loadData();
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Save failed', type: 'error' });
    }
  };

  const handleStatusChange = async (faq: FAQ, newStatus: string) => {
    try {
      await fetch(`/api/admin/faqs/${faq.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFaq = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateFaq = async (faq: FAQ) => {
    try {
      await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...faq,
          id: undefined,
          question: `${faq.question} (Copy)`,
          status: 'DRAFT'
        })
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat?.name) return;

    try {
      const res = await fetch('/api/admin/faqs/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCat)
      });
      const data = await res.json();
      if (data.success) {
        setCatModalOpen(false);
        setEditingCat(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFaqs = faqs.filter(f => {
    const matchesCat = selectedCatFilter === 'All' || f.categoryName === selectedCatFilter;
    const matchesStatus = selectedStatusFilter === 'All' || f.status === selectedStatusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q);
    return matchesCat && matchesStatus && matchesQ;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">PUBLISHED</span>;
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 font-bold border border-blue-500/20">APPROVED</span>;
      case 'PENDING_REVIEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">PENDING REVIEW</span>;
      case 'DRAFT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">DRAFT</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <HelpCircle className="w-4 h-4" />
            <span>MADECC CMS • Help Centre Management</span>
          </div>
          <h2 className="text-2xl font-bold text-white">FAQ & Help Centre CMS</h2>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportFaqsPDF(filteredFaqs, selectedCatFilter)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Export FAQ Dossier (PDF)</span>
          </button>

          <button
            onClick={() => {
              setEditingFaq({ categoryName: 'General', status: 'PUBLISHED', displayOrder: faqs.length + 1 });
              setFaqModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add New FAQ</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl text-xs ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          {msg.text}
        </div>
      )}

      {/* TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
            activeTab === 'faqs'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Manage FAQs ({faqs.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Categories ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Audit History
        </button>
      </div>

      {/* TAB 1: FAQS MANAGEMENT TABLE */}
      {activeTab === 'faqs' && (
        <div>
          {/* SEARCH & FILTERS BAR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search questions or answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <select
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="DRAFT">DRAFT</option>
                <option value="PENDING_REVIEW">PENDING REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="UNPUBLISHED">UNPUBLISHED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {/* TABLE LIST */}
          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div key={faq.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-white">{faq.question}</span>
                    {getStatusBadge(faq.status)}
                    <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">{faq.categoryName}</span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{faq.answer}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={faq.status}
                    onChange={(e) => handleStatusChange(faq, e.target.value)}
                    className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-mono"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING_REVIEW">REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="UNPUBLISHED">UNPUBLISH</option>
                    <option value="ARCHIVED">ARCHIVE</option>
                  </select>

                  <button
                    onClick={() => {
                      setEditingFaq(faq);
                      setFaqModalOpen(true);
                    }}
                    className="p-2 text-slate-400 hover:text-white"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDuplicateFaq(faq)}
                    className="p-2 text-slate-400 hover:text-amber-400"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-2 text-slate-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-white">FAQ Categories</h3>
            <button
              onClick={() => {
                setEditingCat({ displayOrder: categories.length + 1 });
                setCatModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-white block">{c.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">Slug: {c.slug}</span>
                </div>

                <button
                  onClick={() => {
                    setEditingCat(c);
                    setCatModalOpen(true);
                  }}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.map((log, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
              <span className="text-amber-400">{log.action}</span>
              <span className="text-slate-300">{log.recordTitle}</span>
              <span className="text-slate-500">{log.performedBy}</span>
              <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* EDIT FAQ MODAL */}
      {faqModalOpen && editingFaq && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit FAQ Entry</h3>
            <form onSubmit={handleSaveFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Question *</label>
                <input 
                  type="text" 
                  required
                  value={editingFaq.question || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Category *</label>
                <select
                  value={editingFaq.categoryName || 'General'}
                  onChange={(e) => setEditingFaq({ ...editingFaq, categoryName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Answer *</label>
                <textarea
                  rows={4}
                  required
                  value={editingFaq.answer || ''}
                  onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Publication Status</label>
                <select
                  value={editingFaq.status || 'PUBLISHED'}
                  onChange={(e) => setEditingFaq({ ...editingFaq, status: e.target.value as any })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PENDING_REVIEW">PENDING REVIEW</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="UNPUBLISHED">UNPUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFaqModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save FAQ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {catModalOpen && editingCat && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 relative">
            <h3 className="text-lg font-bold text-white mb-4">Edit FAQ Category</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Category Name</label>
                <input 
                  type="text" 
                  required
                  value={editingCat.name || ''}
                  onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
