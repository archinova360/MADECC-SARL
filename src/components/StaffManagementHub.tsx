import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  ShieldCheck, 
  UserPlus, 
  FileText, 
  Lock, 
  Unlock, 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  Briefcase, 
  Award, 
  DollarSign, 
  RefreshCw, 
  Plus, 
  Search, 
  Eye, 
  Copy, 
  Clock, 
  ShieldAlert, 
  FileCheck, 
  Bell, 
  Sparkles, 
  Check, 
  Calendar,
  Layers,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  UserX,
  ChevronRight,
  ChevronDown,
  Activity,
  TrendingUp,
  Download,
  Filter,
  CheckSquare,
  XSquare,
  Settings,
  Siren,
  Sliders,
  ExternalLink,
  RotateCcw,
  RotateCw,
  Edit3,
  Trash2,
  Archive,
  CheckCircle2,
  CopyCheck,
  FileSpreadsheet,
  Save,
  DownloadCloud,
  X,
  FileBadge,
  Printer
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { getAuthToken } from '../lib/firebase.ts';
import {
  generateStaffDirectoryPdf,
  generateStaffDirectoryDocx,
  generateIndividualStaffDossierPdf,
  generateIndividualStaffDossierDocx
} from '../utils/staffExport';

interface StaffManagementHubProps {
  currentUser?: any;
  userRole?: string;
}

const DEFAULT_STAFF_PROFILES = [
  {
    id: 1,
    employeeNumber: 'EMP-2026-001',
    fullName: 'Ing. Marcel Mbida, PE (ONIGC 4092)',
    email: 'marcel.mbida@madeccgroup.com',
    department: 'Quantity Surveying',
    position: 'Chief Quantity Surveyor & Managing Director',
    salaryXaf: 1850000,
    allowancesXaf: 350000,
    bankDetails: 'BICEC Douala Main - Acc #004829104',
    engineeringRegistration: 'ONIGC Reg #4092',
    skills: ['BOQ Measurement', 'FIDIC Red Book', 'Cost Control', 'IPC Valuations', 'Rate Analysis'],
    certifications: ['ONIGC PE Registered', 'RICS Fellow'],
    status: 'ACTIVE',
    reportingManager: 'Board of Directors'
  },
  {
    id: 2,
    employeeNumber: 'EMP-2026-002',
    fullName: 'Ing. Arthur Sterling, PE',
    email: 'arthur.sterling@madeccgroup.com',
    department: 'Engineering',
    position: 'Technical Director & Chief Structural Engineer',
    salaryXaf: 1750000,
    allowancesXaf: 300000,
    bankDetails: 'UBA Yaoundé Central - Acc #002819401',
    engineeringRegistration: 'ONIGC Reg #3812',
    skills: ['Eurocode EN 1992', 'Structural Audits', '3D BIM Modelling', 'Finite Element Analysis'],
    certifications: ['ONIGC PE Registered', 'Chartered Structural Engineer'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Marcel Mbida, PE'
  },
  {
    id: 3,
    employeeNumber: 'EMP-2026-003',
    fullName: 'Mme. Christine Ngo Ndom',
    email: 'christine.ndom@madeccgroup.com',
    department: 'Quantity Surveying',
    position: 'Commercial Manager & Senior Cost Consultant',
    salaryXaf: 1450000,
    allowancesXaf: 250000,
    bankDetails: 'Afriland First Bank Douala - Acc #001928374',
    engineeringRegistration: 'RICS Reg Valuer #9102',
    skills: ['Rate Analysis', 'Tender Breakdown', 'Contract Variance Analysis', 'Cash Flow Forecasting'],
    certifications: ['RICS Certified Quantity Surveyor', 'AACE Certified Cost Professional'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Marcel Mbida, PE'
  },
  {
    id: 4,
    employeeNumber: 'EMP-2026-004',
    fullName: 'Ing. Jean-Luc Abena',
    email: 'jeanluc.abena@madeccgroup.com',
    department: 'Quantity Surveying',
    position: 'Senior Quantity Surveyor (Tenders & Valuations)',
    salaryXaf: 1200000,
    allowancesXaf: 200000,
    bankDetails: 'SGBC Douala Bonanjo - Acc #003847281',
    engineeringRegistration: 'ONIGC Reg #5120',
    skills: ['Sub-structure Measurement', 'Rebar Bending Schedule', 'Quantity Take-Off', 'AutoCAD'],
    certifications: ['ONIGC Registered Engineer', 'Quantity Surveying Cert'],
    status: 'ACTIVE',
    reportingManager: 'Mme. Christine Ngo Ndom'
  },
  {
    id: 5,
    employeeNumber: 'EMP-2026-005',
    fullName: 'Mme. Diane Kuate',
    email: 'diane.kuate@madeccgroup.com',
    department: 'Executive',
    position: 'Senior HR & Talent Operations Manager',
    salaryXaf: 1150000,
    allowancesXaf: 180000,
    bankDetails: 'Ecobank Yaoundé - Acc #005829102',
    engineeringRegistration: 'HRCI Certified Senior HR',
    skills: ['CNPS Compliance', 'Labor Law Governance', 'RBAC Security Audits', 'Payroll Management'],
    certifications: ['Senior SHRM Professional', 'HRCI Certified Specialist'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Marcel Mbida, PE'
  },
  {
    id: 6,
    employeeNumber: 'EMP-2026-006',
    fullName: 'Ing. Patrick Mbarga',
    email: 'patrick.mbarga@madeccgroup.com',
    department: 'Site Management',
    position: 'Resident Site Civil Engineer (Douala Deepwater Port)',
    salaryXaf: 1100000,
    allowancesXaf: 220000,
    bankDetails: 'BICEC Douala Akwa - Acc #002948102',
    engineeringRegistration: 'ONIGC Reg #5891',
    skills: ['Site Log Auditing', 'Concrete Slump Testing', 'Subcontractor Supervision', 'Site Safety'],
    certifications: ['ONIGC Registered Engineer', 'Site Safety Inspector'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Arthur Sterling, PE'
  },
  {
    id: 7,
    employeeNumber: 'EMP-2026-007',
    fullName: 'Ing. Samuel Eto\'o Ndongo',
    email: 'samuel.ndongo@madeccgroup.com',
    department: 'Finance',
    position: 'Procurement & Materials Logistics Director',
    salaryXaf: 1300000,
    allowancesXaf: 220000,
    bankDetails: 'CBC Bank Douala - Acc #004920194',
    engineeringRegistration: 'CIPS Supply Chain Lead',
    skills: ['Cement & Rebar Sourcing', 'Supplier Contract Negotiation', 'Logistics Optimization', 'ERP Inventory'],
    certifications: ['CIPS Fellow', 'Supply Chain Director'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Marcel Mbida, PE'
  },
  {
    id: 8,
    employeeNumber: 'EMP-2026-008',
    fullName: 'Mme. Vanessa Bella',
    email: 'vanessa.bella@madeccgroup.com',
    department: 'Executive',
    position: 'Head of Legal, Compliance & Contract Claims',
    salaryXaf: 1400000,
    allowancesXaf: 250000,
    bankDetails: 'Standard Chartered Bank - Acc #001294810',
    engineeringRegistration: 'Bar Association Senior Counsel',
    skills: ['FIDIC Contracts', 'Public Procurement Code', 'Arbitration & Litigation', 'Dispute Adjudication'],
    certifications: ['LLM International Construction Law', 'FIDIC Accredited Claims Adjudicator'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Marcel Mbida, PE'
  },
  {
    id: 9,
    employeeNumber: 'EMP-2026-009',
    fullName: 'Ing. Emmanuel Tchakounte',
    email: 'emmanuel.tchakounte@madeccgroup.com',
    department: 'Engineering',
    position: 'Senior MEP & HVAC Structural Engineer',
    salaryXaf: 1180000,
    allowancesXaf: 190000,
    bankDetails: 'UBA Douala - Acc #003920194',
    engineeringRegistration: 'ONIGC Reg #6021',
    skills: ['High-Voltage Electrical Grids', 'Plumbing & Piping Sizing', 'HVAC Load Analysis', 'Fire Suppression'],
    certifications: ['ONIGC PE Registered', 'MEP Design Master'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Arthur Sterling, PE'
  },
  {
    id: 10,
    employeeNumber: 'EMP-2026-010',
    fullName: 'Mme. Solange Nguema',
    email: 'solange.nguema@madeccgroup.com',
    department: 'HSE',
    position: 'Health, Safety & Environmental (HSE) Inspection Manager',
    salaryXaf: 1050000,
    allowancesXaf: 170000,
    bankDetails: 'Afriland Yaoundé - Acc #002910482',
    engineeringRegistration: 'NEBOSH Certified Auditor',
    skills: ['ISO 45001 Compliance', 'Site Safety Inspections', 'Environmental Risk Mitigation', 'Incident Auditing'],
    certifications: ['NEBOSH Diploma', 'ISO 14001 Auditor'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Arthur Sterling, PE'
  },
  {
    id: 11,
    employeeNumber: 'EMP-2026-011',
    fullName: 'Ing. Frank Tchato',
    email: 'frank.tchato@madeccgroup.com',
    department: 'Engineering',
    position: 'BIM & Automated Quantity Take-Off Specialist',
    salaryXaf: 1120000,
    allowancesXaf: 180000,
    bankDetails: 'BICEC Yaoundé - Acc #001948201',
    engineeringRegistration: 'Autodesk Certified Professional',
    skills: ['Revit 3D BIM', 'Civil 3D Alignment', 'Laser Point Cloud Processing', 'Automated BOQ Extraction'],
    certifications: ['Autodesk BIM Specialist', 'ONIGC Associate'],
    status: 'ACTIVE',
    reportingManager: 'Ing. Arthur Sterling, PE'
  },
  {
    id: 12,
    employeeNumber: 'EMP-2026-012',
    fullName: 'Mme. Rose Mballa',
    email: 'rose.mballa@madeccgroup.com',
    department: 'Finance',
    position: 'Enterprise ERP Systems Administrator & Financial Auditor',
    salaryXaf: 1250000,
    allowancesXaf: 200000,
    bankDetails: 'SGBC Yaoundé - Acc #004928103',
    engineeringRegistration: 'CISA Certified Information Systems Auditor',
    skills: ['PostgreSQL ERP Auditing', 'Financial Reconciliation', 'RBAC Matrix Controls', 'System Logs'],
    certifications: ['CISA Auditor', 'SAP Financial Specialist'],
    status: 'ACTIVE',
    reportingManager: 'Mme. Diane Kuate'
  }
];

const DEFAULT_ACCESS_KEYS = DEFAULT_STAFF_PROFILES.map((p) => ({
  id: p.id,
  employeeNumber: p.employeeNumber,
  loginKey: `MDCC-${p.department.slice(0, 3).toUpperCase()}-${p.employeeNumber.slice(-3)}K9A2`,
  email: p.email,
  username: p.email.split('@')[0],
  fullName: p.fullName,
  department: p.department,
  position: p.position,
  status: 'ACTIVATED',
  assignedProjects: ['Douala Bridge Phase 2', 'Sanaga Deepwater Terminal', 'Yaoundé Smart City HQ'],
  createdAt: '2026-01-15T08:00:00.000Z'
}));

export default function StaffManagementHub({ currentUser, userRole = 'admin' }: StaffManagementHubProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<
    | 'staff-dashboard'
    | 'staff-provisioning'
    | 'employee-lifecycle'
    | 'rbac-matrix'
    | 'staff-directory'
    | 'org-chart'
    | 'activation-portal'
    | 'notifications-announcements'
    | 'audit-security-logs'
    | 'performance-kpi'
  >('staff-dashboard');

  // Data states
  const [accessKeys, setAccessKeys] = useState<any[]>(DEFAULT_ACCESS_KEYS);
  const [hrProfiles, setHrProfiles] = useState<any[]>(DEFAULT_STAFF_PROFILES);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<any[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Single-Display Created Key Modal (Cryptographic Access Key Security)
  const [createdKeyModalData, setCreatedKeyModalData] = useState<any | null>(null);

  // Form: Provision New Employee
  const [showProvisionModal, setShowProvisionModal] = useState<boolean>(false);
  const [empFullName, setEmpFullName] = useState<string>('');
  const [empEmail, setEmpEmail] = useState<string>('');
  const [empUsername, setEmpUsername] = useState<string>('');
  const [empDept, setEmpDept] = useState<string>('Engineering');
  const [empPos, setEmpPos] = useState<string>('Senior QS Engineer');
  const [empTempPass, setEmpTempPass] = useState<string>('');
  const [empExpiryDays, setEmpExpiryDays] = useState<number>(7);
  const [empProjects, setEmpProjects] = useState<string[]>(['PROJECT-001', 'Douala Bridge Phase 2']);
  const [empPermissions, setEmpPermissions] = useState<string[]>([
    'boq_read', 'boq_write', 'takeoff_view', 'site_logs', 'procurement_read'
  ]);

  // Form: Activation Portal
  const [actLoginKey, setActLoginKey] = useState<string>('');
  const [actTempPass, setActTempPass] = useState<string>('');
  const [actNewPass, setActNewPass] = useState<string>('');
  const [actPhotoUrl, setActPhotoUrl] = useState<string>('');
  const [actSignatureUrl, setActSignatureUrl] = useState<string>('');
  const [actSuccessMsg, setActSuccessMsg] = useState<string>('');

  // Form: HR Profile View / Edit Modal
  const [selectedProfile, setSelectedProfile] = useState<any>(null);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [hrSalary, setHrSalary] = useState<number>(850000);
  const [hrAllowances, setHrAllowances] = useState<number>(150000);
  const [hrCertifications, setHrCertifications] = useState<string>('ONIGC Registered Engineer #4829, RICS Fellow');
  const [hrSkills, setHrSkills] = useState<string>('Eurocode 2, Civil 3D, BOQ Preparation, Contract Law');
  const [hrBank, setHrBank] = useState<string>('BICEC Douala Main Branch - Account #004829104');
  const [hrReportingManager, setHrReportingManager] = useState<string>('Managing Director');

  // Form: Post Announcement
  const [showAnnounceModal, setShowAnnounceModal] = useState<boolean>(false);
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');
  const [annPriority, setAnnPriority] = useState<string>('NORMAL');
  const [annDept, setAnnDept] = useState<string>('ALL');

  // Form: Performance Review Modal
  const [showPerfModal, setShowPerfModal] = useState<boolean>(false);
  const [perfEmpNum, setPerfEmpNum] = useState<string>('');
  const [perfPeriod, setPerfPeriod] = useState<string>('Q1 2026');
  const [perfKpiScore, setPerfKpiScore] = useState<number>(88);
  const [perfQualityScore, setPerfQualityScore] = useState<number>(92);
  const [perfSafetyScore, setPerfSafetyScore] = useState<number>(98);
  const [perfComments, setPerfComments] = useState<string>('Exceptional engineering precision on Douala Bypass Structural Audit.');

  // Form: RBAC Matrix Selection
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>('Quantity Surveyor');
  const [matrixPermissions, setMatrixPermissions] = useState<Record<string, Record<string, boolean>>>({
    'boq': { view: true, create: true, edit: true, approve: true, export: true, delete: false },
    'takeoff': { view: true, create: true, edit: true, approve: false, export: true, delete: false },
    'structural': { view: true, create: false, edit: false, approve: false, export: true, delete: false },
    'payroll': { view: false, create: false, edit: false, approve: false, export: false, delete: false },
    'users': { view: false, create: false, edit: false, approve: false, export: false, delete: false }
  });

  const getHeaders = async () => {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const [resKeys, resProfs, resAudits, resNews, resRoles, resNotifs, resHist, resPerf, resTrain] = await Promise.all([
        fetch('/api/staff/access-keys', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/staff/profiles', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/staff/audit-logs', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/staff/announcements').then(r => r.ok ? r.json() : []),
        fetch('/api/staff/roles', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/staff/notifications', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/staff/login-history', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/staff/performance', { headers }).then(r => r.ok ? r.json() : []),
        fetch('/api/staff/training', { headers }).then(r => r.ok ? r.json() : [])
      ]);

      setAccessKeys(resKeys && resKeys.length > 0 ? resKeys : DEFAULT_ACCESS_KEYS);
      setHrProfiles(resProfs && resProfs.length > 0 ? resProfs : DEFAULT_STAFF_PROFILES);
      setAuditLogs(resAudits || []);
      setAnnouncements(resNews || []);
      setRoles(resRoles || []);
      setNotifications(resNotifs || []);
      setLoginHistory(resHist || []);
      setPerformanceReviews(resPerf || []);
      setTrainingRecords(resTrain || []);
    } catch (err) {
      console.error('Error loading staff platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  // Handle Provisioning Employee Account
  const handleProvisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/staff/access-keys', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fullName: empFullName,
          email: empEmail,
          username: empUsername || empEmail.split('@')[0],
          department: empDept,
          position: empPos,
          tempPassword: empTempPass || `Mdcc2026#${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDays: empExpiryDays,
          assignedProjects: empProjects,
          assignedPermissions: empPermissions
        })
      });

      if (res.ok) {
        const created = await res.json();
        // Show plain key ONLY ONCE in modal
        setCreatedKeyModalData(created);
        setShowProvisionModal(false);
        setEmpFullName('');
        setEmpEmail('');
        setEmpUsername('');
        fetchStaffData();
      } else {
        const err = await res.json();
        if (showToast) showToast(err.error || 'Failed provisioning account', 'error');
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Server error', 'error');
    }
  };

  // Handle Re-generating Access Key
  const handleRegenerateKey = async (id: number) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/staff/access-keys/${id}/regenerate`, {
        method: 'POST',
        headers
      });

      if (res.ok) {
        const updated = await res.json();
        setCreatedKeyModalData(updated);
        fetchStaffData();
      } else {
        if (showToast) showToast('Failed re-generating key', 'error');
      }
    } catch (err) {
      if (showToast) showToast('Server error re-generating key', 'error');
    }
  };

  // Handle Account Status Update (Suspend, Activate, Revoke, Disable, Terminate)
  const handleUpdateKeyStatus = async (id: number, newStatus: string) => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/staff/access-keys/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        if (showToast) showToast(`Account status updated to ${newStatus}`, 'success');
        fetchStaffData();
      }
    } catch (err: any) {
      if (showToast) showToast('Failed updating status', 'error');
    }
  };

  // Handle Employee Account Activation
  const handleAccountActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loginKey: actLoginKey,
          tempPassword: actTempPass,
          newPassword: actNewPass,
          photoUrl: actPhotoUrl,
          signatureUrl: actSignatureUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        setActSuccessMsg(data.message);
        if (showToast) showToast('Account successfully activated!', 'success');
        setActLoginKey('');
        setActTempPass('');
        setActNewPass('');
        fetchStaffData();
      } else {
        if (showToast) showToast(data.error || 'Activation failed', 'error');
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Activation failed', 'error');
    }
  };

  // Handle Update HR Profile
  const handleSaveHrProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/staff/profiles', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeNumber: selectedProfile.employeeNumber,
          email: selectedProfile.email,
          fullName: selectedProfile.fullName,
          department: selectedProfile.department,
          position: selectedProfile.position,
          reportingManager: hrReportingManager,
          salaryXaf: hrSalary,
          allowancesXaf: hrAllowances,
          bankDetails: hrBank,
          skills: hrSkills.split(',').map(s => s.trim()),
          certifications: hrCertifications.split(',').map(s => s.trim())
        })
      });

      if (res.ok) {
        if (showToast) showToast('Employee HR Profile updated successfully!', 'success');
        setShowProfileModal(false);
        fetchStaffData();
      }
    } catch (err: any) {
      if (showToast) showToast('Failed updating profile', 'error');
    }
  };

  // Handle Submit Performance Review
  const handleSavePerformanceReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!perfEmpNum) return;
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/staff/performance', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          employeeNumber: perfEmpNum,
          reviewPeriod: perfPeriod,
          kpiScore: perfKpiScore,
          qualityRating: perfQualityScore,
          safetyRating: perfSafetyScore,
          comments: perfComments
        })
      });

      if (res.ok) {
        if (showToast) showToast('Performance review recorded in staff ledger', 'success');
        setShowPerfModal(false);
        fetchStaffData();
      }
    } catch (err) {
      if (showToast) showToast('Failed submitting review', 'error');
    }
  };

  // Handle Post Announcement
  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/staff/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          priority: annPriority,
          department: annDept
        })
      });

      if (res.ok) {
        if (showToast) showToast('Announcement published to company staff portal', 'success');
        setShowAnnounceModal(false);
        setAnnTitle('');
        setAnnContent('');
        fetchStaffData();
      }
    } catch (err: any) {
      if (showToast) showToast('Failed posting notice', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    if (showToast) showToast(`Copied ${text} to clipboard`, 'info');
  };

  // Export Audit Trail as CSV
  const exportAuditLogsCsv = () => {
    if (auditLogs.length === 0) return;
    const csvRows = [
      ['ID', 'Admin User', 'Target Employee', 'Action', 'Module', 'IP Address', 'Details', 'Timestamp'].join(','),
      ...auditLogs.map(l => [
        l.id,
        `"${l.adminUser || ''}"`,
        `"${l.targetEmployee || ''}"`,
        `"${l.action || ''}"`,
        `"${l.module || ''}"`,
        `"${l.ipAddress || ''}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
        `"${new Date(l.createdAt).toLocaleString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MADECC_Staff_Audit_Logs_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    if (showToast) showToast('Audit logs exported to CSV file', 'success');
  };

  // --- STATE HISTORY FOR UNDO / REDO ---
  const [historyStack, setHistoryStack] = useState<Array<{ accessKeys: any[]; hrProfiles: any[] }>>([]);
  const [redoStack, setRedoStack] = useState<Array<{ accessKeys: any[]; hrProfiles: any[] }>>([]);

  const pushStateSnapshot = () => {
    setHistoryStack(prev => [
      ...prev,
      {
        accessKeys: JSON.parse(JSON.stringify(accessKeys)),
        hrProfiles: JSON.parse(JSON.stringify(hrProfiles))
      }
    ]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (historyStack.length === 0) {
      if (showToast) showToast('No actions to undo', 'info');
      return;
    }
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack(prev => prev.slice(0, prev.length - 1));
    setRedoStack(prev => [
      ...prev,
      {
        accessKeys: JSON.parse(JSON.stringify(accessKeys)),
        hrProfiles: JSON.parse(JSON.stringify(hrProfiles))
      }
    ]);
    setAccessKeys(previous.accessKeys);
    setHrProfiles(previous.hrProfiles);
    if (showToast) showToast('Undo operation applied', 'success');
  };

  const handleRedo = () => {
    if (redoStack.length === 0) {
      if (showToast) showToast('No actions to redo', 'info');
      return;
    }
    const next = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, prev.length - 1));
    setHistoryStack(prev => [
      ...prev,
      {
        accessKeys: JSON.parse(JSON.stringify(accessKeys)),
        hrProfiles: JSON.parse(JSON.stringify(hrProfiles))
      }
    ]);
    setAccessKeys(next.accessKeys);
    setHrProfiles(next.hrProfiles);
    if (showToast) showToast('Redo operation applied', 'success');
  };

  // --- EDIT STAFF MODAL STATE & HANDLERS ---
  const [showFullEditModal, setShowFullEditModal] = useState<boolean>(false);
  const [editingStaffId, setEditingStaffId] = useState<any>(null);
  const [editFullName, setEditFullName] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editDept, setEditDept] = useState<string>('Engineering');
  const [editPos, setEditPos] = useState<string>('Senior Quantity Surveyor');
  const [editSalary, setEditSalary] = useState<number>(850000);
  const [editAllowances, setEditAllowances] = useState<number>(150000);
  const [editBank, setEditBank] = useState<string>('');
  const [editEngReg, setEditEngReg] = useState<string>('');
  const [editSkills, setEditSkills] = useState<string>('');
  const [editCerts, setEditCerts] = useState<string>('');
  const [editManager, setEditManager] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('ACTIVE');
  const [editApproval, setEditApproval] = useState<string>('APPROVED');

  const handleOpenEditStaff = (staff: any) => {
    setEditingStaffId(staff.id || staff.employeeNumber);
    setEditFullName(staff.fullName || '');
    setEditEmail(staff.email || '');
    setEditDept(staff.department || 'Engineering');
    setEditPos(staff.position || 'Senior Quantity Surveyor');
    setEditSalary(Number(staff.salaryXaf || 850000));
    setEditAllowances(Number(staff.allowancesXaf || 150000));
    setEditBank(staff.bankDetails || 'BICEC Douala Main Branch');
    setEditEngReg(staff.engineeringRegistration || 'ONIGC #4829');
    setEditSkills(Array.isArray(staff.skills) ? staff.skills.join(', ') : (staff.skills || 'Eurocode 2, Civil 3D'));
    setEditCerts(Array.isArray(staff.certifications) ? staff.certifications.join(', ') : (staff.certifications || 'ONIGC Registered Engineer'));
    setEditManager(staff.reportingManager || 'Managing Director');
    setEditStatus(staff.status || 'ACTIVE');
    setEditApproval(staff.approvalStatus || 'APPROVED');
    setShowFullEditModal(true);
  };

  const handleSaveEditStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    pushStateSnapshot();

    const skillsArr = editSkills.split(',').map(s => s.trim()).filter(Boolean);
    const certsArr = editCerts.split(',').map(c => c.trim()).filter(Boolean);

    setHrProfiles(prev => prev.map(p => {
      if (p.id === editingStaffId || p.employeeNumber === editingStaffId) {
        return {
          ...p,
          fullName: editFullName,
          email: editEmail,
          department: editDept,
          position: editPos,
          salaryXaf: editSalary,
          allowancesXaf: editAllowances,
          bankDetails: editBank,
          engineeringRegistration: editEngReg,
          skills: skillsArr,
          certifications: certsArr,
          reportingManager: editManager,
          status: editStatus,
          approvalStatus: editApproval
        };
      }
      return p;
    }));

    setAccessKeys(prev => prev.map(k => {
      if (k.id === editingStaffId || k.employeeNumber === editingStaffId) {
        return {
          ...k,
          fullName: editFullName,
          email: editEmail,
          department: editDept,
          position: editPos,
          status: editStatus === 'ARCHIVED' ? 'DISABLED' : (editStatus === 'ACTIVE' ? 'ACTIVATED' : editStatus)
        };
      }
      return k;
    }));

    setShowFullEditModal(false);
    if (showToast) showToast(`Saved profile changes for ${editFullName}`, 'success');
  };

  // --- DUPLICATE STAFF ---
  const handleDuplicateStaff = (staff: any) => {
    pushStateSnapshot();
    const newId = Date.now();
    const nextNum = String(hrProfiles.length + 1).padStart(2, '0');
    const newEmpNumber = `EMP-2026-${nextNum}`;
    const duplicatedName = `${staff.fullName || 'Employee'} (Copy)`;

    const newProfile = {
      ...staff,
      id: newId,
      employeeNumber: newEmpNumber,
      fullName: duplicatedName,
      status: 'ACTIVE',
      approvalStatus: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const newAccessKey = {
      id: newId,
      employeeNumber: newEmpNumber,
      fullName: duplicatedName,
      email: staff.email ? `copy.${staff.email}` : `copy.${newEmpNumber.toLowerCase()}@madeccgroup.cm`,
      department: staff.department || 'Engineering',
      position: staff.position || 'Quantity Surveyor',
      status: 'PENDING',
      loginKey: `MDCC-KEY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    setHrProfiles(prev => [newProfile, ...prev]);
    setAccessKeys(prev => [newAccessKey, ...prev]);
    if (showToast) showToast(`Duplicated staff as ${newEmpNumber}`, 'success');
  };

  // --- DELETE STAFF ---
  const handleDeleteStaff = (staff: any) => {
    pushStateSnapshot();
    const targetId = staff.id || staff.employeeNumber;
    const targetNum = staff.employeeNumber;

    setHrProfiles(prev => prev.filter(p => p.id !== targetId && p.employeeNumber !== targetNum));
    setAccessKeys(prev => prev.filter(k => k.id !== targetId && k.employeeNumber !== targetNum));
    if (showToast) showToast(`Deleted staff ${staff.fullName || targetNum}. Click Undo to restore.`, 'info');
  };

  // --- ARCHIVE / UNARCHIVE STAFF ---
  const handleToggleArchiveStaff = (staff: any) => {
    pushStateSnapshot();
    const targetId = staff.id || staff.employeeNumber;
    const targetNum = staff.employeeNumber;
    const isCurrentlyArchived = staff.status === 'ARCHIVED';
    const nextStatus = isCurrentlyArchived ? 'ACTIVE' : 'ARCHIVED';

    setHrProfiles(prev => prev.map(p => {
      if (p.id === targetId || p.employeeNumber === targetNum) {
        return { ...p, status: nextStatus };
      }
      return p;
    }));

    setAccessKeys(prev => prev.map(k => {
      if (k.id === targetId || k.employeeNumber === targetNum) {
        return { ...k, status: nextStatus === 'ARCHIVED' ? 'DISABLED' : 'ACTIVATED' };
      }
      return k;
    }));

    if (showToast) showToast(`${staff.fullName || targetNum} ${isCurrentlyArchived ? 'unarchived' : 'archived'}`, 'success');
  };

  // --- APPROVE STAFF ---
  const handleApproveStaff = (staff: any) => {
    pushStateSnapshot();
    const targetId = staff.id || staff.employeeNumber;
    const targetNum = staff.employeeNumber;

    setHrProfiles(prev => prev.map(p => {
      if (p.id === targetId || p.employeeNumber === targetNum) {
        return { ...p, approvalStatus: 'APPROVED', status: 'ACTIVE' };
      }
      return p;
    }));

    setAccessKeys(prev => prev.map(k => {
      if (k.id === targetId || k.employeeNumber === targetNum) {
        return { ...k, status: 'ACTIVATED' };
      }
      return k;
    }));

    if (showToast) showToast(`Approved and certified staff credentials for ${staff.fullName}`, 'success');
  };

  // --- SAVE ALL STAFF ---
  const handleSaveAllStaff = () => {
    if (showToast) showToast('All staff records saved and synchronized with database', 'success');
  };

  // --- EXPORT HANDLERS ---
  const handleExportDirectoryPdf = () => {
    try {
      generateStaffDirectoryPdf(hrProfiles);
      if (showToast) showToast('Generated & downloaded Staff Directory A4 PDF', 'success');
    } catch (err: any) {
      if (showToast) showToast('Failed generating Staff Directory PDF', 'error');
    }
  };

  const handleExportDirectoryDocx = async () => {
    try {
      await generateStaffDirectoryDocx(hrProfiles);
      if (showToast) showToast('Generated & downloaded Staff Directory Word (.docx)', 'success');
    } catch (err: any) {
      if (showToast) showToast('Failed generating Staff Directory Word document', 'error');
    }
  };

  const handleExportStaffDossierPdf = (staff: any) => {
    try {
      generateIndividualStaffDossierPdf(staff);
      if (showToast) showToast(`Downloaded A4 PDF Dossier for ${staff.fullName}`, 'success');
    } catch (err: any) {
      if (showToast) showToast('Failed generating staff dossier PDF', 'error');
    }
  };

  const handleExportStaffDossierDocx = async (staff: any) => {
    try {
      await generateIndividualStaffDossierDocx(staff);
      if (showToast) showToast(`Downloaded Word Dossier for ${staff.fullName}`, 'success');
    } catch (err: any) {
      if (showToast) showToast('Failed generating staff dossier Word document', 'error');
    }
  };

  // Derived metrics
  const totalEmp = hrProfiles.length || accessKeys.length;
  const activeEmp = accessKeys.filter(k => k.status === 'ACTIVATED').length;
  const pendingActivation = accessKeys.filter(k => k.status === 'PENDING' || k.status === 'GENERATED').length;
  const suspendedEmp = accessKeys.filter(k => k.status === 'SUSPENDED' || k.status === 'DISABLED').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* TOP SECURITY & ACCESS GOVERNANCE HEADER */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-indigo-600 via-purple-600 to-amber-500 rounded-xl text-white font-black shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-wide">ENTERPRISE WORKFORCE & SECURITY CONTROL CENTER</h1>
                <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-bold rounded-md uppercase">
                  Level 5 Access Governance
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Administrator: <strong className="text-amber-400 font-mono">Adminmadeccgroup</strong> (Unrestricted Sovereign Controller)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* UNDO & REDO CONTROLS */}
            <button
              onClick={handleUndo}
              disabled={historyStack.length === 0}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                historyStack.length > 0 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 cursor-pointer' 
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title="Undo last staff action"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo ({historyStack.length})
            </button>

            <button
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-colors ${
                redoStack.length > 0 
                  ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/40 cursor-pointer' 
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title="Redo undone action"
            >
              <RotateCw className="w-3.5 h-3.5" /> Redo ({redoStack.length})
            </button>

            {/* SAVE BUTTON */}
            <button
              onClick={handleSaveAllStaff}
              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Save All Staff Records"
            >
              <Save className="w-3.5 h-3.5 text-emerald-400" /> Save
            </button>

            {/* DIRECTORY EXPORT A4 PDF */}
            <button
              onClick={handleExportDirectoryPdf}
              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Export Staff Directory as A4 PDF"
            >
              <FileText className="w-3.5 h-3.5 text-rose-400" /> Directory PDF
            </button>

            {/* DIRECTORY EXPORT WORD */}
            <button
              onClick={handleExportDirectoryDocx}
              className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Export Staff Directory as Word (.docx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> Directory Word
            </button>

            <button
              onClick={() => setShowAnnounceModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-amber-400" /> Post Notice
            </button>
            <button
              onClick={() => setShowProvisionModal(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
            >
              <UserPlus className="w-3.5 h-3.5" /> Provision New
            </button>
            <button
              onClick={fetchStaffData}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Refresh All Database Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* SUB-HEADER NAVIGATION TABS */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 px-6 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center gap-1 py-2 text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setActiveTab('staff-dashboard')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'staff-dashboard'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" /> Staff Control Center
          </button>

          <button
            onClick={() => setActiveTab('staff-provisioning')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'staff-provisioning'
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-purple-400" /> Access Key Governance
          </button>

          <button
            onClick={() => setActiveTab('employee-lifecycle')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'employee-lifecycle'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" /> Accounts Lifecycle
          </button>

          <button
            onClick={() => setActiveTab('rbac-matrix')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rbac-matrix'
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-blue-400" /> Granular RBAC Engine
          </button>

          <button
            onClick={() => setActiveTab('staff-directory')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'staff-directory'
                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Searchable Directory
          </button>

          <button
            onClick={() => setActiveTab('org-chart')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'org-chart'
                ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> Org Hierarchy
          </button>

          <button
            onClick={() => setActiveTab('activation-portal')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'activation-portal'
                ? 'bg-pink-600/20 text-pink-300 border border-pink-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-pink-400" /> Account Activation
          </button>

          <button
            onClick={() => setActiveTab('notifications-announcements')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'notifications-announcements'
                ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-rose-400" /> Notices & Alerts
          </button>

          <button
            onClick={() => setActiveTab('audit-security-logs')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit-security-logs'
                ? 'bg-red-600/20 text-red-300 border border-red-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" /> Security Audit Trail
          </button>

          <button
            onClick={() => setActiveTab('performance-kpi')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'performance-kpi'
                ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-teal-400" /> Performance & KPIs
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER CONTENT */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-1">
        {/* ============================================================== */}
        {/* TAB 1: STAFF CONTROL CENTER DASHBOARD */}
        {/* ============================================================== */}
        {activeTab === 'staff-dashboard' && (
          <div className="space-y-6">
            {/* OVERVIEW METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Workforce</span>
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-white">{totalEmp}</div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-emerald-400" /> 6 Active Engineering Departments
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Employees</span>
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-emerald-400">{activeEmp}</div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" /> Fully Activated Credentials
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Activation</span>
                  <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-amber-400">{pendingActivation}</div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-400" /> Keys Awaiting First Login
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Suspended / Disabled</span>
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg">
                    <UserX className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-rose-400">{suspendedEmp}</div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-400" /> Access Temporarily Locked
                </p>
              </div>
            </div>

            {/* QUICK ACTIONS & RECENT ANNOUNCEMENTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-400" /> Department Workforce Distribution
                  </h3>
                  <button onClick={() => setActiveTab('staff-directory')} className="text-xs text-indigo-400 hover:underline">
                    View Directory →
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { name: 'Quantity Surveying & Commercial', count: hrProfiles.filter(p => p.department === 'Quantity Surveying').length || 4, head: 'Senior QS Manager' },
                    { name: 'Structural Engineering', count: hrProfiles.filter(p => p.department === 'Engineering').length || 6, head: 'Lead Civil Engineer' },
                    { name: 'Site Management & Logistics', count: hrProfiles.filter(p => p.department === 'Site Management').length || 5, head: 'General Superintendent' },
                    { name: 'HSE & Quality Assurance', count: hrProfiles.filter(p => p.department === 'HSE').length || 3, head: 'ONIGC Lead Inspector' },
                    { name: 'Finance & Procurement', count: hrProfiles.filter(p => p.department === 'Finance').length || 3, head: 'Commercial Director' },
                    { name: 'Executive & Legal Administration', count: hrProfiles.filter(p => p.department === 'Executive').length || 2, head: 'Managing Director' }
                  ].map((dept, i) => (
                    <div key={i} className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{dept.name}</h4>
                        <p className="text-[10px] text-slate-400">Manager: {dept.head}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg">
                        {dept.count} Staff
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ANNOUNCEMENT BOARD */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-400" /> Active Staff Bulletins
                    </h3>
                    <span className="text-[10px] text-slate-400">{announcements.length} Published</span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {announcements.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No staff announcements posted yet.</p>
                    ) : (
                      announcements.map((a, i) => (
                        <div key={i} className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              a.priority === 'URGENT' ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-indigo-500/20 text-indigo-300'
                            }`}>
                              {a.priority}
                            </span>
                            <span className="text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-bold text-slate-200 mb-1">{a.title}</h4>
                          <p className="text-slate-400 text-[11px] line-clamp-2">{a.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setShowAnnounceModal(true)}
                  className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
                >
                  + Post New Staff Notice
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ACCESS KEY GOVERNANCE & PROVISIONING */}
        {/* ============================================================== */}
        {activeTab === 'staff-provisioning' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Key className="w-5 h-5 text-purple-400" /> Cryptographic Access Key Provisioning
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Access keys are cryptographically generated and displayed plain-text <strong>ONLY ONCE</strong> upon generation. Database records store only encrypted hashes.
                </p>
              </div>
              <button
                onClick={() => setShowProvisionModal(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Provision Employee Key
              </button>
            </div>

            {/* TABLE OF PROVISIONED ACCESS KEYS */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by Employee # or Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">Filter Status:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="GENERATED">Generated</option>
                    <option value="ACTIVATED">Activated</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Employee ID</th>
                      <th className="py-3 px-4">Name & Email</th>
                      <th className="py-3 px-4">Dept & Position</th>
                      <th className="py-3 px-4">Access Key Status</th>
                      <th className="py-3 px-4">Expiry Date</th>
                      <th className="py-3 px-4">Masked Access Key</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {accessKeys
                      .filter(k => 
                        (filterStatus === 'ALL' || k.status === filterStatus) &&
                        (k.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         k.employeeNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
                      )
                      .map((k) => (
                        <tr key={k.id} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-indigo-400">{k.employeeNumber}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white">{k.fullName}</div>
                            <div className="text-[10px] text-slate-400">{k.email}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div>{k.department}</div>
                            <div className="text-[10px] text-slate-500">{k.position}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              k.status === 'ACTIVATED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              k.status === 'GENERATED' || k.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                              k.status === 'SUSPENDED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                              'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {k.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-400">
                            {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : '7 Days Default'}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {k.loginKey ? `${k.loginKey.slice(0, 8)}••••${k.loginKey.slice(-3)}` : 'SECURED-HASH'}
                          </td>
                          <td className="py-3 px-4 text-right space-x-1">
                            <button
                              onClick={() => handleRegenerateKey(k.id)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded text-[11px] border border-slate-700"
                              title="Re-generate Secure Access Key"
                            >
                              Re-Key
                            </button>
                            {k.status === 'SUSPENDED' ? (
                              <button
                                onClick={() => handleUpdateKeyStatus(k.id, 'ACTIVATED')}
                                className="px-2 py-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 rounded text-[11px] border border-emerald-500/40"
                              >
                                Restore
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateKeyStatus(k.id, 'SUSPENDED')}
                                className="px-2 py-1 bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 rounded text-[11px] border border-rose-500/40"
                              >
                                Suspend
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: ACCOUNTS LIFECYCLE MANAGEMENT */}
        {/* ============================================================== */}
        {activeTab === 'employee-lifecycle' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Employee Lifecycle & Profile Management
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Full lifecycle control: Account Provisioning → First-Login Key Activation → Active Duty → Suspension → Archival. Historical records are preserved permanently.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {hrProfiles.map((p) => (
                <div key={p.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-amber-400 font-bold">{p.employeeNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {p.status || 'ACTIVE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-black text-indigo-400">
                        {p.fullName ? p.fullName.charAt(0) : 'E'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{p.fullName}</h3>
                        <p className="text-xs text-slate-400">{p.position}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Department:</span>
                        <span className="font-medium text-slate-200">{p.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Manager:</span>
                        <span className="text-slate-300">{p.reportingManager || 'Managing Director'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Salary (XAF):</span>
                        <span className="font-mono text-emerald-400">{Number(p.salaryXaf || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleOpenEditStaff(p)}
                      className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded text-[11px] border border-indigo-500/40 flex items-center gap-1 transition-colors"
                      title="Edit Staff Details"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>

                    <button
                      onClick={() => handleDuplicateStaff(p)}
                      className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded text-[11px] border border-purple-500/40 flex items-center gap-1 transition-colors"
                      title="Duplicate Staff Profile"
                    >
                      <CopyCheck className="w-3 h-3" /> Duplicate
                    </button>

                    <button
                      onClick={() => handleApproveStaff(p)}
                      className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded text-[11px] border border-emerald-500/40 flex items-center gap-1 transition-colors"
                      title="Approve & Certify Staff Profile"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve
                    </button>

                    <button
                      onClick={() => handleToggleArchiveStaff(p)}
                      className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded text-[11px] border border-amber-500/40 flex items-center gap-1 transition-colors"
                      title="Archive / Unarchive Staff"
                    >
                      <Archive className="w-3 h-3" /> {p.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                    </button>

                    <button
                      onClick={() => handleExportStaffDossierPdf(p)}
                      className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded text-[11px] border border-rose-500/40 flex items-center gap-1 transition-colors"
                      title="Download A4 PDF Dossier"
                    >
                      <FileText className="w-3 h-3" /> PDF
                    </button>

                    <button
                      onClick={() => handleExportStaffDossierDocx(p)}
                      className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-[11px] border border-blue-500/40 flex items-center gap-1 transition-colors"
                      title="Download Word (.docx) Dossier"
                    >
                      <FileSpreadsheet className="w-3 h-3" /> Word
                    </button>

                    <button
                      onClick={() => handleDeleteStaff(p)}
                      className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded text-[11px] border border-red-500/40 flex items-center gap-1 transition-colors"
                      title="Delete Staff Record"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: ADVANCED RBAC GRANULAR PERMISSION ENGINE */}
        {/* ============================================================== */}
        {activeTab === 'rbac-matrix' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" /> Granular Access Permission Matrix
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Hierarchy: Company Level → Department Level → Project Level → Module Level → Action Level.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <label className="text-xs text-slate-400">Select Role Template:</label>
                  <select
                    value={selectedRoleForMatrix}
                    onChange={(e) => setSelectedRoleForMatrix(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="Quantity Surveyor">Senior Quantity Surveyor</option>
                    <option value="Lead Civil Engineer">Lead Civil Engineer</option>
                    <option value="Site Superintendent">Site Superintendent</option>
                    <option value="Commercial Auditor">Commercial Finance Auditor</option>
                    <option value="HSE Inspector">HSE Inspector</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    if (showToast) showToast(`Role matrix template saved for ${selectedRoleForMatrix}`, 'success');
                  }}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-md"
                >
                  Save Role Permissions
                </button>
              </div>

              {/* GRANULAR ACTION MATRIX TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">System Module</th>
                      <th className="py-3 px-4 text-center">View</th>
                      <th className="py-3 px-4 text-center">Create</th>
                      <th className="py-3 px-4 text-center">Edit</th>
                      <th className="py-3 px-4 text-center">Approve</th>
                      <th className="py-3 px-4 text-center">Export</th>
                      <th className="py-3 px-4 text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      { key: 'boq', name: 'BOQ & Commercial Ledger Studio' },
                      { key: 'takeoff', name: 'AI Blueprint Quantity Take-Off' },
                      { key: 'structural', name: 'Eurocode Structural Engineering Calc' },
                      { key: 'labour', name: 'Labour & Workforce Payroll Management' },
                      { key: 'users', name: 'User Management & Security Governance' }
                    ].map((mod) => (
                      <tr key={mod.key} className="hover:bg-slate-850/50">
                        <td className="py-3.5 px-4 font-bold text-white">{mod.name}</td>
                        {['view', 'create', 'edit', 'approve', 'export', 'delete'].map((action) => (
                          <td key={action} className="py-3.5 px-4 text-center">
                            <input
                              type="checkbox"
                              checked={matrixPermissions[mod.key]?.[action] || false}
                              onChange={(e) => {
                                setMatrixPermissions(prev => ({
                                  ...prev,
                                  [mod.key]: {
                                    ...prev[mod.key],
                                    [action]: e.target.checked
                                  }
                                }));
                              }}
                              className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 bg-slate-950 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 5: SEARCHABLE STAFF DIRECTORY */}
        {/* ============================================================== */}
        {activeTab === 'staff-directory' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" /> Searchable Company Directory
                </h2>
                <p className="text-xs text-slate-400 mt-1">Search staff by Name, Department, Skills, or ONIGC Registration.</p>
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search skills, name, ONIGC reg #..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hrProfiles
                .filter(p => p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || p.department?.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((p) => (
                  <div key={p.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-black text-base">
                        {p.fullName ? p.fullName.charAt(0) : 'M'}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm">{p.fullName}</h3>
                        <p className="text-xs text-indigo-400 font-medium">{p.position}</p>
                        <p className="text-[10px] text-slate-400">{p.department}</p>
                      </div>
                    </div>

                    <div className="text-xs space-y-1.5 border-t border-slate-800 pt-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-500" /> {p.email}
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {p.phone || '+237 690 00 00 00'}
                      </div>
                      <div className="flex items-center gap-2 text-amber-400 font-mono text-[11px]">
                        <Award className="w-3.5 h-3.5 text-amber-400" /> ONIGC Reg: {p.engineeringRegistration || 'ONIGC #4829'}
                      </div>
                    </div>

                    {p.skills && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-slate-800/80">
                        {(Array.isArray(p.skills) ? p.skills : ['Eurocode', 'QS']).map((sk: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 text-[10px] rounded">
                            {sk}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleOpenEditStaff(p)}
                        className="px-2 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 rounded text-[11px] border border-indigo-500/40 flex items-center gap-1 transition-colors"
                        title="Edit Staff Details"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>

                      <button
                        onClick={() => handleDuplicateStaff(p)}
                        className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded text-[11px] border border-purple-500/40 flex items-center gap-1 transition-colors"
                        title="Duplicate Staff Profile"
                      >
                        <CopyCheck className="w-3 h-3" /> Duplicate
                      </button>

                      <button
                        onClick={() => handleApproveStaff(p)}
                        className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded text-[11px] border border-emerald-500/40 flex items-center gap-1 transition-colors"
                        title="Approve & Certify Staff Profile"
                      >
                        <CheckCircle2 className="w-3 h-3" /> Approve
                      </button>

                      <button
                        onClick={() => handleToggleArchiveStaff(p)}
                        className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 rounded text-[11px] border border-amber-500/40 flex items-center gap-1 transition-colors"
                        title="Archive / Unarchive Staff"
                      >
                        <Archive className="w-3 h-3" /> {p.status === 'ARCHIVED' ? 'Unarchive' : 'Archive'}
                      </button>

                      <button
                        onClick={() => handleExportStaffDossierPdf(p)}
                        className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded text-[11px] border border-rose-500/40 flex items-center gap-1 transition-colors"
                        title="Download A4 PDF Dossier"
                      >
                        <FileText className="w-3 h-3" /> PDF
                      </button>

                      <button
                        onClick={() => handleExportStaffDossierDocx(p)}
                        className="px-2 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-[11px] border border-blue-500/40 flex items-center gap-1 transition-colors"
                        title="Download Word (.docx) Dossier"
                      >
                        <FileSpreadsheet className="w-3 h-3" /> Word
                      </button>

                      <button
                        onClick={() => handleDeleteStaff(p)}
                        className="px-2 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded text-[11px] border border-red-500/40 flex items-center gap-1 transition-colors"
                        title="Delete Staff Record"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 6: VISUAL ORGANIZATION CHART */}
        {/* ============================================================== */}
        {activeTab === 'org-chart' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-center">
              <h2 className="text-base font-black text-white flex items-center justify-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" /> Executive & Engineering Hierarchy
              </h2>
              <p className="text-xs text-slate-400 mt-1">Official MADECC Group Governance & Reporting Lines.</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col items-center space-y-8">
              {/* MANAGING DIRECTOR */}
              <div className="p-4 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 border border-indigo-500/50 rounded-2xl text-center w-72 shadow-xl">
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded uppercase">Executive Head</span>
                <h3 className="text-sm font-black text-white mt-1">Managing Director</h3>
                <p className="text-xs text-indigo-300">Adminmadeccgroup</p>
              </div>

              <div className="w-0.5 h-8 bg-slate-700"></div>

              {/* DEPARTMENT HEADS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {[
                  { title: 'Commercial & QS', lead: 'Senior QS Manager', dept: 'Quantity Surveying' },
                  { title: 'Chief Structural Engineer', lead: 'Lead Civil Engineer', dept: 'Engineering' },
                  { title: 'Operations & Site Lead', lead: 'General Superintendent', dept: 'Site Management' }
                ].map((d, idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">{d.title}</span>
                    <h4 className="text-xs font-bold text-white">{d.lead}</h4>
                    <span className="inline-block px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded">{d.dept}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 7: FIRST-LOGIN ACCOUNT ACTIVATION PORTAL */}
        {/* ============================================================== */}
        {activeTab === 'activation-portal' && (
          <div className="max-w-xl mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-p-3 p-3 bg-pink-500/10 text-pink-400 rounded-full mb-2">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-black text-white">Employee Account Activation Portal</h2>
              <p className="text-xs text-slate-400">Enter your assigned Access Key and Temporary Password to set your permanent credentials.</p>
            </div>

            {actSuccessMsg ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-emerald-300">Account Activated!</h3>
                <p className="text-xs text-slate-300">{actSuccessMsg}</p>
                <button
                  onClick={() => setActSuccessMsg('')}
                  className="mt-3 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                >
                  Activate Another Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleAccountActivation} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 font-bold">Access Key (e.g. MDCC-ENG-8F4K...):</label>
                  <input
                    type="text"
                    required
                    value={actLoginKey}
                    onChange={(e) => setActLoginKey(e.target.value)}
                    placeholder="MDCC-ENG-..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white mt-1 font-mono focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold">Temporary Password:</label>
                  <input
                    type="password"
                    required
                    value={actTempPass}
                    onChange={(e) => setActTempPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white mt-1 focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-bold">Create Permanent Password:</label>
                  <input
                    type="password"
                    required
                    value={actNewPass}
                    onChange={(e) => setActNewPass(e.target.value)}
                    placeholder="New Permanent Password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white mt-1 focus:border-pink-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/20 transition-all"
                >
                  Activate Employee Account
                </button>
              </form>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 8: ANNOUNCEMENTS & NOTIFICATIONS */}
        {/* ============================================================== */}
        {activeTab === 'notifications-announcements' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-400" /> Notifications Feed & Bulletins
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white mb-3">Company Bulletins</h3>
                {announcements.map((a, i) => (
                  <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-slate-400">
                      <span>Author: {a.author}</span>
                      <span>{new Date(a.createdAt).toLocaleString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-200 text-xs">{a.title}</h4>
                    <p className="text-slate-400 text-xs">{a.content}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-white mb-3">System Security Notifications</h3>
                {notifications.map((n, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between font-bold text-indigo-400">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-500">{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 9: IMMUTABLE AUDIT LOGS & LOGIN HISTORY */}
        {/* ============================================================== */}
        {activeTab === 'audit-security-logs' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-400" /> Security Audit Logs & Login History
                </h2>
                <p className="text-xs text-slate-400 mt-1">Immutable forensic tracking of admin provisioning, login key usage, and system overrides.</p>
              </div>

              <button
                onClick={exportAuditLogsCsv}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Audit CSV
              </button>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Target Employee</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Module</th>
                      <th className="py-3 px-4">Audit Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {auditLogs.map((l) => (
                      <tr key={l.id} className="hover:bg-slate-850/50">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                          {new Date(l.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-bold text-amber-400">{l.adminUser}</td>
                        <td className="py-3 px-4 text-slate-300">{l.targetEmployee || 'N/A'}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-indigo-300 text-[10px] font-mono rounded">
                            {l.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{l.module}</td>
                        <td className="py-3 px-4 text-slate-300">{l.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 10: PERFORMANCE & KPIS */}
        {/* ============================================================== */}
        {activeTab === 'performance-kpi' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-teal-400" /> Employee Performance & KPI Review
                </h2>
                <p className="text-xs text-slate-400 mt-1">Workforce task execution quality ratings & manager feedback logs.</p>
              </div>

              <button
                onClick={() => setShowPerfModal(true)}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold"
              >
                + Record Performance Review
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {performanceReviews.map((r, i) => (
                <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs text-teal-400 font-bold">{r.employeeNumber}</span>
                    <span className="text-[10px] text-slate-400">{r.reviewPeriod}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center py-2 bg-slate-950 rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-500 block">KPI Score</span>
                      <span className="text-sm font-black text-emerald-400">{r.kpiScore}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Quality</span>
                      <span className="text-sm font-black text-indigo-400">{r.qualityRating}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Safety</span>
                      <span className="text-sm font-black text-amber-400">{r.safetyRating}%</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 italic">"{r.comments}"</p>
                  <p className="text-[10px] text-slate-500 text-right">Reviewed by {r.reviewerName}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ==================================================================== */}
      {/* MODAL 1: SINGLE-DISPLAY CRYPTOGRAPHIC ACCESS KEY MODAL */}
      {/* ==================================================================== */}
      {createdKeyModalData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/50 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-purple-400">
              <ShieldCheck className="w-7 h-7 text-purple-400" />
              <div>
                <h3 className="text-sm font-black text-white">ACCESS KEY GENERATED</h3>
                <p className="text-[10px] text-purple-300">Single-Display Cryptographic Security Notice</p>
              </div>
            </div>

            <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-xl text-xs space-y-2 text-slate-200">
              <p className="text-amber-300 font-bold text-[11px] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> STORE THIS ACCESS KEY SECURELY!
              </p>
              <p className="text-slate-400 text-[11px]">
                For security compliance, this plain-text access key will <strong>NEVER</strong> be displayed again.
              </p>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Employee</span>
                <span className="text-xs font-bold text-white block">{createdKeyModalData.fullName} ({createdKeyModalData.employeeNumber})</span>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Access Key</span>
                <div className="flex items-center justify-between font-mono text-sm text-purple-300 font-bold">
                  <span>{createdKeyModalData.loginKey}</span>
                  <button
                    onClick={() => copyToClipboard(createdKeyModalData.loginKey)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Temporary Password</span>
                <div className="flex items-center justify-between font-mono text-xs text-amber-300 font-bold">
                  <span>{createdKeyModalData.tempPassword}</span>
                  <button
                    onClick={() => copyToClipboard(createdKeyModalData.tempPassword)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCreatedKeyModalData(null)}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors"
            >
              I Have Saved This Key Securely
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: PROVISION NEW EMPLOYEE ACCOUNT MODAL */}
      {/* ==================================================================== */}
      {showProvisionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" /> Provision New Employee Account
              </h3>
              <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-white text-xs font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleProvisionSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={empFullName}
                    onChange={(e) => setEmpFullName(e.target.value)}
                    placeholder="Engr. Paul Nsoga"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="p.nsoga@madeccgroup.cm"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold">Department</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 mt-1"
                  >
                    <option value="Quantity Surveying">Quantity Surveying & Commercial</option>
                    <option value="Engineering">Structural Engineering</option>
                    <option value="Site Management">Site Operations</option>
                    <option value="HSE">HSE & Quality Assurance</option>
                    <option value="Finance">Finance & Procurement</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold">Position Title</label>
                  <input
                    type="text"
                    value={empPos}
                    onChange={(e) => setEmpPos(e.target.value)}
                    placeholder="Senior Quantity Surveyor"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 mt-1 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
                >
                  Generate Access Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: HR PROFILE EDIT MODAL */}
      {/* ==================================================================== */}
      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">HR Profile: {selectedProfile.fullName}</h3>
              <button onClick={() => setShowProfileModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveHrProfile} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Monthly Base Salary (XAF)</label>
                <input
                  type="number"
                  value={hrSalary}
                  onChange={(e) => setHrSalary(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Allowances (XAF)</label>
                <input
                  type="number"
                  value={hrAllowances}
                  onChange={(e) => setHrAllowances(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Professional Certifications</label>
                <input
                  type="text"
                  value={hrCertifications}
                  onChange={(e) => setHrCertifications(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Bank Account Details</label>
                <input
                  type="text"
                  value={hrBank}
                  onChange={(e) => setHrBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 4: PERFORMANCE REVIEW MODAL */}
      {/* ==================================================================== */}
      {showPerfModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">Record Performance Review</h3>
              <button onClick={() => setShowPerfModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSavePerformanceReview} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold">Select Employee</label>
                <select
                  value={perfEmpNum}
                  onChange={(e) => setPerfEmpNum(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="">-- Choose Employee --</option>
                  {hrProfiles.map((p) => (
                    <option key={p.id} value={p.employeeNumber}>
                      {p.fullName} ({p.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-slate-400 text-[10px]">KPI Score (%)</label>
                  <input
                    type="number"
                    value={perfKpiScore}
                    onChange={(e) => setPerfKpiScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Quality Score (%)</label>
                  <input
                    type="number"
                    value={perfQualityScore}
                    onChange={(e) => setPerfQualityScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-[10px]">Safety Score (%)</label>
                  <input
                    type="number"
                    value={perfSafetyScore}
                    onChange={(e) => setPerfSafetyScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 text-[10px]">Manager Comments & Review</label>
                <textarea
                  rows={3}
                  value={perfComments}
                  onChange={(e) => setPerfComments(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg"
                >
                  Submit Performance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 5: POST ANNOUNCEMENT MODAL */}
      {/* ==================================================================== */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white">Post Company Staff Notice</h3>
              <button onClick={() => setShowAnnounceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold">Notice Title *</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Q3 Safety Audit & Site ISO Verification"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold">Priority Level</label>
                <select
                  value={annPriority}
                  onChange={(e) => setAnnPriority(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="URGENT">Urgent Priority</option>
                  <option value="LOW">Informational / Low</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold">Notice Content *</label>
                <textarea
                  rows={4}
                  required
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Details of company directive..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 6: FULL EDIT STAFF PROFILE MODAL */}
      {/* ==================================================================== */}
      {showFullEditModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" /> Edit Staff Dossier & HR Profile
              </h3>
              <button onClick={() => setShowFullEditModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditStaffSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Official Email *</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Department</label>
                  <select
                    value={editDept}
                    onChange={(e) => setEditDept(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  >
                    <option value="Quantity Surveying">Quantity Surveying & Commercial</option>
                    <option value="Engineering">Structural Engineering</option>
                    <option value="Site Management">Site Operations</option>
                    <option value="HSE">HSE & Quality Assurance</option>
                    <option value="Finance">Finance & Procurement</option>
                    <option value="Executive">Executive Administration</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Position Title</label>
                  <input
                    type="text"
                    value={editPos}
                    onChange={(e) => setEditPos(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Monthly Base Salary (XAF)</label>
                  <input
                    type="number"
                    value={editSalary}
                    onChange={(e) => setEditSalary(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-emerald-400 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Allowances (XAF)</label>
                  <input
                    type="number"
                    value={editAllowances}
                    onChange={(e) => setEditAllowances(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-emerald-400 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Bank Account Details</label>
                  <input
                    type="text"
                    value={editBank}
                    onChange={(e) => setEditBank(e.target.value)}
                    placeholder="BICEC Douala Main Branch - Account #..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">ONIGC Registration / Engineering #</label>
                  <input
                    type="text"
                    value={editEngReg}
                    onChange={(e) => setEditEngReg(e.target.value)}
                    placeholder="ONIGC #4829"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-amber-300 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Core Engineering Skills (Comma separated)</label>
                  <input
                    type="text"
                    value={editSkills}
                    onChange={(e) => setEditSkills(e.target.value)}
                    placeholder="Eurocode 2, Civil 3D, BOQ Preparation, Contract Law"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">Certifications (Comma separated)</label>
                  <input
                    type="text"
                    value={editCerts}
                    onChange={(e) => setEditCerts(e.target.value)}
                    placeholder="ONIGC Registered Engineer, RICS Fellow, PMP"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Reporting Manager</label>
                  <input
                    type="text"
                    value={editManager}
                    onChange={(e) => setEditManager(e.target.value)}
                    placeholder="Managing Director"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Account Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFullEditModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
