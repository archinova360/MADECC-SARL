import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  Footer,
  PageNumber
} from 'docx';

function sanitizeFilename(str: string): string {
  if (!str) return 'Proposal';
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function getFormattedDate(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

/**
 * Generate A4 PDF for Tender / Proposal
 */
export async function generateProposalPdf(proposal: any): Promise<{ pdf: jsPDF; filename: string }> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  const cleanTitle = sanitizeFilename(proposal.title || 'Proposal');
  const filename = `MADECC_Proposal_${cleanTitle}_${getFormattedDate()}.pdf`;

  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(margin, y, contentWidth, 22, 'F');
  doc.setFillColor(217, 119, 6); // Amber bar
  doc.rect(margin, y + 22, contentWidth, 1.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('MADECC GROUP S.A.R.L.', margin + 6, y + 9);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(251, 191, 36);
  doc.text('TECHNICAL & COMMERCIAL TENDER PROPOSAL', margin + 6, y + 14);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7);
  doc.text('Douala & Yaoundé, Republic of Cameroon | Email: info@madeccgroup.cm | Tel: +237 671 063 511', margin + 6, y + 18.5);

  // Status Badge
  doc.setFillColor(217, 119, 6);
  doc.rect(pageWidth - margin - 52, y + 4, 46, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(`STATUS: ${proposal.status || 'DRAFT'}`, pageWidth - margin - 29, y + 9, { align: 'center' });
  doc.setFontSize(6);
  doc.text(`VER: ${proposal.version || 'v1.0.0'}`, pageWidth - margin - 29, y + 14, { align: 'center' });

  y += 28;

  // Project Info Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`PROPOSAL TITLE: ${(proposal.title || 'Construction Proposal').slice(0, 42)}`, margin + 4, y + 6);
  doc.text(`CLIENT NAME: ${(proposal.clientName || 'Valued Client').slice(0, 42)}`, margin + 4, y + 12);
  doc.text(`PROJECT LOCATION: ${(proposal.location || 'Douala, Cameroon').slice(0, 42)}`, margin + 4, y + 18);
  doc.text(`STANDARDS: FIDIC Red Book / Cameroon Procurement Code`, margin + 4, y + 23);

  const midX = margin + 95;
  doc.text(`TENDER VALUE: ${Number(proposal.projectValue || 0).toLocaleString()} ${proposal.currency || 'XAF'}`, midX, y + 6);
  doc.text(`CLIENT CONTACT: ${(proposal.clientContact || 'N/A').slice(0, 38)}`, midX, y + 12);
  doc.text(`TEMPLATE CATEGORY: ${proposal.templateType || 'Civil Works'}`, midX, y + 18);
  doc.text(`DATE ISSUED: ${getFormattedDate()}`, midX, y + 23);

  y += 31;

  // Render Sections
  const sections = proposal.sections || [];
  sections.forEach((sec: any) => {
    if (sec.id === 'cover' || sec.id === 'logo') return;

    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(sec.title.toUpperCase(), margin + 3, y + 4.5);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);

    const splitText = doc.splitTextToSize(sec.content || '', contentWidth - 4);
    doc.text(splitText, margin + 2, y);
    y += splitText.length * 4 + 4;
  });

  // BOQ Summary Table
  if (proposal.boq && proposal.boq.length > 0) {
    if (y > pageHeight - 45) {
      doc.addPage();
      y = margin;
    }

    doc.setFillColor(30, 41, 59);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('ESTIMATED BILL OF QUANTITIES SUMMARY', margin + 3, y + 4.5);
    y += 8;

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);

    doc.text('ITEM', margin + 2, y + 4);
    doc.text('DESCRIPTION OF WORKS', margin + 20, y + 4);
    doc.text('UNIT', margin + 105, y + 4);
    doc.text('QTY', margin + 125, y + 4);
    doc.text('RATE', margin + 145, y + 4);
    doc.text('AMOUNT', margin + 170, y + 4);
    y += 7;

    proposal.boq.forEach((item: any, idx: number) => {
      if (y > pageHeight - 20) {
        doc.addPage();
        y = margin;
      }

      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 1, contentWidth, 5.5, 'F');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.text(String(item.item || idx + 1), margin + 2, y + 3.5);

      doc.setFont('helvetica', 'normal');
      doc.text((item.description || '').slice(0, 45), margin + 20, y + 3.5);
      doc.text(String(item.unit || 'm³'), margin + 105, y + 3.5);
      doc.text(String(item.qty || 0), margin + 125, y + 3.5);
      doc.text(Number(item.rate || 0).toLocaleString(), margin + 145, y + 3.5);

      doc.setFont('helvetica', 'bold');
      doc.text(Number(item.total || 0).toLocaleString(), margin + 170, y + 3.5);

      y += 5.5;
    });

    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(`SUM TOTAL ESTIMATE: ${Number(proposal.projectValue || 0).toLocaleString()} ${proposal.currency || 'XAF'}`, pageWidth - margin, y, { align: 'right' });
    y += 8;
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    const footerY = pageHeight - 12;
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('MADECC Group S.A.R.L. — Official Engineering Proposal Document', margin, footerY + 2);
    doc.text(`Page ${p} of ${totalPages} | Generated: ${getFormattedDate()}`, pageWidth - margin, footerY + 2, { align: 'right' });
  }

  return { pdf: doc, filename };
}

/**
 * Generate Word (.docx) for Proposal
 */
export async function generateProposalDocx(proposal: any): Promise<{ blob: Blob; filename: string }> {
  const cleanTitle = sanitizeFilename(proposal.title || 'Proposal');
  const filename = `MADECC_Proposal_${cleanTitle}_${getFormattedDate()}.docx`;

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: 'MADECC GROUP S.A.R.L.', bold: true, size: 32, color: 'D97706' })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: (proposal.title || 'Engineering Proposal').toUpperCase(), bold: true, size: 22, color: '0F172A' })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: `Client: ${proposal.clientName || 'Valued Client'} | Location: ${proposal.location || 'Douala'}`, size: 16, color: '64748B' })
      ]
    }),
    new Paragraph({ text: '', spacing: { after: 200 } })
  ];

  // Add Sections
  (proposal.sections || []).forEach((sec: any) => {
    if (sec.id === 'cover' || sec.id === 'logo') return;
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: sec.title.toUpperCase(), bold: true, size: 20, color: '0F172A' })
        ]
      }),
      new Paragraph({
        children: [
          new TextRun({ text: sec.content || '', size: 16 })
        ],
        spacing: { after: 150 }
      })
    );
  });

  // Add BOQ Table if present
  if (proposal.boq && proposal.boq.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'BILL OF QUANTITIES (BOQ) ESTIMATE', bold: true, size: 20, color: '0F172A' })
        ]
      })
    );

    const headerRow = new TableRow({
      children: [
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true })] })] }),
        new TableCell({ width: { size: 45, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Unit', bold: true })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Qty', bold: true })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Rate', bold: true })] })] }),
        new TableCell({ width: { size: 13, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })] })] })
      ]
    });

    const bodyRows = proposal.boq.map((b: any, idx: number) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun(String(b.item || idx + 1))] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(String(b.description || ''))] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(String(b.unit || 'm³'))] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(String(b.qty || 0))] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(Number(b.rate || 0).toLocaleString())] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun(Number(b.total || 0).toLocaleString())] })] })
        ]
      });
    });

    const boqTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [headerRow, ...bodyRows]
    });

    children.push(boqTable as any);
    children.push(new Paragraph({ text: '', spacing: { after: 200 } }));
  }

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'MADECC GROUP — PROPOSAL TENDER', size: 14, color: '94A3B8' })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Page ', size: 14, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: '94A3B8' }),
                  new TextRun({ text: ' of ', size: 14, color: '94A3B8' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 14, color: '94A3B8' }),
                  new TextRun({ text: ` | Generated on ${getFormattedDate()}`, size: 14, color: '94A3B8' })
                ]
              })
            ]
          })
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  return { blob, filename };
}

/**
 * Generate CSV for Proposal
 */
export function generateProposalCsv(proposal: any): { blob: Blob; filename: string } {
  const cleanTitle = sanitizeFilename(proposal.title || 'Proposal');
  const filename = `MADECC_Proposal_${cleanTitle}_${getFormattedDate()}.csv`;

  const rows: string[][] = [];

  rows.push(['MADECC GROUP S.A.R.L. - TENDER PROPOSAL EXPORT']);
  rows.push(['Douala & Yaounde, Republic of Cameroon | info@madecc-group.cm']);
  rows.push([]);

  rows.push(['PROPOSAL METADATA']);
  rows.push(['Proposal Title', proposal.title || '']);
  rows.push(['Client Name', proposal.clientName || '']);
  rows.push(['Client Contact', proposal.clientContact || '']);
  rows.push(['Location', proposal.location || '']);
  rows.push(['Status', proposal.status || 'Draft']);
  rows.push(['Version', proposal.version || 'v1.0.0']);
  rows.push(['Total Value', String(proposal.projectValue || 0)]);
  rows.push(['Currency', proposal.currency || 'XAF']);
  rows.push(['Export Date', getFormattedDate()]);
  rows.push([]);

  rows.push(['PROPOSAL SECTIONS']);
  (proposal.sections || []).forEach((sec: any) => {
    rows.push([sec.title || '', sec.content || '']);
  });
  rows.push([]);

  if (proposal.boq && proposal.boq.length > 0) {
    rows.push(['BILL OF QUANTITIES']);
    rows.push(['Item', 'Description', 'Unit', 'Qty', 'Unit Rate', 'Total Amount']);
    proposal.boq.forEach((b: any, idx: number) => {
      rows.push([
        String(b.item || idx + 1),
        b.description || '',
        b.unit || '',
        String(b.qty || 0),
        String(b.rate || 0),
        String(b.total || 0)
      ]);
    });
    rows.push(['TOTAL PROPOSAL VALUE', '', '', '', '', String(proposal.projectValue || 0)]);
  }

  const csvContent =
    '\uFEFF' +
    rows
      .map(r =>
        r
          .map(cell => {
            const val = String(cell ?? '').replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return { blob, filename };
}
