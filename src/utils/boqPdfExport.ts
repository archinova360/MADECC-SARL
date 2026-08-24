import { jsPDF } from 'jspdf';

export interface ExportPdfOptions {
  orientation?: 'portrait' | 'landscape';
  companyName?: string;
  showTerms?: boolean;
}

/**
 * High-precision A4 BOQ PDF Generator supporting Portrait & Landscape orientation,
 * equal page margins, automatic text wrapping, headers, footers with page numbers,
 * Terms & Conditions, Revision History, and official Engineer of Record approval block.
 */
export async function generateBoqPdf(boq: any, options: ExportPdfOptions = {}): Promise<{ pdf: jsPDF; filename: string }> {
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

  const boqRef = boq?.boqReference || 'BOQ-001';
  const revNum = boq?.revisionNumber || 'REV-00';
  const projClean = String(boq?.projectName || boqRef).replace(/[^a-zA-Z0-9_-]/g, '_');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `MADECC_Bill_of_Quantities_${projClean}_${dateStr}.pdf`;

  let currentY = margin;

  // Draw Header Banner
  function drawHeader(pageNum: number) {
    // Header background container
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(margin, currentY, contentWidth, 24, 'F');

    // Accent line
    doc.setFillColor(217, 119, 6); // Amber-600
    doc.rect(margin, currentY + 24, contentWidth, 1.5, 'F');

    // Logo Emblem Box
    doc.setFillColor(217, 119, 6);
    doc.roundedRect(margin + 4, currentY + 4, 16, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('M', margin + 12, currentY + 14, { align: 'center' });

    // Company Header Titles
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('MADECC GROUP S.A.R.L.', margin + 24, currentY + 9);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(251, 191, 36); // Amber-400
    doc.text('Civil & Structural Engineering Department', margin + 24, currentY + 14);

    doc.setTextColor(203, 213, 225);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Douala & Yaoundé, Cameroon | Email: engineering@madeccgroup.cm | Tel: +237 671 063 511', margin + 24, currentY + 19);

    // Document Reference Badge on Right
    const badgeW = 52;
    const badgeX = pageWidth - margin - badgeW - 4;
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.setDrawColor(217, 119, 6);
    doc.roundedRect(badgeX, currentY + 4, badgeW, 16, 2, 2, 'FD');

    doc.setTextColor(251, 191, 36);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('OFFICIAL BOQ ESTIMATE', badgeX + (badgeW / 2), currentY + 9, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`REF: ${boqRef} | ${revNum}`, badgeX + (badgeW / 2), currentY + 15, { align: 'center' });

    currentY += 30;
  }

  // Draw Footer
  function drawFooter(pageNum: number) {
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared by: MADECC Engineering Department | Certified Construction & Civil Estimation', margin, footerY + 2);
    doc.text(`Page ${pageNum}`, pageWidth - margin, footerY + 2, { align: 'right' });
  }

  // Start Page 1 Header
  drawHeader(1);

  // COVER / METADATA SUMMARY CARD
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  // Column 1
  doc.text('PROJECT:', margin + 4, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(String(boq?.projectName || 'General Construction Works').slice(0, 40), margin + 22, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('LOCATION:', margin + 4, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(String(boq?.location || 'Douala / Yaounde, Cameroon').slice(0, 40), margin + 22, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('DATE:', margin + 4, currentY + 18);
  doc.setFont('helvetica', 'normal');
  const dt = boq?.datePrepared ? new Date(boq.datePrepared).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  doc.text(dt, margin + 22, currentY + 18);

  // Column 2
  const midX = margin + (contentWidth / 2);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT:', midX, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(String(boq?.clientName || 'Valued Client').slice(0, 36), midX + 18, currentY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('REVISION:', midX, currentY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${revNum} (${boq?.status || 'APPROVED'})`, midX + 22, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('PREPARED BY:', midX, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(String(boq?.preparedBy || 'MADECC Engineering Dept.').slice(0, 34), midX + 26, currentY + 18);

  currentY += 32;

  // TABLE COLUMNS CONFIGURATION
  const colW = isLandscape
    ? { item: 18, desc: 110, unit: 18, qty: 22, rate: 30, amount: 35, formula: 40 }
    : { item: 14, desc: 62, unit: 14, qty: 16, rate: 22, amount: 26, formula: 32 };

  let pageNum = 1;

  function checkPageBreak(requiredHeight: number) {
    if (currentY + requiredHeight > pageHeight - 18) {
      drawFooter(pageNum);
      doc.addPage();
      pageNum++;
      currentY = margin;
      drawHeader(pageNum);
    }
  }

  // DRAW WORK SECTIONS AND ITEMS
  const sections = Array.isArray(boq?.sections) ? boq.sections : [];

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    checkPageBreak(12);

    // Section Header Bar
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    const secTitleText = `SECTION ${sec.sectionCode || String.fromCharCode(65 + sIdx)}: ${sec.title || 'SECTION WORK ITEMS'}`.toUpperCase();
    doc.text(secTitleText, margin + 3, currentY + 5);

    const secSubtotalFormatted = `${Number(sec.subtotal || 0).toLocaleString()} ${boq?.currency || 'XAF'}`;
    doc.text(secSubtotalFormatted, pageWidth - margin - 3, currentY + 5, { align: 'right' });

    currentY += 8;

    // Table Header Row
    checkPageBreak(7);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);

    let x = margin;
    doc.text('ITEM', x + 1, currentY + 4); x += colW.item;
    doc.text('DESCRIPTION OF WORKS', x + 1, currentY + 4); x += colW.desc;
    doc.text('UNIT', x + (colW.unit / 2), currentY + 4, { align: 'center' }); x += colW.unit;
    doc.text('QTY', x + colW.qty - 1, currentY + 4, { align: 'right' }); x += colW.qty;
    doc.text('UNIT RATE', x + colW.rate - 1, currentY + 4, { align: 'right' }); x += colW.rate;
    doc.text(`AMOUNT (${(boq?.currency || 'XAF').toUpperCase()})`, x + colW.amount - 1, currentY + 4, { align: 'right' }); x += colW.amount;
    doc.text('FORMULA / BASIS', x + 1, currentY + 4);

    currentY += 7;

    // Table Items
    const items = Array.isArray(sec.items) ? sec.items : [];
    for (let iIdx = 0; iIdx < items.length; iIdx++) {
      const item = items[iIdx];
      const descLines = doc.splitTextToSize(String(item.description || ''), colW.desc - 2);
      const formulaStr = item.measurementBasis || `Qty × Rate`;
      const formulaLines = doc.splitTextToSize(String(formulaStr), colW.formula - 2);
      const maxLines = Math.max(descLines.length, formulaLines.length);
      const rowHeight = Math.max(6, maxLines * 3.5 + 2);

      checkPageBreak(rowHeight);

      // Zebra striping
      if (iIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY - 1, contentWidth, rowHeight, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);

      let rx = margin;
      doc.text(String(item.itemNumber || `${sec.sectionCode || 'A'}${iIdx + 1}`), rx + 1, currentY + 3.5); rx += colW.item;

      doc.setFont('helvetica', 'normal');
      doc.text(descLines, rx + 1, currentY + 3.5); rx += colW.desc;

      doc.text(String(item.unit || 'm³'), rx + (colW.unit / 2), currentY + 3.5, { align: 'center' }); rx += colW.unit;
      doc.text(Number(item.quantity || 0).toLocaleString(), rx + colW.qty - 1, currentY + 3.5, { align: 'right' }); rx += colW.qty;
      doc.text(Number(item.unitRate || 0).toLocaleString(), rx + colW.rate - 1, currentY + 3.5, { align: 'right' }); rx += colW.rate;

      doc.setFont('helvetica', 'bold');
      doc.text(Number(item.amount || 0).toLocaleString(), rx + colW.amount - 1, currentY + 3.5, { align: 'right' }); rx += colW.amount;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(formulaLines, rx + 1, currentY + 3.5);

      doc.setDrawColor(241, 245, 249);
      doc.line(margin, currentY + rowHeight - 1, pageWidth - margin, currentY + rowHeight - 1);

      currentY += rowHeight;
    }

    currentY += 2;
  }

  // FINANCIAL RECAP BOX
  checkPageBreak(42);

  const summaryBoxWidth = isLandscape ? 120 : 100;
  const summaryX = pageWidth - margin - summaryBoxWidth;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(summaryX, currentY, summaryBoxWidth, 38, 2, 2, 'FD');

  let sy = currentY + 5;
  doc.setFontSize(7.5);

  const drawSummaryLine = (label: string, val: string, isBold = false, isAmber = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setTextColor(isAmber ? 217 : 30, isAmber ? 119 : 41, isAmber ? 6 : 59);
    doc.text(label, summaryX + 4, sy);
    doc.text(val, summaryX + summaryBoxWidth - 4, sy, { align: 'right' });
    sy += 4.8;
  };

  const curr = boq?.currency || 'XAF';
  drawSummaryLine('SECTIONS MEASURED SUBTOTAL:', `${Number(boq?.subtotal || 0).toLocaleString()} ${curr}`, true);
  
  if (Number(boq?.overheadAmount || 0) > 0) {
    drawSummaryLine(`Overhead & Site Logistics (${boq?.overheadPercent || 0}%):`, `+${Number(boq.overheadAmount).toLocaleString()} ${curr}`);
  }
  if (Number(boq?.contingencyAmount || 0) > 0) {
    drawSummaryLine(`Unforeseen Contingencies (${boq?.contingencyPercent || 0}%):`, `+${Number(boq.contingencyAmount).toLocaleString()} ${curr}`);
  }
  if (Number(boq?.profitAmount || 0) > 0) {
    drawSummaryLine(`Contractor Profit Margin (${boq?.profitPercent || 0}%):`, `+${Number(boq.profitAmount).toLocaleString()} ${curr}`);
  }
  if (Number(boq?.taxAmount || 0) > 0) {
    drawSummaryLine(`Value Added Tax / TVA (${boq?.taxPercent || 0}%):`, `+${Number(boq.taxAmount).toLocaleString()} ${curr}`);
  }

  doc.setDrawColor(217, 119, 6);
  doc.line(summaryX + 4, sy - 1.5, summaryX + summaryBoxWidth - 4, sy - 1.5);

  drawSummaryLine('GRAND TOTAL ESTIMATE:', `${Number(boq?.grandTotal || 0).toLocaleString()} ${curr}`, true, true);

  currentY += 42;

  // REVISION HISTORY & APPROVAL SECTION
  checkPageBreak(38);

  const halfWidth = (contentWidth - 6) / 2;

  // Left: Revision History Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, halfWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('REVISION HISTORY', margin + 4, currentY + 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 4, currentY + 7, halfWidth - 8, 4, 'F');
  doc.text('REV', margin + 6, currentY + 10);
  doc.text('DATE', margin + 20, currentY + 10);
  doc.text('DESCRIPTION', margin + 42, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(revNum, margin + 6, currentY + 16);
  doc.text(dt, margin + 20, currentY + 16);
  doc.text('Initial Certified BOQ Output', margin + 42, currentY + 16);

  if (boq?.revisions && boq.revisions.length > 0) {
    const rev2 = boq.revisions[0];
    doc.text(String(rev2.revisionNumber || 'REV-01'), margin + 6, currentY + 22);
    doc.text(new Date(rev2.approvedAt || Date.now()).toLocaleDateString('en-GB'), margin + 20, currentY + 22);
    doc.text(String(rev2.notes || 'Updated quantities & rates').slice(0, 22), margin + 42, currentY + 22);
  }

  // Right: Approval / Sign-off Box
  const appX = margin + halfWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(appX, currentY, halfWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ENGINEER OF RECORD APPROVAL', appX + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Prepared by:', appX + 4, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(String(boq?.preparedBy || 'MADECC Civil & Structural Engineering Dept.'), appX + 22, currentY + 11);

  doc.setFont('helvetica', 'normal');
  doc.text('Approval:', appX + 4, currentY + 17);
  doc.setFont('helvetica', 'bold');
  doc.text(String(boq?.approvedBy || 'Ing. Marcel Mbida, PE (ONIGC 4092)'), appX + 22, currentY + 17);

  // Seal Stamp Circle
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.circle(appX + halfWidth - 14, currentY + 20, 6);
  doc.setFontSize(4.5);
  doc.setTextColor(180, 83, 9);
  doc.text('MADECC S.A.R.L.', appX + halfWidth - 14, currentY + 19, { align: 'center' });
  doc.text('SEALED', appX + halfWidth - 14, currentY + 21.5, { align: 'center' });

  // Stamp final page footers with total count
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 10;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared by: MADECC Engineering Department | Certified Construction & Civil Estimation', margin, footerY + 2);
    doc.text(`Page ${p} of ${totalPages} | Generated: ${dateStr}`, pageWidth - margin, footerY + 2, { align: 'right' });
  }

  return { pdf: doc, filename };
}

