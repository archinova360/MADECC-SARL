export async function sendEmail(to: string, subject: string, text: string, html?: string, options?: any): Promise<boolean> {
  console.log(`[EMAIL_DISPATCH] To: ${to} | Subject: ${subject}`);
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'MADECC Group <notifications@madeccgroup.online>',
          to: [to],
          reply_to: options?.replyTo,
          subject,
          text,
          html: html || `<p>${text}</p>`
        })
      });
      return true;
    }
  } catch (err) {
    console.error('[EMAIL_SEND_FAILED]', err);
  }
  return true;
}

export async function sendNotificationEmail(subject: string, text: string, html?: string, options?: any): Promise<boolean> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'kreboya603@gmail.com';
  return sendEmail(adminEmail, subject, text, html, options);
}
