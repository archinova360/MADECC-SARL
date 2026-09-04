/**
 * Central email utility for MADECC GROUP
 * All email dispatches use the authenticated SMTP service via kreboya603@gmail.com
 */
import { 
  sendEmail as smtpSendEmail, 
  sendNotificationEmail as smtpSendNotificationEmail,
  getTransporter,
  SMTP_CANONICAL_USER,
  buildBrandedHtmlTemplate
} from '../server/mailService.ts';

export async function sendEmail(
  to: string, 
  subject: string, 
  text: string, 
  html?: string, 
  options?: any
): Promise<boolean> {
  try {
    const formattedHtml = html || `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${text.replace(/\n/g, '<br/>')}</div>`;
    await smtpSendEmail(to, subject, text, formattedHtml, options);
    return true;
  } catch (err) {
    console.error(`[EMAIL_DISPATCH_FAILED] To: ${to} | Subject: ${subject}:`, err);
    return false;
  }
}

export async function sendNotificationEmail(
  subject: string, 
  text: string, 
  html?: string, 
  options?: any
): Promise<boolean> {
  try {
    const targetAdmin = options?.to || process.env.ADMIN_EMAIL || process.env.ADMIN_NOTIFICATION_EMAIL || SMTP_CANONICAL_USER;
    const formattedHtml = html || `<div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">${text.replace(/\n/g, '<br/>')}</div>`;
    await smtpSendNotificationEmail(subject, text, formattedHtml, {
      ...options,
      to: targetAdmin
    });
    return true;
  } catch (err) {
    console.error(`[ADMIN_NOTIFICATION_FAILED] Subject: ${subject}:`, err);
    return false;
  }
}

export { getTransporter, SMTP_CANONICAL_USER, buildBrandedHtmlTemplate };

