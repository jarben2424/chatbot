import Link from 'next/link';
import React, { memo, useEffect } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from './code-block';

const components: Partial<Components> = {
  // @ts-expect-error
  code: CodeBlock,
  pre: ({ children }) => <>{children}</>,
  ol: ({ node, children, ...props }) => {
    return (
      <ol className="list-decimal list-outside ml-4 my-2" {...props}>
        {children}
      </ol>
    );
  },
  li: ({ node, children, ...props }) => {
    return (
      <li className="py-1" {...props}>
        {children}
      </li>
    );
  },
  ul: ({ node, children, ...props }) => {
    return (
      <ul className="list-disc list-outside ml-4 my-2" {...props}>
        {children}
      </ul>
    );
  },
  strong: ({ node, children, ...props }) => {
    return (
      <span className="font-semibold" {...props}>
        {children}
      </span>
    );
  },
  a: ({ node, children, ...props }) => {
    return (
      // @ts-expect-error
      <Link
        className="text-blue-500 hover:underline"
        target="_blank"
        rel="noreferrer"
        {...props}
      >
        {children}
      </Link>
    );
  },
  h1: ({ node, children, ...props }) => {
    return (
      <h1 className="text-3xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h1>
    );
  },
  h2: ({ node, children, ...props }) => {
    return (
      <h2 className="text-2xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h2>
    );
  },
  h3: ({ node, children, ...props }) => {
    return (
      <h3 className="text-xl font-semibold mt-6 mb-2" {...props}>
        {children}
      </h3>
    );
  },
  h4: ({ node, children, ...props }) => {
    return (
      <h4 className="text-lg font-semibold mt-6 mb-2" {...props}>
        {children}
      </h4>
    );
  },
  h5: ({ node, children, ...props }) => {
    return (
      <h5 className="text-base font-semibold mt-6 mb-2" {...props}>
        {children}
      </h5>
    );
  },
  h6: ({ node, children, ...props }) => {
    return (
      <h6 className="text-sm font-semibold mt-6 mb-2" {...props}>
        {children}
      </h6>
    );
  },
  p: ({ node, children, ...props }) => {
    return (
      <p className="my-2 text-base" {...props}>
        {children}
      </p>
    );
  },
  blockquote: ({ node, children, ...props }) => {
    return (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3 text-gray-700" {...props}>
        {children}
      </blockquote>
    );
  },
  table: ({ node, children, ...props }) => {
    return (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border-collapse border border-gray-300" {...props}>
          {children}
        </table>
      </div>
    );
  },
  thead: ({ node, children, ...props }) => {
    return (
      <thead className="bg-gray-100" {...props}>
        {children}
      </thead>
    );
  },
  tbody: ({ node, children, ...props }) => {
    return (
      <tbody className="divide-y divide-gray-300" {...props}>
        {children}
      </tbody>
    );
  },
  tr: ({ node, children, ...props }) => {
    return (
      <tr className="hover:bg-gray-50" {...props}>
        {children}
      </tr>
    );
  },
  th: ({ node, children, ...props }) => {
    return (
      <th className="px-3 py-2 text-left font-medium text-gray-700 border border-gray-300" {...props}>
        {children}
      </th>
    );
  },
  td: ({ node, children, ...props }) => {
    return (
      <td className="px-3 py-2 border border-gray-300" {...props}>
        {children}
      </td>
    );
  },
  // Handle embedded visualization divs
  div: ({ node, children, className, ...props }) => {
    // Special handling for report visualizations
    if (className?.includes('report-visualization')) {
      return (
        <div className="report-visualization my-6 border border-gray-200 rounded-lg overflow-hidden shadow-md" data-type="visualization" {...props}>
          {children}
        </div>
      );
    }
    // Visualization container
    if (className?.includes('visualization-container')) {
      return (
        <div className="visualization-container bg-gray-50 p-4 flex justify-center" {...props}>
          {children}
        </div>
      );
    }
    // Default div
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  },
  img: ({ node, src, alt, ...props }) => {
    // Check if this is a visualization image
    if (src?.includes('/api/visualization-image')) {
      return (
        <img 
          src={src} 
          alt={alt || 'Visualization'} 
          className="viz-image max-w-full h-auto" 
          data-type="visualization-image"
          {...props} 
        />
      );
    }
    // Default image
    return (
      <img 
        src={src} 
        alt={alt || ''} 
        className="max-w-full h-auto my-2 rounded"
        {...props} 
      />
    );
  }
};

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  // Add debugging to log markdown content
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const hasMarkdown = children.includes('#') || 
                         children.includes('**') || 
                         children.includes('- ');
      
      if (hasMarkdown) {
        console.debug('Rendering markdown content:', children.substring(0, 100) + '...');
      } else {
        console.debug('Content doesn\'t contain markdown markers');
      }
    }
  }, [children]);

  // Return null for empty content
  if (!children || children.trim() === '') {
    return null;
  }

  return (
    <div className="markdown-wrapper">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
