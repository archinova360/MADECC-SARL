import { Tenant, SaaSWorkspaceVersion } from '../types.ts';
import { TenantContentService } from './tenantContentService.ts';

export const MADECC_FLAGSHIP_TENANT: Tenant = TenantContentService.getProfile(1).tenant;
export const INITIAL_PILOT_TENANTS: Tenant[] = TenantContentService.getAllTenants();

const TENANT_STORAGE_KEY = 'madecc_saas_active_tenant_id';

export async function uploadSaasAssetFile(
  file: File,
  onProgress?: (label: string) => void
): Promise<string> {
  onProgress?.('Preparing secure cloud upload...');

  const uploadViaProxy = async () => {
    onProgress?.('Uploading to Cloudinary / Supabase Storage...');
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
    const sigRes = await fetch('/api/cloudinary-signature');
    if (sigRes.ok) {
      const ticket = await sigRes.json();
      if (ticket?.signature && ticket?.cloudName) {
        return await new Promise<string>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          const fd = new FormData();
          fd.append('file', file);
          fd.append('api_key', ticket.apiKey);
          fd.append('timestamp', String(ticket.timestamp));
          fd.append('signature', ticket.signature);
          fd.append('folder', ticket.folder || 'madecc');
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${ticket.cloudName}/auto/upload`, true);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              const pct = Math.round((ev.loaded / ev.total) * 100);
              onProgress?.(`Uploading (${pct}%)...`);
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const parsed = JSON.parse(xhr.responseText);
                resolve(parsed.secure_url || parsed.url);
              } catch {
                reject(new Error('Invalid Cloudinary response'));
              }
            } else {
              reject(new Error(`Cloudinary HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Cloudinary network error'));
          xhr.send(fd);
        });
      }
    }
  } catch {
    // Fall back transparently to server proxy (Cloudinary -> Supabase)
  }

  return await uploadViaProxy();
}

export class TenantService {
  private static cachedTenants: Tenant[] = INITIAL_PILOT_TENANTS;

  static async fetchTenantsFromApi(options?: { publishedOnly?: boolean }): Promise<Tenant[]> {
    const qs = options?.publishedOnly ? '?publishedOnly=true' : '';
    const res = await fetch(`/api/saas/tenants${qs}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        this.cachedTenants = data.map((apiTenant: Tenant) => {
          const rich = TenantContentService.getProfile(apiTenant.id);
          return {
            ...rich.tenant,
            ...apiTenant,
            settings: {
              ...(rich.tenant.settings || {}),
              ...(apiTenant.settings || {})
            }
          };
        });
        return this.cachedTenants;
      }
    }
    return this.cachedTenants;
  }

  static getActiveTenant(): Tenant {
    try {
      const storedId = localStorage.getItem(TENANT_STORAGE_KEY);
      if (storedId) {
        const id = parseInt(storedId, 10);
        const match = this.cachedTenants.find(t => t.id === id);
        if (match) return match;
      }
    } catch {
      // ignore
    }
    return this.cachedTenants[0] || MADECC_FLAGSHIP_TENANT;
  }

  static getTenantById(id: number): Tenant | undefined {
    return this.getAllTenants().find(t => t.id === id);
  }

  static setActiveTenant(tenantOrId: number | Tenant): Tenant {
    let target: Tenant;
    if (typeof tenantOrId === 'number') {
      target = this.getAllTenants().find(t => t.id === tenantOrId) || MADECC_FLAGSHIP_TENANT;
    } else {
      target = tenantOrId;
      this.upsertCachedTenant(target);
    }

    try {
      localStorage.setItem(TENANT_STORAGE_KEY, target.id.toString());
    } catch {
      // ignore
    }
    this.applyTenantBranding(target);
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('madecc:tenant-switched', { detail: target }));
      }
    } catch {
      // ignore
    }
    return target;
  }

  static upsertCachedTenant(tenant: Tenant) {
    const idx = this.cachedTenants.findIndex(t => t.id === tenant.id);
    if (idx === -1) {
      this.cachedTenants = [tenant, ...this.cachedTenants];
    } else {
      this.cachedTenants[idx] = { ...this.cachedTenants[idx], ...tenant };
    }
  }

  static addTenant(tenant: Tenant) {
    this.upsertCachedTenant(tenant);
  }

  static getAllTenants(): Tenant[] {
    return this.cachedTenants;
  }

  static async registerTenant(tenantData: Partial<Tenant> & { sendWelcomeEmail?: boolean }): Promise<Tenant> {
    const res = await fetch('/api/saas/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tenantData)
    });
    const created = await res.json();
    if (res.ok && created && created.id) {
      this.upsertCachedTenant(created);
      return created;
    }
    throw new Error(created.error || 'Failed to create tenant workspace');
  }

  static async updateTenant(
    id: number,
    updateData: Partial<Tenant> & { changelog?: string; createVersionSnapshot?: boolean }
  ): Promise<Tenant> {
    const res = await fetch(`/api/saas/tenants/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    const updated = await res.json();
    if (res.ok && updated && updated.id) {
      this.upsertCachedTenant(updated);
      return updated;
    }
    throw new Error(updated.error || 'Failed to save workspace');
  }

  static async publishTenant(id: number, payload?: { changelog?: string; notifyTenant?: boolean }): Promise<Tenant> {
    const res = await fetch(`/api/saas/tenants/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Publish failed');
    if (data.tenant) this.upsertCachedTenant(data.tenant);
    return data.tenant;
  }

  static async republishTenant(id: number, payload?: { changelog?: string; notifyTenant?: boolean }): Promise<Tenant> {
    const res = await fetch(`/api/saas/tenants/${id}/republish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {})
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Republish failed');
    if (data.tenant) this.upsertCachedTenant(data.tenant);
    return data.tenant;
  }

  static async unpublishTenant(id: number, reason?: string): Promise<Tenant> {
    const res = await fetch(`/api/saas/tenants/${id}/unpublish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Unpublish failed');
    if (data.tenant) this.upsertCachedTenant(data.tenant);
    return data.tenant;
  }

  static async duplicateTenant(id: number, newName?: string): Promise<Tenant> {
    const res = await fetch(`/api/saas/tenants/${id}/duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Duplicate failed');
    if (data.tenant) this.upsertCachedTenant(data.tenant);
    return data.tenant;
  }

  static async fetchTenantVersions(id: number): Promise<SaaSWorkspaceVersion[]> {
    const res = await fetch(`/api/saas/tenants/${id}/versions`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load version history');
    return data.versions || [];
  }

  static async saveTenantVersion(id: number, changelog: string, versionLabel?: string): Promise<SaaSWorkspaceVersion> {
    const res = await fetch(`/api/saas/tenants/${id}/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changelog, versionLabel })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save version snapshot');
    return data.version;
  }

  static async restoreTenantVersion(id: number, versionId: number, republishImmediately: boolean = true): Promise<Tenant> {
    const res = await fetch(`/api/saas/tenants/${id}/versions/${versionId}/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ republishImmediately })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Restore version failed');
    if (data.tenant) this.upsertCachedTenant(data.tenant);
    return data.tenant;
  }

  static async shareTenantPortal(id: number, recipientEmail: string, message?: string): Promise<any> {
    const res = await fetch(`/api/saas/tenants/${id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientEmail, message })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Share via SMTP failed');
    return data;
  }

  static async exportTenantBundle(id: number): Promise<any> {
    const res = await fetch(`/api/saas/tenants/${id}/export`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Export failed');
    return data;
  }

  static async fetchTenantUsage(id: number): Promise<any> {
    const res = await fetch(`/api/saas/tenants/${id}/usage`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load workspace usage');
    return data;
  }

  static async deleteTenant(id: number): Promise<boolean> {
    const res = await fetch(`/api/saas/tenants/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    this.cachedTenants = this.cachedTenants.filter(t => t.id !== id);
    return true;
  }

  static applyTenantBranding(tenant: Tenant) {
    if (typeof document === 'undefined') return;
    const profile = TenantContentService.getProfile(tenant.id);
    document.title = profile.seo.metaTitle || `${tenant.name} | Civil Engineering & Construction`;

    const setMeta = (selector: string, attrName: 'name' | 'property', key: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta("meta[name='description']", 'name', 'description', profile.seo.metaDescription);
    setMeta("meta[property='og:title']", 'property', 'og:title', profile.seo.metaTitle);
    setMeta("meta[property='og:description']", 'property', 'og:description', profile.seo.metaDescription);
    if (profile.seo.ogImage) {
      setMeta("meta[property='og:image']", 'property', 'og:image', profile.seo.ogImage);
    }

    if (tenant.faviconUrl || tenant.logoUrl) {
      const fav = tenant.faviconUrl || tenant.logoUrl;
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link && fav) link.href = fav;
    }

    document.documentElement.style.setProperty('--tenant-primary', tenant.settings?.primaryColor || '#0f172a');
    document.documentElement.style.setProperty('--tenant-secondary', tenant.settings?.secondaryColor || '#f59e0b');
    document.documentElement.style.setProperty('--tenant-accent', tenant.settings?.accentColor || '#3b82f6');
  }

  static getTenantHeaders(): Record<string, string> {
    const tenant = this.getActiveTenant();
    return {
      'x-tenant-id': tenant.id.toString(),
      'x-tenant-slug': tenant.slug
    };
  }
}
