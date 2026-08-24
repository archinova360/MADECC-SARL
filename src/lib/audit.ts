import { db } from '../db/index.ts';
import { auditLogs } from '../db/schema.ts';

export async function logAudit(
  userId: string | null, 
  userEmail: string | null, 
  action: string, 
  details: string
) {
  try {
    await db.insert(auditLogs).values({
      userId,
      userEmail,
      action,
      details,
      timestamp: new Date()
    });
    console.log(`[AUDIT] ${action} by ${userEmail || 'system'}: ${details}`);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}
