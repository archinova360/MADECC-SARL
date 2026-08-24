import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import { ArticlesOfAssociationExportModel } from '../../types/exportTypes.ts';

function sanitizeFilename(str: string): string {
  return (str || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class ArticlesOfAssociationExporter {
  /**
   * Export Articles of Association to A4 PDF Legal Statute
   */
  public static async exportPDF(model: ArticlesOfAssociationExportModel): Promise<string> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // 1. Legal Document Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFillColor(217, 119, 6); // amber accent bar
    doc.rect(0, 32, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('ARTICLES OF ASSOCIATION — STATUTS CONSTITUTIFS', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`OHADA AUDSCGIE Compliant Corporate Instrument | Version: ${model.version || '1.0'}`, 14, 22);
    doc.text(`Adoption Date: ${model.adoptionDate || timestamp} | Reg No: ${model.registrationNumber || 'Pending'}`, 14, 27);

    let currentY = 40;

    // 2. Company Identity Summary Table
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Corporate Identity & Capital Structure', 14, currentY);
    currentY += 5;

    const companyData = [
      ['Company Name', model.companyName || 'MADECC Group SARL', 'Reg. Number', model.registrationNumber || 'N/A'],
      ['Registered Office', model.registeredOffice || 'Douala, Cameroon', 'Share Capital', model.shareCapital || '10,000,000 FCFA'],
      ['Statute Version', `Version ${model.version || '1.0'}`, 'Adoption Date', model.adoptionDate || timestamp],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Field', 'Value', 'Field', 'Value']],
      body: companyData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 3. Shareholders Table
    if (model.shareholders && model.shareholders.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('2. Share Capital Distribution & Ownership', 14, currentY);
      currentY += 4;

      const shRows = model.shareholders.map((sh) => [
        sh.name,
        sh.shares.toLocaleString(),
        `${sh.percentage}%`,
        'Registered Ordinary Shares',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Shareholder Name', 'Shares Held', 'Capital %', 'Share Class']],
        body: shRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }

    // 4. Articles & Clauses
    if (model.articles && model.articles.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Governing Articles & Corporate Provisions', 14, currentY);
      currentY += 6;

      model.articles.forEach((art) => {
        if (currentY > 245) {
          doc.addPage();
          currentY = 20;
        }

        // Article Title Banner
        doc.setFillColor(241, 245, 249);
        doc.rect(14, currentY, 182, 7, 'F');
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`ARTICLE ${art.articleNumber}: ${art.title.toUpperCase()}`, 16, currentY + 5);
        currentY += 10;

        // Clauses
        art.clauses.forEach((cls) => {
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(217, 119, 6);
          doc.text(`Clause ${cls.clauseNumber}:`, 16, currentY);
          currentY += 4;

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);

          const splitContent = doc.splitTextToSize(cls.content, 178);
          doc.text(splitContent, 18, currentY);
          currentY += splitContent.length * 3.8 + 4;
        });

        currentY += 3;
      });
    }

    // 5. Legal Signatories Block
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Official Signatures & Execution Block', 14, currentY);
    currentY += 8;

    const sigs = model.signatories && model.signatories.length > 0
      ? model.signatories
      : [
          { name: 'Eng. Dieudonné Kemgne', title: 'Managing Director / Gérant' },
          { name: 'Dr. Marcel Mbida', title: 'Corporate Secretary & Counsel' },
        ];

    sigs.forEach((sig, idx) => {
      const xPos = 14 + (idx % 2) * 95;
      if (idx > 0 && idx % 2 === 0) {
        currentY += 28;
      }
      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.rect(xPos, currentY, 85, 22);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(sig.name, xPos + 4, currentY + 6);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(sig.title, xPos + 4, currentY + 11);
      doc.setFont('helvetica', 'italic');
      doc.text('Signature & Legal Seal', xPos + 4, currentY + 18);
    });

    // Page Numbering
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`ARTICLES OF ASSOCIATION — ${model.companyName} | Page ${i} of ${pageCount}`, 14, 287);
      doc.text('OHADA Certified Statute', 160, 287);
    }

    const filename = `MADECC_Articles_of_Association_${sanitizeFilename(model.companyName)}_${model.version || 'V1'}.pdf`;
    doc.save(filename);
    return filename;
  }

  /**
   * Export Articles of Association to Editable Word (.DOCX)
   */
  public static async exportDOCX(model: ArticlesOfAssociationExportModel): Promise<string> {
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000,
                bottom: 1000,
                left: 1000,
                right: 1000,
              },
            },
          },
          children: [
            new Paragraph({
              text: `ARTICLES OF ASSOCIATION — ${model.companyName.toUpperCase()}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `OHADA AUDSCGIE Compliant Statute | Version: ${model.version || '1.0'} | Adoption Date: ${model.adoptionDate || new Date().toLocaleDateString()}`,
                  italics: true,
                  size: 18,
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            new Paragraph({
              text: '1. Corporate Identification',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Company Name:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.companyName)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Registration #:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.registrationNumber || 'Pending')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Registered Office:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.registeredOffice)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Share Capital:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.shareCapital)] }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({
              text: '2. Shareholder Capital Distribution',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Shareholder', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Shares', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Ownership %', bold: true })] })] }),
                  ],
                }),
                ...(model.shareholders || []).map(
                  (sh) =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph(sh.name)] }),
                        new TableCell({ children: [new Paragraph(sh.shares.toLocaleString())] }),
                        new TableCell({ children: [new Paragraph(`${sh.percentage}%`)] }),
                      ],
                    })
                ),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({
              text: '3. Legal Articles & Articles Provisions',
              heading: HeadingLevel.HEADING_2,
            }),

            ...(model.articles || []).flatMap((art) => [
              new Paragraph({
                text: `ARTICLE ${art.articleNumber}: ${art.title}`,
                heading: HeadingLevel.HEADING_3,
              }),
              ...art.clauses.flatMap((cls) => [
                new Paragraph({
                  children: [
                    new TextRun({ text: `Clause ${cls.clauseNumber}: `, bold: true }),
                    new TextRun({ text: cls.content }),
                  ],
                }),
                new Paragraph({ text: '' }),
              ]),
            ]),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '4. Signatories & Execution', heading: HeadingLevel.HEADING_2 }),
            ...(model.signatories || [
              { name: 'Eng. Dieudonné Kemgne', title: 'Managing Director' },
              { name: 'Dr. Marcel Mbida', title: 'Legal Counsel' },
            ]).map(
              (sig) =>
                new Paragraph({
                  children: [
                    new TextRun({ text: `${sig.name} `, bold: true }),
                    new TextRun({ text: `(${sig.title}) — Signature & Seal`, italics: true }),
                  ],
                })
            ),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `MADECC_Articles_of_Association_${sanitizeFilename(model.companyName)}_${model.version || 'V1'}.docx`;
    saveAs(blob, filename);
    return filename;
  }
}
