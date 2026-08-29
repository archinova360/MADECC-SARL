import { Tenant, TenantMembership, TenantRole } from '../types.ts';

export const MADECC_FLAGSHIP_TENANT: Tenant = {
  id: 1,
  name: 'MADECC Group',
  slug: 'madecc-group',
  legalName: 'MADECC Construction & Civil Engineering Group SARL',
  logoUrl: '/logo.png',
  faviconUrl: '/app_favicon.jpg',
  primaryDomain: 'madeccgroup.online',
  customDomain: null,
  status: 'ACTIVE',
  planCode: 'ENTERPRISE',
  currency: 'XAF',
  timezone: 'Africa/Douala',
  phone: '+237 671 063 511 / +237 683 316 486',
  email: 'contact@madeccgroup.online',
  address: 'Commercial Avenue, Bamenda & Douala, Cameroon',
  country: 'Cameroon',
  settings: {
    primaryColor: '#0f172a', // Slate 900
    secondaryColor: '#f59e0b', // Amber 500
    accentColor: '#3b82f6', // Blue 500
    fontFamily: 'Plus Jakarta Sans',
    tagline: 'Leading Civil Engineering & Turnkey Construction Platform',
    companyAddress: 'Main Headquarters, Yaoundé & Douala, Cameroon',
    phone: '+237 671 063 511',
    email: 'info@madeccgroup.online',
    whatsappNumber: '+237671063511',
    currency: 'XAF',
    taxNumber: 'M051812728192K',
    registrationNumber: 'RC/YAO/2018/B/1429',
    socialLinks: {
      facebook: 'https://facebook.com/madeccgroup',
      linkedin: 'https://linkedin.com/company/madecc-group',
      instagram: 'https://instagram.com/madeccgroup',
      youtube: 'https://youtube.com/@madeccgroup',
      twitter: 'https://x.com/madeccgroup'
    },
    features: {
      aiTakeoff: true,
      eurocodeCalculators: true,
      documentStudio: true,
      socialPublisher: true,
      erpInventory: true
    }
  },
  aiCreditsBalance: 50000,
  storageUsageBytes: 4294967296, // 4 GB
  isFlagship: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

// Initial Demo/Pilot Tenants
export const INITIAL_PILOT_TENANTS: Tenant[] = [
  MADECC_FLAGSHIP_TENANT,
  {
    id: 2,
    name: 'BuildPro Engineering Ltd',
    slug: 'buildpro-engineering',
    legalName: 'BuildPro Civil & Structural Contractors Ltd',
    logoUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
    faviconUrl: null,
    primaryDomain: 'buildpro.madecccloud.com',
    customDomain: 'buildpro-contractors.com',
    status: 'ACTIVE',
    planCode: 'PROFESSIONAL',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    phone: '+237 689 115 595',
    email: 'info@buildpro-contractors.com',
    address: 'Bonanjo Commercial District, Douala',
    country: 'Cameroon',
    settings: {
      primaryColor: '#1e3a8a', // Blue 900
      secondaryColor: '#10b981', // Emerald 500
      accentColor: '#f97316', // Orange 500
      fontFamily: 'Inter',
      tagline: 'Modern Structural Solutions & Commercial General Contracting',
      companyAddress: 'Boulevard de la Liberté, Akwa, Douala',
      phone: '+237 689 115 595',
      email: 'contact@buildpro-contractors.com',
      whatsappNumber: '+237689115595',
      currency: 'XAF',
      socialLinks: {
        linkedin: 'https://linkedin.com/company/buildpro'
      }
    },
    aiCreditsBalance: 450,
    storageUsageBytes: 3221225472, // 3 GB
    isFlagship: false,
    createdAt: '2024-06-15T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'Alpha Civil & Infra Group',
    slug: 'alpha-civil',
    legalName: 'Alpha Civil Infrastructure & Roads SARL',
    logoUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=400&q=80',
    faviconUrl: null,
    primaryDomain: 'alphacivil.madecccloud.com',
    customDomain: null,
    status: 'ACTIVE',
    planCode: 'STARTER',
    currency: 'XAF',
    timezone: 'Africa/Douala',
    phone: '+237 640 194 505',
    email: 'projects@alphacivil.cm',
    address: 'Bastos Diplomatic Quarter, Yaoundé',
    country: 'Cameroon',
    settings: {
      primaryColor: '#18181b', // Zinc 900
      secondaryColor: '#e11d48', // Rose 600
      accentColor: '#0284c7', // Sky 600
      fontFamily: 'Plus Jakarta Sans',
      tagline: 'Roads, Bridges & Heavy Civil Infrastructure Works',
      companyAddress: 'Avenue Kennedy, Yaoundé',
      phone: '+237 640 194 505',
      email: 'admin@alphacivil.cm',
      whatsappNumber: '+237640194505',
      currency: 'XAF'
    },
    aiCreditsBalance: 85,
    storageUsageBytes: 1073741824, // 1 GB
    isFlagship: false,
    createdAt: '2024-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString()
  }
];

const TENANT_STORAGE_KEY = 'madecc_saas_active_tenant_id';

export class TenantService {
  /**
   * Get the active tenant for client-side state
   */
  static getActiveTenant(): Tenant {
    try {
      const storedId = localStorage.getItem(TENANT_STORAGE_KEY);
      if (storedId) {
        const id = parseInt(storedId, 10);
        const match = INITIAL_PILOT_TENANTS.find(t => t.id === id);
        if (match) return match;
      }
    } catch {
      // Fallback
    }
    return MADECC_FLAGSHIP_TENANT;
  }

  /**
   * Get tenant by ID
   */
  static getTenantById(id: number): Tenant | undefined {
    return this.getAllTenants().find(t => t.id === id);
  }

  /**
   * Set active tenant and apply branding
   */
  static setActiveTenant(tenantOrId: number | Tenant): Tenant {
    let target: Tenant;
    if (typeof tenantOrId === 'number') {
      target = this.getAllTenants().find(t => t.id === tenantOrId) || MADECC_FLAGSHIP_TENANT;
    } else {
      target = tenantOrId;
      // Also ensure it's in list
      this.addTenant(target);
    }

    try {
      localStorage.setItem(TENANT_STORAGE_KEY, target.id.toString());
    } catch {
      // ignore
    }
    this.applyTenantBranding(target);
    return target;
  }

  /**
   * Add a dynamically registered tenant
   */
  static addTenant(tenant: Tenant) {
    const exists = INITIAL_PILOT_TENANTS.some(t => t.id === tenant.id);
    if (!exists) {
      INITIAL_PILOT_TENANTS.push(tenant);
    }
  }

  /**
   * List all accessible tenants
   */
  static getAllTenants(): Tenant[] {
    return INITIAL_PILOT_TENANTS;
  }

  /**
   * Apply tenant branding to the HTML document dynamically (white-labeling)
   */
  static applyTenantBranding(tenant: Tenant) {
    if (typeof document === 'undefined') return;

    // Update Page Title
    if (tenant.isFlagship) {
      document.title = `${tenant.name} — Civil Engineering & Construction Platform`;
    } else {
      document.title = `${tenant.name} — Construction & Engineering Portal`;
    }

    // Update Favicon if provided
    if (tenant.faviconUrl) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = tenant.faviconUrl;
      }
    }

    // Apply Dynamic Theme Colors
    const primary = tenant.settings?.primaryColor || '#0f172a';
    const secondary = tenant.settings?.secondaryColor || '#f59e0b';
    document.documentElement.style.setProperty('--tenant-primary', primary);
    document.documentElement.style.setProperty('--tenant-secondary', secondary);
  }

  /**
   * Build tenant HTTP headers for API requests
   */
  static getTenantHeaders(): Record<string, string> {
    const tenant = this.getActiveTenant();
    return {
      'x-tenant-id': tenant.id.toString(),
      'x-tenant-slug': tenant.slug
    };
  }
}
