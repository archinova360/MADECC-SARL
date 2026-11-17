import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import { desc, eq, and, isNull, isNotNull, ilike, or } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import {
  users,
  siteSettings,
  businessProfiles,
  businessLegalEntities,
  registrationDocuments,
  businessDivisions,
  divisionServices,
  investors,
  investorInteractions,
  investorDocuments,
  corporateContentVersions,
  corporateShares,
  corporateAuditLogs,
  realEstateProjects,
  pharmaRegulatoryCompliance,
  corporateEnquiries,
} from '../../db/schema.ts';
import {
  AuthRequest,
  requireAuth,
  requireCorporateRoles,
  resolveEffectiveCorporateRole,
} from '../../middleware/auth.ts';
import { getCloudinary, upload } from '../storageService.ts';
import {
  sendNotificationEmail,
  sendEmail,
  buildBrandedHtmlTemplate,
} from '../mailService.ts';
import {
  REGISTRATION_STATUS_LABELS,
  LEGAL_STRUCTURE_LABELS,
  INVESTOR_STAGES,
  INVESTOR_STAGE_LABELS,
} from '../../db/ensureCorporatePlatformTables.ts';
import { CORPORATE_DESCRIPTION_DEFAULT } from '../../db/corporateDivisionsSeedData.ts';

function computeSha256FromFile(filePath: string): string | null {
  try {
    const buffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(buffer).digest('hex');
  } catch {
    return null;
  }
}

async function storeUploadedFile(file: Express.Multer.File, folder: string) {
  let fileUrl = `/uploads/${file.filename}`;
  let storageProvider = 'local';
  let storagePublicId: string | null = null;
  let storagePath: string | null = file.filename;
  const sha256Checksum = computeSha256FromFile(file.path);

  try {
    const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
    if (cloudName && apiKey && apiSecret) {
      const isVideo = file.mimetype?.startsWith('video/');
      const isImage = file.mimetype?.startsWith('image/');
      const resourceType = isVideo ? 'video' : isImage ? 'image' : 'raw';
      const result = await cloudinary.uploader.upload(file.path, {
        resource_type: resourceType,
        folder,
        use_filename: true,
        unique_filename: true,
      });
      if (result && (result.secure_url || result.url)) {
        fileUrl = result.secure_url || result.url;
        storageProvider = 'cloudinary';
        storagePublicId = result.public_id || null;
        storagePath = result.public_id || null;
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
  } catch (cloudErr: any) {
    console.warn('[CORPORATE_UPLOAD] Cloudinary upload failed, trying Supabase fallback:', cloudErr?.message || cloudErr);
  }

  if (storageProvider === 'local' && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const fileBuffer = fs.readFileSync(file.path);
      const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
      const cleanName = `${folder}/${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { error } = await supabase.storage.from(bucketName).upload(cleanName, fileBuffer, {
        contentType: file.mimetype || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      });
      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from(bucketName).getPublicUrl(cleanName);
        fileUrl = publicUrl;
        storageProvider = 'supabase';
        storagePath = cleanName;
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    } catch (supaErr: any) {
      console.warn('[CORPORATE_UPLOAD] Supabase fallback failed, retaining local disk:', supaErr?.message || supaErr);
    }
  }

  return { fileUrl, storageProvider, storagePublicId, storagePath, sha256Checksum };
}

async function logCorporateAudit(params: {
  req: AuthRequest;
  action: string;
  entityType: string;
  entityId?: number | null;
  entityTitle?: string | null;
  beforeJson?: any;
  afterJson?: any;
  details?: string;
}) {
  if (!db) return;
  try {
    await db.insert(corporateAuditLogs).values({
      actorId: params.req.dbUser?.id || null,
      actorEmail: params.req.dbUser?.email || 'system',
      actorRole: resolveEffectiveCorporateRole(params.req.dbUser),
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId || null,
      entityTitle: params.entityTitle || null,
      beforeJson: params.beforeJson || null,
      afterJson: params.afterJson || null,
      ipAddress: params.req.ip || null,
      details: params.details || null,
    });
  } catch (err: any) {
    console.error('[CORPORATE_AUDIT_ERROR]', err?.message || err);
  }
}

async function createVersionSnapshot(params: {
  entityType: string;
  entityId: number;
  versionNumber: number;
  entityTitle: string;
  changeSummary: string;
  snapshotJson: any;
  createdBy: string;
}) {
  if (!db) return;
  try {
    await db.insert(corporateContentVersions).values({
      entityType: params.entityType,
      entityId: params.entityId,
      versionNumber: params.versionNumber,
      entityTitle: params.entityTitle,
      changeSummary: params.changeSummary,
      snapshotJson: params.snapshotJson,
      createdBy: params.createdBy,
    });
  } catch (err: any) {
    console.error('[CORPORATE_VERSION_ERROR]', err?.message || err);
  }
}

function formatPublicCorporateStatus(profile: any, verifiedDocsCount: number) {
  const status = profile?.registrationStatus || 'UNREGISTERED';
  const legalStructure = profile?.legalStructure || 'INDIVIDUAL_ESTABLISHMENT_PLANNED';
  const isVerified = status === 'REGISTERED_VERIFIED' && verifiedDocsCount > 0;

  let statusHeadline = 'MADECC Group is currently undergoing formal business registration.';
  let legalStatusBadge = 'Legal status: REGISTRATION PENDING (Individual establishment planned, subject to formal registration).';
  if (status === 'APPLICATION_SUBMITTED' || status === 'UNDER_ADMINISTRATIVE_REVIEW') {
    statusHeadline = 'MADECC Group formal business registration is currently under administrative review.';
    legalStatusBadge = 'Legal status: REGISTRATION PENDING — application submitted & under review.';
  } else if (status === 'REGISTERED_AWAITING_DOC_VERIFICATION') {
    statusHeadline = 'Registration record filed — awaiting documentary verification.';
    legalStatusBadge = 'Legal status: Registered — documentary verification pending.';
  } else if (isVerified) {
    statusHeadline = 'Formally registered and documentary-verified enterprise.';
    legalStatusBadge = `Legal status: ${LEGAL_STRUCTURE_LABELS[legalStructure] || legalStructure} (Verified)`;
  } else if (status === 'REJECTED_OR_REQUIRES_CORRECTION') {
    statusHeadline = 'Business registration filing is currently undergoing correction.';
    legalStatusBadge = 'Legal status: REGISTRATION PENDING — update required.';
  } else if (status === 'SUSPENDED' || status === 'EXPIRED') {
    statusHeadline = 'Business registration status requires renewal / clearance.';
    legalStatusBadge = `Legal status: ${REGISTRATION_STATUS_LABELS[status] || status}`;
  }

  return {
    id: profile.id,
    companyName: profile.companyName,
    tradeName: profile.tradeName,
    motto: profile.motto,
    corporateDescription: profile.corporateDescription || CORPORATE_DESCRIPTION_DEFAULT,
    country: profile.country,
    city: profile.city,
    streetAddress: profile.isStreetAddressPublic ? profile.streetAddress : null,
    displayLocation: profile.isStreetAddressPublic && profile.streetAddress
      ? `${profile.streetAddress}, ${profile.city}, ${profile.country}`
      : `${profile.city}, ${profile.country}`,
    founderName: profile.isFounderPublic ? profile.founderName : null,
    ownershipPercentage: profile.isFounderPublic ? Number(profile.ownershipPercentage ?? 100) : null,
    employeeCount: profile.isEmployeeCountPublic ? Number(profile.employeeCount ?? 0) : null,
    employeeCountNote: profile.isEmployeeCountPublic ? profile.employeeCountNote : null,
    legalStructure,
    legalStructureLabel: LEGAL_STRUCTURE_LABELS[legalStructure] || legalStructure,
    plannedLegalStructure: profile.plannedLegalStructure || 'MADECC Group SARL',
    registrationStatus: status,
    registrationStatusLabel: REGISTRATION_STATUS_LABELS[status] || status,
    isLegallyVerified: isVerified,
    statusHeadline,
    legalStatusBadge,
    registrationNumber: isVerified && profile.isRegNumberPublic ? profile.registrationNumber : null,
    taxpayerNumber: profile.isTaxIdPublic && profile.taxpayerNumber ? profile.taxpayerNumber : null,
    verifiedAt: isVerified ? profile.verifiedAt : null,
    publishStatus: profile.publishStatus,
    version: profile.version,
    updatedAt: profile.updatedAt,
  };
}

function toCsv(headers: string[], rows: any[][]): string {
  const esc = (val: any) => {
    const s = val === null || val === undefined || val === '' ? 'Not provided' : String(val);
    const clean = s.replace(/"/g, '""');
    return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
  };
  return '\uFEFF' + [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export function setupCorporateRoutes(app: express.Express) {
  // =========================================================================
  // 1. PUBLIC SANITIZED CORPORATE DISCLOSURES & DIVISIONS (ZERO LEAKS)
  // =========================================================================
  app.get('/api/public/corporate-profile', async (_req, res) => {
    try {
      if (!db) return res.status(503).json({ error: 'Database unavailable' });

      const profiles = await db.select().from(businessProfiles).orderBy(businessProfiles.id).limit(1);
      const profile = profiles[0];
      if (!profile) {
        return res.json({
          success: true,
          profile: {
            companyName: 'MADECC Group',
            tradeName: 'MADECC GROUP',
            motto: "Building Cameroon's Future",
            corporateDescription: CORPORATE_DESCRIPTION_DEFAULT,
            country: 'Republic of Cameroon',
            city: 'Yaoundé',
            streetAddress: null,
            displayLocation: 'Yaoundé, Republic of Cameroon',
            founderName: 'Kasah Rodrick Reboya',
            ownershipPercentage: 100,
            employeeCount: 0,
            employeeCountNote: 'Founder-led venture; no salaried employees yet',
            registrationStatus: 'UNREGISTERED',
            registrationStatusLabel: REGISTRATION_STATUS_LABELS.UNREGISTERED,
            isLegallyVerified: false,
            statusHeadline: 'MADECC Group is currently undergoing formal business registration.',
            legalStatusBadge: 'Legal status: REGISTRATION PENDING (Individual establishment planned, subject to formal registration).',
            registrationNumber: null,
            taxpayerNumber: 'P030217852934P',
          },
          legalEntities: [],
          publishedOpportunities: [],
        });
      }

      const verifiedDocs = await db
        .select()
        .from(registrationDocuments)
        .where(
          and(
            eq(registrationDocuments.profileId, profile.id),
            eq(registrationDocuments.status, 'VERIFIED'),
            isNull(registrationDocuments.archivedAt)
          )
        );

      const publicProfile = formatPublicCorporateStatus(profile, verifiedDocs.length);

      const entities = await db
        .select({
          id: businessLegalEntities.id,
          entityName: businessLegalEntities.entityName,
          legalForm: businessLegalEntities.legalForm,
          plannedForm: businessLegalEntities.plannedForm,
          jurisdiction: businessLegalEntities.jurisdiction,
          status: businessLegalEntities.status,
          isCurrent: businessLegalEntities.isCurrent,
          effectiveFrom: businessLegalEntities.effectiveFrom,
          effectiveTo: businessLegalEntities.effectiveTo,
        })
        .from(businessLegalEntities)
        .where(eq(businessLegalEntities.profileId, profile.id))
        .orderBy(desc(businessLegalEntities.id));

      const publicOpportunitiesRaw = await db
        .select()
        .from(investors)
        .where(and(eq(investors.publishAsOpportunity, true), isNull(investors.archivedAt)))
        .orderBy(desc(investors.id));

      // Strict public sanitization for investor opportunities: never leak personal contact details or private investor name
      const publishedOpportunities = publicOpportunitiesRaw.map((inv) => ({
        id: inv.id,
        title: inv.opportunityTitle || 'Cameroon Real Estate & Healthcare Partnership Desk',
        description:
          inv.opportunityDescription ||
          'Exploratory strategic partnership opportunity in Cameroon subject to formal entity registration and sector licensing.',
        investorOriginRegion: inv.investorCountry || 'West Africa',
        targetCountry: inv.targetCountry || 'Cameroon',
        registrationJurisdiction: inv.registrationJurisdiction || 'Cameroon',
        sectorFocus: Array.isArray(inv.sectorFocus) ? inv.sectorFocus : [],
        stageLabel: INVESTOR_STAGE_LABELS[inv.stage] || 'Exploratory Discussions',
        ownershipImplicationNote: inv.ownershipImplicationNote,
      }));

      res.json({
        success: true,
        profile: publicProfile,
        legalEntities: entities,
        publishedOpportunities,
      });
    } catch (err: any) {
      console.error('[PUBLIC_CORPORATE_PROFILE_ERROR]', err);
      res.status(500).json({ error: 'Failed to load public corporate profile' });
    }
  });

  app.get('/api/public/corporate-divisions', async (_req, res) => {
    try {
      if (!db) return res.status(503).json({ error: 'Database unavailable' });

      const divisions = await db
        .select()
        .from(businessDivisions)
        .where(
          and(
            eq(businessDivisions.publishStatus, 'PUBLISHED'),
            eq(businessDivisions.visibilityPublic, true),
            isNull(businessDivisions.archivedAt)
          )
        )
        .orderBy(businessDivisions.displayOrder, businessDivisions.id);

      const services = await db
        .select()
        .from(divisionServices)
        .where(
          and(
            eq(divisionServices.publishStatus, 'PUBLISHED'),
            eq(divisionServices.visibilityPublic, true),
            isNull(divisionServices.archivedAt)
          )
        )
        .orderBy(divisionServices.displayOrder, divisionServices.id);

      const result = divisions.map((div) => ({
        ...div,
        services: services.filter((s) => s.divisionId === div.id),
      }));

      res.json({ success: true, divisions: result });
    } catch (err: any) {
      console.error('[PUBLIC_DIVISIONS_ERROR]', err);
      res.status(500).json({ error: 'Failed to load published business divisions' });
    }
  });

  // Public Real Estate Development Showcase (Only PUBLISHED + public + conceptual warnings preserved)
  app.get('/api/public/real-estate-projects', async (_req, res) => {
    try {
      if (!db) return res.status(503).json({ error: 'Database unavailable' });
      const rows = await db
        .select()
        .from(realEstateProjects)
        .where(
          and(
            eq(realEstateProjects.publishStatus, 'PUBLISHED'),
            eq(realEstateProjects.visibilityPublic, true),
            isNull(realEstateProjects.archivedAt)
          )
        )
        .orderBy(desc(realEstateProjects.updatedAt), desc(realEstateProjects.id));
      res.json({ success: true, projects: rows });
    } catch (err: any) {
      console.error('[PUBLIC_REAL_ESTATE_ERROR]', err);
      res.status(500).json({ error: 'Failed to load real estate projects' });
    }
  });

  // Public Investor & Partnership Enquiries Submission (Saved to Neon + SMTP Admin Notification)
  app.post('/api/public/corporate-enquiries', async (req, res) => {
    try {
      if (!db) return res.status(503).json({ error: 'Database unavailable' });
      const b = req.body || {};
      const fullName = String(b.fullName || '').trim();
      const email = String(b.email || '').trim();
      const enquiryType = String(b.enquiryType || '').trim();
      const message = String(b.message || '').trim();

      if (!fullName || !email || !enquiryType || !message) {
        return res.status(400).json({ error: 'Full name, email, enquiry category, and message are required.' });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const refCode = `INQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const [created] = await db
        .insert(corporateEnquiries)
        .values({
          enquiryReference: refCode,
          enquiryType,
          divisionCode: b.divisionCode || null,
          fullName,
          organization: b.organization ? String(b.organization).trim() : null,
          email,
          phone: b.phone ? String(b.phone).trim() : null,
          country: b.country ? String(b.country).trim() : 'Republic of Cameroon',
          proposedBudget: b.proposedBudget ? String(b.proposedBudget).trim() : null,
          currency: b.currency || 'XAF',
          message,
          status: 'NEW',
        })
        .returning();

      // Non-blocking SMTP emails via configured kreboya603@gmail.com
      sendNotificationEmail(
        `[MADECC Enquiry ${refCode}] ${enquiryType} — ${fullName}`,
        `New Investor/Partnership Enquiry (${refCode})\nCategory: ${enquiryType}\nName: ${fullName}\nOrganization: ${created.organization || 'N/A'}\nEmail: ${email}\nPhone: ${created.phone || 'N/A'}\nCountry: ${created.country}\nBudget/Commitment Intent: ${created.proposedBudget || 'Not specified'} ${created.currency}\n\nMessage:\n${message}`,
        buildBrandedHtmlTemplate({
          title: `New Corporate & Investment Enquiry (${refCode})`,
          badge: enquiryType,
          leadParagraph: `A new ${enquiryType} enquiry was submitted through the MADECC Group portal.`,
          sectionsHtml: `
            <table style="width:100%; border-collapse:collapse; font-size:13px;">
              <tr><td style="padding:6px 0; color:#64748b;">Reference:</td><td style="padding:6px 0; font-weight:700;">${refCode}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b;">Category:</td><td style="padding:6px 0; font-weight:700;">${enquiryType}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b;">Enquirer:</td><td style="padding:6px 0;">${fullName} (${created.organization || 'Individual'})</td></tr>
              <tr><td style="padding:6px 0; color:#64748b;">Contact:</td><td style="padding:6px 0;">${email} | ${created.phone || 'No phone'}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b;">Country:</td><td style="padding:6px 0;">${created.country}</td></tr>
              <tr><td style="padding:6px 0; color:#64748b;">Proposed Scale:</td><td style="padding:6px 0;">${created.proposedBudget || 'Not specified'} ${created.currency}</td></tr>
            </table>
            <div style="margin-top:16px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:13px; white-space:pre-wrap;">${message}</div>
          `,
        }),
        { replyTo: email }
      ).catch((e) => console.warn('[ENQUIRY_ADMIN_MAIL_WARN]', e?.message || e));

      sendEmail(
        email,
        `MADECC Group Enquiry Confirmation (${refCode})`,
        `Dear ${fullName},\n\nThank you for your ${enquiryType} enquiry with MADECC Group.\nReference: ${refCode}\n\nNote: Proposed developments and partnerships are reviewed strictly subject to formal feasibility, legal registration, and regulatory requirements where applicable.\n\nFounder & Executive Desk\nMADECC Group`,
        buildBrandedHtmlTemplate({
          title: `Enquiry Received — ${refCode}`,
          badge: 'MADECC Group Corporate Desk',
          recipientName: fullName,
          leadParagraph: `Thank you for reaching out regarding <strong>${enquiryType}</strong>. Your enquiry has been recorded in our corporate portal for review.`,
          sectionsHtml: `<p style="font-size:13px; color:#334155;"><strong>Reference:</strong> ${refCode}<br/><strong>Notice:</strong> All projects and partnership discussions remain subject to formal feasibility, due diligence, and applicable statutory authorizations.</p>`,
        })
      ).catch((e) => console.warn('[ENQUIRY_CLIENT_MAIL_WARN]', e?.message || e));

      res.json({ success: true, enquiry: created });
    } catch (err: any) {
      console.error('[CORPORATE_ENQUIRY_SUBMIT_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to submit enquiry' });
    }
  });

  // Tokenized Controlled Share Access (Public)
  app.get('/api/public/corporate-share/:token', async (req, res) => {
    try {
      if (!db) return res.status(503).json({ error: 'Database unavailable' });
      const rawToken = String(req.params.token || '').trim();
      if (!rawToken) return res.status(400).json({ error: 'Share token required' });

      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const found = await db
        .select()
        .from(corporateShares)
        .where(eq(corporateShares.shareTokenHash, tokenHash))
        .limit(1);

      const share = found[0];
      if (!share) {
        return res.status(404).json({ error: 'Share link not found or invalid.' });
      }
      if (share.revokedAt) {
        return res.status(410).json({ error: 'This share link has been revoked by an administrator.' });
      }
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return res.status(410).json({ error: 'This share link has expired.' });
      }
      if (!share.allowPublic) {
        return res.status(403).json({ error: 'This share link is restricted to internal access.' });
      }

      await db
        .update(corporateShares)
        .set({
          accessCount: (share.accessCount || 0) + 1,
          lastAccessedAt: new Date(),
        })
        .where(eq(corporateShares.id, share.id));

      let payload: any = null;
      if (share.entityType === 'BUSINESS_PROFILE') {
        const prof = await db.select().from(businessProfiles).where(eq(businessProfiles.id, share.entityId)).limit(1);
        if (prof[0]) {
          const verifiedDocs = await db
            .select()
            .from(registrationDocuments)
            .where(
              and(
                eq(registrationDocuments.profileId, prof[0].id),
                eq(registrationDocuments.status, 'VERIFIED'),
                isNull(registrationDocuments.archivedAt)
              )
            );
          payload = formatPublicCorporateStatus(prof[0], verifiedDocs.length);
        }
      } else if (share.entityType === 'DIVISION') {
        const div = await db.select().from(businessDivisions).where(eq(businessDivisions.id, share.entityId)).limit(1);
        if (div[0]) {
          const svcs = await db
            .select()
            .from(divisionServices)
            .where(and(eq(divisionServices.divisionId, div[0].id), isNull(divisionServices.archivedAt)))
            .orderBy(divisionServices.displayOrder, divisionServices.id);
          payload = { ...div[0], services: svcs };
        }
      } else if (share.entityType === 'SERVICE') {
        const svc = await db.select().from(divisionServices).where(eq(divisionServices.id, share.entityId)).limit(1);
        if (svc[0]) {
          payload = svc[0];
        }
      } else if (share.entityType === 'REAL_ESTATE') {
        const proj = await db.select().from(realEstateProjects).where(eq(realEstateProjects.id, share.entityId)).limit(1);
        if (proj[0]) {
          payload = proj[0];
        }
      } else if (share.entityType === 'INVESTOR_OPPORTUNITY') {
        const inv = await db.select().from(investors).where(eq(investors.id, share.entityId)).limit(1);
        if (inv[0]) {
          // Strip confidential notes, phone, email, and confidential docs strictly
          payload = {
            title: inv[0].opportunityTitle || inv[0].summary,
            description: inv[0].opportunityDescription || inv[0].summary,
            targetCountry: inv[0].targetCountry,
            registrationJurisdiction: inv[0].registrationJurisdiction,
            sectorFocus: inv[0].sectorFocus,
            stageLabel: INVESTOR_STAGE_LABELS[inv[0].stage] || inv[0].stage,
            ownershipImplicationNote: inv[0].ownershipImplicationNote,
          };
        }
      }

      res.json({
        success: true,
        share: {
          title: share.title,
          entityType: share.entityType,
          permissions: share.permissions,
          expiresAt: share.expiresAt,
          confidentialDataExcluded: true,
        },
        data: payload,
      });
    } catch (err: any) {
      console.error('[PUBLIC_SHARE_ACCESS_ERROR]', err);
      res.status(500).json({ error: 'Failed to open shared record' });
    }
  });

  // =========================================================================
  // 2. AUTHENTICATED RBAC ROLE CHECK & USER PERMISSION MANAGEMENT
  // =========================================================================
  app.get('/api/corporate/me-role', requireAuth, async (req: AuthRequest, res) => {
    const effectiveRole = resolveEffectiveCorporateRole(req.dbUser);
    res.json({
      success: true,
      user: {
        id: req.dbUser?.id,
        email: req.dbUser?.email,
        name: req.dbUser?.name,
        role: req.dbUser?.role,
        adminRole: req.dbUser?.adminRole || 'STANDARD',
        effectiveRole,
      },
      capabilities: {
        canEditProfile: ['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN'].includes(effectiveRole),
        canVerifyLegal: ['SUPER_ADMIN', 'LEGAL_REVIEWER'].includes(effectiveRole),
        canEditDivisions: ['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN'].includes(effectiveRole),
        canApproveRegulatedDivisions: ['SUPER_ADMIN', 'LEGAL_REVIEWER'].includes(effectiveRole),
        canManageInvestors: ['SUPER_ADMIN', 'BUSINESS_ADMIN'].includes(effectiveRole),
        canAssignRoles: effectiveRole === 'SUPER_ADMIN',
        canViewAuditLogs: ['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER'].includes(effectiveRole),
        canDownloadConfidentialDocs: ['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER'].includes(effectiveRole),
      },
    });
  });

  app.get('/api/corporate/rbac-users', requireCorporateRoles(['SUPER_ADMIN']), async (_req, res) => {
    try {
      if (!db) return res.status(503).json({ error: 'Database unavailable' });
      const list = await db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          adminRole: users.adminRole,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.id);
      res.json({ success: true, users: list });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/corporate/rbac-users/:id', requireCorporateRoles(['SUPER_ADMIN']), async (req: AuthRequest, res) => {
    try {
      if (!db) return res.status(503).json({ error: 'Database unavailable' });
      const userId = Number(req.params.id);
      const { adminRole } = req.body;
      const valid = ['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN', 'STANDARD'];
      if (!valid.includes(adminRole)) {
        return res.status(400).json({ error: `Invalid adminRole. Allowed: ${valid.join(', ')}` });
      }
      const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!existing[0]) return res.status(404).json({ error: 'User not found' });

      const [updated] = await db
        .update(users)
        .set({ adminRole })
        .where(eq(users.id, userId))
        .returning({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          adminRole: users.adminRole,
        });

      await logCorporateAudit({
        req,
        action: 'UPDATE_RBAC_ROLE',
        entityType: 'USER_RBAC',
        entityId: userId,
        entityTitle: existing[0].email,
        beforeJson: { adminRole: existing[0].adminRole },
        afterJson: { adminRole },
        details: `Assigned corporate admin role ${adminRole} to ${existing[0].email}`,
      });

      res.json({ success: true, user: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =========================================================================
  // 3. BUSINESS PROFILE, LEGAL ENTITIES & DOCUMENTARY VERIFICATION
  // =========================================================================
  app.get(
    '/api/corporate/profile',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (_req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const profiles = await db.select().from(businessProfiles).orderBy(businessProfiles.id).limit(1);
        const profile = profiles[0] || null;
        if (!profile) return res.status(404).json({ error: 'Business profile not initialized' });

        const entities = await db
          .select()
          .from(businessLegalEntities)
          .where(eq(businessLegalEntities.profileId, profile.id))
          .orderBy(desc(businessLegalEntities.id));

        const docs = await db
          .select()
          .from(registrationDocuments)
          .where(eq(registrationDocuments.profileId, profile.id))
          .orderBy(desc(registrationDocuments.createdAt));

        const verifiedDocsCount = docs.filter((d) => d.status === 'VERIFIED' && !d.archivedAt).length;

        res.json({
          success: true,
          profile,
          verifiedDocsCount,
          registrationStatusLabels: REGISTRATION_STATUS_LABELS,
          legalStructureLabels: LEGAL_STRUCTURE_LABELS,
          legalEntities: entities,
          documents: docs,
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.put(
    '/api/corporate/profile',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const effectiveRole = resolveEffectiveCorporateRole(req.dbUser);
        const existingRows = await db.select().from(businessProfiles).orderBy(businessProfiles.id).limit(1);
        const existing = existingRows[0];
        if (!existing) return res.status(404).json({ error: 'Business profile not found' });

        const body = req.body || {};

        if (body.expectedVersion !== undefined && Number(body.expectedVersion) !== existing.version) {
          return res.status(409).json({
            error: `Version conflict: record was updated to v${existing.version} by ${existing.updatedBy || 'another admin'}. Please reload before saving.`,
            currentVersion: existing.version,
          });
        }

        // Security check: CONTENT_ADMIN cannot modify legal registration status, numbers, or ownership
        const attemptingLegalChange =
          (body.registrationStatus !== undefined && body.registrationStatus !== existing.registrationStatus) ||
          (body.legalStructure !== undefined && body.legalStructure !== existing.legalStructure) ||
          (body.registrationNumber !== undefined && body.registrationNumber !== existing.registrationNumber) ||
          (body.taxpayerNumber !== undefined && body.taxpayerNumber !== existing.taxpayerNumber);

        if (effectiveRole === 'CONTENT_ADMIN' && attemptingLegalChange) {
          return res.status(403).json({
            error: 'Forbidden: Content Administrators cannot modify legal registration status or official registration numbers.',
          });
        }

        // Documentary Verification Enforcement Guard for REGISTERED_VERIFIED
        const targetRegStatus = body.registrationStatus ?? existing.registrationStatus;
        if (targetRegStatus === 'REGISTERED_VERIFIED') {
          if (effectiveRole !== 'SUPER_ADMIN' && effectiveRole !== 'LEGAL_REVIEWER') {
            return res.status(403).json({
              error: 'Forbidden: Only Legal/Compliance Reviewers or Super Administrators may mark registration as VERIFIED.',
            });
          }

          const verifiedDocs = await db
            .select()
            .from(registrationDocuments)
            .where(
              and(
                eq(registrationDocuments.profileId, existing.id),
                eq(registrationDocuments.status, 'VERIFIED'),
                isNull(registrationDocuments.archivedAt)
              )
            );

          if (verifiedDocs.length === 0) {
            return res.status(400).json({
              error: 'Documentary Verification Required: Cannot mark corporate status as "Registered – verified" until at least one official registration document has been uploaded and manually reviewed as VERIFIED.',
            });
          }

          const regNum = (body.registrationNumber ?? existing.registrationNumber ?? '').trim();
          if (!regNum) {
            return res.status(400).json({
              error: 'Registration Number Required: Cannot mark registration as "Registered – verified" without a verified official registration number.',
            });
          }
        }

        const nextVersion = existing.version + 1;
        const actionType = body.action === 'SAVE_DRAFT' ? 'SAVE_DRAFT' : body.action === 'UNPUBLISH' ? 'UNPUBLISH' : 'PUBLISH';

        const updatePayload: any = {
          companyName: body.companyName ?? existing.companyName,
          tradeName: body.tradeName ?? existing.tradeName,
          legalStructure: body.legalStructure ?? existing.legalStructure,
          plannedLegalStructure: body.plannedLegalStructure ?? existing.plannedLegalStructure,
          registrationStatus: targetRegStatus,
          registrationNumber: body.registrationNumber !== undefined ? body.registrationNumber || null : existing.registrationNumber,
          taxpayerNumber: body.taxpayerNumber !== undefined ? body.taxpayerNumber || null : existing.taxpayerNumber,
          country: body.country ?? existing.country,
          city: body.city ?? existing.city,
          streetAddress: body.streetAddress !== undefined ? body.streetAddress : existing.streetAddress,
          founderName: body.founderName ?? existing.founderName,
          ownershipPercentage: body.ownershipPercentage !== undefined ? String(body.ownershipPercentage) : existing.ownershipPercentage,
          motto: body.motto ?? existing.motto,
          corporateDescription: body.corporateDescription !== undefined ? body.corporateDescription : existing.corporateDescription,
          employeeCount: body.employeeCount !== undefined ? Math.max(0, Number(body.employeeCount)) : existing.employeeCount,
          employeeCountNote: body.employeeCountNote ?? existing.employeeCountNote,
          isRegNumberPublic: body.isRegNumberPublic !== undefined ? Boolean(body.isRegNumberPublic) : existing.isRegNumberPublic,
          isTaxIdPublic: body.isTaxIdPublic !== undefined ? Boolean(body.isTaxIdPublic) : existing.isTaxIdPublic,
          isStreetAddressPublic: body.isStreetAddressPublic !== undefined ? Boolean(body.isStreetAddressPublic) : existing.isStreetAddressPublic,
          isFounderPublic: body.isFounderPublic !== undefined ? Boolean(body.isFounderPublic) : existing.isFounderPublic,
          isEmployeeCountPublic: body.isEmployeeCountPublic !== undefined ? Boolean(body.isEmployeeCountPublic) : existing.isEmployeeCountPublic,
          verificationNotes: body.verificationNotes !== undefined ? body.verificationNotes : existing.verificationNotes,
          scheduledPublishAt: body.scheduledPublishAt ? new Date(body.scheduledPublishAt) : existing.scheduledPublishAt,
          version: nextVersion,
          updatedBy: req.dbUser?.email || 'admin',
          updatedAt: new Date(),
        };

        if (targetRegStatus === 'REGISTERED_VERIFIED' && existing.registrationStatus !== 'REGISTERED_VERIFIED') {
          updatePayload.verifiedBy = req.dbUser?.email || 'reviewer';
          updatePayload.verifiedAt = new Date();
        }

        if (actionType === 'UNPUBLISH') {
          updatePayload.publishStatus = 'UNPUBLISHED';
        } else if (actionType === 'SAVE_DRAFT') {
          updatePayload.publishStatus = existing.publishStatus;
          updatePayload.draftPayload = body;
        } else {
          updatePayload.publishStatus = 'PUBLISHED';
          updatePayload.publishedPayload = { ...existing, ...updatePayload };
        }

        const [updated] = await db
          .update(businessProfiles)
          .set(updatePayload)
          .where(eq(businessProfiles.id, existing.id))
          .returning();

        // Sync non-destructively to site_settings ID=1 ONLY when published
        if (updated.publishStatus === 'PUBLISHED') {
          const verifiedDocs = await db
            .select()
            .from(registrationDocuments)
            .where(
              and(
                eq(registrationDocuments.profileId, updated.id),
                eq(registrationDocuments.status, 'VERIFIED'),
                isNull(registrationDocuments.archivedAt)
              )
            );
          const isVerified = updated.registrationStatus === 'REGISTERED_VERIFIED' && verifiedDocs.length > 0;
          await db
            .update(siteSettings)
            .set({
              siteName: updated.tradeName || updated.companyName,
              developerName: updated.founderName,
              officeAddressYaounde: updated.isStreetAddressPublic && updated.streetAddress
                ? `${updated.streetAddress}, ${updated.city}, ${updated.country}`
                : `${updated.city}, ${updated.country}`,
              legalStatus: isVerified
                ? LEGAL_STRUCTURE_LABELS[updated.legalStructure] || updated.legalStructure
                : REGISTRATION_STATUS_LABELS[updated.registrationStatus] || 'Individual establishment registration pending',
              rccmNumber: isVerified && updated.isRegNumberPublic ? updated.registrationNumber || '' : '',
              niuTaxId: updated.isTaxIdPublic ? updated.taxpayerNumber || '' : '',
              updatedBy: req.dbUser?.email || 'admin',
              updatedAt: new Date(),
            })
            .where(eq(siteSettings.id, 1));
        }

        await createVersionSnapshot({
          entityType: 'BUSINESS_PROFILE',
          entityId: updated.id,
          versionNumber: nextVersion,
          entityTitle: updated.companyName,
          changeSummary: body.changeSummary || `${actionType} corporate profile update (v${nextVersion})`,
          snapshotJson: updated,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: actionType === 'SAVE_DRAFT' ? 'SAVE_DRAFT_PROFILE' : actionType === 'UNPUBLISH' ? 'UNPUBLISH_PROFILE' : 'UPDATE_PROFILE',
          entityType: 'BUSINESS_PROFILE',
          entityId: updated.id,
          entityTitle: updated.companyName,
          beforeJson: existing,
          afterJson: updated,
          details: body.changeSummary || `Updated business profile to v${nextVersion} (${updated.registrationStatus})`,
        });

        res.json({ success: true, profile: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Non-destructive historical transition (e.g., Individual Establishment -> SARL)
  app.post(
    '/api/corporate/legal-entities/transition',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const { entityName, targetLegalForm, jurisdiction, registrationNumber, taxpayerNumber, transitionNotes } = req.body;
        if (!targetLegalForm || !entityName) {
          return res.status(400).json({ error: 'entityName and targetLegalForm are required.' });
        }

        const profiles = await db.select().from(businessProfiles).orderBy(businessProfiles.id).limit(1);
        const profile = profiles[0];
        if (!profile) return res.status(404).json({ error: 'Business profile not found' });

        const currentEntities = await db
          .select()
          .from(businessLegalEntities)
          .where(and(eq(businessLegalEntities.profileId, profile.id), eq(businessLegalEntities.isCurrent, true)));

        const now = new Date();
        const [newEntity] = await db
          .insert(businessLegalEntities)
          .values({
            profileId: profile.id,
            entityName: entityName.trim(),
            legalForm: targetLegalForm,
            plannedForm: targetLegalForm === 'SARL' ? 'SARL' : 'SARL',
            jurisdiction: jurisdiction || 'Cameroon',
            registrationNumber: registrationNumber || null,
            taxpayerNumber: taxpayerNumber || null,
            status: 'PENDING_REGISTRATION',
            effectiveFrom: now,
            transitionNotes:
              transitionNotes || `Structured transition initiated to ${targetLegalForm}. Historical entity records preserved intact.`,
            isCurrent: true,
            createdBy: req.dbUser?.email || 'admin',
          })
          .returning();

        for (const old of currentEntities) {
          await db
            .update(businessLegalEntities)
            .set({
              isCurrent: false,
              status: 'SUPERSEDED',
              effectiveTo: now,
              supersededById: newEntity.id,
              updatedAt: now,
            })
            .where(eq(businessLegalEntities.id, old.id));
        }

        const nextVer = profile.version + 1;
        await db
          .update(businessProfiles)
          .set({
            legalStructure: targetLegalForm,
            companyName: entityName.trim(),
            registrationStatus: 'REGISTRATION_PREPARATION',
            version: nextVer,
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: now,
          })
          .where(eq(businessProfiles.id, profile.id));

        await logCorporateAudit({
          req,
          action: 'LEGAL_ENTITY_TRANSITION',
          entityType: 'LEGAL_ENTITY',
          entityId: newEntity.id,
          entityTitle: newEntity.entityName,
          beforeJson: currentEntities,
          afterJson: newEntity,
          details: `Preserved previous entity history and created transition entity ${entityName} (${targetLegalForm})`,
        });

        res.json({ success: true, newEntity });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Confidential Registration Documents Upload, Manual Verification & Download Proxy
  const safeDocMulter = (req: any, res: any, next: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) return res.status(400).json({ error: err.message || 'Document upload failed' });
      next();
    });
  };

  app.get(
    '/api/corporate/registration-documents',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const includeArchived = req.query.includeArchived === 'true';
        const rows = await db
          .select()
          .from(registrationDocuments)
          .where(includeArchived ? undefined : isNull(registrationDocuments.archivedAt))
          .orderBy(desc(registrationDocuments.createdAt));
        res.json({ success: true, documents: rows });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/registration-documents',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    safeDocMulter,
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        if (!req.file) return res.status(400).json({ error: 'Document file is required' });

        const profiles = await db.select().from(businessProfiles).orderBy(businessProfiles.id).limit(1);
        const profile = profiles[0];
        if (!profile) return res.status(404).json({ error: 'Business profile not found' });

        const stored = await storeUploadedFile(req.file, 'madecc_confidential_docs/registration');

        const [doc] = await db
          .insert(registrationDocuments)
          .values({
            profileId: profile.id,
            entityId: req.body.entityId ? Number(req.body.entityId) : null,
            title: req.body.title || req.file.originalname,
            category: req.body.category || 'REGISTRATION',
            docType: req.body.docType || 'STATUTORY_FILING',
            issuer: req.body.issuer || null,
            referenceNumber: req.body.referenceNumber || null,
            issuedAt: req.body.issuedAt ? new Date(req.body.issuedAt) : null,
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
            fileUrl: stored.fileUrl,
            storageProvider: stored.storageProvider,
            storagePublicId: stored.storagePublicId,
            storagePath: stored.storagePath,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSizeBytes: req.file.size,
            sha256Checksum: stored.sha256Checksum,
            version: 1,
            status: 'PENDING_REVIEW',
            isConfidential: req.body.isConfidential !== 'false',
            uploadedBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await logCorporateAudit({
          req,
          action: 'UPLOAD_REGISTRATION_DOCUMENT',
          entityType: 'REGISTRATION_DOCUMENT',
          entityId: doc.id,
          entityTitle: doc.title,
          afterJson: { id: doc.id, title: doc.title, status: doc.status, sha256Checksum: doc.sha256Checksum },
          details: `Uploaded confidential registration document "${doc.title}" (${doc.storageProvider})`,
        });

        res.json({ success: true, document: doc });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/registration-documents/:id/review',
    requireCorporateRoles(['SUPER_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const docId = Number(req.params.id);
        const { status, reviewNotes } = req.body;
        const allowed = ['UPLOADED', 'PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'];
        if (!allowed.includes(status)) {
          return res.status(400).json({ error: `Invalid review status. Allowed: ${allowed.join(', ')}` });
        }

        const existing = await db.select().from(registrationDocuments).where(eq(registrationDocuments.id, docId)).limit(1);
        if (!existing[0]) return res.status(404).json({ error: 'Document not found' });

        const [updated] = await db
          .update(registrationDocuments)
          .set({
            status,
            reviewNotes: reviewNotes ?? existing[0].reviewNotes,
            reviewedBy: req.dbUser?.email || 'legal-reviewer',
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(registrationDocuments.id, docId))
          .returning();

        await logCorporateAudit({
          req,
          action: 'REVIEW_REGISTRATION_DOCUMENT',
          entityType: 'REGISTRATION_DOCUMENT',
          entityId: docId,
          entityTitle: updated.title,
          beforeJson: { status: existing[0].status },
          afterJson: { status: updated.status, reviewNotes: updated.reviewNotes },
          details: `Reviewed registration document "${updated.title}" -> ${status}`,
        });

        res.json({ success: true, document: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/registration-documents/:id/archive',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const docId = Number(req.params.id);
        const archive = req.body?.archive !== false;
        const [updated] = await db
          .update(registrationDocuments)
          .set({ archivedAt: archive ? new Date() : null, updatedAt: new Date() })
          .where(eq(registrationDocuments.id, docId))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Document not found' });

        await logCorporateAudit({
          req,
          action: archive ? 'ARCHIVE_REGISTRATION_DOCUMENT' : 'RESTORE_REGISTRATION_DOCUMENT',
          entityType: 'REGISTRATION_DOCUMENT',
          entityId: docId,
          entityTitle: updated.title,
        });

        res.json({ success: true, document: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Authenticated Confidential Document Download & Audit Proxy
  app.get(
    '/api/corporate/documents/:kind/:id/download',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const kind = req.params.kind;
        const docId = Number(req.params.id);

        let record: any = null;
        if (kind === 'registration') {
          const rows = await db.select().from(registrationDocuments).where(eq(registrationDocuments.id, docId)).limit(1);
          record = rows[0];
        } else if (kind === 'investor') {
          const rows = await db.select().from(investorDocuments).where(eq(investorDocuments.id, docId)).limit(1);
          record = rows[0];
        } else {
          return res.status(400).json({ error: 'Invalid document kind' });
        }

        if (!record) return res.status(404).json({ error: 'Confidential document not found' });

        await logCorporateAudit({
          req,
          action: 'ACCESS_CONFIDENTIAL_DOCUMENT',
          entityType: kind === 'registration' ? 'REGISTRATION_DOCUMENT' : 'INVESTOR_DOCUMENT',
          entityId: docId,
          entityTitle: record.title,
          details: `Authorized download/access requested by ${req.dbUser?.email}`,
        });

        res.json({
          success: true,
          fileUrl: record.fileUrl,
          fileName: record.fileName,
          mimeType: record.mimeType,
          sha256Checksum: record.sha256Checksum,
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 4. BUSINESS DIVISIONS & SERVICES (ALL 9 DIVISIONS + EXTENSIBLE)
  // =========================================================================
  app.get(
    '/api/corporate/divisions',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const includeArchived = req.query.includeArchived === 'true';

        const divisions = await db
          .select()
          .from(businessDivisions)
          .where(includeArchived ? undefined : isNull(businessDivisions.archivedAt))
          .orderBy(businessDivisions.displayOrder, businessDivisions.id);

        const services = await db
          .select()
          .from(divisionServices)
          .where(includeArchived ? undefined : isNull(divisionServices.archivedAt))
          .orderBy(divisionServices.displayOrder, divisionServices.id);

        res.json({
          success: true,
          divisions: divisions.map((d) => ({
            ...d,
            services: services.filter((s) => s.divisionId === d.id),
          })),
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/divisions',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const b = req.body || {};
        if (!b.name || !b.code || !b.summary) {
          return res.status(400).json({ error: 'code, name, and summary are required' });
        }

        const slug = (b.slug || b.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const [created] = await db
          .insert(businessDivisions)
          .values({
            code: b.code.trim().toUpperCase(),
            slug,
            name: b.name.trim(),
            category: b.category || 'Enterprise Division',
            summary: b.summary.trim(),
            fullDescription: b.fullDescription || null,
            imageUrl: b.imageUrl || null,
            investmentInfo: b.investmentInfo || null,
            complianceDisclaimer: b.complianceDisclaimer || null,
            documentsJson: b.documentsJson || [],
            operationalStatus: b.operationalStatus || 'PROPOSED',
            publishStatus: b.publishStatus || 'DRAFT',
            country: b.country || 'Republic of Cameroon',
            operatingCountries: b.operatingCountries || [b.country || 'Republic of Cameroon'],
            currency: b.currency || 'XAF',
            regulatoryBody: b.regulatoryBody || null,
            licenceRequired: Boolean(b.licenceRequired),
            licenceStatus: b.licenceStatus || 'NOT_APPLIED',
            licenceNumber: b.licenceNumber || null,
            visibilityPublic: b.visibilityPublic !== false,
            isFeatured: Boolean(b.isFeatured),
            displayOrder: Number(b.displayOrder || 10),
            version: 1,
            createdBy: req.dbUser?.email || 'admin',
            updatedBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await createVersionSnapshot({
          entityType: 'DIVISION',
          entityId: created.id,
          versionNumber: 1,
          entityTitle: created.name,
          changeSummary: 'Created business division',
          snapshotJson: created,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'CREATE_DIVISION',
          entityType: 'DIVISION',
          entityId: created.id,
          entityTitle: created.name,
          afterJson: created,
        });

        res.json({ success: true, division: created });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.put(
    '/api/corporate/divisions/:id',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const divId = Number(req.params.id);
        const rows = await db.select().from(businessDivisions).where(eq(businessDivisions.id, divId)).limit(1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Division not found' });

        const b = req.body || {};
        const nextOpStatus = b.operationalStatus ?? existing.operationalStatus;
        const nextLicenceRequired = b.licenceRequired !== undefined ? Boolean(b.licenceRequired) : existing.licenceRequired;
        const nextLicenceStatus = b.licenceStatus ?? existing.licenceStatus;
        const nextLicenceNumber = b.licenceNumber !== undefined ? b.licenceNumber : existing.licenceNumber;

        // Strict Regulated Division Gate (e.g., Pharmaceuticals & Healthcare)
        if (
          nextLicenceRequired &&
          (nextOpStatus === 'OPERATIONAL' || nextOpStatus === 'APPROVED_FOR_OPERATION') &&
          (nextLicenceStatus !== 'APPROVED' || !String(nextLicenceNumber || '').trim())
        ) {
          return res.status(400).json({
            error: `Regulatory Gate: Division "${existing.name}" requires statutory licensing (${existing.regulatoryBody || 'Regulatory Authority'}). Mark licence status as APPROVED with an official licence number before setting status to ${nextOpStatus}.`,
          });
        }

        const nextVer = existing.version + 1;
        const [updated] = await db
          .update(businessDivisions)
          .set({
            name: b.name ?? existing.name,
            category: b.category ?? existing.category,
            summary: b.summary ?? existing.summary,
            fullDescription: b.fullDescription !== undefined ? b.fullDescription : existing.fullDescription,
            imageUrl: b.imageUrl !== undefined ? b.imageUrl : existing.imageUrl,
            investmentInfo: b.investmentInfo !== undefined ? b.investmentInfo : existing.investmentInfo,
            complianceDisclaimer: b.complianceDisclaimer !== undefined ? b.complianceDisclaimer : existing.complianceDisclaimer,
            documentsJson: b.documentsJson !== undefined ? b.documentsJson : existing.documentsJson,
            operationalStatus: nextOpStatus,
            publishStatus: b.publishStatus ?? existing.publishStatus,
            country: b.country ?? existing.country,
            operatingCountries: b.operatingCountries ?? existing.operatingCountries,
            currency: b.currency ?? existing.currency,
            regulatoryBody: b.regulatoryBody !== undefined ? b.regulatoryBody : existing.regulatoryBody,
            licenceRequired: nextLicenceRequired,
            licenceStatus: nextLicenceStatus,
            licenceNumber: nextLicenceNumber,
            visibilityPublic: b.visibilityPublic !== undefined ? Boolean(b.visibilityPublic) : existing.visibilityPublic,
            isFeatured: b.isFeatured !== undefined ? Boolean(b.isFeatured) : existing.isFeatured,
            displayOrder: b.displayOrder !== undefined ? Number(b.displayOrder) : existing.displayOrder,
            scheduledPublishAt: b.scheduledPublishAt ? new Date(b.scheduledPublishAt) : existing.scheduledPublishAt,
            version: nextVer,
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: new Date(),
          })
          .where(eq(businessDivisions.id, divId))
          .returning();

        await createVersionSnapshot({
          entityType: 'DIVISION',
          entityId: divId,
          versionNumber: nextVer,
          entityTitle: updated.name,
          changeSummary: b.changeSummary || `Updated division (${updated.operationalStatus} / ${updated.publishStatus})`,
          snapshotJson: updated,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'UPDATE_DIVISION',
          entityType: 'DIVISION',
          entityId: divId,
          entityTitle: updated.name,
          beforeJson: existing,
          afterJson: updated,
        });

        res.json({ success: true, division: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Cloudinary / Storage Upload for Division Images & Supporting Documents
  app.post(
    '/api/corporate/divisions/:id/upload-media',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    safeDocMulter,
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const divId = Number(req.params.id);
        const rows = await db.select().from(businessDivisions).where(eq(businessDivisions.id, divId)).limit(1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Division not found' });
        if (!req.file) return res.status(400).json({ error: 'File is required' });

        const kind = req.body?.kind === 'document' ? 'document' : 'image';
        const stored = await storeUploadedFile(req.file, `madecc_divisions/${divId}`);

        let updatedRow = existing;
        if (kind === 'image') {
          const [upd] = await db
            .update(businessDivisions)
            .set({ imageUrl: stored.fileUrl, version: existing.version + 1, updatedBy: req.dbUser?.email || 'admin', updatedAt: new Date() })
            .where(eq(businessDivisions.id, divId))
            .returning();
          updatedRow = upd;
        } else {
          const prevDocs = Array.isArray(existing.documentsJson) ? existing.documentsJson : [];
          const newDoc = {
            id: `doc_${Date.now()}`,
            title: req.body?.title || req.file.originalname,
            fileName: req.file.originalname,
            fileUrl: stored.fileUrl,
            storageProvider: stored.storageProvider,
            mimeType: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
          };
          const [upd] = await db
            .update(businessDivisions)
            .set({ documentsJson: [...prevDocs, newDoc], version: existing.version + 1, updatedBy: req.dbUser?.email || 'admin', updatedAt: new Date() })
            .where(eq(businessDivisions.id, divId))
            .returning();
          updatedRow = upd;
        }

        await logCorporateAudit({
          req,
          action: kind === 'image' ? 'UPLOAD_DIVISION_IMAGE' : 'UPLOAD_DIVISION_DOCUMENT',
          entityType: 'DIVISION',
          entityId: divId,
          entityTitle: existing.name,
          afterJson: stored,
        });

        res.json({ success: true, division: updatedRow, uploaded: stored });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/divisions/:id/archive',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const divId = Number(req.params.id);
        const archive = req.body?.archive !== false;
        const [updated] = await db
          .update(businessDivisions)
          .set({
            archivedAt: archive ? new Date() : null,
            publishStatus: archive ? 'ARCHIVED' : 'DRAFT',
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: new Date(),
          })
          .where(eq(businessDivisions.id, divId))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Division not found' });

        await logCorporateAudit({
          req,
          action: archive ? 'ARCHIVE_DIVISION' : 'RESTORE_DIVISION',
          entityType: 'DIVISION',
          entityId: divId,
          entityTitle: updated.name,
        });

        res.json({ success: true, division: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Division Services CRUD (With Image/Doc Uploads, Versioning, Safe Delete & Independent Statuses)
  app.post(
    '/api/corporate/divisions/:divisionId/services',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const divisionId = Number(req.params.divisionId);
        const b = req.body || {};
        if (!b.name || !b.shortDescription) {
          return res.status(400).json({ error: 'name and shortDescription are required' });
        }
        const slug = (b.slug || `${b.name}-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const [created] = await db
          .insert(divisionServices)
          .values({
            divisionId,
            name: b.name.trim(),
            slug,
            categoryGroup: b.categoryGroup || null,
            shortDescription: b.shortDescription.trim(),
            fullDescription: b.fullDescription || b.shortDescription.trim(),
            imageUrl: b.imageUrl || null,
            investmentInfo: b.investmentInfo || null,
            documentsJson: b.documentsJson || [],
            scopeDeliverables: b.scopeDeliverables || [],
            pricingModel: b.pricingModel || 'Custom quotation / milestone-based',
            currency: b.currency || 'XAF',
            regulatoryNotes: b.regulatoryNotes || null,
            operationalStatus: b.operationalStatus || 'PROPOSED',
            publishStatus: b.publishStatus || 'DRAFT',
            visibilityPublic: b.visibilityPublic !== false,
            displayOrder: Number(b.displayOrder || 1),
            version: 1,
            createdBy: req.dbUser?.email || 'admin',
            updatedBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await createVersionSnapshot({
          entityType: 'SERVICE',
          entityId: created.id,
          versionNumber: 1,
          entityTitle: created.name,
          changeSummary: 'Created division service',
          snapshotJson: created,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'CREATE_DIVISION_SERVICE',
          entityType: 'SERVICE',
          entityId: created.id,
          entityTitle: created.name,
          afterJson: created,
        });

        res.json({ success: true, service: created });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.put(
    '/api/corporate/services/:id',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const svcId = Number(req.params.id);
        const existingRows = await db.select().from(divisionServices).where(eq(divisionServices.id, svcId)).limit(1);
        const existing = existingRows[0];
        if (!existing) return res.status(404).json({ error: 'Service not found' });

        const b = req.body || {};
        const nextVer = existing.version + 1;
        const [updated] = await db
          .update(divisionServices)
          .set({
            divisionId: b.divisionId !== undefined ? Number(b.divisionId) : existing.divisionId,
            name: b.name ?? existing.name,
            categoryGroup: b.categoryGroup !== undefined ? b.categoryGroup : existing.categoryGroup,
            shortDescription: b.shortDescription ?? existing.shortDescription,
            fullDescription: b.fullDescription !== undefined ? b.fullDescription : existing.fullDescription,
            imageUrl: b.imageUrl !== undefined ? b.imageUrl : existing.imageUrl,
            investmentInfo: b.investmentInfo !== undefined ? b.investmentInfo : existing.investmentInfo,
            documentsJson: b.documentsJson !== undefined ? b.documentsJson : existing.documentsJson,
            scopeDeliverables: b.scopeDeliverables ?? existing.scopeDeliverables,
            pricingModel: b.pricingModel ?? existing.pricingModel,
            currency: b.currency ?? existing.currency,
            regulatoryNotes: b.regulatoryNotes !== undefined ? b.regulatoryNotes : existing.regulatoryNotes,
            operationalStatus: b.operationalStatus ?? existing.operationalStatus,
            publishStatus: b.publishStatus ?? existing.publishStatus,
            visibilityPublic: b.visibilityPublic !== undefined ? Boolean(b.visibilityPublic) : existing.visibilityPublic,
            displayOrder: b.displayOrder !== undefined ? Number(b.displayOrder) : existing.displayOrder,
            version: nextVer,
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: new Date(),
          })
          .where(eq(divisionServices.id, svcId))
          .returning();

        await createVersionSnapshot({
          entityType: 'SERVICE',
          entityId: svcId,
          versionNumber: nextVer,
          entityTitle: updated.name,
          changeSummary: b.changeSummary || `Updated service (${updated.operationalStatus} / ${updated.publishStatus})`,
          snapshotJson: updated,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'UPDATE_DIVISION_SERVICE',
          entityType: 'SERVICE',
          entityId: svcId,
          entityTitle: updated.name,
          beforeJson: existing,
          afterJson: updated,
        });

        res.json({ success: true, service: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/services/:id/upload-media',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    safeDocMulter,
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const svcId = Number(req.params.id);
        const rows = await db.select().from(divisionServices).where(eq(divisionServices.id, svcId)).limit(1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Service not found' });
        if (!req.file) return res.status(400).json({ error: 'File is required' });

        const kind = req.body?.kind === 'document' ? 'document' : 'image';
        const stored = await storeUploadedFile(req.file, `madecc_services/${svcId}`);

        let updatedRow = existing;
        if (kind === 'image') {
          const [upd] = await db
            .update(divisionServices)
            .set({ imageUrl: stored.fileUrl, version: existing.version + 1, updatedBy: req.dbUser?.email || 'admin', updatedAt: new Date() })
            .where(eq(divisionServices.id, svcId))
            .returning();
          updatedRow = upd;
        } else {
          const prevDocs = Array.isArray(existing.documentsJson) ? existing.documentsJson : [];
          const newDoc = {
            id: `doc_${Date.now()}`,
            title: req.body?.title || req.file.originalname,
            fileName: req.file.originalname,
            fileUrl: stored.fileUrl,
            storageProvider: stored.storageProvider,
            mimeType: req.file.mimetype,
            uploadedAt: new Date().toISOString(),
          };
          const [upd] = await db
            .update(divisionServices)
            .set({ documentsJson: [...prevDocs, newDoc], version: existing.version + 1, updatedBy: req.dbUser?.email || 'admin', updatedAt: new Date() })
            .where(eq(divisionServices.id, svcId))
            .returning();
          updatedRow = upd;
        }

        await logCorporateAudit({
          req,
          action: kind === 'image' ? 'UPLOAD_SERVICE_IMAGE' : 'UPLOAD_SERVICE_DOCUMENT',
          entityType: 'SERVICE',
          entityId: svcId,
          entityTitle: existing.name,
          afterJson: stored,
        });

        res.json({ success: true, service: updatedRow, uploaded: stored });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/services/:id/archive',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const svcId = Number(req.params.id);
        const archive = req.body?.archive !== false;
        const [updated] = await db
          .update(divisionServices)
          .set({
            archivedAt: archive ? new Date() : null,
            publishStatus: archive ? 'ARCHIVED' : 'DRAFT',
            updatedAt: new Date(),
          })
          .where(eq(divisionServices.id, svcId))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Service not found' });

        await logCorporateAudit({
          req,
          action: archive ? 'ARCHIVE_SERVICE' : 'RESTORE_SERVICE',
          entityType: 'SERVICE',
          entityId: svcId,
          entityTitle: updated.name,
        });

        res.json({ success: true, service: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Safe Service Delete (Archives or removes cleanly with audit log)
  app.delete(
    '/api/corporate/services/:id',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const svcId = Number(req.params.id);
        const existingRows = await db.select().from(divisionServices).where(eq(divisionServices.id, svcId)).limit(1);
        const existing = existingRows[0];
        if (!existing) return res.status(404).json({ error: 'Service not found' });

        if (req.query.hardDelete === 'true') {
          await db.delete(divisionServices).where(eq(divisionServices.id, svcId));
          await logCorporateAudit({
            req,
            action: 'DELETE_DIVISION_SERVICE',
            entityType: 'SERVICE',
            entityId: svcId,
            entityTitle: existing.name,
            beforeJson: existing,
            details: `Permanently removed service "${existing.name}"`,
          });
          return res.json({ success: true, deleted: true });
        }

        const [archived] = await db
          .update(divisionServices)
          .set({ archivedAt: new Date(), publishStatus: 'ARCHIVED', visibilityPublic: false, updatedAt: new Date() })
          .where(eq(divisionServices.id, svcId))
          .returning();

        await logCorporateAudit({
          req,
          action: 'SAFE_DELETE_ARCHIVE_SERVICE',
          entityType: 'SERVICE',
          entityId: svcId,
          entityTitle: existing.name,
          beforeJson: existing,
          afterJson: archived,
        });

        res.json({ success: true, service: archived, archived: true });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 5. INVESTOR & PARTNERSHIP PIPELINE (14 STAGES, INTERACTIONS & DOCS)
  // =========================================================================
  app.get(
    '/api/corporate/investors',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const includeArchived = req.query.includeArchived === 'true';

        const list = await db
          .select()
          .from(investors)
          .where(includeArchived ? undefined : isNull(investors.archivedAt))
          .orderBy(desc(investors.id));

        const interactions = await db.select().from(investorInteractions).orderBy(desc(investorInteractions.interactionDate));
        const docs = await db
          .select()
          .from(investorDocuments)
          .where(isNull(investorDocuments.archivedAt))
          .orderBy(desc(investorDocuments.createdAt));

        res.json({
          success: true,
          stages: INVESTOR_STAGES.map((code) => ({ code, label: INVESTOR_STAGE_LABELS[code] })),
          investors: list.map((inv) => ({
            ...inv,
            stageLabel: INVESTOR_STAGE_LABELS[inv.stage] || inv.stage,
            interactions: interactions.filter((i) => i.investorId === inv.id),
            documents: docs.filter((d) => d.investorId === inv.id),
          })),
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/investors',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const b = req.body || {};
        if (!b.investorName) return res.status(400).json({ error: 'investorName is required' });
        const stage = b.stage && INVESTOR_STAGES.includes(b.stage) ? b.stage : 'POTENTIAL_INVESTOR';

        const [created] = await db
          .insert(investors)
          .values({
            investorName: b.investorName.trim(),
            organization: b.organization || null,
            investorType: b.investorType || 'STRATEGIC_PARTNER',
            email: b.email || null,
            phone: b.phone || null,
            investorCountry: b.investorCountry || 'Ghana',
            targetCountry: b.targetCountry || 'Cameroon',
            registrationJurisdiction: b.registrationJurisdiction || 'Cameroon',
            sectorFocus: Array.isArray(b.sectorFocus) ? b.sectorFocus : ['Real Estate & Property Development'],
            ticketSizeMin: b.ticketSizeMin ? String(b.ticketSizeMin) : null,
            ticketSizeMax: b.ticketSizeMax ? String(b.ticketSizeMax) : null,
            currency: b.currency || 'USD',
            stage,
            summary: b.summary || null,
            confidentialNotes: b.confidentialNotes || null,
            publishAsOpportunity: Boolean(b.publishAsOpportunity),
            opportunityTitle: b.opportunityTitle || null,
            opportunityDescription: b.opportunityDescription || null,
            complianceStatus: b.complianceStatus || 'KYC_PENDING',
            ownershipImplicationNote:
              b.ownershipImplicationNote || 'No existing shareholding, signed investment agreement, or capital commitment implied.',
            version: 1,
            createdBy: req.dbUser?.email || 'admin',
            updatedBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await createVersionSnapshot({
          entityType: 'INVESTOR',
          entityId: created.id,
          versionNumber: 1,
          entityTitle: created.investorName,
          changeSummary: `Created investor record (${created.investorCountry} -> ${created.targetCountry})`,
          snapshotJson: created,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'CREATE_INVESTOR',
          entityType: 'INVESTOR',
          entityId: created.id,
          entityTitle: created.investorName,
          afterJson: created,
        });

        res.json({ success: true, investor: created });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.put(
    '/api/corporate/investors/:id',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const invId = Number(req.params.id);
        const existingRows = await db.select().from(investors).where(eq(investors.id, invId)).limit(1);
        const existing = existingRows[0];
        if (!existing) return res.status(404).json({ error: 'Investor record not found' });

        const b = req.body || {};
        if (b.stage && !INVESTOR_STAGES.includes(b.stage)) {
          return res.status(400).json({ error: 'Invalid investor workflow stage' });
        }

        // Guard against marking FUNDING_RECEIVED_VERIFIED or AGREEMENT_SIGNED without verified documentation
        if ((b.stage === 'AGREEMENT_SIGNED' || b.stage === 'FUNDING_RECEIVED_VERIFIED') && b.stage !== existing.stage) {
          const verifiedDocs = await db
            .select()
            .from(investorDocuments)
            .where(
              and(
                eq(investorDocuments.investorId, invId),
                eq(investorDocuments.status, 'VERIFIED'),
                isNull(investorDocuments.archivedAt)
              )
            );
          if (verifiedDocs.length === 0) {
            return res.status(400).json({
              error: `Verification Gate: At least one verified investor document (signed MOU/agreement or KYC proof) must be marked VERIFIED before advancing to ${INVESTOR_STAGE_LABELS[b.stage]}.`,
            });
          }
        }

        const nextVer = existing.version + 1;
        const [updated] = await db
          .update(investors)
          .set({
            investorName: b.investorName ?? existing.investorName,
            organization: b.organization !== undefined ? b.organization : existing.organization,
            investorType: b.investorType ?? existing.investorType,
            email: b.email !== undefined ? b.email : existing.email,
            phone: b.phone !== undefined ? b.phone : existing.phone,
            investorCountry: b.investorCountry ?? existing.investorCountry,
            targetCountry: b.targetCountry ?? existing.targetCountry,
            registrationJurisdiction: b.registrationJurisdiction ?? existing.registrationJurisdiction,
            sectorFocus: b.sectorFocus ?? existing.sectorFocus,
            ticketSizeMin: b.ticketSizeMin !== undefined ? (b.ticketSizeMin ? String(b.ticketSizeMin) : null) : existing.ticketSizeMin,
            ticketSizeMax: b.ticketSizeMax !== undefined ? (b.ticketSizeMax ? String(b.ticketSizeMax) : null) : existing.ticketSizeMax,
            currency: b.currency ?? existing.currency,
            stage: b.stage ?? existing.stage,
            summary: b.summary !== undefined ? b.summary : existing.summary,
            confidentialNotes: b.confidentialNotes !== undefined ? b.confidentialNotes : existing.confidentialNotes,
            publishAsOpportunity: b.publishAsOpportunity !== undefined ? Boolean(b.publishAsOpportunity) : existing.publishAsOpportunity,
            opportunityTitle: b.opportunityTitle !== undefined ? b.opportunityTitle : existing.opportunityTitle,
            opportunityDescription: b.opportunityDescription !== undefined ? b.opportunityDescription : existing.opportunityDescription,
            complianceStatus: b.complianceStatus ?? existing.complianceStatus,
            version: nextVer,
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: new Date(),
          })
          .where(eq(investors.id, invId))
          .returning();

        if (b.stage && b.stage !== existing.stage) {
          await db.insert(investorInteractions).values({
            investorId: invId,
            interactionType: 'STAGE_CHANGE',
            subject: `Stage transitioned: ${INVESTOR_STAGE_LABELS[existing.stage] || existing.stage} -> ${INVESTOR_STAGE_LABELS[updated.stage] || updated.stage}`,
            summary: b.changeSummary || `Stage updated by ${req.dbUser?.email}`,
            isConfidential: true,
            createdBy: req.dbUser?.email || 'admin',
          });
        }

        await createVersionSnapshot({
          entityType: 'INVESTOR',
          entityId: invId,
          versionNumber: nextVer,
          entityTitle: updated.investorName,
          changeSummary: b.changeSummary || `Updated investor stage to ${updated.stage}`,
          snapshotJson: updated,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'UPDATE_INVESTOR',
          entityType: 'INVESTOR',
          entityId: invId,
          entityTitle: updated.investorName,
          beforeJson: existing,
          afterJson: updated,
        });

        res.json({ success: true, investor: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/investors/:id/archive',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const invId = Number(req.params.id);
        const archive = req.body?.archive !== false;
        const [updated] = await db
          .update(investors)
          .set({ archivedAt: archive ? new Date() : null, updatedAt: new Date() })
          .where(eq(investors.id, invId))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Investor record not found' });

        await logCorporateAudit({
          req,
          action: archive ? 'ARCHIVE_INVESTOR' : 'RESTORE_INVESTOR',
          entityType: 'INVESTOR',
          entityId: invId,
          entityTitle: updated.investorName,
        });
        res.json({ success: true, investor: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/investors/:id/interactions',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const invId = Number(req.params.id);
        const b = req.body || {};
        if (!b.subject || !b.summary) {
          return res.status(400).json({ error: 'subject and summary are required' });
        }
        const [created] = await db
          .insert(investorInteractions)
          .values({
            investorId: invId,
            interactionType: b.interactionType || 'MEETING',
            subject: b.subject.trim(),
            summary: b.summary.trim(),
            participants: b.participants || null,
            nextSteps: b.nextSteps || null,
            interactionDate: b.interactionDate ? new Date(b.interactionDate) : new Date(),
            isConfidential: b.isConfidential !== false,
            createdBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await logCorporateAudit({
          req,
          action: 'ADD_INVESTOR_INTERACTION',
          entityType: 'INVESTOR',
          entityId: invId,
          entityTitle: created.subject,
          afterJson: created,
        });

        res.json({ success: true, interaction: created });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/investors/:id/documents',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    safeDocMulter,
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const invId = Number(req.params.id);
        if (!req.file) return res.status(400).json({ error: 'Document file is required' });

        const stored = await storeUploadedFile(req.file, 'madecc_confidential_docs/investors');
        const [doc] = await db
          .insert(investorDocuments)
          .values({
            investorId: invId,
            title: req.body.title || req.file.originalname,
            docType: req.body.docType || 'PROPOSAL',
            fileUrl: stored.fileUrl,
            storageProvider: stored.storageProvider,
            storagePublicId: stored.storagePublicId,
            storagePath: stored.storagePath,
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSizeBytes: req.file.size,
            sha256Checksum: stored.sha256Checksum,
            status: 'PENDING_REVIEW',
            isConfidential: true,
            uploadedBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await logCorporateAudit({
          req,
          action: 'UPLOAD_INVESTOR_DOCUMENT',
          entityType: 'INVESTOR_DOCUMENT',
          entityId: doc.id,
          entityTitle: doc.title,
          afterJson: { investorId: invId, title: doc.title, sha256Checksum: doc.sha256Checksum },
        });

        res.json({ success: true, document: doc });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/investor-documents/:docId/review',
    requireCorporateRoles(['SUPER_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const docId = Number(req.params.docId);
        const { status, reviewNotes } = req.body;
        if (!['PENDING_REVIEW', 'VERIFIED', 'REJECTED'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        const [updated] = await db
          .update(investorDocuments)
          .set({
            status,
            reviewNotes: reviewNotes || null,
            reviewedBy: req.dbUser?.email || 'legal-reviewer',
            reviewedAt: new Date(),
          })
          .where(eq(investorDocuments.id, docId))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Document not found' });

        await logCorporateAudit({
          req,
          action: 'REVIEW_INVESTOR_DOCUMENT',
          entityType: 'INVESTOR_DOCUMENT',
          entityId: docId,
          entityTitle: updated.title,
          afterJson: { status, reviewNotes },
        });

        res.json({ success: true, document: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 6. VERSION HISTORY, DIFF COMPARISON & NON-DESTRUCTIVE RESTORE
  // =========================================================================
  app.get(
    '/api/corporate/versions/:entityType/:entityId',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const entityType = String(req.params.entityType).toUpperCase();
        const entityId = Number(req.params.entityId);
        const versions = await db
          .select()
          .from(corporateContentVersions)
          .where(and(eq(corporateContentVersions.entityType, entityType), eq(corporateContentVersions.entityId, entityId)))
          .orderBy(desc(corporateContentVersions.versionNumber));
        res.json({ success: true, versions });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/versions/:versionId/restore',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const versionId = Number(req.params.versionId);
        const rows = await db
          .select()
          .from(corporateContentVersions)
          .where(eq(corporateContentVersions.id, versionId))
          .limit(1);
        const ver = rows[0];
        if (!ver) return res.status(404).json({ error: 'Version snapshot not found' });

        const snap = (ver.snapshotJson || {}) as any;

        if (ver.entityType === 'BUSINESS_PROFILE') {
          const curRows = await db.select().from(businessProfiles).where(eq(businessProfiles.id, ver.entityId)).limit(1);
          const cur = curRows[0];
          if (!cur) return res.status(404).json({ error: 'Profile not found' });

          // Verification guard applies even on version restore
          let restoredStatus = snap.registrationStatus || cur.registrationStatus;
          if (restoredStatus === 'REGISTERED_VERIFIED') {
            const verifiedDocs = await db
              .select()
              .from(registrationDocuments)
              .where(
                and(
                  eq(registrationDocuments.profileId, cur.id),
                  eq(registrationDocuments.status, 'VERIFIED'),
                  isNull(registrationDocuments.archivedAt)
                )
              );
            if (verifiedDocs.length === 0) {
              restoredStatus = 'REGISTERED_AWAITING_DOC_VERIFICATION';
            }
          }

          const nextVer = cur.version + 1;
          const [restored] = await db
            .update(businessProfiles)
            .set({
              companyName: snap.companyName ?? cur.companyName,
              tradeName: snap.tradeName ?? cur.tradeName,
              motto: snap.motto ?? cur.motto,
              country: snap.country ?? cur.country,
              city: snap.city ?? cur.city,
              streetAddress: snap.streetAddress ?? cur.streetAddress,
              founderName: snap.founderName ?? cur.founderName,
              employeeCount: snap.employeeCount ?? cur.employeeCount,
              registrationStatus: restoredStatus,
              version: nextVer,
              updatedBy: req.dbUser?.email || 'admin',
              updatedAt: new Date(),
            })
            .where(eq(businessProfiles.id, cur.id))
            .returning();

          await createVersionSnapshot({
            entityType: 'BUSINESS_PROFILE',
            entityId: cur.id,
            versionNumber: nextVer,
            entityTitle: restored.companyName,
            changeSummary: `Non-destructive restore from v${ver.versionNumber}`,
            snapshotJson: restored,
            createdBy: req.dbUser?.email || 'admin',
          });

          await logCorporateAudit({
            req,
            action: 'RESTORE_VERSION',
            entityType: 'BUSINESS_PROFILE',
            entityId: cur.id,
            entityTitle: restored.companyName,
            details: `Restored profile state from v${ver.versionNumber} -> new v${nextVer}`,
          });

          return res.json({ success: true, restored });
        }

        if (ver.entityType === 'DIVISION') {
          const curRows = await db.select().from(businessDivisions).where(eq(businessDivisions.id, ver.entityId)).limit(1);
          const cur = curRows[0];
          if (!cur) return res.status(404).json({ error: 'Division not found' });
          const nextVer = cur.version + 1;
          const [restored] = await db
            .update(businessDivisions)
            .set({
              name: snap.name ?? cur.name,
              summary: snap.summary ?? cur.summary,
              fullDescription: snap.fullDescription ?? cur.fullDescription,
              operationalStatus: snap.operationalStatus ?? cur.operationalStatus,
              publishStatus: snap.publishStatus ?? cur.publishStatus,
              version: nextVer,
              updatedBy: req.dbUser?.email || 'admin',
              updatedAt: new Date(),
            })
            .where(eq(businessDivisions.id, cur.id))
            .returning();

          await createVersionSnapshot({
            entityType: 'DIVISION',
            entityId: cur.id,
            versionNumber: nextVer,
            entityTitle: restored.name,
            changeSummary: `Non-destructive restore from v${ver.versionNumber}`,
            snapshotJson: restored,
            createdBy: req.dbUser?.email || 'admin',
          });

          await logCorporateAudit({
            req,
            action: 'RESTORE_VERSION',
            entityType: 'DIVISION',
            entityId: cur.id,
            entityTitle: restored.name,
            details: `Restored division from v${ver.versionNumber} -> new v${nextVer}`,
          });

          return res.json({ success: true, restored });
        }

        if (ver.entityType === 'SERVICE') {
          const curRows = await db.select().from(divisionServices).where(eq(divisionServices.id, ver.entityId)).limit(1);
          const cur = curRows[0];
          if (!cur) return res.status(404).json({ error: 'Service not found' });
          const nextVer = cur.version + 1;
          const [restored] = await db
            .update(divisionServices)
            .set({
              name: snap.name ?? cur.name,
              categoryGroup: snap.categoryGroup ?? cur.categoryGroup,
              shortDescription: snap.shortDescription ?? cur.shortDescription,
              fullDescription: snap.fullDescription ?? cur.fullDescription,
              imageUrl: snap.imageUrl ?? cur.imageUrl,
              investmentInfo: snap.investmentInfo ?? cur.investmentInfo,
              operationalStatus: snap.operationalStatus ?? cur.operationalStatus,
              publishStatus: snap.publishStatus ?? cur.publishStatus,
              displayOrder: snap.displayOrder ?? cur.displayOrder,
              version: nextVer,
              updatedBy: req.dbUser?.email || 'admin',
              updatedAt: new Date(),
            })
            .where(eq(divisionServices.id, cur.id))
            .returning();

          await createVersionSnapshot({
            entityType: 'SERVICE',
            entityId: cur.id,
            versionNumber: nextVer,
            entityTitle: restored.name,
            changeSummary: `Non-destructive restore from v${ver.versionNumber}`,
            snapshotJson: restored,
            createdBy: req.dbUser?.email || 'admin',
          });

          await logCorporateAudit({
            req,
            action: 'RESTORE_VERSION',
            entityType: 'SERVICE',
            entityId: cur.id,
            entityTitle: restored.name,
            details: `Restored service from v${ver.versionNumber} -> new v${nextVer}`,
          });

          return res.json({ success: true, restored });
        }

        if (ver.entityType === 'REAL_ESTATE') {
          const curRows = await db.select().from(realEstateProjects).where(eq(realEstateProjects.id, ver.entityId)).limit(1);
          const cur = curRows[0];
          if (!cur) return res.status(404).json({ error: 'Real estate project not found' });
          const nextVer = cur.version + 1;
          const [restored] = await db
            .update(realEstateProjects)
            .set({
              name: snap.name ?? cur.name,
              location: snap.location ?? cur.location,
              description: snap.description ?? cur.description,
              propertyType: snap.propertyType ?? cur.propertyType,
              developmentStage: snap.developmentStage ?? cur.developmentStage,
              publishStatus: snap.publishStatus ?? cur.publishStatus,
              estimatedBudget: snap.estimatedBudget ?? cur.estimatedBudget,
              investmentRequirements: snap.investmentRequirements ?? cur.investmentRequirements,
              version: nextVer,
              updatedBy: req.dbUser?.email || 'admin',
              updatedAt: new Date(),
            })
            .where(eq(realEstateProjects.id, cur.id))
            .returning();

          await createVersionSnapshot({
            entityType: 'REAL_ESTATE',
            entityId: cur.id,
            versionNumber: nextVer,
            entityTitle: restored.name,
            changeSummary: `Non-destructive restore from v${ver.versionNumber}`,
            snapshotJson: restored,
            createdBy: req.dbUser?.email || 'admin',
          });

          return res.json({ success: true, restored });
        }

        res.status(400).json({ error: `Version restore not supported for entityType ${ver.entityType}` });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 7. CONTROLLED SHARING & INSTANT REVOCATION
  // =========================================================================
  app.get(
    '/api/corporate/shares',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (_req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const rows = await db.select().from(corporateShares).orderBy(desc(corporateShares.createdAt));
        res.json({ success: true, shares: rows });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/shares',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const { entityType, entityId, title, allowPublic, expiresInDays, recipientEmail, recipientName } = req.body;
        if (!entityType || !entityId || !title) {
          return res.status(400).json({ error: 'entityType, entityId, and title are required' });
        }

        const rawToken = `MADECC_CORP_${crypto.randomBytes(18).toString('hex')}`;
        const shareTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const tokenPrefix = rawToken.slice(0, 18);
        const expiresAt = expiresInDays ? new Date(Date.now() + Number(expiresInDays) * 86400000) : null;

        const [created] = await db
          .insert(corporateShares)
          .values({
            shareTokenHash,
            tokenPrefix,
            entityType: String(entityType).toUpperCase(),
            entityId: Number(entityId),
            title: title.trim(),
            permissions: 'VIEW_ONLY',
            allowPublic: allowPublic !== false,
            includeConfidential: false, // Confidential documents are NEVER exposed on share tokens
            recipientEmail: recipientEmail || null,
            recipientName: recipientName || null,
            expiresAt,
            createdBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await logCorporateAudit({
          req,
          action: 'CREATE_CONTROLLED_SHARE',
          entityType: 'CORPORATE_SHARE',
          entityId: created.id,
          entityTitle: created.title,
          details: `Issued read-only share link (${tokenPrefix}...) for ${entityType} #${entityId}`,
        });

        res.json({
          success: true,
          share: created,
          rawToken,
          sharePath: `/api/public/corporate-share/${rawToken}`,
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/shares/:id/revoke',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const shareId = Number(req.params.id);
        const [updated] = await db
          .update(corporateShares)
          .set({
            revokedAt: new Date(),
            revokedBy: req.dbUser?.email || 'admin',
          })
          .where(eq(corporateShares.id, shareId))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Share record not found' });

        await logCorporateAudit({
          req,
          action: 'REVOKE_CONTROLLED_SHARE',
          entityType: 'CORPORATE_SHARE',
          entityId: shareId,
          entityTitle: updated.title,
        });

        res.json({ success: true, share: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 8. REAL SERVER EXPORTS, GLOBAL SEARCH & APPEND-ONLY AUDIT LOGS
  // =========================================================================
  app.get(
    '/api/corporate/export/:module',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const moduleName = String(req.params.module || 'profile').toLowerCase();
        const format = String(req.query.format || 'json').toLowerCase();

        let data: any = null;
        let csvString = '';

        if (moduleName === 'profile') {
          const profiles = await db.select().from(businessProfiles).orderBy(businessProfiles.id).limit(1);
          const p = profiles[0];
          const entities = p ? await db.select().from(businessLegalEntities).where(eq(businessLegalEntities.profileId, p.id)) : [];
          data = { profile: p, legalEntities: entities };
          csvString = toCsv(
            ['Company Name', 'Trade Name', 'Founder', 'Ownership %', 'Legal Structure', 'Registration Status', 'Registration Number', 'Taxpayer Number', 'Country', 'City', 'Employee Count', 'Motto'],
            p
              ? [[
                  p.companyName,
                  p.tradeName,
                  p.founderName,
                  `${p.ownershipPercentage}%`,
                  LEGAL_STRUCTURE_LABELS[p.legalStructure] || p.legalStructure,
                  REGISTRATION_STATUS_LABELS[p.registrationStatus] || p.registrationStatus,
                  p.registrationNumber || 'Not provided',
                  p.taxpayerNumber || 'Not provided',
                  p.country,
                  p.city,
                  String(p.employeeCount),
                  p.motto,
                ]]
              : []
          );
        } else if (moduleName === 'divisions') {
          const divs = await db.select().from(businessDivisions).where(isNull(businessDivisions.archivedAt)).orderBy(businessDivisions.displayOrder);
          data = { divisions: divs };
          csvString = toCsv(
            ['Code', 'Division Name', 'Category', 'Operational Status', 'Publish Status', 'Country', 'Currency', 'Regulatory Body', 'Licence Status'],
            divs.map((d) => [d.code, d.name, d.category, d.operationalStatus, d.publishStatus, d.country, d.currency, d.regulatoryBody || 'Not provided', d.licenceStatus])
          );
        } else if (moduleName === 'investors') {
          const invs = await db.select().from(investors).where(isNull(investors.archivedAt)).orderBy(desc(investors.id));
          data = { investors: invs };
          csvString = toCsv(
            ['Investor', 'Organization', 'Origin Country', 'Target Country', 'Jurisdiction', 'Stage', 'Compliance Status', 'Public Opportunity', 'Ownership Disclaimer'],
            invs.map((i) => [
              i.investorName,
              i.organization || 'Not provided',
              i.investorCountry,
              i.targetCountry,
              i.registrationJurisdiction,
              INVESTOR_STAGE_LABELS[i.stage] || i.stage,
              i.complianceStatus,
              i.publishAsOpportunity ? 'Yes' : 'No',
              i.ownershipImplicationNote,
            ])
          );
        } else if (moduleName === 'services') {
          const svcs = await db.select().from(divisionServices).where(isNull(divisionServices.archivedAt)).orderBy(divisionServices.divisionId, divisionServices.displayOrder);
          data = { services: svcs };
          csvString = toCsv(
            ['ID', 'Division ID', 'Service Name', 'Sub-Category', 'Business Status', 'Publish Status', 'Description'],
            svcs.map((s) => [s.id, s.divisionId, s.name, s.categoryGroup || 'General', s.operationalStatus, s.publishStatus, s.shortDescription])
          );
        } else if (moduleName === 'real-estate') {
          const projs = await db.select().from(realEstateProjects).where(isNull(realEstateProjects.archivedAt)).orderBy(desc(realEstateProjects.id));
          data = { projects: projs };
          csvString = toCsv(
            ['Name', 'Location', 'Property Type', 'Stage', 'Publish Status', 'Conceptual', 'Floors', 'Estimated Budget'],
            projs.map((p) => [p.name, p.location, p.propertyType, p.developmentStage, p.publishStatus, p.isConceptual ? 'Yes (Proposed/Conceptual)' : 'No', p.floors, p.estimatedBudget || 'Pending feasibility'])
          );
        } else if (moduleName === 'pharma') {
          const regs = await db.select().from(pharmaRegulatoryCompliance).where(isNull(pharmaRegulatoryCompliance.archivedAt)).orderBy(desc(pharmaRegulatoryCompliance.id));
          data = { compliance: regs };
          csvString = toCsv(
            ['Country', 'Authority', 'Licence Type', 'Licence Number', 'Verification Status', 'Approval Status', 'Qualified Professional'],
            regs.map((r) => [r.country, r.regulatoryAuthority, r.licenceType, r.licenceNumber || 'Unissued', r.verificationStatus, r.approvalStatus, r.responsibleProfessional || 'Pending appointment'])
          );
        } else if (moduleName === 'enquiries') {
          const enqs = await db.select().from(corporateEnquiries).where(isNull(corporateEnquiries.archivedAt)).orderBy(desc(corporateEnquiries.createdAt));
          data = { enquiries: enqs };
          csvString = toCsv(
            ['Reference', 'Type', 'Name', 'Organization', 'Email', 'Country', 'Status', 'Created'],
            enqs.map((e) => [e.enquiryReference, e.enquiryType, e.fullName, e.organization || 'Individual', e.email, e.country, e.status, e.createdAt.toISOString()])
          );
        } else if (moduleName === 'audit') {
          const logs = await db.select().from(corporateAuditLogs).orderBy(desc(corporateAuditLogs.createdAt)).limit(500);
          data = { auditLogs: logs };
          csvString = toCsv(
            ['Timestamp', 'Actor Email', 'Actor Role', 'Action', 'Entity Type', 'Entity Title', 'Details'],
            logs.map((l) => [l.createdAt.toISOString(), l.actorEmail || 'system', l.actorRole || 'UNKNOWN', l.action, l.entityType, l.entityTitle || 'N/A', l.details || ''])
          );
        } else {
          return res.status(400).json({ error: 'Unknown export module' });
        }

        await logCorporateAudit({
          req,
          action: 'EXPORT_CORPORATE_DATA',
          entityType: moduleName.toUpperCase(),
          details: `Exported ${moduleName} dataset in ${format.toUpperCase()} format`,
        });

        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="madecc-${moduleName}-export.csv"`);
          return res.send(csvString);
        }

        res.json({ success: true, exportedAt: new Date().toISOString(), module: moduleName, data });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 9. REAL ESTATE DEVELOPMENT PROJECTS MANAGEMENT
  // =========================================================================
  app.get(
    '/api/corporate/real-estate',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const includeArchived = req.query.includeArchived === 'true';
        const rows = await db
          .select()
          .from(realEstateProjects)
          .where(includeArchived ? undefined : isNull(realEstateProjects.archivedAt))
          .orderBy(desc(realEstateProjects.updatedAt), desc(realEstateProjects.id));
        res.json({ success: true, projects: rows });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/real-estate',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const b = req.body || {};
        if (!b.name || !b.location || !b.description || !b.propertyType) {
          return res.status(400).json({ error: 'Project name, location, property type, and description are required.' });
        }
        const slug = (b.slug || `${b.name}-${Date.now()}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const stage = b.developmentStage || 'PROPOSED';
        const isConceptual = stage !== 'COMPLETED' && stage !== 'UNDER_CONSTRUCTION' ? b.isConceptual !== false : Boolean(b.isConceptual);

        const [created] = await db
          .insert(realEstateProjects)
          .values({
            name: b.name.trim(),
            slug,
            location: b.location.trim(),
            description: b.description.trim(),
            propertyType: b.propertyType.trim(),
            landArea: b.landArea || null,
            buildingArea: b.buildingArea || null,
            floors: Number(b.floors || 1),
            estimatedBudget: b.estimatedBudget || null,
            budgetCurrency: b.budgetCurrency || 'XAF',
            investmentRequirements: b.investmentRequirements || null,
            developmentStage: stage,
            publishStatus: b.publishStatus || 'DRAFT',
            visibilityPublic: b.visibilityPublic !== false,
            isConceptual,
            disclaimerNote:
              b.disclaimerNote ||
              'Proposed real estate development / conceptual study. Architectural renders represent design intent only and are not completed buildings.',
            photographsJson: b.photographsJson || [],
            architecturalDrawingsJson: b.architecturalDrawingsJson || [],
            rendersJson: b.rendersJson || [],
            feasibilityReportsJson: b.feasibilityReportsJson || [],
            supportingDocsJson: b.supportingDocsJson || [],
            version: 1,
            createdBy: req.dbUser?.email || 'admin',
            updatedBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await createVersionSnapshot({
          entityType: 'REAL_ESTATE',
          entityId: created.id,
          versionNumber: 1,
          entityTitle: created.name,
          changeSummary: `Created real estate project (${created.developmentStage})`,
          snapshotJson: created,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'CREATE_REAL_ESTATE_PROJECT',
          entityType: 'REAL_ESTATE',
          entityId: created.id,
          entityTitle: created.name,
          afterJson: created,
        });

        res.json({ success: true, project: created });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.put(
    '/api/corporate/real-estate/:id',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const projId = Number(req.params.id);
        const rows = await db.select().from(realEstateProjects).where(eq(realEstateProjects.id, projId)).limit(1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Real estate project not found' });

        const b = req.body || {};
        const nextStage = b.developmentStage ?? existing.developmentStage;
        const nextPhotos = b.photographsJson ?? existing.photographsJson ?? [];

        // Guard against misrepresenting renders as completed buildings
        if (nextStage === 'COMPLETED' && (!Array.isArray(nextPhotos) || nextPhotos.length === 0)) {
          return res.status(400).json({
            error: 'Verification Guard: Cannot mark a real estate project as COMPLETED without uploaded verified photographs of the completed property.',
          });
        }

        const nextVer = existing.version + 1;
        const [updated] = await db
          .update(realEstateProjects)
          .set({
            name: b.name ?? existing.name,
            location: b.location ?? existing.location,
            description: b.description ?? existing.description,
            propertyType: b.propertyType ?? existing.propertyType,
            landArea: b.landArea !== undefined ? b.landArea : existing.landArea,
            buildingArea: b.buildingArea !== undefined ? b.buildingArea : existing.buildingArea,
            floors: b.floors !== undefined ? Number(b.floors) : existing.floors,
            estimatedBudget: b.estimatedBudget !== undefined ? b.estimatedBudget : existing.estimatedBudget,
            budgetCurrency: b.budgetCurrency ?? existing.budgetCurrency,
            investmentRequirements: b.investmentRequirements !== undefined ? b.investmentRequirements : existing.investmentRequirements,
            developmentStage: nextStage,
            publishStatus: b.publishStatus ?? existing.publishStatus,
            visibilityPublic: b.visibilityPublic !== undefined ? Boolean(b.visibilityPublic) : existing.visibilityPublic,
            isConceptual: nextStage === 'COMPLETED' ? false : b.isConceptual !== undefined ? Boolean(b.isConceptual) : existing.isConceptual,
            disclaimerNote: b.disclaimerNote ?? existing.disclaimerNote,
            photographsJson: b.photographsJson ?? existing.photographsJson,
            architecturalDrawingsJson: b.architecturalDrawingsJson ?? existing.architecturalDrawingsJson,
            rendersJson: b.rendersJson ?? existing.rendersJson,
            feasibilityReportsJson: b.feasibilityReportsJson ?? existing.feasibilityReportsJson,
            supportingDocsJson: b.supportingDocsJson ?? existing.supportingDocsJson,
            version: nextVer,
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: new Date(),
          })
          .where(eq(realEstateProjects.id, projId))
          .returning();

        await createVersionSnapshot({
          entityType: 'REAL_ESTATE',
          entityId: projId,
          versionNumber: nextVer,
          entityTitle: updated.name,
          changeSummary: b.changeSummary || `Updated project (${updated.developmentStage} / ${updated.publishStatus})`,
          snapshotJson: updated,
          createdBy: req.dbUser?.email || 'admin',
        });

        await logCorporateAudit({
          req,
          action: 'UPDATE_REAL_ESTATE_PROJECT',
          entityType: 'REAL_ESTATE',
          entityId: projId,
          entityTitle: updated.name,
          beforeJson: existing,
          afterJson: updated,
        });

        res.json({ success: true, project: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/real-estate/:id/upload-asset',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    safeDocMulter,
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const projId = Number(req.params.id);
        const rows = await db.select().from(realEstateProjects).where(eq(realEstateProjects.id, projId)).limit(1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Project not found' });
        if (!req.file) return res.status(400).json({ error: 'File is required' });

        const category = String(req.body?.category || 'renders');
        const stored = await storeUploadedFile(req.file, `madecc_real_estate/${projId}/${category}`);

        const asset = {
          id: `re_${Date.now()}`,
          title: req.body?.title || req.file.originalname,
          fileName: req.file.originalname,
          fileUrl: stored.fileUrl,
          storageProvider: stored.storageProvider,
          mimeType: req.file.mimetype,
          label: category === 'renders' ? 'Conceptual Render — Not a Completed Building' : req.body?.title || category,
          uploadedAt: new Date().toISOString(),
        };

        const patch: any = { version: existing.version + 1, updatedBy: req.dbUser?.email || 'admin', updatedAt: new Date() };
        if (category === 'photographs') patch.photographsJson = [...(Array.isArray(existing.photographsJson) ? existing.photographsJson : []), asset];
        else if (category === 'drawings') patch.architecturalDrawingsJson = [...(Array.isArray(existing.architecturalDrawingsJson) ? existing.architecturalDrawingsJson : []), asset];
        else if (category === 'feasibility') patch.feasibilityReportsJson = [...(Array.isArray(existing.feasibilityReportsJson) ? existing.feasibilityReportsJson : []), asset];
        else if (category === 'supporting') patch.supportingDocsJson = [...(Array.isArray(existing.supportingDocsJson) ? existing.supportingDocsJson : []), asset];
        else patch.rendersJson = [...(Array.isArray(existing.rendersJson) ? existing.rendersJson : []), asset];

        const [updated] = await db.update(realEstateProjects).set(patch).where(eq(realEstateProjects.id, projId)).returning();

        await logCorporateAudit({
          req,
          action: 'UPLOAD_REAL_ESTATE_ASSET',
          entityType: 'REAL_ESTATE',
          entityId: projId,
          entityTitle: existing.name,
          afterJson: { category, asset },
        });

        res.json({ success: true, project: updated, asset });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/real-estate/:id/archive',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const projId = Number(req.params.id);
        const archive = req.body?.archive !== false;
        const [updated] = await db
          .update(realEstateProjects)
          .set({
            archivedAt: archive ? new Date() : null,
            publishStatus: archive ? 'ARCHIVED' : 'DRAFT',
            updatedAt: new Date(),
          })
          .where(eq(realEstateProjects.id, projId))
          .returning();
        if (!updated) return res.status(404).json({ error: 'Project not found' });
        res.json({ success: true, project: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 10. PHARMACEUTICAL & HEALTHCARE REGULATORY COMPLIANCE
  // =========================================================================
  app.get(
    '/api/corporate/pharma-compliance',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (_req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const rows = await db
          .select()
          .from(pharmaRegulatoryCompliance)
          .where(isNull(pharmaRegulatoryCompliance.archivedAt))
          .orderBy(desc(pharmaRegulatoryCompliance.id));
        res.json({ success: true, records: rows });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/pharma-compliance',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const b = req.body || {};
        if (!b.country || !b.regulatoryAuthority || !b.licenceType) {
          return res.status(400).json({ error: 'country, regulatoryAuthority, and licenceType are required.' });
        }

        // Strict Compliance Gate on creation: never create pre-approved without proof
        const [created] = await db
          .insert(pharmaRegulatoryCompliance)
          .values({
            country: b.country.trim(),
            regulatoryAuthority: b.regulatoryAuthority.trim(),
            licenceType: b.licenceType.trim(),
            licenceNumber: b.licenceNumber || null,
            issueDate: b.issueDate ? new Date(b.issueDate) : null,
            expiryDate: b.expiryDate ? new Date(b.expiryDate) : null,
            verificationStatus: 'UNVERIFIED',
            responsibleProfessional: b.responsibleProfessional || null,
            professionalQualification: b.professionalQualification || null,
            approvalStatus: b.approvalStatus === 'APPROVED' ? 'UNDER_INSPECTION' : b.approvalStatus || 'NOT_APPLIED',
            complianceNotes: b.complianceNotes || null,
            createdBy: req.dbUser?.email || 'admin',
            updatedBy: req.dbUser?.email || 'admin',
          })
          .returning();

        await logCorporateAudit({
          req,
          action: 'CREATE_PHARMA_COMPLIANCE_RECORD',
          entityType: 'PHARMA_COMPLIANCE',
          entityId: created.id,
          entityTitle: `${created.country} — ${created.licenceType}`,
          afterJson: created,
        });

        res.json({ success: true, record: created });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.put(
    '/api/corporate/pharma-compliance/:id',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const recId = Number(req.params.id);
        const rows = await db.select().from(pharmaRegulatoryCompliance).where(eq(pharmaRegulatoryCompliance.id, recId)).limit(1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Compliance record not found' });

        const b = req.body || {};
        const effectiveRole = resolveEffectiveCorporateRole(req.dbUser);
        const targetVerification = b.verificationStatus ?? existing.verificationStatus;
        const targetApproval = b.approvalStatus ?? existing.approvalStatus;
        const nextDocUrl = b.licenceDocumentUrl !== undefined ? b.licenceDocumentUrl : existing.licenceDocumentUrl;
        const nextLicenceNum = String(b.licenceNumber !== undefined ? b.licenceNumber : existing.licenceNumber || '').trim();
        const nextResponsible = String(b.responsibleProfessional !== undefined ? b.responsibleProfessional : existing.responsibleProfessional || '').trim();

        // Mandatory Documentary + Authorized Reviewer Gate
        if (targetVerification === 'VERIFIED' || targetApproval === 'APPROVED') {
          if (effectiveRole !== 'SUPER_ADMIN' && effectiveRole !== 'LEGAL_REVIEWER') {
            return res.status(403).json({ error: 'Only Super Admin or Legal/Compliance Reviewer may approve pharmaceutical licences.' });
          }
          if (!nextDocUrl) {
            return res.status(400).json({
              error: 'Compliance Gate: Upload a genuine official licence document before marking verification or approval as APPROVED/VERIFIED.',
            });
          }
          if (!nextLicenceNum || !nextResponsible) {
            return res.status(400).json({
              error: 'Compliance Gate: Official licence number and responsible qualified professional (pharmacist/regulator contact) are required before approval.',
            });
          }
        }

        const [updated] = await db
          .update(pharmaRegulatoryCompliance)
          .set({
            country: b.country ?? existing.country,
            regulatoryAuthority: b.regulatoryAuthority ?? existing.regulatoryAuthority,
            licenceType: b.licenceType ?? existing.licenceType,
            licenceNumber: nextLicenceNum || null,
            issueDate: b.issueDate ? new Date(b.issueDate) : existing.issueDate,
            expiryDate: b.expiryDate ? new Date(b.expiryDate) : existing.expiryDate,
            verificationStatus: targetVerification,
            responsibleProfessional: nextResponsible || null,
            professionalQualification: b.professionalQualification !== undefined ? b.professionalQualification : existing.professionalQualification,
            approvalStatus: targetApproval,
            complianceNotes: b.complianceNotes !== undefined ? b.complianceNotes : existing.complianceNotes,
            reviewedBy: targetVerification === 'VERIFIED' ? req.dbUser?.email || 'reviewer' : existing.reviewedBy,
            reviewedAt: targetVerification === 'VERIFIED' ? new Date() : existing.reviewedAt,
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: new Date(),
          })
          .where(eq(pharmaRegulatoryCompliance.id, recId))
          .returning();

        await logCorporateAudit({
          req,
          action: 'UPDATE_PHARMA_COMPLIANCE',
          entityType: 'PHARMA_COMPLIANCE',
          entityId: recId,
          entityTitle: updated.licenceType,
          beforeJson: existing,
          afterJson: updated,
        });

        res.json({ success: true, record: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.post(
    '/api/corporate/pharma-compliance/:id/upload-licence',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    safeDocMulter,
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const recId = Number(req.params.id);
        if (!req.file) return res.status(400).json({ error: 'Licence document file is required' });

        const stored = await storeUploadedFile(req.file, `madecc_confidential_docs/pharma/${recId}`);
        const [updated] = await db
          .update(pharmaRegulatoryCompliance)
          .set({
            licenceDocumentUrl: stored.fileUrl,
            licenceDocumentName: req.file.originalname,
            storageProvider: stored.storageProvider,
            sha256Checksum: stored.sha256Checksum,
            verificationStatus: 'PENDING_VERIFICATION',
            updatedBy: req.dbUser?.email || 'admin',
            updatedAt: new Date(),
          })
          .where(eq(pharmaRegulatoryCompliance.id, recId))
          .returning();

        await logCorporateAudit({
          req,
          action: 'UPLOAD_PHARMA_LICENCE_DOCUMENT',
          entityType: 'PHARMA_COMPLIANCE',
          entityId: recId,
          entityTitle: req.file.originalname,
          afterJson: { sha256Checksum: stored.sha256Checksum },
        });

        res.json({ success: true, record: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // =========================================================================
  // 11. INVESTOR & PARTNERSHIP ENQUIRIES ADMIN MANAGEMENT
  // =========================================================================
  app.get(
    '/api/corporate/enquiries',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (_req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const rows = await db
          .select()
          .from(corporateEnquiries)
          .where(isNull(corporateEnquiries.archivedAt))
          .orderBy(desc(corporateEnquiries.createdAt));
        res.json({ success: true, enquiries: rows });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.patch(
    '/api/corporate/enquiries/:id',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const enqId = Number(req.params.id);
        const rows = await db.select().from(corporateEnquiries).where(eq(corporateEnquiries.id, enqId)).limit(1);
        const existing = rows[0];
        if (!existing) return res.status(404).json({ error: 'Enquiry not found' });

        const b = req.body || {};
        const nextStatus = b.status ?? existing.status;
        const nextResponse = b.adminResponse !== undefined ? b.adminResponse : existing.adminResponse;

        const [updated] = await db
          .update(corporateEnquiries)
          .set({
            status: nextStatus,
            adminResponse: nextResponse,
            respondedBy: nextResponse ? req.dbUser?.email || 'admin' : existing.respondedBy,
            respondedAt: nextResponse ? new Date() : existing.respondedAt,
            updatedAt: new Date(),
          })
          .where(eq(corporateEnquiries.id, enqId))
          .returning();

        if (b.sendEmailReply && nextResponse && existing.email) {
          await sendEmail(
            existing.email,
            `Re: MADECC Group Enquiry (${existing.enquiryReference}) — ${existing.enquiryType}`,
            `Dear ${existing.fullName},\n\n${nextResponse}\n\nReference: ${existing.enquiryReference}\nMADECC Group Executive Desk`,
            buildBrandedHtmlTemplate({
              title: `Response to Your ${existing.enquiryType} Enquiry`,
              badge: existing.enquiryReference,
              recipientName: existing.fullName,
              leadParagraph: `Our corporate development desk has reviewed your enquiry (${existing.enquiryReference}):`,
              sectionsHtml: `<div style="padding:14px; background:#f8fafc; border-left:4px solid #f59e0b; font-size:14px; white-space:pre-wrap;">${nextResponse}</div>`,
            })
          ).catch((e) => console.warn('[ENQUIRY_REPLY_EMAIL_WARN]', e?.message || e));
        }

        await logCorporateAudit({
          req,
          action: 'UPDATE_CORPORATE_ENQUIRY',
          entityType: 'CORPORATE_ENQUIRY',
          entityId: enqId,
          entityTitle: existing.enquiryReference,
          beforeJson: { status: existing.status },
          afterJson: { status: updated.status, responded: Boolean(nextResponse) },
        });

        res.json({ success: true, enquiry: updated });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  app.get(
    '/api/corporate/search',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER', 'CONTENT_ADMIN']),
    async (req: AuthRequest, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const q = String(req.query.q || '').trim();
        if (!q) return res.json({ success: true, results: [] });

        const pattern = `%${q}%`;
        const effectiveRole = resolveEffectiveCorporateRole(req.dbUser);

        const [divMatches, svcMatches, docMatches, invMatches] = await Promise.all([
          db
            .select()
            .from(businessDivisions)
            .where(or(ilike(businessDivisions.name, pattern), ilike(businessDivisions.summary, pattern), ilike(businessDivisions.category, pattern)))
            .limit(10),
          db
            .select()
            .from(divisionServices)
            .where(or(ilike(divisionServices.name, pattern), ilike(divisionServices.shortDescription, pattern)))
            .limit(10),
          effectiveRole === 'CONTENT_ADMIN'
            ? Promise.resolve([])
            : db
                .select()
                .from(registrationDocuments)
                .where(or(ilike(registrationDocuments.title, pattern), ilike(registrationDocuments.docType, pattern)))
                .limit(10),
          effectiveRole === 'CONTENT_ADMIN'
            ? Promise.resolve([])
            : db
                .select()
                .from(investors)
                .where(or(ilike(investors.investorName, pattern), ilike(investors.investorCountry, pattern), ilike(investors.summary, pattern)))
                .limit(10),
        ]);

        res.json({
          success: true,
          results: [
            ...divMatches.map((d) => ({ module: 'DIVISION', id: d.id, title: d.name, subtitle: `${d.operationalStatus} · ${d.country}` })),
            ...svcMatches.map((s) => ({ module: 'SERVICE', id: s.id, title: s.name, subtitle: s.shortDescription })),
            ...docMatches.map((doc) => ({ module: 'REGISTRATION_DOC', id: doc.id, title: doc.title, subtitle: `${doc.status} · Confidential` })),
            ...invMatches.map((inv) => ({ module: 'INVESTOR', id: inv.id, title: inv.investorName, subtitle: `${inv.investorCountry} -> ${inv.targetCountry} · ${inv.stage}` })),
          ],
        });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );

  // Append-only Audit Trail Query (NO PUT/PATCH/DELETE endpoints exist by design)
  app.get(
    '/api/corporate/audit-logs',
    requireCorporateRoles(['SUPER_ADMIN', 'BUSINESS_ADMIN', 'LEGAL_REVIEWER']),
    async (req, res) => {
      try {
        if (!db) return res.status(503).json({ error: 'Database unavailable' });
        const limit = Math.min(200, Number(req.query.limit || 100));
        const logs = await db.select().from(corporateAuditLogs).orderBy(desc(corporateAuditLogs.createdAt)).limit(limit);
        res.json({ success: true, logs });
      } catch (err: any) {
        res.status(500).json({ error: err.message });
      }
    }
  );
}
