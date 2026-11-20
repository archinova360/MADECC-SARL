import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, Color } from '@tiptap/extension-text-style';
import Image from '@tiptap/extension-image';
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Code,
  Heading2,
  Heading3,
  Pilcrow,
} from 'lucide-react';
import { sanitizeCmsHtml } from '../../lib/sanitizeHtml.ts';

interface CmsRichTextEditorProps {
  value: string;
  onChange: (cleanHtml: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function CmsRichTextEditor({
  value,
  onChange,
  placeholder = 'Write clean, structured content here...',
  minHeight = '220px',
}: CmsRichTextEditorProps) {
  const [sourceMode, setSourceMode] = useState(false);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const [imageInputOpen, setImageInputOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Image.configure({ inline: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
    ],
    content: sanitizeCmsHtml(value || ''),
    onUpdate: ({ editor: ed }) => {
      onChange(sanitizeCmsHtml(ed.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const cleanIncoming = sanitizeCmsHtml(value || '');
    const current = sanitizeCmsHtml(editor.getHTML());
    if (cleanIncoming !== current && !editor.isFocused) {
      editor.commands.setContent(cleanIncoming || '<p></p>', { emitUpdate: false });
    }
  }, [value, editor]);

  const applyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url || (!url.startsWith('https://') && !url.startsWith('http://') && !url.startsWith('/') && !url.startsWith('mailto:'))) {
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    setLinkInputOpen(false);
    setLinkUrl('https://');
  };

  const applyImage = () => {
    if (!editor) return;
    const src = imageUrl.trim();
    if (!src) return;
    editor.chain().focus().setImage({ src, alt: 'MADECC CMS Media' }).run();
    setImageInputOpen(false);
    setImageUrl('');
  };

  return (
    <div className="border border-slate-800 rounded-xl bg-slate-950 overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-900 border-b border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => editor?.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('paragraph') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Paragraph"
        >
          <Pilcrow className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('heading', { level: 2 }) ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('heading', { level: 3 }) ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('bold') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('italic') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('strike') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('bulletList') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('orderedList') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive('blockquote') ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive({ textAlign: 'left' }) ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive({ textAlign: 'center' }) ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded hover:bg-slate-800 ${editor?.isActive({ textAlign: 'right' }) ? 'bg-amber-500/20 text-amber-400' : 'text-slate-300'}`}
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => {
            setLinkInputOpen((v) => !v);
            setImageInputOpen(false);
          }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          title="Insert Link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setImageInputOpen((v) => !v);
            setLinkInputOpen(false);
          }}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          title="Insert Image URL"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          title="Insert 3x3 Table"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          title="Undo"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-300"
          title="Redo"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => setSourceMode((v) => !v)}
            className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 ${
              sourceMode ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Code className="w-3 h-3" /> {sourceMode ? 'Visual Editor' : 'HTML Source'}
          </button>
        </div>
      </div>

      {/* Inline Link / Image popovers */}
      {linkInputOpen && (
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs">
          <input
            type="text"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://madeccgroup.online/..."
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white"
          />
          <button type="button" onClick={applyLink} className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded">
            Apply Link
          </button>
          <button type="button" onClick={() => setLinkInputOpen(false)} className="px-2 py-1 text-slate-400">
            Cancel
          </button>
        </div>
      )}

      {imageInputOpen && (
        <div className="p-2 bg-slate-900 border-b border-slate-800 flex items-center gap-2 text-xs">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... (Cloudinary / Supabase CDN URL)"
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-white"
          />
          <button type="button" onClick={applyImage} className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded">
            Insert Image
          </button>
          <button type="button" onClick={() => setImageInputOpen(false)} className="px-2 py-1 text-slate-400">
            Cancel
          </button>
        </div>
      )}

      {/* Editor Surface */}
      {sourceMode ? (
        <textarea
          value={value}
          onChange={(e) => onChange(sanitizeCmsHtml(e.target.value))}
          rows={10}
          className="w-full bg-slate-950 text-slate-200 font-mono text-xs p-3 focus:outline-none"
          style={{ minHeight }}
        />
      ) : (
        <EditorContent
          editor={editor}
          className="prose prose-invert prose-sm max-w-none p-4 text-slate-200 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px]"
          style={{ minHeight }}
        />
      )}
    </div>
  );
}
