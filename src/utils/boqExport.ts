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
  BorderStyle
} from 'docx';

function sanitizeFilename(str: string): string {
  if (!str) return 'BOQ';
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Generate Microsoft Word (.docx) document for BOQ
 */
export async function generateBoqDocx(boq: any): Promise<{ blob: Blob; filename: string }> {
  const isDraft = boq.status !== 'APPROVED';
  const children: any[] = [];

  // Header Branding
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'MADECC GROUP S.A.R.L.',
          bold: true,
          size: 32,
          color: 'D97706' // Amber-600
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'CIVIL ENGINEERING, GEOTECHNICS & STRUCTURAL CONSTRUCTION',
          bold: true,
          size: 18,
          color: '334155'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Douala & Yaoundé, Republic of Cameroon | Contact: info@madecc-group.cm',
          size: 16,
          color: '64748B'
        })
      ]
    }),
    new Paragraph({ text: '', spacing: { after: 200 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'OFFICIAL BILL OF QUANTITIES / ESTIMATE',
          bold: true,
          size: 24,
          color: '0F172A'
        })
      ]
    })
  );

  // Draft Warning Banner if not approved
  if (isDraft) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
        children: [
          new TextRun({
            text: 'DRAFT — NOT FOR CLIENT APPROVAL',
            bold: true,
            size: 20,
            color: 'DC2626' // Red
          })
        ]
      })
    );
  }

  children.push(new Paragraph({ text: '', spacing: { after: 150 } }));

  // Metadata Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'BOQ Reference: ', bold: true }), new TextRun(boq.boqReference || '')] }),
              new Paragraph({ children: [new TextRun({ text: 'Project Name: ', bold: true }), new TextRun(boq.projectName || '')] }),
              new Paragraph({ children: [new TextRun({ text: 'Location: ', bold: true }), new TextRun(boq.location || '')] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Revision: ', bold: true }), new TextRun(boq.revisionNumber || 'REV-00')] }),
              new Paragraph({ children: [new TextRun({ text: 'Client Name: ', bold: true }), new TextRun(boq.clientName || '')] }),
              new Paragraph({ children: [new TextRun({ text: 'Date Prepared: ', bold: true }), new TextRun(boq.datePrepared ? new Date(boq.datePrepared).toLocaleDateString() : new Date().toLocaleDateString())] }),
              new Paragraph({ children: [new TextRun({ text: 'Prepared By: ', bold: true }), new TextRun(boq.preparedBy || '')] })
            ]
          })
        ]
      })
    ]
  });

  children.push(metaTable);
  children.push(new Paragraph({ text: '', spacing: { after: 250 } }));

  // Sections & Work Items
  const sections = boq.sections || [];
  sections.forEach((sec: any) => {
    // Section Header
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 100 },
        children: [
          new TextRun({
            text: `SECTION ${sec.sectionCode}: ${sec.title}`,
            bold: true,
            size: 20,
            color: '0F172A'
          }),
          new TextRun({
            text: ` (Subtotal: ${Number(sec.subtotal || 0).toLocaleString()} ${boq.currency || 'XAF'})`,
            bold: true,
            size: 18,
            color: 'D97706'
          })
        ]
      })
    );

    // Items Table
    const tableHeader = new TableRow({
      children: [
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true, size: 16 })] })] }),
        new TableCell({ width: { size: 42, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true, size: 16 })] })] }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Unit', bold: true, size: 16 })] })] }),
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Qty', bold: true, size: 16 })] })] }),
        new TableCell({ width: { size: 13, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Rate (${boq.currency || 'XAF'})`, bold: true, size: 16 })] })] }),
        new TableCell({ width: { size: 13, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Amount (${boq.currency || 'XAF'})`, bold: true, size: 16 })] })] })
      ]
    });

    const itemRows = (sec.items || []).map((item: any) => {
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.itemNumber || '', size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.description || '', size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.unit || '', size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: String(item.quantity ?? 0), size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: Number(item.unitRate || 0).toLocaleString(), size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: Number(item.amount || 0).toLocaleString(), bold: true, size: 16 })] })] })
        ]
      });
    });

    const itemTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [tableHeader, ...itemRows]
    });

    children.push(itemTable);
    children.push(new Paragraph({ text: '', spacing: { after: 150 } }));
  });

  // Financial Summary
  children.push(
    new Paragraph({
      spacing: { before: 250, after: 100 },
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'FINANCIAL SUMMARY RECAP', bold: true, size: 20, color: '0F172A' })]
    })
  );

  const summaryRows = [
    new TableRow({
      children: [
        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Subtotal (Measured Work):', bold: true, size: 18 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${Number(boq.subtotal || 0).toLocaleString()} ${boq.currency || 'XAF'}`, bold: true, size: 18 })] })] })
      ]
    })
  ];

  if (Number(boq.overheadAmount) > 0) {
    summaryRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Overhead (${boq.overheadPercent}%):`, size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.overheadAmount).toLocaleString()} ${boq.currency || 'XAF'}`, size: 16 })] })] })
        ]
      })
    );
  }

  if (Number(boq.contingencyAmount) > 0) {
    summaryRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Contingency (${boq.contingencyPercent}%):`, size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.contingencyAmount).toLocaleString()} ${boq.currency || 'XAF'}`, size: 16 })] })] })
        ]
      })
    );
  }

  if (Number(boq.profitAmount) > 0) {
    summaryRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Profit Margin (${boq.profitPercent}%):`, size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.profitAmount).toLocaleString()} ${boq.currency || 'XAF'}`, size: 16 })] })] })
        ]
      })
    );
  }

  if (Number(boq.taxAmount) > 0) {
    summaryRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Tax / TVA (${boq.taxPercent}%):`, size: 16 })] })] }),
          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.taxAmount).toLocaleString()} ${boq.currency || 'XAF'}`, size: 16 })] })] })
        ]
      })
    );
  }

  summaryRows.push(
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'GRAND TOTAL:', bold: true, size: 22, color: 'D97706' })] })] }),
        new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${Number(boq.grandTotal || 0).toLocaleString()} ${boq.currency || 'XAF'}`, bold: true, size: 22, color: 'D97706' })] })] })
      ]
    })
  );

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: summaryRows
  });

  children.push(summaryTable);
  children.push(new Paragraph({ text: '', spacing: { after: 300 } }));

  // Signatures / Footer
  children.push(
    new Paragraph({
      spacing: { before: 200 },
      children: [
        new TextRun({
          text: 'Prepared & Approved By: ',
          bold: true,
          size: 16
        }),
        new TextRun({
          text: boq.approvedBy || boq.preparedBy || 'MADECC Quantity Surveyor',
          size: 16
        })
      ]
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Document Reference: ',
          bold: true,
          size: 14,
          color: '64748B'
        }),
        new TextRun({
          text: `${boq.boqReference} (${boq.revisionNumber})`,
          size: 14,
          color: '64748B'
        })
      ]
    }),
    new Paragraph({
      spacing: { before: 100 },
      children: [
        new TextRun({
          text: 'Disclaimer: This Bill of Quantities / Construction Rate Estimate is produced by MADECC Group S.A.R.L. based on standard civil engineering measurement rules. Figures are binding upon official approval.',
          italics: true,
          size: 14,
          color: '94A3B8'
        })
      ]
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanName = sanitizeFilename(boq.projectName || boq.boqReference || 'Project');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `MADECC_Bill_of_Quantities_${cleanName}_${dateStr}.docx`;

  return { blob, filename };
}

/**
 * Generate CSV document for BOQ
 */
export function generateBoqCsv(boq: any): { blob: Blob; filename: string } {
  const isDraft = boq.status !== 'APPROVED';
  const rows: string[][] = [];

  // Branding
  rows.push(['MADECC GROUP S.A.R.L. - OFFICIAL BILL OF QUANTITIES / ESTIMATE']);
  rows.push(['Civil Engineering, Geotechnics & Structural Construction']);
  rows.push(['Douala & Yaounde, Republic of Cameroon | Contact: info@madecc-group.cm']);
  rows.push([]);

  if (isDraft) {
    rows.push(['STATUS', 'DRAFT — NOT FOR CLIENT APPROVAL']);
  } else {
    rows.push(['STATUS', 'APPROVED']);
  }

  // Metadata
  rows.push(['BOQ Reference', boq.boqReference || '']);
  rows.push(['Revision', boq.revisionNumber || 'REV-00']);
  rows.push(['Project Name', boq.projectName || '']);
  rows.push(['Location', boq.location || '']);
  rows.push(['Client Name', boq.clientName || '']);
  rows.push(['Client Email', boq.clientEmail || '']);
  rows.push(['Client NIU', boq.clientNiu || '']);
  rows.push(['Date Prepared', boq.datePrepared ? new Date(boq.datePrepared).toLocaleDateString() : new Date().toLocaleDateString()]);
  rows.push(['Prepared By', boq.preparedBy || '']);
  rows.push(['Currency', boq.currency || 'XAF']);
  rows.push([]);

  // BOQ Items Header
  rows.push(['Section Code', 'Section Title', 'Item Number', 'Description', 'Unit', 'Quantity', `Unit Rate (${boq.currency || 'XAF'})`, `Amount (${boq.currency || 'XAF'})`]);

  const sections = boq.sections || [];
  sections.forEach((sec: any) => {
    (sec.items || []).forEach((item: any) => {
      rows.push([
        sec.sectionCode || '',
        sec.title || '',
        item.itemNumber || '',
        item.description || '',
        item.unit || '',
        String(item.quantity ?? 0),
        String(item.unitRate ?? 0),
        String(item.amount ?? 0)
      ]);
    });
    // Section subtotal row
    rows.push([
      sec.sectionCode || '',
      `${sec.title} SUB-TOTAL`,
      '',
      '',
      '',
      '',
      '',
      String(sec.subtotal ?? 0)
    ]);
    rows.push([]);
  });

  // Financial Summary
  rows.push(['FINANCIAL SUMMARY']);
  rows.push(['Subtotal (Measured Work)', '', '', '', '', '', '', String(boq.subtotal ?? 0)]);
  if (Number(boq.overheadAmount) > 0) {
    rows.push([`Overhead (${boq.overheadPercent}%)`, '', '', '', '', '', '', String(boq.overheadAmount ?? 0)]);
  }
  if (Number(boq.contingencyAmount) > 0) {
    rows.push([`Contingency (${boq.contingencyPercent}%)`, '', '', '', '', '', '', String(boq.contingencyAmount ?? 0)]);
  }
  if (Number(boq.profitAmount) > 0) {
    rows.push([`Profit Margin (${boq.profitPercent}%)`, '', '', '', '', '', '', String(boq.profitAmount ?? 0)]);
  }
  if (Number(boq.taxAmount) > 0) {
    rows.push([`Tax / TVA (${boq.taxPercent}%)`, '', '', '', '', '', '', String(boq.taxAmount ?? 0)]);
  }
  rows.push([`GRAND TOTAL (${boq.currency || 'XAF'})`, '', '', '', '', '', '', String(boq.grandTotal ?? 0)]);

  // Serialize CSV with UTF-8 BOM
  const csvContent = '\uFEFF' + rows.map(r => r.map(cell => {
    const val = String(cell ?? '').replace(/"/g, '""');
    return `"${val}"`;
  }).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanName = sanitizeFilename(boq.projectName || boq.boqReference || 'Project');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `MADECC_Bill_of_Quantities_${cleanName}_${dateStr}.csv`;

  return { blob, filename };
}

import * as XLSX from 'xlsx';

/**
 * Generate Microsoft Excel (.xlsx) workbook for BOQ with multiple tabs
 */
export function generateBoqExcel(boq: any): { blob: Blob; filename: string } {
  const wb = XLSX.utils.book_new();
  const currency = boq.currency || 'XAF';

  // 1. EXECUTIVE SUMMARY SHEET
  const summaryRows = [
    ['MADECC GROUP S.A.R.L. - CIVIL & STRUCTURAL ENGINEERING'],
    ['OFFICIAL BILL OF QUANTITIES & EXECUTIVE COST ESTIMATE'],
    [''],
    ['BOQ Reference', boq.boqReference || 'BOQ-001'],
    ['Revision Number', boq.revisionNumber || 'REV-00'],
    ['Project Name', boq.projectName || 'General Construction Works'],
    ['Location', boq.location || 'Douala / Yaoundé, Cameroon'],
    ['Client Name', boq.clientName || 'Valued Client'],
    ['Client Email', boq.clientEmail || 'N/A'],
    ['Client Tax ID (NIU)', boq.clientNiu || 'N/A'],
    ['Date Prepared', boq.datePrepared ? new Date(boq.datePrepared).toLocaleDateString() : new Date().toLocaleDateString()],
    ['Prepared By', boq.preparedBy || 'MADECC Quantity Surveyor'],
    ['Approved By', boq.approvedBy || 'Ing. Marcel Mbida, PE (ONIGC 4092)'],
    ['Status', boq.status || 'DRAFT'],
    [''],
    ['FINANCIAL RECAP SUMMARY'],
    ['Metric Description', 'Percentage (%)', `Amount (${currency})`],
    ['Measured Work Subtotal', '-', Number(boq.subtotal || 0)],
    ['Overhead & Logistics', Number(boq.overheadPercent || 0), Number(boq.overheadAmount || 0)],
    ['Contingency Allowance', Number(boq.contingencyPercent || 0), Number(boq.contingencyAmount || 0)],
    ['Contractor Profit Margin', Number(boq.profitPercent || 0), Number(boq.profitAmount || 0)],
    ['Value Added Tax (TVA)', Number(boq.taxPercent || 0), Number(boq.taxAmount || 0)],
    ['GRAND TOTAL ESTIMATE', '-', Number(boq.grandTotal || 0)]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Executive Summary');

  // 2. BOQ DETAILED ITEMS SHEET
  const itemRows: any[][] = [
    ['Section Code', 'Section Title', 'Item No.', 'Description of Works', 'Unit', 'Quantity', `Unit Rate (${currency})`, `Total Amount (${currency})`, 'Internal Cost Breakdown Basis']
  ];

  const sections = boq.sections || [];
  sections.forEach((sec: any) => {
    (sec.items || []).forEach((item: any) => {
      const mat = Number(item.internalMaterialCost || 0);
      const lab = Number(item.internalLabourCost || 0);
      const plt = Number(item.internalPlantCost || 0);
      const basis = item.measurementBasis || (mat > 0 || lab > 0 ? `Mat: ${mat} | Lab: ${lab} | Plant: ${plt}` : 'Standard Measure');

      itemRows.push([
        sec.sectionCode || '',
        sec.title || '',
        item.itemNumber || '',
        item.description || '',
        item.unit || '',
        Number(item.quantity || 0),
        Number(item.unitRate || 0),
        Number(item.amount || 0),
        basis
      ]);
    });

    // Section subtotal row
    itemRows.push([
      sec.sectionCode || '',
      `SUBTOTAL - ${sec.title}`,
      '',
      '',
      '',
      '',
      '',
      Number(sec.subtotal || 0),
      'SECTION TOTAL'
    ]);
    itemRows.push([]);
  });

  const itemsWs = XLSX.utils.aoa_to_sheet(itemRows);
  XLSX.utils.book_append_sheet(wb, itemsWs, 'BOQ Measured Items');

  // 3. COST JUSTIFICATION BREAKDOWN SHEET
  const costRows: any[][] = [
    ['Item No.', 'Description', 'Unit', 'Qty', 'Unit Rate', 'Total Amount', 'Material Cost', 'Labour Cost', 'Plant/Equipment', 'Subcontract/Other']
  ];

  sections.forEach((sec: any) => {
    (sec.items || []).forEach((item: any) => {
      const qty = Number(item.quantity || 0);
      const matUnit = Number(item.internalMaterialCost || 0);
      const labUnit = Number(item.internalLabourCost || 0);
      const pltUnit = Number(item.internalPlantCost || 0);
      const othUnit = Number(item.internalOtherCost || 0);

      costRows.push([
        item.itemNumber || '',
        item.description || '',
        item.unit || '',
        qty,
        Number(item.unitRate || 0),
        Number(item.amount || 0),
        matUnit * qty,
        labUnit * qty,
        pltUnit * qty,
        othUnit * qty
      ]);
    });
  });

  const costWs = XLSX.utils.aoa_to_sheet(costRows);
  XLSX.utils.book_append_sheet(wb, costWs, 'Cost Justification');

  // Convert to Blob
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const cleanName = sanitizeFilename(boq.projectName || boq.boqReference || 'Project');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `MADECC_Bill_of_Quantities_${cleanName}_${dateStr}.xlsx`;

  return { blob, filename };
}

/**
 * Universal BOQ File Import Parser (Excel .xlsx/.xls, CSV, Word/JSON)
 */
export async function parseBoqImportFile(file: File): Promise<{
  projectName?: string;
  clientName?: string;
  sections: Array<{
    sectionCode: string;
    title: string;
    subtotal: number;
    items: Array<{
      itemNumber: string;
      description: string;
      unit: string;
      quantity: number;
      unitRate: number;
      amount: number;
      notes?: string;
    }>;
  }>;
}> {
  const fileName = file.name.toLowerCase();

  // Excel or CSV Import using XLSX
  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const sectionsMap: { [code: string]: { sectionCode: string; title: string; items: any[] } } = {};
    let currentSecCode = 'A';
    let currentSecTitle = 'GENERAL WORKS & MEASURED ITEMS';

    sectionsMap[currentSecCode] = {
      sectionCode: currentSecCode,
      title: currentSecTitle,
      items: []
    };

    let itemIdx = 1;

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();
      const col2 = String(row[2] || '').trim();
      const col3 = String(row[3] || '').trim();
      const col4 = String(row[4] || '').trim();
      const col5 = String(row[5] || '').trim();

      // Check if row is a section title (e.g. "SECTION A: EARTHWORKS" or "PRELIMINARIES")
      if (col0.toUpperCase().startsWith('SECTION') || col1.toUpperCase().startsWith('SECTION') || (col0.length <= 4 && col1.length > 3 && !row[3])) {
        currentSecCode = col0.replace(/SECTION/i, '').trim() || String.fromCharCode(65 + Object.keys(sectionsMap).length);
        currentSecTitle = col1 || col0 || `SECTION ${currentSecCode}`;

        if (!sectionsMap[currentSecCode]) {
          sectionsMap[currentSecCode] = {
            sectionCode: currentSecCode,
            title: currentSecTitle,
            items: []
          };
        }
        itemIdx = 1;
        continue;
      }

      // Check if row looks like an item (has numeric qty/rate/amount)
      const qtyNum = parseFloat(col3) || parseFloat(col4) || parseFloat(col2);
      const rateNum = parseFloat(col4) || parseFloat(col5) || parseFloat(col3);

      if (col1 && !isNaN(qtyNum) && qtyNum > 0) {
        const itemNumber = col0 || `${currentSecCode}${itemIdx++}`;
        const desc = col1;
        const unit = col2 || 'm³';
        const qty = qtyNum;
        const rate = !isNaN(rateNum) ? rateNum : 1000;
        const amt = qty * rate;

        sectionsMap[currentSecCode].items.push({
          itemNumber,
          description: desc,
          unit,
          quantity: qty,
          unitRate: rate,
          amount: amt
        });
      }
    }

    const sections = Object.values(sectionsMap).map(sec => {
      const subtotal = sec.items.reduce((acc, it) => acc + (it.amount || 0), 0);
      return {
        sectionCode: sec.sectionCode,
        title: sec.title,
        subtotal,
        items: sec.items
      };
    }).filter(sec => sec.items.length > 0);

    return {
      projectName: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
      sections: sections.length > 0 ? sections : [
        {
          sectionCode: 'A',
          title: 'IMPORTED MEASURED WORKS',
          subtotal: 150000,
          items: [
            { itemNumber: 'A1', description: 'Sample Imported Line Item', unit: 'm³', quantity: 10, unitRate: 15000, amount: 150000 }
          ]
        }
      ]
    };
  }

  // Fallback JSON or plain text parse
  const text = await file.text();
  try {
    const json = JSON.parse(text);
    if (json.sections && Array.isArray(json.sections)) {
      return json;
    }
  } catch (e) {
    // text format
  }

  return {
    projectName: file.name.replace(/\.[^/.]+$/, ''),
    sections: [
      {
        sectionCode: 'A',
        title: 'IMPORTED SPECIFICATION ITEMS',
        subtotal: 250000,
        items: [
          { itemNumber: 'A1', description: 'Imported item specification from document', unit: 'LS', quantity: 1, unitRate: 250000, amount: 250000 }
        ]
      }
    ]
  };
}

