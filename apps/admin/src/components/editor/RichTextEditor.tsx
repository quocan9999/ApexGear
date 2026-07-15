import { useEffect } from 'react';
import Image from '@tiptap/extension-image';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  disabled?: boolean;
  'aria-label'?: string;
}

export function RichTextEditor({
  value,
  onChange,
  className,
  disabled = false,
  'aria-label': ariaLabel,
}: RichTextEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor: current }) => {
      onChange(current.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'product-description min-h-[160px] px-md py-sm focus:outline-none',
        ...(ariaLabel ? { 'aria-label': ariaLabel } : {}),
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || '';
    if (current !== next) {
      editor.commands.setContent(next, false);
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className={cn(
          'min-h-[200px] rounded border border-outline-variant bg-surface-container-lowest',
          className,
        )}
        role="status"
      >
        {t('common.loading')}
      </div>
    );
  }

  const toolbarBtn =
    'rounded px-2 py-1 label-sm text-on-surface hover:bg-surface-container disabled:opacity-50';

  return (
    <div
      className={cn(
        'overflow-hidden rounded border border-outline-variant bg-surface-container-lowest',
        className,
      )}
    >
      <div className="flex flex-wrap gap-xs border-b border-outline-variant bg-surface-container-low px-sm py-sm">
        <button
          type="button"
          className={toolbarBtn}
          disabled={disabled}
          aria-label={t('editor.bold')}
          aria-pressed={editor.isActive('bold')}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          B
        </button>
        <button
          type="button"
          className={toolbarBtn}
          disabled={disabled}
          aria-label={t('editor.italic')}
          aria-pressed={editor.isActive('italic')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          I
        </button>
        <button
          type="button"
          className={toolbarBtn}
          disabled={disabled}
          aria-label={t('editor.heading')}
          aria-pressed={editor.isActive('heading', { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </button>
        <button
          type="button"
          className={toolbarBtn}
          disabled={disabled}
          aria-label={t('editor.bulletList')}
          aria-pressed={editor.isActive('bulletList')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </button>
        <button
          type="button"
          className={toolbarBtn}
          disabled={disabled}
          aria-label={t('editor.orderedList')}
          aria-pressed={editor.isActive('orderedList')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </button>
        <button
          type="button"
          className={toolbarBtn}
          disabled={disabled}
          aria-label={t('editor.image')}
          onClick={() => {
            const url = window.prompt(t('editor.imagePrompt'));
            if (url?.trim()) {
              editor.chain().focus().setImage({ src: url.trim() }).run();
            }
          }}
        >
          Img
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export default RichTextEditor;
