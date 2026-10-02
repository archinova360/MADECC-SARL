import { jsPDF } from 'jspdf';
import { numberToWords, numberToWordsFr } from './numberToWords';

export interface ExportPdfOptions {
  orientation?: 'portrait' | 'landscape';
  companyName?: string;
  showTerms?: boolean;
  language?: 'en' | 'fr';
}

/**
 * Enterprise A4 BOQ / DQE PDF Generator for MADECC Group SARL.
 * Guarantees zero section cut-offs, clean pagination, continuous table headers on multi-page breaks,
 * complete financial breakdown, amount in words, engineer approval seal, and contract terms.
 * Fully supports English BOQ and French DQE (Devis Quantitatif et Estimatif).
 */
export async function generateBoqPdf(boq: any, options: ExportPdfOptions = {}): Promise<{ pdf: jsPDF; filename: string }> {
  const isFrench = options.language === 'fr' || boq?.language === 'fr' || boq?.isFrenchVersion === true;
  const orientation = options.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12; // 12mm margins for max printable width
  const contentWidth = pageWidth - (margin * 2);

  const companyName = options.companyName || 'MADECC Group SARL';
  const boqRef = boq?.boqReference || (isFrench ? 'MADECC-DQE-2026-0001' : 'MADECC-BOQ-2026-0001');
  const revNum = boq?.revisionNumber || 'REV-00';
  const currency = boq?.currency || 'XAF';
  const projClean = String(boq?.projectName || boqRef).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${isFrench ? 'DQE_FR' : 'BOQ'}_${projClean}_${dateStr}.pdf`;

  let currentY = margin;
  let pageNum = 1;

  // Track active section for continuation headers on page break
  let activeSectionCode = '';
  let activeSectionTitle = '';
  let isInTable = false;

  // Column widths definition
  const colW = isLandscape
    ? { item: 16, desc: 125, unit: 18, qty: 22, rate: 32, amount: 40 }
    : { item: 14, desc: 82, unit: 16, qty: 18, rate: 26, amount: 30 };
  // Total portrait: 14 + 82 + 16 + 18 + 26 + 30 = 186mm (exact contentWidth)

  // 1. Draw Page Header (Cover banner for page 1, compact banner for page 2+)
  function drawHeader(page: number, isFirstPage: boolean) {
    if (isFirstPage) {
      // Top Navy Banner
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(margin, currentY, contentWidth, 24, 'F');

      // Accent amber stripe
      doc.setFillColor(217, 119, 6); // Amber-600
      doc.rect(margin, currentY + 24, contentWidth, 1.5, 'F');

      // Logo Emblem Badge
      doc.setFillColor(217, 119, 6);
      doc.roundedRect(margin + 4, currentY + 4, 16, 16, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('M', margin + 12, currentY + 14.5, { align: 'center' });

      // Company Title & Identity
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(companyName, margin + 24, currentY + 9);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(251, 191, 36); // Amber-400
      doc.text(
        isFrench
          ? 'Département du Génie Civil, Structures & Économie de la Construction'
          : 'Civil, Structural & Mechanical Engineering Department',
        margin + 24,
        currentY + 14
      );

      doc.setTextColor(203, 213, 225);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Douala & Yaoundé, Republic of Cameroon | Email: engineering@madeccgroup.cm | Tel: +237 671 063 511', margin + 24, currentY + 19);

      // Official BOQ Badge on Right
      const badgeW = 58;
      const badgeX = pageWidth - margin - badgeW - 4;
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.setDrawColor(217, 119, 6);
      doc.roundedRect(badgeX, currentY + 4, badgeW, 16, 2, 2, 'FD');

      doc.setTextColor(251, 191, 36);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.text(isFrench ? 'DEVIS ESTIMATIF (DQE)' : 'OFFICIAL BOQ ESTIMATE', badgeX + (badgeW / 2), currentY + 9, { align: 'center' });
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`REF: ${boqRef} | ${revNum}`, badgeX + (badgeW / 2), currentY + 14.5, { align: 'center' });

      currentY += 28;

      // Project & Client Metadata Card
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);

      // Col 1
      doc.text(isFrench ? 'PROJET :' : 'PROJECT:', margin + 4, currentY + 5.5);
      doc.setFont('helvetica', 'normal');
      const projName = String(boq?.projectName || (isFrench ? 'Projet de Construction Résidentielle' : 'Workshop Practice Materials Command'));
      doc.text(projName.length > 44 ? projName.slice(0, 42) + '...' : projName, margin + 22, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.text(isFrench ? 'LIEU :' : 'LOCATION:', margin + 4, currentY + 11.5);
      doc.setFont('helvetica', 'normal');
      doc.text(String(boq?.location || (isFrench ? 'Douala, Région du Littoral, Cameroun' : 'Douala, Littoral Region, Cameroon')).slice(0, 42), margin + 22, currentY + 11.5);

      doc.setFont('helvetica', 'bold');
      doc.text('DATE:', margin + 4, currentY + 17.5);
      doc.setFont('helvetica', 'normal');
      const dt = boq?.datePrepared ? new Date(boq.datePrepared).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR');
      doc.text(dt, margin + 22, currentY + 17.5);

      // Col 2
      const midX = margin + (contentWidth / 2);
      doc.setFont('helvetica', 'bold');
      doc.text(isFrench ? 'CLIENT :' : 'CLIENT:', midX, currentY + 5.5);
      doc.setFont('helvetica', 'normal');
      const clName = String(boq?.clientName || 'ELOHIM ACADEMIC COMPLEX');
      doc.text(clName.length > 40 ? clName.slice(0, 38) + '...' : clName, midX + 18, currentY + 5.5);

      doc.setFont('helvetica', 'bold');
      doc.text(isFrench ? 'CONTRAT :' : 'CONTRACT:', midX, currentY + 11.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`${boq?.contractType || (isFrench ? 'BPU' : 'UNIT_RATE')} | ${boq?.status || (isFrench ? 'BROUILLON' : 'DRAFT')}`, midX + 22, currentY + 11.5);

      doc.setFont('helvetica', 'bold');
      doc.text(isFrench ? 'ÉTABLI PAR :' : 'PREPARED BY:', midX, currentY + 17.5);
      doc.setFont('helvetica', 'normal');
      doc.text(String(boq?.preparedBy || (isFrench ? 'Ingénieur Métreur Vérificateur' : 'Lead Quantity Surveyor')).slice(0, 36), midX + 26, currentY + 17.5);

      currentY += 28;
    } else {
      // Running compact header on page 2+ (Height 12mm)
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(margin, currentY, contentWidth, 11, 'F');
      doc.setFillColor(217, 119, 6); // Amber stripe
      doc.rect(margin, currentY + 11, contentWidth, 1, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(companyName, margin + 4, currentY + 7);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(203, 213, 225);
      doc.text(
        isFrench ? 'Studio Métreur Vérificateur & DQE Officiel' : 'Enterprise Quantity Surveying BOQ Studio',
        margin + 46,
        currentY + 7
      );

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(251, 191, 36);
      doc.text(`Ref: ${boqRef} (${revNum})`, pageWidth - margin - 4, currentY + 7, { align: 'right' });

      currentY += 15;
    }
  }

  // 2. Draw Table Header Row
  function drawTableHeaderRow(y: number) {
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, y, contentWidth, 6.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(255, 255, 255);

    let x = margin;
    doc.text(isFrench ? 'RÉF' : 'ITEM', x + 2, y + 4.5); x += colW.item;
    doc.text(isFrench ? 'DÉSIGNATION DES TRAVAUX & SPÉCIFICATIONS' : 'DESCRIPTION OF WORKS & SPECIFICATIONS', x + 2, y + 4.5); x += colW.desc;
    doc.text(isFrench ? 'UNITÉ' : 'UNIT', x + (colW.unit / 2), y + 4.5, { align: 'center' }); x += colW.unit;
    doc.text(isFrench ? 'QTÉ' : 'QTY', x + colW.qty - 2, y + 4.5, { align: 'right' }); x += colW.qty;
    doc.text(isFrench ? `P.U (${currency})` : `UNIT RATE (${currency})`, x + colW.rate - 2, y + 4.5, { align: 'right' }); x += colW.rate;
    doc.text(isFrench ? `MONTANT (${currency})` : `AMOUNT (${currency})`, x + colW.amount - 2, y + 4.5, { align: 'right' });
  }

  // 3. Draw Section Continuation Banner on page break
  function drawSectionContinuation(secCode: string, secTitle: string) {
    doc.setFillColor(51, 65, 85); // Slate-700
    doc.rect(margin, currentY, contentWidth, 6, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(251, 191, 36); // Amber-400
    const contPrefix = isFrench ? `LOT ${secCode}: ${secTitle} (SUITE)` : `SECTION ${secCode}: ${secTitle} (CONTINUED)`;
    const contText = contPrefix.toUpperCase();
    doc.text(contText, margin + 3, currentY + 4.2);

    currentY += 6.5;
    drawTableHeaderRow(currentY);
    currentY += 7;
  }

  // 4. Safe Page Break Engine
  function ensureSpace(requiredHeight: number, isSectionStart: boolean = false, secCode: string = '', secTitle: string = '') {
    const bottomLimit = pageHeight - 16; // 16mm from bottom for safe margin and footer
    if (currentY + requiredHeight > bottomLimit) {
      doc.addPage();
      pageNum++;
      currentY = margin;
      drawHeader(pageNum, false);

      if (isInTable && !isSectionStart && activeSectionCode) {
        drawSectionContinuation(activeSectionCode, activeSectionTitle);
      }
    }
  }

  // Start Page 1 Header & Metadata
  drawHeader(1, true);

  // 5. Draw All BOQ Sections & Line Items
  const sections = Array.isArray(boq?.sections) ? boq.sections : [];

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    const secCode = String(sec.sectionCode || `${sIdx + 1}.0`);
    const secTitle = String(sec.title || (isFrench ? `Lot Technique ${sIdx + 1}` : 'Work Items'));
    activeSectionCode = secCode;
    activeSectionTitle = secTitle;
    isInTable = true;

    // Ensure space for Section Header (7.5mm) + Table Header (6.5mm) + First Item (~12mm) = 26mm
    ensureSpace(26, true, secCode, secTitle);

    // Section Header Bar
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(margin, currentY, contentWidth, 7.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const secPrefix = isFrench ? `LOT ${secCode}: ${secTitle}` : `SECTION ${secCode}: ${secTitle}`;
    const secHeaderTitle = secPrefix.toUpperCase();
    doc.text(secHeaderTitle, margin + 3, currentY + 5.2);

    currentY += 7.5;

    // Draw Column Headers
    drawTableHeaderRow(currentY);
    currentY += 6.5;

    // Line items
    const items = Array.isArray(sec.items) ? sec.items : [];
    let secSubtotalNum = 0;

    for (let iIdx = 0; iIdx < items.length; iIdx++) {
      const item = items[iIdx];
      const itemNum = String(item.itemNumber || `${secCode}.${iIdx + 1}`);
      const desc = String(item.description || 'General Item Description');
      const unit = String(item.unit || (isFrench ? 'U' : 'Item'));
      const qty = Number(item.quantity || 0);
      const rate = Number(item.unitRate || 0);
      const amt = Number(item.amount || (qty * rate));
      secSubtotalNum += amt;

      // Wrap description text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      const splitDesc = doc.splitTextToSize(desc, colW.desc - 4);
      const lineCount = Math.max(splitDesc.length, 1);
      const rowHeight = Math.max(lineCount * 3.8 + 2.5, 6);

      // Check space for this row
      ensureSpace(rowHeight, false, secCode, secTitle);

      // Alternating row background
      if (iIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
      }

      // Bottom subtle border
      doc.setDrawColor(226, 232, 240); // Slate-200
      doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

      // Cell texts
      doc.setTextColor(15, 23, 42);
      let curX = margin;

      // Col 1: Item
      doc.setFont('helvetica', 'bold');
      doc.text(itemNum, curX + 2, currentY + 4);
      curX += colW.item;

      // Col 2: Desc
      doc.setFont('helvetica', 'normal');
      doc.text(splitDesc, curX + 2, currentY + 3.8);
      curX += colW.desc;

      // Col 3: Unit
      doc.text(unit, curX + (colW.unit / 2), currentY + 4, { align: 'center' });
      curX += colW.unit;

      // Col 4: Qty
      doc.text(qty.toLocaleString(), curX + colW.qty - 2, currentY + 4, { align: 'right' });
      curX += colW.qty;

      // Col 5: Unit Rate
      doc.text(rate.toLocaleString(), curX + colW.rate - 2, currentY + 4, { align: 'right' });
      curX += colW.rate;

      // Col 6: Amount
      doc.setFont('helvetica', 'bold');
      doc.text(amt.toLocaleString(), curX + colW.amount - 2, currentY + 4, { align: 'right' });

      currentY += rowHeight;
    }

    // Section Subtotal Bar
    ensureSpace(10, false, secCode, secTitle);
    doc.setFillColor(241, 245, 249); // Slate-100
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.line(margin, currentY + 7, margin + contentWidth, currentY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    const subtotalLabel = isFrench ? `SOUS-TOTAL LOT ${secCode} (${secTitle}) :` : `SUBTOTAL SECTION ${secCode} (${secTitle}):`;
    doc.text(subtotalLabel, margin + 4, currentY + 4.8);

    const secSubtotal = `${secSubtotalNum.toLocaleString()} ${currency}`;
    doc.text(`${secSubtotal}`, pageWidth - margin - 3, currentY + 4.8, { align: 'right' });

    currentY += 9;
  }

  isInTable = false;

  // 6. Commercial Financial Summary Recap Card
  const recapRowsCount = 3 + 
    (Number(boq?.overheadAmount || 0) > 0 ? 1 : 0) +
    (Number(boq?.contingencyAmount || 0) > 0 ? 1 : 0) +
    (Number(boq?.profitAmount || 0) > 0 ? 1 : 0) +
    (Number(boq?.taxAmount || 0) > 0 ? 1 : 0);

  const recapCardHeight = 22 + (recapRowsCount * 5.2) + 14;
  ensureSpace(recapCardHeight);

  const recapW = isLandscape ? 130 : 110;
  const recapX = pageWidth - margin - recapW;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(recapX, currentY, recapW, recapCardHeight - 2, 2, 2, 'FD');

  // Header of Recap Card
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(recapX, currentY, recapW, 7, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text(
    isFrench ? 'RÉCAPITULATIF FINANCIER & COMMERCIAL (DQE)' : 'COMMERCIAL & FINANCIAL SUMMARY RECAP',
    recapX + (recapW / 2),
    currentY + 4.8,
    { align: 'center' }
  );

  let sy = currentY + 12;

  const drawRecapLine = (label: string, valueStr: string, isBold = false, isAmber = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(isAmber ? 217 : (isBold ? 15 : 71), isAmber ? 119 : (isBold ? 23 : 85), isAmber ? 6 : (isBold ? 42 : 105));
    doc.text(label, recapX + 4, sy);
    doc.text(valueStr, recapX + recapW - 4, sy, { align: 'right' });
    sy += 5.2;
  };

  drawRecapLine(
    isFrench ? 'SOUS-TOTAL DES TRAVAUX (HT) :' : 'MEASURED WORKS SUBTOTAL:',
    `${Number(boq?.subtotal || 0).toLocaleString()} ${currency}`,
    true
  );

  if (Number(boq?.overheadAmount || 0) > 0) {
    drawRecapLine(
      isFrench ? `Frais Généraux & Logistique (${boq?.overheadPercent || 0}%) :` : `Site Overhead & Logistics (${boq?.overheadPercent || 0}%):`,
      `+${Number(boq.overheadAmount).toLocaleString()} ${currency}`
    );
  }
  if (Number(boq?.contingencyAmount || 0) > 0) {
    drawRecapLine(
      isFrench ? `Imprévus & Aléas Techniques (${boq?.contingencyPercent || 0}%) :` : `Unforeseen Contingencies (${boq?.contingencyPercent || 0}%):`,
      `+${Number(boq.contingencyAmount).toLocaleString()} ${currency}`
    );
  }
  if (Number(boq?.profitAmount || 0) > 0) {
    drawRecapLine(
      isFrench ? `Bénéfice Entreprise (${boq?.profitPercent || 0}%) :` : `Contractor Profit Margin (${boq?.profitPercent || 0}%):`,
      `+${Number(boq.profitAmount).toLocaleString()} ${currency}`
    );
  }
  if (Number(boq?.taxAmount || 0) > 0) {
    drawRecapLine(
      isFrench ? `Taxe sur la Valeur Ajoutée / TVA (${boq?.taxPercent || 0}%) :` : `Value Added Tax / TVA (${boq?.taxPercent || 0}%):`,
      `+${Number(boq.taxAmount).toLocaleString()} ${currency}`
    );
  }

  doc.setDrawColor(217, 119, 6);
  doc.line(recapX + 4, sy - 1, recapX + recapW - 4, sy - 1);

  const grandTotalNum = Number(boq?.grandTotal || 0);
  drawRecapLine(
    isFrench ? 'MONTANT TOTAL ESTIMÉ (TTC) :' : 'GRAND TOTAL ESTIMATE:',
    `${grandTotalNum.toLocaleString()} ${currency}`,
    true,
    true
  );

  // Amount in Words
  sy += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(isFrench ? 'MONTANT EN TOUTES LETTRES :' : 'AMOUNT IN WORDS:', recapX + 4, sy);
  sy += 3.8;

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  const wordsStr = isFrench
    ? (boq?.amountInWords || numberToWordsFr(grandTotalNum, currency))
    : (boq?.amountInWords || boq?.metadata?.amountInWords || numberToWords(grandTotalNum, currency));
  const wordsLines = doc.splitTextToSize(wordsStr, recapW - 8);
  doc.text(wordsLines, recapX + 4, sy);

  currentY += recapCardHeight + 4;

  // 7. Revision History & Engineer of Record Approval Block
  ensureSpace(40);

  const halfWidth = (contentWidth - 6) / 2;

  // Left Box: Revision History
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, halfWidth, 34, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, halfWidth, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(isFrench ? 'HISTORIQUE DES RÉVISIONS & AUDIT TECHNIQUE' : 'REVISION & AUDIT HISTORY', margin + 4, currentY + 4.2);

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text(isFrench ? 'RÉV' : 'REV', margin + 4, currentY + 10);
  doc.text('DATE', margin + 20, currentY + 10);
  doc.text(isFrench ? 'DÉSIGNATION / REMARQUES' : 'DESCRIPTION / REMARKS', margin + 42, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const revDate = boq?.revisionDate || boq?.metadata?.revisionDate || (boq?.datePrepared ? new Date(boq.datePrepared).toLocaleDateString('fr-FR') : '31/07/2026');
  const revDesc = boq?.revisionDescription || boq?.metadata?.revisionDescription || (isFrench ? 'Devis Quantitatif et Estimatif Certifié' : 'Certified Engineering Cost Plan');
  doc.text(revNum, margin + 4, currentY + 16);
  doc.text(revDate, margin + 20, currentY + 16);
  doc.text(revDesc, margin + 42, currentY + 16);

  if (boq?.revisions && boq.revisions.length > 0) {
    const rev2 = boq.revisions[0];
    doc.text(String(rev2.revisionNumber || 'REV-01'), margin + 4, currentY + 22);
    doc.text(new Date(rev2.approvedAt || Date.now()).toLocaleDateString('fr-FR'), margin + 20, currentY + 22);
    doc.text(String(rev2.notes || (isFrench ? 'Calibration des Prix & Quantités' : 'Rate & Scope Calibration')).slice(0, 24), margin + 42, currentY + 22);
  }

  // Right Box: Official Approval & Security Stamp
  const appX = margin + halfWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(appX, currentY, halfWidth, 34, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(appX, currentY, halfWidth, 6, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(isFrench ? 'VISA DE L\'INGÉNIEUR & APPROBATION LÉGALE' : 'ENGINEER OF RECORD & STATUTORY SIGN-OFF', appX + 4, currentY + 4.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(isFrench ? 'Établi par :' : 'Prepared by:', appX + 4, currentY + 11);
  doc.setFont('helvetica', 'bold');
  const preparedByName = boq?.preparedBy || (isFrench ? 'Ingénieur Métreur Vérificateur BTP' : 'Lead Quantity Surveyor & Workshop Engineer');
  doc.text(String(preparedByName), appX + 24, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.text(isFrench ? 'Vérification Métreur :' : 'QS Verification:', appX + 4, currentY + 17);
  doc.setFont('helvetica', 'bold');
  const qsVerificationName = boq?.qsVerification || boq?.metadata?.qsVerification || (isFrench ? 'Direction Économie de la Construction MADECC' : 'MADECC Directorate of Cost Engineering');
  doc.text(String(qsVerificationName), appX + 24, currentY + 17);

  doc.setFont('helvetica', 'normal');
  doc.text(isFrench ? 'Ingénieur en Chef :' : 'Chief Engineer:', appX + 4, currentY + 23);
  doc.setFont('helvetica', 'bold');
  const chiefEngName = boq?.approvedBy || boq?.chiefEngineer || boq?.metadata?.chiefEngineer || 'Ing. Marcel Mbida, PE (ONIGC 4092)';
  doc.text(String(chiefEngName), appX + 24, currentY + 23);

  // Circular Seal Stamp
  const sealCenterX = appX + halfWidth - 14;
  const sealCenterY = currentY + 20;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.circle(sealCenterX, sealCenterY, 7);
  doc.circle(sealCenterX, sealCenterY, 5.8);

  const sealCompany = boq?.sealText || boq?.metadata?.sealText || 'MADECC GROUP';
  const sealSub = boq?.sealSubtext || boq?.metadata?.sealSubtext || 'SARL';
  doc.setFontSize(4.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text(sealCompany, sealCenterX, sealCenterY - 1.5, { align: 'center' });
  doc.text(sealSub, sealCenterX, sealCenterY + 0.8, { align: 'center' });
  doc.text(isFrench ? 'SCEAU CERTIFIÉ' : 'CERTIFIED SEAL', sealCenterX, sealCenterY + 3.2, { align: 'center' });

  currentY += 38;

  // 8. Tender Notes & Commercial Terms
  if (options.showTerms !== false) {
    ensureSpace(28);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(15, 23, 42);
    doc.text(
      isFrench ? 'CONDITIONS CONTRACTUELLES GÉNÉRALES & EXÉCUTION DU MARCHÉ' : 'COMMERCIAL TENDER NOTES & CONDITIONS OF EXECUTION',
      margin + 4,
      currentY + 4.5
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(71, 85, 105);

    const terms = isFrench
      ? [
          '1. Validité de l\'Offre : Le présent Devis Quantitatif et Estimatif (DQE) est ferme et valable pour une durée de 90 jours calendaires.',
          '2. Conditions de Paiement : Règlements progressifs sur situations de travaux validées par PV et Décomptes Provisoires (IPC).',
          '3. Assurance Qualité : Matériaux et équipements strictement conformes aux normes techniques en vigueur au Cameroun (DTU/Eurocodes).',
          '4. Garantie & Retenue : Garantie décennale et période de parfait achèvement de 12 mois adossée à une retenue de garantie de 5%.'
        ]
      : [
          '1. Pricing Validity: This Bill of Quantities constitutes a binding commercial quotation valid for 90 calendar days from issue date.',
          '2. Payment Terms: Progressive monthly valuations certified via Interim Payment Certificates (IPC) payable within 21 days of approval.',
          '3. Quality Assurance: All materials, tools, and equipment conform strictly to British Standards (BS) and Cameroon technical norms.',
          '4. Warranty & Guarantee: Works and equipment carry a mandatory 12-month Defects Liability Period (DLP) supported by 5% retention.'
        ];

    terms.forEach((t, tIdx) => {
      doc.text(t, margin + 4, currentY + 8.5 + (tIdx * 3.6));
    });

    currentY += 27;
  }

  // 9. Final Multi-page Footer Stamping Pass
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 9;

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${companyName} — ${isFrench ? 'Devis Quantitatif et Estimatif Officiel (DQE)' : 'Official Certified Bill of Quantities'} | Ref: ${boqRef} (${revNum})`,
      margin,
      footerY + 2
    );
    doc.text(
      `${isFrench ? 'Page ' + p + ' sur ' + totalPages : 'Page ' + p + ' of ' + totalPages} | ${isFrench ? 'Émis le :' : 'Issued:'} ${dateStr}`,
      pageWidth - margin,
      footerY + 2,
      { align: 'right' }
    );
  }

  return { pdf: doc, filename };
}
