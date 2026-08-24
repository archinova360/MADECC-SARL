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
import { SafetyInspectionExportModel } from '../../types/exportTypes.ts';

function sanitizeFilename(str: string): string {
  return (str || 'Inspection').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class SafetyInspectionExporter {
  /**
   * Export Safety Inspection Audit Report to A4 PDF
   */
  public static async exportPDF(model: SafetyInspectionExportModel): Promise<string> {
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

    // 1. HSE Header Banner
    const isPassed = model.status === 'Passed Compliance';
    const isFailed = model.status === 'Failed Audit';

    const bannerColor: [number, number, number] = isFailed
      ? [153, 27, 27] // red-800
      : isPassed
      ? [16, 185, 129] // emerald-500
      : [217, 119, 6]; // amber-600

    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFillColor(...bannerColor);
    doc.rect(0, 32, 210, 2.5, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('MADECC GROUP — SITE SAFETY & HSE AUDIT REPORT', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`HSE Audit Code: ${model.inspectionCode || model.recordId} | Audit Date: ${model.inspectionDate || timestamp}`, 14, 22);
    doc.text(`Inspector: ${model.inspectorName || 'HSE Lead Officer'} | PPE Compliance: ${model.ppeCompliancePercentage || 95}%`, 14, 27);

    let currentY = 40;

    // 2. Inspection Metadata Table
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. Audit Identification & Site Parameters', 14, currentY);
    currentY += 5;

    const metaTable = [
      ['HSE Report Code', model.inspectionCode || model.recordId, 'Audit Status', model.status || 'Passed Compliance'],
      ['Project Name', model.projectName || 'Civil Site', 'Site Location', model.siteLocation || 'Douala Site'],
      ['Lead Inspector', model.inspectorName || 'Alain Tchouta (NEBOSH)', 'Contractor', model.contractorName || 'MADECC Subcontractor'],
      ['PPE Compliance', `${model.ppeCompliancePercentage || 95}% Verified`, 'Inspection Date', model.inspectionDate || timestamp],
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Parameter', 'Detail', 'Parameter', 'Detail']],
      body: metaTable,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 3. Inspection Checklist Findings Table
    const items = model.items && model.items.length > 0
      ? model.items
      : [
          {
            itemNo: 1,
            checkItem: 'Personal Protective Equipment (PPE) Usage',
            category: 'PPE',
            status: 'Pass' as const,
            observation: 'Hard hats, hi-vis vests, and safety boots worn by 100% of workers.',
            correctiveAction: 'Maintain current enforcement.',
          },
          {
            itemNo: 2,
            checkItem: 'Scaffolding & Fall Protection',
            category: 'Working at Height',
            status: 'Requires Attention' as const,
            observation: 'Toe-boards missing on Level 3 exterior scaffold platform.',
            correctiveAction: 'Install toe-boards prior to masonry work continuation.',
          },
          {
            itemNo: 3,
            checkItem: 'Electrical Site Wiring & Panel Earthing',
            category: 'Electrical Safety',
            status: 'Pass' as const,
            observation: 'RCD protection functioning on distribution board.',
            correctiveAction: 'None required.',
          },
          {
            itemNo: 4,
            checkItem: 'Excavation Shoring & Edge Protection',
            category: 'Civil Earthworks',
            status: 'Pass' as const,
            observation: '1.5m deep trenches properly shored and barricaded.',
            correctiveAction: 'Regular inspection after rain events.',
          },
        ];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Site Checklist & Audit Findings', 14, currentY);
    currentY += 4;

    const checklistRows = items.map((i) => [
      i.itemNo,
      i.checkItem,
      i.category,
      i.status,
      i.observation,
      i.correctiveAction,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Inspection Item', 'Category', 'Status', 'Site Observation', 'Corrective Action']],
      body: checklistRows,
      theme: 'striped',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 7.5, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 42 },
        2: { cellWidth: 26 },
        3: { cellWidth: 26 },
        4: { cellWidth: 42 },
        5: { cellWidth: 36 },
      },
      margin: { left: 14, right: 14 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;

    // 4. Hazards & Risk Assessment
    if (model.hazardsIdentified || (model.riskAssessment && model.riskAssessment.length > 0)) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('3. Hazard Analysis & Risk Assessment', 14, currentY);
      currentY += 5;

      if (model.hazardsIdentified) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);

        const splitHaz = doc.splitTextToSize(model.hazardsIdentified, 182);
        doc.text(splitHaz, 14, currentY);
        currentY += splitHaz.length * 4.5 + 6;
      }

      if (model.riskAssessment && model.riskAssessment.length > 0) {
        const riskRows = model.riskAssessment.map((r) => [
          r.hazard,
          r.riskLevel,
          r.likelihood,
          r.severity,
          r.controlMeasure,
        ]);

        autoTable(doc, {
          startY: currentY,
          head: [['Identified Hazard', 'Risk Rating', 'Likelihood', 'Severity', 'Mandated Control Measure']],
          body: riskRows,
          theme: 'grid',
          headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
          styles: { fontSize: 7.5, cellPadding: 3 },
          margin: { left: 14, right: 14 },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }
    }

    // 5. Corrective Actions Plan
    if (model.mandatedActions || (model.correctiveActions && model.correctiveActions.length > 0)) {
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text('4. Mandatory Corrective Action Plan', 14, currentY);
      currentY += 5;

      if (model.mandatedActions) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);

        const splitAct = doc.splitTextToSize(model.mandatedActions, 182);
        doc.text(splitAct, 14, currentY);
        currentY += splitAct.length * 4.5 + 6;
      }
    }

    // 6. Sign-off Block
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('5. HSE Sign-Off & Verification', 14, currentY);
    currentY += 8;

    doc.rect(14, currentY, 55, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('HSE INSPECTOR:', 17, currentY + 5);
    doc.text(model.inspectorName || 'Alain Tchouta (NEBOSH)', 17, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Date', 17, currentY + 18);

    doc.rect(77, currentY, 55, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SITE REPRESENTATIVE:', 80, currentY + 5);
    doc.text('Site Engineer / Supervisor', 80, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Date', 80, currentY + 18);

    doc.rect(140, currentY, 56, 22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PROJECT MANAGER:', 143, currentY + 5);
    doc.text('Dr. Amélie Fotso (PMP)', 143, currentY + 11);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('Signature & Date', 143, currentY + 18);

    // Page Numbering
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`MADECC GROUP HSE Division | Audit Ref: ${model.inspectionCode || model.recordId} | Page ${i} of ${pageCount}`, 14, 287);
    }

    const filename = `MADECC_Safety_Inspection_${sanitizeFilename(model.inspectionCode || String(model.recordId))}.pdf`;
    doc.save(filename);
    return filename;
  }

  /**
   * Export Safety Inspection Report to Editable Word (.DOCX)
   */
  public static async exportDOCX(model: SafetyInspectionExportModel): Promise<string> {
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
              text: `SITE SAFETY & HSE AUDIT REPORT — ${model.inspectionCode || model.recordId}`,
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Status: ${model.status} | PPE Compliance: ${model.ppeCompliancePercentage || 95}% | Date: ${model.inspectionDate || new Date().toLocaleDateString()}`,
                  italics: true,
                  size: 18,
                }),
              ],
            }),
            new Paragraph({ text: '' }),

            new Paragraph({ text: '1. Audit Metadata', heading: HeadingLevel.HEADING_2 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Audit Reference:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(String(model.inspectionCode || model.recordId))] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.status)] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Site Location:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.siteLocation)] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Inspector:', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph(model.inspectorName)] }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '2. Inspection Findings', heading: HeadingLevel.HEADING_2 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '#', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Check Item', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true })] })] }),
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Observation', bold: true })] })] }),
                  ],
                }),
                ...(model.items || []).map(
                  (i) =>
                    new TableRow({
                      children: [
                        new TableCell({ children: [new Paragraph(String(i.itemNo))] }),
                        new TableCell({ children: [new Paragraph(i.checkItem)] }),
                        new TableCell({ children: [new Paragraph(i.status)] }),
                        new TableCell({ children: [new Paragraph(i.observation)] }),
                      ],
                    })
                ),
              ],
            }),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '3. Mandatory Corrective Actions', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: model.mandatedActions || 'Maintain standard HSE safety protocols on site.' }),

            new Paragraph({ text: '' }),
            new Paragraph({ text: '4. Sign-Off & Approvals', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              children: [
                new TextRun({ text: `Inspector: ${model.inspectorName}      |      `, bold: true }),
                new TextRun({ text: 'Site Representative      |      ', bold: true }),
                new TextRun({ text: 'Project Manager', bold: true }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `MADECC_Safety_Inspection_${sanitizeFilename(model.inspectionCode || String(model.recordId))}.docx`;
    saveAs(blob, filename);
    return filename;
  }
}
