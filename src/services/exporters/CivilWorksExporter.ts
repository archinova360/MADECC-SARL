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
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import { CivilWorksExportModel } from '../../types/exportTypes.ts';

function sanitizeFilename(str: string): string {
  return (str || 'Record').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class CivilWorksExporter {
  /**
   * Export Civil Works Record to A4 PDF
   */
  public static async exportPDF(model: CivilWorksExportModel): Promise<string> {
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

    // 1. Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFillColor(217, 119, 6); // amber-600
    doc.rect(0, 32, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('MADECC GROUP — CIVIL WORKS OFFICIAL REPORT', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`Project Ref: ${model.recordId} | Category: ${model.workCategory} | Export Date: ${timestamp}`, 14, 22);
    doc.text(`Client: ${model.clientName || 'N/A'} | Status: ${model.status || 'Active'}`, 14, 27);

    let currentY = 40;

    // 2. Executive Overview Table
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Project Overview & Site Identification', 14, currentY);
    currentY += 5;

    const summaryData = [
      ['Project Name', model.projectName || 'Civil Works Project', 'Record ID', model.recordId],
      ['Client Name', model.clientName || 'N/A', 'Contractor', model.contractorName || 'MADECC Group'],
      ['Site Location', model.siteLocation || 'Cameroon', 'Work Category', model.workCategory || 'Civil Infrastructure'],
      ['Start Date', model.startDate || 'N/A', 'Completion Target', model.completionDate || 'N/A'],
      ['Current Progress', `${model.progressPercentage || 0}% Completed`, 'Status', model.status || 'IN_PROGRESS'],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Field', 'Value', 'Field', 'Value']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 3. Civil Works Technical Description
    if (model.description) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('2. Technical Scope & Site Description', 14, currentY);
      currentY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      const splitDesc = doc.splitTextToSize(model.description, 182);
      doc.text(splitDesc, 14, currentY);
      currentY += splitDesc.length * 4.5 + 6;
    }

    // 4. Civil Works Specific Details (Foundations, Concrete, Earthworks, etc.)
    const specificSections = [
      { label: 'Site Preparation & Earthworks', text: model.sitePreparation || model.earthworks },
      { label: 'Foundation & Concrete Works', text: model.foundationWorks || model.concreteWorks },
      { label: 'Structural & Drainage Infrastructure', text: model.structuralWorks || model.drainageAndRoads },
    ].filter((s) => Boolean(s.text));

    if (specificSections.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Engineering & Works Specifications', 14, currentY);
      currentY += 5;

      specificSections.forEach((sec) => {
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(217, 119, 6);
        doc.text(`• ${sec.label}`, 16, currentY);
        currentY += 4.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);

        const splitText = doc.splitTextToSize(sec.text!, 178);
        doc.text(splitText, 18, currentY);
        currentY += splitText.length * 4 + 4;
      });
    }

    // 5. Bill of Quantities / Items Table
    if (model.items && model.items.length > 0) {
      if (currentY > 210) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Bill of Quantities & Valuation Schedule', 14, currentY);
      currentY += 4;

      const itemRows = model.items.map((item) => [
        item.itemNumber,
        item.description,
        item.unit,
        item.quantity.toLocaleString(),
        item.rate.toLocaleString('fr-FR') + ' FCFA',
        item.amount.toLocaleString('fr-FR') + ' FCFA',
      ]);

      autoTable(doc, {
        startY: currentY,
        head: [['Item #', 'Description of Work', 'Unit', 'Qty', 'Unit Rate', 'Total Amount']],
        body: itemRows,
        theme: 'striped',
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 70 },
          2: { cellWidth: 16 },
          3: { cellWidth: 18 },
          4: { cellWidth: 30 },
          5: { cellWidth: 32 },
        },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 6;

      // Total Valuation Box
      doc.setFillColor(241, 245, 249);
      doc.rect(114, currentY, 82, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL CONTRACT VALUE:', 118, currentY + 6.5);
      doc.setTextColor(217, 119, 6);
      doc.text(`${(model.totalAmount || 0).toLocaleString('fr-FR')} FCFA`, 165, currentY + 6.5);

      currentY += 16;
    }

    // 6. Approval & Signatures Block
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Authorization & Formal Sign-Off', 14, currentY);
    currentY += 8;

    const sigX1 = 14;
    const sigX2 = 80;
    const sigX3 = 146;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    // Box 1
    doc.rect(sigX1, currentY, 52, 22);
    doc.text('PREPARED BY:', sigX1 + 3, currentY + 5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(model.preparedBy || 'Site Engineer', sigX1 + 3, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Stamp', sigX1 + 3, currentY + 18);

    // Box 2
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.rect(sigX2, currentY, 52, 22);
    doc.text('CHECKED BY:', sigX2 + 3, currentY + 5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(model.checkedBy || 'Lead Structural Engineer', sigX2 + 3, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Stamp', sigX2 + 3, currentY + 18);

    // Box 3
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.rect(sigX3, currentY, 50, 22);
    doc.text('APPROVED BY:', sigX3 + 3, currentY + 5);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text(model.approvedBy || 'Managing Director', sigX3 + 3, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Stamp', sigX3 + 3, currentY + 18);

    // Page Numbering Footers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`MADECC GROUP — Civil Engineering Division | Record: ${model.recordId} | Page ${i} of ${pageCount}`, 14, 287);
      doc.text('Official Certified Document', 160, 287);
    }

    const filename = `MADECC_Civil_Works_${sanitizeFilename(model.projectName)}_${model.recordId}.pdf`;
    doc.save(filename);
    return filename;
  }

  /**
   * Export Civil Works Record to Editable Word (.DOCX)
   */
  public static async exportDOCX(model: CivilWorksExportModel): Promise<string> {
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
              text: 'MADECC GROUP — CIVIL WORKS OFFICIAL REPORT',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Ref No: ${model.recordId} | Category: ${model.workCategory} | Date: ${new Date().toLocaleDateString()}`,
                  italics: true,
                  size: 18,
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            new Paragraph({
              text: '1. Project Overview & Metadata',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Project Name:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.projectName || 'N/A')] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Record ID:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(String(model.recordId))] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Client Name:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.clientName || 'N/A')] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Contractor:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.contractorName || 'MADECC Group')] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Site Location:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.siteLocation || 'Cameroon')] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Progress:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(`${model.progressPercentage || 0}% Completed`)] }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({
              text: '2. Project Description & Technical Scope',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: model.description || 'N/A' }),

            ...(model.earthworks || model.sitePreparation
              ? [
                  new Paragraph({ text: '' }),
                  new Paragraph({ text: 'Site Preparation & Earthworks:', heading: HeadingLevel.HEADING_3 }),
                  new Paragraph({ text: model.sitePreparation || model.earthworks || '' }),
                ]
              : []),

            ...(model.concreteWorks || model.foundationWorks
              ? [
                  new Paragraph({ text: '' }),
                  new Paragraph({ text: 'Foundation & Concrete Engineering:', heading: HeadingLevel.HEADING_3 }),
                  new Paragraph({ text: model.foundationWorks || model.concreteWorks || '' }),
                ]
              : []),

            ...(model.items && model.items.length > 0
              ? [
                  new Paragraph({ text: '' }),
                  new Paragraph({ text: '3. Bill of Quantities & Valuation', heading: HeadingLevel.HEADING_2 }),
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Item #', bold: true })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Unit', bold: true })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Qty', bold: true })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Rate (FCFA)', bold: true })] })] }),
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount (FCFA)', bold: true })] })] }),
                        ],
                      }),
                      ...model.items.map(
                        (i) =>
                          new TableRow({
                            children: [
                              new TableCell({ children: [new Paragraph(i.itemNumber)] }),
                              new TableCell({ children: [new Paragraph(i.description)] }),
                              new TableCell({ children: [new Paragraph(i.unit)] }),
                              new TableCell({ children: [new Paragraph(String(i.quantity))] }),
                              new TableCell({ children: [new Paragraph(i.rate.toLocaleString('fr-FR'))] }),
                              new TableCell({ children: [new Paragraph(i.amount.toLocaleString('fr-FR'))] }),
                            ],
                          })
                      ),
                    ],
                  }),
                  new Paragraph({ text: '' }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `TOTAL CONTRACT VALUATION: ${(model.totalAmount || 0).toLocaleString('fr-FR')} FCFA`,
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                ]
              : []),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '4. Authorization & Sign-Off', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              children: [
                new TextRun({ text: `Prepared By: ${model.preparedBy || 'Site Engineer'}      |      `, bold: true }),
                new TextRun({ text: `Checked By: ${model.checkedBy || 'Lead Engineer'}      |      `, bold: true }),
                new TextRun({ text: `Approved By: ${model.approvedBy || 'Managing Director'}`, bold: true }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `MADECC_Civil_Works_${sanitizeFilename(model.projectName)}_${model.recordId}.docx`;
    saveAs(blob, filename);
    return filename;
  }
}
