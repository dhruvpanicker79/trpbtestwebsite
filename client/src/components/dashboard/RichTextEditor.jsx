import { useEffect, useRef, useState } from 'react';
import { EditorContent, Node, mergeAttributes, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Quote, Redo2, Strikethrough, Undo2, Unlink,
} from 'lucide-react';
import { miscApi } from '../../services/index.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner } from '../ui/Bits.jsx';

/**
 * <figure><img/><figcaption/></figure> as a single atomic node, so images and
 * their captions travel together and render identically on the public site.
 */
const Figure = Node.create({
  name: 'figure',
  group: 'block',
  atom: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null }, alt: { default: '' }, caption: { default: '' } };
  },
  parseHTML() {
    return [
      {
        tag: 'figure',
        getAttrs: (el) => {
          const img = el.querySelector('img');
          if (!img) return false;
          return { src: img.getAttribute('src'), alt: img.getAttribute('alt') || '', caption: el.querySelector('figcaption')?.textContent || '' };
        },
      },
      { tag: 'img[src]', getAttrs: (el) => ({ src: el.getAttribute('src'), alt: el.getAttribute('alt') || '', caption: el.getAttribute('title') || '' }) },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption } = HTMLAttributes;
    const img = ['img', mergeAttributes({ src, alt, loading: 'lazy' })];
    return caption ? ['figure', { 'data-type': 'figure' }, img, ['figcaption', {}, caption]] : ['figure', { 'data-type': 'figure' }, img];
  },
  addCommands() {
    return {
      setFigure:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },
});

function ToolButton({ onClick, active, disabled, label, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`grid h-8 w-8 place-items-center transition-colors disabled:opacity-30 ${active ? 'bg-blood text-white' : 'text-ink-300 hover:bg-ink-600 hover:text-white'}`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange }) {
  const toast = useToast();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } }),
      Placeholder.configure({ placeholder: 'Start writing. Use H2 for section headings — they build the table of contents.' }),
      Figure,
    ],
    content: value || '',
    editorProps: { attributes: { class: 'article-body max-w-none', 'aria-label': 'Article body', role: 'textbox', 'aria-multiline': 'true' } },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
  });

  // Load content when an existing article arrives after the editor mounted.
  useEffect(() => {
    if (editor && value !== undefined && value !== editor.getHTML() && !editor.isFocused) {
      editor.commands.setContent(value || '', false);
    }
  }, [editor, value]);

  if (!editor) return <div className="h-[480px] border border-ink-500 bg-ink-800" />;

  const setLink = () => {
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Link URL (https://…)', prev);
    if (url === null) return;
    if (!url) return editor.chain().focus().extendMarkRange('link').unsetLink().run();
    if (!/^(https?:\/\/|mailto:|\/)/i.test(url)) return toast.error('Links must start with https://, mailto: or /');
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertImage = (src) => {
    const alt = window.prompt('Describe the image (alt text, for screen readers):', '') ?? '';
    const caption = window.prompt('Caption (optional):', '') ?? '';
    editor.chain().focus().setFigure({ src, alt, caption }).run();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await miscApi.upload(file);
      insertImage(data.url);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const onImageUrl = () => {
    const url = window.prompt('Image URL (https://…) — or cancel to upload a file instead', '');
    if (url === null) return fileRef.current?.click();
    if (!/^https?:\/\//i.test(url)) return toast.error('Image URLs must start with https://');
    insertImage(url);
  };

  const c = () => editor.chain().focus();

  return (
    <div className="border border-ink-500 bg-ink-800 focus-within:border-bone">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 border-b border-ink-500 bg-ink-800 p-1.5" role="toolbar" aria-label="Formatting">
        <ToolButton label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></ToolButton>
        <ToolButton label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></ToolButton>
        <span className="mx-1 h-5 w-px bg-ink-500" />
        <ToolButton label="Bold" active={editor.isActive('bold')} onClick={() => c().toggleBold().run()}><Bold className="h-4 w-4" /></ToolButton>
        <ToolButton label="Italic" active={editor.isActive('italic')} onClick={() => c().toggleItalic().run()}><Italic className="h-4 w-4" /></ToolButton>
        <ToolButton label="Strikethrough" active={editor.isActive('strike')} onClick={() => c().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></ToolButton>
        <span className="mx-1 h-5 w-px bg-ink-500" />
        <ToolButton label="Bullet list" active={editor.isActive('bulletList')} onClick={() => c().toggleBulletList().run()}><List className="h-4 w-4" /></ToolButton>
        <ToolButton label="Numbered list" active={editor.isActive('orderedList')} onClick={() => c().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></ToolButton>
        <ToolButton label="Pull quote" active={editor.isActive('blockquote')} onClick={() => c().toggleBlockquote().run()}><Quote className="h-4 w-4" /></ToolButton>
        <ToolButton label="Divider" onClick={() => c().setHorizontalRule().run()}><Minus className="h-4 w-4" /></ToolButton>
        <span className="mx-1 h-5 w-px bg-ink-500" />
        <ToolButton label="Add link" active={editor.isActive('link')} onClick={setLink}><Link2 className="h-4 w-4" /></ToolButton>
        <ToolButton label="Remove link" disabled={!editor.isActive('link')} onClick={() => c().unsetLink().run()}><Unlink className="h-4 w-4" /></ToolButton>
        <ToolButton label="Insert image with caption" onClick={onImageUrl} disabled={uploading}>
          {uploading ? <Spinner className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
        </ToolButton>
        <button type="button" onClick={() => fileRef.current?.click()} className="ml-1 px-2 text-xs font-semibold text-ink-300 hover:text-white" disabled={uploading}>
          Upload image
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <span className="ml-auto flex">
          <ToolButton label="Undo" disabled={!editor.can().undo()} onClick={() => c().undo().run()}><Undo2 className="h-4 w-4" /></ToolButton>
          <ToolButton label="Redo" disabled={!editor.can().redo()} onClick={() => c().redo().run()}><Redo2 className="h-4 w-4" /></ToolButton>
        </span>
      </div>
      <div className="editor-surface">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
