import { GoogleGenAI } from '@google/genai';

let aiInstance: GoogleGenAI | null = null;
let lastKnownKey: string | null = null;

export function getGeminiApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;
  const trimmed = key.trim();
  if (!trimmed || trimmed === 'AIzaSy...' || trimmed.length < 10) return null;
  return trimmed;
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    aiInstance = null;
    lastKnownKey = null;
    return null;
  }
  if (!aiInstance || lastKnownKey !== apiKey) {
    try {
      aiInstance = new GoogleGenAI({ apiKey });
      lastKnownKey = apiKey;
    } catch (err) {
      console.error('[GEMINI_INIT_ERROR] Failed to initialize GoogleGenAI client:', err);
      aiInstance = null;
      lastKnownKey = null;
      return null;
    }
  }
  return aiInstance;
}

export type GeminiErrorCode = 
  | 'API_KEY_MISSING'
  | 'API_KEY_INVALID'
  | 'QUOTA_EXCEEDED'
  | 'RATE_LIMITED'
  | 'MODEL_NOT_FOUND'
  | 'MODEL_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'SAFETY_BLOCKED'
  | 'UNKNOWN';

export interface NormalizedGeminiError {
  code: GeminiErrorCode;
  message: string;
  userMessage: string;
  retryable: boolean;
  status?: number;
  originalError?: any;
}

export function normalizeGeminiError(err: any): NormalizedGeminiError {
  if (!err) {
    return {
      code: 'UNKNOWN',
      message: 'An unknown error occurred with the AI service.',
      userMessage: 'The AI assistant encountered an unexpected error. Please try again shortly.',
      retryable: false
    };
  }

  const msg = (err.message || String(err)).toLowerCase();
  const rawStatus = err.status || err.statusCode || err.code;

  if (msg.includes('api key') && (msg.includes('invalid') || msg.includes('not found') || msg.includes('unregistered') || msg.includes('unauthorized') || rawStatus === 401 || rawStatus === 403)) {
    return {
      code: 'API_KEY_INVALID',
      message: 'The configured Gemini API key is invalid or unauthorized.',
      userMessage: 'AI service credentials appear invalid. Please check your GEMINI_API_KEY configuration in Settings.',
      retryable: false,
      status: 401,
      originalError: err
    };
  }

  if (msg.includes('api key') && (msg.includes('missing') || msg.includes('undefined') || msg.includes('null'))) {
    return {
      code: 'API_KEY_MISSING',
      message: 'GEMINI_API_KEY environment variable is not configured.',
      userMessage: 'Gemini API key is not configured. Please add your GEMINI_API_KEY in the application settings.',
      retryable: false,
      status: 400,
      originalError: err
    };
  }

  if (rawStatus === 429 || msg.includes('resource_exhausted') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('too many requests')) {
    return {
      code: 'QUOTA_EXCEEDED',
      message: 'Gemini API rate limit or quota exceeded.',
      userMessage: 'The AI service is experiencing high demand. Please wait a moment before trying again.',
      retryable: true,
      status: 429,
      originalError: err
    };
  }

  if (rawStatus === 503 || rawStatus === 500 || msg.includes('unavailable') || msg.includes('overloaded') || msg.includes('internal error') || msg.includes('backend error')) {
    return {
      code: 'MODEL_UNAVAILABLE',
      message: 'Gemini model service is temporarily unavailable or overloaded.',
      userMessage: 'The AI service is momentarily busy. Automatic fallback is engaging.',
      retryable: true,
      status: rawStatus || 503,
      originalError: err
    };
  }

  if (rawStatus === 404 || msg.includes('not found') || msg.includes('unsupported model') || msg.includes('models/')) {
    return {
      code: 'MODEL_NOT_FOUND',
      message: 'The requested Gemini model version was not found.',
      userMessage: 'The requested AI model version is currently unavailable. Switching to recommended model.',
      retryable: true,
      status: 404,
      originalError: err
    };
  }

  if (msg.includes('timeout') || msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('fetch failed')) {
    return {
      code: 'TIMEOUT',
      message: 'Connection to Gemini API timed out.',
      userMessage: 'Connection timed out while contacting the AI service. Retrying...',
      retryable: true,
      status: 408,
      originalError: err
    };
  }

  if (msg.includes('safety') || msg.includes('blocked') || msg.includes('harm') || msg.includes('content policy')) {
    return {
      code: 'SAFETY_BLOCKED',
      message: 'Content generation was blocked by safety filters.',
      userMessage: 'The prompt could not be processed due to safety and content policy guidelines.',
      retryable: false,
      status: 400,
      originalError: err
    };
  }

  return {
    code: 'UNKNOWN',
    message: err.message || 'An unexpected AI generation error occurred.',
    userMessage: 'The AI assistant encountered an unexpected issue. Please try again.',
    retryable: true,
    status: rawStatus || 500,
    originalError: err
  };
}

export interface GeminiGenerateOptions {
  model?: string;
  fallbackModels?: string[];
  maxRetries?: number;
  retryDelayMs?: number;
  config?: any;
}

export async function generateGeminiContentWithRetry(
  promptOrParts: string | any[],
  options: GeminiGenerateOptions = {}
): Promise<{ text: string; modelUsed: string; attempts: number }> {
  const primaryModel = options.model || 'gemini-3.7-flash';
  const rawFallbacks = options.fallbackModels || ['gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash'];
  const validModelSet = new Set(['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite', 'gemini-2.5-flash']);
  const sanitizedFallbacks = rawFallbacks.filter(m => validModelSet.has(m) && m !== primaryModel);
  const allModels = [primaryModel, ...sanitizedFallbacks];
  const maxRetries = options.maxRetries ?? 2;
  const initialDelay = options.retryDelayMs ?? 600;

  const ai = getGeminiClient();
  if (!ai) {
    throw new Error('GEMINI_API_KEY is not configured or invalid. Please configure your API key in settings.');
  }

  let lastError: NormalizedGeminiError | null = null;
  let totalAttempts = 0;

  for (let modelIdx = 0; modelIdx < allModels.length; modelIdx++) {
    const currentModel = allModels[modelIdx];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      totalAttempts++;
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: promptOrParts,
          config: options.config,
        });

        const text = response.text || '';
        if (!text && !response) {
          throw new Error('Empty response received from Gemini model.');
        }

        return {
          text,
          modelUsed: currentModel,
          attempts: totalAttempts,
        };
      } catch (err: any) {
        const norm = normalizeGeminiError(err);
        lastError = norm;

        console.warn(
          `[GEMINI_RETRY] Model: ${currentModel}, Attempt: ${attempt + 1}/${maxRetries + 1}, Code: ${norm.code}, Error: ${err.message || err}`
        );

        if (!norm.retryable && norm.code !== 'MODEL_NOT_FOUND') {
          throw err;
        }

        if (norm.code === 'MODEL_NOT_FOUND') {
          break;
        }

        if (norm.code === 'MODEL_UNAVAILABLE') {
          if (attempt >= 1) {
            break;
          }
        }

        if (attempt < maxRetries) {
          const delay = initialDelay * Math.pow(1.5, attempt) + Math.random() * 200;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw new Error(
    lastError?.userMessage ||
    `Failed to generate content after trying models [${allModels.join(', ')}]. Last error: ${lastError?.message}`
  );
}

export async function retryWithFallback<T>(
  fn: (model: string) => Promise<T>,
  models: string[] = ['gemini-3.7-flash', 'gemini-3.1-flash-lite'],
  retriesPerModel: number = 2,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: any = null;

  for (const model of models) {
    let delay = initialDelayMs;
    for (let attempt = 0; attempt <= retriesPerModel; attempt++) {
      try {
        return await fn(model);
      } catch (err: any) {
        lastError = err;
        const norm = normalizeGeminiError(err);

        if (!norm.retryable) {
          console.warn(`[GEMINI] Non-retryable error with model ${model} (${norm.code}): ${norm.message}`);
          throw err;
        }

        console.warn(`[GEMINI] Attempt ${attempt + 1} with model ${model} failed (${norm.code}): ${err.message || err}`);
        
        if (attempt < retriesPerModel) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    }
  }

  throw lastError || new Error('All Gemini models and retries failed.');
}

export async function generateAIResponse(prompt: string, fallbackHtml: string): Promise<string> {
  const gemini = getGeminiClient();
  if (!gemini) {
    console.warn('[GEMINI] API Key missing. Using pre-crafted fallback email response.');
    return fallbackHtml;
  }
  try {
    const response = await retryWithFallback(async (modelName) => {
      return await gemini.models.generateContent({
        model: modelName,
        contents: prompt,
      });
    });
    let html = response.text || '';
    if (html.includes('```html')) {
      html = html.split('```html')[1].split('```')[0];
    } else if (html.includes('```')) {
      html = html.split('```')[1].split('```')[0];
    }
    return html.trim() || fallbackHtml;
  } catch (error: any) {
    console.warn('[Gemini Info] Falling back to offline email auto-response:', error.message || error);
    return fallbackHtml;
  }
}
