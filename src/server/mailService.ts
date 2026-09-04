import nodemailer from 'nodemailer';

export const SMTP_CANONICAL_USER = 'kreboya603@gmail.com';

let cachedTransporter: nodemailer.Transporter | null = null;

export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || SMTP_CANONICAL_USER;
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (!pass) {
    console.warn('[SMTP] Missing SMTP password (SMTP_PASS or SMTP_PASSWORD). Mail notifications will be output to console logs.');
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });

  return cachedTransporter;
}

export interface SendMailOptions {
  to?: string | string[];
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: any[];
}

export async function sendNotificationEmail(
  subject: string, 
  text: string, 
  html: string,
  options?: SendMailOptions
) {
  const primaryAdmin = process.env.ADMIN_EMAIL || process.env.SMTP_USER || SMTP_CANONICAL_USER;
  const recipient = options?.to || primaryAdmin;
  const transporter = getTransporter();

  const recipientStr = Array.isArray(recipient) ? recipient.join(', ') : recipient;

  if (!transporter) {
    console.log(`\n==========================================\n[SMTP SIMULATION] Mail to ${recipientStr}:\nSubject: ${subject}\nBody:\n${text}\n==========================================\n`);
    return { simulated: true };
  }

  try {
    const smtpUser = process.env.SMTP_USER || SMTP_CANONICAL_USER;
    const fromAddress = process.env.SMTP_FROM || smtpUser;
    const mailOpts: any = {
      from: `"MADECC GROUP" <${fromAddress}>`,
      to: recipientStr,
      subject,
      text,
      html,
    };
    if (options?.replyTo) mailOpts.replyTo = options.replyTo;
    if (options?.cc) mailOpts.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
    if (options?.bcc) mailOpts.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
    if (options?.attachments) mailOpts.attachments = options.attachments;

    const info = await transporter.sendMail(mailOpts);
    console.log(`[SMTP] Notification email sent successfully to ${recipientStr} via ${smtpUser}:`, info.messageId);
    return info;
  } catch (err) {
    console.error(`[SMTP_ERROR] Failed to send notification email to ${recipientStr}:`, err);
    throw err;
  }
}

export async function sendEmail(
  recipient: string, 
  subject: string, 
  text: string, 
  html: string,
  options?: SendMailOptions
) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n==========================================\n[SMTP SIMULATION] Mail to ${recipient}:\nSubject: ${subject}\nBody:\n${text}\n==========================================\n`);
    return { simulated: true };
  }

  try {
    const smtpUser = process.env.SMTP_USER || SMTP_CANONICAL_USER;
    const fromAddress = process.env.SMTP_FROM || smtpUser;
    const mailOpts: any = {
      from: `"MADECC GROUP" <${fromAddress}>`,
      to: recipient,
      subject,
      text,
      html,
    };
    // If replyTo is not specified for a client email, default to the SMTP user so replies reach admin
    mailOpts.replyTo = options?.replyTo || smtpUser;
    if (options?.cc) mailOpts.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
    if (options?.bcc) mailOpts.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;
    if (options?.attachments) mailOpts.attachments = options.attachments;

    const info = await transporter.sendMail(mailOpts);
    console.log(`[SMTP] Confirmation/Client email sent successfully to ${recipient} via ${smtpUser}:`, info.messageId);
    return info;
  } catch (err) {
    console.error(`[SMTP_ERROR] Failed to send client email to ${recipient}:`, err);
    throw err;
  }
}

/**
 * Standard branded email template wrapper for MADECC GROUP
 */
export function buildBrandedHtmlTemplate(params: {
  title: string;
  badge?: string;
  recipientName?: string;
  leadParagraph?: string;
  sectionsHtml: string;
  actionButton?: { label: string; url: string };
  footerNote?: string;
}) {
  const smtpUser = process.env.SMTP_USER || SMTP_CANONICAL_USER;
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; color: #0f172a; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
      <!-- Header -->
      <div style="background: #0f172a; padding: 26px 30px; text-align: center; border-bottom: 4px solid #f59e0b;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">MADECC GROUP</h1>
        <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 11px; font-family: monospace; letter-spacing: 0.15em; text-transform: uppercase;">
          ${params.badge || 'Civil Engineering &bull; Architecture &bull; Infrastructure'}
        </p>
      </div>

      <!-- Main Body -->
      <div style="padding: 28px 30px;">
        <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 19px; font-weight: 700;">
          ${params.title}
        </h2>

        ${params.recipientName ? `<p style="font-size: 15px; margin: 0 0 14px 0; line-height: 1.5;">Dear <strong>${params.recipientName}</strong>,</p>` : ''}
        ${params.leadParagraph ? `<p style="font-size: 14px; margin: 0 0 20px 0; line-height: 1.6; color: #334155;">${params.leadParagraph}</p>` : ''}

        ${params.sectionsHtml}

        ${params.actionButton ? `
          <div style="text-align: center; margin: 28px 0 16px 0;">
            <a href="${params.actionButton.url}" style="background-color: #f59e0b; color: #0f172a; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block; box-shadow: 0 2px 6px rgba(245,158,11,0.3);">
              ${params.actionButton.label} &rarr;
            </a>
          </div>
        ` : ''}

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0;" />

        <!-- Footer Contact -->
        <div style="font-size: 12px; color: #64748b; line-height: 1.6;">
          <p style="margin: 0 0 6px 0;">
            <strong>MADECC GROUP S.A.R.L.</strong> &bull; Yaounde Mbankolo &amp; Douala, Cameroon<br />
            Support: <a href="mailto:${smtpUser}" style="color: #d97706; text-decoration: none;">${smtpUser}</a> | Tel: +237 683 316 486
          </p>
          <p style="margin: 0; font-size: 11px; color: #94a3b8;">
            ${params.footerNote || 'This is an automated notification from the MADECC GROUP Central Portal. You are receiving this because of an interaction on madeccgroup.online.'}
          </p>
        </div>
      </div>
    </div>
  `;
}

