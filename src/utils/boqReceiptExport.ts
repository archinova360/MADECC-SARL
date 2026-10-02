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
  BorderStyle
} from 'docx';
import { generateQrCodeBase64, generateBarcodeBase64 } from './codeGenerator';
import { numberToWords, numberToWordsFr } from './numberToWords';
import { generateVerificationUrl, resolvePaymentDomain } from './paymentDomain';

export interface BoqReceiptData {
  receiptNo: string;
  transactionId: string;
  boqReference: string;
  projectName: string;
  clientName: string;
  clientEmail?: string;
  location?: string;
  contractType?: string;
  totalAmount: number;
  paidAmount: number;
  currency?: string;
  paymentMethod: string;
  payerPhone?: string;
  paidAt: string;
  status: 'PAID' | 'COMPLETED' | 'CERTIFIED';
  language?: 'en' | 'fr';
  domainUsed?: string;
  verificationToken?: string;
  memo?: string;
}

export async function generateBoqReceiptPdf(
  receipt: BoqReceiptData,
  domainOverride?: string
): Promise<{ pdf: jsPDF; filename: string }> {
  const isFrench = receipt.language === 'fr';
  const currency = receipt.currency || 'XAF';
  const resolvedDomain = domainOverride || receipt.domainUsed || resolvePaymentDomain().activeDomain;
  const verificationToken = receipt.verificationToken || `VT-${receipt.receiptNo.replace(/[^a-zA-Z0-9]/g, '')}`;
  const verifyUrl = generateVerificationUrl(verificationToken, receipt.receiptNo, resolvedDomain);

  // Generate QR & Barcode Base64
  const qrBase64 = await generateQrCodeBase64(verifyUrl, { width: 140 });
  const barcodeBase64 = generateBarcodeBase64(receipt.receiptNo, { width: 2, height: 40 });

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const w = doc.internal.pageSize.getWidth();
  const padding = 15;
  const contentW = w - (padding * 2);
  let currentY = padding;

  // 1. Top Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(padding, currentY, contentW, 26, 'F');
  doc.setFillColor(217, 119, 6); // Amber-600 stripe
  doc.rect(padding, currentY + 26, contentW, 1.5, 'F');

  // Company Emblem Logo
  doc.setFillColor(217, 119, 6);
  doc.roundedRect(padding + 4, currentY + 4, 18, 18, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('M', padding + 13, currentY + 16, { align: 'center' });

  // Company Info
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('MADECC GROUP SARL', padding + 26, currentY + 10);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(251, 191, 36); // Amber-400
  doc.text(
    isFrench
      ? 'Direction Financière & Comptabilité des Marchés de Génie Civil'
      : 'Corporate Financial Directorate & Construction Contract Accounting',
    padding + 26,
    currentY + 16
  );

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(7);
  doc.text(
    `Yaoundé & Douala, Cameroon | Domain: ${resolvedDomain.replace(/^https?:\/\//, '')}`,
    padding + 26,
    currentY + 21
  );

  // Right Title Box
  const titleBoxW = 62;
  const titleBoxX = w - padding - titleBoxW - 4;
  doc.setFillColor(30, 41, 59);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(titleBoxX, currentY + 4, titleBoxW, 18, 2, 2, 'FD');

  doc.setTextColor(251, 191, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    isFrench ? 'QUITTANCE OFFICIELLE DE PAIEMENT' : 'OFFICIAL PAYMENT RECEIPT',
    titleBoxX + (titleBoxW / 2),
    currentY + 10,
    { align: 'center' }
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`N°: ${receipt.receiptNo}`, titleBoxX + (titleBoxW / 2), currentY + 15, { align: 'center' });

  currentY += 34;

  // 2. Paid Status Stamp Banner
  doc.setFillColor(240, 253, 244); // Green-50
  doc.setDrawColor(34, 197, 94); // Green-500
  doc.roundedRect(padding, currentY, contentW, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(22, 101, 52); // Green-800
  doc.text(
    isFrench ? 'PAIEMENT CONFIRMÉ & RECEVABILITÉ VALIDÉE' : 'PAYMENT CONFIRMED & DISCHARGE VALIDATED',
    padding + 6,
    currentY + 6.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(21, 128, 61);
  doc.text(
    `${isFrench ? 'Transaction ID' : 'Transaction Ref'}: ${receipt.transactionId} | Gateway: ${receipt.paymentMethod} | Date: ${receipt.paidAt}`,
    padding + 6,
    currentY + 11
  );

  // Verification Badge on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `Status: ${receipt.status} ✓`,
    w - padding - 6,
    currentY + 8.5,
    { align: 'right' }
  );

  currentY += 19;

  // 3. Client & Project Details Table
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(padding, currentY, contentW, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  // Left Column
  const halfContentW = contentW / 2;
  doc.text(isFrench ? 'DONNÉES DU MARCHÉ / PROJET :' : 'TENDER / PROJECT DETAILS:', padding + 5, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${isFrench ? 'Projet' : 'Project'}: ${receipt.projectName}`, padding + 5, currentY + 12);
  doc.text(`${isFrench ? 'Réf. Devis BOQ' : 'BOQ Ref'}: ${receipt.boqReference}`, padding + 5, currentY + 17);
  doc.text(`${isFrench ? 'Type de Marché' : 'Contract Type'}: ${receipt.contractType || 'UNIT_RATE'}`, padding + 5, currentY + 22);
  doc.text(`${isFrench ? 'Site / Localisation' : 'Location'}: ${receipt.location || 'Douala / Yaoundé, Cameroun'}`, padding + 5, currentY + 27);
  doc.text(`Domain Host: ${resolvedDomain}`, padding + 5, currentY + 32);

  // Right Column
  const col2X = padding + halfContentW + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(isFrench ? 'CLIENT / MAÎTRE D\'OUVRAGE :' : 'CLIENT / PAYER INFORMATION:', col2X, currentY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`${isFrench ? 'Nom / Raison Sociale' : 'Client Name'}: ${receipt.clientName}`, col2X, currentY + 12);
  if (receipt.clientEmail) doc.text(`Email: ${receipt.clientEmail}`, col2X, currentY + 17);
  if (receipt.payerPhone) doc.text(`${isFrench ? 'Téléphone' : 'Payer Phone'}: ${receipt.payerPhone}`, col2X, currentY + 22);
  doc.text(`${isFrench ? 'Mode de Règlement' : 'Payment Mode'}: ${receipt.paymentMethod}`, col2X, currentY + 27);
  doc.text(`${isFrench ? 'Date de Règlement' : 'Payment Date'}: ${receipt.paidAt}`, col2X, currentY + 32);

  currentY += 42;

  // 4. Financial Breakdown Table
  doc.setFillColor(15, 23, 42);
  doc.rect(padding, currentY, contentW, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(255, 255, 255);

  doc.text(isFrench ? 'DÉSIGNATION DE L\'OPÉRATION' : 'PAYMENT DESCRIPTION', padding + 4, currentY + 5);
  doc.text(isFrench ? 'CONTRAT TOTAL' : 'CONTRACT TOTAL', padding + 105, currentY + 5, { align: 'right' });
  doc.text(isFrench ? 'MONTANT RÉGLÉ' : 'AMOUNT PAID', w - padding - 4, currentY + 5, { align: 'right' });

  currentY += 7;

  // Row 1
  doc.setFillColor(255, 255, 255);
  doc.rect(padding, currentY, contentW, 14, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.line(padding, currentY + 14, w - padding, currentY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const memoText = receipt.memo || (isFrench
    ? `Règlement Officiel des Pièces de Marché & Devis Quantitatif (${receipt.boqReference})`
    : `Official Tender Document Fees & Down-payment Discharge (${receipt.boqReference})`);
  doc.text(memoText, padding + 4, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    isFrench
      ? `Validation irrévocable enregistrée sur le serveur sécurisé: ${resolvedDomain}`
      : `Authenticated transaction verified against canonical ledger at: ${resolvedDomain}`,
    padding + 4,
    currentY + 11
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${receipt.totalAmount.toLocaleString()} ${currency}`, padding + 105, currentY + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald-500
  doc.setFontSize(9);
  doc.text(`${receipt.paidAmount.toLocaleString()} ${currency}`, w - padding - 4, currentY + 8, { align: 'right' });

  currentY += 18;

  // 5. Total Banner Card
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(padding, currentY, contentW, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(isFrench ? 'MONTANT TOTAL ACQUITTÉ :' : 'TOTAL AMOUNT DISCHARGED:', padding + 6, currentY + 7);

  doc.setFontSize(14);
  doc.setTextColor(180, 83, 9); // Amber-700
  doc.text(`${receipt.paidAmount.toLocaleString()} ${currency}`, padding + 6, currentY + 16);

  // Amount in Words on Right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text(isFrench ? 'MONTANT EN TOUTES LETTRES :' : 'AMOUNT IN FULL WORDS:', padding + 60, currentY + 7);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  const wordsStr = isFrench
    ? numberToWordsFr(receipt.paidAmount, currency)
    : numberToWords(receipt.paidAmount, currency);
  const splitWords = doc.splitTextToSize(wordsStr, contentW - 65);
  doc.text(splitWords, padding + 60, currentY + 12);

  currentY += 28;

  // 6. Security Authentication & QR Seal Section
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(padding, currentY, contentW, 46, 2, 2, 'FD');

  // QR Code
  if (qrBase64) {
    try {
      doc.addImage(qrBase64, 'PNG', padding + 4, currentY + 4, 38, 38);
    } catch {
      // ignore
    }
  }

  // QR Info
  const qrTextX = padding + 46;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(isFrench ? 'CERTIFICAT NUMÉRIQUE & VÉRIFICATION EN LIGNE' : 'DIGITAL CERTIFICATE & REAL-TIME VERIFICATION', qrTextX, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    isFrench
      ? `Scannez ce QR Code ou accédez au portail officiel pour vérifier l'authenticité de cette quittance :`
      : `Scan this QR Code or open the official portal to verify this receipt's authenticity on the ledger:`,
    qrTextX,
    currentY + 14
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(217, 119, 6);
  doc.text(verifyUrl.length > 55 ? verifyUrl.slice(0, 52) + '...' : verifyUrl, qrTextX, currentY + 19);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text(`Token: ${verificationToken}`, qrTextX, currentY + 24);
  doc.text(
    isFrench
      ? `Domaine validé : ${resolvedDomain} | Protocole SSL 256-bit crypté`
      : `Registered Domain: ${resolvedDomain} | 256-bit SSL Tamper-Proof Record`,
    qrTextX,
    currentY + 29
  );

  // Barcode
  if (barcodeBase64) {
    try {
      doc.addImage(barcodeBase64, 'PNG', qrTextX, currentY + 32, 55, 10);
    } catch {
      // ignore
    }
  }

  // Right Signatures & Stamp
  const sigX = w - padding - 48;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text(isFrench ? 'DIRECTION FINANCIÈRE' : 'CHIEF FINANCIAL OFFICER', sigX, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('MADECC Group SARL', sigX, currentY + 13);
  doc.text('Dr. Richard Mbida', sigX, currentY + 18);

  // Circular Seal
  const sealX = sigX + 18;
  const sealY = currentY + 32;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.4);
  doc.circle(sealX, sealY, 10);
  doc.circle(sealX, sealY, 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.setTextColor(180, 83, 9);
  doc.text('MADECC GROUP', sealX, sealY - 2.5, { align: 'center' });
  doc.text('SARL', sealX, sealY + 0.5, { align: 'center' });
  doc.text('ACQUITTÉ / PAID', sealX, sealY + 3.8, { align: 'center' });

  currentY += 52;

  // 7. Statutory Footer Notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  const footerTerms = isFrench
    ? [
        '1. La présente quittance certifie le règlement libératoire de la somme susmentionnée au profit de MADECC Group SARL.',
        '2. Document électronique opposable généré conformément aux dispositions de l\'Acte Uniforme OHADA et du Code Fiscal Camerounais.',
        '3. En cas de litige, seule la version archivée sur le portail sécurisé fait foi.'
      ]
    : [
        '1. This receipt confirms full legal discharge and receipt of funds by MADECC Group SARL for the specified tender.',
        '2. Official electronic document emitted under OHADA Uniform Commercial Code & Cameroon General Tax Code standards.',
        '3. In case of verification, the canonical tamper-proof ledger on the registered server shall prevail.'
      ];

  footerTerms.forEach((ft, idx) => {
    doc.text(ft, padding, currentY + (idx * 3.5));
  });

  const cleanProj = (receipt.projectName || 'BOQ').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `MADECC_Receipt_${receipt.receiptNo}_${cleanProj}.pdf`;

  return { pdf: doc, filename };
}

export async function generateBoqReceiptDocx(
  receipt: BoqReceiptData,
  domainOverride?: string
): Promise<{ blob: Blob; filename: string }> {
  const isFrench = receipt.language === 'fr';
  const currency = receipt.currency || 'XAF';
  const resolvedDomain = domainOverride || receipt.domainUsed || resolvePaymentDomain().activeDomain;
  const verificationToken = receipt.verificationToken || `VT-${receipt.receiptNo.replace(/[^a-zA-Z0-9]/g, '')}`;
  const verifyUrl = generateVerificationUrl(verificationToken, receipt.receiptNo, resolvedDomain);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({ text: 'MADECC GROUP SARL', bold: true, size: 30, color: 'D97706' })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: isFrench
                  ? 'DIRECTION FINANCIÈRE & COMPTABILITÉ DES MARCHÉS DE GÉNIE CIVIL'
                  : 'CORPORATE FINANCIAL DIRECTORATE & TENDER ACCOUNTING',
                bold: true,
                size: 17,
                color: '0F172A'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: `Yaoundé & Douala, Cameroon | Server: ${resolvedDomain}`,
                italics: true,
                size: 15,
                color: '64748B'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: isFrench ? 'QUITTANCE OFFICIELLE DE PAIEMENT DU DEVIS (BOQ)' : 'OFFICIAL BOQ PAYMENT RECEIPT & DISCHARGE VOUCHER',
                bold: true,
                size: 22,
                color: '0F172A'
              })
            ]
          }),

          // Status Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    shading: { fill: 'F0FDF4' },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: '22C55E' },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: '22C55E' },
                      left: { style: BorderStyle.SINGLE, size: 1, color: '22C55E' },
                      right: { style: BorderStyle.SINGLE, size: 1, color: '22C55E' }
                    },
                    children: [
                      new Paragraph({
                        spacing: { before: 80, after: 80 },
                        children: [
                          new TextRun({
                            text: `STATUS: ${receipt.status} — ${isFrench ? 'PAIEMENT VALIDÉ' : 'PAYMENT VALIDATED'}`,
                            bold: true,
                            size: 18,
                            color: '15803D'
                          }),
                          new TextRun({
                            text: ` | Ref: ${receipt.receiptNo} | Txn: ${receipt.transactionId} | Gateway: ${receipt.paymentMethod}`,
                            size: 15,
                            color: '166534'
                          })
                        ]
                      })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ spacing: { before: 140, after: 80 }, children: [] }),

          // Details Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: isFrench ? 'DÉTAILS DU MARCHÉ' : 'TENDER DETAILS', bold: true, size: 16 })] }),
                      new Paragraph({ children: [new TextRun({ text: `${isFrench ? 'Projet' : 'Project'}: ${receipt.projectName}`, size: 15 })] }),
                      new Paragraph({ children: [new TextRun({ text: `BOQ Ref: ${receipt.boqReference}`, size: 15 })] }),
                      new Paragraph({ children: [new TextRun({ text: `${isFrench ? 'Site' : 'Location'}: ${receipt.location || 'Douala/Yaoundé'}`, size: 15 })] })
                    ]
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({ children: [new TextRun({ text: isFrench ? 'CLIENT / PAYEUR' : 'CLIENT / PAYER', bold: true, size: 16 })] }),
                      new Paragraph({ children: [new TextRun({ text: `${isFrench ? 'Client' : 'Client'}: ${receipt.clientName}`, size: 15 })] }),
                      new Paragraph({ children: [new TextRun({ text: `Email: ${receipt.clientEmail || 'N/A'}`, size: 15 })] }),
                      new Paragraph({ children: [new TextRun({ text: `${isFrench ? 'Date de Paiement' : 'Payment Date'}: ${receipt.paidAt}`, size: 15 })] })
                    ]
                  })
                ]
              })
            ]
          }),

          new Paragraph({ spacing: { before: 180, after: 80 }, children: [] }),

          // Payment Summary Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    shading: { fill: '0F172A' },
                    children: [new Paragraph({ children: [new TextRun({ text: isFrench ? 'DESCRIPTION DU PAIEMENT' : 'PAYMENT DESCRIPTION', bold: true, color: 'FFFFFF', size: 15 })] })]
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: '0F172A' },
                    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: isFrench ? 'MONTANT REÇU' : 'AMOUNT RECEIVED', bold: true, color: 'FFFFFF', size: 15 })] })]
                  })
                ]
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: `${receipt.projectName} (${receipt.boqReference})`, bold: true, size: 15 })] }),
                      new Paragraph({ children: [new TextRun({ text: `Verified via domain: ${resolvedDomain}`, italics: true, size: 13, color: '64748B' })] })
                    ]
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `${receipt.paidAmount.toLocaleString()} ${currency}`, bold: true, size: 18, color: '059669' })] })
                    ]
                  })
                ]
              })
            ]
          }),

          // Amount in Words
          new Paragraph({
            spacing: { before: 140, after: 140 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: isFrench ? 'MONTANT EN TOUTES LETTRES: ' : 'AMOUNT IN WORDS: ', bold: true, size: 15 }),
              new TextRun({
                text: isFrench ? numberToWordsFr(receipt.paidAmount, currency) : numberToWords(receipt.paidAmount, currency),
                italics: true,
                bold: true,
                size: 15,
                color: 'D97706'
              })
            ]
          }),

          // Verification & Sign-off Block
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({ text: isFrench ? 'AUTHENTIFICATION ET VISA DE L\'INGÉNIEUR FINANCIER' : 'AUTHENTICATION & STATUTORY CFO SEAL', bold: true, size: 16 })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Verification URL: ${verifyUrl}`, size: 14, color: '2563EB' })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `Digital Token: ${verificationToken} | Domain: ${resolvedDomain}`, size: 13, color: '64748B' })
            ]
          })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const cleanProj = (receipt.projectName || 'BOQ').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `MADECC_Receipt_${receipt.receiptNo}_${cleanProj}.docx`;

  return { blob, filename };
}
