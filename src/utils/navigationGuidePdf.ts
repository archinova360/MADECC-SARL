import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  ADMIN_SMTP_USER_EMAIL,
  BUYER_HANDOVER_MANUAL_RECEIPT_NO,
  MANUAL_DOWNLOAD_FEE_XAF,
  NAVIGATION_MANUAL_RECEIPT_NO,
  OFFICIAL_PAYMENT_CONFIG,
  STANDARD_RECEIPT_FEE_XAF,
  TARGET_OFFICIAL_DOMAIN,
  verifyServerReceiptDownloadAllowed
} from './paymentDomain';

export interface NavigationGuideOptions {
  includeMetaReviewerProtocol?: boolean;
  generatedBy?: string;
}

export function generateWebsiteNavigationGuidePdf(options: NavigationGuideOptions = {}): jsPDF {
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
  const lightBg: [number, number, number] = [248, 250, 252];
  const borderGray: [number, number, number] = [226, 232, 240];
  const emeraldGreen: [number, number, number] = [16, 185, 129];

  const mtnNumbers = (OFFICIAL_PAYMENT_CONFIG?.mtnMomoNumbers || ['671063511', '683316486']).join(' / ');
  const omNumbers = (OFFICIAL_PAYMENT_CONFIG?.orangeMoneyNumbers || ['689115595', '640194505']).join(' / ');

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
      `MADECC GROUP S.A.R.L - Navigation Manual (A4 PDF) | ${MANUAL_DOWNLOAD_FEE_XAF} XAF Edition`,
      margin,
      pageHeight - 7
    );
    pageDoc.text(
      `Support: ${ADMIN_SMTP_USER_EMAIL} | Page ${pageNum} of ${totalPages}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  };

  // =========================================================================
  // PAGE 1: COVER OVERVIEW & COMPLETE PUBLIC WEBSITE DIRECTORY (18 PORTALS)
  // =========================================================================
  drawHeaderFooter(doc, 1);

  doc.setFillColor(...darkNavy);
  doc.roundedRect(margin, 12, contentWidth, 38, 3, 3, 'F');

  doc.setFillColor(...amberGold);
  doc.rect(margin + 2, 14, 2, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16.5);
  doc.setTextColor(255, 255, 255);
  doc.text('MADECC GROUP S.A.R.L - NAVIGATION MANUAL (A4 PDF)', margin + 8, 22);

  doc.setFontSize(10.5);
  doc.setTextColor(245, 158, 11);
  doc.text('COMPLETE PLATFORM DIRECTORY, 11-CATEGORY ADMIN ARCHITECTURE & WORKFLOWS', margin + 8, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Domain: ${TARGET_OFFICIAL_DOMAIN} | Manuals: ${MANUAL_DOWNLOAD_FEE_XAF} XAF | Certified Receipts: ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF`,
    margin + 8,
    36
  );
  doc.text(
    `Version 4.0 | ISO 9001 & OHADA Reference | Issued: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}${options.generatedBy ? ` | Prepared by: ${options.generatedBy}` : ''}`,
    margin + 8,
    42
  );

  let y = 55;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...darkNavy);
  doc.text('1. Platform Overview & Dual-Tier Document Access', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const introText =
    `Welcome to the official MADECC GROUP S.A.R.L digital ecosystem (${TARGET_OFFICIAL_DOMAIN}). This v4.0 A4 Navigation ` +
    'Manual documents all 18 public visitor portals, the reorganized 11-category Enterprise Administrative Dashboard, ' +
    'our direct 10 GB chunked media upload pipeline (Cloudinary + Supabase TUS), and our dual-tier Mobile Money / Orange Money ' +
    `verification flow (${MANUAL_DOWNLOAD_FEE_XAF} XAF for Platform Manuals; ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF for Certified Receipts, BOQs & Contracts — paid verification mandatory before download).`;
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.2 + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...darkNavy);
  doc.text('2. Public Website Directory (18 Interactive Portals)', margin, y);
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
      fontSize: 7.4,
      cellPadding: 1.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 25 }
    },
    head: [['Portal Name', 'Route / Tab Key', 'Primary Functions for Visitors & Clients', 'Access']],
    body: [
      ['Home & Quick Estimator', '#home', 'Corporate overview, 10 business divisions showcase, and instant m² cost preview', 'Public'],
      ['Engineering Services', '#services', '10 civil engineering, infrastructure, pharma, agro-industry & real estate divisions', 'Public'],
      ['Website Development', '#website-development', 'Corporate sites, client portals, MTN/Orange MoMo stores & technical SEO services', 'Public'],
      ['Projects Portfolio', '#projects', 'Filter active/completed Cameroon projects with 2D blueprints, budgets & specs', 'Public'],
      ['Budget Calculator', '#budget-calculator', '5-Step Quick Wizard & Full Engineering cost breakdown across 10 regions', 'Public'],
      ['Cost Guide 2026', '#construction-cost-guide', 'Live regional unit prices for cement, rebar, sand, gravel & skilled labour', 'Public'],
      ['Request a Quote', '#request-a-quote', 'Submit architectural plans & scope for a custom fixed-price BOQ proposal', 'Public'],
      ['Schedule Consultation', '#schedule-consultation', 'Book in-office (Yaoundé HQ) or remote meetings with Senior Civil Engineers', 'Public'],
      ['KRR Bookstore & Store', '#store', 'Order technical textbooks, Eurocode manuals & guides via MoMo/OM in XAF', 'Public'],
      ['Order Tracking', '#order-tracking', 'Track bookstore transactions, payment review & unlock digital PDF downloads', 'Public'],
      ['Tenders & Bidding', '#tenders', 'Browse active procurement tenders, download RFPs & upload contractor bids', 'Public'],
      ['Client Portal', '#client-portal', 'Authenticated client login to monitor milestones, progress media & invoices', 'Client Login'],
      ['Verify Document', '#verify', 'Scan QR codes or validate receipt (RCP-...) and contract (CNT-...) tokens', 'Public'],
      ['Developer APIs', '#developers', 'REST API catalog, subscription keys, webhooks & live endpoint sandbox', 'Public / API'],
      ['Cloud SaaS Platform', '#saas-cloud', 'Multi-tenant construction ERP workspaces for partner engineering firms', 'Public / SaaS'],
      ['Walkthrough & Site Map', '#walkthrough-guide / #sitemap', 'Interactive 6-phase visitor tour, FAQ hub, and full XML/HTML sitemap index', 'Public'],
      ['Navigation Manual Page', '#navigation-manual', 'Interactive A4 navigation guide chapter browser & 999 XAF PDF unlock', '999 XAF Paid'],
      ['Buyer Handover Manual', '#buyer-handover-manual', 'Interactive white-label brand transfer & 999 XAF Ownership Certificate PDF', '999 XAF Paid']
    ]
  });

  // =========================================================================
  // PAGE 2: REARRANGED ADMINISTRATIVE DASHBOARD ARCHITECTURE (11 CATEGORIES)
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 2);

  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...darkNavy);
  doc.text('3. Administrative Dashboard Navigation Architecture (11 Functional Categories)', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Every Admin module is organized into 11 non-overlapping functional groups with live sidebar search, Expand/Collapse All, and Cmd/Ctrl+K quick jump.',
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
      0: { cellWidth: 48, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 34 }
    },
    head: [['Navigation Category', 'Included Modules & Tabs', 'Primary Responsibility']],
    body: [
      [
        '01. Overview & Intelligence',
        'Command Center Overview, Executive Analytics & KPIs, AI Construction Intelligence',
        'Executive KPIs & AI'
      ],
      [
        '02. Corporate & Governance',
        'Business Profile & Legal Registration, Business Divisions (10), Real Estate Hub, Pharma Compliance, Investors (Ghana/CM), Governance & Audit Trail',
        'Corporate Legal & Divisions'
      ],
      [
        '03. Construction ERP & Operations',
        'Manage Projects Portfolio, Client Directory, Client Portal Access, Site Progress Tracking, Progress Photos & Videos, Milestones, Materials Inventory, Equipment Fleet, Subcontractors, Workforce & Roster, ERP Reports',
        'Field & Client Delivery'
      ],
      [
        '04. Engineering & Quantity Surveying',
        'Enterprise QS & BOQ Studio, Quantity Take-Off (CAD Studio), Structural Loads & Weights, Labour & Crew Calculator, ERP Cost Estimator, ERP BOQ Manager',
        'Technical Computation'
      ],
      [
        '05. Commerce, CRM & Engagement',
        'KRR Bookstore Orders & Verification, Quote Requests & Leads, Consultations Queue, Client Inquiries, Tenders CMS, Suppliers CMS',
        'Commercial Pipeline'
      ],
      [
        '06. Finance, Billing & Payments',
        'Payment Confirmations (999 / 2,199 XAF Queue), Client Project Invoices, Official Receipt Generator, Receipt & Contract Ledger, ERP Financial Statements',
        'Revenue & Payment OK'
      ],
      [
        '07. Documents, Legal & Manuals',
        'Pro Document Studio, Commercial Proposal Manager, OHADA Contract Generator, Company Policy Documents, Manuals & Handover Guides (A4 PDF), CV Builder, Application Letters',
        'Legal & Manuals Hub'
      ],
      [
        '08. Website CMS & Publishing',
        'Website Overview, Page Builder & Hero Studio, Section Editor, Publishing & Staging Queue, Human Content Review, Revision History, Media Library (10 GB), Video Library, Hero Sliders, Gallery, Services CMS, Sustainability CMS, FAQ CMS, Blogs, Reviews, Legal Pages, Technical SEO, Sitemap, Announcements, Live Website Optimizer, Global Branding Settings',
        'Full No-Code CMS'
      ],
      [
        '09. Marketing & Social Media',
        'SEO & Social Media Publisher (Role-isolated for social_media_reviewer testers)',
        'OAuth Social Growth'
      ],
      [
        '10. People, HR & Education',
        'Staff Access & Role Permissions, Leadership & Team Directory, MINESEC Lesson Prep Studio, Syllabus Manager, Extended Lesson Architect',
        'HR & Pedagogical'
      ],
      [
        '11. Platform, Security & Infrastructure',
        'SaaS Control Plane & Tenants, API Platform & MoMo Verification, Developer API Portal CMS, Maintenance Mode & Brand Handover, Play Store (TWA) & cPanel Hosting, Maintenance Scheduler, Security & Threat Monitoring, Database Audit Logs, Publishing Logs, DB & API Docs',
        'Cloud, Infra & Security'
      ]
    ]
  });

  // =========================================================================
  // PAGE 3: TECHNICAL STUDIOS, 10 GB MEDIA UPLOAD & PAYMENT UNLOCK FLOW
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 3);

  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('4. Specialized Computing Studios & 10 GB Direct Media Architecture', margin, y);
  y += 4.5;

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
      0: { cellWidth: 44, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 42 }
    },
    head: [['Engineering / Platform Studio', 'Core Capabilities', 'Export / Storage Target']],
    body: [
      ['Enterprise QS & BOQ Studio', 'Nested WBS, multi-currency (XAF/USD/EUR), TVA calculations & unit libraries', 'A4 PDF, XLSX, CSV, JSON'],
      ['Structural & Labour Calculators', 'Eurocode 2 beam/slab/column sizing plus CEMAC workforce & daily crew costing', 'Calc Sheet PDF & Excel'],
      ['CAD Quantity Take-Off & AI Vision', '2D blueprint scale calibration (1:50/1:100) + AI drawing quantity extraction', 'SVG, PNG, PDF & BOQ Sync'],
      ['OHADA Contracts, Proposals & Receipts', 'Signed OHADA agreements, tender proposals & QR-verified fiscal receipts', 'DOCX & QR-Signed A4 PDF'],
      ['Pro Document & MINESEC Studios', 'Rich collaborative document editor + Cameroon curriculum & lesson architect', 'DOCX, PDF & Curriculum Packs'],
      ['10 GB Direct Media Pipeline', 'Chunked Cloudinary signed upload + Supabase Storage TUS resumable upload (bypasses proxy HTTP 413 limits up to 10 GB)', 'Cloudinary CDN & Supabase']
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...darkNavy);
  doc.text('5. Client Payment & Download Unlock Workflow (999 XAF & 2,199 XAF)', margin, y);
  y += 4.5;

  const paymentSteps = [
    {
      title: `Step 1 — Select Manual (${MANUAL_DOWNLOAD_FEE_XAF} XAF) or Certified Receipt / BOQ (${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF)`,
      body: `Every user pays ${MANUAL_DOWNLOAD_FEE_XAF} XAF for the Navigation Manual (${NAVIGATION_MANUAL_RECEIPT_NO}) or Buyer Handover Manual (${BUYER_HANDOVER_MANUAL_RECEIPT_NO}), or ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF for Certified Receipts, BOQs, Cost Guides, and Contracts before download unlocks.`
    },
    {
      title: 'Step 2 — Transfer via MTN Mobile Money or Orange Money',
      body: `Transfer the fee via MTN MoMo (${mtnNumbers}) or Orange Money (${omNumbers}), then enter your sender phone number and transaction reference inside the Payment Gate Modal.`
    },
    {
      title: 'Step 3 — Admin Verification ("Confirm & Press OK" in 06. Finance > Payment Confirmations)',
      body: `Status enters PENDING_ADMIN_CONFIRMATION. The Administrator verifies funds in Admin > 06. Finance, Billing & Payments > Payment Confirmations and clicks "Confirm & Press OK", dispatching an automated SMTP confirmation to ${ADMIN_SMTP_USER_EMAIL}.`
    },
    {
      title: 'Step 4 — Instant PDF, Word (DOCX) & Excel (XLSX) Unlock',
      body: 'Once confirmed, download buttons unlock immediately and receipts can be cryptographically verified anytime on #verify.'
    }
  ];

  paymentSteps.forEach((step) => {
    doc.setFillColor(...lightBg);
    doc.setDrawColor(...borderGray);
    doc.roundedRect(margin, y, contentWidth, 18.5, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.1);
    doc.setTextColor(...deepBlue);
    doc.text(step.title, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text(doc.splitTextToSize(step.body, contentWidth - 6), margin + 3, y + 8.8);

    y += 20.5;
  });

  // =========================================================================
  // PAGE 4: META APP REVIEW PROTOCOL & SECURITY / OFFICIAL CONTACT MATRIX
  // =========================================================================
  doc.addPage();
  drawHeaderFooter(doc, 4);

  y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(...deepBlue);
  doc.text('6. Meta App Review Testing Protocol & Role Isolation', margin, y);
  y += 4.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Reviewer logins using the "social_media_reviewer" role are strictly isolated to 09. Marketing & Social Media > SEO & Social Media Publisher.',
    margin,
    y
  );
  y += 3.5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
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
      0: { cellWidth: 34, fontStyle: 'bold' },
      1: { cellWidth: 44 },
      2: { cellWidth: 'auto' }
    },
    head: [['Review Phase', 'Scope / Permission Under Test', 'Verification Steps & Expected Result']],
    body: [
      ['1. Isolated Login', 'social_media_reviewer JWT', 'Sign in via Login > Email Login. Dashboard hides all Finance/CMS/ERP tabs and opens Social Media Studio directly.'],
      ['2. Facebook Pages API', 'pages_show_list, pages_read_engagement, pages_manage_posts', 'Inspect connected "Madecc Group" Page (ID: 1055380190992758) and trigger a test Page post dispatch.'],
      ['3. Instagram Graph API', 'instagram_basic, instagram_content_publish', 'Verify "@madeccgroupofficials" Business Account container creation and publishing workflow.'],
      ['4. WhatsApp Business', 'whatsapp_business_messaging, management', 'Validate WhatsApp Cloud alerts (+237 671 063 511) and webhook status tracking.'],
      ['5. Audit Compliance', 'PostgreSQL audit_logs', 'Confirm publish events, tokens, and session checks record timestamps and status codes in Neon PostgreSQL.']
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 7;

  // Security Notice Box
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(180, 83, 9);
  doc.text('SECURITY NOTICE: CREDENTIAL PRIVACY & ANTI-HACKING PROTOCOL', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.6);
  doc.setTextColor(120, 53, 15);
  const secText =
    `Production passwords and API secrets are never published in client bundles or downloadable manuals. Authorized reviewers and staff request temporary access via ${ADMIN_SMTP_USER_EMAIL} or WhatsApp (+237 671 063 511 / +237 640 194 505).`;
  doc.text(doc.splitTextToSize(secText, contentWidth - 8), margin + 4, y + 11);

  y += 30;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(...darkNavy);
  doc.text('7. Official Support, Payment & Corporate Contact Matrix', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    bodyStyles: {
      fontSize: 7.8,
      cellPadding: 1.8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 48, fontStyle: 'bold', textColor: deepBlue },
      1: { cellWidth: 'auto' }
    },
    body: [
      ['Executive Administrator:', 'Eric Kreboya — Managing Director & Lead Civil Engineer'],
      ['Official Email & SMTP Dispatch:', `${ADMIN_SMTP_USER_EMAIL} (Automated Payment OK & Maintenance Alerts)`],
      ['MTN Mobile Money (MoMo):', `${mtnNumbers} (Manuals: ${MANUAL_DOWNLOAD_FEE_XAF} XAF | Receipts: ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF)`],
      ['Orange Money (OM):', `${omNumbers} (Unlocks immediately after Admin Confirm & Press OK)`],
      ['WhatsApp & Hotlines:', '+237 671 063 511 / +237 683 316 486 / +237 640 194 505'],
      ['Official Domain & Headquarters:', `${TARGET_OFFICIAL_DOMAIN} | Mbankolo / Omnisports, Yaoundé, Cameroon`]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  doc.setFillColor(...lightBg);
  doc.setDrawColor(...emeraldGreen);
  doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...emeraldGreen);
  doc.text('DOCUMENT VERIFICATION STAMP: APPROVED PLATFORM NAVIGATION MANUAL (VERSION 4.0)', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.3);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'MADECC GROUP S.A.R.L © 2026. All Rights Reserved. ISO 9001 & OHADA Compliant Operational Documentation.',
    margin + 4,
    y + 11
  );

  return doc;
}

export function forceDownloadWebsiteNavigationGuidePdf(options: NavigationGuideOptions = {}): void {
  const doc = generateWebsiteNavigationGuidePdf(options);
  doc.save('MADECC_Group_Website_Navigation_Manual_A4.pdf');
}

export async function downloadWebsiteNavigationGuidePdf(options: NavigationGuideOptions = {}): Promise<void> {
  const verification = await verifyServerReceiptDownloadAllowed(NAVIGATION_MANUAL_RECEIPT_NO);
  if (verification.allowed) {
    forceDownloadWebsiteNavigationGuidePdf(options);
    return;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('madecc:open-manual-payment-gate', {
        detail: {
          manualType: 'navigation_manual',
          options
        }
      })
    );
  }
}
