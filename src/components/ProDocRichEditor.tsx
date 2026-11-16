import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontFamily, FontSize, Color } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Scissors,
  Search,
  ListTree,
  Eye,
  Printer,
  X,
  Upload,
  Building2,
  Check,
  Unlink,
  ArrowRight,
} from 'lucide-react';
import { ProDocumentOrientation, ProDocumentSignatureBlock } from '../types/proDocumentTypes.ts';
import { proDocStudioService, VerifiedCompanyInfo } from '../services/proDocStudioService.ts';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      setPageBreak: () => ReturnType;
    };
  }
}

const PageBreakNode = Node.create({
  name: 'pageBreak',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  parseHTML() {
    return [
      { tag: 'div[data-type="page-break"]' },
      { tag: 'div[data-page-break]' },
      { tag: 'hr.doc-page-break' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'page-break',
        class: 'doc-page-break',
        contenteditable: 'false',
      }),
      ['span', { class: 'doc-page-break-label' }, 'A4 PAGE BREAK'],
    ];
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ chain }) =>
          chain().insertContent([{ type: this.name }, { type: 'paragraph' }]).run(),
    };
  },
});

export interface OutlineItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

interface ProDocRichEditorProps {
  docKey: string | number;
  initialContentJson: any;
  initialContentHtml?: string;
  editable?: boolean;
  orientation: ProDocumentOrientation;
  marginMm: number;
  headerText?: string | null;
  footerText?: string | null;
  documentNumber?: string;
  version?: number;
  status?: string;
  showPageNumbers?: boolean;
  showConfidentialityFooter?: boolean;
  signatureBlock?: ProDocumentSignatureBlock;
  verifiedCompany?: Partial<VerifiedCompanyInfo> | null;
  onChange?: (payload: { json: any; html: string; outline: OutlineItem[] }) => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const COLOR_SWATCHES = [
  { label: 'Obsidian', value: '#0F172A' },
  { label: 'Slate Ink', value: '#334155' },
  { label: 'Executive Gold', value: '#D97706' },
  { label: 'Deep Amber', value: '#B45309' },
  { label: 'Emerald', value: '#047857' },
  { label: 'Crimson', value: '#B91C1C' },
  { label: 'Navy Blue', value: '#1E40AF' },
];

const FONT_FAMILIES = [
  { label: 'Inter (Corporate Sans)', value: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { label: 'Calibri / Arial', value: 'Calibri, Arial, Helvetica, sans-serif' },
  { label: 'Georgia (Executive Serif)', value: 'Georgia, Cambria, Times New Roman, serif' },
  { label: 'Times New Roman', value: 'Times New Roman, Times, serif' },
  { label: 'JetBrains Mono', value: 'JetBrains Mono, ui-monospace, monospace' },
];

const FONT_SIZES = ['11px', '12px', '13px', '14px', '16px', '18px', '22px', '26px'];

function collectOutline(editor: any): OutlineItem[] {
  if (!editor) return [];
  const items: OutlineItem[] = [];
  let idx = 0;
  editor.state.doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'heading') {
      const text = node.textContent.trim();
      if (text) {
        items.push({
          id: `hd-${idx++}-${pos}`,
          level: Number(node.attrs?.level || 1),
          text,
          pos,
        });
      }
    }
  });
  return items;
}

export const ProDocRichEditor: React.FC<ProDocRichEditorProps> = ({
  docKey,
  initialContentJson,
  initialContentHtml,
  editable = true,
  orientation,
  marginMm,
  headerText,
  footerText,
  documentNumber,
  version,
  status,
  showPageNumbers = true,
  showConfidentialityFooter = true,
  signatureBlock,
  verifiedCompany,
  onChange,
  onNotify,
}) => {
  const [showOutline, setShowOutline] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [zoomPct, setZoomPct] = useState<number>(100);

  const [linkUrl, setLinkUrl] = useState('https://');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  const [findQuery, setFindQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [searchMatchInfo, setSearchMatchInfo] = useState<string>('');
  const [outline, setOutline] = useState<OutlineItem[]>([]);

  const suppressUpdateRef = useRef(false);
  const lastDocKeyRef = useRef<string | number>(docKey);

  const editor = useEditor({
    editable,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: {
            class: 'text-amber-700 underline underline-offset-2 cursor-pointer',
            rel: 'noopener noreferrer',
          },
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      FontFamily,
      FontSize,
      Color,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto my-3 rounded border border-slate-200 mx-auto block',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'pro-doc-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      PageBreakNode,
      Placeholder.configure({
        placeholder: 'Compose formal proposals, agreements, engineering memos, and schedules...',
      }),
    ],
    content: initialContentJson || initialContentHtml || '<p></p>',
    editorProps: {
      attributes: {
        class: 'pro-doc-tiptap focus:outline-none min-h-[220mm]',
      },
    },
    onCreate: ({ editor: ed }) => {
      setOutline(collectOutline(ed));
    },
    onUpdate: ({ editor: ed }) => {
      if (suppressUpdateRef.current) return;
      const nextOutline = collectOutline(ed);
      setOutline(nextOutline);
      onChange?.({
        json: ed.getJSON(),
        html: ed.getHTML(),
        outline: nextOutline,
      });
    },
  });

  // Sync external document switch or version restore cleanly
  useEffect(() => {
    if (!editor) return;
    if (lastDocKeyRef.current !== docKey) {
      lastDocKeyRef.current = docKey;
      suppressUpdateRef.current = true;
      editor.commands.setContent(initialContentJson || initialContentHtml || '<p></p>', { emitUpdate: false });
      suppressUpdateRef.current = false;
      setOutline(collectOutline(editor));
    }
  }, [docKey, editor, initialContentJson, initialContentHtml]);

  useEffect(() => {
    if (editor && editor.isEditable !== editable) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  const currentHeadingLevel = useMemo(() => {
    if (!editor) return 'paragraph';
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 4 })) return 'h4';
    if (editor.isActive('blockquote')) return 'blockquote';
    return 'paragraph';
  }, [editor, editor?.state.selection]);

  const handleHeadingChange = (val: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (val === 'paragraph') chain.setParagraph().run();
    else if (val === 'h1') chain.setHeading({ level: 1 }).run();
    else if (val === 'h2') chain.setHeading({ level: 2 }).run();
    else if (val === 'h3') chain.setHeading({ level: 3 }).run();
    else if (val === 'h4') chain.setHeading({ level: 4 }).run();
    else if (val === 'blockquote') chain.toggleBlockquote().run();
  };

  // Real ProseMirror text range finder
  const findMatches = (query: string): { from: number; to: number }[] => {
    if (!editor || !query) return [];
    const matches: { from: number; to: number }[] = [];
    const needle = matchCase ? query : query.toLowerCase();

    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const hay = matchCase ? node.text : node.text.toLowerCase();
        let startIdx = 0;
        while (true) {
          const foundAt = hay.indexOf(needle, startIdx);
          if (foundAt === -1) break;
          matches.push({ from: pos + foundAt, to: pos + foundAt + query.length });
          startIdx = foundAt + Math.max(1, query.length);
        }
      }
    });
    return matches;
  };

  const handleFindNext = () => {
    if (!editor || !findQuery) return;
    const matches = findMatches(findQuery);
    if (matches.length === 0) {
      setSearchMatchInfo('No matches found');
      return;
    }
    const curTo = editor.state.selection.to;
    const next = matches.find((m) => m.from >= curTo) || matches[0];
    const idx = matches.indexOf(next) + 1;
    editor.chain().focus().setTextSelection(next).run();
    setSearchMatchInfo(`Match ${idx} of ${matches.length}`);
  };

  const handleReplaceOne = () => {
    if (!editor || !findQuery) return;
    const matches = findMatches(findQuery);
    if (matches.length === 0) {
      setSearchMatchInfo('No matches found');
      return;
    }
    const { from, to } = editor.state.selection;
    const currentMatch = matches.find((m) => m.from === from && m.to === to) || matches[0];
    editor
      .chain()
      .focus()
      .insertContentAt({ from: currentMatch.from, to: currentMatch.to }, replaceQuery)
      .run();
    const remaining = findMatches(findQuery);
    setSearchMatchInfo(`Replaced (${remaining.length} remaining)`);
  };

  const handleReplaceAll = () => {
    if (!editor || !findQuery) return;
    const matches = findMatches(findQuery);
    if (matches.length === 0) {
      setSearchMatchInfo('No matches found');
      return;
    }
    const tr = editor.state.tr;
    // Apply reverse-order replacements so earlier document positions stay valid
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      if (replaceQuery) {
        tr.insertText(replaceQuery, m.from, m.to);
      } else {
        tr.delete(m.from, m.to);
      }
    }
    editor.view.dispatch(tr);
    setSearchMatchInfo(`Replaced ${matches.length} occurrence(s)`);
    onNotify?.(`Replaced ${matches.length} occurrence(s) in document`, 'success');
  };

  const handleInsertTableOfContents = () => {
    if (!editor) return;
    const headings = collectOutline(editor).filter((h) => h.level <= 3);
    if (headings.length === 0) {
      onNotify?.('Add Headings (H1–H3) before generating a Table of Contents.', 'info');
      return;
    }
    const listItems = headings.map((h) => ({
      type: 'listItem',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              marks: h.level === 1 ? [{ type: 'bold' }] : [],
              text: `${'  '.repeat(Math.max(0, h.level - 1))}${h.text}`,
            },
          ],
        },
      ],
    }));

    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'TABLE OF CONTENTS' }],
        },
        {
          type: 'orderedList',
          content: listItems,
        },
      ])
      .run();
    onNotify?.(`Inserted Table of Contents (${headings.length} sections)`, 'success');
  };

  const handleUploadImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploadingImg(true);
    try {
      const url = await proDocStudioService.uploadEditorImage(file);
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      setShowImagePopover(false);
      onNotify?.('Image uploaded to cloud storage and inserted.', 'success');
    } catch (err: any) {
      onNotify?.(err?.message || 'Failed to upload image.', 'error');
    } finally {
      setUploadingImg(false);
      if (imageFileInputRef.current) imageFileInputRef.current.value = '';
    }
  };

  const handleInsertLogo = () => {
    if (!editor) return;
    const logoUrl = verifiedCompany?.logoUrl || '/logo.png';
    editor.chain().focus().setImage({ src: logoUrl, alt: verifiedCompany?.companyName || 'MADECC GROUP' }).run();
    setShowImagePopover(false);
    onNotify?.('Inserted corporate emblem.', 'success');
  };

  const companyName = verifiedCompany?.companyName || 'MADECC GROUP';
  const pageWidthMm = orientation === 'landscape' ? 297 : 210;
  const pageMinHeightMm = orientation === 'landscape' ? 210 : 297;

  return (
    <div className="flex flex-col w-full bg-slate-100 border border-slate-300 rounded-xl overflow-hidden shadow-sm">
      <style>{`
        .pro-doc-tiptap {
          color: #1E293B;
          font-size: 13.5px;
          line-height: 1.6;
        }
        .pro-doc-tiptap h1 {
          font-size: 21px;
          font-weight: 800;
          color: #0F172A;
          margin-top: 14px;
          margin-bottom: 10px;
          padding-bottom: 6px;
          border-bottom: 2px solid #D97706;
          letter-spacing: -0.01em;
        }
        .pro-doc-tiptap h2 {
          font-size: 16px;
          font-weight: 700;
          color: #0F172A;
          margin-top: 18px;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #E2E8F0;
        }
        .pro-doc-tiptap h3 {
          font-size: 14px;
          font-weight: 700;
          color: #1E293B;
          margin-top: 12px;
          margin-bottom: 6px;
        }
        .pro-doc-tiptap h4 {
          font-size: 13px;
          font-weight: 700;
          color: #B45309;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-top: 10px;
          margin-bottom: 4px;
        }
        .pro-doc-tiptap p {
          margin-bottom: 8px;
        }
        .pro-doc-tiptap ul {
          list-style-type: disc;
          padding-left: 22px;
          margin-bottom: 10px;
        }
        .pro-doc-tiptap ol {
          list-style-type: decimal;
          padding-left: 22px;
          margin-bottom: 10px;
        }
        .pro-doc-tiptap li {
          margin-bottom: 4px;
        }
        .pro-doc-tiptap blockquote {
          border-left: 3px solid #D97706;
          background: #F8FAFC;
          padding: 8px 14px;
          margin: 10px 0;
          color: #334155;
          font-style: italic;
        }
        .pro-doc-tiptap table {
          border-collapse: collapse;
          width: 100%;
          margin: 12px 0 16px 0;
          table-layout: fixed;
          font-size: 12.5px;
        }
        .pro-doc-tiptap th {
          background: #0F172A;
          color: #FFFFFF;
          font-weight: 700;
          text-align: left;
          padding: 7px 10px;
          border: 1px solid #0F172A;
          border-bottom: 2px solid #D97706;
        }
        .pro-doc-tiptap td {
          padding: 7px 10px;
          border: 1px solid #CBD5E1;
          vertical-align: top;
        }
        .pro-doc-tiptap tr:nth-child(even) td {
          background: #F8FAFC;
        }
        .pro-doc-tiptap .selectedCell:after {
          background: rgba(217, 119, 6, 0.14);
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .pro-doc-tiptap td, .pro-doc-tiptap th {
          position: relative;
        }
        .pro-doc-tiptap .doc-page-break {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 22px 0;
          border-top: 2px dashed #D97706;
          position: relative;
          height: 16px;
          user-select: none;
        }
        .pro-doc-tiptap .doc-page-break-label {
          background: #FEF3C7;
          color: #92400E;
          border: 1px solid #F59E0B;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 1px 10px;
          border-radius: 3px;
        }
        .pro-doc-tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #94A3B8;
          pointer-events: none;
          height: 0;
        }
        @media print {
          .doc-page-break {
            break-before: page !important;
            page-break-before: always !important;
            border: none !important;
            height: 0 !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
          .doc-page-break-label {
            display: none !important;
          }
        }
      `}</style>

      {/* Primary Rich Text Ribbon */}
      {editable && editor && (
        <div className="bg-white border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-1.5 relative z-20">
          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5 pr-2 border-r border-slate-200">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo"
              className="p-1.5 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-35"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo"
              className="p-1.5 rounded text-slate-700 hover:bg-slate-100 disabled:opacity-35"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          {/* Heading Level / Block */}
          <select
            value={currentHeadingLevel}
            onChange={(e) => handleHeadingChange(e.target.value)}
            aria-label="Text block style"
            className="h-8 px-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="paragraph">Normal Paragraph</option>
            <option value="h1">Heading 1 (Title)</option>
            <option value="h2">Heading 2 (Section)</option>
            <option value="h3">Heading 3 (Sub-section)</option>
            <option value="h4">Heading 4 (Label)</option>
            <option value="blockquote">Callout / Quote</option>
          </select>

          {/* Font Family */}
          <select
            value={editor.getAttributes('textStyle').fontFamily || ''}
            onChange={(e) => {
              if (e.target.value) editor.chain().focus().setFontFamily(e.target.value).run();
              else editor.chain().focus().unsetFontFamily().run();
            }}
            aria-label="Font family"
            className="h-8 px-2 text-xs bg-slate-50 border border-slate-300 rounded text-slate-800 max-w-[140px] focus:outline-none focus:border-amber-500"
          >
            <option value="">Default Font</option>
            {FONT_FAMILIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>

          {/* Font Size */}
          <select
            value={editor.getAttributes('textStyle').fontSize || ''}
            onChange={(e) => {
              if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run();
              else editor.chain().focus().unsetFontSize().run();
            }}
            aria-label="Font size"
            className="h-8 px-2 text-xs bg-slate-50 border border-slate-300 rounded text-slate-800 focus:outline-none focus:border-amber-500"
          >
            <option value="">Size</option>
            {FONT_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </select>

          {/* Inline Marks */}
          <div className="flex items-center gap-0.5 px-2 border-x border-slate-200">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
              className={`p-1.5 rounded text-slate-700 ${editor.isActive('bold') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
              className={`p-1.5 rounded text-slate-700 ${editor.isActive('italic') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
              className={`p-1.5 rounded text-slate-700 ${editor.isActive('underline') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              title="Strikethrough"
              className={`p-1.5 rounded text-slate-700 ${editor.isActive('strike') ? 'bg-slate-900 text-white' : 'hover:bg-slate-100'}`}
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette */}
          <div className="flex items-center gap-1 px-1.5 border-r border-slate-200" title="Text Color">
            {COLOR_SWATCHES.map((sw) => (
              <button
                key={sw.value}
                type="button"
                title={sw.label}
                onClick={() => editor.chain().focus().setColor(sw.value).run()}
                className={`w-4 h-4 rounded-sm border ${
                  editor.getAttributes('textStyle').color === sw.value ? 'ring-2 ring-amber-500 border-slate-900' : 'border-slate-300'
                }`}
                style={{ backgroundColor: sw.value }}
              />
            ))}
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="Align Left"
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="Align Center"
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="Align Right"
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              title="Justify"
              className={`p-1.5 rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          {/* Lists & Quote */}
          <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bulleted List"
              className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
              className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              title="Blockquote"
              className={`p-1.5 rounded ${editor.isActive('blockquote') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          {/* Table Controls Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTableMenu((v) => !v);
                setShowLinkPopover(false);
                setShowImagePopover(false);
              }}
              className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                editor.isActive('table') ? 'bg-amber-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Table Tools"
            >
              <TableIcon className="w-3.5 h-3.5" /> Table
            </button>
            {showTableMenu && (
              <div className="absolute left-0 top-full mt-1 w-56 bg-white border border-slate-200 rounded-lg shadow-xl p-2 z-50 text-xs space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().insertTable({ rows: 4, cols: 3, withHeaderRow: true }).run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-100 font-semibold text-slate-900"
                >
                  + Insert 4×3 Corporate Table
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  disabled={!editor.isActive('table')}
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  + Add Row Below
                </button>
                <button
                  type="button"
                  disabled={!editor.isActive('table')}
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  + Add Row Above
                </button>
                <button
                  type="button"
                  disabled={!editor.isActive('table')}
                  onClick={() => editor.chain().focus().deleteRow().run()}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-red-50 text-red-700 disabled:opacity-40"
                >
                  - Delete Row
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  disabled={!editor.isActive('table')}
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  + Add Column Right
                </button>
                <button
                  type="button"
                  disabled={!editor.isActive('table')}
                  onClick={() => editor.chain().focus().deleteColumn().run()}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-red-50 text-red-700 disabled:opacity-40"
                >
                  - Delete Column
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  type="button"
                  disabled={!editor.can().mergeCells()}
                  onClick={() => editor.chain().focus().mergeCells().run()}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  Merge Selected Cells
                </button>
                <button
                  type="button"
                  disabled={!editor.can().splitCell()}
                  onClick={() => editor.chain().focus().splitCell().run()}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-slate-100 disabled:opacity-40"
                >
                  Split Cell
                </button>
                <button
                  type="button"
                  disabled={!editor.isActive('table')}
                  onClick={() => {
                    editor.chain().focus().deleteTable().run();
                    setShowTableMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-1 rounded hover:bg-red-50 text-red-700 font-medium disabled:opacity-40"
                >
                  Delete Entire Table
                </button>
              </div>
            )}
          </div>

          {/* Hyperlink Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const prev = editor.getAttributes('link').href;
                setLinkUrl(prev || 'https://');
                setShowLinkPopover((v) => !v);
                setShowTableMenu(false);
                setShowImagePopover(false);
              }}
              className={`p-1.5 rounded ${editor.isActive('link') ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
              title="Insert / Edit Hyperlink"
            >
              <LinkIcon className="w-4 h-4" />
            </button>
            {showLinkPopover && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 space-y-2">
                <div className="text-xs font-bold text-slate-900">Hyperlink Target URL</div>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://madeccgroup.online"
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:border-amber-500"
                />
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().unsetLink().run();
                      setShowLinkPopover(false);
                    }}
                    className="px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded flex items-center gap-1"
                  >
                    <Unlink className="w-3 h-3" /> Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (linkUrl.trim()) {
                        editor.chain().focus().setLink({ href: linkUrl.trim() }).run();
                      }
                      setShowLinkPopover(false);
                    }}
                    className="px-3 py-1 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800 flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Image & Corporate Logo Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowImagePopover((v) => !v);
                setShowTableMenu(false);
                setShowLinkPopover(false);
              }}
              className="p-1.5 rounded text-slate-700 hover:bg-slate-100"
              title="Insert Image or Corporate Logo"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            {showImagePopover && (
              <div className="absolute left-0 top-full mt-1 w-80 bg-white border border-slate-200 rounded-lg shadow-xl p-3 z-50 space-y-2.5 text-xs">
                <div className="font-bold text-slate-900">Insert Image or Company Crest</div>
                <button
                  type="button"
                  onClick={handleInsertLogo}
                  className="w-full px-3 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 flex items-center justify-center gap-2"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-400" /> Insert Official {companyName} Logo
                </button>
                <div>
                  <input
                    ref={imageFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadImageFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImg}
                    onClick={() => imageFileInputRef.current?.click()}
                    className="w-full px-3 py-2 bg-amber-50 text-amber-900 border border-amber-300 rounded font-semibold hover:bg-amber-100 flex items-center justify-center gap-2"
                  >
                    <Upload className="w-3.5 h-3.5" /> {uploadingImg ? 'Uploading to Cloud...' : 'Upload Image File (Cloud)'}
                  </button>
                </div>
                <div className="border-t border-slate-100 pt-2 space-y-1.5">
                  <div className="text-[11px] font-medium text-slate-600">Or paste verified image URL:</div>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-2 py-1 border border-slate-300 rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrlInput.trim()) {
                          editor.chain().focus().setImage({ src: imageUrlInput.trim() }).run();
                          setImageUrlInput('');
                          setShowImagePopover(false);
                        }
                      }}
                      className="px-2.5 py-1 bg-slate-800 text-white rounded font-semibold"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Page Break & Dynamic TOC */}
          <div className="flex items-center gap-1 pl-1.5 border-l border-slate-200">
            <button
              type="button"
              onClick={() => editor.chain().focus().setPageBreak().run()}
              className="px-2 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              title="Insert Explicit A4 Page Break"
            >
              <Scissors className="w-3.5 h-3.5 text-amber-600" /> Page Break
            </button>
            <button
              type="button"
              onClick={handleInsertTableOfContents}
              className="px-2 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              title="Generate Dynamic Table of Contents from Headings"
            >
              <ListTree className="w-3.5 h-3.5 text-slate-700" /> Insert TOC
            </button>
          </div>

          {/* Utility Right Side */}
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowSearch((v) => !v)}
              className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                showSearch ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Find & Replace"
            >
              <Search className="w-3.5 h-3.5" /> Find
            </button>
            <button
              type="button"
              onClick={() => setShowOutline((v) => !v)}
              className={`px-2 py-1.5 rounded text-xs font-medium flex items-center gap-1 ${
                showOutline ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle Heading Outline"
            >
              <ListTree className="w-3.5 h-3.5" /> Outline ({outline.length})
            </button>
            <button
              type="button"
              onClick={() => setShowPreviewModal(true)}
              className="px-2 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-100 flex items-center gap-1"
              title="A4 Print & Layout Preview"
            >
              <Eye className="w-3.5 h-3.5" /> A4 Preview
            </button>
            <select
              value={zoomPct}
              onChange={(e) => setZoomPct(Number(e.target.value))}
              aria-label="Page Zoom"
              className="h-7 px-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-700"
            >
              <option value={80}>80%</option>
              <option value={90}>90%</option>
              <option value={100}>100%</option>
              <option value={110}>110%</option>
            </select>
          </div>
        </div>
      )}

      {/* Search & Replace Bar */}
      {editable && showSearch && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-amber-700" />
            <input
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Find text..."
              className="px-2.5 py-1 bg-white border border-amber-300 rounded w-44 text-slate-900 focus:outline-none focus:border-amber-600"
            />
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            placeholder="Replace with..."
            className="px-2.5 py-1 bg-white border border-amber-300 rounded w-44 text-slate-900 focus:outline-none focus:border-amber-600"
          />
          <label className="flex items-center gap-1 text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded border-slate-300"
            />
            Match case
          </label>
          <button
            type="button"
            onClick={handleFindNext}
            className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold text-slate-800 hover:bg-slate-50"
          >
            Find Next
          </button>
          <button
            type="button"
            onClick={handleReplaceOne}
            className="px-2.5 py-1 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={handleReplaceAll}
            className="px-2.5 py-1 bg-amber-600 text-white rounded font-semibold hover:bg-amber-700"
          >
            Replace All
          </button>
          {searchMatchInfo && <span className="text-slate-700 font-medium tabular-nums ml-1">{searchMatchInfo}</span>}
          <button
            type="button"
            onClick={() => setShowSearch(false)}
            className="ml-auto p-1 text-slate-500 hover:text-slate-900"
            title="Close Find & Replace"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Body Area with Optional Live Outline Drawer */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {showOutline && (
          <aside className="w-64 shrink-0 bg-white border-r border-slate-200 overflow-y-auto p-3">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Document Outline</span>
              <button
                type="button"
                onClick={() => setShowOutline(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {outline.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">Add H1–H4 headings to populate automatic section navigation.</p>
            ) : (
              <div className="space-y-1">
                {outline.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      editor?.chain().focus().setTextSelection(item.pos + 1).scrollIntoView().run();
                    }}
                    className={`w-full text-left text-xs py-1 px-2 rounded hover:bg-amber-50 hover:text-amber-900 truncate ${
                      item.level === 1
                        ? 'font-bold text-slate-900'
                        : item.level === 2
                        ? 'font-semibold text-slate-700 pl-3'
                        : 'text-slate-500 pl-5'
                    }`}
                  >
                    {item.text}
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Scrollable A4 Paper Canvas */}
        <div className="flex-1 overflow-auto p-6 sm:p-10 bg-slate-200/80 flex justify-center">
          <div
            className="bg-white shadow-xl border border-slate-300 flex flex-col transition-transform origin-top"
            style={{
              width: `${pageWidthMm}mm`,
              minHeight: `${pageMinHeightMm}mm`,
              padding: `${marginMm}mm`,
              transform: zoomPct !== 100 ? `scale(${zoomPct / 100})` : undefined,
            }}
          >
            {/* Corporate A4 Letterhead Header */}
            <div className="mb-5 pb-3 border-b-2 border-amber-600 flex items-center justify-between gap-4 select-none">
              <div className="flex items-center gap-3 min-w-0">
                {verifiedCompany?.logoUrl && (
                  <img
                    src={verifiedCompany.logoUrl}
                    alt={companyName}
                    className="h-9 w-9 object-contain shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold tracking-wider text-slate-900 uppercase truncate">
                    {headerText || companyName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {[verifiedCompany?.website, verifiedCompany?.email, verifiedCompany?.phone].filter(Boolean).join(' · ')}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0 text-[11px] text-slate-600 tabular-nums">
                <div className="font-bold text-slate-900">{documentNumber || 'MADECC-DOC'}</div>
                <div>
                  v{version || 1} · {status || 'DRAFT'}
                </div>
              </div>
            </div>

            {/* Interactive Tiptap Body */}
            <div className="flex-1">
              <EditorContent editor={editor} />
            </div>

            {/* Signature Endorsement Preview inside A4 Canvas */}
            {signatureBlock?.enabled && (
              <div className="mt-8 pt-4 border-t border-slate-300 select-none">
                <div className="text-[11px] font-bold uppercase tracking-wider bg-slate-900 text-white px-3 py-1.5 mb-3">
                  Authorized Signatures & Institutional Endorsement
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 bg-slate-50/70 p-3 rounded">
                    <div className="text-[10px] font-bold uppercase text-amber-700 mb-2">
                      {signatureBlock.leftHeading || 'Prepared & Endorsed By'}
                    </div>
                    {signatureBlock.leftSignatureDataUrl ? (
                      <img src={signatureBlock.leftSignatureDataUrl} alt="Left signature" className="h-12 object-contain mb-2" />
                    ) : (
                      <div className="h-12 border-b border-slate-300 mb-2" />
                    )}
                    <div className="text-xs font-bold text-slate-900">{signatureBlock.leftSignerName || 'Authorized Representative'}</div>
                    <div className="text-[11px] text-slate-600">{signatureBlock.leftSignerRole || companyName}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Date: {signatureBlock.leftSignedDate || '__________________'}</div>
                  </div>
                  <div className="border border-slate-200 bg-slate-50/70 p-3 rounded">
                    <div className="text-[10px] font-bold uppercase text-amber-700 mb-2">
                      {signatureBlock.rightHeading || 'Acknowledged / Counterparty'}
                    </div>
                    {signatureBlock.rightSignatureDataUrl ? (
                      <img src={signatureBlock.rightSignatureDataUrl} alt="Right signature" className="h-12 object-contain mb-2" />
                    ) : (
                      <div className="h-12 border-b border-slate-300 mb-2" />
                    )}
                    <div className="text-xs font-bold text-slate-900">{signatureBlock.rightSignerName || 'Counterparty Signatory'}</div>
                    <div className="text-[11px] text-slate-600">{signatureBlock.rightSignerRole || 'Authorized Official'}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Date: {signatureBlock.rightSignedDate || '__________________'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Running A4 Footer */}
            <div className="mt-8 pt-2.5 border-t border-slate-300 flex items-center justify-between text-[10.5px] text-slate-500 select-none">
              <span className="truncate pr-4">
                {showConfidentialityFooter
                  ? footerText || 'CONFIDENTIAL — MADECC GROUP | Non-Binding Proposal unless Executed'
                  : footerText || companyName}
              </span>
              {showPageNumbers && <span className="font-semibold text-slate-800 shrink-0 tabular-nums">A4 Print Layout · Page 1+</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen A4 Print Preview Modal */}
      {showPreviewModal && editor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 flex flex-col">
          <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="text-sm font-semibold">
              A4 Print Preview · {orientation === 'landscape' ? 'Landscape (297×210 mm)' : 'Portrait (210×297 mm)'} · Margins {marginMm}mm
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" /> Print / Browser PDF
              </button>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-8 flex justify-center">
            <div
              className="print-only-container bg-white shadow-2xl border border-slate-300"
              style={{
                width: `${pageWidthMm}mm`,
                minHeight: `${pageMinHeightMm}mm`,
                padding: `${marginMm}mm`,
              }}
            >
              <div className="mb-5 pb-3 border-b-2 border-amber-600 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase text-slate-900">{headerText || companyName}</div>
                  <div className="text-[11px] text-slate-500">
                    {[verifiedCompany?.website, verifiedCompany?.email].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-700 tabular-nums">
                  <div className="font-bold text-slate-900">{documentNumber}</div>
                  <div>v{version || 1}</div>
                </div>
              </div>
              <div
                className="pro-doc-tiptap"
                dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
              />
              {signatureBlock?.enabled && (
                <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 gap-4">
                  <div className="border border-slate-200 p-3">
                    <div className="text-[10px] font-bold uppercase text-amber-700 mb-2">
                      {signatureBlock.leftHeading || 'Prepared & Endorsed By'}
                    </div>
                    {signatureBlock.leftSignatureDataUrl && (
                      <img src={signatureBlock.leftSignatureDataUrl} alt="Left signature" className="h-10 object-contain mb-1" />
                    )}
                    <div className="text-xs font-bold text-slate-900">{signatureBlock.leftSignerName || 'Authorized Representative'}</div>
                    <div className="text-[11px] text-slate-600">{signatureBlock.leftSignerRole || companyName}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Date: {signatureBlock.leftSignedDate || '__________________'}</div>
                  </div>
                  <div className="border border-slate-200 p-3">
                    <div className="text-[10px] font-bold uppercase text-amber-700 mb-2">
                      {signatureBlock.rightHeading || 'Acknowledged / Counterparty'}
                    </div>
                    {signatureBlock.rightSignatureDataUrl && (
                      <img src={signatureBlock.rightSignatureDataUrl} alt="Right signature" className="h-10 object-contain mb-1" />
                    )}
                    <div className="text-xs font-bold text-slate-900">{signatureBlock.rightSignerName || 'Counterparty Signatory'}</div>
                    <div className="text-[11px] text-slate-600">{signatureBlock.rightSignerRole || 'Authorized Official'}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Date: {signatureBlock.rightSignedDate || '__________________'}</div>
                  </div>
                </div>
              )}
              <div className="mt-8 pt-2 border-t border-slate-300 flex justify-between text-[10px] text-slate-500">
                <span>{footerText || 'CONFIDENTIAL — MADECC GROUP'}</span>
                {showPageNumbers && <span>{documentNumber}</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
