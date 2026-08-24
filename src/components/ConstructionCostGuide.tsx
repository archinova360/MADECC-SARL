import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  TrendingUp, 
  Download, 
  Calculator, 
  FileText, 
  Phone, 
  MessageSquare, 
  Info, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  ArrowRight, 
  Layers, 
  HelpCircle, 
  Clock, 
  DollarSign, 
  BarChart3, 
  RefreshCw,
  Hammer,
  Truck,
  Briefcase,
  Home
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ConstructionCostGuideProps {
  onNavigateToTab?: (tab: string, extraState?: any) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ConstructionCostGuide: React.FC<ConstructionCostGuideProps> = ({ 
  onNavigateToTab,
  showToast 
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & State
  const [selectedRegion, setSelectedRegion] = useState<string>('Centre');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Fetch live public cost guide data
  useEffect(() => {
    setLoading(true);
    fetch('/api/public/construction-cost-guide')
      .then(res => {
        if (!res.ok) throw new Error('Failed loading cost guide data');
        return res.json();
      })
      .then(data => {
        setData(data);
        setError(null);
      })
      .catch(err => {
        console.error('Cost guide error:', err);
        setError('Unable to load latest market rate data. Please check your connection.');
      })
      .finally(() => setLoading(false));
  }, []);

  // Filtered Items
  const getFilteredItems = () => {
    if (!data) return [];
    let items = [...(data.materials || []), ...(data.labour || []), ...(data.plant || [])];

    if (activeCategory !== 'All') {
      items = items.filter(i => i.category === activeCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => 
        i.name.toLowerCase().includes(q) || 
        i.itemCode.toLowerCase().includes(q) ||
        (i.specifications && i.specifications.toLowerCase().includes(q))
      );
    }

    return items;
  };

  // Get Location-Adjusted Rate
  const getAdjustedRate = (item: any) => {
    const base = parseFloat(item.basePriceXaf) || 0;
    if (selectedRegion === 'Littoral' && item.doualaPrice) return parseFloat(item.doualaPrice);
    if (selectedRegion === 'Centre' && item.yaoundePrice) return parseFloat(item.yaoundePrice);
    if (selectedRegion === 'North' && item.garouaPrice) return parseFloat(item.garouaPrice);

    // Apply multiplier
    const factorObj = data?.regionalFactors?.[selectedRegion];
    const mult = factorObj ? factorObj.multiplier : 1.0;
    return Math.round(base * mult);
  };

  // PDF Export
  const handleDownloadPdf = () => {
    if (!data) return;
    try {
      const doc = new jsPDF();
      
      // Header Banner
      doc.setFillColor(15, 23, 42); // Dark Navy
      doc.rect(0, 0, 210, 30, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(245, 158, 11); // Amber
      doc.text('MADECC GROUP S.A.', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text('CAMEROON CONSTRUCTION COST GUIDE 2026', 110, 18);

      // Metadata
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Rate Version: ${data.rateVersion}`, 14, 38);
      doc.text(`Region: ${selectedRegion} (${data.regionalFactors?.[selectedRegion]?.city || 'Cameroon'})`, 100, 38);
      doc.text(`Currency: XAF`, 165, 38);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated Date: ${new Date().toLocaleDateString('en-GB')}`, 14, 44);

      // Table Header
      let y = 52;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, 182, 8, 'F');
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('Item Code', 18, y + 5);
      doc.text('Description / Name', 50, y + 5);
      doc.text('Unit', 125, y + 5);
      doc.text('Indicative Rate (XAF)', 155, y + 5);

      y += 12;

      const items = getFilteredItems();
      items.forEach((item, i) => {
        if (y > 260) {
          doc.addPage();
          y = 20;
        }
        const rate = getAdjustedRate(item);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(item.itemCode || '-', 18, y);
        doc.text(item.name.substring(0, 38), 50, y);
        doc.text(item.unit, 125, y);
        doc.text(`XAF ${rate.toLocaleString()}`, 155, y);

        doc.setDrawColor(241, 245, 249);
        doc.line(14, y + 2, 196, y + 2);
        y += 7;
      });

      // Disclaimer
      y = Math.max(y + 10, 245);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('DISCLAIMER: Prices shown are indicative market rates for feasibility estimation and do not constitute a binding quotation.', 14, y);
      doc.text('Contact MADECC Group for formal BOQs: +237 671 063 511 / +237 683 316 486 | kreboya603@gmail.com', 14, y + 4);

      doc.save(`MADECC-Cameroon-Construction-Cost-Guide-${selectedRegion}-2026.pdf`);
      if (showToast) showToast('Cost guide PDF downloaded successfully.', 'success');
    } catch (err) {
      console.error('PDF error:', err);
      if (showToast) showToast('Failed generating PDF download.', 'error');
    }
  };

  const getWhatsAppUrl = (topic: string = 'General Inquiry') => {
    const msg = `Hello MADECC Group, I am reviewing your Cameroon Construction Cost Guide 2026 (${topic}). I would like to request assistance for my construction project in ${selectedRegion}.`;
    return `https://wa.me/237683316486?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* 1. HERO HEADER */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-12 lg:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Metadata Badges Bar */}
          <div className="flex flex-wrap items-center gap-2 mb-4 text-xs font-semibold">
            <span className="px-3 py-1 bg-amber-500 text-slate-950 rounded-full font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Official MADECC Index
            </span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Last Updated: {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : 'August 2026'}
            </span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
              Rate Version: <span className="text-amber-400 font-mono font-bold">{data?.rateVersion || 'MADECC-RATES-2026-08'}</span>
            </span>
            <span className="px-3 py-1 bg-slate-800 text-slate-300 rounded-full border border-slate-700">
              Currency: <span className="text-emerald-400 font-bold">XAF (FCFA)</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-tight">
            Cameroon Construction Cost Guide & Price Index 2026
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-3xl leading-relaxed mb-8">
            Transparent, administrator-maintained construction rate intelligence. Track current prices for building materials, labour trades, and per-square-metre construction benchmarks across Douala, Yaoundé, Kribi, and Cameroon’s 10 regions.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab && onNavigateToTab('budget-calculator')}
              className="px-6 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              <Calculator className="w-4 h-4" /> Calculate My Project Budget
            </button>

            <button
              onClick={() => onNavigateToTab && onNavigateToTab('booking')}
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-xl border border-slate-700 transition-all flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-amber-400" /> Request Professional BOQ
            </button>

            <a
              href={getWhatsAppUrl('Direct Assistance')}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Talk to MADECC Group
            </a>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">

        {/* 2. IMPORTANT DISCLAIMER */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-8 backdrop-blur-sm flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            <span className="font-bold text-amber-900">Important Price Disclaimer:</span> {data?.disclaimer || 'Construction prices are indicative and can vary according to location, supplier, quantity, project specifications, site conditions, market conditions, transportation, labour availability and other factors. The prices shown on this page are not a final quotation. For a project-specific cost estimate, BOQ or quotation, contact MADECC Group.'}
          </div>
        </div>

        {/* 3. PRICE INDEX DASHBOARD */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-6">
            <div>
              <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4" /> Market Benchmark Engine
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Cameroon Construction Price Index
              </h2>
            </div>

            <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              Base Period: <span className="font-bold text-slate-800">{data?.priceIndices?.basePeriod || 'August 2026'}</span> (100.0)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-500 mb-1">Overall Price Index</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {data?.priceIndices?.overallIndex || '104.2'}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> {data?.priceIndices?.trendVsPreviousMonth || '+1.4%'} vs prev period
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-500 mb-1">Material Price Index</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600">
                {data?.priceIndices?.materialIndex || '105.1'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Cement, Steel & Aggregates</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-500 mb-1">Labour Rate Index</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {data?.priceIndices?.labourIndex || '102.5'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Masonry & Steelwork</div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div className="text-xs font-bold text-slate-500 mb-1">Services & Plant Index</div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {data?.priceIndices?.servicesIndex || '103.8'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Excavators & Mixers</div>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/60 leading-relaxed flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{data?.priceIndices?.statusMessage || 'Official MADECC Price Index calculated against baseline rate version MADECC-RATES-2026-08 across key urban centers.'}</span>
          </div>
        </div>

        {/* 4. LOCATION SELECTOR & REGIONAL MULTIPLIERS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" /> Select Construction Region
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Rates dynamically adjust based on freight, quarry proximity, and regional logistics.</p>
            </div>

            {/* Region Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Centre', city: 'Yaoundé' },
                { name: 'Littoral', city: 'Douala' },
                { name: 'South', city: 'Kribi' },
                { name: 'West', city: 'Bafoussam' },
                { name: 'North', city: 'Garoua' },
                { name: 'Far North', city: 'Maroua' },
                { name: 'East', city: 'Bertoua' },
              ].map(reg => (
                <button
                  key={reg.name}
                  onClick={() => setSelectedRegion(reg.name)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedRegion === reg.name
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {reg.name} ({reg.city})
                </button>
              ))}
            </div>
          </div>

          {/* Location Details Box */}
          {data?.regionalFactors?.[selectedRegion] && (
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">
                  {data.regionalFactors[selectedRegion].multiplier}x
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedRegion} Region ({data.regionalFactors[selectedRegion].city})
                  </div>
                  <div className="text-slate-600 mt-0.5">{data.regionalFactors[selectedRegion].note}</div>
                </div>
              </div>

              <div className="hidden sm:block text-right shrink-0">
                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
                  Active Rates Available
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 5. MATERIAL & LABOUR PRICE GUIDE TABLES */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl mb-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Hammer className="w-5 h-5 text-amber-500" /> Building Materials & Labour Rate Guide
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Filter by category or search specific structural materials.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Category Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
                {['All', 'Material', 'Labour', 'Plant'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      activeCategory === cat ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* PDF Export Button */}
              <button
                onClick={handleDownloadPdf}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> PDF Guide
              </button>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search material or trade (e.g. Cement, Sand, Steel, Mason, Blocks)..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Rate Items Table */}
          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              Fetching current database construction rates...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Material / Trade Name</th>
                    <th className="py-3 px-4">Unit</th>
                    <th className="py-3 px-4">Indicative Rate ({selectedRegion})</th>
                    <th className="py-3 px-4">Specifications</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {getFilteredItems().map((item: any) => {
                    const adjRate = getAdjustedRate(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400 font-semibold">{item.itemCode}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.category === 'Material' ? 'bg-amber-100 text-amber-800' :
                            item.category === 'Labour' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                        <td className="py-3 px-4 text-slate-600 font-bold">{item.unit}</td>
                        <td className="py-3 px-4 font-mono text-amber-600 font-bold text-sm">
                          XAF {adjRate.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                          {item.specifications || 'Standard construction grade'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => onNavigateToTab && onNavigateToTab('budget-calculator')}
                            className="text-amber-600 hover:text-amber-700 font-bold text-[11px] hover:underline"
                          >
                            Estimate &rarr;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 6. CONSTRUCTION COST PER SQUARE METRE BENCHMARKS */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl mb-8 space-y-6">
          <div className="border-b border-slate-100 pb-5">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              Building Economics
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Construction Cost per Square Metre (m²) in Cameroon
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Estimated complete turn-key cost benchmarks per m² (Structural frame, finishes, doors/windows, MEP).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { type: 'Residential House', low: 175000, typical: 210000, high: 260000, desc: 'Single storey family bungalow' },
              { type: 'Duplex Home', low: 205000, typical: 245000, high: 310000, desc: '2-Level modern residential home' },
              { type: 'Luxury Villa', low: 235000, typical: 280000, high: 370000, desc: 'High-end architectural residence' },
              { type: 'Apartment Building', low: 215000, typical: 260000, high: 330000, desc: 'Multi-family residential flats' },
              { type: 'Commercial Plaza', low: 245000, typical: 290000, high: 380000, desc: 'Retail & commercial building' },
              { type: 'Office Building', low: 260000, typical: 310000, high: 410000, desc: 'Corporate office facility' },
              { type: 'Warehouse / Hangar', low: 145000, typical: 180000, high: 230000, desc: 'Industrial steel frame storage' },
              { type: 'Hotel / Hospitality', low: 280000, typical: 340000, high: 450000, desc: 'Guest lodging facility' },
            ].map(b => (
              <div key={b.type} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-0.5">{b.type}</div>
                  <div className="text-[11px] text-slate-500 mb-4">{b.desc}</div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500">Economy:</span>
                      <span className="font-mono font-bold text-slate-700">XAF {b.low.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/60 pb-1">
                      <span className="text-slate-500 font-semibold">Typical Standard:</span>
                      <span className="font-mono font-extrabold text-amber-600">XAF {b.typical.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Premium / Luxury:</span>
                      <span className="font-mono font-bold text-slate-700">XAF {b.high.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onNavigateToTab && onNavigateToTab('budget-calculator')}
                  className="mt-5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Calculator className="w-3.5 h-3.5" /> Calculate {b.type}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 7. WHY PRICES CHANGE & EDUCATIONAL SECTION */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl mb-8 space-y-6">
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              Market Intelligence
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Why Do Construction Prices Vary Across Cameroon?
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Understanding the key structural cost drivers helps property developers optimize project timing and site budgets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2">
              <Truck className="w-5 h-5 text-amber-400" />
              <div className="font-bold text-white text-sm">Transport & Freight Distance</div>
              <div className="text-slate-300 leading-relaxed">
                Materials manufactured in Douala (cement, steel) or imported through the port incur heavy long-distance freight tariffs to northern regions (Garoua, Maroua).
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <div className="font-bold text-white text-sm">Quarry & Aggregate Access</div>
              <div className="text-slate-300 leading-relaxed">
                Proximity to granite quarries in the Centre, West, and South regions reduces crushed aggregate and river sand costs compared to sandy coastal areas.
              </div>
            </div>

            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2">
              <Hammer className="w-5 h-5 text-amber-400" />
              <div className="font-bold text-white text-sm">Skilled Labour Availability</div>
              <div className="text-slate-300 leading-relaxed">
                Urban centers like Yaoundé and Douala maintain competitive master mason and steel fixer daily rates due to trade worker density.
              </div>
            </div>
          </div>
        </div>

        {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl mb-8 space-y-6">
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
              Knowledge Base
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Frequently Asked Questions About Construction Costs
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                q: 'What is the average cost to build a 4-bedroom house in Cameroon?',
                a: 'A typical 4-bedroom residential bungalow with approximately 220 m² floor area costs between XAF 42,000,000 and XAF 55,000,000 depending on quality standard and location (Yaoundé / Douala).'
              },
              {
                q: 'Why are cement and steel prices different in Garoua vs Douala?',
                a: 'Douala benefits from direct port access for raw clinker and steel billets. Transporting heavy cement bags and steel bars 1,100 km north to Garoua adds transit freight and logistics costs.'
              },
              {
                q: 'What is the difference between this online cost guide and a professional BOQ?',
                a: 'This cost guide provides preliminary indicative market benchmarks for feasibility planning. A professional Bill of Quantities (BOQ) is an exact line-item measure calculated directly from architectural and structural engineering drawings.'
              },
              {
                q: 'How can MADECC Group help reduce my building construction cost?',
                a: 'MADECC Group provides quantity surveying value engineering, direct bulk material sourcing from manufacturers (Dangal, Cimencam), and strict site material control to minimize waste.'
              }
            ].map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 text-left font-bold text-slate-900 text-sm flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-amber-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 9. CENTRALIZED CONTACT & CALL TO ACTION */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-slate-950 text-slate-950 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl relative z-10 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-amber-400 font-extrabold text-xs rounded-full">
              <Briefcase className="w-3.5 h-3.5" /> Start Your Project
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
              Need a Binding Quotation or Engineering BOQ for Your Site?
            </h2>
            <p className="text-slate-900 font-medium text-sm leading-relaxed">
              Our registered Quantity Surveyors and Civil Engineers analyze your architectural plans to produce detailed Bills of Quantities and structural site costings.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={getWhatsAppUrl('Formal BOQ Request')}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <MessageSquare className="w-4 h-4" /> Request BOQ via WhatsApp
              </a>

              <a
                href="tel:+237671063511"
                className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2"
              >
                <Phone className="w-4 h-4 text-amber-600" /> Call Office (+237 671 063 511)
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
