import express from 'express';
import crypto from 'crypto';
import { db } from '../../db/index.ts';
import { signedContracts, signedReceipts, exportHistoryLogs, projects, lessonPlans, drawingTakeoffs, companyDocuments, maintenanceSchedules, publicationHistory } from '../../db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { requireStaffOrAdmin } from '../../middleware/auth.ts';
import { sendNotificationEmail, sendEmail } from '../../lib/email.ts';
import { ensureCmsTables } from '../../db/ensureCmsTables.ts';
import { getActiveMaintenanceForPublic } from './cmsPublishingRoutes.ts';

let documentTablesChecked = false;
async function ensureDocumentTablesExist() {
  if (documentTablesChecked) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS signed_contracts (
        id SERIAL PRIMARY KEY,
        contract_no TEXT NOT NULL UNIQUE,
        client_name TEXT NOT NULL,
        client_niu TEXT,
        client_email TEXT,
        client_address TEXT,
        client_city TEXT,
        contract_project TEXT NOT NULL,
        contract_project_location TEXT,
        contract_value TEXT NOT NULL,
        contract_duration TEXT,
        contract_scope TEXT,
        contract_date TEXT,
        contract_agreed_balance TEXT,
        contract_advance_payment TEXT,
        representative_name TEXT,
        representative_title TEXT,
        signatory_title TEXT,
        typed_client_signature TEXT NOT NULL,
        drawn_client_signature TEXT,
        verification_token TEXT NOT NULL UNIQUE,
        signed_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS signed_receipts (
        id SERIAL PRIMARY KEY,
        receipt_no TEXT NOT NULL UNIQUE,
        client_name TEXT NOT NULL,
        client_niu TEXT,
        client_email TEXT,
        receipt_project TEXT NOT NULL,
        invoice_total_amount TEXT,
        receipt_amount TEXT NOT NULL,
        remaining_balance TEXT,
        receipt_tax_rate TEXT,
        currency TEXT DEFAULT 'XAF',
        receipt_method TEXT NOT NULL,
        receipt_memo TEXT,
        receipt_signatory TEXT NOT NULL,
        receipt_typed_sign TEXT NOT NULL,
        drawn_cfo_signature TEXT,
        verification_token TEXT NOT NULL UNIQUE,
        version INTEGER DEFAULT 1 NOT NULL,
        status TEXT DEFAULT 'ISSUED' NOT NULL,
        signed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS receipt_payment_requests (
        id TEXT PRIMARY KEY,
        receipt_no TEXT NOT NULL UNIQUE,
        is_paid BOOLEAN NOT NULL DEFAULT FALSE,
        status TEXT NOT NULL DEFAULT 'PENDING_ADMIN_CONFIRMATION',
        admin_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
        amount INTEGER NOT NULL DEFAULT 2199,
        currency TEXT NOT NULL DEFAULT 'XAF',
        payment_method TEXT NOT NULL DEFAULT 'MTN Mobile Money (671063511)',
        recipient_number TEXT NOT NULL DEFAULT '671063511',
        transaction_id TEXT NOT NULL,
        paid_at TEXT NOT NULL,
        payer_name TEXT NOT NULL DEFAULT 'Client',
        payer_phone TEXT NOT NULL DEFAULT '',
        client_email TEXT NOT NULL DEFAULT '',
        project_name TEXT NOT NULL DEFAULT 'MADECC Infrastructure Project',
        doc_type TEXT NOT NULL DEFAULT 'boq_receipt',
        domain_used TEXT NOT NULL DEFAULT 'https://madeccgroup.online',
        confirmed_at TEXT,
        confirmed_by TEXT,
        smtp_dispatched_to TEXT,
        smtp_dispatched_at TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    documentTablesChecked = true;
  } catch (err) {
    console.warn('[DB Init] Document tables check note:', err);
  }
}

let seededPaymentRequestsChecked = false;
async function ensureSeededPaymentRequests() {
  await ensureDocumentTablesExist();
  if (seededPaymentRequestsChecked) return;
  try {
    const countRes = await db.execute(sql`SELECT COUNT(*)::int AS cnt FROM receipt_payment_requests`);
    const cnt = Number((countRes.rows[0] as any)?.cnt || 0);
    if (cnt === 0) {
      const nowMinus15 = new Date(Date.now() - 1000 * 60 * 15).toISOString().replace('T', ' ').slice(0, 19);
      const nowMinus42 = new Date(Date.now() - 1000 * 60 * 42).toISOString().replace('T', ' ').slice(0, 19);
      await db.execute(sql`
        INSERT INTO receipt_payment_requests (
          id, receipt_no, is_paid, status, admin_confirmed, amount, currency,
          payment_method, recipient_number, transaction_id, paid_at,
          payer_name, payer_phone, client_email, project_name, doc_type, domain_used
        )
        VALUES
        (
          'PAY-REQ-1001', 'RCP-2026-0001', FALSE, 'PENDING_ADMIN_CONFIRMATION', FALSE, 2199, 'XAF',
          'MTN Mobile Money (671063511)', '671063511', 'TXN-MOMO-849201', ${nowMinus15},
          'Société Générale de Construction (SGC)', '677 412 890', 'direction@sgc-cameroun.cm',
          'R+4 Commercial Complex & BOQ Dossier — Douala Akwa', 'boq_receipt', 'https://madeccgroup.online'
        ),
        (
          'PAY-REQ-1002', 'RCP-PROP-2026-02', FALSE, 'PENDING_ADMIN_CONFIRMATION', FALSE, 2199, 'XAF',
          'Orange Money (689115595)', '689115595', 'TXN-OM-519034', ${nowMinus42},
          'Dr. Emmanuel Ndi & Associates', '699 104 522', 'emmanuel.ndi@cabinet-ndi.cm',
          'Yaoundé Mbankolo Duplex Villa — Certified Proposal & Receipt', 'proposal_receipt', 'https://madeccgroup.online'
        )
        ON CONFLICT (receipt_no) DO NOTHING
      `);
    }
    seededPaymentRequestsChecked = true;
  } catch (err) {
    console.warn('[DB Init] Seed payment requests note:', err);
  }
}

function formatPaymentRequestRow(r: any) {
  if (!r) return null;
  const amount = Number(r.amount || 0);
  const confirmedPaid = Boolean(
    r.is_paid === true &&
      r.admin_confirmed === true &&
      r.status === 'ADMIN_CONFIRMED' &&
      amount > 0
  );
  return {
    id: r.id,
    receiptNo: r.receipt_no,
    isPaid: confirmedPaid,
    status: confirmedPaid ? 'ADMIN_CONFIRMED' : (r.status === 'ADMIN_FREE_CLEARANCE' ? 'UNPAID' : r.status),
    adminConfirmed: confirmedPaid,
    amount,
    currency: r.currency || 'XAF',
    paymentMethod: r.payment_method,
    recipientNumber: r.recipient_number,
    transactionId: r.transaction_id,
    paidAt: r.paid_at,
    payerName: r.payer_name,
    payerPhone: r.payer_phone,
    clientEmail: r.client_email,
    projectName: r.project_name,
    docType: r.doc_type,
    domainUsed: r.domain_used,
    confirmedAt: r.confirmed_at || undefined,
    confirmedBy: r.confirmed_by || undefined,
    smtpDispatchedTo: r.smtp_dispatched_to || undefined,
    smtpDispatchedAt: r.smtp_dispatched_at || undefined
  };
}

export function setupDocumentRoutes(app: express.Express) {
  // ==========================================
  // --- CONTRACTS MANAGEMENT & SIGNING ---
  // ==========================================

  // 1. Get all saved contracts
  app.get('/api/contracts/all', async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const records = await db.select().from(signedContracts).orderBy(desc(signedContracts.signedAt));
      res.json(records);
    } catch (error: any) {
      console.warn('[DB Error] /api/contracts/all:', error.message || error);
      res.json([]);
    }
  });

  // 2. Sign / Register a contract
  app.post('/api/contracts/sign', async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const {
        contractNo,
        clientName,
        clientNiu,
        clientEmail,
        clientAddress,
        clientCity,
        contractProject,
        contractProjectLocation,
        contractValue,
        contractDuration,
        contractScope,
        contractDate,
        contractAgreedBalance,
        contractAdvancePayment,
        representativeName,
        representativeTitle,
        signatoryTitle,
        typedClientSignature,
        drawnClientSignature,
        verificationToken
      } = req.body;

      if (!contractNo || !clientName || !contractProject || !contractValue || !typedClientSignature) {
        return res.status(400).json({ error: 'Missing required contract signing fields.' });
      }

      const generatedToken = verificationToken || `CNT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Check if contract with this contractNo already exists
      const existing = await db.select().from(signedContracts).where(eq(signedContracts.contractNo, contractNo)).limit(1);

      let savedRecord;
      if (existing.length > 0) {
        const updated = await db.update(signedContracts)
          .set({
            clientName,
            clientNiu: clientNiu || null,
            clientEmail: clientEmail || null,
            clientAddress: clientAddress || null,
            clientCity: clientCity || null,
            contractProject,
            contractProjectLocation: contractProjectLocation || null,
            contractValue,
            contractDuration: contractDuration || null,
            contractScope: contractScope || null,
            contractDate: contractDate || null,
            contractAgreedBalance: contractAgreedBalance || null,
            contractAdvancePayment: contractAdvancePayment || null,
            representativeName: representativeName || null,
            representativeTitle: representativeTitle || null,
            signatoryTitle: signatoryTitle || null,
            typedClientSignature,
            drawnClientSignature: drawnClientSignature || null,
            verificationToken: generatedToken
          })
          .where(eq(signedContracts.id, existing[0].id))
          .returning();
        savedRecord = updated[0];
      } else {
        const inserted = await db.insert(signedContracts).values({
          contractNo,
          clientName,
          clientNiu: clientNiu || null,
          clientEmail: clientEmail || null,
          clientAddress: clientAddress || null,
          clientCity: clientCity || null,
          contractProject,
          contractProjectLocation: contractProjectLocation || null,
          contractValue,
          contractDuration: contractDuration || null,
          contractScope: contractScope || null,
          contractDate: contractDate || null,
          contractAgreedBalance: contractAgreedBalance || null,
          contractAdvancePayment: contractAdvancePayment || null,
          representativeName: representativeName || null,
          representativeTitle: representativeTitle || null,
          signatoryTitle: signatoryTitle || null,
          typedClientSignature,
          drawnClientSignature: drawnClientSignature || null,
          verificationToken: generatedToken
        }).returning();
        savedRecord = inserted[0];
      }

      // Dispatch SMTP Email Notification to Admin (kreboya603@gmail.com)
      const adminSubject = `[MADECC GROUP] Contract Certified & Digitally Signed: ${contractNo}`;
      const adminText = `A contract has been certified and digitally signed in the MADECC Compliance System:\n\nContract No: ${contractNo}\nProject: ${contractProject}\nClient: ${clientName}\nEmail: ${clientEmail || 'N/A'}\nContract Value: ${contractValue}\nVerification Token: ${savedRecord.verificationToken}\n\nVerify online: https://madeccgroup.online/?verify=${savedRecord.verificationToken}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-top: 0; font-size: 20px;">Contract Certified &amp; Digitally Signed</h2>
          <p><strong>Contract No:</strong> <span style="font-family: monospace; font-weight: bold; color: #d97706;">${contractNo}</span></p>
          <p><strong>Project:</strong> ${contractProject}</p>
          <p><strong>Client Name:</strong> ${clientName}</p>
          <p><strong>Client Email:</strong> ${clientEmail ? `<a href="mailto:${clientEmail}" style="color: #f59e0b;">${clientEmail}</a>` : 'Not provided'}</p>
          <p><strong>Contract Value:</strong> <span style="font-weight: bold; color: #16a34a;">${contractValue}</span></p>
          <p><strong>Verification Token:</strong> <span style="font-family: monospace;">${savedRecord.verificationToken}</span></p>
          <div style="margin: 20px 0;">
            <a href="https://madeccgroup.online/?verify=${savedRecord.verificationToken}" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">View Official Seal &amp; Verify &rarr;</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">MADECC GROUP Legal &amp; Compliance Directorate &bull; Cameroon</p>
        </div>
      `;
      sendNotificationEmail(adminSubject, adminText, adminHtml, { replyTo: clientEmail || undefined }).catch(err => {
        console.error('Email error (contract sign notification):', err);
      });

      // Send confirmation to client if email provided
      if (clientEmail && clientEmail.includes('@')) {
        const clientSubject = `Your Digitally Sealed Engineering Contract: ${contractNo} - MADECC GROUP`;
        const clientText = `Dear ${clientName},\n\nYour civil engineering contract (${contractNo}) for "${contractProject}" has been certified and digitally sealed by MADECC GROUP S.A.R.L.\n\nVerification Token: ${savedRecord.verificationToken}\nYou can view and verify your contract at: https://madeccgroup.online/?verify=${savedRecord.verificationToken}\n\nWarm regards,\nMADECC GROUP Legal & Contracting Office`;
        const clientHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
              <h1 style="color: #0f172a; margin: 0 0 4px 0; font-weight: 800; font-size: 24px; letter-spacing: 0.05em;">MADECC GROUP</h1>
              <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin: 0; font-weight: 700;">Legal &amp; Engineering Contracts Directorate</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Dear <strong>${clientName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
              Your contract for <strong>${contractProject}</strong> has been registered in the MADECC GROUP Digital Compliance Registry.
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Contract Reference:</p>
              <p style="margin: 0 0 12px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #d97706;">${contractNo}</p>
              <p style="margin: 0 0 6px 0; font-size: 13px; color: #334155;"><strong>Contract Value:</strong> ${contractValue}</p>
              <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Security Token:</strong> <span style="font-family: monospace; color: #2563eb;">${savedRecord.verificationToken}</span></p>
            </div>
            <div style="text-align: center; margin: 24px 0;">
              <a href="https://madeccgroup.online/?verify=${savedRecord.verificationToken}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block;">Access Digital Contract &amp; Verify &rarr;</a>
            </div>
            <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 20px 0;">
              This digital document includes cryptographic QR verification and tamper-evident logging.
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
              MADECC GROUP S.A.R.L. &bull; Yaounde Mbankolo &amp; Douala, Cameroon<br />
              Contracts Desk: <a href="mailto:kreboya603@gmail.com" style="color: #f59e0b; text-decoration: none;">kreboya603@gmail.com</a> | Tel: +237 683 316 486
            </p>
          </div>
        `;
        sendEmail(clientEmail.trim(), clientSubject, clientText, clientHtml).catch(err => {
          console.error('Email error (contract client confirmation):', err);
        });
      }

      res.json(savedRecord);
    } catch (error: any) {
      console.error('Error signing contract:', error);
      res.status(500).json({ error: error.message || 'Failed to sign contract' });
    }
  });

  // 3. Verify contract public lookup
  app.get('/api/contracts/verify/:token', async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const token = req.params.token;
      const records = await db.select().from(signedContracts).where(eq(signedContracts.verificationToken, token)).limit(1);
      if (records.length === 0) {
        return res.status(404).json({ error: 'Contract verification token not found in registry.' });
      }
      res.json(records[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Client countersign contract online
  app.put('/api/contracts/verify/:token/sign', async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const token = req.params.token;
      const { drawnClientSignature, typedClientSignature } = req.body;

      const records = await db.select().from(signedContracts).where(eq(signedContracts.verificationToken, token)).limit(1);
      if (records.length === 0) {
        return res.status(404).json({ error: 'Contract not found.' });
      }

      const current = records[0];
      const updated = await db.update(signedContracts)
        .set({
          drawnClientSignature: drawnClientSignature || current.drawnClientSignature,
          typedClientSignature: typedClientSignature || current.typedClientSignature
        })
        .where(eq(signedContracts.id, current.id))
        .returning();

      // Notify Admin (kreboya603@gmail.com) via SMTP that client countersigned!
      const adminSubject = `[MADECC GROUP] Contract Countersigned by Client: ${current.contractNo}`;
      const adminText = `Client ${typedClientSignature || current.clientName} has digitally countersigned contract ${current.contractNo} for "${current.contractProject}".\n\nReview at: https://madeccgroup.online/?verify=${token}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 12px; margin-top: 0; font-size: 20px;">Contract Digitally Countersigned</h2>
          <p><strong>Contract No:</strong> <span style="font-family: monospace; font-weight: bold; color: #d97706;">${current.contractNo}</span></p>
          <p><strong>Project:</strong> ${current.contractProject}</p>
          <p><strong>Client:</strong> ${current.clientName}</p>
          <p><strong>Signed by:</strong> ${typedClientSignature || current.clientName}</p>
          <div style="margin: 20px 0;">
            <a href="https://madeccgroup.online/?verify=${token}" style="background-color: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">View Signed Document &rarr;</a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">MADECC GROUP Legal &bull; Cameroon</p>
        </div>
      `;
      sendNotificationEmail(adminSubject, adminText, adminHtml).catch(err => {
        console.error('Email error (contract countersign):', err);
      });

      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Update contract by ID
  app.put('/api/contracts/:id', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const id = parseInt(req.params.id);
      const data = req.body;
      const updated = await db.update(signedContracts).set(data).where(eq(signedContracts.id, id)).returning();
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Delete contract by ID
  app.delete('/api/contracts/:id', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const id = parseInt(req.params.id);
      const deleted = await db.delete(signedContracts).where(eq(signedContracts.id, id)).returning();
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6b. Regenerate verification token for contract
  app.post('/api/contracts/:id/regenerate-token', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const id = parseInt(req.params.id);
      const newToken = `CNT-VERIF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const updated = await db.update(signedContracts)
        .set({ verificationToken: newToken })
        .where(eq(signedContracts.id, id))
        .returning();
      if (updated.length === 0) return res.status(404).json({ error: 'Contract not found' });
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // --- RECEIPTS MANAGEMENT & E-MAILING ---
  // ==========================================

  // 7. Get all receipts
  app.get('/api/receipts/all', async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const records = await db.select().from(signedReceipts).orderBy(desc(signedReceipts.signedAt));
      res.json(records);
    } catch (error: any) {
      console.warn('[DB Error] /api/receipts/all:', error.message || error);
      res.json([]);
    }
  });

  // 8. Sign / Register a receipt
  app.post('/api/receipts/sign', async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const {
        receiptNo,
        clientName,
        clientNiu,
        clientEmail,
        receiptProject,
        invoiceTotalAmount,
        receiptAmount,
        remainingBalance,
        receiptTaxRate,
        currency = 'XAF',
        receiptMethod,
        receiptMemo,
        receiptSignatory,
        receiptTypedSign,
        drawnCfoSignature,
        status = 'ISSUED'
      } = req.body;

      if (!receiptNo || !clientName || !receiptProject || !receiptAmount || !receiptSignatory) {
        return res.status(400).json({ error: 'Missing required receipt fields.' });
      }

      const verificationToken = `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      const existing = await db.select().from(signedReceipts).where(eq(signedReceipts.receiptNo, receiptNo)).limit(1);

      let savedReceipt;
      if (existing.length > 0) {
        const nextVersion = (existing[0].version || 1) + 1;
        const updated = await db.update(signedReceipts)
          .set({
            clientName,
            clientNiu: clientNiu || null,
            clientEmail: clientEmail || null,
            receiptProject,
            invoiceTotalAmount: invoiceTotalAmount || null,
            receiptAmount,
            remainingBalance: remainingBalance || null,
            receiptTaxRate: receiptTaxRate || null,
            currency,
            receiptMethod,
            receiptMemo: receiptMemo || null,
            receiptSignatory,
            receiptTypedSign,
            drawnCfoSignature: drawnCfoSignature || null,
            verificationToken,
            version: nextVersion,
            status,
            updatedAt: new Date()
          })
          .where(eq(signedReceipts.id, existing[0].id))
          .returning();
        savedReceipt = updated[0];
      } else {
        const inserted = await db.insert(signedReceipts).values({
          receiptNo,
          clientName,
          clientNiu: clientNiu || null,
          clientEmail: clientEmail || null,
          receiptProject,
          invoiceTotalAmount: invoiceTotalAmount || null,
          receiptAmount,
          remainingBalance: remainingBalance || null,
          receiptTaxRate: receiptTaxRate || null,
          currency,
          receiptMethod,
          receiptMemo: receiptMemo || null,
          receiptSignatory,
          receiptTypedSign,
          drawnCfoSignature: drawnCfoSignature || null,
          verificationToken,
          version: 1,
          status
        }).returning();
        savedReceipt = inserted[0];
      }

      res.json(savedReceipt);
    } catch (error: any) {
      console.error('Error signing receipt:', error);
      res.status(500).json({ error: error.message || 'Failed to register receipt' });
    }
  });

  // 9. Public verify receipt lookup
  app.get('/api/receipts/verify/:token', async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const token = req.params.token;
      const records = await db.select().from(signedReceipts).where(eq(signedReceipts.verificationToken, token)).limit(1);
      if (records.length === 0) {
        return res.status(404).json({ error: 'Receipt verification token not found in registry.' });
      }
      res.json(records[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 10. Update receipt by ID
  app.put('/api/receipts/:id', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const id = parseInt(req.params.id);
      const data = req.body;
      const updated = await db.update(signedReceipts).set(data).where(eq(signedReceipts.id, id)).returning();
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 11. Delete receipt by ID
  app.delete('/api/receipts/:id', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const id = parseInt(req.params.id);
      const deleted = await db.delete(signedReceipts).where(eq(signedReceipts.id, id)).returning();
      res.json(deleted[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 11b. Regenerate verification token for receipt
  app.post('/api/receipts/:id/regenerate-token', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureDocumentTablesExist();
      const id = parseInt(req.params.id);
      const newToken = `RCP-VERIF-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
      const updated = await db.update(signedReceipts)
        .set({ verificationToken: newToken, updatedAt: new Date() })
        .where(eq(signedReceipts.id, id))
        .returning();
      if (updated.length === 0) return res.status(404).json({ error: 'Receipt not found' });
      res.json(updated[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 12. Email Official Receipt directly to Client via SMTP (kreboya603@gmail.com)
  app.post('/api/receipts/email', async (req, res) => {
    try {
      const {
        receiptNo,
        clientName = 'Valued Client',
        clientEmail,
        receiptProject = 'General Construction Services',
        invoiceTotalAmount,
        receiptAmount,
        remainingBalance,
        receiptTaxRate,
        receiptMethod,
        receiptMemo,
        verificationToken,
        currency = 'XAF'
      } = req.body;

      if (!clientEmail || !clientEmail.includes('@')) {
        return res.status(400).json({ error: 'A valid client email address is required to dispatch the receipt.' });
      }

      const verificationUrl = `https://madeccgroup.online/?verify=${verificationToken || ''}`;
      const emailSubject = `Official Payment Receipt: ${receiptNo} - MADECC GROUP S.A.R.L.`;
      const emailText = `Dear ${clientName},\n\nThank you for your payment to MADECC GROUP S.A.R.L. Below are your official receipt details:\n\nReceipt No: ${receiptNo}\nProject: ${receiptProject}\nAmount Paid: ${currency} ${Number(receiptAmount || 0).toLocaleString()}\nRemaining Balance: ${currency} ${Number(remainingBalance || 0).toLocaleString()}\nPayment Method: ${receiptMethod || 'Bank Transfer'}\nMemo: ${receiptMemo || 'Payment for construction services'}\n\nVerify authentic receipt online:\n${verificationUrl}\n\nWarm regards,\nMADECC GROUP Finance & Treasury Directorate`;

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0 0 4px 0; font-weight: 800; font-size: 24px; letter-spacing: 0.05em;">MADECC GROUP</h1>
            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin: 0; font-weight: 700;">Treasury &bull; Official Digital Payment Receipt</p>
          </div>

          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Dear <strong>${clientName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 20px 0; color: #334155;">
            Thank you for your payment. We confirm that the transaction for <strong>${receiptProject}</strong> has been successfully credited and certified in our fiscal registry.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
              <span style="color: #64748b; font-size: 13px;">Receipt Number:</span>
              <span style="font-family: monospace; font-weight: bold; color: #d97706; font-size: 15px;">${receiptNo}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 13px;">Project Description:</span>
              <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${receiptProject}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 13px;">Payment Method:</span>
              <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${receiptMethod || 'Direct Transfer'}</span>
            </div>
            ${invoiceTotalAmount ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 13px;">Invoice Total:</span>
                <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${currency} ${Number(invoiceTotalAmount).toLocaleString()}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 13px;">Amount Paid (This Receipt):</span>
              <span style="font-size: 18px; font-weight: 800; color: #16a34a;">${currency} ${Number(receiptAmount || 0).toLocaleString()}</span>
            </div>
            ${remainingBalance ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
                <span style="color: #64748b; font-size: 13px;">Remaining Balance:</span>
                <span style="font-weight: 600; color: #dc2626; font-size: 13px;">${currency} ${Number(remainingBalance).toLocaleString()}</span>
              </div>
            ` : ''}
            ${receiptMemo ? `
              <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #475569;">
                <strong>Transaction Memo:</strong> ${receiptMemo}
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${verificationUrl}" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 8px; border: 1px solid #d97706;">
              Verify Digital Receipt &amp; Barcode &rarr;
            </a>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0 0 20px 0;">
            Please retain this email as proof of payment. For billing clarifications, our accounting desk is at your disposal.
          </p>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            MADECC GROUP S.A.R.L. &bull; Yaounde Mbankolo &amp; Douala, Cameroon<br />
            Finance Desk: <a href="mailto:kreboya603@gmail.com" style="color: #f59e0b; text-decoration: none;">kreboya603@gmail.com</a> | Tel: +237 683 316 486
          </p>
        </div>
      `;

      // Dispatch to Client
      await sendEmail(clientEmail.trim(), emailSubject, emailText, emailHtml);

      // Notify Admin via SMTP
      const adminNotifySubject = `[MADECC GROUP] Receipt Dispatched to Client: ${receiptNo}`;
      const adminNotifyText = `Official receipt ${receiptNo} for ${currency} ${Number(receiptAmount || 0).toLocaleString()} was dispatched to ${clientEmail} (${clientName}) for project "${receiptProject}".`;
      sendNotificationEmail(adminNotifySubject, adminNotifyText, emailHtml, { replyTo: clientEmail }).catch(err => {
        console.error('Failed to send admin copy of receipt:', err);
      });

      res.json({ success: true, message: `Receipt ${receiptNo} emailed successfully to ${clientEmail}` });
    } catch (error: any) {
      console.error('Error emailing receipt:', error);
      res.status(500).json({ error: error.message || 'Failed to email receipt' });
    }
  });

  // ==========================================
  // --- CLIENT PAYMENT CONFIRMATION & ADMIN UNLOCK QUEUE (NEON POSTGRESQL) ---
  // ==========================================

  const ADMIN_SMTP_USER = 'kreboya603@gmail.com';

  // 13. Get all payment requests (for Admin Dashboard & Client Sync)
  app.get('/api/receipts/payment-requests', requireStaffOrAdmin, async (_req, res) => {
    try {
      await ensureSeededPaymentRequests();
      const result = await db.execute(sql`
        SELECT * FROM receipt_payment_requests ORDER BY created_at DESC LIMIT 200
      `);
      const records = (result.rows || []).map(formatPaymentRequestRow);
      res.json({ success: true, records });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch payment requests' });
    }
  });

  // 14. Get single payment status by receiptNo (Authoritative PostgreSQL check)
  app.get('/api/receipts/payment-requests/status/:receiptNo', async (req, res) => {
    try {
      await ensureSeededPaymentRequests();
      const receiptNo = String(req.params.receiptNo || '').trim();
      const result = await db.execute(sql`
        SELECT * FROM receipt_payment_requests WHERE receipt_no = ${receiptNo} LIMIT 1
      `);
      const record = formatPaymentRequestRow(result.rows[0]);
      res.json({
        success: true,
        isPaid: Boolean(record?.isPaid),
        record
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 14b. Strict download authorization check — returns HTTP 402 unless paid & confirmed in Neon PostgreSQL
  app.get('/api/receipts/verify-download/:receiptNo', async (req, res) => {
    try {
      await ensureSeededPaymentRequests();
      const receiptNo = String(req.params.receiptNo || '').trim();
      if (!receiptNo) {
        return res.status(400).json({ allowed: false, error: 'Receipt reference is required.' });
      }

      const result = await db.execute(sql`
        SELECT * FROM receipt_payment_requests WHERE receipt_no = ${receiptNo} LIMIT 1
      `);
      const record = formatPaymentRequestRow(result.rows[0]);

      if (!record || !record.isPaid || !record.adminConfirmed || record.status !== 'ADMIN_CONFIRMED' || record.amount <= 0) {
        return res.status(402).json({
          allowed: false,
          receiptNo,
          status: record?.status || 'UNPAID',
          record: record || null,
          error: `Payment of required fee for ${receiptNo} is not yet paid and confirmed by Administrator. Downloads remain locked until payment is verified.`
        });
      }

      return res.json({
        allowed: true,
        receiptNo,
        status: record.status,
        record
      });
    } catch (error: any) {
      return res.status(500).json({ allowed: false, error: error.message || 'Failed to verify download permission' });
    }
  });

  // 15. Client submits 999 / 2,199 XAF payment -> awaits Admin confirmation (OK) in Admin Dashboard
  app.post('/api/receipts/payment-requests', async (req, res) => {
    try {
      await ensureSeededPaymentRequests();
      const body = req.body || {};
      const receiptNo = String(body.receiptNo || `RCP-${Date.now().toString().slice(-6)}`).trim();
      const transactionId = String(body.transactionId || '').trim();
      const amount = Number(body.amount);

      if (!transactionId || transactionId.length < 4) {
        return res.status(400).json({
          error: 'Valid Mobile Money / Orange Money or Bank transaction reference is required (minimum 4 characters).'
        });
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          error: 'Valid non-zero payment amount is required.'
        });
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const reqId = String(body.id || `PAY-REQ-${Date.now().toString().slice(-5)}`);
      const currency = String(body.currency || 'XAF');
      const paymentMethod = String(body.paymentMethod || 'MTN Mobile Money (671063511)');
      const recipientNumber = String(body.recipientNumber || '671063511');
      const paidAt = String(body.paidAt || nowStr);
      const payerName = String(body.payerName || 'Valued Client');
      const payerPhone = String(body.payerPhone || '671063511');
      const clientEmail = String(body.clientEmail || '');
      const projectName = String(body.projectName || 'MADECC Infrastructure Project');
      const docType = String(body.docType || 'boq_receipt');
      const domainUsed = String(body.domainUsed || 'https://madeccgroup.online');

      const upsertRes = await db.execute(sql`
        INSERT INTO receipt_payment_requests (
          id, receipt_no, is_paid, status, admin_confirmed, amount, currency,
          payment_method, recipient_number, transaction_id, paid_at,
          payer_name, payer_phone, client_email, project_name, doc_type, domain_used, updated_at
        )
        VALUES (
          ${reqId}, ${receiptNo}, FALSE, 'PENDING_ADMIN_CONFIRMATION', FALSE, ${Math.round(amount)}, ${currency},
          ${paymentMethod}, ${recipientNumber}, ${transactionId}, ${paidAt},
          ${payerName}, ${payerPhone}, ${clientEmail}, ${projectName}, ${docType}, ${domainUsed}, NOW()
        )
        ON CONFLICT (receipt_no) DO UPDATE SET
          is_paid = FALSE,
          status = 'PENDING_ADMIN_CONFIRMATION',
          admin_confirmed = FALSE,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          payment_method = EXCLUDED.payment_method,
          recipient_number = EXCLUDED.recipient_number,
          transaction_id = EXCLUDED.transaction_id,
          paid_at = EXCLUDED.paid_at,
          payer_name = EXCLUDED.payer_name,
          payer_phone = EXCLUDED.payer_phone,
          client_email = EXCLUDED.client_email,
          project_name = EXCLUDED.project_name,
          doc_type = EXCLUDED.doc_type,
          domain_used = EXCLUDED.domain_used,
          confirmed_at = NULL,
          confirmed_by = NULL,
          updated_at = NOW()
        RETURNING *
      `);

      const pendingRecord = formatPaymentRequestRow(upsertRes.rows[0])!;

      // Alert Admin (kreboya603@gmail.com) that a payment is awaiting confirmation in Admin Dashboard
      const alertSubject = `[MADECC ACTION REQUIRED] Client Paid ${pendingRecord.amount.toLocaleString()} ${pendingRecord.currency} — Confirm & Press OK in Admin Dashboard (${receiptNo})`;
      const alertText = `A client has submitted a payment of ${pendingRecord.amount.toLocaleString()} ${pendingRecord.currency} for Receipt/Document ${receiptNo}.\n\nPayer: ${pendingRecord.payerName} (${pendingRecord.payerPhone})\nMethod: ${pendingRecord.paymentMethod}\nTransaction Ref: ${pendingRecord.transactionId}\nProject: ${pendingRecord.projectName}\n\nPlease open the MADECC Admin Dashboard and press "Confirm & OK" to dispatch the official confirmation and unlock all receipt and document download links.`;
      const alertHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 24px; border: 2px solid #f59e0b; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
          <h2 style="color: #d97706; margin-top: 0;">Payment Submitted — Awaiting Admin Confirmation (OK)</h2>
          <p>A client has completed a <strong>${pendingRecord.amount.toLocaleString()} ${pendingRecord.currency}</strong> payment and is waiting for your confirmation in the Admin Dashboard before download links unlock:</p>
          <ul style="line-height: 1.7; font-size: 14px;">
            <li><strong>Receipt / Document Ref:</strong> ${receiptNo}</li>
            <li><strong>Amount Paid:</strong> ${pendingRecord.amount.toLocaleString()} ${pendingRecord.currency}</li>
            <li><strong>Payment Method:</strong> ${pendingRecord.paymentMethod}</li>
            <li><strong>Transaction ID:</strong> ${pendingRecord.transactionId}</li>
            <li><strong>Client / Payer:</strong> ${pendingRecord.payerName} (${pendingRecord.payerPhone})</li>
            <li><strong>Project:</strong> ${pendingRecord.projectName}</li>
          </ul>
          <p style="font-size: 13px; color: #475569;">Log in to the <strong>Admin Dashboard</strong> and click <strong>Confirm &amp; OK</strong> to dispatch the confirmation and unlock the client's receipt and document download links.</p>
        </div>
      `;
      sendNotificationEmail(alertSubject, alertText, alertHtml, { to: ADMIN_SMTP_USER }).catch(err => {
        console.warn('Initial payment alert email note:', err);
      });

      res.json({
        success: true,
        record: pendingRecord,
        message: 'Payment submitted! Awaiting Admin confirmation (OK) in Admin Dashboard before download links unlock.'
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to submit payment request' });
    }
  });

  // 16. Admin presses "Confirm & OK" in Admin Dashboard -> Verifies payment, dispatches SMTP, & unlocks downloads
  app.post('/api/receipts/payment-requests/confirm', requireStaffOrAdmin, async (req: any, res) => {
    try {
      await ensureSeededPaymentRequests();
      const body = req.body || {};
      const receiptNo = String(body.receiptNo || '').trim();
      if (!receiptNo) {
        return res.status(400).json({ error: 'receiptNo is required to confirm payment.' });
      }

      const existingRes = await db.execute(sql`
        SELECT * FROM receipt_payment_requests WHERE receipt_no = ${receiptNo} LIMIT 1
      `);
      const existing = existingRes.rows[0] as any;

      const amount = Number(body.amount || existing?.amount || 2199);
      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Cannot confirm zero-amount or unpaid receipt download.' });
      }

      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const currency = String(body.currency || existing?.currency || 'XAF');
      const paymentMethod = String(body.paymentMethod || existing?.payment_method || 'MTN Mobile Money');
      const recipientNumber = String(body.recipientNumber || existing?.recipient_number || '671063511');
      const transactionId = String(body.transactionId || existing?.transaction_id || `TXN-${Date.now().toString().slice(-6)}`);
      const paidAt = String(body.paidAt || existing?.paid_at || nowStr);
      const payerName = String(body.payerName || existing?.payer_name || 'Client');
      const payerPhone = String(body.payerPhone || existing?.payer_phone || '');
      const clientEmail = String(body.clientEmail || existing?.client_email || '');
      const projectName = String(body.projectName || existing?.project_name || 'MADECC Infrastructure Project');
      const docType = String(body.docType || existing?.doc_type || 'boq_receipt');
      const domainUsed = String(body.domainUsed || existing?.domain_used || 'https://madeccgroup.online');
      const confirmedBy = String(req.dbUser?.email || ADMIN_SMTP_USER);
      const reqId = String(existing?.id || body.id || `PAY-REQ-${Date.now().toString().slice(-5)}`);

      const confirmRes = await db.execute(sql`
        INSERT INTO receipt_payment_requests (
          id, receipt_no, is_paid, status, admin_confirmed, amount, currency,
          payment_method, recipient_number, transaction_id, paid_at,
          payer_name, payer_phone, client_email, project_name, doc_type, domain_used,
          confirmed_at, confirmed_by, smtp_dispatched_to, smtp_dispatched_at, updated_at
        )
        VALUES (
          ${reqId}, ${receiptNo}, TRUE, 'ADMIN_CONFIRMED', TRUE, ${Math.round(amount)}, ${currency},
          ${paymentMethod}, ${recipientNumber}, ${transactionId}, ${paidAt},
          ${payerName}, ${payerPhone}, ${clientEmail}, ${projectName}, ${docType}, ${domainUsed},
          ${nowStr}, ${confirmedBy}, ${ADMIN_SMTP_USER}, ${nowStr}, NOW()
        )
        ON CONFLICT (receipt_no) DO UPDATE SET
          is_paid = TRUE,
          status = 'ADMIN_CONFIRMED',
          admin_confirmed = TRUE,
          amount = EXCLUDED.amount,
          currency = EXCLUDED.currency,
          payment_method = EXCLUDED.payment_method,
          transaction_id = EXCLUDED.transaction_id,
          confirmed_at = ${nowStr},
          confirmed_by = ${confirmedBy},
          smtp_dispatched_to = ${ADMIN_SMTP_USER},
          smtp_dispatched_at = ${nowStr},
          updated_at = NOW()
        RETURNING *
      `);

      const confirmedRecord = formatPaymentRequestRow(confirmRes.rows[0])!;

      const verifyAndDownloadUrl = `${confirmedRecord.domainUsed || 'https://madeccgroup.online'}/?pay=1&receipt=${encodeURIComponent(receiptNo)}&amount=${confirmedRecord.amount}&currency=${confirmedRecord.currency}&client=${encodeURIComponent(confirmedRecord.payerName || 'Client')}&project=${encodeURIComponent(confirmedRecord.projectName || 'Project')}`;

      const smtpSubject = `[MADECC ADMIN CONFIRMED - OK] Payment of ${confirmedRecord.amount.toLocaleString()} ${confirmedRecord.currency} Approved & Download Links Unlocked (${receiptNo})`;
      const smtpText = `ADMIN CONFIRMATION (OK) DISPATCHED TO ${ADMIN_SMTP_USER}\n\nPayment for Receipt/Document ${receiptNo} has been confirmed and approved by the Administrator.\n\nAmount Confirmed: ${confirmedRecord.amount.toLocaleString()} ${confirmedRecord.currency}\nPayment Method: ${confirmedRecord.paymentMethod || 'Mobile Money'}\nTransaction ID: ${confirmedRecord.transactionId}\nClient / Payer: ${confirmedRecord.payerName} (${confirmedRecord.payerPhone || 'N/A'})\nProject: ${confirmedRecord.projectName}\nConfirmed At: ${nowStr}\nSMTP User Dispatched: ${ADMIN_SMTP_USER}\n\nSTATUS: ALL RECEIPT & DOCUMENT DOWNLOAD LINKS ARE NOW UNLOCKED AND ACTIVE.\nDownload & Verification Link: ${verifyAndDownloadUrl}`;
      const smtpHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px; border: 2px solid #10b981; border-radius: 14px; background-color: #ffffff; color: #0f172a;">
          <div style="background-color: #0f172a; padding: 18px 24px; border-radius: 10px; margin-bottom: 20px; border-bottom: 3px solid #10b981;">
            <h2 style="color: #10b981; margin: 0; font-size: 18px; text-transform: uppercase;">✓ Admin Confirmation (OK) — Downloads Unlocked</h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; font-family: monospace;">Dispatched to SMTP User: ${ADMIN_SMTP_USER}</p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            You have confirmed and pressed <strong>OK</strong> in the MADECC Admin Dashboard for receipt/document <strong>${receiptNo}</strong>. All receipt PDF, Word (.docx), BOQ, and document download links are now active and unlocked for the client.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px; margin: 18px 0; font-size: 13px; line-height: 1.8;">
            <div><strong>Receipt / Document No:</strong> <span style="font-family: monospace; color: #d97706; font-weight: bold;">${receiptNo}</span></div>
            <div><strong>Confirmed Amount:</strong> <span style="color: #16a34a; font-weight: 800;">${confirmedRecord.amount.toLocaleString()} ${confirmedRecord.currency}</span></div>
            <div><strong>Payment Channel:</strong> ${confirmedRecord.paymentMethod || 'Mobile Money'}</div>
            <div><strong>Transaction Reference:</strong> <span style="font-family: monospace;">${confirmedRecord.transactionId}</span></div>
            <div><strong>Client / Payer:</strong> ${confirmedRecord.payerName} (${confirmedRecord.payerPhone || 'N/A'})</div>
            <div><strong>Project:</strong> ${confirmedRecord.projectName}</div>
            <div><strong>Confirmed By:</strong> <span style="font-family: monospace;">${confirmedBy}</span></div>
            <div><strong>Download Links Status:</strong> <span style="color: #16a34a; font-weight: bold;">UNLOCKED &amp; ACTIVE</span></div>
          </div>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verifyAndDownloadUrl}" style="background-color: #10b981; color: #0f172a; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 800; font-size: 13px; display: inline-block;">
              Access Unlocked Receipt &amp; Download Links &rarr;
            </a>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">
            MADECC GROUP S.A.R.L. &bull; Official SMTP Dispatch to ${ADMIN_SMTP_USER}
          </p>
        </div>
      `;

      await sendNotificationEmail(smtpSubject, smtpText, smtpHtml, {
        to: ADMIN_SMTP_USER,
        replyTo: confirmedRecord.clientEmail || ADMIN_SMTP_USER
      });

      if (confirmedRecord.clientEmail && confirmedRecord.clientEmail.includes('@')) {
        sendEmail(confirmedRecord.clientEmail.trim(), smtpSubject, smtpText, smtpHtml).catch(err => {
          console.warn('Client unlock email note:', err);
        });
      }

      res.json({
        success: true,
        record: confirmedRecord,
        smtpDispatchedTo: ADMIN_SMTP_USER,
        message: `Confirmed (OK)! Notification dispatched to SMTP user ${ADMIN_SMTP_USER}. Receipt ${receiptNo} and all download links are now unlocked.`
      });
    } catch (error: any) {
      console.error('Error confirming payment request:', error);
      res.status(500).json({ error: error.message || 'Failed to confirm payment' });
    }
  });

  // 16b. Admin revoke / delete payment confirmation record
  app.delete('/api/receipts/payment-requests/:receiptNo', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureSeededPaymentRequests();
      const receiptNo = String(req.params.receiptNo || '').trim();
      await db.execute(sql`DELETE FROM receipt_payment_requests WHERE receipt_no = ${receiptNo}`);
      res.json({ success: true, receiptNo });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to remove payment request' });
    }
  });

  // =========================================================================
  // --- NON-INTRUSIVE WEBSITE MAINTENANCE MODE & SMTP DISPATCH (kreboya603@gmail.com) ---
  // =========================================================================
  interface MaintenanceSubscriber {
    email: string;
    name?: string;
    phone?: string;
    note?: string;
    subscribedAt: string;
  }

  interface MaintenanceState {
    enabled: boolean;
    mode: 'non_intrusive_banner' | 'soft_dismissible_modal';
    title: string;
    message: string;
    estimatedCompletion: string;
    affectedModules: string;
    allowFullBrowsing: boolean;
    smtpUser: string;
    lastTriggeredAt: string;
    lastSmtpDispatchAt?: string;
    subscribers: MaintenanceSubscriber[];
  }

  let currentMaintenanceState: MaintenanceState = {
    enabled: false,
    mode: 'non_intrusive_banner',
    title: 'Scheduled Platform Enhancement & Maintenance in Progress',
    message: 'We are currently performing background engineering database & server optimizations. You can continue browsing all pages, using calculators, and exploring the website without any interruption.',
    estimatedCompletion: 'Today at 18:00 WAT',
    affectedModules: 'Background Sync & Cloud Backup Only (All Public Pages & Calculators 100% Active)',
    allowFullBrowsing: true,
    smtpUser: ADMIN_SMTP_USER,
    lastTriggeredAt: new Date().toISOString(),
    subscribers: [
      {
        email: ADMIN_SMTP_USER,
        name: 'Executive Admin Monitor',
        phone: '+237 671 063 511',
        note: 'Primary SMTP Maintenance Dispatch Account',
        subscribedAt: new Date().toISOString()
      }
    ]
  };

  app.get('/api/maintenance/status', async (_req, res) => {
    try {
      const maintenance = await getActiveMaintenanceForPublic();
      res.json({
        success: true,
        maintenance
      });
    } catch (err: any) {
      res.json({
        success: true,
        maintenance: currentMaintenanceState
      });
    }
  });

  app.post('/api/maintenance/toggle', requireStaffOrAdmin, async (req: any, res) => {
    try {
      await ensureCmsTables();
      const {
        enabled,
        mode,
        title,
        message,
        estimatedCompletion,
        affectedModules,
        recipientEmails
      } = req.body || {};

      const existingRows = await db.select().from(maintenanceSchedules).orderBy(desc(maintenanceSchedules.updatedAt)).limit(1);
      const curRow = existingRows[0];
      const nextEnabled = typeof enabled === 'boolean' ? enabled : !(curRow?.status === 'ACTIVE' || curRow?.status === 'EMERGENCY');
      const now = new Date();
      const nowIso = now.toISOString();

      const resolvedTitle = title || curRow?.title || currentMaintenanceState.title;
      const resolvedMessage = message || curRow?.message || currentMaintenanceState.message;
      const resolvedMode = mode || curRow?.mode || 'non_intrusive_banner';
      const resolvedEst = estimatedCompletion || curRow?.estimatedCompletion || currentMaintenanceState.estimatedCompletion;
      const resolvedScope = affectedModules || curRow?.affectedScope || currentMaintenanceState.affectedModules;
      const currentSubscribers: MaintenanceSubscriber[] = Array.isArray(curRow?.subscribersJson)
        ? (curRow!.subscribersJson as MaintenanceSubscriber[])
        : currentMaintenanceState.subscribers;

      const statusLabel = nextEnabled
        ? 'ACTIVE (Non-Intrusive Visitor Notification Enabled)'
        : 'COMPLETED / NORMAL OPERATIONS RESTORED';

      const smtpSubject = nextEnabled
        ? `[MADECC MAINTENANCE NOTICE] ${resolvedTitle} (Non-Intrusive Mode Active)`
        : `[MADECC MAINTENANCE COMPLETE] Scheduled Maintenance Finished — All Systems 100% Optimal`;

      const smtpText = `OFFICIAL WEBSITE MAINTENANCE NOTIFICATION\nDispatched via SMTP User: ${ADMIN_SMTP_USER}\n\nStatus: ${statusLabel}\nNotice Title: ${resolvedTitle}\nVisitor Message: ${resolvedMessage}\nEstimated Completion: ${resolvedEst}\nModules Note: ${resolvedScope}\nVisitor Experience: Non-Intrusive (Visitors can browse, calculate budgets, and use the website without inconvenience).\nTriggered At: ${nowIso}\n\nFor immediate assistance, contact ${ADMIN_SMTP_USER} or WhatsApp +237 671 063 511.`;

      const smtpHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 28px; border: 2px solid ${nextEnabled ? '#f59e0b' : '#10b981'}; border-radius: 14px; background-color: #ffffff; color: #0f172a;">
          <div style="background-color: #0f172a; padding: 18px 24px; border-radius: 10px; margin-bottom: 20px; border-bottom: 3px solid ${nextEnabled ? '#f59e0b' : '#10b981'};">
            <h2 style="color: ${nextEnabled ? '#f59e0b' : '#10b981'}; margin: 0; font-size: 18px; text-transform: uppercase;">
              ${nextEnabled ? '⚙️ Non-Intrusive Maintenance Mode Activated' : '✓ Scheduled Maintenance Completed'}
            </h2>
            <p style="color: #94a3b8; margin: 4px 0 0 0; font-size: 12px; font-family: monospace;">
              Triggered in Admin Dashboard &bull; Dispatched via SMTP User: ${ADMIN_SMTP_USER}
            </p>
          </div>
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">${resolvedMessage}</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 18px; margin: 18px 0; font-size: 13px; line-height: 1.8;">
            <div><strong>Current Status:</strong> <span style="color: ${nextEnabled ? '#d97706' : '#16a34a'}; font-weight: bold;">${statusLabel}</span></div>
            <div><strong>Estimated Completion:</strong> ${resolvedEst}</div>
            <div><strong>Scope:</strong> ${resolvedScope}</div>
            <div><strong>Authorized SMTP User:</strong> <span style="font-family: monospace;">${ADMIN_SMTP_USER}</span></div>
          </div>
        </div>
      `;

      let smtpStatusText = `Dispatched via ${ADMIN_SMTP_USER}`;
      try {
        await sendNotificationEmail(smtpSubject, smtpText, smtpHtml, {
          to: ADMIN_SMTP_USER,
          replyTo: ADMIN_SMTP_USER
        });
      } catch (smtpErr: any) {
        smtpStatusText = `SMTP notice failed: ${smtpErr?.message || 'Transport unavailable'}`;
      }

      const extraEmails: string[] = Array.isArray(recipientEmails)
        ? recipientEmails
        : typeof recipientEmails === 'string'
        ? recipientEmails.split(',').map((e: string) => e.trim()).filter(Boolean)
        : [];

      const subscriberEmails = currentSubscribers
        .map(s => s.email.trim())
        .filter(e => e.includes('@') && e.toLowerCase() !== ADMIN_SMTP_USER.toLowerCase());

      const allTargetClients = Array.from(new Set([...extraEmails, ...subscriberEmails])).filter(e => e.includes('@'));

      for (const clientEmail of allTargetClients) {
        sendEmail(clientEmail, smtpSubject, smtpText, smtpHtml).catch(err => {
          console.warn('Maintenance client email dispatch note:', err);
        });
      }

      const actor = req.dbUser?.email || 'Admin';
      if (curRow) {
        await db.update(maintenanceSchedules).set({
          title: resolvedTitle,
          message: resolvedMessage,
          status: nextEnabled ? 'ACTIVE' : 'COMPLETED',
          mode: resolvedMode,
          estimatedCompletion: resolvedEst,
          affectedScope: resolvedScope,
          lastSmtpDispatchAt: now,
          lastSmtpStatus: smtpStatusText,
          updatedBy: actor,
          updatedAt: now
        }).where(eq(maintenanceSchedules.id, curRow.id));
      } else {
        await db.insert(maintenanceSchedules).values({
          title: resolvedTitle,
          message: resolvedMessage,
          status: nextEnabled ? 'ACTIVE' : 'COMPLETED',
          mode: resolvedMode,
          timezone: 'Africa/Douala',
          estimatedCompletion: resolvedEst,
          affectedScope: resolvedScope,
          subscribersJson: currentSubscribers,
          lastSmtpDispatchAt: now,
          lastSmtpStatus: smtpStatusText,
          createdBy: actor,
          updatedBy: actor
        });
      }

      await db.insert(publicationHistory).values({
        targetType: 'maintenance',
        targetSlug: String(curRow?.id || 1),
        targetTitle: resolvedTitle,
        action: nextEnabled ? 'ACTIVATE' : 'COMPLETE',
        fromStatus: curRow?.status || 'CANCELLED',
        toStatus: nextEnabled ? 'ACTIVE' : 'COMPLETED',
        success: true,
        performedBy: actor,
        details: smtpStatusText
      }).catch(() => {});

      const maintenance = await getActiveMaintenanceForPublic();

      res.json({
        success: true,
        maintenance,
        smtpDispatchedTo: ADMIN_SMTP_USER,
        smtpStatus: smtpStatusText,
        clientRecipientsCount: allTargetClients.length,
        message: `Maintenance mode ${nextEnabled ? 'ACTIVATED (Non-Intrusive)' : 'DEACTIVATED'} and saved to Neon PostgreSQL.`
      });
    } catch (error: any) {
      console.error('Error toggling maintenance status:', error);
      res.status(500).json({ error: error.message || 'Failed to update maintenance mode' });
    }
  });

  app.post('/api/maintenance/visitor-subscribe', async (req, res) => {
    try {
      await ensureCmsTables();
      const { email, name, phone, note } = req.body || {};
      if (!email || !String(email).includes('@')) {
        return res.status(400).json({ error: 'Please provide a valid email address.' });
      }

      const cleanEmail = String(email).trim();
      const subRecord: MaintenanceSubscriber = {
        email: cleanEmail,
        name: name ? String(name).trim() : 'Website Visitor',
        phone: phone ? String(phone).trim() : '',
        note: note ? String(note).trim() : 'Requested maintenance status update via non-intrusive banner',
        subscribedAt: new Date().toISOString()
      };

      const existingRows = await db.select().from(maintenanceSchedules).orderBy(desc(maintenanceSchedules.updatedAt)).limit(1);
      const curRow = existingRows[0];
      const existingSubs: MaintenanceSubscriber[] = Array.isArray(curRow?.subscribersJson)
        ? (curRow!.subscribersJson as MaintenanceSubscriber[])
        : [];
      const exists = existingSubs.some(s => s.email.toLowerCase() === cleanEmail.toLowerCase());
      const updatedSubs = exists ? existingSubs : [subRecord, ...existingSubs];

      if (curRow) {
        await db.update(maintenanceSchedules)
          .set({ subscribersJson: updatedSubs, updatedAt: new Date() })
          .where(eq(maintenanceSchedules.id, curRow.id));
      }

      const activeMaint = await getActiveMaintenanceForPublic();
      const visitorSubject = `[MADECC GROUP] Maintenance Status & Priority Support Confirmation`;
      const visitorText = `Hello ${subRecord.name},\n\nThank you for visiting MADECC GROUP. We have registered your email (${cleanEmail}) for live maintenance updates from our SMTP desk (${ADMIN_SMTP_USER}).\n\nCurrent Notice: ${activeMaint.title}\nDetails: ${activeMaint.message}\nEstimated Completion: ${activeMaint.estimatedCompletion}\n\nWarm regards,\nMADECC GROUP Engineering Desk (${ADMIN_SMTP_USER})`;

      const visitorHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #f59e0b; border-radius: 12px; background-color: #ffffff; color: #0f172a;">
          <h3 style="color: #d97706; margin-top: 0;">✓ You're Subscribed to Live Maintenance Updates</h3>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Hello <strong>${subRecord.name}</strong>, thank you for visiting <strong>MADECC GROUP</strong>. While our team completes background maintenance (<em>${activeMaint.estimatedCompletion}</em>), all website pages and calculators remain open for your convenience.
          </p>
          <p style="font-size: 12px; color: #64748b;">
            Dispatched via Official Admin SMTP: <strong>${ADMIN_SMTP_USER}</strong> &bull; WhatsApp: +237 671 063 511
          </p>
        </div>
      `;

      let emailSent = true;
      try {
        await sendNotificationEmail(
          `[MADECC VISITOR MAINTENANCE SUBSCRIPTION] ${subRecord.name} (${cleanEmail})`,
          `Visitor ${subRecord.name} (${cleanEmail}, Phone: ${subRecord.phone || 'N/A'}) subscribed to maintenance updates.\nNote: ${subRecord.note}`,
          visitorHtml,
          { to: ADMIN_SMTP_USER, replyTo: cleanEmail }
        );
        sendEmail(cleanEmail, visitorSubject, visitorText, visitorHtml).catch(() => {});
      } catch {
        emailSent = false;
      }

      res.json({
        success: true,
        subscriber: subRecord,
        smtpDispatchedBy: ADMIN_SMTP_USER,
        smtpDelivered: emailSent,
        message: emailSent
          ? `Thank you! Saved in Neon DB and confirmation dispatched via ${ADMIN_SMTP_USER}.`
          : `Saved your subscription in Neon DB (SMTP dispatch queued / offline).`
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to subscribe for updates' });
    }
  });

  // ==========================================
  // --- DOCUMENT EXPORT SERVICE & AUDIT TRAIL ---
  // ==========================================
  app.get('/api/export/history', async (req, res) => {
    try {
      const logs = await db.select().from(exportHistoryLogs).orderBy(desc(exportHistoryLogs.timestamp)).limit(100);
      res.json({ success: true, logs });
    } catch (error: any) {
      console.warn('[DB Fallback] /api/export/history:', error.message || error);
      res.json({ success: true, logs: [] });
    }
  });

  app.post('/api/export/log', async (req, res) => {
    try {
      const { userEmail, moduleType, recordId, documentTitle, version, format, status, filename, errorMessage, metadata } = req.body;
      if (!moduleType || !recordId || !format) {
        return res.status(400).json({ error: 'Missing required export log parameters' });
      }

      const inserted = await db.insert(exportHistoryLogs).values({
        userEmail: userEmail || 'system@madeccgroup.online',
        moduleType,
        recordId: String(recordId),
        documentTitle: documentTitle || 'Export Document',
        version: String(version || '1.0'),
        format: format || 'pdf',
        status: status || 'SUCCESS',
        filename: filename || 'export-file',
        errorMessage: errorMessage || null,
        metadata: metadata || null
      }).returning();

      res.json({ success: true, log: inserted[0] });
    } catch (error: any) {
      console.warn('Failed to insert export log:', error.message || error);
      res.json({ success: true });
    }
  });

  app.get('/api/export/record/:moduleType/:recordId', async (req, res) => {
    const { moduleType, recordId } = req.params;
    try {
      let record: any = null;

      if (moduleType === 'receipts') {
        const idNum = parseInt(recordId);
        const rows = isNaN(idNum) 
          ? await db.select().from(signedReceipts).where(eq(signedReceipts.receiptNo, recordId)).limit(1)
          : await db.select().from(signedReceipts).where(eq(signedReceipts.id, idNum)).limit(1);
        if (rows.length > 0) record = rows[0];
      } else if (moduleType === 'civil_works' || moduleType === 'contracts') {
        const idNum = parseInt(recordId);
        const rows = isNaN(idNum)
          ? await db.select().from(signedContracts).where(eq(signedContracts.contractNo, recordId)).limit(1)
          : await db.select().from(signedContracts).where(eq(signedContracts.id, idNum)).limit(1);
        if (rows.length > 0) record = rows[0];
      } else if (moduleType === 'blueprints') {
        const idNum = parseInt(recordId);
        if (!isNaN(idNum)) {
          const rows = await db.select().from(drawingTakeoffs).where(eq(drawingTakeoffs.id, idNum)).limit(1);
          if (rows.length > 0) record = rows[0];
        }
      } else if (moduleType === 'pedagogical_lessons') {
        const idNum = parseInt(recordId);
        if (!isNaN(idNum)) {
          const rows = await db.select().from(lessonPlans).where(eq(lessonPlans.id, idNum)).limit(1);
          if (rows.length > 0) record = rows[0];
        }
      } else if (moduleType === 'safety_inspections') {
        const idNum = parseInt(recordId);
        if (!isNaN(idNum)) {
          const rows = await db.select().from(companyDocuments).where(eq(companyDocuments.id, idNum)).limit(1);
          if (rows.length > 0) record = rows[0];
        }
      }

      res.json({ success: true, record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
