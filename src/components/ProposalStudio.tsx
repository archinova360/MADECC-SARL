import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import {
  generateProposalPdf,
  generateProposalDocx,
  generateProposalCsv
} from '../utils/proposalExport.ts';
import { 
  FileText, Plus, Save, Copy, Trash2, Archive, RotateCcw, Share2, Download, Printer, 
  Edit3, Check, Search, Filter, Shield, User, Clock, Building2, HardHat, DollarSign, 
  Calendar, Eye, Sparkles, AlertTriangle, FileSpreadsheet, RefreshCw, Send, CheckCircle2, 
  XCircle, Sliders, Settings, Award, Layers, Globe, Mail, ChevronRight, DownloadCloud,
  ArrowRight, FileType
} from 'lucide-react';
import ProposalDashboard from './ProposalDashboard.tsx';
import { fetchUserSyncData, saveUserSyncData } from '../lib/syncService.ts';

// =========================================================================
// TYPES & SCHEMAS
// =========================================================================
export interface ProposalItem {
  id: string;
  item: string;
  description: string;
  unit: string;
  qty: number;
  rate: number;
  total: number;
}

export interface SchedulePhase {
  id: string;
  phase: string;
  duration: string;
  dates: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  description: string;
}

export interface RiskItem {
  id: string;
  description: string;
  probability: 'Low' | 'Medium' | 'High';
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
  severity: 'Low' | 'Medium' | 'High';
  mitigation: string;
  responsibility: string;
}

export interface PaymentMilestone {
  id: string;
  milestone: string;
  percentage: number;
  amount: number;
  triggerEvent: string;
}

export interface ProposalSection {
  id: string;
  title: string;
  content: string;
}

export interface Proposal {
  id: string;
  title: string;
  templateType: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Archived';
  version: string;
  projectValue: number;
  currency: string;
  clientName: string;
  clientContact: string;
  location: string;
  sections: ProposalSection[];
  boq: ProposalItem[];
  schedule: SchedulePhase[];
  risks: RiskItem[];
  paymentSchedule: PaymentMilestone[];
  watermark: 'NONE' | 'CONFIDENTIAL' | 'DRAFT' | 'APPROVED' | 'URGENT';
  brandingColor: 'steel' | 'gold' | 'emerald' | 'crimson';
  createdAt: string;
  updatedAt: string;
  signatureImage?: string;
  showStamp?: boolean;
}

// =========================================================================
// 20 TEMPLATES DEFINITION & SECTIONS GENERATION
// =========================================================================
export const TEMPLATES = [
  { id: 'building', label: 'Building Construction Proposal', category: 'Infrastructure' },
  { id: 'road', label: 'Road Construction Proposal', category: 'Infrastructure' },
  { id: 'bridge', label: 'Bridge Construction Proposal', category: 'Infrastructure' },
  { id: 'civil', label: 'Civil Engineering Proposal', category: 'Technical' },
  { id: 'architectural', label: 'Architectural Design Proposal', category: 'Technical' },
  { id: 'renovation', label: 'Renovation Proposal', category: 'SME' },
  { id: 'maintenance', label: 'Maintenance Agreement', category: 'SME' },
  { id: 'plumbing', label: 'Plumbing Works Proposal', category: 'SME' },
  { id: 'electrical', label: 'Electrical Installation Proposal', category: 'SME' },
  { id: 'solar', label: 'Solar Power Integration Proposal', category: 'Energy' },
  { id: 'water', label: 'Water Supply Network Proposal', category: 'Energy' },
  { id: 'borehole', label: 'Borehole Construction Proposal', category: 'Energy' },
  { id: 'school', label: 'School Construction Proposal', category: 'Social' },
  { id: 'hospital', label: 'Hospital Infrastructure Proposal', category: 'Social' },
  { id: 'hotel', label: 'Hotel & Hospitality Proposal', category: 'Commercial' },
  { id: 'industrial', label: 'Industrial Construction Proposal', category: 'Commercial' },
  { id: 'commercial', label: 'Commercial Complex Proposal', category: 'Commercial' },
  { id: 'residential', label: 'Residential Estate Proposal', category: 'Commercial' },
  { id: 'gov-tender', label: 'Government Tender Proposal', category: 'Tender' },
  { id: 'intl-tender', label: 'International Tender (FIDIC)', category: 'Tender' }
];

export const SECTION_NAMES = [
  { id: 'cover', title: 'Cover Page' },
  { id: 'logo', title: 'Company Logo & Identity' },
  { id: 'profile', title: 'Company Profile' },
  { id: 'exec-summary', title: 'Executive Summary' },
  { id: 'client-info', title: 'Client Information' },
  { id: 'background', title: 'Project Background' },
  { id: 'scope', title: 'Project Scope of Works' },
  { id: 'objectives', title: 'Project Objectives' },
  { id: 'deliverables', title: 'Key Deliverables' },
  { id: 'methodology', title: 'Technical Methodology' },
  { id: 'schedule-notes', title: 'Construction Schedule Notes' },
  { id: 'materials', title: 'Material Specifications' },
  { id: 'equipment', title: 'Heavy Equipment Allocation' },
  { id: 'hr', title: 'Human Resources & Project Organogram' },
  { id: 'hse', title: 'Health, Safety & Environment (HSE) Plan' },
  { id: 'environmental', title: 'Environmental Management Plan' },
  { id: 'qa', title: 'Quality Assurance & Control Plan' },
  { id: 'risk-notes', title: 'Risk Assessment Summary' },
  { id: 'terms', title: 'Terms, Conditions & Legal Framework' },
  { id: 'warranty', title: 'Structural & Material Warranty' },
  { id: 'team', title: 'Proposed Project Team Profiles' },
  { id: 'references', title: 'Past Projects & Client References' },
  { id: 'appendices', title: 'Appendices & Supporting Drawings' },
  { id: 'signoff-terms', title: 'Agreement Execution Signoff' }
];

const generateProposalSections = (templateType: string, companyName: string, clientName: string, value: string, location: string): ProposalSection[] => {
  const label = TEMPLATES.find(t => t.id === templateType)?.label || 'General Construction Proposal';
  
  return SECTION_NAMES.map(s => {
    let content = '';
    switch (s.id) {
      case 'cover':
        content = `# TECHNICAL & COMMERCIAL PROPOSAL\n\n## FOR THE EXECUTION OF: ${label.toUpperCase()}\n\n**PROPOSED FOR:** ${clientName}\n**PREPARED BY:** ${companyName}\n**PROJECT LOCATION:** ${location}\n**PROPOSAL VALUE:** ${value}\n**DATE OF ISSUANCE:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n**CONFIDENTIALITY LEVEL:** Strictly Confidential / Tender Grade`;
        break;
      case 'logo':
        content = `### BRANDING REPRESENTATION\n\nThis document is issued under the executive authority of **${companyName}**.\n\n- **Primary Colors:** ${companyName} Blue / Charcoal Accent\n- **Notary Seal Status:** Verified\n- **Filing ID:** MADECC-PROP-${Math.floor(1000 + Math.random() * 9000)}`;
        break;
      case 'profile':
        content = `### COMPANY PROFILE & PREQUALIFICATION\n\n**${companyName}** is a leading multi-disciplinary construction, civil engineering, and infrastructure group operating everywhere in Cameroon and across Africa. With decades of cumulative engineering experience, we deliver state-of-the-art residential, commercial, road, and water supply solutions.\n\n- **Head Office:** Yaoundé Mbankolo, Cameroon (Operating Nationwide & Across Africa)\n- **License Category:** Class A Civil Engineering Contractor\n- **Compliance Standards:** ISO 9001 (Quality), ISO 14001 (Environment), OHSAS 18001 (Safety)\n- **Core Engineering Fields:** Earthworks, Structural Engineering, Solar/MEP grids, Hydraulic boreholes.`;
        break;
      case 'exec-summary':
        content = `### EXECUTIVE SUMMARY\n\nWe are honored to submit this comprehensive proposal for the **${label}** in **${location}** for our esteemed client, **${clientName}**.\n\nThis proposal outlines an optimal technical strategy engineered specifically for the local geological, mechanical, and logistical realities. Backed by a project valuation of **${value}**, **${companyName}** guarantees structural integrity, zero-accident HSE compliance, and a streamlined construction schedule designed to mitigate price fluctuations and rainy season delays in Cameroon.`;
        break;
      case 'client-info':
        content = `### CLIENT SPECIFICATION OVERVIEW\n\n- **Client Entity:** ${clientName}\n- **Primary Representative:** Contracting and Infrastructure Procurement Commission\n- **Contact Channel:** Professional Tender Registry / Official Client Email\n- **Delivery Address:** ${location}\n- **Funding Status:** Fully Appropriated / Project Budget of ${value}`;
        break;
      case 'background':
        content = `### PROJECT BACKGROUND & CONTEXT\n\nThe demand for modern infrastructure in **${location}** requires a robust, long-lasting construction approach. Geotechnical variables, traffic loading models, and environmental stressors mandate an engineering team that understands regional geology and material chemistry. This project will execute the required ${label.toLowerCase()} milestones, establishing a legacy of safe and sustainable municipal development.`;
        break;
      case 'scope':
        content = `### PROJECT SCOPE OF WORKS\n\nThe scope of civil engineering and construction works for this project is divided into distinct, measurable units:\n\n1. **Mobilization & Preliminary Studies:** Geotechnical investigation, surveying, site clearance, and temporary structures erection.\n2. **Structural Excavation & Substructure:** Earthworks, foundations, pouring reinforced concrete pads, and curing.\n3. **Superstructure & Infrastructure Installation:** Masonry, roofing, solar grid deployment, high-grade plumbing, and finishing.\n4. **Quality Auditing & Handover:** Comprehensive mechanical testing, hydrostatic pressure tests, electrical safety commissioning, and official ribbon-cutting ceremony.`;
        break;
      case 'objectives':
        content = `### PROJECT OBJECTIVES\n\n- **Structural Lifespan:** Guarantee a minimum structural stability of 50+ years, complying with the Decennial Structural Guarantee (Garantie Décennale).\n- **Schedule Discipline:** Complete all active structural works within the requested window, avoiding rain-induced construction standstills.\n- **HSE Excellence:** Maintain a strict zero-accident index through regular audits, site fencing, and daily safety briefings.\n- **Sustainability:** Source at least 70% of concrete aggregates, sand, and labor locally to stimulate the regional economy.`;
      case 'deliverables':
        content = `### COMPREHENSIVE DELIVERABLES LIST\n\nUpon project completion, **${companyName}** shall hand over the following assets and documentation to **${clientName}**:\n\n1. **Completed Physical Assets:** The fully constructed structure/network ready for immediate operation.\n2. **As-Built Engineering Drawings:** Detailed architectural, structural, and MEP layouts showing exact piping and solar grids.\n3. **Technical Commissioning Reports:** Concrete strength compression curves, pressure testing records, and electrical line balance tests.\n4. **Maintenance Manuals & Warranty Cards:** Documented guidelines for solar panels, borehole pumps, and structure care.`;
        break;
      case 'methodology':
        content = `### TECHNICAL METHODOLOGY\n\nOur execution strategy for this **${label}** is based on international civil engineering codes (Eurocodes, BAEL 91, and British Standards):\n\n1. **Geotechnical Validation:** Conducting dynamic penetrometer and core drills to verify soil bearing capacity before concrete casting.\n2. **Concrete Quality Control:** Mixing Portland cement grade CPJ-35 with strictly graded local basalt gravel, using continuous slump tests (Abrams cone).\n3. **Heavy Machinery Optimization:** Deploying high-efficiency CAT excavators, concrete batching plants, and vibratory compactors.\n4. **Environmental Mitigation:** Utilizing silt fences to prevent topsoil erosion during excavation, and implementing safe debris disposal.`;
        break;
      case 'schedule-notes':
        content = `### CONSTRUCTION SCHEDULE NOTES\n\nThe detailed construction phases are tabulated in our core timeline database. Our timeline incorporates a 15-day buffer specifically for Cameroon's heavy rainy season, during which earthworks are suspended and internal masonry or wiring works are prioritized. Weekly Gantt chart reviews will be shared with the client's supervisory engineer.`;
        break;
      case 'materials':
        content = `### MATERIAL SPECIFICATIONS\n\nAll construction materials utilized on this project will meet certified international standards:\n\n- **Reinforcement Steel:** High-adherence (HA) rebars, FeE400/FeE500 structural grade.\n- **Cement Matrix:** Portland Cement CPJ-35, CPJ-45 (for load-bearing foundations).\n- **Pipes & Tubing:** High-Density Polyethylene (HDPE) Class PN16 for water supply; PVC pressure class for drainage.\n- **Solar Infrastructure:** Monocrystalline PV panels (minimum 450W, 22% efficiency) paired with industrial hybrid pure sine wave inverters.`;
        break;
      case 'equipment':
        content = `### HEAVY MACHINERY & EQUIPMENT LIST\n\n**${companyName}** will mobilize the following owned equipment to the project site:\n\n1. Excavator CAT 320D (1 Unit) - For earthworks and deep foundation excavation.\n2. Vibratory Soil Compactor Dynapac (1 Unit) - For base soil preparation.\n3. Mobile Concrete Batching Plant (1 Unit) - To guarantee homogeneous mixing on site.\n4. Mercedes-Benz Dump Trucks 10m³ (3 Units) - For material hauling and debris disposal.\n5. Solar Borehole Drilling Rig (1 Unit, if applicable) - For plumbing and local water supply works.`;
        break;
      case 'hr':
        content = `### HUMAN RESOURCES & ORGANOGRAM\n\nThe site hierarchy will ensure direct accountability, technical expertise, and absolute safety compliance:\n\n- **Project Director:** Senior Civil Engineer (20+ years experience, FIDIC Certified).\n- **Site Engineer:** Resident Structural Engineer (10+ years, oversees daily pours).\n- **HSE Supervisor:** Dedicated Safety Officer on site at all times.\n- **Q&A Auditor:** Independent testing engineer verifying material specifications.`;
        break;
      case 'hse':
        content = `### HEALTH, SAFETY & ENVIRONMENT (HSE) PLAN\n\nSafety is our absolute priority. We operate under a **Zero Harm Policy**:\n\n- **Mandatory PPE:** High-visibility vests, steel-toed boots, hard hats, and safety harnesses are required for all personnel on site.\n- **Daily TBT (Toolbox Talks):** 10-minute safety briefings held before starting any site work.\n- **First Aid Station:** Fully equipped medical box with a trained safety warden stationed on-site.\n- **Emergency Protocols:** Explicit muster points and immediate transport plans to the nearest regional hospital.`;
        break;
      case 'environmental':
        content = `### ENVIRONMENTAL MANAGEMENT PLAN\n\nWe recognize our ecological responsibility. This project is compliant with Cameroon MINEPDED guidelines:\n\n- **Debris Disposal:** All construction rubbish and excavated soil will be hauled to accredited municipal waste sites.\n- **Noise Mitigation:** Heavy machine operations will be restricted to daylight hours (07:30 to 18:00) to respect local residential zones.\n- **Erosion Prevention:** Temporary drainage channels will be dug to divert stormwater and protect local riverways from concrete runoff.`;
        break;
      case 'qa':
        content = `### QUALITY ASSURANCE & QUALITY CONTROL (QA/QC)\n\nOur quality framework ensures that "what is designed is what is built":\n\n- **Cube Tests:** Concrete casting samples taken daily, cured in water, and tested at 7, 14, and 28 days for compressive strength (minimum 25 MPa).\n- **Density Checks:** Sand-replacement density tests on subgrades to guarantee 95% Modified Proctor Compaction.\n- **Material Auditing:** Rejection of any steel or aggregates showing degradation, rust, or incorrect grading.`;
        break;
      case 'risk-notes':
        content = `### RISK ASSESSMENT EXPLANATORY INDEX\n\nOur project team has audited the potential physical, geographical, and fiscal hazards. Risk responses have been formulated in our risk registry, outlining specific engineering contingencies (such as stockpiling cement before price adjustments and deploying pumps for unforeseen heavy rainfall).`;
        break;
      case 'terms':
        content = `### TERMS, CONDITIONS & LEGAL FRAMEWORK\n\n- **Contract Standard:** Governed by FIDIC Short Form of Contract / Standard Red Book conditions.\n- **Legal Forum:** Headed under the exclusive jurisdiction of the Commercial Court of Cameroon.\n- **Invoicing terms:** Payments must be made within 15 working days following the issuance of an approved Engineer's Certificate of Work (Attachement).`;
        break;
      case 'warranty':
        content = `### WARRANTY & GUARANTEE OF WORKS\n\nWe provide an ironclad structural and operational guarantee:\n\n- **Decennial Structural Guarantee:** Full ten (10) year insurance coverage on the main concrete and steel structure.\n- **Operational Warranty:** Twelve (12) months warranty on mechanical, plumbing, electrical, and solar equipment installed.\n- **Defects Liability Period (DLP):** Six (6) months maintenance period where we rectify any minor surface paint or aesthetic defects immediately free of charge.`;
        break;
      case 'team':
        content = `### CERTIFIED ENGINEERING EXECUTIVES\n\n1. **Dr. Amadou Bello, Ph.D.** - Structural Architect & Lead Consultant (Cameroon Order of Civil Engineers - ONIGC #4321).\n2. **Eng. Christian Tchoutouo** - Project Director (Expert in heavy foundations & soil mechanics, 18 years in public works).\n3. **Sarah Ngu** - HSE Specialist (NEBOSH certified, safety manager for large-scale mining installations).`;
        break;
      case 'references':
        content = `### PROVEN HISTORIC PERFORMANCE\n\n**${companyName}** has completed similar state-grade infrastructure agreements:\n\n- **Project Alpha:** Multi-storey Commercial Complex, Yaoundé. (Value: 1.2 Billion FCFA - 100% completed, zero defects).\n- **Project Beta:** High-Capacity Borehole & Water Grid, Bamenda. (Value: 350 Million FCFA - Completed 1 month ahead of schedule).\n- **Project Gamma:** Solar Grid Hybrid Integration, Douala Industrial Zone. (Value: 600 Million FCFA - Commissioned with 99.8% uptime).`;
        break;
      case 'appendices':
        content = `### TECHNICAL APPENDICES\n\n- **Appendix A:** Complete Geotechnical Soil Testing Report (Laboratoire National de Génie Civil - LABOGENIE).\n- **Appendix B:** Conceptual Architectural CAD drawings & Layout Blueprints.\n- **Appendix C:** Material safety data sheets (MSDS) for cement composites.`;
        break;
      case 'signoff-terms':
        content = `### AGREEMENT SIGNATURE & STAMP BLOCK\n\nBy signing below, the Client and Contractor formally accept the terms, specifications, and BOQ values outlined in this document.\n\n- **On behalf of the Contractor:** Authorized Executive Director, ${companyName}\n- **On behalf of the Client:** Authorized Representative, ${clientName}\n\n**Authorized Compliance Stamp:** MADECC Group Enterprise Ledger Verified`;
        break;
      default:
        content = `### ${s.title}\n\nGeneric placeholder content for section: ${s.title}.`;
    }
    return { id: s.id, title: s.title, content };
  });
};

const getInitialBOQ = (): ProposalItem[] => [
  { id: "1", item: "1.1", description: "Geotechnical investigation & topographic mapping", unit: "LS", qty: 1, rate: 1500000, total: 1500000 },
  { id: "2", item: "1.2", description: "Heavy excavation, site clearing & levelling (Excavator CAT 320D)", unit: "m³", qty: 1200, rate: 7500, total: 9000000 },
  { id: "3", item: "1.3", description: "Reinforced concrete foundation pads & curing (HA Steel, Portland CPJ-35)", unit: "m³", qty: 250, rate: 195000, total: 48750000 },
  { id: "4", item: "1.4", description: "High-grade structural hollow concrete blocks laying (20x20x40)", unit: "m²", qty: 1800, rate: 21500, total: 38700000 },
  { id: "5", item: "1.5", description: "Solar grid integration - 25kVA hybrid monocrystalline panel assembly", unit: "Set", qty: 1, rate: 14500000, total: 14500000 },
  { id: "6", item: "1.6", description: "Plumbing, drainage and deep solar-powered borehole drilling", unit: "LS", qty: 1, rate: 11000000, total: 11000000 },
  { id: "7", item: "1.7", description: "HSE safety fencing, signage & worker PPE allocation", unit: "LS", qty: 1, rate: 3500000, total: 3500000 }
];

const getInitialSchedule = (): SchedulePhase[] => [
  { id: "t1", phase: "Mobilization & Geotechnical Testing", duration: "10 Days", dates: "Days 1 - 10", status: "Pending", description: "Halt site access, map topography, conduct LABOGENIE soil mechanical drills, mobilize excavators." },
  { id: "t2", phase: "Excavation & Substructure Pours", duration: "25 Days", dates: "Days 11 - 35", status: "Pending", description: "Dig foundation pits, lay HA rebars grid, blend and pour CPJ-45 structural foundation concrete." },
  { id: "t3", phase: "Superstructure Masonry & MEP", duration: "35 Days", dates: "Days 36 - 70", status: "Pending", description: "Erect structural brick walls, lay plumbing lines, install electrical conduit pipes, complete roofing." },
  { id: "t4", phase: "Technical Equipment & Solar Grid", duration: "15 Days", dates: "Days 71 - 85", status: "Pending", description: "Assemble monocrystalline solar arrays, mount hybrid inverter, drill and test high-depth borehole water." },
  { id: "t5", phase: "Finishing & Handover Commissioning", duration: "15 Days", dates: "Days 86 - 100", status: "Pending", description: "Plastering, painting, execute concrete cylinder compression testing, hand over complete as-built documentation." }
];

const getInitialRisks = (): RiskItem[] => [
  { id: "r1", description: "Heavy torrential rainfall during earthworks", probability: "High", impact: "Medium", severity: "High", mitigation: "Schedule major excavating in dry spell; establish dynamic gas site dewatering pumps.", responsibility: "Project Engineer" },
  { id: "r2", description: "National inflation on imported rebar steel", probability: "Medium", impact: "High", severity: "High", mitigation: "Secure supply contract upfront with local structural steel foundries in Douala.", responsibility: "Procurement Lead" },
  { id: "r3", description: "Potential worker falls from scaffolding heights", probability: "Low", impact: "Critical", severity: "Medium", mitigation: "Mandatory safety harnesses, scaffolding inspection certificates, daily HSE briefings.", responsibility: "HSE Inspector" }
];

const getInitialPaymentMilestones = (totalVal: number): PaymentMilestone[] => [
  { id: "m1", milestone: "Initial Mobilization Deposit", percentage: 30, amount: totalVal * 0.3, triggerEvent: "Upon formal signing of contract agreement and security bonds submission." },
  { id: "m2", milestone: "Substructure & Foundation Signoff", percentage: 40, amount: totalVal * 0.4, triggerEvent: "Upon approved engineer inspection of concrete cylinder core compression results." },
  { id: "m3", milestone: "MEP & Finishing Commissioning", percentage: 20, amount: totalVal * 0.2, triggerEvent: "Upon complete integration of plumbing networks, hybrid solar batteries, and roofing." },
  { id: "m4", milestone: "Defects Liability Release", percentage: 10, amount: totalVal * 0.1, triggerEvent: "Six months following complete handover of fully functional keys." }
];

const DEFAULT_PROPOSALS: Proposal[] = [
  {
    id: "prop-madecc-001",
    title: "Primary School Complex Construction Proposal",
    templateType: "school",
    status: "Draft",
    version: "v1.0.0",
    projectValue: 126950000,
    currency: "FCFA",
    clientName: "Cameroon Ministry of Basic Education",
    clientContact: "mbeducation.gov@gmail.com",
    location: "Yaoundé, Cameroon",
    sections: generateProposalSections("school", "MADECC Group", "Cameroon Ministry of Basic Education", "126,950,000 FCFA", "Yaoundé, Cameroon"),
    boq: getInitialBOQ(),
    schedule: getInitialSchedule(),
    risks: getInitialRisks(),
    paymentSchedule: getInitialPaymentMilestones(126950000),
    watermark: "DRAFT",
    brandingColor: "steel",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    showStamp: true
  },
  {
    id: "prop-madecc-002",
    title: "Solar Water Borehole & Grid Proposal",
    templateType: "solar",
    status: "Approved",
    version: "v1.1.0",
    projectValue: 35000000,
    currency: "FCFA",
    clientName: "Douala Municipal Water Authority",
    clientContact: "muni-water@douala.cm",
    location: "Douala, Cameroon",
    sections: generateProposalSections("solar", "MADECC Group", "Douala Municipal Water Authority", "35,000,000 FCFA", "Douala, Cameroon"),
    boq: getInitialBOQ().slice(4),
    schedule: getInitialSchedule().slice(2),
    risks: getInitialRisks(),
    paymentSchedule: getInitialPaymentMilestones(35000000),
    watermark: "APPROVED",
    brandingColor: "emerald",
    createdAt: new Date(Date.now() - 500000000).toISOString(),
    updatedAt: new Date().toISOString(),
    showStamp: true
  }
];

// =========================================================================
// MAIN PROPOSAL STUDIO COMPONENT
// =========================================================================
export default function ProposalStudio({ 
  showToast,
  setActiveAdminTab
}: { 
  showToast: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  setActiveAdminTab?: (tab: any) => void;
}) {
  // --- STATE ---
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('cover');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [templateFilter, setTemplateFilter] = useState<string>('ALL');
  
  // Dashboard Metrics
  const [stats, setStats] = useState({
    total: 0, drafts: 0, submitted: 0, approved: 0, rejected: 0, archived: 0, winRate: 0, revenue: 0
  });

  // Editor states
  const [activeSectionContent, setActiveSectionContent] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Manager' | 'Engineer' | 'Estimator' | 'Accountant' | 'Viewer'>('Admin');
  
  // AI Panel states
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Signature canvas state
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Version History list
  const [versionHistory, setVersionHistory] = useState<{ timestamp: string; version: string; title: string; sections: ProposalSection[] }[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<{ id: string; action: string; timestamp: string; user: string }[]>([]);

  // --- SYNC DATABASE ON INITIAL LOAD ---
  useEffect(() => {
    let active = true;
    const loadData = async () => {
      const syncData = await fetchUserSyncData();
      if (!active) return;

      const dbProposals = syncData['madecc_proposals_db'];
      if (dbProposals && dbProposals.length > 0) {
        setProposals(dbProposals);
        calculateStats(dbProposals);
      } else {
        setProposals(DEFAULT_PROPOSALS);
        calculateStats(DEFAULT_PROPOSALS);
      }
    };

    loadData();

    // Add baseline audit log
    addAuditLog("System Initialized", "System");

    return () => {
      active = false;
    };
  }, []);

  // Save proposals back to Neon database / local fallback
  const saveProposalsToStorage = (updatedList: Proposal[]) => {
    setProposals(updatedList);
    saveUserSyncData('madecc_proposals_db', updatedList);
    calculateStats(updatedList);
  };

  const calculateStats = (list: Proposal[]) => {
    const total = list.length;
    const drafts = list.filter(p => p.status === 'Draft').length;
    const submitted = list.filter(p => p.status === 'Submitted').length;
    const approved = list.filter(p => p.status === 'Approved').length;
    const rejected = list.filter(p => p.status === 'Rejected').length;
    const archived = list.filter(p => p.status === 'Archived').length;

    const winnable = approved + rejected;
    const winRate = winnable > 0 ? Math.round((approved / winnable) * 100) : 75;
    const revenue = list.reduce((sum, p) => p.status === 'Approved' ? sum + p.projectValue : sum, 0);

    setStats({ total, drafts, submitted, approved, rejected, archived, winRate, revenue });
  };

  const addAuditLog = (action: string, user: string) => {
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      action,
      timestamp: new Date().toLocaleString(),
      user
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 49)]);
  };

  // --- COMPONENT HANDLERS ---
  const handleOpenProposal = (prop: Proposal) => {
    setSelectedProposal(prop);
    const coverSection = prop.sections.find(s => s.id === 'cover');
    setActiveSectionId('cover');
    setActiveSectionContent(coverSection?.content || '');
    setIsEditorOpen(true);
    addAuditLog(`Opened Proposal: ${prop.title}`, selectedRole);
    
    // Reset version logs
    setVersionHistory([
      {
        timestamp: new Date().toLocaleTimeString(),
        version: prop.version,
        title: "Opened Version Baseline",
        sections: JSON.parse(JSON.stringify(prop.sections))
      }
    ]);
  };

  const handleCreateNewProposal = () => {
    const defaultTemplate = TEMPLATES[0];
    const newProp: Proposal = {
      id: `prop-madecc-${Date.now()}`,
      title: "New Standard Commercial Proposal Draft",
      templateType: defaultTemplate.id,
      status: "Draft",
      version: "v1.0.0",
      projectValue: 150000000,
      currency: "FCFA",
      clientName: "Ministry of Housing and Urban Development",
      clientContact: "info@minhdu.gov.cm",
      location: "Douala, Cameroon",
      sections: generateProposalSections(defaultTemplate.id, "MADECC Group", "Ministry of Housing and Urban Development", "150,000,000 FCFA", "Douala, Cameroon"),
      boq: getInitialBOQ(),
      schedule: getInitialSchedule(),
      risks: getInitialRisks(),
      paymentSchedule: getInitialPaymentMilestones(150000000),
      watermark: "DRAFT",
      brandingColor: "steel",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      showStamp: true
    };

    const updated = [newProp, ...proposals];
    saveProposalsToStorage(updated);
    showToast(`Proposal created based on: ${defaultTemplate.label}`, "success");
    handleOpenProposal(newProp);
  };

  const handleSaveActiveProposal = () => {
    if (!selectedProposal) return;

    // Sync active text editor block before save
    const updatedSections = selectedProposal.sections.map(s => {
      if (s.id === activeSectionId) {
        return { ...s, content: activeSectionContent };
      }
      return s;
    });

    const updatedProp: Proposal = {
      ...selectedProposal,
      sections: updatedSections,
      updatedAt: new Date().toISOString()
    };

    const updatedList = proposals.map(p => p.id === updatedProp.id ? updatedProp : p);
    saveProposalsToStorage(updatedList);
    setSelectedProposal(updatedProp);
    
    // Add to version history
    setVersionHistory(prev => [
      {
        timestamp: new Date().toLocaleTimeString(),
        version: updatedProp.version,
        title: `Manual Save: Section [${SECTION_NAMES.find(n => n.id === activeSectionId)?.title}]`,
        sections: JSON.parse(JSON.stringify(updatedSections))
      },
      ...prev
    ]);

    addAuditLog(`Saved proposal: ${updatedProp.title}`, selectedRole);
    showToast("Proposal saved successfully to Cloud Run sandbox!", "success");
  };

  // Auto-Save simulation
  useEffect(() => {
    if (!selectedProposal || !isEditorOpen) return;
    
    const timer = setTimeout(() => {
      // Background auto save
      const updatedSections = selectedProposal.sections.map(s => {
        if (s.id === activeSectionId) {
          return { ...s, content: activeSectionContent };
        }
        return s;
      });

      const updatedProp: Proposal = {
        ...selectedProposal,
        sections: updatedSections,
        updatedAt: new Date().toISOString()
      };

      const updatedList = proposals.map(p => p.id === updatedProp.id ? updatedProp : p);
      saveProposalsToStorage(updatedList);
      setSelectedProposal(updatedProp);
    }, 10000); // Autosave every 10 seconds of inactivity

    return () => clearTimeout(timer);
  }, [activeSectionContent, activeSectionId]);

  const handleDuplicateProposal = (prop: Proposal, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const duplicated: Proposal = {
      ...prop,
      id: `prop-madecc-${Date.now()}`,
      title: `Copy of ${prop.title}`,
      status: "Draft",
      version: "v1.0.0",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [duplicated, ...proposals];
    saveProposalsToStorage(updated);
    showToast(`Duplicated proposal: ${prop.title}`, "success");
    addAuditLog(`Duplicated proposal: ${prop.title}`, selectedRole);
  };

  const handleDeleteProposal = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const propToDelete = proposals.find(p => p.id === id);
    if (!propToDelete) return;

    if (confirm(`Are you absolutely sure you want to delete proposal: "${propToDelete.title}"?`)) {
      const updated = proposals.filter(p => p.id !== id);
      saveProposalsToStorage(updated);
      if (selectedProposal?.id === id) {
        setIsEditorOpen(false);
        setSelectedProposal(null);
      }
      showToast("Proposal deleted permanently from Cloud Run.", "success");
      addAuditLog(`Deleted Proposal: ${propToDelete.title}`, selectedRole);
    }
  };

  const handleArchiveProposal = (prop: Proposal, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedStatus = prop.status === 'Archived' ? 'Draft' : 'Archived';
    const updatedProp: Proposal = {
      ...prop,
      status: updatedStatus,
      updatedAt: new Date().toISOString()
    };

    const updatedList = proposals.map(p => p.id === prop.id ? updatedProp : p);
    saveProposalsToStorage(updatedList);
    
    if (selectedProposal?.id === prop.id) {
      setSelectedProposal(updatedProp);
    }

    showToast(updatedStatus === 'Archived' ? "Proposal moved to Archives" : "Proposal restored from Archives", "success");
    addAuditLog(`${updatedStatus === 'Archived' ? 'Archived' : 'Restored'} Proposal: ${prop.title}`, selectedRole);
  };

  const handleSwitchSection = (sectionId: string) => {
    // Save current active section first
    if (selectedProposal) {
      const updatedSections = selectedProposal.sections.map(s => {
        if (s.id === activeSectionId) {
          return { ...s, content: activeSectionContent };
        }
        return s;
      });
      setSelectedProposal({ ...selectedProposal, sections: updatedSections });
    }

    setActiveSectionId(sectionId);
    const nextSection = selectedProposal?.sections.find(s => s.id === sectionId);
    setActiveSectionContent(nextSection?.content || '');
  };

  // --- BOQ DYNAMIC TABLE MODIFIERS ---
  const handleUpdateBOQCell = (rowId: string, field: keyof ProposalItem, val: string | number) => {
    if (!selectedProposal) return;

    const updatedBOQ = selectedProposal.boq.map(row => {
      if (row.id === rowId) {
        const updatedRow = { ...row, [field]: val } as any;
        if (field === 'qty' || field === 'rate') {
          updatedRow.total = Number(updatedRow.qty) * Number(updatedRow.rate);
        }
        return updatedRow;
      }
      return row;
    });

    const boqSum = updatedBOQ.reduce((sum, row) => sum + row.total, 0);

    // Sync matching payment milestones percentages
    const updatedPayment = selectedProposal.paymentSchedule.map(m => ({
      ...m,
      amount: Math.round(boqSum * (m.percentage / 100))
    }));

    setSelectedProposal({
      ...selectedProposal,
      boq: updatedBOQ,
      projectValue: boqSum,
      paymentSchedule: updatedPayment
    });
  };

  const handleAddBOQRow = () => {
    if (!selectedProposal) return;
    const newRow: ProposalItem = {
      id: `boq-${Date.now()}`,
      item: `${selectedProposal.boq.length + 1}.0`,
      description: "Custom site construction/installation parameter",
      unit: "LS",
      qty: 1,
      rate: 1000000,
      total: 1000000
    };

    const updatedBOQ = [...selectedProposal.boq, newRow];
    const boqSum = updatedBOQ.reduce((sum, r) => sum + r.total, 0);

    setSelectedProposal({
      ...selectedProposal,
      boq: updatedBOQ,
      projectValue: boqSum
    });
    showToast("Added new item to BOQ.", "success");
  };

  const handleDeleteBOQRow = (rowId: string) => {
    if (!selectedProposal) return;
    const updatedBOQ = selectedProposal.boq.filter(r => r.id !== rowId);
    const boqSum = updatedBOQ.reduce((sum, r) => sum + r.total, 0);

    setSelectedProposal({
      ...selectedProposal,
      boq: updatedBOQ,
      projectValue: boqSum
    });
    showToast("Removed item from BOQ.", "info");
  };

  // --- SCHEDULE TABLE MODIFIERS ---
  const handleUpdateScheduleCell = (rowId: string, field: keyof SchedulePhase, val: string) => {
    if (!selectedProposal) return;
    const updatedSchedule = selectedProposal.schedule.map(row => {
      if (row.id === rowId) {
        return { ...row, [field]: val };
      }
      return row;
    });
    setSelectedProposal({ ...selectedProposal, schedule: updatedSchedule });
  };

  const handleAddScheduleRow = () => {
    if (!selectedProposal) return;
    const newPhase: SchedulePhase = {
      id: `t-${Date.now()}`,
      phase: "Custom Phase Milestone",
      duration: "10 Days",
      dates: "TBD",
      status: "Pending",
      description: "Specific technical, civil, or MEP tasks."
    };
    setSelectedProposal({
      ...selectedProposal,
      schedule: [...selectedProposal.schedule, newPhase]
    });
  };

  // --- RISK ASSESSMENT MODIFIERS ---
  const handleUpdateRiskCell = (rowId: string, field: keyof RiskItem, val: string) => {
    if (!selectedProposal) return;
    const updatedRisks = selectedProposal.risks.map(row => {
      if (row.id === rowId) {
        return { ...row, [field]: val };
      }
      return row;
    });
    setSelectedProposal({ ...selectedProposal, risks: updatedRisks });
  };

  const handleAddRiskRow = () => {
    if (!selectedProposal) return;
    const newRisk: RiskItem = {
      id: `r-${Date.now()}`,
      description: "Potential site or logistical vulnerability",
      probability: "Medium",
      impact: "Medium",
      severity: "Medium",
      mitigation: "Strict safety audits and daily equipment supervision.",
      responsibility: "Site Manager"
    };
    setSelectedProposal({
      ...selectedProposal,
      risks: [...selectedProposal.risks, newRisk]
    });
  };

  // --- EXPORT TO WORD (.DOCX) ---
  const handleExportToWord = async () => {
    if (!selectedProposal) return;
    try {
      showToast("Generating Proposal MS Word (.docx)...", "info");
      const { blob, filename } = await generateProposalDocx(selectedProposal);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename} successfully!`, "success");
      addAuditLog(`Exported DOCX: ${selectedProposal.title}`, selectedRole);
    } catch (err) {
      console.error('Proposal DOCX export error:', err);
      showToast("Error generating proposal Word document", "error");
    }
  };

  // --- EXPORT TO A4 PDF (jsPDF) ---
  const handleExportToPDF = async () => {
    if (!selectedProposal) return;
    try {
      showToast("Generating Proposal A4 PDF...", "info");
      const { pdf, filename } = await generateProposalPdf(selectedProposal);
      pdf.save(filename);
      showToast(`Downloaded ${filename} successfully!`, "success");
      addAuditLog(`Exported PDF: ${selectedProposal.title}`, selectedRole);
    } catch (err) {
      console.error('Proposal PDF export error:', err);
      showToast("Error generating proposal PDF", "error");
    }
  };

  // --- EXPORT TO CSV (.CSV) ---
  const handleExportToCSV = () => {
    if (!selectedProposal) return;
    try {
      showToast("Generating Proposal CSV dataset...", "info");
      const { blob, filename } = generateProposalCsv(selectedProposal);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Downloaded ${filename} successfully!`, "success");
      addAuditLog(`Exported CSV: ${selectedProposal.title}`, selectedRole);
    } catch (err) {
      console.error('Proposal CSV export error:', err);
      showToast("Error generating proposal CSV", "error");
    }
  };

  // --- TRIGGER BACKEND GEMINI API FOR AI ASSISTANT ---
  const handleInvokeAiAssist = async (actionType: 'generate-full' | 'improve' | 'boq' | 'timeline' | 'risk-assessment') => {
    if (!selectedProposal) return;
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/proposals/ai-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: actionType,
          templateType: selectedProposal.templateType,
          sectionName: SECTION_NAMES.find(n => n.id === activeSectionId)?.title || activeSectionId,
          currentContent: activeSectionContent,
          companyDetails: { name: "MADECC Group", headOffice: "Yaoundé, Cameroon", role: selectedRole },
          clientDetails: {
            name: selectedProposal.clientName,
            projectValue: `${selectedProposal.projectValue.toLocaleString()} ${selectedProposal.currency}`,
            location: selectedProposal.location
          },
          customPrompt: aiCustomPrompt
        })
      });

      if (!response.ok) throw new Error("Gemini network request failed.");
      const data = await response.json();

      if (actionType === 'boq') {
        const parsedBoq = JSON.parse(data.result);
        if (parsedBoq && parsedBoq.items) {
          const formattedItems = parsedBoq.items.map((it: any) => ({
            id: it.id || `boq-${Date.now()}-${Math.random()}`,
            item: it.item,
            description: it.description,
            unit: it.unit,
            qty: Number(it.qty) || 1,
            rate: Number(it.rate) || 100000,
            total: (Number(it.qty) || 1) * (Number(it.rate) || 100000)
          }));
          const newSum = formattedItems.reduce((sum: number, r: any) => sum + r.total, 0);
          setSelectedProposal({
            ...selectedProposal,
            boq: formattedItems,
            projectValue: newSum
          });
          showToast("AI synthesized an optimized Bill of Quantities table!", "success");
        }
      } else if (actionType === 'timeline') {
        const parsedTimeline = JSON.parse(data.result);
        if (parsedTimeline && parsedTimeline.schedule) {
          setSelectedProposal({
            ...selectedProposal,
            schedule: parsedTimeline.schedule
          });
          showToast("AI compiled an advanced engineering construction schedule!", "success");
        }
      } else if (actionType === 'risk-assessment') {
        const parsedRisks = JSON.parse(data.result);
        if (parsedRisks && parsedRisks.risks) {
          setSelectedProposal({
            ...selectedProposal,
            risks: parsedRisks.risks
          });
          showToast("AI executed a proactive Risk Hazard Matrix!", "success");
        }
      } else {
        // Standard text updates
        setActiveSectionContent(data.result);
        showToast("Gemini AI text engine enhanced this section successfully!", "success");
      }

      addAuditLog(`Triggered AI [${actionType}] on section ${activeSectionId}`, selectedRole);
    } catch (e: any) {
      console.error(e);
      showToast("Error invoking AI assistant. Using offline fallback schema.", "warning");
    } finally {
      setIsAiLoading(false);
      setAiCustomPrompt('');
    }
  };

  // --- DRAW SIGNATURE PAD CANVAS ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Convert to image and save in state
    if (signatureCanvasRef.current && selectedProposal) {
      const dataUrl = signatureCanvasRef.current.toDataURL('image/png');
      setSelectedProposal({
        ...selectedProposal,
        signatureImage: dataUrl
      });
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (selectedProposal) {
      setSelectedProposal({
        ...selectedProposal,
        signatureImage: undefined
      });
    }
    showToast("Signature pad cleared.", "info");
  };

  // --- FILTER AND SEARCH PROPOSALS ---
  const filteredProposals = proposals.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' ? true : p.status === statusFilter;
    const matchesTemplate = templateFilter === 'ALL' ? true : p.templateType === templateFilter;

    return matchesSearch && matchesStatus && matchesTemplate;
  });

  return (
    <div className="bg-slate-900 min-h-screen text-slate-100 p-4 md:p-8 font-sans">
      
      {!isEditorOpen ? (
        <ProposalDashboard
          proposals={proposals}
          selectedRole={selectedRole}
          onOpenProposal={handleOpenProposal}
          onCreateNewProposal={handleCreateNewProposal}
          onArchiveProposal={handleArchiveProposal}
          onDeleteProposal={handleDeleteProposal}
          onDuplicateProposal={handleDuplicateProposal}
          showToast={showToast}
          setActiveAdminTab={setActiveAdminTab}
        />
      ) : (
        <>
          {/* =========================================================================
              1. HEADER PANEL (Shown in Editor view only)
              ========================================================================= */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-500 text-slate-950 font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded">PROCORE SUITE</span>
                <span className="text-slate-500 font-mono text-xs">V3.1.2 Secure Ledger</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <Layers className="text-amber-500 w-8 h-8" /> Enterprise Proposal Studio
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Create, edit, model, and deploy audit-grade civil construction tenders for international and Cameroon ministries in A4 PDF and editable Microsoft Word formats.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Permission selector */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-500" />
                <div className="flex flex-col">
                  <span className="text-[9px] text-slate-500 font-mono uppercase font-bold leading-none">Simulate Role</span>
                  <select 
                    value={selectedRole} 
                    onChange={(e) => {
                      setSelectedRole(e.target.value as any);
                      showToast(`Role switched to: ${e.target.value}`, "info");
                    }}
                    className="bg-transparent border-none text-white text-xs font-bold font-mono focus:ring-0 cursor-pointer p-0 pr-6 mt-0.5"
                  >
                    <option value="Admin" className="bg-slate-950">Admin (Full Write)</option>
                    <option value="Manager" className="bg-slate-950">Project Manager</option>
                    <option value="Engineer" className="bg-slate-950">Site Engineer</option>
                    <option value="Estimator" className="bg-slate-950">Estimator (BOQ)</option>
                    <option value="Accountant" className="bg-slate-950">Accountant</option>
                    <option value="Viewer" className="bg-slate-950">Viewer Read-Only</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setIsEditorOpen(false)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold px-5 py-3 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" /> Close Editor
              </button>
            </div>
          </div>
        
        // =========================================================================
        // 4. RICH EDITOR & WORKSPACE PANEL
        // =========================================================================
        selectedProposal && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            
            {/* Left Section Sidebar */}
            <div className="lg:col-span-1 bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-4 max-h-[82vh] overflow-y-auto shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-2 px-2">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Document Map</h4>
                  <span className="text-[10px] text-slate-500 font-mono">24 Standard Milestones</span>
                </div>
                <span className="text-[10px] bg-slate-900 border border-slate-800 text-amber-500 px-2 py-0.5 rounded font-mono font-bold uppercase">
                  {selectedProposal.version}
                </span>
              </div>

              <div className="space-y-1">
                {SECTION_NAMES.map(s => {
                  const isActive = activeSectionId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => handleSwitchSection(s.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs font-semibold tracking-wide transition-all ${
                        isActive 
                          ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/10' 
                          : 'text-slate-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      <span className="truncate">{s.title}</span>
                      {isActive && <ChevronRight className="w-3.5 h-3.5 stroke-[3px] ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Central Editor Pane */}
            <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between min-h-[82vh]">
              
              {/* Header Details */}
              <div className="space-y-4 mb-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <input 
                      type="text" 
                      value={selectedProposal.title}
                      onChange={(e) => setSelectedProposal({ ...selectedProposal, title: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 px-3 py-1.5 rounded-xl text-sm font-extrabold text-white"
                      placeholder="Proposal Title..."
                    />
                    
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-2 text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1"><User className="w-3 h-3 text-slate-500" /> Client: 
                        <input 
                          type="text" 
                          value={selectedProposal.clientName}
                          onChange={(e) => setSelectedProposal({ ...selectedProposal, clientName: e.target.value })}
                          className="bg-transparent border-b border-slate-800 focus:border-amber-500 py-0 px-1 ml-0.5 text-white"
                        />
                      </span>
                      <span className="flex items-center gap-1"><Globe className="w-3 h-3 text-slate-500" /> Location: 
                        <input 
                          type="text" 
                          value={selectedProposal.location}
                          onChange={(e) => setSelectedProposal({ ...selectedProposal, location: e.target.value })}
                          className="bg-transparent border-b border-slate-800 focus:border-amber-500 py-0 px-1 ml-0.5 text-white text-[10px]"
                        />
                      </span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-slate-500" /> Value: 
                        <span className="text-white font-bold">{selectedProposal.projectValue.toLocaleString()} {selectedProposal.currency}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    <button 
                      onClick={handleSaveActiveProposal}
                      disabled={selectedRole === 'Viewer'}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold px-3 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      title="Save modifications"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>

                    <button 
                      onClick={() => setIsEditorOpen(false)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      title="Back to registry list"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Close
                    </button>
                  </div>
                </div>

                {/* Sub-panels for tables (BOQ, Schedule, Risks) depending on active tab map */}
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider font-bold">Quick Sub-Databases:</span>
                  <button 
                    onClick={() => handleSwitchSection('boq-table')} 
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase ${
                      activeSectionId === 'boq-table' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    BOQ Table ({selectedProposal.boq.length})
                  </button>
                  <button 
                    onClick={() => handleSwitchSection('schedule-table')} 
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase ${
                      activeSectionId === 'schedule-table' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Gantt Schedule
                  </button>
                  <button 
                    onClick={() => handleSwitchSection('risks-table')} 
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase ${
                      activeSectionId === 'risks-table' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Risk Assessment Matrix
                  </button>
                  <button 
                    onClick={() => handleSwitchSection('signature-panel')} 
                    className={`px-3 py-1 rounded-lg text-[10px] font-bold font-mono uppercase ${
                      activeSectionId === 'signature-panel' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    Signature Pad
                  </button>
                </div>
              </div>

              {/* EDITOR WORKSPACE FRAME */}
              <div className="flex-grow bg-slate-900/60 p-4 rounded-xl border border-slate-800 min-h-[42vh] max-h-[50vh] overflow-y-auto">
                
                {/* --- CASE 1: BOQ DYNAMIC TABLE EDITOR --- */}
                {activeSectionId === 'boq-table' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Dynamic Bill of Quantities (BOQ)
                      </h4>
                      <button 
                        onClick={handleAddBOQRow}
                        disabled={selectedRole === 'Viewer' || selectedRole === 'Engineer'}
                        className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Row
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <th className="pb-2 w-12">Item</th>
                            <th className="pb-2">Works Specification</th>
                            <th className="pb-2 w-16">Unit</th>
                            <th className="pb-2 w-16">Qty</th>
                            <th className="pb-2 w-24">Rate (FCFA)</th>
                            <th className="pb-2 w-28">Total</th>
                            <th className="pb-2 w-8"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {selectedProposal.boq.map(row => (
                            <tr key={row.id}>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.item}
                                  onChange={(e) => handleUpdateBOQCell(row.id, 'item', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-1 py-0.5 rounded text-white font-mono text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.description}
                                  onChange={(e) => handleUpdateBOQCell(row.id, 'description', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-0.5 rounded text-white text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.unit}
                                  onChange={(e) => handleUpdateBOQCell(row.id, 'unit', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-1 py-0.5 rounded text-white font-mono text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="number" 
                                  value={row.qty}
                                  onChange={(e) => handleUpdateBOQCell(row.id, 'qty', Number(e.target.value))}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-1 py-0.5 rounded text-white font-mono text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="number" 
                                  value={row.rate}
                                  onChange={(e) => handleUpdateBOQCell(row.id, 'rate', Number(e.target.value))}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-0.5 rounded text-white font-mono text-[10px]"
                                />
                              </td>
                              <td className="py-2 text-slate-300 font-mono font-bold text-[10px]">
                                {row.total.toLocaleString()}
                              </td>
                              <td className="py-2 text-right">
                                <button 
                                  onClick={() => handleDeleteBOQRow(row.id)}
                                  disabled={selectedRole === 'Viewer' || selectedRole === 'Engineer'}
                                  className="p-1 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <span className="font-mono text-slate-400">Total Sum of Bill of Quantities (BOQ):</span>
                      <span className="font-mono font-black text-amber-500 text-sm">
                        {selectedProposal.projectValue.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                ) : activeSectionId === 'schedule-table' ? (
                  
                  // --- CASE 2: SCHEDULE TABLE EDITOR ---
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-sky-400" /> Milestone Gantt Construction Schedule
                      </h4>
                      <button 
                        onClick={handleAddScheduleRow}
                        disabled={selectedRole === 'Viewer' || selectedRole === 'Estimator'}
                        className="bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Phase
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <th className="pb-2">Milestone / Phase</th>
                            <th className="pb-2 w-20">Duration</th>
                            <th className="pb-2 w-24">Dates Frame</th>
                            <th className="pb-2">Actions Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {selectedProposal.schedule.map(row => (
                            <tr key={row.id}>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.phase}
                                  onChange={(e) => handleUpdateScheduleCell(row.id, 'phase', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-1 rounded text-white text-[10px] font-semibold"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.duration}
                                  onChange={(e) => handleUpdateScheduleCell(row.id, 'duration', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-1 rounded text-white font-mono text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.dates}
                                  onChange={(e) => handleUpdateScheduleCell(row.id, 'dates', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-1 rounded text-white font-mono text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.description}
                                  onChange={(e) => handleUpdateScheduleCell(row.id, 'description', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-1 rounded text-white text-[10px]"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : activeSectionId === 'risks-table' ? (
                  
                  // --- CASE 3: RISK REGISTER EDITOR ---
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-500" /> Engineering Risk Registry
                      </h4>
                      <button 
                        onClick={handleAddRiskRow}
                        disabled={selectedRole === 'Viewer'}
                        className="bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Risk
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-800 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <th className="pb-2">Risk Factor / Hazard</th>
                            <th className="pb-2 w-16">Prob</th>
                            <th className="pb-2 w-16">Impact</th>
                            <th className="pb-2">Mitigation Response Strategy</th>
                            <th className="pb-2 w-28">Responsibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {selectedProposal.risks.map(row => (
                            <tr key={row.id}>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.description}
                                  onChange={(e) => handleUpdateRiskCell(row.id, 'description', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-1 rounded text-white text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <select 
                                  value={row.probability}
                                  onChange={(e) => handleUpdateRiskCell(row.id, 'probability', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 py-1 rounded text-white text-[10px] font-mono"
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                </select>
                              </td>
                              <td className="py-2 pr-2">
                                <select 
                                  value={row.impact}
                                  onChange={(e) => handleUpdateRiskCell(row.id, 'impact', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 py-1 rounded text-white text-[10px] font-mono"
                                >
                                  <option value="Low">Low</option>
                                  <option value="Medium">Medium</option>
                                  <option value="High">High</option>
                                  <option value="Critical">Critical</option>
                                </select>
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.mitigation}
                                  onChange={(e) => handleUpdateRiskCell(row.id, 'mitigation', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-1 rounded text-white text-[10px]"
                                />
                              </td>
                              <td className="py-2 pr-2">
                                <input 
                                  type="text" 
                                  value={row.responsibility}
                                  onChange={(e) => handleUpdateRiskCell(row.id, 'responsibility', e.target.value)}
                                  className="w-full bg-slate-950 border border-slate-800/80 px-2 py-1 rounded text-white text-[10px]"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : activeSectionId === 'signature-panel' ? (
                  
                  // --- CASE 4: SIGNATURE DRAWING PAD ---
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Interactive Authorized Handdrawn Signature</h4>
                    <p className="text-[10px] text-slate-400">
                      Sign using your touch screen or cursor below to secure and authenticate this proposal. The drawing will embed automatically into the signature block page.
                    </p>

                    <div className="bg-white rounded-xl p-2 max-w-sm mx-auto border border-slate-800">
                      <canvas
                        ref={signatureCanvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        width={350}
                        height={120}
                        className="w-full h-28 bg-slate-50 border border-dashed border-slate-300 rounded-lg cursor-crosshair block"
                      />
                    </div>

                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={clearSignature}
                        className="bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[10px] font-mono px-3 py-1.5 rounded-lg"
                      >
                        Reset / Clear Draw
                      </button>
                      {selectedProposal.signatureImage && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                          <Check className="w-4 h-4 stroke-[3px]" /> Signature Preserved!
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  
                  // --- CASE 5: REVOLUTIONARY RICH TEXT CANVAS FOR STANDARD SECTIONS ---
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-mono text-slate-400">Active Map Node: <strong>{SECTION_NAMES.find(n => n.id === activeSectionId)?.title}</strong></span>
                      
                      {/* Markdown helper indicator */}
                      <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 font-mono uppercase px-1.5 py-0.5 rounded">Markdown Supported</span>
                    </div>

                    <textarea
                      value={activeSectionContent}
                      onChange={(e) => setActiveSectionContent(e.target.value)}
                      className="w-full h-80 bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono leading-relaxed"
                      placeholder="Start writing proposal technical paragraphs or markdown charts here..."
                    />
                  </div>
                )}

              </div>

              {/* Action Buttons footer */}
              <div className="flex flex-wrap gap-2 items-center justify-between border-t border-slate-800 pt-4 mt-4">
                
                {/* Visual Branding Controls */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                    <Sliders className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] text-slate-500 font-mono font-bold uppercase mr-1">Palettes:</span>
                    {(['steel', 'gold', 'emerald', 'crimson'] as const).map(color => (
                      <button 
                        key={color}
                        onClick={() => setSelectedProposal({ ...selectedProposal, brandingColor: color })}
                        className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                          color === 'steel' ? 'bg-blue-600' :
                          color === 'gold' ? 'bg-amber-500' :
                          color === 'emerald' ? 'bg-emerald-600' :
                          'bg-rose-600'
                        } ${selectedProposal.brandingColor === color ? 'scale-125 border-white' : 'border-transparent hover:scale-110'}`}
                        title={`Switch branding color to: ${color}`}
                      />
                    ))}
                  </div>

                  {/* Watermark Selector */}
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-1.5 rounded-xl text-[10px]">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[9px] text-slate-500 font-mono font-bold uppercase mr-1">Seal:</span>
                    <select
                      value={selectedProposal.watermark}
                      onChange={(e) => setSelectedProposal({ ...selectedProposal, watermark: e.target.value as any })}
                      className="bg-transparent border-none text-slate-300 font-mono font-bold text-[9px] cursor-pointer focus:ring-0 p-0 pr-4"
                    >
                      <option value="NONE" className="bg-slate-950">None</option>
                      <option value="DRAFT" className="bg-slate-950">DRAFT</option>
                      <option value="CONFIDENTIAL" className="bg-slate-950">CONFIDENTIAL</option>
                      <option value="APPROVED" className="bg-slate-950">APPROVED</option>
                      <option value="URGENT" className="bg-slate-950">URGENT</option>
                    </select>
                  </div>
                </div>

                {/* Exporters and Document Actions */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={handleExportToPDF}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold py-2 px-3 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Export as official A4 PDF document"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" /> A4 PDF
                  </button>

                  <button 
                    onClick={handleExportToWord}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold py-2 px-3 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Export editable Microsoft Word document"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-400" /> Word (.docx)
                  </button>

                  <button 
                    onClick={handleExportToCSV}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold py-2 px-3 rounded-xl text-[11px] flex items-center gap-1.5 cursor-pointer transition-all"
                    title="Export CSV dataset"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> CSV (.csv)
                  </button>

                  {/* Print trigger */}
                  <button 
                    onClick={() => window.print()}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-semibold p-2 rounded-xl transition-all"
                    title="Print layout"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                </div>

              </div>

            </div>

            {/* Right Panel AI Assistant Sidebar */}
            <div className="lg:col-span-1 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-6 shadow-xl max-h-[82vh] overflow-y-auto">
              
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Proposal Assistant</h4>
                  <p className="text-[9px] text-slate-500 font-mono">Gemini-3.5 Pro Engine</p>
                </div>
              </div>

              {/* AI helper functions */}
              <div className="space-y-4">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-[9px] text-slate-400 font-mono uppercase font-bold tracking-wider block">Contextual Directions</span>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Provide instructions, specifications, or regional requirements below. The Gemini AI will automatically compile technical civil grades.
                  </p>
                  
                  <textarea
                    value={aiCustomPrompt}
                    onChange={(e) => setAiCustomPrompt(e.target.value)}
                    placeholder="E.g. Make it highly technical for a Cameroon MINMAP tender, ensure concrete is CPJ-45..."
                    className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* AI Trigger Actions Grid */}
                <div className="grid grid-cols-1 gap-2.5">
                  <button
                    onClick={() => handleInvokeAiAssist('generate-full')}
                    disabled={isAiLoading || selectedRole === 'Viewer' || activeSectionId.includes('-table') || activeSectionId === 'signature-panel'}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 text-left text-[11px] font-bold p-3 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Write Full Section</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleInvokeAiAssist('improve')}
                    disabled={isAiLoading || selectedRole === 'Viewer' || activeSectionId.includes('-table') || activeSectionId === 'signature-panel'}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 text-left text-[11px] font-bold p-3 rounded-xl flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                      <span>AI Audit & Rewrite</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleInvokeAiAssist('boq')}
                    disabled={isAiLoading || selectedRole === 'Viewer' || selectedRole === 'Engineer'}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 text-left text-[11px] font-bold p-3 rounded-xl flex items-center justify-between transition-colors"
                    title="Generate professional BOQ table based on the tender title"
                  >
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Costing / BOQ</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleInvokeAiAssist('timeline')}
                    disabled={isAiLoading || selectedRole === 'Viewer' || selectedRole === 'Estimator'}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 text-left text-[11px] font-bold p-3 rounded-xl flex items-center justify-between transition-colors"
                    title="Generate complete project phases schedule"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-violet-400" />
                      <span>AI Gantt Timeline</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>

                  <button
                    onClick={() => handleInvokeAiAssist('risk-assessment')}
                    disabled={isAiLoading || selectedRole === 'Viewer'}
                    className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 text-left text-[11px] font-bold p-3 rounded-xl flex items-center justify-between transition-colors"
                    title="Generate engineering risks"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>AI Hazard Register</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-500" />
                  </button>
                </div>

                {isAiLoading && (
                  <div className="flex items-center justify-center gap-2 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <div className="w-4 h-4 border-2 border-slate-800 border-t-amber-500 rounded-full animate-spin" />
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest animate-pulse">Consulting Gemini...</span>
                  </div>
                )}
              </div>

              {/* Version Rollback and History */}
              <div className="border-t border-slate-800 pt-5">
                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Version History
                </h5>
                
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {versionHistory.map((ver, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => {
                        setSelectedProposal({ ...selectedProposal, sections: JSON.parse(JSON.stringify(ver.sections)) });
                        showToast(`Restored baseline savepoint!`, "info");
                      }}
                      className="bg-slate-900 hover:bg-slate-850 border border-slate-800/80 p-2.5 rounded-lg text-[10px] leading-tight cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-mono text-amber-500 font-bold">{ver.version}</span>
                        <span className="text-slate-500 font-mono text-[8px]">{ver.timestamp}</span>
                      </div>
                      <p className="text-slate-300 truncate">{ver.title}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
}
