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
import { BlueprintExportModel } from '../../types/exportTypes.ts';

function sanitizeFilename(str: string): string {
  return (str || 'Drawing').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class BlueprintExporter {
  /**
   * Export Blueprint Drawing Sheet to A4 PDF (Landscape default for engineering drawings)
   */
  public static async exportPDF(model: BlueprintExportModel): Promise<string> {
    // Default to landscape orientation for blueprints to preserve aspect ratio
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const timestamp = new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // Page dimensions for A4 Landscape: 297mm x 210mm
    const pageWidth = 297;
    const pageHeight = 210;

    // Outer Drawing Border Box (Engineering Sheet Border)
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

    // Inner Border
    doc.setLineWidth(0.3);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Header Title
    doc.setFillColor(15, 23, 42);
    doc.rect(10, 10, pageWidth - 20, 16, 'F');

    doc.setFillColor(217, 119, 6);
    doc.rect(10, 26, pageWidth - 20, 1.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('MADECC GROUP — TECHNICAL DRAWING & BLUEPRINT SHEET', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(
      `Project: ${model.projectName || 'Civil Project'} | Code: ${model.drawingCode || 'DWG-001'} | Rev: ${model.revision || 'v1.0'} | Discipline: ${model.discipline || 'Architectural'}`,
      14,
      23
    );

    // Main Drawing Canvas Area
    const drawingX = 14;
    const drawingY = 32;
    const drawingWidth = 190;
    const drawingHeight = 120;

    // Draw Drawing Viewport Box
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.setFillColor(248, 250, 252);
    doc.rect(drawingX, drawingY, drawingWidth, drawingHeight, 'FD');

    let imageRendered = false;

    if (model.previewBase64 || model.previewImageUrl) {
      try {
        const imgData = model.previewBase64 || model.previewImageUrl;
        if (imgData && imgData.startsWith('data:image')) {
          doc.addImage(imgData, 'JPEG', drawingX + 2, drawingY + 2, drawingWidth - 4, drawingHeight - 4, undefined, 'FAST');
          imageRendered = true;
        }
      } catch (err) {
        console.warn('Failed to embed blueprint image in PDF:', err);
      }
    }

    if (!imageRendered) {
      // Render CAD CAD Grid Vector Representation
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      for (let x = drawingX + 10; x < drawingX + drawingWidth; x += 10) {
        doc.line(x, drawingY, x, drawingY + drawingHeight);
      }
      for (let y = drawingY + 10; y < drawingY + drawingHeight; y += 10) {
        doc.line(drawingX, y, drawingX + drawingWidth, y);
      }

      // Drawing Axis & Center Text
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`DRAWING BLUEPRINT CANVA: ${model.title || 'Technical Plan'}`, drawingX + 20, drawingY + drawingHeight / 2 - 4);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Drawing Ref: ${model.recordId} | Scale: ${model.scale || '1:100'} | File Format: CAD / PDF / PNG`, drawingX + 20, drawingY + drawingHeight / 2 + 4);
    }

    // Structural Notes & Material Specs Panel (Right Panel)
    const notesX = 208;
    const notesY = 32;
    const notesWidth = 75;
    const notesHeight = 120;

    doc.setFillColor(241, 245, 249);
    doc.rect(notesX, notesY, notesWidth, notesHeight, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(notesX, notesY, notesWidth, notesHeight, 'S');

    doc.setFillColor(15, 23, 42);
    doc.rect(notesX, notesY, notesWidth, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('MATERIALS & STRUCTURAL NOTES', notesX + 3, notesY + 5);

    let curY = notesY + 11;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Materials Specification:', notesX + 3, curY);
    curY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const splitMat = doc.splitTextToSize(model.materialsSpecs || 'Concrete C30/37, High-Yield Steel FeE500, Soil Bearing Capacity 0.25 MPa', notesWidth - 6);
    doc.text(splitMat, notesX + 3, curY);
    curY += splitMat.length * 3.5 + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Structural Directives & Notes:', notesX + 3, curY);
    curY += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(model.structuralNotes || 'All dimensions in mm unless noted. Verify dimensions on site before fabrication.', notesWidth - 6);
    doc.text(splitNotes, notesX + 3, curY);

    // Title Block Table (Engineering Title Block at Bottom Right)
    const tbY = 155;
    const tbData = [
      ['Drawing Title', model.title || 'Architectural Floor Plan', 'Drawing No', model.drawingCode || 'DWG-001'],
      ['Project Name', model.projectName || 'MADECC Project', 'Revision', model.revision || 'v1.0'],
      ['Scale Factor', model.scale || '1:100 @ A4', 'Discipline', model.discipline || 'Architectural'],
      ['Designed By', model.leadEngineer || 'Ing. Kemgne', 'Checked By', model.checkedBy || 'Marcus Ndip'],
      ['Approved By', model.approvedBy || 'Managing Director', 'Date', model.date || timestamp],
    ];

    autoTable(doc, {
      startY: tbY,
      body: tbData,
      theme: 'grid',
      styles: { fontSize: 7.5, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 32, fontStyle: 'bold', fillColor: [241, 245, 249] },
        1: { cellWidth: 105 },
        2: { cellWidth: 28, fontStyle: 'bold', fillColor: [241, 245, 249] },
        3: { cellWidth: 104 },
      },
      margin: { left: 14, right: 14 },
    });

    // Sheet Page Footers
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`MADECC GROUP Engineering Division | Drawing Code: ${model.drawingCode} | Revision ${model.revision}`, 14, pageHeight - 11);

    const filename = `MADECC_Blueprint_${sanitizeFilename(model.drawingCode)}_${model.revision || 'v1'}.pdf`;
    doc.save(filename);
    return filename;
  }

  /**
   * Export Blueprint Technical Report to Editable Word (.DOCX)
   */
  public static async exportDOCX(model: BlueprintExportModel): Promise<string> {
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
              text: `TECHNICAL DRAWING REPORT — ${model.title.toUpperCase()}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Drawing Code: ${model.drawingCode} | Revision: ${model.revision} | Discipline: ${model.discipline}`,
                  italics: true,
                  size: 18,
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            new Paragraph({
              text: '1. Engineering Title Block & Metadata',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Drawing Title:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.title)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Drawing Code:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.drawingCode)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Project Name:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.projectName)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Revision:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.revision)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Scale:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.scale)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Discipline:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.discipline)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Lead Designer:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.leadEngineer || 'Ing. Kemgne')] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Approved By:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.approvedBy || 'Managing Director')] }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({
              text: '2. Material Specifications & Concrete Directives',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: model.materialsSpecs || 'Concrete C30/37, Steel FeE500' }),

            new Paragraph({ text: '' }),
            new Paragraph({
              text: '3. Structural & Execution Notes',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({ text: model.structuralNotes || 'Verify dimensions on site before fabrication.' }),

            new Paragraph({ text: '' }),
            new Paragraph({
              text: '4. Drawing Preview & File Reference',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Original CAD/PDF Reference: ${model.recordId}. High-resolution vector drawing attached to official project CAD vault.`,
                  italics: true,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `MADECC_Blueprint_${sanitizeFilename(model.drawingCode)}_${model.revision || 'v1'}.docx`;
    saveAs(blob, filename);
    return filename;
  }
}
