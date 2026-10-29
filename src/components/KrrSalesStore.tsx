import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ShoppingCart, 
  Eye, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ChevronRight, 
  Plus, 
  Minus, 
  Trash2, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Smartphone, 
  FileText, 
  Building2, 
  ArrowRight,
  ExternalLink,
  Sparkles,
  Info,
  Layers,
  GraduationCap,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { useTheme } from '../lib/ThemeContext.tsx';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

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
  status: string;
  featured: boolean;
  tags?: string[];
  displayOrder: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface KrrSalesStoreProps {
  onNavigateToTab?: (tab: string, state?: any) => void;
}

export const KrrSalesStore: React.FC<KrrSalesStoreProps> = ({ onNavigateToTab }) => {
  const { theme } = useTheme();
  const { settings } = useSiteSettings();
  const { showToast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedYearLevel, setSelectedYearLevel] = useState('ALL');
  const [selectedFormat, setSelectedFormat] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('featured');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Categories & Metadata
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [yearLevelsList, setYearLevelsList] = useState<string[]>([]);

  // Modals & Cart State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('krr_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [shippingCity, setShippingCity] = useState('Yaoundé');
  const [shippingAddress, setShippingAddress] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<'DIGITAL_DOWNLOAD' | 'HOME_DELIVERY' | 'AGENCY_PICKUP_YAOUNDE' | 'AGENCY_PICKUP_DOUALA'>('DIGITAL_DOWNLOAD');
  const [paymentMethod, setPaymentMethod] = useState<'MTN_MOMO' | 'ORANGE_MONEY' | 'BANK_TRANSFER' | 'CASH_ON_DELIVERY'>('MTN_MOMO');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderSuccessData, setOrderSuccessData] = useState<any | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('krr_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not save cart to storage:', e);
    }
  }, [cart]);

  // Load distinct categories
  useEffect(() => {
    fetch('/api/sales/categories')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (Array.isArray(data.categories)) setCategoriesList(data.categories);
          if (Array.isArray(data.yearLevels)) setYearLevelsList(data.yearLevels);
        }
      })
      .catch(err => console.error('Failed to load sales categories:', err));
  }, []);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '12',
        sort: selectedSort
      });
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (selectedCategory !== 'ALL') params.set('category', selectedCategory);
      if (selectedYearLevel !== 'ALL') params.set('yearLevel', selectedYearLevel);
      if (selectedFormat !== 'ALL') params.set('format', selectedFormat);

      const res = await fetch(`/api/sales/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setTotalPages(data.pages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, selectedCategory, selectedYearLevel, selectedFormat, selectedSort]);

  // Handle search with debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 350);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Cart actions
  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`Added "${product.title}" to your cart.`, 'success');
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item removed from cart.', 'info');
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const hasPhysical = cart.some(item => item.product.format === 'PHYSICAL' || item.product.format === 'BUNDLE');

  const deliveryFee = hasPhysical
    ? deliveryMethod === 'HOME_DELIVERY' ? 2500 : 1000
    : 0;
  const cartGrandTotal = cartSubtotal + deliveryFee;

  // Checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !customerPhone) {
      showToast('Please fill in your name, email, and phone number.', 'error');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const payload = {
        items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
        customerName,
        customerEmail,
        customerPhone,
        customerWhatsapp: customerWhatsapp || customerPhone,
        shippingCity,
        shippingAddress,
        deliveryMethod,
        paymentMethod
      };

      const res = await fetch('/api/sales/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed');
      }

      setOrderSuccessData(data);
      setCart([]);
      try {
        localStorage.removeItem('krr_cart');
      } catch {}
      showToast('Order created successfully! Please review payment instructions.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error creating order', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(null), 2500);
    showToast(`Copied ${label} to clipboard!`, 'info');
  };

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${
      theme === 'light' ? 'text-slate-900' : 'text-slate-100'
    }`} id="krr-sales-store">
      
      {/* Hero Header */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 mb-10 border shadow-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border-amber-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            KRR Group & MADECC Educational Publications
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Civil Engineering, TVET & <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Construction Textbooks</span>
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
            Official technical handbooks, MINESEC-aligned TVET curricula, Eurocode 2 structural manuals, and quantity surveying field guides for Cameroonian and Central African engineering professionals. Available in instant digital PDF downloads and hardcover print editions.
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official KRR Group Catalog</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>MTN & Orange Money Instant Checkout</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Direct Digital Delivery</span>
            </div>
          </div>
        </div>

        {/* Floating Cart Button */}
        <div className="absolute top-8 right-8 hidden sm:block">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex items-center gap-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-3 rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="bg-slate-950 text-amber-400 text-xs px-2 py-0.5 rounded-full font-mono">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className={`p-6 rounded-2xl border mb-8 shadow-sm ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900/90 border-slate-800'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, subject, or ISBN..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all ${
                theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Format Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedFormat}
              onChange={e => { setSelectedFormat(e.target.value); setPage(1); }}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="ALL">All Formats</option>
              <option value="DIGITAL">Digital PDF</option>
              <option value="PHYSICAL">Physical Book</option>
              <option value="BUNDLE">Print + Digital Bundle</option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedSort}
              onChange={e => { setSelectedSort(e.target.value); setPage(1); }}
              className={`w-full px-3 py-2.5 rounded-xl border text-xs font-sans focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
              }`}
            >
              <option value="featured">Featured First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest Editions</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Year Level Chips */}
        {yearLevelsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/40">
            <span className="text-xs text-slate-400 font-mono flex items-center gap-1 mr-1">
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" /> Year Level:
            </span>
            <button
              onClick={() => { setSelectedYearLevel('ALL'); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedYearLevel === 'ALL'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'bg-slate-800/60 text-slate-400 hover:text-white'
              }`}
            >
              All Levels
            </button>
            {yearLevelsList.map(lvl => (
              <button
                key={lvl}
                onClick={() => { setSelectedYearLevel(lvl); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedYearLevel === lvl
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-800/60 text-slate-400 hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Result Count and Mobile Cart Trigger */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs font-mono text-slate-400">
          Showing <span className="font-bold text-amber-400">{products.length}</span> of <span className="font-bold text-slate-200">{totalCount}</span> publications
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToTab ? onNavigateToTab('order-tracking') : null}
            className="text-xs text-amber-400 hover:text-amber-300 font-mono font-bold underline flex items-center gap-1 cursor-pointer"
          >
            Track Existing Order →
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="sm:hidden flex items-center gap-2 bg-amber-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Cart ({cartCount})</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800 animate-pulse p-4 flex flex-col justify-between" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-950/40">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">No publications matched your search</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search keywords, clearing categories, or exploring all educational publications.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
              setSelectedYearLevel('ALL');
              setSelectedFormat('ALL');
            }}
            className="mt-4 px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => {
            const isDiscounted = product.compareAtPrice && product.compareAtPrice > product.price;

            return (
              <div 
                key={product.id}
                className={`group rounded-2xl border transition-all duration-300 hover:shadow-2xl hover:border-amber-500/40 flex flex-col justify-between overflow-hidden ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                {/* Cover Image Container */}
                <div 
                  className="relative h-56 bg-slate-950 overflow-hidden cursor-pointer"
                  onClick={() => setSelectedProduct(product)}
                >
                  <img
                    src={product.coverImage}
                    alt={product.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                  {/* Format Badge */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-md ${
                      product.format === 'DIGITAL'
                        ? 'bg-cyan-500/90 text-slate-950'
                        : product.format === 'PHYSICAL'
                        ? 'bg-amber-500/90 text-slate-950'
                        : 'bg-emerald-500/90 text-slate-950'
                    }`}>
                      {product.format === 'DIGITAL' ? '⚡ Instant PDF' : product.format === 'PHYSICAL' ? '📦 Hardcover Print' : '✨ Print + PDF Bundle'}
                    </span>
                    {product.yearLevel && (
                      <span className="bg-slate-900/90 text-slate-300 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono">
                        {product.yearLevel}
                      </span>
                    )}
                  </div>

                  {/* Quick View Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduct(product);
                    }}
                    className="absolute bottom-3 right-3 p-2 rounded-xl bg-slate-900/90 text-slate-300 hover:text-white border border-slate-700/80 hover:bg-slate-800 shadow-md transition-all"
                    title="Quick Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                      <span>{product.category}</span>
                      <span>SKU: {product.sku}</span>
                    </div>

                    <h3 
                      onClick={() => setSelectedProduct(product)}
                      className="text-base font-bold text-white hover:text-amber-400 transition-colors line-clamp-2 cursor-pointer mb-2"
                    >
                      {product.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {product.shortDescription || product.description}
                    </p>
                  </div>

                  {/* Pricing and Cart Button */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-extrabold text-amber-400 font-mono">
                          {product.price.toLocaleString()} <span className="text-xs">XAF</span>
                        </span>
                        {isDiscounted && (
                          <span className="text-xs text-slate-500 line-through font-mono">
                            {product.compareAtPrice?.toLocaleString()} XAF
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 block font-mono">
                        {product.format === 'DIGITAL' ? 'No shipping fee' : 'Physical delivery available'}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-12">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono disabled:opacity-40 hover:bg-slate-800"
          >
            ← Previous
          </button>
          <span className="text-xs font-mono text-slate-400 px-3">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-xs font-mono disabled:opacity-40 hover:bg-slate-800"
          >
            Next →
          </button>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-5">
                <img
                  src={selectedProduct.coverImage}
                  alt={selectedProduct.title}
                  className="w-full h-80 object-cover rounded-2xl shadow-xl border border-slate-800"
                />
                <div className="mt-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-400">
                  <div><strong className="text-slate-300">Format:</strong> {selectedProduct.format}</div>
                  <div><strong className="text-slate-300">Pages:</strong> {selectedProduct.pagesCount || 350} pages</div>
                  <div><strong className="text-slate-300">Language:</strong> {selectedProduct.language || 'English & French'}</div>
                  {selectedProduct.isbn && <div><strong className="text-slate-300">ISBN:</strong> {selectedProduct.isbn}</div>}
                  <div><strong className="text-slate-300">Publisher:</strong> {selectedProduct.publisher}</div>
                </div>
              </div>

              <div className="md:col-span-7 flex flex-col justify-between">
                <div>
                  <div className="inline-block px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 text-xs font-mono font-bold mb-2">
                    {selectedProduct.category}
                  </div>
                  <h2 className="text-2xl font-extrabold text-white mb-2">
                    {selectedProduct.title}
                  </h2>
                  <p className="text-xs text-amber-400/90 font-mono mb-4">
                    By {selectedProduct.author || 'KRR Editorial Board'}
                  </p>

                  <div className="flex items-baseline gap-3 mb-6">
                    <span className="text-2xl font-black text-amber-400 font-mono">
                      {selectedProduct.price.toLocaleString()} XAF
                    </span>
                    {selectedProduct.compareAtPrice && (
                      <span className="text-sm text-slate-500 line-through font-mono">
                        {selectedProduct.compareAtPrice.toLocaleString()} XAF
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mb-6">
                    {selectedProduct.description}
                  </p>

                  {/* Delivery notice */}
                  <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300/90 mb-6 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      {selectedProduct.format === 'DIGITAL' 
                        ? 'Instant Digital Download: Your secured PDF access link is automatically unlocked upon staff verification of your payment.' 
                        : selectedProduct.format === 'PHYSICAL'
                        ? 'Hardcover Book: Dispatched via express courier in Yaoundé, Douala, and regional agencies across Cameroon.'
                        : 'Bundle Pack: Includes immediate digital PDF download and physical book dispatch to your address.'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="flex-grow flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 px-6 rounded-xl shadow-lg transition-all"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart ({selectedProduct.price.toLocaleString()} XAF)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <ShoppingCart className="w-5 h-5 text-amber-500" />
                  <h3 className="font-extrabold text-lg text-white">Your Cart ({cartCount})</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Items List */}
              <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="text-center py-16 text-slate-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">Your shopping cart is currently empty.</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.product.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-3">
                      <img 
                        src={item.product.coverImage} 
                        alt={item.product.title} 
                        className="w-14 h-16 object-cover rounded-lg border border-slate-800 shrink-0" 
                      />
                      <div className="flex-grow min-w-0">
                        <h4 className="text-xs font-bold text-white line-clamp-1">{item.product.title}</h4>
                        <div className="text-[10px] font-mono text-amber-400 mt-0.5">
                          {item.product.price.toLocaleString()} XAF &bull; {item.product.format}
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-900">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="px-2 py-0.5 text-slate-400 hover:text-white"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-xs font-mono font-bold text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="px-2 py-0.5 text-slate-400 hover:text-white"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Footer Summary */}
            {cart.length > 0 && (
              <div className="pt-6 border-t border-slate-800">
                <div className="flex justify-between text-sm text-slate-400 mb-1">
                  <span>Subtotal</span>
                  <span className="font-mono text-white font-bold">{cartSubtotal.toLocaleString()} XAF</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mb-4">
                  <span>Estimated Delivery</span>
                  <span className="font-mono text-amber-400">{hasPhysical ? 'Calculated at checkout' : '0 XAF (Digital)'}</span>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-3.5 rounded-xl shadow-xl transition-all cursor-pointer"
                >
                  <span>Proceed to Checkout</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {orderSuccessData ? (
              /* Success confirmation state */
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-white">Order Created Successfully!</h3>
                <p className="text-xs font-mono text-amber-400 mt-1">
                  Reference: <span className="font-bold underline text-sm">{orderSuccessData.orderReference}</span>
                </p>

                <div className="my-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs font-mono space-y-3">
                  <div className="flex justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Total Payable:</span>
                    <span className="font-bold text-amber-400 text-sm">{orderSuccessData.grandTotal?.toLocaleString()} XAF</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-1">Official Mobile Money Transfer Accounts:</span>
                    <div className="space-y-1.5 text-slate-200">
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <span><strong>MTN MoMo:</strong> {orderSuccessData.mtnNumbers}</span>
                        <button
                          onClick={() => copyToClipboard(orderSuccessData.mtnNumbers, 'MTN numbers')}
                          className="text-amber-400 hover:text-white flex items-center gap-1 text-[10px]"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <span><strong>Orange Money:</strong> {orderSuccessData.orangeNumbers}</span>
                        <button
                          onClick={() => copyToClipboard(orderSuccessData.orangeNumbers, 'Orange numbers')}
                          className="text-amber-400 hover:text-white flex items-center gap-1 text-[10px]"
                        >
                          <Copy className="w-3 h-3" /> Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-normal pt-2">
                    Please transfer the exact amount and save your transaction reference (TXID). You can record your payment receipt immediately on your order tracking portal.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setOrderSuccessData(null);
                      if (onNavigateToTab) {
                        onNavigateToTab('order-tracking', { 
                          orderReference: orderSuccessData.orderReference,
                          accessToken: orderSuccessData.accessToken 
                        });
                      }
                    }}
                    className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-xs cursor-pointer shadow-lg"
                  >
                    <span>Submit Payment Proof & Track Order →</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsCheckoutOpen(false);
                      setOrderSuccessData(null);
                    }}
                    className="px-6 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-mono"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout Form */
              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-white">Order Checkout</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Provide your contact details. Server calculates and verifies all totals in Central African CFA Francs (XAF).
                  </p>
                </div>

                {/* Customer Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">1. Customer Information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        placeholder="e.g. Engr. Paul Kamga"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={customerEmail}
                        onChange={e => setCustomerEmail(e.target.value)}
                        placeholder="paul.kamga@example.cm"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Phone Number (MTN/Orange) *</label>
                      <input
                        type="tel"
                        required
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        placeholder="+237 670 000 000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">WhatsApp Number (Optional)</label>
                      <input
                        type="tel"
                        value={customerWhatsapp}
                        onChange={e => setCustomerWhatsapp(e.target.value)}
                        placeholder="+237 680 000 000"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Delivery & Fulfilment */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">2. Delivery Location & Method</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Delivery City</label>
                      <select
                        value={shippingCity}
                        onChange={e => setShippingCity(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Yaoundé">Yaoundé (Headquarters)</option>
                        <option value="Douala">Douala (Branch Hub)</option>
                        <option value="Bafoussam">Bafoussam</option>
                        <option value="Bamenda">Bamenda</option>
                        <option value="Garoua">Garoua</option>
                        <option value="Kribi">Kribi</option>
                        <option value="Limbe">Limbe / Buea</option>
                        <option value="Other">Other CEMAC Region</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">Fulfilment Method</label>
                      <select
                        value={deliveryMethod}
                        onChange={e => setDeliveryMethod(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="DIGITAL_DOWNLOAD">Direct Digital Download (0 XAF)</option>
                        {hasPhysical && (
                          <>
                            <option value="HOME_DELIVERY">Express Doorstep Delivery (2,500 XAF)</option>
                            <option value="AGENCY_PICKUP_YAOUNDE">Pickup at KRR Yaoundé Office (1,000 XAF)</option>
                            <option value="AGENCY_PICKUP_DOUALA">Pickup at Douala Akwa Desk (1,000 XAF)</option>
                          </>
                        )}
                      </select>
                    </div>

                    {hasPhysical && deliveryMethod === 'HOME_DELIVERY' && (
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-mono text-slate-400 block mb-1">Street Address / Landmark</label>
                        <input
                          type="text"
                          required
                          value={shippingAddress}
                          onChange={e => setShippingAddress(e.target.value)}
                          placeholder="e.g. Bastos, near Embassy road / Akwa Boulevard"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">3. Payment Method</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'MTN_MOMO', label: 'MTN MoMo', icon: Smartphone },
                      { id: 'ORANGE_MONEY', label: 'Orange Money', icon: Smartphone },
                      { id: 'BANK_TRANSFER', label: 'Bank Wire', icon: Building2 },
                      { id: 'CASH_ON_DELIVERY', label: 'Counter Pickup', icon: CreditCard }
                    ].map(m => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === m.id
                            ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <m.icon className="w-4 h-4" />
                        <span className="text-[11px]">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Cost Calculation */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Items Subtotal:</span>
                    <span>{cartSubtotal.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Delivery Fee:</span>
                    <span>{deliveryFee.toLocaleString()} XAF</span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-800 text-sm">
                    <span className="text-amber-400">Total Due (XAF):</span>
                    <span className="text-amber-400 font-extrabold">{cartGrandTotal.toLocaleString()} XAF</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 rounded-xl shadow-xl transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingOrder ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <span>Confirm Order ({cartGrandTotal.toLocaleString()} XAF)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KrrSalesStore;
