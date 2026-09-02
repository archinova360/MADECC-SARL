import React, { useState } from 'react';
import { 
  Calculator, 
  ArrowRight, 
  Building2, 
  Home as HomeIcon, 
  Warehouse, 
  HardHat, 
  ShieldCheck, 
  Sparkles,
  Layers,
  FileCheck2
} from 'lucide-react';
import { formatCurrency } from '../lib/utils.ts';
import { motion } from 'motion/react';
import { InteractiveCard } from './MotionReveal.tsx';

interface QuickEstimatorProps {
  onNavigateToTab: (tab: string, state?: any) => void;
  currency?: string;
}

interface ProjectTypeOption {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  baseRatePerM2: number;
  durationMonths: number;
  description: string;
}

const PROJECT_TYPES: ProjectTypeOption[] = [
  {
    id: 'villa',
    name: 'Modern Duplex / Villa',
    icon: HomeIcon,
    baseRatePerM2: 245000,
    durationMonths: 7,
    description: 'High-end residential with reinforced concrete frame, waterproofing & custom architectural finish.'
  },
  {
    id: 'commercial',
    name: 'Commercial Complex / Office',
    icon: Building2,
    baseRatePerM2: 310000,
    durationMonths: 12,
    description: 'Multi-story commercial building with MEP risers, fire detection & high-traffic vitrified tiling.'
  },
  {
    id: 'warehouse',
    name: 'Industrial Logistics Shed',
    icon: Warehouse,
    baseRatePerM2: 175000,
    durationMonths: 5,
    description: 'Heavy structural steel truss, high-load industrial concrete floor slab & storm drainage.'
  },
  {
    id: 'renovation',
    name: 'Structural Retrofit & Expansion',
    icon: HardHat,
    baseRatePerM2: 140000,
    durationMonths: 4,
    description: 'Beam jacketing, column underpinning, MEP rewiring & premium interior modernisation.'
  }
];

export function InteractiveQuickEstimator({ onNavigateToTab, currency = 'XAF' }: QuickEstimatorProps) {
  const [selectedType, setSelectedType] = useState<string>('villa');
  const [areaM2, setAreaM2] = useState<number>(250);
  const [finishGrade, setFinishGrade] = useState<'standard' | 'premium' | 'luxury'>('premium');
  const [includeFoundationSoilStudy, setIncludeFoundationSoilStudy] = useState<boolean>(true);

  const activeType = PROJECT_TYPES.find(p => p.id === selectedType) || PROJECT_TYPES[0];

  const finishMultiplier = {
    standard: 0.88,
    premium: 1.0,
    luxury: 1.28
  }[finishGrade];

  const soilStudyCost = includeFoundationSoilStudy ? 1500000 : 0;
  const baseConstructionCost = activeType.baseRatePerM2 * areaM2 * finishMultiplier;
  const totalEstimatedCost = Math.round(baseConstructionCost + soilStudyCost);

  const estimatedDuration = Math.max(3, Math.round(activeType.durationMonths * Math.sqrt(areaM2 / 200)));

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden text-white">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6 relative z-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>Interactive Live Cost Estimator</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Calculate Your Build Estimate in Real-Time
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Calibrated with official 2026 Central Africa market benchmarks, concrete Eurocode standards, and vetted contractor rates.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Eurocode 2 Compliant</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
            <FileCheck2 className="w-4 h-4 text-amber-400" />
            <span>Verified 2026 BOQ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Controls Column (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Building Typology Selection */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-3">
              1. Select Project Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
              {PROJECT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-700 text-slate-300'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-xs sm:text-sm">{type.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 line-clamp-1">
                      {formatCurrency(type.baseRatePerM2, currency)}/m²
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Surface Area Slider */}
          <div className="bg-slate-800/50 border border-slate-700/70 p-5 rounded-2xl">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400">
                2. Total Built Surface Area
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="50"
                  max="5000"
                  step="10"
                  value={areaM2}
                  onChange={(e) => setAreaM2(Math.max(20, Math.min(10000, Number(e.target.value) || 20)))}
                  className="w-24 px-2.5 py-1 bg-slate-900 border border-slate-600 rounded-lg text-right font-mono font-bold text-amber-400 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                />
                <span className="text-sm font-semibold text-slate-300">m²</span>
              </div>
            </div>
            
            <input
              type="range"
              min="50"
              max="1500"
              step="10"
              value={areaM2}
              onChange={(e) => setAreaM2(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex justify-between text-[11px] font-mono text-slate-500 mt-2">
              <span>50 m² (Compact)</span>
              <span>250 m² (Standard)</span>
              <span>750 m² (Large Estate)</span>
              <span>1500+ m² (Commercial)</span>
            </div>
          </div>

          {/* Step 3: Finish Grade & Geotechnical Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                3. Architectural Finish Grade
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700">
                {(['standard', 'premium', 'luxury'] as const).map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setFinishGrade(grade)}
                    className={`py-2 text-xs font-semibold capitalize rounded-lg transition-all ${
                      finishGrade === grade
                        ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-3 p-3 bg-slate-800/60 border border-slate-700 rounded-xl cursor-pointer hover:bg-slate-800 transition-colors">
                <input
                  type="checkbox"
                  checked={includeFoundationSoilStudy}
                  onChange={(e) => setIncludeFoundationSoilStudy(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 accent-amber-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-200 block">Include Geotechnical Soil Study</span>
                  <span className="text-slate-400 text-[10px]">Prevents foundation settlement</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Output & Conversion Summary Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-amber-500/30 rounded-2xl p-6 sm:p-7 shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Estimated Budget Range</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30">
                Instant Estimate
              </span>
            </div>

            <div className="mb-6">
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-mono">
                {formatCurrency(totalEstimatedCost, currency)}
              </div>
              <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span>≈ {formatCurrency(Math.round(totalEstimatedCost / areaM2), currency)} / m² all-inclusive</span>
              </div>
            </div>

            <div className="space-y-3 text-xs border-t border-slate-700/60 pt-4 mb-6">
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Layers className="w-3.5 h-3.5 text-amber-400" /> Structure & RC Frame (42%):
                </span>
                <span className="font-mono font-semibold">{formatCurrency(Math.round(totalEstimatedCost * 0.42), currency)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Architectural & Finishes (38%):
                </span>
                <span className="font-mono font-semibold">{formatCurrency(Math.round(totalEstimatedCost * 0.38), currency)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" /> MEP, Plumbing & Electrical (20%):
                </span>
                <span className="font-mono font-semibold">{formatCurrency(Math.round(totalEstimatedCost * 0.20), currency)}</span>
              </div>
              <div className="flex justify-between text-slate-300 border-t border-slate-700/40 pt-2">
                <span className="text-slate-400">Estimated Construction Timeline:</span>
                <span className="font-bold text-amber-400">~{estimatedDuration} Months</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigateToTab('request-a-quote', { selectedService: activeType.name })}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm transition-all transform active:scale-[0.98]"
            >
              <span>Get Formal Engineer's BOQ Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigateToTab('budget-calculator')}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 text-center transition-colors"
            >
              Open Full 30-Parameter Cost Breakdown Engine →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
