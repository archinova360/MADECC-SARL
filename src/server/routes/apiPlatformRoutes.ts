import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from '../../db/index.ts';
import { 
  apiProducts, 
  apiPlans, 
  apiCustomers, 
  apiAccessRequests, 
  apiPaymentTransactions, 
  apiEntitlements, 
  apiKeys, 
  apiRequestsLog, 
  apiPlatformAuditLogs,
  siteSettings 
} from '../../db/schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin } from '../../middleware/auth.ts';

const router = express.Router();

// =========================================================================
// HELPER: Hash Secrets with SHA-256
// =========================================================================
function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

// =========================================================================
// MIDDLEWARE: Verify Developer API Key & Enforce Rate Limits + Quotas
// =========================================================================
export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const apiKeyHeader = (req.headers['x-api-key'] as string) || (req.headers['authorization']?.replace('Bearer ', ''));

  if (!apiKeyHeader) {
    return res.status(401).json({
      error: 'Unauthorized: Missing API Key. Provide key via X-API-Key or Authorization Bearer header.',
      documentation: 'https://madeccgroup.online/developers'
    });
  }

  try {
    // Find key in database
    const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.keyId, apiKeyHeader.trim())).limit(1);

    if (!keyRecord) {
      return res.status(401).json({ error: 'Unauthorized: Invalid API key.' });
    }

    if (keyRecord.status !== 'ACTIVE') {
      return res.status(403).json({ error: `Forbidden: API key is ${keyRecord.status.toLowerCase()}. Contact support.` });
    }

    // Check expiration
    if (keyRecord.expiresAt && new Date(keyRecord.expiresAt) < new Date()) {
      return res.status(403).json({ error: 'Forbidden: API key has expired. Please renew your subscription.' });
    }

    // Check customer entitlement quota
    const [entitlement] = await db.select().from(apiEntitlements)
      .where(and(eq(apiEntitlements.customerId, keyRecord.customerId), eq(apiEntitlements.status, 'ACTIVE')))
      .limit(1);

    if (entitlement && !entitlement.isUnlimited && entitlement.monthlyQuota > 0) {
      if (entitlement.quotaUsedThisMonth >= entitlement.monthlyQuota) {
        return res.status(429).json({
          error: 'Rate Limit Exceeded: Monthly request quota depleted. Upgrade your plan at https://madeccgroup.online/developers',
          quota: entitlement.monthlyQuota,
          used: entitlement.quotaUsedThisMonth
        });
      }
    }

    // Attach key and customer info to request
    (req as any).apiKeyRecord = keyRecord;
    (req as any).apiEntitlement = entitlement;

    // Log request on finish
    res.on('finish', async () => {
      const latency = Date.now() - startTime;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const ipHash = crypto.createHash('md5').update(ip).digest('hex').substring(0, 10);

      try {
        await db.insert(apiRequestsLog).values({
          keyId: keyRecord.keyId,
          customerEmail: keyRecord.customerEmail,
          endpoint: req.baseUrl + req.path,
          method: req.method,
          statusCode: res.statusCode,
          latencyMs: latency,
          ipHash,
          userAgent: req.headers['user-agent']?.substring(0, 200) || 'unknown',
          requestSize: Number(req.headers['content-length'] || 0),
          responseSize: 0,
        });

        // Increment monthly usage
        if (entitlement) {
          await db.update(apiEntitlements)
            .set({ 
              quotaUsedThisMonth: sql`${apiEntitlements.quotaUsedThisMonth} + 1`,
              updatedAt: new Date()
            })
            .where(eq(apiEntitlements.id, entitlement.id));
        }

        // Update key last used timestamp
        await db.update(apiKeys)
          .set({ 
            lastUsedAt: new Date(), 
            lastUsedIp: ipHash 
          })
          .where(eq(apiKeys.id, keyRecord.id));
      } catch (logErr) {
        console.error('Error logging API telemetry:', logErr);
      }
    });

    next();
  } catch (err: any) {
    console.error('API key auth error:', err);
    return res.status(500).json({ error: 'Internal server error validating API credentials.' });
  }
}

// =========================================================================
// 1. PUBLIC API CATALOG & PRICING DISCOVERY
// =========================================================================

// GET /api/v1/products — List all API products
router.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await db.select().from(apiProducts).where(eq(apiProducts.enabled, true));
    return res.json({ success: true, count: products.length, products });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch API products' });
  }
});

// GET /api/v1/products/:slug — Get single API product with documentation
router.get('/products/:slug', async (req: Request, res: Response) => {
  try {
    const [product] = await db.select().from(apiProducts).where(eq(apiProducts.slug, req.params.slug)).limit(1);
    if (!product) {
      return res.status(404).json({ error: 'API product not found' });
    }
    return res.json({ success: true, product });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch API product details' });
  }
});

// GET /api/v1/plans — List all subscription tiers
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await db.select().from(apiPlans).where(eq(apiPlans.active, true)).orderBy(apiPlans.displayOrder);
    return res.json({ success: true, count: plans.length, plans });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch API plans' });
  }
});

// GET /api/v1/company-payment-config — Returns official payment channels
router.get('/company-payment-config', async (req: Request, res: Response) => {
  try {
    const [settings] = await db.select().from(siteSettings).limit(1);
    return res.json({
      success: true,
      company: settings?.siteName || 'MADECC Group',
      developer: settings?.developerName || 'Kasah Rodrick Reboya',
      location: settings?.officeAddressYaounde || 'Yaoundé, Cameroon',
      emails: {
        primary: settings?.email || 'madecccons@gmail.com',
        secondary: settings?.secondaryEmail || 'Infomadeccconstruction@gmail.com'
      },
      phones: {
        primary: settings?.phone || '+237 671 063 511',
        secondary: settings?.phoneSecondary || '+237 683 316 486',
        tertiary: settings?.phoneTertiary || '+237 640 194 505'
      },
      whatsapp: {
        primary: settings?.whatsappNumber || '+237 683 316 486',
        secondary: settings?.whatsappSecondary || '+237 671 063 511'
      },
      paymentNumbers: {
        mtnMobileMoney: ['671063511', '683316486', '671289643'],
        orangeMoney: ['689115595', '640194505']
      },
      currency: 'XAF',
      paymentInstructions: settings?.paymentInstructions || 'Send payment to any listed MTN MoMo or Orange Money number and submit your transaction reference ID.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch payment config' });
  }
});

// =========================================================================
// 2. DEVELOPER ONBOARDING & PURCHASE CHECKOUT
// =========================================================================

// POST /api/v1/checkout/request-access — Submit paid plan or sandbox purchase
router.post('/checkout/request-access', async (req: Request, res: Response) => {
  try {
    const {
      developerName,
      companyName,
      contactEmail,
      contactPhone,
      websiteUrl,
      useCaseDescription,
      planCode,
      productSlug,
      paymentMethod,
      transactionReference,
      payerPhone,
      payerName,
      paymentReceiptUrl
    } = req.body;

    if (!developerName || !companyName || !contactEmail || !planCode || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields: developerName, companyName, contactEmail, planCode, paymentMethod.' });
    }

    // Verify Plan exists
    const [plan] = await db.select().from(apiPlans).where(eq(apiPlans.code, planCode)).limit(1);
    if (!plan) {
      return res.status(400).json({ error: `Invalid plan code: ${planCode}` });
    }

    // 1. Find or create Customer profile
    let [customer] = await db.select().from(apiCustomers).where(eq(apiCustomers.contactEmail, contactEmail.toLowerCase().trim())).limit(1);

    if (!customer) {
      const [newCust] = await db.insert(apiCustomers).values({
        userId: (req as any).user?.uid || `cust_${Date.now()}`,
        developerName,
        companyName,
        contactEmail: contactEmail.toLowerCase().trim(),
        contactPhone: contactPhone || '',
        websiteUrl: websiteUrl || '',
        useCaseDescription: useCaseDescription || '',
        country: 'Cameroon',
        status: 'ACTIVE'
      }).returning();
      customer = newCust;
    }

    // 2. Create Access Request
    const requestId = `REQ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const isFreeSandbox = plan.price === 0;

    const [accessRequest] = await db.insert(apiAccessRequests).values({
      requestId,
      customerId: customer.id,
      customerEmail: customer.contactEmail,
      customerName: developerName,
      companyName,
      planCode: plan.code,
      productSlug: productSlug || 'all-engineering-apis',
      amount: plan.price,
      currency: plan.currency,
      paymentMethod,
      transactionReference: transactionReference || (isFreeSandbox ? 'FREE_SANDBOX_EVALUATION' : 'PENDING_VERIFICATION'),
      payerPhone: payerPhone || contactPhone || '',
      payerName: payerName || developerName,
      paymentReceiptUrl: paymentReceiptUrl || null,
      status: isFreeSandbox ? 'APPROVED' : 'PENDING',
      adminNotes: isFreeSandbox ? 'Auto-approved Developer Sandbox tier' : 'Awaiting manual MTN/Orange MoMo verification',
      reviewedBy: isFreeSandbox ? 'SYSTEM_AUTO_PROVISIONER' : null,
      reviewedAt: isFreeSandbox ? new Date() : null
    }).returning();

    // 3. If Free Sandbox, immediately provision Entitlement & First API Key
    let generatedKey = null;
    if (isFreeSandbox) {
      // Create entitlement
      const [entitlement] = await db.insert(apiEntitlements).values({
        customerId: customer.id,
        customerEmail: customer.contactEmail,
        planCode: plan.code,
        permissions: plan.permissions || ['boq:calculate', 'budget:calculate', 'concrete:calculate', 'costs:read'],
        rateLimitPerMinute: plan.rateLimitPerMinute,
        monthlyQuota: plan.monthlyQuota,
        quotaUsedThisMonth: 0,
        isUnlimited: false,
        status: 'ACTIVE',
        approvedBy: 'SYSTEM_SANDBOX_AUTO_PROVISIONER'
      }).returning();

      // Generate key pair
      const keyId = `mk_live_${crypto.randomBytes(16).toString('hex')}`;
      const secret = `sec_live_${crypto.randomBytes(24).toString('hex')}`;
      const secretHash = hashSecret(secret);
      const secretPrefix = secret.substring(0, 14) + '...';

      const [newKey] = await db.insert(apiKeys).values({
        customerId: customer.id,
        customerEmail: customer.contactEmail,
        name: 'Default Sandbox Evaluation Key',
        keyId,
        secretHash,
        secretPrefix,
        environment: 'sandbox',
        permissions: plan.permissions || ['boq:calculate'],
        rateLimitPerMinute: plan.rateLimitPerMinute,
        monthlyQuota: plan.monthlyQuota,
        status: 'ACTIVE'
      }).returning();

      generatedKey = {
        id: newKey.id,
        keyId: newKey.keyId,
        secret, // Plaintext returned ONLY once
        secretPrefix: newKey.secretPrefix,
        environment: newKey.environment,
        monthlyQuota: newKey.monthlyQuota,
        rateLimitPerMinute: newKey.rateLimitPerMinute
      };
    } else {
      // Record transaction
      const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.insert(apiPaymentTransactions).values({
        transactionId: txnId,
        accessRequestId: accessRequest.id,
        customerEmail: customer.contactEmail,
        amount: plan.price,
        currency: plan.currency,
        paymentMethod,
        transactionRef: transactionReference || 'PENDING',
        payerPhone: payerPhone || '',
        payerName: payerName || developerName,
        receiptUrl: paymentReceiptUrl || null,
        status: 'PENDING'
      });
    }

    return res.status(201).json({
      success: true,
      message: isFreeSandbox 
        ? 'Sandbox tier approved! Your API Key has been generated. Save your secret token securely.' 
        : 'Payment access request submitted successfully. The MADECC Admin team will verify your transaction reference and approve access promptly.',
      requestId,
      status: accessRequest.status,
      generatedKey,
      contactSupport: {
        whatsapp: '+237 683 316 486',
        email: 'madecccons@gmail.com'
      }
    });
  } catch (err: any) {
    console.error('Error creating access request:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit access request' });
  }
});

// GET /api/v1/developer/me — Developer profile, entitlements, and keys
router.get('/developer/me', async (req: Request, res: Response) => {
  try {
    const email = (req.query.email as string)?.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ error: 'Missing email query parameter' });
    }

    const [customer] = await db.select().from(apiCustomers).where(eq(apiCustomers.contactEmail, email)).limit(1);
    if (!customer) {
      return res.json({ success: true, customer: null, entitlements: [], keys: [], requests: [] });
    }

    const entitlements = await db.select().from(apiEntitlements).where(eq(apiEntitlements.customerId, customer.id));
    const keys = await db.select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyId: apiKeys.keyId,
      secretPrefix: apiKeys.secretPrefix,
      environment: apiKeys.environment,
      permissions: apiKeys.permissions,
      rateLimitPerMinute: apiKeys.rateLimitPerMinute,
      monthlyQuota: apiKeys.monthlyQuota,
      status: apiKeys.status,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt
    }).from(apiKeys).where(eq(apiKeys.customerId, customer.id)).orderBy(desc(apiKeys.createdAt));

    const requests = await db.select().from(apiAccessRequests)
      .where(eq(apiAccessRequests.customerId, customer.id))
      .orderBy(desc(apiAccessRequests.requestedAt));

    // Get 30-day usage summary
    const [usageCount] = await db.select({ count: sql<number>`count(*)` })
      .from(apiRequestsLog)
      .where(eq(apiRequestsLog.customerEmail, customer.contactEmail));

    return res.json({
      success: true,
      customer,
      entitlements,
      keys,
      requests,
      totalRequestsServed: Number(usageCount?.count || 0)
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch developer profile' });
  }
});

// POST /api/v1/developer/keys/generate — Developer creates additional API Key
router.post('/developer/keys/generate', async (req: Request, res: Response) => {
  try {
    const { email, keyName, environment } = req.body;
    if (!email || !keyName) {
      return res.status(400).json({ error: 'Missing required parameters: email, keyName' });
    }

    const [customer] = await db.select().from(apiCustomers).where(eq(apiCustomers.contactEmail, email.toLowerCase().trim())).limit(1);
    if (!customer) {
      return res.status(404).json({ error: 'Developer profile not found.' });
    }

    // Check active entitlement
    const [entitlement] = await db.select().from(apiEntitlements)
      .where(and(eq(apiEntitlements.customerId, customer.id), eq(apiEntitlements.status, 'ACTIVE')))
      .limit(1);

    if (!entitlement) {
      return res.status(403).json({ error: 'You do not have an active subscription or entitlement. Request access first.' });
    }

    // Generate cryptographic tokens
    const keyId = `mk_live_${crypto.randomBytes(16).toString('hex')}`;
    const secret = `sec_live_${crypto.randomBytes(24).toString('hex')}`;
    const secretHash = hashSecret(secret);
    const secretPrefix = secret.substring(0, 14) + '...';

    const [newKey] = await db.insert(apiKeys).values({
      customerId: customer.id,
      customerEmail: customer.contactEmail,
      name: keyName,
      keyId,
      secretHash,
      secretPrefix,
      environment: environment === 'sandbox' ? 'sandbox' : 'production',
      permissions: entitlement.permissions,
      rateLimitPerMinute: entitlement.rateLimitPerMinute,
      monthlyQuota: entitlement.monthlyQuota,
      status: 'ACTIVE'
    }).returning();

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully. Copy your secret key now; it will NEVER be displayed again.',
      key: {
        id: newKey.id,
        keyId: newKey.keyId,
        secret, // Plaintext secret returned ONCE
        secretPrefix: newKey.secretPrefix,
        name: newKey.name,
        environment: newKey.environment,
        status: newKey.status,
        createdAt: newKey.createdAt
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate API Key' });
  }
});

// POST /api/v1/developer/keys/:id/revoke — Developer revokes a key
router.post('/developer/keys/:id/revoke', async (req: Request, res: Response) => {
  try {
    const keyId = Number(req.params.id);
    const { email } = req.body;

    const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
    if (!keyRecord) {
      return res.status(404).json({ error: 'Key not found' });
    }

    if (keyRecord.customerEmail !== email?.toLowerCase().trim()) {
      return res.status(403).json({ error: 'Unauthorized to revoke this key' });
    }

    await db.update(apiKeys)
      .set({ status: 'REVOKED', updatedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    return res.json({ success: true, message: 'API Key successfully revoked.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to revoke key' });
  }
});

// =========================================================================
// 3. CORE VERSIONED PAID API ENDPOINTS (Secured with authenticateApiKey)
// =========================================================================

// POST /api/v1/boq/calculate — Smart BOQ & Rate Breakdown Engine
router.post('/boq/calculate', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const {
      projectType = 'Residential Villa (R+1)',
      builtUpArea = 250, // m²
      numberOfFloors = 2,
      finishesLevel = 'STANDARD', // 'ECONOMY', 'STANDARD', 'LUXURY', 'HIGH_TECH'
      location = 'Yaoundé',
      currency = 'XAF'
    } = req.body;

    // Standard Central African parametric cost rates per m²
    const baseRates: Record<string, number> = {
      ECONOMY: 185000,
      STANDARD: 265000,
      LUXURY: 420000,
      HIGH_TECH: 650000
    };

    const multiplier = baseRates[finishesLevel] || 265000;
    const baseTotal = builtUpArea * multiplier;

    // Structural trade distribution
    const sections = [
      {
        code: 'SEC-01',
        title: 'Substructure & Earthworks (Foundations, Hardcore, DPC)',
        percent: 18,
        amount: Math.round(baseTotal * 0.18),
        items: [
          { item: '1.01', description: 'Site clearance, leveling, and topsoil excavation', unit: 'm²', qty: builtUpArea * 1.3, rate: 2500, total: Math.round(builtUpArea * 1.3 * 2500) },
          { item: '1.02', description: 'Trench excavation in firm clay/laterite soil (depth 1.2m)', unit: 'm³', qty: builtUpArea * 0.45, rate: 8500, total: Math.round(builtUpArea * 0.45 * 8500) },
          { item: '1.03', description: 'Mass concrete blinding C15/20 under footing (50mm)', unit: 'm³', qty: builtUpArea * 0.05, rate: 75000, total: Math.round(builtUpArea * 0.05 * 75000) },
          { item: '1.04', description: 'Reinforced concrete foundation footings C25/30', unit: 'm³', qty: builtUpArea * 0.12, rate: 165000, total: Math.round(builtUpArea * 0.12 * 165000) }
        ]
      },
      {
        code: 'SEC-02',
        title: 'Superstructure Reinforced Concrete (Columns, Beams, Slabs)',
        percent: 32,
        amount: Math.round(baseTotal * 0.32),
        items: [
          { item: '2.01', description: 'Vibrated reinforced concrete C25/30 for columns & beams', unit: 'm³', qty: builtUpArea * 0.22, rate: 175000, total: Math.round(builtUpArea * 0.22 * 175000) },
          { item: '2.02', description: 'High-yield deformed reinforcement steel bars (FeE500)', unit: 'Ton', qty: Number(((builtUpArea * 0.038)).toFixed(2)), rate: 880000, total: Math.round(builtUpArea * 0.038 * 880000) },
          { item: '2.03', description: 'Formwork & marine plywood falsework to beams/slabs', unit: 'm²', qty: builtUpArea * 1.8, rate: 6500, total: Math.round(builtUpArea * 1.8 * 6500) }
        ]
      },
      {
        code: 'SEC-03',
        title: 'Masonry & Wall Enclosures (15cm/20cm Hollow Concrete Blocks)',
        percent: 15,
        amount: Math.round(baseTotal * 0.15),
        items: [
          { item: '3.01', description: '20x20x40cm hollow concrete blockwork laid in 1:4 cement mortar', unit: 'm²', qty: builtUpArea * 1.6, rate: 9500, total: Math.round(builtUpArea * 1.6 * 9500) },
          { item: '3.02', description: '15x20x40cm partition blockwork to wet areas and bedrooms', unit: 'm²', qty: builtUpArea * 0.9, rate: 8500, total: Math.round(builtUpArea * 0.9 * 8500) }
        ]
      },
      {
        code: 'SEC-04',
        title: 'Roofing, Waterproofing & Thermal Insulation',
        percent: 12,
        amount: Math.round(baseTotal * 0.12),
        items: [
          { item: '4.01', description: 'Treated Iroko/Sapelli timber truss framework and purlins', unit: 'm²', qty: builtUpArea * 0.7, rate: 14000, total: Math.round(builtUpArea * 0.7 * 14000) },
          { item: '4.02', description: 'Aluminum-Zinc corrugated prepainted roofing sheets (0.50mm)', unit: 'm²', qty: builtUpArea * 0.85, rate: 11500, total: Math.round(builtUpArea * 0.85 * 11500) }
        ]
      },
      {
        code: 'SEC-05',
        title: 'MEP (Plumbing, Sanitary, Electrical & Air Conditioning)',
        percent: 13,
        amount: Math.round(baseTotal * 0.13),
        items: [
          { item: '5.01', description: 'Complete 3-phase electrical installation with Schneider breakers', unit: 'Lot', qty: 1, rate: Math.round(baseTotal * 0.07), total: Math.round(baseTotal * 0.07) },
          { item: '5.02', description: 'PPR cold/hot water supply distribution & PVC drainage', unit: 'Lot', qty: 1, rate: Math.round(baseTotal * 0.06), total: Math.round(baseTotal * 0.06) }
        ]
      },
      {
        code: 'SEC-06',
        title: 'Architectural Finishes (Tiling, Plastering, Painting, Glazing)',
        percent: 10,
        amount: Math.round(baseTotal * 0.10),
        items: [
          { item: '6.01', description: 'Vitrified porcelain floor tiles (60x60cm) with adhesive mortar', unit: 'm²', qty: builtUpArea * 0.95, rate: 13500, total: Math.round(builtUpArea * 0.95 * 13500) },
          { item: '6.02', description: 'Interior/Exterior cement plastering & washable satin emulsion paint', unit: 'm²', qty: builtUpArea * 3.2, rate: 4500, total: Math.round(builtUpArea * 3.2 * 4500) }
        ]
      }
    ];

    const grandTotal = sections.reduce((acc, s) => acc + s.amount, 0);

    return res.json({
      success: true,
      apiVersion: 'v1.0.0',
      timestamp: new Date().toISOString(),
      parameters: {
        projectType,
        builtUpArea: `${builtUpArea} m²`,
        numberOfFloors,
        finishesLevel,
        location,
        currency
      },
      summary: {
        currency,
        subtotal: grandTotal,
        contingency: Math.round(grandTotal * 0.05),
        overheads: Math.round(grandTotal * 0.08),
        contractorProfit: Math.round(grandTotal * 0.10),
        taxVat: Math.round(grandTotal * 0.1925),
        estimatedTurnkeyCost: Math.round(grandTotal * 1.4225),
        estimatedCostPerM2: Math.round((grandTotal * 1.4225) / builtUpArea)
      },
      sections
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'BOQ calculation engine failed' });
  }
});

// POST /api/v1/concrete/calculate-mix — Eurocode 2 Concrete Batching
router.post('/concrete/calculate-mix', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const {
      concreteGrade = 'C25/30', // 'C20/25', 'C25/30', 'C30/37', 'C35/45'
      volumeM3 = 10,
      exposureClass = 'XC2', // 'X0', 'XC1', 'XC2', 'XC3', 'XC4', 'XS1', 'XD1'
      cementType = 'CEM II/B-P 42.5R',
      slumpClass = 'S3 (100-150mm)'
    } = req.body;

    const gradeParams: Record<string, { fck: number; fckCube: number; cementKgPerM3: number; waterCementRatio: number; sandKg: number; gravelKg: number }> = {
      'C20/25': { fck: 20, fckCube: 25, cementKgPerM3: 320, waterCementRatio: 0.58, sandKg: 680, gravelKg: 1180 },
      'C25/30': { fck: 25, fckCube: 30, cementKgPerM3: 360, waterCementRatio: 0.50, sandKg: 650, gravelKg: 1200 },
      'C30/37': { fck: 30, fckCube: 37, cementKgPerM3: 400, waterCementRatio: 0.45, sandKg: 620, gravelKg: 1220 },
      'C35/45': { fck: 35, fckCube: 45, cementKgPerM3: 440, waterCementRatio: 0.40, sandKg: 600, gravelKg: 1240 }
    };

    const target = gradeParams[concreteGrade] || gradeParams['C25/30'];
    const totalCementKg = Math.round(target.cementKgPerM3 * volumeM3);
    const totalBags50Kg = Math.ceil(totalCementKg / 50);
    const totalWaterLitres = Math.round(totalCementKg * target.waterCementRatio);
    const totalSandTonnes = Number(((target.sandKg * volumeM3) / 1000).toFixed(2));
    const totalGravelTonnes = Number(((target.gravelKg * volumeM3) / 1000).toFixed(2));

    return res.json({
      success: true,
      standard: 'EN 1992-1-1 (Eurocode 2) & NF EN 206-1',
      parameters: {
        concreteGrade,
        volumeM3: `${volumeM3} m³`,
        exposureClass,
        cementType,
        slumpClass
      },
      mixDesignPerM3: {
        cementKg: target.cementKgPerM3,
        waterLitres: Math.round(target.cementKgPerM3 * target.waterCementRatio),
        waterCementRatio: target.waterCementRatio,
        sandDryKg: target.sandKg,
        aggregateGravelKg: target.gravelKg,
        densityKgPerM3: target.cementKgPerM3 + Math.round(target.cementKgPerM3 * target.waterCementRatio) + target.sandKg + target.gravelKg
      },
      batchTotalRequirement: {
        volumeM3,
        cementKg: totalCementKg,
        cementBags50kg: totalBags50Kg,
        waterLitres: totalWaterLitres,
        sandTonnes: totalSandTonnes,
        gravelTonnes: totalGravelTonnes
      },
      structuralStrengthTimeline: {
        day3StrengthMpa: Number((target.fck * 0.45).toFixed(1)),
        day7StrengthMpa: Number((target.fck * 0.70).toFixed(1)),
        day28CharacteristicStrengthFck: `${target.fck} MPa (Cylinder) / ${target.fckCube} MPa (Cube)`
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Concrete mix calculation failed' });
  }
});

// POST /api/v1/reinforcement/calculate — Rebar Detailing & Tonnage
router.post('/reinforcement/calculate', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const {
      elementType = 'BEAM', // 'BEAM', 'COLUMN', 'SLAB', 'FOOTING'
      spanOrHeightMeters = 6.0,
      widthMm = 200,
      depthMm = 450,
      mainBarDiameterMm = 16,
      mainBarCount = 4,
      stirrupDiameterMm = 8,
      stirrupSpacingMm = 150,
      quantityOfElements = 8
    } = req.body;

    // Unit mass per meter of steel: kg/m = d² / 162
    const getUnitWeightKgM = (dia: number) => (dia * dia) / 162;

    const mainBarLengthM = spanOrHeightMeters + 0.6; // Lap/anchorage allowance
    const totalMainBarLengthM = mainBarLengthM * mainBarCount * quantityOfElements;
    const mainBarWeightKg = totalMainBarLengthM * getUnitWeightKgM(mainBarDiameterMm);

    // Stirrup perimeter
    const stirrupPerimeterM = ((widthMm - 60) * 2 + (depthMm - 60) * 2 + 150) / 1000;
    const stirrupsPerElement = Math.ceil((spanOrHeightMeters * 1000) / stirrupSpacingMm) + 1;
    const totalStirrupLengthM = stirrupPerimeterM * stirrupsPerElement * quantityOfElements;
    const stirrupWeightKg = totalStirrupLengthM * getUnitWeightKgM(stirrupDiameterMm);

    const totalWeightKg = mainBarWeightKg + stirrupWeightKg;
    const totalWithWastageTonnes = Number(((totalWeightKg * 1.05) / 1000).toFixed(3)); // 5% scrap allowance

    return res.json({
      success: true,
      codeStandard: 'EN 1992-1-1 / BS 8666 Scheduling',
      element: {
        elementType,
        geometry: `${widthMm}mm x ${depthMm}mm x ${spanOrHeightMeters}m`,
        quantity: quantityOfElements
      },
      scheduleBreakdown: [
        {
          type: 'Longitudinal High-Yield Rebar (FeE500)',
          barSize: `HA${mainBarDiameterMm}`,
          countPerElement: mainBarCount,
          cutLengthMeters: Number(mainBarLengthM.toFixed(2)),
          totalLengthMeters: Number(totalMainBarLengthM.toFixed(1)),
          unitWeightKgM: Number(getUnitWeightKgM(mainBarDiameterMm).toFixed(3)),
          totalWeightKg: Math.round(mainBarWeightKg),
          standardBars12mCount: Math.ceil(totalMainBarLengthM / 12)
        },
        {
          type: 'Shear Links / Stirrups (FeE500)',
          barSize: `HA${stirrupDiameterMm}`,
          spacing: `${stirrupSpacingMm}mm c/c`,
          cutLengthMeters: Number(stirrupPerimeterM.toFixed(2)),
          totalLengthMeters: Number(totalStirrupLengthM.toFixed(1)),
          unitWeightKgM: Number(getUnitWeightKgM(stirrupDiameterMm).toFixed(3)),
          totalWeightKg: Math.round(stirrupWeightKg),
          standardBars12mCount: Math.ceil(totalStirrupLengthM / 12)
        }
      ],
      totals: {
        netWeightKg: Math.round(totalWeightKg),
        wastageAllowancePercent: 5,
        totalTonnageWithWastage: totalWithWastageTonnes,
        bindingWireRolls25kg: Math.ceil(totalWithWastageTonnes * 1.5)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Reinforcement calculation failed' });
  }
});

// GET /api/v1/costs/materials — Central Africa Materials Price Index
router.get('/costs/materials', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const region = (req.query.region as string) || 'CENTRE_YAOUNDE';
    
    return res.json({
      success: true,
      effectiveDate: new Date().toISOString().split('T')[0],
      marketRegion: region,
      currency: 'XAF',
      materialsIndex: [
        { item: 'Portland Composite Cement (CPJ-35 50kg)', brand: 'CIMENCAM / DANGOTE / MIRA', unit: 'Bag (50kg)', price: 4750, trend30d: '+1.2%' },
        { item: 'High-Strength Cement (CPJ-42.5R 50kg)', brand: 'CIMENCAM ROBUS', unit: 'Bag (50kg)', price: 5200, trend30d: '0.0%' },
        { item: 'High-Yield Deformed Rebar HA12 (FeE500)', origin: 'PROMETAL / ALUCAM', unit: 'Ton (1,000kg)', price: 885000, trend30d: '+2.8%' },
        { item: 'High-Yield Deformed Rebar HA10 (FeE500)', origin: 'PROMETAL', unit: 'Ton (1,000kg)', price: 890000, trend30d: '+2.5%' },
        { item: 'Washed River Sand (Fine to Medium)', origin: 'Sanaga River Basin', unit: 'Truck (20 Ton / 14m³)', price: 165000, trend30d: '-1.5%' },
        { item: 'Crushed Basalt Gravel (15/25 Aggregates)', origin: 'Yaoundé Quarries', unit: 'Truck (20 Ton / 14m³)', price: 210000, trend30d: '+0.5%' },
        { item: 'Hollow Concrete Blocks 15x20x40cm', type: 'Vibrated Machine-Molded', unit: 'Piece', price: 380, trend30d: '0.0%' },
        { item: 'Hollow Concrete Blocks 20x20x40cm', type: 'Vibrated Machine-Molded', unit: 'Piece', price: 450, trend30d: '0.0%' },
        { item: 'Structural Sawn Timber (Ayous / Sapelli 5x15x400cm)', grade: 'Category 1 Construction Timber', unit: 'Piece', price: 4200, trend30d: '+1.0%' },
        { item: 'Corrugated Aluzinc Prepainted Roofing (0.50mm)', brand: 'ALUBASSA', unit: 'Sheet (6m)', price: 17500, trend30d: '0.0%' }
      ]
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Materials index failed' });
  }
});

// POST /api/v1/eurocode/bearing-capacity — Soil Bearing Capacity
router.post('/eurocode/bearing-capacity', authenticateApiKey, async (req: Request, res: Response) => {
  try {
    const {
      soilType = 'FIRM_LATERITIC_CLAY', // 'LOOSE_SAND', 'DENSE_SAND', 'FIRM_LATERITIC_CLAY', 'STIFF_CLAY'
      foundationDepthMeters = 1.5,
      footingWidthMeters = 1.2,
      footingLengthMeters = 1.2,
      groundWaterLevelMeters = 4.0
    } = req.body;

    const soilParameters: Record<string, { cohesionKpa: number; frictionAngleDeg: number; unitWeightKnM3: number; name: string }> = {
      LOOSE_SAND: { cohesionKpa: 0, frictionAngleDeg: 28, unitWeightKnM3: 17.5, name: 'Loose Alluvial Sand' },
      DENSE_SAND: { cohesionKpa: 0, frictionAngleDeg: 36, unitWeightKnM3: 19.5, name: 'Dense Quartz Sand' },
      FIRM_LATERITIC_CLAY: { cohesionKpa: 35, frictionAngleDeg: 22, unitWeightKnM3: 18.5, name: 'Central African Firm Lateritic Clay' },
      STIFF_CLAY: { cohesionKpa: 75, frictionAngleDeg: 18, unitWeightKnM3: 19.0, name: 'Stiff Weathered Gneissic Clay' }
    };

    const soil = soilParameters[soilType] || soilParameters.FIRM_LATERITIC_CLAY;
    // Terzaghi Meyerhof simplified calculation
    const phiRad = (soil.frictionAngleDeg * Math.PI) / 180;
    const nQ = Math.exp(Math.PI * Math.tan(phiRad)) * Math.pow(Math.tan(Math.PI / 4 + phiRad / 2), 2);
    const nC = (nQ - 1) / Math.tan(phiRad);
    const nGamma = 2 * (nQ + 1) * Math.tan(phiRad);

    const overburden = soil.unitWeightKnM3 * foundationDepthMeters;
    const qUlt = (soil.cohesionKpa * nC) + (overburden * nQ) + (0.5 * soil.unitWeightKnM3 * footingWidthMeters * nGamma);
    const factorOfSafety = 3.0;
    const qAllowableKpa = Math.round(qUlt / factorOfSafety);
    const qAllowableBars = Number((qAllowableKpa / 100).toFixed(2));

    const footingArea = footingWidthMeters * footingLengthMeters;
    const maxSafeAxialLoadKn = Math.round(qAllowableKpa * footingArea);

    return res.json({
      success: true,
      standard: 'EN 1997-1 (Eurocode 7 Geotechnical Design)',
      soilClassification: soil.name,
      parameters: {
        cohesionKpa: soil.cohesionKpa,
        internalFrictionAngle: `${soil.frictionAngleDeg}°`,
        soilUnitWeight: `${soil.unitWeightKnM3} kN/m³`,
        foundationDepth: `${foundationDepthMeters} m`,
        footingGeometry: `${footingWidthMeters}m x ${footingLengthMeters}m (Area: ${footingArea.toFixed(2)} m²)`
      },
      bearingCapacityResults: {
        ultimateBearingCapacityQult: `${Math.round(qUlt)} kPa`,
        designFactorOfSafety: factorOfSafety,
        allowableBearingCapacityQallowable: `${qAllowableKpa} kPa (${qAllowableBars} bars)`,
        maximumPermissibleAxialColumnLoad: `${maxSafeAxialLoadKn} kN (${Math.round(maxSafeAxialLoadKn / 9.81)} Tonnes)`
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Geotechnical analysis failed' });
  }
});

// =========================================================================
// 4. ADMIN MANAGEMENT & TRANSACTION VERIFICATION ENDPOINTS
// =========================================================================

// GET /api/admin/api-platform/overview — Platform-wide metrics
router.get('/admin/overview', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [totalRequests] = await db.select({ count: sql<number>`count(*)` }).from(apiRequestsLog);
    const [totalCustomers] = await db.select({ count: sql<number>`count(*)` }).from(apiCustomers);
    const [activeKeys] = await db.select({ count: sql<number>`count(*)` }).from(apiKeys).where(eq(apiKeys.status, 'ACTIVE'));
    const [pendingRequests] = await db.select({ count: sql<number>`count(*)` }).from(apiAccessRequests).where(eq(apiAccessRequests.status, 'PENDING'));

    // Revenue sum of approved transactions
    const [revenueRes] = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(apiPaymentTransactions)
      .where(eq(apiPaymentTransactions.status, 'APPROVED'));

    return res.json({
      success: true,
      stats: {
        totalRequestsServed: Number(totalRequests?.count || 0),
        totalDevelopers: Number(totalCustomers?.count || 0),
        activeApiKeys: Number(activeKeys?.count || 0),
        pendingAccessRequests: Number(pendingRequests?.count || 0),
        totalVerifiedRevenueXaf: Number(revenueRes?.total || 0)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch platform metrics' });
  }
});

// GET /api/admin/api-platform/requests — Access Requests list
router.get('/admin/requests', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const requests = await db.select().from(apiAccessRequests).orderBy(desc(apiAccessRequests.requestedAt));
    return res.json({ success: true, count: requests.length, requests });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch access requests' });
  }
});

// POST /api/admin/api-platform/requests/:id/review — Approve or Reject Request
router.post('/admin/requests/:id/review', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const requestId = Number(req.params.id);
    const { action, adminNotes } = req.body; // action: 'APPROVE' | 'REJECT'
    const adminUser = (req as any).user?.email || 'admin@madeccgroup.com';

    const [requestRecord] = await db.select().from(apiAccessRequests).where(eq(apiAccessRequests.id, requestId)).limit(1);
    if (!requestRecord) {
      return res.status(404).json({ error: 'Access request not found' });
    }

    if (action === 'APPROVE') {
      // 1. Update Access Request
      await db.update(apiAccessRequests)
        .set({
          status: 'APPROVED',
          adminNotes: adminNotes || 'Payment verified and access approved by Admin',
          reviewedBy: adminUser,
          reviewedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(apiAccessRequests.id, requestId));

      // 2. Update Transaction if linked
      await db.update(apiPaymentTransactions)
        .set({
          status: 'APPROVED',
          verifiedBy: adminUser,
          verifiedAt: new Date()
        })
        .where(eq(apiPaymentTransactions.accessRequestId, requestId));

      // 3. Provision or Upgrade Entitlement
      const [plan] = await db.select().from(apiPlans).where(eq(apiPlans.code, requestRecord.planCode)).limit(1);
      const isUnlimited = plan?.monthlyQuota === -1;

      // Check existing entitlement
      const [existingEntitlement] = await db.select().from(apiEntitlements)
        .where(eq(apiEntitlements.customerId, requestRecord.customerId!))
        .limit(1);

      if (existingEntitlement) {
        await db.update(apiEntitlements)
          .set({
            planCode: requestRecord.planCode,
            permissions: plan?.permissions || ['boq:calculate', 'budget:calculate', 'concrete:calculate', 'reinforcement:calculate', 'costs:read', 'eurocode:calculate'],
            rateLimitPerMinute: plan?.rateLimitPerMinute || 120,
            monthlyQuota: plan?.monthlyQuota || 50000,
            isUnlimited,
            status: 'ACTIVE',
            approvedBy: adminUser,
            updatedAt: new Date()
          })
          .where(eq(apiEntitlements.id, existingEntitlement.id));
      } else {
        await db.insert(apiEntitlements).values({
          customerId: requestRecord.customerId!,
          customerEmail: requestRecord.customerEmail,
          planCode: requestRecord.planCode,
          permissions: plan?.permissions || ['boq:calculate', 'budget:calculate', 'concrete:calculate', 'reinforcement:calculate', 'costs:read', 'eurocode:calculate'],
          rateLimitPerMinute: plan?.rateLimitPerMinute || 120,
          monthlyQuota: plan?.monthlyQuota || 50000,
          isUnlimited,
          status: 'ACTIVE',
          approvedBy: adminUser
        });
      }

      // 4. Provision Production API Key if none active
      const activeKeys = await db.select().from(apiKeys)
        .where(and(eq(apiKeys.customerId, requestRecord.customerId!), eq(apiKeys.status, 'ACTIVE')));

      if (activeKeys.length === 0) {
        const keyId = `mk_live_${crypto.randomBytes(16).toString('hex')}`;
        const secret = `sec_live_${crypto.randomBytes(24).toString('hex')}`;
        const secretHash = hashSecret(secret);
        const secretPrefix = secret.substring(0, 14) + '...';

        await db.insert(apiKeys).values({
          customerId: requestRecord.customerId!,
          customerEmail: requestRecord.customerEmail,
          name: 'Primary Production API Key',
          keyId,
          secretHash,
          secretPrefix,
          environment: 'production',
          permissions: plan?.permissions || ['boq:calculate', 'concrete:calculate'],
          rateLimitPerMinute: plan?.rateLimitPerMinute || 120,
          monthlyQuota: plan?.monthlyQuota || 50000,
          status: 'ACTIVE'
        });
      }

      // Log action
      await db.insert(apiPlatformAuditLogs).values({
        adminEmail: adminUser,
        action: 'APPROVE_ACCESS_REQUEST',
        targetType: 'REQUEST',
        targetId: requestRecord.requestId,
        details: `Approved access for developer ${requestRecord.customerEmail} on plan ${requestRecord.planCode}`,
        metadata: { requestId, amount: requestRecord.amount, paymentMethod: requestRecord.paymentMethod }
      });

      return res.json({ success: true, message: `Access request ${requestRecord.requestId} approved and entitlements provisioned.` });
    } else {
      // Reject
      await db.update(apiAccessRequests)
        .set({
          status: 'REJECTED',
          adminNotes: adminNotes || 'Transaction reference invalid or unverified.',
          reviewedBy: adminUser,
          reviewedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(apiAccessRequests.id, requestId));

      await db.update(apiPaymentTransactions)
        .set({
          status: 'REJECTED',
          verifiedBy: adminUser,
          verifiedAt: new Date()
        })
        .where(eq(apiPaymentTransactions.accessRequestId, requestId));

      await db.insert(apiPlatformAuditLogs).values({
        adminEmail: adminUser,
        action: 'REJECT_ACCESS_REQUEST',
        targetType: 'REQUEST',
        targetId: requestRecord.requestId,
        details: `Rejected access for developer ${requestRecord.customerEmail}: ${adminNotes || 'Unverified payment'}`,
        metadata: { requestId }
      });

      return res.json({ success: true, message: `Access request ${requestRecord.requestId} rejected.` });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to review access request' });
  }
});

// GET /api/admin/api-platform/keys — List all keys
router.get('/admin/keys', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const keys = await db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
    return res.json({ success: true, count: keys.length, keys });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch API keys' });
  }
});

// POST /api/admin/api-platform/keys/:id/toggle — Admin suspend or reactivate key
router.post('/admin/keys/:id/toggle', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const keyId = Number(req.params.id);
    const [keyRecord] = await db.select().from(apiKeys).where(eq(apiKeys.id, keyId)).limit(1);
    if (!keyRecord) {
      return res.status(404).json({ error: 'Key not found' });
    }

    const newStatus = keyRecord.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await db.update(apiKeys)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(apiKeys.id, keyId));

    const adminUser = (req as any).user?.email || 'admin@madeccgroup.com';
    await db.insert(apiPlatformAuditLogs).values({
      adminEmail: adminUser,
      action: newStatus === 'ACTIVE' ? 'ACTIVATE_KEY' : 'SUSPEND_KEY',
      targetType: 'KEY',
      targetId: keyRecord.keyId,
      details: `Admin changed status of key ${keyRecord.keyId} to ${newStatus}`,
      metadata: { keyId }
    });

    return res.json({ success: true, message: `Key status updated to ${newStatus}`, newStatus });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to toggle key status' });
  }
});

// GET /api/admin/api-platform/usage — Real-time telemetry logs
router.get('/admin/usage', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await db.select().from(apiRequestsLog).orderBy(desc(apiRequestsLog.timestamp)).limit(200);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch usage telemetry' });
  }
});

// GET /api/admin/api-platform/audit-logs — Admin Audit Logs
router.get('/admin/audit-logs', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const logs = await db.select().from(apiPlatformAuditLogs).orderBy(desc(apiPlatformAuditLogs.timestamp)).limit(100);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to fetch audit logs' });
  }
});

export default router;
