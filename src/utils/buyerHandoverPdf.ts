import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { isReceiptPaid, isCurrentUserAdmin, BUYER_HANDOVER_MANUAL_RECEIPT_NO } from './paymentDomain';

export interface BuyerHandoverOptions {
  buyerName?: string;
  buyerCompany?: string;
  buyerDomain?: string;
  sellerName?: string;
  sellerEmail?: string;
  bypassPaymentGate?: boolean;
}

export function generateBuyerHandoverManualPdf(options: BuyerHandoverOptions = {}): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const darkNavy = [15, 23, 42];
  const deepBlue = [30, 58, 138];
  const amberGold = [217, 119, 6];
  const emeraldGreen = [16, 185, 129];
  const lightBg = [248, 250, 252];
  const borderGray = [226, 232, 240];

  const buyerCompanyLabel = options.buyerCompany || '[New Owner Brand / Company Name]';
  const sellerEmailLabel = options.sellerEmail || 'kreboya603@gmail.com';

  const drawHeaderFooter = (pageDoc: jsPDF, pageNum: number) => {
    pageDoc.setFillColor(deepBlue[0], deepBlue[1], deepBlue[2]);
    pageDoc.rect(0, 0, pageWidth, 5, 'F');

    pageDoc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
    pageDoc.rect(0, 5, pageWidth, 1.5, 'F');

    pageDoc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pageDoc.setLineWidth(0.4);
    pageDoc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pageDoc.setFont('helvetica', 'normal');
    pageDoc.setFontSize(8);
    pageDoc.setTextColor(100, 116, 139);
    pageDoc.text(
      'OFFICIAL WEBSITE ACQUISITION & BRAND CUSTOMIZATION HANDOVER MANUAL (A4)',
      margin,
      pageHeight - 7
    );
    pageDoc.text(
      `Handover Support: ${sellerEmailLabel} | Page ${pageNum} of 3`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE OVERVIEW & NO-CODE ADMIN CMS BRAND CUSTOMIZATION
  // =========================================================================
  drawHeaderFooter(doc, 1);

  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.roundedRect(margin, 12, contentWidth, 38, 3, 3, 'F');

  doc.setFillColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.rect(margin + 2, 14, 2, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(255, 255, 255);
  doc.text('WEBSITE BUYER HANDOVER & BRAND CUSTOMIZATION GUIDE', margin + 8, 22);

  doc.setFontSize(10.5);
  doc.setTextColor(245, 158, 11);
  doc.text('COMPLETE BLUEPRINT FOR REBRANDING, PAYMENTS, SMTP & DOMAIN TRANSFER', margin + 8, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Prepared for New Website Owner: ${buyerCompanyLabel} | Architecture: React 19 + TypeScript + Express + Cloud SaaS`,
    margin + 8,
    36
  );
  doc.text(
    `Handover Edition: 2026 Master Release | Date: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`,
    margin + 8,
    42
  );

  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('1. Welcome New Owner — What You Have Purchased', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(51, 65, 85);
  const introText =
    'Congratulations on acquiring this turnkey Construction, Civil Engineering, Enterprise ERP & Multi-Tenant Cloud SaaS ' +
    'web platform. This document shows you the exact sections—both inside the No-Code Admin Dashboard and in the clean ' +
    'configuration files—that you will customize to rebrand the entire platform for your own company name, logo, colors, ' +
    'Mobile Money / Orange Money numbers, SMTP email address, and domain name.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.3 + 4;

  // Section 2: No-Code Admin Dashboard Brand Customization
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('2. No-Code Brand Customization via Admin Dashboard (#admin)', margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 7.8,
      cellPadding: 2.2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 'auto' }
    },
    head: [['Brand Element to Customize', 'Where in Admin Dashboard', 'What to Update for Your Brand']],
    body: [
      [
        'Company Name, Tagline & Legal Info',
        'Admin > CMS & Site Settings > General Identity',
        'Replace "MADECC GROUP", tagline, developer name, RCCM registration number, and NIU tax ID with your company details.'
      ],
      [
        'Logo, Favicon & Brand Colors',
        'Admin > CMS & Site Settings > Theme & Branding',
        'Upload/paste your Logo URL, Favicon URL, and choose your Primary & Accent Hex colors (updates CSS variables site-wide).'
      ],
      [
        'Phones, WhatsApp & Office Addresses',
        'Admin > CMS & Site Settings > Contact & Offices',
        'Update primary/secondary phone numbers, WhatsApp dispatch numbers, headquarters address, and business hours.'
      ],
      [
        'Hero Video, Banners & Page Copy',
        'Admin > Page Builder / Hero Banners',
        'Replace homepage hero headlines, background video reel URL, carousel slides, and SEO meta titles/descriptions.'
      ],
      [
        'Services, Portfolio & Tenders',
        'Admin > Services / Projects / Tenders Tabs',
        'Add, edit, or delete engineering services, portfolio projects, CAD blueprint galleries, and open procurement tenders.'
      ],
      [
        'Social Media Channels (8 Links)',
        'Admin > CMS & Site Settings > Social Channels',
        'Replace Facebook, Instagram, LinkedIn, YouTube, X/Twitter, TikTok, and Pinterest URLs with your brand profiles.'
      ],
      [
        'Non-Intrusive Maintenance Mode',
        'Admin > Command Center > Maintenance Hub',
        'Toggle scheduled maintenance notice ON/OFF without blocking visitors, and dispatch SMTP alerts to your admin email.'
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(6, 95, 70);
  doc.text('FAST REBRANDING TIP: MULTI-TENANT WHITE-LABEL ENGINE INCLUDED', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(20, 83, 45);
  const tipText =
    'This website also includes a built-in Multi-Tenant SaaS Engine (TenantSwitcher & SuperAdmin). You can either operate the ' +
    'entire website for your own single brand OR rent out isolated workspaces to other construction companies for recurring ' +
    'monthly/annual subscription revenue!';
  doc.text(doc.splitTextToSize(tipText, contentWidth - 8), margin + 4, y + 11.5);

  // =========================================================================
  // PAGE 2: PAYMENT GATEWAY, PRICING, SMTP & SOURCE CODE CUSTOMIZATION MAP
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 2);

  y = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('3. Customizing Payment Numbers, Document Fees & Official Domain', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Open file: src/utils/paymentDomain.ts (lines 1-45) to replace payment numbers, fee amount, domain, and admin SMTP email:',
    margin,
    y
  );
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2
    },
    bodyStyles: {
      fontSize: 7.6,
      cellPadding: 2,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { cellWidth: 44 },
      2: { cellWidth: 'auto' }
    },
    head: [['Constant / Property', 'Current Default Value', 'How the Buyer Customizes It']],
    body: [
      [
        'TARGET_OFFICIAL_DOMAIN',
        'https://madeccgroup.online',
        'Change to your new production domain name (e.g., https://yourbrand.com). Used in QR codes and payment links.'
      ],
      [
        'STANDARD_RECEIPT_FEE_XAF',
        '2199 (XAF)',
        'Change to any fee you want clients to pay before unlocking PDF receipts, BoQs, and document downloads.'
      ],
      [
        'ADMIN_SMTP_USER_EMAIL',
        'kreboya603@gmail.com',
        'Change to your primary admin email address that receives payment confirmations & maintenance dispatches.'
      ],
      [
        'OFFICIAL_PAYMENT_CONFIG.mtnMomoNumbers',
        "['671063511', '683316486']",
        'Replace with your own MTN Mobile Money merchant or personal receiver numbers.'
      ],
      [
        'OFFICIAL_PAYMENT_CONFIG.orangeMoneyNumbers',
        "['689115595', '640194505']",
        'Replace with your own Orange Money merchant or personal receiver numbers.'
      ],
      [
        'OFFICIAL_PAYMENT_CONFIG.bankAccount',
        'Afriland First Bank / IBAN',
        'Replace bankName, accountName, accountNumber, and swiftCode with your corporate bank account.'
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('4. Key Source Files for Deep Brand & Engineering Customization', margin, y);
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2
    },
    bodyStyles: {
      fontSize: 7.6,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    head: [['File Path in Project', 'What This File Controls & What to Customize']],
    body: [
      [
        'src/lib/SiteSettingsContext.tsx',
        'Default fallback brand settings (siteName, tagline, phones, emails, addresses, RCCM, NIU, social links, SEO defaults).'
      ],
      [
        'src/services/tenantContentService.ts',
        'Default flagship company profile, hero banners, default services list, and default portfolio projects.'
      ],
      [
        'src/components/ProjectBudgetCalculator.tsx',
        'Interactive 5-Step & Full Engineering Budget Calculator rates per m², material multipliers, and PDF quote letterhead.'
      ],
      [
        'src/components/ConstructionCostGuide.tsx',
        '2026 Regional Construction Cost Guide prices (cement, rebar, sand, gravel, labour rates) and regional multipliers.'
      ],
      [
        'src/components/BoqStudio.tsx & DocumentStudio.tsx',
        'Corporate letterheads, official stamps, contract clauses, and receipt templates for the 8 Engineering Studios.'
      ],
      [
        'src/utils/navigationGuidePdf.ts',
        'Downloadable A4 Visitor & Client Walkthrough Manual PDF header, company name, and contact coordinates.'
      ],
      [
        'index.html & metadata.json',
        'Browser <title>, OpenGraph social sharing cards (og:title, og:description), and PWA app name.'
      ]
    ]
  });

  // =========================================================================
  // PAGE 3: ENVIRONMENT VARIABLES (.ENV), SMTP & HANDOVER CHECKLIST
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 3);

  y = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('5. Environment Variables (.env), SMTP Email & Admin Login Setup', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'When deploying on your hosting server (Cloud Run, VPS, Render, Railway, or cPanel Node.js), configure these .env variables:',
    margin,
    y
  );
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2
    },
    bodyStyles: {
      fontSize: 7.6,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    head: [['Environment Variable (.env)', 'Purpose & Buyer Configuration Instructions']],
    body: [
      [
        'SMTP_HOST / SMTP_PORT',
        'e.g., smtp.gmail.com and 587 (or 465). Used by src/server/mailService.ts for all automated emails.'
      ],
      [
        'SMTP_USER / SMTP_PASS',
        'Your business email (e.g., yourname@gmail.com) and 16-character Google App Password for live SMTP dispatch.'
      ],
      [
        'ADMIN_EMAIL',
        'Your primary admin email address that receives quote alerts, 2,199 XAF payment confirmations, and maintenance logs.'
      ],
      [
        'VITE_FIREBASE_API_KEY & PROJECT_ID',
        'Firebase Authentication & Firestore credentials (or update firebase-applet-config.json with your Firebase project).'
      ],
      [
        'ADMIN EMAIL WHITELIST',
        'In src/server/routes/documentRoutes.ts (ADMIN_SMTP_USER) & src/middleware/auth.ts, add your admin login email.'
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 6: Step-by-Step 15-Minute Rebranding Checklist for the Buyer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('6. 15-Minute Buyer Launch & Handover Checklist', margin, y);
  y += 5;

  const checklistItems = [
    '[  ] Step 1: Log into the Admin Dashboard (#admin) -> Open "CMS & Site Settings" -> Update Company Name, Logo, Phones & Addresses.',
    '[  ] Step 2: Open src/utils/paymentDomain.ts -> Replace MTN MoMo, Orange Money numbers, Bank IBAN, and ADMIN_SMTP_USER_EMAIL.',
    '[  ] Step 3: Configure .env with your SMTP_USER and SMTP_PASS -> Click "Test SMTP" or trigger a Maintenance Notice to verify email delivery.',
    '[  ] Step 4: Test a 2,199 XAF Client Payment -> Approve it via "Confirm & Press OK" in Admin Dashboard -> Verify download links unlock.',
    '[  ] Step 5: Point your custom domain DNS (A / CNAME record) to your hosting server and enable SSL (HTTPS).'
  ];

  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  let cy = y + 6;
  checklistItems.forEach((item) => {
    doc.text(item, margin + 4, cy);
    cy += 6;
  });

  y += 42;

  // Handover Sign-Off Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(margin, y, contentWidth, 36, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9);
  doc.text('OFFICIAL WEBSITE OWNERSHIP TRANSFER & HANDOVER CERTIFICATE', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 53, 15);
  doc.text(
    'This document certifies the handover of full source code, database schemas, 8 Engineering Studios, and Admin CMS controls.',
    margin + 4,
    y + 12
  );
  doc.text(`Seller / Current Administrator: Eric Kreboya (${sellerEmailLabel} | +237 671 063 511)`, margin + 4, y + 19);
  doc.text(`Buyer / New Platform Owner: ${buyerCompanyLabel}`, margin + 4, y + 25);
  doc.text('Seller Signature: ___________________________       Buyer Signature: ___________________________', margin + 4, y + 32);

  return doc;
}

export function forceDownloadBuyerHandoverManualPdf(options: BuyerHandoverOptions = {}): void {
  const doc = generateBuyerHandoverManualPdf(options);
  doc.save('Website_Buyer_Brand_Customization_Handover_Manual_A4.pdf');
}

export function downloadBuyerHandoverManualPdf(options: BuyerHandoverOptions = {}): void {
  if (options.bypassPaymentGate) {
    forceDownloadBuyerHandoverManualPdf(options);
    return;
  }
  if (!isCurrentUserAdmin() && isReceiptPaid(BUYER_HANDOVER_MANUAL_RECEIPT_NO)) {
    forceDownloadBuyerHandoverManualPdf(options);
    return;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('madecc:open-manual-payment-gate', {
        detail: {
          manualType: 'buyer_handover_manual',
          options
        }
      })
    );
  }
}
