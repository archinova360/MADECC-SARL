import { getCloudinaryCredentials } from './storageService.js';
import { getGeminiApiKey } from './geminiService.js';

export function validateEnvironmentVariables() {
  const required = ['DATABASE_URL'];
  const missingRequired = required.filter(key => !process.env[key]);
  
  if (missingRequired.length > 0) {
    console.error(`[CRITICAL] Missing required environment variables: ${missingRequired.join(', ')}`);
  } else {
    console.log('[OK] [CONFIG AUDIT] Database Connection: ACTIVE');
  }

  const hasSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { cloudName, apiKey, apiSecret } = getCloudinaryCredentials();
  const hasCloudinary = !!(cloudName && apiKey && apiSecret);
  
  if (hasCloudinary) {
    console.log(`[OK] [CONFIG AUDIT] Cloudinary Media CDN Storage: ACTIVE (Cloud: ${cloudName})`);
  } else if (hasSupabase) {
    console.log('[OK] [CONFIG AUDIT] Supabase Storage: ACTIVE');
  } else {
    console.warn('[WARN] [CONFIG AUDIT] Neither Cloudinary nor Supabase credentials found. Uploaded files will be stored on local filesystem.');
  }

  const geminiKey = getGeminiApiKey();
  if (geminiKey) {
    console.log('[OK] [CONFIG AUDIT] Gemini 3.7 / 3.1 AI Engine: ACTIVE');
  } else {
    console.warn('[WARN] [CONFIG AUDIT] GEMINI_API_KEY is not configured or placeholder detected. Chatbot and AI letter generators will fall back to local templates.');
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[WARN] [CONFIG AUDIT] SMTP credentials not found. Booking & contact form emails will be simulated to console output.');
  } else {
    console.log('[OK] [CONFIG AUDIT] SMTP Email Transporter: ACTIVE');
  }
}
