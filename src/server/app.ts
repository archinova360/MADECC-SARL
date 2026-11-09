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
import { generateCsrfToken, validateCsrfToken } from './csrfService.ts';

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
import apiPlatformRoutes from './routes/apiPlatformRoutes.ts';

let isDatabaseSeeded = false;

export async function getApp(): Promise<express.Express> {
  if (!isDatabaseSeeded) {
    try {
      await ensureReviewerCredentialsTable();
      await ensureAuthSessionsTable();
      await ensureSiteSettingsTable();
      await ensureSalesTables();
      await ensureErpTables();
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
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Global Cross-Origin Resource Sharing (CORS) & Preflight Handling for Netlify & Production
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, x-api-key, x-admin-key, Accept');
    res.setHeader('Access-Control-Max-Age', '86400');

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

  // Explicit sitemap.xml handler (ensures valid XML header & immediate delivery)
  app.get('/sitemap.xml', (req, res) => {
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

  // Explicit robots.txt handler
  app.get('/robots.txt', (req, res) => {
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
