import express from 'express';
import { db } from '../../db/index.ts';
import { 
  supplierSubcontractorCategories, supplierApplications, subcontractorApplications, 
  tenderCategories, tenders, tenderSubmissions, cmsActivityLogs 
} from '../../db/schema.ts';
import { eq, desc, and, sql, or } from 'drizzle-orm';
import { requireAuth, requireAdmin, requireStaffOrAdmin } from '../../middleware/auth.ts';
import { sendNotificationEmail, sendEmail } from '../../lib/email.ts';
import { logAudit } from '../../lib/audit.ts';

  async function ensureTenderDefaults() {
    const existing = await db.select().from(tenders);
    if (existing.length === 0) {
      await db.insert(tenders).values([
        {
          tenderNumber: 'TND-2026-MDCC-001',
          title: 'Subcontract Supply & Erection of Structural Steel Framing for Commercial Complex',
          slug: 'structural-steel-framing-douala',
          categoryName: 'Structural Works',
          clientProject: 'Douala Commercial Hub Phase II',
          location: 'Douala, Littoral Region',
          description: 'MADECC is calling for Expressions of Interest (EOI) from certified structural steel fabrication subcontractors for the supply, galvanization, transport, and site erection of 350 Metric Tons of structural steel framework.',
          scopeOfWork: 'Detailed workshop fabrication drawings, precision CNC steel cutting and welding, anti-corrosion shop primer coating, transport to project site, crane hoisting, and high-strength bolted assembly.',
          eligibility: 'Subcontractors must possess proven technical capacity with minimum 5 years in heavy structural steel works in CEMAC, valid tax compliance certificate, and ISO/HSE safety qualification.',
          requiredExperience: 'Minimum 3 completed structural steel contracts exceeding 100 Tons in Central Africa within the last 5 years.',
          requiredDocuments: 'Company Registration, Tax Clearance, Past Contract Certificates, Key Staff CVs, HSE Policy, Audited Financial Statements.',
          openingDate: new Date(),
          closingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: 'OPEN',
          featured: true
        },
        {
          tenderNumber: 'TND-2026-MDCC-002',
          title: 'Procurement & Delivery of CEM II 42.5N High Grade Portland Cement (Bulk Supply)',
          slug: 'cem-ii-cement-supply-kribi',
          categoryName: 'Materials Supply',
          clientProject: 'Kribi Maritime Logistics Terminal Phase I',
          location: 'Kribi, South Region',
          description: 'Supply agreement for 2,500 Metric Tons of certified CEM II 42.5N bag and bulk cement delivered to MADECC Kribi port site staging area.',
          scopeOfWork: 'Batch supply schedule delivery over 6 months, quality lab test certificates per batch, humidity-protected transport.',
          eligibility: 'Authorized cement manufacturers or primary accredited distributors in Cameroon.',
          openingDate: new Date(),
          closingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: 'OPEN',
          featured: true
        }
      ]);
    }
  }



export function setupProcurementRoutes(app: express.Express) {
  // --- SUPPLIERS & SUBCONTRACTORS ENDPOINTS ---
  // ==========================================
  app.get('/api/admin/suppliers', requireStaffOrAdmin, async (req, res) => {
    try {
      const sups = await db.select().from(supplierApplications).orderBy(desc(supplierApplications.createdAt));
      const subs = await db.select().from(subcontractorApplications).orderBy(desc(subcontractorApplications.createdAt));
      const logs = await db.select().from(cmsActivityLogs).where(eq(cmsActivityLogs.module, 'SUPPLIERS')).orderBy(desc(cmsActivityLogs.timestamp)).limit(50);

      res.json({
        success: true,
        suppliers: sups,
        subcontractors: subs,
        auditLogs: logs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/suppliers/:id/review', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { status, reviewerNotes, assignedReviewer } = req.body;

      await db.update(supplierApplications).set({
        status,
        reviewerNotes,
        assignedReviewer,
        updatedAt: new Date()
      }).where(eq(supplierApplications.id, id));

      await db.insert(cmsActivityLogs).values({
        module: 'SUPPLIERS',
        action: 'REVIEW',
        recordId: String(id),
        recordTitle: `Supplier App #${id}`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Updated supplier status to ${status}. Notes: ${reviewerNotes || 'None'}`
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/subcontractors/:id/review', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { status, reviewerNotes, assignedReviewer } = req.body;

      await db.update(subcontractorApplications).set({
        status,
        reviewerNotes,
        assignedReviewer,
        updatedAt: new Date()
      }).where(eq(subcontractorApplications.id, id));

      await db.insert(cmsActivityLogs).values({
        module: 'SUPPLIERS',
        action: 'REVIEW',
        recordId: String(id),
        recordTitle: `Subcontractor App #${id}`,
        performedBy: req.dbUser?.email || 'Admin',
        details: `Updated subcontractor status to ${status}. Notes: ${reviewerNotes || 'None'}`
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/public/suppliers/register', async (req, res) => {
    try {
      const data = req.body;
      if (!data.companyName || !data.email || !data.phone) {
        return res.status(400).json({ error: 'Company Name, Email and Phone are required' });
      }

      const appNum = `MADECC-SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const inserted = await db.insert(supplierApplications).values({
        applicationNumber: appNum,
        companyName: data.companyName,
        registrationNumber: data.registrationNumber || 'N/A',
        companyType: data.companyType || 'SARL',
        region: data.region || 'Littoral',
        city: data.city || 'Douala',
        address: data.address || 'Douala',
        website: data.website || null,
        contactPerson: data.contactPerson || data.companyName,
        position: data.position || 'General Manager',
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        supplierCategory: data.supplierCategory || 'General Building Materials',
        products: data.products || 'Construction Materials',
        yearsInBusiness: Number(data.yearsInBusiness) || 1,
        capacity: data.capacity || null,
        previousProjects: data.previousProjects || null,
        complianceDocuments: data.complianceDocuments || [],
        declarationAccepted: Boolean(data.declarationAccepted),
        status: 'SUBMITTED'
      }).returning();

      // Dispatch SMTP Email to Admin (kreboya603@gmail.com)
      const adminSubject = `[MADECC GROUP] New Supplier Registration: ${data.companyName} (${appNum})`;
      const adminText = `A new supplier prequalification has been submitted:\n\nApplication Number: ${appNum}\nCompany: ${data.companyName}\nCategory: ${data.supplierCategory || 'General'}\nProducts: ${data.products || 'N/A'}\nContact: ${data.contactPerson} (${data.position})\nEmail: ${data.email}\nPhone: ${data.phone}\nRegion/City: ${data.region || 'Littoral'} - ${data.city || 'Douala'}\nYears in Business: ${data.yearsInBusiness || 1}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-top: 0; font-size: 22px;">New Supplier Registration</h2>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Application Reference:</strong> <span style="font-family: monospace; font-weight: bold; color: #d97706;">${appNum}</span></p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Category:</strong> ${data.supplierCategory || 'General Building Materials'}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Products / Supplies:</strong> ${data.products || 'Construction Materials'}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Contact Person:</strong> ${data.contactPerson} (${data.position || 'General Manager'})</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #f59e0b;">${data.email}</a></p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Phone:</strong> ${data.phone}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Location:</strong> ${data.city || 'Douala'}, ${data.region || 'Littoral'}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">MADECC GROUP Procurement &amp; Supply Chain Management Division</p>
        </div>
      `;
      sendNotificationEmail(adminSubject, adminText, adminHtml, { replyTo: data.email }).catch(err => {
        console.error('Failed to send supplier registration notification:', err);
      });

      // Dispatch Confirmation Email to Supplier from kreboya603@gmail.com
      const supplierSubject = `Supplier Prequalification Received: ${appNum} - MADECC GROUP`;
      const supplierText = `Dear ${data.contactPerson || data.companyName},\n\nThank you for submitting your supplier prequalification application to MADECC GROUP. Your application reference is ${appNum}.\n\nOur procurement board reviews vendor applications within 3 to 5 business days.\n\nWarm regards,\nMADECC GROUP Procurement Directorate`;
      const supplierHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0 0 4px 0; font-weight: 800; font-size: 24px; letter-spacing: 0.05em;">MADECC GROUP</h1>
            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin: 0; font-weight: 700;">Procurement &amp; Supply Chain Directorate</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Dear <strong>${data.contactPerson || data.companyName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
            Thank you for registering <strong>${data.companyName}</strong> in the MADECC GROUP Vendor &amp; Supplier Directory. We have successfully received your prequalification dossier.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Dossier Reference Number:</p>
            <p style="margin: 0 0 12px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #d97706;">${appNum}</p>
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Category:</strong> ${data.supplierCategory || 'General'}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;"><strong>Status:</strong> Under Review by Prequalification Committee</p>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
            Our procurement team evaluates suppliers based on quality standards, delivery reliability, compliance credentials, and competitive pricing. You will be notified once your vendor status is approved.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            MADECC GROUP S.A.R.L. &bull; Yaounde &amp; Douala, Cameroon<br />
            Procurement Desk: <a href="mailto:kreboya603@gmail.com" style="color: #f59e0b; text-decoration: none;">kreboya603@gmail.com</a> | Tel: +237 683 316 486
          </p>
        </div>
      `;
      sendEmail(data.email.trim(), supplierSubject, supplierText, supplierHtml).catch(err => {
        console.error('Failed to send supplier confirmation email:', err);
      });

      res.json({ success: true, applicationNumber: inserted[0].applicationNumber });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/public/subcontractors/register', async (req, res) => {
    try {
      const data = req.body;
      if (!data.companyName || !data.email || !data.phone) {
        return res.status(400).json({ error: 'Company Name, Email and Phone are required' });
      }

      const appNum = `MADECC-SUB-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const inserted = await db.insert(subcontractorApplications).values({
        applicationNumber: appNum,
        companyName: data.companyName,
        trade: data.trade || 'General Civil Works',
        yearsInBusiness: Number(data.yearsInBusiness) || 1,
        workforceSize: Number(data.workforceSize) || 5,
        equipmentOwned: data.equipmentOwned || null,
        previousProjects: data.previousProjects || null,
        region: data.region || 'Littoral',
        city: data.city || 'Douala',
        address: data.address || 'Douala',
        contactPerson: data.contactPerson || data.companyName,
        position: data.position || 'Director',
        email: data.email,
        phone: data.phone,
        whatsapp: data.whatsapp || null,
        complianceDocuments: data.complianceDocuments || [],
        declarationAccepted: Boolean(data.declarationAccepted),
        status: 'SUBMITTED'
      }).returning();

      // Dispatch SMTP Email to Admin (kreboya603@gmail.com)
      const adminSubject = `[MADECC GROUP] New Subcontractor Registration: ${data.companyName} (${appNum})`;
      const adminText = `A new subcontractor prequalification has been submitted:\n\nApplication Number: ${appNum}\nCompany: ${data.companyName}\nTrade: ${data.trade || 'General Civil Works'}\nWorkforce Size: ${data.workforceSize || 5}\nContact: ${data.contactPerson} (${data.position})\nEmail: ${data.email}\nPhone: ${data.phone}\nRegion/City: ${data.region || 'Littoral'} - ${data.city || 'Douala'}`;
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-top: 0; font-size: 22px;">New Subcontractor Registration</h2>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Application Reference:</strong> <span style="font-family: monospace; font-weight: bold; color: #d97706;">${appNum}</span></p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Trade / Specialty:</strong> ${data.trade || 'General Civil Works'}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Workforce Size:</strong> ${data.workforceSize || 5} workers</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Contact Person:</strong> ${data.contactPerson} (${data.position || 'Director'})</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${data.email}" style="color: #f59e0b;">${data.email}</a></p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Phone:</strong> ${data.phone}</p>
          <p style="font-size: 15px; margin: 8px 0;"><strong>Location:</strong> ${data.city || 'Douala'}, ${data.region || 'Littoral'}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">MADECC GROUP Project Subcontracting &amp; Engineering Operations</p>
        </div>
      `;
      sendNotificationEmail(adminSubject, adminText, adminHtml, { replyTo: data.email }).catch(err => {
        console.error('Failed to send subcontractor registration notification:', err);
      });

      // Dispatch Confirmation Email to Subcontractor from kreboya603@gmail.com
      const subSubject = `Subcontractor Registration Received: ${appNum} - MADECC GROUP`;
      const subText = `Dear ${data.contactPerson || data.companyName},\n\nThank you for registering ${data.companyName} as a prospective subcontractor with MADECC GROUP. Your application reference is ${appNum}.\n\nOur engineering operations team will review your dossier and reach out for upcoming project tenders.\n\nWarm regards,\nMADECC GROUP Operations Directorate`;
      const subHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0 0 4px 0; font-weight: 800; font-size: 24px; letter-spacing: 0.05em;">MADECC GROUP</h1>
            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin: 0; font-weight: 700;">Subcontracting &amp; Works Directorate</p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Dear <strong>${data.contactPerson || data.companyName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
            Thank you for registering <strong>${data.companyName}</strong> as a qualified subcontractor for MADECC GROUP projects. We have successfully received your trade profile and qualification dossier.
          </p>
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px 0; font-size: 13px; color: #64748b;">Registration Reference Code:</p>
            <p style="margin: 0 0 12px 0; font-family: monospace; font-size: 18px; font-weight: bold; color: #d97706;">${appNum}</p>
            <p style="margin: 0; font-size: 13px; color: #334155;"><strong>Specialty Trade:</strong> ${data.trade || 'General Civil Works'}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #334155;"><strong>Status:</strong> Dossier Logged for Works Assignment</p>
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
            Our site project directors consult our verified subcontractor register when awarding specialized civil, electrical, plumbing, masonry, and finishing subcontract packages.
          </p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            MADECC GROUP S.A.R.L. &bull; Yaounde &amp; Douala, Cameroon<br />
            Subcontracts Desk: <a href="mailto:kreboya603@gmail.com" style="color: #f59e0b; text-decoration: none;">kreboya603@gmail.com</a> | Tel: +237 683 316 486
          </p>
        </div>
      `;
      sendEmail(data.email.trim(), subSubject, subText, subHtml).catch(err => {
        console.error('Failed to send subcontractor confirmation email:', err);
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Helper function to auto-seed default Tenders

  // --- TENDERS & OPPORTUNITIES ENDPOINTS ---
  // ==========================================
  app.get('/api/admin/tenders', requireStaffOrAdmin, async (req, res) => {
    try {
      await ensureTenderDefaults();
      const allTenders = await db.select().from(tenders).orderBy(desc(tenders.createdAt));
      const submissions = await db.select().from(tenderSubmissions).orderBy(desc(tenderSubmissions.createdAt));
      const logs = await db.select().from(cmsActivityLogs).where(eq(cmsActivityLogs.module, 'TENDERS')).orderBy(desc(cmsActivityLogs.timestamp)).limit(50);

      res.json({
        success: true,
        tenders: allTenders,
        eois: submissions,
        auditLogs: logs
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/tenders', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const data = req.body;
      const cleanSlug = data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      let record;

      if (data.id) {
        const updated = await db.update(tenders).set({
          tenderNumber: data.tenderNumber,
          title: data.title,
          slug: cleanSlug,
          categoryId: data.categoryId || null,
          categoryName: data.categoryName || 'Construction',
          clientProject: data.clientProject,
          location: data.location,
          description: data.description,
          scopeOfWork: data.scopeOfWork,
          eligibility: data.eligibility,
          requiredExperience: data.requiredExperience || null,
          requiredDocuments: data.requiredDocuments || null,
          submissionMethod: data.submissionMethod || 'Online Submission & Hard Copy at MADECC Douala Head Office',
          closingDate: new Date(data.closingDate),
          status: data.status || 'OPEN',
          contactInstructions: data.contactInstructions || 'Contact procurement@madeccgroup.com',
          attachments: data.attachments || [],
          featured: Boolean(data.featured),
          displayOrder: Number(data.displayOrder) || 1,
          seoTitle: data.seoTitle || null,
          seoDescription: data.seoDescription || null,
          updatedAt: new Date()
        }).where(eq(tenders.id, Number(data.id))).returning();
        record = updated[0];
      } else {
        const inserted = await db.insert(tenders).values({
          tenderNumber: data.tenderNumber,
          title: data.title,
          slug: cleanSlug,
          categoryId: data.categoryId || null,
          categoryName: data.categoryName || 'Construction',
          clientProject: data.clientProject,
          location: data.location,
          description: data.description,
          scopeOfWork: data.scopeOfWork,
          eligibility: data.eligibility,
          requiredExperience: data.requiredExperience || null,
          requiredDocuments: data.requiredDocuments || null,
          submissionMethod: data.submissionMethod || 'Online Submission & Hard Copy at MADECC Douala Head Office',
          openingDate: data.openingDate ? new Date(data.openingDate) : new Date(),
          closingDate: new Date(data.closingDate),
          status: data.status || 'OPEN',
          contactInstructions: data.contactInstructions || 'Contact procurement@madeccgroup.com',
          attachments: data.attachments || [],
          featured: Boolean(data.featured),
          displayOrder: Number(data.displayOrder) || 1,
          createdBy: req.dbUser?.email || 'Admin'
        }).returning();
        record = inserted[0];
      }

      await db.insert(cmsActivityLogs).values({
        module: 'TENDERS',
        action: data.id ? 'EDIT' : 'CREATE',
        recordId: String(record.id),
        recordTitle: record.tenderNumber,
        performedBy: req.dbUser?.email || 'Admin',
        details: `${data.id ? 'Updated' : 'Created'} tender notice ${record.tenderNumber}`
      });

      res.json({ success: true, tender: record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/tenders/:id/status', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      await db.update(tenders).set({ status, updatedAt: new Date() }).where(eq(tenders.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/tenders/:id', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      await db.delete(tenders).where(eq(tenders.id, id));
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/admin/tenders/eois/:id/review', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const { status, reviewNotes, notifyCandidate } = req.body;
      const updated = await db.update(tenderSubmissions).set({
        status,
        internalEvaluationNotes: reviewNotes,
        evaluatedBy: req.dbUser?.email || 'Procurement Committee'
      }).where(eq(tenderSubmissions.id, id)).returning();

      if (updated.length > 0) {
        const eoi = updated[0];
        // Log activity
        await db.insert(cmsActivityLogs).values({
          module: 'TENDERS',
          action: 'REVIEW',
          recordId: String(eoi.id),
          recordTitle: `EOI ${eoi.submissionNumber} - ${eoi.companyName} (${status})`,
          performedBy: req.dbUser?.email || 'Procurement Admin',
          details: JSON.stringify({ status, reviewNotes, companyName: eoi.companyName, tenderReference: eoi.tenderReference })
        }).catch(e => console.warn('[LOG_ERROR]', e));

        // Send update email to candidate if requested or status changed
        if (notifyCandidate && eoi.email) {
          const statusText = status.replace(/_/g, ' ');
          const emailSubject = `Update on Expression of Interest ${eoi.submissionNumber} -- ${eoi.tenderReference}`;
          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
              <div style="background: #0f172a; padding: 24px; text-align: center; border-bottom: 4px solid #d97706;">
                <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">MADECC GROUP PLC</h2>
                <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px;">Procurement & Contracts Committee</p>
              </div>
              <div style="padding: 24px; background: #ffffff;">
                <p>Dear <strong>${eoi.contactPerson || eoi.companyName}</strong>,</p>
                <p>We are writing to provide an update regarding your Expression of Interest (Ref: <strong>${eoi.submissionNumber}</strong>) for tender <strong>${eoi.tenderReference}</strong>.</p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 16px 0;">
                  <p style="margin: 0 0 8px 0;"><strong>Status:</strong> <span style="display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-weight: bold;">${statusText}</span></p>
                  ${reviewNotes ? `<p style="margin: 0;"><strong>Committee Remarks:</strong> ${reviewNotes}</p>` : ''}
                </div>
                <p>If you have any questions or require further details, please reach out to our procurement office at <a href="mailto:procurement@madeccgroup.com" style="color: #d97706;">procurement@madeccgroup.com</a> or call +237 683 316 486.</p>
                <p style="margin-top: 24px;">Sincerely,<br><strong>MADECC GROUP Procurement Board</strong><br>Yaounde & Douala, Cameroon</p>
              </div>
            </div>
          `;
          await sendEmail(eoi.email, emailSubject, `Your EOI ${eoi.submissionNumber} status has been updated to ${statusText}. Remarks: ${reviewNotes || 'None'}`, emailHtml).catch(err => {
            console.error('[SMTP_CANDIDATE_EMAIL_ERROR]', err);
          });
        }
      }

      res.json({ success: true, eoi: updated[0] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/public/tenders', async (req, res) => {
    try {
      await ensureTenderDefaults();
      const openTenders = await db.select().from(tenders).where(or(eq(tenders.status, 'OPEN'), eq(tenders.status, 'CLOSING_SOON'))).orderBy(desc(tenders.createdAt));
      res.json({ success: true, tenders: openTenders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/public/tenders/:id/submit-interest', async (req, res) => {
    try {
      const tenderId = Number(req.params.id);
      const data = req.body;
      if (!data.companyName || !data.email || !data.phone) {
        return res.status(400).json({ error: 'Company name, email address, and phone number are required.' });
      }

      // Fetch tender information for context
      let tenderInfo: any = null;
      try {
        const found = await db.select().from(tenders).where(eq(tenders.id, tenderId));
        if (found.length > 0) tenderInfo = found[0];
      } catch (err) {
        console.warn('[TENDER_FETCH_ERR]', err);
      }

      const tenderRef = tenderInfo?.tenderNumber || data.tenderReference || `TND-${tenderId}`;
      const tenderTitle = tenderInfo?.title || 'Subcontract Supply & Erection of Structural Steel Framing for Commercial Complex';
      const eoiNum = `EOI-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      const inserted = await db.insert(tenderSubmissions).values({
        submissionNumber: eoiNum,
        tenderId,
        tenderReference: tenderRef,
        companyName: data.companyName,
        contactPerson: data.contactPerson || 'N/A',
        email: data.email,
        phone: data.phone,
        expressionOfInterest: data.expressionOfInterest || 'Submitted Expression of Interest',
        supportingDocuments: data.supportingDocuments || [],
        status: 'SUBMITTED'
      }).returning();

      const newSubmission = inserted[0];

      // Log activity in CMS audit logs
      await db.insert(cmsActivityLogs).values({
        module: 'TENDERS',
        action: 'SUBMIT',
        recordId: String(newSubmission.id),
        recordTitle: `EOI ${eoiNum} - ${data.companyName} (${tenderRef})`,
        performedBy: data.email,
        details: JSON.stringify({
          submissionNumber: eoiNum,
          tenderReference: tenderRef,
          companyName: data.companyName,
          contactPerson: data.contactPerson,
          email: data.email,
          phone: data.phone,
          documentsCount: (data.supportingDocuments || []).length
        })
      }).catch(e => console.warn('[LOG_ERROR]', e));

      // Build document links HTML for emails
      const docsListHtml = (data.supportingDocuments && data.supportingDocuments.length > 0)
        ? data.supportingDocuments.map((doc: any, i: number) => {
            const title = doc.title || doc.fileName || `Technical Dossier File ${i + 1}`;
            const url = doc.fileUrl || doc.url || '#';
            const size = doc.fileSize ? ` -- ${(doc.fileSize / 1024).toFixed(1)} KB` : '';
            return `<li style="margin-bottom: 8px;"><a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #2563eb; text-decoration: underline; font-weight: 600;">[INBOX] ${title}</a> <span style="color: #64748b; font-size: 12px;">(${doc.fileType || 'Document'}${size})</span></li>`;
          }).join('')
        : '<li>No separate digital file attachments provided.</li>';

      // 1. Dispatch Email to Admins (kreboya603@gmail.com and madeccco5@gmail.com)
      const adminSubject = `[EOI Submitted] ${tenderRef} -- ${data.companyName} (${eoiNum})`;
      const adminText = `
New Expression of Interest (EOI) Submitted:
Submission Ref: ${eoiNum}
Tender Ref: ${tenderRef}
Tender Title: ${tenderTitle}

=== COMPANY & CANDIDATE DETAILS ===
Company Name: ${data.companyName}
Contact Person: ${data.contactPerson || 'N/A'}
Official Email: ${data.email}
Phone / WhatsApp: ${data.phone}
Submission Time: ${new Date().toUTCString()}

=== TECHNICAL CAPACITY & EXECUTION SUMMARY ===
${data.expressionOfInterest || 'N/A'}

=== ATTACHED TECHNICAL DOSSIERS (Supabase / Cloudinary / Storage) ===
${(data.supportingDocuments || []).map((d: any, idx: number) => `[${idx + 1}] ${d.title || d.fileName || 'Dossier'}: ${d.fileUrl || d.url}`).join('\n') || 'None'}

Database Record: Persisted in live Neon PostgreSQL (tender_submissions table).
Notification sent to: kreboya603@gmail.com, madeccco5@gmail.com
      `;

      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <div style="background: #0f172a; padding: 20px 24px; text-align: center; border-bottom: 4px solid #d97706;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 0.5px;">MADECC GROUP -- PROCUREMENT & TENDERS</h2>
            <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px;">New Candidate Expression of Interest (EOI) Received</p>
          </div>
          <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
            <div style="background: #f8fafc; border-left: 4px solid #d97706; padding: 12px 16px; margin-bottom: 20px; border-radius: 0 6px 6px 0;">
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #0f172a;">Tender Reference: ${tenderRef}</p>
              <p style="margin: 4px 0 0 0; font-size: 13px; color: #475569;">${tenderTitle}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #64748b;">EOI Reference:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #d97706; font-family: monospace; font-size: 15px;">${eoiNum}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Company Name:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${data.companyName}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Contact Person:</td>
                <td style="padding: 8px 0; color: #0f172a;">${data.contactPerson || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Official Email:</td>
                <td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #2563eb; text-decoration: none; font-weight: 600;">${data.email}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Phone / WhatsApp:</td>
                <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${data.phone}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Submission Timestamp:</td>
                <td style="padding: 8px 0; color: #64748b;">${new Date().toLocaleString()} (WAT)</td>
              </tr>
            </table>

            <div style="margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">Technical Capacity &amp; Execution Statement:</h4>
              <div style="background: #f8fafc; padding: 14px 16px; border-radius: 6px; font-size: 13px; color: #334155; white-space: pre-wrap; border: 1px solid #e2e8f0; line-height: 1.6;">
                ${data.expressionOfInterest || 'No statement provided.'}
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 14px;">Attached Technical Dossiers (Direct Download):</h4>
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 12px 16px; margin-bottom: 12px;">
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #166534;">
                  ${docsListHtml}
                </ul>
              </div>
              <p style="font-size: 11px; color: #64748b; margin: 4px 0 0 0;">Files are securely stored via Supabase Storage / Cloudinary CDN and linked in Neon PostgreSQL.</p>
            </div>

            <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
              <p style="font-size: 12px; color: #64748b; margin: 0;">This notification has been dispatched to <strong>kreboya603@gmail.com</strong> and <strong>madeccco5@gmail.com</strong>.</p>
              <p style="font-size: 11px; color: #94a3b8; margin: 4px 0 0 0;">Log into the MADECC Procurement Dashboard to review candidate dossiers, update prequalification status, or export formal evaluation reports as A4 PDF.</p>
            </div>
          </div>
        </div>
      `;

      sendNotificationEmail(adminSubject, adminText, adminHtml, { replyTo: data.email }).catch(err => {
        console.error('[SMTP_ADMIN_NOTIFICATION_ERROR]', err);
      });

      // 2. Dispatch Confirmation Email to the Submitter
      const candidateSubject = `Receipt Confirmation: Expression of Interest -- ${tenderRef} (${eoiNum})`;
      const candidateText = `
Dear ${data.contactPerson || data.companyName},

Thank you for submitting your Expression of Interest (EOI) for:
Tender Reference: ${tenderRef}
Tender Title: ${tenderTitle}
Submission Number: ${eoiNum}

Your submission has been logged into the MADECC GROUP Procurement System and forwarded to the Technical Evaluation Committee.

Next Steps:
- Technical Evaluation: Our engineering team will assess your capacity dossier against the minimum qualification criteria.
- Shortlisting: Prequalified contractors will be contacted directly with the comprehensive Request for Proposals (RFP).

For any enquiries, please reply to this email or contact us at procurement@madeccgroup.com.

Best regards,
MADECC GROUP Procurement Department
Yaounde Mbankolo & Douala, Cameroon
Phone: +237 683 316 486
      `;

      const candidateHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
          <div style="background: #0f172a; padding: 24px; text-align: center; border-bottom: 4px solid #d97706;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; letter-spacing: 1px;">MADECC GROUP PLC</h2>
            <p style="color: #cbd5e1; margin: 4px 0 0 0; font-size: 13px;">Official Procurement & Tendering Department</p>
          </div>
          <div style="padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-top: none;">
            <p style="font-size: 15px; margin-top: 0;">Dear <strong>${data.contactPerson || data.companyName}</strong>,</p>
            <p>Thank you for submitting your formal Expression of Interest (EOI) to partner with MADECC GROUP.</p>
            
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #64748b; width: 40%;">Submission Code:</td>
                  <td style="padding: 6px 0; font-weight: bold; color: #d97706;">${eoiNum}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Tender Reference:</td>
                  <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${tenderRef}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Project Title:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${tenderTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Registered Enterprise:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${data.companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-weight: bold; color: #64748b;">Receipt Timestamp:</td>
                  <td style="padding: 6px 0; color: #0f172a;">${new Date().toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <h4 style="color: #0f172a; margin: 16px 0 8px 0; font-size: 14px;">Next Evaluation Milestones:</h4>
            <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">
              <li style="margin-bottom: 6px;">Technical review of company registration, tax compliance, and structural machinery capacity.</li>
              <li style="margin-bottom: 6px;">Publication of prequalified subcontractor shortlist following committee evaluation.</li>
              <li style="margin-bottom: 6px;">Issuance of full tender dossiers and workshop design specs to shortlisted bidders.</li>
            </ol>

            <div style="background: #f1f5f9; padding: 14px 16px; border-radius: 6px; margin-top: 20px; font-size: 12px; color: #475569;">
              <strong>Procurement Inquiries:</strong><br>
              Email: <a href="mailto:procurement@madeccgroup.com" style="color: #d97706; text-decoration: none;">procurement@madeccgroup.com</a> | <a href="mailto:kreboya603@gmail.com" style="color: #d97706; text-decoration: none;">kreboya603@gmail.com</a> | <a href="mailto:madeccco5@gmail.com" style="color: #d97706; text-decoration: none;">madeccco5@gmail.com</a><br>
              Phone / WhatsApp: +237 683 316 486 * Yaounde Mbankolo & Douala, Cameroon
            </div>

            <p style="margin-top: 24px; font-size: 13px; color: #64748b;">Sincerely,<br><strong style="color: #0f172a;">MADECC GROUP Procurement Board</strong></p>
          </div>
        </div>
      `;

      sendEmail(data.email, candidateSubject, candidateText, candidateHtml).catch(err => {
        console.error('[SMTP_CANDIDATE_CONFIRMATION_ERROR]', err);
      });

      res.json({
        success: true,
        submissionNumber: eoiNum,
        tenderReference: tenderRef,
        message: 'Your Expression of Interest has been recorded successfully. Confirmation has been sent to your email.'
      });
    } catch (error: any) {
      console.error('[SUBMIT_EOI_ERROR]', error);
      res.status(500).json({ error: error.message || 'Failed to submit expression of interest' });
    }
  });



}
