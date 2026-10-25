import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { isReceiptPaid, isCurrentUserAdmin, NAVIGATION_MANUAL_RECEIPT_NO, MANUAL_DOWNLOAD_FEE_XAF } from './paymentDomain';

export interface NavigationGuideOptions {
  includeMetaReviewerProtocol?: boolean;
  generatedBy?: string;
  bypassPaymentGate?: boolean;
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
  const contentWidth = pageWidth - (margin * 2);

  // Color Palette
  const darkNavy = [15, 23, 42];      // #0F172A (Primary Slate)
  const deepBlue = [30, 58, 138];     // #1E3A8A (Corporate Blue)
  const amberGold = [217, 119, 6];    // #D97706 (Amber Brand)
  const lightBg = [248, 250, 252];    // #F8FAFC
  const borderGray = [226, 232, 240]; // #E2E8F0
  const emeraldGreen = [16, 185, 129];// #10B981

  let currentPage = 1;

  // Helper: Draw Header & Footer for every page
  const drawHeaderFooter = (pageDoc: jsPDF, pageNum: number, totalPagesPlaceholder = 'Page {page_number}') => {
    // Top banner bar
    pageDoc.setFillColor(deepBlue[0], deepBlue[1], deepBlue[2]);
    pageDoc.rect(0, 0, pageWidth, 5, 'F');

    pageDoc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
    pageDoc.rect(0, 5, pageWidth, 1.5, 'F');

    // Footer bar
    pageDoc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    pageDoc.setLineWidth(0.4);
    pageDoc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pageDoc.setFont('helvetica', 'normal');
    pageDoc.setFontSize(8);
    pageDoc.setTextColor(100, 116, 139);
    pageDoc.text('MADECC GROUP S.A.R.L - Comprehensive Website & Portal Navigation Manual (A4 Format)', margin, pageHeight - 7);
    pageDoc.text(
      `Support: kreboya603@gmail.com | +237 671 063 511 | ${pageNum}`,
      pageWidth - margin,
      pageHeight - 7,
      { align: 'right' }
    );
  };

  // =========================================================================
  // PAGE 1: TITLE, EXECUTIVE OVERVIEW & GLOBAL ARCHITECTURE
  // =========================================================================
  drawHeaderFooter(doc, currentPage);

  // Corporate Header Card
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.roundedRect(margin, 12, contentWidth, 38, 3, 3, 'F');

  // Gold accent left line
  doc.setFillColor(amberGold[0], amberGold[1], amberGold[2]);
  doc.rect(margin + 2, 14, 2, 34, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text('MADECC GROUP S.A.R.L - CAMEROON', margin + 8, 22);

  doc.setFontSize(11);
  doc.setTextColor(245, 158, 11);
  doc.text('COMPLETE VISITOR, CLIENT & PLATFORM WALKTHROUGH MANUAL', margin + 8, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Step-by-step guide for Website Visitors, Clients, Cost Calculators, 2,199 XAF Document Unlock & Studios.', margin + 8, 36);
  doc.text(`Version 3.0 | Classification: Public Visitor & Client Guide | Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 8, 42);

  let y = 55;

  // Section 1: Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('1. Welcome Visitors & Clients — Platform Overview', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const introText = 
    'Welcome to the official MADECC GROUP S.A.R.L digital platform (https://madeccgroup.online). Whether you are a ' +
    'homeowner planning a villa, a corporate developer estimating a commercial complex, a contractor bidding on tenders, ' +
    'or a client downloading certified engineering receipts and contracts, this complete walkthrough guide walks you ' +
    'step-by-step through every tool, calculator, payment verification, and service on our website.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.5 + 4;

  // Section 2: Global Navigation Header Layout Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('2. Website Directory & Visitor Navigation Map', margin, y);
  y += 3;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 34, fontStyle: 'bold' },
      1: { cellWidth: 36 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 28 }
    },
    head: [['Website Section', 'Tab / Target', 'What Visitors & Clients Can Do Here', 'Access Level']],
    body: [
      ['Home Page', '#home', 'Overview of MADECC Group, quick m² cost estimator, live project stats, and client testimonials', 'Public (Free)'],
      ['Walkthrough Guide', '#walkthrough-guide', 'Interactive step-by-step visitor & client guide with 1-click module launchers & FAQ', 'Public (Free)'],
      ['Engineering Services', '#services', 'Explore structural design, civil works, road construction, geotechnical & solar services', 'Public (Free)'],
      ['Projects Portfolio', '#projects', 'Filter completed & ongoing projects across Cameroon with CAD blueprints & specs', 'Public (Free)'],
      ['Budget Calculator', '#budget-calculator', '5-Step Quick Estimator & Full Engineering Calculator for villas, apartments & offices', 'Public (Free)'],
      ['Cost Guide 2026', '#construction-cost-guide', '2026 regional material prices (cement, iron rods, sand) & labour rates across 10 regions', 'Public (Free)'],
      ['Request a Quote', '#request-a-quote', 'Submit project specs or architectural drawings for a custom fixed-price BoQ proposal', 'Public (Free)'],
      ['Book Consultation', '#schedule-consultation', 'Schedule an in-person (Yaoundé HQ) or virtual video consultation with senior engineers', 'Public (Free)'],
      ['Tenders & Bidding', '#tenders', 'View open procurement tenders, supplier pre-qualification, and bidding documents', 'Public (Free)'],
      ['Verify Document', '#verify', 'Scan QR codes or enter receipt/contract tokens to verify authentic MADECC documents', 'Public (Free)'],
      ['Admin & Studios', '#admin', '8 Technical Studios (BoQ, Structural, Labour, Blueprint, Contracts, Receipts) & ERP', 'Admin / Staff']
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Security & Anti-Hacking Alert Box
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9);
  doc.text('SECURITY NOTICE: CREDENTIAL PRIVACY & ANTI-HACKING PROTOCOL', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 53, 15);
  const secNotice = 
    'To protect enterprise infrastructure from unauthorized intrusion, live credentials and bypass passwords are never ' +
    'exposed publicly. Meta App Reviewers, auditors, and staff must request temporary isolated session credentials directly ' +
    'from Administrator Eric (Email: kreboya603@gmail.com | WhatsApp: +237 671 063 511 / +237 640 194 505). ' +
    'All authentication attempts are cryptographically HMAC signed, timestamped, and logged to the security audit ledger.';
  const splitSecNotice = doc.splitTextToSize(secNotice, contentWidth - 8);
  doc.text(splitSecNotice, margin + 4, y + 12);

  // =========================================================================
  // PAGE 2: TECHNICAL COMPUTING STUDIOS & DOCUMENT WORK ENGINES
  // =========================================================================
  doc.addPage();
  currentPage++;
  drawHeaderFooter(doc, currentPage);

  y = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('3. Technical Computing & Professional Engineering Studios', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('The MADECC platform includes 8 specialized technical computing studios accessible via the Admin/Staff Workspace.', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5
    },
    bodyStyles: {
      fontSize: 7.8,
      cellPadding: 2,
      textColor: [15, 23, 42]
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 45 }
    },
    head: [['Specialized Studio', 'Capabilities & Computational Workflow', 'Export & Output Formats']],
    body: [
      [
        'Bill of Quantities (BoQ) Studio',
        'Hierarchical Work Breakdown Structures (WBS), sub-item nesting, live currency conversions (XAF, USD, EUR), automated TVA/tax calculations, and custom unit rate libraries.',
        'Formatted A4 PDF, XLSX, CSV, JSON Master backup'
      ],
      [
        'Structural Engineering Calculator',
        'Reinforced concrete beam, slab, and column dimensioning under Eurocode 2 / BS 8110 standards. Moment of inertia, shear force envelopes, deflection checks.',
        'Engineering Calculation Sheet (PDF), Print Layout'
      ],
      [
        'Labour & Workforce Estimator',
        'Man-hour productivity modeling, skilled vs. unskilled trade ratios, daily wage rate indexing for Cameroon & CEMAC zone, site supervisor overheads.',
        'Labour Allocation Schedule (A4 PDF & Excel)'
      ],
      [
        'Blueprint Architecture & Drawing Studio',
        'Interactive 2D vector CAD blueprint viewer, layer visibility toggling, dimension measuring calipers, scale calibration (1:50, 1:100), and PDF blueprint viewer.',
        'Vector Blueprint Export (SVG, PDF, PNG)'
      ],
      [
        'Legal Contract & Agreement Generator',
        'Standardized FIDIC & OHADA compliant civil construction contracts, subcontractor terms, dispute resolution clauses, and digital signature blocks.',
        'Legal Contract Document (DOCX & PDF)'
      ],
      [
        'Fiscal Receipt & Invoice Studio',
        'Corporate billing receipts with automated cryptographic transaction hashes, QR code verification tags, multi-currency breakdown, and client records.',
        'Numbered Official Receipt (A4 PDF)'
      ],
      [
        'Proposal & Tender Architect',
        'Full-scale commercial bidding proposal generator with executive executive summary, team resumes, equipment manifests, and project gantt timeline.',
        'Commercial Proposal Dossier (PDF & DOCX)'
      ],
      [
        'Pedagogical Civil Engineering Studio',
        'Technical training modules, engineering syllabus curriculum, civil construction lecture notes, and staff vocational development builder.',
        'Curriculum Guide (A4 PDF & Word)'
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Section 4: Step-by-Step Navigation Instructions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('4. Visitor & Client Step-by-Step Walkthrough (Including 2,199 XAF Document Unlock)', margin, y);
  y += 5;

  const workflows = [
    {
      step: 'Step 1: Instant Budget Estimation & 2026 Regional Cost Guide',
      desc: '1. Click "Tools > Budget Calculator" or "Cost Guide 2026" in the top navigation bar.\n2. Choose your building type (Villa, Apartment Block, Commercial Complex, Warehouse), floor area (m²), and region.\n3. Review instant FCFA material quantities (cement bags, rebar tons, sand/gravel trucks) & phased costs.'
    },
    {
      step: 'Step 2: Official Document & Receipt Payment (2,199 XAF) + Admin OK Unlock Workflow',
      desc: '1. Clients pay only 2,199 XAF via MTN MoMo (671063511, 683316486) or Orange Money (689115595, 640194505).\n2. Submit payment in the Payment Gate Modal; status enters PENDING_ADMIN_CONFIRMATION (downloads remain locked).\n3. Admin reviews & clicks "Confirm & Press OK" in Admin Dashboard -> dispatches SMTP confirmation to kreboya603@gmail.com.\n4. Only after Admin presses OK do all Receipt, BoQ, PDF, Word & Excel download links unlock! (Admin downloads for free).'
    },
    {
      step: 'Step 3: Requesting a Custom Quote, Bidding on Tenders & Verifying Documents',
      desc: '1. Use "Request a Quote" or "Schedule Consultation" to submit blueprints and book a senior civil engineer.\n2. Visit "Verify Document" (#verify) to scan QR codes or verify official MADECC receipts (RCP-...) and contracts (CNT-...).'
    }
  ];

  workflows.forEach(wf => {
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(deepBlue[0], deepBlue[1], deepBlue[2]);
    doc.text(wf.step, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(wf.desc, contentWidth - 6);
    doc.text(splitDesc, margin + 3, y + 8.5);

    y += 22;
  });

  // =========================================================================
  // PAGE 3: SOCIAL MEDIA STUDIO & META APP REVIEW TESTING PROTOCOL
  // =========================================================================
  doc.addPage();
  currentPage++;
  drawHeaderFooter(doc, currentPage);

  y = 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(deepBlue[0], deepBlue[1], deepBlue[2]);
  doc.text('5. Social Media Studio & Meta App Review Protocol', margin, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  const socialIntro = 
    'The Social Media Studio enables centralized multi-platform publishing, scheduled campaigns, and webhook analytics ' +
    'across Facebook Pages, Instagram Graph, WhatsApp Business Cloud, and YouTube. ' +
    'The dedicated "social_media_reviewer" role isolates testers strictly to this interface with zero administrative risk.';
  const splitSocialIntro = doc.splitTextToSize(socialIntro, contentWidth);
  doc.text(splitSocialIntro, margin, y);
  y += splitSocialIntro.length * 4.5 + 4;

  // Reviewer Protocol Steps Table
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235], // Blue 600
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
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 42 },
      2: { cellWidth: 'auto' }
    },
    head: [['Review Step', 'Platform API Under Test', 'Testing Instructions & Verification Outcomes']],
    body: [
      [
        'Phase 1: Login & Role Isolation',
        'Authentication Guard & JWT Session',
        'Access via Login modal > "Email Login". Enter issued credentials. System auto-routes to Social Media Studio. Admin tabs are hidden for security.'
      ],
      [
        'Phase 2: Facebook Pages API',
        'pages_show_list, pages_read_engagement, pages_manage_posts',
        'Inspect connected "Madecc Group" Page (ID: 1055380190992758). Click "Publish Test Post" to verify live content distribution to Facebook Page feed.'
      ],
      [
        'Phase 3: Instagram Graph API',
        'instagram_basic, instagram_content_publish',
        'Inspect connected Instagram Business Account "@madeccgroupofficials" (ID: 17841439306172513). Verify media container generation and carousel publishing.'
      ],
      [
        'Phase 4: WhatsApp Business API',
        'whatsapp_business_messaging, management',
        'Inspect WhatsApp Cloud Account (+237 671 063 511). Test templated client notification broadcasts and inbound webhook delivery simulations.'
      ],
      [
        'Phase 5: Audit & Security Trail',
        'Postgres Audit Logging Ledger',
        'Every publish, schedule, and token verification action is logged with IP timestamp, session ID, and HTTP status code for full compliance.'
      ]
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Contact Matrix & Official Coordinates
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('6. Direct Support, Verification & Emergency Contacts', margin, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'plain',
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold', textColor: [30, 58, 138] },
      1: { cellWidth: 'auto' }
    },
    body: [
      ['Primary Executive Administrator:', 'Eric Kreboya (Managing Director & Lead Engineer)'],
      ['Direct Contact & Admin SMTP:', 'kreboya603@gmail.com (Prompt 24/7 Response & Receipt Dispatch)'],
      ['Official MTN Mobile Money (MoMo):', `671063511 / 683316486 (Receipts: 2,199 XAF | PDF Manuals: ${MANUAL_DOWNLOAD_FEE_XAF} XAF)`],
      ['Official Orange Money (OM):', '689115595 / 640194505 (Unlocks after Admin Confirm & OK)'],
      ['Primary WhatsApp Channel:', '+237 671 063 511 / +237 640 194 505'],
      ['Official Website URL:', 'https://madeccgroup.online'],
      ['Headquarters Address:', 'MADECC GROUP S.A.R.L, Mbankolo / Omnisports, Yaoundé, Centre Region, Cameroon'],
      ['Business Classification:', 'Civil Engineering, Geotechnics, Renewable Energy & Cloud Systems']
    ]
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Final Sign-Off Stamp
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.setDrawColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(emeraldGreen[0], emeraldGreen[1], emeraldGreen[2]);
  doc.text('DOCUMENT VERIFICATION STAMP: APPROVED FOR PLATFORM AUDIT & USER OPERATIONS', margin + 4, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('This document serves as the official navigational reference for the MADECC GROUP ecosystem. For technical inquiries, contact support directly.', margin + 4, y + 10);
  doc.text('MADECC GROUP S.A.R.L © 2026. All Rights Reserved. ISO 9001 & OHADA Compliant Documentation.', margin + 4, y + 14);

  return doc;
}

export function forceDownloadWebsiteNavigationGuidePdf(options: NavigationGuideOptions = {}): void {
  const doc = generateWebsiteNavigationGuidePdf(options);
  doc.save('MADECC_Group_Website_Navigation_Manual_A4.pdf');
}

export function downloadWebsiteNavigationGuidePdf(options: NavigationGuideOptions = {}): void {
  if (options.bypassPaymentGate) {
    forceDownloadWebsiteNavigationGuidePdf(options);
    return;
  }
  if (!isCurrentUserAdmin() && isReceiptPaid(NAVIGATION_MANUAL_RECEIPT_NO)) {
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
