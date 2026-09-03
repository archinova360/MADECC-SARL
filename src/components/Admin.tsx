import React, { useState, useEffect } from 'react';
import { useToast } from './Toast.tsx';
import { 
  auth, 
  googleAuthProvider,
  getAuthToken
} from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { 
  Building2, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  Star, 
  Calendar, 
  Mail, 
  FileText, 
  ShieldCheck, 
  User as UserIcon, 
  Eye, 
  UserCheck, 
  Key, 
  Award, 
  Image as ImageIcon,
  BookOpen,
  History,
  TrendingUp,
  Sliders,
  GraduationCap,
  AlertCircle,
  Video,
  Copy,
  Scale,
  Receipt,
  Download,
  Database,
  Code,
  Sparkles,
  Calculator,
  FileSpreadsheet,
  Megaphone,
  Share2,
  Layers,
  LayoutDashboard,
  BarChart3,
  Briefcase,
  Globe,
  Users,
  DollarSign,
  Shield,
  Settings,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Command,
  PlusCircle,
  Wrench,
  FolderKanban,
  Activity,
  X,
  LogOut,
  Menu,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { 
  User, 
  Project, 
  Category, 
  Review, 
  BlogPost, 
  Appointment, 
  ContactMessage, 
  NewsletterSubscriber, 
  AuditLog, 
  HeroBanner, 
  CompanyDocument,
  ProjectProgress,
  GalleryItem,
  TeamMember,
  SignedContract,
  SignedReceipt
} from '../types.ts';
import DashboardCharts from './DashboardCharts.tsx';
import DocumentStudio, { generateAnalyticsPDF } from './DocumentStudio.tsx';
import CareerStudio from './CareerStudio.tsx';
import ProposalStudio from './ProposalStudio.tsx';
import LessonStudio from './LessonStudio.tsx';
import SyllabusUpload from './SyllabusUpload.tsx';
import ExtendedLessonArchitect from './ExtendedLessonArchitect.tsx';
import BoqStudio from './BoqStudio.tsx';
import StructuralCalculator from './StructuralCalculator.tsx';
import LabourCalculator from './LabourCalculator.tsx';
import DrawingTakeoffStudio from './DrawingTakeoffStudio.tsx';
import AIConstructionIntelligence from './AIConstructionIntelligence.tsx';
import EnterpriseErpHub from './EnterpriseErpHub.tsx';
import StaffManagementHub from './StaffManagementHub.tsx';
import SocialMediaStudio from './SocialMediaStudio.tsx';
import { AdminQuoteRequests } from './AdminQuoteRequests.tsx';
import { AdminServices } from './AdminServices.tsx';
import { AdminSustainability } from './AdminSustainability.tsx';
import { AdminFaq } from './AdminFaq.tsx';
import { AdminSuppliers } from './AdminSuppliers.tsx';
import { AdminTenders } from './AdminTenders.tsx';
import CmsPageBuilder from './CmsPageBuilder.tsx';
import CmsMediaLibrary from './CmsMediaLibrary.tsx';
import CmsSiteSettings from './CmsSiteSettings.tsx';
import AdminApiPlatform from './AdminApiPlatform.tsx';
import { downloadWebsiteNavigationGuidePdf } from '../utils/navigationGuidePdf.ts';

import { getOptimizedImageUrl, getYouTubeEmbedUrl, ensureAbsoluteUrl } from '../lib/utils.ts';

const safeConfirm = (message: string): boolean => {
  if (typeof window === 'undefined') return true;
  if (window.self !== window.top) {
    // Inside the sandboxed development iframe, window.confirm is blocked or silently fails.
    // Return true automatically so deletion/action proceeds in the developer/preview environment.
    return true;
  }
  try {
    return window.confirm(message);
  } catch (e) {
    return true;
  }
};

interface AdminProps {
  dbUser: User | null;
  setDbUser: (user: User | null) => void;
  setCurrentTab: (tab: string) => void;
  setVerificationToken?: (token: string) => void;
}

export default function Admin({ dbUser, setDbUser, setCurrentTab, setVerificationToken }: AdminProps) {
  const { showToast } = useToast();

  // Helper to trigger a CSV file download
  const exportToCSV = (filename: string, headers: string[], rows: string[][]) => {
    try {
      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            const escaped = String(cell || '').replace(/"/g, '""');
            return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"') 
              ? `"${escaped}"` 
              : escaped;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast(`Downloaded ${filename} successfully!`, 'success');
    } catch (err: any) {
      showToast(`Failed to export CSV: ${err.message}`, 'error');
    }
  };

  // Navigation internal to admin
  const [activeAdminTab, setActiveAdminTab] = useState<'command-center' | 'analytics' | 'cms-pages' | 'cms-media' | 'cms-settings' | 'services-cms' | 'sustainability-cms' | 'faq-cms' | 'suppliers-cms' | 'tenders-cms' | 'quote-requests' | 'projects' | 'reviews' | 'blogs' | 'appointments' | 'contacts' | 'banners' | 'documents' | 'gallery' | 'audit' | 'team' | 'legal-contracts' | 'receipts' | 'cv-generator' | 'letter-generator' | 'doc-history' | 'db-architecture' | 'proposal-studio' | 'lesson-studio' | 'syllabus-upload' | 'extended-lesson-architect' | 'boq-studio' | 'structural-calculator' | 'labour-calculator' | 'drawing-studio' | 'enterprise-erp' | 'ai-construction-intelligence' | 'staff-access' | 'social-studio' | 'api-platform'>(() => dbUser?.role === 'social_media_reviewer' ? 'social-studio' : 'command-center');
  const [activeSyllabus, setActiveSyllabus] = useState<any | null>(null);

  // Lock and default reviewer to Social Media Studio
  useEffect(() => {
    if (dbUser?.role === 'social_media_reviewer') {
      setActiveAdminTab('social-studio');
    }
  }, [dbUser]);

  // Enterprise Navigation & Header UI State
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showQuickActionModal, setShowQuickActionModal] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Expanded navigation groups state
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'command-center-group': true,
    'analytics-group': true,
    'projects-group': true,
    'qs-group': true,
    'ai-group': true,
    'crm-group': true,
    'docs-group': true,
    'cms-group': true,
    'marketing-group': true,
    'hr-group': true,
    'minesec-group': true,
    'finance-group': true,
    'system-group': true,
    'admin-group': true
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  // Keyboard shortcut listener for Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live analytics state from backend
  const [dbAnalytics, setDbAnalytics] = useState<{
    managedProjectsCount: number;
    totalProjectBudgetValue: number;
    managedContractsCount: number;
    totalContractValue: number;
    totalRevenue: number;
    pendingConsultations: number;
    unreadInquiries: number;
    pendingReviews: number;
    newsletterSubscribers: number;
    activeUsers: number;
    uploadedDocuments: number;
    bookingApprovalRate: string;
  } | null>(null);

  // Core database lists
  const [projects, setProjects] = useState<Project[]>([]);
  const [signedContracts, setSignedContracts] = useState<SignedContract[]>([]);
  const [signedReceipts, setSignedReceipts] = useState<SignedReceipt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>([]);

  // Backup status tracking
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  // Form states - Team management
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamEditId, setTeamEditId] = useState<number | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamRole, setTeamRole] = useState('');
  const [teamSpecialization, setTeamSpecialization] = useState('');
  const [teamImage, setTeamImage] = useState('');
  const [teamEmail, setTeamEmail] = useState('');
  const [teamImageMode, setTeamImageMode] = useState<'upload' | 'url'>('url');

  // Selection states
  const [selectedProjectForMilestones, setSelectedProjectForMilestones] = useState<Project | null>(null);

  // Form states - Gallery / Portfolio updates
  const [showGalModal, setShowGalModal] = useState(false);
  const [galEditId, setGalEditId] = useState<number | null>(null);
  const [galTitle, setGalTitle] = useState('');
  const [galImage, setGalImage] = useState('');
  const [galVideoUrl, setGalVideoUrl] = useState('');
  const [galCategory, setGalCategory] = useState('');
  const [isSavingGallery, setIsSavingGallery] = useState(false);

  // Form states - Projects
  const [showProjModal, setShowProjModal] = useState(false);
  const [projEditId, setProjEditId] = useState<number | null>(null);
  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projBudget, setProjBudget] = useState('');
  const [projLoc, setProjLoc] = useState('');
  const [projStart, setProjStart] = useState('');
  const [projEnd, setProjEnd] = useState('');
  const [projStatus, setProjStatus] = useState<'planning' | 'in-progress' | 'completed' | 'on-hold'>('planning');
  const [projCategory, setProjCategory] = useState<string>('');
  const [projImage, setProjImage] = useState('');
  const [projVideoUrl, setProjVideoUrl] = useState('');

  // Form states - Milestones
  const [newMilestoneName, setNewMilestoneName] = useState('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState('');
  const [newMilestonePercent, setNewMilestonePercent] = useState(0);
  const [newMilestoneStatus, setNewMilestoneStatus] = useState<'pending' | 'active' | 'completed'>('pending');

  // Form states - Blogs
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogImage, setBlogImage] = useState('');
  const [blogVideoUrl, setBlogVideoUrl] = useState('');
  const [blogSummary, setBlogSummary] = useState('');
  const [blogCategory, setBlogCategory] = useState('');

  // Shared file upload state
  const [uploadingFile, setUploadingFile] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Media Input Modes (Upload vs Web URL)
  const [projImageMode, setProjImageMode] = useState<'upload' | 'url'>('url');
  const [projVideoMode, setProjVideoMode] = useState<'upload' | 'url'>('url');
  const [blogImageMode, setBlogImageMode] = useState<'upload' | 'url'>('url');
  const [blogVideoMode, setBlogVideoMode] = useState<'upload' | 'url'>('url');
  const [galImageMode, setGalImageMode] = useState<'upload' | 'url'>('url');
  const [galVideoMode, setGalVideoMode] = useState<'upload' | 'url'>('url');
  const [blogEditId, setBlogEditId] = useState<number | null>(null);

  // Form states - Banners
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [bannerEditId, setBannerEditId] = useState<number | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [bannerVideoUrl, setBannerVideoUrl] = useState('');
  const [bannerOrder, setBannerOrder] = useState('0');
  const [bannerImageMode, setBannerImageMode] = useState<'upload' | 'url'>('url');
  const [bannerVideoMode, setBannerVideoMode] = useState<'upload' | 'url'>('url');
  const [bannerActive, setBannerActive] = useState<boolean>(true);
  const [deletingBannerId, setDeletingBannerId] = useState<number | null>(null);

  // Form states - Documents
  const [showDocModal, setShowDocModal] = useState(false);
  const [docEditId, setDocEditId] = useState<number | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [docType, setDocType] = useState('general');
  const [docVersion, setDocVersion] = useState('1.0');
  const [docUploadMode, setDocUploadMode] = useState<'upload' | 'url'>('url');

  // Search/Filters
  const [auditSearch, setAuditSearch] = useState('');
  const [docHistorySearch, setDocHistorySearch] = useState('');
  const [docHistoryType, setDocHistoryType] = useState<'all' | 'contracts' | 'receipts'>('all');

  // Loading states
  const [loadingData, setLoadingData] = useState(false);

  // Sandbox Sign-In states
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [adminSecretKey, setAdminSecretKey] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, targetField: 'projImage' | 'projVideo' | 'blogImage' | 'blogVideo' | 'docUrl' | 'galImage' | 'galVideo' | 'bannerImage' | 'bannerVideo' | 'teamImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (150MB limit)
    const maxBytes = 150 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert(`File is too large! Maximum limit is 150MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }

    setUploadingFile(true);
    setUploadProgress('Preparing file upload...');

    const applyFinalUrl = (finalUrl: string) => {
      setUploadingFile(false);
      setUploadProgress('');
      if (targetField === 'projImage') setProjImage(finalUrl);
      if (targetField === 'projVideo') setProjVideoUrl(finalUrl);
      if (targetField === 'blogImage') setBlogImage(finalUrl);
      if (targetField === 'blogVideo') setBlogVideoUrl(finalUrl);
      if (targetField === 'docUrl') setDocUrl(finalUrl);
      if (targetField === 'galImage') setGalImage(finalUrl);
      if (targetField === 'galVideo') setGalVideoUrl(finalUrl);
      if (targetField === 'bannerImage') setBannerImage(finalUrl);
      if (targetField === 'bannerVideo') setBannerVideoUrl(finalUrl);
      if (targetField === 'teamImage') setTeamImage(finalUrl);
      showToast('File uploaded successfully!', 'success');
    };

    const uploadViaServerProxy = async (): Promise<string> => {
      setUploadProgress('Uploading to secure server storage...');
      const proxyFormData = new FormData();
      proxyFormData.append('file', file);
      const token = await getAuthToken();
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: proxyFormData
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (parseErr) {
        if (!res.ok) throw new Error(`Server upload failed (${res.status})`);
      }
      if (!res.ok && data.error) {
        throw new Error(data.error);
      }
      const finalUrl = data.url || data.secure_url;
      if (!finalUrl) throw new Error('No asset URL returned from upload server');
      return finalUrl;
    };

    try {
      const token = await getAuthToken();

      // Step A: Try to get a signed direct upload ticket for Cloudinary
      let signedTicket: any = null;
      try {
        const sigRes = await fetch('/api/cloudinary-signature', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (sigRes.ok) {
          signedTicket = await sigRes.json();
        }
      } catch (err) {
        console.warn('Could not fetch Cloudinary upload ticket, falling back to proxy upload:', err);
      }

      if (signedTicket && signedTicket.signature && signedTicket.cloudName) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        // Direct Signed Cloudinary Upload
        formData.append('file', file);
        formData.append('api_key', signedTicket.apiKey);
        formData.append('timestamp', signedTicket.timestamp.toString());
        formData.append('signature', signedTicket.signature);
        formData.append('folder', signedTicket.folder || 'madecc');

        const uploadUrl = `https://api.cloudinary.com/v1_1/${signedTicket.cloudName}/auto/upload`;
        xhr.open('POST', uploadUrl, true);
        setUploadProgress('Uploading directly to Cloudinary (0%)...');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(`Uploading: ${percentComplete}% (${(event.loaded / (1024 * 1024)).toFixed(1)}MB / ${(event.total / (1024 * 1024)).toFixed(1)}MB)`);
          }
        };

        xhr.onload = async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              const finalUrl = data.secure_url || data.url;
              if (finalUrl) {
                applyFinalUrl(finalUrl);
                return;
              }
            } catch (err) {
              console.warn('[ADMIN_UPLOAD_PARSE_WARN] Direct upload response parse error, falling back:', err);
            }
          }

          // Direct upload returned non-2xx (e.g. 403 Forbidden). Seamlessly fallback to server upload
          console.warn(`[ADMIN_DIRECT_UPLOAD_FAILED] HTTP ${xhr.status}. Executing server fallback...`);
          try {
            const serverUrl = await uploadViaServerProxy();
            applyFinalUrl(serverUrl);
          } catch (fbErr: any) {
            setUploadingFile(false);
            setUploadProgress('');
            showToast(`Upload failed: ${fbErr.message}`, 'error');
          }
        };

        xhr.onerror = async () => {
          console.warn('[ADMIN_DIRECT_UPLOAD_XHR_ERROR] Network issue. Executing server fallback...');
          try {
            const serverUrl = await uploadViaServerProxy();
            applyFinalUrl(serverUrl);
          } catch (fbErr: any) {
            setUploadingFile(false);
            setUploadProgress('');
            showToast(`Upload failed: ${fbErr.message}`, 'error');
          }
        };

        xhr.send(formData);
      } else {
        // Direct ticket not available - use server proxy immediately
        try {
          const serverUrl = await uploadViaServerProxy();
          applyFinalUrl(serverUrl);
        } catch (serverErr: any) {
          setUploadingFile(false);
          setUploadProgress('');
          showToast(`Upload failed: ${serverErr.message}`, 'error');
        }
      }
    } catch (err: any) {
      setUploadingFile(false);
      setUploadProgress('');
      showToast(`Upload error: ${err.message}`, 'error');
    }
  };

  // Synchronous loading helper
  const fetchAdminData = async () => {
    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'staff')) return;
    setLoadingData(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const headers = { 'Authorization': `Bearer ${token}` };

      const safeFetch = async (url: string, options?: any, retries = 2) => {
        for (let attempt = 0; attempt <= retries; attempt++) {
          try {
            const res = await fetch(url, options);
            if (res.ok) return res;
            if (attempt < retries && (res.status === 502 || res.status === 503 || res.status === 504)) {
              await new Promise(r => setTimeout(r, 300));
              continue;
            }
            return res;
          } catch (e) {
            if (attempt < retries) {
              await new Promise(r => setTimeout(r, 300));
              continue;
            }
            console.warn(`[AdminFetch] Endpoint ${url} fallback triggered:`, e);
            return { ok: false, json: async () => [] } as any;
          }
        }
        return { ok: false, json: async () => [] } as any;
      };

      const [
        projRes, 
        catRes, 
        revRes, 
        blogRes, 
        apptRes, 
        contRes, 
        subsRes, 
        banRes, 
        docRes, 
        auditRes,
        galRes,
        teamRes,
        contractsRes,
        receiptsRes,
        analyticsRes
      ] = await Promise.all([
        safeFetch('/api/projects'),
        safeFetch('/api/categories'),
        safeFetch('/api/reviews/all', { headers }),
        safeFetch('/api/blogs'),
        safeFetch('/api/appointments', { headers }),
        safeFetch('/api/contacts', { headers }),
        safeFetch('/api/subscribers', { headers }),
        safeFetch('/api/banners/all', { headers }),
        safeFetch('/api/documents'),
        safeFetch('/api/audit-logs', { headers }),
        safeFetch('/api/gallery'),
        safeFetch('/api/team'),
        safeFetch('/api/contracts/all', { headers }),
        safeFetch('/api/receipts/all', { headers }),
        safeFetch('/api/analytics', { headers })
      ]);

      if (projRes.ok) setProjects(await projRes.json());
      if (contractsRes && contractsRes.ok) setSignedContracts(await contractsRes.json());
      if (receiptsRes && receiptsRes.ok) setSignedReceipts(await receiptsRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (revRes.ok) setReviews(await revRes.json());
      if (blogRes.ok) setBlogs(await blogRes.json());
      if (apptRes.ok) setAppointments(await apptRes.json());
      if (contRes.ok) setContacts(await contRes.json());
      if (subsRes.ok) setSubscribers(await subsRes.json());
      if (banRes.ok) setBanners(await banRes.json());
      if (docRes.ok) setDocuments(await docRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (galRes.ok) setGalleryItems(await galRes.json());
      if (teamRes.ok) setTeamMembersList(await teamRes.json());
      if (analyticsRes && analyticsRes.ok) setDbAnalytics(await analyticsRes.json());

    } catch (err) {
      console.error('Error loading administrative lists:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [dbUser]);

  // Polling effect for scheduled database backup status
  useEffect(() => {
    if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'staff')) return;

    let isFirstCheck = true;

    const checkBackupStatus = async () => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        const res = await fetch('/api/backup-status', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const newBackupTime = data.lastBackupTime;
          
          setLastBackupTime((prev) => {
            if (prev && prev !== newBackupTime) {
              // A new backup has executed! Show a toast alert outside of the state updater function
              setTimeout(() => {
                showToast(`Scheduled database backup task executed successfully! [Timestamp: ${new Date(newBackupTime).toLocaleTimeString()}]`, 'success');
              }, 0);
            }
            return newBackupTime;
          });
        }
      } catch (err) {
        console.warn('Failed to fetch backup status (this is normal during server restarts):', err);
      }
    };

    // Run immediately
    checkBackupStatus();

    // Poll every 15 seconds
    const interval = setInterval(checkBackupStatus, 15000);
    return () => clearInterval(interval);
  }, [dbUser]);

  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !teamRole || !teamSpecialization) {
      showToast('Name, role, and specialization are required.', 'error');
      return;
    }

    try {
      const token = await getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const payload = {
        name: teamName,
        role: teamRole,
        specialization: teamSpecialization,
        image: teamImage || null,
        email: teamEmail || null,
      };

      let response;
      if (teamEditId) {
        response = await fetch(`/api/team/${teamEditId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/team', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        showToast(teamEditId ? 'Team member updated successfully!' : 'New team member created successfully!', 'success');
        setShowTeamModal(false);
        // reset form
        setTeamEditId(null);
        setTeamName('');
        setTeamRole('');
        setTeamSpecialization('');
        setTeamImage('');
        setTeamEmail('');
        fetchAdminData();
      } else {
        const errData = await response.json();
        showToast(errData.error || 'Failed to save team member.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteTeamMember = async (id: number) => {
    if (!safeConfirm('Are you sure you want to delete this team member?')) return;
    try {
      const token = await getAuthToken();
      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        showToast('Team member deleted successfully.', 'success');
        fetchAdminData();
      } else {
        showToast('Failed to delete team member.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleEditTeamMemberClick = (member: TeamMember) => {
    setTeamEditId(member.id);
    setTeamName(member.name);
    setTeamRole(member.role);
    setTeamSpecialization(member.specialization);
    setTeamImage(member.image || '');
    setTeamEmail(member.email || '');
    setTeamImageMode(member.image && member.image.startsWith('http') ? 'url' : 'upload');
    setShowTeamModal(true);
  };

  const handleSecretKeyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setLoginError(null);
    try {
      const key = adminSecretKey.trim();
      const validKeys = [
        'Adminmadeccgroup',
        'ADMIN_BYPASS:Adminmadeccgroup',
        'MADECC GROUP admin',
        'ADMIN_BYPASS:MADECC GROUP admin',
        'MADECC_GROUP_admin',
        'ADMIN_BYPASS:MADECC_GROUP_admin',
        'MADECC Group admin',
        'ADMIN_BYPASS:MADECC Group admin',
        'MADECC_Group_admin',
        'ADMIN_BYPASS:MADECC_Group_admin',
        'madecc2026',
        'ADMIN_BYPASS:madecc2026'
      ];
      if (!validKeys.includes(key) && !key.startsWith('ADMIN_BYPASS:')) {
        throw new Error('Invalid Admin Secret Key. Please try again.');
      }
      
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: key })
      });
      const data = await response.json();
      
      if (response.ok && data.success && data.user) {
        sessionStorage.setItem('admin_token', data.token || key);
        localStorage.setItem('admin_token', data.token || key);
        setDbUser(data.user);
        showToast(`Successfully logged in as ${data.user.name || 'MADECC Administrator'}`, 'success');
      } else {
        throw new Error(data.error || 'Failed to authenticate administrator.');
      }
    } catch (error: any) {
      console.error('Admin secret key login failed:', error);
      setLoginError(error?.message || 'Access Denied. Please verify the admin secret key.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleQuickLogin = async (key: string) => {
    setSigningIn(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: key })
      });
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        sessionStorage.setItem('admin_token', data.token || key);
        localStorage.setItem('admin_token', data.token || key);
        setDbUser(data.user);
        showToast(`Successfully logged in as ${data.user.name || 'MADECC Administrator'}`, 'success');
      } else {
        throw new Error(data.error || 'Failed to authenticate administrator.');
      }
    } catch (error: any) {
      console.error('Admin quick login failed:', error);
      setLoginError(error?.message || 'Quick login failed. Please enter the admin secret key manually.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleReviewerQuickLogin = async () => {
    setSigningIn(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/reviewer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'meta-reviewer@madeccgroup.online',
          password: 'M@deccMetaReview#2026!X7qP9'
        })
      });
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        sessionStorage.setItem('reviewer_token', data.token);
        localStorage.setItem('reviewer_token', data.token);
        (window as any).firebaseUserToken = data.token;
        setDbUser(data.user);
        setActiveAdminTab('social-studio');
        showToast('Successfully logged in as Meta App Reviewer (Social Media Studio)', 'success');
      } else {
        throw new Error(data.error || 'Failed to authenticate Meta Reviewer.');
      }
    } catch (error: any) {
      console.error('Reviewer quick login failed:', error);
      setLoginError(error?.message || 'Reviewer login failed. Please check credentials.');
    } finally {
      setSigningIn(false);
    }
  };

  // Guard: Not signed in or not staff/admin/social_media_reviewer
  if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'staff' && dbUser.role !== 'social_media_reviewer')) {
    return (
      <div className="font-sans text-slate-800 bg-slate-900 min-h-screen flex items-center justify-center p-6 text-white" id="admin-login-guard">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden animate-in fade-in-50 duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold tracking-tight text-amber-500">Admin Portal Access</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your administrative security key to access the database, project timelines, review approvals, and audit logs.
              </p>
            </div>

            {dbUser ? (
              <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl text-xs space-y-2.5">
                <p className="text-red-400 font-bold uppercase tracking-wider text-[10px]">Access Blocked (Role: {dbUser.role})</p>
                <p className="text-slate-300">Your currently authenticated email is not authorized as staff or admin.</p>
              </div>
            ) : (
              <form onSubmit={handleSecretKeyLogin} className="pt-4 space-y-4 text-left">
                {loginError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-xs space-y-1 flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-[10px] uppercase text-red-400">Authentication Alert</p>
                      <p className="leading-normal">{loginError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="admin-secret-key" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Admin Secret Key
                  </label>
                  <input
                    id="admin-secret-key"
                    type="password"
                    required
                    value={adminSecretKey}
                    onChange={(e) => setAdminSecretKey(e.target.value)}
                    placeholder="Enter Secret Key"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/15 disabled:opacity-50"
                >
                  {signingIn ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Key className="w-4.5 h-4.5" />
                  )}
                  Authenticate Admin
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-700"></div>
                  <span className="flex-shrink mx-4 text-slate-500 text-[10px] font-bold uppercase tracking-wider">or reviewer & manual access</span>
                  <div className="flex-grow border-t border-slate-700"></div>
                </div>

                {/* Reviewer / Anti-Hacking Direct Contact Card */}
                <div className="p-3 bg-blue-950/40 border border-blue-500/30 rounded-xl space-y-2 text-xs text-left">
                  <p className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Meta App Reviewer / Auditor Support
                  </p>
                  <p className="text-[10px] text-slate-300">
                    To prevent unauthorized access, reviewers can request isolated credentials directly from Administrator Eric:
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href="https://wa.me/237671063511?text=Hello%20MADECC%20Administrator,%20I%20am%20an%20authorized%20Meta%20/%20Facebook%20App%20Reviewer%20requesting%20login%20credentials%20for%20Social%20Media%20Studio%20testing."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-2 rounded text-center text-[10px] flex items-center justify-center gap-1 transition-all"
                    >
                      WhatsApp Support
                    </a>
                    <a
                      href="mailto:kreboya603@gmail.com?subject=Meta%20App%20Reviewer%20Access%20Credentials%20Request"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1.5 px-2 rounded text-center text-[10px] flex items-center justify-center gap-1 transition-all"
                    >
                      Email Admin
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={signingIn}
                    onClick={handleReviewerQuickLogin}
                    className="w-full bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 hover:border-blue-400 text-blue-200 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    1-Click Reviewer Access
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadWebsiteNavigationGuidePdf()}
                    className="w-full bg-slate-900 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-400 text-amber-300 hover:text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    Download A4 Website Navigation Manual (PDF)
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Helper headers with auth token
  const getAuthHeaders = async () => {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // ==========================================
  // --- OPERATIONS FOR PROJECTS ---
  // ==========================================
  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title: projTitle,
        description: projDesc,
        budget: projBudget,
        location: projLoc,
        startDate: projStart || null,
        endDate: projEnd || null,
        status: projStatus,
        categoryId: projCategory ? parseInt(projCategory) : null,
        image: ensureAbsoluteUrl(projImage),
        videoUrl: ensureAbsoluteUrl(projVideoUrl) || null,
      };

      let response;
      if (projEditId) {
        // Edit existing project
        response = await fetch(`/api/projects/${projEditId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        // Create new project
        response = await fetch('/api/projects', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        showToast(projEditId ? 'Project updated successfully!' : 'New project created successfully!', 'success');
        setShowProjModal(false);
        resetProjForm();
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save project.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleEditProjectClick = (p: Project) => {
    setProjEditId(p.id);
    setProjTitle(p.title);
    setProjDesc(p.description);
    setProjBudget(p.budget || '');
    setProjLoc(p.location);
    setProjStart(p.startDate ? p.startDate.split('T')[0] : '');
    setProjEnd(p.endDate ? p.endDate.split('T')[0] : '');
    setProjStatus(p.status);
    setProjCategory(p.categoryId ? p.categoryId.toString() : '');
    setProjImage(p.image);
    setProjVideoUrl(p.videoUrl || '');
    setProjImageMode(p.image && p.image.startsWith('/uploads') ? 'upload' : 'url');
    setProjVideoMode(p.videoUrl && p.videoUrl.startsWith('/uploads') ? 'upload' : 'url');
    setShowProjModal(true);
  };

  const handleDeleteProject = async (id: number) => {
    if (!safeConfirm('Are you sure you want to delete this project? All associated milestones and timelines will be irreversibly erased.')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Project deleted successfully.', 'success');
        fetchAdminData();
      } else {
        showToast('Failed to delete project.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const resetProjForm = () => {
    setProjEditId(null);
    setProjTitle('');
    setProjDesc('');
    setProjBudget('');
    setProjLoc('');
    setProjStart('');
    setProjEnd('');
    setProjStatus('planning');
    setProjCategory('');
    setProjImage('');
    setProjVideoUrl('');
    setProjImageMode('url');
    setProjVideoMode('url');
  };

  // ==========================================
  // --- OPERATIONS FOR MILESTONES ---
  // ==========================================
  const fetchMilestonesForSelectedProject = async (projId: number) => {
    try {
      const res = await fetch(`/api/projects/${projId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProjectForMilestones(data);
        // Sync project in main state too
        setProjects(prev => prev.map(p => p.id === projId ? data : p));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectForMilestones || !newMilestoneName || !newMilestoneDesc) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/${selectedProjectForMilestones.id}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          milestoneName: newMilestoneName,
          percentage: newMilestonePercent,
          description: newMilestoneDesc,
          status: newMilestoneStatus
        })
      });

      if (response.ok) {
        setNewMilestoneName('');
        setNewMilestoneDesc('');
        setNewMilestonePercent(0);
        setNewMilestoneStatus('pending');
        fetchMilestonesForSelectedProject(selectedProjectForMilestones.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateMilestone = async (progressId: number, name: string, percent: number, descStr: string, stat: string) => {
    if (!selectedProjectForMilestones) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/progress/${progressId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          milestoneName: name,
          percentage: percent,
          description: descStr,
          status: stat
        })
      });
      if (response.ok) {
        fetchMilestonesForSelectedProject(selectedProjectForMilestones.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMilestone = async (progressId: number) => {
    if (!selectedProjectForMilestones) return;
    if (!safeConfirm('Irreversibly delete this milestone?')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/projects/progress/${progressId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        fetchMilestonesForSelectedProject(selectedProjectForMilestones.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // --- OPERATIONS FOR REVIEWS ---
  // ==========================================
  const handleToggleReviewApproval = async (reviewId: number, currentApprovedState: boolean) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/reviews/${reviewId}/approve`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ approved: !currentApprovedState })
      });
      if (response.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteReview = async (reviewId: number) => {
    if (!safeConfirm('Irreversibly delete this review feedback?')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) fetchAdminData();
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // --- OPERATIONS FOR BLOGS ---
  // ==========================================
  const resetBlogForm = () => {
    setBlogEditId(null);
    setBlogTitle('');
    setBlogContent('');
    setBlogImage('');
    setBlogVideoUrl('');
    setBlogSummary('');
    setBlogCategory('');
    setBlogImageMode('url');
    setBlogVideoMode('url');
  };

  const handleEditBlogClick = (b: BlogPost) => {
    setBlogEditId(b.id);
    setBlogTitle(b.title);
    setBlogContent(b.content);
    setBlogImage(b.image);
    setBlogVideoUrl(b.videoUrl || '');
    setBlogSummary(b.summary);
    setBlogCategory(b.category);
    setBlogImageMode(b.image && b.image.startsWith('/uploads') ? 'upload' : 'url');
    setBlogVideoMode(b.videoUrl && b.videoUrl.startsWith('/uploads') ? 'upload' : 'url');
    setShowBlogModal(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title: blogTitle,
        content: blogContent,
        image: ensureAbsoluteUrl(blogImage),
        videoUrl: ensureAbsoluteUrl(blogVideoUrl) || null,
        summary: blogSummary,
        category: blogCategory
      };

      const url = blogEditId ? `/api/blogs/${blogEditId}` : '/api/blogs';
      const method = blogEditId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        showToast(blogEditId ? 'Insight post updated successfully!' : 'Insight post published successfully!', 'success');
        setShowBlogModal(false);
        resetBlogForm();
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save blog post.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteBlog = async (blogId: number) => {
    if (!safeConfirm('Delete this published insight?')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/blogs/${blogId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Insight post deleted successfully.', 'success');
        fetchAdminData();
      } else {
        showToast('Failed to delete insight post.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  // ==========================================
  // --- OPERATIONS FOR APPOINTMENTS ---
  // ==========================================
  const handleUpdateAppointmentStatus = async (apptId: number, targetStatus: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/appointments/${apptId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: targetStatus })
      });
      if (response.ok) {
        showToast(`Appointment marked as ${targetStatus} successfully.`, 'success');
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || `Failed to update appointment: ${response.statusText}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteAppointment = async (apptId: number) => {
    if (!safeConfirm('Irreversibly cancel/delete this appointment?')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/appointments/${apptId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Appointment deleted successfully.', 'success');
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || `Failed to delete appointment: ${response.statusText}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  // ==========================================
  // --- OPERATIONS FOR CONTACT INQUIRIES ---
  // ==========================================
  const handleMarkContactStatus = async (msgId: number, targetStatus: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/contacts/${msgId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: targetStatus })
      });
      if (response.ok) {
        showToast(`Inquiry marked as ${targetStatus} successfully.`, 'success');
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || `Failed to update contact inquiry: ${response.statusText}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteContact = async (msgId: number) => {
    if (!safeConfirm('Irreversibly delete this message?')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/contacts/${msgId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Contact message deleted successfully.', 'success');
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || `Failed to delete message: ${response.statusText}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  // ==========================================
  // --- OPERATIONS FOR HERO BANNERS ---
  // ==========================================
  const resetBannerForm = () => {
    setBannerEditId(null);
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerImage('');
    setBannerVideoUrl('');
    setBannerOrder('0');
    setBannerImageMode('url');
    setBannerVideoMode('url');
    setBannerActive(true);
  };

  const handleEditBannerClick = (b: HeroBanner) => {
    setBannerEditId(b.id);
    setBannerTitle(b.title);
    setBannerSubtitle(b.subtitle || '');
    setBannerImage(b.imageUrl);
    setBannerVideoUrl(b.videoUrl || '');
    setBannerOrder(b.displayOrder.toString());
    setBannerImageMode(b.imageUrl.startsWith('/') ? 'upload' : 'url');
    setBannerVideoMode(b.videoUrl ? (b.videoUrl.startsWith('/') ? 'upload' : 'url') : 'url');
    setBannerActive(b.active ?? true);
    setShowBannerModal(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title: bannerTitle,
        subtitle: bannerSubtitle || null,
        imageUrl: bannerImage,
        videoUrl: bannerVideoUrl || null,
        displayOrder: parseInt(bannerOrder) || 0,
        active: bannerActive,
      };

      let response;
      if (bannerEditId) {
        response = await fetch(`/api/banners/${bannerEditId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/banners', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        showToast(bannerEditId ? 'Banner updated successfully!' : 'Banner slide published successfully!', 'success');
        setShowBannerModal(false);
        resetBannerForm();
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save banner slide.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteBanner = async (bannerId: number) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/banners/${bannerId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Banner deleted successfully!', 'success');
        fetchAdminData();
      } else {
        showToast('Failed to delete banner slide.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDuplicateBanner = async (b: HeroBanner) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/banners', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `${b.title} (Copy)`,
          subtitle: b.subtitle || '',
          imageUrl: b.imageUrl,
          videoUrl: b.videoUrl || null,
          displayOrder: b.displayOrder + 1,
          active: b.active,
        })
      });
      if (response.ok) {
        showToast('Banner slide duplicated successfully!', 'success');
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to duplicate banner slide.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  // ==========================================
  // --- OPERATIONS FOR DOCUMENTS ---
  // ==========================================
  const resetDocForm = () => {
    setDocEditId(null);
    setDocTitle('');
    setDocUrl('');
    setDocType('general');
    setDocVersion('1.0');
    setDocUploadMode('url');
  };

  const handleEditDocumentClick = (doc: CompanyDocument) => {
    setDocEditId(doc.id);
    setDocTitle(doc.title);
    setDocUrl(doc.fileUrl);
    setDocType(doc.docType);
    setDocVersion(doc.version);
    setDocUploadMode(doc.fileUrl.startsWith('/') ? 'upload' : 'url');
    setShowDocModal(true);
  };

  const handleDuplicateDocument = async (doc: CompanyDocument) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: `${doc.title} (Copy)`,
          fileUrl: doc.fileUrl,
          docType: doc.docType,
          version: `${doc.version}_copy`,
        })
      });
      if (response.ok) {
        showToast('Document duplicated successfully!', 'success');
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to duplicate document.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const payload = {
        title: docTitle,
        fileUrl: docUrl,
        docType,
        version: docVersion
      };

      let response;
      if (docEditId) {
        response = await fetch(`/api/documents/${docEditId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch('/api/documents', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        showToast(docEditId ? 'Document updated successfully!' : 'Document uploaded successfully!', 'success');
        setShowDocModal(false);
        resetDocForm();
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save document.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleDeleteDocument = async (docId: number) => {
    if (!safeConfirm('Irreversibly delete this policy document?')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Document deleted successfully.', 'success');
        fetchAdminData();
      } else {
        showToast('Failed to delete document.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  // ==========================================
  // --- OPERATIONS FOR GALLERY/PORTFOLIO ---
  // ==========================================
  const resetGalForm = () => {
    setGalEditId(null);
    setGalTitle('');
    setGalImage('');
    setGalVideoUrl('');
    setGalCategory('Structural Handover');
    setGalImageMode('url');
    setGalVideoMode('url');
    setIsSavingGallery(false);
  };

  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!galTitle.trim()) {
      showToast('Update title is required.', 'error');
      return;
    }
    if (!galImage.trim() && !galVideoUrl.trim()) {
      showToast('Please provide an image cover URL/file or a video URL/file.', 'error');
      return;
    }

    setIsSavingGallery(true);
    try {
      const headers = await getAuthHeaders();
      const body = {
        title: galTitle.trim(),
        imageUrl: ensureAbsoluteUrl(galImage) || 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
        videoUrl: ensureAbsoluteUrl(galVideoUrl) || null,
        category: galCategory.trim() || 'General Engineering'
      };
      
      const url = galEditId ? `/api/gallery/${galEditId}` : '/api/gallery';
      const method = galEditId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body)
      });
      if (response.ok) {
        showToast(galEditId ? 'Portfolio media update saved successfully!' : 'Portfolio update published successfully!', 'success');
        setShowGalModal(false);
        resetGalForm();
        fetchAdminData();
      } else {
        const errData = await response.json().catch(() => ({}));
        showToast(errData.error || 'Failed to save portfolio media update.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred while saving.', 'error');
    } finally {
      setIsSavingGallery(false);
    }
  };

  const handleEditGallery = (item: GalleryItem) => {
    setGalEditId(item.id);
    setGalTitle(item.title);
    setGalImage(item.imageUrl);
    setGalVideoUrl(item.videoUrl || '');
    setGalCategory(item.category);
    setGalImageMode(item.imageUrl && item.imageUrl.startsWith('/uploads') ? 'upload' : 'url');
    setGalVideoMode(item.videoUrl && item.videoUrl.startsWith('/uploads') ? 'upload' : 'url');
    setShowGalModal(true);
  };

  const handleDeleteGallery = async (itemId: number) => {
    if (!safeConfirm('Irreversibly delete this portfolio media update?')) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/gallery/${itemId}`, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast('Gallery item deleted successfully.', 'success');
        fetchAdminData();
      } else {
        showToast('Failed to delete gallery item.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'An error occurred.', 'error');
    }
  };

  const handleRegenerateToken = async (id: number, type: 'contract' | 'receipt') => {
    try {
      const headers = await getAuthHeaders();
      const url = type === 'contract' 
        ? `/api/contracts/${id}/regenerate-token` 
        : `/api/receipts/${id}/regenerate-token`;
        
      const response = await fetch(url, {
        method: 'POST',
        headers
      });
      if (response.ok) {
        const updatedDoc = await response.json();
        showToast(`Successfully re-generated verification token for ${type === 'contract' ? 'Contract' : 'Receipt'}: ${updatedDoc.verificationToken}`, 'success');
        fetchAdminData();
      } else {
        showToast(`Failed to re-generate token: ${await response.text()}`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error re-generating token.', 'error');
    }
  };

  const handleDeleteDocFromHistory = async (id: number, type: 'contract' | 'receipt') => {
    if (!safeConfirm(`Are you sure you want to permanently delete this ${type}? This action is irreversible.`)) return;
    try {
      const headers = await getAuthHeaders();
      const url = type === 'contract' ? `/api/contracts/${id}` : `/api/receipts/${id}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      if (response.ok) {
        showToast(`${type === 'contract' ? 'Contract' : 'Receipt'} deleted successfully.`, 'success');
        fetchAdminData();
      } else {
        showToast(`Failed to delete ${type}.`, 'error');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error deleting document.', 'error');
    }
  };

  // Helpers
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filterAuditLogs = auditLogs.filter(log => {
    const term = auditSearch.toLowerCase();
    return (
      (log.action?.toLowerCase() || '').includes(term) ||
      (log.userEmail?.toLowerCase() || '').includes(term) ||
      (log.details?.toLowerCase() || '').includes(term)
    );
  });

  // Definition of 14 Enterprise Information Architecture Groups
  const ADMIN_NAV_GROUPS = [
    {
      id: 'command-center-group',
      title: '🏠 COMMAND CENTER',
      icon: LayoutDashboard,
      items: [
        { id: 'command-center', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'analytics', label: 'Executive Analytics', icon: TrendingUp },
        { id: 'contacts', label: 'Notifications & Alerts', icon: Mail, badgeKey: 'unreadInquiries' },
        { id: 'reviews', label: 'Approval Center', icon: Star, badgeKey: 'pendingReviews' },
        { id: 'audit', label: 'Activity Feed', icon: History }
      ]
    },
    {
      id: 'analytics-group',
      title: '📊 ANALYTICS & REPORTING',
      icon: BarChart3,
      items: [
        { id: 'analytics', label: 'Dashboard Analytics', icon: TrendingUp },
        { id: 'projects', label: 'Project Analytics', icon: Building2 },
        { id: 'quote-requests', label: 'Sales & Leads Analytics', icon: FileSpreadsheet, badgeKey: 'pendingQuotes' },
        { id: 'banners', label: 'Website Analytics', icon: Sliders },
        { id: 'social-studio', label: 'SEO & Social Analytics', icon: Megaphone }
      ]
    },
    {
      id: 'projects-group',
      title: '🏗️ PROJECTS & OPERATIONS',
      icon: Building2,
      items: [
        { id: 'projects', label: 'Manage Projects', icon: Building2 },
        { id: 'gallery', label: 'Portfolio Updates', icon: Video },
        { id: 'appointments', label: 'Consultations Queue', icon: Calendar, badgeKey: 'pendingAppointments' },
        { id: 'enterprise-erp', label: 'Site / Project Operations (ERP)', icon: Building2 }
      ]
    },
    {
      id: 'qs-group',
      title: '📐 ENGINEERING & QUANTITY SURVEYING',
      icon: Calculator,
      items: [
        { id: 'boq-studio', label: 'Enterprise QS & BOQ Studio', icon: FileSpreadsheet },
        { id: 'drawing-studio', label: 'Quantity Take-Off (CAD)', icon: Layers },
        { id: 'structural-calculator', label: 'Structural Loads & Weights', icon: Calculator },
        { id: 'labour-calculator', label: 'Labour Calculator', icon: Calculator }
      ]
    },
    {
      id: 'ai-group',
      title: '🤖 AI CONSTRUCTION PLATFORM',
      icon: Sparkles,
      items: [
        { id: 'ai-construction-intelligence', label: 'AI Construction Platform', icon: Sparkles }
      ]
    },
    {
      id: 'crm-group',
      title: '💼 BUSINESS DEVELOPMENT & CRM',
      icon: Briefcase,
      items: [
        { id: 'quote-requests', label: 'Quote Requests & Leads', icon: FileSpreadsheet, badgeKey: 'pendingQuotes' },
        { id: 'contacts', label: 'Inquiries / Contacts', icon: Mail, badgeKey: 'unreadInquiries' },
        { id: 'tenders-cms', label: 'Tenders & Opportunities CMS', icon: FileSpreadsheet },
        { id: 'suppliers-cms', label: 'Suppliers & Vendors CMS', icon: Building2 },
        { id: 'appointments', label: 'Consultations Queue', icon: Calendar, badgeKey: 'pendingAppointments' }
      ]
    },
    {
      id: 'docs-group',
      title: '📄 DOCUMENTS & COMMERCIAL',
      icon: FileText,
      items: [
        { id: 'documents', label: 'Company Documents', icon: FileText },
        { id: 'legal-contracts', label: 'Contract Generator', icon: Scale },
        { id: 'proposal-studio', label: 'Proposal Manager', icon: FileText },
        { id: 'receipts', label: 'Receipt Generator', icon: Receipt },
        { id: 'doc-history', label: 'Receipt & Contract History', icon: ShieldCheck },
        { id: 'cv-generator', label: 'CV Builder', icon: Award },
        { id: 'letter-generator', label: 'Application Letters', icon: FileText }
      ]
    },
    {
      id: 'cms-group',
      title: '🌐 WEBSITE & CONTENT CMS',
      icon: Globe,
      items: [
        { id: 'cms-pages', label: 'Frontend Page & Hero Studio', icon: Globe },
        { id: 'cms-media', label: 'Media & Video Asset Library', icon: Video },
        { id: 'cms-settings', label: 'Global Branding & Site Settings', icon: Settings },
        { id: 'services-cms', label: 'Services CMS Management', icon: Layers },
        { id: 'sustainability-cms', label: 'Sustainability & ESG CMS', icon: Layers },
        { id: 'faq-cms', label: 'FAQ / Help Centre CMS', icon: FileText },
        { id: 'blogs', label: 'Manage Blogs', icon: BookOpen },
        { id: 'reviews', label: 'Approve Reviews', icon: Star, badgeKey: 'pendingReviews' },
        { id: 'banners', label: 'Home Hero Sliders', icon: Sliders },
        { id: 'gallery', label: 'Projects & Portfolio Content', icon: Video }
      ]
    },
    {
      id: 'marketing-group',
      title: '📣 MARKETING & SOCIAL MEDIA',
      icon: Megaphone,
      items: [
        { id: 'social-studio', label: 'SEO & Social Media Publisher', icon: Megaphone }
      ]
    },
    {
      id: 'hr-group',
      title: '👥 PEOPLE & HR',
      icon: Users,
      items: [
        { id: 'staff-access', label: 'Staff Access & HR Management', icon: Key },
        { id: 'team', label: 'Team Management', icon: UserIcon }
      ]
    },
    {
      id: 'minesec-group',
      title: '🎓 EDUCATION & MINESEC',
      icon: GraduationCap,
      items: [
        { id: 'lesson-studio', label: 'MINESEC Lesson Prep', icon: GraduationCap },
        { id: 'syllabus-upload', label: 'Syllabus Manager', icon: BookOpen },
        { id: 'extended-lesson-architect', label: 'Extended Lesson Architect', icon: Sparkles }
      ]
    },
    {
      id: 'finance-group',
      title: '💰 FINANCE & TRANSACTIONS',
      icon: DollarSign,
      items: [
        { id: 'api-platform', label: 'API Platform & MoMo Verification', icon: Key },
        { id: 'doc-history', label: 'Receipt & Contract History', icon: ShieldCheck },
        { id: 'enterprise-erp', label: 'ERP Financial Statements', icon: Building2 }
      ]
    },
    {
      id: 'api-platform-group',
      title: '🔌 DEVELOPER API PLATFORM',
      icon: Key,
      items: [
        { id: 'api-platform', label: 'API Products, Keys & MoMo', icon: Key },
        { id: 'db-architecture', label: 'DB & API Documentation', icon: Database }
      ]
    },
    {
      id: 'system-group',
      title: '🗃️ DATA, SECURITY & SYSTEM',
      icon: Shield,
      items: [
        { id: 'audit', label: 'Database Audit Logs', icon: History },
        { id: 'db-architecture', label: 'DB & API Documentation', icon: Database }
      ]
    },
    {
      id: 'admin-group',
      title: '⚙️ ADMINISTRATION & CONFIGURATION',
      icon: Settings,
      items: [
        { id: 'staff-access', label: 'Roles & Staff Permissions', icon: Key },
        { id: 'db-architecture', label: 'API Diagnostics & System Config', icon: Database }
      ]
    }
  ];

  const getBadgeCount = (badgeKey?: string) => {
    if (!badgeKey) return 0;
    if (badgeKey === 'pendingAppointments') return appointments.filter(a => a.status === 'pending').length;
    if (badgeKey === 'unreadInquiries') return contacts.filter(c => c.status === 'new').length;
    if (badgeKey === 'pendingReviews') return reviews.filter(r => !r.approved).length;
    if (badgeKey === 'pendingQuotes') return dbAnalytics?.pendingConsultations || 0;
    return 0;
  };

  return (
    <div className="font-sans text-slate-800 bg-slate-900 min-h-screen text-slate-300 flex flex-col" id="admin-panel-root">
      
      {/* TOP ENTERPRISE HEADER BAR */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        {/* Mobile Menu & Collapse Toggle */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title={sidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? <Maximize2 className="w-4 h-4 text-amber-500" /> : <Minimize2 className="w-4 h-4 text-slate-400" />}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-white uppercase font-mono hidden sm:inline-block">MADECC GROUP</span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">ENTERPRISE ADMIN</span>
          </div>
        </div>

        {/* Global Search / Command Palette Trigger */}
        <div className="flex-1 max-w-md mx-4 hidden sm:block">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 text-xs px-3.5 py-2 rounded-xl flex items-center justify-between transition-all group"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500 group-hover:text-amber-500 transition-colors" />
              <span>Search actions, projects, BOQs, tools...</span>
            </span>
            <kbd className="bg-slate-950 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>
        </div>

        {/* Header Right Quick Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Action Button */}
          <button
            onClick={() => setShowQuickActionModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow shadow-amber-500/10 transition-all shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden md:inline">Quick Action</span>
          </button>

          {/* Notifications Indicator */}
          <button
            onClick={() => setActiveAdminTab('contacts')}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-xl relative transition-colors"
            title="Unread Messages & Inquiries"
          >
            <Bell className="w-4 h-4 text-slate-300" />
            {contacts.filter(c => c.status === 'new').length > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-extrabold text-[9px] w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                {contacts.filter(c => c.status === 'new').length}
              </span>
            )}
          </button>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center uppercase">
                {dbUser.name ? dbUser.name.charAt(0) : dbUser.email.charAt(0)}
              </div>
              <div className="text-left hidden lg:block pr-1">
                <span className="text-xs font-bold text-white block leading-tight truncate max-w-[100px]">{dbUser.name || 'Admin'}</span>
                <span className="text-[9px] text-amber-500 font-mono block uppercase">{dbUser.role}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <span className="text-xs font-bold text-white block">{dbUser.name || 'Enterprise Admin'}</span>
                  <span className="text-[10px] text-slate-400 font-mono block truncate">{dbUser.email}</span>
                  <span className="text-[9px] text-emerald-400 font-mono font-bold mt-1 inline-block bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Authenticated Role: {dbUser.role.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => { setActiveAdminTab('staff-access'); setProfileDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Key className="w-4 h-4 text-amber-500" /> Staff & Security Access
                </button>
                <button
                  onClick={() => { setActiveAdminTab('audit'); setProfileDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-900 rounded-xl flex items-center gap-2 transition-colors"
                >
                  <History className="w-4 h-4 text-sky-400" /> Security Audit Logs
                </button>
                <button
                  onClick={() => setCurrentTab('home')}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 rounded-xl flex items-center gap-2 transition-colors mt-1 border-t border-slate-900"
                >
                  <LogOut className="w-4 h-4 text-red-400" /> Exit to Public Site
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BODY CONTENT WRAPPER */}
      <div className="flex-grow flex flex-col md:flex-row overflow-hidden relative">

        {/* ENTERPRISE SIDEBAR NAVIGATION */}
        <aside 
          className={`${
            sidebarCollapsed ? 'md:w-20' : 'md:w-72'
          } ${
            mobileMenuOpen ? 'block' : 'hidden md:block'
          } bg-slate-950 border-r border-slate-800 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[calc(100vh-57px)] transition-all duration-300 z-20`}
        >
          <div className="p-3 space-y-4">
            
            {/* Sidebar Branding Header */}
            {!sidebarCollapsed && (
              <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-2xl mb-2">
                <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold block">NAVIGATION PORTAL</span>
                <span className="text-white font-extrabold text-sm block">MADECC ADMIN</span>
                <span className="text-[10px] text-slate-400 font-mono block">14 Collapsible Enterprise Modules</span>
              </div>
            )}

            {/* Collapsible Groups Nav */}
            <nav className="space-y-2">
              {(dbUser?.role === 'social_media_reviewer'
                ? ADMIN_NAV_GROUPS.filter(g => g.id === 'marketing-group')
                : ADMIN_NAV_GROUPS
              ).map((group) => {
                const GroupIcon = group.icon;
                const isOpen = !!openGroups[group.id];
                const hasActiveItem = group.items.some(item => item.id === activeAdminTab);

                if (sidebarCollapsed) {
                  return (
                    <div key={group.id} className="relative group/collapsed flex flex-col items-center">
                      <button
                        onClick={() => toggleGroup(group.id)}
                        className={`p-3 rounded-xl transition-all ${
                          hasActiveItem 
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                        title={group.title}
                      >
                        <GroupIcon className="w-5 h-5" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div key={group.id} className="rounded-2xl border border-slate-800/60 overflow-hidden bg-slate-950/40">
                    {/* Group Header Button */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors text-left ${
                        hasActiveItem 
                          ? 'bg-slate-900 text-amber-400 font-extrabold' 
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <GroupIcon className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate">{group.title}</span>
                      </span>
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </button>

                    {/* Group Sub-Items */}
                    {isOpen && (
                      <div className="px-1.5 py-1 space-y-0.5 border-t border-slate-900/80 bg-slate-950/80">
                        {group.items.map((subItem) => {
                          const SubIcon = subItem.icon;
                          const isActive = activeAdminTab === subItem.id;
                          const count = getBadgeCount(subItem.badgeKey);

                          return (
                            <button
                              key={`${group.id}-${subItem.id}`}
                              onClick={() => {
                                setActiveAdminTab(subItem.id as any);
                                setSelectedProjectForMilestones(null);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                                isActive 
                                  ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10' 
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                              }`}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                                <span className="truncate">{subItem.label}</span>
                              </span>
                              {count > 0 && (
                                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-950">
            {!sidebarCollapsed && (
              <div className="text-[10px] text-slate-500 px-2">
                <span className="block font-bold text-slate-400">Authenticated:</span>
                <span className="block truncate font-mono text-[9px] text-slate-400">{dbUser.email}</span>
              </div>
            )}
            <button
              onClick={() => setCurrentTab('home')}
              className="w-full text-center bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold border border-slate-800 flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-500" />
              {!sidebarCollapsed && <span>Exit to Public Site</span>}
            </button>
          </div>
        </aside>

        {/* MAIN DISPLAY AREA */}
        <main className="flex-grow p-6 md:p-10 overflow-y-auto max-h-[calc(100vh-57px)] w-full">
          
          {loadingData && (
            <div className="flex items-center gap-2 mb-6 bg-slate-800/40 border border-slate-700 p-3 rounded-xl text-xs text-amber-500 font-mono animate-pulse">
              <span className="w-3 h-3 rounded-full border border-t-amber-500 animate-spin shrink-0" />
              <span>Syncing database tables in real-time...</span>
            </div>
          )}

          {/* MAIN TAB RENDERING */}
          {dbUser?.role === 'social_media_reviewer' ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950/40 border border-blue-500/30 p-5 rounded-2xl flex items-center justify-between flex-wrap gap-4 shadow-xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 px-2.5 py-0.5 rounded border border-blue-500/30 uppercase tracking-widest">
                      Dedicated Meta App Review Environment
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      🟢 Authenticated via Server-Side PostgreSQL
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white mt-1.5">Social Media Management & Facebook OAuth Studio</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reviewer workspace for Meta App Review testing. Authorized for Facebook OAuth connection, page management, and social broadcasting.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => downloadWebsiteNavigationGuidePdf()}
                    className="px-3 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400/40 text-blue-200 hover:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all shadow"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-300" /> A4 Navigation Manual (PDF)
                  </button>
                  <div className="text-right font-mono text-[11px] text-slate-400 bg-slate-950/80 px-3 py-2 rounded-xl border border-slate-800">
                    <div>Account: <span className="text-slate-200 font-bold">{dbUser.email}</span></div>
                    <div>Role: <span className="text-amber-400 font-bold">social_media_reviewer</span></div>
                  </div>
                </div>
              </div>
              <SocialMediaStudio currentUser={dbUser} />
            </div>
          ) : (
            <>
          {/* COMMAND CENTER EXECUTIVE DASHBOARD VIEW */}
          {activeAdminTab === 'command-center' && (
            <div className="space-y-8 animate-in fade-in duration-300" id="command-center-view">
              {/* Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/30 border border-slate-800 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                      MADECC GROUP Executive Operations
                    </span>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mt-2">
                      Command Center
                    </h1>
                    <p className="text-xs md:text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
                      Real-time executive oversight across engineering projects, commercial BOQs, client consultation queue, social media channels, and system security logs.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={() => downloadWebsiteNavigationGuidePdf()}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 hover:text-white font-bold text-xs border border-amber-500/40 rounded-xl flex items-center gap-2 transition-all shadow"
                    >
                      <Download className="w-4 h-4 text-amber-400" /> A4 Navigation Manual (PDF)
                    </button>
                    <button
                      onClick={() => setActiveAdminTab('boq-studio')}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 shadow shadow-amber-500/20 transition-all"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Open BOQ Studio
                    </button>
                    <button
                      onClick={() => setActiveAdminTab('social-studio')}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs border border-slate-700 rounded-xl flex items-center gap-2 transition-all"
                    >
                      <Megaphone className="w-4 h-4 text-amber-400" /> Social Publisher
                    </button>
                  </div>
                </div>
              </div>

              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3.5">
                {[
                  { label: 'Active Projects', value: projects.length, icon: Building2, color: 'text-amber-400', tab: 'projects' },
                  { label: 'Pending Quotes', value: dbAnalytics?.pendingConsultations || 0, icon: FileSpreadsheet, color: 'text-sky-400', tab: 'quote-requests' },
                  { label: 'Consultations', value: appointments.filter(a => a.status === 'pending').length, icon: Calendar, color: 'text-emerald-400', tab: 'appointments' },
                  { label: 'Active Contracts', value: signedContracts.length, icon: Scale, color: 'text-purple-400', tab: 'legal-contracts' },
                  { label: 'Pending Reviews', value: reviews.filter(r => !r.approved).length, icon: Star, color: 'text-amber-400', tab: 'reviews' },
                  { label: 'Client Inquiries', value: contacts.filter(c => c.status === 'new').length, icon: Mail, color: 'text-cyan-400', tab: 'contacts' },
                  { label: 'Social Channels', value: 'OAuth Active', icon: Megaphone, color: 'text-emerald-400', tab: 'social-studio' },
                  { label: 'System Health', value: '98% Nominal', icon: ShieldCheck, color: 'text-emerald-400', tab: 'audit' }
                ].map((m, idx) => {
                  const IconComp = m.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveAdminTab(m.tab as any)}
                      className="bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl text-left transition-all group flex flex-col justify-between shadow-lg"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">{m.label}</span>
                        <IconComp className={`w-4 h-4 ${m.color} group-hover:scale-110 transition-transform`} />
                      </div>
                      <span className="text-xl font-extrabold text-white tracking-tight font-mono">{m.value}</span>
                    </button>
                  );
                })}
              </div>

              {/* Two-Column Dashboard Body */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Cols: Approval Center & Quick Actions */}
                <div className="lg:col-span-2 space-y-8">
                  
                  {/* Pending Approval Center */}
                  <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                      <div>
                        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                          <Star className="w-5 h-5 text-amber-500" /> Pending Approval & Moderation Queue
                        </h2>
                        <p className="text-xs text-slate-400">Consultations, client feedback, and lead submissions awaiting admin review.</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                        {appointments.filter(a => a.status === 'pending').length + reviews.filter(r => !r.approved).length} Pending
                      </span>
                    </div>

                    <div className="space-y-3">
                      {appointments.filter(a => a.status === 'pending').slice(0, 3).map((appt) => (
                        <div key={appt.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-sky-500/10 text-sky-400 font-mono font-bold px-2 py-0.5 rounded border border-sky-500/20 uppercase">Consultation</span>
                              <span className="text-xs font-bold text-white">{appt.clientName}</span>
                            </div>
                            <p className="text-xs text-slate-400">{appt.clientEmail} • {appt.appointmentDate}</p>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              onClick={() => handleUpdateAppointmentStatus(appt.id, 'confirmed')}
                              className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-xl text-xs font-bold border border-emerald-500/30 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setActiveAdminTab('appointments')}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      ))}

                      {reviews.filter(r => !r.approved).slice(0, 3).map((rev) => (
                        <div key={rev.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] bg-amber-500/10 text-amber-400 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20 uppercase">Review</span>
                              <span className="text-xs font-bold text-white">{rev.authorName} ({rev.rating}★)</span>
                            </div>
                            <p className="text-xs text-slate-400 italic">"{rev.text}"</p>
                          </div>
                          <button
                            onClick={() => setActiveAdminTab('reviews')}
                            className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-xl text-xs font-bold border border-amber-500/30 transition-colors shrink-0"
                          >
                            Review
                          </button>
                        </div>
                      ))}

                      {appointments.filter(a => a.status === 'pending').length === 0 && reviews.filter(r => !r.approved).length === 0 && (
                        <div className="text-center py-8 border border-dashed border-slate-800 rounded-2xl">
                          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                          <p className="text-xs text-slate-300 font-bold">All queue items are current and approved!</p>
                          <p className="text-[11px] text-slate-500">No pending consultations or reviews waiting for moderation.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Hub Launch Grid */}
                  <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                    <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-amber-500" /> Enterprise Module Quick Launch
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { title: 'Global Site Customizer', desc: 'Identity, Mbankolo HQ, contacts & theme', tab: 'cms-settings', icon: Settings, color: 'text-amber-400' },
                        { title: 'Page Builder Studio', desc: 'Frontend pages, heroes & custom content', tab: 'cms-pages', icon: Globe, color: 'text-sky-400' },
                        { title: 'Services CMS', desc: 'Manage civil & construction services', tab: 'services-cms', icon: Layers, color: 'text-emerald-400' },
                        { title: 'QS & BOQ Studio', desc: 'Civil engineering bill of quantities', tab: 'boq-studio', icon: FileSpreadsheet, color: 'text-amber-400' },
                        { title: 'AI Construction Platform', desc: 'Blueprint vision takeoff & estimates', tab: 'ai-construction-intelligence', icon: Sparkles, color: 'text-purple-400' },
                        { title: 'Enterprise ERP Hub', desc: 'Site operations, inventory & equipment', tab: 'enterprise-erp', icon: Building2, color: 'text-teal-400' },
                        { title: 'Quote Requests & Leads', desc: 'Commercial proposals & client pipeline', tab: 'quote-requests', icon: FileSpreadsheet, color: 'text-blue-400' },
                        { title: 'Social Media Studio', desc: 'OAuth 2.0 publisher & scheduler', tab: 'social-studio', icon: Megaphone, color: 'text-pink-400' },
                        { title: 'Contract Generator', desc: 'Legal contract agreement builder', tab: 'legal-contracts', icon: Scale, color: 'text-indigo-400' }
                      ].map((hub, idx) => {
                        const HubIcon = hub.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => setActiveAdminTab(hub.tab as any)}
                            className="p-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition-all group"
                          >
                            <HubIcon className={`w-5 h-5 ${hub.color} mb-2 group-hover:scale-110 transition-transform`} />
                            <span className="text-xs font-bold text-white block group-hover:text-amber-400 transition-colors">{hub.title}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{hub.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Right Col: Activity Feed & System Health */}
                <div className="space-y-8">
                  
                  {/* System Health Status Widget */}
                  <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                    <h2 className="text-sm font-extrabold text-white flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Infrastructure Health
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">ONLINE</span>
                    </h2>

                    <div className="space-y-3 font-mono text-xs">
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex justify-between items-center">
                        <span className="text-slate-400">Neon PostgreSQL DB</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Connected
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex justify-between items-center">
                        <span className="text-slate-400">Firebase Auth JWT</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Verified
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex justify-between items-center">
                        <span className="text-slate-400">Social OAuth Encrypted</span>
                        <span className="text-amber-400 font-bold flex items-center gap-1.5">
                          AES-256 Active
                        </span>
                      </div>
                      <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex justify-between items-center">
                        <span className="text-slate-400">Last Database Backup</span>
                        <span className="text-slate-300 font-bold">
                          {lastBackupTime ? new Date(lastBackupTime).toLocaleTimeString() : 'Auto Scheduled'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Audit Log Activity Feed */}
                  <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-sky-400" /> Recent Administrative Trail
                      </h2>
                      <button
                        onClick={() => setActiveAdminTab('audit')}
                        className="text-[10px] text-amber-500 hover:underline font-bold"
                      >
                        View All Logs
                      </button>
                    </div>

                    <div className="space-y-3">
                      {auditLogs.slice(0, 6).map((log) => (
                        <div key={log.id} className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded">
                              {log.action}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-sans line-clamp-2">{log.details}</p>
                          <span className="text-[9px] text-slate-500 font-mono block truncate">{log.userEmail || 'System Administrator'}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        
        {loadingData && (
          <div className="flex items-center gap-2 mb-6 bg-slate-800/40 border border-slate-700 p-3 rounded-lg text-xs text-amber-500 font-mono animate-pulse">
            <span className="w-3 h-3 rounded-full border border-t-amber-500 animate-spin shrink-0" />
            <span>Syncing database tables in real-time...</span>
          </div>
        )}

        {/* QUOTE REQUESTS & LEADS MANAGEMENT */}
        {activeAdminTab === 'quote-requests' && (
          <AdminQuoteRequests />
        )}

        {/* CMS FRONTEND PAGE & HERO BUILDER */}
        {activeAdminTab === 'cms-pages' && (
          <CmsPageBuilder />
        )}

        {/* CMS MEDIA & VIDEO ASSET LIBRARY */}
        {activeAdminTab === 'cms-media' && (
          <CmsMediaLibrary />
        )}

        {/* CMS GLOBAL SITE SETTINGS & BRANDING */}
        {activeAdminTab === 'cms-settings' && (
          <CmsSiteSettings />
        )}

        {/* SERVICES CMS MANAGEMENT */}
        {activeAdminTab === 'services-cms' && (
          <AdminServices />
        )}

        {/* SUSTAINABILITY CMS MANAGEMENT */}
        {activeAdminTab === 'sustainability-cms' && (
          <AdminSustainability />
        )}

        {/* FAQ CMS MANAGEMENT */}
        {activeAdminTab === 'faq-cms' && (
          <AdminFaq />
        )}

        {/* SUPPLIERS & SUBCONTRACTORS CMS MANAGEMENT */}
        {activeAdminTab === 'suppliers-cms' && (
          <AdminSuppliers />
        )}

        {/* TENDERS CMS MANAGEMENT */}
        {activeAdminTab === 'tenders-cms' && (
          <AdminTenders />
        )}

        {/* STAFF ACCESS & HR MANAGEMENT VIEW */}
        {activeAdminTab === 'staff-access' && (
          <StaffManagementHub currentUser={dbUser} userRole={dbUser?.role} />
        )}

        {/* ENTERPRISE CONSTRUCTION ERP HUB */}
        {activeAdminTab === 'enterprise-erp' && (
          <EnterpriseErpHub />
        )}

        {/* AI CONSTRUCTION PLATFORM HUB */}
        {activeAdminTab === 'ai-construction-intelligence' && (
          <AIConstructionIntelligence dbUser={dbUser} showToast={showToast} getAuthHeaders={getAuthHeaders} />
        )}

        {/* SEO & SOCIAL MEDIA PUBLISHER HUB */}
        {activeAdminTab === 'social-studio' && (
          <SocialMediaStudio currentUser={dbUser} />
        )}

        {/* 1. ANALYTICS DASHBOARD VIEW */}
        {activeAdminTab === 'analytics' && (
          <div className="space-y-10" id="admin-tab-analytics">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">System Metric Summary</span>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Dashboard Analytics</h1>
                <p className="text-xs text-slate-400">Live PostgreSQL aggregation queries on Neon database</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    try {
                      generateAnalyticsPDF(projects, appointments, contacts, reviews, dbUser?.email || 'admin@madecc.com');
                      showToast('Executive Analytics PDF Report generated and downloaded successfully!', 'success');
                    } catch (err: any) {
                      showToast(`Failed to generate report: ${err.message}`, 'error');
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer font-sans"
                >
                  <Download className="w-4.5 h-4.5" /> Download Executive Report
                </button>

                <button
                  onClick={() => {
                    const headers = ["ID", "Name", "Email", "Subject", "Message", "Status", "Received At"];
                    const rows = contacts.map(c => [
                      String(c.id),
                      c.name,
                      c.email,
                      c.subject,
                      c.message,
                      c.status || 'new',
                      c.createdAt ? new Date(c.createdAt).toISOString() : ''
                    ]);
                    exportToCSV('customer_inquiries.csv', headers, rows);
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500 hover:text-amber-500 text-slate-300 font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Inquiries
                </button>

                <button
                  onClick={() => {
                    const headers = ["ID", "Email", "Subscribed At"];
                    const rows = subscribers.map(s => [
                      String(s.id),
                      s.email,
                      s.createdAt ? new Date(s.createdAt).toISOString() : ''
                    ]);
                    exportToCSV('newsletter_subscribers.csv', headers, rows);
                  }}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-500 hover:text-amber-500 text-slate-300 font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export Subscribers
                </button>
              </div>
            </div>

            {/* Metric widgets grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute right-4 top-4 bg-amber-500/10 text-amber-500 p-2.5 rounded-xl"><Building2 className="w-5 h-5" /></div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Managed Contracts</span>
                <span className="text-white text-3xl font-extrabold mt-2 block">
                  {dbAnalytics ? dbAnalytics.managedContractsCount : projects.length}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Active/completed civil files</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute right-4 top-4 bg-amber-500/10 text-amber-500 p-2.5 rounded-xl"><Calendar className="w-5 h-5" /></div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Pending Consultations</span>
                <span className="text-white text-3xl font-extrabold mt-2 block">
                  {dbAnalytics ? dbAnalytics.pendingConsultations : appointments.filter(a => a.status === 'pending').length}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Requires coordinator action</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute right-4 top-4 bg-amber-500/10 text-amber-500 p-2.5 rounded-xl"><Mail className="w-5 h-5" /></div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Unread Inquiries</span>
                <span className="text-white text-3xl font-extrabold mt-2 block">
                  {dbAnalytics ? dbAnalytics.unreadInquiries : contacts.filter(c => c.status === 'new').length}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Dispatched message inbox</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute right-4 top-4 bg-amber-500/10 text-amber-500 p-2.5 rounded-xl"><Star className="w-5 h-5" /></div>
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Pending Reviews</span>
                <span className="text-white text-3xl font-extrabold mt-2 block">
                  {dbAnalytics ? dbAnalytics.pendingReviews : reviews.filter(r => !r.approved).length}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Awaiting approval queue</span>
              </div>
            </div>

            {/* Recharts Analytics Charts */}
            <DashboardCharts
              projects={projects}
              appointments={appointments}
              contacts={contacts}
              subscribers={subscribers}
              dbAnalytics={dbAnalytics}
            />

            {/* Quick action shortcuts */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 space-y-4">
              <h3 className="font-bold text-white text-base">Quick Operator Diagnostics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Database synchronization operates via Cloud SQL Auth Proxy Unix pooling. Use the controls below to configure banners or review latest log audits.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveAdminTab('projects')}
                  className="bg-slate-900 border border-slate-850 hover:border-amber-500 text-amber-500 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Verify Contracts Timeline
                </button>
                <button
                  onClick={() => setActiveAdminTab('reviews')}
                  className="bg-slate-900 border border-slate-850 hover:border-amber-500 text-amber-500 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Flush Review Approvals
                </button>
                <button
                  onClick={() => setActiveAdminTab('audit')}
                  className="bg-slate-900 border border-slate-850 hover:border-amber-500 text-amber-500 py-2.5 px-4 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  Query Audit Log Database
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTRACT PROJECTS & PROGRESS MANAGE VIEW */}
        {activeAdminTab === 'projects' && (
          <div className="space-y-8" id="admin-tab-projects">
            
            {selectedProjectForMilestones ? (
              /* PROGRESS MILESTONE EDITOR FOR SPECIFIC PROJECT */
              <div className="space-y-8">
                <button
                  onClick={() => setSelectedProjectForMilestones(null)}
                  className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-2 px-4 rounded text-xs uppercase tracking-wider mb-4 border border-slate-700"
                >
                  ← Back to Projects List
                </button>

                <div className="space-y-1">
                  <span className="text-amber-500 font-mono text-xs uppercase font-bold">Milestones Pipeline Manager</span>
                  <h2 className="text-2xl font-extrabold text-white">Project: {selectedProjectForMilestones.title}</h2>
                  <p className="text-xs text-slate-400">Add, delete, or update percentages/status of this project's contracts milestones.</p>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  
                  {/* Left Column: Add Milestone Form */}
                  <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">Add Milestone</h3>
                    <form onSubmit={handleAddMilestone} className="space-y-4">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Milestone Name</label>
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 rounded py-2 px-3 text-sm text-white focus:border-amber-500 outline-none"
                          placeholder="e.g. Electrical Handover"
                          value={newMilestoneName}
                          onChange={(e) => setNewMilestoneName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Percentage Progress</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            className="w-full bg-slate-900 border border-slate-800 rounded py-2 px-3 text-sm text-white focus:border-amber-500 outline-none"
                            value={Number.isNaN(newMilestonePercent) ? '' : newMilestonePercent}
                            onChange={(e) => setNewMilestonePercent(parseInt(e.target.value) || 0)}
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Initial Status</label>
                          <select
                            className="w-full bg-slate-900 border border-slate-800 rounded py-2 px-3 text-sm text-white outline-none"
                            value={newMilestoneStatus}
                            onChange={(e) => setNewMilestoneStatus(e.target.value as any)}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Description</label>
                        <textarea
                          rows={3}
                          className="w-full bg-slate-900 border border-slate-800 rounded py-2 px-3 text-sm text-white focus:border-amber-500 outline-none resize-none"
                          placeholder="Provide details regarding the scope completed/active..."
                          value={newMilestoneDesc}
                          onChange={(e) => setNewMilestoneDesc(e.target.value)}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded text-xs uppercase tracking-wider shadow"
                      >
                        Add Milestone Block
                      </button>
                    </form>
                  </div>

                  {/* Right Column: Milestones List */}
                  <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2">Existing Milestone Pipeline</h3>

                    {selectedProjectForMilestones.progress && selectedProjectForMilestones.progress.length > 0 ? (
                      <div className="space-y-4">
                        {selectedProjectForMilestones.progress.map((m) => (
                          <div key={m.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
                              <div>
                                <span className="block font-bold text-xs text-white">{m.milestoneName}</span>
                                <span className="block text-[9px] text-slate-500 font-mono">ID: {m.id} | Date: {formatDateTime(m.date)}</span>
                              </div>
                              <button
                                onClick={() => handleDeleteMilestone(m.id)}
                                className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-slate-800 text-xs flex items-center gap-1 font-bold"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>

                            {/* Inline Edit Form Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div>
                                <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Status</label>
                                <select
                                  className="w-full bg-slate-950 border border-slate-800 rounded py-1 px-2 text-xs text-slate-300"
                                  value={m.status}
                                  onChange={(e) => handleUpdateMilestone(m.id, m.milestoneName, m.percentage, m.description, e.target.value)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="active">Active</option>
                                  <option value="completed">Completed</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[9px] text-slate-500 font-bold uppercase mb-1">Percentage ({m.percentage}%)</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  className="w-full accent-amber-500"
                                  value={Number.isNaN(Number(m.percentage)) ? 0 : m.percentage}
                                  onChange={(e) => handleUpdateMilestone(m.id, m.milestoneName, parseInt(e.target.value) || 0, m.description, m.status)}
                                />
                              </div>

                              <div className="flex items-end">
                                <span className="text-[10px] text-slate-500 leading-normal block italic truncate">Auto-saves on update</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-slate-500 text-xs">No milestones registered yet. Use the form on the left.</div>
                    )}

                  </div>

                </div>
              </div>
            ) : (
              /* DEFAULT PROJECTS BROWSER & CRUD */
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div className="space-y-1">
                    <span className="text-amber-500 text-xs font-mono font-bold uppercase font-sans">Active Land Portfolios</span>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Manage Construction Contracts</h1>
                  </div>

                  <button
                    onClick={() => {
                      resetProjForm();
                      setShowProjModal(true);
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
                    id="add-project-btn"
                  >
                    <Plus className="w-4 h-4" /> Add Project Contract
                  </button>
                </div>

                {/* Table list */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="p-4">Title & Details</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Budget Value</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850">
                      {projects.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-4">
                            <span className="font-bold text-white block text-sm">{p.title}</span>
                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">ID: {p.id} | Start: {formatDateTime(p.startDate || '')}</span>
                          </td>
                          <td className="p-4 font-medium text-slate-300">{p.location}</td>
                          <td className="p-4 font-mono font-bold text-white">
                            {p.budget ? `£${Number(p.budget).toLocaleString()}` : 'TBA'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase tracking-wider text-white ${
                              p.status === 'completed' ? 'bg-emerald-600' :
                              p.status === 'in-progress' ? 'bg-amber-500 text-slate-950' :
                              'bg-indigo-600'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => fetchMilestonesForSelectedProject(p.id)}
                              className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              Timeline Milestones
                            </button>
                            <button
                              onClick={() => handleEditProjectClick(p)}
                              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 inline-flex items-center"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(p.id)}
                              className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-slate-800 inline-flex items-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CREATE/EDIT PROJECT MODAL */}
            {showProjModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-8 space-y-6">
                  <button
                    onClick={() => setShowProjModal(false)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>

                  <h3 className="font-extrabold text-xl text-white border-b border-slate-800 pb-3">
                    {projEditId ? 'Edit Project Specifications' : 'Add New Construction Contract'}
                  </h3>

                  <form onSubmit={handleSaveProject} className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Contract Title</label>
                        <input
                          type="text"
                          className="w-full bg-slate-955 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white outline-none"
                          value={projTitle}
                          onChange={(e) => setProjTitle(e.target.value)}
                          placeholder="e.g. Skyline Mall Development"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Target Category</label>
                        <select
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-slate-300 outline-none"
                          value={projCategory}
                          onChange={(e) => setProjCategory(e.target.value)}
                        >
                          <option value="">Select Category</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Project Summary Blueprint</label>
                      <textarea
                        rows={4}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white outline-none resize-none"
                        value={projDesc}
                        onChange={(e) => setProjDesc(e.target.value)}
                        placeholder="Detail the complete construction blueprints, material specifications, and sustainability targets..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Contract Location</label>
                        <input
                          type="text"
                          className="w-full bg-slate-955 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white outline-none"
                          value={projLoc}
                          onChange={(e) => setProjLoc(e.target.value)}
                          placeholder="e.g. Manchester, UK"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Budget Value (£)</label>
                        <input
                          type="number"
                          className="w-full bg-slate-955 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white outline-none"
                          value={projBudget}
                          onChange={(e) => setProjBudget(e.target.value)}
                          placeholder="e.g. 14500000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Start Date</label>
                        <input
                          type="date"
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-slate-300 outline-none"
                          value={projStart}
                          onChange={(e) => setProjStart(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Target End Date</label>
                        <input
                          type="date"
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-slate-300 outline-none"
                          value={projEnd}
                          onChange={(e) => setProjEnd(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Current Status</label>
                        <select
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-slate-300 outline-none"
                          value={projStatus}
                          onChange={(e) => setProjStatus(e.target.value as any)}
                        >
                          <option value="planning">Planning</option>
                          <option value="in-progress">In-Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On-Hold</option>
                        </select>
                      </div>
                    </div>
                    {/* Media Assets Manager */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-500 tracking-wider block">Media Assets Manager</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cover Image Upload/Link */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Cover Image</label>
                            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setProjImageMode('url')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  projImageMode === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Web URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setProjImageMode('upload')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  projImageMode === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Upload
                              </button>
                            </div>
                          </div>

                          {projImageMode === 'url' ? (
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white text-xs outline-none"
                              value={projImage}
                              onChange={(e) => setProjImage(e.target.value)}
                              placeholder="https://images.unsplash.com/... or web image link"
                            />
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-1.5">
                              <label className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-3 py-1.5 rounded cursor-pointer font-bold border border-slate-700 whitespace-nowrap shrink-0">
                                Browse Image
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, 'projImage')} 
                                  disabled={uploadingFile}
                                />
                              </label>
                              <div className="flex-1 min-w-0">
                                {projImage ? (
                                  <span className="text-[10px] text-emerald-400 font-mono truncate block" title={projImage}>✓ Loaded: {projImage.split('/').pop()}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 block">No file chosen</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Video Upload/Link */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">SEO Video / YouTube</label>
                            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setProjVideoMode('url')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  projVideoMode === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                YouTube URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setProjVideoMode('upload')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  projVideoMode === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Upload
                              </button>
                            </div>
                          </div>

                          {projVideoMode === 'url' ? (
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white text-xs outline-none"
                              value={projVideoUrl}
                              onChange={(e) => setProjVideoUrl(e.target.value)}
                              placeholder="e.g. YouTube URL or direct MP4 URL"
                            />
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-1.5">
                              <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded border border-amber-500/30 cursor-pointer font-bold whitespace-nowrap shrink-0">
                                Browse Video
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, 'projVideo')} 
                                  disabled={uploadingFile}
                                />
                              </label>
                              <div className="flex-1 min-w-0">
                                {projVideoUrl ? (
                                  <span className="text-[10px] text-amber-400 font-mono truncate block" title={projVideoUrl}>✓ Loaded: {projVideoUrl.split('/').pop()}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 block">No file chosen (Max 150MB)</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Visual Media Preview Card */}
                      {(projImage || projVideoUrl) && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                          <span className="block text-[10px] text-amber-500 font-mono font-bold uppercase">Live Contract Media Preview</span>
                          <div className="h-44 relative rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-850">
                            {projVideoUrl && getYouTubeEmbedUrl(projVideoUrl) ? (
                              <iframe
                                src={getYouTubeEmbedUrl(projVideoUrl)!}
                                title="YouTube Preview"
                                className="w-full h-full border-0"
                              />
                            ) : projVideoUrl ? (
                              <video src={ensureAbsoluteUrl(projVideoUrl)} poster={getOptimizedImageUrl(projImage)} controls className="w-full h-full object-contain" />
                            ) : (
                              <img src={getOptimizedImageUrl(projImage)} alt="Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                        </div>
                      )}

                      {uploadingFile && (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3 animate-pulse">
                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span className="text-xs font-mono text-amber-500">{uploadProgress}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowProjModal(false)}
                        className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-2.5 px-5 rounded text-xs uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-6 rounded text-xs uppercase tracking-wider"
                      >
                        {projEditId ? 'Update Contract File' : 'Publish Contract File'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 3. REVIEWS MODERATION QUEUE */}
        {activeAdminTab === 'reviews' && (
          <div className="space-y-8" id="admin-tab-reviews">
            <div className="space-y-1">
              <span className="text-amber-500 text-xs font-mono font-bold uppercase">Feedback Quality Gate</span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Approve Client Testimonials</h1>
              <p className="text-xs text-slate-400">Reviews submitted by clients remain gated. Approve testimonials to let them display on the public website.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Author Name</th>
                    <th className="p-4">Project Refer.</th>
                    <th className="p-4">Rating Score</th>
                    <th className="p-4">Inquiry Text</th>
                    <th className="p-4">Approval Status</th>
                    <th className="p-4 text-right">Delete Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {reviews.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-bold text-white">{r.authorName}</td>
                      <td className="p-4 text-slate-400 font-mono text-[10px]">{r.projectName || 'General Contracting'}</td>
                      <td className="p-4">
                        <div className="flex text-amber-500 gap-0.5">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate italic">"{r.text}"</td>
                      <td className="p-4">
                        <button
                          onClick={() => handleToggleReviewApproval(r.id, r.approved)}
                          className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                            r.approved 
                              ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                          }`}
                        >
                          {r.approved ? 'Approved ✓' : 'Approve Feedback'}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteReview(r.id)}
                          className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-slate-800 inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. BLOGS MANAGE VIEW */}
        {activeAdminTab === 'blogs' && (
          <div className="space-y-8" id="admin-tab-blogs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">Corporate Intelligence Publishers</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Manage Insights Blogs</h1>
              </div>

              <button
                onClick={() => setShowBlogModal(true)}
                className="bg-amber-50 hover:bg-amber-100 text-slate-900 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow shadow-amber-500/10"
              >
                <Plus className="w-4 h-4" /> Draft Insight Article
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {blogs.map((post) => (
                <div key={`blog-${post.id}`} className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] bg-slate-800 text-amber-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded font-mono">{post.category}</span>
                      <h3 className="font-bold text-white text-base leading-tight line-clamp-1">{post.title}</h3>
                      <span className="block text-[10px] text-slate-500 font-mono">Published: {formatDateTime(post.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                      <button
                        onClick={() => handleEditBlogClick(post)}
                        className="text-amber-500 hover:text-amber-400 p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800"
                        title="Edit Article"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBlog(post.id)}
                        className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{post.summary}</p>
                </div>
              ))}
            </div>

            {/* CREATE BLOG MODAL */}
            {showBlogModal && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-100">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-8 space-y-6">
                  <button
                    onClick={() => setShowBlogModal(false)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>

                  <h3 className="font-extrabold text-xl text-white border-b border-slate-800 pb-3">Draft Intelligence Briefing</h3>

                  <form onSubmit={handleSaveBlog} className="space-y-4 text-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Article Title</label>
                        <input
                          type="text"
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-white outline-none"
                          value={blogTitle}
                          onChange={(e) => setBlogTitle(e.target.value)}
                          placeholder="e.g. Advancements in Photovoltaics"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Article Category</label>
                        <input
                          type="text"
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-white outline-none"
                          value={blogCategory}
                          onChange={(e) => setBlogCategory(e.target.value)}
                          placeholder="e.g. Engineering / Sustainability"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Executive Summary Brief</label>
                      <input
                        type="text"
                        className="w-full bg-slate-955 border border-slate-800 rounded py-2.5 px-3 text-white outline-none"
                        value={blogSummary}
                        onChange={(e) => setBlogSummary(e.target.value)}
                        placeholder="Provide a high-impact summary displayed on the card..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Article Content Document</label>
                      <textarea
                        rows={8}
                        className="w-full bg-slate-955 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white outline-none resize-none"
                        value={blogContent}
                        onChange={(e) => setBlogContent(e.target.value)}
                        placeholder="Draft the complete article text. Supports standard typography paragraphs..."
                        required
                      />
                    </div>

                    {/* Media Assets Manager */}
                    <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
                      <span className="text-[10px] font-mono uppercase font-bold text-amber-500 tracking-wider block">Media Assets Manager</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Cover Image Upload/Link */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Cover Image</label>
                            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setBlogImageMode('url')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  blogImageMode === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Web URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setBlogImageMode('upload')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  blogImageMode === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Upload
                              </button>
                            </div>
                          </div>

                          {blogImageMode === 'url' ? (
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white text-xs outline-none"
                              value={blogImage}
                              onChange={(e) => setBlogImage(e.target.value)}
                              placeholder="https://images.unsplash.com/... or web image link"
                            />
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-1.5">
                              <label className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs px-3 py-1.5 rounded cursor-pointer font-bold border border-slate-700 whitespace-nowrap shrink-0">
                                Browse Image
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, 'blogImage')} 
                                  disabled={uploadingFile}
                                />
                              </label>
                              <div className="flex-1 min-w-0">
                                {blogImage ? (
                                  <span className="text-[10px] text-emerald-400 font-mono truncate block" title={blogImage}>✓ Loaded: {blogImage.split('/').pop()}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 block">No file chosen</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Video Upload/Link */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">SEO Video / YouTube</label>
                            <div className="flex gap-1 bg-slate-950 p-0.5 rounded-md border border-slate-800">
                              <button
                                type="button"
                                onClick={() => setBlogVideoMode('url')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  blogVideoMode === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                YouTube URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setBlogVideoMode('upload')}
                                className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase transition-all ${
                                  blogVideoMode === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                                }`}
                              >
                                Upload
                              </button>
                            </div>
                          </div>

                          {blogVideoMode === 'url' ? (
                            <input
                              type="text"
                              className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded py-2 px-3 text-white text-xs outline-none"
                              value={blogVideoUrl}
                              onChange={(e) => setBlogVideoUrl(e.target.value)}
                              placeholder="e.g. YouTube URL or direct MP4 URL"
                            />
                          ) : (
                            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded p-1.5">
                              <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded border border-amber-500/30 cursor-pointer font-bold whitespace-nowrap shrink-0">
                                Browse Video
                                <input 
                                  type="file" 
                                  accept="video/*" 
                                  className="hidden" 
                                  onChange={(e) => handleFileUpload(e, 'blogVideo')} 
                                  disabled={uploadingFile}
                                />
                              </label>
                              <div className="flex-1 min-w-0">
                                {blogVideoUrl ? (
                                  <span className="text-[10px] text-amber-400 font-mono truncate block" title={blogVideoUrl}>✓ Loaded: {blogVideoUrl.split('/').pop()}</span>
                                ) : (
                                  <span className="text-[10px] text-slate-500 block">No file chosen (Max 150MB)</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Live Visual Media Preview Card */}
                      {(blogImage || blogVideoUrl) && (
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                          <span className="block text-[10px] text-amber-500 font-mono font-bold uppercase">Live Insight Media Asset Preview</span>
                          <div className="h-44 relative rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-850">
                            {blogVideoUrl && getYouTubeEmbedUrl(blogVideoUrl) ? (
                              <iframe
                                src={getYouTubeEmbedUrl(blogVideoUrl)!}
                                title="YouTube Preview"
                                className="w-full h-full border-0"
                              />
                            ) : blogVideoUrl ? (
                              <video src={ensureAbsoluteUrl(blogVideoUrl)} poster={getOptimizedImageUrl(blogImage)} controls className="w-full h-full object-contain" />
                            ) : (
                              <img src={getOptimizedImageUrl(blogImage)} alt="Preview" className="w-full h-full object-cover" />
                            )}
                          </div>
                        </div>
                      )}

                      {uploadingFile && (
                        <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-3 animate-pulse">
                          <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span className="text-xs font-mono text-amber-500">{uploadProgress}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowBlogModal(false);
                          resetBlogForm();
                        }}
                        className="bg-slate-800 text-white font-bold py-2.5 px-5 rounded text-xs uppercase tracking-wider"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 text-slate-950 font-bold py-2.5 px-6 rounded text-xs uppercase tracking-wider shadow"
                      >
                        {blogEditId ? 'Update Insight Article' : 'Publish Insight Article'}
                      </button>
                    </div>

                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 5. CONSULTATIONS / APPOINTMENTS QUEUE */}
        {activeAdminTab === 'appointments' && (
          <div className="space-y-8" id="admin-tab-appointments">
            <div className="space-y-1">
              <span className="text-amber-500 text-xs font-mono font-bold uppercase">Scheduling Operations Desk</span>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Active Consultation Requests</h1>
              <p className="text-xs text-slate-400">Review, confirm, complete, or cancel incoming consultation bids from clients.</p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Client Name & Details</th>
                    <th className="p-4">Targeted Service</th>
                    <th className="p-4">Scheduled Date & Time</th>
                    <th className="p-4">Inquiry Notes</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-right">Status Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-900/30 transition-colors" id={`admin-appt-${appt.id}`}>
                      <td className="p-4">
                        <span className="font-bold text-white block text-sm">{appt.clientName}</span>
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{appt.clientEmail}</span>
                      </td>
                      <td className="p-4 font-medium text-slate-300">{appt.serviceName}</td>
                      <td className="p-4 font-mono font-bold text-amber-500">{formatDateTime(appt.appointmentDate)}</td>
                      <td className="p-4 text-slate-400 max-w-xs truncate italic">"{appt.notes || 'No notes specified.'}"</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          appt.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          appt.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          appt.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {appt.status === 'confirmed' ? 'Approved' : appt.status}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {appt.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appt.id, 'confirmed')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appt.id, 'completed')}
                            className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                          <button
                            onClick={() => handleUpdateAppointmentStatus(appt.id, 'cancelled')}
                            className="bg-slate-800 hover:bg-slate-750 text-red-400 border border-slate-700 text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAppointment(appt.id)}
                          className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-slate-800 inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. CONTACT MESSAGES MANAGER VIEW */}
        {activeAdminTab === 'contacts' && (
          <div className="space-y-8" id="admin-tab-contacts">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">Office Inboxes</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Dispatch contact inquiries</h1>
                <p className="text-xs text-slate-400">View and moderate raw subject lines and messages received through the public contact form.</p>
              </div>

              <button
                onClick={() => {
                  const headers = ["ID", "Name", "Email", "Subject", "Message", "Status", "Received At"];
                  const rows = contacts.map(c => [
                    String(c.id),
                    c.name,
                    c.email,
                    c.subject,
                    c.message,
                    c.status || 'new',
                    c.createdAt ? new Date(c.createdAt).toISOString() : ''
                  ]);
                  exportToCSV('customer_inquiries.csv', headers, rows);
                }}
                className="bg-slate-950 border border-slate-800 hover:border-amber-500 hover:text-amber-500 text-slate-300 font-extrabold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" /> Export Inquiries to CSV
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Sender Details</th>
                    <th className="p-4">Subject Line</th>
                    <th className="p-4">Message Body</th>
                    <th className="p-4">Status Flag</th>
                    <th className="p-4 text-right">Inquiry Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-white block text-sm">{c.name}</span>
                        <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{c.email} | Recd: {formatDateTime(c.createdAt)}</span>
                      </td>
                      <td className="p-4 font-bold text-slate-300">{c.subject}</td>
                      <td className="p-4 text-slate-400 max-w-sm whitespace-pre-wrap">{c.message}</td>
                      <td className="p-4">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                          c.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          c.status === 'read' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                        }`}>
                          {c.status === 'replied' ? 'Approved & Replied' : c.status === 'read' ? 'Approved & Read' : 'New'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        {c.status === 'new' && (
                          <button
                            onClick={() => handleMarkContactStatus(c.id, 'read')}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition-colors"
                          >
                            Approve Inquiry
                          </button>
                        )}
                        {c.status !== 'replied' && (
                          <button
                            onClick={() => handleMarkContactStatus(c.id, 'replied')}
                            className="bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-bold uppercase px-2.5 py-1.5 rounded transition-colors"
                          >
                            Approve & Reply
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContact(c.id)}
                          className="text-red-400 hover:text-red-500 p-1 rounded hover:bg-slate-800 inline-flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. HERO SLIDERS MANAGE VIEW */}
        {activeAdminTab === 'banners' && (
          <div className="space-y-8" id="admin-tab-banners">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">Public Portal Cover sheets</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Home Hero sliders</h1>
              </div>

              <button
                onClick={() => { resetBannerForm(); setShowBannerModal(true); }}
                className="bg-amber-50 hover:bg-amber-100 text-slate-900 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow"
              >
                <Plus className="w-4 h-4" /> Add Banner Slide
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {banners.map((b) => (
                <div key={b.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative group">
                  <div className="h-40 bg-slate-900 relative">
                    {b.videoUrl ? (
                      (() => {
                        const url = b.videoUrl;
                        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                        const match = url.match(regExp);
                        const youtubeId = (match && match[2].length === 11) ? match[2] : null;
                        if (youtubeId) {
                          return (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                              <iframe
                                className="absolute inset-0 w-full h-full object-cover scale-125 select-none"
                                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1`}
                                title="Banner Video Preview"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              />
                            </div>
                          );
                        } else {
                          return (
                            <video
                              src={url}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="absolute inset-0 w-full h-full object-cover"
                              poster={b.imageUrl}
                              preload="auto"
                            />
                          );
                        }
                      })()
                    ) : (
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <h3 className="font-extrabold text-white text-base leading-tight">{b.title}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {deletingBannerId === b.id ? (
                          <div className="flex items-center gap-1 bg-red-950/90 border border-red-800/80 px-2 py-1 rounded-lg animate-in zoom-in-95 duration-150">
                            <span className="text-[10px] font-bold text-red-400 mr-1 select-none">Confirm?</span>
                            <button
                              onClick={() => {
                                handleDeleteBanner(b.id);
                                setDeletingBannerId(null);
                              }}
                              className="bg-red-500 hover:bg-red-600 text-slate-950 text-[10px] uppercase px-2 py-0.5 rounded font-extrabold transition-all"
                              title="Yes, delete"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setDeletingBannerId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] uppercase px-1.5 py-0.5 rounded font-bold transition-all"
                              title="Cancel"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditBannerClick(b)}
                              className="text-slate-400 hover:text-amber-400 p-1.5 rounded hover:bg-slate-900 transition-colors"
                              title="Edit slide"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDuplicateBanner(b)}
                              className="text-slate-400 hover:text-blue-400 p-1.5 rounded hover:bg-slate-900 transition-colors"
                              title="Duplicate slide"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingBannerId(b.id)}
                              className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-slate-900 transition-colors"
                              title="Delete slide"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{b.subtitle}</p>
                    <div className="flex justify-between items-center text-[10px] font-mono border-t border-slate-900 pt-3">
                      <span className="text-slate-500">Display Order: {b.displayOrder}</span>
                      <span className={b.active ? 'text-emerald-400 font-bold' : 'text-slate-500'}>{b.active ? 'ACTIVE' : 'INACTIVE'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CREATE/EDIT BANNER MODAL */}
            {showBannerModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden">
                  
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">Home Portal Config</span>
                      <h3 className="font-extrabold text-xl text-white mt-0.5">
                        {bannerEditId ? 'Edit Hero Banner Slide' : 'Add Hero Banner Slide'}
                      </h3>
                    </div>
                    <button 
                      onClick={() => { resetBannerForm(); setShowBannerModal(false); }} 
                      className="text-slate-400 hover:text-white transition-colors bg-slate-800 hover:bg-slate-700 p-2 rounded-xl"
                      type="button"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Form */}
                  <form onSubmit={handleSaveBanner} className="flex-1 overflow-y-auto p-8 space-y-6 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      
                      {/* Left Column: Properties */}
                      <div className="space-y-6">
                        <div className="bg-slate-950/30 border border-slate-800/60 p-5 rounded-xl space-y-4">
                          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                            1. Banner Details
                          </h4>
                          
                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Banner Large Title</label>
                            <input
                              type="text"
                              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2.5 px-3.5 text-white outline-none focus:border-amber-500/50 transition-colors"
                              value={bannerTitle}
                              onChange={(e) => setBannerTitle(e.target.value)}
                              placeholder="e.g. Precision Engineering. Decades of Handover."
                              required
                            />
                            <p className="text-[10px] text-slate-500">Will be featured as the main high-impact bold typography title.</p>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Banner Subtitle / Body</label>
                            <textarea
                              rows={4}
                              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2.5 px-3.5 text-white outline-none focus:border-amber-500/50 transition-colors resize-none"
                              value={bannerSubtitle}
                              onChange={(e) => setBannerSubtitle(e.target.value)}
                              placeholder="e.g. Turn blueprints into sustainable masterpieces across Cameroon..."
                            />
                            <p className="text-[10px] text-slate-500 font-mono text-slate-500/85">Supports supportive, high-fidelity descriptive pitch lines.</p>
                          </div>
                        </div>

                        <div className="bg-slate-950/30 border border-slate-800/60 p-5 rounded-xl space-y-4">
                          <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                            2. Settings & Scheduling
                          </h4>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">Display Order</label>
                              <input
                                type="number"
                                className="w-full bg-slate-950/80 border border-slate-800 rounded-lg py-2.5 px-3.5 text-white outline-none focus:border-amber-500/50 transition-colors font-mono"
                                value={bannerOrder}
                                onChange={(e) => setBannerOrder(e.target.value)}
                              />
                            </div>

                            <div className="space-y-1 flex flex-col justify-center">
                              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-2">Publish Status</label>
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={bannerActive}
                                  onChange={(e) => setBannerActive(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                                <span className="ml-3 text-xs font-bold font-mono text-slate-300">
                                  {bannerActive ? 'ACTIVE' : 'INACTIVE'}
                                </span>
                              </label>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500">Inactive slides are stored securely but hidden from the public portal home slider.</p>
                        </div>
                      </div>

                      {/* Right Column: Visual Media assets */}
                      <div className="space-y-6">
                        
                        {/* Cover Image section */}
                        <div className="bg-slate-950/30 border border-slate-800/60 p-5 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                              3. Cover Image
                            </h4>
                            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setBannerImageMode('url')}
                                className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase transition-all ${bannerImageMode === 'url' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                              >
                                URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setBannerImageMode('upload')}
                                className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase transition-all ${bannerImageMode === 'upload' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                              >
                                Upload File
                              </button>
                            </div>
                          </div>

                          {bannerImageMode === 'url' ? (
                            <input
                              type="url"
                              className="w-full bg-slate-955 border border-slate-800 rounded-lg py-2.5 px-3.5 text-white outline-none focus:border-amber-500/50 transition-colors text-xs font-mono"
                              value={bannerImage}
                              onChange={(e) => setBannerImage(e.target.value)}
                              placeholder="e.g. https://kommodo.ai/i/6ZLVxXDvCisVwiX1fEej"
                              required
                            />
                          ) : (
                            <div className="flex items-center gap-3 bg-slate-950/50 border border-slate-800/50 p-3 rounded-lg">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'bannerImage')}
                                className="hidden"
                                id="banner-image-file-input"
                              />
                              <label
                                htmlFor="banner-image-file-input"
                                className="bg-slate-800 hover:bg-slate-700 text-white cursor-pointer px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all shrink-0 select-none"
                              >
                                <ImageIcon className="w-4 h-4 text-amber-400" />
                                Choose Image
                              </label>
                              <span className="text-xs text-slate-400 truncate max-w-[180px] font-mono">
                                {bannerImage ? bannerImage.substring(bannerImage.lastIndexOf('/') + 1) : 'No file selected'}
                              </span>
                            </div>
                          )}

                          {/* Cover Image Visual Preview Box */}
                          {bannerImage && (
                            <div className="mt-3 space-y-1.5 animate-in fade-in duration-300">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Live Image Preview:</span>
                              <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                                <img 
                                  src={bannerImage} 
                                  alt="Cover Image Preview" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=1200';
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Background Video section */}
                        <div className="bg-slate-950/30 border border-slate-800/60 p-5 rounded-xl space-y-3">
                          <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                            <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                              4. Background Video (Optional)
                            </h4>
                            <div className="flex bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
                              <button
                                type="button"
                                onClick={() => setBannerVideoMode('url')}
                                className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase transition-all ${bannerVideoMode === 'url' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                              >
                                URL
                              </button>
                              <button
                                type="button"
                                onClick={() => setBannerVideoMode('upload')}
                                className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase transition-all ${bannerVideoMode === 'upload' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'}`}
                              >
                                Upload File
                              </button>
                            </div>
                          </div>

                          {bannerVideoMode === 'url' ? (
                            <div className="space-y-3">
                              <input
                                type="url"
                                className="w-full bg-slate-955 border border-slate-800 rounded-lg py-2.5 px-3.5 text-white outline-none focus:border-amber-500/50 transition-colors text-xs font-mono"
                                value={bannerVideoUrl}
                                onChange={(e) => setBannerVideoUrl(e.target.value)}
                                placeholder="YouTube Video URL (e.g. https://youtu.be/EJMGG_f2Ejs)"
                              />
                              
                              {bannerVideoUrl && (() => {
                                const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                                const match = bannerVideoUrl.match(regExp);
                                const youtubeId = (match && match[2].length === 11) ? match[2] : null;
                                if (youtubeId) {
                                  return (
                                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 animate-in fade-in duration-200">
                                      <div className="flex justify-between items-center border-b border-slate-850 pb-2">
                                        <span className="text-[10px] font-mono font-bold text-amber-500 uppercase flex items-center gap-1">
                                          <Video className="w-3.5 h-3.5" /> Verified YouTube Content
                                        </span>
                                        <span className="text-[9px] font-mono text-slate-500">ID: {youtubeId}</span>
                                      </div>
                                      <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden border border-slate-800 shadow-inner">
                                        <iframe
                                          className="w-full h-full object-cover"
                                          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&mute=1&controls=1&playsinline=1`}
                                          title="Admin YouTube Verification Playback"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                          allowFullScreen
                                        />
                                      </div>
                                      <div className="flex justify-end pt-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setBannerImage(`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`);
                                            setBannerImageMode('url');
                                            showToast('Cover image set to YouTube video thumbnail!', 'success');
                                          }}
                                          className="text-amber-400 hover:text-amber-300 font-extrabold text-[10px] uppercase transition-colors flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20"
                                        >
                                          Use Thumbnail as Cover Image
                                        </button>
                                      </div>
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2 animate-in fade-in duration-200">
                                      <span className="text-[10px] font-mono font-bold text-blue-400 uppercase flex items-center gap-1">
                                        <Video className="w-3.5 h-3.5" /> Direct Video Stream Preview
                                      </span>
                                      <video
                                        src={bannerVideoUrl}
                                        controls
                                        muted
                                        className="w-full rounded-lg border border-slate-850 aspect-video object-cover"
                                      />
                                    </div>
                                  );
                                }
                              })()}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 bg-slate-950/50 border border-slate-800/50 p-3 rounded-lg">
                              <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleFileUpload(e, 'bannerVideo')}
                                className="hidden"
                                id="banner-video-file-input"
                              />
                              <label
                                htmlFor="banner-video-file-input"
                                className="bg-slate-800 hover:bg-slate-700 text-white cursor-pointer px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all shrink-0 select-none"
                              >
                                <Video className="w-4 h-4 text-amber-400" />
                                Choose Video
                              </label>
                              <span className="text-xs text-slate-400 truncate max-w-[180px] font-mono">
                                {bannerVideoUrl ? bannerVideoUrl.substring(bannerVideoUrl.lastIndexOf('/') + 1) : 'No file selected'}
                              </span>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Form Action Controls Footer */}
                    <div className="pt-6 flex justify-end gap-3 border-t border-slate-800/80 mt-8">
                      <button
                        type="button"
                        onClick={() => { resetBannerForm(); setShowBannerModal(false); }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 text-slate-950 font-extrabold py-2.5 px-6 rounded-xl text-xs uppercase tracking-wider shadow hover:bg-amber-400 transition-colors"
                      >
                        {bannerEditId ? 'Update Banner Slide' : 'Publish Banner Slide'}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            )}

          </div>
        )}

        {/* 8. COMPANY POLICY DOCUMENTS MANAGER */}
        {activeAdminTab === 'documents' && (
          <div className="space-y-8" id="admin-tab-documents">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">Safety Policy & General Handbooks</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Company Policy Documents</h1>
              </div>

              <button
                onClick={() => { resetDocForm(); setShowDocModal(true); }}
                className="bg-amber-50 hover:bg-amber-100 text-slate-900 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow"
              >
                <Plus className="w-4 h-4" /> Upload Document Registry
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Document Title</th>
                    <th className="p-4">Compliance Type</th>
                    <th className="p-4">System Version</th>
                    <th className="p-4">Direct File URL</th>
                    <th className="p-4 text-right">Registry Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-bold text-white">{doc.title}</td>
                      <td className="p-4 text-slate-300 font-medium">{doc.docType.toUpperCase()}</td>
                      <td className="p-4 font-mono font-bold text-amber-500">V{doc.version}</td>
                      <td className="p-4 font-mono text-slate-500 max-w-xs truncate">{doc.fileUrl}</td>
                      <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleEditDocumentClick(doc)}
                          className="text-slate-400 hover:text-amber-400 p-1.5 rounded hover:bg-slate-800 transition-colors inline-flex items-center"
                          title="Edit Document"
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicateDocument(doc)}
                          className="text-slate-400 hover:text-blue-400 p-1.5 rounded hover:bg-slate-800 transition-colors inline-flex items-center"
                          title="Duplicate Document"
                        >
                          <Copy className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-slate-800 inline-flex items-center"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CREATE DOCUMENT MODAL */}
            {showDocModal && (
              <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl relative p-8 space-y-6">
                  <button onClick={() => { resetDocForm(); setShowDocModal(false); }} className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors">
                    <XCircle className="w-6 h-6" />
                  </button>

                  <h3 className="font-extrabold text-xl text-white border-b border-slate-800 pb-3">
                    {docEditId ? 'Edit Company Policy Document' : 'Upload Company Policy Document'}
                  </h3>

                  <form onSubmit={handleSaveDocument} className="space-y-4 text-sm">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Document Title</label>
                      <input
                        type="text"
                        className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-white outline-none"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="e.g. Health, Safety & Welfare Charter"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Compliance Type</label>
                        <select
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-slate-300 outline-none"
                          value={docType}
                          onChange={(e) => setDocType(e.target.value)}
                        >
                          <option value="general">General Corporate</option>
                          <option value="safety_policy">Safety & Welfare Policy</option>
                          <option value="certification">ISO Certification</option>
                          <option value="tender_spec">Tender Spec templates</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">System Version</label>
                        <input
                          type="text"
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-white outline-none"
                          value={docVersion}
                          onChange={(e) => setDocVersion(e.target.value)}
                          placeholder="e.g. 3.4"
                        />
                      </div>
                    </div>

                    {/* Document File / URL toggle */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Document File</label>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setDocUploadMode('url')}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition-colors ${docUploadMode === 'url' ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 text-slate-400 hover:text-white'}`}
                          >
                            URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setDocUploadMode('upload')}
                            className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase transition-colors ${docUploadMode === 'upload' ? 'bg-amber-500 text-slate-950' : 'bg-slate-850 text-slate-400 hover:text-white'}`}
                          >
                            Upload File
                          </button>
                        </div>
                      </div>

                      {docUploadMode === 'url' ? (
                        <input
                          type="url"
                          className="w-full bg-slate-955 border border-slate-800 rounded py-2 px-3 text-white outline-none"
                          value={docUrl}
                          onChange={(e) => setDocUrl(e.target.value)}
                          placeholder="https://..."
                          required
                        />
                      ) : (
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                            onChange={(e) => handleFileUpload(e, 'docUrl')}
                            className="hidden"
                            id="policy-doc-file-input"
                          />
                          <label
                            htmlFor="policy-doc-file-input"
                            className="bg-slate-800 hover:bg-slate-755 text-white cursor-pointer px-4 py-2 rounded text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all shrink-0"
                          >
                            <FileText className="w-4 h-4 text-amber-400" />
                            Choose Document
                          </label>
                          <span className="text-xs text-slate-400 truncate max-w-[240px]">
                            {docUrl ? docUrl.substring(docUrl.lastIndexOf('/') + 1) : 'No file selected'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => { resetDocForm(); setShowDocModal(false); }}
                        className="bg-slate-800 text-white font-bold py-2 px-4 rounded text-xs uppercase"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-amber-500 text-slate-950 font-bold py-2 px-5 rounded text-xs uppercase shadow hover:bg-amber-400 transition-colors"
                      >
                        {docEditId ? 'Update Document' : 'Upload to Registry'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* 9. PORTFOLIO MEDIA UPDATES GALLERY MANAGER */}
        {activeAdminTab === 'gallery' && (
          <div className="space-y-8" id="admin-tab-gallery">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">Photos & Videos Site Updates</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Portfolio Media Updates</h1>
                <p className="text-xs text-slate-400">Add, edit, or delete live field updates (photos and videos) stored permanently in the Neon database.</p>
              </div>

              <button
                onClick={() => {
                  setGalEditId(null);
                  setGalTitle('');
                  setGalImage('');
                  setGalVideoUrl('');
                  setGalCategory('Structural Handover');
                  setShowGalModal(true);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-1.5 transition-all shadow"
              >
                <Plus className="w-4 h-4" /> Publish New Update
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Media Preview</th>
                    <th className="p-4">Update Title</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Media Type</th>
                    <th className="p-4 text-right">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {galleryItems.length > 0 ? (
                    galleryItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="p-4">
                          <div className="w-16 h-10 rounded overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
                            {item.videoUrl ? (
                              <div className="text-[9px] font-mono text-amber-500 flex items-center gap-0.5">
                                <Video className="w-3.5 h-3.5 shrink-0" />
                                <span>Video</span>
                              </div>
                            ) : (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-white">{item.title}</td>
                        <td className="p-4">
                          <span className="bg-slate-900 border border-slate-800 text-slate-300 font-bold px-2 py-1 rounded text-[10px] uppercase font-mono">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-amber-500">
                          {item.videoUrl ? '150MB SEO Video' : 'Standard Photo'}
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleEditGallery(item)}
                            className="text-amber-500 hover:text-amber-400 p-1.5 rounded hover:bg-slate-800 inline-flex items-center gap-1 font-bold"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteGallery(item.id)}
                            className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-slate-800 inline-flex items-center gap-1 font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No live media updates published yet. Click "Publish New Update" to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* CREATE / EDIT GALLERY ITEM MODAL */}
            {showGalModal && (
              <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl relative my-auto flex flex-col max-h-[92vh] overflow-hidden">
                  
                  {/* MODAL HEADER (Sticky Top) */}
                  <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900/95 flex justify-between items-center shrink-0">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">Portfolio Media Management</span>
                      <h3 className="font-extrabold text-lg sm:text-xl text-white">
                        {galEditId ? 'Edit Portfolio Media Update' : 'Publish Portfolio Media Update'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setShowGalModal(false); resetGalForm(); }}
                      className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* MODAL BODY (Scrollable Form Area) */}
                  <form id="portfolio-media-form" onSubmit={handleSaveGallery} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-sm">
                    {/* TITLE */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1.5">
                        Update Title <span className="text-amber-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-600 outline-none transition-all font-medium text-sm"
                        value={galTitle}
                        onChange={(e) => setGalTitle(e.target.value)}
                        placeholder="e.g. Geometrical stair construction & reinforcement"
                        required
                      />
                    </div>

                    {/* CATEGORY & PRESETS */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                        Category
                      </label>

                      {/* Quick Category Chips */}
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                          'Concrete Reinforcement',
                          'Structural Handover',
                          'Excavation Works',
                          'Masonry Handovers',
                          'Finishing Details',
                          'Interior Engineering'
                        ].map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setGalCategory(cat)}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-md border transition-all cursor-pointer ${
                              galCategory === cat
                                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <input
                        type="text"
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white placeholder-slate-600 outline-none transition-all text-xs font-mono"
                        value={galCategory}
                        onChange={(e) => setGalCategory(e.target.value)}
                        placeholder="Select preset above or type custom category name..."
                      />
                    </div>

                    {/* IMAGE / COVER POSTER */}
                    <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                          Image Poster / Cover
                        </label>
                        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setGalImageMode('url')}
                            className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer ${
                              galImageMode === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Web URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setGalImageMode('upload')}
                            className={`text-[10px] px-2.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer ${
                              galImageMode === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Upload File
                          </button>
                        </div>
                      </div>

                      {galImageMode === 'url' ? (
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white text-xs outline-none font-mono"
                          value={galImage}
                          onChange={(e) => setGalImage(e.target.value)}
                          placeholder="https://kommodo.ai/i/... or web image link"
                        />
                      ) : (
                        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2">
                          <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2 rounded-lg cursor-pointer font-bold border border-slate-700 whitespace-nowrap shrink-0 transition-all">
                            Browse Image
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'galImage')} 
                              disabled={uploadingFile}
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            {galImage ? (
                              <span className="text-[10px] text-emerald-400 font-mono truncate block" title={galImage}>
                                ✓ Loaded: {galImage.split('/').pop()}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 block">No file chosen</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SEO VIDEO / YOUTUBE (OPTIONAL) */}
                    <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                          SEO Video / YouTube <span className="text-slate-500 font-normal">(Optional)</span>
                        </label>
                        <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                          <button
                            type="button"
                            onClick={() => setGalVideoMode('url')}
                            className={`text-[9px] px-2.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer ${
                              galVideoMode === 'url' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Video URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setGalVideoMode('upload')}
                            className={`text-[9px] px-2.5 py-0.5 rounded font-bold uppercase transition-all cursor-pointer ${
                              galVideoMode === 'upload' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            Upload MP4
                          </button>
                        </div>
                      </div>

                      {galVideoMode === 'url' ? (
                        <input
                          type="text"
                          className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3.5 text-white text-xs outline-none font-mono"
                          value={galVideoUrl}
                          onChange={(e) => setGalVideoUrl(e.target.value)}
                          placeholder="e.g. https://youtu.be/NmFQa4X0BTg or direct MP4 URL"
                        />
                      ) : (
                        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl p-2">
                          <label className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs px-3.5 py-2 rounded-lg border border-amber-500/30 cursor-pointer font-bold whitespace-nowrap shrink-0 transition-all">
                            Browse Video
                            <input 
                              type="file" 
                              accept="video/*" 
                              className="hidden" 
                              onChange={(e) => handleFileUpload(e, 'galVideo')} 
                              disabled={uploadingFile}
                            />
                          </label>
                          <div className="flex-1 min-w-0">
                            {galVideoUrl ? (
                              <span className="text-[10px] text-amber-400 font-mono truncate block" title={galVideoUrl}>
                                ✓ Loaded: {galVideoUrl.split('/').pop()}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 block">No video file chosen (Max 150MB)</span>
                            )}
                          </div>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500">Supports direct upload of raw MP4/MOV recordings from construction sites up to 150MB or YouTube streams.</p>
                    </div>

                    {/* LIVE MEDIA PREVIEW CARD */}
                    {(galImage || galVideoUrl) && (
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <span className="block text-[10px] text-amber-500 font-mono font-bold uppercase">Live Media Asset Preview</span>
                        <div className="h-44 relative rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-850">
                          {galVideoUrl && getYouTubeEmbedUrl(galVideoUrl) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(galVideoUrl)!}
                              title="YouTube Preview"
                              className="w-full h-full border-0"
                            />
                          ) : galVideoUrl ? (
                            <video src={ensureAbsoluteUrl(galVideoUrl)} poster={getOptimizedImageUrl(galImage)} controls className="w-full h-full object-contain" />
                          ) : (
                            <img src={getOptimizedImageUrl(galImage)} alt="Preview" className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                    )}

                    {uploadingFile && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center gap-2 animate-pulse">
                        <span className="w-4 h-4 border-2 border-t-amber-500 rounded-full animate-spin shrink-0" />
                        <span className="text-xs font-mono text-amber-400">{uploadProgress}</span>
                      </div>
                    )}
                  </form>

                  {/* MODAL FOOTER (Sticky Bottom - Always Visible & Reachable) */}
                  <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between shrink-0 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowGalModal(false);
                        resetGalForm();
                      }}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-5 rounded-xl text-xs uppercase transition-all cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      form="portfolio-media-form"
                      disabled={uploadingFile || isSavingGallery}
                      className="bg-amber-500 hover:bg-amber-400 disabled:opacity-55 text-slate-950 font-black py-2.5 px-6 rounded-xl text-xs uppercase shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                    >
                      {isSavingGallery ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Saving Edits...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>{galEditId ? 'Save Changes' : 'Publish Update'}</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* 10. DATABASE AUDIT LOGS VIEWER */}
        {activeAdminTab === 'audit' && (
          <div className="space-y-8" id="admin-tab-audit">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">Traceability Security Logs</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Database Audit Logs</h1>
                <p className="text-xs text-slate-400">Chronological list of all modification operations made inside the administrative panel.</p>
              </div>

              {/* Live search box */}
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Filter logs by keyword..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-slate-300 outline-none focus:border-amber-500"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Timestamp Log</th>
                    <th className="p-4">Action Flag</th>
                    <th className="p-4">Operator Email</th>
                    <th className="p-4">Detailed Modification Metrics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filterAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="p-4 font-mono text-slate-400">{formatDateTime(log.timestamp)}</td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded border border-amber-500/10 text-[10px] uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-white">{log.userEmail || 'system'}</td>
                      <td className="p-4 text-slate-300 font-sans">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 11. TEAM MANAGEMENT VIEW */}
        {activeAdminTab === 'team' && (
          <div className="space-y-8 animate-in fade-in duration-500" id="admin-tab-team">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <span className="text-amber-500 text-xs font-mono font-bold uppercase">Human Resources Portal</span>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Team Management</h1>
                <p className="text-xs text-slate-400">CRUD team member profiles, including their roles and engineering specializations.</p>
              </div>

              <button
                onClick={() => {
                  setTeamEditId(null);
                  setTeamName('');
                  setTeamRole('');
                  setTeamSpecialization('');
                  setTeamImage('');
                  setTeamEmail('');
                  setTeamImageMode('url');
                  setShowTeamModal(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Team Member
              </button>
            </div>

            {/* Team Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembersList.length === 0 ? (
                <div className="col-span-full bg-slate-950/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <UserIcon className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="font-bold text-slate-400">No team members registered yet</p>
                  <p className="text-xs mt-1">Click "Add Team Member" above to register the first specialist profile.</p>
                </div>
              ) : (
                teamMembersList.map((member) => (
                  <div key={member.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg">
                    <div className="p-5 space-y-4">
                      {/* Avatar & Info Header */}
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={member.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80'}
                            alt={member.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              console.error(`[ADMIN_IMAGE_ERROR] Failed image for member ${member.id} (${member.name}):`, member.image);
                              e.currentTarget.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-bold text-white text-base truncate">{member.name}</h3>
                          <p className="text-amber-500 text-xs font-semibold">{member.role}</p>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {member.id}</p>
                        </div>
                      </div>

                      {/* Specialization & Contact */}
                      <div className="pt-3 border-t border-slate-900 space-y-2 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Engineering Specialization</span>
                          <span className="text-slate-300 font-semibold">{member.specialization}</span>
                        </div>
                        {member.email && (
                          <div>
                            <span className="text-slate-500 block text-[10px] uppercase font-bold tracking-wider">Contact Email</span>
                            <span className="text-slate-400 font-mono select-all truncate block">{member.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Panel */}
                    <div className="bg-slate-900/40 border-t border-slate-800/60 p-4 flex gap-2 justify-end">
                      <button
                        onClick={() => handleEditTeamMemberClick(member)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTeamMember(member.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TEAM MEMBER MODAL */}
            {showTeamModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                      <h2 className="text-lg font-bold text-white">{teamEditId ? 'Edit Team Specialist' : 'Register Team Specialist'}</h2>
                      <p className="text-xs text-slate-400 mt-0.5">Define role, details, and engineering specialization credentials.</p>
                    </div>
                    <button
                      onClick={() => setShowTeamModal(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Form Container */}
                  <form onSubmit={handleSaveTeamMember} className="p-6 space-y-4 overflow-y-auto flex-1 font-sans">
                    {/* Basic Info */}
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-semibold">Specialist Full Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dr. Marcel Mbida"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-semibold">Official Role / Title</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lead Hydrological Engineer"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500"
                          value={teamRole}
                          onChange={(e) => setTeamRole(e.target.value)}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-semibold">Contact Email</label>
                        <input
                          type="email"
                          placeholder="e.g. m.mbida@madecc.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500"
                          value={teamEmail}
                          onChange={(e) => setTeamEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-bold uppercase tracking-wider block font-semibold">Engineering Specialization</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Soil Mechanics, Seismology & 3D BIM Modelling"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500"
                        value={teamSpecialization}
                        onChange={(e) => setTeamSpecialization(e.target.value)}
                      />
                    </div>

                    {/* Image Selector / Upload */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/60">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-slate-400 font-bold uppercase tracking-wider font-semibold">Profile Photo URL or Upload</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setTeamImageMode('url')}
                            className={`py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer ${teamImageMode === 'url' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400'}`}
                          >
                            Web URL
                          </button>
                          <button
                            type="button"
                            onClick={() => setTeamImageMode('upload')}
                            className={`py-1 px-2.5 rounded text-[10px] font-bold cursor-pointer ${teamImageMode === 'upload' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'text-slate-400'}`}
                          >
                            Upload File
                          </button>
                        </div>
                      </div>

                      {teamImageMode === 'url' ? (
                        <input
                          type="text"
                          placeholder="https://images.unsplash.com/photo-xxxx..."
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-xs text-white outline-none focus:border-amber-500 font-mono"
                          value={teamImage}
                          onChange={(e) => setTeamImage(e.target.value)}
                        />
                      ) : (
                        <div className="border border-dashed border-slate-800 rounded-xl p-4 text-center bg-slate-950 relative hover:border-slate-750 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'teamImage')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="space-y-1">
                            <ImageIcon className="w-8 h-8 mx-auto text-slate-600" />
                            <p className="text-xs text-slate-400 font-bold">Drag and drop file, or click to upload</p>
                            <p className="text-[10px] text-slate-500">Supports JPG, PNG, GIF up to 150MB</p>
                          </div>
                        </div>
                      )}

                      {teamImage && (
                        <div className="flex items-center gap-3 p-2 bg-slate-950 border border-slate-800 rounded-xl">
                          <img
                            src={teamImage}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded-lg border border-slate-800"
                            referrerPolicy="no-referrer"
                          />
                          <span className="text-[10px] font-mono text-slate-400 truncate flex-1">{teamImage}</span>
                        </div>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowTeamModal(false)}
                        className="bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={uploadingFile}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                      >
                        {teamEditId ? 'Save Changes' : 'Register Specialist'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {activeAdminTab === 'doc-history' && (() => {
          const allHistoryItems = [
            ...signedContracts.map(c => ({
              id: c.id,
              type: 'contract' as const,
              refNo: c.contractNo,
              clientName: c.clientName,
              project: c.contractProject,
              value: parseFloat(c.contractValue || '0'),
              verificationToken: c.verificationToken,
              signedAt: c.signedAt || c.contractDate || '',
              isSigned: !!c.drawnClientSignature || !!c.typedClientSignature
            })),
            ...signedReceipts.map(r => ({
              id: r.id,
              type: 'receipt' as const,
              refNo: r.receiptNo,
              clientName: r.clientName,
              project: r.receiptProject,
              value: parseFloat(r.receiptAmount || '0') * (1 + parseFloat(r.receiptTaxRate || '19.25') / 100),
              verificationToken: r.verificationToken,
              signedAt: r.signedAt || '',
              isSigned: true // Receipts are stamped on generation
            }))
          ].sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime());

          const filteredHistoryItems = allHistoryItems.filter(item => {
            const matchesType = docHistoryType === 'all' || 
              (docHistoryType === 'contracts' && item.type === 'contract') || 
              (docHistoryType === 'receipts' && item.type === 'receipt');
            const term = docHistorySearch.toLowerCase().trim();
            const matchesSearch = !term || 
              item.refNo.toLowerCase().includes(term) ||
              item.clientName.toLowerCase().includes(term) ||
              item.project.toLowerCase().includes(term) ||
              item.verificationToken.toLowerCase().includes(term);
            return matchesType && matchesSearch;
          });

          // Metrics calculations
          const totalGenerated = allHistoryItems.length;
          const contractsCount = signedContracts.length;
          const receiptsCount = signedReceipts.length;
          const signedContractsCount = signedContracts.filter(c => !!c.drawnClientSignature || !!c.typedClientSignature).length;
          const authenticityRate = totalGenerated > 0 
            ? Math.round(((signedContractsCount + receiptsCount) / totalGenerated) * 100) 
            : 100;

          const totalFinancialFlow = signedReceipts.reduce((sum, r) => {
            const amt = parseFloat(r.receiptAmount || '0');
            const tax = parseFloat(r.receiptTaxRate || '19.25');
            return sum + amt * (1 + tax / 100);
          }, 0);

          return (
            <div className="space-y-8 animate-in fade-in duration-500">
              {/* Header block */}
              <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-amber-500 text-xs font-mono font-bold uppercase tracking-wider block">Unified Verification Ledger</span>
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">Receipt and Contract History</h1>
                  <p className="text-xs text-slate-400">Secure real-time audit ledger of all certified financial receipts and signed commercial contracts.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      fetchAdminData();
                      showToast('Database ledger synchronized successfully.', 'success');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition-all shadow border border-slate-700"
                  >
                    Refresh Ledger
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Secured Documents</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{totalGenerated}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Docs Registered</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Contracts Pipeline</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{contractsCount}</span>
                    <span className="text-[10px] text-emerald-400 font-bold">{signedContractsCount} Signed</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${contractsCount > 0 ? (signedContractsCount / contractsCount) * 100 : 0}%` }} 
                    />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Certified Receipts Flow</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{receiptsCount}</span>
                    <span className="text-[9.5px] text-amber-500 font-mono font-bold">{Math.round(totalFinancialFlow).toLocaleString()} XAF</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold tracking-wider block">Ledger Authenticity</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">{authenticityRate}%</span>
                    <span className="text-[10px] text-emerald-400 font-bold">100% Cryptographic</span>
                  </div>
                  <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${authenticityRate}%` }} />
                  </div>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-950 border border-slate-850 p-4 rounded-xl">
                {/* Switchers */}
                <div className="flex gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg max-w-max">
                  {(['all', 'contracts', 'receipts'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setDocHistoryType(t)}
                      className={`text-[10px] px-3 py-1.5 rounded-md font-bold uppercase tracking-wider transition-all ${
                        docHistoryType === t 
                          ? 'bg-amber-500 text-slate-950 shadow-sm' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {t === 'all' ? 'All Ledger Items' : t === 'contracts' ? 'Contracts Only' : 'Receipts Only'}
                    </button>
                  ))}
                </div>

                {/* Search Box */}
                <div className="flex-1 md:max-w-md">
                  <input
                    type="text"
                    value={docHistorySearch}
                    onChange={(e) => setDocHistorySearch(e.target.value)}
                    placeholder="Search ledger by client, project, ref code, secure token..."
                    className="w-full bg-slate-900 border border-slate-850 text-white rounded-xl py-2 px-4 text-xs outline-none focus:border-amber-500 font-medium"
                  />
                </div>
              </div>

              {/* Ledger Table Container */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="p-4 w-20 text-center">Type</th>
                      <th className="p-4 w-28">Ref No</th>
                      <th className="p-4 w-48">Client Details</th>
                      <th className="p-4">Target Project</th>
                      <th className="p-4 w-36">Total Value</th>
                      <th className="p-4 w-52">Verification Token</th>
                      <th className="p-4 text-right w-48">Operations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredHistoryItems.length > 0 ? (
                      filteredHistoryItems.map((item) => {
                        const isContract = item.type === 'contract';
                        const TypeIcon = isContract ? Scale : Receipt;
                        return (
                          <tr key={`${item.type}-${item.id}`} className="hover:bg-slate-900/30 transition-colors">
                            {/* Type */}
                            <td className="p-4 text-center">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto border ${
                                isContract 
                                  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
                                  : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                              }`} title={isContract ? 'Infrastructure Contract' : 'Certified Payment Receipt'}>
                                <TypeIcon className="w-4 h-4" />
                              </div>
                            </td>

                            {/* Ref Number */}
                            <td className="p-4 font-mono font-black text-white whitespace-nowrap">
                              {item.refNo}
                            </td>

                            {/* Client Name */}
                            <td className="p-4">
                              <span className="font-bold text-white block text-sm">{item.clientName}</span>
                              <span className="block text-[10px] text-slate-500 font-mono mt-0.5">Signed: {new Date(item.signedAt).toLocaleDateString()}</span>
                            </td>

                            {/* Project Name */}
                            <td className="p-4 text-slate-300 font-sans font-medium line-clamp-2 max-w-xs mt-2.5">
                              {item.project || 'MADECC Enterprise Project'}
                            </td>

                            {/* Value XAF */}
                            <td className="p-4 font-mono font-bold text-white whitespace-nowrap">
                              {Math.round(item.value).toLocaleString()} XAF
                            </td>

                            {/* Verification Token with copy */}
                            <td className="p-4">
                              <div className="flex items-center gap-1.5 max-w-[190px]">
                                <span className={`font-mono text-[9.5px] font-bold px-2 py-1 rounded border overflow-hidden truncate select-all flex-1 ${
                                  item.isSigned 
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                                    : 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                                }`}>
                                  {item.verificationToken}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.verificationToken);
                                    showToast('Verification token copied to clipboard!', 'success');
                                  }}
                                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                                  title="Copy token"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>

                            {/* Operations */}
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => {
                                  setVerificationToken?.(item.verificationToken);
                                  setCurrentTab('verify');
                                }}
                                className="text-emerald-400 hover:text-emerald-300 p-1.5 rounded hover:bg-slate-800 inline-flex items-center gap-1 font-bold"
                                title="Open Live Verification screen"
                              >
                                <Eye className="w-4 h-4" /> Verify
                              </button>
                              <button
                                onClick={() => handleRegenerateToken(item.id, item.type)}
                                className="text-amber-500 hover:text-amber-400 p-1.5 rounded hover:bg-slate-800 inline-flex items-center gap-1 font-bold"
                                title="Re-generate secure QR & BAR code tokens"
                              >
                                <History className="w-4 h-4" /> Re-gen
                              </button>
                              <button
                                onClick={() => handleDeleteDocFromHistory(item.id, item.type)}
                                className="text-red-400 hover:text-red-500 p-1.5 rounded hover:bg-slate-800 inline-flex items-center gap-1 font-bold"
                                title="Permanently delete from database ledger"
                              >
                                <Trash2 className="w-4 h-4" /> Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-slate-500 font-sans text-xs">
                          No secure documents found matching your search and filter settings.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {activeAdminTab === 'legal-contracts' && (
          <DocumentStudio
            projects={projects}
            appointments={appointments}
            contacts={contacts}
            reviews={reviews}
            showToast={showToast}
            mode="contracts"
            setCurrentTab={setCurrentTab}
            setVerificationToken={setVerificationToken}
          />
        )}

        {activeAdminTab === 'receipts' && (
          <DocumentStudio
            projects={projects}
            appointments={appointments}
            contacts={contacts}
            reviews={reviews}
            showToast={showToast}
            mode="receipts"
            setCurrentTab={setCurrentTab}
            setVerificationToken={setVerificationToken}
          />
        )}

        {activeAdminTab === 'cv-generator' && (
          <CareerStudio
            mode="cv"
            showToast={showToast}
          />
        )}

        {activeAdminTab === 'letter-generator' && (
          <CareerStudio
            mode="letter"
            showToast={showToast}
          />
        )}

        {activeAdminTab === 'proposal-studio' && (
          <ProposalStudio
            showToast={showToast}
            setActiveAdminTab={setActiveAdminTab}
          />
        )}

        {activeAdminTab === 'lesson-studio' && (
          <LessonStudio
            showToast={showToast}
            activeSyllabus={activeSyllabus}
            setActiveSyllabus={setActiveSyllabus}
          />
        )}

        {activeAdminTab === 'syllabus-upload' && (
          <SyllabusUpload
            showToast={showToast}
            setActiveAdminTab={setActiveAdminTab}
            setActiveSyllabus={setActiveSyllabus}
          />
        )}

        {activeAdminTab === 'extended-lesson-architect' && (
          <ExtendedLessonArchitect
            showToast={showToast}
          />
        )}

        {activeAdminTab === 'enterprise-erp' && (
          <EnterpriseErpHub
            userRole={dbUser.role}
          />
        )}

        {activeAdminTab === 'boq-studio' && (
          <BoqStudio
            showToast={showToast}
            currentUser={dbUser}
          />
        )}

        {activeAdminTab === 'structural-calculator' && (
          <StructuralCalculator
            showToast={showToast}
            currentUser={dbUser}
          />
        )}

        {activeAdminTab === 'labour-calculator' && (
          <LabourCalculator
            userRole={dbUser?.role || 'admin'}
            userName={dbUser?.name || 'Engineer'}
          />
        )}

        {activeAdminTab === 'drawing-studio' && (
          <DrawingTakeoffStudio
            showToast={showToast}
            currentUser={dbUser}
            onNavigateToLabour={() => setActiveAdminTab('labour-calculator' as any)}
          />
        )}

        {activeAdminTab === 'ai-construction-intelligence' && (
          <AIConstructionIntelligence
            dbUser={dbUser}
            showToast={showToast}
            getAuthHeaders={async () => {
              const token = await getAuthToken();
              return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
            }}
          />
        )}

        {activeAdminTab === 'social-studio' && (
          <SocialMediaStudio
            currentUser={dbUser}
          />
        )}

        {activeAdminTab === 'db-architecture' && (
          <div className="space-y-8 animate-in fade-in duration-500" id="admin-tab-db-architecture">
            {/* Header */}
            <div className="border-b border-slate-800 pb-4">
              <span className="text-amber-500 text-xs font-mono font-bold uppercase">System Architecture Portal</span>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Database & API Documentation</h1>
              <p className="text-xs text-slate-400">Current active schemas, relationships, and REST API specification for the Neon PostgreSQL backend.</p>
            </div>

            {/* Quick stats / Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-amber-500 mb-2">
                  <Database className="w-5 h-5" />
                  <span className="text-sm font-bold text-white font-sans">Database Provider</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Neon Serverless PostgreSQL (AWS cloud platform)</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-amber-500 mb-2">
                  <Code className="w-5 h-5" />
                  <span className="text-sm font-bold text-white font-sans">ORM Framework</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Drizzle ORM v0.30+ with PostgreSQL dialect</p>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center gap-3 text-amber-500 mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-sm font-bold text-white font-sans">Authentication Mode</span>
                </div>
                <p className="text-xs text-slate-400 font-mono">Firebase JWT verification (Bearer tokens)</p>
              </div>
            </div>

            {/* Table Schemas Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Database className="text-amber-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-white">Relational Database Schemas</h2>
              </div>

              {/* Grid of Schemas */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* Users Table Schema */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-black">users</span>
                    <span className="text-[10px] text-slate-500 font-mono">Primary Authenticated Accounts</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1.5 font-bold">Column</th>
                          <th className="pb-1.5 font-bold">Type</th>
                          <th className="pb-1.5 font-bold">Modifiers / Keys</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <tr>
                          <td className="py-1.5 text-white">id</td>
                          <td className="py-1.5">serial</td>
                          <td className="py-1.5 text-amber-400">PRIMARY KEY</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">uid</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5 text-amber-500">UNIQUE (Firebase UID)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">email</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5 text-amber-500">UNIQUE, NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">name</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5">NULLABLE</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">role</td>
                          <td className="py-1.5">varchar(50)</td>
                          <td className="py-1.5">DEFAULT 'client' (admin|staff|client)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">created_at</td>
                          <td className="py-1.5">timestamp</td>
                          <td className="py-1.5">DEFAULT now()</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Projects Table Schema */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-black">projects</span>
                    <span className="text-[10px] text-slate-500 font-mono">Infrastructure Civil Works</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1.5 font-bold">Column</th>
                          <th className="pb-1.5 font-bold">Type</th>
                          <th className="pb-1.5 font-bold">Modifiers / Keys</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <tr>
                          <td className="py-1.5 text-white">id</td>
                          <td className="py-1.5">serial</td>
                          <td className="py-1.5 text-amber-400">PRIMARY KEY</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">title</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">description</td>
                          <td className="py-1.5">text</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">budget</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">status</td>
                          <td className="py-1.5">varchar(50)</td>
                          <td className="py-1.5">DEFAULT 'planning'</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">owner_id</td>
                          <td className="py-1.5">integer</td>
                          <td className="py-1.5 text-sky-400">REFERENCES users(id)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">created_at</td>
                          <td className="py-1.5">timestamp</td>
                          <td className="py-1.5">DEFAULT now()</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Appointments Schema */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-black">appointments</span>
                    <span className="text-[10px] text-slate-500 font-mono">Technical Consultations</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1.5 font-bold">Column</th>
                          <th className="pb-1.5 font-bold">Type</th>
                          <th className="pb-1.5 font-bold">Modifiers / Keys</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <tr>
                          <td className="py-1.5 text-white">id</td>
                          <td className="py-1.5">serial</td>
                          <td className="py-1.5 text-amber-400">PRIMARY KEY</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">client_name</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">email</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">date</td>
                          <td className="py-1.5">varchar(100)</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">time_slot</td>
                          <td className="py-1.5">varchar(100)</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">notes</td>
                          <td className="py-1.5">text</td>
                          <td className="py-1.5">NULLABLE</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">status</td>
                          <td className="py-1.5">varchar(50)</td>
                          <td className="py-1.5">DEFAULT 'pending'</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">created_at</td>
                          <td className="py-1.5">timestamp</td>
                          <td className="py-1.5">DEFAULT now()</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Audit Logs Table Schema */}
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded font-black">audit_logs</span>
                    <span className="text-[10px] text-slate-500 font-mono">System Security Tracking</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-[11px] text-slate-400">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="pb-1.5 font-bold">Column</th>
                          <th className="pb-1.5 font-bold">Type</th>
                          <th className="pb-1.5 font-bold">Modifiers / Keys</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900">
                        <tr>
                          <td className="py-1.5 text-white">id</td>
                          <td className="py-1.5">serial</td>
                          <td className="py-1.5 text-amber-400">PRIMARY KEY</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">action</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5">NOT NULL</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">user_id</td>
                          <td className="py-1.5">integer</td>
                          <td className="py-1.5 text-sky-400">REFERENCES users(id)</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">user_email</td>
                          <td className="py-1.5">varchar(255)</td>
                          <td className="py-1.5">NULLABLE</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">details</td>
                          <td className="py-1.5">text</td>
                          <td className="py-1.5">NULLABLE</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-white">created_at</td>
                          <td className="py-1.5">timestamp</td>
                          <td className="py-1.5">DEFAULT now()</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>

            {/* REST API Endpoints Documentation */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <Code className="text-amber-500 w-5 h-5" />
                <h2 className="text-lg font-bold text-white">REST API Endpoint Specification</h2>
              </div>

              <div className="space-y-4">
                
                {/* GET /api/analytics */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">GET</span>
                    <span className="font-mono text-sm text-white font-bold">/api/analytics</span>
                    <span className="text-xs text-slate-500">Retrieves real-time aggregated system-wide and financial metrics.</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">HTTP Request Headers:</span>
                    <pre className="bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-xs border border-slate-900">
{`Authorization: Bearer <firebase_id_token>`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">Response payload (JSON):</span>
                    <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-xs border border-slate-900 overflow-x-auto">
{`{
  "managedContractsCount": 24,
  "totalContractValue": 12450000,
  "totalRevenue": 4820000,
  "pendingConsultations": 3,
  "unreadInquiries": 5,
  "pendingReviews": 2,
  "newsletterSubscribers": 142,
  "activeUsers": 12,
  "uploadedDocuments": 8,
  "bookingApprovalRate": "82.5"
}`}
                    </pre>
                  </div>
                </div>

                {/* GET /api/audit-logs */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">GET</span>
                    <span className="font-mono text-sm text-white font-bold">/api/audit-logs</span>
                    <span className="text-xs text-slate-500">Retrieves raw audit-trail logging events representing operations.</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">HTTP Request Headers:</span>
                    <pre className="bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-xs border border-slate-900">
{`Authorization: Bearer <firebase_id_token>`}
                    </pre>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">Response array (JSON):</span>
                    <pre className="bg-slate-950 text-emerald-400 p-3 rounded-xl font-mono text-xs border border-slate-900 overflow-x-auto">
{`[
  {
    "id": 48,
    "action": "PROJECT_STATUS_UPDATE",
    "userEmail": "engineering@madecc.com",
    "details": "Updated status of contract REF-CIV-928 to 'construction' with total value 450,000 USD.",
    "createdAt": "2026-07-11T03:32:30.000Z"
  }
]`}
                    </pre>
                  </div>
                </div>

                {/* GET /api/projects */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">GET</span>
                    <span className="text-[11px] font-black font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">POST</span>
                    <span className="font-mono text-sm text-white font-bold">/api/projects</span>
                    <span className="text-xs text-slate-500">Create, view, and query engineering project records.</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">POST payload (JSON):</span>
                    <pre className="bg-slate-950 text-slate-300 p-3 rounded-xl font-mono text-xs border border-slate-900 overflow-x-auto">
{`{
  "title": "A-9 Interstate Overpass Refurbishment",
  "description": "Concrete reinforcement of structural arches and highway barriers.",
  "budget": "850000"
}`}
                    </pre>
                  </div>
                </div>

                {/* Social Accounts OAuth API Docs */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded">OAuth 2.0</span>
                    <span className="font-mono text-sm text-white font-bold">/api/social/oauth/:provider/start & /callback</span>
                    <span className="text-xs text-slate-500">Initiates OAuth flow & persists encrypted token credentials into social_media_channels table.</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 block">Database Table Schema (social_media_channels):</span>
                    <pre className="bg-slate-950 text-amber-400 p-3 rounded-xl font-mono text-xs border border-slate-900 overflow-x-auto">
{`TABLE social_media_channels (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- linkedin, facebook, instagram, twitter, youtube
  account_name VARCHAR(150),
  access_token TEXT NOT NULL, -- AES-256-GCM Encrypted
  refresh_token TEXT, -- AES-256-GCM Encrypted
  status VARCHAR(20) DEFAULT 'connected',
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  token_expires_at TIMESTAMP
);`}
                    </pre>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* CAD TAKE-OFF QUANTITY STUDIO VIEW */}
        {activeAdminTab === 'drawing-studio' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-amber-950/20 border border-slate-800 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                Engineering Quantity Surveying
              </span>
              <h1 className="text-3xl font-extrabold text-white mt-2 flex items-center gap-3">
                <Layers className="w-8 h-8 text-amber-500" /> Quantity Take-Off & CAD Studio
              </h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Upload architectural DWG, DXF, or PDF blueprints for automated linear, area, and volumetric material take-off integration with BOQ Studio.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <FolderKanban className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Upload Architectural Drawing / Structural PDF</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select a CAD or PDF blueprint to perform digital scale calibration and auto-calculate concrete volume, rebar tonnage, and wall masonry quantities.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button 
                  onClick={() => setActiveAdminTab('boq-studio')}
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-black text-xs rounded-xl shadow hover:bg-amber-400 transition-colors"
                >
                  Go to BOQ Studio
                </button>
                <button 
                  onClick={() => setActiveAdminTab('ai-construction-intelligence')}
                  className="px-5 py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors"
                >
                  Run AI Blueprint Vision Take-Off
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DEVELOPER API PLATFORM MONETIZATION & APPROVAL VIEW */}
        {activeAdminTab === 'api-platform' && (
          <div className="animate-in fade-in duration-300">
            <AdminApiPlatform onBackToDashboard={() => setActiveAdminTab('command-center')} />
          </div>
        )}
        </>
      )}

      </main>
      </div>

      {/* ==========================================
          COMMAND PALETTE OVERLAY (⌘K)
          ========================================== */}
      {showCommandPalette && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            
            {/* Search Input Bar */}
            <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/50">
              <Search className="w-5 h-5 text-amber-500 shrink-0" />
              <input
                type="text"
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Type a command, module, BOQ tool, or project..."
                className="w-full bg-transparent text-white font-medium text-sm focus:outline-none placeholder:text-slate-500"
                autoFocus
              />
              <button
                onClick={() => setShowCommandPalette(false)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results Navigation List */}
            <div className="p-3 overflow-y-auto space-y-4">
              {(dbUser?.role === 'social_media_reviewer'
                ? ADMIN_NAV_GROUPS.filter(g => g.id === 'marketing-group')
                : ADMIN_NAV_GROUPS
              ).map((group) => {
                const filteredItems = group.items.filter(item => 
                  item.label.toLowerCase().includes(commandSearch.toLowerCase()) ||
                  group.title.toLowerCase().includes(commandSearch.toLowerCase())
                );

                if (filteredItems.length === 0) return null;

                return (
                  <div key={`cmd-${group.id}`} className="space-y-1">
                    <span className="text-[10px] font-mono font-bold text-amber-500 px-3 uppercase tracking-wider block">
                      {group.title}
                    </span>
                    {filteredItems.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={`cmd-item-${item.id}`}
                          onClick={() => {
                            setActiveAdminTab(item.id as any);
                            setShowCommandPalette(false);
                            setCommandSearch('');
                          }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors text-left group"
                        >
                          <span className="flex items-center gap-2.5">
                            <ItemIcon className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                            <span>{item.label}</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-500">Jump To →</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2.5 border-t border-slate-900 bg-slate-950 flex justify-between items-center text-[10px] text-slate-500 font-mono">
              <span>Use ↑↓ to navigate • ↵ to select</span>
              <span>ESC to exit command palette</span>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          QUICK ACTION MODAL OVERLAY
          ========================================== */}
      {showQuickActionModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-wider">EXECUTIVE SHORTCUTS</span>
                <h3 className="text-lg font-extrabold text-white mt-0.5">Quick Actions Launcher</h3>
              </div>
              <button
                onClick={() => setShowQuickActionModal(false)}
                className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Frontend Page Studio', desc: 'Edit Hero video, CTAs, SEO & Sections', tab: 'cms-pages', icon: Globe, color: 'text-amber-400' },
                { title: 'Media & Video Assets', desc: 'Upload HD clips, posters & brochures', tab: 'cms-media', icon: Video, color: 'text-sky-400' },
                { title: 'Global Site Branding', desc: 'Phones, addresses & social links', tab: 'cms-settings', icon: Settings, color: 'text-emerald-400' },
                { title: 'New BOQ Calculation', desc: 'Open Quantity Surveying Studio', tab: 'boq-studio', icon: FileSpreadsheet, color: 'text-amber-400' },
                { title: 'Publish Social Post', desc: 'OAuth 2.0 Multi-channel publisher', tab: 'social-studio', icon: Megaphone, color: 'text-pink-400' },
                { title: 'Add Project Record', desc: 'Manage civil engineering projects', tab: 'projects', icon: Building2, color: 'text-sky-400' },
                { title: 'Generate Contract', desc: 'Legal agreements & contracts', tab: 'legal-contracts', icon: Scale, color: 'text-indigo-400' },
                { title: 'Create Proposal', desc: 'Client proposal builder', tab: 'proposal-studio', icon: FileText, color: 'text-purple-400' },
                { title: 'Generate Receipt', desc: 'Official payment receipt builder', tab: 'receipts', icon: Receipt, color: 'text-emerald-400' },
                { title: 'Staff Access & Roles', desc: 'User permissions & security', tab: 'staff-access', icon: Key, color: 'text-amber-500' },
                { title: 'View Audit Trail', desc: 'Database operations security logs', tab: 'audit', icon: History, color: 'text-cyan-400' }
              ].map((act, idx) => {
                const ActIcon = act.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveAdminTab(act.tab as any);
                      setShowQuickActionModal(false);
                    }}
                    className="p-3.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition-all group"
                  >
                    <ActIcon className={`w-5 h-5 ${act.color} mb-1.5 group-hover:scale-110 transition-transform`} />
                    <span className="text-xs font-bold text-white block group-hover:text-amber-400 transition-colors">{act.title}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{act.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
