process.env.NETLIFY = 'true';
import serverless from 'serverless-http';
import { getApp } from '../../src/server/app.ts';

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  // CRITICAL FOR NEON POSTGRESQL & SERVERLESS:
  // Prevent idle database connection pool sockets in Node.js event loop from holding the Lambda function open until timeout.
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  const origin = event.headers?.origin || event.headers?.Origin || '*';

  // Handle CORS OPTIONS preflight requests immediately
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-CSRF-Token, x-api-key, x-admin-key, Accept',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  // Normalize event.path so Express routes defined with /api/* receive /api/*
  // Netlify rewrites /api/* to /.netlify/functions/api/:splat
  if (event.path) {
    if (event.path.startsWith('/.netlify/functions/api')) {
      const remainder = event.path.replace(/^\/\.netlify\/functions\/api/, '');
      event.path = remainder.startsWith('/api') ? remainder : `/api${remainder || ''}`;
    } else if (!event.path.startsWith('/api') && !event.path.startsWith('/uploads')) {
      event.path = `/api${event.path.startsWith('/') ? '' : '/'}${event.path}`;
    }
  }

  if (event.rawUrl && event.rawUrl.includes('/.netlify/functions/api')) {
    event.rawUrl = event.rawUrl.replace('/.netlify/functions/api', '/api');
  }

  try {
    if (!cachedHandler) {
      const app = await getApp();
      cachedHandler = serverless(app, {
        binary: ['image/*', 'application/pdf', 'application/octet-stream']
      });
    }

    const response = await cachedHandler(event, context);

    // Ensure CORS headers on all Netlify responses
    if (response && response.headers) {
      response.headers['Access-Control-Allow-Origin'] = origin;
      response.headers['Access-Control-Allow-Credentials'] = 'true';
    }

    return response;
  } catch (err: any) {
    console.error('[NETLIFY_FUNCTION_FATAL_ERROR]', err);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true'
      },
      body: JSON.stringify({
        success: false,
        error: 'SERVERLESS_FUNCTION_ERROR',
        message: err.message || 'Internal Server Error'
      })
    };
  }
};
