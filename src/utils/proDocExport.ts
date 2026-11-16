import { jsPDF } from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ExternalHyperlink,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  PageOrientation,
  convertMillimetersToTwip,
  VerticalAlign,
} from 'docx';
import { ProDocument } from '../types/proDocumentTypes.ts';
import type { VerifiedCompanyInfo } from '../services/proDocStudioService.ts';

interface InlineSegment {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  color: string;
  fontSizePt?: number;
  fontFamily?: string;
  href?: string;
}

function sanitizeFilename(input: string): string {
  return String(input || 'MADECC_Document')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72) || 'MADECC_Document';
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = String(hex || '#0F172A').replace('#', '').trim();
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return [
      parseInt(cleaned.slice(0, 2), 16),
      parseInt(cleaned.slice(2, 4), 16),
      parseInt(cleaned.slice(4, 6), 16),
    ];
  }
  return [15, 23, 42];
}

function parseFontSizePt(val?: string): number | undefined {
  if (!val) return undefined;
  const num = parseFloat(val);
  if (isNaN(num)) return undefined;
  if (val.endsWith('px')) return Math.max(7, Math.min(36, Math.round((num * 0.75) * 10) / 10));
  return Math.max(7, Math.min(36, num));
}

function extractInlineSegments(nodes: any[] = [], inheritedColor = '#1E293B'): InlineSegment[] {
  const segments: InlineSegment[] = [];
  for (const node of nodes) {
    if (!node) continue;
    if (node.type === 'hardBreak') {
      segments.push({ text: '\n', bold: false, italic: false, underline: false, strike: false, color: inheritedColor });
      continue;
    }
    if (node.type === 'text') {
      const marks = Array.isArray(node.marks) ? node.marks : [];
      let bold = false;
      let italic = false;
      let underline = false;
      let strike = false;
      let color = inheritedColor;
      let fontSizePt: number | undefined;
      let fontFamily: string | undefined;
      let href: string | undefined;

      for (const m of marks) {
        if (m.type === 'bold') bold = true;
        if (m.type === 'italic') italic = true;
        if (m.type === 'underline') underline = true;
        if (m.type === 'strike') strike = true;
        if (m.type === 'link' && m.attrs?.href) {
          href = String(m.attrs.href);
          underline = true;
          color = '#B45309';
        }
        if (m.type === 'textStyle' && m.attrs) {
          if (m.attrs.color) color = String(m.attrs.color);
          if (m.attrs.fontSize) fontSizePt = parseFontSizePt(String(m.attrs.fontSize));
          if (m.attrs.fontFamily) fontFamily = String(m.attrs.fontFamily);
        }
      }

      segments.push({
        text: String(node.text || ''),
        bold,
        italic,
        underline,
        strike,
        color,
        fontSizePt,
        fontFamily,
        href,
      });
    } else if (Array.isArray(node.content)) {
      segments.push(...extractInlineSegments(node.content, inheritedColor));
    }
  }
  return segments;
}

function flattenText(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return String(node.text || '');
  if (node.type === 'hardBreak') return '\n';
  if (Array.isArray(node.content)) {
    return node.content.map(flattenText).join(node.type === 'paragraph' ? '\n' : '');
  }
  return '';
}

function mapPdfFont(family?: string): 'helvetica' | 'times' | 'courier' {
  const f = (family || '').toLowerCase();
  if (f.includes('serif') || f.includes('georgia') || f.includes('times')) return 'times';
  if (f.includes('mono') || f.includes('courier')) return 'courier';
  return 'helvetica';
}

async function fetchImageBytes(url: string): Promise<{ dataUrl: string; bytes: Uint8Array; ext: 'png' | 'jpg' } | null> {
  if (!url) return null;
  try {
    if (url.startsWith('data:image/')) {
      const match = url.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/i);
      if (!match) return null;
      const ext: 'png' | 'jpg' = match[1].toLowerCase() === 'png' ? 'png' : 'jpg';
      const raw = atob(match[2]);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return { dataUrl: url, bytes, ext };
    }

    const resolvedUrl =
      url.startsWith('/') && typeof window !== 'undefined'
        ? `${window.location.origin}${url}`
        : url;
    if (!/^https?:\/\//i.test(resolvedUrl)) return null;

    const res = await fetch(resolvedUrl);
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const contentType = res.headers.get('content-type') || '';
    const ext: 'png' | 'jpg' = contentType.includes('png') || resolvedUrl.toLowerCase().endsWith('.png') ? 'png' : 'jpg';

    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return {
      dataUrl: `data:image/${ext === 'png' ? 'png' : 'jpeg'};base64,${base64}`,
      bytes,
      ext,
    };
  } catch {
    return null;
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2500);
}

/**
 * REAL VECTOR A4 PDF GENERATOR (NOT html2canvas screenshot)
 * Iterates ProseMirror contentJson and builds native vector typography, tables, page breaks,
 * corporate branding headers/footers, and executive endorsement signature tables.
 */
export async function generateProDocumentPdf(
  docRecord: ProDocument,
  verifiedCompany?: Partial<VerifiedCompanyInfo> | null
): Promise<{ pdf: jsPDF; blob: Blob; filename: string }> {
  const orientation = docRecord.orientation === 'landscape' ? 'landscape' : 'portrait';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = Math.max(12, Math.min(35, Number(docRecord.marginMm ?? 20)));
  const contentWidth = pageWidth - margin * 2;
  const topStartY = Math.max(margin, 24);
  const bottomLimitY = pageHeight - Math.max(margin, 20);

  const companyName = verifiedCompany?.companyName || docRecord.metadata?.companyName || 'MADECC GROUP';
  const companyPhone = verifiedCompany?.phone || docRecord.metadata?.companyPhone || '';
  const companyEmail = verifiedCompany?.email || docRecord.metadata?.companyEmail || '';
  const companyWebsite = verifiedCompany?.website || docRecord.metadata?.companyWebsite || 'https://madeccgroup.online';

  let y = topStartY;

  const drawPageHeaderStrip = (pageIndex: number) => {
    if (pageIndex === 1) {
      // Executive top letterhead band
      pdf.setFillColor(15, 23, 42);
      pdf.rect(margin, 9, contentWidth, 10.5, 'F');
      pdf.setFillColor(217, 119, 6);
      pdf.rect(margin, 19.5, contentWidth, 1.0, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(companyName.toUpperCase(), margin + 3.5, 14.3);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(251, 191, 36);
      const subLine = [companyWebsite, companyPhone, companyEmail].filter(Boolean).join('  |  ');
      pdf.text(subLine || 'Civil Engineering, Infrastructure & Turnkey Construction', margin + 3.5, 17.8);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(255, 255, 255);
      pdf.text(docRecord.documentNumber || 'MADECC-DOC', pageWidth - margin - 3.5, 14.3, { align: 'right' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(6.8);
      pdf.setTextColor(203, 213, 225);
      pdf.text(`v${docRecord.version || 1}  ·  ${docRecord.status || 'DRAFT'}`, pageWidth - margin - 3.5, 17.8, { align: 'right' });
    } else {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text((docRecord.headerText || companyName).slice(0, 90), margin, 12.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${docRecord.documentNumber} · v${docRecord.version || 1}`, pageWidth - margin, 12.5, { align: 'right' });
      pdf.setDrawColor(217, 119, 6);
      pdf.setLineWidth(0.35);
      pdf.line(margin, 14.5, pageWidth - margin, 14.5);
    }
  };

  drawPageHeaderStrip(1);

  const addNewPage = () => {
    pdf.addPage('a4', orientation);
    const currentPage = pdf.getNumberOfPages();
    drawPageHeaderStrip(currentPage);
    y = currentPage === 1 ? topStartY : Math.max(margin, 20);
  };

  const checkPageBreak = (neededHeightMm: number) => {
    if (y + neededHeightMm > bottomLimitY) {
      addNewPage();
    }
  };

  const renderInlineRuns = (
    segments: InlineSegment[],
    options: {
      baseFontSizePt: number;
      lineHeightMm: number;
      indentMm?: number;
      align?: string;
      prefix?: string;
      prefixBold?: boolean;
      prefixColor?: [number, number, number];
    }
  ) => {
    const indent = options.indentMm || 0;
    const availWidth = contentWidth - indent;
    const xStart = margin + indent;
    const align = options.align || 'left';

    type StyledToken = { text: string; seg: InlineSegment; isNewline?: boolean };
    const tokens: StyledToken[] = [];

    if (options.prefix) {
      tokens.push({
        text: options.prefix,
        seg: {
          text: options.prefix,
          bold: Boolean(options.prefixBold),
          italic: false,
          underline: false,
          strike: false,
          color: options.prefixColor ? `#${options.prefixColor.map((n) => n.toString(16).padStart(2, '0')).join('')}` : '#0F172A',
          fontSizePt: options.baseFontSizePt,
        },
      });
    }

    for (const seg of segments) {
      if (seg.text === '\n') {
        tokens.push({ text: '\n', seg, isNewline: true });
        continue;
      }
      const parts = seg.text.split(/(\s+)/);
      for (const p of parts) {
        if (!p) continue;
        if (p === '\n') {
          tokens.push({ text: '\n', seg, isNewline: true });
        } else {
          tokens.push({ text: p, seg });
        }
      }
    }

    if (tokens.length === 0) {
      y += options.lineHeightMm * 0.65;
      return;
    }

    const lines: { tokens: { text: string; seg: InlineSegment; w: number }[]; width: number }[] = [];
    let currentLine: { text: string; seg: InlineSegment; w: number }[] = [];
    let currentW = 0;

    const measureToken = (text: string, seg: InlineSegment): number => {
      const style = seg.bold && seg.italic ? 'bolditalic' : seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal';
      pdf.setFont(mapPdfFont(seg.fontFamily), style);
      pdf.setFontSize(seg.fontSizePt || options.baseFontSizePt);
      return pdf.getTextWidth(text);
    };

    for (const tok of tokens) {
      if (tok.isNewline) {
        lines.push({ tokens: currentLine, width: currentW });
        currentLine = [];
        currentW = 0;
        continue;
      }
      const isWhitespace = /^\s+$/.test(tok.text);
      if (currentLine.length === 0 && isWhitespace) continue;

      const w = measureToken(tok.text, tok.seg);
      if (currentLine.length > 0 && currentW + w > availWidth && !isWhitespace) {
        lines.push({ tokens: currentLine, width: currentW });
        currentLine = [{ text: tok.text, seg: tok.seg, w }];
        currentW = w;
      } else if (w > availWidth && currentLine.length === 0) {
        // Hard-break ultra-long token
        const wrapped = pdf.splitTextToSize(tok.text, availWidth);
        for (let wi = 0; wi < wrapped.length; wi++) {
          const piece = wrapped[wi];
          const pw = measureToken(piece, tok.seg);
          if (wi > 0) {
            lines.push({ tokens: currentLine, width: currentW });
            currentLine = [];
            currentW = 0;
          }
          currentLine.push({ text: piece, seg: tok.seg, w: pw });
          currentW += pw;
        }
      } else {
        currentLine.push({ text: tok.text, seg: tok.seg, w });
        currentW += w;
      }
    }
    if (currentLine.length > 0) {
      lines.push({ tokens: currentLine, width: currentW });
    }

    for (const line of lines) {
      checkPageBreak(options.lineHeightMm + 1.5);
      let cursorX = xStart;
      if (align === 'center') cursorX = xStart + Math.max(0, (availWidth - line.width) / 2);
      else if (align === 'right') cursorX = xStart + Math.max(0, availWidth - line.width);

      for (const item of line.tokens) {
        const seg = item.seg;
        const style = seg.bold && seg.italic ? 'bolditalic' : seg.bold ? 'bold' : seg.italic ? 'italic' : 'normal';
        const pt = seg.fontSizePt || options.baseFontSizePt;
        const [r, g, b] = hexToRgb(seg.color);
        pdf.setFont(mapPdfFont(seg.fontFamily), style);
        pdf.setFontSize(pt);
        pdf.setTextColor(r, g, b);
        pdf.text(item.text, cursorX, y);

        if (seg.underline && item.text.trim()) {
          pdf.setDrawColor(r, g, b);
          pdf.setLineWidth(0.2);
          pdf.line(cursorX, y + 0.8, cursorX + item.w, y + 0.8);
        }
        if (seg.strike && item.text.trim()) {
          pdf.setDrawColor(r, g, b);
          pdf.setLineWidth(0.2);
          pdf.line(cursorX, y - 1.1, cursorX + item.w, y - 1.1);
        }
        cursorX += item.w;
      }
      y += options.lineHeightMm;
    }
  };

  const renderNode = async (node: any, listDepth = 0): Promise<void> => {
    if (!node) return;

    switch (node.type) {
      case 'heading': {
        const level = Number(node.attrs?.level || 2);
        const align = node.attrs?.textAlign || 'left';
        const sizeMap: Record<number, number> = { 1: 16.5, 2: 12.5, 3: 10.5, 4: 9.5 };
        const lhMap: Record<number, number> = { 1: 6.5, 2: 5.5, 3: 4.8, 4: 4.5 };
        const pt = sizeMap[level] || 11;
        const lh = lhMap[level] || 5;

        checkPageBreak(18);
        if (level <= 2) y += 2.5;
        const segs = extractInlineSegments(node.content || [], '#0F172A').map((s) => ({
          ...s,
          bold: true,
          fontSizePt: s.fontSizePt || pt,
        }));
        renderInlineRuns(segs, { baseFontSizePt: pt, lineHeightMm: lh, align });

        if (level === 1) {
          pdf.setDrawColor(217, 119, 6);
          pdf.setLineWidth(0.7);
          pdf.line(margin, y - 2.5, margin + 48, y - 2.5);
          y += 2;
        } else if (level === 2) {
          pdf.setDrawColor(226, 232, 240);
          pdf.setLineWidth(0.35);
          pdf.line(margin, y - 2.2, pageWidth - margin, y - 2.2);
          y += 1.8;
        } else {
          y += 1;
        }
        break;
      }

      case 'paragraph': {
        const align = node.attrs?.textAlign || 'left';
        const segs = extractInlineSegments(node.content || [], '#1E293B');
        renderInlineRuns(segs, {
          baseFontSizePt: 9.5,
          lineHeightMm: 4.5,
          indentMm: listDepth * 5,
          align,
        });
        y += 1.8;
        break;
      }

      case 'blockquote': {
        const text = flattenText(node).trim();
        if (!text) break;
        const lines = pdf.splitTextToSize(text, contentWidth - 10);
        const boxHeight = lines.length * 4.5 + 5;
        checkPageBreak(boxHeight + 3);
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y - 3.5, contentWidth, boxHeight, 'F');
        pdf.setFillColor(217, 119, 6);
        pdf.rect(margin, y - 3.5, 1.5, boxHeight, 'F');

        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(9.2);
        pdf.setTextColor(51, 65, 85);
        for (const l of lines) {
          pdf.text(l, margin + 5, y + 0.5);
          y += 4.5;
        }
        y += 3.5;
        break;
      }

      case 'bulletList': {
        const items = Array.isArray(node.content) ? node.content : [];
        for (const item of items) {
          const itemChildren = Array.isArray(item.content) ? item.content : [];
          let firstPara = true;
          for (const child of itemChildren) {
            if (child.type === 'paragraph') {
              const segs = extractInlineSegments(child.content || [], '#1E293B');
              renderInlineRuns(segs, {
                baseFontSizePt: 9.5,
                lineHeightMm: 4.5,
                indentMm: listDepth * 5 + 5,
                prefix: firstPara ? '•  ' : '',
                prefixBold: true,
                prefixColor: [217, 119, 6],
              });
              y += 1.0;
              firstPara = false;
            } else {
              await renderNode(child, listDepth + 1);
            }
          }
        }
        y += 1.5;
        break;
      }

      case 'orderedList': {
        const items = Array.isArray(node.content) ? node.content : [];
        let num = Number(node.attrs?.start || 1);
        for (const item of items) {
          const itemChildren = Array.isArray(item.content) ? item.content : [];
          let firstPara = true;
          for (const child of itemChildren) {
            if (child.type === 'paragraph') {
              const segs = extractInlineSegments(child.content || [], '#1E293B');
              renderInlineRuns(segs, {
                baseFontSizePt: 9.5,
                lineHeightMm: 4.5,
                indentMm: listDepth * 5 + 6,
                prefix: firstPara ? `${num}. ` : '',
                prefixBold: true,
                prefixColor: [15, 23, 42],
              });
              y += 1.0;
              firstPara = false;
            } else {
              await renderNode(child, listDepth + 1);
            }
          }
          num += 1;
        }
        y += 1.5;
        break;
      }

      case 'horizontalRule': {
        checkPageBreak(6);
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.35);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 4;
        break;
      }

      case 'pageBreak': {
        addNewPage();
        break;
      }

      case 'image': {
        const src = String(node.attrs?.src || '');
        const fetched = await fetchImageBytes(src);
        if (fetched) {
          const imgProps = pdf.getImageProperties(fetched.dataUrl);
          const maxImgW = Math.min(contentWidth * 0.75, 130);
          const ratio = imgProps.height > 0 && imgProps.width > 0 ? imgProps.height / imgProps.width : 0.5;
          const drawW = maxImgW;
          const drawH = Math.min(95, drawW * ratio);
          checkPageBreak(drawH + 6);
          const xImg = margin + (contentWidth - drawW) / 2;
          pdf.addImage(fetched.dataUrl, fetched.ext === 'png' ? 'PNG' : 'JPEG', xImg, y, drawW, drawH);
          y += drawH + 5;
        }
        break;
      }

      case 'table': {
        const rows = Array.isArray(node.content) ? node.content : [];
        if (rows.length === 0) break;

        // Calculate max columns accounting for colspan
        let colCount = 0;
        for (const r of rows) {
          const cells = Array.isArray(r.content) ? r.content : [];
          const spanSum = cells.reduce((acc: number, c: any) => acc + Number(c.attrs?.colspan || 1), 0);
          if (spanSum > colCount) colCount = spanSum;
        }
        if (colCount <= 0) break;

        const baseColW = contentWidth / colCount;
        const firstRowIsHeader = Boolean(rows[0]?.content?.some((c: any) => c.type === 'tableHeader'));
        const headerRowNode = firstRowIsHeader ? rows[0] : null;

        const drawTableRow = (rowNode: any, rowIdx: number, isHeader: boolean, allowSplit = true) => {
          const cells = Array.isArray(rowNode.content) ? rowNode.content : [];
          pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
          pdf.setFontSize(isHeader ? 8.5 : 8.5);

          const cellLayouts: { textLines: string[]; w: number; isHeaderCell: boolean }[] = [];
          let maxLines = 1;

          for (const cell of cells) {
            const span = Math.max(1, Number(cell.attrs?.colspan || 1));
            const cellW = baseColW * span;
            const text = flattenText(cell).trim() || ' ';
            const wrapped = pdf.splitTextToSize(text, Math.max(12, cellW - 5));
            if (wrapped.length > maxLines) maxLines = wrapped.length;
            cellLayouts.push({ textLines: wrapped, w: cellW, isHeaderCell: cell.type === 'tableHeader' });
          }

          const rowH = Math.max(7.5, maxLines * 4.0 + 4.2);
          if (allowSplit && y + rowH > bottomLimitY) {
            addNewPage();
            if (!isHeader && headerRowNode) {
              drawTableRow(headerRowNode, 0, true, false);
            }
          }

          let cellX = margin;
          for (let ci = 0; ci < cellLayouts.length; ci++) {
            const cell = cellLayouts[ci];
            const headerHighlight = isHeader || cell.isHeaderCell;
            if (headerHighlight) {
              pdf.setFillColor(15, 23, 42);
              pdf.rect(cellX, y, cell.w, rowH, 'F');
            } else if (rowIdx % 2 === 1) {
              pdf.setFillColor(248, 250, 252);
              pdf.rect(cellX, y, cell.w, rowH, 'F');
            } else {
              pdf.setFillColor(255, 255, 255);
              pdf.rect(cellX, y, cell.w, rowH, 'F');
            }

            pdf.setDrawColor(headerHighlight ? 15 : 203, headerHighlight ? 23 : 213, headerHighlight ? 42 : 225);
            pdf.setLineWidth(0.25);
            pdf.rect(cellX, y, cell.w, rowH, 'S');

            pdf.setFont('helvetica', headerHighlight ? 'bold' : 'normal');
            pdf.setFontSize(8.5);
            if (headerHighlight) {
              pdf.setTextColor(255, 255, 255);
            } else {
              pdf.setTextColor(30, 41, 59);
            }

            let textY = y + 4.4;
            for (const line of cell.textLines) {
              pdf.text(line, cellX + 2.5, textY);
              textY += 4.0;
            }
            cellX += cell.w;
          }

          if (isHeader) {
            pdf.setFillColor(217, 119, 6);
            pdf.rect(margin, y + rowH - 0.6, contentWidth, 0.6, 'F');
          }

          y += rowH;
        };

        y += 1.5;
        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const rNode = rows[rIdx];
          const isHeader = rIdx === 0 && firstRowIsHeader;
          drawTableRow(rNode, rIdx, isHeader, true);
        }
        y += 4.5;
        break;
      }

      default: {
        if (Array.isArray(node.content)) {
          for (const child of node.content) {
            await renderNode(child, listDepth);
          }
        }
        break;
      }
    }
  };

  const docJson = docRecord.contentJson;
  const topNodes = Array.isArray(docJson?.content) ? docJson.content : [];
  for (const node of topNodes) {
    await renderNode(node, 0);
  }

  // Executive Signature & Endorsement Block (kept unbroken on page)
  if (docRecord.signatureBlock?.enabled) {
    const sb = docRecord.signatureBlock;
    checkPageBreak(52);
    y += 6;

    pdf.setFillColor(15, 23, 42);
    pdf.rect(margin, y, contentWidth, 6.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('AUTHORIZED SIGNATURES & INSTITUTIONAL ENDORSEMENT', margin + 3, y + 4.4);
    y += 7;

    const colW = (contentWidth - 6) / 2;
    const boxH = 38;

    // Left Signatory Box
    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, colW, boxH, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(180, 83, 9);
    pdf.text((sb.leftHeading || 'Prepared & Endorsed By').toUpperCase(), margin + 3, y + 5.5);

    if (sb.leftSignatureDataUrl) {
      const sigImg = await fetchImageBytes(sb.leftSignatureDataUrl);
      if (sigImg) {
        pdf.addImage(sigImg.dataUrl, sigImg.ext === 'png' ? 'PNG' : 'JPEG', margin + 4, y + 8, 36, 13);
      }
    }

    pdf.setDrawColor(148, 163, 184);
    pdf.line(margin + 3, y + 23, margin + colW - 3, y + 23);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(sb.leftSignerName || 'Authorized Representative', margin + 3, y + 28);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(sb.leftSignerRole || companyName, margin + 3, y + 32);
    pdf.text(`Date: ${sb.leftSignedDate || '______________________'}`, margin + 3, y + 36);

    // Right Signatory Box
    const rightX = margin + colW + 6;
    pdf.setDrawColor(203, 213, 225);
    pdf.setFillColor(248, 250, 252);
    pdf.rect(rightX, y, colW, boxH, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(180, 83, 9);
    pdf.text((sb.rightHeading || 'Acknowledged / Counterparty').toUpperCase(), rightX + 3, y + 5.5);

    if (sb.rightSignatureDataUrl) {
      const sigImgR = await fetchImageBytes(sb.rightSignatureDataUrl);
      if (sigImgR) {
        pdf.addImage(sigImgR.dataUrl, sigImgR.ext === 'png' ? 'PNG' : 'JPEG', rightX + 4, y + 8, 36, 13);
      }
    }

    pdf.setDrawColor(148, 163, 184);
    pdf.line(rightX + 3, y + 23, rightX + colW - 3, y + 23);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(sb.rightSignerName || 'Counterparty Signatory', rightX + 3, y + 28);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.8);
    pdf.setTextColor(71, 85, 105);
    pdf.text(sb.rightSignerRole || 'Authorized Official', rightX + 3, y + 32);
    pdf.text(`Date: ${sb.rightSignedDate || '______________________'}`, rightX + 3, y + 36);

    y += boxH + 4;
  }

  // Stamp running footer & accurate Page X of Y on all pages
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);
    const footerY = pageHeight - 10;
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY - 3.5, pageWidth - margin, footerY - 3.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.2);
    pdf.setTextColor(100, 116, 139);
    const leftFooter = docRecord.showConfidentialityFooter
      ? (docRecord.footerText || 'CONFIDENTIAL — MADECC GROUP | Non-Binding Proposal unless Executed')
      : (docRecord.footerText || companyName);
    pdf.text(leftFooter.slice(0, 105), margin, footerY);

    if (docRecord.showPageNumbers !== false) {
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(15, 23, 42);
      pdf.text(`Page ${p} of ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
    }
  }

  const filename = `${sanitizeFilename(docRecord.title || docRecord.documentNumber)}.pdf`;
  const blob = pdf.output('blob');
  return { pdf, blob, filename };
}

/**
 * REAL EDITABLE MICROSOFT WORD (.docx) GENERATOR
 * Converts ProseMirror contentJson directly into editable Word paragraphs, headings,
 * lists, bordered tables, images, headers/footers, page numbers, and signature blocks.
 */
export async function generateProDocumentDocx(
  docRecord: ProDocument,
  verifiedCompany?: Partial<VerifiedCompanyInfo> | null
): Promise<{ blob: Blob; uint8Array: Uint8Array; filename: string }> {
  const isLandscape = docRecord.orientation === 'landscape';
  const marginTwip = convertMillimetersToTwip(Math.max(12, Math.min(35, Number(docRecord.marginMm ?? 20))));
  const companyName = verifiedCompany?.companyName || docRecord.metadata?.companyName || 'MADECC GROUP';

  const children: (Paragraph | Table)[] = [];

  const mapAlign = (align?: string) => {
    switch (align) {
      case 'center':
        return AlignmentType.CENTER;
      case 'right':
        return AlignmentType.RIGHT;
      case 'justify':
        return AlignmentType.JUSTIFIED;
      default:
        return AlignmentType.LEFT;
    }
  };

  const buildTextChildren = (segments: InlineSegment[], forceBold = false, defaultPt = 10.5): (TextRun | ExternalHyperlink)[] => {
    if (segments.length === 0) return [new TextRun({ text: '' })];
    const runs: (TextRun | ExternalHyperlink)[] = [];
    for (const seg of segments) {
      if (seg.text === '\n') {
        runs.push(new TextRun({ break: 1 }));
        continue;
      }
      const pt = seg.fontSizePt || defaultPt;
      const run = new TextRun({
        text: seg.text,
        bold: forceBold || seg.bold,
        italics: seg.italic,
        underline: seg.underline ? {} : undefined,
        strike: seg.strike,
        color: seg.color.replace('#', ''),
        size: Math.round(pt * 2),
        font: seg.fontFamily || 'Calibri',
      });

      if (seg.href) {
        runs.push(
          new ExternalHyperlink({
            link: seg.href,
            children: [run],
          })
        );
      } else {
        runs.push(run);
      }
    }
    return runs;
  };

  const convertNode = async (node: any, listInfo?: { type: 'bullet' | 'ordered'; level: number }): Promise<void> => {
    if (!node) return;

    switch (node.type) {
      case 'heading': {
        const lvl = Number(node.attrs?.level || 2);
        const headingMap: Record<number, (typeof HeadingLevel)[keyof typeof HeadingLevel]> = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
        };
        const ptMap: Record<number, number> = { 1: 18, 2: 14, 3: 12, 4: 11 };
        const segs = extractInlineSegments(node.content || [], '#0F172A');
        children.push(
          new Paragraph({
            heading: headingMap[lvl] || HeadingLevel.HEADING_2,
            alignment: mapAlign(node.attrs?.textAlign),
            keepNext: true,
            spacing: { before: lvl <= 2 ? 260 : 180, after: 100 },
            border:
              lvl === 1
                ? { bottom: { color: 'D97706', space: 4, style: BorderStyle.SINGLE, size: 12 } }
                : lvl === 2
                ? { bottom: { color: 'CBD5E1', space: 3, style: BorderStyle.SINGLE, size: 6 } }
                : undefined,
            children: buildTextChildren(segs, true, ptMap[lvl] || 12),
          })
        );
        break;
      }

      case 'paragraph': {
        const segs = extractInlineSegments(node.content || [], '#1E293B');
        children.push(
          new Paragraph({
            alignment: mapAlign(node.attrs?.textAlign),
            spacing: { after: 120, line: 276 },
            bullet: listInfo?.type === 'bullet' ? { level: Math.min(3, listInfo.level) } : undefined,
            numbering: listInfo?.type === 'ordered' ? { reference: 'madecc-ordered', level: Math.min(3, listInfo.level) } : undefined,
            children: buildTextChildren(segs, false, 10.5),
          })
        );
        break;
      }

      case 'blockquote': {
        const inner = Array.isArray(node.content) ? node.content : [];
        for (const p of inner) {
          const segs = extractInlineSegments(p.content || [], '#334155');
          children.push(
            new Paragraph({
              indent: { left: 480 },
              border: { left: { color: 'D97706', space: 12, style: BorderStyle.SINGLE, size: 18 } },
              shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
              spacing: { before: 100, after: 140 },
              children: buildTextChildren(segs.map((s) => ({ ...s, italic: true })), false, 10),
            })
          );
        }
        break;
      }

      case 'bulletList': {
        const items = Array.isArray(node.content) ? node.content : [];
        for (const item of items) {
          for (const child of item.content || []) {
            if (child.type === 'paragraph') {
              await convertNode(child, { type: 'bullet', level: listInfo ? listInfo.level + 1 : 0 });
            } else {
              await convertNode(child, { type: 'bullet', level: (listInfo?.level ?? 0) + 1 });
            }
          }
        }
        break;
      }

      case 'orderedList': {
        const items = Array.isArray(node.content) ? node.content : [];
        for (const item of items) {
          for (const child of item.content || []) {
            if (child.type === 'paragraph') {
              await convertNode(child, { type: 'ordered', level: listInfo ? listInfo.level + 1 : 0 });
            } else {
              await convertNode(child, { type: 'ordered', level: (listInfo?.level ?? 0) + 1 });
            }
          }
        }
        break;
      }

      case 'horizontalRule': {
        children.push(
          new Paragraph({
            border: { bottom: { color: 'CBD5E1', space: 4, style: BorderStyle.SINGLE, size: 6 } },
            spacing: { before: 120, after: 120 },
            children: [],
          })
        );
        break;
      }

      case 'pageBreak': {
        children.push(new Paragraph({ children: [new PageBreak()] }));
        break;
      }

      case 'image': {
        const src = String(node.attrs?.src || '');
        const img = await fetchImageBytes(src);
        if (img) {
          children.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 120, after: 160 },
              children: [
                new ImageRun({
                  data: img.bytes,
                  type: img.ext,
                  transformation: { width: 420, height: 220 },
                }),
              ],
            })
          );
        }
        break;
      }

      case 'table': {
        const rawRows = Array.isArray(node.content) ? node.content : [];
        if (rawRows.length === 0) break;

        const docxRows: TableRow[] = [];
        for (let rIdx = 0; rIdx < rawRows.length; rIdx++) {
          const rNode = rawRows[rIdx];
          const rawCells = Array.isArray(rNode.content) ? rNode.content : [];
          const isHeaderRow = rIdx === 0 && rawCells.some((c: any) => c.type === 'tableHeader');
          const docxCells: TableCell[] = [];

          for (const c of rawCells) {
            const isHdr = c.type === 'tableHeader' || isHeaderRow;
            const innerNodes = Array.isArray(c.content) ? c.content : [];
            const cellParagraphs: Paragraph[] = [];

            for (const p of innerNodes) {
              const segs = extractInlineSegments(p.content || [], isHdr ? '#FFFFFF' : '#1E293B');
              cellParagraphs.push(
                new Paragraph({
                  spacing: { before: 40, after: 40 },
                  children: buildTextChildren(segs, isHdr, 9.5),
                })
              );
            }
            if (cellParagraphs.length === 0) {
              cellParagraphs.push(new Paragraph({ children: [new TextRun('')] }));
            }

            docxCells.push(
              new TableCell({
                columnSpan: c.attrs?.colspan > 1 ? Number(c.attrs.colspan) : undefined,
                verticalAlign: VerticalAlign.CENTER,
                margins: { top: 90, bottom: 90, left: 120, right: 120 },
                shading: isHdr
                  ? { type: ShadingType.CLEAR, fill: '0F172A' }
                  : rIdx % 2 === 1
                  ? { type: ShadingType.CLEAR, fill: 'F8FAFC' }
                  : undefined,
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  bottom: { style: BorderStyle.SINGLE, size: isHdr ? 10 : 4, color: isHdr ? 'D97706' : 'CBD5E1' },
                  left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                },
                children: cellParagraphs,
              })
            );
          }

          if (docxCells.length > 0) {
            docxRows.push(
              new TableRow({
                tableHeader: isHeaderRow,
                cantSplit: true,
                children: docxCells,
              })
            );
          }
        }

        if (docxRows.length > 0) {
          children.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: docxRows,
            })
          );
          children.push(new Paragraph({ spacing: { after: 140 }, children: [] }));
        }
        break;
      }

      default: {
        if (Array.isArray(node.content)) {
          for (const child of node.content) {
            await convertNode(child, listInfo);
          }
        }
        break;
      }
    }
  };

  const topNodes = Array.isArray(docRecord.contentJson?.content) ? docRecord.contentJson.content : [];
  for (const n of topNodes) {
    await convertNode(n);
  }

  // Editable Formal Signature Table in DOCX
  if (docRecord.signatureBlock?.enabled) {
    const sb = docRecord.signatureBlock;
    const leftSigImg = sb.leftSignatureDataUrl ? await fetchImageBytes(sb.leftSignatureDataUrl) : null;
    const rightSigImg = sb.rightSignatureDataUrl ? await fetchImageBytes(sb.rightSignatureDataUrl) : null;

    children.push(
      new Paragraph({
        spacing: { before: 240, after: 100 },
        keepNext: true,
        children: [
          new TextRun({
            text: 'AUTHORIZED SIGNATURES & INSTITUTIONAL ENDORSEMENT',
            bold: true,
            size: 20,
            color: '0F172A',
          }),
        ],
      })
    );

    const buildSigCell = (
      heading: string,
      name: string,
      role: string,
      date: string,
      img: { bytes: Uint8Array; ext: 'png' | 'jpg' } | null
    ) => {
      const paras: Paragraph[] = [
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: heading.toUpperCase(), bold: true, size: 17, color: 'B45309' })],
        }),
      ];
      if (img) {
        paras.push(
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new ImageRun({
                data: img.bytes,
                type: img.ext,
                transformation: { width: 150, height: 52 },
              }),
            ],
          })
        );
      } else {
        paras.push(new Paragraph({ spacing: { before: 320, after: 40 }, children: [new TextRun('____________________________')] }));
      }
      paras.push(
        new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 19, color: '0F172A' })] }),
        new Paragraph({ children: [new TextRun({ text: role, size: 18, color: '475569' })] }),
        new Paragraph({ children: [new TextRun({ text: `Date: ${date || '__________________'}`, size: 17, color: '64748B' })] })
      );
      return new TableCell({
        margins: { top: 140, bottom: 140, left: 160, right: 160 },
        shading: { type: ShadingType.CLEAR, fill: 'F8FAFC' },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
          right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
        },
        children: paras,
      });
    };

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            cantSplit: true,
            children: [
              buildSigCell(
                sb.leftHeading || 'Prepared & Endorsed By',
                sb.leftSignerName || 'Authorized Representative',
                sb.leftSignerRole || companyName,
                sb.leftSignedDate || '',
                leftSigImg
              ),
              buildSigCell(
                sb.rightHeading || 'Acknowledged / Counterparty',
                sb.rightSignerName || 'Counterparty Signatory',
                sb.rightSignerRole || 'Authorized Official',
                sb.rightSignedDate || '',
                rightSigImg
              ),
            ],
          }),
        ],
      })
    );
  }

  const docxDoc = new Document({
    creator: docRecord.createdBy || companyName,
    title: docRecord.title,
    description: docRecord.description || `${companyName} Corporate Document`,
    numbering: {
      config: [
        {
          reference: 'madecc-ordered',
          levels: [
            { level: 0, format: 'decimal', text: '%1.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 480, hanging: 240 } } } },
            { level: 1, format: 'lowerLetter', text: '%2)', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 840, hanging: 240 } } } },
            { level: 2, format: 'lowerRoman', text: '%3.', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1200, hanging: 240 } } } },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: convertMillimetersToTwip(210),
              height: convertMillimetersToTwip(297),
              orientation: isLandscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
            },
            margin: {
              top: marginTwip,
              bottom: marginTwip,
              left: marginTwip,
              right: marginTwip,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { color: 'D97706', space: 4, style: BorderStyle.SINGLE, size: 8 } },
                children: [
                  new TextRun({
                    text: `${docRecord.headerText || companyName}   |   ${docRecord.documentNumber} (v${docRecord.version || 1})`,
                    size: 16,
                    color: '475569',
                    bold: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.LEFT,
                border: { top: { color: 'CBD5E1', space: 4, style: BorderStyle.SINGLE, size: 6 } },
                children: [
                  new TextRun({
                    text: docRecord.showConfidentialityFooter
                      ? (docRecord.footerText || 'CONFIDENTIAL — MADECC GROUP | Non-Binding Proposal Document')
                      : (docRecord.footerText || companyName),
                    size: 15,
                    color: '64748B',
                  }),
                  new TextRun({ text: '     |     Page ', size: 15, color: '475569' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 15, bold: true, color: '0F172A' }),
                  new TextRun({ text: ' of ', size: 15, color: '475569' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 15, bold: true, color: '0F172A' }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const filename = `${sanitizeFilename(docRecord.title || docRecord.documentNumber)}.docx`;
  if (typeof Blob !== 'undefined' && typeof document !== 'undefined') {
    const blob = await Packer.toBlob(docxDoc);
    const ab = await blob.arrayBuffer();
    return { blob, uint8Array: new Uint8Array(ab), filename };
  }
  const buffer = await Packer.toBuffer(docxDoc);
  const uint8 = new Uint8Array(buffer);
  const blob = new Blob([uint8.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
  return { blob, uint8Array: uint8, filename };
}
