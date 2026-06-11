import { Node, mergeAttributes } from '@tiptap/core';

export interface PdfEmbedOptions {
  inline: boolean;
  allowFullscreen: boolean;
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pdfEmbed: {
      setPdfEmbed: (options: { src: string }) => ReturnType;
    };
  }
}

export const PdfEmbed = Node.create<PdfEmbedOptions>({
  name: 'pdfEmbed',

  addOptions() {
    return {
      inline: false,
      allowFullscreen: true,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? 'inline' : 'block';
  },

  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: '100%',
        renderHTML: (attributes) => {
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: '600px',
        renderHTML: (attributes) => {
          return {
            height: attributes.height,
          };
        },
      },
      align: {
        default: 'center',
        renderHTML: (attributes) => {
          return {
            'data-align': attributes.align,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pdf-embed"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(
        {
          'data-type': 'pdf-embed',
          class: 'pdf-embed-container',
        },
        this.options.HTMLAttributes,
        HTMLAttributes
      ),
      [
        'iframe',
        {
          src: HTMLAttributes.src,
          width: HTMLAttributes.width || '100%',
          height: HTMLAttributes.height || '600px',
          frameborder: '0',
          allowfullscreen: this.options.allowFullscreen,
        },
      ],
    ];
  },

  addCommands() {
    return {
      setPdfEmbed:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              src: options.src,
            },
          });
        },
    };
  },
});
