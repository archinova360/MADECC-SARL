import React, { useState, useEffect } from 'react';
import {
  Building2, Users, FileText, Camera, Video, CheckCircle2, DollarSign,
  Calculator, FileSpreadsheet, Package, Truck, Wrench, BarChart3,
  Plus, Search, Edit2, Trash2, Eye, Download, Check, AlertTriangle,
  RefreshCw, Clock, ArrowRight, ShieldCheck, MapPin, Calendar,
  UserCheck, Phone, Mail, X, UploadCloud, Share2, Send, Printer,
  Filter, Copy, ExternalLink
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext.tsx';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface Props {
  initialSubTab?: string;
  onNavigateTab?: (tab: string) => void;
  onOpenClientPortal?: () => void;
}

const PHASES = [
  'Site Preparation',
  'Foundation & Earthworks',
  'Superstructure & Columns',
  'Roofing & Framing',
  'MEP & Plumbing/Electrical',
  'Finishing & Plaster',
  'Handover & Commissioning'
];

function isVideoAsset(url: string, explicitType?: string): boolean {
  if (explicitType && explicitType.toUpperCase() === 'VIDEO') return true;
  const lower = (url || '').toLowerCase();
  return lower.includes('/video/upload/') || /\.(mp4|mov|webm|mkv|avi|m4v)(\?.*)?$/.test(lower);
}

function downloadCsvFile(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const escapeCell = (val: string | number | null | undefined) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvBody = [
    headers.map(escapeCell).join(','),
    ...rows.map(r => r.map(escapeCell).join(','))
  ].join('\n');
  const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ErpManagementCenter({ initialSubTab = 'clients', onOpenClientPortal }: Props) {
  useTheme();
  useSiteSettings();

  const [activeSection, setActiveSection] = useState<string>(initialSubTab || 'clients');
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  // Upload state (Cloudinary signed direct upload -> /api/upload Supabase/Cloudinary fallback)
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');

  // Share via SMTP Modal
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    title: string;
    subject: string;
    summary: string;
    detailsHtml: string;
    actionLabel?: string;
    actionUrl?: string;
  }>({ open: false, title: '', subject: '', summary: '', detailsHtml: '' });
  const [shareRecipient, setShareRecipient] = useState('');
  const [sharingEmail, setSharingEmail] = useState(false);

  // 1. Clients State
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientCredentialsModal, setClientCredentialsModal] = useState<any | null>(null);
  const [newClient, setNewClient] = useState({
    fullName: '', companyName: '', email: '', phone: '', phoneSecondary: '',
    address: '', city: 'Yaoundé', notes: '', defaultPassword: 'Client2026@Madecc',
    projectId: '', sendEmailInvite: true
  });

  // 2. Client Portal Assignments
  const [portalSelectedClientId, setPortalSelectedClientId] = useState<number>(0);
  const [portalAssignProjectId, setPortalAssignProjectId] = useState<number>(0);
  const [clientAssignedProjects, setClientAssignedProjects] = useState<any[]>([]);

  // 3. Projects, Live Progress Updates & Milestones State
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [progressUpdates, setProgressUpdates] = useState<any[]>([]);
  const [updateSearch, setUpdateSearch] = useState('');
  const [updateStatusFilter, setUpdateStatusFilter] = useState('ALL');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<any | null>(null);
  const [newUpdate, setNewUpdate] = useState({
    phase: 'Superstructure & Columns',
    title: '',
    summary: '',
    completionPercentage: 60,
    statusBadge: 'ON_SCHEDULE',
    scheduleVariance: 'On Schedule per Master GANTT',
    delayExplanation: '',
    supervisorName: 'Ing. Arnaud Fopa (ONIGC Registered)',
    supervisorPhone: '+237 671 06 35 11',
    workforceOnSite: 16,
    weather: 'Clear / Dry',
    attachmentUrl: '',
    attachmentType: 'PHOTO',
    isClientVisible: true,
    alsoAddToGallery: true,
    notifyClient: true,
    projectStatus: ''
  });

  // Milestones State
  const [milestones, setMilestones] = useState<any[]>([]);
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState('ALL');
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any | null>(null);
  const [newMilestone, setNewMilestone] = useState({
    milestone: '', description: '', percentage: 0, status: 'Pending', date: new Date().toISOString().split('T')[0]
  });

  // 4. Media State
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [mediaPhaseFilter, setMediaPhaseFilter] = useState('ALL');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [mediaSearch, setMediaSearch] = useState('');
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [newMedia, setNewMedia] = useState({
    phase: 'Superstructure & Columns',
    mediaType: 'PHOTO',
    title: '',
    description: '',
    mediaUrl: '',
    isClientVisible: true,
    notifyClient: false
  });

  // 5. Invoices State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [inspectInvoice, setInspectInvoice] = useState<any | null>(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<any | null>(null);
  const [paymentInput, setPaymentInput] = useState({ amountXaf: 0, paymentMethod: 'MTN_MOMO', paymentReference: '', notes: '' });
  const [newInvoice, setNewInvoice] = useState({
    projectId: 1,
    clientId: 1,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    description: 'Foundation & Earthworks phase completion certificate',
    category: 'STRUCTURE',
    unit: 'm3',
    quantity: 100,
    unitPriceXaf: 95000,
    notes: 'Standard 19.25% TVA applies.',
    notifyClient: true
  });

  // 6. Cost Estimator & BOQ State
  const [estParams, setEstParams] = useState({
    buildingType: 'VILLA',
    totalFloorAreaM2: 280,
    floorsCount: 2,
    finishQuality: 'MODERN',
    city: 'Yaoundé'
  });
  const [estResult, setEstResult] = useState<any>(null);

  // 7. Inventory & Movements State
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<any[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryLowStockOnly, setInventoryLowStockOnly] = useState(false);
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [newMovement, setNewMovement] = useState({
    inventoryItemId: 1,
    movementType: 'DISPATCH_TO_PROJECT',
    quantity: 50,
    unit: 'bags',
    unitCostXaf: 5300,
    projectId: 1,
    receiverName: 'Michel Onana (Site Foreman)',
    notes: ''
  });

  // 8. Equipment Fleet State
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState('ALL');
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<any | null>(null);
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: 'PREVENTATIVE',
    description: '',
    partsReplaced: '',
    technicianName: 'Mechanical Workshop',
    costXaf: 45000
  });
  const [newEquipment, setNewEquipment] = useState({
    name: '', category: 'Heavy Machinery', brandModel: '', status: 'AVAILABLE', condition: 'EXCELLENT', hourlyRateXaf: 45000, location: 'Yaoundé Central Depot'
  });

  // 9. Subcontractors State
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [subSearch, setSubSearch] = useState('');
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSub, setNewSub] = useState({
    companyName: '', contactPerson: '', phone: '', email: '', specialization: 'Earthworks & Excavation', rccmNumber: '', niuTaxNumber: '', rating: 5.0, address: 'Yaoundé'
  });

  // 10. Workforce & Attendance State
  const [workers, setWorkers] = useState<any[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    fullName: '', nationalId: '', phone: '', tradeCategory: 'Mason / Bricklayer', skillLevel: 'SKILLED', dailyRateXaf: 8000, assignedProjectId: 1
  });

  // 11. Reports Overview State
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    if (initialSubTab) setActiveSection(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, iRes, invRes, movRes, eqRes, subRes, wrkRes, repRes] = await Promise.all([
        fetch('/api/erp/clients').then(r => r.json()).catch(() => ({})),
        fetch('/api/projects').then(r => r.json()).catch(() => []),
        fetch('/api/erp/invoices').then(r => r.json()).catch(() => ({})),
        fetch('/api/inventory').then(r => r.json()).catch(() => []),
        fetch('/api/erp/inventory/movements').then(r => r.json()).catch(() => ({})),
        fetch('/api/erp/equipment').then(r => r.json()).catch(() => ({})),
        fetch('/api/erp/subcontractors').then(r => r.json()).catch(() => ({})),
        fetch('/api/erp/workers').then(r => r.json()).catch(() => ({})),
        fetch('/api/erp/reports/overview').then(r => r.json()).catch(() => ({}))
      ]);

      if (cRes?.success) {
        const list = cRes.clients || [];
        setClients(list);
        if (list.length > 0 && !portalSelectedClientId) {
          setPortalSelectedClientId(list[0].id);
        }
      }
      if (Array.isArray(pRes)) {
        setProjects(pRes);
        if (pRes.length > 0) {
          setSelectedProjectId(prev => pRes.some((x: any) => x.id === prev) ? prev : pRes[0].id);
          if (!portalAssignProjectId) setPortalAssignProjectId(pRes[0].id);
        }
      }
      if (iRes?.success) setInvoices(iRes.invoices || []);
      if (Array.isArray(invRes)) setInventoryItems(invRes);
      if (movRes?.success) setInventoryMovements(movRes.movements || []);
      if (eqRes?.success) setEquipmentList(eqRes.equipment || []);
      if (subRes?.success) setSubcontractors(subRes.subcontractors || []);
      if (wrkRes?.success) setWorkers(wrkRes.workers || []);
      if (repRes?.success) setAnalyticsOverview(repRes.analytics);

      calculateEstimate();
    } catch (err) {
      console.error('Error loading ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectSpecificData = async (projId: number) => {
    if (!projId) return;
    try {
      const [uRes, mRes, medRes, attRes] = await Promise.all([
        fetch(`/api/erp/projects/${projId}/updates`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/erp/projects/${projId}/milestones`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/erp/projects/${projId}/media`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/erp/attendance?date=${attendanceDate}&projectId=${projId}`).then(r => r.json()).catch(() => ({}))
      ]);
      if (uRes?.success) setProgressUpdates(uRes.updates || []);
      if (mRes?.success) setMilestones(mRes.milestones || []);
      if (medRes?.success) setMediaList(medRes.media || []);
      if (attRes?.success) setAttendanceList(attRes.attendance || []);
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.warn('Error loading project details:', err);
    }
  };

  useEffect(() => {
    loadProjectSpecificData(selectedProjectId);
  }, [selectedProjectId, attendanceDate]);

  useEffect(() => {
    if (!portalSelectedClientId) return;
    fetch(`/api/erp/clients/${portalSelectedClientId}/projects`)
      .then(r => r.json())
      .then(d => { if (d.success) setClientAssignedProjects(d.projects || []); })
      .catch(() => {});
  }, [portalSelectedClientId]);

  // Direct Signed Cloudinary Upload + Server Proxy (/api/upload -> Cloudinary / Supabase)
  const uploadAssetFile = async (file: File, onComplete: (url: string, detectedType: 'PHOTO' | 'VIDEO') => void) => {
    setUploadingFile(true);
    setUploadProgressText('Preparing upload...');
    const detectedType: 'PHOTO' | 'VIDEO' = file.type.startsWith('video/') || /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(file.name)
      ? 'VIDEO'
      : 'PHOTO';

    const uploadViaProxy = async () => {
      setUploadProgressText('Uploading via secure Cloudinary / Supabase backend...');
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || (!data.url && !data.secure_url)) {
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      return data.secure_url || data.url;
    };

    try {
      let ticket: any = null;
      try {
        const sigRes = await fetch('/api/cloudinary-signature');
        if (sigRes.ok) ticket = await sigRes.json();
      } catch {
        ticket = null;
      }

      if (ticket?.signature && ticket?.cloudName) {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', ticket.apiKey);
          formData.append('timestamp', String(ticket.timestamp));
          formData.append('signature', ticket.signature);
          formData.append('folder', ticket.folder || 'madecc');

          xhr.open('POST', `https://api.cloudinary.com/v1_1/${ticket.cloudName}/auto/upload`, true);
          setUploadProgressText('Uploading directly to Cloudinary (0%)...');

          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              setUploadProgressText(`Uploading to Cloudinary: ${pct}%`);
            }
          };

          xhr.onload = async () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const parsed = JSON.parse(xhr.responseText);
                const url = parsed.secure_url || parsed.url;
                if (url) {
                  onComplete(url, detectedType);
                  resolve();
                  return;
                }
              } catch {
                // fallback
              }
            }
            try {
              const fallbackUrl = await uploadViaProxy();
              onComplete(fallbackUrl, detectedType);
              resolve();
            } catch (err) {
              reject(err);
            }
          };

          xhr.onerror = async () => {
            try {
              const fallbackUrl = await uploadViaProxy();
              onComplete(fallbackUrl, detectedType);
              resolve();
            } catch (err) {
              reject(err);
            }
          };

          xhr.send(formData);
        });
      } else {
        const fallbackUrl = await uploadViaProxy();
        onComplete(fallbackUrl, detectedType);
      }

      showToast(`${detectedType === 'VIDEO' ? 'Video' : 'Photo'} uploaded to cloud storage!`);
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploadingFile(false);
      setUploadProgressText('');
    }
  };

  // Share via SMTP Email Handler
  const handleSendShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareRecipient.trim()) return;
    setSharingEmail(true);
    try {
      const res = await fetch('/api/erp/share-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: shareRecipient.trim(),
          subject: shareModal.subject,
          title: shareModal.title,
          summary: shareModal.summary,
          detailsHtml: shareModal.detailsHtml,
          actionLabel: shareModal.actionLabel || 'Open MADECC Portal',
          actionUrl: shareModal.actionUrl || window.location.origin,
          senderName: 'MADECC GROUP Construction Admin'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'SMTP send failed');
      showToast(data.message || 'Shared successfully via SMTP (kreboya603@gmail.com)');
      setShareModal({ open: false, title: '', subject: '', summary: '', detailsHtml: '' });
      setShareRecipient('');
    } catch (err: any) {
      showToast(err.message || 'Email share failed', 'error');
    } finally {
      setSharingEmail(false);
    }
  };

  // Client CRUD Handlers
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed creating client');
      setClients(prev => [data.client, ...prev]);
      setShowAddClientModal(false);
      setNewClient({
        fullName: '', companyName: '', email: '', phone: '', phoneSecondary: '',
        address: '', city: 'Yaoundé', notes: '', defaultPassword: 'Client2026@Madecc',
        projectId: '', sendEmailInvite: true
      });
      showToast(data.message || 'Client account created!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const res = await fetch(`/api/erp/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editingClient.full_name,
          companyName: editingClient.company_name,
          email: editingClient.email,
          phone: editingClient.phone,
          city: editingClient.city,
          address: editingClient.address,
          status: editingClient.status
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...data.client } : c));
      setEditingClient(null);
      showToast('Client record updated in Neon PostgreSQL.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSendCredentialsSmtp = async (clientId: number) => {
    try {
      const res = await fetch(`/api/erp/clients/${clientId}/send-credentials`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      showToast(data.message || 'Credentials emailed via kreboya603@gmail.com');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteClient = async (clientId: number) => {
    try {
      const res = await fetch(`/api/erp/clients/${clientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setClients(prev => prev.filter(c => c.id !== clientId));
      showToast('Client deleted.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Live Site Progress Updates CRUD
  const handleSaveProgressUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUpdate) {
        const res = await fetch(`/api/erp/updates/${editingUpdate.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: editingUpdate.phase,
            title: editingUpdate.title,
            summary: editingUpdate.summary,
            completionPercentage: Number(editingUpdate.completion_percentage),
            statusBadge: editingUpdate.status_badge,
            scheduleVariance: editingUpdate.schedule_variance,
            delayExplanation: editingUpdate.delay_explanation,
            supervisorName: editingUpdate.supervisor_name,
            supervisorPhone: editingUpdate.supervisor_phone,
            workforceOnSite: Number(editingUpdate.workforce_on_site || 0),
            weather: editingUpdate.weather,
            attachmentUrl: editingUpdate.attachment_url,
            isClientVisible: editingUpdate.is_client_visible
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message);
        setProgressUpdates(prev => prev.map(u => u.id === editingUpdate.id ? data.update : u));
        setEditingUpdate(null);
        showToast('Live site update updated in Neon!');
        return;
      }

      const res = await fetch(`/api/erp/projects/${selectedProjectId}/updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUpdate)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setProgressUpdates(prev => [data.update, ...prev]);

      // Optionally mirror attachment into project_media gallery
      if (newUpdate.alsoAddToGallery && newUpdate.attachmentUrl) {
        const mRes = await fetch(`/api/erp/projects/${selectedProjectId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phase: newUpdate.phase,
            mediaType: newUpdate.attachmentType,
            title: newUpdate.title,
            description: newUpdate.summary,
            mediaUrl: newUpdate.attachmentUrl,
            isClientVisible: newUpdate.isClientVisible,
            uploadedBy: newUpdate.supervisorName
          })
        }).then(r => r.json()).catch(() => null);
        if (mRes?.success) setMediaList(prev => [mRes.media, ...prev]);
      }

      setShowUpdateModal(false);
      setNewUpdate({
        phase: 'Superstructure & Columns',
        title: '',
        summary: '',
        completionPercentage: 60,
        statusBadge: 'ON_SCHEDULE',
        scheduleVariance: 'On Schedule per Master GANTT',
        delayExplanation: '',
        supervisorName: 'Ing. Arnaud Fopa (ONIGC Registered)',
        supervisorPhone: '+237 671 06 35 11',
        workforceOnSite: 16,
        weather: 'Clear / Dry',
        attachmentUrl: '',
        attachmentType: 'PHOTO',
        isClientVisible: true,
        alsoAddToGallery: true,
        notifyClient: true,
        projectStatus: ''
      });
      showToast(data.message || 'Site update published to Client Portal!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUpdateVisibility = async (upd: any) => {
    try {
      const res = await fetch(`/api/erp/updates/${upd.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClientVisible: !upd.is_client_visible })
      });
      const data = await res.json();
      if (data.success) {
        setProgressUpdates(prev => prev.map(u => u.id === upd.id ? data.update : u));
        showToast(!upd.is_client_visible ? 'Published to Client Portal' : 'Hidden from Client Portal');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/erp/updates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProgressUpdates(prev => prev.filter(u => u.id !== id));
        showToast('Site progress update removed.');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Milestones CRUD
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/erp/projects/${selectedProjectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setMilestones(prev => [...prev, data.milestone]);
      setShowAddMilestoneModal(false);
      setNewMilestone({ milestone: '', description: '', percentage: 0, status: 'Pending', date: new Date().toISOString().split('T')[0] });
      showToast('Milestone registered to Neon schedule.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveEditMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMilestone) return;
    try {
      const pct = Number(editingMilestone.percentage || 0);
      const status = editingMilestone.status || (pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Pending');
      const res = await fetch(`/api/erp/milestones/${editingMilestone.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone: editingMilestone.milestone_name || editingMilestone.milestone,
          description: editingMilestone.description,
          percentage: pct,
          status,
          date: editingMilestone.date
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setMilestones(prev => prev.map(m => m.id === editingMilestone.id ? data.milestone : m));
      setEditingMilestone(null);
      showToast('Milestone updated & synced with Client Portal.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteMilestone = async (id: number) => {
    try {
      const res = await fetch(`/api/erp/milestones/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMilestones(prev => prev.filter(m => m.id !== id));
        showToast('Milestone deleted.');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Media CRUD
  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/erp/projects/${selectedProjectId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setMediaList(prev => [data.media, ...prev]);
      setShowAddMediaModal(false);
      setNewMedia({ phase: 'Superstructure & Columns', mediaType: 'PHOTO', title: '', description: '', mediaUrl: '', isClientVisible: true, notifyClient: false });
      showToast('Progress media saved to Neon & cloud storage.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleMediaVisibility = async (mediaId: number, currentVisible: boolean) => {
    try {
      const res = await fetch(`/api/erp/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClientVisible: !currentVisible })
      });
      const data = await res.json();
      if (data.success) {
        setMediaList(prev => prev.map(m => m.id === mediaId ? data.media : m));
        showToast(`Media ${!currentVisible ? 'published to' : 'hidden from'} Client Portal`);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteMedia = async (mediaId: number) => {
    try {
      const res = await fetch(`/api/erp/media/${mediaId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMediaList(prev => prev.filter(m => m.id !== mediaId));
        showToast('Media deleted.');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Invoices CRUD & Payment
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = [{
        description: newInvoice.description,
        category: newInvoice.category,
        unit: newInvoice.unit,
        quantity: Number(newInvoice.quantity),
        unitPriceXaf: Number(newInvoice.unitPriceXaf)
      }];
      const res = await fetch('/api/erp/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newInvoice, items })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadAllData();
      setShowAddInvoiceModal(false);
      showToast('Official project invoice issued & emailed if enabled.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;
    try {
      const res = await fetch(`/api/erp/invoices/${paymentModalInvoice.id}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentInput)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setPaymentModalInvoice(null);
      await loadAllData();
      showToast(data.message || 'Payment recorded & receipt emailed.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteInvoice = async (id: number) => {
    try {
      const res = await fetch(`/api/erp/invoices/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setInvoices(prev => prev.filter(i => i.id !== id));
        showToast('Invoice deleted.');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Cost Estimator
  const calculateEstimate = async () => {
    try {
      const res = await fetch('/api/erp/estimates/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estParams)
      });
      const data = await res.json();
      if (data.success) setEstResult(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Inventory Movement
  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovement)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadAllData();
      setShowAddMovementModal(false);
      showToast('Stock movement recorded in Neon PostgreSQL.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Equipment CRUD
  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipment)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadAllData();
      setShowAddEquipmentModal(false);
      showToast('Equipment registered to fleet.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceEquipment) return;
    try {
      const res = await fetch(`/api/erp/equipment/${maintenanceEquipment.id}/maintenance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setMaintenanceEquipment(null);
      await loadAllData();
      showToast('Maintenance log recorded.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Subcontractor CRUD
  const handleCreateSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/subcontractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      setSubcontractors(prev => [...prev, data.subcontractor]);
      setShowAddSubModal(false);
      showToast('Subcontractor added.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Worker CRUD & Attendance
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorker)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadAllData();
      setShowAddWorkerModal(false);
      showToast('Worker added to roster.');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveAttendance = async () => {
    try {
      const records = workers.map(w => ({
        workerId: w.id,
        projectId: selectedProjectId,
        status: 'PRESENT',
        regularHours: 8.0,
        overtimeHours: 0,
        dailyRateXaf: w.daily_rate_xaf
      }));
      const res = await fetch('/api/erp/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          date: attendanceDate,
          projectId: selectedProjectId,
          supervisorSignoff: 'Eng. Arnaud Fopa (Site Lead)'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      showToast(`Attendance signed off for ${records.length} crew members.`);
      loadProjectSpecificData(selectedProjectId);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const currentProjectObj = projects.find(p => p.id === selectedProjectId) || projects[0];
  const latestUpdateObj = progressUpdates[0];
  const avgMilestonePct = milestones.length > 0
    ? Math.round(milestones.reduce((acc, m) => acc + Number(m.percentage || 0), 0) / milestones.length)
    : 0;
  const liveCompletionPct = latestUpdateObj?.completion_percentage ?? (avgMilestonePct || 35);

  const sections = [
    { id: 'clients', label: '1. Client Management', icon: Users },
    { id: 'portal', label: '2. Client Portal Access', icon: ShieldCheck },
    { id: 'progress', label: '3. Live Project Progress', icon: Clock },
    { id: 'media', label: '4. Photos & Videos', icon: Camera },
    { id: 'milestones', label: '5. Milestones', icon: CheckCircle2 },
    { id: 'invoices', label: '6. Invoices & Billing', icon: DollarSign },
    { id: 'estimator', label: '7. Cost Estimator', icon: Calculator },
    { id: 'boq', label: '8. BOQ Management', icon: FileSpreadsheet },
    { id: 'inventory', label: '9. Materials Inventory', icon: Package },
    { id: 'equipment', label: '10. Equipment Fleet', icon: Truck },
    { id: 'subcontractors', label: '11. Subcontractors', icon: Wrench },
    { id: 'workforce', label: '12. Workforce', icon: UserCheck },
    { id: 'reports', label: '13. Reports & Analytics', icon: BarChart3 }
  ];

  const filteredClients = clients.filter(c => {
    const matchesStatus = clientStatusFilter === 'ALL' || (c.status || 'ACTIVE') === clientStatusFilter;
    const s = clientSearch.toLowerCase();
    const matchesQuery = !s || c.full_name?.toLowerCase().includes(s) || c.client_code?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s) || c.company_name?.toLowerCase().includes(s);
    return matchesStatus && matchesQuery;
  });

  const filteredUpdates = progressUpdates.filter(u => {
    const matchesStatus = updateStatusFilter === 'ALL' || u.status_badge === updateStatusFilter;
    const s = updateSearch.toLowerCase();
    const matchesQuery = !s || u.title?.toLowerCase().includes(s) || u.summary?.toLowerCase().includes(s) || u.phase?.toLowerCase().includes(s);
    return matchesStatus && matchesQuery;
  });

  const filteredMedia = mediaList.filter(m => {
    const matchesPhase = mediaPhaseFilter === 'ALL' || m.phase === mediaPhaseFilter;
    const isVid = isVideoAsset(m.media_url, m.media_type);
    const matchesType = mediaTypeFilter === 'ALL' || (mediaTypeFilter === 'VIDEO' ? isVid : !isVid);
    const s = mediaSearch.toLowerCase();
    const matchesQuery = !s || m.title?.toLowerCase().includes(s) || m.description?.toLowerCase().includes(s);
    return matchesPhase && matchesType && matchesQuery;
  });

  const filteredMilestones = milestones.filter(m => {
    const st = m.status || (Number(m.percentage) >= 100 ? 'Completed' : Number(m.percentage) > 0 ? 'In Progress' : 'Pending');
    return milestoneStatusFilter === 'ALL' || st.toLowerCase() === milestoneStatusFilter.toLowerCase();
  });

  const filteredInvoices = invoices.filter(inv => {
    const matchesStatus = invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
    const s = invoiceSearch.toLowerCase();
    const matchesQuery = !s || inv.invoice_number?.toLowerCase().includes(s) || inv.client_name?.toLowerCase().includes(s) || inv.project_title?.toLowerCase().includes(s);
    return matchesStatus && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 ${
          toastMessage.type === 'error' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
              ENTERPRISE CONSTRUCTION ERP
            </span>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              NEON + CLOUDINARY + SMTP LIVE
            </span>
          </div>
          <h2 className="text-2xl font-black font-serif text-white mt-1">Construction Management Platform</h2>
          <p className="text-xs text-slate-400">
            Changes published here sync live to Client Portal & dispatch automated emails via kreboya603@gmail.com.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenClientPortal && (
            <button
              onClick={onOpenClientPortal}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <Eye className="w-4 h-4" />
              <span>Open Live Client Portal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-mono text-slate-300">Site:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer max-w-[200px]"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { loadAllData(); loadProjectSpecificData(selectedProjectId); }}
            title="Refresh Live DB Data"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 13 Section Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/60 no-scrollbar">
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. CLIENT MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'clients' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Registered Clients & Sponsors</h3>
              <p className="text-xs text-slate-400">Create client accounts, assign sites, dispatch SMTP credentials via kreboya603@gmail.com, and export CSV.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-grow sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search client, email or code..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <select
                value={clientStatusFilter}
                onChange={(e) => setClientStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>

              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Clients_${Date.now()}.csv`,
                  ['Code', 'Full Name', 'Company', 'Email', 'Phone', 'City', 'Status', 'Invoiced XAF', 'Outstanding XAF'],
                  filteredClients.map(c => [c.client_code, c.full_name, c.company_name, c.email, c.phone, c.city, c.status, c.total_invoiced_xaf, c.outstanding_balance_xaf])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={() => setShowAddClientModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Client & Company</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-center">Projects</th>
                  <th className="p-3.5 text-right">Invoiced (XAF)</th>
                  <th className="p-3.5 text-right">Outstanding (XAF)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono text-amber-400 font-bold whitespace-nowrap">{c.client_code}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm">{c.full_name}</div>
                      <div className="text-slate-400 text-[11px]">{c.company_name || 'Private Property Sponsor'} • {c.city || 'Yaoundé'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-300">{c.email}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{c.phone || '+237 671 06 35 11'}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold">{c.assigned_projects_count || 0}</td>
                    <td className="p-3.5 text-right font-mono text-slate-300">{Number(c.total_invoiced_xaf || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">{Number(c.outstanding_balance_xaf || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                        c.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {c.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleSendCredentialsSmtp(c.id)}
                          title="Email Credentials via SMTP (kreboya603@gmail.com)"
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setClientCredentialsModal(c)}
                          title="Inspect Portal Credentials"
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-mono font-bold cursor-pointer"
                        >
                          Access
                        </button>
                        <button
                          onClick={() => setEditingClient({ ...c })}
                          title="Edit Client"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(c.id)}
                          title="Delete Client"
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================= */}
      {/* 2. CLIENT PORTAL MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'portal' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Client Portal Access & Project Permissions</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Assign construction projects to specific client accounts. Every update, milestone, photo/video, and invoice published for an assigned site immediately appears in that client's dashboard.
                </p>
              </div>
              {onOpenClientPortal && (
                <button
                  onClick={onOpenClientPortal}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Open Client Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3 text-xs">
                <h4 className="text-sm font-bold text-amber-400">Assign Project to Client</h4>
                <div>
                  <label className="text-slate-400 block mb-1">Select Client</label>
                  <select
                    value={portalSelectedClientId}
                    onChange={(e) => setPortalSelectedClientId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.client_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Select Construction Site</label>
                  <select
                    value={portalAssignProjectId}
                    onChange={(e) => setPortalAssignProjectId(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title} ({p.location})</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={async () => {
                    if (!portalSelectedClientId || !portalAssignProjectId) return;
                    const res = await fetch(`/api/erp/clients/${portalSelectedClientId}/assign-project`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ projectId: portalAssignProjectId, role: 'PROPERTY_OWNER', accessLevel: 'FULL' })
                    });
                    const data = await res.json();
                    if (data.success) {
                      showToast('Project permissions granted to client.');
                      const refreshed = await fetch(`/api/erp/clients/${portalSelectedClientId}/projects`).then(r => r.json());
                      if (refreshed.success) setClientAssignedProjects(refreshed.projects || []);
                      loadAllData();
                    }
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Confirm Project Assignment
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 space-y-3">
                <h4 className="text-sm font-bold text-sky-400">Currently Assigned Sites for Selected Client</h4>
                {clientAssignedProjects.length === 0 ? (
                  <p className="text-xs text-slate-400">No explicit project mappings yet (default fallback site shown on demo login).</p>
                ) : (
                  <div className="space-y-2">
                    {clientAssignedProjects.map(ap => (
                      <div key={ap.id} className="p-3 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{ap.title}</div>
                          <div className="text-[11px] text-slate-400">{ap.location} • Role: {ap.role}</div>
                        </div>
                        <button
                          onClick={async () => {
                            await fetch(`/api/erp/clients/${portalSelectedClientId}/projects/${ap.project_id}`, { method: 'DELETE' });
                            setClientAssignedProjects(prev => prev.filter(x => x.project_id !== ap.project_id));
                            showToast('Project unassigned from client.');
                            loadAllData();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. LIVE PROJECT PROGRESS & SITE UPDATES PUBLISHER */}
      {/* ========================================================= */}
      {activeSection === 'progress' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Live Site Execution Progress & Client Updates</h3>
              <p className="text-xs text-slate-400">
                Publish live structural updates, completion %, supervisor reports & delay notices directly to <strong className="text-amber-400">{currentProjectObj?.title || `Site #${selectedProjectId}`}</strong>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Site_Progress_${selectedProjectId}.csv`,
                  ['Date', 'Phase', 'Title', 'Completion %', 'Status', 'Variance', 'Supervisor', 'Client Visible', 'Summary'],
                  filteredUpdates.map(u => [u.update_date, u.phase, u.title, u.completion_percentage, u.status_badge, u.schedule_variance, u.supervisor_name, u.is_client_visible ? 'YES' : 'NO', u.summary])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <button
                onClick={() => setShowUpdateModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Publish Site Update</span>
              </button>
            </div>
          </div>

          {/* Live Dynamic Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Active Construction Phase</span>
              <div className="text-base font-bold text-amber-400 mt-1">
                {latestUpdateObj?.phase || 'Foundation & Earthworks'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                {latestUpdateObj?.title || 'Ready for initial site progress report'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Overall Site Completion</span>
              <div className="text-2xl font-black text-white mt-1">{liveCompletionPct}%</div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: `${liveCompletionPct}%` }} />
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Schedule Status</span>
              <div className={`text-base font-bold mt-1 ${
                latestUpdateObj?.status_badge === 'DELAYED' ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {latestUpdateObj?.schedule_variance || 'On Schedule'}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Status Badge: {latestUpdateObj?.status_badge || 'ON_SCHEDULE'}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 font-mono">Supervising Lead & Crew</span>
              <div className="text-sm font-bold text-white mt-1 line-clamp-1">
                {latestUpdateObj?.supervisor_name || 'Ing. Arnaud Fopa (ONIGC)'}
              </div>
              <div className="text-[11px] text-amber-400 mt-1 font-mono">
                {latestUpdateObj?.workforce_on_site || 14} Personnel On Site • {latestUpdateObj?.weather || 'Clear'}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-grow max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search site updates, phase or notes..."
                value={updateSearch}
                onChange={(e) => setUpdateSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>
            <select
              value={updateStatusFilter}
              onChange={(e) => setUpdateStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            >
              <option value="ALL">All Update Statuses</option>
              <option value="ON_SCHEDULE">On Schedule</option>
              <option value="AHEAD_OF_SCHEDULE">Ahead of Schedule</option>
              <option value="DELAYED">Delayed / Weather Hold</option>
              <option value="INSPECTION_PASSED">Inspection Passed</option>
              <option value="COMPLETED">Phase Completed</option>
            </select>
          </div>

          {/* Live Updates Feed */}
          <div className="space-y-4">
            {filteredUpdates.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                No site progress updates recorded yet for this project. Click <strong>Publish Site Update</strong> to push a live update to the Client Portal.
              </div>
            ) : (
              filteredUpdates.map(upd => (
                <div key={upd.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col lg:flex-row gap-5">
                  {upd.attachment_url && (
                    <div className="w-full lg:w-56 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                      {isVideoAsset(upd.attachment_url, upd.attachment_type) ? (
                        <video src={upd.attachment_url} controls playsInline className="w-full h-full object-cover" />
                      ) : (
                        <img src={upd.attachment_url} alt={upd.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                  )}

                  <div className="flex-grow space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
                          {upd.phase}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          upd.status_badge === 'DELAYED'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {upd.status_badge} ({upd.completion_percentage}%)
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{upd.update_date}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleToggleUpdateVisibility(upd)}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg cursor-pointer ${
                            upd.is_client_visible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {upd.is_client_visible ? 'Published to Client' : 'Internal Draft'}
                        </button>
                        <button
                          onClick={() => setShareModal({
                            open: true,
                            title: `Site Update: ${upd.title}`,
                            subject: `MADECC Site Progress (${upd.completion_percentage}%): ${upd.title}`,
                            summary: upd.summary,
                            detailsHtml: `<p><strong>Project:</strong> ${currentProjectObj?.title || ''}</p><p><strong>Phase:</strong> ${upd.phase}</p><p><strong>Completion:</strong> ${upd.completion_percentage}%</p><p><strong>Supervisor:</strong> ${upd.supervisor_name}</p>`,
                            actionLabel: 'Open Client Portal',
                            actionUrl: `${window.location.origin}/client-portal`
                          })}
                          title="Email Progress Report via SMTP"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUpdate({ ...upd })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUpdate(upd.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-white">{upd.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{upd.summary}</p>
                    {upd.delay_explanation && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                        <strong>Delay Note:</strong> {upd.delay_explanation}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-4 pt-1">
                      <span>Engineer: <strong className="text-slate-200">{upd.supervisor_name}</strong></span>
                      <span>Crew: <strong className="text-slate-200">{upd.workforce_on_site} workers</strong></span>
                      <span>Weather: <strong className="text-slate-200">{upd.weather}</strong></span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PROGRESS PHOTOS & VIDEOS */}
      {/* ========================================================= */}
      {activeSection === 'media' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Site Photographic & Video Evidence</h3>
              <p className="text-xs text-slate-400">Upload real photos & videos directly to Cloudinary / Supabase and control Client Portal visibility.</p>
            </div>
            <button
              onClick={() => setShowAddMediaModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Photo / Video</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-grow max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filter media..."
                value={mediaSearch}
                onChange={(e) => setMediaSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              />
            </div>

            <select
              value={mediaPhaseFilter}
              onChange={(e) => setMediaPhaseFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
            >
              <option value="ALL">All Construction Phases</option>
              {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {(['ALL', 'PHOTO', 'VIDEO'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setMediaTypeFilter(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                    mediaTypeFilter === t ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredMedia.map(m => {
              const isVid = isVideoAsset(m.media_url, m.media_type);
              return (
                <div key={m.id} className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-lg flex flex-col">
                  <div className="relative aspect-video bg-slate-950">
                    {isVid ? (
                      <video src={m.media_url} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                    ) : (
                      <img src={m.media_url} alt={m.title} className="w-full h-full object-cover" />
                    )}
                    <div className="absolute top-2 left-2 bg-slate-950/85 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                      {isVid ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                      <span>{m.phase}</span>
                    </div>
                  </div>

                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-sm font-bold text-white">{m.title}</h4>
                        <button
                          onClick={() => handleToggleMediaVisibility(m.id, m.is_client_visible)}
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full cursor-pointer shrink-0 ${
                            m.is_client_visible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                          }`}
                        >
                          {m.is_client_visible ? 'Client Visible' : 'Internal'}
                        </button>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{m.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-mono text-slate-500">{m.upload_date}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={m.media_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                          title="Download Media"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDeleteMedia(m.id)}
                          className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          title="Delete Media"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. PROJECT MILESTONES */}
      {/* ========================================================= */}
      {activeSection === 'milestones' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">GANTT Milestones Schedule</h3>
              <p className="text-xs text-slate-400">Synchronized directly with Neon <code>project_progress</code> and visible in real time inside Client Portal.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={milestoneStatusFilter}
                onChange={(e) => setMilestoneStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending">Pending</option>
              </select>
              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Milestones_Proj_${selectedProjectId}.csv`,
                  ['Milestone', 'Description', 'Target Date', 'Progress %', 'Status'],
                  filteredMilestones.map(m => [m.milestone_name || m.milestone, m.description, m.date, m.percentage, m.status])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAddMilestoneModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Milestone</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Milestone Description</th>
                  <th className="p-3.5">Target Date</th>
                  <th className="p-3.5 text-center">Progress</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredMilestones.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">No milestones found for this filter.</td>
                  </tr>
                ) : (
                  filteredMilestones.map(m => (
                    <tr key={m.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{m.milestone_name || m.milestone}</div>
                        <div className="text-slate-400 text-[11px]">{m.description}</div>
                      </td>
                      <td className="p-3.5 font-mono text-slate-300">{m.date}</td>
                      <td className="p-3.5 text-center font-mono font-bold text-amber-400">{m.percentage}%</td>
                      <td className="p-3.5 text-center">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          Number(m.percentage) >= 100 || m.status === 'Completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : Number(m.percentage) > 0
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-400'
                        }`}>
                          {m.status || (Number(m.percentage) >= 100 ? 'Completed' : 'In Progress')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setEditingMilestone({ ...m })}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMilestone(m.id)}
                            className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. PROJECT INVOICES */}
      {/* ========================================================= */}
      {activeSection === 'invoices' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Commercial Invoices & Billing</h3>
              <p className="text-xs text-slate-400">Issue invoices with Cameroon TVA (19.25%), dispatch SMTP receipts via kreboya603@gmail.com, and export CSV/PDF.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search invoice # or client..."
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
                />
              </div>
              <select
                value={invoiceStatusFilter}
                onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ISSUED">Issued</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
              </select>
              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Invoices_${Date.now()}.csv`,
                  ['Invoice #', 'Client', 'Project', 'Issue Date', 'Due Date', 'Subtotal XAF', 'Total TTC XAF', 'Paid XAF', 'Balance Due XAF', 'Status'],
                  filteredInvoices.map(i => [i.invoice_number, i.client_name, i.project_title, i.issue_date, i.due_date, i.subtotal_xaf, i.total_amount_xaf, i.paid_amount_xaf, i.balance_due_xaf, i.status])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAddInvoiceModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Invoice</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Client & Project</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5 text-right">Total TTC (XAF)</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/30">
                    <td className="p-3.5 font-mono text-amber-400 font-bold whitespace-nowrap">{inv.invoice_number}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{inv.client_name || 'Direct Client'}</div>
                      <div className="text-slate-400 text-[11px]">{inv.project_title}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                      <div>Issued: {inv.issue_date}</div>
                      <div className="text-amber-400">Due: {inv.due_date}</div>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">{Number(inv.total_amount_xaf).toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">{Number(inv.balance_due_xaf).toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectInvoice(inv)}
                          title="View & Print Tax Invoice"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setShareRecipient(inv.client_email || '');
                            setShareModal({
                              open: true,
                              title: `Official Invoice ${inv.invoice_number}`,
                              subject: `MADECC GROUP Invoice ${inv.invoice_number} (${Number(inv.balance_due_xaf).toLocaleString()} XAF Due)`,
                              summary: `Please review your project invoice ${inv.invoice_number} for ${inv.project_title}.`,
                              detailsHtml: `<p><strong>Total (TTC):</strong> ${Number(inv.total_amount_xaf).toLocaleString()} XAF</p><p><strong>Balance Due:</strong> ${Number(inv.balance_due_xaf).toLocaleString()} XAF</p><p><strong>Due Date:</strong> ${inv.due_date}</p>`,
                              actionLabel: 'Open Billing Portal',
                              actionUrl: `${window.location.origin}/client-portal`
                            });
                          }}
                          title="Email Invoice via SMTP"
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        {Number(inv.balance_due_xaf) > 0 && (
                          <button
                            onClick={() => {
                              setPaymentModalInvoice(inv);
                              setPaymentInput({
                                amountXaf: Number(inv.balance_due_xaf),
                                paymentMethod: 'MTN_MOMO',
                                paymentReference: `MOMO-${Date.now().toString().slice(-6)}`,
                                notes: ''
                              });
                            }}
                            className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 font-bold text-[11px] cursor-pointer"
                          >
                            Record Payment
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteInvoice(inv.id)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* ========================================================= */}
      {/* 7. COST ESTIMATOR & 8. BOQ MANAGEMENT */}
      {/* ========================================================= */}
      {(activeSection === 'estimator' || activeSection === 'boq') && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Cameroon Standards Cost Estimator & BOQ Engine</h3>
                <p className="text-xs text-slate-400">Calculate real-time construction trade packages with 5% contingency and 19.25% TVA.</p>
              </div>
              {estResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareModal({
                      open: true,
                      title: 'Construction BOQ Cost Estimate',
                      subject: `MADECC BOQ Cost Estimate (${estParams.buildingType} • ${estParams.totalFloorAreaM2} m²)`,
                      summary: `Estimated Grand Total (TTC): ${estResult.summary.grandTotalXaf.toLocaleString()} XAF in ${estParams.city}.`,
                      detailsHtml: `<p><strong>Base Rate:</strong> ${estResult.summary.baseRatePerM2.toLocaleString()} XAF/m²</p><p><strong>TVA (19.25%):</strong> ${estResult.summary.tvaXaf.toLocaleString()} XAF</p><p><strong>Grand Total:</strong> ${estResult.summary.grandTotalXaf.toLocaleString()} XAF</p>`
                    })}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Email BOQ via SMTP</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print BOQ</span>
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Building Type</label>
                <select
                  value={estParams.buildingType}
                  onChange={(e) => setEstParams(p => ({ ...p, buildingType: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="VILLA">Luxury Villa / Residential</option>
                  <option value="COMMERCIAL">Commercial Office Building</option>
                  <option value="MULTI_FAMILY">Apartment Block (R+3+)</option>
                  <option value="INDUSTRIAL">Industrial Warehouse</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Finish Quality</label>
                <select
                  value={estParams.finishQuality}
                  onChange={(e) => setEstParams(p => ({ ...p, finishQuality: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="STANDARD">Standard Finish</option>
                  <option value="MODERN">Modern Architectural</option>
                  <option value="LUXURY">Prestige / Executive</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Total Area (m²)</label>
                <input
                  type="number"
                  value={estParams.totalFloorAreaM2}
                  onChange={(e) => setEstParams(p => ({ ...p, totalFloorAreaM2: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Elevation (Floors)</label>
                <input
                  type="number"
                  value={estParams.floorsCount}
                  onChange={(e) => setEstParams(p => ({ ...p, floorsCount: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={calculateEstimate}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Compute BOQ</span>
                </button>
              </div>
            </div>

            {estResult && (
              <div className="space-y-6 pt-6 border-t border-slate-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Unit Rate per m²</span>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {estResult.summary.baseRatePerM2.toLocaleString()} XAF/m²
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Contingency (5%)</span>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                      {estResult.summary.contingencyXaf.toLocaleString()} XAF
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Cameroon TVA (19.25%)</span>
                    <div className="text-lg font-bold font-mono text-sky-400 mt-1">
                      {estResult.summary.tvaXaf.toLocaleString()} XAF
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Grand Total (TTC)</span>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                      {estResult.summary.grandTotalXaf.toLocaleString()} XAF
                    </div>
                  </div>
                </div>

                <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-950">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">Itemized Trade Breakdown (BOQ)</span>
                    <button
                      onClick={() => downloadCsvFile(
                        `MADECC_BOQ_Estimate_${Date.now()}.csv`,
                        ['Trade Code', 'Trade Name', 'Category', 'Materials XAF', 'Labour XAF', 'Equipment XAF', 'Total XAF'],
                        estResult.boqItems.map((i: any) => [i.tradeCode, i.tradeName, i.category, i.materialsAmountXaf, i.labourAmountXaf, i.equipmentAmountXaf, i.totalAmountXaf])
                      )}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export BOQ CSV</span>
                    </button>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Trade / Work Package</th>
                        <th className="p-3 text-right">Materials (XAF)</th>
                        <th className="p-3 text-right">Labour (XAF)</th>
                        <th className="p-3 text-right">Equipment (XAF)</th>
                        <th className="p-3 text-right">Subtotal (XAF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {estResult.boqItems.map((item: any) => (
                        <tr key={item.tradeCode} className="hover:bg-slate-900/30">
                          <td className="p-3 text-amber-500 font-bold">{item.tradeCode}</td>
                          <td className="p-3 font-sans font-medium text-white">{item.tradeName}</td>
                          <td className="p-3 text-right text-slate-300">{item.materialsAmountXaf.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-300">{item.labourAmountXaf.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-300">{item.equipmentAmountXaf.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-amber-400">{item.totalAmountXaf.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MATERIALS INVENTORY */}
      {/* ========================================================= */}
      {activeSection === 'inventory' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Materials & Stock Movement Control</h3>
              <p className="text-xs text-slate-400">Track site receipts, warehouse dispatches, low stock alerts, and export logs.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search SKU..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              />
              <button
                onClick={() => setInventoryLowStockOnly(!inventoryLowStockOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border ${
                  inventoryLowStockOnly ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                Low Stock Filter
              </button>
              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Inventory_${Date.now()}.csv`,
                  ['Code', 'Material', 'Category', 'In Stock', 'Unit', 'Supplier'],
                  inventoryItems.map(i => [i.itemCode || i.item_code || i.id, i.name, i.category, i.quantityInStock ?? i.quantity_in_stock ?? 0, i.unit, i.supplier])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAddMovementModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Record Movement</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span>Current Warehouse Inventory</span>
                <span className="text-[11px] font-mono text-amber-400">{inventoryItems.length} SKUs Tracked</span>
              </h4>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {inventoryItems
                  .filter(item => {
                    const qty = Number(item.quantityInStock ?? item.quantity_in_stock ?? item.quantity ?? 0);
                    const minStock = Number(item.minStock ?? item.min_stock ?? 10);
                    const matchesLow = !inventoryLowStockOnly || qty <= minStock;
                    const matchesSearch = !inventorySearch || item.name?.toLowerCase().includes(inventorySearch.toLowerCase());
                    return matchesLow && matchesSearch;
                  })
                  .map(item => {
                    const qty = Number(item.quantityInStock ?? item.quantity_in_stock ?? item.quantity ?? 0);
                    const minStock = Number(item.minStock ?? item.min_stock ?? 10);
                    return (
                      <div key={item.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">Code: {item.itemCode || item.item_code || `INV-${item.id}`} • {item.category}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-mono font-bold text-sm ${qty <= minStock ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {qty} {item.unit}
                          </div>
                          <div className="text-[10px] text-slate-400">{item.supplier || 'Standard Stock'}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-3">Recent Movement History</h4>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {inventoryMovements.map(mov => (
                  <div key={mov.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-amber-400 font-bold">{mov.movement_type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{mov.movement_date}</span>
                    </div>
                    <div className="text-white font-medium">
                      Quantity: {mov.quantity} {mov.unit} • Total: {Number(mov.total_cost_xaf).toLocaleString()} XAF
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Site: {mov.project_title} • Authorized by: {mov.authorized_by}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. EQUIPMENT MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'equipment' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Machinery & Heavy Equipment Fleet</h3>
              <p className="text-xs text-slate-400">Assign equipment to sites, log preventative maintenance, and export fleet registry.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search equipment..."
                value={equipmentSearch}
                onChange={(e) => setEquipmentSearch(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              />
              <select
                value={equipmentStatusFilter}
                onChange={(e) => setEquipmentStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="UNDER_MAINTENANCE">Maintenance</option>
              </select>
              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Equipment_Fleet_${Date.now()}.csv`,
                  ['Asset Tag', 'Name', 'Brand/Model', 'Status', 'Operator', 'Site', 'Hourly Rate XAF'],
                  equipmentList.map(e => [e.asset_tag, e.name, e.brand_model, e.status, e.assigned_operator, e.assigned_project_title, e.hourly_rate_xaf])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAddEquipmentModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Register Equipment</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {equipmentList
              .filter(eq => {
                const st = equipmentStatusFilter === 'ALL' || eq.status === equipmentStatusFilter;
                const q = !equipmentSearch || eq.name?.toLowerCase().includes(equipmentSearch.toLowerCase()) || eq.asset_tag?.toLowerCase().includes(equipmentSearch.toLowerCase());
                return st && q;
              })
              .map(eq => (
                <div key={eq.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-amber-400 font-bold">{eq.asset_tag}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        eq.status === 'ASSIGNED' ? 'bg-sky-500/20 text-sky-400' : eq.status === 'UNDER_MAINTENANCE' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {eq.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white">{eq.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{eq.brand_model} • {eq.category}</p>

                    <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Assigned Site:</span>
                        <span className="text-white font-medium">{eq.assigned_project_title || 'Depot'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Operator:</span>
                        <span className="text-white font-medium">{eq.assigned_operator || 'Standby'}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Hourly Rate:</span>
                        <span className="font-mono text-amber-400 font-bold">{Number(eq.hourly_rate_xaf).toLocaleString()} XAF</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-[11px]">
                    <button
                      onClick={() => setMaintenanceEquipment(eq)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold cursor-pointer"
                    >
                      Log Maintenance ({eq.maintenance_records_count || 0})
                    </button>
                    <button
                      onClick={async () => {
                        const nextStatus = eq.status === 'ASSIGNED' ? 'AVAILABLE' : 'ASSIGNED';
                        await fetch(`/api/erp/equipment/${eq.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            status: nextStatus,
                            assignedProjectId: nextStatus === 'ASSIGNED' ? selectedProjectId : null
                          })
                        });
                        showToast(`Equipment marked ${nextStatus}.`);
                        loadAllData();
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                    >
                      {eq.status === 'ASSIGNED' ? 'Release to Depot' : 'Assign Site'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. SUBCONTRACTORS */}
      {/* ========================================================= */}
      {activeSection === 'subcontractors' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Specialized Subcontractors Directory</h3>
              <p className="text-xs text-slate-400">Track trade partners, RCCM registrations, and performance scorecards.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Search subcontractor..."
                value={subSearch}
                onChange={(e) => setSubSearch(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
              />
              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Subcontractors_${Date.now()}.csv`,
                  ['Company', 'Contact', 'Phone', 'Specialization', 'RCCM', 'Rating', 'Status', 'Contract Value XAF'],
                  subcontractors.map(s => [s.company_name, s.contact_person, s.phone, s.specialization, s.rccm_number, s.rating, s.status, s.total_contract_value_xaf])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAddSubModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subcontractor</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Company & Contact</th>
                  <th className="p-3.5">Specialization</th>
                  <th className="p-3.5">Registration (RCCM/NIU)</th>
                  <th className="p-3.5 text-center">Rating</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Contract Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subcontractors
                  .filter(s => !subSearch || s.company_name?.toLowerCase().includes(subSearch.toLowerCase()) || s.specialization?.toLowerCase().includes(subSearch.toLowerCase()))
                  .map(s => (
                    <tr key={s.id}>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{s.company_name}</div>
                        <div className="text-slate-400 text-[11px]">{s.contact_person} • {s.phone}</div>
                      </td>
                      <td className="p-3.5 text-amber-400 font-medium">{s.specialization}</td>
                      <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                        <div>{s.rccm_number || 'RCCM Registered'}</div>
                        <div>{s.niu_tax_number || 'NIU Verified'}</div>
                      </td>
                      <td className="p-3.5 text-center font-bold text-amber-400">★ {s.rating}</td>
                      <td className="p-3.5 text-center">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {Number(s.total_contract_value_xaf || 0).toLocaleString()} XAF
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. WORKFORCE & ATTENDANCE */}
      {/* ========================================================= */}
      {activeSection === 'workforce' && (
        <div className="space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Field Workforce & Daily Muster Roll</h3>
              <p className="text-xs text-slate-400">Record daily site attendance, hours, labour costs, and export CSV payroll sheets.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Filter worker..."
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
              />
              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Sign Off All Present</span>
              </button>
              <button
                onClick={() => downloadCsvFile(
                  `MADECC_Muster_Roll_${attendanceDate}.csv`,
                  ['Code', 'Full Name', 'Trade', 'Skill', 'Daily Rate XAF', 'Assigned Site'],
                  workers.map(w => [w.worker_code, w.full_name, w.trade_category, w.skill_level, w.daily_rate_xaf, w.assigned_project_title])
                )}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setShowAddWorkerModal(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Worker</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-x-auto bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Worker Code</th>
                  <th className="p-3.5">Artisan / Staff Name</th>
                  <th className="p-3.5">Trade & Skill Level</th>
                  <th className="p-3.5 text-right">Daily Rate (XAF)</th>
                  <th className="p-3.5 text-center">Attendance ({attendanceDate})</th>
                  <th className="p-3.5 text-right">Assigned Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {workers
                  .filter(w => !workerSearch || w.full_name?.toLowerCase().includes(workerSearch.toLowerCase()) || w.trade_category?.toLowerCase().includes(workerSearch.toLowerCase()))
                  .map(w => {
                    const attRec = attendanceList.find(a => a.worker_id === w.id);
                    return (
                      <tr key={w.id}>
                        <td className="p-3.5 font-mono text-amber-400 font-bold">{w.worker_code}</td>
                        <td className="p-3.5 font-bold text-white">{w.full_name}</td>
                        <td className="p-3.5">
                          <div className="text-white">{w.trade_category}</div>
                          <div className="text-[10px] font-mono text-slate-400">{w.skill_level}</div>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-300">{Number(w.daily_rate_xaf).toLocaleString()}</td>
                        <td className="p-3.5 text-center">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                            attRec ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {attRec ? `${attRec.status} (${attRec.regular_hours}h)` : 'Not Signed Off'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right text-slate-400 text-xs">
                          {w.assigned_project_title || 'Yaoundé Site'}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 13. REPORTS & ANALYTICS */}
      {/* ========================================================= */}
      {activeSection === 'reports' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Executive Construction Intelligence</h3>
                <p className="text-xs text-slate-400">Live Neon KPIs across projects, billing, equipment fleet, site updates, and labor burn rate.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {analyticsOverview && (
                  <button
                    onClick={() => setShareModal({
                      open: true,
                      title: 'MADECC Executive Construction Intelligence Report',
                      subject: `MADECC Executive Report - ${new Date().toISOString().split('T')[0]}`,
                      summary: 'Consolidated live executive construction KPIs from Neon PostgreSQL.',
                      detailsHtml: `
                        <p><strong>Total Invoiced:</strong> ${Number(analyticsOverview.invoices?.total_invoiced || 0).toLocaleString()} XAF</p>
                        <p><strong>Collected Cashflow:</strong> ${Number(analyticsOverview.invoices?.total_collected || 0).toLocaleString()} XAF</p>
                        <p><strong>Client Receivables Due:</strong> ${Number(analyticsOverview.invoices?.total_receivables || 0).toLocaleString()} XAF</p>
                        <p><strong>Daily Workforce Burn:</strong> ${Number(analyticsOverview.workforce?.daily_burn_rate_xaf || 0).toLocaleString()} XAF</p>
                      `
                    })}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email Report (SMTP)</span>
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Save PDF</span>
                </button>
              </div>
            </div>

            {analyticsOverview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Total Certified Invoiced</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {Number(analyticsOverview.invoices?.total_invoiced || 0).toLocaleString()} XAF
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Collected Cashflow</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {Number(analyticsOverview.invoices?.total_collected || 0).toLocaleString()} XAF
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Client Receivables Due</span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {Number(analyticsOverview.invoices?.total_receivables || 0).toLocaleString()} XAF
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Daily Workforce Burn</span>
                  <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                    {Number(analyticsOverview.workforce?.daily_burn_rate_xaf || 0).toLocaleString()} XAF
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* MODAL: SHARE VIA SMTP EMAIL */}
      {shareModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Share via Email (kreboya603@gmail.com)</span>
              </h4>
              <button onClick={() => setShareModal({ ...shareModal, open: false })} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSendShareEmail} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="font-bold text-amber-400">{shareModal.title}</div>
                <div className="text-slate-300 mt-1">{shareModal.summary}</div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Recipient Email Address</label>
                <input
                  required
                  type="email"
                  value={shareRecipient}
                  onChange={e => setShareRecipient(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShareModal({ ...shareModal, open: false })} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={sharingEmail} className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                  {sharingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CLIENT CREDENTIALS DISPLAY (No window.alert) */}
      {clientCredentialsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Client Portal Access Credentials</h4>
              <button onClick={() => setClientCredentialsModal(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="space-y-3 text-xs bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono">
              <div><span className="text-slate-400">Client:</span> <strong className="text-white">{clientCredentialsModal.full_name}</strong></div>
              <div><span className="text-slate-400">Code:</span> <strong className="text-amber-400">{clientCredentialsModal.client_code}</strong></div>
              <div><span className="text-slate-400">Email:</span> <strong className="text-white">{clientCredentialsModal.email}</strong></div>
              <div><span className="text-slate-400">Password:</span> <strong className="text-emerald-400">{clientCredentialsModal.password_hash || 'Client2026@Madecc'}</strong></div>
              <div><span className="text-slate-400">URL:</span> <strong className="text-sky-400">{window.location.origin}/client-portal</strong></div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`Portal: ${window.location.origin}/client-portal\nEmail: ${clientCredentialsModal.email}\nPassword: ${clientCredentialsModal.password_hash || 'Client2026@Madecc'}`);
                  showToast('Credentials copied to clipboard!');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
              <button
                onClick={() => {
                  handleSendCredentialsSmtp(clientCredentialsModal.id);
                  setClientCredentialsModal(null);
                }}
                className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Email via SMTP</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CLIENT */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Edit Client Account ({editingClient.client_code})</h4>
              <button onClick={() => setEditingClient(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveEditClient} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input required type="text" value={editingClient.full_name || ''} onChange={e => setEditingClient({ ...editingClient, full_name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Company / Organization</label>
                <input type="text" value={editingClient.company_name || ''} onChange={e => setEditingClient({ ...editingClient, company_name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input type="text" value={editingClient.phone || ''} onChange={e => setEditingClient({ ...editingClient, phone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Account Status</label>
                  <select value={editingClient.status || 'ACTIVE'} onChange={e => setEditingClient({ ...editingClient, status: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setEditingClient(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Register Client Account</h4>
              <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input required type="text" value={newClient.fullName} onChange={e => setNewClient({ ...newClient, fullName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Company / Organization</label>
                <input type="text" value={newClient.companyName} onChange={e => setNewClient({ ...newClient, companyName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Email Address</label>
                <input required type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Phone</label>
                  <input type="text" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input type="text" value={newClient.city} onChange={e => setNewClient({ ...newClient, city: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Portal Password</label>
                  <input type="text" value={newClient.defaultPassword} onChange={e => setNewClient({ ...newClient, defaultPassword: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Assign Initial Site</label>
                  <select value={newClient.projectId} onChange={e => setNewClient({ ...newClient, projectId: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    <option value="">-- Optional --</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 pt-1 text-slate-300 cursor-pointer">
                <input type="checkbox" checked={newClient.sendEmailInvite} onChange={e => setNewClient({ ...newClient, sendEmailInvite: e.target.checked })} />
                <span>Send login invite via SMTP (kreboya603@gmail.com)</span>
              </label>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Save & Generate Access</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PUBLISH OR EDIT SITE PROGRESS UPDATE */}
      {(showUpdateModal || editingUpdate) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">
                {editingUpdate ? 'Edit Live Site Progress Update' : `Publish Live Site Progress Update (${currentProjectObj?.title || ''})`}
              </h4>
              <button onClick={() => { setShowUpdateModal(false); setEditingUpdate(null); }} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveProgressUpdate} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Construction Phase</label>
                  <select
                    value={editingUpdate ? editingUpdate.phase : newUpdate.phase}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, phase: e.target.value }) : setNewUpdate({ ...newUpdate, phase: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Schedule Status</label>
                  <select
                    value={editingUpdate ? editingUpdate.status_badge : newUpdate.statusBadge}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, status_badge: e.target.value }) : setNewUpdate({ ...newUpdate, statusBadge: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="ON_SCHEDULE">On Schedule</option>
                    <option value="AHEAD_OF_SCHEDULE">Ahead of Schedule</option>
                    <option value="DELAYED">Delayed / Weather Hold</option>
                    <option value="INSPECTION_PASSED">Inspection Passed</option>
                    <option value="COMPLETED">Phase Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Update Headline</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Level 2 Slab Reinforcement Inspection Cleared"
                  value={editingUpdate ? editingUpdate.title : newUpdate.title}
                  onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, title: e.target.value }) : setNewUpdate({ ...newUpdate, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Engineering Summary & Executed Activities</label>
                <textarea
                  required
                  rows={3}
                  value={editingUpdate ? editingUpdate.summary : newUpdate.summary}
                  onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, summary: e.target.value }) : setNewUpdate({ ...newUpdate, summary: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Completion % (0-100)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    value={editingUpdate ? editingUpdate.completion_percentage : newUpdate.completionPercentage}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, completion_percentage: Number(e.target.value) }) : setNewUpdate({ ...newUpdate, completionPercentage: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Personnel On Site</label>
                  <input
                    type="number"
                    value={editingUpdate ? editingUpdate.workforce_on_site : newUpdate.workforceOnSite}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, workforce_on_site: Number(e.target.value) }) : setNewUpdate({ ...newUpdate, workforceOnSite: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Schedule Variance</label>
                  <input
                    type="text"
                    value={editingUpdate ? editingUpdate.schedule_variance : newUpdate.scheduleVariance}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, schedule_variance: e.target.value }) : setNewUpdate({ ...newUpdate, scheduleVariance: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Supervising Engineer</label>
                  <input
                    type="text"
                    value={editingUpdate ? editingUpdate.supervisor_name : newUpdate.supervisorName}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, supervisor_name: e.target.value }) : setNewUpdate({ ...newUpdate, supervisorName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Any Site Delay Explanation (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Heavy rain delayed exterior plastering by 2 days"
                    value={editingUpdate ? editingUpdate.delay_explanation : newUpdate.delayExplanation}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, delay_explanation: e.target.value }) : setNewUpdate({ ...newUpdate, delayExplanation: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Real Cloudinary / Supabase Attachment Uploader */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Site Photo / Video Evidence (Cloudinary & Supabase)</span>
                  <label className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{uploadingFile ? 'Uploading...' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadAssetFile(file, (url, dtype) => {
                          if (editingUpdate) {
                            setEditingUpdate({ ...editingUpdate, attachment_url: url, attachment_type: dtype });
                          } else {
                            setNewUpdate(prev => ({ ...prev, attachmentUrl: url, attachmentType: dtype }));
                          }
                        });
                      }}
                    />
                  </label>
                </div>
                {uploadProgressText && <div className="text-[11px] text-amber-400 font-mono">{uploadProgressText}</div>}
                <input
                  type="url"
                  placeholder="Or paste existing photo/video URL..."
                  value={editingUpdate ? (editingUpdate.attachment_url || '') : newUpdate.attachmentUrl}
                  onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, attachment_url: e.target.value }) : setNewUpdate({ ...newUpdate, attachmentUrl: e.target.value })}
                  className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex flex-wrap gap-4 pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingUpdate ? editingUpdate.is_client_visible : newUpdate.isClientVisible}
                    onChange={e => editingUpdate ? setEditingUpdate({ ...editingUpdate, is_client_visible: e.target.checked }) : setNewUpdate({ ...newUpdate, isClientVisible: e.target.checked })}
                  />
                  <span>Publish immediately to Client Portal</span>
                </label>
                {!editingUpdate && (
                  <label className="flex items-center gap-2 text-amber-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newUpdate.notifyClient}
                      onChange={e => setNewUpdate({ ...newUpdate, notifyClient: e.target.checked })}
                    />
                    <span>Notify assigned client via SMTP (kreboya603@gmail.com)</span>
                  </label>
                )}
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowUpdateModal(false); setEditingUpdate(null); }} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={uploadingFile} className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">
                  {editingUpdate ? 'Save Changes' : 'Publish Live Site Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDIA WITH CLOUDINARY / SUPABASE UPLOADER */}
      {showAddMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Upload Construction Photo / Video</h4>
              <button onClick={() => setShowAddMediaModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateMedia} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Phase</label>
                  <select value={newMedia.phase} onChange={e => setNewMedia({ ...newMedia, phase: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    {PHASES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Media Type</label>
                  <select value={newMedia.mediaType} onChange={e => setNewMedia({ ...newMedia, mediaType: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    <option value="PHOTO">PHOTO</option>
                    <option value="VIDEO">VIDEO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Media Title</label>
                <input required type="text" placeholder="e.g. Level 1 Roof Truss Drone Survey" value={newMedia.title} onChange={e => setNewMedia({ ...newMedia, title: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>

              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-bold">Direct Cloud Upload (Cloudinary / Supabase)</span>
                  <label className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{uploadingFile ? 'Uploading...' : 'Select Photo / Video'}</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        uploadAssetFile(file, (url, dtype) => {
                          setNewMedia(prev => ({
                            ...prev,
                            mediaUrl: url,
                            mediaType: dtype,
                            title: prev.title || file.name.replace(/\.[^/.]+$/, '')
                          }));
                        });
                      }}
                    />
                  </label>
                </div>
                {uploadProgressText && <div className="text-[11px] text-amber-400 font-mono">{uploadProgressText}</div>}
                <input required type="url" placeholder="https://res.cloudinary.com/..." value={newMedia.mediaUrl} onChange={e => setNewMedia({ ...newMedia, mediaUrl: e.target.value })} className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px]" />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description / Notes</label>
                <textarea rows={2} value={newMedia.description} onChange={e => setNewMedia({ ...newMedia, description: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={newMedia.isClientVisible} onChange={e => setNewMedia({ ...newMedia, isClientVisible: e.target.checked })} />
                  <span>Publish immediately to Client Portal</span>
                </label>
                <label className="flex items-center gap-2 text-amber-400 cursor-pointer">
                  <input type="checkbox" checked={newMedia.notifyClient} onChange={e => setNewMedia({ ...newMedia, notifyClient: e.target.checked })} />
                  <span>Email client notification via kreboya603@gmail.com</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMediaModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={uploadingFile} className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Save Media</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD OR EDIT MILESTONE */}
      {(showAddMilestoneModal || editingMilestone) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">{editingMilestone ? 'Edit Project Milestone' : 'Register Project Milestone'}</h4>
              <button onClick={() => { setShowAddMilestoneModal(false); setEditingMilestone(null); }} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={editingMilestone ? handleSaveEditMilestone : handleCreateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Milestone Name</label>
                <input
                  required
                  type="text"
                  value={editingMilestone ? (editingMilestone.milestone_name || editingMilestone.milestone || '') : newMilestone.milestone}
                  onChange={e => editingMilestone
                    ? setEditingMilestone({ ...editingMilestone, milestone_name: e.target.value, milestone: e.target.value })
                    : setNewMilestone({ ...newMilestone, milestone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Target Date</label>
                  <input
                    required
                    type="date"
                    value={editingMilestone ? (editingMilestone.date || '') : newMilestone.date}
                    onChange={e => editingMilestone
                      ? setEditingMilestone({ ...editingMilestone, date: e.target.value })
                      : setNewMilestone({ ...newMilestone, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Progress %</label>
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    value={editingMilestone ? Number(editingMilestone.percentage || 0) : newMilestone.percentage}
                    onChange={e => editingMilestone
                      ? setEditingMilestone({ ...editingMilestone, percentage: Number(e.target.value) })
                      : setNewMilestone({ ...newMilestone, percentage: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Status</label>
                  <select
                    value={editingMilestone ? (editingMilestone.status || 'In Progress') : newMilestone.status}
                    onChange={e => editingMilestone
                      ? setEditingMilestone({ ...editingMilestone, status: e.target.value })
                      : setNewMilestone({ ...newMilestone, status: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingMilestone ? (editingMilestone.description || '') : newMilestone.description}
                  onChange={e => editingMilestone
                    ? setEditingMilestone({ ...editingMilestone, description: e.target.value })
                    : setNewMilestone({ ...newMilestone, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => { setShowAddMilestoneModal(false); setEditingMilestone(null); }} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVOICE */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Generate Project Invoice</h4>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Client Recipient</label>
                  <select value={newInvoice.clientId} onChange={e => setNewInvoice({ ...newInvoice, clientId: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.client_code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Project Site</label>
                  <select value={newInvoice.projectId} onChange={e => setNewInvoice({ ...newInvoice, projectId: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Primary Work Description</label>
                <input required type="text" value={newInvoice.description} onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity</label>
                  <input required type="number" value={newInvoice.quantity} onChange={e => setNewInvoice({ ...newInvoice, quantity: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Price (XAF)</label>
                  <input required type="number" value={newInvoice.unitPriceXaf} onChange={e => setNewInvoice({ ...newInvoice, unitPriceXaf: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl text-slate-300">
                <div>Subtotal (HT): <strong className="text-white font-mono">{(Number(newInvoice.quantity) * Number(newInvoice.unitPriceXaf)).toLocaleString()} XAF</strong></div>
                <div className="text-[11px] text-amber-400 mt-1">Cameroon 19.25% TVA will be calculated automatically.</div>
              </div>
              <label className="flex items-center gap-2 text-amber-400 cursor-pointer">
                <input type="checkbox" checked={newInvoice.notifyClient} onChange={e => setNewInvoice({ ...newInvoice, notifyClient: e.target.checked })} />
                <span>Email official invoice notification via kreboya603@gmail.com</span>
              </label>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddInvoiceModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Issue Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Record Payment — {paymentModalInvoice.invoice_number}</h4>
              <button onClick={() => setPaymentModalInvoice(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSubmitPayment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Amount Paid (XAF)</label>
                <input required type="number" value={paymentInput.amountXaf} onChange={e => setPaymentInput({ ...paymentInput, amountXaf: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Payment Method</label>
                <select value={paymentInput.paymentMethod} onChange={e => setPaymentInput({ ...paymentInput, paymentMethod: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                  <option value="MTN_MOMO">MTN Mobile Money</option>
                  <option value="ORANGE_MONEY">Orange Money</option>
                  <option value="BANK_WIRE">Bank Wire (UBA / Afriland)</option>
                  <option value="CASH_RECEIPT">Certified Cash Receipt</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Transaction Reference ID</label>
                <input required type="text" value={paymentInput.paymentReference} onChange={e => setPaymentInput({ ...paymentInput, paymentReference: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setPaymentModalInvoice(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl cursor-pointer">Confirm & Send SMTP Receipt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: INSPECT & PRINT INVOICE */}
      {inspectInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <div className="text-xs font-mono text-amber-400 font-bold">OFFICIAL TAX INVOICE</div>
                <h4 className="text-xl font-bold font-serif">{inspectInvoice.invoice_number}</h4>
              </div>
              <button onClick={() => setInspectInvoice(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs mb-4">
              <div>
                <div className="text-slate-400">Client: <strong className="text-white">{inspectInvoice.client_name}</strong></div>
                <div className="text-slate-400">Project: <strong className="text-white">{inspectInvoice.project_title}</strong></div>
              </div>
              <div className="text-right font-mono">
                <div>Issued: {inspectInvoice.issue_date}</div>
                <div className="text-amber-400">Due: {inspectInvoice.due_date}</div>
              </div>
            </div>
            <div className="border border-slate-800 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px]">
                  <tr>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5 text-right">Total (XAF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {(inspectInvoice.items && inspectInvoice.items.length > 0 ? inspectInvoice.items : [{ id: 1, description: 'Project Execution Works', quantity: 1, unit: 'LS', total_price_xaf: inspectInvoice.subtotal_xaf }]).map((it: any) => (
                    <tr key={it.id}>
                      <td className="p-2.5">{it.description}</td>
                      <td className="p-2.5 text-right font-mono">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{Number(it.total_price_xaf).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-1 text-xs font-mono text-right">
              <div>Subtotal: {Number(inspectInvoice.subtotal_xaf).toLocaleString()} XAF</div>
              <div>TVA ({inspectInvoice.tax_rate_percent || 19.25}%): {Number(inspectInvoice.tax_amount_xaf).toLocaleString()} XAF</div>
              <div className="text-sm font-bold text-amber-400">Total TTC: {Number(inspectInvoice.total_amount_xaf).toLocaleString()} XAF</div>
              <div className="text-emerald-400">Paid: {Number(inspectInvoice.paid_amount_xaf).toLocaleString()} XAF</div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => window.print()} className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer">
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: LOG EQUIPMENT MAINTENANCE */}
      {maintenanceEquipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Maintenance Log — {maintenanceEquipment.asset_tag}</h4>
              <button onClick={() => setMaintenanceEquipment(null)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleLogMaintenance} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Work Description</label>
                <input required type="text" placeholder="e.g. Hydraulic oil filter replacement" value={maintenanceForm.description} onChange={e => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Technician</label>
                  <input required type="text" value={maintenanceForm.technicianName} onChange={e => setMaintenanceForm({ ...maintenanceForm, technicianName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Cost (XAF)</label>
                  <input required type="number" value={maintenanceForm.costXaf} onChange={e => setMaintenanceForm({ ...maintenanceForm, costXaf: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setMaintenanceEquipment(null)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Save Maintenance Log</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD STOCK MOVEMENT */}
      {showAddMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Record Materials Stock Movement</h4>
              <button onClick={() => setShowAddMovementModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateMovement} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Inventory Item</label>
                  <select value={newMovement.inventoryItemId} onChange={e => setNewMovement({ ...newMovement, inventoryItemId: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    {inventoryItems.length === 0 ? <option value={1}>Portland Cement CPA 42.5</option> : inventoryItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Movement Type</label>
                  <select value={newMovement.movementType} onChange={e => setNewMovement({ ...newMovement, movementType: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    <option value="DISPATCH_TO_PROJECT">Dispatch to Site</option>
                    <option value="PURCHASE_RECEIPT">Warehouse Receipt</option>
                    <option value="SITE_RETURN">Site Return</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity</label>
                  <input required type="number" min="1" value={newMovement.quantity} onChange={e => setNewMovement({ ...newMovement, quantity: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit</label>
                  <input required type="text" value={newMovement.unit} onChange={e => setNewMovement({ ...newMovement, unit: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Cost (XAF)</label>
                  <input required type="number" value={newMovement.unitCostXaf} onChange={e => setNewMovement({ ...newMovement, unitCostXaf: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Site Receiver / Foreman</label>
                <input type="text" value={newMovement.receiverName} onChange={e => setNewMovement({ ...newMovement, receiverName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMovementModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Record Movement</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER EQUIPMENT */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Register Machinery / Equipment</h4>
              <button onClick={() => setShowAddEquipmentModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateEquipment} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Equipment Name</label>
                <input required type="text" placeholder="e.g. Caterpillar 320D Excavator" value={newEquipment.name} onChange={e => setNewEquipment({ ...newEquipment, name: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input required type="text" value={newEquipment.category} onChange={e => setNewEquipment({ ...newEquipment, category: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Brand & Model</label>
                  <input type="text" value={newEquipment.brandModel} onChange={e => setNewEquipment({ ...newEquipment, brandModel: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Hourly Rate (XAF)</label>
                  <input required type="number" value={newEquipment.hourlyRateXaf} onChange={e => setNewEquipment({ ...newEquipment, hourlyRateXaf: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Location / Depot</label>
                  <input type="text" value={newEquipment.location} onChange={e => setNewEquipment({ ...newEquipment, location: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddEquipmentModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Register Asset</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUBCONTRACTOR */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Register Trade Subcontractor</h4>
              <button onClick={() => setShowAddSubModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateSubcontractor} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Company Name</label>
                <input required type="text" value={newSub.companyName} onChange={e => setNewSub({ ...newSub, companyName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Contact Person</label>
                  <input required type="text" value={newSub.contactPerson} onChange={e => setNewSub({ ...newSub, contactPerson: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input required type="text" value={newSub.phone} onChange={e => setNewSub({ ...newSub, phone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Specialization</label>
                  <input required type="text" value={newSub.specialization} onChange={e => setNewSub({ ...newSub, specialization: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">RCCM Registration</label>
                  <input type="text" value={newSub.rccmNumber} onChange={e => setNewSub({ ...newSub, rccmNumber: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddSubModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Save Subcontractor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD WORKER */}
      {showAddWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Add Field Artisan / Worker</h4>
              <button onClick={() => setShowAddWorkerModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreateWorker} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input required type="text" value={newWorker.fullName} onChange={e => setNewWorker({ ...newWorker, fullName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Trade Category</label>
                  <input required type="text" value={newWorker.tradeCategory} onChange={e => setNewWorker({ ...newWorker, tradeCategory: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Daily Rate (XAF)</label>
                  <input required type="number" value={newWorker.dailyRateXaf} onChange={e => setNewWorker({ ...newWorker, dailyRateXaf: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input type="text" value={newWorker.phone} onChange={e => setNewWorker({ ...newWorker, phone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Skill Level</label>
                  <select value={newWorker.skillLevel} onChange={e => setNewWorker({ ...newWorker, skillLevel: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                    <option value="MASTER_CRAFTSMAN">MASTER</option>
                    <option value="SKILLED">SKILLED</option>
                    <option value="UNSKILLED">UNSKILLED</option>
                    <option value="ENGINEER">ENGINEER</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddWorkerModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl cursor-pointer">Add Worker</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
