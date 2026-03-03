/**
 * MagMark 2.0 - Editor Component
 * Two-panel WYSIWYG + Source editor with Tiptap
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';

import { MagazineNodes } from '../extensions/magazine-nodes';
import { CJKSpacers } from '../extensions/cjk-spacers';
import { PageBreakControls } from '../extensions/page-break-controls';
import { useBaselineGrid } from '../hooks/use-baseline-grid';

import './Editor.css';

export interface EditorProps {
  /** Initial content */
  content?: string;
  /** On change callback */
  onChange?: (content: { html: string; markdown: string }) => void;
  /** Editor mode */
  mode?: 'wysiwyg' | 'source' | 'split';
  /** Platform target */
  platform?: 'xiaohongshu' | 'wechat' | 'pdf' | 'web';
  /** Show baseline grid */
  showBaselineGrid?: boolean;
  /** Enable CJK spacing */
  autoSpaceCjk?: boolean;
  /** Read only mode */
  readOnly?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Toolbar component
 */
const Toolbar: React.FC<{ editor: any }> = ({ editor }) => {
  if (!editor) return null;

  const buttonClass = (isActive: boolean) => 
    `mm-toolbar-btn ${isActive ? 'mm-toolbar-btn--active' : ''}`;

  return (
    <div className="mm-toolbar">
      <div className="mm-toolbar-group">
        <button
          className={buttonClass(editor.isActive('heading', { level: 1 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          title="Heading 1"
        >
          H1
        </button>
        <button
          className={buttonClass(editor.isActive('heading', { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          title="Heading 2"
        >
          H2
        </button>
        <button
          className={buttonClass(editor.isActive('heading', { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          title="Heading 3"
        >
          H3
        </button>
      </div>

      <div className="mm-toolbar-divider" />

      <div className="mm-toolbar-group">
        <button
          className={buttonClass(editor.isActive('bold'))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={buttonClass(editor.isActive('italic'))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={buttonClass(editor.isActive('strike'))}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
      </div>

      <div className="mm-toolbar-divider" />

      <div className="mm-toolbar-group">
        <button
          className={buttonClass(editor.isActive('bulletList'))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Bullet List"
        >
          • List
        </button>
        <button
          className={buttonClass(editor.isActive('orderedList'))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Numbered List"
        >
          1. List
        </button>
        <button
          className={buttonClass(editor.isActive('blockquote'))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          title="Quote"
        >
          "Quote"
        </button>
      </div>

      <div className="mm-toolbar-divider" />

      <div className="mm-toolbar-group">
        <button
          onClick={() => editor.chain().focus().insertPageBreak().run()}
          title="Insert Page Break"
        >
          ↧ Page Break
        </button>
        <button
          onClick={() => editor.chain().focus().insertPullQuote().run()}
          title="Insert Pull Quote"
        >
          ❝ Pull Quote
        </button>
      </div>
    </div>
  );
};

/**
 * Source editor component
 */
const SourceEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
}> = ({ value, onChange }) => {
  return (
    <textarea
      className="mm-source-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      spellCheck={false}
    />
  );
};

/**
 * Main Editor component
 */
export const Editor: React.FC<EditorProps> = ({
  content = '',
  onChange,
  mode = 'split',
  platform = 'web',
  showBaselineGrid: initialShowGrid = false,
  autoSpaceCjk = true,
  readOnly = false,
  placeholder = 'Start writing your magazine content...',
}) => {
  const [editorMode, setEditorMode] = useState(mode);
  const [markdownContent, setMarkdownContent] = useState(content);
  
  const baselineGrid = useBaselineGrid({
    visible: initialShowGrid,
    baselineStep: 8,
    lineHeight: 1.75,
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Typography,
      MagazineNodes,
      CJKSpacers.configure({
        enabled: autoSpaceCjk,
      }),
      PageBreakControls.configure({
        showVisualIndicators: true,
        allowDragAdjust: true,
      }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Simple markdown conversion (in production, use a proper converter)
      const markdown = htmlToMarkdown(html);
      setMarkdownContent(markdown);
      onChange?.({ html, markdown });
    },
  });

  // Sync external content changes
  useEffect(() => {
    if (editor && content !== markdownContent) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle source editor changes
  const handleSourceChange = useCallback((newMarkdown: string) => {
    setMarkdownContent(newMarkdown);
    if (editor) {
      // Convert markdown to HTML (simplified)
      const html = markdownToHtml(newMarkdown);
      editor.commands.setContent(html);
    }
    onChange?.({ html: editor?.getHTML() || '', markdown: newMarkdown });
  }, [editor, onChange]);

  // Simple markdown to HTML converter (placeholder - use proper library in production)
  function markdownToHtml(md: string): string {
    return md
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/\n/gim, '<br />');
  }

  // Simple HTML to markdown converter (placeholder)
  function htmlToMarkdown(html: string): string {
    return html
      .replace(/<h1>(.*?)<\/h1>/gim, '# $1')
      .replace(/<h2>(.*?)<\/h2>/gim, '## $1')
      .replace(/<h3>(.*?)<\/h3>/gim, '### $1')
      .replace(/<strong>(.*?)<\/strong>/gim, '**$1**')
      .replace(/<em>(.*?)<\/em>/gim, '*$1*')
      .replace(/<br \/>/gim, '\n');
  }

  return (
    <div className="mm-editor-container">
      {/* Mode Switcher */}
      <div className="mm-mode-switcher">
        <button
          className={editorMode === 'wysiwyg' ? 'mm-mode-btn--active' : ''}
          onClick={() => setEditorMode('wysiwyg')}
        >
          Visual
        </button>
        <button
          className={editorMode === 'source' ? 'mm-mode-btn--active' : ''}
          onClick={() => setEditorMode('source')}
        >
          Source
        </button>
        <button
          className={editorMode === 'split' ? 'mm-mode-btn--active' : ''}
          onClick={() => setEditorMode('split')}
        >
          Split
        </button>
        <button
          className={baselineGrid.visible ? 'mm-mode-btn--active' : ''}
          onClick={baselineGrid.toggle}
          title="Toggle Baseline Grid"
        >
          Grid
        </button>
      </div>

      <Toolbar editor={editor} />

      {/* Editor Panels */}
      <div className="mm-editor-panels">
        {/* WYSIWYG Panel */}
        {(editorMode === 'wysiwyg' || editorMode === 'split') && (
          <div className="mm-wysiwyg-panel">
            <div className="mm-editor-wrapper" style={{ position: 'relative' }}>
              <EditorContent editor={editor} className="mm-editor" />
              {baselineGrid.visible && (
                <div 
                  className="mm-baseline-grid-overlay"
                  style={baselineGrid.getGridStyle()}
                />
              )}
            </div>
          </div>
        )}

        {/* Source Panel */}
        {(editorMode === 'source' || editorMode === 'split') && (
          <div className="mm-source-panel">
            <SourceEditor
              value={markdownContent}
              onChange={handleSourceChange}
            />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mm-status-bar">
        <span className="mm-status-item">
          {editor?.storage.characterCount?.characters() || 0} characters
        </span>
        <span className="mm-status-item">
          {editor?.storage.characterCount?.words() || 0} words
        </span>
        <span className="mm-status-item">
          Platform: {platform}
        </span>
        <span className="mm-status-item">
          Grid: {baselineGrid.visible ? 'On' : 'Off'}
        </span>
      </div>
    </div>
  );
};

export default Editor;
