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

export interface StaffExportItem {
  id?: number | string;
  employeeNumber: string;
  fullName: string;
  email: string;
  department: string;
  position: string;
  salaryXaf?: number | string;
  allowancesXaf?: number | string;
  bankDetails?: string;
  engineeringRegistration?: string;
  skills?: string[] | string;
  certifications?: string[] | string;
  status?: string;
  approvalStatus?: string;
  reportingManager?: string;
  loginKey?: string;
}

function sanitizeFilename(str: string): string {
  if (!str) return 'MADECC_Staff_Ledger';
  return str.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Generate Microsoft Word (.docx) Staff HR Ledger & Directory Document
 */
export async function generateStaffDirectoryDocx(
  staffList: StaffExportItem[],
  companyName = 'MADECC GROUP S.A.R.L.'
): Promise<{ blob: Blob; filename: string }> {
  const children: any[] = [];

  // Header Branding
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
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
      children: [
        new TextRun({
          text: 'CIVIL & STRUCTURAL ENGINEERING | HR MANAGEMENT & STAFF DIRECTORY',
          bold: true,
          size: 18,
          color: '475569'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Douala & Yaoundé, Republic of Cameroon | Official Certified Roster | Date: ${new Date().toLocaleDateString('en-GB')}`,
          italics: true,
          size: 16,
          color: '64748B'
        })
      ],
      spacing: { after: 200 }
    })
  );

  // Summary Banner
  const totalEmployees = staffList.length;
  const activeCount = staffList.filter(s => s.status !== 'ARCHIVED' && s.status !== 'REVOKED').length;
  const approvedCount = staffList.filter(s => s.approvalStatus === 'APPROVED' || s.status === 'ACTIVATED' || s.status === 'ACTIVE').length;

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'STAFF DIRECTORY OVERVIEW & EXECUTIVE METRICS', bold: true, size: 22, color: '0F172A' })
      ],
      spacing: { before: 100, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `Total Staff Registered: ${totalEmployees}   |   Active Personnel: ${activeCount}   |   Certified & Approved: ${approvedCount}`, bold: true, size: 18, color: '059669' })
      ],
      spacing: { after: 200 }
    })
  );

  // Table Columns Header
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Emp No.', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Full Name', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Department & Role', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Email & Contact', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'ONIGC / Reg Cert', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } })
      ]
    })
  ];

  staffList.forEach((staff, idx) => {
    const isEven = idx % 2 === 0;
    const bg = isEven ? 'F8FAFC' : 'FFFFFF';

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ width: { size: 12, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: staff.employeeNumber || 'N/A', bold: true, size: 15, color: 'D97706' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: staff.fullName, bold: true, size: 16, color: '0F172A' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 18, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `${staff.position}\n(${staff.department})`, size: 14, color: '334155' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 22, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: staff.email, size: 14, color: '2563EB' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 16, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: staff.engineeringRegistration || 'Standard', size: 14, color: '475569' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 10, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: staff.status || 'ACTIVE', bold: true, size: 14, color: staff.status === 'ACTIVE' || staff.status === 'ACTIVATED' ? '059669' : staff.status === 'ARCHIVED' ? '64748B' : 'DC2626' })] })], shading: { fill: bg } })
        ]
      })
    );
  });

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: tableRows,
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
      }
    })
  );

  // Sign-off section
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: '\nOFFICIAL HR CERTIFICATION & SEAL', bold: true, size: 20, color: '0F172A' })
      ],
      spacing: { before: 300, after: 100 }
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `This document certifies that the listed personnel are duly recognized employees or authorized officers of ${companyName}. All structural, quantity surveying, and site management activities are authorized in accordance with Cameroonian Law and ONIGC standards.`, italics: true, size: 15, color: '475569' })
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
  const filename = `${sanitizeFilename(companyName)}_Staff_Directory_${new Date().toISOString().split('T')[0]}.docx`;

  return { blob, filename };
}

/**
 * Generate A4 PDF Staff Directory Document
 */
export async function generateStaffDirectoryPdf(
  staffList: StaffExportItem[],
  companyName = 'MADECC GROUP S.A.R.L.'
): Promise<{ pdf: jsPDF; filename: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 32, 'F');

  // Accent Line
  doc.setFillColor(217, 119, 6); // Amber-600
  doc.rect(0, 31, pageWidth, 1.5, 'F');

  // Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(companyName, margin, 13);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(217, 119, 6);
  doc.text('CIVIL ENGINEERING, QUANTITY SURVEYING & HR MANAGEMENT ROSTER', margin, 18);

  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Official A4 Certified Directory | Date: ${new Date().toLocaleDateString('en-GB')}`, margin, 23);

  doc.text(`Total Staff: ${staffList.length}`, pageWidth - margin - 25, 18, { align: 'right' });

  let y = 40;

  // Directory Table Headers
  const cols = [
    { title: 'EMP NO.', width: 25 },
    { title: 'FULL NAME', width: 45 },
    { title: 'DEPARTMENT / POSITION', width: 48 },
    { title: 'EMAIL ADDRESS', width: 42 },
    { title: 'STATUS', width: 22 }
  ];

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);

  let currentX = margin + 2;
  cols.forEach(c => {
    doc.text(c.title, currentX, y + 5.5);
    currentX += c.width;
  });

  y += 9;

  staffList.forEach((staff, idx) => {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;

      // Repeat Table Header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      let rx = margin + 2;
      cols.forEach(c => {
        doc.text(c.title, rx, y + 5.5);
        rx += c.width;
      });

      y += 9;
    }

    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 1, pageWidth - (margin * 2), 10, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(217, 119, 6);
    doc.text(staff.employeeNumber || 'EMP-N/A', margin + 2, y + 4.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    const nameTruncated = staff.fullName.length > 25 ? staff.fullName.slice(0, 24) + '…' : staff.fullName;
    doc.text(nameTruncated, margin + 27, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const posTruncated = staff.position.length > 28 ? staff.position.slice(0, 27) + '…' : staff.position;
    doc.text(`${staff.department} — ${posTruncated}`, margin + 72, y + 4.5);

    doc.setTextColor(37, 99, 235);
    const emailTruncated = staff.email.length > 24 ? staff.email.slice(0, 23) + '…' : staff.email;
    doc.text(emailTruncated, margin + 120, y + 4.5);

    const st = staff.status || 'ACTIVE';
    if (st === 'ACTIVE' || st === 'ACTIVATED') {
      doc.setTextColor(5, 150, 105);
    } else if (st === 'ARCHIVED') {
      doc.setTextColor(100, 116, 139);
    } else {
      doc.setTextColor(220, 38, 38);
    }
    doc.setFont('helvetica', 'bold');
    doc.text(st, margin + 162, y + 4.5);

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y + 8, pageWidth - margin, y + 8);

    y += 10;
  });

  // Stamp and Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`${companyName} — Official Certified Staff Ledger | Page ${i} of ${pageCount}`, margin, pageHeight - 8);
    doc.text('CONFIDENTIAL & PROPRIETARY', pageWidth - margin, pageHeight - 8, { align: 'right' });
  }

  const filename = `${sanitizeFilename(companyName)}_Staff_Roster_${new Date().toISOString().split('T')[0]}.pdf`;
  return { pdf: doc, filename };
}

/**
 * Generate Individual Staff Member A4 Dossier PDF
 */
export async function generateIndividualStaffDossierPdf(
  staff: StaffExportItem,
  companyName = 'MADECC GROUP S.A.R.L.'
): Promise<{ pdf: jsPDF; filename: string }> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setFillColor(217, 119, 6);
  doc.rect(0, 37, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(companyName, margin, 15);

  doc.setFontSize(10);
  doc.setTextColor(217, 119, 6);
  doc.text('OFFICIAL EMPLOYEE HR DOSSIER & CERTIFIED DIRECTORY PROFILE', margin, 22);

  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text(`Employee Ref: ${staff.employeeNumber || 'N/A'} | Issued: ${new Date().toLocaleDateString('en-GB')}`, margin, 28);

  // Status Stamp
  doc.setFillColor(16, 185, 129);
  doc.rect(pageWidth - margin - 35, 12, 35, 14, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(staff.approvalStatus === 'APPROVED' || staff.status === 'ACTIVATED' ? 'CERTIFIED' : staff.status || 'ACTIVE', pageWidth - margin - 17.5, 20, { align: 'center' });

  let y = 48;

  // Profile Card Box
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 38, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text(staff.fullName, margin + 6, y + 10);

  doc.setFontSize(10);
  doc.setTextColor(217, 119, 6);
  doc.text(`${staff.position} (${staff.department})`, margin + 6, y + 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Email Address: ${staff.email}`, margin + 6, y + 25);
  doc.text(`Engineering Registration: ${staff.engineeringRegistration || 'ONIGC Certified Professional'}`, margin + 6, y + 31);

  doc.text(`Reporting Manager: ${staff.reportingManager || 'Managing Director'}`, pageWidth - margin - 80, y + 25);
  doc.text(`Account Status: ${staff.status || 'ACTIVE'}`, pageWidth - margin - 80, y + 31);

  y += 46;

  // Section 1: Financial & Compensation Ledger
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. COMPENSATION & BANK PAYROLL DETAILS', margin + 4, y + 5);

  y += 11;
  const salXaf = staff.salaryXaf ? Number(staff.salaryXaf).toLocaleString() : '1,200,000';
  const alwXaf = staff.allowancesXaf ? Number(staff.allowancesXaf).toLocaleString() : '200,000';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Base Monthly Salary (XAF): ${salXaf} XAF`, margin + 4, y);
  doc.text(`Monthly Allowances (XAF): ${alwXaf} XAF`, margin + 95, y);

  y += 7;
  doc.text(`Bank Account Details: ${staff.bankDetails || 'BICEC Douala Main - Acc #004829104'}`, margin + 4, y);

  y += 14;

  // Section 2: Technical Skills & Certifications
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - (margin * 2), 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('2. TECHNICAL COMPETENCIES & ENGINEERING CERTIFICATIONS', margin + 4, y + 5);

  y += 11;
  const skillsStr = Array.isArray(staff.skills) ? staff.skills.join(', ') : staff.skills || 'Eurocode EN 1992, BOQ Preparation, FIDIC Red Book';
  const certsStr = Array.isArray(staff.certifications) ? staff.certifications.join(', ') : staff.certifications || 'ONIGC Registered Engineer, RICS Fellow';

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Core Engineering Skills: ${skillsStr}`, margin + 4, y);
  y += 7;
  doc.text(`Official Certifications: ${certsStr}`, margin + 4, y);

  y += 18;

  // Official Stamp & Signature Block
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('AUTHORIZED HR SIGNATURE & COMPANY SEAL:', margin, y);

  // Seal Circle
  doc.setDrawColor(217, 119, 6);
  doc.setFillColor(254, 243, 199);
  doc.circle(pageWidth - margin - 25, y + 10, 14, 'FD');
  doc.setFontSize(6);
  doc.setTextColor(180, 83, 9);
  doc.text('MADECC S.A.R.L.', pageWidth - margin - 25, y + 9, { align: 'center' });
  doc.text('SEALED HR', pageWidth - margin - 25, y + 12, { align: 'center' });

  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Ing. Marcel Mbida, PE — Chief Managing Director', margin, y);
  doc.text(`Generated automatically by ${companyName} HR Platform on ${new Date().toLocaleString()}`, margin, y + 5);

  const filename = `${sanitizeFilename(staff.fullName)}_${staff.employeeNumber}_Dossier.pdf`;
  return { pdf: doc, filename };
}

/**
 * Generate Individual Staff Member Word (.docx) Dossier
 */
export async function generateIndividualStaffDossierDocx(
  staff: StaffExportItem,
  companyName = 'MADECC GROUP S.A.R.L.'
): Promise<{ blob: Blob; filename: string }> {
  const children: any[] = [];

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: companyName,
          bold: true,
          size: 32,
          color: 'D97706'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'INDIVIDUAL EMPLOYEE HR DOSSIER & CERTIFIED RECORDS',
          bold: true,
          size: 20,
          color: '0F172A'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Employee ID: ${staff.employeeNumber} | Date: ${new Date().toLocaleDateString('en-GB')}`,
          italics: true,
          size: 16,
          color: '64748B'
        })
      ],
      spacing: { after: 200 }
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Full Name: ${staff.fullName}`, bold: true, size: 22, color: '0F172A' })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `Position: ${staff.position} (${staff.department})`, bold: true, size: 18, color: 'D97706' })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `Email: ${staff.email}`, size: 16, color: '2563EB' })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `Engineering Registration: ${staff.engineeringRegistration || 'ONIGC Certified Professional'}`, size: 16, color: '334155' })]
    }),
    new Paragraph({
      children: [new TextRun({ text: `Account Status: ${staff.status || 'ACTIVE'}`, bold: true, size: 16, color: '059669' })],
      spacing: { after: 200 }
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${sanitizeFilename(staff.fullName)}_${staff.employeeNumber}_Dossier.docx`;

  return { blob, filename };
}
