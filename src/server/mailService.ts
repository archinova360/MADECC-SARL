import nodemailer from 'nodemailer';

export function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER || 'kreboya603@gmail.com';
  const pass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (!pass) {
    console.warn('[SMTP] Missing SMTP password (SMTP_PASS or SMTP_PASSWORD). Mail notifications will be output to console logs.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendNotificationEmail(
  subject: string, 
  text: string, 
  html: string,
  options?: { to?: string | string[]; replyTo?: string; cc?: string | string[]; bcc?: string | string[] }
) {
  const defaultAdmins = ['kreboya603@gmail.com', 'madeccco5@gmail.com'];
  const recipient = options?.to || (process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : defaultAdmins);
  const transporter = getTransporter();

  const recipientStr = Array.isArray(recipient) ? recipient.join(', ') : recipient;

  if (!transporter) {
    console.log(`\n==========================================\n[SMTP SIMULATION] Mail to ${recipientStr}:\nSubject: ${subject}\nBody:\n${text}\n==========================================\n`);
    return { simulated: true };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'kreboya603@gmail.com';
    const mailOpts: any = {
      from: `"MADECC Group Portal" <${fromAddress}>`,
      to: recipientStr,
      subject,
      text,
      html,
    };
    if (options?.replyTo) mailOpts.replyTo = options.replyTo;
    if (options?.cc) mailOpts.cc = Array.isArray(options.cc) ? options.cc.join(', ') : options.cc;
    if (options?.bcc) mailOpts.bcc = Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc;

    const info = await transporter.sendMail(mailOpts);
    console.log('[SMTP] Email sent successfully to ' + recipientStr + ':', info.messageId);
    return info;
  } catch (err) {
    console.error('[SMTP_ERROR] Failed to send email to ' + recipientStr + ':', err);
    throw err;
  }
}

export async function sendEmail(
  recipient: string, 
  subject: string, 
  text: string, 
  html: string,
  options?: { replyTo?: string; cc?: string | string[]; bcc?: string | string[] }
) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`\n==========================================\n[SMTP SIMULATION] Mail to ${recipient}:\nSubject: ${subject}\nBody:\n${text}\n==========================================\n`);
    return { simulated: true };
  }

  try {
    const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@madecc.com';
    const mailOpts: any = {
      from: `"MADECC Group" <${fromAddress}>`,
      to: recipient,
      subject,
      text,
      html,
    };
    if (options?.replyTo) mailOpts.replyTo = options.replyTo;
    if (options?.cc) mailOpts.cc = options.cc;
    if (options?.bcc) mailOpts.bcc = options.bcc;

    const info = await transporter.sendMail(mailOpts);
    console.log('[SMTP] Email sent successfully to ' + recipient + ':', info.messageId);
    return info;
  } catch (err) {
    console.error('[SMTP_ERROR] Failed to send email to ' + recipient + ':', err);
    throw err;
  }
}
