import { SaaSPlan, DirectPaymentConfig, PlanCode, SubscriptionStatus, PaymentMethodCode } from '../types.ts';

export const DIRECT_PAYMENT_CONFIG: DirectPaymentConfig = {
  momoNumbers: [
    '+237671063511',
    '+237683316486'
  ],
  orangeMoneyNumbers: [
    '+237689115595',
    '+237640194505'
  ],
  bankAccount: {
    accountName: 'MADECC GROUP SAAS / DIRECT SERVICES',
    bankName: 'UBA Cameroon / Afriland First Bank',
    accountNumber: 'CM21 10005 00012 34567890123 45',
    ibanOrSwift: 'UNAFCMCXXXX'
  },
  contactWhatsApp: '+237671063511',
  contactEmail: 'billing@madeccgroup.online'
};

export const DEFAULT_PLANS: SaaSPlan[] = [
  {
    id: 1,
    code: 'STARTER',
    name: 'Starter Construction Portal',
    description: 'Perfect for small construction contractors, craft teams, and specialized site builders.',
    monthlyPrice: 50000,
    annualPrice: 500000, // 2 months free on annual
    currency: 'XAF',
    maxUsers: 3,
    maxProjects: 5,
    maxStorageGb: 5,
    aiCreditsMonthly: 100,
    features: [
      'Basic Construction Company Website',
      'Client Quote Intake System',
      'Standard BOQ Studio (up to 5 active projects)',
      'Basic Labor Cost Calculator',
      '5 GB Cloud Storage',
      '100 AI Estimation Credits/month',
      'Standard Email & WhatsApp Support'
    ],
    isPopular: false,
    status: 'ACTIVE',
    displayOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    code: 'PROFESSIONAL',
    name: 'Professional Engineering Suite',
    description: 'Designed for growing civil engineering firms, general contractors, and project consultancies.',
    monthlyPrice: 100000,
    annualPrice: 1000000,
    currency: 'XAF',
    maxUsers: 10,
    maxProjects: 25,
    maxStorageGb: 25,
    aiCreditsMonthly: 500,
    features: [
      'Full Dynamic White-Label Website & CMS',
      'Complete BOQ Studio with Revision Tree',
      'AI CAD/Drawing Takeoff Studio (Auto-Quantities)',
      'EN 1992 Eurocode 2 Structural Calculator',
      'Document Studio (Contracts, IPCs, Receipts with QR)',
      'Social Media Studio Multi-Platform Publisher',
      'Enterprise Staff & Subcontractor RBAC',
      '25 GB Cloud Storage',
      '500 AI Quantity Takeoff Credits/month',
      'Priority Phone & WhatsApp Support'
    ],
    isPopular: true,
    status: 'ACTIVE',
    displayOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    code: 'ENTERPRISE',
    name: 'Enterprise Cloud ERP',
    description: 'Comprehensive platform for premier construction groups, developers, and multinational builders.',
    monthlyPrice: 250000,
    annualPrice: 2500000,
    currency: 'XAF',
    maxUsers: -1, // Unlimited
    maxProjects: -1, // Unlimited
    maxStorageGb: 100,
    aiCreditsMonthly: 5000,
    features: [
      'Unlimited Users, Engineers & Project Managers',
      'Unlimited Concurrent Construction Projects',
      'Custom Domain Support (e.g., yourcompany.com)',
      'Full White-Label Branding (Zero MADECC references)',
      'Advanced AI Quantity Takeoff & Drawing Analysis',
      'Full ERP Hub (Inventory, Change Orders, Site Daily Logs)',
      'Dedicated Cloud Database & Storage Partition',
      'Custom Eurocode & Local Parametric Libraries',
      '100 GB High-Speed Storage',
      '24/7 Dedicated Account Director & Engineering Support'
    ],
    isPopular: false,
    status: 'ACTIVE',
    displayOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export class SubscriptionService {
  private static cachedPlans: SaaSPlan[] = DEFAULT_PLANS;
  private static cachedConfig: DirectPaymentConfig = DIRECT_PAYMENT_CONFIG;

  /**
   * Fetch available plans from backend with fallback
   */
  static async fetchPlansFromApi(): Promise<SaaSPlan[]> {
    try {
      const res = await fetch('/api/saas/plans');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedPlans = data;
          return data;
        }
      }
    } catch (e) {
      console.warn('[FETCH_PLANS_WARN]', e);
    }
    return this.cachedPlans;
  }

  /**
   * Synchronous plan getter
   */
  static getPlans(): SaaSPlan[] {
    return this.cachedPlans;
  }

  /**
   * Get plan details by code
   */
  static getPlanByCode(code: PlanCode | string): SaaSPlan {
    const match = this.cachedPlans.find(p => p.code.toUpperCase() === code.toUpperCase());
    return match || this.cachedPlans[0] || DEFAULT_PLANS[0];
  }

  /**
   * Format price in FCFA currency
   */
  static formatPrice(amount: number, currency: string = 'XAF'): string {
    return `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`;
  }

  /**
   * Fetch payment configuration from API
   */
  static async fetchPaymentConfigFromApi(): Promise<DirectPaymentConfig> {
    try {
      const res = await fetch('/api/saas/payment-config');
      if (res.ok) {
        const data = await res.json();
        this.cachedConfig = data;
        return data;
      }
    } catch (e) {
      console.warn('[FETCH_CONFIG_WARN]', e);
    }
    return this.cachedConfig;
  }

  /**
   * Get direct payment instructions
   */
  static getPaymentConfig(): DirectPaymentConfig {
    return this.cachedConfig;
  }

  /**
   * Submit subscription payment
   */
  static async submitPayment(payload: {
    tenantId: number;
    planCode: string;
    billingCycle: 'MONTHLY' | 'ANNUAL';
    amount: number;
    currency?: string;
    paymentMethod: string;
    paymentReference: string;
    senderPhone?: string;
    notes?: string;
  }) {
    const res = await fetch('/api/saas/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  /**
   * Confirm subscription payment
   */
  static async confirmPayment(subscriptionId: number, confirmedBy?: string) {
    const res = await fetch(`/api/saas/subscriptions/${subscriptionId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedBy })
    });
    return res.json();
  }

  /**
   * Save updated payment config
   */
  static async savePaymentConfig(config: Partial<DirectPaymentConfig>) {
    const res = await fetch('/api/saas/payment-config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    const data = await res.json();
    if (data?.config) {
      this.cachedConfig = data.config;
    }
    return data;
  }
}
