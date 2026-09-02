import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';

export async function logAudit(
  userId: string | null, 
  userEmail: string | null, 
  action: string, 
  details: string,
  ipAddress?: string | null
) {
  try {
    await db.insert(auditLogs).values({
      userId,
      userEmail,
      action,
      details,
      timestamp: new Date()
    });
    console.log(`[AUDIT] ${action} by ${userEmail || 'system'}${ipAddress ? ` [IP: ${ipAddress}]` : ''}: ${details}`);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
