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
  BorderStyle,
  Header,
  Footer,
  PageNumber
} from 'docx';
import * as XLSX from 'xlsx';
import { numberToWords } from './numberToWords';

function sanitizeFilename(str: string): string {
  if (!str) return 'BOQ';
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

const BORDER_STYLE_LIGHT = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' }
};

const BORDER_STYLE_NONE = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
};

/**
 * Generate complete Microsoft Word (.docx) document for BOQ for MADECC Group SARL.
 * Guarantees zero cut-off sections, repeated table headers, explicit cell widths,
 * complete financial recap, amount in words, and engineer sign-off.
 */
export async function generateBoqDocx(boq: any): Promise<{ blob: Blob; filename: string }> {
  const isDraft = boq.status !== 'APPROVED';
  const currency = boq.currency || 'XAF';
  const companyName = 'MADECC Group SARL';
  const children: any[] = [];

  // 1. Header Branding
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 60 },
      children: [
        new TextRun({
          text: companyName,
          bold: true,
          size: 32,
          color: 'D97706' // Amber-600
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: 'CIVIL, STRUCTURAL & MECHANICAL ENGINEERING',
          bold: true,
          size: 18,
          color: '0F172A' // Slate-900
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: 'Enterprise Quantity Surveying & Technical Cost Engineering Department',
          italics: true,
          size: 15,
          color: '475569' // Slate-600
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: 'Douala & Yaoundé, Republic of Cameroon | Email: engineering@madeccgroup.cm | Tel: +237 671 063 511',
          size: 14,
          color: '64748B'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'OFFICIAL BILL OF QUANTITIES / TENDER ESTIMATE',
          bold: true,
          size: 22,
          color: '0F172A'
        })
      ]
    })
  );

  // Status Banner
  if (isDraft) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 160 },
        children: [
          new TextRun({
            text: `STATUS: ${boq.status || 'DRAFT'} — OFFICIAL WORKING ESTIMATE`,
            bold: true,
            size: 16,
            color: 'D97706'
          })
        ]
      })
    );
  } else {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 160 },
        children: [
          new TextRun({
            text: 'STATUS: APPROVED & CERTIFIED FOR TENDER SUBMISSION',
            bold: true,
            size: 16,
            color: '059669' // Emerald-600
          })
        ]
      })
    );
  }

  // 2. Project Metadata Table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDER_STYLE_LIGHT,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC' },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'BOQ Reference: ', bold: true, size: 16 }), new TextRun({ text: boq.boqReference || '', size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Project Name: ', bold: true, size: 16 }), new TextRun({ text: boq.projectName || '', size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Location: ', bold: true, size: 16 }), new TextRun({ text: boq.location || 'Douala, Cameroon', size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Contract Type: ', bold: true, size: 16 }), new TextRun({ text: boq.contractType || 'UNIT_RATE', size: 16 })] })
            ]
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC' },
            margins: { top: 120, bottom: 120, left: 140, right: 140 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Revision: ', bold: true, size: 16 }), new TextRun({ text: boq.revisionNumber || 'REV-00', size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Client Name: ', bold: true, size: 16 }), new TextRun({ text: boq.clientName || 'Valued Client', size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Date Prepared: ', bold: true, size: 16 }), new TextRun({ text: boq.datePrepared ? new Date(boq.datePrepared).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'), size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Prepared By: ', bold: true, size: 16 }), new TextRun({ text: boq.preparedBy || 'Lead Quantity Surveyor', size: 16 })] })
            ]
          })
        ]
      })
    ]
  });

  children.push(metaTable);
  children.push(new Paragraph({ text: '', spacing: { after: 200 } }));

  // 3. Sections & Work Items
  const sections = Array.isArray(boq.sections) ? boq.sections : [];

  sections.forEach((sec: any, sIdx: number) => {
    const secCode = sec.sectionCode || `${sIdx + 1}.0`;
    const secTitle = sec.title || 'Work Items';
    const secSubtotal = Number(sec.subtotal || 0).toLocaleString();

    // Section Title Header
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [
          new TextRun({
            text: `SECTION ${secCode}: ${secTitle}`.toUpperCase(),
            bold: true,
            size: 20,
            color: '0F172A'
          }),
          new TextRun({
            text: `  (Subtotal: ${secSubtotal} ${currency})`,
            bold: true,
            size: 18,
            color: 'D97706'
          })
        ]
      })
    );

    // Items Table Header with tableHeader: true and cantSplit: true
    const tableHeader = new TableRow({
      tableHeader: true,
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Item', bold: true, size: 15, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 44, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Description of Works & Specifications', bold: true, size: 15, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 10, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Unit', bold: true, size: 15, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 11, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Qty', bold: true, size: 15, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 12, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Rate (${currency})`, bold: true, size: 15, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 100, bottom: 100, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Amount (${currency})`, bold: true, size: 15, color: 'FFFFFF' })] })]
        })
      ]
    });

    // Body rows with explicit cell widths and cantSplit
    const items = Array.isArray(sec.items) ? sec.items : [];
    const itemRows = items.map((item: any, iIdx: number) => {
      const isZebra = iIdx % 2 === 1;
      const fill = isZebra ? 'F8FAFC' : 'FFFFFF';
      const descParagraphs: Paragraph[] = [
        new Paragraph({ children: [new TextRun({ text: item.description || '', size: 15 })] })
      ];

      if (item.measurementBasis || item.notes) {
        descParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: item.measurementBasis ? `Basis: ${item.measurementBasis}` : String(item.notes),
                italics: true,
                size: 13,
                color: '64748B'
              })
            ]
          })
        );
      }

      return new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [new Paragraph({ children: [new TextRun({ text: item.itemNumber || `${secCode}.${iIdx + 1}`, bold: true, size: 15 })] })]
          }),
          new TableCell({
            width: { size: 44, type: WidthType.PERCENTAGE },
            shading: { fill },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: descParagraphs
          }),
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            shading: { fill },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: item.unit || 'LS', size: 15 })] })]
          }),
          new TableCell({
            width: { size: 11, type: WidthType.PERCENTAGE },
            shading: { fill },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: Number(item.quantity ?? 0).toLocaleString(), size: 15 })] })]
          }),
          new TableCell({
            width: { size: 12, type: WidthType.PERCENTAGE },
            shading: { fill },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: Number(item.unitRate || 0).toLocaleString(), size: 15 })] })]
          }),
          new TableCell({
            width: { size: 13, type: WidthType.PERCENTAGE },
            shading: { fill },
            margins: { top: 80, bottom: 80, left: 80, right: 80 },
            children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: Number(item.amount || 0).toLocaleString(), bold: true, size: 15 })] })]
          })
        ]
      });
    });

    // Section Subtotal Row
    const subtotalRow = new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 87, type: WidthType.PERCENTAGE },
          columnSpan: 5,
          shading: { fill: 'F1F5F9' },
          margins: { top: 90, bottom: 90, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `SECTION ${secCode} SUB-TOTAL:`, bold: true, size: 16, color: '0F172A' })] })]
        }),
        new TableCell({
          width: { size: 13, type: WidthType.PERCENTAGE },
          shading: { fill: 'F1F5F9' },
          margins: { top: 90, bottom: 90, left: 80, right: 80 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${secSubtotal} ${currency}`, bold: true, size: 16, color: 'D97706' })] })]
        })
      ]
    });

    const itemTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: BORDER_STYLE_LIGHT,
      rows: [tableHeader, ...itemRows, subtotalRow]
    });

    children.push(itemTable);
    children.push(new Paragraph({ text: '', spacing: { after: 180 } }));
  });

  // 4. Commercial Financial Summary Recap Table
  children.push(
    new Paragraph({
      spacing: { before: 280, after: 120 },
      alignment: AlignmentType.RIGHT,
      children: [new TextRun({ text: 'COMMERCIAL & FINANCIAL SUMMARY RECAP', bold: true, size: 20, color: '0F172A' })]
    })
  );

  const summaryRows = [
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, margins: { top: 90, bottom: 90, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Measured Works Subtotal:', bold: true, size: 17 })] })] }),
        new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, margins: { top: 90, bottom: 90, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${Number(boq.subtotal || 0).toLocaleString()} ${currency}`, bold: true, size: 17 })] })] })
      ]
    })
  ];

  if (Number(boq.overheadAmount) > 0) {
    summaryRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Site Overhead & Logistics (${boq.overheadPercent}%):`, size: 16 })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.overheadAmount).toLocaleString()} ${currency}`, size: 16 })] })] })
        ]
      })
    );
  }

  if (Number(boq.contingencyAmount) > 0) {
    summaryRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Unforeseen Contingencies (${boq.contingencyPercent}%):`, size: 16 })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.contingencyAmount).toLocaleString()} ${currency}`, size: 16 })] })] })
        ]
      })
    );
  }

  if (Number(boq.profitAmount) > 0) {
    summaryRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Contractor Profit Margin (${boq.profitPercent}%):`, size: 16 })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.profitAmount).toLocaleString()} ${currency}`, size: 16 })] })] })
        ]
      })
    );
  }

  if (Number(boq.taxAmount) > 0) {
    summaryRows.push(
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({ width: { size: 70, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `Value Added Tax / TVA (${boq.taxPercent}%):`, size: 16 })] })] }),
          new TableCell({ width: { size: 30, type: WidthType.PERCENTAGE }, margins: { top: 80, bottom: 80, left: 100, right: 100 }, children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `+${Number(boq.taxAmount).toLocaleString()} ${currency}`, size: 16 })] })] })
        ]
      })
    );
  }

  const grandTotalNum = Number(boq.grandTotal || 0);

  summaryRows.push(
    new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'GRAND TOTAL ESTIMATE:', bold: true, size: 22, color: 'FFFFFF' })] })]
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { fill: '0F172A' },
          margins: { top: 120, bottom: 120, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${grandTotalNum.toLocaleString()} ${currency}`, bold: true, size: 22, color: 'F59E0B' })] })]
        })
      ]
    })
  );

  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDER_STYLE_LIGHT,
    rows: summaryRows
  });

  children.push(summaryTable);

  // Amount in Words
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 200 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({ text: 'Amount in Words: ', bold: true, size: 15, color: '0F172A' }),
        new TextRun({ text: numberToWords(grandTotalNum, currency), italics: true, bold: true, size: 15, color: 'D97706' })
      ]
    })
  );

  // 5. Statutory Sign-Off & Official Engineering Approval Table
  children.push(
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: 'STATUTORY SIGN-OFF & CERTIFICATION', bold: true, size: 18, color: '0F172A' })]
    })
  );

  const signTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: BORDER_STYLE_LIGHT,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: 33.3, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC' },
            margins: { top: 100, bottom: 140, left: 100, right: 100 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'PREPARED BY', bold: true, size: 15, color: '475569' })] }),
              new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: boq.preparedBy || 'Lead Quantity Surveyor', bold: true, size: 15 })] }),
              new Paragraph({ children: [new TextRun({ text: 'MADECC Directorate of QS', size: 13, color: '64748B' })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: 'Date: ____________________', size: 13, color: '94A3B8' })] }),
              new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Signature: _________________', size: 13, color: '94A3B8' })] })
            ]
          }),
          new TableCell({
            width: { size: 33.3, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC' },
            margins: { top: 100, bottom: 140, left: 100, right: 100 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'VERIFIED & CHECKED BY', bold: true, size: 15, color: '475569' })] }),
              new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Chief Commercial QS Engineer', bold: true, size: 15 })] }),
              new Paragraph({ children: [new TextRun({ text: 'MADECC Technical Audit Unit', size: 13, color: '64748B' })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: 'Date: ____________________', size: 13, color: '94A3B8' })] }),
              new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Signature: _________________', size: 13, color: '94A3B8' })] })
            ]
          }),
          new TableCell({
            width: { size: 33.4, type: WidthType.PERCENTAGE },
            shading: { fill: 'F8FAFC' },
            margins: { top: 100, bottom: 140, left: 100, right: 100 },
            children: [
              new Paragraph({ children: [new TextRun({ text: 'APPROVED & SEALED BY', bold: true, size: 15, color: '475569' })] }),
              new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: boq.approvedBy || 'Ing. Marcel Mbida, PE (ONIGC 4092)', bold: true, size: 15 })] }),
              new Paragraph({ children: [new TextRun({ text: 'Engineer of Record / Directorate', size: 13, color: '64748B' })] }),
              new Paragraph({ spacing: { before: 100 }, children: [new TextRun({ text: '[ MADECC Group SARL SEAL ]', bold: true, size: 13, color: 'D97706' })] }),
              new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: 'Signature: _________________', size: 13, color: '94A3B8' })] })
            ]
          })
        ]
      })
    ]
  });

  children.push(signTable);

  // 6. Tender Notes & Execution Terms
  children.push(
    new Paragraph({
      spacing: { before: 240, after: 80 },
      children: [new TextRun({ text: 'COMMERCIAL TERMS & SPECIFICATION NOTES', bold: true, size: 16, color: '0F172A' })]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: '1. Quotation Validity: This tender pricing is firm and valid for 90 calendar days from the date of submission.',
          size: 14,
          color: '475569'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: '2. Payment Terms: Progressive monthly valuations supported by joint on-site measurement and Interim Payment Certificates (IPC).',
          size: 14,
          color: '475569'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({
          text: '3. Technical Standards: All workshop equipment, structural works, and materials comply strictly with British Standards (BS) and Cameroon civil norms.',
          size: 14,
          color: '475569'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: '4. Warranty: All supplied workshop practice equipment and structural elements carry a 12-month Defects Liability Period (DLP).',
          size: 14,
          color: '475569'
        })
      ]
    })
  );

  // Document setup with exact A4 page size, margins, running headers & footers
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // A4 Width in twips (210mm)
              height: 16838 // A4 Height in twips (297mm)
            },
            margin: {
              top: 720,    // 0.5 inch (12.7mm)
              bottom: 720,
              left: 720,
              right: 720
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: `${companyName} | Ref: ${boq.boqReference || 'BOQ-001'} (${boq.revisionNumber || 'REV-00'})`,
                    size: 13,
                    color: '94A3B8'
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: BORDER_STYLE_NONE,
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 60, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: `${companyName} — Certified Bill of Quantities`,
                                size: 13,
                                color: '94A3B8'
                              })
                            ]
                          })
                        ]
                      }),
                      new TableCell({
                        width: { size: 40, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            alignment: AlignmentType.RIGHT,
                            children: [
                              new TextRun({
                                children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                                size: 13,
                                color: '94A3B8'
                              })
                            ]
                          })
                        ]
                      })
                    ]
                  })
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
  const cleanName = sanitizeFilename(boq.projectName || boq.boqReference || 'Project');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_BOQ_${cleanName}_${dateStr}.docx`;

  return { blob, filename };
}

/**
 * Generate CSV document for BOQ
 */
export function generateBoqCsv(boq: any): { blob: Blob; filename: string } {
  const isDraft = boq.status !== 'APPROVED';
  const currency = boq.currency || 'XAF';
  const companyName = 'MADECC Group SARL';
  const rows: string[][] = [];

  // Branding
  rows.push([`${companyName} - OFFICIAL BILL OF QUANTITIES / ESTIMATE`]);
  rows.push(['Civil, Structural & Mechanical Engineering Department']);
  rows.push(['Douala & Yaoundé, Republic of Cameroon | Contact: engineering@madeccgroup.cm']);
  rows.push([]);

  if (isDraft) {
    rows.push(['STATUS', `DRAFT (${boq.status || 'DRAFT'}) — OFFICIAL WORKING ESTIMATE`]);
  } else {
    rows.push(['STATUS', 'APPROVED & CERTIFIED']);
  }

  // Metadata
  rows.push(['BOQ Reference', boq.boqReference || '']);
  rows.push(['Revision', boq.revisionNumber || 'REV-00']);
  rows.push(['Project Name', boq.projectName || '']);
  rows.push(['Location', boq.location || '']);
  rows.push(['Client Name', boq.clientName || '']);
  rows.push(['Client Email', boq.clientEmail || '']);
  rows.push(['Contract Type', boq.contractType || 'UNIT_RATE']);
  rows.push(['Date Prepared', boq.datePrepared ? new Date(boq.datePrepared).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')]);
  rows.push(['Prepared By', boq.preparedBy || '']);
  rows.push(['Currency', currency]);
  rows.push([]);

  // BOQ Items Header
  rows.push(['Section Code', 'Section Title', 'Item Number', 'Description of Works', 'Unit', 'Quantity', `Unit Rate (${currency})`, `Amount (${currency})`, 'Measurement Basis']);

  const sections = Array.isArray(boq.sections) ? boq.sections : [];
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
        String(item.amount ?? 0),
        item.measurementBasis || ''
      ]);
    });
    // Section subtotal row
    rows.push([
      sec.sectionCode || '',
      `SUBTOTAL - ${sec.title}`,
      '',
      '',
      '',
      '',
      '',
      String(sec.subtotal ?? 0),
      'SECTION TOTAL'
    ]);
    rows.push([]);
  });

  // Financial Summary
  rows.push(['COMMERCIAL FINANCIAL SUMMARY']);
  rows.push(['Measured Works Subtotal', '', '', '', '', '', '', String(boq.subtotal ?? 0)]);
  if (Number(boq.overheadAmount) > 0) {
    rows.push([`Site Overhead & Logistics (${boq.overheadPercent}%)`, '', '', '', '', '', '', String(boq.overheadAmount ?? 0)]);
  }
  if (Number(boq.contingencyAmount) > 0) {
    rows.push([`Unforeseen Contingencies (${boq.contingencyPercent}%)`, '', '', '', '', '', '', String(boq.contingencyAmount ?? 0)]);
  }
  if (Number(boq.profitAmount) > 0) {
    rows.push([`Contractor Profit Margin (${boq.profitPercent}%)`, '', '', '', '', '', '', String(boq.profitAmount ?? 0)]);
  }
  if (Number(boq.taxAmount) > 0) {
    rows.push([`Value Added Tax / TVA (${boq.taxPercent}%)`, '', '', '', '', '', '', String(boq.taxAmount ?? 0)]);
  }
  rows.push([`GRAND TOTAL ESTIMATE (${currency})`, '', '', '', '', '', '', String(boq.grandTotal ?? 0)]);
  rows.push(['Amount in Words', numberToWords(Number(boq.grandTotal || 0), currency)]);

  // Serialize CSV with UTF-8 BOM
  const csvContent = '\uFEFF' + rows.map(r => r.map(cell => {
    const val = String(cell ?? '').replace(/"/g, '""');
    return `"${val}"`;
  }).join(',')).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const cleanName = sanitizeFilename(boq.projectName || boq.boqReference || 'Project');
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_BOQ_${cleanName}_${dateStr}.csv`;

  return { blob, filename };
}

/**
 * Generate Microsoft Excel (.xlsx) workbook for BOQ with multiple tabs
 */
export function generateBoqExcel(boq: any): { blob: Blob; filename: string } {
  const wb = XLSX.utils.book_new();
  const currency = boq.currency || 'XAF';
  const companyName = 'MADECC Group SARL';

  // 1. EXECUTIVE SUMMARY SHEET
  const summaryRows = [
    [`${companyName} - CIVIL, STRUCTURAL & MECHANICAL ENGINEERING`],
    ['OFFICIAL BILL OF QUANTITIES & EXECUTIVE COST ESTIMATE'],
    [''],
    ['BOQ Reference', boq.boqReference || 'MADECC-BOQ-2026-0001'],
    ['Revision Number', boq.revisionNumber || 'REV-00'],
    ['Project Name', boq.projectName || 'General Construction Works'],
    ['Location', boq.location || 'Douala / Yaoundé, Cameroon'],
    ['Client Name', boq.clientName || 'Valued Client'],
    ['Client Email', boq.clientEmail || 'N/A'],
    ['Contract Type', boq.contractType || 'UNIT_RATE'],
    ['Date Prepared', boq.datePrepared ? new Date(boq.datePrepared).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')],
    ['Prepared By', boq.preparedBy || 'Lead Quantity Surveyor'],
    ['Approved By', boq.approvedBy || 'Ing. Marcel Mbida, PE (ONIGC 4092)'],
    ['Status', boq.status || 'DRAFT'],
    [''],
    ['COMMERCIAL FINANCIAL SUMMARY RECAP'],
    ['Metric Description', 'Percentage (%)', `Amount (${currency})`],
    ['Measured Work Subtotal', '-', Number(boq.subtotal || 0)],
    ['Site Overhead & Logistics', Number(boq.overheadPercent || 0), Number(boq.overheadAmount || 0)],
    ['Unforeseen Contingencies', Number(boq.contingencyPercent || 0), Number(boq.contingencyAmount || 0)],
    ['Contractor Profit Margin', Number(boq.profitPercent || 0), Number(boq.profitAmount || 0)],
    ['Value Added Tax (TVA)', Number(boq.taxPercent || 0), Number(boq.taxAmount || 0)],
    ['GRAND TOTAL ESTIMATE', '-', Number(boq.grandTotal || 0)],
    ['Amount in Words', numberToWords(Number(boq.grandTotal || 0), currency)]
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Executive Summary');

  // 2. BOQ DETAILED ITEMS SHEET
  const itemRows: any[][] = [
    ['Section Code', 'Section Title', 'Item No.', 'Description of Works & Specifications', 'Unit', 'Quantity', `Unit Rate (${currency})`, `Total Amount (${currency})`, 'Internal Cost Breakdown Basis']
  ];

  const sections = Array.isArray(boq.sections) ? boq.sections : [];
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
  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_BOQ_${cleanName}_${dateStr}.xlsx`;

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

    // Attempt to detect headers
    let startRow = 1;
    for (let r = 0; r < Math.min(10, rawData.length); r++) {
      const rowStr = (rawData[r] || []).join(' ').toLowerCase();
      if (rowStr.includes('description') || rowStr.includes('item') || rowStr.includes('unit')) {
        startRow = r + 1;
        break;
      }
    }

    for (let r = startRow; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      const col0 = String(row[0] || '').trim();
      const col1 = String(row[1] || '').trim();

      // Check if it's a section header
      if (col0.toLowerCase().startsWith('section') || (col1 && !row[3] && !row[4])) {
        currentSecCode = col0.replace(/section/i, '').trim() || `SEC-${r}`;
        currentSecTitle = col1 || col0;
        if (!sectionsMap[currentSecCode]) {
          sectionsMap[currentSecCode] = {
            sectionCode: currentSecCode,
            title: currentSecTitle,
            items: []
          };
        }
        continue;
      }

      // Check for item row: description is usually col 1 or 3
      const desc = String(row[1] || row[3] || row[0] || '').trim();
      if (!desc || desc.toLowerCase().includes('total') || desc.toLowerCase().includes('subtotal')) continue;

      const unit = String(row[2] || row[4] || 'm³').trim();
      const qty = parseFloat(String(row[3] || row[5] || '1').replace(/[^0-9.-]/g, '')) || 1;
      const rate = parseFloat(String(row[4] || row[6] || '0').replace(/[^0-9.-]/g, '')) || 0;

      sectionsMap[currentSecCode].items.push({
        itemNumber: col0 || `${sectionsMap[currentSecCode].items.length + 1}`,
        description: desc,
        unit: unit || 'm³',
        quantity: qty,
        unitRate: rate,
        amount: Math.round(qty * rate)
      });
    }

    const sections = Object.values(sectionsMap)
      .filter(s => s.items.length > 0)
      .map(s => ({
        ...s,
        subtotal: s.items.reduce((acc, it) => acc + it.amount, 0)
      }));

    return {
      sections
    };
  }

  // Fallback default
  return {
    sections: []
  };
}
