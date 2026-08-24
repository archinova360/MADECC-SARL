import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer
} from 'docx';
import { saveAs } from 'file-saver';

export interface SocialPostItem {
  id: number | string;
  title: string;
  seoTopic?: string;
  targetPlatforms: string[];
  caption: string;
  hashtags?: string;
  ctaText?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document' | 'gallery';
  status: 'DRAFT' | 'APPROVED' | 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'PARTIALLY_PUBLISHED' | 'FAILED' | 'SCHEDULED' | 'CANCELLED';
  scheduledAt?: string;
  publishedAt?: string;
  reachEstimate?: number;
  engagementCount?: number;
  createdAt?: string;
}

export interface SocialChannelItem {
  id: number | string;
  platform: string;
  channelName: string;
  accountHandle?: string;
  status: string;
  isCustom?: boolean;
}

// ============================================================================
// 1. A4 PDF EXPORT: SOCIAL MEDIA CONTENT CALENDAR & POST DIRECTORY
// ============================================================================
export function generateSocialCalendarPdf(posts: SocialPostItem[], channels: SocialChannelItem[]): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor = [15, 23, 42]; // Slate 900
  const goldColor = [217, 119, 6];   // Amber 600

  // Header Banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFillColor(goldColor[0], goldColor[1], goldColor[2]);
  doc.rect(0, 24, 297, 2, 'F');

  // Company Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('MADECC GROUP S.A. - SOCIAL MEDIA & SEO CONTENT CALENDAR', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} | Central Africa Region (Douala/Yaoundé)`, 14, 19);

  // Summary Metrics
  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const scheduledCount = posts.filter(p => p.status === 'SCHEDULED').length;
  const draftCount = posts.filter(p => p.status === 'DRAFT').length;

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Content Operations Overview', 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Total Posts: ${posts.length}  |  Published: ${publishedCount}  |  Scheduled: ${scheduledCount}  |  Drafts: ${draftCount}  |  Active Channels: ${channels.length}`, 14, 40);

  // Table rows setup
  const tableData = posts.map(post => [
    post.id.toString(),
    post.title || 'Untitled',
    (post.targetPlatforms || []).map(p => p.toUpperCase()).join(', '),
    post.caption.length > 80 ? post.caption.substring(0, 80) + '...' : post.caption,
    post.hashtags || '#MADECCGroup',
    post.status,
    post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString('en-GB') : (post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-GB') : 'Immediate')
  ]);

  autoTable(doc, {
    startY: 46,
    head: [['ID', 'Post Title & Topic', 'Target Platforms', 'SEO Caption Excerpt', 'Hashtags', 'Status', 'Publish Date']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 12, fontStyle: 'bold' },
      1: { cellWidth: 50, fontStyle: 'bold' },
      2: { cellWidth: 40 },
      3: { cellWidth: 90 },
      4: { cellWidth: 40 },
      5: { cellWidth: 22, fontStyle: 'bold' },
      6: { cellWidth: 25 }
    },
    didDrawPage: (data) => {
      // Footer
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`MADECC Group S.A. Social Media & SEO Studio - Page ${data.pageNumber} of ${totalPages}`, 14, 202);
    }
  });

  doc.save(`MADECC_Social_Media_Content_Calendar_${Date.now()}.pdf`);
}

// ============================================================================
// 2. WORD (.DOCX) EXPORT: SOCIAL MEDIA CONTENT CALENDAR
// ============================================================================
export async function generateSocialCalendarDocx(posts: SocialPostItem[], channels: SocialChannelItem[]): Promise<void> {
  const children: any[] = [];

  // Document Title Header
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'MADECC GROUP S.A. - SOCIAL MEDIA & SEO CONTENT REPORT',
          bold: true,
          size: 28,
          color: '0F172A'
        })
      ]
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Official Central Africa Corporate Broadcast & Marketing Schedule | ${new Date().toLocaleDateString('en-GB')}`,
          italics: true,
          size: 18,
          color: 'D97706'
        })
      ]
    })
  );

  children.push(new Paragraph({ text: '' }));

  // Channels Overview Paragraph
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({ text: '1. Connected Social Media Channels & Platforms', bold: true, size: 22, color: '0F172A' })
      ]
    })
  );

  const channelText = channels.map(c => `${c.channelName} (${c.platform.toUpperCase()} - ${c.accountHandle || 'Active'})`).join('\n• ');
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `• ${channelText}`, size: 18, color: '334155' })
      ]
    })
  );

  children.push(new Paragraph({ text: '' }));

  // Posts Table
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({ text: '2. Social Media Posts & SEO Media Schedule', bold: true, size: 22, color: '0F172A' })
      ]
    })
  );

  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Title & SEO Topic', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Target Platforms', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Caption & Hashtags', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'CTA & Contact', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } }),
        new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: 'Status & Date', bold: true, color: 'FFFFFF', size: 16 })] })], shading: { fill: '0F172A' } })
      ]
    })
  ];

  posts.forEach((post, index) => {
    const bg = index % 2 === 0 ? 'F8FAFC' : 'FFFFFF';
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: post.title, bold: true, size: 16, color: '0F172A' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: (post.targetPlatforms || []).join(', ').toUpperCase(), size: 14, color: 'D97706', bold: true })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 40, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `${post.caption}\n\n${post.hashtags || ''}`, size: 14, color: '334155' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: post.ctaText || 'Contact MADECC', size: 14, color: '2563EB' })] })], shading: { fill: bg } }),
          new TableCell({ width: { size: 15, type: WidthType.PERCENTAGE }, children: [new Paragraph({ children: [new TextRun({ text: `${post.status}\n${post.scheduledAt ? new Date(post.scheduledAt).toLocaleDateString('en-GB') : 'Immediate'}`, bold: true, size: 14, color: post.status === 'PUBLISHED' ? '059669' : 'D97706' })] })], shading: { fill: bg } })
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
        left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
        insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' }
      }
    })
  );

  const docxObj = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'MADECC GROUP S.A. | Social Media & SEO Studio', size: 14, color: '94A3B8' })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Confidential Internal Marketing Document - MADECC Group Cameroon', size: 14, color: '94A3B8' })
                ]
              })
            ]
          })
        },
        children
      }
    ]
  });

  const blob = await Packer.toBlob(docxObj);
  saveAs(blob, `MADECC_Social_Media_Report_${Date.now()}.docx`);
}

// ============================================================================
// 3. A4 PDF EXPORT: SINGLE POST DOSSIER (ENGINEERING & MARKETING SPECIFICATION)
// ============================================================================
export function generateSinglePostPdf(post: SocialPostItem): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const slate900 = [15, 23, 42];
  const amber600 = [217, 119, 6];
  const slate600 = [71, 85, 105];

  // Header Banner
  doc.setFillColor(slate900[0], slate900[1], slate900[2]);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setFillColor(amber600[0], amber600[1], amber600[2]);
  doc.rect(0, 26, 210, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('MADECC GROUP S.A. — CORPORATE BROADCAST DOSSIER', 14, 12);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Official Central Africa Marketing & SEO Asset Record | Ref: #DOC-${post.id}`, 14, 18);
  doc.text(`Issued: ${new Date().toLocaleString('en-GB')} | Douala, Cameroon`, 14, 22);

  // Metadata Table
  const metaRows = [
    ['Post ID', `#${post.id}`, 'Current Status', post.status || 'DRAFT'],
    ['Campaign Topic', post.seoTopic || post.title || 'General Engineering Update', 'Target Outlets', (post.targetPlatforms || []).join(', ').toUpperCase() || 'MULTI-CHANNEL'],
    ['Media Type', (post.mediaType || 'image').toUpperCase(), 'Scheduled / Published', post.scheduledAt ? new Date(post.scheduledAt).toLocaleString('en-GB') : (post.publishedAt ? new Date(post.publishedAt).toLocaleString('en-GB') : 'Immediate')]
  ];

  autoTable(doc, {
    startY: 32,
    body: metaRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 32 },
      1: { cellWidth: 63 },
      2: { fontStyle: 'bold', fillColor: [241, 245, 249], cellWidth: 35 },
      3: { cellWidth: 50, fontStyle: 'bold' }
    }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 8;

  // Title Section
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('1. Post Headline & SEO Title', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text(post.title || 'Untitled Post', 14, currentY + 5);

  currentY += 14;

  // Published Caption
  doc.setTextColor(slate900[0], slate900[1], slate900[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('2. Marketing Copy & Technical Content', 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const splitCaption = doc.splitTextToSize(post.caption || 'No copy text provided.', 182);
  doc.text(splitCaption, 14, currentY + 5);

  currentY = currentY + 5 + (splitCaption.length * 4.5) + 6;

  // Standardized CTAs
  if (post.ctaText) {
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('3. Verified Call to Action (CTA) & Executive Contacts', 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(180, 83, 9);
    const splitCta = doc.splitTextToSize(post.ctaText, 182);
    doc.text(splitCta, 14, currentY + 5);
    currentY += 5 + (splitCta.length * 4.2) + 6;
  }

  // Hashtags
  if (post.hashtags) {
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('4. SEO Hashtags & Keyword Distribution', 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(37, 99, 235);
    const splitHash = doc.splitTextToSize(post.hashtags, 182);
    doc.text(splitHash, 14, currentY + 5);
    currentY += 5 + (splitHash.length * 4.2) + 6;
  }

  // Media Attachment
  if (post.mediaUrl) {
    doc.setTextColor(slate900[0], slate900[1], slate900[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('5. Verified Media Asset URL', 14, currentY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    const splitMedia = doc.splitTextToSize(post.mediaUrl, 182);
    doc.text(splitMedia, 14, currentY + 5);
    currentY += 5 + (splitMedia.length * 4) + 6;
  }

  // Page Footer
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(slate600[0], slate600[1], slate600[2]);
    doc.text(`MADECC GROUP S.A. | Civil Engineering & BOQ Masterclass | Page ${i} of ${totalPages}`, 14, 288);
    doc.text('Confidential Internal Engineering & Marketing Record', 130, 288);
  }

  doc.save(`MADECC_Dossier_Post_${post.id}_${Date.now()}.pdf`);
}

/**
 * Technical JSON Dossier Download
 */
export function exportPostJsonDossier(post: SocialPostItem): void {
  const dossier = {
    dossierType: 'MADECC_SOCIAL_BROADCAST_DOSSIER',
    version: '2.0-hardened',
    exportedAt: new Date().toISOString(),
    issuer: 'MADECC Group S.A. Cameroon',
    post: {
      id: post.id,
      title: post.title,
      topic: post.seoTopic,
      targetPlatforms: post.targetPlatforms,
      caption: post.caption,
      hashtags: post.hashtags,
      ctaText: post.ctaText,
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType || 'image',
      status: post.status,
      scheduledAt: post.scheduledAt,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt
    },
    organization: {
      name: 'MADECC Group S.A.',
      domains: ['madeccgroup.online', 'madeccgroup.com'],
      primaryWhatsApp: '+237 671 063 511',
      secondaryContact: '+237 683 316 486',
      standards: ['Eurocode 2', 'Eurocode 8', 'NF EN 1990']
    }
  };

  const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: 'application/json' });
  saveAs(blob, `MADECC_Dossier_Post_${post.id}_${Date.now()}.json`);
}
