
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import { formatContentForDisplay } from '@/utils/contentFormatters';

export type ContentType = 'lld' | 'code' | 'tests' | 'testcases';

interface ContentDisplayProps {
  content: string | undefined | null;
  contentType: ContentType;
}

const ContentDisplay: React.FC<ContentDisplayProps> = ({ content, contentType }) => {
  if (!content) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="mb-2">No {contentType.toUpperCase()} content available</p>
        <p className="text-sm">Use the generate button above to create content</p>
      </div>
    );
  }

  const formattedContent = formatContentForDisplay(content);

  return (
    <div className="markdown-content">
      <ReactMarkdown
        children={formattedContent}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeHighlight, { ignoreMissing: true }]]}
        components={{
          // Override components for better styling
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold border-b pb-2 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold border-b pb-2 mt-6 mb-4" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-semibold mt-5 mb-3" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-base font-semibold mt-4 mb-2" {...props} />,
          
          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
          
          a: ({ node, ...props }) => (
            <a 
              className="text-blue-600 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer" 
              {...props} 
            />
          ),
          
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 py-1 my-4 text-gray-700" {...props} />
          ),
          
          pre: ({ node, ...props }) => <pre className="bg-gray-50 p-4 rounded-md overflow-x-auto mb-4" {...props} />,
          
          code: ({ node, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '');
            return (
              <code
                className={match ? className : 'text-gray-800 bg-gray-100 px-1 py-0.5 rounded text-sm'}
                {...props}
              >
                {children}
              </code>
            );
          },
          
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full border border-gray-300 divide-y divide-gray-300" {...props} />
            </div>
          ),
          
          thead: ({ node, ...props }) => <thead className="bg-gray-50" {...props} />,
          
          th: ({ node, ...props }) => (
            <th className="py-3 px-4 text-sm font-semibold text-left text-gray-900 border-r last:border-r-0" {...props} />
          ),
          
          td: ({ node, ...props }) => (
            <td className="py-2 px-4 text-sm text-gray-900 border-r last:border-r-0" {...props} />
          ),
          
          tr: ({ node, ...props }) => <tr className="border-b last:border-b-0" {...props} />,
          
          img: ({ node, ...props }) => (
            <img className="max-w-full h-auto my-4 rounded-md" {...props} alt={props.alt || 'Image'} />
          ),
          
          hr: ({ node, ...props }) => <hr className="my-6 border-t border-gray-300" {...props} />,
        }}
      />
    </div>
  );
};

export default ContentDisplay;
