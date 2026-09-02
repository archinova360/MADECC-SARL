import express from 'express';
import { db } from '../../db/index.ts';
import { quoteRequests, quoteRequestDocuments, projects, reviews, staffNotifications } from '../../db/schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin, requireStaffOrAdmin } from '../../middleware/auth.ts';
import { sendNotificationEmail, sendEmail } from '../../lib/email.ts';
import { logAudit } from '../../lib/audit.ts';
import crypto from 'crypto';

interface AntiBotChallengeRecord {
  challengeId: string;
  equation: string;
  expectedAnswer: number;
  createdAt: number;
  expiresAt: number;
  consumed: boolean;
  attempts: number;
  isVerified: boolean;
}

const antiBotChallenges = new Map<string, AntiBotChallengeRecord>();
const challengeRateLimiter = new Map<string, { count: number; resetAt: number }>();

function rateLimitChallenge(req: any, res: any, next: any) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 30;
  const current = challengeRateLimiter.get(ip);
  if (!current || now > current.resetAt) {
    challengeRateLimiter.set(ip, { count: 1, resetAt: now + windowMs });
    return next();
  }
  if (current.count >= maxRequests) {
    return res.status(429).json({ error: 'Too many verification requests. Please try again in a minute.' });
  }
  current.count++;
  next();
}

function buildQuoteRequestAdminHtml(qr: any, servicesList: string, submittedDateStr: string) {
    const adminSubject = `New Construction Quote Request -- ${qr.referenceNumber}`;
    return {
      adminSubject,
      adminText: `
New Construction Quote Request Received
Reference: ${qr.referenceNumber}
Client: ${qr.clientName} (${qr.clientCompany || 'Individual'})
Email: ${qr.clientEmail}
Phone: ${qr.clientPhone}
WhatsApp: ${qr.whatsappNumber || 'N/A'}
Preferred Contact: ${qr.preferredContactMethod || 'WhatsApp'} (${qr.preferredContactTime || 'Any time'})

Project Name: ${qr.projectName}
Project Type: ${qr.projectType}
Services Requested: ${servicesList}
Building Type: ${qr.buildingType || 'N/A'} (${qr.storeys || 1} Storeys)
Floor Area: ${qr.floorArea || 'N/A'} ${qr.floorAreaUnit || 'm2'}
Location: ${qr.region} Region (${qr.city || 'N/A'}, ${qr.neighborhood || 'N/A'})
Address: ${qr.siteAddress || 'N/A'}

Budget: ${qr.budgetRangeText || (qr.budgetMin && qr.budgetMax ? `${qr.budgetMin} - ${qr.budgetMax} ${qr.budgetCurrency}` : 'To be specified')}
Project Stage: ${qr.projectStage || 'N/A'}
Site Status: ${qr.siteStatus || 'N/A'}
Desired Start: ${qr.desiredStartDate ? new Date(qr.desiredStartDate).toLocaleDateString() : 'Immediate'}
Urgency: ${qr.urgency || 'Standard'}

Description / Notes:
${qr.projectDescription || qr.additionalNotes || 'None provided'}

Submitted: ${submittedDateStr}
Source: ${qr.source || 'Website Direct'}
      `.trim(),
      adminHtml: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${adminSubject}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px;">
          <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            
            <div style="background-color: #0f172a; padding: 28px 32px; border-bottom: 4px solid #d97706;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="color: #d97706; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase;">MADECC GROUP PORTAL</span>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 6px 0 0 0;">New Construction Quote Request</h1>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="background: rgba(217,119,6,0.2); border: 1px solid #d97706; color: #fbbf24; padding: 6px 12px; border-radius: 8px; font-family: monospace; font-size: 13px; font-weight: 700;">
                      ${qr.referenceNumber}
                    </span>
                  </td>
                </tr>
              </table>
            </div>

            <div style="padding: 32px;">
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; border-left: 4px solid #2563eb;">
                <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #334155;">
                  A new project intake submission has been recorded in the live Neon database. Review specifications below and reach out via the client's preferred contact method.
                </p>
              </div>

              <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 14px;">
                Client Information
              </h2>
              <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
                <tr><td width="35%" style="color: #64748b; font-weight: 600;">Client Name:</td><td width="65%" style="color: #0f172a; font-weight: 700;">${qr.clientName}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Company / Org:</td><td style="color: #0f172a;">${qr.clientCompany || 'Individual / N/A'}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Email Address:</td><td style="color: #2563eb; font-weight: 600;"><a href="mailto:${qr.clientEmail}" style="color: #2563eb; text-decoration: underline;">${qr.clientEmail}</a></td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Phone Number:</td><td style="color: #0f172a;">${qr.clientPhone}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">WhatsApp Number:</td><td style="color: #0f172a;">${qr.whatsappNumber || qr.clientPhone}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Preferred Contact:</td><td style="color: #0f172a;">${qr.preferredContactMethod || 'WhatsApp'} (${qr.preferredContactTime || 'Any time'})</td></tr>
              </table>

              <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 14px;">
                Project Specifications
              </h2>
              <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
                <tr><td width="35%" style="color: #64748b; font-weight: 600;">Project Title:</td><td width="65%" style="color: #0f172a; font-weight: 700;">${qr.projectName}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Project Category:</td><td style="color: #0f172a;">${qr.projectType}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Services Requested:</td><td style="color: #d97706; font-weight: 700;">${servicesList}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Building Type:</td><td style="color: #0f172a;">${qr.buildingType || 'N/A'} (${qr.storeys || 1} Storeys)</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Floor Area:</td><td style="color: #0f172a;">${qr.floorArea || 'N/A'} ${qr.floorAreaUnit || 'm2'}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Location:</td><td style="color: #0f172a;">${qr.region} Region (${qr.city || 'N/A'}${qr.neighborhood ? ', ' + qr.neighborhood : ''})</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Site Address:</td><td style="color: #0f172a;">${qr.siteAddress || 'N/A'}</td></tr>
              </table>

              <h2 style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; padding-bottom: 6px; margin-top: 0; margin-bottom: 14px;">
                Budget & Schedule
              </h2>
              <table width="100%" cellpadding="5" cellspacing="0" style="font-size: 13px; line-height: 1.6; margin-bottom: 20px;">
                <tr><td width="35%" style="color: #64748b; font-weight: 600;">Budget Range:</td><td width="65%" style="color: #059669; font-weight: 800;">${qr.budgetRangeText || (qr.budgetMin && qr.budgetMax ? `${qr.budgetMin} - ${qr.budgetMax} ${qr.budgetCurrency}` : 'To be specified')}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Project Readiness:</td><td style="color: #0f172a;">${qr.projectStage || 'N/A'}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Site Status:</td><td style="color: #0f172a;">${qr.siteStatus || 'N/A'}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Desired Start Date:</td><td style="color: #0f172a;">${qr.desiredStartDate ? new Date(qr.desiredStartDate).toLocaleDateString() : 'Immediate / Flexible'}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Urgency Level:</td><td style="color: #0f172a; font-weight: 700;">${qr.urgency || 'Standard'}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Submission Date:</td><td style="color: #0f172a;">${submittedDateStr}</td></tr>
                <tr><td style="color: #64748b; font-weight: 600;">Intake Channel:</td><td style="color: #0f172a;">${qr.source || 'Website Direct'}</td></tr>
              </table>

              ${(qr.projectDescription || qr.additionalNotes) ? `
              <div style="background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 14px; margin-bottom: 20px;">
                <strong style="display: block; color: #0f172a; font-size: 11px; text-transform: uppercase; margin-bottom: 6px;">Client Description & Scope Notes:</strong>
                <p style="margin: 0; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${qr.projectDescription || qr.additionalNotes}</p>
              </div>
              ` : ''}

              <div style="text-align: center; margin: 28px 0 12px 0;">
                <a href="${process.env.APP_URL || 'https://madeccgroup.online'}/#admin" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 8px; border: 1px solid #d97706;">
                  View Request in Admin Dashboard &rarr;
                </a>
              </div>
            </div>

            <div style="background-color: #f1f5f9; padding: 18px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">
              MADECC GROUP &bull; B.P. 15421 Douala &amp; Yaounde, Republic of Cameroon<br/>
              Civil Engineering, Technical Audits &amp; Construction Management
            </div>
          </div>
        </body>
        </html>
      `.trim()
    };
  }

  function buildQuoteRequestClientHtml(qr: any, servicesList: string, submittedDateStr: string) {
    const clientSubject = `MADECC GROUP -- Project Enquiry Received -- ${qr.referenceNumber}`;
    const clientText = `Dear ${qr.clientName},\n\nThank you for reaching out to MADECC GROUP. We have successfully received your project inquiry (${qr.referenceNumber}) for "${qr.projectName}".\n\nOur engineering and quantity surveying team is reviewing your specifications and will respond within 24-48 business hours.\n\nWarm regards,\nMADECC GROUP Engineering & Construction Team`;
    const clientHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"/><title>${clientSubject}</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background: #0f172a; padding: 28px 32px; color: #ffffff;">
            <span style="color: #d97706; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">MADECC GROUP CONFIRMATION</span>
            <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 6px 0 0 0;">Project Enquiry Received</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Reference: <strong style="color: #fbbf24; font-family: monospace;">${qr.referenceNumber}</strong></p>
          </div>
          <div style="padding: 32px;">
            <p style="font-size: 15px; line-height: 1.6; margin-top: 0;">Dear <strong>${qr.clientName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Thank you for submitting your project requirements to MADECC GROUP. We have successfully registered your inquiry in our system.
            </p>
            <div style="background-color: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <h3 style="font-size: 13px; font-weight: 700; margin: 0 0 10px 0; color: #0f172a; text-transform: uppercase;">Inquiry Summary</h3>
              <table width="100%" style="font-size: 13px; line-height: 1.6;">
                <tr><td width="40%" style="color: #64748b;">Project Title:</td><td style="font-weight: 600; color: #0f172a;">${qr.projectName}</td></tr>
                <tr><td style="color: #64748b;">Category:</td><td style="color: #0f172a;">${qr.projectType}</td></tr>
                <tr><td style="color: #64748b;">Services:</td><td style="color: #d97706; font-weight: 600;">${servicesList}</td></tr>
                <tr><td style="color: #64748b;">Submitted On:</td><td style="color: #0f172a;">${submittedDateStr}</td></tr>
              </table>
            </div>
            <p style="font-size: 14px; line-height: 1.6; color: #334155;">
              Our Quantity Surveying and Civil Engineering team is currently reviewing your project details. A dedicated technical consultant will contact you via <strong>${qr.preferredContactMethod || 'WhatsApp / Email'}</strong> within <strong>24 to 48 business hours</strong>.
            </p>
            <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 0;">
              Best regards,<br/>
              <strong>MADECC GROUP Technical Estimation Team</strong><br/>
              <span style="font-size: 12px; color: #64748b;">Douala & Yaounde, Republic of Cameroon</span>
            </p>
          </div>
        </div>
      </body>
      </html>
    `.trim();
    return {
      clientSubject,
      clientText,
      clientHtml
    };
  }

  function generateAntiBotChallenge(): { challengeId: string; equation: string; expiresAt: string } {
    const challengeId = `CHAL-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    // User-specified Anti-Bot challenge: 15x + 5x - 10 = 90 -> 20x = 100 -> x = 5
    const equation = '15x + 5x - 10 = 90';
    const x = 5;
    const now = Date.now();
    const expiresAtMs = now + 10 * 60 * 1000; // 10 minutes

    const record: AntiBotChallengeRecord = {
      challengeId,
      equation,
      expectedAnswer: x,
      createdAt: now,
      expiresAt: expiresAtMs,
      consumed: false,
      attempts: 0,
      isVerified: false
    };

    antiBotChallenges.set(challengeId, record);

    return {
      challengeId,
      equation,
      expiresAt: new Date(expiresAtMs).toISOString()
    };
  }

export function setupQuotesRoutes(app: express.Express) {
  // GET /api/quote-requests/challenge
  const handleGetChallenge = (req: any, res: any) => {
    try {
      const challenge = generateAntiBotChallenge();
      // DO NOT return expectedAnswer to client
      return res.json({
        success: true,
        challengeId: challenge.challengeId,
        equation: challenge.equation,
        expiresAt: challenge.expiresAt
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to generate human verification challenge.' });
    }
  };

  app.get('/api/quote-requests/challenge', rateLimitChallenge, handleGetChallenge);
  app.get('/api/public/quote-requests/challenge', rateLimitChallenge, handleGetChallenge);

  // POST /api/quote-requests/verify-challenge
  const handleVerifyChallenge = (req: any, res: any) => {
    try {
      const { challengeId, challengeAnswer } = req.body || {};

      if (!challengeId) {
        return res.status(400).json({ error: 'Missing challenge ID. Please refresh and try again.' });
      }

      const record = antiBotChallenges.get(challengeId);
      if (!record) {
        return res.status(400).json({ error: 'Invalid verification challenge. Please request a new verification challenge.' });
      }

      if (Date.now() > record.expiresAt) {
        return res.status(400).json({ error: 'This verification has expired. Please generate a new verification challenge.', expired: true });
      }

      if (record.consumed) {
        return res.status(400).json({ error: 'This verification challenge has already been used. Please request a new challenge.', consumed: true });
      }

      if (record.attempts >= 4) {
        return res.status(400).json({ error: 'For security reasons, please request a new verification challenge.', maxAttemptsExceeded: true });
      }

      record.attempts++;

      if (challengeAnswer === undefined || challengeAnswer === null || String(challengeAnswer).trim() === '') {
        return res.status(400).json({ error: 'Please enter the value of x.' });
      }

      const parsedAnswer = parseFloat(String(challengeAnswer).trim());
      if (isNaN(parsedAnswer) || Math.abs(parsedAnswer - record.expectedAnswer) >= 0.001) {
        return res.status(400).json({ error: 'Incorrect answer. Please try again.' });
      }

      record.isVerified = true;
      return res.json({
        success: true,
        message: 'Human verification completed',
        challengeId: record.challengeId
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'We could not verify your submission. Please refresh the verification challenge and try again.' });
    }
  };

  app.post('/api/quote-requests/verify-challenge', rateLimitChallenge, handleVerifyChallenge);
  app.post('/api/public/quote-requests/verify-challenge', rateLimitChallenge, handleVerifyChallenge);

  // --- QUOTE REQUESTS & INTAKE SYSTEM ENDPOINTS ---
  // ==========================================

  // Schema auto-migration guard for quote requests in Neon PostgreSQL database
  const ensureQuoteRequestsTables = async () => {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS quote_requests (
          id SERIAL PRIMARY KEY,
          reference_number TEXT NOT NULL UNIQUE,
          user_id INTEGER,
          client_name TEXT NOT NULL,
          client_company TEXT,
          client_email TEXT NOT NULL,
          client_phone TEXT NOT NULL,
          whatsapp_number TEXT,
          preferred_contact_method TEXT DEFAULT 'WhatsApp',
          preferred_contact_time TEXT DEFAULT 'Any time',
          project_type TEXT NOT NULL,
          services_requested JSONB NOT NULL,
          region TEXT NOT NULL,
          division TEXT,
          subdivision TEXT,
          city TEXT,
          neighborhood TEXT,
          site_address TEXT,
          latitude NUMERIC,
          longitude NUMERIC,
          project_name TEXT NOT NULL,
          project_description TEXT,
          building_type TEXT,
          storeys INTEGER DEFAULT 1,
          floor_area NUMERIC,
          floor_area_unit TEXT DEFAULT 'm2',
          site_status TEXT,
          project_stage TEXT,
          budget_currency TEXT DEFAULT 'XAF',
          budget_min NUMERIC,
          budget_max NUMERIC,
          budget_range_text TEXT,
          desired_start_date TIMESTAMP,
          expected_completion_date TIMESTAMP,
          urgency TEXT DEFAULT 'Standard',
          additional_notes TEXT,
          source TEXT DEFAULT 'Website Direct',
          source_metadata JSONB,
          status TEXT DEFAULT 'NEW' NOT NULL,
          priority TEXT DEFAULT 'NORMAL' NOT NULL,
          assigned_to INTEGER,
          internal_notes TEXT,
          activity_timeline JSONB,
          converted_project_id INTEGER,
          converted_boq_id INTEGER,
          converted_estimate_id INTEGER,
          admin_notification_status TEXT DEFAULT 'PENDING',
          client_confirmation_status TEXT DEFAULT 'PENDING',
          admin_notification_sent_at TIMESTAMP,
          client_confirmation_sent_at TIMESTAMP,
          email_error TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        -- ALTER TABLE statements to guarantee all columns exist if table pre-existed
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS reference_number TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS user_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_name TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_company TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_email TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_phone TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'WhatsApp';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT DEFAULT 'Any time';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_type TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS services_requested JSONB;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS region TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS division TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS subdivision TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS city TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS neighborhood TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS site_address TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS latitude NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS longitude NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_name TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_description TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS building_type TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS storeys INTEGER DEFAULT 1;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS floor_area NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS floor_area_unit TEXT DEFAULT 'm2';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS site_status TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_stage TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'XAF';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_min NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_max NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_range_text TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS desired_start_date TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS expected_completion_date TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'Standard';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS additional_notes TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Website Direct';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS source_metadata JSONB;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NEW';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS assigned_to INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS internal_notes TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS activity_timeline JSONB;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS converted_project_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS converted_boq_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS converted_estimate_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS admin_notification_status TEXT DEFAULT 'PENDING';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_confirmation_status TEXT DEFAULT 'PENDING';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS admin_notification_sent_at TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_confirmation_sent_at TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS email_error TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

        CREATE TABLE IF NOT EXISTS quote_request_documents (
          id SERIAL PRIMARY KEY,
          quote_request_id INTEGER REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT,
          file_size INTEGER,
          uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS quote_request_id INTEGER;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_type TEXT;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT NOW();
      `);
    } catch (err) {
      console.error('[SCHEMA_GUARD] Error ensuring quote_requests tables exist:', err);
    }
  };

  async function sendQuoteRequestEmails(quoteRequestId: number, target: 'admin' | 'client' | 'both' = 'both') {
    try {
      await ensureQuoteRequestsTables();
      const records = await db.select().from(quoteRequests).where(eq(quoteRequests.id, quoteRequestId));
      if (records.length === 0) throw new Error('Quote request not found');

      const qr = records[0];
      const adminEmailRecipient = process.env.ADMIN_EMAIL || 'kreboya603@gmail.com';
      const servicesList = Array.isArray(qr.servicesRequested) ? (qr.servicesRequested as string[]).join(', ') : String(qr.servicesRequested || 'General Construction');
      const submittedDateStr = new Date(qr.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      let adminStatus = qr.adminNotificationStatus || 'PENDING';
      let clientStatus = qr.clientConfirmationStatus || 'PENDING';
      let adminSentAt = qr.adminNotificationSentAt ? new Date(qr.adminNotificationSentAt) : null;
      let clientSentAt = qr.clientConfirmationSentAt ? new Date(qr.clientConfirmationSentAt) : null;
      let emailErrorMsg = qr.emailError || null;

      let timeline = Array.isArray(qr.activityTimeline) ? [...(qr.activityTimeline as any[])] : [];

      const adminEmailData = buildQuoteRequestAdminHtml(qr, servicesList, submittedDateStr);
      const clientEmailData = buildQuoteRequestClientHtml(qr, servicesList, submittedDateStr);

      let errorsList: string[] = [];

      // 1. Send Admin Email Notification
      if (target === 'admin' || target === 'both') {
        try {
          await sendNotificationEmail(adminEmailData.adminSubject, adminEmailData.adminText, adminEmailData.adminHtml, { replyTo: qr.clientEmail });
          adminStatus = 'SENT';
          adminSentAt = new Date();
          timeline.push({
            date: new Date().toISOString(),
            action: 'ADMIN_NOTIFICATION_SENT',
            user: 'SMTP System',
            details: `Notification email successfully dispatched to admin recipient (${adminEmailRecipient}).`
          });
        } catch (err: any) {
          adminStatus = 'FAILED';
          const errMsg = `Admin notification failed: ${err.message || String(err)}`;
          errorsList.push(errMsg);
          timeline.push({
            date: new Date().toISOString(),
            action: 'ADMIN_NOTIFICATION_FAILED',
            user: 'SMTP System',
            details: errMsg
          });
        }
      }

      // 2. Send Client Confirmation Email
      if (target === 'client' || target === 'both') {
        try {
          await sendEmail(qr.clientEmail, clientEmailData.clientSubject, clientEmailData.clientText, clientEmailData.clientHtml, { replyTo: adminEmailRecipient });
          clientStatus = 'SENT';
          clientSentAt = new Date();
          timeline.push({
            date: new Date().toISOString(),
            action: 'CLIENT_CONFIRMATION_SENT',
            user: 'SMTP System',
            details: `Confirmation email successfully dispatched to client (${qr.clientEmail}).`
          });
        } catch (err: any) {
          clientStatus = 'FAILED';
          const errMsg = `Client confirmation failed: ${err.message || String(err)}`;
          errorsList.push(errMsg);
          timeline.push({
            date: new Date().toISOString(),
            action: 'CLIENT_CONFIRMATION_FAILED',
            user: 'SMTP System',
            details: errMsg
          });
        }
      }

      emailErrorMsg = errorsList.length > 0 ? errorsList.join(' | ') : null;

      // Persist status and timeline in Neon DB
      await db.update(quoteRequests)
        .set({
          adminNotificationStatus: adminStatus,
          clientConfirmationStatus: clientStatus,
          adminNotificationSentAt: adminSentAt,
          clientConfirmationSentAt: clientSentAt,
          emailError: emailErrorMsg,
          activityTimeline: timeline,
          updatedAt: new Date()
        })
        .where(eq(quoteRequests.id, quoteRequestId));

      return {
        adminStatus,
        clientStatus,
        adminSentAt,
        clientSentAt,
        emailError: emailErrorMsg,
        adminSubject: adminEmailData.adminSubject,
        adminHtml: adminEmailData.adminHtml,
        clientSubject: clientEmailData.clientSubject,
        clientHtml: clientEmailData.clientHtml
      };
    } catch (outerErr: any) {
      console.error('[QUOTE_EMAIL_DISPATCH_ERROR]', outerErr);
      return {
        adminStatus: 'FAILED',
        clientStatus: 'FAILED',
        emailError: outerErr.message || String(outerErr)
      };
    }
  }

  // Submission Route Handler Function
  const handleQuoteSubmission = async (req: any, res: any) => {
    try {
      await ensureQuoteRequestsTables();
      const {
        clientName,
        clientCompany,
        clientEmail,
        clientPhone,
        whatsappNumber,
        preferredContactMethod,
        preferredContactTime,
        projectType,
        servicesRequested,
        region,
        division,
        subdivision,
        city,
        neighborhood,
        siteAddress,
        latitude,
        longitude,
        projectName,
        projectDescription,
        buildingType,
        storeys,
        floorArea,
        floorAreaUnit,
        siteStatus,
        projectStage,
        budgetCurrency,
        budgetMin,
        budgetMax,
        budgetRangeText,
        desiredStartDate,
        expectedCompletionDate,
        urgency,
        additionalNotes,
        source,
        sourceMetadata,
        documents,
        website,
        honeypot,
        challengeId,
        challengeAnswer
      } = req.body;

      // 1. Honeypot check
      if ((website && String(website).trim() !== '') || (honeypot && String(honeypot).trim() !== '')) {
        return res.status(400).json({ error: 'Automated submission detected.' });
      }

      // 2. Anti-Bot Challenge Server Validation
      if (!challengeId) {
        return res.status(400).json({ error: 'Verification required. Please complete the human verification challenge.' });
      }

      const challengeRecord = antiBotChallenges.get(challengeId);
      if (!challengeRecord) {
        return res.status(400).json({ error: 'We could not verify your submission. Please refresh the verification challenge and try again.' });
      }

      if (Date.now() > challengeRecord.expiresAt) {
        return res.status(400).json({ error: 'This verification has expired. Please generate a new verification challenge.' });
      }

      if (challengeRecord.consumed) {
        return res.status(400).json({ error: 'This verification challenge has already been used. Please request a new verification challenge.' });
      }

      if (challengeRecord.attempts >= 5) {
        return res.status(400).json({ error: 'For security reasons, please request a new verification challenge.' });
      }

      // Validate challenge answer
      const parsedAns = parseFloat(String(challengeAnswer || '').trim());
      if (isNaN(parsedAns) || Math.abs(parsedAns - challengeRecord.expectedAnswer) >= 0.001) {
        challengeRecord.attempts++;
        return res.status(400).json({ error: 'Verification failed. Please solve the equation and try again.' });
      }

      // Single-use challenge: mark consumed
      challengeRecord.consumed = true;
      challengeRecord.isVerified = true;

      if (!clientName || !clientEmail || !clientPhone || !projectType || !projectName || !region) {
        return res.status(400).json({ error: 'Missing required client or project fields.' });
      }

      // Check for duplicate rapid re-submission (same email, same project name within last 30s)
      const recentDuplicates = await db.select().from(quoteRequests).where(and(
        eq(quoteRequests.clientEmail, clientEmail.trim()),
        eq(quoteRequests.projectName, projectName.trim())
      )).orderBy(desc(quoteRequests.createdAt)).limit(1);

      if (recentDuplicates.length > 0) {
        const diffMs = Date.now() - new Date(recentDuplicates[0].createdAt).getTime();
        if (diffMs < 30000) { // 30 seconds threshold
          return res.status(200).json({
            success: true,
            duplicatePrevented: true,
            referenceNumber: recentDuplicates[0].referenceNumber,
            quoteRequestId: recentDuplicates[0].id,
            message: 'Your project enquiry has already been submitted and logged.'
          });
        }
      }

      // Generate unique reference e.g. MADECC-REQ-2026-0042
      const dateYear = new Date().getFullYear();
      const countRes = await db.select({ count: sql<number>`count(*)` }).from(quoteRequests);
      const seq = Number(countRes[0]?.count || 0) + 1;
      const refNum = `MADECC-REQ-${dateYear}-${String(seq).padStart(4, '0')}`;

      const initialTimeline = [
        {
          date: new Date().toISOString(),
          action: 'REQUEST_SUBMITTED',
          user: 'Client',
          details: `Enquiry submitted via MADECC intake system (${source || 'Website Direct'}). Human verification passed.`
        }
      ];

      const securityMeta = JSON.stringify({
        humanVerification: 'PASSED',
        verifiedAt: new Date().toISOString(),
        challengeId: challengeRecord.challengeId
      });
      const recordedSourceMetadata = sourceMetadata ? `${sourceMetadata} | ${securityMeta}` : securityMeta;

      const inserted = await db.insert(quoteRequests).values({
        referenceNumber: refNum,
        clientName: clientName.trim(),
        clientCompany: clientCompany ? clientCompany.trim() : null,
        clientEmail: clientEmail.trim(),
        clientPhone: clientPhone.trim(),
        whatsappNumber: whatsappNumber ? whatsappNumber.trim() : (clientPhone ? clientPhone.trim() : null),
        preferredContactMethod: preferredContactMethod || 'WhatsApp',
        preferredContactTime: preferredContactTime || 'Any time',
        projectType,
        servicesRequested: servicesRequested && Array.isArray(servicesRequested) ? servicesRequested : [servicesRequested || 'General Construction'],
        region,
        division: division || null,
        subdivision: subdivision || null,
        city: city || null,
        neighborhood: neighborhood || null,
        siteAddress: siteAddress || null,
        latitude: latitude ? String(latitude) : null,
        longitude: longitude ? String(longitude) : null,
        projectName: projectName.trim(),
        projectDescription: projectDescription || null,
        buildingType: buildingType || null,
        storeys: storeys ? Number(storeys) : 1,
        floorArea: floorArea ? String(floorArea) : null,
        floorAreaUnit: floorAreaUnit || 'm2',
        siteStatus: siteStatus || null,
        projectStage: projectStage || null,
        budgetCurrency: budgetCurrency || 'XAF',
        budgetMin: budgetMin ? String(budgetMin) : null,
        budgetMax: budgetMax ? String(budgetMax) : null,
        budgetRangeText: budgetRangeText || null,
        desiredStartDate: desiredStartDate ? new Date(desiredStartDate) : null,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
        urgency: urgency || 'Standard',
        additionalNotes: additionalNotes || null,
        source: source || 'Website Direct',
        sourceMetadata: recordedSourceMetadata,
        status: 'NEW',
        priority: 'NORMAL',
        adminNotificationStatus: 'PENDING',
        clientConfirmationStatus: 'PENDING',
        activityTimeline: initialTimeline
      }).returning();

      const createdRequest = inserted[0];

      // Save documents if attached
      if (documents && Array.isArray(documents) && documents.length > 0) {
        for (const doc of documents) {
          if (doc.fileName && doc.fileUrl) {
            await db.insert(quoteRequestDocuments).values({
              quoteRequestId: createdRequest.id,
              fileName: doc.fileName,
              fileUrl: doc.fileUrl,
              fileType: doc.fileType || 'application/pdf',
              fileSize: doc.fileSize ? Number(doc.fileSize) : 0
            });
          }
        }
      }

      // Non-blocking: Trigger SMTP Email Service
      sendQuoteRequestEmails(createdRequest.id, 'both').catch(err => {
        console.error('[ASYNC_QUOTE_EMAIL_ERROR]', err);
      });

      // Non-blocking: Create Staff In-App Notification
      try {
        await db.insert(staffNotifications).values({
          employeeNumber: 'ALL',
          title: `New Quote Request: ${refNum}`,
          message: `${clientName} submitted a quote request for "${projectName}" (${projectType}) in ${region}.`,
          category: 'SYSTEM',
          actionUrl: `/#admin`
        });
      } catch (notifErr) {
        console.warn('Failed to insert in-app staff notification:', notifErr);
      }

      res.status(201).json({
        success: true,
        referenceNumber: refNum,
        quoteRequestId: createdRequest.id,
        message: 'Your project enquiry has been received successfully.'
      });
    } catch (error: any) {
      console.error('Error submitting quote request:', error);
      res.status(500).json({ error: error.message });
    }
  };

  // Register public and standard intake endpoints
  app.post('/api/public/quote-requests', handleQuoteSubmission);
  app.post('/api/quote-requests', handleQuoteSubmission);

  // Admin: Resend Quote Request Email
  app.post('/api/quote-requests/:id/resend-email', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureQuoteRequestsTables();
      const id = Number(req.params.id);
      const { target } = req.body; // 'admin' | 'client' | 'both'
      const validTarget = target === 'admin' || target === 'client' ? target : 'both';

      const records = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
      if (records.length === 0) return res.status(404).json({ error: 'Quote request not found' });

      const emailResult = await sendQuoteRequestEmails(id, validTarget);
      const updated = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));

      const reqAny = req as any;
      if (reqAny.dbUser) {
        await logAudit(reqAny.dbUser.uid, reqAny.dbUser.email, 'RESEND_QUOTE_EMAIL', `Resent ${validTarget} email for ${records[0].referenceNumber}`);
      }

      res.json({
        success: true,
        message: `Email dispatch completed for target: ${validTarget}`,
        quoteRequest: updated[0],
        emailResult
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Email Preview HTML Endpoint
  app.get('/api/quote-requests/:id/email-preview', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureQuoteRequestsTables();
      const id = Number(req.params.id);
      const records = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
      if (records.length === 0) return res.status(404).json({ error: 'Quote request not found' });

      const qr = records[0];
      const servicesList = Array.isArray(qr.servicesRequested) ? (qr.servicesRequested as string[]).join(', ') : String(qr.servicesRequested || 'General Construction');
      const submittedDateStr = new Date(qr.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

      const adminEmailData = buildQuoteRequestAdminHtml(qr, servicesList, submittedDateStr);
      const clientEmailData = buildQuoteRequestClientHtml(qr, servicesList, submittedDateStr);

      res.json({
        referenceNumber: qr.referenceNumber,
        adminSubject: adminEmailData.adminSubject,
        adminHtml: adminEmailData.adminHtml,
        clientSubject: clientEmailData.clientSubject,
        clientHtml: clientEmailData.clientHtml
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public: Check status by reference number
  app.get('/api/public/quote-requests/status/:ref', async (req, res) => {
    try {
      await ensureQuoteRequestsTables();
      const ref = req.params.ref.trim().toUpperCase();
      const records = await db.select().from(quoteRequests).where(eq(quoteRequests.referenceNumber, ref));
      if (records.length === 0) {
        return res.status(404).json({ error: 'Quote request reference not found.' });
      }
      const rec = records[0];
      res.json({
        referenceNumber: rec.referenceNumber,
        projectName: rec.projectName,
        clientName: rec.clientName,
        projectType: rec.projectType,
        servicesRequested: rec.servicesRequested,
        status: rec.status,
        createdAt: rec.createdAt,
        updatedAt: rec.updatedAt
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin/Staff: Get all quote requests
  app.get('/api/quote-requests', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureQuoteRequestsTables();
      const { status, region, search } = req.query;
      let allRequests = await db.select().from(quoteRequests).orderBy(desc(quoteRequests.createdAt));

      if (status && status !== 'ALL') {
        allRequests = allRequests.filter(r => r.status === String(status));
      }
      if (region && region !== 'ALL') {
        allRequests = allRequests.filter(r => r.region.toLowerCase() === String(region).toLowerCase());
      }
      if (search) {
        const s = String(search).toLowerCase();
        allRequests = allRequests.filter(r => 
          r.referenceNumber.toLowerCase().includes(s) ||
          r.clientName.toLowerCase().includes(s) ||
          r.clientEmail.toLowerCase().includes(s) ||
          r.clientPhone.toLowerCase().includes(s) ||
          r.projectName.toLowerCase().includes(s)
        );
      }

      res.json(allRequests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin/Staff: Get single request details with documents
  app.get('/api/quote-requests/:id', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureQuoteRequestsTables();
      const id = Number(req.params.id);
      const records = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
      if (records.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
      const reqData = records[0];
      const docs = await db.select().from(quoteRequestDocuments).where(eq(quoteRequestDocuments.quoteRequestId, id));

      res.json({
        ...reqData,
        documents: docs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin/Staff: Update request status / details / activity
  app.patch('/api/quote-requests/:id', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureQuoteRequestsTables();
      const id = Number(req.params.id);
      const { status, priority, assignedTo, internalNotes, actionNote } = req.body;

      const records = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
      if (records.length === 0) {
        return res.status(404).json({ error: 'Request not found' });
      }
      const current = records[0];

      let timeline = Array.isArray(current.activityTimeline) ? [...current.activityTimeline] : [];
      if (actionNote || status !== current.status) {
        timeline.push({
          date: new Date().toISOString(),
          action: status !== current.status ? 'STATUS_CHANGED' : 'NOTE_ADDED',
          user: (req as any).dbUser?.name || (req as any).dbUser?.email || 'Admin',
          details: actionNote || `Status updated from ${current.status} to ${status}`
        });
      }

      const updated = await db.update(quoteRequests)
        .set({
          status: status || current.status,
          priority: priority || current.priority,
          assignedTo: assignedTo !== undefined ? assignedTo : current.assignedTo,
          internalNotes: internalNotes !== undefined ? internalNotes : current.internalNotes,
          activityTimeline: timeline,
          updatedAt: new Date()
        })
        .where(eq(quoteRequests.id, id))
        .returning();

      if ((req as any).dbUser) {
        await logAudit((req as any).dbUser.uid, (req as any).dbUser.email, 'UPDATE_QUOTE_REQUEST', `Updated quote request ${current.referenceNumber} to status ${status || current.status}`);
      }

      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin/Staff: Convert Quote Request to Project
  app.post('/api/quote-requests/:id/convert-to-project', requireStaffOrAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const records = await db.select().from(quoteRequests).where(eq(quoteRequests.id, id));
      if (records.length === 0) return res.status(404).json({ error: 'Request not found' });
      
      const qr = records[0];

      // Insert into projects
      const newProj = await db.insert(projects).values({
        title: qr.projectName,
        description: qr.projectDescription || `Project generated from Quote Request ${qr.referenceNumber}. Client: ${qr.clientName}`,
        budget: qr.budgetMax || qr.budgetMin || '0',
        location: `${qr.region}${qr.city ? ', ' + qr.city : ''}`,
        status: 'planning',
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&q=80&w=1000'
      }).returning();

      const proj = newProj[0];

      // Update quote request status
      let timeline = Array.isArray(qr.activityTimeline) ? [...qr.activityTimeline] : [];
      timeline.push({
        date: new Date().toISOString(),
        action: 'CONVERTED_TO_PROJECT',
        user: (req as any).dbUser?.name || (req as any).dbUser?.email || 'Admin',
        details: `Converted request to official project ID #${proj.id} (${proj.title}).`
      });

      await db.update(quoteRequests).set({
        status: 'WON',
        convertedProjectId: proj.id,
        activityTimeline: timeline,
        updatedAt: new Date()
      }).where(eq(quoteRequests.id, id));

      if ((req as any).dbUser) {
        await logAudit((req as any).dbUser.uid, (req as any).dbUser.email, 'CONVERT_QUOTE_REQUEST_TO_PROJECT', `Converted ${qr.referenceNumber} to Project #${proj.id}`);
      }

      res.json({ success: true, project: proj });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



  // Public: Approved reviews only
  app.get('/api/reviews', async (req, res) => {
    try {
      const approvedReviews = await db.select().from(reviews).where(eq(reviews.approved, true)).orderBy(desc(reviews.createdAt));
      res.json(approvedReviews);
    } catch (error: any) {
      console.warn('[DB Fallback] /api/reviews:', error.message || error);
      res.json([]);
    }
  });

  // Admin: All reviews
  app.get('/api/reviews/all', requireAdmin, async (req, res) => {
    try {
      const allReviews = await db.select().from(reviews).orderBy(desc(reviews.createdAt));
      res.json(allReviews);
    } catch (error: any) {
      console.warn('[DB Fallback] /api/reviews/all:', error.message || error);
      res.json([]);
    }
  });

  // Public submission
  app.post('/api/reviews', async (req, res) => {
    const { authorName, rating, text, projectName } = req.body;
    if (!authorName || !rating || !text) {
      return res.status(400).json({ error: 'Missing review fields' });
    }
    try {
      const result = await db.insert(reviews).values({
        authorName,
        rating: parseInt(rating),
        text,
        projectName,
        approved: false, // approval flow gate
      }).returning();

      // Send SMTP email notification to kreboya603@gmail.com
      const ratingStars = '*'.repeat(parseInt(rating)) + '*'.repeat(5 - parseInt(rating));
      const emailSubject = `[MADECC GROUP] New Client Review Pending Approval`;
      const emailText = `A new client review has been submitted on the website:\n\nAuthor: ${authorName}\nRating: ${rating} / 5\nProject: ${projectName || 'General'}\n\nReview:\n"${text}"\n\nPlease log in to the Admin Dashboard to approve this review.`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-top: 0; font-size: 22px;">New Client Review Submitted</h2>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Author Name:</strong> ${authorName}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Rating:</strong> <span style="color: #f59e0b; font-size: 18px;">${ratingStars}</span> (${rating}/5)</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Project Context:</strong> ${projectName || 'General / Not specified'}</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin: 20px 0; font-style: italic;">
            <p style="margin: 0; line-height: 1.6; color: #334155;">"${text}"</p>
          </div>
          <p style="font-size: 14px; color: #475569; margin-top: 20px;">Please access the MADECC administrative dashboard to review and approve this testimonial.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">MADECC GROUP Portal Notifications &bull; Cameroon</p>
        </div>
      `;
      sendNotificationEmail(emailSubject, emailText, emailHtml).catch(err => {
        console.error('Email notify error (reviews):', err);
      });

      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Approve review
  app.put('/api/reviews/:id/approve', requireAdmin, async (req: any, res) => {
    const reviewId = parseInt(req.params.id);
    const { approved } = req.body;
    try {
      const result = await db.update(reviews)
        .set({ 
          approved: approved === true, 
          approvedAt: approved ? new Date() : null 
        })
        .where(eq(reviews.id, reviewId))
        .returning();

      await logAudit(req.dbUser.uid, req.dbUser.email, 'APPROVE_REVIEW', `${approved ? 'Approved' : 'Unapproved'} review ID: ${reviewId}`);
      res.json(result[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/reviews/:id', requireAdmin, async (req: any, res) => {
    const reviewId = parseInt(req.params.id);
    try {
      const deleted = await db.delete(reviews).where(eq(reviews.id, reviewId)).returning();
      await logAudit(req.dbUser.uid, req.dbUser.email, 'DELETE_REVIEW', `Deleted review ID: ${reviewId}`);
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });



}
