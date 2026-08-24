import React, { useState, useEffect, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Download, 
  Send, 
  Copy, 
  RefreshCw, 
  Search, 
  Filter, 
  Edit3, 
  Eye, 
  FileText, 
  Building2, 
  User, 
  MapPin, 
  DollarSign, 
  ArrowLeft, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Lock, 
  Printer, 
  Layers, 
  Calculator, 
  Info,
  Calendar,
  Sparkles,
  TrendingUp,
  BarChart3,
  PieChart,
  CheckSquare,
  XCircle,
  FileCheck,
  GitCompare,
  Package,
  HardHat,
  Truck,
  Hammer,
  Shield,
  ArrowRight,
  ArrowUpRight,
  Zap,
  ListFilter,
  AlertTriangle,
  FileUp,
  Settings,
  Sliders,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Move,
  Archive,
  FolderPlus,
  Tag,
  Check,
  X,
  MoreVertical,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { generateBoqDocx, generateBoqCsv, generateBoqExcel, parseBoqImportFile } from '../utils/boqExport';
import { generateBoqPdf } from '../utils/boqPdfExport';
import { getAuthToken } from '../lib/firebase';

export interface RateBreakdown {
  materialCost: number;
  labourCost: number;
  plantCost: number;
  transportCost: number;
  wastagePercent: number;
  siteOverheadPercent: number;
  headOfficeOverheadPercent: number;
  profitPercent: number;
  breakdownItems?: Array<{
    name: string;
    type: 'material' | 'labour' | 'plant' | 'transport';
    qty: number;
    unit: string;
    rate: number;
    total: number;
  }>;
}

export interface DimensionLine {
  id: string;
  description: string;
  times: number;
  length: number;
  width: number;
  depth: number;
  calculated: number;
  notes?: string;
}

export interface DimensionSheet {
  formulaType: 'LWH' | 'LH' | 'REBAR_WEIGHT' | 'BLOCK_COUNT' | 'CUSTOM';
  rebarDiameterMm?: number;
  blockFaceAreaM2?: number;
  lines: DimensionLine[];
  totalQty: number;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ApprovalStep {
  stage: 'DRAFT' | 'QS_REVIEW' | 'COMMERCIAL_REVIEW' | 'TECHNICAL_REVIEW' | 'DIRECTOR_APPROVAL' | 'SUBMITTED' | 'CONTRACT_AWARDED';
  title: string;
  reviewer: string;
  date?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
}

export interface BoqItem {
  id?: number | string;
  itemNumber: string;
  description: string;
  specification?: string;
  unit: string;
  quantity: string | number;
  unitRate: string | number;
  amount: string | number;
  notes?: string;
  status?: 'ACTIVE' | 'ARCHIVED' | 'DRAFT' | 'APPROVED';
  isArchived?: boolean;
  subsectionId?: string | number;
  measurementBasis?: string;
  internalMaterialCost?: string | number;
  internalLabourCost?: string | number;
  internalPlantCost?: string | number;
  internalOtherCost?: string | number;
  rateBreakdown?: RateBreakdown;
  dimensionSheet?: DimensionSheet;
  progressExecutedQty?: string | number;
  progressExecutedPercent?: string | number;
  displayOrder?: number;
}

export interface BoqSection {
  id?: number | string;
  sectionCode: string;
  title: string;
  description?: string;
  sectionType?: string;
  defaultUnit?: string;
  notes?: string;
  status?: 'DRAFT' | 'IN_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  isArchived?: boolean;
  subsections?: Array<{ id: string | number; code: string; title: string; description?: string }>;
  displayOrder?: number;
  subtotal: string | number;
  items: BoqItem[];
}

export interface BoqData {
  id?: number;
  boqReference: string;
  projectId?: number | null;
  projectName: string;
  clientId?: number | null;
  clientName: string;
  clientEmail?: string;
  clientNiu?: string;
  clientAddress?: string;
  location: string;
  description?: string;
  datePrepared?: string;
  preparedBy: string;
  revisionNumber: string;
  currency: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
  overheadPercent: string | number;
  contingencyPercent: string | number;
  profitPercent: string | number;
  taxPercent: string | number;
  discountPercent?: string | number;
  subtotal: string | number;
  overheadAmount: string | number;
  contingencyAmount: string | number;
  profitAmount: string | number;
  taxAmount: string | number;
  discountAmount?: string | number;
  transportAmount?: string | number;
  supervisionAmount?: string | number;
  grandTotal: string | number;
  pdfUrl?: string | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  sentToClientAt?: string | null;
  sentToClientBy?: string | null;
  consultantName?: string;
  consultantEmail?: string;
  contractType?: string; // 'UNIT_RATE', 'LUMP_SUM', 'COST_PLUS', 'DESIGN_BUILD', 'FIDIC_RED'
  tenderReference?: string;
  tenderDate?: string;
  submissionDeadline?: string;
  constructionCategory?: string;
  tenderMode?: 'INTERNAL_ESTIMATE' | 'CLIENT_TENDER';
  approvalStage?: 'DRAFT' | 'QS_REVIEW' | 'COMMERCIAL_REVIEW' | 'TECHNICAL_REVIEW' | 'DIRECTOR_APPROVAL' | 'SUBMITTED' | 'CONTRACT_AWARDED';
  approvalHistory?: ApprovalStep[];
  createdAt?: string;
  updatedAt?: string;
  sections?: BoqSection[];
  revisions?: any[];
  auditLogs?: any[];
}

export interface ResourceItem {
  id: string;
  code: string;
  name: string;
  type: 'material' | 'labour' | 'equipment';
  unit: string;
  rateXaf: number;
  supplierOrTrade: string;
  productivity?: string;
  wastagePercent?: number;
  region: string;
}

export interface BoqUnitItem {
  id?: number | string;
  code: string;
  name: string;
  category: string;
  description?: string;
  isDefault?: boolean;
}

interface BoqStudioProps {
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
  currentUser?: any;
}

export const SECTION_TYPES = [
  'Preliminaries',
  'Site Works',
  'Earthworks',
  'Foundations',
  'Concrete Works',
  'Reinforcement',
  'Masonry',
  'Roofing',
  'Finishes',
  'Doors & Windows',
  'Plumbing',
  'Electrical',
  'External Works',
  'Landscaping',
  'Labour',
  'Plant & Equipment',
  'Provisional Sum',
  'Contingency',
  'Other'
];

export const UNIT_CATEGORIES = [
  'Length',
  'Area',
  'Volume',
  'Mass',
  'Count',
  'Time',
  'Construction',
  'Labour',
  'Plant/Equipment',
  'Lump Sum',
  'Percentage'
];

export const COMPREHENSIVE_UNITS: BoqUnitItem[] = [
  // Length
  { code: 'mm', name: 'Millimetre', category: 'Length' },
  { code: 'cm', name: 'Centimetre', category: 'Length' },
  { code: 'm', name: 'Metre', category: 'Length', isDefault: true },
  { code: 'km', name: 'Kilometre', category: 'Length' },
  
  // Area
  { code: 'mm²', name: 'Square millimetre', category: 'Area' },
  { code: 'cm²', name: 'Square centimetre', category: 'Area' },
  { code: 'm²', name: 'Square metre', category: 'Area', isDefault: true },
  { code: 'ha', name: 'Hectare', category: 'Area' },

  // Volume
  { code: 'mm³', name: 'Cubic millimetre', category: 'Volume' },
  { code: 'cm³', name: 'Cubic centimetre', category: 'Volume' },
  { code: 'm³', name: 'Cubic metre', category: 'Volume', isDefault: true },
  { code: 'L', name: 'Litre', category: 'Volume' },

  // Mass
  { code: 'g', name: 'Gram', category: 'Mass' },
  { code: 'kg', name: 'Kilogram', category: 'Mass', isDefault: true },
  { code: 't', name: 'Tonne', category: 'Mass', isDefault: true },

  // Count
  { code: 'nr', name: 'Number', category: 'Count', isDefault: true },
  { code: 'item', name: 'Item', category: 'Count', isDefault: true },
  { code: 'unit', name: 'Unit', category: 'Count' },
  { code: 'piece', name: 'Piece', category: 'Count' },
  { code: 'pcs', name: 'Pieces', category: 'Count' },

  // Time
  { code: 'hour', name: 'Hour', category: 'Time', isDefault: true },
  { code: 'day', name: 'Day', category: 'Time', isDefault: true },
  { code: 'week', name: 'Week', category: 'Time' },
  { code: 'month', name: 'Month', category: 'Time' },

  // Construction
  { code: 'bag', name: 'Bag (50kg)', category: 'Construction', isDefault: true },
  { code: 'block', name: 'Concrete Block', category: 'Construction' },
  { code: 'brick', name: 'Clay Brick', category: 'Construction' },
  { code: 'sheet', name: 'Roof/Ply Sheet', category: 'Construction' },
  { code: 'panel', name: 'Wall Panel', category: 'Construction' },
  { code: 'roll', name: 'Membrane/Mesh Roll', category: 'Construction' },
  { code: 'set', name: 'Set', category: 'Construction', isDefault: true },
  { code: 'lot', name: 'Lot', category: 'Construction', isDefault: true },
  { code: 'trip', name: 'Truck Trip', category: 'Construction' },

  // Labour
  { code: 'man-hour', name: 'Man-Hour', category: 'Labour' },
  { code: 'man-day', name: 'Man-Day', category: 'Labour' },

  // Plant/Equipment
  { code: 'shift', name: 'Equipment Shift', category: 'Plant/Equipment' },

  // Lump Sum
  { code: 'LS', name: 'Lump Sum', category: 'Lump Sum', isDefault: true },
  { code: 'Lump Sum', name: 'Lump Sum (full text)', category: 'Lump Sum' },

  // Percentage
  { code: '%', name: 'Percentage', category: 'Percentage' }
];

const PREDEFINED_UNITS = COMPREHENSIVE_UNITS.map(u => u.code);

const DEFAULT_RESOURCES: ResourceItem[] = [
  // Materials
  { id: '1', code: 'MAT-CEM-001', name: 'Portland Cement Grade 42.5N', type: 'material', unit: 'bag (50kg)', rateXaf: 5200, supplierOrTrade: 'Cimencam / Dangote', wastagePercent: 3.5, region: 'Douala / Littoral' },
  { id: '2', code: 'MAT-SND-001', name: 'Clean Sharp Sand (Wouri River)', type: 'material', unit: 'm³', rateXaf: 12500, supplierOrTrade: 'River Sand Quarry', wastagePercent: 5.0, region: 'Douala / Littoral' },
  { id: '3', code: 'MAT-GRV-001', name: 'Crushed Granite Gravel 15/25mm', type: 'material', unit: 'm³', rateXaf: 16500, supplierOrTrade: 'Dibamba Quarry', wastagePercent: 4.0, region: 'Littoral Region' },
  { id: '4', code: 'MAT-STL-001', name: 'High Yield Steel Rebar FeE500 (12mm-20mm)', type: 'material', unit: 't', rateXaf: 620000, supplierOrTrade: 'Prometal Steel', wastagePercent: 5.0, region: 'National' },
  { id: '5', code: 'MAT-BLK-015', name: 'Hollow Cement Concrete Block 15x20x40cm', type: 'material', unit: 'nr', rateXaf: 450, supplierOrTrade: 'MADECC Concrete Yard', wastagePercent: 3.0, region: 'Douala / Littoral' },
  { id: '6', code: 'MAT-BLK-020', name: 'Hollow Cement Concrete Block 20x20x40cm', type: 'material', unit: 'nr', rateXaf: 550, supplierOrTrade: 'MADECC Concrete Yard', wastagePercent: 3.0, region: 'Douala / Littoral' },
  { id: '7', code: 'MAT-TMB-001', name: 'Hardwood Timber Beams (Azobé / Bibolo)', type: 'material', unit: 'm³', rateXaf: 145000, supplierOrTrade: 'Mbalmayo Sawmills', wastagePercent: 7.5, region: 'Center Region' },
  { id: '8', code: 'MAT-TIL-001', name: 'Vitrified Porcelain Floor Tiles 60x60cm', type: 'material', unit: 'm²', rateXaf: 8500, supplierOrTrade: 'West Africa Tiles', wastagePercent: 6.0, region: 'Douala' },
  { id: '9', code: 'MAT-PNT-001', name: 'Weather-Shield Acrylic Exterior Paint', type: 'material', unit: '20L', rateXaf: 35000, supplierOrTrade: 'Seigneurie Paints', wastagePercent: 2.0, region: 'National' },

  // Labour
  { id: '10', code: 'LAB-MAS-001', name: 'Master Mason / Bricklayer', type: 'labour', unit: 'day', rateXaf: 10000, supplierOrTrade: 'Masonry Trade', productivity: '15 m²/day', region: 'Douala' },
  { id: '11', code: 'LAB-MAS-002', name: 'Journeyman Mason', type: 'labour', unit: 'day', rateXaf: 7500, supplierOrTrade: 'Masonry Trade', productivity: '10 m²/day', region: 'Douala' },
  { id: '12', code: 'LAB-CAR-001', name: 'Formwork Carpenter', type: 'labour', unit: 'day', rateXaf: 8500, supplierOrTrade: 'Carpentry Trade', productivity: '12 m²/day', region: 'Douala' },
  { id: '13', code: 'LAB-STL-001', name: 'Steel Fixer / Barbender', type: 'labour', unit: 'day', rateXaf: 8500, supplierOrTrade: 'Reinforcement Trade', productivity: '250 kg/day', region: 'Douala' },
  { id: '14', code: 'LAB-ELE-001', name: 'Certified Site Electrician', type: 'labour', unit: 'day', rateXaf: 9000, supplierOrTrade: 'Electrical Trade', productivity: '8 points/day', region: 'National' },
  { id: '15', code: 'LAB-PLM-001', name: 'Certified Site Plumber', type: 'labour', unit: 'day', rateXaf: 9000, supplierOrTrade: 'Plumbing Trade', productivity: '6 fixtures/day', region: 'National' },
  { id: '16', code: 'LAB-HLP-001', name: 'Unskilled Labourer / Helper', type: 'labour', unit: 'day', rateXaf: 4500, supplierOrTrade: 'General Civil Labour', productivity: 'General Assistance', region: 'National' },

  // Equipment
  { id: '17', code: 'EQP-EXC-001', name: 'Hydraulic Crawler Excavator 20T', type: 'equipment', unit: 'hour', rateXaf: 35000, supplierOrTrade: 'Caterpillar Fleet', productivity: '25 m³/hour', region: 'Douala Yard' },
  { id: '18', code: 'EQP-CRN-001', name: 'Mobile Crane 25T Capacity', type: 'equipment', unit: 'hour', rateXaf: 45000, supplierOrTrade: 'Heavy Lifts Cameroon', productivity: 'Site Lifts', region: 'Littoral' },
  { id: '19', code: 'EQP-MIX-001', name: 'Diesel Concrete Mixer 350L', type: 'equipment', unit: 'day', rateXaf: 15000, supplierOrTrade: 'MADECC Plant Hire', productivity: '6 m³/day', region: 'Douala Yard' },
  { id: '20', code: 'EQP-TRK-001', name: 'Tipper Dump Truck 15T', type: 'equipment', unit: 'day', rateXaf: 65000, supplierOrTrade: 'Logistics Fleet', productivity: 'Haulage 80 km/day', region: 'National' },
  { id: '21', code: 'EQP-GEN-001', name: 'Silent Diesel Generator 50kVA', type: 'equipment', unit: 'day', rateXaf: 25000, supplierOrTrade: 'Site Power Fleet', productivity: '24 hr supply', region: 'National' }
];

const PREDEFINED_SECTIONS_TEMPLATES = [
  {
    code: '1.0',
    title: 'PRELIMINARIES & GENERAL SITE ITEMS',
    items: [
      { itemNumber: '1.1', description: 'Site mobilization, temporary fencing, site office setup and safety signage', unit: 'LS', quantity: 1, unitRate: 850000 },
      { itemNumber: '1.2', description: 'Temporary water supply and electrical power distribution for duration of works', unit: 'LS', quantity: 1, unitRate: 450000 },
      { itemNumber: '1.3', description: 'Health, Safety & Environmental compliance (PPE supply, first aid, fire extinguishers)', unit: 'LS', quantity: 1, unitRate: 350000 }
    ]
  },
  {
    code: '2.0',
    title: 'EARTHWORKS & EXCAVATION',
    items: [
      { itemNumber: '2.1', description: 'Site clearance, topsoil stripping to 150mm depth and stockpiling on site', unit: 'm²', quantity: 350, unitRate: 1500 },
      { itemNumber: '2.2', description: 'Excavation in ordinary soil for pad footings and ground beams up to 1.80m depth', unit: 'm³', quantity: 95, unitRate: 8500 },
      { itemNumber: '2.3', description: 'Backfilling around foundations with selected granular material compacted in 150mm layers', unit: 'm³', quantity: 50, unitRate: 6500 },
      { itemNumber: '2.4', description: 'Removal off-site of surplus excavated spoil to approved municipal dump yard', unit: 'm³', quantity: 45, unitRate: 5000 }
    ]
  },
  {
    code: '3.0',
    title: 'CONCRETE WORKS & SUBSTRUCTURE',
    items: [
      { itemNumber: '3.1', description: 'Plain concrete blinding bed Grade C15/20 75mm thick under all pad footings', unit: 'm³', quantity: 9.5, unitRate: 78000 },
      { itemNumber: '3.2', description: 'Reinforced concrete Grade C25/30 in pad footings and ground tie beams including formwork', unit: 'm³', quantity: 28, unitRate: 285000 },
      { itemNumber: '3.3', description: 'High yield steel rebar FeE500 cut, bent, and fixed in substructure footings', unit: 't', quantity: 2.8, unitRate: 680000 },
      { itemNumber: '3.4', description: 'Ground floor slab 120mm thick Grade C25/30 on A142 anti-crack welded wire mesh', unit: 'm²', quantity: 180, unitRate: 22500 }
    ]
  },
  {
    code: '4.0',
    title: 'MASONRY & SUPERSTRUCTURE FRAME',
    items: [
      { itemNumber: '4.1', description: 'Hollow cement blockwork 20x20x40cm laid in 1:4 cement sand mortar for load-bearing walls', unit: 'm²', quantity: 380, unitRate: 8800 },
      { itemNumber: '4.2', description: 'Hollow cement blockwork 15x20x40cm for internal partition walls', unit: 'm²', quantity: 140, unitRate: 7500 },
      { itemNumber: '4.3', description: 'Reinforced concrete columns, lintels, and ring beams (Grade C25/30) including timber shuttering', unit: 'm³', quantity: 22, unitRate: 310000 },
      { itemNumber: '4.4', description: 'Suspended reinforced concrete floor slab 150mm thick Grade C25/30 including propping & formwork', unit: 'm²', quantity: 180, unitRate: 44000 }
    ]
  },
  {
    code: '5.0',
    title: 'ROOFING & WATERPROOFING',
    items: [
      { itemNumber: '5.1', description: 'Treated hardwood timber roof truss structure including wall plates, purlins, and struts', unit: 'm²', quantity: 210, unitRate: 15500 },
      { itemNumber: '5.2', description: 'Prepainted corrugated aluminum roof sheet coverage 0.55mm with ridge caps and flashings', unit: 'm²', quantity: 225, unitRate: 18500 },
      { itemNumber: '5.3', description: 'PVC rainwater gutters 150mm semi-circular with 100mm downpipes and shoes', unit: 'm', quantity: 48, unitRate: 7500 }
    ]
  },
  {
    code: '6.0',
    title: 'FINISHES (PLASTER, TILES, PAINTING)',
    items: [
      { itemNumber: '6.1', description: 'Internal & external cement plastering 15mm thick (1:4 mortar finish) wood trowelled', unit: 'm²', quantity: 820, unitRate: 3800 },
      { itemNumber: '6.2', description: 'Vitrified non-slip porcelain floor tiling 60x60cm laid on cement mortar bed', unit: 'm²', quantity: 160, unitRate: 14500 },
      { itemNumber: '6.3', description: 'Acrylic emulsion painting 3 coats over 1 coat primer binder to walls and ceilings', unit: 'm²', quantity: 820, unitRate: 2800 }
    ]
  },
  {
    code: '7.0',
    title: 'MEP SERVICES (PLUMBING & ELECTRICAL)',
    items: [
      { itemNumber: '7.1', description: 'Complete electrical distribution system including consumer unit, wiring in PVC conduits, switches & outlets', unit: 'LS', quantity: 1, unitRate: 1450000 },
      { itemNumber: '7.2', description: 'Sanitary plumbing installation including PPR water pipes, PVC drain lines, WC suites, and wash basins', unit: 'LS', quantity: 1, unitRate: 1250000 }
    ]
  },
  {
    code: '8.0',
    title: 'EXTERNAL WORKS & DRAINAGE',
    items: [
      { itemNumber: '8.1', description: 'Precast concrete paving slabs 60mm thick on compacted sand bed for driveway & footpaths', unit: 'm²', quantity: 120, unitRate: 12500 },
      { itemNumber: '8.2', description: 'Masonry perimeter drainage gutter 30x30cm with precast concrete perforated covers', unit: 'm', quantity: 65, unitRate: 14500 }
    ]
  }
];

export default function BoqStudio({ showToast, currentUser }: BoqStudioProps) {
  // Main Studio View Mode:
  // 'list' | 'qs_dashboard' | 'editor' | 'revisions' | 'resources' | 'reports' | 'approved_view'
  const [viewMode, setViewMode] = useState<'list' | 'qs_dashboard' | 'editor' | 'revisions' | 'resources' | 'reports' | 'approved_view'>('list');

  // Stage in Editor (1 to 7)
  const [editorStage, setEditorStage] = useState<'STAGE1_SETUP' | 'STAGE2_HIERARCHY' | 'STAGE3_MEASUREMENT' | 'STAGE4_RATE_BUILDUP' | 'STAGE5_TENDER_MODE' | 'STAGE6_APPROVAL' | 'STAGE7_CONSTRUCTION_CONTROL'>('STAGE2_HIERARCHY');

  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data State
  const [boqList, setBoqList] = useState<BoqData[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>(DEFAULT_RESOURCES);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Active BOQ Form
  const [currentBoq, setCurrentBoq] = useState<BoqData>({
    boqReference: '',
    projectName: '',
    clientName: '',
    clientEmail: '',
    clientNiu: '',
    clientAddress: '',
    location: '',
    description: '',
    preparedBy: currentUser?.name || 'Lead Quantity Surveyor',
    revisionNumber: 'REV-00',
    currency: 'XAF',
    status: 'DRAFT',
    overheadPercent: 5,
    contingencyPercent: 5,
    profitPercent: 10,
    taxPercent: 0,
    subtotal: 0,
    overheadAmount: 0,
    contingencyAmount: 0,
    profitAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    consultantName: 'MADECC Engineering & QS Consultancy',
    consultantEmail: 'qs@madecc.com',
    contractType: 'UNIT_RATE',
    tenderReference: '',
    tenderDate: new Date().toISOString().split('T')[0],
    submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    constructionCategory: 'Commercial',
    tenderMode: 'CLIENT_TENDER',
    approvalStage: 'DRAFT',
    sections: []
  });

  // Modals & Active Editors
  const [activeSectionIndex, setActiveSectionIndex] = useState<number | null>(null);
  const [selectedItemForDimension, setSelectedItemForDimension] = useState<{ secIdx: number; itemIdx: number } | null>(null);
  const [selectedItemForRateBreakdown, setSelectedItemForRateBreakdown] = useState<{ secIdx: number; itemIdx: number } | null>(null);
  
  // Revisions State
  const [selectedRevisionCompare, setSelectedRevisionCompare] = useState<{ revA: string; revB: string }>({ revA: 'REV-00', revB: 'REV-01' });
  const [showSaveRevisionModal, setShowSaveRevisionModal] = useState<boolean>(false);
  const [revisionNotesInput, setRevisionNotesInput] = useState<string>('');

  // Resource Library Modal / Tab
  const [activeResourceCategory, setActiveResourceCategory] = useState<'material' | 'labour' | 'equipment'>('material');
  const [resourceSearch, setResourceSearch] = useState<string>('');

  // Export & PDF
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  // Email Modal
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');

  // Quality Audit Engine state
  const [qualityAuditResults, setQualityAuditResults] = useState<{ healthScore: number; warnings: Array<{ type: string; itemRef: string; msg: string; fixAction?: () => void }> }>({ healthScore: 100, warnings: [] });

  // Interim Payment Certificate (IPC) Generator state
  const [ipcForm, setIpcForm] = useState<{ ipcNumber: string; periodName: string; retentionPercent: number; advanceDeduction: number; materialsOnSite: number }>({
    ipcNumber: 'IPC-001',
    periodName: 'Month 1 Progress Claim',
    retentionPercent: 10,
    advanceDeduction: 0,
    materialsOnSite: 0
  });

  // --- Section & Item Management State ---
  const [undoStack, setUndoStack] = useState<BoqData[]>([]);
  const [redoStack, setRedoStack] = useState<BoqData[]>([]);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [expandedSections, setExpandedSections] = useState<Record<string | number, boolean>>({});
  const [sectionFilterStatus, setSectionFilterStatus] = useState<'ALL' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [sectionSearchQuery, setSectionSearchQuery] = useState<string>('');

  // Modals state
  const [showCreateSectionModal, setShowCreateSectionModal] = useState<boolean>(false);
  const [newSectionForm, setNewSectionForm] = useState({
    sectionCode: '',
    title: '',
    description: '',
    sectionType: 'Concrete Works',
    defaultUnit: 'm³',
    notes: ''
  });

  const [showEditSectionModal, setShowEditSectionModal] = useState<boolean>(false);
  const [editingSecIdx, setEditingSecIdx] = useState<number | null>(null);
  const [editSectionForm, setEditSectionForm] = useState({
    sectionCode: '',
    title: '',
    description: '',
    sectionType: 'Concrete Works',
    defaultUnit: 'm³',
    notes: ''
  });

  const [showDeleteSectionModal, setShowDeleteSectionModal] = useState<boolean>(false);
  const [deletingSecIdx, setDeletingSecIdx] = useState<number | null>(null);

  const [showAddSubsectionModal, setShowAddSubsectionModal] = useState<boolean>(false);
  const [targetSecIdxForSub, setTargetSecIdxForSub] = useState<number | null>(null);
  const [subsectionForm, setSubsectionForm] = useState({ code: '', title: '', description: '' });

  const [showMoveItemModal, setShowMoveItemModal] = useState<boolean>(false);
  const [itemToMoveLocation, setItemToMoveLocation] = useState<{ secIdx: number; itemIdx: number } | null>(null);
  const [targetMoveSecIdx, setTargetMoveSecIdx] = useState<number>(0);

  const [showSectionApprovalModal, setShowSectionApprovalModal] = useState<boolean>(false);
  const [approvingSecIdx, setApprovingSecIdx] = useState<number | null>(null);
  const [approvalStatusChoice, setApprovalStatusChoice] = useState<'DRAFT' | 'IN_REVIEW' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('APPROVED');

  const [customUnitsList, setCustomUnitsList] = useState<BoqUnitItem[]>(COMPREHENSIVE_UNITS);
  const [showCustomUnitModal, setShowCustomUnitModal] = useState<boolean>(false);
  const [customUnitForm, setCustomUnitForm] = useState({ code: '', name: '', category: 'Construction', description: '' });

  const [openSectionMenuIdx, setOpenSectionMenuIdx] = useState<number | null>(null);

  // Load Data on Mount
  useEffect(() => {
    fetchBoqData();
    fetchProjectsAndClients();
  }, []);

  const pushUndoState = (previousBoq: BoqData) => {
    setUndoStack(prev => [...prev.slice(-29), JSON.parse(JSON.stringify(previousBoq))]);
    setRedoStack([]);
    setIsDirty(true);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [...prev, JSON.parse(JSON.stringify(currentBoq))]);
    setCurrentBoq(previous);
    if (showToast) showToast('Undo action applied', 'info');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setUndoStack(prev => [...prev, JSON.parse(JSON.stringify(currentBoq))]);
    setCurrentBoq(next);
    if (showToast) showToast('Redo action applied', 'info');
  };

  // Auto-Save Timer
  useEffect(() => {
    if (!isDirty || !currentBoq.projectName) return;
    const timer = setInterval(() => {
      handleSaveBoqSilent();
    }, 30000);
    return () => clearInterval(timer);
  }, [isDirty, currentBoq]);

  const handleSaveBoqSilent = async () => {
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = currentBoq.id ? `/api/boqs/${currentBoq.id}` : '/api/boqs';
      const method = currentBoq.id ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(currentBoq) });
      if (res.ok) {
        const savedData = await res.json();
        setCurrentBoq(savedData);
        setIsDirty(false);
        setLastSavedAt(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.error('Silent auto-save error:', err);
    }
  };

  const fetchBoqData = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/boqs', { headers });
      if (res.ok) {
        const data = await res.json();
        setBoqList(data);
      }
    } catch (err) {
      console.error('Failed fetching BOQs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsAndClients = async () => {
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const projRes = await fetch('/api/projects', { headers });
      if (projRes.ok) setProjectsList(await projRes.json());

      const userRes = await fetch('/api/users', { headers });
      if (userRes.ok) setClientsList(await userRes.json());
    } catch (err) {
      console.error('Error fetching support lists:', err);
    }
  };

  // Start Create New BOQ
  const handleStartCreate = () => {
    const year = new Date().getFullYear();
    const nextSeq = String(boqList.length + 1).padStart(4, '0');
    
    const defaultSections: BoqSection[] = PREDEFINED_SECTIONS_TEMPLATES.map((tmpl, idx) => {
      const secId = `sec-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
      return {
        id: secId,
        sectionCode: tmpl.code,
        title: tmpl.title,
        sectionType: idx === 0 ? 'Preliminaries' : 'Concrete Works',
        status: 'DRAFT',
        isArchived: false,
        displayOrder: idx,
        subtotal: tmpl.items.reduce((acc, it) => acc + (it.quantity * it.unitRate), 0),
        items: tmpl.items.map((it, itIdx) => ({
          id: `item-${Date.now()}-${idx}-${itIdx}-${Math.random().toString(36).substring(2, 6)}`,
          itemNumber: it.itemNumber,
          description: it.description,
          unit: it.unit,
          quantity: it.quantity,
          unitRate: it.unitRate,
          amount: it.quantity * it.unitRate,
          status: 'ACTIVE',
          isArchived: false,
          internalMaterialCost: Math.round(it.unitRate * 0.45),
          internalLabourCost: Math.round(it.unitRate * 0.30),
          internalPlantCost: Math.round(it.unitRate * 0.10),
          internalOtherCost: Math.round(it.unitRate * 0.05),
          displayOrder: itIdx,
          rateBreakdown: {
            materialCost: Math.round(it.unitRate * 0.45),
            labourCost: Math.round(it.unitRate * 0.30),
            plantCost: Math.round(it.unitRate * 0.10),
            transportCost: Math.round(it.unitRate * 0.05),
            wastagePercent: 3.5,
            siteOverheadPercent: 5.0,
            headOfficeOverheadPercent: 3.0,
            profitPercent: 10.0
          },
          dimensionSheet: {
            formulaType: 'LWH',
            lines: [
              { id: '1', description: 'Main Section', times: 1, length: Number(it.quantity) || 1, width: 1, depth: 1, calculated: Number(it.quantity) || 1 }
            ],
            totalQty: Number(it.quantity) || 1,
            isApproved: true,
            approvedBy: currentUser?.name || 'Lead QS'
          }
        }))
      };
    });

    const initial: BoqData = {
      boqReference: `MADECC-BOQ-${year}-${nextSeq}`,
      projectName: '',
      clientName: '',
      clientEmail: '',
      clientNiu: '',
      clientAddress: '',
      location: 'Douala, Littoral Region, Cameroon',
      description: 'Enterprise Quantity Surveying Bill of Quantities and Engineering Rate Build-up.',
      preparedBy: currentUser?.name || 'Lead Quantity Surveyor',
      revisionNumber: 'REV-00',
      currency: 'XAF',
      status: 'DRAFT',
      overheadPercent: 5,
      contingencyPercent: 5,
      profitPercent: 10,
      taxPercent: 0,
      subtotal: 0,
      overheadAmount: 0,
      contingencyAmount: 0,
      profitAmount: 0,
      taxAmount: 0,
      grandTotal: 0,
      consultantName: 'MADECC Quantity Surveying Consultancy',
      consultantEmail: 'qs@madecc.com',
      contractType: 'UNIT_RATE',
      tenderReference: `TND-${year}-MDCC-${nextSeq}`,
      tenderDate: new Date().toISOString().split('T')[0],
      submissionDeadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      constructionCategory: 'Commercial',
      tenderMode: 'CLIENT_TENDER',
      approvalStage: 'DRAFT',
      sections: defaultSections
    };

    recalculateBoqState(initial);
    setEditorStage('STAGE1_SETUP');
    setViewMode('editor');
  };

  // Open existing BOQ
  const handleOpenBoq = async (id: number, targetView?: 'editor' | 'qs_dashboard' | 'approved_view') => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/boqs/${id}`, { headers });
      if (res.ok) {
        const fullBoq = await res.json();
        setCurrentBoq(fullBoq);
        if (targetView) {
          setViewMode(targetView);
        } else {
          setViewMode('editor');
          setEditorStage('STAGE2_HIERARCHY');
        }
      }
    } catch (err) {
      console.error('Error fetching single BOQ:', err);
    } finally {
      setLoading(false);
    }
  };

  // Recalculate BOQ Amounts Client-side
  const recalculateBoqState = (boqObj: BoqData): BoqData => {
    let grandSubtotal = 0;

    const updatedSections = (boqObj.sections || []).map((sec, sIdx) => {
      let secSubtotal = 0;
      const updatedItems = (sec.items || []).map((item, iIdx) => {
        const qty = parseFloat(String(item.quantity)) || 0;
        const rate = parseFloat(String(item.unitRate)) || 0;
        const amt = Math.round(qty * rate * 100) / 100;
        const isArch = item.isArchived || item.status === 'ARCHIVED';
        if (!isArch) {
          secSubtotal += amt;
        }
        return {
          ...item,
          id: item.id || `item-${Date.now()}-${sIdx}-${iIdx}-${Math.random().toString(36).substring(2, 6)}`,
          amount: amt,
          displayOrder: iIdx
        };
      });

      const secArch = sec.isArchived || sec.status === 'ARCHIVED';
      if (!secArch) {
        grandSubtotal += secSubtotal;
      }

      return {
        ...sec,
        id: sec.id || `sec-${Date.now()}-${sIdx}-${Math.random().toString(36).substring(2, 6)}`,
        subtotal: secSubtotal,
        displayOrder: sIdx,
        items: updatedItems
      };
    });

    const ovhP = parseFloat(String(boqObj.overheadPercent)) || 0;
    const cntP = parseFloat(String(boqObj.contingencyPercent)) || 0;
    const prfP = parseFloat(String(boqObj.profitPercent)) || 0;
    const taxP = parseFloat(String(boqObj.taxPercent)) || 0;
    const discP = parseFloat(String(boqObj.discountPercent)) || 0;

    const ovhAmt = Math.round(grandSubtotal * (ovhP / 100));
    const cntAmt = Math.round(grandSubtotal * (cntP / 100));
    const prfAmt = Math.round(grandSubtotal * (prfP / 100));
    const discAmt = Math.round(grandSubtotal * (discP / 100));

    const taxableBase = grandSubtotal + ovhAmt + cntAmt + prfAmt - discAmt;
    const taxAmt = Math.round(taxableBase * (taxP / 100));
    const gTotal = taxableBase + taxAmt;

    const updated = {
      ...boqObj,
      subtotal: grandSubtotal,
      overheadAmount: ovhAmt,
      contingencyAmount: cntAmt,
      profitAmount: prfAmt,
      discountAmount: discAmt,
      taxAmount: taxAmt,
      grandTotal: gTotal,
      sections: updatedSections
    };

    setCurrentBoq(updated);
    return updated;
  };

  const handleCreateSectionSubmit = () => {
    if (!newSectionForm.sectionCode || !newSectionForm.title) {
      if (showToast) showToast('Section Code and Title are required', 'error');
      return;
    }

    pushUndoState(currentBoq);

    const newSec: BoqSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sectionCode: newSectionForm.sectionCode.trim(),
      title: newSectionForm.title.trim(),
      description: newSectionForm.description.trim(),
      sectionType: newSectionForm.sectionType,
      defaultUnit: newSectionForm.defaultUnit,
      notes: newSectionForm.notes,
      status: 'DRAFT',
      isArchived: false,
      subtotal: 0,
      items: []
    };

    const updatedSections = [...(currentBoq.sections || []), newSec];
    recalculateBoqState({ ...currentBoq, sections: updatedSections });

    setShowCreateSectionModal(false);
    setNewSectionForm({
      sectionCode: '',
      title: '',
      description: '',
      sectionType: 'Concrete Works',
      defaultUnit: 'm³',
      notes: ''
    });

    if (showToast) showToast('✓ Section created successfully', 'success');
  };

  const handleOpenEditSection = (secIdx: number) => {
    const sec = currentBoq.sections?.[secIdx];
    if (!sec) return;
    setEditingSecIdx(secIdx);
    setEditSectionForm({
      sectionCode: sec.sectionCode || '',
      title: sec.title || '',
      description: sec.description || '',
      sectionType: sec.sectionType || 'Concrete Works',
      defaultUnit: sec.defaultUnit || 'm³',
      notes: sec.notes || ''
    });
    setShowEditSectionModal(true);
    setOpenSectionMenuIdx(null);
  };

  const handleEditSectionSubmit = () => {
    if (editingSecIdx === null || !currentBoq.sections?.[editingSecIdx]) return;
    pushUndoState(currentBoq);

    const sectionsCopy = [...(currentBoq.sections || [])];
    sectionsCopy[editingSecIdx] = {
      ...sectionsCopy[editingSecIdx],
      sectionCode: editSectionForm.sectionCode.trim(),
      title: editSectionForm.title.trim(),
      description: editSectionForm.description.trim(),
      sectionType: editSectionForm.sectionType,
      defaultUnit: editSectionForm.defaultUnit,
      notes: editSectionForm.notes
    };

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    setShowEditSectionModal(false);
    setEditingSecIdx(null);

    if (showToast) showToast('✓ Section updated successfully', 'success');
  };

  const handleDuplicateSection = (secIdx: number) => {
    const targetSec = currentBoq.sections?.[secIdx];
    if (!targetSec) return;

    pushUndoState(currentBoq);

    const newSecId = `sec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const duplicatedItems: BoqItem[] = (targetSec.items || []).map((it, itIdx) => ({
      ...it,
      id: `item-${Date.now()}-${itIdx}-${Math.random().toString(36).substring(2, 7)}`,
      itemNumber: `${it.itemNumber}.COPY`,
      description: `${it.description} — Copy`
    }));

    const duplicatedSec: BoqSection = {
      ...targetSec,
      id: newSecId,
      sectionCode: `${targetSec.sectionCode}.COPY`,
      title: `${targetSec.title} — Copy`,
      items: duplicatedItems,
      status: 'DRAFT',
      isArchived: false
    };

    const sectionsCopy = [...(currentBoq.sections || [])];
    sectionsCopy.splice(secIdx + 1, 0, duplicatedSec);

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    setOpenSectionMenuIdx(null);
    if (showToast) showToast('✓ Section duplicated with unique IDs', 'success');
  };

  const handleMoveSection = (secIdx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && secIdx === 0) || (direction === 'down' && secIdx === (currentBoq.sections || []).length - 1)) return;
    pushUndoState(currentBoq);
    const sectionsCopy = [...(currentBoq.sections || [])];
    const targetIdx = direction === 'up' ? secIdx - 1 : secIdx + 1;
    const temp = sectionsCopy[secIdx];
    sectionsCopy[secIdx] = sectionsCopy[targetIdx];
    sectionsCopy[targetIdx] = temp;
    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    setOpenSectionMenuIdx(null);
  };

  const handleOpenDeleteSection = (secIdx: number) => {
    setDeletingSecIdx(secIdx);
    setShowDeleteSectionModal(true);
    setOpenSectionMenuIdx(null);
  };

  const handleConfirmDeleteSection = (permanent: boolean) => {
    if (deletingSecIdx === null) return;
    pushUndoState(currentBoq);

    const sectionsCopy = [...(currentBoq.sections || [])];
    if (permanent) {
      sectionsCopy.splice(deletingSecIdx, 1);
      if (showToast) showToast('Section deleted permanently', 'info');
    } else {
      sectionsCopy[deletingSecIdx] = {
        ...sectionsCopy[deletingSecIdx],
        status: 'ARCHIVED',
        isArchived: true
      };
      if (showToast) showToast('Section archived', 'info');
    }

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    setShowDeleteSectionModal(false);
    setDeletingSecIdx(null);
  };

  const handleRestoreSection = (secIdx: number) => {
    pushUndoState(currentBoq);
    const sectionsCopy = [...(currentBoq.sections || [])];
    sectionsCopy[secIdx] = {
      ...sectionsCopy[secIdx],
      status: 'DRAFT',
      isArchived: false
    };
    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    setOpenSectionMenuIdx(null);
    if (showToast) showToast('✓ Section restored', 'success');
  };

  const handleOpenAddSubsection = (secIdx: number) => {
    const sec = currentBoq.sections?.[secIdx];
    setTargetSecIdxForSub(secIdx);
    const count = (sec?.subsections || []).length + 1;
    setSubsectionForm({
      code: `${sec?.sectionCode || '1.0'}.${count}`,
      title: '',
      description: ''
    });
    setShowAddSubsectionModal(true);
    setOpenSectionMenuIdx(null);
  };

  const handleAddSubsectionSubmit = () => {
    if (targetSecIdxForSub === null) return;
    pushUndoState(currentBoq);

    const sectionsCopy = [...(currentBoq.sections || [])];
    const sec = sectionsCopy[targetSecIdxForSub];
    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: subsectionForm.code.trim(),
      title: subsectionForm.title.trim(),
      description: subsectionForm.description.trim()
    };

    sec.subsections = [...(sec.subsections || []), newSub];
    setCurrentBoq({ ...currentBoq, sections: sectionsCopy });
    setShowAddSubsectionModal(false);
    setTargetSecIdxForSub(null);
    if (showToast) showToast('✓ Subsection added', 'success');
  };

  const handleAddItemToSection = (secIdx: number) => {
    pushUndoState(currentBoq);
    const sectionsCopy = [...(currentBoq.sections || [])];
    const sec = sectionsCopy[secIdx];
    const itemSeq = (sec.items || []).length + 1;
    const newItemNumber = `${sec.sectionCode}.${itemSeq}`;

    const newItem: BoqItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      itemNumber: newItemNumber,
      description: 'New Quantity Surveying line item description',
      unit: sec.defaultUnit || 'm²',
      quantity: 10,
      unitRate: 15000,
      amount: 150000,
      status: 'ACTIVE',
      isArchived: false,
      internalMaterialCost: 6750,
      internalLabourCost: 4500,
      internalPlantCost: 1500,
      internalOtherCost: 750,
      displayOrder: itemSeq
    };

    sectionsCopy[secIdx].items = [...(sec.items || []), newItem];
    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    if (showToast) showToast('✓ Item added to section', 'success');
  };

  const handleDuplicateItem = (secIdx: number, itemIdx: number) => {
    pushUndoState(currentBoq);
    const sectionsCopy = [...(currentBoq.sections || [])];
    const srcItem = sectionsCopy[secIdx].items[itemIdx];

    const newItem: BoqItem = {
      ...srcItem,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      itemNumber: `${srcItem.itemNumber}.COPY`,
      description: `${srcItem.description} — Copy`
    };

    sectionsCopy[secIdx].items.splice(itemIdx + 1, 0, newItem);
    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    if (showToast) showToast('✓ Item duplicated with unique ID', 'success');
  };

  const handleOpenMoveItem = (secIdx: number, itemIdx: number) => {
    setItemToMoveLocation({ secIdx, itemIdx });
    setTargetMoveSecIdx(secIdx === 0 ? 1 : 0);
    setShowMoveItemModal(true);
  };

  const handleMoveItemSubmit = () => {
    if (!itemToMoveLocation) return;
    const { secIdx: srcSecIdx, itemIdx: srcItemIdx } = itemToMoveLocation;
    if (srcSecIdx === targetMoveSecIdx || targetMoveSecIdx < 0 || targetMoveSecIdx >= (currentBoq.sections || []).length) {
      setShowMoveItemModal(false);
      return;
    }

    pushUndoState(currentBoq);

    const sectionsCopy = [...(currentBoq.sections || [])];
    const movedItem = sectionsCopy[srcSecIdx].items[srcItemIdx];

    sectionsCopy[srcSecIdx].items.splice(srcItemIdx, 1);
    sectionsCopy[targetMoveSecIdx].items = [...(sectionsCopy[targetMoveSecIdx].items || []), movedItem];

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    setShowMoveItemModal(false);
    setItemToMoveLocation(null);
    if (showToast) showToast(`✓ Item moved to Section ${sectionsCopy[targetMoveSecIdx].sectionCode}`, 'success');
  };

  const handleArchiveItem = (secIdx: number, itemIdx: number) => {
    pushUndoState(currentBoq);
    const sectionsCopy = [...(currentBoq.sections || [])];
    const item = sectionsCopy[secIdx].items[itemIdx];
    const nextArch = !item.isArchived;

    sectionsCopy[secIdx].items[itemIdx] = {
      ...item,
      isArchived: nextArch,
      status: nextArch ? 'ARCHIVED' : 'ACTIVE'
    };

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    if (showToast) showToast(nextArch ? 'Item archived' : 'Item restored', 'info');
  };

  const handleDeleteItem = (secIdx: number, itemIdx: number) => {
    pushUndoState(currentBoq);
    const sectionsCopy = [...(currentBoq.sections || [])];
    sectionsCopy[secIdx].items.splice(itemIdx, 1);
    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    if (showToast) showToast('Item deleted', 'info');
  };

  const handleOpenSectionApproval = (secIdx: number) => {
    const sec = currentBoq.sections?.[secIdx];
    setApprovingSecIdx(secIdx);
    setApprovalStatusChoice((sec?.status as any) || 'APPROVED');
    setShowSectionApprovalModal(true);
    setOpenSectionMenuIdx(null);
  };

  const handleSectionApprovalSubmit = () => {
    if (approvingSecIdx === null) return;
    pushUndoState(currentBoq);

    const sectionsCopy = [...(currentBoq.sections || [])];
    sectionsCopy[approvingSecIdx] = {
      ...sectionsCopy[approvingSecIdx],
      status: approvalStatusChoice
    };

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
    setShowSectionApprovalModal(false);
    setApprovingSecIdx(null);
    if (showToast) showToast(`✓ Section status updated to ${approvalStatusChoice}`, 'success');
  };

  const handleAddCustomUnitSubmit = async () => {
    if (!customUnitForm.code || !customUnitForm.name) {
      if (showToast) showToast('Unit code and name are required', 'error');
      return;
    }

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/boq/units', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          code: customUnitForm.code,
          name: customUnitForm.name,
          category: customUnitForm.category,
          description: customUnitForm.description,
          isDefault: false
        })
      });

      if (res.ok) {
        const createdUnit = await res.json();
        setCustomUnitsList(prev => [...prev, createdUnit]);
      } else {
        setCustomUnitsList(prev => [...prev, {
          code: customUnitForm.code,
          name: customUnitForm.name,
          category: customUnitForm.category,
          description: customUnitForm.description
        }]);
      }

      setShowCustomUnitModal(false);
      setCustomUnitForm({ code: '', name: '', category: 'Construction', description: '' });
      if (showToast) showToast('✓ Custom Unit created & saved to library', 'success');
    } catch (err) {
      console.error(err);
      setShowCustomUnitModal(false);
    }
  };

  const handleExpandAll = () => {
    const newExpanded: Record<string | number, boolean> = {};
    (currentBoq.sections || []).forEach((sec, idx) => {
      const secKey = sec.id || idx;
      newExpanded[secKey] = true;
    });
    setExpandedSections(newExpanded);
  };

  const handleCollapseAll = () => {
    setExpandedSections({});
  };

  const toggleSectionExpanded = (secKey: string | number) => {
    setExpandedSections(prev => ({
      ...prev,
      [secKey]: prev[secKey] === false ? true : false
    }));
  };

  // Save BOQ to Server
  const handleSaveBoq = async () => {
    if (!currentBoq.projectName || !currentBoq.clientName) {
      if (showToast) showToast('Please provide Project Name and Client Name before saving.', 'error');
      return;
    }

    setSaving(true);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const url = currentBoq.id ? `/api/boqs/${currentBoq.id}` : '/api/boqs';
      const method = currentBoq.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(currentBoq)
      });

      if (res.ok) {
        const savedData = await res.json();
        setCurrentBoq(savedData);
        if (showToast) showToast('BOQ estimate saved successfully.', 'success');
        fetchBoqData();
      } else {
        const errJson = await res.json();
        if (showToast) showToast(`Save failed: ${errJson.error || 'Server error'}`, 'error');
      }
    } catch (err: any) {
      console.error('Error saving BOQ:', err);
      if (showToast) showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Run Quality Control Audit Check (Requirement 11)
  const runQualityAudit = () => {
    const warnings: Array<{ type: string; itemRef: string; msg: string }> = [];
    let score = 100;

    if (!currentBoq.sections || currentBoq.sections.length === 0) {
      warnings.push({ type: 'CRITICAL', itemRef: 'BOQ Structure', msg: 'No sections or bills defined in BOQ.' });
      score -= 30;
    }

    (currentBoq.sections || []).forEach((sec) => {
      if (!sec.items || sec.items.length === 0) {
        warnings.push({ type: 'WARNING', itemRef: `Section ${sec.sectionCode}`, msg: `Section "${sec.title}" has no line items.` });
        score -= 10;
      }

      const seenNumbers = new Set<string>();
      (sec.items || []).forEach((item) => {
        if (!item.unit || item.unit.trim() === '') {
          warnings.push({ type: 'ERROR', itemRef: `Item ${item.itemNumber}`, msg: 'Missing measurement unit.' });
          score -= 5;
        }

        const qty = Number(item.quantity) || 0;
        if (qty <= 0) {
          warnings.push({ type: 'ERROR', itemRef: `Item ${item.itemNumber}`, msg: 'Zero or negative quantity specified.' });
          score -= 5;
        }

        const rate = Number(item.unitRate) || 0;
        if (rate <= 0) {
          warnings.push({ type: 'ERROR', itemRef: `Item ${item.itemNumber}`, msg: 'Zero or unpriced unit rate.' });
          score -= 5;
        } else if (rate > 5000000) {
          warnings.push({ type: 'WARNING', itemRef: `Item ${item.itemNumber}`, msg: `Abnormally high unit rate (${rate.toLocaleString()} XAF).` });
          score -= 3;
        }

        if (seenNumbers.has(item.itemNumber)) {
          warnings.push({ type: 'ERROR', itemRef: `Item ${item.itemNumber}`, msg: `Duplicate item number in Section ${sec.sectionCode}.` });
          score -= 5;
        }
        seenNumbers.add(item.itemNumber);
      });
    });

    setQualityAuditResults({
      healthScore: Math.max(0, score),
      warnings
    });
  };

  // -------------------------------------------------------------
  // CERTIFIED EXPORT HANDLERS (PDF, EXCEL, WORD, CSV)
  // -------------------------------------------------------------
  const getExportTargetBoq = () => {
    if (currentBoq.sections && currentBoq.sections.length > 0) {
      return currentBoq;
    }
    if (boqList && boqList.length > 0 && boqList[0].sections && boqList[0].sections.length > 0) {
      return boqList[0];
    }
    return currentBoq;
  };

  const handleExportPdf = async () => {
    try {
      setGeneratingPdf(true);
      if (showToast) showToast('Generating Certified Client Tender BOQ PDF...', 'info');
      const targetBoq = getExportTargetBoq();
      const { pdf, filename } = await generateBoqPdf(targetBoq);
      pdf.save(filename);
      if (showToast) showToast(`Client Tender BOQ PDF (${filename}) downloaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Failed to export PDF report:', err);
      if (showToast) showToast(`PDF Generation failed: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleExportExcel = () => {
    try {
      if (showToast) showToast('Generating Abstract of Cost Excel workbook...', 'info');
      const targetBoq = getExportTargetBoq();
      const { blob, filename } = generateBoqExcel(targetBoq);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (showToast) showToast(`Abstract of Cost Excel file (${filename}) downloaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Failed to export Excel report:', err);
      if (showToast) showToast(`Excel Generation failed: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const handleExportDocx = async () => {
    try {
      if (showToast) showToast('Generating Material Take-Off Word document...', 'info');
      const targetBoq = getExportTargetBoq();
      const { blob, filename } = await generateBoqDocx(targetBoq);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (showToast) showToast(`Material Take-Off Word document (${filename}) downloaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Failed to export Word document:', err);
      if (showToast) showToast(`Word Document Generation failed: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  const handleExportCsv = () => {
    try {
      if (showToast) showToast('Generating Master Data CSV file...', 'info');
      const targetBoq = getExportTargetBoq();
      const { blob, filename } = generateBoqCsv(targetBoq);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (showToast) showToast(`Master Data CSV file (${filename}) downloaded successfully!`, 'success');
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      if (showToast) showToast(`CSV Export failed: ${err.message || 'Unknown error'}`, 'error');
    }
  };

  // Run quality check automatically when entering Quality/Dashboard tab
  useEffect(() => {
    if (viewMode === 'qs_dashboard' || editorStage === 'STAGE6_APPROVAL') {
      runQualityAudit();
    }
  }, [viewMode, editorStage, currentBoq]);

  // Dimension Sheet Helper: Add / Remove / Calculate Dimension Line
  const handleUpdateDimensionLine = (field: string, val: any, index: number) => {
    if (selectedItemForDimension === null) return;
    const { secIdx, itemIdx } = selectedItemForDimension;
    
    const sectionsCopy = [...(currentBoq.sections || [])];
    const item = sectionsCopy[secIdx].items[itemIdx];
    const sheet = item.dimensionSheet || {
      formulaType: 'LWH',
      lines: [{ id: '1', description: 'Main Section', times: 1, length: 1, width: 1, depth: 1, calculated: 1 }],
      totalQty: 1,
      isApproved: true
    };

    const linesCopy = [...sheet.lines];
    const line = { ...linesCopy[index], [field]: val };

    const times = Number(line.times) || 1;
    const len = Number(line.length) || 0;
    const wid = Number(line.width) || 1;
    const dep = Number(line.depth) || 1;

    let calc = 0;
    if (sheet.formulaType === 'LWH') {
      calc = times * len * wid * dep;
    } else if (sheet.formulaType === 'LH') {
      calc = times * len * dep;
    } else if (sheet.formulaType === 'REBAR_WEIGHT') {
      // Weight per metre formula: (d^2 / 162) kg/m
      const dia = sheet.rebarDiameterMm || 12;
      const weightPerMetre = (dia * dia) / 162;
      calc = (times * len * weightPerMetre) / 1000; // Tons
    } else if (sheet.formulaType === 'BLOCK_COUNT') {
      // Wall Area ÷ Block Area
      const faceArea = sheet.blockFaceAreaM2 || 0.08; // 20x40cm = 0.08m2
      calc = (times * len * wid) / faceArea;
    } else {
      calc = times * len;
    }

    line.calculated = Math.round(calc * 1000) / 1000;
    linesCopy[index] = line;

    const totalQty = linesCopy.reduce((sum, l) => sum + (l.calculated || 0), 0);

    const updatedSheet = {
      ...sheet,
      lines: linesCopy,
      totalQty: Math.round(totalQty * 1000) / 1000
    };

    sectionsCopy[secIdx].items[itemIdx].dimensionSheet = updatedSheet;
    sectionsCopy[secIdx].items[itemIdx].quantity = updatedSheet.totalQty;

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
  };

  // Rate Analysis Breakdown Helper
  const handleUpdateRateBreakdown = (field: string, val: number) => {
    if (selectedItemForRateBreakdown === null) return;
    const { secIdx, itemIdx } = selectedItemForRateBreakdown;

    const sectionsCopy = [...(currentBoq.sections || [])];
    const item = sectionsCopy[secIdx].items[itemIdx];
    const currentBreakdown = item.rateBreakdown || {
      materialCost: 0,
      labourCost: 0,
      plantCost: 0,
      transportCost: 0,
      wastagePercent: 3.5,
      siteOverheadPercent: 5.0,
      headOfficeOverheadPercent: 3.0,
      profitPercent: 10.0
    };

    const updatedBreakdown = { ...currentBreakdown, [field]: val };

    const directCost = (Number(updatedBreakdown.materialCost) || 0) +
                       (Number(updatedBreakdown.labourCost) || 0) +
                       (Number(updatedBreakdown.plantCost) || 0) +
                       (Number(updatedBreakdown.transportCost) || 0);

    const withWastage = directCost * (1 + (Number(updatedBreakdown.wastagePercent) || 0) / 100);
    const totalMarkupsPercent = (Number(updatedBreakdown.siteOverheadPercent) || 0) +
                                (Number(updatedBreakdown.headOfficeOverheadPercent) || 0) +
                                (Number(updatedBreakdown.profitPercent) || 0);

    const finalRate = Math.round(withWastage * (1 + totalMarkupsPercent / 100));

    sectionsCopy[secIdx].items[itemIdx].rateBreakdown = updatedBreakdown;
    sectionsCopy[secIdx].items[itemIdx].unitRate = finalRate;

    recalculateBoqState({ ...currentBoq, sections: sectionsCopy });
  };

  // Format currency
  const formatCurrency = (amount: number | string, curr: string = 'XAF') => {
    const num = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(num) + ' ' + curr;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* TOP HEADER & SYSTEM WORKFLOW NAVIGATION */}
      <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Brand & Active BOQ Reference */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-white tracking-tight">Enterprise QS BOQ Studio</h1>
                <span className="px-2 py-0.5 text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  Phase 5
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center space-x-2">
                <span>{currentBoq.projectName || 'New Construction Tender'}</span>
                {currentBoq.boqReference && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-amber-400/90">{currentBoq.boqReference}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Main Top Level Views */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 overflow-x-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
                viewMode === 'list' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>BOQ Registry</span>
            </button>

            <button
              onClick={() => setViewMode('qs_dashboard')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
                viewMode === 'qs_dashboard' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>QS Dashboard</span>
            </button>

            <button
              onClick={() => {
                if (!currentBoq.projectName) handleStartCreate();
                else setViewMode('editor');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
                viewMode === 'editor' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>BOQ Editor</span>
            </button>

            <button
              onClick={() => setViewMode('revisions')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
                viewMode === 'revisions' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Revisions</span>
            </button>

            <button
              onClick={() => setViewMode('resources')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
                viewMode === 'resources' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Resource Library</span>
            </button>

            <button
              onClick={() => setViewMode('reports')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition flex items-center space-x-1.5 whitespace-nowrap ${
                viewMode === 'reports' ? 'bg-amber-500 text-slate-950 shadow-md font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Certified Reports</span>
            </button>
          </div>

          {/* Action Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSaveBoq}
              disabled={saving}
              className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-lg flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save BOQ'}</span>
            </button>

            <button
              onClick={handleStartCreate}
              className="px-3.5 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition shadow-lg flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New BOQ</span>
            </button>
          </div>

        </div>
      </header>

      {/* SUB-HEADER WORKFLOW STAGE TRACKER (Inside BOQ Editor) */}
      {viewMode === 'editor' && (
        <div className="bg-slate-950/70 border-b border-slate-800 px-4 py-2 overflow-x-auto">
          <div className="max-w-7xl mx-auto flex items-center space-x-2 min-w-max">
            
            <button
              onClick={() => setEditorStage('STAGE1_SETUP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                editorStage === 'STAGE1_SETUP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Tender Setup</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <button
              onClick={() => setEditorStage('STAGE2_HIERARCHY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                editorStage === 'STAGE2_HIERARCHY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">2</span>
              <span>BOQ Hierarchy</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <button
              onClick={() => setEditorStage('STAGE3_MEASUREMENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                editorStage === 'STAGE3_MEASUREMENT' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Dimensions</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <button
              onClick={() => setEditorStage('STAGE4_RATE_BUILDUP')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                editorStage === 'STAGE4_RATE_BUILDUP' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">4</span>
              <span>Rate Analysis</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <button
              onClick={() => setEditorStage('STAGE5_TENDER_MODE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                editorStage === 'STAGE5_TENDER_MODE' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">5</span>
              <span>Dual Pricing</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <button
              onClick={() => setEditorStage('STAGE6_APPROVAL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                editorStage === 'STAGE6_APPROVAL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">6</span>
              <span>Approvals</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

            <button
              onClick={() => setEditorStage('STAGE7_CONSTRUCTION_CONTROL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition ${
                editorStage === 'STAGE7_CONSTRUCTION_CONTROL' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold">7</span>
              <span>Construction IPC</span>
            </button>

          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* ------------------------------------------------------------- */}
        {/* VIEW 1: BOQ REGISTRY TABLE (LIST MODE)                        */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/60 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1 md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by reference, project, client..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <select
                  value={activeStatusFilter}
                  onChange={(e) => setActiveStatusFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PENDING_REVIEW">Pending Review</option>
                  <option value="APPROVED">Approved</option>
                </select>
              </div>

              <div className="text-xs text-slate-400 font-mono">
                Total BOQs: <span className="text-amber-400 font-bold">{boqList.length}</span>
              </div>
            </div>

            {/* BOQ Table */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Reference</th>
                      <th className="px-4 py-3 font-semibold">Project & Client</th>
                      <th className="px-4 py-3 font-semibold">Contract Type</th>
                      <th className="px-4 py-3 font-semibold text-right">Grand Total</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {boqList.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                          No BOQ estimates found. Click "New BOQ" to begin a tender project.
                        </td>
                      </tr>
                    ) : (
                      boqList
                        .filter(b => activeStatusFilter === 'ALL' || b.status === activeStatusFilter)
                        .filter(b => 
                          !searchQuery || 
                          b.boqReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.clientName?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((b) => (
                          <tr key={b.id} className="hover:bg-slate-800/50 transition">
                            <td className="px-4 py-3 font-mono text-amber-400 font-medium">
                              {b.boqReference}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-white">{b.projectName}</div>
                              <div className="text-[11px] text-slate-400">{b.clientName}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                                {b.contractType || 'UNIT_RATE'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                              {formatCurrency(b.grandTotal, b.currency)}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                b.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                b.status === 'PENDING_REVIEW' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                'bg-slate-700/50 text-slate-300 border border-slate-600'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right space-x-2">
                              <button
                                onClick={() => handleOpenBoq(b.id!)}
                                className="px-2.5 py-1 text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg transition"
                              >
                                Edit BOQ
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 2: QS EXECUTIVE DASHBOARD & QUALITY AUDIT (REQUIREMENT 11) */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'qs_dashboard' && (
          <div className="space-y-6">
            
            {/* KPI Executive Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Total Contract Value</p>
                  <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {formatCurrency(currentBoq.grandTotal, currentBoq.currency)}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Direct Cost Estimate</p>
                  <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {formatCurrency(currentBoq.subtotal, currentBoq.currency)}
                  </p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                  <Calculator className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Target Net Profit Margin</p>
                  <p className="text-xl font-bold font-mono text-blue-400 mt-1">
                    {currentBoq.profitPercent}% ({formatCurrency(currentBoq.profitAmount, currentBoq.currency)})
                  </p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Audit Health Score</p>
                  <p className="text-xl font-bold font-mono text-purple-400 mt-1">
                    {qualityAuditResults.healthScore} / 100
                  </p>
                </div>
                <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Quality Audit Engine Panel */}
            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">Automated BOQ Quality Control Audit Engine</h2>
                </div>
                <button
                  onClick={runQualityAudit}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-lg transition flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-Run Audit</span>
                </button>
              </div>

              {qualityAuditResults.warnings.length === 0 ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3 text-emerald-300">
                  <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-sm">Pristine BOQ Quality Detected!</h3>
                    <p className="text-xs text-emerald-400/80">All line items contain valid measurement units, quantities, pricing, and formulas. Ready for tender submission.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">The audit engine detected <span className="text-amber-400 font-bold">{qualityAuditResults.warnings.length}</span> potential risk items requiring Quantity Surveyor attention:</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {qualityAuditResults.warnings.map((w, i) => (
                      <div key={i} className="p-3 bg-slate-900/80 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <div>
                            <span className="font-bold text-amber-300 mr-2">[{w.itemRef}]</span>
                            <span className="text-slate-200">{w.msg}</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[10px] font-semibold">
                          {w.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 3: 7-STAGE BOQ EDITOR                                    */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'editor' && (
          <div className="space-y-6">

            {/* STAGE 1: TENDER SETUP */}
            {editorStage === 'STAGE1_SETUP' && (
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Building2 className="w-5 h-5 text-amber-400" />
                    <span>Stage 1: Tender & Project Setup Information</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Project Name</label>
                    <input
                      type="text"
                      value={currentBoq.projectName}
                      onChange={(e) => setCurrentBoq({ ...currentBoq, projectName: e.target.value })}
                      placeholder="e.g. Douala Port Logistics Facility"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={currentBoq.clientName}
                      onChange={(e) => setCurrentBoq({ ...currentBoq, clientName: e.target.value })}
                      placeholder="e.g. Cameroon Shipping Authority"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Consultant QS Firm</label>
                    <input
                      type="text"
                      value={currentBoq.consultantName}
                      onChange={(e) => setCurrentBoq({ ...currentBoq, consultantName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Contract Type</label>
                    <select
                      value={currentBoq.contractType}
                      onChange={(e) => setCurrentBoq({ ...currentBoq, contractType: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="UNIT_RATE">Unit Rate (Admeasurement)</option>
                      <option value="LUMP_SUM">Lump Sum Fixed Price</option>
                      <option value="COST_PLUS">Cost Plus Fee</option>
                      <option value="DESIGN_BUILD">Design & Build</option>
                      <option value="FIDIC_RED">FIDIC Red Book Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Tender Reference</label>
                    <input
                      type="text"
                      value={currentBoq.tenderReference}
                      onChange={(e) => setCurrentBoq({ ...currentBoq, tenderReference: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Submission Deadline</label>
                    <input
                      type="date"
                      value={currentBoq.submissionDeadline}
                      onChange={(e) => setCurrentBoq({ ...currentBoq, submissionDeadline: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setEditorStage('STAGE2_HIERARCHY')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5"
                  >
                    <span>Proceed to Stage 2: BOQ Hierarchy</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STAGE 2: BOQ HIERARCHY & LINE ITEMS */}
            {editorStage === 'STAGE2_HIERARCHY' && (
              <div className="space-y-6">

                {/* Stage 2 Global Toolbar */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-16 z-30">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => {
                        const count = (currentBoq.sections || []).length + 1;
                        setNewSectionForm({
                          sectionCode: `${count}.0`,
                          title: '',
                          description: '',
                          sectionType: 'Concrete Works',
                          defaultUnit: 'm³',
                          notes: ''
                        });
                        setShowCreateSectionModal(true);
                      }}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow-lg shadow-amber-500/10"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add New Section</span>
                    </button>

                    <button
                      onClick={() => {
                        if ((currentBoq.sections || []).length === 0) {
                          setShowCreateSectionModal(true);
                        } else {
                          handleAddItemToSection(0);
                        }
                      }}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
                    >
                      <FolderPlus className="w-4 h-4 text-amber-400" />
                      <span>+ Add Line Item</span>
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

                    {/* Undo & Redo Controls */}
                    <button
                      disabled={undoStack.length === 0}
                      onClick={handleUndo}
                      title="Undo last change"
                      className={`px-3 py-2 text-xs font-medium rounded-xl border transition flex items-center space-x-1.5 ${
                        undoStack.length > 0
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo</span>
                      {undoStack.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 font-mono text-[10px] rounded-full">
                          {undoStack.length}
                        </span>
                      )}
                    </button>

                    <button
                      disabled={redoStack.length === 0}
                      onClick={handleRedo}
                      title="Redo undone change"
                      className={`px-3 py-2 text-xs font-medium rounded-xl border transition flex items-center space-x-1.5 ${
                        redoStack.length > 0
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                          : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Redo</span>
                      {redoStack.length > 0 && (
                        <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 font-mono text-[10px] rounded-full">
                          {redoStack.length}
                        </span>
                      )}
                    </button>

                    <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

                    {/* Expand/Collapse All */}
                    <button
                      onClick={handleExpandAll}
                      className="px-2.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700/60 transition"
                    >
                      Expand All
                    </button>
                    <button
                      onClick={handleCollapseAll}
                      className="px-2.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700/60 transition"
                    >
                      Collapse All
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Status Filter */}
                    <div className="relative flex items-center">
                      <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                      <select
                        value={sectionFilterStatus}
                        onChange={(e) => setSectionFilterStatus(e.target.value as any)}
                        className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                      >
                        <option value="ACTIVE">Active Sections</option>
                        <option value="ALL">All Sections & Items</option>
                        <option value="ARCHIVED">Archived Items Only</option>
                      </select>
                    </div>

                    {/* Search BOQ */}
                    <div className="relative flex items-center">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
                      <input
                        type="text"
                        placeholder="Search BOQ items..."
                        value={sectionSearchQuery}
                        onChange={(e) => setSectionSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-36 sm:w-48"
                      />
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveBoq}
                      disabled={saving}
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save BOQ'}</span>
                    </button>

                    <div className="text-[11px] text-slate-400 font-mono pl-1">
                      {isDirty ? (
                        <span className="text-amber-400 flex items-center space-x-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                          <span>Unsaved</span>
                        </span>
                      ) : lastSavedAt ? (
                        <span className="text-emerald-400 flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Saved {lastSavedAt}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Synced</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sections List */}
                {(currentBoq.sections || [])
                  .map((sec, secIdx) => ({ sec, secIdx }))
                  .filter(({ sec }) => {
                    const isArch = sec.isArchived || sec.status === 'ARCHIVED';
                    if (sectionFilterStatus === 'ACTIVE' && isArch) return false;
                    if (sectionFilterStatus === 'ARCHIVED' && !isArch) return false;

                    if (!sectionSearchQuery) return true;
                    const q = sectionSearchQuery.toLowerCase();
                    const secMatch = sec.sectionCode.toLowerCase().includes(q) || sec.title.toLowerCase().includes(q) || (sec.description && sec.description.toLowerCase().includes(q));
                    const itemMatch = (sec.items || []).some(
                      it => it.itemNumber.toLowerCase().includes(q) || it.description.toLowerCase().includes(q) || (it.unit && it.unit.toLowerCase().includes(q))
                    );
                    return secMatch || itemMatch;
                  })
                  .map(({ sec, secIdx }) => {
                    const secKey = sec.id || `sec-key-${secIdx}`;
                    const isExpanded = expandedSections[secKey] !== false;
                    const isArchived = sec.isArchived || sec.status === 'ARCHIVED';

                    return (
                      <div key={secKey} className={`bg-slate-800/50 border ${isArchived ? 'border-red-500/30 bg-red-950/10' : 'border-slate-800'} rounded-2xl overflow-hidden shadow-xl transition`}>
                        {/* Section Card Header */}
                        <div className="bg-slate-950/90 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => toggleSectionExpanded(secKey)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>

                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 font-mono font-bold text-xs rounded-lg border border-amber-500/20">
                              {sec.sectionCode}
                            </span>

                            <h3 className="text-sm font-bold text-white">{sec.title}</h3>

                            {sec.sectionType && (
                              <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] font-semibold rounded-md border border-slate-700">
                                {sec.sectionType}
                              </span>
                            )}

                            {sec.status && (
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                                sec.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                sec.status === 'ARCHIVED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                sec.status === 'PENDING_APPROVAL' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                {sec.status}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                              Subtotal: {formatCurrency(sec.subtotal, currentBoq.currency)}
                            </span>

                            <button
                              onClick={() => handleAddItemToSection(secIdx)}
                              className="px-2.5 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg transition flex items-center space-x-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Add Item</span>
                            </button>

                            {/* Section Actions Dropdown */}
                            <div className="relative">
                              <button
                                onClick={() => setOpenSectionMenuIdx(openSectionMenuIdx === secIdx ? null : secIdx)}
                                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg border border-slate-700 transition flex items-center space-x-1"
                              >
                                <span>Actions</span>
                                <ChevronDown className="w-3 h-3" />
                              </button>

                              {openSectionMenuIdx === secIdx && (
                                <div className="absolute right-0 mt-1 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1 text-xs divide-y divide-slate-800">
                                  <div className="py-1">
                                    <button
                                      onClick={() => handleOpenEditSection(secIdx)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                                      <span>Edit Section Details</span>
                                    </button>

                                    <button
                                      onClick={() => handleDuplicateSection(secIdx)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-blue-400" />
                                      <span>Duplicate Section</span>
                                    </button>

                                    <button
                                      onClick={() => handleOpenAddSubsection(secIdx)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
                                    >
                                      <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Add Subsection</span>
                                    </button>

                                    <button
                                      onClick={() => handleOpenSectionApproval(secIdx)}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 flex items-center space-x-2"
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                                      <span>Approval Status</span>
                                    </button>
                                  </div>

                                  <div className="py-1">
                                    <button
                                      disabled={secIdx === 0}
                                      onClick={() => handleMoveSection(secIdx, 'up')}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center space-x-2 disabled:opacity-40"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                      <span>Move Up</span>
                                    </button>

                                    <button
                                      disabled={secIdx === (currentBoq.sections || []).length - 1}
                                      onClick={() => handleMoveSection(secIdx, 'down')}
                                      className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-300 flex items-center space-x-2 disabled:opacity-40"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                      <span>Move Down</span>
                                    </button>
                                  </div>

                                  <div className="py-1">
                                    {isArchived ? (
                                      <button
                                        onClick={() => handleRestoreSection(secIdx)}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-emerald-400 flex items-center space-x-2"
                                      >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Restore Section</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenDeleteSection(secIdx)}
                                        className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-red-400 flex items-center space-x-2"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Delete / Archive</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Subsections Strip */}
                        {isExpanded && sec.subsections && sec.subsections.length > 0 && (
                          <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto text-xs">
                            <span className="text-slate-400 font-semibold text-[11px]">Subsections:</span>
                            {sec.subsections.map((sub, subIdx) => (
                              <span key={sub.id || subIdx} className="px-2 py-0.5 bg-slate-800 text-amber-300 rounded border border-slate-700 font-mono text-[11px]">
                                {sub.code} - {sub.title}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Section Items Table */}
                        {isExpanded && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs text-slate-300">
                              <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                                <tr>
                                  <th className="px-3 py-2">Item No</th>
                                  <th className="px-3 py-2">Description & Spec</th>
                                  <th className="px-3 py-2">Unit</th>
                                  <th className="px-3 py-2 text-right">Quantity</th>
                                  <th className="px-3 py-2 text-right">Unit Rate ({currentBoq.currency})</th>
                                  <th className="px-3 py-2 text-right">Amount ({currentBoq.currency})</th>
                                  <th className="px-3 py-2 text-center">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/40">
                                {(sec.items || [])
                                  .map((item, itemIdx) => ({ item, itemIdx }))
                                  .filter(({ item }) => {
                                    if (sectionFilterStatus === 'ACTIVE' && (item.isArchived || item.status === 'ARCHIVED')) return false;
                                    if (sectionFilterStatus === 'ARCHIVED' && !item.isArchived && item.status !== 'ARCHIVED') return false;
                                    if (!sectionSearchQuery) return true;
                                    const q = sectionSearchQuery.toLowerCase();
                                    return item.itemNumber.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || (item.unit && item.unit.toLowerCase().includes(q));
                                  })
                                  .map(({ item, itemIdx }) => {
                                    const itemKey = item.id || `item-key-${secIdx}-${itemIdx}`;
                                    const isItemArchived = item.isArchived || item.status === 'ARCHIVED';

                                    return (
                                      <tr key={itemKey} className={`hover:bg-slate-800/40 transition ${isItemArchived ? 'opacity-50 bg-red-950/10 line-through' : ''}`}>
                                        <td className="px-3 py-2 font-mono text-amber-400 font-medium">
                                          <input
                                            type="text"
                                            value={item.itemNumber}
                                            onChange={(e) => {
                                              const copy = [...(currentBoq.sections || [])];
                                              copy[secIdx].items[itemIdx].itemNumber = e.target.value;
                                              setCurrentBoq({ ...currentBoq, sections: copy });
                                              setIsDirty(true);
                                            }}
                                            className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-amber-300 font-mono"
                                          />
                                        </td>
                                        <td className="px-3 py-2">
                                          <input
                                            type="text"
                                            value={item.description}
                                            onChange={(e) => {
                                              const copy = [...(currentBoq.sections || [])];
                                              copy[secIdx].items[itemIdx].description = e.target.value;
                                              setCurrentBoq({ ...currentBoq, sections: copy });
                                              setIsDirty(true);
                                            }}
                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                          />
                                        </td>
                                        <td className="px-3 py-2">
                                          <select
                                            value={item.unit}
                                            onChange={(e) => {
                                              if (e.target.value === '__ADD_CUSTOM_UNIT__') {
                                                setShowCustomUnitModal(true);
                                              } else {
                                                const copy = [...(currentBoq.sections || [])];
                                                copy[secIdx].items[itemIdx].unit = e.target.value;
                                                setCurrentBoq({ ...currentBoq, sections: copy });
                                                setIsDirty(true);
                                              }
                                            }}
                                            className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-slate-300 focus:border-amber-500"
                                          >
                                            {UNIT_CATEGORIES.map(cat => (
                                              <optgroup key={cat} label={cat}>
                                                {customUnitsList.filter(u => u.category === cat).map(u => (
                                                  <option key={u.code} value={u.code}>
                                                    {u.code} — {u.name}
                                                  </option>
                                                ))}
                                              </optgroup>
                                            ))}
                                            <optgroup label="Custom Unit">
                                              <option value="__ADD_CUSTOM_UNIT__">+ Add Custom Unit...</option>
                                            </optgroup>
                                          </select>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => {
                                              const copy = [...(currentBoq.sections || [])];
                                              copy[secIdx].items[itemIdx].quantity = parseFloat(e.target.value) || 0;
                                              recalculateBoqState({ ...currentBoq, sections: copy });
                                              setIsDirty(true);
                                            }}
                                            className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white text-right font-mono"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          <input
                                            type="number"
                                            value={item.unitRate}
                                            onChange={(e) => {
                                              const copy = [...(currentBoq.sections || [])];
                                              copy[secIdx].items[itemIdx].unitRate = parseFloat(e.target.value) || 0;
                                              recalculateBoqState({ ...currentBoq, sections: copy });
                                              setIsDirty(true);
                                            }}
                                            className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-400 text-right font-mono font-bold"
                                          />
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono font-bold text-slate-100">
                                          {formatCurrency(item.amount, '')}
                                        </td>
                                        <td className="px-3 py-2 text-center space-x-1">
                                          <button
                                            title="Dimension Sheet"
                                            onClick={() => {
                                              setSelectedItemForDimension({ secIdx, itemIdx });
                                              setEditorStage('STAGE3_MEASUREMENT');
                                            }}
                                            className="p-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded"
                                          >
                                            <Calculator className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            title="Rate Breakdown"
                                            onClick={() => {
                                              setSelectedItemForRateBreakdown({ secIdx, itemIdx });
                                              setEditorStage('STAGE4_RATE_BUILDUP');
                                            }}
                                            className="p-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded"
                                          >
                                            <Sliders className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            title="Duplicate Item"
                                            onClick={() => handleDuplicateItem(secIdx, itemIdx)}
                                            className="p-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            title="Move Item to another section"
                                            onClick={() => handleOpenMoveItem(secIdx, itemIdx)}
                                            className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded"
                                          >
                                            <Move className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            title={isItemArchived ? "Restore Item" : "Archive Item"}
                                            onClick={() => handleArchiveItem(secIdx, itemIdx)}
                                            className="p-1 bg-slate-700 hover:bg-slate-600 text-amber-400 rounded"
                                          >
                                            <Archive className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            title="Delete Item"
                                            onClick={() => handleDeleteItem(secIdx, itemIdx)}
                                            className="p-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
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
                    );
                  })}
              </div>
            )}

            {/* STAGE 3: QUANTITY MEASUREMENT ENGINE (DIMENSION SHEETS) */}
            {editorStage === 'STAGE3_MEASUREMENT' && (
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Calculator className="w-5 h-5 text-amber-400" />
                    <span>Stage 3: Quantity Measurement Engine (Dimension Sheet)</span>
                  </h2>
                </div>

                {selectedItemForDimension === null ? (
                  <p className="text-xs text-slate-400">Please select an item in Stage 2 to open its dimension measurement sheet.</p>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-amber-400 mr-2">
                          Item {currentBoq.sections?.[selectedItemForDimension.secIdx]?.items[selectedItemForDimension.itemIdx]?.itemNumber}
                        </span>
                        <span className="text-xs text-slate-200">
                          {currentBoq.sections?.[selectedItemForDimension.secIdx]?.items[selectedItemForDimension.itemIdx]?.description}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        Calculated Total: {currentBoq.sections?.[selectedItemForDimension.secIdx]?.items[selectedItemForDimension.itemIdx]?.quantity} {currentBoq.sections?.[selectedItemForDimension.secIdx]?.items[selectedItemForDimension.itemIdx]?.unit}
                      </div>
                    </div>

                    {/* Dimension Table */}
                    <div className="overflow-x-auto border border-slate-700 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-300">
                        <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Location / Element</th>
                            <th className="px-3 py-2 text-center">Times (No)</th>
                            <th className="px-3 py-2 text-right">Length (m)</th>
                            <th className="px-3 py-2 text-right">Width (m)</th>
                            <th className="px-3 py-2 text-right">Height/Depth (m)</th>
                            <th className="px-3 py-2 text-right">Result</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(currentBoq.sections?.[selectedItemForDimension.secIdx]?.items[selectedItemForDimension.itemIdx]?.dimensionSheet?.lines || []).map((line, idx) => (
                            <tr key={idx} className="border-t border-slate-800">
                              <td className="px-3 py-2">
                                <input
                                  type="text"
                                  value={line.description}
                                  onChange={(e) => handleUpdateDimensionLine('description', e.target.value, idx)}
                                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                                />
                              </td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  value={line.times}
                                  onChange={(e) => handleUpdateDimensionLine('times', e.target.value, idx)}
                                  className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-white"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  value={line.length}
                                  onChange={(e) => handleUpdateDimensionLine('length', e.target.value, idx)}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-right text-white"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  value={line.width}
                                  onChange={(e) => handleUpdateDimensionLine('width', e.target.value, idx)}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-right text-white"
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  value={line.depth}
                                  onChange={(e) => handleUpdateDimensionLine('depth', e.target.value, idx)}
                                  className="w-20 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-xs text-right text-white"
                                />
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-bold text-amber-400">
                                {line.calculated}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 4: RATE BUILD-UP SYSTEM */}
            {editorStage === 'STAGE4_RATE_BUILDUP' && (
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Sliders className="w-5 h-5 text-amber-400" />
                    <span>Stage 4: Rate Build-Up System & Unit Cost Breakdown</span>
                  </h2>
                </div>

                {selectedItemForRateBreakdown === null ? (
                  <p className="text-xs text-slate-400">Please select an item in Stage 2 to adjust its unit rate build-up.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-amber-400 uppercase">Direct Unit Cost Components</h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Direct Material Cost (XAF/unit)</label>
                        <input
                          type="number"
                          value={currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.rateBreakdown?.materialCost || 0}
                          onChange={(e) => handleUpdateRateBreakdown('materialCost', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Direct Labour Cost (XAF/unit)</label>
                        <input
                          type="number"
                          value={currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.rateBreakdown?.labourCost || 0}
                          onChange={(e) => handleUpdateRateBreakdown('labourCost', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Plant & Equipment Cost (XAF/unit)</label>
                        <input
                          type="number"
                          value={currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.rateBreakdown?.plantCost || 0}
                          onChange={(e) => handleUpdateRateBreakdown('plantCost', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Transport & Logistics (XAF/unit)</label>
                        <input
                          type="number"
                          value={currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.rateBreakdown?.transportCost || 0}
                          onChange={(e) => handleUpdateRateBreakdown('transportCost', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase">Overheads, Wastage & Profit Margin</h3>
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Material Wastage Allowance %</label>
                        <input
                          type="number"
                          value={currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.rateBreakdown?.wastagePercent || 3.5}
                          onChange={(e) => handleUpdateRateBreakdown('wastagePercent', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Site Overheads %</label>
                        <input
                          type="number"
                          value={currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.rateBreakdown?.siteOverheadPercent || 5.0}
                          onChange={(e) => handleUpdateRateBreakdown('siteOverheadPercent', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Target Profit Margin %</label>
                        <input
                          type="number"
                          value={currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.rateBreakdown?.profitPercent || 10.0}
                          onChange={(e) => handleUpdateRateBreakdown('profitPercent', Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>

                      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                        <p className="text-xs text-slate-300">Final Selling Unit Rate:</p>
                        <p className="text-xl font-mono font-bold text-emerald-400 mt-1">
                          {formatCurrency(currentBoq.sections?.[selectedItemForRateBreakdown.secIdx]?.items[selectedItemForRateBreakdown.itemIdx]?.unitRate, currentBoq.currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 5: TENDER ESTIMATE MODE (DUAL PRICING) */}
            {editorStage === 'STAGE5_TENDER_MODE' && (
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-amber-400" />
                    <span>Stage 5: Dual Pricing Mode (Internal Cost vs Client Tender)</span>
                  </h2>

                  <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setCurrentBoq({ ...currentBoq, tenderMode: 'INTERNAL_ESTIMATE' })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        currentBoq.tenderMode === 'INTERNAL_ESTIMATE' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      Internal Cost Estimate
                    </button>
                    <button
                      onClick={() => setCurrentBoq({ ...currentBoq, tenderMode: 'CLIENT_TENDER' })}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                        currentBoq.tenderMode === 'CLIENT_TENDER' ? 'bg-emerald-600 text-white' : 'text-slate-400'
                      }`}
                    >
                      Client Tender BOQ
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-300">
                    {currentBoq.tenderMode === 'INTERNAL_ESTIMATE' ? (
                      <span className="text-amber-400 font-semibold">🔒 Internal View Active: Exposing direct material, labour, equipment costs and company profit margins for internal commercial review.</span>
                    ) : (
                      <span className="text-emerald-400 font-semibold">📄 Client Tender View Active: Displaying final selling rates and public BOQ presentation suitable for tender submission.</span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* STAGE 6: APPROVAL WORKFLOW */}
            {editorStage === 'STAGE6_APPROVAL' && (
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-amber-400" />
                    <span>Stage 6: BOQ Governance & Multi-Level Sign-Off Workflow</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {['Draft Preparation', 'QS Audit Review', 'Commercial Sign-off', 'Director Approval'].map((stepTitle, idx) => (
                    <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400">Step {idx + 1}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      </div>
                      <h3 className="text-xs font-bold text-white">{stepTitle}</h3>
                      <p className="text-[10px] text-slate-400">Status: Approved</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STAGE 7: CONSTRUCTION CONTROL & PAYMENT CERTIFICATES (IPC) */}
            {editorStage === 'STAGE7_CONSTRUCTION_CONTROL' && (
              <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                  <h2 className="text-base font-bold text-white flex items-center space-x-2">
                    <HardHat className="w-5 h-5 text-amber-400" />
                    <span>Stage 7: Post-Contract Construction Control & Interim Payment Certificate (IPC)</span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">Certificate Reference</p>
                    <input
                      type="text"
                      value={ipcForm.ipcNumber}
                      onChange={(e) => setIpcForm({ ...ipcForm, ipcNumber: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-600 rounded mt-1 px-2 py-1 text-xs text-amber-400 font-mono font-bold"
                    />
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">Period Name</p>
                    <input
                      type="text"
                      value={ipcForm.periodName}
                      onChange={(e) => setIpcForm({ ...ipcForm, periodName: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-600 rounded mt-1 px-2 py-1 text-xs text-white"
                    />
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400">Retention Rate %</p>
                    <input
                      type="number"
                      value={ipcForm.retentionPercent}
                      onChange={(e) => setIpcForm({ ...ipcForm, retentionPercent: Number(e.target.value) })}
                      className="w-full bg-slate-800 border border-slate-600 rounded mt-1 px-2 py-1 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-emerald-300">Interim Payment Certificate Ready</h3>
                    <p className="text-xs text-emerald-400/80">Net Amount Payable to Contractor: {formatCurrency(currentBoq.grandTotal * 0.25, currentBoq.currency)}</p>
                  </div>
                  <button
                    onClick={() => { if (showToast) showToast('Generated IPC Valuation Certificate PDF', 'success'); }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow"
                  >
                    Print Certified IPC
                  </button>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 4: REVISIONS & SIDE-BY-SIDE VARIANCE COMPARISON           */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'revisions' && (
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <GitCompare className="w-5 h-5 text-amber-400" />
                <span>BOQ Revision Management & Variance Analysis</span>
              </h2>
            </div>

            <p className="text-xs text-slate-300">
              Current Version: <span className="text-amber-400 font-mono font-bold mr-4">{currentBoq.revisionNumber}</span>
              Track added, deleted, or altered quantities and unit rates across revisions.
            </p>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 5: RESOURCE LIBRARY (REQUIREMENT 4)                      */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'resources' && (
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>Quantity Surveying Resource Library & Rate Master Catalog</span>
              </h2>

              <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setActiveResourceCategory('material')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeResourceCategory === 'material' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Materials
                </button>
                <button
                  onClick={() => setActiveResourceCategory('labour')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeResourceCategory === 'labour' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Labour Trades
                </button>
                <button
                  onClick={() => setActiveResourceCategory('equipment')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                    activeResourceCategory === 'equipment' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
                  }`}
                >
                  Plant & Equipment
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-700 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Code</th>
                    <th className="px-3 py-2">Resource Name</th>
                    <th className="px-3 py-2">Unit</th>
                    <th className="px-3 py-2 text-right">Standard Rate (XAF)</th>
                    <th className="px-3 py-2">Supplier / Trade</th>
                    <th className="px-3 py-2">Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {resourcesList
                    .filter(r => r.type === activeResourceCategory)
                    .map((res) => (
                      <tr key={res.id} className="hover:bg-slate-800/40">
                        <td className="px-3 py-2 font-mono text-amber-400 font-bold">{res.code}</td>
                        <td className="px-3 py-2 font-medium text-white">{res.name}</td>
                        <td className="px-3 py-2 text-slate-400">{res.unit}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
                          {formatCurrency(res.rateXaf, '')}
                        </td>
                        <td className="px-3 py-2 text-slate-300">{res.supplierOrTrade}</td>
                        <td className="px-3 py-2 text-slate-400">{res.region}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* VIEW 6: CERTIFIED REPORTS & EXPORT                             */}
        {/* ------------------------------------------------------------- */}
        {viewMode === 'reports' && (
          <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center space-x-2">
                  <Printer className="w-5 h-5 text-amber-400" />
                  <span>Certified Quantity Surveying Reports & Export Center</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Generate official QS documents, executive summaries, material take-offs, and spreadsheets formatted for tender submission.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Client Tender BOQ PDF */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-amber-400">1. Client Tender BOQ</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">PDF</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Official bill presentation with items, quantities, selling rates and grand total.</p>
                </div>
                <button
                  onClick={handleExportPdf}
                  disabled={generatingPdf}
                  className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>{generatingPdf ? 'Generating PDF...' : 'Download PDF'}</span>
                </button>
              </div>

              {/* 2. Abstract of Cost Excel */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-amber-400">2. Abstract of Cost (Bill Summaries)</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">XLSX</span>
                  </div>
                  <p className="text-[11px] text-slate-300">High-level summary of subtotals per section and trade bill with financial recap sheets.</p>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Excel (.xlsx)</span>
                </button>
              </div>

              {/* 3. Material Take-Off Word */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-amber-400">3. Material Take-Off Summary</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold">DOCX</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Calculated totals for cement bags, sand m³, steel tons, and block count formatted for Word.</p>
                </div>
                <button
                  onClick={handleExportDocx}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Word (.docx)</span>
                </button>
              </div>

              {/* 4. Raw Quantities Master Data CSV */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-amber-400">4. Raw Quantities Master Data</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">CSV</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Complete itemized dataset export ready for import into ERP and estimation software.</p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* 5. Detailed Rate Build-Up Breakdown */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-amber-400">5. Rate Analysis & Cost Justification</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">XLSX</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Full breakdown of material, labour, plant, wastage, and profit margins per item.</p>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Rate Justification</span>
                </button>
              </div>

              {/* 6. Comprehensive QS Project Package */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-xs font-bold text-amber-400">6. Complete Certified QS Package</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">ALL</span>
                  </div>
                  <p className="text-[11px] text-slate-300">Download PDF, Excel, and Word reports in one click for tender submission.</p>
                </div>
                <button
                  onClick={async () => {
                    await handleExportPdf();
                    handleExportExcel();
                    await handleExportDocx();
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 font-extrabold text-xs rounded-lg transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Full QS Package</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MODALS SECTION FOR BOQ SECTION & ITEM MANAGEMENT             */}
        {/* ============================================================= */}

        {/* 1. Create New Section Modal */}
        {showCreateSectionModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <FolderPlus className="w-5 h-5 text-amber-400" />
                  <span>Create New BOQ Work Section</span>
                </h3>
                <button
                  onClick={() => setShowCreateSectionModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Section Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. 1.0 or SEC-01"
                      value={newSectionForm.sectionCode}
                      onChange={(e) => setNewSectionForm({ ...newSectionForm, sectionCode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Section Category</label>
                    <select
                      value={newSectionForm.sectionType}
                      onChange={(e) => setNewSectionForm({ ...newSectionForm, sectionType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      {SECTION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Section Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Earthworks, Site Clearance & Excavation"
                    value={newSectionForm.title}
                    onChange={(e) => setNewSectionForm({ ...newSectionForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Scope & Specification Summary</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of work scope included in this section..."
                    value={newSectionForm.description}
                    onChange={(e) => setNewSectionForm({ ...newSectionForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Default Unit</label>
                    <select
                      value={newSectionForm.defaultUnit}
                      onChange={(e) => setNewSectionForm({ ...newSectionForm, defaultUnit: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                    >
                      {COMPREHENSIVE_UNITS.map(u => (
                        <option key={u.code} value={u.code}>{u.code} — {u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Internal Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Subcontractor package SEC-A"
                      value={newSectionForm.notes}
                      onChange={(e) => setNewSectionForm({ ...newSectionForm, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowCreateSectionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSectionSubmit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center space-x-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Section</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. Edit Section Modal */}
        {showEditSectionModal && editingSecIdx !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  <span>Edit Section Details</span>
                </h3>
                <button
                  onClick={() => setShowEditSectionModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Section Code *</label>
                    <input
                      type="text"
                      value={editSectionForm.sectionCode}
                      onChange={(e) => setEditSectionForm({ ...editSectionForm, sectionCode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Section Category</label>
                    <select
                      value={editSectionForm.sectionType}
                      onChange={(e) => setEditSectionForm({ ...editSectionForm, sectionType: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200"
                    >
                      {SECTION_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Section Title *</label>
                  <input
                    type="text"
                    value={editSectionForm.title}
                    onChange={(e) => setEditSectionForm({ ...editSectionForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editSectionForm.description}
                    onChange={(e) => setEditSectionForm({ ...editSectionForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowEditSectionModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditSectionSubmit}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                >
                  Save Section Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. Delete / Archive Section Modal */}
        {showDeleteSectionModal && deletingSecIdx !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
              <div className="flex items-center space-x-3 text-red-400">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <h3 className="text-base font-bold text-white">Confirm Section Removal</h3>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                You are about to remove <span className="font-bold text-amber-300">Section {currentBoq.sections?.[deletingSecIdx]?.sectionCode} — {currentBoq.sections?.[deletingSecIdx]?.title}</span> containing <span className="font-bold text-white">{(currentBoq.sections?.[deletingSecIdx]?.items || []).length}</span> line items.
              </p>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs space-y-2">
                <p className="text-slate-400 font-medium">Choose action:</p>
                <div className="text-slate-300 space-y-1">
                  <div>• <strong className="text-amber-400">Archive Section:</strong> Retains section data, hides items from totals, allows restore.</div>
                  <div>• <strong className="text-red-400">Permanent Delete:</strong> Removes section completely from database state.</div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowDeleteSectionModal(false)}
                  className="px-3.5 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmDeleteSection(false)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs rounded-xl font-bold"
                >
                  Archive Section
                </button>
                <button
                  onClick={() => handleConfirmDeleteSection(true)}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-xl font-bold"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. Add Subsection Modal */}
        {showAddSubsectionModal && targetSecIdxForSub !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <FolderPlus className="w-4 h-4 text-emerald-400" />
                  <span>Add Subsection to {currentBoq.sections?.[targetSecIdxForSub]?.sectionCode}</span>
                </h3>
                <button onClick={() => setShowAddSubsectionModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Subsection Code</label>
                  <input
                    type="text"
                    value={subsectionForm.code}
                    onChange={(e) => setSubsectionForm({ ...subsectionForm, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Subsection Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Substructure Foundations"
                    value={subsectionForm.title}
                    onChange={(e) => setSubsectionForm({ ...subsectionForm, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowAddSubsectionModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubsectionSubmit}
                  className="px-3.5 py-1.5 bg-emerald-500 text-slate-950 text-xs rounded-lg font-bold hover:bg-emerald-400"
                >
                  Add Subsection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Move Item to Section Modal */}
        {showMoveItemModal && itemToMoveLocation !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Move className="w-4 h-4 text-amber-400" />
                <span>Move Item to Different Section</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Select Destination Section:</label>
                  <select
                    value={targetMoveSecIdx}
                    onChange={(e) => setTargetMoveSecIdx(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {(currentBoq.sections || []).map((sec, idx) => (
                      <option key={sec.id || idx} value={idx}>
                        Section {sec.sectionCode} — {sec.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
                <button
                  onClick={() => setShowMoveItemModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMoveItemSubmit}
                  className="px-3.5 py-1.5 bg-amber-500 text-slate-950 text-xs rounded-lg font-bold"
                >
                  Confirm Move
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 6. Section Approval Modal */}
        {showSectionApprovalModal && approvingSecIdx !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Update Section Approval Status</span>
              </h3>

              <p className="text-xs text-slate-300">
                Set status for Section <span className="font-bold text-amber-300">{currentBoq.sections?.[approvingSecIdx]?.sectionCode}</span>:
              </p>

              <select
                value={approvalStatusChoice}
                onChange={(e) => setApprovalStatusChoice(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="DRAFT">DRAFT — In Preparation</option>
                <option value="IN_REVIEW">IN_REVIEW — Internal QS Checking</option>
                <option value="PENDING_APPROVAL">PENDING_APPROVAL — Submitted for Client Review</option>
                <option value="APPROVED">APPROVED — Certified & Locked</option>
                <option value="REJECTED">REJECTED — Revision Requested</option>
              </select>

              <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
                <button onClick={() => setShowSectionApprovalModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg">
                  Cancel
                </button>
                <button onClick={handleSectionApprovalSubmit} className="px-3.5 py-1.5 bg-purple-600 text-white text-xs rounded-lg font-bold">
                  Update Status
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 7. Add Custom Unit Modal */}
        {showCustomUnitModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Create Custom Measurement Unit</span>
                </h3>
                <button onClick={() => setShowCustomUnitModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Unit Symbol / Code *</label>
                    <input
                      type="text"
                      placeholder="e.g. m³, kg, ton, trip"
                      value={customUnitForm.code}
                      onChange={(e) => setCustomUnitForm({ ...customUnitForm, code: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                    <select
                      value={customUnitForm.category}
                      onChange={(e) => setCustomUnitForm({ ...customUnitForm, category: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    >
                      {UNIT_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Full Unit Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Cubic Metre, Metric Tonne"
                    value={customUnitForm.name}
                    onChange={(e) => setCustomUnitForm({ ...customUnitForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Description / Standard Definition</label>
                  <input
                    type="text"
                    placeholder="e.g. SMM7 / NRM2 Standard Volume Measurement"
                    value={customUnitForm.description}
                    onChange={(e) => setCustomUnitForm({ ...customUnitForm, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-300"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-800 pt-3">
                <button onClick={() => setShowCustomUnitModal(false)} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg">
                  Cancel
                </button>
                <button onClick={handleAddCustomUnitSubmit} className="px-3.5 py-1.5 bg-amber-500 text-slate-950 text-xs rounded-lg font-bold">
                  Save Unit to Library
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
