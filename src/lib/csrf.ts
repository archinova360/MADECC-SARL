let globalCsrfToken: string | null = null;
let isFetchingToken = false;
let tokenPromise: Promise<string | null> | null = null;
let originalFetchFn: typeof window.fetch | null = null;

export async function fetchCsrfToken(): Promise<string | null> {
  if (globalCsrfToken) return globalCsrfToken;
  if (isFetchingToken && tokenPromise) return tokenPromise;

  const fetchFn = originalFetchFn || (typeof window !== 'undefined' ? window.fetch : fetch);

  isFetchingToken = true;
  tokenPromise = fetchFn('/api/csrf-token')
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch CSRF token');
      return res.json();
    })
    .then(data => {
      globalCsrfToken = data.csrfToken;
      return globalCsrfToken;
    })
    .catch(err => {
      console.warn('Error fetching CSRF token (this is expected if the server is starting):', err);
      return null;
    })
    .finally(() => {
      isFetchingToken = false;
      tokenPromise = null;
    });

  return tokenPromise;
}

export async function getCsrfHeaders(): Promise<Record<string, string>> {
  const token = await fetchCsrfToken();
  return token ? { 'X-CSRF-Token': token } : {};
}

export function initCsrfProtection(): void {
  if (typeof window === 'undefined') return;

  try {
    originalFetchFn = window.fetch;

    const patchedFetch = async function (this: any, input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const method = (init?.method || 'GET').toUpperCase();
      const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

      // Identify if the request goes to our API routes
      let isApiRequest = false;
      if (typeof input === 'string') {
        isApiRequest = input.startsWith('/api/') || input.startsWith('api/') || input.includes('/api/');
      } else if (input instanceof URL) {
        isApiRequest = input.pathname.startsWith('/api/');
      } else if (input instanceof Request) {
        isApiRequest = input.url.startsWith('/api/') || input.url.includes('/api/');
      }

      if (!safeMethods.includes(method) && isApiRequest) {
        let token = globalCsrfToken;
        if (!token) {
          token = await fetchCsrfToken();
        }

        if (token) {
          const headers = new Headers(init?.headers || {});
          if (!headers.has('X-CSRF-Token')) {
            headers.set('X-CSRF-Token', token);
          }
          
          if (!init) {
            init = {};
          }
          init.headers = headers;
        }
      }

      return originalFetchFn ? originalFetchFn.call(this || window, input, init) : fetch(input, init);
    };

    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (descriptor && !descriptor.writable && !descriptor.configurable) {
      console.warn('[CSRF] window.fetch is non-writable and non-configurable in this environment. Utilizing manual/explicit getCsrfHeaders() fallback.');
    } else {
      try {
        window.fetch = patchedFetch;
      } catch (e) {
        // If direct assignment fails (e.g. read-only properties in custom iframe proxies), use Object.defineProperty
        try {
          Object.defineProperty(window, 'fetch', {
            value: patchedFetch,
            writable: true,
            configurable: true,
            enumerable: true
          });
        } catch (innerErr) {
          console.warn('Unable to redefine window.fetch with Object.defineProperty:', innerErr);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to patch window.fetch for CSRF protection:', err);
  }

  // Pre-fetch token right away
  fetchCsrfToken();
}

