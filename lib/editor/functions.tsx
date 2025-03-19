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
  
  // Create a temporary container for rendering
  const tempContainer = document.createElement('div');
  
  if (containsHtml) {
    // For HTML content, just set it directly
    tempContainer.innerHTML = content;
  } else {
    try {
      // For regular markdown, render it through our Markdown component
      const stringFromMarkdown = renderToString(<Markdown>{content}</Markdown>);
      tempContainer.innerHTML = stringFromMarkdown;
      
      // Apply additional processing for markdown elements that might not be properly parsed
      enhanceMarkdownElements(tempContainer);
    } catch (error) {
      console.error('Error rendering markdown:', error);
      // Fallback to simpler processing if rendering fails
      tempContainer.innerHTML = content
        .split('\n')
        .map(line => {
          // Handle headings
          if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
          if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
          if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
          
          // Handle bold and italic
          let processedLine = line;
          processedLine = processedLine.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          processedLine = processedLine.replace(/\*(.*?)\*/g, '<em>$1</em>');
          
          // Handle links
          processedLine = processedLine.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
          
          // Default to paragraph
          return `<p>${processedLine}</p>`;
        })
        .join('');
    }
  }
  
  // Process and enhance any special content like visualizations
  processVisualizationElements(tempContainer);
  
  // Parse the container to create the document
  return parser.parse(tempContainer);
};

// Additional function to enhance markdown elements
function enhanceMarkdownElements(container: HTMLElement) {
  // Process text nodes directly to ensure Markdown syntax is properly parsed
  // even if the basic renderer missed some elements
  
  // Handle bold/strong
  ensureStrongElements(container);
  
  // Handle italics/emphasis
  ensureEmphasisElements(container);
  
  // Handle headings
  ensureHeadingElements(container);
  
  // Handle code blocks
  const preBlocks = container.querySelectorAll('pre');
  preBlocks.forEach(pre => {
    if (!pre.querySelector('code')) {
      const code = document.createElement('code');
      code.innerHTML = pre.innerHTML;
      pre.innerHTML = '';
      pre.appendChild(code);
      pre.className = 'language-text';
    }
  });
  
  // Handle inline code
  const textNodes = Array.from(container.querySelectorAll('*'))
    .filter(el => el.childNodes.length > 0)
    .flatMap(el => Array.from(el.childNodes))
    .filter(node => node.nodeType === document.TEXT_NODE);
    
  textNodes.forEach(node => {
    if (node.textContent?.includes('`') && node.parentElement) {
      const regex = /`([^`]+)`/g;
      node.parentElement.innerHTML = node.parentElement.innerHTML.replace(
        regex, 
        '<code>$1</code>'
      );
    }
  });
  
  // Handle lists
  const paragraphs = container.querySelectorAll('p');
  let ulElement: HTMLUListElement | null = null;
  let olElement: HTMLOListElement | null = null;
  
  paragraphs.forEach((p, index) => {
    const text = p.textContent || '';
    
    // Unordered list items
    if (text.match(/^\s*[\-\*]\s/)) {
      if (!ulElement) {
        ulElement = document.createElement('ul');
        p.parentNode?.insertBefore(ulElement, p);
      }
      
      const li = document.createElement('li');
      li.innerHTML = text.replace(/^\s*[\-\*]\s/, '');
      ulElement.appendChild(li);
      p.remove();
    } 
    // Ordered list items
    else if (text.match(/^\s*\d+\.\s/)) {
      if (!olElement) {
        olElement = document.createElement('ol');
        p.parentNode?.insertBefore(olElement, p);
      }
      
      const li = document.createElement('li');
      li.innerHTML = text.replace(/^\s*\d+\.\s/, '');
      olElement.appendChild(li);
      p.remove();
    }
    // Reset list elements when we encounter a non-list paragraph
    else {
      ulElement = null;
      olElement = null;
    }
  });
}

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
  try {
    // Use the markdown serializer to convert the document to markdown
    const markdown = defaultMarkdownSerializer.serialize(document);
    
    // Additional processing to ensure proper formatting
    return enhanceMarkdownOutput(markdown);
  } catch (error) {
    console.error('Error converting document to markdown:', error);
    // Fallback to basic serialization if the default serializer fails
    return defaultMarkdownSerializer.serialize(document);
  }
};

// Function to enhance the markdown output for better formatting
function enhanceMarkdownOutput(markdown: string): string {
  // Ensure proper line breaks between elements
  let enhancedMarkdown = markdown
    // Ensure headings have proper spacing
    .replace(/^(#{1,6}.*)/gm, '\n$1\n')
    // Ensure list items appear on their own lines
    .replace(/^(\s*[-*+])/gm, '\n$1')
    .replace(/^(\s*\d+\.)/gm, '\n$1')
    // Remove extra blank lines that might have been introduced
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper spacing around code blocks
    .replace(/```(.*?)```/gs, '\n```$1```\n');
  
  // Trim any leading/trailing whitespace
  enhancedMarkdown = enhancedMarkdown.trim();
  
  return enhancedMarkdown;
}

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
