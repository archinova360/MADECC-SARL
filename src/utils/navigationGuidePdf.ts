import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  doc.text('OFFICIAL PLATFORM NAVIGATION & OPERATIONAL MANUAL', margin + 8, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Complete user guide for Engineering Services, ERP, Technical Studios, and Social Media Review.', margin + 8, 36);
  doc.text(`Version 2.4 | Classification: Official Guide | Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 8, 42);

  let y = 55;

  // Section 1: Executive Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('1. Executive Architecture & Mission', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const introText = 
    'The MADECC Group digital platform is an enterprise-grade web application uniting multi-disciplinary ' +
    'civil & structural engineering, renewable energy modeling, construction project management, and automated ' +
    'document intelligence. Built for public clients, enterprise contractors, and authenticated auditors, ' +
    'this document outlines full navigation pathways across every module.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, y);
  y += splitIntro.length * 4.5 + 4;

  // Section 2: Global Navigation Header Layout Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.text('2. Primary Navigation Hierarchy & Modules', margin, y);
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
      0: { cellWidth: 32, fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 30 }
    },
    head: [['Navigation Tab', 'URL / Target', 'Core Functionality & Interactive Tools', 'Access Level']],
    body: [
      ['Home (Acceuil)', '#home', 'Brand identity, engineering portfolio highlights, stats, and client reviews', 'Public (All)'],
      ['Services', '#services', 'Civil works, road design, geotechnical studies, structural integrity & green energy', 'Public (All)'],
      ['Projects & Portfolio', '#projects', 'Live filterable project gallery with CAD blueprints, status, and specs', 'Public (All)'],
      ['Sustainability & Solar', '#sustainability', 'Solar power ROI estimator, carbon mitigation modeling, ESG compliance', 'Public (All)'],
      ['Cost Calculator', '#calculator', 'Interactive construction budget calculator, m² cost estimations, and quote engine', 'Public (All)'],
      ['Tenders & Procurement', '#tenders', 'Active construction tenders, RFPs, contractor bidding guidelines', 'Public (All)'],
      ['Contact & Booking', '#contact', 'Consultation scheduler, direct quotation submissions, emergency dispatch', 'Public (All)'],
      ['Client Portal / Admin', '#admin', 'Enterprise ERP, BoQ Studio, Structural Calculator, Social Media Studio', 'Protected / Role-Based']
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
  doc.text('4. Step-by-Step Navigation Workflows', margin, y);
  y += 5;

  const workflows = [
    {
      step: 'Step 1: Generating a Client Bill of Quantities (BoQ)',
      desc: '1. Navigate to Client Portal / Admin > Enter workspace.\n2. Select "BoQ Studio" from the Command Center sidebar.\n3. Click "+ Create New BoQ" > Enter Project Name (e.g. Douala Commercial Complex).\n4. Add items: Earthworks, Reinforced Concrete, Masonry, Roofing, Finishes.\n5. Click "Export PDF" for instant A4 client-ready quotation.'
    },
    {
      step: 'Step 2: Performing Structural Calculations',
      desc: '1. Select "Structural Calculator" from the Engineering Suite.\n2. Input Span length (m), Characteristic Dead Load Gk (kN/m²), and Live Load Qk (kN/m²).\n3. Choose concrete strength class (e.g., C25/30) and steel grade (B500B).\n4. View bending moment diagrams and reinforcement steel bar area (As_req).'
    }
  ];

  workflows.forEach(wf => {
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.roundedRect(margin, y, contentWidth, 22, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(deepBlue[0], deepBlue[1], deepBlue[2]);
    doc.text(wf.step, margin + 3, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(wf.desc, contentWidth - 6);
    doc.text(splitDesc, margin + 3, y + 9);

    y += 25;
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
      ['Direct Contact Email:', 'kreboya603@gmail.com (Prompt 24/7 Response)'],
      ['Primary WhatsApp Channel:', '+237 671 063 511 (Instant Credential Dispatch)'],
      ['Secondary WhatsApp Channel:', '+237 640 194 505'],
      ['Official Website URL:', 'https://madeccgroup.online'],
      ['Headquarters Address:', 'MADECC Group S.A.R.L, Omnisports / Bastos, Yaoundé, Centre Region, Cameroon'],
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
  doc.text('This document serves as the official navigational reference for the MADECC Group ecosystem. For technical inquiries, contact support directly.', margin + 4, y + 10);
  doc.text('MADECC GROUP S.A.R.L © 2026. All Rights Reserved. ISO 9001 & OHADA Compliant Documentation.', margin + 4, y + 14);

  return doc;
}

export function downloadWebsiteNavigationGuidePdf(options: NavigationGuideOptions = {}): void {
  const doc = generateWebsiteNavigationGuidePdf(options);
  doc.save('MADECC_Group_Website_Navigation_Manual_A4.pdf');
}
