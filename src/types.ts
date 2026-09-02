export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'client' | 'social_media_reviewer';
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  budget: string | null;
  currency?: string;
  currency_code?: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  categoryId: number | null;
  image: string;
  videoUrl?: string | null;
  createdAt: string;
  progress?: ProjectProgress[];
}

export interface ProjectProgress {
  id: number;
  projectId: number;
  milestoneName: string;
  percentage: number;
  date: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

export interface BlogPost {
  id: number;
  title: string;
  content: string;
  authorId: number | null;
  publishedAt: string;
  image: string;
  videoUrl?: string | null;
  summary: string;
  category: string;
}

export interface Review {
  id: number;
  authorName: string;
  rating: number;
  text: string;
  approved: boolean;
  approvedAt: string | null;
  projectName: string | null;
  createdAt: string;
}

export interface Appointment {
  id: number;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  appointmentDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  createdAt: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: number;
  email: string;
  status: 'subscribed' | 'unsubscribed';
  createdAt: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  icon: string;
  priceRange: string | null;
  details: string | null;
}

export interface GalleryItem {
  id: number;
  title: string;
  imageUrl: string;
  videoUrl?: string | null;
  category: string;
  createdAt: string;
}

export interface HeroBanner {
  id: number;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  videoUrl?: string | null;
  displayOrder: number;
  active: boolean;
}

export interface CompanyDocument {
  id: number;
  title: string;
  fileUrl: string;
  docType: string;
  version: string;
  createdAt: string;
}

export interface AuditLog {
  id: number;
  userId: string | null;
  userEmail: string | null;
  action: string;
  details: string;
  timestamp: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  specialization: string;
  image: string | null;
  email: string | null;
  createdAt: string;
}

export interface SignedContract {
  id: number;
  contractNo: string;
  clientName: string;
  clientNiu: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  clientCity: string | null;
  contractProject: string;
  contractProjectLocation: string | null;
  contractValue: string;
  contractDuration: string | null;
  contractScope: string | null;
  contractDate: string | null;
  contractAgreedBalance: string | null;
  contractAdvancePayment: string | null;
  representativeName: string | null;
  representativeTitle: string | null;
  signatoryTitle: string | null;
  typedClientSignature: string;
  drawnClientSignature: string | null;
  verificationToken: string;
  signedAt: string;
}

export interface SignedReceipt {
  id: number;
  receiptNo: string;
  clientName: string;
  clientNiu: string | null;
  receiptProject: string;
  invoiceTotalAmount?: string | null;
  receiptAmount: string;
  remainingBalance?: string | null;
  receiptTaxRate: string;
  receiptMethod: string;
  receiptMemo: string | null;
  receiptSignatory: string;
  receiptTypedSign: string;
  drawnCfoSignature: string | null;
  verificationToken: string;
  signedAt: string;
}

// ==========================================
// CMS & FRONTEND MANAGEMENT SYSTEM TYPES
// ==========================================

export interface HeroSectionConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  primaryCta: {
    text: string;
    link: string;
    visible: boolean;
  };
  secondaryCta: {
    text: string;
    link: string;
    visible: boolean;
  };
  tertiaryCta: {
    text: string;
    link: string;
    visible: boolean;
  };
  mediaType: 'video' | 'image' | 'slideshow';
  videoUrl?: string | null;
  posterUrl?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  videoSettings: {
    autoplay: boolean;
    muted: boolean;
    loop: boolean;
    playsInline: boolean;
    disableOnMobile: boolean;
    overlayOpacity: number; // 0 to 100
  };
  showHero: boolean;
  showVideo: boolean;
  trustBadges: Array<{
    icon: string;
    text: string;
  }>;
}

export interface PageSection {
  id: string;
  type: 'hero' | 'about' | 'services' | 'projects' | 'why_choose_us' | 'process' | 'stats' | 'testimonials' | 'team' | 'faq' | 'cta' | 'rich_text' | 'media_showcase' | 'custom';
  title: string;
  subtitle?: string;
  content?: string;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video';
  layout?: 'grid' | 'carousel' | 'split' | 'fullwidth' | 'stacked';
  enabled: boolean;
  displayOrder: number;
  data?: Record<string, any>;
  ctaText?: string;
  ctaLink?: string;
}

export interface SeoConfig {
  seoTitle: string;
  metaDescription: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string;
  robotsIndex: boolean;
}

export interface PageContent {
  id: number;
  slug: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';
  heroConfig: HeroSectionConfig;
  sections: PageSection[];
  seo: SeoConfig;
  draftData?: {
    heroConfig: HeroSectionConfig;
    sections: PageSection[];
    seo: SeoConfig;
  };
  publishedData?: {
    heroConfig: HeroSectionConfig;
    sections: PageSection[];
    seo: SeoConfig;
  };
  version: number;
  lastSavedBy?: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  id: number;
  title: string;
  filename: string;
  fileUrl: string;
  fileType: 'image' | 'video' | 'document' | 'audio' | 'logo' | 'icon';
  mimeType?: string;
  fileSize?: number;
  dimensions?: string;
  altText?: string;
  caption?: string;
  category: string;
  tags?: string[];
  usedIn?: string[];
  status: 'ACTIVE' | 'ARCHIVED';
  uploadedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSettings {
  id: number;
  siteName: string;
  tagline: string;
  developerName?: string;
  phone: string;
  phoneSecondary?: string;
  phoneTertiary?: string;
  emergencyPhone: string;
  email: string;
  secondaryEmail?: string;
  officeAddressYaounde: string;
  officeAddressDouala: string;
  businessHours: string;
  whatsappNumber: string;
  whatsappSecondary?: string;
  paymentMtnNumbers?: string;
  paymentOrangeNumbers?: string;
  paymentInstructions?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  pinterestUrl?: string;
  rccmNumber?: string;
  niuTaxId?: string;
  legalStatus?: string;
  shareHeadline?: string;
  shareDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  themeSettings?: {
    primaryColor?: string;
    accentColor?: string;
    fontHeading?: string;
    fontBody?: string;
    borderRadius?: string;
    containerWidth?: string;
  };
  globalSeo: SeoConfig;
  navigationLinks: Array<{
    id: string;
    label: string;
    href: string;
    order: number;
    isEnabled: boolean;
    isDropdown?: boolean;
    children?: Array<{ label: string; href: string }>;
  }>;
  footerContent: {
    aboutText: string;
    copyrightText: string;
    accreditationBadges: string[];
  };
  emergencyBanner?: {
    enabled: boolean;
    message: string;
    linkText?: string;
    linkUrl?: string;
    badgeType?: 'info' | 'warning' | 'urgent';
  };
  updatedBy?: string;
  updatedAt: string;
}

export interface CmsRevision {
  id: number;
  module?: string;
  recordId?: string | number;
  pageSlug?: string;
  version?: number;
  versionNumber?: number;
  title?: string;
  changeSummary?: string;
  author?: string;
  snapshot?: any;
  snapshotData?: any;
  createdBy?: string;
  createdAt: string;
}

// =========================================================================
// SAAS MULTI-TENANT TYPES & RBAC
// =========================================================================

export type TenantRole = 
  | 'SUPER_ADMIN'
  | 'OWNER' 
  | 'ADMIN' 
  | 'PROJECT_MANAGER' 
  | 'ESTIMATOR' 
  | 'ENGINEER' 
  | 'STAFF' 
  | 'VIEWER';

export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING_APPROVAL' | 'CANCELLED';

export type PlanCode = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export type SubscriptionStatus = 'ACTIVE' | 'PENDING_CONFIRMATION' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED';

export type PaymentMethodCode = 'MTN_MOMO' | 'ORANGE_MONEY' | 'VISA_CARD' | 'BANK_WIRE' | 'CASH';

export interface TenantSettings {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  tagline?: string;
  logoUrl?: string;
  faviconUrl?: string;
  companyAddress?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  currency?: string;
  taxNumber?: string;
  registrationNumber?: string;
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
    twitter?: string;
  };
  features?: Record<string, boolean>;
}

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  legalName?: string | null;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryDomain?: string | null;
  customDomain?: string | null;
  status: TenantStatus;
  planCode: PlanCode;
  currency: string;
  timezone?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  country?: string | null;
  settings?: TenantSettings | null;
  aiCreditsBalance: number;
  storageUsageBytes: number;
  isFlagship: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TenantMembership {
  id: number;
  tenantId: number;
  userId: string;
  email: string;
  fullName?: string | null;
  role: TenantRole;
  permissions?: string[] | null;
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED';
  invitedBy?: string | null;
  invitedAt?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
  tenant?: Tenant;
}

export interface SaaSPlan {
  id: number;
  code: PlanCode;
  name: string;
  description?: string | null;
  monthlyPrice: number;
  annualPrice: number;
  currency: string;
  maxUsers: number;
  maxProjects: number;
  maxStorageGb: number;
  aiCreditsMonthly: number;
  features?: string[] | null;
  isPopular?: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSubscription {
  id: number;
  tenantId: number;
  planCode: PlanCode;
  billingCycle: 'MONTHLY' | 'ANNUAL';
  amount: number;
  currency: string;
  status: SubscriptionStatus;
  paymentMethod?: PaymentMethodCode | null;
  paymentReference?: string | null;
  senderPhone?: string | null;
  notes?: string | null;
  startDate: string;
  renewalDate: string;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  thankYouShown: boolean;
  createdAt: string;
  updatedAt: string;
  plan?: SaaSPlan;
  tenant?: Tenant;
}

export interface TenantDomain {
  id: number;
  tenantId: number;
  domain: string;
  domainType: 'PRIMARY' | 'SUBDOMAIN' | 'CUSTOM';
  status: 'ACTIVE' | 'PENDING_DNS' | 'SUSPENDED';
  sslStatus?: 'PENDING' | 'PROVISIONED' | 'FAILED' | null;
  verificationToken?: string | null;
  verifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UsageEvent {
  id: number;
  tenantId: number;
  userId?: string | null;
  eventType: 'AI_DRAWING_ANALYSIS' | 'AI_QUANTITY_TAKEOFF' | 'BOQ_GENERATION' | 'DOCUMENT_EXPORT' | 'FILE_STORAGE' | 'API_REQUEST';
  quantity: number;
  unit: string;
  estimatedCost: number;
  metadata?: any;
  createdAt: string;
}

export interface PlatformAuditLog {
  id: number;
  tenantId?: number | null;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  metadata?: any;
  createdAt: string;
}

export interface FeatureFlag {
  id: number;
  tenantId?: number | null;
  key: string;
  enabled: boolean;
  description?: string | null;
  rules?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DirectPaymentConfig {
  momoNumbers: string[];
  orangeMoneyNumbers: string[];
  bankAccount: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    ibanOrSwift?: string;
  };
  contactWhatsApp: string;
  contactEmail: string;
  promoNote?: string;
}

// =========================================================================
// PAID API PLATFORM INTERFACES
// =========================================================================

export interface ApiProductEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  requestBody?: any;
  responseBody?: any;
  scopes?: string[];
}

export interface ApiProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  version: string;
  endpoints: ApiProductEndpoint[];
  documentation?: string;
  priceMonthly: number;
  currency: string;
  billingModel: 'MONTHLY' | 'PER_REQUEST' | 'ANNUAL' | 'UNLIMITED';
  rateLimitDefault: number;
  enabled: boolean;
  requiresApproval: boolean;
  availablePlans?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiPlan {
  id: number;
  code: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  billingCycle: 'MONTHLY' | 'ANNUAL' | 'PAY_AS_YOU_GO';
  rateLimitPerMinute: number;
  monthlyQuota: number; // -1 for unlimited
  maxApiKeys: number;
  permissions: string[];
  features: string[];
  isPopular: boolean;
  requiresApproval: boolean;
  active: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiCustomer {
  id: number;
  userId: string;
  developerName: string;
  companyName: string;
  contactEmail: string;
  contactPhone?: string;
  websiteUrl?: string;
  useCaseDescription?: string;
  billingAddress?: string;
  country: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';
  createdAt: string;
  updatedAt: string;
}

export interface ApiAccessRequest {
  id: number;
  requestId: string;
  customerId?: number;
  customerEmail: string;
  customerName: string;
  companyName: string;
  planCode: string;
  productSlug?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionReference?: string;
  payerPhone?: string;
  payerName?: string;
  paymentReceiptUrl?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  requestedAt: string;
  updatedAt: string;
}

export interface ApiPaymentTransaction {
  id: number;
  transactionId: string;
  accessRequestId?: number;
  customerEmail: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  transactionRef: string;
  payerPhone?: string;
  payerName?: string;
  receiptUrl?: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  verifiedBy?: string;
  verifiedAt?: string;
  gatewayPayload?: any;
  createdAt: string;
}

export interface ApiEntitlement {
  id: number;
  customerId: number;
  customerEmail: string;
  planCode: string;
  permissions: string[];
  rateLimitPerMinute: number;
  monthlyQuota: number;
  quotaUsedThisMonth: number;
  isUnlimited: boolean;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
  startDate: string;
  expiresAt?: string;
  approvedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyItem {
  id: number;
  customerId: number;
  customerEmail: string;
  name: string;
  keyId: string;
  secretPrefix: string;
  environment: 'production' | 'sandbox';
  permissions: string[];
  rateLimitPerMinute: number;
  monthlyQuota: number;
  status: 'ACTIVE' | 'REVOKED' | 'SUSPENDED' | 'EXPIRED';
  lastUsedAt?: string;
  lastUsedIp?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRequestLog {
  id: number;
  keyId?: string;
  customerEmail?: string;
  endpoint: string;
  method: string;
  statusCode: number;
  latencyMs: number;
  ipHash?: string;
  userAgent?: string;
  requestSize: number;
  responseSize: number;
  errorMessage?: string;
  timestamp: string;
}

export interface ApiPlatformAuditLog {
  id: number;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  details: string;
  metadata?: any;
  ipAddress?: string;
  timestamp: string;
}


