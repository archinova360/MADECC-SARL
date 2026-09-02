import React, { useState } from 'react';
import { 
  Layers, 
  ShieldCheck, 
  Maximize2, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  Droplets, 
  Flame,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BlueprintLayer {
  id: string;
  name: string;
  code: string;
  standard: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  keySpecs: string[];
  image: string;
  highlightPoints: Array<{ x: number; y: number; label: string; detail: string }>;
}

const BLUEPRINT_LAYERS: BlueprintLayer[] = [
  {
    id: 'structural',
    name: 'Reinforced Concrete Structural Frame',
    code: 'EC2-C25/30',
    standard: 'Eurocode 2 (EN 1992-1-1)',
    icon: Layers,
    description: 'Computer-modeled finite element columns, beams, and two-way slabs engineered to resist seismic, wind shear, and high load distribution.',
    keySpecs: [
      'C25/30 High-Strength Ready-Mix Concrete',
      'FeE500 High-Yield Ribbed Reinforcing Steel',
      'Cover Depth: 35mm with anti-carbonation treatment',
      'Continuous ultrasonic concrete batch testing'
    ],
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
    highlightPoints: [
      { x: 30, y: 35, label: 'Primary Column Joint', detail: 'Shear stirrups at 100mm pitch for anti-buckling' },
      { x: 65, y: 50, label: 'Post-Tensioned Beam', detail: 'Tendon profile designed for zero mid-span deflection' },
      { x: 45, y: 75, label: 'Reinforced Raft Foundation', detail: '600mm deep monolithic mat on compacted rock' }
    ]
  },
  {
    id: 'geotechnical',
    name: 'Soil & Foundation Geotechnics',
    code: 'GEO-NF P94',
    standard: 'NF P94-500 & Eurocode 7',
    icon: ShieldCheck,
    description: 'Comprehensive geotechnical borehole testing, Standard Penetration Tests (SPT), and dynamic cone penetrometry before foundation pouring.',
    keySpecs: [
      'Bearing capacity validation ≥ 0.25 MPa',
      'Water table depth & seasonal saturation analysis',
      'Geotextile sub-base separation membrane',
      'Anti-capillary gravel drainage layer'
    ],
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    highlightPoints: [
      { x: 25, y: 70, label: 'Deep Soil Borehole', detail: 'SPT sampling down to 12m depth' },
      { x: 75, y: 60, label: 'Compacted Laterite Layer', detail: 'Proctor density test ≥ 95% optimum dry density' }
    ]
  },
  {
    id: 'mep',
    name: 'MEP & Smart Electrical Risers',
    code: 'MEP-NF C15-100',
    standard: 'NF C 15-100 & BS 7671',
    icon: Zap,
    description: 'Fully segregated electrical power conduits, low-voltage fiber channels, copper plumbing risers, and gravity-fed stormwater drainage.',
    keySpecs: [
      'Flame-retardant LSZH conduit conduits',
      'Dual-circuit distribution board with surge arrestors',
      'Solar PV ready dual-inverter trunking',
      'Acoustic insulated sanitary discharge stacks'
    ],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    highlightPoints: [
      { x: 35, y: 30, label: 'Main Power Distribution', detail: 'Class II surge protection and RCD 30mA safety' },
      { x: 70, y: 45, label: 'Smart Building Conduit', detail: 'Cat6A Ethernet + IoT sensor backbone' }
    ]
  }
];

export function InteractiveBlueprintPreview({ onNavigateToTab }: { onNavigateToTab: (tab: string, state?: any) => void }) {
  const [activeLayerId, setActiveLayerId] = useState<string>('structural');
  const [selectedPoint, setSelectedPoint] = useState<{ label: string; detail: string } | null>(null);

  const activeLayer = BLUEPRINT_LAYERS.find(l => l.id === activeLayerId) || BLUEPRINT_LAYERS[0];

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>Interactive Engineering Layer Inspector</span>
          </div>
          <h3 className="text-2xl font-extrabold text-white tracking-tight">
            Explore Our Multi-Disciplinary Engineering Standards
          </h3>
        </div>

        {/* Layer Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/80">
          {BLUEPRINT_LAYERS.map((layer) => {
            const Icon = layer.icon;
            const isSelected = activeLayerId === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => {
                  setActiveLayerId(layer.id);
                  setSelectedPoint(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{layer.code}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Image with interactive hot-spots (7 cols) */}
        <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-slate-700 aspect-video group">
          <img
            src={activeLayer.image}
            alt={activeLayer.name}
            className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />

          {/* Technical Watermark badge */}
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{activeLayer.standard}</span>
          </div>

          {/* Hotspots */}
          {activeLayer.highlightPoints.map((pt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedPoint(pt)}
              style={{ top: `${pt.y}%`, left: `${pt.x}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group/pt focus:outline-none"
              title={pt.label}
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-500 border-2 border-slate-950 text-slate-950 font-bold text-[10px] items-center justify-center shadow-lg">
                  {idx + 1}
                </span>
              </span>
            </button>
          ))}

          {/* Selected Point Popover */}
          <AnimatePresence>
            {selectedPoint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-amber-500/50 p-4 rounded-xl shadow-2xl text-left"
              >
                <div className="flex justify-between items-start">
                  <h5 className="text-sm font-bold text-amber-400">{selectedPoint.label}</h5>
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 bg-slate-800 rounded"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-slate-300 mt-1">{selectedPoint.detail}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {!selectedPoint && (
            <div className="absolute bottom-3 left-4 text-[11px] text-slate-400 bg-slate-900/70 backdrop-blur-sm px-2.5 py-1 rounded">
              💡 Click on any numbered pulse marker to inspect structural specs
            </div>
          )}
        </div>

        {/* Right: Technical Specs & Certifications (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/80 p-5 rounded-2xl">
            <h4 className="text-lg font-bold text-white mb-2">{activeLayer.name}</h4>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{activeLayer.description}</p>

            <div className="space-y-2 mb-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                Technical Specifications:
              </span>
              {activeLayer.keySpecs.map((spec, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{spec}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigateToTab('schedule-consultation')}
                className="w-full py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span>Book On-Site Engineering Audit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
