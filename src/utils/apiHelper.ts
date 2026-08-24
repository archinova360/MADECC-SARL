/**
 * Safe API Request & Response Handling Utilities for MADECC Group Applications.
 * Validates Content-Type, prevents unexpected HTML parsing crashes, and normalizes API errors.
 */

export class ApiResponseError extends Error {
  status: number;
  statusText: string;
  url: string;
  data: any;
  isHtmlResponse: boolean;

  constructor(
    message: string,
    status: number,
    statusText: string,
    url: string,
    data?: any,
    isHtmlResponse = false
  ) {
    super(message);
    this.name = 'ApiResponseError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.data = data;
    this.isHtmlResponse = isHtmlResponse;
  }
}

/**
 * Safely parses any fetch Response into JSON or typed payload.
 * If the response contains HTML (e.g. from an unrouted SPA fallback, 404, or server error),
 * it extracts a clean excerpt and throws a clear, actionable ApiResponseError without crashing JSON.parse.
 */
export async function parseApiResponse<T = any>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') || '';
  const url = response.url || 'API Request';

  // 1. Detect HTML document responses
  if (contentType.includes('text/html')) {
    const rawText = await response.text();
    const cleanExcerpt = rawText
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

    let explanation = `Server returned an HTML document instead of JSON (Status ${response.status} ${response.statusText}).`;
    if (response.status === 404) {
      explanation = `Endpoint not found (${response.status}). The request was intercepted by the single-page application fallback.`;
    } else if (response.status === 500 || response.status === 502 || response.status === 503) {
      explanation = `Server error (${response.status} ${response.statusText}). An HTML error page was returned.`;
    }

    const message = `${explanation} ${cleanExcerpt ? `Preview: "${cleanExcerpt}"` : ''}`.trim();
    throw new ApiResponseError(message, response.status, response.statusText, url, { rawExcerpt: cleanExcerpt }, true);
  }

  // 2. Standard JSON Response Handling
  if (contentType.includes('application/json') || contentType.includes('+json')) {
    try {
      const data = await response.json();
      if (!response.ok) {
        const errorMsg =
          (typeof data.error === 'string' ? data.error : null) ||
          data.message ||
          data.errorMessage ||
          (data.error && typeof data.error.message === 'string' ? data.error.message : null) ||
          `HTTP ${response.status} (${response.statusText || 'Error'})`;
        throw new ApiResponseError(errorMsg, response.status, response.statusText, url, data);
      }
      return data as T;
    } catch (err: any) {
      if (err instanceof ApiResponseError) throw err;
      throw new ApiResponseError(
        `Failed to parse JSON response (${response.status}): ${err.message}`,
        response.status,
        response.statusText,
        url
      );
    }
  }

  // 3. Fallback for text / other MIME types
  const rawText = await response.text();
  if (!response.ok) {
    throw new ApiResponseError(
      rawText || `HTTP ${response.status} (${response.statusText})`,
      response.status,
      response.statusText,
      url,
      { rawText }
    );
  }

  // Attempt JSON parse if it looks like JSON
  const trimmed = rawText.trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return rawText as unknown as T;
    }
  }

  return rawText as unknown as T;
}

/**
 * Convenient wrapper around window.fetch that automatically applies parseApiResponse.
 */
export async function safeApiFetch<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  return parseApiResponse<T>(response);
}
