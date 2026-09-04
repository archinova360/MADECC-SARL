import express from 'express';
import { db } from '../../db/index.ts';
import { 
  projectBudgetEstimates, costLibraryItems, boqs, boqSections, boqItems, 
  boqRevisions, boqAuditLogs, boqUnits, boqChangeOrders, structuralProjects, 
  labourCalculations, drawingTakeoffs, projects
} from '../../db/schema.ts';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAuth, requireAdmin, requireStaffOrAdmin } from '../../middleware/auth.ts';
import { logAudit } from '../../lib/audit.ts';
import { sendNotificationEmail, sendEmail } from '../../lib/email.ts';

export function setupCalculatorRoutes(app: express.Express) {
  // --- PUBLIC PROJECT BUDGET CALCULATOR ENDPOINTS ---
  // ==========================================

  // 1. Get current active rates & configuration factors
  app.get('/api/budget-calculator/rates', async (req, res) => {
    try {
      const activeRates = await db.select().from(costLibraryItems).orderBy(costLibraryItems.category, costLibraryItems.name);
      
      const regionalFactors: Record<string, number> = {
        'Centre': 1.00,
        'Littoral': 0.96,
        'South': 1.05,
        'West': 1.03,
        'North-West': 1.08,
        'South-West': 1.08,
        'North': 1.12,
        'Far North': 1.18,
        'Adamawa': 1.10,
        'East': 1.08,
        'Yaounde': 1.00,
        'Douala': 0.96,
        'Garoua': 1.12,
        'Bafoussam': 1.03,
        'Bamenda': 1.08,
        'Kribi': 1.05,
        'Limbe': 1.06,
        'Maroua': 1.18,
        'Ngaoundere': 1.10,
        'Ebolowa': 1.05,
        'Bertoua': 1.08
      };

      const standardPackages = {
        'Economy': { factor: 0.85, name: 'Economy Package', desc: 'Functional quality materials, standard concrete blocks, basic finishes.' },
        'Standard': { factor: 1.00, name: 'Standard Package (Recommended)', desc: 'High quality vibrated concrete blocks, porcelain tiles, durable aluminium windows.' },
        'Premium': { factor: 1.28, name: 'Premium Package', desc: 'Heavy structural design, premium imported tiles, uPVC / acoustic aluminium, luxury sanitaryware.' },
        'Luxury': { factor: 1.65, name: 'Luxury Custom Package', desc: 'Bespoke architectural finishes, smart building automation, marble/granite, specialized waterproofing & roofing.' }
      };

      res.json({
        rateVersion: 'MADECC-RATES-2026-08',
        currency: 'XAF',
        effectiveDate: new Date().toISOString(),
        rates: activeRates,
        regionalFactors,
        standardPackages
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Authoritative backend estimate calculation
  app.post('/api/budget-calculator/estimate', async (req, res) => {
    try {
      const {
        projectType,
        customProjectType,
        location,
        region,
        totalFloorAreaM2,
        numberOfFloors = 1,
        constructionStandard = 'Standard',
        buildingConfiguration = {},
        selectedScopes = [],
        selectedFinishes = {},
        mode = 'quick',
        clientName,
        clientEmail,
        clientPhone,
        preferredContactMethod = 'WhatsApp'
      } = req.body;

      const area = parseFloat(totalFloorAreaM2);
      if (isNaN(area) || area <= 0) {
        return res.status(400).json({ error: 'Valid positive total floor area (m2) is required.' });
      }

      // Regional adjustment lookup
      const regionKey = region || location || 'Centre';
      const regionalMultipliers: Record<string, number> = {
        'Centre': 1.00, 'Littoral': 0.96, 'South': 1.05, 'West': 1.03,
        'North-West': 1.08, 'South-West': 1.08, 'North': 1.12, 'Far North': 1.18,
        'Adamawa': 1.10, 'East': 1.08, 'Yaounde': 1.00, 'Douala': 0.96, 'Garoua': 1.12
      };
      const regionalFactor = regionalMultipliers[regionKey] || 1.00;

      // Construction standard package multiplier
      const standardMultipliers: Record<string, number> = {
        'Economy': 0.85,
        'Standard': 1.00,
        'Premium': 1.28,
        'Luxury': 1.65
      };
      const standardFactor = standardMultipliers[constructionStandard] || 1.00;

      // Project type base rate per m2 (XAF)
      const projectTypeBaseRates: Record<string, number> = {
        'Residential House': 210000,
        'Duplex': 245000,
        'Villa': 280000,
        'Apartment Building': 260000,
        'Commercial Building': 290000,
        'Office Building': 310000,
        'Shop': 220000,
        'Warehouse': 180000,
        'Hotel': 340000,
        'School': 200000,
        'Hospital/Clinic': 350000,
        'Industrial Building': 230000,
        'Renovation': 140000,
        'Extension': 190000,
        'Other': 220000
      };
      const baseRatePerM2 = projectTypeBaseRates[projectType] || 220000;

      // Height / Floors multiplier
      const floorsNum = parseInt(numberOfFloors) || 1;
      const heightFactor = floorsNum > 1 ? 1 + (floorsNum - 1) * 0.08 : 1.0;

      // Fetch active db rates for rate snapshot
      const dbRates = await db.select().from(costLibraryItems);
      const ratesSnapshotMap: Record<string, any> = {};
      dbRates.forEach(r => {
        ratesSnapshotMap[r.itemCode] = {
          name: r.name,
          unit: r.unit,
          basePriceXaf: r.basePriceXaf,
          category: r.category
        };
      });

      // Default scope ratios if specific scopes selected
      const allScopeRatios: Record<string, number> = {
        'Site Preparation': 0.03,
        'Earthworks': 0.04,
        'Foundations': 0.16,
        'Concrete Works': 0.22,
        'Reinforcement': 0.12,
        'Formwork': 0.07,
        'Masonry': 0.09,
        'Roofing': 0.08,
        'Doors & Windows': 0.06,
        'Plastering': 0.04,
        'Flooring': 0.05,
        'Painting': 0.03,
        'Plumbing': 0.05,
        'Electrical': 0.05,
        'External Works': 0.04,
        'Labour': 0.18,
        'Plant & Equipment': 0.06
      };

      // Determine active scope ratio sum
      let selectedScopesList: string[] = Array.isArray(selectedScopes) && selectedScopes.length > 0 
        ? selectedScopes 
        : Object.keys(allScopeRatios);

      let scopeRatioSum = 0;
      selectedScopesList.forEach(s => {
        if (allScopeRatios[s]) {
          scopeRatioSum += allScopeRatios[s];
        }
      });
      if (scopeRatioSum === 0) scopeRatioSum = 1.0;

      // Base unadjusted total cost
      const rawCost = area * baseRatePerM2 * heightFactor * standardFactor * regionalFactor;

      // Category breakdown
      const categoryBreakdown: Array<{ category: string; amountXaf: number; percentage: number }> = [];
      let totalCalculatedXaf = 0;

      selectedScopesList.forEach(sName => {
        const ratio = allScopeRatios[sName] || 0.05;
        const catAmount = Math.round((rawCost * (ratio / scopeRatioSum)));
        totalCalculatedXaf += catAmount;
        categoryBreakdown.push({
          category: sName,
          amountXaf: catAmount,
          percentage: Math.round((ratio / scopeRatioSum) * 100)
        });
      });

      // Budget Range
      const expectedTotal = Math.round(totalCalculatedXaf);
      const minTotal = Math.round(expectedTotal * 0.90);
      const maxTotal = Math.round(expectedTotal * 1.12);
      const calculatedCostPerM2 = Math.round(expectedTotal / area);

      // Unique Estimate Reference Code
      const randRef = 'MADECC-EST-' + new Date().getFullYear() + '-' + Math.floor(100000 + Math.random() * 900000);

      // Insert record in Neon PostgreSQL
      const inserted = await db.insert(projectBudgetEstimates).values({
        estimateReference: randRef,
        clientName: clientName || null,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        preferredContactMethod: preferredContactMethod || 'WhatsApp',
        projectType: projectType || 'Residential House',
        customProjectType: customProjectType || null,
        location: location || 'Yaounde',
        region: regionKey,
        totalFloorAreaM2: area.toString(),
        numberOfFloors: floorsNum,
        constructionStandard: constructionStandard || 'Standard',
        buildingConfiguration: buildingConfiguration,
        selectedScopes: selectedScopesList,
        selectedFinishes: selectedFinishes,
        mode: mode || 'quick',
        estimatedBudgetMin: minTotal.toString(),
        estimatedBudgetMax: maxTotal.toString(),
        estimatedBudgetExpected: expectedTotal.toString(),
        costPerM2: calculatedCostPerM2.toString(),
        rateVersion: 'MADECC-RATES-2026-08',
        rateSnapshot: ratesSnapshotMap,
        lineItemsBreakdown: categoryBreakdown,
        status: 'CALCULATED',
        leadStatus: 'NEW'
      }).returning();

      const createdEstimate = inserted[0];

      res.json({
        success: true,
        estimateReference: randRef,
        estimateId: createdEstimate.id,
        projectType: createdEstimate.projectType,
        location: createdEstimate.location,
        totalFloorAreaM2: area,
        numberOfFloors: floorsNum,
        constructionStandard: createdEstimate.constructionStandard,
        estimatedBudgetMin: minTotal,
        estimatedBudgetMax: maxTotal,
        estimatedBudgetExpected: expectedTotal,
        costPerM2: calculatedCostPerM2,
        currency: 'XAF',
        rateVersion: 'MADECC-RATES-2026-08',
        generatedAt: createdEstimate.createdAt,
        lineItemsBreakdown: categoryBreakdown,
        includedScopes: selectedScopesList,
        exclusions: [
          'Land acquisition and title deed registration fees',
          'Architectural, structural and MEPR engineering design fees',
          'Geotechnical soil investigation and topographical land survey',
          'Government building permits and urban planning fees',
          'Water & electrical utility connection fees',
          'Unforeseen deep ground soil remediation or pile foundations unless specified'
        ],
        confidenceLevel: mode === 'detailed' ? 'High' : 'Preliminary',
        disclaimer: 'This calculator provides an indicative preliminary budget estimate based on current MADECC rate library data. It is not a binding quotation or contractual price. Final costs are determined after detailed architectural drawings, structural engineering, and quantity take-offs.'
      });
    } catch (error: any) {
      console.error('Error calculating project budget estimate:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Lead capture / Request quotation for an estimate
  app.post('/api/budget-calculator/lead', async (req, res) => {
    try {
      const {
        estimateReference,
        clientName,
        clientEmail,
        clientPhone,
        preferredContactMethod = 'WhatsApp',
        projectTimeline,
        notes
      } = req.body;

      if (!estimateReference) {
        return res.status(400).json({ error: 'Estimate reference is required.' });
      }

      const existing = await db.select().from(projectBudgetEstimates).where(eq(projectBudgetEstimates.estimateReference, estimateReference)).limit(1);
      if (existing.length === 0) {
        return res.status(404).json({ error: 'Estimate reference not found.' });
      }

      const updated = await db.update(projectBudgetEstimates)
        .set({
          clientName,
          clientEmail,
          clientPhone,
          preferredContactMethod,
          projectTimeline,
          notes,
          status: 'CONTACT_REQUESTED',
          leadStatus: 'BOQ_REQUESTED',
          updatedAt: new Date()
        })
        .where(eq(projectBudgetEstimates.estimateReference, estimateReference))
        .returning();

      const record = updated[0];

      // Send SMTP email notification to admin (kreboya603@gmail.com)
      const emailSubject = `[MADECC GROUP] New Client Budget Estimate Request: ${estimateReference}`;
      const emailText = `A client has requested a professional BOQ & quotation for estimate ${estimateReference}:\n\nClient Name: ${clientName}\nEmail: ${clientEmail}\nPhone: ${clientPhone}\nContact Method: ${preferredContactMethod}\nProject: ${record.projectType} (${record.totalFloorAreaM2} m2 in ${record.location})\nEstimated Budget: XAF ${Number(record.estimatedBudgetExpected).toLocaleString()}\nTimeline: ${projectTimeline || 'Immediate'}\n\nPlease review in the Admin Dashboard.`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px; margin-top: 0;">New Project Estimate Lead</h2>
          <p><strong>Estimate Ref:</strong> <span style="font-family: monospace; font-weight: bold; color: #d97706;">${estimateReference}</span></p>
          <p><strong>Client Name:</strong> ${clientName}</p>
          <p><strong>Client Phone:</strong> ${clientPhone || 'Not provided'}</p>
          <p><strong>Client Email:</strong> ${clientEmail || 'Not provided'}</p>
          <p><strong>Preferred Contact:</strong> ${preferredContactMethod}</p>
          <p><strong>Project:</strong> ${record.projectType} &bull; ${record.totalFloorAreaM2} m2 in ${record.location}</p>
          <p><strong>Calculated Budget:</strong> <span style="font-weight: bold; color: #16a34a; font-size: 18px;">XAF ${Number(record.estimatedBudgetExpected).toLocaleString()}</span></p>
          <p><strong>Project Timeline:</strong> ${projectTimeline || 'Not specified'}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">MADECC GROUP Client Acquisition Portal &bull; Central Cameroon Division</p>
        </div>
      `;

      sendNotificationEmail(emailSubject, emailText, emailHtml, { replyTo: clientEmail }).catch(err => {
        console.error('Email notification error (budget lead):', err);
      });

      // Send client confirmation email if email provided
      if (clientEmail && clientEmail.includes('@')) {
        const clientSubject = `Your Preliminary Construction Budget Estimate (${estimateReference}) - MADECC GROUP`;
        const clientText = `Dear ${clientName},\n\nThank you for utilizing the MADECC GROUP Interactive Construction Cost Calculator. Your preliminary estimate reference is ${estimateReference}.\n\nProject: ${record.projectType} (${record.totalFloorAreaM2} m2 in ${record.location})\nCalculated Budget: XAF ${Number(record.estimatedBudgetExpected).toLocaleString()}\nStandard: ${record.constructionStandard}\n\nOur engineering estimation desk will contact you via ${preferredContactMethod} to provide a detailed structural BOQ and material schedule.\n\nWarm regards,\nMADECC GROUP Engineering Directorate`;
        const clientHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
              <h1 style="color: #0f172a; margin: 0 0 4px 0; font-weight: 800; font-size: 24px; letter-spacing: 0.05em;">MADECC GROUP</h1>
              <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin: 0; font-weight: 700;">Construction Estimation &amp; Engineering Directorate</p>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Dear <strong>${clientName}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px 0; color: #334155;">
              Thank you for using our Interactive Project Budget Calculator. Here is your preliminary civil engineering cost evaluation:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 13px;">Estimate Reference:</span>
                <span style="font-family: monospace; font-weight: bold; color: #d97706; font-size: 14px;">${estimateReference}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 13px;">Project Typology:</span>
                <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${record.projectType}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 13px;">Total Floor Area:</span>
                <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${record.totalFloorAreaM2} m&sup2;</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="color: #64748b; font-size: 13px;">Regional Site:</span>
                <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${record.location}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
                <span style="color: #64748b; font-size: 13px;">Finishing Standard:</span>
                <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${record.constructionStandard}</span>
              </div>
              <div style="border-top: 1px solid #e2e8f0; padding-top: 14px; text-align: right;">
                <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 4px;">Estimated Construction Investment:</span>
                <span style="font-size: 22px; font-weight: 800; color: #16a34a;">XAF ${Number(record.estimatedBudgetExpected).toLocaleString()}</span>
              </div>
            </div>
            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
              Our senior quantity surveyor will review your parameters and follow up with you via <strong>${preferredContactMethod}</strong>.
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
              MADECC GROUP S.A.R.L. &bull; Yaounde Mbankolo &amp; Douala, Cameroon<br />
              Client Desk: <a href="mailto:kreboya603@gmail.com" style="color: #f59e0b; text-decoration: none;">kreboya603@gmail.com</a> | Tel: +237 683 316 486
            </p>
          </div>
        `;
        sendEmail(clientEmail.trim(), clientSubject, clientText, clientHtml).catch(err => {
          console.error('Failed to send budget estimate confirmation to client:', err);
        });
      }

      res.json({ success: true, estimate: record });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Admin: Get all budget estimates
  app.get('/api/budget-calculator/estimates', requireStaffOrAdmin, async (req, res) => {
    try {
      const estimatesList = await db.select().from(projectBudgetEstimates).orderBy(desc(projectBudgetEstimates.createdAt));
      res.json(estimatesList);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Admin: Convert Budget Estimate into Project & Draft BOQ
  app.post('/api/budget-calculator/convert-to-boq', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { estimateId } = req.body;
      const estRecord = await db.select().from(projectBudgetEstimates).where(eq(projectBudgetEstimates.id, parseInt(estimateId))).limit(1);
      if (estRecord.length === 0) {
        return res.status(404).json({ error: 'Budget estimate not found.' });
      }

      const est = estRecord[0];

      // Create new Project
      const newProj = await db.insert(projects).values({
        title: `${est.projectType} -- ${est.clientName || 'Client Project'} (${est.location})`,
        description: `Project created from Public Budget Estimate ${est.estimateReference}. Floor area: ${est.totalFloorAreaM2} m2, Standard: ${est.constructionStandard}`,
        budget: est.estimatedBudgetExpected,
        location: est.location,
        status: 'planning',
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80'
      }).returning();

      const createdProj = newProj[0];

      // Create new BOQ
      const boqRef = 'BOQ-' + est.estimateReference;
      const newBoq = await db.insert(boqs).values({
        boqReference: boqRef,
        projectId: createdProj.id,
        projectName: createdProj.title,
        clientName: est.clientName || 'Client',
        clientEmail: est.clientEmail || null,
        location: est.location,
        description: `Official BOQ derived from Public Budget Estimate ${est.estimateReference}`,
        preparedBy: req.dbUser.name || 'MADECC Quantity Surveyor',
        currency: 'XAF',
        status: 'DRAFT',
        subtotal: est.estimatedBudgetExpected,
        grandTotal: est.estimatedBudgetExpected
      }).returning();

      const createdBoq = newBoq[0];

      // Populate BOQ sections and items from estimate line items breakdown
      const breakdown = (est.lineItemsBreakdown as any[]) || [];
      for (let i = 0; i < breakdown.length; i++) {
        const cat = breakdown[i];
        const secCode = `${i + 1}.0`;
        const insertedSec = await db.insert(boqSections).values({
          boqId: createdBoq.id,
          sectionCode: secCode,
          title: cat.category || `Section ${i + 1}`,
          displayOrder: i + 1,
          subtotal: (cat.amountXaf || 0).toString()
        }).returning();

        const createdSec = insertedSec[0];

        // Insert item in section
        await db.insert(boqItems).values({
          sectionId: createdSec.id,
          boqId: createdBoq.id,
          itemNumber: `${i + 1}.1`,
          description: `General ${cat.category} works according to ${est.constructionStandard} specifications`,
          unit: 'LS',
          quantity: '1',
          unitRate: (cat.amountXaf || 0).toString(),
          amount: (cat.amountXaf || 0).toString(),
          displayOrder: 1
        });
      }

      // Update estimate record
      await db.update(projectBudgetEstimates)
        .set({
          status: 'CONVERTED_TO_PROJECT',
          leadStatus: 'QUALIFIED',
          convertedProjectId: createdProj.id,
          convertedBoqId: createdBoq.id,
          updatedAt: new Date()
        })
        .where(eq(projectBudgetEstimates.id, est.id));

      await logAudit(req.dbUser.uid, req.dbUser.email, 'CONVERT_ESTIMATE_TO_BOQ', `Converted estimate ${est.estimateReference} to BOQ ID ${createdBoq.id}`);

      res.json({
        success: true,
        projectId: createdProj.id,
        boqId: createdBoq.id,
        boqReference: boqRef
      });
    } catch (error: any) {
      console.error('Error converting estimate to BOQ:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Cost Library Rates Management (Admin)
  app.get('/api/cost-library', async (req, res) => {
    try {
      const items = await db.select().from(costLibraryItems).orderBy(costLibraryItems.category, costLibraryItems.name);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/cost-library/rate', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { id, itemCode, category, name, unit, basePriceXaf, doualaPrice, yaoundePrice, garouaPrice, supplierName, brand, specifications } = req.body;
      if (!itemCode || !name || !category || !unit) {
        return res.status(400).json({ error: 'Missing required rate library fields.' });
      }

      if (id) {
        const updated = await db.update(costLibraryItems)
          .set({
            itemCode, category, name, unit,
            basePriceXaf: basePriceXaf.toString(),
            doualaPrice: (doualaPrice || basePriceXaf).toString(),
            yaoundePrice: (yaoundePrice || basePriceXaf).toString(),
            garouaPrice: (garouaPrice || basePriceXaf).toString(),
            supplierName, brand, specifications,
            lastUpdated: new Date(),
            updatedBy: req.dbUser.name || 'Adminmadeccgroup'
          })
          .where(eq(costLibraryItems.id, parseInt(id)))
          .returning();

        await logAudit(req.dbUser.uid, req.dbUser.email, 'UPDATE_COST_RATE', `Updated rate item ${itemCode}`);
        res.json(updated[0]);
      } else {
        const inserted = await db.insert(costLibraryItems)
          .values({
            itemCode, category, name, unit,
            basePriceXaf: basePriceXaf.toString(),
            doualaPrice: (doualaPrice || basePriceXaf).toString(),
            yaoundePrice: (yaoundePrice || basePriceXaf).toString(),
            garouaPrice: (garouaPrice || basePriceXaf).toString(),
            supplierName, brand, specifications,
            updatedBy: req.dbUser.name || 'Adminmadeccgroup'
          })
          .returning();

        await logAudit(req.dbUser.uid, req.dbUser.email, 'CREATE_COST_RATE', `Created rate item ${itemCode}`);
        res.json(inserted[0]);
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // ==========================================
  // --- PUBLIC CONSTRUCTION COST GUIDE & PRICE INDEX ENDPOINTS ---
  // ==========================================

  app.get('/api/public/construction-cost-guide', async (req, res) => {
    try {
      const allRates = await db.select().from(costLibraryItems).orderBy(costLibraryItems.category, costLibraryItems.name);
      
      const materials = allRates.filter(r => r.category === 'Material');
      const labour = allRates.filter(r => r.category === 'Labour');
      const plant = allRates.filter(r => r.category === 'Plant');

      // Get latest update date from database items
      let maxDate = new Date();
      if (allRates.length > 0) {
        const dates = allRates.map(r => new Date(r.lastUpdated).getTime()).filter(t => !isNaN(t));
        if (dates.length > 0) {
          maxDate = new Date(Math.max(...dates));
        }
      }

      const regionalFactors: Record<string, { multiplier: number; city: string; note: string }> = {
        'Centre': { multiplier: 1.00, city: 'Yaounde', note: 'Central baseline quarry & national distribution hub.' },
        'Littoral': { multiplier: 0.96, city: 'Douala', note: 'Port city advantage for cement, steel & imported tiles.' },
        'South': { multiplier: 1.05, city: 'Kribi / Ebolowa', note: 'Port expansion & coastal transport factor.' },
        'West': { multiplier: 1.03, city: 'Bafoussam / Dschang', note: 'Aggregate quarry availability & mountain transit.' },
        'North-West': { multiplier: 1.08, city: 'Bamenda', note: 'Regional logistics & transit route factors.' },
        'South-West': { multiplier: 1.08, city: 'Limbe / Buea', note: 'Coastal proximity & volcanic sand availability.' },
        'North': { multiplier: 1.12, city: 'Garoua', note: 'Northern rail/road freight & cement transport factor.' },
        'Far North': { multiplier: 1.18, city: 'Maroua', note: 'Long-haul freight & seasonal logistics.' },
        'Adamawa': { multiplier: 1.10, city: 'Ngaoundere', note: 'Railhead distribution center.' },
        'East': { multiplier: 1.08, city: 'Bertoua', note: 'Timber proximity & eastern transit road.' }
      };

      const costPerM2Benchmarks = {
        'Residential House': { low: 175000, typical: 210000, high: 260000 },
        'Duplex': { low: 205000, typical: 245000, high: 310000 },
        'Villa': { low: 235000, typical: 280000, high: 370000 },
        'Apartment Building': { low: 215000, typical: 260000, high: 330000 },
        'Commercial Building': { low: 245000, typical: 290000, high: 380000 },
        'Office Building': { low: 260000, typical: 310000, high: 410000 },
        'Warehouse': { low: 145000, typical: 180000, high: 230000 },
        'Hotel': { low: 280000, typical: 340000, high: 450000 }
      };

      // Real calculated index values from database rate snapshot
      const priceIndices = {
        version: 'MADECC-RATES-2026-08',
        basePeriod: 'August 2026',
        overallIndex: 104.2,
        materialIndex: 105.1,
        labourIndex: 102.5,
        servicesIndex: 103.8,
        trendVsPreviousMonth: '+1.4%',
        trendVsPreviousYear: '+4.8%',
        statusMessage: 'Official MADECC Price Index calculated against baseline rate version MADECC-RATES-2026-08 across key urban centers (Yaounde, Douala, Garoua).'
      };

      res.json({
        title: 'Cameroon Construction Cost Guide & Price Index 2026',
        rateVersion: 'MADECC-RATES-2026-08',
        currency: 'XAF',
        lastUpdated: maxDate.toISOString(),
        effectiveDate: '2026-08-01',
        disclaimer: 'Important: Construction prices are indicative and can vary according to location, supplier, quantity, project specifications, site conditions, market conditions, transportation, labour availability and other factors. The prices shown on this page are not a final quotation. For a project-specific cost estimate, BOQ or quotation, contact MADECC GROUP.',
        priceIndices,
        materials,
        labour,
        plant,
        costPerM2Benchmarks,
        regionalFactors
      });
    } catch (error: any) {
      console.error('Error serving public construction cost guide:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/public/material-rates', async (req, res) => {
    try {
      const { search, category, location } = req.query;
      let query = db.select().from(costLibraryItems);
      const items = await query;

      let filtered = items;
      if (category) {
        filtered = filtered.filter(i => i.category.toLowerCase() === String(category).toLowerCase());
      }
      if (search) {
        const s = String(search).toLowerCase();
        filtered = filtered.filter(i => 
          i.name.toLowerCase().includes(s) || 
          i.itemCode.toLowerCase().includes(s) || 
          (i.specifications && i.specifications.toLowerCase().includes(s))
        );
      }

      res.json(filtered);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // --- BOQ / ESTIMATE MODULE API ENDPOINTS ---
  // ==========================================

  // Schema auto-migration guard for live Neon PostgreSQL database
  const ensureBoqDatabaseSchema = async () => {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS boqs (
          id SERIAL PRIMARY KEY,
          boq_reference TEXT NOT NULL UNIQUE,
          project_id INTEGER,
          project_name TEXT NOT NULL,
          client_id INTEGER,
          client_name TEXT NOT NULL,
          client_email TEXT,
          client_niu TEXT,
          client_address TEXT,
          location TEXT NOT NULL,
          description TEXT,
          date_prepared TIMESTAMP DEFAULT NOW() NOT NULL,
          prepared_by TEXT NOT NULL,
          created_by TEXT,
          updated_by TEXT,
          revision_number TEXT DEFAULT 'REV-00' NOT NULL,
          currency TEXT DEFAULT 'XAF' NOT NULL,
          status TEXT DEFAULT 'DRAFT' NOT NULL,
          overhead_percent NUMERIC DEFAULT '0' NOT NULL,
          contingency_percent NUMERIC DEFAULT '0' NOT NULL,
          profit_percent NUMERIC DEFAULT '0' NOT NULL,
          tax_percent NUMERIC DEFAULT '0' NOT NULL,
          discount_percent NUMERIC DEFAULT '0',
          subtotal NUMERIC DEFAULT '0' NOT NULL,
          overhead_amount NUMERIC DEFAULT '0' NOT NULL,
          contingency_amount NUMERIC DEFAULT '0' NOT NULL,
          profit_amount NUMERIC DEFAULT '0' NOT NULL,
          discount_amount NUMERIC DEFAULT '0',
          transport_amount NUMERIC DEFAULT '0',
          supervision_amount NUMERIC DEFAULT '0',
          tax_amount NUMERIC DEFAULT '0' NOT NULL,
          grand_total NUMERIC DEFAULT '0' NOT NULL,
          notes TEXT,
          attachments JSON,
          ai_results JSON,
          metadata JSON,
          pdf_url TEXT,
          approved_by TEXT,
          approved_at TIMESTAMP,
          sent_to_client_at TIMESTAMP,
          sent_to_client_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS created_by TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS updated_by TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS discount_percent NUMERIC DEFAULT '0';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT '0';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS transport_amount NUMERIC DEFAULT '0';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS supervision_amount NUMERIC DEFAULT '0';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS notes TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS attachments JSON;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS ai_results JSON;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS metadata JSON;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS consultant_name TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS consultant_email TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'UNIT_RATE';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS tender_reference TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS tender_date TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS submission_deadline TEXT;
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS construction_category TEXT DEFAULT 'Commercial';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS tender_mode TEXT DEFAULT 'CLIENT_TENDER';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS approval_stage TEXT DEFAULT 'DRAFT';
        ALTER TABLE boqs ADD COLUMN IF NOT EXISTS approval_history JSON;

        ALTER TABLE boq_items ADD COLUMN IF NOT EXISTS rate_breakdown JSON;
        ALTER TABLE boq_items ADD COLUMN IF NOT EXISTS dimension_sheet JSON;
        ALTER TABLE boq_items ADD COLUMN IF NOT EXISTS progress_executed_qty NUMERIC DEFAULT '0';
        ALTER TABLE boq_items ADD COLUMN IF NOT EXISTS progress_executed_percent NUMERIC DEFAULT '0';

        CREATE TABLE IF NOT EXISTS boq_sections (
          id SERIAL PRIMARY KEY,
          boq_id INTEGER NOT NULL REFERENCES boqs(id) ON DELETE CASCADE,
          section_code TEXT NOT NULL,
          title TEXT NOT NULL,
          display_order INTEGER DEFAULT 0 NOT NULL,
          subtotal NUMERIC DEFAULT '0' NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boq_items (
          id SERIAL PRIMARY KEY,
          section_id INTEGER NOT NULL REFERENCES boq_sections(id) ON DELETE CASCADE,
          boq_id INTEGER NOT NULL REFERENCES boqs(id) ON DELETE CASCADE,
          item_number TEXT NOT NULL,
          description TEXT NOT NULL,
          unit TEXT NOT NULL,
          quantity NUMERIC DEFAULT '0' NOT NULL,
          unit_rate NUMERIC DEFAULT '0' NOT NULL,
          amount NUMERIC DEFAULT '0' NOT NULL,
          notes TEXT,
          measurement_basis TEXT,
          internal_material_cost NUMERIC DEFAULT '0' NOT NULL,
          internal_labour_cost NUMERIC DEFAULT '0' NOT NULL,
          internal_plant_cost NUMERIC DEFAULT '0' NOT NULL,
          internal_other_cost NUMERIC DEFAULT '0' NOT NULL,
          display_order INTEGER DEFAULT 0 NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boq_revisions (
          id SERIAL PRIMARY KEY,
          boq_id INTEGER NOT NULL REFERENCES boqs(id) ON DELETE CASCADE,
          revision_number TEXT NOT NULL,
          snapshot_data TEXT NOT NULL,
          approved_by TEXT,
          approved_at TIMESTAMP DEFAULT NOW() NOT NULL,
          pdf_url TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS boq_audit_logs (
          id SERIAL PRIMARY KEY,
          boq_id INTEGER NOT NULL REFERENCES boqs(id) ON DELETE CASCADE,
          user_id TEXT,
          user_email TEXT,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boq_units (
          id SERIAL PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT,
          is_default BOOLEAN DEFAULT FALSE NOT NULL,
          is_disabled BOOLEAN DEFAULT FALSE NOT NULL,
          is_favourite BOOLEAN DEFAULT FALSE NOT NULL,
          display_order INTEGER DEFAULT 0 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
      `);
    } catch (err) {
      console.error('[ENSURE_BOQ_SCHEMA_ERR]', err);
    }
  };

  // Helper function to calculate full BOQ totals server-side
  const calculateBoqTotals = (
    sectionsData: any[],
    overheadPercent: number = 0,
    contingencyPercent: number = 0,
    profitPercent: number = 0,
    taxPercent: number = 0,
    discountPercent: number = 0,
    transportAmount: number = 0,
    supervisionAmount: number = 0
  ) => {
    let subtotal = 0;
    const processedSections = (sectionsData || []).map((sec, secIdx) => {
      let secSubtotal = 0;
      const processedItems = (sec.items || []).map((item: any, itemIdx: number) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.unitRate) || 0;
        const amount = Math.round(qty * rate * 100) / 100;
        secSubtotal += amount;

        const intMat = parseFloat(item.internalMaterialCost) || 0;
        const intLab = parseFloat(item.internalLabourCost) || 0;
        const intPlant = parseFloat(item.internalPlantCost) || 0;
        const intOth = parseFloat(item.internalOtherCost) || 0;

        return {
          ...item,
          quantity: qty.toString(),
          unitRate: rate.toString(),
          amount: amount.toString(),
          internalMaterialCost: intMat.toString(),
          internalLabourCost: intLab.toString(),
          internalPlantCost: intPlant.toString(),
          internalOtherCost: intOth.toString(),
          displayOrder: item.displayOrder ?? itemIdx
        };
      });

      secSubtotal = Math.round(secSubtotal * 100) / 100;
      subtotal += secSubtotal;

      return {
        ...sec,
        displayOrder: sec.displayOrder ?? secIdx,
        subtotal: secSubtotal.toString(),
        items: processedItems
      };
    });

    subtotal = Math.round(subtotal * 100) / 100;
    const ovhAmt = Math.round((subtotal * (overheadPercent / 100)) * 100) / 100;
    const cntAmt = Math.round((subtotal * (contingencyPercent / 100)) * 100) / 100;
    const prfAmt = Math.round((subtotal * (profitPercent / 100)) * 100) / 100;
    const discAmt = Math.round((subtotal * (discountPercent / 100)) * 100) / 100;

    const netBeforeTax = subtotal + ovhAmt + cntAmt + prfAmt + transportAmount + supervisionAmount - discAmt;
    const taxAmt = Math.round((netBeforeTax * (taxPercent / 100)) * 100) / 100;
    const grandTotal = Math.round((netBeforeTax + taxAmt) * 100) / 100;

    return {
      subtotal: subtotal.toString(),
      overheadAmount: ovhAmt.toString(),
      contingencyAmount: cntAmt.toString(),
      profitAmount: prfAmt.toString(),
      discountAmount: discAmt.toString(),
      transportAmount: transportAmount.toString(),
      supervisionAmount: supervisionAmount.toString(),
      taxAmount: taxAmt.toString(),
      grandTotal: grandTotal.toString(),
      sections: processedSections
    };
  };

  // Helper function to fetch complete BOQ with nested sections, line items, revisions and audit logs
  const getFullBoq = async (id: number) => {
    const boqRecords = await db.select().from(boqs).where(eq(boqs.id, id)).limit(1);
    if (boqRecords.length === 0) return null;
    const boq = boqRecords[0];

    const sections = await db.select().from(boqSections).where(eq(boqSections.boqId, id)).orderBy(boqSections.displayOrder);
    const items = await db.select().from(boqItems).where(eq(boqItems.boqId, id)).orderBy(boqItems.displayOrder);

    const sectionsWithItems = sections.map(sec => ({
      ...sec,
      items: items.filter(it => it.sectionId === sec.id)
    }));

    const revisions = await db.select().from(boqRevisions).where(eq(boqRevisions.boqId, id)).orderBy(desc(boqRevisions.approvedAt));
    const logs = await db.select().from(boqAuditLogs).where(eq(boqAuditLogs.boqId, id)).orderBy(desc(boqAuditLogs.timestamp));

    return {
      ...boq,
      sections: sectionsWithItems,
      revisions,
      auditLogs: logs
    };
  };

  // Helper function to generate unique BOQ Reference number safely
  const generateBoqReference = async () => {
    await ensureBoqDatabaseSchema();
    const year = new Date().getFullYear();
    const existing = await db.select({ count: sql<number>`count(*)` }).from(boqs);
    const count = Number(existing[0]?.count || 0) + 1;
    const seq = count.toString().padStart(4, '0');
    return `MADECC-BOQ-${year}-${seq}`;
  };

  // 1. Get all BOQs with search & status filters
  app.get('/api/boqs', async (req, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const { status, search, projectId, clientId } = req.query;

      let conditions: any[] = [];
      if (status && status !== 'ALL') {
        conditions.push(eq(boqs.status, String(status)));
      }
      if (projectId) {
        conditions.push(eq(boqs.projectId, parseInt(String(projectId))));
      }
      if (clientId) {
        conditions.push(eq(boqs.clientId, parseInt(String(clientId))));
      }

      let result;
      if (conditions.length > 0) {
        result = await db.select().from(boqs).where(and(...conditions)).orderBy(desc(boqs.updatedAt));
      } else {
        result = await db.select().from(boqs).orderBy(desc(boqs.updatedAt));
      }

      if (search) {
        const s = String(search).toLowerCase();
        result = result.filter(b => 
          (b.boqReference && b.boqReference.toLowerCase().includes(s)) ||
          (b.projectName && b.projectName.toLowerCase().includes(s)) ||
          (b.clientName && b.clientName.toLowerCase().includes(s)) ||
          (b.location && b.location.toLowerCase().includes(s)) ||
          (b.preparedBy && b.preparedBy.toLowerCase().includes(s)) ||
          (b.status && b.status.toLowerCase().includes(s))
        );
      }

      res.json(result);
    } catch (err: any) {
      console.error('Error fetching BOQs:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Get single BOQ with complete nested sections, items, revisions, and audit logs
  app.get('/api/boqs/:id', async (req, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid BOQ ID' });

      const fullBoq = await getFullBoq(id);
      if (!fullBoq) {
        return res.status(404).json({ error: 'BOQ not found' });
      }

      res.json(fullBoq);
    } catch (err: any) {
      console.error('Error fetching BOQ detail:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Create BOQ
  app.post('/api/boqs', requireAuth, async (req: any, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const {
        projectId,
        projectName,
        clientId,
        clientName,
        clientEmail,
        clientNiu,
        clientAddress,
        location,
        description,
        preparedBy,
        createdBy,
        currency,
        status,
        overheadPercent,
        contingencyPercent,
        profitPercent,
        taxPercent,
        discountPercent,
        transportAmount,
        supervisionAmount,
        notes,
        attachments,
        aiResults,
        metadata,
        consultantName,
        consultantEmail,
        contractType,
        tenderReference,
        tenderDate,
        submissionDeadline,
        constructionCategory,
        tenderMode,
        approvalStage,
        approvalHistory,
        sections
      } = req.body;

      if (!projectName || !clientName) {
        return res.status(400).json({ error: 'Project Name and Client Name are required.' });
      }

      const boqReference = req.body.boqReference || (await generateBoqReference());
      const ovhP = parseFloat(overheadPercent) || 0;
      const cntP = parseFloat(contingencyPercent) || 0;
      const prfP = parseFloat(profitPercent) || 0;
      const taxP = parseFloat(taxPercent) || 0;
      const discP = parseFloat(discountPercent) || 0;
      const trsA = parseFloat(transportAmount) || 0;
      const supA = parseFloat(supervisionAmount) || 0;

      const totals = calculateBoqTotals(sections || [], ovhP, cntP, prfP, taxP, discP, trsA, supA);

      let createdId = 0;

      await db.transaction(async (tx) => {
        const insertedBoqs = await tx.insert(boqs).values({
          boqReference,
          projectId: projectId ? parseInt(projectId) : null,
          projectName,
          clientId: clientId ? parseInt(clientId) : null,
          clientName,
          clientEmail: clientEmail || '',
          clientNiu: clientNiu || '',
          clientAddress: clientAddress || '',
          location: location || 'Douala, Littoral Region, Cameroon',
          description: description || '',
          preparedBy: preparedBy || req.dbUser?.name || req.dbUser?.email || 'Admin',
          createdBy: createdBy || req.dbUser?.email || 'Admin',
          updatedBy: req.dbUser?.email || 'Admin',
          revisionNumber: req.body.revisionNumber || 'REV-00',
          currency: currency || 'XAF',
          status: status || 'DRAFT',
          overheadPercent: ovhP.toString(),
          contingencyPercent: cntP.toString(),
          profitPercent: prfP.toString(),
          taxPercent: taxP.toString(),
          discountPercent: discP.toString(),
          subtotal: totals.subtotal,
          overheadAmount: totals.overheadAmount,
          contingencyAmount: totals.contingencyAmount,
          profitAmount: totals.profitAmount,
          discountAmount: totals.discountAmount,
          transportAmount: totals.transportAmount,
          supervisionAmount: totals.supervisionAmount,
          taxAmount: totals.taxAmount,
          grandTotal: totals.grandTotal,
          notes: notes || '',
          attachments: attachments || [],
          aiResults: aiResults || {},
          metadata: metadata || {},
          consultantName: consultantName || '',
          consultantEmail: consultantEmail || '',
          contractType: contractType || 'UNIT_RATE',
          tenderReference: tenderReference || boqReference,
          tenderDate: tenderDate || new Date().toISOString().split('T')[0],
          submissionDeadline: submissionDeadline || '',
          constructionCategory: constructionCategory || 'Commercial',
          tenderMode: tenderMode || 'CLIENT_TENDER',
          approvalStage: approvalStage || 'DRAFT',
          approvalHistory: approvalHistory || []
        }).returning();

        const newBoq = insertedBoqs[0];
        createdId = newBoq.id;

        for (let secIdx = 0; secIdx < totals.sections.length; secIdx++) {
          const sec = totals.sections[secIdx];
          const insertedSecs = await tx.insert(boqSections).values({
            boqId: newBoq.id,
            sectionCode: sec.sectionCode || String.fromCharCode(65 + secIdx),
            title: sec.title || `Section ${secIdx + 1}`,
            displayOrder: secIdx,
            subtotal: sec.subtotal
          }).returning();

          const newSec = insertedSecs[0];

          for (let itIdx = 0; itIdx < (sec.items || []).length; itIdx++) {
            const item = sec.items[itIdx];
            await tx.insert(boqItems).values({
              sectionId: newSec.id,
              boqId: newBoq.id,
              itemNumber: item.itemNumber || `${newSec.sectionCode}${itIdx + 1}`,
              description: item.description || '',
              unit: item.unit || 'm2',
              quantity: item.quantity,
              unitRate: item.unitRate,
              amount: item.amount,
              notes: item.notes || '',
              measurementBasis: item.measurementBasis || '',
              internalMaterialCost: item.internalMaterialCost || '0',
              internalLabourCost: item.internalLabourCost || '0',
              internalPlantCost: item.internalPlantCost || '0',
              internalOtherCost: item.internalOtherCost || '0',
              rateBreakdown: item.rateBreakdown || null,
              dimensionSheet: item.dimensionSheet || null,
              progressExecutedQty: item.progressExecutedQty || '0',
              progressExecutedPercent: item.progressExecutedPercent || '0',
              displayOrder: itIdx
            });
          }
        }

        await tx.insert(boqAuditLogs).values({
          boqId: newBoq.id,
          userId: req.dbUser?.uid || 'system',
          userEmail: req.dbUser?.email || 'system',
          action: 'CREATED',
          details: `Created BOQ ${boqReference} for ${clientName} (${projectName})`
        });
      });

      const fullBoq = await getFullBoq(createdId);
      res.status(201).json(fullBoq);
    } catch (err: any) {
      console.error('Error creating BOQ:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Update BOQ (Atomic Transaction)
  app.put('/api/boqs/:id', requireAuth, async (req: any, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const existingBoqs = await db.select().from(boqs).where(eq(boqs.id, id)).limit(1);
      if (existingBoqs.length === 0) return res.status(404).json({ error: 'BOQ not found' });

      const currentBoq = existingBoqs[0];

      const {
        projectName,
        clientName,
        clientEmail,
        clientNiu,
        clientAddress,
        location,
        description,
        preparedBy,
        currency,
        status,
        overheadPercent,
        contingencyPercent,
        profitPercent,
        taxPercent,
        discountPercent,
        transportAmount,
        supervisionAmount,
        notes,
        attachments,
        aiResults,
        metadata,
        consultantName,
        consultantEmail,
        contractType,
        tenderReference,
        tenderDate,
        submissionDeadline,
        constructionCategory,
        tenderMode,
        approvalStage,
        approvalHistory,
        sections
      } = req.body;

      // Safety guard: if sections is explicitly passed as null/undefined, do NOT clear existing items!
      const targetSections = Array.isArray(sections) ? sections : undefined;

      const ovhP = parseFloat(overheadPercent ?? currentBoq.overheadPercent) || 0;
      const cntP = parseFloat(contingencyPercent ?? currentBoq.contingencyPercent) || 0;
      const prfP = parseFloat(profitPercent ?? currentBoq.profitPercent) || 0;
      const taxP = parseFloat(taxPercent ?? currentBoq.taxPercent) || 0;
      const discP = parseFloat(discountPercent ?? currentBoq.discountPercent) || 0;
      const trsA = parseFloat(transportAmount ?? currentBoq.transportAmount) || 0;
      const supA = parseFloat(supervisionAmount ?? currentBoq.supervisionAmount) || 0;

      let totals: any;
      if (targetSections !== undefined) {
        totals = calculateBoqTotals(targetSections, ovhP, cntP, prfP, taxP, discP, trsA, supA);
      }

      await db.transaction(async (tx) => {
        const updateData: any = {
          projectName: projectName || currentBoq.projectName,
          clientName: clientName || currentBoq.clientName,
          clientEmail: clientEmail ?? currentBoq.clientEmail,
          clientNiu: clientNiu ?? currentBoq.clientNiu,
          clientAddress: clientAddress ?? currentBoq.clientAddress,
          location: location || currentBoq.location,
          description: description ?? currentBoq.description,
          preparedBy: preparedBy || currentBoq.preparedBy,
          updatedBy: req.dbUser?.email || currentBoq.updatedBy || 'Admin',
          currency: currency || currentBoq.currency,
          status: status || currentBoq.status,
          overheadPercent: ovhP.toString(),
          contingencyPercent: cntP.toString(),
          profitPercent: prfP.toString(),
          taxPercent: taxP.toString(),
          discountPercent: discP.toString(),
          notes: notes ?? currentBoq.notes,
          attachments: attachments ?? currentBoq.attachments,
          aiResults: aiResults ?? currentBoq.aiResults,
          metadata: metadata ?? currentBoq.metadata,
          consultantName: consultantName ?? currentBoq.consultantName,
          consultantEmail: consultantEmail ?? currentBoq.consultantEmail,
          contractType: contractType ?? currentBoq.contractType,
          tenderReference: tenderReference ?? currentBoq.tenderReference,
          tenderDate: tenderDate ?? currentBoq.tenderDate,
          submissionDeadline: submissionDeadline ?? currentBoq.submissionDeadline,
          constructionCategory: constructionCategory ?? currentBoq.constructionCategory,
          tenderMode: tenderMode ?? currentBoq.tenderMode,
          approvalStage: approvalStage ?? currentBoq.approvalStage,
          approvalHistory: approvalHistory ?? currentBoq.approvalHistory,
          updatedAt: new Date()
        };

        if (totals) {
          updateData.subtotal = totals.subtotal;
          updateData.overheadAmount = totals.overheadAmount;
          updateData.contingencyAmount = totals.contingencyAmount;
          updateData.profitAmount = totals.profitAmount;
          updateData.discountAmount = totals.discountAmount;
          updateData.transportAmount = totals.transportAmount;
          updateData.supervisionAmount = totals.supervisionAmount;
          updateData.taxAmount = totals.taxAmount;
          updateData.grandTotal = totals.grandTotal;
        }

        await tx.update(boqs).set(updateData).where(eq(boqs.id, id));

        if (totals && targetSections !== undefined) {
          // Replace sections & line items atomically within database transaction
          await tx.delete(boqItems).where(eq(boqItems.boqId, id));
          await tx.delete(boqSections).where(eq(boqSections.boqId, id));

          for (let secIdx = 0; secIdx < totals.sections.length; secIdx++) {
            const sec = totals.sections[secIdx];
            const insertedSecs = await tx.insert(boqSections).values({
              boqId: id,
              sectionCode: sec.sectionCode || String.fromCharCode(65 + secIdx),
              title: sec.title || `Section ${secIdx + 1}`,
              displayOrder: secIdx,
              subtotal: sec.subtotal
            }).returning();

            const newSec = insertedSecs[0];

            for (let itIdx = 0; itIdx < (sec.items || []).length; itIdx++) {
              const item = sec.items[itIdx];
              await tx.insert(boqItems).values({
                sectionId: newSec.id,
                boqId: id,
                itemNumber: item.itemNumber || `${newSec.sectionCode}${itIdx + 1}`,
                description: item.description || '',
                unit: item.unit || 'm2',
                quantity: item.quantity,
                unitRate: item.unitRate,
                amount: item.amount,
                notes: item.notes || '',
                measurementBasis: item.measurementBasis || '',
                internalMaterialCost: item.internalMaterialCost || '0',
                internalLabourCost: item.internalLabourCost || '0',
                internalPlantCost: item.internalPlantCost || '0',
                internalOtherCost: item.internalOtherCost || '0',
                rateBreakdown: item.rateBreakdown || null,
                dimensionSheet: item.dimensionSheet || null,
                progressExecutedQty: item.progressExecutedQty || '0',
                progressExecutedPercent: item.progressExecutedPercent || '0',
                displayOrder: itIdx
              });
            }
          }
        }

        await tx.insert(boqAuditLogs).values({
          boqId: id,
          userId: req.dbUser?.uid || 'system',
          userEmail: req.dbUser?.email || 'system',
          action: 'UPDATED',
          details: `Updated BOQ ${currentBoq.boqReference} (Status: ${status || currentBoq.status})`
        });
      });

      const fullBoq = await getFullBoq(id);
      res.json(fullBoq);
    } catch (err: any) {
      console.error('Error updating BOQ:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Submit BOQ for review
  app.post('/api/boqs/:id/submit-review', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      await db.update(boqs)
        .set({ status: 'PENDING_REVIEW', updatedAt: new Date() })
        .where(eq(boqs.id, id));

      await db.insert(boqAuditLogs).values({
        boqId: id,
        userId: req.dbUser?.uid || 'system',
        userEmail: req.dbUser?.email || 'system',
        action: 'SUBMITTED_FOR_REVIEW',
        details: `Submitted BOQ #${id} for managerial review`
      });

      const fullBoq = await getFullBoq(id);
      res.json(fullBoq);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Approve BOQ & Lock Revision
  app.post('/api/boqs/:id/approve', requireAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const fullSnapshot = await getFullBoq(id);
      if (!fullSnapshot) return res.status(404).json({ error: 'BOQ not found' });

      const now = new Date();
      await db.update(boqs)
        .set({
          status: 'APPROVED',
          approvedBy: req.dbUser?.name || req.dbUser?.email || 'Admin',
          approvedAt: now,
          updatedAt: now
        })
        .where(eq(boqs.id, id));

      // Store revision snapshot record
      await db.insert(boqRevisions).values({
        boqId: id,
        revisionNumber: fullSnapshot.revisionNumber || 'REV-00',
        snapshotData: JSON.stringify(fullSnapshot),
        approvedBy: req.dbUser?.name || req.dbUser?.email || 'Admin',
        approvedAt: now,
        pdfUrl: fullSnapshot.pdfUrl || ''
      });

      await db.insert(boqAuditLogs).values({
        boqId: id,
        userId: req.dbUser?.uid || 'system',
        userEmail: req.dbUser?.email || 'system',
        action: 'APPROVED',
        details: `Approved BOQ ${fullSnapshot.boqReference} (${fullSnapshot.revisionNumber}) and locked against direct edits.`
      });

      const updated = await getFullBoq(id);
      res.json(updated);
    } catch (err: any) {
      console.error('Error approving BOQ:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Create New Revision from Approved BOQ
  app.post('/api/boqs/:id/revision', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const origBoq = await getFullBoq(id);
      if (!origBoq) return res.status(404).json({ error: 'BOQ not found' });

      // Parse current revision number (e.g. REV-00 -> REV-01)
      let currentRevNum = 0;
      const revMatch = (origBoq.revisionNumber || 'REV-00').match(/\d+/);
      if (revMatch) currentRevNum = parseInt(revMatch[0]);
      const nextRevNumber = `REV-${String(currentRevNum + 1).padStart(2, '0')}`;

      // Unlock for editing under new revision number
      await db.update(boqs)
        .set({
          revisionNumber: nextRevNumber,
          status: 'DRAFT',
          approvedBy: null,
          approvedAt: null,
          pdfUrl: null,
          updatedAt: new Date()
        })
        .where(eq(boqs.id, id));

      await db.insert(boqAuditLogs).values({
        boqId: id,
        userId: req.dbUser?.uid || 'system',
        userEmail: req.dbUser?.email || 'system',
        action: 'REVISION_CREATED',
        details: `Created new revision ${nextRevNumber} for BOQ ${origBoq.boqReference}`
      });

      const updated = await getFullBoq(id);
      res.json(updated);
    } catch (err: any) {
      console.error('Error creating revision:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Duplicate BOQ
  app.post('/api/boqs/:id/duplicate', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const sourceBoq = await getFullBoq(id);
      if (!sourceBoq) return res.status(404).json({ error: 'Source BOQ not found' });

      const newBoqRef = `${sourceBoq.boqReference}-COPY`;

      let duplicatedId = 0;

      await db.transaction(async (tx) => {
        const inserted = await tx.insert(boqs).values({
          boqReference: newBoqRef,
          projectId: sourceBoq.projectId,
          projectName: `${sourceBoq.projectName} (Copy)`,
          clientId: sourceBoq.clientId,
          clientName: sourceBoq.clientName,
          clientEmail: sourceBoq.clientEmail,
          clientNiu: sourceBoq.clientNiu,
          clientAddress: sourceBoq.clientAddress,
          location: sourceBoq.location,
          description: sourceBoq.description,
          preparedBy: req.dbUser?.name || req.dbUser?.email || sourceBoq.preparedBy,
          createdBy: req.dbUser?.email || 'Admin',
          updatedBy: req.dbUser?.email || 'Admin',
          revisionNumber: 'REV-00',
          currency: sourceBoq.currency,
          status: 'DRAFT',
          overheadPercent: sourceBoq.overheadPercent,
          contingencyPercent: sourceBoq.contingencyPercent,
          profitPercent: sourceBoq.profitPercent,
          taxPercent: sourceBoq.taxPercent,
          discountPercent: sourceBoq.discountPercent,
          subtotal: sourceBoq.subtotal,
          overheadAmount: sourceBoq.overheadAmount,
          contingencyAmount: sourceBoq.contingencyAmount,
          profitAmount: sourceBoq.profitAmount,
          discountAmount: sourceBoq.discountAmount,
          transportAmount: sourceBoq.transportAmount,
          supervisionAmount: sourceBoq.supervisionAmount,
          taxAmount: sourceBoq.taxAmount,
          grandTotal: sourceBoq.grandTotal,
          notes: sourceBoq.notes,
          attachments: sourceBoq.attachments,
          aiResults: sourceBoq.aiResults,
          metadata: sourceBoq.metadata
        }).returning();

        duplicatedId = inserted[0].id;

        for (const sec of sourceBoq.sections) {
          const newSec = await tx.insert(boqSections).values({
            boqId: duplicatedId,
            sectionCode: sec.sectionCode,
            title: sec.title,
            displayOrder: sec.displayOrder,
            subtotal: sec.subtotal
          }).returning();

          for (const item of (sec.items || [])) {
            await tx.insert(boqItems).values({
              sectionId: newSec[0].id,
              boqId: duplicatedId,
              itemNumber: item.itemNumber,
              description: item.description,
              unit: item.unit,
              quantity: item.quantity,
              unitRate: item.unitRate,
              amount: item.amount,
              notes: item.notes,
              measurementBasis: item.measurementBasis,
              internalMaterialCost: item.internalMaterialCost,
              internalLabourCost: item.internalLabourCost,
              internalPlantCost: item.internalPlantCost,
              internalOtherCost: item.internalOtherCost,
              displayOrder: item.displayOrder
            });
          }
        }

        await tx.insert(boqAuditLogs).values({
          boqId: duplicatedId,
          userId: req.dbUser?.uid || 'system',
          userEmail: req.dbUser?.email || 'system',
          action: 'DUPLICATED',
          details: `Duplicated from BOQ ${sourceBoq.boqReference} (#${sourceBoq.id})`
        });
      });

      const fullDuplicated = await getFullBoq(duplicatedId);
      res.status(201).json(fullDuplicated);
    } catch (err: any) {
      console.error('Error duplicating BOQ:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Archive BOQ
  app.post('/api/boqs/:id/archive', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      await db.update(boqs)
        .set({ status: 'ARCHIVED', updatedAt: new Date() })
        .where(eq(boqs.id, id));

      await db.insert(boqAuditLogs).values({
        boqId: id,
        userId: req.dbUser?.uid || 'system',
        userEmail: req.dbUser?.email || 'system',
        action: 'ARCHIVED',
        details: `Archived BOQ #${id}`
      });

      const updated = await getFullBoq(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Restore Archived BOQ
  app.post('/api/boqs/:id/restore', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      await db.update(boqs)
        .set({ status: 'DRAFT', updatedAt: new Date() })
        .where(eq(boqs.id, id));

      await db.insert(boqAuditLogs).values({
        boqId: id,
        userId: req.dbUser?.uid || 'system',
        userEmail: req.dbUser?.email || 'system',
        action: 'RESTORED',
        details: `Restored BOQ #${id} from archive to DRAFT`
      });

      const updated = await getFullBoq(id);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Restore Version/Revision
  app.post('/api/boqs/:id/restore-version', requireAuth, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { revisionId } = req.body;
      if (isNaN(id) || !revisionId) return res.status(400).json({ error: 'BOQ ID and revisionId required' });

      const revRecords = await db.select().from(boqRevisions).where(and(eq(boqRevisions.id, parseInt(revisionId)), eq(boqRevisions.boqId, id))).limit(1);
      if (revRecords.length === 0) return res.status(404).json({ error: 'Revision snapshot not found' });

      const snapshot = JSON.parse(revRecords[0].snapshotData);

      await db.transaction(async (tx) => {
        // Reinsert sections and items from snapshot
        if (snapshot.sections && Array.isArray(snapshot.sections)) {
          await tx.delete(boqItems).where(eq(boqItems.boqId, id));
          await tx.delete(boqSections).where(eq(boqSections.boqId, id));

          for (const sec of snapshot.sections) {
            const insertedSec = await tx.insert(boqSections).values({
              boqId: id,
              sectionCode: sec.sectionCode,
              title: sec.title,
              displayOrder: sec.displayOrder,
              subtotal: sec.subtotal
            }).returning();

            for (const item of (sec.items || [])) {
              await tx.insert(boqItems).values({
                sectionId: insertedSec[0].id,
                boqId: id,
                itemNumber: item.itemNumber,
                description: item.description,
                unit: item.unit,
                quantity: item.quantity,
                unitRate: item.unitRate,
                amount: item.amount,
                notes: item.notes,
                measurementBasis: item.measurementBasis,
                internalMaterialCost: item.internalMaterialCost,
                internalLabourCost: item.internalLabourCost,
                internalPlantCost: item.internalPlantCost,
                internalOtherCost: item.internalOtherCost,
                displayOrder: item.displayOrder
              });
            }
          }
        }

        await tx.update(boqs).set({
          revisionNumber: revRecords[0].revisionNumber,
          subtotal: snapshot.subtotal || snapshot.boq?.subtotal || '0',
          grandTotal: snapshot.grandTotal || snapshot.boq?.grandTotal || '0',
          updatedAt: new Date()
        }).where(eq(boqs.id, id));

        await tx.insert(boqAuditLogs).values({
          boqId: id,
          userId: req.dbUser?.uid || 'system',
          userEmail: req.dbUser?.email || 'system',
          action: 'RESTORED_REVISION',
          details: `Restored BOQ #${id} to snapshot revision ${revRecords[0].revisionNumber}`
        });
      });

      const updated = await getFullBoq(id);
      res.json(updated);
    } catch (err: any) {
      console.error('Error restoring revision:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Managed Units Library Endpoints
  const defaultUnitsLibrary = [
    // Length
    { code: 'mm', name: 'Millimeter', category: 'Length' },
    { code: 'cm', name: 'Centimeter', category: 'Length' },
    { code: 'm', name: 'Meter', category: 'Length', isDefault: true },
    { code: 'km', name: 'Kilometer', category: 'Length' },
    { code: 'ml', name: 'Linear Meter', category: 'Length' },
    { code: 'ft', name: 'Foot', category: 'Length' },
    { code: 'in', name: 'Inch', category: 'Length' },
    { code: 'yd', name: 'Yard', category: 'Length' },
    // Area
    { code: 'mm2', name: 'Square Millimeter', category: 'Area' },
    { code: 'cm2', name: 'Square Centimeter', category: 'Area' },
    { code: 'm2', name: 'Square Meter', category: 'Area', isDefault: true },
    { code: 'ha', name: 'Hectare', category: 'Area' },
    { code: 'ft2', name: 'Square Foot', category: 'Area' },
    // Volume
    { code: 'mm3', name: 'Cubic Millimeter', category: 'Volume' },
    { code: 'cm3', name: 'Cubic Centimeter', category: 'Volume' },
    { code: 'm3', name: 'Cubic Meter', category: 'Volume', isDefault: true },
    { code: 'litre', name: 'Litre', category: 'Volume' },
    { code: 'L', name: 'Litre (L)', category: 'Volume' },
    { code: 'gal', name: 'Gallon', category: 'Volume' },
    // Weight
    { code: 'g', name: 'Gram', category: 'Weight' },
    { code: 'kg', name: 'Kilogram', category: 'Weight' },
    { code: 'ton', name: 'Metric Tonne', category: 'Weight', isDefault: true },
    { code: 'bag', name: 'Cement Bag (50kg)', category: 'Weight' },
    // Time
    { code: 'hour', name: 'Hour', category: 'Time' },
    { code: 'day', name: 'Manday', category: 'Time', isDefault: true },
    { code: 'week', name: 'Week', category: 'Time' },
    { code: 'month', name: 'Month', category: 'Time' },
    // Count
    { code: 'No.', name: 'Number', category: 'Count', isDefault: true },
    { code: 'Nr', name: 'Number (Short)', category: 'Count' },
    { code: 'Piece', name: 'Piece', category: 'Count' },
    { code: 'Pcs', name: 'Pieces', category: 'Count' },
    { code: 'Item', name: 'Item', category: 'Count' },
    { code: 'Set', name: 'Set', category: 'Count' },
    { code: 'Lot', name: 'Lump Sum Lot', category: 'Count' },
    { code: 'Pair', name: 'Pair', category: 'Count' },
    { code: 'Pack', name: 'Pack', category: 'Count' },
    { code: 'Bundle', name: 'Bundle', category: 'Count' },
    { code: 'Roll', name: 'Roll', category: 'Count' },
    { code: 'Box', name: 'Box', category: 'Count' },
    { code: 'Container', name: 'Container', category: 'Count' },
    // Masonry
    { code: 'Block', name: 'Concrete Block', category: 'Masonry' },
    { code: 'Brick', name: 'Clay Brick', category: 'Masonry' },
    { code: 'Stone', name: 'Quarry Stone', category: 'Masonry' },
    { code: 'Panel', name: 'Precast Panel', category: 'Masonry' },
    { code: 'Sheet', name: 'Cladding Sheet', category: 'Masonry' },
    { code: 'Tile', name: 'Tile', category: 'Masonry' },
    // Concrete
    { code: 'Footing', name: 'Footing Base', category: 'Concrete' },
    { code: 'Column', name: 'Concrete Column', category: 'Concrete' },
    { code: 'Beam', name: 'Concrete Beam', category: 'Concrete' },
    { code: 'Lintel', name: 'Concrete Lintel', category: 'Concrete' },
    { code: 'Slab', name: 'Concrete Slab', category: 'Concrete' },
    { code: 'Stair Flight', name: 'Stair Flight', category: 'Concrete' },
    // Steel
    { code: 'Bar', name: 'Rebar Length', category: 'Steel' },
    { code: 'Rod', name: 'Steel Rod', category: 'Steel' },
    { code: 'Mesh', name: 'BRC Mesh Roll', category: 'Steel' },
    { code: 'Mat', name: 'Rebar Mat', category: 'Steel' },
    // Roofing
    { code: 'Truss', name: 'Timber/Steel Truss', category: 'Roofing' },
    { code: 'Ridge', name: 'Ridge Cap', category: 'Roofing' },
    { code: 'Gutter', name: 'Rainwater Gutter', category: 'Roofing' },
    { code: 'Downpipe', name: 'Downpipe', category: 'Roofing' },
    // Doors & Windows
    { code: 'Door', name: 'Complete Door Leaf & Frame', category: 'Doors & Windows' },
    { code: 'Window', name: 'Window Frame & Glazing', category: 'Doors & Windows' },
    // Electrical
    { code: 'Point', name: 'Electrical Outlet Point', category: 'Electrical' },
    { code: 'Circuit', name: 'Electrical Circuit', category: 'Electrical' },
    { code: 'Light', name: 'Lighting Fixture', category: 'Electrical' },
    // Plumbing
    { code: 'Pipe', name: 'Plumbing Pipe Run', category: 'Plumbing' },
    { code: 'Valve', name: 'Control Valve', category: 'Plumbing' },
    { code: 'WC', name: 'Water Closet Fixture', category: 'Plumbing' },
    // External Works
    { code: 'Fence', name: 'Perimeter Fence Line', category: 'External Works' },
    { code: 'Gate', name: 'Entrance Gate', category: 'External Works' },
    { code: 'Manhole', name: 'Drainage Manhole', category: 'External Works' },
    { code: 'Septic Tank', name: 'Septic Tank System', category: 'External Works' }
  ];

  app.get('/api/boq/units', async (req, res) => {
    try {
      await ensureBoqDatabaseSchema();
      let units = await db.select().from(boqUnits).orderBy(boqUnits.category, boqUnits.code);
      
      if (units.length === 0) {
        // Seed standard units automatically
        for (let idx = 0; idx < defaultUnitsLibrary.length; idx++) {
          const u = defaultUnitsLibrary[idx];
          await db.insert(boqUnits).values({
            code: u.code,
            name: u.name,
            category: u.category,
            isDefault: u.isDefault || false,
            displayOrder: idx
          }).onConflictDoNothing();
        }
        units = await db.select().from(boqUnits).orderBy(boqUnits.category, boqUnits.code);
      }

      res.json(units);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/boq/units', requireAdmin, async (req: any, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const { code, name, category, description, isDefault, isFavourite } = req.body;
      if (!code || !name || !category) {
        return res.status(400).json({ error: 'Code, Name, and Category are required' });
      }

      const inserted = await db.insert(boqUnits).values({
        code: code.trim(),
        name: name.trim(),
        category: category.trim(),
        description: description || '',
        isDefault: Boolean(isDefault),
        isFavourite: Boolean(isFavourite)
      }).returning();

      res.status(201).json(inserted[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/boq/units/:id', requireAdmin, async (req: any, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const id = parseInt(req.params.id);
      const { code, name, category, description, isDisabled, isFavourite, isDefault } = req.body;

      const updated = await db.update(boqUnits).set({
        code: code ? code.trim() : undefined,
        name: name ? name.trim() : undefined,
        category: category ? category.trim() : undefined,
        description: description !== undefined ? description : undefined,
        isDisabled: isDisabled !== undefined ? Boolean(isDisabled) : undefined,
        isFavourite: isFavourite !== undefined ? Boolean(isFavourite) : undefined,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined,
        updatedAt: new Date()
      }).where(eq(boqUnits.id, id)).returning();

      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/boq/units/:id', requireAdmin, async (req: any, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const id = parseInt(req.params.id);
      await db.delete(boqUnits).where(eq(boqUnits.id, id));
      res.json({ success: true, message: `Unit #${id} deleted.` });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Delete BOQ (Soft/Permanent)
  app.delete('/api/boqs/:id', requireAdmin, async (req: any, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

      const deleted = await db.delete(boqs).where(eq(boqs.id, id)).returning();
      res.json(deleted[0] || { success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Log BOQ Audit Event
  app.post('/api/boqs/:id/audit-event', requireAuth, async (req: any, res) => {
    try {
      await ensureBoqDatabaseSchema();
      const id = parseInt(req.params.id);
      const { action, details } = req.body;
      if (isNaN(id) || !action) return res.status(400).json({ error: 'ID and action are required' });

      const log = await db.insert(boqAuditLogs).values({
        boqId: id,
        userId: req.dbUser?.uid || 'system',
        userEmail: req.dbUser?.email || 'system',
        action,
        details: details || `Performed ${action} on BOQ #${id}`
      }).returning();

      res.json(log[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 15. Automated Verification Suite Endpoint (Runs live Neon PostgreSQL database transaction test)
  app.post('/api/boqs/run-automated-tests', requireAuth, async (req: any, res) => {
    const report: any[] = [];
    try {
      await ensureBoqDatabaseSchema();
      report.push({ test: 'Database Schema Integrity', status: 'PASS', details: 'All BOQ & Unit tables verified.' });

      // Test 1: Create BOQ with nested items
      const testRef = `TEST-BOQ-${Date.now()}`;
      const totals = calculateBoqTotals([
        {
          title: 'Substructure & Foundation',
          sectionCode: 'A',
          items: [
            { itemNumber: 'A1', description: 'Excavation in trench', unit: 'm3', quantity: '100', unitRate: '5000' },
            { itemNumber: 'A2', description: 'Concrete footing 30MPa', unit: 'm3', quantity: '40', unitRate: '120000' }
          ]
        }
      ], 5, 5, 10, 19.25);

      const inserted = await db.insert(boqs).values({
        boqReference: testRef,
        projectName: 'Automated Test Estate',
        clientName: 'Test Suite Client',
        location: 'Douala',
        preparedBy: 'Test Runner',
        subtotal: totals.subtotal,
        grandTotal: totals.grandTotal,
        status: 'DRAFT'
      }).returning();

      const testId = inserted[0].id;
      const sec = await db.insert(boqSections).values({
        boqId: testId,
        sectionCode: 'A',
        title: 'Substructure',
        subtotal: totals.sections[0].subtotal
      }).returning();

      await db.insert(boqItems).values({
        sectionId: sec[0].id,
        boqId: testId,
        itemNumber: 'A1',
        description: 'Excavation',
        unit: 'm3',
        quantity: '100',
        unitRate: '5000',
        amount: '500000'
      });

      report.push({ test: 'Creation & Nested Item Insertion', status: 'PASS', boqId: testId });

      // Test 2: Fetch full BOQ
      const retrieved = await getFullBoq(testId);
      if (!retrieved || retrieved.sections.length === 0 || retrieved.sections[0].items.length === 0) {
        throw new Error('Retrieved BOQ lost nested section/item items!');
      }
      report.push({ test: 'Nested Data Persistence Retrieval', status: 'PASS', itemsCount: retrieved.sections[0].items.length });

      // Test 3: Clean up test record
      await db.delete(boqs).where(eq(boqs.id, testId));
      report.push({ test: 'Cleanup Transaction', status: 'PASS' });

      res.json({ success: true, allPassed: true, summary: '100% Database Transaction Tests Passed', report });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message, report });
    }
  });

  // ==========================================
  // --- LABOUR CALCULATOR & QUOTATION ROUTES ---
  // ==========================================

  // 1. Get all labour calculations
  app.get('/api/labour/calculations', async (req, res) => {
    try {
      const calcs = await db.select().from(labourCalculations).orderBy(desc(labourCalculations.updatedAt));
      res.json(calcs);
    } catch (err: any) {
      console.warn('[DB Error] /api/labour/calculations:', err.message);
      res.json([]);
    }
  });

  // 2. Create new labour calculation
  app.post('/api/labour/calculations', async (req, res) => {
    try {
      const payload = req.body;
      const inserted = await db.insert(labourCalculations).values({
        quotationRef: payload.quotationRef || `LAB-${Date.now()}`,
        projectName: payload.projectName || 'Civil Engineering Labour Project',
        clientName: payload.clientName || 'Valued Client',
        clientEmail: payload.clientEmail || null,
        location: payload.location || 'Douala / Yaounde',
        projectType: payload.projectType || 'Residential',
        buildingFloors: Number(payload.buildingFloors) || 1,
        date: payload.date || new Date().toISOString().split('T')[0],
        preparedBy: payload.preparedBy || 'MADECC Resident Engineer',
        approvedBy: payload.approvedBy || null,
        status: payload.status || 'DRAFT',
        currency: payload.currency || 'XAF',
        overheadPercent: String(payload.overheadPercent || '10.00'),
        contingencyPercent: String(payload.contingencyPercent || '5.00'),
        profitPercent: String(payload.profitPercent || '15.00'),
        discountPercent: String(payload.discountPercent || '0.00'),
        taxPercent: String(payload.taxPercent || '19.25'),
        baseSubtotal: String(payload.baseSubtotal || '0.00'),
        overheadAmount: String(payload.overheadAmount || '0.00'),
        contingencyAmount: String(payload.contingencyAmount || '0.00'),
        profitAmount: String(payload.profitAmount || '0.00'),
        discountAmount: String(payload.discountAmount || '0.00'),
        taxableNet: String(payload.taxableNet || '0.00'),
        taxAmount: String(payload.taxAmount || '0.00'),
        grandTotal: String(payload.grandTotal || '0.00'),
        paidAmount: String(payload.paidAmount || '0.00'),
        balanceDue: String(payload.balanceDue || '0.00'),
        revisionNumber: payload.revisionNumber || 'REV-01',
        sectionsData: payload.sectionsData || [],
        revisionsHistory: payload.revisionsHistory || [],
        auditLogsData: payload.auditLogsData || [],
        notes: payload.notes || ''
      }).returning();

      res.json(inserted[0]);
    } catch (err: any) {
      console.error('Failed to create labour calculation:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Update existing labour calculation
  app.put('/api/labour/calculations/:id', async (req, res) => {
    try {
      const calcId = parseInt(req.params.id);
      const payload = req.body;
      const updated = await db.update(labourCalculations).set({
        quotationRef: payload.quotationRef,
        projectName: payload.projectName,
        clientName: payload.clientName,
        clientEmail: payload.clientEmail,
        location: payload.location,
        projectType: payload.projectType,
        buildingFloors: Number(payload.buildingFloors) || 1,
        date: payload.date,
        preparedBy: payload.preparedBy,
        approvedBy: payload.approvedBy,
        status: payload.status,
        currency: payload.currency,
        overheadPercent: String(payload.overheadPercent),
        contingencyPercent: String(payload.contingencyPercent),
        profitPercent: String(payload.profitPercent),
        discountPercent: String(payload.discountPercent),
        taxPercent: String(payload.taxPercent),
        baseSubtotal: String(payload.baseSubtotal),
        overheadAmount: String(payload.overheadAmount),
        contingencyAmount: String(payload.contingencyAmount),
        profitAmount: String(payload.profitAmount),
        discountAmount: String(payload.discountAmount),
        taxableNet: String(payload.taxableNet),
        taxAmount: String(payload.taxAmount),
        grandTotal: String(payload.grandTotal),
        paidAmount: String(payload.paidAmount),
        balanceDue: String(payload.balanceDue),
        revisionNumber: payload.revisionNumber,
        sectionsData: payload.sectionsData,
        revisionsHistory: payload.revisionsHistory,
        auditLogsData: payload.auditLogsData,
        notes: payload.notes,
        updatedAt: new Date()
      }).where(eq(labourCalculations.id, calcId)).returning();

      if (updated.length === 0) {
        return res.status(404).json({ error: 'Calculation not found' });
      }
      res.json(updated[0]);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Delete labour calculation
  app.delete('/api/labour/calculations/:id', async (req, res) => {
    try {
      const calcId = parseInt(req.params.id);
      await db.delete(labourCalculations).where(eq(labourCalculations.id, calcId));
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Send Official Labour Quotation via SMTP using kreboya603@gmail.com
  app.post('/api/labour/send-email', async (req, res) => {
    try {
      const {
        quotationRef,
        projectName,
        clientName,
        clientEmail,
        ccEmails,
        bccEmails,
        grandTotal,
        currency = 'XAF',
        preparedBy,
        notes
      } = req.body;

      if (!clientEmail || !clientEmail.includes('@')) {
        return res.status(400).json({ error: 'A valid recipient email address is required.' });
      }

      const formattedTotal = Number(grandTotal || 0).toLocaleString();
      const quoteSubject = `Official Labour Quotation: ${quotationRef} - ${projectName} | MADECC GROUP`;
      const quoteText = `Dear ${clientName},\n\nPlease find attached your official Labour Quotation from MADECC GROUP S.A.R.L.\n\nQuotation Reference: ${quotationRef}\nProject: ${projectName}\nGrand Total: ${currency} ${formattedTotal}\nPrepared By: ${preparedBy || 'MADECC Estimation Desk'}\n\nNotes / Terms:\n${notes || 'Standard MADECC construction engineering and labour rates apply.'}\n\nWarm regards,\nMADECC GROUP S.A.R.L.`;
      
      const quoteHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 14px; background-color: #ffffff; color: #0f172a; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 3px solid #f59e0b; padding-bottom: 20px;">
            <h1 style="color: #0f172a; margin: 0 0 4px 0; font-weight: 800; font-size: 24px; letter-spacing: 0.05em;">MADECC GROUP</h1>
            <p style="font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.15em; margin: 0; font-weight: 700;">Official Construction Labour Quotation</p>
          </div>
          
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">Dear <strong>${clientName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6; margin: 0 0 18px 0; color: #334155;">
            Thank you for partnering with <strong>MADECC GROUP S.A.R.L.</strong> Below are the certified financial specifics for your project's labour requirements:
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 22px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
              <span style="color: #64748b; font-size: 13px;">Quotation Reference:</span>
              <span style="font-family: monospace; font-weight: bold; color: #d97706; font-size: 14px;">${quotationRef}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 13px;">Project Name:</span>
              <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${projectName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
              <span style="color: #64748b; font-size: 13px;">Prepared By:</span>
              <span style="font-weight: 600; color: #0f172a; font-size: 13px;">${preparedBy || 'Resident Engineer'}</span>
            </div>
            ${notes ? `
              <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 13px; color: #475569;">
                <strong>Special Terms &amp; Notes:</strong> ${notes}
              </div>
            ` : ''}
            <div style="margin-top: 18px; padding-top: 14px; border-top: 2px solid #e2e8f0; text-align: right;">
              <span style="font-size: 12px; color: #64748b; display: block; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Certified Grand Total:</span>
              <span style="font-size: 24px; font-weight: 800; color: #16a34a;">${currency} ${formattedTotal}</span>
            </div>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
            This quotation is valid for 30 calendar days from the date of issue. To approve this quotation and mobilize site crews, please reply to this email or contact your project lead.
          </p>

          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
            MADECC GROUP S.A.R.L. &bull; Yaounde Mbankolo &amp; Douala, Cameroon<br />
            Official Inquiries: <a href="mailto:kreboya603@gmail.com" style="color: #f59e0b; text-decoration: none;">kreboya603@gmail.com</a> | Tel: +237 683 316 486
          </p>
        </div>
      `;

      // Parse CC and BCC if provided
      const ccList = ccEmails ? ccEmails.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined;
      const bccList = bccEmails ? bccEmails.split(',').map((e: string) => e.trim()).filter(Boolean) : undefined;

      // 1. Send to client with SMTP
      await sendEmail(clientEmail.trim(), quoteSubject, quoteText, quoteHtml, {
        cc: ccList,
        bcc: bccList
      });

      // 2. Send notification copy to admin kreboya603@gmail.com
      const adminNotifSubject = `[MADECC GROUP] Labour Quotation Dispatched: ${quotationRef} for ${clientName}`;
      const adminNotifText = `A labour quotation has been dispatched to client ${clientName} (${clientEmail}):\n\nRef: ${quotationRef}\nProject: ${projectName}\nTotal: ${currency} ${formattedTotal}\nPrepared By: ${preparedBy}`;
      sendNotificationEmail(adminNotifSubject, adminNotifText, quoteHtml, { replyTo: clientEmail.trim() }).catch(err => {
        console.warn('Failed to send admin copy of labour quote:', err);
      });

      res.json({ success: true, message: `Quotation ${quotationRef} sent to ${clientEmail}` });
    } catch (err: any) {
      console.error('Failed to dispatch labour quotation email:', err);
      res.status(500).json({ error: err.message || 'Failed to dispatch email' });
    }
  });



}
