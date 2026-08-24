import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Plus, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  Archive, 
  Sparkles, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  ListOrdered, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Building2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface ServiceCMS {
  id: number;
  slug: string;
  name: string;
  serviceCode: string;
  shortDescription: string;
  fullDescription: string;
  category: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  displayOrder: number;
  priceRange: string;
  icon: string;
  coverImage: string;
  gallery: string[];
  supportingDocuments: { title: string; url: string; fileType: string }[];
  
  // SEO
  seoTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalSlug: string;
  socialTitle: string;
  socialDescription: string;
  socialImage: string;

  // Content Blocks
  overview: string;
  whatWeDeliver: string[];
  deliverables: string[];
  processSteps: { title: string; desc: string }[];
  typicalProjects: string[];
  industriesServed: string[];
  faqs: { q: string; a: string }[];
  relatedProjects: string[];
  relatedInsights: string[];

  // Dynamic Sections Builder
  sections: {
    id: string;
    title: string;
    type: 'overview' | 'deliverables' | 'process' | 'benefits' | 'projects' | 'faqs' | 'custom' | 'cta';
    content: string;
    visible: boolean;
    order: number;
  }[];

  ctaText: string;
  ctaDestination: string;

  createdAt: string;
  updatedAt: string;
  quoteRequestsCount?: number;
}

const SERVICE_CATEGORIES = [
  'Construction & Execution',
  'Engineering & Infrastructure',
  'Design & Architecture',
  'Quantity Surveying & Cost Estimation',
  'Project Management & Consultancy',
  'Specialized Services'
];

export const AdminServices: React.FC = () => {
  const [services, setServices] = useState<ServiceCMS[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [featuredFilter, setFeaturedFilter] = useState<string>('ALL');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Modal / Editor State
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editingService, setEditingService] = useState<ServiceCMS | null>(null);
  const [editorTab, setEditorTab] = useState<'basic' | 'content' | 'sections' | 'media' | 'seo' | 'cta'>('basic');
  const [saving, setSaving] = useState<boolean>(false);

  // Preview Modal State
  const [previewService, setPreviewService] = useState<ServiceCMS | null>(null);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services?admin=true', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!res.ok) throw new Error('Failed to fetch services.');
      const data = await res.json();
      setServices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Filtered Services List
  const filteredServices = services.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.serviceCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shortDescription?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'ALL' || s.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesFeatured = featuredFilter === 'ALL' || 
      (featuredFilter === 'YES' && s.featured) || 
      (featuredFilter === 'NO' && !s.featured);

    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  }).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  // Summary Metrics
  const totalCount = services.length;
  const publishedCount = services.filter(s => s.status === 'PUBLISHED').length;
  const draftCount = services.filter(s => s.status === 'DRAFT').length;
  const archivedCount = services.filter(s => s.status === 'ARCHIVED').length;
  const featuredCount = services.filter(s => s.featured).length;

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredServices.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleOpenNewService = () => {
    const nextCode = `MD-SRV-${String(totalCount + 1).padStart(3, '0')}`;
    setEditingService({
      id: 0,
      slug: '',
      name: '',
      serviceCode: nextCode,
      shortDescription: '',
      fullDescription: '',
      category: SERVICE_CATEGORIES[0],
      status: 'DRAFT',
      featured: false,
      displayOrder: totalCount + 1,
      priceRange: 'Custom Quote / Project Scope',
      icon: 'Building2',
      coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=1200',
      gallery: [],
      supportingDocuments: [],
      seoTitle: '',
      metaDescription: '',
      keywords: 'Construction, Cameroon, Yaoundé, Civil Engineering',
      canonicalSlug: '',
      socialTitle: '',
      socialDescription: '',
      socialImage: '',
      overview: '',
      whatWeDeliver: ['Structural Engineering & Calculations', 'Turnkey Construction Execution', 'Quality Assurance & Testing'],
      deliverables: ['As-built Architectural Drawings', 'Material Tensile Testing Reports', 'Handover Occupancy Certificate'],
      processSteps: [
        { title: 'Site Inspection & Geotechnical Survey', desc: 'Comprehensive soil testing and topographical grid alignment.' },
        { title: 'Detailed BOQ & Cost Estimation', desc: 'Quantity surveyor cost breakdown based on 2026 market rates.' },
        { title: 'Structural & Site Execution', desc: 'Foundation pouring, reinforced concrete frame erection, and MEP installation.' }
      ],
      typicalProjects: ['Residential Duplexes & Villas', 'Commercial Office Plazas'],
      industriesServed: ['Real Estate Development', 'Institutional & Government'],
      faqs: [
        { q: 'How is project pricing calculated for this service?', a: 'Pricing is based on floor area, structural complexity, and specific material specifications.' }
      ],
      relatedProjects: [],
      relatedInsights: [],
      sections: [
        { id: 'sec-overview', title: 'Service Overview', type: 'overview', content: 'Comprehensive overview of service capabilities.', visible: true, order: 1 },
        { id: 'sec-deliverables', title: 'Key Deliverables', type: 'deliverables', content: 'What clients receive upon completion.', visible: true, order: 2 },
        { id: 'sec-process', title: 'Work Process', type: 'process', content: 'Step-by-step project delivery flow.', visible: true, order: 3 }
      ],
      ctaText: 'Request a Service Quote',
      ctaDestination: 'request-a-quote',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setEditorTab('basic');
    setIsEditorOpen(true);
  };

  const handleEditService = (service: ServiceCMS) => {
    setEditingService({ ...service });
    setEditorTab('basic');
    setIsEditorOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;

    if (!editingService.name.trim()) {
      alert('Please enter a valid Service Name.');
      return;
    }

    setSaving(true);
    try {
      const isNew = editingService.id === 0;
      const url = isNew ? '/api/services' : `/api/services/${editingService.id}`;
      const method = isNew ? 'POST' : 'PUT';

      // Auto generate slug if empty
      const slug = editingService.slug || editingService.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      const payload = {
        ...editingService,
        slug
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save service record.');
      }

      setIsEditorOpen(false);
      setEditingService(null);
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Error saving service.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (service: ServiceCMS, newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ ...service, status: newStatus })
      });

      if (!res.ok) throw new Error('Status update failed');
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Status change failed');
    }
  };

  const handleDuplicateService = async (service: ServiceCMS) => {
    if (!confirm(`Duplicate service "${service.name}" into a new DRAFT service?`)) return;

    try {
      const copyPayload = {
        ...service,
        id: undefined,
        name: `${service.name} (Copy)`,
        serviceCode: `${service.serviceCode}-COPY`,
        slug: `${service.slug}-copy-${Date.now()}`,
        status: 'DRAFT',
        featured: false,
        displayOrder: totalCount + 1
      };

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(copyPayload)
      });

      if (!res.ok) throw new Error('Duplicate failed');
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate service');
    }
  };

  const handleDeleteService = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete service "${name}"? This action removes it from database records.`)) return;

    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });

      if (!res.ok) throw new Error('Delete failed');
      fetchServices();
    } catch (err: any) {
      alert(err.message || 'Failed to delete service');
    }
  };

  const handleBulkAction = async (action: 'PUBLISH' | 'UNPUBLISH' | 'ARCHIVE' | 'DELETE') => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Apply bulk ${action} action on ${selectedIds.length} selected services?`)) return;

    try {
      for (const id of selectedIds) {
        const target = services.find(s => s.id === id);
        if (!target) continue;

        if (action === 'DELETE') {
          await fetch(`/api/services/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
          });
        } else {
          const newStatus = action === 'PUBLISH' ? 'PUBLISHED' : action === 'UNPUBLISH' ? 'DRAFT' : 'ARCHIVED';
          await fetch(`/api/services/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: JSON.stringify({ ...target, status: newStatus })
          });
        }
      }

      setSelectedIds([]);
      fetchServices();
    } catch (err: any) {
      alert('Error performing bulk action');
    }
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="text-xs font-bold text-amber-600 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-amber-500" /> Content Management System
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
            Services CMS Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Manage MADECC Group's construction, engineering, consultancy, and project delivery services catalog served on the public website.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={fetchServices}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync DB
          </button>
          <button
            onClick={handleOpenNewService}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-md shadow-amber-500/10"
          >
            <Plus className="w-4 h-4" /> Add New Service
          </button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Services', val: totalCount, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'Published', val: publishedCount, color: 'text-emerald-600', bg: 'bg-emerald-50/60' },
          { label: 'Drafts', val: draftCount, color: 'text-amber-600', bg: 'bg-amber-50/60' },
          { label: 'Archived', val: archivedCount, color: 'text-slate-500', bg: 'bg-slate-100/60' },
          { label: 'Featured', val: featuredCount, color: 'text-purple-600', bg: 'bg-purple-50/60' },
          { label: 'Categories', val: SERVICE_CATEGORIES.length, color: 'text-blue-600', bg: 'bg-blue-50/60' }
        ].map((m, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border border-slate-200/80 shadow-sm ${m.bg}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase block truncate">{m.label}</span>
            <span className="text-xl sm:text-2xl font-black font-mono mt-0.5 block">{m.val}</span>
          </div>
        ))}
      </div>

      {/* Search, Filter & Bulk Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search service name, code, category, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
          >
            <option value="ALL">All Categories</option>
            {SERVICE_CATEGORIES.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>

          {/* Featured Filter */}
          <select
            value={featuredFilter}
            onChange={(e) => setFeaturedFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
          >
            <option value="ALL">Featured (All)</option>
            <option value="YES">Featured Only</option>
            <option value="NO">Standard</option>
          </select>
        </div>

        {/* Bulk Action Controls */}
        {selectedIds.length > 0 && (
          <div className="w-full pt-3 border-t border-slate-200 flex items-center justify-between bg-amber-50/50 p-2 rounded-xl border border-amber-200">
            <span className="font-bold text-slate-800 text-xs">
              {selectedIds.length} item(s) selected:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleBulkAction('PUBLISH')}
                className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] hover:bg-emerald-700"
              >
                Publish All
              </button>
              <button
                onClick={() => handleBulkAction('UNPUBLISH')}
                className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg text-[11px] hover:bg-amber-700"
              >
                Unpublish
              </button>
              <button
                onClick={() => handleBulkAction('ARCHIVE')}
                className="px-3 py-1 bg-slate-700 text-white font-bold rounded-lg text-[11px] hover:bg-slate-800"
              >
                Archive
              </button>
              <button
                onClick={() => handleBulkAction('DELETE')}
                className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-[11px] hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Services CMS Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
            Loading Services CMS catalog...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No matching services found.</p>
            <p className="text-xs text-slate-400">Click "Add New Service" above to publish a service.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === filteredServices.length && filteredServices.length > 0}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="p-4">Service & Code</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Featured</th>
                  <th className="p-4 text-center">Order</th>
                  <th className="p-4 text-right">Updated</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredServices.map((service) => {
                  const isSelected = selectedIds.includes(service.id);
                  return (
                    <tr key={service.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-amber-50/30' : ''}`}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(service.id)}
                          className="rounded border-slate-300"
                        />
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {service.coverImage ? (
                            <img
                              src={service.coverImage}
                              alt={service.name}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-bold flex-shrink-0">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span>{service.name}</span>
                              <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                                {service.serviceCode || 'MD-SRV'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">{service.shortDescription}</p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 text-slate-700 font-semibold">{service.category}</td>

                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          service.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                          service.status === 'DRAFT' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                          'bg-slate-200 text-slate-700'
                        }`}>
                          {service.status}
                        </span>
                      </td>

                      <td className="p-4 text-center">
                        {service.featured ? (
                          <Star className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto" />
                        ) : (
                          <Star className="w-4 h-4 text-slate-300 mx-auto" />
                        )}
                      </td>

                      <td className="p-4 text-center font-mono font-bold text-slate-600">
                        #{service.displayOrder || 1}
                      </td>

                      <td className="p-4 text-right text-slate-500 text-[11px]">
                        {new Date(service.updatedAt || service.createdAt || Date.now()).toLocaleDateString()}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setPreviewService(service)}
                            title="Preview Public Presentation"
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleEditService(service)}
                            title="Edit Service Record"
                            className="p-1.5 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicateService(service)}
                            title="Duplicate to Draft"
                            className="p-1.5 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {service.status === 'PUBLISHED' ? (
                            <button
                              onClick={() => handleToggleStatus(service, 'DRAFT')}
                              title="Unpublish to Draft"
                              className="p-1.5 hover:bg-amber-100 text-amber-800 rounded-lg transition-colors"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(service, 'PUBLISHED')}
                              title="Publish Live"
                              className="p-1.5 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteService(service.id, service.name)}
                            title="Delete Service"
                            className="p-1.5 hover:bg-rose-100 text-rose-700 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SERVICE EDITOR MODAL / DRAWER */}
      {isEditorOpen && editingService && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  {editingService.id === 0 ? 'Create New Service' : `Editing Service #${editingService.id}`}
                </span>
                <h2 className="text-lg sm:text-xl font-bold">{editingService.name || 'Untitled Service'}</h2>
              </div>

              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs Bar */}
            <div className="bg-slate-100 border-b border-slate-200 flex overflow-x-auto px-4 text-xs font-bold text-slate-600">
              {[
                { id: 'basic', label: '1. Basic Information' },
                { id: 'content', label: '2. Content & Deliverables' },
                { id: 'sections', label: '3. Sections Builder' },
                { id: 'media', label: '4. Media & Cloudinary' },
                { id: 'seo', label: '5. SEO & Metadata' },
                { id: 'cta', label: '6. CTA & Actions' }
              ].map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setEditorTab(t.id as any)}
                  className={`px-4 py-3 border-b-2 transition-all whitespace-nowrap ${
                    editorTab === t.id
                      ? 'border-amber-500 text-slate-900 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Form Content Body */}
            <form onSubmit={handleSaveService} className="p-6 flex-1 overflow-y-auto space-y-6 text-xs text-slate-800">
              
              {/* TAB 1: BASIC INFORMATION */}
              {editorTab === 'basic' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        Service Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Structural & Civil Engineering"
                        value={editingService.name}
                        onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Service Code</label>
                      <input
                        type="text"
                        placeholder="e.g. MD-SRV-001"
                        value={editingService.serviceCode}
                        onChange={(e) => setEditingService({ ...editingService, serviceCode: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Category</label>
                      <select
                        value={editingService.category}
                        onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {SERVICE_CATEGORIES.map((c, i) => (
                          <option key={i} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Publication Status</label>
                      <select
                        value={editingService.status}
                        onChange={(e) => setEditingService({ ...editingService, status: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="DRAFT">DRAFT (Hidden)</option>
                        <option value="PUBLISHED">PUBLISHED (Live)</option>
                        <option value="ARCHIVED">ARCHIVED (Retained)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Display Order Priority</label>
                      <input
                        type="number"
                        value={editingService.displayOrder}
                        onChange={(e) => setEditingService({ ...editingService, displayOrder: parseInt(e.target.value) || 1 })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Price Range / Estimate Note</label>
                      <input
                        type="text"
                        placeholder="e.g. From 1,500,000 XAF / Custom Quote"
                        value={editingService.priceRange}
                        onChange={(e) => setEditingService({ ...editingService, priceRange: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="feat-check"
                      checked={editingService.featured}
                      onChange={(e) => setEditingService({ ...editingService, featured: e.target.checked })}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="feat-check" className="font-bold text-slate-800 cursor-pointer">
                      Highlight as Featured Service on Homepage & Nav Headers
                    </label>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Short Description (Summary Card Text)</label>
                    <textarea
                      rows={2}
                      placeholder="Brief 1-2 sentence service summary..."
                      value={editingService.shortDescription}
                      onChange={(e) => setEditingService({ ...editingService, shortDescription: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Description & Scope Overview</label>
                    <textarea
                      rows={4}
                      placeholder="Comprehensive overview of service capabilities, technical specifications, and team credentials..."
                      value={editingService.fullDescription}
                      onChange={(e) => setEditingService({ ...editingService, fullDescription: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: CONTENT & DELIVERABLES */}
              {editorTab === 'content' && (
                <div className="space-y-5">
                  {/* What We Deliver List */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Key Deliverables / What We Provide (Comma separated or one per line)
                    </label>
                    <textarea
                      rows={3}
                      value={Array.isArray(editingService.whatWeDeliver) ? editingService.whatWeDeliver.join('\n') : String(editingService.whatWeDeliver || '')}
                      onChange={(e) => setEditingService({
                        ...editingService,
                        whatWeDeliver: e.target.value.split('\n').filter(line => line.trim().length > 0)
                      })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Typical Projects */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Typical Project Applications (One per line)
                    </label>
                    <textarea
                      rows={3}
                      value={Array.isArray(editingService.typicalProjects) ? editingService.typicalProjects.join('\n') : String(editingService.typicalProjects || '')}
                      onChange={(e) => setEditingService({
                        ...editingService,
                        typicalProjects: e.target.value.split('\n').filter(line => line.trim().length > 0)
                      })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Frequently Asked Questions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800">Frequently Asked Questions (FAQs)</label>
                      <button
                        type="button"
                        onClick={() => setEditingService({
                          ...editingService,
                          faqs: [...(editingService.faqs || []), { q: 'New Question?', a: 'Detailed answer.' }]
                        })}
                        className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[11px] font-bold"
                      >
                        + Add FAQ Item
                      </button>
                    </div>

                    {(editingService.faqs || []).map((faq, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-amber-600">FAQ #{idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setEditingService({
                              ...editingService,
                              faqs: editingService.faqs.filter((_, i) => i !== idx)
                            })}
                            className="text-rose-500 hover:text-rose-700 font-bold"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Question..."
                          value={faq.q}
                          onChange={(e) => {
                            const updatedFaqs = [...editingService.faqs];
                            updatedFaqs[idx].q = e.target.value;
                            setEditingService({ ...editingService, faqs: updatedFaqs });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                        />
                        <textarea
                          rows={2}
                          placeholder="Answer..."
                          value={faq.a}
                          onChange={(e) => {
                            const updatedFaqs = [...editingService.faqs];
                            updatedFaqs[idx].a = e.target.value;
                            setEditingService({ ...editingService, faqs: updatedFaqs });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: SECTIONS BUILDER */}
              {editorTab === 'sections' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">Custom Service Page Sections</h3>
                      <p className="text-[11px] text-slate-500">Reorder, modify, or show/hide custom content blocks rendered on the public service view.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newSec = {
                          id: `sec-${Date.now()}`,
                          title: 'New Custom Section',
                          type: 'custom' as const,
                          content: 'Enter section content details here...',
                          visible: true,
                          order: (editingService.sections?.length || 0) + 1
                        };
                        setEditingService({
                          ...editingService,
                          sections: [...(editingService.sections || []), newSec]
                        });
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                    >
                      + Add Section
                    </button>
                  </div>

                  {(editingService.sections || []).map((sec, idx) => (
                    <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={sec.visible}
                            onChange={(e) => {
                              const secs = [...editingService.sections];
                              secs[idx].visible = e.target.checked;
                              setEditingService({ ...editingService, sections: secs });
                            }}
                          />
                          <span className="font-bold text-slate-800">Section #{idx + 1}: {sec.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingService({
                            ...editingService,
                            sections: editingService.sections.filter((_, i) => i !== idx)
                          })}
                          className="text-rose-500 hover:text-rose-700 font-bold"
                        >
                          Delete Block
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Section Title</label>
                          <input
                            type="text"
                            value={sec.title}
                            onChange={(e) => {
                              const secs = [...editingService.sections];
                              secs[idx].title = e.target.value;
                              setEditingService({ ...editingService, sections: secs });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Section Type</label>
                          <select
                            value={sec.type}
                            onChange={(e) => {
                              const secs = [...editingService.sections];
                              secs[idx].type = e.target.value as any;
                              setEditingService({ ...editingService, sections: secs });
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                          >
                            <option value="overview">Overview</option>
                            <option value="deliverables">Deliverables</option>
                            <option value="process">Process</option>
                            <option value="benefits">Benefits</option>
                            <option value="projects">Projects</option>
                            <option value="faqs">FAQs</option>
                            <option value="custom">Custom Markdown / Text</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-600 mb-1">Section Content Body</label>
                        <textarea
                          rows={3}
                          value={sec.content}
                          onChange={(e) => {
                            const secs = [...editingService.sections];
                            secs[idx].content = e.target.value;
                            setEditingService({ ...editingService, sections: secs });
                          }}
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 4: MEDIA & CLOUDINARY */}
              {editorTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cover Image URL (Cloudinary / Unsplash)</label>
                    <input
                      type="url"
                      placeholder="https://res.cloudinary.com/..."
                      value={editingService.coverImage}
                      onChange={(e) => setEditingService({ ...editingService, coverImage: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    {editingService.coverImage && (
                      <img
                        src={editingService.coverImage}
                        alt="Preview"
                        className="mt-2 h-32 w-full object-cover rounded-xl border border-slate-200"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Service Icon (Lucide Icon Name)</label>
                    <input
                      type="text"
                      placeholder="Building2, Layers, Ruler, Compass, Calculator"
                      value={editingService.icon}
                      onChange={(e) => setEditingService({ ...editingService, icon: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: SEO & METADATA */}
              {editorTab === 'seo' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">SEO Title Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Building Construction & Civil Engineering | MADECC Group Cameroon"
                      value={editingService.seoTitle}
                      onChange={(e) => setEditingService({ ...editingService, seoTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Meta Description</label>
                    <textarea
                      rows={2}
                      placeholder="Search engine snippet text..."
                      value={editingService.metaDescription}
                      onChange={(e) => setEditingService({ ...editingService, metaDescription: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Keywords / Tags (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="construction, engineering, yaounde, douala, boq estimate"
                      value={editingService.keywords}
                      onChange={(e) => setEditingService({ ...editingService, keywords: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: CTA & ACTIONS */}
              {editorTab === 'cta' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      placeholder="e.g. Request a Service Quote"
                      value={editingService.ctaText}
                      onChange={(e) => setEditingService({ ...editingService, ctaText: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">CTA Target Destination Tab</label>
                    <select
                      value={editingService.ctaDestination}
                      onChange={(e) => setEditingService({ ...editingService, ctaDestination: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="request-a-quote">Request a Quote (/request-a-quote)</option>
                      <option value="schedule-consultation">Schedule Consultation (/schedule-consultation)</option>
                      <option value="budget-calculator">Budget Calculator (/budget-calculator)</option>
                      <option value="contact">Contact Us (/contact)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Modal Action Bar */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
                >
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Service Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PUBLIC PREVIEW MODAL */}
      {previewService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200 my-8 p-8 space-y-6 text-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                  Public Preview Mode ({previewService.status})
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">{previewService.name}</h2>
              </div>
              <button
                onClick={() => setPreviewService(null)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewService.coverImage && (
              <img
                src={previewService.coverImage}
                alt={previewService.name}
                className="w-full h-48 rounded-2xl object-cover border border-slate-200"
              />
            )}

            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Service Overview</h3>
                <p className="text-slate-600 leading-relaxed mt-1">{previewService.fullDescription || previewService.shortDescription}</p>
              </div>

              {previewService.whatWeDeliver && Array.isArray(previewService.whatWeDeliver) && (
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-2">Key Deliverables</h3>
                  <ul className="space-y-1 text-slate-700">
                    {previewService.whatWeDeliver.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewService(null)}
                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
