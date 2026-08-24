import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Building2, 
  MapPin, 
  Layers, 
  Sliders, 
  CheckCircle2, 
  FileText, 
  Download, 
  Phone, 
  MessageSquare, 
  Send, 
  Info, 
  AlertTriangle, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  RefreshCw, 
  HelpCircle,
  Home,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  ListFilter,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ProjectBudgetCalculatorProps {
  onNavigateToTab?: (tab: string) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ProjectBudgetCalculator: React.FC<ProjectBudgetCalculatorProps> = ({ 
  onNavigateToTab,
  showToast 
}) => {
  // Mode selection
  const [mode, setMode] = useState<'quick' | 'detailed'>('quick');
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Inputs
  const [projectType, setProjectType] = useState<string>('Residential House');
  const [customProjectType, setCustomProjectType] = useState<string>('');
  const [region, setRegion] = useState<string>('Centre');
  const [location, setLocation] = useState<string>('Yaoundé');
  const [unitSystem, setUnitSystem] = useState<'m2' | 'ft2'>('m2');
  const [rawAreaInput, setRawAreaInput] = useState<string>('180');
  const [numberOfFloors, setNumberOfFloors] = useState<number>(1);
  const [constructionStandard, setConstructionStandard] = useState<'Economy' | 'Standard' | 'Premium' | 'Luxury'>('Standard');

  // Building Configuration
  const [hasBasement, setHasBasement] = useState<boolean>(false);
  const [roofType, setRoofType] = useState<string>('Aluminium Roofing Sheets');
  const [foundationType, setFoundationType] = useState<string>('Reinforced Pad & Beam Footings');
  const [wallType, setWallType] = useState<string>('Vibrated Hollow Concrete Blocks 15cm');

  // Scopes & Finishes
  const ALL_SCOPES = [
    'Site Preparation',
    'Earthworks',
    'Foundations',
    'Concrete Works',
    'Reinforcement',
    'Formwork',
    'Masonry',
    'Roofing',
    'Doors & Windows',
    'Plastering',
    'Flooring',
    'Painting',
    'Plumbing',
    'Electrical',
    'External Works',
    'Labour',
    'Plant & Equipment'
  ];
  const [selectedScopes, setSelectedScopes] = useState<string[]>(ALL_SCOPES);

  // Lead / Contact Info
  const [clientName, setClientName] = useState<string>('');
  const [clientEmail, setClientEmail] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<'WhatsApp' | 'Call' | 'Email'>('WhatsApp');
  const [projectTimeline, setProjectTimeline] = useState<string>('Within 1-3 Months');
  const [notes, setNotes] = useState<string>('');

  // Calculation States
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<any | null>(null);
  const [isSubmittingLead, setIsSubmittingLead] = useState<boolean>(false);
  const [leadSubmittedSuccess, setLeadSubmittedSuccess] = useState<boolean>(false);

  // Active Rates Data from Server
  const [rateData, setRateData] = useState<any>(null);

  // Fetch server rate library info on mount
  useEffect(() => {
    fetch('/api/budget-calculator/rates')
      .then(res => res.json())
      .then(data => {
        if (data && data.regionalFactors) {
          setRateData(data);
        }
      })
      .catch(err => console.error('Failed fetching rate library:', err));
  }, []);

  // Area conversion helper
  const areaInM2 = unitSystem === 'm2' 
    ? parseFloat(rawAreaInput) || 0 
    : (parseFloat(rawAreaInput) || 0) * 0.092903;

  const handleSelectAllScopes = () => setSelectedScopes(ALL_SCOPES);
  const handleClearAllScopes = () => setSelectedScopes([]);
  const toggleScope = (scopeName: string) => {
    if (selectedScopes.includes(scopeName)) {
      setSelectedScopes(selectedScopes.filter(s => s !== scopeName));
    } else {
      setSelectedScopes([...selectedScopes, scopeName]);
    }
  };

  // Perform Calculation
  const handleCalculateEstimate = async () => {
    if (!areaInM2 || areaInM2 <= 0) {
      if (showToast) showToast('Please enter a valid building floor area.', 'error');
      return;
    }

    setIsCalculating(true);
    try {
      const response = await fetch('/api/budget-calculator/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectType,
          customProjectType,
          location,
          region,
          totalFloorAreaM2: areaInM2,
          numberOfFloors,
          constructionStandard,
          buildingConfiguration: {
            hasBasement,
            roofType,
            foundationType,
            wallType
          },
          selectedScopes,
          mode,
          clientName,
          clientEmail,
          clientPhone,
          preferredContactMethod: preferredContact
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate estimate');
      }

      setCalculationResult(data);
      setCurrentStep(99); // Results step
      if (showToast) showToast('Estimate calculated successfully!', 'success');
    } catch (err: any) {
      console.error('Calculation error:', err);
      if (showToast) showToast(err.message || 'Error running calculation', 'error');
    } finally {
      setIsCalculating(false);
    }
  };

  // Submit Lead Form
  const handleSubmitLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!calculationResult || !calculationResult.estimateReference) return;
    if (!clientName || (!clientPhone && !clientEmail)) {
      if (showToast) showToast('Please provide your name and phone number or email.', 'error');
      return;
    }

    setIsSubmittingLead(true);
    try {
      const res = await fetch('/api/budget-calculator/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateReference: calculationResult.estimateReference,
          clientName,
          clientEmail,
          clientPhone,
          preferredContactMethod: preferredContact,
          projectTimeline,
          notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      setLeadSubmittedSuccess(true);
      if (showToast) showToast('Request submitted! Our Quantity Surveyors will contact you shortly.', 'success');
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Error submitting request', 'error');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  // Generate PDF Summary
  const handleDownloadPdf = () => {
    if (!calculationResult) return;

    try {
      const doc = new jsPDF();
      const ref = calculationResult.estimateReference;

      // Header Banner
      doc.setFillColor(245, 158, 11); // MADECC Amber/Gold
      doc.rect(0, 0, 210, 28, 'F');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text('MADECC GROUP S.A.', 14, 18);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text('PRELIMINARY PROJECT BUDGET ESTIMATE', 130, 18);

      // Metadata Block
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.text(`Estimate Ref: ${ref}`, 14, 38);
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 140, 38);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Project Type: ${calculationResult.projectType}`, 14, 46);
      doc.text(`Location: ${calculationResult.location} (${calculationResult.region || 'Cameroon'})`, 14, 52);
      doc.text(`Total Floor Area: ${calculationResult.totalFloorAreaM2} m² (${calculationResult.numberOfFloors} Storeys)`, 14, 58);
      doc.text(`Construction Standard: ${calculationResult.constructionStandard}`, 14, 64);

      // Budget Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, 72, 182, 32, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text('ESTIMATED TOTAL BUDGET RANGE (FCFA / XAF)', 20, 80);

      doc.setFontSize(18);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text(`XAF ${calculationResult.estimatedBudgetMin.toLocaleString()} – XAF ${calculationResult.estimatedBudgetMax.toLocaleString()}`, 20, 92);

      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Expected Total: XAF ${calculationResult.estimatedBudgetExpected.toLocaleString()} (~XAF ${calculationResult.costPerM2.toLocaleString()} / m²)`, 20, 99);

      // Category Breakdown Table
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text('ESTIMATED COST BREAKDOWN BY WORK SCOPE', 14, 114);

      let yPos = 122;
      doc.setFillColor(241, 245, 249);
      doc.rect(14, yPos, 182, 8, 'F');
      doc.setFontSize(9);
      doc.text('Scope / Work Section', 18, yPos + 6);
      doc.text('Amount (XAF)', 130, yPos + 6);
      doc.text('Share', 175, yPos + 6);

      yPos += 12;

      const items = calculationResult.lineItemsBreakdown || [];
      items.forEach((item: any, idx: number) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(item.category, 18, yPos);
        doc.text(`XAF ${item.amountXaf.toLocaleString()}`, 130, yPos);
        doc.text(`${item.percentage}%`, 175, yPos);
        doc.setDrawColor(241, 245, 249);
        doc.line(14, yPos + 2, 196, yPos + 2);
        yPos += 8;
      });

      // Footer Disclaimer
      yPos = Math.max(yPos + 10, 245);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('DISCLAIMER: This document is an indicative preliminary budget estimate calculated using MADECC Group standard rate library data.', 14, yPos);
      doc.text('It does not constitute a final binding quotation, architectural drawing, or contractual offer. Final costs are subject to engineering surveys.', 14, yPos + 4);
      doc.text('Contact MADECC Group: +237 671 063 511 / +237 683 316 486 (WhatsApp) | Email: kreboya603@gmail.com', 14, yPos + 8);

      doc.save(`MADECC-Budget-Estimate-${ref}.pdf`);
      if (showToast) showToast('PDF downloaded successfully.', 'success');
    } catch (err) {
      console.error('PDF generation error:', err);
      if (showToast) showToast('Failed generating PDF export.', 'error');
    }
  };

  // WhatsApp Trigger URL
  const getWhatsAppUrl = () => {
    if (!calculationResult) return 'https://wa.me/237683316486';
    const text = `Hello MADECC Group, I generated a Project Budget Estimate on your website:
Ref: ${calculationResult.estimateReference}
Type: ${calculationResult.projectType}
Area: ${calculationResult.totalFloorAreaM2} m²
Location: ${calculationResult.location}
Expected Budget: XAF ${calculationResult.estimatedBudgetExpected.toLocaleString()}
I would like to discuss this project and request a formal BOQ.`;
    return `https://wa.me/237683316486?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Banner / Hero Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase mb-2">
            <Sparkles className="w-4 h-4" />
            MADECC Group Estimating System
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Project Budget Calculator
          </h1>
          <p className="text-slate-300 text-base max-w-3xl leading-relaxed mb-6">
            Estimate the approximate budget required for your construction project using official, administrator-maintained MADECC construction rates, regional location factors, and structural parameters.
          </p>

          {/* Mode Switcher */}
          <div className="inline-flex p-1 bg-slate-800 rounded-xl border border-slate-700">
            <button
              onClick={() => { setMode('quick'); if (currentStep !== 99) setCurrentStep(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'quick' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Quick Guided Estimate (5 Steps)
            </button>
            <button
              onClick={() => { setMode('detailed'); if (currentStep !== 99) setCurrentStep(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === 'detailed' 
                  ? 'bg-amber-500 text-slate-950 shadow-sm' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Detailed Engineering Estimate (7 Steps)
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        
        {/* Preliminary Notice Disclaimer Card */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 backdrop-blur-sm flex items-start gap-3 shadow-sm">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 leading-relaxed">
            <span className="font-bold text-amber-900">Indicative Preliminary Estimator:</span> This calculator uses live MADECC Group database unit rates to produce a preliminary budget range. It is designed for feasibility planning and does not replace a formal engineering survey or contractual BOQ.
          </div>
        </div>

        {/* WORKFLOW STEPS OR RESULTS */}
        {currentStep !== 99 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
            
            {/* Step Indicator Header */}
            <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center">
                  {currentStep}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Step {currentStep} of {mode === 'quick' ? 5 : 7}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">
                    {currentStep === 1 && 'Select Project Type'}
                    {currentStep === 2 && 'Location & Region'}
                    {currentStep === 3 && 'Building Size & Floors'}
                    {currentStep === 4 && 'Structural Configuration'}
                    {currentStep === 5 && 'Construction Standard'}
                    {currentStep === 6 && 'Work Scopes Included'}
                    {currentStep === 7 && 'Review & Calculate'}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="hidden sm:block w-36 bg-slate-200 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full transition-all duration-300"
                  style={{ width: `${(currentStep / (mode === 'quick' ? 5 : 7)) * 100}%` }}
                />
              </div>
            </div>

            <div className="p-6 sm:p-8">
              
              {/* STEP 1: PROJECT TYPE */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">What type of building are you planning to construct?</h2>
                    <p className="text-xs text-slate-500">Select the option that best matches your architectural plans or investment goals.</p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                      { name: 'Residential House', desc: 'Single family home / Bungalow', icon: Home },
                      { name: 'Duplex', desc: '2-Level modern residential home', icon: Building2 },
                      { name: 'Villa', desc: 'Luxury detached residence', icon: Sparkles },
                      { name: 'Apartment Building', desc: 'Multi-family residential block', icon: Layers },
                      { name: 'Commercial Building', desc: 'Retail plaza or commercial complex', icon: Briefcase },
                      { name: 'Office Building', desc: 'Corporate office space', icon: Building2 },
                      { name: 'Shop', desc: 'Single retail shop / boutique', icon: Briefcase },
                      { name: 'Warehouse', desc: 'Storage / Logistics facility', icon: Layers },
                      { name: 'Hotel', desc: 'Hospitality / Guest lodging', icon: Sparkles },
                      { name: 'School', desc: 'Educational facility', icon: Home },
                      { name: 'Hospital/Clinic', desc: 'Healthcare facility', icon: ShieldCheck },
                      { name: 'Renovation', desc: 'Structural remodeling / upgrades', icon: RefreshCw },
                    ].map(type => {
                      const IconComp = type.icon;
                      const isSelected = projectType === type.name;
                      return (
                        <button
                          key={type.name}
                          type="button"
                          onClick={() => setProjectType(type.name)}
                          className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white'
                          }`}
                        >
                          <div>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                              isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-slate-600'
                            }`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="font-bold text-slate-900 text-sm mb-1">{type.name}</div>
                            <div className="text-[11px] text-slate-500 leading-snug">{type.desc}</div>
                          </div>
                          {isSelected && (
                            <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-amber-600">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Selected
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: LOCATION & REGION */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Where is your construction site located?</h2>
                    <p className="text-xs text-slate-500">Material transport costs, logistics, and labor rates vary across Cameroon's regions.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Region in Cameroon</label>
                      <select
                        value={region}
                        onChange={(e) => {
                          setRegion(e.target.value);
                          if (e.target.value === 'Centre') setLocation('Yaoundé');
                          else if (e.target.value === 'Littoral') setLocation('Douala');
                          else if (e.target.value === 'North') setLocation('Garoua');
                          else if (e.target.value === 'West') setLocation('Bafoussam');
                          else if (e.target.value === 'South') setLocation('Kribi');
                        }}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value="Centre">Centre Region (Yaoundé)</option>
                        <option value="Littoral">Littoral Region (Douala, Kribi link)</option>
                        <option value="South">South Region (Kribi, Ebolowa)</option>
                        <option value="West">West Region (Bafoussam, Dschang)</option>
                        <option value="North-West">North-West Region (Bamenda)</option>
                        <option value="South-West">South-West Region (Limbe, Buea)</option>
                        <option value="North">North Region (Garoua)</option>
                        <option value="Far North">Far North Region (Maroua)</option>
                        <option value="Adamawa">Adamawa Region (Ngaoundéré)</option>
                        <option value="East">East Region (Bertoua)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">City / Town Name</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Yaoundé (Odza), Douala (Bonamoussadi), Kribi"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Regional Cost Factor Notice */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Regional Factor Applied</div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {region === 'Littoral' && 'Douala benefits from sea port proximity for cement, steel, and imported tiles.'}
                        {region === 'Centre' && 'Yaoundé reflects standard national baseline pricing for central quarry aggregates and materials.'}
                        {region === 'North' || region === 'Far North' ? 'Northern regions include long-haul heavy transport adjustments for steel and cement.' : 'Local material transport and quarry distances automatically factored into unit rates.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: BUILDING SIZE & FLOORS */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">What is the total built area and number of floors?</h2>
                    <p className="text-xs text-slate-500">Enter total gross slab area across all levels.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-700 uppercase">Total Floor Area</label>
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold">
                          <button
                            type="button"
                            onClick={() => setUnitSystem('m2')}
                            className={`px-2 py-0.5 rounded ${unitSystem === 'm2' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
                          >
                            Square Meters (m²)
                          </button>
                          <button
                            type="button"
                            onClick={() => setUnitSystem('ft2')}
                            className={`px-2 py-0.5 rounded ${unitSystem === 'ft2' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-600'}`}
                          >
                            Square Feet (ft²)
                          </button>
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          value={rawAreaInput}
                          onChange={(e) => setRawAreaInput(e.target.value)}
                          min="10"
                          max="10000"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {unitSystem === 'm2' ? 'm²' : 'ft²'}
                        </span>
                      </div>

                      {unitSystem === 'ft2' && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Equivalent to <span className="font-bold text-slate-800">{areaInM2.toFixed(1)} m²</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Number of Storeys / Floors</label>
                      <select
                        value={numberOfFloors}
                        onChange={(e) => setNumberOfFloors(parseInt(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value={1}>1 Floor (Ground Floor / Bungalow)</option>
                        <option value={2}>2 Floors (Ground + 1 Storey / R+1)</option>
                        <option value={3}>3 Floors (Ground + 2 Storeys / R+2)</option>
                        <option value={4}>4 Floors (Ground + 3 Storeys / R+3)</option>
                        <option value={5}>5+ Floors (High-Rise / Multi-Level R+4+)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: STRUCTURAL CONFIGURATION */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Building structural parameters</h2>
                    <p className="text-xs text-slate-500">Specify roof and foundation details for higher accuracy.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Roofing System</label>
                      <select
                        value={roofType}
                        onChange={(e) => setRoofType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Aluminium Roofing Sheets">Aluminium Roofing Sheets (0.50mm corrugated)</option>
                        <option value="Concrete Flat Roof Slab">Reinforced Concrete Roof Terrace Slab</option>
                        <option value="Tiles Roof">Decra / Metal Tile Roofing Sheets</option>
                        <option value="Steel Truss Framework">Heavy Industrial Steel Truss System</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Foundation Type</label>
                      <select
                        value={foundationType}
                        onChange={(e) => setFoundationType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Reinforced Pad & Beam Footings">Isolated Reinforced Concrete Pad Footings (Standard Soil)</option>
                        <option value="Strip Foundation">Continuous Strip Footing Foundation</option>
                        <option value="Raft Foundation">Full Heavy Reinforced Raft Slab Foundation (Weak Soil)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasBasement}
                        onChange={(e) => setHasBasement(e.target.checked)}
                        className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                      />
                      <div>
                        <div className="text-sm font-bold text-slate-900">Include Underground Basement Level</div>
                        <div className="text-xs text-slate-500">Adds deep excavation, retaining walls, and subsoil tanking waterproofing.</div>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 5: CONSTRUCTION STANDARD */}
              {currentStep === 5 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Select Construction Quality Standard</h2>
                    <p className="text-xs text-slate-500">Choice of finishes, block density, tile grades, and fixtures.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { 
                        key: 'Economy', 
                        title: 'Economy Package', 
                        multiplier: '0.85x',
                        desc: 'Functional construction, standard concrete blocks, basic ceramic floor tiles, durable steel doors, basic paint.' 
                      },
                      { 
                        key: 'Standard', 
                        title: 'Standard Package (Recommended)', 
                        multiplier: '1.00x',
                        desc: 'Vibrated hollow concrete blocks, high-grade porcelain floor tiles, aluminium sliding windows, flush interior doors.' 
                      },
                      { 
                        key: 'Premium', 
                        title: 'Premium Package', 
                        multiplier: '1.28x',
                        desc: 'Heavy structural design, imported glazed porcelain, acoustic double-glazed windows, solid hardwood doors.' 
                      },
                      { 
                        key: 'Luxury', 
                        title: 'Luxury Custom Package', 
                        multiplier: '1.65x',
                        desc: 'Bespoke architectural finishes, marble & granite, smart home wiring, luxury European sanitaryware.' 
                      },
                    ].map(std => {
                      const isSelected = constructionStandard === std.key;
                      return (
                        <div
                          key={std.key}
                          onClick={() => setConstructionStandard(std.key as any)}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20' 
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-slate-900 text-base">{std.title}</span>
                            <span className="text-xs font-extrabold px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full">
                              {std.multiplier}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{std.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 6: WORK SCOPES INCLUDED (If mode is detailed) */}
              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 mb-1">Included Work Scopes</h2>
                      <p className="text-xs text-slate-500">Uncheck any work sections you do not require MADECC to execute.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAllScopes}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAllScopes}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {ALL_SCOPES.map(scope => {
                      const isChecked = selectedScopes.includes(scope);
                      return (
                        <label
                          key={scope}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 text-xs font-bold ${
                            isChecked
                              ? 'border-amber-500 bg-amber-50/50 text-slate-900'
                              : 'border-slate-200 bg-slate-50 text-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScope(scope)}
                            className="w-4 h-4 text-amber-500 rounded focus:ring-amber-500"
                          />
                          <span>{scope}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 7 / REVIEW STEP BEFORE SUBMISSION */}
              {((mode === 'quick' && currentStep === 5) || (mode === 'detailed' && currentStep === 7)) && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 mb-1">Review Your Project Parameters</h2>
                    <p className="text-xs text-slate-500">Confirm details before running the MADECC rate engine.</p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3 text-xs">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Project Building Type:</span>
                      <span className="font-bold text-slate-900">{projectType}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Location:</span>
                      <span className="font-bold text-slate-900">{location} ({region} Region)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Total Built Area:</span>
                      <span className="font-bold text-slate-900">{areaInM2.toFixed(1)} m² ({numberOfFloors} Floors)</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500">Construction Standard:</span>
                      <span className="font-bold text-slate-900">{constructionStandard}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Included Scopes:</span>
                      <span className="font-bold text-slate-900">{selectedScopes.length} of {ALL_SCOPES.length} Work Sections</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleCalculateEstimate}
                      disabled={isCalculating}
                      className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-base rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isCalculating ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Running MADECC Rate Calculations...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-5 h-5" />
                          Calculate My Building Budget Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* BOTTOM NAVIGATION BUTTONS */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                {currentStep < (mode === 'quick' ? 5 : 7) && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition-all flex items-center gap-2"
                  >
                    Next Step <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* ================= RESULTS DISPLAY STEP ================= */
          <div className="space-y-8 pb-12">
            
            {/* Top Results Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
                  <div>
                    <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
                      Official Estimate Reference
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
                      {calculationResult.estimateReference}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-xs font-bold">
                      {calculationResult.confidenceLevel} Confidence
                    </span>
                    <button
                      onClick={() => setCurrentStep(1)}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Re-estimate
                    </button>
                  </div>
                </div>

                {/* Main Estimated Budget Range */}
                <div>
                  <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">
                    Estimated Total Budget Range (FCFA / XAF)
                  </div>
                  <div className="text-3xl sm:text-5xl font-black text-amber-400 tracking-tight mb-2">
                    XAF {calculationResult.estimatedBudgetMin?.toLocaleString()} – XAF {calculationResult.estimatedBudgetMax?.toLocaleString()}
                  </div>
                  <div className="text-sm text-slate-300 font-medium">
                    Expected Total: <span className="text-white font-bold">XAF {calculationResult.estimatedBudgetExpected?.toLocaleString()}</span> &bull; Rate per m²: <span className="text-amber-300 font-bold">XAF {calculationResult.costPerM2?.toLocaleString()} / m²</span>
                  </div>
                </div>

                {/* Quick Details Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 text-xs">
                  <div>
                    <div className="text-slate-400">Project Type</div>
                    <div className="font-bold text-white mt-0.5">{calculationResult.projectType}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Location</div>
                    <div className="font-bold text-white mt-0.5">{calculationResult.location}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Built Floor Area</div>
                    <div className="font-bold text-white mt-0.5">{calculationResult.totalFloorAreaM2} m²</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Quality Standard</div>
                    <div className="font-bold text-white mt-0.5">{calculationResult.constructionStandard}</div>
                  </div>
                </div>

                {/* CTAs Bar */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href={getWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Discuss on WhatsApp
                  </a>

                  <a
                    href="tel:+237671063511"
                    className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-amber-400" /> Call MADECC (+237 671 063 511)
                  </a>

                  <button
                    onClick={handleDownloadPdf}
                    className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Download PDF Report
                  </button>
                </div>

              </div>
            </div>

            {/* Category Breakdown Table Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Estimated Cost Breakdown by Work Scope</h3>
                  <p className="text-xs text-slate-500">Distribution based on standard MADECC quantity surveying ratios and current material prices.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <th className="py-3 px-4">Work Scope / Section</th>
                      <th className="py-3 px-4">Estimated Amount (XAF)</th>
                      <th className="py-3 px-4">Share (%)</th>
                      <th className="py-3 px-4 min-w-[140px]">Visual Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(calculationResult.lineItemsBreakdown || []).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">{item.category}</td>
                        <td className="py-3 px-4 text-slate-800 font-mono">XAF {item.amountXaf?.toLocaleString()}</td>
                        <td className="py-3 px-4 text-slate-600 font-bold">{item.percentage}%</td>
                        <td className="py-3 px-4">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, item.percentage * 3)}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Request Formal BOQ Lead Capture Form */}
            <div className="bg-gradient-to-br from-amber-500/10 via-white to-slate-50 rounded-3xl p-6 sm:p-8 border border-amber-500/30 shadow-xl">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] rounded-full mb-3">
                  <Briefcase className="w-3.5 h-3.5" /> Next Step
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">
                  Request a Professional Engineering BOQ & Quotation
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-6">
                  Submit your details to have a MADECC Quantity Surveyor review your architectural plans, conduct a site assessment, and provide a binding Bill of Quantities (BOQ).
                </p>

                {leadSubmittedSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-4">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-900 text-sm mb-1">Request Received!</div>
                      <div className="text-xs text-emerald-700 leading-relaxed">
                        Thank you <span className="font-bold">{clientName}</span>. Your request for estimate <span className="font-mono font-bold">{calculationResult.estimateReference}</span> has been logged. Our engineering team will contact you via {preferredContact}.
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitLead} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Full Name *</label>
                        <input
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Jean-Pierre Mbida"
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Phone Number *</label>
                        <input
                          type="tel"
                          required
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="e.g. +237 670 12 34 56"
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address (Optional)</label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="e.g. client@example.cm"
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Contact Method</label>
                        <select
                          value={preferredContact}
                          onChange={(e) => setPreferredContact(e.target.value as any)}
                          className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="WhatsApp">WhatsApp Message</option>
                          <option value="Call">Direct Phone Call</option>
                          <option value="Email">Email</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Timeline</label>
                      <select
                        value={projectTimeline}
                        onChange={(e) => setProjectTimeline(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="Immediate (1-2 Weeks)">Immediate (Starting within 1-2 weeks)</option>
                        <option value="Within 1-3 Months">Within 1-3 Months</option>
                        <option value="Within 3-6 Months">Within 3-6 Months</option>
                        <option value="Planning / Future Stage">Planning / Future Stage</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Additional Project Details / Notes</label>
                      <textarea
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Mention any specific requirements, drawings availability, or site conditions..."
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLead}
                      className="px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                    >
                      {isSubmittingLead ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Request...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Request Official BOQ & Quotation
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
