import { TenantRole } from '../types.ts';

export type PermissionKey = 
  // Projects
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'projects.export'
  // BOQ & Quantity Takeoff
  | 'boq.view'
  | 'boq.create'
  | 'boq.edit'
  | 'boq.delete'
  | 'boq.export'
  | 'boq.approve'
  // Drawings & CAD/PDF
  | 'drawings.view'
  | 'drawings.upload'
  | 'drawings.delete'
  // AI Tools
  | 'ai.analyze'
  | 'ai.quantity_takeoff'
  | 'ai.eurocode'
  // Engineering & Calculators
  | 'calculators.use'
  | 'calculators.export'
  // Documents & Contracts
  | 'documents.view'
  | 'documents.create'
  | 'documents.sign'
  | 'documents.delete'
  // CMS & Public Site
  | 'website.view'
  | 'website.manage'
  | 'cms.edit'
  | 'cms.publish'
  // Marketing & Social
  | 'social.view'
  | 'social.manage'
  | 'social.publish'
  // Clients & Tenders
  | 'clients.manage'
  | 'tenders.manage'
  // Team & Users
  | 'users.view'
  | 'users.invite'
  | 'users.manage'
  | 'roles.assign'
  // Billing & Subscriptions
  | 'billing.view'
  | 'billing.manage'
  | 'subscription.upgrade'
  // SaaS Platform Control
  | 'superadmin.access'
  | 'platform.manage_tenants'
  | 'platform.manage_plans'
  | 'platform.confirm_payments';

const ROLE_PERMISSIONS_MATRIX: Record<TenantRole, PermissionKey[]> = {
  SUPER_ADMIN: [
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.export',
    'boq.view', 'boq.create', 'boq.edit', 'boq.delete', 'boq.export', 'boq.approve',
    'drawings.view', 'drawings.upload', 'drawings.delete',
    'ai.analyze', 'ai.quantity_takeoff', 'ai.eurocode',
    'calculators.use', 'calculators.export',
    'documents.view', 'documents.create', 'documents.sign', 'documents.delete',
    'website.view', 'website.manage', 'cms.edit', 'cms.publish',
    'social.view', 'social.manage', 'social.publish',
    'clients.manage', 'tenders.manage',
    'users.view', 'users.invite', 'users.manage', 'roles.assign',
    'billing.view', 'billing.manage', 'subscription.upgrade',
    'superadmin.access', 'platform.manage_tenants', 'platform.manage_plans', 'platform.confirm_payments'
  ],

  OWNER: [
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.export',
    'boq.view', 'boq.create', 'boq.edit', 'boq.delete', 'boq.export', 'boq.approve',
    'drawings.view', 'drawings.upload', 'drawings.delete',
    'ai.analyze', 'ai.quantity_takeoff', 'ai.eurocode',
    'calculators.use', 'calculators.export',
    'documents.view', 'documents.create', 'documents.sign', 'documents.delete',
    'website.view', 'website.manage', 'cms.edit', 'cms.publish',
    'social.view', 'social.manage', 'social.publish',
    'clients.manage', 'tenders.manage',
    'users.view', 'users.invite', 'users.manage', 'roles.assign',
    'billing.view', 'billing.manage', 'subscription.upgrade'
  ],

  ADMIN: [
    'projects.view', 'projects.create', 'projects.edit', 'projects.delete', 'projects.export',
    'boq.view', 'boq.create', 'boq.edit', 'boq.export', 'boq.approve',
    'drawings.view', 'drawings.upload', 'drawings.delete',
    'ai.analyze', 'ai.quantity_takeoff', 'ai.eurocode',
    'calculators.use', 'calculators.export',
    'documents.view', 'documents.create', 'documents.sign',
    'website.view', 'website.manage', 'cms.edit', 'cms.publish',
    'social.view', 'social.manage', 'social.publish',
    'clients.manage', 'tenders.manage',
    'users.view', 'users.invite',
    'billing.view'
  ],

  PROJECT_MANAGER: [
    'projects.view', 'projects.create', 'projects.edit', 'projects.export',
    'boq.view', 'boq.create', 'boq.edit', 'boq.export',
    'drawings.view', 'drawings.upload',
    'ai.analyze', 'ai.quantity_takeoff',
    'calculators.use', 'calculators.export',
    'documents.view', 'documents.create', 'documents.sign',
    'clients.manage', 'tenders.manage',
    'users.view'
  ],

  ESTIMATOR: [
    'projects.view',
    'boq.view', 'boq.create', 'boq.edit', 'boq.export',
    'drawings.view', 'drawings.upload',
    'ai.analyze', 'ai.quantity_takeoff',
    'calculators.use', 'calculators.export',
    'documents.view'
  ],

  ENGINEER: [
    'projects.view', 'projects.edit',
    'boq.view', 'boq.export',
    'drawings.view', 'drawings.upload',
    'ai.analyze', 'ai.eurocode',
    'calculators.use', 'calculators.export',
    'documents.view', 'documents.create'
  ],

  STAFF: [
    'projects.view',
    'boq.view',
    'drawings.view',
    'calculators.use',
    'documents.view',
    'website.view'
  ],

  VIEWER: [
    'projects.view',
    'boq.view',
    'drawings.view',
    'documents.view',
    'website.view'
  ]
};

export class PermissionService {
  /**
   * Check if a given role has a specific permission
   */
  static hasPermission(role: TenantRole | string, permission: PermissionKey, customPermissions?: string[] | null): boolean {
    if (role === 'SUPER_ADMIN') return true;

    // Check custom explicit overrides
    if (customPermissions && Array.isArray(customPermissions)) {
      if (customPermissions.includes(permission)) return true;
      if (customPermissions.includes(`!${permission}`)) return false;
    }

    const assigned = ROLE_PERMISSIONS_MATRIX[role as TenantRole];
    if (!assigned) return false;
    return assigned.includes(permission);
  }

  /**
   * Get all permission keys granted to a role
   */
  static getPermissionsForRole(role: TenantRole | string): PermissionKey[] {
    return ROLE_PERMISSIONS_MATRIX[role as TenantRole] || [];
  }

  /**
   * Check if user has Super Admin authority
   */
  static isSuperAdmin(role: TenantRole | string, userEmail?: string | null): boolean {
    if (role === 'SUPER_ADMIN') return true;
    if (userEmail && (
      userEmail.toLowerCase() === 'admin@madeccgroup.online' || 
      userEmail.toLowerCase() === 'kreboya603@gmail.com' ||
      userEmail.toLowerCase().endsWith('@madecccloud.com')
    )) {
      return true;
    }
    return false;
  }
}
