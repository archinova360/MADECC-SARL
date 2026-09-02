import { Tenant, TenantMembership, TenantRole } from '../types.ts';
import { TenantContentService } from './tenantContentService.ts';

export const MADECC_FLAGSHIP_TENANT: Tenant = TenantContentService.getProfile(1).tenant;
export const INITIAL_PILOT_TENANTS: Tenant[] = TenantContentService.getAllTenants();

const TENANT_STORAGE_KEY = 'madecc_saas_active_tenant_id';

export class TenantService {
  private static cachedTenants: Tenant[] = INITIAL_PILOT_TENANTS;

  /**
   * Fetch all tenants from Backend API
   */
  static async fetchTenantsFromApi(): Promise<Tenant[]> {
    try {
      const res = await fetch('/api/saas/tenants');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge API tenants with rich client profiles
          this.cachedTenants = data.map((apiTenant: Tenant) => {
            const rich = TenantContentService.getProfile(apiTenant.id);
            return {
              ...rich.tenant,
              ...apiTenant,
              settings: {
                ...rich.tenant.settings,
                ...(apiTenant.settings || {})
              }
            };
          });
          return this.cachedTenants;
        }
      }
    } catch (e) {
      console.warn('[FETCH_TENANTS_WARN]', e);
    }
    return this.cachedTenants;
  }

  /**
   * Get the active tenant for client-side state
   */
  static getActiveTenant(): Tenant {
    try {
      const storedId = localStorage.getItem(TENANT_STORAGE_KEY);
      if (storedId) {
        const id = parseInt(storedId, 10);
        const match = this.cachedTenants.find(t => t.id === id);
        if (match) return match;
      }
    } catch {
      // Fallback
    }
    return this.cachedTenants[0] || MADECC_FLAGSHIP_TENANT;
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
    const exists = this.cachedTenants.some(t => t.id === tenant.id);
    if (!exists) {
      this.cachedTenants.push(tenant);
    }
  }

  /**
   * List all accessible tenants
   */
  static getAllTenants(): Tenant[] {
    return this.cachedTenants;
  }

  /**
   * Register a new Tenant via API
   */
  static async registerTenant(tenantData: Partial<Tenant>): Promise<Tenant> {
    const res = await fetch('/api/saas/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenantData)
    });
    const created = await res.json();
    if (created && created.id) {
      this.addTenant(created);
      return created;
    }
    throw new Error(created.error || 'Failed to create workspace');
  }

  /**
   * Update Tenant settings
   */
  static async updateTenant(id: number, updateData: Partial<Tenant>): Promise<Tenant> {
    const res = await fetch(`/api/saas/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const updated = await res.json();
    if (updated && updated.id) {
      const idx = this.cachedTenants.findIndex(t => t.id === id);
      if (idx !== -1) {
        this.cachedTenants[idx] = { ...this.cachedTenants[idx], ...updated };
      }
      return updated;
    }
    throw new Error(updated.error || 'Failed to update workspace');
  }

  /**
   * Delete Tenant
   */
  static async deleteTenant(id: number): Promise<boolean> {
    const res = await fetch(`/api/saas/tenants/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      this.cachedTenants = this.cachedTenants.filter(t => t.id !== id);
      return true;
    }
    return false;
  }

  /**
   * Apply tenant branding to the HTML document dynamically (white-labeling and SEO protection)
   */
  static applyTenantBranding(tenant: Tenant) {
    if (typeof document === 'undefined') return;

    const profile = TenantContentService.getProfile(tenant.id);

    // Update Page Title
    document.title = profile.seo.metaTitle || `${tenant.name} | Civil Engineering & Construction`;

    // Update Meta Description
    let metaDesc = document.querySelector("meta[name='description']");
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute('content', profile.seo.metaDescription);

    // Update OpenGraph Title
    let ogTitle = document.querySelector("meta[property='og:title']");
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', profile.seo.metaTitle);

    // Update OpenGraph Description
    let ogDesc = document.querySelector("meta[property='og:description']");
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', profile.seo.metaDescription);

    // Update OpenGraph Image
    if (profile.seo.ogImage) {
      let ogImg = document.querySelector("meta[property='og:image']");
      if (!ogImg) {
        ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        document.head.appendChild(ogImg);
      }
      ogImg.setAttribute('content', profile.seo.ogImage);
    }

    // Update Favicon if provided
    if (tenant.faviconUrl || tenant.logoUrl) {
      const fav = tenant.faviconUrl || tenant.logoUrl;
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link && fav) {
        link.href = fav;
      }
    }

    // Apply Dynamic Theme Colors
    const primary = tenant.settings?.primaryColor || '#0f172a';
    const secondary = tenant.settings?.secondaryColor || '#f59e0b';
    const accent = tenant.settings?.accentColor || '#3b82f6';
    document.documentElement.style.setProperty('--tenant-primary', primary);
    document.documentElement.style.setProperty('--tenant-secondary', secondary);
    document.documentElement.style.setProperty('--tenant-accent', accent);
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

