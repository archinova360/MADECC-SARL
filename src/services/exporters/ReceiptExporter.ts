import { jsPDF } from 'jspdf';
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
import { ReceiptExportModel } from '../../types/receiptTypes.ts';
import { generateQrCodeBase64, generateBarcodeBase64 } from '../../utils/codeGenerator.ts';

function sanitizeFilename(str: string): string {
  return (str || 'Receipt').replace(/[^a-zA-Z0-9_-]/g, '_');
}

export class ReceiptExporter {
  /**
   * Export Digital Receipt to A4 PDF with 100% fidelity to the canonical record
   */
  public static async exportPDF(model: ReceiptExportModel): Promise<string> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const w = 210;
    const h = 297;
    const padding = 15;
    const currency = model.currency || 'XAF';

    // 1. Header: MADECC GROUP SARL
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text('MADECC GROUP SARL', padding, padding + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Civil Engineering, Logistics & Development', padding, padding + 8.5);
    doc.text('Yaoundé Mbankolo, Cameroon', padding, padding + 12);
    if (model.clientEmail) {
      doc.text(`Client Reference Contact: ${model.clientEmail}`, padding, padding + 15.5);
    }

    // 2. Receipt Title Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.rect(w - padding - 65, padding, 65, 22, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text('OFFICIAL RECEIPT', w - padding - 61, padding + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`No: ${model.receiptNo}`, w - padding - 61, padding + 10.5);
    doc.text(`Date: ${model.date || model.signedAt.split('T')[0]}`, w - padding - 61, padding + 15);
    doc.text(`Status: ${model.status || 'ISSUED'} (v${model.version || '1.0'})`, w - padding - 61, padding + 19.5);

    // 3. Horizontal Amber Accent Divider
    let currentY = padding + 26;
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.6);
    doc.line(padding, currentY, w - padding, currentY);

    // 4. Client and Transaction Details
    currentY += 8;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('RECEIVED FROM:', padding, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(model.clientName || 'Valued Client Profile', padding + 38, currentY);

    if (model.clientNiu) {
      currentY += 4.5;
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Client Tax ID / NIU: ${model.clientNiu}`, padding + 38, currentY);
    }

    currentY += 7;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('PAYMENT CHANNEL:', padding, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(model.receiptMethod || 'Direct Deposit / Wire', padding + 38, currentY);

    currentY += 7;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('ALLOCATED PROJECT:', padding, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(model.projectName || 'General Construction Services', padding + 38, currentY);

    // 5. Transaction Particulars Table Header
    currentY += 12;
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(padding, currentY, w - (padding * 2), 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TRANSACTION PARTICULARS', padding + 4, currentY + 5.5);
    doc.text('TOTAL EXCLUDING VAT', w - padding - 45, currentY + 5.5);

    // 6. Transaction Particulars Row
    currentY += 8;
    doc.setFillColor(248, 250, 252);
    doc.rect(padding, currentY, w - (padding * 2), 16, 'F');

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const memoText = model.memo || 'General infrastructure development & mobilization milestone';
    const splitMemo = doc.splitTextToSize(memoText, w - padding * 2 - 55);
    doc.text(splitMemo, padding + 4, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${model.receiptAmount.toLocaleString()} ${currency}`, w - padding - 45, currentY + 7);

    // 7. Totals Calculation Box
    currentY += 20;
    doc.setDrawColor(226, 232, 240);
    doc.line(w - padding - 75, currentY, w - padding, currentY);

    if (model.invoiceTotalAmount > 0) {
      currentY += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL INVOICE AMOUNT:', w - padding - 75, currentY);
      doc.text(`${model.invoiceTotalAmount.toLocaleString()} ${currency}`, w - padding - 30, currentY);
    }

    currentY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('SUBTOTAL PAID:', w - padding - 75, currentY);
    doc.text(`${model.receiptAmount.toLocaleString()} ${currency}`, w - padding - 30, currentY);

    currentY += 4.5;
    doc.text(`TVA TAX (${model.taxRate}%):`, w - padding - 75, currentY);
    doc.text(`${model.taxAmount.toLocaleString()} ${currency}`, w - padding - 30, currentY);

    currentY += 6;
    doc.setFillColor(245, 158, 11);
    doc.rect(w - padding - 75, currentY - 3.5, 75, 6, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('TOTAL PAID THIS RECEIPT:', w - padding - 73, currentY + 0.5);
    doc.text(`${model.totalPaidThisReceipt.toLocaleString()} ${currency}`, w - padding - 30, currentY + 0.5);

    // 8. Remaining Balance Badge
    currentY += 8;
    if (model.isPaidInFull) {
      doc.setFillColor(34, 197, 94); // Green
      doc.rect(w - padding - 75, currentY - 3.5, 75, 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('REMAINING BALANCE: PAID IN FULL', w - padding - 73, currentY + 0.8);
    } else {
      doc.setFillColor(254, 242, 242); // Red-50
      doc.setDrawColor(239, 68, 68);
      doc.rect(w - padding - 75, currentY - 3.5, 75, 6.5, 'FD');
      doc.setTextColor(185, 28, 28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('OUTSTANDING BALANCE:', w - padding - 73, currentY + 0.8);
      doc.text(`${model.remainingBalance.toLocaleString()} ${currency}`, w - padding - 30, currentY + 0.8);
    }

    // 9. Authorized Finance Desk Box
    currentY += 20;
    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('AUTHORIZED FINANCE DESK', padding, currentY);

    currentY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(model.signatoryName || 'Mm Violet Fuh Ngwa', padding, currentY);

    if (model.isDigitallySigned) {
      doc.setDrawColor(16, 185, 129);
      doc.setFillColor(240, 253, 250);
      doc.rect(padding, currentY + 3, 68, 15, 'FD');
      doc.setTextColor(4, 120, 87);
      doc.setFont('courier', 'bold');
      doc.setFontSize(8);
      doc.text(`Authorized: /${model.authorizedOfficer || 'Kasah Rodrick Reboya'}/`, padding + 3, currentY + 8);

      if (model.drawnSignatureBase64) {
        try {
          doc.addImage(model.drawnSignatureBase64, 'PNG', padding + 44, currentY + 4, 20, 8);
        } catch (err) {
          console.warn('Could not render drawn signature in PDF:', err);
        }
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.text('STAMPED & FILED IN FISCAL LEDGER', padding + 3, currentY + 13);
    } else {
      doc.setDrawColor(239, 68, 68);
      doc.setFillColor(254, 242, 242);
      doc.rect(padding, currentY + 3, 68, 15, 'FD');
      doc.setTextColor(185, 28, 28);
      doc.setFontSize(7);
      doc.text('AWAITING CFO AUTHORIZATION', padding + 3, currentY + 11);
    }

    // 10. Public Verification & Fiscal Stamp Block
    if (model.verificationToken) {
      currentY += 24;
      doc.setDrawColor(245, 158, 11);
      doc.setFillColor(254, 252, 232); // Amber-50
      doc.rect(padding, currentY, w - padding * 2, 24, 'FD');

      const qrImg = model.qrCodeBase64 || (typeof window !== 'undefined' ? await generateQrCodeBase64(`${window.location.origin}/?verify=${model.verificationToken}`) : '');
      if (qrImg) {
        try {
          doc.addImage(qrImg, 'PNG', padding + 3, currentY + 3, 18, 18);
        } catch (err) {
          console.warn('Could not render QR code in PDF:', err);
        }
      }

      const barcodeImg = model.barcodeBase64 || (model.receiptNo ? generateBarcodeBase64(model.receiptNo) : '');
      if (barcodeImg) {
        try {
          doc.addImage(barcodeImg, 'PNG', w - padding - 48, currentY + 4, 45, 15);
        } catch (err) {
          console.warn('Could not render Barcode in PDF:', err);
        }
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text('PUBLIC VERIFICATION & FISCAL STAMP', padding + 24, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text('Scan the QR to verify validity or scan Barcode for physical inventory:', padding + 24, currentY + 9);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(245, 158, 11);
      doc.setFontSize(6.5);
      doc.text(model.verificationUrl || `https://madeccgroup.online/?verify=${model.verificationToken}`, padding + 24, currentY + 13);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(5.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Verification Key: ${model.verificationToken}`, padding + 24, currentY + 17);
    }

    // 11. Security Watermark and Fiscal Notice
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text('This payment receipt acts as proof of mobilization under legal guidelines of the', padding, h - padding - 4);
    doc.text('General Tax Code of the Republic of Cameroon (Code Général des Impôts). Sec-ID verified.', padding, h - padding - 1.5);

    const filename = `MADECC_Digital_Receipt_${sanitizeFilename(model.receiptNo)}_A4.pdf`;
    doc.save(filename);
    return filename;
  }

  /**
   * Export Digital Receipt to Editable Word Document (.DOCX)
   */
  public static async exportDOCX(model: ReceiptExportModel): Promise<string> {
    const currency = model.currency || 'XAF';

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
            // Header
            new Paragraph({
              text: 'MADECC GROUP SARL',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'Civil Engineering, Logistics & Development — Yaoundé Mbankolo, Cameroon',
                  italics: true,
                  size: 18,
                  color: '64748B',
                }),
              ],
            }),
            new Paragraph({
              text: '',
              spacing: { after: 200 },
            }),

            // Title Box Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 60, type: WidthType.PERCENTAGE },
                      borders: {
                        top: { style: BorderStyle.NONE },
                        bottom: { style: BorderStyle.NONE },
                        left: { style: BorderStyle.NONE },
                        right: { style: BorderStyle.NONE },
                      },
                      children: [
                        new Paragraph({
                          children: [
                            new TextRun({ text: 'OFFICIAL FISCAL RECEIPT', bold: true, size: 24, color: 'D97706' }),
                          ],
                        }),
                        new Paragraph({
                          children: [
                            new TextRun({ text: `Project: ${model.projectName}`, size: 20, bold: true }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 40, type: WidthType.PERCENTAGE },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                        bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                        left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                        right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
                      },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({ text: `Receipt No: ${model.receiptNo}`, bold: true, size: 18 }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({ text: `Date: ${model.date || model.signedAt.split('T')[0]}`, size: 18 }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({ text: `Status: ${model.status || 'ISSUED'} (v${model.version || '1.0'})`, size: 16, color: '166534' }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // Overview details
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Client Name', bold: true, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: model.clientName || 'N/A', size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Client Tax ID / NIU', bold: true, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: model.clientNiu || 'N/A', size: 18 })] })],
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Payment Channel', bold: true, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: model.receiptMethod || 'Cash Desk', size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'Client Email', bold: true, size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: model.clientEmail || 'N/A', size: 18 })] })],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // Transaction Particulars Table
            new Paragraph({
              text: 'Transaction Breakdown & Financial Valuation',
              heading: HeadingLevel.HEADING_2,
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 70, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ children: [new TextRun({ text: 'Particulars / Description', bold: true, size: 18, color: 'FFFFFF' })] })],
                      shading: { fill: '0F172A' },
                    }),
                    new TableCell({
                      width: { size: 30, type: WidthType.PERCENTAGE },
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'Amount', bold: true, size: 18, color: 'FFFFFF' })] })],
                      shading: { fill: '0F172A' },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: model.memo || 'General infrastructure development & mobilization milestone', size: 18 })] })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${model.receiptAmount.toLocaleString()} ${currency}`, size: 18, bold: true })] })],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 200 } }),

            // Financial Summary Totals
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                ...(model.invoiceTotalAmount > 0
                  ? [
                      new TableRow({
                        children: [
                          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Total Invoice Amount:', bold: true, size: 18 })] })] }),
                          new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${model.invoiceTotalAmount.toLocaleString()} ${currency}`, size: 18, bold: true })] })] }),
                        ],
                      }),
                    ]
                  : []),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Subtotal Paid (Excl. Tax):', size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${model.receiptAmount.toLocaleString()} ${currency}`, size: 18 })] })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `TVA Tax (${model.taxRate}%):`, size: 18 })] })] }),
                    new TableCell({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${model.taxAmount.toLocaleString()} ${currency}`, size: 18 })] })] }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'TOTAL PAID THIS RECEIPT:', bold: true, size: 20, color: '0F172A' })] })],
                      shading: { fill: 'FDE68A' },
                    }),
                    new TableCell({
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${model.totalPaidThisReceipt.toLocaleString()} ${currency}`, bold: true, size: 20, color: '0F172A' })] })],
                      shading: { fill: 'FDE68A' },
                    }),
                  ],
                }),
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: 'REMAINING BALANCE:', bold: true, size: 18, color: model.isPaidInFull ? '15803D' : 'B91C1C' })] })],
                      shading: { fill: model.isPaidInFull ? 'DCFCE7' : 'FEE2E2' },
                    }),
                    new TableCell({
                      children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: model.isPaidInFull ? 'PAID IN FULL' : `${model.remainingBalance.toLocaleString()} ${currency}`, bold: true, size: 18, color: model.isPaidInFull ? '15803D' : 'B91C1C' })] })],
                      shading: { fill: model.isPaidInFull ? 'DCFCE7' : 'FEE2E2' },
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: '', spacing: { after: 300 } }),

            // Signatures & Public Verification
            new Paragraph({
              text: 'Authorized Finance Sign-Off & Verification Ledger',
              heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Authorized Signatory: ${model.signatoryName}`, size: 18 }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Authorized Officer Code: /${model.authorizedOfficer}/`, bold: true, size: 18 }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Public Verification Key: ${model.verificationToken}`, size: 16, italics: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Verification URL: ${model.verificationUrl || `https://madeccgroup.online/?verify=${model.verificationToken}`}`, size: 16, color: '2563EB' }),
              ],
            }),
            new Paragraph({ text: '', spacing: { after: 200 } }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'This payment receipt acts as proof of mobilization under legal guidelines of the General Tax Code of the Republic of Cameroon (Code Général des Impôts).',
                  size: 16,
                  italics: true,
                  color: '94A3B8',
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `MADECC_Digital_Receipt_${sanitizeFilename(model.receiptNo)}.docx`;
    saveAs(blob, filename);
    return filename;
  }
}
