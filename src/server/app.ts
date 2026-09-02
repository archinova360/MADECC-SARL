import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import { seedDatabase } from '../db/seed.ts';
import { ensureReviewerCredentialsTable } from '../lib/reviewerAuth.ts';
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
import apiPlatformRoutes from './routes/apiPlatformRoutes.ts';

let isDatabaseSeeded = false;

export async function getApp(): Promise<express.Express> {
  if (!isDatabaseSeeded) {
    try {
      await seedDatabase();
      await ensureReviewerCredentialsTable();
      isDatabaseSeeded = true;
    } catch (seedErr) {
      console.error('[SEED_INITIALIZATION_ERROR] Failed to run database seeding:', seedErr);
    }
  }

  const app = express();
  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Support Netlify Serverless environment path forwarding
  app.use((req, res, next) => {
    if (req.url.startsWith('/.netlify/functions/api')) {
      req.url = req.url.replace('/.netlify/functions/api', '/api');
    }
    next();
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

    // Exclude CSRF token route, reviewer login, webhooks, compliance/data-deletion, social studio, and v1 APIs
    if (
      req.path === '/csrf-token' ||
      req.path.startsWith('/auth') ||
      req.path.startsWith('/v1') ||
      req.path.startsWith('/webhooks') ||
      req.path.startsWith('/social') ||
      req.path.startsWith('/marketing/posts') ||
      req.path.startsWith('/saas') ||
      req.path.startsWith('/compliance') ||
      req.path.startsWith('/data-deletion') ||
      req.path.startsWith('/health') ||
      req.headers['x-api-key']
    ) {
      return next();
    }

    // Requests with an Authorization Bearer header are structurally immune to CSRF.
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
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

  // Serve static uploads directory when present
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (fs.existsSync(uploadsDir)) {
    app.use('/uploads', express.static(uploadsDir));
  }

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
  setupLessonRoutes(app);
  setupSocialRoutes(app);
  setupSaasRoutes(app);
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

  // Global Error Handler for /api routes (Always outputs valid JSON, never HTML)
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[API_UNHANDLED_ERROR]', req.method, req.originalUrl, err);
    if (res.headersSent) {
      return next(err);
    }
    const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
    res.status(status).json({
      success: false,
      error: err.name || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    });
  });

  return app;
}
