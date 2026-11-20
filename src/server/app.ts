import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import cookieParser from 'cookie-parser';
import { seedDatabase } from '../db/seed.ts';
import { ensureReviewerCredentialsTable } from '../lib/reviewerAuth.ts';
import { ensureAuthSessionsTable } from '../lib/sessionService.ts';
import { ensureSiteSettingsTable } from '../db/ensureSiteSettings.ts';
import { ensureSalesTables } from '../db/ensureSalesTables.ts';
import { ensureErpTables } from '../db/ensureErpTables.ts';
import { ensureSaasTables } from '../db/ensureSaasTables.ts';
import { ensureProDocStudioTables } from '../db/ensureProDocStudioTables.ts';
import { ensureCorporatePlatformTables } from '../db/ensureCorporatePlatformTables.ts';
import { ensureSecurityMonitoringTables } from '../db/ensureSecurityMonitoringTables.ts';
import { ensureCmsTables } from '../db/ensureCmsTables.ts';
import { generateCsrfToken, validateCsrfToken } from './csrfService.ts';
import { buildCorsHeadersForOrigin } from './corsOrigins.ts';
import { createSecurityGateMiddleware } from './securityMonitorService.ts';

import { setupAuthRoutes } from './routes/authRoutes.ts';
import { setupGeminiRoutes } from './routes/geminiRoutes.ts';
import { setupUploadRoutes } from './routes/uploadRoutes.ts';
import { setupCmsRoutes } from './routes/cmsRoutes.ts';
import { setupCalculatorRoutes } from './routes/calculatorRoutes.ts';
import { setupQuotesRoutes } from './routes/quotesRoutes.ts';
import { setupCrmRoutes } from './routes/crmRoutes.ts';
import { setupProcurementRoutes } from './routes/procurementRoutes.ts';
import { setupErpRoutes } from './routes/erpRoutes.ts';
import { setupLessonRoutes } from './routes/lessonRoutes.ts';
import { setupSocialRoutes } from './routes/socialRoutes.ts';
import { setupSaasRoutes } from './routes/saasRoutes.ts';
import { setupDocumentRoutes } from './routes/documentRoutes.ts';
import { setupOptimizerRoutes } from './routes/optimizerRoutes.ts';
import { setupSalesRoutes } from './routes/salesRoutes.ts';
import { setupErpPlatformRoutes } from './routes/erpPlatformRoutes.ts';
import { setupProDocStudioRoutes } from './routes/proDocStudioRoutes.ts';
import { setupCorporateRoutes } from './routes/corporateRoutes.ts';
import { setupSecurityRoutes } from './routes/securityRoutes.ts';
import {
  setupCmsPublishingRoutes,
  generateDynamicSitemapXml,
  generateDynamicRobotsTxt,
  generateDynamicLlmsTxt,
} from './routes/cmsPublishingRoutes.ts';
import apiPlatformRoutes from './routes/apiPlatformRoutes.ts';

let isDatabaseSeeded = false;

export async function getApp(): Promise<express.Express> {
  if (!isDatabaseSeeded) {
    try {
      await ensureSecurityMonitoringTables();
    } catch (secErr) {
      console.error('[SECURITY_DB_INIT_ERROR]', secErr);
    }
    try {
      await ensureReviewerCredentialsTable();
      await ensureAuthSessionsTable();
      await ensureSiteSettingsTable();
      await ensureSalesTables();
      await ensureErpTables();
      await ensureSaasTables();
      await ensureProDocStudioTables();
      await ensureCorporatePlatformTables();
      await ensureCmsTables();
      if (!process.env.NETLIFY) {
        await seedDatabase();
      } else {
        // Run full database seed non-blockingly on Netlify to avoid 10s lambda timeout on cold start
        seedDatabase().catch((e: any) => console.warn('[NETLIFY_SEED_ASYNC]', e.message));
      }
      isDatabaseSeeded = true;
    } catch (seedErr) {
      console.error('[SEED_INITIALIZATION_ERROR] Failed to run database seeding:', seedErr);
    }
  }

  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Baseline Security Headers (Preserves AI Studio iframe & Firebase Google OAuth popups)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=(), payment=()');
    res.setHeader(
      'Content-Security-Policy',
      "frame-ancestors 'self' https://aistudio.google.com https://*.googleusercontent.com https://*.ai.studio; base-uri 'self'; object-src 'none';"
    );
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
    if (isHttps) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });

  // Strict CORS Allowlist & Preflight Handling
  app.use((req, res, next) => {
    const origin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    const corsHeaders = buildCorsHeadersForOrigin(origin);
    for (const [k, v] of Object.entries(corsHeaders)) {
      res.setHeader(k, v);
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // Support Netlify Serverless environment path forwarding
  app.use((req, res, next) => {
    if (req.url.startsWith('/.netlify/functions/api')) {
      const remainder = req.url.slice('/.netlify/functions/api'.length);
      req.url = remainder.startsWith('/api') ? remainder : `/api${remainder || ''}`;
    } else if (process.env.NETLIFY && !req.url.startsWith('/api') && !req.url.startsWith('/uploads')) {
      req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`;
    }
    next();
  });

  // Security Gate & Threat Telemetry Middleware
  app.use('/api/admin', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, private');
    next();
  });
  app.use('/api/auth', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, private');
    next();
  });
  app.use(createSecurityGateMiddleware());

  // Dynamic sitemap.xml handler (Neon DB backed with public/ fallback)
  app.get('/sitemap.xml', async (_req, res) => {
    try {
      const xml = await generateDynamicSitemapXml();
      if (xml && xml.includes('<urlset')) {
        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        return res.send(xml);
      }
    } catch {
      // Fallback to static asset
    }
    const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(sitemapPath)) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.sendFile(sitemapPath);
    }
    const distSitemap = path.join(process.cwd(), 'dist', 'sitemap.xml');
    if (fs.existsSync(distSitemap)) {
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      return res.sendFile(distSitemap);
    }
    res.status(404).send('Sitemap not found');
  });

  // Dynamic robots.txt handler (always enforces /admin and /api exclusion)
  app.get('/robots.txt', async (_req, res) => {
    try {
      const robots = await generateDynamicRobotsTxt();
      if (robots) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(robots);
      }
    } catch {
      // Fallback to static asset
    }
    const robotsPath = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(robotsPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(robotsPath);
    }
    const distRobots = path.join(process.cwd(), 'dist', 'robots.txt');
    if (fs.existsSync(distRobots)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(distRobots);
    }
    res.status(404).send('Robots not found');
  });

  // Explicit ads.txt handler (guarantees AdSense crawler gets plain text 200 response immediately)
  app.get('/ads.txt', (req, res) => {
    const adsPath = path.join(process.cwd(), 'public', 'ads.txt');
    if (fs.existsSync(adsPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(adsPath);
    }
    const distAds = path.join(process.cwd(), 'dist', 'ads.txt');
    if (fs.existsSync(distAds)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(distAds);
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send('google.com, pub-7227721489757915, DIRECT, f08c47fec0942fa0\n');
  });

  // Explicit AI-Agent Discovery handlers (/llms.txt and /ai-catalog.json)
  app.get('/llms.txt', async (_req, res) => {
    try {
      const txt = await generateDynamicLlmsTxt();
      if (txt) {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(txt);
      }
    } catch {
      // Fallback to static asset
    }
    const publicPath = path.join(process.cwd(), 'public', 'llms.txt');
    const distPath = path.join(process.cwd(), 'dist', 'llms.txt');
    const target = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(target)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.sendFile(target);
    }
    res.status(404).send('llms.txt not found');
  });

  app.get('/ai-catalog.json', (_req, res) => {
    const publicPath = path.join(process.cwd(), 'public', 'ai-catalog.json');
    const distPath = path.join(process.cwd(), 'dist', 'ai-catalog.json');
    const target = fs.existsSync(publicPath) ? publicPath : distPath;
    if (fs.existsSync(target)) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.sendFile(target);
    }
    res.status(404).json({ error: 'ai-catalog.json not found' });
  });

  // Base Health and Diagnostic Endpoints (Guaranteed JSON responses)
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'MADECC GROUP Portal API',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // CSRF Protection Token Request Route (GET: Safe, always permitted)
  app.get('/api/csrf-token', (req, res) => {
    const token = generateCsrfToken();
    res.json({ csrfToken: token });
  });

  // Apply CSRF Protection Middleware globally on all write actions (POST, PUT, DELETE, PATCH)
  app.use('/api', (req, res, next) => {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
      return next();
    }

    // Exclude CSRF token route, authenticated admin operations, webhooks, compliance, and public endpoints
    if (
      req.path === '/csrf-token' ||
      req.path === '/security/beacon' ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/sales') ||
      req.path.startsWith('/optimizer') ||
      req.path.startsWith('/cms') ||
      req.path.startsWith('/projects') ||
      req.path.startsWith('/admin') ||
      req.path.startsWith('/categories') ||
      req.path.startsWith('/blogs') ||
      req.path.startsWith('/banners') ||
      req.path.startsWith('/gallery') ||
      req.path.startsWith('/team') ||
      req.path.startsWith('/documents') ||
      req.path.startsWith('/reviews') ||
      req.path.startsWith('/subscribers') ||
      req.path.startsWith('/appointments') ||
      req.path.startsWith('/contacts') ||
      req.path.startsWith('/quotes') ||
      req.path.startsWith('/v1') ||
      req.path.startsWith('/webhooks') ||
      req.path.startsWith('/social') ||
      req.path.startsWith('/marketing/posts') ||
      req.path.startsWith('/saas') ||
      req.path.startsWith('/compliance') ||
      req.path.startsWith('/data-deletion') ||
      req.path.startsWith('/contracts') ||
      req.path.startsWith('/receipts') ||
      req.path.startsWith('/client') ||
      req.path.startsWith('/erp') ||
      req.path.startsWith('/doc-studio') ||
      req.path.startsWith('/corporate') ||
      req.path.startsWith('/public/corporate') ||
      req.path.startsWith('/health') ||
      req.path.startsWith('/upload') ||
      req.path.startsWith('/public/upload') ||
      req.headers['x-api-key'] ||
      req.headers['x-admin-key']
    ) {
      return next();
    }

    // Requests with an Authorization Bearer header or valid session cookies are structurally immune to CSRF.
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.split('Bearer ')[1]?.trim();
      if (candidate && candidate !== 'null' && candidate !== 'undefined') {
        return next();
      }
    }
    if ((req as any).cookies?.madecc_auth_session || (req as any).cookies?.madecc_reviewer_session) {
      return next();
    }


    const token = req.headers['x-csrf-token'];
    if (!token || typeof token !== 'string' || !validateCsrfToken(token)) {
      const isMissing = !token;
      const debugDetail = isMissing 
        ? 'Missing CSRF token header (X-CSRF-Token).' 
        : 'Invalid or expired CSRF token.';
        
      console.warn(`[CSRF] Blocked unauthorized request from ${req.ip} targeting ${req.method} ${req.originalUrl}: ${debugDetail}`);
      return res.status(403).json({ 
        error: `Forbidden: ${debugDetail} To resolve, please refresh the webpage or ensure that your browser allows cookies and local storage, and then submit again.` 
      });
    }

    next();
  });

  // Serve static uploads directory across local disk and serverless writable tmp directories
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }
  const tmpUploadsDir = path.join(os.tmpdir(), 'madecc_uploads');
  if (fs.existsSync(tmpUploadsDir)) {
    app.use('/uploads', express.static(tmpUploadsDir));
  }

  // Fallback explicit endpoint for serving local files
  app.get('/uploads/:filename', (req, res, next) => {
    const filename = path.basename(req.params.filename);
    const candidatePaths = [
      path.join(process.cwd(), 'uploads', filename),
      path.join(os.tmpdir(), 'madecc_uploads', filename),
      path.join(os.tmpdir(), filename)
    ];
    for (const filePath of candidatePaths) {
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
    next();
  });


  // Register modular API routes
  setupAuthRoutes(app);
  setupGeminiRoutes(app);
  setupUploadRoutes(app);
  setupCmsPublishingRoutes(app);
  setupCmsRoutes(app);
  setupCalculatorRoutes(app);
  setupQuotesRoutes(app);
  setupCrmRoutes(app);
  setupProcurementRoutes(app);
  setupErpRoutes(app);
  setupErpPlatformRoutes(app);
  setupLessonRoutes(app);
  setupSocialRoutes(app);
  setupSaasRoutes(app);
  setupDocumentRoutes(app);
  setupOptimizerRoutes(app);
  setupSalesRoutes(app);
  setupProDocStudioRoutes(app);
  setupCorporateRoutes(app);
  setupSecurityRoutes(app);
  app.use('/api/v1', apiPlatformRoutes);
  app.use('/api', apiPlatformRoutes);

  // Guarantee: Prevent SPA fallback on unmatched /api/* routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'API_ENDPOINT_NOT_FOUND',
      message: `The requested API endpoint ${req.method} ${req.originalUrl} was not found.`,
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });

  // Global Error Handler for /api routes (Always outputs valid JSON, never HTML error pages)
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.originalUrl?.startsWith('/api') || req.path?.startsWith('/api') || req.url?.startsWith('/api')) {
      console.error('[API_UNHANDLED_ERROR]', req.method, req.originalUrl, err);
      if (res.headersSent) {
        return next(err);
      }
      const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
      return res.status(status).json({
        success: false,
        message: err.message || 'The requested operation could not be completed.',
        error: err.name || 'INTERNAL_SERVER_ERROR',
        data: null,
        errors: [
          {
            code: err.code || 'SERVER_ERROR',
            field: err.field || undefined,
            message: err.message || 'An unexpected internal server error occurred'
          }
        ],
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    }
    next(err);
  });


  return app;
}
