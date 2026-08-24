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
import { jsPDF } from 'jspdf';

export interface LabourItem {
  id?: string | number;
  itemNumber: string;
  description: string;
  quantity: number;
  unit: string;
  unitRate: number;
  amount: number;
  tradeCategory?: string;
  notes?: string;
}

export interface LabourSection {
  id?: string | number;
  sectionCode: string;
  title: string;
  subtotal: number;
  items: LabourItem[];
}

export interface LabourData {
  id?: string | number;
  quotationRef: string;
  projectName: string;
  clientName: string;
  clientEmail?: string;
  location: string;
  projectType: string;
  buildingFloors: number;
  date: string;
  preparedBy: string;
  approvedBy?: string;
  status: 'DRAFT' | 'PENDING' | 'FINAL' | 'APPROVED' | 'ARCHIVED';
  currency: string;
  overheadPercent: number;
  contingencyPercent: number;
  profitPercent: number;
  discountPercent: number;
  taxPercent: number;
  baseSubtotal: number;
  overheadAmount: number;
  contingencyAmount: number;
  profitAmount: number;
  discountAmount: number;
  taxableNet: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  revisionNumber: string;
  sections: LabourSection[];
  termsAndConditions?: string[];
  notes?: string;
}

function sanitizeFilename(str: string): string {
  if (!str) return 'Labour_Quotation';
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Generate Microsoft Word (.docx) document for Labour Quotation
 */
export async function generateLabourDocx(data: LabourData): Promise<{ blob: Blob; filename: string }> {
  const isDraft = data.status === 'DRAFT';
  const children: any[] = [];

  // 1. Header Branding Block
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
          text: 'CIVIL ENGINEERING, QUANTITY SURVEYING & LABOUR MANAGEMENT',
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
          text: 'Douala & Yaoundé, Republic of Cameroon | Email: projects@madecc-group.cm',
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
          text: 'LABOUR ESTIMATE & QUOTATION STATEMENT',
          bold: true,
          size: 24,
          color: '0F172A'
        })
      ]
    })
  );

  if (isDraft) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 100, after: 100 },
        children: [
          new TextRun({
            text: 'DRAFT ESTIMATE — FOR INTERNAL ENGINEERING REVIEW ONLY',
            bold: true,
            size: 18,
            color: 'DC2626'
          })
        ]
      })
    );
  }

  children.push(new Paragraph({ text: '', spacing: { after: 150 } }));

  // 2. Project & Client Metadata Grid Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Project Name: ', bold: true, size: 18 }),
                  new TextRun({ text: data.projectName, size: 18 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Location: ', bold: true, size: 18 }),
                  new TextRun({ text: data.location, size: 18 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Project Type: ', bold: true, size: 18 }),
                  new TextRun({ text: `${data.projectType} (${data.buildingFloors} Floors)`, size: 18 })
                ]
              })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Ref Number: ', bold: true, size: 18 }),
                  new TextRun({ text: data.quotationRef, size: 18 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Client: ', bold: true, size: 18 }),
                  new TextRun({ text: data.clientName, size: 18 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Date: ', bold: true, size: 18 }),
                  new TextRun({ text: data.date, size: 18 })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: 'Revision: ', bold: true, size: 18 }),
                  new TextRun({ text: data.revisionNumber || 'REV-01', size: 18 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
  children.push(metaTable);
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // 3. Detailed Labour Items Table
  const tableHeader = new TableRow({
    tableHeader: true,
    children: [
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })],
        shading: { fill: '0F172A' }
      }),
      new TableCell({
        width: { size: 45, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Labour Description', bold: true, color: 'FFFFFF', size: 16 })] })],
        shading: { fill: '0F172A' }
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Qty', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.RIGHT })],
        shading: { fill: '0F172A' }
      }),
      new TableCell({
        width: { size: 10, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Unit', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.CENTER })],
        shading: { fill: '0F172A' }
      }),
      new TableCell({
        width: { size: 11, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Rate (' + data.currency + ')', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.RIGHT })],
        shading: { fill: '0F172A' }
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        children: [new Paragraph({ children: [new TextRun({ text: 'Total (' + data.currency + ')', bold: true, color: 'FFFFFF', size: 16 })], alignment: AlignmentType.RIGHT })],
        shading: { fill: '0F172A' }
      })
    ]
  });

  const tableRows: TableRow[] = [tableHeader];

  data.sections.forEach((sec) => {
    // Section Header Row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 6,
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `${sec.sectionCode} — ${sec.title.toUpperCase()}`, bold: true, color: '0F172A', size: 16 })
                ]
              })
            ],
            shading: { fill: 'F1F5F9' }
          })
        ]
      })
    );

    // Section Items
    sec.items.forEach((item) => {
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.itemNumber, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 16 })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.quantity.toLocaleString(), size: 16 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.unit, size: 16 })], alignment: AlignmentType.CENTER })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.unitRate.toLocaleString(), size: 16 })], alignment: AlignmentType.RIGHT })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.amount.toLocaleString(), size: 16 })], alignment: AlignmentType.RIGHT })] })
          ]
        })
      );
    });

    // Section Subtotal Row
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 5,
            children: [new Paragraph({ children: [new TextRun({ text: `Subtotal ${sec.sectionCode}:`, bold: true, size: 16 })], alignment: AlignmentType.RIGHT })]
          }),
          new TableCell({
            children: [new Paragraph({ children: [new TextRun({ text: sec.subtotal.toLocaleString() + ' ' + data.currency, bold: true, size: 16 })], alignment: AlignmentType.RIGHT })]
          })
        ]
      })
    );
  });

  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });

  children.push(mainTable);
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // 4. Financial Summary Box Table
  const summaryRows = [
    { label: 'Base Labour Subtotal:', value: `${data.baseSubtotal.toLocaleString()} ${data.currency}`, bold: false },
    { label: `Overhead & Logistics (${data.overheadPercent}%):`, value: `${data.overheadAmount.toLocaleString()} ${data.currency}`, bold: false },
    { label: `Profit Margin (${data.profitPercent}%):`, value: `${data.profitAmount.toLocaleString()} ${data.currency}`, bold: true },
    { label: `Discount (${data.discountPercent}%):`, value: `-${data.discountAmount.toLocaleString()} ${data.currency}`, bold: false },
    { label: `Tax / VAT (${data.taxPercent}%):`, value: `${data.taxAmount.toLocaleString()} ${data.currency}`, bold: false },
    { label: 'GRAND TOTAL NET:', value: `${data.grandTotal.toLocaleString()} ${data.currency}`, bold: true }
  ];

  const summaryTable = new Table({
    width: { size: 60, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.RIGHT,
    rows: summaryRows.map(
      (r) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 60, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: r.label, bold: r.bold, size: 18 })] })]
            }),
            new TableCell({
              width: { size: 40, type: WidthType.PERCENTAGE },
              children: [new Paragraph({ children: [new TextRun({ text: r.value, bold: r.bold, size: 18, color: r.bold ? 'D97706' : '0F172A' })], alignment: AlignmentType.RIGHT })]
            })
          ]
        })
    )
  });

  children.push(summaryTable);
  children.push(new Paragraph({ text: '', spacing: { after: 300 } }));

  // 5. Signatures Block
  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'PREPARED BY (QUANTITY SURVEYOR):', bold: true, size: 16 })] }),
              new Paragraph({ text: '', spacing: { after: 250 } }),
              new Paragraph({ children: [new TextRun({ text: data.preparedBy, bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Civil Engineering Dept, MADECC Group', size: 14, color: '64748B' })] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'APPROVED BY (CHIEF ENGINEER):', bold: true, size: 16 })] }),
              new Paragraph({ text: '', spacing: { after: 250 } }),
              new Paragraph({ children: [new TextRun({ text: data.approvedBy || 'Eng. Paulin Nguema, PE (ONIGC)', bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Chief Technical Auditor & Executive Officer', size: 14, color: '64748B' })] })
            ]
          })
        ]
      })
    ]
  });

  children.push(sigTable);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${sanitizeFilename(data.projectName)}_${data.quotationRef}.docx`;
  return { blob, filename };
}

/**
 * Generate CSV for Microsoft Excel Compatibility
 */
export function generateLabourCsv(data: LabourData) {
  const rows: string[][] = [
    ['MADECC GROUP S.A.R.L. — LABOUR ESTIMATE STATEMENT'],
    ['Quotation Ref', data.quotationRef, 'Date', data.date, 'Status', data.status],
    ['Project Name', data.projectName, 'Location', data.location],
    ['Client Name', data.clientName, 'Floors', data.buildingFloors.toString(), 'Project Type', data.projectType],
    ['Prepared By', data.preparedBy, 'Approved By', data.approvedBy || 'PE Auditor'],
    [],
    ['Section / Item Code', 'Description', 'Quantity', 'Unit', 'Unit Rate (' + data.currency + ')', 'Amount (' + data.currency + ')', 'Trade Category']
  ];

  data.sections.forEach((sec) => {
    rows.push([sec.sectionCode, sec.title.toUpperCase(), '', '', '', sec.subtotal.toString(), 'SECTION HEADER']);
    sec.items.forEach((item) => {
      rows.push([
        item.itemNumber,
        item.description,
        item.quantity.toString(),
        item.unit,
        item.unitRate.toString(),
        item.amount.toString(),
        item.tradeCategory || 'General Labour'
      ]);
    });
  });

  rows.push([]);
  rows.push(['FINANCIAL SUMMARY BREAKDOWN']);
  rows.push(['Base Labour Subtotal', '', '', '', '', data.baseSubtotal.toString()]);
  rows.push([`Overhead & Logistics (${data.overheadPercent}%)`, '', '', '', '', data.overheadAmount.toString()]);
  rows.push([`Profit Margin (${data.profitPercent}%)`, '', '', '', '', data.profitAmount.toString()]);
  rows.push([`Discount (${data.discountPercent}%)`, '', '', '', '', `-${data.discountAmount}`]);
  rows.push([`Tax / VAT (${data.taxPercent}%)`, '', '', '', '', data.taxAmount.toString()]);
  rows.push(['GRAND TOTAL NET', '', '', '', '', data.grandTotal.toString()]);
  rows.push(['Advance Paid', '', '', '', '', data.paidAmount.toString()]);
  rows.push(['Balance Due', '', '', '', '', data.balanceDue.toString()]);

  const csvString = rows
    .map((row) =>
      row
        .map((cell) => {
          const str = String(cell || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');

  const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${sanitizeFilename(data.projectName)}_${data.quotationRef}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate A4 Portrait or Landscape PDF using jsPDF
 */
export function generateLabourPdf(data: LabourData, orientation: 'portrait' | 'landscape' = 'portrait') {
  const doc = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(217, 119, 6); // amber-600 top line
  doc.rect(0, 0, pageWidth, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MADECC GROUP S.A.R.L.', margin, 13);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(251, 191, 36); // amber-400
  doc.text('CIVIL ENGINEERING, QUANTITY SURVEYING & LABOUR MANAGEMENT', margin, 18);

  doc.setTextColor(203, 213, 225);
  doc.text('Douala & Yaoundé, Cameroon | ISO 9001:2015 Certified | projects@madecc-group.cm', margin, 23);

  // Status Badge on Header Right
  const badgeText = data.status;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const badgeWidth = 28;
  doc.setFillColor(data.status === 'FINAL' || data.status === 'APPROVED' ? 16 : 217, data.status === 'FINAL' || data.status === 'APPROVED' ? 185 : 119, data.status === 'FINAL' || data.status === 'APPROVED' ? 129 : 6);
  doc.roundedRect(pageWidth - margin - badgeWidth, 9, badgeWidth, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(badgeText, pageWidth - margin - badgeWidth + 4, 15);

  y = 35;

  // Document Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFFICIAL LABOUR COST ESTIMATE & QUOTATION', margin, y);
  y += 6;

  // Metadata Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  
  // Col 1
  doc.setFont('helvetica', 'bold');
  doc.text('Project Title:', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.projectName.substring(0, 35), margin + 24, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Location:', margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.location, margin + 24, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Type & Floors:', margin + 4, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.projectType} (${data.buildingFloors} Floors)`, margin + 24, y + 18);

  // Col 2
  const col2X = margin + (pageWidth - margin * 2) / 2;
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Ref Code:', col2X, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.quotationRef, col2X + 18, y + 6);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Client Name:', col2X, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(data.clientName, col2X + 18, y + 12);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Rev:', col2X, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(`${data.date} | ${data.revisionNumber || 'REV-01'}`, col2X + 18, y + 18);

  y += 28;

  // Detailed Table Setup
  const usableWidth = pageWidth - margin * 2;
  const colW = orientation === 'landscape'
    ? { code: 14, desc: 100, qty: 22, unit: 20, rate: 30, amount: 35 }
    : { code: 12, desc: 75, qty: 18, unit: 16, rate: 25, amount: 28 };

  // Table Header
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, usableWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);

  doc.text('Code', margin + 2, y + 5);
  doc.text('Labour Description', margin + colW.code + 2, y + 5);
  doc.text('Qty', margin + colW.code + colW.desc + colW.qty - 2, y + 5, { align: 'right' });
  doc.text('Unit', margin + colW.code + colW.desc + colW.qty + 4, y + 5);
  doc.text(`Rate (${data.currency})`, margin + colW.code + colW.desc + colW.qty + colW.unit + colW.rate - 2, y + 5, { align: 'right' });
  doc.text(`Total (${data.currency})`, margin + usableWidth - 2, y + 5, { align: 'right' });

  y += 7;

  // Table Body Rows
  data.sections.forEach((sec) => {
    // Check page space
    if (y > pageHeight - 35) {
      doc.addPage();
      y = margin + 10;
    }

    // Section Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, usableWidth, 6, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${sec.sectionCode} — ${sec.title.toUpperCase()}`, margin + 2, y + 4.5);
    y += 6;

    // Section Items
    sec.items.forEach((item) => {
      if (y > pageHeight - 35) {
        doc.addPage();
        y = margin + 10;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      doc.text(item.itemNumber, margin + 2, y + 4);
      
      const truncDesc = item.description.length > 52 ? item.description.substring(0, 50) + '...' : item.description;
      doc.text(truncDesc, margin + colW.code + 2, y + 4);
      
      doc.text(item.quantity.toLocaleString(), margin + colW.code + colW.desc + colW.qty - 2, y + 4, { align: 'right' });
      doc.text(item.unit, margin + colW.code + colW.desc + colW.qty + 4, y + 4);
      doc.text(item.unitRate.toLocaleString(), margin + colW.code + colW.desc + colW.qty + colW.unit + colW.rate - 2, y + 4, { align: 'right' });
      
      doc.setFont('helvetica', 'bold');
      doc.text(item.amount.toLocaleString(), margin + usableWidth - 2, y + 4, { align: 'right' });

      // Bottom Row Border
      doc.setDrawColor(241, 245, 249);
      doc.line(margin, y + 5.5, margin + usableWidth, y + 5.5);

      y += 6;
    });

    // Section Subtotal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Subtotal ${sec.sectionCode}:`, margin + colW.code + colW.desc + colW.qty + colW.unit, y + 4);
    doc.text(`${sec.subtotal.toLocaleString()} ${data.currency}`, margin + usableWidth - 2, y + 4, { align: 'right' });
    y += 6;
  });

  y += 4;
  if (y > pageHeight - 55) {
    doc.addPage();
    y = margin + 10;
  }

  // Summary Totals Table Box (Right Aligned)
  const sumW = orientation === 'landscape' ? 100 : 90;
  const sumX = pageWidth - margin - sumW;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(sumX, y, sumW, 36, 2, 2, 'FD');

  let sumY = y + 5;

  const addSumLine = (lbl: string, val: string, isHighlight = false) => {
    doc.setFont('helvetica', isHighlight ? 'bold' : 'normal');
    doc.setFontSize(isHighlight ? 9 : 8);
    doc.setTextColor(isHighlight ? 217 : 71, isHighlight ? 119 : 85, isHighlight ? 6 : 105);
    doc.text(lbl, sumX + 4, sumY);
    doc.text(val, sumX + sumW - 4, sumY, { align: 'right' });
    sumY += 5.5;
  };

  addSumLine('Base Labour Subtotal:', `${data.baseSubtotal.toLocaleString()} ${data.currency}`);
  addSumLine(`Overhead & Logistics (${data.overheadPercent}%):`, `${data.overheadAmount.toLocaleString()} ${data.currency}`);
  addSumLine(`Profit Margin (${data.profitPercent}%):`, `${data.profitAmount.toLocaleString()} ${data.currency}`);
  addSumLine(`Discount (${data.discountPercent}%):`, `-${data.discountAmount.toLocaleString()} ${data.currency}`);
  addSumLine(`Tax / VAT (${data.taxPercent}%):`, `${data.taxAmount.toLocaleString()} ${data.currency}`);
  addSumLine('GRAND TOTAL NET:', `${data.grandTotal.toLocaleString()} ${data.currency}`, true);

  y += 42;

  if (y > pageHeight - 30) {
    doc.addPage();
    y = margin + 10;
  }

  // Signatures
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  doc.text('Prepared By:', margin, y);
  doc.text('Approved & Certified By:', pageWidth / 2 + 10, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(data.preparedBy, margin, y);
  doc.text(data.approvedBy || 'Eng. Paulin Nguema, PE (ONIGC Lic #2489)', pageWidth / 2 + 10, y);

  y += 4;
  doc.text('Civil Engineering & Quantity Surveying Dept', margin, y);
  doc.text('Chief Structural Auditor, MADECC Group', pageWidth / 2 + 10, y);

  // Footer Page Number
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `MADECC Group S.A.R.L. — Official Labour Calculation Statement | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  doc.save(`${sanitizeFilename(data.projectName)}_${data.quotationRef}.pdf`);
}
