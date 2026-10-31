import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Download, 
  Eye, 
  FileText, 
  Smartphone, 
  Building2, 
  ExternalLink,
  Upload,
  RefreshCw,
  Sparkles,
  Layers,
  Check,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { getAuthToken } from '../lib/firebase.ts';

interface Product {
  id: number;
  sku: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  category: string;
  yearLevel?: string;
  subject?: string;
  format: 'DIGITAL' | 'PHYSICAL' | 'BUNDLE';
  price: number;
  compareAtPrice?: number;
  coverImage: string;
  previewPdfUrl?: string;
  digitalFileUrl?: string;
  digitalFileName?: string;
  digitalFileSizeMb?: string;
  stockQuantity?: number;
  trackInventory: boolean;
  isbn?: string;
  author?: string;
  publisher?: string;
  publicationYear?: number;
  pagesCount?: number;
  language?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  featured: boolean;
  tags?: string[];
  displayOrder: number;
  createdAt: string;
}

interface Order {
  id: number;
  orderReference: string;
  accessToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerWhatsapp?: string;
  shippingCity: string;
  shippingAddress?: string;
  deliveryMethod: string;
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  grandTotal: number;
  currency: string;
  orderStatus: 'PENDING' | 'PROCESSING' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'UNPAID' | 'AWAITING_VERIFICATION' | 'VERIFIED_PAID' | 'PAYMENT_REJECTED' | 'REFUNDED';
  paymentMethod: string;
  internalNotes?: string;
  createdAt: string;
  items?: any[];
  payments?: any[];
}

interface PaymentSubmission {
  id: number;
  orderId: number;
  orderReference: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference: string;
  payerPhone?: string;
  payerName?: string;
  proofImageUrl?: string;
  status: 'AWAITING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
}

interface DashboardMetrics {
  totalOrders: number;
  pendingVerificationCount: number;
  verifiedOrdersCount: number;
  totalVerifiedRevenue: number;
  pendingOrdersCount: number;
  completedOrdersCount: number;
  totalProductsCount: number;
  lowStockCount: number;
}

const safeConfirm = (message: string): boolean => {
  if (typeof window === 'undefined') return true;
  if (window.self !== window.top) {
    return true;
  }
  try {
    return window.confirm(message);
  } catch (e) {
    return true;
  }
};

export const AdminSalesHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'verification'>('overview');

  // Metrics
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Products
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDigitalFile, setUploadingDigitalFile] = useState(false);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingOrderStatus, setUpdatingOrderStatus] = useState(false);

  // Verification Queue
  const [pendingPayments, setPendingPayments] = useState<PaymentSubmission[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<number | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [verifyingAction, setVerifyingAction] = useState(false);

  const getAuthHeaders = async (includeJson = true): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    if (includeJson) headers['Content-Type'] = 'application/json';
    try {
      const token = await getAuthToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {}
    return headers;
  };

  // 1. Fetch Metrics
  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch('/api/admin/sales/dashboard-metrics', {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (err) {
      console.error('Failed to load sales metrics:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // 2. Fetch Products
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch('/api/admin/sales/products', {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // 3. Fetch Orders
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const headers = await getAuthHeaders(false);
      const params = new URLSearchParams();
      if (orderSearch) params.set('search', orderSearch);
      if (orderStatusFilter !== 'ALL') params.set('orderStatus', orderStatusFilter);
      if (orderPaymentFilter !== 'ALL') params.set('paymentStatus', orderPaymentFilter);

      const res = await fetch(`/api/admin/sales/orders?${params.toString()}`, {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // 4. Fetch Pending Payments
  const fetchPendingPayments = async () => {
    setLoadingPayments(true);
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch('/api/admin/sales/payments/pending', {
        headers,
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.payments)) {
        setPendingPayments(data.payments);
      }
    } catch (err) {
      console.error('Failed to load pending payments:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    fetchProducts();
    fetchOrders();
    fetchPendingPayments();
  }, []);

  // Save / Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.title?.trim() || !editingProduct?.sku?.trim() || editingProduct?.price === undefined || editingProduct?.price === null) {
      showToast('Please fill in title, SKU, and price.', 'error');
      return;
    }

    setSavingProduct(true);
    try {
      const headers = await getAuthHeaders(true);
      const isEdit = Boolean(editingProduct.id);
      const url = isEdit 
        ? `/api/admin/sales/products/${editingProduct.id}` 
        : '/api/admin/sales/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(editingProduct)
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error(`Server returned unexpected response (status ${res.status}). Could not save publication.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save product');
      }

      showToast(`Publication ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
      setIsProductModalOpen(false);
      setEditingProduct(null);
      fetchProducts();
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || 'Error saving product', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: number) => {
    if (!safeConfirm('Are you sure you want to delete this publication? This will remove it from the online store.')) return;
    try {
      const headers = await getAuthHeaders(false);
      const res = await fetch(`/api/admin/sales/products/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (_) {}

      if (res.ok && data.success) {
        showToast('Publication deleted successfully.', 'success');
        fetchProducts();
        fetchMetrics();
      } else {
        throw new Error(data.error || 'Failed to delete publication');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting product', 'error');
    }
  };

  // Handle Image Upload for Product Cover
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const headers = await getAuthHeaders(false);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: headers.Authorization ? { 'Authorization': headers.Authorization } : undefined,
        body: formData
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('Upload response was not valid JSON. Server status: ' + res.status);
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Server rejected file upload');
      }

      setEditingProduct(prev => prev ? ({ ...prev, coverImage: data.url }) : null);
      showToast('Cover image uploaded successfully.', 'success');
    } catch (err: any) {
      showToast('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle Digital PDF Book Upload
  const handleProductDigitalFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDigitalFile(true);
    try {
      const headers = await getAuthHeaders(false);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: headers.Authorization ? { 'Authorization': headers.Authorization } : undefined,
        body: formData
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        throw new Error('Upload response was not valid JSON. Server status: ' + res.status);
      }
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'File upload failed');
      }

      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setEditingProduct(prev => prev ? ({
        ...prev,
        digitalFileUrl: data.url,
        digitalFileName: file.name,
        digitalFileSizeMb: sizeMb
      }) : null);
      showToast(`Book PDF uploaded successfully (${sizeMb} MB)!`, 'success');
    } catch (err: any) {
      showToast('Digital file upload failed: ' + err.message, 'error');
    } finally {
      setUploadingDigitalFile(false);
    }
  };


  // Approve or Reject Payment Verification
  const handleVerifyPayment = async (paymentId: number, action: 'APPROVE' | 'REJECT', reason?: string) => {
    setVerifyingAction(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/sales/payments/${paymentId}/verify`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ action, rejectionReason: reason })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      showToast(data.message || `Payment ${action === 'APPROVE' ? 'approved' : 'rejected'}.`, 'success');
      setRejectingPaymentId(null);
      setRejectionReasonInput('');
      fetchPendingPayments();
      fetchOrders();
      fetchMetrics();
    } catch (err: any) {
      showToast(err.message || 'Error executing verification', 'error');
    } finally {
      setVerifyingAction(false);
    }
  };

  // Update Order Status
  const handleUpdateOrderStatus = async (orderId: number, status: string, notes?: string) => {
    setUpdatingOrderStatus(true);
    try {
      const headers = await getAuthHeaders(true);
      const res = await fetch(`/api/admin/sales/orders/${orderId}/status`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({ orderStatus: status, internalNotes: notes })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Order status updated.', 'success');
        fetchOrders();
        fetchMetrics();
        if (selectedOrder) {
          setSelectedOrder(prev => prev ? { ...prev, orderStatus: status as any } : null);
        }
      }
    } catch (err: any) {
      showToast('Failed to update order status', 'error');
    } finally {
      setUpdatingOrderStatus(false);
    }
  };

  // CSV Export
  const exportOrdersCSV = () => {
    if (orders.length === 0) {
      showToast('No orders to export.', 'info');
      return;
    }
    const headers = ['Order Ref', 'Date', 'Customer Name', 'Email', 'Phone', 'City', 'Grand Total XAF', 'Order Status', 'Payment Status', 'Payment Method'];
    const rows = orders.map(o => [
      o.orderReference,
      new Date(o.createdAt).toLocaleDateString(),
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.shippingCity,
      String(o.grandTotal),
      o.orderStatus,
      o.paymentStatus,
      o.paymentMethod
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krr_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('Orders exported to CSV.', 'success');
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesCat = productCategoryFilter === 'ALL' || p.category === productCategoryFilter;
    const q = productSearch.toLowerCase().trim();
    const matchesQ = !q || p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-6" id="admin-sales-hub">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-500 uppercase tracking-widest mb-1">
            <ShoppingCart className="w-4 h-4" />
            <span>KRR Group Commercial Operations Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            E-Commerce &amp; Textbook Sales Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Live catalog administration, Mobile Money transaction verification, order fulfillment, and digital downloads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingProduct({
                format: 'DIGITAL',
                status: 'PUBLISHED',
                price: 15000,
                displayOrder: 1,
                trackInventory: false,
                stockQuantity: 100,
                category: 'Civil Engineering Textbooks',
                yearLevel: 'General'
              });
              setIsProductModalOpen(true);
            }}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2.5 rounded-xl text-xs shadow-lg transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Publication</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: DollarSign },
          { id: 'products', label: `Publications Catalog (${products.length})`, icon: Package },
          { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingCart },
          { id: 'verification', label: `Payment Queue (${pendingPayments.length})`, icon: CheckCircle2 }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              activeTab === t.id
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* SUBTAB 1: OVERVIEW METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Verified Revenue</span>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {metrics?.totalVerifiedRevenue ? metrics.totalVerifiedRevenue.toLocaleString() : '0'} <span className="text-xs font-normal">XAF</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">Exclusively from confirmed transactions</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Pending Verifications</span>
              <div className="text-2xl font-black text-blue-400 font-mono mt-1">
                {metrics?.pendingVerificationCount || 0}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">MoMo / Orange receipts awaiting review</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Total Orders</span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {metrics?.totalOrders || 0}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">{metrics?.completedOrdersCount || 0} fulfilled / completed</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
              <span className="text-[11px] font-mono text-slate-400 uppercase">Publications Catalog</span>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                {metrics?.totalProductsCount || 0}
              </div>
              <span className="text-[10px] text-slate-500 font-mono mt-1 block">{metrics?.lowStockCount || 0} low stock physical alerts</span>
            </div>
          </div>

          {/* Quick verification callout if items pending */}
          {pendingPayments.length > 0 && (
            <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-white">{pendingPayments.length} Payment Submissions Awaiting Approval</h4>
                  <p className="text-xs text-blue-200/80 mt-0.5">Customers have submitted Mobile Money references. Review their transaction IDs to unlock their digital textbooks.</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('verification')}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs rounded-xl shadow cursor-pointer whitespace-nowrap"
              >
                Review Queue →
              </button>
            </div>
          )}

          {/* Workflow Guide Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>How Order Fulfillment &amp; Download Unlocking Works</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold font-mono inline-flex items-center justify-center mb-2">1</span>
                <h4 className="font-bold text-white mb-1">Customer Places Order</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The buyer checks out with their phone and receives a reference (e.g. KRR-ORD-2026-XXXX) and payment instructions for your MTN MoMo or Orange Money number.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold font-mono inline-flex items-center justify-center mb-2">2</span>
                <h4 className="font-bold text-white mb-1">Proof Submitted (Locked)</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The buyer transfers money and inputs their TXID. The download button remains locked to prevent unverified downloads with fake or unpaid transaction references.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono inline-flex items-center justify-center mb-2">3</span>
                <h4 className="font-bold text-white mb-1">Admin Approves &amp; Unlocks</h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  You check the Payment Queue below or click "⚡ 1-Click Fast Unlock" on the tracking page. The order status shifts to VERIFIED_PAID and the PDF download button instantly activates for the client!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PRODUCTS CATALOG */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder="Filter products..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={e => setProductCategoryFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              >
                <option value="ALL">All Categories</option>
                <option value="Civil Engineering Textbooks">Civil Engineering</option>
                <option value="Building Construction">Building Construction</option>
                <option value="Quantity Surveying & BOQ">Quantity Surveying & BOQ</option>
                <option value="Technical School & TVET">Technical School & TVET</option>
                <option value="Eurocode & Standards">Eurocode & Standards</option>
                <option value="Educational Guides">Educational Guides</option>
              </select>
            </div>

            <button
              onClick={fetchProducts}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Publication</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Format</th>
                    <th className="py-3 px-4">Price (XAF)</th>
                    <th className="py-3 px-4">Stock</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={p.coverImage} 
                            alt={p.title} 
                            className="w-10 h-12 object-cover rounded shadow border border-slate-800 shrink-0" 
                          />
                          <div>
                            <span className="font-bold text-white block line-clamp-1">{p.title}</span>
                            <span className="text-[10px] font-mono text-slate-500">SKU: {p.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-400">{p.category}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          p.format === 'DIGITAL' ? 'bg-cyan-500/20 text-cyan-300' : p.format === 'PHYSICAL' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {p.format}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {p.price.toLocaleString()} XAF
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {p.trackInventory ? `${p.stockQuantity} units` : 'Unlimited'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          p.status === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: ORDERS MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)}
                  placeholder="Search orders..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <select
                value={orderStatusFilter}
                onChange={e => setOrderStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              >
                <option value="ALL">All Order Statuses</option>
                <option value="PENDING">PENDING</option>
                <option value="PROCESSING">PROCESSING</option>
                <option value="DISPATCHED">DISPATCHED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <select
                value={orderPaymentFilter}
                onChange={e => setOrderPaymentFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
              >
                <option value="ALL">All Payments</option>
                <option value="UNPAID">UNPAID</option>
                <option value="AWAITING_VERIFICATION">AWAITING REVIEW</option>
                <option value="VERIFIED_PAID">VERIFIED PAID</option>
                <option value="PAYMENT_REJECTED">REJECTED</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportOrdersCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={fetchOrders}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Order Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Delivery</th>
                    <th className="py-3 px-4">Total (XAF)</th>
                    <th className="py-3 px-4">Payment</th>
                    <th className="py-3 px-4">Order Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {orders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{o.orderReference}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-white block">{o.customerName}</span>
                        <span className="text-[10px] text-slate-500">{o.customerEmail} &bull; {o.customerPhone}</span>
                      </td>
                      <td className="py-3 px-4 text-[11px] font-mono text-slate-400">
                        {o.shippingCity} ({o.deliveryMethod})
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">{o.grandTotal.toLocaleString()} XAF</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          o.paymentStatus === 'VERIFIED_PAID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : o.paymentStatus === 'AWAITING_VERIFICATION'
                            ? 'bg-blue-500/20 text-blue-300'
                            : o.paymentStatus === 'PAYMENT_REJECTED'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={o.orderStatus}
                          onChange={e => handleUpdateOrderStatus(o.id, e.target.value)}
                          className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-white"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PROCESSING">PROCESSING</option>
                          <option value="DISPATCHED">DISPATCHED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            fetch(`/api/admin/sales/orders/${o.id}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` } })
                              .then(res => res.json())
                              .then(data => {
                                if (data.order) setSelectedOrder(data.order);
                              });
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                          title="View Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PAYMENT VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              Payments awaiting financial audit &amp; approval ({pendingPayments.length})
            </span>
            <button
              onClick={fetchPendingPayments}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="text-center py-16 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500/40" />
              <p className="text-sm font-bold text-slate-300">All payment submissions verified!</p>
              <p className="text-xs text-slate-500 mt-1">There are no pending mobile money transactions awaiting review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingPayments.map(pay => (
                <div key={pay.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">Order Reference</span>
                      <h4 className="text-base font-black text-amber-400 font-mono">{pay.orderReference}</h4>
                      <span className="text-xs text-slate-400 block mt-0.5">Submitted on {new Date(pay.createdAt).toLocaleString()}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-black text-white font-mono">{pay.amount.toLocaleString()} XAF</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 block mt-0.5">
                        {pay.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                    <div><span className="text-slate-500">Transaction ID (TXID):</span> <strong className="text-amber-400">{pay.transactionReference}</strong></div>
                    <div><span className="text-slate-500">Payer Name:</span> {pay.payerName || 'N/A'}</div>
                    <div><span className="text-slate-500">Payer Phone:</span> {pay.payerPhone || 'N/A'}</div>
                  </div>

                  {/* Proof Attachment */}
                  {pay.proofImageUrl && (
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Attached Receipt:</span>
                      <button
                        onClick={() => setPreviewProofUrl(pay.proofImageUrl!)}
                        className="text-amber-400 hover:text-white underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Receipt Image
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      disabled={verifyingAction}
                      onClick={() => handleVerifyPayment(pay.id, 'APPROVE')}
                      className="flex-grow flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve &amp; Unlock Order</span>
                    </button>

                    <button
                      disabled={verifyingAction}
                      onClick={() => setRejectingPaymentId(pay.id)}
                      className="flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Proof Viewer Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setPreviewProofUrl(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-sm font-mono font-bold text-white mb-3">Customer Receipt Screenshot</h4>
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-[70vh] flex items-center justify-center">
              <img src={previewProofUrl} alt="Payment Proof" className="max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectingPaymentId !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Reject Payment Submission</span>
            </h4>
            <p className="text-xs text-slate-400">
              Provide the reason for rejecting this transaction. The customer will receive this message in their order portal and via email notification.
            </p>

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Reason for Rejection *</label>
              <textarea
                required
                rows={3}
                value={rejectionReasonInput}
                onChange={e => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Transaction reference not found on MTN merchant records. Please check the TXID and re-submit."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRejectingPaymentId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionReasonInput.trim() || verifyingAction}
                onClick={() => handleVerifyPayment(rejectingPaymentId, 'REJECT', rejectionReasonInput)}
                className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Create / Edit Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => {
                setIsProductModalOpen(false);
                setEditingProduct(null);
              }}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-white mb-4">
              {editingProduct.id ? 'Edit Publication' : 'Add New Educational Publication'}
            </h3>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Publication Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.title || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, title: e.target.value })}
                    placeholder="e.g. Cameroon Civil Engineering & Eurocode 2 Manual"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">SKU *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.sku || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, sku: e.target.value.toUpperCase() })}
                    placeholder="e.g. KRR-TXT-2026-001"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Price in XAF *</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.price || 0}
                    onChange={e => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Category</label>
                  <select
                    value={editingProduct.category || 'Civil Engineering Textbooks'}
                    onChange={e => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="Civil Engineering Textbooks">Civil Engineering Textbooks</option>
                    <option value="Building Construction">Building Construction</option>
                    <option value="Quantity Surveying & BOQ">Quantity Surveying & BOQ</option>
                    <option value="Technical School & TVET">Technical School & TVET</option>
                    <option value="Eurocode & Standards">Eurocode & Standards</option>
                    <option value="Educational Guides">Educational Guides</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Format</label>
                  <select
                    value={editingProduct.format || 'DIGITAL'}
                    onChange={e => setEditingProduct({ ...editingProduct, format: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    <option value="DIGITAL">DIGITAL (Secured PDF)</option>
                    <option value="PHYSICAL">PHYSICAL (Hardcover Print)</option>
                    <option value="BUNDLE">BUNDLE (Print + Digital)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Cover Image URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingProduct.coverImage || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, coverImage: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    />
                    <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer text-xs font-mono shrink-0">
                      {uploadingImage ? '...' : 'Upload'}
                      <input type="file" accept="image/*" onChange={handleProductImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Secured Digital PDF Book File</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingProduct.digitalFileUrl || ''}
                      onChange={e => setEditingProduct({ ...editingProduct, digitalFileUrl: e.target.value })}
                      placeholder="https://.../textbook.pdf or upload below"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    />
                    <label className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl cursor-pointer text-xs font-mono shrink-0 flex items-center gap-1.5 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingDigitalFile ? 'Uploading...' : 'Upload PDF'}</span>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.epub" 
                        onChange={handleProductDigitalFileUpload} 
                        className="hidden" 
                        disabled={uploadingDigitalFile}
                      />
                    </label>
                  </div>
                  {editingProduct.digitalFileName && (
                    <span className="text-[10px] font-mono text-emerald-400 block mt-1">
                      File: {editingProduct.digitalFileName} {editingProduct.digitalFileSizeMb ? `(${editingProduct.digitalFileSizeMb} MB)` : ''}
                    </span>
                  )}
                </div>


                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Author</label>
                  <input
                    type="text"
                    value={editingProduct.author || 'KRR Engineering Editorial Board'}
                    onChange={e => setEditingProduct({ ...editingProduct, author: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Publisher</label>
                  <input
                    type="text"
                    value={editingProduct.publisher || 'KRR Group & MADECC Publishing, Yaoundé'}
                    onChange={e => setEditingProduct({ ...editingProduct, publisher: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Status</label>
                  <select
                    value={editingProduct.status || 'PUBLISHED'}
                    onChange={e => setEditingProduct({ ...editingProduct, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  >
                    <option value="PUBLISHED">PUBLISHED (Live in store)</option>
                    <option value="DRAFT">DRAFT (Hidden)</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stockQuantity || 100}
                    onChange={e => setEditingProduct({ ...editingProduct, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={editingProduct.description || ''}
                    onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs disabled:opacity-50 cursor-pointer shadow-lg"
                >
                  {savingProduct ? 'Saving...' : 'Save Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Details Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex justify-end">
          <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-400">Order Reference</span>
                  <h3 className="text-xl font-black text-amber-400 font-mono">{selectedOrder.orderReference}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Customer details */}
              <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5">
                <div><span className="text-slate-500">Customer:</span> <strong className="text-white">{selectedOrder.customerName}</strong></div>
                <div><span className="text-slate-500">Email:</span> {selectedOrder.customerEmail}</div>
                <div><span className="text-slate-500">Phone:</span> {selectedOrder.customerPhone}</div>
                <div><span className="text-slate-500">City &amp; Method:</span> {selectedOrder.shippingCity} ({selectedOrder.deliveryMethod})</div>
                {selectedOrder.shippingAddress && <div><span className="text-slate-500">Address:</span> {selectedOrder.shippingAddress}</div>}
              </div>

              {/* Items */}
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-2">Purchased Items</h4>
              <div className="space-y-2 mb-6">
                {(selectedOrder.items || []).map((item: any) => (
                  <div key={item.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white block">{item.productTitle}</span>
                      <span className="text-[10px] font-mono text-slate-400">Qty: {item.quantity} &bull; {item.productFormat}</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold">{item.totalPrice.toLocaleString()} XAF</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{selectedOrder.subtotal.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Delivery Fee:</span>
                  <span>{selectedOrder.deliveryFee.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between text-amber-400 font-bold text-sm pt-2 border-t border-slate-800">
                  <span>Total Amount:</span>
                  <span>{selectedOrder.grandTotal.toLocaleString()} XAF</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedOrder(null)}
              className="mt-6 w-full py-3 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSalesHub;
