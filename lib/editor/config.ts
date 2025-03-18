import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { Schema, NodeSpec } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import type { Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { MutableRefObject } from 'react';

import { buildContentFromDocument } from './functions';

// Add custom nodes including image support
const nodes = addListNodes(schema.spec.nodes, 'paragraph block*', 'block');

// Enhance the image node specification
const imageNodeSpec: NodeSpec = {
  inline: true,
  attrs: {
    src: { default: '' },
    alt: { default: null },
    title: { default: null },
    width: { default: null },
    height: { default: null },
    chartId: { default: null }, // For linking to visualization artifacts
  },
  group: 'inline',
  draggable: true,
  parseDOM: [
    {
      tag: 'img[src]',
      getAttrs(dom) {
        if (!(dom instanceof HTMLElement)) return {};
        return {
          src: dom.getAttribute('src'),
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title'),
          width: dom.getAttribute('width'),
          height: dom.getAttribute('height'),
          chartId: dom.getAttribute('data-chart-id'),
        };
      },
    },
  ],
  toDOM(node) {
    const { src, alt, title, width, height, chartId } = node.attrs;
    return [
      'img',
      {
        src,
        alt: alt || '',
        title: title || '',
        width: width || '',
        height: height || '',
        'data-chart-id': chartId || '',
        class: chartId ? 'embedded-chart' : '',
      },
    ];
  },
};

// Create enhanced schema with custom image node
nodes.addToEnd('image', imageNodeSpec);

export const documentSchema = new Schema({
  nodes,
  marks: schema.spec.marks,
});

export function headingRule(level: number) {
  return textblockTypeInputRule(
    new RegExp(`^(#{1,${level}})\\s$`),
    documentSchema.nodes.heading,
    () => ({ level }),
  );
}

export const handleTransaction = ({
  transaction,
  editorRef,
  onSaveContent,
}: {
  transaction: Transaction;
  editorRef: MutableRefObject<EditorView | null>;
  onSaveContent: (updatedContent: string, debounce: boolean) => void;
}) => {
  if (!editorRef || !editorRef.current) return;

  const newState = editorRef.current.state.apply(transaction);
  editorRef.current.updateState(newState);

  if (transaction.docChanged && !transaction.getMeta('no-save')) {
    const updatedContent = buildContentFromDocument(newState.doc);

    if (transaction.getMeta('no-debounce')) {
      onSaveContent(updatedContent, false);
    } else {
      onSaveContent(updatedContent, true);
    }
  }
};
