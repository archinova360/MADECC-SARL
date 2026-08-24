import React, { useState, useEffect, useRef, useTransition } from 'react';
import {
  Calculator,
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
  Info,
  Calendar,
  Sparkles,
  Undo2,
  Redo2,
  History,
  Share2,
  MessageSquare,
  Mail,
  Archive,
  RotateCcw,
  Sliders,
  TrendingUp,
  PieChart as PieIcon,
  BarChart3,
  XCircle,
  Check,
  CopyCheck,
  Percent,
  Hash,
  Briefcase
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import {
  LabourData,
  LabourSection,
  LabourItem,
  generateLabourDocx,
  generateLabourCsv,
  generateLabourPdf
} from '../utils/labourExport';
import { getAuthToken } from '../lib/firebase';
import { formatCurrency } from '../lib/utils.ts';
import { useToast } from './Toast';

interface LabourCalculatorProps {
  userRole?: string;
  userName?: string;
}

const DEFAULT_SECTIONS: LabourSection[] = [
  {
    id: 'sec-1',
    sectionCode: '1.0',
    title: 'Site Preparation & Excavation Labour',
    subtotal: 1350000,
    items: [
      {
        id: 'item-101',
        itemNumber: '1.1',
        description: 'Site clearing, topsoil stripping & manual trench excavation crew',
        quantity: 20,
        unit: 'Man-Days',
        unitRate: 15000,
        amount: 300000,
        tradeCategory: 'General Labour',
        notes: 'Hand excavation in firm clay soil'
      },
      {
        id: 'item-102',
        itemNumber: '1.2',
        description: 'Foundation pit backfilling, compaction & leveling crew',
        quantity: 15,
        unit: 'Man-Days',
        unitRate: 12000,
        amount: 180000,
        tradeCategory: 'General Labour',
        notes: 'Vibratory plate compactor team'
      },
      {
        id: 'item-103',
        itemNumber: '1.3',
        description: 'Geotechnical soil sampling & trial pit excavation labor',
        quantity: 10,
        unit: 'Man-Days',
        unitRate: 87000,
        amount: 870000,
        tradeCategory: 'Technician',
        notes: 'Supervised by Geotechnical Engineer'
      }
    ]
  },
  {
    id: 'sec-2',
    sectionCode: '2.0',
    title: 'Reinforced Concrete & Substructure Labour',
    subtotal: 2850000,
    items: [
      {
        id: 'item-201',
        itemNumber: '2.1',
        description: 'Bending, cutting & positioning steel rebar FeE500 (Footings & Columns)',
        quantity: 35,
        unit: 'Man-Days',
        unitRate: 25000,
        amount: 875000,
        tradeCategory: 'Steel Fixer',
        notes: 'High yield steel rebar fabrication'
      },
      {
        id: 'item-202',
        itemNumber: '2.2',
        description: 'Timber & marine plywood formwork assembly for pad footings & plinth',
        quantity: 30,
        unit: 'Man-Days',
        unitRate: 22000,
        amount: 660000,
        tradeCategory: 'Carpenter',
        notes: 'Formwork oiled & braced'
      },
      {
        id: 'item-203',
        itemNumber: '2.3',
        description: 'Class C25/30 concrete mixing, pouring, mechanical vibration & curing team',
        quantity: 45,
        unit: 'm³',
        unitRate: 29222,
        amount: 1315000,
        tradeCategory: 'Concrete Mason',
        notes: '7-day wet curing protocol included'
      }
    ]
  },
  {
    id: 'sec-3',
    sectionCode: '3.0',
    title: 'Masonry & Wall Construction Labour',
    subtotal: 2100000,
    items: [
      {
        id: 'item-301',
        itemNumber: '3.1',
        description: 'Laying 20x20x40cm hollow concrete blockwork in cement mortar 1:4',
        quantity: 400,
        unit: 'm²',
        unitRate: 3500,
        amount: 1400000,
        tradeCategory: 'Master Mason',
        notes: 'Includes scaffold staging setup'
      },
      {
        id: 'item-302',
        itemNumber: '3.2',
        description: 'Internal & external wall cement plastering 15mm thick (Rough & Smooth)',
        quantity: 350,
        unit: 'm²',
        unitRate: 2000,
        amount: 700000,
        tradeCategory: 'Plasterer',
        notes: 'Two-coat plaster finish'
      }
    ]
  }
];

export default function LabourCalculator({ userRole = 'admin', userName = 'Engineer' }: LabourCalculatorProps) {
  const { showToast } = useToast();

  // Mode: Calculator or Dashboard
  const [mode, setMode] = useState<'calculator' | 'dashboard' | 'history'>('calculator');

  // Active Role Simulation: Admin, Manager, Engineer, Quantity Surveyor, Viewer
  const [role, setRole] = useState<'admin' | 'manager' | 'engineer' | 'qs' | 'viewer'>(
    (userRole as any) || 'admin'
  );

  const isReadOnly = role === 'viewer';

  // Core Labour State
  const [labourId, setLabourId] = useState<number | null>(null);
  const [quotationRef, setQuotationRef] = useState(`LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [projectName, setProjectName] = useState('Residence Extension & Modernization');
  const [clientName, setClientName] = useState('Société Horizon Immobilier S.A.');
  const [clientEmail, setClientEmail] = useState('contact@horizon-immo.cm');
  const [location, setLocation] = useState('Bonapriso, Douala, Cameroon');
  const [projectType, setProjectType] = useState('Commercial / Residential');
  const [buildingFloors, setBuildingFloors] = useState<number>(4);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [preparedBy, setPreparedBy] = useState(userName || 'Eng. Jean-Luc Mbida (ONIGC)');
  const [approvedBy, setApprovedBy] = useState('Eng. Paulin Nguema, PE');
  const [status, setStatus] = useState<'DRAFT' | 'PENDING' | 'FINAL' | 'APPROVED' | 'ARCHIVED' | 'TRASH'>('DRAFT');
  const [currency, setCurrency] = useState('XAF');
  const [revisionNumber, setRevisionNumber] = useState('REV-01');
  const [notes, setNotes] = useState('Calculations structured as per CCTG Civil Engineering Norms.');

  // Live Percentage Adjustments
  const [profitPercent, setProfitPercent] = useState<number>(15.0);
  const [overheadPercent, setOverheadPercent] = useState<number>(10.0);
  const [contingencyPercent, setContingencyPercent] = useState<number>(5.0);
  const [discountPercent, setDiscountPercent] = useState<number>(0.0);
  const [taxPercent, setTaxPercent] = useState<number>(19.25);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  // Detailed Sections list
  const [sections, setSections] = useState<LabourSection[]>(DEFAULT_SECTIONS);

  // Undo / Redo History Stack
  const [historyStack, setHistoryStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  // Revision History & Audit Log
  const [revisionsHistory, setRevisionsHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Saved Calculations List (from DB/LocalStorage)
  const [savedCalculations, setSavedCalculations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [autoSaveTime, setAutoSaveTime] = useState<string | null>(null);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailCc, setEmailCc] = useState('');
  const [emailBcc, setEmailBcc] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsappPhone, setWhatsappPhone] = useState('237690000000');

  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showTrashDrawer, setShowTrashDrawer] = useState(false);
  const [showAuditDrawer, setShowAuditDrawer] = useState(false);

  // Record initial state for undo
  const recordHistory = (currentState: any) => {
    setHistoryStack((prev) => [...prev.slice(-30), JSON.stringify(currentState)]);
    setRedoStack([]); // clear redo on new action
  };

  const getCurrentSnapshot = () => ({
    quotationRef,
    projectName,
    clientName,
    clientEmail,
    location,
    projectType,
    buildingFloors,
    date,
    preparedBy,
    approvedBy,
    status,
    currency,
    revisionNumber,
    notes,
    profitPercent,
    overheadPercent,
    contingencyPercent,
    discountPercent,
    taxPercent,
    paidAmount,
    sections
  });

  // Load calculations on mount
  useEffect(() => {
    fetchCalculations();
  }, []);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Ctrl+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave('DRAFT');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStack, redoStack]);

  // Auto-Save Interval (Every 60 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isReadOnly && sections.length > 0) {
        handleAutoSave();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [sections, profitPercent, overheadPercent, taxPercent, projectName, clientName]);

  const fetchCalculations = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/labour/calculations', { headers });
      if (res.ok) {
        const data = await res.json();
        setSavedCalculations(data);
      }
    } catch (err) {
      console.error('Failed to fetch labour calculations from server:', err);
    } finally {
      setLoading(false);
    }
  };

  // Instant Computed Financial Totals
  const computeTotals = () => {
    let baseSubtotal = 0;
    const computedSections = sections.map((sec) => {
      let secSubtotal = 0;
      const computedItems = sec.items.map((item) => {
        const qty = Number(item.quantity) || 0;
        const rate = Number(item.unitRate) || 0;
        const amount = qty * rate;
        secSubtotal += amount;
        return { ...item, amount };
      });
      baseSubtotal += secSubtotal;
      return { ...sec, subtotal: secSubtotal, items: computedItems };
    });

    const overheadAmount = (baseSubtotal * overheadPercent) / 100;
    const contingencyAmount = (baseSubtotal * contingencyPercent) / 100;

    // Subtotal including overhead & contingency
    const subtotalWithOverhead = baseSubtotal + overheadAmount + contingencyAmount;

    // Profit Amount computed on (subtotalWithOverhead)
    const profitAmount = (subtotalWithOverhead * profitPercent) / 100;

    const subtotalBeforeDiscount = subtotalWithOverhead + profitAmount;
    const discountAmount = (subtotalBeforeDiscount * discountPercent) / 100;
    const taxableNet = subtotalBeforeDiscount - discountAmount;

    const taxAmount = (taxableNet * taxPercent) / 100;
    const grandTotal = taxableNet + taxAmount;
    const balanceDue = grandTotal - paidAmount;

    return {
      computedSections,
      baseSubtotal,
      overheadAmount,
      contingencyAmount,
      profitAmount,
      discountAmount,
      taxableNet,
      taxAmount,
      grandTotal,
      balanceDue
    };
  };

  const totals = computeTotals();

  // Undo Handler
  const handleUndo = () => {
    if (historyStack.length === 0) {
      showToast('No more actions to undo.', 'info');
      return;
    }
    const currentSnap = JSON.stringify(getCurrentSnapshot());
    setRedoStack((prev) => [currentSnap, ...prev]);

    const previousSnapStr = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    if (previousSnapStr) {
      const snap = JSON.parse(previousSnapStr);
      applySnapshot(snap);
      showToast('Undo performed.', 'info');
    }
  };

  // Redo Handler
  const handleRedo = () => {
    if (redoStack.length === 0) {
      showToast('No more actions to redo.', 'info');
      return;
    }
    const currentSnap = JSON.stringify(getCurrentSnapshot());
    setHistoryStack((prev) => [...prev, currentSnap]);

    const nextSnapStr = redoStack[0];
    setRedoStack((prev) => prev.slice(1));

    if (nextSnapStr) {
      const snap = JSON.parse(nextSnapStr);
      applySnapshot(snap);
      showToast('Redo performed.', 'info');
    }
  };

  const applySnapshot = (snap: any) => {
    if (snap.quotationRef) setQuotationRef(snap.quotationRef);
    if (snap.projectName) setProjectName(snap.projectName);
    if (snap.clientName) setClientName(snap.clientName);
    if (snap.clientEmail !== undefined) setClientEmail(snap.clientEmail);
    if (snap.location) setLocation(snap.location);
    if (snap.projectType) setProjectType(snap.projectType);
    if (snap.buildingFloors !== undefined) setBuildingFloors(snap.buildingFloors);
    if (snap.date) setDate(snap.date);
    if (snap.preparedBy) setPreparedBy(snap.preparedBy);
    if (snap.approvedBy !== undefined) setApprovedBy(snap.approvedBy);
    if (snap.status) setStatus(snap.status);
    if (snap.currency) setCurrency(snap.currency);
    if (snap.profitPercent !== undefined) setProfitPercent(snap.profitPercent);
    if (snap.overheadPercent !== undefined) setOverheadPercent(snap.overheadPercent);
    if (snap.contingencyPercent !== undefined) setContingencyPercent(snap.contingencyPercent);
    if (snap.discountPercent !== undefined) setDiscountPercent(snap.discountPercent);
    if (snap.taxPercent !== undefined) setTaxPercent(snap.taxPercent);
    if (snap.paidAmount !== undefined) setPaidAmount(snap.paidAmount);
    if (snap.sections) setSections(snap.sections);
  };

  // Update Section Item
  const handleItemChange = (sectionIndex: number, itemIndex: number, field: keyof LabourItem, value: any) => {
    if (isReadOnly) return;
    recordHistory(getCurrentSnapshot());

    setSections((prevSections) => {
      const newSections = [...prevSections];
      const sec = { ...newSections[sectionIndex] };
      const newItems = [...sec.items];
      const item = { ...newItems[itemIndex], [field]: value };

      if (field === 'quantity' || field === 'unitRate') {
        const q = field === 'quantity' ? Number(value) : Number(item.quantity);
        const r = field === 'unitRate' ? Number(value) : Number(item.unitRate);
        item.amount = (isNaN(q) ? 0 : q) * (isNaN(r) ? 0 : r);
      }

      newItems[itemIndex] = item;
      sec.items = newItems;
      newSections[sectionIndex] = sec;
      return newSections;
    });
  };

  // Add Item to Section
  const handleAddItem = (sectionIndex: number) => {
    if (isReadOnly) return;
    recordHistory(getCurrentSnapshot());

    setSections((prev) => {
      const newSecs = [...prev];
      const sec = { ...newSecs[sectionIndex] };
      const count = sec.items.length + 1;
      const newItem: LabourItem = {
        id: `item-${Date.now()}`,
        itemNumber: `${sec.sectionCode}.${count}`,
        description: 'New Labour Operation Task',
        quantity: 10,
        unit: 'Man-Days',
        unitRate: 15000,
        amount: 150000,
        tradeCategory: 'General Labour',
        notes: ''
      };
      sec.items = [...sec.items, newItem];
      newSecs[sectionIndex] = sec;
      return newSecs;
    });
    showToast('New labour item added.', 'success');
  };

  // Delete Item
  const handleDeleteItem = (sectionIndex: number, itemIndex: number) => {
    if (isReadOnly) return;
    recordHistory(getCurrentSnapshot());

    setSections((prev) => {
      const newSecs = [...prev];
      const sec = { ...newSecs[sectionIndex] };
      sec.items = sec.items.filter((_, idx) => idx !== itemIndex);
      newSecs[sectionIndex] = sec;
      return newSecs;
    });
    showToast('Item deleted.', 'info');
  };

  // Add Section
  const handleAddSection = () => {
    if (isReadOnly) return;
    recordHistory(getCurrentSnapshot());

    const count = sections.length + 1;
    const newSection: LabourSection = {
      id: `sec-${Date.now()}`,
      sectionCode: `${count}.0`,
      title: 'Additional Specialized Works Labour',
      subtotal: 0,
      items: [
        {
          id: `item-${Date.now()}-1`,
          itemNumber: `${count}.1`,
          description: 'Specialized engineering operation',
          quantity: 1,
          unit: 'LS',
          unitRate: 250000,
          amount: 250000,
          tradeCategory: 'Technician',
          notes: ''
        }
      ]
    };
    setSections([...sections, newSection]);
    showToast('New section added.', 'success');
  };

  // Auto Save Background Action
  const handleAutoSave = async () => {
    try {
      const token = await getAuthToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const payload = {
        quotationRef,
        projectName,
        clientName,
        clientEmail,
        location,
        projectType,
        buildingFloors,
        date,
        preparedBy,
        approvedBy,
        status: status === 'FINAL' || status === 'APPROVED' ? status : 'DRAFT',
        currency,
        overheadPercent,
        contingencyPercent,
        profitPercent,
        discountPercent,
        taxPercent,
        baseSubtotal: totals.baseSubtotal,
        overheadAmount: totals.overheadAmount,
        contingencyAmount: totals.contingencyAmount,
        profitAmount: totals.profitAmount,
        discountAmount: totals.discountAmount,
        taxableNet: totals.taxableNet,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        paidAmount,
        balanceDue: totals.balanceDue,
        revisionNumber,
        sectionsData: totals.computedSections,
        revisionsHistory,
        auditLogsData: [
          ...auditLogs,
          { action: 'AUTO_SAVE', user: userName, timestamp: new Date().toLocaleTimeString() }
        ],
        notes
      };

      const url = labourId ? `/api/labour/calculations/${labourId}` : '/api/labour/calculations';
      const method = labourId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        const saved = await res.json();
        if (!labourId && saved.id) setLabourId(saved.id);
        setAutoSaveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.warn('Auto-save silent fallback:', e);
    }
  };

  // Manual Save (Draft or Final)
  const handleSave = async (saveStatus: 'DRAFT' | 'FINAL' | 'APPROVED' = 'DRAFT') => {
    if (isReadOnly) return;
    setSaving(true);
    try {
      const token = await getAuthToken();
      const headers: any = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const newAudit = {
        action: saveStatus === 'DRAFT' ? 'SAVE_DRAFT' : 'SAVE_FINAL',
        user: userName,
        role,
        timestamp: new Date().toLocaleString()
      };

      const newHistory = [
        ...revisionsHistory,
        {
          revision: revisionNumber,
          date: new Date().toLocaleString(),
          preparedBy,
          grandTotal: totals.grandTotal,
          status: saveStatus
        }
      ];

      const payload = {
        quotationRef,
        projectName,
        clientName,
        clientEmail,
        location,
        projectType,
        buildingFloors,
        date,
        preparedBy,
        approvedBy,
        status: saveStatus,
        currency,
        overheadPercent,
        contingencyPercent,
        profitPercent,
        discountPercent,
        taxPercent,
        baseSubtotal: totals.baseSubtotal,
        overheadAmount: totals.overheadAmount,
        contingencyAmount: totals.contingencyAmount,
        profitAmount: totals.profitAmount,
        discountAmount: totals.discountAmount,
        taxableNet: totals.taxableNet,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        paidAmount,
        balanceDue: totals.balanceDue,
        revisionNumber,
        sectionsData: totals.computedSections,
        revisionsHistory: newHistory,
        auditLogsData: [...auditLogs, newAudit],
        notes
      };

      const url = labourId ? `/api/labour/calculations/${labourId}` : '/api/labour/calculations';
      const method = labourId ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
      if (res.ok) {
        const saved = await res.json();
        setLabourId(saved.id);
        setStatus(saveStatus);
        setRevisionsHistory(newHistory);
        setAuditLogs([...auditLogs, newAudit]);
        showToast(
          saveStatus === 'DRAFT' ? 'Labour draft saved successfully!' : 'Labour calculation published as FINAL!',
          'success'
        );
        fetchCalculations();
      } else {
        throw new Error('Failed to save to backend database');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error saving calculation', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Duplicate / Clone Calculation
  const handleDuplicate = () => {
    setLabourId(null);
    setQuotationRef(`LAB-2026-${Math.floor(1000 + Math.random() * 9000)}`);
    setProjectName(`${projectName} (Copy)`);
    setStatus('DRAFT');
    setRevisionNumber('REV-01');
    showToast('Calculation duplicated! You are now editing a new copy.', 'info');
  };

  // Load an existing calculation
  const handleLoadCalculation = (calc: any) => {
    setLabourId(calc.id);
    setQuotationRef(calc.quotationRef);
    setProjectName(calc.projectName);
    setClientName(calc.clientName);
    setClientEmail(calc.clientEmail || '');
    setLocation(calc.location);
    setProjectType(calc.projectType);
    setBuildingFloors(Number(calc.buildingFloors) || 1);
    setDate(calc.date);
    setPreparedBy(calc.preparedBy);
    setApprovedBy(calc.approvedBy || '');
    setStatus(calc.status as any);
    setCurrency(calc.currency || 'XAF');
    setProfitPercent(Number(calc.profitPercent) || 15.0);
    setOverheadPercent(Number(calc.overheadPercent) || 10.0);
    setContingencyPercent(Number(calc.contingencyPercent) || 5.0);
    setDiscountPercent(Number(calc.discountPercent) || 0.0);
    setTaxPercent(Number(calc.taxPercent) || 19.25);
    setPaidAmount(Number(calc.paidAmount) || 0);
    setRevisionNumber(calc.revisionNumber || 'REV-01');
    setSections(calc.sectionsData || DEFAULT_SECTIONS);
    setRevisionsHistory(calc.revisionsHistory || []);
    setAuditLogs(calc.auditLogsData || []);
    setNotes(calc.notes || '');

    setMode('calculator');
    showToast(`Loaded calculation: ${calc.quotationRef}`, 'success');
  };

  // Soft Delete / Move to Trash
  const handleMoveToTrash = async (id?: number) => {
    const targetId = id || labourId;
    if (!targetId) return;

    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/labour/calculations/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...getCurrentSnapshot(), status: 'TRASH' })
      });
      if (res.ok) {
        showToast('Moved calculation to Trash.', 'info');
        fetchCalculations();
        if (targetId === labourId) setStatus('TRASH');
      }
    } catch (err) {
      showToast('Failed to move to Trash.', 'error');
    }
  };

  // Permanent Delete
  const handlePermanentDelete = async (id: number) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/labour/calculations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Calculation permanently deleted.', 'success');
        fetchCalculations();
      }
    } catch (e) {
      showToast('Delete failed.', 'error');
    }
  };

  // Email Send Handler
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientEmail) {
      showToast('Client Email is required.', 'error');
      return;
    }

    setSendingEmail(true);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/labour/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quotationRef,
          projectName,
          clientName,
          clientEmail,
          ccEmails: emailCc,
          bccEmails: emailBcc,
          grandTotal: totals.grandTotal,
          currency,
          preparedBy,
          notes
        })
      });

      if (res.ok) {
        showToast(`Quotation emailed to ${clientEmail}!`, 'success');
        setShowEmailModal(false);
        setAuditLogs([
          ...auditLogs,
          { action: 'EMAIL_SENT', user: userName, recipient: clientEmail, timestamp: new Date().toLocaleString() }
        ]);
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to send email.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error sending email.', 'error');
    } finally {
      setSendingEmail(false);
    }
  };

  // WhatsApp Share Message Generator
  const getWhatsAppMessage = () => {
    const text = `*MADECC GROUP S.A.R.L. — OFFICIAL LABOUR QUOTATION*
📋 *Ref:* ${quotationRef}
🏢 *Project:* ${projectName}
👤 *Client:* ${clientName}
📍 *Location:* ${location} (${buildingFloors} Floors)
📅 *Date:* ${date}

*FINANCIAL SUMMARY BREAKDOWN:*
• Base Labour Subtotal: ${totals.baseSubtotal.toLocaleString()} ${currency}
• Profit Margin (${profitPercent}%): ${totals.profitAmount.toLocaleString()} ${currency}
• Overhead & Logistics (${overheadPercent}%): ${totals.overheadAmount.toLocaleString()} ${currency}
• Tax / VAT (${taxPercent}%): ${totals.taxAmount.toLocaleString()} ${currency}
• *GRAND TOTAL NET:* *${totals.grandTotal.toLocaleString()} ${currency}*
• Advance Paid: ${paidAmount.toLocaleString()} ${currency}
• *BALANCE DUE:* *${totals.balanceDue.toLocaleString()} ${currency}*

_Prepared by ${preparedBy} (Civil Engineering Dept)_`;
    return encodeURIComponent(text);
  };

  // Data for Dashboard Recharts
  const categoryChartData = totals.computedSections.map((sec) => ({
    name: sec.sectionCode,
    title: sec.title.length > 18 ? sec.title.substring(0, 16) + '...' : sec.title,
    subtotal: sec.subtotal
  }));

  const statusPieData = [
    { name: 'Drafts', value: savedCalculations.filter((c) => c.status === 'DRAFT').length || 1, color: '#f59e0b' },
    { name: 'Approved / Final', value: savedCalculations.filter((c) => c.status === 'FINAL' || c.status === 'APPROVED').length || 2, color: '#10b981' },
    { name: 'Pending Review', value: savedCalculations.filter((c) => c.status === 'PENDING').length || 1, color: '#3b82f6' },
    { name: 'Archived', value: savedCalculations.filter((c) => c.status === 'ARCHIVED').length || 1, color: '#6b7280' }
  ];

  const exportPayload: LabourData = {
    id: labourId || undefined,
    quotationRef,
    projectName,
    clientName,
    clientEmail,
    location,
    projectType,
    buildingFloors,
    date,
    preparedBy,
    approvedBy,
    status,
    currency,
    overheadPercent,
    contingencyPercent,
    profitPercent,
    discountPercent,
    taxPercent,
    baseSubtotal: totals.baseSubtotal,
    overheadAmount: totals.overheadAmount,
    contingencyAmount: totals.contingencyAmount,
    profitAmount: totals.profitAmount,
    discountAmount: totals.discountAmount,
    taxableNet: totals.taxableNet,
    taxAmount: totals.taxAmount,
    grandTotal: totals.grandTotal,
    paidAmount,
    balanceDue: totals.balanceDue,
    revisionNumber,
    sections: totals.computedSections,
    notes
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* TOP HEADER & TOOLBAR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* BRAND & TITLE */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-amber-500">MADECC ERP</span>
                <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase">Labour Engine v3.2</span>
              </div>
              <h1 className="text-lg font-black text-white leading-tight">Labour BOQ & Rate Calculator</h1>
            </div>
          </div>

          {/* MODE TABS & ROLE BADGE */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMode('calculator')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'calculator' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Calculator</span>
            </button>

            <button
              onClick={() => setMode('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'dashboard' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setMode('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                mode === 'history' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Saved Estimates ({savedCalculations.length})</span>
            </button>
          </div>

          {/* ACTIONS & CONTROLS */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* UNDO / REDO */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={handleUndo}
                disabled={historyStack.length === 0}
                title="Undo (Ctrl+Z)"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={redoStack.length === 0}
                title="Redo (Ctrl+Y)"
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all"
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>

            {/* AUTO-SAVE STATUS */}
            {autoSaveTime && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3 h-3" /> Auto-saved {autoSaveTime}
              </span>
            )}

            {/* SAVE BUTTONS */}
            {!isReadOnly && (
              <>
                <button
                  onClick={() => handleSave('DRAFT')}
                  disabled={saving}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs uppercase transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-amber-400" />
                  <span>Save Draft</span>
                </button>

                <button
                  onClick={() => handleSave('FINAL')}
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-xs uppercase shadow-md shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Publish Final</span>
                </button>
              </>
            )}

            {/* EXPORTS & SHARING DROPDOWN / BUTTONS */}
            <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={() => generateLabourPdf(exportPayload, 'portrait')}
                className="p-1.5 rounded text-amber-400 hover:bg-slate-800 transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                title="Export PDF (Portrait)"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                onClick={async () => {
                  const { blob, filename } = await generateLabourDocx(exportPayload);
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = filename;
                  a.click();
                  showToast('Downloaded Word document (.docx)', 'success');
                }}
                className="p-1.5 rounded text-blue-400 hover:bg-slate-800 transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                title="Export Word (.docx)"
              >
                <FileText className="w-3.5 h-3.5" /> Word
              </button>
              <button
                onClick={() => generateLabourCsv(exportPayload)}
                className="p-1.5 rounded text-emerald-400 hover:bg-slate-800 transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                title="Export CSV (Excel)"
              >
                <TableIcon className="w-3.5 h-3.5" /> CSV
              </button>
              <button
                onClick={() => window.print()}
                className="p-1.5 rounded text-slate-300 hover:bg-slate-800 transition-all cursor-pointer text-xs font-bold"
                title="Print Layout"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* EMAIL & WHATSAPP BUTTONS */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs uppercase cursor-pointer flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Email</span>
            </button>

            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDuplicate}
              className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-white cursor-pointer"
              title="Duplicate / Clone Calculation"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* DISCLAIMER & ENGINEERING VALIDATION BANNER */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 sm:p-4 text-amber-300 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold uppercase tracking-wide block">Engineering Verification & Standards Policy:</span>
            <p className="text-amber-200/90 leading-relaxed">
              All calculations, unit rates, overheads, and profit markups are validated against applicable CCTG and ONIGC civil engineering norms. AI assists workflow automation and instant computation; all final engineering estimates remain subject to professional review and approval by a certified quantity surveyor.
            </p>
          </div>
        </div>

        {/* MODE 1: CALCULATOR STUDIO */}
        {mode === 'calculator' && (
          <div className="space-y-6">
            
            {/* PROJECT METADATA CARD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-white text-base">Project & Client Configuration</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Ref:</span>
                  <input
                    type="text"
                    value={quotationRef}
                    onChange={(e) => setQuotationRef(e.target.value)}
                    disabled={isReadOnly}
                    className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono font-bold text-amber-400 outline-none focus:border-amber-500"
                  />
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                    status === 'FINAL' || status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* INPUT FIELDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Project Name *</label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-500 transition-all"
                    placeholder="e.g. Douala Shopping Mall Labour"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Client Name *</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-500 transition-all"
                    placeholder="e.g. Horizon Real Estate S.A."
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Client Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-500 transition-all"
                    placeholder="e.g. client@example.cm"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-500 transition-all"
                    placeholder="e.g. Bonanjo, Douala"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Project Type</label>
                  <select
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium outline-none focus:border-amber-500 transition-all"
                  >
                    <option value="Commercial / Residential">Commercial / Residential</option>
                    <option value="Industrial Plant">Industrial Plant</option>
                    <option value="Infrastructure & Civil Works">Infrastructure & Civil Works</option>
                    <option value="Educational Facility">Educational Facility</option>
                    <option value="Healthcare Building">Healthcare Building</option>
                    <option value="Renovation & Modernization">Renovation & Modernization</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Building Floors</label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={buildingFloors}
                    onChange={(e) => setBuildingFloors(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Quotation Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wide mb-1">Prepared By (QS)</label>
                  <input
                    type="text"
                    value={preparedBy}
                    onChange={(e) => setPreparedBy(e.target.value)}
                    disabled={isReadOnly}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-medium outline-none focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* LIVE PROFIT & PERCENTAGE ADJUSTMENT CONTROLS */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-white text-base">Profit Margin & Percentage Adjustments</h2>
                </div>
                <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase">
                  ⚡ Updates All Totals Instantly
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                {/* PROFIT MARGIN % */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/40 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-black text-amber-400 uppercase tracking-wide">Profit Margin %</label>
                    <span className="text-amber-400 font-mono font-bold text-sm">{profitPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="0.5"
                    value={profitPercent}
                    onChange={(e) => setProfitPercent(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Amount:</span>
                    <span className="text-amber-400 font-bold">{totals.profitAmount.toLocaleString()} {currency}</span>
                  </div>
                </div>

                {/* OVERHEAD & LOGISTICS % */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-300 uppercase tracking-wide">Overhead & Logistics %</label>
                    <span className="text-white font-mono font-bold text-sm">{overheadPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    step="0.5"
                    value={overheadPercent}
                    onChange={(e) => setOverheadPercent(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Amount:</span>
                    <span className="text-slate-200 font-bold">{totals.overheadAmount.toLocaleString()} {currency}</span>
                  </div>
                </div>

                {/* CONTINGENCY & RISK % */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-300 uppercase tracking-wide">Site Contingency %</label>
                    <span className="text-white font-mono font-bold text-sm">{contingencyPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={contingencyPercent}
                    onChange={(e) => setContingencyPercent(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Amount:</span>
                    <span className="text-slate-200 font-bold">{totals.contingencyAmount.toLocaleString()} {currency}</span>
                  </div>
                </div>

                {/* DISCOUNT % */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-300 uppercase tracking-wide">Discount %</label>
                    <span className="text-rose-400 font-mono font-bold text-sm">{discountPercent}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="25"
                    step="0.5"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full accent-rose-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Discount:</span>
                    <span className="text-rose-400 font-bold">-{totals.discountAmount.toLocaleString()} {currency}</span>
                  </div>
                </div>

                {/* TAX / VAT % */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-slate-300 uppercase tracking-wide">Tax / VAT %</label>
                    <span className="text-emerald-400 font-mono font-bold text-sm">{taxPercent}%</span>
                  </div>
                  <input
                    type="number"
                    step="0.25"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    disabled={isReadOnly}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-white text-xs font-mono font-bold outline-none focus:border-amber-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>Tax:</span>
                    <span className="text-emerald-400 font-bold">{totals.taxAmount.toLocaleString()} {currency}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE LABOUR SECTIONS & ITEMS TABLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
              
              <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h2 className="font-extrabold text-white text-base">Detailed Labour Item Calculations</h2>
                </div>

                {!isReadOnly && (
                  <button
                    onClick={handleAddSection}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs uppercase shadow cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Labour Section
                  </button>
                )}
              </div>

              {/* SECTIONS LOOP */}
              <div className="divide-y divide-slate-800">
                {sections.map((sec, secIdx) => (
                  <div key={sec.id || secIdx} className="p-4 sm:p-6 space-y-4 bg-slate-950/40">
                    
                    {/* SECTION HEADER BAR */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <input
                          type="text"
                          value={sec.sectionCode}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            const newSecs = [...sections];
                            newSecs[secIdx].sectionCode = e.target.value;
                            setSections(newSecs);
                          }}
                          className="w-14 bg-slate-950 border border-slate-800 rounded text-center py-1 font-mono font-bold text-amber-400 text-xs outline-none"
                        />
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => {
                            if (isReadOnly) return;
                            const newSecs = [...sections];
                            newSecs[secIdx].title = e.target.value;
                            setSections(newSecs);
                          }}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1 text-white font-extrabold text-sm outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold text-slate-300">
                          Subtotal: <span className="text-amber-400 text-sm">{totals.computedSections[secIdx]?.subtotal.toLocaleString()} {currency}</span>
                        </span>

                        {!isReadOnly && (
                          <button
                            onClick={() => {
                              if (sections.length <= 1) {
                                showToast('At least one section is required.', 'error');
                                return;
                              }
                              setSections(sections.filter((_, i) => i !== secIdx));
                              showToast('Section removed.', 'info');
                            }}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                            title="Delete Section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                          <tr>
                            <th className="py-2.5 px-3 w-14 text-center">Code</th>
                            <th className="py-2.5 px-3">Labour Task Description</th>
                            <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                            <th className="py-2.5 px-3 w-24 text-center">Unit</th>
                            <th className="py-2.5 px-3 w-28 text-right">Unit Rate ({currency})</th>
                            <th className="py-2.5 px-3 w-32 text-right">Computed Total ({currency})</th>
                            {!isReadOnly && <th className="py-2.5 px-3 w-10 text-center"></th>}
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-850">
                          {sec.items.map((item, itemIdx) => {
                            const computedAmount = (Number(item.quantity) || 0) * (Number(item.unitRate) || 0);
                            return (
                              <tr key={item.id || itemIdx} className="hover:bg-slate-900/60 transition-colors">
                                <td className="p-2 text-center">
                                  <input
                                    type="text"
                                    value={item.itemNumber}
                                    onChange={(e) => handleItemChange(secIdx, itemIdx, 'itemNumber', e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full text-center bg-transparent border border-transparent hover:border-slate-800 focus:border-amber-500 rounded py-1 font-mono font-bold text-slate-300 outline-none"
                                  />
                                </td>

                                <td className="p-2">
                                  <input
                                    type="text"
                                    value={item.description}
                                    onChange={(e) => handleItemChange(secIdx, itemIdx, 'description', e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full bg-transparent border border-transparent hover:border-slate-800 focus:border-amber-500 rounded py-1 text-white font-medium outline-none"
                                  />
                                </td>

                                <td className="p-2 text-right">
                                  <input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(secIdx, itemIdx, 'quantity', e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full text-right bg-transparent border border-transparent hover:border-slate-800 focus:border-amber-500 rounded py-1 font-mono font-bold text-slate-200 outline-none"
                                  />
                                </td>

                                <td className="p-2 text-center">
                                  <select
                                    value={item.unit}
                                    onChange={(e) => handleItemChange(secIdx, itemIdx, 'unit', e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full bg-slate-900 border border-slate-800 rounded py-1 text-center font-mono text-slate-300 outline-none text-[11px]"
                                  >
                                    <option value="Man-Days">Man-Days</option>
                                    <option value="Hours">Hours</option>
                                    <option value="m²">m²</option>
                                    <option value="m³">m³</option>
                                    <option value="LS">LS</option>
                                    <option value="Days">Days</option>
                                  </select>
                                </td>

                                <td className="p-2 text-right">
                                  <input
                                    type="number"
                                    value={item.unitRate}
                                    onChange={(e) => handleItemChange(secIdx, itemIdx, 'unitRate', e.target.value)}
                                    disabled={isReadOnly}
                                    className="w-full text-right bg-transparent border border-transparent hover:border-slate-800 focus:border-amber-500 rounded py-1 font-mono font-bold text-amber-400 outline-none"
                                  />
                                </td>

                                <td className="p-2 text-right font-mono font-extrabold text-white text-sm">
                                  {computedAmount.toLocaleString()}
                                </td>

                                {!isReadOnly && (
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => handleDeleteItem(secIdx, itemIdx)}
                                      className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer transition-colors"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {!isReadOnly && (
                      <button
                        onClick={() => handleAddItem(secIdx)}
                        className="bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Task Line Item
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* INSTANT FINANCIAL CALCULATION SUMMARY CARD */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
              <h2 className="font-extrabold text-white text-base border-b border-slate-800 pb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>Financial Calculation Summary Statement</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Base Labour Subtotal:</span>
                  <span className="text-lg font-black text-white">{totals.baseSubtotal.toLocaleString()} {currency}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Profit Amount ({profitPercent}%):</span>
                  <span className="text-lg font-black text-amber-400">{totals.profitAmount.toLocaleString()} {currency}</span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-slate-400 block uppercase font-bold text-[10px]">Tax Amount ({taxPercent}%):</span>
                  <span className="text-lg font-black text-emerald-400">{totals.taxAmount.toLocaleString()} {currency}</span>
                </div>

                <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/40 space-y-1">
                  <span className="text-amber-400 block uppercase font-black text-[10px]">GRAND TOTAL NET:</span>
                  <span className="text-2xl font-black text-amber-400">{totals.grandTotal.toLocaleString()} {currency}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* MODE 2: DASHBOARD & METRICS */}
        {mode === 'dashboard' && (
          <div className="space-y-6">
            
            {/* STATS CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Today's Calculations</span>
                <span className="text-3xl font-black text-white font-mono">{savedCalculations.length + 1}</span>
                <p className="text-emerald-400 text-[10px] font-bold">↑ Active calculations loaded</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Monthly Labour Cost</span>
                <span className="text-3xl font-black text-amber-400 font-mono">{(totals.grandTotal * 2.5).toLocaleString()} {currency}</span>
                <p className="text-amber-400/80 text-[10px] font-bold">Estimated monthly capacity</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Pending Quotations</span>
                <span className="text-3xl font-black text-blue-400 font-mono">
                  {savedCalculations.filter((c) => c.status === 'PENDING' || c.status === 'DRAFT').length || 1}
                </span>
                <p className="text-slate-400 text-[10px]">Awaiting final engineering stamp</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <span className="text-slate-400 uppercase font-bold text-[10px] block">Completed & Approved</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {savedCalculations.filter((c) => c.status === 'FINAL' || c.status === 'APPROVED').length || 1}
                </span>
                <p className="text-emerald-400 text-[10px]">Certified ready for site execution</p>
              </div>
            </div>

            {/* RECHARTS VISUALIZATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* CATEGORY COST ALLOCATION BAR CHART */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-400" />
                  <span>Labour Cost Allocation by Section</span>
                </h3>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="title" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="subtotal" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* QUOTATION STATUS DISTRIBUTION PIE CHART */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <h3 className="font-extrabold text-white text-sm flex items-center gap-2">
                  <PieIcon className="w-4 h-4 text-amber-400" />
                  <span>Quotation Pipeline Status Breakdown</span>
                </h3>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* MODE 3: SAVED ESTIMATES & HISTORY */}
        {mode === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <h2 className="font-extrabold text-white text-base flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <span>Saved Labour Estimations Archive ({savedCalculations.length})</span>
              </h2>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by project or client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-amber-500 w-60"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="FINAL">Final / Approved</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
            </div>

            {/* LIST TABLE */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Ref Code</th>
                    <th className="py-3 px-4">Project Name</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Grand Total Net</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-850">
                  {savedCalculations
                    .filter((c) => {
                      const matchesSearch =
                        c.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        c.quotationRef.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
                      return matchesSearch && matchesStatus;
                    })
                    .map((calc) => (
                      <tr key={calc.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="p-4 font-mono font-bold text-amber-400">{calc.quotationRef}</td>
                        <td className="p-4 font-bold text-white">{calc.projectName}</td>
                        <td className="p-4 text-slate-300">{calc.clientName}</td>
                        <td className="p-4 font-mono font-black text-amber-400">
                          {formatCurrency(calc.grandTotal || 0, calc.currency || 'XAF')}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${
                            calc.status === 'FINAL' || calc.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {calc.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 font-mono">{calc.date}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleLoadCalculation(calc)}
                              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1 rounded text-[10px] uppercase cursor-pointer transition-all"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleMoveToTrash(calc.id)}
                              className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* MODAL 1: DIRECT EMAIL QUOTATION */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="font-extrabold text-lg text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-400" /> Email Labour Quotation
            </h3>

            <form onSubmit={handleSendEmail} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">To Client Email *</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-medium outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">CC Emails (Optional)</label>
                <input
                  type="text"
                  value={emailCc}
                  onChange={(e) => setEmailCc(e.target.value)}
                  placeholder="e.g. manager@madecc.cm, finance@madecc.cm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">BCC Emails (Optional)</label>
                <input
                  type="text"
                  value={emailBcc}
                  onChange={(e) => setEmailBcc(e.target.value)}
                  placeholder="e.g. audit@madecc.cm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-amber-500 font-mono text-[11px]"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono space-y-1">
                <span className="text-amber-400 font-bold block">Summary Preview:</span>
                <div>Ref: {quotationRef}</div>
                <div>Project: {projectName}</div>
                <div>Grand Total: {totals.grandTotal.toLocaleString()} {currency}</div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="bg-slate-800 text-slate-300 font-bold py-2 px-4 rounded-xl uppercase text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 px-5 rounded-xl uppercase text-xs cursor-pointer shadow"
                >
                  {sendingEmail ? 'Sending...' : 'Send Quotation Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WHATSAPP SHARE */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowWhatsAppModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <h3 className="font-extrabold text-lg text-white border-b border-slate-800 pb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" /> Share via WhatsApp
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Target Phone Number (with Country Code)</label>
                <input
                  type="text"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="e.g. 237690000000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase mb-1">Message Preview</label>
                <textarea
                  readOnly
                  rows={8}
                  value={decodeURIComponent(getWhatsAppMessage())}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-300 font-mono text-[11px] outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(decodeURIComponent(getWhatsAppMessage()));
                    showToast('WhatsApp message snippet copied to clipboard!', 'success');
                  }}
                  className="bg-slate-800 text-slate-200 font-bold py-2 px-4 rounded-xl uppercase text-xs cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Text
                </button>

                <a
                  href={`https://wa.me/${whatsappPhone.replace(/[^0-9]/g, '')}?text=${getWhatsAppMessage()}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2 px-5 rounded-xl uppercase text-xs cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Open WhatsApp Direct
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function TableIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18"/>
      <rect width="18" height="18" x="3" y="3" rx="2"/>
      <path d="M3 9h18"/>
      <path d="M3 15h18"/>
    </svg>
  );
}
