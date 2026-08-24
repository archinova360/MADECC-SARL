process.env.NETLIFY = 'true';
import serverless from 'serverless-http';
import { getApp } from '../../server.ts';

let cachedHandler: any;

export const handler = async (event: any, context: any) => {
  if (!cachedHandler) {
    const app = await getApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};
