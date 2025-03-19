'use client';

import { defaultMarkdownSerializer } from 'prosemirror-markdown';
import { DOMParser, Node } from 'prosemirror-model';
import { Decoration, DecorationSet, type EditorView } from 'prosemirror-view';
import { renderToString } from 'react-dom/server';

import { Markdown } from '@/components/markdown';

import { documentSchema } from './config';
import { createSuggestionWidget, type UISuggestion } from './suggestions';

export const buildDocumentFromContent = (content: string) => {
  // For content already containing HTML (like from a report), we need special handling
  const containsHtml = content.includes('<div') || 
                      content.includes('<img') || 
                      content.includes('<p');
  
  const parser = DOMParser.fromSchema(documentSchema);
  
  // Skip creating a temporary container and add content directly to the parser
  // This ensures all markdown styles are properly applied
  const tempContainer = document.createElement('div');
  
  if (containsHtml) {
    // For HTML content, just set it directly
    tempContainer.innerHTML = content;
  } else {
    // For regular markdown, render it through our Markdown component
    // Render markdown directly in the temporary container
    const stringFromMarkdown = renderToString(<Markdown>{content}</Markdown>);
    tempContainer.innerHTML = stringFromMarkdown;
  }
  
  // Process and enhance any special content like visualizations
  processVisualizationElements(tempContainer);
  
  // Parse the container to create the document
  return parser.parse(tempContainer);
};

// Helper function to process visualization elements
function processVisualizationElements(container: HTMLElement) {
  // Process report-visualization divs
  const visualizationDivs = container.querySelectorAll('.report-visualization');
  visualizationDivs.forEach(vizDiv => {
    // Add specific attributes and classes to make sure visualizations render correctly
    vizDiv.setAttribute('data-visualization', 'true');
    
    // Find any image elements inside the visualization container
    const imgElements = vizDiv.querySelectorAll('img');
    imgElements.forEach(img => {
      // Add appropriate attributes for prosemirror to handle
      img.classList.add('viz-image');
      
      // If img has a src that starts with '/api/visualization-image'
      if (img.getAttribute('src')?.startsWith('/api/visualization-image')) {
        // Ensure it has the proper data attributes
        const idMatch = img.getAttribute('src')?.match(/id=([^&]+)/);
        if (idMatch && idMatch[1]) {
          img.setAttribute('data-chart-id', idMatch[1]);
        }
      }
    });
  });
  
  // Process any markdown formatting that might need enhancement
  ensureStrongElements(container);
  ensureEmphasisElements(container);
  ensureHeadingElements(container);
}

// Helper to ensure proper strong (bold) elements
function ensureStrongElements(container: HTMLElement) {
  const textNodes = Array.from(container.querySelectorAll('*'))
    .filter(el => el.childNodes.length > 0)
    .flatMap(el => Array.from(el.childNodes))
    .filter(node => node.nodeType === document.TEXT_NODE);
  
  // Find text nodes with ** pattern and replace with proper <strong> elements
  textNodes.forEach(node => {
    if (node.textContent?.includes('**')) {
      const text = node.textContent;
      const parent = node.parentElement;
      if (parent) {
        const regex = /\*\*(.*?)\*\*/g;
        parent.innerHTML = parent.innerHTML.replace(
          regex, 
          '<strong>$1</strong>'
        );
      }
    }
  });
}

// Helper to ensure proper emphasis (italic) elements
function ensureEmphasisElements(container: HTMLElement) {
  const textNodes = Array.from(container.querySelectorAll('*'))
    .filter(el => el.childNodes.length > 0)
    .flatMap(el => Array.from(el.childNodes))
    .filter(node => node.nodeType === document.TEXT_NODE);
  
  // Find text nodes with * pattern and replace with proper <em> elements
  textNodes.forEach(node => {
    if (node.textContent?.includes('*') && !node.textContent?.includes('**')) {
      const text = node.textContent;
      const parent = node.parentElement;
      if (parent) {
        const regex = /\*([^*]+)\*/g;
        parent.innerHTML = parent.innerHTML.replace(
          regex, 
          '<em>$1</em>'
        );
      }
    }
  });
}

// Helper to ensure proper heading elements
function ensureHeadingElements(container: HTMLElement) {
  const paragraphs = container.querySelectorAll('p');
  
  paragraphs.forEach(p => {
    const text = p.textContent || '';
    if (text.startsWith('# ')) {
      // Convert to h1
      const h1 = document.createElement('h1');
      h1.textContent = text.substring(2);
      h1.className = 'text-3xl font-semibold mt-6 mb-2';
      p.replaceWith(h1);
    } else if (text.startsWith('## ')) {
      // Convert to h2
      const h2 = document.createElement('h2');
      h2.textContent = text.substring(3);
      h2.className = 'text-2xl font-semibold mt-6 mb-2';
      p.replaceWith(h2);
    } else if (text.startsWith('### ')) {
      // Convert to h3
      const h3 = document.createElement('h3');
      h3.textContent = text.substring(4);
      h3.className = 'text-xl font-semibold mt-6 mb-2';
      p.replaceWith(h3);
    }
  });
}

export const buildContentFromDocument = (document: Node) => {
  return defaultMarkdownSerializer.serialize(document);
};

export const createDecorations = (
  suggestions: Array<UISuggestion>,
  view: EditorView,
) => {
  const decorations: Array<Decoration> = [];

  for (const suggestion of suggestions) {
    decorations.push(
      Decoration.inline(
        suggestion.selectionStart,
        suggestion.selectionEnd,
        {
          class: 'suggestion-highlight',
        },
        {
          suggestionId: suggestion.id,
          type: 'highlight',
        },
      ),
    );

    decorations.push(
      Decoration.widget(
        suggestion.selectionStart,
        (view) => {
          const { dom } = createSuggestionWidget(suggestion, view);
          return dom;
        },
        {
          suggestionId: suggestion.id,
          type: 'widget',
        },
      ),
    );
  }

  return DecorationSet.create(view.state.doc, decorations);
};
