'use client';

import React, { useEffect, useState, useRef, forwardRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import './rich-text-editor.module.css';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import TextAlign from '@tiptap/extension-text-align';
import Youtube from '@tiptap/extension-youtube';
import { Highlight } from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import DOMPurify from 'dompurify';
import { PdfEmbed } from '../tiptap-extensions/PdfEmbed';
import { ResizableImage } from '../tiptap-extensions/ResizableImage';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../overlay/dialog';
import { Button } from '../overlay/button';
import { Input } from './input';
import { Label } from './label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from './select';
import {
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../navigation/dropdown-menu';
import { cn } from '@/shared/utils/cn';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code as CodeIcon,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Undo,
  Redo,
  FileText,
  Video,
  Eraser,
  TableIcon,
  Plus,
  Trash2,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  ListTodo,
} from 'lucide-react';

export interface RichTextEditorProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  toolbarOptions?: Partial<{
    heading: boolean;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    code: boolean;
    codeBlock: boolean;
    bulletList: boolean;
    orderedList: boolean;
    taskList: boolean;
    blockquote: boolean;
    horizontalRule: boolean;
    textAlign: boolean;
    link: boolean;
    image: boolean;
    video: boolean;
    pdf: boolean;
    undo: boolean;
    redo: boolean;
    fontFamily: boolean;
    textColor: boolean;
    highlight: boolean;
    subscript: boolean;
    superscript: boolean;
    table: boolean;
  }>;
}

const defaultToolbarOptions = {
  heading: true,
  bold: true,
  italic: true,
  underline: true,
  strikethrough: true,
  code: true,
  codeBlock: true,
  bulletList: true,
  orderedList: true,
  taskList: true,
  blockquote: true,
  horizontalRule: true,
  textAlign: true,
  link: true,
  image: true,
  video: true,
  pdf: true,
  undo: true,
  redo: true,
  fontFamily: true,
  textColor: true,
  highlight: true,
  subscript: true,
  superscript: true,
  table: true,
};

export const RichTextEditor = React.memo(forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({
    value = '',
    onChange,
    placeholder,
    className,
    toolbarOptions,
    ...props
  }, ref) => {
    const opts = { ...defaultToolbarOptions, ...(toolbarOptions || {}) };
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [showImageModal, setShowImageModal] = useState(false);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const [linkText, setLinkText] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imageFileName, setImageFileName] = useState<string | null>(null);
    const [imageWidth, setImageWidth] = useState<string>('');
    const [imageAlign, setImageAlign] = useState<'left' | 'center' | 'right'>('center');
    const [videoUrl, setVideoUrl] = useState('');
    const [videoWidth, setVideoWidth] = useState<string>('640');
    const [pdfUrl, setPdfUrl] = useState('');
    const [textColor, setTextColor] = useState<string>('#000000');
    const [highlightColor, setHighlightColor] = useState<string>('#fef08a');
    const [rows, setRows] = useState<string>('3');
    const [cols, setCols] = useState<string>('3');
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const debounceTimerRef = useRef<any>(null);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          code: false,
          codeBlock: false,
          blockquote: false,
          horizontalRule: false,
          bulletList: {},
          orderedList: {},
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-blue-600 underline hover:text-blue-800',
          },
        }),
        ResizableImage.configure({
          inline: false,
          allowBase64: true,
          HTMLAttributes: {
            class: 'resizable-image',
          },
        }),
        Underline,
        Code,
        CodeBlock,
        Blockquote,
        HorizontalRule,
        TextAlign.configure({ types: ['heading', 'paragraph', 'bulletList', 'orderedList'] }),
        Youtube.configure({
          controls: true,
          nocookie: true,
          inline: false,
          HTMLAttributes: {
            class: 'youtube-embed',
          },
        }),
        PdfEmbed,
        Highlight.configure({ multicolor: true }),
        TextStyle,
        Color,
        FontFamily,
        Table.configure({
          resizable: true,
          HTMLAttributes: {
            class: 'border-collapse table-auto border border-gray-300',
          },
        }),
        TableRow,
        TableHeader,
        TableCell,
        Subscript,
        Superscript,
        TaskList.configure({
          HTMLAttributes: {
            class: 'not-prose pl-2',
          },
        }),
        TaskItem.configure({
          HTMLAttributes: {
            class: 'flex gap-2',
          },
          nested: true,
        }),
      ],
      immediatelyRender: false,
      content: value || '',
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        
        // Update local selection state immediately for UI responsiveness
        const currentColor = editor.getAttributes('textStyle').color || '#000000';
        if (textColor !== currentColor) setTextColor(currentColor);

        // Debounce the parent onChange call
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        
        debounceTimerRef.current = setTimeout(() => {
          const sanitized = DOMPurify.sanitize(html, {
            ADD_TAGS: ['iframe', 'video', 'source', 'table', 'tbody', 'thead', 'tr', 'td', 'th', 'input'],
            ADD_ATTR: [
              'allow',
              'allowfullscreen',
              'frameborder',
              'scrolling',
              'controls',
              'width',
              'height',
              'src',
              'data-youtube-video',
              'data-type',
              'style',
              'colspan',
              'rowspan',
              'type',
              'checked',
              'disabled',
            ],
          });
          onChange?.(sanitized);
        }, 150);
      },
      onSelectionUpdate: ({ editor }) => {
        const currentColor = editor.getAttributes('textStyle').color || '#000000';
        setTextColor(currentColor);
      },
      editorProps: {
        attributes: {
          class: 'prose dark:prose-invert max-w-none focus:outline-none',
          placeholder: placeholder || '',
          tabIndex: '0',
          role: 'textbox',
        },
      },
    });

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      };
    }, []);

    // Only update content if it's externally changed and not by the user typing
    useEffect(() => {
      if (editor && value !== editor.getHTML() && !editor.isFocused) {
        editor.commands.setContent(value || '', { emitUpdate: false });
      }
    }, [editor, value]);

    function execAndTick(action: () => void) {
      try {
        action();
      } catch {
        // ignore
      }
    }

    function openLinkModal() {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, '');
      const existingLink = editor.getAttributes('link').href || '';
      setLinkText(selectedText || '');
      setLinkUrl(existingLink);
      setShowLinkModal(true);
    }

    function submitLink() {
      if (!linkUrl) return setShowLinkModal(false);
      if (!editor) return;

      if (linkText && linkText.trim()) {
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        const { from, to } = editor.state.selection;
        if (from !== to) {
          editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        } else {
          editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
        }
      }

      setShowLinkModal(false);
      setLinkText('');
      setLinkUrl('');
    }

    function openImageModal() {
      setImageUrl('');
      setImageFileName(null);
      setImageWidth('');
      setImageAlign('center');
      setShowImageModal(true);
    }

    function handleImageUrlInsert() {
      if (!imageUrl) return setShowImageModal(false);
      const attrs: any = { src: imageUrl, align: imageAlign };
      if (imageWidth) {
        attrs.width = imageWidth;
      }
      editor?.chain().focus().setImage(attrs).run();
      setShowImageModal(false);
    }

    function handleLocalFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string | ArrayBuffer | null;
        if (typeof result === 'string') {
          editor?.chain().focus().setImage({ src: result }).run();
        }
      };
      reader.readAsDataURL(file);
      setShowImageModal(false);
    }

    function openVideoModal() {
      setVideoUrl('');
      setVideoWidth('640');
      setShowVideoModal(true);
    }

    function submitVideo() {
      if (!videoUrl) return setShowVideoModal(false);

      const width = parseInt(videoWidth) || 640;
      const height = Math.round((width * 9) / 16);

      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        editor?.commands.setYoutubeVideo({
          src: videoUrl,
          width: width,
          height: height,
        });
      } else {
        editor
          ?.chain()
          .focus()
          .insertContent(
            `<video controls width="${width}" height="${height}"><source src="${videoUrl}" />Your browser does not support the video tag.</video>`
          )
          .run();
      }

      setShowVideoModal(false);
      setVideoUrl('');
    }

    function openPdfModal() {
      setPdfUrl('');
      setShowPdfModal(true);
    }

    function submitPdf() {
      if (!pdfUrl) return setShowPdfModal(false);

      const embedUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
      editor?.commands.setPdfEmbed({ src: embedUrl });

      setShowPdfModal(false);
      setPdfUrl('');
    }

    function insertTable() {
      const numRows = parseInt(rows) || 3;
      const numCols = parseInt(cols) || 3;
      if (!editor) return;
      editor.commands.insertTable({ rows: numRows, cols: numCols, withHeaderRow: true });
      setRows('3');
      setCols('3');
    }

    if (!editor) {
      return null;
    }

    return (
      <div ref={ref} className={cn("rounded-xl overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm", className)} {...props}>

        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-2 flex flex-wrap gap-1 items-center overflow-x-auto">
          {opts.undo && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().undo().run())}
              disabled={!editor.can().undo()}
              title="Undo"
            >
              <Undo className="h-4 w-4 text-slate-500" />
            </Button>
          )}
          {opts.redo && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().redo().run())}
              disabled={!editor.can().redo()}
              title="Redo"
            >
              <Redo className="h-4 w-4 text-slate-500" />
            </Button>
          )}

          {opts.heading && (
            <>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
              <Select
                value={
                  editor.isActive('heading', { level: 1 })
                    ? 'h1'
                    : editor.isActive('heading', { level: 2 })
                      ? 'h2'
                      : editor.isActive('heading', { level: 3 })
                        ? 'h3'
                        : 'p'
                }
                onValueChange={(value) => {
                  if (value === 'p') {
                    editor.chain().focus().setParagraph().run();
                  } else {
                    const level = parseInt(value.substring(1)) as 1 | 2 | 3;
                    editor.chain().focus().toggleHeading({ level }).run();
                  }
                }}
              >
                <SelectTrigger className="h-8 w-[110px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p">Paragraph</SelectItem>
                  <SelectItem value="h1">Heading 1</SelectItem>
                  <SelectItem value="h2">Heading 2</SelectItem>
                  <SelectItem value="h3">Heading 3</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          {opts.bold && (
            <Button
              variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().toggleBold().run())}
              title="Bold"
            >
              <Bold className={cn("h-4 w-4", editor.isActive('bold') ? "text-primary-600 dark:text-primary-400" : "text-slate-500")} />
            </Button>
          )}
          {opts.italic && (
            <Button
              variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().toggleItalic().run())}
              title="Italic"
            >
              <Italic className={cn("h-4 w-4", editor.isActive('italic') ? "text-primary-600 dark:text-primary-400" : "text-slate-500")} />
            </Button>
          )}
          {opts.underline && (
            <Button
              variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().toggleUnderline().run())}
              title="Underline"
            >
              <UnderlineIcon className={cn("h-4 w-4", editor.isActive('underline') ? "text-primary-600 dark:text-primary-400" : "text-slate-500")} />
            </Button>
          )}
          {opts.strikethrough && (
            <Button
              variant={editor.isActive('strike') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().toggleStrike().run())}
              title="Strikethrough"
            >
              <Strikethrough className={cn("h-4 w-4", editor.isActive('strike') ? "text-primary-600 dark:text-primary-400" : "text-slate-500")} />
            </Button>
          )}
          
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          {opts.bulletList && (
            <Button
              variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().toggleBulletList().run())}
              title="Bullet List"
            >
              <List className={cn("h-4 w-4", editor.isActive('bulletList') ? "text-primary-600 dark:text-primary-400" : "text-slate-500")} />
            </Button>
          )}
          {opts.orderedList && (
            <Button
              variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => execAndTick(() => editor.chain().focus().toggleOrderedList().run())}
              title="Ordered List"
            >
              <ListOrdered className={cn("h-4 w-4", editor.isActive('orderedList') ? "text-primary-600 dark:text-primary-400" : "text-slate-500")} />
            </Button>
          )}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          {opts.textAlign && (
            <div className="flex gap-0.5">
              <Button
                variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execAndTick(() => editor.chain().focus().setTextAlign('left').run())}
                title="Align Left"
              >
                <AlignLeft className="h-4 w-4 text-slate-500" />
              </Button>
              <Button
                variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execAndTick(() => editor.chain().focus().setTextAlign('center').run())}
                title="Align Center"
              >
                <AlignCenter className="h-4 w-4 text-slate-500" />
              </Button>
              <Button
                variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => execAndTick(() => editor.chain().focus().setTextAlign('right').run())}
                title="Align Right"
              >
                <AlignRight className="h-4 w-4 text-slate-500" />
              </Button>
            </div>
          )}

          <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />

          {opts.link && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={openLinkModal}
              title="Insert Link"
            >
              <LinkIcon className="h-4 w-4 text-slate-500" />
            </Button>
          )}
          {opts.image && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={openImageModal}
              title="Insert Image"
            >
              <ImageIcon className="h-4 w-4 text-slate-500" />
            </Button>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 min-h-[200px]" onClick={() => editor.chain().focus().run()}>
          <EditorContent editor={editor} className="prose dark:prose-invert max-w-none" />
        </div>

        <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Link</DialogTitle>
              <DialogDescription>Add a link to your content</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Link Text (optional)</Label>
                <Input
                  placeholder="Click here"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>
              <div>
                <Label>URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLinkModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitLink}>Insert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Image</DialogTitle>
              <DialogDescription>Add an image to your content</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Image URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Width (px)</Label>
                  <Input
                    placeholder="400"
                    value={imageWidth}
                    onChange={(e) => setImageWidth(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Position</Label>
                  <Select value={imageAlign} onValueChange={(value) => setImageAlign(value as 'left' | 'center' | 'right')}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Upload from device</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLocalFileSelect}
                  className="w-full"
                />
                {imageFileName && <p className="text-sm text-gray-600 mt-2">Selected: {imageFileName}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImageModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleImageUrlInsert}>Insert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showVideoModal} onOpenChange={setShowVideoModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert Video</DialogTitle>
              <DialogDescription>Add a YouTube or video URL</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Video URL</Label>
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=... or https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                />
              </div>
              <div>
                <Label>Width (px)</Label>
                <Input
                  placeholder="640"
                  value={videoWidth}
                  onChange={(e) => setVideoWidth(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowVideoModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitVideo}>Insert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Insert PDF</DialogTitle>
              <DialogDescription>Embed a PDF document</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>PDF URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/document.pdf"
                  value={pdfUrl}
                  onChange={(e) => setPdfUrl(e.target.value)}
                />
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-800">
                <strong>Note:</strong> PDF must be publicly accessible without login.
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPdfModal(false)}>
                Cancel
              </Button>
              <Button onClick={submitPdf}>Insert</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
));

RichTextEditor.displayName = 'RichTextEditor';
