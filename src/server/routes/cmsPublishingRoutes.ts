import express from 'express';
import fs from 'fs';
import path from 'path';
import { db, pool, getOrInitPool } from '../../db/index.ts';
import {
  pageContents,
  pageContentRevisions,
  mediaLibrary,
  cmsActivityLogs,
  legalDocuments,
  legalDocumentRevisions,
  contentReviews,
  publicationHistory,
  maintenanceSchedules,
  visitorAnnouncements,
  siteRoutesConfig,
  services,
  projects,
  blogPosts,
  heroBanners,
  businessProfiles,
  apiProducts,
  apiPlans,
  apiPaymentTransactions,
} from '../../db/schema.ts';
import { ensureCmsTables } from '../../db/ensureCmsTables.ts';
import { getSiteSettings, upsertSiteSettings } from '../../db/ensureSiteSettings.ts';
import { requireStaffOrAdmin, requireAdmin } from '../../middleware/auth.ts';
import { sendNotificationEmail, sendEmail } from '../../lib/email.ts';
import {
  sanitizeRichHtml,
  sanitizeCmsPagePayload,
  sanitizeDeveloperPortalConfig,
  analyzeHumanContentEditorial,
} from '../cmsSanitizer.ts';
import { eq, desc, and, lte, gte, or, isNull, sql } from 'drizzle-orm';
import { isSafePublicHttpsMediaUrl } from '../storageService.ts';
import { ALL_PUBLIC_PAGE_TEMPLATES } from '../cmsDefaultPages.ts';

const ADMIN_SMTP_USER = process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'kreboya603@gmail.com';
const CANONICAL_ORIGIN = 'https://madeccgroup.online';

let lastScheduleSweepAt = 0;

/**
 * Lightweight, serverless-safe due-schedule processor.
 * Runs idempotently on public/admin CMS reads (throttled to every 15s per instance).
 */
export async function processDueCmsSchedules(): Promise<void> {
  const nowMs = Date.now();
  if (nowMs - lastScheduleSweepAt < 15_000) return;
  lastScheduleSweepAt = nowMs;

  try {
    await ensureCmsTables();
    const now = new Date();

    // 1. Auto-publish scheduled CMS pages whose time has arrived
    const duePages = await db
      .select()
      .from(pageContents)
      .where(and(eq(pageContents.status, 'SCHEDULED'), lte(pageContents.scheduledPublishAt, now)));

    for (const p of duePages) {
      try {
        const draft = (p.draftData as any) || {
          heroConfig: p.heroConfig,
          sections: p.sections,
          seo: p.seo,
        };
        const sanitized = sanitizeCmsPagePayload(draft);
        const nextVersion = (p.version || 1) + 1;

        await db
          .update(pageContents)
          .set({
            heroConfig: sanitized.heroConfig ?? p.heroConfig,
            sections: sanitized.sections ?? p.sections,
            seo: sanitized.seo ?? p.seo,
            publishedData: sanitized,
            draftData: sanitized,
            status: 'PUBLISHED',
            version: nextVersion,
            publishedAt: now,
            scheduledPublishAt: null,
            lastPublishError: null,
            updatedAt: now,
          })
          .where(eq(pageContents.id, p.id));

        await db.insert(pageContentRevisions).values({
          pageSlug: p.slug,
          version: nextVersion,
          title: `${p.title} - Scheduled v${nextVersion}`,
          snapshotData: sanitized,
          changeSummary: 'Automatically published on schedule',
          author: p.lastSavedBy || 'Scheduler',
          status: 'PUBLISHED',
          actionType: 'AUTO_PUBLISH',
          publishedAt: now,
          isPublished: true,
        });

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: p.slug,
          targetTitle: p.title,
          action: 'AUTO_PUBLISH',
          fromStatus: 'SCHEDULED',
          toStatus: 'PUBLISHED',
          version: nextVersion,
          success: true,
          performedBy: 'System Scheduler',
          details: `Scheduled publication executed for /${p.slug}`,
        });
      } catch (err: any) {
        await db
          .update(pageContents)
          .set({ lastPublishError: err?.message || 'Scheduled publish error', updatedAt: now })
          .where(eq(pageContents.id, p.id))
          .catch(() => {});
        await db
          .insert(publicationHistory)
          .values({
            targetType: 'page',
            targetSlug: p.slug,
            targetTitle: p.title,
            action: 'FAIL',
            fromStatus: 'SCHEDULED',
            toStatus: 'SCHEDULED',
            success: false,
            errorMessage: err?.message || 'Auto-publish failure',
            performedBy: 'System Scheduler',
          })
          .catch(() => {});
      }
    }

    // 2. Auto-publish scheduled Legal Documents
    const dueLegal = await db
      .select()
      .from(legalDocuments)
      .where(and(eq(legalDocuments.status, 'SCHEDULED'), lte(legalDocuments.scheduledPublishAt, now)));

    for (const doc of dueLegal) {
      const draft = (doc.draftData as any) || {
        title: doc.title,
        docType: doc.docType,
        summary: doc.summary,
        contentHtml: doc.contentHtml,
        effectiveDate: doc.effectiveDate,
        lastUpdatedDate: doc.lastUpdatedDate,
      };
      const cleanHtml = sanitizeRichHtml(draft.contentHtml || doc.contentHtml);
      const nextVersion = (doc.version || 1) + 1;
      const publishedPayload = { ...draft, contentHtml: cleanHtml };

      await db
        .update(legalDocuments)
        .set({
          contentHtml: cleanHtml,
          publishedData: publishedPayload,
          draftData: publishedPayload,
          status: 'PUBLISHED',
          version: nextVersion,
          publishedAt: now,
          scheduledPublishAt: null,
          updatedAt: now,
        })
        .where(eq(legalDocuments.id, doc.id));

      await db.insert(legalDocumentRevisions).values({
        legalSlug: doc.slug,
        version: nextVersion,
        title: doc.title,
        snapshotData: publishedPayload,
        changeSummary: 'Scheduled legal document publish',
        author: doc.updatedBy || 'System Scheduler',
        isPublished: true,
      });

      await db.insert(publicationHistory).values({
        targetType: 'legal',
        targetSlug: doc.slug,
        targetTitle: doc.title,
        action: 'AUTO_PUBLISH',
        fromStatus: 'SCHEDULED',
        toStatus: 'PUBLISHED',
        version: nextVersion,
        success: true,
        performedBy: 'System Scheduler',
      });
    }

    // 3. Maintenance windows: activate SCHEDULED when startAt <= now; complete ACTIVE when endAt <= now
    await db
      .update(maintenanceSchedules)
      .set({ status: 'ACTIVE', updatedAt: now })
      .where(and(eq(maintenanceSchedules.status, 'SCHEDULED'), lte(maintenanceSchedules.startAt, now)));

    await db
      .update(maintenanceSchedules)
      .set({ status: 'COMPLETED', updatedAt: now })
      .where(and(eq(maintenanceSchedules.status, 'ACTIVE'), lte(maintenanceSchedules.endAt, now)));

    // 4. Visitor announcements: auto-activate publishAt <= now and auto-deactivate expireAt <= now
    await db
      .update(visitorAnnouncements)
      .set({ active: true, updatedAt: now })
      .where(
        and(
          eq(visitorAnnouncements.active, false),
          lte(visitorAnnouncements.publishAt, now),
          or(isNull(visitorAnnouncements.expireAt), gte(visitorAnnouncements.expireAt, now))
        )
      );

    await db
      .update(visitorAnnouncements)
      .set({ active: false, updatedAt: now })
      .where(and(eq(visitorAnnouncements.active, true), lte(visitorAnnouncements.expireAt, now)));
  } catch (err: any) {
    console.warn('[CMS_SCHEDULER_SWEEP_WARN]', err?.message || err);
  }
}

/**
 * Ensure core 8 public page groups exist in page_contents without overwriting user edits.
 */
export async function ensureCoreCmsPagesExist(): Promise<void> {
  await ensureCmsTables();
  await db.delete(pageContents).where(eq(pageContents.slug, 'manage')).catch(() => {});

  for (const cp of ALL_PUBLIC_PAGE_TEMPLATES) {
    const existing = await db
      .select({
        id: pageContents.id,
        sections: pageContents.sections,
        version: pageContents.version,
        pageGroup: pageContents.pageGroup,
      })
      .from(pageContents)
      .where(eq(pageContents.slug, cp.slug))
      .limit(1);

    const payload = {
      heroConfig: cp.heroConfig,
      sections: cp.sections,
      seo: cp.seo,
    };

    if (existing.length === 0) {
      await db
        .insert(pageContents)
        .values({
          slug: cp.slug,
          title: cp.title,
          pageGroup: cp.group,
          status: 'PUBLISHED',
          reviewStatus: 'NOT_REVIEWED',
          heroConfig: cp.heroConfig,
          sections: cp.sections,
          seo: cp.seo,
          draftData: payload,
          publishedData: payload,
          version: 1,
          lastSavedBy: 'System Initializer',
          publishedAt: new Date(),
        })
        .onConflictDoNothing();
    } else {
      const row = existing[0];
      const hasEmptySections = !Array.isArray(row.sections) || row.sections.length === 0;
      if (hasEmptySections && (row.version ?? 1) === 1 && cp.sections.length > 0) {
        await db
          .update(pageContents)
          .set({
            pageGroup: row.pageGroup || cp.group,
            sections: cp.sections,
            draftData: payload,
            publishedData: payload,
          })
          .where(eq(pageContents.id, row.id));
      } else if (!row.pageGroup) {
        await db
          .update(pageContents)
          .set({ pageGroup: cp.group })
          .where(and(eq(pageContents.slug, cp.slug), isNull(pageContents.pageGroup)));
      }
    }
  }
}

export async function generateDynamicSitemapXml(): Promise<string> {
  await ensureCmsTables();
  const routes = await db.select().from(siteRoutesConfig).orderBy(siteRoutesConfig.path);
  const pages = await db.select().from(pageContents);
  const pageMap = new Map<string, any>(pages.map((p) => [p.slug, p]));

  const today = new Date().toISOString().split('T')[0];
  const entries = routes.filter((r) => {
    if (r.isSystemRoute) return false;
    if (!r.includeInSitemap || !r.robotsIndex) return false;
    if (r.path.startsWith('/admin') || r.path.startsWith('/api')) return false;
    const slug = r.path === '/' ? 'home' : r.path.replace(/^\//, '');
    const cmsPage = pageMap.get(slug);
    if (cmsPage && (cmsPage.status === 'UNPUBLISHED' || cmsPage.status === 'ARCHIVED')) return false;
    return true;
  });

  const urlsXml = entries
    .map((r) => {
      const loc = `${CANONICAL_ORIGIN}${r.path === '/' ? '/' : r.path}`;
      const lastmod = r.updatedAt ? new Date(r.updatedAt).toISOString().split('T')[0] : today;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${r.changefreq || 'weekly'}</changefreq>\n    <priority>${r.priority || '0.8'}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlsXml}\n</urlset>\n`;
}

export async function generateDynamicRobotsTxt(): Promise<string> {
  const settings = await getSiteSettings();
  const cfg = (settings.discoveryConfig as any) || {};
  const disallowList: string[] = Array.isArray(cfg.robotsDisallow) ? cfg.robotsDisallow : ['/admin', '/api/', '/login'];
  const allowList: string[] = Array.isArray(cfg.robotsAllow) ? cfg.robotsAllow : ['/', '/ads.txt', '/llms.txt', '/ai-catalog.json'];

  // Enforce mandatory exclusion of admin/api/private paths
  const safeDisallow = Array.from(new Set(['/admin', '/api/', '/login', ...disallowList]));

  const lines: string[] = [
    'User-agent: Googlebot',
    ...allowList.map((p) => `Allow: ${p}`),
    ...safeDisallow.map((p) => `Disallow: ${p}`),
    '',
    'User-agent: GPTBot',
    'Allow: /',
    'Allow: /llms.txt',
    'Allow: /ai-catalog.json',
    ...safeDisallow.map((p) => `Disallow: ${p}`),
    '',
    'User-agent: *',
    ...allowList.map((p) => `Allow: ${p}`),
    ...safeDisallow.map((p) => `Disallow: ${p}`),
  ];

  if (cfg.customRobotsDirectives && typeof cfg.customRobotsDirectives === 'string') {
    lines.push('', cfg.customRobotsDirectives.trim());
  }

  lines.push('', `Host: ${CANONICAL_ORIGIN}`, `Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`, '');
  return lines.join('\n');
}

export async function generateDynamicLlmsTxt(): Promise<string> {
  const settings = await getSiteSettings();
  const cfg = (settings.discoveryConfig as any) || {};
  const routes = await db.select().from(siteRoutesConfig);
  const publicRoutes = routes.filter((r) => !r.isSystemRoute && r.robotsIndex && r.status === 'PUBLISHED');

  const coreSlugs = new Set(['/', '/about', '/services', '/projects', '/budget-calculator', '/construction-cost-guide', '/website-development', '/developers', '/contact', '/sitemap']);
  const coreRoutes = publicRoutes.filter((r) => coreSlugs.has(r.path));
  const optionalRoutes = publicRoutes.filter((r) => !coreSlugs.has(r.path));

  const formatLine = (r: any) => {
    const cleanTitle = (r.title || r.path || 'MADECC Page').replace(/[\[\]\n\r]/g, ' ').trim();
    const cleanDesc = (r.metaDescription || 'Official MADECC GROUP portal resource.').replace(/\s+/g, ' ').trim();
    return `- [${cleanTitle}](${CANONICAL_ORIGIN}${r.path}): ${cleanDesc}`;
  };

  const coreLines = (coreRoutes.length > 0 ? coreRoutes : publicRoutes).map(formatLine).join('\n');
  const optionalLines = optionalRoutes.map(formatLine).join('\n');

  return [
    `# ${settings.siteName || 'MADECC GROUP'}`,
    '',
    `> ${cfg.llmsSummary || settings.tagline || 'Construction, Civil Engineering & Multi-Division Enterprise Platform in Cameroon.'}`,
    '',
    '## Verified Corporate Facts',
    `- Founder: Kasah Rodrick Reboya`,
    `- Headquarters: ${settings.officeAddressYaounde || 'Mbankolo, Yaoundé, Cameroon'}`,
    `- Taxpayer ID (NIU): ${settings.niuTaxId || 'P030217852934P'}`,
    `- Entity Registration Status: ${settings.legalStatus || 'Individual establishment registration pending'}`,
    `- Primary Contact Email: ${settings.email || 'kreboya603@gmail.com'}`,
    `- Official Phone: ${settings.phone || '+237 683 31 64 86'}`,
    '',
    '## Core Services & Documentation',
    coreLines || `- [MADECC GROUP Home](${CANONICAL_ORIGIN}/): Premier Civil Engineering, Construction & Digital Solutions in Cameroon.`,
    '',
    '## Optional',
    optionalLines || `- [AI Service Catalog](${CANONICAL_ORIGIN}/ai-catalog.json): Machine-readable service and API directory.`,
    `- [Sitemap XML](${CANONICAL_ORIGIN}/sitemap.xml): Complete XML index of canonical MADECC GROUP URLs.`,
    '',
  ].join('\n');
}

export async function getActiveMaintenanceForPublic(): Promise<any> {
  await processDueCmsSchedules();
  const rows = await db.select().from(maintenanceSchedules).orderBy(desc(maintenanceSchedules.updatedAt)).limit(5);
  const activeOrEmergency = rows.find((r) => r.status === 'ACTIVE' || r.status === 'EMERGENCY');
  const latest = activeOrEmergency || rows[0];

  if (!latest) {
    return {
      enabled: false,
      mode: 'non_intrusive_banner',
      title: 'Scheduled Platform Enhancement & Maintenance in Progress',
      message: 'All public pages and engineering calculators remain operational.',
      estimatedCompletion: 'N/A',
      affectedModules: 'None',
      allowFullBrowsing: true,
      allowAdminBypass: true,
      smtpUser: ADMIN_SMTP_USER,
      timezone: 'Africa/Douala',
      subscribers: [],
    };
  }

  return {
    id: latest.id,
    enabled: latest.status === 'ACTIVE' || latest.status === 'EMERGENCY',
    status: latest.status,
    mode: latest.mode,
    title: latest.title,
    message: latest.message,
    timezone: latest.timezone,
    startAt: latest.startAt,
    endAt: latest.endAt,
    estimatedCompletion: latest.estimatedCompletion || (latest.endAt ? new Date(latest.endAt).toISOString() : 'Upon completion'),
    affectedModules: latest.affectedScope || 'Scheduled system maintenance',
    allowFullBrowsing: !latest.fullSiteAdvisory,
    allowAdminBypass: latest.allowAdminBypass !== false,
    fullSiteAdvisory: latest.fullSiteAdvisory,
    smtpUser: ADMIN_SMTP_USER,
    lastTriggeredAt: latest.updatedAt,
    lastSmtpDispatchAt: latest.lastSmtpDispatchAt,
    lastSmtpStatus: latest.lastSmtpStatus,
    subscribers: Array.isArray(latest.subscribersJson) ? latest.subscribersJson : [],
  };
}

export function setupCmsPublishingRoutes(app: express.Express) {
  // 1. Website Overview (Verified Live Neon DB Metrics Only — No Mock Data)
  app.get('/api/cms/overview', requireStaffOrAdmin, async (_req, res) => {
    try {
      await processDueCmsSchedules();
      await ensureCoreCmsPagesExist();

      const [
        allPages,
        allMedia,
        allLegal,
        allRoutes,
        allMaintenance,
        allAnnouncements,
        allReviews,
        recentHistory,
        recentLogs,
      ] = await Promise.all([
        db.select().from(pageContents).catch(() => []),
        db.select().from(mediaLibrary).catch(() => []),
        db.select().from(legalDocuments).catch(() => []),
        db.select().from(siteRoutesConfig).catch(() => []),
        db.select().from(maintenanceSchedules).catch(() => []),
        db.select().from(visitorAnnouncements).catch(() => []),
        db.select().from(contentReviews).catch(() => []),
        db.select().from(publicationHistory).orderBy(desc(publicationHistory.createdAt)).limit(20).catch(() => []),
        db.select().from(cmsActivityLogs).orderBy(desc(cmsActivityLogs.timestamp)).limit(25).catch(() => []),
      ]);

      const settings = await getSiteSettings();
      const missingSeoPages = allPages.filter((p) => {
        const s = (p.seo as any) || {};
        return !s.seoTitle || !s.metaDescription;
      });

      res.json({
        success: true,
        metrics: {
          pagesTotal: allPages.length,
          pagesPublished: allPages.filter((p) => p.status === 'PUBLISHED').length,
          pagesDraft: allPages.filter((p) => p.status === 'DRAFT' || p.status === 'PENDING_REVIEW' || p.status === 'APPROVED').length,
          pagesScheduled: allPages.filter((p) => p.status === 'SCHEDULED').length,
          pagesArchived: allPages.filter((p) => p.status === 'ARCHIVED' || p.status === 'UNPUBLISHED').length,
          mediaTotal: allMedia.filter((m) => m.status !== 'ARCHIVED').length,
          videosTotal: allMedia.filter((m) => m.fileType === 'video' && m.status !== 'ARCHIVED').length,
          legalPublished: allLegal.filter((d) => d.status === 'PUBLISHED').length,
          legalTotal: allLegal.length,
          sitemapIncludedUrls: allRoutes.filter((r) => r.includeInSitemap && !r.isSystemRoute && r.robotsIndex).length,
          activeMaintenanceCount: allMaintenance.filter((m) => m.status === 'ACTIVE' || m.status === 'EMERGENCY').length,
          scheduledMaintenanceCount: allMaintenance.filter((m) => m.status === 'SCHEDULED').length,
          activeAnnouncementsCount: allAnnouncements.filter((a) => a.active).length,
          pendingHumanReviewCount: allPages.filter((p) => p.reviewStatus !== 'APPROVED_BY_ADMIN').length,
          missingSeoMetadataCount: missingSeoPages.length,
          reviewedRecordsCount: allReviews.length,
        },
        externalAnalytics: {
          googleSearchConsole: {
            available: false,
            message: 'Not available — no verified data source configured.',
          },
          googleAnalytics4: {
            available: false,
            message: 'Not available — no verified data source configured.',
          },
          smtpMailer: {
            configured: Boolean(process.env.SMTP_USER || process.env.SMTP_PASS || ADMIN_SMTP_USER),
            senderAddress: ADMIN_SMTP_USER,
          },
        },
        timezone: settings.timezone || 'Africa/Douala',
        recentPublicationHistory: recentHistory,
        recentActivityLogs: recentLogs,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // 2. Enhanced Page Management: List with full workflow metadata
  app.get('/api/cms/pages/manage', requireStaffOrAdmin, async (_req, res) => {
    try {
      await processDueCmsSchedules();
      await ensureCoreCmsPagesExist();
      const pages = await db.select().from(pageContents).orderBy(pageContents.id);
      res.json({ success: true, pages });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create new custom page
  app.post('/api/cms/pages', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug, title, pageGroup, heroConfig, sections, seo } = req.body || {};
      const cleanSlug = String(slug || '').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/(^-|-$)/g, '');
      if (!cleanSlug || !title) {
        return res.status(400).json({ error: 'Valid slug and title are required.' });
      }
      const existing = await db.select().from(pageContents).where(eq(pageContents.slug, cleanSlug)).limit(1);
      if (existing.length > 0) {
        return res.status(409).json({ error: `Page slug "${cleanSlug}" already exists.` });
      }

      const payload = sanitizeCmsPagePayload({
        heroConfig: heroConfig || { title, subtitle: '' },
        sections: Array.isArray(sections) ? sections : [],
        seo: seo || { seoTitle: `${title} | MADECC GROUP`, metaDescription: '', robotsIndex: true },
      });

      const created = await db
        .insert(pageContents)
        .values({
          slug: cleanSlug,
          title: String(title).trim(),
          pageGroup: pageGroup || 'custom',
          status: 'DRAFT',
          reviewStatus: 'NOT_REVIEWED',
          heroConfig: payload.heroConfig,
          sections: payload.sections,
          seo: payload.seo,
          draftData: payload,
          version: 1,
          lastSavedBy: req.dbUser?.email || 'Admin',
        })
        .returning();

      await db.insert(publicationHistory).values({
        targetType: 'page',
        targetSlug: cleanSlug,
        targetTitle: String(title).trim(),
        action: 'DRAFT_SAVE',
        fromStatus: 'NONE',
        toStatus: 'DRAFT',
        version: 1,
        success: true,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Created new page /${cleanSlug}`,
      });

      res.status(201).json({ success: true, page: created[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow transitions: submit-review | approve | publish | republish | schedule | unpublish | archive | restore
  app.post('/api/cms/pages/:slug/workflow', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { action, scheduledPublishAt, expiresAt, approvalNotes, changeSummary, payload } = req.body || {};

      const rows = await db.select().from(pageContents).where(eq(pageContents.slug, slug)).limit(1);
      if (rows.length === 0) {
        return res.status(404).json({ error: `Page "${slug}" not found.` });
      }
      const page = rows[0];
      const actor = req.dbUser?.displayName || req.dbUser?.email || 'MADECC Admin';
      const now = new Date();
      const fromStatus = page.status;

      // Validate draft payload
      const rawDraft = payload ? sanitizeCmsPagePayload(payload) : ((page.draftData as any) || {
        heroConfig: page.heroConfig,
        sections: page.sections,
        seo: page.seo,
      });

      if (action === 'schedule') {
        if (!scheduledPublishAt || isNaN(Date.parse(scheduledPublishAt))) {
          await db.insert(publicationHistory).values({
            targetType: 'page',
            targetSlug: slug,
            targetTitle: page.title,
            action: 'FAIL',
            fromStatus,
            toStatus: fromStatus,
            success: false,
            errorMessage: 'Valid future scheduledPublishAt timestamp is required.',
            performedBy: actor,
          });
          return res.status(400).json({ error: 'Valid scheduledPublishAt timestamp is required.' });
        }
        const schedDate = new Date(scheduledPublishAt);
        const updated = await db
          .update(pageContents)
          .set({
            status: 'SCHEDULED',
            draftData: rawDraft,
            scheduledPublishAt: schedDate,
            expiresAt: expiresAt && !isNaN(Date.parse(expiresAt)) ? new Date(expiresAt) : page.expiresAt,
            lastSavedBy: actor,
            lastPublishError: null,
            updatedAt: now,
          })
          .where(eq(pageContents.id, page.id))
          .returning();

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: slug,
          targetTitle: page.title,
          action: 'SCHEDULE',
          fromStatus,
          toStatus: 'SCHEDULED',
          version: page.version,
          scheduledFor: schedDate,
          success: true,
          performedBy: actor,
          details: changeSummary || `Scheduled publication for ${schedDate.toISOString()}`,
        });

        return res.json({ success: true, page: updated[0] });
      }

      if (action === 'submit-review') {
        const updated = await db
          .update(pageContents)
          .set({
            status: 'PENDING_REVIEW',
            reviewStatus: 'REVIEW_REQUIRED',
            draftData: rawDraft,
            lastSavedBy: actor,
            updatedAt: now,
          })
          .where(eq(pageContents.id, page.id))
          .returning();

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: slug,
          targetTitle: page.title,
          action: 'SUBMIT_REVIEW',
          fromStatus,
          toStatus: 'PENDING_REVIEW',
          version: page.version,
          success: true,
          performedBy: actor,
          details: approvalNotes || 'Submitted for editorial & factual review',
        });
        return res.json({ success: true, page: updated[0] });
      }

      if (action === 'approve') {
        const updated = await db
          .update(pageContents)
          .set({
            status: 'APPROVED',
            reviewStatus: 'APPROVED_BY_ADMIN',
            approvalNotes: approvalNotes || 'Approved by authorized administrator',
            approvedBy: actor,
            approvedAt: now,
            draftData: rawDraft,
            updatedAt: now,
          })
          .where(eq(pageContents.id, page.id))
          .returning();

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: slug,
          targetTitle: page.title,
          action: 'APPROVE',
          fromStatus,
          toStatus: 'APPROVED',
          version: page.version,
          success: true,
          performedBy: actor,
          details: approvalNotes || 'Approved for live publication',
        });
        return res.json({ success: true, page: updated[0] });
      }

      if (action === 'publish' || action === 'republish') {
        const nextVersion = (page.version || 1) + 1;
        const updated = await db
          .update(pageContents)
          .set({
            heroConfig: rawDraft.heroConfig ?? page.heroConfig,
            sections: rawDraft.sections ?? page.sections,
            seo: rawDraft.seo ?? page.seo,
            draftData: rawDraft,
            publishedData: rawDraft,
            status: 'PUBLISHED',
            version: nextVersion,
            publishedAt: now,
            scheduledPublishAt: null,
            lastSavedBy: actor,
            lastPublishError: null,
            updatedAt: now,
          })
          .where(eq(pageContents.id, page.id))
          .returning();

        await db.insert(pageContentRevisions).values({
          pageSlug: slug,
          version: nextVersion,
          title: `${page.title} - v${nextVersion}`,
          snapshotData: rawDraft,
          changeSummary: changeSummary || `${action === 'republish' ? 'Republished' : 'Published'} v${nextVersion}`,
          author: actor,
          status: 'PUBLISHED',
          actionType: action.toUpperCase(),
          publishedAt: now,
          isPublished: true,
        });

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: slug,
          targetTitle: page.title,
          action: action.toUpperCase(),
          fromStatus,
          toStatus: 'PUBLISHED',
          version: nextVersion,
          success: true,
          performedBy: actor,
          details: changeSummary || `Published live version ${nextVersion}`,
        });

        await db
          .insert(cmsActivityLogs)
          .values({
            module: 'PUBLISHING_CENTRE',
            action: action.toUpperCase(),
            recordId: String(page.id),
            recordTitle: `${page.title} (/${slug}) v${nextVersion}`,
            performedBy: actor,
            details: changeSummary || `Published live version ${nextVersion}`,
          })
          .catch(() => {});

        return res.json({ success: true, page: updated[0], version: nextVersion });
      }

      if (action === 'unpublish') {
        const updated = await db
          .update(pageContents)
          .set({ status: 'UNPUBLISHED', updatedAt: now })
          .where(eq(pageContents.id, page.id))
          .returning();

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: slug,
          targetTitle: page.title,
          action: 'UNPUBLISH',
          fromStatus,
          toStatus: 'UNPUBLISHED',
          version: page.version,
          success: true,
          performedBy: actor,
        });
        return res.json({ success: true, page: updated[0] });
      }

      if (action === 'archive') {
        const updated = await db
          .update(pageContents)
          .set({ status: 'ARCHIVED', archivedAt: now, updatedAt: now })
          .where(eq(pageContents.id, page.id))
          .returning();

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: slug,
          targetTitle: page.title,
          action: 'ARCHIVE',
          fromStatus,
          toStatus: 'ARCHIVED',
          version: page.version,
          success: true,
          performedBy: actor,
        });
        return res.json({ success: true, page: updated[0] });
      }

      if (action === 'restore') {
        const updated = await db
          .update(pageContents)
          .set({ status: 'DRAFT', archivedAt: null, updatedAt: now })
          .where(eq(pageContents.id, page.id))
          .returning();

        await db.insert(publicationHistory).values({
          targetType: 'page',
          targetSlug: slug,
          targetTitle: page.title,
          action: 'RESTORE',
          fromStatus,
          toStatus: 'DRAFT',
          version: page.version,
          success: true,
          performedBy: actor,
        });
        return res.json({ success: true, page: updated[0] });
      }

      return res.status(400).json({ error: `Unsupported workflow action "${action}".` });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Media Reference Checker & Safe Replacement
  app.get('/api/cms/media/:id/usage', requireStaffOrAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const assetRows = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id)).limit(1);
      if (assetRows.length === 0) return res.status(404).json({ error: 'Media asset not found' });
      const asset = assetRows[0];
      const url = asset.fileUrl;
      const usedIn: string[] = [];

      const [allPages, allServices, allProjects, allBlogs, allBanners, allLegal] = await Promise.all([
        db.select().from(pageContents).catch(() => []),
        db.select().from(services).catch(() => []),
        db.select().from(projects).catch(() => []),
        db.select().from(blogPosts).catch(() => []),
        db.select().from(heroBanners).catch(() => []),
        db.select().from(legalDocuments).catch(() => []),
      ]);

      for (const p of allPages) {
        if (JSON.stringify(p).includes(url)) usedIn.push(`Page: /${p.slug} (${p.title})`);
      }
      for (const s of allServices) {
        if (JSON.stringify(s).includes(url)) usedIn.push(`Service: ${s.title}`);
      }
      for (const pr of allProjects) {
        if (JSON.stringify(pr).includes(url)) usedIn.push(`Project: ${pr.title}`);
      }
      for (const b of allBlogs) {
        if (JSON.stringify(b).includes(url)) usedIn.push(`Blog: ${b.title}`);
      }
      for (const bn of allBanners) {
        if (bn.imageUrl === url || bn.videoUrl === url) usedIn.push(`Hero Banner #${bn.id}: ${bn.title}`);
      }
      for (const lg of allLegal) {
        if ((lg.contentHtml || '').includes(url)) usedIn.push(`Legal Doc: ${lg.title}`);
      }

      await db.update(mediaLibrary).set({ usedIn, updatedAt: new Date() }).where(eq(mediaLibrary.id, id)).catch(() => {});

      res.json({ success: true, id, fileUrl: url, usedIn, canSafelyDelete: usedIn.length === 0 });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/media/:id/replace', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { newFileUrl, filename, mimeType, fileSize, dimensions, updateReferences, storageProvider, publicId } = req.body || {};
      if (!newFileUrl) return res.status(400).json({ error: 'newFileUrl is required.' });
      if (!isSafePublicHttpsMediaUrl(String(newFileUrl))) {
        return res.status(400).json({ error: 'Invalid or unsafe replacement media URL.' });
      }

      const existing = await db.select().from(mediaLibrary).where(eq(mediaLibrary.id, id)).limit(1);
      if (existing.length === 0) return res.status(404).json({ error: 'Media asset not found.' });
      const oldUrl = existing[0].fileUrl;

      const nextProvider =
        storageProvider ||
        (String(newFileUrl).includes('res.cloudinary.com')
          ? 'cloudinary'
          : String(newFileUrl).includes('.supabase.co')
            ? 'supabase'
            : String(newFileUrl).startsWith('/uploads/')
              ? 'local'
              : 'external_https');

      const updated = await db
        .update(mediaLibrary)
        .set({
          fileUrl: String(newFileUrl).trim(),
          filename: filename || existing[0].filename,
          mimeType: mimeType || existing[0].mimeType,
          fileSize: fileSize !== undefined ? Number(fileSize) : existing[0].fileSize,
          dimensions: dimensions || existing[0].dimensions,
          storageProvider: nextProvider,
          publicId: publicId !== undefined ? publicId : existing[0].publicId,
          updatedAt: new Date(),
        })
        .where(eq(mediaLibrary.id, id))
        .returning();

      let updatedRefsCount = 0;
      if (updateReferences && oldUrl && oldUrl !== newFileUrl) {
        const activePool = pool || getOrInitPool();
        if (activePool) {
          // Safely update hero banners referencing exact oldUrl
          const r1 = await activePool.query(
            `UPDATE hero_banners SET image_url = $1 WHERE image_url = $2`,
            [newFileUrl, oldUrl]
          ).catch(() => ({ rowCount: 0 }));
          const r2 = await activePool.query(
            `UPDATE hero_banners SET video_url = $1 WHERE video_url = $2`,
            [newFileUrl, oldUrl]
          ).catch(() => ({ rowCount: 0 }));
          updatedRefsCount += (r1.rowCount || 0) + (r2.rowCount || 0);
        }
      }

      await db.insert(cmsActivityLogs).values({
        module: 'MEDIA_LIBRARY',
        action: 'REPLACE_ASSET',
        recordId: String(id),
        recordTitle: updated[0].title,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Replaced media URL (updated ${updatedRefsCount} direct banner refs)`,
      }).catch(() => {});

      res.json({ success: true, media: updated[0], updatedRefsCount });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Human Content Editorial Review & DB Fact Verification
  app.get('/api/cms/reviews', requireStaffOrAdmin, async (_req, res) => {
    try {
      await ensureCmsTables();
      const rows = await db.select().from(contentReviews).orderBy(desc(contentReviews.updatedAt)).limit(100);
      res.json({ success: true, reviews: rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/review/analyze', requireStaffOrAdmin, async (req: any, res) => {
    try {
      await ensureCmsTables();
      const { targetType = 'page', targetSlug = 'home', contentText } = req.body || {};
      const settings = await getSiteSettings();
      const profiles = await db.select().from(businessProfiles).limit(1).catch(() => []);
      const profile = profiles[0] as any;

      let resolvedText = typeof contentText === 'string' ? contentText : '';
      if (!resolvedText) {
        if (targetType === 'legal') {
          const docs = await db.select().from(legalDocuments).where(eq(legalDocuments.slug, targetSlug)).limit(1);
          resolvedText = docs[0]?.contentHtml || docs[0]?.summary || '';
        } else {
          const pages = await db.select().from(pageContents).where(eq(pageContents.slug, targetSlug)).limit(1);
          const p = pages[0];
          if (p) {
            resolvedText = JSON.stringify(p.draftData || { heroConfig: p.heroConfig, sections: p.sections, seo: p.seo });
          }
        }
      }

      const analysis = analyzeHumanContentEditorial({
        targetType,
        targetSlug,
        rawText: resolvedText,
        verifiedFacts: {
          companyName: profile?.companyName || settings.siteName || 'MADECC GROUP',
          founderName: profile?.founderName || settings.developerName || 'Kasah Rodrick Reboya',
          niuNumber: profile?.taxpayerNumber || settings.niuTaxId || 'P030217852934P',
          legalStatus: profile?.legalStatusBadge || settings.legalStatus || 'Individual establishment registration pending',
          rccmNumber: profile?.registrationNumber || settings.rccmNumber || '',
          email: settings.email || 'kreboya603@gmail.com',
          phone: settings.phone || '+237 683 31 64 86',
          location: settings.officeAddressYaounde || 'Mbankolo, Yaoundé, Cameroon',
        },
      });

      const existing = await db
        .select()
        .from(contentReviews)
        .where(and(eq(contentReviews.targetType, targetType), eq(contentReviews.targetSlug, targetSlug)))
        .limit(1);

      let saved;
      if (existing.length > 0) {
        const upd = await db
          .update(contentReviews)
          .set({
            reviewStatus: analysis.reviewStatus,
            grammarIssuesCount: analysis.grammarIssuesCount,
            readabilityScore: analysis.readabilityScore,
            repeatedPhrasesCount: analysis.repeatedPhrasesCount,
            hypeFlagsCount: analysis.hypeFlagsCount,
            factCheckIssues: analysis.factCheckIssues,
            reportJson: analysis.reportJson,
            reviewedBy: req.dbUser?.email || 'Admin',
            reviewedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(contentReviews.id, existing[0].id))
          .returning();
        saved = upd[0];
      } else {
        const ins = await db
          .insert(contentReviews)
          .values({
            targetType,
            targetSlug,
            reviewStatus: analysis.reviewStatus,
            grammarIssuesCount: analysis.grammarIssuesCount,
            readabilityScore: analysis.readabilityScore,
            repeatedPhrasesCount: analysis.repeatedPhrasesCount,
            hypeFlagsCount: analysis.hypeFlagsCount,
            factCheckIssues: analysis.factCheckIssues,
            reportJson: analysis.reportJson,
            reviewedBy: req.dbUser?.email || 'Admin',
            reviewedAt: new Date(),
          })
          .returning();
        saved = ins[0];
      }

      if (targetType === 'page') {
        await db
          .update(pageContents)
          .set({ reviewStatus: analysis.reviewStatus, updatedAt: new Date() })
          .where(eq(pageContents.slug, targetSlug))
          .catch(() => {});
      }

      res.json({ success: true, review: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/review/:targetType/:targetSlug/status', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { targetType, targetSlug } = req.params;
      const { reviewStatus, reviewerNotes } = req.body || {};
      const allowed = ['NOT_REVIEWED', 'REVIEW_REQUIRED', 'CHANGES_RECOMMENDED', 'APPROVED_BY_ADMIN'];
      if (!allowed.includes(reviewStatus)) {
        return res.status(400).json({ error: 'Invalid reviewStatus.' });
      }
      const now = new Date();
      const actor = req.dbUser?.email || 'Admin';

      const existing = await db
        .select()
        .from(contentReviews)
        .where(and(eq(contentReviews.targetType, targetType), eq(contentReviews.targetSlug, targetSlug)))
        .limit(1);

      let saved;
      if (existing.length > 0) {
        const upd = await db
          .update(contentReviews)
          .set({ reviewStatus, reviewerNotes, reviewedBy: actor, reviewedAt: now, updatedAt: now })
          .where(eq(contentReviews.id, existing[0].id))
          .returning();
        saved = upd[0];
      } else {
        const ins = await db
          .insert(contentReviews)
          .values({ targetType, targetSlug, reviewStatus, reviewerNotes, reviewedBy: actor, reviewedAt: now })
          .returning();
        saved = ins[0];
      }

      if (targetType === 'page') {
        await db
          .update(pageContents)
          .set({ reviewStatus, approvalNotes: reviewerNotes, updatedAt: now })
          .where(eq(pageContents.slug, targetSlug))
          .catch(() => {});
      } else if (targetType === 'legal') {
        await db
          .update(legalDocuments)
          .set({
            reviewStatus,
            requiresProfessionalReview: reviewStatus !== 'APPROVED_BY_ADMIN',
            updatedAt: now,
          })
          .where(eq(legalDocuments.slug, targetSlug))
          .catch(() => {});
      }

      await db.insert(cmsActivityLogs).values({
        module: 'HUMAN_REVIEW',
        action: reviewStatus,
        recordId: `${targetType}:${targetSlug}`,
        recordTitle: `Review updated for ${targetType}/${targetSlug}`,
        performedBy: actor,
        details: reviewerNotes || `Marked as ${reviewStatus}`,
      }).catch(() => {});

      res.json({ success: true, review: saved });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Legal Pages Manager (All 10 Document Types)
  app.get('/api/cms/legal', requireStaffOrAdmin, async (_req, res) => {
    try {
      await processDueCmsSchedules();
      const docs = await db.select().from(legalDocuments).orderBy(legalDocuments.id);
      res.json({ success: true, documents: docs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public or Admin single legal document fetch
  app.get('/api/cms/legal/:slug', async (req: any, res) => {
    try {
      await processDueCmsSchedules();
      const { slug } = req.params;
      const mode = req.query.mode;
      const rows = await db.select().from(legalDocuments).where(eq(legalDocuments.slug, slug)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: 'Legal document not found' });
      const doc = rows[0];

      if (mode !== 'draft' && doc.status !== 'PUBLISHED') {
        return res.json({ success: true, published: false, document: null });
      }

      const payload = mode === 'draft' ? doc.draftData || doc : doc.publishedData || doc;
      res.json({
        success: true,
        published: doc.status === 'PUBLISHED',
        document: {
          ...doc,
          title: payload.title || doc.title,
          summary: payload.summary ?? doc.summary,
          contentHtml: sanitizeRichHtml(payload.contentHtml || doc.contentHtml),
          effectiveDate: payload.effectiveDate ?? doc.effectiveDate,
          lastUpdatedDate: payload.lastUpdatedDate ?? doc.lastUpdatedDate,
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/legal/:slug/draft', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { title, docType, summary, contentHtml, effectiveDate, lastUpdatedDate, legalReviewWarning, requiresProfessionalReview } = req.body || {};
      const rows = await db.select().from(legalDocuments).where(eq(legalDocuments.slug, slug)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: 'Legal document not found' });

      const cleanHtml = sanitizeRichHtml(contentHtml ?? rows[0].contentHtml);
      const actor = req.dbUser?.email || 'Admin';
      const draftData = {
        title: title || rows[0].title,
        docType: docType || rows[0].docType,
        summary: summary ?? rows[0].summary,
        contentHtml: cleanHtml,
        effectiveDate: effectiveDate ?? rows[0].effectiveDate,
        lastUpdatedDate: lastUpdatedDate || new Date().toISOString().split('T')[0],
      };

      const updated = await db
        .update(legalDocuments)
        .set({
          title: draftData.title,
          summary: draftData.summary,
          contentHtml: cleanHtml,
          effectiveDate: draftData.effectiveDate,
          lastUpdatedDate: draftData.lastUpdatedDate,
          legalReviewWarning: legalReviewWarning ?? rows[0].legalReviewWarning,
          requiresProfessionalReview: requiresProfessionalReview !== undefined ? Boolean(requiresProfessionalReview) : rows[0].requiresProfessionalReview,
          draftData,
          status: rows[0].status === 'PUBLISHED' ? 'DRAFT' : rows[0].status,
          updatedBy: actor,
          updatedAt: new Date(),
        })
        .where(eq(legalDocuments.id, rows[0].id))
        .returning();

      res.json({ success: true, document: updated[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/legal/:slug/publish', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { slug } = req.params;
      const { changeSummary, scheduledPublishAt, action = 'publish' } = req.body || {};
      const rows = await db.select().from(legalDocuments).where(eq(legalDocuments.slug, slug)).limit(1);
      if (rows.length === 0) return res.status(404).json({ error: 'Legal document not found' });

      const doc = rows[0];
      const actor = req.dbUser?.email || 'Admin';
      const now = new Date();
      const draft = (doc.draftData as any) || {
        title: doc.title,
        docType: doc.docType,
        summary: doc.summary,
        contentHtml: doc.contentHtml,
        effectiveDate: doc.effectiveDate,
        lastUpdatedDate: doc.lastUpdatedDate,
      };
      const cleanHtml = sanitizeRichHtml(draft.contentHtml || doc.contentHtml);
      const cleanPayload = { ...draft, contentHtml: cleanHtml };

      if (action === 'archive') {
        const upd = await db.update(legalDocuments).set({ status: 'ARCHIVED', archivedAt: now, updatedAt: now }).where(eq(legalDocuments.id, doc.id)).returning();
        await db.insert(publicationHistory).values({ targetType: 'legal', targetSlug: slug, targetTitle: doc.title, action: 'ARCHIVE', fromStatus: doc.status, toStatus: 'ARCHIVED', version: doc.version, success: true, performedBy: actor });
        return res.json({ success: true, document: upd[0] });
      }
      if (action === 'restore') {
        const upd = await db.update(legalDocuments).set({ status: 'DRAFT', archivedAt: null, updatedAt: now }).where(eq(legalDocuments.id, doc.id)).returning();
        return res.json({ success: true, document: upd[0] });
      }
      if (action === 'unpublish') {
        const upd = await db.update(legalDocuments).set({ status: 'UNPUBLISHED', updatedAt: now }).where(eq(legalDocuments.id, doc.id)).returning();
        return res.json({ success: true, document: upd[0] });
      }
      if (action === 'schedule' && scheduledPublishAt) {
        const upd = await db
          .update(legalDocuments)
          .set({ status: 'SCHEDULED', scheduledPublishAt: new Date(scheduledPublishAt), updatedAt: now })
          .where(eq(legalDocuments.id, doc.id))
          .returning();
        return res.json({ success: true, document: upd[0] });
      }

      const nextVersion = (doc.version || 1) + 1;
      const upd = await db
        .update(legalDocuments)
        .set({
          title: cleanPayload.title || doc.title,
          summary: cleanPayload.summary ?? doc.summary,
          contentHtml: cleanHtml,
          draftData: cleanPayload,
          publishedData: cleanPayload,
          status: 'PUBLISHED',
          version: nextVersion,
          publishedAt: now,
          scheduledPublishAt: null,
          updatedBy: actor,
          updatedAt: now,
        })
        .where(eq(legalDocuments.id, doc.id))
        .returning();

      await db.insert(legalDocumentRevisions).values({
        legalSlug: slug,
        version: nextVersion,
        title: cleanPayload.title || doc.title,
        snapshotData: cleanPayload,
        changeSummary: changeSummary || `Published legal revision v${nextVersion}`,
        author: actor,
        isPublished: true,
      });

      await db.insert(publicationHistory).values({
        targetType: 'legal',
        targetSlug: slug,
        targetTitle: doc.title,
        action: 'PUBLISH',
        fromStatus: doc.status,
        toStatus: 'PUBLISHED',
        version: nextVersion,
        success: true,
        performedBy: actor,
        details: changeSummary || `Published legal document v${nextVersion}`,
      });

      res.json({ success: true, document: upd[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/cms/legal/:slug/revisions', requireStaffOrAdmin, async (req, res) => {
    try {
      const revs = await db
        .select()
        .from(legalDocumentRevisions)
        .where(eq(legalDocumentRevisions.legalSlug, req.params.slug))
        .orderBy(desc(legalDocumentRevisions.createdAt));
      res.json({ success: true, revisions: revs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. SEO Manager & Internal SEO Audit Engine
  app.get('/api/cms/seo/audit', requireStaffOrAdmin, async (_req, res) => {
    try {
      await ensureCoreCmsPagesExist();
      const pages = await db.select().from(pageContents).orderBy(pageContents.slug);
      const settings = await getSiteSettings();
      const canonicalUrlsSeen = new Set<string>();

      const audits = pages.map((p) => {
        const s = (p.seo as any) || {};
        const checks: Array<{ key: string; pass: boolean; severity: 'ok' | 'warn' | 'fail'; message: string }> = [];
        const title = String(s.seoTitle || '');
        const desc = String(s.metaDescription || '');
        const canonical = String(s.canonicalUrl || '');

        checks.push({
          key: 'seoTitle',
          pass: title.length >= 15 && title.length <= 70,
          severity: !title ? 'fail' : title.length > 70 || title.length < 15 ? 'warn' : 'ok',
          message: !title ? 'Missing SEO title' : `Title length is ${title.length} chars (recommended 30–65)`,
        });
        checks.push({
          key: 'metaDescription',
          pass: desc.length >= 50 && desc.length <= 165,
          severity: !desc ? 'fail' : desc.length > 165 || desc.length < 50 ? 'warn' : 'ok',
          message: !desc ? 'Missing meta description' : `Meta description is ${desc.length} chars (recommended 70–160)`,
        });
        const dupCanonical = Boolean(canonical && canonicalUrlsSeen.has(canonical));
        if (canonical) canonicalUrlsSeen.add(canonical);
        checks.push({
          key: 'canonicalUrl',
          pass: Boolean(canonical) && !dupCanonical,
          severity: !canonical ? 'warn' : dupCanonical ? 'fail' : 'ok',
          message: dupCanonical ? `Duplicate canonical URL: ${canonical}` : canonical ? `Canonical set: ${canonical}` : 'No canonical URL override configured (falls back to default)',
        });
        checks.push({
          key: 'robots',
          pass: s.robotsIndex !== false,
          severity: s.robotsIndex === false ? 'warn' : 'ok',
          message: s.robotsIndex === false ? 'Marked noindex (excluded from XML sitemap)' : 'Indexable by search engines',
        });

        const score = Math.round((checks.filter((c) => c.pass).length / checks.length) * 100);
        return {
          slug: p.slug,
          title: p.title,
          status: p.status,
          seo: s,
          score,
          checks,
        };
      });

      res.json({
        success: true,
        audits,
        globalSeo: settings.globalSeo,
        externalRankingNote: 'Live Google ranking positions and search volume require a verified Search Console API integration (not configured).',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Sitemap & Architecture Discovery Manager
  app.get('/api/cms/sitemap/urls', async (_req, res) => {
    try {
      await ensureCmsTables();
      const routes = await db.select().from(siteRoutesConfig).orderBy(siteRoutesConfig.path);
      const pages = await db.select().from(pageContents);
      const pageMap = new Map<string, any>(pages.map((p) => [p.slug, p]));

      const enriched = routes.map((r) => {
        const slug = r.path === '/' ? 'home' : r.path.replace(/^\//, '');
        const page = pageMap.get(slug);
        return {
          ...r,
          cmsStatus: page?.status || r.status,
          cmsSeoTitle: (page?.seo as any)?.seoTitle || r.title,
        };
      });

      res.json({ success: true, urls: enriched });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/sitemap/urls/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { title, metaDescription, robotsIndex, robotsFollow, includeInSitemap, priority, changefreq, status } = req.body || {};
      const existing = await db.select().from(siteRoutesConfig).where(eq(siteRoutesConfig.id, id)).limit(1);
      if (existing.length === 0) return res.status(404).json({ error: 'Route config not found' });

      // Never allow exposing system routes (/admin, /api)
      const isSystem = existing[0].isSystemRoute || existing[0].path.startsWith('/admin') || existing[0].path.startsWith('/api');
      const upd = await db
        .update(siteRoutesConfig)
        .set({
          title: title ?? existing[0].title,
          metaDescription: metaDescription ?? existing[0].metaDescription,
          robotsIndex: isSystem ? false : (robotsIndex !== undefined ? Boolean(robotsIndex) : existing[0].robotsIndex),
          robotsFollow: isSystem ? false : (robotsFollow !== undefined ? Boolean(robotsFollow) : existing[0].robotsFollow),
          includeInSitemap: isSystem ? false : (includeInSitemap !== undefined ? Boolean(includeInSitemap) : existing[0].includeInSitemap),
          priority: priority || existing[0].priority,
          changefreq: changefreq || existing[0].changefreq,
          status: status || existing[0].status,
          updatedAt: new Date(),
        })
        .where(eq(siteRoutesConfig.id, id))
        .returning();

      res.json({ success: true, route: upd[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/sitemap/refresh', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const xml = await generateDynamicSitemapXml();
      const robots = await generateDynamicRobotsTxt();
      const llms = await generateDynamicLlmsTxt();

      // Sync to public/ in non-read-only local environments so static assets remain fresh
      if (!process.env.NETLIFY && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
        try {
          const pubDir = path.join(process.cwd(), 'public');
          if (fs.existsSync(pubDir)) {
            fs.writeFileSync(path.join(pubDir, 'sitemap.xml'), xml, 'utf-8');
            fs.writeFileSync(path.join(pubDir, 'robots.txt'), robots, 'utf-8');
            fs.writeFileSync(path.join(pubDir, 'llms.txt'), llms, 'utf-8');
          }
        } catch {
          // Non-fatal in read-only filesystems
        }
      }

      await db.insert(publicationHistory).values({
        targetType: 'sitemap',
        targetSlug: 'sitemap.xml',
        targetTitle: 'Dynamic XML Sitemap & Discovery Index',
        action: 'REFRESH',
        toStatus: 'PUBLISHED',
        success: true,
        performedBy: req.dbUser?.email || 'Admin',
        details: 'Regenerated sitemap.xml, robots.txt, and llms.txt from Neon DB routes',
      }).catch(() => {});

      res.json({ success: true, xmlPreview: xml, robotsPreview: robots, llmsPreview: llms });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/cms/discovery', requireStaffOrAdmin, async (_req, res) => {
    try {
      const settings = await getSiteSettings();
      const [xml, robots, llms] = await Promise.all([
        generateDynamicSitemapXml(),
        generateDynamicRobotsTxt(),
        generateDynamicLlmsTxt(),
      ]);
      res.json({
        success: true,
        discoveryConfig: settings.discoveryConfig,
        previews: { sitemapXml: xml, robotsTxt: robots, llmsTxt: llms },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/discovery', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const updated = await upsertSiteSettings(
        { discoveryConfig: req.body },
        req.dbUser?.email || 'Admin'
      );
      res.json({ success: true, discoveryConfig: updated.discoveryConfig });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Developer & Paid API Platform Public Portal Content Manager (strictly secret-free)
  app.get('/api/cms/developer-portal', async (_req, res) => {
    try {
      const settings = await getSiteSettings();
      const [products, plans, pendingPayments] = await Promise.all([
        db.select().from(apiProducts).catch(() => []),
        db.select().from(apiPlans).catch(() => []),
        db.select({ id: apiPaymentTransactions.id, status: apiPaymentTransactions.status }).from(apiPaymentTransactions).catch(() => []),
      ]);

      res.json({
        success: true,
        portalContent: sanitizeDeveloperPortalConfig(settings.developerPortalConfig || {}),
        liveCatalogSummary: {
          productsCount: products.length,
          activeProductsCount: products.filter((p) => p.enabled).length,
          plansCount: plans.length,
          activePlansCount: plans.filter((p) => p.active).length,
          pendingPaymentsCount: pendingPayments.filter((t) => t.status === 'PENDING' || t.status === 'UNDER_REVIEW').length,
          paymentGatewayMode: 'Manual Verification (MTN MoMo & Orange Money Receipt Review)',
        },
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/developer-portal', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const sanitized = sanitizeDeveloperPortalConfig(req.body || {});
      const updated = await upsertSiteSettings(
        { developerPortalConfig: sanitized },
        req.dbUser?.email || 'Admin'
      );

      await db.insert(cmsActivityLogs).values({
        module: 'DEVELOPER_PORTAL_CMS',
        action: 'UPDATE',
        recordId: 'developer-portal',
        recordTitle: 'Developer & Paid API Portal Public Copy',
        performedBy: req.dbUser?.email || 'Admin',
        details: 'Updated public portal copy, docs overview, FAQs, and sanitized example snippets',
      }).catch(() => {});

      res.json({ success: true, portalContent: updated.developerPortalConfig });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 9. Persistent Maintenance Scheduler Endpoints (Neon DB Backed)
  app.get('/api/cms/maintenance', requireStaffOrAdmin, async (_req, res) => {
    try {
      await processDueCmsSchedules();
      const schedules = await db.select().from(maintenanceSchedules).orderBy(desc(maintenanceSchedules.updatedAt));
      res.json({ success: true, schedules });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/maintenance', requireStaffOrAdmin, async (req: any, res) => {
    try {
      await ensureCmsTables();
      const {
        title,
        message,
        status = 'SCHEDULED',
        mode = 'non_intrusive_banner',
        timezone = 'Africa/Douala',
        startAt,
        endAt,
        estimatedCompletion,
        affectedScope,
        allowAdminBypass = true,
        fullSiteAdvisory = false,
        manualConfirmPhrase,
        notifySubscribersSmtp = false,
      } = req.body || {};

      if (!title || !message) {
        return res.status(400).json({ error: 'Title and visitor message are required.' });
      }

      if (fullSiteAdvisory && manualConfirmPhrase !== 'CONFIRM_FULL_SITE_MAINTENANCE') {
        return res.status(400).json({
          error: 'Full-site advisory mode requires explicit typed confirmation (CONFIRM_FULL_SITE_MAINTENANCE). Admin panel and /api/health always remain accessible.',
        });
      }

      const actor = req.dbUser?.email || 'Admin';
      const parsedStart = startAt && !isNaN(Date.parse(startAt)) ? new Date(startAt) : null;
      const parsedEnd = endAt && !isNaN(Date.parse(endAt)) ? new Date(endAt) : null;

      let smtpStatusNote = notifySubscribersSmtp ? 'Pending dispatch' : 'Email dispatch not requested';
      let lastDispatchAt: Date | null = null;

      if (notifySubscribersSmtp) {
        try {
          await sendNotificationEmail(
            `[MADECC MAINTENANCE ${status}] ${title}`,
            `Status: ${status}\nTimezone: ${timezone}\nStart: ${parsedStart ? parsedStart.toISOString() : 'Immediate'}\nEnd: ${parsedEnd ? parsedEnd.toISOString() : estimatedCompletion || 'TBD'}\nScope: ${affectedScope || 'General'}\n\n${message}`,
            `<p><strong>Status:</strong> ${status} (${timezone})</p><p>${message}</p>`,
            { to: ADMIN_SMTP_USER }
          );
          smtpStatusNote = `Dispatched via ${ADMIN_SMTP_USER} at ${new Date().toISOString()}`;
          lastDispatchAt = new Date();
        } catch (smtpErr: any) {
          smtpStatusNote = `SMTP dispatch failed: ${smtpErr?.message || 'Transport error'}`;
        }
      }

      const inserted = await db
        .insert(maintenanceSchedules)
        .values({
          title,
          message,
          status,
          mode,
          timezone,
          startAt: parsedStart,
          endAt: parsedEnd,
          estimatedCompletion: estimatedCompletion || (parsedEnd ? parsedEnd.toISOString() : 'TBD'),
          affectedScope: affectedScope || 'Background System Maintenance (Admin Panel Always Accessible)',
          allowAdminBypass: allowAdminBypass !== false,
          requireManualConfirm: Boolean(fullSiteAdvisory),
          fullSiteAdvisory: Boolean(fullSiteAdvisory),
          lastSmtpDispatchAt: lastDispatchAt,
          lastSmtpStatus: smtpStatusNote,
          createdBy: actor,
          updatedBy: actor,
        })
        .returning();

      await db.insert(publicationHistory).values({
        targetType: 'maintenance',
        targetSlug: String(inserted[0].id),
        targetTitle: title,
        action: status,
        toStatus: status,
        success: true,
        performedBy: actor,
        details: `Timezone: ${timezone} | Mode: ${mode} | ${smtpStatusNote}`,
      }).catch(() => {});

      res.status(201).json({ success: true, schedule: inserted[0], smtpStatus: smtpStatusNote });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/maintenance/emergency-disable', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const now = new Date();
      const actor = req.dbUser?.email || 'Admin';
      const updated = await db
        .update(maintenanceSchedules)
        .set({ status: 'CANCELLED', fullSiteAdvisory: false, updatedBy: actor, updatedAt: now })
        .where(or(eq(maintenanceSchedules.status, 'ACTIVE'), eq(maintenanceSchedules.status, 'EMERGENCY'), eq(maintenanceSchedules.status, 'SCHEDULED')))
        .returning();

      await db.insert(publicationHistory).values({
        targetType: 'maintenance',
        targetSlug: 'all-active',
        targetTitle: '1-Click Emergency Disable Maintenance',
        action: 'EMERGENCY_DISABLE',
        toStatus: 'CANCELLED',
        success: true,
        performedBy: actor,
        details: `Disabled ${updated.length} active/scheduled maintenance window(s).`,
      }).catch(() => {});

      res.json({ success: true, disabledCount: updated.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/maintenance/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { status, title, message, mode, timezone, startAt, endAt, estimatedCompletion, affectedScope, fullSiteAdvisory, manualConfirmPhrase } = req.body || {};
      if (fullSiteAdvisory && manualConfirmPhrase !== 'CONFIRM_FULL_SITE_MAINTENANCE') {
        return res.status(400).json({ error: 'Full-site advisory requires typed confirmation: CONFIRM_FULL_SITE_MAINTENANCE' });
      }
      const existing = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.id, id)).limit(1);
      if (existing.length === 0) return res.status(404).json({ error: 'Schedule not found' });

      const upd = await db
        .update(maintenanceSchedules)
        .set({
          title: title ?? existing[0].title,
          message: message ?? existing[0].message,
          status: status ?? existing[0].status,
          mode: mode ?? existing[0].mode,
          timezone: timezone ?? existing[0].timezone,
          startAt: startAt !== undefined ? (startAt ? new Date(startAt) : null) : existing[0].startAt,
          endAt: endAt !== undefined ? (endAt ? new Date(endAt) : null) : existing[0].endAt,
          estimatedCompletion: estimatedCompletion ?? existing[0].estimatedCompletion,
          affectedScope: affectedScope ?? existing[0].affectedScope,
          fullSiteAdvisory: fullSiteAdvisory !== undefined ? Boolean(fullSiteAdvisory) : existing[0].fullSiteAdvisory,
          updatedBy: req.dbUser?.email || 'Admin',
          updatedAt: new Date(),
        })
        .where(eq(maintenanceSchedules.id, id))
        .returning();

      res.json({ success: true, schedule: upd[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 10. Visitor Announcements & Banner Notifications
  app.get('/api/cms/announcements/active', async (req, res) => {
    try {
      await processDueCmsSchedules();
      const page = String(req.query.page || 'home').toLowerCase();
      const rows = await db
        .select()
        .from(visitorAnnouncements)
        .where(eq(visitorAnnouncements.active, true))
        .orderBy(desc(visitorAnnouncements.priority), desc(visitorAnnouncements.createdAt));

      const filtered = rows.filter((a) => {
        if (a.displayLocation === 'site_wide_banner' || a.displayLocation === 'maintenance_notice') return true;
        if (a.displayLocation === 'homepage_banner') return page === 'home';
        if (a.displayLocation === 'api_platform') return page === 'developers' || page === 'api-platform';
        if (a.displayLocation === 'selected_page') {
          const targets = Array.isArray(a.targetPages) ? a.targetPages.map((p: any) => String(p).toLowerCase()) : [];
          return targets.includes(page);
        }
        return true;
      });

      res.json({ success: true, announcements: filtered });
    } catch (error: any) {
      res.status(500).json({ error: error.message, announcements: [] });
    }
  });

  app.get('/api/cms/announcements', requireStaffOrAdmin, async (_req, res) => {
    try {
      await processDueCmsSchedules();
      const rows = await db
        .select()
        .from(visitorAnnouncements)
        .orderBy(desc(visitorAnnouncements.priority), desc(visitorAnnouncements.createdAt));
      res.json({ success: true, announcements: rows });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cms/announcements', requireStaffOrAdmin, async (req: any, res) => {
    try {
      await ensureCmsTables();
      const {
        title,
        message,
        category = 'NOTICE',
        priority = 1,
        displayLocation = 'site_wide_banner',
        targetPages = [],
        ctaText = '',
        ctaLink = '',
        dismissible = true,
        active = true,
        publishAt,
        expireAt,
        timezone = 'Africa/Douala',
        notifySubscribersSmtp = false,
      } = req.body || {};

      if (!title || !message) return res.status(400).json({ error: 'Title and message are required.' });

      let smtpStatus = 'Email dispatch not enabled';
      if (notifySubscribersSmtp) {
        try {
          await sendNotificationEmail(
            `[MADECC ANNOUNCEMENT] ${title}`,
            `Category: ${category}\nLocation: ${displayLocation}\n\n${message}`,
            `<h3>${title}</h3><p>${message}</p>`,
            { to: ADMIN_SMTP_USER }
          );
          smtpStatus = `Dispatched admin summary via ${ADMIN_SMTP_USER} at ${new Date().toISOString()}`;
        } catch (err: any) {
          smtpStatus = `SMTP delivery failed: ${err?.message || 'Error'}`;
        }
      }

      const inserted = await db
        .insert(visitorAnnouncements)
        .values({
          title,
          message,
          category,
          priority: Number(priority) || 1,
          displayLocation,
          targetPages: Array.isArray(targetPages) ? targetPages : [],
          ctaText,
          ctaLink,
          dismissible: dismissible !== false,
          active: Boolean(active),
          publishAt: publishAt && !isNaN(Date.parse(publishAt)) ? new Date(publishAt) : null,
          expireAt: expireAt && !isNaN(Date.parse(expireAt)) ? new Date(expireAt) : null,
          timezone,
          notifySubscribersSmtp: Boolean(notifySubscribersSmtp),
          lastSmtpStatus: smtpStatus,
          createdBy: req.dbUser?.email || 'Admin',
        })
        .returning();

      await db.insert(cmsActivityLogs).values({
        module: 'ANNOUNCEMENTS',
        action: 'CREATE',
        recordId: String(inserted[0].id),
        recordTitle: title,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Created announcement (${displayLocation}) | ${smtpStatus}`,
      }).catch(() => {});

      res.status(201).json({ success: true, announcement: inserted[0], smtpStatus });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/cms/announcements/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const existing = await db.select().from(visitorAnnouncements).where(eq(visitorAnnouncements.id, id)).limit(1);
      if (existing.length === 0) return res.status(404).json({ error: 'Announcement not found' });

      const body = req.body || {};
      const upd = await db
        .update(visitorAnnouncements)
        .set({
          title: body.title ?? existing[0].title,
          message: body.message ?? existing[0].message,
          category: body.category ?? existing[0].category,
          priority: body.priority !== undefined ? Number(body.priority) : existing[0].priority,
          displayLocation: body.displayLocation ?? existing[0].displayLocation,
          targetPages: Array.isArray(body.targetPages) ? body.targetPages : existing[0].targetPages,
          ctaText: body.ctaText ?? existing[0].ctaText,
          ctaLink: body.ctaLink ?? existing[0].ctaLink,
          dismissible: body.dismissible !== undefined ? Boolean(body.dismissible) : existing[0].dismissible,
          active: body.active !== undefined ? Boolean(body.active) : existing[0].active,
          publishAt: body.publishAt !== undefined ? (body.publishAt ? new Date(body.publishAt) : null) : existing[0].publishAt,
          expireAt: body.expireAt !== undefined ? (body.expireAt ? new Date(body.expireAt) : null) : existing[0].expireAt,
          timezone: body.timezone ?? existing[0].timezone,
          updatedAt: new Date(),
        })
        .where(eq(visitorAnnouncements.id, id))
        .returning();

      res.json({ success: true, announcement: upd[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/cms/announcements/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const deleted = await db.delete(visitorAnnouncements).where(eq(visitorAnnouncements.id, id)).returning();
      if (deleted.length === 0) return res.status(404).json({ error: 'Announcement not found' });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 11. Publishing Activity Logs & History
  app.get('/api/cms/activity-logs', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureCmsTables();
      const limit = Math.min(250, Number(req.query.limit) || 100);
      const logs = await db.select().from(cmsActivityLogs).orderBy(desc(cmsActivityLogs.timestamp)).limit(limit);
      res.json({ success: true, logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/cms/publication-history', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureCmsTables();
      const limit = Math.min(250, Number(req.query.limit) || 100);
      const history = await db.select().from(publicationHistory).orderBy(desc(publicationHistory.createdAt)).limit(limit);
      res.json({ success: true, history });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
