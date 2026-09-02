// ⚡ MADECC Group Enterprise Server — Full-Stack Application Engine (Modular Architecture)
import express from 'express';
import nodePath from 'path';
import { getApp } from './src/server/app.ts';
import { validateEnvironmentVariables } from './src/server/envValidator.ts';

// Re-export services for backwards compatibility and integration tests
export { getApp };
export { 
  getGeminiApiKey, 
  getGeminiClient, 
  normalizeGeminiError, 
  generateGeminiContentWithRetry, 
  retryWithFallback, 
  generateAIResponse 
} from './src/server/geminiService.ts';
export { 
  initAndSanitizeCloudinaryEnv, 
  getCloudinaryCredentials, 
  getCloudinary, 
  deleteFileFromCloud, 
  upload 
} from './src/server/storageService.ts';
export { 
  getTransporter, 
  sendNotificationEmail, 
  sendEmail 
} from './src/server/mailService.ts';
export { 
  generateCsrfToken, 
  validateCsrfToken 
} from './src/server/csrfService.ts';

const PORT = 3000;

export async function startServer() {
  validateEnvironmentVariables();
  console.log('========================================================================');
  console.log('[LAUNCH] Starting MADECC Group Portal (Node.js ' + process.version + ')');
  console.log('[GLOBAL] Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('[SIGNAL] Port: ' + PORT);
  console.log('[DB] Database: ' + (process.env.DATABASE_URL ? 'CONFIGURED' : 'MISSING'));
  console.log('[AI] Gemini AI Assistant: ' + (process.env.GEMINI_API_KEY ? 'ACTIVE (Key found)' : 'OFFLINE (Fallback replies enabled)'));
  console.log('[EMAIL] SMTP Transporter: ' + (process.env.SMTP_USER && process.env.SMTP_PASS ? 'CONFIGURED' : 'CONSOLE FALLBACK (Missing credentials)'));
  console.log('========================================================================');

  const app = await getApp();

  // ==========================================
  // --- VITE MIDDLEWARE SETUP ---
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = nodePath.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(nodePath.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('Server running at http://localhost:' + PORT);
  });
}

// Robust detection of serverless environments (Netlify / AWS Lambda)
const isServerless = 
  process.env.NETLIFY === 'true' || 
  process.env.NETLIFY === '1' ||
  process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
  process.env.LAMBDA_TASK_ROOT !== undefined ||
  process.env.FUNCTIONS_SIGNATURE !== undefined;

if (!isServerless) {
  startServer();
}
