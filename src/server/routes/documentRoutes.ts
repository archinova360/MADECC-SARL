import express from 'express';
import { db } from '../../db/index.ts';
import { signedContracts, signedReceipts } from '../../db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { requireStaffOrAdmin } from '../../middleware/auth.ts';
import { sendNotificationEmail, sendEmail } from '../../lib/email.ts';

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
    `);
    documentTablesChecked = true;
  } catch (err) {
    console.warn('[DB Init] Document tables check note:', err);
  }
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
}
