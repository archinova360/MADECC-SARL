import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ADMIN_SMTP_USER_EMAIL,
  BUYER_HANDOVER_MANUAL_RECEIPT_NO,
  MANUAL_DOWNLOAD_FEE_XAF,
  OFFICIAL_PAYMENT_CONFIG,
  STANDARD_RECEIPT_FEE_XAF,
  TARGET_OFFICIAL_DOMAIN,
  isCurrentUserAdmin,
  isReceiptPaid
} from './paymentDomain';

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
  const totalPages = 4;

  const darkNavy: [number, number, number] = [15, 23, 42];
  const deepBlue: [number, number, number] = [30, 58, 138];
  const amberGold: [number, number, number] = [217, 119, 6];
  const emeraldGreen: [number, number, number] = [16, 185, 129];
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderGray: [number, number, number] = [226, 232, 240];

  const buyerNameLabel = options.buyerName?.trim() || '[Authorized Buyer Name]';
  const buyerCompanyLabel = options.buyerCompany?.trim() || '[New Owner Brand / Company Name]';
  const buyerDomainLabel = options.buyerDomain?.trim() || '[https://your-new-brand.com]';
  const sellerNameLabel = options.sellerName?.trim() || 'Eric Kreboya';
  const sellerEmailLabel = options.sellerEmail?.trim() || ADMIN_SMTP_USER_EMAIL;
  const mtnNumbers = (OFFICIAL_PAYMENT_CONFIG?.mtnMomoNumbers || ['671063511', '683316486']).join(', ');
  const omNumbers = (OFFICIAL_PAYMENT_CONFIG?.orangeMoneyNumbers || ['689115595', '640194505']).join(', ');

  const drawHeaderFooter = (pageDoc: jsPDF, pageNum: number) => {
    pageDoc.setFillColor(...deepBlue);
    pageDoc.rect(0, 0, pageWidth, 5, 'F');

    pageDoc.setFillColor(...amberGold);
    pageDoc.rect(0, 5, pageWidth, 1.5, 'F');

    pageDoc.setDrawColor(...borderGray);
    pageDoc.setLineWidth(0.4);
    pageDoc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pageDoc.setFont('helvetica', 'normal');
    pageDoc.setFontSize(8);
    pageDoc.setTextColor(100, 116, 139);
    pageDoc.text(
      `BUYER BRAND HANDOVER MANUAL (A4 PDF) — 2026 Enterprise Release | ${MANUAL_DOWNLOAD_FEE_XAF} XAF`,
      margin,
      pageHeight - 7
    );
    pageDoc.text(
      `Handover Support: ${sellerEmailLabel} | Page ${pageNum} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  };

  // =========================================================================
  // PAGE 1: HANDOVER OVERVIEW & NO-CODE 11-CATEGORY ADMIN REBRANDING GUIDE
  // =========================================================================
  drawHeaderFooter(doc, 1);

  doc.setFillColor(...darkNavy);
  doc.roundedRect(margin, 12, contentWidth, 40, 3, 3, 'F');

  doc.setFillColor(...emeraldGreen);
  doc.rect(margin + 2, 14, 2, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(255, 255, 255);
  doc.text('BUYER BRAND HANDOVER & CUSTOMIZATION MANUAL (A4 PDF)', margin + 8, 22);

  doc.setFontSize(10);
  doc.setTextColor(245, 158, 11);
  doc.text('TURNKEY REBRANDING, PAYMENT TRANSFER, INFRASTRUCTURE CUTOVER & LAUNCH DOSSIER', margin + 8, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Prepared for: ${buyerNameLabel} (${buyerCompanyLabel}) | Target Domain: ${buyerDomainLabel}`,
    margin + 8,
    36
  );
  doc.text(
    `2026 Enterprise Release | Stack: React 19 + TypeScript + Express + Neon PostgreSQL + Drizzle ORM | Issued: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}`,
    margin + 8,
    42.5
  );

  let y = 57;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...darkNavy);
  doc.text('1. Executive Handover Scope — What Transfers to the Buyer', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.4);
  doc.setTextColor(51, 65, 85);
  const introText =
    `This Enterprise Release handover manual provides ${buyerCompanyLabel} with exact, zero-guesswork instructions to transfer ` +
    'brand identity, domain authority, Mobile Money / Orange Money settlement accounts, SMTP transactional mail, Neon PostgreSQL / ' +
    'Drizzle ORM databases, and 10 GB chunked Cloudinary / Supabase media storage cleanly across all 11 Admin Dashboard categories.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.2 + 3.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...darkNavy);
  doc.text('2. No-Code Rebranding in the 11-Category Admin Dashboard (#admin)', margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: deepBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.2
    },
    bodyStyles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: 'bold' },
      1: { cellWidth: 52 },
      2: { cellWidth: 'auto' }
    },
    head: [['Brand & Platform Element', 'Rearranged Admin Category Path', 'What Buyer Updates (Zero Code Required)']],
    body: [
      [
        'Site Name, Logo, Theme & Offices',
        '08. Website CMS & Publishing > Global Site Branding & Settings',
        'Update Company Name, Tagline, RCCM/NIU Tax ID, Logo/Favicon URLs, Brand Colors, Yaoundé/Douala addresses, and phone hotlines.'
      ],
      [
        'Hero Reels, Sliders & Public Pages',
        '08. Website CMS & Publishing > Page Builder / Home Hero Sliders',
        'Replace homepage hero copy, background video reels, SEO meta tags, and page section blocks using live staging & revision history.'
      ],
      [
        'Services, Divisions & Legal Pages',
        '02. Corporate & Governance + 08. Website CMS > Services / Legal Pages',
        'Edit all 10 business divisions, engineering services, privacy policy, OHADA terms, FAQ entries, and sustainability initiatives.'
      ],
      [
        'Projects, Tenders & KRR Store',
        '03. Construction ERP + 05. Commerce & CRM > Projects / Tenders / KRR Bookstore',
        'Publish your own projects, progress photos/videos (up to 10 GB), contractor tenders, suppliers, and digital store publications.'
      ],
      [
        'Social Links & OAuth Channels',
        '09. Marketing & Social Media > SEO & Social Media Publisher',
        'Reconnect Facebook Page, Instagram Business, LinkedIn, YouTube, and WhatsApp Business Cloud under your brand OAuth app.'
      ],
      [
        'Staff Roles & Client Accounts',
        '10. People, HR & Education + 03. Construction ERP > Staff Access / Client Portal',
        'Reassign administrator privileges, deactivate seller accounts, and onboard your engineering staff and construction clients.'
      ],
      [
        'Maintenance Notice & Brand Guides',
        '07. Documents > Manuals Hub + 11. Platform > Maintenance Mode & Brand Handover',
        'Toggle non-intrusive visitor maintenance banners via SMTP and personalize/download Buyer Handover A4 PDFs anytime.'
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(...emeraldGreen);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 21, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(6, 95, 70);
  doc.text('MULTI-TENANT WHITE-LABEL ENGINE INCLUDED (11. PLATFORM > SAAS CONTROL PLANE)', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(20, 83, 45);
  doc.text(
    doc.splitTextToSize(
      'Beyond single-brand operation, the platform includes a multi-tenant SaaS engine allowing you to host isolated sub-brand workspaces for partner firms with custom logos, plans, and tenant billing.',
      contentWidth - 8
    ),
    margin + 4,
    y + 10.5
  );

  // =========================================================================
  // PAGE 2: PAYMENT DOMAIN CONSTANTS & SOURCE FILE HANDOVER MAP
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 2);

  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('3. Transferring Payment Numbers, Fees & Domain (src/utils/paymentDomain.ts)', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Edit src/utils/paymentDomain.ts to switch Mobile Money / Orange Money receivers, pricing tiers, SMTP dispatch target, and production domain:',
    margin,
    y
  );
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.4,
      cellPadding: 1.9,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 'auto' }
    },
    head: [['Constant / Configuration Key', 'Current Value', 'Buyer Cutover Action']],
    body: [
      ['TARGET_OFFICIAL_DOMAIN', TARGET_OFFICIAL_DOMAIN, `Set to ${buyerDomainLabel} for QR verification URLs, SEO canonicals, and payment redirects.`],
      ['MANUAL_DOWNLOAD_FEE_XAF', `${MANUAL_DOWNLOAD_FEE_XAF} XAF`, 'Controls the fee for Navigation Manual (A4 PDF) & Buyer Brand Handover Manual downloads.'],
      ['STANDARD_RECEIPT_FEE_XAF', `${STANDARD_RECEIPT_FEE_XAF} XAF`, 'Controls the fee for Certified Receipts, BOQs, Cost Guides, and OHADA Contracts.'],
      ['ADMIN_SMTP_USER_EMAIL', sellerEmailLabel, 'Replace with the new owner admin inbox receiving payment OK & maintenance dispatches.'],
      ['OFFICIAL_PAYMENT_CONFIG.mtnMomoNumbers', `[${mtnNumbers}]`, 'Replace with the buyer corporate or merchant MTN Mobile Money receiver lines.'],
      ['OFFICIAL_PAYMENT_CONFIG.orangeMoneyNumbers', `[${omNumbers}]`, 'Replace with the buyer corporate or merchant Orange Money receiver lines.'],
      ['OFFICIAL_PAYMENT_CONFIG.bank', 'UBA / Afriland IBAN', 'Update corporate bankName, accountName, and ibanRib for wire settlement receipts.']
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('4. Technical File Handover Reference Map', margin, y);
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: deepBlue,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.4,
      cellPadding: 1.9,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 56, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    head: [['Repository File Path', 'Purpose & Buyer Transfer Scope']],
    body: [
      ['src/lib/SiteSettingsContext.tsx', 'Fallback company identity, NIU/RCCM tax numbers, phones, HQ address, social profiles & SEO defaults.'],
      ['src/services/tenantContentService.ts', 'Default flagship tenant branding, division templates, hero banners, services & portfolio items.'],
      ['src/utils/navigationGuidePdf.ts & buyerHandoverPdf.ts', 'Client-side A4 PDF generators for the 999 XAF Navigation & Buyer Handover Manuals.'],
      ['src/components/BoqStudio.tsx & DocumentStudio.tsx', 'PDF/DOCX corporate letterheads, engineering stamps, fiscal receipts, and OHADA contract clauses.'],
      ['src/lib/directMediaUpload.ts', 'Direct chunked Cloudinary + Supabase TUS upload engine (supports up to 10 GB media files without 413 errors).'],
      ['src/middleware/auth.ts & server.ts', 'Backend Express API server, Neon Drizzle queries, admin role guards, SMTP routes & webhook verification.'],
      ['index.html & metadata.json', 'Document <title>, OpenGraph social share cards, Twitter cards, and PWA manifest configuration.']
    ]
  });

  // =========================================================================
  // PAGE 3: INFRASTRUCTURE, NEON POSTGRESQL, STORAGE & .ENV CUTOVER MATRIX
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 3);

  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('5. Cloud Infrastructure, Storage (10 GB) & .env Variables Cutover', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Update these environment variables on Netlify, Cloud Run, VPS, or cPanel Node.js during production domain cutover:',
    margin,
    y
  );
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: darkNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 7.4,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 54, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    },
    head: [['Environment Variable / Secret', 'Infrastructure Provider & Buyer Transfer Instructions']],
    body: [
      ['DATABASE_URL', 'Neon Serverless PostgreSQL connection string managed via Drizzle ORM (drizzle-kit push for schema sync).'],
      ['SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS', 'Transactional mail server (e.g., Gmail App Password or brand SMTP) used by src/server/mailService.ts.'],
      ['ADMIN_EMAIL & JWT_SECRET / SESSION_SECRET', 'Buyer primary admin alert email plus freshly rotated cryptographic signing secrets for cookies/JWTs.'],
      ['CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET', 'Cloudinary account credentials powering signed direct chunked browser uploads and optimized CDN transforms.'],
      ['SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY', 'Supabase project & Storage bucket supporting TUS resumable uploads up to 10 GB for large site videos/blueprints.'],
      ['VITE_FIREBASE_API_KEY & PROJECT_ID', 'Firebase Auth client configuration and Digital Asset Links (.well-known/assetlinks.json) for Google Play TWA.'],
      ['GEMINI_API_KEY (Server-Side Only)', 'Server-side AI key for Engineering Studios & Blueprint Vision Take-Off (never exposed in frontend bundles).']
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('6. Mobile Money & Verification Desk Quick Reference', margin, y);
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    bodyStyles: {
      fontSize: 7.8,
      cellPadding: 1.9,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 52, fontStyle: 'bold', textColor: deepBlue },
      1: { cellWidth: 'auto' }
    },
    body: [
      ['Manuals Verification Tier:', `${MANUAL_DOWNLOAD_FEE_XAF} XAF (Navigation Manual & Buyer Brand Handover Manual)`],
      ['Certified Exports Tier:', `${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF (Receipts, BOQs, Cost Guides, Contracts)`],
      ['Admin Confirm & OK Console:', 'Admin > 06. Finance, Billing & Payments > Payment Confirmations'],
      ['Active MoMo / OM Channels:', `MTN MoMo: ${mtnNumbers} | Orange Money: ${omNumbers}`],
      ['Handover Technical Desk:', `${sellerNameLabel} (${sellerEmailLabel} | +237 671 063 511)`]
    ]
  });

  // =========================================================================
  // PAGE 4: 15-MINUTE LAUNCH CHECKLIST & OWNERSHIP TRANSFER CERTIFICATE
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 4);

  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('7. 15-Minute Post-Handover Launch Checklist', margin, y);
  y += 4.5;

  const checklistItems = [
    '[  ] Step 1 — Brand Identity: Sign in to #admin > 08. Website CMS > Global Site Branding & Settings; update Logo, Brand Name, NIU/RCCM, Phones & Colors.',
    '[  ] Step 2 — Payment Transfer: Edit src/utils/paymentDomain.ts with buyer MTN MoMo, Orange Money, Bank IBAN, Domain & ADMIN_SMTP_USER_EMAIL.',
    '[  ] Step 3 — Infrastructure & Secrets: Rotate DATABASE_URL, SMTP_USER/PASS, Cloudinary, Supabase, and JWT secrets in hosting .env settings.',
    '[  ] Step 4 — Verify Payment & 10 GB Uploads: Confirm a test 999 / 2,199 XAF payment in 06. Finance > Payment Confirmations and upload a test media file.',
    '[  ] Step 5 — Domain Cutover & Play Store TWA: Point DNS A/CNAME + SSL HTTPS to your host and update assetlinks.json under 11. Platform > Play Store & cPanel.'
  ];

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.roundedRect(margin, y, contentWidth, 42, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(30, 41, 59);
  let cy = y + 6;
  checklistItems.forEach((item) => {
    const wrapped = doc.splitTextToSize(item, contentWidth - 8);
    doc.text(wrapped, margin + 4, cy);
    cy += wrapped.length * 4 + 1.5;
  });

  y += 49;

  // Official Ownership Transfer Certificate Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(...amberGold);
  doc.setLineWidth(0.7);
  doc.roundedRect(margin, y, contentWidth, 64, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(180, 83, 9);
  doc.text('OFFICIAL WEBSITE OWNERSHIP TRANSFER & BRAND HANDOVER CERTIFICATE', margin + 5, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(120, 53, 15);
  const certBody =
    'This certificate records the full technical and operational transfer of the React/TypeScript frontend, Express REST API, ' +
    'Neon PostgreSQL + Drizzle ORM schemas, 11-category Enterprise Admin Dashboard, Cloudinary/Supabase 10 GB media upload system, ' +
    'and all Engineering/BOQ Studios to the authorized buyer listed below.';
  doc.text(doc.splitTextToSize(certBody, contentWidth - 10), margin + 5, y + 14.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.text(`Seller / Transferring Administrator: ${sellerNameLabel} (${sellerEmailLabel} | +237 671 063 511)`, margin + 5, y + 30);
  doc.text(`Buyer / Authorized Recipient: ${buyerNameLabel}`, margin + 5, y + 36);
  doc.text(`New Owner Company / Brand: ${buyerCompanyLabel}`, margin + 5, y + 42);
  doc.text(`Target Production Domain: ${buyerDomainLabel}`, margin + 5, y + 48);

  doc.setFont('helvetica', 'normal');
  doc.text('Seller Signature: _____________________________      Buyer Signature: _____________________________', margin + 5, y + 58);

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
