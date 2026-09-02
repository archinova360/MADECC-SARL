import serverless from 'serverless-http';
import { getApp } from '../src/server/app.ts';

let cachedHandler: any;

export default async function handler(req: any, res: any) {
  if (!cachedHandler) {
    const app = await getApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(req, res);
}
